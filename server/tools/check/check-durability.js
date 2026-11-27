'use strict';
/*
 * Kiểm tra độ bền trang bị (.perch/plans/do-ben-trang-bi.md).
 * Chạy: node server/tools/check/check-durability.js
 * Cuối script in ước lượng "đánh bao lâu thì hỏng" cho từng loại vũ khí để chỉnh cân bằng.
 */
const G = require('../../../shared');
const D = G.DURABILITY;
const durability = require('../../game/core/durability');
const smith = require('../../game/actions/smith');
const itemsAct = require('../../game/actions/items');
const world = require('../../game/actions/world');

let pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✓ ${label}${extra !== undefined ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`  ✗ ${label}${extra !== undefined ? ' — ' + extra : ''}`); }
}
const head = (t) => console.log(`\n${t}`);
const throws = (fn) => { try { fn(); return false; } catch { return true; } };

function mkPlayer(level, school) {
  const p = G.newPlayer('test');
  p.level = level || 30; p.school = school || 'kiem_si';
  return p;
}
function wear(p, id, extra) {
  const def = G.ITEMS[id];
  p.equip[def.slot] = { uid: p.nextUid++, id, qty: 1, plus: 0, q: 1, roll: 1, aff: [], ...(extra || {}) };
  return p.equip[def.slot];
}
const monOfLevel = (lv, grade) => Object.values(G.MONSTERS).find((m) => Math.abs(m.level - lv) <= 3 && G.gradeOf(m) === (grade || 'normal'));

head('1. Độ bền tối đa theo bộ');
{
  const ao1 = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'ao' && G.ITEMS[k].level <= 10);
  const ao5 = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'ao' && G.ITEMS[k].level >= 41 && G.ITEMS[k].level <= 50);
  const w1 = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'weapon' && G.ITEMS[k].level <= 10);
  ok(G.durMax(G.ITEMS[ao5]) > G.durMax(G.ITEMS[ao1]), 'đồ bộ cao có độ bền tối đa lớn hơn', `${G.durMax(G.ITEMS[ao1])} → ${G.durMax(G.ITEMS[ao5])}`);
  ok(G.durMax(G.ITEMS[w1]) > G.durMax(G.ITEMS[ao1]), 'vũ khí bền hơn giáp (HITS_WEAPON > HITS_ARMOR)');
  ok(G.durPct({ id: ao1 }) === 100, 'món không có trường dur = 100%');
  ok(G.durPct({ id: ao1, dur: 0 }) === 0 && G.isBroken({ id: ao1, dur: 0 }), 'dur 0 = hỏng, 0%');
  ok(G.durPct({ id: ao1, dur: 1 }) === 1 && !G.isBroken({ id: ao1, dur: 1 }), 'còn 1 điểm: hiện 1%, chưa hỏng');
  // Số đòn để hỏng gần như bằng nhau ở mọi tầng (đánh quái đúng tầng)
  const hits = (id, lv) => G.durMax(G.ITEMS[id]) / G.weaponWearPts(0, monOfLevel(lv));
  const w5 = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'weapon' && G.ITEMS[k].level >= 41 && G.ITEMS[k].level <= 50);
  const h1 = hits(w1, 5), h5 = hits(w5, 45);
  ok(h1 > D.HITS_WEAPON * 0.5 && h5 > D.HITS_WEAPON * 0.5 && Math.abs(h1 - h5) / h1 < 0.5, 'số đòn để hỏng gần bằng nhau ở bộ 1 và bộ 5', `${Math.round(h1)} vs ${Math.round(h5)}`);
}

head('2. Quái cấp cao hao nặng hơn, hạng cao hao nặng hơn');
{
  const lo = monOfLevel(5), hi = monOfLevel(60);
  ok(lo && hi, 'có quái cấp thấp và cấp cao để thử', `${lo && lo.level} / ${hi && hi.level}`);
  ok(G.weaponWearPts(0, hi) > G.weaponWearPts(0, lo), 'vũ khí: quái cao hao nhiều hơn quái thấp');
  ok(G.armorWearPts(hi) > G.armorWearPts(lo), 'giáp: quái cao hao nhiều hơn quái thấp');
  const boss = Object.values(G.MONSTERS).find((m) => m.boss && !m.finalBoss);
  const norm = Object.values(G.MONSTERS).find((m) => !m.boss && !m.leader && !m.elite && m.level === boss.level) || lo;
  ok(Math.abs(G.armorWearPts(boss) / G.mobFactor(boss.level) - D.ARMOR_WEAR * D.GRADE_WEAR.boss) < 1e-9, 'trùm ×3');
  ok(G.weaponWearPts(1, lo) > G.weaponWearPts(0, lo) && G.weaponWearPts(3, lo) > G.weaponWearPts(2, lo), 'kỹ năng > đánh thường, siêu > tuyệt kỹ');
  void norm;
}

head('3. Đánh hao vũ khí, bị đánh hao giáp (không lẫn)');
{
  const p = mkPlayer(30);
  const wid = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'weapon' && G.canUseItem(p, G.ITEMS[k]) && G.ITEMS[k].level <= 30);
  const aid = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'ao' && G.ITEMS[k].level <= 30);
  const mid = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'mu' && G.ITEMS[k].level <= 30);
  const w = wear(p, wid), ao = wear(p, aid), mu = wear(p, mid);
  const ev = [];
  durability.applyPending(p, ev, 50, []);
  ok(w.dur != null && w.dur < G.durMax(G.ITEMS[wid]), 'hao vũ khí', `dur ${w.dur}/${G.durMax(G.ITEMS[wid])}`);
  ok(ao.dur == null && mu.dur == null, 'đánh quái không hao giáp');
  const before = w.dur;
  durability.applyPending(p, ev, 0, new Array(40).fill(5));
  ok(w.dur === before, 'bị đánh không hao vũ khí');
  ok((ao.dur != null || mu.dur != null), 'bị đánh hao giáp', `áo ${ao.dur}, mũ ${mu.dur}`);
  ok(ao.dur != null && mu.dur != null, 'hao chia ngẫu nhiên cho nhiều ô (40 cú, 2 ô)');
}

head('4. Hỏng = mất chỉ số, mất bộ, vẫn sửa được');
{
  const p = mkPlayer(30);
  const ids = G.SLOTS.map((s) => Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === s && G.ITEMS[k].level <= 30 && G.ITEMS[k].level >= 21 && (s !== 'weapon' || G.canUseItem(p, G.ITEMS[k])))).filter(Boolean);
  for (const id of ids) wear(p, id);
  const full = G.calcStats(p);
  const ao = p.equip.ao;
  ao.dur = 0;
  const brk = G.calcStats(p);
  ok(brk.def < full.def || brk.maxHp < full.maxHp, 'món hỏng không cộng chỉ số', `def ${full.def}→${brk.def}`);
  ok((G.setCounts(p)[G.setOfItem(G.ITEMS[ao.id]).id] || 0) === ids.length - 1 || ids.length < 2, 'món hỏng không tính vào bộ');
  const cost = G.repairCost(ao);
  ok(cost && cost.gold > 0 && cost.stones > 0 && cost.pct === 100, 'món 0% vẫn có giá sửa, 100% thiếu', JSON.stringify(cost));
  ok(G.sellPrice({ ...ao }) === Math.floor(G.sellPrice({ ...ao, dur: undefined }) * D.BROKEN_SELL), 'bán món hỏng = 25% giá');
  G.repairFull(ao);
  ok(!G.isBroken(ao) && G.durPct(ao) === 100, 'sửa xong đầy lại');
  ok(G.repairCost(ao) === null, 'món đầy không có gì để sửa');
  const half = { ...ao, dur: Math.round(G.durMax(G.ITEMS[ao.id]) / 2) };
  ok(G.repairCost(half).gold < cost.gold, 'sửa nửa độ bền rẻ hơn sửa món hỏng');
}

head('5. Action: repair / equip / die');
{
  const p = mkPlayer(30);
  const aid = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'ao' && G.ITEMS[k].level <= 30);
  const ao = wear(p, aid, { dur: 0 });
  p.gold = 100000;
  p.bag.push({ uid: p.nextUid++, id: 'da_cuong_hoa', qty: 50 });
  // Đứng ở Thợ rèn: dùng roleHere thật nên ném lỗi khi không có thợ → kiểm hai nhánh
  const ev = [];
  let r = throws(() => smith.repair(p, { slot: 'ao' }, ev));
  ok(r || ao.dur == null, 'repair: hoặc báo "gặp Thợ rèn" hoặc đã sửa');
  const quests = require('../../game/core/quests');
  const here = quests.roleHere(p, 'smith');
  if (!here) {
    const village = Object.keys(G.MAPS).find((k) => quests.roleHere({ ...p, map: k }, 'smith'));
    if (village) p.map = village;
  }
  if (quests.roleHere(p, 'smith')) {
    const g0 = p.gold;
    smith.repair(p, { slot: 'ao' }, ev);
    ok(ao.dur == null && p.gold < g0, 'repair: món hỏng được sửa, trừ xu', `-${g0 - p.gold} xu`);
    ok(throws(() => smith.repair(p, { slot: 'ao' }, ev)), 'repair: món đầy bị từ chối');
    ao.dur = 0;
    p.gold = 0;
    ok(throws(() => smith.repair(p, { slot: 'ao' }, ev)), 'repair: thiếu xu bị từ chối');
    p.gold = 100000;
    const mu = wear(p, Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'mu' && G.ITEMS[k].level <= 30), { dur: 5 });
    smith.repair_all(p, {}, ev);
    ok(ao.dur == null && mu.dur == null, 'repair_all: sửa mọi món đang mặc');
  } else ok(true, 'bỏ qua kiểm repair (không dựng được Thợ rèn trong bản đồ thử)');
  // equip: món hỏng không mặc được
  p.equip.ao = null;
  const bagAo = { uid: p.nextUid++, id: aid, qty: 1, plus: 0, q: 1, roll: 1, aff: [], dur: 0 };
  p.bag.push(bagAo);
  ok(throws(() => itemsAct.equip(p, { uid: bagAo.uid }, [])), 'equip: món hỏng bị từ chối');
  bagAo.dur = 10;
  itemsAct.equip(p, { uid: bagAo.uid }, []);
  ok(p.equip.ao && p.equip.ao.id === aid, 'equip: món còn độ bền mặc được');
  // chết: mọi ô mất DEATH_PCT
  const before = G.durCur(p.equip.ao);
  p.equip.ao.dur = null; delete p.equip.ao.dur;
  const m0 = G.durMax(G.ITEMS[aid]);
  world.die(p, {}, []);
  ok(p.equip.ao.dur === Math.round(m0 - m0 * D.DEATH_PCT), 'die: hao thêm 3% độ bền tối đa', `${p.equip.ao.dur}/${m0}`);
  void before;
}

head('6. Đồ vô hạn (Linh Ngọc / đặc biệt) không hao');
{
  const fake = { id: '__inf', q: 1 };
  G.ITEMS.__inf = { name: 'Thử', slot: 'ao', level: 30, priceNgoc: 10, stats: { def: 5 } };
  ok(G.durMax(G.ITEMS.__inf) === Infinity, 'durMax = vô hạn');
  ok(G.durPct(fake) === null && !G.isBroken(fake), 'không có %, không bao giờ hỏng');
  const r = G.applyWear(fake, 1e9);
  ok(!r.changed && fake.dur == null, 'applyWear không đổi gì');
  ok(G.repairCost(fake) === null, 'không có giá sửa');
  delete G.ITEMS.__inf;
}

head('7. Ước lượng thời gian đánh liên tục tới khi vũ khí hỏng (đánh thường, quái đúng tầng)');
{
  const types = G.WEAPON_TYPES || {};
  const w1 = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'weapon' && G.ITEMS[k].level <= 10);
  const hits = G.durMax(G.ITEMS[w1]) / G.weaponWearPts(0, monOfLevel(5));
  for (const t of Object.keys(types)) {
    const cd = types[t].cooldown || 400;
    const min = hits * cd / 1000 / 60;
    console.log(`    ${t.padEnd(10)} cooldown ${String(cd).padStart(4)}ms → ${Math.round(hits)} đòn ≈ ${min.toFixed(0)} phút (${(min / 60).toFixed(1)} giờ)`);
  }
  ok(hits >= 10000, 'vũ khí không hỏng trong vài phút (≥ 10.000 đòn)', Math.round(hits));
}

head('6b. Đường server: gom hao rồi ghi qua xplayer.mutate (giả lập, không cần DB)');
{
  const xplayer = require('../../game/core/xplayer');
  const real = xplayer.mutate;
  const p = mkPlayer(30);
  const wid = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'weapon' && G.canUseItem(p, G.ITEMS[k]) && G.ITEMS[k].level <= 30);
  const aid = Object.keys(G.ITEMS).find((k) => G.ITEMS[k].slot === 'ao' && G.ITEMS[k].level <= 30);
  wear(p, wid); wear(p, aid);
  let calls = 0;
  xplayer.mutate = async (uid, fn) => { calls++; const ev = []; fn(p, ev); return { events: ev }; };
  const conn = { userId: 1 };
  const mob = monOfLevel(20);
  const t0 = 1000000;
  (async () => {
    durability.addWeaponWear(conn, 0, mob, t0);
    for (let i = 0; i < 50; i++) durability.addArmorWear(conn, mob, t0 + i);
    ok(calls === 0 && p.equip.weapon.dur == null, 'chưa tới FLUSH_MS thì chưa ghi (không ghi mỗi đòn)');
    durability.addWeaponWear(conn, 0, mob, t0 + D.FLUSH_MS + 1);
    await new Promise((r) => setTimeout(r, 20));
    ok(calls === 1, 'tới FLUSH_MS thì ghi đúng 1 lần', 'calls=' + calls);
    ok(p.equip.weapon.dur < G.durMax(G.ITEMS[wid]) && p.equip.ao.dur < G.durMax(G.ITEMS[aid]), 'cả vũ khí lẫn giáp đã hao', `vũ khí ${p.equip.weapon.dur}, áo ${p.equip.ao.dur}`);
    durability.addArmorWear(conn, mob, t0 + D.FLUSH_MS + 5);   // vừa ghi xong nên chưa tới hạn → còn gom
    ok(calls === 1, 'đòn kế tiếp sau khi ghi thì gom lại, chưa ghi ngay');
    await durability.flush(conn, t0 + D.FLUSH_MS + 6);
    ok(calls === 2, 'flush() ghi nốt phần còn gom (dùng khi ngắt kết nối)');
    await durability.flush(conn);
    ok(calls === 2, 'không còn gì thì không ghi');
    xplayer.mutate = real;
    for (const l of [`\n${pass} đạt, ${fail} lỗi`]) console.log(l);
    process.exit(fail ? 1 : 0);
  })();
}


