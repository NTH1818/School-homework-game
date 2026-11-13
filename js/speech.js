// Text-to-speech with the Web Speech API. Finnish for instructions, English for learning content.
const synth = window.speechSynthesis;
let voices = [];
let rate = 0.9;
function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

export function setRate(r) { rate = r; }
export function getRate() { return rate; }
// Counting and number sequences: slower, one number at a time with a pause in between.
let countRate = 0.75, countGap = 650;
export function setCounting(r, gapMs) { countRate = r; countGap = gapMs; }
/**
 * Split English number sequences ("5, 10, 15 …") into one segment per number, spoken slowly with a
 * pause between numbers and a longer pause at "…" (where the gap is), so the child can follow.
 */
function expandNumbers(segs, slowAll) {
  const out = [];
  for (const s of segs) {
    const parts = s.text.split(/,\s*/);
    const isSeq = parts.length >= 2 && parts.every(t => /^[\d$¢.]+\s*…?$|^…$/.test(t.trim()));
    if (!isSeq) {
      if (/^\s*\d+\s*$/.test(s.text)) out.push({ ...s, numRate: true, pause: countGap }); // counting one by one
      else out.push(slowAll && /\d/.test(s.text) ? { ...s, numRate: true } : s);
      continue;
    }
    parts.forEach((t, i) => {
      const gap = /…/.test(t);
      const txt = t.replace('…', '').trim();
      if (txt) out.push({ ...s, text: txt, numRate: true, pause: i === parts.length - 1 && !gap ? 0 : countGap });
      if (gap) out.push({ ...s, text: '', pause: countGap * 2.2 }); // think time before the gap
    });
  }
  return out;
}
export function allVoices() { loadVoices(); return voices; }

export function voiceFor(lang) {
  const norm = v => v.lang.toLowerCase().replace('_', '-');
  const c = voices.filter(v => norm(v).startsWith(lang));
  if (!c.length) return null;
  const pref = lang === 'en' ? ['en-ca', 'en-us', 'en-gb'] : ['fi-fi'];
  for (const p of pref) { const v = c.find(v => norm(v) === p && v.localService) || c.find(v => norm(v) === p); if (v) return v; }
  return c[0];
}
/** True if we can speak this language. Before voices load we optimistically say yes. */
export function hasVoice(lang) { return !voices.length || !!voiceFor(lang); }

/** Turn I/E segments into [{lang,text}]. Falls back to English instructions when no Finnish voice exists. */
export function resolve(segs, lang) {
  const fi = lang === 'fi' && hasVoice('fi');
  return segs.map(s => s.k === 'e'
    ? { lang: 'en', text: s.text, slow: s.slow }
    : { lang: fi ? 'fi' : 'en', text: fi ? s.fi : s.en }).filter(s => s.text);
}

let token = 0;
export function stop() { token++; if (synth) synth.cancel(); }

/** Speak segments in order. Resolves true if finished, false if interrupted. */
export function speak(segs0, opts = {}) {
  stop();
  const my = token;
  const segs = expandNumbers(segs0.map((s, i) => ({ ...s, orig: i })), opts.slowNumbers);
  return new Promise(res => {
    if (!synth || !segs.length) return res(!segs.length);
    let i = 0, lastOrig = -1;
    const next = () => {
      if (my !== token) return res(false);
      if (i >= segs.length) return res(true);
      const s = segs[i]; i++;
      if (!s.text) { setTimeout(next, s.pause || 0); return; } // a thinking pause
      const u = new SpeechSynthesisUtterance(s.text);
      u.lang = s.lang === 'fi' ? 'fi-FI' : 'en-US';
      const v = voiceFor(s.lang); if (v) { u.voice = v; u.lang = v.lang; }
      const base = opts.rate || rate;
      u.rate = s.numRate ? Math.min(base, countRate) * (opts.slowNumbers ? 0.85 : 1) : base * (s.slow ? 0.7 : 1);
      let ended = false;
      const fin = () => { if (ended) return; ended = true; clearTimeout(guard); setTimeout(next, 150 + (s.pause || 0)); };
      // Some Android engines occasionally never fire onend; don't get stuck.
      const guard = setTimeout(fin, 2500 + s.text.length * 110);
      u.onstart = () => { if (opts.onSeg && my === token && s.orig !== lastOrig) { lastOrig = s.orig; opts.onSeg(s.orig, segs0[s.orig]); } };
      u.onend = fin; u.onerror = fin;
      synth.speak(u);
    };
    // Chrome drops an utterance queued in the same tick as cancel().
    setTimeout(next, 60);
  });
}
