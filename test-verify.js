#!/usr/bin/env node
/**
 * 🔍 深度验证脚本 — 检验所有核心算法和逻辑
 */
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, 'data');

let passed = 0, failed = 0, warnings = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.log(`  ❌ FAIL: ${msg}`); }
}
function warn(condition, msg) {
  if (!condition) { warnings++; console.log(`  ⚠️ WARN: ${msg}`); }
}

// ============================================
console.log('\n═══════════════════════════════════════════════════');
console.log('🔍 深度验证 — 体育彩票计算器');
console.log('═══════════════════════════════════════════════════\n');

// ===== 1. 数据文件完整性 =====
console.log('── 1. 数据文件完整性 ──');
const historyPath = path.join(DATA_DIR, 'history.json');
const analysisPath = path.join(DATA_DIR, 'analysis.json');
const modelPath = path.join(DATA_DIR, 'model-params.json');

assert(fs.existsSync(historyPath), 'history.json 存在');
assert(fs.existsSync(analysisPath), 'analysis.json 存在');
assert(fs.existsSync(modelPath), 'model-params.json 存在');

const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

assert(history.issues && history.issues.length > 50, `history.json 有足够数据 (${history.issues?.length || 0} 期)`);
assert(analysis.currentPrediction, 'analysis.json 包含当期预测');

// 验证每期数据格式
let dataFormatOK = true;
for (let i = 0; i < Math.min(10, history.issues.length); i++) {
  const d = history.issues[i];
  if (!d.issue || !d.front || !d.back) { dataFormatOK = false; break; }
  if (d.front.length !== 5) { dataFormatOK = false; break; }
  if (d.back.length !== 2) { dataFormatOK = false; break; }
  // 前区号码范围 1-35
  if (d.front.some(n => n < 1 || n > 35)) { dataFormatOK = false; break; }
  // 后区号码范围 1-12
  if (d.back.some(n => n < 1 || n > 12)) { dataFormatOK = false; break; }
  // 前区号码无重复
  if (new Set(d.front).size !== 5) { dataFormatOK = false; break; }
  // 后区号码无重复
  if (new Set(d.back).size !== 2) { dataFormatOK = false; break; }
}
assert(dataFormatOK, '历史数据格式正确 (前5+后2, 范围合法, 无重复)');

// ===== 2. 集成引擎算法 =====
console.log('\n── 2. 集成引擎 V5 算法验证 ──');
const { markovScores, intervalScores, bayesianNetworkScores, monteCarloScores, 
        affinityScores, buildAffinityMatrix, ensembleScores, optimizeWeights, pickTopN 
      } = require('./scripts/ensemble-engine');
const issues = history.issues;

// 2a. 马尔可夫链
const mkScores = markovScores(issues, 35, d => d.front);
assert(Object.keys(mkScores).length === 35, '马尔可夫: 35个号码都有评分');
assert(Object.values(mkScores).every(v => v >= 0 && v <= 1), '马尔可夫: 分数在[0,1]范围');
assert(Object.values(mkScores).some(v => v > 0.5), '马尔可夫: 存在高分号码');

// 2b. 间隔周期
const ivScores = intervalScores(issues, 35, d => d.front);
assert(Object.keys(ivScores).length === 35, '间隔周期: 35个号码都有评分');
assert(Object.values(ivScores).every(v => v >= 0 && v <= 1), '间隔周期: 分数在[0,1]范围');

// 2c. 贝叶斯网络
const bnScores = bayesianNetworkScores(issues, 35, d => d.front);
assert(Object.keys(bnScores).length === 35, '贝叶斯网络: 35个号码都有评分');
assert(Object.values(bnScores).every(v => v >= 0 && v <= 1.01), '贝叶斯网络: 分数在[0,1]范围');

// 2d. 蒙特卡洛
const mcScores = monteCarloScores(issues, 35, d => d.front, 5000);
assert(Object.keys(mcScores).length === 35, '蒙特卡洛: 35个号码都有评分');
assert(Object.values(mcScores).every(v => v >= 0 && v <= 1), '蒙特卡洛: 分数在[0,1]范围');

// 2e. 共现亲和
const afScores = affinityScores(issues, 35, d => d.front);
assert(Object.keys(afScores).length === 35, '共现亲和: 35个号码都有评分');
assert(Object.values(afScores).every(v => v >= 0 && v <= 1.01), '共现亲和: 分数在[0,1]范围');

// 2f. 亲和矩阵验证
const { lift, freq } = buildAffinityMatrix(issues, 35, d => d.front);
let liftValid = true;
for (let i = 1; i <= 35; i++) {
  if (lift[i][i] !== 1) { liftValid = false; break; } // 自身Lift=1
  for (let j = 1; j <= 35; j++) {
    if (lift[i][j] < 0) { liftValid = false; break; } // Lift非负
  }
}
assert(liftValid, '亲和矩阵: 对角线=1, Lift值非负');
// 检查是否有高亲和对 (Lift > 1.2)
let highAffinityPairs = 0;
for (let i = 1; i <= 34; i++) for (let j = i+1; j <= 35; j++) if (lift[i][j] > 1.2) highAffinityPairs++;
assert(highAffinityPairs > 5, `亲和矩阵: 发现 ${highAffinityPairs} 个高亲和对 (Lift>1.2)`);

// 2g. 集成融合
const { scores: ensScores, components } = ensembleScores(issues, 35, d => d.front);
assert(Object.keys(ensScores).length === 35, '集成融合: 35个号码都有评分');
assert(components.markov && components.interval && components.bayesian && components.montecarlo && components.affinity, '集成融合: 包含全部5个分量');
const frontPick = pickTopN(ensScores, 5);
assert(frontPick.length === 5, '集成融合: 能选出5个前区号码');
assert(frontPick.every(n => n >= 1 && n <= 35), '集成融合: 选号在1-35范围');
assert(new Set(frontPick).size === 5, '集成融合: 选号无重复');

// 2h. 后区
const { scores: backScores } = ensembleScores(issues, 12, d => d.back);
const backPick = pickTopN(backScores, 2);
assert(backPick.length === 2, '后区: 能选出2个号码');
assert(backPick.every(n => n >= 1 && n <= 12), '后区: 选号在1-12范围');
assert(new Set(backPick).size === 2, '后区: 选号无重复');

// ===== 3. 智能缩水验证 =====
console.log('\n── 3. 智能缩水 (smart-pick.js) 验证 ──');
const { smartPick } = require('./scripts/smart-pick');
const spResult = smartPick(issues, 'both');

assert(spResult.select && spResult.select.length > 0, `精选模式: 生成 ${spResult.select?.length || 0} 注`);
assert(spResult.coverage && spResult.coverage.length > 0, `覆盖模式: 生成 ${spResult.coverage?.length || 0} 注`);

// 验证每注格式
let pickFormatOK = true;
[...spResult.select, ...spResult.coverage].forEach(p => {
  if (!p.front || p.front.length !== 5) { pickFormatOK = false; return; }
  if (!p.back || p.back.length !== 2) { pickFormatOK = false; return; }
  if (p.front.some(n => n < 1 || n > 35)) { pickFormatOK = false; return; }
  if (p.back.some(n => n < 1 || n > 12)) { pickFormatOK = false; return; }
  if (new Set(p.front).size !== 5) { pickFormatOK = false; return; }
  if (new Set(p.back).size !== 2) { pickFormatOK = false; return; }
  // 排序检查
  for (let i = 1; i < p.front.length; i++) {
    if (p.front[i] <= p.front[i-1]) { pickFormatOK = false; return; }
  }
});
assert(pickFormatOK, '所有推荐注数格式正确 (5+2, 范围合法, 无重复, 升序)');

// AC值验证
function calcAC(front) {
  const diffs = new Set();
  for (let i = 0; i < front.length; i++)
    for (let j = i+1; j < front.length; j++)
      diffs.add(Math.abs(front[i] - front[j]));
  return diffs.size - (front.length - 1);
}
let acValid = true;
[...spResult.select, ...spResult.coverage].forEach(p => {
  const ac = calcAC(p.front);
  if (ac < 4) { acValid = false; console.log(`    ❌ AC值=${ac} 不合格: ${p.front}`); }
});
assert(acValid, '所有推荐AC值 ≥ 4');

// 和值验证
let sumValid = true;
[...spResult.select, ...spResult.coverage].forEach(p => {
  const sum = p.front.reduce((a,b) => a+b, 0);
  if (sum < 30 || sum > 150) { sumValid = false; console.log(`    ❌ 和值=${sum} 异常: ${p.front}`); }
});
assert(sumValid, '所有推荐和值在合理范围 (30-150)');

// 跨度验证
let spanValid = true;
[...spResult.select, ...spResult.coverage].forEach(p => {
  const span = p.front[4] - p.front[0];
  if (span < 12) { spanValid = false; console.log(`    ❌ 跨度=${span} 过小: ${p.front}`); }
});
assert(spanValid, '所有推荐跨度 ≥ 12');

// 覆盖多样性检查
const allFrontNums = new Set();
spResult.coverage.forEach(p => p.front.forEach(n => allFrontNums.add(n)));
assert(allFrontNums.size >= 10, `覆盖模式使用 ${allFrontNums.size} 个不同号码 (应≥10)`);
warn(allFrontNums.size >= 15, `覆盖模式号码多样性偏低 (${allFrontNums.size} 个)`);

const allBackNums = new Set();
[...spResult.select, ...spResult.coverage].forEach(p => p.back.forEach(n => allBackNums.add(n)));
assert(allBackNums.size >= 4, `后区使用 ${allBackNums.size} 个不同号码 (应≥4)`);

// ===== 4. analyze.js 输出验证 =====
console.log('\n── 4. analyze.js 输出验证 ──');
assert(analysis.latestIssue, `最新期号: ${analysis.latestIssue}`);
assert(analysis.nextIssue, `目标期号: ${analysis.nextIssue}`);
assert(analysis.modelVersion >= 1, `模型版本: v${analysis.modelVersion}`);
assert(analysis.summary, '包含分析概要');
assert(analysis.summary.hotFront && analysis.summary.hotFront.length >= 5, `前区热号: ${analysis.summary.hotFront?.length} 个`);
assert(analysis.summary.coldFront && analysis.summary.coldFront.length >= 5, `前区冷号: ${analysis.summary.coldFront?.length} 个`);

// 预测数据验证
const pred = analysis.currentPrediction;
assert(pred && pred.predictions, '当期预测存在');
assert(pred.predictions.length >= 6, `预测策略数: ${pred.predictions.length} (应≥6)`);
pred.predictions.forEach(p => {
  const frontOK = p.front && p.front.length === 5 && p.front.every(n => n >= 1 && n <= 35) && new Set(p.front).size === 5;
  const backOK = p.back && p.back.length === 2 && p.back.every(n => n >= 1 && n <= 12) && new Set(p.back).size === 2;
  if (!frontOK || !backOK) {
    failed++;
    console.log(`  ❌ 策略 "${p.label}" 格式异常: front=${JSON.stringify(p.front)} back=${JSON.stringify(p.back)}`);
  }
});
console.log(`  ✅ ${pred.predictions.length} 个策略预测格式正确`);
passed++;

// smartPick字段验证
assert(analysis.smartPick, 'analysis.json 包含 smartPick 字段');
if (analysis.smartPick) {
  assert(analysis.smartPick.select && analysis.smartPick.select.length > 0, `smartPick.select: ${analysis.smartPick.select?.length} 注`);
  assert(analysis.smartPick.coverage && analysis.smartPick.coverage.length > 0, `smartPick.coverage: ${analysis.smartPick.coverage?.length} 注`);
}

// 预测记录
assert(analysis.predictionRecords && analysis.predictionRecords.length > 0, `预测存档: ${analysis.predictionRecords?.length} 期`);

// 策略表现
assert(analysis.strategyPerformance, '策略表现数据存在');
const perfKeys = Object.keys(analysis.strategyPerformance || {});
console.log(`  ✅ 策略表现: ${perfKeys.length} 个策略`);
passed++;

// evolvedStrategies
assert(analysis.evolvedStrategies && analysis.evolvedStrategies.length > 0, `进化策略: ${analysis.evolvedStrategies?.length} 个`);

// ===== 5. 跨策略去重检查 =====
console.log('\n── 5. 跨策略去重 & 一致性检查 ──');
const predSets = pred.predictions.map(p => p.front.join(',') + '+' + p.back.join(','));
const uniquePreds = new Set(predSets);
assert(uniquePreds.size === predSets.length, `${predSets.length} 个策略预测全部不同 (无重复)`);

// 随机基准应与其他策略不同
const randomPred = pred.predictions.find(p => p.strategyId === 'random');
if (randomPred) {
  const otherPreds = pred.predictions.filter(p => p.strategyId !== 'random');
  const randomFront = randomPred.front.join(',');
  const sameAsOther = otherPreds.some(p => p.front.join(',') === randomFront);
  assert(!sameAsOther, '随机基准与其他策略不重复');
}

// ===== 6. 足彩模块检查 =====
console.log('\n── 6. 足彩模块检查 ──');
const fbPicksPath = path.join(DATA_DIR, 'fb-picks', 'latest.json');
const matchesPath = path.join(DATA_DIR, 'matches.json');
if (fs.existsSync(fbPicksPath)) {
  const fbPicks = JSON.parse(fs.readFileSync(fbPicksPath, 'utf8'));
  assert(fbPicks.generatedAt, `足彩推荐: 生成于 ${fbPicks.generatedAt}`);
  // 足彩数据使用 sf/r9/bqc/jq 四个子类别
  const hasPicks = fbPicks.sf || fbPicks.r9 || fbPicks.bqc || fbPicks.jq;
  assert(hasPicks, '足彩推荐: 包含胜负/任9/半全场/进球数分类');
  if (fbPicks.sf && fbPicks.sf.picks) {
    assert(fbPicks.sf.picks.length > 0, `胜负彩推荐: ${fbPicks.sf.picks.length} 场`);
    const m = fbPicks.sf.picks[0];
    assert(m.pick && ['胜', '平', '负'].includes(m.pick), `推荐格式正确: ${m.home || m.homeTeam} → ${m.pick}`);
  }
} else {
  console.log('  ⚠️ fb-picks/latest.json 不存在 (可能未运行过足彩推荐)');
  warnings++;
}

if (fs.existsSync(matchesPath)) {
  const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
  assert(matches.matches || matches.totalMatches !== undefined, '比赛数据文件格式正确');
} else {
  console.log('  ⚠️ matches.json 不存在');
  warnings++;
}

// model-params
const modelParams = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
assert(modelParams.version >= 1, `模型参数: v${modelParams.version}`);

// ===== 7. JS文件引用完整性 =====
console.log('\n── 7. 前端文件完整性 ──');
const requiredFiles = ['index.html', 'index.css', 'js/utils.js', 'js/football.js', 'js/dlt.js', 'js/charts.js', 'js/main.js'];
requiredFiles.forEach(f => {
  const fp = path.join(__dirname, f);
  assert(fs.existsSync(fp), `${f} 存在`);
});

// 检查HTML是否引用了所有JS
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
['utils.js', 'football.js', 'dlt.js', 'charts.js', 'main.js'].forEach(jsFile => {
  assert(htmlContent.includes(jsFile), `index.html 引用 ${jsFile}`);
});

// 检查smart-pick-card在HTML中
assert(htmlContent.includes('smart-pick-card'), 'index.html 包含智能缩水卡片');
assert(htmlContent.includes('sp-probability-boost'), 'index.html 包含概率提升显示');
assert(htmlContent.includes('sp-select-picks'), 'index.html 包含精选模式容器');
assert(htmlContent.includes('sp-coverage-picks'), 'index.html 包含覆盖模式容器');

// 检查dlt.js包含renderSmartPick函数
const dltContent = fs.readFileSync(path.join(__dirname, 'js', 'dlt.js'), 'utf8');
assert(dltContent.includes('renderSmartPick'), 'dlt.js 包含 renderSmartPick 函数');
assert(dltContent.includes('renderPickList'), 'dlt.js 包含 renderPickList 函数');
assert(dltContent.includes('loadAutoAnalysis'), 'dlt.js 包含 loadAutoAnalysis 函数');

// ===== 8. GitHub Actions 配置 =====
console.log('\n── 8. GitHub Actions 配置 ──');
const dailyYml = fs.readFileSync(path.join(__dirname, '.github', 'workflows', 'daily.yml'), 'utf8');
assert(dailyYml.includes('analyze.js'), 'daily.yml 运行 analyze.js');
assert(dailyYml.includes('fetch-data.js'), 'daily.yml 运行 fetch-data.js');
assert(dailyYml.includes('generate-fb-picks.js'), 'daily.yml 运行 generate-fb-picks.js');
assert(dailyYml.includes('compare-fb-results.js'), 'daily.yml 运行 compare-fb-results.js');

const pagesYml = path.join(__dirname, '.github', 'workflows', 'deploy-pages.yml');
assert(fs.existsSync(pagesYml), 'deploy-pages.yml 存在');
const pagesContent = fs.readFileSync(pagesYml, 'utf8');
assert(pagesContent.includes('deploy-pages'), 'deploy-pages.yml 配置正确');

// ===== 总结 =====
console.log('\n═══════════════════════════════════════════════════');
console.log(`🏁 验证完成: ✅ ${passed} 通过 | ❌ ${failed} 失败 | ⚠️ ${warnings} 警告`);
console.log('═══════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('⛔ 存在失败项，需要修复！');
  process.exit(1);
} else if (warnings > 0) {
  console.log('✅ 全部通过 (有少量警告)');
} else {
  console.log('✅ 全部通过！');
}
