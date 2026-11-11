/*
 * Thông số kỹ năng theo cấp, kỹ năng được học.
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
    const mul = 1 + 0.1 * (lv - 1);
    if (s.power) s.power = s.power * mul;
    if (s.after) s.after *= mul;
    if (s.finisher) s.finisher *= mul;
    if (s.heal) s.heal = Math.min(0.9, s.heal * (1 + 0.05 * (lv - 1)));
    if (s.atkBuff) s.atkBuff *= (1 + 0.05 * (lv - 1));
    s.mp = Math.round(base.mp * (1 + 0.04 * (lv - 1)));
    if (lv >= 10) s.cd = s.cd * 0.85;
    s.lv = lv;
    return s;
  }
  // Kỹ năng class được học
  // Các class mà người chơi được tính là (Triệu Hồi Sư đã tiến hóa vẫn có kỹ năng Tử Linh và ngược lại)
  function schoolsOf(player) {
    if (!player.school) return [];
    if (player.school === 'tu_linh_thuat_su') return ['tu_linh_thuat_su', 'trieu_hoi_su'];
    if (player.school === 'trieu_hoi_su' && player.advancement?.unlocked?.tu_linh_thuat_su) return ['trieu_hoi_su', 'tu_linh_thuat_su'];
    return [player.school];
  }
  // Tuyệt kỹ này có hợp với class của người chơi không (Toàn Năng: mọi tuyệt kỹ)
  function ultFits(player, s) {
    if (!s || !s.ult || !player.school) return false;
    if (player.school === 'toan_nang' || s.ultAny) return true;
    const list = s.ultSchools || [s.school];
    return schoolsOf(player).some(x => list.includes(x));
  }
  function availableSkills(player) {
    if (!player.school) return [];
    return Object.keys(SKILLS).filter(id => {
      const s = SKILLS[id];
      if (s.ult) return ultFits(player, s);
      if (s.evolutionKey && !player.advancement?.unlocked?.[s.evolutionKey]) return false;
      if (s.type === 'shadow_toggle' && player.school !== 'trieu_hoi_su' && player.school !== 'tu_linh_thuat_su') return false;
      if (player.school === 'toan_nang') return true;
      if (player.school === 'tu_linh_thuat_su') return s.school === 'trieu_hoi_su' || s.school === 'tu_linh_thuat_su';
      if (player.school === 'trieu_hoi_su' && player.advancement?.unlocked?.tu_linh_thuat_su) return s.school === 'trieu_hoi_su' || s.school === 'tu_linh_thuat_su';
      return s.school === player.school;
    });
  }
  // Ô tuyệt kỹ của người chơi (Toàn Năng có thêm 1 ô) và ô kỹ năng thường
  const ultSlotsOf = (player) => G.ULT_SLOTS.filter(i => i !== G.ULT_EXTRA_SLOT || player.school === 'toan_nang');
  const normalSlotsOf = (player) => [0, 1, 2, 3].concat(player.school === 'toan_nang' ? [G.EXTRA_SLOT] : []);
  const isUltSlot = (i) => G.ULT_SLOTS.includes(i);
  const ultKeyLabel = (i) => ['R', 'X', 'Z'][G.ULT_SLOTS.indexOf(i)] || '?';
  // Tuyệt kỹ đặc trưng của class (sách Tuyệt Kỹ Chức Nghiệp dạy tuyệt kỹ này)
  function signatureUlt(player) {
    const home = player.school === 'trieu_hoi_su' && player.advancement?.unlocked?.tu_linh_thuat_su ? 'tu_linh_thuat_su' : player.school;
    return Object.keys(SKILLS).find(id => SKILLS[id].ult && !id.startsWith('ul') && (SKILLS[id].ultSchools || [SKILLS[id].school]).includes(home)) || null;
  }
  function skillLevel(player, id) { return (player.skills && player.skills[id]) || 0; }
  // Kỹ năng nhánh chức nghiệp 2 (tiến hóa): có evolutionKey, hoặc kỹ năng Tử Linh Thuật Sư
  const isCareerSkill = (s) => !!(s && (s.evolutionKey || s.school === 'tu_linh_thuat_su'));
  // Kỹ năng có dùng được ở hình thái hiện tại không (careerOn: đang bật chức nghiệp 2). Trả về lý do khi KHÔNG dùng được.
  // - Kỹ năng chức nghiệp 2 chỉ dùng khi đang bật chức nghiệp 2.
  // - Đang bật chức nghiệp 2 thì mọi kỹ năng chức nghiệp 1 bị khóa. Ngoại lệ: Toàn Năng (Tinh Thông không có bộ kỹ năng riêng).
  function skillFormBlock(player, s, careerOn) {
    if (isCareerSkill(s)) return careerOn ? null : 'Cần bật chức nghiệp 2 để dùng kỹ năng nhánh này.';
    if (careerOn && player.school !== 'toan_nang') return 'Đang ở chức nghiệp 2: kỹ năng chức nghiệp 1 không dùng được.';
    return null;
  }

  // Thanh kỹ năng theo hình thái: chức nghiệp 2 có thanh riêng (careerSlots), trống nếu chưa học kỹ năng nhánh.
  // Toàn Năng giữ một thanh chung (Tinh Thông không có bộ kỹ năng riêng).
  const usesCareerBar = (player, careerOn) => !!careerOn && player.school !== 'toan_nang';
  const EMPTY_BAR = Object.freeze(Array(G.SKILL_SLOTS).fill(null));
  function slotsOf(player, careerOn) {
    return usesCareerBar(player, careerOn) ? (Array.isArray(player.careerSlots) ? player.careerSlots : EMPTY_BAR) : player.skillSlots;
  }
  // Tên thanh chứa một kỹ năng: kỹ năng nhánh → careerSlots, còn lại → skillSlots
  function slotKeyOf(player, id) {
    return player.school !== 'toan_nang' && isCareerSkill(SKILLS[id]) ? 'careerSlots' : 'skillSlots';
  }
  // Đang bật chức nghiệp 2 (theo dữ liệu nhân vật phía server)
  const careerActive = (player) => !!player.formActive && player.formChoice === 'evolution';

  Object.assign(G, { skillAt, schoolsOf, ultFits, ultSlotsOf, normalSlotsOf, isUltSlot, ultKeyLabel, signatureUlt, availableSkills, skillLevel, isCareerSkill, skillFormBlock, usesCareerBar, slotsOf, slotKeyOf, careerActive });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
