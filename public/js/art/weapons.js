'use strict';
/* Art · Vũ khí và hiệu ứng chém / phép. */
(() => {
  const { make, ell, rect, poly } = Art._;

  // ---------------------------------------------------------------- Vũ khí
  function weapons(scene) {
    // Thanh kiếm cong nhẹ, lưỡi sáng, chuôi quấn
    make(scene, 'w_kiem', 46, 10, (g) => {
      poly(g, 0x9aa8ba, [[14, 2], [40, 3.2], [43, 5], [40, 6.8], [14, 8]]);
      poly(g, 0xe8eef7, [[15, 2.6], [39, 3.8], [41.6, 5], [39, 4.6], [15, 4.4]]);
      rect(g, 0xffffff, 16, 2.6, 24, 1, 0.85);
      rect(g, 0x3b2a20, 3, 3, 10, 4);
      rect(g, 0x5b3a29, 3.6, 3.4, 8.6, 1.2, 0.8);
      rect(g, 0xc9a227, 11.4, 1, 3, 8);
      rect(g, 0xf0d27a, 11.8, 1.4, 1.2, 7.2, 0.9);
      g.fillStyle(0x7fd8ff, 0.22); g.fillRect(14, 1, 30, 8);
    });
    // Cung cong, dây cung, chỗ cầm
    make(scene, 'w_cung', 22, 48, (g) => {
      g.lineStyle(5, 0x3b2a20, 1); g.beginPath(); g.arc(-5, 24, 23, -1.02, 1.02); g.strokePath();
      g.lineStyle(3, 0x8b5a2b, 1); g.beginPath(); g.arc(-5, 24, 23, -1.02, 1.02); g.strokePath();
      g.lineStyle(1.4, 0xc9a227, 0.9); g.beginPath(); g.arc(-5, 24, 23, -0.55, 0.55); g.strokePath();
      g.lineStyle(1, 0xe8e2d0, 0.9); g.lineBetween(5.4, 4, 5.4, 44);
      rect(g, 0x4fd18b, 3.6, 20, 4.4, 8, 0.9);
      g.fillStyle(0x4fd18b, 0.2); g.fillCircle(6, 24, 8);
    });
    // Trượng: cán quấn, viên ngọc phát sáng
    make(scene, 'w_truong', 14, 56, (g) => {
      rect(g, 0x4a3120, 5.6, 12, 3.4, 43);
      rect(g, 0x7a5433, 6.2, 12, 1.6, 43, 0.9);
      for (let i = 0; i < 5; i++) rect(g, 0x2f2216, 5.2, 44 + i * 2.2, 4.4, 1, 0.85);
      rect(g, 0xc9a227, 4.4, 10.6, 5.6, 3);
      g.fillStyle(0x6c8cff, 0.28); g.fillCircle(7, 6.4, 6.6);
      g.fillStyle(0x9db6ff, 0.85); g.fillCircle(7, 6.4, 4.4);
      g.fillStyle(0xffffff, 0.95); g.fillCircle(5.8, 5.2, 1.6);
      g.lineStyle(1, 0xc9d8ff, 0.8); g.strokeCircle(7, 6.4, 4.6);
    });
  }

  // ---------------------------------------------------------------- Hiệu ứng
  function crescent(g, w, h, color, thick) {
    for (let i = 0; i < 3; i++) {
      const t = thick * (1 - i * 0.3);
      g.lineStyle(t, color, 0.35 + i * 0.25);
      g.beginPath(); g.arc(w / 2 - h * 0.32, h / 2, h / 2 - thick - i, -1.12, 1.12); g.strokePath();
    }
    g.lineStyle(Math.max(1, thick / 2.5), 0xffffff, 0.95);
    g.beginPath(); g.arc(w / 2 - h * 0.32 + 1, h / 2, h / 2 - thick, -0.92, 0.92); g.strokePath();
  }

  function effects(scene) {
    make(scene, 'slash', 54, 70, (g) => crescent(g, 54, 70, 0xfff3d0, 7));
    make(scene, 'fx_wave', 44, 60, (g) => crescent(g, 44, 60, 0x9fe8ff, 8));
    make(scene, 'proj_arrow', 32, 8, (g) => {
      rect(g, 0x8b5a2b, 5, 3, 19, 2);
      rect(g, 0xd7c39a, 6, 3.4, 17, 0.9, 0.8);
      poly(g, 0xdfe6ee, [[24, 0.6], [32, 4], [24, 7.4]]);
      poly(g, 0x4fd18b, [[1, 0.6], [7, 3.4], [1, 6.4]]);
      poly(g, 0x9ff2c9, [[2.4, 1.6], [5.6, 3.4], [2.4, 5.2]], 0.8);
      g.fillStyle(0x4fd18b, 0.18); g.fillEllipse(16, 4, 32, 10);
    });
    make(scene, 'proj_fire', 40, 14, (g) => {
      g.fillStyle(0xff7043, 0.16); g.fillEllipse(18, 7, 40, 14);
      g.fillStyle(0xff9d4d, 0.4); g.fillEllipse(16, 7, 30, 10);
      poly(g, 0xffb74d, [[4, 7], [14, 1.4], [30, 5], [38, 7], [30, 9], [14, 12.6]], 0.9);
      poly(g, 0xfff3c4, [[12, 7], [20, 4], [30, 6.6], [20, 8], [12, 9]], 0.95);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(24, 7, 1.6);
    });
    make(scene, 'proj_orb', 22, 22, (g) => {
      ell(g, 0x6c8cff, 11, 11, 11, 11, 0.16);
      ell(g, 0x8fb0ff, 11, 11, 8, 8, 0.35);
      ell(g, 0xcdd8ff, 11, 11, 5.2, 5.2, 0.85);
      ell(g, 0xffffff, 11, 11, 2.6, 2.6);
    });
    make(scene, 'spark', 8, 8, (g) => { ell(g, 0xffffff, 4, 4, 4, 4, 0.35); ell(g, 0xffffff, 4, 4, 2.2, 2.2); });
    make(scene, 'shadow', 34, 8, (g) => {
      for (let i = 4; i >= 1; i--) ell(g, 0x000000, 17, 4, 17 * i / 4, 4 * i / 4, 0.12);
    });
    make(scene, 'mote', 6, 6, (g) => { ell(g, 0xffffff, 3, 3, 3, 3, 0.3); ell(g, 0xffffff, 3, 3, 1.4, 1.4, 0.95); });
  }

  Object.assign(Art._, { weapons, crescent, effects });
})();
