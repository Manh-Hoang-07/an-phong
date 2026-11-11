'use strict';
/* UI · Bảng kỹ năng. */
(() => {
  const { G, $, esc, S } = UI._;

  // ---------- Kỹ năng
  // Số liệu chính của kỹ năng ở một cấp, để người chơi thấy nâng cấp tăng gì
  function skillNumbers(s) {
    const st = App.stats, out = [];
    if (s.power) out.push(`${Math.round(s.power * st.skillMul * 100)}% sức mạnh` + (s.hits ? ` × ${s.hits} nhát` : '') + (s.count > 1 ? ` × ${s.count}` : '') + (s.arrows ? ` × ${s.arrows} mũi` : ''));
    if (s.finisher) out.push(`nhát cuối ${Math.round(s.finisher * st.skillMul * 100)}%`);
    if (s.after) out.push(`vệt kiếm ${Math.round(s.after * st.skillMul * 100)}%`);
    if (s.heal) out.push(`hồi ${Math.round(s.heal * st.skillMul * 100)}% máu`);
    if (s.mpHeal) out.push(`+${Math.round(s.mpHeal * 100)}% năng lượng`);
    if (s.reduce) out.push(`giảm ${Math.round(s.reduce * 100)}% sát thương`);
    if (s.reflect) out.push(`phản ${Math.round(s.reflect * 100)}%`);
    if (s.absorb) out.push(`đỡ ${Math.round(s.absorb * 100)}% sát thương`);
    if (s.atkBuff) out.push(`tấn công +${Math.round(s.atkBuff * st.skillMul * 100)}%`);
    if (s.critBuff) out.push(`chí mạng +${s.critBuff}%`);
    if (s.speedBuff) out.push(`tốc đánh +${Math.round(s.speedBuff * 100)}%`);
    if (s.duration) out.push(`${s.duration} giây`);
    if (s.slow) out.push(`làm chậm ${s.slow}s`);
    if (s.freeze) out.push(`đóng băng ${s.freeze}s`);
    if (s.distance) out.push(`xa ${s.distance}`);
    if (s.radius) out.push(`bán kính ${s.radius}`);
    return out.join(' · ');
  }

  function slotLabel(i) { return G.isUltSlot(i) ? G.ultKeyLabel(i) : String(i + 1); }
  const schoolLabel = (s) => s === 'chung' ? '✨ Dùng chung (mọi class)' : `${G.SCHOOLS[s]?.icon || ''} ${G.SCHOOLS[s]?.name || s}`;
  const ultWho = (sk) => sk.ultAny ? 'mọi class' : (sk.ultSchools || [sk.school]).map(x => G.SCHOOLS[x]?.name || x).join(', ');

  function panelSkills() {
    const p = App.player, st = App.stats;
    if (!p.school) {
      return ['Kỹ năng', `<p>Bạn chưa thức tỉnh class. Đạt cấp 5 rồi gặp <b>Hội trưởng Khải</b> để chọn class.</p>
        <p>Điểm kỹ năng đang có: <b class="gold">${p.skillPoints}</b> (mỗi lần lên cấp được 1 điểm, giữ lại để dùng sau khi thức tỉnh).</p>
        <div class="schools">` + Object.entries(G.SCHOOLS).filter(([id, s]) => !s.special || p.unlocks[id])
        .map(([, s]) => `<div class="school-card"><h3>${s.icon} ${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>`).join('') + '</div>'];
    }
    const tn = p.school === 'toan_nang';
    const slots = G.normalSlotsOf(p).concat(G.ultSlotsOf(p));
    let html = `<div class="row" style="justify-content:space-between;margin-bottom:8px">
      <div>Điểm kỹ năng: <b class="gold" style="font-size:16px">${p.skillPoints}</b></div>
      <div class="muted" style="font-size:12px">Mỗi cấp +1 điểm · Tẩy điểm ở Hội trưởng Khải</div></div>`;
    // Thanh kỹ năng hiện tại. Đã mở chức nghiệp 2 (trừ Toàn Năng) thì có thêm thanh riêng, tự thay khi bật chức nghiệp 2
    const evo = G.EVOLUTIONS[p.school];
    const hasCareerBar = !tn && !!evo && !!p.advancement?.unlocked?.[evo];
    const careerOn = !!App.form && p.formChoice === 'evolution';
    const barHtml = (bar, key) => '<div class="skill-slots">' + slots.map(i => {
      const id = bar[i];
      const sk = id && G.SKILLS[id];
      return `<div class="sslot ${G.isUltSlot(i) ? 'ult' : ''}"><span class="k">${slotLabel(i)}</span>` +
        (sk ? `<span class="ic">${sk.icon}</span><small>${esc(sk.name)}</small><button class="x" data-act="clear_slot" data-slot="${i}" data-bar="${key}" title="Gỡ">✕</button>`
          : `<small class="muted">${G.isUltSlot(i) ? 'Tuyệt kỹ' : 'Trống'}</small>`) + '</div>';
    }).join('') + '</div>';
    if (hasCareerBar) {
      html += `<div class="muted" style="margin:4px 0;font-size:12px">THANH CHỨC NGHIỆP 1 · ${esc(G.SCHOOLS[p.school].name)}${careerOn ? '' : ' (đang dùng)'}</div>` + barHtml(p.skillSlots, 'main');
      html += `<div class="muted" style="margin:8px 0 4px;font-size:12px">THANH CHỨC NGHIỆP 2 · ${esc(G.EVOLUTION_NAMES[evo] || '')}${careerOn ? ' (đang dùng)' : ''}</div>` + barHtml(p.careerSlots || [], 'career');
    } else html += barHtml(p.skillSlots, 'main');
    // Nội tại
    const passives = G.passivesOf(p);
    if (passives.length) {
      html += '<div class="muted" style="margin:10px 0 4px;font-size:12px">NỘI TẠI</div><div class="list">' + passives.map(k => {
        const ps = G.PASSIVES[k];
        return `<div class="li"><div class="ic">${ps.icon}</div><div class="main"><b>${esc(ps.name)}</b><small>${esc(ps.desc)}</small></div></div>`;
      }).join('') + '</div>';
    }
    // Danh sách kỹ năng
    html += '<div class="muted" style="margin:12px 0 4px;font-size:12px">KỸ NĂNG CHỦ ĐỘNG</div><div class="list">';
    let lastSchool = null, inUlt = false;
    const all = G.availableSkills(p);
    const schoolOrder = [...new Set(all.map(id => G.SKILLS[id].school))];
    const bySchool = (a, b) => schoolOrder.indexOf(G.SKILLS[a].school) - schoolOrder.indexOf(G.SKILLS[b].school) || G.SKILLS[a].level - G.SKILLS[b].level;
    // Tuyệt kỹ đã học lên trước
    const ultIds = all.filter(id => G.SKILLS[id].ult).sort((a, b) => (!!G.skillLevel(p, b) - !!G.skillLevel(p, a)) || bySchool(a, b));
    const ids = all.filter(id => !G.SKILLS[id].ult).sort(bySchool).concat(ultIds);
    for (const id of ids) {
      const base = G.SKILLS[id];
      if (base.ult && !inUlt) {
        inUlt = true; lastSchool = null;
        html += `</div><div class="muted" style="margin:14px 0 4px;font-size:12px">TUYỆT KỸ · học bằng Sách Tuyệt Kỹ · gắn tối đa ${G.ultSlotsOf(p).length} tuyệt kỹ vào các ô ${G.ultSlotsOf(p).map(slotLabel).join(' / ')}</div><div class="list">`;
      }
      if (tn && !base.ult && base.school !== lastSchool) {
        html += `<div class="muted" style="margin-top:6px;font-size:12px">— ${schoolLabel(base.school)} —</div>`;
        lastSchool = base.school;
      }
      const lv = G.skillLevel(p, id);
      const locked = base.ult ? !lv : base.level > p.level;
      const bookName = base.ult ? G.ITEMS[G.ultBookId(id)]?.name : '';
      const hasBook = base.ult && !lv && p.bag.some(e => e.id === G.ultBookId(id) || (e.id === 'sach_tuyet_ky' && id === G.signatureUlt(p)));
      const cur = G.skillAt(id, Math.max(1, lv));
      const next = lv && lv < G.SKILL_MAX ? G.skillAt(id, lv + 1) : null;
      const canUp = !locked && lv < G.SKILL_MAX && p.skillPoints > 0;
      const upBtn = lv >= G.SKILL_MAX ? '<span class="gold" style="font-size:12px">TỐI ĐA</span>'
        : `<button class="btn small ${canUp ? 'primary' : ''}" data-act="learn_skill" data-skill="${id}" ${canUp ? '' : 'disabled'}>${lv ? '+1 cấp' : 'Học'}</button>`;
      // Nút gắn vào ô. Tuyệt kỹ dùng chung hai chức nghiệp thì có thêm nhóm nút cho thanh chức nghiệp 2
      const slotGroup = (key, bar) => (base.ult ? G.ultSlotsOf(p) : G.normalSlotsOf(p))
        .map(i => { const on = (bar || [])[i] === id; return `<button class="btn small slotbtn ${on ? 'on' : ''}" data-act="set_skill" data-slot="${i}" data-skill="${id}" data-bar="${key}" ${on ? 'disabled' : ''}>${slotLabel(i)}</button>`; }).join('');
      const shared = G.isSharedUlt(base) && hasCareerBar;
      const slotBtns = !lv ? '' : shared
        ? `<span class="muted" style="font-size:11px">Nghề 1</span>${slotGroup('main', p.skillSlots)}<span class="muted" style="font-size:11px;margin-left:6px">Nghề 2</span>${slotGroup('career', p.careerSlots)}`
        : slotGroup('main', p[G.slotKeyOf(p, id)]);
      const ms = [[5, base.t5], [10, base.t10]].filter(([, t]) => t)
        .map(([m, t]) => `<span class="${lv >= m ? 'okc' : 'muted'}">${lv >= m ? '✓' : '◇'} Cấp ${m}: ${esc(t)}</span>`).join('<br>');
      html += `<div class="li skill-li ${locked ? 'locked' : ''} ${base.ult ? 'is-ult' : ''}">
        <div class="ic">${base.icon}</div>
        <div class="main">
          <b>${esc(base.name)}</b> ${base.ult ? '<span class="tag-ult">TUYỆT KỸ</span>' : ''}
          <span class="lvl">${locked ? (base.ult ? `🔒 Cần ${esc(bookName || 'Sách Tuyệt Kỹ')}${p.level < base.level ? ` · cấp ${base.level}` : ''}` : `🔒 Mở ở cấp ${base.level}`) : lv ? `Cấp ${lv}/${G.SKILL_MAX}` : 'Chưa học'}</span>
          <small>${esc(base.desc)}</small>
          ${base.ult ? `<small class="muted">Dành cho: ${esc(ultWho(base))} · Nguồn: ${base.ultAny ? 'nhiệm vụ Khảo hạch Tuyệt Kỹ (Hội trưởng Khải)' : 'mã quà tặng'}${hasBook ? ' · <b class="okc">Bạn đang có sách, hãy đọc trong Túi đồ</b>' : ''}</small>` : ''}
          <small>${skillNumbers(cur)} · ${Math.round(cur.mp * st.costMul)} năng lượng · hồi ${Math.round(cur.cd * 10) / 10}s</small>
          ${next ? `<small class="okc">Cấp ${lv + 1}: ${skillNumbers(next)}</small>` : ''}
          <small>${ms}</small>
        </div>
        <div class="skill-act">${upBtn}<div class="row" style="gap:4px;margin-top:6px;flex-wrap:wrap;align-items:center">${slotBtns}</div></div>
      </div>`;
    }
    html += '</div>';
    return ['Kỹ năng · ' + G.SCHOOLS[p.school].name, html];
  }

  Object.assign(UI._, { skillNumbers, slotLabel, panelSkills });
  Object.assign(UI._.PANELS, { skills: panelSkills });
})();
