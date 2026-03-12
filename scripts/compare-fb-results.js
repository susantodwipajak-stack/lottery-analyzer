#!/usr/bin/env node
/**
 * 📊 足彩推荐方案比对 + 模型自动进化脚本 V2.0
 * 
 * 改进:
 *   - 双向奖惩: 好于平均→强化, 差于平均→反向调整
 *   - 动量加速: 连续同方向调整时加速收敛 (momentum=0.7)
 *   - 分联赛追踪: 按联赛记录命中率，自动学习联赛参数
 *   - 信心加权: 高信心推荐影响更大
 *   - 多策略表现追踪: 独立记录保守/均衡/激进策略准确率
 *   - 衰减因子: 远期历史权重衰减 (decay=0.95/session)
 * 
 * 运行: node scripts/compare-fb-results.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PICKS_DIR = path.join(DATA_DIR, 'fb-picks');
const PARAMS_FILE = path.join(DATA_DIR, 'model-params.json');
const ACCURACY_FILE = path.join(DATA_DIR, 'fb-accuracy.json');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.lottery.gov.cn/',
    'Accept': 'application/json, text/plain, */*'
};

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// ========== 拉取比赛结果 ==========

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
                        if (m.matchStatus === 'Played' || (m.homeScore !== undefined && m.homeScore !== null && m.homeScore !== '')) {
                            results.push({
                                matchNum: m.matchNum || m.matchId || '',
                                home: m.homeTeamAbbName || m.homeTeamAllName || '',
                                away: m.awayTeamAbbName || m.awayTeamAllName || '',
                                league: m.leagueAbbName || m.leagueName || '',
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
        },
        {
            // Bug#4 fix: add historical results API for completed matches
            name: '历史结果',
            url: 'https://webapi.sporttery.cn/gateway/jc/football/getMatchResultV1.qry?matchPage=0&matchBeginDate=' + getYesterday() + '&matchEndDate=' + getToday() + '&leagueId=&pageSize=100&pageNo=1',
            extract: json => {
                if (!json?.value?.matchResult) return [];
                const list = Array.isArray(json.value.matchResult) ? json.value.matchResult : [];
                return list.map(m => ({
                    matchNum: m.matchNum || '',
                    home: m.homeTeamAbbName || m.homeTeamAllName || '',
                    away: m.awayTeamAbbName || m.awayTeamAllName || '',
                    league: m.leagueAbbName || '',
                    homeScore: parseInt(m.homeScore) || 0,
                    awayScore: parseInt(m.awayScore) || 0,
                    halfHomeScore: parseInt(m.homeHalfScore) || 0,
                    halfAwayScore: parseInt(m.awayHalfScore) || 0,
                    result: getResult(parseInt(m.homeScore) || 0, parseInt(m.awayScore) || 0),
                    date: m.matchDate || ''
                })).filter(m => m.home && m.away);
            }
        }
    ];

    // Merge results from all successful APIs
    let allResults = [];
    const seen = new Set();
    for (const api of apis) {
        try {
            const resp = await fetch(api.url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
            if (!resp.ok) continue;
            const json = await resp.json();
            const results = api.extract(json);
            if (results.length > 0) {
                console.log(`  ✅ ${api.name}: 获取 ${results.length} 场已完赛结果`);
                for (const r of results) {
                    const key = `${r.home}vs${r.away}`.replace(/\s/g, '');
                    if (!seen.has(key)) { seen.add(key); allResults.push(r); }
                }
            }
        } catch (e) {
            console.log(`  ⚠️ ${api.name} 失败: ${e.message}`);
        }
    }
    if (allResults.length > 0) console.log(`  📊 合计 ${allResults.length} 场不重复结果`);
    return allResults;
}

// Bug#4 helper: date strings
function getToday() { return new Date().toISOString().slice(0, 10); }
function getYesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }

function getResult(homeScore, awayScore) {
    if (homeScore > awayScore) return '胜';
    if (homeScore === awayScore) return '平';
    return '负';
}

function getHalfFullResult(hh, ha, fh, fa) {
    return getResult(hh, ha) + getResult(fh, fa);
}

// ========== 比对推荐方案 ==========

function comparePicks(picks, results) {
    const stats = {
        sf: { total: 0, correct: 0, matches: [], byConfidence: {}, byStrategy: {}, byLeague: {} },
        bqc: { total: 0, correct: 0, matches: [] },
        jq: { total: 0, correct: 0, matches: [] }
    };

    const resultMap = new Map();
    results.forEach(r => {
        const key = `${r.home}vs${r.away}`.replace(/\s/g, '');
        resultMap.set(key, r);
        resultMap.set(`${r.away}vs${r.home}`.replace(/\s/g, ''), { ...r, reversed: true });
    });

    function findResult(home, away) {
        return resultMap.get(`${home}vs${away}`.replace(/\s/g, ''));
    }

    // Compare 胜负游戏 (with confidence + strategy tracking)
    if (picks.sf?.picks) {
        for (const p of picks.sf.picks) {
            const result = findResult(p.home, p.away);
            if (!result) continue;
            stats.sf.total++;
            const hit = p.pick === result.result;
            if (hit) stats.sf.correct++;

            // Track by confidence level
            const conf = p.confidence || '中';
            if (!stats.sf.byConfidence[conf]) stats.sf.byConfidence[conf] = { total: 0, correct: 0 };
            stats.sf.byConfidence[conf].total++;
            if (hit) stats.sf.byConfidence[conf].correct++;

            // Track by strategy used
            const strat = p.strategy || 'balanced';
            if (!stats.sf.byStrategy[strat]) stats.sf.byStrategy[strat] = { total: 0, correct: 0 };
            stats.sf.byStrategy[strat].total++;
            if (hit) stats.sf.byStrategy[strat].correct++;

            // Track by league
            const league = p.league || result.league || 'unknown';
            if (!stats.sf.byLeague[league]) stats.sf.byLeague[league] = { total: 0, correct: 0 };
            stats.sf.byLeague[league].total++;
            if (hit) stats.sf.byLeague[league].correct++;

            // Track all 3 strategies' virtual accuracy
            if (p.allStrategies) {
                p.allStrategies.forEach(s => {
                    const sHit = s.pick === result.result;
                    const key = `virtual_${s.id}`;
                    if (!stats.sf.byStrategy[key]) stats.sf.byStrategy[key] = { total: 0, correct: 0 };
                    stats.sf.byStrategy[key].total++;
                    if (sHit) stats.sf.byStrategy[key].correct++;
                });
            }

            stats.sf.matches.push({
                match: `${p.home} vs ${p.away}`, league,
                pick: p.pick, actual: result.result, confidence: conf, strategy: strat,
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
            stats.bqc.matches.push({ match: `${p.home} vs ${p.away}`, pick: p.pick, actual: actualBQC, hit });
        }
    }

    // Compare 进球彩 — Bug#11 fix: partial match scoring
    if (picks.jq?.picks) {
        for (const p of picks.jq.picks) {
            const result = findResult(p.home, p.away);
            if (!result) continue;
            const actualHome = result.homeScore >= 3 ? '3+' : String(result.homeScore);
            const actualAway = result.awayScore >= 3 ? '3+' : String(result.awayScore);
            stats.jq.total++;
            const homeHit = p.homePick === actualHome;
            const awayHit = p.awayPick === actualAway;
            // Full match = 1 correct, partial (one side) = 0.5 correct
            if (homeHit && awayHit) stats.jq.correct += 1;
            else if (homeHit || awayHit) stats.jq.correct += 0.5;
            stats.jq.matches.push({
                match: `${p.home} vs ${p.away}`,
                pickHome: p.homePick, pickAway: p.awayPick,
                actualHome, actualAway, homeHit, awayHit,
                score: `${result.homeScore}:${result.awayScore}`
            });
        }
    }

    return stats;
}

// ========== 自动修正模型参数 V2: 双向奖惩 + 动量 + 联赛学习 ==========

function evolveParams(params, stats) {
    const totalPicks = stats.sf.total + stats.bqc.total + stats.jq.total;
    const totalCorrect = stats.sf.correct + stats.bqc.correct + stats.jq.correct;
    if (totalPicks === 0) return params;

    const sessionRate = totalCorrect / totalPicks;

    // Initialize missing fields
    if (!params.accuracy) params.accuracy = { total: 0, correct: 0, rate: 0, byGame: {} };
    if (!params.momentum) params.momentum = { kelly: 0, ev: 0, implied: 0 };
    if (!params.leagueParams) params.leagueParams = {};
    if (!params.strategyAccuracy) params.strategyAccuracy = {};

    // ─── 1. Bug#2 fix: calculate delta BEFORE updating accuracy ───
    const oldRate = params.accuracy.rate || 0;
    const decay = 0.95; // Historical data decays 5% per session
    params.accuracy.total = params.accuracy.total * decay + totalPicks;
    params.accuracy.correct = params.accuracy.correct * decay + totalCorrect;
    params.accuracy.rate = +(params.accuracy.correct / params.accuracy.total).toFixed(4);

    // Per-game accuracy
    ['sf', 'bqc', 'jq'].forEach(g => {
        if (stats[g].total > 0) {
            params.accuracy.byGame[g] = params.accuracy.byGame[g] || { total: 0, correct: 0 };
            params.accuracy.byGame[g].total = (params.accuracy.byGame[g].total || 0) * decay + stats[g].total;
            params.accuracy.byGame[g].correct = (params.accuracy.byGame[g].correct || 0) * decay + stats[g].correct;
        }
    });

    // ─── 2. Per-strategy accuracy tracking ───
    if (stats.sf.byStrategy) {
        for (const [stratId, data] of Object.entries(stats.sf.byStrategy)) {
            if (!params.strategyAccuracy[stratId]) params.strategyAccuracy[stratId] = { total: 0, correct: 0 };
            params.strategyAccuracy[stratId].total = (params.strategyAccuracy[stratId].total || 0) * decay + data.total;
            params.strategyAccuracy[stratId].correct = (params.strategyAccuracy[stratId].correct || 0) * decay + data.correct;
        }
    }

    // Log strategy comparison
    console.log('\n  📊 策略虚拟对比:');
    ['virtual_conservative', 'virtual_balanced', 'virtual_aggressive'].forEach(key => {
        const sa = params.strategyAccuracy[key];
        if (sa && sa.total > 0) {
            const label = key.replace('virtual_', '');
            console.log(`    ${label}: ${(sa.correct / sa.total * 100).toFixed(1)}% (${Math.round(sa.correct)}/${Math.round(sa.total)})`);
        }
    });

    // ─── 3. Bidirectional weight evolution with momentum ───
    const w = params.weights;
    const mom = params.momentum;
    const learnRate = 0.03;
    const momentumFactor = 0.7;

    // Bug#2 fix: use oldRate (before this session's update) for meaningful delta
    const delta = sessionRate - oldRate;

    if (delta > 0.05) {
        // Better than average → reinforce current direction
        console.log(`  📈 本次 ${(sessionRate * 100).toFixed(1)}% > 平均 ${(params.accuracy.rate * 100).toFixed(1)}% → 强化当前方向`);
        // If kelly was recently boosted (+momentum) and we're doing well, keep boosting
        mom.kelly = momentumFactor * mom.kelly + learnRate * 0.5;
        mom.ev = momentumFactor * mom.ev + learnRate * 0.3;
        mom.implied = momentumFactor * mom.implied - learnRate * 0.3; // Reduce conservative approach
    } else if (delta < -0.05) {
        // Worse than average → shift toward conservative (implied probability)
        console.log(`  📉 本次 ${(sessionRate * 100).toFixed(1)}% < 平均 ${(params.accuracy.rate * 100).toFixed(1)}% → 偏向保守`);
        mom.kelly = momentumFactor * mom.kelly - learnRate * 0.4;
        mom.ev = momentumFactor * mom.ev - learnRate * 0.3;
        mom.implied = momentumFactor * mom.implied + learnRate * 0.5;
    } else {
        // Similar performance → decay momentum
        console.log(`  ↔️ 本次 ${(sessionRate * 100).toFixed(1)}% ≈ 平均 → 保持当前`);
        mom.kelly *= 0.5;
        mom.ev *= 0.5;
        mom.implied *= 0.5;
    }

    // Apply momentum to weights
    w.kelly = Math.max(0.10, Math.min(0.55, w.kelly + mom.kelly));
    w.ev = Math.max(0.10, Math.min(0.55, w.ev + mom.ev));
    w.implied = Math.max(0.10, Math.min(0.60, w.implied + mom.implied));

    // Normalize weights
    const wSum = w.kelly + w.ev + w.implied;
    w.kelly = +(w.kelly / wSum).toFixed(4);
    w.ev = +(w.ev / wSum).toFixed(4);
    w.implied = +(w.implied / wSum).toFixed(4);

    // Clamp momentum
    mom.kelly = +Math.max(-0.05, Math.min(0.05, mom.kelly)).toFixed(4);
    mom.ev = +Math.max(-0.05, Math.min(0.05, mom.ev)).toFixed(4);
    mom.implied = +Math.max(-0.05, Math.min(0.05, mom.implied)).toFixed(4);

    // ─── 4. Per-league parameter learning ───
    if (stats.sf.byLeague) {
        for (const [league, data] of Object.entries(stats.sf.byLeague)) {
            if (data.total < 2) continue;
            if (!params.leagueParams[league]) {
                params.leagueParams[league] = { homeAdv: 0.08, drawBias: 0.02, avgGoals: 2.5, samples: 0 };
            }
            const lp = params.leagueParams[league];
            lp.samples += data.total;
            const leagueRate = data.correct / data.total;

            // Analyze what went wrong/right for this league
            const leagueMatches = stats.sf.matches.filter(m => m.league === league);
            const homeWins = leagueMatches.filter(m => m.actual === '胜').length;
            const draws = leagueMatches.filter(m => m.actual === '平').length;
            const actualHomeRate = homeWins / leagueMatches.length;
            const actualDrawRate = draws / leagueMatches.length;

            // Adjust league params toward observed rates
            const lr = Math.min(0.05, 1 / (lp.samples + 5)); // Smaller adjustments as we get more data
            lp.homeAdv = +(lp.homeAdv + lr * (actualHomeRate - 0.40 - lp.homeAdv)).toFixed(4);
            lp.drawBias = +(lp.drawBias + lr * (actualDrawRate - 0.28 - lp.drawBias)).toFixed(4);
            lp.homeAdv = Math.max(0, Math.min(0.20, lp.homeAdv));
            lp.drawBias = Math.max(-0.05, Math.min(0.15, lp.drawBias));

            console.log(`  🏟️ ${league}: ${leagueRate.toFixed(2)} (${data.correct}/${data.total}) → homeAdv=${lp.homeAdv} drawBias=${lp.drawBias}`);
        }
    }

    // ─── 5. Game-specific param adjustment ───
    if (stats.sf.total >= 3) {
        const sfRate = stats.sf.correct / stats.sf.total;
        const gw = params.gameWeights.sf;
        if (sfRate < 0.25) {
            gw.homeAdv = Math.max(0, (gw.homeAdv || 0.08) - 0.01);
            gw.drawBias = Math.min(0.10, (gw.drawBias || 0.02) + 0.005);
        } else if (sfRate > 0.50) {
            gw.homeAdv = Math.min(0.15, (gw.homeAdv || 0.08) + 0.005);
        }
        // Bug#12 fix: sync gameWeights.sf back into leagueParams defaults
        if (!params.leagueParams['default']) params.leagueParams['default'] = { homeAdv: 0.08, drawBias: 0.02, avgGoals: 2.5, samples: 0 };
        params.leagueParams['default'].homeAdv = gw.homeAdv;
        params.leagueParams['default'].drawBias = gw.drawBias;
    }

    if (stats.jq.total >= 2) {
        const jqRate = stats.jq.correct / stats.jq.total;
        const gw = params.gameWeights.jq;
        if (jqRate < 0.15) {
            gw.avgGoals = Math.max(1.8, (gw.avgGoals || 2.5) - 0.05);
        } else if (jqRate > 0.3) {
            gw.avgGoals = Math.min(3.2, (gw.avgGoals || 2.5) + 0.05);
        }
    }

    // ─── 6. Confidence-weighted scoring ───
    let confWeightedRate = sessionRate;
    if (stats.sf.byConfidence) {
        const confWeights = { '高': 2.0, '中': 1.0, '低': 0.5 };
        let weightedCorrect = 0, weightedTotal = 0;
        for (const [conf, data] of Object.entries(stats.sf.byConfidence)) {
            const w = confWeights[conf] || 1;
            weightedCorrect += data.correct * w;
            weightedTotal += data.total * w;
        }
        if (weightedTotal > 0) {
            confWeightedRate = weightedCorrect / weightedTotal;
            console.log(`  🎯 信心加权准确率: ${(confWeightedRate * 100).toFixed(1)}%`);
            for (const [conf, data] of Object.entries(stats.sf.byConfidence)) {
                console.log(`    ${conf}信心: ${data.correct}/${data.total} (${(data.correct / data.total * 100).toFixed(0)}%)`);
            }
        }
    }

    // ─── 7. Record evolution history ───
    params.history = params.history || [];
    params.history.push({
        date: new Date().toISOString().slice(0, 10),
        rate: +sessionRate.toFixed(4),
        confWeightedRate: +confWeightedRate.toFixed(4),
        picks: totalPicks,
        correct: totalCorrect,
        weights: { ...w },
        momentum: { ...mom }
    });
    if (params.history.length > 30) params.history = params.history.slice(-30);

    params.version++;
    params.lastUpdate = new Date().toISOString();

    return params;
}

// ========== 主逻辑 ==========

async function main() {
    console.log('📊 足彩推荐比对 + 模型进化 V2.0 开始...\n');

    if (!fs.existsSync(PICKS_DIR)) { console.log('⚠️ 无推荐方案存档'); return; }

    const files = fs.readdirSync(PICKS_DIR).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/));
    const pendingFiles = files.filter(f => {
        const picks = loadJSON(path.join(PICKS_DIR, f));
        return picks && picks.status === 'pending';
    });

    if (pendingFiles.length === 0) { console.log('ℹ️ 无待比对的推荐方案'); return; }

    const results = await fetchResults();
    if (results.length === 0) { console.log('⚠️ 未获取到结果，跳过'); return; }

    let params = loadJSON(PARAMS_FILE) || {
        version: 1,
        weights: { kelly: 0.35, ev: 0.35, implied: 0.30 },
        gameWeights: { sf: {}, bqc: {}, jq: {} },
        accuracy: { total: 0, correct: 0, rate: 0, byGame: {} },
        momentum: { kelly: 0, ev: 0, implied: 0 },
        leagueParams: {},
        strategyAccuracy: {},
        history: []
    };

    let allAccuracy = [];

    for (const file of pendingFiles) {
        const filePath = path.join(PICKS_DIR, file);
        const picks = loadJSON(filePath);
        if (!picks) continue;

        console.log(`\n── 比对: ${file} ──`);
        const stats = comparePicks(picks, results);

        ['sf', 'bqc', 'jq'].forEach(g => {
            const s = stats[g];
            if (s.total > 0) {
                const rate = (s.correct / s.total * 100).toFixed(1);
                const name = g === 'sf' ? '胜负' : g === 'bqc' ? '半全场' : '进球彩';
                console.log(`  ${name}: ${s.correct}/${s.total} (${rate}%)`);
                s.matches.forEach(m => {
                    const mark = m.hit || (m.homeHit && m.awayHit) ? '✅' : '❌';
                    const conf = m.confidence ? ` [${m.confidence}]` : '';
                    console.log(`    ${mark} ${m.match}: 推${m.pick || m.pickHome + '/' + m.pickAway} 实${m.actual || m.actualHome + '/' + m.actualAway} ${m.score || ''}${conf}`);
                });
            }
        });

        picks.status = 'compared';
        picks.comparison = {
            date: new Date().toISOString(),
            sf: stats.sf, bqc: stats.bqc, jq: stats.jq,
            resultsCount: results.length
        };
        fs.writeFileSync(filePath, JSON.stringify(picks, null, 2), 'utf8');
        allAccuracy.push(stats);
    }

    // Aggregate
    const aggStats = {
        sf: { total: 0, correct: 0, byConfidence: {}, byStrategy: {}, byLeague: {}, matches: [] },
        bqc: { total: 0, correct: 0 },
        jq: { total: 0, correct: 0 }
    };
    allAccuracy.forEach(s => {
        ['sf', 'bqc', 'jq'].forEach(g => {
            aggStats[g].total += s[g].total;
            aggStats[g].correct += s[g].correct;
        });
        // Merge SF sub-category stats
        for (const [conf, data] of Object.entries(s.sf.byConfidence || {})) {
            if (!aggStats.sf.byConfidence[conf]) aggStats.sf.byConfidence[conf] = { total: 0, correct: 0 };
            aggStats.sf.byConfidence[conf].total += data.total;
            aggStats.sf.byConfidence[conf].correct += data.correct;
        }
        for (const [strat, data] of Object.entries(s.sf.byStrategy || {})) {
            if (!aggStats.sf.byStrategy[strat]) aggStats.sf.byStrategy[strat] = { total: 0, correct: 0 };
            aggStats.sf.byStrategy[strat].total += data.total;
            aggStats.sf.byStrategy[strat].correct += data.correct;
        }
        for (const [league, data] of Object.entries(s.sf.byLeague || {})) {
            if (!aggStats.sf.byLeague[league]) aggStats.sf.byLeague[league] = { total: 0, correct: 0 };
            aggStats.sf.byLeague[league].total += data.total;
            aggStats.sf.byLeague[league].correct += data.correct;
        }
        aggStats.sf.matches.push(...(s.sf.matches || []));
    });

    const totalPicks = aggStats.sf.total + aggStats.bqc.total + aggStats.jq.total;
    const totalCorrect = aggStats.sf.correct + aggStats.bqc.correct + aggStats.jq.correct;

    if (totalPicks > 0) {
        console.log(`\n── 汇总: ${totalCorrect}/${totalPicks} (${(totalCorrect / totalPicks * 100).toFixed(1)}%) ──`);
        params = evolveParams(params, aggStats);
        fs.writeFileSync(PARAMS_FILE, JSON.stringify(params, null, 2), 'utf8');
        console.log(`\n🧠 模型已进化到 v${params.version}`);
        console.log(`  累计准确率: ${(params.accuracy.rate * 100).toFixed(1)}%`);
        console.log(`  权重: Kelly=${params.weights.kelly} EV=${params.weights.ev} Implied=${params.weights.implied}`);
        console.log(`  动量: Kelly=${params.momentum.kelly} EV=${params.momentum.ev} Implied=${params.momentum.implied}`);
        if (Object.keys(params.leagueParams).length > 0) {
            console.log(`  联赛参数: ${Object.keys(params.leagueParams).length} 个联赛已学习`);
        }
    }

    // Save accuracy summary
    const accuracySummary = {
        lastUpdate: new Date().toISOString(),
        cumulative: params.accuracy,
        strategyAccuracy: params.strategyAccuracy,
        leagueParams: params.leagueParams,
        recentSessions: params.history?.slice(-10) || [],
        modelVersion: params.version
    };
    fs.writeFileSync(ACCURACY_FILE, JSON.stringify(accuracySummary, null, 2), 'utf8');

    console.log('\n✅ 比对 + 模型进化完成!\n');
}

main().catch(e => { console.error('❌ 致命错误:', e.message); process.exit(1); });
