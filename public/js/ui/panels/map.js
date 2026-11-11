'use strict';
/* UI · Bản đồ thế giới: chỉ để XEM (sơ đồ các khu và đường nối). Không dịch chuyển từ đây,
 * muốn đi phải tới cổng trong game. Bấm vào một khu để xem thông tin. */
(() => {
  const { G, esc, S } = UI._;

  const THEME_ICON = { city: '🏙️', forest: '🌲', cave: '🕳️', redgate: '🌀' };
  const W = 960, H = 560, ROOT = 'cong_do';

  // Cây đường đi từ Cổng đỏ: x theo độ sâu, y theo thứ tự lá; các nhánh cụt tách ra trên dưới
  let cache = null;
  function layout() {
    if (cache) return cache;
    const kids = {}, depth = { [ROOT]: 0 }, edges = [], order = [ROOT];
    for (let i = 0; i < order.length; i++) {          // BFS dựng cây theo thứ tự khai báo cổng
      const id = order[i];
      kids[id] = [];
      for (const q of Object.values((G.MAPS[id] && G.MAPS[id].portals) || {})) {
        if (depth[q.to] !== undefined || !G.MAPS[q.to]) continue;
        depth[q.to] = depth[id] + 1; kids[id].push(q.to); order.push(q.to); edges.push([id, q.to]);
      }
    }
    // map nào chưa nối được thì treo vào gốc
    for (const id in G.MAPS) if (depth[id] === undefined) { depth[id] = 1; kids[ROOT].push(id); edges.push([ROOT, id]); kids[id] = []; }
    let leaf = 0; const yIdx = {};
    const walk = (id) => { const k = kids[id] || []; if (!k.length) { yIdx[id] = leaf++; return; } k.forEach(walk); yIdx[id] = (yIdx[k[0]] + yIdx[k[k.length - 1]]) / 2; };
    walk(ROOT);
    const maxD = Math.max(...Object.values(depth)), padX = 52, padY = 52;
    const pos = {};
    for (const id in G.MAPS) pos[id] = { x: padX + depth[id] * (W - 2 * padX) / maxD, y: padY + (leaf > 1 ? yIdx[id] * (H - 2 * padY - 10) / (leaf - 1) : (H - 2 * padY) / 2), d: depth[id] };
    return (cache = { pos, edges });
  }

  const isOpen = (p, id) => { const m = G.MAPS[id]; return !m.require || G.questDone(p, m.require); };

  function panelMap() {
    const p = App.player, { pos, edges } = layout();
    const list = Object.fromEntries(G.mapList(p).map(m => [m.id, m]));
    const sel = S.selected && S.selected.where === 'map' && G.MAPS[S.selected.key] ? S.selected.key : p.map;
    let svg = `<svg class="wm-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bản đồ thế giới">
      <defs>
        <radialGradient id="wmg" cx="50%" cy="48%" r="75%"><stop offset="0" stop-color="#f0dcae"/><stop offset="0.7" stop-color="#d9bb80"/><stop offset="1" stop-color="#b48f55"/></radialGradient>
        <filter id="wmn" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.1  0 0 0 0.22 0"/></filter>
      </defs>
      <rect width="${W}" height="${H}" rx="18" fill="url(#wmg)"/>
      <rect width="${W}" height="${H}" rx="18" filter="url(#wmn)"/>
      <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="14" fill="none" stroke="#7a5a2c" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="2 6"/>`;
    for (const [a, b] of edges) {
      const open = isOpen(p, a) && isOpen(p, b);
      svg += `<line x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}" stroke="${open ? '#3f8f3a' : '#8a7a62'}" stroke-width="${open ? 4 : 3}" stroke-linecap="round" ${open ? '' : 'stroke-dasharray="3 7"'} opacity="0.9"/>`;
    }
    for (const id in G.MAPS) {
      const m = G.MAPS[id], q = pos[id], open = isOpen(p, id), here = id === p.map, hub = !!m.village;
      const fill = here ? '#ffcf4a' : open ? '#5bbf4a' : '#9b9588';
      const r = hub ? 14 : 8.5, above = q.d % 2 === 0;
      svg += `<g class="wm-node${id === sel ? ' sel' : ''}${open ? '' : ' locked'}" data-sel="map:${esc(id)}" tabindex="0">
        ${id === sel ? `<circle cx="${q.x}" cy="${q.y}" r="${r + 7}" fill="none" stroke="#7b2d1a" stroke-width="2.5" stroke-dasharray="4 3"/>` : ''}
        <circle cx="${q.x}" cy="${q.y}" r="${r}" fill="${fill}" stroke="${hub ? '#7b2d1a' : '#4a3216'}" stroke-width="${hub ? 4 : 2.5}"/>
        <text x="${q.x}" y="${q.y + 4}" text-anchor="middle" font-size="${hub ? 14 : 10}">${here ? '⭐' : open ? '' : '🔒'}</text>
        <text class="wm-lbl" x="${q.x}" y="${above ? q.y - r - 6 : q.y + r + 13}" text-anchor="middle" font-size="${hub ? 12.5 : 10.5}">${esc(shortName(m.name))}</text>
      </g>`;
    }
    svg += '</svg>';

    const m = G.MAPS[sel], info = list[sel];
    const open = isOpen(p, sel);
    const status = sel === p.map ? '📍 Bạn đang ở đây' : open ? '✅ Đã mở' : '🔒 ' + (info ? info.reason : 'Chưa mở');
    const mobs = info && info.mobs.length ? info.mobs.join(', ') : 'Không có';
    const npcs = info && info.npcs.length ? info.npcs.join(', ') : 'Không có';
    const near = Object.values(m.portals || {}).map(x => G.MAPS[x.to] && G.MAPS[x.to].name).filter(Boolean);
    const card = `<div class="wm-card">
      <div class="wm-title">${THEME_ICON[m.theme] || '🗺️'} <b>${esc(m.name)}</b> <span class="wm-st">${esc(status)}</span></div>
      <div class="wm-row"><span>Quái</span>${esc(mobs)}</div>
      <div class="wm-row"><span>NPC</span>${esc(npcs)}</div>
      <div class="wm-row"><span>Nối tới</span>${esc(near.join(' · ') || '—')}</div>
    </div>`;
    const legend = '<div class="wm-legend"><i style="background:#fff;border:3px solid #7b2d1a;width:12px;height:12px"></i>Tân Đô (làng) <i style="background:#ffcf4a"></i>Đang ở <i style="background:#5bbf4a"></i>Đã mở <i style="background:#9b9588"></i>Chưa mở. Muốn đi: tới cổng trong game.</div>';
    return ['🗺️ Bản đồ', `<div class="wm">${svg}${card}${legend}</div>`];
  }
  // Rút gọn tên dài ("Cổng hạng E – Rừng Sương" → "Rừng Sương")
  function shortName(n) {
    if (/^Cổng đỏ/i.test(n)) return 'Cổng đỏ';
    const parts = String(n).split(/\s[–-]\s/), s = parts[parts.length - 1];
    return s.length > 15 ? s.slice(0, 14) + '…' : s;
  }

  Object.assign(UI._.PANELS, { map: panelMap });
})();
