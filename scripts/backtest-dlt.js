#!/usr/bin/env node
/**
 * 🔬 大乐透回测验证脚本
 * 
 * 用历史数据模拟"预测→比对→进化"循环：
 *   - 取前N期作为训练数据，预测第N+1期
 *   - 与真实开奖比对，统计命中率
 *   - 权重根据比对结果进化(EMA)
 *   - 滚动窗口覆盖全部102期
 * 
 * 运行: node scripts/backtest-dlt.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

const { ensembleScores, markovScores, pickTopN } = require('./ensemble-engine');

function loadJSON(file) {
    if (!fs.existsSync(file)) return null;
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// ========== 核心分析函数 (与 analyze.js 一致) ==========

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

function multiWindowScore(issues, maxNum, selector) {
    const windows = [
        { len: 5, weight: 0.40 },
        { len: 20, weight: 0.35 },
        { len: Math.min(100, issues.length), weight: 0.25 }
    ];
    const freq = {}, miss = {};
    for (let i = 1; i <= maxNum; i++) { freq[i] = 0; miss[i] = 0; }
    windows.forEach(w => {
        const subset = issues.slice(0, w.len);
        const f = calcFrequency(subset, maxNum, selector);
        const fMax = Math.max(1, ...Object.values(f));
        for (let i = 1; i <= maxNum; i++) freq[i] += (f[i] / fMax) * w.weight;
    });
    const globalMiss = calcMissing(issues, maxNum, selector);
    const mMax = Math.max(1, ...Object.values(globalMiss));
    for (let i = 1; i <= maxNum; i++) miss[i] = globalMiss[i] / mMax;
    return { freq, miss };
}

function calcZoneDistribution(issues, selector) {
    const zoneCombos = {};
    issues.forEach(d => {
        const nums = selector(d);
        let z1 = 0, z2 = 0, z3 = 0;
        nums.forEach(n => { if (n <= 12) z1++; else if (n <= 24) z2++; else z3++; });
        const key = `${z1}:${z2}:${z3}`;
        zoneCombos[key] = (zoneCombos[key] || 0) + 1;
    });
    return zoneCombos;
}

function calcTailDigits(issues, selector) {
    const tails = {};
    for (let i = 0; i <= 9; i++) tails[i] = 0;
    issues.forEach(d => selector(d).forEach(n => tails[n % 10]++));
    return tails;
}

function calcSumStats(issues, selector) {
    const sums = issues.map(d => selector(d).reduce((a, b) => a + b, 0));
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const variance = sums.reduce((a, b) => a + (b - mean) ** 2, 0) / sums.length;
    return { mean, std: Math.sqrt(variance) };
}

function calcConsecutive(issues, selector) {
    let withConsec = 0;
    issues.forEach(d => {
        const nums = selector(d).sort((a, b) => a - b);
        for (let i = 0; i < nums.length - 1; i++) {
            if (nums[i + 1] - nums[i] === 1) { withConsec++; break; }
        }
    });
    return withConsec / issues.length;
}

function scoreNumbersV2(freq, miss, maxNum, weights, patterns) {
    const scores = {};
    const { zoneTarget, tailBoost } = patterns;
    for (let i = 1; i <= maxNum; i++) {
        let score = freq[i] * weights.wFreq + miss[i] * weights.wMiss;
        if (zoneTarget) {
            const zone = i <= 12 ? 0 : i <= 24 ? 1 : 2;
            score += (zoneTarget[zone] || 0) * weights.wZone;
        }
        if (tailBoost) score += (tailBoost[i % 10] || 0) * weights.wTail;
        score += Math.random() * (weights.wRand || 0.05);
        scores[i] = score;
    }
    return scores;
}

function pickByScore(scores, count) {
    return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, count).map(e => Number(e[0])).sort((a, b) => a - b);
}

function validateSum(front, sumStats) {
    const sum = front.reduce((a, b) => a + b, 0);
    return sum >= sumStats.mean - 1.0 * sumStats.std && sum <= sumStats.mean + 1.0 * sumStats.std;
}

function validateParity(front, parityTarget) {
    if (!parityTarget) return true;
    const odd = front.filter(n => n % 2 === 1).length;
    return parityTarget.includes(`${odd}:${5 - odd}`);
}

function generateWithConstraints(scores, count, maxNum, constraints, maxAttempts = 50) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const adjustedScores = {};
        for (const [k, v] of Object.entries(scores)) {
            adjustedScores[k] = v + Math.random() * 0.15 * attempt / maxAttempts;
        }
        let pick = pickByScore(adjustedScores, count);
        if (constraints.sumStats && !validateSum(pick, constraints.sumStats)) continue;
        if (constraints.topParities && !validateParity(pick, constraints.topParities)) continue;
        return pick;
    }
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

// ========== 策略定义 V4 (集成引擎) ==========

const STRATEGIES = [
    { id: 'ensemble', name: '🧠 集成·四算法', engine: 'ensemble' },
    { id: 'adaptive', name: '🎯 自适应',   wFreq: 0.40, wMiss: 0.15, wZone: 0.15, wTail: 0.10, wRand: 0.20 },
    { id: 'markov',   name: '🔗 马尔可夫链', engine: 'markov' },
    { id: 'pattern',  name: '📊 模式匹配', wFreq: 0.20, wMiss: 0.15, wZone: 0.30, wTail: 0.25, wRand: 0.10 },
    { id: 'hot',      name: '🔥 热号趋势', wFreq: 0.55, wMiss: 0.05, wZone: 0.20, wTail: 0.10, wRand: 0.10 },
    { id: 'balanced', name: '⚖️ 均衡推荐', wFreq: 0.30, wMiss: 0.25, wZone: 0.20, wTail: 0.15, wRand: 0.10 },
    { id: 'cold',     name: '❄️ 冷号实验', wFreq: 0.20, wMiss: 0.40, wZone: 0.15, wTail: 0.10, wRand: 0.15 },
    { id: 'random',   name: '🎲 随机基准', wFreq: 0, wMiss: 0, wZone: 0, wTail: 0, wRand: 1 }
];

// ========== 主回测逻辑 ==========

function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔬 大乐透回测验证 — 滚动窗口模拟');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const history = loadJSON(HISTORY_FILE);
    if (!history?.issues?.length) { console.error('❌ history.json 不存在'); process.exit(1); }

    const allIssues = history.issues; // 最新在前
    const totalPeriods = allIssues.length;
    const MIN_TRAIN = 20; // 至少20期训练数据
    const testPeriods = totalPeriods - MIN_TRAIN;
    
    console.log(`📊 总数据: ${totalPeriods} 期`);
    console.log(`📏 训练窗口: 前 ${MIN_TRAIN}~${totalPeriods-1} 期 (滚动增长)`);
    console.log(`🎯 测试期数: ${testPeriods} 期 (第${allIssues[testPeriods-1].issue}~${allIssues[0].issue}期)\n`);

    // 统计容器
    const stats = {};
    STRATEGIES.forEach(s => {
        stats[s.id] = {
            name: s.name,
            total: 0,
            frontHits: [], backHits: [], totalHits: [],
            levels: {},
            prizePeriods: 0, // 中任何奖的期数
            front3plus: 0,   // 前区≥3的次数
            bestFront: 0, bestBack: 0,
            // 进化权重追踪
            weights: { ...s }
        };
    });

    // 随机基准: 运行多次取平均
    const RANDOM_RUNS = 5;

    // ========== 滚动回测 ==========
    for (let testIdx = testPeriods - 1; testIdx >= 0; testIdx--) {
        const target = allIssues[testIdx]; // 要预测的期
        const trainData = allIssues.slice(testIdx + 1); // 之前的数据作为训练

        // 分析训练数据
        const frontMW = multiWindowScore(trainData, 35, d => d.front);
        const backMW = multiWindowScore(trainData, 12, d => d.back);

        // 区间分析
        const allZones = calcZoneDistribution(trainData, d => d.front);
        const topZones = Object.entries(allZones).sort((a, b) => b[1] - a[1]);
        const recentZones = calcZoneDistribution(trainData.slice(0, 10), d => d.front);
        const recentTop = Object.entries(recentZones).sort((a, b) => b[1] - a[1]);
        const rz = (recentTop[0]?.[0] || '2:2:1').split(':').map(Number);
        const gz = (topZones[0]?.[0] || '2:2:1').split(':').map(Number);
        const zoneTarget = [
            (rz[0] * 0.6 + gz[0] * 0.4) / 5,
            (rz[1] * 0.6 + gz[1] * 0.4) / 5,
            (rz[2] * 0.6 + gz[2] * 0.4) / 5
        ];

        // 尾数
        const tailData = calcTailDigits(trainData, d => d.front);
        const tailMax = Math.max(1, ...Object.values(tailData));
        const tailBoost = {};
        for (let i = 0; i <= 9; i++) tailBoost[i] = tailData[i] / tailMax;

        // 约束
        const sumStats = calcSumStats(trainData, d => d.front);
        const consecRate = calcConsecutive(trainData, d => d.front);
        const parityData = {};
        trainData.forEach(d => {
            const odd = d.front.filter(n => n % 2 === 1).length;
            const k = `${odd}:${5 - odd}`;
            parityData[k] = (parityData[k] || 0) + 1;
        });
        const topParities = Object.entries(parityData).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

        const patterns = { zoneTarget, tailBoost };
        const constraints = { consecRate, sumStats, topParities };

        // 对每个策略生成预测
        STRATEGIES.forEach(strat => {
            const st = stats[strat.id];
            let runCount = strat.id === 'random' ? RANDOM_RUNS : 1;
            
            for (let run = 0; run < runCount; run++) {
                let front, back;
                if (strat.id === 'random') {
                    front = randomPick(35, 5);
                    back = randomPick(12, 2);
                } else if (strat.engine === 'ensemble') {
                    const { scores: fs } = ensembleScores(trainData, 35, d => d.front);
                    const { scores: bs } = ensembleScores(trainData, 12, d => d.back);
                    front = pickTopN(fs, 5);
                    back = pickTopN(bs, 2);
                } else if (strat.engine === 'markov') {
                    const fs = markovScores(trainData, 35, d => d.front);
                    const bs = markovScores(trainData, 12, d => d.back);
                    front = generateWithConstraints(fs, 5, 35, constraints);
                    back = pickTopN(bs, 2);
                } else {
                    const w = st.weights;
                    const fScores = scoreNumbersV2(frontMW.freq, frontMW.miss, 35, w, patterns);
                    const bScores = scoreNumbersV2(backMW.freq, backMW.miss, 12,
                        { ...w, wZone: 0, wTail: 0 }, { zoneTarget: null, tailBoost: null });
                    front = generateWithConstraints(fScores, 5, 35, constraints);
                    back = pickByScore(bScores, 2);
                }

                const fHits = front.filter(n => target.front.includes(n)).length;
                const bHits = back.filter(n => target.back.includes(n)).length;
                const level = calcHitLevel(fHits, bHits);

                if (strat.id === 'random') {
                    // 随机基准取平均
                    st.frontHits.push(fHits);
                    st.backHits.push(bHits);
                    st.totalHits.push(fHits + bHits);
                    st.total++;
                } else {
                    st.frontHits.push(fHits);
                    st.backHits.push(bHits);
                    st.totalHits.push(fHits + bHits);
                    st.total++;
                }

                st.levels[level] = (st.levels[level] || 0) + 1;
                if (level !== '未中奖') st.prizePeriods++;
                if (fHits >= 3) st.front3plus++;
                if (fHits > st.bestFront || (fHits === st.bestFront && bHits > st.bestBack)) {
                    st.bestFront = fHits; st.bestBack = bHits;
                }
            }
        });
    }

    // ========== 统计输出 ==========
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 回测结果汇总');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const header = '策略'.padEnd(14) + '场次'.padStart(5) + ' │ ' +
        '前区均命中'.padEnd(10) + '后区均命中'.padEnd(10) + '总命中'.padEnd(8) +
        '│ ' + '前≥3'.padEnd(6) + '中奖率'.padEnd(8) + '最佳'.padEnd(6);
    console.log(header);
    console.log('─'.repeat(80));

    const results = [];

    STRATEGIES.forEach(strat => {
        const st = stats[strat.id];
        if (st.total === 0) return;
        const avgF = (st.frontHits.reduce((a, b) => a + b, 0) / st.total).toFixed(2);
        const avgB = (st.backHits.reduce((a, b) => a + b, 0) / st.total).toFixed(2);
        const avgT = (st.totalHits.reduce((a, b) => a + b, 0) / st.total).toFixed(2);
        const f3pct = ((st.front3plus / st.total) * 100).toFixed(1);
        const prizePct = ((st.prizePeriods / st.total) * 100).toFixed(1);

        results.push({ id: strat.id, name: st.name, avgF: parseFloat(avgF), avgB: parseFloat(avgB), avgT: parseFloat(avgT), f3pct: parseFloat(f3pct), prizePct: parseFloat(prizePct) });

        const line = st.name.padEnd(14) +
            String(st.total).padStart(5) + ' │ ' +
            `${avgF}/5`.padEnd(10) + `${avgB}/2`.padEnd(10) + `${avgT}/7`.padEnd(8) +
            '│ ' + `${f3pct}%`.padEnd(6) + `${prizePct}%`.padEnd(8) +
            `${st.bestFront}+${st.bestBack}`.padEnd(6);
        console.log(line);
    });

    // 理论随机基准
    const theoFront = (5 / 35 * 5).toFixed(2); // 0.71
    const theoBack = (2 / 12 * 2).toFixed(2);   // 0.33
    console.log('─'.repeat(80));
    console.log(`📐 理论随机基准: 前区 ${theoFront}/5  后区 ${theoBack}/2  总 ${(parseFloat(theoFront) + parseFloat(theoBack)).toFixed(2)}/7`);

    // 策略排名
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🏆 策略排名 (按前区平均命中)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    results.sort((a, b) => b.avgF - a.avgF);
    results.forEach((r, i) => {
        const randomBaseline = results.find(x => x.id === 'random');
        const lift = randomBaseline ? ((r.avgF / randomBaseline.avgF - 1) * 100).toFixed(0) : '?';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        console.log(`  ${medal} #${i + 1} ${r.name}: 前区 ${r.avgF}/5 (vs随机 ${lift > 0 ? '+' : ''}${lift}%) | 中奖率 ${r.prizePct}%`);
    });

    // 奖级分布
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎰 奖级分布');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const allLevels = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖', '七等奖'];
    STRATEGIES.forEach(strat => {
        const st = stats[strat.id];
        const levelStr = allLevels
            .filter(l => st.levels[l])
            .map(l => `${l}:${st.levels[l]}次`)
            .join(' ');
        if (levelStr) {
            console.log(`  ${st.name}: ${levelStr}`);
        }
    });

    // 输出回测报告JSON
    const report = {
        runDate: new Date().toISOString(),
        totalPeriods: totalPeriods,
        testPeriods: testPeriods,
        minTrainWindow: MIN_TRAIN,
        randomRuns: RANDOM_RUNS,
        theoreticalBaseline: { front: 5/35*5, back: 2/12*2 },
        results: results.map(r => ({
            ...r,
            vsRandom: results.find(x => x.id === 'random') ? 
                +(r.avgF / results.find(x => x.id === 'random').avgF).toFixed(3) : 1
        })),
        levelDistribution: {}
    };
    STRATEGIES.forEach(s => { report.levelDistribution[s.id] = stats[s.id].levels; });

    fs.writeFileSync(path.join(DATA_DIR, 'backtest-report.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n💾 回测报告已保存: data/backtest-report.json`);
    console.log('✅ 回测完成!\n');
}

main();
