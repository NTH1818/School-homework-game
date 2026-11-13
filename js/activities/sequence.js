// Days of the week / months of the year.
// spec: {set:'days'|'months', mode:'order'|'next', count?, choices?}
//  order – tap all of them in the right order     next – "What comes after Monday?"
import { h, I, E, shuffle, sample, flash } from '../ui.js';

export const SETS = {
  days: { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    fi: ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'] },
  months: { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fi: ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'] },
};

export default {
  type: 'sequence',
  generate(spec, lili) {
    const set = SETS[spec.set], L = set.en.length;
    if (spec.mode === 'order') return Array.from({ length: spec.count || 1 }, () => ({ mode: 'order', set: spec.set }));
    const k = spec.choices || (lili ? 2 : 3);
    return sample([...Array(L).keys()], spec.count || 4).map(idx => {
      const ans = (idx + 1) % L;
      const ch = shuffle([ans, ...sample([...Array(L).keys()].filter(i => i !== ans && i !== idx), k - 1)]);
      return { mode: 'next', set: spec.set, idx, choices: ch, answer: ch.indexOf(ans) };
    });
  },
  render(it, api) {
    const set = SETS[it.set], list = set.en;
    const fiSmall = i => (api.lang === 'fi' ? h('small', {}, set.fi[i]) : null);
    let locked = false;

    if (it.mode === 'order') {
      let pos = 0;
      const slots = list.map((_, i) => h('div', { class: 'qslot' }, h('i', {}, i + 1)));
      let order = shuffle([...list.keys()]);
      const tiles = order.map(i => {
        const b = h('button', { class: 'tile' }, list[i], fiSmall(i));
        b.onclick = () => {
          if (locked || b.disabled) return;
          if (i === pos) {
            slots[pos].replaceChildren(list[i]); slots[pos].classList.add('filled');
            b.classList.add('used'); b.disabled = true; b.classList.remove('pulse'); pos++;
            if (pos === list.length) { locked = true; api.correct({ say: [E(list.join(', '))] }); }
            else api.speak([E(list[i])]);
          } else { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 450); api.wrong(); }
        };
        return b;
      });
      tiles.byIdx = i => tiles[order.indexOf(i)];
      api.body.append(h('div', { class: 'qslots' }, slots), h('div', { class: 'tiles' }, tiles));
      api.prompt([it.set === 'days'
        ? I('Laita viikonpäivät järjestykseen. Aloita sunnuntaista.', 'Put the days of the week in order. Start with Sunday.')
        : I('Laita kuukaudet järjestykseen. Aloita tammikuusta.', 'Put the months in order. Start with January.')]);
      return {
        hint() { tiles.byIdx(pos)?.classList.add('pulse'); return [E(list.slice(0, pos + 1).join(', '))]; },
        reveal() {
          locked = true;
          slots.forEach((s, i) => { s.replaceChildren(list[i]); s.classList.add('filled'); });
          tiles.forEach(t => { t.classList.add('used'); t.disabled = true; });
          return [E(list.join(', '))];
        },
      };
    }

    // next
    const btns = it.choices.map((ci, j) => {
      const b = h('button', { class: 'tile big' }, list[ci], fiSmall(ci));
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (j === it.answer) { locked = true; b.classList.add('right'); api.correct({ say: [E(`${list[it.idx]}, ${list[ci]}`)] }); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    api.body.append(h('div', { class: 'seqq' }, h('span', { class: 'tile ghost' }, list[it.idx], fiSmall(it.idx)), h('span', { class: 'arrow' }, '➜'), h('span', { class: 'tile ghost q' }, '?')),
      h('div', { class: 'tiles col' }, btns));
    api.prompt([I('Mikä tulee tämän jälkeen:', 'What comes after'), E(list[it.idx])],
      () => api.speak(it.choices.map(ci => E(list[ci])), { onSeg: i => flash(btns[i]) }));
    return {
      hint() {
        const w = btns.filter((b, j) => j !== it.answer && !b.disabled);
        if (w.length > 1) { w[0].disabled = true; w[0].classList.add('gone'); }
        return [E(list.slice(Math.max(0, it.idx - 2), it.idx + 1).join(', ') + ' …', { slow: true })];
      },
      reveal() {
        locked = true;
        btns.forEach((b, j) => { if (j === it.answer) b.classList.add('right'); else b.disabled = true; });
        return [E(`${list[it.idx]}, ${list[it.choices[it.answer]]}`)];
      },
    };
  },
};
