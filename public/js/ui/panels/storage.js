'use strict';
/* UI · Bảng kho đồ. Mỗi làng một kho riêng (G.STORAGE_SIZE ô); chỉ thấy và dùng được kho của làng đang đứng. */
(() => {
  const { G, esc, fmt, cellHtml } = UI._;

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
      for (let i = 0; i < size; i++) {
        const e = list[i];
        h += cellHtml(e, e ? `data-act="${where === 'bag' ? 'store' : 'retrieve'}" data-uid="${e.uid}" data-tip="${e.uid}" data-tipwhere="${where}"` : '');
      }
      return h + '</div>';
    };
    const full = kho.length >= G.STORAGE_SIZE;
    const cap = (used, max) => `<div class="st-cap"><span>${used}/${max} ô</span><i style="width:${Math.min(100, used / max * 100)}%"></i></div>`;

    return [title, `<div class="st-wrap">
      <div class="st-head">
        <div class="st-head-ic">📦</div>
        <div class="st-head-txt"><b>Kho của ${esc(villageName)}</b>
          <small>Đồ gửi ở đây chỉ lấy lại được ở đây. Bấm vào vật phẩm để chuyển qua lại giữa túi và kho.</small></div>
      </div>
      ${kho.length > G.STORAGE_SIZE ? '<p class="st-warn">Kho đang vượt giới hạn. Hãy lấy bớt đồ ra để gửi thêm.</p>'
        : full ? '<p class="st-warn">Kho đã đầy.</p>' : ''}
      <div class="st-cols">
        <div class="st-col"><div class="st-col-h">🎒 Túi ${cap(p.bag.length, G.bagSize(p))}</div>${grid(p.bag, G.bagSize(p), 'bag')}</div>
        <div class="st-col"><div class="st-col-h">📦 Kho ${cap(kho.length, G.STORAGE_SIZE)}</div>${grid(kho, size, 'storage')}</div>
      </div>
    </div>`];
  }

  Object.assign(UI._, { panelStorage });
  Object.assign(UI._.PANELS, { storage: panelStorage });
})();
