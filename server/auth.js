'use strict';
const crypto = require('crypto');
const store = require('./db');

const SESSION_DAYS = 30;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored).split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, 'hex');
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 86400 * 1000;
  store.insertSession(sha256(token), userId, expires);
  return { token, maxAge: SESSION_DAYS * 86400 };
}

function getSession(token) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = store.sessionByHash(sha256(token));
  if (!row || row.expires < Date.now()) return null;
  return { userId: row.user_id, username: row.username };
}

function destroySession(token) {
  if (token) store.deleteSession(sha256(token));
}

// Chỉ cho đăng ký khi chưa có tài khoản nào, trừ khi bật ALLOW_REGISTER=1.
// Game đưa lên internet thì người lạ không tự tạo tài khoản được.
function registerOpen() {
  return process.env.ALLOW_REGISTER === '1' || store.countUsers() === 0;
}

// Chống dò mật khẩu: tối đa 10 lần sai mỗi 10 phút cho mỗi IP
const attempts = new Map();
function loginAllowed(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.start > 10 * 60 * 1000) return true;
  return a.count < 10;
}
function loginFailed(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.start > 10 * 60 * 1000) attempts.set(ip, { start: now, count: 1 });
  else a.count++;
}

module.exports = { hashPassword, verifyPassword, createSession, getSession, destroySession, registerOpen, loginAllowed, loginFailed };
