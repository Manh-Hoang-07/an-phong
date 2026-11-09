'use strict';
/* UI · Thú triệu hồi và bộ kỹ năng hỗ trợ chiến đấu. */
(() => {
  const { G, esc } = UI._;
  function panelMount() {
    const p = App.player, own = (p.mounts && p.mounts.owned) || [], summoned = p.mounts?.summoned || (p.mounts?.active ? [p.mounts.active] : []);
    const ps = G.petStats(p), pets = p.pets || {};
    let html = `<p class="muted" style="margin-top:0">Thú nhận qua mã quà tặng ở Lữ khách bí ẩn. Bạn có thể triệu hồi nhiều thú cùng lúc. Chúng đi theo, tự đánh quái gần đó và nhận một phần sát thương khi bạn bị đánh; HP, MP và thể lực tự hồi khi yên chiến.</p>`;
    if (p.school === 'trieu_hoi_su' || p.school === 'tu_linh_thuat_su' || p.school === 'toan_nang') {
      const states = p.summons?.states || {}, choice = G.summonChoice(p);
      html += `<p class="muted">🐾 <b>Linh thú mặc định</b> (kỹ năng Triệu Hồi Linh Thú): mỗi lần gọi <b>1 con</b> do bạn chọn${p.summons?.enabled ? ` · đang gọi ${esc(G.SUMMONS[choice].name)}` : ' · chưa gọi'}. Mỗi con có cấp riêng, bắt đầu từ cấp 1 và lên cấp khi đánh quái (tối đa bằng cấp của bạn).</p><div class="list">`;
      for (const [id, m] of Object.entries(G.SUMMONS)) {
        const picked = id === choice, on = !!p.summons?.enabled && picked;
        const pickBtn = picked ? '<span class="okc" style="font-size:12px">✔ Đã chọn</span>' : `<button class="btn small" data-act="summon_pick" data-id="${id}">${p.summons?.enabled ? 'Đổi sang' : 'Chọn'}</button>`;
        const ss = G.summonUnitStats(p, id), lv = G.summonUnitLv(p, id);
        const u = p.summons?.units?.[id] || {};
        const capped = lv >= (p.level || 1);
        const expLine = capped ? 'đã chạm cấp chủ' : `Kinh nghiệm ${Math.round(u.exp || 0)}/${G.summonExpToNext(lv)}`;
        const st = states[id] || {};
        html += `<div class="li mount-li${on ? ' on' : ''}"><div class="ic">${m.icon}</div>
          <div class="main"><b>${esc(m.name)} <small>Cấp ${lv}</small>${on ? ' <span class="okc">· đang theo chủ</span>' : ''}</b><small>${esc(m.desc)}</small><small class="muted">${expLine}</small>${on ? `<small>HP ${Math.round(st.hp ?? ss.maxHp)}/${ss.maxHp} · MP ${Math.round(st.mp ?? ss.maxMp)}/${ss.maxMp} · Thể lực ${Math.round(st.sta ?? ss.maxSta)}/${ss.maxSta}</small>` : (picked ? '<small class="muted">Bật kỹ năng Triệu Hồi Linh Thú để gọi</small>' : '<small class="muted">Chọn để gọi con này thay cho con hiện tại</small>')}</div><div class="row">${pickBtn}</div></div>`;
      }
      html += '</div>';
    }
    html += '<div class="list">';
    for (const [id, m] of Object.entries(G.MOUNTS)) {
      const has = own.includes(id), on = summoned.includes(id), pet = pets[id] || {};
      const btn = !has ? '<span class="muted" style="font-size:12px">🔒 Nhận qua mã quà tặng</span>'
        : on ? `<button class="btn small" data-act="mount_set" data-id="${id}">Thu hồi</button>`
          : `<button class="btn small primary" data-act="mount_set" data-id="${id}">Triệu hồi · 10 MP</button>`;
      const petSkillId = p.mounts?.skills?.[id] || p.mounts?.skill || 'bite';
      const petSkill = G.PET_SKILLS[petSkillId] || G.PET_SKILLS.bite;
      const skillSlot = on ? `<div class="pet-skill-slot"><b>Ô kỹ năng</b><div class="row pet-skills">${Object.entries(G.PET_SKILLS).map(([sid, sk]) => `<button class="btn small ${sid === petSkillId ? 'primary' : ''}" data-act="pet_skill" data-id="${id}" data-skill="${sid}" title="${esc(sk.desc)}">${sk.icon} ${esc(sk.name)}<small>${sk.mp} MP · ${sk.sta} thể lực</small></button>`).join('')}</div></div>` : '';
      html += `<div class="li mount-li${has ? '' : ' locked'}${on ? ' on' : ''}"><div class="ic">${m.icon}</div>
        <div class="main"><b>${esc(m.name)}${on ? ' <span class="okc">· đã triệu hồi</span>' : ''}</b><small>${esc(m.desc)}</small>${on ? `<small>HP ${Math.round(pet.hp ?? ps.maxHp)}/${ps.maxHp} · MP ${Math.round(pet.mp ?? ps.maxMp)}/${ps.maxMp} · Thể lực ${Math.round(pet.sta ?? ps.maxSta)}/${ps.maxSta}</small>${skillSlot}<small class="muted">Đang tự dùng ${esc(petSkill.name)}; thú gục sẽ hồi sinh sau 15 giây.</small>` : '<small class="muted">Tự đi theo và hỗ trợ đánh quái</small>'}</div><div class="row">${btn}</div></div>`;
    }
    html += '</div>';
    return ['Thú triệu hồi', html];
  }
  Object.assign(UI._.PANELS, { mount: panelMount });
})();
