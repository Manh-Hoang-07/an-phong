'use strict';
/* WorldScene · Chỉ định mục tiêu (kiểu Ninja School Online).
 * Nút "Chọn" (cảm ứng) hoặc phím H: mũi tên tam giác chỉ vào mục tiêu gần nhất, ưu tiên quái hơn đồ rơi (quái được cộng lợi thế 150px); bấm tiếp thì đổi sang mục tiêu kế (thứ tự theo khoảng cách).
 * Mục tiêu gồm quái sống và đồ rơi trong tầm.
 *   - Mục tiêu là ĐỒ RƠI: bấm nút Đánh (hoặc J) để nhặt.
 *   - Mục tiêu là QUÁI: nhân vật quay mặt về phía quái; đạn đơn mục tiêu bay thẳng vào đúng con đó
 *     (bỏ qua quái khác chắn đường), đòn cận chiến thường ưu tiên đúng con đó nếu nó nằm trong tầm chém.
 *     Đòn lan / xuyên vẫn trúng mọi quái như cũ.
 * Mục tiêu tự bỏ khi quái chết, đồ được nhặt / hết hạn, hoặc đi ra ngoài tầm. */
WorldScene.mix(class WorldTarget {
  // Danh sách mục tiêu trong tầm, gần nhất trước (quái được ưu tiên nhẹ)
  targetCandidates() {
    const pl = this.player;
    if (!pl) return [];
    const out = [];
    const RX = 520, RY = 260;
    for (const m of this.monsters || []) {
      const s = m.sprite;
      if (!m.alive || !s || !s.active || !s.body || !s.body.enable) continue;
      const dx = Math.abs(s.x - pl.x), dy = Math.abs(s.y - pl.y);
      if (dx < RX && dy < RY) out.push({ kind: 'mob', ref: m, d: dx + dy * 0.5 });
    }
    if (this.loots) {
      for (const e of this.loots.values()) {
        const dx = Math.abs(e.c.x - pl.x), dy = Math.abs(e.c.y - pl.y);
        if (e.c.active && dx < RX && dy < RY) out.push({ kind: 'loot', ref: e, d: dx + dy * 0.5 });
      }
    }
    // Gần nhất trước, quái được ưu tiên thêm 150px: quái ở gần thì thắng đồ rơi, nhưng quái ở xa thì KHÔNG thắng đồ rơi đang ngay dưới chân
    const score = (c) => c.d - (c.kind === 'mob' ? 150 : 0);
    return out.sort((a, b) => score(a) - score(b));
  }

  sameTarget(a, b) { return !!a && !!b && a.kind === b.kind && a.ref === b.ref; }

  // Bấm nút Chọn: sang mục tiêu kế tiếp (lần đầu: gần nhất). Hết vòng thì bỏ chọn.
  cycleTarget() {
    const list = this.targetCandidates();
    if (!list.length) { this.target = null; this.targetManual = false; this.floatText(this.player.x, this.player.y - 56, 'Không có mục tiêu', '#bdbdbd', 12); return; }
    const cur = this.target ? list.findIndex(c => this.sameTarget(c, this.target)) : -1;
    const next = cur + 1;
    if (next < list.length) { this.target = { kind: list[next].kind, ref: list[next].ref }; this.targetManual = true; }   // chọn tay: giữ nguyên tới khi hết hợp lệ
    else { this.target = { kind: list[0].kind, ref: list[0].ref }; this.targetManual = false; }                           // hết vòng: về chế độ tự chọn gần nhất
    Sound.play('click');
  }

  // Mục tiêu còn hợp lệ không (quái sống, đồ còn trên đất, còn trong tầm)
  targetValid() {
    const t = this.target, pl = this.player;
    if (!t || !pl) return false;
    if (t.kind === 'mob') {
      const m = t.ref, s = m.sprite;
      return !!(m.alive && s && s.active && s.body && s.body.enable && this.monsters.includes(m)
        && Math.abs(s.x - pl.x) < 700 && Math.abs(s.y - pl.y) < 360);
    }
    const e = t.ref;
    return !!(this.loots && e.c && e.c.active && this.loots.get(e.l.lid) === e
      && Math.abs(e.c.x - pl.x) < 700 && Math.abs(e.c.y - pl.y) < 360);
  }

  // Quái đang chỉ định (hoặc null): dùng khi tung đòn
  targetMob() { return this.target && this.target.kind === 'mob' && this.targetValid() ? this.target.ref : null; }

  // Quái mà thú / linh thú / bóng ma được phép đánh: quái người chơi đang chỉ định, nếu không thì quái người chơi vừa đánh
  // trong 3 giây qua. Không có thì chúng đứng yên đi theo chủ (không tự tìm quái nữa).
  focusMob(time) {
    // Chỉ mục tiêu CHỌN TAY mới kéo thú theo (mục tiêu tự chọn gần nhất thì không: thú không tự tìm quái)
    const t = this.targetManual ? this.targetMob() : null;
    if (t) return t;
    const m = this.lastHitMob;
    if (m && time - (this.lastHitAt || 0) < 3000 && m.alive && m.sprite && m.sprite.active && m.sprite.body && m.sprite.body.enable
      && !m.def.passive && this.monsters.includes(m)
      && Math.abs(m.sprite.x - this.player.x) < 700 && Math.abs(m.sprite.y - this.player.y) < 360) return m;
    return null;
  }

  // Quay mặt về quái đang chỉ định (không làm gì nếu quái ở sát ngay trên người)
  aimAtTarget() {
    const m = this.targetMob();
    if (!m) return null;
    const dx = m.sprite.x - this.player.x;
    if (Math.abs(dx) > 8) this.facing = dx < 0 ? -1 : 1;
    return m;
  }

  // Góc bắn (radian, theo hướng đã quay mặt) để đạn bay vào đúng quái đang chỉ định
  targetAngle() {
    const m = this.targetMob();
    if (!m) return 0;
    const pl = this.player;
    const dx = Math.abs(m.sprite.x - pl.x), dy = (m.sprite.body.center.y) - pl.y;
    if (dx < 30) return 0;
    return Phaser.Math.Clamp(Math.atan2(dy, dx), -0.6, 0.6);
  }

  // Bấm nút Đánh khi đang chỉ định đồ rơi: nhặt thay vì đánh. Trả về true nếu đã xử lý (không đánh).
  attackPicksLoot(time) {
    if (!this.target || this.target.kind !== 'loot') return false;
    if (!this.targetValid()) { this.target = null; return false; }
    if (time < (this.pickAt || 0)) return true;
    this.pickAt = time + 350;
    this.pickLoot(this.target.ref.l.lid);
    return true;
  }

  // Mỗi khung hình: kiểm tra mục tiêu và đặt mũi tên tam giác
  // Tự chọn: mũi tên luôn chỉ vào mục tiêu gần nhất trong tầm (quái trước, đồ rơi sau), cập nhật 5 lần/giây.
  // Đã chọn tay (nút Chọn / H) thì giữ mục tiêu đó tới khi nó chết / biến mất / đi quá xa, rồi quay về tự chọn.
  autoTarget(time) {
    if (time < (this.autoAt || 0)) return;
    this.autoAt = time + 200;
    const first = this.targetCandidates()[0];
    if (!first) { this.target = null; return; }
    if (!this.sameTarget(first, this.target)) this.target = { kind: first.kind, ref: first.ref };
  }

  updateTarget(time) {
    if (this.target && !this.targetValid()) { this.target = null; this.targetManual = false; this.autoAt = 0; }
    if (!this.targetManual) this.autoTarget(time);
    if (!this.target) { if (this.targetMark) this.targetMark.setVisible(false); return; }
    if (!this.targetMark || !this.targetMark.scene) {
      this.targetMark = this.add.graphics().setDepth(9);
      this.targetMarkKind = null;
    }
    const mark = this.targetMark, t = this.target;
    if (this.targetMarkKind !== t.kind) {
      this.targetMarkKind = t.kind;
      const col = t.kind === 'mob' ? 0xff5252 : 0xffd54f;
      mark.clear().fillStyle(col, 1).fillTriangle(-9, 0, 9, 0, 0, 14).lineStyle(2, 0x000000, 0.8).strokeTriangle(-9, 0, 9, 0, 0, 14);
    }
    let x, y;
    if (t.kind === 'mob') { x = t.ref.sprite.x; y = this.monsterTop(t.ref) - 34; }
    else { x = t.ref.c.x; y = t.ref.c.y - 46; }
    mark.setVisible(true).setPosition(x, y + Math.sin(time / 130) * 4);
  }
});
