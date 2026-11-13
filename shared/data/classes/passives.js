/*
 * Nội tại: luôn có tác dụng sau khi thức tỉnh class. Chức nghiệp 2 giữ nội tại của class nền,
 * trừ khi nhánh đó có nội tại riêng (Tử Linh Thuật Sư).
 */
(function (G) {
  'use strict';

  const PASSIVES = {
    kiem_si: { icon: '❤️', name: 'Kiếm Tâm', desc: 'Mỗi lần đánh thường trúng quái hồi 0,5% máu tối đa.' },
    cung_thu: { icon: '🎯', name: 'Yếu Điểm', desc: 'Đòn chí mạng gây 180% sát thương thay vì 160%.' },
    phap_su: { icon: '💠', name: 'Dòng Chảy', desc: 'Hồi 0,5% năng lượng tối đa mỗi giây ngay cả khi đang chiến đấu; ngoài chiến đấu hồi gấp đôi.' },
    sat_thu: { icon: '🌑', name: 'Bóng Tối', desc: 'Chí mạng đầu tiên sau kỹ năng lướt gây 250% sát thương.' },
    tanker: { icon: '⚔️', name: 'Thành Đồng', desc: 'Giảm thêm 10% sát thương nhận vào khi máu dưới 50%.' },
    tri_lieu_su: { icon: '🌿', name: 'Sinh Lực', desc: 'Kỹ năng hồi máu hồi thêm 20% lượng hồi.' },
    trieu_hoi_su: { icon: '🔮', name: 'Liên Kết Linh Thể', desc: 'Thực thể được triệu hồi gây thêm 10% sát thương.' },
    tu_linh_thuat_su: { icon: '☠️', name: 'Thu Hồn', desc: 'Quái thường và tinh anh do bạn kết liễu được lưu thành bóng ma. Bộ sưu tập tối đa 20 bóng.' },
  };

  Object.assign(G, { PASSIVES });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
