'use strict';
/* UI · Danh sách 30 khu của bản đồ. Mỗi khu tối đa 20 người, quái riêng từng khu (server/realtime/index.js).
 * Mở bằng cách bấm vào NPC "Người dẫn khu" (mỗi bản đồ 2 người, bản đồ rộng 3 người): scene/map.js buildZoneNpcs → Khu.open().
 * Chuyển khu: server đưa ta sang phòng khác, client nhận gói 'room' + 'mobs' như khi vào bản đồ.
 * Khu đang đứng hiện ở chỉ báo nhỏ "K<n>" cạnh nút bản đồ (không bấm được). */
(() => {
  const $ = (id) => document.getElementById(id);
  const win = $('khu-win'), badge = $('khu-badge');
  if (!win) return;

  let waitT = null;
  const setLabel = () => { if (badge) badge.textContent = 'K' + (Realtime.channel || 1); };

  function render(m) {
    const cur = m.cur || 1, cap = m.cap || 20;
    const mapName = (window.GameData && GameData.MAPS[m.map] && GameData.MAPS[m.map].name) || '';
    const rows = m.list.map(([ch, n]) => {
      const full = n >= cap, here = ch === cur;
      const state = here ? 'Đang ở đây' : full ? 'Đầy' : n >= cap * 0.7 ? 'Đông' : n > 0 ? 'Còn chỗ' : 'Vắng';
      const cls = 'khu-row' + (here ? ' cur' : '') + (full ? ' full' : n > 0 ? ' some' : '');
      return `<button class="${cls}" data-khu="${ch}" ${full || here ? 'disabled' : ''}>`
        + `<b>Khu ${ch}</b><span class="khu-bar"><i style="width:${Math.min(100, n / cap * 100)}%"></i></span><span class="khu-n">${n}/${cap}</span><em>${state}</em></button>`;
    }).join('');
    win.innerHTML = `<div class="sw-box small"><div class="sw-head"><b>Chọn khu <small>${mapName}</small></b><button class="x" data-close>✕</button></div>`
      + `<div class="sw-body"><div class="khu-list">${rows}</div>`
      + `<p class="note">Mỗi khu tối đa ${cap} người, có quái riêng. Cùng đội muốn đi chung thì vào cùng một khu.</p></div></div>`;
    win.classList.remove('hidden');
    const curEl = win.querySelector('.khu-row.cur');
    if (curEl && curEl.scrollIntoView) curEl.scrollIntoView({ block: 'center' });
  }

  function open() {
    if (!Realtime.send({ t: 'chlist' })) { UI.log('Chưa kết nối máy chủ, không đổi khu được.', '#ffb74d'); return; }
    // Máy chủ cũ (chưa khởi động lại sau bản cập nhật) không biết gói này và sẽ không trả lời
    clearTimeout(waitT);
    waitT = setTimeout(() => UI.log('Máy chủ chưa trả lời danh sách khu (cần khởi động lại server để dùng tính năng chia khu).', '#ffb74d', 9000), 2000);
  }

  win.addEventListener('click', (e) => {
    if (e.target === win || e.target.closest('[data-close]')) { win.classList.add('hidden'); return; }
    const b = e.target.closest('[data-khu]');
    if (!b || b.disabled) return;
    Realtime.send({ t: 'ch', n: Number(b.dataset.khu) });
    win.classList.add('hidden');
  });

  Realtime.listen((m) => {
    if (m.t === 'chlist') { clearTimeout(waitT); render(m); }
    else if (m.t === 'room') setLabel();
    else if (m.t === 'offline') { if (badge) badge.textContent = 'K–'; }
  });
  setLabel();
  window.Khu = { open };
})();
