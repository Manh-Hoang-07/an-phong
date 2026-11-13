'use strict';
/* Diện mạo riêng từng bản đồ (giai đoạn A): tông sương, ánh sáng phủ, hạt sáng, thời tiết, màu nền.
 * Chỉ là DỮ LIỆU: map nào không khai báo (hoặc thiếu trường) thì dùng đúng giá trị cũ theo theme,
 * nên thêm/sửa dòng ở đây không bao giờ làm hỏng game.
 *
 * Trường (đều tùy chọn):
 *   haze   – màu sương sát nền          grade – màu ánh sáng phủ chung (nhân màu, nên giữ sáng)
 *   mote   – màu hạt sáng bay           moteN – số hạt (mặc định 14)
 *   bg     – màu nền camera             weather – 'rain' | 'fog' | 'snow' | 'ember' | 'none'
 *   fog    – màu sương khi weather = 'fog'
 *   pack   – (giai đoạn sau) tên bộ nền ảnh trong public/assets/bg/<pack>/ ; thiếu ảnh → nền vẽ code
 */
const MapLooks = {
  // Giá trị mặc định cũ theo theme (giữ nguyên hành vi hiện tại)
  THEME: {
    city: { haze: 0xd3a37c, grade: 0xffeedc, mote: 0xf0c37f, weather: 'rain' },
    forest: { haze: 0xc8c4a0, grade: 0xffead1, mote: 0xe7b773, weather: 'fog', fog: 0xcff7ee },
    cave: { haze: 0x91b7b2, grade: 0xd7ece4, mote: 0xb7d9c7, weather: 'fog', fog: 0xb9a8ff, bg: 0x182735 },
    redgate: { haze: 0xd89178, grade: 0xffd9c2, mote: 0xf1ae83, weather: 'ember', bg: 0x21182c },
  },

  MAPS: {
    // --- Rừng
    // Rừng Sương: sương xanh nhạt + lá bay + đom đóm vàng lục; cây và cỏ lay nhẹ
    // (nền ảnh 'misty' đã có sương xanh lam → haze/grade nhạt, hơi lạnh để không đục màu)
    rung:      { haze: 0xa9c4d6, grade: 0xeaf2ff, weather: 'fog', fog: 0xcfe6f2, mote: 0xd9f0a8, moteN: 20, leaves: [0x9cc062, 0xc8d26a, 0xd9a65a], sway: true, grassSway: true },
    b_en_pha:  { haze: 0xb7c4c2, grade: 0xe8ecea, mote: 0xcfd8d4, weather: 'rain' },
    d_lay_muc: { haze: 0x9aa56f, grade: 0xe2e6c0, mote: 0xb8c46a, weather: 'fog', fog: 0xa9b87a },
    lang_chai: { haze: 0xe0b98a, grade: 0xfff0d6, mote: 0xffd18a, weather: 'none' },
    chan_nui:  { haze: 0xc6dcec, grade: 0xe8f0ff, mote: 0xdcefff, weather: 'snow', bg: 0x8fa9bf },
    // --- Hang
    hang:          { haze: 0x7fd0c8, grade: 0xd0f2ec, mote: 0x9ff2da },
    kho_bac:       { haze: 0xb99a5e, grade: 0xf2e2bc, mote: 0xffd070, weather: 'none' },
    hem_nui:       { haze: 0xb4c8d8, grade: 0xe2ecf8, mote: 0xdcecff, weather: 'snow', bg: 0x2a3a4c },
    lo_ren_bang:   { haze: 0x8fc0d8, grade: 0xdceaf4, mote: 0xff9a5a, weather: 'ember', bg: 0x16283a },
    dinh_nui:      { haze: 0xc0d4e6, grade: 0xe6f0fc, mote: 0xe6f4ff, weather: 'snow', bg: 0x2c3e52 },
    cc_hac_nguyet: { haze: 0x7c6a9c, grade: 0xd8cce8, mote: 0xb48cf0, bg: 0x1a1426 },
    tp_chim_t:     { haze: 0x7fb0a0, grade: 0xcfe8e0, mote: 0xa8e6d4, fog: 0x9fd8c8, bg: 0x142a30 },
    tp_chim_c:     { haze: 0x5f8a80, grade: 0xbcd8d0, mote: 0x8fc8b8, fog: 0x7fb0a0, bg: 0x0f2026 },
    thu_vien:      { haze: 0xc2a46a, grade: 0xf4e4c2, mote: 0xffe0a0, weather: 'none', bg: 0x2a2218 },
    phong_luu_tru: { haze: 0x8a78a8, grade: 0xdcd0ec, mote: 0xc4a4f0, bg: 0x1c1628 },
    dinh_thap:     { haze: 0x8aa4d0, grade: 0xd6e0f6, mote: 0xa8c8ff, weather: 'none', bg: 0x141c34 },
    // --- Thành phố
    lang:           { },
    vac_da:         { haze: 0xc8b8a0, grade: 0xf4ead8, mote: 0xe8d4a0, weather: 'none' },
    cong_khai_hoan: { haze: 0xe0c48a, grade: 0xfff0cc, mote: 0xffd870, weather: 'none' },
    quang_truong:   { haze: 0xf0d8a8, grade: 0xfff4dc, mote: 0xfff0b0, weather: 'none' },
    // --- Dị giới
    cong_do:      { },
    tan_do_bt:    { haze: 0xb88a80, grade: 0xe8c8c0, mote: 0xe89a80, weather: 'ember', bg: 0x241a24 },
    cau_dan:      { haze: 0xa86c70, grade: 0xf0c4c8, mote: 0x7fc8ff, weather: 'ember', bg: 0x1e1626 },
    sanh_cho:     { haze: 0x8a7cc8, grade: 0xdcd4f4, mote: 0xc4a8ff, weather: 'none', bg: 0x16122c },
    dinh_cong_vh: { haze: 0x9a7ad8, grade: 0xe0d0fa, mote: 0xd0a8ff, weather: 'none', bg: 0x1a1230 },
    tam_diem:     { haze: 0x7a60b0, grade: 0xd0c4ec, mote: 0xb890f0, weather: 'fog', fog: 0x8a70c0, bg: 0x120e24 },
    cong_ss:      { haze: 0x4a4468, grade: 0xc4c0d8, mote: 0xf0f0ff, weather: 'none', bg: 0x0c0a18 },
    thien_khoi:   { haze: 0xc87a60, grade: 0xffcab0, mote: 0xff9a60, weather: 'ember', bg: 0x2a1618 },
    long_mach:    { haze: 0x6ab8b0, grade: 0xcceee8, mote: 0x80f0d8, weather: 'none', bg: 0x0e2428 },
    tinh_van:     { haze: 0x7a88d8, grade: 0xd4daf8, mote: 0xe0e8ff, weather: 'none', moteN: 22, bg: 0x0e1230 },
    than_mong:    { haze: 0xd890c0, grade: 0xf8d8ec, mote: 0xffa8d8, weather: 'none', bg: 0x281430 },
    sang_the:     { haze: 0xf0dc9a, grade: 0xfff6d8, mote: 0xfff0a0, weather: 'none', moteN: 22, bg: 0x2a2414 },
  },

  // Cờ tổng: false → không tải, không dùng ảnh nền (luôn là nền vẽ code). Bật khi pack đã chuẩn hóa vào public/assets/bg/<pack>/.
  useImages: true,
  // Các bộ nền ảnh trong public/assets/bg/<pack>/<lớp>.<ext>. Pack chỉ có một số lớp thì lớp còn lại dùng hình vẽ code.
  PACKS: {
    night: { layers: ['sky', 'far', 'mid', 'near'], ext: 'png' },    // Digital Moons – núi đêm có trăng + mây (HD vẽ tay)
    misty: { layers: ['sky', 'far', 'mid', 'near'], ext: 'png' },   // Digital Moons – rừng sương HD
    space1: { layers: ['sky'], ext: 'jpg' },                        // Digital Moons – trời sao (4 biến thể màu)
    space2: { layers: ['sky'], ext: 'jpg' },
    space3: { layers: ['sky'], ext: 'jpg' },
    space4: { layers: ['sky'], ext: 'jpg' },
  },

  // Gộp: trường nào map không khai báo thì lấy theo theme, thiếu nữa thì để undefined (nơi dùng tự có mặc định)
  get(mapId, theme) {
    const look = Object.assign({}, this.THEME[theme] || {}, this.MAPS[mapId] || {});
    if (!look.scene && typeof MapScenes !== 'undefined' && MapScenes[mapId]) look.scene = MapScenes[mapId];
    if (!look.decor && typeof MapDecor !== 'undefined' && MapDecor[mapId]) look.decor = MapDecor[mapId];   // cảnh trí + ô đất: map_scenes.js   // công thức nền: map_scenes.js
    return look;
  },

  /* ---------------------------------------------------------------- Công thức nền (ghép lớp + đổi sắc)
   * Map muốn nền riêng khai báo `scene` (hoặc `pack` cho cách đơn giản: 4 lớp của một bộ, không chỉnh):
   *   scene: { sky: 'night/sky', far: { src: 'sunset/far', hue: 40, sat: 0.8, lum: 0.9 }, mid: ..., near: ..., all: { hue: 20 } }
   * Mỗi lớp (sky | far | mid | near) lấy từ bất kỳ bộ nào trong PACKS ('bộ/lớp'), nên ghép được trời của bộ này, núi của bộ kia.
   * Tham số chỉnh màu của một lớp (đều tùy chọn; `all` áp cho cả 4 lớp, lớp nào khai báo riêng thì đè lên):
   *   hue  xoay màu (độ, -180…180)    sat  nhân độ bão hòa (1 = giữ)    lum  nhân độ sáng (1 = giữ)
   *   gamma >1 nâng vùng tối (ảnh trời sao rất tối)   mirror ghép thêm bản gương bên phải (cảnh tĩnh → lặp ngang liền mạch)   tint nhân màu 0xRRGGBB (tối/ấm/lạnh)    mix  [0xRRGGBB, 0…1] trộn dần về một màu (sương/hoàng hôn)    flip  lật gương ngang
   * Chỉnh màu làm MỘT LẦN lúc vào map (canvas) nên không tốn thêm tệp; lớp nào thiếu thì dùng hình vẽ code của theme.
   * Thêm map mới: chỉ cần thêm một dòng trong MAPS với `scene` – không cần tải thêm ảnh. */
  // Biến thể ô đất (look.decor.tile): tạo từ ô đất gốc `from` (city | forest | cave | redgate) bằng chỉnh màu lúc vào map – không cần thêm ảnh.
  TILE_VARIANTS: {
    snow: { from: 'cave', sat: 0.15, lum: 1.9, mix: [0xe8f0ff, 0.35] },        // tuyết
    sand: { from: 'city', hue: 12, sat: 1.9, lum: 1.5, mix: [0xe0c080, 0.15] },  // cát
    redsand: { from: 'city', hue: -5, sat: 2.2, lum: 1.1 },                      // cát đỏ
    stone: { from: 'city', sat: 0.55, lum: 1.1 },                                // đá xám
    gold: { from: 'city', hue: 25, sat: 2, lum: 1.3 },                           // đá vàng (kho, sảnh)
    ash: { from: 'city', sat: 0.4, lum: 0.7 },                                   // tro (thành phố cháy)
    wet: { from: 'cave', hue: -10, sat: 0.9, lum: 0.8 },                         // đá ẩm xanh (dưới nước, cống)
    purple: { from: 'cave', hue: 60, sat: 1.2, lum: 0.8 },                       // đá tím
    void: { from: 'cave', hue: 80, sat: 1.4, lum: 0.65, mix: [0x2a1860, 0.2] },  // vũ trụ tím
    voidg: { from: 'cave', hue: -40, sat: 1.4, lum: 0.7 },                       // vũ trụ lục
    swamp: { from: 'forest', hue: -25, sat: 0.7, lum: 0.75, mix: [0x44502a, 0.2] }, // đầm lầy
    pink: { from: 'forest', hue: 150, sat: 1.1 },                                // đất hồng (mộng)
    teal: { from: 'forest', hue: 60 },                                           // đất ngọc lam
  },
  // Danh sách bộ cảnh trí ảnh một map cần nạp (từ look.decor.tree / ceil / floor / bits)
  propSets(look) {
    const D = look.decor || {}, out = new Set();
    if (typeof MapProps === 'undefined') return [];
    for (const n of [D.tree, D.ceil, D.floor, D.bits]) if (n && MapProps.SETS[n]) out.add(n);
    return [...out];
  },
  LAYERS: ['sky', 'far', 'mid', 'near'],
  layerDefs(look) {
    const out = {};
    if (!this.useImages) return out;
    const sc = look.scene;
    if (!sc && look.pack && this.PACKS[look.pack]) {
      for (const l of this.PACKS[look.pack].layers) out[l] = { pack: look.pack, layer: l };
      return out;
    }
    if (!sc) return out;
    for (const l of this.LAYERS) {
      let d = sc[l];
      if (!d) continue;
      if (typeof d === 'string') d = { src: d };
      const parts = d.src.split('/'), pack = parts[0], layer = parts[1] || l;   // 'space1' = 'space1/sky' (lớp mặc định = tên ô)
      const P = this.PACKS[pack];
      if (!P || !P.layers.includes(layer)) continue;     // nguồn không có → lớp này dùng hình vẽ code
      out[l] = Object.assign({}, sc.all || {}, d, { pack, layer });
    }
    return out;
  },
  // Danh sách [bộ, lớp] cần tải cho một map (không trùng)
  needs(look) {
    const seen = new Set(), list = [];
    for (const d of Object.values(this.layerDefs(look))) { const k = d.pack + '/' + d.layer; if (!seen.has(k)) { seen.add(k); list.push(d); } }
    return list;
  },
  needsGrade(d) { return !!(d.hue || (d.sat != null && d.sat !== 1) || (d.lum != null && d.lum !== 1) || d.tint != null || d.mix || d.flip || d.mirror || (d.gamma != null && d.gamma !== 1)); },
  // Áp chỉnh màu lên dữ liệu điểm ảnh RGBA (Uint8ClampedArray). Ma trận 3×3 = xoay màu · bão hòa, rồi nhân sáng/tint, rồi trộn màu.
  gradePixels(px, d) {
    const rad = (d.hue || 0) * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), sat = d.sat == null ? 1 : d.sat, lum = d.lum == null ? 1 : d.lum;
    // bão hòa
    const S = [0.213 + 0.787 * sat, 0.715 - 0.715 * sat, 0.072 - 0.072 * sat, 0.213 - 0.213 * sat, 0.715 + 0.285 * sat, 0.072 - 0.072 * sat, 0.213 - 0.213 * sat, 0.715 - 0.715 * sat, 0.072 + 0.928 * sat];
    // xoay màu (công thức CSS hue-rotate)
    const H = [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072];
    const m = new Array(9);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) m[r * 3 + q] = H[r * 3] * S[q] + H[r * 3 + 1] * S[3 + q] + H[r * 3 + 2] * S[6 + q];
    const tr = d.tint == null ? 1 : ((d.tint >> 16) & 255) / 255, tg = d.tint == null ? 1 : ((d.tint >> 8) & 255) / 255, tb = d.tint == null ? 1 : (d.tint & 255) / 255;
    const kr = lum * tr, kg = lum * tg, kb = lum * tb;
    const mixOn = !!d.mix, ma = mixOn ? d.mix[1] : 0, mr = mixOn ? ((d.mix[0] >> 16) & 255) * ma : 0, mg = mixOn ? ((d.mix[0] >> 8) & 255) * ma : 0, mb = mixOn ? (d.mix[0] & 255) * ma : 0, ia = 1 - ma;
    // gamma: bảng tra 0..255 (chỉ dùng khi có)
    let lut = null;
    if (d.gamma != null && d.gamma !== 1) { lut = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) lut[v] = 255 * Math.pow(v / 255, 1 / d.gamma); }
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const r0 = px[i], g0 = px[i + 1], b0 = px[i + 2];
      let r = (m[0] * r0 + m[1] * g0 + m[2] * b0) * kr, g = (m[3] * r0 + m[4] * g0 + m[5] * b0) * kg, b = (m[6] * r0 + m[7] * g0 + m[8] * b0) * kb;
      if (lut) { r = lut[r < 0 ? 0 : r > 255 ? 255 : r | 0]; g = lut[g < 0 ? 0 : g > 255 ? 255 : g | 0]; b = lut[b < 0 ? 0 : b > 255 ? 255 : b | 0]; }
      px[i] = r * ia + mr; px[i + 1] = g * ia + mg; px[i + 2] = b * ia + mb;
    }
  },
  // Tạo canvas đã chỉnh màu / lật gương từ một ảnh đã nạp (dùng cho game và trang xem trước)
  gradeCanvas(img, d) {
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
    const cv = document.createElement('canvas'); cv.width = w0 * (d.mirror ? 2 : 1); cv.height = h0;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    // bản A (lật nếu flip) nằm ở [0, w0]; bản B (mirror) đối xứng với A, nằm ở [w0, 2·w0]
    if (d.flip) ctx.setTransform(-1, 0, 0, 1, w0, 0); else ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, 0, 0);
    if (d.mirror) {
      if (d.flip) ctx.setTransform(1, 0, 0, 1, w0, 0); else ctx.setTransform(-1, 0, 0, 1, 2 * w0, 0);
      ctx.drawImage(img, 0, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.needsGrade(d) && (d.hue || d.sat != null || d.lum != null || d.tint != null || d.mix || d.gamma != null)) {
      const data = ctx.getImageData(0, 0, cv.width, cv.height);
      this.gradePixels(data.data, d);
      ctx.putImageData(data, 0, 0);
    }
    return cv;
  },
};

// Các bộ nền vector HD của Craftpix (freebies) – mỗi bộ đủ 4 lớp:
//   uw1..4  dưới nước: phế tích / rạn san hô / hang có bộ xương + tinh thể / nước sâu
//   hal1..4 halloween: nhà ma xanh lá / rừng nhện đỏ / nghĩa địa trăng khuyết / phòng lò sưởi
//   fai1..4 cổ tích: rừng tre thác nước / rừng tím bướm / cây chết trên nước xanh / rừng nấm
//   bch1..4 bãi biển: nắng cọ / đảo thuyền buồm / quán biển / hoàng hôn cọ  (bch3/far lộ đường nối, đừng dùng lớp đó)
['uw1', 'uw2', 'uw3', 'uw4', 'hal1', 'hal2', 'hal3', 'hal4', 'fai1', 'fai2', 'fai3', 'fai4', 'bch1', 'bch2', 'bch3', 'bch4']
  .forEach((p) => { MapLooks.PACKS[p] = { layers: ['sky', 'far', 'mid', 'near'], ext: 'png' }; });

// Craftpix freebies đợt 2:
//   win1..4  Winter Holiday: rừng thông tuyết ngày / làng tuyết ngày / làng tuyết đêm núi / cây Giáng sinh đêm
//   cfr1..4  Cartoon Forest: rừng xanh / rừng huyền ảo đom đóm / rừng nắng / rừng thu đèn lồng + nấm sáng
//   des1..4  Desert: hẻm đá tím / ốc đảo xương rồng / cồn cát xương hóa thạch / cồn cát xương rồng
//   elv2..4  Elven Land: đảo nổi có tháp / tàn tích vòm đá / tường thành bên sông có làng
//   hor1,3,4 Horizontal: núi hồ / rừng thông đêm sao / thác nước hồ pastel
['win1', 'win2', 'win3', 'win4', 'cfr1', 'cfr2', 'cfr3', 'cfr4', 'des1', 'des2', 'des3', 'des4', 'elv2', 'elv3', 'elv4', 'hor1', 'hor3', 'hor4']
  .forEach((p) => { MapLooks.PACKS[p] = { layers: ['sky', 'far', 'mid', 'near'], ext: 'png' }; });

// Đợt 3:
//   vamp1..4 (Craftpix Vampire Battle, 4K): ban công lâu đài / sảnh ngai kính màu / cổng lâu đài trăng dơi / nghĩa địa trăng đỏ.
//            Chỉ có lớp sky (ảnh tổng hợp cố định); far/mid/near rỗng để không chồng hình vẽ code lên.
//   bcn (thành phố đêm hiện đại), brl (đồng quê có làng, sông, núi): Bongseng, pixel art 1900×600, lọc NEAREST.
['vamp1', 'vamp2', 'vamp3', 'vamp4'].forEach((p) => { MapLooks.PACKS[p] = { layers: ['sky', 'far', 'mid', 'near'], ext: 'png' }; });
['bcn', 'brl'].forEach((p) => { MapLooks.PACKS[p] = { layers: ['sky', 'far', 'mid', 'near'], ext: 'png', filter: 'nearest' }; });

// Lớp rỗng (PNG trong suốt 2×2): dùng để che hình vẽ code của lớp đó (vd. cảnh tĩnh phủ kín màn hình, không cần mid/near vẽ code)
MapLooks.PACKS.blank = { layers: ['sky', 'far', 'mid', 'near'], ext: 'png' };
// Lornn "Dungeons, Ruins, & Caves" (tranh AI vẽ lại, dùng thương mại được): cảnh TĨNH 1215×810, chỉ có lớp far (jpg).
// Dùng qua still('lr_xxx') trong map_scenes.js: far = ảnh ghép gương (lặp ngang), các lớp khác rỗng.
['cav9', 'cav10', 'shr8', 'str2', 'rn10', 'rn7', 'rn22', 'tun7', 'shr5', 'rune1', 'rn6', 'rn3', 'rn16', 'shr6', 'tun29', 'rn12', 'rn19', 'rn14', 'cav6', 'rn15']
  .forEach((p) => { MapLooks.PACKS['lr_' + p] = { layers: ['far'], ext: 'jpg', cover: true }; });

// Tân Đô mới dùng lại nền, cảnh trí và diện mạo của một map cùng vùng
for (const [id, from] of Object.entries({ tan_do_2: 'lang_chai', tan_do_3: 'chan_nui', tan_do_4: 'quang_truong', tan_do_6: 'thien_khoi', tan_do_7: 'tinh_van', ham_ngam: 'tp_chim_c', quan_thuong_mai: 'vac_da', thien_khoi_1: 'thien_khoi', thien_khoi_2: 'thien_khoi', thien_khoi_3: 'thien_khoi', thien_khoi_4: 'thien_khoi', long_mach_1: 'long_mach', long_mach_2: 'long_mach', long_mach_3: 'long_mach', long_mach_4: 'long_mach', tinh_van_1: 'tinh_van', tinh_van_2: 'tinh_van', tinh_van_3: 'tinh_van', tinh_van_4: 'tinh_van', than_mong_1: 'than_mong', than_mong_2: 'than_mong', than_mong_3: 'than_mong', than_mong_4: 'than_mong', sang_the_1: 'sang_the', sang_the_2: 'sang_the', sang_the_3: 'sang_the', sang_the_4: 'sang_the' })) {
  if (MapScenes[from]) MapScenes[id] = MapScenes[from];
  if (MapDecor[from]) MapDecor[id] = MapDecor[from];
  if (MapLooks.MAPS[from]) MapLooks.MAPS[id] = MapLooks.MAPS[from];
}
