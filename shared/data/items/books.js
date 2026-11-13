/*
 * Sách: điểm kỹ năng, tuyệt kỹ chức nghiệp, biến hình, tiến hóa.
 */
(function (G) {
  'use strict';

  const PART = {
    sach_ky_nang: { name: 'Sách kỹ năng', kind: 'book', stack: true, price: 0, desc: 'Đọc để nhận thêm 1 điểm kỹ năng.' },
    sach_tuyet_ky: { name: 'Sách Tuyệt Kỹ Chức Nghiệp', kind: 'ult_book', stack: true, price: 0, desc: 'Đọc để học tuyệt kỹ đặc trưng của class hiện tại.' },
    sach_bien_hinh_1: { name: 'Sách Biến Hình I', kind: 'transform_book', transform: 'awaken1', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ nhất.' },
    sach_tien_hoa_chuc_nghiep: { name: 'Sách Tiến Hóa Chức Nghiệp', kind: 'transform_book', transform: 'evolution', stack: true, price: 0, desc: 'Mở khóa hình thái tiến hóa của class nền.' },
    sach_bien_hinh_2: { name: 'Sách Biến Hình II', kind: 'transform_book', transform: 'awaken2', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ hai.' },
    sach_ky_nang_vo_dinh: { name: 'Sách kỹ năng Vô Định', kind: 'book', stack: true, price: 0, desc: 'Cho phép cộng tối đa 1 kỹ năng vượt cấp giới hạn.' },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['books'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
