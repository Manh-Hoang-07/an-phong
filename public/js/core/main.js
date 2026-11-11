'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  let game = null;

  async function boot() {
    let me;
    try { me = await Net.me(); } catch { me = { error: 'Không kết nối được server.' }; }
    if (me.user && me.player) { Loading.set(0.15, 'Đang vào game...'); startGame(me.player); }
    else { Loading.hide(); showLogin(me.registerOpen, me.error); }
    registerServiceWorker();
    setupInstallTip();
  }

  // ------------------------------------------------------------ iPhone: chơi như ứng dụng
  // Safari trên iPhone KHÔNG cho trang web vào toàn màn hình (không có requestFullscreen, không khóa được hướng xoay)
  // nên thanh địa chỉ luôn còn. Cách duy nhất để mất thanh địa chỉ: "Thêm vào Màn hình chính" rồi mở từ biểu tượng
  // (chạy kiểu ứng dụng, xem manifest.webmanifest + thẻ apple-mobile-web-app-* trong index.html).
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  if (isIOS) document.body.classList.add('ios');
  if (isStandalone()) document.body.classList.add('standalone');

  function showInstallTip(force) {
    const tip = $('install-tip');
    if (!tip || !isIOS || isStandalone()) return false;
    let hiddenAt = 0;
    try { hiddenAt = +localStorage.getItem('tt_install_tip') || 0; } catch { /* bỏ qua */ }
    if (!force && Date.now() - hiddenAt < 3 * 864e5) return false;   // đã tắt thì 3 ngày sau mới nhắc lại
    tip.classList.remove('hidden');
    return true;
  }
  function setupInstallTip() {
    const close = $('install-close');
    if (!close) return;
    close.onclick = () => {
      $('install-tip').classList.add('hidden');
      try { localStorage.setItem('tt_install_tip', String(Date.now())); } catch { /* bỏ qua */ }
    };
    showInstallTip(false);
  }

  // Lưu sẵn code, hình, font trên máy để lần sau mở game gần như tức thì (cần HTTPS hoặc localhost)
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    if (new URLSearchParams(location.search).has('nosw')) return;
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { /* bỏ qua */ }));
    if (document.readyState === 'complete') navigator.serviceWorker.register('/sw.js').catch(() => { /* bỏ qua */ });
  }

  // ------------------------------------------------------------ Đăng nhập / Đăng ký
  function showLogin(registerOpen, error) {
    $('login').classList.remove('hidden');
    let mode = 'login';   // 'login' | 'register'
    const canRegister = !!registerOpen;

    function render() {
      const reg = mode === 'register';
      $('lf-char').classList.toggle('hidden', !reg);
      $('lf-submit').textContent = reg ? 'Tạo tài khoản và vào game' : 'Vào game';
      $('lf-pass').autocomplete = reg ? 'new-password' : 'current-password';
      $('lf-note').textContent = reg
        ? 'Tạo tài khoản mới để bắt đầu hành trình.'
        : (canRegister ? '' : 'Đăng ký hiện đang đóng.');
      const toggle = $('lf-toggle');
      toggle.classList.toggle('hidden', !canRegister);
      toggle.textContent = reg ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký';
    }

    $('lf-toggle').onclick = () => {
      mode = mode === 'register' ? 'login' : 'register';
      $('lf-error').textContent = '';
      render();
      $('lf-user').focus();
    };

    render();
    if (error) $('lf-error').textContent = error;
    $('login-form').onsubmit = async (e) => {
      e.preventDefault();
      $('lf-error').textContent = '';
      $('lf-submit').disabled = true;
      const u = $('lf-user').value.trim(), p = $('lf-pass').value;
      const r = mode === 'register'
        ? await Net.register(u, p, $('lf-char').value.trim() || u)
        : await Net.login(u, p);
      $('lf-submit').disabled = false;
      if (!r.ok) { $('lf-error').textContent = r.error || 'Có lỗi xảy ra.'; return; }
      const me = await Net.me();
      $('login').classList.add('hidden');
      Loading.show('Đang vào game...');
      startGame(me.player);
    };
    $('lf-user').focus();
  }

  // ------------------------------------------------------------ Vào game
  async function startGame(player) {
    // Font đã bắt đầu tải từ <head> (early.js) nên thường xong rồi; chờ tối đa 600ms để chữ trong game đúng font
    try { await Promise.race([document.fonts.load('16px "Be Vietnam Pro"', 'Thức Tỉnh'), new Promise(r => setTimeout(r, 600))]); } catch { /* bỏ qua */ }
    App.hp = 0; App.mp = 0;
    App.player = player;
    App.form = false;
    App.stats = GameData.calcStats(player, { form: false });
    App.hp = player.hp ?? App.stats.maxHp;
    App.mp = player.mp ?? App.stats.maxMp;
    App.sta = App.stats.maxSta; App.staLocked = false;   // thể lực luôn đầy khi vào game
    $('game-wrap').classList.remove('hidden');
    $('hud').classList.remove('hidden');
    UI.init();
    setupKeyboard();
    setupTouch();
    ScreenRot.update();

    View.calc();
    game = new Phaser.Game({
      type: new URLSearchParams(location.search).has('canvas') ? Phaser.CANVAS : Phaser.AUTO,   // ?canvas=1 : dùng khi kiểm thử máy không có WebGL
      parent: 'game',
      width: View.pw,
      height: View.ph,
      backgroundColor: '#000000',
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: { default: 'arcade', arcade: { gravity: { y: 1300 }, debug: false } },
      input: { keyboard: false },
      // ?timer=1 : chạy vòng lặp bằng setTimeout (dùng khi kiểm thử tự động)
      fps: new URLSearchParams(location.search).has('timer') ? { forceSetTimeOut: true, target: 60 } : {},
      scene: [WorldScene],
    });
    // Canvas đã vẽ đúng điểm ảnh màn hình; nếu trình duyệt còn phải co giãn chút ít thì cho mượt thay vì răng cưa
    // (Phaser có thể khởi động ở nhịp kế tiếp, lúc này game.canvas còn null → chờ sự kiện 'ready')
    if (game.canvas) game.canvas.style.imageRendering = 'auto';
    else game.events.once('ready', () => { if (game.canvas) game.canvas.style.imageRendering = 'auto'; });
    patchScaleForRotation(game);
    App.refit = fitGame;
    UI.refresh();
    UI.log(`[Hệ thống] Chào mừng thợ săn ${player.name}. Tiến trình được tự động lưu.`, '#ffd54f');
    const q0 = GameData.QUESTS[player.quest.step];
    if (q0 && player.quest.state === 'none' && player.quest.step <= 1) {
      const who = GameData.NPCS[q0.npc].name;
      UI.log(document.body.classList.contains('touch')
        ? `Hãy đến gần ${who} rồi bấm nút 💬 Nói chuyện.`
        : `Hãy đến nói chuyện với ${who} (đi tới gần và bấm F).`, '#a5d6a7');
    }

    window.addEventListener('pagehide', Net.saveOnExit);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Net.saveOnExit(); });
    App.logout = async () => {
      Net.saveOnExit();
      await Net.logout();
      location.reload();
    };
  }

  // ------------------------------------------------------------ Bàn phím
  function setupKeyboard() {
    const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    const gameKeys = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
    window.addEventListener('keydown', (e) => {
      if (typing(e)) return;
      if (gameKeys.has(e.code)) e.preventDefault();
      if (e.code === 'Escape') { UI.closePanel(); return; }
      const panels = { KeyI: 'bag', KeyB: 'bag', KeyC: 'char', KeyK: 'skills', KeyL: 'quest', KeyM: 'map' };
      if (panels[e.code] && !e.repeat) { UI.openPanel(panels[e.code]); return; }
      if (App.panelOpen) return;
      if (!e.repeat) App.keys['_p_' + e.code] = true;
      App.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { App.keys[e.code] = false; });
    window.addEventListener('blur', () => { App.keys = {}; });
  }

  // ------------------------------------------------------------ Luôn chơi màn hình ngang trên điện thoại
  // iPhone không cho trang web khóa hướng xoay. Nên khi máy đang cầm DỌC, ta tự xoay cả khung game 90° bằng CSS:
  // khung có kích thước (cao × rộng) của màn hình rồi quay sang ngang. Cầm ngang thật thì không xoay gì.
  // Kích thước khung game thật lấy qua ScreenRot.size() (View.calc dùng), không dùng thẳng innerWidth/innerHeight.
  const ScreenRot = window.ScreenRot = {
    on: false,
    size() { const w = window.innerWidth, h = window.innerHeight; return this.on ? { w: h, h: w } : { w, h }; },
    update() {
      const W = window.innerWidth, H = window.innerHeight;
      this.on = document.body.classList.contains('touch') && H > W;
      const root = document.documentElement, wrap = $('game-wrap');
      root.classList.toggle('rot', this.on);
      if (this.on) {
        // Điểm (x, y) trong khung → màn hình (W − y, x): xoay 90° theo chiều kim đồng hồ quanh góc trên-trái rồi dời sang phải W
        wrap.style.width = H + 'px'; wrap.style.height = W + 'px';
        wrap.style.transform = `translateX(${W}px) rotate(90deg)`;
      } else {
        wrap.style.width = wrap.style.height = wrap.style.transform = '';
      }
      // Kích thước khung game cho CSS (thay cho 100vw / 100vh vốn tính theo màn hình chưa xoay)
      const s = this.size();
      root.style.setProperty('--gw', s.w + 'px');
      root.style.setProperty('--gh', s.h + 'px');
      // Màn hình thấp (điện thoại nằm ngang): giao diện gọn hơn
      root.classList.toggle('compact', s.h <= 500);
      root.classList.toggle('narrow', s.w <= 600);
    },
    // Tọa độ trên màn hình → tọa độ trong khung game (chưa xoay)
    toLocal(x, y) { return this.on ? [y, window.innerWidth - x] : [x, y]; },
  };

  // Phaser đo khung bằng getBoundingClientRect (ra kích thước ĐÃ xoay) → đo bằng kích thước bố cục thay thế,
  // và đổi tọa độ chạm về khung chưa xoay (chạm vào NPC để nói chuyện vẫn trúng).
  function patchScaleForRotation(g) {
    const sm = g.scale;
    sm.getParentBounds = function () {
      const el = this.parent;
      if (!el) return false;
      const w = el.clientWidth, h = el.clientHeight;
      if (this.parentSize.width !== w || this.parentSize.height !== h) { this.parentSize.setSize(w, h); return true; }
      return false;
    };
    // #game đã tự căn giữa canvas bằng flexbox (style.css); Phaser tính margin căn giữa bằng kích thước đã xoay → bỏ
    sm.updateCenter = function () { this.canvas.style.marginLeft = '0px'; this.canvas.style.marginTop = '0px'; };
    sm.updateBounds = function () {
      const c = this.canvas, b = this.canvasBounds;
      let x = 0, y = 0;
      for (let el = c; el; el = el.offsetParent) { x += el.offsetLeft; y += el.offsetTop; }
      b.x = x; b.y = y; b.width = c.offsetWidth; b.height = c.offsetHeight;
    };
    const im = g.input;
    const orig = im.transformPointer;
    im.transformPointer = function (pointer, pageX, pageY, wasMove) {
      const [x, y] = ScreenRot.toLocal(pageX, pageY);
      return orig.call(this, pointer, x, y, wasMove);
    };
  }

  // ------------------------------------------------------------ Cảm ứng
  // ?touch=1 để ép hiện điều khiển cảm ứng (thử trên máy tính)
  function isTouchDevice() {
    return matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
  }

  async function goFullscreen() {
    const el = document.documentElement;
    // iPhone không có toàn màn hình cho trang web → hướng dẫn cài như ứng dụng
    if (isIOS && !el.requestFullscreen && !el.webkitRequestFullscreen) { showInstallTip(true); return; }
    try {
      if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
    } catch { /* trình duyệt không hỗ trợ thì thôi */ }
  }

  function setupTouch() {
    App.fullscreen = goFullscreen;
    if (!isTouchDevice()) return;
    document.body.classList.add('touch');
    $('touch').classList.remove('hidden');
    const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    let triedFull = standalone;
    const firstTouch = () => {
      if (!triedFull) { triedFull = true; goFullscreen(); }
    };

    // Nút bấm (hỗ trợ bấm nhiều nút cùng lúc)
    document.querySelectorAll('#touch [data-t]').forEach(b => {
      const name = b.dataset.t;
      const down = (e) => {
        e.preventDefault();
        try { b.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
        App.touch[name] = true; App.touch['_p_' + name] = true; b.classList.add('on');
        if (navigator.vibrate && name === 'attack') navigator.vibrate(8);
        firstTouch();
      };
      const up = (e) => { e.preventDefault(); App.touch[name] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    });

    // Cụm mũi tên ◀ ▲ ▶. Mỗi ngón tay điều khiển độc lập (đi + nhảy cùng lúc bằng hai ngón):
    //  - Chỉ ăn khi chạm TRÚNG nút (nới nhẹ ~8% bán kính); chạm vào khoảng trống quanh nút thì không đi.
    //  - Trượt ngón sang nút khác thì đổi hướng ngay; trượt chéo lên trên ◀ / ▶ thì vừa đi vừa nhảy.
    //  - Ngón trượt ra xa cụm nút thì thả hướng. Tọa độ lấy từ getBoundingClientRect nên đúng cả khi khung game bị xoay.
    const pad = $('arrows');
    const btn = {};
    for (const dir of ['left', 'up', 'right']) btn[dir] = pad.querySelector(`[data-arrow="${dir}"]`);
    const held = new Map();   // pointerId → Set các hướng
    const syncArrows = () => {
      const on = new Set();
      for (const set of held.values()) for (const d of set) on.add(d);
      // ▲ = nhảy: mỗi lần có ngón mới chạm / trượt vào là một cú nhảy
      if (on.has('up') && !App.touch.up) App.touch._p_jump = true;
      for (const dir of ['left', 'up', 'right']) {
        App.touch[dir] = on.has(dir);
        btn[dir].classList.toggle('on', on.has(dir));
      }
    };
    // Trả về: Set hướng nếu ngón nằm TRONG một nút; null nếu ngón ở khe giữa các nút (vẫn sát cụm);
    // Set rỗng nếu ngón ở xa. Chạm xuống chỉ ăn khi trúng nút (không còn chạm khoảng trống mà vẫn đi).
    const dirsAt = (e, sliding) => {
      const c = {};
      for (const dir in btn) { const r = btn[dir].getBoundingClientRect(); c[dir] = { x: r.left + r.width / 2, y: r.top + r.height / 2, s: Math.max(r.width, r.height) }; }
      const size = c.left.s, rad = size / 2;
      let best = null, bd = Infinity;
      for (const dir in c) { const d = Math.hypot(e.clientX - c[dir].x, e.clientY - c[dir].y); if (d < bd) { bd = d; best = dir; } }
      if (bd > rad * (sliding ? 1.2 : 1.08)) {
        // Đang trượt mà lọt vào khe giữa hai nút → giữ hướng cũ; ra hẳn ngoài cụm → thả
        return sliding && bd <= rad * 1.6 ? null : new Set();
      }
      const out = new Set([best]);
      if (best === 'up') {
        // trục ngang của cụm nút (từ ◀ sang ▶) → biết ngón lệch trái hay phải so với ▲
        const ax = c.right.x - c.left.x, ay = c.right.y - c.left.y, len = Math.hypot(ax, ay) || 1;
        const t = ((e.clientX - c.up.x) * ax + (e.clientY - c.up.y) * ay) / len;
        if (t < -size * 0.22) out.add('left'); else if (t > size * 0.22) out.add('right');
      }
      return out;
    };
    const sameSet = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      firstTouch();
      const dirs = dirsAt(e, false);
      if (!dirs.size) return;   // chạm vào khoảng trống → bỏ qua
      try { pad.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
      held.set(e.pointerId, dirs);
      syncArrows();
    });
    pad.addEventListener('pointermove', (e) => {
      if (!held.has(e.pointerId)) return;
      const dirs = dirsAt(e, true);
      if (dirs && !sameSet(dirs, held.get(e.pointerId))) { held.set(e.pointerId, dirs); syncArrows(); }
    });
    const release = (e) => { if (held.delete(e.pointerId)) syncArrows(); };
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('lostpointercapture', release);
    // Mở bảng / đổi tab / ẩn trang: nhả hết hướng để nhân vật không tự chạy tiếp
    const clearArrows = () => { if (held.size) { held.clear(); syncArrows(); } };
    new MutationObserver(() => { if (document.body.classList.contains('panel-open')) clearArrows(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', clearArrows);
    window.addEventListener('blur', clearArrows);

    // Chặn zoom và menu khi giữ ngón tay
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Khung hình game giãn theo tỉ lệ màn hình (điện thoại dài thì thấy rộng hơn, không có viền đen)
  // Kích thước canvas = khung logic × View.k (xem View trong scene/juice.js).
  function fitGame() {
    ScreenRot.update();
    if (!game || !game.scale) return;
    View.calc();
    if (game.scale.width !== View.pw || game.scale.height !== View.ph) game.scale.setGameSize(View.pw, View.ph);
    else game.scale.refresh();
  }
  // Điện thoại: thanh địa chỉ ẩn/hiện, xoay màn hình... không phải lúc nào cũng phát sự kiện resize của window
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => setTimeout(fitGame, 50));
  window.addEventListener('resize', () => setTimeout(fitGame, 50));
  // iOS (nhất là khi chạy như ứng dụng) đôi khi báo kích thước mới chậm sau khi xoay → đo lại thêm lần nữa
  window.addEventListener('orientationchange', () => { setTimeout(fitGame, 120); setTimeout(fitGame, 500); });

  boot();
})();
