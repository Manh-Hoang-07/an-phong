/*
 * Tuyệt Phẩm · Tử Linh Dung Hợp — chỉ Tử Linh Thuật Sư, cấp 70, sách 420 Linh Ngọc.
 *
 * Dung hợp TOÀN BỘ bộ sưu tập bóng ma (kể cả bóng không triệu hồi) vào bản thân trong 60 giây.
 * Cái giá: bộ sưu tập mất trắng — bóng tan hết, không khôi phục được.
 *
 * Chỉ số cộng dồn nằm ở G.shadowFusion (data/pets/shadow.js), hệ số ở G.FUSION.
 * Đi qua handler riêng: server/game/actions/combat.js applyFusion, gọi từ realtime onFusion.
 *
 * File này chỉ khai báo DỮ LIỆU. Luật của trụ nằm ở logic/super-ults/.
 */
(function (G) {
  'use strict';

  (G.TUYET_PHAM_PARTS = G.TUYET_PHAM_PARTS || []).push({
    ulTuLinhDungHop: { school: 'tu_linh_thuat_su', icon: '🕸️', name: 'Tử Linh Dung Hợp', level: 70, priceLevel: 60, mp: 320, cd: 200, ult: true,
      superUlt: true, type: 'fusion', shopNgoc: true, fusionSec: 60, fusionCost: 'roster',
      cost: { type: 'roster', fusionCost: 'roster' },
      desc: 'Dung hợp toàn bộ bóng ma trong bộ sưu tập vào bản thân: cộng dồn sinh lực, năng lượng, thể lực và '
        + 'phòng thủ của chúng trong 60 giây. Bóng đang lưu giữ hay đang triệu hồi đều tính. Đổi lại, mọi bóng ma '
        + 'tan biến — bộ sưu tập mất trắng, không lấy lại được.' },
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
