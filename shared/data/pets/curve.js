/*
 * Đường cong chỉ số thú / linh thú theo CẤP CỦA THÚ.
 *
 * Thú ĐỘC LẬP với chủ: chỉ số chỉ phụ thuộc cấp của thú (cấp thú vẫn bị kẹp tối đa bằng cấp chủ),
 * không cộng gì từ chỉ số chủ. Mốc đặt khoảng 50% máu / 35% công / 45% giáp của người chơi cùng cấp.
 */
(function (G) {
  'use strict';

  const PET_CURVE = {
    hp: [[1, 100], [10, 650], [20, 1150], [30, 1900], [40, 2600], [50, 4000], [60, 4800], [70, 5700], [80, 6600], [90, 7500], [100, 8500]],
    atk: [[1, 9], [10, 48], [20, 95], [30, 150], [40, 200], [50, 290], [60, 330], [70, 390], [80, 435], [90, 480], [100, 530]],
    def: [[1, 5], [10, 40], [20, 76], [30, 122], [40, 185], [50, 270], [60, 390], [70, 460], [80, 530], [90, 615], [100, 700]],
  };
  Object.assign(G, { PET_CURVE });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
