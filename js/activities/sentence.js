// Listen and build a sentence from word tiles. spec: {sentences:[{en, fi, e}], count?}
import { h, I, E, shuffle, cycle } from '../ui.js';

export default {
  type: 'sentence',
  generate(spec) { return cycle(spec.sentences, spec.count || 3).map(s => ({ ...s })); },
  render(it, api) {
    const words = it.en.split(' ');
    let pos = 0, locked = false;
    const slots = words.map(() => h('span', { class: 'wslot' }));
    let order = shuffle(words.map((_, i) => i));
    if (words.length > 1 && order.every((v, i) => v === i)) order.reverse();
    const tiles = order.map(i => {
      const b = h('button', { class: 'tile' }, words[i]);
      b.onclick = () => tap(b);
      return b;
    });
    api.body.append(
      h('div', { class: 'spic' }, it.e || ''),
      api.lang === 'fi' && it.fi ? h('div', { class: 'fi-tr' }, '🇫🇮 ', it.fi) : null,
      h('div', { class: 'sline' }, slots),
      h('div', { class: 'tiles' }, tiles));

    const place = b => {
      slots[pos].textContent = b.textContent; slots[pos].classList.add('filled');
      b.classList.add('used'); b.disabled = true; b.classList.remove('pulse');
      pos++;
      if (pos === words.length) { locked = true; api.correct({ say: [E(it.en)] }); }
      else api.speak([E(b.textContent.replace(/[.?!,]/g, ''))]);
    };
    function tap(b) {
      if (locked || b.disabled) return;
      if (b.textContent === words[pos]) place(b);
      else { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 450); api.wrong(); }
    }
    api.prompt([I('Kuuntele ja rakenna lause:', 'Listen and build the sentence:'), E(it.en, { hide: true })]);
    return {
      hint() {
        const nb = tiles.find(t => !t.disabled && t.textContent === words[pos]);
        if (nb) nb.classList.add('pulse');
        return [E(it.en, { slow: true, hide: true })];
      },
      reveal() {
        locked = true;
        words.forEach((w, i) => { slots[i].textContent = w; slots[i].classList.add('filled'); });
        tiles.forEach(t => { t.classList.add('used'); t.disabled = true; });
        return [E(it.en)];
      },
    };
  },
};
