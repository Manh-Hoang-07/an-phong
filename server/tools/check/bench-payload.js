'use strict';
/*
 * Đo khối lượng tải lúc mở game: bundle JS + ảnh sprite + ảnh nền.
 *   node server/tools/check/bench-payload.js
 *
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..', '..', '..');
const PUBLIC = path.join(ROOT, 'public');

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';

// ---- 1. Bundle JS
const createStatic = require(path.join(ROOT, 'server', 'http', 'static'));
const serveStatic = createStatic(ROOT);
async function hit(url, accept = 'gzip') {
  const res = { headers: null, body: null, writeHead(c, h) { this.headers = h || {}; return this; }, end(b) { this.body = b; return this; } };
  await serveStatic({ method: 'GET', url, headers: { 'accept-encoding': accept } }, res, url, '');
  return res;
}

(async () => {
const home = await hit('/');
const html = zlib.gunzipSync(home.body).toString('utf8');
const appUrl = (html.match(/src="(\/app\.[\w-]+\.js)"/) || [])[1];
const appGz = await hit(appUrl);
const appRaw = await hit(appUrl, 'identity');

console.log('=== 1. Mã game (JS) ===');
console.log(`  bundle thô:  ${kb(appRaw.body.length)}`);
console.log(`  bundle nén:  ${kb(appGz.body.length)}  (gzip)`);
console.log(`  HTML:        ${kb(home.body.length)} (nén)`);

// ---- 2. Ảnh sprite nhân vật + quái (nạp ngay khi vào game)
function dirSize(dir) {
  let n = 0, c = 0;
  if (!fs.existsSync(dir)) return { n, c };
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { const s = dirSize(p); n += s.n; c += s.c; }
    else { n += fs.statSync(p).size; c++; }
  }
  return { n, c };
}
const chars = dirSize(path.join(PUBLIC, 'assets', 'chars'));
const mobs = dirSize(path.join(PUBLIC, 'assets', 'mobs'));
console.log('\n=== 2. Ảnh sprite (nạp khi mở game) ===');
console.log(`  nhân vật: ${chars.c} file, ${mb(chars.n)}`);
console.log(`  quái:     ${mobs.c} file, ${mb(mobs.n)}`);
console.log(`  tổng:     ${mb(chars.n + mobs.n)}`);

// ---- 3. Ảnh nền / cảnh trí
const bg = dirSize(path.join(PUBLIC, 'assets', 'bg'));
const props = dirSize(path.join(PUBLIC, 'assets', 'props'));
console.log('\n=== 3. Ảnh nền + cảnh trí (nạp theo bản đồ) ===');
console.log(`  nền (bg):     ${bg.c} file, ${mb(bg.n)}`);
console.log(`  cảnh trí:     ${props.c} file, ${mb(props.n)}`);

// ---- 4. Ảnh nền lớn nhất
console.log('\n=== 4. Những file ảnh nặng nhất ===');
const all = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(png|webp|jpg)$/i.test(f.name)) all.push({ p: path.relative(PUBLIC, p), n: fs.statSync(p).size });
  }
})(path.join(PUBLIC, 'assets'));
all.sort((a, b) => b.n - a.n);
for (const f of all.slice(0, 10)) console.log(`  ${kb(f.n).padStart(9)}  ${f.p}`);

// ---- 5. Tổng
const total = chars.n + mobs.n + bg.n + props.n;
console.log('\n=== 5. Tổng ===');
console.log(`  Ảnh phải tải:        ${all.length} file, ${mb(total)}`);
console.log(`  Mã game (nén):       ${kb(appGz.body.length)}`);
console.log(`  Lần đầu vào game:    ~${mb(total + appGz.body.length)}`);
console.log(`\n  Nếu mạng 5 Mbps: ~${((total + appGz.body.length) * 8 / 5e6).toFixed(0)} giây chỉ để tải ảnh`);
console.log(`  Nếu mạng 20 Mbps: ~${((total + appGz.body.length) * 8 / 20e6).toFixed(0)} giây`);
})().catch((e) => { console.error(e); process.exit(1); });
