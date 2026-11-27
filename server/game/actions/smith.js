'use strict';
/* Luật chơi phía server · Hành động thợ rèn: nâng cấp, tẩy luyện, phân rã. */
const G = require('../../../shared');
const { fail } = require('../core/util');
const { countItem, addItem, removeItem, bagEntry, reforgeCost, salvageStones } = require('../core/inventory');
const { clampHpMp } = require('../core/progress');
const { roleHere } = require('../core/quests');

const actions = {
  upgrade(p, a, ev) {
    if (!roleHere(p, 'smith')) fail('Hãy đến gặp Thợ rèn.');
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
    if (!roleHere(p, 'smith')) fail('Hãy đến gặp Thợ rèn.');
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
    if (!roleHere(p, 'smith')) fail('Hãy đến gặp Thợ rèn.');
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (!def.slot) fail('Chỉ phân rã được trang bị.');
    G.normalizeInst(e);
    const stones = salvageStones(e);
    p.bag.splice(p.bag.indexOf(e), 1);
    if (stones > 0) addItem(p, 'da_cuong_hoa', stones);
    ev.push({ t: 'msg', text: `Phân rã ${def.name}${stones ? `, nhận ${stones} Đá cường hóa` : ', không thu được gì'}.`, color: '#e0e0e0' });
  },

  // Sửa chữa: trả xu + Đá cường hóa theo phần độ bền còn thiếu, đưa về đầy. Món hỏng (0%) vẫn sửa được.
  // Đồ Linh Ngọc / đặc biệt có độ bền vô hạn nên không có gì để sửa.
  repair(p, a, ev) {
    if (!roleHere(p, 'smith')) fail('Hãy đến gặp Thợ rèn.');
    const target = a.slot ? p.equip[a.slot] : bagEntry(p, a.uid);
    if (!target) fail('Không có trang bị.');
    const def = G.ITEMS[target.id];
    if (!def.slot) fail('Chỉ sửa được trang bị.');
    const cost = G.repairCost(target);
    if (!cost) fail(G.durInfinite(def) ? 'Món này không bao giờ hao mòn.' : 'Món này còn nguyên độ bền.');
    if (p.gold < cost.gold) fail('Không đủ xu.');
    if (countItem(p, 'da_cuong_hoa') < cost.stones) fail(`Cần ${cost.stones} Đá cường hóa.`);
    p.gold -= cost.gold;
    removeItem(p, 'da_cuong_hoa', cost.stones);
    G.repairFull(target);
    clampHpMp(p);
    ev.push({ t: 'msg', text: `Đã sửa ${def.name} về 100% (-${cost.gold} xu, -${cost.stones} đá).`, color: '#69f0ae' });
  },

  // Sửa tất cả đồ ĐANG MẶC cần sửa (món nào đủ tiền thì sửa theo thứ tự ô; hết tiền/đá thì dừng, báo phần còn lại)
  repair_all(p, a, ev) {
    if (!roleHere(p, 'smith')) fail('Hãy đến gặp Thợ rèn.');
    let n = 0, gold = 0, stones = 0, skipped = 0;
    for (const slot of G.SLOTS) {
      const it = p.equip[slot];
      const cost = it && G.repairCost(it);
      if (!cost) continue;
      if (p.gold < cost.gold || countItem(p, 'da_cuong_hoa') < cost.stones) { skipped++; continue; }
      p.gold -= cost.gold;
      removeItem(p, 'da_cuong_hoa', cost.stones);
      G.repairFull(it);
      n++; gold += cost.gold; stones += cost.stones;
    }
    if (!n && !skipped) fail('Không có món đang mặc nào cần sửa.');
    if (!n) fail('Không đủ xu hoặc Đá cường hóa để sửa.');
    clampHpMp(p);
    ev.push({ t: 'msg', text: `Đã sửa ${n} món đang mặc (-${gold} xu, -${stones} đá).${skipped ? ` Còn ${skipped} món chưa đủ tiền sửa.` : ''}`, color: '#69f0ae' });
  },

  // Khắc ấn: đồ đạt độ hoàn hảo 95% trở lên được thêm 1 dòng phụ thứ tư, vĩnh viễn.
  // Đây là chỗ duy nhất độ hoàn hảo có tác dụng thật (trước đây chỉ để hiển thị).
  seal(p, a, ev) {
    if (!roleHere(p, 'smith')) fail('Hãy đến gặp Thợ rèn.');
    const target = a.slot ? p.equip[a.slot] : bagEntry(p, a.uid);
    if (!target) fail('Không có trang bị.');
    const def = G.ITEMS[target.id];
    if (!def.slot) fail('Chỉ khắc ấn được trang bị.');
    G.normalizeInst(target);
    if (target.seal) fail('Món này đã được khắc ấn rồi.');
    if ((target.q || 1) < 2) fail('Đồ Thường không có dòng phụ để khắc ấn.');
    const pf = G.perfection(target);
    if (pf < G.PERFECT_MIN) fail(`Cần độ hoàn hảo ${G.PERFECT_MIN}% trở lên (món này ${pf}%).`);
    const cost = G.sealCost(target);
    if (p.gold < cost.gold) fail('Không đủ xu.');
    if (countItem(p, 'da_cuong_hoa') < cost.stones) fail(`Cần ${cost.stones} Đá cường hóa.`);
    p.gold -= cost.gold;
    removeItem(p, 'da_cuong_hoa', cost.stones);
    // Thêm đúng 1 dòng phụ mới, giữ nguyên các dòng cũ
    const extra = G.rollAffixes(def, target.q, 1);
    target.aff = (target.aff || []).concat(extra);
    target.seal = true;
    clampHpMp(p);
    ev.push({ t: 'msg', text: `Khắc ấn xong ${def.name}: ${extra.map(([k, v]) => `${G.statLabel(k)} +${v}${G.statUnit(k)}`).join(', ')} (dòng thứ ${target.aff.length}, vĩnh viễn).`, color: '#ffd54f' });
  },
};

module.exports = actions;
