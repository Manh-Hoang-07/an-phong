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
      // Tên nhân vật là bắt buộc khi đăng ký: không lặng lẽ lấy tên đăng nhập thay thế,
      // vì người chơi sẽ vào game với một cái tên mình chưa hề nhập.
      const charName = $('lf-char').value.trim();
      if (mode === 'register' && !charName) {
        $('lf-submit').disabled = false;
        $('lf-error').textContent = 'Hãy nhập tên nhân vật.';
        $('lf-char').focus();
        return;
      }
      const r = mode === 'register'
        ? await Net.register(u, p, charName)
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
      const panels = { KeyI: 'bag', KeyB: 'bag', KeyC: 'char', KeyK: 'skills', KeyL: 'quest', KeyM: 'map', KeyO: 'config' };
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

    // Nút ẩn/hiện kỹ năng (nhớ lựa chọn trên máy này)
    const tbtns = $('tbtns'), tgl = $('tb-toggle');
    const setSkills = (open) => {
      tbtns.classList.toggle('collapsed', !open);
      tgl.setAttribute('aria-expanded', String(open));
      try { localStorage.setItem('skillsOpen', open ? '1' : '0'); } catch { /* bỏ qua */ }
    };
    let skillsOpen = true;
    try { skillsOpen = localStorage.getItem('skillsOpen') !== '0'; } catch { /* bỏ qua */ }
    setSkills(skillsOpen);
    tgl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      firstTouch();
      setSkills(tbtns.classList.contains('collapsed'));
    });

    // Cụm mũi tên ◀ ▲ ▶: ngón đặt lên nút nào thì bắt đúng nút đó (trình duyệt tự xác định nút bị chạm,
    // nên đúng cả khi khung game bị xoay / thu phóng). Mỗi ngón độc lập → bấm 2 nút cùng lúc bằng 2 ngón.
    // Ngón đang giữ trượt sang nút khác thì đổi theo nút đó; trượt ra khoảng trống thì thả.
    // Chạm vào khoảng trống giữa các nút: không làm gì.
    const pad = $('arrows');
    const btn = {};
    for (const dir of ['left', 'up', 'right']) btn[dir] = pad.querySelector(`[data-arrow="${dir}"]`);
    const held = new Map();   // pointerId → hướng ('left' | 'up' | 'right' | null)
    const syncArrows = () => {
      const on = new Set(held.values());
      // ▲ = nhảy: mỗi lần có ngón mới chạm / trượt vào là một cú nhảy
      if (on.has('up') && !App.touch.up) App.touch._p_jump = true;
      for (const dir of ['left', 'up', 'right']) {
        App.touch[dir] = on.has(dir);
        btn[dir].classList.toggle('on', on.has(dir));
      }
    };
    const arrowAt = (x, y) => {
      const el = document.elementFromPoint(x, y);
      const b = el && el.closest && el.closest('[data-arrow]');
      return b && pad.contains(b) ? b.dataset.arrow : null;
    };
    for (const dir in btn) {
      const b = btn[dir];
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        firstTouch();
        try { b.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
        held.set(e.pointerId, dir);
        syncArrows();
      });
      b.addEventListener('pointermove', (e) => {
        if (!held.has(e.pointerId)) return;
        const d = arrowAt(e.clientX, e.clientY);
        if (d !== held.get(e.pointerId)) { held.set(e.pointerId, d); syncArrows(); }
      });
      const release = (e) => { if (held.delete(e.pointerId)) syncArrows(); };
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('lostpointercapture', release);
    }
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
