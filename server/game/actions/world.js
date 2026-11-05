'use strict';
/* Luật chơi phía server · Hành động: lưu vị trí, đổi bản đồ, chết. */
const G = require('../../../shared');
const { fail, fmt } = require('../util');

const actions = {
  // Tự lưu định kỳ: vị trí, máu, năng lượng
  save(p, a) {
    if (a.map !== p.map) return;
    const st = G.calcStats(p);
    if (Number.isFinite(a.x)) p.x = Math.round(a.x);
    if (Number.isFinite(a.y)) p.y = Math.round(a.y);
    if (Number.isFinite(a.hp)) p.hp = Math.max(1, Math.min(st.maxHp, Math.round(a.hp)));
    if (Number.isFinite(a.mp)) p.mp = Math.max(0, Math.min(st.maxMp, Math.round(a.mp)));
  },

  change_map(p, a, ev) {
    const m = G.MAPS[p.map];
    const portal = m.portals[a.portal];
    if (!portal) fail('Không có cổng này.');
    const target = G.MAPS[portal.to];
    if (portal.require && !G.questDone(p, portal.require)) fail('Lối ra chưa mở. Hoàn thành nhiệm vụ của Hệ thống trước.');
    if (target.require && !G.questDone(p, target.require)) {
      const q = G.QUESTS.find(x => x.id === target.require);
      fail(`Chưa thể vào ${target.name}. Cần hoàn thành nhiệm vụ "${q.name}".`);
    }
    if (Number.isFinite(a.hp)) actions.save(p, { map: p.map, hp: a.hp, mp: a.mp });
    p.map = portal.to;
    p.x = null; p.y = null;
    p.arrive = portal.at;
    ev.push({ t: 'map', map: p.map });
  },

  die(p, a, ev) {
    const lose = Math.floor(G.expToNext(p.level) * 0.05);
    p.exp = Math.max(0, p.exp - lose);
    const st = G.calcStats(p);
    p.hp = Math.round(st.maxHp * 0.5);
    p.mp = Math.round(st.maxMp * 0.5);
    p.map = G.START_MAP; p.x = null; p.y = null; p.arrive = 'S';
    ev.push({ t: 'msg', text: `Bạn đã bị đánh bại, mất ${fmt(lose)} kinh nghiệm. Hồi sinh ở làng.`, color: '#ef5350' });
    ev.push({ t: 'map', map: p.map });
  },
};

module.exports = actions;
