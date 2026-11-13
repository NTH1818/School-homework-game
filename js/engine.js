// Session engine: builds the day's queue (today first, then spaced review) and runs it
// with the feedback loop: correct -> celebrate; wrong -> gentle hint + second try; wrong again -> show answer.
import { h, I, pickOne, fox, segNodes, delay, confirmModal } from './ui.js';
import * as speech from './speech.js';
import { sfx, confetti } from './sound.js';
import { save } from './store.js';
import { ACT } from './activities/index.js';
import { ORDER } from './glyphs.js';

// ---------- mastery tracking ----------
function stat(p, skill) { return (p.skills[skill] ||= { n: 0, ok: 0, recent: [] }); }
export function mastery(p, skill) {
  const s = p.skills[skill];
  if (!s || !s.n) return { acc: null, status: 'new', n: 0 };
  const acc = s.recent.reduce((a, b) => a + b, 0) / s.recent.length;
  let status = 'learning';
  if (s.n >= 6 && acc >= 0.85) status = 'mastered';
  else if (s.n >= 4 && acc < 0.6) status = 'weak';
  return { acc, status, n: s.n };
}
/**
 * Addition and subtraction move up a range (within 5 → 10 → 20) only when the child gets most answers
 * right: 7 of the last 8 at the current range. Lili (Kindergarten) stays within 10.
 */
export function mathLevel(p, op) {
  p.mathLevel ||= {};
  return (p.mathLevel[op] ||= { max: 5, recent: [] });
}
function trackMathLevel(p, q, ok) {
  if (q.type !== 'math' || !['add', 'sub'].includes(q.item?.op) || q.item.fixed) return;
  const L = mathLevel(p, q.item.op);
  if (q.item.max !== L.max) return; // a question from an older range
  L.recent.push(ok ? 1 : 0);
  if (L.recent.length > 8) L.recent.shift();
  const top = p.level === 'lili' ? 10 : 20;
  if (L.recent.length >= 8 && L.recent.reduce((a, b) => a + b, 0) >= 7 && L.max < top) {
    L.max = L.max === 5 ? 10 : 20; L.recent = []; L.fresh = true; // next time starts hands-on again
  }
}
function record(p, skill, ok) {
  const s = stat(p, skill);
  s.n++; if (ok) s.ok++;
  s.recent.push(ok ? 1 : 0);
  if (s.recent.length > 10) s.recent.shift();
}

// ---------- session building ----------
const NO_REVIEW = new Set(['say']);
const PRACTICE = new Set(['tooth']);

function pickWeighted(p, specs, n, curriculumWeight = 1) {
  // Weak skills come back more often, mastered ones fade out.
  const cands = specs.map(s => {
    const m = mastery(p, s.skill);
    const w = (m.status === 'mastered' ? 0.25 : m.status === 'new' ? 1 : 1.6 - (m.acc ?? 0.5)) * (s._cur ? curriculumWeight : 1);
    return { s, w };
  });
  const out = [];
  for (let i = 0; i < n && cands.length; i++) {
    let r = Math.random() * cands.reduce((a, c) => a + c.w, 0), k = 0;
    for (; k < cands.length - 1; k++) { r -= cands[k].w; if (r <= 0) break; }
    out.push(cands.splice(k, 1)[0].s);
  }
  return out;
}
const reviewCount = (s, lili) => (s.type === 'trace' || s.type === 'song' ? undefined : (lili ? 2 : 3));
function estimate(spec, lili) { try { return ACT[spec.type].generate(spec, lili).length; } catch { return 3; } }

/**
 * Daily writing practice, in the Printing Like a Pro teaching order.
 * Leo: 2 letters a day (lowercase first, then capitals) + 1 number, each traced and then written freely,
 * plus one earlier letter that needs practice. Lili: 1 number (trace, then dots) + 1 capital letter.
 */
function writingRounds(p, dayNum, specs) {
  const lili = p.level === 'lili';
  const homeworkTrace = new Set(specs.filter(s => s.type === 'trace').flatMap(s => s.chars));
  const out = [];
  const add = (ch, mode) => { if (!homeworkTrace.has(ch)) out.push({ spec: { type: 'trace', skill: 'write:' + ch, chars: [ch], mode }, review: false, writing: true }); };
  const n = dayNum - 1;
  if (isShort(p)) {
    // Short sessions: one character a day. Leo: a letter (trace → free) and, every other day, a number
    // to trace. Lili: a number one day, a capital letter the next (trace → dots).
    if (lili) add(n % 2 ? ORDER.upper[Math.floor(n / 2) % 26] : ORDER.digits[Math.floor(n / 2) % 10], 'write');
    else {
      add([...ORDER.lower, ...ORDER.upper][n % 52], 'write');
      if (n % 2 === 0) out.push({ spec: { type: 'trace', skill: 'write:' + ORDER.digits[(n / 2) % 10], chars: [ORDER.digits[(n / 2) % 10]], mode: 'trace' }, review: false, writing: true });
    }
  }
  // On long homework days the second letter waits, so the session stays about 10 / 5 minutes.
  const hw = specs.reduce((a, s) => a + estimate(s, lili), 0);
  if (isShort(p)) { /* done above */ } else if (lili) {
    add(ORDER.digits[n % 10], 'write');
    if (!homeworkTrace.size && hw <= 6) add(ORDER.upper[n % 26], 'trace');
  } else {
    const seq = [...ORDER.lower, ...ORDER.upper];
    add(seq[(n * 2) % 52], 'write');
    if (!homeworkTrace.size && hw <= 11) add(seq[(n * 2 + 1) % 52], 'write');
    add(ORDER.digits[n % 10], 'write');
  }
  // One earlier character that needs practice comes back (written freely for Leo).
  const today = new Set(out.map(r => r.spec.skill));
  const old = Object.keys(p.skills).filter(k => k.startsWith('write:') && !today.has(k)).map(skill => ({ skill }));
  const [r] = pickWeighted(p, old, 1);
  if (r) out.push({ spec: { type: 'trace', skill: r.skill, chars: [r.skill.slice(6)], count: 1 }, review: true, writing: true });
  return out;
}

function buildRounds(p, content, dayNum, { noReview = false } = {}) {
  const lili = p.level === 'lili';
  const day = content.days.find(d => d.day === dayNum);
  const specs = day[p.level] || [];
  const rounds = specs.map(spec => ({ spec, review: false }));
  if (noReview) return rounds;
  rounds.push(...writingRounds(p, dayNum, specs));

  // Review pool: skills from earlier homework days, plus the BC curriculum practice pool.
  const pool = new Map();
  for (const d of content.days) {
    if (d.day >= dayNum) continue;
    for (const s of d[p.level] || []) if (!NO_REVIEW.has(s.type)) pool.set(s.skill, s);
  }
  for (const s of content.curriculum?.pool?.[p.level] || []) if (!pool.has(s.skill)) pool.set(s.skill, { ...s, _cur: true });
  const todaySkills = new Set(specs.map(s => s.skill));
  const cands = [...pool.values()].filter(s => !todaySkills.has(s.skill));

  const nReview = day.review?.[p.level] ?? (specs.length ? (lili ? 1 : 2) : (lili ? 2 : 4));
  // Homework first: curriculum items weigh less than earlier homework in normal review.
  for (const s of pickWeighted(p, cands, nReview, 0.6)) {
    rounds.push({ spec: { ...s, count: reviewCount(s, lili) ?? s.count }, review: true });
    cands.splice(cands.indexOf(s), 1);
  }
  // Light homework day: top up with curriculum practice so the session is a useful length.
  const target = lili ? 7 : 14;
  let total = rounds.reduce((a, r) => a + estimate(r.spec, lili), 0);
  const curCands = cands.filter(s => s._cur);
  while (total < target && curCands.length) {
    const [s] = pickWeighted(p, curCands, 1);
    curCands.splice(curCands.indexOf(s), 1);
    const spec = { ...s, count: reviewCount(s, lili) ?? s.count };
    rounds.push({ spec, review: true, fill: true });
    total += estimate(spec, lili);
  }
  return rounds;
}

/** Session length setting per child: 'short' (default) or 'normal'. */
export const isShort = p => (p.sessionLength || 'short') === 'short';
/**
 * Items per session (not counting the "Today is…" opener and tooth reminder).
 * Short is about half of normal, with the same balance: homework first, then writing and review.
 */
const BUDGET = {
  leo: { short: { hw: 6, write: 3, rev: 3 }, normal: null },
  lili: { short: { hw: 3, write: 2, rev: 1 }, normal: null },
};
/** Take items from each round in turn, so a trimmed session still has every kind of activity. */
function roundRobin(groups, n) {
  const take = groups.map(() => 0);
  let left = n, moved = true;
  while (left > 0 && moved) {
    moved = false;
    groups.forEach((g, i) => { if (left > 0 && take[i] < g.items.length) { take[i]++; left--; moved = true; } });
  }
  return take;
}
function trim(groups, budget) {
  const kinds = ['hw', 'write', 'rev'];
  const by = k => groups.filter(g => g.kind === k);
  const avail = Object.fromEntries(kinds.map(k => [k, by(k).reduce((a, g) => a + g.items.length, 0)]));
  const quota = { ...budget };
  // Unused places move to homework first, then review, then writing.
  let spare = kinds.reduce((a, k) => a + Math.max(0, quota[k] - avail[k]), 0);
  kinds.forEach(k => { quota[k] = Math.min(quota[k], avail[k]); });
  for (const k of ['hw', 'rev', 'write']) { const add = Math.min(spare, avail[k] - quota[k]); quota[k] += add; spare -= add; }
  for (const k of kinds) {
    const gs = by(k);
    // Writing rounds stay whole (trace then free), the others share places evenly.
    if (k === 'write') { let left = quota[k]; gs.forEach(g => { const t = Math.min(left, g.items.length); g.items = g.items.slice(0, t); left -= t; }); }
    else roundRobin(gs, quota[k]).forEach((t, i) => { gs[i].items = gs[i].items.slice(0, t); });
  }
}

export function buildQueue(p, content, dayNum, opts = {}) {
  const lili = p.level === 'lili';
  const groups = [];
  const gen = spec => {
    const mod = ACT[spec.type];
    if (!mod) { console.warn('Unknown activity type', spec.type); return []; }
    return mod.generate(spec, lili, p);
  };
  for (const r of buildRounds(p, content, dayNum, opts)) {
    groups.push({ kind: r.writing ? 'write' : r.review ? 'rev' : 'hw', items: gen(r.spec).map(item => ({ type: r.spec.type, skill: r.spec.skill, item, review: r.review, who: p.id })) });
  }
  if (!opts.noReview) {
    // Items missed earlier come back at the start of the review part.
    const missed = (p.missed || []).filter(m => ACT[m.type]).slice(0, lili ? 2 : 3)
      .map(m => ({ type: m.type, skill: m.skill, item: m.item, review: true, who: p.id }));
    if (missed.length) groups.splice(groups.findIndex(g => g.kind === 'rev') < 0 ? groups.length : groups.findIndex(g => g.kind === 'rev'), 0, { kind: 'rev', items: missed });
  }
  const budget = BUDGET[p.level][isShort(p) ? 'short' : 'normal'];
  if (budget && !opts.noTrim) trim(groups, opts.together ? { hw: budget.hw, write: 0, rev: 0 } : budget);
  const q = groups.flatMap(g => g.items);
  if (!opts.noOpener) {
    const opener = [];
    const push = (spec) => ACT[spec.type].generate(spec, lili).forEach(item => opener.push({ type: spec.type, skill: spec.skill, item, who: p.id }));
    push({ type: 'today', skill: 'days:today', short: isShort(p) });
    if (p.level === 'leo') {
      push({ type: 'tooth', skill: 'tooth' });
      if (q.length >= 10 && !isShort(p)) { // quick pop-up halfway through longer sessions
        const mid = Math.floor(q.length / 2);
        q.splice(mid, 0, { type: 'tooth', skill: 'tooth', item: { pop: true }, who: p.id });
      }
    }
    q.unshift(...opener);
  }
  return q;
}

// ---------- running a session ----------
const PRAISE = [['Hienoa', 'Great job'], ['Mahtavaa', 'Awesome'], ['Juuri noin', "That's right"], ['Upeaa', 'Wonderful'],
  ['Loistavaa', 'Brilliant'], ['Hyvä', 'Well done'], ['Osaat tämän', 'You know this']];
const RETRY = [['Melkein!', 'Almost!'], ['Ei ihan. Kokeile vielä!', 'Not quite. Try again!'], ['Hups! Yritä uudestaan.', 'Oops! Try once more.']];

/**
 * queue: [{type, skill, item, review, who}]   players: {id: profile}
 * helper: profile who can press "help" on Lili's turns (together mode)
 */
export function runSession({ queue, players, onDone, onExit, helper = null }) {
  const multi = Object.keys(players).length > 1;
  let idx = 0, cur = null, lastKey = null, lastFirst = null;
  // Score per player: answers right on the first try count fully, on the second try half.
  const stats = Object.fromEntries(Object.keys(players).map(id => [id, { n: 0, first: 0, second: 0 }]));

  const progFill = h('div', { class: 'pfill' });
  const chip = h('div', { class: 'chip' });
  const replayBtn = h('button', { class: 'icon-btn', 'aria-label': 'Kuuntele uudestaan' }, '🔊');
  const snailBtn = h('button', { class: 'icon-btn', 'aria-label': 'Hitaasti' }, '🐌');
  const exitBtn = h('button', { class: 'icon-btn', 'aria-label': 'Lopeta' }, '✕');
  const foxEl = h('div', { class: 'fox-wrap', html: fox() });
  const bubble = h('div', { class: 'bubble' });
  const stage = h('div', { class: 'stage' });
  const nextBtn = h('button', { class: 'next-btn hidden' }, 'Seuraava ▶');
  const helpBtn = h('button', { class: 'help-btn hidden' });
  const root = h('div', { class: 'run' },
    h('div', { class: 'topbar' }, exitBtn, h('div', { class: 'prog' }, progFill), chip, snailBtn, replayBtn),
    h('div', { class: 'guide' }, foxEl, bubble),
    stage,
    h('div', { class: 'footer' }, helpBtn, nextBtn));

  const bounce = () => { foxEl.classList.remove('bounce'); void foxEl.offsetWidth; foxEl.classList.add('bounce'); };

  function finish(st, ok, second = false) {
    const { p, q } = st;
    record(p, q.skill, ok);
    if (q.type !== 'say' && !q.extra && stats[p.id]) { const s = stats[p.id]; s.n++; if (ok) s.first++; else if (second) s.second++; }
    trackMathLevel(p, q, ok);
    if (q.type !== 'say' && q.type !== 'today') {
      p.missed ||= [];
      const key = JSON.stringify(q.item);
      const m = p.missed.find(m => m.key === key);
      if (!ok) {
        if (m) m.need = 2;
        else { p.missed.push({ key, type: q.type, skill: q.skill, item: q.item, need: 2 }); if (p.missed.length > 20) p.missed.shift(); }
      } else if (m && q.review) {
        if (--m.need <= 0) p.missed.splice(p.missed.indexOf(m), 1);
      }
    }
    save();
  }

  function startItem() {
    if (cur) { cur.leave.forEach(f => { try { f(); } catch { /* ignore */ } }); }
    if (idx >= queue.length) { progFill.style.width = '100%'; speech.stop(); cur = null; onDone(stats); return; }
    const q = queue[idx], p = players[q.who], mod = ACT[q.type];
    progFill.style.width = (idx / queue.length * 100) + '%';
    root.style.setProperty('--c', p.color);
    chip.replaceChildren(h('span', { class: 'av' }, p.avatar), h('span', {}, p.name));
    stage.replaceChildren();
    stage.scrollTop = 0;
    nextBtn.classList.add('hidden'); helpBtn.classList.add('hidden');

    const lang = p.lang;
    const st = { q, p, attempts: 0, done: false, ctrl: {}, lastPrompt: [], after: null, helped: false, pre: [], leave: [] };
    if (multi && (idx === 0 || queue[idx - 1].who !== q.who)) st.pre = [I(`${p.gen} vuoro!`, `${p.name}'s turn!`)];
    cur = st;
    const sp = (segs, opts) => speech.speak(speech.resolve(segs, lang), opts);
    st.playPrompt = () => {
      const pre = st.pre; st.pre = [];
      return sp([...pre, ...st.lastPrompt]).then(ok => { if (ok && st === cur && !st.done && st.after) st.after(); });
    };

    const api = {
      lili: p.level === 'lili', lang, name: p.name, body: stage,
      t: (fi, en) => (lang === 'en' ? en : fi),
      onLeave: f => st.leave.push(f),
      /** Finish a practice-only item (reminders, sing-along): no score, no praise. */
      done() {
        if (st.done || st !== cur) return;
        st.done = true;
        p.practiced ||= {}; p.practiced[q.skill] = (p.practiced[q.skill] || 0) + 1; save();
        idx++; startItem();
      },
      speak: (segs, opts) => (st === cur ? sp(segs, opts) : Promise.resolve(false)),
      prompt(segs, after) {
        st.lastPrompt = segs; st.after = after || null;
        bubble.replaceChildren(...segNodes(segs, lang));
        // Same kind of question as the last one: skip the repeated instruction, keep the content.
        const key = q.type + '|' + q.skill, first = segs[0] && segs[0].k !== 'e' ? segs[0].fi + segs[0].en : null;
        const repeat = key === lastKey && first && first === lastFirst && segs.length > 1 && !st.pre.length;
        lastKey = key; lastFirst = first;
        if (repeat) { const full = st.lastPrompt; st.lastPrompt = segs.slice(1); const r = st.playPrompt(); st.lastPrompt = full; return r; }
        return st.playPrompt();
      },
      /** Replay the current question slowly (🐌). */
      slow() { return sp(st.lastPrompt, { rate: speech.getRate() * 0.65, slowNumbers: true }); },
      correct(o = {}) {
        if (st.done || st !== cur) return;
        st.done = true;
        finish(st, st.attempts === 0, st.attempts === 1);
        sfx.ok(); confetti(12); bounce();
        const [fi, en] = pickOne(PRAISE);
        const nm = Math.random() < 0.3 ? ', ' + p.name : '';
        const praise = I(fi + nm + '!', en + nm + '!');
        bubble.replaceChildren(...segNodes([...(o.say || []), praise], lang));
        // Keep the pace: the jingle and confetti celebrate; the spoken praise is short and not every time.
        const spoken = o.say?.length && Math.random() < 0.5 ? o.say : [...(o.say || []), praise];
        Promise.race([sp(spoken), delay(3200)])
          .then(() => delay(250))
          .then(() => { if (st === cur) { idx++; startItem(); } });
      },
      wrong() {
        if (st.done || st !== cur) return;
        st.attempts++;
        sfx.soft();
        if (st.attempts === 1) {
          const r = st.ctrl.hint?.() || [];
          const hs = Array.isArray(r) ? { segs: r } : r;
          const [fi, en] = pickOne(RETRY);
          const segs = [I(fi, en), ...hs.segs];
          if (!hs.onSeg) bubble.replaceChildren(...segNodes(segs, lang));
          sp(segs, { onSeg: i => { if (i > 0 && hs.onSeg) hs.onSeg(i - 1); } });
        } else {
          st.done = true;
          finish(st, false);
          const r = st.ctrl.reveal?.() || [];
          const segs = [I('Katsotaan yhdessä.', "Let's look together."), ...(Array.isArray(r) ? r : r.segs)];
          bubble.replaceChildren(...segNodes(segs, lang));
          sp(segs);
          nextBtn.textContent = api.t('Seuraava ▶', 'Next ▶');
          nextBtn.classList.remove('hidden');
        }
      },
    };
    /** Put a similar question right after this one, so the child can try again straight away. */
    api.again = item => { if (item && !q.extra) queue.splice(idx + 1, 0, { type: q.type, skill: q.skill, item, review: true, who: q.who, extra: true }); };
    api.level = p.mathLevel || null;
    st.api = api;
    st.ctrl = mod.render(q.item, api) || {};
    if (multi && helper && p.id !== helper.id) {
      helpBtn.textContent = `🤝 ${helper.name} auttaa`;
      helpBtn.classList.remove('hidden');
    }
  }

  nextBtn.onclick = () => { idx++; startItem(); };
  replayBtn.onclick = () => { if (cur) cur.playPrompt(); };
  snailBtn.onclick = () => { if (cur) cur.api.slow(); };
  helpBtn.onclick = () => {
    if (!cur || cur.done || cur.helped) return;
    cur.helped = true; cur.attempts = Math.max(cur.attempts, 1);
    helpBtn.classList.add('hidden');
    const r = cur.ctrl.hint?.() || [];
    const hs = Array.isArray(r) ? { segs: r } : r;
    const segs = [I(`${helper.name} auttaa!`, `${helper.name} helps!`), ...hs.segs];
    if (!hs.onSeg) bubble.replaceChildren(...segNodes(segs, cur.p.lang));
    speech.speak(speech.resolve(segs, cur.p.lang), { onSeg: i => { if (i > 0 && hs.onSeg) hs.onSeg(i - 1); } });
  };
  exitBtn.onclick = async () => {
    speech.stop();
    const p = cur ? cur.p : Object.values(players)[0];
    const yes = await confirmModal(p.lang === 'en' ? 'Stop playing?' : 'Lopetetaanko?', p.lang === 'en' ? 'Yes, stop' : 'Kyllä', p.lang === 'en' ? 'Keep playing' : 'Jatketaan');
    if (yes) { cur?.leave.forEach(f => { try { f(); } catch { /* ignore */ } }); cur = null; onExit(); }
  };

  document.getElementById('app').replaceChildren(root);
  startItem();
}
