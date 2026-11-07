'use strict';
/* UI · Bảng danh sách bản đồ: xem toàn bộ map, bấm Đi để dịch chuyển tới map đã mở. */
(() => {
  const { G, esc } = UI._;

  const THEME_ICON = { city: '🏙️', forest: '🌲', cave: '🕳️', redgate: '🌀' };

  function panelMap() {
    const p = App.player;
    const list = G.mapList(p);
    let html = '<p class="muted" style="margin-top:0">Danh sách bản đồ. Nơi có 🔒 sẽ mở khi bạn hoàn thành nhiệm vụ tương ứng. Bấm <b>Đi</b> để dịch chuyển tới nơi đã mở.</p><div class="list">';
    for (const m of list) {
      const icon = m.here ? '📍' : (m.ok ? (THEME_ICON[m.theme] || '🗺️') : '🔒');
      const sub = m.here ? 'Bạn đang ở đây'
        : m.ok ? 'Đã mở'
        : esc(m.reason);
      const extra = [m.mobs.length ? 'Quái: ' + m.mobs.join(', ') : '', m.npcs.length ? 'NPC: ' + m.npcs.join(', ') : '']
        .filter(Boolean).join(' · ');
      html += `<div class="li map-li${m.ok || m.here ? '' : ' locked'}${m.here ? ' sel' : ''}">
        <div class="ic">${icon}</div>
        <div class="main"><b>${esc(m.name)}</b>
          <small>${sub}${extra ? ' · ' + esc(extra) : ''}</small></div>
        ${m.here
          ? '<button class="btn small" disabled>Đang ở</button>'
          : `<button class="btn small${m.ok ? ' primary' : ''}" data-act="map_go" data-to="${esc(m.id)}" ${m.ok ? '' : 'disabled'}>${m.ok ? 'Đi' : 'Khóa'}</button>`}
      </div>`;
    }
    html += '</div>';
    return ['🗺️ Bản đồ', html];
  }

  Object.assign(UI._.PANELS, { map: panelMap });
})();
