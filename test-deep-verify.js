#!/usr/bin/env node
/**
 * 🔍 深度验证 V2 — 足球竞彩 & 大乐透智能体逻辑全面检验
 * 覆盖: 数学正确性, 边界条件, 数据流, 进化逻辑, 策略分化
 */
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, 'data');

let passed = 0, failed = 0, warnings = 0;
const failures = [];
function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; failures.push(msg); console.log(`  ❌ FAIL: ${msg}`); }
}
function warn(condition, msg) {
  if (!condition) { warnings++; console.log(`  ⚠️ WARN: ${msg}`); }
}
function near(a, b, eps = 0.01) { return Math.abs(a - b) < eps; }

console.log('\n═══════════════════════════════════════════════════');
console.log('🔍 深度验证 V2 — 足球竞彩 & 大乐透');
console.log('═══════════════════════════════════════════════════\n');

// ============================================================
// PART A: 足球竞彩逻辑验证
// ============================================================
console.log('╔════════════════════════════════════════╗');
console.log('║  PART A: 足球竞彩逻辑验证              ║');
console.log('╚════════════════════════════════════════╝\n');

// ── A1. 基础数学函数 ──
console.log('── A1. 基础数学函数 ──');
function impliedProb(odds) { return odds > 0 ? 1 / odds : 0; }
function calcKelly(odds, prob) { const b = odds - 1; return b <= 0 ? 0 : (b * prob - (1 - prob)) / b; }
function calcEV(odds, prob) { return odds * prob - 1; }

// 隐含概率
assert(near(impliedProb(2.0), 0.5), '赔率2.0 → 隐含概率50%');
assert(near(impliedProb(3.0), 0.333), '赔率3.0 → 隐含概率33.3%');
assert(near(impliedProb(1.0), 1.0), '赔率1.0 → 隐含概率100%');
assert(impliedProb(0) === 0, '赔率0 → 隐含概率0 (边界)');
assert(impliedProb(-1) === 0, '负赔率 → 0 (边界保护)');

// Kelly公式
assert(calcKelly(2.0, 0.6) > 0, 'Kelly: 60%概率赔率2.0 → 正值投注');
assert(calcKelly(2.0, 0.4) < 0 || calcKelly(2.0, 0.4) === 0, 'Kelly: 40%概率赔率2.0 → 非正值');
assert(calcKelly(1.0, 0.5) === 0, 'Kelly: 赔率1.0 → 0 (b=0边界)');

// EV
assert(calcEV(2.0, 0.6) > 0, 'EV: 2.0 * 60% - 1 = +0.2 正值');
assert(near(calcEV(2.0, 0.6), 0.2), 'EV: 精确值=0.2');
assert(calcEV(2.0, 0.4) < 0, 'EV: 2.0 * 40% - 1 = -0.2 负值');

// ── A2. 赔率→概率归一化 ──
console.log('\n── A2. 赔率→概率归一化 ──');
const testOdds = [1.80, 3.50, 4.20]; // 典型大联赛赔率
const ipRaw = testOdds.map(impliedProb);
const margin = ipRaw.reduce((a, b) => a + b, 0);
assert(margin > 1.0, `庄家抽水率 ${((margin - 1) * 100).toFixed(1)}% > 0 (${margin.toFixed(3)})`);
const fairProbs = ipRaw.map(p => p / margin);
const fairSum = fairProbs.reduce((a, b) => a + b, 0);
assert(near(fairSum, 1.0), `归一化后概率总和=1.0 (实际=${fairSum.toFixed(6)})`);
assert(fairProbs[0] > fairProbs[1] && fairProbs[0] > fairProbs[2], '赔率最低→概率最高 (主胜)');
assert(fairProbs.every(p => p > 0 && p < 1), '所有概率在(0,1)范围');

// ── A3. 贝叶斯平滑 ──
console.log('\n── A3. 贝叶斯平滑 ──');
function bayesianSmooth(rawProbs, prior = [0.36, 0.28, 0.36], strength = 5) {
    const n = 100;
    return rawProbs.map((p, i) => {
        const smoothed = (p * n + prior[i] * strength) / (n + strength);
        return Math.max(0.05, smoothed);
    });
}
const smoothed = bayesianSmooth([0.55, 0.25, 0.20]);
assert(smoothed[0] < 0.55, `平滑后主胜下降: ${smoothed[0].toFixed(3)} < 0.55 (向先验回归)`);
assert(smoothed[1] > 0.25, `平滑后平局上升: ${smoothed[1].toFixed(3)} > 0.25 (向先验回归)`);
assert(smoothed.every(p => p >= 0.05), '所有概率 ≥ 0.05 下限');
const extremeSmooth = bayesianSmooth([0.01, 0.01, 0.98]);
assert(extremeSmooth[2] < 0.98, '极端概率被平滑: 98%降低');
assert(extremeSmooth.every(p => p >= 0.05), '极端值也不低于下限');

// ── A4. 主场优势调整(乘法) ──
console.log('\n── A4. 主场优势调整(乘法) ──');
const adj = [fairProbs[0] * 1.08, fairProbs[1] * 1.04, fairProbs[2] * 0.96];
const adjSum = adj.reduce((a, b) => a + b, 0);
const adjNorm = adj.map(p => p / adjSum);
assert(adjNorm[0] > fairProbs[0], '调整后主胜概率上升');
assert(adjNorm[2] < fairProbs[2], '调整后客胜概率下降');
assert(near(adjNorm.reduce((a, b) => a + b, 0), 1.0), '调整后概率归一化');
assert(Math.abs(adjNorm[0] - fairProbs[0]) < 0.05, `调整幅度<5% (${(Math.abs(adjNorm[0] - fairProbs[0]) * 100).toFixed(1)}%)`);

// ── A5. 3策略分化 ──
console.log('\n── A5. 3策略分化 ──');
const strategies = [
    { id: 'conservative', w: { kelly: 0.15, ev: 0.20, implied: 0.65 } },
    { id: 'balanced', w: { kelly: 0.35, ev: 0.35, implied: 0.30 } },
    { id: 'aggressive', w: { kelly: 0.45, ev: 0.40, implied: 0.15 } }
];
strategies.forEach(s => {
    const wSum = s.w.kelly + s.w.ev + s.w.implied;
    assert(near(wSum, 1.0), `${s.id} 权重总和=1.0 (${wSum})`);
});
assert(strategies[0].w.implied > strategies[2].w.implied, '保守策略implied权重 > 激进');
assert(strategies[2].w.kelly > strategies[0].w.kelly, '激进策略kelly权重 > 保守');

// 用测试数据检验策略是否真的产生不同推荐
const testProbs = [0.50, 0.30, 0.20]; // 强主场
const testOdds2 = [1.90, 3.40, 4.50];
const outcomes = ['胜', '平', '负'];
const stratPicks = strategies.map(s => {
    const w = s.w;
    const rawScores = outcomes.map((label, i) => {
        const kelly = Math.max(0, calcKelly(testOdds2[i], testProbs[i]));
        const ev = Math.max(0, calcEV(testOdds2[i], testProbs[i]));
        const edge = testProbs[i] - (1/testOdds2[i])/((1/testOdds2[0])+(1/testOdds2[1])+(1/testOdds2[2]));
        return { label, kelly, ev, prob: testProbs[i], edge };
    });
    const kMax = Math.max(0.001, ...rawScores.map(r => r.kelly));
    const eMax = Math.max(0.001, ...rawScores.map(r => r.ev));
    const pMax = Math.max(0.001, ...rawScores.map(r => r.prob));
    const edgeMax = Math.max(0.001, ...rawScores.map(r => Math.abs(r.edge)));
    const scores = rawScores.map(r => {
        const kellyN = r.kelly / kMax;
        const evN = r.ev / eMax;
        const kellyOrEdge = kellyN > 0 ? kellyN : (r.edge > 0 ? r.edge / edgeMax : 0);
        const evOrEdge = evN > 0 ? evN : (r.edge > 0 ? r.edge / edgeMax * 0.5 : 0);
        const implN = r.prob / pMax;
        return { label: r.label, score: w.kelly * kellyOrEdge + w.ev * evOrEdge + w.implied * implN };
    });
    scores.sort((a, b) => b.score - a.score);
    return { id: s.id, pick: scores[0].label, score: scores[0].score };
});
console.log(`  保守: ${stratPicks[0].pick} (${stratPicks[0].score.toFixed(3)})`);
console.log(`  均衡: ${stratPicks[1].pick} (${stratPicks[1].score.toFixed(3)})`);
console.log(`  激进: ${stratPicks[2].pick} (${stratPicks[2].score.toFixed(3)})`);
assert(stratPicks[0].pick === '胜' || stratPicks[0].pick === '平', 
    `保守策略: 选高概率或高价值项(${stratPicks[0].pick})`);
// Scores should differ between strategies
assert(stratPicks[0].score !== stratPicks[2].score, '保守和激进的评分不同');
// All strategies should produce valid picks
assert(stratPicks.every(s => ['胜', '平', '负'].includes(s.pick)), '所有策略推荐有效');

// ── A6. BQC半全场转移矩阵 ──
console.log('\n── A6. BQC半全场Markov转移矩阵 ──');
const transitions = [
    [0.75, 0.15, 0.10], // HT胜→FT
    [0.30, 0.40, 0.30], // HT平→FT
    [0.10, 0.15, 0.75]  // HT负→FT
];
transitions.forEach((row, i) => {
    const rSum = row.reduce((a, b) => a + b, 0);
    assert(near(rSum, 1.0), `转移矩阵第${i+1}行和=1 (${rSum})`);
});
assert(transitions[0][0] === 0.75, '半场胜→全场胜概率最高(0.75)');
assert(transitions[2][2] === 0.75, '半场负→全场负概率最高(0.75)');
assert(transitions[1][1] === 0.40, '半场平→全场平概率最高(0.40)');

// 强队调整后仍归一化
const strength = 0.2; // 强主场
const adj0 = [Math.min(0.85, 0.75 + strength * 0.1), 0.15, 0.10];
const adj0Sum = adj0.reduce((a, b) => a + b, 0);
const adj0Norm = adj0.map(p => p / adj0Sum);
assert(near(adj0Norm.reduce((a, b) => a + b, 0), 1.0), '调整后转移概率仍归一化');

// ── A7. JQ进球彩Poisson模型 ──
console.log('\n── A7. JQ进球彩Poisson分布 ──');
function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }
function poissonDist(lambda) {
    const p = [];
    for (let g = 0; g <= 2; g++) p.push(Math.pow(lambda, g) * Math.exp(-lambda) / factorial(g));
    p.push(Math.max(0.03, 1 - p.reduce((a, b) => a + b, 0)));
    return p.map(v => Math.max(0.03, v));
}
const pd = poissonDist(1.5); // 典型主队lambda
assert(pd.length === 4, 'Poisson输出4项(0,1,2,3+)');
assert(pd.every(p => p >= 0.03), '所有概率≥下限0.03');
const pdSum = pd.reduce((a, b) => a + b, 0);
// After normalization should sum to 1
const pdNorm = pd.map(p => p / pdSum);
assert(near(pdNorm.reduce((a, b) => a + b, 0), 1.0), 'Poisson归一化后和=1');
assert(pdNorm[1] > pdNorm[0], 'λ=1.5时P(1球)>P(0球)');
assert(pdNorm[1] > pdNorm[3], 'P(1球)>P(3+球)');

// 边界: λ=0
const pd0 = poissonDist(0.01);
assert(pd0[0] > pd0[1], 'λ≈0: P(0球)最高');
// 边界: λ很大
const pdHigh = poissonDist(4.0);
assert(pdHigh[3] > pdHigh[0], 'λ=4.0: P(3+球)>P(0球)');

// ── A8. 模型进化逻辑 ──
console.log('\n── A8. 模型进化逻辑 ──');
const modelParams = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'model-params.json'), 'utf8'));
assert(modelParams.version >= 1, `模型版本: v${modelParams.version}`);
assert(modelParams.weights, '权重字段存在');
if (modelParams.weights) {
    const wk = modelParams.weights;
    assert(wk.kelly >= 0.10 && wk.kelly <= 0.55, `kelly权重在边界内: ${wk.kelly}`);
    assert(wk.ev >= 0.10 && wk.ev <= 0.55, `ev权重在边界内: ${wk.ev}`);
    assert(wk.implied >= 0.10 && wk.implied <= 0.60, `implied权重在边界内: ${wk.implied}`);
    assert(near(wk.kelly + wk.ev + wk.implied, 1.0, 0.02), `权重归一化: ${(wk.kelly + wk.ev + wk.implied).toFixed(4)}`);
}
if (modelParams.momentum) {
    const m = modelParams.momentum;
    assert(Math.abs(m.kelly) <= 0.05 && Math.abs(m.ev) <= 0.05 && Math.abs(m.implied) <= 0.05,
        `动量在[-0.05,0.05]范围: k=${m.kelly} e=${m.ev} i=${m.implied}`);
}

// ── A9. 实际推荐数据完整性 ──
console.log('\n── A9. 实际推荐数据完整性 ──');
const fbPicks = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'fb-picks', 'latest.json'), 'utf8'));
assert(fbPicks.sf && fbPicks.sf.picks, 'SF胜负游戏数据存在');
assert(fbPicks.bqc && fbPicks.bqc.picks, 'BQC半全场数据存在');
assert(fbPicks.jq && fbPicks.jq.picks, 'JQ进球彩数据存在');
assert(fbPicks.r9 && fbPicks.r9.picks, 'R9任选9场数据存在');

if (fbPicks.sf.picks.length > 0) {
    const sf0 = fbPicks.sf.picks[0];
    assert(['胜', '平', '负'].includes(sf0.pick), `SF推荐格式: ${sf0.pick}`);
    assert(['高', '中', '低'].includes(sf0.confidence), `SF信心: ${sf0.confidence}`);
    assert(sf0.allStrategies && sf0.allStrategies.length === 3, 'SF包含3个策略');
    assert(sf0.analysis && sf0.analysis.length === 3, 'SF分析包含胜平负3项');
    // 每项分析的概率应在0-1
    sf0.analysis.forEach(a => {
        assert(a.prob >= 0 && a.prob <= 1, `分析概率合法: ${a.label}=${a.prob.toFixed(3)}`);
    });
    // 概率应大致加到1
    const probSum = sf0.analysis.reduce((s, a) => s + a.prob, 0);
    assert(probSum > 0.8 && probSum < 1.2, `概率总和接近1: ${probSum.toFixed(3)}`);
}

if (fbPicks.bqc.picks.length > 0) {
    const bqc0 = fbPicks.bqc.picks[0];
    const validBQC = ['胜胜', '胜平', '胜负', '平胜', '平平', '平负', '负胜', '负平', '负负'];
    assert(validBQC.includes(bqc0.pick), `BQC推荐格式: ${bqc0.pick}`);
    assert(bqc0.topPicks && bqc0.topPicks.length >= 2, 'BQC有前3候选');
}

if (fbPicks.jq.picks.length > 0) {
    const jq0 = fbPicks.jq.picks[0];
    assert(['0', '1', '2', '3+'].includes(jq0.homePick), `JQ主队进球: ${jq0.homePick}`);
    assert(['0', '1', '2', '3+'].includes(jq0.awayPick), `JQ客队进球: ${jq0.awayPick}`);
    assert(jq0.expectedGoals && jq0.expectedGoals.home > 0, `JQ期望进球>0: ${jq0.expectedGoals.home}`);
}

assert(fbPicks.r9.picks.length <= 9, `R9最多9场: ${fbPicks.r9.picks.length}`);

// ============================================================
// PART B: 大乐透智能体逻辑验证
// ============================================================
console.log('\n╔════════════════════════════════════════╗');
console.log('║  PART B: 大乐透智能体逻辑验证          ║');
console.log('╚════════════════════════════════════════╝\n');

// ── B1. 集成引擎5算法 ──
console.log('── B1. 集成引擎5算法分量检查 ──');
const { ensembleScores, pickTopN, optimizeWeights } = require('./scripts/ensemble-engine');
const history = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'history.json'), 'utf8'));
const issues = history.issues;

const { scores, components } = ensembleScores(issues, 35, d => d.front);
const algos = ['markov', 'interval', 'bayesian', 'montecarlo', 'affinity'];
algos.forEach(algo => {
    assert(components[algo], `${algo} 分量存在`);
    const vals = Object.values(components[algo]);
    assert(vals.length === 35, `${algo} 覆盖35个号码`);
    assert(vals.every(v => v >= 0 && v <= 1.01), `${algo} 分数在[0,1]`);
    const sorted = [...vals].sort((a, b) => b - a);
    assert(sorted[0] > sorted[34], `${algo} 有区分度: max=${sorted[0].toFixed(3)} min=${sorted[34].toFixed(3)}`);
});

// 融合分数应体现各分量的差异
const ensVals = Object.values(scores);
const ensMax = Math.max(...ensVals), ensMin = Math.min(...ensVals);
assert(ensMax - ensMin > 0.1, `融合后有足够区分度: ${(ensMax - ensMin).toFixed(3)}`);

// ── B2. 8策略产生不同号码 ──
console.log('\n── B2. 8策略号码差异检查 ──');
const analysis = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'analysis.json'), 'utf8'));
const pred = analysis.currentPrediction;
assert(pred.predictions.length >= 6, `策略数: ${pred.predictions.length}`);

const predFronts = pred.predictions.map(p => p.front.join(','));
const uniqueFronts = new Set(predFronts);
assert(uniqueFronts.size === predFronts.length, `${predFronts.length} 策略号码全部不同`);

// 策略间相似度检查 (Jaccard)
console.log('\n── B3. 策略间相似度(Jaccard) ──');
let maxJaccard = 0, maxPair = '';
for (let i = 0; i < pred.predictions.length; i++) {
    for (let j = i + 1; j < pred.predictions.length; j++) {
        const a = new Set(pred.predictions[i].front);
        const b = new Set(pred.predictions[j].front);
        const inter = [...a].filter(x => b.has(x)).length;
        const union = new Set([...a, ...b]).size;
        const jaccard = inter / union;
        if (jaccard > maxJaccard) { maxJaccard = jaccard; maxPair = `${pred.predictions[i].label} vs ${pred.predictions[j].label}`; }
    }
}
assert(maxJaccard < 0.8, `最大Jaccard相似度: ${maxJaccard.toFixed(2)} @ ${maxPair} (应<0.8)`);
warn(maxJaccard < 0.6, `策略相似度偏高: ${maxJaccard.toFixed(2)} @ ${maxPair}`);

// ── B4. 智能缩水约束全检 ──
console.log('\n── B4. 智能缩水约束全检 ──');
const { smartPick } = require('./scripts/smart-pick');
const spResult = smartPick(issues, 'both');
function calcAC(nums) {
    const sorted = [...nums].sort((a, b) => a - b);
    const diffs = new Set();
    for (let i = 0; i < sorted.length; i++)
        for (let j = i + 1; j < sorted.length; j++) diffs.add(sorted[j] - sorted[i]);
    return diffs.size - (nums.length - 1);
}

const allPicks = [...(spResult.select || []), ...(spResult.coverage || [])];
assert(allPicks.length > 0, `总推荐数: ${allPicks.length}`);

let constraintOK = true;
const violations = { ac: 0, sum: 0, span: 0, odd: 0, format: 0, dup: 0 };
allPicks.forEach((p, idx) => {
    // 格式
    if (!p.front || p.front.length !== 5 || !p.back || p.back.length !== 2) { violations.format++; constraintOK = false; return; }
    if (p.front.some(n => n < 1 || n > 35) || p.back.some(n => n < 1 || n > 12)) { violations.format++; constraintOK = false; return; }
    if (new Set(p.front).size !== 5 || new Set(p.back).size !== 2) { violations.dup++; constraintOK = false; return; }
    // AC
    const ac = calcAC(p.front);
    if (ac < 4) { violations.ac++; constraintOK = false; }
    // 和值
    const sum = p.front.reduce((a, b) => a + b, 0);
    if (sum < 30 || sum > 150) { violations.sum++; constraintOK = false; }
    // 跨度
    const span = p.front[4] - p.front[0];
    if (span < 12) { violations.span++; constraintOK = false; }
    // 奇偶
    const odd = p.front.filter(n => n % 2 === 1).length;
    if (odd < 1 || odd > 4) { violations.odd++; constraintOK = false; }
});
assert(constraintOK, `所有约束通过 (AC/和值/跨度/奇偶/格式)`);
if (!constraintOK) {
    console.log(`    违规统计: AC=${violations.ac} 和值=${violations.sum} 跨度=${violations.span} 奇偶=${violations.odd} 格式=${violations.format} 重复=${violations.dup}`);
}

// 覆盖多样性
const covNums = new Set();
(spResult.coverage || []).forEach(p => p.front.forEach(n => covNums.add(n)));
assert(covNums.size >= 10, `覆盖号码多样性: ${covNums.size}个 (≥10)`);

// 三区分布
const z1 = [...covNums].filter(n => n <= 12).length;
const z2 = [...covNums].filter(n => n > 12 && n <= 24).length;
const z3 = [...covNums].filter(n => n > 24).length;
assert(z1 > 0 && z2 > 0 && z3 > 0, `三区都有覆盖: Z1=${z1} Z2=${z2} Z3=${z3}`);

// ── B5. DLT回测验证 ──
console.log('\n── B5. DLT回测运行 ──');
// 简易回测: 用最后10期验证预测逻辑
let totalFrontHits = 0, totalBackHits = 0, testPeriods = 0;
const recent = issues.slice(0, 10);
for (let i = 1; i < recent.length; i++) {
    const trainData = { issues: issues.slice(i) }; // 用更早的数据生成预测
    const { scores: fScores } = ensembleScores(trainData.issues, 35, d => d.front);
    const { scores: bScores } = ensembleScores(trainData.issues, 12, d => d.back);
    const frontPick = pickTopN(fScores, 5);
    const backPick = pickTopN(bScores, 2);
    const actual = recent[i - 1]; // 这是我们要预测的
    const fHits = frontPick.filter(n => actual.front.includes(n)).length;
    const bHits = backPick.filter(n => actual.back.includes(n)).length;
    totalFrontHits += fHits;
    totalBackHits += bHits;
    testPeriods++;
}
const avgFront = totalFrontHits / testPeriods;
const avgBack = totalBackHits / testPeriods;
console.log(`  回测${testPeriods}期: 平均命中 前区${avgFront.toFixed(2)}/5 后区${avgBack.toFixed(2)}/2`);
assert(avgFront > 0, '回测: 前区平均命中>0');
warn(avgFront >= 0.8, `回测前区命中偏低: ${avgFront.toFixed(2)}/5`);

// ── B6. 策略进化方向检查 ──
console.log('\n── B6. 策略进化权重检查 ──');
if (analysis.evolvedStrategies) {
    const strats = analysis.evolvedStrategies;
    assert(strats.length >= 5, `进化策略数: ${strats.length}`);
    strats.forEach(s => {
        if (s.engine) {
            // Engine-based strategies (集成/马尔可夫) have no weight keys
            assert(typeof s.engine === 'string', `${s.name || s.id} 是引擎策略: ${s.engine}`);
            return;
        }
        const wSum = (s.wFreq || 0) + (s.wMiss || 0) + (s.wZone || 0) + (s.wRand || 0) + (s.wTail || 0);
        assert(near(wSum, 1.0, 0.05), `${s.name || s.id} 权重归一化: ${wSum.toFixed(3)}`);
    });
}

// ============================================================
// PART C: 数据流完整性
// ============================================================
console.log('\n╔════════════════════════════════════════╗');
console.log('║  PART C: 数据流完整性                  ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('── C1. DLT数据链 ──');
assert(issues.length >= 50, `history.json: ${issues.length}期 (≥50)`);
assert(analysis.latestIssue === String(issues[0].issue), `analysis最新期号匹配: ${analysis.latestIssue}`);
assert(analysis.smartPick, 'analysis包含smartPick');
assert(analysis.strategyPerformance, 'analysis包含strategyPerformance');

console.log('\n── C2. 足彩数据链 ──');
const matchesFile = path.join(DATA_DIR, 'matches.json');
if (fs.existsSync(matchesFile)) {
    const matchData = JSON.parse(fs.readFileSync(matchesFile, 'utf8'));
    assert(matchData.matches && matchData.matches.length > 0, `matches.json: ${matchData.matches?.length}场`);
    const m0 = matchData.matches[0];
    assert(m0.home && m0.away, '赛事有主客队名');
    assert(m0.oddsW > 0 || m0.oddsD > 0, '赛事有赔率数据');
}

console.log('\n── C3. GitHub Actions workflow ──');
const dailyYml = fs.readFileSync(path.join(__dirname, '.github', 'workflows', 'daily.yml'), 'utf8');
// 验证脚本执行顺序
const fetchIdx = dailyYml.indexOf('fetch-data.js');
const analyzeIdx = dailyYml.indexOf('analyze.js');
const fbGenIdx = dailyYml.indexOf('generate-fb-picks.js');
const fbCompIdx = dailyYml.indexOf('compare-fb-results.js');
assert(fetchIdx > 0, 'daily.yml包含fetch-data.js');
assert(analyzeIdx > 0, 'daily.yml包含analyze.js');
assert(fetchIdx < analyzeIdx, '执行顺序: fetch → analyze');
assert(fbGenIdx > 0 && fbCompIdx > 0, 'daily.yml包含足彩脚本');

// ============================================================
// PART D: 边界条件与健壮性
// ============================================================
console.log('\n╔════════════════════════════════════════╗');
console.log('║  PART D: 边界条件与健壮性              ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('── D1. 历史数据边界号码 ──');
const allNums = new Set();
issues.forEach(d => d.front.forEach(n => allNums.add(n)));
assert(allNums.has(1), '前区出现过号码1');
assert(allNums.has(35), '前区出现过号码35');
const allBack = new Set();
issues.forEach(d => d.back.forEach(n => allBack.add(n)));
assert(allBack.has(1), '后区出现过号码1');
assert(allBack.has(12), '后区出现过号码12');

console.log('\n── D2. BQC比对逻辑 ──');
function getResult(h, a) { return h > a ? '胜' : h === a ? '平' : '负'; }
assert(getResult(2, 1) === '胜', '2:1→胜');
assert(getResult(1, 1) === '平', '1:1→平');
assert(getResult(0, 3) === '负', '0:3→负');
assert(getResult(0, 0) === '平', '0:0→平');

function getHalfFull(hh, ha, fh, fa) { return getResult(hh, ha) + getResult(fh, fa); }
assert(getHalfFull(1, 0, 2, 1) === '胜胜', '半场1:0全场2:1→胜胜');
assert(getHalfFull(0, 0, 1, 1) === '平平', '半场0:0全场1:1→平平');
assert(getHalfFull(0, 1, 2, 1) === '负胜', '半场0:1全场2:1→负胜(逆转)');

console.log('\n── D3. 进球彩比分映射 ──');
const goalMap = g => g >= 3 ? '3+' : String(g);
assert(goalMap(0) === '0', '0球→"0"');
assert(goalMap(2) === '2', '2球→"2"');
assert(goalMap(3) === '3+', '3球→"3+"');
assert(goalMap(5) === '3+', '5球→"3+"');

// ===== 总结 =====
console.log('\n═══════════════════════════════════════════════════');
console.log(`🏁 验证完成: ✅ ${passed} 通过 | ❌ ${failed} 失败 | ⚠️ ${warnings} 警告`);
console.log('═══════════════════════════════════════════════════\n');

if (failed > 0) {
    console.log('⛔ 失败项:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
} else if (warnings > 0) {
    console.log('✅ 全部通过 (有少量警告)');
} else {
    console.log('✅ 全部通过！逻辑可靠!');
}
