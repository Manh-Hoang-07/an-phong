'use strict';
/*
 * Kiểm tra: trang bị đặc biệt (chỉ mua bằng Linh Ngọc) — dữ liệu, cửa hàng, chỉ số và 5 hiệu ứng.
 *
 * Chạy mã THẬT của scene (combat.js / monsters.js / player.js) trong sandbox vm, không chép lại luật.
 * Nếu ai đổi cách nối hiệu ứng, kiểm tra này sẽ gãy.
 *
 * Chạy: node server/tools/check/check-special-gear.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..', '..');
const G = require(path.join(ROOT, 'shared'));

let fails = 0;
const ok = (cond, label, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) fails++;
};

// ---------------------------------------------------------------- 1. Dữ liệu
console.log('1. Dữ liệu 25 món: 5 ô × 5 bậc');
{
  const ids = Object.keys(G.ITEMS).filter(i => G.ITEMS[i].special);
  ok(ids.length === 25, 'có đúng 25 món đặc biệt', String(ids.length));
  ok(G.SPECIAL_SLOTS.length === 5, 'có đúng 5 ô đặc biệt', G.SPECIAL_SLOTS.join(','));
  ok(!G.SLOTS.includes('linh_vat'), 'ô Linh vật đã bị bỏ', G.SLOTS.join(','));
  ok(!G.SLOTS.includes('ho_menh'), 'ô Hộ mệnh riêng đã bị bỏ (gộp vào Bùa Hộ Mệnh)');
  for (const slot of G.SPECIAL_SLOTS) {
    const of = ids.filter(i => G.ITEMS[i].slot === slot);
    ok(of.length === 5, `${slot}: đủ 5 bậc`, String(of.length));
    const tiers = of.map(i => G.ITEMS[i].tier).sort((a, b) => a - b);
    ok(JSON.stringify(tiers) === JSON.stringify([1, 2, 3, 4, 5]), `${slot}: đủ bậc I→V`, tiers.join(','));
    ok(of.every(i => G.ITEMS[i].level), `${slot}: CÓ cấp sử dụng`, of.map(i => G.ITEMS[i].level).join(','));
    const lvls = of.slice().sort((a, b) => G.ITEMS[a].tier - G.ITEMS[b].tier).map(i => G.ITEMS[i].level);
    ok(JSON.stringify(lvls) === JSON.stringify([10, 30, 50, 70, 90]), `${slot}: cấp theo bậc 10/30/50/70/90`, lvls.join(','));
    const prices = of.slice().sort((a, b) => G.ITEMS[a].tier - G.ITEMS[b].tier).map(i => G.ITEMS[i].priceNgoc);
    ok(JSON.stringify(prices) === JSON.stringify([40, 90, 180, 320, 500]), `${slot}: giá ngọc tăng theo bậc`, prices.join(','));
    ok(of.every(i => G.ITEMS[i].price === 0), `${slot}: không bán được bằng xu (price = 0)`);
    ok(of.every(i => G.ITEMS[i].ngocGroup === 'gear'), `${slot}: nằm trong nhóm ngọc "gear"`);
    ok(of.every(i => G.ITEMS[i].fx && G.ITEMS[i].fx.kind), `${slot}: món nào cũng có hiệu ứng riêng`);
  }
}

// ---------------------------------------------------------------- 2. Không lọt quầy xu, không vào bộ theo cấp
console.log('\n2. Không lọt quầy xu, không thuộc bộ theo cấp, không cường hóa được');
{
  const ids = Object.keys(G.ITEMS).filter(i => G.ITEMS[i].special);
  ok(ids.every(i => G.setOfItem(G.ITEMS[i]) === null), 'setOfItem trả null cho mọi món đặc biệt (không hiện "Bộ ...")');
  // Quầy xu của mọi NPC không được chứa món đặc biệt
  const p = G.newPlayer('test'); p.level = 99; p.school = 'kiem_si';
  let leaked = [];
  for (const npcId of Object.keys(G.NPCS)) {
    for (const id of G.shopItems(p, npcId)) if (G.ITEMS[id] && G.ITEMS[id].special) leaked.push(`${npcId}:${id}`);
  }
  ok(leaked.length === 0, 'không món đặc biệt nào lọt vào quầy xu', leaked.join(', ') || 'sạch');
  // Lầu Trân Bảo chỉ bày BẬC I của mỗi ô (bậc cao hơn là nâng cấp tại chỗ, không bán rời)
  const ngoc = G.ngocShopItems(p, 'tran_bao');
  const inShop = ngoc.filter(i => G.ITEMS[i].special);
  ok(inShop.length === 5, 'Lầu Trân Bảo bày 5 món đặc biệt (bậc I mỗi ô)', String(inShop.length));
  ok(inShop.every(i => G.ITEMS[i].tier === 1), 'cả 5 món bày ra đều là bậc I', inShop.map(i => G.ITEMS[i].name + G.ITEMS[i].tier).join(','));
  const groups = G.ngocShopGroups(p, 'tran_bao');
  ok(groups[0] && groups[0].key === 'gear', 'nhóm "Trang bị đặc biệt" đứng đầu danh sách', groups.map(g => g.key).join(','));
}

// ---------------------------------------------------------------- 3. Chỉ số
console.log('\n3. Chỉ số cộng vào nhân vật');
{
  const p = G.newPlayer('test'); p.level = 90; p.school = 'kiem_si'; p.points = { str: 40, vit: 40, agi: 40, spi: 40 };
  const base = G.calcStats(p);
  ok(base.staRegen === 0, 'không mặc gì: hệ số hồi thể lực = 0', String(base.staRegen));
  p.equip.canh = { uid: 1, id: 'canh_db_5', qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
  const withCanh = G.calcStats(p);
  ok(withCanh.maxSta === base.maxSta + 260, 'Cánh V cộng đúng 260 thể lực tối đa', `${base.maxSta} → ${withCanh.maxSta}`);
  ok(withCanh.staRegen === 70, 'Cánh V cộng 70% hồi thể lực', String(withCanh.staRegen));
  ok(withCanh.speed > base.speed || withCanh.speed === 290, 'Cánh V cộng tốc chạy', `${base.speed} → ${withCanh.speed}`);
  p.equip.linh_dan = { uid: 2, id: 'linh_dan_db_5', qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
  const withDan = G.calcStats(p);
  ok(Math.abs(withDan.skillMul - withCanh.skillMul * 1.18) < 1e-6, 'Linh Đan V nhân +18% sát thương kỹ năng',
    `${withCanh.skillMul.toFixed(3)} → ${withDan.skillMul.toFixed(3)}`);
  ok(withDan.cdr > withCanh.cdr, 'Linh Đan V cộng giảm hồi chiêu', `${withCanh.cdr}% → ${withDan.cdr}%`);
  // Bùa Hộ Mệnh: máu + phòng thủ
  p.equip.bua = { uid: 3, id: 'bua_db_5', qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
  const withBua = G.calcStats(p);
  ok(withBua.maxHp === withDan.maxHp + 1650, 'Bùa Hộ Mệnh V cộng đúng 1650 máu', `${withDan.maxHp} → ${withBua.maxHp}`);
  ok(withBua.def === withDan.def + 88, 'Bùa Hộ Mệnh V cộng đúng 88 phòng thủ', `${withDan.def} → ${withBua.def}`);
  // Ấn: tấn công + chí mạng
  p.equip.an = { uid: 4, id: 'an_db_5', qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
  const withAn = G.calcStats(p);
  ok(withAn.atk === withBua.atk + 92, 'Ấn V cộng đúng 92 tấn công', `${withBua.atk} → ${withAn.atk}`);
  ok(withAn.crit > withBua.crit, 'Ấn V cộng chí mạng', `${withBua.crit}% → ${withAn.crit}%`);
  // Chuông: xu + kinh nghiệm + hút máu
  p.equip.chuong = { uid: 5, id: 'chuong_db_5', qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
  const withChuong = G.calcStats(p);
  ok(withChuong.goldfind === withAn.goldfind + 22, 'Chuông V cộng đúng 22% xu rơi thêm', `${withAn.goldfind}% → ${withChuong.goldfind}%`);
  ok(withChuong.expfind === withAn.expfind + 12, 'Chuông V cộng đúng 12% kinh nghiệm thêm', `${withAn.expfind}% → ${withChuong.expfind}%`);
  ok(withChuong.lifesteal === withAn.lifesteal + 3, 'Chuông V cộng đúng 3% hút máu', `${withAn.lifesteal}% → ${withChuong.lifesteal}%`);
  // specialFx gom đủ 5 loại
  const fx = G.specialFx(p);
  ok(Object.keys(fx).sort().join(',') === 'dodge,everyNth,onKill,skillPower,undying', 'specialFx gom đủ 5 loại hiệu ứng', Object.keys(fx).join(','));
}

// ---------------------------------------------------------------- 4. Hiệu ứng chạy thật trong scene
// Dựng cảnh giả y như check-buff-stacking.js: chỉ cấp đúng những gì mã scene chạm tới.
function makeScene() {
  let now = 1000;
  const timers = [];
  const scene = {
    time: {
      get now() { return now; },
      delayedCall(ms, fn) { timers.push({ at: now + ms, fn }); return { remove() {} }; },
      addEvent(o) { timers.push({ at: now + (o.delay || 0), fn: () => { if (o.callback) o.callback(); } }); return { remove() {} }; },
    },
    buffs: {}, cooldowns: {}, cooldownLen: {},
    add: (() => {
      const stub = () => new Proxy({}, {
        get(t, k) { if (k === 'then') return undefined; if (!(k in t)) t[k] = () => stub(); return t[k]; },
        set(t, k, v) { t[k] = v; return true; },
      });
      return { image: stub, graphics: stub, rectangle: stub, sprite: stub, text: stub, container: stub };
    })(),
    tweens: { add(o) { if (o && o.onComplete) o.onComplete(); } },
    floatText() {}, ringFx() {}, slashFx() {}, swing() {}, attackAnim() {}, hitstop() {},
    hitBox() {}, hitCircle() {}, shoot() {}, telegraph() {}, skillHeal() {},
    hitFx() {}, killFx() {}, drawMonsterBar() {}, monsterTop() { return 0; }, damageChain() {},
    cameras: { main: { shake() {}, flash() {} } },
    physics: { world: { pause() {}, resume() {} } },
    timeScale: 1,
    monsters: [], projectiles: { add() {}, getChildren: () => [] },
    pendingKills: [], killFlush: null,
    groundY() { return 0; },
    facing: 1,
    player: new Proxy({ x: 0, y: 0, body: { bottom: 0, setVelocity() {}, setAllowGravity() {}, setVelocityX() {}, setVelocityY() {} }, texture: { key: 'p' }, flipX: false }, {
      get: (t, k) => (k in t ? t[k] : () => {}),
      set: (t, k, v) => (t[k] = v, true),
    }),
    invulnUntil: 0,
    weapon: new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => (t[k] = v, true) }),
    shadow: new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => (t[k] = v, true) }),
    hasPassive: () => false,
    accent: () => 0xffffff,
    sys: { isActive: () => true },
    worldW: 2000,
    advance(ms) {
      const target = now + ms;
      for (;;) {
        const due = timers.filter(t => t.at <= target).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        timers.splice(timers.indexOf(due), 1);
        now = due.at;
        due.fn();
      }
      now = target;
    },
  };
  return scene;
}

const sandbox = {
  console, Math, Date, JSON, Object, Array, Number, String, Boolean, isNaN, parseInt, parseFloat,
  performance: { now: () => 0 },
  setTimeout: (fn) => 0, clearTimeout: () => {},
  Phaser: {
    Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), Between: (a, b) => a, FloatBetween: (a, b) => a },
    BlendModes: { ADD: 1 },
  },
  App: { player: { school: 'kiem_si', skillSlots: [], level: 90, equip: {} }, stats: { skillMul: 1, maxHp: 1000, maxMp: 500, costMul: 1, cdr: 0, atk: 100, def: 0, staRegen: 0 }, hp: 1000, mp: 500, sta: 500 },
  GameData: G,
  Art: { HUNTERS: new Proxy({}, { get: () => ({ accent: 0xbfe9ff }) }), WEAPONS: {} },
  UI: { log() {}, banner() {} },
  Sound: { play() {} },
  Net: { action: () => Promise.resolve() },
  Realtime: { send() {} },
  document: { getElementById: () => null, querySelector: () => null },
  WorldScene: {
    mix(c) {
      for (const k of Object.getOwnPropertyNames(c.prototype)) {
        if (k === 'constructor') continue;
        const d = Object.getOwnPropertyDescriptor(c.prototype, k);
        d.enumerable = true;
        Object.defineProperty(sandbox.WorldScene.proto, k, d);
      }
    },
    proto: {},
  },
};
sandbox.self = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ['public/js/scene/skills.js', 'public/js/scene/combat.js', 'public/js/scene/player.js', 'public/js/scene/monsters.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
}
const Scene = sandbox.WorldScene.proto;

function newScene() {
  const s = makeScene();
  Object.assign(s, Scene);
  return s;
}
// Mặc một món đặc biệt vào ô của nó
function wear(slot, id) {
  sandbox.App.player.equip[slot] = { uid: 1, id, qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
}
function strip() { sandbox.App.player.equip = {}; }

// Thanh máu quái: mọi lời gọi trả về chính nó (fillStyle().fillRect()…)
const barStub = () => new Proxy({}, {
  get(t, k) { if (k === 'then') return undefined; if (!(k in t)) t[k] = () => barStub(); return t[k]; },
  set(t, k, v) { t[k] = v; return true; },
});
const monSprite = () => new Proxy({ x: 0, y: 0, height: 20, originY: 1, body: { center: { y: 0 }, setVelocityX() {}, setVelocity() {} }, setVelocityX() {}, play() {}, setPosition() {}, setAlpha() {}, setScale() {}, setAngle() {}, setVisible() {}, setTint() {} },
  { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => (t[k] = v, true) });

console.log('\n4. Hiệu ứng chạy thật trong scene');

// 4a. Bùa Hộ Mệnh — Hộ Mệnh: máu cạn thì không chết, giữ 1 máu `dur` giây, hồi lại sau `cd` giây.
// Bậc V: 10 giây bất tử, hồi 40 giây. Bậc I: 5 giây, hồi 60 giây — kiểm cả hai để chắc hiệu ứng TĂNG theo bậc.
{
  strip();
  const s = newScene();
  sandbox.App.stats.maxHp = 10000; sandbox.App.stats.def = 0;
  const hit = (sc) => { sc.invulnUntil = 0; const before = sandbox.App.hp; sc.hurtPlayer(1000, 1, 260, null); return before - sandbox.App.hp; };
  // Không mặc Bùa: máu về 0 thì chết luôn, không có Hộ Mệnh nào
  sandbox.App.hp = 500;
  hit(s);
  ok(!s.lastStandUntil, 'không mặc Bùa: máu cạn là gục, không có Hộ Mệnh', String(s.lastStandUntil));
  ok(s.dead === true, 'không mặc Bùa: chết thật', String(s.dead));

  // Mặc Bùa: đòn gây chết → không chết, giữ đúng 1 máu
  strip();
  const s2 = newScene();
  sandbox.App.stats.maxHp = 10000; sandbox.App.stats.def = 0;
  wear('bua', 'bua_db_5');
  sandbox.App.hp = 500;
  s2.invulnUntil = 0;
  s2.hurtPlayer(9000, 1, 260, null);
  ok(s2.dead !== true, 'mặc Bùa: máu cạn nhưng KHÔNG chết', String(s2.dead));
  ok(sandbox.App.hp === 1, 'máu giữ đúng 1', String(sandbox.App.hp));
  ok(!!s2.lastStandUntil, 'Hộ Mệnh đang bật');
  const durMs = s2.lastStandUntil - s2.time.now;
  ok(Math.abs(durMs - 9000) < 50, 'bậc V: Hộ Mệnh giữ 9 giây', `${durMs}ms`);
  const cdMs = s2.lastStandCd - s2.time.now;
  ok(Math.abs(cdMs - 60000) < 50, 'bậc V: hồi lại sau 60 giây', `${cdMs}ms`);

  // Trong 5 giây: ăn đòn liên tục vẫn không mất máu, không chết
  for (let i = 0; i < 20; i++) { s2.invulnUntil = 0; s2.hurtPlayer(5000, 1, 260, null); }
  ok(sandbox.App.hp === 1, 'trong 9 giây ăn 20 đòn nặng: máu vẫn 1', String(sandbox.App.hp));
  ok(s2.dead !== true, 'trong 9 giây không chết', String(s2.dead));

  // Hết 9 giây mà chưa hồi máu → vẫn còn 1 máu nên chưa gục
  s2.advance(9100);
  s2.lastStandExpire(s2.time.now);
  ok(s2.dead !== true, 'hết 9 giây nhưng còn 1 máu: chưa gục', String(s2.dead));

  // Hết 9 giây mà máu đã về 0 (bị đánh đúng lúc hết hạn) → gục
  strip();
  const s3 = newScene();
  sandbox.App.stats.maxHp = 10000; sandbox.App.stats.def = 0;
  wear('bua', 'bua_db_5');
  sandbox.App.hp = 500;
  s3.invulnUntil = 0;
  s3.hurtPlayer(9000, 1, 260, null);
  ok(s3.dead !== true && sandbox.App.hp === 1, 'lần đầu: sống sót với 1 máu');
  sandbox.App.hp = 0;                       // giả lập hết hạn đúng lúc máu đã cạn
  s3.advance(9100);
  s3.lastStandExpire(s3.time.now);
  ok(s3.dead === true, 'hết 9 giây mà máu 0 → gục', String(s3.dead));

  // Bậc I phải YẾU HƠN bậc V: 8 giây, nhưng hồi chiêu vẫn 60 giây
  strip();
  const s1 = newScene();
  sandbox.App.stats.maxHp = 10000; sandbox.App.stats.def = 0;
  wear('bua', 'bua_db_1');
  sandbox.App.hp = 500;
  s1.invulnUntil = 0;
  s1.hurtPlayer(9000, 1, 260, null);
  ok(s1.dead !== true && sandbox.App.hp === 1, 'bậc I: vẫn sống sót với 1 máu');
  ok(Math.abs((s1.lastStandUntil - s1.time.now) - 5000) < 50, 'bậc I: giữ 5 giây (ngắn hơn bậc V)', `${s1.lastStandUntil - s1.time.now}ms`);
  ok(Math.abs((s1.lastStandCd - s1.time.now) - 60000) < 50, 'bậc I: hồi chiêu cũng 60 giây', `${s1.lastStandCd - s1.time.now}ms`);

  // Hồi chiêu GHIM 60 giây ở MỌI bậc
  for (const t of [1, 2, 3, 4, 5]) {
    const f = G.ITEMS['bua_db_' + t].fx;
    ok(f.cd === 60, `bậc ${t}: hồi chiêu đúng 60 giây`, String(f.cd));
  }
  // Bậc thang đều +1 giây: 5/6/7/8/9
  ok([1, 2, 3, 4, 5].map(t => G.ITEMS['bua_db_' + t].fx.dur).join(',') === '5,6,7,8,9', 'bất tử tăng đều 1 giây mỗi bậc: 5/6/7/8/9',
    [1, 2, 3, 4, 5].map(t => G.ITEMS['bua_db_' + t].fx.dur).join(','));

  // Hồi chiêu: trong 60 giây không cứu lần hai
  strip();
  const s4 = newScene();
  sandbox.App.stats.maxHp = 10000; sandbox.App.stats.def = 0;
  wear('bua', 'bua_db_5');
  sandbox.App.hp = 500;
  s4.invulnUntil = 0;
  s4.hurtPlayer(9000, 1, 260, null);
  const cd1 = s4.lastStandCd;
  s4.lastStandUntil = 0;                    // hết 5 giây
  sandbox.App.hp = 500;
  s4.invulnUntil = 0;
  s4.hurtPlayer(9000, 1, 260, null);
  ok(s4.dead === true, 'đang hồi chiêu 60 giây: đòn chết thứ hai là gục thật', String(s4.dead));
  ok(s4.lastStandCd === cd1, 'không bật lại trong 60 giây', `cd còn ${Math.round((cd1 - s4.time.now) / 1000)}s`);
}

// 4b. Cánh — Phiêu Diêu (né) và hồi thể lực
{
  strip();
  const s = newScene();
  sandbox.App.stats.maxHp = 10000; sandbox.App.stats.def = 0;
  // Không mặc Cánh: 200 đòn, không lần nào né (không có hiệu ứng)
  let dodged = 0;
  for (let i = 0; i < 200; i++) { sandbox.App.hp = 10000; s.invulnUntil = 0; const b = sandbox.App.hp; s.hurtPlayer(10, 1, 260, null); if (sandbox.App.hp === b) dodged++; }
  ok(dodged === 0, 'không mặc Cánh: không có cơ hội né', String(dodged));
  // Mặc Cánh V: 15% — đo trên 4000 đòn, phải nằm quanh 15%
  wear('canh', 'canh_db_5');
  dodged = 0;
  for (let i = 0; i < 4000; i++) { sandbox.App.hp = 10000; s.invulnUntil = 0; const b = sandbox.App.hp; s.hurtPlayer(10, 1, 260, null); if (sandbox.App.hp === b) dodged++; }
  const rate = dodged / 4000;
  ok(rate > 0.11 && rate < 0.19, 'Cánh V: né thật, quanh 15% trên 4000 đòn', `${(rate * 100).toFixed(1)}%`);
  // Hồi thể lực: cùng thời gian, có Cánh hồi nhiều hơn
  const tick = (staRegen) => {
    sandbox.App.stats.maxSta = 10000; sandbox.App.stats.staRegen = staRegen;
    sandbox.App.sta = 0; sandbox.App.staLocked = false;
    const sc = newScene(); sc.dead = false;
    sc.staminaTick(1e9, 1000);   // 1 giây, đã qua delay nên rate = 1
    return sandbox.App.sta;
  };
  const plain = tick(0), boosted = tick(70);
  ok(boosted > plain, 'Cánh cộng % hồi thể lực: hồi nhanh hơn', `${plain.toFixed(1)} → ${boosted.toFixed(1)} mỗi giây`);
  ok(Math.abs(boosted - plain * 1.7) < 0.01, 'đúng hệ số 1 + 70%', `${(boosted / plain).toFixed(2)}×`);
  sandbox.App.stats.staRegen = 0;
}

// 4c. Ấn — Ấn Sát (đòn thứ 5)
{
  strip();
  const s = newScene();
  const mon = {
    alive: true, hp: 1e9, maxHp: 1e9, net: false, anCount: 0,
    def: { name: 'Bia', level: 50, def: 0, respawn: 1 },
    sprite: monSprite(), label: barStub(), bar: barStub(),
  };
  s.monsters = [mon];
  const dmgOf = () => { const before = mon.hp; s.damageMonster(mon, 1, { basic: true }); return before - mon.hp; };
  // Không mặc Ấn: 5 đòn đều nhau (chỉ lệch ±10% ngẫu nhiên)
  const plain = [1, 2, 3, 4, 5].map(() => dmgOf());
  ok(mon.anCount === undefined || mon.anCount === 0, 'không mặc Ấn: không có bộ đếm', String(mon.anCount));
  // Mặc Ấn V: đòn thứ 5 nặng hơn hẳn
  wear('an', 'an_db_5');
  mon.anCount = 0;
  const seq = [1, 2, 3, 4, 5].map(() => dmgOf());
  const avg4 = (seq[0] + seq[1] + seq[2] + seq[3]) / 4;
  ok(seq[4] > avg4 * 1.5, 'Ấn V: đòn thứ 5 nặng hơn hẳn 4 đòn đầu', `${seq.slice(0, 4).join('/')} → đòn 5: ${seq[4]}`);
  ok(mon.anCount === 0, 'đếm lại từ đầu sau đòn thứ 5', String(mon.anCount));
  // Đổi mục tiêu thì đếm lại: mục tiêu mới có bộ đếm riêng
  const mon2 = Object.assign({}, mon, { hp: 1e9, anCount: 0 });
  s.monsters = [mon, mon2];
  s.damageMonster(mon2, 1, { basic: true });
  ok(mon2.anCount === 1, 'mục tiêu mới đếm riêng từ 1', String(mon2.anCount));
}

// 4d. Chuông Trấn Hồn — Trấn Hồn (hồi khi hạ quái)
{
  strip();
  const s = newScene();
  sandbox.App.stats.maxHp = 10000; sandbox.App.stats.maxMp = 1000;
  const mkMon = () => ({
    alive: true, hp: 0, maxHp: 100, net: false, id: 'm1', minion: true,
    def: { name: 'Quái', level: 50, def: 0, respawn: 1 },
    sprite: monSprite(), label: barStub(), bar: barStub(),
  });
  // Không mặc Chuông: hạ quái không hồi gì
  sandbox.App.hp = 5000; sandbox.App.mp = 100;
  s.killMonster(mkMon());
  ok(sandbox.App.hp === 5000, 'không mặc Chuông: hạ quái không hồi máu', String(sandbox.App.hp));
  // Mặc Chuông V: hồi 4% máu và 4% năng lượng tối đa
  wear('chuong', 'chuong_db_5');
  sandbox.App.hp = 5000; sandbox.App.mp = 100;
  s.killMonster(mkMon());
  ok(sandbox.App.hp === 5400, 'Chuông V: hạ quái hồi 4% máu tối đa', `5000 → ${sandbox.App.hp} (mong đợi 5400)`);
  ok(sandbox.App.mp === 140, 'Chuông V: hạ quái hồi 4% năng lượng tối đa', `100 → ${sandbox.App.mp} (mong đợi 140)`);
  // Không vượt trần
  sandbox.App.hp = 9900;
  s.killMonster(mkMon());
  ok(sandbox.App.hp === 10000, 'hồi không vượt máu tối đa', String(sandbox.App.hp));
}

// 4e. Linh Đan — Tụ Linh (đã kiểm ở phần chỉ số, xác nhận lại qua calcStats thật)
{
  strip();
  const p = G.newPlayer('t'); p.level = 90; p.school = 'kiem_si'; p.points = { str: 40, vit: 40, agi: 40, spi: 40 };
  const a = G.calcStats(p).skillMul;
  p.equip.linh_dan = { uid: 1, id: 'linh_dan_db_1', qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
  const b = G.calcStats(p).skillMul;
  ok(Math.abs(b - a * 1.05) < 1e-6, 'Linh Đan I nhân +5% sát thương kỹ năng', `${a.toFixed(3)} → ${b.toFixed(3)}`);
}

// ---------------------------------------------------------------- 5. Trang bị được, không cường hóa
console.log('\n5. Trang bị được và chặn đúng ở Thợ rèn');
{
  const p = G.newPlayer('t'); p.level = 90; p.school = 'kiem_si';
  const ids = Object.keys(G.ITEMS).filter(i => G.ITEMS[i].special);
  const bad = ids.filter(i => !G.canUseItem(p, G.ITEMS[i]));
  ok(bad.length === 0, 'cấp 90 mặc được cả 25 món', bad.join(', ') || 'tất cả OK');
  // CÓ cấp sử dụng: cấp 1 chỉ mặc được bậc I (cấp 10)? Không — bậc I cần cấp 10, nên cấp 1 chặn hết.
  const low = G.newPlayer('t'); low.level = 1;
  ok(ids.every(i => !G.canUseItem(low, G.ITEMS[i])), 'nhân vật cấp 1 KHÔNG mặc được món nào (bậc I cần cấp 10)');
  // Cấp 10 mặc được đúng bậc I của cả 5 ô
  const lv10 = G.newPlayer('t'); lv10.level = 10;
  const okAt10 = ids.filter(i => G.canUseItem(lv10, G.ITEMS[i]));
  ok(okAt10.length === 5 && okAt10.every(i => G.ITEMS[i].tier === 1), 'cấp 10 mặc được đúng 5 món bậc I', okAt10.map(i => G.ITEMS[i].name).join(','));
  // Cấp 50: bậc I–III (10/30/50), chặn IV (70) và V (90)
  const lv50 = G.newPlayer('t'); lv50.level = 50;
  const okAt50 = ids.filter(i => G.canUseItem(lv50, G.ITEMS[i]));
  ok(okAt50.length === 15 && okAt50.every(i => G.ITEMS[i].tier <= 3), 'cấp 50 mặc được bậc I–III (15 món)', String(okAt50.length));
  // Không cường hóa: món đặc biệt có cờ special để smith.js chặn
  ok(ids.every(i => G.ITEMS[i].special === true), 'mọi món đặc biệt có cờ special (Thợ rèn chặn cường hóa / tẩy luyện / phân rã)');
  // Bán lại được 0 xu
  ok(ids.every(i => G.sellPrice({ id: i, q: 1, plus: 0 }) === 0), 'bán lại được 0 xu (không đổi ngọc ra xu được)');
}

// ---------------------------------------------------------------- 5b. Mua bậc I + nâng bậc tại chỗ
console.log('\n5b. Mua bậc I cần đá, nâng bậc tại chỗ giữ nguyên uid');
{
  const items = require(path.join(ROOT, 'server', 'game', 'actions', 'items'));
  const p = G.newPlayer('buy'); p.level = 90; p.school = 'kiem_si'; p.linhNgoc = 5000; p.map = 'lang';
  const buy = (item) => { const ev = []; try { items.buy_ngoc(p, { npc: 'tran_bao', item, qty: 1 }, ev); return { ok: true, text: ev.map(e => e.text).join('') }; } catch (e) { return { ok: false, text: e.message }; } };
  const up = (a) => { const ev = []; try { items.upgrade_special(p, a, ev); return { ok: true, text: ev.map(e => e.text).join('') }; } catch (e) { return { ok: false, text: e.message }; } };
  const giveStone = (n) => { p.bag = p.bag.filter(e => e.id !== 'huyen_tinh_thach'); if (n) p.bag.push({ uid: 90000 + n, id: 'huyen_tinh_thach', qty: n, plus: 0 }); };
  const stone = () => p.bag.filter(e => e.id === 'huyen_tinh_thach').reduce((s, e) => s + e.qty, 0);

  // Quầy chỉ bày bậc I
  const shopIds = G.ngocShopItems(p, 'tran_bao').filter(i => G.ITEMS[i].special);
  ok(shopIds.length === 5, 'quầy chỉ bày 5 món đặc biệt (bậc I mỗi ô)', String(shopIds.length));
  ok(shopIds.every(i => G.ITEMS[i].tier === 1), 'cả 5 món bày ra đều là bậc I', shopIds.map(i => G.ITEMS[i].name).join(','));
  ok(!G.ngocShopItems(p, 'tran_bao').includes('bua_db_5'), 'bậc V không bán rời ở quầy');

  // Thiếu đá vẫn mua được bậc I: đá là chi phí NÂNG bậc, không phải chi phí mua
  giveStone(0);
  const noStone = buy('bua_db_1');
  ok(noStone.ok, 'không có đá vẫn mua được bậc I', noStone.text);
  ok(p.linhNgoc === 4960, 'mua bậc I trừ đúng 40 Linh Ngọc', String(p.linhNgoc));
  ok(stone() === 0, 'mua bậc I KHÔNG trừ đá', String(stone()));

  // Mua lại cùng ô bị chặn
  giveStone(5);
  const again = buy('bua_db_1');
  ok(!again.ok, 'đã có Bùa rồi thì không mua lại', again.text);
  ok(p.linhNgoc === 4960, 'mua trùng: không trừ ngọc', String(p.linhNgoc));

  // Nâng bậc: uid không đổi, trừ đá + ngọc đúng bảng
  const entry = p.bag.find(e => e.id === 'bua_db_1');
  const uid = entry.uid;
  const ngoc0 = p.linhNgoc;
  giveStone(31);
  const chain = [
    { to: 2, stone: 2, ngoc: 90, dur: 6, cd: 60 },
    { to: 3, stone: 4, ngoc: 180, dur: 7, cd: 60 },
    { to: 4, stone: 8, ngoc: 320, dur: 8, cd: 60 },
    { to: 5, stone: 16, ngoc: 500, dur: 9, cd: 60 },
  ];
  let ngocLeft = ngoc0, stoneLeft = 31;
  for (const step of chain) {
    const r = up({ uid });
    ok(r.ok, `nâng lên bậc ${step.to} được`, r.text);
    const d = G.ITEMS[entry.id];
    ok(d.tier === step.to, `bậc = ${step.to}`, String(d.tier));
    ok(entry.uid === uid, `bậc ${step.to}: uid KHÔNG đổi`, String(entry.uid));
    ok(d.name === 'Bùa Hộ Mệnh', `bậc ${step.to}: tên không kèm số La Mã`, d.name);
    ngocLeft -= step.ngoc; stoneLeft -= step.stone;
    ok(p.linhNgoc === ngocLeft, `bậc ${step.to}: trừ đúng ${step.ngoc} ngọc`, String(p.linhNgoc));
    ok(stone() === stoneLeft, `bậc ${step.to}: trừ đúng ${step.stone} đá`, String(stone()));
    ok(d.fx.dur === step.dur && d.fx.cd === step.cd, `bậc ${step.to}: Hộ Mệnh ${step.dur}s · hồi ${step.cd}s`, JSON.stringify(d.fx));
  }
  ok(p.bag.filter(e => G.ITEMS[e.id] && G.ITEMS[e.id].special).length === 1, 'nâng 4 bậc: túi vẫn chỉ 1 món đặc biệt', String(p.bag.filter(e => G.ITEMS[e.id] && G.ITEMS[e.id].special).length));

  // Bậc V là trần
  const maxed = up({ uid });
  ok(!maxed.ok, 'bậc V rồi thì không nâng được nữa', maxed.text);

  // Cấp sử dụng gắn với bậc: chưa đủ cấp của bậc kế thì không nâng được, không trừ gì
  const pLv = G.newPlayer('buyLv'); pLv.level = 20; pLv.school = 'kiem_si'; pLv.linhNgoc = 5000; pLv.map = 'lang';
  pLv.bag.push({ uid: 11, id: 'bua_db_1', qty: 1, plus: 0, q: 1, roll: 1, aff: [] });
  pLv.bag.push({ uid: 12, id: 'huyen_tinh_thach', qty: 20, plus: 0 });
  const lowLvUp = (() => { const ev = []; try { items.upgrade_special(pLv, { uid: 11 }, ev); return { ok: true }; } catch (e) { return { ok: false, text: e.message }; } })();
  ok(!lowLvUp.ok, 'cấp 20 không nâng được lên bậc II (cần cấp 30)', lowLvUp.text);
  ok(pLv.linhNgoc === 5000, 'thiếu cấp: không trừ ngọc', String(pLv.linhNgoc));
  ok(pLv.bag.find(e => e.id === 'huyen_tinh_thach').qty === 20, 'thiếu cấp: không trừ đá', String(pLv.bag.find(e => e.id === 'huyen_tinh_thach').qty));
  ok(G.ITEMS[pLv.bag.find(e => e.uid === 11).id].tier === 1, 'thiếu cấp: bậc không đổi', String(G.ITEMS[pLv.bag.find(e => e.uid === 11).id].tier));
  pLv.level = 30;
  const nowOkUp = (() => { const ev = []; try { items.upgrade_special(pLv, { uid: 11 }, ev); return { ok: true }; } catch (e) { return { ok: false, text: e.message }; } })();
  ok(nowOkUp.ok, 'đủ cấp 30 thì nâng lên bậc II được', nowOkUp.text);

  // Nâng khi thiếu đá / thiếu ngọc đều bị chặn và không trừ gì
  giveStone(0);
  const p2 = G.newPlayer('buy2'); p2.level = 90; p2.school = 'kiem_si'; p2.linhNgoc = 5000; p2.map = 'lang';
  p2.bag.push({ uid: 1, id: 'an_db_1', qty: 1, plus: 0, q: 1, roll: 1, aff: [] });
  const noStoneUp = (() => { const ev = []; try { items.upgrade_special(p2, { uid: 1 }, ev); return { ok: true }; } catch (e) { return { ok: false, text: e.message }; } })();
  ok(!noStoneUp.ok && p2.linhNgoc === 5000, 'thiếu đá khi nâng: chặn, không trừ ngọc', noStoneUp.text);
  p2.bag.push({ uid: 2, id: 'huyen_tinh_thach', qty: 5, plus: 0 });
  p2.linhNgoc = 0;
  const noNgocUp = (() => { const ev = []; try { items.upgrade_special(p2, { uid: 1 }, ev); return { ok: true }; } catch (e) { return { ok: false, text: e.message }; } })();
  ok(!noNgocUp.ok, 'thiếu ngọc khi nâng: chặn', noNgocUp.text);
  ok(p2.bag.find(e => e.id === 'huyen_tinh_thach').qty === 5, 'thiếu ngọc: không trừ đá', String(p2.bag.find(e => e.id === 'huyen_tinh_thach').qty));
  ok(G.ITEMS[p2.bag.find(e => e.uid === 1).id].tier === 1, 'thiếu ngọc: bậc không đổi', String(G.ITEMS[p2.bag.find(e => e.uid === 1).id].tier));

  // Đang mặc vẫn nâng được bằng slot
  const p3 = G.newPlayer('buy3'); p3.level = 90; p3.school = 'kiem_si'; p3.linhNgoc = 5000; p3.map = 'lang';
  p3.equip.canh = { uid: 7, id: 'canh_db_1', qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
  p3.bag.push({ uid: 8, id: 'huyen_tinh_thach', qty: 10, plus: 0 });
  const wornUp = (() => { const ev = []; try { items.upgrade_special(p3, { slot: 'canh' }, ev); return { ok: true }; } catch (e) { return { ok: false, text: e.message }; } })();
  ok(wornUp.ok, 'nâng bậc món ĐANG MẶC được (theo ô)', wornUp.text);
  ok(p3.equip.canh.uid === 7 && G.ITEMS[p3.equip.canh.id].tier === 2, 'món đang mặc: giữ uid, lên bậc II', `${p3.equip.canh.uid} / ${G.ITEMS[p3.equip.canh.id].tier}`);
}

// ---------------------------------------------------------------- 5c. Đá chỉ rơi từ trùm và tinh anh
console.log('\n5c. Huyền Tinh Thạch chỉ rơi từ trùm và tinh anh');
{
  const all = Object.entries(G.MONSTERS);
  const has = ([, m]) => (m.drops || []).some(d => d[0] === 'huyen_tinh_thach');
  const bosses = all.filter(([, m]) => m.boss), elites = all.filter(([, m]) => m.elite);
  ok(bosses.length > 0 && bosses.every(has), `mọi trùm đều rơi đá (${bosses.length})`, String(bosses.filter(has).length));
  ok(elites.length > 0 && elites.every(has), `mọi tinh anh đều rơi đá (${elites.length})`, String(elites.filter(has).length));
  ok(all.filter(([, m]) => !m.boss && !m.elite && has([, m])).length === 0, 'quái thường KHÔNG rơi đá');
  const d = G.ITEMS.huyen_tinh_thach;
  ok(d && d.stack === true, 'đá xếp chồng được trong túi');
  ok(G.sellPrice({ id: 'huyen_tinh_thach', q: 1, plus: 0 }) === 0, 'đá không bán lại được (0 xu)');
  ok(!G.ngocShopItems(G.newPlayer('x'), 'tran_bao').includes('huyen_tinh_thach'), 'đá không bán ở Lầu Trân Bảo');
  ok(!Object.values(G.NPCS).some(n => (n.shop || []).includes('huyen_tinh_thach')), 'đá không bán ở quầy xu nào');
}

// ---------------------------------------------------------------- 6. Người chơi cũ không gãy
console.log('\n6. Người chơi cũ: 15 ô tự có, ô trống bỏ qua');
{
  const p = G.newPlayer('t');
  ok(G.SLOTS.every(s => s in p.equip), 'newPlayer tạo đủ 15 ô', String(Object.keys(p.equip).length));
  ok(G.SLOTS.every(s => p.equip[s] === null), 'mọi ô khởi tạo rỗng');
  const st = G.calcStats(p);
  ok(st.maxSta > 0 && st.staRegen === 0, 'chưa mặc gì vẫn tính chỉ số bình thường', `maxSta=${st.maxSta}, staRegen=${st.staRegen}`);
  ok(Object.keys(G.specialFx(p)).length === 0, 'chưa mặc gì: không hiệu ứng nào bật');
}

console.log(fails ? `\n✗ ${fails} kiểm tra không đạt.` : '\n✓ Tất cả kiểm tra đạt.');
process.exitCode = fails ? 1 : 0;
