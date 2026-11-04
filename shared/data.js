/*
 * Thức Tỉnh - dữ liệu game dùng chung cho server (Node) và client (trình duyệt).
 * Muốn cân chỉnh game (máu quái, giá đồ, phần thưởng nhiệm vụ...) thì sửa trong file này.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_LEVEL = 20;
  const BAG_SIZE = 40;
  const STORAGE_SIZE = 60;
  const STAT_POINTS_PER_LEVEL = 3;

  // ---------------------------------------------------------------- Class (chọn ở cấp 5)
  // special: class đặc biệt, không có trong danh sách chọn, chỉ mở bằng mã code ở Lữ khách bí ẩn
  const SCHOOLS = {
    kiem_si: {
      name: 'Kiếm Sĩ', weapon: 'kiem', color: 0xff5a4e, icon: '⚔️',
      desc: 'Cận chiến bằng kiếm, lướt và chém liên hoàn, chịu đòn tốt. Tấn công +10%, phòng thủ +10%.',
      bonus: { atk: 1.10, def: 1.10 },
    },
    cung_thu: {
      name: 'Cung Thủ', weapon: 'cung', color: 0x4fd18b, icon: '🏹',
      desc: 'Bắn cung từ xa, chí mạng cao nhưng máu mỏng. Tấn công +15%, chí mạng +5%, máu -8%.',
      bonus: { atk: 1.15, critAdd: 5, hp: 0.92 },
    },
    phap_su: {
      name: 'Pháp Sư', weapon: 'truong', color: 0x6c8cff, icon: '🔮',
      desc: 'Dùng trượng phép khống chế quái, tự hồi máu và đỡ đòn bằng năng lượng. Máu +12%, năng lượng +25%.',
      bonus: { hp: 1.12, mp: 1.25 },
    },
    toan_nang: {
      name: 'Toàn Năng', weapon: 'all', color: 0xffc94a, icon: '✴️', special: true,
      desc: 'Class đặc biệt, chỉ thức tỉnh được bằng mật mã. Dùng mọi vũ khí, học mọi kỹ năng của các class, ' +
        'có cả 3 nội tại, thêm 1 ô kỹ năng và tuyệt kỹ riêng. Máu, tấn công, năng lượng +200%.',
      // +200% = nhân 3. Muốn nhẹ hơn thì giảm các số này (ví dụ 2 = +100%)
      bonus: { hp: 3, atk: 3, mp: 3 },
    },
  };

  // Hạng thợ săn theo cấp
  const RANKS = [[20, 'A'], [15, 'B'], [10, 'C'], [5, 'D'], [1, 'E']];
  function rankOf(level) { return RANKS.find(([lv]) => level >= lv)[1]; }

  // ---------------------------------------------------------------- Vũ khí đánh thường
  const WEAPON_TYPES = {
    tay: { name: 'Tay không', range: 46, cooldown: 400, mult: 0.8, style: 'melee' },
    kiem: { name: 'Kiếm', range: 74, cooldown: 360, mult: 1.0, style: 'melee' },
    cung: { name: 'Cung', range: 400, cooldown: 430, mult: 0.9, style: 'projectile' },
    truong: { name: 'Trượng', range: 170, cooldown: 480, mult: 0.85, style: 'wave' },
  };

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
  };

  // Nội tại: luôn có tác dụng sau khi thức tỉnh class
  const PASSIVES = {
    kiem_si: { icon: '❤️', name: 'Kiếm Tâm', desc: 'Mỗi lần đánh thường trúng quái hồi 1% máu tối đa.' },
    cung_thu: { icon: '🎯', name: 'Yếu Điểm', desc: 'Đòn chí mạng gây 180% sát thương thay vì 160%.' },
    phap_su: { icon: '💠', name: 'Dòng Chảy', desc: 'Hồi năng lượng nhanh gấp đôi.' },
  };
  function passivesOf(player) {
    if (!player.school) return [];
    if (player.school === 'toan_nang') return Object.keys(PASSIVES);
    return PASSIVES[player.school] ? [player.school] : [];
  }

  // Ô kỹ năng: 0–3 ô thường, 4 ô thêm của Toàn Năng, 5 ô tuyệt kỹ
  const SKILL_SLOTS = 6;
  const ULT_SLOT = 5;
  const EXTRA_SLOT = 4;

  // Thông số thực tế của kỹ năng ở một cấp
  function skillAt(id, lv) {
    const base = SKILLS[id];
    if (!base) return null;
    lv = Math.max(1, Math.min(SKILL_MAX, lv || 1));
    const s = { ...base };
    if (lv >= 5 && base.m5) Object.assign(s, base.m5);
    if (lv >= 10 && base.m10) Object.assign(s, base.m10);
    const mul = 1 + 0.1 * (lv - 1);
    if (s.power) s.power = base.power * mul;
    if (s.after) s.after *= mul;
    if (s.finisher) s.finisher *= mul;
    if (s.heal) s.heal = Math.min(0.9, s.heal * (1 + 0.05 * (lv - 1)));
    if (s.atkBuff) s.atkBuff *= (1 + 0.05 * (lv - 1));
    s.mp = Math.round(base.mp * (1 + 0.04 * (lv - 1)));
    if (lv >= 10) s.cd = s.cd * 0.85;
    s.lv = lv;
    return s;
  }
  // Kỹ năng class được học
  function availableSkills(player) {
    if (!player.school) return [];
    return Object.keys(SKILLS).filter(id => {
      const s = SKILLS[id];
      if (player.school === 'toan_nang') return true;
      return s.school === player.school;
    });
  }
  function skillLevel(player, id) { return (player.skills && player.skills[id]) || 0; }

  // ---------------------------------------------------------------- Vật phẩm
  // kind: weapon | armor | potion | material | quest
  // slot (trang bị): weapon | ao | quan | giay | nhan | day_chuyen
  // quality: 1 thường (trắng), 2 tốt (xanh), 3 hiếm (tím)
  const ITEMS = {
    // Thuốc
    binh_mau_nho: { name: 'Bình máu nhỏ', kind: 'potion', hp: 80, price: 10, stack: true, desc: 'Hồi 80 máu.' },
    binh_mau_vua: { name: 'Bình máu vừa', kind: 'potion', hp: 260, price: 40, level: 6, stack: true, desc: 'Hồi 260 máu.' },
    binh_nl_nho: { name: 'Bình năng lượng nhỏ', kind: 'potion', mp: 40, price: 12, stack: true, desc: 'Hồi 40 năng lượng.' },
    binh_nl_vua: { name: 'Bình năng lượng vừa', kind: 'potion', mp: 130, price: 45, level: 6, stack: true, desc: 'Hồi 130 năng lượng.' },

    // Nguyên liệu, vật phẩm nhiệm vụ
    da_cuong_hoa: { name: 'Đá cường hóa', kind: 'material', price: 80, stack: true, desc: 'Dùng để nâng cấp trang bị ở Thợ rèn.' },
    sach_ky_nang: { name: 'Sách kỹ năng', kind: 'book', stack: true, price: 0, desc: 'Đọc để nhận thêm 1 điểm kỹ năng.' },
    manh_vai_den: { name: 'Mảnh huy hiệu đen', kind: 'quest', stack: true, desc: 'Mảnh kim loại đen khắc hình trăng khuyết.' },
    tinh_the_xanh: { name: 'Tinh thể xanh', kind: 'quest', stack: true, desc: 'Tinh thể mát lạnh lấy từ lồng ngực Bộ Xương Pha Lê, hút được năng lượng đỏ.' },
    loi_nang_luong: { name: 'Lõi năng lượng', kind: 'quest', stack: true, desc: 'Vật phẩm nhiệm vụ ngày, rơi từ quái trong cổng.' },
    manh_an_1: { name: 'Lõi cổng đỏ', kind: 'quest', stack: true, desc: 'Lõi năng lượng của Cổng hạng D, vẫn còn đập như tim sống.' },

    // ---- Trang bị. "stats" là chỉ số gốc; đồ rơi từ quái có chỉ số ngẫu nhiên 80–120%,
    //      phẩm chất ngẫu nhiên và dòng phụ. "minQ": phẩm chất thấp nhất khi rơi ra.
    // Trang bị chia bộ theo cấp (xem SETS): mỗi bộ 10 cấp, mỗi món có cấp sử dụng riêng.

    // ===== Bộ I – Tân Binh (cấp 1–10): vải (1–3) → da sói (5–7) → thép (9–10)
    // Vũ khí
    kiem_go: { name: 'Kiếm luyện tập', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: null, level: 1, stats: { atk: 5 }, price: 30 },
    kiem_sat: { name: 'Kiếm thép', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 5, stats: { atk: 14 }, price: 260 },
    cung_go: { name: 'Cung gỗ sồi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 5, stats: { atk: 13, crit: 2 }, price: 260 },
    truong_go: { name: 'Trượng gỗ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 5, stats: { atk: 11, mp: 20 }, price: 260 },
    kiem_thep: { name: 'Kiếm hợp kim', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 10, stats: { atk: 24, def: 2 }, price: 900 },
    cung_hop_kim: { name: 'Cung hợp kim', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 10, stats: { atk: 22, crit: 4 }, price: 900 },
    truong_pha_le: { name: 'Trượng pha lê', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 10, stats: { atk: 19, mp: 40, hp: 35 }, price: 900 },
    // Mũ
    khan_vai: { name: 'Khăn vải', kind: 'armor', slot: 'mu', level: 1, stats: { def: 1, hp: 12 }, price: 45 },
    mu_da: { name: 'Mũ da sói', kind: 'armor', slot: 'mu', level: 5, stats: { def: 4, hp: 32 }, price: 320 },
    mu_thep: { name: 'Mũ thép', kind: 'armor', slot: 'mu', level: 9, stats: { def: 7, hp: 55 }, price: 700 },
    // Áo
    ao_vai: { name: 'Áo khoác vải', kind: 'armor', slot: 'ao', level: 1, stats: { def: 3, hp: 20 }, price: 60 },
    ao_da: { name: 'Áo khoác da sói', kind: 'armor', slot: 'ao', level: 5, stats: { def: 8, hp: 55 }, price: 400 },
    ao_thep: { name: 'Giáp thép', kind: 'armor', slot: 'ao', level: 9, stats: { def: 12, hp: 90 }, price: 900 },
    // Găng tay
    gang_vai: { name: 'Găng vải', kind: 'armor', slot: 'gang_tay', level: 2, stats: { atk: 1, def: 1 }, price: 45 },
    gang_da: { name: 'Găng da sói', kind: 'armor', slot: 'gang_tay', level: 6, stats: { atk: 3, def: 2 }, price: 320 },
    gang_thep: { name: 'Găng thép', kind: 'armor', slot: 'gang_tay', level: 9, stats: { atk: 5, def: 3, crit: 1 }, price: 700 },
    // Đai lưng
    dai_vai: { name: 'Đai vải', kind: 'armor', slot: 'dai_lung', level: 2, stats: { hp: 15, mp: 5 }, price: 45 },
    dai_da: { name: 'Đai da sói', kind: 'armor', slot: 'dai_lung', level: 6, stats: { hp: 45, mp: 15, def: 1 }, price: 320 },
    dai_bac: { name: 'Đai bạc', kind: 'armor', slot: 'dai_lung', level: 9, stats: { hp: 75, mp: 25, def: 2 }, price: 700 },
    // Quần
    quan_vai: { name: 'Quần vải', kind: 'armor', slot: 'quan', level: 3, stats: { def: 2, hp: 15 }, price: 50 },
    quan_da: { name: 'Quần da sói', kind: 'armor', slot: 'quan', level: 6, stats: { def: 6, hp: 40 }, price: 350 },
    quan_thep: { name: 'Quần thép', kind: 'armor', slot: 'quan', level: 9, stats: { def: 9, hp: 65 }, price: 800 },
    // Giày
    giay_vai: { name: 'Giày vải', kind: 'armor', slot: 'giay', level: 3, stats: { def: 1, hp: 10 }, price: 40 },
    giay_da: { name: 'Giày da sói', kind: 'armor', slot: 'giay', level: 6, stats: { def: 4, hp: 25, crit: 1 }, price: 300 },
    giay_thep: { name: 'Giày thép', kind: 'armor', slot: 'giay', level: 9, stats: { def: 6, hp: 40, crit: 1 }, price: 700 },
    // Nhẫn
    nhan_dong: { name: 'Nhẫn đồng', kind: 'armor', slot: 'nhan', level: 3, stats: { atk: 3 }, price: 120 },
    nhan_bac: { name: 'Nhẫn bạc', kind: 'armor', slot: 'nhan', level: 7, stats: { atk: 7, crit: 2 }, price: 600 },
    // Dây chuyền
    day_chuyen_dong: { name: 'Dây chuyền đồng', kind: 'armor', slot: 'day_chuyen', level: 3, stats: { hp: 30, mp: 10 }, price: 120 },
    day_chuyen_bac: { name: 'Dây chuyền bạc', kind: 'armor', slot: 'day_chuyen', level: 7, stats: { hp: 80, mp: 30 }, price: 600 },
    // Ngọc bội
    ngoc_boi_xanh: { name: 'Ngọc bội xanh', kind: 'armor', slot: 'ngoc_boi', level: 3, stats: { hp: 20, mp: 20 }, price: 150 },
    ngoc_boi_luc: { name: 'Ngọc bội lục bảo', kind: 'armor', slot: 'ngoc_boi', level: 7, stats: { hp: 55, mp: 40, crit: 1 }, price: 650 },

    // ===== Bộ II – Thạch Vương (cấp 11–20): đồ chế từ đá pha lê trong Cổng hạng D
    // Mũ
    mu_thach_quy: { name: 'Mũ Thạch Vương', kind: 'armor', slot: 'mu', level: 11, minQ: 3, stats: { def: 9, hp: 90, mp: 20 }, price: 2400 },
    // Áo
    ao_giap_da: { name: 'Giáp đá Thạch Vương', kind: 'armor', slot: 'ao', level: 11, minQ: 3, stats: { def: 15, hp: 140 }, price: 2500 },
    // Găng tay
    gang_thach_quy: { name: 'Găng Thạch Vương', kind: 'armor', slot: 'gang_tay', level: 13, minQ: 3, stats: { atk: 8, def: 5, crit: 2 }, price: 2400 },
    // Đai lưng
    dai_thach_quy: { name: 'Đai đá Thạch Vương', kind: 'armor', slot: 'dai_lung', level: 13, minQ: 3, stats: { def: 6, hp: 110, mp: 35 }, price: 2400 },
    // Quần
    quan_thach_quy: { name: 'Quần đá Thạch Vương', kind: 'armor', slot: 'quan', level: 13, minQ: 3, stats: { def: 14, hp: 120 }, price: 2400 },
    // Giày
    giay_thach_quy: { name: 'Giày đá Thạch Vương', kind: 'armor', slot: 'giay', level: 13, minQ: 3, stats: { def: 9, hp: 60, crit: 1 }, price: 2400 },
    // Nhẫn
    nhan_thach_quy: { name: 'Nhẫn Thạch Vương', kind: 'armor', slot: 'nhan', level: 12, minQ: 3, stats: { atk: 11, crit: 4 }, price: 2500 },
    // Dây chuyền
    day_chuyen_thach_quy: { name: 'Dây chuyền Thạch Vương', kind: 'armor', slot: 'day_chuyen', level: 12, minQ: 3, stats: { hp: 140, mp: 55 }, price: 2500 },
    // Ngọc bội
    ngoc_boi_thach_quy: { name: 'Ngọc bội Thạch Vương', kind: 'armor', slot: 'ngoc_boi', level: 12, minQ: 3, stats: { hp: 110, mp: 70, crit: 2 }, price: 2600 },
    // Vũ khí
    kiem_thach_quy: { name: 'Kiếm Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 14, minQ: 3, stats: { atk: 36, def: 4, hp: 50 }, price: 3000 },
    cung_thach_vuong: { name: 'Cung Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 14, minQ: 3, stats: { atk: 34, crit: 6 }, price: 3000 },
    truong_thach_vuong: { name: 'Trượng Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 14, minQ: 3, stats: { atk: 29, mp: 70, hp: 80 }, price: 3000 },
  };

  const SLOTS = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung', 'quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi'];
  const SLOT_NAMES = {
    weapon: 'Vũ khí', mu: 'Mũ', ao: 'Áo', gang_tay: 'Găng tay', dai_lung: 'Đai lưng',
    quan: 'Quần', giay: 'Giày', nhan: 'Nhẫn', day_chuyen: 'Dây chuyền', ngoc_boi: 'Ngọc bội',
  };

  // ---------------------------------------------------------------- Bộ trang bị theo cấp
  // Cứ 10 cấp là một bộ. Trong mỗi bộ, từng món có cấp sử dụng riêng (ITEMS[id].level),
  // nên mở dần theo cấp chứ không mặc được cả bộ ngay.
  const SET_LEVELS = 10;
  const SETS = [
    { id: 1, name: 'Tân Binh', min: 1, max: 10,
      desc: 'Đồ vải, da sói rồi tới thép của thợ săn mới vào nghề.' },
    { id: 2, name: 'Thạch Vương', min: 11, max: 20,
      desc: 'Trang bị chế từ đá pha lê trong Cổng hạng D.' },
  ];
  // Bộ của một cấp; cấp vượt quá bộ cuối thì thuộc bộ cuối
  function setOfLevel(level) {
    const lv = Math.max(1, Math.floor(level || 1));
    return SETS[Math.min(SETS.length - 1, Math.floor((lv - 1) / SET_LEVELS))];
  }
  // Bộ của một món trang bị (vật phẩm không phải trang bị thì trả về null)
  function setOfItem(def) { return def && def.slot ? setOfLevel(def.level || 1) : null; }

  // ---------------------------------------------------------------- Phẩm chất và dòng phụ
  const QUALITY_NAMES = { 1: 'Thường', 2: 'Tốt', 3: 'Hiếm', 4: 'Huyền thoại' };
  const QUALITY_MUL = { 1: 1, 2: 1.1, 3: 1.2, 4: 1.35 };   // nhân chỉ số chính
  const QUALITY_AFFIX = { 1: 0, 2: 1, 3: 2, 4: 3 };       // số dòng phụ
  const QUALITY_PRICE = { 1: 1, 2: 2, 3: 4, 4: 8 };       // nhân giá bán
  // Tỉ lệ phẩm chất khi rơi: [thường, tốt, hiếm, huyền thoại]
  const QUALITY_ODDS = { normal: [0.62, 0.30, 0.07, 0.01], boss: [0, 0, 0.8, 0.2] };

  // Dòng phụ: giá trị ngẫu nhiên trong khoảng [min, max], tăng theo cấp món đồ
  const AFFIXES = {
    hp: { name: 'Máu', min: (l) => 8 + l * 5, max: (l) => 16 + l * 9 },
    mp: { name: 'Năng lượng', min: (l) => 5 + l * 3, max: (l) => 10 + l * 5 },
    atk: { name: 'Tấn công', min: (l) => 1 + l * 0.5, max: (l) => 2 + l * 1.1 },
    def: { name: 'Phòng thủ', min: (l) => 1 + l * 0.4, max: (l) => 2 + l * 0.8 },
    crit: { name: 'Chí mạng', unit: '%', min: () => 1, max: (l) => 2 + l * 0.25 },
    lifesteal: { name: 'Hút máu', unit: '%', min: () => 1, max: (l) => 2 + l * 0.15 },
    cdr: { name: 'Giảm hồi chiêu', unit: '%', min: () => 2, max: (l) => 4 + l * 0.4 },
    speed: { name: 'Tốc chạy', min: () => 4, max: (l) => 8 + l },
    boss: { name: 'Sát thương lên trùm', unit: '%', min: () => 3, max: (l) => 6 + l * 0.6 },
    goldfind: { name: 'Xu rơi thêm', unit: '%', min: () => 5, max: (l) => 12 + l },
    expfind: { name: 'Kinh nghiệm thêm', unit: '%', min: () => 3, max: (l) => 6 + l * 0.5 },
  };
  const STAT_NAMES = { atk: 'Tấn công', def: 'Phòng thủ', hp: 'Máu', mp: 'Năng lượng', crit: 'Chí mạng' };
  function statLabel(k) { return (AFFIXES[k] && AFFIXES[k].name) || STAT_NAMES[k] || k; }
  function statUnit(k) { return k === 'crit' ? '%' : (AFFIXES[k] && AFFIXES[k].unit) || ''; }

  // ---------------------------------------------------------------- Quái
  // drops: [itemId, tỉ lệ 0..1, (tùy chọn) chỉ rơi khi đang làm nhiệm vụ]
  // gear:  [tỉ lệ rơi 1 món trang bị, [danh sách món có thể rơi]]
  const MONSTERS = {
    bong_do: { name: 'Mắt Đỏ', level: 1, hp: 26, atk: 5, def: 0, exp: 8, gold: [1, 3],
      speed: 45, respawn: 5, look: 'shade', drops: [] },
    hinh_nhan: { name: 'Hình nhân', level: 1, hp: 30, atk: 0, def: 0, exp: 4, gold: [0, 0],
      speed: 0, passive: true, respawn: 2, look: 'dummy', drops: [] },
    nam_doc: { name: 'Nấm Độc', level: 2, hp: 60, atk: 9, def: 1, exp: 10, gold: [2, 6],
      speed: 35, respawn: 6, look: 'mushroom',
      drops: [['binh_mau_nho', 0.12]],
      gear: [0.04, ['khan_vai', 'gang_vai', 'dai_vai', 'quan_vai', 'giay_vai', 'ao_vai']] },
    soi_tre: { name: 'Yêu Tinh', level: 4, hp: 120, atk: 15, def: 3, exp: 22, gold: [5, 12],
      speed: 80, respawn: 8, look: 'wolf',
      drops: [['manh_vai_den', 0.5, 'q5'], ['binh_mau_nho', 0.15], ['da_cuong_hoa', 0.02]],
      gear: [0.05, ['ao_da', 'quan_da', 'giay_da', 'mu_da', 'gang_da', 'dai_da', 'nhan_dong', 'day_chuyen_dong', 'ngoc_boi_xanh']] },
    ech_suong: { name: 'Slime Sương', level: 6, hp: 190, atk: 20, def: 5, exp: 35, gold: [8, 16],
      speed: 60, respawn: 8, look: 'frog', jumper: true,
      drops: [['binh_nl_nho', 0.15], ['da_cuong_hoa', 0.05]],
      gear: [0.05, ['mu_da', 'gang_da', 'dai_da', 'ao_da', 'nhan_bac', 'day_chuyen_bac', 'ngoc_boi_luc']] },
    doi_hang: { name: 'Dơi Hang', level: 7, hp: 170, atk: 24, def: 4, exp: 50, gold: [10, 20],
      speed: 90, respawn: 8, look: 'bat', fly: true,
      drops: [['binh_mau_vua', 0.08], ['da_cuong_hoa', 0.06]],
      gear: [0.05, ['ao_da', 'quan_da', 'giay_da', 'mu_da', 'gang_da', 'dai_da', 'nhan_bac', 'day_chuyen_bac', 'ngoc_boi_luc']] },
    nhen_da: { name: 'Bộ Xương Pha Lê', level: 9, hp: 320, atk: 30, def: 10, exp: 80, gold: [15, 30],
      speed: 70, respawn: 10, look: 'spider',
      drops: [['tinh_the_xanh', 0.5, 'q8'], ['binh_nl_vua', 0.08], ['da_cuong_hoa', 0.1]],
      gear: [0.06, ['ao_thep', 'quan_thep', 'giay_thep', 'gang_thep', 'nhan_bac', 'day_chuyen_bac', 'kiem_thep', 'cung_hop_kim', 'truong_pha_le']] },
    thach_quy: { name: 'Thạch Vương', level: 12, hp: 4200, atk: 46, def: 15, exp: 1500, gold: [300, 500],
      speed: 55, respawn: 300, look: 'golem', boss: true,
      drops: [['da_cuong_hoa', 1], ['da_cuong_hoa', 0.6], ['da_cuong_hoa', 0.3], ['sach_ky_nang', 0.3]],
      // Trùm chắc chắn rơi 1 món (hiếm hoặc huyền thoại), 35% rơi thêm món thứ hai
      gear: [1, ['kiem_thach_quy', 'cung_thach_vuong', 'truong_thach_vuong',
        'ao_giap_da', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy', 'giay_thach_quy',
        'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy'], 0.35] },
  };

  // ---------------------------------------------------------------- NPC
  // appear: NPC chỉ xuất hiện ở bản đồ đó khi tiến độ cốt truyện (chỉ số nhiệm vụ) nằm trong khoảng [từ, đến]
  const NPCS = {
    he_thong: { name: 'Hệ thống', role: 'quest', color: 0x3fd0ff,
      greet: '[Hệ thống] Người chơi đã tỉnh lại. Đang chờ lệnh.' },
    lao_su: { name: 'Hội trưởng Khải', role: 'quest', color: 0x2b3a55,
      greet: 'Thợ săn mới à? Ở Tân Đô này, cổng mở ra mỗi ngày. Ai cũng cần người đủ gan bước vào.' },
    vy: { name: 'Vy', role: 'quest', color: 0x7a2b4a,
      greet: 'Đừng nhìn tôi như vậy, hạng C cũng là thợ săn thôi. Theo sát tôi là được.',
      appear: { lang: [[0, 4], [10, 99]], rung: [[4, 7]], hang: [[7, 9]] } },
    bang_nv: { name: 'Bảng nhiệm vụ', role: 'daily', color: 0x3b4a5a,
      greet: 'Bảng nhiệm vụ của Hiệp Hội. Mỗi ngày có 3 việc mới, làm mới lúc 0 giờ.' },
    tho_ren: { name: 'Thợ chế tác Thiết', role: 'smith', color: 0x5d4a3a,
      greet: 'Đồ rơi từ cổng thì phải qua tay ta mới thành vũ khí thật sự. Đưa đây xem nào!' },
    ba_thuoc: { name: 'Dược sư Lan', role: 'shop', color: 0x2f7d6d,
      greet: 'Vào cổng mà không mang thuốc là tự sát đấy, cậu nhóc.',
      shop: ['binh_mau_nho', 'binh_nl_nho', 'binh_mau_vua', 'binh_nl_vua'] },
    tap_hoa: { name: 'Chủ tiệm Tư', role: 'shop', color: 0x6b4fa0,
      greet: 'Trang bị cho thợ săn mới vào nghề đây! Bán gì cũng mua, giá hữu nghị.',
      shop: ['khan_vai', 'ao_vai', 'gang_vai', 'dai_vai', 'quan_vai', 'giay_vai', 'nhan_dong', 'day_chuyen_dong', 'ngoc_boi_xanh',
        'kiem_go', 'kiem_sat', 'cung_go', 'truong_go', 'da_cuong_hoa'] },
    thu_kho: { name: 'Quản kho Bảo', role: 'storage', color: 0x3b4a5a,
      greet: 'Kho của Hiệp Hội, khóa ba lớp. Gửi gì cũng giữ nguyên vẹn.' },
    lu_khach: { name: 'Lữ khách bí ẩn', role: 'mystic', color: 0x3a2a55,
      greet: 'Cậu cũng nghe thấy giọng nói của Hệ thống, phải không? Nó không chọn ngẫu nhiên đâu. Nếu cậu biết mật mã, ta sẽ chỉ cho cậu một con đường khác.' },
  };

  // ---------------------------------------------------------------- Nhiệm vụ chính tuyến · Chương 1: Cổng đỏ
  // obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
  const QUESTS = [
    { id: 'q0', name: 'Tỉnh dậy trong Cổng đỏ', npc: 'he_thong',
      start: [
        '...Lạnh. Mùi sắt gỉ. Bạn mở mắt giữa một hang đá nhuộm màu đỏ máu.',
        'Bạn chỉ nhớ một tia sáng đỏ lóe lên giữa phố, rồi mặt đất dưới chân biến mất.',
        '[Hệ thống] Phát hiện năng lượng thức tỉnh. Đăng ký người chơi... hoàn tất.',
        '[Hệ thống] Cảnh báo: bạn đang ở bên trong một Cổng chưa được phân hạng.',
        '[Hệ thống] Nhiệm vụ khẩn cấp: tiêu diệt 3 Mắt Đỏ để mở lối ra. Thất bại đồng nghĩa với cái chết.',
        '(Phím J để đánh, mũi tên hoặc A/D để di chuyển, Space để nhảy.)',
      ],
      obj: { kill: { bong_do: 3 } },
      end: [
        '[Hệ thống] Nhiệm vụ khẩn cấp hoàn thành. Lối ra đã mở ở cuối hang.',
        '[Hệ thống] Người chơi được ghi nhận. Mọi tiến bộ của bạn từ nay sẽ được ghi lại.',
        'Giọng nói tắt lịm. Phía cuối hang, một vòng sáng xanh bắt đầu xoay.',
      ],
      reward: { exp: 30, gold: 30, items: [['binh_mau_nho', 3]] } },

    { id: 'q1', name: 'Bài kiểm tra thức tỉnh', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Cậu bước ra từ cái cổng đỏ ở giữa phố? Sống sót trở ra một mình... hiếm thấy đấy.',
        'Hội trưởng Khải: Ai thức tỉnh cũng phải qua kiểm tra trước khi được cấp giấy phép thợ săn.',
        'Hội trưởng Khải: Ra bãi tập phía đông, phá 3 hình nhân rồi quay lại đây.',
      ],
      obj: { kill: { hinh_nhan: 3 } },
      end: ['Hội trưởng Khải: Không tệ. Đây là kiếm luyện tập, nhớ trang bị vào (phím I mở túi đồ).',
        '[Hệ thống] Đã cấp giấy phép Thợ săn hạng E.'],
      reward: { exp: 40, gold: 50, items: [['kiem_go', 1]] } },

    { id: 'q2', name: 'Làm quen Hiệp Hội', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Thợ săn giỏi không đi một mình. Hãy làm quen người của Hiệp Hội.',
        'Hội trưởng Khải: Chào Thợ chế tác Thiết, Dược sư Lan, và cô gái đứng gần cửa kia: Vy, thợ săn hạng C.',
      ],
      obj: { visit: ['tho_ren', 'ba_thuoc', 'vy'] },
      end: ['Hội trưởng Khải: Dược sư Lan gửi cậu mấy bình thuốc. Vào cổng nhớ dùng (phím Q).'],
      reward: { exp: 30, gold: 20, items: [['binh_mau_nho', 5], ['binh_nl_nho', 3]] } },

    { id: 'q3', name: 'Cổng đỏ', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Cái cổng cậu kẹt bên trong không phải trường hợp đầu tiên.',
        'Hội trưởng Khải: Mấy tháng nay, lõi của nhiều cổng bị nhiễm năng lượng đỏ. Quái trong đó mạnh lên, hung dữ hơn.',
        'Hội trưởng Khải: Chúng tôi nghi một nhóm thợ săn ngầm tự xưng là Hắc Nguyệt đứng sau chuyện này.',
        'Hội trưởng Khải: Một Cổng hạng E vừa mở ở cuối phố. Vy sẽ đi cùng cậu.',
        '[Hệ thống] Nhiệm vụ đặc biệt đã được mở khóa: Điều tra Cổng đỏ.',
      ],
      obj: {},
      end: ['Hội trưởng Khải: Gặp Vy trước khi vào cổng. Đừng có liều.'],
      reward: { exp: 30, gold: 30, items: [] } },

    { id: 'q4', name: 'Đồng đội', npc: 'vy',
      start: [
        'Vy: Vậy cậu là người sống sót từ Cổng đỏ. Trông cũng... bình thường.',
        'Vy: Nghe này. Trong cổng, Nấm Độc mọc tràn hết lối đi. Dọn 10 con, tôi sẽ đợi ở lối vào Rừng Sương.',
      ],
      obj: { kill: { nam_doc: 10 } },
      end: ['Vy: Được đấy. Tay kiếm cậu không tệ như tôi nghĩ.', 'Vy: Nhưng có gì đó sai sai. Quái ở đây đáng lẽ không hung dữ thế này.'],
      reward: { exp: 150, gold: 100, items: [['binh_mau_nho', 5]] } },

    { id: 'q5', name: 'Dấu vết Hắc Nguyệt', npc: 'vy',
      start: [
        'Vy: Bọn Yêu Tinh trong rừng mang theo những mảnh kim loại đen. Nhìn này, có khắc hình gì đó.',
        'Vy: Thu thêm 5 mảnh. Nếu đúng là huy hiệu của Hắc Nguyệt, chúng đã vào cổng trước chúng ta.',
      ],
      obj: { collect: { manh_vai_den: 5 } },
      end: [
        'Vy: Trăng khuyết đen... đúng là chúng rồi. Ba năm trước, Hắc Nguyệt đã giết cả đội của tôi.',
        'Vy: Tôi muốn đuổi theo ngay, nhưng cậu còn yếu lắm. Về gặp Hội trưởng đi, ông ấy sẽ giúp cậu mạnh lên.',
        'Vy: Mặc chiếc áo khoác này vào. Của đồng đội cũ của tôi.',
      ],
      reward: { exp: 250, gold: 100, items: [['ao_vai', 1]] } },

    { id: 'q6', name: 'Thức tỉnh lần hai', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Vy kể rồi. Nếu là Hắc Nguyệt, cậu cần nhiều hơn một thanh kiếm luyện tập.',
        'Hội trưởng Khải: Đạt cấp 5 rồi quay lại, ta sẽ giúp cậu thức tỉnh class.',
      ],
      obj: { level: 5, school: true },
      end: ['[Hệ thống] Thức tỉnh thành công. Hãy học kỹ năng bằng điểm kỹ năng (phím K).',
        'Hội trưởng Khải: Vy đang chờ cậu ở Rừng Sương. Cổng hạng D ở cuối rừng đã cho phép cậu vào.'],
      reward: { exp: 200, gold: 150, items: [], schoolWeapon: true } },

    { id: 'q7', name: 'Cổng hạng D', npc: 'vy',
      start: [
        'Vy: Cuối cùng cũng tới. Dấu vết dẫn vào Hang Pha Lê, một Cổng hạng D.',
        'Vy: Tôi vào trước dò đường. Đàn Dơi Hang trong đó bị năng lượng đỏ làm cho điên loạn, hạ 15 con rồi tìm tôi.',
      ],
      obj: { kill: { doi_hang: 15 } },
      end: [
        'Vy: ...Cậu tới rồi. Đừng lo, chỉ là vết xước.',
        'Vy: Tôi gặp hắn. Một gã đeo mặt nạ hình trăng. Hắn chỉ vung tay một cái, tôi đã bay xa mười mét.',
      ],
      reward: { exp: 800, gold: 200, items: [['da_cuong_hoa', 3]] } },

    { id: 'q8', name: 'Vết thương của Vy', npc: 'vy',
      start: [
        'Vy: Vết thương này nhiễm năng lượng đỏ, thuốc thường không ăn thua.',
        'Vy: Bộ Xương Pha Lê trong hang có Tinh thể xanh trong lồng ngực. Mang về 5 viên, tôi tự lo được phần còn lại.',
      ],
      obj: { collect: { tinh_the_xanh: 5 } },
      end: ['Vy: Đỡ hơn nhiều rồi. Cảm ơn... đồng đội.', 'Vy: Gã mặt nạ đi về phía sâu nhất của hang, nơi lõi cổng đang đập.'],
      reward: { exp: 600, gold: 200, items: [['binh_mau_vua', 5]] } },

    { id: 'q9', name: 'Chủ nhân của cổng', npc: 'vy',
      start: [
        'Vy: Lõi cổng nhiễm đỏ đã biến một khối đá cổ thành Thạch Vương.',
        'Vy: Khi nó yếu đi, nó sẽ nổi điên và gọi thêm quái. Nhảy qua sóng đá của nó, đừng đứng yên.',
        'Vy: Tôi sẽ giữ lối ra. Đi đi.',
      ],
      obj: { kill: { thach_quy: 1 } },
      end: [
        'Thạch Vương vỡ vụn. Giữa đống đá, Lõi cổng đỏ vẫn đập như một trái tim.',
        '???: Đáng tiếc. Ta đã mất ba tháng để nuôi nó.',
        'Một bóng người đeo mặt nạ trăng khuyết bước ra từ khe tối. Hắn nhặt nửa lõi cổng, rồi tan vào không khí.',
        'Vy: Là hắn... Kẻ Đeo Mặt Nạ Trăng.',
        '[Hệ thống] Phát hiện thực thể không xác định. Dữ liệu không đủ để phân tích.',
      ],
      reward: { exp: 2000, gold: 500, items: [['manh_an_1', 1], ['nhan_thach_quy', 1]] } },

    { id: 'q10', name: 'Báo cáo Hiệp Hội', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Nửa lõi cổng... và một gã đeo mặt nạ biến mất giữa không khí.',
        'Hội trưởng Khải: Nếu Hắc Nguyệt gom đủ lõi đỏ, chúng có thể mở một cổng mà không ai đóng nổi.',
        'Hội trưởng Khải: Hệ thống chọn cậu không phải ngẫu nhiên. Từ hôm nay, cậu và Vy là một đội.',
      ],
      obj: {},
      end: [
        '[Hệ thống] Chương 1 – Cổng đỏ: hoàn thành. Phần thưởng chương đã được gửi.',
        '— Chương 2 "Bóng Trăng Khuyết" sẽ có ở bản cập nhật sau. —',
      ],
      reward: { exp: 500, gold: 300, skillPoints: 2, items: [['sach_ky_nang', 1]] } },
  ];
  // Thứ tự nhiệm vụ của phiên bản trước (để chuyển tiến độ cũ sang)
  const OLD_QUEST_ORDER = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
  const OLD_QUEST_MAP = { q8: 'q9' };
  const QUEST_VERSION = 2;

  // NPC có đang xuất hiện ở bản đồ này với tiến độ hiện tại không
  function npcHere(player, mapId, npcId) {
    const m = MAPS[mapId];
    if (!m || !Object.values(m.npcs).includes(npcId)) return false;
    const ap = NPCS[npcId] && NPCS[npcId].appear;
    if (!ap) return true;
    const ranges = ap[mapId];
    if (!ranges) return false;
    const step = player.quest.step;
    return ranges.some(([a, b]) => step >= a && step <= b);
  }

  // ---------------------------------------------------------------- Bản đồ
  // File bản đồ nằm trong shared/maps/<id>.txt. Ký hiệu:
  //   .  trống          #  nền (đứng được, không đi xuyên)
  //   =  bục (nhảy lên từ dưới được)
  //   S  điểm xuất hiện mặc định     < >  cổng chuyển bản đồ
  //   chữ thường: chỗ quái xuất hiện (xem spawns)   chữ hoa: NPC (xem npcs)
  //   &  cây   $  tòa nhà / cửa tiệm   !  đèn đường / tinh thể   ^  tinh thể / nhũ đá
  const MAPS = {
    cong_do: { name: 'Cổng đỏ chưa phân hạng', theme: 'redgate',
      spawns: { r: 'bong_do' },
      npcs: { H: 'he_thong' },
      portals: { '>': { to: 'lang', at: 'S', require: 'q0' } } },
    lang: { name: 'Tân Đô – Khu Hiệp Hội', theme: 'city',
      spawns: { d: 'hinh_nhan' },
      npcs: { L: 'lao_su', V: 'vy', N: 'bang_nv', R: 'tho_ren', B: 'ba_thuoc', G: 'tap_hoa', K: 'thu_kho', M: 'lu_khach' },
      portals: { '>': { to: 'rung', at: '<' } } },
    rung: { name: 'Cổng hạng E – Rừng Sương', theme: 'forest', require: 'q3',
      spawns: { a: 'nam_doc', b: 'soi_tre', c: 'ech_suong' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: '>' }, '>': { to: 'hang', at: '<' } } },
    hang: { name: 'Cổng hạng D – Hang Pha Lê', theme: 'cave', require: 'q6',
      spawns: { a: 'doi_hang', b: 'nhen_da', z: 'thach_quy' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'rung', at: '>' } } },
  };
  const NEW_PLAYER_MAP = 'cong_do';

  const START_MAP = 'lang';
  const TILE = 32;

  // ---------------------------------------------------------------- Công thức
  function expToNext(level) {
    return Math.floor(40 * Math.pow(level, 1.7));
  }

  // ---------------------------------------------------------------- Nhiệm vụ hằng ngày (bảng nhiệm vụ Hiệp Hội)
  // Mỗi ngày 3 nhiệm vụ, làm mới lúc 0 giờ (giờ Việt Nam). Xong cả 3 nhận thêm thưởng.
  const DAILY_COUNT = 3;
  const DAILY_BONUS = { stones: 2, items: [['sach_ky_nang', 1]] };
  // Ngày theo giờ Việt Nam (UTC+7), dạng 2026-11-04
  function dailyDate(ms = Date.now()) {
    return new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
  }
  // Phần thưởng mỗi nhiệm vụ ngày theo cấp nhân vật
  function dailyReward(level) {
    return { exp: Math.round(expToNext(level) * 0.22), gold: 40 * level, stones: 1 };
  }

  // Nâng cấp: tỉ lệ thành công khi nâng từ +n lên +(n+1)
  const UPGRADE_MAX = 12;
  const UPGRADE_RATES = [1, 1, 1, 1, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15];
  function upgradeCost(plus) {
    return { gold: 15 * (plus + 1) * (plus + 1), stones: Math.ceil((plus + 1) / 3) };
  }
  // Thất bại khi nâng lên +8 trở lên thì bị giảm 1 cấp
  function upgradeFailDrops(plus) { return plus + 1 >= 8; }

  // ---------------------------------------------------------------- Trang bị theo từng món
  // Mỗi món trang bị trong túi: { uid, id, qty, plus, q (phẩm chất), roll (0.8–1.2), aff: [[dòng phụ, giá trị, độ tốt 0..1]] }

  // Đồ cũ (trước khi có hệ thống ngẫu nhiên) được coi như chỉ số chuẩn
  function normalizeInst(e) {
    if (!e) return e;
    const def = ITEMS[e.id];
    if (def && def.slot) {
      if (e.q == null) e.q = def.minQ || 1;
      if (e.roll == null) e.roll = 1;
      if (!Array.isArray(e.aff)) e.aff = [];
      if (e.plus == null) e.plus = 0;
    }
    return e;
  }

  const r1 = (v) => Math.round(v * 10) / 10;

  // Chỉ số của một món: chỉ số chính (nhân độ ngẫu nhiên, phẩm chất, cấp nâng) + dòng phụ
  function instStats(inst) {
    const def = ITEMS[inst.id];
    const main = {}, aff = {}, all = {};
    if (!def || !def.stats) return { main, aff, all };
    const mul = (inst.roll || 1) * QUALITY_MUL[inst.q || 1] * (1 + 0.08 * (inst.plus || 0));
    for (const k in def.stats) {
      const v = def.stats[k] * mul;
      main[k] = k === 'crit' ? r1(v) : Math.round(v);
    }
    for (const [k, v] of inst.aff || []) aff[k] = r1((aff[k] || 0) + v);
    for (const k in main) all[k] = main[k];
    for (const k in aff) all[k] = r1((all[k] || 0) + aff[k]);
    return { main, aff, all };
  }

  function rollQuality(table, minQ) {
    const odds = QUALITY_ODDS[table] || QUALITY_ODDS.normal;
    let x = Math.random(), q = 1;
    for (let i = 0; i < odds.length; i++) { if (x < odds[i]) { q = i + 1; break; } x -= odds[i]; q = i + 1; }
    return Math.max(q, minQ || 1);
  }

  function rollAffixes(def, q, count) {
    const n = count != null ? count : QUALITY_AFFIX[q];
    const keys = Object.keys(AFFIXES);
    const out = [];
    const lv = def.level || 1;
    while (out.length < n && keys.length) {
      const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0];
      const a = AFFIXES[k];
      const p = Math.random();
      let v = a.min(lv) + (a.max(lv) - a.min(lv)) * p;
      v = a.unit === '%' ? r1(v) : Math.max(1, Math.round(v));
      out.push([k, v, Math.round(p * 100) / 100]);
    }
    return out;
  }

  // Tạo một món mới. opts.plain = true: đồ cửa hàng (thường, chỉ số chuẩn 100%, không dòng phụ)
  function makeInst(id, opts = {}) {
    const def = ITEMS[id];
    if (!def.slot) return { id, qty: opts.qty || 1, plus: 0 };
    if (opts.plain) return { id, qty: 1, plus: 0, q: def.minQ || 1, roll: 1, aff: def.minQ ? rollAffixes(def, def.minQ) : [] };
    const q = opts.q || rollQuality(opts.table || 'normal', def.minQ);
    const roll = Math.round((0.8 + Math.random() * 0.4) * 1000) / 1000;
    return { id, qty: 1, plus: 0, q, roll, aff: rollAffixes(def, q) };
  }

  // Độ hoàn hảo 0–100%: chỉ số chính và các dòng phụ ra cao hay thấp trong khoảng có thể
  function perfection(inst) {
    const parts = [((inst.roll || 1) - 0.8) / 0.4];
    for (const a of inst.aff || []) parts.push(a[2] != null ? a[2] : 0.5);
    return Math.round(parts.reduce((s, x) => s + x, 0) / parts.length * 100);
  }

  function sellPrice(inst) {
    const def = ITEMS[inst.id];
    if (!def || !def.price || def.kind === 'quest') return 0;
    if (!def.slot) return Math.floor(def.price / 4);
    return Math.floor(def.price / 4 * QUALITY_PRICE[inst.q || 1] * (1 + (inst.plus || 0) * 0.25));
  }

  function canUseItem(player, def) {
    if (!def || !def.slot) return false;
    if ((def.level || 1) > player.level) return false;
    if (def.slot === 'weapon' && def.school && player.school !== 'toan_nang' && def.school !== player.school) return false;
    return true;
  }

  // Tính chỉ số cuối cùng của nhân vật từ cấp, điểm tiềm năng, trang bị và class
  function calcStats(player) {
    const lv = player.level;
    const p = player.points;
    const eq = { hp: 0, mp: 0, atk: 0, def: 0, crit: 0, lifesteal: 0, cdr: 0, speed: 0, boss: 0, goldfind: 0, expfind: 0 };
    for (const slot of SLOTS) {
      const it = player.equip[slot];
      if (!it) continue;
      const s = instStats(normalizeInst(it)).all;
      for (const k in s) eq[k] = (eq[k] || 0) + s[k];
    }
    let hp = 80 + 18 * (lv - 1) + p.vit * 10 + eq.hp;
    let mp = 30 + 6 * (lv - 1) + p.spi * 6 + eq.mp;
    let atk = 5 + 2 * (lv - 1) + p.str * 2 + eq.atk;
    let def = 1 + (lv - 1) + Math.floor(p.vit * 0.8) + eq.def;
    let crit = 3 + p.agi * 0.4 + eq.crit;
    const speed = Math.min(290, Math.min(260, 190 + p.agi * 2) + eq.speed);
    let skillMul = 1 + p.spi * 0.015;
    let costMul = 1;
    const sc = player.school && SCHOOLS[player.school];
    if (sc) {
      const b = sc.bonus;
      if (b.hp) hp *= b.hp;
      if (b.mp) mp *= b.mp;
      if (b.atk) atk *= b.atk;
      if (b.def) def *= b.def;
      if (b.critAdd) crit += b.critAdd;
      if (sc.skillPower) skillMul *= sc.skillPower;
      if (sc.skillCost) costMul = sc.skillCost;
    }
    const w = player.equip.weapon;
    const wtype = w ? ITEMS[w.id].wtype : 'tay';
    return {
      maxHp: Math.round(hp), maxMp: Math.round(mp), atk: Math.round(atk), def: Math.round(def),
      crit: Math.min(60, r1(crit)), speed, skillMul, costMul, wtype,
      lifesteal: Math.min(15, r1(eq.lifesteal)),   // tối đa 15%
      cdr: Math.min(30, r1(eq.cdr)),               // tối đa 30%
      boss: r1(eq.boss), goldfind: r1(eq.goldfind), expfind: r1(eq.expfind),
    };
  }


  function newPlayer(name) {
    return {
      name,
      level: 1, exp: 0, gold: 50,
      school: null,
      points: { str: 5, vit: 5, agi: 5, spi: 5 }, freePoints: 0,
      hp: null, mp: null,
      map: NEW_PLAYER_MAP, x: null, y: null,
      equip: Object.fromEntries(SLOTS.map(sl => [sl, null])),
      bag: [], storage: [],
      skillSlots: Array(SKILL_SLOTS).fill(null),
      skills: {}, skillPoints: 0,
      unlocks: {}, redeemed: [],
      quest: { step: 0, state: 'none', progress: {}, ver: QUEST_VERSION },
      daily: null,
      kills: {},
      nextUid: 1,
      created: Date.now(),
    };
  }

  function questDone(player, questId) {
    const idx = QUESTS.findIndex(q => q.id === questId);
    return idx >= 0 && player.quest.step > idx;
  }

  return {
    MAX_LEVEL, BAG_SIZE, STORAGE_SIZE, STAT_POINTS_PER_LEVEL, TILE, START_MAP,
    SCHOOLS, RANKS, rankOf, WEAPON_TYPES, SKILLS, SKILL_MAX, PASSIVES, passivesOf, SKILL_SLOTS, ULT_SLOT, EXTRA_SLOT, skillAt, skillLevel, ITEMS, SLOTS, SLOT_NAMES, SETS, SET_LEVELS, setOfLevel, setOfItem, QUALITY_NAMES, QUALITY_MUL, QUALITY_AFFIX, QUALITY_ODDS, AFFIXES,
    MONSTERS, NPCS, QUESTS, MAPS, NEW_PLAYER_MAP, npcHere, OLD_QUEST_ORDER, OLD_QUEST_MAP, QUEST_VERSION,
    DAILY_COUNT, DAILY_BONUS, dailyDate, dailyReward,
    UPGRADE_MAX, UPGRADE_RATES, upgradeCost, upgradeFailDrops,
    expToNext, instStats, makeInst, rollQuality, rollAffixes, perfection, sellPrice, statLabel, statUnit, normalizeInst,
    canUseItem, calcStats, availableSkills, newPlayer, questDone,
  };
});
