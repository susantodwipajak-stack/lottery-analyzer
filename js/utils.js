// =============================================
// 体彩深度分析 V2.1 — 工具 & 配置
// =============================================

// ---- API Config (Phase 3: centralized) ----
const CONFIG = {
  api: {
    dltHistory: 'https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=85&provinceId=0&pageSize=100&isVerify=1&pageNo=1',
    dltBackup: 'https://api.huiniao.top/interface/home/lotteryHistory?type=dlt&page=1&limit=100',
    fbMatches: 'https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=HAD,HHAD&channel=c923-tysw-lq-dwj',
    fbTraditional: 'https://webapi.sporttery.cn/gateway/lottery/getFootBallMatchV1.qry?param=90,0&sellStatus=0&termLimits=10',
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.lottery.gov.cn/'
  },
  fetchTimeout: 15000,
  fetchRetries: 3,
};

// ---- Phase 2: Safe Fetch with retry + error toast ----
async function safeFetch(url, options = {}) {
  const retries = options.retries || CONFIG.fetchRetries;
  const timeout = options.timeout || CONFIG.fetchTimeout;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      const resp = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      if (i === retries - 1) {
        showToast(`网络请求失败: ${e.message}`, 'error', 5000);
        throw e;
      }
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

// ---- Phase 2: Button loading wrapper ----
async function withLoading(btnOrSelector, asyncFn) {
  const btn = typeof btnOrSelector === 'string' ? $(btnOrSelector) : btnOrSelector;
  if (!btn) return;
  setButtonLoading(btn, true);
  try {
    await asyncFn();
  } catch (e) {
    showToast(`操作失败: ${e.message}`, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

// ---- Utility Functions ----
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
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
// NOTE: Tab switching is handled in main.js with AOS refresh support.
// Do NOT add tab-btn listeners here to avoid double-firing.
