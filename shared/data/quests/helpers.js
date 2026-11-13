/*
 * Khung nhiệm vụ chính tuyến dùng chung.
 * Mỗi chương khai báo `const PART = [ { ... } ]` và tính thưởng bằng rw(cấp, loại, items, extra):
 *   loại: story (truyện, obj {}) | hunt (hạ / thu / gặp) | elite (tinh anh, thủ lĩnh) | boss (trùm)
 *   extra: gộp thêm vào reward (skillPoints, perk, schoolWeapon, craftWeapon, title...)
 * Thứ tự nạp: trước mọi file chapter*.js (xem shared/index.js và public/index.html).
 */
(function (G) {
  'use strict';
  const { expToNext } = G;

  // Phần thưởng theo cấp: kinh nghiệm theo tỉ lệ cấp, xu theo cấp; thêm đồ theo loại
  const KIND = { story: [0.05, 60], hunt: [0.09, 110], elite: [0.13, 150], boss: [0.3, 400] };
  function rw(level, kind, items, extra) {
    const [e, g] = KIND[kind];
    return Object.assign({ exp: Math.round(expToNext(level) * e), gold: level * g, items: items || [] }, extra || {});
  }

  Object.assign(G, { QUEST_REWARD_KIND: KIND, questReward: rw });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
