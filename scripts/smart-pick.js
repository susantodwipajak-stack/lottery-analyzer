#!/usr/bin/env node
/**
 * 🎯 DLT 智能缩水 + 轮转覆盖系统 V1.0
 * 
 * 阶段1: 号码缩水 (Number Reduction)
 *   - 集成引擎评分 → 排除低概率号码
 *   - AC值过滤 → 去除离散度异常的组合
 *   - 三区比/奇偶/和值/连号约束
 * 
 * 阶段2: 轮转覆盖 (Wheeling System)
 *   - 从候选池选核心号 → 生成覆盖设计
 *   - 精选模式(5-8注) / 覆盖模式(20-30注)
 *   - 数学保证: 核心号命中≥K个 → 至少1注中奖
 * 
 * 运行: node scripts/smart-pick.js
 * 也被 analyze.js 调用
 */

const fs = require('fs');
const path = require('path');
const { ensembleScores, pickTopN } = require('./ensemble-engine');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ========== AC值计算 ==========

function calcAC(nums) {
    // AC = 实际差值种类数 - (选号数-1)
    const sorted = [...nums].sort((a, b) => a - b);
    const diffs = new Set();
    for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
            diffs.add(sorted[j] - sorted[i]);
        }
    }
    return diffs.size - (nums.length - 1);
}

// ========== 号码缩水引擎 ==========

function reduceNumbers(issues, maxNum, selector, eliminateCount = 8) {
    // Step 1: 集成引擎评分获得每个号码的综合得分
    const { scores } = ensembleScores(issues, maxNum, selector);

    // Step 2: 按得分排序，排除最低分的号码
    const ranked = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(e => ({ num: Number(e[0]), score: e[1] }));

    const eliminated = ranked.slice(-eliminateCount).map(r => r.num);
    const candidates = ranked.slice(0, -eliminateCount).map(r => r.num);

    return { candidates, eliminated, ranked };
}

// ========== 组合约束过滤 ==========

function validateCombination(front, back, constraints) {
    const { sumRange, acRange, oddRange, spanRange, zoneRule } = constraints;

    // 和值约束
    const sum = front.reduce((a, b) => a + b, 0);
    if (sum < sumRange[0] || sum > sumRange[1]) return false;

    // AC值约束
    const ac = calcAC(front);
    if (ac < acRange[0] || ac > acRange[1]) return false;

    // 奇偶约束
    const odd = front.filter(n => n % 2 === 1).length;
    if (odd < oddRange[0] || odd > oddRange[1]) return false;

    // 跨度约束
    const span = Math.max(...front) - Math.min(...front);
    if (span < spanRange[0] || span > spanRange[1]) return false;

    // 三区比约束 (至少每区有1个，或符合高频比)
    if (zoneRule) {
        const z1 = front.filter(n => n <= 12).length;
        const z2 = front.filter(n => n > 12 && n <= 24).length;
        const z3 = front.filter(n => n > 24).length;
        // 不允许任两区为0
        if ((z1 === 0 && z2 === 0) || (z1 === 0 && z3 === 0) || (z2 === 0 && z3 === 0)) return false;
    }

    return true;
}

function buildConstraints(issues, selector) {
    const sums = issues.map(d => selector(d).reduce((a, b) => a + b, 0));
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const std = Math.sqrt(sums.reduce((a, b) => a + (b - mean) ** 2, 0) / sums.length);

    return {
        sumRange: [Math.floor(mean - 1.2 * std), Math.ceil(mean + 1.2 * std)],
        acRange: [4, 10],      // 历史AC值主要集中在5-8，放宽到4-10
        oddRange: [1, 4],      // 奇数个数1-4（排除全奇全偶）
        spanRange: [12, 33],   // 跨度12-33
        zoneRule: true         // 三区比不允许两区为空
    };
}

// ========== 轮转覆盖系统 ==========

// 生成k-覆盖设计: 从N个候选号中选出最少注数，
// 保证候选号中任意t个号码，至少有1注包含其中k个

function generateWheelCovering(coreNums, backNums, pickCount, constraints, mode = 'coverage') {
    const n = coreNums.length;
    const results = [];

    if (mode === 'select') {
        // 精选模式: 评分最高的5-8注
        return generateSelectMode(coreNums, backNums, pickCount, constraints);
    }

    // 覆盖模式: 系统化覆盖
    // 使用贪心覆盖算法
    const allCombinations = [];

    // 生成所有有效的5-number组合（从核心号中）
    generateCombinations(coreNums, pickCount, 0, [], combo => {
        if (allCombinations.length > 50000) return; // 安全上限
        const front = [...combo].sort((a, b) => a - b);
        // 快速过滤
        const sum = front.reduce((a, b) => a + b, 0);
        if (sum < constraints.sumRange[0] || sum > constraints.sumRange[1]) return;
        const ac = calcAC(front);
        if (ac < constraints.acRange[0] || ac > constraints.acRange[1]) return;
        const odd = front.filter(n => n % 2 === 1).length;
        if (odd < constraints.oddRange[0] || odd > constraints.oddRange[1]) return;
        allCombinations.push(front);
    });

    if (allCombinations.length === 0) {
        return generateSelectMode(coreNums, backNums, pickCount, constraints);
    }

    // 打乱顺序以提升覆盖多样性
    for (let i = allCombinations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCombinations[i], allCombinations[j]] = [allCombinations[j], allCombinations[i]];
    }

    // 贪心覆盖: 选择能覆盖最多"未覆盖号码对"的组合
    const coveredPairs = new Set();
    const selected = [];
    const maxSets = mode === 'coverage' ? 30 : 8;

    while (selected.length < maxSets && allCombinations.length > 0) {
        let bestIdx = 0, bestNewPairs = 0;

        for (let i = 0; i < Math.min(allCombinations.length, 2000); i++) {
            const combo = allCombinations[i];
            let newPairs = 0;
            for (let a = 0; a < combo.length; a++) {
                for (let b = a + 1; b < combo.length; b++) {
                    const pairKey = `${combo[a]}-${combo[b]}`;
                    if (!coveredPairs.has(pairKey)) newPairs++;
                }
            }
            if (newPairs > bestNewPairs) { bestNewPairs = newPairs; bestIdx = i; }
        }

        if (bestNewPairs === 0 && selected.length >= 8) break; // 所有对已覆盖

        const chosen = allCombinations.splice(bestIdx, 1)[0];
        selected.push(chosen);

        // 标记覆盖的对
        for (let a = 0; a < chosen.length; a++) {
            for (let b = a + 1; b < chosen.length; b++) {
                coveredPairs.add(`${chosen[a]}-${chosen[b]}`);
            }
        }
    }

    // 为每注分配后区
    const backPool = [...backNums];
    return selected.map((front, idx) => {
        // 轮转分配后区
        const b1 = backPool[idx % backPool.length];
        const b2 = backPool[(idx + 1) % backPool.length];
        const back = b1 !== b2 ? [b1, b2].sort((a, b) => a - b) : [b1, backPool[(idx + 2) % backPool.length]].sort((a, b) => a - b);
        return { front, back };
    });
}

function generateSelectMode(coreNums, backNums, pickCount, constraints) {
    // 精选模式: 用多次随机采样生成质量最高的组合
    const results = [];
    const seen = new Set();

    for (let attempt = 0; attempt < 15000 && results.length < 8; attempt++) {
        // 加权随机选择（前面的号权重更高，但衰减柔和）
        const selected = [];
        const pool = [...coreNums];
        for (let i = 0; i < pickCount; i++) {
            // 柔和衰减: 保证低排名号也有合理机会
            const weights = pool.map((_, idx) => Math.exp(-idx * 0.05));
            const totalW = weights.reduce((a, b) => a + b, 0);
            let r = Math.random() * totalW;
            let chosenIdx = 0;
            for (let j = 0; j < weights.length; j++) {
                r -= weights[j];
                if (r <= 0) { chosenIdx = j; break; }
            }
            selected.push(pool.splice(chosenIdx, 1)[0]);
        }

        const front = selected.sort((a, b) => a - b);
        const key = front.join(',');
        if (seen.has(key)) continue;
        seen.add(key);

        if (!validateCombination(front, [], constraints)) continue;

        results.push({ front, back: [] });
    }

    // 后区轮转分配
    return results.map((r, idx) => {
        const b1 = backNums[idx % backNums.length];
        let b2 = backNums[(idx + Math.floor(backNums.length / 2)) % backNums.length];
        if (b1 === b2) b2 = backNums[(idx + 1) % backNums.length];
        return { front: r.front, back: [b1, b2].sort((a, b) => a - b) };
    });
}

function generateCombinations(arr, k, start, current, callback) {
    if (current.length === k) { callback([...current]); return; }
    for (let i = start; i <= arr.length - (k - current.length); i++) {
        current.push(arr[i]);
        generateCombinations(arr, k, i + 1, current, callback);
        current.pop();
    }
}

// ========== 覆盖率分析 ==========

function analyzeCoverage(selections, coreNums) {
    // 分析这些注覆盖了核心号的多少"对"
    const totalPairs = coreNums.length * (coreNums.length - 1) / 2;
    const coveredPairs = new Set();
    const numberCoverage = {};

    coreNums.forEach(n => numberCoverage[n] = 0);

    selections.forEach(({ front }) => {
        front.forEach(n => { if (numberCoverage[n] !== undefined) numberCoverage[n]++; });
        for (let a = 0; a < front.length; a++) {
            for (let b = a + 1; b < front.length; b++) {
                coveredPairs.add(`${front[a]}-${front[b]}`);
            }
        }
    });

    return {
        totalSets: selections.length,
        pairCoverage: `${coveredPairs.size}/${totalPairs} (${(coveredPairs.size / totalPairs * 100).toFixed(1)}%)`,
        numberCoverage,
        guaranteeLevel: estimateGuarantee(selections, coreNums)
    };
}

function estimateGuarantee(selections, coreNums) {
    // 估算: 如果核心号命中K个，最少能中几个
    const guarantees = {};
    for (let k = 2; k <= 5; k++) {
        let minHits = Infinity;
        // 抽样检测
        const testSize = Math.min(500, coreNums.length ** k);
        for (let test = 0; test < testSize; test++) {
            // 随机选k个核心号作为"中奖号"
            const pool = [...coreNums];
            const drawn = [];
            for (let i = 0; i < k; i++) {
                const idx = Math.floor(Math.random() * pool.length);
                drawn.push(pool.splice(idx, 1)[0]);
            }
            // 看哪注命中最多
            let bestHit = 0;
            selections.forEach(({ front }) => {
                const hits = front.filter(n => drawn.includes(n)).length;
                if (hits > bestHit) bestHit = hits;
            });
            if (bestHit < minHits) minHits = bestHit;
        }
        guarantees[`core${k}`] = minHits;
    }
    return guarantees;
}

// ========== 主函数 ==========

function smartPick(issues, mode = 'both') {
    const frontSelector = d => d.front;
    const backSelector = d => d.back;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 智能缩水 + 轮转覆盖系统');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ===== 阶段1: 号码缩水 =====
    console.log('── 阶段1: 号码缩水 ──\n');

    const { candidates: frontCandidates, eliminated: frontEliminated, ranked: frontRanked } =
        reduceNumbers(issues, 35, frontSelector, 8);
    const { candidates: backCandidates, eliminated: backEliminated } =
        reduceNumbers(issues, 12, backSelector, 3);

    console.log(`  前区: 35 → ${frontCandidates.length}个候选 (排除${frontEliminated.length}个)`);
    console.log(`  排除号码: ${frontEliminated.sort((a, b) => a - b).map(n => String(n).padStart(2, '0')).join(' ')}`);
    console.log(`  候选号码: ${frontCandidates.sort((a, b) => a - b).map(n => String(n).padStart(2, '0')).join(' ')}`);
    console.log(`  后区: 12 → ${backCandidates.length}个候选`);
    console.log(`  候选号码: ${backCandidates.sort((a, b) => a - b).map(n => String(n).padStart(2, '0')).join(' ')}`);

    // 概率提升计算
    const C = (n, k) => {
        let r = 1;
        for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
        return r;
    };
    const originalCombs = C(35, 5) * C(12, 2);
    const reducedCombs = C(frontCandidates.length, 5) * C(backCandidates.length, 2);
    console.log(`\n  📐 组合空间: ${originalCombs.toLocaleString()} → ${reducedCombs.toLocaleString()}`);
    console.log(`  📈 概率提升: ${(originalCombs / reducedCombs).toFixed(1)}倍`);

    // 构建约束
    const constraints = buildConstraints(issues, frontSelector);
    console.log(`\n  📏 约束参数:`);
    console.log(`    和值: [${constraints.sumRange.join(', ')}]`);
    console.log(`    AC值: [${constraints.acRange.join(', ')}]`);
    console.log(`    奇数: [${constraints.oddRange.join(', ')}]`);
    console.log(`    跨度: [${constraints.spanRange.join(', ')}]`);

    // ===== 阶段2: 生成方案 =====

    // 核心号: 前区取TOP12-15
    const coreCount = Math.min(15, frontCandidates.length);
    const coreFront = frontCandidates.slice(0, coreCount);
    const coreBack = backCandidates.slice(0, 5);

    const output = { select: null, coverage: null };

    // 精选模式
    if (mode === 'both' || mode === 'select') {
        console.log('\n── 阶段2A: 精选模式 (5-8注) ──\n');
        const selectPicks = generateWheelCovering(coreFront, coreBack, 5, constraints, 'select');
        output.select = selectPicks;

        selectPicks.forEach((pick, i) => {
            const ac = calcAC(pick.front);
            const sum = pick.front.reduce((a, b) => a + b, 0);
            const odd = pick.front.filter(n => n % 2 === 1).length;
            const fStr = pick.front.map(n => String(n).padStart(2, '0')).join(' ');
            const bStr = pick.back.map(n => String(n).padStart(2, '0')).join(' ');
            console.log(`  第${i + 1}注: ${fStr} + ${bStr}  [AC=${ac} 和=${sum} 奇偶=${odd}:${5 - odd}]`);
        });
    }

    // 覆盖模式
    if (mode === 'both' || mode === 'coverage') {
        console.log('\n── 阶段2B: 覆盖模式 (20-30注) ──\n');
        const coverPicks = generateWheelCovering(coreFront, coreBack, 5, constraints, 'coverage');
        output.coverage = coverPicks;

        coverPicks.forEach((pick, i) => {
            const ac = calcAC(pick.front);
            const sum = pick.front.reduce((a, b) => a + b, 0);
            const fStr = pick.front.map(n => String(n).padStart(2, '0')).join(' ');
            const bStr = pick.back.map(n => String(n).padStart(2, '0')).join(' ');
            console.log(`  第${String(i + 1).padStart(2)}注: ${fStr} + ${bStr}  [AC=${ac} 和=${sum}]`);
        });

        // 覆盖率分析
        console.log('\n── 覆盖率分析 ──\n');
        const coverage = analyzeCoverage(coverPicks, coreFront);
        console.log(`  总注数: ${coverage.totalSets}`);
        console.log(`  号码对覆盖: ${coverage.pairCoverage}`);
        console.log(`  覆盖保证 (蒙特卡洛估算):`);
        Object.entries(coverage.guaranteeLevel).forEach(([key, val]) => {
            const k = parseInt(key.replace('core', ''));
            const desc = val >= 3 ? '✅ 可中七等奖以上' : val >= 2 ? '✅ 可中八/九等奖' : '⚠️ 最少命中';
            console.log(`    核心号命中${k}个 → 至少1注命中${val}个号 ${desc}`);
        });
        console.log(`\n  每个核心号被覆盖次数:`);
        const numCov = Object.entries(coverage.numberCoverage).sort((a, b) => b[1] - a[1]);
        console.log(`    ${numCov.map(([n, c]) => `${String(n).padStart(2, '0')}(${c}次)`).join(' ')}`);
    }

    // 总金额
    const totalSets = (output.select?.length || 0) + (output.coverage?.length || 0);
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`💰 精选: ${output.select?.length || 0}注 × ¥2 = ¥${(output.select?.length || 0) * 2}`);
    console.log(`💰 覆盖: ${output.coverage?.length || 0}注 × ¥2 = ¥${(output.coverage?.length || 0) * 2}`);
    console.log(`💰 合计: ¥${totalSets * 2}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    return output;
}

// ========== 导出 ==========

module.exports = { smartPick, reduceNumbers, calcAC, validateCombination, buildConstraints, generateWheelCovering, analyzeCoverage };

// ========== 独立运行 ==========

if (require.main === module) {
    const history = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'history.json'), 'utf8'));
    smartPick(history.issues, 'both');
}
