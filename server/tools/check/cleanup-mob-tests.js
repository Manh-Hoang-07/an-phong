'use strict';
// Dọn tài khoản tạo ra bởi các bài kiểm tra quái: node server/tools/check/cleanup-mob-tests.js
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
    `DELETE FROM users WHERE username LIKE 'mobtest\\_%' OR username LIKE 'mobrestart\\_%' OR username LIKE 'mobdeath\\_%'
     RETURNING username`);
  console.log(`Đã xoá ${rows.length} tài khoản test${rows.length ? ': ' + rows.map((r) => r.username).join(', ') : ''}`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
