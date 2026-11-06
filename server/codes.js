'use strict';
/*
 * Mã quà tặng, lưu trong PostgreSQL (bảng gift_codes + gift_redemptions).
 *
 * Mỗi mã: { code, note, rewards, maxUses, expires }
 *   rewards: { unlockClass: 'toan_nang', gold: 1000, skillPoints: 2, items: [["da_cuong_hoa", 5]] }
 *   maxUses: giới hạn tổng số lượt (null = không giới hạn)
 *   expires: mốc thời gian hết hạn (null = không hết hạn)
 *
 * Mỗi tài khoản dùng mỗi mã một lần. Tạo/sửa mã bằng server/tools/giftcode.js.
 */
const store = require('./db');

const normalize = (c) => String(c || '').trim().toUpperCase();

async function redeem(userId, code) {
  const key = normalize(code);
  if (!key) return { ok: false, error: 'not_found', message: 'Mật mã không đúng.' };

  const claimed = await store.claimGiftCode(userId, key);
  if (claimed.duplicate) return { ok: false, error: 'used', message: 'Bạn đã dùng mật mã này rồi.' };
  if (claimed.rewards) return { ok: true, rewards: claimed.rewards };

  // Không giành được lượt: xem mã có thật không để báo đúng lý do
  const meta = await store.giftCodeMeta(key);
  if (!meta) return { ok: false, error: 'not_found', message: 'Mật mã không đúng.' };
  if (meta.expires && Number(meta.expires) <= Date.now()) {
    return { ok: false, error: 'expired', message: 'Mật mã này đã hết hạn.' };
  }
  if (meta.max_uses !== null && Number(meta.uses) >= Number(meta.max_uses)) {
    return { ok: false, error: 'exhausted', message: 'Mật mã này đã hết lượt sử dụng.' };
  }
  return { ok: false, error: 'used', message: 'Bạn đã dùng mật mã này rồi.' };
}

module.exports = {
  normalize,
  redeem,
  release: (userId, code) => store.releaseGiftCode(userId, normalize(code)),
  list: () => store.listGiftCodes(),
  add: (gift) => store.upsertGiftCode(gift),
  remove: (code) => store.deleteGiftCode(normalize(code)),
};
