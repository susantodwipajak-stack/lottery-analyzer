#!/usr/bin/env node
/**
 * 🎯 足彩自动推荐方案生成脚本
 * 
 * 功能: 读取赛事赔率，为4种游戏类型生成AI推荐方案，存档到 data/fb-picks/
 * 运行: node scripts/generate-fb-picks.js
 * 触发: GitHub Actions 每天多时段自动运行
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const PICKS_DIR = path.join(DATA_DIR, 'fb-picks');
const PARAMS_FILE = path.join(DATA_DIR, 'model-params.json');

// ---- 工具函数 ----
function impliedProb(odds) { return odds > 0 ? 1 / odds : 0; }
function calcKelly(odds, prob) { const b = odds - 1; return b <= 0 ? 0 : (b * prob - (1 - prob)) / b; }
function calcEV(odds, prob) { return odds * prob - 1; }

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// ---- 加载自适应权重 ----
function loadParams() {
    const params = loadJSON(PARAMS_FILE);
    return params || {
        version: 1,
        weights: { kelly: 0.35, ev: 0.35, implied: 0.30 },
        gameWeights: {
            sf: { homeAdv: 0.08, drawBias: 0.02 },
            bqc: { halfDrawBias: 0.12, consistency: 0.20 },
            jq: { avgGoals: 2.5, homeGoalAdv: 0.15 }
        }
    };
}

// ---- 胜负游戏/任选9场 推荐 ----
function generateSFPicks(matches, params) {
    const w = params.weights;
    const gw = params.gameWeights?.sf || {};
    const homeAdv = gw.homeAdv || 0.08;
    const drawBias = gw.drawBias || 0.02;

    return matches.map(m => {
        const odds = [m.oddsW || 0, m.oddsD || 0, m.oddsL || 0];
        if (odds.every(o => o === 0)) return null;

        const ipRaw = odds.map(impliedProb);
        const margin = ipRaw.reduce((a, b) => a + b, 0);
        const fair = ipRaw.map(p => margin > 0 ? p / margin : 0.33);

        // Adjust for home advantage and draw bias
        const adj = [
            fair[0] + homeAdv,
            fair[1] + drawBias,
            fair[2] - homeAdv - drawBias
        ];
        const adjSum = adj.reduce((a, b) => a + b, 0);
        const probs = adj.map(p => Math.max(0.05, p / adjSum));

        const results = ['胜', '平', '负'].map((label, i) => {
            const kelly = calcKelly(odds[i], probs[i]);
            const ev = calcEV(odds[i], probs[i]);
            const score = w.kelly * Math.max(0, kelly) + w.ev * Math.max(0, ev) + w.implied * probs[i];
            return { label, odds: odds[i], prob: probs[i], kelly, ev, score };
        });

        results.sort((a, b) => b.score - a.score);
        const pick = results[0].label;
        const conf = results[0].prob > 0.45 ? '高' : results[0].prob > 0.35 ? '中' : '低';

        return {
            matchNum: m.matchNum,
            league: m.league,
            home: m.home,
            away: m.away,
            date: m.date,
            pick,
            confidence: conf,
            topPicks: results.slice(0, 2).map(r => ({ label: r.label, prob: +(r.prob * 100).toFixed(1), ev: +(r.ev * 100).toFixed(2) })),
            analysis: results
        };
    }).filter(Boolean);
}

// ---- 半全场推荐 ----
function generateBQCPicks(matches, params) {
    const gw = params.gameWeights?.bqc || {};
    const halfDrawBias = gw.halfDrawBias || 0.12;

    const BQC_LABELS = ['胜胜', '胜平', '胜负', '平胜', '平平', '平负', '负胜', '负平', '负负'];

    return matches.slice(0, 6).map(m => {
        const odds = [m.oddsW || 2, m.oddsD || 3, m.oddsL || 3];
        const ipRaw = odds.map(impliedProb);
        const margin = ipRaw.reduce((a, b) => a + b, 0);
        const fair = ipRaw.map(p => margin > 0 ? p / margin : 0.33);

        // Half-time probabilities (more draws at half-time)
        const hf = [fair[0] * 0.8, 0.4 + fair[1] * 0.3, fair[2] * 0.8];
        const hm = hf.reduce((a, b) => a + b, 0);
        const halfProbs = hf.map(p => p / hm);

        // 9 combinations
        const combos = [];
        for (let h = 0; h < 3; h++) {
            for (let f = 0; f < 3; f++) {
                const prob = halfProbs[h] * fair[f] + (h === 1 ? halfDrawBias * 0.01 : 0);
                combos.push({ label: BQC_LABELS[h * 3 + f], prob, code: `${3 - h}${3 - f}` });
            }
        }
        const total = combos.reduce((a, c) => a + c.prob, 0);
        combos.forEach(c => c.prob = c.prob / total);
        combos.sort((a, b) => b.prob - a.prob);

        return {
            matchNum: m.matchNum, league: m.league, home: m.home, away: m.away, date: m.date,
            pick: combos[0].label,
            confidence: combos[0].prob > 0.25 ? '高' : combos[0].prob > 0.15 ? '中' : '低',
            topPicks: combos.slice(0, 3).map(c => ({ label: c.label, prob: +(c.prob * 100).toFixed(1) }))
        };
    });
}

// ---- 进球彩推荐 ----
function generateJQPicks(matches, params) {
    const gw = params.gameWeights?.jq || {};
    const avgGoals = gw.avgGoals || 2.5;
    const homeGoalAdv = gw.homeGoalAdv || 0.15;

    return matches.slice(0, 4).map(m => {
        const odds = [m.oddsW || 2, m.oddsD || 3, m.oddsL || 3];
        const ipRaw = odds.map(impliedProb);
        const margin = ipRaw.reduce((a, b) => a + b, 0);
        const fw = ipRaw[0] / margin, fl = ipRaw[2] / margin;

        const homeStr = fw / (fw + fl + 0.001);
        const awayStr = fl / (fw + fl + 0.001);

        function goalDist(strength) {
            const avg = (avgGoals / 2) * (0.5 + strength) + (strength > 0.5 ? homeGoalAdv : 0);
            const p = [];
            for (let g = 0; g <= 2; g++) p.push(Math.pow(avg, g) * Math.exp(-avg) / factorial(g));
            p.push(1 - p.reduce((a, b) => a + b, 0));
            return p.map(v => Math.max(0.03, v));
        }

        const hp = goalDist(homeStr), ap = goalDist(awayStr);
        const hSum = hp.reduce((a, b) => a + b, 0), aSum = ap.reduce((a, b) => a + b, 0);
        const hNorm = hp.map(p => p / hSum), aNorm = ap.map(p => p / aSum);

        const hBest = hNorm.indexOf(Math.max(...hNorm));
        const aBest = aNorm.indexOf(Math.max(...aNorm));

        return {
            matchNum: m.matchNum, league: m.league, home: m.home, away: m.away, date: m.date,
            homePick: hBest >= 3 ? '3+' : String(hBest),
            awayPick: aBest >= 3 ? '3+' : String(aBest),
            confidence: hNorm[hBest] > 0.4 ? '高' : '中',
            homeProbs: hNorm.map((p, i) => ({ goals: i >= 3 ? '3+' : String(i), prob: +(p * 100).toFixed(1) })),
            awayProbs: aNorm.map((p, i) => ({ goals: i >= 3 ? '3+' : String(i), prob: +(p * 100).toFixed(1) }))
        };
    });
}

function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }

// ---- 主逻辑 ----
async function main() {
    console.log('🎯 足彩推荐方案生成开始...\n');

    const matchData = loadJSON(MATCHES_FILE);
    if (!matchData?.matches?.length) {
        console.log('⚠️ 无赛事数据，跳过推荐生成');
        return;
    }

    const matches = matchData.matches;
    const params = loadParams();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().slice(11, 16);

    console.log(`📅 日期: ${dateStr} ${timeStr}`);
    console.log(`⚽ 赛事数据: ${matches.length} 场\n`);

    // Generate picks for each game type
    const sfPicks = generateSFPicks(matches.slice(0, 14), params);
    const r9Picks = generateSFPicks(matches.slice(0, 14), params); // Same analysis, pick best 9
    const bqcPicks = generateBQCPicks(matches, params);
    const jqPicks = generateJQPicks(matches, params);

    // For R9, select 9 highest-confidence matches
    r9Picks.sort((a, b) => {
        const confOrder = { '高': 3, '中': 2, '低': 1 };
        return (confOrder[b.confidence] || 0) - (confOrder[a.confidence] || 0);
    });
    const r9Selected = r9Picks.slice(0, 9);

    const picks = {
        date: dateStr,
        time: timeStr,
        generatedAt: now.toISOString(),
        modelVersion: params.version,
        modelAccuracy: params.accuracy?.rate || 0,
        matchSource: matchData.lastUpdate,
        sf: { name: '胜负游戏', picks: sfPicks },
        r9: { name: '任选9场', picks: r9Selected },
        bqc: { name: '6场半全场', picks: bqcPicks },
        jq: { name: '4场进球', picks: jqPicks },
        status: 'pending' // pending | compared
    };

    // Save to archive
    if (!fs.existsSync(PICKS_DIR)) fs.mkdirSync(PICKS_DIR, { recursive: true });
    const archiveFile = path.join(PICKS_DIR, `${dateStr}.json`);
    fs.writeFileSync(archiveFile, JSON.stringify(picks, null, 2), 'utf8');

    // Save as latest
    const latestFile = path.join(PICKS_DIR, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(picks, null, 2), 'utf8');

    console.log('📋 推荐方案:');
    console.log(`  胜负游戏: ${sfPicks.length} 场`);
    sfPicks.forEach(p => console.log(`    ${p.home} vs ${p.away}: ${p.pick} (${p.confidence})`));
    console.log(`  任选9场: ${r9Selected.length} 场 (最高信心)`);
    console.log(`  半全场: ${bqcPicks.length} 场`);
    bqcPicks.forEach(p => console.log(`    ${p.home} vs ${p.away}: ${p.pick} (${p.confidence})`));
    console.log(`  进球彩: ${jqPicks.length} 场`);
    jqPicks.forEach(p => console.log(`    ${p.home} vs ${p.away}: 主${p.homePick} 客${p.awayPick} (${p.confidence})`));

    console.log(`\n💾 存档: ${archiveFile}`);
    console.log(`💾 最新: ${latestFile}`);
    console.log('✅ 推荐方案生成完成!\n');
}

main().catch(e => { console.error('❌ 致命错误:', e.message); process.exit(1); });
