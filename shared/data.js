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
  const SCHOOLS = {
    kiem_si: {
      name: 'Kiếm Sĩ', weapon: 'kiem', color: 0xff5a4e, icon: '⚔️',
      desc: 'Cận chiến bằng kiếm, lướt và chém liên hoàn. Tấn công +10%, phòng thủ +10%.',
      bonus: { atk: 1.10, def: 1.10 },
    },
    cung_thu: {
      name: 'Cung Thủ', weapon: 'cung', color: 0x4fd18b, icon: '🏹',
      desc: 'Bắn cung từ xa, sát thương cao nhưng máu mỏng. Tấn công +15%, chí mạng +5%, máu -8%.',
      bonus: { atk: 1.15, critAdd: 5, hp: 0.92 },
    },
    phap_su: {
      name: 'Pháp Sư', weapon: 'truong', color: 0x6c8cff, icon: '🔮',
      desc: 'Dùng trượng phép khống chế quái và tự hồi máu. Máu +12%, năng lượng +25%.',
      bonus: { hp: 1.12, mp: 1.25 },
    },
    toan_nang: {
      name: 'Toàn Năng', weapon: 'all', color: 0xffc94a, icon: '✴️',
      desc: 'Thức tỉnh dị biệt: dùng được mọi vũ khí và học mọi kỹ năng của các class khác. ' +
        'Đổi lại, kỹ năng chỉ gây 80% sức mạnh và tốn thêm 20% năng lượng.',
      bonus: {}, skillPower: 0.8, skillCost: 1.2,
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
  // type: dash | melee | projectile | spread | aoe | heal | buff
  const SKILLS = {
    pa1: { school: 'kiem_si', name: 'Trảm Kích Lướt', level: 5, mp: 12, cd: 3,
      type: 'dash', power: 1.8, distance: 170, desc: 'Lướt tới trước, chém mọi quái trên đường đi (180%).' },
    pa2: { school: 'kiem_si', name: 'Liên Trảm', level: 10, mp: 20, cd: 6,
      type: 'melee', power: 0.9, hits: 4, range: 100, desc: 'Chém 4 nhát liên tiếp phía trước (4 × 90%).' },
    pa3: { school: 'kiem_si', name: 'Cuồng Nộ', level: 15, mp: 35, cd: 20,
      type: 'buff', duration: 6, atkBuff: 0.3, speedBuff: 0.5, desc: 'Trong 6 giây: tấn công +30%, tốc đánh +50%.' },

    hl1: { school: 'cung_thu', name: 'Tiễn Xuyên Phá', level: 5, mp: 10, cd: 2.5,
      type: 'projectile', power: 2.2, pierce: true, range: 460, desc: 'Bắn mũi tên lửa xuyên qua mọi quái (220%).' },
    hl2: { school: 'cung_thu', name: 'Tam Tiễn', level: 10, mp: 18, cd: 5,
      type: 'spread', power: 1.5, count: 3, range: 420, desc: 'Bắn 3 mũi tên tỏa ra (mỗi mũi 150%).' },
    hl3: { school: 'cung_thu', name: 'Bão Tiễn', level: 15, mp: 40, cd: 15,
      type: 'aoe', power: 3.5, radius: 170, desc: 'Nổ năng lượng quanh người (350%).' },

    tn1: { school: 'phap_su', name: 'Sóng Băng', level: 5, mp: 10, cd: 3,
      type: 'projectile', power: 1.3, pierce: true, range: 300, slow: 3, desc: 'Sóng băng xuyên quái (130%), làm chậm 3 giây.' },
    tn2: { school: 'phap_su', name: 'Hồi Phục', level: 10, mp: 25, cd: 12,
      type: 'heal', heal: 0.3, desc: 'Hồi 30% máu tối đa.' },
    tn3: { school: 'phap_su', name: 'Băng Ngục', level: 15, mp: 40, cd: 18,
      type: 'aoe', power: 2.0, radius: 210, freeze: 2, desc: 'Đóng băng vùng quanh người (200%), quái đứng yên 2 giây.' },
  };

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
    manh_vai_den: { name: 'Mảnh huy hiệu đen', kind: 'quest', stack: true, desc: 'Mảnh kim loại đen khắc hình trăng khuyết.' },
    manh_an_1: { name: 'Lõi cổng đỏ', kind: 'quest', stack: true, desc: 'Lõi năng lượng của Cổng hạng D, vẫn còn đập như tim sống.' },

    // ---- Trang bị. "stats" là chỉ số gốc; đồ rơi từ quái có chỉ số ngẫu nhiên 80–120%,
    //      phẩm chất ngẫu nhiên và dòng phụ. "minQ": phẩm chất thấp nhất khi rơi ra.
    // Vũ khí
    kiem_go: { name: 'Kiếm luyện tập', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: null, level: 1, stats: { atk: 5 }, price: 30 },
    kiem_sat: { name: 'Kiếm thép', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 5, stats: { atk: 14 }, price: 260 },
    cung_go: { name: 'Cung gỗ sồi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 5, stats: { atk: 13, crit: 2 }, price: 260 },
    truong_go: { name: 'Trượng gỗ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 5, stats: { atk: 11, mp: 20 }, price: 260 },
    kiem_thep: { name: 'Kiếm hợp kim', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 9, stats: { atk: 24, def: 2 }, price: 900 },
    cung_hop_kim: { name: 'Cung hợp kim', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 9, stats: { atk: 22, crit: 4 }, price: 900 },
    truong_pha_le: { name: 'Trượng pha lê', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 9, stats: { atk: 19, mp: 40, hp: 35 }, price: 900 },
    kiem_thach_quy: { name: 'Kiếm Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 12, minQ: 3, stats: { atk: 36, def: 4, hp: 50 }, price: 3000 },
    cung_thach_vuong: { name: 'Cung Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 12, minQ: 3, stats: { atk: 34, crit: 6 }, price: 3000 },
    truong_thach_vuong: { name: 'Trượng Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 12, minQ: 3, stats: { atk: 29, mp: 70, hp: 80 }, price: 3000 },

    // Mũ
    khan_vai: { name: 'Khăn vải', kind: 'armor', slot: 'mu', level: 1, stats: { def: 1, hp: 12 }, price: 45 },
    mu_da: { name: 'Mũ da sói', kind: 'armor', slot: 'mu', level: 6, stats: { def: 4, hp: 32 }, price: 320 },
    mu_thep: { name: 'Mũ thép', kind: 'armor', slot: 'mu', level: 9, stats: { def: 7, hp: 55 }, price: 700 },
    mu_thach_quy: { name: 'Mũ Thạch Vương', kind: 'armor', slot: 'mu', level: 12, minQ: 3, stats: { def: 9, hp: 90, mp: 20 }, price: 2400 },
    // Áo
    ao_vai: { name: 'Áo khoác vải', kind: 'armor', slot: 'ao', level: 1, stats: { def: 3, hp: 20 }, price: 60 },
    ao_da: { name: 'Áo khoác da sói', kind: 'armor', slot: 'ao', level: 6, stats: { def: 8, hp: 55 }, price: 400 },
    ao_thep: { name: 'Giáp thép', kind: 'armor', slot: 'ao', level: 9, stats: { def: 12, hp: 90 }, price: 900 },
    ao_giap_da: { name: 'Giáp đá Thạch Vương', kind: 'armor', slot: 'ao', level: 12, minQ: 3, stats: { def: 15, hp: 140 }, price: 2500 },
    // Găng tay
    gang_vai: { name: 'Găng vải', kind: 'armor', slot: 'gang_tay', level: 1, stats: { atk: 1, def: 1 }, price: 45 },
    gang_da: { name: 'Găng da sói', kind: 'armor', slot: 'gang_tay', level: 6, stats: { atk: 3, def: 2 }, price: 320 },
    gang_thep: { name: 'Găng thép', kind: 'armor', slot: 'gang_tay', level: 9, stats: { atk: 5, def: 3, crit: 1 }, price: 700 },
    gang_thach_quy: { name: 'Găng Thạch Vương', kind: 'armor', slot: 'gang_tay', level: 12, minQ: 3, stats: { atk: 8, def: 5, crit: 2 }, price: 2400 },
    // Đai lưng
    dai_vai: { name: 'Đai vải', kind: 'armor', slot: 'dai_lung', level: 1, stats: { hp: 15, mp: 5 }, price: 45 },
    dai_da: { name: 'Đai da sói', kind: 'armor', slot: 'dai_lung', level: 6, stats: { hp: 45, mp: 15, def: 1 }, price: 320 },
    dai_bac: { name: 'Đai bạc', kind: 'armor', slot: 'dai_lung', level: 9, stats: { hp: 75, mp: 25, def: 2 }, price: 700 },
    // Quần
    quan_vai: { name: 'Quần vải', kind: 'armor', slot: 'quan', level: 1, stats: { def: 2, hp: 15 }, price: 50 },
    quan_da: { name: 'Quần da sói', kind: 'armor', slot: 'quan', level: 6, stats: { def: 6, hp: 40 }, price: 350 },
    quan_thep: { name: 'Quần thép', kind: 'armor', slot: 'quan', level: 9, stats: { def: 9, hp: 65 }, price: 800 },
    // Giày
    giay_vai: { name: 'Giày vải', kind: 'armor', slot: 'giay', level: 1, stats: { def: 1, hp: 10 }, price: 40 },
    giay_da: { name: 'Giày da sói', kind: 'armor', slot: 'giay', level: 6, stats: { def: 4, hp: 25, crit: 1 }, price: 300 },
    giay_thep: { name: 'Giày thép', kind: 'armor', slot: 'giay', level: 9, stats: { def: 6, hp: 40, crit: 1 }, price: 700 },
    // Nhẫn
    nhan_dong: { name: 'Nhẫn đồng', kind: 'armor', slot: 'nhan', level: 3, stats: { atk: 3 }, price: 120 },
    nhan_bac: { name: 'Nhẫn bạc', kind: 'armor', slot: 'nhan', level: 8, stats: { atk: 7, crit: 2 }, price: 600 },
    nhan_thach_quy: { name: 'Nhẫn Thạch Vương', kind: 'armor', slot: 'nhan', level: 12, minQ: 3, stats: { atk: 11, crit: 4 }, price: 2500 },
    // Dây chuyền
    day_chuyen_dong: { name: 'Dây chuyền đồng', kind: 'armor', slot: 'day_chuyen', level: 3, stats: { hp: 30, mp: 10 }, price: 120 },
    day_chuyen_bac: { name: 'Dây chuyền bạc', kind: 'armor', slot: 'day_chuyen', level: 8, stats: { hp: 80, mp: 30 }, price: 600 },
    day_chuyen_thach_quy: { name: 'Dây chuyền Thạch Vương', kind: 'armor', slot: 'day_chuyen', level: 12, minQ: 3, stats: { hp: 140, mp: 55 }, price: 2500 },
    // Ngọc bội
    ngoc_boi_xanh: { name: 'Ngọc bội xanh', kind: 'armor', slot: 'ngoc_boi', level: 3, stats: { hp: 20, mp: 20 }, price: 150 },
    ngoc_boi_luc: { name: 'Ngọc bội lục bảo', kind: 'armor', slot: 'ngoc_boi', level: 8, stats: { hp: 55, mp: 40, crit: 1 }, price: 650 },
    ngoc_boi_thach_quy: { name: 'Ngọc bội Thạch Vương', kind: 'armor', slot: 'ngoc_boi', level: 12, minQ: 3, stats: { hp: 110, mp: 70, crit: 2 }, price: 2600 },
  };

  const SLOTS = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung', 'quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi'];
  const SLOT_NAMES = {
    weapon: 'Vũ khí', mu: 'Mũ', ao: 'Áo', gang_tay: 'Găng tay', dai_lung: 'Đai lưng',
    quan: 'Quần', giay: 'Giày', nhan: 'Nhẫn', day_chuyen: 'Dây chuyền', ngoc_boi: 'Ngọc bội',
  };

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
    hinh_nhan: { name: 'Hình nhân', level: 1, hp: 30, atk: 0, def: 0, exp: 4, gold: [0, 0],
      speed: 0, passive: true, respawn: 2, look: 'dummy', drops: [] },
    nam_doc: { name: 'Nấm Độc', level: 2, hp: 60, atk: 9, def: 1, exp: 10, gold: [2, 6],
      speed: 35, respawn: 6, look: 'mushroom',
      drops: [['binh_mau_nho', 0.12]],
      gear: [0.04, ['khan_vai', 'gang_vai', 'dai_vai', 'quan_vai', 'giay_vai', 'ao_vai']] },
    soi_tre: { name: 'Sói Xám', level: 4, hp: 120, atk: 15, def: 3, exp: 22, gold: [5, 12],
      speed: 80, respawn: 8, look: 'wolf',
      drops: [['manh_vai_den', 0.5, 'q5'], ['binh_mau_nho', 0.15], ['da_cuong_hoa', 0.02]],
      gear: [0.05, ['ao_da', 'quan_da', 'giay_da', 'mu_da', 'gang_da', 'dai_da', 'nhan_dong', 'day_chuyen_dong', 'ngoc_boi_xanh']] },
    ech_suong: { name: 'Ếch Sương', level: 6, hp: 190, atk: 20, def: 5, exp: 35, gold: [8, 16],
      speed: 60, respawn: 8, look: 'frog', jumper: true,
      drops: [['binh_nl_nho', 0.15], ['da_cuong_hoa', 0.05]],
      gear: [0.05, ['mu_da', 'gang_da', 'dai_da', 'ao_da', 'nhan_bac', 'day_chuyen_bac', 'ngoc_boi_luc']] },
    doi_hang: { name: 'Dơi Hang', level: 7, hp: 170, atk: 24, def: 4, exp: 50, gold: [10, 20],
      speed: 90, respawn: 8, look: 'bat', fly: true,
      drops: [['binh_mau_vua', 0.08], ['da_cuong_hoa', 0.06]],
      gear: [0.05, ['kiem_thep', 'cung_hop_kim', 'truong_pha_le', 'mu_thep', 'gang_thep', 'dai_bac', 'ngoc_boi_luc']] },
    nhen_da: { name: 'Nhện Đá', level: 9, hp: 320, atk: 30, def: 10, exp: 80, gold: [15, 30],
      speed: 70, respawn: 10, look: 'spider',
      drops: [['binh_nl_vua', 0.08], ['da_cuong_hoa', 0.1]],
      gear: [0.06, ['ao_thep', 'quan_thep', 'giay_thep', 'gang_thep', 'nhan_bac', 'day_chuyen_bac', 'kiem_thep', 'cung_hop_kim', 'truong_pha_le']] },
    thach_quy: { name: 'Thạch Vương', level: 12, hp: 4200, atk: 46, def: 15, exp: 1500, gold: [300, 500],
      speed: 55, respawn: 300, look: 'golem', boss: true,
      drops: [['da_cuong_hoa', 1], ['da_cuong_hoa', 0.6], ['da_cuong_hoa', 0.3]],
      // Trùm chắc chắn rơi 1 món (hiếm hoặc huyền thoại), 35% rơi thêm món thứ hai
      gear: [1, ['kiem_thach_quy', 'cung_thach_vuong', 'truong_thach_vuong', 'ao_giap_da', 'mu_thach_quy', 'gang_thach_quy',
        'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy'], 0.35] },
  };

  // ---------------------------------------------------------------- NPC
  const NPCS = {
    lao_su: { name: 'Hội trưởng Khải', role: 'quest', color: 0x2b3a55,
      greet: 'Thợ săn mới à? Ở Tân Đô này, cổng mở ra mỗi ngày. Ai cũng cần người đủ gan bước vào.' },
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
  };

  // ---------------------------------------------------------------- Nhiệm vụ chính tuyến
  // obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
  const QUESTS = [
    { id: 'q1', name: 'Bài kiểm tra thức tỉnh', npc: 'lao_su',
      start: [
        '[Hệ thống] Phát hiện năng lượng thức tỉnh. Đang đăng ký người chơi...',
        'Hội trưởng Khải: Cậu là người vừa thức tỉnh ở khu Tân Đô? Trước khi cấp giấy phép thợ săn, ta cần kiểm tra.',
        'Hội trưởng Khải: Ra bãi tập phía đông, phá 3 hình nhân rồi quay lại đây.',
        '(Phím J để đánh, mũi tên hoặc A/D để di chuyển, Space để nhảy.)',
      ],
      obj: { kill: { hinh_nhan: 3 } },
      end: ['Hội trưởng Khải: Không tệ. Đây là kiếm luyện tập, nhớ trang bị vào (phím I mở túi đồ).',
        '[Hệ thống] Đã cấp giấy phép Thợ săn hạng E.'],
      reward: { exp: 40, gold: 50, items: [['kiem_go', 1]] } },

    { id: 'q2', name: 'Làm quen Hiệp Hội', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Thợ săn giỏi không đi một mình. Hãy làm quen người của Hiệp Hội.',
        'Hội trưởng Khải: Đi chào Thợ chế tác Thiết và Dược sư Lan đi.',
      ],
      obj: { visit: ['tho_ren', 'ba_thuoc'] },
      end: ['Hội trưởng Khải: Dược sư Lan gửi cậu mấy bình thuốc. Vào cổng nhớ dùng (phím Q).'],
      reward: { exp: 30, gold: 20, items: [['binh_mau_nho', 5], ['binh_nl_nho', 3]] } },

    { id: 'q3', name: 'Cổng đỏ', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: ...Cậu thấy ánh sáng đỏ trên trời đêm qua chứ?',
        'Hội trưởng Khải: Một Cổng hạng E vừa mở ở ngoại ô. Bình thường thôi, nếu nó không phát ra màu đỏ.',
        'Hội trưởng Khải: Mấy tháng nay, các cổng đều bị ai đó tác động. Lõi cổng bị nhiễm năng lượng lạ.',
        'Hội trưởng Khải: Chúng tôi nghi ngờ một nhóm thợ săn ngầm tự xưng là Hắc Nguyệt.',
        '[Hệ thống] Nhiệm vụ đặc biệt đã được mở khóa: Điều tra Cổng đỏ.',
        'Hội trưởng Khải: Cậu mới vào nghề, nhưng hệ thống đã chọn cậu. Vào cổng xem thử đi.',
      ],
      obj: {},
      end: ['Hội trưởng Khải: Cổng hạng E – Rừng Sương ở cuối phố phía đông. Cẩn thận.'],
      reward: { exp: 30, gold: 30, items: [] } },

    { id: 'q4', name: 'Dọn dẹp cổng', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Bên trong cổng, Nấm Độc mọc tràn lan, chặn hết lối đi.',
        'Hội trưởng Khải: Hạ 10 con để đội thu thập vào được.',
      ],
      obj: { kill: { nam_doc: 10 } },
      end: ['Hội trưởng Khải: Tốt. Nhưng đó mới chỉ là quái tầng ngoài.'],
      reward: { exp: 150, gold: 100, items: [['binh_mau_nho', 5]] } },

    { id: 'q5', name: 'Dấu vết Hắc Nguyệt', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Đội trinh sát thấy Sói Xám tha về những mảnh kim loại đen.',
        'Hội trưởng Khải: Thu về 5 mảnh. Nếu đúng như ta nghĩ, Hắc Nguyệt đã vào cổng trước chúng ta.',
      ],
      obj: { collect: { manh_vai_den: 5 } },
      end: [
        'Hội trưởng Khải: Hình trăng khuyết đen... đúng là huy hiệu của Hắc Nguyệt.',
        'Hội trưởng Khải: Chúng đã đi sâu hơn, tới một Cổng hạng D. Mặc chiếc áo khoác này, đường còn dài.',
      ],
      reward: { exp: 250, gold: 100, items: [['ao_vai', 1]] } },

    { id: 'q6', name: 'Thức tỉnh lần hai', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Muốn vào Cổng hạng D, cậu phải chọn hướng phát triển sức mạnh của mình.',
        'Hội trưởng Khải: Đạt cấp 5 rồi quay lại, ta sẽ giúp cậu thức tỉnh class.',
      ],
      obj: { level: 5, school: true },
      end: ['[Hệ thống] Thức tỉnh thành công. Kỹ năng class đã được mở (phím K).',
        'Hội trưởng Khải: Cổng hạng D – Hang Pha Lê ở cuối Rừng Sương đã cho phép cậu vào.'],
      reward: { exp: 200, gold: 150, items: [], schoolWeapon: true } },

    { id: 'q7', name: 'Cổng hạng D', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Đàn dơi trong Hang Pha Lê bị năng lượng đỏ làm cho điên loạn.',
        'Hội trưởng Khải: Hạ 15 Dơi Hang để mở đường vào sâu bên trong.',
      ],
      obj: { kill: { doi_hang: 15 } },
      end: ['Hội trưởng Khải: Thợ chế tác gửi cậu ít đá cường hóa. Nâng cấp trang bị trước khi gặp chủ cổng.'],
      reward: { exp: 800, gold: 200, items: [['da_cuong_hoa', 3]] } },

    { id: 'q8', name: 'Chủ nhân của cổng', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Lõi cổng nhiễm đỏ đã biến một khối đá cổ thành Thạch Vương.',
        'Hội trưởng Khải: Nó ở tận cùng Hang Pha Lê. Hạ nó, mang lõi cổng về, cổng sẽ đóng lại.',
      ],
      obj: { kill: { thach_quy: 1 } },
      end: [
        '[Hệ thống] Đã đóng Cổng hạng D. Phần thưởng đã được gửi.',
        'Hội trưởng Khải: Lõi cổng đỏ... vẫn còn đập như tim sống. Hắc Nguyệt đang muốn tạo ra thứ gì đó.',
        'Hội trưởng Khải: Cậu đã chứng minh được bản thân. Những cổng khó hơn đang chờ.',
        '— Hết chương 1. Câu chuyện còn tiếp ở bản cập nhật sau. —',
      ],
      reward: { exp: 2000, gold: 500, items: [['manh_an_1', 1], ['nhan_thach_quy', 1]] } },
  ];

  // ---------------------------------------------------------------- Bản đồ
  // File bản đồ nằm trong shared/maps/<id>.txt. Ký hiệu:
  //   .  trống          #  nền (đứng được, không đi xuyên)
  //   =  bục (nhảy lên từ dưới được)
  //   S  điểm xuất hiện mặc định     < >  cổng chuyển bản đồ
  //   chữ thường: chỗ quái xuất hiện (xem spawns)   chữ hoa: NPC (xem npcs)
  //   &  cây   $  tòa nhà / cửa tiệm   !  đèn đường   ^  tinh thể / nhũ đá
  const MAPS = {
    lang: { name: 'Tân Đô – Khu Hiệp Hội', theme: 'city',
      spawns: { d: 'hinh_nhan' },
      npcs: { L: 'lao_su', R: 'tho_ren', B: 'ba_thuoc', G: 'tap_hoa', K: 'thu_kho' },
      portals: { '>': { to: 'rung', at: '<' } } },
    rung: { name: 'Cổng hạng E – Rừng Sương', theme: 'forest', require: 'q3',
      spawns: { a: 'nam_doc', b: 'soi_tre', c: 'ech_suong' },
      npcs: {},
      portals: { '<': { to: 'lang', at: '>' }, '>': { to: 'hang', at: '<' } } },
    hang: { name: 'Cổng hạng D – Hang Pha Lê', theme: 'cave', require: 'q6',
      spawns: { a: 'doi_hang', b: 'nhen_da', z: 'thach_quy' },
      npcs: {},
      portals: { '<': { to: 'rung', at: '>' } } },
  };

  const START_MAP = 'lang';
  const TILE = 32;

  // ---------------------------------------------------------------- Công thức
  function expToNext(level) {
    return Math.floor(40 * Math.pow(level, 1.7));
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

  // Kỹ năng nhân vật được phép dùng
  function availableSkills(player) {
    if (!player.school) return [];
    return Object.keys(SKILLS).filter(id => {
      const s = SKILLS[id];
      return (player.school === 'toan_nang' || s.school === player.school);
    });
  }

  function newPlayer(name) {
    return {
      name,
      level: 1, exp: 0, gold: 50,
      school: null,
      points: { str: 5, vit: 5, agi: 5, spi: 5 }, freePoints: 0,
      hp: null, mp: null,
      map: START_MAP, x: null, y: null,
      equip: Object.fromEntries(SLOTS.map(sl => [sl, null])),
      bag: [], storage: [],
      skillSlots: [null, null, null],
      quest: { step: 0, state: 'none', progress: {} },
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
    SCHOOLS, RANKS, rankOf, WEAPON_TYPES, SKILLS, ITEMS, SLOTS, SLOT_NAMES, QUALITY_NAMES, QUALITY_MUL, QUALITY_AFFIX, QUALITY_ODDS, AFFIXES,
    MONSTERS, NPCS, QUESTS, MAPS,
    UPGRADE_MAX, UPGRADE_RATES, upgradeCost, upgradeFailDrops,
    expToNext, instStats, makeInst, rollQuality, rollAffixes, perfection, sellPrice, statLabel, statUnit, normalizeInst,
    canUseItem, calcStats, availableSkills, newPlayer, questDone,
  };
});
