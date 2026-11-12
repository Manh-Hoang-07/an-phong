/*
 * Tính máu / kinh nghiệm quái theo hạng.
 */
(function (G) {
  'use strict';
  const { MON_GRADE } = G;

  function gradeOf(def) {
    if (!def) return 'normal';
    if (def.boss || def.finalBoss) return 'boss';
    if (def.leader) return 'leader';
    if (def.elite) return 'elite';
    return 'normal';
  }
  // Thông số một con quái tại thời điểm bị hạ (lưu vào bóng ma để xem lại; không đổi khi dữ liệu quái đổi về sau)
  function monSnapshot(id, mapId) {
    const d = G.MONSTERS[id];
    if (!d) return null;
    return { name: d.name, level: d.level, grade: gradeOf(d), gradeLabel: monGrade(d).label, hp: monHp(d), atk: d.atk, def: d.def || 0,
      speed: d.speed || 0, look: d.look, map: mapId || null, at: Date.now() };
  }
  function monGrade(def) { return MON_GRADE[gradeOf(def)] || MON_GRADE.normal; }
  // Thủ lĩnh / trùm: hệ số hạng là mức trần, cấp thấp được giảm theo GRADE_RAMP (tinh anh và quái thường không dốc)
  function gradeRamp(def) { const g = gradeOf(def); return (g === 'leader' || g === 'boss') ? G.interp(G.GRADE_RAMP, (def && def.level) || 1) : 1; }
  function monHp(def) { return Math.max(1, Math.round(def.hp * monGrade(def).hp * gradeRamp(def) * (def.finalBoss ? G.FINAL_BOSS.hp : 1))); }
  function monExp(def) { return def.exp * monGrade(def).exp * (def.finalBoss ? G.FINAL_BOSS.exp : 1); }

  // Chỉ số quái THƯỜNG theo cấp (đường cong chuẩn): dùng để bóng ma lớn lên theo cấp và để cân bằng
  function monCurve(level) {
    const C = G.MON_CURVE, L = Math.max(1, level || 1);
    return {
      hp: G.interp(C.hp, L), atk: G.interp(C.atk, L), def: C.defBase + C.defPerLevel * L,
      exp: G.expToNext(L) / (C.expKills[0] + C.expKills[1] * L),
    };
  }

  Object.assign(G, { gradeOf, monGrade, gradeRamp, monHp, monExp, monSnapshot, monCurve });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
