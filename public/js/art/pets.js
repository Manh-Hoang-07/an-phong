'use strict';
/* Sprite sheets thú đồng hành: sói (Free Sprites), thằn lằn lửa hai đầu, hạc rmazanek (CC0), ngựa alizard (CC0). Xem public/assets/CREDITS.txt. */
const PetSprites = (() => {
  const DEF = {
    // scale: tỉ lệ vẽ trong game
    wolf: { fw: 174, fh: 98, frames: { run: 3, walk: 4, attack: 5 }, baseLeft: true, scale: 0.75, hd: true },
    horse: { fw: 82, frames: { run: 7, walk: 7 }, fh: 66, scale: 0.82 },
    bird: { fw: 48, fh: 32, frames: { walk: 11, run: 11, attack: 11 }, rows: { walk: 2, run: 4, attack: 3 }, scale: 1.6 },
    lizard: { fw: 209, fh: 118, frames: { run: 8, walk: 8, attack: 8 }, scale: 0.55, hd: true },
  };
  const FILES = { wolf: { run: 'wolf-run', walk: 'wolf-walk', attack: 'wolf-attack' },
    horse: { run: 'horse-walk', walk: 'horse-walk' }, bird: 'bird.png', lizard: { run: 'lizard-run', walk: 'lizard-walk', attack: 'lizard-attack' } };
  function preload(scene, look) {
    const d = DEF[look], files = FILES[look];
    if (!d || !files) return;
    if (d.static) {
      const version = window.BUILD ? `?v=${BUILD.assets}` : '';
      scene.load.image(`pet_${look}_static`, `/assets/pets/${files}${version}`);
      return;
    }
    if (look === 'bird') {
      const version = window.BUILD ? `?v=${BUILD.assets}` : '';
      scene.load.spritesheet('pet_bird_sheet', `/assets/pets/${files}${version}`, { frameWidth: d.fw, frameHeight: d.fh });
      return;
    }
    for (const a of Object.keys(files)) {
      const key = `pet_${look}_${a}`;
      if (scene.textures.exists(key)) continue;
      const version = window.BUILD ? `?v=${BUILD.assets}` : '';
      const path = `/assets/pets/${files[a]}.png${version}`;
      scene.load.spritesheet(key, path, { frameWidth: d.fw, frameHeight: d.fh });
    }
  }
  function createAnims(scene, look) {
    const d = DEF[look];
    if (!d || d.static) return;
    // Hình vẽ tay (hd) bị thu nhỏ: lọc mượt, không để chế độ pixelArt của game làm răng cưa
    if (d.hd) for (const a of Object.keys(d.frames)) if (scene.textures.exists(`pet_${look}_${a}`)) scene.textures.get(`pet_${look}_${a}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
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
      scene.anims.create({ key: `${key}_anim`, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: a === 'run' ? 12 : 7, repeat: a === 'attack' ? 0 : -1 });
    }
  }
  function textureKey(look) {
    if (DEF[look]?.static) return `pet_${look}_static`;
    if (look === 'bird') return 'pet_bird_sheet';
    return `pet_${look}_walk`;
  }
  // Khoảng cách từ nhân vật tới thú thứ index (tâm tới tâm): đủ xa để thú không bị nhân vật che
  function gap(look, index = 0) {
    const d = DEF[look], w = d ? d.fw * (d.scale || 1) : 60;
    return 26 + w * 0.5 + index * Math.max(30, w * 0.7);
  }
  return { preload, createAnims, textureKey, gap, def: (look) => DEF[look] };
})();
