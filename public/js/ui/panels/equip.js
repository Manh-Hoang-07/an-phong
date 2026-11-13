'use strict';
/* UI · Bảng trang bị lên người: hình nhân vật ở giữa, 10 ô trang bị chia hai bên, hàng dưới là ô trống chờ bổ sung. */
(() => {
  const { G, esc, fmt, qOf, itemIcon, itemInfo, selectedEntry, S, renderPanel } = UI._;

  // Ô trang bị hai bên nhân vật (trái 5 ô, phải 5 ô)
  const LEFT_SLOTS = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung'];
  const RIGHT_SLOTS = ['quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi'];
  // Hàng dưới: chỗ dành cho trang bị bổ sung sau này. Thêm một dòng vào đây là có thêm ô.
  const FUTURE_SLOTS = [
    ['linh_vat', 'Linh vật', '🪬'],
    ['bua', 'Bùa', '🧿'],
    ['an', 'Ấn', '🔱'],
    ['canh', 'Cánh', '🪽'],
    ['ho_menh', 'Hộ mệnh', '🛡'],
  ];

  // ------------------------------------------------------------ Hình nhân vật
  // Cắt khung idle đầu tiên của bộ hình rồi phóng to thành ảnh chân dung (data URL, lưu lại dùng tiếp).
  const portraits = new Map();
  const loading = new Set(), failed = new Set();

  // Bộ hình + màu phủ của nhân vật ĐANG ĐĂNG NHẬP, giống hệt cách cảnh game chọn hình (refreshPlayerLook):
  //  • chưa chọn class → bộ hình 'none' (thợ săn tập sự), không phải ô trống
  //  • Toàn Năng cầm vũ khí của class khác → hóa thân thành class đó
  //  • nhánh tiến hóa mượn hình class gốc → phủ màu nhận diện
  function lookFor(p) {
    let id = p.school || 'none';
    if (id === 'toan_nang' && typeof Sprites !== 'undefined' && Sprites.weaponClass) {
      const byWeapon = Sprites.weaponClass(App.stats && App.stats.wtype);
      if (byWeapon) id = byWeapon;
    }
    if (typeof Sprites === 'undefined' || !Sprites.lookOf) return { sheet: 'kiem_si', tint: null };
    return Sprites.lookOf(id);
  }

  function cutPortrait(img, def, tint, px) {
    const s = def.s || 0.45;
    // Vùng cắt quanh thân nhân vật (đơn vị điểm ảnh của sheet): rộng 58/s, cao 66/s, chân chạm đáy vùng cắt
    const w = Math.min(def.fw, 58 / s), h = Math.min(def.fh, 66 / s);
    const x = Math.max(0, Math.min(def.fw - w, def.cx - w / 2));
    const y = Math.max(0, Math.min(def.fh - h, def.fy - h));
    const scale = Math.max(1, Math.ceil(px / Math.max(w, h)));
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = !!def.hd;
    g.drawImage(img, x, y, w, h, 0, 0, cv.width, cv.height);
    // Nhánh mượn hình class khác: phủ màu nhận diện giống tint trong game
    if (tint != null) {
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = `rgba(${(tint >> 16) & 255},${(tint >> 8) & 255},${tint & 255},0.3)`;
      g.fillRect(0, 0, cv.width, cv.height);
      g.globalCompositeOperation = 'source-over';
    }
    return cv.toDataURL('image/png');
  }

  // Data URL hình nhân vật. Lần đầu chưa có thì tải ngầm rồi vẽ lại bảng; trả '' trong lúc chờ.
  function portraitOf(p, px = 240) {
    const look = lookFor(p);
    const key = `${look.sheet}:${look.tint}:${px}`;
    if (portraits.has(key)) return portraits.get(key);
    if (failed.has(key) || loading.has(key)) return '';
    const def = (typeof Sprites !== 'undefined' && Sprites.CHARS) ? Sprites.CHARS[look.sheet] : null;
    if (!def) { failed.add(key); return ''; }
    loading.add(key);
    const img = new Image();
    img.onload = () => {
      loading.delete(key);
      try { portraits.set(key, cutPortrait(img, def, look.tint, px)); } catch { failed.add(key); }
      if (UI.isOpen()) renderPanel();
    };
    img.onerror = () => { loading.delete(key); failed.add(key); };
    img.src = `/assets/chars/${look.sheet}/idle.png` + (window.BUILD ? '?v=' + BUILD.assets : '');
    return '';
  }

  // ------------------------------------------------------------ Bảng trang bị
  function panelEquip() {
    const p = App.player, st = App.stats;

    const slotRow = (slot) => {
      const e = p.equip[slot];
      const d = e && G.ITEMS[e.id];
      const q = e ? qOf(e) : 0;
      const sel = S.selected && S.selected.where === 'equip' && S.selected.key === slot;
      const ic = e ? itemIcon(e.id) : (UI._.SLOT_ICONS[slot] || '◇');
      const name = e ? `${esc(d.name)}${e.plus ? ' +' + e.plus : ''}` : esc(G.SLOT_NAMES[slot]);
      const sub = e ? `${G.QUALITY_NAMES[q]} · ${G.perfection(e)}%` : 'Trống';
      return `<div class="eq-slot${e ? ' filled' : ' empty'}${sel ? ' sel' : ''}" data-sel="equip:${slot}" title="${esc(G.SLOT_NAMES[slot])}">
        <span class="eq-slot-ic">${ic}</span>
        <span class="eq-slot-txt"><b class="${e ? 'q' + q : 'muted'}">${name}</b><small>${sub}</small></span></div>`;
    };

    const img = portraitOf(p);
    const school = p.school ? G.SCHOOLS[p.school] : null;
    const center = `<div class="eq-center">
      <div class="eq-portrait">${img
        ? `<img src="${img}" alt="">`
        : `<span class="eq-portrait-ph">${school ? school.icon : '👤'}</span>`}</div>
      <div class="eq-id"><b>${esc(p.name)}</b><small>${school ? esc(school.name) : 'Chưa thức tỉnh'} · Cấp ${p.level}</small></div>
      <div class="eq-stats">
        <div><span>❤</span><b>${fmt(st.maxHp)}</b><small>Máu</small></div>
        <div><span>⚔</span><b>${fmt(st.atk)}</b><small>Tấn công</small></div>
        <div><span>🛡</span><b>${fmt(st.def)}</b><small>Phòng thủ</small></div>
        <div><span>💠</span><b>${fmt(st.maxMp)}</b><small>Năng lượng</small></div>
      </div>
    </div>`;

    const future = `<div class="eq-future">
      <div class="eq-future-h">Ô trang bị bổ sung <small>sẽ mở ở bản cập nhật sau</small></div>
      <div class="eq-future-row">${FUTURE_SLOTS.map(([, name, icon]) =>
        `<div class="eq-future-cell"><span>${icon}</span><small>${esc(name)}</small></div>`).join('')}</div>
    </div>`;

    const sel = selectedEntry();
    let detail = '<div class="eq-detail muted">Chọn một ô trang bị để xem chi tiết hoặc tháo ra.</div>';
    if (sel) {
      detail = `<div class="eq-detail">${itemInfo(sel.entry)}
        <div class="row" style="margin-top:10px">
          <button class="btn small" data-act="open_detail">🔍 Xem chi tiết</button>
          <button class="btn small" data-act="unequip" data-slot="${sel.key}">⤓ Tháo ra</button>
        </div></div>`;
    }
    // Khung chi tiết: bảng này cũng phải vẽ ra, nếu không thì nút "Xem chi tiết" bấm vào không có gì xảy ra
    const modal = sel && S.detailOpen === `equip:${sel.key}` ? UI._.detailModal(sel.entry, 'equip') : '';

    return ['Trang bị', `<div class="eq-wrap">
      <div class="eq-col">${LEFT_SLOTS.map(slotRow).join('')}</div>
      ${center}
      <div class="eq-col">${RIGHT_SLOTS.map(slotRow).join('')}</div>
    </div>${future}${detail}${modal}`];
  }

  Object.assign(UI._, { panelEquip, portraitOf });
  Object.assign(UI._.PANELS, { equip: panelEquip });
})();
