'use strict';
/*
 * Kiểm tra: luật sách kỹ năng và thưởng nhiệm vụ.
 *
 * Ba luật được khoá ở đây:
 *   1. Mỗi nhân vật đọc TỐI ĐA 7 cuốn sách kỹ năng = +7 điểm.
 *   2. Nhiệm vụ NGÀY không còn thưởng sách kỹ năng.
 *   3. Nhiệm vụ TUẦN cho ĐÚNG 1 cuốn sách kỹ năng, và chỉ ở một mốc (không cộng dồn 2 mốc).
 *
 * Chạy: node server/tools/check/check-skill-books.js
 */
const G = require('../../../shared');
const fs = require('fs');
const path = require('path');

let fails = 0;
const ok = (cond, label, extra = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) fails++;
};

console.log('1. Trần sách kỹ năng mỗi nhân vật');
ok(G.SKILL_BOOK_MAX === 7, 'SKILL_BOOK_MAX = 7', String(G.SKILL_BOOK_MAX));
ok(G.ITEMS.sach_ky_nang && G.ITEMS.sach_ky_nang.kind === 'book', 'sach_ky_nang là sách điểm kỹ năng');
ok(/7 cuốn/.test(G.ITEMS.sach_ky_nang.desc || ''), 'mô tả sách nói rõ trần 7 cuốn', G.ITEMS.sach_ky_nang.desc);

console.log('\n2. Nhiệm vụ ngày không còn sách kỹ năng');
const dailyBook = (G.DAILY_BONUS.items || []).filter(([id]) => id === 'sach_ky_nang');
ok(dailyBook.length === 0, 'DAILY_BONUS không có sach_ky_nang', JSON.stringify(G.DAILY_BONUS.items));

console.log('\n3. Nhiệm vụ tuần cho đúng 1 cuốn');
ok(G.WEEKLY_BOOKS === 1, 'WEEKLY_BOOKS = 1', String(G.WEEKLY_BOOKS));
for (const lv of [10, 30, 50]) {
  for (const map of ['lang', 'tan_do_1']) {
    const r = G.weeklyReward(lv, map);
    const k = (r.kills.items || []).filter(([id]) => id === 'sach_ky_nang').reduce((s, [, n]) => s + n, 0);
    const b = (r.bosses.items || []).filter(([id]) => id === 'sach_ky_nang').reduce((s, [, n]) => s + n, 0);
    ok(k === 0 && b === 1, `cấp ${lv} @${map}: mốc diệt quái 0 cuốn, mốc trùm 1 cuốn`, `kills=${k} bosses=${b}`);
  }
}

console.log('\n4. Không còn chỗ nào phát sách kỹ năng ngoài nhiệm vụ tuần');
const root = path.join(__dirname, '..', '..', '..');
const scan = [
  'server/game/actions/quests.js',
  'server/game/core/periodic.js',
  'shared/data/quests/periodic.js',
  'shared/logic/quests.js',
];
for (const rel of scan) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const hits = src.split('\n')
    .map((line, i) => ({ line, i: i + 1 }))
    .filter(({ line }) => /sach_ky_nang/.test(line) && !/^\s*(\/\/|\*)/.test(line));
  const inWeekly = hits.every(({ line }) => /weekly|WEEKLY|bosses/i.test(line));
  ok(hits.length === 0 || inWeekly, `${rel}: mọi chỗ phát sách đều thuộc nhiệm vụ tuần`,
    hits.map(h => `dòng ${h.i}`).join(', ') || 'không có');
}

console.log('\n5. Trường đếm sách được lưu');
const sections = fs.readFileSync(path.join(root, 'server/storage/sections.js'), 'utf8');
ok(/skillBooks/.test(sections), 'sections.js khai báo skillBooks để lưu cùng nhóm skills');

console.log(fails ? `\n✗ ${fails} kiểm tra không đạt.` : '\n✓ Tất cả kiểm tra đạt.');
process.exitCode = fails ? 1 : 0;
