'use strict';
/* Luật chơi phía server · Hành động: nói chuyện NPC, nhiệm vụ chính / phụ / ngày / tuần. */
const G = require('../../../shared');
const { fail } = require('../util');
const { bagFree, slotsNeeded, removeItem, giveItem } = require('../inventory');
const { gainExp, gainGold } = require('../progress');
const { currentQuest, questComplete, onCurrentMapNpc } = require('../quests');
const { ensureWeekly, ensureDaily, dailyDone } = require('../periodic');

const actions = {
  talk(p, a, ev) {
    if (!onCurrentMapNpc(p, a.npc)) fail('NPC không ở đây.');
    const q = currentQuest(p);
    if (q && p.quest.state === 'active' && q.obj.visit && q.obj.visit.includes(a.npc)) {
      const pr = p.quest.progress;
      pr.visit = pr.visit || {};
      if (!pr.visit[a.npc]) {
        pr.visit[a.npc] = true;
        ev.push({ t: 'msg', text: `${q.name}: đã gặp ${G.NPCS[a.npc].name}.`, color: '#a5d6a7' });
        if (questComplete(p)) ev.push({ t: 'msg', text: `Nhiệm vụ đã hoàn thành, quay về gặp ${G.NPCS[q.npc].name}.`, color: '#ffd54f' });
      }
    }
    // Ghi nhận mục tiêu "gặp" của phụ tuyến đang làm
    for (const id in p.side.active) {
      const sq = G.sideById(id);
      if (!sq || !sq.obj.visit || !sq.obj.visit.includes(a.npc)) continue;
      const pr = p.side.active[id].progress;
      pr.visit = pr.visit || {};
      if (pr.visit[a.npc]) continue;
      pr.visit[a.npc] = true;
      ev.push({ t: 'msg', text: `${sq.name}: đã gặp ${G.NPCS[a.npc].name}.`, color: '#a5d6a7' });
      if (G.sideReady(p, id)) ev.push({ t: 'msg', text: `Phụ tuyến đã xong: quay về gặp ${G.NPCS[sq.npc].name}.`, color: '#ffd54f' });
    }
  },

  quest_accept(p, a, ev) {
    const q = currentQuest(p);
    if (!q) fail('Bạn đã làm hết nhiệm vụ hiện có.');
    if (!onCurrentMapNpc(p, q.npc)) fail('Hãy đến gặp người giao nhiệm vụ.');
    if (p.quest.state !== 'none') fail('Bạn đang làm nhiệm vụ này rồi.');
    p.quest.state = 'active';
    p.quest.progress = {};
    ev.push({ t: 'msg', text: `Nhận nhiệm vụ: ${q.name}`, color: '#ffd54f' });
  },

  quest_complete(p, a, ev) {
    const q = currentQuest(p);
    if (!q) fail('Không có nhiệm vụ.');
    if (!onCurrentMapNpc(p, q.npc)) fail('Hãy đến gặp người giao nhiệm vụ.');
    if (!questComplete(p)) fail('Nhiệm vụ chưa xong.');
    const r = q.reward;
    let items = r.items.slice();
    if (r.schoolWeapon) {
      // Vũ khí bậc đầu đúng loại của class
      const id = G.classTierWeapon(p.school, 'sat');
      if (id) items = items.concat([[id, 1]]);
    }
    if (r.craftWeapon) {
      const id = G.classTierWeapon(p.school, 'bang_long');
      if (id) items = items.concat([[id, 1]]);
    }
    const need = items.reduce((s, [id, n]) => s + slotsNeeded(p, id, n), 0);
    if (bagFree(p) < need) fail(`Túi cần trống ít nhất ${need} ô để nhận thưởng.`);
    if (q.obj.collect) for (const it in q.obj.collect) removeItem(p, it, q.obj.collect[it]);
    p.quest.step++;
    p.quest.state = 'none';
    p.quest.progress = {};
    ev.push({ t: 'msg', text: `Hoàn thành nhiệm vụ: ${q.name}`, color: '#ffd54f' });
    gainExp(p, r.exp, ev);
    gainGold(p, r.gold, ev);
    if (r.skillPoints) {
      p.skillPoints += r.skillPoints;
      ev.push({ t: 'msg', text: `[Hệ thống] Nhận ${r.skillPoints} điểm kỹ năng.`, color: '#4fc3f7' });
    }
    if (r.perk && G.PERKS[r.perk] && !p.perks.includes(r.perk)) {
      p.perks.push(r.perk);
      ev.push({ t: 'perk', perk: r.perk });
      ev.push({ t: 'msg', text: `[Hệ thống] Nhận nội tại cốt truyện: ${G.PERKS[r.perk].name}.`, color: '#ffc94a' });
    }
    for (const [id, n] of items) giveItem(p, id, n, ev);
  },

  side_accept(p, a, ev) {
    const q = G.sideById(a.id);
    if (!q) fail('Phụ tuyến không hợp lệ.');
    if (!G.sideAvailable(p, q.id)) fail('Chưa thể nhận phụ tuyến này.');
    if (!onCurrentMapNpc(p, q.npc)) fail('Hãy đến gặp người giao phụ tuyến.');
    p.side.active[q.id] = { progress: {} };
    ev.push({ t: 'msg', text: `Nhận phụ tuyến: ${q.name}`, color: '#ffd54f' });
  },

  side_complete(p, a, ev) {
    const q = G.sideById(a.id);
    if (!q) fail('Phụ tuyến không hợp lệ.');
    if (!G.sideActive(p, q.id)) fail('Bạn chưa nhận phụ tuyến này.');
    if (!G.sideReady(p, q.id)) fail('Phụ tuyến chưa hoàn thành.');
    if (!onCurrentMapNpc(p, q.npc)) fail('Hãy đến gặp người giao phụ tuyến.');
    const r = q.reward || {};
    const items = r.items || [];
    const extra = (r.bagPlus || 0) * 10;
    const need = items.reduce((s, [id, n]) => s + slotsNeeded(p, id, n), 0);
    if (p.bag.length + need > G.bagSize(p) + extra) fail('Túi đã đầy, hãy dọn bớt trước khi nhận thưởng.');
    if (r.bagPlus) {
      p.bagPlus = Math.min(3, (p.bagPlus || 0) + r.bagPlus);
      ev.push({ t: 'msg', text: `[Hệ thống] Túi đồ mở rộng thêm ${r.bagPlus * 10} ô (${G.bagSize(p)} ô).`, color: '#69f0ae' });
    }
    if (q.obj.collect) for (const it in q.obj.collect) removeItem(p, it, q.obj.collect[it]);
    delete p.side.active[q.id];
    if (!p.side.done.includes(q.id)) p.side.done.push(q.id);
    ev.push({ t: 'msg', text: `Hoàn thành phụ tuyến: ${q.name}`, color: '#ffd54f' });
    ev.push({ t: 'side', id: q.id, name: q.name });
    if (r.exp) gainExp(p, r.exp, ev);
    if (r.gold) gainGold(p, r.gold, ev);
    if (r.shopDiscount) {
      p.shopDiscount = Math.max(p.shopDiscount || 0, r.shopDiscount);
      ev.push({ t: 'msg', text: `[Hệ thống] Giảm giá cửa hàng: ${Math.round(p.shopDiscount * 100)}%.`, color: '#69f0ae' });
    }
    if (r.perk && G.PERKS[r.perk] && !p.perks.includes(r.perk)) {
      p.perks.push(r.perk);
      ev.push({ t: 'perk', perk: r.perk });
      ev.push({ t: 'msg', text: `[Hệ thống] Nhận nội tại: ${G.PERKS[r.perk].name}.`, color: '#ffc94a' });
    }
    for (const [id, n] of items) giveItem(p, id, n, ev);
    if (r.unlockShop && G.ITEMS[r.unlockShop]) ev.push({ t: 'msg', text: `[Hệ thống] Mở bán ${G.ITEMS[r.unlockShop].name} tại Dược sư Lan.`, color: '#69f0ae' });
  },

  weekly_claim(p, a, ev) {
    if (!onCurrentMapNpc(p, 'bang_nv')) fail('Hãy đến Bảng nhiệm vụ của Hiệp Hội.');
    ensureWeekly(p);
    const w = p.weekly, kind = a.kind, r = G.weeklyReward(p.level);
    if (kind === 'kills') {
      if (w.claimedKills) fail('Tuần này bạn đã nhận thưởng diệt quái rồi.');
      if (w.kills < G.WEEKLY_KILLS) fail(`Cần hạ ${G.WEEKLY_KILLS} quái (${w.kills}/${G.WEEKLY_KILLS}).`);
      const need = slotsNeeded(p, 'da_cuong_hoa', r.kills.stones);
      if (bagFree(p) < need) fail('Túi đã đầy.');
      w.claimedKills = true;
      gainExp(p, r.kills.exp, ev);
      gainGold(p, r.kills.gold, ev);
      giveItem(p, 'da_cuong_hoa', r.kills.stones, ev);
      ev.push({ t: 'msg', text: '[Hệ thống] Hoàn thành nhiệm vụ tuần: diệt quái.', color: '#ffd54f' });
    } else if (kind === 'bosses') {
      if (w.claimedBosses) fail('Tuần này bạn đã nhận thưởng trùm rồi.');
      if (w.bosses < G.WEEKLY_BOSSES) fail(`Cần hạ ${G.WEEKLY_BOSSES} trùm (${w.bosses}/${G.WEEKLY_BOSSES}).`);
      const need = slotsNeeded(p, 'da_cuong_hoa_cao', r.bosses.stones) + slotsNeeded(p, 'sach_ky_nang', 1);
      if (bagFree(p) < need) fail('Túi đã đầy.');
      w.claimedBosses = true;
      gainExp(p, r.bosses.exp, ev);
      gainGold(p, r.bosses.gold, ev);
      giveItem(p, 'da_cuong_hoa_cao', r.bosses.stones, ev);
      giveItem(p, 'sach_ky_nang', 1, ev);
      ev.push({ t: 'msg', text: '[Hệ thống] Hoàn thành nhiệm vụ tuần: hạ trùm.', color: '#ffd54f' });
    } else fail('Loại nhiệm vụ tuần không hợp lệ.');
  },

  daily_claim(p, a, ev) {
    if (!onCurrentMapNpc(p, 'bang_nv')) fail('Hãy đến Bảng nhiệm vụ của Hiệp Hội.');
    ensureDaily(p);
    const d = p.daily.list[Number(a.i)];
    if (!d) fail('Không có nhiệm vụ này.');
    if (d.claimed) fail('Đã nhận thưởng rồi.');
    if (!dailyDone(p, d)) fail('Nhiệm vụ chưa xong.');
    if (bagFree(p) < 1 && !p.bag.some(e => e.id === 'da_cuong_hoa')) fail('Túi đã đầy.');
    if (d.type === 'collect') removeItem(p, d.target, d.need);
    d.claimed = true;
    const r = G.dailyReward(p.level);
    const mul = d.type === 'boss' ? 2 : 1;
    ev.push({ t: 'msg', text: 'Hoàn thành nhiệm vụ ngày.', color: '#ffd54f' });
    gainExp(p, r.exp * mul, ev);
    gainGold(p, r.gold * mul, ev);
    giveItem(p, 'da_cuong_hoa', r.stones * mul, ev);
  },

  daily_bonus(p, a, ev) {
    if (!onCurrentMapNpc(p, 'bang_nv')) fail('Hãy đến Bảng nhiệm vụ của Hiệp Hội.');
    ensureDaily(p);
    if (!p.daily.list.length || !p.daily.list.every(d => d.claimed)) fail('Hãy hoàn thành cả 3 nhiệm vụ ngày.');
    if (p.daily.bonus) fail('Hôm nay bạn đã nhận thưởng thêm rồi.');
    const b = G.DAILY_BONUS;
    const need = 1 + b.items.length;
    if (bagFree(p) < need) fail(`Túi cần trống ít nhất ${need} ô.`);
    p.daily.bonus = true;
    ev.push({ t: 'msg', text: '[Hệ thống] Hoàn thành toàn bộ nhiệm vụ ngày!', color: '#ffd54f' });
    giveItem(p, 'da_cuong_hoa', b.stones, ev);
    for (const [id, n] of b.items) giveItem(p, id, n, ev);
  },
};

module.exports = actions;
