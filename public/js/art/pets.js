'use strict';
/* Sprite sheets thú đồng hành / linh thú: sói (Free Sprites), thằn lằn lửa hai đầu, cáo chín đuôi (Fox), linh trùng (Insect),
   hạc rmazanek (CC0), ngựa alizard (CC0), hắc long và dơi lấy từ sprite quái dragon / ff_bat. Xem public/assets/CREDITS.txt. */
const PetSprites = (() => {
  const DEF = {
    // scale: tỉ lệ vẽ trong game · hd: hình vẽ tay (lọc mượt) · lift: bay lơ lửng cao hơn mặt đất (px) · rate: khung/giây theo hoạt ảnh
    wolf: { fw: 174, fh: 98, frames: { run: 3, walk: 4, attack: 5 }, baseLeft: true, scale: 0.75, hd: true },
    horse: { fw: 82, frames: { run: 7, walk: 7 }, fh: 66, scale: 0.82, hd: true },
    dragon: { fw: 454, fh: 249, frames: { run: 8, walk: 8, attack: 8 }, scale: 0.3, hd: true, lift: -6, rate: { walk: 10, run: 14, attack: 14 } },
    bat: { fw: 150, fh: 147, frames: { run: 4, walk: 4, attack: 3 }, baseLeft: true, scale: 0.6, hd: true, lift: 30, rate: { walk: 8, run: 12, attack: 10 } },
    bird: { fw: 48, fh: 32, frames: { walk: 11, run: 11, attack: 11 }, rows: { walk: 2, run: 4, attack: 3 }, scale: 1.6, hd: true },
    lizard: { fw: 209, fh: 118, frames: { run: 8, walk: 8, attack: 8 }, scale: 0.55, hd: true },
    fox: { fw: 177, fh: 128, frames: { walk: 10, run: 12, attack: 10 }, scale: 0.55, hd: true, rate: { walk: 10, run: 16, attack: 14 } },
    insect: { fw: 136, fh: 117, frames: { walk: 10, run: 10, attack: 12 }, scale: 0.5, hd: true, lift: 20, rate: { walk: 14, run: 18, attack: 16 } },
  };
  const FILES = { wolf: { run: 'wolf-run', walk: 'wolf-walk', attack: 'wolf-attack' },
    horse: { run: 'horse-walk', walk: 'horse-walk' }, dragon: { run: 'dragon-run', walk: 'dragon-run', attack: 'dragon-attack' },
    bat: { run: 'bat-run', walk: 'bat-run', attack: 'bat-attack' }, bird: 'bird.png', lizard: { run: 'lizard-run', walk: 'lizard-walk', attack: 'lizard-attack' },
    fox: { run: 'fox-run', walk: 'fox-walk', attack: 'fox-attack' }, insect: { run: 'insect-run', walk: 'insect-walk', attack: 'insect-attack' } };
  // Rồng/dơi lấy từ sprite quái (nội dung Y HỆT, đã verify MD5) → trỏ chung URL để browser tải 1 lần thay vì 2.
  // Texture key (pet_dragon_run, ...) giữ nguyên nên không đụng anim/logic; chỉ đổi đường dẫn file.
  const SHARED_WITH_MOB = {
    'dragon-run': 'mobs/dragon/run', 'dragon-attack': 'mobs/dragon/attack',
    'bat-run': 'mobs/ff_bat/run', 'bat-attack': 'mobs/ff_bat/attack',
  };
  const vGroup = (g) => window.assetV ? assetV(g) : (window.BUILD ? '?v=' + BUILD.assets : '');
  function preload(scene, look) {
    const d = DEF[look], files = FILES[look];
    if (!d || !files) return;
    if (d.static) {
      const version = vGroup('pets');
      scene.load.image(`pet_${look}_static`, `/assets/pets/${files}${version}`);
      return;
    }
    if (look === 'bird') {
      const version = vGroup('pets');
      scene.load.spritesheet('pet_bird_sheet', `/assets/pets/${files}${version}`, { frameWidth: d.fw, frameHeight: d.fh });
      return;
    }
    for (const a of Object.keys(files)) {
      const key = `pet_${look}_${a}`;
      if (scene.textures.exists(key)) continue;
      const name = files[a];
      const shared = SHARED_WITH_MOB[name];
      const rel = shared || `pets/${name}`;
      const version = vGroup(shared ? 'mobs' : 'pets');
      const path = `/assets/${rel}.png${version}`;
      scene.load.spritesheet(key, path, { frameWidth: d.fw, frameHeight: d.fh });
    }
  }
  function createAnims(scene, look) {
    const d = DEF[look];
    if (!d || d.static) return;
    // Hình vẽ tay (hd) bị thu nhỏ: lọc mượt, không để chế độ pixelArt của game làm răng cưa
    if (d.hd) {
      if (look === 'bird') { if (scene.textures.exists('pet_bird_sheet')) scene.textures.get('pet_bird_sheet').setFilter(Phaser.Textures.FilterMode.LINEAR); }
      else for (const a of Object.keys(d.frames)) if (scene.textures.exists(`pet_${look}_${a}`)) scene.textures.get(`pet_${look}_${a}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    if (look === 'bird') {
      for (const a of Object.keys(d.frames)) {
        const animKey = `pet_${look}_${a}_anim`;
        if (scene.anims.exists(animKey) || !scene.textures.exists('pet_bird_sheet')) continue;
        const start = d.rows[a] * 11;
        scene.anims.create({ key: animKey, frames: scene.anims.generateFrameNumbers('pet_bird_sheet', { start, end: start + d.frames[a] - 1 }), frameRate: a === 'run' ? 12 : 7, repeat: a === 'attack' ? 0 : -1 });
      }
      return;
    }
    for (const a of Object.keys(d.frames)) {
      const key = `pet_${look}_${a}`;
      if (!scene.textures.exists(key) || scene.anims.exists(`${key}_anim`)) continue;
      const n = d.frames[a];
      scene.anims.create({ key: `${key}_anim`, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: d.rate?.[a] || (a === 'run' ? 12 : 7), repeat: a === 'attack' ? 0 : -1 });
    }
  }
  function textureKey(look) {
    if (DEF[look]?.static) return `pet_${look}_static`;
    if (look === 'bird') return 'pet_bird_sheet';
    return `pet_${look}_walk`;
  }
  // Bề ngang thú khi vẽ (px)
  const widthOf = (look) => { const d = DEF[look]; return d ? d.fw * (d.scale || 1) * 0.8 : 50; };
  // Khoảng cách từ nhân vật tới tâm thú thứ index trong hàng (looks: kiểu dáng cả hàng, theo thứ tự).
  // Xếp nối đuôi: mỗi con chiếm đúng bề ngang của nó (chồng nhẹ 15%), nên không con nào bị che hay đứng tách xa.
  function gap(looks, index = 0) {
    if (!Array.isArray(looks)) looks = [looks];
    let x = 22;
    for (let i = 0; i < index && i < looks.length; i++) x += widthOf(looks[i]) * 0.85;
    return x + widthOf(looks[Math.min(index, looks.length - 1)]) * 0.5;
  }
  // Bề ngang cả hàng thú (để hàng khác xếp nối sau, không chồng lên)
  const rowWidth = (looks) => looks && looks.length ? 22 + looks.reduce((a, l) => a + widthOf(l) * 0.85, 0) : 0;
  // Vị trí thú thứ index: side 1 = phía thường của hàng, -1 = phía đối diện; dist = khoảng cách tới nhân vật.
  // Từ 3 con trở lên thì chia xen kẽ hai bên (con 1, 3 phía thường; con 2, 4 phía đối diện).
  // otherBase: bề ngang hàng thú đã đứng sẵn ở phía đối diện (thú đồng hành) → hàng mới xếp nối sau.
  function slot(looks, index, otherBase = 0) {
    if (!looks || looks.length <= 2) return { side: 1, dist: gap(looks || [], index) };
    const side = index % 2 === 0 ? 1 : -1;
    const same = looks.filter((_, i) => (i % 2 === 0) === (side === 1));
    return { side, dist: gap(same, Math.floor(index / 2)) + (side < 0 ? otherBase : 0) };
  }
  // Look thú người chơi ĐANG có (để preload chỉ mấy cái cần ngay). Phần còn lại nạp dần qua background().
  function ownedLooks() {
    const out = new Set();
    const p = (typeof App !== 'undefined' && App.player) || null;
    if (!p) return out;
    for (const id of (p.mounts && p.mounts.owned) || []) { const d = GameData.MOUNTS[id]; if (d) out.add(d.look); }
    if (p.summons && p.summons.enabled && GameData.summonCount && GameData.summonCount(p)) {
      const id = GameData.summonChoice ? GameData.summonChoice(p) : null;
      const d = id && GameData.SUMMONS[id];
      if (d) out.add(d.look);
    }
    return out;
  }
  // Một look chưa có texture (để loadRestAssets nạp dần). Trả {look} hoặc null.
  function background(scene) {
    const tried = (scene && scene._petTried) || null;
    for (const look of Object.keys(DEF)) {
      if (ownedLooks().has(look)) continue;
      if (tried && tried.has(look)) continue;
      const d = DEF[look], files = FILES[look];
      if (!d || !files || d.static) continue;
      const a = Object.keys(files)[0];
      const key = look === 'bird' ? 'pet_bird_sheet' : `pet_${look}_${a}`;
      if (!scene.textures.exists(key)) return { look };
    }
    return null;
  }
  return { preload, createAnims, textureKey, gap, rowWidth, slot, ownedLooks, background, def: (look) => DEF[look] };
})();
