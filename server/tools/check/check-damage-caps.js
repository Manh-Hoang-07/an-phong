'use strict';
/*
 * Kiểm chứng trần sát thương 4 mức + chống spam, KHÔNG cần server hay Mongo đang chạy.
 * Chạy: node server/tools/check/check-damage-caps.js
 *
 * Phần A — trần: với mọi class ở cấp 70 và 100, sát thương thật lớn nhất của từng loại đòn
 *          phải LỌT trần (dùng ≤ 100%). Nếu có cái nào vượt → trần cắt oan người chơi hợp lệ.
 * Phần B — chống spam: mô phỏng bộ đếm `cast` của server, kiểm hồi chiêu, giới hạn số lần dùng
 *          theo từng loại, và cửa sổ đòn sau một lần cast.
 *
 * Các hằng số dưới đây PHẢI khớp server/realtime/index.js. Nếu đổi ở server thì đổi ở đây.
 */
const G = require('../../../shared');

const CAP = { basic: 8, skill: 111, ult: 95, superUlt: 717 };
const CAP_FLAT = { basic: 50, skill: 500, ult: 500, superUlt: 500 };
// Hệ số nhân thực tế: chí mạng 2,5 × ngẫu nhiên 1,1 × sát thương trùm 1,8.
const M = 2.5 * 1.1 * 1.8;
const CAST_RATE = {
  skill: { max: 4, windowMs: 1000 },
  ult: { max: 1, windowMs: 2000 },
  superUlt: { max: 2, windowMs: 60000 },
};
const CAST_HIT_WINDOW_MS = 2000;
const CAST_DENY_MS = 1000;

let fails = 0;
function ok(cond, msg) {
  if (!cond) { fails++; console.log('  ✗ ' + msg); }
  return cond;
}

// ------------------------------------------------------------------ Phần A: trần 4 mức
function bestStats(school, lv) {
  let atk = 0, sm = 0;
  const pts = lv - 1 + 5;   // điểm kỹ năng = cấp - 1, cộng 5 điểm gốc
  for (const stat of ['str', 'spi', 'agi', 'vit']) {
    const p = G.newPlayer({ name: 'x' });
    p.level = lv; p.school = school;
    p.points = { str: 5, agi: 5, vit: 5, spi: 5 };
    p.points[stat] = pts;
    const st = G.calcStats(p, {});
    atk = Math.max(atk, st.atk);
    sm = Math.max(sm, st.skillMul);
  }
  return { atk, sm };
}

console.log('=== PHẦN A: trần sát thương 4 mức (mọi class, cấp 70 và 100) ===');
for (const lv of [70, 100]) {
  const worst = { basic: 0, skill: 0, ult: 0, superUlt: 0 };
  const who = {};
  for (const school of Object.keys(G.SCHOOLS)) {
    const { atk, sm } = bestStats(school, lv);
    const p = G.newPlayer({ name: 'x' }); p.level = lv; p.school = school;
    for (const id of G.availableSkills(p)) {
      const s = G.SKILLS[id], a = G.skillAt(id, 10);
      const pw = Math.max(a.power || 0, a.finisher || 0, a.after || 0);
      const kind = s.superUlt ? 'superUlt' : s.ult ? 'ult' : 'skill';
      const raw = atk * pw * sm * (a.vsSlowed || 1) * M;
      const cap = atk * CAP[kind] + CAP_FLAT[kind];
      const ratio = raw / cap;
      if (ratio > worst[kind]) { worst[kind] = ratio; who[kind] = school + '/' + id + ' ' + s.name; }
    }
    const rb = atk * 1.25 * M / (atk * CAP.basic + CAP_FLAT.basic);
    if (rb > worst.basic) { worst.basic = rb; who.basic = school; }
  }
  for (const kind of ['basic', 'skill', 'ult', 'superUlt']) {
    const pct = Math.round(worst[kind] * 100);
    console.log(`  cấp ${lv}  ${kind.padEnd(9)} dùng ${String(pct).padStart(3)}% trần  <- ${who[kind]}`);
    ok(worst[kind] <= 1, `cấp ${lv}: ${kind} vượt trần (${pct}%) — ${who[kind]}`);
  }
}

// ------------------------------------------------------------------ Phần B: chống spam
// Mô phỏng đúng logic onCast/onHit trong server/realtime/index.js.
function makeConn() {
  // castWinAt khởi tạo = now (1_000_000) y hệt server connect(); dùng 0 sẽ làm rơi vào nhánh reset mỗi lần.
  return {
    skillCds: {}, castN: { skill: 0, ult: 0, superUlt: 0 },
    castWinAt: { skill: 1000000, ult: 1000000, superUlt: 1000000 },
    lastCastAt: 0, lastCastId: null, recentCasts: [], castDenyUntil: 0,
    skillLevels: { st1: 1, ulChung1: 1, ulSinhTu: 1 },
    skillEquipped: ['st1', 'ulChung1', 'ulSinhTu'], cdr: 0,
  };
}
function onCast(c, id, now) {
  const sk = G.SKILLS[id];
  if (!sk) return false;
  const lv = c.skillLevels[id] || 0;
  if (!lv || !c.skillEquipped.includes(id)) return false;
  const kind = sk.superUlt ? 'superUlt' : sk.ult ? 'ult' : 'skill';
  const cdMs = (sk.cd || 0) * 1000 * (1 - c.cdr / 100);
  if (now < (c.skillCds[id] || 0)) { c.castDenyUntil = now + CAST_DENY_MS; return false; }
  const rate = CAST_RATE[kind];
  if (!c.castWinAt[kind]) { c.castN[kind] = 0; c.castWinAt[kind] = now; }
  else {
    const add = ((now - c.castWinAt[kind]) / rate.windowMs) * rate.max;
    c.castN[kind] = Math.max(0, c.castN[kind] - add);
    c.castWinAt[kind] = now;
  }
  if (c.castN[kind] >= rate.max) { c.castDenyUntil = now + CAST_DENY_MS; return false; }
  c.castN[kind] += 1;
  c.skillCds[id] = now + cdMs;
  c.lastCastAt = now; c.lastCastId = id;
  c.recentCasts.push({ id, at: now });
  c.castDenyUntil = 0;
  return true;
}
function onHitAllowed(c, id, now) {
  if (now < c.castDenyUntil) return false;
  const casts = c.recentCasts || [];
  if (!casts.length || now - casts[casts.length - 1].at > CAST_HIT_WINDOW_MS) return false;
  if (id && !casts.some((x) => x.id === id && now - x.at <= CAST_HIT_WINDOW_MS)) return false;
  return true;
}

console.log('');
console.log('=== PHẦN B: chống spam ===');
const T = 1000000;   // mốc thời gian giả, khớp castWinAt khởi tạo trong makeConn()
// B1 — hồi chiêu do server giữ: dùng st1 rồi bấm lại ngay phải bị từ chối.
{
  const c = makeConn();
  const first = onCast(c, 'st1', T);
  const again = onCast(c, 'st1', T + 100);   // st1 cd 2,125s ở cấp 10
  ok(first === true, 'B1: lần dùng đầu phải hợp lệ');
  ok(again === false, 'B1: bấm lại khi còn hồi chiêu phải bị từ chối');
  console.log('  B1 hồi chiêu server: lần 1 =', first, '| bấm lại =', again);
}
// B2 — giới hạn số lần/giây: kỹ năng 4 lần/giây, lần 5 bị chặn.
{
  const c = makeConn();
  const ids = ['st1', 'st1', 'st1', 'st1'];   // cùng id nhưng castDeny chặn hồi chiêu; dùng id khác để test rate
  c.skillLevels = { a: 1, b: 1, c2: 1, d: 1, e: 1 };
  c.skillEquipped = ['a', 'b', 'c2', 'd', 'e'];
  for (const id of Object.keys(c.skillLevels)) G.SKILLS[id] = { school: 'chung', cd: 0, ult: false };
  const results = [];
  for (const id of ['a', 'b', 'c2', 'd', 'e']) results.push(onCast(c, id, T));
  ok(results.slice(0, 4).every(Boolean) && results[4] === false, 'B2: kỹ năng đúng 4 lần/giây, lần 5 bị chặn');
  console.log('  B2 kỹ năng 4 lần/giây:', results.map(r => r ? 'LOT' : 'CHAN').join(', '));
}
// B3 — cửa sổ đòn: đòn có id đúng trong 2s được nhận; sai id hoặc quá 2s bị từ chối.
{
  const c = makeConn();
  onCast(c, 'st1', T);
  ok(onHitAllowed(c, 'st1', T + 500) === true, 'B3: đòn đúng id trong cửa sổ phải được nhận');
  ok(onHitAllowed(c, 'ulChung1', T + 500) === false, 'B3: đòn sai id phải bị từ chối');
  ok(onHitAllowed(c, 'st1', T + 2200) === false, 'B3: đòn sau 2,2 giây phải bị từ chối');
  console.log('  B3 cửa sổ đòn: đúng id = OK | sai id = CHAN | quá hạn = CHAN');
}
// B4 — bị từ chối cast thì bỏ qua đòn 1 giây.
{
  const c = makeConn();
  onCast(c, 'st1', T);
  onCast(c, 'st1', T + 100);   // bị từ chối (hồi chiêu) → castDenyUntil = T + 1100
  ok(onHitAllowed(c, 'st1', T + 200) === false, 'B4: đòn ngay sau cast bị từ chối phải bị bỏ qua');
  console.log('  B4 cast bị từ chối: đòn trong 1s = CHAN');
}
// B5 — siêu tuyệt kỹ 2 lần/60 giây (khớp ngân sách có sẵn ở server).
{
  const c = makeConn();
  const r1 = onCast(c, 'ulSinhTu', T);
  const r2 = onCast(c, 'ulSinhTu', T + 2000);   // cùng id, cd 150s → bị chặn bởi hồi chiêu, không phải rate
  ok(r1 === true, 'B5: siêu tuyệt kỹ lần 1 hợp lệ');
  ok(r2 === false, 'B5: cùng chiêu bấm lại khi còn hồi chiêu bị từ chối');
  // Test riêng bộ đếm rate bằng một conn MỚI (r1 ở trên đã chiếm 1 slot superUlt của c).
  const c2 = makeConn();
  G.SKILLS.__suA = { school: 'chung', cd: 0, ult: true, superUlt: true };
  G.SKILLS.__suB = { school: 'chung', cd: 0, ult: true, superUlt: true };
  G.SKILLS.__suC = { school: 'chung', cd: 0, ult: true, superUlt: true };
  c2.skillLevels.__suA = c2.skillLevels.__suB = c2.skillLevels.__suC = 1;
  c2.skillEquipped.push('__suA', '__suB', '__suC');
  const a = onCast(c2, '__suA', T), b = onCast(c2, '__suB', T), d = onCast(c2, '__suC', T);
  ok(a && b && !d, 'B5: siêu tuyệt kỹ đúng 2 lần/60s, lần 3 bị chặn');
  console.log('  B5 siêu tuyệt kỹ 2 lần/60s:', [a, b, d].map(r => r ? 'LOT' : 'CHAN').join(', '));
}

// B6 — kỹ năng nhiều nhát: đòn của chiêu cũ vẫn được nhận sau khi đã bấm chiêu khác.
{
  const c = makeConn();
  onCast(c, 'st1', T);
  onCast(c, 'ulChung1', T + 300);   // bấm chiêu khác trong lúc đòn st1 còn rơi
  ok(onHitAllowed(c, 'st1', T + 500) === true, 'B6: đòn của chiêu cũ sau khi bấm chiêu khác phải vẫn được nhận');
  ok(onHitAllowed(c, 'ulChung1', T + 500) === true, 'B6: đòn của chiêu mới cũng được nhận');
  console.log('  B6 nhiều nhát: đòn chiêu cũ = OK | đòn chiêu mới = OK');
}

console.log('');
if (fails) {
  console.log(`KẾT LUẬN: ${fails} kiểm tra HỎNG.`);
  process.exit(1);
}
console.log('KẾT LUẬN: tất cả kiểm tra đạt (trần 4 mức + chống spam).');
