'use strict';
// Trạng thái dùng chung của client và giao tiếp với server
window.App = {
  player: null,     // dữ liệu nhân vật do server giữ
  stats: null,      // chỉ số tính từ GameData.calcStats
  hp: 0, mp: 0,     // máu, năng lượng hiện tại (client cập nhật liên tục, tự lưu định kỳ)
  scene: null,
  keys: {},         // phím đang giữ
  touch: {},        // nút cảm ứng đang giữ
  panelOpen: false,
  busy: false,
  // Giờ theo đồng hồ SERVER. Mốc thời gian server gửi về (vd. hạn đồ rơi trên đất) phải so với giờ này,
  // không so với Date.now(): điện thoại chỉnh giờ lệch vài phút là đồ rơi ra biến mất ngay lập tức.
  serverNow: () => Date.now() + (window.__clockSkew || 0),
};

const Net = (() => {
  async function req(url, body) {
    const opt = body === undefined
      ? { credentials: 'same-origin' }
      : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    const res = await fetch(url, opt);
    if (window.__noteServerTime) __noteServerTime(res);
    // Nginx trả 502/503/504 khi server Node đang khởi động lại → coi như rớt mạng để thử lại
    if (res.status >= 502 && res.status <= 504) throw new Error('gateway ' + res.status);
    let data = {};
    try { data = await res.json(); } catch { /* bỏ qua */ }
    if (res.status === 401 && url === '/api/action') {
      UI.log('Phiên đăng nhập đã hết, đang tải lại...', '#ef5350');
      setTimeout(() => location.reload(), 1500);
    }
    if (!res.ok && !data.error) data.error = 'Lỗi kết nối (' + res.status + ')';
    return data;
  }

  // Rớt mạng: tự gửi lại. Mỗi yêu cầu có mã riêng (rid) nên server không xử lý trùng nếu lượt trước thật ra đã tới nơi.
  //  - Ghi nhận hạ quái, lưu vị trí: thử lại tới khi được (không mất tiến trình)
  //  - Thao tác khác: thử lại 4 lần (khoảng 6 giây) rồi báo lỗi
  const KEEP_TRYING = new Set(['kills', 'save']);
  const ridBase = Math.random().toString(36).slice(2, 8);
  let ridSeq = 0, offline = false;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function setOffline(v) {
    if (v === offline) return;
    offline = v;
    if (v) UI.log('[Hệ thống] Mất kết nối, đang thử lại...', '#ffb74d');
    else UI.log('[Hệ thống] Đã kết nối lại.', '#a5d6a7');
  }
  async function send(type, params) {
    const rid = ridBase + '-' + (++ridSeq);
    for (let attempt = 0; ; attempt++) {
      try {
        const data = await req('/api/action', { type, ...params, rid });
        setOffline(false);
        return data;
      } catch (e) {
        if (attempt >= 4 && !KEEP_TRYING.has(type)) { return { ok: false, error: 'Mất kết nối tới server.' }; }
        if (attempt >= 1) setOffline(true);
        await sleep([300, 700, 1500, 3000][attempt] || 5000);
      }
    }
  }

  // Các hành động gửi lần lượt từng cái một để server luôn thấy đúng thứ tự
  let queue = Promise.resolve();
  let savePending = false;
  function action(type, params = {}, opts = {}) {
    // Lưu tự động: đang có một lượt lưu chờ gửi thì bỏ qua lượt mới (tránh dồn hàng khi mất mạng lâu)
    if (type === 'save') {
      if (savePending) return Promise.resolve({ ok: true, skipped: true });
      savePending = true;
    }
    const run = async () => {
      if (type === 'save') savePending = false;
      const data = await send(type, params);
      if (data.player) {
        // Server gửi cả nhân vật (lỗi đã hoàn tác, gửi lại cùng mã yêu cầu)
        App.rev = data.rev || 0;
        App.setPlayer(data.player);
      } else if (data.ok !== false && data.rev !== undefined) {
        // Server chỉ gửi phần đổi. Lệch số thứ tự (lỡ mất bản vá, mở nhiều tab) thì tải lại cả nhân vật.
        if (App.player && data.base === App.rev) {
          App.rev = data.rev;
          if (data.patch) App.applyPatch(data.patch);
          data.player = App.player;   // các chỗ gọi cũ vẫn đọc được res.player.map, res.player.hp...
        } else {
          const me = await req('/api/me');
          if (me && me.player) { App.rev = me.rev || 0; App.setPlayer(me.player); data.player = me.player; }
        }
      }
      if (data.ok === false && data.error && !opts.silent) { UI.log(data.error, '#ef5350'); Sound.play('error'); }
      // skipEvents: sự kiện client đã tự xử lý trước (ví dụ hồi máu ngay khi bấm bình)
      if (data.events) for (const ev of data.events) if (!(opts.skipEvents && opts.skipEvents.includes(ev.t))) App.onEvent(ev);
      if (type === 'kill') await new Promise(r => setTimeout(r, 130));
      return data;
    };
    const p = queue.then(run, run);
    queue = p.catch(() => {});
    return p;
  }

  // Lưu khi đóng tab
  function saveOnExit() {
    if (!App.player || !App.scene || !App.scene.player) return;
    const s = App.scene.saveState();
    try {
      fetch('/api/action', {
        method: 'POST', credentials: 'same-origin', keepalive: true,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'save', ...s }),
      }).catch(() => { /* mất mạng thì thôi, lần sau tự lưu */ });
    } catch { /* bỏ qua */ }
  }

  return {
    // Lần đầu dùng kết quả đã hỏi sẵn từ <head> (early.js), các lần sau hỏi lại server
    me: async () => {
      const early = window.__me;
      window.__me = null;
      let r = null;
      if (early) r = await early;
      if (!r) r = await req('/api/me');
      if (r && r.player) App.rev = r.rev || 0;
      return r;
    },
    login: (u, p) => req('/api/login', { username: u, password: p }),
    register: (u, p, c) => req('/api/register', { username: u, password: p, charName: c }),
    logout: () => req('/api/logout', {}),
    action, saveOnExit,
  };
})();

// Chỉ số hiện tại: đang biến hình (App.form) thì nhân thêm theo ấn thức tỉnh
App.form = false;
App.recalcStats = function () {
  App.form = !!App.player.formActive;
  if (App.form && !(App.player.awakenTier > 0)) App.form = false;
  App.stats = GameData.calcStats(App.player, { form: App.form });
  App.hp = Math.min(App.hp, App.stats.maxHp);
  App.mp = Math.min(App.mp, App.stats.maxMp);
};

// Ghép bản vá { set, del } từ server vào nhân vật. Tạo object mới (bản sao nông) để mọi nơi so sánh / cache
// theo App.player đều thấy là đã đổi; phần không đổi giữ nguyên tham chiếu.
App.applyPatch = function (patch) {
  const old = App.player;
  const p = Object.assign({}, old);
  for (const k of patch.del || []) delete p[k];
  Object.assign(p, patch.set);
  App.setPlayer(p, old);
};

App.setPlayer = function (p, prev) {
  const oldPlayer = prev || App.player, oldStats = App.stats;
  const formChanged = !!oldPlayer && (!!oldPlayer.formActive !== !!p.formActive || oldPlayer.formChoice !== p.formChoice);
  const hpRatio = formChanged && oldStats?.maxHp ? App.hp / oldStats.maxHp : null;
  const mpRatio = formChanged && oldStats?.maxMp ? App.mp / oldStats.maxMp : null;
  App.player = p;
  // Nhớ Ấn thức tỉnh người chơi đã chọn (Ấn I / Ấn II) để phím T không tự nhảy sang Ấn cao nhất
  if (p.formChoice === 'awaken1' || p.formChoice === 'awaken2') App.awakenPick = p.formChoice;
  else if (!App.awakenPick) App.awakenPick = (p.awakenTier || 0) >= 2 ? 'awaken2' : 'awaken1';
  App.form = !!p.formActive;
  App.stats = GameData.calcStats(p, { form: App.form });
  if (formChanged) {
    App.hp = Math.max(1, Math.round(App.stats.maxHp * hpRatio));
    App.mp = Math.max(0, Math.round(App.stats.maxMp * mpRatio));
  }
  App.hp = Math.min(App.hp, App.stats.maxHp);
  App.mp = Math.min(App.mp, App.stats.maxMp);
  if (App.sta != null) App.sta = Math.min(App.sta, App.stats.maxSta);
  UI.refresh();
};

App.onEvent = function (ev) {
  const sc = App.scene;
  switch (ev.t) {
    case 'form': App.form = !!ev.active;
      if (sc?.refreshPlayerLook) sc.refreshPlayerLook(); if (sc?.formStart && ev.active) sc.formStart(); else if (sc?.formStop && !ev.active) sc.formStop(); App.recalcStats(); UI.refresh(); break;
    case 'msg': UI.log(ev.text, ev.color); break;
    case 'float': if (sc && sc.player) sc.floatText(sc.player.x, sc.player.y - 40, ev.text, ev.color); if (/xu$/.test(ev.text)) Sound.play('coin'); break;
    case 'levelup':
      App.hp = App.player.hp; App.mp = App.player.mp;
      UI.banner('THĂNG CẤP · Lv ' + ev.level, 2000);
      Sound.play('levelup');
      if (sc) sc.levelUpFx();
      break;
    case 'heal':
      App.hp = Math.min(App.stats.maxHp, App.hp + ev.hp);
      App.mp = Math.min(App.stats.maxMp, App.mp + ev.mp);
      if (sc && sc.player) {
        if (ev.hp) sc.floatText(sc.player.x, sc.player.y - 30, '+' + ev.hp, '#69f0ae');
        if (ev.mp) sc.floatText(sc.player.x, sc.player.y - 46, '+' + ev.mp, '#64b5f6');
      }
      break;
    case 'cleanse':
      if (sc) sc.playerSlowUntil = 0;
      UI.banner('ĐÃ GIẢI HIỆU ỨNG', 1200);
      break;
    case 'side':
      UI.banner('PHỤ TUYẾN: ' + (ev.name || '').toUpperCase(), 2200);
      Sound.play('quest');
      break;
    case 'upgrade': UI.upgradeResult(ev); break;
    case 'school': App.hp = App.player.hp; App.mp = App.player.mp; break;
    case 'awaken': {
      App.hp = App.player.hp; App.mp = App.player.mp;
      const aw = GameData.awakenOf(App.player);
      UI.banner((aw ? aw.name : 'THỨC TỈNH').toUpperCase(), 2600);
      if (App.scene && App.scene.awakenFx) App.scene.awakenFx(ev.tier);
      if (App.scene && App.scene.prewarmForm) App.scene.prewarmForm();
      break;
    }
    case 'unlock': UI.banner('MỞ KHÓA CLASS ĐẶC BIỆT', 2200); break;
    case 'mount_new': UI.banner('THÚ TRIỆU HỒI MỚI · ' + (GameData.MOUNTS[ev.id] ? GameData.MOUNTS[ev.id].name.toUpperCase() : ''), 2200); Sound.play('levelup'); break;
    case 'rank':
      UI.banner('THỢ SĂN HẠNG ' + ev.rank, 2200);
      Sound.play('levelup');
      if (sc && sc.levelUpFx) sc.levelUpFx();
      break;
    case 'perk': {
      const pk = GameData.PERKS[ev.perk];
      UI.banner(pk ? `NỘI TẠI: ${pk.name.toUpperCase()}` : 'NHẬN NỘI TẠI CỐT TRUYỆN', 2200);
      Sound.play('levelup');
      break;
    }
    case 'loot': if (sc && sc.addLoot) sc.addLoot(ev.loot, true); break;
    case 'picked': Sound.play('pickup'); if (sc && sc.removeLoot) { sc.removeLoot(ev.lid, true); sc.lastLootError = null; } break;
  }
};
