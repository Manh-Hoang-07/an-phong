'use strict';
/* UI · Bảng kỹ năng: thanh ô gắn kỹ năng, danh sách kỹ năng đã học, nội tại. */
(() => {
  const { G, esc, S } = UI._;

  // ---------- Kỹ năng
  // Số liệu chính của kỹ năng ở một cấp, để người chơi thấy nâng cấp tăng gì
  function skillNumbers(s) {
    const st = App.stats, out = [];
    if (s.power) out.push(`${Math.round(s.power * st.skillMul * 100)}% sức mạnh` + (s.hits ? ` × ${s.hits} nhát` : '') + (s.count > 1 ? ` × ${s.count}` : '') + (s.arrows ? ` × ${s.arrows} mũi` : ''));
    if (s.finisher) out.push(`nhát cuối ${Math.round(s.finisher * st.skillMul * 100)}%`);
    if (s.after) out.push(`vệt kiếm ${Math.round(s.after * st.skillMul * 100)}%`);
    if (s.heal) out.push(`hồi ${Math.round(s.heal * (G.passivesOf(App.player).includes('tri_lieu_su') ? 1.2 : 1) * 100)}% máu`);
    if (s.mpHeal) out.push(`+${Math.round(s.mpHeal * 100)}% năng lượng`);
    if (s.reduce) out.push(`giảm ${Math.round(s.reduce * 100)}% sát thương`);
    if (s.reflect) out.push(`phản ${Math.round(s.reflect * 100)}%`);
    if (s.absorb) out.push(`đỡ ${Math.round(s.absorb * 100)}% sát thương`);
    if (s.atkBuff) out.push(`tấn công +${Math.round(s.atkBuff * 100)}%`);
    if (s.critBuff) out.push(`chí mạng +${s.critBuff}%`);
    if (s.speedBuff) out.push(`tốc đánh +${Math.round(s.speedBuff * 100)}%`);
    if (s.duration) out.push(`${s.duration} giây`);
    if (s.slow) out.push(`làm chậm ${s.slow}s`);
    if (s.freeze) out.push(`đóng băng ${s.freeze}s`);
    if (s.vsSlowed) out.push(`×${s.vsSlowed} lên quái đang chậm`);
    if (s.shred) out.push(`quái chịu thêm ${Math.round(s.shred * 100)}% sát thương`);
    if (s.chain) out.push(`nổ lan ${Math.round(s.chain * 100)}%`);
    if (s.exec) out.push(`×${s.exec.mult} lên quái dưới ${Math.round(s.exec.below * 100)}% máu`);
    if (s.distance) out.push(`xa ${s.distance}`);
    if (s.radius) out.push(`bán kính ${s.radius}`);
    return out.join(' · ');
  }

  function slotLabel(i) { return G.isUltSlot(i) ? G.ultKeyLabel(i) : String(i + 1); }
  const schoolLabel = (s) => s === 'chung' ? '✨ Dùng chung (mọi class)' : `${G.SCHOOLS[s]?.icon || ''} ${G.SCHOOLS[s]?.name || s}`;

  // Ô gắn kỹ năng trên thanh: hiện icon, tên, nút gỡ
  function slotBar(p) {
    const slots = G.normalSlotsOf(p).concat(G.ultSlotsOf(p));
    const cells = slots.map(i => {
      const id = p.skillSlots[i];
      const sk = id && G.SKILLS[id];
      const ult = G.isUltSlot(i);
      return `<div class="sslot${ult ? ' ult' : ''}${sk ? ' filled' : ''}">
        <span class="k">${slotLabel(i)}</span>
        ${sk ? `<span class="ic">${sk.icon}</span><small>${esc(sk.name)}</small>
          <button class="x" data-act="clear_slot" data-slot="${i}" title="Gỡ khỏi ô">✕</button>`
        : `<span class="ic ph">${ult ? '★' : '◇'}</span><small class="muted">${ult ? 'Tuyệt kỹ' : 'Trống'}</small>`}
      </div>`;
    }).join('');
    const usedN = G.usedSkillSlots(p, false), capN = G.skillCap(p, false);
    const usedU = G.usedSkillSlots(p, true), capU = G.skillCap(p, true);
    return `<div class="sk-bar-card">
      <div class="sk-bar-head">
        <b>Thanh kỹ năng</b>
        <span class="sk-bar-cap">Thường <b>${usedN}/${capN}</b> · Tuyệt kỹ <b>${usedU}/${capU}</b></span>
      </div>
      <div class="skill-slots">${cells}</div>
    </div>`;
  }

  // Một thẻ kỹ năng
  function skillCard(p, id) {
    const base = G.SKILLS[id];
    const lv = G.skillLevel(p, id);
    const cur = G.skillAt(id, Math.max(1, lv));
    const next = lv && lv < G.SKILL_MAX ? G.skillAt(id, lv + 1) : null;
    const canUp = lv < G.SKILL_MAX && p.skillPoints > 0;
    const pips = Array.from({ length: G.SKILL_MAX }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
    const slotGroup = () => (base.ult ? G.ultSlotsOf(p) : G.normalSlotsOf(p))
      .map(i => {
        const on = p.skillSlots[i] === id;
        return `<button class="btn small slotbtn${on ? ' on' : ''}" data-act="set_skill" data-slot="${i}" data-skill="${id}" ${on ? 'disabled' : ''}>${slotLabel(i)}</button>`;
      }).join('');
    const ms = [[5, base.t5], [10, base.t10]].filter(([, t]) => t)
      .map(([m, t]) => `<div class="sk-milestone${lv >= m ? ' on' : ''}">${lv >= m ? '✓' : '◇'} <b>Cấp ${m}</b>: ${esc(t)}</div>`).join('');
    return `<div class="sk-card${base.ult ? ' is-ult' : ''}">
      <div class="sk-card-ic">${base.icon}</div>
      <div class="sk-card-main">
        <div class="sk-card-title">
          <b>${esc(base.name)}</b>
          ${base.ult ? '<span class="tag-ult">TUYỆT KỸ</span>' : ''}
          <span class="sk-lv">Cấp ${lv}/${G.SKILL_MAX}</span>
        </div>
        <div class="sk-pips">${pips}</div>
        <small class="sk-desc">${esc(base.desc)}</small>
        <div class="sk-nums">
          <span>${skillNumbers(cur)}</span>
          <span class="muted">${Math.round(cur.mp * App.stats.costMul)} năng lượng · hồi ${Math.round(cur.cd * 10) / 10}s</span>
        </div>
        ${next ? `<div class="sk-next">▲ Cấp ${lv + 1}: ${skillNumbers(next)}</div>` : ''}
        ${ms}
      </div>
      <div class="sk-card-act">
        ${lv >= G.SKILL_MAX ? '<span class="gold sk-max">TỐI ĐA</span>'
          : `<button class="btn small${canUp ? ' primary' : ''}" data-act="learn_skill" data-skill="${id}" ${canUp ? '' : 'disabled'}>+1 cấp</button>`}
        ${lv ? `<div class="sk-slots">${slotGroup()}</div>` : ''}
      </div>
    </div>`;
  }

  function panelSkills() {
    const p = App.player;
    if (!p.school) {
      return ['Kỹ năng', `<div class="sk-empty">
        <b>Bạn chưa thức tỉnh class</b>
        <p class="muted">Đạt cấp 5 rồi gặp <b>Hội trưởng Khải</b> để chọn class. Điểm kỹ năng vẫn được giữ lại.</p>
        <p>Điểm kỹ năng đang có: <b class="gold">${p.skillPoints}</b></p>
        <div class="schools">${Object.entries(G.SCHOOLS).filter(([, s]) => !s.special && !s.evolved)
          .map(([, s]) => `<div class="school-card"><h3>${s.icon} ${esc(s.name)}</h3><p>${esc(s.desc)}</p></div>`).join('')}</div>
      </div>`];
    }

    const tn = G.baseSchool(p.school) === 'toan_nang';
    const all = G.availableSkills(p);
    const learned = all.filter(id => G.skillLevel(p, id) > 0);
    const schoolOrder = [...new Set(all.map(id => G.SKILLS[id].school))];
    const bySchool = (a, b) => schoolOrder.indexOf(G.SKILLS[a].school) - schoolOrder.indexOf(G.SKILLS[b].school) || G.SKILLS[a].level - G.SKILLS[b].level;
    const normals = learned.filter(id => !G.SKILLS[id].ult).sort(bySchool);
    const ults = learned.filter(id => G.SKILLS[id].ult).sort(bySchool);

    // Nội tại
    const passives = G.passivesOf(p);
    const passiveHtml = passives.length ? `<div class="sk-section"><div class="sk-section-h">Nội tại</div><div class="list">
      ${passives.map(k => { const ps = G.PASSIVES[k]; return `<div class="li"><div class="ic">${ps.icon}</div>
        <div class="main"><b>${esc(ps.name)}</b><small>${esc(ps.desc)}</small></div></div>`; }).join('')}</div></div>` : '';

    // Danh sách kỹ năng thường, gom theo class khi là Toàn Năng
    let normalHtml = '';
    if (!normals.length) {
      normalHtml = `<p class="muted sk-none">Bạn chưa học kỹ năng nào. Mua Sách Kỹ Năng của class ở tiệm tạp hóa rồi đọc trong Túi đồ.</p>`;
    } else if (tn) {
      let last = null;
      normalHtml = normals.map(id => {
        const sc = G.SKILLS[id].school;
        const head = sc !== last ? `<div class="sk-group">${schoolLabel(sc)}</div>` : '';
        last = sc;
        return head + skillCard(p, id);
      }).join('');
    } else {
      normalHtml = normals.map(id => skillCard(p, id)).join('');
    }
    const ultHtml = ults.length ? `<div class="sk-section">
      <div class="sk-section-h">Tuyệt kỹ <small>gắn tối đa ${G.ultSlotsOf(p).length} vào ô ${G.ultSlotsOf(p).map(slotLabel).join(' / ')}</small></div>
      ${ults.map(id => skillCard(p, id)).join('')}</div>` : '';

    const head = `<div class="sk-head">
      <div class="sk-points"><small>Điểm kỹ năng</small><b>${p.skillPoints}</b></div>
      <div class="sk-head-info">
        <b>${esc(G.SCHOOLS[p.school].name)}</b>
        <small>Mỗi cấp +1 điểm · Tẩy điểm ở Hội trưởng Khải · Học thêm bằng Sách Kỹ Năng, mở ô bằng Sách Mở Rộng</small>
      </div>
    </div>`;

    return ['Kỹ năng · ' + G.SCHOOLS[p.school].name, `<div class="sk-wrap">
      ${head}
      ${slotBar(p)}
      ${passiveHtml}
      <div class="sk-section"><div class="sk-section-h">Kỹ năng chủ động</div>${normalHtml}</div>
      ${ultHtml}
    </div>`];
  }

  // Đọc Sách Tẩy Kỹ Năng trong túi đồ: chọn một kỹ năng đang có để xóa hẳn
  function panelErase() {
    const p = App.player;
    const books = p.bag.filter(e => e.id === 'sach_tay_ky_nang').reduce((x, e) => x + e.qty, 0);
    const learned = Object.keys(p.skills || {}).filter(id => G.SKILLS[id] && G.skillLevel(p, id) > 0)
      .sort((a, b) => (G.SKILLS[a].ult ? 1 : 0) - (G.SKILLS[b].ult ? 1 : 0) || G.SKILLS[a].level - G.SKILLS[b].level);
    const rows = learned.map(id => {
      const sk = G.SKILLS[id], lv = G.skillLevel(p, id);
      const ask = S.confirmErase === id;
      return `<div class="li"><div class="ic">${sk.icon}</div>
        <div class="main"><b>${esc(sk.name)}</b>${sk.ult ? ' <span class="tag-ult">TUYỆT KỸ</span>' : ''}
          <small>Cấp ${lv}/${G.SKILL_MAX}${lv > 1 ? ` · mất ${lv - 1} điểm đã cộng` : ''}</small></div>
        <button class="btn small act-btn danger${ask ? ' confirm' : ''}" data-act="erase_skill" data-skill="${id}" ${books ? '' : 'disabled'}>${ask ? '⚠ Bấm lần nữa để xóa' : 'Chọn'}</button></div>`;
    }).join('');
    return ['Sách Tẩy Kỹ Năng', `<p class="muted" style="margin-top:0">Chọn kỹ năng muốn xóa. Kỹ năng và toàn bộ điểm đã cộng sẽ mất, trả lại 1 ô học. Còn <b class="gold">${books}</b> sách.</p>
      <div class="list">${rows || '<p class="muted">Bạn chưa học kỹ năng nào.</p>'}</div>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="open" data-panel="bag">← Quay lại túi đồ</button></div>`];
  }

  Object.assign(UI._, { skillNumbers, slotLabel, panelSkills });
  Object.assign(UI._.PANELS, { skills: panelSkills, erase: panelErase });
})();
