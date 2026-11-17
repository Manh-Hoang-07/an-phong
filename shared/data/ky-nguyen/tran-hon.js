/*
 * Kỳ Nguyên · Trấn Hồn — mốc cấp 90, giá 500 Linh Ngọc.
 *
 * Mỗi khi hạ quái, hồi 4% máu tối đa và 4% năng lượng tối đa (fx.kind 'onKill').
 * Kèm tỉ lệ vàng và kinh nghiệm — món cuối, cũng là món hướng farm.
 *
 * File này chỉ khai báo DỮ LIỆU. Việc dựng ITEMS, catalog và map save cũ nằm ở index.js cùng thư mục.
 */
(function (G) {
  'use strict';

  (G.KY_NGUYEN_PARTS = G.KY_NGUYEN_PARTS || []).push({
    id: 'kn_tran_hon', name: 'Kỳ Nguyên · Trấn Hồn', level: 90, price: 500,
    stats: { goldfind: 22, expfind: 12, lifesteal: 3 },
    fx: { kind: 'onKill', hp: 0.04, mp: 0.04 },
    fxText: 'Trấn Hồn: mỗi khi hạ quái, hồi 4% máu tối đa và 4% năng lượng tối đa.',
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
