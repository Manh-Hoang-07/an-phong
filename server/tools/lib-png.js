/*
 * Đọc / ghi PNG 8 bit không cần thư viện ngoài (dùng cho các công cụ xử lý ảnh trong server/tools).
 *   decode(file) → { W, H, px }  px: Buffer RGBA (W×H×4)
 *   encode(W, H, px) → Buffer PNG, tự chọn bảng màu (≤ 256 màu) hoặc RGBA, mỗi hàng chọn kiểu lọc tốt nhất
 */
'use strict';
const fs = require('fs');
const zlib = require('zlib');

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

module.exports = { decode, encode };
