'use strict';
/* WorldScene · Đồ rơi trên đất. */
WorldScene.mix(class WorldLoot {
  // ------------------------------------------------------------------ Đồ rơi trên đất
  addLoot(l, animate = true) {
    if (!this.loots || this.loots.has(l.lid) || l.map !== this.mapId) return;
    const def = GameData.ITEMS[l.inst.id];
    const q = def.slot ? (l.inst.q || 1) : 0;
    const color = [0xe8e2d0, 0xffffff, 0x64b5f6, 0xce93d8, 0xffca28][q];
    const c = this.add.container(l.x, l.y - 14).setDepth(3);
    if (q >= 3) {   // cột sáng cho đồ hiếm và huyền thoại
      const beam = this.add.rectangle(0, -60, 10, 120, color, 0.28).setBlendMode(Phaser.BlendModes.ADD);
      c.add(beam);
      this.tweens.add({ targets: beam, alpha: 0.1, duration: 700, yoyo: true, repeat: -1 });
    }
    const glow = this.add.circle(0, 0, q >= 2 ? 15 : 11, color, q >= 2 ? 0.45 : 0.25).setBlendMode(Phaser.BlendModes.ADD);
    // Ảnh icon vẽ bằng code; trong lúc ảnh chưa nạp xong thì tạm hiện emoji
    const tex = 'ico_' + l.inst.id;
    let icon;
    if (this.textures.exists(tex)) icon = this.add.image(0, 0, tex).setDisplaySize(26, 26);
    else {
      icon = this.add.text(0, 0, UI.itemEmoji(l.inst.id), { fontSize: '20px' }).setOrigin(0.5);
      if (typeof ItemArt !== 'undefined') {
        this.textures.once('addtexture-' + tex, () => {
          if (!icon.active || !c.active) return;
          const img = this.add.image(0, icon.y, tex).setDisplaySize(26, 26);
          this.tweens.killTweensOf(icon);
          c.add(img); c.remove(icon, true);
          this.tweens.add({ targets: img, y: img.y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        });
        // Hai món cùng loại rơi liền nhau: món sau không nạp lại (nạp trùng khoá gây cảnh báo "Texture key already in use")
        const loading = this._icoLoading || (this._icoLoading = new Set());
        if (!loading.has(tex)) {
          loading.add(tex);
          this.textures.once('addtexture-' + tex, () => loading.delete(tex));
          try { this.textures.addBase64(tex, ItemArt.url(l.inst.id)); } catch (e) { loading.delete(tex); /* giữ emoji */ }
        }
      }
    }
    c.add([glow, icon]);
    if (q >= 2) {
      const label = this.add.text(0, -24, def.name, {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '11px', color: '#' + color.toString(16).padStart(6, '0'),
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
      c.add(label);
    }
    this.tweens.add({ targets: glow, scale: 1.25, duration: 600, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: icon, y: -4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (animate) {
      c.y -= 40; c.setScale(0.4);
      this.tweens.add({ targets: c, y: l.y - 14, scale: 1, duration: 450, ease: 'Bounce.out' });
      if (q >= 3) {
        this.cameras.main.flash(250, q === 4 ? 255 : 200, q === 4 ? 200 : 120, q === 4 ? 40 : 255);
        UI.banner(`Rơi đồ ${GameData.QUALITY_NAMES[q]}: ${def.name}!`, 1800);
      }
    }
    // Vùng bấm quanh món đồ; con trỏ đổi thành bàn tay khi rê vào
    c.setSize(44, 52).setInteractive({ useHandCursor: true });
    c.on('pointerdown', (ptr, lx, ly, ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); this.pickLoot(l.lid); });
    this.loots.set(l.lid, { l, c, pending: false });
  }

  removeLoot(lid, toPlayer) {
    const e = this.loots && this.loots.get(lid);
    if (!e) return;
    this.loots.delete(lid);
    // Dừng các hiệu ứng lặp mãi của món đồ để không tích tụ khi chơi lâu
    this.tweens.killTweensOf(e.c.list);
    if (toPlayer && this.player) {
      this.tweens.add({ targets: e.c, x: this.player.x, y: this.player.y - 10, scale: 0.3, alpha: 0, duration: 220, onComplete: () => e.c.destroy() });
    } else e.c.destroy();
  }

  // Bấm vào đồ rơi để nhặt (không còn tự nhặt khi đứng gần): túi đầy cũng không còn bị thử lại liên tục.
  pickLoot(lid) {
    const e = this.loots && this.loots.get(lid);
    const pl = this.player;
    if (!e || e.pending || this.dead || this.changing || !pl) return;
    if (Math.abs(pl.x - e.l.x) > 150 || Math.abs(pl.body.bottom - e.l.y) > 110) {
      this.floatText(e.l.x, e.l.y - 40, 'Lại gần hơn để nhặt', '#ffe082', 12);
      return;
    }
    e.pending = true;
    Net.action('pickup', { lid }, { silent: true }).then((r) => {
      if (r.ok) return;
      e.pending = false;
      if (r.error) UI.log(r.error, '#ef5350');
      if (r.error === 'Món đồ đã biến mất.') this.removeLoot(lid);
    });
  }

  // Chỉ dọn đồ hết hạn; việc nhặt do người chơi bấm (pickLoot)
  updateLoot() {
    if (!this.loots || !this.loots.size) return;
    const now = App.serverNow();
    for (const [lid, e] of this.loots) if (e.l.until < now) this.removeLoot(lid);
  }
});
