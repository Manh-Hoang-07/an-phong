'use strict';
/*
 * Lưu trữ bằng PostgreSQL (thư viện `pg`).
 *
 * Cấu hình, chọn một trong hai cách:
 *   DATABASE_URL=postgres://user:pass@127.0.0.1:5432/anphong
 * hoặc
 *   PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres PGPASSWORD=... PGDATABASE=anphong
 *
 * Toàn bộ dữ liệu (tài khoản, phiên đăng nhập, nhân vật, mã quà tặng, nhật ký) nằm trong
 * một database PostgreSQL duy nhất. Cấu trúc bảng được nâng cấp tự động bằng MIGRATIONS
 * bên dưới (bảng schema_migrations ghi lại bước nào đã chạy).
 */
const { Pool, types } = require('pg');
const sections = require('./sections');

// BIGINT (id, mốc thời gian) trả về dạng số thay vì chuỗi
types.setTypeParser(20, (v) => Number(v));

const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'anphong',
    };

const pool = new Pool({
  ...connection,
  max: Number(process.env.PGPOOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Một câu lệnh treo quá 5 giây thì hủy, không giữ kết nối mãi
  statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT) || 5000,
});

// Không để lỗi của một kết nối rảnh làm sập cả tiến trình
pool.on('error', (e) => console.error('Lỗi kết nối PostgreSQL:', e.message));

// Nhóm kết nối riêng cho lượt ghi định kỳ (hạ quái, vị trí): commit không chờ ghi đĩa
// (synchronous_commit = off). Server hay Postgres sập thì mất vài giây cuối, dữ liệu không hỏng.
// Hành động có giá trị (mua bán, nâng cấp...) vẫn đi qua `pool` ở trên, commit đồng bộ.
const lazyPool = new Pool({
  ...connection,
  max: Number(process.env.PGPOOL_LAZY_MAX) || 4,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT) || 5000,
  options: '-c synchronous_commit=off',
});
lazyPool.on('error', (e) => console.error('Lỗi kết nối PostgreSQL (ghi định kỳ):', e.message));

const DB_INFO = connection.connectionString
  ? connection.connectionString.replace(/:\/\/([^:/@]+):[^@]*@/, '://$1:***@')
  : `${connection.user}@${connection.host}:${connection.port}/${connection.database}`;

/*
 * Các bước nâng cấp cấu trúc bảng, chạy theo thứ tự, mỗi bước đúng một lần.
 * Muốn đổi cấu trúc: THÊM bước mới ở cuối, không sửa bước đã chạy.
 */
const MIGRATIONS = [
  // 1. Cấu trúc ban đầu (giống bản trước; database cũ đã có sẵn thì bỏ qua)
  `
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    pass TEXT NOT NULL,
    created BIGINT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON users (lower(username));

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

  CREATE TABLE IF NOT EXISTS players (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gift_codes (
    code TEXT PRIMARY KEY,
    note TEXT,
    rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
    max_uses INTEGER,
    uses INTEGER NOT NULL DEFAULT 0,
    expires BIGINT,
    created BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gift_redemptions (
    code TEXT NOT NULL REFERENCES gift_codes(code) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used BIGINT NOT NULL,
    PRIMARY KEY (code, user_id)
  );
  `,

  // 2. Lưu vết tài khoản, bản chụp nhân vật, tối ưu bảng players
  `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login BIGINT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

  ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created BIGINT;
  ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip TEXT;
  ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
  CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires);

  -- Nhật ký tài khoản: đăng ký, đăng nhập (đúng/sai), đăng xuất, đổi mật khẩu, khóa/mở khóa.
  -- Xóa tài khoản thì nhật ký vẫn giữ (user_id thành NULL, còn lại username).
  CREATE TABLE IF NOT EXISTS auth_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username TEXT,
    event TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    detail TEXT,
    at BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS auth_log_user_at_idx ON auth_log (user_id, at DESC);
  CREATE INDEX IF NOT EXISTS auth_log_at_idx ON auth_log (at);

  -- Bản chụp nhân vật để tra cứu / khôi phục khi người chơi báo mất đồ
  CREATE TABLE IF NOT EXISTS player_snapshots (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSON NOT NULL,
    reason TEXT NOT NULL,
    at BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS player_snapshots_user_at_idx ON player_snapshots (user_id, at DESC);

  -- Nhân vật lưu dạng JSON: tra cứu được bằng SQL (data->>'level'), giữ nguyên thứ tự khóa
  -- như lúc ghi (JSONB sẽ tự sắp xếp lại khóa) và ghi nhanh hơn JSONB.
  -- fillfactor 80: chừa chỗ trống để cập nhật tại chỗ (HOT), bảng đỡ phình.
  -- Bảng bị cập nhật liên tục nên cho autovacuum dọn sớm hơn mặc định.
  ALTER TABLE players ALTER COLUMN data TYPE JSON USING data::json;
  ALTER TABLE players SET (fillfactor = 80,
    autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.05);
  `,

  // 3. Chia nhân vật thành section (xem server/sections.js).
  //    players: phần nóng (core JSON) + vài cột thật. player_data: mỗi section một dòng.
  //    Chỉ index `level` (đổi hiếm). KHÔNG index exp / gold / map: đổi mỗi lần hạ quái,
  //    index sẽ chặn cập nhật tại chỗ (HOT) và làm bảng phình.
  `
  ALTER TABLE players ALTER COLUMN data DROP NOT NULL;   -- tạm, bước 5 sẽ bỏ hẳn cột này
  ALTER TABLE players ADD COLUMN IF NOT EXISTS core JSON;
  ALTER TABLE players ADD COLUMN IF NOT EXISTS level INTEGER;
  ALTER TABLE players ADD COLUMN IF NOT EXISTS exp BIGINT;
  ALTER TABLE players ADD COLUMN IF NOT EXISTS gold BIGINT;
  ALTER TABLE players ADD COLUMN IF NOT EXISTS map TEXT;
  ALTER TABLE players ADD COLUMN IF NOT EXISTS school TEXT;
  ALTER TABLE players ADD COLUMN IF NOT EXISTS "rank" TEXT;
  ALTER TABLE players ADD COLUMN IF NOT EXISTS ver BIGINT NOT NULL DEFAULT 0;
  CREATE INDEX IF NOT EXISTS players_level_idx ON players (level);

  CREATE TABLE IF NOT EXISTS player_data (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    ver BIGINT NOT NULL DEFAULT 1,
    data JSON NOT NULL,
    updated BIGINT NOT NULL,
    PRIMARY KEY (user_id, section)
  ) WITH (fillfactor = 80, autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.05);
  `,

  // 4. Chuyển nhân vật cũ (players.data) sang section. Mỗi nhân vật được kiểm tra "tách rồi ghép lại
  //    phải giống hệt bản gốc" trước khi xóa players.data; sai một người là hủy cả bước (ROLLBACK).
  async (client) => {
    const { isDeepStrictEqual } = require('util');
    const sections = require('./sections');
    let last = 0, total = 0;
    for (;;) {
      const { rows } = await client.query(
        `SELECT user_id, data::text AS data FROM players
          WHERE user_id > $1 AND core IS NULL AND data IS NOT NULL ORDER BY user_id LIMIT 200`, [last]);
      if (!rows.length) break;
      for (const r of rows) {
        last = r.user_id;
        const orig = JSON.parse(r.data);
        const strings = sections.stringifySections(orig);
        const back = sections.assemble(Object.fromEntries(Object.entries(strings).map(([k, v]) => [k, JSON.parse(v)])));
        if (!isDeepStrictEqual(back, JSON.parse(JSON.stringify(orig)))) {
          throw new Error(`Chuyển nhân vật #${r.user_id} sang section không khớp dữ liệu gốc, hủy nâng cấp.`);
        }
        const [sql, params] = buildSave(r.user_id, strings, sections.coreColumns(orig), null, null);
        await client.query(sql, params);
        await client.query('UPDATE players SET data = NULL WHERE user_id = $1', [r.user_id]);
        total++;
      }
    }
    if (total) console.log(`Đã chuyển ${total} nhân vật sang cấu trúc section.`);
  },

  // 5. Dữ liệu nhân vật đã nằm hết trong core + player_data, bỏ cột JSON cũ (không còn đường đọc dữ liệu kiểu cũ).
  //    Muốn quay lại bản trước: khôi phục từ file `npm run backup`.
  `ALTER TABLE players DROP COLUMN IF EXISTS data;`,
];

/*
 * Câu lệnh ghi nhân vật: một câu duy nhất (nên hoặc đổi hết, hoặc không đổi gì).
 *   strings:  { tên section: chuỗi JSON } của các section CẦN ghi ('core' → bảng players, còn lại → player_data)
 *   cols:     cột thật của players (khi có section core), xem sections.coreColumns
 *   snapshot: chuỗi JSON của cả nhân vật + lý do, hoặc null
 */
function buildSave(userId, strings, cols, snapshotJson, snapshotReason, now = Date.now()) {
  const names = [], datas = [];
  for (const [name, json] of Object.entries(strings)) {
    if (name === 'core') continue;
    names.push(name);
    datas.push(json);
  }
  const core = strings.core !== undefined ? strings.core : null;
  const c = cols || {};
  const sql = `
    WITH c AS (
      INSERT INTO players (user_id, core, level, exp, gold, map, school, "rank", updated, ver)
      SELECT $1::bigint, $2::text::json, $3::int, $4::bigint, $5::bigint, $6::text, $7::text, $8::text, $9::bigint, 1
       WHERE $2::text IS NOT NULL
      ON CONFLICT (user_id) DO UPDATE
        SET core = excluded.core, level = excluded.level, exp = excluded.exp, gold = excluded.gold,
            map = excluded.map, school = excluded.school, "rank" = excluded."rank",
            updated = excluded.updated, ver = players.ver + 1
      RETURNING 1
    ), s AS (
      INSERT INTO player_data (user_id, section, data, ver, updated)
      SELECT $1::bigint, t.s, t.d::json, 1, $9::bigint FROM unnest($10::text[], $11::text[]) AS t(s, d)
      ON CONFLICT (user_id, section) DO UPDATE
        SET data = excluded.data, ver = player_data.ver + 1, updated = excluded.updated
      RETURNING 1
    )
    INSERT INTO player_snapshots (user_id, data, reason, at)
    SELECT $1::bigint, $12::text::json, $13::text, $9::bigint WHERE $12::text IS NOT NULL`;
  return [sql, [userId, core, c.level ?? null, c.exp ?? null, c.gold ?? null, c.map ?? null, c.school ?? null,
    c.rank ?? null, now, names, datas, snapshotJson, snapshotReason]];
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL statement_timeout = 0');
    // Hai tiến trình cùng khởi động thì chỉ một bên chạy migration
    await client.query('SELECT pg_advisory_xact_lock(724100)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY, applied BIGINT NOT NULL)`);
    const { rows } = await client.query('SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations');
    for (let v = rows[0].v + 1; v <= MIGRATIONS.length; v++) {
      const step = MIGRATIONS[v - 1];
      if (typeof step === 'function') await step(client);
      else await client.query(step);
      await client.query('INSERT INTO schema_migrations (version, applied) VALUES ($1, $2)', [v, Date.now()]);
      console.log(`Đã nâng cấp cấu trúc database lên bản ${v}.`);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

let initPromise = null;
// Chạy migration; gọi lại nhiều lần cũng an toàn (chỉ chạy một lần)
function init() {
  if (!initPromise) {
    initPromise = migrate().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

async function query(text, params) {
  await init();
  return pool.query(text, params);
}

// Chạy fn(client) trong một transaction
async function tx(fn) {
  await init();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

const SNAPSHOT_KEEP = Number(process.env.SNAPSHOT_KEEP) || 20;
const AUTH_LOG_DAYS = Number(process.env.AUTH_LOG_DAYS) || 90;

module.exports = {
  DB_INFO,
  init,
  close: () => Promise.all([pool.end(), lazyPool.end()]),

  async countUsers() {
    const { rows } = await query('SELECT COUNT(*)::bigint AS n FROM users');
    return Number(rows[0].n);
  },

  async userByName(name) {
    const { rows } = await query(
      'SELECT id, username, pass, created, banned, ban_reason, last_login, last_ip FROM users WHERE lower(username) = lower($1)', [name]);
    return rows[0] || null;
  },

  /*
   * Đăng ký trong một transaction: tạo tài khoản + nhân vật + phiên đăng nhập.
   * Trả về id tài khoản, hoặc null nếu tên đã có người dùng (kể cả khi hai người đăng ký cùng lúc).
   */
  async registerUser(name, pass, player, session) {
    return tx(async (c) => {
      const now = Date.now();
      const { rows } = await c.query(
        `INSERT INTO users (username, pass, created, last_login, last_ip) VALUES ($1, $2, $3, $3, $4)
         ON CONFLICT ((lower(username))) DO NOTHING RETURNING id`, [name, pass, now, session.ip]);
      if (!rows.length) return null;
      const id = rows[0].id;
      const [sql, params] = buildSave(id, sections.stringifySections(player), sections.coreColumns(player), null, null, now);
      await c.query(sql, params);
      await c.query(
        'INSERT INTO sessions (token_hash, user_id, expires, created, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
        [session.hash, id, session.expires, now, session.ip, session.userAgent]);
      return id;
    });
  },

  async insertSession({ hash, userId, expires, ip, userAgent }) {
    await query(
      'INSERT INTO sessions (token_hash, user_id, expires, created, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
      [hash, userId, expires, Date.now(), ip, userAgent]);
  },

  async touchLogin(userId, ip) {
    await query('UPDATE users SET last_login = $2, last_ip = $3 WHERE id = $1', [userId, Date.now(), ip]);
  },

  async sessionByHash(hash) {
    const { rows } = await query(
      `SELECT s.user_id, s.expires, u.username, u.banned
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1`, [hash]);
    return rows[0] || null;
  },

  async deleteSession(hash) {
    await query('DELETE FROM sessions WHERE token_hash = $1', [hash]);
  },

  async deleteUserSessions(userId) {
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  },

  async setPassword(userId, pass) {
    await query('UPDATE users SET pass = $1 WHERE id = $2', [pass, userId]);
  },

  async setBanned(userId, banned, reason = null) {
    await query('UPDATE users SET banned = $2, ban_reason = $3 WHERE id = $1', [userId, banned, banned ? reason : null]);
  },

  async logAuth({ userId = null, username = null, event, ip = null, userAgent = null, detail = null }) {
    await query(
      'INSERT INTO auth_log (user_id, username, event, ip, user_agent, detail, at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, username, event, ip, userAgent ? String(userAgent).slice(0, 300) : null, detail, Date.now()]);
  },

  async authLog(userId, limit = 30) {
    const { rows } = await query(
      'SELECT event, ip, user_agent, detail, at FROM auth_log WHERE user_id = $1 ORDER BY at DESC LIMIT $2', [userId, limit]);
    return rows;
  },

  /*
   * Đọc nhân vật bằng một truy vấn: phần core (bảng players) + các section (bảng player_data).
   * Trả về { p, strings } (strings: chuỗi JSON đúng như đang lưu, để cache so sánh biết section nào đổi),
   * hoặc null nếu không có nhân vật.
   */
  async loadPlayerParts(userId) {
    const { rows } = await query(
      `SELECT 'core' AS section, core::text AS data FROM players WHERE user_id = $1 AND core IS NOT NULL
       UNION ALL
       SELECT section, data::text FROM player_data WHERE user_id = $1`, [userId]);
    if (!rows.length) return null;
    const strings = {}, parts = {};
    for (const r of rows) {
      if (!sections.NAMES.includes(r.section)) continue;
      strings[r.section] = r.data;
      parts[r.section] = JSON.parse(r.data);
    }
    if (!parts.core) return null;
    return { p: sections.assemble(parts), strings };
  },

  async loadPlayer(userId) {
    const r = await module.exports.loadPlayerParts(userId);
    return r ? r.p : null;
  },

  /*
   * Ghi các section ĐÃ ĐỔI của một nhân vật (một câu lệnh, một giao dịch).
   *   strings:  { tên section: chuỗi JSON }, chỉ gồm section cần ghi
   *   opts.cols:      cột thật của players (bắt buộc khi strings có 'core')
   *   opts.snapshot:  { json, reason } kèm một bản chụp cả nhân vật vào player_snapshots
   *   opts.lazy:      true → dùng nhóm kết nối commit không chờ đĩa (chỉ cho lượt ghi định kỳ)
   */
  async savePlayerParts(userId, strings, opts = {}) {
    await init();
    const snap = opts.snapshot || {};
    const [sql, params] = buildSave(userId, strings, opts.cols, snap.json || null, snap.reason || null);
    await (opts.lazy ? lazyPool : pool).query(sql, params);
  },

  // Ghi cả nhân vật (công cụ quản trị, khôi phục bản chụp). Ghi đủ mọi section để section rỗng cũng bị xóa dữ liệu thừa.
  async savePlayerFull(userId, player, snapshotReason = null) {
    const strings = sections.stringifySections(player);
    await module.exports.savePlayerParts(userId, strings, {
      cols: sections.coreColumns(player),
      snapshot: snapshotReason ? { json: JSON.stringify(player), reason: snapshotReason } : null,
    });
  },

  async listSnapshots(userId, limit = SNAPSHOT_KEEP) {
    const { rows } = await query(
      `SELECT id, reason, at, data->>'level' AS level, data->>'gold' AS gold, data->>'map' AS map
         FROM player_snapshots WHERE user_id = $1 ORDER BY at DESC LIMIT $2`, [userId, limit]);
    return rows;
  },

  async snapshotById(userId, id) {
    const { rows } = await query('SELECT data, at FROM player_snapshots WHERE user_id = $1 AND id = $2', [userId, id]);
    return rows[0] || null;
  },

  // Dọn định kỳ: phiên hết hạn, nhật ký quá cũ, bản chụp vượt quá số lượng giữ lại
  async maintenance() {
    const now = Date.now();
    const s = await query('DELETE FROM sessions WHERE expires < $1', [now]);
    const l = await query('DELETE FROM auth_log WHERE at < $1', [now - AUTH_LOG_DAYS * 86400 * 1000]);
    const p = await query(
      `DELETE FROM player_snapshots WHERE id IN (
         SELECT id FROM (
           SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY at DESC, id DESC) AS rn FROM player_snapshots
         ) t WHERE rn > $1)`, [SNAPSHOT_KEEP]);
    return { sessions: s.rowCount, authLog: l.rowCount, snapshots: p.rowCount };
  },

  /*
   * Thử dùng mã quà tặng. Trả về:
   *   { rewards }            -> giành được lượt, dùng rewards để phát quà
   *   { rewards: null }      -> không giành được (hết lượt, hết hạn, không có mã)
   *   { duplicate: true }    -> tài khoản này đã dùng mã này rồi
   * Toàn bộ nằm trong một câu lệnh nên hoặc cùng thành công, hoặc cùng không đổi gì.
   */
  async claimGiftCode(userId, code) {
    try {
      const { rows } = await query(
        `WITH claim AS (
           UPDATE gift_codes SET uses = uses + 1
            WHERE code = $1
              AND (max_uses IS NULL OR uses < max_uses)
              AND (expires IS NULL OR expires > $3)
            RETURNING rewards
         ), redeemed AS (
           INSERT INTO gift_redemptions (code, user_id, used)
           SELECT $1, $2, $3 FROM claim
           RETURNING 1
         )
         SELECT rewards FROM claim`, [code, userId, Date.now()]);
      if (!rows.length) return { rewards: null, duplicate: false };
      return { rewards: rows[0].rewards, duplicate: false };
    } catch (e) {
      if (e.code === '23505') return { rewards: null, duplicate: true };   // đã dùng rồi
      throw e;
    }
  },

  // Trả lại lượt khi phát quà không thành công (ví dụ túi đầy)
  async releaseGiftCode(userId, code) {
    const { rowCount } = await query('DELETE FROM gift_redemptions WHERE code = $1 AND user_id = $2', [code, userId]);
    if (rowCount) await query('UPDATE gift_codes SET uses = GREATEST(0, uses - 1) WHERE code = $1', [code]);
  },

  async giftCodeMeta(code) {
    const { rows } = await query('SELECT code, note, max_uses, uses, expires FROM gift_codes WHERE code = $1', [code]);
    return rows[0] || null;
  },

  async listGiftCodes() {
    const { rows } = await query(
      `SELECT code, note, rewards, max_uses, uses, expires, created
         FROM gift_codes ORDER BY created DESC, code`);
    return rows;
  },

  async upsertGiftCode({ code, note = null, rewards = {}, maxUses = null, expires = null }) {
    const { rows } = await query(
      `INSERT INTO gift_codes (code, note, rewards, max_uses, expires, created)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE
         SET note = excluded.note, rewards = excluded.rewards,
             max_uses = excluded.max_uses, expires = excluded.expires
       RETURNING code, note, rewards, max_uses, uses, expires`,
      [code, note, JSON.stringify(rewards), maxUses, expires, Date.now()]);
    return rows[0];
  },

  async deleteGiftCode(code) {
    const { rowCount } = await query('DELETE FROM gift_codes WHERE code = $1', [code]);
    return rowCount;
  },
};
