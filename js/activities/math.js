// Addition and subtraction, taught the way a good Grade 1 teacher does (BC Math 1: "addition and
// subtraction to 20: understanding of operation and process"; Kindergarten: "decomposing 10",
// "subitizing", "change in quantity to 10, using concrete materials").
//
// Concrete → pictures → numbers: a new range starts with counters the child drags into a ten frame,
// then pictures, then the number sentence. Visual tools: ten frames, a number line with frog hops,
// number bonds (part-part-whole). Strategies are named and shown one at a time: counting on from the
// bigger number, counting back, doubles, making 10, and seeing small amounts at a glance.
// Fact families connect adding and subtracting. Story problems are spoken with pictures.
// A wrong answer gets a step-by-step walk-through on the ten frame or number line; a second miss
// shows the whole walk-through and then a similar question comes straight away.
//
// Ranges: within 5 → 10 → 20, moving up after 7 of the last 8 right (see mathLevel in engine.js).
// spec: {op: 'add'|'sub'|'mix'|'make'|'compare', count?, target?, max? (compare only), fixed?: true}
import { h, I, rnd, pickOne, shuffle, delay } from '../ui.js';
import { mallet, hz } from '../sound.js';
import { mathLevel } from '../engine.js';

const OBJ = [['🍎', 'apples', 'omenaa'], ['🚗', 'cars', 'autoa'], ['🐟', 'fish', 'kalaa'], ['🎈', 'balloons', 'ilmapalloa'],
  ['🧱', 'blocks', 'palikkaa'], ['⭐', 'stars', 'tähteä'], ['🐞', 'ladybugs', 'leppäkerttua']];
const FI_CASE = { Leo: { lla: 'Leolla', lle: 'Leolle' }, Lili: { lla: 'Lilillä', lle: 'Lilille' } };
const lla = n => FI_CASE[n]?.lla || n + 'lla', lle = n => FI_CASE[n]?.lle || n + 'lle';
const other = n => (n === 'Leo' ? 'Lili' : 'Leo');
const pron = n => (n === 'Lili' ? 'her' : 'him');

// Order of question types. Fresh = a new range: start hands-on.
const FMT = {
  leo: {
    add: { fresh: ['build', 'picture', 'line', 'sentence', 'story', 'bond', 'family', 'line', 'sentence', 'story'],
      usual: ['line', 'story', 'sentence', 'bond', 'family', 'sentence', 'build', 'line', 'story', 'sentence'] },
    sub: { fresh: ['build', 'picture', 'line', 'sentence', 'story', 'bond', 'family', 'line', 'sentence', 'story'],
      usual: ['line', 'story', 'family', 'sentence', 'bond', 'build', 'sentence', 'line', 'story', 'sentence'] },
  },
  lili: {
    add: { fresh: ['subitize', 'build', 'story', 'picture', 'subitize', 'bond', 'build', 'story'],
      usual: ['subitize', 'story', 'build', 'picture', 'bond', 'subitize', 'story', 'build'] },
    sub: { fresh: ['build', 'story', 'picture', 'build', 'line', 'story', 'picture', 'build'],
      usual: ['story', 'build', 'picture', 'line', 'story', 'build', 'picture', 'story'] },
  },
};

function strategy(op, a, b) {
  if (op === 'sub') return 'back';
  if (a === b) return 'double';
  if (a + b > 10 && Math.max(a, b) >= 6) return 'make10';
  return 'on';
}
/** One addition or subtraction fact within `max`. */
function fact(op, max, want) {
  let a, b;
  if (op === 'add') {
    if (want === 'double') { a = b = rnd(1, Math.floor(max / 2)); }
    else if (want === 'make10' && max > 10) { a = rnd(6, 9); b = rnd(11 - a, Math.min(9, max - a)); if (Math.random() < 0.5) [a, b] = [b, a]; }
    else { a = rnd(1, max - 1); b = rnd(1, Math.min(max - a, 9)); }
    return { op, a, b, ans: a + b };
  }
  a = rnd(2, max); b = rnd(1, Math.min(a - 1, 9));
  return { op, a, b, ans: a - b };
}

export default {
  type: 'math',
  generate(spec, lili, p) {
    const n = spec.count || 10;
    if (spec.op === 'make' || spec.op === 'compare') return oldGenerate(spec, n);
    const out = [], seen = new Set();
    const lvl = op => (p && !spec.fixed ? mathLevel(p, op) : { max: spec.max || 10 });
    const fresh = {};
    for (let i = 0, g = 0; out.length < n && g < 400; g++) {
      const op = spec.op === 'mix' ? (out.length % 2 ? 'sub' : 'add') : spec.op;
      const L = lvl(op);
      const max = lili ? Math.min(L.max, 10) : L.max;
      fresh[op] ??= !!L.fresh || !(p?.skills?.[spec.skill]?.n);
      const list = FMT[lili ? 'lili' : 'leo'][op][fresh[op] ? 'fresh' : 'usual'];
      const fmt = list[out.length % list.length];
      // Mix in a double or a make-10 fact now and then, so each strategy gets practised.
      const want = op === 'add' && !lili ? (out.length % 4 === 3 ? 'double' : out.length % 4 === 1 ? 'make10' : null) : null;
      let it;
      if (fmt === 'subitize') { const k = rnd(1, Math.min(max, lili ? 6 : 10)); it = { op: 'see', a: k, b: 0, ans: k }; }
      else it = fact(op, max, want);
      if (fmt === 'family' && it.op === 'add' && it.a === it.b) continue; // a double has only 2 facts
      const key = fmt + it.op + it.a + '_' + it.b;
      if (seen.has(key)) continue;
      seen.add(key);
      const o = pickOne(OBJ);
      out.push({ ...it, fmt, max, strat: strategy(it.op, it.a, it.b), e: o[0], objEn: o[1], objFi: o[2], bondMiss: rnd(0, 2), story: rnd(0, 1) });
      i++;
    }
    // The hands-on start is used up once generated; the next session starts as usual.
    if (p && !spec.fixed) for (const op of ['add', 'sub']) if (p.mathLevel?.[op]) delete p.mathLevel[op].fresh;
    return out;
  },

  render(it, api) {
    if (it.op === 'make' || it.op === 'compare') return oldRender(it, api);
    return teach(it, api);
  },
};

// ---------------- visual tools ----------------
function tenFrame(total, cap) {
  const cells = [];
  const frames = [];
  const nf = Math.max(1, Math.ceil(Math.max(cap, 10) / 10));
  for (let f = 0; f < nf; f++) {
    const fr = h('div', { class: 'tenframe' });
    for (let i = 0; i < 10; i++) { const c = h('span', { class: 'tf' }); cells.push(c); fr.append(c); }
    frames.push(fr);
  }
  return { el: h('div', { class: 'frames' }, frames), cells };
}
function numberLine(max) {
  const top = max <= 10 ? 10 : 20;
  const ticks = [];
  const line = h('div', { class: 'nline' + (top > 10 ? ' long' : '') });
  for (let i = 0; i <= top; i++) { const t = h('span', { class: 'ntick' }, h('b', {}, String(i))); ticks.push(t); line.append(t); }
  const frog = h('span', { class: 'frog' }, '🐸');
  line.append(frog);
  const place = n => { const t = ticks[n]; frog.style.left = (t.offsetLeft + t.offsetWidth / 2) + 'px'; };
  return {
    el: h('div', { class: 'nlwrap' }, line), ticks, place,
    async hop(from, steps, dir, say) {
      place(from); ticks[from].classList.add('start');
      for (let s = 1; s <= steps; s++) {
        await delay(650);
        const n = from + dir * s;
        frog.classList.remove('jump'); void frog.offsetWidth; frog.classList.add('jump');
        place(n); ticks[n].classList.add('hop');
        mallet(hz(['C5', 'D5', 'E5', 'G5', 'A5', 'C6'][Math.min(s - 1, 5)]), 0, 0.2, 0.12);
        say && say(n, s);
      }
    },
  };
}
function dots(n) { // dice pattern up to 6, ten-frame pattern above
  if (n <= 6) {
    const P = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[n];
    return h('div', { class: 'dice' }, [...Array(9)].map((_, i) => h('span', { class: P.includes(i) ? 'pip' : '' })));
  }
  const tf = tenFrame(10, 10);
  tf.cells.forEach((c, i) => { if (i < n) c.append(h('span', { class: 'pip' })); });
  return tf.el;
}
function pad(top, lili, onPick) {
  const el = h('div', { class: 'pad' + (top > 10 ? ' wide' : '') });
  for (let n = 0; n <= top; n++) {
    const b = h('button', {}, String(n));
    if (lili && n > 0 && n <= 10) b.append(h('small', { class: 'paddots' }, '•'.repeat(n)));
    b.onclick = () => onPick(n, b);
    el.append(b);
  }
  return el;
}

// ---------------- teaching one fact ----------------
function teach(it, api) {
  const { a, b, ans } = it;
  const add = it.op === 'add', sub = it.op === 'sub', lili = api.lili;
  const t = api.t;
  const sym = add ? '+' : '−';
  const plusFi = add ? 'plus' : 'miinus', plusEn = add ? 'plus' : 'take away';
  let locked = false, phase = 'answer';
  const ansBox = h('span', { class: 'ansbox' }, '?');
  const eq = h('div', { class: 'eq' + (lili ? ' small' : '') });
  const work = h('div', { class: 'work' });
  const help = h('div', { class: 'help' });
  const padTop = Math.max(10, it.op === 'see' ? 10 : add ? ans : a);
  const showEq = (withAns) => { eq.replaceChildren(`${a} ${sym} ${b} = `, withAns ? String(ans) : ansBox); };
  const sentence = () => I(`${a} ${plusFi} ${b} on ${ans}.`, `${a} ${plusEn} ${b} is ${ans}.`);
  const objs = (n, cls = '') => [...Array(n)].map(() => h('span', { class: 'obj ' + cls }, it.e));

  let onAnswer = null; // set per format; default checks against ans
  const pick = (n) => {
    if (locked || phase !== 'answer') return;
    if (onAnswer) return onAnswer(n);
    ansBox.textContent = n;
    if (n === ans) { win(); }
    else { ansBox.classList.add('shake'); setTimeout(() => { ansBox.classList.remove('shake'); if (!locked) ansBox.textContent = '?'; }, 600); api.wrong(); }
  };
  function win(extraSay = []) {
    locked = true;
    ansBox.textContent = ans; ansBox.classList.add('right');
    if (it.op !== 'see') { showEq(true); eq.classList.remove('hidden'); }
    api.correct({ say: it.op === 'see' ? [I(`${ans}!`, `${ans}!`)] : [...extraSay, sentence()] });
  }
  const numPad = pad(padTop, lili, pick);

  // ---------- walk-throughs (used by hint and reveal) ----------
  async function walkthrough(full) {
    help.replaceChildren();
    setTimeout(() => help.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }), 50);
    const speakSteps = segs => api.speak(segs);
    if (it.op === 'see') {
      help.append(dots(ans));
      return [I('Katso kuviota. Laske pisteet yksi kerrallaan.', 'Look at the pattern. Count the dots one at a time.')];
    }
    if (it.strat === 'double') {
      const tf = tenFrame(a + b, a + b > 10 ? 20 : 10);
      // two rows of the same number
      for (let i = 0; i < a; i++) tf.cells[i].append(h('span', { class: 'cnt' }, it.e));
      for (let i = 0; i < b; i++) tf.cells[(a + b > 10 ? 10 : 5) + i].append(h('span', { class: 'cnt b' }, it.e));
      help.append(tf.el);
      return [I(`${a} ja ${b} on tuplat: sama luku kaksi kertaa.`, `${a} and ${b} is a double: the same number twice.`),
        full ? I(`Tuplat ${a}: ${ans}.`, `Double ${a} is ${ans}.`) : I('Laske molemmat rivit.', 'Count both rows.')];
    }
    if (it.strat === 'make10') {
      const big = Math.max(a, b), small = Math.min(a, b), fill = 10 - big, rest = small - fill;
      const tf = tenFrame(ans, 20);
      help.append(tf.el);
      for (let i = 0; i < big; i++) tf.cells[i].append(h('span', { class: 'cnt' }, it.e));
      await delay(400);
      for (let i = 0; i < small; i++) {
        await delay(350);
        tf.cells[big + i].append(h('span', { class: 'cnt b' + (i < fill ? ' fill' : '') }, it.e));
      }
      return [I(`Tee ensin kymppi: ${big} ja ${fill} on 10.`, `Make 10 first: ${big} and ${fill} make 10.`),
        I(`Sitten vielä ${rest}.`, `Then ${rest} more.`), full ? I(`10 ja ${rest} on ${ans}.`, `10 and ${rest} is ${ans}.`) : I('Paljonko yhteensä?', 'How many altogether?')];
    }
    // counting on / counting back on the number line
    const nl = numberLine(it.max > 10 || ans > 10 || a > 10 ? 20 : 10);
    help.append(nl.el);
    await delay(50);
    const start = add ? Math.max(a, b) : a, steps = add ? Math.min(a, b) : b;
    const intro = add
      ? I(`Aloita isommasta luvusta, ${start}, ja laske eteenpäin ${steps}.`, `Start at the bigger number, ${start}, and count on ${steps}.`)
      : I(`Aloita luvusta ${start} ja laske taaksepäin ${steps}.`, `Start at ${start} and count back ${steps}.`);
    await speakSteps([intro]);
    const last = full ? steps : steps; // the frog lands; the child says where
    await nl.hop(start, last, add ? 1 : -1, n => api.speak([I(String(n), String(n))]));
    await delay(500);
    return [full ? I(`Sammakko on luvussa ${ans}.`, `The frog is on ${ans}.`) : I('Missä sammakko on nyt?', 'Where is the frog now?')];
  }

  // ---------- the formats ----------
  let segs;
  const fmt = it.fmt;
  if (fmt === 'subitize') {
    const show = h('div', { class: 'flash' }, dots(ans));
    const again = h('button', { class: 'small-btn' }, '👀 ' + t('Näytä uudestaan', 'Show again'));
    const flash = () => { show.classList.remove('gone'); setTimeout(() => show.classList.add('gone'), lili ? 2000 : 1300); };
    again.onclick = flash;
    work.append(show, again);
    segs = [I('Katso nopeasti! Montako pistettä näit?', 'Look quickly! How many dots did you see?')];
    setTimeout(flash, 300);
  } else if (fmt === 'build') {
    // Concrete: drag counters into the ten frame (or out of it for taking away).
    const tf = tenFrame(Math.max(a, ans), Math.max(a, ans) > 10 ? 20 : 10);
    const src = h('button', { class: 'tray' }, it.e);
    const bin = h('div', { class: 'bin' }, '🧺');
    let placed = 0, removed = 0;
    phase = 'build';
    const putOne = () => {
      if (phase !== 'build') return;
      const need = add ? a + b : a;
      if (placed >= need) return;
      tf.cells[placed].append(h('span', { class: 'cnt' + (add && placed >= a ? ' b' : '') }, it.e));
      placed++;
      mallet(hz('C5'), 0, 0.12, 0.1);
      api.speak([I(String(placed - (add && placed > a ? a : 0)), String(placed - (add && placed > a ? a : 0)))]);
      if (add && placed === a) { api.speak([I(`Hyvä! Nyt laita vielä ${b}.`, `Good! Now put ${b} more.`)]); }
      if (placed === need) {
        if (sub) { api.speak([I(`Nyt ota pois ${b}. Vedä ne koriin.`, `Now take away ${b}. Drag them to the basket.`)]); phase = 'take'; src.classList.add('hidden'); bin.classList.remove('hidden'); }
        else done();
      }
    };
    const takeOne = cell => {
      if (phase !== 'take' || !cell.firstChild || cell.classList.contains('out')) return;
      cell.classList.add('out'); removed++;
      mallet(hz('G4'), 0, 0.12, 0.1);
      api.speak([I(String(removed), String(removed))]);
      if (removed === b) done();
    };
    const done = () => {
      phase = 'answer';
      work.append(numPad);
      api.speak([add ? I('Montako yhteensä?', 'How many altogether?') : I('Montako jäi?', 'How many are left?')]);
    };
    // Drag with finger or S Pen; a tap works too.
    dragTo(src, tf.el, putOne);
    tf.cells.forEach(c => dragTo(c, bin, () => takeOne(c), () => phase === 'take' && c.firstChild && !c.classList.contains('out')));
    if (sub) { for (let i = 0; i < a; i++) tf.cells[i].append(h('span', { class: 'cnt' }, it.e)); placed = a; phase = 'take'; }
    bin.classList.toggle('hidden', !sub);
    src.classList.toggle('hidden', sub);
    work.append(h('div', { class: 'buildrow' }, src, tf.el, bin));
    segs = add ? [I(`Vedä ${a} ${it.objFi} ruudukkoon.`, `Drag ${a} ${it.objEn} into the frame.`)]
      : [I(`Ruudukossa on ${a}. Ota pois ${b}: vedä ne koriin.`, `There are ${a} in the frame. Take away ${b}: drag them to the basket.`)];
    if (!lili) { showEq(false); eq.classList.add('faint'); }
    return finishSetup();
  } else if (fmt === 'picture') {
    work.append(h('div', { class: 'objs' }, add ? [...objs(a), h('span', { class: 'plus' }, '+'), ...objs(b, 'b')] : objs(a).map((o, i) => { if (i >= a - b) o.classList.add('gone'); return o; })));
    if (!lili) showEq(false);
    segs = add ? [I(`${a} ${it.objFi} ja ${b} lisää. Montako yhteensä?`, `${a} ${it.objEn} and ${b} more. How many altogether?`)]
      : [I(`${a} ${it.objFi}, ${b} lähtee pois. Montako jää?`, `${a} ${it.objEn}, ${b} go away. How many are left?`)];
  } else if (fmt === 'line') {
    const nl = numberLine(it.max > 10 || a > 10 || ans > 10 ? 20 : 10);
    const start = add ? Math.max(a, b) : a, steps = add ? Math.min(a, b) : b;
    let hops = 0;
    const hopBtn = h('button', { class: 'btn primary' }, (add ? '🐸 ➡️ ' : '⬅️ 🐸 ') + t('Hyppää', 'Hop'));
    phase = 'hop';
    hopBtn.onclick = () => {
      if (phase !== 'hop') return;
      hops++;
      const n = start + (add ? hops : -hops);
      nl.place(n); nl.ticks[n].classList.add('hop');
      mallet(hz(['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6'][Math.min(hops - 1, 8)]), 0, 0.2, 0.12);
      api.speak([I(String(hops), String(hops))]);
      if (hops === steps) { phase = 'answer'; hopBtn.remove(); work.append(numPad); api.speak([I('Missä sammakko on nyt?', 'Where is the frog now?')]); }
    };
    work.append(nl.el, hopBtn);
    setTimeout(() => { nl.place(start); nl.ticks[start].classList.add('start'); }, 30);
    showEq(false);
    segs = add ? [I(`${a} plus ${b}. Sammakko aloittaa isommasta luvusta, ${start}. Hyppää ${steps} kertaa eteenpäin.`, `${a} plus ${b}. The frog starts at the bigger number, ${start}. Hop ${steps} times forward.`)]
      : [I(`${a} miinus ${b}. Sammakko aloittaa luvusta ${a}. Hyppää ${b} kertaa taaksepäin.`, `${a} take away ${b}. The frog starts at ${a}. Hop ${b} times back.`)];
    return finishSetup();
  } else if (fmt === 'story') {
    const me = api.name, you = other(me);
    work.append(h('div', { class: 'objs' }, add ? [...objs(a), h('span', { class: 'plus' }, '+'), ...objs(b, 'b')] : objs(a).map((o, i) => { if (i >= a - b) o.classList.add('away'); return o; })));
    if (add) segs = it.story ? [I(`${lla(me)} on ${a} ${it.objFi}. ${you} antaa ${b} lisää. Montako ${lla(me)} on nyt?`, `${me} has ${a} ${it.objEn}. ${you} gives ${pron(me)} ${b} more. How many does ${me} have now?`)]
      : [I(`Pöydällä on ${a} ${it.objFi}. Kipinä tuo vielä ${b}. Montako pöydällä on nyt?`, `There are ${a} ${it.objEn} on the table. Kipinä brings ${b} more. How many are on the table now?`)];
    else segs = it.story ? [I(`${lla(me)} on ${a} ${it.objFi}. ${me} antaa ${b} ${lle(you)}. Montako jää?`, `${me} has ${a} ${it.objEn}. ${me} gives ${b} to ${you}. How many are left?`)]
      : [I(`Puussa on ${a} ${it.objFi}. ${b} putoaa alas. Montako jää puuhun?`, `There are ${a} ${it.objEn} in the tree. ${b} fall down. How many are left in the tree?`)];
  } else if (fmt === 'bond') {
    // Part-part-whole: the whole on top, the two parts below; one is missing.
    const whole = add ? ans : a, p1 = add ? a : b, p2 = add ? b : ans;
    const miss = add ? 'whole' : 'p2'; // the missing number is always the answer
    const circ = (v, cls, isMiss) => h('div', { class: 'bc ' + cls }, isMiss ? ansBox : String(v));
    work.append(h('div', { class: 'bond' }, circ(whole, 'w', miss === 'whole'), h('div', { class: 'bparts' }, circ(p1, 'p', false), circ(p2, 'p', miss === 'p2'))));
    segs = add ? [I(`Osat ovat ${a} ja ${b}. Mikä on kokonaisuus?`, `The parts are ${a} and ${b}. What is the whole?`)]
      : [I(`Kokonaisuus on ${a}. Yksi osa on ${b}. Mikä on toinen osa?`, `The whole is ${a}. One part is ${b}. What is the other part?`)];
    return finishSetup(true);
  } else if (fmt === 'family') {
    // Fact family: the same three numbers make + and − facts.
    const c = add ? ans : a, x = add ? a : b, y = add ? b : ans;
    const facts = [[`${x} + ${y} = ${c}`, null], [`${c} − ${y} = `, x], [`${c} − ${x} = `, y]];
    const rows = facts.map(([txt, need]) => h('div', { class: 'frow' }, txt, need == null ? '' : h('span', { class: 'ansbox' }, '?')));
    work.append(h('div', { class: 'family' }, h('div', { class: 'tri' }, h('b', {}, String(c)), h('span', {}, `${x}   ${y}`)), h('div', { class: 'frows' }, rows)));
    let step = 1;
    rows.forEach((r, i) => r.classList.toggle('dim', i > 1));
    onAnswer = n => {
      const need = facts[step][1], box = rows[step].querySelector('.ansbox');
      box.textContent = n;
      if (n !== need) { box.classList.add('shake'); setTimeout(() => { box.classList.remove('shake'); box.textContent = '?'; }, 600); api.wrong(); return; }
      box.classList.add('right');
      step++;
      if (step < facts.length) { rows[step].classList.remove('dim'); api.speak([I(`Oikein! Entä ${c} miinus ${x}?`, `Right! And ${c} take away ${x}?`)]); return; }
      locked = true;
      api.correct({ say: [I(`${x}, ${y} ja ${c} ovat samaa perhettä.`, `${x}, ${y} and ${c} are one fact family.`)] });
    };
    segs = [I(`Nämä kolme lukua ovat perhe: ${x}, ${y} ja ${c}. ${x} plus ${y} on ${c}. Paljonko on ${c} miinus ${y}?`,
      `These three numbers are a family: ${x}, ${y} and ${c}. ${x} plus ${y} is ${c}. So what is ${c} take away ${y}?`)];
    work.append(numPad);
    api.body.append(help, work);
    api.prompt(segs);
    return {
      async hint() {
        const need = facts[step][1];
        help.replaceChildren(h('div', { class: 'objs' }, [...Array(c)].map((_, i) => h('span', { class: 'obj' + (i >= need ? ' gone' : '') }, it.e))));
        return [I(`Kokonaisuus on ${c}. Ota pois ${c - need}. Laske, montako jää.`, `The whole is ${c}. Take away ${c - need}. Count how many are left.`)];
      },
      reveal() {
        locked = true;
        rows.forEach((r, i) => { const bx = r.querySelector('.ansbox'); if (bx) { bx.textContent = facts[i][1]; bx.classList.add('right'); } r.classList.remove('dim'); });
        api.again(similar(it));
        return [I(`${x} plus ${y} on ${c}, joten ${c} miinus ${y} on ${x} ja ${c} miinus ${x} on ${y}. Kokeillaan samanlaista!`,
          `${x} plus ${y} is ${c}, so ${c} take away ${y} is ${x}, and ${c} take away ${x} is ${y}. Let's try one like it!`)];
      },
    };
  } else {
    // sentence: the number sentence only (after concrete and pictures)
    showEq(false);
    segs = [I(`Paljonko on ${a} ${plusFi} ${b}?`, `What is ${a} ${plusEn} ${b}?`)];
  }
  return finishSetup();

  function finishSetup(noEq) {
    api.body.append(...(noEq || it.op === 'see' ? [] : [eq]), help, work); // the walk-through shows above the pad
    if (phase === 'answer' && fmt !== 'family') work.append(numPad);
    api.prompt(segs);
    return {
      hint() {
        if (phase !== 'answer') {
          // still building/hopping: just repeat what to do
          return [I('Jatka: vedä tai hyppää, niin kuin Kipinä sanoi.', 'Keep going: drag or hop, like Kipinä said.')];
        }
        // The walk-through shows the steps one at a time and leaves the last step (the answer) to the child.
        delay(1600).then(() => { if (!locked) return walkthrough(false).then(s => api.speak(s)); });
        return [I('Katsotaan yhdessä.', "Let's look at it together.")];
      },
      reveal() {
        locked = true;
        delay(1400).then(() => walkthrough(true)).then(s => api.speak([...s, sentence(), I('Kokeillaan samanlaista!', "Let's try one like it!")]));
        if (it.op !== 'see') { showEq(true); ansBox.textContent = ans; ansBox.classList.add('right'); }
        api.again(similar(it));
        return { segs: [] };
      },
    };
  }
}

/** A question like this one (same type and strategy, numbers close by) for trying again right away. */
function similar(it) {
  for (let g = 0; g < 50; g++) {
    const f = it.op === 'see' ? { op: 'see', a: Math.max(1, Math.min(it.max, it.a + pickOne([-1, 1]))), b: 0 }
      : fact(it.op, it.max, it.strat === 'double' ? 'double' : it.strat === 'make10' ? 'make10' : null);
    f.ans = f.op === 'see' ? f.a : f.op === 'add' ? f.a + f.b : f.a - f.b;
    if (f.a === it.a && f.b === it.b) continue;
    if (it.fmt === 'family' && f.op === 'add' && f.a === f.b) continue;
    return { ...it, ...f, strat: strategy(f.op, f.a, f.b), fmt: it.fmt === 'family' || it.fmt === 'bond' ? it.fmt : it.fmt === 'subitize' ? 'subitize' : 'line' === it.fmt ? 'line' : 'picture' };
  }
  return null;
}

/** Drag `el` onto `target` with finger, S Pen or mouse (a simple tap also counts). */
function dragTo(el, target, onDrop, can = () => true) {
  el.addEventListener('pointerdown', e => {
    if (!can()) return;
    e.preventDefault();
    const ghost = h('div', { class: 'ghost' }, el.querySelector('.cnt')?.textContent || el.textContent);
    document.body.append(ghost);
    const move = ev => { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; };
    move(e);
    const x0 = e.clientX, y0 = e.clientY;
    const up = ev => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      ghost.remove();
      const r = target.getBoundingClientRect();
      const tap = Math.hypot(ev.clientX - x0, ev.clientY - y0) < 12;
      if (tap || (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom)) onDrop();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}

// ---------------- make 10 / compare (unchanged) ----------------
function oldGenerate(spec, n) {
  const max = spec.max || 10;
  const seen = new Set(), out = [];
  for (let g = 0; out.length < n && g < 500; g++) {
    let it;
    if (spec.op === 'make') { const T = spec.target || 10, a = rnd(1, T - 1); it = { op: 'make', a, b: T, target: T, ans: T - a }; }
    else { const a = rnd(1, max); const b = rnd(1, max); if (a === b) continue; it = { op: 'compare', a, b, ans: Math.max(a, b) }; }
    const key = it.op + it.a + '_' + it.b;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...it, e: pickOne(OBJ)[0] });
  }
  return out;
}
function oldRender(it, api) {
  let locked = false;
  if (it.op === 'compare') {
    const btns = shuffle([it.a, it.b]).map(v => {
      const b = h('button', { class: 'numbtn huge' }, String(v));
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (v === it.ans) { locked = true; b.classList.add('right'); api.correct({ say: [I(`${it.ans} on enemmän.`, `${it.ans} is more.`)] }); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    api.body.append(h('div', { class: 'numrow' }, btns));
    api.prompt([I(`Kumpi on enemmän: ${it.a} vai ${it.b}?`, `Which is more: ${it.a} or ${it.b}?`)]);
    return {
      hint() {
        const nl = numberLine(Math.max(it.a, it.b) > 10 ? 20 : 10);
        api.body.append(nl.el);
        setTimeout(() => { nl.ticks[it.a].classList.add('hop'); nl.ticks[it.b].classList.add('hop'); nl.place(it.ans); }, 30);
        return [I('Katso lukujanaa. Se, joka on oikealla, on enemmän.', 'Look at the number line. The one further along is more.')];
      },
      reveal() { locked = true; btns.forEach(b => { if (Number(b.textContent) === it.ans) b.classList.add('right'); else b.disabled = true; }); return [I(`${it.ans} on enemmän.`, `${it.ans} is more.`)]; },
    };
  }
  // make 10 (Lili: make 5) with a ten frame
  const T = it.target;
  const ans = h('span', { class: 'ansbox' }, '?');
  api.body.append(h('div', { class: 'eq' }, `${it.a} + `, ans, ` = ${T}`));
  const fr = h('div', { class: 'tenframe' + (T === 5 ? ' five' : '') }, [...Array(T)].map((_, i) => h('span', { class: 'tf' + (i < it.a ? ' full' : '') }, i < it.a ? it.e : '')));
  api.body.append(fr);
  const p = pad(T, api.lili, n => {
    if (locked) return;
    ans.textContent = n;
    if (n === it.ans) { locked = true; ans.classList.add('right'); api.correct({ say: [I(`${it.a} ja ${it.ans} on yhdessä ${T}.`, `${it.a} and ${it.ans} make ${T}.`)] }); }
    else { ans.classList.add('shake'); setTimeout(() => { ans.classList.remove('shake'); if (!locked) ans.textContent = '?'; }, 600); api.wrong(); }
  });
  api.body.append(p);
  api.prompt([I(`Montako lisää tarvitaan, että ${it.a} kasvaa ${T}:ksi?`, `${it.a} and how many more make ${T}?`)]);
  return {
    hint() { fr.querySelectorAll('.tf:not(.full)').forEach(c => c.classList.add('pulse')); return [I('Laske tyhjät ruudut.', 'Count the empty boxes.')]; },
    reveal() { locked = true; ans.textContent = it.ans; ans.classList.add('right'); return [I(`${it.a} ja ${it.ans} on yhdessä ${T}.`, `${it.a} and ${it.ans} make ${T}.`)]; },
  };
}
