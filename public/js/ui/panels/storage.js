'use strict';
/* UI · Bảng kho đồ. */
(() => {
  const { G, $, cellHtml } = UI._;

  // ---------- Kho
  function panelStorage() {
    const p = App.player;
    const grid = (list, size, where) => {
      let h = '<div class="grid">';
      for (let i = 0; i < size; i++) { const e = list[i]; h += cellHtml(e, e ? `data-act="${where === 'bag' ? 'store' : 'retrieve'}" data-uid="${e.uid}" data-tip="${e.uid}" data-tipwhere="${where}"` : ''); }
      return h + '</div>';
    };
    return ['Thủ kho Bảo', `<p class="muted">Bấm vào vật phẩm để chuyển qua lại giữa túi và kho.</p><div class="cols">
      <div><h3 style="margin:0 0 8px">Túi (${p.bag.length}/${G.bagSize(p)})</h3>${grid(p.bag, G.bagSize(p), 'bag')}</div>
      <div><h3 style="margin:0 0 8px">Kho (${p.storage.length}/${G.STORAGE_SIZE})</h3>${grid(p.storage, G.STORAGE_SIZE, 'storage')}</div></div>`];
  }

  Object.assign(UI._, { panelStorage });
  Object.assign(UI._.PANELS, { storage: panelStorage });
})();
