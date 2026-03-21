#!/usr/bin/env node
/**
 * ⚽ 足彩赛事数据自动抓取脚本
 * 
 * 功能: 从体彩官网API抓取竞彩足球赛事数据，写入 data/matches.json
 * 运行: node scripts/fetch-matches.js
 * 触发: GitHub Actions 定时 / 手动
 * 
 * 关键: sporttery.cn API 需要 Referer 头才能绕过 Tencent EdgeOne 安全策略
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

// ---- API 数据源 (需要 Referer 头绕过 EdgeOne 567 安全拦截) ----
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.lottery.gov.cn/',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9'
};

const SOURCES = [
    {
        name: '传统足彩(胜负游戏)',
        url: 'https://webapi.sporttery.cn/gateway/lottery/getFootBallMatchV1.qry?param=90,0&sellStatus=0&termLimits=10',
        extract: (json) => {
            if (!json?.value?.sfcMatch?.matchList) return null;
            const sfc = json.value.sfcMatch;
            return sfc.matchList.map((m, i) => ({
                matchNum: m.matchNum || (i + 1),
                league: m.matchName || '未知',
                home: m.masterTeamName || m.masterTeamAllName || '主队',
                away: m.guestTeamName || m.guestTeamAllName || '客队',
                date: m.startTime || '',
                time: '',
                oddsW: parseFloat(m.h) || 0,
                oddsD: parseFloat(m.d) || 0,
                oddsL: parseFloat(m.a) || 0,
                status: 0,
                period: sfc.lotteryDrawNum || ''
            }));
        }
    },
    {
        name: '竞彩足球(HAD)',
        url: 'https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=HAD,HHAD&channel=c923-tysw-lq-dwj',
        extract: (json) => {
            if (!json?.value?.matchInfoList) return null;
            const matches = [];
            for (const group of json.value.matchInfoList) {
                const subs = group.subMatchList || [group];
                for (const m of subs) {
                    matches.push({
                        matchNum: m.matchNum || m.matchId || '',
                        league: m.leagueAbbName || m.leagueName || '未知',
                        home: m.homeTeamAbbName || m.homeTeamAllName || '主队',
                        away: m.awayTeamAbbName || m.awayTeamAllName || '客队',
                        date: m.matchDate || group.businessDate || '',
                        time: m.matchTime || '',
                        oddsW: parseFloat(m.had?.h) || 0,
                        oddsD: parseFloat(m.had?.d) || 0,
                        oddsL: parseFloat(m.had?.a) || 0,
                        status: m.sellStatus || 0
                    });
                }
            }
            return matches;
        }
    }
];

// ---- 带重试的 fetch ----
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const resp = await fetch(url, {
                signal: AbortSignal.timeout(15000),
                headers: HEADERS
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

// ---- 主逻辑 ----
async function main() {
    console.log('⚽ 足彩赛事数据抓取开始...\n');

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    let allMatches = [];

    for (const src of SOURCES) {
        console.log(`🔗 正在抓取: ${src.name}`);
        const json = await fetchWithRetry(src.url);
        if (!json) { console.log(`  ❌ ${src.name} 所有重试失败\n`); continue; }

        const matches = src.extract(json);
        if (!matches || matches.length === 0) { console.log(`  ❌ ${src.name} 解析失败\n`); continue; }

        // Filter out matches with all zero odds
        const valid = matches.filter(m => m.home !== '主队' && (m.oddsW > 0 || m.oddsD > 0 || m.oddsL > 0));
        console.log(`  ✅ ${src.name}: 获取 ${matches.length} 场，有效 ${valid.length} 场\n`);

        if (valid.length > 0) {
            allMatches = valid; // Use first successful source
            break;
        }
    }

    if (allMatches.length === 0) {
        console.log('⚠️ 未能获取任何有效赛事数据');
        // Keep existing file if no new data
        if (fs.existsSync(MATCHES_FILE)) {
            console.log('📂 保留现有数据文件');
        }
        return;
    }

    // Sort by date, then matchNum
    allMatches.sort((a, b) => {
        const dc = (a.date || '').localeCompare(b.date || '');
        if (dc !== 0) return dc;
        return String(a.matchNum).localeCompare(String(b.matchNum));
    });

    const output = {
        lastUpdate: new Date().toISOString(),
        totalMatches: allMatches.length,
        matches: allMatches
    };

    fs.writeFileSync(MATCHES_FILE, JSON.stringify(output, null, 2), 'utf8');

    console.log(`💾 数据已保存: ${MATCHES_FILE}`);
    console.log(`⚽ 共 ${allMatches.length} 场赛事`);
    if (allMatches.length > 0) {
        console.log(`📋 示例: ${allMatches[0].home} vs ${allMatches[0].away} (${allMatches[0].league}) 赔率: ${allMatches[0].oddsW}/${allMatches[0].oddsD}/${allMatches[0].oddsL}`);
    }
    console.log('✅ 抓取完成!\n');
}

main().catch(e => { console.error('❌ 致命错误:', e.message); process.exit(1); });
