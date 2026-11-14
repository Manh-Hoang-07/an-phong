'use strict';
/* Chat: kênh Map (người cùng bản đồ) và Thế giới. Mở ô nhập bằng phím / hoặc nút 💬.
 * Lệnh: /ds  /t <nội dung>  /m <nội dung>  /chan <tên>  /bochan <tên>  /help
 * Tin hiện trong khung log (UI.log) và bong bóng trên đầu nhân vật (scene/remote.js). */
const Chat = (() => {
  const COLORS = { map: '#e0f7fa', world: '#ffe082', party: '#a5d6a7' };
  const NAMES = { map: 'Map', world: 'Thế giới', party: 'Đội' };
  let ch = 'map', bar, input, chBtn;
  const blocked = new Set();
  try { for (const n of JSON.parse(localStorage.getItem('chatBlocked') || '[]')) blocked.add(String(n).toLowerCase()); } catch { /* bỏ qua */ }
  const saveBlocked = () => { try { localStorage.setItem('chatBlocked', JSON.stringify([...blocked])); } catch { /* bỏ qua */ } };
  const log = (t, c = '#bdbdbd', ms = 9000) => UI.log(t, c, ms);

  function setChannel(c) { ch = c; if (chBtn) chBtn.textContent = NAMES[ch]; }

  function open() {
    if (!bar) return;
    bar.classList.remove('hidden');
    App.keys = {}; App.touch = {};   // thả hết phím đang giữ để nhân vật không tự chạy
    input.focus();
  }
  function close() {
    if (!bar) return;
    input.value = '';
    input.blur();
    bar.classList.add('hidden');
  }

  function help() {
    log('Chat: /t <nội dung> = kênh Thế giới, /m = kênh Map, /ds = người trong map, /chan <tên> và /bochan <tên> = chặn / bỏ chặn.', '#80deea', 14000);
  }

  function submit(raw) {
    const text = raw.trim();
    if (!text) return;
    if (text[0] === '/') {
      const [cmd, ...rest] = text.slice(1).split(/\s+/);
      const arg = rest.join(' ');
      switch (cmd.toLowerCase()) {
        case 'ds': Realtime.send({ t: 'who' }) || log('Chưa kết nối chat.'); return;
        case 'help': case '?': help(); return;
        case 'chan': case 'bochan': {
          const n = arg.toLowerCase();
          if (!n) { log(blocked.size ? 'Đang chặn: ' + [...blocked].join(', ') : 'Chưa chặn ai.'); return; }
          if (cmd.toLowerCase() === 'chan') { blocked.add(n); log(`Đã chặn ${arg}. Gõ /bochan ${arg} để bỏ chặn.`); }
          else { blocked.delete(n); log(`Đã bỏ chặn ${arg}.`); }
          saveBlocked();
          return;
        }
        case 't': return send('world', arg);
        case 'p': return send('party', arg);
        case 'm': return send('map', arg);
        default: log('Lệnh không có. Gõ /help để xem danh sách.'); return;
      }
    }
    send(ch, text);
  }
  function send(channel, text) {
    if (!text.trim()) return;
    if (!Realtime.send({ t: 'chat', ch: channel, text })) log('Chưa kết nối chat, thử lại sau giây lát.', '#ffb74d');
  }

  function init() {
    bar = document.getElementById('chat-bar');
    input = document.getElementById('chat-input');
    chBtn = document.getElementById('chat-ch');
    if (!bar) return;
    setChannel('map');
    chBtn.addEventListener('click', () => { const order = ['map', 'world', 'party']; setChannel(order[(order.indexOf(ch) + 1) % order.length]); input.focus(); });
    bar.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; close(); submit(v); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
    document.getElementById('btn-chat').addEventListener('click', () => { if (bar.classList.contains('hidden')) open(); else close(); });
  }

  function onMessage(m) {
    if (m.t === 'chat') {
      if (blocked.has(String(m.name).toLowerCase())) return;
      log(`[${NAMES[m.ch] || 'Map'}] ${m.name}: ${m.text}`, COLORS[m.ch] || '#e0e0e0', 15000);
    } else if (m.t === 'who') {
      const list = m.list.map(p => `${p.name} (Lv.${p.lv})`).join(', ');
      log(`Trong map: ${m.list.length} người${list ? ' - ' + list : ''}. Online: ${m.online}.`, '#80deea', 14000);
    } else if (m.t === 'sys') log(m.text, '#ffb74d');
  }

  function onOnline(on) {
    if (on) log('[Hệ thống] Đã kết nối chat. Bấm / để nói chuyện, /help để xem lệnh.', '#a5d6a7', 9000);
  }

  function block(name) { blocked.add(String(name).toLowerCase()); saveBlocked(); log('Đã chặn ' + name + '. Gõ /bochan ' + name + ' để bỏ chặn.'); }

  return { init, open, close, onMessage, onOnline, block };
})();

window.Chat = Chat;
