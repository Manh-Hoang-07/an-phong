'use strict';
/* UI · Thú triệu hồi và bộ kỹ năng hỗ trợ chiến đấu. */
(() => {
  const { G, esc } = UI._;
  function panelMount() {
    const p = App.player, own = (p.mounts && p.mounts.owned) || [], summoned = p.mounts?.summoned || (p.mounts?.active ? [p.mounts.active] : []);
    const ps = G.petStats(p), pets = p.pets || {};
    let html = `<p class="muted" style="margin-top:0">Thú nhận qua mã quà tặng ở Lữ khách bí ẩn. Bạn có thể triệu hồi nhiều thú cùng lúc. Chúng đi theo, tự đánh quái gần đó và nhận một phần sát thương khi bạn bị đánh; HP, MP và thể lực tự hồi khi yên chiến.</p>`;
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
