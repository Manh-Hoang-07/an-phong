/*
 * Kỳ Nguyên — đọc trạng thái sở hữu/bật của người chơi.
 *
 * Trạng thái: player.kyNguyen = { owned: [id], active: [id] }, active ⊆ owned.
 * `active` là nguồn duy nhất có tác dụng — tháo ra là mất chỉ số/hiệu ứng ngay.
 *
 * Nạp SAU data/ky-nguyen/index.js (cần G.ITEMS).
 */
(function (G) {
  'use strict';

  // Kỳ Nguyên đang bật: trả về danh sách định nghĩa, đã lọc id hợp lệ.
  function kyNguyenActive(player) {
    const st = player && player.kyNguyen;
    if (!st || !Array.isArray(st.active)) return [];
    const out = [];
    for (const id of st.active) {
      const def = G.ITEMS[id];
      if (def && def.kyNguyen) out.push(def);
    }
    return out;
  }

  Object.assign(G, { kyNguyenActive });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
