'use strict';
/* Sinh shared/maps/rung.txt: bản đồ nhiều tầng (2 tháp đá + thác nước ở giữa, bậc thang nhảy lên đỉnh).
 * Chạy: node server/tools/gen-map-rung.js
 * Ký hiệu thêm: % thác nước (trang trí), " hồ nước nông. Khoảng cách giữa các tầng = 3 ô (nhảy cao ~3,7 ô). */
const fs = require('fs');
const path = require('path');
const W = 110, H = 34, G = 30;   // G = hàng mặt đất
const g = Array.from({ length: H }, () => Array(W).fill('.'));
const set = (r, c, ch) => { if (r >= 0 && r < H && c >= 0 && c < W) g[r][c] = ch; };
const fill = (r0, r1, c0, c1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(r, c, ch); };
const ledge = (r, c0, c1) => fill(r, r, c0, c1, '=');

fill(G, H - 1, 0, W - 1, '#');                 // mặt đất
// Tháp: mép lệch 0-1 ô theo từng đoạn 3 hàng cho tự nhiên (ô ngoài cùng của đỉnh thu hẹp)
function tower(a, b, dir) {
  for (let r = 10; r < G; r++) {
    const seg = Math.floor(r / 3);
    const out = r < 12 ? 1 : (r > 24 ? 0 : (seg * 7 + a) % 2), inn = (seg * 5 + b) % 3 === 0 ? 1 : 0;
    if (dir > 0) fill(r, r, a + out, b - inn, '#'); else fill(r, r, a + inn, b - out, '#');
  }
}
tower(40, 51, 1);                              // tháp trái
tower(63, 74, -1);                             // tháp phải
fill(0, G - 1, 55, 59, '%');                   // thác nước giữa hai tháp
fill(G - 2, G - 1, 52, 62, '"');               // hồ nước dưới chân thác
// bậc thang lên tháp trái / phải
const near = [34, 38], far = [28, 32];
[[27, near], [24, far], [21, near], [18, far], [15, near], [12, near]].forEach(([r, c]) => ledge(r, c[0], c[1]));
const nearR = [76, 80], farR = [82, 86];
[[27, nearR], [24, farR], [21, nearR], [18, farR], [15, nearR], [12, nearR]].forEach(([r, c]) => ledge(r, c[0], c[1]));
// bậc trong lòng thác
[[27, 53, 56], [24, 58, 61], [21, 53, 56], [18, 58, 61], [15, 53, 56], [12, 58, 61]].forEach(([r, a, b]) => ledge(r, a, b));
// tầng cao trên đỉnh tháp
ledge(7, 42, 47); ledge(7, 66, 71);

set(G - 1, 2, '<'); set(G - 1, 6, 'V'); set(G - 1, 106, '>');
for (const c of [12, 19, 26, 90, 96, 102]) set(G - 1, c, c < 50 ? 'a' : 'c');
for (const c of [43, 47, 50, 65, 69, 73]) set(9, c, 'b');
set(6, 44, 'b'); set(6, 68, 'b');
set(26, 36, 'b'); set(26, 78, 'b');
set(26, 54, 'c'); set(23, 59, 'c'); set(20, 54, 'c');
for (const c of [9, 15, 22, 29, 86, 93, 99, 104]) set(G - 1, c, '&');
for (const c of [41, 45, 49, 64, 67, 72]) set(9, c, '&');
for (const c of [32, 80]) set(G - 1, c, '&');
fs.writeFileSync(path.join(__dirname, '../../shared/maps/rung.txt'), g.map(r => r.join('')).join('\n') + '\n');
console.log('ok', W, 'x', H);
