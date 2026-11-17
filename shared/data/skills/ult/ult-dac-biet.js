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
    ulSinhTu: { school: 'chung', ultAny: true, icon: '💀', name: 'Sinh Tử Đồng Quy', level: 70, priceLevel: 60, /* giá sách giữ theo mốc 60 → 420 Linh Ngọc như thiết kế; bỏ priceLevel thì giá nhảy lên 500 */ mp: 0, cd: 180, ult: true,
      superUlt: true, type: 'execute', shopNgoc: true, selfZero: true, buaSaves: true, range: 520, reach: 320, execPvp: true,
      // Mục tiêu cao hơn nhân vật TRÊN 20 cấp thì không gục ngay: chỉ mất 50% sinh lực tối đa.
      // Cái giá của người dùng chiêu KHÔNG đổi — vẫn về 0 máu (Bùa Hộ Mệnh giữ 1 máu).
      execOverLevel: 20, execOverHp: 0.5,
      desc: 'Sinh tử đồng quy: sống chết cùng về một chỗ. Mục tiêu mất toàn bộ sinh lực và gục ngay — quái thường, '
        + 'tinh anh, thủ lĩnh hay trùm đều vậy. Riêng mục tiêu cao hơn bạn trên 20 cấp thì chỉ mất 50% sinh lực, '
        + 'không gục. Bạn cũng mất toàn bộ sinh lực. Có Bùa Hộ Mệnh thì bạn giữ lại 1 máu và bất tử trong vài giây, '
        + 'còn nó thì không.',
      // Siêu tuyệt kỹ KHÔNG cộng cấp (shared/logic/skills.js: skillAt trả nguyên bản khi superUlt),
      // nên m5/m10 đã gộp vào chỉ số gốc. cd 150 là con số cấp 10 cũ, lấy làm chuẩn.
      cd: 150 },

  // ===== Siêu tuyệt kỹ thứ hai: Tử Linh Dung Hợp (chỉ Tử Linh Thuật Sư) =====
  // Dung hợp TOÀN BỘ bộ sưu tập bóng ma (kể cả bóng không triệu hồi) vào bản thân trong 60 giây.
  // Cái giá: bộ sưu tập mất trắng — bóng tan hết, không khôi phục được.
  // Chỉ số cộng dồn nằm ở G.shadowFusion (shared/data/pets/shadow.js), hệ số ở G.FUSION.
  ulTuLinhDungHop: { school: 'tu_linh_thuat_su', icon: '🕸️', name: 'Tử Linh Dung Hợp', level: 70, priceLevel: 60, /* giá sách giữ theo mốc 60 → 420 Linh Ngọc như thiết kế */ mp: 320, cd: 240, ult: true,
  superUlt: true, type: 'fusion', shopNgoc: true, fusionSec: 60, fusionCost: 'roster',
  desc: 'Dung hợp toàn bộ bóng ma trong bộ sưu tập vào bản thân: cộng dồn sinh lực, năng lượng, thể lực và '
  + 'phòng thủ của chúng trong 60 giây. Bóng đang lưu giữ hay đang triệu hồi đều tính. Đổi lại, mọi bóng ma '
  + 'tan biến — bộ sưu tập mất trắng, không lấy lại được.',
  // Siêu tuyệt kỹ KHÔNG cộng cấp — m5/m10 đã gộp vào gốc. cd 200 là con số cấp 10 cũ.
  cd: 200 },
  // ===== Siêu tuyệt kỹ: Thiết Bích Vĩnh Cửu (Hộ Vệ Bất Khuất) =====
  // 15 giây miễn nhiễm sát thương, đổi lại tấn công về 0 trong suốt thời gian đó.
  // KHÔNG cần mã engine mới: `guard` đã cộng dồn reduce và atkBuff từ mọi thủ thế đang bật
  // (public/js/scene/skills.js case 'guard'; combat.js buffReduce + calcDamage).
  //   reduce: 1   → sát thương nhận nhân 0; sàn Math.max(1,…) nên mỗi đòn chỉ còn 1.
  //   atkBuff: -1 → (1 + bt.atk) = 0; đòn của bạn cũng chỉ còn 1.
  // Lưu ý: nếu đang bật thêm buff tấn công khác (vd Ý Chí Bất Diệt +34%) thì tấn công không về đúng 0
  // mà còn lại phần chênh — cộng dồn có chủ đích, không phải lỗi.
  ulTankSuper: { school: 'tanker', ultSchools: ['tanker', 'ho_ve_bat_khuat'], icon: '🛡️', name: 'Thiết Bích Vĩnh Cửu', level: 70, priceLevel: 60, /* giá sách theo mốc 60 → 420 Linh Ngọc như ba siêu tuyệt kỹ kia */ mp: 200, cd: 180, ult: true,
    superUlt: true, type: 'guard', shopNgoc: true, duration: 60, reduce: 1, atkBuff: -1,
    desc: 'Dựng thành thép quanh bản thân: 60 giây miễn nhiễm toàn bộ sát thương nhận vào. Đổi lại, trong suốt '
      + '60 giây đó bạn không gây được sát thương — tấn công về 0. Thành đứng vững, nhưng thanh kiếm thì cắm xuống đất.',
    // Siêu tuyệt kỹ KHÔNG cộng cấp — m5/m10 đã gộp vào gốc. 70 giây là con số cấp 10 cũ.
    duration: 70 },

  // ===== Siêu tuyệt kỹ: Vạn Pháp Quy Nhất (Toàn Năng) =====
  // Tung CẢ BA tuyệt kỹ chung cùng một lúc: Thiên Địa Chấn Động (nổ), Hư Không Tuyệt Trảm (ba nhát chém),
  // Ý Chí Bất Diệt (buff). Mỗi cái chạy nguyên hiệu ứng gốc của nó, chỉ khác là ra cùng lúc.
  // `power` ở đây là hệ số của RIÊNG cú nổ tổng hợp — không thay thế power của ba kỹ kia.
  //
  // Cân bằng: Toàn Năng là class yếu nhất bảng (atk 363, skillMul 0,83 ở cấp 70), nên hệ số phải cao
  // mới cùng tầm các siêu tuyệt kỹ khác. power 77 → cấp 10 là 111,6 → 28.058 sát thương = 4,19× máu
  // Trụ Mộng Sáng Thế (6.700 HP). Ngang Nhất Kiếm Khai Thiên và Xuyên Không Nhất Tiễn.
  //
  // Cái giá: `lockSec` giây khoá TOÀN BỘ kỹ năng sau khi tung (client chặn ở useSkill, server giữ mốc).
  // Không dùng "còn 1 máu" — người chơi vẫn còn nguyên máu, chỉ mất khả năng ra đòn.
  ulToanNangSuper: { school: 'toan_nang', ultSchools: ['toan_nang'], icon: '🌀', name: 'Vạn Pháp Quy Nhất', level: 70, priceLevel: 60, /* giá sách theo mốc 60 → 420 Linh Ngọc */ mp: 400, cd: 180, ult: true,
    superUlt: true, type: 'allin', shopNgoc: true, power: 111.65, radius: 400, lockSec: 60,
    desc: 'Vạn pháp quy về một mối: tung cùng lúc cả ba tuyệt kỹ chung — Thiên Địa Chấn Động, Hư Không '
      + 'Tuyệt Trảm và Ý Chí Bất Diệt — trong một nhịp duy nhất, kèm một vụ nổ tổng hợp ở giữa. Đổi lại, '
      + 'toàn bộ kỹ năng bị phong ấn 60 giây: bạn còn máu, còn năng lượng, nhưng không ra được đòn nào ngoài '
      + 'đánh thường.',
    // Siêu tuyệt kỹ KHÔNG cộng cấp — m5/m10 đã gộp vào gốc.
    // power 111,65 và radius 400 là con số cấp 10 cũ (77 × 1,45 và m5), lấy làm chuẩn.
    // Ở cấp 70 (atk 363, skillMul 0,83) → 28.058 sát thương = 4,19× máu Trụ Mộng Sáng Thế.
  },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
