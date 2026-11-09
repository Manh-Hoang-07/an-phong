'use strict';
/*
 * Hình nhân vật và quái vẽ sẵn (sprite sheet của LuizMelo, giấy phép CC0, xem public/assets/CREDITS.txt).
 * Mỗi bộ có số đo riêng:
 *   fw, fh: cỡ một khung hình     cx: tâm thân theo chiều ngang     fy: vị trí chân (đáy hình)
 *   s: tỉ lệ phóng để nhân vật cao khoảng 56px trong game
 *   anims: { tên: [số khung, tốc độ khung/giây] }
 * Bộ nào thiếu ảnh thì game tự dùng lại hình vẽ bằng code.
 */
const Sprites = (() => {
  const CHARS = {
    // Các bộ pixel art cũ đã đưa về đúng điểm ảnh gốc (trước đây phóng to sẵn 2 lần → bị thu nhỏ mượt, nhòe)
    none: { fw: 162, fh: 162, cx: 85.5, fy: 101, s: 1.25, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 18], attack2: [7, 18], attack3: [8, 18], hit: [3, 12], death: [7, 10] } },
    // Kiếm Sĩ: Knight Man (hiệp sĩ giáp trắng, vẽ tay HD, 3 đường chém)
    kiem_si: { fw: 238, fh: 194, cx: 73, fy: 189, s: 0.45, hd: true, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [10, 16], jump: [3, 10], fall: [3, 10], attack1: [8, 20], attack2: [8, 20], attack3: [9, 20], hit: [4, 12], death: [11, 12] } },
    cung_thu: { fw: 200, fh: 200, cx: 101, fy: 134, s: 0.775, hd: true, combo: ['attack1'],
      anims: { idle: [10, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [6, 16], hit: [3, 12], death: [10, 12] } },
    phap_su: { fw: 231, fh: 190, cx: 110, fy: 141, s: 0.68, combo: ['attack1', 'attack2'],
      anims: { idle: [6, 8], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 18], attack2: [8, 18], hit: [4, 12], death: [7, 10] } },
    // Toàn Năng: Fire Knight (kiếm lớn, chiêu lửa)
    toan_nang: { fw: 171, fh: 108, cx: 51, fy: 107, s: 1.3, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [8, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [11, 18], attack2: [12, 18], attack3: [14, 18], hit: [4, 12], death: [13, 10] } },
    // ---- 3 class mới
    // Sát Thủ: Thief (song đao, vẽ tay HD, 3 combo nhanh)
    sat_thu: { fw: 221, fh: 198, cx: 89, fy: 155, s: 0.45, hd: true, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [8, 22], attack2: [7, 22], attack3: [9, 22], hit: [4, 12], death: [10, 12] } },
    // Tanker: Knight Girl (kiếm + khiên, vẽ tay HD, 3 combo)
    tanker: { fw: 199, fh: 175, cx: 101, fy: 170, s: 0.45, hd: true, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 16], attack2: [7, 16], attack3: [8, 16], hit: [4, 12], death: [10, 10] } },
    // Trị Liệu Sư: Evil Wizard (pháp sư áo choàng) đổi tông xanh lục, phép lửa thành ánh sáng hồi phục; đã làm mịn
    tri_lieu_su: { fw: 196, fh: 146, cx: 60, fy: 138, s: 0.55, hd: true, combo: ['attack1'],
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 16], hit: [4, 12], death: [5, 8] } },
    // Triệu Hồi Sư: Wanderer Magican (craftpix "Free Pixel Wizard"), pháp sư áo choàng, phép vòng xoáy; đã làm mịn 2×
    trieu_hoi_su: { fw: 246, fh: 202, cx: 116, fy: 202, s: 0.45, hd: true, combo: ['attack1', 'attack2'],
      anims: { idle: [8, 10], run: [8, 14], jump: [4, 10], fall: [4, 10], attack1: [7, 16], attack2: [9, 18], hit: [4, 12], death: [4, 8] } },
    // Tử Linh Thuật Sư: Necromancer (áo choàng đen, đầu lâu, trượng đỏ)
    tu_linh_thuat_su: { fw: 92, fh: 111, cx: 36, fy: 105, s: 1.1, combo: ['attack1', 'attack2'],
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [13, 18], attack2: [17, 18], hit: [5, 12], death: [9, 10] } },
    // ---- Dạng tiến hóa (GameData.EVOLUTIONS). Dạng không có bộ hình riêng mượn hình class gốc (EVO_ALIAS).
    // Kiếm Thánh: Female Hero (nữ hiệp sĩ, vệt kiếm sáng)
    kiem_thanh: { fw: 260, fh: 245, cx: 130, fy: 237, s: 0.27, hd: true, combo: ['attack1'],
      anims: { idle: [8, 10], run: [8, 14], jump: [4, 10], fall: [3, 10], attack1: [9, 18], hit: [5, 12], death: [8, 10] } },
    // Đại Pháp Sư: Evil Wizard (pháp sư lửa)
    dai_phap_su: { fw: 98, fh: 73, cx: 30, fy: 69, s: 1.1, combo: ['attack1'],
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 16], hit: [4, 12], death: [5, 8] } },
    // Toàn Năng Tinh Thông: Medieval King
    toan_nang_tinh_thong: { fw: 146, fh: 107, cx: 64, fy: 105, s: 1.1, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [4, 12], attack2: [4, 12], attack3: [4, 12], hit: [4, 12], death: [6, 8] } },
    // Hộ Vệ Bất Khuất: Hero Knight
    ho_ve_bat_khuat: { fw: 135, fh: 85, cx: 50, fy: 82, s: 1.15, combo: ['attack1', 'attack2'],
      anims: { idle: [11, 12], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 16], attack2: [7, 16], hit: [4, 12], death: [11, 12] } },
  };
  const EVO_ALIAS = { than_xa: ['cung_thu', 0x9dffd4], anh_vuong: ['sat_thu', 0xd7a6ff], thanh_linh: ['tri_lieu_su', 0xfff1b8] };
  // Bộ hình + màu riêng cho một class / dạng tiến hóa
  const lookOf = (id) => EVO_ALIAS[id] ? { sheet: EVO_ALIAS[id][0], tint: EVO_ALIAS[id][1] } : { sheet: id, tint: null };
  // Toàn Năng cầm vũ khí của class khác thì hóa thân thành class đó: class sở hữu loại vũ khí (Thần Binh / tay không: null)
  const weaponClass = (wtype) => {
    const owner = wtype && GameData.weaponOwners ? GameData.weaponOwners(wtype).find(s => s !== 'toan_nang') : null;
    return owner && CHARS[owner] ? owner : null;
  };
  // Các bộ hình nhân vật cần cho class: hình class + hình dạng tiến hóa (+ hình class theo vũ khí đang cầm của Toàn Năng)
  const charsFor = (school) => {
    const out = [CHARS[school] ? school : 'none'];
    const evo = GameData.EVOLUTIONS && GameData.EVOLUTIONS[school];
    if (evo && CHARS[lookOf(evo).sheet]) out.push(lookOf(evo).sheet);
    const w = school === 'toan_nang' && typeof App !== 'undefined' && App.player?.equip?.weapon;
    const byWeapon = w && GameData.ITEMS[w.id] ? weaponClass(GameData.ITEMS[w.id].wtype) : null;
    if (byWeapon) out.push(byWeapon);
    return out;
  };
  // bw, bh: khung va chạm trong game (px); fly: quái bay (cy = tâm thân theo chiều dọc)
  const MOBS = {
    mushroom: { fw: 82, fh: 47, rw: 150, cx: 41, fy: 46, s: 1.1, bw: 28, bh: 36,
      anims: { idle: [4, 8], run: [8, 12], attack: [8, 16], hit: [4, 14], death: [4, 8] } },
    goblin: { fw: 90, fh: 48, rw: 150, cx: 44, fy: 47, s: 1.3, bw: 28, bh: 44,
      anims: { idle: [4, 8], run: [8, 14], attack: [8, 16], hit: [4, 14], death: [4, 8] } },
    eye: { fw: 64, fh: 43, rw: 150, cx: 33, cy: 17, fly: true, s: 1.2, bw: 34, bh: 30,
      anims: { idle: [8, 14], run: [8, 14], attack: [8, 18], hit: [4, 14], death: [4, 8] } },
    bat: { fw: 87, fh: 57, rw: 87, cx: 48, cy: 28, fly: true, s: 0.95, bw: 40, bh: 32,
      anims: { idle: [11, 16], run: [11, 16], attack: [11, 22], hit: [3, 14], death: [4, 8] } },
    // ---- Thay hình vẽ bằng code (golem, hình nhân). Nguồn: xem public/assets/CREDITS.txt
    dummy: { fw: 79, fh: 96, cx: 46, fy: 95, hd: true, s: 0.5, bw: 24, bh: 44,
      anims: { idle: [4, 5], run: [4, 5], attack: [2, 8], hit: [3, 12], death: [4, 8] } },
    troll: { fw: 251, fh: 199, cx: 91, fy: 195, hd: true, s: 0.5, bw: 36, bh: 66,
      anims: { idle: [4, 5], run: [3, 8], attack: [4, 10], hit: [3, 10], death: [4, 6] } },
    werewolf: { fw: 252, fh: 157, cx: 120, fy: 150, hd: true, s: 0.63, bw: 40, bh: 56,
      anims: { idle: [4, 5], run: [3, 9], attack: [4, 10], hit: [3, 10], death: [4, 6] } },
    hydra: { fw: 220, fh: 111, rw: 224, cx: 84, fy: 98, hd: true, s: 0.68, bw: 60, bh: 40,
      anims: { idle: [8, 9], run: [8, 12], attack: [10, 14], hit: [6, 12], death: [10, 10] } },
    beast: { fw: 252, fh: 197, cx: 113, fy: 190, hd: true, s: 0.47, bw: 50, bh: 70,
      anims: { idle: [10, 10], run: [10, 12], attack: [10, 14], hit: [6, 12], death: [10, 10] } },
    dragon: { fw: 454, fh: 249, cx: 207, fy: 229, hd: true, s: 0.5, bw: 70, bh: 85,
      anims: { idle: [8, 8], run: [8, 10], attack: [8, 12], hit: [6, 12], death: [8, 8] } },
    reaper: { fw: 80, fh: 73, rw: 82, cx: 23, fy: 71, s: 1.13, bw: 30, bh: 64,
      anims: { idle: [4, 6], run: [4, 8], attack: [13, 18], hit: [3, 12], death: [18, 14] } },
    nightborne: { fw: 80, fh: 73, cx: 37, fy: 57, s: 1.7, bw: 30, bh: 46,
      anims: { idle: [9, 10], run: [6, 12], attack: [12, 18], hit: [5, 12], death: [23, 18] } },
    // ---- Bộ hình riêng từng quái (def.sprite). Nguồn: xem public/assets/CREDITS.txt
    // faceLeft: hình gốc quay mặt sang trái (các bộ khác quay phải) → đảo chiều lật.
    // fakeDeath: bộ hình không có hoạt ảnh chết thật (death.png chỉ là khung đứng) → game tự cho ngã xuống.
    // Gói thú hoang chỉ có đứng/đi/chạy: attack mượn chạy (sói: tru), hit mượn khung đứng.
    mimic: { fw: 88, fh: 46, rw: 146, cx: 48, fy: 45, s: 1.5, bw: 40, bh: 42,
      anims: { idle: [9, 10], run: [6, 10], attack: [14, 22], hit: [3, 12], death: [6, 10] } },
    evil_wizard: { fw: 224, fh: 143, rw: 250, cx: 123, fy: 142, s: 0.55, bw: 30, bh: 54,
      anims: { idle: [8, 10], run: [8, 14], attack: [8, 16], hit: [3, 12], death: [7, 10] } },
    ronin: { fw: 126, fh: 82, rw: 126, cx: 66, fy: 81, s: 1.35, bw: 28, bh: 50,
      anims: { idle: [10, 10], run: [8, 14], attack: [7, 18], hit: [3, 12], death: [11, 12] } },
    // ---- Gói itch.io (sinh bằng server/tools/mob-sheets.js; nguồn: public/assets/CREDITS.txt)
    warrior: { fw: 174, fh: 126, rw: 194, cx: 87, fy: 125, s: 0.691, bw: 30, bh: 52,
      anims: { idle: [6, 10], run: [8, 12], attack: [4, 16], hit: [3, 12], death: [9, 10] } },
    spearman: { fw: 138, fh: 43, rw: 154, cx: 69, fy: 42, s: 1.366, bw: 30, bh: 52,
      anims: { idle: [8, 10], run: [8, 12], attack: [4, 16], hit: [4, 12], death: [6, 10] } },
    knight_silver: { fw: 109, fh: 51, rw: 139, cx: 54.5, fy: 50, s: 1.421, bw: 30, bh: 50,
      anims: { idle: [10, 10], run: [6, 12], attack: [4, 16], hit: [3, 12], death: [9, 10] } },
    hero_knight: { fw: 96, fh: 63, rw: 160, cx: 48, fy: 62, s: 1.487, bw: 30, bh: 53,
      anims: { idle: [11, 10], run: [8, 12], attack: [6, 16], hit: [4, 12], death: [9, 10] } },
    samurai: { fw: 190, fh: 71, rw: 210, cx: 95, fy: 70, s: 1.077, bw: 30, bh: 52,
      anims: { idle: [8, 10], run: [8, 12], attack: [6, 16], hit: [4, 12], death: [6, 10] } },
    swordsman: { fw: 180, fh: 68, rw: 212, cx: 90, fy: 67, s: 0.982, bw: 30, bh: 52,
      anims: { idle: [4, 10], run: [8, 12], attack: [4, 16], hit: [3, 12], death: [7, 10] } },
    witch: { fw: 128, fh: 68, rw: 148, cx: 64, fy: 67, s: 1.094, bw: 30, bh: 53,
      anims: { idle: [10, 10], run: [8, 12], attack: [13, 16], hit: [3, 12], death: [18, 10] } },
    fire_worm: { fw: 94, fh: 56, rw: 94, cx: 47, fy: 55, s: 0.978, bw: 41, bh: 40,
      anims: { idle: [9, 10], run: [9, 12], attack: [16, 16], hit: [3, 12], death: [8, 10] } },
    huntress: { fw: 96, fh: 67, rw: 158, cx: 48, fy: 66, s: 1.333, bw: 30, bh: 52,
      anims: { idle: [8, 10], run: [8, 12], attack: [5, 16], hit: [3, 12], death: [8, 10] } },
    king: { fw: 179, fh: 84, rw: 193, cx: 89.5, fy: 83, s: 0.732, bw: 30, bh: 55,
      anims: { idle: [6, 10], run: [8, 12], attack: [6, 16], hit: [4, 12], death: [11, 10] } },
    spider: { fw: 18, fh: 10, rw: 32, cx: 9, fy: 10, s: 3.333, bw: 40, bh: 28,
      anims: { idle: [5, 10], run: [6, 12], attack: [4, 16], hit: [3, 12], death: [9, 10] } },
    worm: { fw: 32, fh: 23, rw: 34, cx: 16, fy: 20, s: 2.857, bw: 26, bh: 37,
      anims: { idle: [8, 10], run: [8, 12], attack: [8, 16], hit: [4, 12], death: [6, 10] } },
    cyclops: { fw: 48, fh: 45, rw: 66, cx: 24, fy: 45, s: 2, bw: 40, bh: 74,
      anims: { idle: [15, 10], run: [12, 12], attack: [13, 16], hit: [3, 12], death: [9, 10] } },
    tooth_walker: { fw: 58, fh: 51, rw: 72, cx: 29, fy: 50, s: 1.45, bw: 22, bh: 53,
      anims: { idle: [6, 10], run: [6, 12], attack: [6, 16], hit: [2, 12], death: [7, 10] } },
    reaper_boss: { fw: 206, fh: 87, rw: 206, cx: 103, fy: 86, s: 1.429, bw: 36, bh: 74,
      anims: { idle: [8, 10], run: [8, 12], attack: [10, 16], hit: [3, 12], death: [10, 10] } },
    skull_wolf: { fw: 64, fh: 50, rw: 66, cx: 32, fy: 50, s: 1.073, bw: 48, bh: 40,
      anims: { idle: [6, 10], run: [5, 12], attack: [5, 16], hit: [4, 12], death: [7, 10] } },
    frog_boss: { fw: 314, fh: 74, rw: 384, cx: 157, fy: 74, s: 0.877, bw: 60, bh: 59, fakeDeath: true,
      anims: { idle: [5, 10], run: [8, 12], attack: [8, 16], hit: [4, 12], death: [1, 10] } },
    stone_golem: { fw: 76, fh: 73, rw: 102, cx: 38, fy: 48, s: 1.404, bw: 40, bh: 61,
      anims: { idle: [4, 10], run: [4, 12], attack: [7, 16], hit: [3, 12], death: [14, 10] } },
    void_beast: { fw: 204, fh: 144, rw: 290, hd: true, cx: 102, fy: 138, s: 0.716, bw: 60, bh: 88,
      anims: { idle: [14, 10], run: [10, 12], attack: [12, 16], hit: [8, 12], death: [14, 10] } },
    imp: { fw: 46, fh: 35, rw: 52, cx: 23, fy: 33, s: 1.125, bw: 26, bh: 33,
      anims: { idle: [6, 10], run: [6, 12], attack: [6, 16], hit: [3, 12], death: [5, 10] } },
    axe_demon: { fw: 104, fh: 56, rw: 110, cx: 52, fy: 54, s: 1.561, bw: 34, bh: 59,
      anims: { idle: [6, 10], run: [6, 12], attack: [6, 16], hit: [3, 12], death: [4, 10] } },
    cultist: { fw: 156, fh: 178, rw: 202, cx: 78, fy: 177, s: 0.38, bw: 30, bh: 55,
      anims: { idle: [5, 10], run: [6, 12], attack: [5, 16], hit: [4, 12], death: [6, 10] } },
    // ---- Free Foes (Robert Pinero; tool: server/tools/free-foes.js; xem public/assets/CREDITS.txt)
    ff_crab: { fw: 144, fh: 74, rw: 32, cx: 72, fy: 72, hd: true, s: 0.493, bw: 40, bh: 28, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_gnoll: { fw: 284, fh: 162, rw: 64, cx: 142, fy: 154, hd: true, s: 0.523, bw: 32, bh: 52, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_kobold: { fw: 188, fh: 121, rw: 34, cx: 94, fy: 119, hd: true, s: 0.408, bw: 26, bh: 36, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_rat: { fw: 220, fh: 86, rw: 70, cx: 110, fy: 83, hd: true, s: 0.462, bw: 40, bh: 28, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_sahuagin: { fw: 210, fh: 131, rw: 150, cx: 105, fy: 126, hd: true, s: 0.5, bw: 28, bh: 44, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_skeleton: { fw: 348, fh: 181, rw: 150, cx: 174, fy: 179, hd: true, s: 0.436, bw: 30, bh: 54, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_slime: { fw: 292, fh: 93, rw: 156, cx: 146, fy: 92, hd: true, s: 0.308, bw: 40, bh: 28, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_troll: { fw: 276, fh: 195, rw: 66, cx: 138, fy: 192, hd: true, s: 0.431, bw: 40, bh: 53, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_wolf: { fw: 228, fh: 132, rw: 64, cx: 114, fy: 126, hd: true, s: 0.376, bw: 44, bh: 36, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
    ff_zombie: { fw: 158, fh: 153, rw: 34, cx: 79, fy: 152, hd: true, s: 0.406, bw: 30, bh: 50, faceLeft: true,
      anims: { idle: [4, 7], run: [4, 12], attack: [3, 16], hit: [3, 12], death: [6, 9] } },
  };
  // Kiểu dáng quái trong shared/data/monsters.js → bộ hình dùng chung (khi quái chưa có def.sprite riêng)
  const LOOK = { mushroom: 'mushroom', wolf: 'goblin', frog: 'ff_slime', bat: 'bat', spider: 'ff_skeleton', shade: 'eye',
    dummy: 'dummy', golem: 'troll', troll: 'troll', werewolf: 'werewolf', hydra: 'hydra', beast: 'beast', dragon: 'dragon',
    reaper: 'reaper', nightborne: 'nightborne' };
  const LOOK_TINT = { shade: 0xff7080 };
  // Bộ hình của một quái: def.sprite (hình riêng) → không có thì mượn theo kiểu dáng def.look
  const sheetOf = (def) => (def && def.sprite && MOBS[def.sprite] ? def.sprite : def && LOOK[def.look]) || null;
  // Màu mặc định theo kiểu dáng chỉ áp cho quái còn mượn hình chung (để đỡ giống nhau); quái có hình riêng giữ màu gốc
  const lookTint = (def) => (def.sprite && MOBS[def.sprite] ? null : LOOK_TINT[def.look]) || null;
  // Hình vẽ bằng code dùng tạm khi bộ hình chưa tải xong (look mới không có hình code riêng → mượn golem)
  const CODE_LOOK = { mushroom: 1, wolf: 1, frog: 1, bat: 1, spider: 1, dummy: 1, golem: 1 };
  const codeTex = (look, f = 0) => `m_${CODE_LOOK[look] ? look : 'golem'}_${f}`;
  // Màu riêng của từng quái (def.tint) ưu tiên hơn màu hạng quái
  const tintOf = (def) => def.tint || GameData.monGrade(def).tint || lookTint(def);

  // Bộ hình cần ngay khi vào một bản đồ: class đang chơi + các loại quái xuất hiện ở bản đồ đó
  function needed(mapId, school) {
    const chars = new Set(charsFor(school));
    const mobs = new Set();
    const meta = GameData.MAPS[mapId];
    for (const ch in (meta && meta.spawns) || {}) {
      const sheet = sheetOf(GameData.MONSTERS[meta.spawns[ch]]);
      if (sheet) mobs.add(sheet);
    }
    const shadowData = App.player?.shadows || {};
    const activeSouls = shadowData.active?.length
      ? (shadowData.active || []).map(uid => shadowData.roster?.find(x => x.uid === uid)).filter(Boolean)
      : (shadowData.roster || []).slice(0, GameData.SHADOW_PARTY || 5);
    for (const soul of activeSouls) {
      const sheet = sheetOf(GameData.MONSTERS[soul.monster]);
      if (sheet) mobs.add(sheet);
    }
    return { chars, mobs };
  }

  // Danh sách file ảnh còn thiếu (only = null: mọi bộ hình). ?v= là mã phiên bản ảnh: trình duyệt lưu lâu dài.
  function missing(scene, only) {
    const v = window.BUILD ? '?v=' + BUILD.assets : '';
    const list = [];
    for (const [id, c] of Object.entries(CHARS)) {
      if (only && !only.chars.has(id)) continue;
      for (const a of Object.keys(c.anims)) list.push({ key: `ch_${id}_${a}`, url: `/assets/chars/${id}/${a}.png` + v, fw: c.fw, fh: c.fh });
    }
    for (const [id, m] of Object.entries(MOBS)) {
      if (only && !only.mobs.has(id)) continue;
      for (const a of Object.keys(m.anims)) list.push({ key: `mb_${id}_${a}`, url: `/assets/mobs/${id}/${a}.png` + v, fw: m.fw, fh: m.fh });
    }
    return list.filter(f => !scene.textures.exists(f.key));
  }

  // Xếp hàng tải các bộ hình (only = null: tải hết phần còn thiếu). Trả về số file được xếp hàng.
  function preload(scene, only) {
    const list = missing(scene, only);
    for (const f of list) scene.load.spritesheet(f.key, f.url, { frameWidth: f.fw, frameHeight: f.fh });
    return list.length;
  }

  // Bộ hình cần giữ trong máy: class đang chơi, quái bản đồ này + bóng ma Tử Linh đang sở hữu.
  // Class khác và quái bản đồ khác không tải trước: sang bản đồ mới thì mới tải (preload của cảnh) → nhẹ băng thông
  // và bộ nhớ ảnh, hình ảnh trong game không đổi.
  function keepSet(mapId, school) {
    const set = needed(mapId, school);
    for (const soul of (App.player?.shadows?.roster || [])) {
      const sheet = sheetOf(GameData.MONSTERS[soul.monster]);
      if (sheet) set.mobs.add(sheet);
    }
    return set;
  }
  // Thứ tự tải ngầm sau khi đã vào game (chỉ phần cần giữ, xem keepSet)
  function background(scene, mapId, school) {
    return missing(scene, keepSet(mapId, school)).filter(f => !skipped.has(f.key));
  }
  // Gỡ khỏi bộ nhớ (và GPU) các bộ hình không còn cần: gọi lúc vừa vào bản đồ, khi sprite cũ đã bị hủy theo cảnh cũ
  function unloadFar(scene, mapId, school) {
    const keep = keepSet(mapId, school);
    const drop = (keys) => { for (const k of keys) { if (scene.anims.exists(k)) scene.anims.remove(k); if (scene.textures.exists(k)) scene.textures.remove(k); } };
    for (const [id, m] of Object.entries(MOBS)) if (!keep.mobs.has(id)) drop(Object.keys(m.anims).map(a => `mb_${id}_${a}`));
    for (const [id, c] of Object.entries(CHARS)) {
      if (keep.chars.has(id)) continue;
      for (const a of Object.keys(c.anims)) drop([`ch_${id}_${a}`, ...[1, 2].flatMap(t => [formKey(id, t, a), shellKey(id, t, a)])]);
    }
  }
  const skipped = new Set();
  const skip = (key) => skipped.add(key);

  function createAnims(scene) {
    const mk = (prefix, id, a, n, rate, loop) => {
      const key = `${prefix}_${id}_${a}`;
      if (scene.anims.exists(key) || !scene.textures.exists(key)) return;
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: rate, repeat: loop ? -1 : 0 });
    };
    const loops = new Set(['idle', 'run', 'fall']);
    for (const [id, c] of Object.entries(CHARS)) for (const [a, [n, r]] of Object.entries(c.anims)) mk('ch', id, a, n, a === 'run' ? Math.max(16, r) : r, loops.has(a));
    for (const [id, m] of Object.entries(MOBS)) for (const [a, [n, r]] of Object.entries(m.anims)) mk('mb', id, a, n, r, loops.has(a));
  }

  // Giữ cạnh sprite pixel-art rõ: chỉ nội suy mượt khi ảnh bị thu nhỏ dưới một điểm ảnh nguồn.
  function applyFilters(scene, k) {
    const { NEAREST, LINEAR } = Phaser.Textures.FilterMode;
    const set = (prefix, id, def) => {
      // hd: hình vẽ tay / đã làm mịn → luôn lọc mượt; pixel art thì giữ cạnh rõ khi được phóng to
      const mode = !def.hd && def.s * k >= 1 ? NEAREST : LINEAR;
      for (const a of Object.keys(def.anims)) {
        const key = `${prefix}_${id}_${a}`;
        if (scene.textures.exists(key)) scene.textures.get(key).setFilter(mode);
      }
    };
    for (const [id, c] of Object.entries(CHARS)) set('ch', id, c);
    for (const [id, m] of Object.entries(MOBS)) set('mb', id, m);
  }

  const hasChar = (scene, id) => !!CHARS[id] && scene.textures.exists(`ch_${id}_idle`);
  // def: dữ liệu quái trong GameData.MONSTERS
  const mobOf = (def) => sheetOf(def);
  const hasMob = (scene, def) => { const sh = sheetOf(def); return !!sh && scene.textures.exists(`mb_${sh}_idle`); };

  // Đặt gốc tọa độ và khung va chạm sao cho: x là tâm thân, chân ở y+30, khung va chạm 18x46 như cũ.
  // grow: phóng to thêm khi biến hình (khung va chạm trong thế giới game giữ nguyên, chân vẫn chạm đất)
  // lift: tùy chọn nâng HÌNH mà không đổi khung va chạm.
  function fitPlayer(sprite, id, flip, grow = 1, lift = 0) {
    const c = CHARS[id];
    const s = c.s * grow;
    const cx = flip ? c.fw - c.cx : c.cx;
    sprite.setScale(s);
    sprite.setOrigin(cx / c.fw, (c.fy - (30 - lift) / s) / c.fh);
    sprite.body.setSize(18 / s, 46 / s, false);
    sprite.body.setOffset(cx - 9 / s, c.fy - (46 - lift) / s);
    // Tint cố định theo class (nếu bộ hình có khai báo tint)
    if (c.tint && grow === 1) sprite.setTint(c.tint); else sprite.clearTint();
  }

  // ---------------------------------------------------------------- Bộ hình biến hình (thức tỉnh)
  // Tạo từ chính bộ hình của class: tô lại từng điểm ảnh sang màu ấn (vàng / hồng tím), giữ khối sáng tối,
  // chỗ sáng gần trắng như phát quang. Tạo một lần cho mỗi class + ấn, dùng lại cả phiên chơi.
  // Khóa: chf<ấn>_<class>_<hoạt ảnh> (cùng số khung, tốc độ với ch_...).
  const FORM_RGB = { 1: [255, 206, 84], 2: [255, 112, 214] };
  const formKey = (id, tier, a) => `chf${tier}_${id}_${a}`;
  const shellKey = (id, tier, a) => `cha${tier}_${id}_${a}`;

  // Lớp màng hào quang: dải sáng ôm sát BÊN NGOÀI đường viền cơ thể (không phủ lên người).
  // Đo khoảng cách từng điểm ảnh tới thân (biến đổi khoảng cách 2 lượt), rồi tô:
  //   lòng màng (0 < d < R): mờ nhẹ;  mép ngoài (d ≈ R): sáng rõ, ngả trắng;  trong thân: trong suốt.
  const SHELL = { 1: { R: 4, rgb: [255, 214, 92] }, 2: { R: 5.5, rgb: [255, 120, 220] } };
  function shellFrame(src, W, H, out, tier) {
    const { R, rgb } = SHELL[tier] || SHELL[1];
    const dist = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) dist[i] = src[i * 4 + 3] > 60 ? 0 : 1e6;
    const D = 1.41;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; let d = dist[i];
      if (!d) continue;
      if (x > 0) d = Math.min(d, dist[i - 1] + 1);
      if (y > 0) { d = Math.min(d, dist[i - W] + 1); if (x > 0) d = Math.min(d, dist[i - W - 1] + D); if (x < W - 1) d = Math.min(d, dist[i - W + 1] + D); }
      dist[i] = d;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x; let d = dist[i];
      if (!d) continue;
      if (x < W - 1) d = Math.min(d, dist[i + 1] + 1);
      if (y < H - 1) { d = Math.min(d, dist[i + W] + 1); if (x < W - 1) d = Math.min(d, dist[i + W + 1] + D); if (x > 0) d = Math.min(d, dist[i + W - 1] + D); }
      dist[i] = d;
    }
    for (let i = 0; i < W * H; i++) {
      const d = dist[i];
      if (!d || d > R + 2.5) continue;
      const rim = Math.exp(-((d - R) * (d - R)) / 1.4);                 // mép ngoài sáng
      const fill = d < R ? 0.28 * (1 - 0.4 * d / R) : 0;                 // lòng màng mờ
      const a = Math.min(1, Math.max(fill, rim * 0.95));
      const w = rim * 0.55;                                              // mép ngả trắng
      out[i * 4] = rgb[0] + (255 - rgb[0]) * w; out[i * 4 + 1] = rgb[1] + (255 - rgb[1]) * w; out[i * 4 + 2] = rgb[2] + (255 - rgb[2]) * w;
      out[i * 4 + 3] = a * 255;
    }
  }
  // Tô màu ấn cho một khung: chỗ tối (tóc, viền, mắt) gần như giữ nguyên để còn nhận ra nhân vật,
  // chỗ sáng (da, áo, vũ khí) ánh màu ấn và sáng rực lên
  function recolorFrame(d, tier) {
    const [cr, cg, cb] = FORM_RGB[tier] || FORM_RGB[1];
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
      const k = 0.25 + 0.45 * lum, L = lum * 1.25 + 0.08, glow = Math.max(0, lum - 0.6) * 0.9;
      d[i] = Math.min(255, r * (1 - k) + cr * L * k + 255 * glow * 0.3);
      d[i + 1] = Math.min(255, g * (1 - k) + cg * L * k + 255 * glow * 0.3);
      d[i + 2] = Math.min(255, b * (1 - k) + cb * L * k + 255 * glow * 0.3);
    }
  }

  // Việc tạo bộ hình biến hình + lớp màng cho MỘT hoạt ảnh, làm dần: mỗi step() xử lý 1 khung hình (vài ms),
  // khung cuối thì đưa vào game. Trả về null nếu đã có sẵn / chưa tải ảnh gốc.
  function formJob(scene, id, tier, a) {
    const c = CHARS[id], src = `ch_${id}_${a}`, key = formKey(id, tier, a), skey = shellKey(id, tier, a);
    if (!c || !scene.textures.exists(src)) return null;
    const finishAnim = () => {
      if (scene.anims.exists(key) || !scene.textures.exists(key)) return;
      const [n, baseRate] = c.anims[a];
      const rate = a === 'run' ? Math.max(16, baseRate) : baseRate;
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: rate, repeat: ['idle', 'run', 'fall'].includes(a) ? -1 : 0 });
    };
    if (scene.textures.exists(key)) { finishAnim(); return null; }
    const img = scene.textures.get(src).getSourceImage();
    const W = img.width, H = img.height, cols = Math.max(1, Math.floor(W / c.fw)), total = cols * Math.max(1, Math.floor(H / c.fh));
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return [cv, cv.getContext('2d', { willReadFrequently: true })]; };
    const [bodyCv, body] = mk(), [shellCv, shell] = mk();
    body.drawImage(img, 0, 0);
    let j = 0;
    return {
      step() {
        if (j < total) {
          const x = (j % cols) * c.fw, y = Math.floor(j / cols) * c.fh;
          const data = body.getImageData(x, y, c.fw, c.fh);
          const out = shell.createImageData(c.fw, c.fh);
          shellFrame(data.data, c.fw, c.fh, out.data, tier);
          recolorFrame(data.data, tier);
          body.putImageData(data, x, y);
          shell.putImageData(out, x, y);
          j++;
          return false;
        }
        if (!scene.textures.exists(key)) {
          const { NEAREST, LINEAR } = Phaser.Textures.FilterMode;
          scene.textures.addSpriteSheet(key, bodyCv, { frameWidth: c.fw, frameHeight: c.fh });
          scene.textures.get(key).setFilter(!c.hd && c.s * View.k >= 1 ? NEAREST : LINEAR);
          scene.textures.addSpriteSheet(skey, shellCv, { frameWidth: c.fw, frameHeight: c.fh });
          scene.textures.get(skey).setFilter(LINEAR);
        }
        finishAnim();
        return true;
      },
    };
  }
  // Kiểm tra trạng thái tạo sẵn mà không làm nặng khung hình lúc người chơi kích hoạt biến hình.
  function formSheetsReady(scene, id, tier) {
    const c = CHARS[id];
    if (!c) return false;
    for (const a of Object.keys(c.anims)) {
      if (!scene.textures.exists(`ch_${id}_${a}`) || !scene.textures.exists(formKey(id, tier, a)) || !scene.textures.exists(shellKey(id, tier, a))) return false;
    }
    return true;
  }

  // walking: quái này đi bộ (def.fly = false). Một số quái đi bộ mượn bộ hình bay (shade → eye): khi đó gốc tọa độ
  // phải là ĐÁY khung va chạm (chân), không phải tâm. Trước đây đặt theo tâm → nửa thân lọt vào đất, quái chìm 1 ô.
  function fitMob(sprite, def, walking = true) {
    const m = MOBS[sheetOf(def)];
    sprite.setScale(m.s);
    if (m.fly) {
      const oy = walking ? m.cy + m.bh / 2 / m.s : m.cy;
      sprite.setOrigin(m.cx / m.fw, oy / m.fh);
      sprite.body.setSize(m.bw / m.s, m.bh / m.s, false);
      sprite.body.setOffset(m.cx - m.bw / 2 / m.s, m.cy - m.bh / 2 / m.s);
    } else {
      sprite.setOrigin(m.cx / m.fw, m.fy / m.fh);
      sprite.body.setSize(m.bw / m.s, m.bh / m.s, false);
      sprite.body.setOffset(m.cx - m.bw / 2 / m.s, m.fy - m.bh / m.s);
    }
    const t = lookTint(def);
    if (t) sprite.setTint(t);
    // Hình gốc quay trái: mọi chỗ gọi setFlipX(trái?) vẫn viết như hình quay phải, ở đây đảo lại một lần
    if (m.faceLeft && !sprite._faceLeft) {
      const flip = sprite.setFlipX;
      sprite.setFlipX = function (v) { return flip.call(this, !v); };
      sprite._faceLeft = true;
      sprite.setFlipX(false);
    }
  }

  return { CHARS, MOBS, LOOK, lookOf, weaponClass, LOOK_TINT, sheetOf, codeTex, tintOf, needed, preload, background, unloadFar, skip, createAnims, applyFilters, hasChar, hasMob, mobOf, fitPlayer, fitMob, formSheetsReady, formJob };
})();
