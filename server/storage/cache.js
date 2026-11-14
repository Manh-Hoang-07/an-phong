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
 *   - markDirty(userId): chỉ đánh dấu, mỗi nhân vật ghi tối đa FLUSH_MS (6 giây) một lần (hạ quái, lưu vị trí).
 *     Server sập đột ngột thì mất tối đa ~FLUSH_MS tiến trình loại này; tắt bình thường
 *     (SIGTERM/SIGINT) thì flushAll() ghi hết trước khi thoát.
 *   - Nhân vật chia thành section (server/storage/sections.js); mỗi lần ghi chỉ gửi section có JSON khác lần ghi trước.
 *     Không còn phải nhớ "action này đụng section nào": so sánh nội dung nên không thể sót thay đổi.
 *   - Lượt ghi định kỳ dùng nhóm kết nối commit không chờ đĩa; saveNow / tắt server commit đồng bộ.
 *   - Các lần ghi của cùng một nhân vật chạy nối tiếp nhau, lần sau luôn mang dữ liệu mới nhất.
 *   - Cứ SNAPSHOT_EVERY_MS (30 phút chơi) kèm một bản chụp cả nhân vật vào player_snapshots (chỉ khi có thay đổi).
 *   - Không hoạt động IDLE_MS (15 phút) và đã ghi xong thì bỏ khỏi bộ nhớ (chụp thêm một bản nếu còn thay đổi chưa chụp).
 */
const store = require('./db');
const sections = require('./sections');

const SESSION_TTL_MS = 60 * 1000;
const SESSION_MAX = 20000;
const FLUSH_MS = Number(process.env.FLUSH_MS) || 6000;      // mỗi nhân vật ghi định kỳ cách nhau ít nhất chừng này
const SCAN_MS = 1500;                                       // cứ chừng này quét một lần, lượt ghi dàn đều theo thời gian
const FLUSH_CONCURRENCY = 8;
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
    ? { userId: row.user_id, username: row.username, isAdmin: !!row.is_admin, expires: row.expires }
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
    pending = store.loadPlayerParts(userId)
      .then((r) => {
        if (!r) return null;
        const { p, strings } = r;
        migrate(p);
        // saved: chuỗi JSON từng section đúng như đang lưu trong DB, để chỉ ghi section nào đổi
        players.set(userId, {
          p, saved: strings, dirty: false, busy: 0, inflight: 0,
          // last: chuỗi JSON từng section sau hành động gần nhất (để biết hành động này đổi gì và hoàn tác khi lỗi)
          // rev: số thứ tự thay đổi, client dùng để biết có lỡ mất bản vá nào không
          last: sections.stringifySections(p), rev: 0,
          lastActive: Date.now(), lastSnapshot: 0, lastWrite: Date.now(), sinceSnap: false, writing: Promise.resolve(),
        });
        return p;
      })
      .finally(() => loading.delete(userId));
    loading.set(userId, pending);
  }
  return pending;
}

// Nhân vật đang xử lý một hành động dở dang (begin chưa end)
function isBusy(userId) { const e = players.get(userId); return !!(e && e.busy > 0); }

// Nhân vật đang nằm trong bộ nhớ (tức đang chơi hoặc vừa chơi xong chưa quá 15 phút)
function isLoaded(userId) { return players.has(userId); }

function getRev(userId) { const e = players.get(userId); return e ? e.rev : 0; }

// Đánh dấu đang xử lý hành động: lượt ghi định kỳ không ghi trạng thái dở dang.
// Trả về "mốc" (JSON từng section trước hành động) để hoàn tác nếu hành động lỗi giữa chừng.
function begin(userId) {
  const e = players.get(userId);
  if (!e) return null;
  e.busy++;
  return e.last;
}
function end(userId) { const e = players.get(userId); if (e && e.busy > 0) e.busy--; }

/*
 * Sau hành động: so từng section với trước đó.
 * Trả về { strings, base, rev, patch } — patch = { set: {khóa: giá trị mới}, del: [khóa đã xóa] } chỉ gồm
 * các section đã đổi (client ghép vào bản nhân vật nó đang giữ), hoặc patch = null nếu không đổi gì.
 */
function commit(userId) {
  const e = players.get(userId);
  if (!e) return null;
  const parts = sections.split(e.p);
  const strings = {};
  const base = e.rev;
  let set = null, del = null;
  for (const name of sections.NAMES) {
    const s = (strings[name] = JSON.stringify(parts[name]));
    if (s === e.last[name]) continue;
    set = set || {}; del = del || [];
    const after = parts[name];
    for (const k of Object.keys(JSON.parse(e.last[name]))) if (after[k] === undefined) del.push(k);
    for (const k of Object.keys(after)) if (after[k] !== undefined) set[k] = after[k];
  }
  e.last = strings;
  if (set) { e.dirty = true; e.rev++; }
  return { strings, base, rev: e.rev, patch: set ? { set, del } : null };
}

// Hành động lỗi giữa chừng: trả các section đã đổi về như lúc `begin` (mốc), giữ nguyên section không đổi.
// Trả về nhân vật sau khi hoàn tác.
function rollback(userId, token) {
  const e = players.get(userId);
  if (!e) return null;
  if (!token) return e.p;
  const parts = sections.split(e.p);
  const restored = {};
  let changed = false;
  for (const name of sections.NAMES) {
    if (JSON.stringify(parts[name]) !== token[name]) { restored[name] = JSON.parse(token[name]); changed = true; }
    else restored[name] = parts[name];
  }
  if (!changed) { e.last = token; return e.p; }
  e.p = sections.assemble(restored);
  e.last = token;
  e.dirty = true;
  e.rev++;
  return e.p;
}

function markDirty(userId) {
  const e = players.get(userId);
  if (e) e.dirty = true;
}

// Ghi các section đã đổi so với lần ghi trước (so sánh chuỗi JSON từng section, nên không bao giờ
// sót thay đổi dù action nào sửa `p`). lazy: lượt ghi định kỳ, commit không chờ đĩa.
function write(userId, e, { lazy = false, strings: known = null } = {}) {
  e.inflight++;
  const run = e.writing.then(async () => {
    const strings = known || sections.stringifySections(e.p);
    e.dirty = false;
    const changed = {};
    let n = 0;
    for (const name of sections.NAMES) {
      if (strings[name] !== e.saved[name]) { changed[name] = strings[name]; n++; }
    }
    if (!n) return;
    const now = Date.now();
    // Bản chụp cả nhân vật: tối đa mỗi SNAPSHOT_EVERY_MS, và chỉ khi có thay đổi
    const snapshot = now - e.lastSnapshot >= SNAPSHOT_EVERY_MS ? { json: JSON.stringify(e.p), reason: 'auto' } : null;
    try {
      await store.savePlayerParts(userId, changed, {
        cols: changed.core !== undefined ? sections.coreColumns(e.p) : undefined,
        snapshot, lazy,
      });
      Object.assign(e.saved, changed);
      e.lastWrite = now;
      if (snapshot) { e.lastSnapshot = now; e.sinceSnap = false; } else e.sinceSnap = true;
    } catch (err) {
      e.dirty = true;
      throw err;
    }
  }).finally(() => { e.inflight--; });
  e.writing = run.catch(() => {});
  return run;
}

// strings: JSON từng section vừa tính xong ở commit() (đỡ tính lại). Chỉ dùng khi ngay sau commit.
async function saveNow(userId, strings = null) {
  const e = players.get(userId);
  if (e) await write(userId, e, { strings });
}

// Chạy tối đa `limit` việc cùng lúc (không dồn hàng đợi kết nối làm quá hạn chờ)
async function runLimited(jobs, limit) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (i < jobs.length) await jobs[i++]();
  }));
}

// Quét định kỳ: chỉ ghi nhân vật đã đổi và quá FLUSH_MS kể từ lần ghi trước
async function flush() {
  const now = Date.now();
  const jobs = [];
  for (const [userId, e] of players) {
    if (e.dirty && !e.busy && now - e.lastWrite >= FLUSH_MS) {
      jobs.push(() => write(userId, e, { lazy: true }).catch((err) => console.error('Lưu nhân vật lỗi:', userId, err.message)));
    }
  }
  await runLimited(jobs, FLUSH_CONCURRENCY);
}

// Tắt server: ghi hết, commit đồng bộ
async function flushAll() {
  const jobs = [];
  for (const [userId, e] of players) {
    jobs.push(() => (e.dirty ? write(userId, e) : e.writing).catch((err) => console.error('Lưu nhân vật lỗi:', userId, err.message)));
  }
  await runLimited(jobs, FLUSH_CONCURRENCY);
}

function evictIdle() {
  const now = Date.now();
  for (const [userId, e] of players) {
    if (!e.dirty && !e.busy && !e.inflight && now - e.lastActive > IDLE_MS) {
      // Rời bộ nhớ: nếu có thay đổi chưa được chụp thì chụp một bản trước khi quên
      const json = e.sinceSnap ? JSON.stringify(e.p) : null;
      players.delete(userId);
      onEvict(userId);
      if (json) {
        store.savePlayerParts(userId, {}, { snapshot: { json, reason: 'logout' }, lazy: true })
          .catch((err) => console.error('Chụp nhân vật khi thoát lỗi:', userId, err.message));
      }
    }
  }
  for (const [hash, s] of sessions) if (now - s.at > SESSION_TTL_MS) sessions.delete(hash);
}

let timers = [];
function start() {
  timers.push(setInterval(() => { flush(); }, SCAN_MS));
  timers.push(setInterval(evictIdle, 60 * 1000));
  for (const t of timers) t.unref();
}
function stop() { for (const t of timers) clearInterval(t); timers = []; }

module.exports = {
  configure, start, stop,
  getSession, dropSession, dropUserSessions,
  getPlayer, getRev, isBusy, isLoaded, begin, end, commit, rollback, markDirty, saveNow, flushAll,
};
