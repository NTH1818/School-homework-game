// Repeating patterns (BC Math K: 2–3 elements; Grade 1: multiple elements, predicting).
// spec: {cores?: ['AB','ABC',...], count?, choices?}
import { h, I, shuffle, sample, pickOne } from '../ui.js';

const SETS = [['🍎', '🍌', '🍇'], ['🔴', '🔵', '🟡'], ['🐶', '🐱', '🐭'], ['⭐', '🌙', '☀️'], ['🟥', '🟩', '🟦'], ['🚗', '🚌', '🚲']];

export default {
  type: 'pattern',
  generate(spec, lili) {
    const n = spec.count || 3;
    const cores = spec.cores || (lili ? ['AB', 'AB', 'ABC'] : ['AB', 'ABC', 'AAB', 'ABB', 'AABB']);
    return Array.from({ length: n }, () => {
      const core = pickOne(cores), set = shuffle(pickOne(SETS));
      const map = { A: set[0], B: set[1], C: set[2] };
      const len = lili ? 6 : 8;
      const seq = Array.from({ length: len + 1 }, (_, i) => map[core[i % core.length]]);
      const ans = seq[len];
      const choices = shuffle([...new Set([ans, ...set])]).slice(0, lili ? 2 : 3);
      if (!choices.includes(ans)) choices[0] = ans;
      return { seq: seq.slice(0, len), ans, choices: shuffle(choices), core };
    });
  },
  render(it, api) {
    let locked = false;
    const blank = h('span', { class: 'pcell q' }, '?');
    api.body.append(h('div', { class: 'prow' }, it.seq.map(s => h('span', { class: 'pcell' }, s)), blank));
    const btns = it.choices.map(c => {
      const b = h('button', { class: 'card big' }, h('span', { class: 'em' }, c));
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (c === it.ans) { locked = true; b.classList.add('right'); blank.textContent = c; blank.classList.add('filled'); api.correct(); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    api.body.append(h('div', { class: `grid g${btns.length}` }, btns));
    api.prompt([I('Mikä tulee seuraavaksi?', 'What comes next?')]);
    const coreLen = it.core.length;
    return {
      hint() {
        const cells = api.body.querySelectorAll('.prow .pcell:not(.q)');
        cells.forEach((c, i) => c.classList.toggle('core', i < coreLen));
        return [I('Katso, mikä osa toistuu.', 'Look at the part that repeats.')];
      },
      reveal() { locked = true; blank.textContent = it.ans; blank.classList.add('filled'); btns.forEach(b => { if (b.textContent === it.ans) b.classList.add('right'); else b.disabled = true; }); return [I('Kuvio jatkuu samalla tavalla.', 'The pattern keeps repeating.')]; },
    };
  },
};
