#!/usr/bin/env node
/**
 * 🔬 深度合理性验证脚本
 * 逐步追踪每个公式，验证数学正确性
 */
const fs = require('fs');
const path = require('path');
const matches = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'matches.json'), 'utf8')).matches;

function impliedProb(odds) { return odds > 0 ? 1 / odds : 0; }
function calcKelly(odds, prob) { const b = odds - 1; return b <= 0 ? 0 : (b * prob - (1 - prob)) / b; }
function calcEV(odds, prob) { return odds * prob - 1; }

function bayesianSmooth(rawProbs, prior = [0.36, 0.28, 0.36], strength = 5) {
    const n = 100;
    return rawProbs.map((p, i) => {
        const smoothed = (p * n + prior[i] * strength) / (n + strength);
        return Math.max(0.05, smoothed);
    });
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔬 足彩公式合理性逐步追踪');
console.log('═══════════════════════════════════════════════════════════════\n');

const homeAdv = 0.08, drawBias = 0.02;

const testMatches = matches.slice(0, 5);
testMatches.forEach((m, mi) => {
    const odds = [m.oddsW || 0, m.oddsD || 0, m.oddsL || 0];
    if (odds.every(o => o === 0)) return;
    
    console.log(`\n── ${mi+1}. ${m.home} vs ${m.away} (${m.league}) ──`);
    console.log(`  赔率: 胜=${odds[0]} 平=${odds[1]} 负=${odds[2]}`);
    
    // Step 1: 隐含概率
    const ipRaw = odds.map(impliedProb);
    const margin = ipRaw.reduce((a, b) => a + b, 0);
    const fairRaw = ipRaw.map(p => margin > 0 ? p / margin : 0.33);
    console.log(`  隐含概率(raw): 胜=${ipRaw[0].toFixed(4)} 平=${ipRaw[1].toFixed(4)} 负=${ipRaw[2].toFixed(4)} 总=${margin.toFixed(4)}`);
    console.log(`  公平概率(去margin): 胜=${fairRaw[0].toFixed(4)} 平=${fairRaw[1].toFixed(4)} 负=${fairRaw[2].toFixed(4)}`);
    
    // Step 2: 贝叶斯平滑
    const fair = bayesianSmooth(fairRaw);
    console.log(`  贝叶斯平滑后: 胜=${fair[0].toFixed(4)} 平=${fair[1].toFixed(4)} 负=${fair[2].toFixed(4)}`);
    
    // Step 3: homeAdv调整(乘法)
    const adj = [
        fair[0] * (1 + homeAdv),
        fair[1] * (1 + drawBias * 2),
        fair[2] * (1 - homeAdv * 0.5)
    ];
    const adjSum = adj.reduce((a, b) => a + b, 0);
    const probs = adj.map(p => Math.max(0.05, p / adjSum));
    console.log(`  homeAdv调整后: 胜=${probs[0].toFixed(4)} 平=${probs[1].toFixed(4)} 负=${probs[2].toFixed(4)}`);
    
    // Step 4: Kelly+EV计算 ← 关键验证点
    console.log(`\n  📊 Kelly/EV 详细计算:`);
    ['胜', '平', '负'].forEach((label, i) => {
        const b = odds[i] - 1;
        const kelly = calcKelly(odds[i], probs[i]);
        const ev = calcEV(odds[i], probs[i]);
        const kellyClamp = Math.max(0, kelly);
        const evClamp = Math.max(0, ev);
        
        console.log(`    ${label}: odds=${odds[i]} prob=${probs[i].toFixed(4)}`);
        console.log(`      Kelly = (b*p - q) / b = (${b.toFixed(2)}*${probs[i].toFixed(4)} - ${(1-probs[i]).toFixed(4)}) / ${b.toFixed(2)} = ${kelly.toFixed(6)} → clamp=${kellyClamp.toFixed(6)}`);
        console.log(`      EV    = odds*prob - 1 = ${odds[i]}*${probs[i].toFixed(4)} - 1 = ${ev.toFixed(6)} → clamp=${evClamp.toFixed(6)}`);
        console.log(`      ⚠️ Kelly ${kellyClamp === 0 ? '=0 (负值被截断)' : '>0 ✅'} EV ${evClamp === 0 ? '=0 (负EV,亏钱)' : '>0 ✅'}`);
    });
    
    // Step 5: 评分计算
    const raw = ['胜', '平', '负'].map((label, i) => ({
        label, kelly: Math.max(0, calcKelly(odds[i], probs[i])), ev: Math.max(0, calcEV(odds[i], probs[i])), prob: probs[i]
    }));
    const kMax = Math.max(0.001, ...raw.map(r => r.kelly));
    const eMax = Math.max(0.001, ...raw.map(r => r.ev));
    const pMax = Math.max(0.001, ...raw.map(r => r.prob));
    
    console.log(`\n  📏 归一化基准: kMax=${kMax.toFixed(6)} eMax=${eMax.toFixed(6)} pMax=${pMax.toFixed(6)}`);
    
    const STRATEGIES = [
        { id: 'conservative', weights: { kelly: 0.15, ev: 0.20, implied: 0.65 } },
        { id: 'balanced',     weights: { kelly: 0.35, ev: 0.35, implied: 0.30 } },
        { id: 'aggressive',   weights: { kelly: 0.45, ev: 0.40, implied: 0.15 } }
    ];
    
    STRATEGIES.forEach(strat => {
        const w = strat.weights;
        const results = raw.map(r => ({
            ...r,
            score: w.kelly * (r.kelly / kMax) + w.ev * (r.ev / eMax) + w.implied * (r.prob / pMax)
        }));
        results.sort((a, b) => b.score - a.score);
        const pick = results[0];
        console.log(`  ${strat.id}: 选${pick.label} (score=${pick.score.toFixed(4)}) | 全部=[${results.map(r=>r.label+'='+r.score.toFixed(3)).join(', ')}]`);
    });
});

// DLT合理性验证
console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('🔬 大乐透公式合理性验证');
console.log('═══════════════════════════════════════════════════════════════\n');

const history = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'history.json'), 'utf8'));
const issues = history.issues.slice(0, 20);

// 验证多窗口频率是否合理
const freq5 = {}, freq20 = {};
for (let i = 1; i <= 35; i++) { freq5[i] = 0; freq20[i] = 0; }
issues.slice(0, 5).forEach(d => d.front.forEach(n => freq5[n]++));
issues.slice(0, 20).forEach(d => d.front.forEach(n => freq20[n]++));

const top5 = Object.entries(freq5).sort((a,b) => b[1] - a[1]).slice(0, 5);
const top20 = Object.entries(freq20).sort((a,b) => b[1] - a[1]).slice(0, 5);
console.log(`近5期热号: ${top5.map(([n,f]) => `${n}(${f}次)`).join(', ')}`);
console.log(`近20期热号: ${top20.map(([n,f]) => `${n}(${f}次)`).join(', ')}`);

// 验证区间多窗口
const recent10 = issues.slice(0, 10);
const zoneCounts = {};
recent10.forEach(d => {
    let z1=0,z2=0,z3=0;
    d.front.forEach(n => { if(n<=12)z1++; else if(n<=24)z2++; else z3++; });
    const k = `${z1}:${z2}:${z3}`;
    zoneCounts[k] = (zoneCounts[k]||0)+1;
});
const topZone = Object.entries(zoneCounts).sort((a,b)=>b[1]-a[1]);
console.log(`近10期区间分布: ${topZone.map(([k,v])=>`${k}(${v}次)`).join(', ')}`);

// 验证和值约束
const sums = issues.map(d => d.front.reduce((a,b) => a+b, 0));
const mean = sums.reduce((a,b)=>a+b,0)/sums.length;
const std = Math.sqrt(sums.reduce((a,b)=>a+(b-mean)**2,0)/sums.length);
console.log(`前区和值: μ=${mean.toFixed(1)} σ=${std.toFixed(1)}`);
console.log(`1σ范围: [${(mean-std).toFixed(0)}, ${(mean+std).toFixed(0)}] — 应覆盖~68%数据`);
const in1sigma = sums.filter(s => s >= mean-std && s <= mean+std).length;
console.log(`实际覆盖: ${in1sigma}/${sums.length} = ${(in1sigma/sums.length*100).toFixed(1)}% (理论68%)`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔬 诊断结论');
console.log('═══════════════════════════════════════════════════════════════');
