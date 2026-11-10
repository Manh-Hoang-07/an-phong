/*
 * Chuyển gói "FREE 2D Sideview Skeleton" (Engvee, https://engvee.itch.io/free-2d-side-skeleton, cỡ x384p) thành bộ hình quái
 * public/assets/mobs/<id>/{idle,run,attack,hit,death}.png và in dòng cấu hình cho Sprites.MOBS (public/js/art/sprites.js).
 *
 *   node server/tools/engvee-skeleton.js --dry          → chỉ in số đo
 *   node server/tools/engvee-skeleton.js [id] [--dry]   → ghi bộ hình (mặc định id = skeleton_knight)
 *
 * Nguồn: assets_raw/engvee_skeleton/x/x384p_Spritesheets/<Tên>_Right.png (giải nén gói gốc vào đó). Mỗi sheet là lưới ô 512×384, quay mặt sang PHẢI.
 * Giấy phép Engvee: dùng thương mại không giới hạn dự án, được chỉnh sửa, không bán lại / cho người dùng tải lại hình; ghi công không bắt buộc
 * (vẫn ghi trong public/assets/CREDITS.txt). Hộp cắt là hộp bao chung của mọi khung đã chọn; s đưa thân cao ≈ HEIGHT px logic.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'assets_raw', 'engvee_skeleton', 'x', 'x384p_Spritesheets');
const CW = 512, CH = 384;              // ô nguồn 512×384
const HEIGHT = 80;                     // chiều cao thân khi hiển thị (px logic); trùm "reaper" cũ cao ≈ 82
const ANIMS = {                        // src: tên sheet; frames: khung (đếm hàng trước cột sau); rate: khung/giây
  idle: { src: 'Idle_Simple', frames: [0, 3, 6, 9, 12, 15, 18, 21], rate: 8 },
  run: { src: 'Run_Forward', frames: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18], rate: 14 },
  attack: { src: 'Attack_Slash_1', frames: [1, 3, 4, 6, 8, 10, 12, 14, 16], rate: 16 },
  hit: { src: 'Impact_Body', frames: [0, 3, 6, 9, 12], rate: 12 },
  death: { src: 'Death_Forward', frames: [0, 4, 8, 12, 16, 20, 25, 29], rate: 10 },
};

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const id = args.find(a => !a.startsWith('--')) || 'skeleton_knight';

const sheets = {};
for (const a of new Set(Object.values(ANIMS).map(x => x.src))) sheets[a] = decode(path.join(SRC, `${a}_Right.png`));
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
const full = box(all, 8), idle = box(ANIMS.idle.frames.map(f => ['Idle_Simple', f]), 40);
const x0 = Math.max(0, full.x0 - 1), y0 = Math.max(0, full.y0 - 1), x1 = Math.min(CW, full.x1 + 2), y1 = Math.min(CH, full.y1 + 2);
const fw = x1 - x0, fh = y1 - y0;
const cx = Math.round((idle.x0 + idle.x1 + 1) / 2 - x0), fy = idle.y1 + 1 - y0;
const bodyH = idle.y1 - idle.y0 + 1, s = Math.round(HEIGHT / bodyH * 1000) / 1000;
const frames = Object.values(ANIMS).reduce((n, a) => n + a.frames.length, 0);
console.log(`${id}: khung ${fw}x${fh} · cx ${cx} · fy ${fy} · thân ${idle.x1 - idle.x0 + 1}x${bodyH} · s ${s} · ${frames} khung · ảnh giải nén ${(frames * fw * fh * 4 / 1048576).toFixed(1)} MB`);
if (dry) process.exit(0);

const dir = path.join(ROOT, 'public', 'assets', 'mobs', id);
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
console.log(`Đã ghi ${Object.keys(ANIMS).length} ảnh (${(disk / 1048576).toFixed(2)} MB file) vào public/assets/mobs/${id}/`);
console.log(`\n    ${id}: { fw: ${fw}, fh: ${fh}, rw: 82, cx: ${cx}, fy: ${fy}, hd: true, s: ${s}, bw: 30, bh: 64,\n      anims: { ${Object.entries(anims).map(([k, v]) => `${k}: [${v[0]}, ${v[1]}]`).join(', ')} } },`);
