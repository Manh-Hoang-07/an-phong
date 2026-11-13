'use strict';
/* UI · Trạm dịch chuyển giữa các Tân Đô: chỉ tới được làng đã từng ghé; phí cố định (G.TELEPORT_FEE), đi bộ thì miễn phí. */
(() => {
  const { G, esc, fmt } = UI._;

  function panelTeleport() {
    const p = App.player, here = App.scene ? App.scene.mapId : p.map, fee = G.TELEPORT_FEE;   // phí chuẩn; về Hiệp Hội miễn phí (G.teleportFee)
    let html = '<p class="muted" style="margin-top:0">Phí mỗi lượt: <b>' + fmt(fee) + ' xu</b>, không phụ thuộc cấp. Về Hiệp Hội thì miễn phí. Chỉ tới được Tân Đô đã từng ghé. Đi bộ giữa các làng thì miễn phí. Bạn có <b>' + fmt(p.gold) + ' xu</b>.</p><div class="list">';
    for (const v of G.VILLAGES) {
      const m = G.MAPS[v.id], visited = (p.villages || []).includes(v.id), isHere = v.id === here, vf = G.teleportFee(v.id), canPay = p.gold >= vf;
      const ok = visited && !isHere && canPay;
      const sub = isHere ? 'Bạn đang ở đây' : visited ? (canPay ? 'Đã từng tới · ' + (vf ? fmt(vf) + ' xu' : 'miễn phí') : 'Không đủ xu (cần ' + fmt(vf) + ')') : 'Chưa từng tới: hãy đi bộ tới đó một lần';
      html += '<div class="li gate-dest' + (visited ? '' : ' locked') + '">' +
        '<div class="ic">' + (isHere ? '📍' : visited ? '🌀' : '🔒') + '</div>' +
        '<div class="main"><b>' + esc(m.name) + '</b><small>' + esc(sub) + '</small></div>' +
        '<button class="btn small' + (ok ? ' primary' : '') + '" data-act="teleport_go" data-to="' + esc(v.id) + '" ' + (ok ? '' : 'disabled') + '>' + (isHere ? 'Đang ở' : visited ? 'Đi' : 'Khóa') + '</button></div>';
    }
    html += '</div>';
    return ['🌀 Trạm dịch chuyển', html];
  }

  Object.assign(UI._.PANELS, { teleport: panelTeleport });
})();
