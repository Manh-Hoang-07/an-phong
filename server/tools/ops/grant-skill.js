'use strict';
/*
 * Gắn một kỹ năng vào nhân vật để thử nghiệm (bỏ qua điều kiện cấp / sách / ô học).
 *
 *   node server/tools/ops/grant-skill.js <tên đăng nhập> <id kỹ năng> [cấp]
 *   node server/tools/ops/grant-skill.js <tên đăng nhập> --list
 *
 * Ví dụ:
 *   node server/tools/ops/grant-skill.js test01 ulSinhTu
 *   node server/tools/ops/grant-skill.js test01 ulSinhTu 10
 *
 * Việc nó làm:
 *   1. Học kỹ năng ở cấp chỉ định (mặc định 1) — ghi p.skills[id].
 *   2. Gắn vào ô trống đầu tiên của đúng loại (tuyệt kỹ → ô R/X/Z, thường → ô 1–4).
 *      Không còn ô trống thì ghi đè ô CUỐI của loại đó.
 *   3. Nếu cần thử kèm Kỳ Nguyên (vd Bất Tử), dùng --ky-nguyen <id> để mở + bật luôn.
 *
 * KHÔNG kiểm tra cấp nhân vật, không kiểm tra ô học, không trừ điểm kỹ năng.
 * Đây là công cụ test — đừng chạy trên tài khoản thật.
 *
 * PHẢI TẮT SERVER TRƯỚC khi chạy: nếu không, bản nhân vật trong bộ nhớ server sẽ ghi đè
 * lên thay đổi này ở lần lưu kế tiếp.
 */
const store = require('../../storage/db');
const G = require('../../../shared');

function usage() {
  console.log('Cách dùng:');
  console.log('  node server/tools/ops/grant-skill.js <tên đăng nhập> <id kỹ năng> [cấp] [--ky-nguyen <id>]');
  console.log('  node server/tools/ops/grant-skill.js <tên đăng nhập> --list        liệt kê kỹ năng đang có');
  console.log('');
  console.log('Ví dụ:');
  console.log('  node server/tools/ops/grant-skill.js test01 ulSinhTu');
  console.log('  node server/tools/ops/grant-skill.js test01 ulSinhTu 10 --ky-nguyen kn_bat_tu');
  console.log('  node server/tools/ops/grant-skill.js test01 ulTuLinhDungHop 10   (chỉ Tử Linh Thuật Sư)');
  console.log('');
  console.log('Tắt server trước khi chạy, nếu không thay đổi sẽ bị ghi đè.');
}

(async () => {
  const argv = process.argv.slice(2);
  const name = argv[0];
  if (!name) { usage(); process.exit(0); }

  await store.init();
  const u = await store.userByName(name);
  if (!u) { console.error('Không có tài khoản:', name); await store.close(); process.exit(1); }

  const p = await store.loadPlayer(u.id);
  if (!p) { console.error('Tài khoản', name, 'chưa có nhân vật.'); await store.close(); process.exit(1); }

  // --list: xem đang có gì
  if (argv.includes('--list')) {
    console.log(`Nhân vật: ${p.name} · cấp ${p.level} · class ${p.school || '(chưa)'}`);
    console.log('Kỹ năng đã học:');
    const ids = Object.keys(p.skills || {}).filter(id => p.skills[id] > 0);
    if (!ids.length) console.log('  (chưa học kỹ năng nào)');
    for (const id of ids) {
      const sk = G.SKILLS[id];
      if (!sk) { console.log(`  ${id} — KHÔNG CÒN TRONG DỮ LIỆU`); continue; }
      const slot = (p.skillSlots || []).indexOf(id);
      console.log(`  ${sk.ult ? '★' : '·'} ${id.padEnd(22)} cấp ${String(p.skills[id]).padEnd(3)} ${sk.name}${slot >= 0 ? ` — gắn ô ${G.isUltSlot(slot) ? G.ultKeyLabel(slot) : slot + 1}` : ''}`);
    }
    console.log('Kỳ Nguyên đã mở / đang bật:');
    const kn = p.kyNguyen || { owned: [], active: [] };
    if (!kn.owned || !kn.owned.length) console.log('  (chưa mở Kỳ Nguyên nào)');
    for (const id of kn.owned || []) {
      const on = (kn.active || []).includes(id);
      console.log(`  ${on ? '●' : '○'} ${id}: ${G.ITEMS[id]?.name || id}${on ? ' (đang bật)' : ' (đang tháo)'}`);
    }
    await store.close();
    return;
  }

  const id = argv[1];
  if (!id) { usage(); await store.close(); process.exit(1); }
  const sk = G.SKILLS[id];
  if (!sk) { console.error('Không có kỹ năng:', id); await store.close(); process.exit(1); }

  const lvArg = argv[2] && !argv[2].startsWith('--') ? Number(argv[2]) : 1;
  const lv = Math.max(1, Math.min(G.SKILL_MAX, Number.isFinite(lvArg) ? lvArg : 1));

  // --ky-nguyen <id>: mở + bật luôn một Kỳ Nguyên (để thử combo, vd Bất Tử)
  const knIdx = argv.indexOf('--ky-nguyen');
  const knId = knIdx >= 0 ? argv[knIdx + 1] : null;
  if (knId && !(G.ITEMS[knId] && G.ITEMS[knId].kyNguyen)) { console.error('Không có Kỳ Nguyên:', knId); await store.close(); process.exit(1); }

  if (!p.skills || typeof p.skills !== 'object') p.skills = {};
  const had = p.skills[id] || 0;
  p.skills[id] = lv;

  // Gắn vào thanh: ô trống đầu tiên của đúng loại, không có thì ghi đè ô cuối
  if (!Array.isArray(p.skillSlots)) p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
  while (p.skillSlots.length < G.SKILL_SLOTS) p.skillSlots.push(null);
  const slots = sk.ult ? G.ultSlotsOf(p) : G.normalSlotsOf(p);
  let slot = slots.find(i => !p.skillSlots[i]);
  if (slot === undefined) slot = slots[slots.length - 1];
  const replaced = p.skillSlots[slot];
  p.skillSlots[slot] = id;

  if (knId) {
    if (!p.kyNguyen || typeof p.kyNguyen !== 'object') p.kyNguyen = { owned: [], active: [] };
    if (!Array.isArray(p.kyNguyen.owned)) p.kyNguyen.owned = [];
    if (!Array.isArray(p.kyNguyen.active)) p.kyNguyen.active = [];
    if (!p.kyNguyen.owned.includes(knId)) p.kyNguyen.owned.push(knId);
    if (!p.kyNguyen.active.includes(knId)) p.kyNguyen.active.push(knId);
  }

  await store.savePlayerFull(u.id, p, 'grant_skill');
  await store.logAuth({ userId: u.id, username: u.username, event: 'grant_skill', detail: `${id} cấp ${lv}${knId ? ' + ' + knId : ''}` });

  console.log(`Nhân vật: ${p.name} (cấp ${p.level}, class ${p.school || 'chưa thức tỉnh'})`);
  console.log(`  Học:      ${sk.name} (${id}) cấp ${lv}${had ? ` — trước đó cấp ${had}` : ''}`);
  console.log(`  Gắn vào:  ô ${G.isUltSlot(slot) ? G.ultKeyLabel(slot) : slot + 1}${replaced ? ` (thay ${G.SKILLS[replaced]?.name || replaced})` : ''}`);
  if (knId) console.log(`  Kỳ Nguyên: ${G.ITEMS[knId].name} — đã mở và đang bật`);
  if (sk.level > p.level) console.log(`  ⚠ Kỹ năng cần cấp ${sk.level}, nhân vật mới cấp ${p.level} — dùng được để test nhưng người chơi thật sẽ không học được.`);
  if (!p.school) console.log('  ⚠ Nhân vật chưa thức tỉnh class: không dùng được kỹ năng nào cho tới khi có class.');

  await store.close();
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
