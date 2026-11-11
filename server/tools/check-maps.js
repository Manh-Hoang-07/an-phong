'use strict';
/* Dò bản đồ: quái / NPC / cổng nào người chơi không tới được (bị nhốt trong vùng kín hoặc ở quá cao).
 *   node server/tools/check-maps.js          → tất cả bản đồ
 *   node server/tools/check-maps.js hang     → một bản đồ
 * Mô phỏng gần đúng: người cao 2 ô, nhảy cao 3 ô, lướt ngang tối đa 4 ô (đơn vị ô sau khi giãn cột 1,5 lần). */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../..');
const G = require(path.join(ROOT, 'shared/index.js'));
const MAPS = G.MAPS, MON = G.MONSTERS;
const only = process.argv[2];
const JUMP_ROWS = 3, JUMP_COLS = 4, HIT_DC = 2, HIT_DR = 2;

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
  const seen = new Set([key(...s0)]), q = [s0];
  const push = (p) => { if (p && !seen.has(key(...p))) { seen.add(key(...p)); q.push(p); } };
  while (q.length) {
    const [r, c] = q.shift();
    for (const d of [-1, 1]) if (fits(r, c + d)) push(fall(r, c + d));
    if (cell(r + 1, c) === '=') push(fall(r + 1, c, false));
    // nhảy: lên thẳng h hàng rồi lướt ngang, rồi rơi
    for (let h = 1; h <= JUMP_ROWS; h++) {
      if (!fits(r - h, c)) break;
      for (const d of [-1, 1]) for (let k = 1; k <= JUMP_COLS; k++) {
        if (!fits(r - h, c + d * k)) break;
        push(fall(r - h, c + d * k));
      }
      if (isPos(r - h, c)) push([r - h, c]);
    }
  }
  // Ô khí liên thông (bay được) từ chỗ đứng của người chơi
  const air = new Set(), aq = [s0]; air.add(key(...s0));
  while (aq.length) { const [r, c] = aq.shift(); for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nr = r + dr, nc = c + dc; if (!solid(nr, nc) && nr >= 0 && nr < rows && nc >= 0 && nc < cols && !air.has(key(nr, nc))) { air.add(key(nr, nc)); aq.push([nr, nc]); } } }
  const reachNear = (r, c) => { for (let dr = -HIT_DR; dr <= HIT_DR; dr++) for (let dc = -HIT_DC; dc <= HIT_DC; dc++) if (seen.has(key(r + dr, c + dc))) return true; return false; };
  const issues = [];
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
