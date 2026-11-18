'use strict';
/*
 * Đo chi phí dựng/gộp file tĩnh (server/http/static.js) — chạy mỗi lần có người tải trang.
 *   node server/tools/check/bench-static.js
 *
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..', '..');
const createStatic = require(path.join(ROOT, 'server', 'http', 'static'));

function fakeReq(url, headers = {}) {
  return { method: 'GET', url, headers: { 'accept-encoding': 'gzip, br', ...headers } };
}
function fakeRes() {
  return {
    statusCode: 0, headers: null, body: null,
    writeHead(code, h) { this.statusCode = code; this.headers = h || {}; return this; },
    end(buf) { this.body = buf; return this; },
  };
}

const serveStatic = createStatic(ROOT);
const zlib = require('zlib');
const hit = async (url, query = '', accept = 'gzip') => {
  const res = fakeRes();
  await serveStatic(fakeReq(url, { 'accept-encoding': accept }), res, url, query);
  return res;
};
// Giải nén để đọc nội dung (server trả gzip/br)
const text = (res) => {
  const enc = res.headers && res.headers['Content-Encoding'];
  const buf = res.body || Buffer.alloc(0);
  if (enc === 'gzip') return zlib.gunzipSync(buf).toString('utf8');
  if (enc === 'br') return zlib.brotliDecompressSync(buf).toString('utf8');
  return buf.toString('utf8');
};

async function time(label, fn, n = 20) {
  await fn();
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < n; i++) await fn();
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6 / n;
  console.log(`  ${label}: ${ms.toFixed(2)} ms`);
  return ms;
}

(async () => {
  console.log('1. Tải trang chủ');
  const first = await hit('/');
  const html = text(first);
  const appUrl = (html.match(/src="(\/app\.[\w-]+\.js)"/) || [])[1];
  console.log(`  bundle trong HTML: ${appUrl}`);
  console.log(`  HTML: ${html.length} bytes`);
  const cold = await time('GET /', () => hit('/'));

  console.log('\n2. Tải bundle JS');
  const b = await hit(appUrl);
  console.log(`  bundle: ${b.body.length} bytes (đã nén), ${b.headers['Content-Encoding'] || 'không nén'}`);
  const bundle = await time('GET bundle', () => hit(appUrl));

  console.log('\n3. Tải ảnh (asset)');
  const assets = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p); else if (/\.(png|webp)$/i.test(f.name)) assets.push(p);
    }
  })(path.join(ROOT, 'public', 'assets'));
  const sample = assets.slice(0, 20);
  const t0 = process.hrtime.bigint();
  for (const a of sample) {
    const url = '/' + path.relative(path.join(ROOT, 'public'), a).split(path.sep).join('/');
    await hit(url);
  }
  const t1 = process.hrtime.bigint();
  const perAsset = Number(t1 - t0) / 1e6 / sample.length;
  console.log(`  ${sample.length} ảnh: ${(perAsset * sample.length).toFixed(2)} ms tổng, ${perAsset.toFixed(3)} ms/ảnh`);
  console.log(`  tổng số ảnh trong public/assets: ${assets.length}`);

  console.log('\n4. Quét chữ ký (signature) — đọc 576 file asset');
  function sigCost() {
    let n = 0;
    const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else { const s = fs.statSync(p); n += s.mtimeMs + s.size; } } };
    walk(path.join(ROOT, 'public', 'assets'));
    return n;
  }
  const sigMs = await time('signature() (thô)', sigCost, 10);

  console.log('\n--- Tổng kết ---');
  console.log(`Trang chủ: ${cold.toFixed(1)} ms/lượt`);
  console.log(`Bundle JS: ${bundle.toFixed(1)} ms/lượt`);
  console.log(`Quét chữ ký thô: ${sigMs.toFixed(1)} ms (giờ chỉ chạy khi fs.watch báo đổi)`);
  console.log(`Số file asset phải quét: ${assets.length}`);
})().catch((e) => { console.error(e); process.exit(1); });
