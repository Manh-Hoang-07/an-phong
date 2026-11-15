'use strict';
/*
 * Đo lưu lượng WebSocket khi 2 người chơi cùng đánh quái ở một bản đồ.
 *   node server/tools/check/bench-net-2p.js
 *
 * Mô phỏng đúng nhịp thật:
 *   - client gửi vị trí 10 lần/giây (remote.js: delay 100ms)
 *   - client gửi đòn đánh khi tấn công
 *   - server phát 'snap' vị trí mỗi 100ms (chỉ người đổi)
 *   - server phát 'msnap' quái mỗi 100ms (chỉ con đổi)
 *   - server phát 'mhit' mỗi đòn
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const G = require(path.join(__dirname, '..', '..', '..', 'shared'));
const { World, STEP_MS } = require(path.join(__dirname, '..', '..', 'realtime', 'mobs'));

const kb = (n) => (n / 1024).toFixed(1) + ' KB';

function run(mapId, players, seconds = 10) {
  let bytesOut = 0;   // server → client
  let bytesIn = 0;    // client → server
  let packetsOut = 0, packetsIn = 0;

  const w = new World(mapId, {
    emit(obj) { bytesOut += JSON.stringify(obj).length; packetsOut++; },
    kill() { return []; },
  }, null);

  const now0 = Date.now();
  const pl = players.map((p, i) => ({ id: i + 1, x: p.x, y: p.y, dead: false }));
  const frames = seconds * 20;   // 20 bước/giây (STEP_MS 50)

  for (let f = 0; f < frames; f++) {
    const now = now0 + f * STEP_MS;
    // Người chơi di chuyển + đánh
    for (let i = 0; i < pl.length; i++) {
      pl[i].x += 60 * (STEP_MS / 1000);   // chạy sang phải
      // gói vị trí: 10 lần/giây
      if (f % 2 === 0) {
        const msg = { t: 'pos', map: mapId, x: Math.round(pl[i].x), y: Math.round(pl[i].y), f: 1, a: 'run' };
        bytesIn += JSON.stringify(msg).length; packetsIn++;
      }
      // đòn đánh: 2 lần/giây
      if (f % 10 === 0) {
        const mob = w.mobs[(i * 3) % w.mobs.length];
        if (mob && mob.alive) {
          w.applyHit(mob, pl[i].id, { dmg: 120, crit: false, src: 'player', dir: 1, slow: 0, freeze: 0, knock: 0 }, now);
          const hit = { t: 'hit', u: mob.uid, d: 120, c: 0 };
          bytesIn += JSON.stringify(hit).length; packetsIn++;
        }
      }
    }
    w.step(now, pl);
    // msnap: mỗi 2 bước (100ms)
    if (w.stepCount % 2 === 0) {
      const snap = w.snapshot(now);
      if (snap.length) {
        const msg = { t: 'msnap', p: snap };
        const len = JSON.stringify(msg).length;
        // server gửi cho TỪNG người trong phòng
        bytesOut += len * pl.length; packetsOut += pl.length;
      }
    }
    // snap vị trí: mỗi 100ms, gửi cho người kia
    if (f % 2 === 0 && pl.length > 1) {
      const list = pl.map((p) => [p.id, Math.round(p.x), Math.round(p.y), 1, 'run']);
      const msg = { t: 'snap', p: list };
      const len = JSON.stringify(msg).length;
      bytesOut += len * pl.length; packetsOut += pl.length;
    }
  }

  const sec = seconds;
  return {
    mapId, players: pl.length,
    mobs: w.mobs.length,
    outPerSec: bytesOut / sec,
    inPerSec: bytesIn / sec,
    packetsOutPerSec: packetsOut / sec,
    packetsInPerSec: packetsIn / sec,
    totalOut: bytesOut,
  };
}

const spawn = (mapId) => {
  const w = new World(mapId, { emit() {}, kill: () => [] });
  const m = w.mobs[0];
  return { x: m ? m.x - 200 : 400, y: m ? m.y : 400 };
};

console.log('=== Lưu lượng WebSocket khi 2 người cùng đánh quái (10 giây) ===\n');

const maps = ['rung', 'cong_do', 'lang', 'hang'];
const rows = [];
for (const mapId of maps) {
  const s = spawn(mapId);
  const one = run(mapId, [s]);
  const two = run(mapId, [s, { x: s.x + 120, y: s.y }]);
  rows.push({ mapId, one, two });
}

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);
console.log(`${pad('map', 12)} ${num('quái', 5)} ${num('1 người ra', 12)} ${num('2 người ra', 12)} ${num('tăng', 6)} ${num('gói/giây', 9)}`);
console.log('-'.repeat(62));
for (const r of rows) {
  console.log(`${pad(r.mapId, 12)} ${num(r.two.mobs, 5)} ${num(kb(r.one.outPerSec) + '/s', 12)} ${num(kb(r.two.outPerSec) + '/s', 12)} ${num((r.two.outPerSec / r.one.outPerSec).toFixed(1) + '×', 6)} ${num(r.two.packetsOutPerSec.toFixed(0), 9)}`);
}

console.log('\n=== Chi tiết Rừng Sương ===');
const rung = rows.find((r) => r.mapId === 'rung');
console.log(`  quái trên bản đồ: ${rung.two.mobs}`);
console.log(`  1 người: ra ${kb(rung.one.outPerSec)}/s, vào ${kb(rung.one.inPerSec)}/s`);
console.log(`  2 người: ra ${kb(rung.two.outPerSec)}/s, vào ${kb(rung.two.inPerSec)}/s`);
console.log(`  gói server phát: ${rung.two.packetsOutPerSec.toFixed(0)} gói/giây (2 người)`);
console.log(`\n  Mỗi gói WebSocket thêm ~40-60 byte header TCP/IP + khung WS.`);
console.log(`  ${rung.two.packetsOutPerSec.toFixed(0)} gói/giây × ~50 byte = ${kb(rung.two.packetsOutPerSec * 50)}/s chỉ riêng phần đóng gói.`);

console.log('\n=== So sánh mức tăng khi thêm người thứ 2 ===');
for (const r of rows) {
  console.log(`  ${pad(r.mapId, 12)} ${(r.two.outPerSec / r.one.outPerSec).toFixed(2)}× lưu lượng, ${(r.two.packetsOutPerSec / r.one.packetsOutPerSec).toFixed(2)}× số gói`);
}
