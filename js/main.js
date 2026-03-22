// =============================================
// SECTION 3: 中奖查询 (官方7级 · lottery.gov.cn)
// =============================================
function checkDLTPrize() {
  const parse = str => str.trim().split(/[\s,，]+/).map(Number).filter(n => !isNaN(n));
  const winFront = parse($('#win-front').value), winBack = parse($('#win-back').value);
  const myFront = parse($('#my-front').value), myBack = parse($('#my-back').value);
  const isExtra = $('#is-extra').value === '1';
  const poolHigh = $('#pool-bracket')?.value === 'high'; // 奖池≥8亿
  if (winFront.length !== 5 || winBack.length !== 2) { showToast('开奖号码格式错误：前区5个，后区2个', 'warning'); return; }
  if (myFront.length < 5 || myBack.length < 2) { showToast('你的号码格式错误：前区至少5个，后区至少2个', 'warning'); return; }
  const matchF = myFront.filter(n => winFront.includes(n)).length;
  const matchB = myBack.filter(n => winBack.includes(n)).length;

  // 官方7级中奖规则 (2019年版)
  // 固定奖分两档: 奖池<8亿 / ≥8亿
  const PRIZE_TABLE = [
    { level: '🥇 一等奖', match: [5,2], low: '浮动(最高500万)', high: '浮动(最高500万)', value: 5000000, floating: true },
    { level: '🥈 二等奖', match: [5,1], low: '浮动', high: '浮动', value: 100000, floating: true },
    { level: '🥉 三等奖', match: [[5,0],[4,2]], low: 5000, high: 6666 },
    { level: '四等奖', match: [4,1], low: 300, high: 380 },
    { level: '五等奖', match: [[4,0],[3,2]], low: 150, high: 200 },
    { level: '六等奖', match: [[3,1],[2,2]], low: 15, high: 18 },
    { level: '七等奖', match: [[3,0],[2,1],[1,2],[0,2]], low: 5, high: 7 }
  ];

  let level = '未中奖', prize = 0, isFloating = false;
  for (const tier of PRIZE_TABLE) {
    const matches = Array.isArray(tier.match[0]) ? tier.match : [tier.match];
    if (matches.some(([f, b]) => matchF === f && matchB === b)) {
      level = tier.level;
      isFloating = !!tier.floating;
      prize = isFloating ? tier.value : (poolHigh ? tier.high : tier.low);
      break;
    }
  }

  // 追加投注: 仅浮动奖(一/二等奖)参与, 追加奖金 = 基本奖金 × 80%
  const extraPrize = (isExtra && isFloating) ? Math.round(prize * 0.8) : 0;
  const finalPrize = prize + extraPrize;
  const isWin = level !== '未中奖';
  const poolLabel = poolHigh ? '奖池≥8亿' : '奖池<8亿';

  $('#prize-detail').innerHTML = `<div class="result-grid">
    <div class="result-item"><div class="label">前区匹配</div><div class="value ${isWin ? 'positive' : 'negative'}">${matchF} / 5</div></div>
    <div class="result-item"><div class="label">后区匹配</div><div class="value ${isWin ? 'positive' : 'negative'}">${matchB} / 2</div></div>
    <div class="result-item"><div class="label">中奖等级</div><div class="value ${isWin ? 'gold' : 'negative'}">${level}</div></div>
    <div class="result-item"><div class="label">基本奖金</div><div class="value ${isWin ? 'gold' : 'negative'}">¥${prize.toLocaleString()}${isFloating ? '(浮动)' : ''}</div></div>
    ${isExtra && isFloating ? `<div class="result-item"><div class="label">追加奖金(80%)</div><div class="value cyan">¥${extraPrize.toLocaleString()}</div></div>` : ''}
    ${isExtra && isFloating ? `<div class="result-item"><div class="label">合计奖金</div><div class="value gold">¥${finalPrize.toLocaleString()}</div></div>` : ''}
    ${!isFloating && isWin ? `<div class="result-item"><div class="label">奖池档位</div><div class="value neutral">${poolLabel}</div></div>` : ''}</div>
    <div style="margin-top:1rem;padding:0.8rem;background:rgba(10,14,26,0.5);border-radius:var(--radius-sm);font-size:0.8rem;color:var(--text-secondary)"><strong>匹配详情：</strong>
    前区 [${myFront.map(n => winFront.includes(n) ? `<span style="color:var(--green);font-weight:700">${String(n).padStart(2, '0')}</span>` : `<span style="color:var(--text-muted)">${String(n).padStart(2, '0')}</span>`).join(' ')}]
    后区 [${myBack.map(n => winBack.includes(n) ? `<span style="color:var(--green);font-weight:700">${String(n).padStart(2, '0')}</span>` : `<span style="color:var(--text-muted)">${String(n).padStart(2, '0')}</span>`).join(' ')}]
    ${isExtra ? ' <span style="color:var(--yellow)">（追加投注）</span>' : ''}
    ${!isFloating && isWin ? ` <span style="color:var(--cyan)">（${poolLabel}）</span>` : ''}</div>`;
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
// Event Bindings
// =============================================
$('#btn-analyze-history')?.addEventListener('click', analyzeHistory);
$('#btn-show-history')?.addEventListener('click', showHistory);
$('#btn-close-history')?.addEventListener('click', () => $('#history-modal').classList.add('hidden'));
$('#btn-check-prize')?.addEventListener('click', checkDLTPrize);
$('#btn-calc-fb-prize')?.addEventListener('click', calcFBPrize);
$('#btn-add-draw')?.addEventListener('click', addSingleDraw);
$('#btn-batch-add')?.addEventListener('click', () => $('#batch-add-area').classList.toggle('hidden'));
$('#btn-batch-submit')?.addEventListener('click', batchAddDraws);
$('#btn-batch-cancel')?.addEventListener('click', () => $('#batch-add-area').classList.add('hidden'));
$('#btn-export-data')?.addEventListener('click', exportData);
$('#btn-import-data')?.addEventListener('click', () => $('#file-import').click());
$('#file-import')?.addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
$('#btn-reset-data')?.addEventListener('click', resetData);
$('#btn-regenerate')?.addEventListener('click', generateRecommendations);
$('#btn-fetch-official')?.addEventListener('click', () => fetchOfficialData(false));
$('#auto-update-toggle')?.addEventListener('change', toggleAutoUpdate);

// Collapsible panels (P1: with arrow indicators)
initCollapsiblePanel('#toggle-data-panel', '#data-panel-body');
initCollapsiblePanel('#toggle-pred-history', '#pred-history-body');
initCollapsiblePanel('#toggle-perf-panel', '#perf-panel-body');

// Prediction system bindings
$('#btn-generate-pred')?.addEventListener('click', generatePredictionSet);
$('#btn-compare-pred')?.addEventListener('click', comparePredictions);
// FB bindings
$('#btn-gen-fb-picks')?.addEventListener('click', () => {
  if (typeof generateFBPicks === 'function') generateFBPicks();
});
$('#btn-compare-fb')?.addEventListener('click', () => {
  if (typeof openFBSimulator === 'function') openFBSimulator();
});
$('#btn-export-pred')?.addEventListener('click', () => {
  const data = getPredictions();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'dlt_predictions.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('预测数据已导出', 'success');
});
// P2: Custom confirm dialog replaces confirm()
$('#btn-clear-pred')?.addEventListener('click', async () => {
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
// Enhanced tab switch with AOS refresh
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
