'use strict';
/* Trang admin (/admin.html). Gọi /api/admin/* bằng cookie đăng nhập của game; không phải admin thì server trả 404. */
(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
  const fmtTime = (ms) => (ms ? new Date(Number(ms)).toLocaleString('vi-VN') : '—');

  // Dựng phần tử bằng DOM (không dùng innerHTML với dữ liệu từ server)
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
    return el;
  }
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  async function api(route, body) {
    const res = await fetch('/api/admin/' + route, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body || {}),
    });
    let data = null;
    try { data = await res.json(); } catch { /* không phải JSON */ }
    if (res.status === 404) { const e = new Error('Không có quyền.'); e.status = 404; throw e; }
    if (!res.ok || !data || !data.ok) throw new Error((data && data.error) || 'Lỗi ' + res.status);
    return data;
  }

  let msgTimer = 0;
  function say(text, good) {
    const el = $('msg');
    el.textContent = text;
    el.className = good ? 'ok' : 'bad';
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { el.className = ''; el.style.display = ''; }, good ? 5000 : 9000);
    el.style.display = 'block';
  }
  const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { say(e.message, false); } };

  let CAT = null;
  const nameOf = {};   // id vật phẩm → tên
  const skillName = {};   // id kỹ năng / Tuyệt Phẩm → tên
  const mountName = {};   // id thú → tên

  // ---------------------------------------------------------------- Khung nhập phần thưởng (dùng cho Tặng và Tạo mã)
  function rewardForm(root) {
    const num = (label, key, cap) => h('label', { class: 'f' }, label, h('input', { type: 'number', min: 0, max: cap, 'data-k': key, placeholder: '0' }));
    const items = h('div', { class: 'items' });
    // Phẩm chất + cấp cường hóa: chỉ dùng được với trang bị (chọn món khác thì hai ô này mờ đi)
    const QUALS = [[0, 'Phẩm chất: chuẩn'], [1, 'Thường'], [2, 'Tốt'], [3, 'Hiếm'], [4, 'Huyền thoại']];
    const gearOf = (txt) => { const m = /(([w-]+))s*$/.exec(txt.trim()); const it = CAT.items.find((x) => x.id === (m ? m[1] : txt.trim())); return !!(it && it.gear); };
    const addRow = () => {
      const idIn = h('input', { list: 'dl-items', placeholder: 'Vật phẩm (gõ tên để tìm)', 'data-it': 'id' });
      const qSel = h('select', { 'data-it': 'quality', title: 'Phẩm chất (chỉ trang bị)', disabled: true }, QUALS.map(([v, t]) => h('option', { value: v }, t)));
      const plusIn = h('input', { class: 'q', type: 'number', min: 0, max: CAT.caps.plusMax, value: 0, title: 'Cấp cường hóa +0…+' + CAT.caps.plusMax + ' (chỉ trang bị)', 'data-it': 'plus', disabled: true });
      idIn.addEventListener('input', () => { const g = gearOf(idIn.value); qSel.disabled = !g; plusIn.disabled = !g; if (!g) { qSel.value = '0'; plusIn.value = 0; } });
      items.append(h('div', { class: 'it' }, idIn,
        h('input', { class: 'q', type: 'number', min: 1, max: CAT.caps.itemQty, value: 1, 'data-it': 'n' }),
        qSel, plusIn,
        h('button', { type: 'button', onclick: (e) => e.target.parentNode.remove() }, '✕')));
    };
    const cls = h('select', { 'data-k': 'unlockClass' }, h('option', { value: '' }, '— không —'), CAT.schools.map((s) => h('option', { value: s.id }, s.name)));
    const mount = h('select', { 'data-k': 'mount' }, h('option', { value: '' }, '— không —'), CAT.mounts.map((m) => h('option', { value: m.id }, m.name)));
    clear(root).append(
      h('div', { class: 'grid' }, num('Xu', 'gold', CAT.caps.gold), num('Kinh nghiệm', 'exp', CAT.caps.exp),
        num('Linh Ngọc 💎', 'linhNgoc', CAT.caps.linhNgoc), num('Điểm kỹ năng', 'skillPoints', CAT.caps.skillPoints),
        h('label', { class: 'f' }, 'Mở khóa class đặc biệt', cls), h('label', { class: 'f' }, 'Thú đồng hành', mount)),
      h('div', { class: 'muted', style: 'margin:12px 0 6px;font-size:12px' }, 'Vật phẩm (gồm cả sách kỹ năng, sách tuyệt kỹ, bùa…)'),
      items, h('button', { type: 'button', onclick: addRow }, '+ Thêm vật phẩm'));
    addRow();
    return {
      // Trả { rewards, summary } hoặc ném lỗi nếu nhập sai
      read() {
        const r = {}, parts = [];
        for (const k of ['gold', 'exp', 'linhNgoc', 'skillPoints']) {
          const v = root.querySelector(`[data-k="${k}"]`).value.trim();
          if (v !== '') { r[k] = Number(v); if (r[k]) parts.push(`${fmt(r[k])} ${{ gold: 'xu', exp: 'kinh nghiệm', linhNgoc: 'Linh Ngọc', skillPoints: 'điểm kỹ năng' }[k]}`); }
        }
        const its = [];
        for (const row of items.querySelectorAll('.it')) {
          const txt = row.querySelector('[data-it="id"]').value.trim();
          if (!txt) continue;
          const m = /\(([\w\-]+)\)\s*$/.exec(txt);
          const id = m ? m[1] : txt;
          if (!nameOf[id]) throw new Error(`Không có vật phẩm "${txt}". Chọn từ danh sách gợi ý.`);
          const n = Number(row.querySelector('[data-it="n"]').value);
          const quality = Number(row.querySelector('[data-it="quality"]').value) || 0;
          const plus = Number(row.querySelector('[data-it="plus"]').value) || 0;
          const gear = quality || plus;
          its.push(gear ? [id, n, quality, plus] : [id, n]);
          parts.push(`${nameOf[id]}${plus ? ' +' + plus : ''} ×${n}${quality ? ' (' + QUALS[quality][1] + ')' : ''}`);
        }
        if (its.length) r.items = its;
        const c = cls.value; if (c) { r.unlockClass = c; parts.push('mở khóa ' + (CAT.schools.find((s) => s.id === c) || {}).name); }
        const m = mount.value; if (m) { r.mounts = [m]; parts.push('thú ' + (CAT.mounts.find((x) => x.id === m) || {}).name); }
        return { rewards: r, summary: parts.join(', ') };
      },
      reset() { rewardForm(root); },
    };
  }

  // ---------------------------------------------------------------- Người chơi
  let picked = null, grantForm = null;
  const find = guard(async () => {
    const q = $('q').value.trim();
    if (!q) return;
    const { users } = await api('find', { q });
    const box = clear($('found'));
    if (!users.length) { box.append(h('p', { class: 'muted' }, 'Không tìm thấy.')); return; }
    box.append(h('table', null,
      h('thead', null, h('tr', null, ['Nhân vật', 'Tài khoản', 'Cấp', 'Xu', 'Ngọc', 'Trạng thái', ''].map((t) => h('th', null, t)))),
      h('tbody', null, users.map((u) => h('tr', { class: picked && picked.id === u.id ? 'pick' : '' },
        h('td', null, u.name || '—'), h('td', null, u.username), h('td', null, u.level ?? '—'),
        h('td', { class: 'gold' }, u.gold == null ? '—' : fmt(u.gold)), h('td', { class: 'ngoc' }, fmt(u.ngoc)),
        h('td', null, u.online ? h('span', { class: 'tag ok' }, 'online') : '', u.banned ? h('span', { class: 'tag bad' }, 'bị khóa') : '', u.isAdmin ? h('span', { class: 'tag' }, 'admin') : ''),
        h('td', null, h('button', { onclick: () => choose(u) }, 'Chọn')))))));
  });

  function choose(u) {
    picked = u;
    $('grant-card').style.display = '';
    $('g-who').textContent = `${u.name || u.username} (${u.username})`;
    grantForm = rewardForm($('g-form'));
    const b = $('g-ban');
    b.textContent = u.banned ? 'Mở khóa tài khoản' : 'Khóa tài khoản';
    b.style.display = u.isAdmin ? 'none' : '';
    find();
    $('grant-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const send = guard(async () => {
    if (!picked) return;
    const { rewards, summary } = grantForm.read();
    if (!summary) { say('Chưa nhập phần thưởng nào.', false); return; }
    if (!confirm(`Tặng cho ${picked.name || picked.username}:\n${summary}`)) return;
    const r = await api('grant', { user: picked.id, rewards });
    say('Đã tặng: ' + summary + (picked.online ? ' (người chơi đang online, nhận ngay)' : ''), true);
    grantForm.reset();
    grantForm = rewardForm($('g-form'));
    find();
    return r;
  });

  const ban = guard(async () => {
    if (!picked) return;
    const on = !picked.banned;
    let reason = '';
    if (on) { reason = prompt('Lý do khóa (có thể để trống):', '') ; if (reason === null) return; }
    else if (!confirm('Mở khóa ' + picked.username + '?')) return;
    await api('ban', { user: picked.id, banned: on, reason });
    picked.banned = on;
    say((on ? 'Đã khóa ' : 'Đã mở khóa ') + picked.username + '.', true);
    choose(picked);
  });

  // ---------------------------------------------------------------- Thu hồi
  // Ngược chiều với Tặng: lấy đi, không hoàn điểm. Ô nhập nào để trống thì không đụng tới.
  let revPicked = null;
  let revHave = null;   // nhân vật hiện tại, để gợi ý và chặn nhập quá số đang có

  function revokeForm(root) {
    const num = (label, key, cap) => h('label', { class: 'f' }, label, h('input', { type: 'number', min: 0, max: cap, 'data-k': key, placeholder: '0' }));
    const items = h('div', { class: 'items' });
    const addRow = () => items.append(h('div', { class: 'it' },
      h('input', { list: 'dl-items', placeholder: 'Vật phẩm (gõ tên để tìm)', 'data-it': 'id' }),
      h('input', { class: 'q', type: 'number', min: 1, max: CAT.caps.itemQty, value: 1, 'data-it': 'n' }),
      h('button', { type: 'button', onclick: (e) => e.target.parentNode.remove() }, '✕')));
    const skills = h('div', { class: 'items' });
    const addSkill = () => skills.append(h('div', { class: 'it' },
      h('input', { list: 'dl-skills', placeholder: 'Kỹ năng (gõ tên để tìm)', 'data-sk': 'id' }),
      h('input', { class: 'q', type: 'number', min: 0, max: CAT.skillMax, value: 0, 'data-sk': 'cut', title: 'Số cấp giảm, 0 = xóa hẳn' }),
      h('button', { type: 'button', onclick: (e) => e.target.parentNode.remove() }, '✕')));
    const ults = h('div', { class: 'items' });
    const addUlt = () => ults.append(h('div', { class: 'it' },
      h('input', { list: 'dl-ults', placeholder: 'Tuyệt Phẩm (gõ tên để tìm)', 'data-ult': 'id' }),
      h('button', { type: 'button', onclick: (e) => e.target.parentNode.remove() }, '✕')));
    const mounts = h('div', { class: 'items' });
    const addMount = () => mounts.append(h('div', { class: 'it' },
      h('input', { list: 'dl-mounts', placeholder: 'Thú đồng hành (gõ tên để tìm)', 'data-mt': 'id' }),
      h('button', { type: 'button', onclick: (e) => e.target.parentNode.remove() }, '✕')));
    const cls = h('select', { 'data-k': 'unlockClass' }, h('option', { value: '' }, '— không —'), CAT.schools.map((s) => h('option', { value: s.id }, s.name)));

    clear(root).append(
      h('div', { class: 'grid' }, num('Xu', 'gold', CAT.caps.gold), num('Kinh nghiệm', 'exp', CAT.caps.exp),
        num('Linh Ngọc 💎', 'linhNgoc', CAT.caps.linhNgoc), num('Điểm kỹ năng', 'skillPoints', CAT.caps.skillPoints),
        num('Điểm tiềm năng', 'freePoints', CAT.caps.freePoints),
        h('label', { class: 'f' }, 'Gỡ mở khóa class', cls)),
      h('div', { class: 'muted', style: 'margin:12px 0 6px;font-size:12px' }, 'Vật phẩm trong túi'),
      items, h('button', { type: 'button', onclick: addRow }, '+ Thêm vật phẩm'),
      h('div', { class: 'muted', style: 'margin:12px 0 6px;font-size:12px' }, 'Kỹ năng (ô số = số cấp giảm, 0 = xóa hẳn)'),
      skills, h('button', { type: 'button', onclick: addSkill }, '+ Thêm kỹ năng'),
      h('div', { class: 'muted', style: 'margin:12px 0 6px;font-size:12px' }, 'Tuyệt Phẩm (thu hồi là mất, phải đọc sách lại)'),
      ults, h('button', { type: 'button', onclick: addUlt }, '+ Thêm Tuyệt Phẩm'),
      h('div', { class: 'muted', style: 'margin:12px 0 6px;font-size:12px' }, 'Thú đồng hành'),
      mounts, h('button', { type: 'button', onclick: addMount }, '+ Thêm thú'));
    addRow(); addSkill(); addUlt(); addMount();

    // Đọc một dòng "tên (id)" → id, kiểm tra có trong danh mục
    const readId = (txt, dict, label) => {
      const t = String(txt || '').trim();
      if (!t) return null;
      const m = /\(([\w\-]+)\)\s*$/.exec(t);
      const id = m ? m[1] : t;
      if (!dict[id]) throw new Error(`Không có ${label} "${t}". Chọn từ danh sách gợi ý.`);
      return id;
    };

    return {
      read() {
        const r = {}, parts = [];
        const labels = { gold: 'xu', exp: 'kinh nghiệm', linhNgoc: 'Linh Ngọc', skillPoints: 'điểm kỹ năng', freePoints: 'điểm tiềm năng' };
        for (const k of ['gold', 'exp', 'linhNgoc', 'skillPoints', 'freePoints']) {
          const v = root.querySelector(`[data-k="${k}"]`).value.trim();
          if (v !== '') { r[k] = Number(v); if (r[k]) parts.push(`−${fmt(r[k])} ${labels[k]}`); }
        }
        const its = [];
        for (const row of items.querySelectorAll('.it')) {
          const id = readId(row.querySelector('[data-it="id"]').value, nameOf, 'vật phẩm');
          if (!id) continue;
          const n = Number(row.querySelector('[data-it="n"]').value);
          its.push([id, n]); parts.push(`−${nameOf[id]} ×${n}`);
        }
        if (its.length) r.items = its;

        const sks = [];
        for (const row of skills.querySelectorAll('.it')) {
          const id = readId(row.querySelector('[data-sk="id"]').value, skillName, 'kỹ năng');
          if (!id) continue;
          const cut = Number(row.querySelector('[data-sk="cut"]').value || 0);
          sks.push([id, cut]);
          parts.push(cut === 0 ? `xóa ${skillName[id]}` : `−${cut} cấp ${skillName[id]}`);
        }
        if (sks.length) r.skills = sks;

        const us = [];
        for (const row of ults.querySelectorAll('.it')) {
          const id = readId(row.querySelector('[data-ult="id"]').value, skillName, 'Tuyệt Phẩm');
          if (!id) continue;
          us.push(id); parts.push(`xóa Tuyệt Phẩm ${skillName[id]}`);
        }
        if (us.length) r.superUlts = us;

        const ms = [];
        for (const row of mounts.querySelectorAll('.it')) {
          const id = readId(row.querySelector('[data-mt="id"]').value, mountName, 'thú');
          if (!id) continue;
          ms.push(id); parts.push(`xóa thú ${mountName[id]}`);
        }
        if (ms.length) r.mounts = ms;

        const c = cls.value;
        if (c) { r.unlockClass = c; parts.push('gỡ mở khóa ' + ((CAT.schools.find((s) => s.id === c) || {}).name || c)); }
        return { rewards: r, summary: parts.join(', ') };
      },
      reset() { revokeForm(root); },
    };
  }

  const revokeText = (t) => {
    const p = [];
    if (t.gold) p.push('−' + fmt(t.gold) + ' xu');
    if (t.exp) p.push('−' + fmt(t.exp) + ' kinh nghiệm');
    if (t.linhNgoc) p.push('−' + fmt(t.linhNgoc) + ' 💎');
    if (t.skillPoints) p.push('−' + fmt(t.skillPoints) + ' điểm kỹ năng');
    if (t.freePoints) p.push('−' + fmt(t.freePoints) + ' điểm tiềm năng');
    for (const [id, n] of t.items || []) p.push(`−${nameOf[id] || id} ×${n}`);
    for (const [id, n] of t.skills || []) p.push(`−${n} cấp ${skillName[id] || id}`);
    for (const id of t.superUlts || []) p.push('xóa Tuyệt Phẩm ' + (skillName[id] || id));
    for (const id of t.mounts || []) p.push('xóa thú ' + (mountName[id] || id));
    if (t.unlockClass) p.push('gỡ mở khóa ' + ((CAT.schools.find((s) => s.id === t.unlockClass) || {}).name || t.unlockClass));
    return p.join(', ') || '—';
  };

  let revForm = null;

  const revFind = guard(async () => {
    const q = $('r-q').value.trim();
    if (!q) return;
    const { users } = await api('find', { q });
    const box = clear($('r-found'));
    if (!users.length) { box.append(h('p', { class: 'muted' }, 'Không tìm thấy.')); return; }
    box.append(h('table', null,
      h('thead', null, h('tr', null, ['Nhân vật', 'Tài khoản', 'Cấp', 'Xu', 'Ngọc', ''].map((t) => h('th', null, t)))),
      h('tbody', null, users.map((u) => h('tr', { class: revPicked && revPicked.id === u.id ? 'pick' : '' },
        h('td', null, u.name || '—'), h('td', null, u.username), h('td', null, u.level ?? '—'),
        h('td', { class: 'gold' }, u.gold == null ? '—' : fmt(u.gold)), h('td', { class: 'ngoc' }, fmt(u.ngoc)),
        h('td', null, h('button', { onclick: () => revChoose(u) }, 'Chọn')))))));
  });

  const revChoose = guard(async (u) => {
    revPicked = u;
    const { player } = await api('detail', { user: u.id });
    revHave = player;
    $('revoke-card').style.display = '';
    $('r-who').textContent = `${u.name || u.username} (${u.username})`;
    const bits = [
      `${fmt(player.gold)} xu`, `${fmt(player.exp)} kinh nghiệm`, `${fmt(player.linhNgoc)} 💎`,
      `${fmt(player.skillPoints)} điểm kỹ năng`, `${fmt(player.freePoints)} điểm tiềm năng`,
      `${player.bag.length} loại vật phẩm`, `${player.skills.length} kỹ năng`,
      `${player.superUlts.length} Tuyệt Phẩm`, `${player.mounts.length} thú`,
    ];
    $('r-have').textContent = 'Đang có: ' + bits.join(' · ');
    revForm = revokeForm($('r-form'));
    revFind();
    $('revoke-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  const revSend = guard(async () => {
    if (!revPicked) return;
    const { rewards, summary } = revForm.read();
    if (!summary) { say('Chưa chọn thứ gì để thu hồi.', false); return; }
    if (!confirm(`Thu hồi của ${revPicked.name || revPicked.username}:\n${summary}\n\nLấy đi là mất, không hoàn điểm.`)) return;
    const r = await api('revoke', { user: revPicked.id, rewards });
    say('Đã thu hồi: ' + revokeText(r.taken) + (r.online ? ' (người chơi đang online, áp dụng ngay)' : ''), true);
    revForm.reset();
    revForm = revokeForm($('r-form'));
    revChoose(revPicked);
  });

  // ---------------------------------------------------------------- Tài khoản
  let accPicked = null;

  const accFind = guard(async () => {
    const q = $('a-q').value.trim();
    if (!q) return;
    const { users } = await api('find', { q });
    const box = clear($('a-found'));
    if (!users.length) { box.append(h('p', { class: 'muted' }, 'Không tìm thấy.')); return; }
    box.append(h('table', null,
      h('thead', null, h('tr', null, ['Nhân vật', 'Tài khoản', 'Trạng thái', ''].map((t) => h('th', null, t)))),
      h('tbody', null, users.map((u) => h('tr', { class: accPicked && accPicked.id === u.id ? 'pick' : '' },
        h('td', null, u.name || '—'), h('td', null, u.username),
        h('td', null, u.online ? h('span', { class: 'tag ok' }, 'online') : '', u.banned ? h('span', { class: 'tag bad' }, 'bị khóa') : '', u.isAdmin ? h('span', { class: 'tag' }, 'admin') : ''),
        h('td', null, h('button', { onclick: () => accChoose(u) }, 'Chọn')))))));
  });

  function accChoose(u) {
    accPicked = u;
    $('account-card').style.display = '';
    $('a-who').textContent = `${u.name || u.username} (${u.username})`;
    $('a-name').value = '';
    $('a-pass').value = '';
    $('a-name').placeholder = u.username;
    accFind();
    $('account-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const accSend = guard(async () => {
    if (!accPicked) return;
    const username = $('a-name').value.trim();
    const password = $('a-pass').value;
    if (!username && !password) { say('Nhập tên đăng nhập mới hoặc mật khẩu mới.', false); return; }
    const what = [username ? `tên đăng nhập → ${username}` : '', password ? 'mật khẩu mới' : ''].filter(Boolean).join(' và ');
    if (!confirm(`Đổi ${what} của tài khoản ${accPicked.username}?`)) return;
    const r = await api('account', { user: accPicked.id, username, password, logout: $('a-kick').checked });
    const done = [];
    if (r.changed.username) done.push(`tên ${r.changed.username.from} → ${r.changed.username.to}`);
    if (r.changed.password) done.push('mật khẩu');
    say('Đã đổi ' + done.join(' và ') + (r.changed.sessionsCleared ? '. Đã đăng xuất mọi phiên cũ.' : '.'), true);
    if (r.changed.username) accPicked.username = r.changed.username.to;
    $('a-pass').value = '';
    $('a-name').value = '';
    accChoose(accPicked);
  });

  // ---------------------------------------------------------------- Mật mã
  let codeForm = null;
  const rewardText = (r) => {
    const p = [];
    if (r.gold) p.push(fmt(r.gold) + ' xu');
    if (r.exp) p.push(fmt(r.exp) + ' kinh nghiệm');
    if (r.linhNgoc) p.push(fmt(r.linhNgoc) + ' 💎');
    if (r.skillPoints) p.push(fmt(r.skillPoints) + ' điểm kỹ năng');
    for (const [id, n] of r.items || []) p.push(`${nameOf[id] || id} ×${n}`);
    if (r.unlockClass) p.push('mở khóa ' + ((CAT.schools.find((s) => s.id === r.unlockClass) || {}).name || r.unlockClass));
    for (const m of r.mounts || []) p.push('thú ' + ((CAT.mounts.find((x) => x.id === m) || {}).name || m));
    return p.join(', ') || '—';
  };

  const loadCodes = guard(async () => {
    const { codes } = await api('codes/list');
    const box = clear($('c-list'));
    if (!codes.length) { box.append(h('p', { class: 'muted' }, 'Chưa có mã nào.')); return; }
    box.append(h('table', null,
      h('thead', null, h('tr', null, ['Mã', 'Quà', 'Lượt', 'Hạn', 'Ghi chú', ''].map((t) => h('th', null, t)))),
      h('tbody', null, codes.map((c) => h('tr', null,
        h('td', null, h('b', null, c.code)), h('td', null, rewardText(c.rewards)),
        h('td', null, `${c.uses}/${c.maxUses == null ? '∞' : c.maxUses}`),
        h('td', { class: c.expires && c.expires < Date.now() ? 'muted' : '' }, c.expires ? new Date(c.expires).toLocaleDateString('vi-VN') : 'không hạn'),
        h('td', { class: 'muted' }, c.note || ''),
        h('td', null, h('button', { class: 'danger', onclick: guard(async () => {
          if (!confirm('Xóa mã ' + c.code + '?')) return;
          await api('codes/remove', { code: c.code });
          say('Đã xóa mã ' + c.code, true); loadCodes();
        }) }, 'Xóa')))))));
  });

  const addCode = guard(async () => {
    const { rewards, summary } = codeForm.read();
    if (!summary) { say('Mã chưa có phần thưởng nào.', false); return; }
    let code = $('c-code').value.trim().toUpperCase();
    if (!code) code = 'QUA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const d = $('c-exp').value;
    const expires = d ? new Date(d + 'T23:59:59+07:00').getTime() : null;
    if (!confirm(`Tạo mã ${code}:\n${summary}`)) return;
    const r = await api('codes/add', { code, note: $('c-note').value, maxUses: $('c-max').value, expires, rewards });
    say((r.updated ? 'Đã cập nhật mã ' : 'Đã tạo mã ') + r.code, true);
    $('c-code').value = ''; $('c-max').value = ''; $('c-exp').value = ''; $('c-note').value = '';
    codeForm = rewardForm($('c-form'));
    loadCodes();
  });

  // ---------------------------------------------------------------- Nhật ký
  const ACTIONS = { grant: 'Tặng quà', revoke: 'Thu hồi', account: 'Đổi tài khoản', code_add: 'Tạo mã', code_update: 'Sửa mã', code_remove: 'Xóa mã', ban: 'Khóa', unban: 'Mở khóa' };
  const loadLog = guard(async () => {
    const { log } = await api('log');
    const box = clear($('l-list'));
    if (!log.length) { box.append(h('p', { class: 'muted' }, 'Chưa có thao tác nào.')); return; }
    box.append(h('table', null,
      h('thead', null, h('tr', null, ['Lúc', 'Admin', 'Việc', 'Người nhận', 'Chi tiết'].map((t) => h('th', null, t)))),
      h('tbody', null, log.map((l) => h('tr', null, h('td', null, fmtTime(l.at)), h('td', null, l.admin), h('td', null, ACTIONS[l.action] || l.action),
        h('td', null, l.target || '—'),
        h('td', null, h('pre', null, l.action === 'grant' || l.action === 'code_add' || l.action === 'code_update'
          ? rewardText(l.detail.rewards || l.detail) + (l.detail.code ? `  [${l.detail.code}]` : '')
          : l.action === 'revoke' ? revokeText(l.detail)
            : l.action === 'account' ? [
              l.detail.username ? `tên: ${l.detail.username.from} → ${l.detail.username.to}` : '',
              l.detail.password ? 'mật khẩu mới' : '',
              l.detail.sessionsCleared ? 'đã đăng xuất mọi phiên' : '',
            ].filter(Boolean).join(', ')
              : JSON.stringify(l.detail))))))));
  });

  // ---------------------------------------------------------------- Khởi động
  function gate(text, link) {
    const g = $('gate');
    clear(g).append(h('p', null, text), link ? h('a', { href: '/', style: 'color:#3fd0ff' }, 'Về trang game') : '');
    g.style.display = 'block';
  }

  async function init() {
    let me;
    try { me = await api('me'); }
    catch (e) {
      if (e.status === 404) gate('Cần đăng nhập bằng tài khoản admin. Hãy đăng nhập trong game rồi mở lại trang này.', true);
      else gate('Không kết nối được: ' + e.message, false);
      return;
    }
    CAT = await api('catalog');
    // Server chưa restart có thể trả catalog thiếu mảng mới → chuẩn hóa, để trang không chết trắng vì một field thiếu
    for (const k of ['items', 'schools', 'mounts', 'skills', 'superUlts']) if (!Array.isArray(CAT[k])) CAT[k] = [];
    CAT.caps = CAT.caps || {};
    CAT.skillMax = CAT.skillMax || 10;
    const dl = $('dl-items');
    for (const it of CAT.items) { nameOf[it.id] = it.name; dl.append(h('option', { value: `${it.name} (${it.id})` })); }
    for (const sk of CAT.skills) skillName[sk.id] = sk.name;
    for (const mt of CAT.mounts) mountName[mt.id] = mt.name;
    const dlS = $('dl-skills');
    for (const sk of CAT.skills.filter((s) => !(CAT.superUlts || []).some((u) => u.id === s.id))) {
      dlS.append(h('option', { value: `${sk.name} (${sk.id})` }));
    }
    const dlU = $('dl-ults');
    for (const sk of CAT.superUlts || []) dlU.append(h('option', { value: `${sk.name} (${sk.id})` }));
    const dlM = $('dl-mounts');
    for (const mt of CAT.mounts) dlM.append(h('option', { value: `${mt.name} (${mt.id})` }));
    $('who').textContent = 'Đăng nhập: ' + me.admin;
    $('app').style.display = '';
    codeForm = rewardForm($('c-form'));
    $('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') find(); });
    $('q-go').addEventListener('click', find);
    $('r-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') revFind(); });
    $('r-go').addEventListener('click', revFind);
    $('r-send').addEventListener('click', revSend);
    $('a-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') accFind(); });
    $('a-go').addEventListener('click', accFind);
    $('a-send').addEventListener('click', accSend);
    $('g-send').addEventListener('click', send);
    $('g-ban').addEventListener('click', ban);
    $('c-add').addEventListener('click', addCode);
    document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('on', x === b));
      document.querySelectorAll('section').forEach((s) => s.classList.toggle('on', s.id === 't-' + b.dataset.tab));
      if (b.dataset.tab === 'codes') loadCodes();
      if (b.dataset.tab === 'log') loadLog();
    }));
  }
  // Lỗi bất ngờ lúc khởi động: hiện lý do thay vì để trang trắng
  init().catch((e) => {
    console.error('Admin khởi động lỗi:', e);
    gate('Trang admin lỗi: ' + (e && e.message ? e.message : 'không rõ') + '. Tải lại trang (Ctrl+F5); nếu vẫn lỗi thì khởi động lại server.', true);
  });
})();
