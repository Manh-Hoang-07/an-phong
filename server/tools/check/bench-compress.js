'use strict';
/*
 * Đo chi phí nén bundle — server/http/static.js giờ nén BẤT ĐỒNG BỘ (không chặn event loop).
 *   node server/tools/check/bench-compress.js
 *
 * Script so sánh chi phí nén đồng bộ (cũ) và kích thước các mức, để kiểm tra lựa chọn q5/gzip6.
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..', '..', '..');

const createStatic = require(path.join(ROOT, 'server', 'http', 'static'));
const serveStatic = createStatic(ROOT);
async function hit(url, accept) {
  const res = { headers: null, body: null, writeHead(c, h) { this.headers = h || {}; return this; }, end(b) { this.body = b; return this; } };
  await serveStatic({ method: 'GET', url, headers: { 'accept-encoding': accept } }, res, url, '');
  return res;
}

function benchSync(label, fn, n = 3) {
  fn();
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6 / n;
  console.log(`  ${label}: ${ms.toFixed(0)} ms`);
  return ms;
}

(async () => {
  const home = await hit('/', 'gzip');
  const html = zlib.gunzipSync(home.body).toString('utf8');
  const appUrl = (html.match(/src="(\/app\.[\w-]+\.js)"/) || [])[1];
  const raw = (await hit(appUrl, 'identity')).body;

  console.log(`Bundle JS thô: ${(raw.length / 1024).toFixed(0)} KB\n`);

  console.log('Chi phí nén ĐỒNG BỘ (cách cũ — để so sánh, giờ server không dùng):');
  const br9 = benchSync('brotli quality 9', () => zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }));
  const br5 = benchSync('brotli quality 5 (cấu hình mới)', () => zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }));
  const gz9 = benchSync('gzip level 9', () => zlib.gzipSync(raw, { level: 9 }));
  const gz6 = benchSync('gzip level 6 (cấu hình mới)', () => zlib.gzipSync(raw, { level: 6 }));

  const size = (buf) => (buf.length / 1024).toFixed(0) + ' KB';
  console.log('\nKích thước nhận được:');
  console.log(`  thô:            ${size(raw)}`);
  console.log(`  brotli q9:      ${size(zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }))}`);
  console.log(`  brotli q5:      ${size(zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }))}`);
  console.log(`  gzip 9:         ${size(zlib.gzipSync(raw, { level: 9 }))}`);
  console.log(`  gzip 6:         ${size(zlib.gzipSync(raw, { level: 6 }))}`);

  console.log('\nẢnh nền lớn nhất (server có nén không?):');
  const sky = path.join(ROOT, 'public', 'assets', 'bg', 'vamp1', 'sky.png');
  const skyBuf = fs.readFileSync(sky);
  console.log(`  sky.png: ${size(skyBuf)} — đuôi .png KHÔNG nằm trong danh sách nén → gửi nguyên, không tốn CPU`);

  console.log('\n--- Tổng kết ---');
  console.log(`Server giờ nén async: chi phí ${br5.toFixed(0)}ms (brotli q5) chạy ở thread pool, event loop không bị chặn.`);
  console.log(`Nén chỉ xảy ra MỘT lần cho mỗi phiên bản bundle (dedup inflight), sau đó trả thẳng từ cache.`);
})().catch((e) => { console.error(e); process.exit(1); });
