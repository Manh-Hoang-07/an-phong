'use strict';
/* Soi tile bản đồ: bục '=' thừa, thác '%' lơ lửng/chạm sai, hồ '"' không có đáy,
 * và ký tự chức năng bị nước đè. Không sửa file; exit 1 khi có lỗi.
 *   node server/tools/check/check-map-tiles.js            → tất cả bản đồ
 *   node server/tools/check/check-map-tiles.js rung hang  → một số bản đồ
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../../..');
const DIR = path.join(ROOT, 'shared', 'maps');
const want = process.argv.slice(2);
const isFunc = (ch) => /[A-Za-z<>]/.test(ch) || '()[]'.includes(ch);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.txt') && (!want.length || want.includes(f.replace(/\.txt$/, '')))).sort();
let total = 0;

for (const file of files) {
  const text = fs.readFileSync(path.join(DIR, file), 'utf8').replace(/\r/g, '');
  const lines = text.split('\n').filter((l) => l.length);
  const issues = [];
  const at = (r, c) => lines[r]?.[c];
  const src = (r, c) => `${r + 1}:${c + 1}`;

  for (let r = 0; r < lines.length; r++) {
    for (let c = 0; c < lines[r].length; c++) {
      const ch = lines[r][c], below = at(r + 1, c);
      if (ch === '=' && below === '#') issues.push(`[BUC-THUA]      '=' trên '#' tại ${src(r, c)} — runtime bỏ qua bục này`);
      // '%' ngay trên '#' là trạng thái ĐÚNG (thác chạm đất), không phải lỗi.
      if (ch === '"' && below !== '#') issues.push(`[HO-KHONG-CO-DAY] '"' tại ${src(r, c)} không có đất bên dưới`);
      if (ch === '"' && isFunc(below || '')) issues.push(`[KY-TU-CHUC-NANG-BI-DE] '"' đè lên '${below}' tại ${src(r, c)}`);
    }
  }
  // Cột thác phải có mặt tiếp xúc (#, = hoặc ") ở dưới đoạn '%' cuối.
  for (let c = 0; c < Math.max(...lines.map((l) => l.length)); c++) {
    let r = 0;
    while (r < lines.length) {
      if (lines[r][c] !== '%') { r++; continue; }
      let e = r;
      while (e + 1 < lines.length && lines[e + 1][c] === '%') e++;
      let land = e + 1;
      while (land < lines.length && !['#', '=', '"'].includes(at(land, c))) land++;
      if (land >= lines.length) issues.push(`[THAC-LO-LUNG]  cột ${c + 1}, hàng ${r + 1}-${e + 1} không có mặt tiếp xúc bên dưới`);
      r = e + 1;
    }
  }
  if (issues.length) {
    total += issues.length;
    console.log(`\n== ${file}`);
    for (const x of issues) console.log('  ' + x);
  }
}
console.log(`\nTổng: ${total} vấn đề tile`);
process.exitCode = total ? 1 : 0;
