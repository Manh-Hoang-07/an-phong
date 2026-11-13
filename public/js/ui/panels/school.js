'use strict';
/* UI · Bảng chọn class. */
(() => {
  const { G, $, esc, skIcon } = UI._;

  // ---------- Chọn class
  // Bảng chọn CHỈ có class nền. Chức nghiệp 2 (evolved) mở bằng Sách Tiến Hóa Chức Nghiệp ở NPC ẩn;
  // Toàn Năng (special) mở bằng mật mã. Mở thẳng panel bằng tham số thì quay về danh sách.
  function panelSchool({ confirm }) {
    if (confirm) {
      const s = G.SCHOOLS[confirm];
      if (!s || s.special || s.evolved) confirm = null;
    }
    if (confirm) {
      const s = G.SCHOOLS[confirm];
      return ['Chọn class', `<h3 style="margin:0 0 6px">${esc(s.name)}</h3><p>${esc(s.desc)}</p>
        <p class="bad">Đã chọn thì không đổi lại được. Bạn chắc chứ?</p>
        <div class="row"><button class="btn primary" data-act="choose_school" data-school="${confirm}">Gia nhập ${esc(s.name)}</button>
        <button class="btn" data-act="open" data-panel="school">Xem lại</button></div>`];
    }
    const skillsOf = (id) => Object.entries(G.SKILLS).filter(([, s]) => s.school === id && !s.ult && !s.evolutionKey).map(([k]) => skIcon(k)).join(' ');
    return ['Chọn class', '<p>Mỗi class có vũ khí và kỹ năng riêng. Chọn hướng thức tỉnh của bạn:</p><div class="schools">' +
      Object.entries(G.SCHOOLS).filter(([, s]) => !s.special && !s.evolved).map(([id, s]) => `<div class="school-card" data-act="school_pick" data-school="${id}"><h3 style="color:#${s.color.toString(16).padStart(6, '0')}">${s.icon} ${esc(s.name)}</h3><p>${esc(s.desc)}</p><p style="margin-top:6px">${skillsOf(id)}</p></div>`).join('') + '</div>'];
  }

  Object.assign(UI._, { panelSchool });
  Object.assign(UI._.PANELS, { school: panelSchool });
})();
