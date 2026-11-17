/*
 * Tuyệt Phẩm — hằng số và nhận diện.
 *
 * Cấp cố định để engine tính chỉ số. KHÔNG phải cấp người chơi nâng.
 * `isTuyetPham` nhận diện theo cờ dữ liệu `superUlt` (giữ tên cờ cũ để save không vỡ).
 *
 * Nạp TRƯỚC ownership.js và costs.js.
 */
(function (G) {
  'use strict';

  const TUYET_PHAM_LEVEL = 1;
  const isTuyetPham = (id) => !!(G.SKILLS[id] && G.SKILLS[id].superUlt);

  Object.assign(G, { TUYET_PHAM_LEVEL, isTuyetPham });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
