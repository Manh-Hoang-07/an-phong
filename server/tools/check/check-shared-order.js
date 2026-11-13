'use strict';
/*
 * Kiểm tra hai danh sách nạp file shared/ có khớp nhau không.
 *
 *   node server/tools/check-shared-order.js
 *
 * Server nạp shared/ bằng require trong shared/index.js.
 * Trình duyệt nạp cùng các file đó bằng thẻ <script> trong public/index.html.
 * Hai danh sách lệch nhau thì server chạy đúng mà trình duyệt lỗi (hoặc ngược lại) — rất khó tìm.
 *
 * Kiểm tra:
 *   1. Cùng danh sách file, cùng thứ tự.
 *   2. File được nạp có tồn tại thật.
 *   3. Không file .js nào trong shared/ bị bỏ quên (trừ index.js của thư mục).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const SHARED = path.join(ROOT, 'shared');
const INDEX_JS = path.join(SHARED, 'index.js');
const INDEX_HTML = path.join(ROOT, 'public', 'index.html');

// require('./data/items/potions') → 'data/items/potions.js'
function fromRequire() {
  const src = fs.readFileSync(INDEX_JS, 'utf8');
  const out = [];
  for (const m of src.matchAll(/^\s*require\('(\.\/[^']+)'\);/gm)) {
    out.push(m[1].replace(/^\.\//, '') + '.js');
  }
  return out;
}

// <script src="/shared/..."></script> → 'data/items/potions.js'
function fromHtml() {
  const src = fs.readFileSync(INDEX_HTML, 'utf8');
  const out = [];
  for (const m of src.matchAll(/<script src="\/shared\/([^"]+)"><\/script>/g)) out.push(m[1]);
  return out;
}

// Mọi file .js trong shared/, trừ index.js của thư mục (điểm vào, không phải dữ liệu)
function walk(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else if (e.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

const js = fromRequire();
const html = fromHtml();
let bad = 0;
const err = (msg) => { console.log('  ✗ ' + msg); bad++; };

console.log(`shared/index.js: ${js.length} file`);
console.log(`public/index.html: ${html.length} file`);

// 1. Thứ tự và thành phần
const n = Math.max(js.length, html.length);
for (let i = 0; i < n; i++) {
  if (js[i] === html[i]) continue;
  err(`vị trí ${i + 1}: server='${js[i] || '(hết)'}'  html='${html[i] || '(hết)'}'`);
  break;   // lệch một chỗ là đủ biết; in tiếp sẽ rối
}
if (js.length !== html.length) {
  const onlyJs = js.filter((f) => !html.includes(f));
  const onlyHtml = html.filter((f) => !js.includes(f));
  if (onlyJs.length) err(`chỉ server nạp: ${onlyJs.join(', ')}`);
  if (onlyHtml.length) err(`chỉ trình duyệt nạp: ${onlyHtml.join(', ')}`);
}

// 2. File tồn tại
for (const f of js) if (!fs.existsSync(path.join(SHARED, f))) err(`thiếu file: shared/${f}`);

// 3. Không bỏ quên
const all = walk(SHARED).filter((f) => f !== 'index.js');
for (const f of all) if (!js.includes(f)) err(`có trong shared/ nhưng không được nạp: ${f}`);

if (bad) {
  console.log(`\n${bad} lỗi. Sửa để hai danh sách khớp nhau.`);
  process.exit(1);
}
console.log('OK — hai danh sách khớp nhau, đủ file, không sót file nào.');
