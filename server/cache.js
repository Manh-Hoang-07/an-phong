'use strict';
/*
 * Bộ nhớ đệm trong tiến trình: phiên đăng nhập và nhân vật đang chơi.
 *
 * Mọi chỗ khác chỉ gọi qua các hàm ở đây. Sau này nếu chạy nhiều tiến trình / nhiều máy
 * thì chỉ cần thay phần bên trong module này bằng Redis, không phải sửa logic game.
 *
 * Phiên đăng nhập: giữ SESSION_TTL_MS (60 giây) rồi hỏi lại database. Vì vậy khóa tài khoản
 * hoặc đổi mật khẩu bằng công cụ dòng lệnh sẽ có hiệu lực với server đang chạy sau tối đa 60 giây.
 *
 * Nhân vật:
 *   - saveNow(userId): ghi ngay (dùng cho hành động có giá trị: nâng cấp, mua bán, nhận quà...).
 *   - markDirty(userId): chỉ đánh dấu, cứ FLUSH_MS ghi một lần (hạ quái, lưu vị trí).
 *     Server sập đột ngột thì mất tối đa FLUSH_MS tiến trình loại này; tắt bình thường
 *     (SIGTERM/SIGINT) thì flushAll() ghi hết trước khi thoát.
 *   - Nội dung không đổi so với lần ghi trước thì bỏ qua.
 *   - Các lần ghi của cùng một nhân vật chạy nối tiếp nhau, lần sau luôn mang dữ liệu mới nhất.
 *   - Cứ SNAPSHOT_EVERY_MS (30 phút chơi) kèm một bản chụp vào player_snapshots.
 *   - Không hoạt động IDLE_MS (15 phút) và đã ghi xong thì bỏ khỏi bộ nhớ.
 */
const store = require('./db');

const SESSION_TTL_MS = 60 * 1000;
const SESSION_MAX = 20000;
const FLUSH_MS = Number(process.env.FLUSH_MS) || 4000;
const IDLE_MS = 15 * 60 * 1000;
const SNAPSHOT_EVERY_MS = 30 * 60 * 1000;

// ---------------- Phiên đăng nhập ----------------
const sessions = new Map();   // token hash → { value: { userId, username, expires } | null, at }

async function getSession(hash) {
  const now = Date.now();
  const hit = sessions.get(hash);
  if (hit && now - hit.at < SESSION_TTL_MS) {
    return hit.value && hit.value.expires > now ? hit.value : null;
  }
  const row = await store.sessionByHash(hash);
  const value = row && !row.banned && row.expires > now
    ? { userId: row.user_id, username: row.username, expires: row.expires }
    : null;
  if (sessions.size >= SESSION_MAX) sessions.delete(sessions.keys().next().value);
  sessions.set(hash, { value, at: now });
  return value;
}

function dropSession(hash) { sessions.delete(hash); }

function dropUserSessions(userId) {
  for (const [hash, s] of sessions) if (s.value && s.value.userId === userId) sessions.delete(hash);
}

// ---------------- Nhân vật ----------------
const players = new Map();   // userId → entry
const loading = new Map();   // chống đọc trùng khi hai yêu cầu cùng tới lúc chưa có trong bộ nhớ
let migrate = (p) => p;
let onEvict = () => {};

function configure(opts) {
  if (opts.migrate) migrate = opts.migrate;
  if (opts.onEvict) onEvict = opts.onEvict;
}

async function getPlayer(userId) {
  const e = players.get(userId);
  if (e) { e.lastActive = Date.now(); return e.p; }
  let pending = loading.get(userId);
  if (!pending) {
    pending = store.loadPlayer(userId)
      .then((p) => {
        if (!p) return null;
        migrate(p);
        players.set(userId, {
          p, json: null, dirty: false, busy: 0,
          lastActive: Date.now(), lastSnapshot: 0, writing: Promise.resolve(),
        });
        return p;
      })
      .finally(() => loading.delete(userId));
    loading.set(userId, pending);
  }
  return pending;
}

// Thay nhân vật trong bộ nhớ (ví dụ trả về bản trước khi hành động bị lỗi)
function replacePlayer(userId, p) {
  const e = players.get(userId);
  if (!e) return;
  e.p = p;
  e.dirty = true;
}

// Đánh dấu đang xử lý hành động: lượt ghi định kỳ không ghi trạng thái dở dang
function begin(userId) { const e = players.get(userId); if (e) e.busy++; }
function end(userId) { const e = players.get(userId); if (e && e.busy > 0) e.busy--; }

function markDirty(userId) {
  const e = players.get(userId);
  if (e) e.dirty = true;
}

function write(userId, e) {
  const run = e.writing.then(async () => {
    const json = JSON.stringify(e.p);
    e.dirty = false;
    if (json === e.json) return;
    const now = Date.now();
    const snapshot = now - e.lastSnapshot >= SNAPSHOT_EVERY_MS ? 'auto' : null;
    try {
      await store.savePlayer(userId, json, snapshot);
      e.json = json;
      if (snapshot) e.lastSnapshot = now;
    } catch (err) {
      e.dirty = true;
      throw err;
    }
  });
  e.writing = run.catch(() => {});
  return run;
}

async function saveNow(userId) {
  const e = players.get(userId);
  if (e) await write(userId, e);
}

async function flush() {
  const jobs = [];
  for (const [userId, e] of players) {
    if (e.dirty && !e.busy) jobs.push(write(userId, e).catch((err) => console.error('Lưu nhân vật lỗi:', userId, err.message)));
  }
  await Promise.all(jobs);
}

async function flushAll() {
  const jobs = [];
  for (const [userId, e] of players) {
    jobs.push((e.dirty ? write(userId, e) : e.writing).catch((err) => console.error('Lưu nhân vật lỗi:', userId, err.message)));
  }
  await Promise.all(jobs);
}

function evictIdle() {
  const now = Date.now();
  for (const [userId, e] of players) {
    if (!e.dirty && !e.busy && now - e.lastActive > IDLE_MS) {
      players.delete(userId);
      onEvict(userId);
    }
  }
  for (const [hash, s] of sessions) if (now - s.at > SESSION_TTL_MS) sessions.delete(hash);
}

let timers = [];
function start() {
  timers.push(setInterval(() => { flush(); }, FLUSH_MS));
  timers.push(setInterval(evictIdle, 60 * 1000));
  for (const t of timers) t.unref();
}
function stop() { for (const t of timers) clearInterval(t); timers = []; }

module.exports = {
  configure, start, stop,
  getSession, dropSession, dropUserSessions,
  getPlayer, replacePlayer, begin, end, markDirty, saveNow, flush, flushAll,
  stats: () => ({ sessions: sessions.size, players: players.size }),
};
