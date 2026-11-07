'use strict';
/* Sprite sheets thú đồng hành: bộ Animated Wild Animals của ScratchIO (CC0) và ngựa CC0 của alizard. */
const PetSprites = (() => {
  const DEF = {
    wolf: { fw: 64, frames: { run: 6, walk: 8, attack: 10 }, fh: 40, baseLeft: true },
    horse: { fw: 82, frames: { run: 7, walk: 7 }, fh: 66 },
    bird: { fw: 48, fh: 32, frames: { walk: 11, run: 11, attack: 11 }, rows: { walk: 2, run: 4, attack: 3 } },
    lizard: { static: true, fw: 128, fh: 128, baseLeft: true },
  };
  const FILES = { wolf: { run: 'wolf-run', walk: 'wolf-walk', attack: 'wolf-attack' },
    horse: { run: 'horse-walk', walk: 'horse-walk' }, bird: 'bird.png', lizard: 'lizard.png' };
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
  return { preload, createAnims, textureKey, def: (look) => DEF[look] };
})();
