/*
 * Tuyệt Phẩm — mô tả cái giá, đọc từ đối tượng `cost` do data khai báo.
 *
 * Mỗi Tuyệt Phẩm có `cost: { type, ... }` trong shared/data/super-ults/. Hàm này chỉ dịch
 * cấu trúc đó thành câu tiếng Việt cho UI — không tự suy từ cờ rời nữa (tránh hai nguồn lệch).
 *
 * Các type: hp | mp_burn | skill_lock | roster | atk_zero.
 * Trả mảng mô tả ngắn; rỗng nếu chỉ tốn MP/thể lực như kỹ năng thường.
 */
(function (G) {
  'use strict';

  function tuyetPhamCosts(sk) {
    if (!sk || !sk.superUlt || !sk.cost) return [];
    const c = sk.cost;
    const out = [];
    if (c.type === 'hp') out.push(c.buaSaves ? 'mình về 0 máu (Bùa giữ 1 máu)' : 'mình về 0 máu');
    if (c.type === 'mp_burn') out.push(`đốt sạch năng lượng · phong ấn hồi năng lượng ${c.lockSec || 10}s`);
    if (c.type === 'skill_lock') out.push(`phong ấn mọi kỹ năng ${c.lockSec || 60}s`);
    if (c.type === 'roster') out.push('bộ sưu tập bóng ma mất trắng');
    if (c.type === 'atk_zero') out.push(`tấn công về 0 trong ${c.duration || 60}s`);
    return out;
  }

  Object.assign(G, { tuyetPhamCosts });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
