'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  let game = null;

  async function boot() {
    let me;
    try { me = await Net.me(); } catch { me = { error: 'Không kết nối được server.' }; }
    $('loading').classList.add('hidden');
    if (me.user && me.player) startGame(me.player);
    else showLogin(me.registerOpen, me.error);
  }

  // ------------------------------------------------------------ Đăng nhập
  function showLogin(registerOpen, error) {
    $('login').classList.remove('hidden');
    const reg = !!registerOpen;
    $('lf-char').classList.toggle('hidden', !reg);
    $('lf-submit').textContent = reg ? 'Tạo tài khoản và vào game' : 'Vào game';
    $('lf-pass').autocomplete = reg ? 'new-password' : 'current-password';
    $('lf-note').textContent = reg ? 'Lần đầu chạy game: tạo tài khoản của bạn. Sau đó sẽ không ai tạo thêm tài khoản được.' : '';
    if (error) $('lf-error').textContent = error;
    $('login-form').onsubmit = async (e) => {
      e.preventDefault();
      $('lf-error').textContent = '';
      $('lf-submit').disabled = true;
      const u = $('lf-user').value.trim(), p = $('lf-pass').value;
      const r = reg ? await Net.register(u, p, $('lf-char').value.trim() || u) : await Net.login(u, p);
      $('lf-submit').disabled = false;
      if (!r.ok) { $('lf-error').textContent = r.error || 'Có lỗi xảy ra.'; return; }
      const me = await Net.me();
      $('login').classList.add('hidden');
      startGame(me.player);
    };
    $('lf-user').focus();
  }

  // ------------------------------------------------------------ Vào game
  async function startGame(player) {
    try { await Promise.race([document.fonts.load('16px "Be Vietnam Pro"'), new Promise(r => setTimeout(r, 1500))]); } catch { /* bỏ qua */ }
    App.hp = 0; App.mp = 0;
    App.player = player;
    App.stats = GameData.calcStats(player);
    App.hp = player.hp ?? App.stats.maxHp;
    App.mp = player.mp ?? App.stats.maxMp;
    $('game-wrap').classList.remove('hidden');
    $('hud').classList.remove('hidden');
    UI.init();
    setupKeyboard();
    setupTouch();

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: viewWidth(),
      height: VIEW_H,
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
    UI.refresh();
    UI.log(`[Hệ thống] Chào mừng thợ săn ${player.name}. Tiến trình được tự động lưu.`, '#ffd54f');
    if (player.quest.step === 0 && player.quest.state === 'none') {
      UI.log(document.body.classList.contains('touch')
        ? 'Hãy đến gần Hội trưởng Khải rồi bấm nút 💬 Nói chuyện.'
        : 'Hãy đến nói chuyện với Hội trưởng Khải (đi tới gần và bấm F).', '#a5d6a7');
    }

    window.addEventListener('pagehide', Net.saveOnExit);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Net.saveOnExit(); });
    $('btn-logout').addEventListener('click', async () => {
      Net.saveOnExit();
      await Net.logout();
      location.reload();
    });
  }

  // ------------------------------------------------------------ Bàn phím
  function setupKeyboard() {
    const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    const gameKeys = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
    window.addEventListener('keydown', (e) => {
      if (typing(e)) return;
      if (gameKeys.has(e.code)) e.preventDefault();
      if (e.code === 'Escape') { UI.closePanel(); return; }
      const panels = { KeyI: 'bag', KeyB: 'bag', KeyC: 'char', KeyK: 'skills', KeyL: 'quest' };
      if (panels[e.code] && !e.repeat) { UI.openPanel(panels[e.code]); return; }
      if (App.panelOpen) return;
      if (!e.repeat) App.keys['_p_' + e.code] = true;
      App.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { App.keys[e.code] = false; });
    window.addEventListener('blur', () => { App.keys = {}; });
  }

  // ------------------------------------------------------------ Cảm ứng
  // ?touch=1 để ép hiện điều khiển cảm ứng (thử trên máy tính)
  function isTouchDevice() {
    return matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
  }

  async function goFullscreen() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
    } catch { /* trình duyệt không hỗ trợ thì thôi */ }
  }

  function setupTouch() {
    if (!isTouchDevice()) return;
    document.body.classList.add('touch');
    $('touch').classList.remove('hidden');
    $('btn-full').classList.remove('hidden');
    $('btn-full').addEventListener('click', goFullscreen);
    const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    let triedFull = standalone;
    const firstTouch = () => {
      $('joy-tip').classList.add('gone');
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

    // Cần điều khiển nổi: chạm ở đâu thì cần hiện ở đó
    const zone = $('joy-zone'), base = $('joy-base'), knob = $('joy-knob');
    const R = 52;
    let active = null, cx = 0, cy = 0, upLatched = false;
    const reset = () => {
      active = null;
      App.touch.left = App.touch.right = App.touch.down = false;
      knob.style.transform = '';
      base.style.left = ''; base.style.bottom = ''; base.style.top = '';
      base.classList.remove('active');
    };
    zone.addEventListener('pointerdown', (e) => {
      if (active !== null) return;
      e.preventDefault();
      firstTouch();
      active = e.pointerId;
      try { zone.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
      const zr = zone.getBoundingClientRect();
      cx = Math.max(zr.left + 64, Math.min(zr.right - 64, e.clientX));
      cy = Math.max(zr.top + 64, Math.min(zr.bottom - 64, e.clientY));
      base.style.left = (cx - zr.left - 62) + 'px';
      base.style.top = (cy - zr.top - 62) + 'px';
      base.style.bottom = 'auto';
      base.classList.add('active');
      move(e);
    });
    const move = (e) => {
      if (e.pointerId !== active) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > R) { dx = dx / len * R; dy = dy / len * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      App.touch.left = dx < -14;
      App.touch.right = dx > 14;
      App.touch.down = dy > 32;
      if (dy < -36 && !upLatched) { App.touch._p_jump = true; upLatched = true; }
      if (dy > -18) upLatched = false;
    };
    zone.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId === active) reset(); };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    // Chặn zoom và menu khi giữ ngón tay
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Khung hình game giãn theo tỉ lệ màn hình (điện thoại dài thì thấy rộng hơn, không có viền đen)
  const VIEW_H = 540;
  function viewWidth() {
    const ratio = window.innerWidth / Math.max(1, window.innerHeight);
    return Math.round(Math.max(720, Math.min(1280, VIEW_H * ratio)));
  }
  function fitGame() {
    if (game && game.scale) game.scale.setGameSize(viewWidth(), VIEW_H);
  }
  window.addEventListener('resize', () => setTimeout(fitGame, 50));

  boot();
})();
