/*
 * Kỹ năng: thông số theo cấp, kỹ năng được học, ô kỹ năng.
 *
 * Mô hình một class duy nhất: p.school là class HIỆN TẠI (class nền hoặc chức nghiệp 2).
 * Người chơi chỉ dùng kỹ năng của chính class đó — không còn hai thanh kỹ năng, không còn
 * cơ chế bật/tắt chức nghiệp 2. Ngoại lệ duy nhất: Toàn Năng dùng được kỹ năng của mọi class.
 */
(function (G) {
  'use strict';
  const { SKILL_MAX, SKILLS, SKILL_SLOTS } = G;

  // Thông số thực tế của kỹ năng ở một cấp
  function skillAt(id, lv) {
    const base = SKILLS[id];
    if (!base) return null;
    lv = Math.max(1, Math.min(SKILL_MAX, lv || 1));
    const s = { ...base };
    // TUYỆT PHẨM: chỉ số CỐ ĐỊNH, cấp không nhân gì cả.
    // Lý do: chúng đã ở tầm giết-trùm-một-đòn hoặc ×28 sinh lực; +45% sát thương và −15% hồi chiêu
    // không đổi được lối chơi, chỉ phá cân bằng. Điểm kỹ năng = cấp − 1 (cấp 100 có 99 điểm) nên
    // nâng cấp gần như miễn phí — càng không có lý do cho nó mạnh thêm.
    // Cấp 1–10 vẫn tồn tại như mốc SỞ HỮU (đọc sách là có), nhưng không có bậc trung gian:
    // dữ liệu TUYỆT PHẨM đã gộp m5/m10 vào chỉ số gốc, nên ở đây trả về nguyên bản.
    if (base.superUlt) { s.lv = lv; return s; }
    if (lv >= 5 && base.m5) Object.assign(s, base.m5);
    if (lv >= 10 && base.m10) Object.assign(s, base.m10);
    const mul = 1 + 0.05 * (lv - 1);   // sát thương +5% mỗi cấp (cả kỹ năng thường và tuyệt kỹ)
    if (s.power) s.power = s.power * mul;
    if (s.after) s.after *= mul;
    if (s.finisher) s.finisher *= mul;
    if (s.heal) s.heal = Math.min(0.9, s.heal * (1 + 0.03 * (lv - 1)));
    if (s.atkBuff) s.atkBuff *= (1 + 0.05 * (lv - 1));
    // atkBuff ÂM là hình phạt (vd Thiết Bích Vĩnh Cửu: tấn công về 0), không phải buff nên KHÔNG được
    // lớn thêm theo cấp — nhân lên sẽ thành −1,45 và hệ số tấn công âm. Kẹp sàn ở −1 = sát thương 0.
    if (s.atkBuff) s.atkBuff = Math.max(-1, s.atkBuff);
    s.mp = Math.round(base.mp * (1 + 0.04 * (lv - 1)));
    if (lv >= 10) s.cd = s.cd * 0.85;
    s.lv = lv;
    return s;
  }

  // Các class mà người chơi được tính là, xét theo DÒNG class.
  // Chức nghiệp 2 là bước tiến của cùng một dòng nên vẫn dùng tuyệt kỹ của dòng đó
  // (dữ liệu không có tuyệt kỹ riêng cho từng nhánh, trừ Tử Linh Thuật Sư có bộ nl*).
  // Kỹ năng THƯỜNG thì không theo hàm này: xem availableSkills.
  function schoolsOf(player) {
    const school = player.school;
    if (!school) return [];
    const base = G.baseSchool(school);
    if (base !== school) return [base, school];
    if (school === 'trieu_hoi_su') return ['trieu_hoi_su'];
    return [school];
  }

  // Tuyệt kỹ này có hợp với class của người chơi không (Toàn Năng: mọi tuyệt kỹ)
  function ultFits(player, s) {
    if (!s || !s.ult || !player.school) return false;
    if (G.baseSchool(player.school) === 'toan_nang' || s.ultAny) return true;
    const list = s.ultSchools || [s.school];
    return schoolsOf(player).some(x => list.includes(x));
  }

  // Kỹ năng người chơi học được. Mỗi class chỉ dùng bộ kỹ năng của chính nó.
  //
  // Kỹ năng nhánh (có evolutionKey) khai báo school = class NỀN nhưng chỉ thuộc về nhánh:
  //   - class nền KHÔNG thấy kỹ năng nhánh
  //   - chức nghiệp 2 chỉ thấy kỹ năng có evolutionKey đúng bằng id nhánh mình
  // Tử Linh Thuật Sư có bộ kỹ năng thường riêng (school = tu_linh_thuat_su), không còn học kỹ năng của Triệu Hồi Sư.
  function availableSkills(player) {
    const school = player.school;
    if (!school) return [];
    const isToanNang = G.baseSchool(school) === 'toan_nang';
    return Object.keys(SKILLS).filter(id => {
      const s = SKILLS[id];
      if (s.ult) return ultFits(player, s);
      if (isToanNang) return true;   // Toàn Năng: mọi kỹ năng thường của mọi class
      if (s.type === 'shadow_toggle' && school !== 'trieu_hoi_su' && school !== 'tu_linh_thuat_su') return false;
      if (s.evolutionKey) return s.evolutionKey === school;
      return s.school === school;
    });
  }

  // Ô tuyệt kỹ của người chơi (Toàn Năng có thêm 1 ô) và ô kỹ năng thường
  const ultSlotsOf = (player) => G.ULT_SLOTS.filter(i => i !== G.ULT_EXTRA_SLOT || G.baseSchool(player.school) === 'toan_nang');
  const normalSlotsOf = (player) => [0, 1, 2, 3].concat(G.baseSchool(player.school) === 'toan_nang' ? [G.EXTRA_SLOT] : []);
  const isUltSlot = (i) => G.ULT_SLOTS.includes(i);
  const ultKeyLabel = (i) => ['R', 'X', 'Z'][G.ULT_SLOTS.indexOf(i)] || '?';

  // Tuyệt kỹ đặc trưng của class (sách Tuyệt Kỹ Chức Nghiệp dạy tuyệt kỹ này)
  function signatureUlt(player) {
    const list = schoolsOf(player);
    return Object.keys(SKILLS).find(id => SKILLS[id].ult && !id.startsWith('ul') && (SKILLS[id].ultSchools || [SKILLS[id].school]).some(x => list.includes(x))) || null;
  }

  // Giới hạn học: 5 ô gốc + số ô đã mở rộng (tối đa 2) cho mỗi loại; usedSkillSlots = số kỹ năng đã học của loại đó
  // Không còn giới hạn số kỹ năng đã học (thường lẫn tuyệt kỹ). Giữ hàm để chỗ gọi cũ không vỡ.
  const skillCap = () => Infinity;
  // Tuyệt Phẩm KHÔNG tính vào ô học: nó là trụ riêng (logic/super-ults.js), không có cấp,
  // không tiêu điểm. Đếm nó vào đây là bắt người chơi trả một ô tuyệt kỹ cho thứ không nâng cấp được.
  const learnedIds = (player, ult) => Object.keys(player.skills || {}).filter(id => player.skills[id] > 0 && G.SKILLS[id] && !G.SKILLS[id].superUlt && !!G.SKILLS[id].ult === !!ult);
  const usedSkillSlots = (player, ult) => learnedIds(player, ult).length;

  // ---------------------------------------------------------------- Tuyệt Phẩm (trụ riêng)
  // Logic của trụ nằm ở logic/super-ults.js. Ở đây chỉ giữ hai chỗ PHẢI biết về nó:
  //   - skillLevel: cấp của Tuyệt Phẩm đến từ p.superUlts, không bao giờ từ p.skills
  //   - learnedIds: Tuyệt Phẩm không tính vào ô học
  // Không định nghĩa lại luật của trụ ở file này — một nguồn sự thật duy nhất.

  // Cấp để TÍNH TOÁN của một kỹ năng.
  // Tuyệt Phẩm: cấp CHỈ đến từ p.superUlts. Không đọc p.skills cho nó — nếu đọc, một save bị sửa
  // (ghi thẳng p.skills.ulPhapSuper = 10) sẽ vừa qua được onCast vừa qua được client.
  function skillLevel(player, id) {
    if (G.isTuyetPham(id)) return G.ownsTuyetPham(player, id) ? G.TUYET_PHAM_LEVEL : 0;
    return (player.skills && player.skills[id]) || 0;
  }

  // Chỉ còn MỘT thanh kỹ năng. Giữ hàm để chỗ gọi cũ không vỡ, nhưng luôn trả về skillSlots.
  const slotsOf = (player) => player.skillSlots;

  // ---------------------------------------------------------------- Kỹ năng do trang bị cấp
  // Một món Huyền thoại / độc nhất có thể mang theo một kỹ năng NẰM NGOÀI cây của class đang chơi:
  //   grantsSkill: 'tn3'   → món này cho dùng Băng Ngục (kỹ năng của Pháp Sư)
  //
  // Ô này là ô ẢO, KHÔNG lưu vào p.skillSlots:
  //   - mặc đồ thì có, tháo đồ thì mất, không cần lưu, không cần migrate save cũ
  //   - vì không nằm trong p.skillSlots nên bước lọc ô khi nạp nhân vật
  //     (server/game/index.js, G.availableSkills(p).includes(id)) không bao giờ đụng tới nó
  //     → không có chuyện đặt chiêu vào ô rồi thoát ra vào lại là mất trắng
  //
  // Chỉ MỘT kỹ năng mượn được cùng lúc: món đầu tiên theo thứ tự SLOTS thắng. Đó là quyết định
  // thật khi mặc đồ — muốn chiêu của món khác thì phải bỏ món đang cho chiêu.
  const GEAR_SKILL_SLOT = SKILL_SLOTS;   // 8 — ngay sau 8 ô thật
  const GEAR_SKILL_KEY = 'V';

  // Cấp của kỹ năng mượn: theo cấp nhân vật, không cần điểm kỹ năng, không nâng bằng điểm.
  // Cấp 12 → 1, cấp 24 → 3, cấp 40 → 5, cấp 80 → 10.
  const gearSkillLevel = (player) => Math.min(SKILL_MAX, Math.max(1, Math.floor((player.level || 1) / 8)));

  // Kỹ năng đang được trang bị cấp: { id, from, level } hoặc null
  function gearSkill(player) {
    if (!player || !player.equip) return null;
    for (const slot of G.SLOTS) {
      const it = player.equip[slot];
      if (!it) continue;
      const def = G.ITEMS[it.id];
      if (!def || !def.grantsSkill) continue;
      const sk = SKILLS[def.grantsSkill];
      if (!sk || sk.ult) continue;      // chỉ mượn được kỹ năng thường, không mượn tuyệt kỹ
      return { id: def.grantsSkill, from: it.id, level: gearSkillLevel(player) };
    }
    return null;
  }

  // Cấp thực tế để dùng một kỹ năng: đã học thì lấy cấp đã học, chưa học mà trang bị cấp thì lấy cấp mượn.
  // Dùng hàm này ở mọi chỗ TÍNH TOÁN (dùng chiêu, hiện chỉ số); skillLevel vẫn là "đã học" thuần tuý
  // để chỗ kiểm tra học sách / đếm ô học không bị lẫn.
  function skillLevelOf(player, id) {
    const learned = skillLevel(player, id);
    if (learned) return learned;
    const g = gearSkill(player);
    return g && g.id === id ? g.level : 0;
  }

  Object.assign(G, { skillAt, schoolsOf, ultFits, availableSkills, ultSlotsOf, normalSlotsOf, isUltSlot, ultKeyLabel, signatureUlt, skillCap, learnedIds, usedSkillSlots, skillLevel, slotsOf,
    GEAR_SKILL_SLOT, GEAR_SKILL_KEY, gearSkill, gearSkillLevel, skillLevelOf });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
