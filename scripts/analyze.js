#!/usr/bin/env node
/**
 * 📊 DLT 自动分析与预测脚本
 * 
 * 功能: 读取 history.json, 运行频率/遗漏/冷热分析, 生成5组预测, 对比历史预测
 * 运行: node scripts/analyze.js
 * 输出: data/analysis.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const ANALYSIS_FILE = path.join(DATA_DIR, 'analysis.json');

// ---- 读取历史数据 ----
function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) throw new Error('history.json 不存在，请先运行 fetch-data.js');
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
}

// ---- 读取已有分析（增量对比用） ----
function loadAnalysis() {
    if (!fs.existsSync(ANALYSIS_FILE)) return null;
    try { return JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf8')); } catch { return null; }
}

// ---- 频率统计 ----
function calcFrequency(issues, maxNum, selector) {
    const freq = {};
    for (let i = 1; i <= maxNum; i++) freq[i] = 0;
    issues.forEach(d => selector(d).forEach(n => freq[n]++));
    return freq;
}

// ---- 遗漏值 ----
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

// ---- 近期频率 (最近20期) ----
function calcRecent(issues, maxNum, selector, window = 20) {
    const recent = issues.slice(0, Math.min(window, issues.length));
    return calcFrequency(recent, maxNum, selector);
}

// ---- 综合打分选号 ----
function scoreNumbers(freq, miss, recent, maxNum, weights) {
    const scores = {};
    const fMax = Math.max(...Object.values(freq)) || 1;
    const mMax = Math.max(...Object.values(miss)) || 1;
    const rMax = Math.max(...Object.values(recent)) || 1;

    for (let i = 1; i <= maxNum; i++) {
        scores[i] = (freq[i] / fMax) * weights.wFreq
            + (miss[i] / mMax) * weights.wMiss
            + (recent[i] / rMax) * weights.wRecent
            + (Math.random() * 0.1); // 微随机
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

function randomPick(max, count) {
    const pool = Array.from({ length: max }, (_, i) => i + 1);
    const result = [];
    while (result.length < count) {
        const idx = Math.floor(Math.random() * pool.length);
        result.push(pool.splice(idx, 1)[0]);
    }
    return result.sort((a, b) => a - b);
}

// ---- 5种策略 ----
const STRATEGIES = [
    { id: 'hot', name: '🔥 热号趋势', wFreq: 0.5, wMiss: 0.1, wRecent: 0.4 },
    { id: 'cold', name: '❄️ 冷号回补', wFreq: 0.1, wMiss: 0.6, wRecent: 0.3 },
    { id: 'balanced', name: '⚖️ 均衡推荐', wFreq: 0.3, wMiss: 0.35, wRecent: 0.35 },
    { id: 'adaptive', name: '🎯 自适应', wFreq: 0.33, wMiss: 0.33, wRecent: 0.34 },
    { id: 'random', name: '🎲 随机基准', wFreq: 0, wMiss: 0, wRecent: 0 }
];

// ---- 奖级计算 ----
function calcHitLevel(fHits, bHits) {
    if (fHits === 5 && bHits === 2) return '一等奖';
    if (fHits === 5 && bHits === 1) return '二等奖';
    if (fHits === 5 && bHits === 0) return '三等奖';
    if (fHits === 4 && bHits === 2) return '四等奖';
    if (fHits === 4 && bHits === 1) return '五等奖';
    if (fHits === 3 && bHits === 2) return '六等奖';
    if (fHits === 4 && bHits === 0) return '七等奖';
    if ((fHits === 3 && bHits === 1) || (fHits === 2 && bHits === 2)) return '八等奖';
    if ((fHits === 3 && bHits === 0) || (fHits === 2 && bHits === 1) || (fHits === 1 && bHits === 2) || (fHits === 0 && bHits === 2)) return '九等奖';
    return '未中奖';
}

// ---- 主逻辑 ----
function main() {
    console.log('📊 大乐透自动分析开始...\n');

    const history = loadHistory();
    const issues = history.issues;
    console.log(`📂 加载 ${issues.length} 期数据，最新: 第 ${issues[0]?.issue} 期\n`);

    if (issues.length < 10) { console.error('❌ 数据不足10期，无法分析'); process.exit(1); }

    // 统计分析
    const frontFreq = calcFrequency(issues, 35, d => d.front);
    const frontMiss = calcMissing(issues, 35, d => d.front);
    const frontRecent = calcRecent(issues, 35, d => d.front);
    const backFreq = calcFrequency(issues, 12, d => d.back);
    const backMiss = calcMissing(issues, 12, d => d.back);
    const backRecent = calcRecent(issues, 12, d => d.back);

    // 热号/冷号
    const hotFront = Object.entries(frontFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => Number(e[0]));
    const coldFront = Object.entries(frontFreq).sort((a, b) => a[1] - b[1]).slice(0, 10).map(e => Number(e[0]));
    const hotBack = Object.entries(backFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => Number(e[0]));

    console.log(`🔥 前区热号: ${hotFront.join(', ')}`);
    console.log(`❄️ 前区冷号: ${coldFront.join(', ')}`);
    console.log(`🔵 后区热号: ${hotBack.join(', ')}\n`);

    // 读取已有分析，检查自适应权重
    const prevAnalysis = loadAnalysis();
    let adaptiveWeights = { wFreq: 0.33, wMiss: 0.33, wRecent: 0.34 };
    if (prevAnalysis?.strategyPerformance) {
        const perf = prevAnalysis.strategyPerformance;
        let best = null, bestScore = -1;
        ['hot', 'cold', 'balanced'].forEach(id => {
            const p = perf[id];
            if (p && p.total >= 3) {
                const score = (p.totalFrontHits / p.total) + (p.totalBackHits / p.total) * 2;
                if (score > bestScore) { bestScore = score; best = id; }
            }
        });
        if (best) {
            const src = STRATEGIES.find(s => s.id === best);
            adaptiveWeights = { wFreq: src.wFreq * 0.8 + 0.1, wMiss: src.wMiss * 0.8 + 0.1, wRecent: src.wRecent * 0.8 + 0.1 };
            console.log(`🎯 自适应学习: 向 ${src.name} 倾斜 (基于 ${perf[best].total} 期表现)\n`);
        }
    }

    // 生成下期预测
    const nextIssue = String(parseInt(issues[0].issue) + 1);
    console.log(`🔮 为第 ${nextIssue} 期生成预测...\n`);

    const predictions = STRATEGIES.map(strat => {
        let front, back;
        if (strat.id === 'random') {
            front = randomPick(35, 5);
            back = randomPick(12, 2);
        } else {
            const w = strat.id === 'adaptive' ? adaptiveWeights : strat;
            const fScores = scoreNumbers(frontFreq, frontMiss, frontRecent, 35, w);
            const bScores = scoreNumbers(backFreq, backMiss, backRecent, 12, w);
            front = pickByScore(fScores, 5);
            back = pickByScore(bScores, 2);
        }
        console.log(`  ${strat.name}: 前区 ${front.map(n => String(n).padStart(2, '0')).join(' ')} + 后区 ${back.map(n => String(n).padStart(2, '0')).join(' ')}`);
        return { strategyId: strat.id, label: strat.name, front, back };
    });

    // 对比历史预测
    let strategyPerf = prevAnalysis?.strategyPerformance || {};
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
        // 更新策略表现
        record.predictions.forEach((p, i) => {
            const id = p.strategyId;
            if (!strategyPerf[id]) strategyPerf[id] = { total: 0, totalFrontHits: 0, totalBackHits: 0, bestFront: 0, bestBack: 0 };
            const sp = strategyPerf[id];
            sp.total++; sp.totalFrontHits += record.hits[i].frontHits; sp.totalBackHits += record.hits[i].backHits;
            if (record.hits[i].frontHits > sp.bestFront) { sp.bestFront = record.hits[i].frontHits; sp.bestBack = record.hits[i].backHits; }
        });
        comparedCount++;
    });

    if (comparedCount > 0) console.log(`\n📋 自动对比了 ${comparedCount} 期历史预测\n`);

    // 添加本次预测到记录
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

    // 只保留最近50期预测记录
    if (predictionRecords.length > 50) predictionRecords = predictionRecords.slice(0, 50);

    // 构建输出
    const output = {
        lastUpdate: new Date().toISOString(),
        latestIssue: issues[0].issue,
        nextIssue,
        analysisRange: issues.length,
        summary: {
            hotFront, coldFront, hotBack,
            frontFrequency: frontFreq,
            frontMissing: frontMiss,
            backFrequency: backFreq,
            backMissing: backMiss
        },
        currentPrediction: {
            targetIssue: nextIssue,
            predictions
        },
        predictionRecords,
        strategyPerformance: strategyPerf
    };

    fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(output, null, 2), 'utf8');

    // 打印策略表现
    console.log('\n📈 策略表现汇总:');
    console.log('─'.repeat(60));
    STRATEGIES.forEach(s => {
        const p = strategyPerf[s.id];
        if (!p || p.total === 0) { console.log(`  ${s.name}: 暂无数据`); return; }
        console.log(`  ${s.name}: ${p.total}次预测 | 前区平均 ${(p.totalFrontHits / p.total).toFixed(1)}/5 | 后区平均 ${(p.totalBackHits / p.total).toFixed(1)}/2 | 最佳 ${p.bestFront}+${p.bestBack}`);
    });

    console.log(`\n💾 分析结果已保存: ${ANALYSIS_FILE}`);
    console.log('✅ 分析完成!\n');
}

main();
