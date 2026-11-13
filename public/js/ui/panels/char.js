'use strict';
/* UI · Bảng nhân vật. */
(() => {
  const { G, $, esc, fmt, isTouch } = UI._;

  // ---------- Nhân vật
  function panelChar() {
    const p = App.player, st = App.stats;
    const need = G.expToNext(p.level);
    const rows = [
      ['Cấp', p.level], ['Kinh nghiệm', p.level >= G.MAX_LEVEL ? 'Tối đa' : `${fmt(p.exp)} / ${fmt(need)}`],
      ['Class', p.school ? G.SCHOOLS[p.school].name : '—'],
      ['Máu', fmt(st.maxHp)], ['Năng lượng', fmt(st.maxMp)], ['Tấn công', fmt(st.atk)], ['Phòng thủ', fmt(st.def)],
      ['Chí mạng', st.crit + '%'], ['Sức mạnh kỹ năng', Math.round(st.skillMul * 100) + '%'], ['Tốc độ chạy', Math.round(st.speed)],
      ['Điểm kỹ năng', p.skillPoints || 0],
      ['Túi đồ', G.bagSize(p) + ' ô' + (p.bagPlus ? ` (+${p.bagPlus * 10})` : '')],
      ['Giảm giá cửa hàng', Math.round((p.shopDiscount || 0) * 100) + '%'],
      ...((p.titles || []).length ? [['Danh hiệu', p.titles.join(', ')]] : []),
      ['Đã hạ quái', fmt(Object.values(p.kills).reduce((a, b) => a + b, 0))],
    ];
    const pts = [
      ['str', 'Sức mạnh', '+2 tấn công'], ['vit', 'Thể lực', '+10 máu, +0.8 phòng thủ'],
      ['agi', 'Nhanh nhẹn', '+0.4% chí mạng, chạy nhanh hơn'], ['spi', 'Tinh thần', '+6 năng lượng, +1.5% sức mạnh kỹ năng'],
    ];
    const perks = G.perksOf(p);
    const perkHtml = perks.length ? '<div class="muted" style="margin:10px 0 4px;font-size:12px">NỘI TẠI CỐT TRUYỆN</div><div class="list">' +
      perks.map(id => { const pk = G.PERKS[id]; return `<div class="li"><div class="ic">${pk.icon}</div><div class="main"><b>${esc(pk.name)}</b><small>${esc(pk.desc)}</small></div></div>`; }).join('') + '</div>' : '';
    const left = '<table class="stat-table">' + rows.map(([a, b]) => `<tr><td class="muted">${a}</td><td>${esc(b)}</td></tr>`).join('') + '</table>' + perkHtml;
    // Chỉ còn Ấn thức tỉnh là hình thái bật/tắt. Chức nghiệp 2 là class thật: đổi bằng Sách Tiến Hóa ở NPC ẩn.
    const unlockedForms = [['awaken1', 'Biến Hình I', p.awakenTier >= 1], ['awaken2', 'Biến Hình II', p.awakenTier >= 2]].filter(x => x[2]);
    const formHtml = unlockedForms.length ? `<div class="li"><div class="main"><b>Hình thái: ${esc(unlockedForms.find(x => x[0] === p.formChoice)?.[1] || unlockedForms[0][1])}</b><small>${p.formActive ? 'Đang biến hình' : 'Dạng thường'}</small></div>${unlockedForms.map(([key, label]) => `<button class="btn small" data-act="form_select" data-choice="${key}">${esc(label)}</button>`).join('')}</div>` : '';
    const right = `<p>Điểm tiềm năng còn lại: <b class="gold">${p.freePoints}</b></p>${formHtml}<div class="list">` +
      pts.map(([k, n, d]) => `<div class="li"><div class="main"><b>${n}: ${p.points[k]}</b><small>${d}</small></div>
        <button class="btn small" data-act="add_stat" data-stat="${k}" data-n="1" ${p.freePoints ? '' : 'disabled'}>+1</button>
        <button class="btn small" data-act="add_stat" data-stat="${k}" data-n="5" ${p.freePoints >= 5 ? '' : 'disabled'}>+5</button></div>`).join('') +
      '</div>' + (p.school ? `<p class="muted" style="font-size:12px">${esc(G.SCHOOLS[p.school].desc)}</p>` : '');
    const snd = `<div class="row" style="margin-top:12px"><button class="btn" data-act="toggle_sfx">${Sound.settings.sfx ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt'}</button><button class="btn" data-act="toggle_music">${Sound.settings.music ? '🎵 Nhạc nền: Bật' : '🎵 Nhạc nền: Tắt'}</button></div>`;
    const qName = { auto: '⚙️ Đồ họa: Tự động', high: '✨ Đồ họa: Cao', low: '🔋 Đồ họa: Thấp (mượt nhất)' }[Quality.mode];
    const gfx = `<div class="row" style="margin-top:8px"><button class="btn" data-act="toggle_quality">${qName}</button></div>`;
    const sys = snd + gfx + `<div class="row" style="margin-top:8px">${isTouch() ? '<button class="btn" data-act="fullscreen">⛶ Toàn màn hình</button>' : ''}<button class="btn" data-act="logout">⏻ Đăng xuất</button></div>`;
    return ['Nhân vật: ' + p.name, `<div class="cols"><div>${left}${sys}</div><div>${right}</div></div>`];
  }

  Object.assign(UI._, { panelChar });
  Object.assign(UI._.PANELS, { char: panelChar });
})();
