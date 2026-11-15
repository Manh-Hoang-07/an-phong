'use strict';
/*
 * Dọn cờ `arrive` còn sót trong dữ liệu người chơi cũ.
 *   node --env-file-if-exists=.env server/tools/ops/fix-arrive.js          (chạy thử, chỉ đếm)
 *   node --env-file-if-exists=.env server/tools/ops/fix-arrive.js --apply  (ghi thật)
 *
 * `arrive` là điểm tới của lần đổi bản đồ gần nhất, chỉ có nghĩa trong đúng phiên đó. Nếu nhân vật đã có
 * vị trí đứng thật (x/y) mà cờ này còn thì lần vào game sau client ném nhân vật về cổng thay vì đặt đúng
 * chỗ đã lưu. Server đã tự dọn khi nạp nhân vật (game/index.js migrate), script này dọn sẵn trong DB.
 *
 * Nên chạy khi server đã tắt: nếu server đang giữ nhân vật trong bộ nhớ, nó có thể ghi đè lại.
 */
const { Pool } = require('pg');

const APPLY = process.argv.includes('--apply');
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'anphong',
});

(async () => {
  // Chỉ những nhân vật đã có x/y (vị trí thật) mà vẫn còn cờ arrive
  const { rows } = await pool.query(
    `SELECT p.user_id, u.username, p.core->>'x' AS x, p.core->>'y' AS y, d.data->>'arrive' AS arrive
       FROM players p
       JOIN users u ON u.id = p.user_id
       JOIN player_data d ON d.user_id = p.user_id AND d.section = 'misc'
      WHERE p.core->>'x' IS NOT NULL AND p.core->>'y' IS NOT NULL
        AND d.data::jsonb ? 'arrive'
      ORDER BY p.user_id`);

  if (!rows.length) { console.log('Không có nhân vật nào cần dọn.'); await pool.end(); return; }

  console.log(`${rows.length} nhân vật có vị trí thật nhưng còn cờ arrive:`);
  for (const r of rows) console.log(`  user ${r.user_id} (${r.username}): x=${r.x} y=${r.y} arrive=${JSON.stringify(r.arrive)}`);

  if (!APPLY) {
    console.log('\nChạy thử. Thêm --apply để ghi thật.');
    await pool.end();
    return;
  }

  const res = await pool.query(
    `UPDATE player_data d
        SET data = (d.data::jsonb - 'arrive')::json
       FROM players p
      WHERE p.user_id = d.user_id AND d.section = 'misc'
        AND p.core->>'x' IS NOT NULL AND p.core->>'y' IS NOT NULL
        AND d.data::jsonb ? 'arrive'`);
  console.log(`\nĐã dọn cờ arrive của ${res.rowCount} nhân vật.`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
