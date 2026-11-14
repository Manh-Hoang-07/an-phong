'use strict';
/* Giao diện HTML phủ lên trên game: thanh máu, bảng túi đồ, cửa hàng, nhiệm vụ... */
const UI = (() => {
  const G = GameData;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(Math.floor(n)).toLocaleString('vi-VN');

  const skIcon = (id) => (G.SKILLS[id] && G.SKILLS[id].icon) || '✨';
  // Túi đồ và Trang bị là hai bảng riêng. Cấu hình (âm thanh, đồ họa) mở bằng nút ⚙️ trên HUD.
  const MENU_TABS = [['bag', '🎒 Túi đồ'], ['equip', '🛡 Trang bị'], ['char', '🥋 Nhân vật'], ['skills', '✨ Kỹ năng'], ['quest', '📜 Nhiệm vụ'], ['mount', '🐾 Thú triệu hồi'], ['companion', '🐕 Thú đồng hành'], ['shadows', '☠ Bóng ma']];
  // Thú triệu hồi: chỉ khi đã học kỹ năng Triệu Hồi Linh Thú; Bóng ma: chỉ Tử Linh Thuật Sư; Thú đồng hành: ai cũng có tab
  const hasSummon = () => G.skillLevel(App.player || {}, 'th5') > 0;
  const visibleTabs = () => MENU_TABS.filter(([k]) => (k !== 'shadows' || App.player?.school === 'tu_linh_thuat_su' || (App.player?.school === 'trieu_hoi_su' && App.player?.advancement?.unlocked?.tu_linh_thuat_su)) && (k !== 'mount' || hasSummon()));
  const petPanel = () => (hasSummon() ? 'mount' : 'companion');
  let lastMenuTab = 'bag';
  const SLOT_ICONS = { mu: '🎩', ao: '👘', gang_tay: '🧤', dai_lung: '🎗️', quan: '👖', giay: '👟', nhan: '💍', day_chuyen: '📿', ngoc_boi: '🧿' };
  const WEAPON_ICONS = Object.fromEntries(Object.entries(G.WEAPON_TYPES).map(([k, w]) => [k, w.icon]));
  const statText = (k, v) => `${G.statLabel(k)} +${v}${G.statUnit(k)}`;
  const qOf = (e) => (G.ITEMS[e.id] && G.ITEMS[e.id].slot ? (e.q || 1) : 1);
  const NPC_ICONS = { lao_su: '🧑‍💼', tho_ren: '⚒️', ba_thuoc: '⚗️', tap_hoa: '🏪', thu_kho: '📦', lu_khach: '🧙', he_thong: '💠', vy: '🗡️', bang_nv: '📋', lam_suong: '🌙', tram: '🌀', truong_lang_5: '🧑‍💼', truong_lang_6: '🧑‍💼' };
  // NPC dịch vụ của từng làng (tho_ren_3, bang_nv_5...) dùng biểu tượng của NPC gốc
  for (const id in G.NPCS) {
    if (NPC_ICONS[id]) continue;
    const base = id.replace(/_\d+$/, '');
    if (G.NPCS[id].village && NPC_ICONS[base]) NPC_ICONS[id] = NPC_ICONS[base];
  }

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

  // Icon dạng ảnh SVG vẽ bằng code (art/itemicons.js); emoji chỉ còn làm dự phòng
  function itemIcon(id) {
    if (!G.ITEMS[id]) return '?';
    if (typeof ItemArt !== 'undefined') { try { return ItemArt.html(id); } catch (e) { /* dùng emoji */ } }
    return itemEmoji(id);
  }
  function itemEmoji(id) {
    const d = G.ITEMS[id];
    if (!d) return '?';
    if (d.kind === 'weapon') return WEAPON_ICONS[d.wtype];
    if (d.kind === 'armor') return SLOT_ICONS[d.slot];
    if (id.startsWith('binh_mau')) return '🧪';
    if (id === 'thuoc_nhiem_do') return '🧴';
    if (d.kind === 'boost') return '📜';
    if (d.kind === 'transform_book') return d.transform === 'evolution' ? '📕' : '📗';
    if (id.startsWith('binh_nl')) return '💧';
    if (id === 'da_cuong_hoa') return '💎';
    if (id === 'manh_vai_den') return '🏴';
    if (id.startsWith('manh_an')) return '🔷';
    if (id === 'sach_ky_nang') return '📘';
    if (d.kind === 'ult_book') return '📕';
    if (d.kind === 'skill_book') return '📘';
    if (d.kind === 'slot_book') return '📒';
    if (d.kind === 'erase_book') return '🧽';
    if (id === 'tinh_the_xanh') return '💠';
    if (id === 'loi_nang_luong') return '🔶';
    return '📦';
  }

  // ------------------------------------------------------------ HUD
  let panel = null;       // { name, ctx }
  // Trạng thái dùng chung giữa lõi, các bảng (ui/panels) và xử lý nút (ui/actions.js)
  const S = {
    selected: null,         // { where: 'bag'|'equip'|'storage', key }
    smithTab: 'upgrade', lastUpgrade: null, confirmSalvage: null,   // thợ rèn
    confirmDrop: null,   // túi đồ: "uid:số lượng" đang chờ bấm lần nữa để bỏ
    detailOpen: null,    // "where:key" của vật phẩm đang mở khung chi tiết đầy đủ
    codeDraft: '', codeMsg: '',                                    // nhập mật mã
  };
  // Các bảng tự đăng ký vào đây: tên bảng → hàm trả về [tiêu đề, html]
  const PANELS = {};
  let lastTick = 0;

  // Chỉ ghi vào DOM khi nội dung thật sự đổi (đỡ vẽ lại thanh kỹ năng mỗi lần server trả lời)
  function setHtml(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }

  function refresh() {
    const p = App.player;
    if (!p) return;
    const st = App.stats;
    const sc = p.school && G.SCHOOLS[p.school];
    $('tb-hidden-chat').classList.toggle('hidden', p.map !== 'lang');
    $('h-level').textContent = p.level;
    $('h-rank').textContent = G.playerRank(p);
    $('h-ava').textContent = sc ? sc.icon : '👤';
    document.documentElement.style.setProperty('--accent', sc ? '#' + sc.color.toString(16).padStart(6, '0') : '#3fd0ff');
    const need = G.expToNext(p.level);
    const ep = p.level >= G.MAX_LEVEL ? 100 : (p.exp / need) * 100;
    $('h-exp').style.width = ep + '%';
    $('h-exp-t').textContent = p.level >= G.MAX_LEVEL ? 'Cấp tối đa' : `${ep.toFixed(1)}%`;
    const badge = $('h-points');
    const pts = (p.freePoints || 0) + (p.skillPoints || 0);
    badge.textContent = pts;
    badge.classList.toggle('hidden', !pts);
    const tn = G.baseSchool(p.school) === 'toan_nang';
    document.querySelectorAll('.sk-extra, .tb-s4, .tb-ult3').forEach(el => el.classList.toggle('hidden', !tn));
    // Nút biến hình: chỉ hiện khi đã có Ấn thức tỉnh; sáng lên khi đang biến hình
    const awk = G.awakenOf(p);
    const hasForm = (p.awakenTier || 0) > 0;
    const summoned = Array.isArray(p.mounts?.summoned) ? p.mounts.summoned : (p.mounts?.active ? [p.mounts.active] : []);
    $('hud-pet').classList.toggle('hidden', !summoned.length);
    const petStates = p.pets || {};
    setHtml($('hud-pets-list'), summoned.map(id => {
      const def = G.MOUNTS[id];
      if (!def) return '';
      const skill = G.PET_SKILLS[p.mounts?.skills?.[id] || p.mounts?.skill] || G.PET_SKILLS.bite;
      return `<div class="pet-hud-unit"><b>${def.icon} ${esc(def.name)} <small>${skill.icon} ${esc(skill.name)}</small></b><div class="bar hp"><div id="pet-hp-${id}"></div><span id="pet-hp-t-${id}"></span></div><div class="bar mp"><div id="pet-mp-${id}"></div><span id="pet-mp-t-${id}"></span></div><div class="bar sta"><div id="pet-sta-${id}"></div><span id="pet-sta-t-${id}"></span></div></div>`;
    }).join(''));
    if (summoned.length) {
      $('pet-skill-slot').textContent = `Mỗi thú tự dùng kỹ năng riêng · ${summoned.length} thú đang triệu hồi`;
      tickPets((id) => G.companionStats(p, id), petStates, summoned);
    }
    document.querySelectorAll('.sk-form, .tb-form').forEach(el => {
      el.classList.toggle('hidden', !hasForm);
      el.classList.toggle('active', !!App.form);   // nút biến hình chỉ sáng khi đang thức tỉnh
      if (hasForm) el.style.setProperty('--form', '#' + (awk?.aura || G.SCHOOLS[p.school]?.color || 0xb46bff).toString(16).padStart(6, '0'));
    });
    // Có cả Ấn I và Ấn II: hiện nút đổi ấn và ghi rõ ấn đang chọn trên nút biến hình
    const both = (p.awakenTier || 0) >= 2;
    const pick = App.awakenPick === 'awaken1' ? 1 : 2;
    document.querySelectorAll('.sk-aws, .tb-aws').forEach(el => el.classList.toggle('hidden', !both));
    document.querySelectorAll('.sk-form .ico small, .tb-form .ico small').forEach(el => { el.textContent = both ? (pick === 1 ? 'Ấn I' : 'Ấn II') : (el.closest('.tb-form') ? 'Biến' : 'Biến hình'); });
    // Nút chức nghiệp 2 (V) đã bỏ: chức nghiệp 2 giờ là class thật, không bật/tắt
    document.querySelectorAll('.sk-career, .tb-career').forEach(el => el.classList.add('hidden'));

    // thanh kỹ năng: một thanh duy nhất
    const bar = p.skillSlots || [];
    document.querySelectorAll('#skillbar .sk').forEach(el => {
      const k = el.dataset.k;
      if (!/^\d$/.test(k)) return;
      const id = bar[Number(k)];
      const ico = el.querySelector('.ico');
      if (id) {
        const sk = G.skillAt(id, G.skillLevel(p, id));
        setHtml(ico, `${skIcon(id)}<small>${esc(sk.name.split(' ')[0])}</small>`);
        el.title = `${sk.name} cấp ${sk.lv} (${Math.round(sk.mp * st.costMul)} năng lượng)`;
        el.classList.remove('empty');
      } else { setHtml(ico, G.isUltSlot(Number(k)) ? '★' : '·'); el.title = 'Trống'; el.classList.add('empty'); }
    });
    // nút kỹ năng cảm ứng
    for (const [cls, i] of [['tb-s0', 0], ['tb-s1', 1], ['tb-s2', 2], ['tb-s3', 3], ['tb-s4', 4], ['tb-ult', G.ULT_SLOTS[0]], ['tb-ult2', G.ULT_SLOTS[1]], ['tb-ult3', G.ULT_SLOTS[2]]]) {
      const el = document.querySelector(`#touch .${cls}`);
      const id = bar[i];
      const ico = el.querySelector('.ico');
      if (id) {
        setHtml(ico, `${skIcon(id)}<small>${esc(G.SKILLS[id].name.split(' ').pop())}</small>`);
        el.classList.remove('empty');
      } else { setHtml(ico, String(G.isUltSlot(i) ? '★' : i + 1)); el.classList.add('empty'); }
    }
    const cnt = (ids) => p.bag.filter(e => ids.includes(e.id)).reduce((s, e) => s + e.qty, 0);
    const potIds = (isMp) => Object.keys(G.ITEMS).filter(i => G.ITEMS[i].kind === 'potion' && (isMp ? G.ITEMS[i].mp : (G.ITEMS[i].hp || G.ITEMS[i].hpPct)));
    $('pot-hp').textContent = $('tpot-hp').textContent = cnt(potIds(false));
    $('pot-mp').textContent = $('tpot-mp').textContent = cnt(potIds(true));

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
    const sta = App.sta ?? st.maxSta;
    $('h-sta').style.width = Math.max(0, sta / st.maxSta * 100) + '%';
    $('h-sta-t').textContent = App.staLocked ? 'Kiệt sức…' : `${fmt(Math.floor(sta))} / ${fmt(st.maxSta)}`;
    $('h-sta-bar').classList.toggle('locked', !!App.staLocked);
    const len = scene.cooldownLen || {};
    const p = App.player;
    // Nút đánh thường mờ đi khi không đủ thể lực
    const noAtk = !!App.staLocked || (scene.attackStaminaCost && sta < scene.attackStaminaCost());
    for (const el of [document.querySelector('#skillbar .sk[data-k="atk"]'), document.querySelector('#touch .tb-attack')]) if (el) el.classList.toggle('nosta', noAtk);
    const bar = p.skillSlots || [];
    for (let i = 0; i < G.SKILL_SLOTS; i++) {
      const id = bar[i];
      const left = id ? (scene.cooldowns[id] || 0) - time : 0;
      const h = left > 0 ? (left / (len[id] || 1) * 100) + '%' : '0';
      const skNow = id && G.skillLevel(p, id) ? G.skillAt(id, G.skillLevel(p, id)) : null;
      const noMp = !!skNow && App.mp < Math.round(skNow.mp * st.costMul);
      const noSta = !!skNow && (!!App.staLocked || sta < (skNow.ult ? G.STAMINA.ult : G.STAMINA.skill));
      const ui = G.ULT_SLOTS.indexOf(i);
      const touchCls = ui >= 0 ? ['tb-ult', 'tb-ult2', 'tb-ult3'][ui] : 'tb-s' + i;
      for (const el of [document.querySelector(`#skillbar .sk[data-k="${i}"]`), document.querySelector(`#touch .${touchCls}`)]) {
        if (!el) continue;
        el.querySelector('.cd').style.height = h;
        el.classList.toggle('nomp', noMp);
        el.classList.toggle('nosta', noSta);
      }
    }
  }

  let lastPetTick = 0;
  function tickPets(statsOf, pets, ids) {
    const now = performance.now();
    if (now - lastPetTick < 250) return;
    lastPetTick = now;
    for (const id of ids) {
      const pet = pets[id];
      if (!pet) continue;
      const stats = statsOf(id);
      for (const [key, value, max] of [['hp', pet.hp, stats.maxHp], ['mp', pet.mp, stats.maxMp], ['sta', pet.sta, stats.maxSta]]) {
        const bar = $(`pet-${key}-${id}`), label = $(`pet-${key}-t-${id}`);
        if (!bar || !label) continue;
        bar.style.width = Math.max(0, Math.min(100, value / max * 100)) + '%';
        label.textContent = `${fmt(Math.max(0, value))}/${fmt(max)}`;
      }
      const staLabel = $(`pet-sta-t-${id}`);
      if (staLabel) staLabel.textContent = `${fmt(Math.max(0, pet.sta))}/${fmt(stats.maxSta)} thể lực`;
    }
  }

  function log(text, color = '#e0e0e0', ms = 7000) {
    const box = $('log');
    const d = document.createElement('div');
    d.textContent = keyText(text);
    d.style.color = color;
    box.appendChild(d);
    while (box.children.length > 8) box.removeChild(box.firstChild);
    setTimeout(() => d.classList.add('old'), ms);
    setTimeout(() => d.remove(), ms + 1200);
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
  // Tên bản đồ + số người chơi đang ở bản đồ (từ Realtime)
  let mapName = '', mapCount = 0;
  function showMap() { $('h-map').textContent = mapName + (mapCount > 1 ? ` · ${mapCount} người` : ''); }
  function setMap(name) { mapName = name; mapCount = 0; showMap(); }
  function setMapCount(n) { if (n !== mapCount) { mapCount = n; showMap(); } }
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

  function currentQuestLine(p) {
    return questLines(p).find(([, done]) => !done) || null;
  }

  function renderQuestTrack() {
    const p = App.player;
    const q = G.QUESTS[p.quest.step];
    const el = $('quest-track');
    if (!q) { el.textContent = 'Đã hoàn thành cốt truyện.'; return; }
    if (p.quest.state === 'none') {
      const need = G.questMinLevel(q);
      el.textContent = p.level < need ? `Đạt cấp ${need} để nhận nhiệm vụ "${q.name}".` : `Gặp ${G.npcAt(p, q.npc)} để nhận nhiệm vụ.`;
      return;
    }
    const line = currentQuestLine(p);
    el.textContent = line ? line[0] : `Trả nhiệm vụ cho ${G.npcAt(p, q.npc)}.`;
  }

  // Phụ tuyến đang làm, hiển thị gọn dưới nhiệm vụ chính
  function activeSides(p) {
    return Object.keys((p.side && p.side.active) || {}).map(id => G.sideById(id)).filter(Boolean);
  }
  function sideTrack() {
    const p = App.player;
    const list = activeSides(p);
    if (!list.length) return '';
    return '<div class="daily-track">' + list.map(q => {
      const ready = G.sideReady(p, q.id);
      return `<div class="${ready ? 'done' : ''}">📌 ${esc(q.name)}${ready ? ' → về gặp ' + esc(G.NPCS[q.npc].name) : ''}</div>`;
    }).join('') + '</div>';
  }

  // Mục phụ tuyến trong bảng Nhiệm vụ
  function sidePanelHtml(p) {
    const act = activeSides(p);
    const avail = G.SIDE_QUESTS.filter(q => G.sideAvailable(p, q.id));
    if (!act.length && !avail.length) return '';
    let h = '<hr style="border-color:#333"><div class="muted" style="margin-bottom:4px">PHỤ TUYẾN</div>';
    for (const q of act) {
      const ready = G.sideReady(p, q.id);
      h += `<div style="margin:6px 0"><b>${ready ? '✔' : '📌'} ${esc(q.name)}</b>` +
        (lib.guideHtml ? lib.guideHtml(G.questGuide(p, q, true), 'active') : '') +
        G.sideLines(p, q).map(([t, ok]) => `<div class="${ok ? 'okc' : 'muted'}" style="font-size:12px">${ok ? '✓' : '•'} ${esc(t)}</div>`).join('') +
        (ready ? `<div class="okc" style="font-size:12px">🏁 Về gặp ${esc(G.npcAt(p, q.npc))} để trả</div>` : '') + '</div>';
    }
    for (const q of avail) h += `<div class="muted" style="font-size:12px">• ${esc(q.name)} — 📍 nhận ở ${esc(G.npcAt(p, q.npc))}</div>`;
    return h;
  }

  // Bảng ngày của làng (mặc định: làng của vùng đang đứng). Mỗi làng một bảng riêng (p.dailyByMap).
  function dailyLines(p, mapId) {
    const d = (p.dailyByMap || {})[mapId || G.villageOf(p.map)];
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
    const now = App.serverNow(), vn = now + 7 * 3600 * 1000;
    const left = 86400000 - (vn % 86400000);
    const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000);
    return `${h} giờ ${m} phút`;
  }

  // ------------------------------------------------------------ Bảng
  function openPanel(name, ctx = {}) {
    if (panel && panel.name === name && !ctx.force) { closePanel(); return; }
    if (visibleTabs().some(([k]) => k === name)) lastMenuTab = name;
    panel = { name, ctx };
    if (!ctx.keepSel) S.selected = null;
    App.panelOpen = true;
    document.body.classList.add('panel-open');
    App.keys = {};
    App.touch = {};
    $('panel').classList.remove('hidden');
    renderPanel();
  }
  function closePanel() {
    panel = null; S.selected = null; App.panelOpen = false;
    document.body.classList.remove('panel-open');
    $('panel').classList.add('hidden');
    hideTip();
  }

  function renderPanel() {
    if (!panel) return;
    const fns = PANELS;
    const [title, html0] = fns[panel.name](panel.ctx);
    let html = html0;
    if (visibleTabs().some(([k]) => k === panel.name)) {
      const p = App.player;
      const count = { char: p.freePoints || 0, skills: p.skillPoints || 0 };
      html = '<div class="tabs">' + visibleTabs().map(([k, n]) =>
        `<button class="btn tab ${panel.name === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${n}${count[k] ? ` <b class="tabcount">${count[k]}</b>` : ''}</button>`).join('') + '</div>' + html;
    }
    // Bảng có nhiều tab (menu, thợ rèn) giữ cố định kích cỡ, chuyển tab không bị co giãn
    const fixed = visibleTabs().some(([k]) => k === panel.name) || panel.name === 'smith' || panel.name === 'shop';
    document.querySelector('.panel-box').classList.toggle('fixed', fixed);
    $('panel-title').textContent = title;
    const body = $('panel-body');
    const same = panel.lastName === panel.name;
    const detailKey = S.selected ? `${S.selected.where}:${S.selected.key}` : '';
    const detailScroll = same && panel.lastDetailKey === detailKey ? (body.querySelector('.bag-side')?.scrollTop || 0) : 0;
    const scroll = same ? body.scrollTop : 0;
    // Túi đồ trên điện thoại nằm ngang: mỗi cột tự cuộn → giữ vị trí cuộn khi bảng vẽ lại
    const colScroll = same ? [...body.querySelectorAll('.bag-main, .bag-side, .eq-wrap')].map(el => el.scrollTop) : [];
    body.classList.toggle('inv-mode', panel.name === 'bag' || panel.name === 'shop');
    panel.lastName = panel.name;
    panel.lastDetailKey = detailKey;
    // Bảng được vẽ lại mỗi khi server trả lời (kể cả lần tự lưu 10 giây một lần). Giữ nguyên chữ đang gõ và con trỏ
    // trong các ô nhập, nếu không thì đang nhập mã giữa chừng sẽ mất chữ và bàn phím điện thoại tự đóng.
    const typed = {};
    const act0 = document.activeElement;
    let focusId = null, sel = null;
    if (same) {
      for (const el of body.querySelectorAll('input[id], textarea[id]')) typed[el.id] = el.value;
      if (act0 && body.contains(act0) && act0.id) { focusId = act0.id; try { sel = [act0.selectionStart, act0.selectionEnd]; } catch { /* bỏ qua */ } }
    }
    body.innerHTML = html;
    for (const id in typed) { const el = document.getElementById(id); if (el && body.contains(el)) el.value = typed[id]; }
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el && body.contains(el)) { el.focus({ preventScroll: true }); if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch { /* bỏ qua */ } }
    }
    body.scrollTop = scroll;
    const detail = body.querySelector('.bag-side');
    if (detail) detail.scrollTop = detailScroll;
    body.querySelectorAll('.bag-main, .bag-side, .eq-wrap').forEach((el, i) => { if (colScroll[i]) el.scrollTop = colScroll[i]; });
  }

  function act(type, params) { return Net.action(type, params); }

  // ---------- Ô vật phẩm
  function cellHtml(entry, attrs, label) {
    if (!entry) return `<div class="cell empty">${label ? `<span class="lbl">${esc(label)}</span>` : ''}</div>`;
    const q = qOf(entry);
    const isSel = S.selected && attrs.includes(`data-sel="${S.selected.where}:${S.selected.key}"`);
    return `<div class="cell qb${q}${isSel ? ' sel' : ''}" ${attrs}>${itemIcon(entry.id)}` +
      (entry.plus ? `<span class="pl">+${entry.plus}</span>` : '') +
      (entry.qty > 1 ? `<span class="n">${entry.qty}</span>` : '') +
      (label ? `<span class="lbl">${esc(label)}</span>` : '') + '</div>';
  }

  function itemInfo(entry, opts = {}) {
    const d = G.ITEMS[entry.id];
    const p = App.player;
    const q = qOf(entry);
    let h = opts.noTitle ? '' : `<h3 class="q${q}">${itemIcon(entry.id)} ${esc(d.name)}${entry.plus ? ' +' + entry.plus : ''}</h3>`;
    const tags = [];
    if (d.slot) tags.push(`<span class="q${q}">${G.QUALITY_NAMES[q]}</span>`, G.SLOT_NAMES[d.slot]);
    if (d.level) tags.push(`<span class="${d.level > p.level ? 'bad' : ''}">Cấp ${d.level}</span>`);
    const set = G.setOfItem(d);
    if (set) tags.push(`<span class="muted">Bộ ${set.name} (cấp ${set.min}–${set.max})</span>`);
    if (d.slot === 'weapon' && d.wtype) tags.push(`<span class="${G.canUseItem({ ...p, level: 99 }, d) ? '' : 'bad'}">${esc(G.WEAPON_TYPES[d.wtype].name)} · ${d.school ? G.SCHOOLS[d.school].name : 'chưa chọn class'}</span>`);
    else if (d.school) tags.push(`<span class="${G.canUseItem({ ...p, level: 99 }, d) ? '' : 'bad'}">${G.SCHOOLS[d.school].name}</span>`);
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
    if (d.kind === 'skill_book' || d.kind === 'ult_book') h += bookSkillInfo(d, p);
    if (opts.sell && G.sellPrice(entry)) h += `<div class="gold">Bán được: ${fmt(G.sellPrice(entry))} xu / cái</div>`;
    return h;
  }

  // Sách kỹ năng / tuyệt kỹ: cho xem kỹ năng sẽ học làm gì (sát thương, hiệu ứng, năng lượng, hồi chiêu, mốc cấp 5/10)
  function bookSkillInfo(d, p) {
    const id = d.skill || (d.kind === 'ult_book' && p.school && G.signatureUlt ? G.signatureUlt(p) : null);
    const sk = id && G.SKILLS[id];
    if (!sk) return '';
    const nums = UI._.skillNumbers || (() => '');
    const costMul = (App.stats && App.stats.costMul) || 1;
    const lv1 = G.skillAt(id, 1), max = G.skillAt(id, G.SKILL_MAX);
    const learned = G.skillLevel(p, id);
    const fits = sk.ult ? (!p.school || !G.ultFits || G.ultFits(p, sk)) : (!p.school || G.availableSkills(p).includes(id));
    const status = learned ? `<span class="okc">Đã học (cấp ${learned})</span>`
      : !fits ? '<span class="bad">Không thuộc class của bạn</span>'
        : sk.level > p.level ? `<span class="bad">Cần cấp ${sk.level}</span>` : '<span class="okc">Học được</span>';
    const ms = [[5, sk.t5], [10, sk.t10]].filter(([, t]) => t)
      .map(([m, t]) => `<div class="sk-milestone">◇ <b>Cấp ${m}</b>: ${esc(t)}</div>`).join('');
    return `<div class="book-skill">
      <div class="book-skill-h"><span class="ic">${sk.icon}</span><b>${esc(sk.name)}</b>${sk.ult ? ' <span class="tag-ult">TUYỆT KỸ</span>' : ''} · ${status}</div>
      <small class="sk-desc">${esc(sk.desc || '')}</small>
      <div class="sk-nums"><span>Cấp 1: ${nums(lv1) || '—'}</span>
        <span class="muted">${Math.round(lv1.mp * costMul)} năng lượng · hồi ${Math.round(lv1.cd * 10) / 10}s</span></div>
      ${G.SKILL_MAX > 1 ? `<div class="sk-next">▲ Cấp ${G.SKILL_MAX}: ${nums(max) || '—'} · ${Math.round(max.mp * costMul)} năng lượng · hồi ${Math.round(max.cd * 10) / 10}s</div>` : ''}
      ${ms}
    </div>`;
  }

  function shopHere() {
    const m = G.MAPS[App.player.map];
    return Object.values(m.npcs).some(n => G.NPCS[n].shop);
  }

  function selectedEntry() {
    if (!S.selected) return null;
    const p = App.player;
    if (S.selected.where === 'equip') { const e = p.equip[S.selected.key]; return e ? { entry: { ...e, qty: 1 }, where: 'equip', key: S.selected.key } : null; }
    const list = S.selected.where === 'bag' ? p.bag : G.storageOf(p);   // kho của làng đang đứng
    const e = list.find(x => x.uid === Number(S.selected.key));
    return e ? { entry: e, where: S.selected.where, key: e.uid } : null;
  }

  // ------------------------------------------------------------ Gợi ý khi rê chuột
  function showTip(e) {
    if (isTouch()) return;
    const el = e.target.closest('[data-tip]');
    if (!el) { hideTip(); return; }
    const where = el.dataset.tipwhere || 'bag';
    const list = where === 'storage' ? G.storageOf(App.player) : App.player.bag;
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
  async function hiddenChat() {
    if (App.player?.map !== 'lang') { log('Không có hồi đáp.', '#bdbdbd'); return; }
    const text = window.prompt('Chat NPC ẩn tại Tân Đô. Nhập "npc an" (hoặc "ncp an"):','npc an');
    if (text == null) return;
    const r = await Net.action('hidden_chat', { text });
    if (r.ok && App.scene?.addHiddenNpc) App.scene.addHiddenNpc();
  }

  function init() {
    $('panel-body').addEventListener('click', (e) => lib.onClick(e));
    // Thanh kéo âm lượng: chỉnh là nghe thay đổi ngay, không vẽ lại bảng (giữ được vị trí đang kéo)
    $('panel-body').addEventListener('input', (e) => {
      const el = e.target;
      if (!el || !el.dataset || !el.dataset.vol) return;
      const v = Number(el.value) / 100;
      if (el.dataset.vol === 'sfx_vol') Sound.setSfxVol(v); else Sound.setMusicVol(v);
      const out = el.parentElement && el.parentElement.querySelector('b');
      if (out) out.textContent = Math.round(v * 100) + '%';
      if (el.dataset.vol === 'sfx_vol') Sound.play('click');
    });
    $('panel-body').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'code-input') { e.preventDefault(); lib.onClick({ target: document.querySelector('[data-act="redeem"]') }); } });
    $('btn-menu').addEventListener('click', () => openPanel(lastMenuTab));
    $('btn-map').addEventListener('click', () => openPanel('map'));
    const cfg = $('btn-config');
    if (cfg) cfg.addEventListener('click', () => openPanel('config'));
    $('panel-body').addEventListener('mouseover', showTip);
    $('panel-body').addEventListener('mouseleave', hideTip);
    $('panel-close').addEventListener('click', closePanel);
    $('tb-hidden-chat').addEventListener('click', hiddenChat);
    $('panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
    document.querySelectorAll('#skillbar .sk').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k, sc = App.scene;
      if (!sc || App.panelOpen) return;
      if (k === 'atk') sc.basicAttack(sc.time.now);
      else if (k === 'hp' || k === 'mp') sc.usePotion(k);
      else if (k === 'form') sc.toggleForm(sc.time.now);
      else if (k === 'aws') sc.switchAwaken();
      else if (k === 'mount') openPanel(petPanel());
      else if (k === 'pets') openPanel(petPanel());
      else sc.useSkill(Number(k), sc.time.now);
    }));
  }

  // Dùng nội bộ cho các file ui/panels/*.js và ui/actions.js (không gọi từ ngoài UI)
  const lib = { G, $, esc, fmt, skIcon, MENU_TABS, SLOT_ICONS, WEAPON_ICONS, statText, qOf, NPC_ICONS, isTouch, keyText, itemIcon, itemEmoji, refresh, tick, tickPets, log, banner, hint, setMap, setAttackIcon, questLines, questReady, renderQuestTrack, activeSides, sideTrack, sidePanelHtml, dailyLines, dailyTrack, resetIn, openPanel, closePanel, renderPanel, act, cellHtml, itemInfo, shopHere, selectedEntry, showTip, hideTip, init, S, PANELS };

  return {
    init, refresh, tick, tickPets, log, banner, hint, setMap, setMapCount, setAttackIcon, questReady, hiddenChat,
    openPanel, closePanel, itemIcon, itemEmoji, petPanel, isOpen: () => !!panel,   // openNpc, upgradeResult: gắn trong ui/panels
    _: lib,
  };
})();
