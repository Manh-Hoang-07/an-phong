'use strict';
/* Luật chơi phía server · Tiến độ nhân vật: kinh nghiệm, xu, class, giới hạn máu / năng lượng. */
const G = require('../../shared');
const { fmt } = require('./util');

// ------------------------------------------------------------ Kinh nghiệm
function gainExp(p, amount, ev) {
  if (p.level >= G.MAX_LEVEL) return;
  p.exp += amount;
  ev.push({ t: 'float', text: `+${fmt(amount)} kinh nghiệm`, color: '#b388ff' });
  while (p.level < G.MAX_LEVEL && p.exp >= G.expToNext(p.level)) {
    p.exp -= G.expToNext(p.level);
    p.level++;
    p.freePoints += G.STAT_POINTS_PER_LEVEL;
    p.skillPoints = (p.skillPoints || 0) + 1;
    const st = G.calcStats(p);
    p.hp = st.maxHp; p.mp = st.maxMp;
    ev.push({ t: 'levelup', level: p.level });
    ev.push({ t: 'msg', text: `[Hệ thống] Thăng cấp! Đạt cấp ${p.level}: +${G.STAT_POINTS_PER_LEVEL} điểm tiềm năng, +1 điểm kỹ năng.`, color: '#ffd54f' });
    const newSkills = G.availableSkills(p).filter(id => G.SKILLS[id].level === p.level);
    for (const id of newSkills) ev.push({ t: 'msg', text: `Có thể học kỹ năng mới: ${G.SKILLS[id].name} (phím K).`, color: '#4fc3f7' });
  }
  if (p.level >= G.MAX_LEVEL) p.exp = 0;
}

function gainGold(p, amount, ev) {
  if (amount <= 0) return;
  p.gold += amount;
  ev.push({ t: 'float', text: `+${fmt(amount)} xu`, color: '#ffd54f' });
}

// Đặt class: trả lại toàn bộ điểm kỹ năng đã cộng, xóa ô kỹ năng
function setSchool(p, school, ev) {
  const spent = Object.values(p.skills || {}).reduce((x, y) => x + y, 0);
  p.skillPoints += spent;
  p.skills = {};
  p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
  p.school = school;
  const st = G.calcStats(p);
  p.hp = st.maxHp; p.mp = st.maxMp;
  ev.push({ t: 'msg', text: `[Hệ thống] Thức tỉnh class ${G.SCHOOLS[school].name} thành công! Mở bảng Kỹ năng để học kỹ năng.`, color: '#ffd54f' });
  ev.push({ t: 'school', school });
}

function resetCost(p) { return 100 * p.level; }

function clampHpMp(p) {
  const st = G.calcStats(p);
  if (p.hp != null) p.hp = Math.min(p.hp, st.maxHp);
  if (p.mp != null) p.mp = Math.min(p.mp, st.maxMp);
}

module.exports = { gainExp, gainGold, setSchool, resetCost, clampHpMp };
