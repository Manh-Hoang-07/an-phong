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
    if (s.power) s.power = base.power * mul;
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
  function availableSkills(player) {
    if (!player.school) return [];
    return Object.keys(SKILLS).filter(id => {
      const s = SKILLS[id];
      if (s.evolutionKey && !player.advancement?.unlocked?.[s.evolutionKey]) return false;
      if (s.type === 'shadow_toggle' && player.school !== 'trieu_hoi_su' && player.school !== 'tu_linh_thuat_su') return false;
      if (player.school === 'toan_nang') return true;
      if (player.school === 'tu_linh_thuat_su') return s.school === 'trieu_hoi_su' || s.school === 'tu_linh_thuat_su';
      if (player.school === 'trieu_hoi_su' && player.advancement?.unlocked?.tu_linh_thuat_su) return s.school === 'trieu_hoi_su' || s.school === 'tu_linh_thuat_su';
      return s.school === player.school;
    });
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

  Object.assign(G, { skillAt, availableSkills, skillLevel, isCareerSkill, skillFormBlock });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
