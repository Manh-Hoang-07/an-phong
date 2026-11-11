'use strict';
/* UI · Bản đồ thế giới: chỉ để XEM (sơ đồ các khu và đường nối). Không dịch chuyển từ đây,
 * muốn đi phải tới cổng trong game. Bấm vào một khu để xem thông tin. */
(() => {
  const { G, esc, S } = UI._;

  const THEME_ICON = { city: '🏙️', forest: '🌲', cave: '🕳️', redgate: '🌀' };
  const W = 720, H = 720, ROOT = 'cong_do';

  // Sơ đồ vuông tự nhiên: cây đường đi mọc ra từ Cổng đỏ, mỗi khu đặt cách khu cha một đoạn theo hướng
  // lệch ngẫu nhiên (cố định theo hạt giống) ưu tiên chỗ còn trống, nên các khu tản khắp khung vuông.
  let cache = null;
  function layout() {
    if (cache) return cache;
    const kids = {}, seen = new Set([ROOT]), edges = [];
    const grow = (id) => {
      kids[id] = [];
      for (const q of Object.values((G.MAPS[id] && G.MAPS[id].portals) || {})) {
        if (seen.has(q.to) || !G.MAPS[q.to]) continue;
        seen.add(q.to); kids[id].push(q.to); edges.push([id, q.to]); grow(q.to);
      }
    };
    grow(ROOT);
    for (const id in G.MAPS) if (!seen.has(id)) { seen.add(id); kids[ROOT].push(id); kids[id] = []; edges.push([ROOT, id]); }   // map chưa nối được thì treo vào gốc
    let seed = 20240611; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const n = Object.keys(kids).length, step = 0.9 / Math.sqrt(n), P = { [ROOT]: { x: 0.5, y: 0.5, a: 0 } }, depth = { [ROOT]: 0 };
    const place = (id) => {
      for (const k of kids[id]) {
        const par = P[id]; let best = null, bs = -1e9;
        for (let t = 0; t < 40; t++) {
          const a = t < 20 ? par.a + (rnd() - 0.5) * 1.7 : rnd() * 6.283, d = step * (0.85 + rnd() * 0.5);
          const x = par.x + Math.cos(a) * d, y = par.y + Math.sin(a) * d;
          if (x < 0.03 || x > 0.97 || y < 0.03 || y > 0.97) continue;
          let md = 9; for (const o in P) if (o !== id) md = Math.min(md, Math.hypot(P[o].x - x, P[o].y - y));
          const s = Math.min(md, step * 1.2) + (t < 20 ? 0.02 : 0) + rnd() * 0.03;
          if (md > step * 0.55 && s > bs) { bs = s; best = { x, y, a }; }
        }
        if (!best) { const a = rnd() * 6.283; best = { x: Math.min(.97, Math.max(.03, par.x + Math.cos(a) * step)), y: Math.min(.97, Math.max(.03, par.y + Math.sin(a) * step)), a }; }
        P[k] = best; depth[k] = depth[id] + 1; place(k);
      }
    };
    place(ROOT);
    const xs = Object.values(P).map(p => p.x), ys = Object.values(P).map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pad = 56, pos = {};
    for (const id in P) pos[id] = { x: pad + (P[id].x - x0) / ((x1 - x0) || 1) * (W - 2 * pad), y: pad + (P[id].y - y0) / ((y1 - y0) || 1) * (H - 2 * pad), d: depth[id] };
    return (cache = { pos, edges });
  }
  const edgePath = (a, b) => `M${a.x} ${a.y}L${b.x} ${b.y}`;

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
      svg += `<path d="${edgePath(pos[a], pos[b])}" fill="none" stroke="${open ? '#3f8f3a' : '#8a7a62'}" stroke-width="${open ? 4 : 3}" stroke-linecap="round" ${open ? '' : 'stroke-dasharray="3 7"'} opacity="0.9"/>`;
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
