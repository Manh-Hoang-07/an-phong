/*
 * Chuyển gói "FREE 2D Sideview Halberd Warrior" (Engvee, https://engvee.itch.io/free-sideview, x320p_Spritesheets) thành bộ hình nhân vật
 * public/assets/chars/<id>/<hoạt ảnh>.png và in dòng cấu hình cho Sprites.CHARS (public/js/art/sprites.js).
 *
 *   node server/tools/engvee-halberd.js --dry          → chỉ in số đo
 *   node server/tools/engvee-halberd.js [id] [--dry]   → ghi bộ hình (mặc định id = toan_nang)
 *
 * Nguồn: assets_raw/engvee/halberd/x320p_Spritesheets/Platformer_<Tên>_Body.png (giải nén gói gốc vào đó). Mỗi sheet là lưới ô 320×240 (6 hoặc 4–5 cột × 4 hàng),
 * nhân vật quay mặt sang PHẢI (như các nhân vật khác của game). Gói quay 30 khung/giây nên chỉ lấy một số khung cho mỗi hoạt ảnh (bớt bộ nhớ ảnh).
 * Giấy phép Engvee: dùng thương mại không giới hạn dự án, được chỉnh sửa, không bán lại / cho người dùng tải lại hình; ghi công không bắt buộc
 * (vẫn ghi trong public/assets/CREDITS.txt).
 *
 * Hộp cắt là hộp bao chung của mọi khung đã chọn; cx = tâm thân, fy = mép chân khi đứng yên (xem Sprites.fitPlayer); s đưa thân cao ≈ HEIGHT px logic.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'assets_raw', 'engvee', 'halberd', 'x320p_Spritesheets');
const CW = 320, CH = 240;           // ô nguồn 320×240 (tỉ lệ 4:3)
const HEIGHT = 57;                      // chiều cao thân khi hiển thị (px logic), cùng cỡ các nhân vật khác (56–61)
const ANIMS = {                         // src: tên sheet; frames: khung (đếm hàng trước cột sau); rate: khung/giây
  idle: { src: 'Idle', frames: [0, 4, 8, 12, 16, 20], rate: 10 },
  run: { src: 'Run', frames: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22], rate: 16 },
  jump: { src: 'Jump', frames: [5, 6, 7], rate: 10 },
  fall: { src: 'Jump', frames: [8, 9, 10], rate: 10 },
  attack1: { src: 'Attack1', frames: [1, 2, 3, 4, 6, 8, 11, 14], rate: 20 },     // đâm tới rồi quét thấp
  attack2: { src: 'Attack2', frames: [2, 3, 5, 6, 7, 8, 12, 16], rate: 20 },     // giơ cao bổ xuống
  attack3: { src: 'Attack3', frames: [1, 3, 5, 7, 9, 11, 14, 17], rate: 20 },    // đâm thẳng
  hit: { src: 'Hit', frames: [0, 2, 4, 6, 9, 12], rate: 12 },
  death: { src: 'Death', frames: [1, 3, 5, 7, 9, 11, 13, 23], rate: 10 },
};

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const id = args.find(a => !a.startsWith('--')) || 'toan_nang';

const sheets = {};
for (const a of new Set(Object.values(ANIMS).map(x => x.src))) sheets[a] = decode(path.join(SRC, `Platformer_${a}_Body.png`));
const rect = (src, fr) => { const im = sheets[src], cols = Math.floor(im.W / CW); return { im, x: (fr % cols) * CW, y: Math.floor(fr / cols) * CH }; };
const box = (list, thr) => {
  let x0 = CW, x1 = -1, y0 = CH, y1 = -1;
  for (const [src, fr] of list) {
    const { im, x, y } = rect(src, fr);
    for (let yy = 0; yy < CH; yy++) for (let xx = 0; xx < CW; xx++) if (im.px[((y + yy) * im.W + x + xx) * 4 + 3] > thr) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, yy); y1 = Math.max(y1, yy); }
  }
  return { x0, x1, y0, y1 };
};
const all = Object.values(ANIMS).flatMap(a => a.frames.map(f => [a.src, f]));
const full = box(all, 8), idle = box(ANIMS.idle.frames.map(f => ['Idle', f]), 40);
const x0 = Math.max(0, full.x0 - 1), y0 = Math.max(0, full.y0 - 1), x1 = Math.min(CW, full.x1 + 2), y1 = Math.min(CH, full.y1 + 2);
const fw = x1 - x0, fh = y1 - y0;
const cx = Math.round((idle.x0 + idle.x1 + 1) / 2 - x0), fy = idle.y1 + 1 - y0;
const bodyH = idle.y1 - idle.y0 + 1, s = Math.round(HEIGHT / bodyH * 1000) / 1000;
const frames = Object.values(ANIMS).reduce((n, a) => n + a.frames.length, 0);
console.log(`${id}: khung ${fw}x${fh} · cx ${cx} · fy ${fy} · thân ${idle.x1 - idle.x0 + 1}x${bodyH} · s ${s} · ${frames} khung · ảnh giải nén ${(frames * fw * fh * 4 / 1048576).toFixed(1)} MB`);
if (dry) process.exit(0);

const dir = path.join(ROOT, 'public', 'assets', 'chars', id);
fs.mkdirSync(dir, { recursive: true });
let disk = 0;
const anims = {};
for (const [name, a] of Object.entries(ANIMS)) {
  const W = fw * a.frames.length, px = Buffer.alloc(W * fh * 4);
  a.frames.forEach((fr, k) => {
    const { im, x, y } = rect(a.src, fr);
    for (let yy = 0; yy < fh; yy++) im.px.copy(px, (yy * W + k * fw) * 4, ((y + y0 + yy) * im.W + x + x0) * 4, ((y + y0 + yy) * im.W + x + x0 + fw) * 4);
  });
  const buf = encode(W, fh, px);
  disk += buf.length;
  fs.writeFileSync(path.join(dir, name + '.png'), buf);
  anims[name] = [a.frames.length, a.rate];
}
console.log(`Đã ghi ${Object.keys(ANIMS).length} ảnh (${(disk / 1048576).toFixed(2)} MB file) vào public/assets/chars/${id}/`);
console.log(`\n    ${id}: { fw: ${fw}, fh: ${fh}, cx: ${cx}, fy: ${fy}, s: ${s}, hd: true, combo: ['attack1', 'attack2', 'attack3'],\n      anims: { ${Object.entries(anims).map(([k, v]) => `${k}: [${v[0]}, ${v[1]}]`).join(', ')} } },`);
