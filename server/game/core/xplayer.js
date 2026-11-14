'use strict';
/*
 * Sửa nhân vật của người KHÁC (giao dịch, chợ, thưởng đội...). Trước giờ mỗi hành động chỉ sửa nhân vật của
 * chính người gửi; ở đây một thao tác có thể sửa hai nhân vật cùng lúc, và người kia có thể đang offline.
 *
 * Quy tắc an toàn:
 *  - fn chạy ĐỒNG BỘ (không await bên trong) nên không hành động nào của người chơi chen vào giữa.
 *  - Nhân vật đang xử lý một hành động HTTP dở dang (cache.isBusy) thì chờ xong mới sửa, để lỗi + hoàn tác của
 *    hành động đó không vô tình xóa mất thay đổi của chúng ta.
 *  - Lỗi bất kỳ trong fn (kể cả GameError) → hoàn tác cả hai nhân vật, không bên nào bị đổi.
 *  - Sau khi đổi: đẩy bản vá cho client đang online (gói `patch` qua WebSocket) rồi lưu ngay.
 */
const cache = require('../../storage/cache');

let pusher = () => {};
function setPusher(fn) { pusher = fn; }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitIdle(ids, maxMs = 3000) {
  const t0 = Date.now();
  while (ids.some((id) => cache.isBusy(id))) {
    if (Date.now() - t0 > maxMs) throw new Error('Nhân vật đang bận, thử lại sau.');
    await sleep(5);
  }
}

// fn(p, ev) → kết quả. Trả về { result, events, patch, base, rev }
async function mutate(userId, fn) {
  const p = await cache.getPlayer(userId);
  if (!p) throw new Error('Không tìm thấy nhân vật.');
  await waitIdle([userId]);
  const token = cache.begin(userId);
  const events = [];
  let result, c;
  try { result = fn(p, events); c = cache.commit(userId); }
  catch (e) { cache.rollback(userId, token); cache.end(userId); throw e; }
  cache.end(userId);
  const out = { result, events, patch: c.patch, base: c.base, rev: c.rev };
  pusher(userId, out);
  await cache.saveNow(userId, c.strings);
  return out;
}

// fn(pA, pB, evA, evB) → kết quả; cả hai cùng đổi hoặc cùng không đổi
async function mutateTwo(idA, idB, fn) {
  if (idA === idB) throw new Error('Không thể tự giao dịch với chính mình.');
  const [pa, pb] = await Promise.all([cache.getPlayer(idA), cache.getPlayer(idB)]);
  if (!pa || !pb) throw new Error('Không tìm thấy nhân vật.');
  await waitIdle([idA, idB]);
  const ta = cache.begin(idA), tb = cache.begin(idB);
  const evA = [], evB = [];
  let result, ca, cb;
  try { result = fn(pa, pb, evA, evB); ca = cache.commit(idA); cb = cache.commit(idB); }
  catch (e) { cache.rollback(idA, ta); cache.rollback(idB, tb); cache.end(idA); cache.end(idB); throw e; }
  cache.end(idA); cache.end(idB);
  const outA = { result, events: evA, patch: ca.patch, base: ca.base, rev: ca.rev };
  const outB = { result, events: evB, patch: cb.patch, base: cb.base, rev: cb.rev };
  pusher(idA, outA); pusher(idB, outB);
  await Promise.all([cache.saveNow(idA, ca.strings), cache.saveNow(idB, cb.strings)]);
  return [outA, outB];
}

module.exports = { mutate, mutateTwo, setPusher };
