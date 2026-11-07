/*
 * Truy vấn nhiệm vụ: NPC xuất hiện, phụ tuyến, nhiệm vụ ngày / tuần.
 */
(function (G) {
  'use strict';
  const { expToNext, ITEMS, MONSTERS, NPCS, MAPS, QUESTS, SIDE_QUESTS } = G;

  // NPC có đang xuất hiện ở bản đồ này với tiến độ hiện tại không
  function npcHere(player, mapId, npcId) {
    const m = MAPS[mapId];
    if (!m || !Object.values(m.npcs).includes(npcId)) return false;
    const ap = NPCS[npcId] && NPCS[npcId].appear;
    if (!ap) return true;
    const ranges = ap[mapId];
    if (!ranges) return false;
    const step = player.quest.step;
    return ranges.some(([a, b]) => step >= a && step <= b);
  }

  // Ngày theo giờ Việt Nam (UTC+7), dạng 2026-11-04
  function dailyDate(ms = Date.now()) {
    return new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
  }
  // Phần thưởng mỗi nhiệm vụ ngày theo cấp nhân vật
  function dailyReward(level) {
    return { exp: Math.round(expToNext(level) * 0.22), gold: 40 * level, stones: 1 };
  }

  // Tuần ISO theo giờ Việt Nam, dạng 2026-W45
  function weekKey(ms = Date.now()) {
    const vn = new Date(ms + 7 * 3600 * 1000);
    const t = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y = t.getUTCFullYear();
    const week = Math.ceil((((t - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7);
    return y + '-W' + String(week).padStart(2, '0');
  }
  function weeklyReward(level) {
    return {
      kills: { exp: Math.round(expToNext(level) * 0.5), gold: 100 * level, stones: 8 },
      bosses: { exp: Math.round(expToNext(level) * 0.6), gold: 150 * level, stones: 3, items: [['sach_ky_nang', 1]] },
    };
  }

  function questDone(player, questId) {
    const idx = QUESTS.findIndex(q => q.id === questId);
    return idx >= 0 && player.quest.step > idx;
  }

  // ---------------------------------------------------------------- Hướng dẫn nhiệm vụ: nhận ở đâu, làm ở đâu, trả ở đâu
  const mapName = (id) => (MAPS[id] ? MAPS[id].name : id);
  // Các bản đồ có NPC này ở thời điểm hiện tại của cốt truyện (NPC có thể đổi chỗ theo chương)
  function npcMaps(player, npcId) { return Object.keys(MAPS).filter(m => npcHere(player, m, npcId)); }
  function mobMaps(monId) { return Object.keys(MAPS).filter(m => Object.values(MAPS[m].spawns || {}).includes(monId)); }
  // "Vy (Tân Đô – Khu Hiệp Hội)"
  function npcAt(player, npcId) {
    const maps = npcMaps(player, npcId);
    return `${NPCS[npcId].name}${maps.length ? ' · ' + maps.map(mapName).join(' / ') : ''}`;
  }
  // q: nhiệm vụ chính hoặc phụ tuyến; side: true nếu là phụ tuyến
  function questGuide(player, q, side) {
    const where = [];
    const o = q.obj || {};
    const tagOk = (d) => side ? (d[3] && (q.id === d[3] || q.id.startsWith(d[3] + '-'))) : d[2] === q.id;
    for (const m in o.kill || {}) {
      const maps = mobMaps(m);
      where.push(`Hạ ${MONSTERS[m].name}${maps.length ? ' ở ' + maps.map(mapName).join(', ') : ''}`);
    }
    for (const it in o.collect || {}) {
      // Ưu tiên quái rơi món này RIÊNG cho nhiệm vụ; không có thì mới kể quái rơi ngẫu nhiên
      const src = (pick) => Object.keys(MONSTERS).filter(id => (MONSTERS[id].drops || []).some(d => d[0] === it && pick(d)));
      let mons = src(tagOk);
      if (!mons.length) mons = src(d => !d[2] && !d[3]);
      const maps = [...new Set(mons.flatMap(mobMaps))];
      where.push(`${ITEMS[it].name} rơi từ ${mons.map(id => MONSTERS[id].name).join(', ') || 'quái'}${maps.length ? ' ở ' + maps.map(mapName).join(', ') : ''}`);
    }
    for (const n of o.visit || []) where.push(`Gặp ${npcAt(player, n)}`);
    if (o.level) where.push(`Lên cấp ${o.level} (hạ quái ở bất kỳ đâu)`);
    if (o.school) where.push(`Chọn class ở ${npcAt(player, 'lao_su')}`);
    return { giver: npcAt(player, q.npc), where, turnIn: npcAt(player, q.npc) };
  }

  // ---------------------------------------------------------------- Cổng dịch chuyển
  // Bản đồ nhánh có thể khai báo gate để gom nhiều điểm đến tại một cổng.
  // Các bản đồ tuyến tính giữ từng ký hiệu portal riêng ở hai đầu.
  // Helper này trả vị trí cổng gom hoặc cổng đầu tiên làm điểm xuất hiện mặc định.
  function gateOf(mapId) {
    const m = G.MAPS[mapId];
    if (!m) return null;
    if (m.gate && m.portals && m.portals[m.gate]) return m.gate;
    return Object.keys(m.portals || {})[0] || null;
  }
  // Điểm đến có mở chưa: { ok, reason }
  function portalStatus(player, mapId, ch) {
    const m = G.MAPS[mapId], portal = m && m.portals[ch];
    if (!portal) return { ok: false, reason: 'Không có điểm đến này.' };
    const target = G.MAPS[portal.to];
    const need = [portal.require, target.require].filter(Boolean).find(id => !questDone(player, id));
    if (!need) return { ok: true };
    const q = QUESTS.find(x => x.id === need);
    return { ok: false, reason: q ? `Cần hoàn thành nhiệm vụ "${q.name}"` : 'Chưa mở' };
  }
  // Danh sách điểm đến của cổng trong bản đồ: [{ ch, to, name, ok, reason }]
  function gateDestinations(player, mapId) {
    const m = G.MAPS[mapId];
    return Object.keys((m && m.portals) || {}).map(ch => ({ ch, to: m.portals[ch].to, name: G.MAPS[m.portals[ch].to].name, ...portalStatus(player, mapId, ch) }));
  }

  // ---------------------------------------------------------------- Danh sách toàn bộ bản đồ (bảng Map)
  // Trả về [{ id, name, theme, here, ok, reason, via, mobs, npcs }] theo thứ tự khai báo trong MAPS.
  // ok: đã mở (đủ điều kiện nhiệm vụ). via: ký hiệu cổng ở bản đồ hiện tại dẫn tới map này (nếu có).
  function mapList(player) {
    const cur = player.map;
    const curPortals = (MAPS[cur] && MAPS[cur].portals) || {};
    const viaOf = (to) => Object.keys(curPortals).find(ch => curPortals[ch].to === to) || null;
    return Object.keys(MAPS).map(id => {
      const m = MAPS[id];
      const here = id === cur;
      const via = here ? null : viaOf(id);
      let ok = here, reason = here ? 'Bạn đang ở đây' : '';
      if (!here) {
        if (via) {
          const st = portalStatus(player, cur, via);
          ok = st.ok; reason = st.ok ? 'Đã mở' : st.reason;
        } else if (m.require && !questDone(player, m.require)) {
          const q = QUESTS.find(x => x.id === m.require);
          ok = false; reason = q ? `Cần hoàn thành nhiệm vụ "${q.name}"` : 'Chưa mở';
        } else {
          ok = false; reason = 'Chưa có đường đi từ đây';
        }
      }
      const mobs = [...new Set(Object.values(m.spawns || {}).map(mid => MONSTERS[mid] && MONSTERS[mid].name).filter(Boolean))];
      const npcs = [...new Set(Object.values(m.npcs || {}).map(nid => NPCS[nid] && NPCS[nid].name).filter(Boolean))];
      return { id, name: m.name, theme: m.theme, here, ok, reason, via, mobs, npcs };
    });
  }

  // ---------------------------------------------------------------- Phụ tuyến: truy vấn

  function sideById(id) { return SIDE_QUESTS.find(q => q.id === id); }
  function sideDone(player, id) { return !!(player.side && Array.isArray(player.side.done) && player.side.done.includes(id)); }
  function sideActive(player, id) { return !!(player.side && player.side.active && player.side.active[id]); }
  function sideReqDone(player, req) {
    return QUESTS.some(q => q.id === req) ? questDone(player, req) : sideDone(player, req);
  }
  function sideAvailable(player, id) {
    const q = sideById(id);
    if (!q || sideDone(player, id) || sideActive(player, id)) return false;
    return (q.req || []).every(r => sideReqDone(player, r));
  }
  // Danh sách mục tiêu của phụ tuyến: [mô tả, đã xong]
  function sideLines(player, q) {
    if (!q) return [];
    const pr = (player.side && player.side.active && player.side.active[q.id] && player.side.active[q.id].progress) || {};
    const o = q.obj || {}, out = [];
    if (o.kill) for (const m in o.kill) { const c = pr.kill?.[m] || 0; out.push([`${MONSTERS[m].name}: ${c}/${o.kill[m]}`, c >= o.kill[m]]); }
    if (o.collect) for (const it in o.collect) {
      const c = Math.min(o.collect[it], (player.bag || []).filter(e => e.id === it).reduce((s, e) => s + e.qty, 0));
      out.push([`${ITEMS[it].name}: ${c}/${o.collect[it]}`, c >= o.collect[it]]);
    }
    if (o.visit) for (const n of o.visit) out.push([`Gặp ${NPCS[n].name}`, !!pr.visit?.[n]]);
    if (o.level) out.push([`Đạt cấp ${o.level}`, player.level >= o.level]);
    return out;
  }
  function sideReady(player, id) {
    const q = sideById(id);
    if (!q || !sideActive(player, id)) return false;
    return sideLines(player, q).every(l => l[1]);
  }

  Object.assign(G, { questGuide, npcAt, gateOf, portalStatus, gateDestinations, mapList, npcHere, dailyDate, dailyReward, weekKey, weeklyReward, questDone, sideById, sideDone, sideActive, sideReqDone, sideAvailable, sideLines, sideReady });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
