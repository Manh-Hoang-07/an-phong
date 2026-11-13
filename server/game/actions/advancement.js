'use strict';
/*
 * Luật chơi phía server · Thử thách ở NPC ẩn và biến hình (Ấn thức tỉnh).
 *
 * Chức nghiệp 2 KHÔNG còn ở đây. Nó là một class thật: đọc Sách Tiến Hóa Chức Nghiệp là
 * p.school đổi hẳn sang id nhánh (xem actions/items.js và progress.js setSchool).
 * Không còn cơ chế bật/tắt hai hình thái, không còn thanh kỹ năng thứ hai.
 *
 * Ấn thức tỉnh (Biến Hình I / II) thì vẫn là hình thái bật/tắt, và đi theo NGƯỜI chơi:
 * chức nghiệp 1 hay chức nghiệp 2 đều dùng chung hai Ấn.
 */
const G = require('../../../shared');
const { fail } = require('../core/util');
const { giveItem, bagFree, slotsNeeded } = require('../core/inventory');

const MILESTONES = {
  awaken1: { level: 20, item: 'sach_bien_hinh_1', name: 'Biến Hình I', need: 20 },
  evolution: { level: 25, item: 'sach_tien_hoa_chuc_nghiep', name: 'Tiến Hóa Chức Nghiệp', need: 25 },
  awaken2: { level: 45, item: 'sach_bien_hinh_2', name: 'Biến Hình II', need: 45 },
};

function hidden(p) {
  if (p.map !== 'lang' || !p.hiddenNpcActive) fail('Không có hồi đáp. Hãy ở Tân Đô và chat "ncp an".');
}

// Bậc Ấn đang chọn có mở khóa chưa
const awakenOk = (p, choice) => (p.awakenTier || 0) >= (choice === 'awaken2' ? 2 : 1);

module.exports = {
  hidden_chat(p, a, ev) {
    const phrase = String(a.text || '').trim().toLowerCase();
    if (p.map !== 'lang' || !['ncp an', 'npc an'].includes(phrase)) fail('Không có hồi đáp. Hãy nhập "npc an" hoặc "ncp an" khi đang ở Tân Đô.');
    p.hiddenNpcActive = true;
    ev.push({ t: 'msg', text: 'Một bóng người hiện ra trong con hẻm. Không cần đứng ở vị trí cụ thể; hãy đến gần người đó để tương tác.', color: '#c6a7ff' });
  },

  advancement_accept(p, a, ev) {
    hidden(p);
    const ms = MILESTONES[a.milestone];
    if (!ms || !p.school) fail('Bạn cần chọn class trước.');
    if (a.milestone === 'evolution' && G.isEvolved(p.school)) fail('Bạn đã ở chức nghiệp 2 rồi.');
    if (p.level < ms.level) fail(`Cần đạt cấp ${ms.level} mới nhận được thử thách này.`);
    if (p.advancement.done[a.milestone]) fail('Thử thách này đã hoàn thành rồi.');
    if (p.advancement.quest) fail('Hãy hoàn thành thử thách đang nhận trước.');
    p.advancement.quest = { id: a.milestone, progress: 0, need: ms.need };
    ev.push({ t: 'msg', text: `${ms.name}: hạ ${ms.need} quái bất kỳ rồi quay lại đây.`, color: '#c6a7ff' });
  },

  advancement_complete(p, a, ev) {
    hidden(p);
    const q = p.advancement.quest, ms = q && MILESTONES[q.id];
    if (!q || !ms) fail('Bạn chưa nhận thử thách.');
    if (q.progress < q.need) fail(`Thử thách còn thiếu ${q.need - q.progress} quái.`);
    if (bagFree(p) < slotsNeeded(p, ms.item, 1)) fail('Túi đồ đã đầy; hãy dọn chỗ trước khi nhận sách.');
    giveItem(p, ms.item, 1, ev);
    p.advancement.done[q.id] = true;
    p.advancement.quest = null;
    ev.push({ t: 'msg', text: `Hoàn thành thử thách. Nhận ${G.ITEMS[ms.item].name}; hãy mở Túi đồ để sử dụng.`, color: '#ffd54f' });
  },

  // Chọn Ấn I hay Ấn II (chỉ đổi được khi đang ở dạng thường)
  form_select(p, a, ev) {
    const choice = a.choice;
    if (!['awaken1', 'awaken2'].includes(choice)) fail('Hình thái không hợp lệ.');
    if (!awakenOk(p, choice)) fail('Ấn này chưa được mở khóa.');
    const old = G.calcStats(p, { form: !!p.formActive });
    const hr = p.hp / old.maxHp, mr = p.mp / old.maxMp;
    p.formChoice = choice;
    p.formActive = false;
    const st = G.calcStats(p, { form: false });
    p.hp = Math.max(1, Math.round(st.maxHp * hr));
    p.mp = Math.round(st.maxMp * mr);
    ev.push({ t: 'form', active: false, choice });
  },

  // Bật / tắt Ấn thức tỉnh đang chọn
  form_toggle(p, a, ev) {
    const c = p.formChoice === 'awaken2' ? 'awaken2' : 'awaken1';
    if (!awakenOk(p, c)) fail('Ấn này chưa được mở khóa.');
    const old = G.calcStats(p, { form: !!p.formActive });
    const hr = p.hp / old.maxHp, mr = p.mp / old.maxMp;
    p.formActive = !p.formActive;
    const st = G.calcStats(p, { form: p.formActive });
    p.hp = Math.max(1, Math.round(st.maxHp * hr));
    p.mp = Math.round(st.maxMp * mr);
    ev.push({ t: 'form', active: p.formActive, choice: c });
  },
};
