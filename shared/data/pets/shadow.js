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

  // ===== Siêu tuyệt kỹ Tử Linh Dung Hợp =====
  // Cộng dồn chỉ số của TOÀN BỘ bộ sưu tập (kể cả bóng không triệu hồi) vào người chơi.
  //
  // Bóng ma chỉ có hp / atk / def / speed (xem shadowStats ở trên) — KHÔNG có MP và thể lực riêng.
  // Nên MP và thể lực phải suy từ đường cong quái (monCurve) của cấp bóng:
  //   MP      ← monCurve.atk  (quái không có MP, lấy "năng lực" của nó làm năng lượng)
  //   thể lực ← monCurve.def  (lấy "độ bền" của nó làm thể lực)
  // Đây là suy luận, không phải chỉ số thật của bóng — đã ghi rõ trong kế hoạch.
  //
  // Cấp bóng bị KẸP theo cấp người chơi: bóng giữ cấp quái lúc thu phục (shadowLevelOf không kẹp),
  // nên Tử Linh cấp 60 bắt được bóng cấp 90 ở map cao. Không kẹp thì dung hợp ra chỉ số vô đối.
  //
  // HỆ SỐ 1 = CỘNG NGUYÊN GIÁ TRỊ: bóng có bao nhiêu thì cộng vào nhân vật bấy nhiêu, không chiết khấu.
  // Bốn chỉ số dùng chung một hệ số 1 nên không còn chuyện lệch scale giữa HP và DEF nữa:
  // bóng tinh anh lv67 có HP 47.250 / DEF 110 thì cộng đúng 47.250 HP và 110 DEF.
  // Số lượng bóng là bộ nhân duy nhất: 20 bóng = 20 lần chỉ số của một bóng.
  const FUSION = { hp: 1, mp: 1, sta: 1, def: 1 };
  function shadowFusion(player, roster) {
    const out = { hp: 0, mp: 0, sta: 0, def: 0, count: 0 };
    const ownerLv = Math.max(1, player?.level || 1);
    for (const soul of roster || []) {
      const s = shadowStats(soul, player);
      if (!s) continue;
      const lv = Math.max(1, Math.min(ownerLv, s.level || 1));   // kẹp theo cấp chủ
      const c = G.monCurve(lv);
      out.hp += s.hp * FUSION.hp;
      out.mp += c.atk * FUSION.mp;
      out.sta += c.def * FUSION.sta;
      out.def += s.def * FUSION.def;
      out.count++;
    }
    return { hp: Math.round(out.hp), mp: Math.round(out.mp), sta: Math.round(out.sta), def: Math.round(out.def), count: out.count };
  }

  Object.assign(G, { SHADOW_MUL, shadowTrueLv, shadowLevelOf, shadowStats, SHADOW_ROSTER, SHADOW_PARTY, FUSION, shadowFusion });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
