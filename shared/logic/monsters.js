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
  function monGrade(def) { return MON_GRADE[gradeOf(def)] || MON_GRADE.normal; }
  function monHp(def) { return Math.max(1, Math.round(def.hp * monGrade(def).hp)); }
  function monExp(def) { return def.exp * monGrade(def).exp; }

  Object.assign(G, { gradeOf, monGrade, monHp, monExp });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
