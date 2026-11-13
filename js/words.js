// Picture word bank: English word -> [emoji, Finnish meaning].
// Add words here when a new month needs them. Missing words show ❓ (the game still works).
import { h } from './ui.js';

export const W = {
  // d
  dog: ['🐶', 'koira'], duck: ['🦆', 'ankka'], drum: ['🥁', 'rumpu'], door: ['🚪', 'ovi'], dinosaur: ['🦕', 'dinosaurus'],
  dolphin: ['🐬', 'delfiini'], donut: ['🍩', 'donitsi'], dice: ['🎲', 'noppa'], deer: ['🦌', 'peura'],
  // r
  rabbit: ['🐰', 'kani'], rainbow: ['🌈', 'sateenkaari'], robot: ['🤖', 'robotti'], rocket: ['🚀', 'raketti'], ring: ['💍', 'sormus'],
  rose: ['🌹', 'ruusu'], rain: ['🌧️', 'sade'], rooster: ['🐓', 'kukko'],
  // v
  van: ['🚐', 'pakettiauto'], violin: ['🎻', 'viulu'], volcano: ['🌋', 'tulivuori'], vase: ['🏺', 'maljakko'], vest: ['🦺', 'liivi'],
  volleyball: ['🏐', 'lentopallo'], vegetables: ['🥬', 'vihannekset'],
  // w
  whale: ['🐳', 'valas'], watch: ['⌚', 'rannekello'], window: ['🪟', 'ikkuna'], worm: ['🪱', 'mato'], web: ['🕸️', 'seitti'],
  watermelon: ['🍉', 'vesimeloni'], wolf: ['🐺', 'susi'], wave: ['🌊', 'aalto'],
  // o (short o as in octopus)
  octopus: ['🐙', 'mustekala'], otter: ['🦦', 'saukko'], ox: ['🐂', 'härkä'], olive: ['🫒', 'oliivi'],
  // y
  'yo-yo': ['🪀', 'jojo'], yarn: ['🧶', 'lanka'], yawn: ['🥱', 'haukotus'], yacht: ['⛵', 'purjevene'], yes: ['✅', 'kyllä'], yellow: ['🟡', 'keltainen'],
  // z
  zebra: ['🦓', 'seepra'], zero: ['0️⃣', 'nolla'], zucchini: ['🥒', 'kesäkurpitsa'], zipper: ['🤐', 'vetoketju'],
  // general / distractors
  cat: ['🐱', 'kissa'], sun: ['☀️', 'aurinko'], ball: ['⚽', 'pallo'], fish: ['🐟', 'kala'], moon: ['🌙', 'kuu'], hat: ['🎩', 'hattu'],
  tree: ['🌳', 'puu'], car: ['🚗', 'auto'], bus: ['🚌', 'bussi'], cake: ['🎂', 'kakku'], lion: ['🦁', 'leijona'], pig: ['🐷', 'possu'],
  kite: ['🪁', 'leija'], banana: ['🍌', 'banaani'], apple: ['🍎', 'omena'], bee: ['🐝', 'mehiläinen'], frog: ['🐸', 'sammakko'],
  house: ['🏠', 'talo'], monkey: ['🐵', 'apina'], nose: ['👃', 'nenä'], egg: ['🥚', 'muna'], 'ice cream': ['🍦', 'jäätelö'],
  goat: ['🐐', 'vuohi'], horse: ['🐴', 'hevonen'], bear: ['🐻', 'karhu'], key: ['🔑', 'avain'], tiger: ['🐯', 'tiikeri'],
  snake: ['🐍', 'käärme'], star: ['⭐', 'tähti'], mouse: ['🐭', 'hiiri'], book: ['📕', 'kirja'], milk: ['🥛', 'maito'], hand: ['✋', 'käsi'],
  // rhymes
  back: ['🔙', 'takaisin'], snack: ['🍿', 'välipala'], track: ['🛤️', 'rata'], pack: ['🎒', 'reppu'], black: ['⬛', 'musta'],
  sack: ['💰', 'säkki'], stack: ['🥞', 'pino'],
  Bill: ['👦', 'Bill (nimi)'], hill: ['⛰️', 'mäki'], pill: ['💊', 'pilleri'], chill: ['🥶', 'kylmä'], spill: ['🫗', 'läikkyä'],
  drill: ['🛠️', 'pora'], grill: ['🍖', 'grilli'],
  hot: ['🔥', 'kuuma'], pot: ['🍲', 'kattila'], dot: ['🔴', 'piste'], knot: ['🪢', 'solmu'], spot: ['🐆', 'täplä'], cot: ['🛏️', 'sänky'],
  // topics
  pencil: ['✏️', 'kynä'], teacher: ['🧑‍🏫', 'opettaja'], school: ['🏫', 'koulu'], teddy: ['🧸', 'nalle'], blocks: ['🧱', 'palikat'],
  strawberry: ['🍓', 'mansikka'], 'fire truck': ['🚒', 'paloauto'], heart: ['❤️', 'sydän'], tomato: ['🍅', 'tomaatti'],
  ladybug: ['🐞', 'leppäkerttu'], broccoli: ['🥦', 'parsakaali'], orange: ['🍊', 'appelsiini'], carrot: ['🥕', 'porkkana'],
  elephant: ['🐘', 'norsu'], phone: ['📱', 'puhelin'], tv: ['📺', 'televisio'], envelope: ['✉️', 'kirjekuori'], pizza: ['🍕', 'pizza'],
  poppy: ['🌺', 'unikko'], 'Remembrance Day': ['🌺', 'muistopäivä'], Christmas: ['🎄', 'joulu'], Halloween: ['🎃', 'halloween'],
  birthday: ['🎂', 'syntymäpäivä'], November: ['🍂', 'marraskuu'], July: ['☀️', 'heinäkuu'], March: ['🌱', 'maaliskuu'],
};

/** Generic picture words used as wrong answers. */
export const DISTRACT = ['cat', 'sun', 'ball', 'fish', 'moon', 'hat', 'tree', 'car', 'bus', 'cake', 'lion', 'pig', 'kite', 'banana',
  'apple', 'bee', 'frog', 'house', 'monkey', 'nose', 'egg', 'goat', 'horse', 'bear', 'key', 'tiger', 'snake', 'star', 'mouse', 'book', 'milk', 'hand'];

export function pic(w) { const x = W[w]; return { e: x ? x[0] : '❓', fi: x ? x[1] : w }; }

/** A picture card button. `mark` can highlight the first letter or a rhyme ending (shown on hint). */
export function wordCard(word, { big = false, mark = null, fi = false } = {}) {
  const p = pic(word);
  let label;
  if (mark?.first) label = h('span', { class: 'lbl' }, h('span', { class: 'f' }, word[0]), word.slice(1));
  else if (mark?.rime && word.endsWith(mark.rime)) label = h('span', { class: 'lbl' }, word.slice(0, -mark.rime.length), h('span', { class: 'r' }, mark.rime));
  else label = h('span', { class: 'lbl' }, word);
  return h('button', { class: 'card' + (big ? ' big' : '') },
    h('span', { class: 'em' }, p.e), label, fi ? h('span', { class: 'fi' }, p.fi) : null);
}
