'use strict';
// Dọn tài khoản test của phần kiểm tra vị trí: node --env-file-if-exists=.env server/tools/check/cleanup-pos-tests.js
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'anphong',
});
(async () => {
  const { rows } = await pool.query(
    `DELETE FROM users
      WHERE username LIKE 'postest_%' OR username LIKE 'arrivebug_%'
         OR username LIKE 'poslive_%' OR username LIKE 'posrestart_%'
      RETURNING username`);
  console.log(rows.length ? `Đã xoá ${rows.length} tài khoản test: ${rows.map((r) => r.username).join(', ')}` : 'Không có tài khoản test nào.');
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
