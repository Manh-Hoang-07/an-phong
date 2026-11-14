/*
 * Kỹ năng · Tầm xa / phép.
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
    ulCung1: { school: 'cung_thu', ultSchools: ['cung_thu'], icon: '🌠', name: 'Tinh Vân Tuyệt Xạ', level: 30, mp: 180, cd: 38, ult: true,
      type: 'projectile', power: 1.9, count: 3, range: 720, pierce: true, desc: 'Bắn ba mũi tên sao xuyên thủng mọi quái trên đường bay.',
      m5: { count: 4 }, t5: '4 mũi tên.',
      m10: { slow: 2 }, t10: 'Làm chậm quái bị xuyên.' },
    ulCung2: { school: 'cung_thu', ultSchools: ['cung_thu', 'sat_thu'], icon: '☔', name: 'Thiên Hỏa Mưa Tên', level: 38, mp: 240, cd: 46, ult: true,
      type: 'arrow_rain', power: 1.61, arrows: 24, width: 600, desc: 'Phủ mưa tên lửa lên cả một vùng chiến trường rộng.',
      m5: { arrows: 32 }, t5: '32 mũi tên.',
      m10: { width: 760, arrows: 40, slow: 2 }, t10: 'Vùng rộng hơn, 40 mũi tên, quái trúng tên bị chậm.' },
    ulPhap1: { school: 'phap_su', ultSchools: ['phap_su'], icon: '⚡', name: 'Lôi Đế Giáng Thế', level: 30, mp: 220, cd: 42, ult: true,
      type: 'meteor', power: 1.26, radius: 170, count: 4, desc: 'Gọi bốn đợt sấm sét giáng xuống phía trước.',
      m5: { radius: 210 }, t5: 'Vùng nổ rộng hơn.',
      m10: { count: 6 }, t10: 'Sáu đợt sấm sét.' },
    ulPhap2: { school: 'phap_su', ultSchools: ['phap_su', 'tri_lieu_su'], icon: '❄️', name: 'Băng Hải Phong Thiên', level: 35, mp: 220, cd: 44, ult: true,
      type: 'aoe', power: 7.93, radius: 330, freeze: 3, desc: 'Đóng băng mọi thứ xung quanh trong biển băng giá.',
      m5: { radius: 400 }, t5: 'Vùng băng rộng hơn.',
      m10: { freeze: 4.5 }, t10: 'Đóng băng lâu hơn.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
