/* Thú triệu hồi. Cờ quà tặng --mount và dữ liệu cũ vẫn được giữ tương thích. */
(function (G) {
  'use strict';
  const MOUNTS = {
    soi_xam: { name: 'Sói Xám', icon: '🐺', level: 1, look: 'wolf', tint: 0xb8c1cc, atk: 1, desc: 'Sói đồng hành nhanh nhẹn, lao vào cắn mục tiêu.' },
    than_lan: { name: 'Thằn Lằn Đầm', icon: '🦎', level: 1, look: 'lizard', tint: 0xffffff, atk: 1.05, desc: 'Thằn lằn đồng hành, dùng vuốt cào mục tiêu.' },
    soi_tuyet: { name: 'Sói Tuyết Bạc', icon: '🐺', level: 1, look: 'wolf', tint: 0xe5f3ff, atk: 1.12, desc: 'Sói núi tuyết khỏe hơn, chuyên tấn công áp sát.' },
    hac_may: { name: 'Hạc Mây Đá', icon: '🕊️', level: 1, look: 'bird', tint: 0xffffff, atk: 1.08, desc: 'Hạc linh hoạt, dùng mỏ và cánh tấn công quái.' },
    ky_lan: { name: 'Kỳ Lân', icon: '🦄', level: 1, look: 'horse', tint: 0xffe8c4, atk: 1.15, desc: 'Kỳ lân đồng hành, có sức tấn công mạnh nhất.' },
  };
  const PET_SKILLS = {
    bite: { name: 'Cắn Xé', icon: '🦷', mp: 4, sta: 8, cooldown: 1800, range: 74, mult: 1.35, desc: 'Cắn mục tiêu gần nhất.' },
    pounce: { name: 'Vồ Mồi', icon: '🐾', mp: 8, sta: 14, cooldown: 3600, range: 115, mult: 1.9, desc: 'Vồ tới mục tiêu và gây sát thương lớn.' },
    howl: { name: 'Gầm Hống', icon: '🌟', mp: 12, sta: 20, cooldown: 6000, range: 150, mult: 1.25, desc: 'Tiếng gầm dồn sức vào đòn đánh.' },
  };
  // Linh thú mặc định của Triệu Hồi Sư: gọi bằng kỹ năng, không cần mã quà tặng.
  // Nâng cấp kỹ năng tăng số lượng gọi ra và sức mạnh (xem skill th5).
  const SUMMONS = {
    // hp / atk / def: hệ số loài nhân lên đường cong cấp; aspd: tốc đánh (>1 là nhanh hơn)
    linh_soi: { name: 'Linh Sói', icon: '🐺', look: 'wolf', tint: 0x9fd8ff, hp: 1, atk: 1, def: 1, aspd: 1, desc: 'Cân bằng, nhanh nhẹn.' },
    linh_hac: { name: 'Linh Phong', icon: '🐝', look: 'insect', tint: 0xffe9a8, hp: 0.85, atk: 1.05, def: 0.8, aspd: 1.15, desc: 'Đánh nhanh nhưng mỏng máu.' },
    linh_than: { name: 'Linh Thằn', icon: '🦎', look: 'lizard', tint: 0xa8ffb0, hp: 1.25, atk: 0.95, def: 1.25, aspd: 1, desc: 'Khỏe, chuyên đỡ đòn.' },
    linh_ky: { name: 'Linh Hồ', icon: '🦊', look: 'fox', tint: 0xffe6f5, hp: 0.9, atk: 1.2, def: 0.9, aspd: 1, desc: 'Sát thương cao nhất.' },
  };
  // Đường cong chỉ số thú / linh thú theo CẤP CỦA THÚ (nội suy tuyến tính theo mốc cấp).
  // Thú ĐỘC LẬP với chủ: chỉ số chỉ phụ thuộc cấp của thú (cấp thú vẫn bị kẹp tối đa bằng cấp chủ), không cộng gì từ chỉ số chủ.
  // Mốc đặt khoảng 50% máu / 35% công / 45% giáp của người chơi tham chiếu cùng cấp.
  const PET_CURVE = {
    hp: [[1, 100], [10, 650], [20, 1150], [30, 1900], [40, 2600], [50, 4000], [60, 4800], [70, 5700], [80, 6600], [90, 7500], [100, 8500]],
    atk: [[1, 9], [10, 48], [20, 95], [30, 150], [40, 200], [50, 290], [60, 330], [70, 390], [80, 435], [90, 480], [100, 530]],
    def: [[1, 5], [10, 40], [20, 76], [30, 122], [40, 185], [50, 270], [60, 390], [70, 460], [80, 530], [90, 615], [100, 700]],
  };
  // Thú đồng hành (mã quà tặng): chưa có cấp riêng nên theo cấp chủ, nhưng chỉ số lấy từ đường cong thú (không từ chỉ số chủ)
  function petStats(player) {
    const lv = Math.max(1, player.level || 1);
    return { maxHp: Math.round(G.interp(PET_CURVE.hp, lv)), maxMp: 28 + 5 * (lv - 1), maxSta: 80 + 2 * (lv - 1), atk: G.interp(PET_CURVE.atk, lv), def: Math.round(G.interp(PET_CURVE.def, lv)) };
  }
  // Linh thú mặc định: sức mạnh theo CẤP RIÊNG của từng linh thú (không còn theo cấp nhân vật)
  // sp: hệ số loài { hp, def } (mặc định 1). atk của loài được client nhân riêng lúc đánh.
  function summonLevelStats(lv, skLv, sp) {
    const mul = 1 + 0.12 * ((skLv || 1) - 1), s = sp || {};
    return { maxHp: Math.round(G.interp(PET_CURVE.hp, lv) * (s.hp || 1) * mul), maxMp: Math.round((24 + 4 * (lv - 1)) * mul), maxSta: Math.round((70 + 2 * (lv - 1)) * mul),
      atk: G.interp(PET_CURVE.atk, lv) * mul, def: Math.round(G.interp(PET_CURVE.def, lv) * (s.def || 1)) };
  }
  // Cấp hiệu lực của linh thú: cấp thật bị kẹp tối đa bằng cấp chủ
  function summonUnitLv(player, id) {
    const cap = Math.max(1, player.level || 1);
    const u = player.summons && player.summons.units && player.summons.units[id];
    return Math.max(1, Math.min(cap, (u && Number.isFinite(u.lv) ? Math.floor(u.lv) : 1)));
  }
  function summonUnitStats(player, id) {
    return summonLevelStats(summonUnitLv(player, id), (player.skills && player.skills.th5) || 1, SUMMONS[id]);
  }
  // Giữ tên cũ cho nơi gọi chưa đổi: chỉ số của linh thú đang chọn
  function summonStats(player) { return summonUnitStats(player, summonChoice(player)); }
  // Kinh nghiệm lên cấp của linh thú / bóng ma (người chơi dùng expToNext trong core)
  function summonExpToNext(lv) { return Math.floor(60 * Math.pow(lv, 1.5)); }
  function shadowExpToNext(lv) { return Math.floor(55 * Math.pow(lv, 1.5)); }
  // Mỗi lần chỉ gọi 1 linh thú (người chơi chọn con nào); cấp kỹ năng th5 chỉ tăng sức mạnh linh thú
  function summonCount(player) { return ((player.skills && player.skills.th5) || 0) >= 1 ? 1 : 0; }
  // Linh thú đang được chọn (mặc định con đầu tiên)
  function summonChoice(player) {
    const c = player.summons && player.summons.choice;
    return SUMMONS[c] ? c : Object.keys(SUMMONS)[0];
  }
  // Bóng ma của Tử Linh Thuật Sư: tối đa 20 bóng lưu giữ, gọi ra cùng lúc tối đa 7 bóng
  const SHADOW_ROSTER = 20, SHADOW_PARTY = 7;
  // Hệ số chỉ số bóng ma so với quái gốc cùng cấp, theo hạng quái (đã gồm hệ số hạng của quái).
  // ATK thấp vì đi 7 bóng cùng lúc: 7 bóng thường ~ 1 người chơi cùng cấp.
  const SHADOW_MUL = {
    normal: { hp: 0.8, atk: 0.13, def: 1 },
    // hp đã chia theo hệ số máu quái (tinh anh ×10, thủ lĩnh ×100, trùm ×200) để chỉ số bóng giữ nguyên như khi hệ số còn ×2,5 / ×5 / ×12
    elite: { hp: 0.15, atk: 0.15, def: 1 },
    leader: { hp: 0.025, atk: 0.17, def: 1 },
    boss: { hp: 0.018, atk: 0.19, def: 1 },
  };
  // Cấp thật của bóng ma (lưu lúc thu phục = cấp quái lúc chết, sau đó lên cấp bằng kinh nghiệm)
  function shadowTrueLv(soul) {
    return Math.max(1, Number.isFinite(soul.lv) ? Math.floor(soul.lv) : ((soul.stats && soul.stats.level) || 1));
  }
  // Cấp hiệu lực: kẹp tối đa bằng cấp chủ, bóng cấp cao hơn chủ sẽ "mở khóa" dần khi chủ lên cấp
  function shadowLevelOf(soul, player) {
    return Math.min(shadowTrueLv(soul), Math.max(1, player.level || 1));
  }
  // Chỉ số bóng ma: lấy chỉ số HIỆN TẠI của loài quái gốc (đã gồm hạng), rồi lớn lên theo ĐƯỜNG CONG QUÁI
  // (bóng cấp x mạnh bằng quái đó nếu nó ở cấp x), nhân hệ số bóng theo hạng. Snapshot chỉ giữ tên/dáng/nguồn gốc.
  function shadowStats(soul, player) {
    const mon = G.MONSTERS[soul.monster];
    if (!mon) return null;
    const s = soul.stats || {};
    const lv = shadowLevelOf(soul, player);
    const base = G.monCurve(mon.level), now = G.monCurve(lv);
    const grade = G.gradeOf(mon), m = SHADOW_MUL[grade] || SHADOW_MUL.normal;
    return {
      name: s.name || mon.name, level: lv, gradeLabel: s.gradeLabel || G.monGrade(mon).label,
      hp: Math.max(1, Math.round(G.monHp(mon) * (now.hp / base.hp) * m.hp)),
      atk: mon.atk * (now.atk / base.atk) * m.atk,
      def: Math.round((mon.def || 0) * (now.def / base.def) * m.def), speed: mon.speed ?? 0,
      look: mon.look, map: s.map ?? null, at: s.at ?? null,
    };
  }
  Object.assign(G, { MOUNTS, PET_SKILLS, SUMMONS, PET_CURVE, SHADOW_MUL, petStats, summonLevelStats, summonUnitLv, summonUnitStats, summonStats,
    summonExpToNext, shadowExpToNext, shadowTrueLv, shadowLevelOf, shadowStats, summonCount, summonChoice, SHADOW_ROSTER, SHADOW_PARTY });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
