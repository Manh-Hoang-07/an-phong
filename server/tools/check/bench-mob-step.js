'use strict';
/*
 * Đo chi phí CPU của vòng lặp quái (chạy 20 lần/giây trên server thật).
 *   node server/tools/check/bench-mob-step.js
 *
 * Chỉ ĐO, không sửa gì. Mục đích: biết trên VPS yếu thì vòng lặp này ăn bao nhiêu % CPU.
 */
const path = require('path');
const G = require(path.join(__dirname, '..', '..', '..', 'shared'));
const { World, STEP_MS } = require(path.join(__dirname, '..', '..', 'realtime', 'mobs'));

// Bản đồ nhiều quái nhất
let best = null, bestN = 0;
for (const id of Object.keys(G.MAPS)) {
  const w = new World(id, { emit() {}, kill: () => [] });
  const n = w.mobs.length;
  if (n > bestN) { bestN = n; best = id; }
}
console.log(`Bản đồ nhiều quái nhất: ${best} (${bestN} con)\n`);

function bench(mapId, players, label) {
  const w = new World(mapId, { emit() {}, kill: () => [] });
  const now = Date.now();
  const pl = players.map((p, i) => ({ id: i + 1, x: p.x, y: p.y, dead: false }));
  // Làm nóng
  for (let i = 0; i < 200; i++) w.step(now + i * STEP_MS, pl);
  const N = 2000;
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < N; i++) w.step(now + i * STEP_MS, pl);
  const t1 = process.hrtime.bigint();
  const msPerStep = Number(t1 - t0) / 1e6 / N;
  const stepsPerSec = 1000 / STEP_MS;
  const cpuPct = msPerStep * stepsPerSec / 10;   // % của 1 lõi
  console.log(`${label}`);
  console.log(`  ${w.mobs.length} quái, ${pl.length} người chơi`);
  console.log(`  ${msPerStep.toFixed(4)} ms/bước × ${stepsPerSec} bước/giây = ${cpuPct.toFixed(2)}% một lõi CPU`);
  return cpuPct;
}

const results = [];
results.push(bench(best, [], '1. Không có người chơi (quái đứng yên)'));
const mid = { x: 600, y: 400 };
results.push(bench(best, [mid], '2. Một người chơi đứng trong bản đồ'));
results.push(bench(best, [mid, { x: 700, y: 400 }, { x: 800, y: 400 }], '3. Ba người chơi gần nhau'));

// Nhiều bản đồ cùng có người: đo tổng
console.log('\n4. Nhiều bản đồ cùng có người (mỗi bản đồ 1 người chơi)');
const mapIds = Object.keys(G.MAPS).slice(0, 12);
const worlds = mapIds.map((id) => new World(id, { emit() {}, kill: () => [] }));
const now = Date.now();
const N = 1000;
for (let i = 0; i < 100; i++) for (const w of worlds) w.step(now + i * STEP_MS, [{ id: 1, x: 600, y: 400, dead: false }]);
const t0 = process.hrtime.bigint();
for (let i = 0; i < N; i++) for (const w of worlds) w.step(now + i * STEP_MS, [{ id: 1, x: 600, y: 400, dead: false }]);
const t1 = process.hrtime.bigint();
const msPerStep = Number(t1 - t0) / 1e6 / N;
const totalMobs = worlds.reduce((a, w) => a + w.mobs.length, 0);
const cpuPct = msPerStep * (1000 / STEP_MS) / 10;
console.log(`  ${worlds.length} bản đồ, tổng ${totalMobs} quái`);
console.log(`  ${msPerStep.toFixed(4)} ms/bước × 20 = ${cpuPct.toFixed(2)}% một lõi CPU`);

console.log('\n--- Tổng kết ---');
console.log(`Một bản đồ đông quái, 1 người chơi: ${results[1].toFixed(2)}% một lõi`);
console.log(`12 bản đồ cùng có người: ${cpuPct.toFixed(2)}% một lõi`);
console.log('\nGhi chú: VPS 1 lõi thì các số này là % của toàn bộ CPU còn lại cho phần khác.');
