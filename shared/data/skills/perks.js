/*
 * Nội tại cốt truyện: nhận từ nhiệm vụ chính, cộng dồn suốt game.
 *
 * mul: nhân chỉ số; add: cộng chỉ số phẳng (vd cdr = giảm hồi chiêu %).
 */
(function (G) {
  'use strict';

  // Nội tại cốt truyện: nhận từ nhiệm vụ chính, cộng dồn suốt game
  const PERKS = {
    y_chi_thay: {
      icon: '🕯️', name: 'Ý Chí Thầy Truyền',
      desc: 'Tinh thần Hội trưởng Khải truyền lại: máu và phòng thủ +8%.',
      mul: { hp: 1.08, def: 1.08 },
    },
    nhan_thuc_ky_sinh: {
      icon: '👁️', name: 'Nhận Thức Ký Sinh',
      desc: 'Hiểu bản chất Hệ thống: sát thương lên trùm +10%, hồi chiêu -5%.',
      add: { boss: 10, cdr: 5 },
    },
    lien_minh: {
      icon: '🤝', name: 'Liên Minh',
      desc: 'Sức mạnh của cả liên minh: toàn bộ chỉ số +20%.',
      mul: { hp: 1.2, mp: 1.2, atk: 1.2, def: 1.2 },
    },
    binh_minh: {
      icon: '🎖️', name: 'Đồng Đội Bình Minh',
      desc: 'Ký ức đội Bình Minh: máu và tấn công +5%.',
      mul: { hp: 1.05, atk: 1.05 },
    },
    tu_do: {
      icon: '🕊️', name: 'Trạng Thái Tự Do',
      desc: 'Thoát khỏi Hệ thống: toàn bộ chỉ số +10%, xu và kinh nghiệm +20%.',
      mul: { hp: 1.1, mp: 1.1, atk: 1.1, def: 1.1 },
      add: { goldfind: 20, expfind: 20 },
    },
  };


  Object.assign(G, { PERKS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
