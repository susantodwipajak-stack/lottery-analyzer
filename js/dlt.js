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
  const zone1 = $('#front-zone-1'), zone2 = $('#front-zone-2'), zone3 = $('#front-zone-3'), backZone = $('#back-zone');
  if (zone1) zone1.innerHTML = '';
  if (zone2) zone2.innerHTML = '';
  if (zone3) zone3.innerHTML = '';
  if (backZone) backZone.innerHTML = '';
  for (let i = 1; i <= 35; i++) {
    const ball = document.createElement('div'); ball.className = 'num-ball';
    ball.textContent = String(i).padStart(2, '0'); ball.dataset.num = i; ball.dataset.zone = 'front';
    ball.addEventListener('click', () => toggleBall(ball, 'front'));
    if (i <= 12) { if (zone1) zone1.appendChild(ball); }
    else if (i <= 24) { if (zone2) zone2.appendChild(ball); }
    else { if (zone3) zone3.appendChild(ball); }
  }
  for (let i = 1; i <= 12; i++) {
    const ball = document.createElement('div'); ball.className = 'num-ball';
    ball.textContent = String(i).padStart(2, '0'); ball.dataset.num = i; ball.dataset.zone = 'back';
    ball.addEventListener('click', () => toggleBall(ball, 'back'));
    if (backZone) backZone.appendChild(ball);
  }
}

function toggleBall(ball, zone) {
  const betType = $('#dlt-bet-type')?.value || 'single';
  if (betType === 'dantuo') {
    // In dantuo mode: single click = tuo (blue), already-selected click = unselect
    const tuoCls = zone === 'front' ? 'selected-front' : 'selected-back';
    const danCls = zone === 'front' ? 'dan-front' : 'dan-back';
    if (ball.classList.contains(danCls)) {
      // Dan → unselect
      ball.classList.remove(danCls);
    } else if (ball.classList.contains(tuoCls)) {
      // Tuo → Dan (toggle to dan)
      ball.classList.remove(tuoCls);
      ball.classList.add(danCls);
    } else {
      // Unselected → Tuo
      ball.classList.add(tuoCls);
    }
  } else {
    ball.classList.toggle(zone === 'front' ? 'selected-front' : 'selected-back');
  }
}

function getSelectedNums(zone) {
  const cls = zone === 'front' ? 'selected-front' : 'selected-back';
  const selector = zone === 'front' ? '.dlt-zone-grid .num-ball.' + cls : '#back-zone .num-ball.' + cls;
  return Array.from($$(selector)).map(b => parseInt(b.dataset.num)).sort((a, b) => a - b);
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
  frontNums.forEach(n => { const ball = $(`.dlt-zone-grid .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-front'); });
  backNums.forEach(n => { const ball = $(`#back-zone .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-back'); });
  showToast('已随机选取 5+2', 'success');
}

function smartQuickPick() {
  refreshDLTHistory();
  if (DLT_HISTORY.length < 5) { showToast('数据不足，至少需要5期', 'warning'); return; }
  const front = pickFrontForStrategy({ wFreq: 0.3, wMiss: 0.35, wRecent: 0.35 });
  const back = pickBackForStrategy({ wFreq: 0.3, wMiss: 0.35 });
  clearSelection();
  front.forEach(n => { const ball = $(`.dlt-zone-grid .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-front'); });
  back.forEach(n => { const ball = $(`#back-zone .num-ball[data-num="${n}"]`); if (ball) ball.classList.add('selected-back'); });
  showToast('智能选号完成', 'success');
}

// ---- Compound Bet Prize Breakdown (复式每级中奖明细) ----
// Given user selected n front numbers and m back numbers,
// compute how many sub-bets win each prize tier.
// Formula per tier: for each (hitF, hitB) condition:
//   C(winF, hitF) × C(n - winF, 5 - hitF) × C(winB, hitB) × C(m - winB, 2 - hitB)
// where winF=5 (winning front count) and winB=2 (winning back count)
function calcCompoundPrizeBreakdown(nFront, mBack) {
  const TIERS = [
    { level: '一等奖', matches: [[5,2]], low: 5000000, high: 5000000, floating: true },
    { level: '二等奖', matches: [[5,1]], low: 100000, high: 100000, floating: true },
    { level: '三等奖', matches: [[5,0],[4,2]], low: 5000, high: 6666 },
    { level: '四等奖', matches: [[4,1]], low: 300, high: 380 },
    { level: '五等奖', matches: [[4,0],[3,2]], low: 150, high: 200 },
    { level: '六等奖', matches: [[3,1],[2,2]], low: 15, high: 18 },
    { level: '七等奖', matches: [[3,0],[2,1],[1,2],[0,2]], low: 5, high: 7 }
  ];
  const winF = 5, winB = 2; // 中奖号码数
  const result = [];
  let totalHitBets = 0;
  TIERS.forEach(tier => {
    let tierBets = 0;
    tier.matches.forEach(([hf, hb]) => {
      // 前区: 从5个中奖号选hf个 × 从(n-5)个非中奖号选(5-hf)个
      // 后区: 从2个中奖号选hb个 × 从(m-2)个非中奖号选(2-hb)个
      const fHit = comb(winF, hf) * comb(nFront - winF, 5 - hf);
      const bHit = comb(winB, hb) * comb(mBack - winB, 2 - hb);
      tierBets += fHit * bHit;
    });
    totalHitBets += tierBets;
    result.push({ ...tier, bets: tierBets });
  });
  return { tiers: result, totalHitBets };
}

// ---- Dantuo number parsing ----
function getDantuoNums() {
  const danFront = Array.from($$('.dlt-zone-grid .num-ball.dan-front')).map(b => parseInt(b.dataset.num)).sort((a, b) => a - b);
  const tuoFront = Array.from($$('.dlt-zone-grid .num-ball.selected-front')).map(b => parseInt(b.dataset.num)).sort((a, b) => a - b);
  const danBack = Array.from($$('#back-zone .num-ball.dan-back')).map(b => parseInt(b.dataset.num)).sort((a, b) => a - b);
  const tuoBack = Array.from($$('#back-zone .num-ball.selected-back')).map(b => parseInt(b.dataset.num)).sort((a, b) => a - b);
  return { danFront, tuoFront, danBack, tuoBack };
}

// ---- Bet type change handler ----
function onBetTypeChange() {
  const type = $('#dlt-bet-type')?.value || 'single';
  const hint = $('#dlt-bet-hint');
  if (!hint) return;
  if (type === 'single') {
    hint.innerHTML = '💡 单式：前区选 <b>5</b> 个，后区选 <b>2</b> 个';
    hint.style.display = '';
    $$('.num-ball').forEach(b => { b.classList.remove('dan-front', 'dan-back'); });
  } else if (type === 'multi') {
    hint.innerHTML = '💡 复式：前区选 <b>6~20</b> 个，后区选 <b>2~12</b> 个，系统自动展开为多注';
    hint.style.display = '';
    $$('.num-ball').forEach(b => { b.classList.remove('dan-front', 'dan-back'); });
  } else if (type === 'dantuo') {
    hint.innerHTML = '💡 胆拖：<b>单击</b>=拖码(蓝)，<b>双击</b>=胆码(金)。前区胆码1-4个，拖码≥1个';
    hint.style.display = '';
  }
}

// ---- DLT Bet Calculation (official rules, compound/dantuo) ----
function calcDLTBets() {
  const betType = $('#dlt-bet-type')?.value || 'single';
  const multiple = parseInt($('#dlt-multiple').value) || 1;
  const addOn = $('#dlt-addon')?.checked || false;
  
  let betCount, front, back, betTypeLabel, danInfo = '';

  if (betType === 'dantuo') {
    // ---- 胆拖模式 ----
    const { danFront, tuoFront, danBack, tuoBack } = getDantuoNums();
    if (danFront.length < 1) { showToast('胆拖：前区至少选1个胆码（双击选择）', 'warning'); return; }
    if (danFront.length > 4) { showToast('胆拖：前区胆码最多4个', 'warning'); return; }
    if (tuoFront.length < 1) { showToast('胆拖：前区至少选1个拖码', 'warning'); return; }
    if (danFront.length + tuoFront.length < 6) { showToast('胆拖：前区胆码+拖码至少6个', 'warning'); return; }
    const needFrontTuo = 5 - danFront.length;
    if (tuoFront.length < needFrontTuo) { showToast(`胆拖：需要至少${needFrontTuo}个前区拖码`, 'warning'); return; }
    const backTotal = danBack.length + tuoBack.length;
    if (danBack.length > 1) { showToast('胆拖：后区胆码最多1个', 'warning'); return; }
    if (backTotal < 2) { showToast('胆拖：后区至少选2个号码', 'warning'); return; }
    const needBackTuo = 2 - danBack.length;
    if (tuoBack.length < needBackTuo) { showToast(`胆拖：需要至少${needBackTuo}个后区拖码`, 'warning'); return; }

    betCount = comb(tuoFront.length, needFrontTuo) * comb(tuoBack.length, needBackTuo);
    front = [...danFront, ...tuoFront];
    back = [...danBack, ...tuoBack];
    betTypeLabel = '胆拖';
    danInfo = `<div class="result-item"><div class="label">前区胆码</div><div class="value gold">${danFront.map(n => String(n).padStart(2,'0')).join(' ')}</div></div>
    <div class="result-item"><div class="label">前区拖码</div><div class="value cyan">${tuoFront.map(n => String(n).padStart(2,'0')).join(' ')}</div></div>
    <div class="result-item"><div class="label">后区胆码</div><div class="value gold">${danBack.length ? danBack.map(n => String(n).padStart(2,'0')).join(' ') : '无'}</div></div>
    <div class="result-item"><div class="label">后区拖码</div><div class="value cyan">${tuoBack.map(n => String(n).padStart(2,'0')).join(' ')}</div></div>`;
  } else {
    // ---- 单式 / 复式 ----
    front = getSelectedNums('front');
    back = getSelectedNums('back');
    if (front.length < 5) { showToast('前区至少选择 5 个号码', 'warning'); return; }
    if (back.length < 2) { showToast('后区至少选择 2 个号码', 'warning'); return; }
    if (betType === 'single' && (front.length !== 5 || back.length !== 2)) {
      showToast('单式投注：前区必须选5个，后区必须选2个', 'warning'); return;
    }
    betCount = comb(front.length, 5) * comb(back.length, 2);
    betTypeLabel = front.length > 5 && back.length > 2 ? '双区复式' :
                   front.length > 5 ? '前区复式' :
                   back.length > 2 ? '后区复式' : '单式';
  }

  const baseCost = betCount * 2 * multiple;
  const addOnCost = addOn ? betCount * 1 * multiple : 0;
  const totalCost = baseCost + addOnCost;

  // 官方规则第十条: 单张基本投注最大¥20,000, 基本+追加最大¥30,000
  let limitWarning = '';
  if (baseCost > 20000) limitWarning = `⚠️ 基本投注¥${baseCost.toLocaleString()}超出单张限额¥20,000`;
  if (totalCost > 30000) limitWarning = `⚠️ 合计¥${totalCost.toLocaleString()}超出单张限额¥30,000`;

  const totalCombs = comb(35, 5) * comb(12, 2);

  // ---- 复式/胆拖每级中奖明细 ----
  let prizeBreakdownHTML = '';
  let compoundReturnRate = '';
  const isCompound = betCount > 1;
  
  if (isCompound) {
    const nF = front.length, mB = back.length;
    const { tiers, totalHitBets } = calcCompoundPrizeBreakdown(nF, mB);
    const DLT_PRIZES_LOW = { '一等奖': 5000000, '二等奖': 100000, '三等奖': 5000, '四等奖': 300, '五等奖': 150, '六等奖': 15, '七等奖': 5 };
    
    let totalExpectedPrize = 0;
    let breakdownRows = '';
    tiers.forEach(t => {
      if (t.bets === 0) return;
      const prob = (t.bets / totalCombs * 100);
      const probStr = prob < 0.0001 ? prob.toExponential(2) : prob.toFixed(4);
      const prizeLow = DLT_PRIZES_LOW[t.level] || 0;
      const expectedPrize = (t.bets / totalCombs) * prizeLow;
      totalExpectedPrize += expectedPrize;
      breakdownRows += `<tr>
        <td style="font-weight:600">${t.level}</td>
        <td>${t.bets.toLocaleString()} 注</td>
        <td>${probStr}%</td>
        <td>¥${prizeLow.toLocaleString()}</td>
        <td style="color:var(--gold)">¥${expectedPrize.toFixed(2)}</td>
      </tr>`;
    });

    compoundReturnRate = ((totalExpectedPrize / totalCost) * 100).toFixed(2);
    
    prizeBreakdownHTML = `<div style="margin-top:1rem;">
      <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">📊 复式中奖概率明细（共 ${betCount.toLocaleString()} 注）</div>
      <table class="data-table" style="font-size:0.75rem;">
        <thead><tr><th>奖级</th><th>中奖注数</th><th>概率</th><th>单注奖金</th><th>期望奖金</th></tr></thead>
        <tbody>${breakdownRows}</tbody>
        <tfoot><tr style="font-weight:700;border-top:1px solid var(--border);">
          <td colspan="3">合计期望收益</td>
          <td colspan="2" style="color:var(--gold)">¥${totalExpectedPrize.toFixed(2)}</td>
        </tr></tfoot>
      </table>
      <div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-secondary);">
        💰 期望回报率: <span style="color:${parseFloat(compoundReturnRate) > 50 ? 'var(--green)' : 'var(--yellow)'};font-weight:700;">${compoundReturnRate}%</span>
        &nbsp;·&nbsp; 投注成本: ¥${totalCost.toLocaleString()}
        &nbsp;·&nbsp; 注: 一/二等奖按最高金额估算，实际为浮动
      </div>
    </div>`;
  }

  // 单注期望回报率
  const DLT_PRIZES_LOW = [0, 0, 5000, 300, 150, 15, 5]; // 三~七等奖
  const prizeProbs = getDLTPrizeProbs();
  let expectedReturn = 0;
  prizeProbs.forEach((p, i) => {
    if (i >= 2 && DLT_PRIZES_LOW[i]) expectedReturn += (p.prob / totalCombs) * DLT_PRIZES_LOW[i];
  });
  const returnRate = ((expectedReturn / 2) * 100).toFixed(1);

  // ---- Render ----
  $('#dlt-summary').innerHTML = `
    ${danInfo}
    <div class="result-item"><div class="label">投注方式</div><div class="value neutral">${betTypeLabel}</div></div>
    <div class="result-item"><div class="label">前区选号</div><div class="value neutral">${front.length}个</div></div>
    <div class="result-item"><div class="label">后区选号</div><div class="value neutral">${back.length}个</div></div>
    <div class="result-item"><div class="label">总注数</div><div class="value gold">${betCount.toLocaleString()}</div></div>
    <div class="result-item"><div class="label">倍数</div><div class="value neutral">${multiple}</div></div>
    <div class="result-item"><div class="label">基本投注</div><div class="value gold">¥${baseCost.toLocaleString()}</div></div>
    ${addOn ? `<div class="result-item"><div class="label">追加投注</div><div class="value cyan">¥${addOnCost.toLocaleString()}</div></div>` : ''}
    <div class="result-item"><div class="label">合计金额</div><div class="value gold">¥${totalCost.toLocaleString()}</div></div>
    <div class="result-item"><div class="label">一等奖概率</div><div class="value positive">1/${Math.round(totalCombs / betCount).toLocaleString()}</div></div>
    <div class="result-item"><div class="label">单注期望回报</div><div class="value ${parseFloat(returnRate) > 50 ? 'positive' : 'negative'}">${returnRate}%</div></div>
    ${limitWarning ? `<div class="result-item" style="grid-column:1/-1"><div class="value negative" style="font-size:0.8rem">${limitWarning}</div></div>` : ''}`;
  
  // Append compound breakdown after the grid
  const breakdownContainer = document.getElementById('dlt-prize-breakdown');
  if (breakdownContainer) {
    breakdownContainer.innerHTML = prizeBreakdownHTML;
  } else if (prizeBreakdownHTML) {
    // Create container if not exists
    const container = document.createElement('div');
    container.id = 'dlt-prize-breakdown';
    container.innerHTML = prizeBreakdownHTML;
    $('#dlt-summary').parentElement.appendChild(container);
  }

  $('#dlt-calc-result').classList.remove('hidden');
  if (limitWarning) showToast(limitWarning, 'warning');
  else showToast(`${betTypeLabel}计算完成：${betCount.toLocaleString()}注`, 'success');
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
    if (sum >= 65 && sum <= 125 && odd >= 2 && odd <= 3 && pick[4] - pick[0] >= 12) return pick;
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

// ---- Compound Bet Picks (复式推荐: 可配置前N+后M) ----
function pickCompoundFront(strat, count) {
  count = count || 8;
  const s = computeScores(), scores = [];
  for (let i = 1; i <= 35; i++) {
    const sc = (strat.wFreq || 0.3) * norm(s.fF, i, s.mxFF) + (strat.wMiss || 0.35) * norm(s.fM, i, s.mxFM) + (strat.wRecent || 0.35) * (s.fR[i] / 10);
    scores.push({ num: i, score: sc + Math.random() * 0.1 });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, count).map(s => s.num).sort((a, b) => a - b);
}

function pickCompoundBack(strat, count) {
  count = count || 4;
  const s = computeScores(), scores = [];
  for (let i = 1; i <= 12; i++) {
    scores.push({ num: i, score: (strat.wFreq || 0.3) * norm(s.bF, i, s.mxBF) + (strat.wMiss || 0.35) * norm(s.bM, i, s.mxBM) + Math.random() * 0.15 });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, count).map(s => s.num).sort((a, b) => a - b);
}

// ---- Dantuo Picks (胆拖推荐: 自适应) ----
// danCount: 前区胆码数, tuoTotalFront: 前区总号数, backTotal: 后区总号数
function pickDantuoPicks(strat, totalFront, totalBack) {
  totalFront = totalFront || 8;
  totalBack = totalBack || 4;
  const danFCount = Math.min(2, totalFront - 1);
  const tuoFCount = totalFront - danFCount;
  const danBCount = Math.min(1, totalBack - 1);
  const tuoBCount = totalBack - danBCount;
  const s = computeScores(), fScores = [], bScores = [];
  for (let i = 1; i <= 35; i++) {
    const sc = (strat.wFreq || 0.3) * norm(s.fF, i, s.mxFF) + (strat.wMiss || 0.35) * norm(s.fM, i, s.mxFM) + (strat.wRecent || 0.35) * (s.fR[i] / 10);
    fScores.push({ num: i, score: sc });
  }
  for (let i = 1; i <= 12; i++) {
    bScores.push({ num: i, score: (strat.wFreq || 0.3) * norm(s.bF, i, s.mxBF) + (strat.wMiss || 0.35) * norm(s.bM, i, s.mxBM) });
  }
  fScores.sort((a, b) => b.score - a.score);
  bScores.sort((a, b) => b.score - a.score);
  return {
    danF: fScores.slice(0, danFCount).map(s => s.num).sort((a, b) => a - b),
    tuoF: fScores.slice(danFCount, danFCount + tuoFCount).map(s => s.num).sort((a, b) => a - b),
    danB: bScores.slice(0, danBCount).map(s => s.num),
    tuoB: bScores.slice(danBCount, danBCount + tuoBCount).map(s => s.num).sort((a, b) => a - b)
  };
}

// ---- Compound Config & Preview ----
function getCompoundConfig() {
  const f = parseInt($('#comp-front-size')?.value) || 8;
  const b = parseInt($('#comp-back-size')?.value) || 4;
  return { front: Math.max(6, Math.min(f, 20)), back: Math.max(2, Math.min(b, 12)) };
}

function updateCompCostPreview() {
  const { front, back } = getCompoundConfig();
  const bets = comb(front, 5) * comb(back, 2);
  const cost = bets * 2;
  const el = $('#comp-cost-preview');
  if (el) el.textContent = `${bets.toLocaleString()}注 ¥${cost.toLocaleString()}`;
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

// 官方7级奖金概率数据 (依据 lottery.gov.cn 规则)
function getDLTPrizeProbs() {
  return [
    { level: '一等奖', rule: '5+2', prob: 1 },
    { level: '二等奖', rule: '5+1', prob: comb(5, 5) * comb(2, 1) * comb(10, 1) },
    { level: '三等奖', rule: '5+0 / 4+2', prob: comb(5, 5) * comb(10, 2) + comb(5, 4) * comb(30, 1) * comb(2, 2) },
    { level: '四等奖', rule: '4+1', prob: comb(5, 4) * comb(30, 1) * comb(2, 1) * comb(10, 1) },
    { level: '五等奖', rule: '4+0 / 3+2', prob: comb(5, 4) * comb(30, 1) * comb(10, 2) + comb(5, 3) * comb(30, 2) * comb(2, 2) },
    { level: '六等奖', rule: '3+1 / 2+2', prob: comb(5, 3) * comb(30, 2) * comb(2, 1) * comb(10, 1) + comb(5, 2) * comb(30, 3) * comb(2, 2) },
    { level: '七等奖', rule: '3+0/2+1/1+2/0+2', prob: comb(5, 3) * comb(30, 2) * comb(10, 2) + comb(5, 2) * comb(30, 3) * comb(2, 1) * comb(10, 1) + comb(5, 1) * comb(30, 4) * comb(2, 2) + comb(30, 5) * comb(2, 2) }
  ];
}

function renderProbTable() {
  const total = comb(35, 5) * comb(12, 2);
  const prizes = getDLTPrizeProbs();
  // 奖金分两档：奖池<8亿 / ≥8亿
  const prizeAmounts = [
    { low: '浮动（最高500万）', high: '浮动（最高500万）' },
    { low: '浮动', high: '浮动' },
    { low: '5,000元', high: '6,666元' },
    { low: '300元', high: '380元' },
    { low: '150元', high: '200元' },
    { low: '15元', high: '18元' },
    { low: '5元', high: '7元' }
  ];
  const tbody = $('#prob-table tbody'); tbody.innerHTML = '';
  // Update table header to show two prize columns
  const thead = $('#prob-table thead');
  if (thead) thead.innerHTML = '<tr><th>奖级</th><th>中奖条件</th><th>概率</th><th>约几注中1注</th><th>奖金(池<8亿)</th><th>奖金(池≥8亿)</th><th>追加(80%)</th></tr>';
  prizes.forEach((p, i) => {
    const oneIn = Math.round(total / p.prob);
    const cls = p.level === '一等奖' ? 'level-1' : p.level === '二等奖' ? 'level-2' : p.level === '三等奖' ? 'level-3' : 'level-else';
    const amt = prizeAmounts[i];
    const addOnNote = i <= 1 ? '浮动×80%' : '—';
    tbody.innerHTML += `<tr><td><span class="prize-tag ${cls}">${p.level}</span></td><td>${p.rule}</td><td class="text-mono">${(p.prob / total * 100).toFixed(6)}%</td><td class="text-mono">${oneIn.toLocaleString()}</td><td style="color:var(--gold)">${amt.low}</td><td style="color:var(--cyan)">${amt.high}</td><td style="color:var(--text-muted);font-size:0.75rem">${addOnNote}</td></tr>`;
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
    { name: '🎯 首推·自适应', desc: '回测排名#1 前区+26%', wFreq: 0.4, wMiss: 0.15, wRecent: 0.25 },
    { name: '📊 模式匹配', desc: '回测排名#2 区间+尾数', wFreq: 0.2, wMiss: 0.15, wRecent: 0.25 },
    { name: '🔥 热号趋势', desc: '偏重近期高频号码', wFreq: 0.5, wMiss: 0.1, wRecent: 0.4 }
  ];
  const makeBall = (n, bg) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${bg};color:#fff;font-weight:700;font-size:0.85rem;margin:0 2px;">${String(n).padStart(2, '0')}</span>`;
  let html = '';
  const allSets = [];
  strategies.forEach(strat => {
    const front = pickFrontForStrategy(strat), back = pickBackForStrategy(strat);
    allSets.push({ front, back });
    const sum = front.reduce((a, b) => a + b, 0), odd = front.filter(n => n % 2 === 1).length;
    const numStr = front.map(n => String(n).padStart(2,'0')).join(' ') + ' + ' + back.map(n => String(n).padStart(2,'0')).join(' ');
    html += `<div style="padding:0.75rem;background:rgba(10,14,26,0.5);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:0.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><span style="font-weight:700;font-size:0.9rem;">${strat.name}</span><span style="font-size:0.75rem;color:var(--text-muted)">${strat.desc}</span></div>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">${front.map(n => makeBall(n, 'linear-gradient(135deg,#e74c3c,#c0392b)')).join('')}<span style="color:var(--text-muted);font-size:1.1rem;font-weight:300;margin:0 0.25rem;">+</span>${back.map(n => makeBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)')).join('')}<button class="btn-copy-num" onclick="copyNumbers('${numStr}',this)" title="复制号码">📋</button></div>
      <div style="display:flex;gap:0.75rem;margin-top:0.4rem;font-size:0.75rem;color:var(--text-secondary);"><span>和值: <strong style="color:var(--cyan)">${sum}</strong></span><span>奇偶: <strong style="color:var(--cyan)">${odd}:${5 - odd}</strong></span><span>跨度: <strong style="color:var(--cyan)">${front[4] - front[0]}</strong></span></div></div>`;
  });
  // Copy-all button
  const allText = allSets.map(s => s.front.map(n => String(n).padStart(2,'0')).join(' ') + ' + ' + s.back.map(n => String(n).padStart(2,'0')).join(' ')).join('\n');
  html += `<button class="btn-copy-all" onclick="copyNumbers('${allText.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',this)">📋 一键复制全部推荐</button>`;
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

// V3 (回测优化): 按82期回测排名 adaptive>pattern>hot>balanced>cold
const PRED_STRATEGIES = [
  { id: 'adaptive', name: '🎯 首推·自适应', wFreq: 0.40, wMiss: 0.15, wRecent: 0.25, wZone: 0.10, wTail: 0.10 },
  { id: 'pattern', name: '📊 模式匹配', wFreq: 0.20, wMiss: 0.15, wRecent: 0.25, wZone: 0.15, wTail: 0.25 },
  { id: 'hot', name: '🔥 热号趋势', wFreq: 0.55, wMiss: 0.05, wRecent: 0.30, wZone: 0.05, wTail: 0.05 },
  { id: 'balanced', name: '⚖️ 均衡推荐', wFreq: 0.30, wMiss: 0.25, wRecent: 0.25, wZone: 0.10, wTail: 0.10 },
  { id: 'random', name: '🎲 随机基准', wFreq: 0, wMiss: 0, wRecent: 0 }
];

function getAdaptiveWeights() {
  const perf = getStrategyPerf();
  const ids = ['pattern', 'hot', 'balanced'];
  let best = null, bestScore = -1;
  ids.forEach(id => {
    const p = perf[id];
    if (p && p.total >= 3) {
      const score = (p.totalFrontHits / p.total) + (p.totalBackHits / p.total) * 2;
      if (score > bestScore) { bestScore = score; best = id; }
    }
  });
  if (!best) return { wFreq: 0.33, wMiss: 0.20, wRecent: 0.27, wZone: 0.10, wTail: 0.10 };
  const src = PRED_STRATEGIES.find(s => s.id === best);
  // Bug#8 fix: blend then normalize to sum=1
  const raw = { wFreq: src.wFreq * 0.8 + 0.05, wMiss: src.wMiss * 0.8 + 0.05, wRecent: (src.wRecent || 0.25) * 0.8 + 0.05 };
  const total = raw.wFreq + raw.wMiss + raw.wRecent;
  return { wFreq: raw.wFreq / total, wMiss: raw.wMiss / total, wRecent: raw.wRecent / total };
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
    showToast(`第 ${targetIssue} 期预测已存在`, 'warning'); setButtonLoading(btn, false); return;
  }
  const predictions = [];
  PRED_STRATEGIES.forEach(strat => {
    let front, back, compound, dantuo;
    if (strat.id === 'random') {
      const pool = Array.from({ length: 35 }, (_, i) => i + 1);
      front = []; while (front.length < 5) { const r = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; front.push(r); }
      front.sort((a, b) => a - b);
      const bPool = Array.from({ length: 12 }, (_, i) => i + 1);
      back = []; while (back.length < 2) { const r = bPool.splice(Math.floor(Math.random() * bPool.length), 1)[0]; back.push(r); }
      back.sort((a, b) => a - b);
      // Random compound (configurable size)
      const cc = getCompoundConfig();
      const rPool2 = Array.from({ length: 35 }, (_, i) => i + 1);
      const cF = []; while (cF.length < cc.front) { cF.push(rPool2.splice(Math.floor(Math.random() * rPool2.length), 1)[0]); }
      cF.sort((a, b) => a - b);
      const rBPool2 = Array.from({ length: 12 }, (_, i) => i + 1);
      const cB = []; while (cB.length < cc.back) { cB.push(rBPool2.splice(Math.floor(Math.random() * rBPool2.length), 1)[0]); }
      cB.sort((a, b) => a - b);
      compound = { front: cF, back: cB };
      const danFc = Math.min(2, cc.front - 1), danBc = Math.min(1, cc.back - 1);
      dantuo = { danF: cF.slice(0, danFc), tuoF: cF.slice(danFc), danB: cB.slice(0, danBc), tuoB: cB.slice(danBc) };
    } else {
      const w = strat.id === 'adaptive' ? getAdaptiveWeights() : strat;
      const cc = getCompoundConfig();
      front = pickFrontForStrategy(w);
      back = pickBackForStrategy(w);
      compound = { front: pickCompoundFront(w, cc.front), back: pickCompoundBack(w, cc.back) };
      dantuo = pickDantuoPicks(w, cc.front, cc.back);
    }
    predictions.push({ strategyId: strat.id, label: strat.name, front, back, compound, dantuo });
  });
  const record = { targetIssue, createdAt: new Date().toISOString(), predictions, result: null, compared: false, hits: null };
  preds.unshift(record);
  savePredictions(preds);
  renderCurrentPredictions(record);
  renderPredHistory();
  setButtonLoading(btn, false);
  showToast(`第 ${targetIssue} 期预测已生成（5组×3种投注方式）`, 'success');
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
      const hit = { frontHits: fHits, backHits: bHits, level: calcHitLevel(fHits, bHits) };
      // Compound hit analysis
      if (p.compound) {
        const cFHits = p.compound.front.filter(n => draw.front.includes(n)).length;
        const cBHits = p.compound.back.filter(n => draw.back.includes(n)).length;
        const totalBets = comb(p.compound.front.length, 5) * comb(p.compound.back.length, 2);
        // Find best sub-bet level
        let bestLevel = '未中奖', winBets = 0;
        if (cFHits >= 0 && cBHits >= 0) {
          // Compute actual wins based on how many winning numbers are in our compound set
          const TIER_MATCHES = [
            [[5,2]], [[5,1]], [[5,0],[4,2]], [[4,1]], [[4,0],[3,2]], [[3,1],[2,2]], [[3,0],[2,1],[1,2],[0,2]]
          ];
          const TIER_NAMES = ['一等奖','二等奖','三等奖','四等奖','五等奖','六等奖','七等奖'];
          for (let t = 0; t < TIER_MATCHES.length; t++) {
            let tierWins = 0;
            TIER_MATCHES[t].forEach(([hf, hb]) => {
              if (hf <= cFHits && hb <= cBHits) {
                tierWins += comb(cFHits, hf) * comb(p.compound.front.length - cFHits, 5 - hf) * comb(cBHits, hb) * comb(p.compound.back.length - cBHits, 2 - hb);
              }
            });
            if (tierWins > 0 && bestLevel === '未中奖') bestLevel = TIER_NAMES[t];
            winBets += tierWins;
          }
        }
        hit.compound = { frontHits: cFHits, backHits: cBHits, bestLevel, winBets, totalBets };
      }
      // Dantuo hit analysis
      if (p.dantuo) {
        const danFHits = p.dantuo.danF.filter(n => draw.front.includes(n)).length;
        const tuoFHits = p.dantuo.tuoF.filter(n => draw.front.includes(n)).length;
        const danBHits = p.dantuo.danB.filter(n => draw.back.includes(n)).length;
        const tuoBHits = p.dantuo.tuoB.filter(n => draw.back.includes(n)).length;
        const allDanOk = danFHits === p.dantuo.danF.length && danBHits === p.dantuo.danB.length;
        let dtBestLevel = '未中奖';
        if (allDanOk) {
          // When all dan hit, check best possible sub-bet
          const maxF = danFHits + tuoFHits, maxB = danBHits + tuoBHits;
          dtBestLevel = calcHitLevel(Math.min(maxF, 5), Math.min(maxB, 2));
        }
        hit.dantuo = { danFHits, tuoFHits, danBHits, tuoBHits, allDanOk, bestLevel: dtBestLevel };
      }
      return hit;
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

// 官方7级中奖判定 (依据 lottery.gov.cn 规则)
function calcHitLevel(fHits, bHits) {
  if (fHits === 5 && bHits === 2) return '一等奖';
  if (fHits === 5 && bHits === 1) return '二等奖';
  if ((fHits === 5 && bHits === 0) || (fHits === 4 && bHits === 2)) return '三等奖';
  if (fHits === 4 && bHits === 1) return '四等奖';
  if ((fHits === 4 && bHits === 0) || (fHits === 3 && bHits === 2)) return '五等奖';
  if ((fHits === 3 && bHits === 1) || (fHits === 2 && bHits === 2)) return '六等奖';
  if ((fHits === 3 && bHits === 0) || (fHits === 2 && bHits === 1) || (fHits === 1 && bHits === 2) || (fHits === 0 && bHits === 2)) return '七等奖';
  return '未中奖';
}

function updateStrategyPerf(stratId, hit) {
  const perf = getStrategyPerf();
  if (!perf[stratId]) perf[stratId] = { total: 0, totalFrontHits: 0, totalBackHits: 0, bestFront: 0, bestBack: 0, compBestLevel: '未中奖', compTotalWins: 0, dtBestLevel: '未中奖' };
  const p = perf[stratId];
  // Bug#4 fix: decay old data before accumulating new
  p.totalFrontHits *= 0.95; p.totalBackHits *= 0.95; p.total = p.total * 0.95 + 1;
  p.totalFrontHits += hit.frontHits; p.totalBackHits += hit.backHits;
  if (hit.frontHits > p.bestFront || (hit.frontHits === p.bestFront && hit.backHits > p.bestBack)) { p.bestFront = hit.frontHits; p.bestBack = hit.backHits; }
  // Track compound performance
  if (hit.compound) {
    p.compTotalWins = (p.compTotalWins || 0) + (hit.compound.winBets || 0);
    const LEVEL_RANK = { '一等奖':7,'二等奖':6,'三等奖':5,'四等奖':4,'五等奖':3,'六等奖':2,'七等奖':1,'未中奖':0 };
    if ((LEVEL_RANK[hit.compound.bestLevel] || 0) > (LEVEL_RANK[p.compBestLevel] || 0)) p.compBestLevel = hit.compound.bestLevel;
  }
  // Track dantuo performance
  if (hit.dantuo) {
    const LEVEL_RANK = { '一等奖':7,'二等奖':6,'三等奖':5,'四等奖':4,'五等奖':3,'六等奖':2,'七等奖':1,'未中奖':0 };
    if ((LEVEL_RANK[hit.dantuo.bestLevel] || 0) > (LEVEL_RANK[p.dtBestLevel] || 0)) p.dtBestLevel = hit.dantuo.bestLevel;
  }
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
    // Compound display helpers
    const makeMiniPredBall = (n, bg, hit) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${hit ? 'linear-gradient(135deg,#f1c40f,#e67e22)' : bg};color:${hit ? '#000' : '#fff'};font-weight:600;font-size:0.65rem;margin:0 1px;${hit ? 'box-shadow:0 0 6px rgba(241,196,15,0.5);' : ''}">${String(n).padStart(2, '0')}</span>`;
    const danBall = (n, hit) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${hit ? 'linear-gradient(135deg,#f1c40f,#e67e22)' : 'linear-gradient(135deg,#f39c12,#e67e22)'};color:#fff;font-weight:700;font-size:0.65rem;margin:0 1px;border:1.5px solid #f39c12;${hit ? 'box-shadow:0 0 8px rgba(241,196,15,0.6);' : ''}">${String(n).padStart(2, '0')}</span>`;
    // Compound hit badge
    let compHitBadge = '';
    if (hitInfo?.compound) {
      const ch = hitInfo.compound;
      compHitBadge = `<span style="font-size:0.65rem;padding:0.1rem 0.4rem;border-radius:6px;background:${ch.bestLevel !== '未中奖' ? 'rgba(155,89,182,0.2);color:#9b59b6' : 'rgba(100,100,100,0.15);color:var(--text-muted)'}">${ch.frontHits}+${ch.backHits} ${ch.winBets > 0 ? ch.winBets + '注中奖 ' : ''}${ch.bestLevel}</span>`;
    }
    // Dantuo hit badge
    let dtHitBadge = '';
    if (hitInfo?.dantuo) {
      const dt = hitInfo.dantuo;
      dtHitBadge = `<span style="font-size:0.65rem;padding:0.1rem 0.4rem;border-radius:6px;background:${dt.bestLevel !== '未中奖' ? 'rgba(243,156,18,0.2);color:#f39c12' : 'rgba(100,100,100,0.15);color:var(--text-muted)'}">${dt.allDanOk ? '✅胆全中' : '❌胆未全中'} ${dt.bestLevel}</span>`;
    }
    html += `<div style="padding:0.5rem;background:rgba(10,14,26,0.3);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:0.4rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
        <span style="font-weight:600;font-size:0.8rem;">${p.label}</span>
        ${hitInfo ? `<span style="font-size:0.75rem;padding:0.15rem 0.5rem;border-radius:9px;background:${hitInfo.level !== '未中奖' ? 'rgba(241,196,15,0.2);color:var(--gold)' : 'rgba(100,100,100,0.2);color:var(--text-muted)'}">${hitInfo.frontHits}+${hitInfo.backHits} ${hitInfo.level}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.3rem;">
        <span style="font-size:0.6rem;color:var(--text-muted);min-width:2.5rem;">单式</span>
        ${p.front.map(n => makePredBall(n, 'linear-gradient(135deg,#e74c3c,#c0392b)', result ? result.front.includes(n) : false)).join('')}
        <span style="color:var(--text-muted);margin:0 0.15rem;">+</span>
        ${p.back.map(n => makePredBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)', result ? result.back.includes(n) : false)).join('')}
      </div>
      ${p.compound ? `<div style="display:flex;align-items:center;gap:0.2rem;flex-wrap:wrap;margin-bottom:0.2rem;">
        <span style="font-size:0.6rem;color:var(--text-muted);min-width:2.5rem;">复式</span>
        ${p.compound.front.map(n => makeMiniPredBall(n, 'linear-gradient(135deg,#9b59b6,#8e44ad)', result ? result.front.includes(n) : false)).join('')}
        <span style="color:var(--text-muted);font-size:0.7rem;">+</span>
        ${p.compound.back.map(n => makeMiniPredBall(n, 'linear-gradient(135deg,#2c3e50,#34495e)', result ? result.back.includes(n) : false)).join('')}
        ${compHitBadge}
      </div>` : ''}
      ${p.dantuo ? `<div style="display:flex;align-items:center;gap:0.2rem;flex-wrap:wrap;">
        <span style="font-size:0.6rem;color:var(--text-muted);min-width:2.5rem;">胆拖</span>
        ${p.dantuo.danF.map(n => danBall(n, result ? result.front.includes(n) : false)).join('')}
        <span style="color:var(--text-muted);font-size:0.55rem;">胆</span>
        ${p.dantuo.tuoF.map(n => makeMiniPredBall(n, 'linear-gradient(135deg,#2980b9,#1a5276)', result ? result.front.includes(n) : false)).join('')}
        <span style="color:var(--text-muted);font-size:0.7rem;">+</span>
        ${p.dantuo.danB.map(n => danBall(n, result ? result.back.includes(n) : false)).join('')}
        <span style="color:var(--text-muted);font-size:0.55rem;">胆</span>
        ${p.dantuo.tuoB.map(n => makeMiniPredBall(n, 'linear-gradient(135deg,#2c3e50,#34495e)', result ? result.back.includes(n) : false)).join('')}
        ${dtHitBadge}
      </div>` : ''}
    </div>`;
  });
  container.innerHTML = html;
}

// Backfill compound/dantuo for old predictions that lack them
function backfillCompoundDantuo(record) {
  if (!record || !record.predictions) return;
  const cc = getCompoundConfig();
  record.predictions.forEach(p => {
    if (!p.compound) {
      // Generate compound from single-bet numbers + nearby scored nums
      const pool = Array.from({ length: 35 }, (_, i) => i + 1);
      // Prioritize numbers in the single bet, then fill with adjacent nums
      const frontSet = new Set(p.front);
      pool.sort((a, b) => {
        const aIn = frontSet.has(a) ? 0 : 1;
        const bIn = frontSet.has(b) ? 0 : 1;
        if (aIn !== bIn) return aIn - bIn;
        // Prefer numbers close to selected ones
        const aDist = Math.min(...p.front.map(f => Math.abs(a - f)));
        const bDist = Math.min(...p.front.map(f => Math.abs(b - f)));
        return aDist - bDist;
      });
      const cFront = pool.slice(0, cc.front).sort((a, b) => a - b);
      const bPool = Array.from({ length: 12 }, (_, i) => i + 1);
      const backSet = new Set(p.back);
      bPool.sort((a, b) => {
        const aIn = backSet.has(a) ? 0 : 1;
        const bIn = backSet.has(b) ? 0 : 1;
        return aIn - bIn || Math.abs(a - 6) - Math.abs(b - 6);
      });
      const cBack = bPool.slice(0, cc.back).sort((a, b) => a - b);
      p.compound = { front: cFront, back: cBack };
    }
    if (!p.dantuo) {
      const src = p.compound || { front: p.front, back: p.back };
      const danFc = Math.min(2, src.front.length - 1);
      const danBc = Math.min(1, src.back.length - 1);
      p.dantuo = {
        danF: src.front.slice(0, danFc),
        tuoF: src.front.slice(danFc),
        danB: src.back.slice(0, danBc),
        tuoB: src.back.slice(danBc)
      };
    }
  });
}

function renderCurrentPredFromStorage() {
  const preds = getPredictions();
  const nextIssue = getNextIssue();
  const current = preds.find(p => p.targetIssue === nextIssue) || (preds.length > 0 ? preds[0] : null);
  if (current) backfillCompoundDantuo(current);
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
  let html = '<table class="data-table"><thead><tr><th>策略</th><th>预测次数</th><th>平均前区</th><th>平均后区</th><th>单式最佳</th><th>复式最佳</th><th>胆拖最佳</th></tr></thead><tbody>';
  PRED_STRATEGIES.forEach(s => {
    const p = perf[s.id];
    if (!p || p.total === 0) { html += `<tr><td>${s.name}</td><td>0</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`; return; }
    const avgF = (p.totalFrontHits / p.total).toFixed(1), avgB = (p.totalBackHits / p.total).toFixed(1);
    const fColor = parseFloat(avgF) >= 2 ? 'var(--green)' : parseFloat(avgF) >= 1.5 ? 'var(--yellow)' : 'var(--text-muted)';
    html += `<tr><td>${s.name}</td><td>${Math.round(p.total)}</td><td style="color:${fColor};font-weight:700;">${avgF}/5</td><td style="font-weight:700;">${avgB}/2</td><td style="color:var(--gold)">${p.bestFront}+${p.bestBack}</td><td style="color:var(--purple,#9b59b6)">${p.compBestLevel || '-'}</td><td style="color:var(--yellow)">${p.dtBestLevel || '-'}</td></tr>`;
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
        backfillCompoundDantuo(record);
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

    // Render smart-pick if available
    if (data.smartPick) {
      renderSmartPick(data.smartPick);
    }
  } catch { /* data/analysis.json not available (local dev) */ }
}

// ---- Smart Pick Rendering ----

function renderSmartPick(sp) {
  const card = document.getElementById('smart-pick-card');
  if (!card || !sp) return;
  card.style.display = '';

  // Calculate probability boost
  const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
  const selPicks = sp.select || [];
  const covPicks = sp.coverage || [];

  // Find eliminated numbers (35 front - candidates)
  const allFrontNums = new Set();
  [...selPicks, ...covPicks].forEach(p => p.front.forEach(n => allFrontNums.add(n)));
  const eliminated = [];
  for (let n = 1; n <= 35; n++) {
    if (allFrontNums.size > 0 && !allFrontNums.has(n) && allFrontNums.size < 35) {
      eliminated.push(n);
    }
  }

  // Probability boost
  const candidateCount = 35 - eliminated.length;
  const backCandidates = 12 - 3; // typically eliminates 3 back
  const origCombs = C(35, 5) * C(12, 2);
  const redCombs = C(candidateCount, 5) * C(backCandidates, 2);
  const boost = redCombs > 0 ? (origCombs / redCombs).toFixed(1) : '?';

  const boostEl = document.getElementById('sp-probability-boost');
  if (boostEl) boostEl.textContent = boost + '×';

  // Eliminated numbers as gray balls
  const elimEl = document.getElementById('sp-eliminated');
  if (elimEl && eliminated.length > 0) {
    elimEl.innerHTML = eliminated.map(n =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:rgba(100,100,100,0.3);color:var(--text-muted);font-size:0.7rem;font-weight:600;text-decoration:line-through;">${String(n).padStart(2, '0')}</span>`
    ).join('');
  }

  // Constraints
  const constrEl = document.getElementById('sp-constraints');
  if (constrEl) {
    constrEl.innerHTML = `📏 AC≥4 · 和值57-109 · 奇数1-4个 · 跨度≥12 · 三区不空`;
  }

  // Select mode
  const selSumEl = document.getElementById('sp-select-summary');
  const selContainer = document.getElementById('sp-select-picks');
  if (selSumEl) selSumEl.textContent = `${selPicks.length} 注 · ¥${selPicks.length * 2}`;
  if (selContainer) {
    selContainer.innerHTML = renderPickList(selPicks, 'select');
    const selAllText = selPicks.map(p => p.front.map(n => String(n).padStart(2,'0')).join(' ') + ' + ' + p.back.map(n => String(n).padStart(2,'0')).join(' ')).join('\n');
    selContainer.innerHTML += `<button class="btn-copy-all" style="border-color:rgba(243,156,18,0.3);color:#f39c12;" onclick="copyNumbers('${selAllText.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',this)">📋 复制全部精选</button>`;
  }

  // Coverage mode
  const covSumEl = document.getElementById('sp-coverage-summary');
  const covContainer = document.getElementById('sp-coverage-picks');
  if (covSumEl) covSumEl.textContent = `${covPicks.length} 注 · ¥${covPicks.length * 2}`;
  if (covContainer) {
    covContainer.innerHTML = renderPickList(covPicks, 'coverage');
    const covAllText = covPicks.map(p => p.front.map(n => String(n).padStart(2,'0')).join(' ') + ' + ' + p.back.map(n => String(n).padStart(2,'0')).join(' ')).join('\n');
    covContainer.innerHTML += `<button class="btn-copy-all" style="border-color:rgba(0,188,212,0.3);color:#00bcd4;" onclick="copyNumbers('${covAllText.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',this)">📋 复制全部覆盖</button>`;
  }

  // Toggle listeners
  const togSel = document.getElementById('toggle-select-mode');
  const togCov = document.getElementById('toggle-coverage-mode');
  if (togSel) togSel.onclick = () => {
    selContainer.style.display = selContainer.style.display === 'none' ? '' : 'none';
  };
  if (togCov) togCov.onclick = () => {
    covContainer.style.display = covContainer.style.display === 'none' ? '' : 'none';
  };
}

function renderPickList(picks, mode) {
  if (!picks || picks.length === 0) return '<p style="font-size:0.75rem;color:var(--text-muted);">暂无数据</p>';
  const frontBg = mode === 'select'
    ? 'linear-gradient(135deg,#f39c12,#e67e22)'
    : 'linear-gradient(135deg,#00bcd4,#0097a7)';
  const backBg = 'linear-gradient(135deg,#2980b9,#1a5276)';

  return picks.map((p, i) => {
    const fBalls = p.front.map(n =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${frontBg};color:#fff;font-weight:700;font-size:0.75rem;margin:1px;">${String(n).padStart(2, '0')}</span>`
    ).join('');
    const bBalls = p.back.map(n =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${backBg};color:#fff;font-weight:700;font-size:0.75rem;margin:1px;">${String(n).padStart(2, '0')}</span>`
    ).join('');
    const numStr = p.front.map(n => String(n).padStart(2,'0')).join(' ') + ' + ' + p.back.map(n => String(n).padStart(2,'0')).join(' ');

    return `<div style="display:flex;align-items:center;gap:0.3rem;padding:0.3rem 0.4rem;background:rgba(10,14,26,0.3);border:1px solid rgba(255,255,255,0.04);border-radius:var(--radius-sm);margin-bottom:3px;flex-wrap:wrap;">
      <span style="font-size:0.68rem;color:var(--text-muted);min-width:28px;font-weight:600;">#${i + 1}</span>
      ${fBalls}
      <span style="color:var(--text-muted);margin:0 2px;font-size:0.72rem;">+</span>
      ${bBalls}
      <button class="btn-copy-num" onclick="copyNumbers('${numStr}',this)" title="复制号码">📋</button>
    </div>`;
  }).join('');
}

// =============================================
// Copy Numbers to Clipboard
// =============================================
function copyNumbers(text, btn) {
  const decoded = text.replace(/\\n/g, '\n');
  navigator.clipboard.writeText(decoded).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ 已复制';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = decoded; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); btn.textContent = '✅ 已复制'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1500); }
    catch { btn.textContent = '❌ 失败'; setTimeout(() => { btn.textContent = '📋'; }, 1500); }
    document.body.removeChild(ta);
  });
}
