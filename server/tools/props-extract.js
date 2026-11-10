/*
 * Cắt cảnh trí (cây, tinh thể, bia mộ, đá…) từ các lớp nền có alpha trong assets_raw/bg thành sprite riêng:
 *   public/assets/props/<bộ>/<i>.png   +   public/js/scene/map_props_data.js (danh sách bộ, số sprite, cỡ hiển thị)
 *
 *   node server/tools/props-extract.js            → mọi bộ trong SETS
 *   node server/tools/props-extract.js cactus ... → chỉ các bộ được nêu
 *
 * Cách cắt: quét cột alpha, các cột trống liên tiếp ≥ GAP px tách thành vật thể; mỗi vật thể cắt theo hộp bao,
 * thu về chiều cao h × 2 (game vẽ cảnh trí ở độ nét 2×, hiển thị h). Vật thể quá nhỏ/rộng bị bỏ.
 * Các bộ này chỉ là DỮ LIỆU: thêm bộ mới = thêm một dòng vào SETS rồi chạy lại.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'assets_raw', 'bg');
const OUT = path.join(ROOT, 'public', 'assets', 'props');
const GAP = 12;

// keep = chỉ giữ các vật thể có số thứ tự này (theo thứ tự quét, từ 1); minAspect = rộng/cao tối thiểu (bỏ mảnh mỏng)
// h = chiều cao hiển thị trong game (px logic); files = lớp nguồn (có thể nhiều); minW/minH lọc vật thể nhỏ; max = số tối đa; keep = chỉ giữ các chỉ số này (sau khi sắp theo vị trí)
const SETS = {
  cactus: { h: 96, files: ['craftpix_desert/src/4/4.png'], minW: 80, minH: 120 },
  pine: { h: 150, files: ['craftpix_horizontal/src/PNG/game_background_2/layers/pines.png'], minW: 40, minH: 80 },
  hands: { h: 70, files: ['craftpix_halloween/src/PNG/3_game_background/layers/8.png'], minW: 60, minH: 60 },   // tay trồi từ mộ
  palm: { keep: [1], h: 170, files: ['craftpix_beach/src/PNG/game_background_4/layers/decor.png'], minW: 60, minH: 90 },
  stal: { h: 90, files: ['craftpix_underwater/src/PNG/3_game_background/layers/3.png'], minW: 80, minH: 80 },   // nhũ đá rêu treo từ trần
  vine: { h: 80, files: ['craftpix_underwater/src/PNG/3_game_background/layers/6.png'], minW: 80, minH: 80 },   // dây xoắn xanh ngọc
  rock: { h: 26, files: ['craftpix_elven/src/PNG/game_background_1/layers/ground_decor.png', 'craftpix_elven/src/PNG/game_background_3/layers/ground_decor.png'], minW: 55, minH: 30, minAspect: 0.5 },
};

function downscale(W, H, px, w, h) {   // trung bình theo diện tích, alpha nhân sẵn
  const out = Buffer.alloc(w * h * 4), sx = W / w, sy = H / h;
  for (let y = 0; y < h; y++) {
    const y0 = y * sy, y1 = (y + 1) * sy;
    for (let x = 0; x < w; x++) {
      const x0 = x * sx, x1 = (x + 1) * sx; let r = 0, g = 0, b = 0, a = 0, wt = 0;
      for (let yy = Math.floor(y0); yy < Math.min(H, Math.ceil(y1)); yy++) {
        const wy = Math.min(yy + 1, y1) - Math.max(yy, y0);
        for (let xx = Math.floor(x0); xx < Math.min(W, Math.ceil(x1)); xx++) {
          const ww = wy * (Math.min(xx + 1, x1) - Math.max(xx, x0)), i = (yy * W + xx) * 4, al = px[i + 3] / 255;
          r += px[i] * al * ww; g += px[i + 1] * al * ww; b += px[i + 2] * al * ww; a += al * ww; wt += ww;
        }
      }
      const o = (y * w + x) * 4;
      if (a > 0) { out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); }
      out[o + 3] = Math.round(a / wt * 255);
    }
  }
  return out;
}

const want = process.argv.slice(2);
const data = {};
for (const [name, def] of Object.entries(SETS)) {
  if (want.length && !want.includes(name)) continue;
  const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  let n = 0, accepted = 0;
  for (const rel of def.files) {
    const im = decode(path.join(RAW, rel)), { W, H, px } = im;
    const cols = new Int32Array(W);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 60) cols[x]++;
    const segs = []; let s = -1, gap = 0;
    for (let x = 0; x < W; x++) {
      if (cols[x] > 3) { if (s < 0) s = x; gap = 0; } else if (s >= 0) { gap++; if (gap >= GAP) { segs.push([s, x - gap]); s = -1; gap = 0; } }
    }
    if (s >= 0) segs.push([s, W - 1]);
    for (const [x0, x1] of segs) {
      let y0 = H, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (px[(y * W + x) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y; break; }
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (w < def.minW || h < def.minH || (def.minAspect && w / h < def.minAspect)) continue;
      if (def.keep && !def.keep.includes(accepted + 1)) { accepted++; continue; }
      accepted++;
      const crop = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) px.copy(crop, y * w * 4, ((y0 + y) * W + x0) * 4, ((y0 + y) * W + x0 + w) * 4);
      const th = def.h * 2, tw = Math.max(2, Math.round(w * th / h));
      fs.writeFileSync(path.join(dir, (++n) + '.png'), encode(tw, th, downscale(w, h, crop, tw, th)));
    }
  }
  data[name] = { n, h: def.h };
  console.log(name, n, 'sprite');
}
// Ghi danh sách bộ (gộp với dữ liệu cũ nếu chỉ chạy một phần)
const dataFile = path.join(ROOT, 'public', 'js', 'scene', 'map_props_data.js');
let old = {};
try { old = JSON.parse(fs.readFileSync(dataFile, 'utf8').split('/*DATA*/')[1].split('/*END*/')[0]); } catch (e) { /* chưa có */ }
const merged = Object.assign(old, data);
fs.writeFileSync(dataFile, `'use strict';\n/* SINH TỰ ĐỘNG bởi server/tools/props-extract.js – đừng sửa tay. Bộ cảnh trí ảnh: tên → { n: số sprite, h: chiều cao hiển thị } */\nconst MapProps = { SETS: /*DATA*/${JSON.stringify(merged)}/*END*/ };\n`);
console.log('đã ghi', path.relative(ROOT, dataFile));
