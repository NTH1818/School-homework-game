// Build a rhyming word: hear "sack", pick the first letter(s) for "_ack". spec: {rime, onsets, count?, choices?}
import { h, I, E, shuffle, sample, cycle } from '../ui.js';

export default {
  type: 'rhymebuild',
  generate(spec, lili) {
    const n = spec.count || 5, k = spec.choices || (lili ? 2 : 3);
    return cycle(spec.onsets, n).map(o => ({ rime: spec.rime, onset: o, choices: shuffle([o, ...sample(spec.onsets.filter(x => x !== o), k - 1)]) }));
  },
  render(it, api) {
    const word = it.onset + it.rime;
    const slot = h('span', { class: 'slot' }, '?');
    api.body.append(h('div', { class: 'wordbuild' }, slot, h('span', { class: 'rime' }, it.rime)));
    let locked = false;
    const btns = it.choices.map(o => {
      const b = h('button', { class: 'letterbtn' }, o);
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (o === it.onset) { locked = true; slot.textContent = o; slot.classList.add('filled'); api.correct({ say: [E(word)] }); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    api.body.append(h('div', { class: 'letterrow' }, btns));
    api.prompt([I('Tee sana', 'Make the word'), E(word, { hide: true })]);
    return {
      hint() {
        const w = btns.filter(b => b.textContent !== it.onset && !b.disabled);
        if (w.length > 1) { w[0].disabled = true; w[0].classList.add('gone'); }
        return [I('Kuuntele alkua:', 'Listen to the beginning:'), E(word, { slow: true, hide: true })];
      },
      reveal() {
        locked = true; slot.textContent = it.onset; slot.classList.add('filled');
        btns.forEach(b => { if (b.textContent !== it.onset) b.disabled = true; else b.classList.add('right'); });
        return [E(word), I(`Se alkaa kirjaimilla ${it.onset}.`, `It starts with ${it.onset}.`)];
      },
    };
  },
};
