/*
 * Hằng số nhiệm vụ hằng ngày / hằng tuần.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Nhiệm vụ hằng ngày (bảng nhiệm vụ Hiệp Hội)
  // Mỗi ngày 3 nhiệm vụ, làm mới lúc 0 giờ (giờ Việt Nam). Xong cả 3 nhận thêm thưởng.
  // KHÔNG có sách kỹ năng ở đây: sách kỹ năng chỉ đến từ nhiệm vụ tuần (xem WEEKLY_BOOKS bên dưới).
  const DAILY_COUNT = 3;
  // 6 đá/ngày (tăng từ 2) để vòng lặp ngày có giá trị thật khi nâng cấp +10 trở đi.
  // Vẫn KHÔNG cho sách kỹ năng ở daily — sách chỉ đến từ mốc trùm tuần (xem WEEKLY_BOOKS).
  const DAILY_BONUS = { stones: 6, items: [] };

  // ---------------------------------------------------------------- Nhiệm vụ hằng tuần
  const WEEKLY_KILLS = 200;
  const WEEKLY_BOSSES = 5;
  // Mỗi tuần nhận được ĐÚNG 1 cuốn sách kỹ năng, từ mốc hạ trùm. Hai mốc tuần không cộng dồn sách.
  const WEEKLY_BOOKS = 1;

  Object.assign(G, { DAILY_COUNT, DAILY_BONUS, WEEKLY_KILLS, WEEKLY_BOSSES, WEEKLY_BOOKS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
