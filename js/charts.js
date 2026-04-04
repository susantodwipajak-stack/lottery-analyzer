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
  const summaryText = $('#dlt-latest-summary-text');
  if (!el || DLT_HISTORY.length === 0) return;
  const latest = DLT_HISTORY[0], prev = DLT_HISTORY.length > 1 ? DLT_HISTORY[1] : null;
  
  if (summaryText) {
    summaryText.innerHTML = `第 ${latest.issue} 期 | ` + 
      latest.front.map(n => String(n).padStart(2, '0')).join(' ') + 
      ` <span style="color:var(--text-muted)">+</span> ` + 
      latest.back.map(n => String(n).padStart(2, '0')).join(' ');
  }

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
