/*
 * Hệ số quái theo hạng và đường cong chỉ số theo cấp.
 *
 * Hạng quái (grade): thường < tinh anh (HP ×10) < thủ lĩnh (×100) < boss (×200)
 * (trùm cuối: thêm hệ số FINAL_BOSS). Thủ lĩnh / boss dốc theo cấp: xem GRADE_RAMP.
 *   - HP và kinh nghiệm nhân theo hệ số ở bảng dưới.
 *   - "hp"/"exp" trong từng con quái là giá trị GỐC theo đường cong cấp (MON_CURVE, trước nhân hạng).
 *   - "atk"/"def" trong từng con quái là giá trị CUỐI (đã nhân hệ số hạng ATK/DEF: tinh anh x1.2/x1.2,
 *     thủ lĩnh x1.4/x1.3, trùm x1.7/x1.5, trùm cuối x2/x1.7). Vàng không nhân.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Hệ số quái theo hạng
  // Hạng quái (grade): thường < tinh anh (HP ×10) < thủ lĩnh (×100) < boss (×200) (trùm cuối: thêm hệ số FINAL_BOSS). Thủ lĩnh / boss dốc theo cấp: xem GRADE_RAMP.
  //   - HP và kinh nghiệm nhân theo hệ số ở bảng dưới.
  //   - "hp"/"exp" trong MONSTERS là giá trị GỐC theo đường cong cấp (MON_CURVE, trước nhân hạng).
  //   - "atk"/"def" trong MONSTERS là giá trị CUỐI (đã nhân hệ số hạng ATK/DEF: tinh anh x1.2/x1.2,
  //     thủ lĩnh x1.4/x1.3, trùm x1.7/x1.5, trùm cuối x2/x1.7). Vàng không nhân.
  // Đường cong quái thường theo cấp (nội suy tuyến tính). Mục tiêu: quái thường ~5 đòn thường của người
  // chơi cùng cấp, mỗi đòn quái gây ~7% máu người (sau giảm giáp). DEF = 2 + 1.6 x cấp.
  const MON_CURVE = {
    hp: [[1, 130], [10, 630], [20, 1200], [30, 1900], [40, 2550], [50, 3700], [60, 4200], [70, 4950], [80, 5500], [90, 6100], [100, 6700]],
    atk: [[1, 17], [10, 140], [20, 280], [30, 480], [40, 770], [50, 1200], [60, 1700], [70, 2200], [80, 2650], [90, 3050], [100, 3500]],
    defBase: 2, defPerLevel: 1.6,
    expKills: [10, 0.2],   // số quái thường cần hạ để lên 1 cấp = 10 + 0.2 x cấp
  };
  const FINAL_BOSS = { hp: 20 / 12, exp: 40 / 25 };   // nhân thêm lên hệ số trùm
  // Hệ số máu thủ lĩnh / trùm là MỨC TRẦN (thủ lĩnh ×100, trùm ×200). Nhân vật cấp thấp chưa có đủ kỹ năng nên máu thủ lĩnh / trùm
  // tăng dần theo cấp quái tới mức trần ở cấp 70 trở lên (nếu không, trùm cấp 12 phải đánh 5–10 phút). Muốn bỏ dốc: đặt mọi mốc = 1.
  // Tinh anh luôn ×10, không dốc. Dùng qua GameData.monHp (shared/logic/monsters.js).
  const GRADE_RAMP = [[1, 0.25], [15, 0.25], [30, 0.5], [50, 0.75], [70, 1]];
  const MON_GRADE = {
    normal: { hp: 1,  exp: 1,  label: 'thường',   bar: 0xe53935, barW: 36, scale: 1.0,  tint: null,      nameColor: '#ffcdd2' },
    elite:  { hp: 10, exp: 6, label: 'tinh anh', bar: 0xff5252, barW: 48, scale: 1.15, tint: 0xff8a8a, nameColor: '#ff8a80' },
    leader: { hp: 100, exp: 20,label: 'thủ lĩnh',  bar: 0xb388ff, barW: 64, scale: 1.3,  tint: 0xc9a0ff, nameColor: '#ce93d8' },
    boss:   { hp: 200, exp: 25,label: 'trùm',     bar: 0xff7043, barW: 90, scale: 1.45, tint: 0xffcc88, nameColor: '#ffab40' },
  };

  Object.assign(G, { MON_GRADE, MON_CURVE, FINAL_BOSS, GRADE_RAMP });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
