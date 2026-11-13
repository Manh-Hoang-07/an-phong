'use strict';
/* UI · Thú triệu hồi của Triệu Hồi Sư (linh thú): cấp riêng, kỹ năng riêng mở theo cấp, trang bị thú. Thú đồng hành: xem companion.js. */
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
      return `<div style="margin:4px 0"><b>${s.icon} ${s.name}:</b> ${d ? `<span class="okc">${esc(d.name)}</span> <button class="btn small" data-act="pet_unequip" data-pet="${petId}" data-slot="${slot}">Tháo</button>` : '<span class="muted">Trống</span>'}${buttons ? `<div class="row" style="flex-wrap:wrap;gap:4px;margin-top:3px">${buttons}</div>` : ''}</div>`;
    }).join('');
    return `<div class="pet-gear" style="margin-top:6px;padding:6px 8px;border:1px solid rgba(255,255,255,.12);border-radius:6px"><div class="muted" style="font-size:12px">TRANG BỊ THÚ · mua ở tiệm tạp hóa</div>${cells}</div>`;
  }
  const statLine = (st) => `HP ${st.maxHp} · Tấn công ${Math.round(st.atk)} · Phòng thủ ${st.def}`;

  function panelSummon() {
    const p = App.player;
    const states = p.summons?.states || {}, choice = G.summonChoice(p);
    let html = `<p class="muted" style="margin-top:0">🐾 <b>Linh thú</b> (kỹ năng Triệu Hồi Linh Thú): mỗi lần gọi <b>1 con</b> do bạn chọn${p.summons?.enabled ? ` · đang gọi ${esc(G.SUMMONS[choice].name)}` : ' · chưa gọi'}. Mỗi con bắt đầu từ <b>cấp 1</b>, lên cấp khi đánh quái (tối đa bằng cấp của bạn). Lên đủ cấp sẽ mở khóa kỹ năng riêng của con đó.</p><div class="list">`;
    for (const [id, m] of Object.entries(G.SUMMONS)) {
      const picked = id === choice, on = !!p.summons?.enabled && picked;
      const pickBtn = picked ? '<span class="okc" style="font-size:12px">✔ Đã chọn</span>' : `<button class="btn small" data-act="summon_pick" data-id="${id}">${p.summons?.enabled ? 'Đổi sang' : 'Chọn'}</button>`;
      const ss = G.summonUnitStats(p, id), lv = G.summonUnitLv(p, id);
      const u = p.summons?.units?.[id] || {};
      const capped = lv >= (p.level || 1);
      const expLine = capped ? 'đã chạm cấp chủ' : `Kinh nghiệm ${Math.round(u.exp || 0)}/${G.summonExpToNext(lv)}`;
      const st = states[id] || {};
      const skills = (G.SUMMON_SKILLS[id] || []).map(sk => sk.lv <= lv
        ? `<span class="okc" title="${esc(sk.desc)}">${sk.icon} ${esc(sk.name)}</span>`
        : `<span class="muted" title="${esc(sk.desc)}">🔒 ${esc(sk.name)} (cấp ${sk.lv})</span>`).join(' · ');
      html += `<div class="li mount-li${on ? ' on' : ''}"><div class="ic">${m.icon}</div>
          <div class="main"><b>${esc(m.name)} <small>Cấp ${lv}</small>${on ? ' <span class="okc">· đang theo chủ</span>' : ''}</b><small>${esc(m.desc)}</small><small class="muted">${expLine}</small><small>${statLine(ss)}</small>${on ? `<small>HP ${Math.round(st.hp ?? ss.maxHp)}/${ss.maxHp} · MP ${Math.round(st.mp ?? ss.maxMp)}/${ss.maxMp} · Thể lực ${Math.round(st.sta ?? ss.maxSta)}/${ss.maxSta}</small>` : ''}
          <small>Kỹ năng: ${skills}</small>${petGearHtml(id)}</div><div class="row">${pickBtn}</div></div>`;
    }
    html += '</div>';
    return ['Thú triệu hồi', html];
  }
  Object.assign(UI._, { petGearHtml, petStatLine: statLine });
  Object.assign(UI._.PANELS, { mount: panelSummon });
})();
