'use strict';
/*
 * Lưu trạng thái quái xuống PostgreSQL để máu quái sống qua lần khởi động lại server.
 *
 * Luật: máu quái đã mất thì mất. Người chơi đăng xuất / đổi bản đồ / bỏ đi không làm quái hồi máu,
 * và server restart cũng vậy. Chỉ khi quái chết rồi hết giờ hồi sinh thì nó mới về đầy máu.
 *
 * Phạm vi lưu: chỉ những gì KHÔNG tự dựng lại được (máu, hệ số máu trùm, sống/chết, số lần chết,
 * mốc hồi sinh). Vị trí và mục tiêu thì tự nhiên: quái đi về chỗ xuất hiện, người chơi vào lại thì đánh tiếp.
 *
 * Ghi gộp: mỗi bản đồ tối đa một lần ghi mỗi SAVE_EVERY_MS (máu đổi liên tục, ghi từng đòn là quá tay).
 * Mất tối đa vài giây cuối nếu server sập đột ngột; lúc tắt bình thường thì flush() ghi hết.
 */
const store = require('../storage/db');

const SAVE_EVERY_MS = 5000;
const KEEP_DAYS = 30;          // bản đồ không ai đụng tới 30 ngày thì bỏ bản ghi (quái về đầy máu)

const loaded = new Map();      // mapId → state (đọc từ database lúc khởi động)
const pending = new Map();     // mapId → state (đang chờ ghi)
let timer = null;
let writing = null;

async function init() {
  const { rows } = await store.query('SELECT map_id, data FROM mob_state');
  for (const r of rows) if (r.data && typeof r.data === 'object') loaded.set(r.map_id, r.data);
  if (rows.length) console.log(`Đã đọc trạng thái quái của ${rows.length} bản đồ.`);
  timer = setInterval(() => { flush().catch((e) => console.error('Ghi trạng thái quái lỗi:', e.message)); }, SAVE_EVERY_MS);
  timer.unref();
  return loaded.size;
}

// Trạng thái đã lưu của một bản đồ (hoặc null). Chỉ đọc được sau init().
function get(mapId) {
  return loaded.get(mapId) || null;
}

// Đánh dấu bản đồ có máu / sống-chết vừa đổi, chờ ghi gộp
function markDirty(mapId, state) {
  pending.set(mapId, state);
}

// Ghi hết những gì đang chờ. Gọi định kỳ và lúc tắt server.
async function flush() {
  if (writing) return writing;          // lần ghi trước chưa xong thì thôi, lần sau ghi tiếp
  if (!pending.size) return;
  const batch = [...pending];
  pending.clear();
  const ids = [], datas = [];
  for (const [mapId, state] of batch) { ids.push(mapId); datas.push(JSON.stringify(state)); }
  writing = store.query(
    `INSERT INTO mob_state (map_id, data, updated)
     SELECT t.m, t.d::jsonb, $3::bigint FROM unnest($1::text[], $2::text[]) AS t(m, d)
     ON CONFLICT (map_id) DO UPDATE SET data = excluded.data, updated = excluded.updated`,
    [ids, datas, Date.now()],
  ).catch((e) => {
    // Ghi lỗi thì trả lại hàng đợi để lần sau thử lại (không mất trạng thái)
    for (const [mapId, state] of batch) if (!pending.has(mapId)) pending.set(mapId, state);
    throw e;
  }).finally(() => { writing = null; });
  return writing;
}

// Dọn bản ghi quá cũ (bản đồ lâu không ai vào). Quái ở đó coi như về đầy máu khi có người vào lại.
async function prune() {
  const { rowCount } = await store.query('DELETE FROM mob_state WHERE updated < $1', [Date.now() - KEEP_DAYS * 86400 * 1000]);
  return rowCount;
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { init, get, markDirty, flush, prune, stop, SAVE_EVERY_MS };
