'use strict';
/*
 * Kiểm chứng trần sát thương THEO CLASS + chống spam + kiểm thống kê chí mạng,
 * KHÔNG cần server hay Mongo đang chạy.
 * Chạy: node server/tools/check/check-damage-caps.js
 *
 * Phần A — trần theo hồ sơ (server/game/core/damage-profile.js): với mọi class (nền, chức nghiệp 2, Toàn Năng)
 *          ở cấp 70 và 100, sát thương thật lớn nhất của đánh thường / từng kỹ năng / tuyệt kỹ / tuyệt phẩm
 *          phải LỌT trần (≤ 100%). Vượt → trần cắt oan người chơi hợp lệ. Gần 100% → trần chặt, đúng ý đồ.
 * Phần B — chống spam: mô phỏng bộ đếm `cast` của server (hằng số PHẢI khớp server/realtime/index.js).
 * Phần C — thống kê chí mạng: người thật không bị từ chối cờ chí mạng; client luôn gửi chí mạng thì bị kéo về tỉ lệ thật.
 */
const G = require('../../../shared');
const DP = require('../../game/core/damage-profile');

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

// ------------------------------------------------------------------ Phần A: trần theo class
// Chỉ số tốt nhất có thể: dồn toàn bộ điểm vào một chỉ số (thử cả bốn, lấy ATK / skillMul lớn nhất).
function bestStats(school, lv) {
  let best = null;
  const pts = lv - 1 + 5;   // điểm tiềm năng = cấp - 1, cộng 5 điểm gốc
  for (const stat of ['str', 'spi', 'agi', 'vit']) {
    const p = G.newPlayer({ name: 'x' });
    p.level = lv; p.school = school;
    p.points = { str: 5, agi: 5, vit: 5, spi: 5 };
    p.points[stat] = pts;
    const st = G.calcStats(p, {});
    if (!best || st.atk * st.skillMul > best.st.atk * best.st.skillMul) best = { p, st };
  }
  return best;
}

// Quái giả: trùm (bội số boss áp dụng), giáp 0, đang chậm (vsSlowed áp dụng), máu đầy (exec không áp dụng).
const NOW = 1_000_000;
const bossMob = { def: { boss: 1, level: 50, def: 0 }, hp: 1000, maxHp: 1000, slowUntil: NOW + 5000, freezeUntil: 0, alive: true };

function profileOf(p, st, ids, wtype) {
  const s2 = { ...st, wtype: wtype || st.wtype };
  const lv = {};
  for (const id of ids) lv[id] = G.SKILLS[id].superUlt ? G.SUPER_ULT_LEVEL : 10;
  return DP.buildProfile(p, s2, lv, ids, null, null, NOW);
}

// Sát thương thật lớn nhất theo công thức client (combat.js calcDamage) — viết lại độc lập, không gọi module trần.
function rawSkill(st, sk, a, crit, kindOfBoss) {
  const pw = Math.max(a.power || 0, a.finisher || 0, a.after || 0);
  const base = sk.type === 'manaburst' ? st.maxMp * (a.mpPower || 5.5) : st.atk * pw * st.skillMul;
  return base * (a.vsSlowed || 1) * crit * 1.1 * kindOfBoss;
}

console.log('=== PHẦN A: trần theo class (cấp 70 và 100) ===');
const critOf = (p, dash) => {
  const ps = G.passivesOf(p);
  if (ps.includes('sat_thu') && dash) return 2.5;
  return ps.includes('cung_thu') ? 1.8 : 1.6;
};
const tableRows = [];
for (const lv of [70, 100]) {
  const worst = { basic: 0, skill: 0, ult: 0, super: 0 };
  const who = {};
  for (const school of Object.keys(G.SCHOOLS)) {
    const { p, st } = bestStats(school, lv);
    st.boss = 80;           // trần cộng dồn của calcStats (boss ≤ 80%): người chơi mạnh nhất lên trùm
    const bossFull = 1.8;
    // --- đánh thường: thử mọi vũ khí class được dùng (Toàn Năng dùng mọi loại)
    const wtypes = G.baseSchool(school) === 'toan_nang' ? Object.keys(G.WEAPON_TYPES) : [G.classWeapon(school)];
    for (const wt of wtypes) {
      const pr = profileOf(p, st, [], wt);
      const raw = st.atk * G.WEAPON_TYPES[wt].mult * critOf(p, false) * 1.1 * bossFull;
      const cap = DP.hitCap(pr, false, null, bossMob, true, false, NOW);
      const r = raw / cap;
      if (r > worst.basic) { worst.basic = r; who.basic = school + '/' + wt; }
    }
    // --- kỹ năng / tuyệt kỹ / tuyệt phẩm: mỗi chiêu một hồ sơ riêng (chỉ gắn đúng chiêu đó) để đo độ chặt
    const ids = G.availableSkills(p).slice();
    for (const id of Object.keys(G.SKILLS)) if (G.SKILLS[id].superUlt) ids.push(id);   // tuyệt phẩm: coi như đã sở hữu hết
    const kindMax = { skill: 0, ult: 0, super: 0 };
    for (const id of ids) {
      const s = G.SKILLS[id];
      const a = G.skillAt(id, s.superUlt ? G.SUPER_ULT_LEVEL : 10);
      const pw = Math.max(a.power || 0, a.finisher || 0, a.after || 0);
      const hits = pw > 0 || s.type === 'manaburst' || s.type === 'allin';
      if (!hits) continue;
      // Vạn Pháp Quy Nhất đánh thêm bằng power của hai chiêu con
      let a2 = a;
      if (s.type === 'allin') a2 = { ...a, power: Math.max(pw, G.skillAt('ulChung1', 10).power, G.skillAt('ulChung3', 10).power) };
      const kind = s.superUlt ? 'super' : s.ult ? 'ult' : 'skill';
      const dash = s.type === 'dash';
      const pr = profileOf(p, st, [id]);
      const raw = rawSkill(st, s, a2, critOf(p, dash), bossFull);
      const cap = DP.hitCap(pr, true, id, bossMob, true, false, NOW);
      const r = raw / cap;
      if (r > worst[kind]) { worst[kind] = r; who[kind] = school + '/' + id + ' ' + s.name; }
      const xAtk = cap / st.atk;
      if (xAtk > kindMax[kind]) kindMax[kind] = xAtk;
    }
    const prB = profileOf(p, st, [], wtypes[0]);
    tableRows.push({ lv, school, atk: st.atk, crit: prB.critMul,
      basic: DP.hitCap(prB, false, null, bossMob, true, false, NOW) / st.atk, ...kindMax });
  }
  for (const kind of ['basic', 'skill', 'ult', 'super']) {
    const pct = Math.round(worst[kind] * 100);
    console.log(`  cấp ${lv}  ${kind.padEnd(6)} dùng ${String(pct).padStart(3)}% trần  <- ${who[kind]}`);
    ok(worst[kind] <= 1, `cấp ${lv}: ${kind} vượt trần (${pct}%) — ${who[kind]}`);
  }
}
console.log('');
console.log('  Bảng trần theo class (bội số của ATK, đòn chí mạng lên trùm đang chậm, chiêu mạnh nhất mỗi loại):');
console.log('  cấp  class             critMul  basic   skill     ult   super');
for (const r of tableRows.filter((x) => x.lv === 100)) {
  const f = (v) => (v ? v.toFixed(1) : '-').padStart(7);
  console.log(`  ${String(r.lv).padStart(3)}  ${r.school.padEnd(16)} ${r.crit.toFixed(1).padStart(6)} ${f(r.basic)} ${f(r.skill)} ${f(r.ult)} ${f(r.super)}`);
}

// A2 — các đường hợp lệ khác phải LỌT: phản sát thương, kỹ năng trang bị cấp, đổi chỉ số trong thời gian ân hạn.
{
  const { p, st } = bestStats('tanker', 100);
  const ref = 'tk10';   // Thủ thế có phản sát thương 0,3
  const pr = profileOf(p, st, [ref]);
  // Phản sát thương = công QUÁI × tổng phản (không phải ATK người chơi): thử quái yếu ATK người chơi nhưng công quái cao.
  const strongMob = { def: { atk: st.atk * 6, level: 50, def: 0 }, hp: 100, maxHp: 100, slowUntil: 0, freezeUntil: 0 };
  const reflectDmg = Math.round(strongMob.def.atk * 1.5 * 1.25 * 0.3);
  ok(DP.hitCap(pr, false, null, strongMob, false, false, NOW) >= reflectDmg, 'A2: phản sát thương (công quái × phản) phải lọt trần đánh thường');
  const noReflect = profileOf(p, st, []);
  ok(DP.hitCap(noReflect, false, null, strongMob, false, false, NOW) < reflectDmg, 'A2: không gắn thủ thế thì không được mượn trần phản sát thương');
  console.log('  A2 phản sát thương tanker (theo công quái): lọt trần; không gắn thủ thế thì không mượn được');
}
{
  // Đổi vũ khí sang cái mạnh hơn: hồ sơ mới chưa kịp cập nhật, hồ sơ cũ còn ân hạn 15 giây.
  const { p, st } = bestStats('kiem_si', 70);
  const oldPr = profileOf(p, st, [], 'kiem');
  const newSt = { ...st, atk: st.atk * 1.5, wtype: 'kiem' };
  const newPr = DP.buildProfile(p, newSt, {}, [], null, oldPr, NOW);
  const dmgNew = newSt.atk * 1.0 * 1.1;
  ok(DP.hitCap(newPr, false, null, null, false, false, NOW + 1000) >= dmgNew, 'A2: hồ sơ mới phải lọt chính nó');
  const stale = DP.buildProfile(p, st, {}, [], null, newPr, NOW + 5000);   // refresh nhận ATK cũ (thấp hơn)
  ok(DP.hitCap(stale, false, null, null, false, false, NOW + 6000) >= dmgNew, 'A2: ân hạn phải giữ trần cũ sau khi chỉ số tụt');
  ok(DP.hitCap(stale, false, null, null, false, false, NOW + 5000 + DP.PROFILE_GRACE_MS + 1000) < dmgNew, 'A2: hết ân hạn thì trần phải tụt về chỉ số mới');
  console.log('  A2 ân hạn 15 giây khi chỉ số đổi: đúng');
}
// A3 — giả cờ: chiêu không gắn / id lạ chỉ còn phần cộng phẳng; đánh thường không mượn được power của chiêu mạnh.
{
  const { p, st } = bestStats('cung_thu', 100);
  const pr = profileOf(p, st, ['ul' + 'Chung1'].filter((x) => G.SKILLS[x]));
  const basicCap = DP.hitCap(pr, false, null, bossMob, true, false, NOW);
  const unknown = DP.hitCap(pr, true, 'khongtontai', bossMob, true, false, NOW);
  ok(unknown <= DP.FLAT_SKILL, 'A3: id kỹ năng lạ chỉ còn phần cộng phẳng');
  ok(basicCap < st.atk * 5, 'A3: trần đánh thường Cung Thủ phải < 5×ATK (hiện ' + (basicCap / st.atk).toFixed(2) + '×)');
  console.log(`  A3 id lạ → ${Math.round(unknown)} | đánh thường Cung Thủ chí mạng lên trùm = ${(basicCap / st.atk).toFixed(2)}×ATK`);
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
// B5 — TUYỆT PHẨM 2 lần/60 giây (khớp ngân sách có sẵn ở server).
{
  const c = makeConn();
  const r1 = onCast(c, 'ulSinhTu', T);
  const r2 = onCast(c, 'ulSinhTu', T + 2000);   // cùng id, cd 150s → bị chặn bởi hồi chiêu, không phải rate
  ok(r1 === true, 'B5: TUYỆT PHẨM lần 1 hợp lệ');
  ok(r2 === false, 'B5: cùng chiêu bấm lại khi còn hồi chiêu bị từ chối');
  // Test riêng bộ đếm rate bằng một conn MỚI (r1 ở trên đã chiếm 1 slot superUlt của c).
  const c2 = makeConn();
  G.SKILLS.__suA = { school: 'chung', cd: 0, ult: true, superUlt: true };
  G.SKILLS.__suB = { school: 'chung', cd: 0, ult: true, superUlt: true };
  G.SKILLS.__suC = { school: 'chung', cd: 0, ult: true, superUlt: true };
  c2.skillLevels.__suA = c2.skillLevels.__suB = c2.skillLevels.__suC = 1;
  c2.skillEquipped.push('__suA', '__suB', '__suC');
  const a = onCast(c2, '__suA', T), b = onCast(c2, '__suB', T), d = onCast(c2, '__suC', T);
  ok(a && b && !d, 'B5: TUYỆT PHẨM đúng 2 lần/60s, lần 3 bị chặn');
  console.log('  B5 TUYỆT PHẨM 2 lần/60s:', [a, b, d].map(r => r ? 'LOT' : 'CHAN').join(', '));
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

// ------------------------------------------------------------------ Phần C: thống kê chí mạng
// PRNG có hạt giống để kết quả lặp lại được.
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
console.log('');
console.log('=== PHẦN C: thống kê chí mạng ===');
{
  const rand = rng(12345);
  const fakePr = (p) => ({ critP: p, prev: null, changedAt: 0 });
  // C1 — người chơi thật (chí mạng đúng p): không bao giờ bị từ chối cờ chí mạng.
  for (const p of [0.05, 0.2, 0.4, 0.6, 0.9]) {
    let claims = 0, denied = 0;
    for (let s = 0; s < 300; s++) {           // 300 phiên × 2000 đòn
      const g = {};
      for (let i = 0; i < 2000; i++) {
        const c = rand() < p;
        if (!c) { DP.critAllowed(g, false, fakePr(p), NOW); continue; }
        claims++;
        if (!DP.critAllowed(g, true, fakePr(p), NOW)) denied++;
      }
    }
    ok(denied === 0, `C1: p=${p} người thật bị từ chối ${denied}/${claims} cờ chí mạng`);
    console.log(`  C1 người thật p=${String(p).padEnd(4)}: từ chối ${denied}/${claims} cờ chí mạng`);
  }
  // C2 — client luôn gửi chí mạng: tỉ lệ được chấp nhận phải bị kéo về sát p thật.
  for (const p of [0.05, 0.2, 0.6]) {
    const g = {};
    let accepted = 0, total = 0;
    for (let i = 0; i < 1000; i++) {
      const okc = DP.critAllowed(g, true, fakePr(p), NOW);
      if (i >= 100) { total++; if (okc) accepted++; }   // bỏ 100 đòn đầu (còn đang tích mẫu)
    }
    const rate = accepted / total;
    ok(rate <= p + 0.12, `C2: p=${p} gian lận luôn-chí-mạng vẫn được ${(rate * 100).toFixed(0)}% chí mạng`);
    console.log(`  C2 gian lận 100% chí mạng, p thật=${String(p).padEnd(4)}: được chấp nhận ${(rate * 100).toFixed(0)}% (không gian lận = ${p * 100}%)`);
  }
  // C3 — bắt được nhanh: bao nhiêu đòn thì bắt đầu từ chối.
  for (const p of [0.05, 0.3, 0.6]) {
    const g = {};
    let first = -1;
    for (let i = 1; i <= 200 && first < 0; i++) if (!DP.critAllowed(g, true, fakePr(p), NOW)) first = i;
    ok(first > 0 && first <= 60, `C3: p=${p} phải bị bắt trong 60 đòn (thực tế ${first})`);
    console.log(`  C3 p=${String(p).padEnd(4)}: bắt đầu từ chối cờ chí mạng ở đòn thứ ${first}`);
  }
}

console.log('');
if (fails) {
  console.log(`KẾT LUẬN: ${fails} kiểm tra HỎNG.`);
  process.exit(1);
}
console.log('KẾT LUẬN: tất cả kiểm tra đạt (trần theo class + chống spam + thống kê chí mạng).');
