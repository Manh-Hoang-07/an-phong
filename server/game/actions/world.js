'use strict';
/* Luật chơi phía server · Hành động: lưu vị trí, đổi bản đồ, chết. */
const G = require('../../../shared');
const { fail, fmt } = require('../core/util');

// Ghi nhận Tân Đô vừa tới (để mở Trạm dịch chuyển tới đó)
function markVillage(p, ev) {
  const v = G.MAPS[p.map] && G.MAPS[p.map].village;
  if (v && !p.villages.includes(p.map)) {
    p.villages.push(p.map);
    if (ev) ev.push({ t: 'msg', text: 'Đã ghi nhận ' + G.MAPS[p.map].name + '. Từ nay có thể dùng Trạm dịch chuyển tới đây.', color: '#7fe3ff' });
  }
}

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
      for (const id of p.mounts.summoned) {
        const ps = G.companionStats(p, id);
        const incoming = a.pets[id];
        if (!incoming || typeof incoming !== 'object') continue;
        if (!p.pets[id]) p.pets[id] = {};
        for (const [key, max] of [['hp', ps.maxHp], ['mp', ps.maxMp], ['sta', ps.maxSta]])
          if (Number.isFinite(incoming[key])) p.pets[id][key] = Math.max(0, Math.min(max, Math.round(incoming[key])));
      }
      if (p.mounts.active) p.pet = p.pets[p.mounts.active];
    }
    if (p.summons && p.summons.enabled && a.summons && typeof a.summons === 'object') {
      for (const id of Object.keys(G.SUMMONS)) {
        const incoming = a.summons[id];
        if (!incoming || typeof incoming !== 'object') continue;
        if (!p.summons.states[id]) p.summons.states[id] = {};
        // Max HP/MP/thể lực theo cấp riêng của từng linh thú
        const ss = G.summonUnitStats(p, id);
        for (const [key, max] of [['hp', ss.maxHp], ['mp', ss.maxMp], ['sta', ss.maxSta]])
          if (Number.isFinite(incoming[key])) p.summons.states[id][key] = Math.max(0, Math.min(max, Math.round(incoming[key])));
      }
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
    const dm = G.MAPS[portal.to];
    p.arrive = (dm.gate && portal.at && portal.at !== '<' && dm.portals[portal.at] ? dm.gate : portal.at) || G.gateOf(portal.to) || 'S';   // tới đúng lối vào ứng với cổng vừa đi qua
    markVillage(p, ev);
    ev.push({ t: 'map', map: p.map });
  },

  // Trạm dịch chuyển: đi nhanh giữa các Tân Đô đã từng tới, phí cố định G.TELEPORT_FEE (không theo cấp).
  teleport(p, a, ev) {
    if (!G.npcByRole(p, p.map, 'teleport')) fail('Phải đứng cạnh Trạm dịch chuyển.');
    const to = String(a.to || '');
    const v = G.MAPS[to] && G.MAPS[to].village;
    if (!v) fail('Trạm chỉ đưa tới các Tân Đô.');
    if (to === p.map) fail('Bạn đang ở đây rồi.');
    if (!p.villages.includes(to)) fail('Bạn chưa từng tới Tân Đô này. Hãy đi bộ tới đó một lần trước.');
    const req = G.MAPS[to].require;
    if (req && !G.questDone(p, req)) fail('Chưa đủ điều kiện vào Tân Đô này.');
    // Về Hiệp Hội miễn phí: nhiệm vụ của Hội trưởng Khải và các phụ tuyến chỉ nhận / trả ở đó
    const fee = G.teleportFee(to);
    if (p.gold < fee) fail('Không đủ xu (cần ' + fmt(fee) + ' xu).');
    if (Number.isFinite(a.hp)) actions.save(p, { map: p.map, hp: a.hp, mp: a.mp, pets: a.pets });
    p.gold -= fee;
    p.map = to; p.hiddenNpcActive = false; p.x = null; p.y = null; p.arrive = 'S';
    ev.push({ t: 'msg', text: 'Dịch chuyển tới ' + G.MAPS[to].name + (fee ? ' (-' + fmt(fee) + ' xu).' : ' (miễn phí).'), color: '#7fe3ff' });
    ev.push({ t: 'map', map: p.map });
  },

  die(p, a, ev) {
    const lose = Math.floor(G.expToNext(p.level) * 0.05);
    p.exp = Math.max(0, p.exp - lose);
    p.formActive = false;
    // Hồi sinh: bóng ma cũng được giải trừ
    if (p.shadows) p.shadows.enabled = false;
    const st = G.calcStats(p, { form: false });
    p.hp = Math.round(st.maxHp * 0.5);
    p.mp = Math.round(st.maxMp * 0.5);
    p.hiddenNpcActive = false;
    // Hồi sinh tại chỗ ở cổng đặc biệt (respawn: true, ví dụ Cổng đỏ): chết là đứng dậy ngay trong cổng,
    // không bị đẩy về làng — nếu không sẽ phải đi lại cả đường và có map không có lối quay lại.
    const cur = G.MAPS[p.map];
    if (cur && cur.respawn) {
      p.x = null; p.y = null; p.arrive = 'S';
      ev.push({ t: 'msg', text: `Bạn đã bị đánh bại, mất ${fmt(lose)} kinh nghiệm. Hồi sinh tại ${cur.name}.`, color: '#ef5350' });
      ev.push({ t: 'map', map: p.map });
      return;
    }
    // hồi sinh ở làng gần nhất (nếu đã từng tới), không thì về Tân Đô I
    const home = cur && cur.home;
    p.map = home && p.villages.includes(home) ? home : G.START_MAP;
    p.x = null; p.y = null; p.arrive = 'S';
    ev.push({ t: 'msg', text: `Bạn đã bị đánh bại, mất ${fmt(lose)} kinh nghiệm. Hồi sinh ở làng.`, color: '#ef5350' });
    ev.push({ t: 'map', map: p.map });
  },
};

module.exports = actions;
