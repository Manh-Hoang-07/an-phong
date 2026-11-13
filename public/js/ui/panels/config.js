'use strict';
/* UI · Bảng cấu hình: âm thanh, nhạc nền, đồ họa và các tùy chọn hiển thị. Tách khỏi tab Nhân vật. */
(() => {
  const { G, esc, isTouch } = UI._;

  const QUALITY_MODES = [
    ['auto', '⚙️ Tự động', 'Máy chạy chậm thì tự giảm hiệu ứng.'],
    ['high', '✨ Cao', 'Đủ hiệu ứng: tia lửa, bụi, phóng nhẹ khi chí mạng.'],
    ['low', '🔋 Thấp', 'Ít hiệu ứng nhất, mượt trên máy yếu.'],
  ];

  function pct(v) { return Math.round(Math.min(1, Math.max(0, v)) * 100); }

  // Một hàng cấu hình: nhãn + mô tả bên trái, điều khiển bên phải
  const row = (label, desc, control) =>
    `<div class="cfg-row"><div class="cfg-lbl"><b>${label}</b><small>${desc}</small></div><div class="cfg-ctl">${control}</div></div>`;

  // Công tắc bật/tắt
  const toggle = (act, on, onText = 'Bật', offText = 'Tắt') =>
    `<button class="cfg-switch${on ? ' on' : ''}" data-act="${act}" role="switch" aria-checked="${on}">
      <i></i><span>${on ? onText : offText}</span></button>`;

  // Thanh kéo âm lượng: kéo xong mới gửi (input gửi liên tục để nghe thử ngay)
  const slider = (act, value, disabled) =>
    `<div class="cfg-slider${disabled ? ' off' : ''}">
      <input type="range" min="0" max="100" step="5" value="${pct(value)}" data-vol="${act}" ${disabled ? 'disabled' : ''}>
      <b>${pct(value)}%</b></div>`;

  function panelConfig() {
    const s = Sound.settings;
    const q = Quality.mode;

    const sound = row('Hiệu ứng âm thanh', 'Tiếng đánh, nhặt đồ, mở bảng…', toggle('toggle_sfx', s.sfx))
      + row('Âm lượng hiệu ứng', 'Kéo để chỉnh to nhỏ', slider('sfx_vol', s.sfxVol, !s.sfx))
      + row('Nhạc nền', 'Nhạc riêng cho từng vùng', toggle('toggle_music', s.music))
      + row('Âm lượng nhạc', 'Kéo để chỉnh to nhỏ', slider('music_vol', s.musicVol, !s.music));

    const gfx = row('Chất lượng đồ họa', 'Ảnh hưởng độ mượt khi đánh đông quái',
      `<div class="cfg-seg">${QUALITY_MODES.map(([k, name, desc]) =>
        `<button class="cfg-seg-btn${q === k ? ' on' : ''}" data-act="set_quality" data-mode="${k}" title="${esc(desc)}">${name}</button>`).join('')}</div>`)
      + row('Chế độ điều khiển', 'Tự nhận theo thiết bị',
        `<span class="cfg-val">${isTouch() ? '📱 Cảm ứng' : '⌨️ Bàn phím'}</span>`);

    const other = row('Toàn màn hình', 'Chơi không thanh địa chỉ (điện thoại)',
      isTouch() ? '<button class="btn small" data-act="fullscreen">⛶ Bật</button>' : '<span class="cfg-val muted">Chỉ trên điện thoại</span>')
      + row('Đăng xuất', 'Thoát về màn hình đăng nhập', '<button class="btn small danger" data-act="logout">⏻ Đăng xuất</button>');

    const html = `<div class="cfg-wrap">
      <div class="cfg-card">
        <div class="cfg-card-h"><span>🔊</span><b>Âm thanh</b></div>
        ${sound}
      </div>
      <div class="cfg-card">
        <div class="cfg-card-h"><span>🖼️</span><b>Đồ họa và hiển thị</b></div>
        ${gfx}
      </div>
      <div class="cfg-card">
        <div class="cfg-card-h"><span>⚙️</span><b>Khác</b></div>
        ${other}
      </div>
    </div>`;
    return ['Cấu hình', html];
  }

  Object.assign(UI._, { panelConfig });
  Object.assign(UI._.PANELS, { config: panelConfig });
})();
