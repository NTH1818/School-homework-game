// Pick one picture. Modes:
//  start  – "Which one starts with d?"         {letter, example, words}
//  rhyme  – "Which one rhymes with back?"      {base, rime, words}
//  word   – "Find the dog"                     {words}
//  custom – fixed questions                    {items:[{q:{fi,en}, say?, choices, answer, hint?, explain?}]}
import { h, I, E, shuffle, sample, cycle, flash } from '../ui.js';
import { pic, DISTRACT, wordCard } from '../words.js';

function distractors(spec, target, k) {
  let pool;
  if (spec.distractors) pool = spec.distractors;
  else if (spec.mode === 'word') pool = [...shuffle(spec.words), ...shuffle(DISTRACT)];
  else pool = shuffle(DISTRACT.filter(w => !spec.words.includes(w)));
  pool = pool.filter(w => w !== target);
  if (spec.mode === 'start') pool = pool.filter(w => w[0].toLowerCase() !== spec.letter);
  if (spec.mode === 'rhyme') pool = pool.filter(w => !w.endsWith(spec.rime));
  return [...new Set(pool)].slice(0, k);
}

export default {
  type: 'pick',
  generate(spec, lili) {
    const n = spec.count || (lili ? 4 : 6), k = spec.choices || (lili ? 2 : 4);
    if (spec.mode === 'custom') {
      const its = spec.shuffle === false ? spec.items : shuffle(spec.items);
      return its.slice(0, n).map(it => {
        const ans = it.choices[it.answer];
        const ch = shuffle([ans, ...sample(it.choices.filter((_, i) => i !== it.answer), k - 1)]);
        return { mode: 'custom', q: it.q, say: it.say, hint: it.hint, explain: it.explain, choices: ch, answer: ch.indexOf(ans) };
      });
    }
    return cycle(spec.words, n).map(t => {
      const ch = shuffle([t, ...distractors(spec, t, k - 1)]);
      return { mode: spec.mode, letter: spec.letter, example: spec.example, base: spec.base, rime: spec.rime, target: t, choices: ch, answer: ch.indexOf(t) };
    });
  },
  render(it, api) {
    const isWord = c => typeof c === 'string';
    const labelOf = c => (isWord(c) ? c : c.label);
    const mark = it.mode === 'start' ? { first: true } : it.mode === 'rhyme' ? { rime: it.rime } : null;
    const cards = it.choices.map((c, i) => {
      const node = isWord(c)
        ? wordCard(c, { big: api.lili, mark, fi: api.lang === 'fi' && it.mode === 'word' })
        : h('button', { class: 'card' + (api.lili ? ' big' : '') }, h('span', { class: 'em' }, c.e), h('span', { class: 'lbl' }, c.label));
      node.onclick = () => tap(i);
      return node;
    });
    const grid = h('div', { class: `grid g${cards.length}` }, cards);
    api.body.append(grid);

    let locked = false;
    function tap(i) {
      if (locked || cards[i].disabled) return;
      if (i === it.answer) {
        locked = true;
        cards[i].classList.add('right');
        api.correct({ say: it.mode === 'custom' ? [] : [E(labelOf(it.choices[i]))] });
      } else {
        cards[i].classList.add('wrong'); cards[i].disabled = true;
        api.wrong();
      }
    }

    let segs;
    if (it.mode === 'start') segs = [I('Mikä alkaa äänteellä', 'Which one starts with the sound'), E(`${it.letter}, as in ${it.example}`)];
    else if (it.mode === 'rhyme') segs = [I('Mikä rimmaa tämän kanssa:', 'Which one rhymes with'), E(it.base)];
    else if (it.mode === 'word') segs = [I('Etsi', 'Find the'), E(it.target)];
    else segs = it.say ? [I(it.q.fi, it.q.en), E(it.say)] : [I(it.q.fi, it.q.en)];
    const readAll = () => api.speak(it.choices.map(c => E(labelOf(c))), { onSeg: i => flash(cards[i]) });
    api.prompt(segs, readAll);

    return {
      hint() {
        grid.classList.add('hint');
        const wrongs = cards.filter((c, i) => i !== it.answer && !c.disabled);
        if (wrongs.length > 1) { const w = wrongs[Math.floor(Math.random() * wrongs.length)]; w.disabled = true; w.classList.add('gone'); }
        if (it.mode === 'start') return [I('Kuuntele alkuääntä:', 'Listen to the first sound:'), E(`${it.letter}, as in ${it.example}`, { slow: true })];
        if (it.mode === 'rhyme') return [I('Kuuntele sanan loppua:', 'Listen to the end of the word:'), E(it.base, { slow: true })];
        if (it.mode === 'word') return [I(`Suomeksi se on ${pic(it.target).fi}.`, `Look for the ${it.target}.`)];
        return it.hint ? [I(it.hint.fi, it.hint.en)] : [];
      },
      reveal() {
        locked = true;
        grid.classList.add('hint');
        cards.forEach((c, i) => { if (i === it.answer) c.classList.add('right'); else c.disabled = true; });
        const a = labelOf(it.choices[it.answer]);
        if (it.mode === 'start') return [E(a), I('alkaa äänteellä', 'starts with'), E(it.letter)];
        if (it.mode === 'rhyme') return [E(`${it.base}, ${a}`), I('Ne rimmaavat.', 'They rhyme.')];
        if (it.mode === 'word') return [I('Tässä on', 'Here is the'), E(a)];
        return it.explain ? [I(it.explain.fi, it.explain.en)] : [E(a)];
      },
    };
  },
};
