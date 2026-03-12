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

function toggleBall(ball, zone) { ball.classList.toggle(zone === 'front' ? 'selected-front' : 'selected-back'); }

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
    { name: '🎯 首推·自适应', desc: '回测排名#1 前区+26%', wFreq: 0.4, wMiss: 0.15, wRecent: 0.25 },
    { name: '📊 模式匹配', desc: '回测排名#2 区间+尾数', wFreq: 0.2, wMiss: 0.15, wRecent: 0.25 },
    { name: '🔥 热号趋势', desc: '偏重近期高频号码', wFreq: 0.5, wMiss: 0.1, wRecent: 0.4 }
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
  const ids = ['hot', 'cold', 'balanced'];
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
  // Bug#4 fix: decay old data before accumulating new
  p.totalFrontHits *= 0.95; p.totalBackHits *= 0.95; p.total = p.total * 0.95 + 1;
  p.totalFrontHits += hit.frontHits; p.totalBackHits += hit.backHits;
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

