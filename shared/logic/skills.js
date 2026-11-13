/*
 * Kỹ năng: thông số theo cấp, kỹ năng được học, ô kỹ năng.
 *
 * Mô hình một class duy nhất: p.school là class HIỆN TẠI (class nền hoặc chức nghiệp 2).
 * Người chơi chỉ dùng kỹ năng của chính class đó — không còn hai thanh kỹ năng, không còn
 * cơ chế bật/tắt chức nghiệp 2. Ngoại lệ duy nhất: Toàn Năng dùng được kỹ năng của mọi class.
 */
(function (G) {
  'use strict';
  const { SKILL_MAX, SKILLS } = G;

  // Thông số thực tế của kỹ năng ở một cấp
  function skillAt(id, lv) {
    const base = SKILLS[id];
    if (!base) return null;
    lv = Math.max(1, Math.min(SKILL_MAX, lv || 1));
    const s = { ...base };
    if (lv >= 5 && base.m5) Object.assign(s, base.m5);
    if (lv >= 10 && base.m10) Object.assign(s, base.m10);
    const mul = 1 + 0.05 * (lv - 1);   // sát thương +5% mỗi cấp (cả kỹ năng thường và tuyệt kỹ)
    if (s.power) s.power = s.power * mul;
    if (s.after) s.after *= mul;
    if (s.finisher) s.finisher *= mul;
    if (s.heal) s.heal = Math.min(0.9, s.heal * (1 + 0.03 * (lv - 1)));
    if (s.atkBuff) s.atkBuff *= (1 + 0.05 * (lv - 1));
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
  const skillCap = (player, ult) => G.SKILL_BASE_CAP + Math.min(G.SKILL_EXPAND_MAX, Math.max(0, (player.skillExpand && player.skillExpand[ult ? 'ult' : 'normal']) || 0));
  const learnedIds = (player, ult) => Object.keys(player.skills || {}).filter(id => player.skills[id] > 0 && G.SKILLS[id] && !!G.SKILLS[id].ult === !!ult);
  const usedSkillSlots = (player, ult) => learnedIds(player, ult).length;

  function skillLevel(player, id) { return (player.skills && player.skills[id]) || 0; }

  // Chỉ còn MỘT thanh kỹ năng. Giữ hàm để chỗ gọi cũ không vỡ, nhưng luôn trả về skillSlots.
  const slotsOf = (player) => player.skillSlots;

  Object.assign(G, { skillAt, schoolsOf, ultFits, availableSkills, ultSlotsOf, normalSlotsOf, isUltSlot, ultKeyLabel, signatureUlt, skillCap, learnedIds, usedSkillSlots, skillLevel, slotsOf });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
