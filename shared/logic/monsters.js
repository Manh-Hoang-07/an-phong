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
  function monHp(def) { return Math.max(1, Math.round(def.hp * monGrade(def).hp)); }
  function monExp(def) { return def.exp * monGrade(def).exp; }

  Object.assign(G, { gradeOf, monGrade, monHp, monExp, monSnapshot });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
