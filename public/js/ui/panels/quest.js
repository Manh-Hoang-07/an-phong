'use strict';
/* UI · Bảng nhiệm vụ. */
(() => {
  const { G, $, esc, fmt, keyText, questLines, sidePanelHtml, dailyLines, resetIn } = UI._;

  // Khối "nhận ở đâu / làm ở đâu / trả cho ai" (state: 'none' chưa nhận, 'active' đang làm)
  function guideHtml(g, state) {
    const row = (ico, label, text, on) => `<div class="qg-row${on ? ' on' : ''}"><span>${ico}</span><b>${label}</b><span>${esc(text)}</span></div>`;
    return '<div class="quest-guide">' +
      row('📍', 'Nhận', g.giver, state === 'none') +
      (g.where.length ? row('🗺️', 'Làm', g.where.join(' · '), state === 'active') : '') +
      row('🏁', 'Trả', g.turnIn, false) + '</div>';
  }

  // ---------- Nhiệm vụ
  function panelQuest() {
    const p = App.player;
    const q = G.QUESTS[p.quest.step];
    const doneList = G.QUESTS.slice(0, p.quest.step).map(x => `<div class="okc">✓ ${esc(x.name)}</div>`).join('');
    if (!q) return ['Nhiệm vụ', `<p>Bạn đã hoàn thành tất cả chương. Cốt truyện kết thúc!</p><p class="muted">Cổng SS ở phía đông Tân Đô đã mở cho chế độ end-game.</p>${sidePanelHtml(p)}${dailyLines(p).map(l => `<div>${l.icon} ${esc(l.text)} ${l.have}/${l.x.need}${l.x.claimed ? ' ✓' : ''}</div>`).join('')}<hr style="border-color:#333">${doneList}`];
    let html = `<h3 class="gold" style="margin:0 0 6px">${esc(q.name)}</h3>`;
    html += guideHtml(G.questGuide(p, q, false), p.quest.state);
    if (p.quest.state === 'none' && G.questMinLevel(q) > 1) {
      const need = G.questMinLevel(q), ok = p.level >= need;
      html += `<p class="${ok ? 'okc' : ''}" style="margin:4px 0;${ok ? '' : 'color:#ff8a80'}">${ok ? '✓' : '🔒'} Cần đạt cấp ${need} để nhận nhiệm vụ${ok ? '' : ` (bạn đang cấp ${p.level})`}</p>`;
    }
    if (p.quest.state !== 'none') {
      html += q.start.map(l => `<p class="muted" style="margin:0 0 4px">${esc(keyText(l))}</p>`).join('');
      html += '<div style="margin:10px 0">' + questLines(p).map(([t, ok]) => `<div class="${ok ? 'okc' : ''}">${ok ? '✓' : '•'} ${esc(t)}</div>`).join('') + '</div>';
      const r = q.reward;
      html += `<p>Phần thưởng: ${fmt(r.exp)} kinh nghiệm, ${fmt(r.gold)} xu${r.items.map(([id, n]) => ', ' + G.ITEMS[id].name + (n > 1 ? ' ×' + n : '')).join('')}${r.schoolWeapon ? ', vũ khí class' : ''}${r.perk && G.PERKS[r.perk] ? ', nội tại "' + G.PERKS[r.perk].name + '"' : ''}</p>`;
    }
    html += sidePanelHtml(p);
    const dl = dailyLines(p);
    if (dl.length) {
      html += `<hr style="border-color:#333"><div class="muted">Nhiệm vụ hằng ngày (nhận thưởng ở Bảng nhiệm vụ, làm mới sau ${resetIn()}):</div>` +
        dl.map(l => `<div class="${l.x.claimed || l.done ? 'okc' : ''}">${l.x.claimed ? '✓' : l.icon} ${esc(l.text)} ${l.have}/${l.x.need}${l.x.claimed ? ' (đã nhận)' : ''}</div>`).join('');
    }
    if (doneList) html += `<hr style="border-color:#333"><div class="muted">Đã hoàn thành:</div>${doneList}`;
    return ['Nhiệm vụ', html];
  }

  Object.assign(UI._, { panelQuest, guideHtml });
  Object.assign(UI._.PANELS, { quest: panelQuest });
})();
