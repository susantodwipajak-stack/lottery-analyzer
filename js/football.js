// =============================================
// SECTION 1: 传统足彩深度分析 (V2.0 — 贝叶斯+联赛引擎)
// =============================================
let matchCount = 0;
let matchData = [];
let currentGameType = 'sf'; // sf | r9 | bqc | jq
let _modelParams = null; // loaded from data/model-params.json

// ========== V2.0 engine: Bayesian smoothing ==========
function bayesianSmooth(rawProbs, prior = [0.36, 0.28, 0.36], strength = 5) {
  const n = 100;
  return rawProbs.map((p, i) => {
    const smoothed = (p * n + prior[i] * strength) / (n + strength);
    return Math.max(0.05, smoothed);
  });
}

// ========== V2.0 engine: League-specific parameters ==========
const LEAGUE_DEFAULTS = {
  '英超': { homeAdv: 0.10, drawBias: 0.01, avgGoals: 2.85 },
  '德甲': { homeAdv: 0.09, drawBias: 0.01, avgGoals: 3.05 },
  '西甲': { homeAdv: 0.11, drawBias: 0.03, avgGoals: 2.55 },
  '意甲': { homeAdv: 0.07, drawBias: 0.04, avgGoals: 2.35 },
  '法甲': { homeAdv: 0.09, drawBias: 0.03, avgGoals: 2.50 },
  '中超': { homeAdv: 0.12, drawBias: 0.02, avgGoals: 2.40 },
  '日职': { homeAdv: 0.08, drawBias: 0.03, avgGoals: 2.60 },
  '韩K':  { homeAdv: 0.09, drawBias: 0.02, avgGoals: 2.45 },
  '国际': { homeAdv: 0.06, drawBias: 0.04, avgGoals: 2.30 },
  'default': { homeAdv: 0.08, drawBias: 0.02, avgGoals: 2.50 }
};

function getLeagueParams(league) {
  const learned = _modelParams?.leagueParams || {};
  if (learned[league]) return learned[league];
  for (const key of Object.keys(LEAGUE_DEFAULTS)) {
    if (league && league.includes(key)) return LEAGUE_DEFAULTS[key];
  }
  return LEAGUE_DEFAULTS['default'];
}

// Compute corrected probabilities (Bayesian + league adjustment)
function getCorrectedProbs(oddsW, oddsD, oddsL, league) {
  const odds = [oddsW, oddsD, oddsL];
  const ipRaw = odds.map(o => o > 0 ? 1 / o : 0);
  const margin = ipRaw.reduce((a, b) => a + b, 0);
  if (margin <= 0) return [0.33, 0.34, 0.33];
  const fairRaw = ipRaw.map(p => p / margin);
  const fair = bayesianSmooth(fairRaw);
  const lp = getLeagueParams(league);
  const adj = [
    fair[0] * (1 + lp.homeAdv),
    fair[1] * (1 + lp.drawBias * 2),
    fair[2] * (1 - lp.homeAdv * 0.5)
  ];
  const adjSum = adj.reduce((a, b) => a + b, 0);
  return adj.map(p => Math.max(0.05, p / adjSum));
}

// Load model params from data/model-params.json
async function loadModelParams() {
  try {
    const resp = await fetch('data/model-params.json?t=' + Date.now(), { signal: AbortSignal.timeout(5000) });
    if (resp.ok) _modelParams = await resp.json();
  } catch { /* use defaults */ }
}

// 3 strategies (unified with backend)
const FB_STRATEGIES = [
  { id: 'conservative', name: '🛡️ 保守稳健', desc: '偏向概率最高项', weights: { kelly: 0.15, ev: 0.20, implied: 0.65 } },
  { id: 'balanced',     name: '⚖️ 均衡推荐', desc: '综合Kelly/EV/概率', weights: { kelly: 0.35, ev: 0.35, implied: 0.30 } },
  { id: 'aggressive',   name: '🔥 激进价值', desc: '追求高EV和Kelly', weights: { kelly: 0.45, ev: 0.40, implied: 0.15 } }
];

const GAME_CONFIG = {
  sf: {
    name: '胜负游戏', maxPrize: '500 万元',
    instruction: '玩法提示：以下14场比赛，每场比赛至少选择一个结果；比赛结果以90分钟（含伤停补时，不含加时赛）结果为准。'
  },
  r9: {
    name: '任选9场', maxPrize: '500 万元',
    instruction: '玩法提示：从指定的所有比赛中任意选择9场，对每场比赛在胜、平、负三种结果中选择至少一个结果进行投注。'
  },
  bqc: {
    name: '6场半全场', maxPrize: '500 万元',
    instruction: '玩法提示：对指定6场比赛在全部9种（胜胜/胜平/胜负/平胜/平平/平负/负胜/负平/负负）结果中，每场至少选择1个结果进行投注。'
  },
  jq: {
    name: '4场进球', maxPrize: '500 万元',
    instruction: '玩法提示：对指定4场比赛在全部（0/1/2/3+）进球数中，分别对主队和客队至少选择1个结果进行投注。'
  }
};

// ---- BQC half/full-time options ----
const BQC_OPTIONS = [
  { key: 'ww', label: '胜胜', short: '33' },
  { key: 'wd', label: '胜平', short: '31' },
  { key: 'wl', label: '胜负', short: '30' },
  { key: 'dw', label: '平胜', short: '13' },
  { key: 'dd', label: '平平', short: '11' },
  { key: 'dl', label: '平负', short: '10' },
  { key: 'lw', label: '负胜', short: '03' },
  { key: 'ld', label: '负平', short: '01' },
  { key: 'll', label: '负负', short: '00' }
];

// ---- JQ goal options ----
const JQ_GOALS = ['0', '1', '2', '3+'];

function renderMatchRow(match) {
  if (currentGameType === 'bqc') return renderBQCRow(match);
  if (currentGameType === 'jq') return renderJQRow(match);
  // Default: sf / r9 — same 3/1/0 layout
  matchCount++;
  const id = matchCount;
  match._id = id;
  const row = document.createElement('div');
  row.className = 'match-row'; row.id = 'match-' + id; row.dataset.matchId = id;
  const league = match.league || '友谊赛', date = match.date || '--';
  const home = match.home || '主队', away = match.away || '客队';
  const oddsW = match.oddsW || 0, oddsD = match.oddsD || 0, oddsL = match.oddsL || 0;
  row.innerHTML = `
    <span class="mr-num">${id}</span>
    <span class="mr-league" title="${league}">${league}</span>
    <span class="mr-date">${date}</span>
    <span class="mr-teams">${home}<span class="vs">VS</span>${away}</span>
    <div class="cz-opt-btn win" data-match="${id}" data-type="w" data-odds="${oddsW}" onclick="toggleOdds(this)">3</div>
    <div class="cz-opt-btn draw" data-match="${id}" data-type="d" data-odds="${oddsD}" onclick="toggleOdds(this)">1</div>
    <div class="cz-opt-btn loss" data-match="${id}" data-type="l" data-odds="${oddsL}" onclick="toggleOdds(this)">0</div>
    <span class="mr-sp">${oddsW ? oddsW.toFixed(2) : '--'}</span>
    <span class="mr-sp">${oddsD ? oddsD.toFixed(2) : '--'}</span>
    <span class="mr-sp">${oddsL ? oddsL.toFixed(2) : '--'}</span>`;
  return row;
}

function renderBQCRow(match) {
  matchCount++;
  const id = matchCount;
  match._id = id;
  const row = document.createElement('div');
  row.className = 'match-row match-row-bqc'; row.id = 'match-' + id; row.dataset.matchId = id;
  const league = match.league || '友谊赛';
  const home = match.home || '主队', away = match.away || '客队';
  // Generate estimated half/full odds from HAD odds
  const oddsW = match.oddsW || 2, oddsD = match.oddsD || 3, oddsL = match.oddsL || 3;
  const bqcOdds = estimateBQCOdds(oddsW, oddsD, oddsL);
  let btnsHTML = BQC_OPTIONS.map((o, i) =>
    `<div class="cz-opt-btn-sm" data-match="${id}" data-type="${o.key}" data-odds="${bqcOdds[i].toFixed(2)}" onclick="toggleOdds(this)">
      <span class="bqc-label">${o.short}</span>
      <span class="bqc-sp">${bqcOdds[i].toFixed(1)}</span>
    </div>`
  ).join('');
  row.innerHTML = `
    <span class="mr-num">${id}</span>
    <span class="mr-league" title="${league}">${league}</span>
    <span class="mr-teams">${home}<span class="vs">VS</span>${away}</span>
    <div class="bqc-opts">${btnsHTML}</div>`;
  return row;
}

function renderJQRow(match) {
  matchCount++;
  const id = matchCount;
  match._id = id;
  const row = document.createElement('div');
  row.className = 'match-row match-row-jq'; row.id = 'match-' + id; row.dataset.matchId = id;
  const league = match.league || '友谊赛';
  const home = match.home || '主队', away = match.away || '客队';
  const oddsW = match.oddsW || 2, oddsD = match.oddsD || 3, oddsL = match.oddsL || 3;
  const goalOdds = estimateGoalOdds(oddsW, oddsD, oddsL);
  let homeBtns = JQ_GOALS.map((g, i) =>
    `<div class="cz-opt-btn-sm" data-match="${id}" data-type="h${g}" data-odds="${goalOdds.home[i].toFixed(2)}" onclick="toggleOdds(this)">
      <span class="jq-num">${g}</span><span class="bqc-sp">${goalOdds.home[i].toFixed(1)}</span>
    </div>`
  ).join('');
  let awayBtns = JQ_GOALS.map((g, i) =>
    `<div class="cz-opt-btn-sm" data-match="${id}" data-type="a${g}" data-odds="${goalOdds.away[i].toFixed(2)}" onclick="toggleOdds(this)">
      <span class="jq-num">${g}</span><span class="bqc-sp">${goalOdds.away[i].toFixed(1)}</span>
    </div>`
  ).join('');
  row.innerHTML = `
    <span class="mr-num">${id}</span>
    <span class="mr-league" title="${league}">${league}</span>
    <span class="mr-teams">${home}<span class="vs">VS</span>${away}</span>
    <div class="jq-team-row"><span class="jq-team-label">主</span>${homeBtns}</div>
    <div class="jq-team-row"><span class="jq-team-label">客</span>${awayBtns}</div>`;
  return row;
}

function estimateBQCOdds(w, d, l) {
  // Estimate 9 half/full from HAD — simplified model
  const pw = 1 / w, pd = 1 / d, pl = 1 / l;
  const m = pw + pd + pl;
  const fw = pw / m, fd = pd / m, fl = pl / m;
  // Half-time tends toward more draws, so we skew
  const hw = fw * 0.8, hd = 0.4 + fd * 0.3, hl = fl * 0.8;
  const hm = hw + hd + hl;
  const hfw = hw / hm, hfd = hd / hm, hfl = hl / hm;
  return [
    1 / (hfw * fw) * 0.88, 1 / (hfw * fd) * 0.88, 1 / (hfw * fl) * 0.88,
    1 / (hfd * fw) * 0.88, 1 / (hfd * fd) * 0.88, 1 / (hfd * fl) * 0.88,
    1 / (hfl * fw) * 0.88, 1 / (hfl * fd) * 0.88, 1 / (hfl * fl) * 0.88
  ].map(o => Math.max(1.5, Math.min(200, o)));
}

function estimateGoalOdds(w, d, l) {
  const pw = 1 / w, pd = 1 / d, pl = 1 / l;
  const m = pw + pd + pl;
  const fw = pw / m, fl = pl / m;
  // Strong team more likely to score more
  const homeStrength = fw / (fw + fl + 0.001);
  const awayStrength = fl / (fw + fl + 0.001);
  function goalProbs(s) {
    const avg = 0.5 + s * 1.8;
    return [
      Math.exp(-avg),
      avg * Math.exp(-avg),
      (avg * avg / 2) * Math.exp(-avg),
      1 - Math.exp(-avg) - avg * Math.exp(-avg) - (avg * avg / 2) * Math.exp(-avg)
    ].map(p => Math.max(0.03, p));
  }
  const hp = goalProbs(homeStrength), ap = goalProbs(awayStrength);
  return {
    home: hp.map(p => Math.max(1.2, (1 / p) * 0.88)),
    away: ap.map(p => Math.max(1.2, (1 / p) * 0.88))
  };
}

function toggleOdds(el) {
  el.classList.toggle('selected');
  const row = el.closest('.match-row');
  if (row) row.classList.toggle('has-selection', row.querySelectorAll('.cz-opt-btn.selected, .cz-opt-btn-sm.selected, .odds-toggle.selected').length > 0);
  updateParlayOptions(); updateBetBar();
}
function renderMatchList(matches) {
  const list = $('#match-list'); list.innerHTML = ''; matchCount = 0; matchData = matches;
  // Limit matches for specific game types
  let gameMatches = matches;
  if (currentGameType === 'bqc') gameMatches = matches.slice(0, 6);
  else if (currentGameType === 'jq') gameMatches = matches.slice(0, 4);
  else if (currentGameType === 'r9') gameMatches = matches.slice(0, 14);
  else gameMatches = matches.slice(0, 14);
  if (gameMatches.length === 0) { list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚽</div><div class="empty-state-title">暂无赛事数据</div><div class="empty-state-desc">拉取赛事数据或载入示例</div></div>'; return; }
  gameMatches.forEach(m => list.appendChild(renderMatchRow(m)));
  const label = $('#match-count-label'); if (label) label.textContent = gameMatches.length + ' 场比赛';
  updateParlayOptions(); updateBetBar();
  // Auto-analyze after rendering
  setTimeout(() => autoAnalyzeMatches(), 100);
}

// ---- 智能体自动分析 ----
function autoAnalyzeMatches() {
  const rows = $$('.match-row');
  if (rows.length < 2) return;

  // Step 1: Auto-select best outcome for each match (lowest odds = highest probability)
  rows.forEach(row => {
    const btns = row.querySelectorAll('.cz-opt-btn');
    const smBtns = row.querySelectorAll('.cz-opt-btn-sm');
    if (btns.length >= 3) {
      let best = null, bestOdds = Infinity;
      btns.forEach(b => { const o = parseFloat(b.dataset.odds); if (o > 0 && o < bestOdds) { bestOdds = o; best = b; } });
      if (best && !best.classList.contains('selected')) { best.classList.add('selected'); row.classList.add('has-selection'); }
    } else if (smBtns.length > 0) {
      let best = null, bestOdds = Infinity;
      smBtns.forEach(b => { const o = parseFloat(b.dataset.odds); if (o > 0 && o < bestOdds) { bestOdds = o; best = b; } });
      if (best && !best.classList.contains('selected')) { best.classList.add('selected'); row.classList.add('has-selection'); }
    }
  });
  updateParlayOptions();
  updateBetBar();

  // Step 2: Run deep analysis (Kelly, EV, charts)
  analyzeFootball();

  // Step 3: Generate 3-strategy recommendations
  generateFbRecommendations();

  // Step 4: Populate sidebar AI content (P0-3: handle no-odds state)
  const sidebar = $('#fb-ai-sidebar-content');
  if (sidebar) {
    const matchesData = getMatches();
    const withOdds = matchesData.filter(m => m.oddsW > 0 && m.oddsD > 0 && m.oddsL > 0);
    let sidebarHTML = `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.4rem;">共 ${rows.length} 场 · ${withOdds.length} 场有赔率</div>`;

    if (withOdds.length > 0) {
      // Use Bayesian-corrected probabilities
      withOdds.forEach(m => {
        const probs = getCorrectedProbs(m.oddsW, m.oddsD, m.oddsL, m.league || '');
        const labels = ['胜', '平', '负'];
        let bestIdx = 0;
        probs.forEach((p, i) => { if (p > probs[bestIdx]) bestIdx = i; });
        const pct = (probs[bestIdx] * 100).toFixed(0);
        const color = pct > 50 ? 'var(--green)' : pct > 35 ? 'var(--yellow)' : 'var(--text-muted)';
        const lp = getLeagueParams(m.league || '');
        sidebarHTML += `<div style="display:flex;align-items:center;gap:0.3rem;padding:0.25rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.75rem;">
          <span style="min-width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">${m.team}</span>
          <span style="color:${color};font-weight:700;min-width:24px;">${labels[bestIdx]}</span>
          <span style="color:var(--text-muted);font-size:0.7rem;">${pct}%</span>
        </div>`;
      });
    } else {
      // P0-3: No odds available — show league statistics as fallback
      sidebarHTML += `<div style="padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="font-size:0.78rem;color:var(--gold);margin-bottom:0.4rem;">⚠️ 赔率尚未公布</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.5rem;">当前赛事赔率未开放，以下为各联赛历史统计参考</div>
      </div>`;
      // Show league stats from LEAGUE_DEFAULTS
      const leaguesSeen = new Set();
      matchesData.forEach(m => {
        const league = m.league || '未知';
        if (leaguesSeen.has(league)) return;
        leaguesSeen.add(league);
        const lp = getLeagueParams(league);
        const homeRate = (0.40 + lp.homeAdv) * 100;
        const drawRate = (0.28 + lp.drawBias) * 100;
        const awayRate = Math.max(0, 100 - homeRate - drawRate);
        sidebarHTML += `<div style="padding:0.3rem 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">
          <span style="font-weight:600;color:var(--text-secondary);min-width:40px;display:inline-block;">${league}</span>
          <span style="color:var(--red);">主胜${homeRate.toFixed(0)}%</span>
          <span style="color:var(--yellow);">平${drawRate.toFixed(0)}%</span>
          <span style="color:var(--blue);">客胜${awayRate.toFixed(0)}%</span>
          <span style="color:var(--text-muted);margin-left:0.2rem;">均${lp.avgGoals}球</span>
        </div>`;
      });
    }
    sidebar.innerHTML = sidebarHTML;
  }

  showToast('🤖 AI已自动完成赛事分析', 'success');
}

function switchGameTab(gameType) {
  currentGameType = gameType;
  const config = GAME_CONFIG[gameType];
  // Update instructions
  const inst = $('.cz-instructions');
  if (inst) inst.textContent = config.instruction;
  // Update prize
  const prize = $('.prize-amount');
  if (prize) prize.textContent = config.maxPrize;
  // Update table header
  updateTableHeader(gameType);
  // Re-render matches
  if (matchData.length > 0) renderMatchList(matchData);
  // Refresh AI picks display for new game type
  if (window._latestFbPicks) displayLatestPicks(window._latestFbPicks);
}

function updateTableHeader(gameType) {
  const header = $('.cz-table-header');
  if (!header) return;
  if (gameType === 'bqc') {
    header.className = 'cz-table-header cz-header-bqc';
    header.innerHTML = `
      <span class="cz-th cz-th-no">场次</span>
      <span class="cz-th cz-th-league">联赛</span>
      <span class="cz-th cz-th-teams">主队 VS 客队</span>
      <span class="cz-th" style="grid-column:span 9;text-align:center;">半场/全场结果</span>`;
  } else if (gameType === 'jq') {
    header.className = 'cz-table-header cz-header-jq';
    header.innerHTML = `
      <span class="cz-th cz-th-no">场次</span>
      <span class="cz-th cz-th-league">联赛</span>
      <span class="cz-th cz-th-teams">主队 VS 客队</span>
      <span class="cz-th" style="grid-column:span 4;text-align:center;">进球数 (0/1/2/3+)</span>`;
  } else {
    header.className = 'cz-table-header';
    header.innerHTML = `
      <span class="cz-th cz-th-no">场次</span>
      <span class="cz-th cz-th-league">联赛</span>
      <span class="cz-th cz-th-date">开赛日期</span>
      <span class="cz-th cz-th-teams">主队 VS 客队</span>
      <span class="cz-th cz-th-opt" style="color:var(--red);">胜<br><small>3</small></span>
      <span class="cz-th cz-th-opt">平<br><small>1</small></span>
      <span class="cz-th cz-th-opt" style="color:var(--blue);">负<br><small>0</small></span>
      <span class="cz-th cz-th-sp" style="color:var(--red);">胜</span>
      <span class="cz-th cz-th-sp">平</span>
      <span class="cz-th cz-th-sp" style="color:var(--blue);">负</span>`;
  }
}
async function fetchFootballMatches() {
  const btn = $('#btn-fetch-matches'), status = $('#fb-status');
  setButtonLoading(btn, true);
  status.innerHTML = '<span style="color:var(--cyan)">⏳ 正在获取赛事数据...</span>';
  const apis = [
    {
      name: '14场胜负游戏', url: 'https://webapi.sporttery.cn/gateway/lottery/getFootBallMatchV1.qry?param=90,0&sellStatus=0&termLimits=10',
      extract: json => {
        if (!json?.value?.sfcMatch?.matchList) return null;
        const sfc = json.value.sfcMatch;
        // Show period chips and deadline
        if (json.value.sfclist) renderPeriodChips(json.value.sfclist.map(n => ({ termNo: n })));
        const deadline = $('#cz-deadline');
        if (deadline && sfc.lotterySaleEndtime) deadline.textContent = '投注截止时间：' + sfc.lotterySaleEndtime;
        return sfc.matchList.map(m => ({
          league: m.matchName || '未知',
          home: m.masterTeamName || m.masterTeamAllName || '主队',
          away: m.guestTeamName || m.guestTeamAllName || '客队',
          date: m.startTime || '',
          oddsW: parseFloat(m.h) || 0,
          oddsD: parseFloat(m.d) || 0,
          oddsL: parseFloat(m.a) || 0
        }));
      }
    },
    {
      name: '预取数据', url: 'data/matches.json',
      extract: json => {
        if (!json?.matches?.length) return null;
        const ts = json.lastUpdate ? new Date(json.lastUpdate).toLocaleString('zh-CN') : '';
        if (ts) {
          const deadline = $('#cz-deadline');
          if (deadline) deadline.textContent = '数据更新时间：' + ts;
        }
        return json.matches;
      }
    },
    {
      name: '竞彩足球(备用)', url: 'https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=HAD,HHAD&channel=c923-tysw-lq-dwj',
      extract: json => {
        if (!json?.value?.matchInfoList) return null;
        const matches = [];
        for (const group of json.value.matchInfoList) {
          const subs = group.subMatchList || [group];
          for (const m of subs) {
            matches.push({
              league: m.leagueAbbName || m.leagueName || '未知',
              home: m.homeTeamAbbName || m.homeTeamAllName || '主队',
              away: m.awayTeamAbbName || m.awayTeamAllName || '客队',
              date: m.matchDate || group.businessDate || '--',
              oddsW: parseFloat(m.had?.h) || 0,
              oddsD: parseFloat(m.had?.d) || 0,
              oddsL: parseFloat(m.had?.a) || 0
            });
          }
        }
        return matches.filter(m => m.home !== '主队' && (m.oddsW > 0 || m.oddsD > 0));
      }
    }
  ];
  let matches = null;
  for (const api of apis) {
    try {
      const fetchOpts = { signal: AbortSignal.timeout(10000) };
      // Some API servers require specific headers, but 'Referer' is an unsafe header in browsers.
      // We will let the browser handle it automatically.
      const resp = await fetch(api.url, fetchOpts);
      if (!resp.ok) continue;
      const json = await resp.json();
      matches = api.extract(json);
      if (matches?.length > 0) {
        status.innerHTML = `<span style="color:var(--green)">✅ 通过${api.name}获取 ${matches.length} 场赛事</span>`;
        break;
      }
    } catch { continue; }
  }
  if (!matches?.length) { status.innerHTML = '<span style="color:var(--orange)">⚠️ 无法获取实时赛事，已载入示例</span>'; loadSampleMatches(); setButtonLoading(btn, false); return; }
  renderMatchList(matches); setButtonLoading(btn, false); showToast(`获取 ${matches.length} 场赛事`, 'success');
  // Also fetch draw results
  fetchDrawResults();
}

// =============================================
// 开奖结果 (Draw Results)
// =============================================
let _drawResultsCache = null;

async function fetchDrawResults() {
  const container = $('#draw-results-container');
  if (!container) return;
  try {
    const resp = await fetch('https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=90&provinceId=0&pageSize=5&isVerify=1&pageNo=1', {
      signal: AbortSignal.timeout(10000)
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (!data?.value?.list?.length) throw new Error('No data');
    _drawResultsCache = data.value.list;
    renderDrawResults(_drawResultsCache[0]); // Show latest
    renderDrawPeriodChips(_drawResultsCache);
  } catch {
    container.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted);padding:0.5rem;">⚠️ 开奖数据暂时无法获取</div>';
  }
}

function renderDrawPeriodChips(list) {
  const container = $('#draw-period-chips');
  if (!container) return;
  container.innerHTML = list.map((item, i) =>
    `<span class="cz-period-chip ${i === 0 ? 'active' : ''}" style="cursor:pointer;padding:0.2rem 0.6rem;font-size:0.72rem;border-radius:4px;border:1px solid ${i === 0 ? 'var(--cyan)' : 'var(--border)'};color:${i === 0 ? 'var(--cyan)' : 'var(--text-muted)'};background:${i === 0 ? 'rgba(0,188,212,0.1)' : 'transparent'}" onclick="selectDrawPeriod(${i})">${item.lotteryDrawNum} 期</span>`
  ).join('');
}

function selectDrawPeriod(idx) {
  if (!_drawResultsCache?.[idx]) return;
  renderDrawResults(_drawResultsCache[idx]);
  // Update chip styles
  const chips = document.querySelectorAll('#draw-period-chips .cz-period-chip');
  chips.forEach((c, i) => {
    c.style.borderColor = i === idx ? 'var(--cyan)' : 'var(--border)';
    c.style.color = i === idx ? 'var(--cyan)' : 'var(--text-muted)';
    c.style.background = i === idx ? 'rgba(0,188,212,0.1)' : 'transparent';
  });
}

function renderDrawResults(item) {
  const container = $('#draw-results-container');
  if (!container || !item) return;
  const results = (item.lotteryDrawResult || '').split(' ');
  const resultLabels = { '3': '胜', '1': '平', '0': '负' };

  // P1-4: Update collapsed summary text
  const summaryText = $('#draw-summary-text');
  if (summaryText) {
    const balls = results.map(r => r === '3' ? '🔴' : r === '0' ? '🔵' : '🟡').join('');
    summaryText.innerHTML = `第${item.lotteryDrawNum}期 ${balls}`;
  }
  const resultColors = { '3': '#e74c3c', '1': '#f39c12', '0': '#00bcd4' };

  let matchesHtml = '';
  if (item.matchList?.length) {
    matchesHtml = `<div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.75rem;">
        <thead>
          <tr style="color:var(--text-muted);border-bottom:1px solid var(--border);">
            <th style="padding:0.3rem;text-align:center;width:2rem;">场次</th>
            <th style="padding:0.3rem;text-align:center;width:3rem;">联赛</th>
            <th style="padding:0.3rem;text-align:center;">主队 VS 客队</th>
            <th style="padding:0.3rem;text-align:center;width:3.5rem;">比分</th>
            <th style="padding:0.3rem;text-align:center;width:2.5rem;">赛果</th>
          </tr>
        </thead>
        <tbody>
          ${item.matchList.map((m, i) => {
            const r = m.result || results[i] || '-';
            const lbl = resultLabels[r] || '-';
            const clr = resultColors[r] || 'var(--text-muted)';
            return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
              <td style="padding:0.3rem;text-align:center;color:var(--text-muted);">${m.matchNum || i + 1}</td>
              <td style="padding:0.3rem;text-align:center;color:var(--text-secondary);">${m.matchName || ''}</td>
              <td style="padding:0.3rem;text-align:center;"><span style="color:var(--text-primary);font-weight:600;">${m.masterTeamName || ''}</span> <span style="color:var(--text-muted);font-size:0.65rem;">VS</span> <span style="color:var(--text-primary);">${m.guestTeamName || ''}</span></td>
              <td style="padding:0.3rem;text-align:center;font-weight:600;color:var(--text-secondary);">${m.czScore || '-'}</td>
              <td style="padding:0.3rem;text-align:center;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${clr};color:#fff;font-weight:700;font-size:0.7rem;">${r}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  } else if (results.length === 14) {
    // No matchList — just show result balls
    matchesHtml = `<div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin:0.5rem 0;">
      ${results.map((r, i) => {
        const clr = resultColors[r] || '#666';
        return `<div style="text-align:center;">
          <div style="font-size:0.6rem;color:var(--text-muted);margin-bottom:0.15rem;">${i + 1}</div>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${clr};color:#fff;font-weight:700;font-size:0.75rem;">${r}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  // Prize info
  let prizeHtml = '';
  if (item.prizeLevelList?.length) {
    prizeHtml = `<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--border);">
      ${item.prizeLevelList.map(p =>
        `<div style="font-size:0.72rem;"><span style="color:var(--text-muted);">🏅 ${p.prizeLevel}</span> <span style="color:var(--gold);font-weight:600;">${p.stakeCount}</span><span style="color:var(--text-muted);">注</span> <span style="color:var(--green);font-weight:600;">¥${p.stakeAmount}</span></div>`
      ).join('')}
    </div>`;
  }
  // R9 prize
  if (item.prizeLevelListRj?.length) {
    prizeHtml += `<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.3rem;">
      ${item.prizeLevelListRj.map(p =>
        `<div style="font-size:0.72rem;"><span style="color:var(--text-muted);">🏅 ${p.prizeLevel}</span> <span style="color:var(--gold);font-weight:600;">${p.stakeCount}</span><span style="color:var(--text-muted);">注</span> <span style="color:var(--green);font-weight:600;">¥${p.stakeAmount}</span></div>`
      ).join('')}
    </div>`;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
      <span style="font-size:0.8rem;font-weight:600;">第 ${item.lotteryDrawNum} 期</span>
      <span style="font-size:0.72rem;color:var(--text-muted);">开奖日期: ${item.lotteryDrawTime || item.estimateDrawTime || '-'}</span>
    </div>
    ${matchesHtml}
    ${prizeHtml}
    ${item.totalSaleAmount ? `<div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.3rem;">💰 本期销量: ¥${item.totalSaleAmount}</div>` : ''}
  `;
}
function renderPeriodChips(termList) {
  const container = $('#cz-period-chips'); if (!container) return;
  if (!termList?.length) { container.innerHTML = ''; return; }
  container.innerHTML = termList.slice(0, 3).map((t, i) =>
    `<span class="cz-period-chip ${i === 0 ? 'active' : ''}">${t.termNo || t} 期</span>`
  ).join('');
  const deadline = $('#cz-deadline');
  if (deadline && termList[0]?.endTime) deadline.textContent = '投注截止时间：' + termList[0].endTime;
}
function loadSampleMatches() {
  renderMatchList([
    { league: '欧冠', home: '加拉塔', away: '利物浦', date: '2026-03-11', oddsW: 3.98, oddsD: 3.90, oddsL: 1.61 },
    { league: '欧冠', home: '亚特兰', away: '拜仁', date: '2026-03-11', oddsW: 4.25, oddsD: 4.15, oddsL: 1.53 },
    { league: '英冠', home: '日奈桟', away: '热那', date: '2026-03-11', oddsW: 1.45, oddsD: 4.05, oddsL: 5.20 },
    { league: '英冠', home: '保利茲', away: '亚兰', date: '2026-03-11', oddsW: 2.80, oddsD: 3.20, oddsL: 2.45 },
    { league: '西甲', home: '巴塞罗那', away: '皇马', date: '2026-03-12', oddsW: 1.85, oddsD: 3.60, oddsL: 4.20 },
    { league: '德甲', home: '拜仁', away: '多特', date: '2026-03-12', oddsW: 1.55, oddsD: 4.10, oddsL: 5.50 },
    { league: '英超', home: '曼城', away: '利物浦', date: '2026-03-12', oddsW: 2.15, oddsD: 3.40, oddsL: 3.10 },
    { league: '意甲', home: 'AC米兰', away: '国米', date: '2026-03-12', oddsW: 2.80, oddsD: 3.20, oddsL: 2.45 },
    { league: '法甲', home: '巴黎', away: '马赛', date: '2026-03-13', oddsW: 1.40, oddsD: 4.60, oddsL: 7.50 },
    { league: '英超', home: '阿森纳', away: '切尔西', date: '2026-03-13', oddsW: 1.90, oddsD: 3.50, oddsL: 3.80 },
    { league: '欧冠', home: '皇马', away: '曼城', date: '2026-03-13', oddsW: 2.30, oddsD: 3.30, oddsL: 2.90 },
    { league: '中超', home: '海港', away: '国安', date: '2026-03-13', oddsW: 1.75, oddsD: 3.40, oddsL: 4.50 },
    { league: '韩K', home: '全北', away: '蔚山', date: '2026-03-14', oddsW: 1.65, oddsD: 3.60, oddsL: 4.80 },
    { league: '日职', home: '浦和', away: '川崎', date: '2026-03-14', oddsW: 2.10, oddsD: 3.25, oddsL: 3.30 }
  ]);
  renderPeriodChips([{ termNo: '26039' }, { termNo: '26040' }]);
  showToast('示例赛事已载入（14场）', 'success');
  $('#fb-status').innerHTML = '<span style="color:var(--text-secondary)">📋 已载入 14 场示例赛事，点击 3/1/0 选择投注</span>';
}
function addMatch(teamName, oddsW, oddsD, oddsL) {
  matchCount++; const id = matchCount;
  const div = document.createElement('div'); div.className = 'match-entry'; div.id = 'match-' + id;
  div.innerHTML = `<div class="match-header"><span class="match-label">比赛 ${id}</span><button class="match-remove" onclick="removeMatch(${id})">✕</button></div><div class="form-group"><input type="text" class="form-input" id="team-${id}" placeholder="队伍" value="${teamName || ''}"></div><div class="odds-grid"><div class="odds-item"><label>胜</label><input type="number" step="0.01" min="1" id="odds-w-${id}" value="${oddsW || ''}" placeholder="赔率"><div class="odds-check"><input type="checkbox" id="sel-w-${id}"><label style="font-size:0.7rem;color:var(--text-muted)">选</label></div></div><div class="odds-item"><label>平</label><input type="number" step="0.01" min="1" id="odds-d-${id}" value="${oddsD || ''}" placeholder="赔率"><div class="odds-check"><input type="checkbox" id="sel-d-${id}"><label style="font-size:0.7rem;color:var(--text-muted)">选</label></div></div><div class="odds-item"><label>负</label><input type="number" step="0.01" min="1" id="odds-l-${id}" value="${oddsL || ''}" placeholder="赔率"><div class="odds-check"><input type="checkbox" id="sel-l-${id}"><label style="font-size:0.7rem;color:var(--text-muted)">选</label></div></div></div>`;
  $('#match-list').appendChild(div); updateParlayOptions();
}
function removeMatch(id) { const el = $('#match-' + id); if (el) el.remove(); updateParlayOptions(); }
function getMatches() {
  const matches = [];
  $$('.match-row').forEach(row => {
    const id = row.dataset.matchId, teams = row.querySelector('.mr-teams')?.textContent || `比赛${id}`;
    const btns = row.querySelectorAll('.cz-opt-btn');
    const smBtns = row.querySelectorAll('.cz-opt-btn-sm');
    const toggles = row.querySelectorAll('.odds-toggle');
    let oddsW = 0, oddsD = 0, oddsL = 0;
    const selections = [];
    const allOutcomes = [];

    if (smBtns.length > 0) {
      // BQC or JQ game type — collect all sm buttons
      smBtns.forEach(btn => {
        const type = btn.dataset.type || '';
        const odds = parseFloat(btn.dataset.odds) || 0;
        const label = btn.querySelector('.bqc-label,.jq-num')?.textContent || type;
        if (odds > 0) allOutcomes.push({ type, label, odds });
        if (btn.classList.contains('selected') && odds > 0) {
          selections.push({ type, label, odds });
        }
      });
    } else if (btns.length >= 3) {
      oddsW = parseFloat(btns[0]?.dataset.odds) || 0;
      oddsD = parseFloat(btns[1]?.dataset.odds) || 0;
      oddsL = parseFloat(btns[2]?.dataset.odds) || 0;
      allOutcomes.push({ type: 'w', label: '胜', odds: oddsW });
      allOutcomes.push({ type: 'd', label: '平', odds: oddsD });
      allOutcomes.push({ type: 'l', label: '负', odds: oddsL });
      if (btns[0]?.classList.contains('selected') && oddsW > 0) selections.push({ type: 'w', label: '胜', odds: oddsW });
      if (btns[1]?.classList.contains('selected') && oddsD > 0) selections.push({ type: 'd', label: '平', odds: oddsD });
      if (btns[2]?.classList.contains('selected') && oddsL > 0) selections.push({ type: 'l', label: '负', odds: oddsL });
    } else if (toggles.length >= 3) {
      oddsW = parseFloat(toggles[0]?.dataset.odds) || 0;
      oddsD = parseFloat(toggles[1]?.dataset.odds) || 0;
      oddsL = parseFloat(toggles[2]?.dataset.odds) || 0;
      allOutcomes.push({ type: 'w', label: '胜', odds: oddsW });
      allOutcomes.push({ type: 'd', label: '平', odds: oddsD });
      allOutcomes.push({ type: 'l', label: '负', odds: oddsL });
      if (toggles[0]?.classList.contains('selected') && oddsW > 0) selections.push({ type: 'w', label: '胜', odds: oddsW });
      if (toggles[1]?.classList.contains('selected') && oddsD > 0) selections.push({ type: 'd', label: '平', odds: oddsD });
      if (toggles[2]?.classList.contains('selected') && oddsL > 0) selections.push({ type: 'l', label: '负', odds: oddsL });
    }
    matches.push({ id, team: teams, oddsW, oddsD, oddsL, selections, allOutcomes });
  });
  $$('.match-entry').forEach(entry => {
    const id = entry.id.replace('match-', ''), team = $(`#team-${id}`)?.value || `比赛${id}`;
    const w = parseFloat($(`#odds-w-${id}`)?.value) || 0, d = parseFloat($(`#odds-d-${id}`)?.value) || 0, l = parseFloat($(`#odds-l-${id}`)?.value) || 0;
    const sel = [];
    const allOut = [{ type: 'w', label: '胜', odds: w }, { type: 'd', label: '平', odds: d }, { type: 'l', label: '负', odds: l }];
    if ($(`#sel-w-${id}`)?.checked && w > 0) sel.push({ type: 'w', label: '胜', odds: w });
    if ($(`#sel-d-${id}`)?.checked && d > 0) sel.push({ type: 'd', label: '平', odds: d });
    if ($(`#sel-l-${id}`)?.checked && l > 0) sel.push({ type: 'l', label: '负', odds: l });
    matches.push({ id, team, oddsW: w, oddsD: d, oddsL: l, selections: sel, allOutcomes: allOut });
  });
  return matches;
}

function updateBetBar() {
  const allRows = $$('.match-row');
  const selected = allRows.filter(r => r.querySelectorAll('.cz-opt-btn.selected, .cz-opt-btn-sm.selected, .odds-toggle.selected').length > 0);
  let betCount = 1;
  selected.forEach(r => {
    const n = r.querySelectorAll('.cz-opt-btn.selected, .cz-opt-btn-sm.selected, .odds-toggle.selected').length;
    betCount *= n;
  });
  if (selected.length === 0) betCount = 0;
  const multi = parseInt($('#bet-multiple')?.value) || 1;
  const amount = betCount * 2 * multi;
  const countEl = $('#cz-bet-count'), amountEl = $('#cz-bet-amount');
  if (countEl) countEl.textContent = betCount;
  if (amountEl) amountEl.textContent = '¥' + amount;
}

function updateParlayOptions() {
  const n = $$('.match-row, .match-entry').length;
  const container = $('#parlay-options');
  if (!container) return;
  container.innerHTML = '';
  if (n < 2) { container.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted)">至少需要 2 场比赛</span>'; return; }
  const seen = new Set();
  for (let m = 2; m <= Math.min(n, 8); m++) {
    const total = comb(n, m);
    [`${m}串1`, `${n}串${total}`].forEach(label => {
      if (seen.has(label)) return; seen.add(label);
      const chip = document.createElement('button');
      chip.className = 'parlay-chip' + (label === `${n}串1` ? ' active' : '');
      chip.textContent = label; chip.dataset.m = m; chip.dataset.label = label;
      chip.addEventListener('click', () => { $$('.parlay-chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); });
      container.appendChild(chip);
    });
  }
}

function calcKelly(odds, prob) { const b = odds - 1, q = 1 - prob; return b <= 0 ? 0 : (b * prob - q) / b; }
function calcEV(odds, prob) { return odds * prob - 1; }
function impliedProb(odds) { return odds > 0 ? 1 / odds : 0; }
function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }

function analyzeFootball() {
  const matches = getMatches();
  if (matches.length < 1) { showToast('请至少添加一场比赛并输入赔率', 'warning'); return; }
  const betAmount = parseFloat($('#bet-amount').value) || 2;
  const multiple = parseInt($('#bet-multiple').value) || 1;
  const estProbStr = $('#est-prob').value.trim();
  let estProbs = null;
  if (estProbStr) estProbs = estProbStr.split(/[,，\s]+/).map(Number).filter(n => !isNaN(n));

  const gameName = GAME_CONFIG[currentGameType]?.name || '胜负游戏';

  let totalSelections = 1;
  const matchesWithSel = matches.filter(m => m.selections.length > 0);
  matchesWithSel.forEach(m => { totalSelections *= m.selections.length; });
  const activeParlayChip = $('.parlay-chip.active');
  const parlayLabel = activeParlayChip ? activeParlayChip.dataset.label : `${matchesWithSel.length}串1`;
  const betCount = totalSelections;
  const totalCost = betCount * betAmount * multiple;

  let maxOddsProd = 1, minOddsProd = 1;
  matchesWithSel.forEach(m => {
    const oddsArr = m.selections.map(s => s.odds);
    maxOddsProd *= Math.max(...oddsArr); minOddsProd *= Math.min(...oddsArr);
  });
  const maxPayout = (betAmount * maxOddsProd * multiple).toFixed(2);
  const minPayout = (betAmount * minOddsProd * multiple).toFixed(2);

  $('#fb-summary').innerHTML = `
    <div class="result-item"><div class="label">游戏类型</div><div class="value neutral">${gameName}</div></div>
    <div class="result-item"><div class="label">总注数</div><div class="value neutral">${betCount}</div></div>
    <div class="result-item"><div class="label">过关方式</div><div class="value neutral">${parlayLabel}</div></div>
    <div class="result-item"><div class="label">投注金额</div><div class="value gold">¥${totalCost}</div></div>
    <div class="result-item"><div class="label">最高奖金</div><div class="value positive">¥${maxPayout}</div></div>
    <div class="result-item"><div class="label">最低奖金</div><div class="value neutral">¥${minPayout}</div></div>
    <div class="result-item"><div class="label">回报率范围</div><div class="value neutral">${totalCost > 0 ? (minPayout / totalCost * 100).toFixed(0) : 0}%-${totalCost > 0 ? (maxPayout / totalCost * 100).toFixed(0) : 0}%</div></div>`;

  let kellyHTML = '<table class="data-table"><thead><tr><th>比赛</th><th>结果</th><th>赔率</th><th>隐含概率</th><th>凯利指数</th><th>建议</th></tr></thead><tbody>';
  let evHTML = '<table class="data-table"><thead><tr><th>比赛</th><th>结果</th><th>赔率</th><th>EV值</th><th>判定</th></tr></thead><tbody>';
  let valueBetsHTML = '', chartData = [];
  let recommendHTML = '';

  matches.forEach(m => {
    // Use allOutcomes for game-type-aware analysis
    const outcomes = (m.allOutcomes && m.allOutcomes.length > 0)
      ? m.allOutcomes.filter(o => o.odds > 0)
      : [{ type: 'w', label: '胜', odds: m.oddsW }, { type: 'd', label: '平', odds: m.oddsD }, { type: 'l', label: '负', odds: m.oddsL }].filter(o => o.odds > 0);

    if (outcomes.length === 0) return;

    // V2.0: Use corrected probabilities (Bayesian + league), not same-source odds
    const impProbs = outcomes.map(o => impliedProb(o.odds));
    const margin = impProbs.reduce((a, b) => a + b, 0);
    // For sf/r9 games with 3 outcomes, use full Bayesian correction
    let fairProbs;
    if (outcomes.length === 3 && m.oddsW > 0 && m.oddsD > 0 && m.oddsL > 0) {
      fairProbs = getCorrectedProbs(m.oddsW, m.oddsD, m.oddsL, m.league || '');
    } else {
      fairProbs = impProbs.map(p => margin > 0 ? p / margin : 0);
    }

    // Per-match recommendation: find best value
    let bestEV = -Infinity, bestOutcome = null, bestProb = 0;

    outcomes.forEach((o, oIdx) => {
      const prob = estProbs && estProbs[oIdx] !== undefined ? estProbs[oIdx] : fairProbs[oIdx];
      const kelly = calcKelly(o.odds, prob), ev = calcEV(o.odds, prob);
      const kellyClass = kelly > 0.05 ? 'positive' : kelly > 0 ? 'neutral' : 'negative';
      const kellySuggestion = kelly > 0.1 ? '✅ 强烈推荐' : kelly > 0.05 ? '👍 推荐' : kelly > 0 ? '⚠️ 谨慎' : '❌ 不建议';
      kellyHTML += `<tr><td>${m.team}</td><td>${o.label}</td><td>${o.odds.toFixed(2)}</td><td>${(impliedProb(o.odds) * 100).toFixed(1)}%</td><td class="${kellyClass}" style="font-weight:700">${(kelly * 100).toFixed(2)}%</td><td>${kellySuggestion}</td></tr>`;
      const evClass = ev > 0 ? 'positive' : 'negative';
      const evTag = ev > 0 ? '<span class="value-badge value">🎯 价值投注</span>' : '<span class="value-badge cold">⛔ 负期望</span>';
      evHTML += `<tr><td>${m.team}</td><td>${o.label}</td><td>${o.odds.toFixed(2)}</td><td class="${evClass}" style="font-weight:700">${(ev * 100).toFixed(2)}%</td><td>${evTag}</td></tr>`;
      if (ev > 0) valueBetsHTML += `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid var(--border)"><span class="value-badge value">价值</span><span style="font-weight:600">${m.team}</span> — <span style="color:var(--cyan)">${o.label} @ ${o.odds.toFixed(2)}</span><span style="color:var(--green);font-weight:700">EV: +${(ev * 100).toFixed(2)}%</span></div>`;
      chartData.push({ match: m.team, type: o.label, odds: o.odds, impliedProb: impliedProb(o.odds), fairProb: fairProbs[oIdx] });

      if (ev > bestEV) { bestEV = ev; bestOutcome = o; bestProb = prob; }
    });

    // Build recommendation per match
    if (bestOutcome) {
      const confLevel = bestProb > 0.5 ? '高' : bestProb > 0.3 ? '中' : '低';
      const confColor = bestProb > 0.5 ? 'var(--green)' : bestProb > 0.3 ? 'var(--yellow)' : 'var(--text-muted)';
      // Find top 2 most probable
      const ranked = outcomes.map((o, i) => ({ ...o, prob: fairProbs[i] })).sort((a, b) => b.prob - a.prob);
      const top2 = ranked.slice(0, 2).map(r => `<span style="color:var(--cyan);font-weight:600">${r.label}</span>(${(r.prob * 100).toFixed(0)}%)`).join(' / ');
      recommendHTML += `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.82rem;">
        <span style="font-weight:600;min-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.team}</span>
        <span style="color:${confColor};font-size:0.72rem;min-width:30px;">信心:${confLevel}</span>
        <span>推荐: ${top2}</span>
      </div>`;
    }
  });

  kellyHTML += '</tbody></table>'; evHTML += '</tbody></table>';
  $('#kelly-results').innerHTML = kellyHTML;
  $('#ev-results').innerHTML = evHTML;

  // Add recommendation section to value-bets area
  let fullValueHTML = '';
  if (recommendHTML) {
    fullValueHTML += `<div style="margin-bottom:1rem;"><div style="font-weight:700;font-size:0.85rem;margin-bottom:0.5rem;color:var(--gold);">📋 ${gameName} — AI推荐方案</div>${recommendHTML}</div>`;
  }
  fullValueHTML += valueBetsHTML || '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem">当前赔率未发现明显价值投注机会</p>';

  $('#value-bets').innerHTML = fullValueHTML;
  $('#football-results').classList.remove('hidden');
  // Show sidebar analysis cards
  const kellyCard = $('#fb-side-kelly-card');
  const evCard = $('#fb-side-ev-card');
  const valueCard = $('#fb-side-value-card');
  if (kellyCard) kellyCard.style.display = '';
  if (evCard) evCard.style.display = '';
  if (valueCard) valueCard.style.display = '';
  drawOddsChart(chartData);
  showToast(`${gameName}深度分析完成`, 'success');
}

function drawOddsChart(data) {
  const canvas = $('#odds-chart');
  const { ctx, W, H } = setupCanvas(canvas, 250);
  const padding = { top: 30, bottom: 50, left: 50, right: 20 };
  const chartW = W - padding.left - padding.right, chartH = H - padding.top - padding.bottom;
  if (data.length === 0) return;
  const maxProb = Math.max(...data.map(d => d.impliedProb)) * 1.2;
  const barW = Math.min(30, chartW / data.length - 8);
  const colors = { '胜': '#27ae60', '平': '#f39c12', '负': '#e74c3c' };
  data.forEach((d, i) => {
    const x = padding.left + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
    const barH = (d.impliedProb / maxProb) * chartH, y = padding.top + chartH - barH;
    ctx.fillStyle = colors[d.type] || '#2980b9'; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#8892a8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`${d.type}`, x + barW / 2, H - padding.bottom + 15);
    ctx.fillText(`${(d.impliedProb * 100).toFixed(0)}%`, x + barW / 2, y - 5);
    if (i % 3 === 1) { ctx.fillStyle = '#5a6478'; ctx.font = '9px Inter'; ctx.fillText(d.match.substring(0, 8), x + barW / 2, H - padding.bottom + 30); }
  });
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left';
  ctx.fillText('隐含概率分布', padding.left, 18);
  const legendX = W - padding.right - 150;
  ['胜', '平', '负'].forEach((t, i) => { ctx.fillStyle = colors[t]; ctx.fillRect(legendX + i * 50, 10, 10, 10); ctx.fillStyle = '#8892a8'; ctx.font = '10px Inter'; ctx.fillText(t, legendX + i * 50 + 14, 19); });
}

// =============================================
// FOOTBALL AI RECOMMENDATION & EVOLUTION SYSTEM
// =============================================
const FB_PRED_KEY = 'fb_predictions';
const FB_PERF_KEY = 'fb_strategy_perf';

function getFbPredictions() { try { return JSON.parse(localStorage.getItem(FB_PRED_KEY)) || []; } catch { return []; } }
function saveFbPredictions(data) { localStorage.setItem(FB_PRED_KEY, JSON.stringify(data)); }
function getFbStrategyPerf() {
  try { return JSON.parse(localStorage.getItem(FB_PERF_KEY)) || getDefaultFbPerf(); } catch { return getDefaultFbPerf(); }
}
function saveFbStrategyPerf(data) { localStorage.setItem(FB_PERF_KEY, JSON.stringify(data)); }
function getDefaultFbPerf() {
  return {
    '保守稳健': { total: 0, correct: 0, weight: 1.0, history: [1.0] },
    '均衡推荐': { total: 0, correct: 0, weight: 1.0, history: [1.0] },
    '激进价值': { total: 0, correct: 0, weight: 1.0, history: [1.0] }
  };
}

// Generate recommendations using V2.0 3-strategy engine
function generateFbRecommendations() {
  const matches = getMatches();
  if (matches.length < 2) { showToast('至少需要2场比赛才能生成推荐', 'warning'); return; }

  const validMatches = matches.filter(m => m.oddsW > 0 && m.oddsD > 0 && m.oddsL > 0);
  if (validMatches.length < 2) { showToast('需要有完整赔率的比赛', 'warning'); return; }

  const perf = getFbStrategyPerf();
  const strategies = {};

  // V2.0: 3 strategies with Bayesian-corrected probabilities
  for (const strat of FB_STRATEGIES) {
    const w = strat.weights;
    strategies[strat.name.replace(/[^\u4e00-\u9fff]/g, '')] = validMatches.map(m => {
      const odds = [m.oddsW, m.oddsD, m.oddsL];
      const probs = getCorrectedProbs(m.oddsW, m.oddsD, m.oddsL, m.league || '');
      const ipRaw = odds.map(impliedProb);
      const margin = ipRaw.reduce((a, b) => a + b, 0);
      const marketProbs = ipRaw.map(p => margin > 0 ? p / margin : 0.33);

      const outcomes = ['胜', '平', '负'].map((label, i) => {
        const kelly = calcKelly(odds[i], probs[i]);
        const ev = calcEV(odds[i], probs[i]);
        const edge = probs[i] - marketProbs[i];
        return { label, odds: odds[i], prob: probs[i], kelly: Math.max(0, kelly), ev: Math.max(0, ev), edge };
      });

      // Normalize and combine
      const kMax = Math.max(0.001, ...outcomes.map(r => r.kelly));
      const eMax = Math.max(0.001, ...outcomes.map(r => r.ev));
      const pMax = Math.max(0.001, ...outcomes.map(r => r.prob));
      const edgeMax = Math.max(0.001, ...outcomes.map(r => Math.abs(r.edge)));

      const scored = outcomes.map(r => {
        const kn = r.kelly / kMax;
        const en = r.ev / eMax;
        const pn = r.prob / pMax;
        const kOr = kn > 0 ? kn : (r.edge > 0 ? r.edge / edgeMax : 0);
        const eOr = en > 0 ? en : (r.edge > 0 ? r.edge / edgeMax * 0.5 : 0);
        return { ...r, score: w.kelly * kOr + w.ev * eOr + w.implied * pn };
      });
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      return {
        team: m.team, pick: best.label, odds: best.odds,
        confidence: Math.min(95, Math.max(25, Math.round(best.prob * 100 + best.score * 20))),
        strategyId: strat.id
      };
    });
  }

  // Apply adaptive weights from evolution
  Object.keys(strategies).forEach(name => {
    const w = perf[name]?.weight || 1.0;
    strategies[name].forEach(p => p.confidence = Math.min(99, Math.round(p.confidence * w)));
  });

  renderFbPicks(strategies, validMatches);

  // Archive
  const prediction = {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    matchCount: validMatches.length,
    matches: validMatches.map(m => ({ team: m.team, league: m.league, oddsW: m.oddsW, oddsD: m.oddsD, oddsL: m.oddsL })),
    strategies,
    result: null
  };
  const preds = getFbPredictions();
  preds.unshift(prediction);
  if (preds.length > 50) preds.length = 50;
  saveFbPredictions(preds);
  renderFbArchive();
  showToast('推荐方案已生成并存档', 'success');
  const statusEl = $('#fb-picks-status');
  if (statusEl) statusEl.innerHTML = `<span style="color:var(--green)">✅ 已生成 3 套策略方案（${validMatches.length} 场比赛）</span>`;
}

function renderFbPicks(strategies, matches) {
  const container = $('#fb-picks-container');
  const icons = { '保守稳健': '🛡️', '均衡推荐': '⚖️', '激进价值': '🔥' };
  const colors = { '保守稳健': 'var(--gold)', '均衡推荐': 'var(--cyan)', '激进价值': 'var(--red)' };
  let html = '';
  Object.entries(strategies).forEach(([name, picks]) => {
    const icon = icons[name] || '📋';
    const color = colors[name] || 'var(--cyan)';
    const avgConf = Math.round(picks.reduce((s, p) => s + p.confidence, 0) / picks.length);
    const totalOdds = picks.reduce((p, c) => p * c.odds, 1).toFixed(2);
    html += `<div style="margin-bottom:0.75rem;padding:0.75rem;border-radius:var(--radius-sm);border:1px solid rgba(255,255,255,0.04);background:rgba(10,14,26,0.4);">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
        <span style="font-size:1.1rem">${icon}</span>
        <span style="font-weight:700;color:${color};font-size:0.85rem;">${name}</span>
        <span style="margin-left:auto;font-size:0.72rem;color:var(--text-muted)">信心: ${avgConf}% | 综合赔率: ${totalOdds}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">`;
    picks.forEach(p => {
      const pickColor = p.pick === '胜' ? 'var(--red)' : p.pick === '平' ? 'var(--green)' : 'var(--blue)';
      html += `<span style="font-size:0.75rem;padding:0.2rem 0.6rem;border-radius:4px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
        ${p.team.substring(0, 10)} <span style="color:${pickColor};font-weight:700">${p.pick}</span> <span style="font-family:'JetBrains Mono';font-size:0.7rem;color:var(--text-muted)">@${p.odds.toFixed(2)}</span>
      </span>`;
    });
    html += `</div></div>`;
  });
  if (container) container.innerHTML = html;
}

// Compare predictions with actual results
async function compareFbPredictions() {
  const preds = getFbPredictions();
  if (preds.length === 0) { showToast('暂无推荐记录', 'warning'); return; }

  const btn = $('#btn-compare-fb');
  setButtonLoading(btn, true);
  showToast('正在获取比赛结果...', 'info');

  // Use 14场胜负游戏 draw results from cache or fetch fresh
  let drawResult = null;
  if (_drawResultsCache?.length) {
    drawResult = _drawResultsCache[0]; // Most recent draw period
  } else {
    try {
      const resp = await fetch('https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=90&provinceId=0&pageSize=1&isVerify=1&pageNo=1', {
        signal: AbortSignal.timeout(8000)
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.value?.list?.length) drawResult = json.value.list[0];
      }
    } catch { }
  }

  // Build position-based results from draw data
  let results = null;
  if (drawResult?.lotteryDrawResult) {
    const resultCodes = drawResult.lotteryDrawResult.split(' ');
    const resultMap = { '3': '胜', '1': '平', '0': '负' };
    results = {};
    if (drawResult.matchList?.length) {
      drawResult.matchList.forEach((m, i) => {
        const key = (m.masterTeamName || '').trim() + 'vs' + (m.guestTeamName || '').trim();
        results[key] = resultMap[m.result || resultCodes[i]] || '平';
        results['_pos' + i] = resultMap[m.result || resultCodes[i]] || '平';
      });
    } else {
      resultCodes.forEach((code, i) => {
        results['_pos' + i] = resultMap[code] || '平';
      });
    }
    showToast(`已获取第${drawResult.lotteryDrawNum}期开奖结果`, 'success');
  }

  if (!results || Object.keys(results).length === 0) {
    setButtonLoading(btn, false);
    showToast('暂无可用的开奖结果数据', 'warning');
    return;
  }

  // Compare latest uncompared prediction
  const perf = getFbStrategyPerf();
  let compared = 0;
  preds.forEach(pred => {
    if (pred.result) return; // already compared
    if (!pred.matches || !pred.strategies) return;

    pred.result = {};
    Object.entries(pred.strategies).forEach(([stratName, picks]) => {
      let correct = 0, total = picks.length;
      picks.forEach((p, i) => {
        // First try position-based matching (most reliable for 14场)
        let actualResult = results['_pos' + i];
        // Fallback: team name matching
        if (!actualResult) {
          const teamKey = p.team.replace(/\s/g, '');
          Object.keys(results).forEach(k => {
            if (k.startsWith('_pos')) return; // skip position keys
            if (teamKey.includes(k.substring(0, 3)) || k.includes(teamKey.substring(0, 3))) actualResult = results[k];
          });
        }
        if (!actualResult) return; // skip if no matching result
        p.actual = actualResult;
        p.hit = p.pick === actualResult;
        if (p.hit) correct++;
      });
      pred.result[stratName] = { correct, total, rate: total > 0 ? (correct / total * 100).toFixed(1) : '0' };

      // Update performance
      if (!perf[stratName]) perf[stratName] = { total: 0, correct: 0, weight: 1.0 };
      perf[stratName].total += total;
      perf[stratName].correct += correct;
    });
    compared++;
  });

  // Adaptive weight evolution
  Object.keys(perf).forEach(name => {
    if (perf[name].total >= 5) {
      const rate = perf[name].correct / perf[name].total;
      // Evolve weight: good strategies get boosted, bad ones decay
      perf[name].weight = 0.5 + rate; // range: 0.5 - 1.5
    }
    // Record history for sparkline
    if (!perf[name].history) perf[name].history = [1.0];
    perf[name].history.push(perf[name].weight);
    if (perf[name].history.length > 20) perf[name].history.shift(); // keep last 20
  });

  saveFbPredictions(preds);
  saveFbStrategyPerf(perf);
  renderFbArchive();
  renderFbStrategyPerf();
  setButtonLoading(btn, false);
  showToast(`已对比 ${compared} 条记录，策略权重已更新`, 'success');
}

function renderFbArchive() {
  const preds = getFbPredictions();
  const container = $('#fb-archive-list');
  const countEl = $('#fb-archive-count');
  if (countEl) countEl.textContent = preds.length + ' 条记录';

  if (preds.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><div class="empty-state-title">暂无存档</div><div class="empty-state-desc">生成推荐后自动存档</div></div>';
    return;
  }

  let html = '';
  preds.slice(0, 10).forEach((pred, idx) => {
    const hasResult = !!pred.result;
    const statusIcon = hasResult ? '✅' : '⏳';
    let resultSummary = '';
    if (hasResult) {
      Object.entries(pred.result).forEach(([name, r]) => {
        resultSummary += `<span style="font-size:0.68rem;margin-right:0.5rem;">${name}: <span style="color:${parseFloat(r.rate) >= 50 ? 'var(--green)' : 'var(--red)'}; font-weight:700">${r.rate}%</span>(${r.correct}/${r.total})</span>`;
      });
    }
    html += `<div style="padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.78rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <span>${statusIcon}</span>
        <span style="font-weight:600">${pred.date}</span>
        <span style="color:var(--text-muted)">${pred.time}</span>
        <span style="color:var(--text-muted)">${pred.matchCount}场</span>
        ${hasResult ? '<span style="color:var(--green);font-size:0.7rem;">已对比</span>' : '<span style="color:var(--text-muted);font-size:0.7rem;">待对比</span>'}
      </div>
      ${resultSummary ? `<div style="margin-top:0.3rem;display:flex;flex-wrap:wrap;gap:0.3rem;">${resultSummary}</div>` : ''}
    </div>`;
  });
  container.innerHTML = html;
}

function renderFbStrategyPerf() {
  const perf = getFbStrategyPerf();
  const container = $('#fb-strategy-perf');
  const icons = { '保守稳健': '🛡️', '均衡推荐': '⚖️', '激进价值': '🔥' };

  let html = '<table class="data-table"><thead><tr><th>策略</th><th>总预测</th><th>命中</th><th>命中率</th><th>权重</th><th>进化轨迹</th></tr></thead><tbody>';
  Object.entries(perf).forEach(([name, d]) => {
    const rate = d.total > 0 ? (d.correct / d.total * 100).toFixed(1) : '--';
    const rateColor = d.total > 0 ? (d.correct / d.total >= 0.5 ? 'var(--green)' : d.correct / d.total >= 0.33 ? 'var(--gold)' : 'var(--red)') : 'var(--text-muted)';
    const weightBar = `<div style="width:60px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${Math.min(100, d.weight * 66.7)}%;background:var(--cyan);border-radius:3px;"></div></div>`;
    
    // Sparkline for trajectory
    let sparklineHTML = '<span style="color:var(--text-muted)">--</span>';
    const hist = d.history || [1.0];
    if (hist.length >= 2) {
      const minHist = Math.min(...hist) * 0.9;
      const maxHist = Math.max(...hist) * 1.1;
      const diff = maxHist - minHist || 1;
      const w = 50, h = 16;
      const dx = w / (hist.length - 1);
      const pts = hist.map((v, i) => `${i * dx},${h - ((v - minHist) / diff) * h}`).join(' ');
      const strokeColor = hist[hist.length - 1] >= hist[0] ? 'var(--green)' : 'var(--red)';
      sparklineHTML = `<svg width="${w}" height="${h}" style="overflow:visible;vertical-align:middle;"><polyline points="${pts}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    html += `<tr>
      <td>${icons[name] || ''} ${name}</td>
      <td style="font-family:'JetBrains Mono';text-align:center">${d.total}</td>
      <td style="font-family:'JetBrains Mono';text-align:center">${d.correct}</td>
      <td style="color:${rateColor};font-weight:700;text-align:center">${rate}%</td>
      <td>${weightBar}</td>
      <td style="text-align:center;vertical-align:middle;">${sparklineHTML}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// Initialize football prediction UI
function initFbPredictionUI() {
  renderFbArchive();
  const perf = getFbStrategyPerf();
  if (perf && Object.values(perf).some(d => d.total > 0)) renderFbStrategyPerf();
  autoLoadLatestPicks();
}

// ---- 自动加载最新AI推荐方案 ----
async function autoLoadLatestPicks() {
  try {
    const resp = await fetch('data/fb-picks/latest.json?t=' + Date.now());
    if (!resp.ok) return;
    const picks = await resp.json();
    if (!picks?.date) return;
    window._latestFbPicks = picks;
    displayLatestPicks(picks);
  } catch { /* 无推荐方案时忽略 */ }
}

function displayLatestPicks(picks) {
  if (!picks) return;
  const container = $('#fb-ai-picks-display');
  if (!container) return;

  // Update model version tag
  const verTag = $('#fb-ai-model-ver');
  if (verTag) verTag.textContent = `v${picks.modelVersion || 1}`;

  const game = currentGameType || 'sf';
  const gamePicks = picks[game];
  if (!gamePicks?.picks?.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.72rem;text-align:center;padding:0.3rem">暂无推荐</p>';
    return;
  }

  let html = '';

  if (game === 'jq') {
    gamePicks.picks.forEach(p => {
      html += `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.2rem 0;font-size:0.72rem;border-bottom:1px solid rgba(255,255,255,0.03);">
        <span style="font-weight:600;min-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.home} vs ${p.away}</span>
        <span style="color:var(--cyan);font-weight:700;font-size:0.7rem;">主${p.homePick} 客${p.awayPick}</span>
        <span style="color:${p.confidence === '高' ? 'var(--green)' : 'var(--text-muted)'};font-size:0.62rem;">${p.confidence}</span>
      </div>`;
    });
  } else {
    gamePicks.picks.forEach(p => {
      html += `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.2rem 0;font-size:0.72rem;border-bottom:1px solid rgba(255,255,255,0.03);">
        <span style="font-weight:600;min-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.home || ''} vs ${p.away || ''}</span>
        <span style="color:var(--cyan);font-weight:700;font-size:0.7rem;">${p.pick}</span>
        <span style="color:${p.confidence === '高' ? 'var(--green)' : 'var(--text-muted)'};font-size:0.62rem;">${p.confidence}</span>
      </div>`;
    });
  }

  container.innerHTML = html;
}

$('#btn-fetch-matches').addEventListener('click', fetchFootballMatches);
$('#btn-select-all')?.addEventListener('click', () => {
  $$('.match-row').forEach(row => {
    const btns = row.querySelectorAll('.cz-opt-btn');
    if (btns.length >= 3) {
      let best = null, bestOdds = Infinity;
      btns.forEach(b => { const o = parseFloat(b.dataset.odds); if (o > 0 && o < bestOdds) { bestOdds = o; best = b; } });
      if (best && !best.classList.contains('selected')) { best.classList.add('selected'); row.classList.add('has-selection'); }
    } else {
      const toggles = row.querySelectorAll('.odds-toggle');
      let best = null, bestOdds = Infinity;
      toggles.forEach(t => { const o = parseFloat(t.dataset.odds); if (o > 0 && o < bestOdds) { bestOdds = o; best = t; } });
      if (best && !best.classList.contains('selected')) { best.classList.add('selected'); row.classList.add('has-selection'); }
    }
  });
  updateParlayOptions(); updateBetBar(); showToast('已选择各场最可能结果', 'info');
});
$('#btn-clear-selection')?.addEventListener('click', () => {
  $$('.cz-opt-btn.selected').forEach(b => b.classList.remove('selected'));
  $$('.odds-toggle.selected').forEach(t => t.classList.remove('selected'));
  $$('.match-row.has-selection').forEach(r => r.classList.remove('has-selection'));
  updateParlayOptions(); updateBetBar(); showToast('已清空所有选择', 'info');
});
$('#btn-analyze-football')?.addEventListener('click', analyzeFootball);
$('#btn-gen-fb-picks')?.addEventListener('click', generateFbRecommendations);
$('#btn-compare-fb')?.addEventListener('click', compareFbPredictions);
// Game tab switching
$$('.cz-game-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.cz-game-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  switchGameTab(tab.dataset.game);
}));
// Multiplier +/- buttons
const betMinus = $('#bet-minus'), betPlus = $('#bet-plus'), betMulti = $('#bet-multiple');
if (betMinus) betMinus.addEventListener('click', () => { const v = Math.max(1, (parseInt(betMulti.value) || 1) - 1); betMulti.value = v; updateBetBar(); });
if (betPlus) betPlus.addEventListener('click', () => { const v = Math.min(99, (parseInt(betMulti.value) || 1) + 1); betMulti.value = v; updateBetBar(); });
if (betMulti) betMulti.addEventListener('change', updateBetBar);
initFbPredictionUI();
// Auto-load model params, draw results and match data on page init
loadModelParams();
fetchDrawResults();
setTimeout(() => fetchFootballMatches(), 500);
