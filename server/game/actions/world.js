'use strict';
/* Luật chơi phía server · Hành động: lưu vị trí, đổi bản đồ, chết. */
const G = require('../../../shared');
const { fail, fmt } = require('../util');

const actions = {
  // Tự lưu định kỳ: vị trí, máu, năng lượng
  save(p, a) {
    if (a.map !== p.map) return;
    const st = G.calcStats(p, { form: !!p.formActive });
    if (Number.isFinite(a.x)) p.x = Math.round(a.x);
    if (Number.isFinite(a.y)) p.y = Math.round(a.y);
    if (Number.isFinite(a.hp)) p.hp = Math.max(1, Math.min(st.maxHp, Math.round(a.hp)));
    if (Number.isFinite(a.mp)) p.mp = Math.max(0, Math.min(st.maxMp, Math.round(a.mp)));
    if (p.mounts && Array.isArray(p.mounts.summoned) && a.pets && typeof a.pets === 'object') {
      const ps = G.petStats(p);
      for (const id of p.mounts.summoned) {
        const incoming = a.pets[id];
        if (!incoming || typeof incoming !== 'object') continue;
        if (!p.pets[id]) p.pets[id] = {};
        for (const [key, max] of [['hp', ps.maxHp], ['mp', ps.maxMp], ['sta', ps.maxSta]])
          if (Number.isFinite(incoming[key])) p.pets[id][key] = Math.max(0, Math.min(max, Math.round(incoming[key])));
      }
      if (p.mounts.active) p.pet = p.pets[p.mounts.active];
    }
  },

  change_map(p, a, ev) {
    const m = G.MAPS[p.map];
    const portal = m.portals[a.portal];
    if (!portal) fail('Không có cổng này.');
    const st = G.portalStatus(p, p.map, a.portal);
    if (!st.ok) fail(`Chưa thể vào ${G.MAPS[portal.to].name}. ${st.reason}.`);
    if (Number.isFinite(a.hp)) actions.save(p, { map: p.map, hp: a.hp, mp: a.mp, pets: a.pets });
    p.map = portal.to;
    p.hiddenNpcActive = false;
    p.x = null; p.y = null;
    p.arrive = portal.at || G.gateOf(portal.to) || 'S';   // tới đúng lối vào ứng với cổng vừa đi qua
    ev.push({ t: 'map', map: p.map });
  },

  die(p, a, ev) {
    const lose = Math.floor(G.expToNext(p.level) * 0.05);
    p.exp = Math.max(0, p.exp - lose);
    p.formActive = false;
    const st = G.calcStats(p, { form: false });
    p.hp = Math.round(st.maxHp * 0.5);
    p.mp = Math.round(st.maxMp * 0.5);
    p.map = G.START_MAP; p.x = null; p.y = null; p.arrive = 'S';
    p.hiddenNpcActive = false;
    ev.push({ t: 'msg', text: `Bạn đã bị đánh bại, mất ${fmt(lose)} kinh nghiệm. Hồi sinh ở làng.`, color: '#ef5350' });
    ev.push({ t: 'map', map: p.map });
  },
};

module.exports = actions;
