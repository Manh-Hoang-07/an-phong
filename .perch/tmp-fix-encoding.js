'use strict';
/* Sửa mojibake: file bị đọc bằng CP1252 rồi ghi lại bằng UTF-8 (hai lần mã hoá).
   Đảo ngược: mỗi ký tự → byte gốc theo bảng CP1252 → giải mã UTF-8. */
const fs = require('fs');
const path = process.argv[2];
const buf = fs.readFileSync(path, 'utf8');

// bảng ngược CP1252 cho dải 0x80-0x9F
const CP1252 = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

const bytes = [];
let bad = 0;
for (const ch of buf) {
  const cp = ch.codePointAt(0);
  if (cp < 0x100) bytes.push(cp);
  else if (CP1252[cp] !== undefined) bytes.push(CP1252[cp]);
  else { bad++; bytes.push(0x3F); }   // không ánh xạ được
}

const fixed = Buffer.from(bytes).toString('utf8');
fs.writeFileSync(path, fixed, 'utf8');

// kiểm tra
const hasMojibake = /Ã|á»|áº|â€/.test(fixed);
const hasViet = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(fixed);
console.log('Ký tự không ánh xạ:', bad);
console.log('Còn mojibake:', hasMojibake);
console.log('Có tiếng Việt:', hasViet);
