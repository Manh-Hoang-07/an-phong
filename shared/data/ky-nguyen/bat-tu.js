/*
 * Kỳ Nguyên · Bất Tử — mốc cấp 10, giá 40 Linh Ngọc.
 *
 * Máu tụt xuống 0 thì không chết, giữ 1 máu trong 5 giây; hết 5 giây mà chưa hồi máu thì mới gục.
 * Hồi lại sau 60 giây. Không cần bấm gì — hiệu ứng tự chạy (fx.kind 'undying').
 *
 * File này chỉ khai báo DỮ LIỆU. Việc dựng ITEMS, catalog và map save cũ nằm ở index.js cùng thư mục.
 */
(function (G) {
  'use strict';

  (G.KY_NGUYEN_PARTS = G.KY_NGUYEN_PARTS || []).push({
    id: 'kn_bat_tu', name: 'Kỳ Nguyên · Bất Tử', level: 10, price: 40,
    stats: { hp: 120, def: 8 },
    fx: { kind: 'undying', dur: 5, cd: 60 },
    fxText: 'Bất Tử: máu tụt xuống 0 thì không chết, giữ nguyên 1 máu trong 5 giây. Hết 5 giây mà vẫn chưa hồi máu thì mới gục. Hồi lại sau 60 giây. Không cần bấm gì.',
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
