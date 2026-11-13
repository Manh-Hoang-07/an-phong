'use strict';
/* UI · Bảng kho đồ. Mỗi làng một kho riêng (G.STORAGE_SIZE ô); chỉ thấy và dùng được kho của làng đang đứng. */
(() => {
  const { G, $, cellHtml } = UI._;

  // ---------- Kho
  function panelStorage() {
    const p = App.player;
    const kho = G.storageOf(p);
    const keeper = G.npcByRole(p, p.map, 'storage');
    const title = keeper ? G.NPCS[keeper].name : 'Kho';
    const villageName = G.MAPS[p.map] ? G.MAPS[p.map].name : '';
    // Kho từ trước khi chia theo làng có thể đang vượt giới hạn: hiện đủ số ô, chỉ không nhận thêm
    const size = Math.max(G.STORAGE_SIZE, kho.length);
    const grid = (list, size, where) => {
      let h = '<div class="grid">';
      for (let i = 0; i < size; i++) { const e = list[i]; h += cellHtml(e, e ? `data-act="${where === 'bag' ? 'store' : 'retrieve'}" data-uid="${e.uid}" data-tip="${e.uid}" data-tipwhere="${where}"` : ''); }
      return h + '</div>';
    };
    const full = kho.length >= G.STORAGE_SIZE;
    return [title, `<p class="muted">Kho riêng của <b>${villageName}</b>: đồ gửi ở đây chỉ lấy lại được ở đây. Bấm vào vật phẩm để chuyển qua lại giữa túi và kho.</p>
      ${kho.length > G.STORAGE_SIZE ? '<p style="color:#ffb74d">Kho đang vượt giới hạn. Hãy lấy bớt đồ ra để gửi thêm.</p>' : full ? '<p style="color:#ffb74d">Kho đã đầy.</p>' : ''}
      <div class="cols">
      <div><h3 style="margin:0 0 8px">Túi (${p.bag.length}/${G.bagSize(p)})</h3>${grid(p.bag, G.bagSize(p), 'bag')}</div>
      <div><h3 style="margin:0 0 8px">Kho (${kho.length}/${G.STORAGE_SIZE})</h3>${grid(kho, size, 'storage')}</div></div>`];
  }

  Object.assign(UI._, { panelStorage });
  Object.assign(UI._.PANELS, { storage: panelStorage });
})();
