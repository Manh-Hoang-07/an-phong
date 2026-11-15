'use strict';
/*
 * Kiểm tra end-to-end qua WebSocket thật: đánh quái rồi ngắt kết nối (đăng xuất) và vào lại,
 * máu quái phải giữ nguyên. Chạy khi server đang chạy: node server/tools/check/check-mob-hp-live.js
 *
 * Cách làm: tạo một tài khoản tạm, đăng nhập lấy cookie phiên, mở WebSocket /ws, vào một bản đồ có
 * quái, gửi gói `hit` vài lần, đọc máu từ gói `mhit`, rồi đóng kết nối. Mở kết nối mới cùng tài khoản,
 * vào lại bản đồ đó và đọc danh sách quái từ gói `mobs`.
 */
const { WebSocket } = require('ws');
const crypto = require('crypto');

const BASE = process.env.BASE || 'http://127.0.0.1:3100';
const MAP = process.env.MAP || 'hang';
const MOB_ID = process.env.MOB || 'thach_quy';

let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (cond) { console.log(`  ✓ ${label}`); return true; }
  fails++;
  console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`);
  return false;
}

async function post(path, body, cookie) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, json: await res.json().catch(() => null), set };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mở WebSocket và thu gói tin
function open(cookie) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws', { headers: { Cookie: cookie } });
    const got = [];
    const waiters = [];
    ws.on('message', (buf) => {
      let m;
      try { m = JSON.parse(buf.toString('utf8')); } catch { return; }
      got.push(m);
      for (let i = waiters.length - 1; i >= 0; i--) {
        if (waiters[i].pred(m)) { waiters[i].resolve(m); waiters.splice(i, 1); }
      }
    });
    ws.on('error', reject);
    ws.on('open', () => resolve({
      ws, got,
      // Chờ một gói thoả điều kiện (hoặc hết hạn)
      wait(pred, ms = 4000) {
        const found = got.find(pred);
        if (found) return Promise.resolve(found);
        return new Promise((res) => {
          const w = { pred, resolve: res };
          waiters.push(w);
          setTimeout(() => {
            const i = waiters.indexOf(w);
            if (i >= 0) { waiters.splice(i, 1); res(null); }
          }, ms);
        });
      },
      close() { try { ws.close(); } catch { /* bỏ qua */ } },
    }));
  });
}

(async () => {
  const name = 'mobtest_' + crypto.randomBytes(4).toString('hex');
  const pass = 'test123456';
  console.log(`Tài khoản tạm: ${name}\nBản đồ: ${MAP} · quái: ${MOB_ID}\n`);

  // ---- Đăng ký
  const reg = await post('/api/register', { username: name, password: pass, charName: 'MobTest' });
  if (reg.status !== 200) { console.error('Đăng ký thất bại:', reg.status, reg.json); process.exit(1); }
  const cookie = reg.set.map((c) => c.split(';')[0]).join('; ');
  ok(!!cookie, 'đăng ký và có cookie phiên');

  // ---- Lần 1: vào map, đánh quái
  console.log('\n1. Vào bản đồ và đánh quái');
  const c1 = await open(cookie);
  const hello = await c1.wait((m) => m.t === 'hello');
  ok(!!hello, 'nhận gói hello', hello ? `id=${hello.id}` : 'không có');

  // Đứng gần quái rồi vào phòng
  c1.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: 600, y: 300, f: 1, a: 'idle', r: 1 }));
  const mobsMsg = await c1.wait((m) => m.t === 'mobs');
  ok(!!mobsMsg, 'nhận danh sách quái của bản đồ', mobsMsg ? `${mobsMsg.list.length} con` : 'không có');
  if (!mobsMsg) { c1.close(); process.exit(1); }

  const boss = mobsMsg.list.find((x) => x.id === MOB_ID);
  ok(!!boss, `tìm thấy quái ${MOB_ID}`, boss ? `hp ${boss.hp}/${boss.mh}` : 'không có');
  if (!boss) { c1.close(); process.exit(1); }
  const hp0 = boss.hp;

  // Đứng đúng chỗ quái để đòn được tính (server kiểm tra khoảng cách)
  c1.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: boss.x + 40, y: boss.y, f: 1, a: 'idle' }));
  await sleep(150);

  const dmg = Math.max(1, Math.round(boss.mh * 0.05));
  for (let i = 0; i < 4; i++) {
    c1.ws.send(JSON.stringify({ t: 'hit', u: boss.u, d: dmg, c: 0, dir: 1 }));
    await sleep(120);
  }
  await sleep(300);
  // Lấy gói mhit CUỐI CÙNG (máu sau tất cả các đòn), không phải gói đầu
  const hits = c1.got.filter((m) => m.t === 'mhit' && m.u === boss.u);
  ok(hits.length > 0, 'server ghi nhận đòn đánh', `${hits.length} gói`);
  const hpAfterHit = hits.length ? hits[hits.length - 1].hp : hp0;
  ok(hpAfterHit < hp0, 'máu quái đã giảm', `${hp0} → ${hpAfterHit}`);

  // ---- Ngắt kết nối (đăng xuất)
  console.log('\n2. Ngắt kết nối (đăng xuất) rồi vào lại');
  c1.close();
  await sleep(600);

  const c2 = await open(cookie);
  await c2.wait((m) => m.t === 'hello');
  c2.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: 600, y: 300, f: 1, a: 'idle', r: 1 }));
  const mobs2 = await c2.wait((m) => m.t === 'mobs');
  ok(!!mobs2, 'vào lại nhận danh sách quái');
  const boss2 = mobs2 && mobs2.list.find((x) => x.id === MOB_ID);
  ok(!!boss2, 'quái vẫn ở đó');
  if (boss2) {
    ok(boss2.hp === hpAfterHit, 'máu giữ nguyên sau khi đăng xuất vào lại', `${hpAfterHit} vs ${boss2.hp}`);
    ok(boss2.al === 1, 'quái vẫn còn sống');
  }

  // ---- Đứng xa (ra khỏi phạm vi) một lúc
  console.log('\n3. Chạy ra xa khỏi phạm vi quái rồi quay lại');
  c2.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: 5000, y: 300, f: 1, a: 'idle' }));
  await sleep(2500);
  c2.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: boss.x + 40, y: boss.y, f: 1, a: 'idle' }));
  await sleep(400);
  // Xin lại danh sách bằng cách vào lại phòng
  c2.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: boss.x + 40, y: boss.y, f: 1, a: 'idle', r: 1 }));
  const mobs3 = await c2.wait((m) => m.t === 'mobs');
  const boss3 = mobs3 && mobs3.list.find((x) => x.id === MOB_ID);
  if (boss3) ok(boss3.hp === hpAfterHit, 'máu giữ nguyên sau khi ra xa rồi quay lại', `${hpAfterHit} vs ${boss3.hp}`);
  else ok(false, 'quái vẫn ở đó sau khi quay lại');

  // ---- Đổi bản đồ rồi quay lại
  console.log('\n4. Đổi sang bản đồ khác rồi quay lại');
  c2.ws.send(JSON.stringify({ t: 'pos', map: 'lang', x: 300, y: 300, f: 1, a: 'idle' }));
  await sleep(1200);
  c2.ws.send(JSON.stringify({ t: 'pos', map: MAP, x: boss.x + 40, y: boss.y, f: 1, a: 'idle', r: 1 }));
  const mobs4 = await c2.wait((m) => m.t === 'mobs' && m.map === MAP);
  const boss4 = mobs4 && mobs4.list.find((x) => x.id === MOB_ID);
  if (boss4) ok(boss4.hp === hpAfterHit, 'máu giữ nguyên sau khi đổi bản đồ', `${hpAfterHit} vs ${boss4.hp}`);
  else ok(false, 'quái vẫn ở đó sau khi đổi bản đồ');

  c2.close();
  await sleep(300);

  console.log(`\n${fails ? '✗' : '✓'} ${checks - fails}/${checks} kiểm tra đạt.`);
  console.log(`Tài khoản tạm để dọn: ${name}`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
