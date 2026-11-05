'use strict';
/* UI · Bảng cửa hàng. */
(() => {
  const { G, $, esc, fmt, statText, qOf, itemIcon } = UI._;

  // ---------- Cửa hàng
  function panelShop({ npc }) {
    const n = G.NPCS[npc], p = App.player;
    const discount = Math.round((p.shopDiscount || 0) * 100);
    let html = `<p>Xu của bạn: <b class="gold">${fmt(p.gold)}</b>${discount ? ` · <span class="okc">Khách quen: giảm ${discount}%</span>` : ''}</p><div class="cols"><div><h3 style="margin:0 0 8px">Mua</h3>`;
    // Hàng bán được gom theo bộ trang bị để thấy rõ mỗi bộ dùng cho 10 cấp nào
    const groups = [];
    for (const id of G.shopItems(p, npc)) {
      const set = G.setOfItem(G.ITEMS[id]);
      const key = set ? 'set' + set.id : 'misc';
      let gr = groups.find(g => g.key === key);
      if (!gr) groups.push(gr = { key, set, items: [] });
      gr.items.push(id);
    }
    for (const gr of groups) {
      html += `<div class="muted" style="margin:8px 0 6px;font-size:12px">` +
        (gr.set ? `Bộ ${gr.set.name} · cấp ${gr.set.min}–${gr.set.max}` : 'Thuốc và nguyên liệu') + '</div><div class="list">';
      for (const id of gr.items) {
        const d = G.ITEMS[id];
        const price = G.shopPrice(p, d);
        const can = p.gold >= price;
        const qtyBtns = d.stack
          ? [1, 5, 10].map(q => `<button class="btn small" data-act="buy" data-npc="${npc}" data-item="${id}" data-qty="${q}" ${p.gold >= G.shopPrice(p, d, q) ? '' : 'disabled'}>×${q}</button>`).join(' ')
          : `<button class="btn small" data-act="buy" data-npc="${npc}" data-item="${id}" data-qty="1" ${can ? '' : 'disabled'}>Mua</button>`;
        const st = d.stats ? Object.entries(d.stats).map(([k, v]) => statText(k, v)).join(', ') : (d.desc || '');
        html += `<div class="li"><div class="ic">${itemIcon(id)}</div><div class="main"><b>${d.level && d.level > p.level ? `<span class="bad">${esc(d.name)}</span>` : esc(d.name)}</b>
          <small>${d.level ? 'Cấp ' + d.level + ' · ' : ''}${d.school ? G.SCHOOLS[d.school].name + ' · ' : ''}${esc(st)}</small>
          <small class="gold">${discount ? `<s class="muted">${fmt(d.price)}</s> ` : ''}${fmt(price)} xu</small></div><div class="row">${qtyBtns}</div></div>`;
      }
      html += '</div>';
    }
    html += `</div><div><h3 style="margin:0 0 8px">Bán</h3><div class="list">`;
    const sellable = p.bag.filter(e => G.ITEMS[e.id].price && G.ITEMS[e.id].kind !== 'quest');
    if (!sellable.length) html += '<p class="muted">Không có gì để bán.</p>';
    for (const e of sellable) {
      const d = G.ITEMS[e.id];
      const price = G.sellPrice(e);
      html += `<div class="li"><div class="ic">${itemIcon(e.id)}</div><div class="main"><b class="q${qOf(e)}">${esc(d.name)}${e.plus ? ' +' + e.plus : ''}${e.qty > 1 ? ' ×' + e.qty : ''}</b>
        <small class="gold">${fmt(price)} xu / cái</small></div>
        <button class="btn small" data-act="sell" data-uid="${e.uid}" data-qty="1">Bán 1</button>
        ${e.qty > 1 ? `<button class="btn small" data-act="sell" data-uid="${e.uid}" data-qty="${e.qty}">Hết</button>` : ''}</div>`;
    }
    html += '</div></div></div>';
    return [n.name, html];
  }

  Object.assign(UI._, { panelShop });
  Object.assign(UI._.PANELS, { shop: panelShop });
})();
