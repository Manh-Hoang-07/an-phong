'use strict';
/*
 * Hiệu ứng hình ảnh làm game "có lực": tia lửa khi trúng đòn, bụi bước chân, tiếp đất,
 * phát sáng, camera phóng nhẹ khi chí mạng, quay chậm khi hạ trùm, thời tiết theo bản đồ.
 *
 * Tối ưu cho điện thoại:
 *  - Chất lượng đồ họa: Tự động / Cao / Thấp (chỉnh ở tab Nhân vật). Ở chế độ Tự động,
 *    nếu máy chạy chậm (khung hình trung bình > 24 ms trong vài giây) thì tự giảm hiệu ứng.
 *  - Chữ số sát thương dùng lại từ một "kho" có sẵn thay vì tạo mới mỗi lần.
 *  - Quái ở xa ngoài màn hình tạm dừng xử lý và không vẽ.
 */
const Quality = (() => {
  let mode = 'auto';
  try { mode = localStorage.getItem('tt_quality') || 'auto'; } catch { /* bỏ qua */ }
  let autoLow = false;
  return {
    get mode() { return mode; },
    set(m) { mode = m; try { localStorage.setItem('tt_quality', m); } catch { /* bỏ qua */ } },
    get low() { return mode === 'low' || (mode === 'auto' && autoLow); },
    markSlow() { if (mode === 'auto' && !autoLow) { autoLow = true; return true; } return false; },
  };
})();

const Juice = {
  setupJuice() {
    this.webgl = this.game.renderer.type === Phaser.WEBGL;
    this.makeJuiceTextures();
    const low = Quality.low;
    const dustTint = { city: 0x9aa0ad, forest: 0x8fbf9f, cave: 0x9a92c0, redgate: 0xc06070 }[this.theme] || 0xaaaaaa;
    // Tia lửa khi trúng đòn
    this.sparkEm = this.add.particles(0, 0, 'fx_spark', {
      speed: { min: 140, max: 360 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 },
      lifespan: { min: 160, max: 320 }, gravityY: 500, blendMode: 'ADD', emitting: false, maxParticles: 80,
    }).setDepth(9);
    this.critEm = this.add.particles(0, 0, 'fx_spark', {
      speed: { min: 220, max: 520 }, angle: { min: 0, max: 360 }, scale: { start: 1.6, end: 0 },
      lifespan: { min: 220, max: 420 }, gravityY: 300, tint: [0xffd54f, 0xffffff, 0xff9d4d], blendMode: 'ADD', emitting: false, maxParticles: 80,
    }).setDepth(9);
    // Bụi bước chân / tiếp đất
    this.dustEm = this.add.particles(0, 0, 'fx_dust', {
      speedX: { min: -50, max: 50 }, speedY: { min: -60, max: -10 }, scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.55, end: 0 }, lifespan: { min: 300, max: 520 }, tint: dustTint, emitting: false, maxParticles: 60,
    }).setDepth(3);
    this.stepAt = 0;
    this.wasGround = true;
    this.lastVy = 0;
    this.weather = [];
    if (!low) this.setupWeather();
    if (this.vignette) this.vignette.setVisible(!low);
    // Cổng phát sáng (chỉ 1–2 cổng mỗi bản đồ nên không tốn)
    if (!low) for (const pt of this.portals) this.glowObj(pt.img, 0x3fd0ff, 4);
    // Kho chữ nổi dùng lại
    this.textPool = [];
    // Theo dõi tốc độ khung hình để tự giảm hiệu ứng
    this.fpsSamples = [];
    this.fpsCheckAt = this.time.now + 4000;
  },

  makeJuiceTextures() {
    const mk = (key, w, h, draw) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false }); draw(g); g.generateTexture(key, w, h); g.destroy();
    };
    mk('fx_spark', 8, 8, (g) => { g.fillStyle(0xffffff, 0.35); g.fillCircle(4, 4, 4); g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 2); });
    mk('fx_dust', 12, 12, (g) => { for (let i = 6; i > 0; i--) { g.fillStyle(0xffffff, 0.12); g.fillCircle(6, 6, i); } });
    mk('fx_rain', 2, 16, (g) => { g.fillStyle(0xbfe3ff, 0.8); g.fillRect(0, 0, 2, 16); });
    mk('fx_fog', 256, 96, (g) => { for (let i = 12; i > 0; i--) { g.fillStyle(0xffffff, 0.035); g.fillEllipse(128, 48, 256 * i / 12, 96 * i / 12); } });
    mk('fx_ember', 6, 6, (g) => { g.fillStyle(0xff7a6e, 0.4); g.fillCircle(3, 3, 3); g.fillStyle(0xffd0c4, 1); g.fillCircle(3, 3, 1.4); });
  },

  // Thời tiết theo chủ đề bản đồ (đặt cố định theo màn hình)
  setupWeather() {
    const H = this.scale.height;
    if (this.theme === 'city') {
      this.weather.push(this.add.particles(0, -20, 'fx_rain', {
        x: { min: -100, max: 1400 }, speedY: { min: 680, max: 820 }, speedX: -90, lifespan: 900,
        quantity: 1, frequency: 28, alpha: { start: 0.35, end: 0.15 }, rotate: 7, maxParticles: 50,
      }).setScrollFactor(0).setDepth(20));
    } else if (this.theme === 'forest' || this.theme === 'cave') {
      // 3 lớp sương mỏng (ít lớp để điện thoại không phải vẽ chồng quá nhiều)
      const tint = this.theme === 'forest' ? 0xcff7ee : 0xb9a8ff;
      for (let i = 0; i < 3; i++) {
        const f = this.add.image(Math.random() * 1000, H * (0.5 + i * 0.12), 'fx_fog')
          .setScrollFactor(0.4 + i * 0.15).setDepth(i < 2 ? -3 : 7).setAlpha(this.theme === 'forest' ? 0.42 : 0.3)
          .setTint(tint).setScale(2.2, 1.1);
        this.tweens.add({ targets: f, x: f.x + 320, duration: 16000 + i * 3000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.weather.push(f);
      }
    } else if (this.theme === 'redgate') {
      this.weather.push(this.add.particles(0, 0, 'fx_ember', {
        x: { min: 0, max: 1300 }, y: { min: 380, max: 620 }, speedY: { min: -60, max: -20 }, speedX: { min: -15, max: 15 },
        lifespan: { min: 2500, max: 4000 }, alpha: { start: 0.9, end: 0 }, frequency: 160, blendMode: 'ADD', maxParticles: 30,
      }).setScrollFactor(0).setDepth(6));
    }
  },

  // Chuyển sang chế độ đồ họa thấp ngay lập tức
  applyLowQuality() {
    for (const w of this.weather) { this.tweens.killTweensOf(w); w.destroy(); }
    this.weather = [];
    if (this.vignette) this.vignette.setVisible(false);
    for (const pt of this.portals) if (pt.img.preFX) pt.img.preFX.clear();
    if (this.motes) for (const m of this.motes) { this.tweens.killTweensOf(m); m.destroy(); }
    this.motes = [];
  },

  // Gọi mỗi khung hình sau khi cập nhật người chơi
  juiceUpdate(time, onGround, move) {
    const pl = this.player, body = pl.body;
    // Bước chân: bụi + tiếng bước
    if (onGround && move && Math.abs(body.velocity.x) > 40 && time > this.stepAt) {
      this.stepAt = time + 250;
      if (!Quality.low) this.dustEm.explode(3, pl.x - this.facing * 6, body.bottom - 2);
      Sound.play('step');
    }
    // Tiếp đất sau cú rơi
    if (onGround && !this.wasGround && this.lastVy > 260) {
      this.dustEm.explode(this.lastVy > 600 ? 10 : 6, pl.x, body.bottom - 2);
      if (this.lastVy > 700) this.cameras.main.shake(90, 0.004);
      Sound.play('land');
    }
    this.wasGround = onGround;
    this.lastVy = body.velocity.y;
    // Nghiêng người theo hướng chạy (chỉ là hình, không ảnh hưởng va chạm)
    const target = !onGround ? 0 : move ? this.facing * 5 : 0;
    pl.angle += (target - pl.angle) * 0.25;

    // Tự giảm hiệu ứng nếu máy chạy chậm
    this.fpsSamples.push(this.game.loop.delta);
    if (time > this.fpsCheckAt) {
      const avg = this.fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.fpsSamples.length);
      this.fpsSamples = [];
      this.fpsCheckAt = time + 3000;
      if (avg > 24 && Quality.markSlow()) {
        this.applyLowQuality();
        UI.log('[Hệ thống] Máy chạy hơi chậm, đã tự giảm hiệu ứng để mượt hơn (chỉnh ở tab Nhân vật).', '#64b5f6');
      }
    }
  },

  jumpFx() {
    const pl = this.player;
    if (!Quality.low) this.dustEm.explode(4, pl.x, pl.body.bottom - 2);
    Sound.play('jump');
  },

  // Tia lửa khi đòn trúng; chí mạng thì tia vàng + camera phóng nhẹ
  hitFx(x, y, crit) {
    if (crit) {
      this.critEm.explode(Quality.low ? 6 : 12, x, y);
      this.zoomPunch(0.04, 120);
    } else this.sparkEm.explode(Quality.low ? 3 : 6, x, y);
  },

  // Phóng nhẹ camera rồi trở lại (tự tween, không dùng zoomTo vì gây giật khung hình)
  zoomPunch(amount = 0.04, ms = 120) {
    if (this.zoomTween && this.zoomTween.isPlaying()) return;
    const cam = this.cameras.main;
    this.zoomTween = this.tweens.addCounter({
      from: 1, to: 1 + amount, duration: ms / 2, yoyo: true, ease: 'Quad.out',
      onUpdate: (t) => cam.setZoom(t.getValue()),
      onComplete: () => cam.setZoom(1),
    });
  },

  // Quay chậm trong chốc lát (chỉ khi hạ trùm)
  slowMo(scale = 0.3, ms = 900) {
    this.time.timeScale = scale;
    this.tweens.timeScale = scale;
    this.physics.world.timeScale = 1 / scale;
    setTimeout(() => {
      if (!this.sys || !this.sys.isActive()) return;
      this.time.timeScale = 1; this.tweens.timeScale = 1; this.physics.world.timeScale = 1;
    }, ms);
  },

  // Phát sáng (WebGL). Chỉ dùng cho vật cố định, không dùng cho đạn bay (rất tốn trên điện thoại)
  glowObj(obj, color, strength = 3) {
    if (!this.webgl || !obj || !obj.preFX || Quality.low) return;
    try { obj.preFX.setPadding(8); obj.preFX.addGlow(color, strength, 0, false, 0.1, 8); } catch { /* bỏ qua */ }
  },

  // Đòn đánh thường có lực: nhích người về phía trước
  attackLunge() {
    const pl = this.player;
    if (this.dashing || this.time.now < (this.knockUntil || 0)) return;
    pl.body.setVelocityX(this.facing * 100);
    this.knockUntil = this.time.now + 70;
  },

  // Chữ nổi (số sát thương, kinh nghiệm...) lấy từ kho dùng lại
  floatText(x, y, text, color = '#fff', size = 14) {
    let t = this.textPool.pop();
    if (!t || !t.scene) {
      t = this.add.text(0, 0, '', {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20);
    }
    this.tweens.killTweensOf(t);
    t.setText(text).setColor(color).setFontSize(size).setPosition(x, y).setAlpha(1).setScale(1).setVisible(true).setActive(true);
    if (size >= 18 && !Quality.low) { t.setScale(0.4); this.tweens.add({ targets: t, scale: 1.25, duration: 120, yoyo: true, hold: 60, ease: 'Back.out' }); }
    this.tweens.add({
      targets: t, y: y - 36, alpha: 0, duration: 1000, ease: 'Cubic.out',
      onComplete: () => { t.setVisible(false).setActive(false); if (this.textPool.length < 40) this.textPool.push(t); else t.destroy(); },
    });
  },

  // Quái ở xa ngoài màn hình: dừng xử lý, ẩn đi cho nhẹ (quái đang đuổi, trùm thì luôn xử lý)
  mobActive(m) {
    const cam = this.cameras.main.worldView;
    const s = m.sprite;
    const far = s.x < cam.x - 260 || s.x > cam.right + 260;
    const active = !far || m.aggro || m.def.boss || m.state !== 'move';
    if (active !== (m.onScreen !== false)) {
      m.onScreen = active;
      s.setVisible(active); m.label.setVisible(active); m.bar.setVisible(active);
      if (active) s.anims.resume(); else { s.anims.pause(); s.body.setVelocity(0, m.def.fly ? 0 : s.body.velocity.y); }
    }
    return active;
  },
};
Object.assign(WorldScene.prototype, Juice);
