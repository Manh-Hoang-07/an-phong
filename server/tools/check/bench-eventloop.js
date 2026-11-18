'use strict';
/*
 * Đo ĐỘ TRỄ EVENT LOOP khi có người tải trang.
 *   node server/tools/check/bench-eventloop.js
 *
 * Đây là phép đo đúng nhất cho "lag": server Node chạy MỘT luồng. Mọi việc nặng chạy đồng bộ
 * (đọc file, nén, quét thư mục) đều làm vòng lặp vị trí 100ms và vòng lặp quái 50ms bị trễ.
 * Trễ bao nhiêu ms thì người chơi thấy nhân vật giật bấy nhiêu.
 *
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..', '..');
const PUBLIC = path.join(ROOT, 'public');

const createStatic = require(path.join(ROOT, 'server', 'http', 'static'));
const serveStatic = createStatic(ROOT);
async function hit(url, accept = 'gzip') {
  const res = { headers: null, body: null, writeHead(c, h) { this.headers = h || {}; return this; }, end(b) { this.body = b; return this; } };
  await serveStatic({ method: 'GET', url, headers: { 'accept-encoding': accept } }, res, url, '');
  return res;
}

// Máy đo độ trễ event loop: hẹn giờ 10ms, đo xem thực tế bị đẩy bao xa
function makeLagMeter() {
  const samples = [];
  let last = process.hrtime.bigint();
  const timer = setInterval(() => {
    const now = process.hrtime.bigint();
    samples.push(Number(now - last) / 1e6 - 10);
    last = now;
  }, 10);
  timer.unref();
  return {
    stop() { clearInterval(timer); const s = samples.filter(x => x > 0).sort((a, b) => a - b); return { max: Math.max(0, ...samples), p95: s.length ? s[Math.floor(s.length * 0.95)] : 0, n: samples.length }; },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scenario(label, work) {
  const meter = makeLagMeter();
  await sleep(50);
  const t0 = process.hrtime.bigint();
  await work();
  const t1 = process.hrtime.bigint();
  await sleep(50);
  const r = meter.stop();
  console.log(`\n${label}`);
  console.log(`  thời gian xử lý: ${(Number(t1 - t0) / 1e6).toFixed(0)} ms`);
  console.log(`  event loop trễ tối đa: ${r.max.toFixed(0)} ms | p95: ${r.p95.toFixed(0)} ms`);
  return r.max;
}

(async () => {
  // Chuẩn bị: lấy URL bundle
  await hit('/');
  const home = await hit('/', 'gzip');
  const html = require('zlib').gunzipSync(home.body).toString('utf8');
  const appUrl = (html.match(/src="(\/app\.[\w-]+\.js)"/) || [])[1];

  const imgs = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p); else if (/\.(png|webp)$/i.test(f.name)) imgs.push(p);
    }
  })(path.join(PUBLIC, 'assets'));
  const urlOf = (p) => '/' + path.relative(PUBLIC, p).split(path.sep).join('/');

  console.log('Đo độ trễ event loop (mỗi 10ms một mẫu). Trễ = thời gian server "đứng hình".');

  // 1. Một người tải trang chủ (signature giờ chỉ quét khi fs.watch báo đổi)
  await scenario('1. Một người mở game (GET /)', async () => { await hit('/'); });

  // 2. Tải bundle (lần đầu nén async)
  await scenario('2. Tải bundle JS (nén async, dedup)', async () => { await hit(appUrl); });

  // 3. Tải 20 ảnh của một bản đồ (như lúc vào map mới)
  const mapImgs = imgs.slice(0, 20);
  await scenario('3. Vào bản đồ mới (20 ảnh, lần đầu đọc đĩa async)', async () => {
    for (const p of mapImgs) await hit(urlOf(p));
  });

  // 4. Ba người cùng mở game một lúc
  await scenario('4. Ba người cùng mở game một lúc', async () => {
    for (let i = 0; i < 3; i++) { await hit('/'); await hit(appUrl); }
  });

  // 5. Người chơi đi qua nhiều bản đồ liên tiếp
  await scenario('5. Đi qua 4 bản đồ liên tiếp (80 ảnh)', async () => {
    for (const p of imgs.slice(20, 100)) await hit(urlOf(p));
  });

  console.log('\n--- Kết luận ---');
  console.log('Mỗi lần event loop trễ N ms thì:');
  console.log('  - gói vị trí (100ms/lần) bị dồn, người chơi thấy nhân vật giật');
  console.log('  - vòng lặp quái (50ms/lần) bị dồn, quái đánh trượt nhịp');
  console.log('  - WebSocket ping/echo chậm, cảm giác "lag mạng" dù mạng tốt');
  console.log('\nTrên VPS, đĩa chậm hơn và CPU yếu hơn máy dev nhiều lần → các số trên còn tệ hơn.');
})().catch((e) => { console.error(e); process.exit(1); });
