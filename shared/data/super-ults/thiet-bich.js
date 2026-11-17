/*
 * Tuyệt Phẩm · Thiết Bích Vĩnh Cửu — Tanker / Hộ Vệ Bất Khuất, cấp 70, sách 420 Linh Ngọc.
 *
 * 70 giây miễn nhiễm sát thương, đổi lại tấn công về 0 trong suốt thời gian đó.
 *
 * KHÔNG cần mã engine mới: `guard` đã cộng dồn reduce và atkBuff từ mọi thủ thế đang bật
 * (public/js/scene/skills.js case 'guard'; combat.js buffReduce + calcDamage).
 *   reduce: 1   → sát thương nhận nhân 0; sàn Math.max(1,…) nên mỗi đòn chỉ còn 1.
 *   atkBuff: -1 → (1 + bt.atk) = 0; đòn của bạn cũng chỉ còn 1.
 *
 * Lưu ý: nếu đang bật thêm buff tấn công khác (vd Ý Chí Bất Diệt +34%) thì tấn công không về đúng 0
 * mà còn lại phần chênh — cộng dồn có chủ đích, không phải lỗi.
 *
 * File này chỉ khai báo DỮ LIỆU. Luật của trụ nằm ở logic/super-ults/.
 */
(function (G) {
  'use strict';

  (G.TUYET_PHAM_PARTS = G.TUYET_PHAM_PARTS || []).push({
    ulTankSuper: { school: 'tanker', ultSchools: ['tanker', 'ho_ve_bat_khuat'], icon: '🛡️', name: 'Thiết Bích Vĩnh Cửu', level: 70, priceLevel: 60, mp: 200, cd: 180, ult: true,
      superUlt: true, type: 'guard', shopNgoc: true, duration: 70, reduce: 1, atkBuff: -1,
      cost: { type: 'atk_zero', atkBuff: -1, duration: 70 },
      desc: 'Dựng thành thép quanh bản thân: 70 giây miễn nhiễm toàn bộ sát thương nhận vào. Đổi lại, trong suốt '
        + '70 giây đó bạn không gây được sát thương — tấn công về 0. Thành đứng vững, nhưng thanh kiếm thì cắm xuống đất.' },
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
