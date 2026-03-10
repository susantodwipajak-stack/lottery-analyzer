#!/usr/bin/env node
/**
 * 📊 足彩推荐方案比对 + 模型自动进化脚本
 * 
 * 功能:
 *   1. 拉取已完赛的比赛结果
 *   2. 将推荐方案与实际结果比对
 *   3. 计算命中率统计
 *   4. 自动修正模型参数（表现好的策略加权，差的减权）
 * 
 * 运行: node scripts/compare-fb-results.js
 * 触发: GitHub Actions 每天 21:30 (UTC 13:30)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PICKS_DIR = path.join(DATA_DIR, 'fb-picks');
const PARAMS_FILE = path.join(DATA_DIR, 'model-params.json');
const ACCURACY_FILE = path.join(DATA_DIR, 'fb-accuracy.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.lottery.gov.cn/',
    'Accept': 'application/json, text/plain, */*'
};

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// ---- 拉取比赛结果 ----
async function fetchResults() {
    console.log('🔍 正在拉取比赛结果...');
    const apis = [
        {
            name: '竞彩结果',
            url: 'https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=HAD&channel=c923-tysw-lq-dwj',
            extract: json => {
                if (!json?.value?.matchInfoList) return [];
                const results = [];
                for (const group of json.value.matchInfoList) {
                    const subs = group.subMatchList || [group];
                    for (const m of subs) {
                        if (m.matchStatus === 'Played' || m.homeScore !== undefined) {
                            results.push({
                                matchNum: m.matchNum || m.matchId || '',
                                home: m.homeTeamAbbName || m.homeTeamAllName || '',
                                away: m.awayTeamAbbName || m.awayTeamAllName || '',
                                homeScore: parseInt(m.homeScore) || 0,
                                awayScore: parseInt(m.awayScore) || 0,
                                halfHomeScore: parseInt(m.homeHalfScore) || 0,
                                halfAwayScore: parseInt(m.awayHalfScore) || 0,
                                result: getResult(parseInt(m.homeScore) || 0, parseInt(m.awayScore) || 0),
                                date: m.matchDate || group.businessDate || ''
                            });
                        }
                    }
                }
                return results;
            }
        }
    ];

    for (const api of apis) {
        try {
            const resp = await fetch(api.url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
            if (!resp.ok) continue;
            const json = await resp.json();
            const results = api.extract(json);
            if (results.length > 0) {
                console.log(`  ✅ 获取 ${results.length} 场已完赛结果`);
                return results;
            }
        } catch (e) {
            console.log(`  ⚠️ ${api.name} 失败: ${e.message}`);
        }
    }
    return [];
}

function getResult(homeScore, awayScore) {
    if (homeScore > awayScore) return '胜';
    if (homeScore === awayScore) return '平';
    return '负';
}

function getHalfFullResult(hh, ha, fh, fa) {
    const halfR = getResult(hh, ha);
    const fullR = getResult(fh, fa);
    return halfR + fullR;
}

// ---- 比对推荐方案 ----
function comparePicks(picks, results) {
    const stats = {
        sf: { total: 0, correct: 0, matches: [] },
        bqc: { total: 0, correct: 0, matches: [] },
        jq: { total: 0, correct: 0, matches: [] }
    };

    // Map results by team names for matching
    const resultMap = new Map();
    results.forEach(r => {
        const key = `${r.home}vs${r.away}`.replace(/\s/g, '');
        resultMap.set(key, r);
        // Also try reversed
        resultMap.set(`${r.away}vs${r.home}`.replace(/\s/g, ''), { ...r, reversed: true });
    });

    function findResult(home, away) {
        const key = `${home}vs${away}`.replace(/\s/g, '');
        return resultMap.get(key);
    }

    // Compare 胜负游戏
    if (picks.sf?.picks) {
        for (const p of picks.sf.picks) {
            const result = findResult(p.home, p.away);
            if (!result) continue;
            stats.sf.total++;
            const hit = p.pick === result.result;
            if (hit) stats.sf.correct++;
            stats.sf.matches.push({
                match: `${p.home} vs ${p.away}`,
                pick: p.pick, actual: result.result,
                hit, score: `${result.homeScore}:${result.awayScore}`
            });
        }
    }

    // Compare 半全场
    if (picks.bqc?.picks) {
        for (const p of picks.bqc.picks) {
            const result = findResult(p.home, p.away);
            if (!result) continue;
            stats.bqc.total++;
            const actualBQC = getHalfFullResult(result.halfHomeScore, result.halfAwayScore, result.homeScore, result.awayScore);
            const hit = p.pick === actualBQC;
            if (hit) stats.bqc.correct++;
            stats.bqc.matches.push({
                match: `${p.home} vs ${p.away}`,
                pick: p.pick, actual: actualBQC, hit
            });
        }
    }

    // Compare 进球彩
    if (picks.jq?.picks) {
        for (const p of picks.jq.picks) {
            const result = findResult(p.home, p.away);
            if (!result) continue;
            const actualHome = result.homeScore >= 3 ? '3+' : String(result.homeScore);
            const actualAway = result.awayScore >= 3 ? '3+' : String(result.awayScore);
            stats.jq.total++;
            const homeHit = p.homePick === actualHome;
            const awayHit = p.awayPick === actualAway;
            if (homeHit && awayHit) stats.jq.correct++;
            stats.jq.matches.push({
                match: `${p.home} vs ${p.away}`,
                pickHome: p.homePick, pickAway: p.awayPick,
                actualHome, actualAway,
                homeHit, awayHit,
                score: `${result.homeScore}:${result.awayScore}`
            });
        }
    }

    return stats;
}

// ---- 自动修正模型参数 ----
function evolveParams(params, stats) {
    const totalPicks = stats.sf.total + stats.bqc.total + stats.jq.total;
    const totalCorrect = stats.sf.correct + stats.bqc.correct + stats.jq.correct;
    if (totalPicks === 0) return params;

    const sessionRate = totalCorrect / totalPicks;

    // Update cumulative accuracy
    params.accuracy.total += totalPicks;
    params.accuracy.correct += totalCorrect;
    params.accuracy.rate = +(params.accuracy.correct / params.accuracy.total).toFixed(4);

    // Per-game accuracy
    ['sf', 'bqc', 'jq'].forEach(g => {
        if (stats[g].total > 0) {
            params.accuracy.byGame[g] = params.accuracy.byGame[g] || { total: 0, correct: 0 };
            params.accuracy.byGame[g].total += stats[g].total;
            params.accuracy.byGame[g].correct += stats[g].correct;
        }
    });

    // Evolve weights based on performance
    const w = params.weights;
    const learnRate = 0.02; // Small increments

    if (sessionRate > params.accuracy.rate) {
        // Current session better than average — reinforce current weights
        console.log('  📈 本次命中率高于平均，强化当前权重');
    } else if (sessionRate < params.accuracy.rate * 0.8) {
        // Much worse — shift weights
        console.log('  📉 本次命中率低于平均，调整权重');
        // Increase implied probability weight (more conservative)
        w.implied = Math.min(0.50, w.implied + learnRate);
        w.kelly = Math.max(0.15, w.kelly - learnRate * 0.5);
        w.ev = Math.max(0.15, w.ev - learnRate * 0.5);
    }

    // Normalize weights
    const wSum = w.kelly + w.ev + w.implied;
    w.kelly = +(w.kelly / wSum).toFixed(4);
    w.ev = +(w.ev / wSum).toFixed(4);
    w.implied = +(w.implied / wSum).toFixed(4);

    // Adjust game-specific params based on accuracy
    if (stats.sf.total >= 5) {
        const sfRate = stats.sf.correct / stats.sf.total;
        const gw = params.gameWeights.sf;
        if (sfRate < 0.3) {
            // Too many wrong — reduce home advantage bias
            gw.homeAdv = Math.max(0, gw.homeAdv - 0.01);
            gw.drawBias = Math.min(0.10, gw.drawBias + 0.005);
        } else if (sfRate > 0.5) {
            gw.homeAdv = Math.min(0.15, gw.homeAdv + 0.005);
        }
    }

    if (stats.jq.total >= 3) {
        const jqRate = stats.jq.correct / stats.jq.total;
        const gw = params.gameWeights.jq;
        if (jqRate < 0.15) {
            gw.avgGoals = Math.max(1.8, gw.avgGoals - 0.05);
        } else if (jqRate > 0.3) {
            gw.avgGoals = Math.min(3.2, gw.avgGoals + 0.05);
        }
    }

    // Record history
    params.history = params.history || [];
    params.history.push({
        date: new Date().toISOString().slice(0, 10),
        rate: +sessionRate.toFixed(4),
        picks: totalPicks,
        correct: totalCorrect,
        weights: { ...w }
    });
    // Keep last 30 entries
    if (params.history.length > 30) params.history = params.history.slice(-30);

    params.version++;
    params.lastUpdate = new Date().toISOString();

    return params;
}

// ---- 主逻辑 ----
async function main() {
    console.log('📊 足彩推荐方案比对 + 模型进化开始...\n');

    // Find pending picks to compare
    if (!fs.existsSync(PICKS_DIR)) {
        console.log('⚠️ 无推荐方案存档');
        return;
    }

    const files = fs.readdirSync(PICKS_DIR).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/));
    const pendingFiles = files.filter(f => {
        const picks = loadJSON(path.join(PICKS_DIR, f));
        return picks && picks.status === 'pending';
    });

    if (pendingFiles.length === 0) {
        console.log('ℹ️ 无待比对的推荐方案');
        return;
    }

    // Fetch results
    const results = await fetchResults();
    if (results.length === 0) {
        console.log('⚠️ 未获取到比赛结果，跳过比对');
        return;
    }

    let params = loadJSON(PARAMS_FILE) || {
        version: 1,
        weights: { kelly: 0.35, ev: 0.35, implied: 0.30 },
        gameWeights: { sf: {}, bqc: {}, jq: {} },
        accuracy: { total: 0, correct: 0, rate: 0, byGame: {} },
        history: []
    };

    let allAccuracy = [];

    for (const file of pendingFiles) {
        const filePath = path.join(PICKS_DIR, file);
        const picks = loadJSON(filePath);
        if (!picks) continue;

        console.log(`\n📋 比对: ${file}`);
        const stats = comparePicks(picks, results);

        // Log results
        ['sf', 'bqc', 'jq'].forEach(g => {
            const s = stats[g];
            if (s.total > 0) {
                const rate = (s.correct / s.total * 100).toFixed(1);
                const name = g === 'sf' ? '胜负' : g === 'bqc' ? '半全场' : '进球彩';
                console.log(`  ${name}: ${s.correct}/${s.total} (${rate}%)`);
                s.matches.forEach(m => {
                    const mark = m.hit || (m.homeHit && m.awayHit) ? '✅' : '❌';
                    console.log(`    ${mark} ${m.match}: 推${m.pick || m.pickHome + '/' + m.pickAway} 实${m.actual || m.actualHome + '/' + m.actualAway} ${m.score || ''}`);
                });
            }
        });

        // Mark as compared
        picks.status = 'compared';
        picks.comparison = {
            date: new Date().toISOString(),
            sf: stats.sf,
            bqc: stats.bqc,
            jq: stats.jq,
            resultsCount: results.length
        };
        fs.writeFileSync(filePath, JSON.stringify(picks, null, 2), 'utf8');

        allAccuracy.push(stats);
    }

    // Aggregate and evolve model
    const aggStats = { sf: { total: 0, correct: 0 }, bqc: { total: 0, correct: 0 }, jq: { total: 0, correct: 0 } };
    allAccuracy.forEach(s => {
        ['sf', 'bqc', 'jq'].forEach(g => {
            aggStats[g].total += s[g].total;
            aggStats[g].correct += s[g].correct;
        });
    });

    const totalPicks = aggStats.sf.total + aggStats.bqc.total + aggStats.jq.total;
    const totalCorrect = aggStats.sf.correct + aggStats.bqc.correct + aggStats.jq.correct;

    if (totalPicks > 0) {
        console.log(`\n📊 本次汇总: ${totalCorrect}/${totalPicks} (${(totalCorrect / totalPicks * 100).toFixed(1)}%)`);
        params = evolveParams(params, aggStats);
        fs.writeFileSync(PARAMS_FILE, JSON.stringify(params, null, 2), 'utf8');
        console.log(`\n🧠 模型已进化到 v${params.version}`);
        console.log(`  累计准确率: ${(params.accuracy.rate * 100).toFixed(1)}% (${params.accuracy.correct}/${params.accuracy.total})`);
        console.log(`  权重: Kelly=${params.weights.kelly} EV=${params.weights.ev} Implied=${params.weights.implied}`);
    }

    // Save accuracy summary
    const accuracySummary = {
        lastUpdate: new Date().toISOString(),
        cumulative: params.accuracy,
        recentSessions: params.history?.slice(-10) || [],
        modelVersion: params.version
    };
    fs.writeFileSync(ACCURACY_FILE, JSON.stringify(accuracySummary, null, 2), 'utf8');

    console.log('\n✅ 比对 + 模型进化完成!\n');
}

main().catch(e => { console.error('❌ 致命错误:', e.message); process.exit(1); });
