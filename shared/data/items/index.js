/*
 * Vật phẩm: gộp các phần trong thư mục này, rồi sinh phần còn lại bằng công thức.
 *
 * Thư mục:
 *   potions.js      thuốc
 *   materials.js    nguyên liệu, bùa
 *   books.js        sách kỹ năng / tuyệt kỹ / biến hình
 *   quest-items.js  vật phẩm nhiệm vụ
 *   weapons.js      vũ khí viết tay
 *   armor/<ô>.js    trang bị theo từng ô (mu, ao, quan, giay, gang_tay, dai_lung, nhan, day_chuyen, ngoc_boi)
 *   sets.js         danh sách ô trang bị và 10 bộ theo cấp
 *
 * Sinh tự động ở file này: vũ khí riêng của 5 class còn lại (song đao, chùy, thần binh, thánh trượng,
 * linh châu) cho đủ 11 bậc, và sách của mọi tuyệt kỹ. Thêm vật phẩm thường thì sửa file trong thư mục
 * con, không sửa file này.
 *
 * ---- Trang bị. "stats" là chỉ số gốc; đồ rơi từ quái có chỉ số ngẫu nhiên 80–120%,
 *      phẩm chất ngẫu nhiên và dòng phụ. "minQ": phẩm chất thấp nhất khi rơi ra.
 * Trang bị chia bộ theo cấp (xem sets.js): mỗi 10 cấp MỘT bộ, mỗi ô trang bị chỉ có một món trong bộ.
 * Mỗi món có cấp sử dụng riêng, trải đều trên 10 cấp: vũ khí +0, áo +1, găng +2, giày +3, mũ +4, quần +5, đai +6, nhẫn +7, dây chuyền +8, ngọc bội +9
 * (cấp đầu bộ: 1, 11, 21, … 91), nên mở dần từng món trong lúc lên cấp. Đồ độc nhất (đồ trùm, thưởng nhiệm vụ) có cấp riêng.
 */
(function (G) {
  'use strict';

  // Gộp mọi phần đã nạp trước đó (xem thứ tự trong shared/index.js)
  const ITEMS = {};
  for (const part of Object.values(G.ITEM_PARTS || {})) Object.assign(ITEMS, part);
  delete G.ITEM_PARTS;

  // ---------------------------------------------------------------- Vũ khí riêng từng class
  // Kiếm (Kiếm Sĩ), Cung (Cung Thủ), Trượng (Pháp Sư) viết tay ở trên. 5 loại còn lại tạo tự động cho đủ 11 bậc,
  // cùng cấp / giá / phẩm chất tối thiểu với kiếm hoặc trượng cùng bậc, chỉ số chỉnh theo lối chơi của class.
  // WEAPON_TIERS: [hậu tố id, kiếm cùng bậc, cung cùng bậc, trượng cùng bậc, tên bậc]
  const WEAPON_TIERS = [
    ['sat', 'kiem_sat', 'cung_go', 'truong_go', 'thép'],
    ['thach_vuong', 'kiem_thach_quy', 'cung_thach_vuong', 'truong_thach_vuong', 'Thạch Vương'],
    ['bang_long', 'kiem_bang_long', 'cung_bang_long', 'truong_bang_long', 'Băng Long'],
    ['luu_tru', 'kiem_luu_tru', 'cung_luu_tru', 'truong_luu_tru', 'Lưu Trữ'],
    ['vinh_hang', 'kiem_vinh_hang', 'cung_vinh_hang', 'truong_vinh_hang', 'Vĩnh Hằng'],
    ['thien_khoi', 'kiem_thien_khoi', 'cung_thien_khoi', 'truong_thien_khoi', 'Thiên Khôi'],
    ['long_mach', 'kiem_long_mach', 'cung_long_mach', 'truong_long_mach', 'Long Mạch'],
    ['tinh_van', 'kiem_tinh_van', 'cung_tinh_van', 'truong_tinh_van', 'Tinh Vân'],
    ['than_mong', 'kiem_than_mong', 'cung_than_mong', 'truong_than_mong', 'Thần Mộng'],
    ['sang_the', 'kiem_sang_the', 'cung_sang_the', 'truong_sang_the', 'Sáng Thế'],
  ];
  const r0 = (v) => Math.max(1, Math.round(v));
  // [loại, class, tên, gốc ('kiem' | 'truong'), cách đổi chỉ số]
  const GEN_WEAPONS = [
    ['song_dao', 'sat_thu', 'Song Đao', 'kiem', (s, lv) => ({ atk: r0(s.atk * 0.92), crit: r0(3 + lv * 0.12), ...(s.hp ? { hp: r0(s.hp * 0.8) } : {}) })],
    ['chuy', 'tanker', 'Chùy', 'kiem', (s) => ({ atk: r0(s.atk * 0.95), def: r0((s.def || 1) * 1.6 + 2), ...(s.hp ? { hp: r0(s.hp * 1.3) } : {}) })],
    ['than_binh', 'toan_nang', 'Thần Binh', 'kiem', (s, lv) => ({ atk: r0(s.atk), crit: r0(1 + lv * 0.06), ...(s.hp ? { hp: r0(s.hp) } : {}) })],
    ['thanh_truong', 'tri_lieu_su', 'Thánh Trượng', 'truong', (s) => ({ atk: r0(s.atk * 0.9), mp: r0((s.mp || 10) * 1.3), ...(s.hp ? { hp: r0(s.hp * 1.1) } : {}) })],
    ['linh_chau', 'trieu_hoi_su', 'Linh Châu', 'truong', (s) => ({ atk: r0(s.atk * 0.95), mp: r0((s.mp || 10) * 1.15), ...(s.hp ? { hp: r0(s.hp) } : {}) })],
  ];
  // Vũ khí cùng bậc của từng loại: WEAPON_TIER_OF[id] = hậu tố bậc; TIER_WEAPONS[hậu tố][loại] = id
  const TIER_WEAPONS = {}, WEAPON_TIER_OF = {};
  for (const [suf, kiemId, cungId, truongId, tierName] of WEAPON_TIERS) {
    const row = TIER_WEAPONS[suf] = { kiem: kiemId, cung: cungId, truong: truongId };
    for (const [wtype, school, name, base, stat] of GEN_WEAPONS) {
      const b = ITEMS[base === 'kiem' ? kiemId : truongId];
      const id = `${wtype}_${suf}`;
      ITEMS[id] = { name: `${name} ${tierName}`, kind: 'weapon', slot: 'weapon', wtype, school, level: b.level,
        ...(b.minQ ? { minQ: b.minQ } : {}), stats: stat(b.stats, b.level), price: b.price };
      row[wtype] = id;
    }
    for (const id of Object.values(row)) WEAPON_TIER_OF[id] = suf;
  }
  // Vũ khí bậc đầu của class (thưởng khi chọn class) và vũ khí Băng Long (thưởng chế tạo cốt truyện)
  function classTierWeapon(school, suf) {
    const wt = G.classWeapon ? G.classWeapon(school) : null;
    return wt && TIER_WEAPONS[suf] ? TIER_WEAPONS[suf][wt] || null : null;
  }

  // Mỗi tuyệt kỹ có một cuốn sách riêng: sach_tk_<id>. Không bán bằng xu.
  //  - Tuyệt kỹ class (kể cả tuyệt kỹ cũ): mua ở Lầu Trân Bảo bằng Linh Ngọc (giá theo cấp) hoặc nhận qua mã quà tặng
  //  - Tuyệt kỹ dùng chung (ultAny, yếu hơn): nhận từ chuỗi nhiệm vụ Khảo hạch Tuyệt Kỹ của Hội trưởng Khải, không bán
  // Giá Linh Ngọc của sách tuyệt kỹ theo sức mạnh (cấp): 20 → 50, 30 → 90, 35 → 110, 38 → 120
  const ngocPriceOfUlt = (level) => Math.round((4 * level - 30) / 5) * 5;
  for (const [sid, sk] of Object.entries(G.SKILLS)) {
    if (!sk.ult) continue;
    const who = sk.ultAny ? 'mọi class' : (sk.ultSchools || [sk.school]).map(x => G.SCHOOLS[x]?.name || x).join(', ');
    ITEMS[G.ultBookId(sid)] = { name: `Sách Tuyệt Kỹ: ${sk.name}`, kind: 'ult_book', skill: sid, level: sk.level, stack: true, price: 0,
      desc: `Đọc để học tuyệt kỹ ${sk.name}. Dành cho: ${who}. Cần cấp ${sk.level}. ${sk.ultAny ? 'Nhận từ nhiệm vụ Khảo hạch Tuyệt Kỹ.' : 'Mua ở Lầu Trân Bảo hoặc nhận qua mật mã.'}` };
    if (!sk.ultAny) { ITEMS[G.ultBookId(sid)].priceNgoc = ngocPriceOfUlt(sk.level); ITEMS[G.ultBookId(sid)].ngocGroup = 'ult'; }
  }

  // Kỹ năng thường học bằng sách riêng sach_kn_<id> (bán ở tiệm tạp hóa theo class, hoặc rơi / thưởng nhiệm vụ)
  for (const [sid, sk] of Object.entries(G.SKILLS)) {
    if (sk.ult) continue;
    const who = sk.evolutionKey ? (G.SCHOOLS[sk.evolutionKey]?.name || sk.evolutionKey) : (G.SCHOOLS[sk.school]?.name || sk.school);
    ITEMS[G.skillBookId(sid)] = { name: `Sách Kỹ Năng: ${sk.name}`, kind: 'skill_book', skill: sid, level: sk.level, stack: true, price: 60 * sk.level * sk.level,
      desc: `Đọc để học kỹ năng ${sk.name}. Dành cho: ${who}. Cần cấp ${sk.level}.` };
  }

  Object.assign(G, { ITEMS, ngocPriceOfUlt, WEAPON_TIERS, TIER_WEAPONS, WEAPON_TIER_OF, classTierWeapon });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
