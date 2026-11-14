'use strict';
/* Kết nối thời gian thực (WebSocket /ws): thấy người chơi khác cùng bản đồ và chat.
 * Server: server/realtime/index.js. Mất kết nối thì tự nối lại; game vẫn chơi bình thường khi không có realtime. */
const Realtime = (() => {
  let ws = null, myId = null, retry = 0, timer = null, running = false;
  let sent = { map: null, x: 0, y: 0, f: 0, a: '', at: 0 };
  const listeners = new Set();   // cảnh game đang nghe (App.scene)
  const helloWaiters = [];

  function url() { return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'; }

  function connect() {
    if (!running || ws || !('WebSocket' in window)) return;
    let s;
    try { s = new WebSocket(url()); } catch { schedule(); return; }
    ws = s;
    s.onopen = () => { retry = 0; sent.map = null; };   // vào lại phòng ở gói vị trí kế tiếp
    s.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (m.t === 'hello') { myId = m.id; if (window.Chat) Chat.onOnline(true); helloWaiters.splice(0).forEach((fn) => fn()); }
      for (const fn of listeners) { try { fn(m); } catch (e) { console.error(e); } }
      if (window.Chat) Chat.onMessage(m);
      if (window.Social) Social.onMessage(m);
    };
    s.onclose = (ev) => {
      if (ws === s) ws = null;
      myId = null;
      for (const fn of listeners) { try { fn({ t: 'offline' }); } catch (e) { console.error(e); } }
      if (window.Social) Social.onMessage({ t: 'offline' });
      if (window.Chat) Chat.onOnline(false);
      // 4001: tài khoản mở ở nơi khác; 4003: phiên hết hạn → không nối lại
      if (ev.code === 4001) { if (window.UI) UI.log('[Hệ thống] Tài khoản đang chơi ở cửa sổ khác. Mở lại trang để nối lại chat và thấy người chơi.', '#ffb74d', 12000); return; }
      if (ev.code === 4003) return;
      schedule();
    };
    s.onerror = () => { /* onclose sẽ xử lý */ };
  }

  function schedule() {
    if (!running || timer) return;
    const wait = Math.min(10000, 1000 * Math.pow(1.6, retry++));
    timer = setTimeout(() => { timer = null; connect(); }, wait);
  }

  function send(obj) {
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  // Gửi vị trí: có thay đổi thì gửi ngay, đứng yên thì 1 giây một lần (để server biết còn sống)
  // enter = true: cảnh mới vừa dựng, xin server gửi lại danh sách người trong phòng
  function sendPos(map, x, y, f, a, enter, h) {
    x = Math.round(x); y = Math.round(y);
    const now = Date.now();
    const same = sent.map === map && sent.x === x && sent.y === y && sent.f === f && sent.a === a && sent.h === h;
    if (same && !enter && now - sent.at < 1000) return false;
    const msg = { t: 'pos', map, x, y, f, a };
    if (h != null) msg.h = h;   // % máu, chỉ để hiện trong đội
    if (enter) msg.r = 1;
    if (!send(msg)) return false;
    sent = { map, x, y, f, a, h, at: now };
    return true;
  }

  return {
    start() { running = true; connect(); },
    stop() { running = false; clearTimeout(timer); timer = null; if (ws) { try { ws.close(); } catch { /* bỏ qua */ } ws = null; } },
    send, sendPos,
    // Chờ kết nối xong (hoặc quá hạn) trước khi dựng cảnh: biết có quái do server quản lý hay phải chơi riêng lẻ
    ready(ms) { return new Promise((res) => { if (ws && ws.readyState === 1 && myId) return res(); helloWaiters.push(res); setTimeout(res, ms); }); },
    get myId() { return myId; },
    get online() { return !!(ws && ws.readyState === 1); },
    listen(fn) { listeners.add(fn); },
    unlisten(fn) { listeners.delete(fn); },
  };
})();

window.Realtime = Realtime;
