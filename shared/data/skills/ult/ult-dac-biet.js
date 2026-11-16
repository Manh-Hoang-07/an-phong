/*
 * Kỹ năng · Đặc biệt: mọi class đều học được.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 *
 * Tuyệt kỹ: mạnh hơn kỹ năng thường, học bằng sách riêng (sach_tk_<id>), bán ở Lầu Trân Bảo bằng Linh Ngọc (trừ tuyệt kỹ dùng chung ultAny). */
(function (G) {
  'use strict';

  const PART = {
    ulChung1: { school: 'chung', ultAny: true, icon: '💥', name: 'Thiên Địa Chấn Động', level: 25, mp: 220, cd: 48, ult: true,
      type: 'aoe', power: 5.43, radius: 240, desc: 'Giải phóng nguyên lực, nổ tung mọi thứ xung quanh.',
      m5: { radius: 280 }, t5: 'Vùng nổ rộng hơn.',
      m10: { radius: 330, power: 7.24 }, t10: 'Vùng nổ cực rộng, sát thương tăng mạnh.' },
    ulChung2: { school: 'chung', ultAny: true, icon: '🔥', name: 'Ý Chí Bất Diệt', level: 30, mp: 240, cd: 60, ult: true,
      type: 'buff', buff: 'awaken', duration: 10, atkBuff: 0.34, critBuff: 11, speedBuff: 0.19, desc: 'Bùng cháy ý chí chiến đấu: tăng tấn công, chí mạng, tốc đánh.',
      m5: { duration: 13 }, t5: 'Kéo dài 13 giây.',
      m10: { atkBuff: 0.47 }, t10: 'Tấn công +47%.' },
    ulChung3: { school: 'chung', ultAny: true, icon: '🌌', name: 'Hư Không Tuyệt Trảm', level: 40, mp: 270, cd: 50, ult: true,
      type: 'sword_fall', power: 3.61, radius: 200, count: 2, desc: 'Xé toạc hư không, hai nhát chém khổng lồ đánh xuống.',
      m5: { radius: 240 }, t5: 'Vùng sát thương rộng hơn.',
      m10: { count: 3, power: 2.76 }, t10: 'Ba nhát chém hư không.' },
    // SIÊU TUYỆT KỸ: cả hai cùng về 0 máu. Bùa Hộ Mệnh cứu NGƯỜI CHƠI (1 máu + bất tử vài giây),
    // quái không có bùa nên chết. Không chặn trùm nào — trùm cuối cũng chết, nhưng phải trả bằng mạng mình.
    // Hồi chiêu do SERVER giữ (p.execCd) và hồi chiêu bùa cũng do server giữ (p.buaCd), xem server/realtime/index.js onExec.
    //
    // `superUlt: true` là bậc CAO HƠN tuyệt kỹ: vẫn tính là tuyệt kỹ (ult: true) nên dùng chung ô R/X/Z,
    // nhưng bảng kỹ năng gắn nhãn riêng và Lầu Trân Bảo xếp nó vào nhóm riêng.
    ulSinhTu: { school: 'chung', ultAny: true, icon: '💀', name: 'Sinh Tử Đồng Quy', level: 1, priceLevel: 60, /* TEST: cấp học tạm = 1, trả lại 60 khi test xong */ mp: 0, cd: 180, ult: true,
      superUlt: true, type: 'execute', shopNgoc: true, selfZero: true, buaSaves: true, range: 520, reach: 320, execPvp: true,
      desc: 'Sinh tử đồng quy: sống chết cùng về một chỗ. Mục tiêu mất toàn bộ sinh lực và gục ngay — quái thường, '
        + 'tinh anh, thủ lĩnh hay trùm đều vậy. Bạn cũng mất toàn bộ sinh lực. Có Bùa Hộ Mệnh thì bạn giữ lại 1 máu '
        + 'và bất tử trong vài giây, còn nó thì không.',
      m5: { cd: 165 }, t5: 'Hồi chiêu còn 165 giây.',
      // skillAt nhân thêm 0,85 ở cấp 10 (shared/logic/skills.js:27), nên 176,5 × 0,85 = 150 đúng như mô tả.
      m10: { cd: 176.5 }, t10: 'Hồi chiêu còn 150 giây.' },

  // ===== Siêu tuyệt kỹ thứ hai: Tử Linh Dung Hợp (chỉ Tử Linh Thuật Sư) =====
  // Dung hợp TOÀN BỘ bộ sưu tập bóng ma (kể cả bóng không triệu hồi) vào bản thân trong 60 giây.
  // Cái giá: bộ sưu tập mất trắng — bóng tan hết, không khôi phục được.
  // Chỉ số cộng dồn nằm ở G.shadowFusion (shared/data/pets/shadow.js), hệ số ở G.FUSION.
  ulTuLinhDungHop: { school: 'tu_linh_thuat_su', icon: '🕸️', name: 'Tử Linh Dung Hợp', level: 1, priceLevel: 60, /* TEST: cấp học tạm = 1, trả lại 60 khi test xong; giá sách vẫn tính theo priceLevel */ mp: 320, cd: 240, ult: true,
  superUlt: true, type: 'fusion', shopNgoc: true, fusionSec: 60, fusionCost: 'roster',
  desc: 'Dung hợp toàn bộ bóng ma trong bộ sưu tập vào bản thân: cộng dồn sinh lực, năng lượng, thể lực và '
  + 'phòng thủ của chúng trong 60 giây. Bóng đang lưu giữ hay đang triệu hồi đều tính. Đổi lại, mọi bóng ma '
  + 'tan biến — bộ sưu tập mất trắng, không lấy lại được.',
  m5: { cd: 220 }, t5: 'Hồi chiêu còn 220 giây.',
  // skillAt nhân thêm 0,85 ở cấp 10 (shared/logic/skills.js:27), nên 235,3 × 0,85 = 200 đúng như mô tả.
  m10: { cd: 235.3 }, t10: 'Hồi chiêu còn 200 giây.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
