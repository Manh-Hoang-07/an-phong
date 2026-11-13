/*
 * Kiểm tra bộ hình quái:  npm run check:mobs   (thêm --strict để báo lỗi khi còn quái dùng chung hình)
 *  1. Mỗi quái dùng bộ hình nào (def.sprite riêng, hay mượn theo def.look), bộ nào đang bị nhiều quái dùng chung.
 *  2. File ảnh của từng bộ hình có đủ không, kích thước có khớp số khung khai báo trong Sprites.MOBS không.
 * Quái được phép dùng chung hình (cùng một nhân vật xuất hiện nhiều lần) khai báo trong SHARED_OK.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GameData = require('../../../shared');

const ROOT = path.join(__dirname, '..', '..', '..');
const SHARED_OK = [['lam_suong', 'lam_suong_2']];

// sprites.js là file cho trình duyệt: chạy trong hộp cát để lấy ra bảng MOBS / LOOK / sheetOf
const src = fs.readFileSync(path.join(ROOT, 'public/js/art/sprites.js'), 'utf8');
const Sprites = vm.runInNewContext(src + '\n;Sprites', { GameData, window: {}, document: {} });

// Kích thước ảnh PNG (đọc thẳng phần đầu file)
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const strict = process.argv.includes('--strict');
let errors = 0;

// ---- 1. File ảnh của từng bộ hình
for (const [id, m] of Object.entries(Sprites.MOBS)) {
  for (const [anim, [n]] of Object.entries(m.anims)) {
    const file = path.join(ROOT, 'public/assets/mobs', id, anim + '.png');
    if (!fs.existsSync(file)) { console.log(`✗ thiếu ảnh: mobs/${id}/${anim}.png`); errors++; continue; }
    const { w, h } = pngSize(file);
    const frames = Math.floor(w / m.fw) * Math.floor(h / m.fh);
    if (frames < n) { console.log(`✗ mobs/${id}/${anim}.png chỉ có ${frames} khung (${w}x${h}, khung ${m.fw}x${m.fh}) nhưng khai báo ${n}`); errors++; }
  }
}

// ---- 2. Quái → bộ hình
const bySheet = {};
for (const [id, def] of Object.entries(GameData.MONSTERS)) {
  const sheet = Sprites.sheetOf(def);
  if (!sheet) { console.log(`✗ ${id} (${def.name}) không có bộ hình (look: ${def.look})`); errors++; continue; }
  if (def.sprite && !Sprites.MOBS[def.sprite]) { console.log(`✗ ${id} khai báo sprite '${def.sprite}' nhưng Sprites.MOBS không có bộ này`); errors++; }
  (bySheet[sheet] = bySheet[sheet] || []).push({ id, def, own: !!(def.sprite && Sprites.MOBS[def.sprite]) });
}

const allowed = (list) => SHARED_OK.some(g => list.every(x => g.includes(x.id)));
const shared = Object.entries(bySheet).filter(([, list]) => list.length > 1 && !allowed(list))
  .sort((a, b) => b[1].length - a[1].length);
const total = Object.keys(GameData.MONSTERS).length;
const unique = Object.values(bySheet).filter(l => l.length === 1 || allowed(l)).reduce((s, l) => s + l.length, 0);

console.log(`\n${total} quái · ${Object.keys(bySheet).length} bộ hình đang dùng · ${unique} quái có hình không trùng`);
if (shared.length) {
  console.log(`\nBộ hình đang bị dùng chung (${shared.length}):`);
  for (const [sheet, list] of shared) {
    console.log(`  ${sheet} × ${list.length}`);
    for (const { id, def, own } of list) console.log(`     - ${id} (${def.name}, cấp ${def.level})${own ? '' : `  ← mượn theo look '${def.look}'`}`);
  }
} else console.log('Không còn quái nào dùng chung hình.');

if (errors) { console.log(`\n${errors} lỗi.`); process.exit(1); }
if (strict && shared.length) process.exit(1);
