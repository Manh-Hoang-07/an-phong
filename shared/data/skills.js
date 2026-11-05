/*
 * Kỹ năng của từng class, nội tại cốt truyện (perk), ô kỹ năng.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Kỹ năng
  // Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
  //   mỗi cấp: sức mạnh +10%, năng lượng tốn +4%; cấp 10: hồi chiêu -15%
  //   m5 / m10: thay đổi thêm khi đạt cấp 5 / cấp 10 (kèm mô tả t5 / t10)
  // type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield
  //       sword_fall | arrow_rain | meteor   (ult: true = tuyệt kỹ, đặt ở ô tuyệt kỹ)
  const SKILL_MAX = 10;
  const SKILLS = {
    // ----- Kiếm Sĩ
    pa1: { school: 'kiem_si', icon: '💨', name: 'Trảm Kích Lướt', level: 5, mp: 12, cd: 3,
      type: 'dash', power: 1.8, distance: 170, desc: 'Lướt tới trước, chém mọi quái trên đường đi.',
      m5: { distance: 230 }, t5: 'Lướt xa hơn (230).',
      m10: { after: 1.0 }, t10: 'Để lại vệt kiếm, chém thêm một lần nữa.' },
    pa2: { school: 'kiem_si', icon: '⚔️', name: 'Liên Trảm', level: 8, mp: 20, cd: 6,
      type: 'melee', power: 0.9, hits: 4, range: 100, desc: 'Chém liên tiếp phía trước.',
      m5: { hits: 5 }, t5: 'Chém 5 nhát.',
      m10: { finisher: 2.5 }, t10: 'Nhát cuối gây 250% sức mạnh và hất văng quái.' },
    pa4: { school: 'kiem_si', icon: '🛡️', name: 'Khiên Ý Chí', level: 12, mp: 25, cd: 18,
      type: 'guard', duration: 5, reduce: 0.4, desc: 'Giảm sát thương nhận vào.',
      m5: { duration: 7 }, t5: 'Kéo dài 7 giây.',
      m10: { reduce: 0.55, reflect: 0.3 }, t10: 'Giảm 55% sát thương và phản lại 30% cho quái.' },
    pa3: { school: 'kiem_si', icon: '🔥', name: 'Cuồng Nộ', level: 15, mp: 35, cd: 20,
      type: 'buff', buff: 'rage', duration: 6, atkBuff: 0.3, speedBuff: 0.5, desc: 'Tăng tấn công và tốc đánh.',
      m5: { duration: 8 }, t5: 'Kéo dài 8 giây.',
      m10: { atkBuff: 0.45 }, t10: 'Tấn công +45%.' },
    pa5: { school: 'kiem_si', icon: '🗡️', name: 'Thiên Kiếm Giáng', level: 20, mp: 60, cd: 40, ult: true,
      type: 'sword_fall', power: 6, radius: 180, count: 1, desc: 'Triệu hồi thanh kiếm khổng lồ đâm xuống phía trước.',
      m5: { radius: 230 }, t5: 'Vùng sát thương rộng hơn.',
      m10: { count: 3 }, t10: 'Ba thanh kiếm cùng giáng xuống.' },

    // ----- Cung Thủ
    hl1: { school: 'cung_thu', icon: '🔥', name: 'Tiễn Xuyên Phá', level: 5, mp: 10, cd: 2.5,
      type: 'projectile', power: 2.2, pierce: true, range: 460, count: 1, desc: 'Bắn mũi tên lửa xuyên qua mọi quái.',
      m5: { range: 620 }, t5: 'Bay xa hơn (620).',
      m10: { count: 2 }, t10: 'Bắn 2 mũi tên song song.' },
    hl2: { school: 'cung_thu', icon: '✴️', name: 'Tam Tiễn', level: 8, mp: 18, cd: 5,
      type: 'spread', power: 1.5, count: 3, range: 420, desc: 'Bắn nhiều mũi tên tỏa ra.',
      m5: { count: 5 }, t5: 'Bắn 5 mũi tên.',
      m10: { slow: 2 }, t10: 'Trúng tên làm quái chậm 2 giây.' },
    hl4: { school: 'cung_thu', icon: '🦘', name: 'Lùi Né', level: 12, mp: 15, cd: 6,
      type: 'backstep', power: 1.6, distance: 160, count: 1, desc: 'Nhảy lùi né đòn, vừa lùi vừa bắn.',
      m5: { cd: 4 }, t5: 'Hồi chiêu còn 4 giây.',
      m10: { count: 3 }, t10: 'Bắn 3 mũi tên khi lùi.' },
    hl3: { school: 'cung_thu', icon: '🦅', name: 'Mắt Ưng', level: 15, mp: 30, cd: 20,
      type: 'buff', buff: 'eagle', duration: 8, critBuff: 25, speedBuff: 0.3, desc: 'Tăng chí mạng và tốc bắn.',
      m5: { duration: 10 }, t5: 'Kéo dài 10 giây.',
      m10: { critBuff: 40 }, t10: 'Chí mạng +40%.' },
    hl5: { school: 'cung_thu', icon: '🌧️', name: 'Mưa Tên', level: 20, mp: 60, cd: 40, ult: true,
      type: 'arrow_rain', power: 0.9, arrows: 12, width: 360, desc: 'Trút mưa tên xuống vùng phía trước.',
      m5: { arrows: 18 }, t5: '18 mũi tên.',
      m10: { width: 480, slow: 2 }, t10: 'Vùng rộng hơn, quái trúng tên bị chậm.' },

    // ----- Pháp Sư
    tn1: { school: 'phap_su', icon: '🌊', name: 'Sóng Băng', level: 5, mp: 10, cd: 3,
      type: 'projectile', power: 1.3, pierce: true, range: 300, slow: 3, count: 1, desc: 'Sóng băng xuyên quái, làm chậm.',
      m5: { range: 420 }, t5: 'Bay xa hơn (420).',
      m10: { freeze: 1 }, t10: 'Đóng băng quái 1 giây.' },
    tn2: { school: 'phap_su', icon: '🌙', name: 'Hồi Phục', level: 8, mp: 25, cd: 12,
      type: 'heal', heal: 0.3, desc: 'Hồi máu.',
      m5: { heal: 0.4 }, t5: 'Hồi 40% máu tối đa.',
      m10: { mpHeal: 0.2 }, t10: 'Hồi thêm 20% năng lượng.' },
    tn4: { school: 'phap_su', icon: '🔷', name: 'Khiên Năng Lượng', level: 12, mp: 20, cd: 20,
      type: 'manashield', duration: 8, absorb: 0.7, desc: 'Dùng năng lượng đỡ phần lớn sát thương.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { absorb: 1 }, t10: 'Đỡ toàn bộ sát thương bằng năng lượng.' },
    tn3: { school: 'phap_su', icon: '❄️', name: 'Băng Ngục', level: 15, mp: 40, cd: 18,
      type: 'aoe', power: 2.0, radius: 210, freeze: 2, desc: 'Đóng băng vùng quanh người.',
      m5: { radius: 260 }, t5: 'Vùng rộng hơn.',
      m10: { freeze: 3 }, t10: 'Quái đứng yên 3 giây.' },
    tn5: { school: 'phap_su', icon: '☄️', name: 'Thiên Thạch', level: 20, mp: 70, cd: 40, ult: true,
      type: 'meteor', power: 7, radius: 200, count: 1, desc: 'Gọi thiên thạch rơi xuống phía trước.',
      m5: { radius: 250 }, t5: 'Vụ nổ rộng hơn.',
      m10: { count: 3 }, t10: 'Ba thiên thạch liên tiếp.' },

    // ----- Toàn Năng (riêng)
    vn1: { school: 'toan_nang', icon: '🌟', name: 'Thức Tỉnh Tối Thượng', level: 20, mp: 80, cd: 60, ult: true,
      type: 'buff', buff: 'awaken', duration: 10, atkBuff: 0.5, critBuff: 20, speedBuff: 0.4,
      desc: 'Giải phóng toàn bộ sức mạnh: tăng tấn công, chí mạng, tốc đánh.',
      m5: { duration: 13 }, t5: 'Kéo dài 13 giây.',
      m10: { atkBuff: 0.8 }, t10: 'Tấn công +80%.' },

    // ----- Sát Thủ
    st1: { school: 'sat_thu', icon: '💨', name: 'Lướt Bóng', level: 5, mp: 10, cd: 2.5,
      type: 'dash', power: 2.2, distance: 160, desc: 'Lướt nhanh, chém mọi kẻ trên đường, tạm miễn sát thương.',
      m5: { distance: 220 }, t5: 'Lướt xa hơn (220).',
      m10: { after: 1.2 }, t10: 'Để lại vệt dao chém thêm một lần.' },
    st2: { school: 'sat_thu', icon: '🔪', name: 'Nhát Kép', level: 8, mp: 16, cd: 4,
      type: 'melee', power: 1.4, hits: 2, range: 90, desc: 'Hai nhát liên tiếp từ hai hướng.',
      m5: { hits: 3 }, t5: '3 nhát.',
      m10: { finisher: 3.2 }, t10: 'Nhát cuối gây 320% và làm tối màn hình kẻ địch.' },
    st4: { school: 'sat_thu', icon: '🕶️', name: 'Ẩn Thân', level: 12, mp: 22, cd: 15,
      type: 'guard', duration: 4, reduce: 0.5, desc: 'Ẩn nửa người, giảm 50% sát thương nhận vào.',
      m5: { duration: 5.5 }, t5: 'Kéo dài 5.5 giây.',
      m10: { reduce: 0.7 }, t10: 'Giảm 70%, sau khi hết buff: đòn kế tiếp chắc chắn chí mạng.' },
    st3: { school: 'sat_thu', icon: '⚡', name: 'Cuồng Sát', level: 15, mp: 30, cd: 18,
      type: 'buff', buff: 'frenzy', duration: 6, atkBuff: 0.4, speedBuff: 0.6, desc: 'Tốc độ và tấn công tăng vọt.',
      m5: { duration: 8 }, t5: 'Kéo dài 8 giây.',
      m10: { atkBuff: 0.6, critBuff: 20 }, t10: 'Tấn công +60% và chí mạng +20%.' },
    st5: { school: 'sat_thu', icon: '🗡️', name: 'Trăm Nhát Phân Tán', level: 20, mp: 55, cd: 38, ult: true,
      type: 'spread', power: 1.8, count: 5, range: 380, desc: 'Phóng 5 dao ngắn tỏa ra phía trước.',
      m5: { count: 8 }, t5: '8 dao.',
      m10: { slow: 2 }, t10: 'Dao trúng làm chậm quái 2 giây.' },

    // ----- Tanker
    tk1: { school: 'tanker', icon: '🛡️', name: 'Khiên Phá', level: 5, mp: 14, cd: 3.5,
      type: 'melee', power: 2.0, hits: 1, range: 110, desc: 'Đập khiên tới trước, hất văng quái xa.',
      m5: { range: 140, power: 2.5 }, t5: 'Mạnh hơn và tầm rộng hơn.',
      m10: { finisher: 3.0 }, t10: 'Nếu quái đã bị choáng, gây 300% sát thương.' },
    tk2: { school: 'tanker', icon: '⚙️', name: 'Vòng Thép', level: 8, mp: 20, cd: 7,
      type: 'aoe', power: 1.6, radius: 160, freeze: 0, desc: 'Quét tất cả quái xung quanh.',
      m5: { radius: 200 }, t5: 'Vùng rộng hơn.',
      m10: { power: 2.4 }, t10: 'Sát thương tăng mạnh, hất văng quái.' },
    tk4: { school: 'tanker', icon: '🔩', name: 'Giáp Sắt', level: 12, mp: 28, cd: 22,
      type: 'guard', duration: 7, reduce: 0.5, desc: 'Khoác giáp sắt, giảm 50% sát thương.',
      m5: { duration: 9, reduce: 0.6 }, t5: 'Kéo dài 9 giây, giảm 60%.',
      m10: { reduce: 0.75, reflect: 0.25 }, t10: 'Giảm 75% và phản 25% lại quái.' },
    tk3: { school: 'tanker', icon: '💪', name: 'Thịnh Nộ', level: 15, mp: 35, cd: 20,
      type: 'buff', buff: 'rage', duration: 8, atkBuff: 0.35, speedBuff: 0.2, desc: 'Máu tối đa tăng, tấn công tăng.',
      m5: { duration: 10, atkBuff: 0.5 }, t5: 'Kéo dài 10 giây, tấn công +50%.',
      m10: { atkBuff: 0.6 }, t10: 'Tấn công +60%.' },
    tk5: { school: 'tanker', icon: '🌊', name: 'Sóng Thép', level: 20, mp: 65, cd: 42, ult: true,
      type: 'sword_fall', power: 5, radius: 220, count: 1, desc: 'Đập kiếm xuống đất, sóng thép nổ diện rộng.',
      m5: { radius: 270 }, t5: 'Vùng nổ rộng hơn.',
      m10: { count: 2 }, t10: 'Hai vụ nổ liên tiếp.' },

    // ----- Trị Liệu Sư
    tl1: { school: 'tri_lieu_su', icon: '💚', name: 'Chữa Lành', level: 5, mp: 20, cd: 8,
      type: 'heal', heal: 0.35, desc: 'Hồi 35% máu tối đa.',
      m5: { heal: 0.5 }, t5: 'Hồi 50% máu.',
      m10: { mpHeal: 0.25 }, t10: 'Hồi thêm 25% năng lượng.' },
    tl2: { school: 'tri_lieu_su', icon: '🌊', name: 'Sóng Thánh', level: 8, mp: 15, cd: 3.5,
      type: 'projectile', power: 1.2, pierce: true, range: 340, slow: 2, count: 1,
      desc: 'Sóng ánh sáng xuyên quái, làm chậm.',
      m5: { range: 460, count: 2 }, t5: 'Bay xa hơn, bắn 2 sóng.',
      m10: { freeze: 1 }, t10: 'Trúng đóng băng quái 1 giây.' },
    tl4: { school: 'tri_lieu_su', icon: '🔷', name: 'Khiên Ánh Sáng', level: 12, mp: 22, cd: 20,
      type: 'manashield', duration: 10, absorb: 0.8, desc: 'Dùng năng lượng đỡ 80% sát thương.',
      m5: { duration: 14 }, t5: 'Kéo dài 14 giây.',
      m10: { absorb: 1.0 }, t10: 'Đỡ 100% sát thương bằng năng lượng.' },
    tl3: { school: 'tri_lieu_su', icon: '✨', name: 'Ân Sủng', level: 15, mp: 40, cd: 22,
      type: 'buff', buff: 'grace', duration: 9, atkBuff: 0.15, speedBuff: 0.2, regen: 0.03, desc: 'Buff toàn bộ chỉ số, tự hồi máu liên tục.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { atkBuff: 0.3, regen: 0.05 }, t10: 'Tấn công +30%, hồi máu nhanh hơn.' },
    tl5: { school: 'tri_lieu_su', icon: '☀️', name: 'Phép Thánh Toàn Trị', level: 20, mp: 75, cd: 45, ult: true,
      type: 'aoe', power: 3.5, radius: 240, freeze: 0, heal: 0.25, desc: 'Nổ tung ánh sáng thánh xung quanh, gây sát thương lớn và hồi máu.',
      m5: { radius: 300 }, t5: 'Vùng rộng hơn.',
      m10: { power: 5.0 }, t10: 'Sát thương tăng mạnh.' },
  };

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

  // Ô kỹ năng: 0–3 ô thường, 4 ô thêm của Toàn Năng, 5 ô tuyệt kỹ
  const SKILL_SLOTS = 6;
  const ULT_SLOT = 5;
  const EXTRA_SLOT = 4;

  Object.assign(G, { SKILL_MAX, SKILLS, PERKS, SKILL_SLOTS, ULT_SLOT, EXTRA_SLOT });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
