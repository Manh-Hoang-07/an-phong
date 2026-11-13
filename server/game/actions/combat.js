'use strict';
/* Luật chơi phía server · Hành động: hạ quái (chống gian lận tốc độ hạ, trùm hồi sinh). */
const G = require('../../../shared');
const { fail, rand } = require('../util');
const { countItem, dropLoot, pruneLoot } = require('../inventory');
const { gainExp, gainGold } = require('../progress');
const { currentQuest, questComplete, questActive, sideDropActive, sideDropNeed } = require('../quests');
const { ensureWeekly, ensureBoards } = require('../periodic');

const lastKill = new Map(); // userId -> {t, boss:{monster:time}}

// Kinh nghiệm cho linh thú / bóng ma theo người kết liễu: tự hạ 100%, chủ hạ 50%.
// Cấp tối đa của thú/bóng bằng cấp chủ (lên cấp thì hồi đầy).
function grantCompanionExp(p, a, base, ev) {
  if (!(base > 0)) return;
  const ownerLv = Math.max(1, p.level || 1);
  const src = a.source === 'pet' || a.source === 'shadow' ? a.source : 'player';
  // Linh thú của Triệu Hồi Sư (mỗi lần 1 con đang được gọi)
  if (p.summons?.enabled && G.summonCount(p) && (src === 'pet' || src === 'player')) {
    const id = G.summonChoice(p);
    const u = p.summons.units?.[id];
    if (u && u.lv < ownerLv) {
      u.exp += Math.max(1, Math.round(base * (src === 'pet' ? 1 : 0.5)));
      let leveled = false;
      while (u.lv < ownerLv && u.exp >= G.summonExpToNext(u.lv)) { u.exp -= G.summonExpToNext(u.lv); u.lv++; leveled = true; }
      if (u.lv >= ownerLv) u.exp = 0;
      if (leveled) {
        const st = G.summonUnitStats(p, id), state = p.summons.states[id] || (p.summons.states[id] = {});
        state.hp = st.maxHp; state.mp = st.maxMp; state.sta = st.maxSta;
        ev.push({ t: 'msg', text: `${G.SUMMONS[id].name} lên cấp ${u.lv}! Hồi đầy sức mạnh.`, color: '#8be9ff' });
      }
    }
  }
  // Bóng ma trong đội hình: chia đều kinh nghiệm cho các bóng đang hoạt động
  if (p.shadows?.enabled && Array.isArray(p.shadows.active) && p.shadows.active.length && (src === 'shadow' || src === 'player')) {
    const per = base * (src === 'shadow' ? 1 : 0.5) / p.shadows.active.length;
    for (const uid of p.shadows.active) {
      const soul = p.shadows.roster?.find(x => x.uid === uid);
      if (!soul || (Number.isFinite(soul.lv) ? soul.lv : G.shadowTrueLv(soul)) >= ownerLv) continue;
      soul.exp = (Number.isFinite(soul.exp) ? soul.exp : 0) + Math.max(1, Math.round(per));
      soul.lv = G.shadowTrueLv(soul);
      let leveled = false;
      while (soul.lv < ownerLv && soul.exp >= G.shadowExpToNext(soul.lv)) { soul.exp -= G.shadowExpToNext(soul.lv); soul.lv++; leveled = true; }
      if (soul.lv >= ownerLv) soul.exp = 0;
      if (leveled) ev.push({ t: 'msg', text: `${soul.stats?.name || G.MONSTERS[soul.monster]?.name || 'Bóng ma'} lên cấp ${soul.lv}!`, color: '#c6a7ff' });
    }
  }
}

function killOne(p, a, ev, lk, now) {
  {
    const m = G.MAPS[p.map];
    const mon = G.MONSTERS[a.monster];
    if (!mon || !Object.values(m.spawns).includes(a.monster)) return;
    if (mon.boss && lk.boss[a.monster] && now - lk.boss[a.monster] < mon.respawn * 900) return;
    if (mon.boss) lk.boss[a.monster] = now;

    p.kills[a.monster] = (p.kills[a.monster] || 0) + 1;
    const aq = p.advancement?.quest;
    if (aq && aq.need > (aq.progress || 0) && a.source === 'player' && !mon.passive) {
      aq.progress = (aq.progress || 0) + 1;
      ev.push({ t: 'msg', text: `Thử thách bí mật: hạ quái ${aq.progress}/${aq.need}.`, color: '#c6a7ff' });
      if (aq.progress >= aq.need) ev.push({ t: 'msg', text: 'Thử thách hoàn tất. Hãy quay về NPC ẩn ở Tân Đô.', color: '#ffd54f' });
    }
    // Tiến độ nhiệm vụ tuần và phụ tuyến
    // Nhiệm vụ tuần tính cho bảng của làng nơi đang săn (xem periodic.js)
    const huntVillage = G.villageOf(p.map);
    if (huntVillage) {
      const w = ensureWeekly(p, huntVillage);
      w.kills++;
      if (mon.boss) w.bosses++;
    }
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
    const st = G.calcStats(p, { form: !!p.formActive });
    // exp gốc đã được chia cho hệ số hạng quái; nhân lại hệ số (tinh anh x10, thủ lĩnh x100, boss x200)
    // Bùa nhân đôi kinh nghiệm (p.boosts.exp) nhân thêm x2
    gainExp(p, Math.max(1, Math.round(G.monExp(mon) * expMul * (1 + st.expfind / 100) * G.expBoostMul(p, now))), ev);
    gainGold(p, Math.round(rand(mon.gold[0], mon.gold[1]) * (1 + st.goldfind / 100)), ev);
    // Thú/bóng đồng hành cũng ăn kinh nghiệm theo người kết liễu (chênh lệch cấp quái như người chơi)
    grantCompanionExp(p, a, Math.max(1, Math.round(G.monExp(mon) * expMul)), ev);

    // Necromancer thu phục quái do chính người chơi kết liễu; không thay bóng cũ khi đủ chỗ.
    if ((p.school === 'tu_linh_thuat_su' || (p.school === 'trieu_hoi_su' && p.advancement?.unlocked?.tu_linh_thuat_su && p.formActive && p.formChoice === 'evolution')) && a.source === 'player' && !mon.boss && !mon.leader && !mon.passive && !mon.finalBoss) {
      p.shadows = p.shadows || { roster: [], active: [], enabled: false, nextId: 1 };
      if (p.shadows.roster.length < G.SHADOW_ROSTER) {
        // Lưu luôn thông số quái lúc bị hạ để xem lại trong bảng Bóng Ma
        const soul = { uid: p.shadows.nextId++, monster: a.monster, stats: G.monSnapshot(a.monster, p.map) };
        p.shadows.roster.push(soul);
        if (p.shadows.enabled && p.shadows.active.length < G.SHADOW_PARTY) p.shadows.active.push(soul.uid);
        ev.push({ t: 'msg', text: `${mon.name} đã được lưu thành bóng ma (${p.shadows.roster.length}/${G.SHADOW_ROSTER}).`, color: '#c6a7ff' });
      } else if (!p.shadows.fullNotice) {
        p.shadows.fullNotice = true;
        ev.push({ t: 'msg', text: 'Bộ sưu tập bóng ma đã đầy. Hãy giải phóng chỗ trong bảng Bóng Ma để thu thêm.', color: '#ffb74d' });
      }
    }

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
        let id = list[Math.floor(Math.random() * list.length)];
        // Vũ khí rơi: chọn ngẫu nhiên trong vũ khí cùng bậc của mọi class (giữ nguyên tỉ lệ rơi vũ khí / giáp)
        const tier = G.WEAPON_TIER_OF[id];
        if (tier) { const row = Object.values(G.TIER_WEAPONS[tier]); id = row[Math.floor(Math.random() * row.length)]; }
        dropLoot(p, G.makeInst(id, { table }), spot(), y, ev);
      }
    }

    if (questActive(p, currentQuest(p)?.id)) {
      const q = currentQuest(p);
      if (q.obj.kill) {
        const pr = p.quest.progress;
        pr.kill = pr.kill || {};
        // Mỗi lần chỉ đếm mục tiêu quái đầu tiên chưa xong; khi đủ tự chuyển sang loại tiếp theo.
        for (const target in q.obj.kill) {
          const cur = pr.kill[target] || 0, need = q.obj.kill[target];
          if (cur >= need) continue;
          if (target === a.monster) {
            pr.kill[target] = cur + 1;
            ev.push({ t: 'msg', text: `${q.name}: ${mon.name} ${cur + 1}/${need}`, color: '#a5d6a7' });
          }
          break;
        }
      }
    }
    // Nhiệm vụ ngày: tính cho mọi bảng (mỗi làng một bảng) có mục tiêu khớp con quái vừa hạ
    ensureBoards(p);
    const dailies = Object.values(p.dailyByMap || {}).flatMap(b => b.list || []);
    for (const d of dailies) {
      if (d.claimed || d.type === 'collect' || d.target !== a.monster || d.have >= d.need) continue;
      d.have++;
      if (d.have === d.need) ev.push({ t: 'msg', text: `Nhiệm vụ ngày xong: hạ ${d.need} ${mon.name}. Về Bảng nhiệm vụ nhận thưởng.`, color: '#ffd54f' });
    }
    // Vật phẩm cần thu cho các bảng chưa nhận: rơi cho tới khi đủ tổng số cần của mọi bảng
    const colNeed = dailies.filter(d => d.type === 'collect' && !d.claimed).reduce((s, d) => s + d.need, 0);
    if (colNeed && !mon.passive && p.map !== 'lang' && p.map !== 'cong_do') {
      const target = 'loi_nang_luong';
      const onGround = (p.loot || []).filter(l => l.inst.id === target).length;
      if (countItem(p, target) + onGround < colNeed && Math.random() < 0.35) dropLoot(p, { id: target, qty: 1, plus: 0 }, spot(), y, ev);
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
