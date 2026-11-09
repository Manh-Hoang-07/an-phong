/*
 * Cắt phần viền trong suốt thừa của các bộ hình quái (public/assets/mobs/<id>/<hoạt ảnh>.png) cho nhẹ bộ nhớ ảnh / GPU.
 *
 *   node server/tools/trim-mob-sheets.js --dry     → chỉ báo cáo, không ghi gì
 *   node server/tools/trim-mob-sheets.js           → cắt mọi bộ hình tiết kiệm được ≥ 5% diện tích
 *   node server/tools/trim-mob-sheets.js slime ... → chỉ các bộ được nêu
 *
 * Hình hiển thị trong game giữ NGUYÊN từng điểm ảnh, chỉ bỏ phần trong suốt:
 *  - Hộp cắt là hộp bao chung của mọi khung của mọi hoạt ảnh trong bộ (để các hoạt ảnh vẫn cùng cỡ khung).
 *  - Cắt ngang đối xứng hai bên: Phaser lật ngang (flipX) quanh tâm khung, lệch tâm sẽ làm quái nhảy vị trí khi quay đầu.
 *  - Chừa 1 điểm ảnh trong suốt quanh hình (nội suy mượt khi thu nhỏ không hút màu từ khung bên cạnh).
 *  - Cập nhật luôn fw, fh, cx, cy/fy trong Sprites.MOBS (public/js/art/sprites.js) và ghi `rw` = bề rộng khung gốc
 *    (AI quái dùng bề rộng khung để tính tầm đánh, cần giữ nguyên để không đổi lối chơi).
 * Chạy sau mob-sheets.js (bộ vừa sinh lại có số đo gốc, tool này cắt lại từ số đo trong sprites.js).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');
const GameData = require('../../shared');

const ROOT = path.join(__dirname, '..', '..');
const SPRITES = path.join(ROOT, 'public/js/art/sprites.js');
const MOBS_DIR = path.join(ROOT, 'public/assets/mobs');
const MIN_SAVING = 0.05;

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = args.filter(a => !a.startsWith('--'));

const srcText = fs.readFileSync(SPRITES, 'utf8');
const Sprites = vm.runInNewContext(srcText + '\n;Sprites', { GameData, window: {}, document: {} });

// ---------------------------------------------------------------- PNG đọc / ghi (RGBA 8 bit)
function decode(file) {
  const b = fs.readFileSync(file);
  let p = 8, W, H, depth, ctype, pal = null, trns = null; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); depth = d[8]; ctype = d[9]; if (d[12]) throw new Error('PNG xen kẽ chưa hỗ trợ: ' + file); }
    else if (type === 'PLTE') pal = d; else if (type === 'tRNS') trns = d; else if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  if (depth === 16) throw new Error('PNG 16 bit chưa hỗ trợ: ' + file);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  const bpp = Math.max(1, ch * depth / 8), stride = Math.ceil(W * ch * depth / 8);
  const px = Buffer.alloc(W * H * 4); let prev = Buffer.alloc(stride), q = 0;
  for (let y = 0; y < H; y++) {
    const f = raw[q++], line = Buffer.from(raw.subarray(q, q + stride)); q += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      line[i] = v & 255;
    }
    for (let x = 0; x < W; x++) {
      let r, g, bl, al = 255;
      if (ctype === 6) { r = line[x * 4]; g = line[x * 4 + 1]; bl = line[x * 4 + 2]; al = line[x * 4 + 3]; }
      else if (ctype === 2) { r = line[x * 3]; g = line[x * 3 + 1]; bl = line[x * 3 + 2]; }
      else if (ctype === 4) { r = g = bl = line[x * 2]; al = line[x * 2 + 1]; }
      else if (ctype === 3) {
        const idx = depth === 8 ? line[x] : (line[(x * depth) >> 3] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1);
        r = pal[idx * 3]; g = pal[idx * 3 + 1]; bl = pal[idx * 3 + 2]; al = trns && idx < trns.length ? trns[idx] : 255;
      } else { r = g = bl = depth === 8 ? line[x] : ((line[(x * depth) >> 3] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1)) * (255 / ((1 << depth) - 1)); }
      px.set([r, g, bl, al], (y * W + x) * 4);
    }
    prev = line;
  }
  return { W, H, px };
}
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = CRC[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
// Dữ liệu đã lọc theo hàng (mỗi hàng chọn kiểu lọc 0–4 cho nén tốt nhất); bpp = số byte mỗi điểm ảnh
function filtered(data, W, H, bpp) {
  const stride = W * bpp, raw = Buffer.alloc((stride + 1) * H);
  const cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(stride));
  for (let y = 0; y < H; y++) {
    const row = data.subarray(y * stride, (y + 1) * stride), prev = y ? data.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, up = prev ? prev[i] : 0, c = prev && i >= bpp ? prev[i - bpp] : 0, v = row[i];
      const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c);
      cand[0][i] = v; cand[1][i] = (v - a) & 255; cand[2][i] = (v - up) & 255; cand[3][i] = (v - ((a + up) >> 1)) & 255;
      cand[4][i] = (v - (pa <= pb && pa <= pc ? a : pb <= pc ? up : c)) & 255;
    }
    let best = 0, bestSum = Infinity;
    for (let f = 0; f < 5; f++) { let s = 0; for (let i = 0; i < stride; i++) { const v = cand[f][i]; s += v < 128 ? v : 256 - v; } if (s < bestSum) { bestSum = s; best = f; } }
    raw[y * (stride + 1)] = best; cand[best].copy(raw, y * (stride + 1) + 1);
  }
  return raw;
}
// Ghi PNG: dùng bảng màu (≤ 256 màu kể cả độ trong suốt) nếu nhỏ hơn RGBA
function encode(W, H, px) {
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const png = (ctype, raw, extra = []) => {
    const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = ctype;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), ...extra, chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  };
  const rgba = png(6, filtered(px, W, H, 4));
  const pal = new Map(), idx = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) {
    const key = px.readUInt32BE(i * 4);
    let k = pal.get(key);
    if (k === undefined) { if (pal.size >= 256) return rgba; k = pal.size; pal.set(key, k); }
    idx[i] = k;
  }
  const plte = Buffer.alloc(pal.size * 3), trns = Buffer.alloc(pal.size);
  for (const [key, k] of pal) { plte[k * 3] = key >>> 24; plte[k * 3 + 1] = (key >>> 16) & 255; plte[k * 3 + 2] = (key >>> 8) & 255; trns[k] = key & 255; }
  const small = png(3, filtered(idx, W, H, 1), [chunk('PLTE', plte), chunk('tRNS', trns)]);
  return small.length < rgba.length ? small : rgba;
}

// ---------------------------------------------------------------- Phân tích + cắt một bộ hình
function plan(id, m) {
  const { fw, fh } = m;
  const imgs = {};
  let minX = fw, maxX = -1, minY = fh, maxY = -1, opaque = 0;
  for (const a of Object.keys(m.anims)) {
    const file = path.join(MOBS_DIR, id, a + '.png');
    if (!fs.existsSync(file)) return { id, skip: `thiếu ${a}.png` };
    const im = decode(file);
    const cols = Math.floor(im.W / fw), rows = Math.floor(im.H / fh);
    if (!cols || !rows) return { id, skip: `${a}.png nhỏ hơn một khung` };
    imgs[a] = { ...im, cols, rows };
    for (let y = 0; y < rows * fh; y++) for (let x = 0; x < cols * fw; x++) {
      if (im.px[(y * im.W + x) * 4 + 3] === 0) continue;
      opaque++;
      const fx = x % fw, fy = y % fh;
      if (fx < minX) minX = fx; if (fx > maxX) maxX = fx; if (fy < minY) minY = fy; if (fy > maxY) maxY = fy;
    }
  }
  if (maxX < 0) return { id, skip: 'ảnh trống' };
  const side = Math.max(0, Math.min(minX, fw - 1 - maxX) - 1);   // cắt đối xứng hai bên
  const top = Math.max(0, minY - 1), bottom = Math.max(0, fh - 1 - maxY - 1);
  const nfw = fw - 2 * side, nfh = fh - top - bottom;
  const saving = 1 - (nfw * nfh) / (fw * fh);
  return { id, m, imgs, side, top, nfw, nfh, saving, opaque };
}

function build(p) {
  const { m, imgs, side, top, nfw, nfh, opaque } = p, { fw, fh } = m;
  const out = {}; let kept = 0;
  for (const [a, im] of Object.entries(imgs)) {
    const W = im.cols * nfw, H = im.rows * nfh, px = Buffer.alloc(W * H * 4);
    for (let r = 0; r < im.rows; r++) for (let c = 0; c < im.cols; c++) for (let y = 0; y < nfh; y++) {
      const s = ((r * fh + top + y) * im.W + c * fw + side) * 4, d = ((r * nfh + y) * W + c * nfw) * 4;
      im.px.copy(px, d, s, s + nfw * 4);
    }
    for (let i = 3; i < px.length; i += 4) if (px[i]) kept++;
    out[a] = { W, H, px };
  }
  if (kept !== opaque) throw new Error(`${p.id}: cắt mất ${opaque - kept} điểm ảnh không trong suốt`);
  return out;
}

// ---------------------------------------------------------------- Sửa dòng khai báo trong sprites.js
function patchLine(line, p) {
  const num = '(-?\\d+(?:\\.\\d+)?)';
  const sub = (key, fn) => {
    const re = new RegExp(`\\b${key}: ${num}`);
    const mt = re.exec(line);
    if (!mt) return false;
    const v = Math.round(fn(parseFloat(mt[1])) * 1000) / 1000;
    line = line.replace(re, `${key}: ${v}`);
    return true;
  };
  const { fw } = p.m;
  if (!sub('fw', () => p.nfw) || !sub('fh', () => p.nfh)) return null;
  if (!sub('cx', v => v - p.side)) return null;
  const hasCy = sub('cy', v => v - p.top), hasFy = sub('fy', v => v - p.top);
  if (!hasCy && !hasFy) return null;
  if (!/\brw: /.test(line)) line = line.replace(/\bfh: (\d+)/, `fh: $1, rw: ${fw}`);
  return line;
}

// ---------------------------------------------------------------- Chạy
// --reencode: chỉ ghi lại các ảnh bằng kiểu nén tốt hơn (bảng màu nếu ≤ 256 màu), điểm ảnh giữ nguyên; chỉ ghi khi file nhỏ đi
if (args.includes('--reencode')) {
  let d0 = 0, d1 = 0, n = 0;
  for (const [id, m] of Object.entries(Sprites.MOBS)) {
    if (only.length && !only.includes(id)) continue;
    for (const a of Object.keys(m.anims)) {
      const file = path.join(MOBS_DIR, id, a + '.png');
      if (!fs.existsSync(file)) continue;
      const im = decode(file), buf = encode(im.W, im.H, im.px), old = fs.statSync(file).size;
      if (buf.length >= old) continue;
      const back = decode_buf(buf);
      if (back.W !== im.W || back.H !== im.H || !back.px.equals(im.px)) throw new Error(`${id}/${a}: ghi rồi đọc lại không khớp`);
      d0 += old; d1 += buf.length; n++;
      if (!dry) fs.writeFileSync(file, buf);
    }
  }
  console.log(`${dry ? '(--dry) ' : ''}${n} ảnh nhỏ đi: ${(d0 / 1048576).toFixed(2)} MB → ${(d1 / 1048576).toFixed(2)} MB`);
  process.exit(0);
}

const ids = Object.keys(Sprites.MOBS).filter(id => !only.length || only.includes(id));
const plans = ids.map(id => plan(id, Sprites.MOBS[id]));
const lines = srcText.split('\n');
const todo = [], rows = [];
let before = 0, after = 0;
for (const p of plans) {
  if (p.skip) { rows.push({ bộ: p.id, ghi_chú: 'bỏ qua: ' + p.skip }); continue; }
  const area = Object.values(p.imgs).reduce((s, im) => s + im.W * im.H, 0);
  if (p.saving < MIN_SAVING) { rows.push({ bộ: p.id, khung: `${p.m.fw}x${p.m.fh}`, ghi_chú: `giữ nguyên (tiết kiệm ${(p.saving * 100).toFixed(1)}%)` }); continue; }
  const idx = lines.findIndex(l => new RegExp(`^\\s+${p.id}: \\{`).test(l));
  const patched = idx >= 0 ? patchLine(lines[idx], p) : null;
  if (!patched) { rows.push({ bộ: p.id, ghi_chú: 'bỏ qua: không sửa được dòng trong sprites.js' }); continue; }
  p.idx = idx; p.patched = patched;
  before += area * 4; after += area * (1 - p.saving) * 4;
  rows.push({ bộ: p.id, khung: `${p.m.fw}x${p.m.fh}`, 'sau cắt': `${p.nfw}x${p.nfh}`, 'bớt': (p.saving * 100).toFixed(0) + '%', 'cắt ngang mỗi bên': p.side, 'cắt trên': p.top });
  todo.push(p);
}
console.table(rows);
console.log(`Sẽ cắt ${todo.length} bộ: bộ nhớ ảnh ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
if (dry || !todo.length) { if (dry) console.log('(--dry: chưa ghi gì)'); process.exit(0); }

// Dựng + kiểm tra toàn bộ trong bộ nhớ trước, đạt hết mới ghi file
const written = [];
for (const p of todo) {
  const out = build(p);
  for (const [a, o] of Object.entries(out)) {
    const buf = encode(o.W, o.H, o.px);
    const back = decode_buf(buf);
    if (back.W !== o.W || back.H !== o.H || !back.px.equals(o.px)) throw new Error(`${p.id}/${a}: ghi rồi đọc lại không khớp`);
    written.push([path.join(MOBS_DIR, p.id, a + '.png'), buf]);
  }
  lines[p.idx] = p.patched;
}
function decode_buf(buf) {
  const tmp = path.join(require('os').tmpdir(), 'trim-check-' + process.pid + '.png');
  fs.writeFileSync(tmp, buf); const r = decode(tmp); fs.unlinkSync(tmp); return r;
}
let disk0 = 0, disk1 = 0;
for (const [file, buf] of written) { disk0 += fs.statSync(file).size; disk1 += buf.length; fs.writeFileSync(file, buf); }
fs.writeFileSync(SPRITES, lines.join('\n'));
console.log(`Đã ghi ${written.length} ảnh và cập nhật ${todo.length} dòng trong sprites.js. Dung lượng file: ${(disk0 / 1048576).toFixed(2)} MB → ${(disk1 / 1048576).toFixed(2)} MB`);
