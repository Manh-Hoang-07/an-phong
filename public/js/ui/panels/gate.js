'use strict';
/* UI · Bảng chọn nơi đến khi vào cổng dịch chuyển (mỗi bản đồ một cổng, xem GameData.gateDestinations). */
(() => {
  const { G, esc } = UI._;

  function panelGate() {
    const p = App.player, mapId = App.scene ? App.scene.mapId : p.map;
    const list = G.gateDestinations(p, mapId);
    let html = '<p class="muted" style="margin-top:0">Chọn nơi muốn đến. Nơi có 🔒 sẽ mở khi bạn hoàn thành nhiệm vụ tương ứng.</p><div class="list">';
    for (const d of list) {
      html += `<div class="li gate-dest${d.ok ? '' : ' locked'}">
        <div class="ic">${d.ok ? '🌀' : '🔒'}</div>
        <div class="main"><b>${esc(d.name)}</b>
          <small>${d.ok ? 'Đã mở' : esc(d.reason)}</small></div>
        <button class="btn small${d.ok ? ' primary' : ''}" data-act="gate_go" data-ch="${esc(d.ch)}" ${d.ok ? '' : 'disabled'}>${d.ok ? 'Đi' : 'Khóa'}</button>
      </div>`;
    }
    html += '</div>';
    return ['🌀 Cổng dịch chuyển', html];
  }

  Object.assign(UI._.PANELS, { gate: panelGate });
})();
