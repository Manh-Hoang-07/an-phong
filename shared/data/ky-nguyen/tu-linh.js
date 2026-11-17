/*
 * Kỳ Nguyên · Tụ Linh — mốc cấp 70, giá 320 Linh Ngọc.
 *
 * Kỹ năng gây thêm 14% sát thương, cộng thẳng vào sát thương kỹ năng ngoài điểm Tinh thần
 * (fx.kind 'skillPower'). Đây là món duy nhất trong 5 cái đụng tới sát thương kỹ năng.
 *
 * File này chỉ khai báo DỮ LIỆU. Việc dựng ITEMS, catalog và map save cũ nằm ở index.js cùng thư mục.
 */
(function (G) {
  'use strict';

  (G.KY_NGUYEN_PARTS = G.KY_NGUYEN_PARTS || []).push({
    id: 'kn_tu_linh', name: 'Kỳ Nguyên · Tụ Linh', level: 70, price: 320,
    stats: { mp: 270, cdr: 4, skill: 14 },
    fx: { kind: 'skillPower', mul: 0.14 },
    fxText: 'Tụ Linh: kỹ năng gây thêm 14% sát thương. Cộng thẳng vào sát thương kỹ năng, ngoài điểm Tinh thần.',
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
