'use strict';
/*
 * Kiểm tra: các kỹ năng có hiệu ứng dùng CHỒNG LÊN NHAU được.
 *
 * Lỗi cũ: bảng hiệu ứng (scene.buffs) khoá theo TÊN hiệu ứng ('rage', 'guard', 'awaken'…),
 * nên hai kỹ năng khác nhau cùng tên ghi đè lên nhau — dùng A (10 giây) rồi bấm B là A mất ngay.
 * Nay bảng khoá theo ID KỸ NĂNG: mỗi kỹ năng một ô, cùng chạy, chỉ số cộng dồn.
 *
 * Script này chạy thẳng mã thật của scene (skills.js / combat.js / player.js) trong sandbox,
 * không chép lại luật — nếu ai đổi lại cách khoá, kiểm tra sẽ gãy.
 *
 * Chạy: node server/tools/check/check-buff-stacking.js
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

// ---------------------------------------------------------------- dựng cảnh giả
// Phaser và DOM không có ở đây, nên chỉ cấp đúng những gì mã scene chạm tới.
function makeScene() {
  let now = 1000;
  const timers = [];
  const scene = {
    time: {
      get now() { return now; },
      delayedCall(ms, fn) { timers.push({ at: now + ms, fn }); return { remove() {} }; },
      addEvent(o) { timers.push({ at: now + (o.delay || 0), fn: () => { if (o.callback) o.callback(); } }); return { remove() {} }; },
    },
    buffs: {},
    cooldowns: {},
    cooldownLen: {},
    // Đồ hoạ chỉ để chạy qua, kiểm tra này chỉ quan tâm trạng thái hiệu ứng.
    // Stub tự trả về chính nó cho mọi lời gọi (setDepth/setTint/setScale/…).
    add: (() => {
      const stub = () => new Proxy({}, {
        get(t, k) {
          if (k === 'then') return undefined;
          if (!(k in t)) t[k] = () => stub();
          return t[k];
        },
        set(t, k, v) { t[k] = v; return true; },
      });
      return { image: stub, graphics: stub, rectangle: stub, sprite: stub, text: stub, container: stub };
    })(),
    tweens: { add(o) { if (o && o.onComplete) o.onComplete(); } },
    floatText() {}, ringFx() {}, slashFx() {}, swing() {}, attackAnim() {}, hitstop() {},
    hitBox() {}, hitCircle() {}, shoot() {}, telegraph() {}, skillHeal() {},
    cameras: { main: { shake() {}, flash() {} } },
    monsters: [],
    projectiles: { add() {}, getChildren: () => [] },
    facing: 1,
    player: new Proxy({ x: 0, y: 0, body: { bottom: 0, setVelocity() {}, setAllowGravity() {}, setVelocityX() {}, setVelocityY() {} }, texture: { key: 'p' }, flipX: false }, {
      get: (t, k) => (k in t ? t[k] : () => {}),
      set: (t, k, v) => (t[k] = v, true),
    }),
    invulnUntil: 0,
    // Sprite phụ của nhân vật (vũ khí, tay…) — chỉ để chạy qua
    weapon: new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => (t[k] = v, true) }),
    shadow: new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => (t[k] = v, true) }),
    hasPassive: () => false,
    accent: () => 0xffffff,
    sys: { isActive: () => true },
    worldW: 2000,
    // Tiến thời gian: chạy mọi hẹn giờ đã tới hạn
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

// Nạp mã thật: skills.js (mix vào WorldScene), combat.js, player.js
const sandbox = {
  console, Math, Date, JSON, Object, Array, Number, String, Boolean, isNaN, parseInt, parseFloat,
  performance: { now: () => 0 },
  Phaser: {
    Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), Between: (a, b) => a, FloatBetween: (a, b) => a },
    BlendModes: { ADD: 1 },
  },
  App: { player: { school: 'kiem_si', skillSlots: [], level: 50 }, stats: { skillMul: 1, maxHp: 1000, maxMp: 500, costMul: 1, cdr: 0, atk: 100, def: 0 }, hp: 1000, mp: 500 },
  GameData: G,
  Art: { HUNTERS: new Proxy({}, { get: () => ({ accent: 0xbfe9ff }) }), WEAPONS: {} },
  UI: { log() {} },
  Sound: { play() {} },
  Net: { action: () => Promise.resolve() },
  Realtime: { send() {} },
  document: { getElementById: () => null, querySelector: () => null },
  WorldScene: {
    // Phương thức của class KHÔNG enumerable, nên phải chép theo descriptor — và bật enumerable
    // để Object.assign ở newScene() thật sự chép được sang cảnh giả.
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
for (const f of ['public/js/scene/skills.js', 'public/js/scene/combat.js', 'public/js/scene/player.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
}
const Scene = sandbox.WorldScene.proto;

function newScene() {
  const s = makeScene();
  Object.assign(s, Scene);
  return s;
}

// Dùng một kỹ năng bằng mã thật của scene
function cast(s, id, lv = 10) {
  sandbox.App.player.skillSlots = [id];
  sandbox.App.player.school = G.SKILLS[id].school || 'kiem_si';
  // TUYỆT PHẨM sở hữu ở trụ riêng (p.superUlts), không phải p.skills — dùng đúng API như game.
  // Viết thẳng p.skills[id] sẽ không còn tác dụng: skillLevel cố tình không đọc đường đó.
  if (G.isSuperUlt(id)) {
    sandbox.App.player.superUlts = Object.assign({}, sandbox.App.player.superUlts, { [id]: true });
  } else {
    sandbox.App.player.skills = Object.assign({}, sandbox.App.player.skills, { [id]: lv });
  }
  sandbox.App.mp = 500; sandbox.App.hp = 1000;
  sandbox.App.sta = 1000; sandbox.App.staLocked = false;
  s.cooldowns = {};
  s.useSkill(0, s.time.now);
  s.advance(50);   // chạy các hẹn giờ 0ms (nhát chém, đạn…)
}

// ---------------------------------------------------------------- 1. Hai buff khác kỹ năng cùng chạy
console.log('1. Hai kỹ năng tăng cường khác nhau cùng chạy');
{
  const s = newScene();
  // pa3 Cuồng Nộ (Kiếm Sĩ, buff 'rage', 6 giây) và tk3 Thịnh Nộ (Tanker, buff 'rage', 8 giây):
  // trước đây dùng chung khoá 'rage' nên cái sau xoá cái trước.
  cast(s, 'pa3');
  const t0 = s.time.now;
  ok(s.buffList().length === 1, 'sau khi dùng pa3 có 1 hiệu ứng', String(s.buffList().length));
  cast(s, 'tk3');
  const live = s.buffList();
  ok(live.length === 2, 'dùng thêm tk3 → 2 hiệu ứng CÙNG CHẠY', `${live.length} (${live.map(b => b.skill).join(', ')})`);
  ok(live.some(b => b.skill === 'pa3') && live.some(b => b.skill === 'tk3'), 'cả pa3 và tk3 đều còn hiệu lực');
  const tot = s.buffTotals();
  const want = (G.skillAt('pa3', 10).atkBuff || 0) + (G.skillAt('tk3', 10).atkBuff || 0);
  ok(Math.abs(tot.atk - want) < 1e-9, 'tấn công cộng dồn từ cả hai', `+${Math.round(tot.atk * 100)}% (mong đợi +${Math.round(want * 100)}%)`);
  // pa3 hết hạn trước (6 giây) thì tk3 vẫn còn. Tính theo dữ liệu, không đoán số.
  const dA = G.skillAt('pa3', 10).duration, dB = G.skillAt('tk3', 10).duration;
  const shorter = dA < dB ? 'pa3' : 'tk3', longer = dA < dB ? 'tk3' : 'pa3';
  s.advance(Math.min(dA, dB) * 1000 + 400);
  const after = s.buffList();
  ok(after.length === 1 && after[0].skill === longer,
    `${shorter} (${Math.min(dA, dB)}s) hết hạn trước, ${longer} (${Math.max(dA, dB)}s) vẫn còn`,
    after.map(b => b.skill).join(', ') || 'không còn');
  ok(t0 >= 0, '(mốc thời gian hợp lệ)');
}

// ---------------------------------------------------------------- 2. Thủ thế và khiên
console.log('\n2. Thủ thế / khiên: mỗi kỹ năng một ô, chỉ số CỘNG DỒN, không chặn trần');
{
  const s = newScene();
  cast(s, 'tk4');   // Giáp Sắt: giảm 60%, phản 25%
  cast(s, 'tk7');   // thủ thế tanker: giảm 60%
  cast(s, 'tk10');  // Phản Giáp: giảm 55%, phản 60%
  const guards = s.buffList().filter(b => b.name === 'guard');
  ok(guards.length === 3, 'ba thủ thế của Tanker cùng chạy', guards.map(b => b.skill).join(', '));
  const want = ['tk4', 'tk7', 'tk10'].reduce((a, id) => a + (G.skillAt(id, 10).reduce || 0), 0);
  const got = s.buffReduce();
  ok(Math.abs(got - want) < 1e-9, 'giảm sát thương CỘNG DỒN, không lấy mức cao nhất',
    `${Math.round(got * 100)}% (mong đợi ${Math.round(want * 100)}%)`);
  ok(got > 1, 'cộng lại vượt 100% — đúng như thiết kế cho phép', `${Math.round(got * 100)}%`);
  const reflWant = ['tk4', 'tk7', 'tk10'].reduce((a, id) => a + (G.skillAt(id, 10).reflect || 0), 0);
  ok(Math.abs(s.buffReflect() - reflWant) < 1e-9, 'phản sát thương CỘNG DỒN, không chặn trần',
    `${Math.round(s.buffReflect() * 100)}% (mong đợi ${Math.round(reflWant * 100)}%)`);
  // Khiên năng lượng cũng phải cùng chạy và cộng dồn
  cast(s, 'tn4');
  cast(s, 'th7');
  const shields = s.buffList().filter(b => b.name === 'manashield');
  ok(shields.length === 2, 'hai khiên cùng chạy', shields.map(b => b.skill).join(', '));
  const absWant = (G.skillAt('tn4', 10).absorb || 0) + (G.skillAt('th7', 10).absorb || 0);
  ok(Math.abs(s.buffAbsorb() - absWant) < 1e-9, 'hấp thụ CỘNG DỒN', `${Math.round(s.buffAbsorb() * 100)}% (mong đợi ${Math.round(absWant * 100)}%)`);
}

// ---------------------------------------------------------------- 2b. Đòn đánh thật với thủ thế cộng dồn
console.log('\n2b. Sát thương thật khi nhiều thủ thế cùng bật');
{
  // Đặt máu SAU khi dùng kỹ năng: cast() đặt lại máu, và nội tại Tanker "Thành Đồng"
  // giảm thêm 10% khi máu dưới 50% — để máu đầy cho công thức thuần.
  const full = () => { sandbox.App.stats.maxHp = 100000; sandbox.App.hp = 100000; };
  const s = newScene();
  sandbox.App.stats.def = 0;
  const hit = (sc) => { full(); sc.invulnUntil = 0; const before = sandbox.App.hp; sc.hurtPlayer(1000, 1, 260, null); return before - sandbox.App.hp; };

  const plain = hit(s);
  cast(s, 'tk4'); cast(s, 'tk7'); cast(s, 'tk10');
  const reduced = hit(s);
  ok(reduced < plain, 'ba thủ thế cùng bật thì đòn nhẹ hơn hẳn', `${plain} → ${reduced}`);
  ok(reduced >= 1, 'vẫn nhận tối thiểu 1 sát thương, không âm máu', String(reduced));

  // Một thủ thế: đúng công thức, không dính nội tại
  const s2 = newScene();
  cast(s2, 'tk4');
  const one = hit(s2);
  const exp = Math.max(1, Math.round(plain * (1 - G.skillAt('tk4', 10).reduce)));
  ok(Math.abs(one - exp) <= 2, 'một thủ thế: giảm đúng theo chỉ số', `${one} (mong đợi ~${exp})`);
}

// ---------------------------------------------------------------- 3. Hồi máu cộng dồn
console.log('\n3. Hồi máu liên tục cộng dồn từ nhiều hiệu ứng');
{
  const s = newScene();
  cast(s, 'tl3');   // Thanh Tẩy: regen
  cast(s, 'tl10');  // regen cao hơn
  const regens = s.buffList().filter(b => b.regen);
  ok(regens.length >= 2, 'có ít nhất 2 hiệu ứng hồi máu cùng bật', regens.map(b => `${b.skill}:${b.regen}`).join(', '));
  const sum = regens.reduce((a, b) => a + b.regen, 0);
  sandbox.App.hp = 500;
  s.dead = false;
  s.regen();
  const healed = sandbox.App.hp - 500;
  ok(healed > 0, 'máu thực sự hồi', `+${Math.round(healed)}`);
  ok(Math.abs(healed - sandbox.App.stats.maxHp * sum / 2) < 1, 'lượng hồi = tổng regen của mọi hiệu ứng', `+${Math.round(healed)} so với mong đợi +${Math.round(sandbox.App.stats.maxHp * sum / 2)}`);
}

// ---------------------------------------------------------------- 4. Bấm lại chính kỹ năng đó không tạo ô thứ hai
console.log('\n4. Bấm lại cùng một kỹ năng: làm mới, không nhân đôi');
{
  const s = newScene();
  cast(s, 'pa3');
  const first = s.buffList()[0].until;
  s.advance(2000);
  cast(s, 'pa3');
  const live = s.buffList();
  ok(live.length === 1, 'vẫn chỉ 1 ô', String(live.length));
  ok(live[0].until > first, 'thời gian được làm mới', `+${Math.round(live[0].until - first)}ms`);
}

// ---------------------------------------------------------------- 5. Mọi tên hiệu ứng đều có nhãn hiển thị
console.log('\n5. Mọi kỹ năng có hiệu ứng đều dùng được (không kỹ năng nào bị bỏ qua)');
{
  const buffSkills = Object.entries(G.SKILLS).filter(([, sk]) => ['buff', 'guard', 'manashield'].includes(sk.type));
  let broke = [];
  for (const [id, sk] of buffSkills) {
    const s = newScene();
    try {
      cast(s, id);
      if (!s.buffList().length) broke.push(`${id} (không tạo hiệu ứng)`);
    } catch (e) { broke.push(`${id} (${e.message})`); }
  }
  ok(broke.length === 0, `${buffSkills.length} kỹ năng có hiệu ứng đều tạo được hiệu ứng`, broke.join(', ') || 'tất cả OK');
}

console.log(fails ? `\n✗ ${fails} kiểm tra không đạt.` : '\n✓ Tất cả kiểm tra đạt.');
process.exitCode = fails ? 1 : 0;
