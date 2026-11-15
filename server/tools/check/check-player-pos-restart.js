'use strict';
/*
 * Kiểm tra vị trí sống qua lần KHỞI ĐỘNG LẠI SERVER (không chỉ đăng xuất).
 * Chạy: node --env-file-if-exists=.env server/tools/check/check-player-pos-restart.js
 *
 * Cách làm: tạo nhân vật, đặt vị trí, ghi mốc vào file tạm; tắt server; bật lại; đọc lại vị trí.
 * Script tự tắt/bật server nên phải chạy độc lập với server đang chạy.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Pool } = require('pg');

const ROOT = path.join(__dirname, '..', '..', '..');
const MARK = path.join(ROOT, '.pos-restart-mark.json');
const BASE = 'http://127.0.0.1:3100';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'anphong',
});

async function req(p, body, cookie) {
  const res = await fetch(BASE + p, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, json: await res.json().catch(() => null), set };
}
const cookieOf = (r) => r.set.map((c) => c.split(';')[0]).join('; ');

let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (cond) { console.log(`  ✓ ${label}`); return true; }
  fails++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); return false;
}

async function waitUp(ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(BASE + '/api/me'); if (r.status) return true; } catch { /* chưa lên */ }
    await sleep(300);
  }
  return false;
}

function startServer() {
  const child = spawn(process.execPath, ['--env-file-if-exists=.env', 'server/index.js'], {
    cwd: ROOT, detached: true, stdio: 'ignore',
  });
  child.unref();
  return child;
}

async function killServer() {
  try {
    const res = await fetch(BASE + '/__shutdown', { method: 'POST' }).catch(() => null);
    if (res) await sleep(1200);
  } catch { /* bỏ qua */ }
  // Bảo đảm cổng trống
  const { execSync } = require('child_process');
  try {
    execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"`, { stdio: 'ignore' });
  } catch { /* bỏ qua */ }
  await sleep(1200);
}

(async () => {
  // ================= PHASE 1: tạo dữ liệu =================
  if (process.argv.includes('--phase2')) {
    // ---- PHASE 2: server vừa được bật lại
    const mark = JSON.parse(fs.readFileSync(MARK, 'utf8'));
    console.log('PHASE 2 — sau khi bật lại server\n');
    const cookie = cookieOf(await req('/api/login', { username: mark.name, password: mark.pass }));
    const me = await req('/api/me', null, cookie);
    const p = me.json.player;
    console.log(`  đọc lại: map=${p.map} x=${p.x} y=${p.y} arrive=${JSON.stringify(p.arrive)}`);
    ok(p.map === mark.map, 'đúng bản đồ', p.map);
    ok(p.x === mark.x && p.y === mark.y, `vị trí sống qua lần khởi động lại (${mark.x}, ${mark.y})`, `x=${p.x} y=${p.y}`);
    ok(!p.arrive, 'không có cờ arrive', JSON.stringify(p.arrive));
    ok(p.x != null && p.y != null && !p.arrive, 'client sẽ đặt nhân vật đúng vị trí cũ');
    await pool.query('DELETE FROM users WHERE username = $1', [mark.name]);
    await pool.end();
    try { fs.unlinkSync(MARK); } catch { /* bỏ qua */ }
    console.log(`\n${fails ? '✗' : '✓'} ${checks - fails}/${checks} kiểm tra đạt.`);
    process.exit(fails ? 1 : 0);
  }

  // ---- PHASE 1
  if (!(await waitUp(5000))) { console.error('Server chưa chạy. Hãy bật server trước.'); process.exit(1); }
  const name = 'posrestart_' + crypto.randomBytes(4).toString('hex');
  const pass = 'test123456';
  console.log(`PHASE 1 — tạo dữ liệu\nTài khoản tạm: ${name}\n`);

  const reg = await req('/api/register', { username: name, password: pass, charName: 'PosRestart' });
  if (reg.status !== 200) { console.error('Đăng ký lỗi:', reg.status, reg.json); process.exit(1); }
  const cookie = cookieOf(reg);
  const me0 = await req('/api/me', null, cookie);
  const HOME = me0.json.player.map;
  const uid = (await pool.query('SELECT id FROM users WHERE username = $1', [name])).rows[0].id;

  // Chết để có cờ arrive (đúng trạng thái gây lỗi cũ), rồi lưu vị trí
  await req('/api/action', { type: 'die' }, cookie);
  const X = 1750, Y = 610;
  await req('/api/action', { type: 'save', map: HOME, x: X, y: Y, hp: 100, mp: 50 }, cookie);
  const me = await req('/api/me', null, cookie);
  const p = me.json.player;
  ok(p.x === X && p.y === Y && !p.arrive, 'đã lưu vị trí và xoá cờ arrive', `x=${p.x} y=${p.y} arrive=${JSON.stringify(p.arrive)}`);

  // Chờ ghi trễ xuống DB
  let d = null;
  for (let i = 0; i < 12; i++) {
    await sleep(1000);
    d = (await pool.query(`SELECT core->>'x' AS x FROM players WHERE user_id = $1`, [uid])).rows[0];
    if (Number(d.x) === X) break;
  }
  ok(Number(d.x) === X, 'DB đã ghi vị trí trước khi tắt server', `x=${d.x}`);

  fs.writeFileSync(MARK, JSON.stringify({ name, pass, map: HOME, x: X, y: Y }));
  console.log('\n  Đang tắt server...');
  await killServer();
  console.log('  Đang bật lại server...');
  startServer();
  if (!(await waitUp(25000))) { console.error('Server không lên lại.'); process.exit(1); }
  console.log('  Server đã lên lại.\n');

  await pool.end();
  // Chạy tiếp phase 2 trong tiến trình mới
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, ['--env-file-if-exists=.env', __filename, '--phase2'], { cwd: ROOT, stdio: 'inherit' });
  process.exit(r.status || 0);
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
