'use strict';
/* Xếp cụm nút cảm ứng thành các VÒNG CUNG đồng tâm quanh nút đánh, đóng gói sát.
   Vòng trong bán kính nhỏ nhất (nút chạm nút đánh, khe 6px); vòng sau cách vòng trước đúng 1 nút.
   Trong mỗi vòng, nút xếp từ 180° (thẳng trái) ngược chiều kim đồng hồ, góc giữa hai nút kề = góc nhỏ nhất
   để hai nút không chạm nhau → các nút cách đều và bám sát nút đánh.
   Toạ độ làm việc: L = vào phía trong (sang trái), U = lên trên, tính từ TÂM nút đánh. */

const ATTACK = 88;
const MARGIN = 6;
const FRAME_W = 350;
const FRAME_H = 290;
const ANG_MIN = 10, ANG_MAX = 200;

const ITEMS = [
  { k: 's0', s: 58 }, { k: 's1', s: 58 }, { k: 's2', s: 58 }, { k: 's3', s: 58 },
  { k: 'hp', s: 46 }, { k: 'mp', s: 46 },
  { k: 'ult', s: 62 }, { k: 'ult2', s: 56 }, { k: 's4', s: 56 }, { k: 'form', s: 56 }, { k: 'aws', s: 50 },
];

const placed = [{ k: 'attack', s: ATTACK, L: 0, U: 0 }];
const dist = (a, b) => Math.hypot(a.L - b.L, a.U - b.U);
const need = (a, b) => (a + b) / 2 + MARGIN;
const right = (p, s) => ATTACK / 2 + p.L - s / 2;
const bottom = (p, s) => ATTACK / 2 + p.U - s / 2;
const inFrame = (p, s) => right(p, s) >= 0 && bottom(p, s) >= 0 && right(p, s) + s <= FRAME_W && bottom(p, s) + s <= FRAME_H;
const posOf = (R, deg) => {
  const rad = deg * Math.PI / 180;
  return { L: -R * Math.cos(rad), U: R * Math.sin(rad) };
};

const queue = ITEMS.slice();
let R = (ATTACK + ITEMS[0].s) / 2 + MARGIN;
for (let ring = 0; ring < 6 && queue.length; ring++, R += 58 + MARGIN) {
  let ang = ANG_MAX;          // góc của nút vừa đặt trên vòng này
  let prev = null;
  while (queue.length) {
    const item = queue[0];
    // góc nhỏ nhất để nút này cách nút kề trước đủ xa
    let theta = ang;
    if (prev) {
      const ratio = need(item.s, prev.s) / (2 * R);
      if (ratio > 1) break;
      theta = ang - 2 * Math.asin(ratio) * 180 / Math.PI;
    }
    // lùi dần cho tới khi vừa khung và không đè nút nào
    let ok = false;
    while (theta >= ANG_MIN) {
      const p = posOf(R, theta);
      if (inFrame(p, item.s) && !placed.some(q => dist(p, q) < need(item.s, q.s))) { ok = true; break; }
      theta -= 1;
    }
    if (!ok) break;
    const p = posOf(R, theta);
    placed.push({ k: item.k, s: item.s, L: p.L, U: p.U, R, theta });
    console.log(item.k.padEnd(6), 'vong R=' + String(Math.round(R)).padStart(3), 'goc=' + theta.toFixed(1).padStart(5),
      'right=' + String(Math.round(right(p, item.s))).padStart(3), 'bottom=' + String(Math.round(bottom(p, item.s))).padStart(3));
    queue.shift();
    prev = item;
    ang = theta;
  }
}
if (queue.length) console.log('CON LAI:', queue.map(q => q.k).join(', '));

let bad = 0, minGap = 1e9;
for (let i = 0; i < placed.length; i++) {
  for (let j = i + 1; j < placed.length; j++) {
    const d = dist(placed[i], placed[j]);
    const nd = (placed[i].s + placed[j].s) / 2;
    minGap = Math.min(minGap, d - nd);
    if (d < nd) { console.log('DE NHAU:', placed[i].k, placed[j].k); bad++; }
  }
}
const far = Math.max(...placed.filter(p => p.k !== 'attack').map(p => dist(p, placed[0])));
let W = 0, H = 0;
for (const p of placed) { W = Math.max(W, right(p, p.s) + p.s); H = Math.max(H, bottom(p, p.s) + p.s); }
console.log('---');
console.log('De nhau:', bad, '| khe ho nho nhat:', minGap.toFixed(1) + 'px');
console.log('Nut xa nhat cach nut danh:', far.toFixed(0) + 'px (bo cuc cu: 212)');
console.log('Khung can:', Math.ceil(W) + 'x' + Math.ceil(H));
console.log('--- CSS ---');
for (const p of placed) {
  if (p.k === 'attack') continue;
  console.log(`body.touch #tbtns .tb-${p.k} { right: ${Math.round(right(p, p.s))}px; bottom: ${Math.round(bottom(p, p.s))}px; }`);
}
