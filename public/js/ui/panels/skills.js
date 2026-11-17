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
    if (s.stun) out.push(`choáng ${s.stun}s`);
    if (s.knock) out.push('hất văng');
    if (s.pierce) out.push('xuyên');
    if (s.vsSlowed) out.push(`×${s.vsSlowed} lên quái đang chậm`);
    if (s.shred) out.push(`quái chịu thêm ${Math.round(s.shred * 100)}% sát thương`);
    if (s.chain) out.push(`nổ lan ${Math.round(s.chain * 100)}%`);
    if (s.exec) out.push(`×${s.exec.mult} lên quái dưới ${Math.round(s.exec.below * 100)}% máu`);
    // Lấy Mạng Đổi Mạng: cái giá là MÁU, phải hiện rõ chứ không để người chơi tự phát hiện
    if (s.selfZero) out.push(s.buaSaves ? 'giết ngay · mình về 0 máu (Bùa giữ 1 máu)' : 'giết ngay · mình về 0 máu');
    if (s.execOverLevel) out.push(`mục tiêu trên ${s.execOverLevel} cấp chỉ mất ${Math.round((s.execOverHp || 0.5) * 100)}% máu`);
    // Cấm Chú Giải Phóng: sát thương tính theo NĂNG LƯỢNG đã đốt, không theo % sức mạnh
    if (s.type === 'manaburst') {
      out.push(`nổ ${s.radius || 300} · sát thương = năng lượng đốt × ${s.mpPower || 5.5}`);
      out.push(`đốt sạch MP · phong ấn hồi năng lượng ${s.lockSec || 10}s`);
    }
    // Vạn Pháp Quy Nhất: tung cả ba tuyệt kỹ chung, rồi tự phong ấn kỹ năng
    if (s.type === 'allin') {
      out.push(`tung Thiên Địa Chấn Động + Hư Không Tuyệt Trảm + Ý Chí Bất Diệt`);
      out.push(`nổ tổng hợp ${s.radius || 340} · phong ấn mọi kỹ năng ${s.lockSec || 60}s`);
    }
    // Thiết Bích Vĩnh Cửu: miễn nhiễm nhưng tấn công về 0 — cái giá phải hiện ngay cạnh hiệu ứng
    if (s.type === 'guard' && s.reduce >= 1) {
      out.push(`${s.duration || 15}s miễn nhiễm sát thương`);
      if (s.atkBuff <= -1) out.push('tấn công về 0 trong suốt thời gian đó');
    }
  // Tử Linh Dung Hợp: cộng dồn chỉ số của mỗi bóng ma trong bộ sưu tập
  if (s.type === 'fusion') {
    const F = G.FUSION || { hp: 0.1, mp: 0.05, sta: 0.05, def: 0.05 };
    out.push(`dung hợp bóng ma ${s.fusionSec || 60}s`
      + ` · mỗi bóng +${Math.round(F.hp * 100)}% HP, +${Math.round(F.mp * 100)}% MP, +${Math.round(F.sta * 100)}% thể lực, +${Math.round(F.def * 100)}% DEF`);
    out.push('bộ sưu tập mất trắng');
  }
    if (s.range) out.push(`tầm ${s.range}`);
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
    // Ô thứ 9: do trang bị cấp. Không gắn/gỡ được — mặc đồ thì có, tháo đồ thì mất.
    const gear = G.gearSkill(p);
    const gearCell = gear ? (() => {
      const sk = G.SKILLS[gear.id];
      return `<div class="sslot filled gear">
        <span class="k">${G.GEAR_SKILL_KEY}</span>
        <span class="ic">${sk.icon}</span><small>${esc(sk.name)}</small>
        <span class="muted" style="font-size:10px">cấp ${gear.level} · ${esc(G.ITEMS[gear.from].name)}</span>
      </div>`;
    })() : `<div class="sslot gear">
        <span class="k">${G.GEAR_SKILL_KEY}</span>
        <span class="ic ph">◇</span><small class="muted">Trang bị cấp</small>
      </div>`;
    const usedN = G.usedSkillSlots(p, false), capN = G.skillCap(p, false);
    const usedU = G.usedSkillSlots(p, true), capU = G.skillCap(p, true);
    return `<div class="sk-bar-card">
      <div class="sk-bar-head">
        <b>Thanh kỹ năng</b>
        <span class="sk-bar-cap">Thường <b>${usedN}/${capN}</b> · Tuyệt kỹ <b>${usedU}/${capU}</b></span>
      </div>
      <div class="skill-slots">${cells}${gearCell}</div>
      <div class="muted" style="font-size:11px;margin-top:6px">Ô <b>${G.GEAR_SKILL_KEY}</b> là kỹ năng do trang bị cấp: mặc món có kỹ năng riêng thì có, tháo ra thì mất. Không tốn điểm kỹ năng, không nâng cấp được.</div>
    </div>`;
  }

  // Một thẻ kỹ năng
  function skillCard(p, id) {
    const base = G.SKILLS[id];
    // TUYỆT PHẨM là trụ riêng: không cấp, không pips, không nút nâng, không "cấp tiếp theo".
    // Nó có thẻ riêng (superUltCard) — vào đây là lỗi dữ liệu, nên thoát sớm thay vì vẽ thẻ kỹ năng sai.
    if (base.superUlt) return superUltCard(p, id);
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

  // Thẻ TUYỆT PHẨM: bậc riêng, chỉ số CỐ ĐỊNH, cái giá hiện ngay cạnh hiệu ứng.
  // Không có pips, không "Cấp x/10", không nút nâng — vì không có gì để nâng.
  function superUltCard(p, id) {
    const base = G.SKILLS[id];
    const sk = G.skillAt(id, G.SUPER_ULT_LEVEL);
    const slotGroup = () => G.ultSlotsOf(p).map(i => {
      const on = p.skillSlots[i] === id;
      return `<button class="btn small slotbtn${on ? ' on' : ''}" data-act="set_skill" data-slot="${i}" data-skill="${id}" ${on ? 'disabled' : ''}>${slotLabel(i)}</button>`;
    }).join('');
    const costs = G.superUltCosts(base);
    return `<div class="sk-card is-ult is-superult">
      <div class="sk-card-ic">${base.icon}</div>
      <div class="sk-card-main">
        <div class="sk-card-title">
          <b>${esc(base.name)}</b>
          <span class="tag-superult">TUYỆT PHẨM</span>
        </div>
        <small class="sk-desc">${esc(base.desc)}</small>
        <div class="sk-nums">
          <span>${skillNumbers(sk)}</span>
          <span class="muted">${Math.round(sk.mp * App.stats.costMul)} năng lượng · hồi ${Math.round(sk.cd * 10) / 10}s</span>
        </div>
        ${costs.length ? `<div class="sk-cost">⚠ Cái giá: ${costs.map(esc).join(' · ')}</div>` : ''}
        <div class="sk-superult-meta">Chỉ số cố định · không nâng cấp · tối đa 2 lần mỗi 60 giây</div>
      </div>
      <div class="sk-card-act">
        <div class="sk-slots">${slotGroup()}</div>
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
    // TUYỆT PHẨM tách hẳn khỏi danh sách kỹ năng: nó là trụ riêng, không cấp, không ô học.
    const learned = all.filter(id => !G.SKILLS[id].superUlt && G.skillLevel(p, id) > 0);
    const schoolOrder = [...new Set(all.map(id => G.SKILLS[id].school))];
    const bySchool = (a, b) => schoolOrder.indexOf(G.SKILLS[a].school) - schoolOrder.indexOf(G.SKILLS[b].school) || G.SKILLS[a].level - G.SKILLS[b].level;
    const normals = learned.filter(id => !G.SKILLS[id].ult).sort(bySchool);
    const ults = learned.filter(id => G.SKILLS[id].ult).sort(bySchool);
    // TUYỆT PHẨM đã sở hữu — đọc từ trụ riêng, không từ p.skills.
    const supers = G.superUltsOf(p).sort((a, b) => G.SKILLS[a].level - G.SKILLS[b].level);

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
    // Trụ riêng: chỉ hiện khi đã sở hữu ít nhất một cái. Không có pips, không cấp, không nút nâng.
    const superHtml = supers.length ? `<div class="sk-section sk-section-superult">
      <div class="sk-section-h">Tuyệt Phẩm <small>bậc trên tuyệt kỹ · chỉ số cố định · gắn vào ô ${G.ultSlotsOf(p).map(slotLabel).join(' / ')}</small></div>
      ${supers.map(id => superUltCard(p, id)).join('')}</div>` : '';

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
      ${superHtml}
    </div>`];
  }

  Object.assign(UI._, { skillNumbers, slotLabel, panelSkills });
  Object.assign(UI._.PANELS, { skills: panelSkills });
})();
