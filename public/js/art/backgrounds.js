'use strict';
/* Art · Thế giới mới: fantasy Á Đông, vẽ nhiều lớp để các map có chiều sâu. */
(() => {
  const { make, ell, rect, rrect, poly, rnd } = Art._;
  const W = 960, H = 576;

  function gradient(scene, key, colors) {
    make(scene, key, 4, H, (g) => {
      const C = Phaser.Display.Color;
      for (let y = 0; y < H; y++) {
        const t = y / (H - 1) * (colors.length - 1), a = Math.min(colors.length - 2, Math.floor(t));
        const f = t - a, s = f * f * (3 - 2 * f);
        const col = C.Interpolate.ColorWithColor(C.IntegerToColor(colors[a]), C.IntegerToColor(colors[a + 1]), 1000, s * 1000);
        g.fillStyle(C.GetColor(col.r, col.g, col.b)); g.fillRect(0, y, 4, 1);
      }
    });
  }
  function ridge(g, base, color, seed, alpha = 1) {
    g.fillStyle(color, alpha); g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const p = x / W * Math.PI * 2;
      g.lineTo(x, base + Math.sin(p * 2 + seed) * 36 + Math.sin(p * 5 + seed * 2) * 15);
    }
    g.lineTo(W, H); g.closePath(); g.fillPath();
  }
  function haze(g, y, h, color, alpha) {
    for (let i = 0; i < h; i++) {
      const p = 1 - Math.abs((i / h - .5) * 2); rect(g, color, 0, y + i, W, 1, alpha * p * p);
    }
  }
  function roof(g, x, y, w, h, color, trim) {
    poly(g, color, [[x - 12, y + 8], [x + w * .25, y], [x + w * .75, y], [x + w + 12, y + 8], [x + w, y + 5], [x + w * .74, y + 4], [x + w * .26, y + 4], [x, y + 5]]);
    rect(g, trim, x, y + 8, w, 2, .8);
    rect(g, color, x + 6, y + 10, w - 12, h);
    for (let k = 1; k < 5; k++) rect(g, trim, x + 8, y + 11 + k * 9, w - 16, 1, .22);
    for (let k = 0; k < 3; k++) rect(g, 0xf2c47c, x + 14 + k * ((w - 32) / 3), y + 19, 5, 7, .45);
  }
  function backgrounds(scene) {
    make(scene, 'bg_haze', 4, H, g => haze(g, 310, H - 310, 0xe8dfcf, .13));
    make(scene, 'fx_grade', 4, 4, g => rect(g, 0xffffff, 0, 0, 4, 4));
    // Texture này được đặt phủ màn hình ở buildBackground; thiếu nó sẽ hiện ô texture xanh lá mặc định của Phaser.
    make(scene, 'fx_vignette', W, H, g => {
      const edge = 76;
      for (let i = 0; i < edge; i++) {
        const fade = (1 - i / edge) ** 2;
        rect(g, 0x101018, 0, i, W, 1, .2 * fade);
        rect(g, 0x101018, 0, H - 1 - i, W, 1, .2 * fade);
        rect(g, 0x101018, i, 0, 1, H, .24 * fade);
        rect(g, 0x101018, W - 1 - i, 0, 1, H, .24 * fade);
      }
    });
    gradient(scene, 'bg_city_sky', [0x25374d, 0x526477, 0xc28b69, 0xf0bd80]);
    gradient(scene, 'bg_forest_sky', [0x293d46, 0x53756d, 0xc58c67, 0xf0c38b]);
    gradient(scene, 'bg_cave_sky', [0x101d30, 0x263a4a, 0x43545a, 0x766457]);
    gradient(scene, 'bg_redgate_sky', [0x160f27, 0x342044, 0x803b48, 0xd47b62]);

    // Tân Đô và các vùng thành cổ: núi lớp xa, mái ngói và đèn lồng.
    make(scene, 'bg_city_far', W, H, g => {
      ell(g, 0xffdb9d, 742, 110, 58, 58, .62); ell(g, 0xfff0c9, 742, 110, 37, 37, .58);
      ridge(g, 380, 0x334858, 1, .7); ridge(g, 420, 0x45535a, 3, .85);
      for (let i = 0; i < 20; i++) {
        const x = i * 51 - 10, y = 290 + rnd(i, 5) * 78, w = 38 + rnd(i, 7) * 28, h = 90 + rnd(i, 9) * 110;
        rect(g, i % 2 ? 0x39434a : 0x465057, x, y, w, h, .74);
        roof(g, x - 4, y - 8, w + 8, 6, i % 2 ? 0x4c3433 : 0x59403a, 0x98715a);
        for (let wy = y + 18; wy < y + h - 12; wy += 27) rect(g, 0xf0c37d, x + 10, wy, 4, 8, .38);
      }
      haze(g, 380, 150, 0xe3bd9c, .16);
    });
    make(scene, 'bg_city_mid', W, H, g => {
      ridge(g, 370, 0x43504d, 5, .8);
      for (let i = 0; i < 13; i++) {
        const x = i * 79 - 14, y = 325 + rnd(i, 12) * 45, w = 54 + rnd(i, 13) * 28, h = 140 + rnd(i, 14) * 90;
        rect(g, 0x55473e, x + 7, y + 17, w - 14, h, .92);
        roof(g, x, y, w, 7, i % 3 ? 0x69413a : 0x754b3e, 0xc08b5d);
        rect(g, 0x322f30, x + w * .42, y + h - 38, 12, 38, .7);
        for (let wx = x + 15; wx < x + w - 10; wx += 22) rect(g, 0xf0c27f, wx, y + 38, 7, 12, .46);
      }
      haze(g, 425, 110, 0xe6c2a0, .22);
    });
    make(scene, 'bg_city_near', W, H, g => {
      for (let i = 0; i < 5; i++) {
        const x = i * 215 - 30, y = 270 + rnd(i, 2) * 52, w = 150 + rnd(i, 3) * 34, h = 250 + rnd(i, 4) * 90;
        rect(g, 0x352e2c, x + 13, y + 26, w - 26, h, .9); roof(g, x, y, w, 12, 0x523631, 0xb47c50);
        rect(g, 0x292728, x + w * .44, y + h - 70, 25, 70);
        for (let wx = x + 35; wx < x + w - 22; wx += 37) {
          rect(g, 0xd7a66b, wx, y + 57, 13, 25, .38); rect(g, 0x382b26, wx + 5, y + 57, 2, 25, .8);
        }
      }
      // Lồng đèn ấm thay cho biển neon.
      for (let i = 0; i < 7; i++) {
        const x = 60 + i * 145; rect(g, 0x332c2a, x + 8, 170, 2, 54, .8);
        ell(g, 0xf0b66b, x + 9, 230, 12, 20, .58); rect(g, 0x53352b, x + 1, 215, 16, 3); rect(g, 0x53352b, x + 2, 245, 14, 3);
      }
      haze(g, 438, 130, 0xc99b73, .15);
    });

    // Rừng thu: nhiều lớp thông, tre và lá phong.
    make(scene, 'bg_forest_far', W, H, g => {
      ell(g, 0xf2d6aa, 760, 116, 44, 44, .38); ridge(g, 334, 0x45635b, 2, .66); ridge(g, 380, 0x365249, 4, .86);
      for (let i = 0; i < 40; i++) {
        const x = (i * 53 + rnd(i, 2) * 29) % W, base = 412 + rnd(i, 3) * 38, h = 80 + rnd(i, 4) * 155, w = 18 + rnd(i, 5) * 20;
        poly(g, i % 3 ? 0x314c43 : 0x3a5146, [[x - w, base], [x, base - h], [x + w, base]]);
        poly(g, 0x273e39, [[x - w * .7, base - h * .42], [x, base - h * .78], [x + w * .7, base - h * .42]], .85);
      }
      haze(g, 340, 190, 0xcad4b7, .17);
      for (let i = 0; i < 34; i++) ell(g, i % 3 ? 0xe6b56f : 0xc87b58, (i * 97) % W, 170 + (i * 61) % 290, 3, 2, .38);
    });
    make(scene, 'bg_forest_mid', W, H, g => {
      ridge(g, 375, 0x35473e, 6, .9);
      for (let i = 0; i < 18; i++) {
        const x = i * 58 - 10 + rnd(i, 11) * 22, h = 180 + rnd(i, 12) * 185, y = H - h, w = 5 + rnd(i, 13) * 7;
        rect(g, 0x302d27, x, y, w, h); rect(g, 0x796143, x + 1, y, 2, h, .55);
        for (let k = 0; k < 4; k++) {
          const cy = y + 23 + k * 29, dir = k % 2 ? -1 : 1;
          poly(g, 0x53604b, [[x + 3, cy], [x + dir * (28 + rnd(i, k) * 25), cy - 34], [x + dir * (41 + rnd(i, k + 2) * 20), cy - 25], [x + 8, cy + 6]], .72);
          ell(g, k % 2 ? 0xc77f56 : 0xb9664b, x + dir * (27 + rnd(i, k) * 24), cy - 33, 8, 5, .55);
        }
      }
      haze(g, 420, 125, 0xd9c19c, .13);
    });
    make(scene, 'bg_forest_near', W, H, g => {
      for (let i = 0; i < 8; i++) {
        const x = i * 143 - 20, h = 310 + rnd(i, 23) * 190, w = 13 + rnd(i, 24) * 8;
        rect(g, 0x292724, x, H - h, w, h); rect(g, 0x69513b, x + 3, H - h, 2, h, .6);
        for (let k = 0; k < 4; k++) {
          const y = H - h + 20 + k * 54;
          poly(g, 0x334338, [[x + 5, y], [x - 62, y - 48], [x - 88, y - 24], [x - 12, y + 9]], .95);
          poly(g, 0x3a4937, [[x + 7, y + 20], [x + 70, y - 35], [x + 90, y - 10], [x + 17, y + 30]], .9);
          ell(g, k % 2 ? 0xb86a4b : 0xc68958, x - 54, y - 39, 21, 12, .52);
          ell(g, k % 2 ? 0xd39a5c : 0x986044, x + 64, y - 30, 24, 13, .48);
        }
      }
      haze(g, 455, 115, 0xc9b18c, .12);
    });

    // Hang và cống cổ: vòm đá, nhũ băng và pha lê lam ngọc.
    make(scene, 'bg_cave_far', W, H, g => {
      for (let i = 0; i < 12; i++) {
        const x = i * 86 - 12, w = 54 + rnd(i, 3) * 42, h = 115 + rnd(i, 4) * 120;
        poly(g, i % 2 ? 0x1a2a3b : 0x203243, [[x, 0], [x + w, 0], [x + w - 6, h * .55], [x + w * .56, h], [x + w * .24, h * .63], [x + 3, h * .82]]);
      }
      for (let i = 0; i < 13; i++) {
        const x = (i * 79 + 25) % W, y = 205 + rnd(i, 6) * 170, h = 55 + rnd(i, 7) * 80;
        poly(g, 0x567d83, [[x - 12, y], [x + 12, y], [x + 4, y + h], [x, y + h + 17], [x - 5, y + h]], .55);
        poly(g, 0xb6cdb7, [[x - 3, y + 7], [x + 3, y + 8], [x + 1, y + h], [x - 1, y + h]], .44);
      }
      haze(g, 285, 200, 0x8caba4, .14);
    });
    make(scene, 'bg_cave_mid', W, H, g => {
      ridge(g, 390, 0x263746, 7, .96);
      for (let i = 0; i < 12; i++) {
        const x = i * 88 + rnd(i, 8) * 27, y = 400 + rnd(i, 9) * 65, h = 80 + rnd(i, 10) * 110, w = 15 + rnd(i, 11) * 17;
        poly(g, 0x547c7d, [[x - w, y], [x - w * .5, y - h * .68], [x - 3, y - h], [x + w * .55, y - h * .45], [x + w, y]]);
        poly(g, 0xa0c7b7, [[x - 4, y - 6], [x - 2, y - h * .88], [x + 4, y - h * .53], [x + 2, y]], .42);
      }
      haze(g, 405, 135, 0x94aaa1, .15);
    });
    make(scene, 'bg_cave_near', W, H, g => {
      for (let i = 0; i < 7; i++) {
        const x = i * 159 - 45, top = 285 + rnd(i, 14) * 60;
        poly(g, 0x142231, [[x - 90, H], [x - 55, top + 65], [x - 22, top + 18], [x + 3, top], [x + 27, top + 40], [x + 58, top + 84], [x + 100, H]]);
        poly(g, 0x324650, [[x - 24, top + 47], [x + 2, top + 4], [x + 25, top + 45], [x + 12, top + 38], [x + 1, top + 22], [x - 10, top + 43]], .65);
      }
      for (let i = 0; i < 8; i++) {
        const x = 45 + i * 128, y = 460 + rnd(i, 20) * 66;
        poly(g, 0x387f8a, [[x - 24, y], [x - 9, y - 63], [x, y - 101], [x + 15, y - 43], [x + 25, y]], .72);
        poly(g, 0xa4d4ba, [[x - 2, y - 8], [x, y - 92], [x + 7, y - 44], [x + 4, y]], .7);
      }
      haze(g, 450, 110, 0x547a82, .13);
    });

    // Cổng dị giới: trời rạn nứt, đảo đá trôi và cổng son lớn.
    make(scene, 'bg_redgate_far', W, H, g => {
      ell(g, 0xefaa7d, 485, 235, 184, 150, .12); ell(g, 0xffd8a0, 485, 235, 115, 94, .14);
      g.lineStyle(5, 0xe99a72, .38); g.strokeEllipse(485, 235, 242, 194);
      g.lineStyle(2, 0xf1c08a, .42); g.strokeEllipse(485, 235, 207, 160);
      for (let i = 0; i < 8; i++) {
        const x = i * 138 - 30, y = 245 + rnd(i, 31) * 150, w = 82 + rnd(i, 32) * 44;
        poly(g, i % 2 ? 0x392b43 : 0x4c3044, [[x, y], [x + w * .23, y - 25], [x + w * .72, y - 17], [x + w, y], [x + w * .74, y + 17], [x + w * .28, y + 26]]);
        poly(g, 0x73504e, [[x + 12, y - 17], [x + w * .25, y - 22], [x + w * .73, y - 14], [x + w - 5, y - 1]], .45);
      }
      for (let i = 0; i < 50; i++) ell(g, i % 4 ? 0xf3c27f : 0xe78c74, (i * 97) % W, 55 + (i * 61) % 430, 1.5 + rnd(i) * 1.7, 1.5, .35 + rnd(i, 2) * .35);
      haze(g, 390, 140, 0xb35e65, .2);
    });
    make(scene, 'bg_redgate_mid', W, H, g => {
      for (let i = 0; i < 13; i++) {
        const x = i * 82 - 4, y = 393 + rnd(i, 44) * 85, w = 34 + rnd(i, 45) * 33, h = 55 + rnd(i, 46) * 75;
        poly(g, 0x35243a, [[x - w, y], [x - w * .52, y - h * .55], [x - 3, y - h], [x + w * .3, y - h * .7], [x + w, y]]);
        poly(g, 0x754052, [[x - 2, y - h + 15], [x + 3, y - h + 4], [x + 7, y - h * .38], [x + 3, y - h * .6]], .6);
      }
      haze(g, 415, 130, 0xc27a71, .15);
    });
    make(scene, 'bg_redgate_near', W, H, g => {
      // Cổng son (torii) làm mốc thị giác thay vì vòng neon.
      const x = 480, y = 340;
      rect(g, 0x44232d, x - 115, y - 128, 28, 250); rect(g, 0x44232d, x + 87, y - 128, 28, 250);
      poly(g, 0x8e3e42, [[x - 180, y - 148], [x + 180, y - 148], [x + 146, y - 126], [x - 145, y - 126]]);
      rect(g, 0x6d3038, x - 153, y - 123, 306, 15); rect(g, 0xdaa16c, x - 149, y - 109, 298, 3, .7);
      for (let i = 0; i < 10; i++) {
        const xx = i * 112 + 18;
        poly(g, 0x211a2a, [[xx - 48, H], [xx - 20, 455], [xx, 418 + rnd(i, 50) * 48], [xx + 30, 472], [xx + 53, H]]);
      }
      haze(g, 453, 95, 0x8f4953, .13);
    });
  }
  Object.assign(Art._, { backgrounds });
})();
