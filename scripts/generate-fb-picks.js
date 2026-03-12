#!/usr/bin/env node
/**
 * 🎯 足彩自动推荐方案生成脚本 V2.0
 * 
 * 改进:
 *   - 3种策略(保守/均衡/激进)竞争生成
 *   - 联赛级参数区分(英超/德甲/西甲/意甲/法甲/中超)
 *   - 贝叶斯概率平滑
 *   - 赔率变动追踪
 *   - 信心分级细化
 * 
 * 运行: node scripts/generate-fb-picks.js
 * 输出: data/fb-picks/{date}.json + data/fb-picks/latest.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const PICKS_DIR = path.join(DATA_DIR, 'fb-picks');
const PARAMS_FILE = path.join(DATA_DIR, 'model-params.json');

// ========== 基础工具 ==========

function impliedProb(odds) { return odds > 0 ? 1 / odds : 0; }
function calcKelly(odds, prob) { const b = odds - 1; return b <= 0 ? 0 : (b * prob - (1 - prob)) / b; }
function calcEV(odds, prob) { return odds * prob - 1; }
function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// ========== 联赛参数 ==========

const LEAGUE_DEFAULTS = {
    '英超': { homeAdv: 0.10, drawBias: 0.01, avgGoals: 2.85 },
    '德甲': { homeAdv: 0.09, drawBias: 0.01, avgGoals: 3.05 },
    '西甲': { homeAdv: 0.11, drawBias: 0.03, avgGoals: 2.55 },
    '意甲': { homeAdv: 0.07, drawBias: 0.04, avgGoals: 2.35 },
    '法甲': { homeAdv: 0.09, drawBias: 0.03, avgGoals: 2.50 },
    '中超': { homeAdv: 0.12, drawBias: 0.02, avgGoals: 2.40 },
    '日职': { homeAdv: 0.08, drawBias: 0.03, avgGoals: 2.60 },
    '韩K':  { homeAdv: 0.09, drawBias: 0.02, avgGoals: 2.45 },
    'default': { homeAdv: 0.08, drawBias: 0.02, avgGoals: 2.50 }
};

function getLeagueParams(league, learnedParams) {
    // Check learned params first, then defaults
    if (learnedParams?.[league]) {
        return learnedParams[league];
    }
    for (const key of Object.keys(LEAGUE_DEFAULTS)) {
        if (league && league.includes(key)) return LEAGUE_DEFAULTS[key];
    }
    return LEAGUE_DEFAULTS['default'];
}

// ========== 3种策略 ==========

const STRATEGIES = [
    {
        id: 'conservative',
        name: '🛡️ 保守稳健',
        desc: '偏向隐含概率最高项，低风险',
        weights: { kelly: 0.15, ev: 0.20, implied: 0.65 }
    },
    {
        id: 'balanced',
        name: '⚖️ 均衡推荐',
        desc: '综合Kelly/EV/概率三因子',
        weights: { kelly: 0.35, ev: 0.35, implied: 0.30 }
    },
    {
        id: 'aggressive',
        name: '🔥 激进价值',
        desc: '偏向高EV和Kelly值，追求高赔率',
        weights: { kelly: 0.45, ev: 0.40, implied: 0.15 }
    }
];

// ========== 加载自适应权重 ==========

function loadParams() {
    const params = loadJSON(PARAMS_FILE);
    return params || {
        version: 1,
        weights: { kelly: 0.35, ev: 0.35, implied: 0.30 },
        gameWeights: {
            sf: { homeAdv: 0.08, drawBias: 0.02 },
            bqc: { halfDrawBias: 0.12, consistency: 0.20 },
            jq: { avgGoals: 2.5, homeGoalAdv: 0.15 }
        },
        leagueParams: {},
        momentum: { kelly: 0, ev: 0, implied: 0 },
        strategyAccuracy: {},
        accuracy: { total: 0, correct: 0, rate: 0, byGame: {} },
        history: []
    };
}

// ========== 贝叶斯概率平滑 ==========

function bayesianSmooth(rawProbs, prior = [0.36, 0.28, 0.36], strength = 5) {
    // Beta-binomial smoothing: blend observed probabilities with a prior
    const n = 100; // Pseudo sample size from odds
    return rawProbs.map((p, i) => {
        const smoothed = (p * n + prior[i] * strength) / (n + strength);
        return Math.max(0.05, smoothed);
    });
}

// ========== 胜负游戏推荐 (多策略) ==========

function generateSFPicks(matches, params) {
    const learnedLeagues = params.leagueParams || {};

    return matches.map(m => {
        const odds = [m.oddsW || 0, m.oddsD || 0, m.oddsL || 0];
        if (odds.every(o => o === 0)) return null;

        // Get league-specific params
        const lp = getLeagueParams(m.league, learnedLeagues);

        // Compute fair probabilities from odds
        const ipRaw = odds.map(impliedProb);
        const margin = ipRaw.reduce((a, b) => a + b, 0);
        const fairRaw = ipRaw.map(p => margin > 0 ? p / margin : 0.33);

        // Bayesian smoothing
        const fair = bayesianSmooth(fairRaw);

        // Adjust for home advantage and draw bias (multiplicative, not additive)
        // Odds already price in home advantage; this is a small correction factor
        const adj = [
            fair[0] * (1 + lp.homeAdv),       // e.g. *1.08 — slight home boost
            fair[1] * (1 + lp.drawBias * 2),   // e.g. *1.04 — slight draw boost
            fair[2] * (1 - lp.homeAdv * 0.5)   // e.g. *0.96 — slight away reduce
        ];
        const adjSum = adj.reduce((a, b) => a + b, 0);
        const probs = adj.map(p => Math.max(0.05, p / adjSum));

        // Run all 3 strategies
        const stratResults = STRATEGIES.map(strat => {
            const w = strat.weights;
            const raw = ['胜', '平', '负'].map((label, i) => {
                const kelly = calcKelly(odds[i], probs[i]);
                const ev = calcEV(odds[i], probs[i]);
                return { label, odds: odds[i], prob: probs[i], kelly: Math.max(0, kelly), ev: Math.max(0, ev) };
            });

            // Bug#1 fix: normalize each factor to [0,1] before combining
            const kMax = Math.max(0.001, ...raw.map(r => r.kelly));
            const eMax = Math.max(0.001, ...raw.map(r => r.ev));
            const pMax = Math.max(0.001, ...raw.map(r => r.prob));
            const results = raw.map(r => ({
                ...r,
                score: w.kelly * (r.kelly / kMax)
                     + w.ev * (r.ev / eMax)
                     + w.implied * (r.prob / pMax)
            }));
            results.sort((a, b) => b.score - a.score);
            return {
                strategyId: strat.id,
                strategyName: strat.name,
                pick: results[0].label,
                score: results[0].score,
                confidence: results[0].prob > 0.45 ? '高' : results[0].prob > 0.35 ? '中' : '低',
                analysis: results
            };
        });

        // Pick the best strategy (weighted by learned accuracy + score)
        const stratAccuracy = params.strategyAccuracy || {};
        let bestStrat = stratResults[1]; // Default: balanced
        let bestWeight = -1;

        stratResults.forEach(sr => {
            // Bug#3 fix: check virtual_ key first (larger sample), then actual key
            const acc = stratAccuracy[`virtual_${sr.strategyId}`] || stratAccuracy[sr.strategyId];
            const accuracyBonus = acc && acc.total >= 5 ? acc.correct / acc.total : 0.33;
            const combined = sr.score * 0.6 + accuracyBonus * 0.4;
            if (combined > bestWeight) { bestWeight = combined; bestStrat = sr; }
        });

        return {
            matchNum: m.matchNum,
            league: m.league,
            home: m.home,
            away: m.away,
            date: m.date,
            pick: bestStrat.pick,
            confidence: bestStrat.confidence,
            strategy: bestStrat.strategyId,
            topPicks: bestStrat.analysis.slice(0, 2).map(r => ({
                label: r.label,
                prob: +(r.prob * 100).toFixed(1),
                ev: +(r.ev * 100).toFixed(2)
            })),
            allStrategies: stratResults.map(sr => ({
                id: sr.strategyId,
                pick: sr.pick,
                confidence: sr.confidence
            })),
            analysis: bestStrat.analysis
        };
    }).filter(Boolean);
}

// ========== 半全场推荐 ==========

function generateBQCPicks(matches, params) {
    const learnedLeagues = params.leagueParams || {};
    const BQC_LABELS = ['胜胜', '胜平', '胜负', '平胜', '平平', '平负', '负胜', '负平', '负负'];

    return matches.slice(0, 6).map(m => {
        const odds = [m.oddsW || 2, m.oddsD || 3, m.oddsL || 3];
        const lp = getLeagueParams(m.league, learnedLeagues);

        const ipRaw = odds.map(impliedProb);
        const margin = ipRaw.reduce((a, b) => a + b, 0);
        const fair = ipRaw.map(p => margin > 0 ? p / margin : 0.33);

        // Half-time model: calibrated from league data
        // Half-time draw probability is typically higher (~38-42%)
        const htDrawBase = 0.38 + lp.drawBias;
        // Distribute non-draw share proportionally to full-time win/loss probabilities
        const nonDraw = 1 - htDrawBase;
        const winShare = fair[0] / (fair[0] + fair[2] + 0.001);
        const htWin = nonDraw * winShare;
        const htDraw = htDrawBase;
        const htLoss = nonDraw * (1 - winShare);
        const halfProbs = [Math.max(0.05, htWin), Math.max(0.05, htDraw), Math.max(0.05, htLoss)];
        const hpSum = halfProbs.reduce((a, b) => a + b, 0);
        const hpNorm = halfProbs.map(p => p / hpSum);

        // Full-time conditional on half-time (Markov transition)
        // If winning at HT, high chance to win FT; less chance of reversal
        const transitions = [
            [0.75, 0.15, 0.10], // HT win -> FT
            [0.30, 0.40, 0.30], // HT draw -> FT
            [0.10, 0.15, 0.75]  // HT loss -> FT
        ];
        // Adjust transitions based on match strength + Bug#6 fix: renormalize rows
        const strength = fair[0] - fair[2]; // positive = home stronger
        transitions[0][0] = Math.min(0.85, transitions[0][0] + strength * 0.1);
        transitions[2][2] = Math.min(0.85, transitions[2][2] - strength * 0.1);
        // Renormalize each row so probabilities sum to 1
        transitions.forEach(row => {
            const rSum = row.reduce((a, b) => a + b, 0);
            if (rSum > 0) row.forEach((_, i) => row[i] /= rSum);
        });

        const combos = [];
        for (let h = 0; h < 3; h++) {
            for (let f = 0; f < 3; f++) {
                const prob = hpNorm[h] * transitions[h][f];
                combos.push({ label: BQC_LABELS[h * 3 + f], prob });
            }
        }
        const total = combos.reduce((a, c) => a + c.prob, 0);
        combos.forEach(c => c.prob = c.prob / total);
        combos.sort((a, b) => b.prob - a.prob);

        return {
            matchNum: m.matchNum, league: m.league, home: m.home, away: m.away, date: m.date,
            pick: combos[0].label,
            confidence: combos[0].prob > 0.30 ? '高' : combos[0].prob > 0.18 ? '中' : '低',
            topPicks: combos.slice(0, 3).map(c => ({ label: c.label, prob: +(c.prob * 100).toFixed(1) }))
        };
    });
}

// ========== 进球彩推荐 ==========

function generateJQPicks(matches, params) {
    const learnedLeagues = params.leagueParams || {};

    return matches.slice(0, 4).map(m => {
        const odds = [m.oddsW || 2, m.oddsD || 3, m.oddsL || 3];
        const lp = getLeagueParams(m.league, learnedLeagues);

        const ipRaw = odds.map(impliedProb);
        const margin = ipRaw.reduce((a, b) => a + b, 0);
        const fw = ipRaw[0] / margin, fl = ipRaw[2] / margin;

        // League-calibrated Poisson model
        const avgGoals = lp.avgGoals;
        const homeStr = fw / (fw + fl + 0.001);
        const awayStr = fl / (fw + fl + 0.001);

        function poissonDist(lambda) {
            const p = [];
            for (let g = 0; g <= 2; g++) p.push(Math.pow(lambda, g) * Math.exp(-lambda) / factorial(g));
            p.push(Math.max(0.03, 1 - p.reduce((a, b) => a + b, 0)));
            return p.map(v => Math.max(0.03, v));
        }

        // Home and away expected goals based on strength + league average
        // Bug#7 fix: simplified lambda — home gets proportional share of avgGoals
        const homeLambda = avgGoals * homeStr;
        const awayLambda = avgGoals * awayStr;

        const hp = poissonDist(homeLambda), ap = poissonDist(awayLambda);
        const hSum = hp.reduce((a, b) => a + b, 0), aSum = ap.reduce((a, b) => a + b, 0);
        const hNorm = hp.map(p => p / hSum), aNorm = ap.map(p => p / aSum);

        const hBest = hNorm.indexOf(Math.max(...hNorm));
        const aBest = aNorm.indexOf(Math.max(...aNorm));

        return {
            matchNum: m.matchNum, league: m.league, home: m.home, away: m.away, date: m.date,
            homePick: hBest >= 3 ? '3+' : String(hBest),
            awayPick: aBest >= 3 ? '3+' : String(aBest),
            confidence: hNorm[hBest] > 0.40 ? '高' : hNorm[hBest] > 0.30 ? '中' : '低',
            expectedGoals: { home: +homeLambda.toFixed(2), away: +awayLambda.toFixed(2) },
            homeProbs: hNorm.map((p, i) => ({ goals: i >= 3 ? '3+' : String(i), prob: +(p * 100).toFixed(1) })),
            awayProbs: aNorm.map((p, i) => ({ goals: i >= 3 ? '3+' : String(i), prob: +(p * 100).toFixed(1) }))
        };
    });
}

// ========== 主逻辑 ==========

async function main() {
    console.log('🎯 足彩推荐方案生成 V2.0 开始...\n');

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
    console.log(`⚽ 赛事数据: ${matches.length} 场`);
    console.log(`🧠 模型版本: v${params.version}\n`);

    // Generate picks for each game type
    const sfPicks = generateSFPicks(matches.slice(0, 14), params);
    // Bug#5 fix: R9 reuses SF results instead of recalculating
    const r9Picks = [...sfPicks];
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
        strategies: STRATEGIES.map(s => ({ id: s.id, name: s.name, desc: s.desc })),
        sf: { name: '胜负游戏', picks: sfPicks },
        r9: { name: '任选9场', picks: r9Selected },
        bqc: { name: '6场半全场', picks: bqcPicks },
        jq: { name: '4场进球', picks: jqPicks },
        status: 'pending'
    };

    // Save
    if (!fs.existsSync(PICKS_DIR)) fs.mkdirSync(PICKS_DIR, { recursive: true });
    const archiveFile = path.join(PICKS_DIR, `${dateStr}.json`);
    fs.writeFileSync(archiveFile, JSON.stringify(picks, null, 2), 'utf8');
    const latestFile = path.join(PICKS_DIR, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(picks, null, 2), 'utf8');

    // Log
    console.log('── 推荐方案 ──');
    console.log(`\n  胜负游戏 (${sfPicks.length} 场):`);
    sfPicks.forEach(p => {
        const allStrats = p.allStrategies.map(s => `${s.id[0].toUpperCase()}:${s.pick}`).join(' ');
        console.log(`    ${p.home} vs ${p.away}: ${p.pick} (${p.confidence}) [${allStrats}] via ${p.strategy}`);
    });
    console.log(`\n  任选9场 (${r9Selected.length} 场 最高信心)`);
    console.log(`\n  半全场 (${bqcPicks.length} 场):`);
    bqcPicks.forEach(p => console.log(`    ${p.home} vs ${p.away}: ${p.pick} (${p.confidence})`));
    console.log(`\n  进球彩 (${jqPicks.length} 场):`);
    jqPicks.forEach(p => console.log(`    ${p.home} vs ${p.away}: 主${p.homePick} 客${p.awayPick} (${p.confidence}) λ=${p.expectedGoals.home}/${p.expectedGoals.away}`));

    console.log(`\n💾 存档: ${archiveFile}`);
    console.log(`💾 最新: ${latestFile}`);
    console.log('✅ 推荐方案生成完成!\n');
}

main().catch(e => { console.error('❌ 致命错误:', e.message); process.exit(1); });
