'use strict';
/* UI · Bảng túi đồ. */
(() => {
  const { G, $, fmt, cellHtml, itemInfo, shopHere, selectedEntry, S } = UI._;

  // ---------- Túi đồ
  function panelBag() {
    const p = App.player;
    let eq = '<div class="equip-grid">';
    for (const s of G.SLOTS) eq += cellHtml(p.equip[s], `data-sel="equip:${s}"`, G.SLOT_NAMES[s]);
    eq += '</div>';
    let grid = '<div class="grid">';
    for (let i = 0; i < G.bagSize(p); i++) {
      const e = p.bag[i];
      grid += cellHtml(e, e ? `data-sel="bag:${e.uid}" data-tip="${e.uid}"` : '');
    }
    grid += '</div>';
    let detail = '<div class="detail muted">Chọn một vật phẩm để xem.</div>';
    const sel = selectedEntry();
    if (sel) {
      const { entry, where } = sel;
      const d = G.ITEMS[entry.id];
      let btns = '';
      if (where === 'bag') {
        if (d.slot) btns += `<button class="btn primary" data-act="equip" data-uid="${entry.uid}">Trang bị</button>`;
        if (d.kind === 'potion') btns += `<button class="btn primary" data-act="use" data-item="${entry.id}">Dùng</button>`;
        if (d.kind === 'book' || d.kind === 'ult_book') btns += `<button class="btn primary" data-act="use" data-item="${entry.id}">Đọc sách</button>`;
        if (d.kind === 'boost') btns += `<button class="btn primary" data-act="use_boost" data-item="${entry.id}">Dùng</button>`;
        if (d.kind === 'transform_book') btns += `<button class="btn primary" data-act="use" data-item="${entry.id}">Đọc sách</button>`;
        if (shopHere() && d.price && d.kind !== 'quest') btns += `<button class="btn" data-act="sell" data-uid="${entry.uid}" data-qty="1">Bán 1</button>`;
        if (shopHere() && d.price && d.kind !== 'quest' && entry.qty > 1) btns += `<button class="btn" data-act="sell" data-uid="${entry.uid}" data-qty="${entry.qty}">Bán hết</button>`;
        // Bỏ đi (ở đâu cũng được): bấm lần đầu hỏi lại, bấm lần nữa mới bỏ
        if (d.kind !== 'quest') {
          const dropBtn = (qty, label) => {
            const ask = S.confirmDrop === `${entry.uid}:${qty}`;
            return `<button class="btn${ask ? ' primary' : ''}" data-act="drop" data-uid="${entry.uid}" data-qty="${qty}">${ask ? '⚠️ Bấm lần nữa để bỏ' : label}</button>`;
          };
          btns += dropBtn(1, entry.qty > 1 ? '🗑 Bỏ 1' : '🗑 Bỏ đi');
          if (entry.qty > 1) btns += dropBtn(entry.qty, '🗑 Bỏ hết');
        }
      } else btns += `<button class="btn" data-act="unequip" data-slot="${sel.key}">Tháo ra</button>`;
      detail = `<div class="detail">${itemInfo(entry, { sell: where === 'bag' && shopHere(), compare: where === 'bag' })}<div class="row" style="margin-top:8px">${btns}</div></div>`;
    }
    return [`Túi đồ (${p.bag.length}/${G.bagSize(p)})`,
      `<div class="inv-wallet">🪙 ${fmt(p.gold)} xu</div><div class="inv"><div>${eq}</div><div>${grid}</div><div class="inv-detail">${detail}
       <p class="muted" style="margin:10px 0 0;font-size:12px">${shopHere() ? 'Đang ở làng: có thể bán đồ trực tiếp từ túi.' : 'Về làng để bán đồ.'}</p></div></div>`];
  }

  Object.assign(UI._, { panelBag });
  Object.assign(UI._.PANELS, { bag: panelBag });
})();
