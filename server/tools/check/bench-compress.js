'use strict';
/*
 * Đo chi phí nén ĐỒNG BỘ trong server/http/static.js.
 *   node server/tools/check/bench-compress.js
 *
 * brotliCompressSync(quality 9) và gzipSync(level 9) chạy trên luồng chính: trong lúc nén,
 * server KHÔNG xử lý được gì khác — không nhận vị trí, không phát gói, không trả file.
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..', '..', '..');

const createStatic = require(path.join(ROOT, 'server', 'http', 'static'));
const serveStatic = createStatic(ROOT);
function hit(url, accept) {
  const res = { headers: null, body: null, writeHead(c, h) { this.headers = h || {}; return this; }, end(b) { this.body = b; return this; } };
  serveStatic({ method: 'GET', url, headers: { 'accept-encoding': accept } }, res, url, '');
  return res;
}
const home = hit('/', 'gzip');
const html = zlib.gunzipSync(home.body).toString('utf8');
const appUrl = (html.match(/src="(\/app\.[\w-]+\.js)"/) || [])[1];
const raw = hit(appUrl, 'identity').body;

console.log(`Bundle JS thô: ${(raw.length / 1024).toFixed(0)} KB\n`);

function bench(label, fn, n = 3) {
  fn();
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6 / n;
  console.log(`  ${label}: ${ms.toFixed(0)} ms`);
  return ms;
}

console.log('Nén bundle JS (chặn event loop trong suốt thời gian này):');
const br9 = bench('brotli quality 9 (cấu hình hiện tại)', () => zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }));
const br5 = bench('brotli quality 5 (so sánh)', () => zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }));
const gz9 = bench('gzip level 9 (cấu hình hiện tại)', () => zlib.gzipSync(raw, { level: 9 }));
const gz6 = bench('gzip level 6 (so sánh)', () => zlib.gzipSync(raw, { level: 6 }));

// Kích thước đạt được
const size = (buf) => (buf.length / 1024).toFixed(0) + ' KB';
console.log('\nKích thước nhận được:');
console.log(`  thô:            ${size(raw)}`);
console.log(`  brotli q9:      ${size(zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }))}`);
console.log(`  brotli q5:      ${size(zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }))}`);
console.log(`  gzip 9:         ${size(gz9 ? zlib.gzipSync(raw, { level: 9 }) : raw)}`);
console.log(`  gzip 6:         ${size(zlib.gzipSync(raw, { level: 6 }))}`);

// Ảnh nền lớn: brotli thử nén cả ảnh?
console.log('\nẢnh nền lớn nhất (server có nén không?):');
const sky = path.join(ROOT, 'public', 'assets', 'bg', 'vamp1', 'sky.png');
const skyBuf = fs.readFileSync(sky);
console.log(`  sky.png: ${size(skyBuf)} — đuôi .png KHÔNG nằm trong danh sách nén → gửi nguyên, không tốn CPU`);

console.log('\n--- Tổng kết ---');
console.log(`Lần đầu có người tải game, server phải nén bundle: ${br9.toFixed(0)} ms (brotli q9) — trong lúc đó mọi người chơi khác đứng hình.`);
console.log(`Nếu hạ xuống brotli q5: ${br5.toFixed(0)} ms, chỉ to hơn ${(zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }).length / 1024 - zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }).length / 1024).toFixed(0)} KB.`);
console.log(`Nén chỉ xảy ra MỘT lần cho mỗi file (giữ trong bộ nhớ), sau đó trả thẳng.`);
console.log(`\nLưu ý: mỗi lần file nguồn đổi (hoặc server khởi động lại) là nén lại từ đầu.`);
