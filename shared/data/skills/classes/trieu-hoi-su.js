/*
 * Kỹ năng · Triệu Hồi Sư → Tử Linh Thuật Sư.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    th1: { school: 'trieu_hoi_su', icon: '✨', name: 'Linh Tiễn', level: 5, mp: 24, cd: 3,
      type: 'projectile', power: 1.03, pierce: true, range: 360, count: 1, desc: 'Bắn linh tiễn xuyên qua hàng quái.',
      m5: { range: 460 }, t5: 'Tăng tầm bắn.', m10: { count: 2 }, t10: 'Bắn thêm một linh tiễn.' },
    th2: { school: 'trieu_hoi_su', icon: '🌀', name: 'Linh Thể Hộ Vệ', level: 8, mp: 48, cd: 14,
      type: 'guard', duration: 5, reduce: 0.35, desc: 'Gọi linh thể che chắn, giảm sát thương nhận vào.',
      m5: { duration: 7 }, t5: 'Kéo dài thời gian bảo vệ.', m10: { reduce: 0.5 }, t10: 'Giảm sát thương nhiều hơn.' },
    th3: { school: 'trieu_hoi_su', icon: '🔷', name: 'Nổ Linh Lực', level: 12, mp: 64, cd: 12,
      type: 'aoe', power: 1.65, radius: 170, desc: 'Giải phóng linh lực thành vụ nổ quanh người.',
      m5: { radius: 220 }, t5: 'Vùng nổ rộng hơn.', m10: { power: 2.23 }, t10: 'Linh lực gây sát thương mạnh hơn.' },
    th4: { school: 'trieu_hoi_su', icon: '🪄', name: 'Hiệu Lệnh Triệu Hồi', level: 18, mp: 70, cd: 10,
      type: 'buff', buff: 'rage', duration: 7, atkBuff: 0.14, speedBuff: 0.15, desc: 'Cường hóa sức mạnh và tốc độ của thú đồng hành.',
      m5: { duration: 9 }, t5: 'Cường hóa lâu hơn.', m10: { atkBuff: 0.21 }, t10: 'Linh thể được tăng thêm sức tấn công.' },
    th5: { school: 'trieu_hoi_su', icon: '🐾', name: 'Triệu Hồi Linh Thú', level: 5, mp: 40, cd: 6,
      type: 'summon', desc: 'Bật/tắt 1 linh thú chiến đấu theo chủ (chọn con nào trong bảng Thú triệu hồi). Nâng cấp tăng sức mạnh linh thú.',
      m5: { desc: 'Gọi 1 linh thú đã chọn, sức mạnh tăng.' }, t5: 'Linh thú mạnh hơn.',
      m10: { desc: 'Gọi 1 linh thú đã chọn, sức mạnh tăng mạnh.' }, t10: 'Linh thú mạnh hơn nhiều.' },
    nl1: { school: 'tu_linh_thuat_su', icon: '☠️', name: 'Lời Nguyền Tàn Lụi', level: 25, mp: 60, cd: 10,
      type: 'projectile', power: 0.98, range: 380, slow: 2, count: 1, desc: 'Nguyền mục tiêu, gây sát thương và làm chậm.',
      m5: { count: 2 }, t5: 'Nguyền thêm một mục tiêu trên đường bay.', m10: { slow: 3, power: 1.26 }, t10: 'Lời nguyền mạnh hơn và kéo dài hơn.' },
    nl2: { school: 'tu_linh_thuat_su', icon: '🌑', name: 'Triệu Hồi Bóng', level: 25, mp: 36, cd: 3,
      type: 'shadow_toggle', desc: 'Bật/tắt đội bóng ma đã chọn. Giải trừ chỉ làm bóng ẩn đi, không xóa bộ sưu tập.',
      m5: { cd: 2 }, t5: 'Hồi chiêu bật/tắt nhanh hơn.', m10: { cd: 1 }, t10: 'Gọi hoặc giải trừ gần như tức thì.' },
    nl3: { school: 'tu_linh_thuat_su', icon: '🩸', name: 'Hút Linh', level: 30, mp: 84, cd: 14,
      type: 'aoe', power: 2.05, radius: 190, heal: 0.16, desc: 'Hút sinh lực quanh người, gây sát thương và hồi máu.',
      m5: { radius: 240 }, t5: 'Hút linh lực trong vùng rộng hơn.', m10: { power: 2.64, heal: 0.22 }, t10: 'Tăng sát thương và hồi phục.' },
    nl4: { school: 'tu_linh_thuat_su', icon: '👻', name: 'Đội Quân U Ảnh', level: 35, mp: 96, cd: 20,
      type: 'buff', buff: 'frenzy', duration: 8, atkBuff: 0.15, speedBuff: 0.19, desc: 'Cường hóa các bóng ma đang chiến đấu.',
      m5: { duration: 10 }, t5: 'Cường hóa lâu hơn.', m10: { atkBuff: 0.23, speedBuff: 0.3 }, t10: 'Bóng ma mạnh và nhanh hơn.' },
    nl5: { school: 'tu_linh_thuat_su', icon: '🕳️', name: 'Cổng Âm Giới', level: 20, mp: 210, cd: 42, ult: true,
      type: 'meteor', power: 3.07, radius: 250, count: 2, desc: 'Mở cổng âm giới, giáng thiên thạch và cường hóa bóng ma đang theo.',
      m5: { radius: 300 }, t5: 'Vùng nổ lớn hơn.', m10: { count: 3, power: 2.3 }, t10: 'Cổng gọi ba đợt thiên thạch.' },
    nl6: { school: 'tu_linh_thuat_su', icon: '⚡', name: 'Phân Hồn', level: 40, mp: 112, cd: 18,
      type: 'shadow_command', power: 2.21, radius: 240, freeze: 1, desc: 'Phóng xung kích bóng tối, khiến đội bóng ma tập trung tấn công mục tiêu gần nhất.',
      m5: { radius: 300 }, t5: 'Xung kích lan rộng hơn.', m10: { power: 2.76, freeze: 2 }, t10: 'Tăng sát thương và khóa chân quái lâu hơn.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
