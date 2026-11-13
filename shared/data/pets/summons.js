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

  // Kỹ năng riêng của từng linh thú: mở khóa khi CẤP RIÊNG của linh thú đạt lv. Linh thú tự dùng kỹ năng mạnh nhất đang sẵn sàng.
  //   mp / sta: tiêu hao; cooldown (ms); range: tầm đánh; mult: hệ số sát thương;
  //   radius: đánh lan quanh mục tiêu; slow: làm chậm (giây); heal: hồi % máu tối đa cho chủ.
  const SUMMON_SKILLS = {
    linh_soi: [
      { id: 'soi_can', name: 'Cắn Xé', icon: '🦷', lv: 1, mp: 4, sta: 8, cooldown: 1800, range: 74, mult: 1.35, desc: 'Cắn mục tiêu gần nhất.' },
      { id: 'soi_vo', name: 'Vồ Mồi', icon: '🐾', lv: 10, mp: 8, sta: 14, cooldown: 3600, range: 115, mult: 1.9, slow: 1, desc: 'Vồ tới mục tiêu, làm chậm 1 giây.' },
      { id: 'soi_gam', name: 'Gầm Hống', icon: '🌟', lv: 25, mp: 14, sta: 20, cooldown: 6500, range: 150, mult: 1.2, radius: 140, slow: 2, desc: 'Tiếng gầm gây sát thương lan quanh mục tiêu, làm chậm.' },
      { id: 'soi_bay', name: 'Săn Mồi Bầy Đàn', icon: '🐺', lv: 40, mp: 22, sta: 28, cooldown: 9000, range: 150, mult: 3.2, heal: 0.03, desc: 'Đòn săn mồi chí tử, hồi 3% máu cho chủ.' },
    ],
    linh_hac: [
      { id: 'hac_chich', name: 'Châm Chích', icon: '📌', lv: 1, mp: 3, sta: 6, cooldown: 1300, range: 70, mult: 1.15, desc: 'Châm nhanh mục tiêu.' },
      { id: 'hac_doc', name: 'Vũ Điệu Độc', icon: '💫', lv: 10, mp: 9, sta: 12, cooldown: 4200, range: 120, mult: 1.0, radius: 120, slow: 2, desc: 'Cánh vỗ rải độc quanh mục tiêu, làm chậm.' },
      { id: 'hac_hut', name: 'Chích Hút Máu', icon: '🩸', lv: 25, mp: 14, sta: 18, cooldown: 6000, range: 90, mult: 2.0, heal: 0.04, desc: 'Chích mạnh, hút 4% máu về cho chủ.' },
      { id: 'hac_bay', name: 'Bầy Ong Cuồng Nộ', icon: '🐝', lv: 40, mp: 22, sta: 26, cooldown: 9000, range: 150, mult: 2.6, radius: 180, desc: 'Cả bầy ong ập xuống, sát thương lan rộng.' },
    ],
    linh_than: [
      { id: 'than_quat', name: 'Quất Đuôi', icon: '🦎', lv: 1, mp: 4, sta: 8, cooldown: 1900, range: 80, mult: 1.2, desc: 'Quất đuôi vào mục tiêu.' },
      { id: 'than_cao', name: 'Cào Xé', icon: '🐾', lv: 10, mp: 8, sta: 14, cooldown: 3800, range: 100, mult: 1.7, desc: 'Vuốt cào sát thương lớn.' },
      { id: 'than_tuong', name: 'Tường Thịt', icon: '🧱', lv: 25, mp: 14, sta: 20, cooldown: 7000, range: 120, mult: 1.1, radius: 150, slow: 3, desc: 'Dậm xuống đất, làm chậm mọi quái quanh mục tiêu.' },
      { id: 'than_chan', name: 'Địa Chấn Thằn Lằn', icon: '🌋', lv: 40, mp: 24, sta: 30, cooldown: 9500, range: 120, mult: 2.4, radius: 200, desc: 'Chấn động mặt đất, sát thương lan rộng.' },
    ],
    linh_ky: [
      { id: 'ky_vuot', name: 'Vuốt Hồ', icon: '🦊', lv: 1, mp: 4, sta: 8, cooldown: 1700, range: 74, mult: 1.5, desc: 'Vuốt nhanh vào mục tiêu.' },
      { id: 'ky_hoa', name: 'Hỏa Hồ', icon: '🔥', lv: 10, mp: 10, sta: 14, cooldown: 3800, range: 160, mult: 2.2, desc: 'Phun lửa vào mục tiêu từ xa.' },
      { id: 'ky_mi', name: 'Mị Hồn', icon: '💞', lv: 25, mp: 15, sta: 20, cooldown: 7000, range: 150, mult: 1.6, radius: 150, slow: 3, desc: 'Mê hoặc quái quanh mục tiêu, làm chậm.' },
      { id: 'ky_cuu', name: 'Cửu Vĩ Liệt Hỏa', icon: '☄️', lv: 40, mp: 26, sta: 30, cooldown: 10000, range: 170, mult: 3.4, radius: 220, desc: 'Chín đuôi cùng bừng lửa, sát thương lan rộng.' },
    ],
  };

  Object.assign(G, { SUMMONS, SUMMON_SKILLS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
