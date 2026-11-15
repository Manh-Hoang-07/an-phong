'use strict';
/*
 * Kiểm chứng tối ưu gói 'snap' trong server/realtime/index.js.
 *
 *   Trước: mỗi 100ms server gửi 'snap' cho CẢ người vừa di chuyển (client bỏ qua vì
 *          remote.js chỉ tra this.remotes, không có mình trong đó), và cả khi phòng chỉ có 1 người.
 *   Sau:   phòng 1 người → không gửi gì. Phòng nhiều người → gửi cho mọi người TRỪ người vừa di chuyển.
 *
 * Phải giữ được: người đứng yên VẪN nhận đủ vị trí người kia.
 *
 * Dùng WebSocket thật + đăng nhập thật (cookie phiên), đúng đường game đi.
 *   node server/tools/check/check-snap-except.js
 */
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const WebSocket = require(path.join(ROOT, 'node_modules', 'ws'));

const BASE = process.env.BASE || 'http://127.0.0.1:3100';
const WSURL = BASE.replace(/^http/, 'ws') + '/ws';
const TAG = 'snap_' + crypto.randomBytes(4).toString('hex');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}${extra ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Mở WebSocket bằng cookie phiên (server xác thực lúc nâng cấp, không có tin 'auth')
function connect(cookie, label) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WSURL, { headers: { Cookie: cookie } });
    const got = [];
    ws.on('message', (buf) => {
      let m; try { m = JSON.parse(buf.toString()); } catch { return; }
      got.push(m);
      if (m.t === 'hello' && !ws._ready) { ws._ready = true; ws._id = m.id; resolve({ ws, got, label, id: m.id }); }
    });
    ws.on('error', reject);
    setTimeout(() => { if (!ws._ready) reject(new Error(`${label}: không nhận được hello`)); }, 8000);
  });
}

const snaps = (got) => got.filter((m) => m.t === 'snap');
const hasId = (snap, id) => snap.p.some((row) => row[0] === id);

async function main() {
  console.log('=== Kiểm chứng tối ưu gói snap (WebSocket thật) ===\n');

  const mk = async (n) => {
    const name = `${TAG}_${n}`;
    const r = await req('/api/register', { username: name, password: 'test123456', charName: 'Snap' + n });
    if (r.status !== 200) throw new Error(`đăng ký ${name} lỗi: ${r.status} ${JSON.stringify(r.json)}`);
    return { name, cookie: cookieOf(r) };
  };

  const uA = await mk('a');
  const uB = await mk('b');

  // ---------- Phần 1: phòng 1 người
  console.log('Phần 1 — phòng chỉ có 1 người');
  const A = await connect(uA.cookie, 'A');
  A.ws.send(JSON.stringify({ t: 'pos', map: 'rung', x: 600, y: 400, f: 1, a: 'idle' }));
  await sleep(700);
  A.got.length = 0;
  for (let i = 0; i < 20; i++) {
    A.ws.send(JSON.stringify({ t: 'pos', map: 'rung', x: 600 + i * 12, y: 400, f: 1, a: 'run' }));
    await sleep(100);
  }
  await sleep(300);
  const solo = snaps(A.got);
  ok('1 người: không nhận gói snap nào', solo.length === 0, `${solo.length} gói`);

  // ---------- Phần 2: 2 người, A di chuyển
  console.log('\nPhần 2 — 2 người, A di chuyển, B đứng yên');
  const B = await connect(uB.cookie, 'B');
  B.ws.send(JSON.stringify({ t: 'pos', map: 'rung', x: 700, y: 400, f: 1, a: 'idle' }));
  await sleep(800);
  A.got.length = 0; B.got.length = 0;

  for (let i = 0; i < 20; i++) {
    A.ws.send(JSON.stringify({ t: 'pos', map: 'rung', x: 600 + i * 12, y: 400, f: 1, a: 'run' }));
    await sleep(100);
  }
  await sleep(400);

  const aS = snaps(A.got), bS = snaps(B.got);
  const aSelf = aS.filter((s) => hasId(s, A.id)).length;
  ok('A không nhận lại vị trí của chính mình', aSelf === 0, `${aSelf} gói chứa id A`);
  ok('B vẫn nhận được vị trí của A', bS.length > 0, `${bS.length} gói`);
  const maxX = Math.max(0, ...bS.flatMap((s) => s.p.map((r) => r[1])));
  ok('B nhận đúng toạ độ A đã đi', maxX > 700, `x lớn nhất B thấy = ${maxX}`);

  // ---------- Phần 3: chiều ngược lại
  console.log('\nPhần 3 — B di chuyển, A đứng yên');
  A.got.length = 0; B.got.length = 0;
  for (let i = 0; i < 15; i++) {
    B.ws.send(JSON.stringify({ t: 'pos', map: 'rung', x: 700 + i * 10, y: 400, f: 1, a: 'run' }));
    await sleep(100);
  }
  await sleep(400);
  const bSelf = snaps(B.got).filter((s) => hasId(s, B.id)).length;
  const aS2 = snaps(A.got);
  ok('B không nhận lại vị trí của chính mình', bSelf === 0, `${bSelf} gói`);
  ok('A vẫn nhận được vị trí của B', aS2.length > 0, `${aS2.length} gói`);

  // ---------- Phần 4: cả hai cùng di chuyển
  console.log('\nPhần 4 — cả hai cùng di chuyển');
  A.got.length = 0; B.got.length = 0;
  for (let i = 0; i < 15; i++) {
    A.ws.send(JSON.stringify({ t: 'pos', map: 'rung', x: 600 + i * 10, y: 400, f: 1, a: 'run' }));
    B.ws.send(JSON.stringify({ t: 'pos', map: 'rung', x: 700 + i * 10, y: 400, f: -1, a: 'run' }));
    await sleep(100);
  }
  await sleep(400);
  const aAll = snaps(A.got), bAll = snaps(B.got);
  ok('A nhận được vị trí của B', aAll.some((s) => hasId(s, B.id)), `${aAll.length} gói`);
  ok('B nhận được vị trí của A', bAll.some((s) => hasId(s, A.id)), `${bAll.length} gói`);
  const aSelf2 = aAll.filter((s) => hasId(s, A.id) && s.p.length === 1).length;
  ok('không còn gói chỉ chứa chính mình', aSelf2 === 0, `${aSelf2} gói`);

  A.ws.close(); B.ws.close();
  await sleep(400);

  console.log(`\n${fail === 0 ? '✓' : '✗'} ${pass}/${pass + fail} kiểm tra đạt.`);
  console.log(`Tài khoản tạm: ${uA.name}, ${uB.name}`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('LỖI:', e.message); process.exit(1); });
