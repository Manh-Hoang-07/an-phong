'use strict';
// Xem trạng thái quái đã lưu: node server/tools/check/peek-mob-state.js [mapId]
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'anphong',
});
const mapId = process.argv[2] || null;
(async () => {
  const { rows } = mapId
    ? await pool.query('SELECT map_id, data, updated FROM mob_state WHERE map_id = $1', [mapId])
    : await pool.query('SELECT map_id, data, updated FROM mob_state ORDER BY map_id');
  if (!rows.length) { console.log('(chưa có bản ghi nào)'); return pool.end(); }
  for (const r of rows) {
    console.log(`\n${r.map_id} — ${Object.keys(r.data).length} con, cập nhật ${new Date(Number(r.updated)).toLocaleString('vi-VN')}`);
    for (const [k, v] of Object.entries(r.data)) {
      console.log(`  ${k.padEnd(28)} hp ${String(v.hp).padStart(7)}/${String(v.mh).padEnd(7)} ${v.al ? 'sống' : 'chết'}  chết ${v.d} lần${v.en ? '  [nổi giận]' : ''}`);
    }
  }
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
