'use strict';
/* UI · Bộ sưu tập bóng ma của Tử Linh Thuật Sư. */
(() => {
  const { G, esc, S, fmt } = UI._;
  // Chỉ số bóng ma theo cấp hiện tại (= chỉ số quái lúc thu phục, chỉ tăng khi bóng lên cấp)
  function statLine(soul, p) {
    const s = G.shadowStats(soul, p) || {};
    const parts = [`Cấp ${s.level ?? '?'}`, s.gradeLabel && s.gradeLabel !== 'thường' ? s.gradeLabel : null,
      `❤ ${fmt(s.hp ?? 0)}`, `⚔ ${fmt(s.atk ?? 0)}`, `🛡 ${fmt(s.def ?? 0)}`, s.speed ? `👟 ${s.speed}` : null].filter(Boolean);
    const where = s.map && G.MAPS[s.map] ? ` · thu ở ${G.MAPS[s.map].name}` : '';
    const when = s.at ? ` · ${new Date(s.at).toLocaleDateString('vi-VN')}` : '';
    return `<small>${esc(parts.join(' · '))}${esc(where + when)}</small>`;
  }
  function panelShadows() {
    const p = App.player, data = p.shadows || { roster: [], active: [], enabled: false };
    const roster = data.roster || [], active = data.active || [];
    const html = `<p class="muted">Bộ sưu tập ${roster.length}/${G.SHADOW_ROSTER} · Đội hình ${active.length}/${G.SHADOW_PARTY}. Bóng có cấp riêng: bắt đầu bằng cấp quái lúc bị hạ, lên cấp khi đánh quái (tối đa bằng cấp của bạn). Bóng được lưu qua map và lần đăng nhập; giải trừ chỉ làm chúng ẩn đi.</p>
      <div class="row" style="gap:8px;margin-bottom:12px"><button class="btn primary" data-act="shadow_toggle">${data.enabled ? '☽ Giải trừ đội hình' : '☠ Triệu hồi đội hình'}</button><span class="muted">${data.enabled ? 'Đang theo bạn' : 'Đang giải trừ'}</span></div>
      ${roster.length ? '<div class="list">' + roster.map(soul => {
        const mon = G.MONSTERS[soul.monster], selected = active.includes(soul.uid);
        const confirming = S.confirmShadowRelease === soul.uid;
        const lv = G.shadowLevelOf(soul, p), capped = G.shadowTrueLv(soul) >= (p.level || 1);
        const expLine = capped ? 'đã chạm cấp chủ' : `Kinh nghiệm ${Math.round(soul.exp || 0)}/${G.shadowExpToNext(lv)}`;
        return `<div class="li"><div class="ic">👻</div><div class="main"><b>${esc(soul.stats?.name || mon?.name || soul.monster)} · Bóng #${soul.uid} <small>Cấp ${lv}</small></b>${statLine(soul, p)}<small class="muted">${expLine} · ${selected ? 'Đang ở trong đội hình' : 'Đang được lưu giữ'}</small></div><div class="row" style="gap:4px"><button class="btn small ${selected ? 'primary' : ''}" data-act="shadow_party" data-uid="${soul.uid}">${selected ? 'Bỏ chọn' : 'Thêm vào đội'}</button><button class="btn small ${confirming ? 'primary' : ''}" data-act="shadow_release" data-uid="${soul.uid}">${confirming ? 'Xác nhận xóa' : 'Giải phóng'}</button></div></div>`;
      }).join('') + '</div>' : '<p class="muted">Chưa thu phục bóng ma nào. Hạ quái thường hoặc tinh anh để thu hồn.</p>'}`;
    return ['Bộ sưu tập bóng ma', html];
  }
  Object.assign(UI._.PANELS, { shadows: panelShadows });
})();
