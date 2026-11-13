// Song player: plays an original song with melody (mallet), bass + soft chords on the beat and claps,
// and calls back on every sung syllable so the words can light up karaoke-style.
// Optionally the words are also spoken in rhythm by the device voice (text-to-speech can't sing).
import { h } from './ui.js';
import { ac, hz, mallet, tone, clap, tick, kick, hat, vox, vowelOf } from './sound.js';
import * as speech from './speech.js';

const CHORDS = { C: ['C3', 'E4', 'G4'], F: ['F2', 'A3', 'C4'], G: ['G2', 'B3', 'D4'], Am: ['A2', 'C4', 'E4'], Dm: ['D3', 'F3', 'A3'] };

/** Parse 'text|note|beats|item' tokens. Lines are strings of space-separated tokens. */
export function parse(song) {
  if (song._flat) return song;
  let t = 0;
  song._flat = [];
  song.lines.forEach((line, li) => {
    line.trim().split(/\s+/).forEach((tok, j) => {
      const [text, note, beats, item] = tok.split('|');
      song._flat.push({ text, note, beats: Number(beats), item: item === undefined || item === '' ? null : Number(item), line: li, first: j === 0, t });
      t += Number(beats);
    });
  });
  song._beats = t;
  return song;
}
const sungText = tok => tok.text === '_' || tok.note === 'clap' ? '' : tok.text;
/** The words of one line as plain text, for the voice. */
function lineText(song, li) {
  return song._flat.filter(t => t.line === li).map(sungText).join(' ').replace(/- /g, '').replace(/\s+/g, ' ').trim();
}

/**
 * For songs with `chunkVoice`: the voice says each taught item ("Sunday") exactly when it is sung,
 * and the other words as one short phrase ("here we go"). Returns the text to say at token k, or null.
 */
export function chunkAt(song, k) {
  const f = song._flat, t = f[k];
  if (!sungText(t)) return null;
  const prev = f[k - 1];
  // a phrase also ends at a comma or "!"
  const sameChunk = (a, b) => a && b && a.line === b.line && sungText(a) && sungText(b) && a.item === b.item && !/[,!.]$/.test(a.text);
  if (sameChunk(prev, t)) return null; // inside a chunk that already started
  const words = [];
  for (let j = k; j < f.length && (j === k || sameChunk(f[j - 1], f[j])); j++) words.push(sungText(f[j]));
  return words.join(' ').replace(/- /g, '').replace(/-$/, '').replace(/\s+/g, ' ').trim();
}

/**
 * Play from token index `from`. Resolves {end:true} or {stoppedAt:k} when it reaches the first token of item `stopAtItem`.
 * Returns {done: Promise, stop()}.
 */
export function play(song, { from = 0, stopAtItem = null, onToken, voice = false, skipItem = null, tempo = 1 } = {}) {
  parse(song);
  ac();
  const beatMs = 60000 / (song.bpm * tempo);
  let k = from, stopped = false, timer = null, beatTimer = null;
  const flat = song._flat;
  let resolveFn;
  const done = new Promise(r => { resolveFn = r; });
  const startBeat = flat[from] ? flat[from].t : 0;
  const t0 = performance.now() - startBeat * beatMs;

  // accompaniment on the beat
  let beat = Math.ceil(startBeat);
  const bs = beatMs / 1000;
  const doBeat = () => {
    if (stopped || beat >= song._beats) return;
    const bar = Math.floor(beat / 4), inBar = beat % 4;
    const ch = CHORDS[(song.chords || [])[bar] || 'C'] || CHORDS.C;
    if (song.band) {
      // kick on 1 and 3, soft snare-clap on 2 and 4, hi-hat on every half beat,
      // bass: root then fifth, chord stabs on the off-beats.
      const root = hz(ch[0]) * (hz(ch[0]) < 90 ? 2 : 1);
      if (inBar === 0 || inBar === 2) { kick(0, 0.35); tone(inBar === 0 ? root : root * 1.5, 0, bs * 0.9, 'triangle', 0.16); }
      else clap(0, 0.12);
      hat(0, 0.05); hat(bs / 2, 0.03);
      ch.slice(1).forEach(n => tone(hz(n), bs / 2, bs * 0.4, 'triangle', 0.03));
    } else {
      if (inBar === 0 || inBar === 2) tone(hz(ch[0]), 0, 0.28, 'triangle', 0.12);
      else ch.slice(1).forEach(n => tone(hz(n), 0, 0.14, 'sine', 0.035));
      tick(0, 0.025);
    }
    beat++;
    beatTimer = setTimeout(doBeat, Math.max(0, t0 + beat * beatMs - performance.now()));
  };
  beatTimer = setTimeout(doBeat, Math.max(0, t0 + beat * beatMs - performance.now()));

  const step = () => {
    if (stopped) return;
    if (k >= flat.length) { stop(); resolveFn({ end: true }); return; }
    const tok = flat[k];
    if (stopAtItem != null && tok.item === stopAtItem && (k === 0 || flat[k - 1].item !== stopAtItem) && k !== from) {
      stop(); resolveFn({ stoppedAt: k }); return;
    }
    if (voice && !(skipItem != null && tok.item === skipItem)) {
      if (song.chunkVoice) { const c = chunkAt(song, k); if (c) speech.speak([{ lang: 'en', text: c }], { rate: 1.05 }); }
      else if (tok.first) speech.speak([{ lang: 'en', text: lineText(song, tok.line) }], { rate: Math.min(1.15, song.bpm / 105) });
    }
    if (tok.note === 'clap') clap();
    else if (tok.note && tok.note !== '-') {
      const d = tok.beats * beatMs / 1000;
      if (song.band) { vox(hz(tok.note), 0, d * 0.92, vowelOf(tok.text), 0.13); mallet(hz(tok.note), 0, Math.min(0.6, d), 0.1); }
      else mallet(hz(tok.note), 0, Math.min(0.9, d), 0.2);
    }
    onToken && onToken(k, tok);
    k++;
    const next = flat[k] ? flat[k].t : song._beats;
    timer = setTimeout(step, Math.max(0, t0 + next * beatMs - performance.now()));
  };
  step();
  function stop() { stopped = true; clearTimeout(timer); clearTimeout(beatTimer); }
  return { done, stop: () => { if (!stopped) { stop(); resolveFn({ stopped: true }); } } };
}

/** Karaoke words. Each syllable is a span; syllables ending in '-' join the next one. */
export function lyrics(song, { pics = false, big = false } = {}) {
  parse(song);
  const spans = [];
  const box = h('div', { class: 'lyrics' + (big ? ' big' : '') });
  let lineEl = null, word = null, lastLine = -1;
  song._flat.forEach((tok, k) => {
    if (tok.line !== lastLine) { lineEl = h('div', { class: 'lline' }); box.append(lineEl); lastLine = tok.line; word = null; }
    let span;
    if (tok.text === '_') span = h('span', { class: 'syl rest' });
    else if (tok.note === 'clap') { span = h('span', { class: 'syl clapmark' }, '👏'); word = null; lineEl.append(span); spans.push(span); return; }
    else span = h('span', { class: 'syl' }, tok.text.replace(/-$/, ''));
    if (tok.item != null) span.dataset.item = tok.item;
    if (!word) {
      word = h('span', { class: 'word' });
      if (pics && tok.item != null && song.pics?.[tok.item]) word.append(h('span', { class: 'wpic' }, song.pics[tok.item]));
      lineEl.append(word);
    }
    word.append(span);
    if (!tok.text.endsWith('-')) word = null;
    spans.push(span);
  });
  let prev = null;
  return {
    el: box, spans,
    light(k) { prev?.classList.remove('on'); prev = spans[k]; if (prev) { prev.classList.add('on', 'sung'); prev.closest('.lline')?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); } },
    reset() { spans.forEach(s => s.classList.remove('on', 'sung')); prev = null; },
    gap(item, on) { spans.forEach(s => { if (Number(s.dataset.item) === item) s.closest('.word').classList.toggle('gapword', on); }); },
  };
}
