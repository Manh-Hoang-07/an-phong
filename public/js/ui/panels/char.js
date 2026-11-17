'use strict';
/* UI · Bảng nhân vật: chỉ số, điểm tiềm năng, hình thái, nội tại cốt truyện. Cấu hình âm thanh/đồ họa ở tab Cấu hình. */
(() => {
  const { G, esc, fmt, itemIcon } = UI._;

  // Nhóm chỉ số để đọc nhanh: tấn công / phòng thủ / hỗ trợ
  const STAT_GROUPS = [
    ['Chiến đấu', [['Máu', 'maxHp', '❤'], ['Năng lượng', 'maxMp', '💠'], ['Tấn công', 'atk', '⚔'], ['Phòng thủ', 'def', '🛡']]],
    ['Chi tiết', [['Chí mạng', 'crit', '🎯', '%'], ['Sức mạnh kỹ năng', 'skillMul', '✨', 'mul'], ['Tốc độ chạy', 'speed', '👟']]],
  ];

  const POINTS = [
    ['str', 'Sức mạnh', '⚔', '+2 tấn công'],
    ['vit', 'Thể lực', '❤', '+10 máu, +0.8 phòng thủ'],
    ['agi', 'Nhanh nhẹn', '👟', '+0.4% chí mạng, chạy nhanh hơn'],
    ['spi', 'Tinh thần', '💠', '+6 năng lượng, +1.5% sức mạnh kỹ năng'],
  ];

  function statValue(st, key, unit) {
    if (unit === '%') return st[key] + '%';
    if (unit === 'mul') return Math.round(st[key] * 100) + '%';
    return fmt(st[key]);
  }

  function panelChar() {
    const p = App.player, st = App.stats;
    const need = G.expToNext(p.level);
    const expPct = p.level >= G.MAX_LEVEL ? 100 : Math.min(100, p.exp / need * 100);
    const school = p.school ? G.SCHOOLS[p.school] : null;

    // ---------- Thẻ đầu: tên, class, cấp, thanh kinh nghiệm
    const head = `<div class="ch-head">
      <div class="ch-ava">${school ? school.icon : '👤'}</div>
      <div class="ch-id">
        <b>${esc(p.name)}</b>
        <small>${school ? esc(school.name) : 'Chưa thức tỉnh'} · Hạng ${esc(G.playerRank(p))}</small>
        <div class="ch-exp"><i style="width:${expPct}%"></i><span>${p.level >= G.MAX_LEVEL ? 'Cấp tối đa' : `${fmt(p.exp)} / ${fmt(need)}`}</span></div>
      </div>
      <div class="ch-lv"><small>Cấp</small><b>${p.level}</b></div>
    </div>`;

    // ---------- Chỉ số
    const stats = STAT_GROUPS.map(([title, list]) => `<div class="ch-group">
      <div class="ch-group-h">${title}</div>
      <div class="ch-stats">${list.map(([label, key, icon, unit]) =>
        `<div class="ch-stat"><span>${icon}</span><small>${label}</small><b>${statValue(st, key, unit)}</b></div>`).join('')}</div>
    </div>`).join('');

    // ---------- Thông tin khác
    const misc = [
      ['Giảm giá cửa hàng', Math.round((p.shopDiscount || 0) * 100) + '%'],
      ...((p.titles || []).length ? [['Danh hiệu', p.titles.join(', ')]] : []),
    ];
    const info = `<div class="ch-group"><div class="ch-group-h">Thông tin</div>
      <table class="stat-table">${misc.map(([a, b]) => `<tr><td class="muted">${a}</td><td>${esc(b)}</td></tr>`).join('')}</table></div>`;

    // ---------- Bộ trang bị đang mặc
    // Hiện số món / ngưỡng để người chơi biết còn thiếu bao nhiêu mới được thưởng.
    // Ngưỡng 6 = cộng chỉ số, ngưỡng 10 = hiệu ứng đổi lối chơi (xem SET_BONUS).
    const counts = G.setCounts(p);
    const setRows = Object.keys(counts).map(id => {
      const n = counts[id], def = G.SETS.find(s => s.id === Number(id));
      if (!def) return '';
      const tier = n >= G.SET_TIER_HIGH ? 2 : n >= G.SET_TIER_LOW ? 1 : 0;
      const cls = tier === 2 ? 'q4' : tier === 1 ? 'okc' : 'muted';
      const note = tier === 2 ? 'đủ bộ — hiệu ứng đang chạy' : tier === 1 ? `còn ${G.SET_TIER_HIGH - n} món để đủ bộ` : `cần ${G.SET_TIER_LOW} món mới có thưởng`;
      return `<tr><td>${esc(def.name)}</td><td class="${cls}"><b>${n}/${G.SET_TIER_HIGH}</b> <small>${note}</small></td></tr>`;
    }).join('');
    const setBox = setRows ? `<div class="ch-group"><div class="ch-group-h">Bộ trang bị</div>
      <table class="stat-table">${setRows}</table></div>` : '';

    // ---------- Kỳ Nguyên: 5 phúc duyên, mua ở Lầu Trân Bảo, bật/tắt tại đây.
    // Hiện cả 5 để người chơi thấy mốc cấp còn thiếu; cái đã mở thì có nút Tháo / Bật.
    const knState = p.kyNguyen || { owned: [], active: [] };
    const knOwned = knState.owned || [], knActive = knState.active || [];
    const knRows = (G.KY_NGUYEN || []).map(id => {
      const d = G.ITEMS[id];
      if (!d) return '';
      const owned = knOwned.includes(id), on = knActive.includes(id);
      const locked = (d.level || 1) > p.level;
      const st = d.stats || {};
      const statTxt = Object.keys(st).map(k => `${G.statLabel(k)} +${st[k]}${G.statUnit(k)}`).join(' · ');
      const state = !owned
        ? `<span class="${locked ? 'muted' : 'okc'}">${locked ? `cần cấp ${d.level}` : 'mua được ở Lầu Trân Bảo'}</span>`
        : on ? '<span class="okc">● đang bật</span>' : '<span class="muted">○ đang tháo</span>';
      const btn = owned
        ? `<button class="btn small${on ? '' : ' primary'}" data-act="toggle_ky_nguyen" data-id="${id}">${on ? 'Tháo' : 'Bật'}</button>`
        : '';
      return `<div class="kn-row${owned ? (on ? ' on' : '') : ' locked'}">
        <span class="kn-ic">${itemIcon(id)}</span>
        <div class="kn-main"><b>${esc(d.name)}</b><small>${esc(statTxt)}</small></div>
        <div class="kn-side">${state}${btn}</div></div>`;
    }).join('');
    const knBox = `<div class="ch-group"><div class="ch-group-h">Kỳ Nguyên <small>${knOwned.length}/${(G.KY_NGUYEN || []).length} đã mở</small></div>
      <div class="kn-list">${knRows}</div></div>`;

    // ---------- Điểm tiềm năng
    const pts = `<div class="ch-group">
      <div class="ch-group-h">Điểm tiềm năng <b class="gold">${p.freePoints}</b></div>
      <div class="ch-points">${POINTS.map(([k, name, icon, desc]) => `<div class="ch-point">
        <span class="ch-point-ic">${icon}</span>
        <div class="ch-point-main"><b>${name} <em>${p.points[k]}</em></b><small>${desc}</small></div>
        <div class="ch-point-btns">
          <button class="btn small" data-act="add_stat" data-stat="${k}" data-n="1" ${p.freePoints ? '' : 'disabled'}>+1</button>
          <button class="btn small" data-act="add_stat" data-stat="${k}" data-n="5" ${p.freePoints >= 5 ? '' : 'disabled'}>+5</button>
        </div></div>`).join('')}</div>
    </div>`;

    // ---------- Hình thái thức tỉnh
    const forms = G.AWAKENS.map(a => ['awaken' + a.tier, 'Biến Hình ' + ['I', 'II', 'III', 'IV', 'V'][a.tier - 1], (p.awakenTier || 0) >= a.tier]).filter(x => x[2]);
    const formHtml = forms.length ? `<div class="ch-group"><div class="ch-group-h">Hình thái</div>
      <div class="ch-forms">
        <div class="ch-form-state"><b>${esc(forms.find(x => x[0] === p.formChoice)?.[1] || forms[0][1])}</b>
          <small>${p.formActive ? '⚡ Đang biến hình' : 'Dạng thường'}</small></div>
        <div class="row">${forms.map(([key, label]) =>
          `<button class="btn small${p.formChoice === key ? ' primary' : ''}" data-act="form_select" data-choice="${key}">${esc(label)}</button>`).join('')}</div>
      </div></div>` : '';

    // ---------- Nội tại cốt truyện
    const perks = G.perksOf(p);
    const perkHtml = perks.length ? `<div class="ch-group"><div class="ch-group-h">Nội tại cốt truyện</div>
      <div class="list">${perks.map(id => { const pk = G.PERKS[id]; return `<div class="li"><div class="ic">${pk.icon}</div>
        <div class="main"><b>${esc(pk.name)}</b><small>${esc(pk.desc)}</small></div></div>`; }).join('')}</div></div>` : '';

    const desc = school ? `<p class="ch-desc muted">${esc(school.desc)}</p>` : '';

    return ['Nhân vật', `<div class="ch-wrap">
      <div class="ch-col">${head}${stats}${setBox}${knBox}${info}${desc}</div>
      <div class="ch-col">${pts}${formHtml}${perkHtml}</div>
    </div>`];
  }

  Object.assign(UI._, { panelChar });
  Object.assign(UI._.PANELS, { char: panelChar });
})();
