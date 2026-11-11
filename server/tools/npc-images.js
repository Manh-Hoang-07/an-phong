/*
 * Tạo ảnh NPC cho game từ gói "Hearthhands Sampler" (CSAF, https://csaf.itch.io/hearthhands-sampler, dùng thương mại được, không bán lại gói)
 * → public/assets/npcs/<id>.png (một ảnh đứng nhìn sang PHẢI, cắt sát thân, chân chạm đáy ảnh, làm mịn Scale2x).
 *
 *   node server/tools/npc-images.js [id ...]
 *
 * Nguồn: assets_raw/_dl/npc/hearthhands/x/file_20056007/<nhóm>/200x200/frames/<tên>_idle_east_0.png.
 * Chiều cao hiển thị (px logic) khai báo trong public/js/art/characters.js (NPC_IMAGES).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'assets_raw', '_dl', 'npc', 'hearthhands', 'x', 'file_20056007');
const OUT = path.join(ROOT, 'public', 'assets', 'npcs');
const MAP = {
  lao_su: ['03_Watch_And_Ward', 'townCrier'],      // Hội trưởng Khải: người rao tin áo dài đỏ
  tap_hoa: ['02_Market_And_Craft', 'fishmonger'],  // Chủ tiệm Tư: người bán cá, mũ đỏ + xô
  thu_kho: ['01_The_Working_Day', 'farmer'],       // Quản kho Bảo: nông dân
};
const TOL = 36;
const same = (a, i, j) => {
  if (a[i + 3] < 24 && a[j + 3] < 24) return true;
  if (Math.abs(a[i + 3] - a[j + 3]) > 48) return false;
  return Math.abs(a[i] - a[j]) + Math.abs(a[i + 1] - a[j + 1]) + Math.abs(a[i + 2] - a[j + 2]) <= TOL;
};
function scale2x(px, W, H) {
  const out = Buffer.alloc(W * 2 * H * 2 * 4), W2 = W * 2;
  const at = (x, y) => (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4;
  const put = (x, y, s) => { const o = (y * W2 + x) * 4; out[o] = px[s]; out[o + 1] = px[s + 1]; out[o + 2] = px[s + 2]; out[o + 3] = px[s + 3]; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    const cA = same(px, C, A), aB = same(px, A, B), dC = same(px, D, C), bD = same(px, B, D), cD = same(px, C, D);
    put(2 * x, 2 * y, cA && !cD && !aB ? A : P);
    put(2 * x + 1, 2 * y, aB && !cA && !bD ? B : P);
    put(2 * x, 2 * y + 1, dC && !bD && !cA ? C : P);
    put(2 * x + 1, 2 * y + 1, bD && !aB && !dC ? D : P);
  }
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] === 0) out[i] = out[i + 1] = out[i + 2] = 0;
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
for (const [id, [group, name]] of Object.entries(MAP)) {
  if (process.argv.length > 2 && !process.argv.slice(2).includes(id)) continue;
  const im = decode(path.join(SRC, group, '200x200', 'frames', `${name}_idle_east_0.png`));
  let x0 = im.W, x1 = -1, y0 = im.H, y1 = -1;
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (im.px[(y * im.W + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(im.W - 1, x1 + 2); y1 = Math.min(im.H - 1, y1);   // chân chạm đáy ảnh
  const w = x1 - x0 + 1, h = y1 - y0 + 1, px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) im.px.copy(px, y * w * 4, ((y0 + y) * im.W + x0) * 4, ((y0 + y) * im.W + x0 + w) * 4);
  const big = scale2x(px, w, h);
  fs.writeFileSync(path.join(OUT, id + '.png'), encode(w * 2, h * 2, big));
  console.log(`${id}: ${w}x${h} → ${w * 2}x${h * 2} (${name})`);
}
