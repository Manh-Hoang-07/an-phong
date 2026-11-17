/*
 * Tuyệt Phẩm · Cấm Chú Giải Phóng — Pháp Sư / Đại Pháp Sư, cấp 70, sách 420 Linh Ngọc.
 *
 * Đốt TOÀN BỘ năng lượng đang có thành một đòn duy nhất. Sát thương = MP đã đốt × mpPower.
 * Cân bằng: Đại Pháp Sư cấp 70 có 1.108 MP (không đồ) → 1.108 × 6,6 ≈ 7.300 sát thương trước giảm trừ.
 *
 * Cái giá KHÔNG phải hồi chiêu (chỉ 90 giây): đốt sạch MP, và 10 giây không hồi được năng lượng
 * → vô hiệu luôn nội tại Dòng Chảy của Pháp Sư. Đó mới là thứ làm nó đau.
 * Client chặn hồi MP ở public/js/scene/player.js; server giữ mốc p.mpLock (realtime onManaBurst).
 *
 * File này chỉ khai báo DỮ LIỆU. Luật của trụ nằm ở logic/super-ults/.
 */
(function (G) {
  'use strict';

  (G.TUYET_PHAM_PARTS = G.TUYET_PHAM_PARTS || []).push({
    ulPhapSuper: { school: 'phap_su', ultSchools: ['phap_su', 'dai_phap_su'], icon: '📕', name: 'Cấm Chú Giải Phóng', level: 70, priceLevel: 60, mp: 0, cd: 90, ult: true,
      superUlt: true, type: 'manaburst', shopNgoc: true, radius: 340, mpPower: 6.6, lockSec: 10,
      cost: { type: 'mp_burn', lockSec: 10 },
      desc: 'Cấm chú cuối cùng của pháp sư: đốt sạch toàn bộ năng lượng đang có thành một vụ nổ. Sát thương bằng '
        + 'năng lượng đã đốt × 6,6, lan ra mọi thứ trong bán kính 340. Đổi lại bạn về 0 năng lượng và 10 giây '
        + 'không hồi được năng lượng — kể cả Dòng Chảy. Đốt càng nhiều, nổ càng lớn.' },
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
