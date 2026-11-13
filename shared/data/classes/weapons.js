/*
 * Vũ khí đánh thường: tầm, tốc độ, hệ số sát thương, kiểu ra đòn.
 *
 * Mỗi class chỉ dùng đúng một loại vũ khí (SCHOOLS[...].weapon). Chức nghiệp 2 dùng chung vũ khí với class nền.
 * look: dáng vũ khí rời dùng cho hình vẽ dự phòng. proj/speed: đạn riêng của kiểu 'projectile'.
 */
(function (G) {
  'use strict';
  const { SCHOOLS } = G;

  const WEAPON_TYPES = {
    tay: { name: 'Tay không', range: 46, cooldown: 400, mult: 0.8, style: 'melee', look: 'kiem', icon: '👊' },
    kiem: { name: 'Kiếm', range: 74, cooldown: 360, mult: 1.0, style: 'melee', look: 'kiem', icon: '🗡️' },
    cung: { name: 'Cung', range: 400, cooldown: 430, mult: 0.8, style: 'projectile', look: 'cung', icon: '🏹' },
    truong: { name: 'Trượng', range: 170, cooldown: 480, mult: 0.95, style: 'wave', look: 'truong', icon: '🪄' },
    // Sát Thủ: hai dao ngắn, đánh rất nhanh, tầm ngắn
    song_dao: { name: 'Song Đao', range: 58, cooldown: 270, mult: 0.78, style: 'melee', look: 'kiem', icon: '🔪' },
    // Tanker: chùy nặng + khiên, chậm nhưng đòn mạnh
    chuy: { name: 'Chùy', range: 70, cooldown: 470, mult: 1.25, style: 'melee', look: 'kiem', icon: '🔨' },
    // Trị Liệu Sư: sóng phép ngắn hơn trượng, ra đòn nhanh hơn chút
    thanh_truong: { name: 'Thánh Trượng', range: 150, cooldown: 450, mult: 0.8, style: 'wave', look: 'truong', icon: '⚕️' },
    // Triệu Hồi Sư (cả nhánh Tử Linh): bắn cầu linh lực
    linh_chau: { name: 'Linh Châu', range: 320, cooldown: 440, mult: 0.85, style: 'projectile', look: 'truong', proj: 'proj_orb', speed: 520, icon: '🔮' },
    // Toàn Năng: thần binh riêng
    than_binh: { name: 'Thần Binh', range: 80, cooldown: 380, mult: 1.05, style: 'melee', look: 'kiem', icon: '⚜️' },
  };
  // Loại vũ khí của class (chức nghiệp 2 dùng chung vũ khí class nền)
  function classWeapon(school) { return school && SCHOOLS[school] ? SCHOOLS[school].weapon : null; }
  // Class nền sở hữu một loại vũ khí (để hiện "Dùng cho: ..."). Bỏ chức nghiệp 2 để không lặp tên.
  function weaponOwners(wtype) { return Object.keys(SCHOOLS).filter(s => SCHOOLS[s].weapon === wtype && !SCHOOLS[s].evolved); }

  Object.assign(G, { WEAPON_TYPES, classWeapon, weaponOwners });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
