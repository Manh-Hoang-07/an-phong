/*
 * Bóng ma của Tử Linh Thuật Sư.
 *
 * Tối đa 20 bóng lưu giữ, gọi ra cùng lúc tối đa 7 bóng. Chỉ số = chỉ số quái gốc lúc thu phục,
 * chỉ tăng khi bóng lên cấp. Snapshot chỉ giữ tên / dáng / nguồn gốc.
 */
(function (G) {
  'use strict';

  const SHADOW_ROSTER = 20, SHADOW_PARTY = 7;
  // Bóng ma mang NGUYÊN chỉ số của quái đã chết (HP, ATK, DEF, tốc độ; đã gồm hạng quái), không tăng không giảm.
  // Chỉ số chỉ tăng khi bóng lên cấp (theo đường cong quái). Giữ bảng hệ số = 1 để dễ chỉnh sau này.
  const SHADOW_MUL = {
    normal: { hp: 1, atk: 1, def: 1 },
    elite: { hp: 1, atk: 1, def: 1 },
    leader: { hp: 1, atk: 1, def: 1 },
    boss: { hp: 1, atk: 1, def: 1 },
  };
  // Cấp thật của bóng ma (lưu lúc thu phục = cấp quái lúc chết, sau đó lên cấp bằng kinh nghiệm)
  function shadowTrueLv(soul) {
    return Math.max(1, Number.isFinite(soul.lv) ? Math.floor(soul.lv) : ((soul.stats && soul.stats.level) || 1));
  }
  // Cấp hiệu lực của bóng = cấp thật (không kẹp theo cấp chủ, để bóng không yếu hơn quái gốc).
  // Cấp chủ chỉ giới hạn việc bóng được lên cấp thêm (xem combat.js).
  function shadowLevelOf(soul) {
    return shadowTrueLv(soul);
  }
  // Chỉ số bóng ma: lấy chỉ số HIỆN TẠI của loài quái gốc (đã gồm hạng), rồi lớn lên theo ĐƯỜNG CONG QUÁI
  // khi bóng lên cấp (đúng cấp thu phục = đúng chỉ số quái gốc). Snapshot chỉ giữ tên/dáng/nguồn gốc.
  function shadowStats(soul, player) {
    const mon = G.MONSTERS[soul.monster];
    if (!mon) return null;
    const s = soul.stats || {};
    const lv = shadowLevelOf(soul);
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

  Object.assign(G, { SHADOW_MUL, shadowTrueLv, shadowLevelOf, shadowStats, SHADOW_ROSTER, SHADOW_PARTY });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
