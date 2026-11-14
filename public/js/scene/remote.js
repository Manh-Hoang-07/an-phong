'use strict';
/* WorldScene · Người chơi khác cùng bản đồ (Realtime): dựng hình, nội suy vị trí, tên, bong bóng chat.
 * Vị trí chỉ để hiển thị; mọi tính toán thưởng vẫn do server làm theo cách cũ. */
const MOB_MSGS = new Set(['mobs', 'msnap', 'mhit', 'mhp', 'mdie', 'mresp', 'mspawn', 'mdel', 'mact']);
WorldScene.mix(class WorldRemote {
  buildRemotes() {
    this.remotes = new Map();        // id kết nối → { id, name, sc, lv, w, tx, ty, x, y, f, a, sprite, tag, bubble, sheet }
    this.myBubble = null;
    this.netEnter = true;
    this.netFn = (m) => this.onNet(m);
    Realtime.listen(this.netFn);
    this.time.addEvent({ delay: 100, loop: true, callback: () => this.netSendPos() });
    // Bấm vào người chơi khác: xem tên / cấp / class
    this.input.on('pointerdown', (ptr) => {
      let best = null, bd = 1e9;
      for (const r of this.remotes.values()) {
        const dx = Math.abs(ptr.worldX - r.x), dy = Math.abs(ptr.worldY - (r.y - 10));
        if (dx < 28 && dy < 45 && dx + dy < bd) { best = r; bd = dx + dy; }
      }
      if (best) Social.playerMenu(best);
    });
    this.events.once('shutdown', () => {
      Realtime.unlisten(this.netFn);
      this.remotes.clear();
      this.myBubble = null;
    });
    UI.setMapCount(1);
  }

  // Hoạt ảnh của mình, gửi cho người khác
  netAnim(time) {
    if (this.dead) return 'dead';
    if (time < (this.attackUntil || 0)) return 'atk';
    if (time < (this.hitAnimUntil || 0)) return 'hit';
    const b = this.player.body;
    if (!(b.blocked.down || b.touching.down)) return b.velocity.y < 0 ? 'jump' : 'fall';
    return Math.abs(b.velocity.x) > 10 ? 'run' : 'idle';
  }
  netSendPos() {
    if (!this.player || this.changing || !this.sys.isActive()) return;
    // Gói đầu tiên của cảnh mới xin vào lại phòng (có thể vẫn cùng bản đồ, vd. hồi sinh)
    if (Realtime.sendPos(this.mapId, this.player.x, this.player.y, this.facing < 0 ? -1 : 1, this.netAnim(this.time.now), this.netEnter, Math.max(0, Math.min(100, Math.round(App.hp / (App.stats.maxHp || 1) * 100))))) this.netEnter = false;
  }

  // ---- Tin từ server
  onNet(m) {
    if (!this.remotes || !this.sys.isActive()) return;
    if (MOB_MSGS.has(m.t)) { if (this.netMobs) this.onMobNet(m); return; }
    if (m.t === 'offline' && this.netMobs) UI.log('[Hệ thống] Mất kết nối máy chủ, quái tạm dừng. Đang thử nối lại...', '#ffb74d', 8000);
    // Kết nối được lại khi đang chơi chế độ riêng lẻ: dựng lại cảnh để chuyển sang quái do server quản lý
    if (m.t === 'hello' && this.netMobs === false && !this.dead && !this.switching) {
      this.switching = true;
      UI.log('[Hệ thống] Đã kết nối máy chủ, chuyển sang chơi chung với người khác...', '#a5d6a7', 6000);
      this.time.delayedCall(1200, () => { if (this.sys.isActive()) this.scene.restart({ map: this.mapId }); });
    }
    if (m.t === 'room') {
      for (const r of [...this.remotes.keys()]) this.dropRemote(r);
      for (const p of m.list) this.addRemote(p);
      this.countRemotes();
    } else if (m.t === 'join') { this.addRemote(m.p); this.countRemotes(); }
    else if (m.t === 'leave') { this.dropRemote(m.id); this.countRemotes(); }
    else if (m.t === 'snap') {
      for (const [id, x, y, f, a] of m.p) {
        const r = this.remotes.get(id);
        if (r) { r.tx = x; r.ty = y; r.f = f; r.a = a; }
      }
    } else if (m.t === 'look') {
      const r = this.remotes.get(m.p.id);
      if (r) { Object.assign(r, { name: m.p.name, sc: m.p.sc, lv: m.p.lv, w: m.p.w }); r.sheet = undefined; r.tag.setText(this.remoteTagText(r)); }
    } else if (m.t === 'offline') {
      for (const r of [...this.remotes.keys()]) this.dropRemote(r);
      this.countRemotes();
    } else if (m.t === 'chat' && m.ch === 'map') this.showBubble(m.id, m.text);
  }

  countRemotes() { UI.setMapCount(this.remotes.size + 1); }

  remoteTagText(r) { return `${r.name}  Lv.${r.lv}`; }
  remoteClassName(r) { return (r.sc && GameData.SCHOOLS[r.sc] && GameData.SCHOOLS[r.sc].name) || 'Tập sự'; }

  addRemote(p) {
    if (p.id === Realtime.myId || this.remotes.has(p.id) || this.remotes.size >= 40) return;
    const r = { id: p.id, name: p.name, sc: p.sc, lv: p.lv, w: p.w, tx: p.x, ty: p.y, x: p.x, y: p.y, f: p.f, a: p.a, sheet: undefined, curAnim: '', curFlip: null };
    r.sprite = this.add.sprite(p.x, p.y, 'shadow').setDepth(3.8);
    r.tag = this.add.text(p.x, p.y - 44, this.remoteTagText(r), {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '11px', color: '#b2ebf2', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5.9);
    r.bubble = null;
    this.remotes.set(r.id, r);
  }

  dropRemote(id) {
    const r = this.remotes.get(id);
    if (!r) return;
    r.sprite.destroy(); r.tag.destroy();
    if (r.bubble) r.bubble.t.destroy();
    this.remotes.delete(id);
  }

  // Bộ hình theo class (giống refreshPlayerLook): Toàn Năng cầm vũ khí class khác thì hóa thân class đó
  remoteLookId(r) {
    let id = r.sc || 'none';
    if (id === 'toan_nang' && r.w && GameData.ITEMS[r.w]) {
      const byWeapon = Sprites.weaponClass(GameData.ITEMS[r.w].wtype);
      if (byWeapon && Sprites.hasChar(this, byWeapon)) id = byWeapon;
      else if (byWeapon) this.loadCharNow(byWeapon);
    }
    return id;
  }

  // Gán bộ hình cho người chơi khác. Chưa tải xong bộ hình thì dùng hình vẽ bằng code cho tới khi có
  applyRemoteLook(r) {
    const look = Sprites.lookOf(this.remoteLookId(r));
    if (Sprites.hasChar(this, look.sheet)) {
      if (r.sheet === look.sheet) return;
      r.sheet = look.sheet; r.curAnim = ''; r.curFlip = null;
      r.sprite.clearTint();
      const c = Sprites.CHARS[look.sheet];
      const t = look.tint || c.tint;
      if (t) r.sprite.setTint(t);
      return;
    }
    if (r.sheet === null) return;
    r.sheet = null;
    r.curAnim = ''; r.curFlip = null;
    this.loadCharNow(look.sheet);
    const key = this.textures.exists(`hunter_${r.sc || 'none'}_idle`) ? `hunter_${r.sc || 'none'}_idle` : 'hunter_none_idle';
    if (this.textures.exists(key)) r.sprite.setTexture(key).setScale(1).setOrigin(0.5, 0.5);
    const col = r.sc && GameData.SCHOOLS[r.sc] && GameData.SCHOOLS[r.sc].color;
    if (col) r.sprite.setTint(col); else r.sprite.clearTint();
  }

  // Gốc toạ độ như người chơi: (x, y) cách chân 30px (xem Sprites.fitPlayer)
  fitRemote(r) {
    const c = Sprites.CHARS[r.sheet];
    const flip = r.f < 0;
    const cx = flip ? c.fw - c.cx : c.cx;
    r.sprite.setScale(c.s);
    r.sprite.setOrigin(cx / c.fw, (c.fy - 30 / c.s) / c.fh);
    r.sprite.setFlipX(flip);
  }

  remoteAnimKey(r) {
    const c = Sprites.CHARS[r.sheet];
    const a = r.a === 'dead' ? 'death' : r.a === 'atk' ? c.combo[0] : r.a;
    return `ch_${r.sheet}_${c.anims[a] ? a : 'idle'}`;
  }

  updateRemotes(time, delta) {
    if (!this.remotes) return;
    const k = 1 - Math.exp(-delta / 90);
    for (const r of this.remotes.values()) {
      if (r.sheet === undefined || r.sheet === null) this.applyRemoteLook(r);   // chưa có bộ hình: thử lại khi tải xong
      if (Math.abs(r.tx - r.x) + Math.abs(r.ty - r.y) > 500) { r.x = r.tx; r.y = r.ty; }
      else { r.x += (r.tx - r.x) * k; r.y += (r.ty - r.y) * k; }
      r.sprite.setPosition(r.x, r.y);
      if (r.sheet) {
        const flip = r.f < 0;
        if (r.curFlip !== flip) { r.curFlip = flip; this.fitRemote(r); }
        const key = this.remoteAnimKey(r);
        if (r.curAnim !== key && this.anims.exists(key)) { r.curAnim = key; r.sprite.play(key, true); }
      } else r.sprite.setFlipX(r.f < 0);
      r.tag.setPosition(r.x, r.y - 44);
      const mate = Social.isMate(r.id);
      if (mate !== r.mate) { r.mate = mate; r.tag.setColor(mate ? '#a5d6a7' : '#b2ebf2'); }
      if (r.bubble) {
        if (time > r.bubble.until) { r.bubble.t.destroy(); r.bubble = null; }
        else r.bubble.t.setPosition(r.x, r.y - 56);
      }
    }
    if (this.myBubble) {
      if (time > this.myBubble.until) { this.myBubble.t.destroy(); this.myBubble = null; }
      else this.myBubble.t.setPosition(this.player.x, this.player.y - 56);
    }
  }

  // Bong bóng chat trên đầu (id = id kết nối; id của mình thì gắn vào nhân vật mình)
  showBubble(id, text) {
    const mine = id === Realtime.myId;
    const r = mine ? null : this.remotes.get(id);
    if (!mine && !r) return;
    const old = mine ? this.myBubble : r.bubble;
    if (old) old.t.destroy();
    const t = this.add.text(0, 0, text, {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '12px', color: '#1b1b1b', backgroundColor: '#fffffff2',
      padding: { x: 6, y: 3 }, wordWrap: { width: 170, useAdvancedWrap: true }, align: 'center',
    }).setOrigin(0.5, 1).setDepth(7);
    const b = { t, until: this.time.now + 5000 };
    if (mine) this.myBubble = b; else r.bubble = b;
  }
});
