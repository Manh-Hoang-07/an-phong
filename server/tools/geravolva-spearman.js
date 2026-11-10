/*
 * Chuyển gói "Dark Fantasy Enemy #1 (FREE)" (Volva Studio / geravolva, https://geravolva.itch.io/dark-fantasy-enemy-1-animations, Individual_Spritesheets)
 * thành bộ hình quái public/assets/mobs/<id>/{idle,run,attack,hit,death}.png và in dòng cấu hình cho Sprites.MOBS (public/js/art/sprites.js).
 *
 *   node server/tools/geravolva-spearman.js --dry          → chỉ in số đo
 *   node server/tools/geravolva-spearman.js [id] [--dry]   → ghi bộ hình (mặc định id = spearman)
 *
 * Nguồn: assets_raw/geravolva_enemy1/x/Spritesheets/Individual_Spritesheets/<Tên>.png (ô 384×384, một hàng, nhân vật quay mặt sang PHẢI).
 * Gói không có idle/chạy riêng: idle = các khung đứng/đi chậm của Walk (rate thấp), run = Walk. Giấy phép: dùng thương mại và chỉnh sửa được,
 * không phân phối lại, ghi công không bắt buộc (vẫn ghi trong public/assets/CREDITS.txt).
 * Hộp cắt là hộp bao chung của mọi khung đã chọn; s đưa thân cao ≈ HEIGHT px logic.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'assets_raw', 'geravolva_enemy1', 'x', 'Spritesheets', 'Individual_Spritesheets');
const C = 384;                         // ô nguồn 384×384
const HEIGHT = 60;                     // chiều cao thân khi hiển thị (px logic); lính giáo cũ cao ≈ 59
const ANIMS = {                        // src: tên sheet; frames: chỉ số ô; rate: khung/giây
  idle: { src: 'Walk', frames: [0, 1, 2, 3, 4, 5], rate: 6 },
  run: { src: 'Walk', frames: [0, 1, 2, 3, 4, 5], rate: 10 },
  attack: { src: 'Light_Attack', frames: [0, 1, 2, 3, 4], rate: 14 },
  hit: { src: 'Stun', frames: [0, 1, 2, 3], rate: 12 },
  death: { src: 'Death', frames: [0, 1, 2, 3, 4, 6, 7, 8], rate: 10 },
};

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const id = args.find(a => !a.startsWith('--')) || 'spearman';

const sheets = {};
for (const a of new Set(Object.values(ANIMS).map(x => x.src))) sheets[a] = decode(path.join(SRC, `${a}.png`));
const bbox = (im, fr, thr) => {
  let x0 = C, x1 = -1, y0 = C, y1 = -1;
  for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (im.px[(y * im.W + fr * C + x) * 4 + 3] > thr) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1 };
};
let full = { x0: C, x1: -1, y0: C, y1: -1 };
for (const a of Object.values(ANIMS)) for (const f of a.frames) { const b = bbox(sheets[a.src], f, 8); full = { x0: Math.min(full.x0, b.x0), x1: Math.max(full.x1, b.x1), y0: Math.min(full.y0, b.y0), y1: Math.max(full.y1, b.y1) }; }
const st = bbox(sheets.Walk, 0, 40);   // thân khi đứng yên
const x0 = Math.max(0, full.x0 - 1), y0 = Math.max(0, full.y0 - 1), x1 = Math.min(C, full.x1 + 2), y1 = Math.min(C, full.y1 + 2);
const fw = x1 - x0, fh = y1 - y0;
const cx = Math.round((st.x0 + st.x1 + 1) / 2 - x0), fy = st.y1 + 1 - y0;
const bodyH = st.y1 - st.y0 + 1, s = Math.round(HEIGHT / bodyH * 1000) / 1000;
const frames = Object.values(ANIMS).reduce((n, a) => n + a.frames.length, 0);
console.log(`${id}: khung ${fw}x${fh} · cx ${cx} · fy ${fy} · thân ${st.x1 - st.x0 + 1}x${bodyH} · s ${s} · ${frames} khung · ảnh giải nén ${(frames * fw * fh * 4 / 1048576).toFixed(1)} MB`);
if (dry) process.exit(0);

const dir = path.join(ROOT, 'public', 'assets', 'mobs', id);
fs.mkdirSync(dir, { recursive: true });
let disk = 0;
const anims = {};
for (const [name, a] of Object.entries(ANIMS)) {
  const W = fw * a.frames.length, px = Buffer.alloc(W * fh * 4);
  const im = sheets[a.src];
  a.frames.forEach((fr, k) => {
    for (let yy = 0; yy < fh; yy++) im.px.copy(px, (yy * W + k * fw) * 4, (((y0 + yy) * im.W) + fr * C + x0) * 4, (((y0 + yy) * im.W) + fr * C + x0 + fw) * 4);
  });
  const buf = encode(W, fh, px);
  disk += buf.length;
  fs.writeFileSync(path.join(dir, name + '.png'), buf);
  anims[name] = [a.frames.length, a.rate];
}
console.log(`Đã ghi ${Object.keys(ANIMS).length} ảnh (${(disk / 1048576).toFixed(2)} MB file) vào public/assets/mobs/${id}/`);
console.log(`\n    ${id}: { fw: ${fw}, fh: ${fh}, rw: 154, cx: ${cx}, fy: ${fy}, hd: true, s: ${s}, bw: 30, bh: 52,\n      anims: { ${Object.entries(anims).map(([k, v]) => `${k}: [${v[0]}, ${v[1]}]`).join(', ')} } },`);
