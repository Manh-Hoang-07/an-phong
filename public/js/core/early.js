'use strict';
/*
 * Chạy ngay từ <head>, trước khi tải xong code game:
 *  - hỏi server thông tin nhân vật song song với lúc tải code (khỏi phải chờ nối đuôi)
 *  - bắt đầu tải font tiếng Việt sớm
 *  - thanh tiến độ của màn hình chờ
 */
window.__me = fetch('/api/me', { credentials: 'same-origin' }).then(r => r.json()).catch(() => null);
try {
  if (document.fonts && document.fonts.load) {
    document.fonts.load('16px "Be Vietnam Pro"', 'Thức Tỉnh').catch(() => {});
    document.fonts.load('600 16px "Be Vietnam Pro"', 'Thức Tỉnh').catch(() => {});
  }
} catch { /* trình duyệt cũ thì thôi */ }

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
