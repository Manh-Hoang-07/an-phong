/*
 * Tuyệt Phẩm · Sinh Tử Đồng Quy — mọi class (ultAny), cấp 70, sách 420 Linh Ngọc.
 *
 * Cả hai cùng về 0 máu. Bùa Hộ Mệnh cứu NGƯỜI CHƠI (1 máu + bất tử vài giây), quái không có bùa
 * nên chết. Không chặn trùm nào — trùm cuối cũng chết, nhưng phải trả bằng mạng mình.
 *
 * Mục tiêu cao hơn nhân vật TRÊN 20 cấp thì không gục ngay: chỉ mất 50% sinh lực tối đa.
 * Cái giá của người dùng chiêu KHÔNG đổi — vẫn về 0 máu (Bùa Hộ Mệnh giữ 1 máu).
 *
 * Hồi chiêu do SERVER giữ (p.execCd) và hồi chiêu bùa cũng do server giữ (p.buaCd),
 * xem server/realtime/index.js onExec. Đây là loại đòn duy nhất đi qua handler riêng.
 *
 * File này chỉ khai báo DỮ LIỆU. Luật của trụ nằm ở logic/super-ults/.
 */
(function (G) {
  'use strict';

  (G.TUYET_PHAM_PARTS = G.TUYET_PHAM_PARTS || []).push({
    ulSinhTu: { school: 'chung', ultAny: true, icon: '💀', name: 'Sinh Tử Đồng Quy', level: 70, priceLevel: 60, mp: 0, cd: 150, ult: true,
      superUlt: true, type: 'execute', shopNgoc: true, selfZero: true, buaSaves: true, range: 520, reach: 320, execPvp: true,
      execOverLevel: 20, execOverHp: 0.5,
      cost: { type: 'hp', selfZero: true, buaSaves: true },
      desc: 'Sinh tử đồng quy: sống chết cùng về một chỗ. Mục tiêu mất toàn bộ sinh lực và gục ngay — quái thường, '
        + 'tinh anh, thủ lĩnh hay trùm đều vậy. Riêng mục tiêu cao hơn bạn trên 20 cấp thì chỉ mất 50% sinh lực, '
        + 'không gục. Bạn cũng mất toàn bộ sinh lực. Có Bùa Hộ Mệnh thì bạn giữ lại 1 máu và bất tử trong vài giây, '
        + 'còn nó thì không.' },
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
