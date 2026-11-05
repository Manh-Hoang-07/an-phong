/*
 * Hằng số nhiệm vụ hằng ngày / hằng tuần.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Nhiệm vụ hằng ngày (bảng nhiệm vụ Hiệp Hội)
  // Mỗi ngày 3 nhiệm vụ, làm mới lúc 0 giờ (giờ Việt Nam). Xong cả 3 nhận thêm thưởng.
  const DAILY_COUNT = 3;
  const DAILY_BONUS = { stones: 2, items: [['sach_ky_nang', 1]] };

  // ---------------------------------------------------------------- Nhiệm vụ hằng tuần
  const WEEKLY_KILLS = 200;
  const WEEKLY_BOSSES = 5;

  Object.assign(G, { DAILY_COUNT, DAILY_BONUS, WEEKLY_KILLS, WEEKLY_BOSSES });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
