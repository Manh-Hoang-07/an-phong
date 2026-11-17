'use strict';
/*
 * Kiểm tra trụ SIÊU TUYỆT KỸ (tách khỏi kỹ năng).
 *
 *   node server/tools/check/check-super-ults.js
 *
 * Khoá các luật sau — mỗi luật là một lỗ hổng hoặc một lỗi cân bằng thật:
 *   A. Phân loại: siêu tuyệt kỹ không lẫn vào kỹ năng/tuyệt kỹ.
 *   B. Sở hữu: p.superUlts là nguồn sự thật, p.skills không quyết định được.
 *   C. Không ăn ô học: sở hữu siêu tuyệt kỹ không chiếm ô tuyệt kỹ.
 *   D. Không nâng cấp: không cấp, không điểm, không pips; skillAt trả nguyên bản.
 *   E. Migrate: save cũ có siêu tuyệt kỹ trong p.skills được chuyển sang p.superUlts.
 *   F. Chống lạm dụng: các đường server (cast/exec/fusion/manaburst/allin) đòi SỞ HỮU + GẮN.
 *   G. Không bị quét: tẩy điểm và đổi class không làm mất siêu tuyệt kỹ.
 */
const G = require('../../../shared');

let fails = 0;
const ok = (cond, label, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) fails++;
};

// Nhân vật tối thiểu đủ để chạy các hàm logic (không cần DB).
function mkPlayer(over = {}) {
  return Object.assign({
    name: 'test', level: 80, school: 'phap_su', map: 'lang',
    hp: 1000, mp: 1000, gold: 0, exp: 0,
    points: { str: 5, vit: 5, agi: 5, spi: 5 }, freePoints: 0,
    skills: {}, skillSlots: Array(G.SKILL_SLOTS).fill(null), skillPoints: 0,
    skillExpand: { normal: 0, ult: 0 }, superUlts: {},
    equip: {}, bag: [], storageByMap: {}, unlocks: {}, redeemed: [], perks: [],
    boosts: {}, mounts: { owned: [], summoned: [], skills: {} }, pets: {},
  }, over);
}

console.log('A. Phân loại');
const supers = G.TUYET_PHAM.slice();
ok(supers.length === 5, 'có đúng 5 siêu tuyệt kỹ', supers.join(', '));
ok(supers.every(id => G.SKILLS[id].superUlt === true), 'mọi id đều mang cờ superUlt');
ok(supers.every(id => G.SKILLS[id].ult === true), 'vẫn là ult: true để dùng chung ô R/X/Z');
ok(G.isSuperUlt('ulChung1') === false, 'tuyệt kỹ thường không bị nhận nhầm');
ok(G.isSuperUlt('st1') === false, 'kỹ năng thường không bị nhận nhầm');
ok(G.isSuperUlt('khong_ton_tai') === false, 'id lạ không bị nhận nhầm');

console.log('\nA2. Cái giá khai báo bằng cost');
{
  const COST_TYPES = ['hp', 'mp_burn', 'skill_lock', 'roster', 'atk_zero'];
  for (const id of supers) {
    const sk = G.SKILLS[id];
    ok(!!sk.cost && COST_TYPES.includes(sk.cost.type), `${id} có cost.type hợp lệ`, sk.cost && sk.cost.type);
  }
  // cost là nguồn khai báo duy nhất: field engine đọc phải được SUY RA từ nó, không khai tay hai lần.
  ok(G.SKILLS.ulSinhTu.cost.type === 'hp' && G.SKILLS.ulSinhTu.selfZero === true, 'hp → selfZero');
  ok(G.SKILLS.ulSinhTu.buaSaves === true, 'hp → buaSaves');
  ok(G.SKILLS.ulPhapSuper.cost.type === 'mp_burn' && G.SKILLS.ulPhapSuper.lockSec === 10, 'mp_burn → lockSec');
  ok(G.SKILLS.ulToanNangSuper.cost.type === 'skill_lock' && G.SKILLS.ulToanNangSuper.lockSec === 60, 'skill_lock → lockSec');
  ok(G.SKILLS.ulTuLinhDungHop.cost.type === 'roster' && G.SKILLS.ulTuLinhDungHop.fusionCost === 'roster', 'roster → fusionCost');
  ok(G.SKILLS.ulTankSuper.cost.type === 'atk_zero' && G.SKILLS.ulTankSuper.atkBuff === -1, 'atk_zero → atkBuff');
  ok(G.SKILLS.ulTankSuper.duration === 70, 'atk_zero → duration');
  // Mô tả cái giá cho UI đọc từ cost, không đoán lại từ cờ rời.
  for (const id of supers) ok(G.tuyetPhamCosts(G.SKILLS[id]).length > 0, `${id} có mô tả cái giá`);
}

console.log('\nB. Sở hữu đọc từ p.superUlts, không từ p.skills');
{
  const p = mkPlayer();
  // Giả lập save bẩn: kẻ sửa save ghi thẳng vào p.skills.
  p.skills.ulPhapSuper = 10;
  ok(G.ownsSuperUlt(p, 'ulPhapSuper') === false, 'ghi p.skills KHÔNG làm thành sở hữu');
  ok(G.skillLevel(p, 'ulPhapSuper') === 0, 'skillLevel vẫn 0 khi chỉ có p.skills');
  G.learnSuperUlt(p, 'ulPhapSuper');
  ok(G.ownsSuperUlt(p, 'ulPhapSuper') === true, 'learnSuperUlt mở đúng trụ');
  ok(p.skills.ulPhapSuper === 10, 'learnSuperUlt không đụng p.skills');
  ok(G.skillLevel(p, 'ulPhapSuper') === G.SUPER_ULT_LEVEL, 'skillLevel trả cấp cố định khi đã sở hữu');
  ok(G.learnSuperUlt(p, 'ulPhapSuper') === false, 'mở lần hai trả false (idempotent)');
  ok(G.learnSuperUlt(p, 'st1') === false, 'không mở được kỹ năng thường qua trụ');
  ok(G.learnSuperUlt(p, 'khong_co') === false, 'không mở được id lạ');
}

console.log('\nC. Không chiếm ô học kỹ năng/tuyệt kỹ');
{
  const p = mkPlayer();
  for (const id of supers) G.learnSuperUlt(p, id);
  ok(G.usedSkillSlots(p, true) === 0, 'sở hữu cả 5 vẫn dùng 0 ô tuyệt kỹ', String(G.usedSkillSlots(p, true)));
  ok(G.usedSkillSlots(p, false) === 0, 'không đụng ô kỹ năng thường');
  ok(G.learnedIds(p, true).length === 0, 'learnedIds không liệt kê siêu tuyệt kỹ');
  ok(G.superUltsOf(p).length === 5, 'superUltsOf liệt kê đủ 5');
  // Tuyệt kỹ thật vẫn đếm bình thường.
  p.skills.ulChung1 = 1;
  ok(G.usedSkillSlots(p, true) === 1, 'tuyệt kỹ thật vẫn chiếm ô như cũ', String(G.usedSkillSlots(p, true)));
}

console.log('\nD. Không có cấp để nâng');
{
  for (const id of supers) {
    const a = G.skillAt(id, 1), b = G.skillAt(id, 10);
    const same = JSON.stringify({ ...a, lv: 0 }) === JSON.stringify({ ...b, lv: 0 });
    ok(same, `${id}: skillAt cấp 1 và cấp 10 giống hệt (chỉ số cố định)`);
  }
  const p = mkPlayer({ skillPoints: 99 });
  G.learnSuperUlt(p, 'ulPhapSuper');
  ok(p.skillPoints === 99, 'sở hữu siêu tuyệt kỹ không tiêu điểm kỹ năng');
}

console.log('\nE. Migrate save cũ');
{
  // Mô phỏng normalize: save cũ có siêu tuyệt kỹ trong p.skills, chưa có p.superUlts.
  const p = mkPlayer({ superUlts: undefined });
  p.skills = { ulSinhTu: 1, ulChung1: 3, st1: 2 };
  // Đúng đoạn migrate trong server/game/index.js
  if (!p.superUlts || typeof p.superUlts !== 'object' || Array.isArray(p.superUlts)) p.superUlts = {};
  for (const id of Object.keys(p.superUlts)) if (!G.isSuperUlt(id) || p.superUlts[id] !== true) delete p.superUlts[id];
  for (const id of Object.keys(p.skills)) {
    if (!G.isSuperUlt(id)) continue;
    p.superUlts[id] = true;
    delete p.skills[id];
  }
  ok(p.superUlts.ulSinhTu === true, 'siêu tuyệt kỹ cũ được chuyển sang p.superUlts');
  ok(p.skills.ulSinhTu === undefined, 'đã xoá khỏi p.skills');
  ok(p.skills.ulChung1 === 3, 'tuyệt kỹ thật giữ nguyên cấp');
  ok(p.skills.st1 === 2, 'kỹ năng thường giữ nguyên cấp');
  // Chạy lại lần hai: không đổi gì (idempotent).
  const before = JSON.stringify(p);
  for (const id of Object.keys(p.skills)) { if (!G.isSuperUlt(id)) continue; p.superUlts[id] = true; delete p.skills[id]; }
  ok(JSON.stringify(p) === before, 'migrate chạy lại không đổi gì');
  // Rác trong p.superUlts bị dọn.
  p.superUlts.rac = true; p.superUlts.st1 = true;
  for (const id of Object.keys(p.superUlts)) if (!G.isSuperUlt(id) || p.superUlts[id] !== true) delete p.superUlts[id];
  ok(p.superUlts.rac === undefined && p.superUlts.st1 === undefined, 'id lạ trong p.superUlts bị dọn');
}

console.log('\nF. Đường server đòi SỞ HỮU + GẮN (không tin client)');
{
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..', '..', '..');
  const rt = fs.readFileSync(path.join(root, 'server/realtime/index.js'), 'utf8');
  const cb = fs.readFileSync(path.join(root, 'server/game/actions/combat.js'), 'utf8');
  const ch = fs.readFileSync(path.join(root, 'server/game/actions/character.js'), 'utf8');
  const it = fs.readFileSync(path.join(root, 'server/game/actions/items.js'), 'utf8');

  // Cache server phải nạp từ trụ riêng, nếu không onCast từ chối oan.
  ok(/G\.superUltsOf\(p\)/.test(rt), 'realtime cache nạp siêu tuyệt kỹ từ p.superUlts');
  // Bốn handler đặc biệt phải kiểm sở hữu qua ownsSuperUlt.
  for (const id of ['ulSinhTu', 'ulPhapSuper', 'ulToanNangSuper']) {
    ok(new RegExp(`ownsSuperUlt\\(p, '${id}'\\)`).test(rt), `realtime kiểm sở hữu ${id} bằng ownsSuperUlt`);
  }
  ok(/ownsSuperUlt\(p, id\)/.test(cb), 'applyFusion kiểm sở hữu bằng ownsSuperUlt');
  // Không còn chỗ nào đọc thẳng p.skills.<siêu tuyệt kỹ> để quyết định quyền dùng.
  ok(!/p\.skills\.ulSinhTu/.test(rt), 'không còn đọc p.skills.ulSinhTu');
  ok(!/p\.skills\.ulPhapSuper/.test(rt), 'không còn đọc p.skills.ulPhapSuper');
  ok(!/p\.skills\.ulToanNangSuper/.test(rt), 'không còn đọc p.skills.ulToanNangSuper');
  // Sách phải mở ở trụ riêng, không tiêu ô.
  ok(/learnSuperUlt\(p, id\)/.test(it), 'đọc sách siêu tuyệt kỹ mở ở trụ riêng');
  // learn_skill phải chặn trước khi trừ điểm.
  ok(/if \(sk\.superUlt\) fail\(/.test(ch), 'learn_skill chặn siêu tuyệt kỹ trước khi trừ điểm');
}

console.log('\nG. Không bị tẩy điểm / đổi class quét mất');
{
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..', '..', '..');
  const ch = fs.readFileSync(path.join(root, 'server/game/actions/character.js'), 'utf8');
  const pr = fs.readFileSync(path.join(root, 'server/game/core/progress.js'), 'utf8');
  ok(/!G\.isSuperUlt\(id\)/.test(ch), 'reset_skills bỏ qua siêu tuyệt kỹ');
  ok(/if \(G\.isSuperUlt\(id\)\) continue;/.test(pr), 'setSchool không xoá siêu tuyệt kỹ');
  // Và trên thực tế: p.superUlts không nằm trong danh sách bị hai hàm đó quét.
  const p = mkPlayer();
  G.learnSuperUlt(p, 'ulTankSuper');
  const ids = Object.keys(p.skills).filter(id => G.skillLevel(p, id) > 0 && !G.isSuperUlt(id));
  ok(ids.length === 0, 'reset_skills không thấy siêu tuyệt kỹ để hạ cấp');
  ok(G.ownsSuperUlt(p, 'ulTankSuper') === true, 'sở hữu vẫn còn sau khi quét');
}

console.log('\nH. Lưu trữ');
{
  const fs = require('fs');
  const path = require('path');
  const sections = fs.readFileSync(path.join(__dirname, '..', '..', 'storage/sections.js'), 'utf8');
  ok(/superUlts/.test(sections), 'sections.js khai báo superUlts để lưu cùng nhóm skills');
}

console.log('\nI. Tách file: Tuyệt Phẩm là trụ riêng, không nằm trong file kỹ năng/vật phẩm');
{
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..', '..', '..');
  const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');

  // 1. Dữ liệu: mỗi Tuyệt Phẩm một file trong data/super-ults/, KHÔNG còn trong file ult/
  const suDir = 'shared/data/super-ults';
  const suFiles = fs.readdirSync(path.join(root, suDir)).filter(f => f.endsWith('.js') && f !== 'index.js');
  ok(suFiles.length === G.TUYET_PHAM.length, 'mỗi Tuyệt Phẩm một file dữ liệu', `${suFiles.length} file / ${G.TUYET_PHAM.length} chiêu`);
  const suAll = suFiles.map(f => rd(`${suDir}/${f}`)).join('\n');
  for (const id of G.TUYET_PHAM) ok(new RegExp(`\\b${id}:`).test(suAll), `${suDir} định nghĩa ${id}`);
  ok(/G\.SKILL_PARTS/.test(rd(`${suDir}/index.js`)), `${suDir}/index.js gộp vào SKILL_PARTS`);
  for (const f of ['shared/data/skills/ult/ult-dac-biet.js', 'shared/data/skills/ult/ult-tam-xa.js']) {
    const src = rd(f);
    const leaked = G.TUYET_PHAM.filter(id => new RegExp(`\\b${id}:`).test(src));
    ok(leaked.length === 0, `${f} không còn định nghĩa Tuyệt Phẩm`, leaked.join(','));
  }
  ok(!fs.existsSync(path.join(root, 'shared/data/super-ults.js')), 'không còn file flat data/super-ults.js');

  // 2. Logic: luật của trụ nằm ở logic/super-ults/, không định nghĩa lại trong logic/skills.js
  const luDir = 'shared/logic/super-ults';
  const luFiles = fs.readdirSync(path.join(root, luDir)).filter(f => f.endsWith('.js'));
  ok(luFiles.includes('identity.js') && luFiles.includes('ownership.js') && luFiles.includes('costs.js') && luFiles.includes('index.js'),
    'logic/super-ults có đủ identity/ownership/costs/index', luFiles.join(','));
  const luAll = luFiles.map(f => rd(`${luDir}/${f}`)).join('\n');
  for (const fn of ['ownsTuyetPham', 'learnTuyetPham', 'tuyetPhamCosts', 'isTuyetPham']) {
    ok(new RegExp(`function ${fn}\\b|const ${fn} =`).test(luAll), `logic/super-ults/ có ${fn}`);
  }
  ok(/SUPER_ULT_LEVEL: G\.TUYET_PHAM_LEVEL/.test(rd(`${luDir}/index.js`)), 'index.js gắn bí danh tên cũ');
  ok(!fs.existsSync(path.join(root, 'shared/logic/super-ults.js')), 'không còn file flat logic/super-ults.js');
  const skillsLogic = rd('shared/logic/skills.js');
  ok(!/function ownsSuperUlt/.test(skillsLogic), 'logic/skills.js không định nghĩa lại ownsSuperUlt');
  ok(!/function superUltCosts/.test(skillsLogic), 'logic/skills.js không định nghĩa lại superUltCosts');
  ok(/G\.isTuyetPham\(id\)/.test(skillsLogic), 'skillLevel vẫn đọc trụ qua G.isTuyetPham');

  // 3. Kỳ Nguyên: data + logic đều ở thư mục riêng
  const kdDir = 'shared/data/ky-nguyen';
  const kdFiles = fs.readdirSync(path.join(root, kdDir)).filter(f => f.endsWith('.js') && f !== 'index.js');
  ok(kdFiles.length === G.KY_NGUYEN.length, 'mỗi Kỳ Nguyên một file dữ liệu', `${kdFiles.length} file / ${G.KY_NGUYEN.length} cái`);
  const kdAll = kdFiles.map(f => rd(`${kdDir}/${f}`)).join('\n');
  for (const id of G.KY_NGUYEN) ok(kdAll.includes(`'${id}'`), `${kdDir} định nghĩa ${id}`);
  ok(!fs.existsSync(path.join(root, 'shared/data/ky-nguyen.js')), 'không còn file flat data/ky-nguyen.js');
  const knLogic = rd('shared/logic/ky-nguyen/state.js');
  ok(/function kyNguyenActive/.test(knLogic), 'logic/ky-nguyen/state.js có kyNguyenActive');
  ok(!fs.existsSync(path.join(root, 'shared/logic/ky-nguyen.js')), 'không còn file flat logic/ky-nguyen.js');
  const playerLogic = rd('shared/logic/player.js');
  ok(!/function kyNguyenActive/.test(playerLogic), 'logic/player.js không định nghĩa lại kyNguyenActive');
  ok(/G\.kyNguyenActive\(player\)/.test(playerLogic), 'player.js gọi G.kyNguyenActive');

  // 4. Load order: server và client phải nạp mọi file con, đúng thứ tự
  const idx = rd('shared/index.js');
  const html = rd('public/index.html');
  for (const f of suFiles) {
    ok(idx.includes(`require('./data/super-ults/${f.replace(/\.js$/, '')}')`), `server nạp data/super-ults/${f}`);
    ok(html.includes(`/shared/data/super-ults/${f}`), `client nạp data/super-ults/${f}`);
  }
  ok(idx.includes("require('./data/super-ults/index')"), 'server nạp data/super-ults/index');
  ok(html.includes('/shared/data/super-ults/index.js'), 'client nạp data/super-ults/index.js');
  for (const f of kdFiles) {
    ok(idx.includes(`require('./data/ky-nguyen/${f.replace(/\.js$/, '')}')`), `server nạp data/ky-nguyen/${f}`);
    ok(html.includes(`/shared/data/ky-nguyen/${f}`), `client nạp data/ky-nguyen/${f}`);
  }
  ok(idx.includes("require('./data/ky-nguyen/index')"), 'server nạp data/ky-nguyen/index');
  ok(html.includes('/shared/data/ky-nguyen/index.js'), 'client nạp data/ky-nguyen/index.js');
  for (const f of ['identity', 'ownership', 'costs', 'index']) {
    ok(idx.includes(`require('./logic/super-ults/${f}')`), `server nạp logic/super-ults/${f}.js`);
    ok(html.includes(`/shared/logic/super-ults/${f}.js`), `client nạp logic/super-ults/${f}.js`);
  }
  for (const f of ['state', 'index']) {
    ok(idx.includes(`require('./logic/ky-nguyen/${f}')`), `server nạp logic/ky-nguyen/${f}.js`);
    ok(html.includes(`/shared/logic/ky-nguyen/${f}.js`), `client nạp logic/ky-nguyen/${f}.js`);
  }
  // Thứ tự tương đối: data trước skills/index; logic trước skills/player
  ok(idx.indexOf("require('./data/super-ults/sinh-tu')") < idx.indexOf("require('./data/skills/index')"),
    'data/super-ults nạp TRƯỚC skills/index (để gộp vào SKILLS)');
  ok(idx.indexOf("require('./logic/super-ults/identity')") < idx.indexOf("require('./logic/skills')"),
    'logic/super-ults nạp TRƯỚC logic/skills (skillLevel gọi vào)');
  ok(idx.indexOf("require('./logic/ky-nguyen/state')") < idx.indexOf("require('./logic/player')"),
    'logic/ky-nguyen nạp TRƯỚC logic/player');
  ok(html.indexOf('/shared/data/super-ults/sinh-tu.js') < html.indexOf('/shared/data/skills/index.js'),
    'client: data/super-ults trước skills/index');
  ok(html.indexOf('/shared/logic/super-ults/identity.js') < html.indexOf('/shared/logic/skills.js'),
    'client: logic/super-ults trước logic/skills');
  ok(html.indexOf('/shared/logic/ky-nguyen/state.js') < html.indexOf('/shared/logic/player.js'),
    'client: logic/ky-nguyen trước logic/player');

  // 5. Catalog riêng của trụ, không phải lọc G.SKILLS mỗi lần
  ok(Array.isArray(G.TUYET_PHAM) && G.TUYET_PHAM.length === 5, 'G.TUYET_PHAM có 5 id', String(G.TUYET_PHAM));
  ok(G.TUYET_PHAM.every(id => G.SKILLS[id] && G.SKILLS[id].superUlt), 'mọi id trong G.TUYET_PHAM là Tuyệt Phẩm');
  ok(G.TUYET_PHAM.every(id => !/^ulChung|^ulCung|^ulPhap[12]$/.test(id)), 'catalog không lẫn tuyệt kỹ thường');
}

console.log(fails ? `\n✗ ${fails} kiểm tra không đạt.` : '\n✓ Tất cả kiểm tra đạt.');
process.exitCode = fails ? 1 : 0;
