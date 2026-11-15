'use strict';
/*
 * Kiểm tra end-to-end qua HTTP thật: vị trí nhân vật sống qua lần thoát/vào lại.
 * Chạy khi server đang chạy: node --env-file-if-exists=.env server/tools/check/check-player-pos-live.js
 *
 * Đi đúng đường thật của game để tạo ra cờ `arrive`: chết (action 'die') → server đặt arrive='S'
 * và xoá x/y. Sau đó đi vào giữa bản đồ và lưu vị trí. Trước khi sửa, x/y được lưu nhưng cờ `arrive`
 * còn sót, nên lúc mở lại game client ném nhân vật về cổng thay vì đặt đúng chỗ đã lưu.
 */
const crypto = require('crypto');
const { Pool } = require('pg');

const BASE = process.env.BASE || 'http://127.0.0.1:3100';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (cond) { console.log(`  ✓ ${label}`); return true; }
  fails++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); return false;
}

async function req(path, body, cookie) {
  const res = await fetch(BASE + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, json: await res.json().catch(() => null), set };
}
const cookieOf = (r) => r.set.map((c) => c.split(';')[0]).join('; ');

// Đúng logic public/js/scene/player.js buildPlayer: có dùng vị trí đã lưu hay không
const clientUsesSavedPos = (p) => p.x != null && p.y != null && !p.arrive;

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'anphong',
});

(async () => {
  const name = 'poslive_' + crypto.randomBytes(4).toString('hex');
  const pass = 'test123456';
  console.log(`Tài khoản tạm: ${name}\n`);

  const reg = await req('/api/register', { username: name, password: pass, charName: 'PosLive' });
  if (reg.status !== 200) { console.error('Đăng ký lỗi:', reg.status, reg.json); process.exit(1); }
  let cookie = cookieOf(reg);
  const uid = (await pool.query('SELECT id FROM users WHERE username = $1', [name])).rows[0].id;

  // ---- 1. Chết: server đặt cờ arrive='S' và xoá vị trí (đây là nguồn của cờ arrive)
  console.log('1. Chết → server đặt cờ arrive (nguồn gốc của lỗi)');
  const die = await req('/api/action', { type: 'die' }, cookie);
  ok(die.json && die.json.ok !== false, 'server xử lý chết', JSON.stringify(die.json && die.json.error));
  let me = await req('/api/me', null, cookie);
  let p = me.json.player;
  const HOME = p.map;
  console.log(`  sau khi chết: map=${p.map} x=${p.x} y=${p.y} arrive=${JSON.stringify(p.arrive)}`);
  ok(!!p.arrive, 'có cờ arrive sau khi chết', JSON.stringify(p.arrive));
  ok(p.x === null && p.y === null, 'vị trí được xoá (sẽ hồi sinh ở cổng)');

  // ---- 2. Đi vào giữa bản đồ rồi lưu (như autoSave mỗi 10 giây / saveOnExit)
  console.log('\n2. Đi vào giữa bản đồ rồi lưu vị trí');
  const s = await req('/api/action', { type: 'save', map: HOME, x: 1500, y: 610, hp: 100, mp: 50 }, cookie);
  ok(s.json && s.json.ok !== false, 'server nhận lệnh lưu', JSON.stringify(s.json && s.json.error));
  me = await req('/api/me', null, cookie);
  p = me.json.player;
  ok(p.x === 1500 && p.y === 610, 'vị trí đã lưu', `x=${p.x} y=${p.y}`);
  ok(!p.arrive, 'cờ arrive đã bị xoá sau khi lưu vị trí', JSON.stringify(p.arrive));

  // ---- 3. Thoát game rồi vào lại
  console.log('\n3. Thoát game rồi vào lại');
  await req('/api/logout', {}, cookie);
  cookie = cookieOf(await req('/api/login', { username: name, password: pass }));
  me = await req('/api/me', null, cookie);
  p = me.json.player;
  console.log(`  đọc lại: map=${p.map} x=${p.x} y=${p.y} arrive=${JSON.stringify(p.arrive)}`);
  ok(p.x === 1500 && p.y === 610, 'vị trí được giữ sau khi vào lại', `x=${p.x} y=${p.y}`);
  ok(!p.arrive, 'không còn cờ arrive', JSON.stringify(p.arrive));
  ok(clientUsesSavedPos(p), 'client đặt nhân vật đúng vị trí cũ (không ném về cổng)');

  // ---- 4. Đọc thẳng từ PostgreSQL. `save` nằm trong DEFERRED_SAVE nên ghi trễ tới 6 giây (FLUSH_MS).
  console.log('\n4. Kiểm tra dữ liệu thật trong PostgreSQL (chờ lượt ghi trễ tối đa 6 giây)');
  let d = null;
  for (let i = 0; i < 12; i++) {
    await sleep(1000);
    const row = await pool.query(
      `SELECT core->>'x' AS x, core->>'y' AS y, core->>'map' AS map FROM players WHERE user_id = $1`, [uid]);
    d = row.rows[0];
    if (Number(d.x) === 1500 && Number(d.y) === 610) break;
  }
  ok(Number(d.x) === 1500 && Number(d.y) === 610, 'DB lưu đúng vị trí', `x=${d.x} y=${d.y}`);
  const misc = await pool.query(
    `SELECT data->>'arrive' AS arrive FROM player_data WHERE user_id = $1 AND section = 'misc'`, [uid]);
  ok(misc.rows[0].arrive === null || misc.rows[0].arrive === undefined, 'DB không còn cờ arrive', JSON.stringify(misc.rows[0].arrive));

  // ---- 5. Đi tiếp rồi lưu lần nữa: vẫn đúng
  console.log('\n5. Đi tiếp rồi lưu lần nữa');
  await req('/api/action', { type: 'save', map: HOME, x: 2200, y: 610, hp: 90, mp: 40 }, cookie);
  await req('/api/logout', {}, cookie);
  cookie = cookieOf(await req('/api/login', { username: name, password: pass }));
  me = await req('/api/me', null, cookie);
  p = me.json.player;
  ok(p.x === 2200 && p.y === 610 && !p.arrive, 'vị trí mới được giữ, không có cờ arrive',
    `x=${p.x} y=${p.y} arrive=${JSON.stringify(p.arrive)}`);

  // ---- 6. Chết rồi vào lại ngay (không đi đâu): phải hồi sinh ở cổng, KHÔNG dùng vị trí cũ
  console.log('\n6. Chết rồi vào lại ngay: phải hồi sinh ở cổng');
  await req('/api/action', { type: 'die' }, cookie);
  await req('/api/logout', {}, cookie);
  cookie = cookieOf(await req('/api/login', { username: name, password: pass }));
  me = await req('/api/me', null, cookie);
  p = me.json.player;
  ok(p.x === null && p.y === null, 'vị trí đã xoá khi chết', `x=${p.x} y=${p.y}`);
  ok(!!p.arrive, 'giữ cờ arrive để hồi sinh ở cổng', JSON.stringify(p.arrive));
  ok(!clientUsesSavedPos(p), 'client đặt nhân vật ở cổng (đúng ý đồ)');

  // ---- Dọn
  await pool.query('DELETE FROM users WHERE id = $1', [uid]);
  await pool.end();
  console.log(`\n${fails ? '✗' : '✓'} ${checks - fails}/${checks} kiểm tra đạt.`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
