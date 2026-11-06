'use strict';
/* WorldScene · Nhân vật: dựng hình, vũ khí, hoạt ảnh, thuốc, hồi phục, vầng quang, hiệu ứng lên cấp / thức tỉnh. */
WorldScene.mix(class WorldPlayer {
  // ------------------------------------------------------------------ Nhân vật
  playerTexKey(frame) {
    return `hunter_${App.player.school || 'none'}_${frame}`;
  }

  buildPlayer() {
    let x, y;
    const p = App.player;
    if (p.x != null && p.y != null && !this.arrive) { x = p.x; y = p.y; }
    else {
      const pos = (this.arrive && this.findChar(this.arrive)) || this.findChar('S') || this.findChar('<') || { r: 2, c: 2 };
      x = pos.c * T + T / 2;
      if (this.arrive === '<') x += 50; else if (this.arrive === '>') x -= 50;
      y = this.groundY(pos.r, pos.c) - 30;
    }
    App.player.arrive = null;
    if (App.hp <= 0) { App.hp = p.hp ?? App.stats.maxHp; App.mp = p.mp ?? App.stats.maxMp; }

    this.shadow = this.add.image(x, y, 'shadow').setDepth(3);
    this.player = this.physics.add.sprite(x, y, this.playerTexKey('idle')).setDepth(4);
    this.player.body.setSize(18, 46).setOffset(11, 14);
    this.sheetId = null;
    this.refreshPlayerLook();
    this.player.body.setMaxVelocity(1200, 1100);
    this.player.setCollideWorldBounds(false);
    this.facing = 1;
    this.weapon = this.add.image(x, y, 'w_kiem').setDepth(5).setOrigin(0.15, 0.5);
    this.updateWeaponLook();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.platforms, null, () => !this.dropping);

    this.nameTag = this.add.text(x, y - 44, App.player.name, {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '12px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
  }

  accent() {
    const h = Art.HUNTERS[App.player.school || 'none'];
    return App.player.school ? h.accent : 0xbfe9ff;
  }

  // Vị trí vũ khí trên tay theo từng loại: kiếm chĩa xuống, cung dựng đứng, trượng cầm thẳng
  placeWeapon() {
    const pl = this.player, f = this.facing, w = this.weapon, wt = App.stats.wtype;
    w.setFlipX(f < 0);
    if (wt === 'cung') {
      w.setPosition(pl.x + f * 12, pl.y + 4).setOrigin(f < 0 ? 0.7 : 0.3, 0.5);
      if (!this.swinging) w.setRotation(0).setScale(1);
    } else if (wt === 'truong') {
      w.setPosition(pl.x + f * 10, pl.y + 8).setOrigin(0.5, 0.7);
      if (!this.swinging) w.setRotation(f * 0.15);
    } else {
      w.setPosition(pl.x + f * 8, pl.y + 8).setOrigin(f < 0 ? 0.85 : 0.15, 0.5);
      if (!this.swinging) w.setRotation(f * -0.7);
    }
  }

  // Tên hoạt ảnh nhân vật: đang biến hình (formTier) thì dùng bộ hình biến hình chf<ấn>_..., không thì ch_...
  charAnim(a) { return `${this.formTier ? 'chf' + this.formTier : 'ch'}_${this.sheetId}_${a}`; }
  // Biến hình thì nhân vật to hơn: ấn 1 ×1.15, ấn 2 ×1.25
  formGrow() { return this.formTier ? (this.formTier >= 2 ? 1.25 : 1.15) : 1; }
  // Đổi sang / trở về bộ hình biến hình và vừa lại kích thước
  applyFormLook() {
    const aw = App.form ? GameData.awakenOf(App.player) : null;
    this.formTier = aw && this.sheetId && Sprites.makeFormSheets(this, this.sheetId, aw.tier) ? aw.tier : 0;
    if (!this.sheetId || !this.player) return;
    this.fitFacing = this.facing || 1;
    Sprites.fitPlayer(this.player, this.sheetId, this.fitFacing < 0, this.formGrow());
    this.player.setFlipX(this.fitFacing < 0);
    this.attackUntil = 0;
    this.player.play(this.charAnim('idle'));
  }

  // Dùng hình vẽ sẵn (có hoạt ảnh) nếu có, không thì dùng hình vẽ bằng code
  refreshPlayerLook() {
    const id = App.player.school || 'none';
    const sheet = Sprites.hasChar(this, id) ? id : null;
    if (sheet === this.sheetId && this.sheetId !== undefined && this.fitDone) return;
    this.sheetId = sheet;
    this.fitDone = true;
    const pl = this.player;
    if (sheet) {
      this.formTier = 0;
      pl.setTexture(`ch_${sheet}_idle`, 0);
      this.fitFacing = this.facing || 1;
      Sprites.fitPlayer(pl, sheet, this.fitFacing < 0);
      pl.setFlipX(this.fitFacing < 0);
      pl.play(`ch_${sheet}_idle`);
      if (App.form) this.applyFormLook();
    } else {
      pl.anims.stop();
      pl.setScale(1).setOrigin(0.5);
      pl.body.setSize(18, 46).setOffset(11, 14);
      pl.setTexture(this.playerTexKey('idle'));
    }
  }

  // Chọn hoạt ảnh theo trạng thái: chết > bị đánh > đánh > nhảy/rơi > chạy > đứng
  updatePlayerAnim(time, onGround) {
    const pl = this.player, id = this.sheetId;
    if (this.fitFacing !== this.facing) {
      this.fitFacing = this.facing;
      Sprites.fitPlayer(pl, id, this.facing < 0, this.formGrow());
      pl.setFlipX(this.facing < 0);
    }
    if (time < (this.attackUntil || 0)) return;
    let a;
    if (time < (this.hitAnimUntil || 0)) a = 'hit';
    else if (!onGround) a = pl.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (Math.abs(pl.body.velocity.x) > 10) a = 'run';
    else a = 'idle';
    pl.play(this.charAnim(a), true);
  }

  // Hoạt ảnh đánh: đòn liên hoàn 1 → 2 → 3, tốc độ khớp với thời gian hồi đòn
  attackAnim(time, dur, kind = 'basic') {
    const id = this.sheetId;
    if (!id) return;
    const c = Sprites.CHARS[id];
    let a;
    if (kind === 'skill') a = c.combo[c.combo.length - 1];
    else {
      if (time - (this.lastAttackAt || 0) > 900) this.comboIdx = 0;
      a = c.combo[(this.comboIdx || 0) % c.combo.length];
      this.comboIdx = (this.comboIdx || 0) + 1;
    }
    this.lastAttackAt = time;
    const [n, base] = c.anims[a];
    const rate = Math.max(base, n / Math.max(0.18, dur / 1000));
    this.attackUntil = time + n / rate * 1000;
    this.player.play({ key: this.charAnim(a), frameRate: rate }, false);
  }

  updateWeaponLook() {
    const w = App.stats.wtype;
    this.refreshPlayerLook();
    // Hình vẽ sẵn đã cầm vũ khí trên tay nên ẩn vũ khí rời đi
    this.weapon.setVisible(w !== 'tay' && !this.sheetId);
    if (w !== 'tay') this.weapon.setTexture('w_' + w);
    if (!this.sheetId) this.player.setTexture(this.playerTexKey('idle'));
    const ico = { tay: '👊', kiem: '🗡️', cung: '🏹', truong: '🪄' }[w];
    UI.setAttackIcon(ico);
  }

  usePotion(kind, wanted) {
    const p = App.player;
    const ids = kind === 'hp' ? ['binh_mau_vua', 'thuoc_nhiem_do', 'binh_mau_nho'] : ['binh_nl_vua', 'binh_nl_nho'];
    const can = (i) => p.bag.some(e => e.id === i) && (GameData.ITEMS[i].level || 1) <= p.level;
    const id = (wanted && can(wanted)) ? wanted : ids.find(can);
    if (!id) { UI.log(kind === 'hp' ? 'Hết bình máu! Mua ở Bà Lan.' : 'Hết bình năng lượng! Mua ở Bà Lan.', '#ef5350'); return; }
    if (kind === 'hp' && App.hp >= App.stats.maxHp) return;
    if (kind === 'mp' && App.mp >= App.stats.maxMp) return;
    // Server chặn uống quá nhanh (400ms); chặn luôn ở đây để không hồi máu "ảo" rồi bị trả lại
    const now = Date.now();
    if (now < (this.potionReadyAt || 0)) return;
    this.potionReadyAt = now + 450;
    // Hồi máu NGAY khi bấm (cùng công thức với server), server kiểm tra sau; nếu bị từ chối thì trả lại như cũ
    const def = GameData.ITEMS[id], st = App.stats;
    const healHp = (def.hp || 0) + (def.hpPct ? Math.round(st.maxHp * def.hpPct) : 0);
    const healMp = def.mp || 0;
    const sent = { item: id, hp: Math.round(App.hp), mp: Math.round(App.mp) };
    const gotHp = Math.min(st.maxHp, App.hp + healHp) - App.hp, gotMp = Math.min(st.maxMp, App.mp + healMp) - App.mp;
    App.hp += gotHp; App.mp += gotMp;
    const entry = p.bag.find(e => e.id === id);
    if (entry) entry.qty--;          // số bình hiển thị giảm ngay; server gửi về số chuẩn sau
    if (this.player) {
      if (healHp) this.floatText(this.player.x, this.player.y - 30, '+' + healHp, '#69f0ae');
      if (healMp) this.floatText(this.player.x, this.player.y - 46, '+' + healMp, '#64b5f6');
    }
    UI.refresh();
    Net.action('use', sent, { skipEvents: ['heal'] }).then((r) => {
      if (r && r.ok === false) {
        App.hp = Math.max(1, App.hp - gotHp); App.mp = Math.max(0, App.mp - gotMp);
        if (!r.player && entry) entry.qty++;   // mất mạng hẳn: trả lại bình (có phản hồi thì server đã gửi số chuẩn)
        UI.refresh();
      }
    });
  }

  regen() {
    if (this.dead) return;
    const safe = this.mapId === GameData.START_MAP;
    const idle = this.time.now - this.lastHurt > 5000;
    const mul = safe ? 4 : idle ? 1 : 0.3;
    App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * 0.01 * mul);
    // Buff "Ân Sủng" (Trị Liệu Sư): hồi 3% máu mỗi nhịp (2 giây), 5% khi skill cấp 10
    const grace = this.buffOn('grace');
    if (grace) App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * (grace.regen || 0.03));
    // Đang biến hình: năng lượng không tự hồi (chỉ hồi bằng bình)
    if (!App.form) App.mp = Math.min(App.stats.maxMp, App.mp + App.stats.maxMp * 0.02 * mul * (this.hasPassive('phap_su') ? 2 : 1));
  }

  // ------------------------------------------------------------------ Thể lực (tách riêng với năng lượng)
  // Trừ thể lực cho một đòn/kỹ năng. Không đủ, hoặc đang kiệt sức → trả false (không được đánh).
  canSpendStamina(cost) {
    if (App.staLocked || App.sta < cost) {
      if (!App.staLocked) App.staLocked = true;   // vừa cạn: kiệt sức tới khi hồi đủ ngưỡng
      if (this.time.now > (this.staWarnAt || 0)) {
        this.staWarnAt = this.time.now + 1500;
        UI.log('Hết thể lực! Chờ hồi lại rồi mới đánh tiếp được.', '#ffca28');
        if (this.player) this.floatText(this.player.x, this.player.y - 52, 'Kiệt sức', '#ffca28', 13);
      }
      return false;
    }
    return true;
  }
  spendStamina(cost) {
    App.sta = Math.max(0, App.sta - cost);
    this.staUsedAt = this.time.now;
  }
  attackStaminaCost() {
    const S = GameData.STAMINA, w = GameData.WEAPON_TYPES[App.stats.wtype];
    return Math.max(1, Math.round(S.attack * w.cooldown / 400));
  }
  skillStaminaCost(sk) { return sk.ult ? GameData.STAMINA.ult : GameData.STAMINA.skill; }

  // ------------------------------------------------------------------ Biến hình (thức tỉnh)
  // Bật/tắt bằng phím T hoặc nút ⚡. Đang biến hình: chỉ số nhân theo ấn, hào quang lửa, mỗi giây tốn `drain` năng lượng
  // và thể lực (ấn 1: 1, ấn 2: 2); MP và thể lực không tự hồi. Cạn một trong hai thì tự trở lại dạng thường.
  toggleForm(time) {
    if (App.form) { this.endForm(); return; }
    const aw = GameData.awakenOf(App.player);
    if (!aw) { UI.log('Chưa thức tỉnh. Đạt cấp 25 rồi gặp Hội trưởng Khải để nhận Ấn thứ nhất.', '#bdbdbd'); return; }
    if (time < (this.formReadyAt || 0)) return;
    const need = aw.drain * 3;   // phải đủ ít nhất 3 giây biến hình
    if (App.mp < need || App.sta < need || App.staLocked) { UI.log(`Không đủ năng lượng / thể lực để biến hình (cần ${need}).`, '#ffca28'); return; }
    const hpRatio = App.hp / App.stats.maxHp;
    App.form = true;
    App.recalcStats();
    App.hp = Math.round(App.stats.maxHp * hpRatio);   // giữ nguyên % máu khi máu tối đa tăng
    this.formDrainAcc = 0;
    this.formReadyAt = time + 1500;
    this.awakenFx(aw.tier);
    this.formStart();
    UI.banner(aw.tier >= 2 ? 'BIẾN HÌNH · ẤN THỨ HAI' : 'BIẾN HÌNH · ẤN THỨ NHẤT', 1400);
    UI.refresh();
  }
  endForm(reason) {
    if (!App.form) return;
    const hpRatio = App.hp / App.stats.maxHp;
    App.form = false;
    App.recalcStats();
    App.hp = Math.max(1, Math.round(App.stats.maxHp * hpRatio));
    this.formReadyAt = this.time.now + 1500;
    this.formStop();
    if (reason) UI.log(reason, '#ffca28');
    if (this.player) this.floatText(this.player.x, this.player.y - 52, 'Trở lại dạng thường', '#e0e0e0', 12);
    UI.refresh();
  }
  formTick(time, delta) {
    if (!App.form) return;
    const aw = GameData.awakenOf(App.player);
    if (!aw || this.dead) { this.endForm(); return; }
    // Trừ theo từng giây tròn (hiện số trên thanh đổi đều 1, 2 mỗi giây)
    this.formDrainAcc = (this.formDrainAcc || 0) + delta;
    while (this.formDrainAcc >= 1000) {
      this.formDrainAcc -= 1000;
      App.mp = Math.max(0, App.mp - aw.drain);
      App.sta = Math.max(0, App.sta - aw.drain);
    }
    if (App.mp <= 0) this.endForm('Hết năng lượng, biến hình kết thúc.');
    else if (App.sta <= 0) { App.staLocked = true; this.endForm('Hết thể lực, biến hình kết thúc.'); }
  }

  // Hồi thể lực từ từ (gọi mỗi khung hình)
  staminaTick(time, delta) {
    const S = GameData.STAMINA, max = App.stats.maxSta;
    if (App.sta == null) App.sta = max;
    if (App.sta < max && !this.dead && !App.form) {
      const rate = time - (this.staUsedAt || 0) > S.delay ? 1 : S.activeMul;
      App.sta = Math.min(max, App.sta + S.regen * rate * delta / 1000);
    }
    if (App.staLocked && App.sta >= max * S.unlock) App.staLocked = false;
  }

  // Hiệu ứng biến hình: lưỡi lửa bốc lên quanh người (hạt), quầng sáng sau lưng (vẽ trong drawAura)
  formStart() {
    const aw = GameData.awakenOf(App.player);
    if (!aw || !this.player) return;
    this.formStop();
    const low = Quality.low, t2 = aw.tier >= 2;
    this.formBack = this.add.graphics().setDepth(3.5);   // sau lưng nhân vật (nhân vật ở độ sâu 4)
    const zone = { type: 'random', source: new Phaser.Geom.Rectangle(-17, -26, 34, 58) };
    const flame = (depth, freq, scale, alpha) => this.add.particles(0, 0, 'fx_flame', {
      emitZone: zone, speedY: { min: -150, max: -250 }, speedX: { min: -18, max: 18 },
      scaleX: { start: scale, end: 0.15 }, scaleY: { start: scale * 1.3, end: 0.3 },
      alpha: { start: alpha, end: 0 }, lifespan: { min: 320, max: 560 }, frequency: freq,
      tint: [aw.aura, aw.aura2, aw.aura], blendMode: 'ADD', maxParticles: 90,
    }).setDepth(depth).startFollow(this.player);
    this.formEms = [flame(3.6, low ? 40 : (t2 ? 9 : 13), t2 ? 1.6 : 1.35, 0.9)];
    if (!low) this.formEms.push(flame(4.2, t2 ? 55 : 80, 0.7, 0.28));   // vài lưỡi lửa mỏng phía trước người (nhạt, không che mặt)
    // Đổi hình dạng: bộ hình tô màu ấn + to hơn
    this.applyFormLook();
    // Hào quang bám theo ĐƯỜNG VIỀN cơ thể trong từng khung hoạt ảnh (WebGL), nhấp nháy như lửa cháy
    const pl = this.player;
    if (this.webgl && pl.preFX) {
      try {
        pl.preFX.setPadding(18);
        this.formGlow = pl.preFX.addGlow(aw.aura, t2 ? 7 : 5, 0, false, 0.1, t2 ? 16 : 12);   // chỉ sáng viền ngoài, không phủ vào người
        this.formGlowTw = this.tweens.add({ targets: this.formGlow, outerStrength: t2 ? 11 : 8, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      } catch { this.formGlow = null; }
    }
  }
  formStop() {
    for (const em of this.formEms || []) em.destroy();
    this.formEms = [];
    if (this.formBack) { this.formBack.destroy(); this.formBack = null; }
    if (this.formGlowTw) { this.formGlowTw.remove(); this.formGlowTw = null; }
    if (this.formGlow && this.player && this.player.preFX) { try { this.player.preFX.remove(this.formGlow); } catch { /* bỏ qua */ } }
    this.formGlow = null;
    if (!App.form && this.formTier) this.applyFormLook();   // trở về bộ hình thường, kích thước thường
  }

  drawAura(time) {
    const g = this.aura, pl = this.player;
    g.clear();
    if (App.form && !this.formBack) this.formStart();   // vừa đổi bản đồ khi đang biến hình
    if (this.formBack) {
      const aw = GameData.awakenOf(App.player);
      const b = this.formBack, col = aw ? aw.aura : 0xffd54f, col2 = aw ? aw.aura2 : 0xfff3b0;
      const pulse = 0.75 + Math.sin(time / 70) * 0.25;
      b.clear();
      // Viền ngọn lửa răng cưa bùng quanh người (các lưỡi lửa nhọn phía trên, dao động liên tục)
      const tier2 = aw && aw.tier >= 2;
      for (let layer = 0; layer < 2; layer++) {
        const pts = [], n = 22, R = (tier2 ? 46 : 40) - layer * 12;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;                       // 0 = bên phải, PI/2 = dưới chân
          const up = Math.max(0, -Math.sin(a));                  // 1 ở đỉnh đầu, 0 ở hai bên / dưới
          const tongue = k % 2 ? 0.55 : 1 + 0.35 * Math.sin(time / 45 + k * 1.7 + layer);
          const r = R * (0.8 + 0.25 * tongue) * (1 + up * (tier2 ? 0.9 : 0.7) * tongue);
          pts.push({ x: pl.x + Math.cos(a) * r * 0.62, y: pl.y + 6 + Math.sin(a) * r * (Math.sin(a) > 0 ? 0.55 : 1) });
        }
        b.fillStyle(layer ? col2 : col, (layer ? 0.22 : 0.16) * pulse).fillPoints(pts, true);
      }
      // Quầng sáng mềm sau lưng
      for (let i = 0; i < 3; i++) {
        const w = 60 - i * 14 + Math.sin(time / 55 + i) * 4, h = 92 - i * 18 + Math.sin(time / 47 + i * 2) * 6;
        b.fillStyle(i < 1 ? col : col2, (0.16 + i * 0.07) * pulse).fillEllipse(pl.x, pl.y - 4 - i * 3, w, h);
      }
      // Ấn 2: tia điện chớp quanh người
      if (aw && aw.tier >= 2 && Math.floor(time / 90) % 3 === 0) {
        g.lineStyle(2, 0xf3e6ff, 0.9);
        for (let k = 0; k < 2; k++) {
          let x = pl.x + Phaser.Math.Between(-26, 26), y = pl.y - Phaser.Math.Between(20, 40);
          g.beginPath(); g.moveTo(x, y);
          for (let s = 0; s < 4; s++) { x += Phaser.Math.Between(-10, 10); y += Phaser.Math.Between(9, 16); g.lineTo(x, y); }
          g.strokePath();
        }
      }
    }
    const guard = this.buffOn('guard', time), shield = this.buffOn('manashield', time);
    if (guard) { g.lineStyle(3, 0xffb36b, 0.6 + Math.sin(time / 120) * 0.2).strokeEllipse(pl.x, pl.y + 2, 54, 70); }
    if (shield) { g.fillStyle(0x8fb4ff, 0.12).fillCircle(pl.x, pl.y, 38); g.lineStyle(2, 0xbfd2ff, 0.7).strokeCircle(pl.x, pl.y, 38); }
    // Buff awaken tạm thời (skill vn1 Toàn Năng)
    if (this.buffOn('awaken', time)) { g.lineStyle(2, 0xffd54f, 0.5 + Math.sin(time / 90) * 0.3).strokeEllipse(pl.x, pl.y + 28, 60, 14); }
  }

  levelUpFx() {
    const pl = this.player;
    if (!pl) return;
    const c = this.add.circle(pl.x, pl.y, 20, 0xffd54f, 0.5).setDepth(7);
    this.tweens.add({ targets: c, radius: 90, alpha: 0, duration: 700, onComplete: () => c.destroy() });
  }

  // Hiệu ứng khi thức tỉnh bậc mới
  awakenFx(tier) {
    const pl = this.player;
    if (!pl) return;
    const col = tier >= 2 ? 0xff80ab : 0xffe082;
    // Vụ nổ ring
    for (let i = 0; i < 3; i++) {
      const ring = this.add.graphics().setDepth(8);
      this.time.delayedCall(i * 120, () => {
        let r = 10;
        this.time.addEvent({ delay: 16, repeat: 18, callback: () => {
          r += 8; ring.clear().lineStyle(3 - i * 0.5, col, 1 - r / 160).strokeEllipse(pl.x, pl.y, r * 2, r * 0.7);
          if (r >= 150) ring.destroy();
        } });
      });
    }
    this.cameras.main.flash(350, (col >> 16) & 0xff, (col >> 8) & 0xff, col & 0xff);
    this.cameras.main.shake(300, 0.01);
    for (let k = 0; k < 16; k++) {
      const sp = this.add.image(pl.x, pl.y, 'spark').setDepth(8).setTint(col);
      this.tweens.add({ targets: sp, x: pl.x + Phaser.Math.Between(-90, 90), y: pl.y + Phaser.Math.Between(-80, 30), alpha: 0, scale: 0.5, duration: 650, onComplete: () => sp.destroy() });
    }
    Sound.play('levelup');
  }
});
