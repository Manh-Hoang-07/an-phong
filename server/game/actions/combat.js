'use strict';
/* Luật chơi phía server · Hành động: hạ quái (chống gian lận tốc độ hạ, trùm hồi sinh). */
const G = require('../../../shared');
const { fail, rand } = require('../util');
const { countItem, dropLoot, pruneLoot } = require('../inventory');
const { gainExp, gainGold } = require('../progress');
const { currentQuest, questComplete, questActive, sideDropActive, sideDropNeed } = require('../quests');
const { ensureWeekly, ensureDaily } = require('../periodic');

const lastKill = new Map(); // userId -> {t, boss:{monster:time}}

function killOne(p, a, ev, lk, now) {
  {
    const m = G.MAPS[p.map];
    const mon = G.MONSTERS[a.monster];
    if (!mon || !Object.values(m.spawns).includes(a.monster)) return;
    if (mon.boss && lk.boss[a.monster] && now - lk.boss[a.monster] < mon.respawn * 900) return;
    if (mon.boss) lk.boss[a.monster] = now;

    p.kills[a.monster] = (p.kills[a.monster] || 0) + 1;
    // Tiến độ nhiệm vụ tuần và phụ tuyến
    ensureWeekly(p);
    p.weekly.kills++;
    if (mon.boss) p.weekly.bosses++;
    for (const id in p.side.active) {
      const sq = G.sideById(id);
      if (!sq || !sq.obj.kill || !sq.obj.kill[a.monster]) continue;
      const pr = p.side.active[id].progress;
      pr.kill = pr.kill || {};
      const cur = pr.kill[a.monster] || 0;
      if (cur >= sq.obj.kill[a.monster]) continue;
      pr.kill[a.monster] = cur + 1;
      ev.push({ t: 'msg', text: `${sq.name}: ${mon.name} ${cur + 1}/${sq.obj.kill[a.monster]}`, color: '#a5d6a7' });
      if (G.sideReady(p, id)) ev.push({ t: 'msg', text: `Phụ tuyến đã xong: quay về gặp ${G.NPCS[sq.npc].name}.`, color: '#ffd54f' });
    }
    // Quái thấp hơn mình 5 cấp trở lên cho ít kinh nghiệm
    const diff = p.level - mon.level;
    const expMul = diff >= 8 ? 0.1 : diff >= 5 ? 0.4 : 1;
    const st = G.calcStats(p);
    // exp gốc đã được chia cho hệ số hạng quái; nhân lại hệ số (tinh anh x10, thủ lĩnh x100, boss x200)
    // Bùa nhân đôi kinh nghiệm (p.boosts.exp) nhân thêm x2
    gainExp(p, Math.max(1, Math.round(G.monExp(mon) * expMul * (1 + st.expfind / 100) * G.expBoostMul(p, now))), ev);
    gainGold(p, Math.round(rand(mon.gold[0], mon.gold[1]) * (1 + st.goldfind / 100)), ev);

    // Đồ rơi ra đất ở chỗ quái chết, người chơi đi qua để nhặt
    const x = Number.isFinite(a.x) ? Math.round(a.x) : p.x || 0;
    const y = Number.isFinite(a.y) ? Math.round(a.y) : p.y || 0;
    let n = 0;
    const spot = () => x + (n++ % 2 ? 1 : -1) * Math.ceil(n / 2) * 22;
    // Bỏ đồ đã hết hạn trước khi đếm "đồ còn nằm trên đất". Trước đây đồ hết hạn chỉ bị dọn khi có món khác rơi ra,
    // nên mấy món nhiệm vụ đã biến mất từ lâu vẫn được tính là "chưa nhặt" → server không cho rơi thêm.
    pruneLoot(p);
    for (const [item, chance, onlyQuest, onlySide] of mon.drops) {
      if (onlyQuest && !questActive(p, onlyQuest)) continue;
      if (onlySide && !sideDropActive(p, onlySide)) continue;
      const need = onlyQuest ? (currentQuest(p).obj.collect?.[item] || 0) : onlySide ? sideDropNeed(p, onlySide, item) : 0;
      if (need) {
        const ground = (p.loot || []).filter(l => l.inst.id === item);
        if (countItem(p, item) + ground.length >= need) {
          // Đủ số rồi nhưng còn món nằm ở bản đồ khác: nhắc người chơi (tối đa 1 lần / phút), kẻo tưởng không rơi
          const away = ground.filter(l => l.map !== p.map);
          if (away.length && now - (lk.groundHint || 0) > 60000) {
            lk.groundHint = now;
            const left = Math.ceil((Math.max(...away.map(l => l.until)) - now) / 60000);
            ev.push({ t: 'msg', text: `Còn ${away.length} ${G.ITEMS[item].name} chưa nhặt ở ${G.MAPS[away[0].map].name}. Quay lại nhặt hoặc chờ khoảng ${left} phút để quái rơi lại.`, color: '#ffb74d' });
          }
          continue;
        }
      }
      if (Math.random() < chance) dropLoot(p, { id: item, qty: 1, plus: 0 }, spot(), y, ev);
    }
    if (mon.gear) {
      const [chance, list, extra] = mon.gear;
      const table = mon.boss ? 'boss' : 'normal';
      const drops = (Math.random() < chance ? 1 : 0) + (extra && Math.random() < extra ? 1 : 0);
      for (let i = 0; i < drops; i++) {
        const id = list[Math.floor(Math.random() * list.length)];
        dropLoot(p, G.makeInst(id, { table }), spot(), y, ev);
      }
    }

    if (questActive(p, currentQuest(p)?.id)) {
      const q = currentQuest(p);
      if (q.obj.kill && q.obj.kill[a.monster]) {
        const pr = p.quest.progress;
        pr.kill = pr.kill || {};
        const cur = pr.kill[a.monster] || 0;
        if (cur < q.obj.kill[a.monster]) {
          pr.kill[a.monster] = cur + 1;
          ev.push({ t: 'msg', text: `${q.name}: ${mon.name} ${cur + 1}/${q.obj.kill[a.monster]}`, color: '#a5d6a7' });
        }
      }
    }
    ensureDaily(p);
    for (const d of p.daily.list) {
      if (d.claimed || d.type === 'collect' || d.target !== a.monster || d.have >= d.need) continue;
      d.have++;
      if (d.have === d.need) ev.push({ t: 'msg', text: `Nhiệm vụ ngày xong: hạ ${d.need} ${mon.name}. Về Bảng nhiệm vụ nhận thưởng.`, color: '#ffd54f' });
    }
    const col = p.daily.list.find(d => d.type === 'collect' && !d.claimed);
    if (col && !mon.passive && p.map !== 'lang' && p.map !== 'cong_do') {
      const onGround = (p.loot || []).filter(l => l.inst.id === col.target).length;
      if (countItem(p, col.target) + onGround < col.need && Math.random() < 0.35) dropLoot(p, { id: col.target, qty: 1, plus: 0 }, spot(), y, ev);
    }
    if (mon.boss) ev.push({ t: 'msg', text: `Bạn đã hạ ${mon.name}!`, color: '#ffab40' });
    if (questComplete(p)) ev.push({ t: 'msg', text: `Nhiệm vụ đã hoàn thành, quay về gặp ${G.NPCS[currentQuest(p).npc].name}.`, color: '#ffd54f' });
  }
}

const actions = {
  kill(p, a, ev, userId) {
    actions.kills(p, { list: [a] }, ev, userId);
  },

  // Hạ nhiều quái cùng lúc (đánh lan) gửi gộp một lần cho nhanh
  kills(p, a, ev, userId) {
    const list = Array.isArray(a.list) ? a.list.slice(0, 15) : [];
    if (!list.length) fail('Không có quái.');
    const now = Date.now();
    const lk = lastKill.get(userId) || { t: 0, boss: {} };
    if (now - lk.t < 90) fail('Quá nhanh.');
    lk.t = now;
    lastKill.set(userId, lk);
    for (const k of list) killOne(p, k, ev, lk, now);
  },
};

module.exports = actions;
