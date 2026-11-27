'use strict';
/* UI · Bảng thợ rèn: nâng cấp, tẩy luyện, phân rã. */
(() => {
  const { G, $, esc, fmt, qOf, itemIcon, itemInfo, selectedEntry, S } = UI._;

  // ---------- Thợ rèn: nâng cấp, tẩy luyện, phân rã
  function panelSmith() {
    const p = App.player;
    const stones = p.bag.filter(e => e.id === 'da_cuong_hoa').reduce((s, e) => s + e.qty, 0);
    const items = [];
    if (S.smithTab !== 'salvage') for (const s of G.SLOTS) if (p.equip[s]) items.push({ where: 'equip', key: s, entry: p.equip[s], tag: 'Đang mặc' });
    for (const e of p.bag) if (G.ITEMS[e.id].slot) items.push({ where: 'bag', key: e.uid, entry: e, tag: 'Trong túi' });
    const tabs = [['upgrade', '⚒️ Nâng cấp'], ['reforge', '🔮 Tẩy luyện'], ['seal', '🔏 Khắc ấn'], ['repair', '🔧 Sửa chữa'], ['salvage', '♻️ Phân rã']]
      .map(([k, n]) => `<button class="btn small ${S.smithTab === k ? 'primary' : ''}" data-act="smith_tab" data-tab="${k}">${n}</button>`).join(' ');
    let html = `<div class="row" style="margin-bottom:8px">${tabs}<span style="margin-left:auto">🪙 <b class="gold">${fmt(p.gold)}</b> · 💎 <b>${stones}</b></span></div><div class="cols"><div class="list">`;
    if (!items.length) html += '<p class="muted">Không có trang bị nào.</p>';
    for (const it of items) {
      const d = G.ITEMS[it.entry.id];
      const sel = S.selected && S.selected.where === it.where && String(S.selected.key) === String(it.key);
      const q = qOf(it.entry);
      html += `<div class="li ${sel ? 'sel' : ''}" data-sel="${it.where}:${it.key}" style="cursor:pointer"><div class="ic">${itemIcon(it.entry.id)}</div>
        <div class="main"><b class="q${q}">${esc(d.name)} ${it.entry.plus ? '+' + it.entry.plus : ''}</b><small>${it.tag} · ${G.QUALITY_NAMES[q]} · ${G.perfection(it.entry)}% ${UI._.durTag(it.entry)}</small></div></div>`;
    }
    if (S.smithTab === 'repair') {
      const need = G.SLOTS.filter(s => p.equip[s] && G.repairCost(p.equip[s])).length;
      html = html.replace('</div><div class="cols">', `</div><div class="row" style="margin-bottom:8px"><button class="btn small" data-act="repair_all" ${need ? '' : 'disabled'}>🔧 Sửa tất cả đang mặc (${need})</button></div><div class="cols">`);
    }
    html += '</div><div>';
    const sel = selectedEntry();
    if (!sel || !G.ITEMS[sel.entry.id].slot || (S.smithTab === 'salvage' && sel.where !== 'bag')) {
      const tip = {
        upgrade: 'Chọn trang bị bên trái để nâng cấp. Mỗi cấp +8% chỉ số chính.',
        reforge: 'Tẩy luyện gieo lại toàn bộ dòng phụ của đồ Tốt, Hiếm, Huyền thoại (giữ nguyên số dòng). Có thể ra tốt hơn hoặc tệ hơn.',
        seal: `Khắc ấn: đồ đạt độ hoàn hảo ${G.PERFECT_MIN}% trở lên được thêm 1 dòng phụ thứ tư, vĩnh viễn. Mỗi món chỉ khắc ấn một lần.`,
        repair: 'Sửa chữa đưa độ bền về 100%. Tốn xu + Đá cường hóa theo phần độ bền còn thiếu. Món đã hỏng (0%) vẫn sửa được, chỉ tốn nhất.',
        salvage: 'Phân rã đồ trong túi để lấy Đá cường hóa: Thường 0–1, Tốt 1, Hiếm 3, Huyền thoại 6 viên, cộng thêm theo cấp nâng.',
      }[S.smithTab];
      html += `<div class="detail muted">${tip}</div></div></div>`;
      return ['Thợ rèn Thiết', html];
    }
    const e = sel.entry;
    const q = qOf(e);
    html += `<div class="detail">${itemInfo(e)}</div>`;
    if (S.smithTab === 'upgrade') {
      const plus = e.plus || 0;
      if (plus >= G.UPGRADE_MAX) html += `<p class="gold">Đã đạt tối đa +${G.UPGRADE_MAX}.</p>`;
      else {
        const c = G.upgradeCost(plus);
        const rate = Math.round(G.UPGRADE_RATES[plus] * 100);
        const next = G.instStats({ ...e, plus: plus + 1 }).main;
        html += `<div class="detail"><div>Nâng lên <b class="gold">+${plus + 1}</b>: ${Object.keys(next).map(k => `${G.statLabel(k)} ${next[k]}`).join(', ')}</div>
          <div class="rate ${rate >= 70 ? 'okc' : rate >= 40 ? 'gold' : 'bad'}">Tỉ lệ ${rate}%</div>
          <div>Chi phí: <span class="${p.gold >= c.gold ? '' : 'bad'}">${fmt(c.gold)} xu</span>, <span class="${stones >= c.stones ? '' : 'bad'}">${c.stones} đá cường hóa</span></div>
          ${G.upgradeFailDrops(plus) ? '<div class="bad">Thất bại sẽ bị giảm 1 cấp!</div>' : rate < 100 ? '<div class="muted">Thất bại vẫn giữ nguyên cấp.</div>' : ''}
          <div class="row" style="margin-top:10px"><button class="btn primary" data-act="upgrade" ${p.gold >= c.gold && stones >= c.stones ? '' : 'disabled'}>⚒️ Nâng cấp</button></div>
          ${S.lastUpgrade ? `<div class="rate upgrade-fx ${S.lastUpgrade.ok ? 'okc' : 'bad'}" style="margin-top:8px">${S.lastUpgrade.ok ? 'Thành công! +' + S.lastUpgrade.plus : 'Thất bại... +' + S.lastUpgrade.plus}</div>` : ''}
        </div>`;
      }
    } else if (S.smithTab === 'reforge') {
      if (q < 2) html += '<div class="detail muted">Đồ Thường không có dòng phụ. Chỉ đồ Tốt trở lên mới tẩy luyện được.</div>';
      else {
        const lv = G.ITEMS[e.id].level || 1;
        const c = { gold: 60 * q * Math.max(2, lv), stones: q };
        html += `<div class="detail"><div>Gieo lại ${e.aff.length || G.QUALITY_AFFIX[q]} dòng phụ ngẫu nhiên.</div>
          <div>Chi phí: <span class="${p.gold >= c.gold ? '' : 'bad'}">${fmt(c.gold)} xu</span>, <span class="${stones >= c.stones ? '' : 'bad'}">${c.stones} đá cường hóa</span></div>
          <div class="row" style="margin-top:10px"><button class="btn primary" data-act="reforge" ${p.gold >= c.gold && stones >= c.stones ? '' : 'disabled'}>🔮 Tẩy luyện</button></div></div>`;
      }
    } else if (S.smithTab === 'repair') {
      const c = G.repairCost(e);
      if (G.durInfinite(G.ITEMS[e.id])) html += '<div class="detail muted">Món này có độ bền vô hạn, không bao giờ hao mòn.</div>';
      else if (!c) html += '<div class="detail muted">Món này còn nguyên độ bền, không cần sửa.</div>';
      else html += `<div class="detail"><div>Sửa từ <b>${G.durPct(e)}%</b> lên <b class="gold">100%</b>${G.isBroken(e) ? ' <span class="bad">(đang hỏng)</span>' : ''}.</div>
          <div>Chi phí: <span class="${p.gold >= c.gold ? '' : 'bad'}">${fmt(c.gold)} xu</span>, <span class="${stones >= c.stones ? '' : 'bad'}">${c.stones} đá cường hóa</span></div>
          <div class="row" style="margin-top:10px"><button class="btn primary" data-act="repair" ${p.gold >= c.gold && stones >= c.stones ? '' : 'disabled'}>🔧 Sửa chữa</button></div></div>`;
    } else if (S.smithTab === 'seal') {
      // Khắc ấn: chỉ đồ đạt độ hoàn hảo 95%+ và chưa khắc ấn
      const pf = G.perfection(e);
      if (e.seal) html += '<div class="detail muted">Món này đã được khắc ấn rồi (dòng phụ thứ tư là vĩnh viễn).</div>';
      else if (q < 2) html += '<div class="detail muted">Đồ Thường không có dòng phụ. Chỉ đồ Tốt trở lên mới khắc ấn được.</div>';
      else if (pf < G.PERFECT_MIN) html += `<div class="detail muted">Cần độ hoàn hảo <b>${G.PERFECT_MIN}%</b> trở lên. Món này đang <b class="bad">${pf}%</b> — còn thiếu ${G.PERFECT_MIN - pf}%.</div>`;
      else {
        const c = G.sealCost(e);
        html += `<div class="detail"><div>Thêm <b>1 dòng phụ thứ tư</b> ngẫu nhiên, giữ nguyên ${e.aff.length} dòng hiện có. Vĩnh viễn, không tẩy lại được.</div>
          <div>Chi phí: <span class="${p.gold >= c.gold ? '' : 'bad'}">${fmt(c.gold)} xu</span>, <span class="${stones >= c.stones ? '' : 'bad'}">${c.stones} đá cường hóa</span></div>
          <div class="row" style="margin-top:10px"><button class="btn primary" data-act="seal" ${p.gold >= c.gold && stones >= c.stones ? '' : 'disabled'}>🔏 Khắc ấn</button></div></div>`;
      }
    } else {
      const base = { 1: '0–1', 2: 1, 3: 3, 4: 6 }[q];
      const bonus = Math.floor((e.plus || 0) / 2);
      const confirming = S.confirmSalvage === e.uid;
      html += `<div class="detail"><div>Nhận về: <b>${base}${bonus ? ' + ' + bonus : ''}</b> Đá cường hóa. Món đồ sẽ mất vĩnh viễn.</div>
        <div class="row" style="margin-top:10px"><button class="btn ${confirming ? 'primary' : ''}" data-act="salvage" data-uid="${e.uid}">
        ${confirming ? '⚠️ Bấm lần nữa để phân rã' : '♻️ Phân rã'}</button></div></div>`;
    }
    html += '</div></div>';
    return ['Thợ rèn Thiết', html];
  }
  function upgradeResult(ev) { S.lastUpgrade = ev; setTimeout(() => { S.lastUpgrade = null; }, 2500); }

  Object.assign(UI._, { panelSmith, upgradeResult });
  Object.assign(UI._.PANELS, { smith: panelSmith });
  Object.assign(UI, { upgradeResult });
})();
