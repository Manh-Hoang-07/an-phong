'use strict';
/* Kiểm chứng Kỳ Nguyên: dữ liệu, chỉ số, hiệu ứng, quầy, mua, bật/tắt, migrate save cũ. */
const G = require('../../../shared');
const items = require('../../game/actions/items');
const { migrate } = require('../../game/index');
let pass = 0, fail = 0;
const ok = (c, m, extra) => { if (c) { pass++; console.log('  \u2713 ' + m); } else { fail++; console.log('  \u2717 ' + m + (extra !== undefined ? ' \u2014 ' + extra : '')); } };

console.log('1. Dữ liệu');
ok((G.KY_NGUYEN || []).length === 5, 'đúng 5 Kỳ Nguyên', (G.KY_NGUYEN || []).length);
ok(JSON.stringify((G.KY_NGUYEN || []).map(id => G.ITEMS[id].level)) === '[10,30,50,70,90]', 'cấp 10/30/50/70/90', (G.KY_NGUYEN || []).map(id => G.ITEMS[id].level).join(','));
ok(!G.SLOTS.some(s => ['bua', 'an', 'canh', 'linh_dan', 'chuong'].includes(s)), 'SLOTS không còn 5 ô đặc biệt', G.SLOTS.length);
ok(!G.ITEMS.huyen_tinh_thach, 'đã xóa Huyền Tinh Thạch khỏi ITEMS');
ok(!G.SPECIAL_SLOTS && !G.SPECIAL_TIER_MAX, 'đã xóa hằng số bậc đặc biệt');
for (const id of G.KY_NGUYEN) ok(G.ITEMS[id].kyNguyen && !G.ITEMS[id].slot && G.ITEMS[id].fx && G.ITEMS[id].fxText, id + ' có cờ/hiệu ứng, không có slot');

console.log('2. Quầy Lầu Trân Bảo');
const p = G.newPlayer('t');
p.level = 90; p.map = 'lang'; p.linhNgoc = 5000;
const shop = G.ngocShopItems(p, 'tran_bao');
for (const id of G.KY_NGUYEN) ok(shop.includes(id), 'quầy bán ' + id);
const grp = G.ngocShopGroups(p, 'tran_bao');
ok(grp.some(g => g.key === 'ky_nguyen' && g.ids.length === 5), 'nhóm Kỳ Nguyên có 5 món', JSON.stringify(grp.map(g => [g.key, g.ids.length])));

console.log('3. Mua / chặn mua trùng / chặn thiếu cấp');
const buy = (pl, id) => { const ev = []; try { items.buy_ngoc(pl, { npc: 'tran_bao', item: id }, ev); return { ok: true, ev }; } catch (e) { return { ok: false, err: e.message || String(e) }; } };
const toggle = (pl, id) => { const ev = []; try { items.toggle_ky_nguyen(pl, { id }, ev); return { ok: true, ev }; } catch (e) { return { ok: false, err: e.message || String(e) }; } };

const low = G.newPlayer('low'); low.map = 'lang'; low.linhNgoc = 5000;
const lowBuy = buy(low, 'kn_bat_tu');
ok(!lowBuy.ok, 'cấp 1 mua Bất Tử bị chặn', lowBuy.err);
ok(low.linhNgoc === 5000, 'thiếu cấp: không trừ Linh Ngọc', low.linhNgoc);
ok(!low.bag.length, 'thiếu cấp: không nhét gì vào túi');

const before = p.linhNgoc;
const b1 = buy(p, 'kn_bat_tu');
ok(b1.ok, 'cấp 90 mua được Bất Tử', b1.err);
ok(p.linhNgoc === before - G.ITEMS.kn_bat_tu.priceNgoc, 'trừ đúng Linh Ngọc', before + ' -> ' + p.linhNgoc);
ok(p.kyNguyen.owned.includes('kn_bat_tu') && p.kyNguyen.active.includes('kn_bat_tu'), 'mua xong: sở hữu + tự bật');
ok(p.bag.length === 0, 'Kỳ Nguyên KHÔNG vào túi', p.bag.length);
const dup = buy(p, 'kn_bat_tu');
ok(!dup.ok, 'mua trùng bị chặn', dup.err);
ok(p.linhNgoc === before - G.ITEMS.kn_bat_tu.priceNgoc, 'mua trùng không trừ ngọc');

console.log('4. Bật / tháo đổi chỉ số thật');
const st0 = G.calcStats(p);
ok(st0.maxHp > 0, 'calcStats chạy được', st0.maxHp);
const hpOn = st0.maxHp, defOn = st0.def;
const off = toggle(p, 'kn_bat_tu');
ok(off.ok && !p.kyNguyen.active.includes('kn_bat_tu'), 'tháo được', off.err);
const st1 = G.calcStats(p);
ok(st1.maxHp === hpOn - 120, 'tháo: mất đúng 120 máu', hpOn + ' -> ' + st1.maxHp);
ok(st1.def === defOn - 8, 'tháo: mất đúng 8 phòng thủ', defOn + ' -> ' + st1.def);
ok(p.kyNguyen.owned.includes('kn_bat_tu'), 'tháo KHÔNG mất quyền sở hữu');
const on = toggle(p, 'kn_bat_tu');
ok(on.ok && p.kyNguyen.active.includes('kn_bat_tu'), 'bật lại được', on.err);
const st2 = G.calcStats(p);
ok(st2.maxHp === hpOn && st2.def === defOn, 'bật lại: chỉ số về đúng', st2.maxHp + '/' + st2.def);
const notOwned = toggle(p, 'kn_tran_hon');
ok(!notOwned.ok, 'bật cái chưa mua bị chặn', notOwned.err);

console.log('5. Hiệu ứng đặc biệt (specialFx)');
ok(G.specialFx(p).undying && G.specialFx(p).undying.cd === 60, 'Bất Tử đang bật -> có undying cd 60');
toggle(p, 'kn_bat_tu');
ok(!G.specialFx(p).undying, 'tháo Bất Tử -> mất undying');
toggle(p, 'kn_bat_tu');

const p2 = G.newPlayer('t2'); p2.level = 90; p2.map = 'lang'; p2.linhNgoc = 5000;
const mulBefore = G.calcStats(p2).skillMul;
buy(p2, 'kn_tu_linh');
const mulAfter = G.calcStats(p2).skillMul;
ok(Math.abs(mulAfter / mulBefore - 1.14) < 1e-6, 'Tụ Linh: skillMul ×1.14', mulBefore.toFixed(4) + ' -> ' + mulAfter.toFixed(4));
ok(G.specialFx(p2).skillPower && Math.abs(G.specialFx(p2).skillPower.mul - 0.14) < 1e-9, 'Tụ Linh: skillPower 0.14');

const p3 = G.newPlayer('t3'); p3.level = 90; p3.map = 'lang'; p3.linhNgoc = 5000;
const srBefore = G.calcStats(p3).staRegen;
buy(p3, 'kn_phiu_dieu');
const srAfter = G.calcStats(p3).staRegen;
ok(srAfter === srBefore + 35, 'Phiêu Diêu: +35 hồi thể lực', srBefore + ' -> ' + srAfter);
ok(G.specialFx(p3).dodge && G.specialFx(p3).dodge.chance === 0.10, 'Phiêu Diêu: dodge 10%');

const p4 = G.newPlayer('t4'); p4.level = 90; p4.map = 'lang'; p4.linhNgoc = 5000;
buy(p4, 'kn_sat_kiep'); buy(p4, 'kn_tran_hon');
ok(G.specialFx(p4).everyNth && G.specialFx(p4).everyNth.n === 5 && G.specialFx(p4).everyNth.mult === 1.35, 'Sát Kiếp: đòn 5 ×1.35');
ok(G.specialFx(p4).onKill && G.specialFx(p4).onKill.hp === 0.04, 'Trấn Hồn: hồi 4% khi hạ quái');
ok(p4.kyNguyen.active.length === 2, 'bật nhiều cái cùng lúc được', p4.kyNguyen.active.join(','));

console.log('6. Migrate save cũ');
const old = G.newPlayer('old');
old.level = 60; old.map = 'lang';
old.equip.bua = { uid: 1, id: 'bua_db_1', qty: 1, plus: 0 };
old.equip.chuong = { uid: 2, id: 'chuong_db_5', qty: 1, plus: 0 };
old.bag = [{ uid: 3, id: 'an_db_2', qty: 1, plus: 0 }, { uid: 4, id: 'huyen_tinh_thach', qty: 7, plus: 0 }, { uid: 5, id: 'binh_mau_nho', qty: 3, plus: 0 }];
old.storageByMap = { lang: [{ uid: 6, id: 'canh_db_3', qty: 1, plus: 0 }] };
old.loot = [{ x: 1, y: 1, inst: { uid: 7, id: 'linh_dan_db_4', qty: 1, plus: 0 } }];
migrate(old);
const expect = ['kn_bat_tu', 'kn_sat_kiep', 'kn_phiu_dieu', 'kn_tu_linh', 'kn_tran_hon'];
ok(expect.every(id => old.kyNguyen.owned.includes(id)), 'migrate: đủ 5 quyền (kể cả cấp chưa đủ)', old.kyNguyen.owned.join(','));
ok(expect.every(id => old.kyNguyen.active.includes(id)), 'migrate: tự bật cả 5');
ok(!Object.keys(old.equip).some(k => ['bua', 'an', 'canh', 'linh_dan', 'chuong'].includes(k)), 'migrate: xóa 5 ô cũ');
ok(!old.bag.some(e => e.id === 'huyen_tinh_thach'), 'migrate: xóa Huyền Tinh Thạch');
ok(old.bag.some(e => e.id === 'binh_mau_nho'), 'migrate: giữ lại đồ thường');
ok(!(old.loot || []).length && !(old.storageByMap.lang || []).length, 'migrate: dọn sạch đồ cũ trong kho/đất');
ok(Object.keys(G.specialFx(old)).length === 5, 'migrate: cả 5 hiệu ứng chạy', Object.keys(G.specialFx(old)).join(','));

console.log('\n' + (fail ? '\u2717 ' + fail + ' hỏng, ' + pass + ' đạt' : '\u2713 Tất cả đạt: ' + pass + ' đạt, 0 hỏng'));
process.exit(fail ? 1 : 0);
