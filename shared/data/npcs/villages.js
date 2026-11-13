/*
 * NPC theo làng: mỗi làng (Tân Đô II–VII) có bộ NPC dịch vụ riêng.
 *
 * Tân Đô I (Hiệp Hội) giữ id gốc (tho_ren, ba_thuoc, tap_hoa, thu_kho, bang_nv, tram); làng n dùng id `<gốc>_<n>`.
 * Kho, bảng ngày / tuần và chỗ nhận / trả nhiệm vụ đều gắn theo làng đang đứng
 *.
 *
 * File này chạy SAU services.js: nó nhân bản NPC gốc ra từng làng.
 */
(function (G) {
  'use strict';

  const NPCS = (G.NPCS = G.NPCS || {});

  // Tiệm thuốc mở bán thêm thuốc khi xong phụ tuyến p5-2; tiệm trang bị mở thêm khi xong p2-1, p2-2
  NPCS.ba_thuoc.shopKind = 'herb';
  NPCS.tap_hoa.shopKind = 'gear';
  const VILLAGE_NAME = { 2: 'Hải Cảng', 3: 'Lò Rèn Băng', 4: 'Phù Đảo', 5: 'Bầu Trời Rách', 6: 'Thiên Đô', 7: 'Tinh Hà' };
  const STAFF = [   // [id gốc, tiền tố tên, tên người ở làng 2, 3, 4, 5, 6, 7]
    ['tho_ren', 'Thợ chế tác', 'Phong', 'Hàn', 'Kiều', 'Diệm', 'Khôi', 'Tinh'],
    ['ba_thuoc', 'Dược sư', 'Đào', 'Băng', 'Mây', 'Hồng', 'Thảo', 'Sao'],
    ['tap_hoa', 'Chủ tiệm', 'Mận', 'Lạnh', 'Đá', 'Tú', 'Trụ', 'Hà'],
    ['thu_kho', 'Quản kho', 'Bến', 'Sương', 'Kiên', 'Nguyệt', 'Mạch', 'Ngân'],
  ];
  for (const [base, prefix, ...names] of STAFF) {
    names.forEach((who, i) => { NPCS[`${base}_${i + 2}`] = { ...NPCS[base], name: `${prefix} ${who}`, look: base, village: i + 2 }; });
  }
  for (let n = 2; n <= 7; n++) {
    NPCS[`bang_nv_${n}`] = { ...NPCS.bang_nv, name: `Bảng nhiệm vụ ${VILLAGE_NAME[n]}`, look: 'bang_nv', village: n,
      greet: `Bảng nhiệm vụ của Tân Đô ${VILLAGE_NAME[n]}. Mỗi ngày có 3 việc mới, làm mới lúc 0 giờ.` };
    NPCS[`tram_${n}`] = { ...NPCS.tram, look: 'tram', village: n };
  }
  // Trưởng làng thay Hội trưởng Khải giao nhiệm vụ cốt truyện ở làng V, VI (Khải chỉ ở Hiệp Hội)
  NPCS.truong_lang_5 = { name: 'Trưởng làng Vực', role: 'quest', color: 0x6a2b3a,
    greet: 'Cổng ở đây rách ra từ chính bầu trời. Hội trưởng Khải nhắn qua đường truyền: cậu là người cần gặp.' };
  NPCS.truong_lang_6 = { name: 'Trưởng Thịnh', role: 'quest', color: 0x2b4a6a,
    greet: 'Thiên Đô giữ được tới giờ là nhờ những người như cậu. Hội trưởng Khải vẫn nhắn qua đường truyền mỗi ngày.' };
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
