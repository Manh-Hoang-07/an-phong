'use strict';
/*
 * Kiểm tra 5 hệ thống trang bị thêm ngày 2026-11-16:
 *   1. Thưởng mặc đủ bộ (ngưỡng 6/10)
 *   2. fx trên cả 15 ô (đồ trùm dùng được hiệu ứng)
 *   3. Khắc ấn cho đồ hoàn hảo 95%+
 *   4. Kỹ năng do trang bị cấp (ô thứ 9)
 *   5. Vết Nhiễm trên đồ rơi ở cổng đỏ
 *
 * Chạy: node server/tools/check/check-gear-systems.js
 */
const G = require('../../../shared');

let pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✓ ${label}${extra !== undefined ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`  ✗ ${label}${extra !== undefined ? ' — ' + extra : ''}`); }
}
function head(t) { console.log(`\n${t}`); }

// Dựng nhân vật thử
function mkPlayer(level, school) {
  const p = G.newPlayer('test');
  p.level = level || 30;
  p.school = school || 'kiem_si';
  return p;
}
function wear(p, id, extra) {
  const def = G.ITEMS[id];
  p.equip[def.slot] = { uid: p.nextUid++, id, qty: 1, plus: 0, q: 4, roll: 1, aff: [], ...(extra || {}) };
  return p.equip[def.slot];
}

// ---------------------------------------------------------------- 1. Thưởng bộ
head('1. Thưởng mặc đủ bộ — ngưỡng 6/10');
{
  ok(typeof G.setBonusOf === 'function', 'setBonusOf tồn tại');
  ok(typeof G.setCounts === 'function', 'setCounts tồn tại');
  ok(G.SET_TIER_LOW === 6 && G.SET_TIER_HIGH === 10, 'ngưỡng là 6 và 10', `${G.SET_TIER_LOW}/${G.SET_TIER_HIGH}`);

  // Mọi bộ phải có at6 và at10, nếu không thì người chơi mặc đủ vẫn không được gì
  const missing = [];
  for (const s of G.SETS) {
    const b = G.SET_BONUS[s.id];
    if (!b) { missing.push(`${s.id}: thiếu SET_BONUS`); continue; }
    if (!b.at6) missing.push(`${s.id}: thiếu at6`);
    if (!b.at10) missing.push(`${s.id}: thiếu at10`);
  }
  ok(missing.length === 0, 'cả 10 bộ đều có at6 và at10', missing.join('; ') || '10/10');

  // 5 món: chưa có thưởng
  const p = mkPlayer(15);
  ['kiem_thach_quy', 'mu_thach_quy', 'ao_giap_da', 'gang_thach_quy', 'dai_thach_quy'].forEach(id => wear(p, id));
  ok(G.setBonusOf(p) === null, '5 món: chưa đủ ngưỡng, không thưởng');

  // 6 món: có thưởng bậc 1
  wear(p, 'quan_thach_quy');
  const b6 = G.setBonusOf(p);
  ok(b6 && b6.tier === 1 && b6.count === 6, '6 món: thưởng bậc 1', b6 ? `${b6.name} ${b6.count}/10` : 'null');
  const s6 = G.calcStats(p);
  ok(s6.maxHp > 0, '6 món: calcStats chạy được', `maxHp=${s6.maxHp}`);

  // 10 món: bậc 2 + hiệu ứng
  ['giay_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy'].forEach(id => wear(p, id));
  const b10 = G.setBonusOf(p);
  ok(b10 && b10.tier === 2 && b10.count === 10, '10 món: thưởng bậc 2', b10 ? `${b10.name} ${b10.count}/10` : 'null');
  ok(!!(b10 && b10.fx), '10 món bộ Thạch Vương: có hiệu ứng Khiên Đá', b10 && b10.fx ? b10.fx.kind : 'không');
  ok(G.specialFx(p).setStone !== undefined, 'specialFx gom được hiệu ứng bộ');

  // Bậc 2 phải mạnh hơn bậc 1 (nếu không thì mặc thêm 4 món chẳng để làm gì)
  const hp10 = G.calcStats(p).maxHp;
  ok(hp10 >= s6.maxHp, 'mặc thêm 4 món không làm yếu đi', `${s6.maxHp} → ${hp10}`);

  // Kỳ Nguyên không được tính vào bộ (không có slot, không thuộc SETS)
  const q = mkPlayer(50);
  q.kyNguyen = { owned: ['kn_bat_tu'], active: ['kn_bat_tu'] };
  ok(Object.keys(G.setCounts(q)).length === 0, 'Kỳ Nguyên không tính vào bộ');

  // Bộ mạnh nhất thắng: 6 món bộ 2 + 4 món bộ 3 → bộ 2
  const r = mkPlayer(30);
  ['kiem_thach_quy', 'mu_thach_quy', 'ao_giap_da', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy'].forEach(id => wear(r, id));
  ['giay_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long'].forEach(id => { if (G.ITEMS[id]) wear(r, id); });
  const rb = G.setBonusOf(r);
  ok(rb && rb.id === 2, 'bộ nhiều món nhất thắng (Thạch Vương 6 > Băng Long 4)', rb ? `${rb.name} ${rb.count}` : 'null');
}

// ---------------------------------------------------------------- 2. fx trên 15 ô
head('2. fx dùng được trên cả 15 ô');
{
  const p = mkPlayer(50);
  wear(p, 'thuong_bang_suong');
  ok(G.specialFx(p).slowAura !== undefined, 'Thượng Băng Sương: slowAura đọc từ dữ liệu', JSON.stringify(G.specialFx(p).slowAura));

  const q = mkPlayer(50);
  wear(q, 'than_kiem_vinh_hang');
  ok(G.specialFx(q).pierce !== undefined, 'Thần Kiếm Vĩnh Hằng: pierce đọc từ dữ liệu', JSON.stringify(G.specialFx(q).pierce));

  // fx trên một ô thường bất kỳ (không phải vũ khí) vẫn phải được gom
  const r = mkPlayer(50);
  const saved = G.ITEMS.ao_giap_da.fx;
  G.ITEMS.ao_giap_da.fx = { kind: 'testArmorFx', v: 1 };
  wear(r, 'ao_giap_da');
  ok(G.specialFx(r).testArmorFx !== undefined, 'fx trên ô áo (ô thường) được gom');
  if (saved === undefined) delete G.ITEMS.ao_giap_da.fx; else G.ITEMS.ao_giap_da.fx = saved;

  // Không còn so sánh id cứng trong client
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '../../..');
  const combat = fs.readFileSync(path.join(root, 'public/js/scene/combat.js'), 'utf8');
  const monsters = fs.readFileSync(path.join(root, 'public/js/scene/monsters.js'), 'utf8');
  ok(!combat.includes("=== 'than_kiem_vinh_hang'"), 'combat.js không còn so sánh id Thần Kiếm');
  ok(!monsters.includes("=== 'thuong_bang_suong'"), 'monsters.js không còn so sánh id Thượng Băng Sương');
}

// ---------------------------------------------------------------- 3. Khắc ấn
head('3. Khắc ấn cho đồ hoàn hảo');
{
  ok(G.PERFECT_MIN === 95, 'ngưỡng hoàn hảo là 95%', G.PERFECT_MIN);
  const perfect = { id: 'kiem_bang_long', qty: 1, plus: 0, q: 4, roll: 1.2, aff: [['atk', 10, 1], ['hp', 100, 1], ['crit', 5, 1]] };
  ok(G.perfection(perfect) >= 95, 'đồ roll cao đạt >= 95%', G.perfection(perfect));
  ok(G.canSeal(perfect) === true, 'đồ hoàn hảo khắc ấn được');
  const c = G.sealCost(perfect);
  ok(c.gold > 0 && c.stones > 0, 'có chi phí', `${c.gold} xu · ${c.stones} đá`);

  ok(G.canSeal({ ...perfect, seal: true }) === false, 'đã khắc ấn thì không khắc lại');
  ok(G.canSeal({ ...perfect, q: 1, aff: [] }) === false, 'đồ Thường không khắc ấn được');
  ok(G.canSeal({ id: 'kn_bat_tu', qty: 1, q: 4, roll: 1.2, aff: [] }) === false, 'Kỳ Nguyên không khắc ấn được');
  ok(G.canSeal({ id: 'kiem_bang_long', qty: 1, q: 2, roll: 0.8, aff: [['atk', 3, 0.1]] }) === false, 'đồ hoàn hảo thấp không khắc ấn được');

  // Khắc ấn phải thêm đúng 1 dòng phụ
  const inst = { ...perfect, aff: [...perfect.aff] };
  const before = inst.aff.length;
  const extra = G.rollAffixes(G.ITEMS[inst.id], inst.q, 1);
  inst.aff = inst.aff.concat(extra);
  ok(inst.aff.length === before + 1, 'khắc ấn thêm đúng 1 dòng phụ', `${before} → ${inst.aff.length}`);
  ok(inst.aff.length === G.SEAL_AFFIX_COUNT, 'tổng đúng 4 dòng', inst.aff.length);
}

// ---------------------------------------------------------------- 4. Kỹ năng do trang bị cấp
head('4. Kỹ năng do trang bị cấp (ô thứ 9)');
{
  ok(G.GEAR_SKILL_SLOT === G.SKILL_SLOTS, 'ô thứ 9 nằm ngoài 8 ô thật', `slot=${G.GEAR_SKILL_SLOT}`);
  ok(typeof G.gearSkill === 'function' && typeof G.skillLevelOf === 'function', 'gearSkill / skillLevelOf tồn tại');

  const p = mkPlayer(50, 'kiem_si');
  ok(G.gearSkill(p) === null, 'chưa mặc gì: không có kỹ năng mượn');

  wear(p, 'thuong_bang_suong');
  const g = G.gearSkill(p);
  ok(g && g.id === 'tn3', 'Thượng Băng Sương cấp Băng Ngục', g ? g.id : 'null');
  ok(g && g.level > 0, 'có cấp theo cấp nhân vật', g ? `cấp ${g.level}` : '');
  ok(G.skillLevelOf(p, 'tn3') === g.level, 'skillLevelOf trả cấp mượn');
  ok(G.skillLevel(p, 'tn3') === 0, 'skillLevel (đã học) vẫn là 0 — không lẫn với điểm kỹ năng');

  // Kỹ năng mượn KHÔNG được lọt vào availableSkills, nếu không sẽ phá bước lọc ô khi nạp nhân vật
  ok(!G.availableSkills(p).includes('tn3'), 'availableSkills không chứa kỹ năng mượn (không phá bước lọc ô)');

  // Mọi món có grantsSkill phải trỏ tới kỹ năng thường có thật
  const bad = [];
  for (const id in G.ITEMS) {
    const d = G.ITEMS[id];
    if (!d.grantsSkill) continue;
    const sk = G.SKILLS[d.grantsSkill];
    if (!sk) bad.push(`${id}: không có kỹ năng ${d.grantsSkill}`);
    else if (sk.ult) bad.push(`${id}: ${d.grantsSkill} là tuyệt kỹ, không mượn được`);
    else if (!d.slot) bad.push(`${id}: có grantsSkill nhưng không phải trang bị`);
  }
  ok(bad.length === 0, 'mọi grantsSkill trỏ tới kỹ năng thường hợp lệ', bad.join('; ') || 'OK');

  const granted = Object.keys(G.ITEMS).filter(id => G.ITEMS[id].grantsSkill);
  ok(granted.length >= 5, 'có ít nhất 5 món cấp kỹ năng', granted.length);

  // Chỉ một kỹ năng mượn cùng lúc
  const q = mkPlayer(50, 'kiem_si');
  wear(q, 'thuong_bang_suong');
  wear(q, 'vuong_mien_tri_thuc');
  const gq = G.gearSkill(q);
  ok(gq && gq.id === 'tn3', 'mặc 2 món: món đứng trước trong SLOTS thắng', gq ? gq.id : 'null');
  ok(G.SLOTS.indexOf('weapon') < G.SLOTS.indexOf('mu'), 'vũ khí đứng trước mũ trong SLOTS');

  // Tháo đồ thì mất kỹ năng
  q.equip.weapon = null;
  ok(G.gearSkill(q).id === 'tk4', 'tháo vũ khí: chuyển sang kỹ năng của món kế tiếp', G.gearSkill(q).id);
}

// ---------------------------------------------------------------- 5. Vết Nhiễm
head('5. Vết Nhiễm (nhiễm đỏ)');
{
  ok(G.isRedGate('cong_do') === true, 'Cổng đỏ là cổng đỏ');
  ok(G.isRedGate('lang') === false, 'làng không phải cổng đỏ');
  const redMaps = Object.keys(G.MAPS).filter(m => G.isRedGate(m));
  ok(redMaps.length > 0, 'có bản đồ cổng đỏ', redMaps.length);

  // Tỉ lệ nhiễm xấp xỉ NHIEM_CHANCE
  let n = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const inst = G.makeInst('kiem_thach_quy', { table: 'normal' });
    G.rollNhiem(inst, 'cong_do');
    if (inst.nhiem) n++;
  }
  const rate = n / N;
  ok(Math.abs(rate - G.NHIEM_CHANCE) < 0.04, 'tỉ lệ nhiễm đúng thiết kế', `${(rate * 100).toFixed(1)}% (thiết kế ${G.NHIEM_CHANCE * 100}%)`);

  // Đồ ở làng không nhiễm
  const clean = G.makeInst('kiem_thach_quy', { table: 'normal' });
  G.rollNhiem(clean, 'lang');
  ok(!clean.nhiem, 'đồ rơi ở làng không nhiễm');

  // Kỳ Nguyên không nhiễm (không phải trang bị, không đi qua rollNhiem)
  const sp = { id: 'kn_bat_tu', qty: 1, plus: 0 };
  G.rollNhiem(sp, 'cong_do');
  ok(!sp.nhiem, 'Kỳ Nguyên không nhiễm');

  // Bậc nhiễm trong khoảng 1..NHIEM_MAX
  let badTier = 0;
  for (let i = 0; i < 500; i++) {
    const inst = G.makeInst('kiem_thach_quy', { table: 'boss' });
    G.rollNhiem(inst, 'cong_do');
    if (inst.nhiem && (inst.nhiem < 1 || inst.nhiem > G.NHIEM_MAX)) badTier++;
  }
  ok(badTier === 0, `bậc nhiễm luôn trong 1..${G.NHIEM_MAX}`);

  // Đồ nhiễm mạnh hơn đồ sạch cùng roll
  const base = { id: 'ao_giap_da', qty: 1, plus: 0, q: 3, roll: 1, aff: [] };
  const sClean = G.instStats(base).main;
  const sNhiem = G.instStats({ ...base, nhiem: 2 }).main;
  ok(sNhiem.def > sClean.def && sNhiem.hp > sClean.hp, 'đồ nhiễm mạnh hơn đồ sạch', `def ${sClean.def}→${sNhiem.def}, hp ${sClean.hp}→${sNhiem.hp}`);

  // Mặc đồ nhiễm thì mất máu tối đa
  const p = mkPlayer(30);
  const hpClean = G.calcStats(p).maxHp;
  wear(p, 'ao_giap_da', { nhiem: 2 });
  const st = G.calcStats(p);
  ok(st.nhiem === 2, 'calcStats báo số bậc nhiễm đang mang', st.nhiem);
  ok(st.maxHp < hpClean, 'mặc đồ nhiễm làm giảm máu tối đa', `${hpClean} → ${st.maxHp}`);

  // Sàn 30%: nhiễm cực nhiều cũng không mất quá 30% máu
  ok(G.nhiemHpMul(100) >= 0.7, 'máu không bao giờ giảm quá 30%', G.nhiemHpMul(100));

  // Gột sạch: giữ nguyên chỉ số đã roll, chỉ mất phần cộng thêm của nhiễm
  const inst = { ...base, nhiem: 3 };
  const before = G.instStats(inst).main;
  G.cleanseNhiem(inst);
  const after = G.instStats(inst).main;
  ok(!inst.nhiem, 'gột xong không còn nhiễm');
  ok(after.def < before.def, 'gột xong mất phần chỉ số cộng thêm', `def ${before.def} → ${after.def}`);
  ok(after.def === sClean.def, 'gột xong chỉ số về đúng đồ sạch cùng roll', `${after.def} = ${sClean.def}`);
  ok(G.cleanseNhiem(inst) === false, 'gột món không nhiễm trả về false');

  // Thuốc chữa nhiễm đỏ phải tồn tại và bán ở Dược sư
  ok(!!G.ITEMS.thuoc_nhiem_do, 'Thuốc chữa nhiễm đỏ tồn tại');
  const herb = Object.keys(G.NPCS).find(id => G.NPCS[id].shopKind === 'herb' && (G.NPCS[id].shop || []).includes('thuoc_nhiem_do'));
  ok(!!herb, 'Dược sư có bán Thuốc chữa nhiễm đỏ', herb || 'KHÔNG');
}

// ---------------------------------------------------------------- Tổng kết
console.log(`\n${fail === 0 ? '✓ Tất cả kiểm tra đạt' : '✗ CÓ KIỂM TRA KHÔNG ĐẠT'}: ${pass} đạt, ${fail} hỏng.`);
process.exit(fail === 0 ? 0 : 1);
