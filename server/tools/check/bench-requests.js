'use strict';
/*
 * Đếm request trình duyệt phải gửi khi vào một bản đồ (lần đầu).
 *   node server/tools/check/bench-requests.js
 *
 * Nguồn: Sprites.needed() lấy hình class đang chơi + quái trên bản đồ;
 * WorldScene.preload() lấy 4 lớp nền + cảnh trí.
 * Chỉ ĐO, không sửa gì.
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..', '..');
const G = require(path.join(ROOT, 'shared'));
const PUBLIC = path.join(ROOT, 'public');
const BG = path.join(PUBLIC, 'assets', 'bg');

const MOB_ANIMS = ['idle', 'run', 'attack', 'hit', 'death'];
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

// Bộ hình quái theo 'look' (thư mục trong assets/mobs)
function mobFiles(look) {
  const d = path.join(PUBLIC, 'assets', 'mobs', look);
  if (!fs.existsSync(d)) return { n: 0, bytes: 0 };
  let n = 0, bytes = 0;
  for (const a of MOB_ANIMS) {
    const f = path.join(d, a + '.png');
    if (fs.existsSync(f)) { n++; bytes += fs.statSync(f).size; }
  }
  return { n, bytes };
}
function packFiles(pack) {
  const d = path.join(BG, pack);
  if (!fs.existsSync(d)) return { n: 0, bytes: 0 };
  let n = 0, bytes = 0;
  for (const f of fs.readdirSync(d)) { const s = fs.statSync(path.join(d, f)); n++; bytes += s.size; }
  return { n, bytes };
}

// Bản đồ → bộ nền: đọc chuỗi '<pack>/<layer>' trong map_scenes.js
const scenes = fs.readFileSync(path.join(PUBLIC, 'js', 'scene', 'map_scenes.js'), 'utf8');
const mapPack = {};
for (const m of scenes.matchAll(/^\s{4}(\w+):\s*\{([^}]*)\}/gm)) {
  const body = m[2];
  const packs = new Set();
  for (const p of body.matchAll(/'([a-z][a-z0-9_]*)\/(?:sky|far|mid|near)'/g)) packs.add(p[1]);
  for (const p of body.matchAll(/pack:\s*'([a-z][a-z0-9_]*)'/g)) packs.add(p[1]);
  if (packs.size) mapPack[m[1]] = [...packs];
}

function spawnLooks(map) {
  const looks = new Set();
  if (!map || !map.spawns) return looks;
  const list = Array.isArray(map.spawns) ? map.spawns : Object.values(map.spawns);
  for (const sp of list) {
    const id = typeof sp === 'string' ? sp : sp && sp.id;
    const def = id && G.MONSTERS[id];
    if (def && def.look) looks.add(def.look);
  }
  return looks;
}

console.log('=== Request khi vào một bản đồ (lần đầu, chưa có gì trong cache) ===\n');

const rows = [];
for (const mapId of Object.keys(G.MAPS)) {
  const looks = spawnLooks(G.MAPS[mapId]);
  let mobN = 0, mobB = 0;
  for (const l of looks) { const r = mobFiles(l); mobN += r.n; mobB += r.bytes; }
  const packs = mapPack[mapId] || [];
  let bgN = 0, bgB = 0;
  for (const p of packs) { const r = packFiles(p); bgN += r.n; bgB += r.bytes; }
  // Hình nhân vật của mình: 5 anim
  const charN = 5, charB = 0;
  rows.push({ mapId, n: mobN + bgN + charN, bytes: mobB + bgB, mobKinds: looks.size, packs: packs.join('+') || '-' });
}

rows.sort((a, b) => b.bytes - a.bytes);
console.log('Bản đồ nặng nhất:');
for (const r of rows.slice(0, 10)) {
  console.log(`  ${r.mapId.padEnd(14)} ${String(r.n).padStart(3)} request  ${kb(r.bytes).padStart(9)}  (nền ${r.packs}, ${r.mobKinds} loại quái)`);
}

const avgN = rows.reduce((a, r) => a + r.n, 0) / rows.length;
const avgB = rows.reduce((a, r) => a + r.bytes, 0) / rows.length;
console.log(`\nTrung bình: ${avgN.toFixed(0)} request, ${kb(avgB)} mỗi bản đồ`);

console.log('\n=== Thời gian tải ảnh theo độ trễ mạng ===');
console.log('HTTP/1.1 (cấu hình nginx hiện tại): tối đa 6 kết nối song song mỗi tên miền');
const N = Math.round(avgN);
for (const rtt of [5, 30, 60, 100]) {
  const batches = Math.ceil(N / 6);
  console.log(`  RTT ${String(rtt).padStart(3)} ms: ${batches} đợt × ${rtt} ms = ${(batches * rtt / 1000).toFixed(1)} giây`);
}
console.log('\nHTTP/2 (một kết nối, request song song — cần bật trong nginx):');
for (const rtt of [5, 30, 60, 100]) {
  const ms = rtt * 2 + (avgB / (2 * 1024 * 1024)) * 1000;
  console.log(`  RTT ${String(rtt).padStart(3)} ms: ~${(ms / 1000).toFixed(1)} giây (chủ yếu chờ băng thông)`);
}
