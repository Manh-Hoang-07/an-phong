'use strict';
/*
 * Hiệu ứng hình ảnh làm game "có lực": tia lửa khi trúng đòn, bụi bước chân, tiếp đất,
 * phát sáng, camera phóng nhẹ khi chí mạng, quay chậm khi hạ trùm, thời tiết theo bản đồ.
 * Gắn thêm vào WorldScene, không phụ thuộc hình nhân vật nên đổi bộ hình sau vẫn dùng được.
 */
const Juice = {
  setupJuice() {
    this.webgl = this.game.renderer.type === Phaser.WEBGL;
    this.makeJuiceTextures();
    const dustTint = { city: 0x9aa0ad, forest: 0x8fbf9f, cave: 0x9a92c0, redgate: 0xc06070 }[this.theme] || 0xaaaaaa;
    // Tia lửa khi trúng đòn
    this.sparkEm = this.add.particles(0, 0, 'fx_spark', {
      speed: { min: 140, max: 360 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 },
      lifespan: { min: 160, max: 360 }, gravityY: 500, blendMode: 'ADD', emitting: false,
    }).setDepth(9);
    this.critEm = this.add.particles(0, 0, 'fx_spark', {
      speed: { min: 220, max: 520 }, angle: { min: 0, max: 360 }, scale: { start: 1.6, end: 0 },
      lifespan: { min: 220, max: 480 }, gravityY: 300, tint: [0xffd54f, 0xffffff, 0xff9d4d], blendMode: 'ADD', emitting: false,
    }).setDepth(9);
    // Bụi bước chân / tiếp đất
    this.dustEm = this.add.particles(0, 0, 'fx_dust', {
      speedX: { min: -50, max: 50 }, speedY: { min: -60, max: -10 }, scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.55, end: 0 }, lifespan: { min: 300, max: 560 }, tint: dustTint, emitting: false,
    }).setDepth(3);
    this.stepAt = 0;
    this.wasGround = true;
    this.lastVy = 0;
    this.setupWeather();
    // Cổng phát sáng
    for (const pt of this.portals) this.glowObj(pt.img, 0x3fd0ff, 4);
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
    const W = () => this.scale.width, H = () => this.scale.height;
    if (this.theme === 'city') {
      this.add.particles(0, -20, 'fx_rain', {
        x: { min: -100, max: 1400 }, speedY: { min: 680, max: 820 }, speedX: -90, lifespan: 1000,
        quantity: 2, frequency: 30, alpha: { start: 0.35, end: 0.15 }, rotate: 7,
      }).setScrollFactor(0).setDepth(20);
    } else if (this.theme === 'forest' || this.theme === 'cave') {
      const tint = this.theme === 'forest' ? 0xcff7ee : 0xb9a8ff;
      for (let i = 0; i < 5; i++) {
        const f = this.add.image(Math.random() * 1200, H() * (0.45 + Math.random() * 0.4), 'fx_fog')
          .setScrollFactor(0.4 + i * 0.1).setDepth(i < 3 ? -3 : 7).setAlpha(this.theme === 'forest' ? 0.5 : 0.35)
          .setTint(tint).setScale(2 + Math.random() * 1.5, 1.2);
        this.tweens.add({ targets: f, x: f.x + 300 + Math.random() * 200, duration: 14000 + Math.random() * 8000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    } else if (this.theme === 'redgate') {
      this.add.particles(0, 0, 'fx_ember', {
        x: { min: 0, max: 1300 }, y: { min: 380, max: 620 }, speedY: { min: -60, max: -20 }, speedX: { min: -15, max: 15 },
        lifespan: { min: 2500, max: 4500 }, alpha: { start: 0.9, end: 0 }, frequency: 120, blendMode: 'ADD',
      }).setScrollFactor(0).setDepth(6);
    }
  },

  // Gọi mỗi khung hình sau khi cập nhật người chơi
  juiceUpdate(time, onGround, move) {
    const pl = this.player, body = pl.body;
    // Bước chân: bụi + tiếng bước
    if (onGround && move && Math.abs(body.velocity.x) > 40 && time > this.stepAt) {
      this.stepAt = time + 250;
      this.dustEm.explode(3, pl.x - this.facing * 6, body.bottom - 2);
      Sound.play('step');
    }
    // Tiếp đất sau cú rơi
    if (onGround && !this.wasGround && this.lastVy > 260) {
      this.dustEm.explode(this.lastVy > 600 ? 12 : 7, pl.x, body.bottom - 2);
      if (this.lastVy > 700) this.cameras.main.shake(90, 0.004);
      Sound.play('land');
    }
    this.wasGround = onGround;
    this.lastVy = body.velocity.y;
    // Nghiêng người theo hướng chạy (chỉ là hình, không ảnh hưởng va chạm)
    const target = !onGround ? 0 : move ? this.facing * 5 : 0;
    pl.angle += (target - pl.angle) * 0.25;
  },

  jumpFx() {
    const pl = this.player;
    this.dustEm.explode(5, pl.x, pl.body.bottom - 2);
    Sound.play('jump');
  },

  // Tia lửa khi đòn trúng; chí mạng thì tia vàng + camera phóng nhẹ
  hitFx(x, y, crit, dir) {
    if (crit) {
      this.critEm.explode(16, x, y);
      this.zoomPunch(0.045, 140);
    } else this.sparkEm.explode(7, x, y);
  },

  zoomPunch(amount = 0.04, ms = 120) {
    const cam = this.cameras.main;
    if (this.zooming) return;
    this.zooming = true;
    cam.zoomTo(1 + amount, ms * 0.4, 'Quad.out', true);
    this.time.delayedCall(ms * 0.45, () => cam.zoomTo(1, ms, 'Quad.in', true, (c, p) => { if (p === 1) this.zooming = false; }));
  },

  // Quay chậm trong chốc lát (hạ trùm)
  slowMo(scale = 0.3, ms = 900) {
    this.time.timeScale = scale;
    this.tweens.timeScale = scale;
    this.physics.world.timeScale = 1 / scale;
    this.zoomPunch(0.08, 400);
    setTimeout(() => {
      if (!this.sys || !this.sys.isActive()) return;
      this.time.timeScale = 1; this.tweens.timeScale = 1; this.physics.world.timeScale = 1;
    }, ms);
  },

  // Phát sáng (chỉ chạy được với WebGL)
  glowObj(obj, color, strength = 3) {
    if (!this.webgl || !obj || !obj.preFX) return;
    try { obj.preFX.setPadding(8); obj.preFX.addGlow(color, strength, 0, false, 0.1, 12); } catch { /* bỏ qua */ }
  },

  // Đòn đánh thường có lực: nhích người về phía trước
  attackLunge() {
    const pl = this.player;
    if (this.dashing || this.time.now < (this.knockUntil || 0)) return;
    pl.body.setVelocityX(this.facing * 100);
    this.knockUntil = this.time.now + 70;
  },
};
Object.assign(WorldScene.prototype, Juice);
