// Missing number in a row of the hundreds chart. spec: {max?:100|10, count?, choices?, lang?:'en'|'inst'}
import { h, I, E, rnd, sample, shuffle } from '../ui.js';

export default {
  type: 'hundred',
  generate(spec, lili) {
    const n = spec.count || 5, max = spec.max || 100, k = spec.choices || (lili ? 2 : 3);
    if (spec.step) { // skip-counting by 2s, 5s or 10s
      const s = spec.step;
      return Array.from({ length: n }, () => {
        const start = s * rnd(1, Math.max(1, Math.floor(max / s) - 5));
        const row = Array.from({ length: 6 }, (_, i) => start + i * s);
        const blank = rnd(1, 5), ans = row[blank];
        const cands = [ans + 1, ans - 1, ans + s * 2, ans + Math.ceil(s / 2)].filter(v => v > 0 && !row.includes(v) && v !== ans);
        const choices = shuffle([ans, ...sample([...new Set(cands)], k - 1)]);
        return { row, blank, choices, answer: choices.indexOf(ans), lang: spec.lang || (lili ? 'inst' : 'en'), step: s };
      });
    }
    return Array.from({ length: n }, () => {
      const start = max <= 10 ? 1 : rnd(0, 9) * 10 + 1;
      const row = Array.from({ length: 10 }, (_, i) => start + i);
      const blank = rnd(max <= 10 ? 1 : 2, 9);
      const ans = row[blank];
      // For 1–100 use tempting numbers that are NOT visible in the row (tens off, swapped digits).
      const swapped = ans >= 10 && ans % 10 ? Number(String(ans).split('').reverse().join('')) : null;
      const cands = (max <= 10 ? [ans - 1, ans + 1, ans + 2, ans - 2] : [ans + 10, ans - 10, swapped, ans + 20, ans - 20])
        .filter(v => v != null && v > 0 && v <= Math.max(max, 10) && v !== ans && (max <= 10 || !row.includes(v)));
      const choices = shuffle([ans, ...sample(cands, k - 1)]);
      return { row, blank, choices, answer: choices.indexOf(ans), lang: spec.lang || (lili ? 'inst' : 'en') };
    });
  },
  render(it, api) {
    const num = t => (it.lang === 'en' ? E(t) : I(t, t));
    const cells = it.row.map((v, i) => h('div', { class: 'hcell' + (i === it.blank ? ' blank' : '') }, i === it.blank ? '?' : String(v)));
    api.body.append(h('div', { class: 'hrow' + (it.step ? ' skip' : '') }, cells));
    if (it.step) api.body.prepend(h('div', { class: 'skiptag' }, api.t(`Hypitään ${it.step}:n välein`, `Skip-count by ${it.step}s`)));
    let locked = false;
    const btns = it.choices.map((v, j) => {
      const b = h('button', { class: 'numbtn' }, String(v));
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (j === it.answer) { locked = true; b.classList.add('right'); cells[it.blank].textContent = v; cells[it.blank].classList.add('filled'); api.correct({ say: [num(String(v))] }); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    api.body.append(h('div', { class: 'numrow' }, btns));
    const before = it.row.slice(0, it.blank);
    api.prompt([I('Mikä numero puuttuu? Laske:', 'Which number is missing? Count:'), num(before.join(', ') + ' …')]);
    return {
      hint() {
        const w = btns.filter((b, j) => j !== it.answer && !b.disabled);
        if (w.length > 1) { w[0].disabled = true; w[0].classList.add('gone'); }
        return { segs: before.map(v => num(String(v))), onSeg: i => cells[i] && cells[i].classList.add('flash') };
      },
      reveal() {
        locked = true; const a = it.choices[it.answer];
        cells[it.blank].textContent = a; cells[it.blank].classList.add('filled');
        btns.forEach((b, j) => { if (j === it.answer) b.classList.add('right'); else b.disabled = true; });
        return [num(it.row.slice(0, it.blank + 1).join(', '))];
      },
    };
  },
};
