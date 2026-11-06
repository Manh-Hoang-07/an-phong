'use strict';
const crypto = require('crypto');
const { promisify } = require('util');
const store = require('./db');
const cache = require('./cache');

const SESSION_DAYS = 30;
// Bản bất đồng bộ: băm mật khẩu chạy trong thread pool, không chặn người chơi khác
const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

// Dùng khi tên đăng nhập không tồn tại: vẫn băm một lần để thời gian trả lời như nhau
const DUMMY = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;

async function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored || DUMMY).split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const test = await scrypt(password, salt, 64);
  const known = Buffer.from(hash, 'hex');
  return stored != null && known.length === test.length && crypto.timingSafeEqual(known, test);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Tạo token mới; ghi vào DB do bên gọi quyết định (đăng ký ghi trong transaction)
function newSession(userId, ctx = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    maxAge: SESSION_DAYS * 86400,
    hash: sha256(token),
    userId,
    expires: Date.now() + SESSION_DAYS * 86400 * 1000,
    ip: ctx.ip || null,
    userAgent: ctx.userAgent ? String(ctx.userAgent).slice(0, 300) : null,
  };
}

async function createSession(userId, ctx) {
  const s = newSession(userId, ctx);
  await store.insertSession(s);
  return s;
}

async function getSession(token) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  return cache.getSession(sha256(token));
}

async function destroySession(token) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return;
  const hash = sha256(token);
  cache.dropSession(hash);
  await store.deleteSession(hash);
}

// Ghi nhật ký tài khoản; lỗi ghi log không được làm hỏng đăng nhập
function log(entry) {
  store.logAuth(entry).catch((e) => console.error('Ghi nhật ký tài khoản lỗi:', e.message));
}

// Chỉ cho đăng ký khi chưa có tài khoản nào, trừ khi bật ALLOW_REGISTER=1.
// Game đưa lên internet thì người lạ không tự tạo tài khoản được.
let anyUser = false;
async function registerOpen() {
  if (process.env.ALLOW_REGISTER === '1') return true;
  if (!anyUser) anyUser = (await store.countUsers()) > 0;
  return !anyUser;
}

// Chống dò mật khẩu: tối đa 10 lần sai mỗi 10 phút cho mỗi IP
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map();
function loginAllowed(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.start > WINDOW_MS) return true;
  return a.count < 10;
}
function loginFailed(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.start > WINDOW_MS) attempts.set(ip, { start: now, count: 1 });
  else a.count++;
}
// Dọn các IP đã hết hạn chặn
setInterval(() => {
  const now = Date.now();
  for (const [ip, a] of attempts) if (now - a.start > WINDOW_MS) attempts.delete(ip);
}, WINDOW_MS).unref();

module.exports = {
  hashPassword, verifyPassword, newSession, createSession, getSession, destroySession,
  registerOpen, loginAllowed, loginFailed, log, sha256,
};
