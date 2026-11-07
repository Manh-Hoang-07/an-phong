'use strict';
/*
 * Thức Tỉnh - server game.
 *   npm start            -> chạy ở http://127.0.0.1:3100
 * Biến môi trường:
 *   PORT=3100            cổng
 *   HOST=127.0.0.1       0.0.0.0 để điện thoại cùng wifi vào chơi được
 *   COOKIE_SECURE=1      bật khi chạy sau HTTPS (Nginx + Let's Encrypt)
 *   ALLOW_REGISTER=0     đóng đăng ký tài khoản mới (mặc định đăng ký luôn mở)
 *   DATABASE_URL=...     chuỗi kết nối PostgreSQL (hoặc dùng PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE)
 */
const http = require('http');
const path = require('path');
const zlib = require('zlib');
const store = require('./db');
const cache = require('./cache');
const auth = require('./auth');
const game = require('./game');
const G = require('../shared');

const PORT = Number(process.env.PORT) || 3100;
const HOST = process.env.HOST || '127.0.0.1';
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const ROOT = path.join(__dirname, '..');

const serveStatic = require('./static')(ROOT);

// Nhân vật đang chơi được giữ trong bộ nhớ (server/cache.js).
// Hành động nhỏ, lặp nhiều chỉ đánh dấu rồi ghi gộp vài giây một lần; còn lại ghi ngay.
const DEFERRED_SAVE = new Set(['kill', 'kills', 'save']);
const getPlayer = (userId) => cache.getPlayer(userId);

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; media-src 'self' data: blob:; connect-src 'self'");
}

// Trả JSON; dữ liệu từ 1KB trở lên được nén gzip (dữ liệu nhân vật thường 1–10KB, nén còn khoảng 1/5).
// Nén bất đồng bộ (chạy trong thread pool) để không chặn người chơi khác.
function send(res, status, obj, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Accept-Encoding', ...extraHeaders };
  const finish = (buf) => {
    if (res.headersSent || res.destroyed) return;
    headers['Content-Length'] = buf.length;
    res.writeHead(status, headers);
    res.end(buf);
  };
  const accept = String((res.req && res.req.headers['accept-encoding']) || '');
  if (body.length < 1024 || !/\bgzip\b/.test(accept)) return finish(body);
  zlib.gzip(body, { level: 6 }, (err, gz) => {
    if (err) return finish(body);
    headers['Content-Encoding'] = 'gzip';
    finish(gz);
  });
}

// Chống xử lý trùng: khi mạng chập chờn, client gửi lại cùng mã yêu cầu (rid).
// Nếu server đã xử lý rồi thì trả lại đúng kết quả cũ thay vì làm lần nữa (không nhận thưởng 2 lần).
const recentReplies = new Map();   // userId → Map(rid → [status, obj])
function rememberReply(userId, rid, status, obj) {
  if (!rid) return;
  let m = recentReplies.get(userId);
  if (!m) { m = new Map(); recentReplies.set(userId, m); }
  m.set(rid, [status, obj]);
  if (m.size > 40) m.delete(m.keys().next().value);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 32 * 1024) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sessionCookie(token, maxAge) {
  return `ap_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${COOKIE_SECURE ? '; Secure' : ''}`;
}

function clientIp(req) {
  // Sau Nginx: lấy IP thật từ X-Real-IP (Nginx ghi đè header này, người chơi không giả được)
  return req.headers['x-real-ip'] || req.socket.remoteAddress || '';
}

function clientCtx(req) {
  return { ip: clientIp(req), userAgent: String(req.headers['user-agent'] || '').slice(0, 300) || null };
}

function validCredentials(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!/^[\p{L}\p{N}_]{3,20}$/u.test(username)) return [null, 'Tên đăng nhập 3–20 ký tự, chỉ gồm chữ, số và dấu gạch dưới.'];
  if (password.length < 6 || password.length > 100) return [null, 'Mật khẩu cần ít nhất 6 ký tự.'];
  return [{ username, password }, null];
}

async function api(req, res, url) {
  const token = cookies(req).ap_session;
  const session = await auth.getSession(token);

  if (url === '/api/me' && req.method === 'GET') {
    if (!session) return send(res, 200, { user: null, registerOpen: await auth.registerOpen() });
    return send(res, 200, { user: session.username, player: await getPlayer(session.userId) });
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  // Chặn gửi form từ trang web khác (CSRF): chỉ nhận JSON
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
    return send(res, 415, { error: 'Cần gửi JSON.' });
  }
  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: 'Dữ liệu không hợp lệ.' }); }

  if (url === '/api/register') {
    if (!(await auth.registerOpen())) return send(res, 403, { error: 'Đã đóng đăng ký tài khoản mới.' });
    const [cred, err] = validCredentials(body);
    if (err) return send(res, 400, { error: err });
    const charName = String(body.charName || cred.username).trim().slice(0, 16) || cred.username;
    const ctx = clientCtx(req);
    const s = auth.newSession(null, ctx);
    const userId = await store.registerUser(cred.username, await auth.hashPassword(cred.password), G.newPlayer(charName), s);
    if (!userId) return send(res, 400, { error: 'Tên đăng nhập đã tồn tại.' });
    auth.log({ userId, username: cred.username, event: 'register', ...ctx });
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(s.token, s.maxAge) });
  }

  if (url === '/api/login') {
    const ctx = clientCtx(req);
    if (!auth.loginAllowed(ctx.ip)) return send(res, 429, { error: 'Sai quá nhiều lần, thử lại sau 10 phút.' });
    const username = String(body.username || '').trim().slice(0, 40);
    const user = username ? await store.userByName(username) : null;
    const okPass = await auth.verifyPassword(String(body.password || '').slice(0, 200), user && user.pass);
    if (!user || !okPass) {
      auth.loginFailed(ctx.ip);
      auth.log({ userId: user ? user.id : null, username, event: 'login_fail', ...ctx });
      return send(res, 401, { error: 'Sai tên đăng nhập hoặc mật khẩu.' });
    }
    if (user.banned) {
      auth.log({ userId: user.id, username: user.username, event: 'login_banned', ...ctx });
      return send(res, 403, { error: 'Tài khoản đã bị khóa' + (user.ban_reason ? ': ' + user.ban_reason : '.') });
    }
    const s = await auth.createSession(user.id, ctx);
    store.touchLogin(user.id, ctx.ip).catch((e) => console.error('Cập nhật lần đăng nhập lỗi:', e.message));
    auth.log({ userId: user.id, username: user.username, event: 'login', ...ctx });
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(s.token, s.maxAge) });
  }

  if (url === '/api/logout') {
    await auth.destroySession(token);
    if (session) auth.log({ userId: session.userId, username: session.username, event: 'logout', ...clientCtx(req) });
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  if (url === '/api/action') {
    if (!session) return send(res, 401, { error: 'Phiên đăng nhập đã hết, hãy đăng nhập lại.' });
    const p = await getPlayer(session.userId);
    if (!p) return send(res, 404, { error: 'Không tìm thấy nhân vật.' });
    const rid = typeof body.rid === 'string' && body.rid.length <= 40 ? body.rid : null;
    delete body.rid;
    if (rid) {
      const old = recentReplies.get(session.userId)?.get(rid);
      if (old) return send(res, old[0], { ...old[1], player: p });
    }
    const backup = JSON.stringify(p);
    cache.begin(session.userId);
    try {
      const events = await game.handle(session.userId, p, body);
      if (DEFERRED_SAVE.has(body.type)) cache.markDirty(session.userId);
      else await cache.saveNow(session.userId);
      rememberReply(session.userId, rid, 200, { ok: true, events });
      return send(res, 200, { ok: true, player: p, events });
    } catch (e) {
      // Lỗi giữa chừng thì trả nhân vật về trạng thái trước đó
      const restored = JSON.parse(backup);
      cache.replacePlayer(session.userId, restored);
      if (e instanceof game.GameError) {
        rememberReply(session.userId, rid, 200, { ok: false, error: e.message });
        return send(res, 200, { ok: false, error: e.message, player: restored });
      }
      console.error(e);
      return send(res, 500, { error: 'Lỗi server.' });
    } finally {
      cache.end(session.userId);
    }
  }

  return send(res, 404, { error: 'Không tìm thấy.' });
}

const server = http.createServer((req, res) => {
  securityHeaders(res);
  const [url, query = ''] = (req.url || '/').split('?');
  if (url.startsWith('/api/')) {
    api(req, res, url).catch((e) => { console.error(e); send(res, 500, { error: 'Lỗi server.' }); });
  } else if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res, url, query);
  } else {
    res.writeHead(405); res.end();
  }
});

async function maintenance() {
  const r = await store.maintenance();
  if (r.sessions || r.authLog || r.snapshots) {
    console.log(`Dọn dữ liệu: ${r.sessions} phiên hết hạn, ${r.authLog} dòng nhật ký cũ, ${r.snapshots} bản chụp cũ.`);
  }
}

async function start() {
  await store.init();
  cache.configure({ migrate: game.migrate, onEvict: (userId) => recentReplies.delete(userId) });
  cache.start();
  await maintenance();
  setInterval(() => maintenance().catch((e) => console.error('Dọn dữ liệu lỗi:', e.message)), 3600 * 1000).unref();
  server.listen(PORT, HOST, () => {
    console.log(`Thức Tỉnh đang chạy tại http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`Dữ liệu lưu trong PostgreSQL: ${store.DB_INFO}`);
  });
}

// Tắt server (systemd stop/restart, Ctrl+C): ngừng nhận yêu cầu, ghi hết nhân vật còn chờ rồi mới thoát
let stopping = false;
async function shutdown(sig) {
  if (stopping) return;
  stopping = true;
  console.log(`Nhận ${sig}, đang lưu dữ liệu trước khi tắt...`);
  setTimeout(() => { console.error('Quá 10 giây, buộc tắt.'); process.exit(1); }, 10000).unref();
  server.close();
  cache.stop();
  try {
    await cache.flushAll();
    await store.close();
  } catch (e) {
    console.error('Lỗi khi lưu lúc tắt:', e.message);
  }
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((e) => {
  console.error('Không kết nối được PostgreSQL:', e.message);
  console.error('Kiểm tra database đã tạo chưa và các biến PGHOST/PGUSER/PGPASSWORD/PGDATABASE (hoặc DATABASE_URL).');
  process.exit(1);
});
