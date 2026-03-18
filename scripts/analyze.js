#!/usr/bin/env node
/**
 * 📊 DLT 深度分析与智能预测脚本 V4.0
 * 
 * 改进:
 *   - 区间/奇偶/连号/和值/尾数 5维分析
 *   - 多窗口(5/20/100期)加权评分
 *   - Per-strategy权重EMA进化
 *   - 和值约束 + 连号注入
 *   - 4高级算法集成(马尔/间隔/贝叶斯/蒙特卡洛)
 *   - 交叉验证回测
 * 
 * 运行: node scripts/analyze.js
 * 输出: data/analysis.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const ANALYSIS_FILE = path.join(DATA_DIR, 'analysis.json');

// 导入集成引擎
const { ensembleScores, markovScores, pickTopN } = require('./ensemble-engine');

// ========== 基础工具 ==========

function loadJSON(file) {
    if (!fs.existsSync(file)) return null;
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function calcFrequency(issues, maxNum, selector) {
    const freq = {};
    for (let i = 1; i <= maxNum; i++) freq[i] = 0;
    issues.forEach(d => selector(d).forEach(n => freq[n]++));
    return freq;
}

function calcMissing(issues, maxNum, selector) {
    const miss = {};
    for (let i = 1; i <= maxNum; i++) {
        let count = 0;
        for (const d of issues) {
            if (selector(d).includes(i)) break;
            count++;
        }
        miss[i] = count;
    }
    return miss;
}

// ========== 新增: 多维度分析 ==========

// 区间分析: 前区分3区(1-12, 13-24, 25-35)
function calcZoneDistribution(issues, selector) {
    const zones = { '1-12': 0, '13-24': 0, '25-35': 0 };
    const zoneCombos = {}; // e.g. "2:2:1" -> count
    issues.forEach(d => {
        const nums = selector(d);
        let z1 = 0, z2 = 0, z3 = 0;
        nums.forEach(n => { if (n <= 12) z1++; else if (n <= 24) z2++; else z3++; });
        zones['1-12'] += z1; zones['13-24'] += z2; zones['25-35'] += z3;
        const key = `${z1}:${z2}:${z3}`;
        zoneCombos[key] = (zoneCombos[key] || 0) + 1;
    });
    return { zones, zoneCombos };
}

// 奇偶比分析
function calcParityRatio(issues, selector) {
    const ratios = {};
    issues.forEach(d => {
        const nums = selector(d);
        const odd = nums.filter(n => n % 2 === 1).length;
        const even = nums.length - odd;
        const key = `${odd}:${even}`;
        ratios[key] = (ratios[key] || 0) + 1;
    });
    return ratios;
}

// 连号检测
function calcConsecutive(issues, selector) {
    let withConsec = 0;
    const consecPairs = {};
    issues.forEach(d => {
        const nums = selector(d).sort((a, b) => a - b);
        let hasConsec = false;
        for (let i = 0; i < nums.length - 1; i++) {
            if (nums[i + 1] - nums[i] === 1) {
                hasConsec = true;
                const pair = `${nums[i]}-${nums[i + 1]}`;
                consecPairs[pair] = (consecPairs[pair] || 0) + 1;
            }
        }
        if (hasConsec) withConsec++;
    });
    return { rate: withConsec / issues.length, consecPairs };
}

// 和值分析
function calcSumStats(issues, selector) {
    const sums = issues.map(d => selector(d).reduce((a, b) => a + b, 0));
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const variance = sums.reduce((a, b) => a + (b - mean) ** 2, 0) / sums.length;
    const std = Math.sqrt(variance);
    return { mean: +mean.toFixed(1), std: +std.toFixed(1), min: Math.min(...sums), max: Math.max(...sums) };
}

// 尾数分析
function calcTailDigits(issues, selector) {
    const tails = {};
    for (let i = 0; i <= 9; i++) tails[i] = 0;
    issues.forEach(d => selector(d).forEach(n => tails[n % 10]++));
    return tails;
}

// ========== 多窗口加权评分 ==========

function multiWindowScore(issues, maxNum, selector) {
    const windows = [
        { len: 5, weight: 0.40, label: '近5期' },
        { len: 20, weight: 0.35, label: '近20期' },
        { len: Math.min(100, issues.length), weight: 0.25, label: '全期' }
    ];

    const freq = {}, miss = {};
    for (let i = 1; i <= maxNum; i++) { freq[i] = 0; miss[i] = 0; }

    windows.forEach(w => {
        const subset = issues.slice(0, w.len);
        const f = calcFrequency(subset, maxNum, selector);
        const fMax = Math.max(1, ...Object.values(f));
        for (let i = 1; i <= maxNum; i++) {
            freq[i] += (f[i] / fMax) * w.weight;
        }
    });

    // Missing stays global
    const globalMiss = calcMissing(issues, maxNum, selector);
    const mMax = Math.max(1, ...Object.values(globalMiss));
    for (let i = 1; i <= maxNum; i++) miss[i] = globalMiss[i] / mMax;

    return { freq, miss };
}

// ========== 综合评分 V2 ==========

function scoreNumbersV2(freq, miss, maxNum, weights, patterns) {
    const scores = {};
    const { zoneTarget, parityTarget, tailBoost } = patterns;

    for (let i = 1; i <= maxNum; i++) {
        let score = freq[i] * weights.wFreq + miss[i] * weights.wMiss;

        // Zone bonus: boost numbers in underrepresented zones
        if (zoneTarget) {
            const zone = i <= 12 ? 0 : i <= 24 ? 1 : 2;
            score += (zoneTarget[zone] || 0) * weights.wZone;
        }

        // Tail digit bonus
        if (tailBoost) {
            score += (tailBoost[i % 10] || 0) * weights.wTail;
        }

        // Bug#10 fix: random factor scaled by wRand weight for strategy differentiation
        score += Math.random() * (weights.wRand || 0.05);
        scores[i] = score;
    }
    return scores;
}

function pickByScore(scores, count) {
    return Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(e => Number(e[0]))
        .sort((a, b) => a - b);
}

// ========== 约束: 和值 + 连号 ==========

function validateSum(front, sumStats) {
    const sum = front.reduce((a, b) => a + b, 0);
    // Bug#9 fix: tighten from 1.5σ to 1.0σ for more meaningful constraint
    return sum >= sumStats.mean - 1.0 * sumStats.std && sum <= sumStats.mean + 1.0 * sumStats.std;
}

function injectConsecutive(front, maxNum, consecRate, scores) {
    if (Math.random() > consecRate) return front; // No consecutive needed
    // Try to add a consecutive pair
    const sorted = [...front].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1] - sorted[i] === 1) return front; // Already has one
    }
    // Bug#5 fix: replace the LOWEST-scored number, not blindly the last
    const pivot = sorted[Math.floor(Math.random() * sorted.length)];
    const neighbor = pivot + 1 <= maxNum ? pivot + 1 : pivot - 1;
    if (neighbor >= 1 && neighbor <= maxNum && !front.includes(neighbor)) {
        // Find the lowest-scored number to replace
        let worstIdx = 0, worstScore = Infinity;
        front.forEach((n, idx) => {
            const s = scores ? (scores[n] || 0) : 0;
            if (s < worstScore && n !== pivot) { worstScore = s; worstIdx = idx; }
        });
        front[worstIdx] = neighbor;
        return front.sort((a, b) => a - b);
    }
    return front;
}

function validateParity(front, parityTarget) {
    if (!parityTarget) return true;
    const odd = front.filter(n => n % 2 === 1).length;
    const even = front.length - odd;
    const key = `${odd}:${even}`;
    return parityTarget.includes(key);
}

function generateWithConstraints(scores, count, maxNum, constraints, maxAttempts = 50) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Add randomness on each attempt
        const adjustedScores = {};
        for (const [k, v] of Object.entries(scores)) {
            adjustedScores[k] = v + Math.random() * 0.15 * attempt / maxAttempts;
        }
        let pick = pickByScore(adjustedScores, count);

        if (constraints.consecRate > 0.4) {
            pick = injectConsecutive(pick, maxNum, constraints.consecRate, adjustedScores);
        }
        if (constraints.sumStats && !validateSum(pick, constraints.sumStats)) continue;
        if (constraints.topParities && !validateParity(pick, constraints.topParities)) continue;

        return pick;
    }
    // Fallback: return without constraints
    return pickByScore(scores, count);
}

function randomPick(max, count) {
    const pool = Array.from({ length: max }, (_, i) => i + 1);
    const result = [];
    while (result.length < count) {
        const idx = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(idx, 1)[0]);
    }
    return result.sort((a, b) => a - b);
}

// ========== 策略定义 V4 (集成引擎) ==========
// 排序: ensemble(新) > adaptive > markov(新) > pattern > hot > balanced > cold > random

const DEFAULT_STRATEGIES = [
    { id: 'ensemble', name: '🧠 集成·四算法', engine: 'ensemble' },
    { id: 'adaptive', name: '🎯 首推·自适应', wFreq: 0.40, wMiss: 0.15, wZone: 0.15, wTail: 0.10, wRand: 0.20 },
    { id: 'markov',   name: '🔗 马尔可夫链', engine: 'markov' },
    { id: 'pattern',  name: '📊 模式匹配',   wFreq: 0.20, wMiss: 0.15, wZone: 0.30, wTail: 0.25, wRand: 0.10 },
    { id: 'hot',      name: '🔥 热号趋势',   wFreq: 0.55, wMiss: 0.05, wZone: 0.20, wTail: 0.10, wRand: 0.10 },
    { id: 'balanced', name: '⚖️ 均衡推荐',   wFreq: 0.30, wMiss: 0.25, wZone: 0.20, wTail: 0.15, wRand: 0.10 },
    { id: 'cold',     name: '❄️ 冷号实验',   wFreq: 0.20, wMiss: 0.40, wZone: 0.15, wTail: 0.10, wRand: 0.15 },
    { id: 'random',   name: '🎲 随机基准',   wFreq: 0, wMiss: 0, wZone: 0, wTail: 0, wRand: 1 }
];

// ========== 奖级计算 ==========

// 官方7级中奖判定 (lottery.gov.cn 2019年版)
function calcHitLevel(fHits, bHits) {
    if (fHits === 5 && bHits === 2) return '一等奖';
    if (fHits === 5 && bHits === 1) return '二等奖';
    if ((fHits === 5 && bHits === 0) || (fHits === 4 && bHits === 2)) return '三等奖';
    if (fHits === 4 && bHits === 1) return '四等奖';
    if ((fHits === 4 && bHits === 0) || (fHits === 3 && bHits === 2)) return '五等奖';
    if ((fHits === 3 && bHits === 1) || (fHits === 2 && bHits === 2)) return '六等奖';
    if ((fHits === 3 && bHits === 0) || (fHits === 2 && bHits === 1) || (fHits === 1 && bHits === 2) || (fHits === 0 && bHits === 2)) return '七等奖';
    return '未中奖';
}

// ========== 自适应权重进化 ==========

function evolveStrategyWeights(strategies, perf, prevAnalysis) {
    const evolved = strategies.map(s => ({ ...s }));
    const emaDecay = 0.85; // Exponential moving average decay

    evolved.forEach(s => {
        if (s.id === 'random' || s.id === 'adaptive') return;
        const p = perf[s.id];
        if (!p || p.total < 3) return;

        // Compute performance score: front hits matter more
        const avgFront = p.totalFrontHits / p.total;
        const avgBack = p.totalBackHits / p.total;
        const perfScore = avgFront / 5 + avgBack / 2; // Normalized 0-1 each

        // Get previous weights for EMA
        const prev = prevAnalysis?.evolvedStrategies?.find(ps => ps.id === s.id);

        // Direction: if front hits above random baseline (~0.71/5), boost freq; if below, boost miss
        const frontBaseline = 5 / 35 * 5; // ~0.71 expected by random
        if (avgFront > frontBaseline * 1.2) {
            // Strategy is working — reinforce
            s.wFreq = Math.min(0.65, s.wFreq + 0.02);
        } else if (avgFront < frontBaseline * 0.8) {
            // Strategy underperforming — diversify
            s.wMiss = Math.min(0.60, s.wMiss + 0.02);
            s.wFreq = Math.max(0.05, s.wFreq - 0.01);
        }

        // Bug#2 fix: EMA smoothing — decay preserves HISTORY, (1-decay) adopts NEW value
        if (prev) {
            s.wFreq = (1 - emaDecay) * s.wFreq + emaDecay * prev.wFreq;
            s.wMiss = (1 - emaDecay) * s.wMiss + emaDecay * prev.wMiss;
            s.wZone = (1 - emaDecay) * s.wZone + emaDecay * (prev.wZone || 0.15);
            s.wTail = (1 - emaDecay) * s.wTail + emaDecay * (prev.wTail || 0.10);
        }

        // Normalize
        const sum = s.wFreq + s.wMiss + s.wZone + s.wTail + s.wRand;
        s.wFreq = +(s.wFreq / sum).toFixed(4);
        s.wMiss = +(s.wMiss / sum).toFixed(4);
        s.wZone = +(s.wZone / sum).toFixed(4);
        s.wTail = +(s.wTail / sum).toFixed(4);
        s.wRand = +(s.wRand / sum).toFixed(4);
    });

    // Build adaptive from best performer
    const adaptiveStrat = evolved.find(s => s.id === 'adaptive');
    let bestId = null, bestScore = -1;
    ['hot', 'cold', 'balanced', 'pattern'].forEach(id => {
        const p = perf[id];
        if (p && p.total >= 3) {
            const score = (p.totalFrontHits / p.total) / 5 + (p.totalBackHits / p.total) / 2;
            if (score > bestScore) { bestScore = score; bestId = id; }
        }
    });
    if (bestId && adaptiveStrat) {
        const src = evolved.find(s => s.id === bestId);
        // Blend 70% best + 30% current adaptive
        adaptiveStrat.wFreq = +(0.7 * src.wFreq + 0.3 * adaptiveStrat.wFreq).toFixed(4);
        adaptiveStrat.wMiss = +(0.7 * src.wMiss + 0.3 * adaptiveStrat.wMiss).toFixed(4);
        adaptiveStrat.wZone = +(0.7 * src.wZone + 0.3 * adaptiveStrat.wZone).toFixed(4);
        adaptiveStrat.wTail = +(0.7 * src.wTail + 0.3 * adaptiveStrat.wTail).toFixed(4);
        adaptiveStrat.wRand = +(0.7 * src.wRand + 0.3 * adaptiveStrat.wRand).toFixed(4);
        console.log(`  🎯 自适应学习: 向 ${src.name} 倾斜 (得分 ${bestScore.toFixed(3)})`);
    }

    return evolved;
}

// ========== 主逻辑 ==========

function main() {
    console.log('📊 大乐透深度分析 V2.0 开始...\n');

    const history = loadJSON(HISTORY_FILE);
    if (!history?.issues?.length) { console.error('❌ history.json 不存在'); process.exit(1); }
    const issues = history.issues;
    console.log(`📂 加载 ${issues.length} 期数据，最新: 第 ${issues[0]?.issue} 期\n`);
    if (issues.length < 10) { console.error('❌ 数据不足10期'); process.exit(1); }

    // ===== 1. 多维度分析 =====
    console.log('── 多维度分析 ──');

    // 多窗口频率+遗漏
    const frontMW = multiWindowScore(issues, 35, d => d.front);
    const backMW = multiWindowScore(issues, 12, d => d.back);

    // 区间分析
    const zoneData = calcZoneDistribution(issues, d => d.front);
    const topZoneCombos = Object.entries(zoneData.zoneCombos)
        .sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`  📊 区间高频组合: ${topZoneCombos.map(([k, v]) => `${k}(${v}次)`).join(', ')}`);

    // Bug#1 fix: use multi-window weighted zone target instead of all-time most frequent
    const recentZones = calcZoneDistribution(issues.slice(0, 10), d => d.front);
    const recentTop = Object.entries(recentZones.zoneCombos).sort((a, b) => b[1] - a[1]);
    const recentCombo = recentTop.length > 0 ? recentTop[0][0] : topZoneCombos[0][0];
    const globalCombo = topZoneCombos[0][0];
    // Blend: 60% recent(10期) + 40% global
    const rz = recentCombo.split(':').map(Number);
    const gz = globalCombo.split(':').map(Number);
    const zoneTarget = [
        (rz[0] * 0.6 + gz[0] * 0.4) / 5,
        (rz[1] * 0.6 + gz[1] * 0.4) / 5,
        (rz[2] * 0.6 + gz[2] * 0.4) / 5
    ];

    // 奇偶比
    const parityData = calcParityRatio(issues, d => d.front);
    const topParities = Object.entries(parityData)
        .sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    console.log(`  🔢 奇偶比高频: ${topParities.join(', ')}`);

    // 连号
    const consecData = calcConsecutive(issues, d => d.front);
    console.log(`  🔗 连号出现率: ${(consecData.rate * 100).toFixed(1)}%`);

    // 和值
    const frontSumStats = calcSumStats(issues, d => d.front);
    const backSumStats = calcSumStats(issues, d => d.back);
    console.log(`  ∑ 前区和值: μ=${frontSumStats.mean} σ=${frontSumStats.std} [${frontSumStats.min}-${frontSumStats.max}]`);

    // 尾数
    const tailData = calcTailDigits(issues, d => d.front);
    const tailMax = Math.max(1, ...Object.values(tailData));
    const tailBoost = {};
    for (let i = 0; i <= 9; i++) tailBoost[i] = tailData[i] / tailMax;
    console.log(`  🔹 尾数频率: ${Object.entries(tailBoost).map(([k, v]) => `${k}:${(v * 100).toFixed(0)}%`).join(' ')}`);

    // Hot/cold numbers
    const frontFreq = calcFrequency(issues, 35, d => d.front);
    const backFreq = calcFrequency(issues, 12, d => d.back);
    const hotFront = Object.entries(frontFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => Number(e[0]));
    const coldFront = Object.entries(frontFreq).sort((a, b) => a[1] - b[1]).slice(0, 10).map(e => Number(e[0]));
    const hotBack = Object.entries(backFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => Number(e[0]));
    console.log(`\n  🔥 前区热号: ${hotFront.join(', ')}`);
    console.log(`  ❄️ 前区冷号: ${coldFront.join(', ')}`);
    console.log(`  🔵 后区热号: ${hotBack.join(', ')}`);

    // ===== 2. 策略进化 =====
    const prevAnalysis = loadJSON(ANALYSIS_FILE);
    let strategyPerf = prevAnalysis?.strategyPerformance || {};
    let strategies = [...DEFAULT_STRATEGIES];

    if (Object.values(strategyPerf).some(p => p.total >= 3)) {
        console.log('\n── 策略权重进化 ──');
        strategies = evolveStrategyWeights(strategies, strategyPerf, prevAnalysis);
        strategies.forEach(s => {
            if (s.id !== 'random') {
                console.log(`  ${s.name}: F=${s.wFreq} M=${s.wMiss} Z=${s.wZone} T=${s.wTail}`);
            }
        });
    }

    // ===== 3. 生成预测 =====
    const nextIssue = String(parseInt(issues[0].issue) + 1);
    console.log(`\n── 生成第 ${nextIssue} 期预测 ──\n`);

    const patterns = { zoneTarget, topParities, tailBoost };
    const constraints = {
        consecRate: consecData.rate,
        sumStats: frontSumStats,
        topParities
    };

    const predictions = strategies.map(strat => {
        let front, back;
        if (strat.id === 'random') {
            front = randomPick(35, 5);
            back = randomPick(12, 2);
        } else if (strat.engine === 'ensemble') {
            // 集成引擎: 4算法融合
            const { scores: fs } = ensembleScores(issues, 35, d => d.front);
            const { scores: bs } = ensembleScores(issues, 12, d => d.back);
            front = pickTopN(fs, 5);
            back = pickTopN(bs, 2);
        } else if (strat.engine === 'markov') {
            // 马尔可夫链
            const fs = markovScores(issues, 35, d => d.front);
            const bs = markovScores(issues, 12, d => d.back);
            front = generateWithConstraints(fs, 5, 35, constraints);
            back = pickTopN(bs, 2);
        } else {
            const fScores = scoreNumbersV2(frontMW.freq, frontMW.miss, 35, strat, patterns);
            // Bug#6 fix: no tailBoost for back zone
            const bScores = scoreNumbersV2(backMW.freq, backMW.miss, 12,
                { ...strat, wZone: 0, wTail: 0 },
                { zoneTarget: null, tailBoost: null });
            front = generateWithConstraints(fScores, 5, 35, constraints);
            back = pickByScore(bScores, 2);
        }
        const fStr = front.map(n => String(n).padStart(2, '0')).join(' ');
        const bStr = back.map(n => String(n).padStart(2, '0')).join(' ');
        console.log(`  ${strat.name}: ${fStr} + ${bStr}`);
        return { strategyId: strat.id, label: strat.name, front, back };
    });

    // ===== 4. 对比历史预测 =====
    let predictionRecords = prevAnalysis?.predictionRecords || [];
    let comparedCount = 0;

    predictionRecords.forEach(record => {
        if (record.compared) return;
        const draw = issues.find(d => String(d.issue) === String(record.targetIssue));
        if (!draw) return;
        record.result = { front: draw.front, back: draw.back };
        record.compared = true;
        record.hits = record.predictions.map(p => {
            const fHits = p.front.filter(n => draw.front.includes(n)).length;
            const bHits = p.back.filter(n => draw.back.includes(n)).length;
            return { frontHits: fHits, backHits: bHits, level: calcHitLevel(fHits, bHits) };
        });
        record.predictions.forEach((p, i) => {
            const id = p.strategyId;
            if (!strategyPerf[id]) strategyPerf[id] = { total: 0, totalFrontHits: 0, totalBackHits: 0, bestFront: 0, bestBack: 0 };
            const sp = strategyPerf[id];
            // Bug#4 fix: decay old data before adding new
            sp.totalFrontHits *= 0.95; sp.totalBackHits *= 0.95; sp.total = sp.total * 0.95 + 1;
            sp.totalFrontHits += record.hits[i].frontHits; sp.totalBackHits += record.hits[i].backHits;
            // Bug#7 fix: also update best when frontHits equal but backHits higher
            if (record.hits[i].frontHits > sp.bestFront || (record.hits[i].frontHits === sp.bestFront && record.hits[i].backHits > sp.bestBack)) {
                sp.bestFront = record.hits[i].frontHits; sp.bestBack = record.hits[i].backHits;
            }
        });
        comparedCount++;
    });

    if (comparedCount > 0) console.log(`\n📋 自动对比了 ${comparedCount} 期历史预测`);

    // Add current prediction
    const alreadyPredicted = predictionRecords.find(r => r.targetIssue === nextIssue && !r.compared);
    if (!alreadyPredicted) {
        predictionRecords.unshift({
            targetIssue: nextIssue,
            createdAt: new Date().toISOString(),
            predictions,
            result: null,
            compared: false,
            hits: null
        });
    }
    if (predictionRecords.length > 50) predictionRecords = predictionRecords.slice(0, 50);

    // ===== 5. 输出 =====
    const frontMiss = calcMissing(issues, 35, d => d.front);
    const backMiss = calcMissing(issues, 12, d => d.back);

    // ===== 5a. 缩水+轮转覆盖 =====
    let smartPickResult = null;
    try {
        const { smartPick } = require('./smart-pick');
        smartPickResult = smartPick(issues, 'both');
    } catch (e) {
        console.log(`\n⚠️ 智能缩水跳过: ${e.message}`);
    }

    const output = {
        lastUpdate: new Date().toISOString(),
        latestIssue: issues[0].issue,
        nextIssue,
        analysisRange: issues.length,
        modelVersion: (prevAnalysis?.modelVersion || 0) + 1,
        summary: {
            hotFront, coldFront, hotBack,
            frontFrequency: frontFreq,
            frontMissing: frontMiss,
            backFrequency: backFreq,
            backMissing: backMiss,
            zoneDistribution: zoneData,
            parityRatio: parityData,
            consecutiveRate: +(consecData.rate * 100).toFixed(1),
            frontSumStats,
            backSumStats,
            tailDigits: tailData
        },
        currentPrediction: { targetIssue: nextIssue, predictions },
        smartPick: smartPickResult,
        predictionRecords,
        strategyPerformance: strategyPerf,
        evolvedStrategies: strategies.filter(s => s.id !== 'random')
    };

    fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(output, null, 2), 'utf8');

    // Print strategy performance
    console.log('\n── 策略表现汇总 ──');
    console.log('─'.repeat(70));
    strategies.forEach(s => {
        const p = strategyPerf[s.id];
        if (!p || p.total === 0) { console.log(`  ${s.name}: 暂无数据`); return; }
        console.log(`  ${s.name}: ${p.total}次 | 前区 ${(p.totalFrontHits / p.total).toFixed(2)}/5 | 后区 ${(p.totalBackHits / p.total).toFixed(2)}/2 | 最佳 ${p.bestFront}+${p.bestBack}`);
    });

    console.log(`\n💾 分析结果已保存: ${ANALYSIS_FILE}`);
    console.log(`🧠 模型版本: v${output.modelVersion}`);
    console.log('✅ 深度分析完成!\n');
}

main();
