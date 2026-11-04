'use strict';
/* Giao diện HTML phủ lên trên game: thanh máu, bảng túi đồ, cửa hàng, nhiệm vụ... */
const UI = (() => {
  const G = GameData;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(Math.floor(n)).toLocaleString('vi-VN');

  const skIcon = (id) => (G.SKILLS[id] && G.SKILLS[id].icon) || '✨';
  const MENU_TABS = [['bag', '🎒 Túi đồ'], ['char', '🥋 Nhân vật'], ['skills', '✨ Kỹ năng'], ['quest', '📜 Nhiệm vụ']];
  let lastMenuTab = 'bag';
  const SLOT_ICONS = { mu: '🎩', ao: '👘', gang_tay: '🧤', dai_lung: '🎗️', quan: '👖', giay: '👟', nhan: '💍', day_chuyen: '📿', ngoc_boi: '🧿' };
  const WEAPON_ICONS = { kiem: '🗡️', cung: '🏹', truong: '🪄' };
  const statText = (k, v) => `${G.statLabel(k)} +${v}${G.statUnit(k)}`;
  const qOf = (e) => (G.ITEMS[e.id] && G.ITEMS[e.id].slot ? (e.q || 1) : 1);
  const NPC_ICONS = { lao_su: '🧑‍💼', tho_ren: '⚒️', ba_thuoc: '⚗️', tap_hoa: '🏪', thu_kho: '📦', lu_khach: '🧙', he_thong: '💠', vy: '🗡️', bang_nv: '📋' };

  // Trên điện thoại, đổi lời nhắc phím bấm thành nút tương ứng
  const isTouch = () => document.body.classList.contains('touch');
  function keyText(s) {
    if (!isTouch()) return s;
    return String(s)
      .replace(/\(Phím J để đánh[^)]*\)/, '(Kéo cần điều khiển bên trái để di chuyển, kéo lên hoặc bấm ⤒ để nhảy, bấm ⚔ để đánh.)')
      .replace(/phím I\b/g, 'nút ☰')
      .replace(/phím Q\b/g, 'nút 🧪')
      .replace(/phím K\b/g, 'nút ☰ → Kỹ năng')
      .replace(/phím C\b/g, 'nút ☰ → Nhân vật');
  }

  function itemIcon(id) {
    const d = G.ITEMS[id];
    if (!d) return '?';
    if (d.kind === 'weapon') return WEAPON_ICONS[d.wtype];
    if (d.kind === 'armor') return SLOT_ICONS[d.slot];
    if (id.startsWith('binh_mau')) return '🧪';
    if (id.startsWith('binh_nl')) return '💧';
    if (id === 'da_cuong_hoa') return '💎';
    if (id === 'manh_vai_den') return '🏴';
    if (id.startsWith('manh_an')) return '🔷';
    if (id === 'sach_ky_nang') return '📘';
    if (id === 'tinh_the_xanh') return '💠';
    if (id === 'loi_nang_luong') return '🔶';
    return '📦';
  }

  // ------------------------------------------------------------ HUD
  let panel = null;       // { name, ctx }
  let selected = null;    // { where: 'bag'|'equip'|'storage', key }
  let lastTick = 0;

  function refresh() {
    const p = App.player;
    if (!p) return;
    const st = App.stats;
    $('h-name').textContent = p.name;
    $('h-level').textContent = 'Cấp ' + p.level;
    const sc = p.school && G.SCHOOLS[p.school];
    $('h-school').textContent = (sc ? sc.name : 'Chưa thức tỉnh') + ' · Hạng ' + G.rankOf(p.level);
    $('h-rank').textContent = G.rankOf(p.level);
    $('h-ava').textContent = sc ? sc.icon : '👤';
    document.documentElement.style.setProperty('--accent', sc ? '#' + sc.color.toString(16).padStart(6, '0') : '#3fd0ff');
    $('h-gold').textContent = fmt(p.gold) + ' xu';
    const need = G.expToNext(p.level);
    const ep = p.level >= G.MAX_LEVEL ? 100 : (p.exp / need) * 100;
    $('h-exp').style.width = ep + '%';
    $('h-exp-t').textContent = p.level >= G.MAX_LEVEL ? 'Cấp tối đa' : `${ep.toFixed(1)}%`;
    const badge = $('h-points');
    const pts = (p.freePoints || 0) + (p.skillPoints || 0);
    badge.textContent = pts;
    badge.classList.toggle('hidden', !pts);
    const tn = p.school === 'toan_nang';
    document.querySelectorAll('.sk-extra, .tb-s4').forEach(el => el.classList.toggle('hidden', !tn));

    // thanh kỹ năng
    document.querySelectorAll('#skillbar .sk').forEach(el => {
      const k = el.dataset.k;
      if (!/^\d$/.test(k)) return;
      const id = p.skillSlots[Number(k)];
      const ico = el.querySelector('.ico');
      if (id) {
        const sk = G.skillAt(id, G.skillLevel(p, id));
        ico.innerHTML = `${skIcon(id)}<small>${esc(sk.name.split(' ')[0])}</small>`;
        el.title = `${sk.name} cấp ${sk.lv} (${Math.round(sk.mp * st.costMul)} năng lượng)`;
        el.classList.remove('empty');
      } else { ico.innerHTML = Number(k) === G.ULT_SLOT ? '★' : '·'; el.title = 'Trống'; el.classList.add('empty'); }
    });
    // nút kỹ năng cảm ứng
    for (const [cls, i] of [['tb-s0', 0], ['tb-s1', 1], ['tb-s2', 2], ['tb-s3', 3], ['tb-s4', 4], ['tb-ult', G.ULT_SLOT]]) {
      const el = document.querySelector(`#touch .${cls}`);
      const id = p.skillSlots[i];
      const ico = el.querySelector('.ico');
      if (id) {
        ico.innerHTML = `${skIcon(id)}<small>${esc(G.SKILLS[id].name.split(' ').pop())}</small>`;
        el.classList.remove('empty');
      } else { ico.textContent = i === G.ULT_SLOT ? '★' : i + 1; el.classList.add('empty'); }
    }
    const cnt = (ids) => p.bag.filter(e => ids.includes(e.id)).reduce((s, e) => s + e.qty, 0);
    $('pot-hp').textContent = $('tpot-hp').textContent = cnt(['binh_mau_nho', 'binh_mau_vua']);
    $('pot-mp').textContent = $('tpot-mp').textContent = cnt(['binh_nl_nho', 'binh_nl_vua']);

    renderQuestTrack();
    if (App.scene && App.scene.player) { App.scene.updateWeaponLook(); App.scene.refreshNpcMarks(); }
    if (panel) renderPanel();
  }

  function tick(time, scene) {
    if (time - lastTick < 80) return;
    lastTick = time;
    const st = App.stats;
    $('h-hp').style.width = Math.max(0, App.hp / st.maxHp * 100) + '%';
    $('h-hp-t').textContent = `${fmt(Math.max(0, App.hp))} / ${fmt(st.maxHp)}`;
    $('h-mp').style.width = Math.max(0, App.mp / st.maxMp * 100) + '%';
    $('h-mp-t').textContent = `${fmt(App.mp)} / ${fmt(st.maxMp)}`;
    const len = scene.cooldownLen || {};
    const p = App.player;
    for (let i = 0; i < G.SKILL_SLOTS; i++) {
      const id = p.skillSlots[i];
      const left = id ? (scene.cooldowns[id] || 0) - time : 0;
      const h = left > 0 ? (left / (len[id] || 1) * 100) + '%' : '0';
      const noMp = !!id && App.mp < Math.round(G.skillAt(id, G.skillLevel(p, id)).mp * st.costMul);
      const touchCls = i === G.ULT_SLOT ? 'tb-ult' : 'tb-s' + i;
      for (const el of [document.querySelector(`#skillbar .sk[data-k="${i}"]`), document.querySelector(`#touch .${touchCls}`)]) {
        if (!el) continue;
        el.querySelector('.cd').style.height = h;
        el.classList.toggle('nomp', noMp);
      }
    }
  }

  function log(text, color = '#e0e0e0') {
    const box = $('log');
    const d = document.createElement('div');
    d.textContent = keyText(text);
    d.style.color = color;
    box.appendChild(d);
    while (box.children.length > 7) box.removeChild(box.firstChild);
    setTimeout(() => d.classList.add('old'), 7000);
    setTimeout(() => d.remove(), 8200);
  }

  let bannerTimer = null;
  function banner(text, ms = 1500) {
    const b = $('banner');
    b.textContent = text;
    b.classList.remove('hidden');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.add('hidden'), ms);
  }

  function hint(text, npcName = '') {
    const h = $('hint');
    if (h.textContent !== text) h.textContent = text;
    const t = $('tb-talk');
    const show = !!npcName && !App.panelOpen;
    if (t.classList.contains('hidden') === show) t.classList.toggle('hidden', !show);
    if (show && t.lastChild.textContent !== npcName) t.lastChild.textContent = npcName;
  }
  function setMap(name) { $('h-map').textContent = name; }
  function setAttackIcon(ico) { $('sk-atk-ico').textContent = ico; $('tb-atk-ico').textContent = ico; }

  // ------------------------------------------------------------ Nhiệm vụ
  function questLines(p) {
    const q = G.QUESTS[p.quest.step];
    if (!q || p.quest.state !== 'active') return [];
    const pr = p.quest.progress, o = q.obj, out = [];
    if (o.kill) for (const m in o.kill) { const c = pr.kill?.[m] || 0; out.push([`${G.MONSTERS[m].name}: ${c}/${o.kill[m]}`, c >= o.kill[m]]); }
    if (o.collect) for (const it in o.collect) {
      const c = Math.min(o.collect[it], p.bag.filter(e => e.id === it).reduce((s, e) => s + e.qty, 0));
      out.push([`${G.ITEMS[it].name}: ${c}/${o.collect[it]}`, c >= o.collect[it]]);
    }
    if (o.visit) for (const n of o.visit) out.push([`Gặp ${G.NPCS[n].name}`, !!pr.visit?.[n]]);
    if (o.level) out.push([`Đạt cấp ${o.level} (${Math.min(p.level, o.level)}/${o.level})`, p.level >= o.level]);
    if (o.school) out.push(['Thức tỉnh class ở Hội trưởng Khải', !!p.school]);
    return out;
  }
  function questReady() {
    const p = App.player;
    return p.quest.state === 'active' && questLines(p).every(l => l[1]);
  }

  function renderQuestTrack() {
    const p = App.player;
    const q = G.QUESTS[p.quest.step];
    const el = $('quest-track');
    if (!q) { el.innerHTML = '<b>Cốt truyện</b>Đã hoàn thành chương 1.' + dailyTrack(); return; }
    if (p.quest.state === 'none') { el.innerHTML = `<b>${esc(q.name)}</b>Gặp ${esc(G.NPCS[q.npc].name)} để nhận nhiệm vụ.` + dailyTrack(); return; }
    const lines = questLines(p);
    el.innerHTML = `<b>${esc(q.name)}</b>` + lines.map(([t, ok]) => `<div class="${ok ? 'done' : ''}">${ok ? '✓' : '•'} ${esc(t)}</div>`).join('') +
      (questReady() ? `<div class="done">→ Gặp ${esc(G.NPCS[q.npc].name)} để trả nhiệm vụ</div>` : '') + dailyTrack();
  }

  // ------------------------------------------------------------ Nhiệm vụ hằng ngày
  function dailyLines(p) {
    const d = p.daily;
    if (!d || !d.list || !d.list.length) return [];
    return d.list.map((x, i) => {
      const mon = G.MONSTERS[x.target], it = G.ITEMS[x.target];
      const have = x.type === 'collect' ? Math.min(x.need, p.bag.filter(e => e.id === x.target).reduce((a, e) => a + e.qty, 0)) : Math.min(x.have, x.need);
      const text = x.type === 'kill' ? `Hạ ${x.need} ${mon.name}` : x.type === 'boss' ? `Hạ trùm ${mon.name}` : `Thu thập ${x.need} ${it.name}`;
      return { i, x, have, done: have >= x.need, text, icon: x.type === 'boss' ? '👑' : x.type === 'collect' ? '🔶' : '⚔️' };
    });
  }
  function dailyTrack() {
    const lines = dailyLines(App.player).filter(l => !l.x.claimed);
    if (!lines.length) return '';
    return '<div class="daily-track">' + lines.map(l => `<div class="${l.done ? 'done' : ''}">${l.icon} ${esc(l.text)} ${l.have}/${l.x.need}</div>`).join('') + '</div>';
  }
  function resetIn() {
    const now = Date.now(), vn = now + 7 * 3600 * 1000;
    const left = 86400000 - (vn % 86400000);
    const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000);
    return `${h} giờ ${m} phút`;
  }
  function panelDaily() {
    const p = App.player;
    const lines = dailyLines(p);
    if (!lines.length) return ['Bảng nhiệm vụ', '<p>Chưa có nhiệm vụ cho bạn. Hãy hoàn thành nhiệm vụ <b>Cổng đỏ</b> của Hội trưởng Khải để được vào cổng.</p>'];
    const r = G.dailyReward(p.level);
    let html = `<p class="muted" style="margin-top:0">Mỗi ngày 3 nhiệm vụ mới. Làm mới sau <b>${resetIn()}</b>.</p><div class="list">`;
    for (const l of lines) {
      const mul = l.x.type === 'boss' ? 2 : 1;
      const btn = l.x.claimed ? '<span class="okc">✓ Đã nhận</span>'
        : `<button class="btn small ${l.done ? 'primary' : ''}" data-act="daily_claim" data-i="${l.i}" ${l.done ? '' : 'disabled'}>Nhận thưởng</button>`;
      html += `<div class="li"><div class="ic">${l.icon}</div><div class="main"><b>${esc(l.text)}</b>
        <small>Tiến độ: <b class="${l.done ? 'okc' : ''}">${l.have}/${l.x.need}</b>${l.x.type === 'collect' ? ' · rơi từ quái trong cổng' : ''}</small>
        <small class="gold">Thưởng: ${fmt(r.exp * mul)} kinh nghiệm, ${fmt(r.gold * mul)} xu, ${r.stones * mul} đá cường hóa</small></div>${btn}</div>`;
    }
    html += '</div>';
    const all = lines.every(l => l.x.claimed);
    const b = G.DAILY_BONUS;
    html += `<div class="detail" style="margin-top:10px"><b>🎁 Thưởng hoàn thành cả 3:</b> ${b.stones} đá cường hóa${b.items.map(([id, n]) => ', ' + G.ITEMS[id].name + (n > 1 ? ' ×' + n : '')).join('')}
      <div class="row" style="margin-top:8px">${p.daily.bonus ? '<span class="okc">✓ Đã nhận hôm nay</span>'
        : `<button class="btn ${all ? 'primary' : ''}" data-act="daily_bonus" ${all ? '' : 'disabled'}>Nhận thưởng thêm</button>`}</div></div>`;
    return ['Bảng nhiệm vụ', html];
  }

  // ------------------------------------------------------------ Bảng
  function openPanel(name, ctx = {}) {
    if (panel && panel.name === name && !ctx.force) { closePanel(); return; }
    if (MENU_TABS.some(([k]) => k === name)) lastMenuTab = name;
    panel = { name, ctx };
    if (!ctx.keepSel) selected = null;
    App.panelOpen = true;
    document.body.classList.add('panel-open');
    App.keys = {};
    App.touch = {};
    $('panel').classList.remove('hidden');
    renderPanel();
  }
  function closePanel() {
    panel = null; selected = null; App.panelOpen = false;
    document.body.classList.remove('panel-open');
    $('panel').classList.add('hidden');
    hideTip();
  }

  function renderPanel() {
    if (!panel) return;
    const fns = { bag: panelBag, char: panelChar, skills: panelSkills, quest: panelQuest, npc: panelNpc,
      shop: panelShop, smith: panelSmith, storage: panelStorage, school: panelSchool, story: panelStory, code: panelCode, daily: panelDaily };
    const [title, html0] = fns[panel.name](panel.ctx);
    let html = html0;
    if (MENU_TABS.some(([k]) => k === panel.name)) {
      const p = App.player;
      const count = { char: p.freePoints || 0, skills: p.skillPoints || 0 };
      html = '<div class="tabs">' + MENU_TABS.map(([k, n]) =>
        `<button class="btn tab ${panel.name === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${n}${count[k] ? ` <b class="tabcount">${count[k]}</b>` : ''}</button>`).join('') + '</div>' + html;
    }
    // Bảng có nhiều tab (menu, thợ rèn) giữ cố định kích cỡ, chuyển tab không bị co giãn
    const fixed = MENU_TABS.some(([k]) => k === panel.name) || panel.name === 'smith';
    document.querySelector('.panel-box').classList.toggle('fixed', fixed);
    $('panel-title').textContent = title;
    const body = $('panel-body');
    const scroll = panel.lastName === panel.name ? body.scrollTop : 0;
    panel.lastName = panel.name;
    body.innerHTML = html;
    body.scrollTop = scroll;
  }

  function act(type, params) { return Net.action(type, params); }

  // ---------- Ô vật phẩm
  function cellHtml(entry, attrs, label) {
    if (!entry) return `<div class="cell empty">${label ? `<span class="lbl">${esc(label)}</span>` : ''}</div>`;
    const q = qOf(entry);
    const isSel = selected && attrs.includes(`data-sel="${selected.where}:${selected.key}"`);
    return `<div class="cell qb${q}${isSel ? ' sel' : ''}" ${attrs}>${itemIcon(entry.id)}` +
      (entry.plus ? `<span class="pl">+${entry.plus}</span>` : '') +
      (entry.qty > 1 ? `<span class="n">${entry.qty}</span>` : '') +
      (label ? `<span class="lbl">${esc(label)}</span>` : '') + '</div>';
  }

  function itemInfo(entry, opts = {}) {
    const d = G.ITEMS[entry.id];
    const p = App.player;
    const q = qOf(entry);
    let h = `<h3 class="q${q}">${itemIcon(entry.id)} ${esc(d.name)}${entry.plus ? ' +' + entry.plus : ''}</h3>`;
    const tags = [];
    if (d.slot) tags.push(`<span class="q${q}">${G.QUALITY_NAMES[q]}</span>`, G.SLOT_NAMES[d.slot]);
    if (d.level) tags.push(`<span class="${d.level > p.level ? 'bad' : ''}">Cấp ${d.level}</span>`);
    const set = G.setOfItem(d);
    if (set) tags.push(`<span class="muted">Bộ ${set.name} (cấp ${set.min}–${set.max})</span>`);
    if (d.school) tags.push(`<span class="${G.canUseItem({ ...p, level: 99 }, d) ? '' : 'bad'}">${G.SCHOOLS[d.school].name}</span>`);
    if (tags.length) h += `<div class="muted">${tags.join(' · ')}</div>`;
    if (d.slot) {
      const s = G.instStats(entry);
      h += '<div class="stats">' + Object.keys(s.main).map(k => `${G.statLabel(k)} <b>+${s.main[k]}${G.statUnit(k)}</b>`).join(' · ') + '</div>';
      if (entry.aff && entry.aff.length) {
        h += '<div class="affix">' + entry.aff.map(([k, v, pp]) =>
          `<div>◆ ${statText(k, v)} <span class="muted">${pp >= 0.8 ? '★' : ''}</span></div>`).join('') + '</div>';
      }
      const pf = G.perfection(entry);
      h += `<div class="perf">Độ hoàn hảo: <b class="${pf >= 80 ? 'q4' : pf >= 50 ? 'okc' : 'muted'}">${pf}%</b></div>`;
      // So sánh với món đang mặc cùng ô
      const cur = p.equip[d.slot];
      if (opts.compare && cur && cur.uid !== entry.uid) {
        const a = G.instStats(entry).all, b = G.instStats(cur).all;
        const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
        const diffs = keys.map(k => [k, Math.round(((a[k] || 0) - (b[k] || 0)) * 10) / 10]).filter(([, v]) => v);
        h += `<div class="cmp"><span class="muted">So với ${esc(G.ITEMS[cur.id].name)}${cur.plus ? ' +' + cur.plus : ''} đang mặc:</span> ` +
          (diffs.length ? diffs.map(([k, v]) => `<span class="${v > 0 ? 'up' : 'down'}">${G.statLabel(k)} ${v > 0 ? '+' : ''}${v}${G.statUnit(k)} ${v > 0 ? '▲' : '▼'}</span>`).join(' ') : 'như nhau') + '</div>';
      } else if (opts.compare && !cur) h += '<div class="cmp up">Ô này đang trống ▲</div>';
    }
    if (d.desc) h += `<div class="muted">${esc(d.desc)}</div>`;
    if (opts.sell && G.sellPrice(entry)) h += `<div class="gold">Bán được: ${fmt(G.sellPrice(entry))} xu / cái</div>`;
    return h;
  }

  function shopHere() {
    const m = G.MAPS[App.player.map];
    return Object.values(m.npcs).some(n => G.NPCS[n].shop);
  }

  // ---------- Túi đồ
  function panelBag() {
    const p = App.player;
    let eq = '<div class="equip-grid">';
    for (const s of G.SLOTS) eq += cellHtml(p.equip[s], `data-sel="equip:${s}"`, G.SLOT_NAMES[s]);
    eq += '</div>';
    let grid = '<div class="grid">';
    for (let i = 0; i < G.BAG_SIZE; i++) {
      const e = p.bag[i];
      grid += cellHtml(e, e ? `data-sel="bag:${e.uid}" data-tip="${e.uid}"` : '');
    }
    grid += '</div>';
    let detail = '<div class="detail muted">Chọn một vật phẩm để xem.</div>';
    const sel = selectedEntry();
    if (sel) {
      const { entry, where } = sel;
      const d = G.ITEMS[entry.id];
      let btns = '';
      if (where === 'bag') {
        if (d.slot) btns += `<button class="btn primary" data-act="equip" data-uid="${entry.uid}">Trang bị</button>`;
        if (d.kind === 'potion') btns += `<button class="btn primary" data-act="use" data-item="${entry.id}">Dùng</button>`;
        if (shopHere() && d.price && d.kind !== 'quest') btns += `<button class="btn" data-act="sell" data-uid="${entry.uid}" data-qty="1">Bán 1</button>`;
        if (shopHere() && d.price && d.kind !== 'quest' && entry.qty > 1) btns += `<button class="btn" data-act="sell" data-uid="${entry.uid}" data-qty="${entry.qty}">Bán hết</button>`;
      } else btns += `<button class="btn" data-act="unequip" data-slot="${sel.key}">Tháo ra</button>`;
      detail = `<div class="detail">${itemInfo(entry, { sell: where === 'bag' && shopHere(), compare: where === 'bag' })}<div class="row" style="margin-top:8px">${btns}</div></div>`;
    }
    return [`Túi đồ (${p.bag.length}/${G.BAG_SIZE})`,
      `<div class="inv"><div>${eq}</div><div>${grid}</div><div class="inv-detail">${detail}
       <p class="muted" style="margin:10px 0 0;font-size:12px">${shopHere() ? 'Đang ở làng: có thể bán đồ trực tiếp từ túi.' : 'Về làng để bán đồ.'}</p></div></div>`];
  }

  function selectedEntry() {
    if (!selected) return null;
    const p = App.player;
    if (selected.where === 'equip') { const e = p.equip[selected.key]; return e ? { entry: { ...e, qty: 1 }, where: 'equip', key: selected.key } : null; }
    const list = selected.where === 'bag' ? p.bag : p.storage;
    const e = list.find(x => x.uid === Number(selected.key));
    return e ? { entry: e, where: selected.where, key: e.uid } : null;
  }

  // ---------- Nhân vật
  function panelChar() {
    const p = App.player, st = App.stats;
    const need = G.expToNext(p.level);
    const rows = [
      ['Cấp', p.level], ['Kinh nghiệm', p.level >= G.MAX_LEVEL ? 'Tối đa' : `${fmt(p.exp)} / ${fmt(need)}`],
      ['Class', p.school ? G.SCHOOLS[p.school].name : '—'],
      ['Máu', fmt(st.maxHp)], ['Năng lượng', fmt(st.maxMp)], ['Tấn công', fmt(st.atk)], ['Phòng thủ', fmt(st.def)],
      ['Chí mạng', st.crit + '%'], ['Sức mạnh kỹ năng', Math.round(st.skillMul * 100) + '%'], ['Tốc độ chạy', Math.round(st.speed)],
      ['Điểm kỹ năng', p.skillPoints || 0],
      ['Đã hạ quái', fmt(Object.values(p.kills).reduce((a, b) => a + b, 0))],
    ];
    const pts = [
      ['str', 'Sức mạnh', '+2 tấn công'], ['vit', 'Thể lực', '+10 máu, +0.8 phòng thủ'],
      ['agi', 'Nhanh nhẹn', '+0.4% chí mạng, chạy nhanh hơn'], ['spi', 'Tinh thần', '+6 năng lượng, +1.5% sức mạnh kỹ năng'],
    ];
    const left = '<table class="stat-table">' + rows.map(([a, b]) => `<tr><td class="muted">${a}</td><td>${esc(b)}</td></tr>`).join('') + '</table>';
    const right = `<p>Điểm tiềm năng còn lại: <b class="gold">${p.freePoints}</b></p><div class="list">` +
      pts.map(([k, n, d]) => `<div class="li"><div class="main"><b>${n}: ${p.points[k]}</b><small>${d}</small></div>
        <button class="btn small" data-act="add_stat" data-stat="${k}" data-n="1" ${p.freePoints ? '' : 'disabled'}>+1</button>
        <button class="btn small" data-act="add_stat" data-stat="${k}" data-n="5" ${p.freePoints >= 5 ? '' : 'disabled'}>+5</button></div>`).join('') +
      '</div>' + (p.school ? `<p class="muted" style="font-size:12px">${esc(G.SCHOOLS[p.school].desc)}</p>` : '');
    const snd = `<div class="row" style="margin-top:12px"><button class="btn" data-act="toggle_sfx">${Sound.settings.sfx ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt'}</button><button class="btn" data-act="toggle_music">${Sound.settings.music ? '🎵 Nhạc nền: Bật' : '🎵 Nhạc nền: Tắt'}</button></div>`;
    const sys = snd + `<div class="row" style="margin-top:8px">${isTouch() ? '<button class="btn" data-act="fullscreen">⛶ Toàn màn hình</button>' : ''}<button class="btn" data-act="logout">⏻ Đăng xuất</button></div>`;
    return ['Nhân vật: ' + p.name, `<div class="cols"><div>${left}${sys}</div><div>${right}</div></div>`];
  }

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
    const ids = G.availableSkills(p).sort((a, b) => (G.SKILLS[a].school === G.SKILLS[b].school ? G.SKILLS[a].level - G.SKILLS[b].level : 0));
    for (const id of ids) {
      const base = G.SKILLS[id];
      if (tn && base.school !== lastSchool) {
        html += `<div class="muted" style="margin-top:6px;font-size:12px">— ${G.SCHOOLS[base.school].icon} ${G.SCHOOLS[base.school].name} —</div>`;
        lastSchool = base.school;
      }
      const lv = G.skillLevel(p, id);
      const locked = base.level > p.level;
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
          <span class="lvl">${locked ? `🔒 Mở ở cấp ${base.level}` : lv ? `Cấp ${lv}/${G.SKILL_MAX}` : 'Chưa học'}</span>
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

  // ---------- Nhiệm vụ
  function panelQuest() {
    const p = App.player;
    const q = G.QUESTS[p.quest.step];
    const doneList = G.QUESTS.slice(0, p.quest.step).map(x => `<div class="okc">✓ ${esc(x.name)}</div>`).join('');
    if (!q) return ['Nhiệm vụ', `<p>Bạn đã hoàn thành chương 1. Hãy chờ chương tiếp theo!</p>${dailyLines(p).map(l => `<div>${l.icon} ${esc(l.text)} ${l.have}/${l.x.need}${l.x.claimed ? ' ✓' : ''}</div>`).join('')}<hr style="border-color:#333">${doneList}`];
    let html = `<h3 class="gold" style="margin:0 0 6px">${esc(q.name)}</h3>`;
    if (p.quest.state === 'none') html += `<p>Gặp <b>${esc(G.NPCS[q.npc].name)}</b> để nhận nhiệm vụ.</p>`;
    else {
      html += q.start.map(l => `<p class="muted" style="margin:0 0 4px">${esc(keyText(l))}</p>`).join('');
      html += '<div style="margin:10px 0">' + questLines(p).map(([t, ok]) => `<div class="${ok ? 'okc' : ''}">${ok ? '✓' : '•'} ${esc(t)}</div>`).join('') + '</div>';
      const r = q.reward;
      html += `<p>Phần thưởng: ${fmt(r.exp)} kinh nghiệm, ${fmt(r.gold)} xu${r.items.map(([id, n]) => ', ' + G.ITEMS[id].name + (n > 1 ? ' ×' + n : '')).join('')}${r.schoolWeapon ? ', vũ khí class' : ''}</p>`;
    }
    const dl = dailyLines(p);
    if (dl.length) {
      html += `<hr style="border-color:#333"><div class="muted">Nhiệm vụ hằng ngày (nhận thưởng ở Bảng nhiệm vụ, làm mới sau ${resetIn()}):</div>` +
        dl.map(l => `<div class="${l.x.claimed || l.done ? 'okc' : ''}">${l.x.claimed ? '✓' : l.icon} ${esc(l.text)} ${l.have}/${l.x.need}${l.x.claimed ? ' (đã nhận)' : ''}</div>`).join('');
    }
    if (doneList) html += `<hr style="border-color:#333"><div class="muted">Đã hoàn thành:</div>${doneList}`;
    return ['Nhiệm vụ', html];
  }

  // ---------- NPC
  function openNpc(id) { openPanel('npc', { id, force: true }); }

  function panelNpc({ id, say }) {
    const n = G.NPCS[id], p = App.player;
    const q = G.QUESTS[p.quest.step];
    const opts = [];
    if (q && q.npc === id) {
      if (p.quest.state === 'none') opts.push(`<button class="btn" data-act="quest_view">❗ Nhiệm vụ: ${esc(q.name)}</button>`);
      else if (questReady()) opts.push(`<button class="btn primary" data-act="quest_complete">✔ Trả nhiệm vụ: ${esc(q.name)}</button>`);
      else opts.push(`<button class="btn" data-act="open" data-panel="quest">… Đang làm: ${esc(q.name)}</button>`);
    }
    if (id === 'lao_su' && !p.school && q && q.id === 'q6' && p.quest.state === 'active') {
      opts.push(`<button class="btn ${p.level >= 5 ? 'primary' : ''}" data-act="open" data-panel="school" ${p.level >= 5 ? '' : 'disabled'}>✨ Thức tỉnh class${p.level >= 5 ? '' : ' (cần cấp 5)'}</button>`);
    }
    if (id === 'lao_su' && p.school && Object.keys(p.skills || {}).length) {
      opts.push(`<button class="btn" data-act="reset_skills">♻️ Tẩy điểm kỹ năng (${fmt(100 * p.level)} xu)</button>`);
    }
    if (n.role === 'daily') opts.push('<button class="btn primary" data-act="open" data-panel="daily">📋 Xem nhiệm vụ hằng ngày</button>');
    if (n.role === 'mystic') {
      opts.push('<button class="btn" data-act="open" data-panel="code">🔑 Nói mật mã</button>');
      for (const [sid, sc] of Object.entries(G.SCHOOLS)) {
        if (!sc.special || !p.unlocks[sid] || p.school === sid) continue;
        opts.push(`<button class="btn ${p.level >= 5 ? 'primary' : ''}" data-act="awaken_pick" data-school="${sid}" ${p.level >= 5 ? '' : 'disabled'}>${sc.icon} Thức tỉnh ${esc(sc.name)}${p.level >= 5 ? '' : ' (cần cấp 5)'}</button>`);
      }
    }
    if (n.shop) opts.push(`<button class="btn" data-act="open" data-panel="shop" data-npc="${id}">🛒 Mua bán</button>`);
    if (n.role === 'smith') opts.push('<button class="btn" data-act="open" data-panel="smith">⚒️ Nâng cấp trang bị</button>');
    if (n.role === 'storage') opts.push('<button class="btn" data-act="open" data-panel="storage">📦 Gửi / lấy đồ</button>');
    opts.push('<button class="btn" data-act="close">Tạm biệt</button>');
    const text = (say || [n.greet]).map(l => `<p>${esc(l)}</p>`).join('');
    return [n.name, `<div class="dialog"><div class="face">${NPC_ICONS[id] || '🙂'}</div><div class="text" style="flex:1">${text}<div class="opts">${opts.join('')}</div></div></div>`];
  }

  function panelStory({ id, lines, button }) {
    const n = G.NPCS[id];
    return [n.name, `<div class="dialog"><div class="face">${NPC_ICONS[id] || '🙂'}</div><div class="text" style="flex:1">` +
      lines.map(l => `<p class="${l.startsWith('[Hệ thống]') ? 'sysline' : ''}">${esc(keyText(l))}</p>`).join('') + `<div class="opts">${button}</div></div></div>`];
  }

  // ---------- Cửa hàng
  function panelShop({ npc }) {
    const n = G.NPCS[npc], p = App.player;
    let html = `<p>Xu của bạn: <b class="gold">${fmt(p.gold)}</b></p><div class="cols"><div><h3 style="margin:0 0 8px">Mua</h3>`;
    // Hàng bán được gom theo bộ trang bị để thấy rõ mỗi bộ dùng cho 10 cấp nào
    const groups = [];
    for (const id of n.shop) {
      const set = G.setOfItem(G.ITEMS[id]);
      const key = set ? 'set' + set.id : 'misc';
      let gr = groups.find(g => g.key === key);
      if (!gr) groups.push(gr = { key, set, items: [] });
      gr.items.push(id);
    }
    for (const gr of groups) {
      html += `<div class="muted" style="margin:8px 0 6px;font-size:12px">` +
        (gr.set ? `Bộ ${gr.set.name} · cấp ${gr.set.min}–${gr.set.max}` : 'Thuốc và nguyên liệu') + '</div><div class="list">';
      for (const id of gr.items) {
        const d = G.ITEMS[id];
        const can = p.gold >= d.price;
        const qtyBtns = d.stack
          ? [1, 5, 10].map(q => `<button class="btn small" data-act="buy" data-npc="${npc}" data-item="${id}" data-qty="${q}" ${p.gold >= d.price * q ? '' : 'disabled'}>×${q}</button>`).join(' ')
          : `<button class="btn small" data-act="buy" data-npc="${npc}" data-item="${id}" data-qty="1" ${can ? '' : 'disabled'}>Mua</button>`;
        const st = d.stats ? Object.entries(d.stats).map(([k, v]) => statText(k, v)).join(', ') : (d.desc || '');
        html += `<div class="li"><div class="ic">${itemIcon(id)}</div><div class="main"><b>${d.level && d.level > p.level ? `<span class="bad">${esc(d.name)}</span>` : esc(d.name)}</b>
          <small>${d.level ? 'Cấp ' + d.level + ' · ' : ''}${d.school ? G.SCHOOLS[d.school].name + ' · ' : ''}${esc(st)}</small>
          <small class="gold">${fmt(d.price)} xu</small></div><div class="row">${qtyBtns}</div></div>`;
      }
      html += '</div>';
    }
    html += `</div><div><h3 style="margin:0 0 8px">Bán</h3><div class="list">`;
    const sellable = p.bag.filter(e => G.ITEMS[e.id].price && G.ITEMS[e.id].kind !== 'quest');
    if (!sellable.length) html += '<p class="muted">Không có gì để bán.</p>';
    for (const e of sellable) {
      const d = G.ITEMS[e.id];
      const price = G.sellPrice(e);
      html += `<div class="li"><div class="ic">${itemIcon(e.id)}</div><div class="main"><b class="q${qOf(e)}">${esc(d.name)}${e.plus ? ' +' + e.plus : ''}${e.qty > 1 ? ' ×' + e.qty : ''}</b>
        <small class="gold">${fmt(price)} xu / cái</small></div>
        <button class="btn small" data-act="sell" data-uid="${e.uid}" data-qty="1">Bán 1</button>
        ${e.qty > 1 ? `<button class="btn small" data-act="sell" data-uid="${e.uid}" data-qty="${e.qty}">Hết</button>` : ''}</div>`;
    }
    html += '</div></div></div>';
    return [n.name, html];
  }

  // ---------- Thợ rèn: nâng cấp, tẩy luyện, phân rã
  let lastUpgrade = null;
  let smithTab = 'upgrade';
  let confirmSalvage = null;
  function panelSmith() {
    const p = App.player;
    const stones = p.bag.filter(e => e.id === 'da_cuong_hoa').reduce((s, e) => s + e.qty, 0);
    const items = [];
    if (smithTab !== 'salvage') for (const s of G.SLOTS) if (p.equip[s]) items.push({ where: 'equip', key: s, entry: p.equip[s], tag: 'Đang mặc' });
    for (const e of p.bag) if (G.ITEMS[e.id].slot) items.push({ where: 'bag', key: e.uid, entry: e, tag: 'Trong túi' });
    const tabs = [['upgrade', '⚒️ Nâng cấp'], ['reforge', '🔮 Tẩy luyện'], ['salvage', '♻️ Phân rã']]
      .map(([k, n]) => `<button class="btn small ${smithTab === k ? 'primary' : ''}" data-act="smith_tab" data-tab="${k}">${n}</button>`).join(' ');
    let html = `<div class="row" style="margin-bottom:8px">${tabs}<span style="margin-left:auto">🪙 <b class="gold">${fmt(p.gold)}</b> · 💎 <b>${stones}</b></span></div><div class="cols"><div class="list">`;
    if (!items.length) html += '<p class="muted">Không có trang bị nào.</p>';
    for (const it of items) {
      const d = G.ITEMS[it.entry.id];
      const sel = selected && selected.where === it.where && String(selected.key) === String(it.key);
      const q = qOf(it.entry);
      html += `<div class="li ${sel ? 'sel' : ''}" data-sel="${it.where}:${it.key}" style="cursor:pointer"><div class="ic">${itemIcon(it.entry.id)}</div>
        <div class="main"><b class="q${q}">${esc(d.name)} ${it.entry.plus ? '+' + it.entry.plus : ''}</b><small>${it.tag} · ${G.QUALITY_NAMES[q]} · ${G.perfection(it.entry)}%</small></div></div>`;
    }
    html += '</div><div>';
    const sel = selectedEntry();
    if (!sel || !G.ITEMS[sel.entry.id].slot || (smithTab === 'salvage' && sel.where !== 'bag')) {
      const tip = {
        upgrade: 'Chọn trang bị bên trái để nâng cấp. Mỗi cấp +8% chỉ số chính.',
        reforge: 'Tẩy luyện gieo lại toàn bộ dòng phụ của đồ Tốt, Hiếm, Huyền thoại (giữ nguyên số dòng). Có thể ra tốt hơn hoặc tệ hơn.',
        salvage: 'Phân rã đồ trong túi để lấy Đá cường hóa: Thường 0–1, Tốt 1, Hiếm 3, Huyền thoại 6 viên, cộng thêm theo cấp nâng.',
      }[smithTab];
      html += `<div class="detail muted">${tip}</div></div></div>`;
      return ['Thợ rèn Thiết', html];
    }
    const e = sel.entry;
    const q = qOf(e);
    html += `<div class="detail">${itemInfo(e)}</div>`;
    if (smithTab === 'upgrade') {
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
          ${lastUpgrade ? `<div class="rate upgrade-fx ${lastUpgrade.ok ? 'okc' : 'bad'}" style="margin-top:8px">${lastUpgrade.ok ? 'Thành công! +' + lastUpgrade.plus : 'Thất bại... +' + lastUpgrade.plus}</div>` : ''}
        </div>`;
      }
    } else if (smithTab === 'reforge') {
      if (q < 2) html += '<div class="detail muted">Đồ Thường không có dòng phụ. Chỉ đồ Tốt trở lên mới tẩy luyện được.</div>';
      else {
        const lv = G.ITEMS[e.id].level || 1;
        const c = { gold: 60 * q * Math.max(2, lv), stones: q };
        html += `<div class="detail"><div>Gieo lại ${e.aff.length || G.QUALITY_AFFIX[q]} dòng phụ ngẫu nhiên.</div>
          <div>Chi phí: <span class="${p.gold >= c.gold ? '' : 'bad'}">${fmt(c.gold)} xu</span>, <span class="${stones >= c.stones ? '' : 'bad'}">${c.stones} đá cường hóa</span></div>
          <div class="row" style="margin-top:10px"><button class="btn primary" data-act="reforge" ${p.gold >= c.gold && stones >= c.stones ? '' : 'disabled'}>🔮 Tẩy luyện</button></div></div>`;
      }
    } else {
      const base = { 1: '0–1', 2: 1, 3: 3, 4: 6 }[q];
      const bonus = Math.floor((e.plus || 0) / 2);
      const confirming = confirmSalvage === e.uid;
      html += `<div class="detail"><div>Nhận về: <b>${base}${bonus ? ' + ' + bonus : ''}</b> Đá cường hóa. Món đồ sẽ mất vĩnh viễn.</div>
        <div class="row" style="margin-top:10px"><button class="btn ${confirming ? 'primary' : ''}" data-act="salvage" data-uid="${e.uid}">
        ${confirming ? '⚠️ Bấm lần nữa để phân rã' : '♻️ Phân rã'}</button></div></div>`;
    }
    html += '</div></div>';
    return ['Thợ rèn Thiết', html];
  }
  function upgradeResult(ev) { lastUpgrade = ev; setTimeout(() => { lastUpgrade = null; }, 2500); }

  // ---------- Kho
  function panelStorage() {
    const p = App.player;
    const grid = (list, size, where) => {
      let h = '<div class="grid">';
      for (let i = 0; i < size; i++) { const e = list[i]; h += cellHtml(e, e ? `data-act="${where === 'bag' ? 'store' : 'retrieve'}" data-uid="${e.uid}" data-tip="${e.uid}" data-tipwhere="${where}"` : ''); }
      return h + '</div>';
    };
    return ['Thủ kho Bảo', `<p class="muted">Bấm vào vật phẩm để chuyển qua lại giữa túi và kho.</p><div class="cols">
      <div><h3 style="margin:0 0 8px">Túi (${p.bag.length}/${G.BAG_SIZE})</h3>${grid(p.bag, G.BAG_SIZE, 'bag')}</div>
      <div><h3 style="margin:0 0 8px">Kho (${p.storage.length}/${G.STORAGE_SIZE})</h3>${grid(p.storage, G.STORAGE_SIZE, 'storage')}</div></div>`];
  }

  // ---------- Nhập mật mã (Lữ khách bí ẩn)
  let codeDraft = '', codeMsg = '';
  function panelCode({ confirm }) {
    if (confirm) {
      const sc = G.SCHOOLS[confirm], p = App.player;
      return ['Lữ khách bí ẩn', `<div class="dialog"><div class="face">🧙</div><div class="text" style="flex:1">
        <p>Con đường của <b>${sc.icon} ${esc(sc.name)}</b>: ${esc(sc.desc)}</p>
        ${p.school ? `<p class="bad">Bạn sẽ rời class ${esc(G.SCHOOLS[p.school].name)}. Điểm kỹ năng đã cộng được trả lại toàn bộ.</p>` : ''}
        <div class="opts"><button class="btn primary" data-act="awaken_special" data-school="${confirm}">Thức tỉnh</button>
        <button class="btn" data-act="open" data-panel="npc_lu">Để sau</button></div></div></div>`];
    }
    return ['Lữ khách bí ẩn', `<div class="dialog"><div class="face">🧙</div><div class="text" style="flex:1">
      <p>Nói cho ta nghe mật mã của cậu.</p>
      <div class="row"><input id="code-input" class="code-input" value="${esc(codeDraft)}" placeholder="Mật mã" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <button class="btn primary" data-act="redeem">Xác nhận</button></div>
      <p id="code-msg" class="${codeMsg ? 'bad' : 'muted'}" style="font-size:12px;margin-top:8px">${esc(codeMsg || 'Mật mã có thể mở class đặc biệt hoặc tặng quà.')}</p>
      <div class="opts"><button class="btn" data-act="open" data-panel="npc_lu">Quay lại</button></div></div></div>`];
  }

  // ---------- Chọn class
  function panelSchool({ confirm }) {
    if (confirm) {
      const s = G.SCHOOLS[confirm];
      return ['Chọn class', `<h3 style="margin:0 0 6px">${esc(s.name)}</h3><p>${esc(s.desc)}</p>
        <p class="bad">Đã chọn thì không đổi lại được. Bạn chắc chứ?</p>
        <div class="row"><button class="btn primary" data-act="choose_school" data-school="${confirm}">Gia nhập ${esc(s.name)}</button>
        <button class="btn" data-act="open" data-panel="school">Xem lại</button></div>`];
    }
    const skillsOf = (id) => Object.entries(G.SKILLS).filter(([, s]) => id === 'toan_nang' || s.school === id).map(([k]) => skIcon(k)).join(' ');
    return ['Chọn class', '<p>Mỗi class có vũ khí và kỹ năng riêng. Chọn hướng thức tỉnh của bạn:</p><div class="schools">' +
      Object.entries(G.SCHOOLS).filter(([id, s]) => !s.special || App.player.unlocks[id]).map(([id, s]) => `<div class="school-card" data-act="school_pick" data-school="${id}"><h3 style="color:#${s.color.toString(16).padStart(6, '0')}">${s.icon} ${esc(s.name)}</h3><p>${esc(s.desc)}</p><p style="margin-top:6px">${skillsOf(id)}</p></div>`).join('') + '</div>'];
  }

  // ------------------------------------------------------------ Bấm nút
  async function onClick(e) {
    const selEl = e.target.closest('[data-sel]');
    const el = e.target.closest('[data-act]');
    if (selEl && !el) {
      const [where, key] = selEl.dataset.sel.split(':');
      selected = { where, key };
      renderPanel();
      return;
    }
    if (!el || el.disabled) return;
    const a = el.dataset.act, ds = el.dataset;
    Sound.play('click');
    switch (a) {
      case 'close': closePanel(); break;
      case 'open':
        if (ds.panel === 'npc_lu') { openNpc('lu_khach'); break; }
        openPanel(ds.panel, { npc: ds.npc, force: true });
        if (ds.panel === 'code') codeMsg = '';
        if (ds.panel === 'code') setTimeout(() => { const i = $('code-input'); if (i) i.focus(); }, 50);
        break;
      case 'tab': openPanel(ds.tab, { force: true }); break;
      case 'daily_claim': await act('daily_claim', { i: Number(ds.i) }); break;
      case 'daily_bonus': await act('daily_bonus'); break;
      case 'toggle_sfx': Sound.setSfx(!Sound.settings.sfx); renderPanel(); break;
      case 'toggle_music': Sound.setMusic(!Sound.settings.music); renderPanel(); break;
      case 'learn_skill': await act('learn_skill', { skill: ds.skill }); break;
      case 'clear_slot': await act('set_skill', { slot: Number(ds.slot), skill: null }); break;
      case 'reset_skills': await act('reset_skills'); renderPanel(); break;
      case 'redeem': {
        const inp = $('code-input');
        const code = inp ? inp.value.trim() : '';
        if (!code) break;
        codeDraft = code; codeMsg = '';
        const r = await act('redeem', { code });
        if (r.ok) { codeDraft = ''; openNpc('lu_khach'); }
        else { codeMsg = r.error || 'Mật mã không đúng.'; renderPanel(); }
        break;
      }
      case 'awaken_pick': openPanel('code', { confirm: ds.school, force: true }); break;
      case 'awaken_special': {
        const r = await act('awaken_special', { school: ds.school });
        if (r.ok) { App.hp = App.player.hp; App.mp = App.player.mp; openPanel('skills', { force: true }); UI.banner('THỨC TỈNH · ' + G.SCHOOLS[ds.school].name, 2200); }
        break;
      }
      case 'logout': if (App.logout) App.logout(); break;
      case 'fullscreen': if (App.fullscreen) App.fullscreen(); break;
      case 'equip': await act('equip', { uid: Number(ds.uid) }); selected = null; renderPanel(); break;
      case 'unequip': await act('unequip', { slot: ds.slot }); selected = null; renderPanel(); break;
      case 'use': App.scene.usePotion(ds.item.startsWith('binh_mau') ? 'hp' : 'mp'); break;
      case 'sell': await act('sell', { uid: Number(ds.uid), qty: Number(ds.qty) }); break;
      case 'buy': await act('buy', { npc: ds.npc, item: ds.item, qty: Number(ds.qty) }); break;
      case 'add_stat': await act('add_stat', { stat: ds.stat, n: Number(ds.n) }); break;
      case 'set_skill': await act('set_skill', { slot: Number(ds.slot), skill: ds.skill }); break;
      case 'store': await act('store', { uid: Number(ds.uid) }); hideTip(); break;
      case 'retrieve': await act('retrieve', { uid: Number(ds.uid) }); hideTip(); break;
      case 'upgrade': {
        const s = selected;
        await act('upgrade', s.where === 'equip' ? { slot: s.key } : { uid: Number(s.key) });
        renderPanel();
        break;
      }
      case 'smith_tab': smithTab = ds.tab; confirmSalvage = null; selected = null; renderPanel(); break;
      case 'reforge': {
        const s = selected;
        await act('reforge', s.where === 'equip' ? { slot: s.key } : { uid: Number(s.key) });
        renderPanel();
        break;
      }
      case 'salvage': {
        const uid = Number(ds.uid);
        if (confirmSalvage !== uid) { confirmSalvage = uid; renderPanel(); break; }
        confirmSalvage = null;
        const r = await act('salvage', { uid });
        if (r.ok) selected = null;
        renderPanel();
        break;
      }
      case 'quest_view': {
        const q = G.QUESTS[App.player.quest.step];
        openPanel('story', { id: q.npc, lines: q.start, button: '<button class="btn primary" data-act="quest_accept">Nhận nhiệm vụ</button>', force: true });
        break;
      }
      case 'quest_accept': {
        const q = G.QUESTS[App.player.quest.step];
        const r = await act('quest_accept');
        if (!r.ok) break;
        if (!Object.keys(q.obj).length) { await completeQuest(q); break; }
        closePanel();
        break;
      }
      case 'quest_complete': await completeQuest(G.QUESTS[App.player.quest.step]); break;
      case 'school_pick': openPanel('school', { confirm: ds.school, force: true }); break;
      case 'choose_school': {
        const r = await act('choose_school', { school: ds.school });
        if (r.ok) { App.hp = App.player.hp; App.mp = App.player.mp; openNpc('lao_su'); UI.banner('THỨC TỈNH · ' + G.SCHOOLS[ds.school].name, 2200); }
        break;
      }
    }
  }

  async function completeQuest(q) {
    const r = await act('quest_complete');
    if (r.ok) Sound.play('quest');
    if (r.ok) openPanel('story', { id: q.npc, lines: q.end, button: '<button class="btn primary" data-act="close">Đã hiểu</button>', force: true });
  }

  // ------------------------------------------------------------ Gợi ý khi rê chuột
  function showTip(e) {
    if (isTouch()) return;
    const el = e.target.closest('[data-tip]');
    if (!el) { hideTip(); return; }
    const where = el.dataset.tipwhere || 'bag';
    const list = where === 'storage' ? App.player.storage : App.player.bag;
    const entry = list.find(x => x.uid === Number(el.dataset.tip));
    if (!entry) { hideTip(); return; }
    const tip = $('tooltip');
    tip.innerHTML = itemInfo(entry);
    tip.classList.remove('hidden');
    const r = el.getBoundingClientRect();
    tip.style.left = Math.min(window.innerWidth - 270, r.right + 6) + 'px';
    tip.style.top = Math.min(window.innerHeight - tip.offsetHeight - 6, r.top) + 'px';
  }
  function hideTip() { $('tooltip').classList.add('hidden'); }

  function init() {
    $('panel-body').addEventListener('click', onClick);
    $('panel-body').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'code-input') { e.preventDefault(); onClick({ target: document.querySelector('[data-act="redeem"]') }); } });
    $('btn-menu').addEventListener('click', () => openPanel(lastMenuTab));
    $('panel-body').addEventListener('mouseover', showTip);
    $('panel-body').addEventListener('mouseleave', hideTip);
    $('panel-close').addEventListener('click', closePanel);
    $('panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
    document.querySelectorAll('#skillbar .sk').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k, sc = App.scene;
      if (!sc || App.panelOpen) return;
      if (k === 'atk') sc.basicAttack(sc.time.now);
      else if (k === 'hp' || k === 'mp') sc.usePotion(k);
      else sc.useSkill(Number(k), sc.time.now);
    }));
  }

  return {
    init, refresh, tick, log, banner, hint, setMap, setAttackIcon, questReady,
    openPanel, closePanel, openNpc, upgradeResult, itemIcon, isOpen: () => !!panel,
  };
})();
