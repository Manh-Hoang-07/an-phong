'use strict';
/* UI · Bảng cửa hàng: dạng ô vuông như túi đồ, hai tab Mua / Bán.
   Chọn một ô là hiện ra bên cạnh: thông tin, nút xem chi tiết, mua (bán) 1, mua (bán) nhiều. */
(() => {
  const { G, esc, fmt, qOf, itemIcon, itemInfo, S } = UI._;

  // Ô nhập số lượng: gõ tới đâu cập nhật tổng tiền tới đó (không cần chờ vẽ lại bảng)
  document.addEventListener('input', (e) => {
    const box = e.target.closest && e.target.closest('.shop-qty');
    if (!box) return;
    const out = box.querySelector('[data-total]');
    const n = Math.max(1, Math.min(Number(e.target.max) || 99, Math.floor(Number(e.target.value) || 1)));
    S.shopQty = n;   // nhớ số đã gõ, bảng vẽ lại (server trả lời, tự lưu) không bị mất
    if (out) out.textContent = fmt(n * Number(out.dataset.total)) + ' xu';
    const btn = box.querySelector('[data-act="buy_many"]');
    if (btn) btn.disabled = n * Number(out.dataset.total) > App.player.gold;
  });

  const kindName = (d) => d.slot ? (G.SLOT_NAMES[d.slot] || 'Trang bị')
    : d.kind === 'potion' ? 'Thuốc'
      : d.kind === 'boost' ? 'Bùa hỗ trợ'
        : (UI._.BOOK_KINDS || []).includes(d.kind) ? 'Sách'
          : d.kind === 'pet_gear' ? 'Trang bị thú'
            : d.kind === 'material' ? 'Nguyên liệu' : 'Vật phẩm';

  // Món hàng trong tiệm, dựng thành vật phẩm mẫu để dùng chung hàm hiển thị với túi đồ
  const shopEntry = (id) => G.ITEMS[id].slot ? G.makeInst(id, { shop: true }) : { id, qty: 1, plus: 0 };

  // Hàng bán gom theo bộ trang bị (mỗi bộ dùng cho 10 cấp), cộng một nhóm "Thuốc và vật phẩm"
  function shopGroups(p, npc) {
    const groups = [];
    for (const id of G.shopItems(p, npc)) {
      const set = G.setOfItem(G.ITEMS[id]);
      const key = set ? 'set' + set.id : 'misc';
      let gr = groups.find(g => g.key === key);
      if (!gr) groups.push(gr = { key, set, items: [] });
      gr.items.push(id);
    }
    // Nhóm vật phẩm lên đầu cho dễ thấy
    groups.sort((a, b) => (a.key === 'misc' ? -1 : 0) - (b.key === 'misc' ? -1 : 0));
    return groups;
  }

  // Ô chọn số lượng + nút mua/bán nhiều
  function qtyBox(act, max, unit, attrs, label, canFn) {
    const def = Math.max(1, Math.min(max, S.shopQty || 10));
    return `<div class="shop-qty">
      <div class="shop-qty-row">
        <button class="btn small" data-act="shop_step" data-d="-1">−</button>
        <input type="number" min="1" max="${max}" value="${def}" inputmode="numeric">
        <button class="btn small" data-act="shop_step" data-d="1">+</button>
        <span class="shop-qty-total">= <b class="gold" data-total="${unit}">${fmt(unit * def)} xu</b></span>
      </div>
      <button class="btn act-btn wide" data-act="${act}" ${attrs} ${canFn(def) ? '' : 'disabled'}>${label}</button>
    </div>`;
  }

  // Nút chức năng của món đang chọn (dùng chung cho cột bên và khung chi tiết)
  function shopButtons(npc, entry, where, opts = {}) {
    const p = App.player, d = G.ITEMS[entry.id];
    const btns = [];
    if (!opts.noDetail) btns.push('<button class="btn act-btn wide" data-act="open_detail">🔍 Xem chi tiết</button>');
    if (where === 'shop') {
      const price = G.shopPrice(p, d);
      btns.push(`<button class="btn act-btn primary" data-act="buy" data-npc="${npc}" data-item="${entry.id}" data-qty="1" ${p.gold >= price ? '' : 'disabled'}>🛒 Mua 1</button>`);
      if (d.stack) btns.push(qtyBox('buy_many', 99, price, `data-npc="${npc}" data-item="${entry.id}"`, '🛒 Mua nhiều', n => p.gold >= G.shopPrice(p, d, n)));
    } else {
      const price = G.sellPrice(entry);
      if (!price || d.kind === 'quest') return btns.join('') + '<p class="muted" style="margin:0">Tiệm không thu mua món này.</p>';
      btns.push(`<button class="btn act-btn primary" data-act="sell" data-uid="${entry.uid}" data-qty="1">💰 Bán 1</button>`);
      if (entry.qty > 1) {
        btns.push(`<button class="btn act-btn" data-act="sell" data-uid="${entry.uid}" data-qty="${entry.qty}">💰 Bán hết ${entry.qty}</button>`);
        btns.push(qtyBox('sell_many', entry.qty, price, `data-uid="${entry.uid}"`, '💰 Bán nhiều', () => true));
      }
    }
    return btns.join('');
  }

  // Phần đầu cột bên: biểu tượng, tên, loại · cấp · giá
  function sideHead(entry, where) {
    const p = App.player, d = G.ITEMS[entry.id], q = qOf(entry);
    const price = where === 'shop' ? G.shopPrice(p, d) : G.sellPrice(entry);
    const discount = where === 'shop' && p.shopDiscount ? `<s class="muted">${fmt(d.price)}</s> ` : '';
    const sub = [kindName(d), d.slot ? G.QUALITY_NAMES[q] : '', d.level ? 'Cấp ' + d.level : '', entry.qty > 1 ? '×' + entry.qty : '']
      .filter(Boolean).join(' · ');
    return `<div class="bag-side-head">
        <span class="bag-side-ic">${itemIcon(entry.id)}</span>
        <div><b class="q${q}">${esc(d.name)}${entry.plus ? ' +' + entry.plus : ''}</b>
        <small>${esc(sub)}</small>
        <small class="gold">${where === 'shop' ? 'Giá mua' : 'Giá bán'}: ${discount}${fmt(price)} xu${d.stack || entry.qty > 1 ? ' / cái' : ''}</small></div>
      </div>`;
  }

  function detailModal(npc, entry, where) {
    const d = G.ITEMS[entry.id], q = qOf(entry);
    const cmp = UI._.compareTable ? UI._.compareTable(entry) : '';
    return `<div class="detail-modal" data-act="close_detail">
      <div class="detail-modal-box" data-stop="1">
        <div class="detail-modal-head">
          <b class="q${q}">${esc(d.name)}${entry.plus ? ' +' + entry.plus : ''}</b>
          <button class="btn small" data-act="close_detail" data-close="1">✕ Đóng</button>
        </div>
        <div class="detail-modal-body">
          <div class="detail-modal-sub">${where === 'shop' ? 'Hàng của tiệm' : 'Trong túi đồ'}${entry.qty > 1 ? ' · Số lượng: ' + entry.qty : ''}</div>
          ${sideHead(entry, where)}
          ${itemInfo(entry, { noTitle: true })}
          ${cmp}
        </div>
        <div class="row detail-modal-foot">${shopButtons(npc, entry, where, { noDetail: true })}</div>
      </div></div>`;
  }

  // ---------- Cửa hàng
  function panelShop({ npc }) {
    const n = G.NPCS[npc], p = App.player;
    const tab = S.shopTab === 'sell' ? 'sell' : 'buy';
    const discount = Math.round((p.shopDiscount || 0) * 100);
    const tabs = `<div class="tabs">
      <button class="btn tab ${tab === 'buy' ? 'active' : ''}" data-act="shop_tab" data-tab="buy">🛒 Mua</button>
      <button class="btn tab ${tab === 'sell' ? 'active' : ''}" data-act="shop_tab" data-tab="sell">💰 Bán</button>
    </div>`;

    let main = '', sel = null, where = tab === 'buy' ? 'shop' : 'bag';
    if (tab === 'buy') {
      const groups = shopGroups(p, npc);
      const mySet = G.setOfLevel(p.level);
      let key = groups.some(g => g.key === S.shopGroup) ? S.shopGroup : null;
      if (!key) key = (mySet && groups.find(g => g.key === 'set' + mySet.id) || groups[0] || {}).key;
      const gr = groups.find(g => g.key === key);
      const chips = groups.length > 1 ? `<div class="shop-groups">${groups.map(g =>
        `<button class="btn small ${g.key === key ? 'primary' : ''}" data-act="shop_group" data-key="${g.key}">${g.set
          ? `${esc(g.set.name)} <small>${g.set.min}–${g.set.max}</small>${mySet && g.set.id === mySet.id ? ' ★' : ''}` : 'Vật phẩm'}</button>`).join('')}</div>` : '';
      let grid = '<div class="bag-grid">';
      for (const id of gr ? gr.items : []) {
        const d = G.ITEMS[id];
        const isSel = S.selected && S.selected.where === 'shop' && S.selected.key === id;
        const dim = (d.level && d.level > p.level) || p.gold < G.shopPrice(p, d);
        grid += `<div class="cell qb1${isSel ? ' sel' : ''}${dim ? ' dim' : ''}" data-sel="shop:${id}" title="${esc(d.name)}">${itemIcon(id)}</div>`;
      }
      grid += '</div>';
      main = chips + grid + (n.gearShop ? '<p class="bag-note muted">💠 Trang bị bán ở tiệm có phẩm chất Thường. Đồ Tốt, Hiếm, Huyền thoại chỉ rơi từ quái và trùm.</p>' : '');
      if (S.selected && S.selected.where === 'shop' && G.shopItems(p, npc).includes(S.selected.key)) sel = shopEntry(S.selected.key);
    } else {
      const size = G.bagSize(p);
      let grid = '<div class="bag-grid">';
      for (let i = 0; i < size; i++) {
        const e = p.bag[i];
        if (!e) { grid += '<div class="cell empty"></div>'; continue; }
        const d = G.ITEMS[e.id];
        const isSel = S.selected && S.selected.where === 'bag' && Number(S.selected.key) === e.uid;
        const cant = !G.sellPrice(e) || d.kind === 'quest';
        grid += `<div class="cell qb${qOf(e)}${isSel ? ' sel' : ''}${cant ? ' dim' : ''}" data-sel="bag:${e.uid}" data-tip="${e.uid}">${itemIcon(e.id)}` +
          (e.plus ? `<span class="pl">+${e.plus}</span>` : '') + (e.qty > 1 ? `<span class="n">${e.qty}</span>` : '') + '</div>';
      }
      grid += '</div>';
      main = grid + `<p class="bag-note muted">💠 Tiệm thu mua bằng 1/4 giá gốc. Ô mờ là món không bán được.</p>`;
      if (S.selected && S.selected.where === 'bag') sel = p.bag.find(e => e.uid === Number(S.selected.key)) || null;
    }

    const side = sel ? `${sideHead(sel, where)}
        <div class="bag-side-actions">${shopButtons(npc, sel, where)}</div>
        <div class="bag-side-info">${itemInfo(sel, { noTitle: true, compare: !!G.ITEMS[sel.id].slot })}</div>`
      : `<div class="bag-empty">
          <span>${tab === 'buy' ? '🛒' : '💰'}</span>
          <b>Chọn một món</b>
          <small>${tab === 'buy' ? 'Chọn hàng để xem thông tin, mua 1 hoặc mua nhiều.' : 'Chọn đồ trong túi để xem giá, bán 1 hoặc bán nhiều.'}</small>
        </div>`;

    const html = tabs + `<div class="bag-wrap">
      <div class="bag-main">
        <div class="bag-head">
          <div class="bag-wallet">🪙 <b>${fmt(p.gold)}</b> xu</div>
          ${discount ? `<span class="okc" style="font-size:12px">Khách quen: giảm ${discount}%</span>` : ''}
          ${tab === 'sell' ? `<div class="bag-cap"><span>${p.bag.length}/${G.bagSize(p)} ô</span></div>` : ''}
        </div>
        ${main}
      </div>
      <div class="bag-side">${side}</div>
    </div>`;
    const modal = sel && S.detailOpen === `${S.selected.where}:${S.selected.key}` ? detailModal(npc, sel, where) : '';
    return [n.name, html + modal];
  }

  Object.assign(UI._, { panelShop });
  Object.assign(UI._.PANELS, { shop: panelShop });
})();
