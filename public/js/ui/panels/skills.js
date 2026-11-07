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

  function slotLabel(i) { return i === G.ULT_SLOT ? 'R' : String(i + 1); }

  function panelSkills() {
    const p = App.player, st = App.stats;
    if (!p.school) {
      return ['Kỹ năng', `<p>Bạn chưa thức tỉnh class. Đạt cấp 5 rồi gặp <b>Hội trưởng Khải</b> để chọn class.</p>
        <p>Điểm kỹ năng đang có: <b class="gold">${p.skillPoints}</b> (mỗi lần lên cấp được 1 điểm, giữ lại để dùng sau khi thức tỉnh).</p>
        <div class="schools">` + Object.entries(G.SCHOOLS).filter(([id, s]) => !s.special || p.unlocks[id])
        .map(([, s]) => `<div class="school-card"><h3>${s.icon} ${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>`).join('') + '</div>'];
    }
    const tn = p.school === 'toan_nang';
    const slots = [0, 1, 2, 3].concat(tn ? [G.EXTRA_SLOT] : []).concat([G.ULT_SLOT]);
    let html = `<div class="row" style="justify-content:space-between;margin-bottom:8px">
      <div>Điểm kỹ năng: <b class="gold" style="font-size:16px">${p.skillPoints}</b></div>
      <div class="muted" style="font-size:12px">Mỗi cấp +1 điểm · Tẩy điểm ở Hội trưởng Khải</div></div>`;
    // Thanh kỹ năng hiện tại
    html += '<div class="skill-slots">' + slots.map(i => {
      const id = p.skillSlots[i];
      const sk = id && G.SKILLS[id];
      return `<div class="sslot ${i === G.ULT_SLOT ? 'ult' : ''}"><span class="k">${slotLabel(i)}</span>` +
        (sk ? `<span class="ic">${sk.icon}</span><small>${esc(sk.name)}</small><button class="x" data-act="clear_slot" data-slot="${i}" title="Gỡ">✕</button>`
          : `<small class="muted">${i === G.ULT_SLOT ? 'Tuyệt kỹ' : 'Trống'}</small>`) + '</div>';
    }).join('') + '</div>';
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
    let lastSchool = null;
    const ids = G.availableSkills(p);
    const schoolOrder = [...new Set(ids.map(id => G.SKILLS[id].school))];
    ids.sort((a, b) => {
      const sa = G.SKILLS[a], sb = G.SKILLS[b];
      if (!!sa.ult !== !!sb.ult) return sa.ult ? 1 : -1;
      const group = schoolOrder.indexOf(sa.school) - schoolOrder.indexOf(sb.school);
      return group || sa.level - sb.level;
    });
    for (const id of ids) {
      const base = G.SKILLS[id];
      if (tn && base.school !== lastSchool) {
        html += `<div class="muted" style="margin-top:6px;font-size:12px">— ${G.SCHOOLS[base.school].icon} ${G.SCHOOLS[base.school].name} —</div>`;
        lastSchool = base.school;
      }
      const lv = G.skillLevel(p, id);
      const locked = base.ult ? !lv : base.level > p.level;
      const cur = G.skillAt(id, Math.max(1, lv));
      const next = lv && lv < G.SKILL_MAX ? G.skillAt(id, lv + 1) : null;
      const canUp = !locked && lv < G.SKILL_MAX && p.skillPoints > 0;
      const upBtn = lv >= G.SKILL_MAX ? '<span class="gold" style="font-size:12px">TỐI ĐA</span>'
        : `<button class="btn small ${canUp ? 'primary' : ''}" data-act="learn_skill" data-skill="${id}" ${canUp ? '' : 'disabled'}>${lv ? '+1 cấp' : 'Học'}</button>`;
      const slotBtns = lv ? (base.ult ? [G.ULT_SLOT] : [0, 1, 2, 3].concat(tn ? [G.EXTRA_SLOT] : []))
        .map(i => `<button class="btn small slotbtn ${p.skillSlots[i] === id ? 'on' : ''}" data-act="set_skill" data-slot="${i}" data-skill="${id}" ${p.skillSlots[i] === id ? 'disabled' : ''}>${slotLabel(i)}</button>`).join('') : '';
      const ms = [[5, base.t5], [10, base.t10]].filter(([, t]) => t)
        .map(([m, t]) => `<span class="${lv >= m ? 'okc' : 'muted'}">${lv >= m ? '✓' : '◇'} Cấp ${m}: ${esc(t)}</span>`).join('<br>');
      html += `<div class="li skill-li ${locked ? 'locked' : ''} ${base.ult ? 'is-ult' : ''}">
        <div class="ic">${base.icon}</div>
        <div class="main">
          <b>${esc(base.name)}</b> ${base.ult ? '<span class="tag-ult">TUYỆT KỸ</span>' : ''}
          <span class="lvl">${locked ? (base.ult ? '🔒 Cần Sách Tuyệt Kỹ' : `🔒 Mở ở cấp ${base.level}`) : lv ? `Cấp ${lv}/${G.SKILL_MAX}` : 'Chưa học'}</span>
          <small>${esc(base.desc)}</small>
          <small>${skillNumbers(cur)} · ${Math.round(cur.mp * st.costMul)} năng lượng · hồi ${Math.round(cur.cd * 10) / 10}s</small>
          ${next ? `<small class="okc">Cấp ${lv + 1}: ${skillNumbers(next)}</small>` : ''}
          <small>${ms}</small>
        </div>
        <div class="skill-act">${upBtn}<div class="row" style="gap:4px;margin-top:6px">${slotBtns}</div></div>
      </div>`;
    }
    html += '</div>';
    return ['Kỹ năng · ' + G.SCHOOLS[p.school].name, html];
  }

  Object.assign(UI._, { skillNumbers, slotLabel, panelSkills });
  Object.assign(UI._.PANELS, { skills: panelSkills });
})();
