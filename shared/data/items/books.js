/*
 * Sách: điểm kỹ năng, tuyệt kỹ chức nghiệp, biến hình, tiến hóa.
 */
(function (G) {
  'use strict';

  const PART = {
    sach_tiem_nang: { name: 'Sách tiềm năng', kind: 'potential_book', potential: 3, stack: true, price: 0, desc: 'Đọc để nhận ngay 3 điểm tiềm năng (cộng vào Sức mạnh / Thể chất / Tinh thần / Nhanh nhẹn tùy ý). Không giới hạn số cuốn.' },
    sach_ky_nang: { name: 'Sách kỹ năng', kind: 'book', stack: true, price: 0, priceNgoc: 20, ngocGroup: 'util', desc: 'Đọc để nhận thêm 1 điểm kỹ năng. Mỗi nhân vật đọc tối đa 7 cuốn (+7 điểm).' },
    sach_bien_hinh_1: { name: 'Sách Biến Hình I', kind: 'transform_book', transform: 'awaken1', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ nhất.' },
    sach_tien_hoa_chuc_nghiep: { name: 'Sách Tiến Hóa Chức Nghiệp', kind: 'transform_book', transform: 'evolution', stack: true, price: 0, desc: 'Mở khóa hình thái tiến hóa của class nền.' },
    sach_bien_hinh_2: { name: 'Sách Biến Hình II', kind: 'transform_book', transform: 'awaken2', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ hai (cấp 40).' },
    sach_bien_hinh_3: { name: 'Sách Biến Hình III', kind: 'transform_book', transform: 'awaken3', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ ba (cấp 60).' },
    sach_bien_hinh_4: { name: 'Sách Biến Hình IV', kind: 'transform_book', transform: 'awaken4', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ tư (cấp 80).' },
    sach_bien_hinh_5: { name: 'Sách Biến Hình V', kind: 'transform_book', transform: 'awaken5', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ năm (cấp 100).' },
    sach_mo_rong_thuong: { name: 'Sách Mở Rộng Ô Kỹ Năng', kind: 'slot_book', ult: false, stack: true, price: 0, priceNgoc: 35, ngocGroup: 'book', desc: 'Đọc để mở thêm 1 ô học kỹ năng thường (tối đa +2 ô).' },
    sach_mo_rong_tuyet_ky: { name: 'Sách Mở Rộng Ô Tuyệt Kỹ', kind: 'slot_book', ult: true, stack: true, price: 0, priceNgoc: 45, ngocGroup: 'book', desc: 'Đọc để mở thêm 1 ô học tuyệt kỹ (tối đa +2 ô).' },
    sach_tay_ky_nang: { name: 'Sách Tẩy Kỹ Năng', kind: 'erase_book', stack: true, price: 0, priceNgoc: 15, ngocGroup: 'util', desc: 'Cần để Hội trưởng Khải tẩy điểm kỹ năng. Đưa sách cho ông ấy, mọi điểm đã cộng được hoàn lại đủ.' },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['books'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
