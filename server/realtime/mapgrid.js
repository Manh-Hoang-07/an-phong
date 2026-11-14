'use strict';
/*
 * Lưới bản đồ phía server cho AI quái. PHẢI khớp với WorldScene.parseMap / groundY / spanAt (public/js/scene/map.js):
 * kéo giãn cột 1,5 lần, ký hiệu chức năng chỉ giữ ở bản sao đầu, thêm hàng đất cho đủ 17 hàng.
 * Sửa một bên thì sửa cả bên kia.
 */
const fs = require('fs');
const path = require('path');
const G = require('../../shared');

const T = G.TILE;
const MAPS_DIR = path.join(__dirname, '..', '..', 'shared', 'maps');
const cache = new Map();

function load(mapId) {
  if (cache.has(mapId)) return cache.get(mapId);
  const meta = G.MAPS[mapId];
  let grid = null;
  try {
    const raw = fs.readFileSync(path.join(MAPS_DIR, mapId + '.txt'), 'utf8').replace(/\r/g, '').split('\n').filter((l) => l.length);
    const sourceCols = Math.max(...raw.map((l) => l.length));
    const cols = Math.ceil(sourceCols * 1.5);
    const markers = new Set(['S', ...Object.keys(meta.spawns || {}), ...Object.keys(meta.npcs || {}), ...Object.keys(meta.portals || {}), meta.gate].filter(Boolean));
    grid = raw.map((line) => {
      const source = line.padEnd(sourceCols, '.').split('');
      return Array.from({ length: cols }, (_, col) => {
        const oldCol = Math.min(sourceCols - 1, Math.floor(col / 1.5));
        const ch = source[oldCol];
        return markers.has(ch) && col !== Math.ceil(oldCol * 1.5) ? '.' : ch;
      });
    });
    const extra = Math.max(0, 17 - grid.length);
    for (let i = 0; i < extra; i++) grid.push(Array(cols).fill('#'));
  } catch (e) {
    console.error(`Không đọc được bản đồ ${mapId}:`, e.message);
  }
  const map = grid ? build(meta, grid) : null;
  cache.set(mapId, map);
  return map;
}

function build(meta, grid) {
  const rows = grid.length, cols = grid[0].length;
  const cell = (r, c) => (r < 0 || r >= rows || c < 0 || c >= cols ? '#' : grid[r][c]);
  const isSolid = (r, c) => cell(r, c) === '#';
  const isStand = (r, c) => { const ch = cell(r, c); return ch === '#' || ch === '='; };
  const worldH = rows * T;
  const groundY = (r, c) => {
    for (let rr = r + 1; rr < rows; rr++) if (isStand(rr, c)) return rr * T;
    return worldH;
  };
  const spanAt = (rr, c) => {
    let a = c, b = c;
    while (a > 0 && isStand(rr, a - 1) && !isSolid(rr - 1, a - 1)) a--;
    while (b < cols - 1 && isStand(rr, b + 1) && !isSolid(rr - 1, b + 1)) b++;
    return [a * T + 14, (b + 1) * T - 14];
  };
  const findChar = (ch) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === ch) return { r, c };
    return null;
  };
  // Cổng thật sự dựng trong game (xem WorldMap.buildPortals): quái không đi sát cổng
  const gm = meta.gate;
  const portals = [];
  for (const ch of Object.keys(meta.portals || {}).filter((k) => !gm || k === '<' || k === gm)) {
    const pos = findChar(ch);
    if (pos) portals.push({ x: pos.c * T + T / 2 });
  }
  // Chỗ xuất hiện quái, theo đúng thứ tự dựng của client (từng ký hiệu, quét từng hàng)
  const spawns = [];
  for (const ch in meta.spawns || {}) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === ch) spawns.push({ id: meta.spawns[ch], r, c });
  }
  return { rows, cols, worldW: cols * T, worldH, groundY, spanAt, portals, spawns };
}

module.exports = { load, T };
