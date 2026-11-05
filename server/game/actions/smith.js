'use strict';
/* Luật chơi phía server · Hành động thợ rèn: nâng cấp, tẩy luyện, phân rã. */
const G = require('../../../shared');
const { fail } = require('../util');
const { countItem, addItem, removeItem, bagEntry, reforgeCost, salvageStones } = require('../inventory');
const { clampHpMp } = require('../progress');
const { onCurrentMapNpc } = require('../quests');

const actions = {
  upgrade(p, a, ev) {
    if (!onCurrentMapNpc(p, 'tho_ren')) fail('Hãy đến gặp Thợ rèn.');
    let target;
    if (a.slot) target = p.equip[a.slot];
    else target = bagEntry(p, a.uid);
    if (!target) fail('Không có trang bị.');
    const def = G.ITEMS[target.id];
    if (!def.slot) fail('Chỉ nâng cấp được trang bị.');
    const plus = target.plus || 0;
    if (plus >= G.UPGRADE_MAX) fail(`Đã đạt tối đa +${G.UPGRADE_MAX}.`);
    const cost = G.upgradeCost(plus);
    if (p.gold < cost.gold) fail('Không đủ xu.');
    if (countItem(p, 'da_cuong_hoa') < cost.stones) fail(`Cần ${cost.stones} Đá cường hóa.`);
    p.gold -= cost.gold;
    removeItem(p, 'da_cuong_hoa', cost.stones);
    if (Math.random() < G.UPGRADE_RATES[plus]) {
      target.plus = plus + 1;
      ev.push({ t: 'upgrade', ok: true, plus: target.plus });
      ev.push({ t: 'msg', text: `Nâng cấp thành công! ${def.name} +${target.plus}`, color: '#69f0ae' });
    } else if (G.upgradeFailDrops(plus)) {
      target.plus = Math.max(0, plus - 1);
      ev.push({ t: 'upgrade', ok: false, plus: target.plus });
      ev.push({ t: 'msg', text: `Thất bại! ${def.name} bị giảm còn +${target.plus}.`, color: '#ef5350' });
    } else {
      ev.push({ t: 'upgrade', ok: false, plus });
      ev.push({ t: 'msg', text: `Thất bại! ${def.name} vẫn giữ +${plus}.`, color: '#ef5350' });
    }
    clampHpMp(p);
  },

  // Tẩy luyện: gieo lại toàn bộ dòng phụ (giữ nguyên số dòng)
  reforge(p, a, ev) {
    if (!onCurrentMapNpc(p, 'tho_ren')) fail('Hãy đến gặp Thợ rèn.');
    const target = a.slot ? p.equip[a.slot] : bagEntry(p, a.uid);
    if (!target) fail('Không có trang bị.');
    const def = G.ITEMS[target.id];
    if (!def.slot) fail('Chỉ tẩy luyện được trang bị.');
    G.normalizeInst(target);
    if (target.q < 2) fail('Đồ thường không có dòng phụ để tẩy luyện.');
    const cost = reforgeCost(target);
    if (p.gold < cost.gold) fail('Không đủ xu.');
    if (countItem(p, 'da_cuong_hoa') < cost.stones) fail(`Cần ${cost.stones} Đá cường hóa.`);
    p.gold -= cost.gold;
    removeItem(p, 'da_cuong_hoa', cost.stones);
    target.aff = G.rollAffixes(def, target.q, target.aff.length || G.QUALITY_AFFIX[target.q]);
    clampHpMp(p);
    ev.push({ t: 'msg', text: `Tẩy luyện xong ${def.name}: ${target.aff.map(([k, v]) => `${G.statLabel(k)} +${v}${G.statUnit(k)}`).join(', ')}`, color: '#ce93d8' });
  },

  // Phân rã: đổi đồ không dùng lấy đá cường hóa
  salvage(p, a, ev) {
    if (!onCurrentMapNpc(p, 'tho_ren')) fail('Hãy đến gặp Thợ rèn.');
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (!def.slot) fail('Chỉ phân rã được trang bị.');
    G.normalizeInst(e);
    const stones = salvageStones(e);
    p.bag.splice(p.bag.indexOf(e), 1);
    if (stones > 0) addItem(p, 'da_cuong_hoa', stones);
    ev.push({ t: 'msg', text: `Phân rã ${def.name}${stones ? `, nhận ${stones} Đá cường hóa` : ', không thu được gì'}.`, color: '#e0e0e0' });
  },
};

module.exports = actions;
