'use strict';
/* Dọn tài khoản test do check-snap-except.js tạo ra.
 *   node server/tools/ops/cleanup-snap-tests.js          → chỉ liệt kê
 *   node server/tools/ops/cleanup-snap-tests.js --apply  → xoá thật
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'pg'));

const APPLY = process.argv.includes('--apply');
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'anphong',
});

(async () => {
  const u = await pool.query(
    `SELECT id, username FROM users WHERE username LIKE $1 ORDER BY id`,
    ['snap\_%']
  );
  console.log(`Tài khoản test: ${u.rowCount}`);
  for (const r of u.rows) console.log(`  id=${r.id}  ${r.username}`);
  if (!u.rowCount) { await pool.end(); return; }

  if (!APPLY) {
    console.log('\n(chỉ liệt kê — thêm --apply để xoá)');
    await pool.end();
    return;
  }

  const ids = u.rows.map((r) => r.id);
  // players và player_data đều REFERENCES users(id) ON DELETE CASCADE, xoá users là đủ
  const us = await pool.query(`DELETE FROM users WHERE id = ANY($1)`, [ids]);
  console.log(`\nĐã xoá ${us.rowCount} tài khoản (nhân vật xoá theo CASCADE).`);

  const left = await pool.query(`SELECT count(*)::int AS c FROM users WHERE username LIKE $1`, ['snap\_%']);
  console.log(`Còn lại: ${left.rows[0].c}`);
  await pool.end();
})().catch((e) => { console.error('LỖI:', e.message); process.exit(1); });
