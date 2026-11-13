/*
 * Nguyên liệu nâng cấp và vật phẩm tăng cường (bùa).
 */
(function (G) {
  'use strict';

  const PART = {
    // Nguyên liệu, vật phẩm nhiệm vụ
    da_cuong_hoa: { name: 'Đá cường hóa', kind: 'material', price: 80, stack: true, desc: 'Dùng để nâng cấp trang bị ở Thợ rèn.' },
    // Vật phẩm tăng cường (kind 'boost'): chỉ có qua mã quà tặng (npm run giftcode -- add --item bua_x2_kinh_nghiem 3)
    bua_x2_kinh_nghiem: { name: 'Bùa nhân đôi kinh nghiệm', kind: 'boost', boost: 'exp', mul: 2, minutes: 60, stack: true, price: 0,
      desc: 'Dùng để nhận gấp đôi kinh nghiệm khi hạ quái trong 60 phút. Dùng thêm khi còn hiệu lực sẽ cộng dồn thời gian (tối đa 24 giờ).' },
    // ===== Đá cường hóa cấp cao
    da_cuong_hoa_trung: { name: 'Đá cường hóa trung', kind: 'material', price: 300, stack: true, desc: 'Đá cường hóa chất lượng cao, dùng cho trang bị cấp 11 trở lên.' },
    da_cuong_hoa_cao: { name: 'Đá cường hóa cao', kind: 'material', price: 1000, stack: true, desc: 'Đá cường hóa tinh khiết, dùng cho trang bị cấp 21 trở lên.' },
    da_cuong_hoa_than_thoai: { name: 'Đá cường hóa thần thoại', kind: 'material', price: 5000, stack: true, desc: 'Đá cường hóa tối thượng, dùng cho trang bị cấp 31 trở lên.' },
    loi_tinh_van: { name: 'Lõi Tinh Vân', kind: 'material', price: 12000, stack: true, desc: 'Nguyên liệu cường hóa và chế tạo trang bị cấp 51 trở lên.' },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['materials'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
