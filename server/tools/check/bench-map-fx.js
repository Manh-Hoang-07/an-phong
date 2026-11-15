'use strict';
/*
 * Đếm "vật thể hiệu ứng" của từng bản đồ — thứ quyết định máy khách có lag hay không.
 *   node server/tools/check/bench-map-fx.js
 *
 * Dựa đúng luật trong code:
 *   - Cỏ lay (map.js buildGrass): map có look.grassSway + theme forest + không có bits
 *     → mỗi ô đất lộ mặt, hash<=44, và key là d_grass/d_flower thì thành 1 sprite RIÊNG + 1 tween lặp vô hạn.
 *   - Cây đung đưa (map.js): look.sway + theme forest/city → mỗi cây 1 tween lặp vô hạn.
 *   - Sương (juice.js setupWeather): weather 'fog' → 3 ảnh fx_fog + 3 tween 16-22 giây.
 *   - Lá bay: look.leaves → 1 hệ hạt, tối đa 24 hạt.
 *   - Hạt sáng (mote): look.moteN ?? 14, mỗi hạt 1 tween lặp vô hạn.
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..', '..');
const G = require(path.join(ROOT, 'shared'));
const MAPS_DIR = path.join(ROOT, 'shared', 'maps');

// ---- Đọc dữ liệu look từ map_looks.js (parse thô, đủ dùng)
const looksSrc = fs.readFileSync(path.join(ROOT, 'public', 'js', 'scene', 'map_looks.js'), 'utf8');
const THEME = {};
const themeBlock = looksSrc.slice(looksSrc.indexOf('THEME: {'), looksSrc.indexOf('\n  },', looksSrc.indexOf('THEME: {')));
for (const m of themeBlock.matchAll(/^\s{4}(\w+):\s*\{([^}]*)\}/gm)) {
  const body = m[2];
  const w = (body.match(/weather:\s*'(\w+)'/) || [])[1] || 'none';
  THEME[m[1]] = { weather: w };
}
const MAPS_LOOK = {};
const mapsBlock = looksSrc.slice(looksSrc.indexOf('MAPS: {'), looksSrc.indexOf('\n  },', looksSrc.indexOf('MAPS: {')));
for (const m of mapsBlock.matchAll(/^\s{4}(\w+):\s*\{([^}]*)\}/gm)) {
  const body = m[2];
  const o = {};
  const w = body.match(/weather:\s*'(\w+)'/); if (w) o.weather = w[1];
  const mn = body.match(/moteN:\s*(\d+)/); if (mn) o.moteN = +mn[1];
  if (/sway:\s*true/.test(body)) o.sway = true;
  if (/grassSway:\s*true/.test(body)) o.grassSway = true;
  if (/leaves:\s*\[/.test(body)) o.leaves = true;
  MAPS_LOOK[m[1]] = o;
}

// ---- Đọc lưới map
function grid(mapId) {
  const f = path.join(MAPS_DIR, mapId + '.txt');
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => l.length);
}
// Ký tự coi là đất đặc (theo mapgrid: không phải không khí)
const AIR = new Set(['.', ' ']);

function countGrass(g, cols, rows) {
  // Lặp đúng như buildGrass: ô đặc và ô phía trên KHÔNG đặc
  let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const solid = !AIR.has(g[r]?.[c] ?? '.');
    const upSolid = !AIR.has(g[r - 1]?.[c] ?? '.');
    if (!solid || upSolid) continue;
    const h = (r * 71 + c * 137) % 100;
    if (h > 44) continue;
    n++;
  }
  return n;
}

const rows = [];
for (const mapId of Object.keys(G.MAPS)) {
  const g = grid(mapId);
  if (!g) continue;
  const rowsN = g.length, cols = Math.max(...g.map((l) => l.length));
  const theme = G.MAPS[mapId].theme;
  const look = { ...(THEME[theme] || { weather: 'none' }), ...(MAPS_LOOK[mapId] || {}) };
  const weather = look.weather || 'none';

  const grassCells = countGrass(g, cols, rowsN);
  // Chỉ map forest + grassSway + không bits mới tách cỏ thành sprite riêng
  const grassSprites = (look.grassSway && theme === 'forest') ? grassCells : 0;

  const fogLayers = weather === 'fog' ? 3 : 0;
  const moteN = look.moteN ?? 14;
  const leafSystem = look.leaves ? 24 : 0;      // maxParticles
  const swayTrees = look.sway && (theme === 'forest' || theme === 'city') ? 1 : 0; // ước lượng: có bật

  // Tween lặp vô hạn = thứ chạy mỗi khung hình mãi mãi
  const infiniteTweens = grassSprites + fogLayers + moteN + swayTrees;

  rows.push({
    mapId, theme, weather, cols, rowsN,
    cells: cols * rowsN,
    grassCells, grassSprites, fogLayers, moteN, leafSystem,
    infiniteTweens,
  });
}

rows.sort((a, b) => b.infiniteTweens - a.infiniteTweens);

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

console.log('=== Tween lặp vô hạn + hệ hạt của từng bản đồ ===');
console.log('(tween lặp vô hạn chạy MỖI KHUNG HÌNH, mãi mãi — đây là chi phí CPU máy khách)\n');
console.log(`${pad('map', 15)} ${pad('theme', 8)} ${pad('weather', 8)} ${num('cỏ', 5)} ${num('sương', 6)} ${num('hạt', 5)} ${num('lá', 4)} ${num('TWEEN', 6)}`);
console.log('-'.repeat(70));
for (const r of rows.slice(0, 20)) {
  console.log(`${pad(r.mapId, 15)} ${pad(r.theme, 8)} ${pad(r.weather, 8)} ${num(r.grassSprites, 5)} ${num(r.fogLayers, 6)} ${num(r.moteN, 5)} ${num(r.leafSystem, 4)} ${num(r.infiniteTweens, 6)}`);
}

const rung = rows.find((r) => r.mapId === 'rung');
console.log('\n=== Rừng Sương (rung) ===');
console.log(`  kích thước: ${rung.cols} × ${rung.rowsN} = ${rung.cells} ô`);
console.log(`  cỏ tách thành sprite riêng: ${rung.grassSprites} (mỗi cái 1 tween lặp)`);
console.log(`  lớp sương: ${rung.fogLayers} (mỗi lớp 1 tween lặp)`);
console.log(`  hạt sáng: ${rung.moteN} (mỗi hạt 1 tween lặp)`);
console.log(`  lá bay: hệ hạt tối đa ${rung.leafSystem} hạt`);
console.log(`  → ${rung.infiniteTweens} tween lặp vô hạn`);

const avg = rows.reduce((a, r) => a + r.infiniteTweens, 0) / rows.length;
console.log(`\nTrung bình toàn bộ ${rows.length} map: ${avg.toFixed(0)} tween lặp vô hạn`);
console.log(`Rừng Sương gấp ${(rung.infiniteTweens / avg).toFixed(1)}× mức trung bình`);

const heavier = rows.filter((r) => r.infiniteTweens > rung.infiniteTweens);
console.log(`\nMap nặng hơn Rừng Sương: ${heavier.length ? heavier.map((r) => r.mapId + '(' + r.infiniteTweens + ')').join(', ') : 'không có'}`);

console.log('\n=== Các map nặng tiếp theo ===');
for (const r of rows.slice(1, 8)) {
  console.log(`  ${pad(r.mapId, 15)} ${num(r.infiniteTweens, 4)} tween  (cỏ ${r.grassSprites}, sương ${r.fogLayers}, hạt ${r.moteN}, lá ${r.leafSystem})`);
}
