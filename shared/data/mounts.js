/*
 * Thú cưỡi. CHỈ lấy được qua mã quà tặng:  npm run giftcode -- add QUA-SOI --mount soi_xam --max-uses 1
 *   speed: tốc chạy cộng thêm (0.3 = +30%)      jump: hệ số độ cao nhảy (1 = như đi bộ)
 *   glide: rơi chậm (lướt) khi đang trên không   swim: không bị làm chậm bởi nước dâng / băng của trùm
 *   level: cấp tối thiểu để cưỡi                 look: kiểu hình vẽ (public/js/art/mounts.js)
 *   (mặt yên / chỗ người cưỡi ngồi theo kiểu hình: SEAT trong public/js/art/mounts.js)
 */
(function (G) {
  'use strict';

  const MOUNTS = {
    soi_xam: { name: 'Sói Xám', icon: '🐺', level: 1, speed: 0.3, jump: 1, look: 'wolf',
      colors: { body: 0x7b8290, belly: 0xb9bec8, mane: 0x4e5461, eye: 0xffd54f },
      desc: 'Sói hoang được Hiệp Hội thuần hóa. Bền bỉ, chạy đều.' },
    than_lan: { name: 'Thằn Lằn Đầm', icon: '🦎', level: 1, speed: 0.35, jump: 0.9, swim: true, look: 'lizard',
      colors: { body: 0x4f7a3a, belly: 0xc8d98a, mane: 0x2f4d22, eye: 0xff7043 },
      desc: 'Thân thấp, nhảy kém nhưng không bị nước hay băng làm chậm.' },
    soi_tuyet: { name: 'Sói Tuyết Bạc', icon: '🐺', level: 1, speed: 0.45, jump: 1.15, look: 'wolf',
      colors: { body: 0xdfe8f2, belly: 0xffffff, mane: 0x9fb4c8, eye: 0x4fc3f7 },
      desc: 'Sói núi tuyết, chân dài, nhảy cao hơn sói thường.' },
    hac_may: { name: 'Hạc Mây Đá', icon: '🕊️', level: 1, speed: 0.5, jump: 1.4, glide: true, look: 'crane',
      colors: { body: 0xe8ecf2, belly: 0xffffff, mane: 0x37474f, eye: 0xff5252 },
      desc: 'Nhảy rất cao và lướt chậm khi rơi, qua được những vực rộng.' },
    ky_lan: { name: 'Kỳ Lân', icon: '🦄', level: 1, speed: 0.7, jump: 1.25, look: 'unicorn',
      colors: { body: 0xfff3d6, belly: 0xffffff, mane: 0xffb74d, eye: 0x7e57c2, horn: 0xffd54f },
      desc: 'Thú cưỡi nhanh nhất, bờm vàng rực như ánh bình minh.' },
  };
  // Tổng tốc chạy khi cưỡi không vượt quá mức này (tránh chạy xuyên bản đồ)
  const MOUNT_SPEED_MAX = 460;

  Object.assign(G, { MOUNTS, MOUNT_SPEED_MAX });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
