/*
 * Chức nghiệp 2: mỗi class nền có đúng một nhánh tiến hóa.
 *
 * Làm nhiệm vụ nâng cấp chức nghiệp ở NPC ẩn rồi đọc Sách Tiến Hóa Chức Nghiệp là ĐỔI HẲN sang
 * chức nghiệp 2: p.school đổi thành id nhánh, không quay lại chức nghiệp 1 được nữa và không còn
 * cơ chế bật/tắt hai hình thái.
 *
 * Chức nghiệp 2 mạnh hơn chức nghiệp 1 đúng 30% chỉ số nền (hp / mp / atk / def). Hệ số nhân vào
 * đường cong của class nền, KHÔNG nhân vào điểm tiềm năng hay trang bị (xem calcStats trong
 * shared/logic/player.js).
 *
 * Tên / màu / mô tả của từng nhánh nằm ở schools.js (mục EVOLVED) — file này chỉ giữ bảng tra.
 */
(function (G) {
  'use strict';

  const EVOLUTIONS = {
    kiem_si: 'kiem_thanh', cung_thu: 'than_xa', phap_su: 'dai_phap_su', sat_thu: 'anh_vuong',
    tanker: 'ho_ve_bat_khuat', tri_lieu_su: 'thanh_linh', trieu_hoi_su: 'tu_linh_thuat_su',
    // Toàn Năng KHÔNG có chức nghiệp 2: nó đã dùng được kỹ năng của mọi class, thêm một nhánh nữa
    // chỉ là nhân chỉ số chứ không mở ra lối chơi mới. Toàn Năng chỉ mở bằng mật mã.
  };
  // Chức nghiệp 2 mạnh hơn chức nghiệp 1 30% chỉ số nền
  const EVOLUTION_MUL = 1.3;

  // Class nền của một class bất kỳ: chức nghiệp 2 trả về class gốc, class nền trả về chính nó.
  // Dùng để tra vũ khí, đường cong chỉ số, nội tại, nhóm kỹ năng.
  function baseSchool(school) {
    const sc = school && G.SCHOOLS[school];
    return sc && sc.base ? sc.base : (school || null);
  }
  // Chức nghiệp 2 của một class nền (null nếu không có)
  const evolutionOf = (school) => EVOLUTIONS[baseSchool(school)] || null;
  // Đây có phải chức nghiệp 2 không
  const isEvolved = (school) => !!(school && G.SCHOOLS[school] && G.SCHOOLS[school].evolved);

  Object.assign(G, { EVOLUTIONS, EVOLUTION_MUL, baseSchool, evolutionOf, isEvolved });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
