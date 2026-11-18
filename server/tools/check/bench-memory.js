'use strict';
/*
 * Đo RAM mà server giữ khi phục vụ file tĩnh.
 *   node server/tools/check/bench-memory.js
 *
 * Chỉ ĐO, không sửa gì. Sau khi tối ưu: ảnh lớn chỉ lưu metadata, tổng raw bị giới hạn LRU.
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..', '..');
const PUBLIC = path.join(ROOT, 'public');

const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
const heap = () => process.memoryUsage();

const createStatic = require(path.join(ROOT, 'server', 'http', 'static'));
const serveStatic = createStatic(ROOT);
async function hit(url, accept = 'gzip') {
  const res = { headers: null, body: null, writeHead(c, h) { this.headers = h || {}; return this; }, end(b) { this.body = b; return this; } };
  await serveStatic({ method: 'GET', url, headers: { 'accept-encoding': accept } }, res, url, '');
  return res;
}

(async () => {
  const before = heap();
  console.log(`RAM lúc đầu:        ${mb(before.heapUsed)} heap, ${mb(before.rss)} RSS`);

  // Tải trang chủ + bundle (bình thường)
  await hit('/');
  const home = await hit('/', 'gzip');
  const html = require('zlib').gunzipSync(home.body).toString('utf8');
  const appUrl = (html.match(/src="(\/app\.[\w-]+\.js)"/) || [])[1];
  await hit(appUrl);
  const afterBundle = heap();
  console.log(`Sau khi dựng bundle: ${mb(afterBundle.heapUsed)} heap, ${mb(afterBundle.rss)} RSS  (+${mb(afterBundle.heapUsed - before.heapUsed)})`);

  // Tải toàn bộ ảnh — như một người chơi đi qua nhiều bản đồ
  const imgs = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(png|webp|jpg)$/i.test(f.name)) imgs.push(p);
    }
  })(path.join(PUBLIC, 'assets'));

  let served = 0, bytes = 0;
  for (const p of imgs) {
    const url = '/' + path.relative(PUBLIC, p).split(path.sep).join('/');
    const r = await hit(url);
    if (r.body) { served++; bytes += r.body.length; }
    if (served % 100 === 0) {
      const m = heap();
      console.log(`  ...${served} ảnh: ${mb(m.heapUsed)} heap, ${mb(m.rss)} RSS`);
    }
  }
  const after = heap();
  console.log(`\nSau khi phục vụ ${served} ảnh (${mb(bytes)} dữ liệu):`);
  console.log(`  heap: ${mb(after.heapUsed)}  (+${mb(after.heapUsed - before.heapUsed)})`);
  console.log(`  RSS:  ${mb(after.rss)}  (+${mb(after.rss - before.rss)})`);

  // Đo lại lần hai: metadata đã có trong Map nên không stat lại, ảnh nhỏ có raw
  const t0 = process.hrtime.bigint();
  for (const p of imgs) {
    const url = '/' + path.relative(PUBLIC, p).split(path.sep).join('/');
    await hit(url);
  }
  const t1 = process.hrtime.bigint();
  console.log(`\nLượt hai: ${(Number(t1 - t0) / 1e6).toFixed(0)} ms cho ${imgs.length} ảnh`);

  console.log('\n--- Kết luận ---');
  console.log(`Heap tăng sau 579 ảnh: ${mb(after.heapUsed - before.heapUsed)} (mục tiêu: thấp hơn nhiều so với +4.2MB cũ)`);
  console.log(`RSS tăng: ${mb(after.rss - before.rss)} (mục tiêu: < 40MB so với +74.9MB cũ)`);
})().catch((e) => { console.error(e); process.exit(1); });
