/*
 * Bản đồ (bố cục ô nằm trong shared/maps/<id>.txt).
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Bản đồ
  // File bản đồ nằm trong shared/maps/<id>.txt. Ký hiệu:
  //   .  trống          #  nền (đứng được, không đi xuyên)
  //   =  bục (nhảy lên từ dưới được)
  //   S  điểm xuất hiện mặc định     < >  cổng chuyển bản đồ
  //   chữ thường: chỗ quái xuất hiện (xem spawns)   chữ hoa: NPC (xem npcs)
  //   &  cây   $  tòa nhà / cửa tiệm   !  đèn đường / tinh thể   ^  tinh thể / nhũ đá
  const MAPS = {
    cong_do: { name: 'Cổng đỏ chưa phân hạng', theme: 'redgate',
      spawns: { r: 'bong_do' },
      npcs: { H: 'he_thong' },
      portals: { '>': { to: 'lang', at: 'S', require: 'q0' } } },
    lang: { name: 'Tân Đô – Khu Hiệp Hội', theme: 'city',
      spawns: { d: 'hinh_nhan' },
      npcs: { L: 'lao_su', V: 'vy', N: 'bang_nv', R: 'tho_ren', B: 'ba_thuoc', G: 'tap_hoa', K: 'thu_kho', M: 'lu_khach' },
      portals: {
        '>': { to: 'rung', at: '<' },
        ')': { to: 'b_en_pha', at: 'S', require: 'q10' },
        '(': { to: 'tp_chim_t', at: 'S', require: 'c2q7' },
        ']': { to: 'chan_nui', at: 'S', require: 'c2q12' },
        '[': { to: 'kho_bac', at: 'S', require: 'c3q6' },
        '}': { to: 'vac_da', at: 'S', require: 'c4q1' },
        '~': { to: 'tan_do_bt', at: 'S', require: 'c4q7' },
        '|': { to: 'cong_ss', at: 'S', require: 'c5q6' },
      } },
    rung: { name: 'Cổng hạng E – Rừng Sương', theme: 'forest', require: 'q3',
      spawns: { a: 'nam_doc', b: 'soi_tre', c: 'ech_suong' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: '>' }, '>': { to: 'hang', at: '<' } } },
    hang: { name: 'Cổng hạng D – Hang Pha Lê', theme: 'cave', require: 'q6',
      spawns: { a: 'doi_hang', b: 'nhen_da', z: 'thach_quy' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'rung', at: '>' } } },

    // ===== CHƯƠNG 2: BÓNG TRĂNG KHUYẾT (cấp 11–20)
    b_en_pha: { name: 'Bến Phà Hoang', theme: 'forest', require: 'q10',
      spawns: { a: 'th_luoi_dam' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: ')' }, '>': { to: 'd_lay_muc', at: '<', require: 'c2q1' } } },
    d_lay_muc: { name: 'Đầm Lầy Mục', theme: 'forest', require: 'c2q1',
      spawns: { a: 'th_luoi_dam', b: 'ech_doc_kl' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'b_en_pha', at: '>' }, '>': { to: 'lang_chai', at: '<', require: 'c2q2' } } },
    lang_chai: { name: 'Làng Chài Vùng Ven', theme: 'forest', require: 'c2q2',
      spawns: { a: 'linh_giao_hn', b: 'sat_thu_bong_toi' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'd_lay_muc', at: '>' }, '>': { to: 'cc_hac_nguyet', at: '<', require: 'c2q4' } } },
    cc_hac_nguyet: { name: 'Căn Cứ Tiền Tiêu Hắc Nguyệt', theme: 'cave', require: 'c2q4',
      spawns: { a: 'linh_giao_hn', b: 'sat_thu_bong_toi', z: 'lam_suong' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang_chai', at: '>' } } },
    tp_chim_t: { name: 'Thành Phố Chìm – Tầng Thượng', theme: 'cave', require: 'c2q7',
      spawns: { a: 'linh_thuy_co' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: '(' }, '>': { to: 'tp_chim_c', at: '<', require: 'c2q8' } } },
    tp_chim_c: { name: 'Thành Phố Chìm – Cống Ngầm', theme: 'cave', require: 'c2q8',
      spawns: { a: 'linh_thuy_co', b: 'nhen_cong_ngam', z: 'thuy_xa_vuong' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tp_chim_t', at: '>' } } },

    // ===== CHƯƠNG 3: LÒ RÈN CỔ (cấp 21–30)
    chan_nui: { name: 'Chân Núi Tuyết Lặng', theme: 'forest', require: 'c2q12',
      spawns: { a: 'soi_tuyet' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: ']' }, '>': { to: 'hem_nui', at: '<', require: 'c3q2' } } },
    hem_nui: { name: 'Hẻm Núi Gió Hú', theme: 'cave', require: 'c3q2',
      spawns: { a: 'soi_tuyet', b: 'nguoi_tuyet' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'chan_nui', at: '>' }, '>': { to: 'lo_ren_bang', at: '<', require: 'c3q3' } } },
    lo_ren_bang: { name: 'Lò Rèn Cổ Dưới Băng', theme: 'cave', require: 'c3q3',
      spawns: { a: 'nguoi_tuyet', b: 'yeu_tinh_bang' },
      npcs: { R: 'tho_ren', V: 'vy' },
      portals: { '<': { to: 'hem_nui', at: '>' }, '>': { to: 'dinh_nui', at: '<', require: 'c3q4' } } },
    dinh_nui: { name: 'Đỉnh Núi Sương Giá', theme: 'cave', require: 'c3q4',
      spawns: { a: 'yeu_tinh_bang', b: 'dai_thach_nhan', z: 'bang_long' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lo_ren_bang', at: '>' } } },
    kho_bac: { name: 'Kho Bạc Ngầm Hiệp Hội', theme: 'cave', require: 'c3q6',
      spawns: { a: 'sat_thu_bong_toi', z: 'lam_suong_2' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: '[' } } },

    // ===== CHƯƠNG 4: TẦNG TRỜI THỨ BẢY (cấp 31–40)
    vac_da: { name: 'Vách Đá Gió Thần', theme: 'city', require: 'c4q1',
      spawns: { a: 'ho_ve_may' },
      npcs: { M: 'lu_khach', V: 'vy' },
      portals: { '<': { to: 'lang', at: '}' }, '>': { to: 'cong_khai_hoan', at: '<' } } },
    cong_khai_hoan: { name: 'Cổng Khải Hoàn Thành Cổ', theme: 'city', require: 'c4q1',
      spawns: { a: 'ho_ve_may', b: 'bo_canh_cung' },
      npcs: { V: 'vy', M: 'lu_khach' },
      portals: { '<': { to: 'vac_da', at: '>' }, '>': { to: 'quang_truong', at: '<', require: 'c4q2' } } },
    quang_truong: { name: 'Quảng Trường Ánh Sáng', theme: 'city', require: 'c4q2',
      spawns: { a: 'ho_ve_may', b: 'bo_canh_cung' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'cong_khai_hoan', at: '>' }, '>': { to: 'thu_vien', at: '<', require: 'c4q3' } } },
    thu_vien: { name: 'Thư Viện Hệ Thống – Sảnh Lớn', theme: 'cave', require: 'c4q3',
      spawns: { a: 'tri_thuc_ma', b: 'linh_hon_ky_uc' },
      npcs: { M: 'lu_khach' },
      portals: { '<': { to: 'quang_truong', at: '>' }, '>': { to: 'phong_luu_tru', at: '<' } } },
    phong_luu_tru: { name: 'Phòng Lưu Trữ Cấm', theme: 'cave', require: 'c4q3',
      spawns: { a: 'linh_hon_ky_uc', b: 'ho_ve_sat_thu' },
      npcs: { M: 'lu_khach' },
      portals: { '<': { to: 'thu_vien', at: '>' }, '>': { to: 'dinh_thap', at: '<', require: 'c4q5' } } },
    dinh_thap: { name: 'Đỉnh Tháp Lưu Trữ', theme: 'cave', require: 'c4q5',
      spawns: { a: 'thu_thu_vo_dien', z: 'nguoi_gac_luu_tru' },
      npcs: { M: 'lu_khach' },
      portals: { '<': { to: 'phong_luu_tru', at: '>' } } },

    // ===== CHƯƠNG 5: CỔNG VĨNH HẰNG (cấp 41–50)
    tan_do_bt: { name: 'Tân Đô – Bầu Trời Rách', theme: 'redgate', require: 'c4q7',
      spawns: { a: 'quai_hu_khong' },
      npcs: { L: 'lao_su' },
      portals: { '<': { to: 'lang', at: '~' }, '>': { to: 'cau_dan', at: '<', require: 'c5q1' } } },
    cau_dan: { name: 'Cầu Dẫn Lên Cổng Vĩnh Hằng', theme: 'redgate', require: 'c5q1',
      spawns: { a: 'quai_hu_khong', b: 'quy_trang_den' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tan_do_bt', at: '>' }, '>': { to: 'sanh_cho', at: '<', require: 'c5q2' } } },
    sanh_cho: { name: 'Sảnh Chờ Không Gian', theme: 'redgate', require: 'c5q2',
      spawns: { a: 'quy_trang_den', b: 'sv_ky_sinh_hk' },
      npcs: { V: 'vy', Q: 'lam_suong', M: 'lu_khach', R: 'tho_ren' },
      portals: { '<': { to: 'cau_dan', at: '>' }, '>': { to: 'dinh_cong_vh', at: '<', require: 'c5q3' } } },
    dinh_cong_vh: { name: 'Đỉnh Cổng Vĩnh Hằng', theme: 'redgate', require: 'c5q3',
      spawns: { a: 'ky_si_hu_khong', z: 'kieu_deo_mat_na' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'sanh_cho', at: '>' }, '>': { to: 'tam_diem', at: '<', require: 'c5q4' } } },
    tam_diem: { name: 'Tâm Điểm Dị Giới', theme: 'redgate', require: 'c5q4',
      spawns: { a: 'sv_ky_sinh_hk', b: 'ma_than_trang_tron', z: 'thuc_the_bkc' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'dinh_cong_vh', at: '>' } } },

    // ===== END-GAME: Cổng SS mở sau khi phá xong Cổng Vĩnh Hằng
    cong_ss: { name: 'Cổng SS – Vực Không Cùng', theme: 'redgate', require: 'c5q6',
      spawns: { a: 'quai_hu_khong', b: 'ky_si_hu_khong', c: 'ma_than_trang_tron', z: 'thuc_the_bkc' },
      npcs: {},
      portals: { '<': { to: 'lang', at: '|' } } },
  };
  const NEW_PLAYER_MAP = 'cong_do';

  Object.assign(G, { MAPS, NEW_PLAYER_MAP });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
