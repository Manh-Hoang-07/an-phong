'use strict';
/*
 * Kiểm tra luật máu quái: máu đã mất thì mất, chỉ chết mới làm mới.
 * Chạy: node server/tools/check/check-mob-hp.js
 *
 * Không cần database: dùng một kho giả thay cho server/realtime/mobstore.js.
 */
const path = require('path');
const { World, STEP_MS } = require('../../realtime/mobs');
const G = require('../../../shared');

let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (cond) { console.log(`  ✓ ${label}`); return true; }
  fails++;
  console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`);
  return false;
}

// Kho giả: giống mobstore nhưng chỉ trong bộ nhớ
function fakeStore() {
  const saved = new Map();
  return {
    saved,
    get: (mapId) => saved.get(mapId) || null,
    markDirty: (mapId, state) => saved.set(mapId, JSON.parse(JSON.stringify(state))),
  };
}

// Bản đồ đầu tiên có trùm (để test đúng trường hợp bạn gặp)
function findBossMap() {
  for (const mapId of Object.keys(G.MAPS)) {
    const meta = G.MAPS[mapId];
    for (const ch in meta.spawns || {}) {
      const def = G.MONSTERS[meta.spawns[ch]];
      if (def && (def.boss || def.leader)) return { mapId, mobId: meta.spawns[ch] };
    }
  }
  return null;
}

const hooks = (log) => ({
  emit: (o) => log.push(o),
  kill: () => [],
});

function makeWorld(mapId, store) {
  const log = [];
  const w = new World(mapId, hooks(log), store ? store.get(mapId) : null);
  w.log = log;
  return w;
}

function bossOf(w) {
  return w.mobs.find((m) => !m.minion && (m.def.boss || m.def.leader));
}

const hit = (w, m, dmg) => w.applyHit(m, 1, { dmg, crit: false, src: 'player', dir: 1, slow: 0, freeze: 0, knock: 0 }, Date.now());

const target = findBossMap();
if (!target) { console.error('Không tìm thấy bản đồ có trùm.'); process.exit(1); }
console.log(`Bản đồ thử: ${target.mapId} · trùm: ${G.MONSTERS[target.mobId].name}\n`);

// ---------------------------------------------------------------- 1. Đánh trùm rồi bỏ đi
console.log('1. Đánh trùm một nửa máu rồi rời bản đồ (không ai ở lại)');
{
  const store = fakeStore();
  const w = makeWorld(target.mapId, store);
  const boss = bossOf(w);
  const startHp = boss.hp;
  for (let i = 0; i < 5; i++) hit(w, boss, Math.round(startHp * 0.08));
  const hurt = boss.hp;
  ok(hurt < startHp, 'máu trùm đã giảm sau khi bị đánh', `${startHp} → ${hurt}`);

  // Bản đồ vắng người: chạy stepIdle rất nhiều lần (mô phỏng 10 phút không ai vào)
  for (let i = 0; i < 12000; i++) w.stepIdle(Date.now());
  ok(boss.hp === hurt, 'máu giữ nguyên sau 10 phút bản đồ vắng người', `${hurt} → ${boss.hp}`);
  ok(boss.alive === true, 'trùm vẫn còn sống');
}

// ---------------------------------------------------------------- 2. Đăng xuất rồi vào lại
console.log('\n2. Đăng xuất rồi vào lại (thế giới quái không bị xoá)');
{
  const store = fakeStore();
  const w1 = makeWorld(target.mapId, store);
  const boss = bossOf(w1);
  for (let i = 0; i < 5; i++) hit(w1, boss, Math.round(boss.maxHp * 0.08));
  const hurt = boss.hp;
  w1.dirty = false;
  store.markDirty(target.mapId, w1.serialize());

  // Người chơi vào lại: dùng lại đúng thế giới cũ (như realtime/index.js: worlds giữ nguyên)
  const w2 = makeWorld(target.mapId, store);
  const boss2 = bossOf(w2);
  ok(boss2.hp === hurt, 'vào lại gặp đúng máu cũ', `${hurt} vs ${boss2.hp}`);
}

// ---------------------------------------------------------------- 3. Server restart
console.log('\n3. Server khởi động lại (đọc trạng thái từ database)');
{
  const store = fakeStore();
  const w1 = makeWorld(target.mapId, store);
  const boss = bossOf(w1);
  for (let i = 0; i < 6; i++) hit(w1, boss, Math.round(boss.maxHp * 0.07));
  const hurt = boss.hp;
  store.markDirty(target.mapId, w1.serialize());

  // Tiến trình mới: World dựng lại từ đầu + trạng thái đã lưu
  const w2 = makeWorld(target.mapId, store);
  const boss2 = bossOf(w2);
  ok(boss2.hp === hurt, 'máu trùm khôi phục đúng sau restart', `${hurt} vs ${boss2.hp}`);
  ok(boss2.maxHp === boss.maxHp, 'máu tối đa khôi phục đúng', `${boss.maxHp} vs ${boss2.maxHp}`);
  ok(boss2.deaths === boss.deaths, 'số lần chết khôi phục đúng');
}

// ---------------------------------------------------------------- 4. Quái thường cũng vậy
console.log('\n4. Quái thường: máu giữ nguyên khi bỏ đi');
{
  const store = fakeStore();
  const w = makeWorld(target.mapId, store);
  const mob = w.mobs.find((m) => !m.minion && !m.def.boss && !m.def.leader && !m.def.passive);
  if (!mob) { console.log('  (bản đồ này không có quái thường, bỏ qua)'); }
  else {
    for (let i = 0; i < 3; i++) hit(w, mob, Math.round(mob.maxHp * 0.2));
    const hurt = mob.hp;
    for (let i = 0; i < 6000; i++) w.stepIdle(Date.now());
    ok(mob.hp === hurt, 'quái thường giữ nguyên máu', `${hurt} → ${mob.hp}`);
  }
}

// ---------------------------------------------------------------- 5. Chết thì mới làm mới
console.log('\n5. Chỉ khi chết mới hồi đầy máu');
{
  const store = fakeStore();
  const w = makeWorld(target.mapId, store);
  const boss = bossOf(w);
  const maxHp = boss.maxHp;
  hit(w, boss, maxHp + 9999);
  ok(!boss.alive, 'trùm đã chết');
  ok(boss.hp === 0, 'máu về 0 khi chết');
  ok(boss.respawnAt > Date.now(), 'có hẹn giờ hồi sinh');

  // Chưa tới giờ: vẫn chết
  w.stepIdle(Date.now());
  ok(!boss.alive, 'chưa tới giờ hồi sinh thì vẫn chết');

  // Tới giờ: hồi sinh đầy máu
  const wait = Math.max(0, boss.respawnAt - Date.now()) + 10;
  boss.respawnAt = Date.now() - 1;
  w.stepIdle(Date.now());
  ok(boss.alive, 'tới giờ thì hồi sinh');
  ok(boss.hp === maxHp, 'hồi sinh đầy máu', `${boss.hp} / ${maxHp}`);
  void wait;
}

// ---------------------------------------------------------------- 6. Không còn hồi máu theo thời gian
console.log('\n6. Không hồi máu theo thời gian (kể cả trùm đứng một mình lâu)');
{
  const store = fakeStore();
  const w = makeWorld(target.mapId, store);
  const boss = bossOf(w);
  hit(w, boss, Math.round(boss.maxHp * 0.5));
  const hurt = boss.hp;
  // Có người chơi đứng xa (ngoài tầm đánh) trong 5 phút
  const far = [{ id: 1, x: boss.x + 5000, y: boss.y, dead: false }];
  const t0 = Date.now();
  for (let i = 0; i < 6000; i++) w.step(t0 + i * STEP_MS, far);
  ok(boss.hp === hurt, 'máu không tăng dù trùm bị bỏ mặc 5 phút', `${hurt} → ${boss.hp}`);
}

// ---------------------------------------------------------------- 7. Máu tối đa trùm co giãn không làm hồi máu
console.log('\n7. Trùm co giãn máu tối đa theo số người: không bơm thêm máu');
{
  const store = fakeStore();
  const w = makeWorld(target.mapId, store);
  const boss = bossOf(w);
  hit(w, boss, Math.round(boss.maxHp * 0.5));
  const ratioBefore = boss.hp / boss.maxHp;
  // 3 người chơi đứng gần → máu tối đa tăng
  const near = [
    { id: 1, x: boss.x, y: boss.y, dead: false },
    { id: 2, x: boss.x + 60, y: boss.y, dead: false },
    { id: 3, x: boss.x - 60, y: boss.y, dead: false },
  ];
  const t0 = Date.now();
  for (let i = 0; i < 40; i++) w.step(t0 + i * STEP_MS, near);
  const ratioAfter = boss.hp / boss.maxHp;
  ok(boss.maxHp > boss.baseHp, 'máu tối đa đã tăng theo số người', `${boss.baseHp} → ${boss.maxHp}`);
  ok(Math.abs(ratioAfter - ratioBefore) < 0.02, 'tỉ lệ máu giữ nguyên (không hồi thêm)', `${ratioBefore.toFixed(3)} → ${ratioAfter.toFixed(3)}`);
}

// ---------------------------------------------------------------- 8. Lưu / khôi phục không làm sai dữ liệu
console.log('\n8. Dữ liệu lưu: chỉ những gì cần, và đọc lại không sai');
{
  const store = fakeStore();
  const w = makeWorld(target.mapId, store);
  const boss = bossOf(w);
  hit(w, boss, Math.round(boss.maxHp * 0.3));
  const state = w.serialize();
  const keys = Object.keys(state);
  ok(keys.length > 0, 'có bản ghi trạng thái', `${keys.length} con`);
  ok(keys.every((k) => !k.includes('undefined')), 'khoá bền hợp lệ', keys.slice(0, 3).join(', '));
  const sample = state[keys[0]];
  ok(typeof sample.hp === 'number' && typeof sample.al === 'number', 'bản ghi có máu và trạng thái sống');
  ok(!('x' in sample) && !('y' in sample), 'không lưu vị trí (quái tự về chỗ cũ)');
}

// ---------------------------------------------------------------- 9. Quái phụ không bị lưu
console.log('\n9. Quái phụ do trùm gọi không nằm trong dữ liệu lưu');
{
  const store = fakeStore();
  const w = makeWorld(target.mapId, store);
  const boss = bossOf(w);
  hit(w, boss, Math.round(boss.maxHp * 0.55));   // xuống dưới 50% máu
  // Nổi giận xảy ra trong vòng AI: cho người chơi đứng gần vài nhịp
  const near = [{ id: 1, x: boss.x + 80, y: boss.y, dead: false }];
  const t0 = Date.now();
  for (let i = 0; i < 20; i++) w.step(t0 + i * STEP_MS, near);
  const minions = w.mobs.filter((m) => m.minion);
  const state = w.serialize();
  const savedMinions = Object.keys(state).filter((k) => minions.some((m) => m.key === k));
  ok(minions.length > 0, 'trùm đã gọi quái phụ', `${minions.length} con`);
  ok(savedMinions.length === 0, 'quái phụ không được lưu');
}

console.log(`\n${fails ? '✗' : '✓'} ${checks - fails}/${checks} kiểm tra đạt.`);
process.exit(fails ? 1 : 0);
