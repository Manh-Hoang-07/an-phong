'use strict';
/*
 * Đếm ảnh nền THẬT SỰ được dùng, và ảnh nằm mồ côi.
 *   node server/tools/check/bench-bg-usage.js
 *
 * Cách nhận: mọi chuỗi dạng '<pack>/<layer>' trong map_scenes.js, map_looks.js
 * (sky: 'misty/sky', src: 'vamp3/far', pack: 'night').
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..', '..');
const BG = path.join(ROOT, 'public', 'assets', 'bg');

const files = [
  path.join(ROOT, 'public', 'js', 'scene', 'map_scenes.js'),
  path.join(ROOT, 'public', 'js', 'scene', 'map_looks.js'),
];

const used = new Set();
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  // '<pack>/<layer>'  (sky: 'misty/sky', src: 'vamp3/far')
  for (const m of s.matchAll(/'([a-z][a-z0-9_]*)\/(sky|far|mid|near)'/g)) used.add(m[1]);
  // pack: 'night'
  for (const m of s.matchAll(/pack:\s*'([a-z][a-z0-9_]*)'/g)) used.add(m[1]);
}
// PACKS khai báo cũng là dùng được (có thể map khác tham chiếu)
const looks = fs.readFileSync(files[1], 'utf8');
const packBlock = looks.slice(looks.indexOf('PACKS: {'), looks.indexOf('\n  },', looks.indexOf('PACKS: {')));
for (const m of packBlock.matchAll(/^\s{4}(\w+):\s*\{/gm)) used.add(m[1]);

const dirs = fs.readdirSync(BG).filter((d) => fs.statSync(path.join(BG, d)).isDirectory());
const sizeOf = (d) => {
  let n = 0, bytes = 0;
  for (const f of fs.readdirSync(path.join(BG, d))) { const s = fs.statSync(path.join(BG, d, f)); n++; bytes += s.size; }
  return { n, bytes };
};
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';

const alive = [], orphan = [];
for (const d of dirs) (used.has(d) ? alive : orphan).push({ d, ...sizeOf(d) });
const sum = (a) => a.reduce((x, r) => x + r.bytes, 0);

console.log(`Bộ nền được tham chiếu: ${[...used].sort().join(', ')}\n`);
console.log(`ĐANG DÙNG: ${alive.length} bộ, ${sum(alive) ? mb(sum(alive)) : '0 MB'}`);
for (const r of alive.sort((a, b) => b.bytes - a.bytes)) console.log(`  ${r.d.padEnd(12)} ${String(r.n).padStart(2)} file  ${mb(r.bytes).padStart(8)}`);
console.log(`\nMỒ CÔI: ${orphan.length} bộ, ${mb(sum(orphan))}`);
for (const r of orphan.sort((a, b) => b.bytes - a.bytes).slice(0, 15)) console.log(`  ${r.d.padEnd(12)} ${String(r.n).padStart(2)} file  ${mb(r.bytes).padStart(8)}`);
if (orphan.length > 15) console.log(`  ... và ${orphan.length - 15} bộ nữa`);

const total = sum(alive) + sum(orphan);
console.log('\n--- Tổng ---');
console.log(`Tất cả ảnh nền: ${mb(total)} (${dirs.length} bộ)`);
console.log(`Đang dùng:      ${mb(sum(alive))}`);
console.log(`Mồ côi:         ${mb(sum(orphan))} (${total ? (sum(orphan) / total * 100).toFixed(0) : 0}%)`);
