'use strict';
/*
 * Phát phần thưởng cho nhân vật. Dùng chung cho mật mã quà tặng (character.js · redeem) và trang admin.
 *
 * rewards: { unlockClass, gold, exp, linhNgoc, skillPoints, items: [[id, n]], mounts: [id] }
 *
 * Gồm hai bước để người gọi chen việc của mình vào giữa:
 *   const plan = checkRewards(p, r);        // kiểm tra, ném GameError nếu không nhận được (túi đầy, thú đã có...)
 *   ...                                      // việc riêng (mật mã: ghi p.redeemed)
 *   applyRewards(p, plan, ev, src);         // phát thật. src ghi vào ngocLog: 'code:<MÃ>' | 'admin:<tên>'
 */
const G = require('../../../shared');
const { fail } = require('./util');
const { bagFree, slotsNeeded, giveItem } = require('./inventory');
const { gainGold, gainExp, grantNgoc } = require('./progress');

function checkRewards(p, r) {
  r = r || {};
  const items = Array.isArray(r.items) ? r.items.filter(([id]) => G.ITEMS[id]) : [];
  const need = items.reduce((s, [id, n]) => s + slotsNeeded(p, id, n), 0);
  if (bagFree(p) < need) fail(`Túi cần trống ít nhất ${need} ô.`);
  // Thú đồng hành: chỉ toàn thú đã có → báo lỗi (mật mã không mất lượt)
  const mounts = (Array.isArray(r.mounts) ? r.mounts : []).filter(id => G.MOUNTS[id]);
  const newMounts = mounts.filter(id => !p.mounts.owned.includes(id));
  const onlyMounts = !r.unlockClass && !r.gold && !r.exp && !r.skillPoints && !r.linhNgoc && !items.length;
  if (mounts.length && !newMounts.length && onlyMounts) fail(`Bạn đã có ${mounts.map(id => G.MOUNTS[id].name).join(', ')} rồi.`);
  return { r, items, newMounts };
}

function applyRewards(p, plan, ev, src) {
  const { r, items, newMounts } = plan;
  if (r.unlockClass && G.SCHOOLS[r.unlockClass]) {
    // Chức nghiệp 2 không mở bằng mã / quà: chỉ qua Sách Tiến Hóa Chức Nghiệp ở NPC ẩn
    if (G.SCHOOLS[r.unlockClass].evolved) {
      ev.push({ t: 'msg', text: `[Hệ thống] Quà này có class ${G.SCHOOLS[r.unlockClass].name} nhưng chức nghiệp 2 chỉ mở bằng Sách Tiến Hóa Chức Nghiệp.`, color: '#ff8a80' });
    } else {
      p.unlocks[r.unlockClass] = true;
      ev.push({ t: 'unlock', school: r.unlockClass });
      ev.push({ t: 'msg', text: `[Hệ thống] Đã mở khóa class đặc biệt: ${G.SCHOOLS[r.unlockClass].name}.`, color: '#ffc94a' });
    }
  }
  if (r.gold) gainGold(p, Math.max(0, Math.floor(r.gold)), ev);
  if (r.linhNgoc) grantNgoc(p, r.linhNgoc, src, ev);
  if (r.exp) gainExp(p, Math.max(0, Math.floor(r.exp)), ev);
  if (r.skillPoints) p.skillPoints += Math.max(0, Math.floor(r.skillPoints));
  for (const [id, n] of items) giveItem(p, id, Math.max(1, Math.floor(n)), ev);
  for (const id of newMounts) {
    p.mounts.owned.push(id);
    const petStats = G.companionStats(p, id);
    p.pets[id] = { hp: petStats.maxHp, mp: petStats.maxMp, sta: petStats.maxSta };
    p.mounts.skills[id] = p.mounts.skill || 'bite';
    p.mounts.active = p.mounts.summoned[0] || null;
    ev.push({ t: 'mount_new', id });
    ev.push({ t: 'msg', text: `[Hệ thống] Nhận thú triệu hồi: ${G.MOUNTS[id].icon} ${G.MOUNTS[id].name}! Mở Menu → Thú đồng hành để gọi thú.`, color: '#ffc94a' });
  }
}

module.exports = { checkRewards, applyRewards };
