'use strict';
/* UI · Xử lý bấm nút trong các bảng (data-act). */
(() => {
  const { G, $, openPanel, closePanel, renderPanel, act, hideTip, openNpc, S } = UI._;

  // ------------------------------------------------------------ Bấm nút
  async function onClick(e) {
    const selEl = e.target.closest('[data-sel]');
    const el = e.target.closest('[data-act]');
    if (selEl && !el) {
      const [where, key] = selEl.dataset.sel.split(':');
      S.selected = { where, key };
      renderPanel();
      return;
    }
    if (!el || el.disabled) return;
    const a = el.dataset.act, ds = el.dataset;
    Sound.play('click');
    switch (a) {
      case 'close': closePanel(); break;
      case 'open':
        if (ds.panel === 'npc_lu') { openNpc('lu_khach'); break; }
        openPanel(ds.panel, { npc: ds.npc, force: true });
        if (ds.panel === 'code') S.codeMsg = '';
        if (ds.panel === 'code') setTimeout(() => { const i = $('code-input'); if (i) i.focus(); }, 50);
        break;
      case 'tab': openPanel(ds.tab, { force: true }); break;
      case 'daily_claim': await act('daily_claim', { i: Number(ds.i) }); break;
      case 'daily_bonus': await act('daily_bonus'); break;
      case 'weekly_claim': await act('weekly_claim', { kind: ds.kind }); renderPanel(); break;
      case 'toggle_sfx': Sound.setSfx(!Sound.settings.sfx); renderPanel(); break;
      case 'toggle_music': Sound.setMusic(!Sound.settings.music); renderPanel(); break;
      case 'toggle_quality': {
        const next = { auto: 'high', high: 'low', low: 'auto' }[Quality.mode];
        Quality.set(next);
        if (Quality.low && App.scene) App.scene.applyLowQuality();
        else UI.log('Đồ họa cao sẽ áp dụng khi bạn chuyển bản đồ.', '#bdbdbd');
        renderPanel();
        break;
      }
      case 'learn_skill': await act('learn_skill', { skill: ds.skill }); break;
      case 'clear_slot': await act('set_skill', { slot: Number(ds.slot), skill: null }); break;
      case 'reset_skills': await act('reset_skills'); renderPanel(); break;
      case 'redeem': {
        const inp = $('code-input');
        const code = inp ? inp.value.trim() : '';
        if (!code) break;
        S.codeDraft = code; S.codeMsg = '';
        const r = await act('redeem', { code });
        if (r.ok) { S.codeDraft = ''; openNpc('lu_khach'); }
        else { S.codeMsg = r.error || 'Mật mã không đúng.'; renderPanel(); }
        break;
      }
      case 'awaken_pick': openPanel('code', { confirm: ds.school, force: true }); break;
      case 'awaken_special': {
        const r = await act('awaken_special', { school: ds.school });
        if (r.ok) { App.hp = App.player.hp; App.mp = App.player.mp; openPanel('skills', { force: true }); UI.banner('THỨC TỈNH · ' + G.SCHOOLS[ds.school].name, 2200); }
        break;
      }
      // Xác nhận thức tỉnh biến hình (ấn 1/2)
      case 'awaken_confirm': {
        const aw = G.nextAwaken(App.player);
        if (!aw) break;
        openPanel('story', { id: aw.npc, lines: aw.start,
          button: `<button class="btn primary" data-act="awaken_next" data-tier="${aw.tier}">⚡ Xác nhận thức tỉnh</button><button class="btn" data-act="close">Để sau</button>`,
          force: true });
        break;
      }
      case 'awaken_next': {
        const r = await act('awaken_next', {});
        if (r.ok) {
          const aw = GameData.awakenOf(App.player);
          if (aw) openPanel('story', { id: aw.npc, lines: aw.end, button: '<button class="btn primary" data-act="close">Tiếp tục</button>', force: true });
        }
        break;
      }
      case 'logout': if (App.logout) App.logout(); break;
      case 'fullscreen': if (App.fullscreen) App.fullscreen(); break;
      case 'equip': await act('equip', { uid: Number(ds.uid) }); S.selected = null; renderPanel(); break;
      case 'unequip': await act('unequip', { slot: ds.slot }); S.selected = null; renderPanel(); break;
      case 'use': App.scene.usePotion(ds.item === 'thuoc_nhiem_do' || ds.item.startsWith('binh_mau') ? 'hp' : 'mp', ds.item); break;
      case 'sell': await act('sell', { uid: Number(ds.uid), qty: Number(ds.qty) }); break;
      case 'buy': await act('buy', { npc: ds.npc, item: ds.item, qty: Number(ds.qty) }); break;
      case 'add_stat': await act('add_stat', { stat: ds.stat, n: Number(ds.n) }); break;
      case 'set_skill': await act('set_skill', { slot: Number(ds.slot), skill: ds.skill }); break;
      case 'store': await act('store', { uid: Number(ds.uid) }); hideTip(); break;
      case 'retrieve': await act('retrieve', { uid: Number(ds.uid) }); hideTip(); break;
      case 'upgrade': {
        const s = S.selected;
        await act('upgrade', s.where === 'equip' ? { slot: s.key } : { uid: Number(s.key) });
        renderPanel();
        break;
      }
      case 'smith_tab': S.smithTab = ds.tab; S.confirmSalvage = null; S.selected = null; renderPanel(); break;
      case 'reforge': {
        const s = S.selected;
        await act('reforge', s.where === 'equip' ? { slot: s.key } : { uid: Number(s.key) });
        renderPanel();
        break;
      }
      case 'salvage': {
        const uid = Number(ds.uid);
        if (S.confirmSalvage !== uid) { S.confirmSalvage = uid; renderPanel(); break; }
        S.confirmSalvage = null;
        const r = await act('salvage', { uid });
        if (r.ok) S.selected = null;
        renderPanel();
        break;
      }
      case 'quest_view': {
        const q = G.QUESTS[App.player.quest.step];
        openPanel('story', { id: q.npc, lines: q.start, button: '<button class="btn primary" data-act="quest_accept">Nhận nhiệm vụ</button>', force: true });
        break;
      }
      case 'quest_accept': {
        const q = G.QUESTS[App.player.quest.step];
        const r = await act('quest_accept');
        if (!r.ok) break;
        if (!Object.keys(q.obj).length) { await completeQuest(q); break; }
        closePanel();
        break;
      }
      case 'quest_complete': await completeQuest(G.QUESTS[App.player.quest.step]); break;
      case 'side_view': {
        const sq = G.sideById(ds.id);
        if (!sq) break;
        openPanel('story', { id: sq.npc, lines: sq.start, button: `<button class="btn primary" data-act="side_accept" data-id="${sq.id}">Nhận phụ tuyến</button>`, force: true });
        break;
      }
      case 'side_accept': {
        const sq = G.sideById(ds.id);
        const r = await act('side_accept', { id: ds.id });
        if (r.ok && sq) closePanel();
        break;
      }
      case 'side_complete': {
        const sq = G.sideById(ds.id);
        const r = await act('side_complete', { id: ds.id });
        if (r.ok && sq) {
          Sound.play('quest');
          openPanel('story', { id: sq.npc, lines: sq.end, button: '<button class="btn primary" data-act="close">Đã hiểu</button>', force: true });
        }
        break;
      }
      case 'school_pick': openPanel('school', { confirm: ds.school, force: true }); break;
      case 'choose_school': {
        const r = await act('choose_school', { school: ds.school });
        if (r.ok) { App.hp = App.player.hp; App.mp = App.player.mp; openNpc('lao_su'); UI.banner('THỨC TỈNH · ' + G.SCHOOLS[ds.school].name, 2200); }
        break;
      }
    }
  }

  async function completeQuest(q) {
    const r = await act('quest_complete');
    if (r.ok) Sound.play('quest');
    if (r.ok) openPanel('story', { id: q.npc, lines: q.end, button: '<button class="btn primary" data-act="close">Đã hiểu</button>', force: true });
  }

  Object.assign(UI._, { onClick, completeQuest });
})();
