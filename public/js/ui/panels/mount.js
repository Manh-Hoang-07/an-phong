'use strict';
/* UI · Thú triệu hồi của Triệu Hồi Sư (linh thú): cấp riêng, kỹ năng mở theo cấp, trang bị thú. */
(() => {
  const { G, esc } = UI._;

  // Khung trang bị thú (yên, dây cương, giáp, vòng cổ) dùng chung cho linh thú và thú đồng hành
  function petGearHtml(petId) {
    const p = App.player, gear = G.petGearOf(p, petId), lv = G.petLevelFor(p, petId);
    const cells = Object.entries(G.PET_GEAR_SLOTS).map(([slot, s]) => {
      const id = gear[slot], d = id && G.ITEMS[id];
      const bag = p.bag.filter(e => G.ITEMS[e.id]?.kind === 'pet_gear' && G.ITEMS[e.id].petSlot === slot);
      const buttons = bag.map(e => {
        const d2 = G.ITEMS[e.id], ok = lv >= d2.refLv, same = e.id === id;
        return `<button class="btn small" data-act="pet_equip" data-pet="${petId}" data-item="${e.id}" ${ok && !same ? '' : 'disabled'} title="${esc(d2.desc)}">${esc(d2.name)} ×${e.qty}${ok ? '' : ` (cấp ${d2.refLv})`}</button>`;
      }).join('');
      return `<div class="pet-gear-slot">
        <span class="pet-gear-ic">${s.icon}</span>
        <div class="pet-gear-main">
          <small>${esc(s.name)}</small>
          ${d ? `<b class="okc">${esc(d.name)}</b>` : '<b class="muted">Trống</b>'}
          ${buttons ? `<div class="row pet-gear-btns">${buttons}</div>` : ''}
        </div>
        ${d ? `<button class="btn small" data-act="pet_unequip" data-pet="${petId}" data-slot="${slot}">Tháo</button>` : ''}
      </div>`;
    }).join('');
    return `<div class="pet-gear">
      <div class="pet-gear-h">Trang bị thú <small>mua ở tiệm tạp hóa</small></div>
      ${cells}</div>`;
  }

  const statLine = (st) => `HP ${st.maxHp} · Tấn công ${Math.round(st.atk)} · Phòng thủ ${st.def}`;

  function panelSummon() {
    const p = App.player;
    const states = p.summons?.states || {}, choice = G.summonChoice(p);
    const head = `<div class="pet-head">
      <div class="pet-head-ic">🐾</div>
      <div class="pet-head-txt">
        <b>Linh thú triệu hồi</b>
        <small>Mở bằng kỹ năng Triệu Hồi Linh Thú · Mỗi lần gọi 1 con do bạn chọn · Lên cấp khi đánh quái (tối đa bằng cấp của bạn)</small>
      </div>
      <div class="pet-head-count"><b>${p.summons?.enabled ? esc(G.SUMMONS[choice].name) : '—'}</b><small>${p.summons?.enabled ? 'đang gọi' : 'chưa gọi'}</small></div>
    </div>`;

    const cards = Object.entries(G.SUMMONS).map(([id, m]) => {
      const picked = id === choice, on = !!p.summons?.enabled && picked;
      const pickBtn = picked ? '<span class="pet-lock okc">✔ Đã chọn</span>'
        : `<button class="btn small" data-act="summon_pick" data-id="${id}">${p.summons?.enabled ? 'Đổi sang' : 'Chọn'}</button>`;
      const ss = G.summonUnitStats(p, id), lv = G.summonUnitLv(p, id);
      const u = p.summons?.units?.[id] || {};
      const capped = lv >= (p.level || 1);
      const expLine = capped ? 'đã chạm cấp chủ' : `Kinh nghiệm ${Math.round(u.exp || 0)}/${G.summonExpToNext(lv)}`;
      const st = states[id] || {};
      const skills = (G.SUMMON_SKILLS[id] || []).map(sk => sk.lv <= lv
        ? `<span class="okc" title="${esc(sk.desc)}">${sk.icon} ${esc(sk.name)}</span>`
        : `<span class="muted" title="${esc(sk.desc)}">🔒 ${esc(sk.name)} (cấp ${sk.lv})</span>`).join(' · ');
      const live = on ? `<div class="pet-bars">
          <div class="pet-bar hp"><span>❤</span><i style="width:${Math.min(100, (st.hp ?? ss.maxHp) / ss.maxHp * 100)}%"></i><b>${Math.round(st.hp ?? ss.maxHp)}/${ss.maxHp}</b></div>
          <div class="pet-bar mp"><span>💠</span><i style="width:${Math.min(100, (st.mp ?? ss.maxMp) / ss.maxMp * 100)}%"></i><b>${Math.round(st.mp ?? ss.maxMp)}/${ss.maxMp}</b></div>
          <div class="pet-bar sta"><span>⚡</span><i style="width:${Math.min(100, (st.sta ?? ss.maxSta) / ss.maxSta * 100)}%"></i><b>${Math.round(st.sta ?? ss.maxSta)}/${ss.maxSta}</b></div>
        </div>` : '';
      return `<div class="pet-card${on ? ' on' : ''}">
        <div class="pet-card-top">
          <div class="pet-ava">${m.icon}</div>
          <div class="pet-id">
            <b>${esc(m.name)} <span class="pet-lv">Cấp ${lv}</span>${on ? ' <span class="okc">· đang theo chủ</span>' : ''}</b>
            <small>${esc(m.desc)}</small>
            <div class="pet-stats"><span>${statLine(ss)}</span></div>
            <small class="muted">${expLine}</small>
          </div>
          <div class="pet-card-act">${pickBtn}</div>
        </div>
        ${live}
        <div class="pet-skills-line"><b>Kỹ năng:</b> ${skills}</div>
        ${petGearHtml(id)}
      </div>`;
    }).join('');

    return ['Thú triệu hồi', `<div class="pet-wrap">${head}<div class="pet-list">${cards}</div></div>`];
  }

  Object.assign(UI._, { petGearHtml, petStatLine: statLine });
  Object.assign(UI._.PANELS, { mount: panelSummon });
})();
