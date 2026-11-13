'use strict';
/* UI · Thú đồng hành: thú nhận bằng mã quà tặng, chỉ số cố định theo loài, mặc được trang bị thú. */
(() => {
  const { G, esc } = UI._;

  // Thanh chỉ số nhỏ cho thú
  const bar = (label, cur, max, cls) => {
    const pc = max ? Math.min(100, Math.max(0, cur / max * 100)) : 0;
    return `<div class="pet-bar ${cls}"><span>${label}</span><i style="width:${pc}%"></i><b>${Math.round(cur)}/${Math.round(max)}</b></div>`;
  };

  function panelCompanion() {
    const p = App.player;
    const own = (p.mounts && p.mounts.owned) || [];
    const summoned = p.mounts?.summoned || (p.mounts?.active ? [p.mounts.active] : []);
    const pets = p.pets || {};

    const head = `<div class="pet-head">
      <div class="pet-head-ic">🐕</div>
      <div class="pet-head-txt">
        <b>Thú đồng hành</b>
        <small>Nhận qua mã quà tặng · Chỉ số cố định theo loài, không lên cấp · Mạnh hơn nhờ trang bị thú</small>
      </div>
      <div class="pet-head-count"><b>${summoned.length}</b><small>đang theo</small></div>
    </div>
    <p class="muted pet-note">Có thể triệu hồi nhiều thú cùng lúc. Chúng đi theo, tự đánh quái gần đó và nhận một phần sát thương khi bạn bị đánh. HP, MP và thể lực tự hồi khi yên chiến.</p>`;

    const cards = Object.entries(G.MOUNTS).map(([id, m]) => {
      const has = own.includes(id), on = summoned.includes(id), pet = pets[id] || {};
      const ps = G.companionStats(p, id);
      const petSkillId = p.mounts?.skills?.[id] || p.mounts?.skill || 'bite';
      const petSkill = G.PET_SKILLS[petSkillId] || G.PET_SKILLS.bite;

      const btn = !has ? '<span class="pet-lock">🔒 Nhận qua mã quà tặng</span>'
        : on ? `<button class="btn small" data-act="mount_set" data-id="${id}">Thu hồi</button>`
          : `<button class="btn small primary" data-act="mount_set" data-id="${id}">Triệu hồi · 10 MP</button>`;

      const skillSlot = on ? `<div class="pet-skill-pick">
          <div class="pet-sub">Ô kỹ năng</div>
          <div class="row pet-skills">${Object.entries(G.PET_SKILLS).map(([sid, sk]) =>
            `<button class="btn small${sid === petSkillId ? ' primary' : ''}" data-act="pet_skill" data-id="${id}" data-skill="${sid}" title="${esc(sk.desc)}">
              ${sk.icon} ${esc(sk.name)}<small>${sk.mp} MP · ${sk.sta} thể lực</small></button>`).join('')}</div>
        </div>` : '';

      const live = on ? `<div class="pet-bars">
          ${bar('❤', pet.hp ?? ps.maxHp, ps.maxHp, 'hp')}
          ${bar('💠', pet.mp ?? ps.maxMp, ps.maxMp, 'mp')}
          ${bar('⚡', pet.sta ?? ps.maxSta, ps.maxSta, 'sta')}
        </div>
        ${skillSlot}
        <small class="muted">Đang tự dùng ${esc(petSkill.name)}; thú gục sẽ hồi sinh sau 15 giây.</small>` : '';

      return `<div class="pet-card${has ? '' : ' locked'}${on ? ' on' : ''}">
        <div class="pet-card-top">
          <div class="pet-ava">${m.icon}</div>
          <div class="pet-id">
            <b>${esc(m.name)}${on ? ' <span class="okc">· đã triệu hồi</span>' : ''}</b>
            <small>${esc(m.desc)}</small>
            <div class="pet-stats">
              <span>❤ ${Math.round(ps.maxHp)}</span><span>⚔ ${Math.round(ps.atk)}</span>
              <span>🛡 ${Math.round(ps.def)}</span><span>💠 ${Math.round(ps.maxMp)}</span>
            </div>
          </div>
          <div class="pet-card-act">${btn}</div>
        </div>
        ${live}
        ${has ? UI._.petGearHtml(id) : ''}
      </div>`;
    }).join('');

    return ['Thú đồng hành', `<div class="pet-wrap">${head}<div class="pet-list">${cards}</div></div>`];
  }

  Object.assign(UI._, { panelCompanion });
  Object.assign(UI._.PANELS, { companion: panelCompanion });
})();
