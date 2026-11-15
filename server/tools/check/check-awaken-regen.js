'use strict';
/*
 * Kiểm tra: Ấn (biến hình) KHÔNG chặn hồi năng lượng (MP) và thể lực.
 *   node server/tools/check/check-awaken-regen.js
 *
 * Chạy thẳng ba hàm thật trong public/js/scene/player.js: regen(), staminaTick(), formTick().
 * Nạp file đó vào một lớp giả (chỉ cần WorldScene.mix + vài hàm phụ), rồi mô phỏng từng giây.
 *
 * Luật mong muốn (theo yêu cầu): thực nhận = hồi − hao.
 *   Ví dụ hồi 5 thể lực/giây mà ấn hao 1 → còn 4 thể lực/giây.
 *
 * Lưu ý: giây ĐẦU của biến hình là giai đoạn khởi động của bộ đếm trừ (formDrainAcc bắt đầu từ 0),
 * nên lần trừ đầu rơi vào cuối giây thứ nhất. Test đo ở trạng thái ổn định (bỏ giây đầu).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..', '..');
const SRC = path.join(ROOT, 'public', 'js', 'scene', 'player.js');

let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (cond) { console.log(`  ✓ ${label}`); return true; }
  fails++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); return false;
}
const near = (a, b, eps = 0.05) => Math.abs(a - b) <= eps;

// ---- Dựng môi trường giả để chạy đúng mã thật của player.js
function buildScene({ awakenTier = 1, mp, sta, maxMp = 1000, maxSta = 1000, passive = null } = {}) {
  const G = require(path.join(ROOT, 'shared'));
  const parts = [];
  const sandbox = {
    console,
    App: {
      player: { formChoice: 'awaken' + awakenTier, awakenTier, school: passive },
      form: true,
      hp: 100, mp, sta, stats: { maxHp: 1000, maxMp, maxSta },
      staLocked: false,
      recalcStats() {},
    },
    GameData: G,
    UI: { log() {}, refresh() {} },
    Sound: { play() {} },
    Phaser: {},
    WorldScene: { mix(part) { parts.push(part); } },
    window: {},
    document: {},
  };
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(SRC, 'utf8'), sandbox, { filename: 'player.js' });

  const scene = Object.assign({}, ...parts.map((P) => {
    const o = {};
    for (const k of Object.getOwnPropertyNames(P.prototype)) o[k] = P.prototype[k];
    return o;
  }));
  scene.time = { now: 100000 };
  scene.dead = false;
  scene.lastHurt = -1e9;
  scene.staUsedAt = -1e9;
  scene.player = null;
  scene.endForm = function (reason) { this.ended = reason || '(không lý do)'; sandbox.App.form = false; };
  scene.buffOn = () => null;
  scene.hasPassive = (id) => passive === id;
  scene.formStop = () => {};
  scene.applyFormLook = () => {};
  return { scene, App: sandbox.App, G };
}

// Chạy n giây, mỗi giây: staminaTick (60 khung) + formTick + regen (1 lần/giây)
function run(scene, App, seconds, { fighting = false } = {}) {
  const snapshots = [];
  for (let s = 0; s < seconds; s++) {
    const before = { mp: App.mp, sta: App.sta };
    for (let f = 0; f < 60; f++) {
      scene.time.now += 1000 / 60;
      if (fighting) scene.staUsedAt = scene.time.now;   // đang đánh: coi như vừa dùng thể lực
      scene.staminaTick(scene.time.now, 1000 / 60);
      scene.formTick(scene.time.now, 1000 / 60);
    }
    scene.time.now += 1000;
    scene.regen();
    snapshots.push({ mp: App.mp, sta: App.sta, dMp: App.mp - before.mp, dSta: App.sta - before.sta });
  }
  return snapshots;
}

// Trạng thái ổn định: bỏ giây đầu (khởi động bộ đếm trừ)
const steady = (snap) => snap[snap.length - 1];

console.log('1. Đúng ví dụ của người dùng: hồi 5 thể lực/giây, Ấn I hao 1 → còn 4');
{
  const { scene, App, G } = buildScene({ awakenTier: 1, mp: 500, sta: 500 });
  G.STAMINA.regen = 5;
  G.REGEN.mp = 5;
  G.REGEN.hp = 0;
  const snap = run(scene, App, 4);
  const s = steady(snap);
  console.log(`  mỗi giây: thể lực ${snap.map((x) => x.dSta.toFixed(2)).join(', ')} | năng lượng ${snap.map((x) => x.dMp.toFixed(2)).join(', ')}`);
  ok(near(s.dSta, 4), 'thể lực thực nhận = +4/giây (hồi 5 − hao 1)', s.dSta.toFixed(3));
  ok(near(s.dMp, 4), 'năng lượng thực nhận = +4/giây (hồi 5 − hao 1)', s.dMp.toFixed(3));
  ok(!scene.ended, 'biến hình vẫn duy trì', scene.ended);
}

console.log('\n2. Ấn I mặc định game: hồi nhiều hơn hao → cả hai vẫn tăng');
{
  const { scene, App, G } = buildScene({ awakenTier: 1, mp: 500, sta: 500 });
  G.STAMINA.regen = 12;   // mặc định trong game
  const snap = run(scene, App, 4);
  const s = steady(snap);
  console.log(`  mỗi giây: thể lực ${snap.map((x) => x.dSta.toFixed(2)).join(', ')} | năng lượng ${snap.map((x) => x.dMp.toFixed(2)).join(', ')}`);
  ok(s.dSta > 0, 'thể lực tăng (hồi 12 − hao 1 = +11)', s.dSta.toFixed(3));
  ok(s.dMp > 0, 'năng lượng tăng (hồi 5 − hao 1 = +4)', s.dMp.toFixed(3));
  ok(!scene.ended, 'biến hình không bị ngắt', scene.ended);
}

console.log('\n3. Ấn V hao nhiều hơn hồi → vẫn tụt, nhưng chậm hơn trước khi sửa');
{
  const { scene, App, G } = buildScene({ awakenTier: 5, mp: 500, sta: 500, maxMp: 500 });
  G.STAMINA.regen = 2;    // hồi 2 < hao 5
  G.REGEN.mp = 1;         // max(1, 0.005×500=2.5) = 2.5 < hao 5
  const snap = run(scene, App, 4);
  const s = steady(snap);
  console.log(`  mỗi giây: thể lực ${snap.map((x) => x.dSta.toFixed(2)).join(', ')} | năng lượng ${snap.map((x) => x.dMp.toFixed(2)).join(', ')}`);
  ok(near(s.dSta, -3), 'thể lực −3/giây (hao 5 − hồi 2), trước đây là −5', s.dSta.toFixed(3));
  ok(near(s.dMp, -2.5), 'năng lượng −2,5/giây (hao 5 − hồi 2,5), trước đây là −5', s.dMp.toFixed(3));
}

console.log('\n4. Đang giao chiến: vẫn hồi, chỉ chậm hơn (activeMul 0.3)');
{
  const { scene, App, G } = buildScene({ awakenTier: 1, mp: 500, sta: 500 });
  G.STAMINA.regen = 5;
  G.REGEN.mp = 5;
  const snap = run(scene, App, 4, { fighting: true });
  const s = steady(snap);
  console.log(`  mỗi giây: thể lực ${snap.map((x) => x.dSta.toFixed(2)).join(', ')} | năng lượng ${snap.map((x) => x.dMp.toFixed(2)).join(', ')}`);
  // Đang đánh: thể lực hồi 5 × 0.3 = 1.5, trừ 1 → +0.5
  ok(near(s.dSta, 0.5), 'thể lực +0,5/giây khi đang đánh (hồi 1,5 − hao 1)', s.dSta.toFixed(3));
  // Đang đánh: MP không được hồi ngoài giao chiến → 0 − 1 = −1
  ok(near(s.dMp, -1), 'năng lượng −1/giây khi đang đánh (không hồi MP lúc giao chiến)', s.dMp.toFixed(3));
}

console.log('\n5. Cạn thật + hồi không đủ bù → biến hình kết thúc');
{
  const { scene, App, G } = buildScene({ awakenTier: 5, mp: 0, sta: 0, maxMp: 500 });
  G.STAMINA.regen = 2;    // 2 < 5
  G.REGEN.mp = 1;         // 2.5 < 5
  run(scene, App, 3);
  ok(!!scene.ended, 'kết thúc khi cạn và hồi không đủ bù', scene.ended);
}

console.log('\n6. Cạn nhưng hồi đủ bù → KHÔNG kết thúc (điểm quan trọng)');
{
  const { scene, App, G } = buildScene({ awakenTier: 1, mp: 0, sta: 0 });
  G.STAMINA.regen = 5;    // 5 > hao 1
  G.REGEN.mp = 5;
  run(scene, App, 2);
  ok(!scene.ended, 'không kết thúc: hồi phục nuôi được biến hình', scene.ended);
  ok(App.mp > 0 && App.sta > 0, 'năng lượng và thể lực đã hồi lên trên 0', `mp=${App.mp.toFixed(2)} sta=${App.sta.toFixed(2)}`);
}

console.log('\n7. Dạng thường (không biến hình): máu vẫn hồi như cũ');
{
  const { scene, App, G } = buildScene({ awakenTier: 1, mp: 500, sta: 500 });
  App.form = false;
  G.REGEN.hp = 1;
  const hp0 = App.hp;
  scene.regen();
  ok(App.hp > hp0, 'máu hồi khi không biến hình', `${hp0} → ${App.hp}`);
}

console.log('\n8. Đang biến hình: máu VẪN hồi y như bình thường');
{
  const { scene, App, G } = buildScene({ awakenTier: 1, mp: 500, sta: 500 });
  App.form = true;
  G.REGEN.hp = 5;
  const hp0 = App.hp;
  scene.regen();
  ok(App.hp > hp0, 'máu hồi khi biến hình', `${hp0} → ${App.hp}`);
  // Phải đúng bằng mức hồi của dạng thường: max(R.hp, 0.5% maxHp) = max(5, 5) = 5
  ok(near(App.hp - hp0, 5), 'mức hồi máu bằng đúng dạng thường (+5)', (App.hp - hp0).toFixed(3));
}

console.log('\n8b. Mức hồi máu khi biến hình = mức hồi dạng thường (so sánh trực tiếp)');
{
  const a = buildScene({ awakenTier: 1, mp: 500, sta: 500 });
  a.App.form = false; a.G.REGEN.hp = 1;
  const hpA0 = a.App.hp; a.scene.regen();
  const normal = a.App.hp - hpA0;

  const b = buildScene({ awakenTier: 3, mp: 500, sta: 500 });
  b.App.form = true; b.G.REGEN.hp = 1;
  const hpB0 = b.App.hp; b.scene.regen();
  const form = b.App.hp - hpB0;

  console.log(`  dạng thường +${normal.toFixed(2)} | đang biến hình +${form.toFixed(2)}`);
  ok(near(normal, form), 'hai mức hồi máu giống hệt nhau', `${normal} vs ${form}`);
}

console.log('\n9. Pháp Sư (nội tại Dòng Chảy): cộng thêm 0,5% MP mỗi giây, vẫn trừ hao');
{
  const { scene, App, G } = buildScene({ awakenTier: 1, mp: 500, sta: 500, passive: 'phap_su' });
  G.STAMINA.regen = 12;
  const snap = run(scene, App, 4);
  const s = steady(snap);
  console.log(`  năng lượng mỗi giây: ${snap.map((x) => x.dMp.toFixed(2)).join(', ')}`);
  // Dòng Chảy 5 + hồi ngoài giao chiến 5 = 10, trừ hao 1 → +9
  ok(near(s.dMp, 9), 'năng lượng +9/giây (5 Dòng Chảy + 5 hồi − 1 hao)', s.dMp.toFixed(3));
}

console.log(`\n${fails ? '✗' : '✓'} ${checks - fails}/${checks} kiểm tra đạt.`);
process.exit(fails ? 1 : 0);
