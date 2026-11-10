'use strict';
/*
 * Chạy ngay từ <head>, trước khi tải xong code game:
 *  - hỏi server thông tin nhân vật song song với lúc tải code (khỏi phải chờ nối đuôi)
 *  - bắt đầu tải font tiếng Việt sớm
 *  - thanh tiến độ của màn hình chờ
 */
// Độ lệch đồng hồ máy này so với server (header Date), xem App.serverNow trong net.js
window.__clockSkew = 0;
window.__noteServerTime = (res) => {
  try { const d = Date.parse(res.headers.get('Date')); if (d) window.__clockSkew = d - Date.now(); } catch { /* bỏ qua */ }
};
window.__me = fetch('/api/me', { credentials: 'same-origin' }).then(r => { __noteServerTime(r); return r.json(); }).catch(() => null);
try {
  if (document.fonts && document.fonts.load) {
    document.fonts.load('16px "Be Vietnam Pro"', 'Thức Tỉnh').catch(() => {});
    document.fonts.load('600 16px "Be Vietnam Pro"', 'Thức Tỉnh').catch(() => {});
  }
} catch { /* trình duyệt cũ thì thôi */ }

// Lỗi nào làm game không chạy được (vd. trình duyệt cũ thiếu tính năng) thì hiện ngay trên màn hình chờ,
// thay vì treo mãi ở "Đang tải..." mà không biết tại sao (iPhone không có công cụ xem lỗi).
window.__showFatal = (msg) => {
  try {
    const t = document.getElementById('load-text');
    const l = document.getElementById('loading');
    if (t && l && !l.classList.contains('hidden')) {
      t.textContent = 'Không vào được game: ' + String(msg).slice(0, 300);
      const sp = l.querySelector('.spinner'); if (sp) sp.style.display = 'none';
    }
  } catch { /* bỏ qua */ }
};
window.addEventListener('error', (e) => window.__showFatal((e && e.message) || 'lỗi không rõ'));
window.addEventListener('unhandledrejection', (e) => window.__showFatal((e && e.reason && (e.reason.message || e.reason)) || 'lỗi không rõ'));

window.Loading = {
  set(p, text) {
    const f = document.getElementById('load-fill');
    if (f) f.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + '%';
    if (text) { const t = document.getElementById('load-text'); if (t) t.textContent = text; }
  },
  show(text) {
    const el = document.getElementById('loading');
    if (el) el.classList.remove('hidden');
    this.set(0, text);
  },
  hide() {
    const el = document.getElementById('loading');
    if (el) el.classList.add('hidden');
  },
};
