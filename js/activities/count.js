// Count pictures and choose the number. Tapping a picture counts it out loud.
// spec: {mode:'count'|'add'|'take', min?, max?, count?, choices?, emoji?, what?:{fi,en}, lang?:'en'|'inst'}
//  add  – two groups, "how many altogether?"   take – some go away, "how many are left?"
import { h, I, E, rnd, pickOne, shuffle } from '../ui.js';

const EMO = ['🍎', '⭐', '🐟', '🍓', '🎈', '🐞', '🐦', '🌸'];

export default {
  type: 'count',
  generate(spec, lili) {
    const n = spec.count || 4, mode = spec.mode || 'count';
    const min = spec.min ?? 1, max = spec.max ?? (lili ? 5 : 10), k = spec.choices || (lili ? 3 : 4);
    const out = [];
    let last = -1;
    for (let i = 0; i < n; i++) {
      let a = 0, b = 0, ans;
      for (let g = 0; g < 20; g++) {
        if (mode === 'add') { a = rnd(1, Math.max(1, max - 1)); b = rnd(1, Math.max(1, max - a)); ans = a + b; }
        else if (mode === 'take') { a = rnd(Math.max(2, min), max); b = rnd(1, a - 1); ans = a - b; }
        else { ans = rnd(min, max); }
        if (ans !== last) break;
      }
      last = ans;
      const ch = new Set([ans]);
      for (let g = 0; ch.size < k && g < 50; g++) { const v = ans + rnd(-3, 3); if (v >= 0 && v <= max + 3) ch.add(v); }
      out.push({ mode, a, b, n: ans, e: spec.emoji || pickOne(EMO), what: spec.what, lang: spec.lang || 'inst', choices: [...ch].sort((x, y) => x - y) });
    }
    return out;
  },
  render(it, api) {
    const num = n => (it.lang === 'en' ? E(String(n)) : I(String(n), String(n)));
    const what = it.what || { fi: 'kuvaa', en: 'pictures' };
    let objs = [];
    const area = h('div', { class: 'objs count' + (api.lili ? ' big' : '') });
    const mk = (cls = '') => { const o = h('button', { class: 'obj ' + cls }, it.e); objs.push(o); return o; };
    if (it.mode === 'add') {
      area.append(h('div', { class: 'grp' }, [...Array(it.a)].map(() => mk())), h('span', { class: 'plus' }, '+'), h('div', { class: 'grp' }, [...Array(it.b)].map(() => mk('b'))));
    } else if (it.mode === 'take') {
      area.append(...[...Array(it.a)].map(() => mk()));
      setTimeout(() => objs.slice(it.a - it.b).forEach(o => o.classList.add('away')), 1800);
    } else {
      area.append(...[...Array(it.n)].map(() => mk()));
    }
    api.body.append(area);
    const countable = () => (it.mode === 'take' ? objs.slice(0, it.a - it.b) : objs);

    // Tap-to-count support
    let counted = 0;
    objs.forEach((o, i) => o.onclick = () => {
      if (o.classList.contains('away') || o.dataset.n) return;
      o.dataset.n = ++counted; o.classList.add('counted');
      api.speak([num(counted)]);
    });

    let locked = false;
    const btns = it.choices.map(v => {
      const b = h('button', { class: 'numbtn' + (api.lili ? ' big' : '') }, h('span', {}, String(v)),
        api.lili && v <= 10 ? h('small', {}, '•'.repeat(v)) : null);
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (v === it.n) { locked = true; b.classList.add('right'); api.correct({ say: [num(v)] }); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    api.body.append(h('div', { class: 'numrow' }, btns));

    let p;
    if (it.mode === 'add') p = I(`${it.a} ja ${it.b}. Montako yhteensä?`, `${it.a} and ${it.b}. How many altogether?`);
    else if (it.mode === 'take') p = I(`${it.a} ${what.fi}. ${it.b} lähtee pois. Montako jää?`, `${it.a} ${what.en}. ${it.b} go away. How many are left?`);
    else p = I(`Montako ${what.fi}? Laske ja valitse.`, `How many ${what.en}? Count and choose.`);
    api.prompt([p]);

    return {
      hint() {
        const wr = btns.filter(b => !b.disabled && Number(b.textContent.replace(/•/g, '')) !== it.n);
        if (wr.length > 1) { const w = pickOne(wr); w.disabled = true; w.classList.add('gone'); }
        const c = countable();
        c.forEach(o => { delete o.dataset.n; o.classList.remove('counted'); });
        return { segs: c.map((_, i) => num(i + 1)), onSeg: i => c[i] && c[i].classList.add('counted') };
      },
      reveal() {
        locked = true;
        btns.forEach(b => { if (Number(b.firstChild.textContent) === it.n) b.classList.add('right'); else b.disabled = true; });
        countable().forEach(o => o.classList.add('counted'));
        return [I(`Niitä on ${it.n}.`, `There are ${it.n}.`)];
      },
    };
  },
};
