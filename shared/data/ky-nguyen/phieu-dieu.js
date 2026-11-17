/*
 * Kỳ Nguyên · Phiêu Diêu — mốc cấp 50, giá 180 Linh Ngọc.
 *
 * 10% cơ hội né hoàn toàn một đòn đánh: không mất máu, không mất khiên, hiện chữ "Né"
 * (fx.kind 'dodge'). Kèm thể lực và hồi thể lực — món duy nhất trong 5 cái đụng tới thể lực.
 *
 * File này chỉ khai báo DỮ LIỆU. Việc dựng ITEMS, catalog và map save cũ nằm ở index.js cùng thư mục.
 */
(function (G) {
  'use strict';

  (G.KY_NGUYEN_PARTS = G.KY_NGUYEN_PARTS || []).push({
    id: 'kn_phiu_dieu', name: 'Kỳ Nguyên · Phiêu Diêu', level: 50, price: 180,
    stats: { speed: 20, def: 12, sta: 120, staRegen: 35 },
    fx: { kind: 'dodge', chance: 0.10 },
    fxText: 'Phiêu Diêu: 10% cơ hội né hoàn toàn một đòn đánh. Né được thì không mất máu, không mất khiên, hiện chữ "Né".',
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
