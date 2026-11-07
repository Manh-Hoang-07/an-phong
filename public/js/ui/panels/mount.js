'use strict';
/* UI · Bảng thú cưỡi (tab trong Menu). Thú cưỡi chỉ có qua mã quà tặng ở Lữ khách bí ẩn. */
(() => {
  const { G, esc } = UI._;
  const pct = (v) => (v >= 0 ? '+' : '') + Math.round(v * 100) + '%';

  function panelMount() {
    const p = App.player, own = (p.mounts && p.mounts.owned) || [], active = p.mounts && p.mounts.active;
    let html = `<p class="muted" style="margin-top:0">Thú cưỡi chỉ nhận được qua <b>mã quà tặng</b> (nói mật mã với Lữ khách bí ẩn ở Tân Đô).
      Cưỡi / xuống: phím <b>M</b> hoặc nút <b>🐎</b>. Bấm đánh hay kỹ năng sẽ tự xuống thú.</p><div class="list">`;
    for (const [id, m] of Object.entries(G.MOUNTS)) {
      const has = own.includes(id), on = active === id;
      const traits = [`Tốc chạy ${pct(m.speed)}`, m.jump !== 1 ? `Nhảy ${pct(m.jump - 1)}` : 'Nhảy như đi bộ',
        m.glide ? 'Lướt khi rơi' : '', m.swim ? 'Không bị nước / băng làm chậm' : ''].filter(Boolean).join(' · ');
      const btn = !has ? '<span class="muted" style="font-size:12px">🔒 Nhận qua mã</span>'
        : on ? `<button class="btn small" data-act="mount_ride">${App.mounted ? 'Xuống thú' : 'Cưỡi'}</button>`
          : `<button class="btn small primary" data-act="mount_set" data-id="${id}">Chọn</button>`;
      html += `<div class="li mount-li${has ? '' : ' locked'}${on ? ' on' : ''}"><div class="ic">${m.icon}</div>
        <div class="main"><b>${esc(m.name)}${on ? ' <span class="okc">· đang dùng</span>' : ''}</b><small>${esc(traits)}</small><small class="muted">${esc(m.desc)}</small></div>
        <div class="row">${btn}</div></div>`;
    }
    html += '</div>';
    return ['Thú cưỡi', html];
  }

  Object.assign(UI._.PANELS, { mount: panelMount });
})();
