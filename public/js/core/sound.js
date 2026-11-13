'use strict';
/*
 * Âm thanh và nhạc nền, tạo hoàn toàn bằng Web Audio (không cần file nhạc).
 * Sound.play('hit') phát hiệu ứng, Sound.music('city') đổi nhạc nền theo bản đồ.
 * Trình duyệt chỉ cho phát tiếng sau lần chạm/bấm phím đầu tiên, nên âm thanh tự bật lúc đó.
 */
const Sound = (() => {
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  // sfxVol / musicVol: mức âm lượng 0–1 (1 = mức gốc của từng kênh). Bật/tắt vẫn là công tắc riêng.
  const settings = { sfx: true, music: true, sfxVol: 1, musicVol: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem('tt_sound') || '{}');
    if (typeof saved.sfx === 'boolean') settings.sfx = saved.sfx;
    if (typeof saved.music === 'boolean') settings.music = saved.music;
    if (typeof saved.sfxVol === 'number') settings.sfxVol = Math.min(1, Math.max(0, saved.sfxVol));
    if (typeof saved.musicVol === 'number') settings.musicVol = Math.min(1, Math.max(0, saved.musicVol));
  } catch { /* bỏ qua */ }
  const save = () => { try { localStorage.setItem('tt_sound', JSON.stringify(settings)); } catch { /* bỏ qua */ } };

  // Mức gốc của từng kênh (nhân thêm với âm lượng người chơi chọn)
  const SFX_BASE = 0.5, MUSIC_BASE = 0.16;
  function applyGain() {
    if (sfxBus) sfxBus.gain.value = settings.sfx ? SFX_BASE * settings.sfxVol : 0;
    if (musicBus) musicBus.gain.value = settings.music ? MUSIC_BASE * settings.musicVol : 0;
  }

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.connect(master);
    applyGain();
    return ctx;
  }
  function unlock() {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (pendingTheme) { const t = pendingTheme; pendingTheme = null; startMusic(t); }
  }
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') ctx.suspend(); else ctx.resume();
  });

  // ---------------------------------------------------------------- Bộ tạo tiếng
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s;
  }
  function env(node, t, a, peak, dur) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f1, f2, dur, vol = 0.3, delay = 0, bus = sfxBus) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t);
    if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
  }
  function hiss(dur, vol, filterType, f1, f2, delay = 0) {
    const t = ctx.currentTime + delay;
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = filterType; f.frequency.setValueAtTime(f1, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.004, vol, dur);
    n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t); n.stop(t + dur + 0.02);
  }

  const RECIPES = {
    swing: () => hiss(0.09, 0.35, 'bandpass', 2400, 700),
    shoot: () => { tone('square', 900, 1500, 0.06, 0.08); hiss(0.05, 0.12, 'highpass', 3000); },
    hit: () => { hiss(0.05, 0.3, 'lowpass', 1400, 400); tone('sine', 190, 90, 0.07, 0.25); },
    crit: () => { hiss(0.07, 0.4, 'lowpass', 2000, 500); tone('triangle', 1600, 2200, 0.08, 0.12); tone('sine', 160, 70, 0.1, 0.3); },
    kill: () => { tone('triangle', 620, 180, 0.16, 0.18); hiss(0.12, 0.15, 'lowpass', 900, 200); },
    hurt: () => { tone('sawtooth', 170, 80, 0.16, 0.16); hiss(0.08, 0.2, 'lowpass', 700); },
    skill: () => { tone('sine', 380, 980, 0.18, 0.18); hiss(0.2, 0.1, 'highpass', 4000, 1500); },
    ult: () => { tone('sine', 70, 40, 0.7, 0.45); tone('sawtooth', 260, 1300, 0.45, 0.08); hiss(0.6, 0.25, 'lowpass', 2500, 200); },
    boom: () => { tone('sine', 65, 35, 0.5, 0.5); hiss(0.45, 0.35, 'lowpass', 900, 120); },
    warn: () => { tone('square', 520, 520, 0.06, 0.07); tone('square', 520, 520, 0.06, 0.07, 0.1); },
    roar: () => { tone('sawtooth', 110, 55, 0.8, 0.22); tone('sawtooth', 116, 58, 0.8, 0.15); hiss(0.8, 0.2, 'lowpass', 600, 150); },
    pickup: () => { tone('sine', 880, 880, 0.07, 0.15); tone('sine', 1320, 1320, 0.1, 0.15, 0.06); },
    coin: () => { tone('square', 1500, 1500, 0.04, 0.05); tone('square', 2000, 2000, 0.07, 0.05, 0.04); },
    levelup: () => [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.22, 0.18, i * 0.09)),
    quest: () => { tone('triangle', 659, 659, 0.14, 0.16); tone('triangle', 988, 988, 0.24, 0.16, 0.12); },
    heal: () => { tone('sine', 523, 784, 0.3, 0.15); tone('sine', 659, 1046, 0.3, 0.1, 0.05); },
    portal: () => { hiss(0.45, 0.25, 'bandpass', 300, 2400); tone('sine', 200, 600, 0.4, 0.1); },
    click: () => tone('sine', 1200, 1200, 0.03, 0.06),
    step: () => { hiss(0.05, 0.06, 'lowpass', 500, 200); tone('sine', 110, 70, 0.05, 0.05); },
    jump: () => { hiss(0.08, 0.08, 'bandpass', 600, 1400); },
    land: () => { hiss(0.1, 0.14, 'lowpass', 400, 120); tone('sine', 90, 50, 0.1, 0.12); },
    error: () => tone('square', 220, 160, 0.12, 0.06),
  };
  const lastPlay = {};
  function play(name) {
    if (!settings.sfx || !ctx || ctx.state !== 'running') return;
    const now = performance.now();
    const gap = name === 'hit' || name === 'coin' ? 60 : name === 'step' ? 180 : 35;
    if (now - (lastPlay[name] || 0) < gap) return;
    lastPlay[name] = now;
    try { RECIPES[name] && RECIPES[name](); } catch { /* bỏ qua */ }
  }

  // ---------------------------------------------------------------- Nhạc nền
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);  // số MIDI → tần số
  // Mỗi bản đồ: nhịp, các hợp âm (MIDI), kiểu
  const SONGS = {
    city: { bpm: 84, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], arp: true, bright: 1800 },
    forest: { bpm: 72, chords: [[50, 53, 57], [55, 58, 62], [58, 62, 65], [57, 61, 64]], arp: true, bright: 1300 },
    cave: { bpm: 92, chords: [[52, 55, 59], [48, 52, 55], [57, 60, 64], [59, 63, 66]], arp: true, bright: 1100 },
    redgate: { bpm: 64, chords: [[48, 51, 55], [49, 53, 56], [48, 51, 55], [43, 47, 50]], arp: false, bright: 700 },
  };
  let current = null, pendingTheme = null, timer = null, nextBar = 0, barIdx = 0;

  function padChord(notes, t, dur, song) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = song.bright;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(musicBus);
    for (const n of notes) for (const det of [-6, 6]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = N(n); o.detune.value = det;
      const og = ctx.createGain(); og.gain.value = 0.12;
      o.connect(og); og.connect(f); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  function pluck(note, t, vol = 0.35) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = N(note);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.55);
  }
  function scheduleBar(song, t) {
    const beat = 60 / song.bpm, bar = beat * 4;
    const ch = song.chords[barIdx % song.chords.length];
    padChord(ch, t, bar + 0.2, song);
    pluck(ch[0] - 12, t, 0.4); pluck(ch[0] - 12, t + beat * 2, 0.3);  // bass
    if (song.arp) {
      const seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]];
      seq.forEach((n, i) => pluck(n + 12, t + i * beat / 2, 0.12));
    }
    barIdx++;
    return bar;
  }
  function startMusic(theme) {
    stopMusic();
    const song = SONGS[theme] || SONGS.city;
    current = theme;
    nextBar = ctx.currentTime + 0.1;
    barIdx = 0;
    timer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      while (nextBar < ctx.currentTime + 1.2) nextBar += scheduleBar(song, nextBar);
    }, 250);
  }
  function stopMusic() { if (timer) clearInterval(timer); timer = null; current = null; }
  function music(theme) {
    if (current === theme && timer) return;
    if (!ctx || ctx.state !== 'running') { pendingTheme = theme; return; }
    startMusic(theme);
  }

  function setSfx(on) { settings.sfx = on; save(); applyGain(); }
  function setMusic(on) { settings.music = on; save(); applyGain(); }
  function setSfxVol(v) { settings.sfxVol = Math.min(1, Math.max(0, Number(v) || 0)); save(); applyGain(); }
  function setMusicVol(v) { settings.musicVol = Math.min(1, Math.max(0, Number(v) || 0)); save(); applyGain(); }

  return { play, music, setSfx, setMusic, setSfxVol, setMusicVol, settings };
})();
