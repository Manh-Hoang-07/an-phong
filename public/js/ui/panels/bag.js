'use strict';
/* UI · Bảng túi đồ. Chọn một vật phẩm là hiện ra các nút chức năng: xem chi tiết, sử dụng, trang bị, vứt, bán… */
(() => {
  const { G, esc, fmt, qOf, cellHtml, itemInfo, shopHere, selectedEntry, S } = UI._;

  // Loại vật phẩm đọc được (sách) — dùng chung cho nút "Đọc sách"
  const BOOK_KINDS = ['book', 'ult_book', 'skill_book', 'slot_book', 'erase_book', 'transform_book'];

  // ------------------------------------------------------------ Nút chức năng của vật phẩm đang chọn
  // opts.noDetail: khung chi tiết không cần nút mở chính nó (sẽ thành vòng lặp vô nghĩa)
  function actionButtons(entry, where, opts = {}) {
    const d = G.ITEMS[entry.id];
    const btns = [];
    const add = (act, label, attrs = '', cls = '') =>
      btns.push(`<button class="btn act-btn ${cls}" data-act="${act}" ${attrs}>${label}</button>`);

    // Xem chi tiết: mở khung chi tiết đầy đủ (so sánh với món đang mặc, dòng phụ, độ hoàn hảo…)
    if (!opts.noDetail) add('open_detail', '🔍 Xem chi tiết', '', 'wide');

    if (where === 'bag') {
      if (d.slot) add('equip', '⚔ Trang bị', `data-uid="${entry.uid}"`, 'primary');
      if (d.kind === 'potion') add('use', '🧪 Sử dụng', `data-item="${entry.id}"`, 'primary');
      if (d.kind === 'boost') add('use_boost', '📜 Sử dụng', `data-item="${entry.id}"`, 'primary');
      if (BOOK_KINDS.includes(d.kind)) add('use', '📖 Đọc sách', `data-item="${entry.id}"`, 'primary');
      if (shopHere() && G.sellPrice(entry) && d.kind !== 'quest') {
        add('sell', '💰 Bán 1', `data-uid="${entry.uid}" data-qty="1"`);
        if (entry.qty > 1) add('sell', `💰 Bán ${entry.qty}`, `data-uid="${entry.uid}" data-qty="${entry.qty}"`);
      }
      // Vứt: bấm lần đầu hỏi lại, bấm lần nữa mới vứt (tránh mất đồ do lỡ tay)
      if (d.kind !== 'quest') {
        const dropBtn = (qty, label) => {
          const ask = S.confirmDrop === `${entry.uid}:${qty}`;
          return `<button class="btn act-btn danger${ask ? ' confirm' : ''}" data-act="drop" data-uid="${entry.uid}" data-qty="${qty}">${ask ? '⚠ Bấm lần nữa để vứt' : label}</button>`;
        };
        btns.push(dropBtn(1, entry.qty > 1 ? '🗑 Vứt 1' : '🗑 Vứt đi'));
        if (entry.qty > 1) btns.push(dropBtn(entry.qty, '🗑 Vứt hết'));
      }
    } else if (where === 'equip') {
      add('unequip', '⤓ Tháo ra', `data-slot="${S.selected.key}"`);
    }
    return btns.join('');
  }

  // ------------------------------------------------------------ Bảng so sánh đầy đủ (chỉ có trong khung chi tiết)
  // Bảng bên cạnh chỉ nói vắn tắt "mạnh hơn/yếu hơn"; ở đây liệt kê từng chỉ số để nhìn ra ngay nên đổi hay không.
  function compareTable(entry) {
    const d = G.ITEMS[entry.id];
    if (!d.slot) return '';
    const cur = App.player.equip[d.slot];
    if (!cur || cur.uid === entry.uid) return '';
    const a = G.instStats(entry).all, b = G.instStats(cur).all;
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    if (!keys.length) return '';
    const rows = keys.map(k => {
      const av = a[k] || 0, bv = b[k] || 0, dv = Math.round((av - bv) * 10) / 10;
      const cls = dv > 0 ? 'up' : dv < 0 ? 'down' : 'muted';
      const sign = dv > 0 ? '▲' : dv < 0 ? '▼' : '';
      return `<tr><td>${G.statLabel(k)}</td>
        <td>+${av}${G.statUnit(k)}</td>
        <td class="muted">+${bv}${G.statUnit(k)}</td>
        <td class="${cls}">${dv > 0 ? '+' : ''}${dv}${G.statUnit(k)} ${sign}</td></tr>`;
    }).join('');
    return `<div class="cmp-block">
      <div class="cmp-h">So với món đang mặc: <b class="q${qOf(cur)}">${esc(G.ITEMS[cur.id].name)}${cur.plus ? ' +' + cur.plus : ''}</b></div>
      <table class="cmp-table">
        <thead><tr><th>Chỉ số</th><th>Món này</th><th>Đang mặc</th><th>Chênh lệch</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  // ------------------------------------------------------------ Khung chi tiết đầy đủ
  // Nội dung ở đây phải NHIỀU HƠN bảng bên cạnh, nếu không thì mở ra cũng bằng không mở.
  function detailModal(entry, where) {
    const d = G.ITEMS[entry.id];
    const q = qOf(entry);
    const pos = where === 'equip' ? `Đang mặc · ${G.SLOT_NAMES[S.selected.key] || ''}` : 'Trong túi đồ';
    return `<div class="detail-modal" data-act="close_detail">
      <div class="detail-modal-box" data-stop="1">
        <div class="detail-modal-head">
          <b class="q${q}">${esc(d.name)}${entry.plus ? ' +' + entry.plus : ''}</b>
          <button class="btn small" data-act="close_detail" data-close="1">✕ Đóng</button>
        </div>
        <div class="detail-modal-body">
          <div class="detail-modal-sub">${esc(pos)}${entry.qty > 1 ? ' · Số lượng: ' + entry.qty : ''}</div>
          ${itemInfo(entry, { noTitle: true, sell: true })}
          ${compareTable(entry)}
        </div>
        <div class="row detail-modal-foot">${actionButtons(entry, where, { noDetail: true })}</div>
      </div></div>`;
  }

  // ------------------------------------------------------------ Túi đồ
  function panelBag() {
    const p = App.player;
    const size = G.bagSize(p);
    const used = p.bag.length;
    const pct = Math.min(100, Math.round(used / size * 100));

    let grid = '<div class="bag-grid">';
    for (let i = 0; i < size; i++) {
      const e = p.bag[i];
      grid += cellHtml(e, e ? `data-sel="bag:${e.uid}" data-tip="${e.uid}"` : '');
    }
    grid += '</div>';

    const sel = selectedEntry();
    let side;
    if (sel) {
      const { entry, where } = sel;
      const d = G.ITEMS[entry.id];
      const q = qOf(entry);
      // Dòng phụ dưới tên: loại đồ, phẩm chất, cấp, số lượng
      const kindName = d.slot ? (G.SLOT_NAMES[d.slot] || 'Trang bị')
        : d.kind === 'potion' ? 'Thuốc'
          : d.kind === 'boost' ? 'Bùa hỗ trợ'
            : BOOK_KINDS.includes(d.kind) ? 'Sách'
              : d.kind === 'pet_gear' ? 'Trang bị thú'
                : d.kind === 'material' ? 'Nguyên liệu'
                  : d.kind === 'quest' ? 'Vật phẩm nhiệm vụ' : 'Vật phẩm';
      const sub = [kindName, d.slot ? G.QUALITY_NAMES[q] : '', d.level ? 'Cấp ' + d.level : '', entry.qty > 1 ? '×' + entry.qty : '']
        .filter(Boolean).join(' · ');
      side = `<div class="bag-side-head">
          <span class="bag-side-ic">${UI._.itemIcon(entry.id)}</span>
          <div><b class="q${q}">${esc(d.name)}${entry.plus ? ' +' + entry.plus : ''}</b>
          <small>${esc(sub)}</small></div>
        </div>
        <div class="bag-side-actions">${actionButtons(entry, where)}</div>
        <div class="bag-side-info">${itemInfo(entry, { noTitle: true, compare: where === 'bag', sell: where === 'bag' && shopHere() })}</div>`;
    } else {
      side = `<div class="bag-empty">
          <span>🎒</span>
          <b>Chọn một vật phẩm</b>
          <small>Các nút chức năng sẽ hiện ra ở đây: xem chi tiết, sử dụng, trang bị, vứt, bán…</small>
        </div>`;
    }

    const html = `<div class="bag-wrap">
      <div class="bag-main">
        <div class="bag-head">
          <div class="bag-wallet">🪙 <b>${fmt(p.gold)}</b> xu</div>
          <div class="bag-cap"><span>${used}/${size} ô</span><div class="bag-cap-track"><i style="width:${pct}%"></i></div></div>
        </div>
        ${grid}
        <p class="bag-note muted">${shopHere() ? '💠 Đang ở làng: bán được đồ trực tiếp từ túi.' : '💠 Về làng để bán đồ.'}</p>
      </div>
      <div class="bag-side">${side}</div>
    </div>`;
    const modal = sel && S.detailOpen === `${sel.where}:${sel.key}` ? detailModal(sel.entry, sel.where) : '';
    return [`Túi đồ`, html + modal];
  }

  Object.assign(UI._, { panelBag, bagActionButtons: actionButtons, detailModal, compareTable, BOOK_KINDS });
  Object.assign(UI._.PANELS, { bag: panelBag });
})();
