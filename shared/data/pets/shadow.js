/*
 * Bóng ma của Tử Linh Thuật Sư.
 *
 * Tối đa 20 bóng lưu giữ, gọi ra cùng lúc tối đa 7 bóng. Chỉ số theo đường cong quái, nhân hệ số
 * theo hạng quái gốc. Snapshot chỉ giữ tên / dáng / nguồn gốc.
 */
(function (G) {
  'use strict';

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

  Object.assign(G, { SHADOW_MUL, shadowTrueLv, shadowLevelOf, shadowStats, SHADOW_ROSTER, SHADOW_PARTY });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
