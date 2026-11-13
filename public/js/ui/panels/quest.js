'use strict';
/* UI · Bảng nhiệm vụ: cốt truyện, hướng dẫn nhận/làm/trả, phụ tuyến, nhiệm vụ hằng ngày. */
(() => {
  const { G, esc, fmt, keyText, questLines, sidePanelHtml, dailyLines, resetIn } = UI._;

  // Khối "nhận ở đâu / làm ở đâu / trả cho ai" (state: 'none' chưa nhận, 'active' đang làm)
  function guideHtml(g, state) {
    const row = (ico, label, text, on) => `<div class="qg-row${on ? ' on' : ''}"><span class="qg-ic">${ico}</span><b>${label}</b><span class="qg-txt">${esc(text)}</span></div>`;
    return '<div class="quest-guide">' +
      row('📍', 'Nhận', g.giver, state === 'none') +
      (g.where.length ? row('🗺️', 'Làm', g.where.join(' · '), state === 'active') : '') +
      row('🏁', 'Trả', g.turnIn, false) + '</div>';
  }

  const sectionH = (title, extra = '') => `<div class="q-section-h">${title}${extra ? ` <small>${extra}</small>` : ''}</div>`;

  function panelQuest() {
    const p = App.player;
    const q = G.QUESTS[p.quest.step];
    const doneList = G.QUESTS.slice(0, p.quest.step).map(x => `<div class="q-done">✓ ${esc(x.name)}</div>`).join('');
    const dl = dailyLines(p);

    if (!q) {
      return ['Nhiệm vụ', `<div class="q-wrap">
        <div class="q-card">
          <div class="q-card-h">Cốt truyện hoàn tất</div>
          <p>Bạn đã hoàn thành tất cả chương. Cốt truyện kết thúc!</p>
          <p class="muted">Cổng SS ở phía đông Tân Đô đã mở cho chế độ end-game.</p>
        </div>
        ${sidePanelHtml(p)}
        ${dl.length ? `<div class="q-card">${sectionH('Nhiệm vụ hằng ngày', `làm mới sau ${resetIn()}`)}
          ${dl.map(l => `<div class="q-daily${l.x.claimed ? ' done' : ''}">${l.x.claimed ? '✓' : l.icon} ${esc(l.text)} <b>${l.have}/${l.x.need}</b>${l.x.claimed ? ' (đã nhận)' : ''}</div>`).join('')}</div>` : ''}
        ${doneList ? `<div class="q-card">${sectionH('Đã hoàn thành')}${doneList}</div>` : ''}
      </div>`];
    }

    // ---------- Nhiệm vụ chính
    const stateLabel = { none: 'Chưa nhận', active: 'Đang làm', ready: 'Có thể trả' }[p.quest.state] || '';
    let main = `<div class="q-card q-main">
      <div class="q-card-h">${esc(q.name)}<span class="q-state ${p.quest.state}">${stateLabel}</span></div>
      ${guideHtml(G.questGuide(p, q, false), p.quest.state)}`;

    if (p.quest.state === 'none' && G.questMinLevel(q) > 1) {
      const need = G.questMinLevel(q), ok = p.level >= need;
      main += `<p class="q-req${ok ? ' ok' : ' bad'}">${ok ? '✓' : '🔒'} Cần đạt cấp ${need} để nhận nhiệm vụ${ok ? '' : ` (bạn đang cấp ${p.level})`}</p>`;
    }
    if (p.quest.state !== 'none') {
      main += `<div class="q-lines">${q.start.map(l => `<p class="muted">${esc(keyText(l))}</p>`).join('')}</div>`;
      const objs = questLines(p);
      main += `<div class="q-objs">${objs.map(([t, ok]) => `<div class="q-obj${ok ? ' ok' : ''}">${ok ? '✓' : '•'} ${esc(t)}</div>`).join('')}</div>`;
      const r = q.reward;
      const items = r.items.map(([id, n]) => G.ITEMS[id].name + (n > 1 ? ' ×' + n : '')).join(', ');
      main += `<div class="q-reward"><b>Phần thưởng</b>
        <span>${fmt(r.exp)} kinh nghiệm</span><span class="gold">${fmt(r.gold)} xu</span>
        ${items ? `<span>${esc(items)}</span>` : ''}
        ${r.schoolWeapon ? '<span>vũ khí class</span>' : ''}
        ${r.perk && G.PERKS[r.perk] ? `<span>nội tại "${esc(G.PERKS[r.perk].name)}"</span>` : ''}</div>`;
    }
    main += '</div>';

    const daily = dl.length ? `<div class="q-card">${sectionH('Nhiệm vụ hằng ngày', `làm mới sau ${resetIn()}`)}
      ${dl.map(l => `<div class="q-daily${l.x.claimed ? ' done' : l.done ? ' ok' : ''}">${l.x.claimed ? '✓' : l.icon} ${esc(l.text)} <b>${l.have}/${l.x.need}</b>${l.x.claimed ? ' (đã nhận)' : ''}</div>`).join('')}</div>` : '';

    const done = doneList ? `<div class="q-card">${sectionH('Đã hoàn thành')}${doneList}</div>` : '';

    return ['Nhiệm vụ', `<div class="q-wrap">${main}${sidePanelHtml(p)}${daily}${done}</div>`];
  }

  Object.assign(UI._, { panelQuest, guideHtml });
  Object.assign(UI._.PANELS, { quest: panelQuest });
})();
