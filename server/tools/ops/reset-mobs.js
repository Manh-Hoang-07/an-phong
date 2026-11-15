'use strict';
/*
 * Đặt lại trạng thái quái về như mới (đầy máu, còn sống) — dùng khi muốn "reset" quái của một bản đồ
 * hoặc toàn bộ, ví dụ sau khi chỉnh sửa dữ liệu quái hoặc sau khi thử nghiệm.
 *
 *   node server/tools/ops/reset-mobs.js            → xem đang lưu gì
 *   node server/tools/ops/reset-mobs.js hang       → xoá trạng thái của bản đồ hang (quái về đầy máu)
 *   node server/tools/ops/reset-mobs.js --all      → xoá trạng thái của mọi bản đồ
 *
 * Phải tắt server trước khi chạy, nếu không server đang giữ trạng thái trong bộ nhớ sẽ ghi đè lại.
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'anphong',
});

(async () => {
  const arg = process.argv[2];

  if (!arg) {
    const { rows } = await pool.query('SELECT map_id, data, updated FROM mob_state ORDER BY map_id');
    if (!rows.length) { console.log('Chưa có trạng thái quái nào được lưu (mọi quái đang đầy máu).'); return pool.end(); }
    console.log('Trạng thái quái đang lưu:\n');
    for (const r of rows) {
      const list = Object.entries(r.data);
      const dead = list.filter(([, v]) => !v.al).length;
      const hurt = list.filter(([, v]) => v.al && v.hp < v.mh).length;
      console.log(`  ${r.map_id.padEnd(20)} ${String(list.length).padStart(3)} con · ${hurt} bị thương · ${dead} đang chết · cập nhật ${new Date(Number(r.updated)).toLocaleString('vi-VN')}`);
    }
    console.log('\nXoá trạng thái của một bản đồ: node server/tools/ops/reset-mobs.js <mapId>');
    console.log('Xoá tất cả:                    node server/tools/ops/reset-mobs.js --all');
    return pool.end();
  }

  const all = arg === '--all';
  const { rowCount } = all
    ? await pool.query('DELETE FROM mob_state')
    : await pool.query('DELETE FROM mob_state WHERE map_id = $1', [arg]);
  console.log(all
    ? `Đã đặt lại quái của toàn bộ ${rowCount} bản đồ về đầy máu.`
    : (rowCount ? `Đã đặt lại quái của bản đồ ${arg} về đầy máu.` : `Bản đồ ${arg} không có trạng thái nào được lưu (quái đã đầy máu).`));
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
