'use strict';
/* UI · Bảng nhập mật mã (Lữ khách bí ẩn). */
(() => {
  const { G, $, esc, S } = UI._;

  // ---------- Nhập mật mã (Lữ khách bí ẩn)
  function panelCode({ confirm }) {
    if (confirm) {
      const sc = G.SCHOOLS[confirm], p = App.player;
      return ['Lữ khách bí ẩn', `<div class="dialog"><div class="face">🧙</div><div class="text" style="flex:1">
        <p>Con đường của <b>${sc.icon} ${esc(sc.name)}</b>: ${esc(sc.desc)}</p>
        ${p.school ? `<p class="bad">Bạn sẽ rời class ${esc(G.SCHOOLS[p.school].name)}. Điểm kỹ năng đã cộng được trả lại toàn bộ.</p>` : ''}
        <div class="opts"><button class="btn primary" data-act="awaken_special" data-school="${confirm}">Thức tỉnh</button>
        <button class="btn" data-act="open" data-panel="npc_lu">Để sau</button></div></div></div>`];
    }
    return ['Lữ khách bí ẩn', `<div class="dialog"><div class="face">🧙</div><div class="text" style="flex:1">
      <p>Nói cho ta nghe mật mã của cậu.</p>
      <div class="row"><input id="code-input" class="code-input" value="${esc(S.codeDraft)}" placeholder="Mật mã" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <button class="btn primary" data-act="redeem">Xác nhận</button></div>
      <p id="code-msg" class="${S.codeMsg ? 'bad' : 'muted'}" style="font-size:12px;margin-top:8px">${esc(S.codeMsg || 'Mật mã có thể mở class đặc biệt hoặc tặng quà.')}</p>
      <div class="opts"><button class="btn" data-act="open" data-panel="npc_lu">Quay lại</button></div></div></div>`];
  }

  Object.assign(UI._, { panelCode });
  Object.assign(UI._.PANELS, { code: panelCode });
})();
