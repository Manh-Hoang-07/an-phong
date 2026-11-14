'use strict';
/* Giao diện xã hội: đội nhóm, giao dịch trực tiếp, chợ người chơi (xem docs/KE_HOACH_DA_NGUOI_CHOI.md mục 12).
 * Mọi quyết định do server; file này chỉ vẽ và gửi lệnh. Đồ trong giao dịch / chợ luôn lấy từ dữ liệu server gửi. */
const Social = (() => {
  const U = () => UI._;
  const esc = (s) => U().esc(String(s == null ? '' : s));
  const fmt = (n) => U().fmt(n);
  const $ = (id) => document.getElementById(id);
  const G = GameData;

  // ------------------------------------------------------------ Dữ liệu
  let party = null;                 // { id, leader, members:[{id,name,lv,sc,hp,map,on,dead}] } hoặc null
  const mates = new Set();          // connId của đồng đội (để tô màu tên)
  const toasts = new Map();         // loại → phần tử lời mời đang hiện
  let T = null;                     // giao dịch đang mở: { me, them, lockAt, offer }
  let tradeTimer = null;
  let market = { tab: 'buy', list: [], total: 0, page: 0, per: 20, mine: [], max: 10, q: '', slot: '', sort: 'price_asc' };
  const tipReg = new Map();         // khóa → món đồ, để hiện mô tả khi rê chuột

  const send = (o) => Realtime.send(o);
  const className = (sc) => (sc && G.SCHOOLS[sc] && G.SCHOOLS[sc].name) || 'Tập sự';

  // ------------------------------------------------------------ Tooltip món đồ
  function tipFor(el) {
    if (UI._.isTouch()) return;
    const e = el.closest('[data-sk]');
    const entry = e && tipReg.get(e.dataset.sk);
    const tip = $('tooltip');
    if (!entry) { tip.classList.add('hidden'); return; }
    tip.innerHTML = U().itemInfo(entry);
    tip.classList.remove('hidden');
    const r = e.getBoundingClientRect();
    tip.style.left = Math.max(4, Math.min(window.innerWidth - 270, r.right + 6)) + 'px';
    tip.style.top = Math.max(4, Math.min(window.innerHeight - tip.offsetHeight - 6, r.top)) + 'px';
  }
  function hideTip() { $('tooltip').classList.add('hidden'); }

  // Ô vật phẩm có đăng ký tooltip. extra: thuộc tính thêm (data-act...)
  function cell(entry, key, extra = '') {
    tipReg.set(key, entry);
    return U().cellHtml(entry, `data-sk="${esc(key)}" ${extra}`);
  }

  // ------------------------------------------------------------ Lời mời (đội / giao dịch)
  function toast(kind, text, ms, onYes, onNo) {
    let box = $('social-toasts');
    const old = toasts.get(kind);
    if (old) old.remove();
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = `<span>${esc(text)}</span><button class="btn small primary" data-y>Đồng ý</button><button class="btn small ghost" data-n>Từ chối</button>`;
    d.querySelector('[data-y]').onclick = () => { d.remove(); toasts.delete(kind); onYes(); };
    d.querySelector('[data-n]').onclick = () => { d.remove(); toasts.delete(kind); onNo(); };
    box.appendChild(d);
    toasts.set(kind, d);
    setTimeout(() => { if (toasts.get(kind) === d) { d.remove(); toasts.delete(kind); } }, ms);
  }

  // ------------------------------------------------------------ Đội nhóm
  const isMate = (id) => mates.has(id);

  function renderParty() {
    const hud = $('party-hud');
    if (!party) { hud.classList.add('hidden'); hud.innerHTML = ''; return; }
    hud.classList.remove('hidden');
    hud.innerHTML = party.members.map((m) => {
      const lead = m.id === party.leader ? '<b title="Trưởng đội">★</b>' : '';
      return `<div class="pm ${m.on ? '' : 'off'} ${m.dead ? 'dead' : ''}" data-pm="${m.id}"><span class="pn">${lead}${esc(m.name)} <i>Lv.${m.lv || '?'}</i></span><div class="pb"><i style="width:${m.on ? m.hp : 0}%"></i></div></div>`;
    }).join('') + '<button class="btn small ghost" data-act-party="open">Quản lý</button>';
  }

  function onParty(m) {
    mates.clear();
    if (!m.id) {
      const had = !!party;
      party = null;
      if (had) UI.log('[Đội] Bạn không còn ở trong đội.', '#a5d6a7');
    } else {
      if (!party) UI.log('[Đội] Bạn đã vào đội. Chat đội: gõ /p <nội dung>.', '#a5d6a7');
      party = m;
      for (const x of m.members) if (x.id) mates.add(x.id);
    }
    renderParty();
    if (UI.panelIs('party')) UI._.renderPanel();
  }

  function renderPartyWin() {
    // Hội nhóm giờ là một tab trong bảng (cùng chỗ với Túi đồ / Nhân vật), không còn cửa sổ nổi riêng
    UI.openPanel('party', { force: true });
  }

  // Tab Hội nhóm: đội đang có, danh sách người chơi cùng bản đồ để mời, và phần giao dịch
  function panelParty() {
    const me = Realtime.myId;
    const rows = [];
    if (party) {
      const iLead = party.leader === me;
      rows.push(`<div class="pg-head"><b>Đội của bạn</b><small>${party.members.length}/5 thành viên</small></div>`);
      rows.push('<div class="pg-list">' + party.members.map((m) => `<div class="pg-row">
        <span class="pg-name">${m.id === party.leader ? '<b title="Trưởng đội">★</b> ' : ''}${esc(m.name)}
          <small>Lv.${m.lv || '?'} · ${esc(className(m.sc))}${m.on ? '' : ' · mất kết nối'}${m.dead ? ' · đã gục' : ''}</small></span>
        <span class="pg-hp"><i style="width:${m.on ? m.hp : 0}%"></i></span>
        ${iLead && m.id && m.id !== me ? `<span class="pg-btns"><button class="btn small ghost" data-act="p_lead" data-lead="${m.id}">Nhường</button><button class="btn small ghost" data-act="p_kick" data-kick="${m.id}">Đuổi</button></span>` : ''}
      </div>`).join('') + '</div>');
      rows.push('<button class="btn ghost" data-act="p_leave">Rời đội</button>');
    } else {
      rows.push(`<div class="pg-empty"><span>👥</span><b>Bạn chưa ở trong đội nào</b>
        <small>Bấm vào một người chơi khác trong bản đồ để mời vào đội, hoặc chọn người bên dưới.</small></div>`);
    }
    // Người chơi cùng bản đồ (Realtime) — mời vào đội / giao dịch ngay trong tab
    const others = App.scene && App.scene.remotes ? [...App.scene.remotes.values()] : [];
    if (others.length) {
      rows.push(`<div class="pg-head"><b>Cùng bản đồ</b><small>${others.length} người</small></div>`);
      rows.push('<div class="pg-list">' + others.map((r) => {
        const mate = isMate(r.id);
        return `<div class="pg-row"><span class="pg-name">${esc(r.name)}<small>Lv.${r.lv} · ${esc(className(r.sc))}${mate ? ' · đồng đội' : ''}</small></span>
          <span class="pg-btns">${mate ? '' : `<button class="btn small" data-act="p_invite" data-pinv="${r.id}">Mời</button>`}
          <button class="btn small ghost" data-act="t_invite" data-tinv="${r.id}">Giao dịch</button></span></div>`;
      }).join('') + '</div>');
    }
    rows.push(`<p class="note">Chia kinh nghiệm: đồng đội đứng gần nhận 50% kinh nghiệm và tiến độ nhiệm vụ khi bạn hạ quái;
      người tự hạ nhận thêm 10% mỗi đồng đội có mặt. Chat đội: gõ <b>/p nội dung</b>.</p>`);
    return ['Hội nhóm', `<div class="pg-wrap">${rows.join('')}</div>`];
  }

  // ------------------------------------------------------------ Menu bấm vào người chơi khác
  function playerMenu(r) {
    const w = $('player-menu');
    const mate = isMate(r.id);
    w.innerHTML = `<div class="sw-box small"><div class="sw-head"><b>${esc(r.name)}</b><button class="x" data-close>✕</button></div>
      <div class="sw-body"><div class="muted">Cấp ${r.lv} · ${esc(className(r.sc))}${mate ? ' · đồng đội' : ''}</div>
      <div class="btns">${mate ? '' : `<button class="btn small" data-pinv="${r.id}">Mời vào đội</button>`}
      <button class="btn small" data-tinv="${r.id}">Giao dịch</button>
      <button class="btn small ghost" data-block="${esc(r.name)}">Chặn chat</button></div></div></div>`;
    w.classList.remove('hidden');
  }

  // ------------------------------------------------------------ Giao dịch
  function onTrade(m) {
    const first = !T;
    T = { me: m.me, them: m.them, lockAt: m.lockAt, id: m.id };
    if (first) { U().closePanel(); UI.log(`[Giao dịch] Đang giao dịch với ${m.them.name}. Kiểm tra kỹ rồi bấm Khoá.`, '#80deea'); }
    renderTrade();
    clearInterval(tradeTimer);
    tradeTimer = setInterval(tickTrade, 200);
  }

  function tickTrade() {
    const b = document.querySelector('#trade-win [data-lock]');
    if (!T || !b) return;
    const wait = T.lockAt - Date.now();
    b.disabled = wait > 0 && !T.me.locked;
    b.textContent = T.me.locked ? 'Bỏ khoá' : wait > 0 ? `Khoá (${Math.ceil(wait / 100) / 10}s)` : 'Khoá';
  }

  function renderTrade() {
    const w = $('trade-win');
    if (!T) { w.classList.add('hidden'); return; }
    const offered = new Set(T.me.items.map((e) => e.uid));
    const side = (s, mine) => {
      const cells = s.items.map((e) => cell(e, (mine ? 'tm' : 'tt') + e.uid, mine ? `data-unset="${e.uid}"` : '')).join('') || '<span class="muted">Chưa đặt gì</span>';
      return `<div class="ts ${s.locked ? 'locked' : ''}"><div class="th">${mine ? 'Bạn đưa' : esc(T.them.name) + ' đưa'} ${s.locked ? '🔒' : ''}</div>
        <div class="grid tg">${cells}</div>
        <div class="tgold">${mine ? `🪙 <input type="number" min="0" step="1" value="${s.gold}" data-gold> xu` : `🪙 ${fmt(s.gold)} xu`}</div></div>`;
    };
    const bag = (App.player.bag || []).filter((e) => !offered.has(e.uid) && G.ITEMS[e.id] && G.ITEMS[e.id].kind !== 'quest');
    w.innerHTML = `<div class="sw-box wide"><div class="sw-head"><b>Giao dịch với ${esc(T.them.name)} <small>Lv.${T.them.lv}</small></b><button class="x" data-tcancel>✕</button></div>
      <div class="sw-body"><div class="tcols">${side(T.me, true)}${side(T.them, false)}</div>
        <div class="th">Túi của bạn (bấm để đặt vào giao dịch, tối đa 8 món)</div>
        <div class="grid tbag">${bag.map((e) => cell(e, 'tb' + e.uid, `data-set="${e.uid}"`)).join('') || '<span class="muted">Túi trống</span>'}</div>
        <div class="btns"><button class="btn primary" data-lock>Khoá</button><button class="btn ghost" data-tcancel>Huỷ</button></div>
        <p class="note">Mọi thay đổi sẽ bỏ khoá cả hai bên. Chỉ khi cả hai cùng khoá, giao dịch mới được thực hiện.</p></div></div>`;
    w.classList.remove('hidden');
    tickTrade();
  }

  function pushOffer(items, gold) { send({ t: 'trade_set', items, gold }); }
  function curOffer() { return { items: T.me.items.map((e) => ({ uid: e.uid, qty: e.qty })), gold: T.me.gold }; }

  function onTradeEnd(m) {
    clearInterval(tradeTimer);
    T = null;
    renderTrade();
    hideTip();
    UI.log('[Giao dịch] ' + m.reason, m.done ? '#a5d6a7' : '#ffb74d', 9000);
    if (m.done) Sound.play('coin');
  }

  // ------------------------------------------------------------ Chợ
  const SLOT_OPTS = [['', 'Mọi loại'], ['stack', 'Vật phẩm thường'], ...G.SLOTS.map((s) => [s, G.SLOT_NAMES[s] || s])];

  function openMarket() {
    // Chợ là NPC trên bản đồ; mở bảng chợ ở đây chỉ khi đang đứng trong làng (server vẫn kiểm tra lại)
    $('market-win').classList.remove('hidden');
    market.tab = 'buy';
    browse(0);
  }
  function browse(page) {
    market.page = page;
    Net.action('market_browse', { q: market.q, slot: market.slot, sort: market.sort, page }, { silent: false }).then((r) => { if (r && r.ok === false) $('market-win').classList.add('hidden'); });
  }
  function onMarket(ev) {
    if (ev.kind === 'browse') { market.list = ev.list; market.total = ev.total; market.page = ev.page; market.per = ev.per; }
    else if (ev.kind === 'mine') { market.mine = ev.list; market.max = ev.max; }
    renderMarket();
  }

  const timeLeft = (ms) => { const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000); return h > 0 ? `${h}g${m}p` : `${m}p`; };
  function listingRow(l, mode) {
    const e = { ...l.inst, uid: 'L' + l.id };
    const def = G.ITEMS[e.id];
    const price = `<b class="gold">${fmt(l.price)}</b> xu`;
    const left = l.expired ? '<span class="bad">hết hạn</span>' : l.status === 'sold' ? '<span class="ok">đã bán</span>' : timeLeft(l.expires - Date.now());
    const act = mode === 'buy' ? `<button class="btn small primary" data-mbuy="${l.id}">Mua</button>`
      : l.status === 'active' ? `<button class="btn small" data-mcancel="${l.id}">${l.expired ? 'Lấy lại' : 'Huỷ'}</button>` : '';
    return `<div class="mrow">${cell(e, 'm' + l.id)}<div class="mi"><b>${esc(def ? def.name : '?')}${e.plus ? ' +' + e.plus : ''}${e.qty > 1 ? ' ×' + e.qty : ''}</b>
      <small>Cấp ${l.level}${mode === 'buy' ? ' · ' + esc(l.seller) : ''} · còn ${left}</small></div><div class="mp">${price}</div>${act}</div>`;
  }

  function renderMarket() {
    const w = $('market-win');
    if (w.classList.contains('hidden')) return;
    const tab = market.tab;
    let body = '';
    if (tab === 'buy') {
      const pages = Math.max(1, Math.ceil(market.total / market.per));
      body = `<div class="mfilter"><input data-mq placeholder="Tìm theo tên" value="${esc(market.q)}">
        <select data-mslot>${SLOT_OPTS.map(([k, n]) => `<option value="${k}" ${k === market.slot ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <select data-msort><option value="price_asc" ${market.sort === 'price_asc' ? 'selected' : ''}>Giá tăng</option><option value="price_desc" ${market.sort === 'price_desc' ? 'selected' : ''}>Giá giảm</option><option value="new" ${market.sort === 'new' ? 'selected' : ''}>Mới nhất</option></select>
        <button class="btn small" data-msearch>Tìm</button></div>
        <div class="mlist">${market.list.map((l) => listingRow(l, 'buy')).join('') || '<p class="muted">Chưa có món nào.</p>'}</div>
        <div class="btns"><button class="btn small ghost" data-mpage="${market.page - 1}" ${market.page <= 0 ? 'disabled' : ''}>‹</button><span class="muted">Trang ${market.page + 1}/${pages}</span><button class="btn small ghost" data-mpage="${market.page + 1}" ${market.page + 1 >= pages ? 'disabled' : ''}>›</button></div>`;
    } else if (tab === 'sell') {
      const bag = (App.player.bag || []).filter((e) => G.ITEMS[e.id] && G.ITEMS[e.id].kind !== 'quest');
      body = `<p class="note">Bấm vào món trong túi để đăng bán. Món sẽ được giữ ở chợ tới khi bán được, bạn huỷ, hoặc hết 48 giờ. Thuế 5% khi bán được. Tối đa ${market.max} tin.</p>
        <div class="grid tbag">${bag.map((e) => cell(e, 'ms' + e.uid, `data-msell="${e.uid}"`)).join('') || '<span class="muted">Túi trống</span>'}</div>`;
    } else {
      body = `<div class="mlist">${market.mine.map((l) => listingRow(l, 'mine')).join('') || '<p class="muted">Bạn chưa đăng bán món nào.</p>'}</div>`;
    }
    w.innerHTML = `<div class="sw-box wide"><div class="sw-head"><b>🛒 Chợ người chơi <small>🪙 ${fmt(App.player.gold)} xu</small></b><button class="x" data-close>✕</button></div>
      <div class="tabs"><button data-mtab="buy" class="${tab === 'buy' ? 'on' : ''}">Mua</button><button data-mtab="sell" class="${tab === 'sell' ? 'on' : ''}">Đăng bán</button><button data-mtab="mine" class="${tab === 'mine' ? 'on' : ''}">Tin của tôi</button></div>
      <div class="sw-body">${body}</div></div>`;
  }

  // ------------------------------------------------------------ Đóng cửa sổ
  function closeWin(id) { const w = $(id); if (w) w.classList.add('hidden'); hideTip(); }

  // ------------------------------------------------------------ Sự kiện bấm
  async function onClick(e) {
    const t = e.target;
    const q = (sel) => t.closest(sel);
    let el;
    if ((el = q('[data-pinv]'))) { send({ t: 'party_inv', to: Number(el.dataset.pinv) }); closeWin('player-menu'); return; }
    if ((el = q('[data-tinv]'))) { send({ t: 'trade_inv', to: Number(el.dataset.tinv) }); closeWin('player-menu'); return; }
    if ((el = q('[data-block]'))) { Chat.block(el.dataset.block); closeWin('player-menu'); return; }
    if (q('[data-act-party]')) { renderPartyWin(); return; }
    if (q('[data-leave]')) { send({ t: 'party_leave' }); return; }
    if ((el = q('[data-kick]'))) { send({ t: 'party_kick', id: Number(el.dataset.kick) }); return; }
    if ((el = q('[data-lead]'))) { send({ t: 'party_lead', id: Number(el.dataset.lead) }); return; }
    // giao dịch
    if (q('[data-tcancel]')) { send({ t: 'trade_cancel' }); return; }
    if (q('[data-lock]') && T) { send({ t: 'trade_lock', on: !T.me.locked }); return; }
    if ((el = q('[data-set]')) && T) {
      const entry = App.player.bag.find((b) => b.uid === Number(el.dataset.set));
      if (!entry) return;
      let qty = 1;
      if (G.ITEMS[entry.id].stack && entry.qty > 1) {
        qty = Math.floor(Number(window.prompt(`Đưa bao nhiêu ${G.ITEMS[entry.id].name}? (tối đa ${entry.qty})`, String(entry.qty))));
        if (!(qty >= 1)) return;
        qty = Math.min(qty, entry.qty);
      }
      const o = curOffer();
      if (o.items.length >= 8) { UI.log('Tối đa 8 món mỗi lần giao dịch.', '#ffb74d'); return; }
      o.items.push({ uid: entry.uid, qty });
      pushOffer(o.items, o.gold);
      return;
    }
    if ((el = q('[data-unset]')) && T) {
      const o = curOffer();
      pushOffer(o.items.filter((i) => i.uid !== Number(el.dataset.unset)), o.gold);
      return;
    }
    // chợ
    if ((el = q('[data-mtab]'))) {
      market.tab = el.dataset.mtab;
      if (market.tab === 'mine') Net.action('market_mine'); else if (market.tab === 'buy') browse(market.page); else renderMarket();
      return;
    }
    if (q('[data-msearch]')) {
      const w = $('market-win');
      market.q = w.querySelector('[data-mq]').value; market.slot = w.querySelector('[data-mslot]').value; market.sort = w.querySelector('[data-msort]').value;
      browse(0);
      return;
    }
    if ((el = q('[data-mpage]'))) { browse(Number(el.dataset.mpage)); return; }
    if ((el = q('[data-mbuy]'))) {
      const l = market.list.find((x) => x.id === Number(el.dataset.mbuy));
      if (!l) return;
      const def = G.ITEMS[l.inst.id];
      if (!window.confirm(`Mua ${def ? def.name : 'món này'}${l.inst.qty > 1 ? ' ×' + l.inst.qty : ''} với giá ${fmt(l.price)} xu?`)) return;
      el.disabled = true;
      await Net.action('market_buy', { id: l.id });
      browse(market.page);
      renderMarket();
      return;
    }
    if ((el = q('[data-mcancel]'))) {
      await Net.action('market_cancel', { id: Number(el.dataset.mcancel) });
      Net.action('market_mine');
      return;
    }
    if ((el = q('[data-msell]'))) {
      const entry = App.player.bag.find((b) => b.uid === Number(el.dataset.msell));
      if (!entry) return;
      const def = G.ITEMS[entry.id];
      let qty = entry.qty;
      if (def.stack && entry.qty > 1) {
        qty = Math.floor(Number(window.prompt(`Bán bao nhiêu ${def.name}? (tối đa ${entry.qty})`, String(entry.qty))));
        if (!(qty >= 1)) return;
        qty = Math.min(qty, entry.qty);
      }
      const suggest = G.sellPrice ? Math.max(1, G.sellPrice(entry) * qty * 2) : 100;
      const price = Math.floor(Number(window.prompt(`Giá bán cho cả ${def.name}${qty > 1 ? ' ×' + qty : ''} (xu):`, String(suggest))));
      if (!(price >= 1)) return;
      await Net.action('market_list', { uid: entry.uid, qty, price });
      renderMarket();
      return;
    }
    if (q('[data-close]')) { const w = t.closest('.swin'); if (w) w.classList.add('hidden'); hideTip(); }
  }

  // ------------------------------------------------------------ Khởi tạo
  function init() {
    for (const id of ['player-menu', 'trade-win', 'market-win']) {
      const w = $(id);
      w.addEventListener('click', onClick);
      w.addEventListener('mouseover', (e) => tipFor(e.target));
      w.addEventListener('mouseleave', hideTip);
      w.addEventListener('change', (e) => {
        if (e.target.matches('[data-gold]') && T) {
          const o = curOffer();
          pushOffer(o.items, Math.max(0, Math.floor(Number(e.target.value) || 0)));
        }
      });
    }
    $('party-hud').addEventListener('click', onClick);
    // Chợ mở từ NPC chợ trên bản đồ (xem ui/panels/npc.js), không còn nút trên HUD.
    // Mở bảng khác (túi, nhân vật...) thì khung chợ / giao dịch không che
  }

  function onMessage(m) {
    switch (m.t) {
      case 'party': onParty(m); break;
      case 'party_inv': toast('party', `${m.from.name} (Lv.${m.from.lv}) mời bạn vào đội`, m.ms || 30000,
        () => send({ t: 'party_resp', ok: true }), () => send({ t: 'party_resp', ok: false })); break;
      case 'trade_inv': toast('trade', `${m.from.name} (Lv.${m.from.lv}) muốn giao dịch với bạn`, m.ms || 30000,
        () => send({ t: 'trade_resp', ok: true }), () => send({ t: 'trade_resp', ok: false })); break;
      case 'trade': onTrade(m); break;
      case 'trade_end': onTradeEnd(m); break;
      case 'patch': Net.pushPatch(m); if (T) renderTrade(); break;
      case 'offline': party = null; mates.clear(); renderParty(); if (T) onTradeEnd({ reason: 'Mất kết nối, giao dịch bị huỷ.' }); break;
    }
  }

  // ------------------------------------------------------------ Hành động đội nhóm (gọi từ tab Hội nhóm)
  function invite(id) { send({ t: 'party_inv', to: Number(id) }); }
  function tradeInvite(id) { send({ t: 'trade_inv', to: Number(id) }); }
  function leave() { send({ t: 'party_leave' }); }
  function lead(id) { send({ t: 'party_lead', id: Number(id) }); }
  function kick(id) { send({ t: 'party_kick', id: Number(id) }); }

  Object.assign(UI._, { panelParty, invite, tradeInvite, leave, lead, kick });
  Object.assign(UI._.PANELS, { party: panelParty });

  return { init, onMessage, onMarket, playerMenu, isMate, openMarket, panelParty, invite, tradeInvite, leave, lead, kick, get party() { return party; } };
})();
window.Social = Social;
