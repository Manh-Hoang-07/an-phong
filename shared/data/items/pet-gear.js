/*
 * Trang bị cho thú (linh thú của Triệu Hồi Sư và thú đồng hành): yên, dây cương, giáp thú, vòng cổ.
 *
 * Mỗi con thú có 4 ô riêng, lưu ở player.petGear[idThú] = { yen, cuong, giap, vong } (id vật phẩm hoặc null).
 * Vật phẩm cộng số cố định vào chỉ số của thú (công thức ở pets/gear.js, dựa trên đường cong thú tại cấp refLv).
 * Hậu tố id (_nho / _vua / _lon / _dac / _than_thoai) cũng là bậc để tiệm tạp hóa chỉ bán trong trần của làng.
 * Cấp sử dụng (refLv): linh thú xét theo cấp riêng của nó, thú đồng hành xét theo cấp chủ.
 */
(function (G) {
  'use strict';

  const PET_GEAR_SLOTS = {
    yen: { name: 'Yên', icon: '🏇', stat: 'Máu' },
    cuong: { name: 'Dây Cương', icon: '🪢', stat: 'Tấn công' },
    giap: { name: 'Giáp Thú', icon: '🛡️', stat: 'Phòng thủ' },
    vong: { name: 'Vòng Cổ', icon: '📿', stat: 'Máu, tấn công, phòng thủ (ít hơn)' },
  };
  const TIERS = [['nho', 'Vải', 5], ['vua', 'Da', 20], ['lon', 'Sắt', 40], ['dac', 'Bạc', 60], ['than_thoai', 'Linh Ngọc', 80]];

  const PART = {};
  for (const [slot, s] of Object.entries(PET_GEAR_SLOTS)) {
    for (const [suf, tier, refLv] of TIERS) {
      PART[`thu_${slot}_${suf}`] = {
        name: `${s.name} ${tier}`, kind: 'pet_gear', petSlot: slot, refLv, stack: true, price: Math.round(40 * Math.pow(refLv, 1.8)),
        desc: `Trang bị cho thú, ô ${s.name}: tăng ${s.stat}. Thú cần đạt cấp ${refLv}.`,
      };
    }
  }

  G.PET_GEAR_SLOTS = PET_GEAR_SLOTS;
  (G.ITEM_PARTS = G.ITEM_PARTS || {})['pet-gear'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
