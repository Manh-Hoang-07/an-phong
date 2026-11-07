'use strict';
/* UI · Hội thoại NPC và lời thoại cốt truyện. */
(() => {
  const { G, $, esc, fmt, NPC_ICONS, keyText, questReady, openPanel } = UI._;

  // ---------- NPC
  function openNpc(id) { openPanel('npc', { id, force: true }); }

  function panelNpc({ id, say }) {
    const n = G.NPCS[id], p = App.player;
    const q = G.QUESTS[p.quest.step];
    const opts = [];
    if (id === 'npc_an') {
      const milestones = [['awaken1',20,'Sách Biến Hình I'],['evolution',25,'Sách Tiến Hóa Chức Nghiệp'],['awaken2',45,'Sách Biến Hình II']];
      const qx = p.advancement?.quest;
      if (qx) opts.push(`<button class="btn ${qx.progress>=qx.need?'primary':''}" data-act="advancement_complete" ${qx.progress>=qx.need?'':'disabled'}>✔ Trả thử thách ${qx.progress}/${qx.need}</button>`);
      else for (const [mid,lv,label] of milestones) if (!p.advancement?.done?.[mid] && !(p.school==='toan_nang'&&mid==='evolution')) opts.push(`<button class="btn ${p.level>=lv?'primary':''}" data-act="advancement_accept" data-milestone="${mid}" ${p.level>=lv?'':'disabled'}>📜 ${label}${p.level>=lv?'':` (cần cấp ${lv})`}</button>`);
      opts.push('<button class="btn" data-act="close">Tạm biệt</button>');
      return [n.name, `<div class="dialog"><div class="face">☠</div><div class="text" style="flex:1"><p>Ba con đường. Ba cuốn sách. Chứng minh sức mạnh bằng cách hạ quái rồi trở về đây.</p><div class="opts">${opts.join('')}</div></div></div>`];
    }
    if (q && q.npc === id) {
      if (p.quest.state === 'none') opts.push(`<button class="btn" data-act="quest_view">❗ Nhiệm vụ: ${esc(q.name)}</button>`);
      else if (questReady()) opts.push(`<button class="btn primary" data-act="quest_complete">✔ Trả nhiệm vụ: ${esc(q.name)}</button>`);
      else opts.push(`<button class="btn" data-act="open" data-panel="quest">… Đang làm: ${esc(q.name)}</button>`);
    }
    if (id === 'lao_su' && !p.school && q && q.id === 'q6' && p.quest.state === 'active') {
      opts.push(`<button class="btn ${p.level >= 5 ? 'primary' : ''}" data-act="open" data-panel="school" ${p.level >= 5 ? '' : 'disabled'}>✨ Thức tỉnh class${p.level >= 5 ? '' : ' (cần cấp 5)'}</button>`);
    }
    // Thức tỉnh biến hình: ấn 1 tại Hội trưởng Khải (cấp 25), ấn 2 tại Lữ khách (cấp 45)
    // Đánh giá hạng thợ săn (không tự lên theo cấp)
    const nr = G.nextRank(p);
    if (id === 'lao_su' && nr) {
      const can = p.level >= nr.level;
      opts.push(`<button class="btn ${can ? 'primary' : ''}" data-act="rank_eval" ${can ? '' : 'disabled'}>📋 Đánh giá hạng: ${G.playerRank(p)} → ${nr.rank}${can ? '' : ` (cần cấp ${nr.level})`}</button>`);
    }
    if (id === 'lao_su' && p.school && Object.keys(p.skills || {}).length) {
      opts.push(`<button class="btn" data-act="reset_skills">♻️ Tẩy điểm kỹ năng (${fmt(100 * p.level)} xu)</button>`);
    }
    // Phụ tuyến do NPC này giao
    for (const sq of G.SIDE_QUESTS.filter(x => x.npc === id)) {
      if (G.sideDone(p, sq.id)) continue;
      if (G.sideActive(p, sq.id)) {
        if (G.sideReady(p, sq.id)) opts.push(`<button class="btn primary" data-act="side_complete" data-id="${sq.id}">✔ Trả phụ tuyến: ${esc(sq.name)}</button>`);
        else opts.push(`<button class="btn" data-act="open" data-panel="quest">… Phụ tuyến: ${esc(sq.name)}</button>`);
      } else if (G.sideAvailable(p, sq.id)) {
        opts.push(`<button class="btn" data-act="side_view" data-id="${sq.id}">❗ Phụ tuyến: ${esc(sq.name)}</button>`);
      }
    }
    if (n.role === 'daily') opts.push('<button class="btn primary" data-act="open" data-panel="daily">📋 Xem nhiệm vụ hằng ngày</button>');
    if (n.role === 'mystic') {
      opts.push('<button class="btn" data-act="open" data-panel="code">🔑 Nói mật mã</button>');
      for (const [sid, sc] of Object.entries(G.SCHOOLS)) {
        const necroPath = sid === 'tu_linh_thuat_su' && p.school === 'trieu_hoi_su';
        if (!sc.special || (!p.unlocks[sid] && !necroPath) || p.school === sid) continue;
        if (necroPath) {
          const ready = p.level >= 25;
          opts.push(`<button class="btn ${ready ? 'primary' : ''}" data-act="awaken_special" data-school="${sid}" ${ready ? '' : 'disabled'}>${sc.icon} Tiến hóa ${esc(sc.name)}${ready ? '' : ' (cần cấp 25)'}</button>`);
        } else {
          opts.push(`<button class="btn ${p.level >= 5 ? 'primary' : ''}" data-act="awaken_pick" data-school="${sid}" ${p.level >= 5 ? '' : 'disabled'}>${sc.icon} Thức tỉnh ${esc(sc.name)}${p.level >= 5 ? '' : ' (cần cấp 5)'}</button>`);
        }
      }
    }
    if (n.shop) opts.push(`<button class="btn" data-act="open" data-panel="shop" data-npc="${id}">🛒 Mua bán</button>`);
    if (n.role === 'smith') opts.push('<button class="btn" data-act="open" data-panel="smith">⚒️ Nâng cấp trang bị</button>');
    if (n.role === 'storage') opts.push('<button class="btn" data-act="open" data-panel="storage">📦 Gửi / lấy đồ</button>');
    opts.push('<button class="btn" data-act="close">Tạm biệt</button>');
    const text = (say || [n.greet]).map(l => `<p>${esc(l)}</p>`).join('');
    return [n.name, `<div class="dialog"><div class="face">${NPC_ICONS[id] || '🙂'}</div><div class="text" style="flex:1">${text}<div class="opts">${opts.join('')}</div></div></div>`];
  }

  function panelStory({ id, lines, button }) {
    const n = G.NPCS[id];
    return [n.name, `<div class="dialog"><div class="face">${NPC_ICONS[id] || '🙂'}</div><div class="text" style="flex:1">` +
      lines.map(l => `<p class="${l.startsWith('[Hệ thống]') ? 'sysline' : ''}">${esc(keyText(l))}</p>`).join('') + `<div class="opts">${button}</div></div></div>`];
  }

  Object.assign(UI._, { openNpc, panelNpc, panelStory });
  Object.assign(UI._.PANELS, { npc: panelNpc, story: panelStory });
  Object.assign(UI, { openNpc });
})();
