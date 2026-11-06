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
];

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
      await client.query(MIGRATIONS[v - 1]);
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
  close: () => pool.end(),

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
      await c.query('INSERT INTO players (user_id, data, updated) VALUES ($1, $2::json, $3)', [id, JSON.stringify(player), now]);
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

  async loadPlayer(userId) {
    const { rows } = await query('SELECT data FROM players WHERE user_id = $1', [userId]);
    return rows.length ? rows[0].data : null;
  },

  // json: chuỗi JSON của nhân vật (stringify sẵn để còn so sánh có thay đổi hay không).
  // snapshotReason: kèm một bản chụp vào player_snapshots trong cùng câu lệnh.
  async savePlayer(userId, json, snapshotReason = null) {
    const now = Date.now();
    if (snapshotReason) {
      await query(
        `WITH up AS (
           INSERT INTO players (user_id, data, updated) VALUES ($1, $2::json, $3)
           ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated
         )
         INSERT INTO player_snapshots (user_id, data, reason, at) VALUES ($1, $2::json, $4, $3)`,
        [userId, json, now, snapshotReason]);
    } else {
      await query(
        `INSERT INTO players (user_id, data, updated) VALUES ($1, $2::json, $3)
         ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated`,
        [userId, json, now]);
    }
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
