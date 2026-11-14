'use strict';
/* UI · Bảng nhân vật: chỉ số, điểm tiềm năng, hình thái, nội tại cốt truyện. Cấu hình âm thanh/đồ họa ở tab Cấu hình. */
(() => {
  const { G, esc, fmt } = UI._;

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
      ['Túi đồ', G.bagSize(p) + ' ô' + (p.bagPlus ? ` (+${p.bagPlus * 10})` : '')],
      ['Điểm kỹ năng', p.skillPoints || 0],
      ['Giảm giá cửa hàng', Math.round((p.shopDiscount || 0) * 100) + '%'],
      ['Đã hạ quái', fmt(Object.values(p.kills || {}).reduce((a, b) => a + b, 0))],
      ...((p.titles || []).length ? [['Danh hiệu', p.titles.join(', ')]] : []),
    ];
    const info = `<div class="ch-group"><div class="ch-group-h">Thông tin</div>
      <table class="stat-table">${misc.map(([a, b]) => `<tr><td class="muted">${a}</td><td>${esc(b)}</td></tr>`).join('')}</table></div>`;

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
      <div class="ch-col">${head}${stats}${info}${desc}</div>
      <div class="ch-col">${pts}${formHtml}${perkHtml}</div>
    </div>`];
  }

  Object.assign(UI._, { panelChar });
  Object.assign(UI._.PANELS, { char: panelChar });
})();
