// Screens: profiles, avatar setup, child home, end of day, collection, together mode, parent area.
import { h, I, fox, segNodes, confirmModal, rnd } from './ui.js';
import { load, S, save, mstate, dstate, resetProfile, connectCloud } from './store.js';
import * as speech from './speech.js';
import { sfx, confetti, setVolume, setMuted } from './sound.js';
import { buildQueue, runSession, mastery } from './engine.js';
import { ACT } from './activities/index.js';
import { SONGS, SONG_ORDER, LILI_SONGS } from './songs.js';
import { toothSVG } from './activities/tooth.js';
import { ORDER } from './glyphs.js';
import { award, totals, history, payOut, coinsFor, money, moneyEn, moneyFi, moneyOn, ym, thresholds, AMOUNTS, monthOf } from './bank.js';
import { coinEl, COINS } from './activities/coins.js';
import { mallet, hz } from './sound.js';
import { isShort } from './engine.js';

const SONGS_WE_LIKE = [
  { title: 'Days of the week (YouTube)', url: 'https://www.youtube.com/watch?v=loINl3Ln6Ck', note: 'Upbeat clap-along video the kids like.' },
];

const app = document.getElementById('app');
let C = null;          // current month content
let MONTHS = [];
const WD_FI = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AVATARS = ['🦁', '🐰', '🐻', '🐼', '🦊', '🐸', '🐯', '🦄', '🐶', '🐱', '🐧', '🦖'];
const COLORS = ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];

const P = id => S().profiles[id];
const T = (p, fi, en) => (p && p.lang === 'en' ? en : fi);
function show(...els) { speech.stop(); app.replaceChildren(...els); window.scrollTo(0, 0); }
function say(p, segs) { return speech.speak(speech.resolve(segs, p ? p.lang : 'fi')); }
const foxBox = () => h('div', { class: 'fox-wrap', html: fox() });

// ---------- day helpers ----------
function ymNow() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; }
function todayNum() { const ym = ymNow(); return ym === C.month ? new Date().getDate() : ym > C.month ? 99 : 0; }
function wd(d) { const [y, m] = C.month.split('-').map(Number); return new Date(y, m - 1, d).getDay(); }
const dayObj = d => C.days.find(x => x.day === d);
const ds = (p, d) => dstate(p, C.month, d);
function isDone(p, d) { const x = mstate(p, C.month).days[d]; return !!(x && (x.done || x.skipped)); }
function currentDay(p) { const d = C.days.find(d => !isDone(p, d.day)); return d ? d.day : null; }
function titleFor(p, day) { const t = (p.level === 'lili' && day.liliTitle) || day.title; return T(p, t.fi, t.en); }
function offlineFor(p, day) { return [...((p.level === 'leo' ? day.offline : day.liliOffline) || []), ...(C.daily || [])]; }
function markDone(p, d) { const x = ds(p, d); x.done = true; x.skipped = false; x.at = Date.now(); save(); }

function applySettings() {
  const s = S().settings;
  s.volume ??= 0.8; s.muted ??= false; s.songVoice ??= true;
  speech.setRate(s.rate);
  const cnt = { normal: [0.85, 400], slow: [0.72, 650], slower: [0.6, 950] }[s.counting || 'slow'];
  speech.setCounting(cnt[0], cnt[1]);
  setVolume(s.volume); setMuted(s.muted);
}

// ---------- plain "1" ----------
// The fonts draw 1 with a flag (European style). BC print teaches 1 as one straight line, so every
// digit 1 on screen is wrapped in <span class="one">, which CSS draws as a plain bar. textContent is unchanged.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION', 'SELECT', 'TITLE']);
function plainOnes(node) {
  if (node.nodeType === 3) {
    const p = node.parentNode;
    if (!p || !node.nodeValue.includes('1') || SKIP_TAGS.has(p.nodeName) || p.closest?.('.nrun,[data-raw],svg')) return;
    // Andika's plain bar is its "l"; Nunito's is its "I" (see CSS).
    const andika = /Andika/.test(getComputedStyle(p).fontFamily.split(',')[0]);
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\d*1\d*)/).forEach(part => {
      if (!/1/.test(part)) { if (part) frag.append(part); return; }
      const run = document.createElement('span'); run.className = 'nrun'; // keeps "12" on one line
      part.split(/(1)/).forEach(q => {
        if (q === '1') { const s = document.createElement('span'); s.className = 'one' + (andika ? ' a' : ''); s.textContent = '1'; run.append(s); }
        else if (q) run.append(q);
      });
      frag.append(run);
    });
    p.replaceChild(frag, node);
  } else if (node.nodeType === 1 && !SKIP_TAGS.has(node.nodeName) && !node.classList.contains('nrun') && node.namespaceURI !== 'http://www.w3.org/2000/svg') {
    [...node.childNodes].forEach(plainOnes);
  }
}
new MutationObserver(ms => ms.forEach(m => {
  if (m.type === 'characterData') plainOnes(m.target);
  else m.addedNodes.forEach(plainOnes);
})).observe(document.body, { childList: true, subtree: true, characterData: true });

// ---------- boot ----------
async function boot() {
  load();
  applySettings();
  try {
    MONTHS = (await (await fetch('content/index.json')).json()).months;
    const want = S().settings.month;
    const m = MONTHS.includes(want) ? want : MONTHS.includes(ymNow()) ? ymNow() : MONTHS[MONTHS.length - 1];
    C = await (await fetch(`content/${m}.json`)).json();
    try { C.curriculum = await (await fetch('content/curriculum-bc.json')).json(); } catch { C.curriculum = null; }
  } catch (e) {
    show(h('div', { class: 'screen' }, h('h2', {}, 'Sisältöä ei voitu ladata'), h('p', {}, String(e)),
      h('p', {}, 'Avaa peli palvelimen kautta (katso README), ei suoraan tiedostona.')));
    return;
  }
  profiles();
  connectCloud(() => { applySettings(); if (document.querySelector('.profiles')) profiles(); });
  try { if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {}); } catch { /* not allowed here */ }
}

// ---------- profiles ----------
function profiles() {
  const card = p => {
    const d = currentDay(p);
    return h('button', { class: 'pcard', style: { '--c': p.color }, onclick: () => { sfx.unlock(); p.setup ? home(p) : setup(p, () => home(p)); } },
      h('span', { class: 'pav' }, p.avatar), h('span', { class: 'pname' }, p.name),
      h('span', { class: 'psub' }, d ? `Päivä ${d}` : '🌲 Valmis!'));
  };
  show(h('div', { class: 'screen profiles' },
    h('div', { class: 'hero' }, foxBox(), h('div', {}, h('h1', {}, 'Kipinä'), h('p', {}, `${C.title.fi} · Kuka pelaa?`))),
    h('div', { class: 'pcards' }, card(P('leo')), card(P('lili'))),
    h('button', { class: 'big-btn together', onclick: () => { sfx.unlock(); together(); } }, '🤝 Pelataan yhdessä'),
    window.speechSynthesis ? null : h('p', { class: 'warnbox' },
      '🔇 Tämä selain ei osaa puhua, joten Kipinä on hiljaa. Avaa peli Chromessa. (This browser has no speech. Open the game in Chrome.)'),
    h('button', { class: 'link-btn', onclick: lock }, '🔒 Vanhemmille')));
}

function setup(p, then) {
  let av = p.avatar, col = p.color;
  const avs = AVATARS.map(a => h('button', { class: 'av-opt' + (a === av ? ' sel' : ''), onclick: e => { av = a; sel(e.currentTarget); } }, a));
  const cols = COLORS.map(c => h('button', { class: 'col-opt' + (c === col ? ' sel' : ''), style: { background: c }, onclick: e => { col = c; sel(e.currentTarget); } }));
  function sel(el) { [...el.parentNode.children].forEach(x => x.classList.remove('sel')); el.classList.add('sel'); sfx.tap(); }
  const segs = [I(`Hei ${p.name}! Valitse oma eläin ja oma väri.`, `Hi ${p.name}! Pick your animal and your colour.`)];
  show(h('div', { class: 'screen' },
    h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs, p.lang))),
    h('h2', {}, T(p, 'Eläin', 'Animal')), h('div', { class: 'av-grid' }, avs),
    h('h2', {}, T(p, 'Väri', 'Colour')), h('div', { class: 'col-grid' }, cols),
    h('button', { class: 'big-btn', onclick: () => { p.avatar = av; p.color = col; p.setup = true; save(); then(); } }, '✓ ' + T(p, 'Valmis', 'Done'))));
  say(p, segs);
}

// ---------- child home ----------
function offlineList(p, d) {
  const day = dayObj(d), items = offlineFor(p, day);
  if (!items.length) return null;
  const st = ds(p, d);
  return h('div', { class: 'offline' },
    h('h3', {}, T(p, '📝 Paperilla ja yhdessä', '📝 On paper and together')),
    items.map(o => {
      const b = h('button', { class: 'check' + (st.off[o.id] ? ' on' : '') }, h('span', { class: 'box' }, st.off[o.id] ? '✅' : '⬜'), h('span', {}, T(p, o.fi, o.en)));
      b.onclick = () => { st.off[o.id] = !st.off[o.id]; save(); b.classList.toggle('on'); b.firstChild.textContent = st.off[o.id] ? '✅' : '⬜'; if (st.off[o.id]) sfx.ok(); };
      return b;
    }));
}

function monthStrip(p) {
  const m = mstate(p, C.month), cd = currentDay(p);
  return h('div', { class: 'strip' }, C.days.map(d => {
    const x = m.days[d.day];
    const cls = x?.done ? 'got' : x?.skipped ? 'skip' : d.day === cd ? 'now' : '';
    return h('div', { class: 'sd ' + cls }, x?.done ? C.collection.creatures[d.day - 1] : x?.skipped ? '–' : d.day);
  }));
}

function home(p) {
  const head = h('div', { class: 'topbar' },
    h('button', { class: 'icon-btn', onclick: profiles, 'aria-label': 'Takaisin' }, '←'),
    h('div', { class: 'chip big' }, h('span', { class: 'av' }, p.avatar), p.name),
    moneyOn(p) ? h('button', { class: 'icon-btn', onclick: () => piggyBank(p), 'aria-label': 'Säästöpossu' }, '🐷') : null,
    h('button', { class: 'icon-btn', onclick: () => writingBook(p), 'aria-label': 'Kirjoitus' }, '✏️'),
    h('button', { class: 'icon-btn', onclick: () => songBook(p), 'aria-label': 'Laulut' }, '🎵'),
    h('button', { class: 'icon-btn', onclick: () => collection(p), 'aria-label': 'Metsä' }, '🌲'));
  const d = currentDay(p);
  if (d == null) {
    const segs = [I(`Mahtavaa ${p.name}! Koko kuukausi on tehty!`, `Amazing ${p.name}! The whole month is done!`)];
    show(h('div', { class: 'screen home', style: { '--c': p.color } }, head,
      h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs, p.lang))),
      h('button', { class: 'big-btn', onclick: () => collection(p) }, '🌲 ' + T(p, 'Katso metsä', 'See the forest')), monthStrip(p)));
    say(p, segs); return;
  }
  const day = dayObj(d);
  const t = (p.level === 'lili' && day.liliTitle) || day.title;
  const greet = [I(`Hei ${p.name}! Tänään on päivä ${d}.`, `Hi ${p.name}! Today is day ${d}.`), I(t.fi, t.en)];
  show(h('div', { class: 'screen home', style: { '--c': p.color } }, head,
    h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(greet, p.lang))),
    h('div', { class: 'daycard' },
      h('div', { class: 'daynum' }, `${T(p, WD_FI, WD_EN)[wd(d)]} ${d}.${C.month.slice(5)}.`),
      h('div', { class: 'daytitle' }, titleFor(p, day)),
      h('button', { class: 'play-btn', onclick: () => startDay(p, d) }, '▶ ' + T(p, 'Aloita', 'Start'))),
    offlineList(p, d),
    monthStrip(p)));
  say(p, greet);
}

function startDay(p, d, back = () => home(p)) {
  sfx.unlock();
  const queue = buildQueue(p, C, d);
  if (!queue.length) { markDone(p, d); end(p, d); return; }
  runSession({ queue, players: { [p.id]: p }, onDone: stats => { markDone(p, d); end(p, d, award(p, stats[p.id])); }, onExit: back });
}

// ---------- score and pocket money ----------
const SCORE_TXT = {
  good: ['Loistava päivä!', 'Great day!', '⭐⭐⭐'],
  medium: ['Hyvä päivä!', 'Good day!', '⭐⭐'],
  poor: ['Hyvä yritys, opit lisää!', 'Good try, you learned more!', '⭐'],
};
const COIN_FI = { quarter: '25 sentin kolikko', dime: 'kymmenen sentin kolikko', nickel: 'viiden sentin kolikko' };
const COIN_FI_PL = { quarter: '25 sentin kolikkoa', dime: 'kymmenen sentin kolikkoa' };
/** The end-of-day score card with coins dropping into the piggy bank. Always says what was earned. */
function scoreCard(p, r) {
  const [fi, en, stars] = SCORE_TXT[r.score];
  const box = h('div', { class: 'scorecard' }, h('div', { class: 'stars' }, stars), h('b', {}, T(p, fi, en)));
  const segs = [I(fi, en)];
  if (r.money && r.cents) {
    const n = r.coins.length, name = r.coins[0];
    const coinFi = n === 1 ? COIN_FI[name] : `${n === 2 ? 'kaksi' : n} ${COIN_FI_PL[name]}`, coinEn = n === 1 ? `a ${name}` : `${n === 2 ? 'two' : n} ${name}s`;
    const pig = h('div', { class: 'piggy' }, h('span', { class: 'pig' }, '🐷'), h('div', { class: 'drop' }, r.coins.map(c => coinEl(c, 0.6))));
    box.append(pig, h('p', {}, T(p, `Ansaitsit ${moneyFi(r.cents)}: ${coinFi}!`, `You earned ${moneyEn(r.cents)}: ${coinEn}!`)),
      h('p', { class: 'muted' }, T(p, `Säästöpossussa nyt ${money(totals(p).earned)}`, `Piggy bank this month: ${money(totals(p).earned)}`)));
    segs.push(I(`Ansaitsit ${moneyFi(r.cents)}. Se on ${coinFi}.`, `You earned ${moneyEn(r.cents)}. That is ${coinEn}.`));
    r.coins.forEach((c, i) => setTimeout(() => mallet(hz(['E6', 'G6', 'C7'][i % 3]), 0, 0.3, 0.15), 600 + i * 350));
  } else if (r.sticker) {
    box.append(h('div', { class: 'sticker' }, '⭐'), h('p', {}, T(p, 'Lisäharjoitusta! Saat tarran. Päivän rahat on jo ansaittu.', 'Extra practice! You get a sticker. Today’s coins are already in your piggy bank.')));
    segs.push(I('Lisäharjoitusta! Saat tarran.', 'Extra practice! You get a sticker.'));
  }
  return { el: box, segs };
}

function piggyBank(p) {
  const t = totals(p);
  const coins = coinsFor(t.earned);
  const hist = history(p).filter(x => x.key !== ym());
  const segs = [t.earned ? I(`Säästöpossussa on tässä kuussa ${moneyFi(t.earned)}.`, `Your piggy bank has ${moneyEn(t.earned)} this month.`)
    : I('Säästöpossu on vielä tyhjä. Pelaa päivän tehtävät, niin saat kolikoita!', 'Your piggy bank is empty. Play today’s session to earn coins!')];
  const countBtn = coins.length ? h('button', { class: 'big-btn', onclick: () => {
    sfx.unlock();
    const queue = ACT.coins.generate({ mode: 'mine', coins }, false).map(item => ({ type: 'coins', skill: 'cur:coins-count', item, who: p.id }));
    runSession({ queue, players: { [p.id]: p }, onDone: () => piggyBank(p), onExit: () => piggyBank(p) });
  } }, '🪙 ' + T(p, 'Laske omat rahasi', 'Count your money')) : null;
  show(h('div', { class: 'screen', style: { '--c': p.color } },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', onclick: () => home(p) }, '←'), h('h2', { class: 'grow' }, '🐷 ' + T(p, 'Säästöpossu', 'Piggy bank'))),
    h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs, p.lang))),
    h('div', { class: 'piggybig' }, h('span', { class: 'pig' }, '🐷'), h('b', {}, money(t.earned))),
    h('div', { class: 'coinrow wrap' }, coins.map(c => coinEl(c, 0.75))),
    coins.length ? h('p', { class: 'center muted' }, coinNames(p, coins)) : null,
    countBtn,
    p.bank?.stickers ? h('p', { class: 'center' }, T(p, 'Lisäharjoitustarrat: ', 'Extra practice stickers: '), '⭐'.repeat(Math.min(30, p.bank.stickers))) : null,
    hist.length ? h('div', {}, h('h3', {}, T(p, 'Aiemmat kuukaudet', 'Earlier months')), hist.map(x => h('p', {}, `${x.key}: ${money(x.earned)}`))) : null));
  say(p, segs);
}
function coinNames(p, coins) {
  const n = {}; coins.forEach(c => { n[c] = (n[c] || 0) + 1; });
  return Object.entries(n).map(([c, k]) => `${k} × ${c} (${COINS[c].label})`).join(' · ');
}

function end(p, d, r = null) {
  const cr = C.collection.creatures[d - 1];
  const segs = [I(`Valmista tältä päivältä, ${p.name}!`, `All done for today, ${p.name}!`), I('Metsään tuli uusi ystävä.', 'A new friend came to the forest.')];
  const sc = r ? scoreCard(p, r) : null;
  if (sc) segs.push(...sc.segs);
  const nd = currentDay(p);
  const canNext = nd && nd <= todayNum();
  show(h('div', { class: 'screen end', style: { '--c': p.color } },
    h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs.slice(0, 2), p.lang))),
    h('div', { class: 'reward' }, h('div', { class: 'creature' }, cr), h('div', {}, T(p, `Päivä ${d} tehty!`, `Day ${d} done!`))),
    sc ? sc.el : null,
    r?.money ? h('button', { class: 'big-btn alt', onclick: () => piggyBank(p) }, '🐷 ' + T(p, 'Säästöpossu', 'Piggy bank')) : null,
    p.level === 'leo' ? fingerBonus(p, d) : null,
    offlineList(p, d),
    h('div', { class: 'col-btns' },
      h('button', { class: 'big-btn', onclick: () => collection(p) }, '🌲 ' + T(p, 'Katso metsä', 'See the forest')),
      canNext ? h('button', { class: 'big-btn alt', onclick: () => home(p) }, '▶ ' + T(p, `Seuraava päivä (${nd})`, `Next day (${nd})`)) : null,
      h('button', { class: 'link-btn', onclick: profiles }, '🏠 ' + T(p, 'Alkuun', 'Home')))));
  sfx.fanfare(); confetti(30);
  say(p, segs);
}

/** Leo's optional goal: tap to say he kept his fingers out of his mouth, and earn a tooth sticker. */
function fingerBonus(p, d) {
  const st = ds(p, d);
  const box = h('div', { class: 'bonus' });
  const draw = () => {
    if (st.fingers) {
      box.replaceChildren(h('div', { class: 'bonus-got', html: toothSVG('sparkle') }), h('b', {}, T(p, 'Hammastarra ansaittu! 🦷⭐', 'Tooth sticker earned! 🦷⭐')));
      return;
    }
    const b = h('button', { class: 'big-btn tooth-btn' }, '🦷 ', T(p, 'Pidin sormet poissa suusta!', 'I kept my fingers out of my mouth!'));
    b.onclick = () => {
      st.fingers = true; save();
      sfx.bonus(); confetti(24);
      say(p, [I(`Mahtavaa, ${p.name}! Hampaasi kiittävät. Saat hammastarran!`, `Awesome, ${p.name}! Your teeth say thank you. Here is a tooth sticker!`)]);
      draw();
    };
    box.replaceChildren(b);
  };
  draw();
  return box;
}
const toothStickers = p => C.days.filter(d => mstate(p, C.month).days[d.day]?.fingers).length;

// ---------- writing practice ----------
/** Letters and numbers grouped for the writing screen and the parent area, coloured by mastery. */
export function writingGrid(p, onPick) {
  const groups = p.level === 'lili'
    ? [['Numerot', 'Numbers', ORDER.digits], ['Isot kirjaimet', 'Capitals', ORDER.upper], ['Pienet kirjaimet', 'Lowercase', ORDER.lower]]
    : [['Pienet kirjaimet', 'Lowercase', ORDER.lower], ['Isot kirjaimet', 'Capitals', ORDER.upper], ['Numerot', 'Numbers', ORDER.digits]];
  return h('div', { class: 'wgrid' }, groups.map(([fi, en, list]) => h('div', {},
    h('h3', {}, T(p, fi, en)),
    h('div', { class: 'wtiles' }, list.map(ch => {
      const m = mastery(p, 'write:' + ch);
      const b = h(onPick ? 'button' : 'div', { class: 'wtile ' + m.status, title: m.status }, ch);
      if (onPick) b.onclick = () => onPick(ch);
      return b;
    })))));
}
function writingBook(p) {
  const practise = ch => {
    sfx.unlock();
    const spec = { type: 'trace', skill: 'write:' + ch, chars: [ch], mode: 'ladder' };
    const queue = ACT.trace.generate(spec, p.level === 'lili').map(item => ({ type: 'trace', skill: spec.skill, item, who: p.id }));
    runSession({ queue, players: { [p.id]: p }, onDone: () => writingBook(p), onExit: () => writingBook(p) });
  };
  const segs = [I('Valitse kirjain tai numero, jota haluat harjoitella.', 'Pick a letter or number to practise.')];
  show(h('div', { class: 'screen', style: { '--c': p.color } },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', onclick: () => home(p) }, '←'), h('h2', { class: 'grow' }, '✏️ ' + T(p, 'Kirjoitus', 'Writing'))),
    h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs, p.lang))),
    writingGrid(p, practise),
    h('p', { class: 'legend' }, h('span', { class: 'wtile mastered' }, '✓'), ' ', T(p, 'osaan', 'mastered'), '  ',
      h('span', { class: 'wtile learning' }, '·'), ' ', T(p, 'harjoittelen', 'practising'))));
  say(p, segs);
}

// ---------- song book ----------
function songBook(p) {
  const list = p.level === 'lili' ? LILI_SONGS : SONG_ORDER;
  const runOne = (key, mode) => {
    sfx.unlock();
    const spec = { type: 'song', song: key, mode, skill: 'song:' + key + (mode === 'order' ? '-order' : '') };
    const queue = ACT.song.generate(spec, p.level === 'lili').map(item => ({ type: 'song', skill: spec.skill, item, who: p.id }));
    runSession({ queue, players: { [p.id]: p }, onDone: () => songBook(p), onExit: () => songBook(p) });
  };
  const segs = [I('Valitse laulu! Voit laulaa, täyttää aukon tai laittaa järjestykseen.', 'Pick a song! You can sing, fill the gap, or put it in order.')];
  show(h('div', { class: 'screen', style: { '--c': p.color } },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', onclick: () => home(p) }, '←'), h('h2', { class: 'grow' }, '🎵 ' + T(p, 'Laulut', 'Songs'))),
    h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs, p.lang))),
    h('div', { class: 'songlist' }, list.map(key => {
      const s = SONGS[key];
      const canOrder = s.items.length <= 12;
      return h('div', { class: 'songcard' },
        h('div', { class: 'songname' }, (s.pics?.[0] || '🎵') + ' ', T(p, s.title.fi, s.title.en)),
        h('div', { class: 'row wrap' },
          h('button', { class: 'btn primary', onclick: () => runOne(key, 'sing') }, '🎤 ' + T(p, 'Laula', 'Sing')),
          h('button', { class: 'btn', onclick: () => runOne(key, 'gap') }, '❓ ' + T(p, 'Täytä aukko', 'Fill the gap')),
          canOrder ? h('button', { class: 'btn', onclick: () => runOne(key, 'order') }, '🔀 ' + T(p, 'Järjestä', 'Put in order')) : null));
    }))));
  say(p, segs);
}

function collection(p) {
  const m = mstate(p, C.month);
  const n = C.days.filter(d => m.days[d.day]?.done).length;
  const all = n === C.days.length;
  const tog = S().together[C.month] || 0;
  const segs = [all ? I(`Metsä on valmis! Kaikki ${n} ystävää ovat täällä!`, `The forest is complete! All ${n} friends are here!`)
    : I(`Metsässä on ${n} ystävää.`, `There are ${n} friends in the forest.`)];
  show(h('div', { class: 'screen', style: { '--c': p.color } },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', onclick: () => home(p) }, '←'), h('h2', { class: 'grow' }, T(p, C.collection.title.fi, C.collection.title.en)), h('div', { class: 'chip' }, `${n}/${C.days.length}`)),
    h('div', { class: 'forest' + (all ? ' complete' : '') }, C.days.map(d => {
      const got = m.days[d.day]?.done;
      return h('div', { class: 'spot' + (got ? ' got' : '') }, got ? C.collection.creatures[d.day - 1] : '', h('small', {}, d.day));
    })),
    tog ? h('p', { class: 'center' }, `🤝 ${T(p, 'Yhdessä pelatut päivät', 'Days played together')}: ${tog}`) : null,
    p.level === 'leo' && toothStickers(p) ? h('p', { class: 'center stickers' }, T(p, 'Hammastarrat: ', 'Tooth stickers: '), '🦷'.repeat(toothStickers(p))) : null,
    h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs, p.lang)))));
  if (all) { sfx.fanfare(); confetti(40); }
  say(p, segs);
}

// ---------- together mode ----------
function together() {
  const leo = P('leo'), lili = P('lili');
  if (!leo.setup) return setup(leo, together);
  if (!lili.setup) return setup(lili, together);
  const d = currentDay(leo) ?? currentDay(lili);
  if (!d) return profiles();
  const lq = buildQueue(leo, C, d, { noReview: true, noOpener: true }), iq = buildQueue(lili, C, d, { noReview: true, noOpener: true });
  const q = [];
  // Opener: "Today is…" taking turns (Leo today, Lili tomorrow…), then Leo's tooth reminder.
  ACT.today.generate({}, false).forEach((item, i) => q.push({ type: 'today', skill: 'days:today', item, who: i % 2 ? 'lili' : 'leo' }));
  q.push({ type: 'tooth', skill: 'tooth', item: { pop: false }, who: 'leo' });
  for (let i = 0; i < Math.max(lq.length, iq.length); i++) { if (lq[i]) q.push(lq[i]); if (iq[i]) q.push(iq[i]); }
  runSession({
    queue: q, players: { leo, lili }, helper: leo, onExit: profiles,
    onDone: stats => {
      markDone(leo, d); markDone(lili, d);
      S().together[C.month] = (S().together[C.month] || 0) + 1; save();
      const cr = C.collection.creatures[d - 1];
      const segs = [I('Teitte sen yhdessä! Molemmat saivat uuden ystävän.', 'You did it together! You both got a new friend.')];
      const cards = [leo, lili].map(p => { const r = award(p, stats[p.id]); return r.money ? h('div', {}, h('b', {}, `${p.avatar} ${p.name}`), scoreCard(p, r).el) : null; });
      show(h('div', { class: 'screen end' },
        h('div', { class: 'guide' }, foxBox(), h('div', { class: 'bubble' }, segNodes(segs, 'fi'))),
        h('div', { class: 'reward' }, h('div', { class: 'creature' }, cr, ' ', cr), h('div', {}, `${leo.avatar} + ${lili.avatar} = 🤝`)),
        cards,
        h('div', { class: 'col-btns' },
          h('button', { class: 'big-btn', style: { '--c': leo.color }, onclick: () => collection(leo) }, `🌲 ${leo.name}`),
          h('button', { class: 'big-btn', style: { '--c': lili.color }, onclick: () => collection(lili) }, `🌲 ${lili.name}`),
          h('button', { class: 'link-btn', onclick: profiles }, '🏠 Alkuun'))));
      sfx.fanfare(); confetti(40);
      say(leo, segs);
    },
  });
}

// ---------- parent area ----------
function lock() {
  const a = rnd(6, 9), b = rnd(3, 9);
  let val = '';
  const disp = h('div', { class: 'lockval' }, '');
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'].map(k => h('button', {
    onclick: () => {
      if (k === '⌫') val = val.slice(0, -1);
      else if (k === 'OK') { if (Number(val) === a * b) return parent('leo'); val = ''; disp.classList.add('shake'); setTimeout(() => disp.classList.remove('shake'), 400); }
      else if (val.length < 3) val += k;
      disp.textContent = val;
    },
  }, String(k)));
  show(h('div', { class: 'screen lock' },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', onclick: profiles }, '←'), h('h2', {}, 'Parents')),
    h('p', { class: 'center' }, 'Answer to open the parent area:'),
    h('div', { class: 'lockq' }, `${a} × ${b} = `, disp),
    h('div', { class: 'pad' }, keys)));
}

function parent(tab) {
  const tabs = h('div', { class: 'tabs' }, ['leo', 'lili', 'settings'].map(t =>
    h('button', { class: t === tab ? 'sel' : '', onclick: () => parent(t) }, t === 'settings' ? '⚙️ Settings' : `${P(t).avatar} ${P(t).name}`)));
  const body = tab === 'settings' ? settingsView() : childView(P(tab));
  show(h('div', { class: 'screen parent' },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', onclick: profiles }, '←'), h('h2', { class: 'grow' }, `Parents · ${C.title.en}`)),
    tabs, body));
}

function childView(p) {
  const m = mstate(p, C.month);
  const done = C.days.filter(d => m.days[d.day]?.done).length;
  const skipped = C.days.filter(d => m.days[d.day]?.skipped).length;
  const skills = [...new Set(C.days.flatMap(d => (d[p.level] || []).map(s => s.skill)))].filter(s => s !== 'say');
  const rows = skills.map(s => ({ s, m: mastery(p, s) }));
  const order = { weak: 0, learning: 1, mastered: 2, new: 3 };
  rows.sort((a, b) => order[a.m.status] - order[b.m.status]);
  const mastered = rows.filter(r => r.m.status === 'mastered').length;
  const weak = rows.filter(r => r.m.status === 'weak');
  const label = s => C.skillNames?.[s] || (s.startsWith('write:') ? 'Writing ' + s.slice(6) : s);
  const chip = st => h('span', { class: 'st ' + st }, { weak: 'needs work', learning: 'learning', mastered: 'mastered ✓', new: 'not yet' }[st]);

  const langBtns = h('div', { class: 'row' }, [['fi', 'Suomi'], ['en', 'English']].map(([l, n]) =>
    h('button', { class: 'btn' + (p.lang === l ? ' primary' : ''), onclick: () => { p.lang = l; save(); parent(p.id); } }, n)));

  return h('div', { class: 'pview' },
    h('div', { class: 'stats' },
      h('div', {}, h('b', {}, `${done}/${C.days.length}`), h('small', {}, 'days done')),
      h('div', {}, h('b', {}, String(mastered)), h('small', {}, 'skills mastered')),
      h('div', {}, h('b', {}, String(weak.length)), h('small', {}, 'need work')),
      skipped ? h('div', {}, h('b', {}, String(skipped)), h('small', {}, 'skipped')) : null),
    weak.length ? h('p', { class: 'warnbox' }, '⚠️ Needs work: ', weak.map(r => label(r.s)).join(', ')) : null,
    moneyView(p),
    h('h3', {}, 'Session length'),
    h('div', { class: 'row' }, [['short', 'Short'], ['normal', 'Normal']].map(([k, n]) =>
      h('button', { class: 'btn' + ((p.sessionLength || 'short') === k ? ' primary' : ''), onclick: () => { p.sessionLength = k; save(); parent(p.id); } }, n))),
    h('p', { class: 'muted' }, p.level === 'lili'
      ? 'Short: about 6 activities plus "Today is…" (about 5 minutes). Normal: about 11.'
      : 'Short: about 12 activities plus "Today is…" and the tooth reminder (about 6–8 minutes). Normal: about 24. Same balance either way: today’s homework first, then writing and review.'),
    h('h3', {}, 'Instructions spoken in'), langBtns,
    h('p', { class: 'muted' }, 'Learning content (letters, words, sentences) is always in English, like the homework.'),
    h('button', { class: 'btn', onclick: () => setup(p, () => parent(p.id)) }, `${p.avatar} Change animal / colour`),
    standardsView(p),
    h('h3', {}, '✏️ Writing (letters and numbers)'),
    h('p', { class: 'muted' }, 'Green = mastered, yellow = practising, orange = needs work, white = not yet. Stroke order and direction are checked, not only the shape.'),
    writingGrid({ ...p, lang: 'en' }),
    p.level === 'leo' ? h('p', {}, `🦷 Fingers-out-of-mouth stickers this month: ${toothStickers(p)}`) : null,
    h('h3', {}, 'Days'),
    h('div', { class: 'days' }, C.days.map(d => dayRow(p, d))),
    h('h3', {}, 'Skills'),
    h('table', { class: 'skills' }, h('tr', {}, h('th', {}, 'Skill'), h('th', {}, 'Accuracy (last 10)'), h('th', {}, 'Status')),
      rows.map(r => h('tr', {}, h('td', {}, label(r.s)), h('td', {}, r.m.acc == null ? '–' : `${Math.round(r.m.acc * 100)}% · ${r.m.n} tries`), h('td', {}, chip(r.m.status))))),
    h('h3', {}, 'Reset'),
    h('button', { class: 'btn danger', onclick: async () => { if (await confirmModal(`Erase all of ${p.name}'s progress on this device? This cannot be undone.`, 'Erase', 'Cancel')) { resetProfile(p.id); parent(p.id); } } }, `Erase ${p.name}'s progress`));
}

/** Pocket money: this month's daily scores, total, paid out, and earlier months. */
function moneyView(p) {
  if (!moneyOn(p)) return p.level === 'lili' ? h('p', { class: 'muted' }, '💰 Pocket money is off for Lili (turn it on under ⚙️ Settings).') : null;
  const key = ym(), M = monthOf(p, key), t = totals(p, key);
  const days = Object.entries(M.days).sort(([a], [b]) => a.localeCompare(b));
  const label = { good: 'Good', medium: 'Medium', poor: 'Poor' };
  const hist = history(p).filter(x => x.key !== key);
  const payBtn = h('button', { class: 'btn primary' }, t.unpaid > 0 ? `💵 Paid out ${money(t.unpaid)}` : '💵 All paid ✓');
  payBtn.disabled = t.unpaid <= 0;
  payBtn.onclick = async () => {
    if (await confirmModal(`Record that you gave ${p.name} ${money(t.unpaid)}?`, 'Yes, paid', 'Cancel')) { payOut(p, key); parent(p.id); }
  };
  return h('div', {},
    h('h3', {}, `💰 Pocket money · ${key}`),
    h('div', { class: 'stats' },
      h('div', {}, h('b', {}, money(t.earned)), h('small', {}, 'earned this month')),
      h('div', {}, h('b', {}, money(t.paid)), h('small', {}, 'paid out')),
      h('div', {}, h('b', {}, money(t.unpaid)), h('small', {}, 'still to pay'))),
    h('div', { class: 'row wrap' }, payBtn),
    days.length ? h('div', { class: 'tablewrap' }, h('table', { class: 'skills' },
      h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Score'), h('th', {}, 'First-try %'), h('th', {}, 'Earned')),
      days.map(([d, x]) => h('tr', {}, h('td', {}, d), h('td', {}, h('span', { class: 'st ' + (x.score === 'good' ? 'mastered' : x.score === 'medium' ? 'learning' : 'weak') }, label[x.score])), h('td', {}, x.pct + '%'), h('td', {}, money(x.cents))))))
      : h('p', { class: 'muted' }, 'No sessions this month yet.'),
    M.paid.length ? h('p', { class: 'muted' }, 'Paid: ', M.paid.map(x => `${money(x.cents)} on ${new Date(x.at).toLocaleDateString()}`).join(', ')) : null,
    hist.length ? h('p', {}, h('b', {}, 'Earlier months: '), hist.map(x => `${x.key}: ${money(x.earned)} earned, ${money(x.paid)} paid`).join(' · ')) : null,
    h('p', { class: 'muted' }, `Score = answers right on the first try (second tries count half). Good ≥ ${thresholds().good}% earns ${money(AMOUNTS.good)}, Medium ≥ ${thresholds().medium}% earns ${money(AMOUNTS.medium)}, below that ${money(AMOUNTS.poor)}. Only the first finished session each day earns money; extra play earns stickers. Starts at $0 each month.`));
}

/** BC curriculum standards for this child's grade: practised / mastered, from the game skills mapped to each. */
export function standardsFor(p) {
  const cur = C.curriculum;
  if (!cur) return [];
  const grade = p.level === 'lili' ? 'K' : '1';
  const map = cur.skills[p.level] || {};
  const allSkills = new Set([...Object.keys(p.skills || {}), ...Object.keys(p.practiced || {})]);
  return cur.standards.filter(s => s.grade === grade).map(s => {
    const prefixes = Object.entries(map).filter(([, ids]) => ids.includes(s.id)).map(([pre]) => pre);
    const skills = [...allSkills].filter(k => prefixes.some(pre => k === pre || k.startsWith(pre)));
    const ms = skills.map(k => mastery(p, k));
    const tries = ms.reduce((a, m) => a + m.n, 0) + skills.reduce((a, k) => a + (p.practiced?.[k] || 0), 0);
    const scored = ms.filter(m => m.n > 0);
    let status = tries ? 'learning' : 'new';
    if (scored.length && scored.some(m => m.status === 'mastered') && !scored.some(m => m.status === 'weak')) status = 'mastered';
    else if (scored.some(m => m.status === 'weak')) status = 'weak';
    else if (!scored.length && tries) status = 'practised';
    return { ...s, tries, status };
  });
}
function standardsView(p) {
  const rows = standardsFor(p);
  if (!rows.length) return null;
  const chip = st => h('span', { class: 'st ' + (st === 'practised' ? 'learning' : st) }, { weak: 'needs work', learning: 'practising', practised: 'practised', mastered: 'mastered ✓', new: 'not yet' }[st]);
  const done = rows.filter(r => r.status !== 'new').length, mast = rows.filter(r => r.status === 'mastered').length;
  return h('div', {},
    h('h3', {}, `BC curriculum, ${p.level === 'lili' ? 'Kindergarten' : 'Grade 1'}`),
    h('p', { class: 'muted' }, `${done} of ${rows.length} standards practised, ${mast} mastered. Homework comes first; curriculum practice fills review rounds and light days.`),
    h('div', { class: 'tablewrap' }, h('table', { class: 'skills' },
      h('tr', {}, h('th', {}, 'Area'), h('th', {}, 'Standard'), h('th', {}, 'Tries'), h('th', {}, 'Status')),
      rows.map(r => h('tr', {}, h('td', {}, r.area.replace('English Language Arts', 'ELA').replace('Physical and Health Education', 'PHE')), h('td', {}, r.label), h('td', {}, String(r.tries)), h('td', {}, chip(r.status)))))));
}

function dayRow(p, d) {
  const x = mstate(p, C.month).days[d.day];
  const status = x?.done ? '✅' : x?.skipped ? '⏭' : d.day === currentDay(p) ? '👉' : '·';
  const st = ds(p, d.day);
  const offs = offlineFor(p, d);
  return h('details', { class: 'dayrow' },
    h('summary', {}, h('span', { class: 'ds' }, status), h('b', {}, `${WD_EN[wd(d.day)]} ${d.day}`), ' ', d.title.en),
    h('div', { class: 'dbody' },
      h('p', { class: 'sheet' }, '📄 ', d.sheet),
      offs.length ? h('div', { class: 'offs' }, offs.map(o => h('label', {}, h('input', { type: 'checkbox', checked: st.off[o.id] ? true : null, onchange: e => { st.off[o.id] = e.target.checked; save(); } }), ' ', o.en))) : null,
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn primary', onclick: () => startDay(p, d.day, () => parent(p.id)) }, '▶ Play now'),
        h('button', { class: 'btn', onclick: () => { markDone(p, d.day); parent(p.id); } }, '✓ Mark done'),
        h('button', { class: 'btn', onclick: () => { st.done = false; st.skipped = false; save(); parent(p.id); } }, '↺ Replay (undo done)'),
        h('button', { class: 'btn', onclick: () => { st.skipped = true; st.done = false; save(); parent(p.id); } }, '⏭ Skip'))));
}

function soundControls() {
  const s = S().settings;
  const vol = h('input', { type: 'range', id: 'vol', min: '0', max: '1', step: '0.05', value: String(s.volume) });
  const volLbl = h('span', {}, Math.round(s.volume * 100) + '%');
  vol.oninput = () => { s.volume = Number(vol.value); volLbl.textContent = Math.round(s.volume * 100) + '%'; setVolume(s.volume); save(); };
  vol.onchange = () => sfx.ok();
  const mute = h('button', { class: 'btn' + (s.muted ? ' primary' : '') }, s.muted ? '🔇 Muted (tap to unmute)' : '🔊 Mute music and sounds');
  mute.onclick = () => { s.muted = !s.muted; setMuted(s.muted); save(); parent('settings'); };
  const voice = h('button', { class: 'btn' + (s.songVoice ? ' primary' : '') }, s.songVoice ? '🗣️ Voice reads song words: on' : '🗣️ Voice reads song words: off');
  voice.onclick = () => { s.songVoice = !s.songVoice; save(); parent('settings'); };
  return h('div', { class: 'pview' },
    h('p', {}, 'Volume: ', vol, ' ', volLbl),
    h('div', { class: 'row wrap' }, mute, voice),
    h('p', { class: 'muted' }, 'Mute turns off music and sound effects. Kipinä’s spoken instructions stay on. The songs are original and generated in the browser. Text-to-speech can’t sing, so with the voice on it speaks each line in time with the melody.'));
}

function moneySettings() {
  const s = S().settings;
  const num = (key, def) => {
    const inp = h('input', { type: 'number', min: '0', max: '100', step: '5', value: String(s[key] ?? def), style: { width: '5em' } });
    inp.onchange = () => { const v = Math.max(0, Math.min(100, Number(inp.value) || def)); s[key] = v; save(); };
    return inp;
  };
  const lili = h('button', { class: 'btn' + (s.moneyLili ? ' primary' : '') }, s.moneyLili ? 'Lili earns money too: on' : 'Lili earns money too: off');
  lili.onclick = () => { s.moneyLili = !s.moneyLili; save(); parent('settings'); };
  return h('div', { class: 'pview' },
    h('p', {}, 'Good from ', num('goodPct', 80), ' % · Medium from ', num('mediumPct', 50), ' % (first-try answers; second tries count half)'),
    h('p', { class: 'muted' }, `Good earns ${money(AMOUNTS.good)} (two quarters), Medium ${money(AMOUNTS.medium)} (two dimes), Poor ${money(AMOUNTS.poor)} (a nickel). Leo always earns; Lili only if turned on.`),
    h('div', { class: 'row wrap' }, lili));
}

function settingsView() {
  const vs = speech.allVoices();
  const fi = speech.voiceFor('fi'), en = speech.voiceFor('en');
  const rate = h('input', { type: 'range', min: '0.6', max: '1.2', step: '0.05', value: String(S().settings.rate) });
  const rateLbl = h('span', {}, String(S().settings.rate));
  rate.oninput = () => { S().settings.rate = Number(rate.value); rateLbl.textContent = rate.value; speech.setRate(S().settings.rate); save(); };
  const monthSel = h('select', { onchange: e => { S().settings.month = e.target.value; save(); location.reload(); } },
    MONTHS.map(m => h('option', { value: m, selected: m === C.month ? true : null }, m)));
  return h('div', { class: 'pview' },
    h('h3', {}, 'Voices'),
    h('p', {}, '🇫🇮 Finnish: ', fi ? h('b', {}, fi.name) : h('b', { class: 'bad' }, 'not found'), ' ', h('button', { class: 'btn', onclick: () => speech.speak([{ lang: 'fi', text: 'Hei Leo ja Lili! Minä olen Kipinä.' }]) }, 'Test')),
    h('p', {}, '🇬🇧 English: ', en ? h('b', {}, en.name) : h('b', { class: 'bad' }, 'not found'), ' ', h('button', { class: 'btn', onclick: () => speech.speak([{ lang: 'en', text: 'Which one starts with the sound d, as in dog?' }]) }, 'Test')),
    !fi && vs.length ? h('p', { class: 'warnbox' }, 'No Finnish voice. On Samsung: Settings → General management → Text-to-speech output → choose Google as engine → ⚙️ → Install voice data → Finnish. Until then instructions are spoken in English.') : null,
    h('p', {}, 'Speech speed: ', rate, ' ', rateLbl),
    h('p', {}, 'Counting and number sequences: ', h('span', { class: 'row wrap inline' }, [['normal', 'Normal'], ['slow', 'Slow'], ['slower', 'Very slow']].map(([k, n]) =>
      h('button', { class: 'btn' + ((S().settings.counting || 'slow') === k ? ' primary' : ''), onclick: () => { S().settings.counting = k; save(); applySettings(); parent('settings'); speech.speak([{ lang: 'en', text: '5, 10, 15 …' }]); } }, n)))),
    h('p', { class: 'muted' }, 'Numbers in a sequence ("5, 10, 15 …") are spoken one at a time with a pause between them and a longer pause before the gap. The 🐌 button in a session replays the question slowly.'),
    h('h3', {}, '💰 Pocket money'),
    moneySettings(),
    h('h3', {}, 'Music and sound effects'),
    soundControls(),
    h('h3', {}, 'Songs we like'),
    h('p', { class: 'muted' }, 'Links open in a new tab, to play for the kids alongside the game.'),
    h('ul', { class: 'linklist' }, SONGS_WE_LIKE.map(s => h('li', {}, h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.title), ' – ', s.note, h('br'), h('small', { class: 'muted' }, s.url)))),
    h('h3', {}, 'Month'), h('p', {}, monthSel),
    h('h3', {}, 'About'),
    h('p', { class: 'muted' }, 'All progress is stored only on this device. No accounts, ads or tracking.'));
}

boot();
