'use strict';
/* UI · Bộ sưu tập bóng ma của Tử Linh Thuật Sư. */
(() => {
  const { G, esc, S } = UI._;
  function panelShadows() {
    const p = App.player, data = p.shadows || { roster: [], active: [], enabled: false };
    const roster = data.roster || [], active = data.active || [];
    const html = `<p class="muted">Bộ sưu tập ${roster.length}/12 · Đội hình ${active.length}/3. Bóng được lưu qua map và lần đăng nhập; giải trừ chỉ làm chúng ẩn đi.</p>
      <div class="row" style="gap:8px;margin-bottom:12px"><button class="btn primary" data-act="shadow_toggle">${data.enabled ? '☽ Giải trừ đội hình' : '☠ Triệu hồi đội hình'}</button><span class="muted">${data.enabled ? 'Đang theo bạn' : 'Đang giải trừ'}</span></div>
      ${roster.length ? '<div class="list">' + roster.map(soul => {
        const mon = G.MONSTERS[soul.monster], selected = active.includes(soul.uid);
        const confirming = S.confirmShadowRelease === soul.uid;
        return `<div class="li"><div class="ic">👻</div><div class="main"><b>${esc(mon?.name || soul.monster)} · Bóng #${soul.uid}</b><small>${selected ? 'Đang ở trong đội hình' : 'Đang được lưu giữ'}</small></div><div class="row" style="gap:4px"><button class="btn small ${selected ? 'primary' : ''}" data-act="shadow_party" data-uid="${soul.uid}">${selected ? 'Bỏ chọn' : 'Thêm vào đội'}</button><button class="btn small ${confirming ? 'primary' : ''}" data-act="shadow_release" data-uid="${soul.uid}">${confirming ? 'Xác nhận xóa' : 'Giải phóng'}</button></div></div>`;
      }).join('') + '</div>' : '<p class="muted">Chưa thu phục bóng ma nào. Hạ quái thường hoặc tinh anh để thu hồn.</p>'}`;
    return ['Bộ sưu tập bóng ma', html];
  }
  Object.assign(UI._.PANELS, { shadows: panelShadows });
})();
