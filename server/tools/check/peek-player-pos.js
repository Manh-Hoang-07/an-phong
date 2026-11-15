'use strict';
// Xem vị trí và cờ arrive đã lưu của nhân vật: node server/tools/check/peek-player-pos.js
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
    `SELECT p.user_id, u.username, p.core->>'map' AS map, p.core->>'x' AS x, p.core->>'y' AS y,
            d.data->>'arrive' AS arrive
       FROM players p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN player_data d ON d.user_id = p.user_id AND d.section = 'misc'
      WHERE p.core IS NOT NULL
      ORDER BY p.user_id LIMIT 40`);
  console.log('user_id | username | map | x | y | arrive');
  console.log('--------|----------|-----|---|---|-------');
  for (const r of rows) {
    console.log(`${String(r.user_id).padEnd(7)} | ${String(r.username).padEnd(16)} | ${String(r.map).padEnd(12)} | ${String(r.x).padEnd(6)} | ${String(r.y).padEnd(6)} | ${r.arrive === null || r.arrive === undefined ? '(không có)' : JSON.stringify(r.arrive)}`);
  }
  const withArrive = rows.filter((r) => r.arrive !== null && r.arrive !== undefined);
  console.log(`\n${rows.length} nhân vật, ${withArrive.length} còn cờ arrive.`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
