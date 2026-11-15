'use strict';
/*
 * Kiểm tra trên server thật: quái chết thì mới hồi đầy máu.
 * Chạy khi server đang chạy: node server/tools/check/check-mob-death.js
 *
 * Dùng một quái thường (respawn ngắn) để không phải chờ lâu.
 */
const { WebSocket } = require('ws');

const BASE = process.env.BASE || 'http://127.0.0.1:3100';
const MAP = process.env.MAP || 'hang';
const MOB_ID = process.env.MOB || 'nhen_da';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (cond) { console.log(`  ✓ ${label}`); return true; }
  fails++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); return false;
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, json: await res.json().catch(() => null), set };
}

function open(cookie) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws', { headers: { Cookie: cookie } });
    const got = []; const waiters = [];
    ws.on('message', (buf) => {
      let m; try { m = JSON.parse(buf.toString('utf8')); } catch { return; }
      got.push(m);
      for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].pred(m)) { waiters[i].resolve(m); waiters.splice(i, 1); }
    });
    ws.on('error', reject);
    ws.on('open', () => resolve({
      ws, got,
      wait(pred, ms = 5000) {
        const f = got.find(pred);
        if (f) return Promise.resolve(f);
        return new Promise((res) => {
          const w = { pred, resolve: res }; waiters.push(w);
          setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); res(null); } }, ms);
        });
      },
      close() { try { ws.close(); } catch { /* bỏ qua */ } },
    }));
  });
}

async function session() {
  const name = 'mobdeath_fixed', pass = 'test123456';
  let r = await post('/api/login', { username: name, password: pass });
  if (r.status !== 200) r = await post('/api/register', { username: name, password: pass, charName: 'DeathTest' });
  if (r.status !== 200) throw new Error('không đăng nhập được: ' + r.status);
  return r.set.map((c) => c.split(';')[0]).join('; ');
}

(async () => {
  const cookie = await session();
  const c = await open(cookie);
  await c.wait((m) => m.t === 'hello');
  c.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: 600, y: 300, f: 1, a: 'idle', r: 1 }));
  const list = await c.wait((m) => m.t === 'mobs');
  const mob = list && list.list.find((x) => x.id === MOB_ID);
  if (!mob) { console.error('Không tìm thấy quái', MOB_ID); process.exit(1); }
  console.log(`Quái thử: ${MOB_ID} · máu ${mob.hp}/${mob.mh}\n`);

  // Đứng sát quái
  c.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: mob.x + 40, y: mob.y, f: 1, a: 'idle' }));
  await sleep(200);

  // ---- Đánh cho tới chết
  console.log('1. Đánh cho tới khi quái chết');
  let guard = 0;
  while (guard++ < 40) {
    c.ws.send(JSON.stringify({ t: 'hit', u: mob.u, d: Math.max(1, Math.round(mob.mh * 0.3)), c: 0, dir: 1 }));
    await sleep(180);
    const dead = c.got.find((m) => m.t === 'mdie' && m.u === mob.u);
    if (dead) break;
  }
  const die = c.got.find((m) => m.t === 'mdie' && m.u === mob.u);
  ok(!!die, 'server báo quái chết (mdie)');
  ok(!!die && die.kid, 'có phiếu nhận thưởng', die ? die.kid : 'không có');

  // ---- Chờ hồi sinh
  console.log('\n2. Chờ hồi sinh (theo thời gian chờ của quái)');
  const resp = await c.wait((m) => m.t === 'mresp' && m.m && m.m.u === mob.u, 20000);
  ok(!!resp, 'nhận gói hồi sinh (mresp)');
  if (resp) {
    ok(resp.m.hp === resp.m.mh, 'hồi sinh đầy máu', `${resp.m.hp}/${resp.m.mh}`);
    ok(resp.m.al === 1, 'quái sống lại');
  }

  // ---- Sau hồi sinh, máu phải giữ nguyên khi bỏ đi
  console.log('\n3. Sau khi hồi sinh, đánh bớt rồi bỏ đi');
  const hpNow = resp ? resp.m.hp : mob.mh;
  const uid = mob.u;
  c.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: mob.x + 40, y: mob.y, f: 1, a: 'idle' }));
  await sleep(200);
  for (let i = 0; i < 3; i++) {
    c.ws.send(JSON.stringify({ t: 'hit', u: uid, d: Math.max(1, Math.round(hpNow * 0.1)), c: 0, dir: 1 }));
    await sleep(180);
  }
  await sleep(400);
  const hits = c.got.filter((m) => m.t === 'mhit' && m.u === uid);
  const hurt = hits.length ? hits[hits.length - 1].hp : hpNow;
  ok(hurt < hpNow, 'máu đã giảm sau khi hồi sinh', `${hpNow} → ${hurt}`);

  c.close();
  await sleep(600);

  // Vào lại bằng kết nối mới
  const c2 = await open(cookie);
  await c2.wait((m) => m.t === 'hello');
  c2.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: 600, y: 300, f: 1, a: 'idle', r: 1 }));
  const list2 = await c2.wait((m) => m.t === 'mobs');
  const mob2 = list2 && list2.list.find((x) => x.id === MOB_ID);
  ok(!!mob2, 'quái vẫn ở đó sau khi vào lại');
  if (mob2) ok(mob2.hp === hurt, 'máu giữ nguyên (không hồi đầy)', `${hurt} vs ${mob2.hp}`);
  c2.close();

  console.log(`\n${fails ? '✗' : '✓'} ${checks - fails}/${checks} kiểm tra đạt.`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
