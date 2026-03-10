// =============================================
// 体彩深度分析 V2.0 — 核心应用逻辑
// =============================================

// ---- Utility Functions ----
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
function comb(n, r) {
  if (r > n || r < 0) return 0;
  if (r === 0 || r === n) return 1;
  let result = 1;
  for (let i = 0; i < r; i++) { result = result * (n - i) / (i + 1); }
  return Math.round(result);
}

// =============================================
// Toast Notification System
// =============================================
function showToast(message, type = 'info', duration = 3000) {
  const container = $('#toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); }, duration);
}

// =============================================
// UX Utilities (P0–P2 Design Audit Fixes)
// =============================================

// P0: Button Loading State
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._origHTML = btn.innerHTML;
    btn.classList.add('is-loading');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>处理中...';
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
    if (btn._origHTML) btn.innerHTML = btn._origHTML;
  }
}

// P2: Custom Confirm Dialog (replaces confirm())
function showConfirmDialog({ title, message, confirmText = '确认', cancelText = '取消', danger = false }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `<div class="confirm-dialog">
      <div class="confirm-dialog-title">${danger ? '⚠️' : 'ℹ️'} ${title}</div>
      <div class="confirm-dialog-msg">${message}</div>
      <div class="confirm-dialog-actions">
        <button class="btn btn-ghost btn-sm" id="confirm-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-red' : 'btn-primary'} btn-sm" id="confirm-ok">${confirmText}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.querySelector('#confirm-ok').addEventListener('click', () => { overlay.remove(); resolve(true); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}

// P1: Collapsible Panel with Arrow
function initCollapsiblePanel(toggleId, bodyId) {
  const toggle = $(toggleId);
  const body = $(bodyId);
  if (!toggle || !body) return;
  // Add arrow if not present
  if (!toggle.querySelector('.collapsible-arrow')) {
    const arrow = document.createElement('span');
    arrow.className = 'collapsible-arrow';
    arrow.textContent = '▸';
    toggle.appendChild(arrow);
  }
  toggle.addEventListener('click', () => {
    const isHidden = body.classList.contains('hidden') || body.style.display === 'none';
    const arrow = toggle.querySelector('.collapsible-arrow');
    if (isHidden) {
      body.classList.remove('hidden');
      body.style.display = '';
      if (arrow) arrow.classList.add('expanded');
    } else {
      body.classList.add('hidden');
      if (arrow) arrow.classList.remove('expanded');
    }
  });
}

// =============================================
// Particle Background
// =============================================
function initParticles() {
  const canvas = $('#particle-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < 60; i++) {
    particles.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 0.5 });
  }
  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,210,255,0.3)'; ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,210,255,${0.08 * (1 - dist / 120)})`;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}
initParticles();

// ---- Canvas Utility ----
function setupCanvas(canvas, height) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W = Math.max(rect.width - 16, 200);
  canvas.width = W * dpr; canvas.height = height * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, height);
  return { ctx, W, H: height };
}

// ---- Tab Switching ----
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $('#tab-' + btn.dataset.tab).classList.add('active');
  });
});

// =============================================
// SECTION 1: 竞彩足球深度分析
// =============================================
let matchCount = 0;
let matchData = [];
let currentGameType = 'sf'; // sf | r9 | bqc | jq

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
      name: '体彩竞彩(直连)', url: 'https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=HAD,HHAD&channel=c923-tysw-lq-dwj',
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
              oddsW: parseFloat(m.had?.a) || 0,
              oddsD: parseFloat(m.had?.d) || 0,
              oddsL: parseFloat(m.had?.h) || 0
            });
          }
        }
        return matches.filter(m => m.home !== '主队' && (m.oddsW > 0 || m.oddsD > 0));
      }
    }
  ];
  let matches = null;
  for (const api of apis) {
    try { const resp = await fetch(api.url, { signal: AbortSignal.timeout(10000) }); if (!resp.ok) continue; const json = await resp.json(); matches = api.extract(json); if (matches?.length > 0) { status.innerHTML = `<span style="color:var(--green)">✅ 通过${api.name}获取 ${matches.length} 场赛事</span>`; break; } } catch { continue; }
  }
  if (!matches?.length) { status.innerHTML = '<span style="color:var(--orange)">⚠️ 无法获取实时赛事，已载入示例</span>'; loadSampleMatches(); setButtonLoading(btn, false); return; }
  renderMatchList(matches); setButtonLoading(btn, false); showToast(`获取 ${matches.length} 场赛事`, 'success');
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
  const selected = $$('.match-row').filter(r => r.querySelectorAll('.cz-opt-btn.selected, .cz-opt-btn-sm.selected, .odds-toggle.selected').length > 0);
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

    const impProbs = outcomes.map(o => impliedProb(o.odds));
    const margin = impProbs.reduce((a, b) => a + b, 0);
    const fairProbs = impProbs.map(p => margin > 0 ? p / margin : 0);

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
    '价值投注': { total: 0, correct: 0, weight: 1.0 },
    '凯利最优': { total: 0, correct: 0, weight: 1.0 },
    '概率优先': { total: 0, correct: 0, weight: 1.0 },
    '保守稳健': { total: 0, correct: 0, weight: 0.8 },
    '激进冲奖': { total: 0, correct: 0, weight: 0.6 }
  };
}

// Generate recommendations for current matches
function generateFbRecommendations() {
  const matches = getMatches();
  if (matches.length < 2) { showToast('至少需要2场比赛才能生成推荐', 'warning'); return; }

  const validMatches = matches.filter(m => m.oddsW > 0 && m.oddsD > 0 && m.oddsL > 0);
  if (validMatches.length < 2) { showToast('需要有完整赔率的比赛', 'warning'); return; }

  const perf = getFbStrategyPerf();
  const strategies = {};

  // Strategy 1: Value Bet (EV > 0 picks)
  strategies['价值投注'] = validMatches.map(m => {
    const outcomes = [{ type: '胜', odds: m.oddsW }, { type: '平', odds: m.oddsD }, { type: '负', odds: m.oddsL }];
    const impProbs = outcomes.map(o => impliedProb(o.odds));
    const margin = impProbs.reduce((a, b) => a + b, 0);
    const fairProbs = impProbs.map(p => p / margin);
    let bestEV = -Infinity, bestPick = outcomes[0];
    outcomes.forEach((o, i) => { const ev = calcEV(o.odds, fairProbs[i]); if (ev > bestEV) { bestEV = ev; bestPick = o; } });
    return { team: m.team, pick: bestPick.type, odds: bestPick.odds, confidence: Math.min(99, Math.max(30, 50 + bestEV * 200)) };
  });

  // Strategy 2: Kelly Optimal
  strategies['凯利最优'] = validMatches.map(m => {
    const outcomes = [{ type: '胜', odds: m.oddsW }, { type: '平', odds: m.oddsD }, { type: '负', odds: m.oddsL }];
    const impProbs = outcomes.map(o => impliedProb(o.odds));
    const margin = impProbs.reduce((a, b) => a + b, 0);
    const fairProbs = impProbs.map(p => p / margin);
    let bestKelly = -Infinity, bestPick = outcomes[0];
    outcomes.forEach((o, i) => { const k = calcKelly(o.odds, fairProbs[i]); if (k > bestKelly) { bestKelly = k; bestPick = o; } });
    return { team: m.team, pick: bestPick.type, odds: bestPick.odds, confidence: Math.min(99, Math.max(30, 50 + bestKelly * 300)) };
  });

  // Strategy 3: Probability Priority (lowest odds = highest prob)
  strategies['概率优先'] = validMatches.map(m => {
    const outcomes = [{ type: '胜', odds: m.oddsW }, { type: '平', odds: m.oddsD }, { type: '负', odds: m.oddsL }];
    let best = outcomes[0];
    outcomes.forEach(o => { if (o.odds < best.odds) best = o; });
    return { team: m.team, pick: best.type, odds: best.odds, confidence: Math.min(95, Math.max(40, (1 / best.odds) * 100 + 10)) };
  });

  // Strategy 4: Conservative (pick home win if odds < 2.0, else draw)
  strategies['保守稳健'] = validMatches.map(m => {
    let pick, odds;
    if (m.oddsW <= 1.8) { pick = '胜'; odds = m.oddsW; }
    else if (m.oddsD <= 3.0) { pick = '平'; odds = m.oddsD; }
    else { const best = Math.min(m.oddsW, m.oddsD, m.oddsL); pick = best === m.oddsW ? '胜' : best === m.oddsD ? '平' : '负'; odds = best; }
    return { team: m.team, pick, odds, confidence: Math.min(85, Math.max(35, (1 / odds) * 80)) };
  });

  // Strategy 5: Aggressive (pick high odds value bets for big payout)
  strategies['激进冲奖'] = validMatches.map(m => {
    const outcomes = [{ type: '胜', odds: m.oddsW }, { type: '平', odds: m.oddsD }, { type: '负', odds: m.oddsL }];
    // Find the middle odds (not the favorite, not the longest shot)
    outcomes.sort((a, b) => a.odds - b.odds);
    const pick = outcomes[1] || outcomes[0]; // middle odds
    return { team: m.team, pick: pick.type, odds: pick.odds, confidence: Math.min(70, Math.max(25, 30 + (1 / pick.odds) * 50)) };
  });

  // Apply adaptive weights
  Object.keys(strategies).forEach(name => {
    const w = perf[name]?.weight || 1.0;
    strategies[name].forEach(p => p.confidence = Math.round(p.confidence * w));
  });

  // Render picks
  renderFbPicks(strategies, validMatches);

  // Archive
  const prediction = {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    matchCount: validMatches.length,
    matches: validMatches.map(m => ({ team: m.team, oddsW: m.oddsW, oddsD: m.oddsD, oddsL: m.oddsL })),
    strategies,
    result: null // filled after comparison
  };
  const preds = getFbPredictions();
  preds.unshift(prediction);
  if (preds.length > 50) preds.length = 50;
  saveFbPredictions(preds);
  renderFbArchive();
  showToast('推荐方案已生成并存档', 'success');
  $('#fb-picks-status').innerHTML = `<span style="color:var(--green)">✅ 已生成 5 套策略方案（${validMatches.length} 场比赛）</span>`;
}

function renderFbPicks(strategies, matches) {
  const container = $('#fb-picks-container');
  const icons = { '价值投注': '💎', '凯利最优': '📈', '保守稳健': '🛡️', '概率优先': '🎯', '激进冲奖': '🔥' };
  const colors = { '价值投注': 'var(--cyan)', '凯利最优': 'var(--green)', '概率优先': 'var(--blue)', '保守稳健': 'var(--gold)', '激进冲奖': 'var(--red)' };
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
  container.innerHTML = html;
}

// Compare predictions with actual results
async function compareFbPredictions() {
  const preds = getFbPredictions();
  if (preds.length === 0) { showToast('暂无推荐记录', 'warning'); return; }

  const btn = $('#btn-compare-fb');
  setButtonLoading(btn, true);
  showToast('正在获取比赛结果...', 'info');

  // Try to fetch results
  let results = null;
  try {
    const resp = await fetch('https://webapi.sporttery.cn/gateway/jc/football/getMatchResultV1.qry?channel=c923-tysw-lq-dwj', { signal: AbortSignal.timeout(8000) });
    if (resp.ok) {
      const json = await resp.json();
      if (json?.value?.matchResult) {
        results = {};
        json.value.matchResult.forEach(r => {
          const key = (r.homeTeamAbbName || r.homeTeamName) + 'vs' + (r.awayTeamAbbName || r.awayTeamName);
          const homeGoal = parseInt(r.homeGoal) || 0, awayGoal = parseInt(r.awayGoal) || 0;
          results[key] = homeGoal > awayGoal ? '胜' : homeGoal === awayGoal ? '平' : '负';
        });
      }
    }
  } catch { }

  // Also try local data
  if (!results) {
    try {
      const resp = await fetch('data/football-results.json', { signal: AbortSignal.timeout(5000) });
      if (resp.ok) results = await resp.json();
    } catch { }
  }

  if (!results || Object.keys(results).length === 0) {
    // Use sample results for demo
    results = {};
    const latest = preds[0];
    if (latest?.matches) {
      const sampleResults = ['胜', '平', '胜', '负', '胜', '胜', '平', '胜'];
      latest.matches.forEach((m, i) => {
        const key = m.team.replace(/\s/g, '');
        results[key] = sampleResults[i % sampleResults.length];
      });
    }
    showToast('使用模拟结果进行对比演示', 'info');
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
        const teamKey = p.team.replace(/\s/g, '');
        // Find matching result
        let actualResult = null;
        Object.keys(results).forEach(k => { if (teamKey.includes(k.substring(0, 3)) || k.includes(teamKey.substring(0, 3))) actualResult = results[k]; });
        if (!actualResult) { // random fallback for demo
          actualResult = ['胜', '平', '负'][Math.floor(Math.random() * 3)];
        }
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
  const icons = { '价值投注': '💎', '凯利最优': '📈', '概率优先': '🎯', '保守稳健': '🛡️', '激进冲奖': '🔥' };

  let html = '<table class="data-table"><thead><tr><th>策略</th><th>总预测</th><th>命中</th><th>命中率</th><th>权重</th><th>趋势</th></tr></thead><tbody>';
  Object.entries(perf).forEach(([name, d]) => {
    const rate = d.total > 0 ? (d.correct / d.total * 100).toFixed(1) : '--';
    const rateColor = d.total > 0 ? (d.correct / d.total >= 0.5 ? 'var(--green)' : d.correct / d.total >= 0.33 ? 'var(--gold)' : 'var(--red)') : 'var(--text-muted)';
    const weightBar = `<div style="width:60px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${Math.min(100, d.weight * 66.7)}%;background:var(--cyan);border-radius:3px;"></div></div>`;
    const trend = d.weight >= 1.0 ? '📈' : d.weight >= 0.8 ? '➡️' : '📉';
    html += `<tr>
      <td>${icons[name] || ''} ${name}</td>
      <td style="font-family:'JetBrains Mono';text-align:center">${d.total}</td>
      <td style="font-family:'JetBrains Mono';text-align:center">${d.correct}</td>
      <td style="color:${rateColor};font-weight:700;text-align:center">${rate}%</td>
      <td>${weightBar}</td>
      <td style="text-align:center">${trend}</td>
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

  const game = currentGameType || 'sf';
  const gamePicks = picks[game];
  if (!gamePicks?.picks?.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:0.5rem">暂无当前游戏类型的AI推荐</p>';
    return;
  }

  const accuracy = picks.modelAccuracy ? `(模型准确率: ${(picks.modelAccuracy * 100).toFixed(1)}%)` : '';
  let html = `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">📅 ${picks.date} ${picks.time || ''} | v${picks.modelVersion || 1} ${accuracy}</div>`;

  if (game === 'jq') {
    gamePicks.picks.forEach(p => {
      html += `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.82rem;">
        <span style="font-weight:600;min-width:120px;">${p.home} vs ${p.away}</span>
        <span style="color:var(--cyan);font-weight:700;">主${p.homePick} 客${p.awayPick}</span>
        <span style="color:${p.confidence === '高' ? 'var(--green)' : p.confidence === '中' ? 'var(--yellow)' : 'var(--text-muted)'};font-size:0.72rem;">${p.confidence}</span>
      </div>`;
    });
  } else {
    gamePicks.picks.forEach(p => {
      const topStr = p.topPicks?.map(t => `${t.label}(${t.prob}%)`).join(' / ') || '';
      html += `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.82rem;">
        <span style="font-weight:600;min-width:120px;">${p.home || ''} vs ${p.away || ''}</span>
        <span style="color:var(--cyan);font-weight:700;">${p.pick}</span>
        <span style="color:${p.confidence === '高' ? 'var(--green)' : p.confidence === '中' ? 'var(--yellow)' : 'var(--text-muted)'};font-size:0.72rem;">${p.confidence}</span>
        <span style="font-size:0.72rem;color:var(--text-muted);">${topStr}</span>
      </div>`;
    });
  }

  container.innerHTML = html;
}

$('#btn-fetch-matches').addEventListener('click', fetchFootballMatches);
$('#btn-load-sample').addEventListener('click', loadSampleMatches);
$('#btn-add-match').addEventListener('click', () => addMatch('', '', '', ''));
$('#btn-select-all').addEventListener('click', () => {
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
$('#btn-clear-selection').addEventListener('click', () => {
  $$('.cz-opt-btn.selected').forEach(b => b.classList.remove('selected'));
  $$('.odds-toggle.selected').forEach(t => t.classList.remove('selected'));
  $$('.match-row.has-selection').forEach(r => r.classList.remove('has-selection'));
  updateParlayOptions(); updateBetBar(); showToast('已清空所有选择', 'info');
});
$('#btn-analyze-football').addEventListener('click', analyzeFootball);
$('#btn-gen-fb-picks').addEventListener('click', generateFbRecommendations);
$('#btn-compare-fb').addEventListener('click', compareFbPredictions);
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

// =============================================
// SECTION 2: 大乐透深度分析
// =============================================
const DLT_DEFAULT_DATA = [
  { issue: '26023', front: [9, 25, 26, 27, 28], back: [1, 8] },
  { issue: '26022', front: [5, 9, 10, 18, 26], back: [5, 6] },
  { issue: '26021', front: [5, 8, 12, 14, 17], back: [4, 5] },
  { issue: '26020', front: [1, 10, 21, 23, 29], back: [10, 12] },
  { issue: '26019', front: [12, 13, 14, 16, 31], back: [4, 12] },
  { issue: '26018', front: [9, 11, 19, 30, 35], back: [1, 12] },
  { issue: '26017', front: [4, 5, 10, 23, 31], back: [7, 12] },
  { issue: '26016', front: [8, 9, 12, 19, 24], back: [1, 6] },
  { issue: '26015', front: [1, 4, 10, 13, 17], back: [3, 11] },
  { issue: '26014', front: [16, 18, 23, 34, 35], back: [1, 6] },
  { issue: '26013', front: [3, 5, 6, 23, 26], back: [1, 4] },
  { issue: '26012', front: [1, 2, 9, 22, 25], back: [1, 6] },
  { issue: '26011', front: [14, 21, 23, 29, 33], back: [2, 10] },
  { issue: '26010', front: [2, 3, 13, 18, 26], back: [2, 9] },
  { issue: '26009', front: [5, 12, 13, 14, 33], back: [5, 8] },
  { issue: '26008', front: [3, 6, 17, 21, 33], back: [5, 11] },
  { issue: '26007', front: [1, 3, 13, 20, 26], back: [3, 10] },
  { issue: '26006', front: [5, 12, 18, 23, 35], back: [6, 12] },
  { issue: '26005', front: [2, 4, 16, 23, 35], back: [6, 11] },
  { issue: '26004', front: [5, 18, 23, 25, 32], back: [5, 9] },
  { issue: '26003', front: [2, 9, 11, 15, 16], back: [2, 4] },
  { issue: '26002', front: [4, 8, 15, 20, 31], back: [7, 8] },
  { issue: '26001', front: [7, 9, 23, 27, 32], back: [2, 8] },
  { issue: '25150', front: [13, 14, 15, 28, 31], back: [1, 5] },
  { issue: '25149', front: [24, 26, 30, 31, 32], back: [5, 12] },
  { issue: '25148', front: [3, 4, 14, 30, 32], back: [8, 12] },
  { issue: '25147', front: [6, 16, 21, 25, 33], back: [7, 8] },
  { issue: '25146', front: [6, 11, 13, 16, 22], back: [2, 3] },
  { issue: '25145', front: [5, 7, 20, 22, 25], back: [4, 5] },
  { issue: '25144', front: [2, 5, 13, 15, 28], back: [5, 8] },
  { issue: '25143', front: [3, 4, 18, 24, 29], back: [7, 12] },
  { issue: '25142', front: [9, 10, 14, 27, 29], back: [2, 9] },
  { issue: '25141', front: [4, 9, 24, 28, 29], back: [2, 10] },
  { issue: '25140', front: [4, 5, 13, 18, 34], back: [2, 8] },
  { issue: '25139', front: [8, 18, 22, 30, 35], back: [1, 4] },
  { issue: '25138', front: [1, 3, 19, 21, 23], back: [7, 11] },
  { issue: '25137', front: [7, 8, 9, 11, 22], back: [5, 11] },
  { issue: '25136', front: [7, 11, 15, 16, 23], back: [9, 11] },
  { issue: '25135', front: [2, 10, 16, 28, 32], back: [1, 7] },
  { issue: '25134', front: [7, 12, 18, 27, 33], back: [9, 10] },
  { issue: '25133', front: [4, 11, 23, 27, 35], back: [7, 11] },
  { issue: '25132', front: [1, 9, 10, 12, 19], back: [6, 7] },
  { issue: '25131', front: [3, 8, 25, 29, 32], back: [9, 12] },
  { issue: '25130', front: [1, 13, 16, 27, 29], back: [2, 11] },
  { issue: '25129', front: [3, 9, 14, 28, 35], back: [2, 4] },
  { issue: '25128', front: [3, 6, 26, 30, 33], back: [11, 12] },
  { issue: '25127', front: [4, 5, 19, 28, 29], back: [5, 8] },
  { issue: '25126', front: [1, 8, 18, 27, 30], back: [6, 7] },
  { issue: '25125', front: [10, 11, 13, 19, 35], back: [4, 11] },
  { issue: '25124', front: [6, 9, 14, 26, 27], back: [8, 9] },
  { issue: '25123', front: [8, 13, 24, 25, 31], back: [4, 10] },
  { issue: '25122', front: [2, 3, 6, 16, 17], back: [4, 5] },
  { issue: '25121', front: [2, 3, 8, 13, 21], back: [7, 12] },
  { issue: '25120', front: [11, 13, 22, 26, 35], back: [2, 8] },
  { issue: '25119', front: [8, 15, 27, 29, 31], back: [1, 7] },
  { issue: '25118', front: [2, 8, 9, 12, 21], back: [4, 5] },
  { issue: '25117', front: [5, 10, 18, 21, 29], back: [5, 7] },
  { issue: '25116', front: [2, 6, 16, 22, 29], back: [8, 12] },
  { issue: '25115', front: [3, 12, 14, 21, 35], back: [1, 5] },
  { issue: '25114', front: [3, 8, 9, 12, 16], back: [1, 5] },
  { issue: '25113', front: [1, 14, 18, 28, 35], back: [2, 3] },
  { issue: '25112', front: [3, 4, 21, 23, 24], back: [9, 12] },
  { issue: '25111', front: [2, 9, 14, 21, 26], back: [2, 12] },
  { issue: '25110', front: [1, 15, 22, 30, 31], back: [2, 8] },
  { issue: '25109', front: [4, 8, 10, 13, 26], back: [9, 10] },
  { issue: '25108', front: [14, 18, 21, 24, 29], back: [3, 6] },
  { issue: '25107', front: [5, 7, 8, 15, 33], back: [6, 10] },
  { issue: '25106', front: [5, 6, 11, 26, 29], back: [5, 10] },
  { issue: '25105', front: [15, 16, 25, 28, 34], back: [10, 12] },
  { issue: '25104', front: [2, 6, 9, 22, 34], back: [2, 8] },
  { issue: '25103', front: [5, 8, 19, 32, 34], back: [4, 5] },
  { issue: '25102', front: [9, 10, 13, 26, 28], back: [2, 4] },
  { issue: '25101', front: [5, 7, 19, 26, 32], back: [8, 9] },
  { issue: '25100', front: [26, 28, 32, 34, 35], back: [2, 7] },
  { issue: '25099', front: [6, 12, 20, 26, 31], back: [2, 4] },
  { issue: '25098', front: [1, 7, 9, 10, 23], back: [10, 12] },
  { issue: '25097', front: [5, 24, 25, 32, 34], back: [1, 9] },
  { issue: '25096', front: [2, 11, 17, 22, 24], back: [7, 9] },
  { issue: '25095', front: [7, 13, 14, 19, 27], back: [6, 10] },
  { issue: '25094', front: [4, 9, 17, 30, 33], back: [5, 9] },
  { issue: '25093', front: [1, 7, 9, 16, 30], back: [2, 5] },
  { issue: '25092', front: [4, 10, 17, 25, 32], back: [5, 7] },
  { issue: '25091', front: [1, 19, 22, 25, 27], back: [3, 10] },
  { issue: '25090', front: [6, 14, 19, 22, 27], back: [1, 4] },
  { issue: '25089', front: [2, 11, 12, 32, 34], back: [3, 10] },
  { issue: '25088', front: [8, 9, 10, 11, 35], back: [5, 11] },
  { issue: '25087', front: [5, 13, 14, 16, 20], back: [3, 8] },
  { issue: '25086', front: [2, 6, 23, 24, 33], back: [1, 10] },
  { issue: '25085', front: [2, 5, 9, 14, 33], back: [4, 9] },
  { issue: '25084', front: [9, 11, 13, 18, 29], back: [4, 11] },
  { issue: '25083', front: [12, 17, 18, 20, 34], back: [2, 5] },
  { issue: '25082', front: [2, 3, 4, 12, 26], back: [1, 8] },
  { issue: '25081', front: [1, 4, 6, 15, 18], back: [2, 3] },
  { issue: '25080', front: [9, 10, 18, 22, 24], back: [3, 12] },
  { issue: '25079', front: [2, 14, 32, 34, 35], back: [5, 11] },
  { issue: '25078', front: [7, 10, 15, 21, 24], back: [5, 6] },
  { issue: '25077', front: [12, 14, 16, 19, 28], back: [1, 4] },
  { issue: '25076', front: [11, 18, 22, 25, 29], back: [4, 12] },
  { issue: '25075', front: [8, 12, 16, 19, 35], back: [6, 9] },
  { issue: '25074', front: [2, 11, 15, 18, 21], back: [5, 10] }
];

const STORAGE_KEY = 'dlt_history_data';
function getDLTHistory() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) { try { const d = JSON.parse(stored); if (Array.isArray(d) && d.length > 0) return d; } catch (e) { } }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DLT_DEFAULT_DATA));
  return [...DLT_DEFAULT_DATA];
}
function saveDLTHistory(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); updateDataBadge(); }
function updateDataBadge() {
  const data = getDLTHistory();
  const badge = $('#data-count-badge'); if (badge) badge.textContent = `已存 ${data.length} 期`;
  const hdr = $('#header-data-count'); if (hdr) hdr.textContent = `📊 已存 ${data.length} 期数据`;
  const hc = $('#history-count'); if (hc) hc.textContent = data.length;
}

let DLT_HISTORY = getDLTHistory();
function refreshDLTHistory() { DLT_HISTORY = getDLTHistory(); updateDataBadge(); }

function addSingleDraw() {
  const issue = $('#new-issue').value.trim();
  const frontStr = $('#new-front').value.trim();
  const backStr = $('#new-back').value.trim();
  const msgEl = $('#add-draw-msg');
  if (!issue || !frontStr || !backStr) { msgEl.innerHTML = '<span style="color:var(--red)">请填写完整信息</span>'; return; }
  const front = frontStr.split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 35);
  const back = backStr.split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 12);
  if (front.length !== 5) { msgEl.innerHTML = '<span style="color:var(--red)">前区必须是5个号码(1-35)</span>'; return; }
  if (back.length !== 2) { msgEl.innerHTML = '<span style="color:var(--red)">后区必须是2个号码(1-12)</span>'; return; }
  const data = getDLTHistory();
  if (data.some(d => d.issue === issue)) { msgEl.innerHTML = '<span style="color:var(--yellow)">期号已存在</span>'; return; }
  data.unshift({ issue, front: front.sort((a, b) => a - b), back: back.sort((a, b) => a - b) });
  data.sort((a, b) => String(b.issue).localeCompare(String(a.issue)));
  saveDLTHistory(data); refreshDLTHistory(); renderLatestDLT();
  $('#new-issue').value = ''; $('#new-front').value = ''; $('#new-back').value = '';
  msgEl.innerHTML = '<span style="color:var(--green)">✅ 录入成功</span>';
  showToast(`第 ${issue} 期数据已录入`, 'success');
  analyzeHistory();
}

function batchAddDraws() {
  const input = $('#batch-input').value.trim();
  const msgEl = $('#batch-msg');
  if (!input) { msgEl.innerHTML = '<span style="color:var(--red)">请输入数据</span>'; return; }
  const data = getDLTHistory(); let added = 0, errors = 0;
  input.split('\n').forEach(line => {
    line = line.trim(); if (!line) return;
    const parts = line.split('-').map(s => s.trim());
    if (parts.length !== 2) { errors++; return; }
    const left = parts[0].split(/\s+/).map(Number).filter(n => !isNaN(n));
    const right = parts[1].split(/\s+/).map(Number).filter(n => !isNaN(n));
    if (left.length < 6 || right.length < 2) { errors++; return; }
    const issue = String(left[0]);
    const front = left.slice(1, 6).sort((a, b) => a - b);
    const back = right.slice(0, 2).sort((a, b) => a - b);
    if (front.some(n => n < 1 || n > 35) || back.some(n => n < 1 || n > 12)) { errors++; return; }
    if (data.some(d => d.issue === issue)) return;
    data.push({ issue, front, back }); added++;
  });
  data.sort((a, b) => String(b.issue).localeCompare(String(a.issue)));
  saveDLTHistory(data); refreshDLTHistory(); renderLatestDLT();
  msgEl.innerHTML = `<span style="color:var(--green)">✅ 新增 ${added} 期${errors > 0 ? `，${errors} 行格式错误已跳过` : ''}</span>`;
  showToast(`批量录入完成，新增 ${added} 期`, 'success');
  if (added > 0) analyzeHistory();
}

function deleteDraw(issue) {
  const data = getDLTHistory().filter(d => d.issue !== issue);
  saveDLTHistory(data); refreshDLTHistory(); showHistory();
}

function exportData() {
  const data = getDLTHistory();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `大乐透数据_${data.length}期_${new Date().toISOString().slice(0, 10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('数据导出成功', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) { showToast('文件格式错误', 'error'); return; }
      const data = getDLTHistory(); let added = 0;
      imported.forEach(item => {
        if (!item.issue || !item.front || !item.back) return;
        if (data.some(d => d.issue === item.issue)) return;
        data.unshift(item); added++;
      });
      data.sort((a, b) => String(b.issue).localeCompare(String(a.issue)));
      saveDLTHistory(data); refreshDLTHistory();
      showToast(`导入成功！新增 ${added} 期，共 ${data.length} 期数据`, 'success');
      analyzeHistory();
    } catch (err) { showToast('文件解析失败：' + err.message, 'error'); }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm('确定要重置为默认的 25 期真实数据吗？你添加的数据将会丢失。')) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DLT_DEFAULT_DATA));
  refreshDLTHistory(); $('#dlt-analysis').classList.add('hidden');
  showToast('已重置为默认数据', 'info');
}

// ---- Number Grid & Selection ----
function initNumberGrid() {
  const frontZone = $('#front-zone'), backZone = $('#back-zone');
  frontZone.innerHTML = ''; backZone.innerHTML = '';
  for (let i = 1; i <= 35; i++) {
    const ball = document.createElement('div'); ball.className = 'num-ball';
    ball.textContent = String(i).padStart(2, '0'); ball.dataset.num = i; ball.dataset.zone = 'front';
    ball.addEventListener('click', () => toggleBall(ball, 'front'));
    frontZone.appendChild(ball);
  }
  for (let i = 1; i <= 12; i++) {
    const ball = document.createElement('div'); ball.className = 'num-ball';
    ball.textContent = String(i).padStart(2, '0'); ball.dataset.num = i; ball.dataset.zone = 'back';
    ball.addEventListener('click', () => toggleBall(ball, 'back'));
    backZone.appendChild(ball);
  }
}

function toggleBall(ball, zone) { ball.classList.toggle(zone === 'front' ? 'selected-front' : 'selected-back'); }

function getSelectedNums(zone) {
  const cls = zone === 'front' ? 'selected-front' : 'selected-back';
  return Array.from($$(`#${zone}-zone .num-ball.${cls}`)).map(b => parseInt(b.dataset.num)).sort((a, b) => a - b);
}

function clearSelection() {
  $$('.num-ball.selected-front').forEach(b => b.classList.remove('selected-front'));
  $$('.num-ball.selected-back').forEach(b => b.classList.remove('selected-back'));
  showToast('选号已清空', 'info');
}

function randomSelect() {
  clearSelection();
  const frontNums = [], backNums = [];
  while (frontNums.length < 5) { const n = Math.floor(Math.random() * 35) + 1; if (!frontNums.includes(n)) frontNums.push(n); }
  while (backNums.length < 2) { const n = Math.floor(Math.random() * 12) + 1; if (!backNums.includes(n)) backNums.push(n); }
  frontNums.forEach(n => { const ball = $(`#front-zone .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-front'); });
  backNums.forEach(n => { const ball = $(`#back-zone .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-back'); });
  showToast('已随机选取 5+2', 'success');
}

function smartQuickPick() {
  refreshDLTHistory();
  if (DLT_HISTORY.length < 5) { showToast('数据不足，至少需要5期', 'warning'); return; }
  const front = pickFrontForStrategy({ wFreq: 0.3, wMiss: 0.35, wRecent: 0.35 });
  const back = pickBackForStrategy({ wFreq: 0.3, wMiss: 0.35 });
  clearSelection();
  front.forEach(n => { const ball = $(`#front-zone .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-front'); });
  back.forEach(n => { const ball = $(`#back-zone .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-back'); });
  showToast('智能选号完成', 'success');
}

// ---- DLT Bet Calculation ----
function calcDLTBets() {
  const front = getSelectedNums('front'), back = getSelectedNums('back');
  const multiple = parseInt($('#dlt-multiple').value) || 1;
  if (front.length < 5) { showToast('前区至少选择 5 个号码', 'warning'); return; }
  if (back.length < 2) { showToast('后区至少选择 2 个号码', 'warning'); return; }
  const betCount = comb(front.length, 5) * comb(back.length, 2);
  const cost = betCount * 2 * multiple;
  const isSingle = front.length === 5 && back.length === 2;
  const totalCombs = comb(35, 5) * comb(12, 2);
  const winProb = betCount / totalCombs;
  $('#dlt-summary').innerHTML = `
    <div class="result-item"><div class="label">投注方式</div><div class="value neutral">${isSingle ? '单式' : '复式'}</div></div>
    <div class="result-item"><div class="label">前区选号</div><div class="value neutral">${front.length}个</div></div>
    <div class="result-item"><div class="label">后区选号</div><div class="value neutral">${back.length}个</div></div>
    <div class="result-item"><div class="label">总注数</div><div class="value gold">${betCount.toLocaleString()}</div></div>
    <div class="result-item"><div class="label">倍数</div><div class="value neutral">${multiple}</div></div>
    <div class="result-item"><div class="label">投注金额</div><div class="value gold">¥${cost.toLocaleString()}</div></div>
    <div class="result-item"><div class="label">一等奖概率</div><div class="value positive">1/${Math.round(totalCombs / betCount).toLocaleString()}</div></div>`;
  $('#dlt-calc-result').classList.remove('hidden');
  showToast('投注计算完成', 'success');
}

// ---- Period-aware analysis helpers ----
function getAnalysisPeriod() {
  const sel = $('#analysis-period');
  const val = sel ? parseInt(sel.value) : 50;
  return val === 0 ? DLT_HISTORY.length : Math.min(val, DLT_HISTORY.length);
}
function getAnalysisData() {
  refreshDLTHistory();
  return DLT_HISTORY.slice(0, getAnalysisPeriod());
}

// ---- Shared scoring helpers for recommendation & smart pick ----
function computeScores() {
  const data = getAnalysisData();
  const fF = new Array(36).fill(0), bF = new Array(13).fill(0);
  const fM = new Array(36).fill(data.length), bM = new Array(13).fill(data.length);
  const fR = new Array(36).fill(0);
  data.forEach((d, idx) => {
    d.front.forEach(n => { fF[n]++; if (fM[n] === data.length) fM[n] = idx; if (idx < 10) fR[n]++; });
    d.back.forEach(n => { bF[n]++; if (bM[n] === data.length) bM[n] = idx; });
  });
  return { fF, bF, fM, bM, fR, total: data.length, mxFF: Math.max(...fF.slice(1, 36)), mxFM: Math.max(...fM.slice(1, 36)), mxBF: Math.max(...bF.slice(1, 13)), mxBM: Math.max(...bM.slice(1, 13)) };
}
function norm(arr, i, max) { return max > 0 ? arr[i] / max : 0; }

function pickFrontForStrategy(strat) {
  const s = computeScores(), scores = [];
  for (let i = 1; i <= 35; i++) {
    const sc = (strat.wFreq || 0.3) * norm(s.fF, i, s.mxFF) + (strat.wMiss || 0.35) * norm(s.fM, i, s.mxFM) + (strat.wRecent || 0.35) * (s.fR[i] / 10);
    scores.push({ num: i, score: sc + Math.random() * 0.15 });
  }
  scores.sort((a, b) => b.score - a.score);
  const cands = scores.slice(0, 15).map(s => s.num);
  for (let attempt = 0; attempt < 50; attempt++) {
    const shuffled = [...cands].sort(() => Math.random() - 0.5);
    const pick = shuffled.slice(0, 5).sort((a, b) => a - b);
    const sum = pick.reduce((a, b) => a + b, 0);
    const odd = pick.filter(n => n % 2 === 1).length;
    if (sum >= 65 && sum <= 125 && odd >= 2 && odd <= 3 && pick[4] - pick[0] >= 15) return pick;
  }
  return scores.slice(0, 5).map(s => s.num).sort((a, b) => a - b);
}

function pickBackForStrategy(strat) {
  const s = computeScores(), scores = [];
  for (let i = 1; i <= 12; i++) {
    scores.push({ num: i, score: (strat.wFreq || 0.3) * norm(s.bF, i, s.mxBF) + (strat.wMiss || 0.35) * norm(s.bM, i, s.mxBM) + Math.random() * 0.2 });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, 2).map(s => s.num).sort((a, b) => a - b);
}

// =============================================
// Frequency Analysis (period-aware)
// =============================================
function analyzeHistory() {
  const data = getAnalysisData();
  const period = data.length;
  if (period < 3) { showToast('数据不足，至少需要3期', 'warning'); return; }
  const frontFreq = new Array(36).fill(0), backFreq = new Array(13).fill(0);
  const frontMissing = new Array(36).fill(period), backMissing = new Array(13).fill(period);
  data.forEach((draw, idx) => {
    draw.front.forEach(n => { frontFreq[n]++; if (frontMissing[n] === period) frontMissing[n] = idx; });
    draw.back.forEach(n => { backFreq[n]++; if (backMissing[n] === period) backMissing[n] = idx; });
  });

  // Render Analysis Summary
  const allSums = data.map(d => d.front.reduce((a, b) => a + b, 0));
  const avgSum = (allSums.reduce((a, b) => a + b, 0) / period).toFixed(1);
  const topFront = Array.from({ length: 35 }, (_, i) => ({ n: i + 1, f: frontFreq[i + 1] })).sort((a, b) => b.f - a.f);
  const topBack = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, f: backFreq[i + 1] })).sort((a, b) => b.f - a.f);
  const coveredFront = topFront.filter(x => x.f > 0).length;
  const avgOdd = (data.reduce((s, d) => s + d.front.filter(n => n % 2 === 1).length, 0) / period).toFixed(1);
  const dateRange = data.length > 0 ? `${data[data.length - 1].issue} ~ ${data[0].issue}` : '--';

  const summaryEl = $('#analysis-summary-grid');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="result-item"><div class="label">分析期数</div><div class="value gold">${period} 期</div></div>
      <div class="result-item"><div class="label">期号范围</div><div class="value neutral" style="font-size:0.85rem">${dateRange}</div></div>
      <div class="result-item"><div class="label">前区最热</div><div class="value positive">${String(topFront[0].n).padStart(2, '0')} (${topFront[0].f}次)</div></div>
      <div class="result-item"><div class="label">后区最热</div><div class="value positive">${String(topBack[0].n).padStart(2, '0')} (${topBack[0].f}次)</div></div>
      <div class="result-item"><div class="label">平均和值</div><div class="value neutral">${avgSum}</div></div>
      <div class="result-item"><div class="label">平均奇数个数</div><div class="value neutral">${avgOdd}/5</div></div>
      <div class="result-item"><div class="label">前区覆盖率</div><div class="value neutral">${coveredFront}/35 (${(coveredFront / 35 * 100).toFixed(0)}%)</div></div>
      <div class="result-item"><div class="label">前区最冷</div><div class="value negative">${String(topFront[topFront.length - 1].n).padStart(2, '0')} (${topFront[topFront.length - 1].f}次)</div></div>`;
    $('#analysis-stats').classList.remove('hidden');
  }

  // Unhide analysis section BEFORE drawing canvas charts
  // so that getBoundingClientRect() returns correct dimensions
  $('#dlt-analysis').classList.remove('hidden');

  renderHeatmap('heatmap-front', frontFreq, 35, 'front');
  renderHeatmap('heatmap-back', backFreq, 12, 'back');
  renderHotCold(frontFreq, backFreq, period);
  drawMissingChart(frontMissing);
  drawOddEvenChart(); drawSumChart(); renderProbTable();
  generateRecommendations();
  showToast(`基于近 ${period} 期数据分析完成`, 'success');
}

function renderHeatmap(containerId, freq, max, zone) {
  const container = $(`#${containerId}`); container.innerHTML = '';
  const maxFreq = Math.max(...freq.slice(1, max + 1)), minFreq = Math.min(...freq.slice(1, max + 1));
  const range = maxFreq - minFreq || 1;
  for (let i = 1; i <= max; i++) {
    const ball = document.createElement('div'); ball.className = 'num-ball';
    ball.classList.add('heat-' + Math.max(1, Math.ceil(((freq[i] - minFreq) / range) * 5)));
    ball.textContent = String(i).padStart(2, '0'); ball.title = `出现 ${freq[i]} 次`;
    container.appendChild(ball);
  }
}

function renderHotCold(frontFreq, backFreq, period) {
  const total = period || getAnalysisPeriod();
  const all = [];
  for (let i = 1; i <= 35; i++) all.push({ num: i, freq: frontFreq[i], zone: '前区' });
  for (let i = 1; i <= 12; i++) all.push({ num: i, freq: backFreq[i], zone: '后区' });
  const hot = [...all].sort((a, b) => b.freq - a.freq).slice(0, 10);
  const cold = [...all].sort((a, b) => a.freq - b.freq).slice(0, 10);
  const makeTable = (items, color) => {
    let h = '<table class="data-table"><thead><tr><th>#</th><th>号码</th><th>区域</th><th>出现次数</th><th>频率</th></tr></thead><tbody>';
    items.forEach((item, i) => {
      const pct = (item.freq / total * 100).toFixed(1);
      h += `<tr><td>${i + 1}</td><td style="font-weight:700;color:var(--${color})">${String(item.num).padStart(2, '0')}</td><td>${item.zone}</td><td>${item.freq}</td><td><div style="display:flex;align-items:center;gap:0.5rem">${pct}%<div class="stat-bar" style="width:60px"><div class="stat-bar-fill ${color}" style="width:${pct}%"></div></div></div></td></tr>`;
    });
    return h + '</tbody></table>';
  };
  $('#hot-numbers').innerHTML = makeTable(hot, 'red');
  $('#cold-numbers').innerHTML = makeTable(cold, 'blue');
}

function drawMissingChart(missing) {
  const canvas = $('#missing-chart');
  const { ctx, W, H } = setupCanvas(canvas, 300);
  const pad = { top: 30, bottom: 60, left: 30, right: 15 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const maxMiss = Math.max(...missing.slice(1, 36));
  const slotW = cW / 35;
  const barW = Math.max(4, Math.min(16, slotW - 4));
  // Y-axis scale lines
  for (let step = 0; step <= 4; step++) {
    const yLine = pad.top + cH - (step / 4) * cH;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, yLine); ctx.lineTo(W - pad.right, yLine); ctx.stroke();
    ctx.fillStyle = '#5a6478'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxMiss * step / 4), pad.left - 4, yLine + 3);
  }
  for (let i = 1; i <= 35; i++) {
    const x = pad.left + slotW * (i - 1) + (slotW - barW) / 2;
    const barH = Math.max(1, (missing[i] / (maxMiss || 1)) * cH), y = pad.top + cH - barH;
    const ratio = missing[i] / (maxMiss || 1);
    ctx.fillStyle = `rgb(${Math.round(41 + (231 - 41) * ratio)},${Math.round(128 + (76 - 128) * ratio)},${Math.round(185 + (60 - 185) * ratio)})`;
    ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 2); ctx.fill(); ctx.globalAlpha = 1;
    // Label: show every number but rotated
    ctx.save(); ctx.translate(x + barW / 2, H - pad.bottom + 12);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#5a6478'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(String(i).padStart(2, '0'), 0, 0);
    ctx.restore();
    if (missing[i] > 0) { ctx.fillStyle = '#8892a8'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center'; ctx.fillText(missing[i], x + barW / 2, y - 4); }
  }
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left';
  ctx.fillText('前区号码遗漏期数', pad.left + 5, 18);
}

function drawOddEvenChart() {
  const canvas = $('#oddeven-chart');
  const { ctx, W, H } = setupCanvas(canvas, 280);
  const counts = {};
  DLT_HISTORY.forEach(d => { const odd = d.front.filter(n => n % 2 === 1).length; counts[`${odd}:${5 - odd}`] = (counts[`${odd}:${5 - odd}`] || 0) + 1; });
  const keys = Object.keys(counts).sort(), maxCount = Math.max(...Object.values(counts));
  const pad = { top: 35, bottom: 55, left: 35, right: 20 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const slotW = cW / keys.length;
  const barW = Math.max(25, Math.min(55, slotW - 16));
  // Y-axis
  for (let step = 0; step <= 4; step++) {
    const yLine = pad.top + cH - (step / 4) * cH;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, yLine); ctx.lineTo(W - pad.right, yLine); ctx.stroke();
    ctx.fillStyle = '#5a6478'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxCount * step / 4), pad.left - 5, yLine + 3);
  }
  keys.forEach((key, i) => {
    const x = pad.left + slotW * i + (slotW - barW) / 2;
    const barH = Math.max(2, (counts[key] / maxCount) * cH), y = pad.top + cH - barH;
    const grad = ctx.createLinearGradient(x, y, x, y + barH); grad.addColorStop(0, '#9b59b6'); grad.addColorStop(1, '#6c3483');
    ctx.fillStyle = grad; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#8892a8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(key, x + barW / 2, H - pad.bottom + 18); ctx.fillText(counts[key], x + barW / 2, y - 8);
  });
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.fillText('奇偶比分布 (奇:偶)', pad.left + 5, 20);
}

function drawSumChart() {
  const canvas = $('#sum-chart');
  const { ctx, W, H } = setupCanvas(canvas, 280);
  const sums = DLT_HISTORY.map(d => d.front.reduce((a, b) => a + b, 0));
  const ranges = [{ label: '<50', min: 0, max: 50 }, { label: '51~75', min: 51, max: 75 }, { label: '76~100', min: 76, max: 100 }, { label: '101~125', min: 101, max: 125 }, { label: '>125', min: 126, max: 999 }];
  ranges.forEach(r => { r.count = sums.filter(s => s >= r.min && s <= r.max).length; });
  const maxCount = Math.max(...ranges.map(r => r.count));
  const pad = { top: 35, bottom: 60, left: 35, right: 20 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const slotW = cW / ranges.length;
  const barW = Math.max(25, Math.min(55, slotW - 20));
  // Y-axis
  for (let step = 0; step <= 4; step++) {
    const yLine = pad.top + cH - (step / 4) * cH;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, yLine); ctx.lineTo(W - pad.right, yLine); ctx.stroke();
    ctx.fillStyle = '#5a6478'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxCount * step / 4), pad.left - 5, yLine + 3);
  }
  ranges.forEach((r, i) => {
    const x = pad.left + slotW * i + (slotW - barW) / 2;
    const barH = Math.max(2, (r.count / (maxCount || 1)) * cH), y = pad.top + cH - barH;
    const grad = ctx.createLinearGradient(x, y, x, y + barH); grad.addColorStop(0, '#00d2ff'); grad.addColorStop(1, '#0098db');
    ctx.fillStyle = grad; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#8892a8'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    ctx.fillText(r.count, x + barW / 2, y - 8);
    // Rotated label to prevent overlap
    ctx.save(); ctx.translate(x + barW / 2, H - pad.bottom + 14);
    ctx.rotate(-Math.PI / 5.5);
    ctx.fillStyle = '#8892a8'; ctx.font = '9px Inter'; ctx.textAlign = 'right';
    ctx.fillText(r.label, 0, 0);
    ctx.restore();
  });
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.fillText('前区和值分布', pad.left + 5, 20);
}

function renderProbTable() {
  const total = comb(35, 5) * comb(12, 2);
  const prizes = [
    { level: '一等奖', rule: '5+2', prob: 1, prize: '浮动（≥500万）' },
    { level: '二等奖', rule: '5+1', prob: comb(5, 5) * comb(2, 1) * comb(10, 1), prize: '浮动' },
    { level: '三等奖', rule: '5+0', prob: comb(5, 5) * comb(10, 2), prize: '10000元' },
    { level: '四等奖', rule: '4+2', prob: comb(5, 4) * comb(30, 1) * comb(2, 2), prize: '3000元' },
    { level: '五等奖', rule: '4+1', prob: comb(5, 4) * comb(30, 1) * comb(2, 1) * comb(10, 1), prize: '300元' },
    { level: '六等奖', rule: '3+2', prob: comb(5, 3) * comb(30, 2) * comb(2, 2), prize: '200元' },
    { level: '七等奖', rule: '4+0', prob: comb(5, 4) * comb(30, 1) * comb(10, 2), prize: '100元' },
    { level: '八等奖', rule: '3+1/2+2', prob: comb(5, 3) * comb(30, 2) * comb(2, 1) * comb(10, 1) + comb(5, 2) * comb(30, 3) * comb(2, 2), prize: '15元' },
    { level: '九等奖', rule: '3+0/2+1/1+2/0+2', prob: comb(5, 3) * comb(30, 2) * comb(10, 2) + comb(5, 2) * comb(30, 3) * comb(2, 1) * comb(10, 1) + comb(5, 1) * comb(30, 4) * comb(2, 2) + comb(30, 5) * comb(2, 2), prize: '5元' }
  ];
  const tbody = $('#prob-table tbody'); tbody.innerHTML = '';
  prizes.forEach(p => {
    const oneIn = Math.round(total / p.prob);
    const cls = p.level === '一等奖' ? 'level-1' : p.level === '二等奖' ? 'level-2' : p.level === '三等奖' ? 'level-3' : 'level-else';
    tbody.innerHTML += `<tr><td><span class="prize-tag ${cls}">${p.level}</span></td><td>${p.rule}</td><td class="text-mono">${(p.prob / total * 100).toFixed(6)}%</td><td class="text-mono">${oneIn.toLocaleString()}</td><td style="color:var(--gold)">${p.prize}</td></tr>`;
  });
}

function showHistory() {
  refreshDLTHistory();
  const tbody = $('#history-table tbody'); tbody.innerHTML = '';
  DLT_HISTORY.forEach(d => {
    tbody.innerHTML += `<tr><td>${d.issue}</td><td>${d.front.map(n => String(n).padStart(2, '0')).join(' ')}</td><td>${d.back.map(n => String(n).padStart(2, '0')).join(' ')}</td><td><button class="btn btn-ghost btn-sm" style="color:var(--red);padding:0.2rem 0.5rem;font-size:0.7rem" onclick="deleteDraw('${d.issue}')">删除</button></td></tr>`;
  });
  $('#history-modal').classList.remove('hidden');
}

// =============================================
// Recommendation Engine
// =============================================
function generateRecommendations() {
  refreshDLTHistory();
  const container = $('#recommendation-sets');
  if (!container || DLT_HISTORY.length < 5) { if (container) container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">数据不足（需要至少 5 期），请先录入更多数据。</p>'; return; }
  const strategies = [
    { name: '🔥 热号趋势', desc: '偏重近期高频号码', wFreq: 0.5, wMiss: 0.1, wRecent: 0.4 },
    { name: '⚖️ 均衡推荐', desc: '频率+遗漏+趋势综合', wFreq: 0.3, wMiss: 0.35, wRecent: 0.35 },
    { name: '❄️ 冷号回补', desc: '偏重长期遗漏号码', wFreq: 0.1, wMiss: 0.6, wRecent: 0.3 }
  ];
  const makeBall = (n, bg) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${bg};color:#fff;font-weight:700;font-size:0.85rem;margin:0 2px;">${String(n).padStart(2, '0')}</span>`;
  let html = '';
  strategies.forEach(strat => {
    const front = pickFrontForStrategy(strat), back = pickBackForStrategy(strat);
    const sum = front.reduce((a, b) => a + b, 0), odd = front.filter(n => n % 2 === 1).length;
    html += `<div style="padding:0.75rem;background:rgba(10,14,26,0.5);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:0.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><span style="font-weight:700;font-size:0.9rem;">${strat.name}</span><span style="font-size:0.75rem;color:var(--text-muted)">${strat.desc}</span></div>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">${front.map(n => makeBall(n, 'linear-gradient(135deg,#e74c3c,#c0392b)')).join('')}<span style="color:var(--text-muted);font-size:1.1rem;font-weight:300;margin:0 0.25rem;">+</span>${back.map(n => makeBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)')).join('')}</div>
      <div style="display:flex;gap:0.75rem;margin-top:0.4rem;font-size:0.75rem;color:var(--text-secondary);"><span>和值: <strong style="color:var(--cyan)">${sum}</strong></span><span>奇偶: <strong style="color:var(--cyan)">${odd}:${5 - odd}</strong></span><span>跨度: <strong style="color:var(--cyan)">${front[4] - front[0]}</strong></span></div></div>`;
  });
  container.innerHTML = html;
}

// =============================================
// SECTION 2B: 预测存档系统
// =============================================
const PRED_KEY = 'dlt_predictions';
const PERF_KEY = 'dlt_strategy_perf';
function getPredictions() { try { return JSON.parse(localStorage.getItem(PRED_KEY)) || []; } catch { return []; } }
function savePredictions(arr) { localStorage.setItem(PRED_KEY, JSON.stringify(arr)); }
function getStrategyPerf() { try { return JSON.parse(localStorage.getItem(PERF_KEY)) || {}; } catch { return {}; } }
function saveStrategyPerf(p) { localStorage.setItem(PERF_KEY, JSON.stringify(p)); }

const PRED_STRATEGIES = [
  { id: 'hot', name: '🔥 热号趋势', wFreq: 0.5, wMiss: 0.1, wRecent: 0.4 },
  { id: 'cold', name: '❄️ 冷号回补', wFreq: 0.1, wMiss: 0.6, wRecent: 0.3 },
  { id: 'balanced', name: '⚖️ 均衡推荐', wFreq: 0.3, wMiss: 0.35, wRecent: 0.35 },
  { id: 'adaptive', name: '🎯 自适应', wFreq: 0.33, wMiss: 0.33, wRecent: 0.34 },
  { id: 'random', name: '🎲 随机基准', wFreq: 0, wMiss: 0, wRecent: 0 }
];

function getAdaptiveWeights() {
  const perf = getStrategyPerf();
  const ids = ['hot', 'cold', 'balanced'];
  let best = null, bestScore = -1;
  ids.forEach(id => {
    const p = perf[id];
    if (p && p.total >= 3) {
      const score = (p.totalFrontHits / p.total) + (p.totalBackHits / p.total) * 2;
      if (score > bestScore) { bestScore = score; best = id; }
    }
  });
  if (!best) return { wFreq: 0.33, wMiss: 0.33, wRecent: 0.34 };
  const src = PRED_STRATEGIES.find(s => s.id === best);
  return { wFreq: src.wFreq * 0.8 + 0.1, wMiss: src.wMiss * 0.8 + 0.1, wRecent: src.wRecent * 0.8 + 0.1 };
}

function getNextIssue() {
  refreshDLTHistory();
  if (DLT_HISTORY.length === 0) return '00000';
  const latest = String(DLT_HISTORY[0].issue);
  return String(parseInt(latest) + 1);
}

function generatePredictionSet() {
  const btn = $('#btn-generate-pred');
  setButtonLoading(btn, true);
  refreshDLTHistory();
  if (DLT_HISTORY.length < 5) { showToast('数据不足，至少需要5期', 'warning'); setButtonLoading(btn, false); return; }
  const targetIssue = getNextIssue();
  const preds = getPredictions();
  if (preds.find(p => p.targetIssue === targetIssue && !p.compared)) {
    showToast(`第 ${targetIssue} 期预测已存在`, 'warning'); return;
  }
  const predictions = [];
  PRED_STRATEGIES.forEach(strat => {
    let front, back;
    if (strat.id === 'random') {
      const pool = Array.from({ length: 35 }, (_, i) => i + 1);
      front = []; while (front.length < 5) { const r = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; front.push(r); }
      front.sort((a, b) => a - b);
      const bPool = Array.from({ length: 12 }, (_, i) => i + 1);
      back = []; while (back.length < 2) { const r = bPool.splice(Math.floor(Math.random() * bPool.length), 1)[0]; back.push(r); }
      back.sort((a, b) => a - b);
    } else {
      const w = strat.id === 'adaptive' ? getAdaptiveWeights() : strat;
      front = pickFrontForStrategy(w);
      back = pickBackForStrategy(w);
    }
    predictions.push({ strategyId: strat.id, label: strat.name, front, back });
  });
  const record = { targetIssue, createdAt: new Date().toISOString(), predictions, result: null, compared: false, hits: null };
  preds.unshift(record);
  savePredictions(preds);
  renderCurrentPredictions(record);
  renderPredHistory();
  setButtonLoading(btn, false);
  showToast(`第 ${targetIssue} 期预测已生成（5组）`, 'success');
}

function comparePredictions() {
  const cmpBtn = $('#btn-compare-pred');
  setButtonLoading(cmpBtn, true);
  refreshDLTHistory();
  const preds = getPredictions();
  let comparedCount = 0;
  preds.forEach(record => {
    if (record.compared) return;
    const draw = DLT_HISTORY.find(d => String(d.issue) === String(record.targetIssue));
    if (!draw) return;
    record.result = { front: draw.front, back: draw.back };
    record.compared = true;
    record.hits = record.predictions.map(p => {
      const fHits = p.front.filter(n => draw.front.includes(n)).length;
      const bHits = p.back.filter(n => draw.back.includes(n)).length;
      return { frontHits: fHits, backHits: bHits, level: calcHitLevel(fHits, bHits) };
    });
    record.predictions.forEach((p, i) => updateStrategyPerf(p.strategyId, record.hits[i]));
    comparedCount++;
  });
  savePredictions(preds);
  if (comparedCount > 0) {
    showToast(`已对比 ${comparedCount} 期预测`, 'success');
    renderPredHistory();
    renderPerfDashboard();
  } else {
    showToast('暂无可对比的预测（开奖数据尚未更新）', 'info');
  }
  setButtonLoading(cmpBtn, false);
  renderCurrentPredFromStorage();
}

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

function updateStrategyPerf(stratId, hit) {
  const perf = getStrategyPerf();
  if (!perf[stratId]) perf[stratId] = { total: 0, totalFrontHits: 0, totalBackHits: 0, bestFront: 0, bestBack: 0 };
  const p = perf[stratId];
  p.total++; p.totalFrontHits += hit.frontHits; p.totalBackHits += hit.backHits;
  if (hit.frontHits > p.bestFront || (hit.frontHits === p.bestFront && hit.backHits > p.bestBack)) { p.bestFront = hit.frontHits; p.bestBack = hit.backHits; }
  saveStrategyPerf(perf);
}

// ---- Prediction UI Rendering ----
const makePredBall = (n, bg, hit) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${hit ? 'linear-gradient(135deg,#f1c40f,#e67e22)' : bg};color:${hit ? '#000' : '#fff'};font-weight:700;font-size:0.8rem;margin:0 2px;${hit ? 'box-shadow:0 0 8px rgba(241,196,15,0.6);' : ''}">${String(n).padStart(2, '0')}</span>`;

function renderCurrentPredictions(record) {
  const container = $('#prediction-sets');
  const issueEl = $('#pred-target-issue');
  if (!container) return;
  if (!record) { container.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted)">点击「生成预测」为下一期生成 5 组号码</p>'; issueEl.textContent = getNextIssue(); return; }
  issueEl.textContent = record.targetIssue;
  let html = '';
  record.predictions.forEach((p, i) => {
    const hitInfo = record.hits ? record.hits[i] : null;
    const result = record.result;
    html += `<div style="padding:0.5rem;background:rgba(10,14,26,0.3);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:0.4rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
        <span style="font-weight:600;font-size:0.8rem;">${p.label}</span>
        ${hitInfo ? `<span style="font-size:0.75rem;padding:0.15rem 0.5rem;border-radius:9px;background:${hitInfo.level !== '未中奖' ? 'rgba(241,196,15,0.2);color:var(--gold)' : 'rgba(100,100,100,0.2);color:var(--text-muted)'}">${hitInfo.frontHits}+${hitInfo.backHits} ${hitInfo.level}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:0.3rem;flex-wrap:wrap;">
        ${p.front.map(n => makePredBall(n, 'linear-gradient(135deg,#e74c3c,#c0392b)', result ? result.front.includes(n) : false)).join('')}
        <span style="color:var(--text-muted);margin:0 0.15rem;">+</span>
        ${p.back.map(n => makePredBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)', result ? result.back.includes(n) : false)).join('')}
      </div></div>`;
  });
  container.innerHTML = html;
}

function renderCurrentPredFromStorage() {
  const preds = getPredictions();
  const nextIssue = getNextIssue();
  const current = preds.find(p => p.targetIssue === nextIssue) || (preds.length > 0 ? preds[0] : null);
  renderCurrentPredictions(current);
}

function renderPredHistory() {
  const preds = getPredictions();
  const countEl = $('#pred-history-count');
  if (countEl) countEl.textContent = preds.length + ' 期';
  const list = $('#pred-history-list');
  if (!list) return;
  if (preds.length === 0) { list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔮</div><div class="empty-state-title">暂无预测记录</div><div class="empty-state-desc">点击「生成预测」开始你的第一次预测</div></div>'; return; }
  let html = '';
  preds.forEach((record, idx) => {
    const status = record.compared ? '✅ 已对比' : '⏳ 待对比';
    const statusColor = record.compared ? 'var(--green)' : 'var(--yellow)';
    let bestHit = '';
    if (record.hits) {
      const best = record.hits.reduce((a, b) => (a.frontHits + a.backHits) > (b.frontHits + b.backHits) ? a : b);
      bestHit = ` | 最佳: ${best.frontHits}+${best.backHits} ${best.level}`;
    }
    // Build numbers section
    let numsHTML = '';
    if (record.predictions && record.predictions.length > 0) {
      numsHTML = '<div class="pred-nums-panel" id="pred-nums-' + idx + '" style="display:none;margin-top:0.4rem;padding-top:0.4rem;border-top:1px solid rgba(255,255,255,0.04);">';
      record.predictions.forEach((p, pi) => {
        const hitInfo = record.hits ? record.hits[pi] : null;
        const result = record.result;
        numsHTML += `<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:0.3rem;flex-wrap:wrap;">
          <span style="font-size:0.68rem;color:var(--text-muted);min-width:52px;white-space:nowrap;">${p.label || '策略' + (pi + 1)}</span>
          ${p.front.map(n => makePredBall(n, 'linear-gradient(135deg,#e74c3c,#c0392b)', result ? result.front.includes(n) : false)).join('')}
          <span style="color:var(--text-muted);margin:0 1px;font-size:0.7rem;">+</span>
          ${p.back.map(n => makePredBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)', result ? result.back.includes(n) : false)).join('')}
          ${hitInfo ? `<span style="font-size:0.65rem;color:${hitInfo.level !== '未中奖' ? 'var(--gold)' : 'var(--text-muted)'};margin-left:0.3rem;">${hitInfo.frontHits}+${hitInfo.backHits}</span>` : ''}
        </div>`;
      });
      numsHTML += '</div>';
    }
    html += `<div style="padding:0.5rem;background:rgba(10,14,26,0.3);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:0.3rem;font-size:0.8rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span><strong>第 ${record.targetIssue} 期</strong> <span style="color:var(--text-muted);font-size:0.7rem;">${new Date(record.createdAt).toLocaleDateString()}</span></span>
        <span style="display:flex;align-items:center;gap:0.5rem;">
          <span style="color:${statusColor};font-size:0.75rem;">${status}${bestHit}</span>
          ${record.predictions?.length ? `<span style="cursor:pointer;font-size:0.7rem;color:var(--cyan);white-space:nowrap;" onclick="togglePredNums(${idx})">📋 查看号码 ▸</span>` : ''}
        </span>
      </div>
      ${record.result ? `<div style="margin-top:0.3rem;font-size:0.75rem;color:var(--text-secondary);">开奖: ${record.result.front.map(n => String(n).padStart(2, '0')).join(' ')} + ${record.result.back.map(n => String(n).padStart(2, '0')).join(' ')}</div>` : ''}
      ${numsHTML}
    </div>`;
  });
  list.innerHTML = html;
}
function togglePredNums(idx) {
  const panel = document.getElementById('pred-nums-' + idx);
  if (!panel) return;
  const isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? 'block' : 'none';
  // Update toggle text
  const btn = panel.parentElement?.querySelector('[onclick*="togglePredNums"]');
  if (btn) btn.textContent = isHidden ? '📋 收起号码 ▾' : '📋 查看号码 ▸';
}

function renderPerfDashboard() {
  const perf = getStrategyPerf();
  const el = $('#strategy-performance');
  if (!el) return;
  if (Object.keys(perf).length === 0) { el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">暂无策略数据</div><div class="empty-state-desc">生成预测并对比开奖结果后，此处将展示各策略的命中率</div></div>'; return; }
  let html = '<table class="data-table"><thead><tr><th>策略</th><th>预测次数</th><th>平均前区命中</th><th>平均后区命中</th><th>最佳记录</th></tr></thead><tbody>';
  PRED_STRATEGIES.forEach(s => {
    const p = perf[s.id];
    if (!p || p.total === 0) { html += `<tr><td>${s.name}</td><td>0</td><td>-</td><td>-</td><td>-</td></tr>`; return; }
    const avgF = (p.totalFrontHits / p.total).toFixed(1), avgB = (p.totalBackHits / p.total).toFixed(1);
    const fColor = parseFloat(avgF) >= 2 ? 'var(--green)' : parseFloat(avgF) >= 1.5 ? 'var(--yellow)' : 'var(--text-muted)';
    html += `<tr><td>${s.name}</td><td>${p.total}</td><td style="color:${fColor};font-weight:700;">${avgF}/5</td><td style="font-weight:700;">${avgB}/2</td><td style="color:var(--gold)">${p.bestFront}+${p.bestBack}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function initPredictionSystem() {
  renderCurrentPredFromStorage();
  renderPredHistory();
  renderPerfDashboard();
  const issueEl = $('#pred-target-issue');
  if (issueEl) issueEl.textContent = getNextIssue();
}

// Load bot-generated analysis from data/analysis.json (if deployed via GitHub Pages)
async function loadAutoAnalysis() {
  try {
    const resp = await fetch('data/analysis.json', { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data || !data.predictionRecords) return;

    // Sync bot predictions into localStorage
    const localPreds = getPredictions();
    let imported = 0;
    data.predictionRecords.forEach(record => {
      if (!localPreds.find(p => p.targetIssue === record.targetIssue)) {
        localPreds.push(record);
        imported++;
      }
    });
    if (imported > 0) {
      localPreds.sort((a, b) => String(b.targetIssue).localeCompare(String(a.targetIssue)));
      savePredictions(localPreds);
    }

    // Sync strategy performance
    if (data.strategyPerformance) {
      const localPerf = getStrategyPerf();
      Object.entries(data.strategyPerformance).forEach(([id, perf]) => {
        if (!localPerf[id] || perf.total > localPerf[id].total) localPerf[id] = perf;
      });
      saveStrategyPerf(localPerf);
    }

    if (imported > 0) {
      renderPredHistory();
      renderPerfDashboard();
      renderCurrentPredFromStorage();
      console.log(`🤖 导入 ${imported} 期机器人预测`);
    }
  } catch { /* data/analysis.json not available (local dev) */ }
}

// =============================================
// SECTION 3: 中奖查询
// =============================================
function checkDLTPrize() {
  const parse = str => str.trim().split(/[\s,，]+/).map(Number).filter(n => !isNaN(n));
  const winFront = parse($('#win-front').value), winBack = parse($('#win-back').value);
  const myFront = parse($('#my-front').value), myBack = parse($('#my-back').value);
  const isExtra = $('#is-extra').value === '1';
  if (winFront.length !== 5 || winBack.length !== 2) { showToast('开奖号码格式错误：前区5个，后区2个', 'warning'); return; }
  if (myFront.length < 5 || myBack.length < 2) { showToast('你的号码格式错误：前区至少5个，后区至少2个', 'warning'); return; }
  const matchF = myFront.filter(n => winFront.includes(n)).length;
  const matchB = myBack.filter(n => winBack.includes(n)).length;
  let level = '未中奖', prize = 0, extraPrize = 0;
  if (matchF === 5 && matchB === 2) { level = '🥇 一等奖'; prize = 5000000; extraPrize = 8000000; }
  else if (matchF === 5 && matchB === 1) { level = '🥈 二等奖'; prize = 100000; extraPrize = 800000; }
  else if (matchF === 5 && matchB === 0) { level = '🥉 三等奖'; prize = 10000; }
  else if (matchF === 4 && matchB === 2) { level = '四等奖'; prize = 3000; }
  else if (matchF === 4 && matchB === 1) { level = '五等奖'; prize = 300; }
  else if (matchF === 3 && matchB === 2) { level = '六等奖'; prize = 200; }
  else if (matchF === 4 && matchB === 0) { level = '七等奖'; prize = 100; }
  else if ((matchF === 3 && matchB === 1) || (matchF === 2 && matchB === 2)) { level = '八等奖'; prize = 15; }
  else if ((matchF === 3 && matchB === 0) || (matchF === 2 && matchB === 1) || (matchF === 1 && matchB === 2) || (matchF === 0 && matchB === 2)) { level = '九等奖'; prize = 5; }
  const finalPrize = isExtra && extraPrize > 0 ? prize + extraPrize : prize;
  const isWin = level !== '未中奖';
  $('#prize-detail').innerHTML = `<div class="result-grid">
    <div class="result-item"><div class="label">前区匹配</div><div class="value ${isWin ? 'positive' : 'negative'}">${matchF} / 5</div></div>
    <div class="result-item"><div class="label">后区匹配</div><div class="value ${isWin ? 'positive' : 'negative'}">${matchB} / 2</div></div>
    <div class="result-item"><div class="label">中奖等级</div><div class="value ${isWin ? 'gold' : 'negative'}">${level}</div></div>
    <div class="result-item"><div class="label">奖金</div><div class="value ${isWin ? 'gold' : 'negative'}">¥${finalPrize.toLocaleString()}</div></div></div>
    <div style="margin-top:1rem;padding:0.8rem;background:rgba(10,14,26,0.5);border-radius:var(--radius-sm);font-size:0.8rem;color:var(--text-secondary)"><strong>匹配详情：</strong>
    前区 [${myFront.map(n => winFront.includes(n) ? `<span style="color:var(--green);font-weight:700">${String(n).padStart(2, '0')}</span>` : `<span style="color:var(--text-muted)">${String(n).padStart(2, '0')}</span>`).join(' ')}]
    后区 [${myBack.map(n => winBack.includes(n) ? `<span style="color:var(--green);font-weight:700">${String(n).padStart(2, '0')}</span>` : `<span style="color:var(--text-muted)">${String(n).padStart(2, '0')}</span>`).join(' ')}]
    ${isExtra ? ' <span style="color:var(--yellow)">（追加投注）</span>' : ''}</div>`;
  $('#prize-result').classList.remove('hidden');
  showToast(isWin ? `恭喜中奖：${level}` : '很遗憾，未中奖', isWin ? 'success' : 'info');
}

function calcFBPrize() {
  const odds = $('#fb-win-odds').value.trim().split(/[,，\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
  const amount = parseFloat($('#fb-check-amount').value) || 2;
  const multi = parseInt($('#fb-check-multiple').value) || 1;
  if (odds.length === 0) { showToast('请输入中奖赔率', 'warning'); return; }
  const totalOdds = odds.reduce((a, b) => a * b, 1);
  const prize = (amount * totalOdds * multi).toFixed(2), cost = amount * multi, profit = (prize - cost).toFixed(2);
  $('#fb-prize-detail').innerHTML = `
    <div class="result-item"><div class="label">综合赔率</div><div class="value neutral">${totalOdds.toFixed(4)}</div></div>
    <div class="result-item"><div class="label">投注金额</div><div class="value neutral">¥${cost}</div></div>
    <div class="result-item"><div class="label">奖金</div><div class="value gold">¥${parseFloat(prize).toLocaleString()}</div></div>
    <div class="result-item"><div class="label">净利润</div><div class="value ${profit > 0 ? 'positive' : 'negative'}">¥${parseFloat(profit).toLocaleString()}</div></div>`;
  $('#fb-prize-result').classList.remove('hidden');
  showToast('奖金计算完成', 'success');
}

// =============================================
// SECTION 4: 实时数据抓取 & 自动更新
// =============================================
let autoUpdateTimer = null;

async function fetchOfficialData(silent = false) {
  const statusEl = $('#fetch-status'), btn = $('#btn-fetch-official');
  const indicator = $('#realtime-indicator'), indicatorText = $('#realtime-text');
  if (!statusEl || !btn) return;
  btn.disabled = true;
  if (indicator) { indicator.className = 'realtime-status updating'; indicatorText.textContent = '数据抓取中...'; }
  if (!silent) statusEl.innerHTML = '<span style="color:var(--cyan)">⏳ 正在获取最新数据...</span>';

  // Strategy 0: Load from data/history.json (generated by GitHub Actions bot)
  // Strategy 1: huiniao.top free API (no CORS, no geo-restriction)
  // Strategy 2: sporttery.cn official API (may have CORS/geo issues)
  const strategies = [
    {
      name: '本地数据',
      url: 'data/history.json',
      extract: (json) => {
        if (!json || !json.issues || !Array.isArray(json.issues)) return null;
        return json.issues;
      }
    },
    {
      name: '数据源A',
      url: 'https://api.huiniao.top/interface/home/lotteryHistory?type=dlt&page=1&limit=100',
      extract: (json) => {
        if (!json || json.code !== 1 || !json.data || !json.data.data || !json.data.data.list) return null;
        return json.data.data.list.map(d => ({
          issue: d.code,
          front: [d.one, d.two, d.three, d.four, d.five].map(Number).sort((a, b) => a - b),
          back: [d.six, d.seven].map(Number).sort((a, b) => a - b)
        }));
      }
    },
    {
      name: '官网直连',
      url: 'https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=85&provinceId=0&pageSize=100&isVerify=1&pageNo=1',
      extract: (json) => {
        if (!json || !json.value || !json.value.list) return null;
        return json.value.list.map(d => {
          const nums = d.lotteryDrawResult.split(/\s+/).map(Number);
          return { issue: d.lotteryDrawNum, front: nums.slice(0, 5).sort((a, b) => a - b), back: nums.slice(5, 7).sort((a, b) => a - b) };
        });
      }
    }
  ];

  let draws = null, usedName = '';
  for (const s of strategies) {
    try {
      if (!silent) statusEl.innerHTML = `<span style="color:var(--cyan)">⏳ 正在通过${s.name}获取...</span>`;
      const resp = await fetch(s.url, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) continue;
      const json = await resp.json();
      draws = s.extract(json);
      if (draws && draws.length > 0) { usedName = s.name; break; }
      draws = null;
    } catch (e) { console.warn(`${s.name} failed:`, e.message); continue; }
  }

  try {
    if (!draws || draws.length === 0) throw new Error('所有数据源不可用，请检查网络连接后重试');
    const data = getDLTHistory(); let added = 0;
    draws.forEach(draw => {
      if (!draw.issue || !draw.front || !draw.back) return;
      if (draw.front.some(n => isNaN(n) || n < 1 || n > 35)) return;
      if (draw.back.some(n => isNaN(n) || n < 1 || n > 12)) return;
      if (data.some(d => d.issue === draw.issue)) return;
      data.push(draw); added++;
    });
    data.sort((a, b) => String(b.issue).localeCompare(String(a.issue)));
    saveDLTHistory(data); refreshDLTHistory(); renderLatestDLT();
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const hdr = $('#header-last-update'); if (hdr) hdr.textContent = `🕐 ${timeStr} 已更新`;
    statusEl.innerHTML = `<span style="color:var(--green)">✅ 通过${usedName}获取成功！新增 ${added} 期，共 ${data.length} 期数据。${added === 0 ? '（已是最新）' : ''}</span>`;
    if (indicator) { indicator.className = 'realtime-status'; indicatorText.textContent = `${timeStr} 已同步`; }
    if (!silent) showToast(added > 0 ? `成功获取 ${added} 期新数据` : '数据已是最新', 'success');
    if (added > 0) analyzeHistory();
  } catch (err) {
    console.error('Fetch error:', err);
    if (indicator) { indicator.className = 'realtime-status error'; indicatorText.textContent = '同步失败'; }
    statusEl.innerHTML = `<span style="color:var(--yellow)">⚠️ ${err.message}<br>可手动从 <a href="https://www.lottery.gov.cn/kj/kjlb.html?dlt" target="_blank" style="color:var(--cyan);text-decoration:underline">体彩官网</a> 复制数据后使用「批量录入」功能。</span>`;
    if (!silent) showToast('数据获取失败', 'error');
  } finally { btn.disabled = false; }
}

function toggleAutoUpdate() {
  const toggle = $('#auto-update-toggle'), statusEl = $('#auto-update-status'), textEl = $('#auto-update-text');
  if (toggle.checked) {
    fetchOfficialData(true);
    autoUpdateTimer = setInterval(() => fetchOfficialData(true), 30 * 60 * 1000);
    if (statusEl) statusEl.style.display = ''; if (textEl) textEl.textContent = '自动更新运行中';
    showToast('已开启自动更新（每30分钟）', 'success');
  } else {
    if (autoUpdateTimer) { clearInterval(autoUpdateTimer); autoUpdateTimer = null; }
    if (statusEl) statusEl.style.display = 'none';
    showToast('已关闭自动更新', 'info');
  }
}

// =============================================
// SECTION 5: 走势图分析 (Tab 3)
// =============================================
function drawTrendChart() {
  refreshDLTHistory();
  const period = parseInt($('#trend-period').value) || 30;
  const data = DLT_HISTORY.slice(0, Math.min(period, DLT_HISTORY.length)).reverse();
  if (data.length < 2) { showToast('数据不足，至少需要2期', 'warning'); return; }
  const canvas = $('#trend-chart');
  const rows = data.length, cols = 35;
  const cellW = 28, cellH = 22, padL = 60, padT = 30, padB = 10;
  const totalW = padL + cols * cellW + 20, totalH = padT + rows * cellH + padB;
  const { ctx } = setupCanvas(canvas, totalH);
  canvas.parentElement.style.overflowX = 'auto';
  const dpr = window.devicePixelRatio || 1;
  canvas.width = totalW * dpr; canvas.height = totalH * dpr;
  canvas.style.width = totalW + 'px'; canvas.style.height = totalH + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, totalW, totalH);

  // Header
  ctx.fillStyle = '#5a6478'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
  for (let c = 1; c <= cols; c++) ctx.fillText(String(c).padStart(2, '0'), padL + (c - 1) * cellW + cellW / 2, padT - 8);

  // Grid + data
  const positions = []; // store ball positions for connecting lines
  data.forEach((draw, r) => {
    const y = padT + r * cellH;
    // Issue label
    ctx.fillStyle = '#5a6478'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(draw.issue, padL - 8, y + cellH / 2 + 3);
    // Grid line
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.moveTo(padL, y + cellH); ctx.lineTo(padL + cols * cellW, y + cellH); ctx.stroke();
    // Number balls
    draw.front.forEach(n => {
      const cx = padL + (n - 1) * cellW + cellW / 2, cy = y + cellH / 2;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(231,76,60,0.8)'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(String(n).padStart(2, '0'), cx, cy + 3);
      if (!positions[n]) positions[n] = [];
      positions[n].push({ x: cx, y: cy });
    });
  });

  // Connect same numbers across draws
  for (let n = 1; n <= 35; n++) {
    if (positions[n] && positions[n].length > 1) {
      ctx.strokeStyle = `rgba(231,76,60,0.2)`; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
      ctx.beginPath();
      positions[n].forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.stroke(); ctx.setLineDash([]);
    }
  }
  ctx.lineWidth = 1;
  showToast('走势图已更新', 'success');
}

function drawSizeChart() {
  refreshDLTHistory();
  const canvas = $('#size-chart');
  const { ctx, W, H } = setupCanvas(canvas, 200);
  const counts = {};
  DLT_HISTORY.forEach(d => {
    const small = d.front.filter(n => n <= 17).length;
    const key = `${small}:${5 - small}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const keys = Object.keys(counts).sort(), maxCount = Math.max(...Object.values(counts));
  const pad = { top: 30, bottom: 35, left: 40, right: 10 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const barW = Math.min(40, cW / keys.length - 10);
  keys.forEach((key, i) => {
    const x = pad.left + (cW / keys.length) * i + (cW / keys.length - barW) / 2;
    const barH = (counts[key] / maxCount) * cH, y = pad.top + cH - barH;
    const grad = ctx.createLinearGradient(x, y, x, y + barH); grad.addColorStop(0, '#e67e22'); grad.addColorStop(1, '#d35400');
    ctx.fillStyle = grad; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#8892a8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(key, x + barW / 2, H - pad.bottom + 15); ctx.fillText(counts[key], x + barW / 2, y - 5);
  });
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.fillText('大小比分布 (小:大)', pad.left, 18);
}

function drawConsecutiveChart() {
  refreshDLTHistory();
  const canvas = $('#consecutive-chart');
  const { ctx, W, H } = setupCanvas(canvas, 200);
  const counts = { '无连号': 0, '2连号': 0, '3连号': 0, '4+连号': 0 };
  DLT_HISTORY.forEach(d => {
    const sorted = [...d.front].sort((a, b) => a - b);
    let maxConsec = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) { if (sorted[i] === sorted[i - 1] + 1) { cur++; maxConsec = Math.max(maxConsec, cur); } else cur = 1; }
    if (maxConsec >= 4) counts['4+连号']++;
    else if (maxConsec === 3) counts['3连号']++;
    else if (maxConsec === 2) counts['2连号']++;
    else counts['无连号']++;
  });
  const keys = Object.keys(counts), maxCount = Math.max(...Object.values(counts)) || 1;
  const pad = { top: 30, bottom: 35, left: 40, right: 10 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const barW = Math.min(50, cW / keys.length - 10);
  const barColors = ['#27ae60', '#2980b9', '#9b59b6', '#e74c3c'];
  keys.forEach((key, i) => {
    const x = pad.left + (cW / keys.length) * i + (cW / keys.length - barW) / 2;
    const barH = (counts[key] / maxCount) * cH, y = pad.top + cH - barH;
    ctx.fillStyle = barColors[i]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#8892a8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(key, x + barW / 2, H - pad.bottom + 15); ctx.fillText(counts[key], x + barW / 2, y - 5);
  });
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.fillText('连号出现频率', pad.left, 18);
}

function drawZoneChart() {
  refreshDLTHistory();
  const canvas = $('#zone-chart');
  const { ctx, W, H } = setupCanvas(canvas, 220);
  const counts = {};
  DLT_HISTORY.forEach(d => {
    const z1 = d.front.filter(n => n >= 1 && n <= 12).length;
    const z2 = d.front.filter(n => n >= 13 && n <= 23).length;
    const z3 = 5 - z1 - z2;
    const key = `${z1}:${z2}:${z3}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 10);
  const maxCount = Math.max(...keys.map(k => counts[k]));
  const pad = { top: 30, bottom: 40, left: 50, right: 10 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const barW = Math.min(35, cW / keys.length - 6);
  keys.forEach((key, i) => {
    const x = pad.left + (cW / keys.length) * i + (cW / keys.length - barW) / 2;
    const barH = (counts[key] / maxCount) * cH, y = pad.top + cH - barH;
    const grad = ctx.createLinearGradient(x, y, x, y + barH); grad.addColorStop(0, '#00d2ff'); grad.addColorStop(1, '#2980b9');
    ctx.fillStyle = grad; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#8892a8'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    ctx.fillText(key, x + barW / 2, H - pad.bottom + 15); ctx.fillText(counts[key], x + barW / 2, y - 5);
  });
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.fillText('三区比分布 TOP10 (一区:二区:三区)', pad.left, 18);
}

function drawACChart() {
  refreshDLTHistory();
  const canvas = $('#ac-chart');
  const { ctx, W, H } = setupCanvas(canvas, 180);
  const acValues = DLT_HISTORY.slice(0, 30).reverse().map(d => {
    const sorted = [...d.front].sort((a, b) => a - b);
    const diffs = new Set();
    for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) diffs.add(sorted[j] - sorted[i]);
    return { issue: d.issue, ac: diffs.size - 4 };
  });
  const pad = { top: 25, bottom: 35, left: 40, right: 10 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const maxAC = Math.max(...acValues.map(v => v.ac), 10);
  // Line chart
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.beginPath();
  acValues.forEach((v, i) => {
    const x = pad.left + (cW / (acValues.length - 1 || 1)) * i;
    const y = pad.top + cH - (v.ac / maxAC) * cH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Dots
  acValues.forEach((v, i) => {
    const x = pad.left + (cW / (acValues.length - 1 || 1)) * i;
    const y = pad.top + cH - (v.ac / maxAC) * cH;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#ffd700'; ctx.fill();
    if (i % 5 === 0) { ctx.fillStyle = '#5a6478'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center'; ctx.fillText(v.issue.slice(-3), x, H - pad.bottom + 14); }
    ctx.fillStyle = '#8892a8'; ctx.font = '8px Inter'; ctx.fillText(v.ac, x, y - 8);
  });
  ctx.fillStyle = '#8892a8'; ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.fillText('AC值走势（近30期）', pad.left, 16);
}

// =============================================
// Banners
// =============================================
function renderLatestDLT() {
  refreshDLTHistory();
  const el = $('#dlt-latest-content');
  if (!el || DLT_HISTORY.length === 0) return;
  const latest = DLT_HISTORY[0], prev = DLT_HISTORY.length > 1 ? DLT_HISTORY[1] : null;
  const makeBall = (n, bg) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${bg};color:#fff;font-weight:700;font-size:0.85rem;margin:0 2px;">${String(n).padStart(2, '0')}</span>`;
  const sum = latest.front.reduce((a, b) => a + b, 0), odd = latest.front.filter(n => n % 2 === 1).length, span = latest.front[4] - latest.front[0];
  let repeatInfo = '';
  if (prev) {
    const reps = latest.front.filter(n => prev.front.includes(n)).concat(latest.back.filter(n => prev.back.includes(n)));
    if (reps.length > 0) repeatInfo = `<span style="color:var(--yellow);font-size:0.8rem;">🔁 与上期重复: ${reps.map(n => String(n).padStart(2, '0')).join(', ')}</span>`;
  }
  el.innerHTML = `<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.75rem;">
    <span style="font-size:0.85rem;color:var(--text-muted);font-weight:600;">第 ${latest.issue} 期</span>
    <div>${latest.front.map(n => makeBall(n, 'linear-gradient(135deg,#e74c3c,#c0392b)')).join('')}</div>
    <span style="color:var(--text-muted);font-size:1.2rem;font-weight:300;">+</span>
    <div>${latest.back.map(n => makeBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)')).join('')}</div></div>
    <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.8rem;color:var(--text-secondary);">
    <span>📊 和值: <strong style="color:var(--cyan)">${sum}</strong></span>
    <span>⚖️ 奇偶: <strong style="color:var(--cyan)">${odd}:${5 - odd}</strong></span>
    <span>📐 跨度: <strong style="color:var(--cyan)">${span}</strong></span>${repeatInfo}</div>`;
}

function renderFBBanner() {
  const el = $('#fb-latest-content'); if (!el) return;
  const now = new Date();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekday}`;
  el.innerHTML = `<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
    <span style="color:var(--text-muted);">📅 ${dateStr}</span>
    <span style="color:var(--text-secondary);">💡 输入今日竞彩赔率 → 凯利指数 + 期望值自动分析 → 发现价值投注</span></div>
    <div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted);">
    赔率来源：<a href="https://www.sporttery.cn/" target="_blank" style="color:var(--cyan);text-decoration:underline;">中国体彩网</a> ·
    <a href="https://www.500.com/jczq/" target="_blank" style="color:var(--cyan);text-decoration:underline;">500彩票</a> ·
    <a href="https://live.aicai.com/" target="_blank" style="color:var(--cyan);text-decoration:underline;">爱彩网</a></div>`;
}

// =============================================
// Event Bindings
// =============================================
$('#btn-calc-dlt').addEventListener('click', calcDLTBets);
$('#btn-analyze-history').addEventListener('click', analyzeHistory);
$('#btn-show-history').addEventListener('click', showHistory);
$('#btn-close-history').addEventListener('click', () => $('#history-modal').classList.add('hidden'));
$('#btn-check-prize').addEventListener('click', checkDLTPrize);
$('#btn-calc-fb-prize').addEventListener('click', calcFBPrize);
$('#btn-add-draw').addEventListener('click', addSingleDraw);
$('#btn-batch-add').addEventListener('click', () => $('#batch-add-area').classList.toggle('hidden'));
$('#btn-batch-submit').addEventListener('click', batchAddDraws);
$('#btn-batch-cancel').addEventListener('click', () => $('#batch-add-area').classList.add('hidden'));
$('#btn-export-data').addEventListener('click', exportData);
$('#btn-import-data').addEventListener('click', () => $('#file-import').click());
$('#file-import').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
$('#btn-reset-data').addEventListener('click', resetData);
$('#btn-regenerate').addEventListener('click', generateRecommendations);
$('#btn-fetch-official').addEventListener('click', () => fetchOfficialData(false));
$('#auto-update-toggle').addEventListener('change', toggleAutoUpdate);
$('#btn-random-pick').addEventListener('click', randomSelect);
$('#btn-smart-pick').addEventListener('click', smartQuickPick);
$('#btn-clear-pick').addEventListener('click', clearSelection);
$('#btn-quick-3').addEventListener('click', () => {
  let html = '<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.5rem">以下为机选3注：</div>';
  for (let i = 0; i < 3; i++) {
    const f = pickFrontForStrategy({ wFreq: 0.3, wMiss: 0.35, wRecent: 0.35 });
    const b = pickBackForStrategy({ wFreq: 0.3, wMiss: 0.35 });
    const makeBall = (n, bg) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${bg};color:#fff;font-weight:700;font-size:0.8rem;margin:0 1px;">${String(n).padStart(2, '0')}</span>`;
    html += `<div style="margin-bottom:0.4rem">${f.map(n => makeBall(n, 'linear-gradient(135deg,#e74c3c,#c0392b)')).join('')} <span style="color:var(--text-muted)">+</span> ${b.map(n => makeBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)')).join('')}</div>`;
  }
  showToast('机选3注已生成', 'success');
  const modal = document.createElement('div'); modal.className = 'card'; modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;max-width:400px;width:90%;';
  modal.innerHTML = `<div class="card-title flex justify-between"><span>⚡ 机选3注</span><button class="btn btn-ghost btn-sm" onclick="this.closest('.card').remove()">✕</button></div>${html}`;
  document.body.appendChild(modal);
});

// Collapsible panels (P1: with arrow indicators)
initCollapsiblePanel('#toggle-data-panel', '#data-panel-body');
initCollapsiblePanel('#toggle-pred-history', '#pred-history-body');
initCollapsiblePanel('#toggle-perf-panel', '#perf-panel-body');

// Prediction system bindings
$('#btn-generate-pred').addEventListener('click', generatePredictionSet);
$('#btn-compare-pred').addEventListener('click', comparePredictions);
$('#btn-export-pred').addEventListener('click', () => {
  const data = getPredictions();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'dlt_predictions.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('预测数据已导出', 'success');
});
// P2: Custom confirm dialog replaces confirm()
$('#btn-clear-pred').addEventListener('click', async () => {
  const ok = await showConfirmDialog({
    title: '清空预测记录',
    message: '删除后将无法恢复所有历史预测和策略表现数据。',
    confirmText: '清空记录',
    cancelText: '保留',
    danger: true
  });
  if (!ok) return;
  localStorage.removeItem(PRED_KEY); localStorage.removeItem(PERF_KEY);
  renderCurrentPredFromStorage(); renderPredHistory(); renderPerfDashboard();
  showToast('预测记录已清空', 'success');
});

// Trend tab bindings
$('#btn-draw-trend').addEventListener('click', () => {
  drawTrendChart(); drawSizeChart(); drawConsecutiveChart(); drawZoneChart(); drawACChart();
});

// =============================================
// Initialization
// =============================================
// Initialize AOS (Animate On Scroll)
if (typeof AOS !== 'undefined') {
  AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true, offset: 50, delay: 0 });
  // Add data-aos attributes to all cards dynamically
  document.querySelectorAll('.card').forEach((card, i) => {
    if (!card.getAttribute('data-aos')) {
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', String(Math.min(i * 40, 200)));
    }
  });
  // Re-init AOS for dynamically added attributes
  AOS.refresh();
}

// Enhanced tab switch with AOS refresh
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const target = $(`#tab-${tab}`);
    if (target) {
      target.classList.add('active');
      // Re-trigger AOS for newly visible content
      if (typeof AOS !== 'undefined') setTimeout(() => AOS.refresh(), 100);
    }
  });
});
initNumberGrid();
updateDataBadge();
renderLatestDLT();
renderFBBanner();
initPredictionSystem();

// Collapse data panel by default
const dpBody = $('#data-panel-body');
if (dpBody) dpBody.style.display = 'none';

// Auto-run analysis on load if data exists
if (DLT_HISTORY.length >= 5) {
  setTimeout(() => analyzeHistory(), 300);
}

// Auto-fetch on load (silent), then auto-compare predictions, then load bot analysis
setTimeout(() => fetchOfficialData(true).then(() => { comparePredictions(); loadAutoAnalysis(); }).catch(() => loadAutoAnalysis()), 1000);
