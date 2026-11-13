/*
 * Kỹ năng · Cận chiến.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 *
 * Tuyệt kỹ: mạnh hơn kỹ năng thường, học bằng sách riêng (sach_tk_<id>), không bán ở cửa hàng. */
(function (G) {
  'use strict';

  const PART = {
    ulKiem1: { school: 'kiem_si', ultSchools: ['kiem_si', 'tanker'], icon: '⚔️', name: 'Kiếm Trận Hủy Diệt', level: 30, mp: 210, cd: 44, ult: true,
      type: 'sword_fall', power: 3.31, radius: 170, count: 2, desc: 'Triệu hồi hai thanh kiếm khổng lồ giáng liên tiếp phía trước.',
      m5: { radius: 210 }, t5: 'Vùng sát thương rộng hơn.',
      m10: { count: 3, power: 2.53 }, t10: 'Ba thanh kiếm giáng xuống.' },
    ulKiem2: { school: 'kiem_si', ultSchools: ['kiem_si', 'sat_thu'], icon: '🌀', name: 'Kiếm Vũ Tuyệt Diệt', level: 35, mp: 200, cd: 40, ult: true,
      type: 'melee', power: 0.49, hits: 9, range: 190, finisher: 1.39, desc: 'Xoay kiếm chém dồn dập, nhát cuối tung đòn tuyệt diệt.',
      m5: { hits: 12 }, t5: 'Chém 12 nhát.',
      m10: { finisher: 2.01, range: 230 }, t10: 'Nhát cuối mạnh hơn, tầm chém rộng hơn.' },
    ulSat1: { school: 'sat_thu', ultSchools: ['sat_thu'], icon: '🩸', name: 'Huyết Ảnh Vạn Đao', level: 30, mp: 190, cd: 40, ult: true,
      type: 'spread', power: 2.53, count: 9, range: 430, desc: 'Phóng 9 phi đao bóng tối tỏa ra phía trước.',
      m5: { count: 12 }, t5: '12 phi đao.',
      m10: { slow: 3 }, t10: 'Phi đao trúng làm chậm quái 3 giây.' },
    ulTank1: { school: 'tanker', ultSchools: ['tanker', 'kiem_si'], icon: '🏯', name: 'Thành Đồng Bất Hoại', level: 30, mp: 170, cd: 50, ult: true,
      type: 'guard', duration: 10, reduce: 0.6, reflect: 0.4, desc: 'Hóa thân thành tường thành, giảm mạnh sát thương nhận vào và phản lại cho quái.',
      m5: { duration: 13 }, t5: 'Kéo dài 13 giây.',
      m10: { reduce: 0.6, reflect: 0.7 }, t10: 'Giảm 60% sát thương và phản lại 70%.' },
    ulTank2: { school: 'tanker', ultSchools: ['tanker'], icon: '🌋', name: 'Địa Chấn Thiên Hạ', level: 35, mp: 200, cd: 42, ult: true,
      type: 'aoe', power: 7.93, radius: 300, desc: 'Dậm xuống đất, chấn động cả chiến trường.',
      m5: { radius: 360 }, t5: 'Vùng chấn động rộng hơn.',
      m10: { radius: 420 }, t10: 'Vùng chấn động cực rộng.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
