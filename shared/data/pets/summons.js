/*
 * Linh thú của Triệu Hồi Sư: gọi bằng kỹ năng, không cần mã quà tặng.
 *
 * Nâng cấp kỹ năng tăng sức mạnh linh thú (xem skill th5).
 * hp / atk / def: hệ số loài nhân lên đường cong cấp; aspd: tốc đánh (>1 là nhanh hơn).
 */
(function (G) {
  'use strict';

  const SUMMONS = {
    // hp / atk / def: hệ số loài nhân lên đường cong cấp; aspd: tốc đánh (>1 là nhanh hơn)
    linh_soi: { name: 'Linh Sói', icon: '🐺', look: 'wolf', tint: 0x9fd8ff, hp: 1, atk: 1, def: 1, aspd: 1, desc: 'Cân bằng, nhanh nhẹn.' },
    linh_hac: { name: 'Linh Phong', icon: '🐝', look: 'insect', tint: 0xffe9a8, hp: 0.85, atk: 1.05, def: 0.8, aspd: 1.15, desc: 'Đánh nhanh nhưng mỏng máu.' },
    linh_than: { name: 'Linh Thằn', icon: '🦎', look: 'lizard', tint: 0xa8ffb0, hp: 1.25, atk: 0.95, def: 1.25, aspd: 1, desc: 'Khỏe, chuyên đỡ đòn.' },
    linh_ky: { name: 'Linh Hồ', icon: '🦊', look: 'fox', tint: 0xffe6f5, hp: 0.9, atk: 1.2, def: 0.9, aspd: 1, desc: 'Sát thương cao nhất.' },
  };

  Object.assign(G, { SUMMONS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
