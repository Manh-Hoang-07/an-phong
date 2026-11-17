/*
 * Kỳ Nguyên · Sát Kiếp — mốc cấp 30, giá 90 Linh Ngọc.
 *
 * Cứ 5 đòn đánh trúng thì đòn thứ 5 gây thêm 35% sát thương. Đếm riêng theo từng mục tiêu,
 * đổi mục tiêu thì đếm lại từ đầu (fx.kind 'everyNth').
 *
 * File này chỉ khai báo DỮ LIỆU. Việc dựng ITEMS, catalog và map save cũ nằm ở index.js cùng thư mục.
 */
(function (G) {
  'use strict';

  (G.KY_NGUYEN_PARTS = G.KY_NGUYEN_PARTS || []).push({
    id: 'kn_sat_kiep', name: 'Kỳ Nguyên · Sát Kiếp', level: 30, price: 90,
    stats: { atk: 22, crit: 5 },
    fx: { kind: 'everyNth', n: 5, mult: 1.35 },
    fxText: 'Sát Kiếp: cứ 5 đòn đánh trúng thì đòn thứ 5 gây thêm 35% sát thương. Đếm riêng theo từng mục tiêu, đổi mục tiêu thì đếm lại từ đầu.',
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
