/*
 * Tuyệt Phẩm · Vạn Pháp Quy Nhất — chỉ Toàn Năng, cấp 70, sách 420 Linh Ngọc.
 *
 * Tung CẢ BA tuyệt kỹ chung cùng một lúc: Thiên Địa Chấn Động (nổ), Hư Không Tuyệt Trảm (ba nhát chém),
 * Ý Chí Bất Diệt (buff). Mỗi cái chạy nguyên hiệu ứng gốc của nó, chỉ khác là ra cùng lúc.
 * `power` ở đây là hệ số của RIÊNG cú nổ tổng hợp — không thay thế power của ba kỹ kia.
 *
 * Cân bằng: Toàn Năng là class yếu nhất bảng (atk 363, skillMul 0,83 ở cấp 70), nên hệ số phải cao
 * mới cùng tầm các Tuyệt Phẩm khác. Ở cấp 70 → 28.058 sát thương = 4,19× máu Trụ Mộng Sáng Thế (6.700 HP).
 * Ngang Nhất Kiếm Khai Thiên và Xuyên Không Nhất Tiễn.
 *
 * Cái giá: `lockSec` giây khoá TOÀN BỘ kỹ năng sau khi tung (client chặn ở useSkill, server giữ p.skillLock).
 * Không dùng "còn 1 máu" — người chơi vẫn còn nguyên máu, chỉ mất khả năng ra đòn.
 *
 * File này chỉ khai báo DỮ LIỆU. Luật của trụ nằm ở logic/super-ults/.
 */
(function (G) {
  'use strict';

  (G.TUYET_PHAM_PARTS = G.TUYET_PHAM_PARTS || []).push({
    ulToanNangSuper: { school: 'toan_nang', ultSchools: ['toan_nang'], icon: '🌀', name: 'Vạn Pháp Quy Nhất', level: 70, priceLevel: 60, mp: 400, cd: 180, ult: true,
      superUlt: true, type: 'allin', shopNgoc: true, power: 111.65, radius: 400, lockSec: 60,
      cost: { type: 'skill_lock', lockSec: 60 },
      desc: 'Vạn pháp quy về một mối: tung cùng lúc cả ba tuyệt kỹ chung — Thiên Địa Chấn Động, Hư Không '
        + 'Tuyệt Trảm và Ý Chí Bất Diệt — trong một nhịp duy nhất, kèm một vụ nổ tổng hợp ở giữa. Đổi lại, '
        + 'toàn bộ kỹ năng bị phong ấn 60 giây: bạn còn máu, còn năng lượng, nhưng không ra được đòn nào ngoài '
        + 'đánh thường.' },
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
