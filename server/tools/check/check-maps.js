'use strict';
/* Dò bản đồ: quái / NPC / cổng nào người chơi không tới được (bị nhốt trong vùng kín hoặc ở quá cao).
 *   node server/tools/check-maps.js          → tất cả bản đồ
 *   node server/tools/check-maps.js hang     → một bản đồ
 * Mô phỏng vật lý nhảy thật (jump-sim.js), chạy chậm nhất (190 px/s), không tính nút xuống (điện thoại không có). */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../../..');
const G = require(path.join(ROOT, 'shared/index.js'));
const MAPS = G.MAPS, MON = G.MONSTERS;
const only = process.argv[2];
const { simulate, T } = require('./jump-sim');
const SPEED = 190, HIT_DC = 2, HIT_DR = 2;

function load(id) {
  const meta = MAPS[id];
  const raw = fs.readFileSync(path.join(ROOT, 'shared/maps', id + '.txt'), 'utf8').replace(/\r/g, '').split('\n').filter(l => l.length);
  const sc = Math.max(...raw.map(l => l.length)), cols = Math.ceil(sc * 1.5);
  const markers = new Set(['S', ...Object.keys(meta.spawns || {}), ...Object.keys(meta.npcs || {}), ...Object.keys(meta.portals || {}), meta.gate].filter(Boolean));
  const grid = raw.map(line => { const s = line.padEnd(sc, '.').split(''); return Array.from({ length: cols }, (_, col) => { const o = Math.min(sc - 1, Math.floor(col / 1.5)); const ch = s[o]; return markers.has(ch) && col !== Math.ceil(o * 1.5) ? '.' : ch; }); });
  while (grid.length < 17) grid.push(Array(cols).fill('#'));
  return { meta, grid, rows: grid.length, cols, raw };
}

function analyze(id) {
  const M = load(id), { grid, rows, cols, meta } = M;
  const cell = (r, c) => (r < 0 || r >= rows || c < 0 || c >= cols) ? '#' : grid[r][c];
  const solid = (r, c) => cell(r, c) === '#';
  const stand = (r, c) => { const ch = cell(r, c); return ch === '#' || ch === '='; };
  const fits = (r, c) => !solid(r, c) && !solid(r - 1, c);
  const isPos = (r, c) => fits(r, c) && stand(r + 1, c);
  const fall = (r, c, through) => { // rơi từ (r,c) tới khi có chỗ đứng
    if (!fits(r, c)) return null;
    let first = true;
    while (r < rows) { if (stand(r + 1, c) && !(first && through)) return [r, c]; if (solid(r + 1, c)) return null; r++; first = false; }
    return null;
  };
  const key = (r, c) => r * 10000 + c;
  let start = null;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === 'S') start = [r, c];
  if (!start) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === '<') start = start || [r, c];
  const s0 = fall(start[0], start[1]);
  // Đi tới được: mô phỏng vật lý nhảy thật (xem jump-sim.js). SPEED nhỏ nhất của nhân vật = 190 px/s.
  const sim = simulate(grid, rows, cols, start, SPEED);
  const seen = new Set(), tileOf = (n) => [n.y / T - 1, Math.floor(n.x / T)];
  for (const n of sim.nodes.values()) seen.add(key(...tileOf(n)));
  // Ô khí liên thông (bay được) từ chỗ đứng của người chơi
  const air = new Set(), aq = [s0]; air.add(key(...s0));
  while (aq.length) { const [r, c] = aq.shift(); for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nr = r + dr, nc = c + dc; if (!solid(nr, nc) && nr >= 0 && nr < rows && nc >= 0 && nc < cols && !air.has(key(nr, nc))) { air.add(key(nr, nc)); aq.push([nr, nc]); } } }
  const reachNear = (r, c) => { for (let dr = -HIT_DR; dr <= HIT_DR; dr++) for (let dc = -HIT_DC; dc <= HIT_DC; dc++) if (seen.has(key(r + dr, c + dc))) return true; return false; };
  // Đường quay lại: từ mọi chỗ đứng có về được điểm xuất hiện (cổng '<') không? Không thì là đường MỘT CHIỀU (nhảy / rơi xuống rồi kẹt)
  const rev = new Map();
  for (const [a2, set] of sim.edges) for (const b2 of set) (rev.get(b2) || rev.set(b2, []).get(b2)).push(a2);
  const backIds = new Set([sim.start]), bq = [sim.start];
  while (bq.length) { const n = bq.pop(); for (const p of rev.get(n) || []) if (!backIds.has(p)) { backIds.add(p); bq.push(p); } }
  const oneWay = [...sim.nodes.entries()].filter(([id]) => !backIds.has(id)).map(([, n]) => tileOf(n));
  const issues = [];
  if (oneWay.length) {
    const cols1 = oneWay.map(p => p[1]), c0 = Math.min(...cols1), c1 = Math.max(...cols1);
    const marks = [];
    for (const [r, c] of oneWay) for (const dr of [0, -1]) { const ch = grid[r + dr]?.[c]; if (ch && (/[A-Za-z]/.test(ch) || '<>()[]'.includes(ch)) && ch !== 'S') marks.push(ch); }
    issues.push(`[1 CHIỀU] ${oneWay.length} chỗ đứng (cột ${Math.floor(c0 / 1.5) + 1}–${Math.floor(c1 / 1.5) + 1}) vào được nhưng KHÔNG quay lại được${marks.length ? ' — có ' + [...new Set(marks)].join(' ') : ''}`);
  }
  for (const ch in meta.spawns || {}) {
    const mid = meta.spawns[ch], def = MON[mid] || {};
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === ch) {
      const src = `${r + 1}:${Math.floor(c / 1.5) + 1}`; // hàng:cột trong file .txt (đếm từ 1)
      if (!air.has(key(r, c))) { issues.push(`[KÍN]   ${ch}=${def.name || mid}${def.boss ? ' (TRÙM)' : ''} tại ${src} — nằm trong vùng bị bịt kín`); continue; }
      if (def.fly) continue;
      const rest = fall(r, c) || [r, c];
      // quái đi lại được trên bục của nó
      let ok = false;
      for (const d of [0, -1, 1]) { let cc = rest[1]; while (true) { if (reachNear(rest[0], cc)) { ok = true; break; } if (d === 0) break; cc += d; if (!isPos(rest[0], cc)) break; } if (ok) break; }
      if (!ok) issues.push(`[CAO]   ${ch}=${def.name || mid}${def.boss ? ' (TRÙM)' : ''} tại ${src} — người chơi không leo/nhảy tới được bục của quái`);
    }
  }
  for (const ch of [...Object.keys(meta.portals || {}), ...Object.keys(meta.npcs || {})]) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === ch) {
      const rest = fall(r, c) || [r, c];
      if (!reachNear(rest[0], rest[1])) issues.push(`[KHÁC]  '${ch}' (${meta.portals?.[ch] ? 'cổng → ' + meta.portals[ch].to : 'NPC ' + meta.npcs[ch]}) tại ${r + 1}:${Math.floor(c / 1.5) + 1} — không tới được`);
    }
  }
  return issues;
}

let total = 0;
for (const id of Object.keys(MAPS)) {
  if (only && id !== only) continue;
  if (!fs.existsSync(path.join(ROOT, 'shared/maps', id + '.txt'))) continue;
  const iss = analyze(id);
  if (iss.length) { total += iss.length; console.log(`\n== ${id} (${MAPS[id].name})`); iss.forEach(x => console.log('  ' + x)); }
}
console.log(`\nTổng: ${total} vấn đề`);
process.exitCode = total ? 1 : 0;
