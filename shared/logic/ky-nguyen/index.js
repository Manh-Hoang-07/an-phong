/*
 * KỲ NGUYÊN — logic của trụ riêng.
 *
 * Dữ liệu 5 phúc duyên nằm ở data/ky-nguyen/ (catalog G.KY_NGUYEN). Thư mục logic này chứa
 * luật đọc trạng thái người chơi — trước đây nằm lẫn trong logic/player.js. Tách ra để
 * player.js chỉ còn đúng nghĩa của nó: tính chỉ số nhân vật.
 *
 * Thư mục:
 *   state.js  kyNguyenActive — lọc danh sách đang bật theo dữ liệu hiện có
 *
 * Nạp TRƯỚC logic/player.js (calcStats/specialFx gọi vào).
 */
(function (G) {
  'use strict';
  // Các file con tự gắn vào G; index.js là điểm vào cho thứ tự nạp.
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
