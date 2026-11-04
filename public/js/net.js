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
};

const Net = (() => {
  async function req(url, body) {
    const opt = body === undefined
      ? { credentials: 'same-origin' }
      : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    const res = await fetch(url, opt);
    let data = {};
    try { data = await res.json(); } catch { /* bỏ qua */ }
    if (res.status === 401 && url === '/api/action') {
      UI.log('Phiên đăng nhập đã hết, đang tải lại...', '#ef5350');
      setTimeout(() => location.reload(), 1500);
    }
    if (!res.ok && !data.error) data.error = 'Lỗi kết nối (' + res.status + ')';
    return data;
  }

  // Các hành động gửi lần lượt từng cái một để server luôn thấy đúng thứ tự
  let queue = Promise.resolve();
  function action(type, params = {}, opts = {}) {
    const run = async () => {
      let data;
      try {
        data = await req('/api/action', { type, ...params });
      } catch (e) {
        data = { ok: false, error: 'Mất kết nối tới server.' };
      }
      if (data.player) App.setPlayer(data.player);
      if (data.ok === false && data.error && !opts.silent) UI.log(data.error, '#ef5350');
      if (data.events) for (const ev of data.events) App.onEvent(ev);
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
    me: () => req('/api/me'),
    login: (u, p) => req('/api/login', { username: u, password: p }),
    register: (u, p, c) => req('/api/register', { username: u, password: p, charName: c }),
    logout: () => req('/api/logout', {}),
    action, saveOnExit,
  };
})();

App.setPlayer = function (p) {
  App.player = p;
  App.stats = GameData.calcStats(p);
  App.hp = Math.min(App.hp, App.stats.maxHp);
  App.mp = Math.min(App.mp, App.stats.maxMp);
  UI.refresh();
};

App.onEvent = function (ev) {
  const sc = App.scene;
  switch (ev.t) {
    case 'msg': UI.log(ev.text, ev.color); break;
    case 'float': if (sc && sc.player) sc.floatText(sc.player.x, sc.player.y - 40, ev.text, ev.color); break;
    case 'levelup':
      App.hp = App.player.hp; App.mp = App.player.mp;
      UI.banner('THĂNG CẤP · Lv ' + ev.level, 2000);
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
    case 'upgrade': UI.upgradeResult(ev); break;
    case 'loot': if (sc && sc.addLoot) sc.addLoot(ev.loot, true); break;
    case 'picked': if (sc && sc.removeLoot) { sc.removeLoot(ev.lid, true); sc.lastLootError = null; } break;
  }
};
