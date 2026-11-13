// All game audio is synthesized in the browser (Web Audio): no audio files, no licensing, works offline.
// One master volume + mute (set in the parent area) controls music and sound effects.
let ctx, master, volume = 0.8, muted = false;

export function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.connect(ctx.destination);
    applyVolume();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export function out() { ac(); return master; }
function applyVolume() { if (master) master.gain.value = muted ? 0 : volume; }
export function setVolume(v) { volume = v; applyVolume(); }
export function setMuted(m) { muted = m; applyVolume(); }

const NOTES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** 'C4', 'F#3', 'Bb4' -> Hz */
export function hz(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  if (!m) return 440;
  const midi = NOTES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((midi - 69) / 12);
}

/** A soft mallet tone (marimba-like): sine + quickly fading overtone. */
export function mallet(freq, start = 0, dur = 0.3, vol = 0.18) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + start;
  for (const [mult, v, d] of [[1, vol, dur + 0.25], [4, vol * 0.25, 0.08]]) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(g).connect(master); o.start(t); o.stop(t + d + 0.05);
  }
}
export function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(c) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
/** A hand clap: two short bursts of filtered noise. */
export function clap(start = 0, vol = 0.35) {
  const c = ac(); if (!c) return;
  for (const off of [0, 0.012]) {
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise(c); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.9;
    const t = c.currentTime + start + off;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.12);
  }
}
// ---- band sounds for songs ----
// A sung vowel ("aah", "ooh"…): two slightly detuned sawtooth waves through vowel formant filters,
// with gentle vibrato. It can't say words, but it sounds like a voice singing the tune.
const FORMANTS = {
  a: [[800, 1], [1150, 0.5], [2900, 0.12]], e: [[420, 1], [1900, 0.4], [2700, 0.12]],
  i: [[310, 1], [2300, 0.3], [3000, 0.1]], o: [[470, 1], [820, 0.55], [2800, 0.08]], u: [[340, 1], [720, 0.4], [2500, 0.06]],
};
const VLEVEL = { a: 1.35, e: 1, i: 2.3, o: 0.65, u: 2.4 }; // measured, so every vowel is equally loud
export function voxOn(c, dest, freq, start, dur, vowel = 'a', vol = 0.16) {
  vol *= VLEVEL[vowel] || 1;
  const t = c.currentTime + start, end = t + Math.max(0.12, dur);
  const o1 = c.createOscillator(), o2 = c.createOscillator(), lfo = c.createOscillator();
  o1.type = o2.type = 'sawtooth'; o1.frequency.value = o2.frequency.value = freq; o2.detune.value = 8;
  lfo.frequency.value = 5.4;
  const depth = c.createGain(); depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(freq * 0.011, t + Math.min(0.3, dur * 0.6));
  lfo.connect(depth); depth.connect(o1.frequency); depth.connect(o2.frequency);
  const pre = c.createGain(); pre.gain.value = 0.5; o1.connect(pre); o2.connect(pre);
  const env = c.createGain();
  env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(vol, t + 0.05);
  env.gain.setValueAtTime(vol, Math.max(t + 0.05, end - 0.07)); env.gain.linearRampToValueAtTime(0, end + 0.05);
  for (const [f, a] of FORMANTS[vowel] || FORMANTS.a) {
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = f < 1000 ? 5 : 9;
    const g = c.createGain(); g.gain.value = a * 2.6;
    pre.connect(bp).connect(g).connect(env);
  }
  env.connect(dest);
  for (const o of [o1, o2, lfo]) { o.start(t); o.stop(end + 0.1); }
}
export function vox(freq, start, dur, vowel, vol) { const c = ac(); if (c) voxOn(c, master, freq, start, dur, vowel, vol); }
/** The main vowel of a sung syllable, for vox(). */
export function vowelOf(text) {
  const w = text.toLowerCase().replace(/[^a-z]/g, '');
  if (/ay|ai|ey/.test(w)) return 'e';
  if (/oo|ue|ew|ou/.test(w)) return 'u';
  const m = /[aeiouy]/.exec(w);
  return !m ? 'a' : m[0] === 'y' ? 'i' : m[0] === 'u' ? 'a' : m[0];
}
export function kick(start = 0, vol = 0.5) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + start, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.3);
}
export function hat(start = 0, vol = 0.06) {
  const c = ac(); if (!c) return;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise(c); f.type = 'highpass'; f.frequency.value = 7000;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.06);
}

/** Soft tick for the beat. */
export function tick(start = 0, vol = 0.05) {
  const c = ac(); if (!c) return;
  tone(1800, start, 0.03, 'square', vol);
}

const play = (notes, step = 0.11, vol = 0.16) => notes.forEach((n, i) => n && mallet(hz(n), i * step, 0.25, vol));
// Short musical jingles, varied so they don't get boring.
const JINGLES = [['C5', 'E5', 'G5'], ['G4', 'C5', 'E5', 'C6'], ['E5', 'G5', 'C6'], ['D5', 'F#5', 'A5'], ['C5', 'G5', 'E5', 'C6']];
export const sfx = {
  unlock() { ac(); },
  ok() { play(JINGLES[Math.floor(Math.random() * JINGLES.length)]); },
  tap() { mallet(hz('A5'), 0, 0.12, 0.08); },
  soft() { play(['E4', 'C4'], 0.13, 0.08); }, // gentle, never scary
  fanfare() { // day finished
    play(['C5', 'E5', 'G5', 'C6', null, 'A5', 'C6', 'E6'], 0.12, 0.16);
    [0, 0.48].forEach(t => clap(t + 0.96, 0.25));
  },
  bonus() { play(['G5', 'B5', 'D6', 'G6', 'D6', 'G6'], 0.09, 0.15); },
};

export function confetti(n = 16) {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const em = ['⭐', '✨', '🎉', '💛', '🌟', '🧡'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = em[i % em.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = Math.random() * 0.3 + 's';
    s.style.fontSize = 18 + Math.random() * 22 + 'px';
    layer.append(s);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2000);
}
