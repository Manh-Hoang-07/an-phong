'use strict';
/* Luật chơi phía server · Trang bị cho thú (linh thú của Triệu Hồi Sư và thú đồng hành): yên, dây cương, giáp thú, vòng cổ. */
const G = require('../../../shared');
const { fail } = require('../core/util');
const { bagFree, addItem, removeItem, countItem } = require('../core/inventory');

// Thú hợp lệ để mặc đồ: linh thú (khi đã học Triệu Hồi Linh Thú) hoặc thú đồng hành đã sở hữu
function ownedPet(p, id) {
  if (G.SUMMONS[id]) {
    if (!G.skillLevel(p, 'th5')) fail('Bạn chưa học kỹ năng Triệu Hồi Linh Thú.');
    return G.SUMMONS[id];
  }
  if (G.MOUNTS[id]) {
    if (!p.mounts.owned.includes(id)) fail('Bạn chưa có thú này.');
    return G.MOUNTS[id];
  }
  fail('Không có thú này.');
}

// Sau khi đổi trang bị, máu / MP / thể lực hiện có không được vượt mức tối đa mới
function clampPetState(p, id) {
  const st = G.SUMMONS[id] ? G.summonUnitStats(p, id) : G.companionStats(p, id);
  const state = G.SUMMONS[id] ? (p.summons.states[id] = p.summons.states[id] || {}) : (p.pets[id] = p.pets[id] || {});
  for (const [k, max] of [['hp', st.maxHp], ['mp', st.maxMp], ['sta', st.maxSta]]) {
    state[k] = Number.isFinite(state[k]) ? Math.max(0, Math.min(max, Math.round(state[k]))) : max;
  }
}

const actions = {
  // Mặc một món trang bị thú từ túi (món đang mặc ở ô đó được trả về túi)
  pet_equip(p, a, ev) {
    const pet = ownedPet(p, a.pet);
    const def = G.ITEMS[a.item];
    if (!def || def.kind !== 'pet_gear') fail('Đây không phải trang bị cho thú.');
    if (countItem(p, a.item) < 1) fail('Bạn không có vật phẩm này.');
    const lv = G.petLevelFor(p, a.pet);
    if (lv < def.refLv) fail(`${pet.name} cần đạt cấp ${def.refLv} để dùng ${def.name}.`);
    p.petGear = p.petGear || {};
    const gear = p.petGear[a.pet] = p.petGear[a.pet] || {};
    const old = gear[def.petSlot];
    if (old === a.item) fail('Thú đang mặc món này rồi.');
    // Trả món cũ về túi: món mới vừa lấy ra nên túi luôn đủ chỗ nếu cùng loại xếp chồng
    removeItem(p, a.item, 1);
    if (old && !addItem(p, old, 1)) { addItem(p, a.item, 1); fail('Túi đã đầy, không cất được món cũ.'); }
    gear[def.petSlot] = a.item;
    clampPetState(p, a.pet);
    ev.push({ t: 'msg', text: `${pet.name} đã mặc ${def.name}.`, color: '#8be9ff' });
  },

  // Tháo trang bị thú về túi
  pet_unequip(p, a, ev) {
    const pet = ownedPet(p, a.pet);
    if (!G.PET_GEAR_SLOTS[a.slot]) fail('Ô trang bị không hợp lệ.');
    const gear = p.petGear && p.petGear[a.pet];
    const id = gear && gear[a.slot];
    if (!id) fail('Ô này đang trống.');
    if (!addItem(p, id, 1)) fail('Túi đã đầy.');
    gear[a.slot] = null;
    clampPetState(p, a.pet);
    ev.push({ t: 'msg', text: `Đã tháo ${G.ITEMS[id].name} khỏi ${pet.name}.`, color: '#bdbdbd' });
  },
};

module.exports = actions;
