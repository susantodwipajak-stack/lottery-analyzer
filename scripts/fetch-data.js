#!/usr/bin/env node
/**
 * 📥 DLT 开奖数据自动抓取脚本
 * 
 * 功能: 从多个API抓取大乐透历史开奖数据，合并去重，写入 data/history.json
 * 运行: node scripts/fetch-data.js
 * 触发: GitHub Actions 每日定时 / 手动
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// ---- API 数据源 ----
const SOURCES = [
    {
        name: '数据源A (huiniao)',
        url: 'https://api.huiniao.top/interface/home/lotteryHistory?type=dlt&page=1&limit=100',
        extract: (json) => {
            if (!json || json.code !== 1 || !json.data?.data?.list) return null;
            return json.data.data.list.map(d => ({
                issue: String(d.code),
                front: [d.one, d.two, d.three, d.four, d.five].map(Number).sort((a, b) => a - b),
                back: [d.six, d.seven].map(Number).sort((a, b) => a - b),
                date: d.time || ''
            }));
        }
    },
    {
        name: '官网直连 (sporttery)',
        url: 'https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=85&provinceId=0&pageSize=100&isVerify=1&pageNo=1',
        extract: (json) => {
            if (!json?.value?.list) return null;
            return json.value.list.map(d => {
                const nums = d.lotteryDrawResult.split(/\s+/).map(Number);
                return {
                    issue: String(d.lotteryDrawNum),
                    front: nums.slice(0, 5).sort((a, b) => a - b),
                    back: nums.slice(5, 7).sort((a, b) => a - b),
                    date: d.lotteryDrawTime || ''
                };
            });
        }
    }
];

// ---- 带重试的 fetch ----
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const resp = await fetch(url, {
                signal: AbortSignal.timeout(15000),
                headers: { 'User-Agent': 'Mozilla/5.0 LotteryBot/1.0' }
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (e) {
            console.log(`  ⚠️ 第${i + 1}次失败: ${e.message}`);
            if (i < retries - 1) await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        }
    }
    return null;
}

// ---- 数据验证 ----
function validateDraw(draw) {
    if (!draw.issue || !draw.front || !draw.back) return false;
    if (draw.front.length !== 5 || draw.back.length !== 2) return false;
    if (draw.front.some(n => isNaN(n) || n < 1 || n > 35)) return false;
    if (draw.back.some(n => isNaN(n) || n < 1 || n > 12)) return false;
    return true;
}

// ---- 主逻辑 ----
async function main() {
    console.log('📥 大乐透数据抓取开始...\n');

    // 确保 data 目录存在
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    // 读取现有数据
    let existing = [];
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            const raw = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            existing = raw.issues || [];
            console.log(`📂 已有 ${existing.length} 期历史数据\n`);
        } catch { console.log('⚠️ 历史文件损坏，将重建\n'); }
    }

    // 从各数据源抓取
    let allDraws = [...existing];
    const existingIssues = new Set(existing.map(d => d.issue));

    for (const src of SOURCES) {
        console.log(`🔗 正在抓取: ${src.name}`);
        const json = await fetchWithRetry(src.url);
        if (!json) { console.log(`  ❌ ${src.name} 所有重试失败\n`); continue; }

        const draws = src.extract(json);
        if (!draws || draws.length === 0) { console.log(`  ❌ ${src.name} 解析失败\n`); continue; }

        let added = 0;
        for (const draw of draws) {
            if (!validateDraw(draw)) continue;
            if (existingIssues.has(draw.issue)) continue;
            allDraws.push(draw);
            existingIssues.add(draw.issue);
            added++;
        }
        console.log(`  ✅ ${src.name}: 获取 ${draws.length} 期，新增 ${added} 期\n`);
    }

    // 按期号降序排列
    allDraws.sort((a, b) => String(b.issue).localeCompare(String(a.issue)));

    // 写入文件
    const output = {
        lastUpdate: new Date().toISOString(),
        totalIssues: allDraws.length,
        issues: allDraws
    };
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(output, null, 2), 'utf8');

    console.log(`💾 数据已保存: ${HISTORY_FILE}`);
    console.log(`📊 共 ${allDraws.length} 期，最新: 第 ${allDraws[0]?.issue} 期`);
    console.log('✅ 抓取完成!\n');
}

main().catch(e => { console.error('❌ 致命错误:', e.message); process.exit(1); });
