#!/usr/bin/env node
/**
 * 🧠 DLT 高级集成预测引擎 V5.0
 * 
 * 5种高级算法 + 集成融合:
 *   1. 马尔可夫链 — 号码转移概率
 *   2. 间隔周期 — 泊松分布超期预测
 *   3. 贝叶斯网络 — 尾数/区间条件依赖
 *   4. 蒙特卡洛 — 8000次概率采样
 *   5. 共现亲和 — 号码对共现提升比(Lift)
 * 
 * 可独立运行: node scripts/ensemble-engine.js
 * 也被 analyze.js 调用
 */

// ========== 1. 马尔可夫链 ==========
// 建立号码→号码的转移概率矩阵: 上期出了X，下期出Y的概率

function buildMarkovMatrix(issues, maxNum, selector) {
    // transition[x][y] = 上期出x后下期出y的次数
    const transition = {};
    for (let i = 1; i <= maxNum; i++) {
        transition[i] = {};
        for (let j = 1; j <= maxNum; j++) transition[i][j] = 0;
    }

    for (let t = 0; t < issues.length - 1; t++) {
        const curr = selector(issues[t]);
        const next = selector(issues[t + 1]);
        curr.forEach(x => next.forEach(y => transition[x][y]++));
    }

    // 归一化为概率
    for (let x = 1; x <= maxNum; x++) {
        const rowSum = Object.values(transition[x]).reduce((a, b) => a + b, 0) || 1;
        for (let y = 1; y <= maxNum; y++) transition[x][y] /= rowSum;
    }

    return transition;
}

function markovScores(issues, maxNum, selector) {
    const matrix = buildMarkovMatrix(issues, maxNum, selector);
    const lastDraw = selector(issues[0]); // 最新一期
    const scores = {};

    for (let y = 1; y <= maxNum; y++) {
        // 下期出y的概率 = 上期所有出现号码跳转到y的平均概率
        let sumProb = 0;
        lastDraw.forEach(x => sumProb += matrix[x][y]);
        scores[y] = sumProb / lastDraw.length;
    }

    // 归一化到[0,1]
    const max = Math.max(0.001, ...Object.values(scores));
    for (let y = 1; y <= maxNum; y++) scores[y] /= max;

    return scores;
}

// ========== 2. 间隔周期建模 ==========
// 每个号码的历史出现间隔 → 用泊松分布预测"超期概率"

function calcIntervals(issues, maxNum, selector) {
    const intervals = {};
    for (let n = 1; n <= maxNum; n++) {
        intervals[n] = [];
        let lastSeen = -1;
        for (let t = 0; t < issues.length; t++) {
            if (selector(issues[t]).includes(n)) {
                if (lastSeen >= 0) intervals[n].push(t - lastSeen);
                lastSeen = t;
            }
        }
    }
    return intervals;
}

function poissonCDF(k, lambda) {
    // P(X <= k) = sum(e^-λ * λ^i / i!, i=0..k)
    let sum = 0;
    for (let i = 0; i <= k; i++) {
        sum += Math.exp(-lambda + i * Math.log(lambda) - logFactorial(i));
    }
    return sum;
}

function logFactorial(n) {
    let s = 0;
    for (let i = 2; i <= n; i++) s += Math.log(i);
    return s;
}

function intervalScores(issues, maxNum, selector) {
    const intervals = calcIntervals(issues, maxNum, selector);
    const missing = {};
    // 当前遗漏期数
    for (let n = 1; n <= maxNum; n++) {
        missing[n] = 0;
        for (let t = 0; t < issues.length; t++) {
            if (selector(issues[t]).includes(n)) break;
            missing[n]++;
        }
    }

    const scores = {};
    for (let n = 1; n <= maxNum; n++) {
        const ivs = intervals[n];
        if (ivs.length < 2) {
            // 数据不足, 用均匀期望
            const expectedInterval = maxNum / (selector(issues[0]).length);
            scores[n] = missing[n] >= expectedInterval ? 0.6 : 0.3;
            continue;
        }
        const meanInterval = ivs.reduce((a, b) => a + b, 0) / ivs.length;
        // P(下期出现) = P(间隔 <= 当前遗漏+1) = 泊松CDF
        const lambda = Math.max(0.5, meanInterval);
        const probAppear = poissonCDF(missing[n], lambda);
        // 超期越多 → probAppear越接近1 → 得分越高
        // 但不是赌徒谬误！这基于该号码的实际历史周期
        scores[n] = probAppear;
    }

    // 归一化到[0,1]
    const max = Math.max(0.001, ...Object.values(scores));
    for (let n = 1; n <= maxNum; n++) scores[n] /= max;

    return scores;
}

// ========== 3. 贝叶斯网络 ==========
// 尾数间、区间间的条件依赖概率

function bayesianNetworkScores(issues, maxNum, selector) {
    const count = selector(issues[0]).length; // 5 for front, 2 for back

    // 3a. 尾数条件概率 P(尾数y出现 | 上期尾数集合)
    const tailTransition = {};
    for (let i = 0; i <= 9; i++) {
        tailTransition[i] = {};
        for (let j = 0; j <= 9; j++) tailTransition[i][j] = 0;
    }
    for (let t = 0; t < issues.length - 1; t++) {
        const currTails = new Set(selector(issues[t]).map(n => n % 10));
        const nextTails = new Set(selector(issues[t + 1]).map(n => n % 10));
        currTails.forEach(x => nextTails.forEach(y => tailTransition[x][y]++));
    }
    // 归一化
    for (let x = 0; x <= 9; x++) {
        const rowSum = Object.values(tailTransition[x]).reduce((a, b) => a + b, 0) || 1;
        for (let y = 0; y <= 9; y++) tailTransition[x][y] /= rowSum;
    }

    // 3b. 区间条件概率 P(号码在zoneY | 上期zone分布)
    const zoneTransition = {};
    for (let i = 0; i < 3; i++) {
        zoneTransition[i] = {};
        for (let j = 0; j < 3; j++) zoneTransition[i][j] = 0;
    }
    for (let t = 0; t < issues.length - 1; t++) {
        const currZones = selector(issues[t]).map(n => n <= 12 ? 0 : n <= 24 ? 1 : 2);
        const nextZones = selector(issues[t + 1]).map(n => n <= 12 ? 0 : n <= 24 ? 1 : 2);
        currZones.forEach(x => nextZones.forEach(y => zoneTransition[x][y]++));
    }
    for (let x = 0; x < 3; x++) {
        const rowSum = Object.values(zoneTransition[x]).reduce((a, b) => a + b, 0) || 1;
        for (let y = 0; y < 3; y++) zoneTransition[x][y] /= rowSum;
    }

    // 计算每个号码的贝叶斯得分
    const lastDraw = selector(issues[0]);
    const lastTails = new Set(lastDraw.map(n => n % 10));
    const lastZones = lastDraw.map(n => n <= 12 ? 0 : n <= 24 ? 1 : 2);

    const scores = {};
    for (let n = 1; n <= maxNum; n++) {
        const tail = n % 10;
        const zone = n <= 12 ? 0 : n <= 24 ? 1 : 2;

        // P(this tail | last tails) — average across last draw's tails
        let tailProb = 0;
        lastTails.forEach(lt => tailProb += tailTransition[lt][tail]);
        tailProb /= lastTails.size;

        // P(this zone | last zones) — average across last draw's zones
        let zoneProb = 0;
        lastZones.forEach(lz => zoneProb += zoneTransition[lz][zone]);
        zoneProb /= lastZones.length;

        scores[n] = tailProb * 0.5 + zoneProb * 0.5;
    }

    // 归一化
    const max = Math.max(0.001, ...Object.values(scores));
    for (let n = 1; n <= maxNum; n++) scores[n] /= max;

    return scores;
}

// ========== 4. 蒙特卡洛模拟 ==========
// 基于多维概率分布的随机抽样

function monteCarloScores(issues, maxNum, selector, simulations = 10000) {
    const count = selector(issues[0]).length;

    // 构建概率分布: 频率+遗漏+趋势的混合
    const freq = {}, missing = {};
    for (let n = 1; n <= maxNum; n++) { freq[n] = 0; missing[n] = issues.length; }
    issues.forEach((d, idx) => selector(d).forEach(n => {
        freq[n]++;
        if (missing[n] === issues.length) missing[n] = idx;
    }));

    // 基础概率: 频率×遗漏调整
    const baseProb = {};
    const fMax = Math.max(1, ...Object.values(freq));
    const mMax = Math.max(1, ...Object.values(missing));
    for (let n = 1; n <= maxNum; n++) {
        baseProb[n] = (freq[n] / fMax) * 0.6 + (missing[n] / mMax) * 0.2 + 0.2;
    }

    // 约束参数
    const sums = issues.map(d => selector(d).reduce((a, b) => a + b, 0));
    const meanSum = sums.reduce((a, b) => a + b, 0) / sums.length;
    const stdSum = Math.sqrt(sums.reduce((a, b) => a + (b - meanSum) ** 2, 0) / sums.length);

    // 蒙特卡洛采样
    const hitCount = {};
    for (let n = 1; n <= maxNum; n++) hitCount[n] = 0;

    const probArray = [];
    for (let n = 1; n <= maxNum; n++) probArray.push({ num: n, prob: baseProb[n] });
    const totalProb = probArray.reduce((a, b) => a + b.prob, 0);
    probArray.forEach(p => p.prob /= totalProb);

    // 累积分布函数
    let accepted = 0;
    for (let sim = 0; sim < simulations; sim++) {
        // 按概率加权抽样选count个号码
        const selected = weightedSample(probArray, count);
        const sum = selected.reduce((a, b) => a + b, 0);

        // 和值约束过滤
        if (sum >= meanSum - stdSum && sum <= meanSum + stdSum) {
            selected.forEach(n => hitCount[n]++);
            accepted++;
        }
    }

    // 转为得分
    const scores = {};
    const hitMax = Math.max(1, ...Object.values(hitCount));
    for (let n = 1; n <= maxNum; n++) {
        scores[n] = hitCount[n] / hitMax;
    }

    return scores;
}

function weightedSample(probArray, count) {
    const result = [];
    const available = probArray.map(p => ({ ...p }));

    for (let c = 0; c < count; c++) {
        const total = available.reduce((a, b) => a + b.prob, 0);
        let r = Math.random() * total;
        let chosen = 0;
        for (let i = 0; i < available.length; i++) {
            r -= available[i].prob;
            if (r <= 0) { chosen = i; break; }
        }
        result.push(available[chosen].num);
        available.splice(chosen, 1);
    }

    return result.sort((a, b) => a - b);
}

// ========== 5. 共现亲和图谱 ==========
// 统计每对号码共现频率 vs 随机期望, 计算提升比(Lift)

function buildAffinityMatrix(issues, maxNum, selector) {
    const count = selector(issues[0]).length;
    const cooccur = {};
    const freq = {};
    for (let i = 1; i <= maxNum; i++) {
        freq[i] = 0;
        cooccur[i] = {};
        for (let j = 1; j <= maxNum; j++) cooccur[i][j] = 0;
    }
    issues.forEach(d => {
        const nums = selector(d);
        nums.forEach(n => freq[n]++);
        for (let a = 0; a < nums.length; a++) {
            for (let b = a + 1; b < nums.length; b++) {
                cooccur[nums[a]][nums[b]]++;
                cooccur[nums[b]][nums[a]]++;
            }
        }
    });
    // Lift = P(A∩B) / (P(A)*P(B))
    const N = issues.length;
    const lift = {};
    for (let i = 1; i <= maxNum; i++) {
        lift[i] = {};
        for (let j = 1; j <= maxNum; j++) {
            if (i === j) { lift[i][j] = 1; continue; }
            const pA = freq[i] / N;
            const pB = freq[j] / N;
            const pAB = cooccur[i][j] / N;
            lift[i][j] = (pA * pB > 0) ? pAB / (pA * pB) : 0;
        }
    }
    return { lift, freq };
}

function affinityScores(issues, maxNum, selector) {
    const { lift } = buildAffinityMatrix(issues, maxNum, selector);
    const lastDraw = selector(issues[0]);
    const scores = {};

    for (let n = 1; n <= maxNum; n++) {
        // 与上期所有号码的平均Lift值
        let totalLift = 0;
        lastDraw.forEach(d => totalLift += lift[d][n]);
        scores[n] = totalLift / lastDraw.length;
    }

    const max = Math.max(0.001, ...Object.values(scores));
    for (let n = 1; n <= maxNum; n++) scores[n] /= max;
    return scores;
}

// ========== 6. 集成融合 V5 (5算法) ==========

const DEFAULT_WEIGHTS = { markov: 0.25, interval: 0.20, bayesian: 0.20, montecarlo: 0.15, affinity: 0.20 };
let OPTIMIZED_WEIGHTS = null; // 缓存优化后的权重

function ensembleScores(issues, maxNum, selector, weights = null) {
    const w = weights || OPTIMIZED_WEIGHTS || DEFAULT_WEIGHTS;

    const markov = markovScores(issues, maxNum, selector);
    const interval = intervalScores(issues, maxNum, selector);
    const bayesian = bayesianNetworkScores(issues, maxNum, selector);
    const mc = monteCarloScores(issues, maxNum, selector, 8000);
    const affinity = affinityScores(issues, maxNum, selector);

    const scores = {};
    for (let n = 1; n <= maxNum; n++) {
        scores[n] = (w.markov || 0) * markov[n]
                  + (w.interval || 0) * interval[n]
                  + (w.bayesian || 0) * bayesian[n]
                  + (w.montecarlo || 0) * mc[n]
                  + (w.affinity || 0) * affinity[n];
    }

    return { scores, components: { markov, interval, bayesian, montecarlo: mc, affinity } };
}

function pickTopN(scores, count) {
    return Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(e => Number(e[0]))
        .sort((a, b) => a - b);
}

// ========== 7. 权重网格搜索优化 ==========

function optimizeWeights(issues, minTrain = 20, verbose = false) {
    const totalPeriods = issues.length;
    const testPeriods = totalPeriods - minTrain;
    if (testPeriods < 10) return DEFAULT_WEIGHTS;

    // 网格搜索: 每个权重从0.05到0.45, 步长0.10
    const steps = [0.05, 0.15, 0.25, 0.35, 0.45];
    let bestWeights = { ...DEFAULT_WEIGHTS };
    let bestScore = -1;
    let tested = 0;

    // 生成所有权重组合(和=1)
    for (const wM of steps) {
        for (const wI of steps) {
            for (const wB of steps) {
                for (const wC of steps) {
                    const wA = +(1 - wM - wI - wB - wC).toFixed(2);
                    if (wA < 0.05 || wA > 0.45) continue;
                    tested++;

                    // 快速回测: 每10期抽样一次
                    let totalHits = 0;
                    const sampleStep = Math.max(1, Math.floor(testPeriods / 15));
                    let samples = 0;

                    for (let testIdx = testPeriods - 1; testIdx >= 0; testIdx -= sampleStep) {
                        const target = issues[testIdx];
                        const trainData = issues.slice(testIdx + 1);
                        if (trainData.length < minTrain) continue;

                        const w = { markov: wM, interval: wI, bayesian: wB, montecarlo: wC, affinity: wA };
                        const { scores } = ensembleScores(trainData, 35, d => d.front, w);
                        const pick = pickTopN(scores, 5);
                        const frontHits = pick.filter(n => target.front.includes(n)).length;
                        totalHits += frontHits;
                        samples++;
                    }

                    const avgHits = samples > 0 ? totalHits / samples : 0;
                    if (avgHits > bestScore) {
                        bestScore = avgHits;
                        bestWeights = { markov: wM, interval: wI, bayesian: wB, montecarlo: wC, affinity: wA };
                    }
                }
            }
        }
    }

    if (verbose) {
        console.log(`\n🔧 权重优化: 测试了 ${tested} 种组合`);
        console.log(`   最优权重: M=${bestWeights.markov} I=${bestWeights.interval} B=${bestWeights.bayesian} C=${bestWeights.montecarlo} A=${bestWeights.affinity}`);
        console.log(`   平均命中: ${bestScore.toFixed(3)}/5`);
    }

    OPTIMIZED_WEIGHTS = bestWeights;
    return bestWeights;
}

// ========== 导出 ==========

module.exports = {
    markovScores,
    intervalScores,
    bayesianNetworkScores,
    monteCarloScores,
    affinityScores,
    buildAffinityMatrix,
    ensembleScores,
    optimizeWeights,
    pickTopN
};

// ========== 独立运行测试 ==========

if (require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const DATA_DIR = path.join(__dirname, '..', 'data');
    const history = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'history.json'), 'utf8'));
    const issues = history.issues;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧠 集成预测引擎 V5.0 独立测试');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`📊 数据: ${issues.length} 期, 最新: ${issues[0].issue}\n`);

    // 逐算法输出
    const algorithms = [
        { name: '🔗 马尔可夫链', fn: () => markovScores(issues, 35, d => d.front) },
        { name: '⏱️ 间隔周期', fn: () => intervalScores(issues, 35, d => d.front) },
        { name: '🕸️ 贝叶斯网络', fn: () => bayesianNetworkScores(issues, 35, d => d.front) },
        { name: '🎰 蒙特卡洛', fn: () => monteCarloScores(issues, 35, d => d.front, 10000) },
        { name: '🤝 共现亲和', fn: () => affinityScores(issues, 35, d => d.front) }
    ];

    algorithms.forEach(algo => {
        const scores = algo.fn();
        const top5 = pickTopN(scores, 5);
        console.log(`${algo.name}: TOP5=${top5.map(n => String(n).padStart(2, '0')).join(' ')}`);
    });

    // 亲和对分析
    console.log('\n── 高亲和号码对 (Lift>1.5) ──');
    const { lift } = buildAffinityMatrix(issues, 35, d => d.front);
    const lastDraw = issues[0].front;
    const pairs = [];
    lastDraw.forEach(d => {
        for (let n = 1; n <= 35; n++) {
            if (lastDraw.includes(n)) continue;
            if (lift[d][n] > 1.5) pairs.push({ from: d, to: n, lift: lift[d][n] });
        }
    });
    pairs.sort((a, b) => b.lift - a.lift);
    pairs.slice(0, 10).forEach(p => console.log(`  ${String(p.from).padStart(2,'0')} → ${String(p.to).padStart(2,'0')} Lift=${p.lift.toFixed(2)}`));

    // 权重优化
    console.log('\n── 权重网格搜索 ──');
    const bestW = optimizeWeights(issues, 20, true);

    // 优化后集成
    console.log('\n── 优化后集成融合 ──');
    const { scores: frontScores } = ensembleScores(issues, 35, d => d.front, bestW);
    const { scores: backScores } = ensembleScores(issues, 12, d => d.back, bestW);
    const frontPick = pickTopN(frontScores, 5);
    const backPick = pickTopN(backScores, 2);
    console.log(`🧠 优化后预测: ${frontPick.map(n => String(n).padStart(2, '0')).join(' ')} + ${backPick.map(n => String(n).padStart(2, '0')).join(' ')}`);

    console.log('\n✅ 测试完成!');
}

