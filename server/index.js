'use strict';
/*
 * Thức Tỉnh - server game.
 *   npm start            -> chạy ở http://127.0.0.1:3100
 * Biến môi trường:
 *   PORT=3100            cổng
 *   HOST=127.0.0.1       0.0.0.0 để điện thoại cùng wifi vào chơi được
 *   COOKIE_SECURE=1      bật khi chạy sau HTTPS (Nginx + Let's Encrypt)
 *   ALLOW_REGISTER=1     cho phép tạo thêm tài khoản (mặc định chỉ tạo được tài khoản đầu tiên)
 *   DATA_DIR=/đường/dẫn  nơi chứa file SQLite (mặc định ./data)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('./db');
const auth = require('./auth');
const game = require('./game');
const G = require('../shared');

const PORT = Number(process.env.PORT) || 3100;
const HOST = process.env.HOST || '127.0.0.1';
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const ROOT = path.join(__dirname, '..');

const STATIC = [
  ['/shared/', path.join(ROOT, 'shared')],
  ['/fonts/', path.join(ROOT, 'node_modules', '@fontsource', 'be-vietnam-pro', 'files')],
  ['/', path.join(ROOT, 'public')],
];
const LIB = { '/lib/phaser.min.js': path.join(ROOT, 'node_modules', 'phaser', 'dist', 'phaser.min.js') };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

// Nhân vật đang chơi được giữ trong bộ nhớ, mỗi thay đổi đều ghi xuống SQLite ngay.
const players = new Map();
function getPlayer(userId) {
  let p = players.get(userId);
  if (!p) {
    p = store.loadPlayer(userId);
    if (p) { game.migrate(p); players.set(userId, p); }
  }
  return p;
}

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; media-src 'self' data: blob:; connect-src 'self'");
}

function send(res, status, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(body);
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

function validCredentials(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!/^[\p{L}\p{N}_]{3,20}$/u.test(username)) return [null, 'Tên đăng nhập 3–20 ký tự, chỉ gồm chữ, số và dấu gạch dưới.'];
  if (password.length < 6 || password.length > 100) return [null, 'Mật khẩu cần ít nhất 6 ký tự.'];
  return [{ username, password }, null];
}

async function api(req, res, url) {
  const token = cookies(req).ap_session;
  const session = auth.getSession(token);

  if (url === '/api/me' && req.method === 'GET') {
    if (!session) return send(res, 200, { user: null, registerOpen: auth.registerOpen() });
    return send(res, 200, { user: session.username, player: getPlayer(session.userId) });
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  // Chặn gửi form từ trang web khác (CSRF): chỉ nhận JSON
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
    return send(res, 415, { error: 'Cần gửi JSON.' });
  }
  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: 'Dữ liệu không hợp lệ.' }); }

  if (url === '/api/register') {
    if (!auth.registerOpen()) return send(res, 403, { error: 'Đã đóng đăng ký tài khoản mới.' });
    const [cred, err] = validCredentials(body);
    if (err) return send(res, 400, { error: err });
    const charName = String(body.charName || cred.username).trim().slice(0, 16) || cred.username;
    if (store.userByName(cred.username)) return send(res, 400, { error: 'Tên đăng nhập đã tồn tại.' });
    const userId = store.insertUser(cred.username, auth.hashPassword(cred.password));
    const p = G.newPlayer(charName);
    store.savePlayer(userId, p);
    const s = auth.createSession(userId);
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(s.token, s.maxAge) });
  }

  if (url === '/api/login') {
    const ip = clientIp(req);
    if (!auth.loginAllowed(ip)) return send(res, 429, { error: 'Sai quá nhiều lần, thử lại sau 10 phút.' });
    const username = String(body.username || '').trim();
    const user = store.userByName(username);
    if (!user || !auth.verifyPassword(String(body.password || ''), user.pass)) {
      auth.loginFailed(ip);
      return send(res, 401, { error: 'Sai tên đăng nhập hoặc mật khẩu.' });
    }
    const s = auth.createSession(user.id);
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(s.token, s.maxAge) });
  }

  if (url === '/api/logout') {
    auth.destroySession(token);
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  if (url === '/api/action') {
    if (!session) return send(res, 401, { error: 'Phiên đăng nhập đã hết, hãy đăng nhập lại.' });
    const p = getPlayer(session.userId);
    if (!p) return send(res, 404, { error: 'Không tìm thấy nhân vật.' });
    const backup = JSON.stringify(p);
    try {
      const events = game.handle(session.userId, p, body);
      store.savePlayer(session.userId, p);
      return send(res, 200, { ok: true, player: p, events });
    } catch (e) {
      // Lỗi giữa chừng thì trả nhân vật về trạng thái trước đó
      players.set(session.userId, JSON.parse(backup));
      if (e instanceof game.GameError) return send(res, 200, { ok: false, error: e.message, player: getPlayer(session.userId) });
      console.error(e);
      return send(res, 500, { error: 'Lỗi server.' });
    }
  }

  return send(res, 404, { error: 'Không tìm thấy.' });
}

function serveStatic(req, res, url) {
  let file = LIB[url];
  if (!file) {
    for (const [prefix, dir] of STATIC) {
      if (!url.startsWith(prefix)) continue;
      let rel = decodeURIComponent(url.slice(prefix.length)) || 'index.html';
      const full = path.normalize(path.join(dir, rel));
      if (!full.startsWith(dir + path.sep) && full !== dir) break;
      file = full;
      break;
    }
  }
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': url.startsWith('/lib/') || url.startsWith('/fonts/') ? 'public, max-age=604800' : 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  securityHeaders(res);
  const url = (req.url || '/').split('?')[0];
  if (url.startsWith('/api/')) {
    api(req, res, url).catch((e) => { console.error(e); send(res, 500, { error: 'Lỗi server.' }); });
  } else if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res, url);
  } else {
    res.writeHead(405); res.end();
  }
});

store.purgeSessions();
require('./codes').ensureFile();
setInterval(() => store.purgeSessions(), 3600 * 1000).unref();

server.listen(PORT, HOST, () => {
  console.log(`Thức Tỉnh đang chạy tại http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Dữ liệu lưu ở: ${store.DB_FILE}`);
});
