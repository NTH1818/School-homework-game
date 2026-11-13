// Tap ALL the matching pictures (e.g. "all the red things", "all that start with d").
// spec: {prompt:{fi,en}, say?, words:[targets], distractors?, letter?, show?, targets?, count?, hint?, explain?}
import { h, I, E, shuffle, sample, flash } from '../ui.js';
import { DISTRACT, wordCard } from '../words.js';
import { sfx } from '../sound.js';

/** Shared tap-all logic. cards: [{node, target, say}] */
export function tapGrid(cards, api) {
  let found = 0, locked = false;
  const total = cards.filter(c => c.target).length;
  cards.forEach(c => {
    c.node.onclick = () => {
      if (locked || c.done || c.node.disabled) return;
      if (c.target) {
        c.done = true; c.node.classList.add('right'); found++;
        if (found === total) { locked = true; api.correct({ say: c.say || [] }); }
        else { sfx.tap(); api.speak(c.say || []); }
      } else {
        c.node.classList.add('wrong'); c.node.disabled = true;
        api.wrong();
      }
    };
  });
  return {
    flashOne() {
      const c = cards.find(c => c.target && !c.done);
      if (c) { c.node.classList.add('pulse'); setTimeout(() => c.node.classList.remove('pulse'), 2600); }
    },
    revealAll() {
      locked = true;
      cards.forEach(c => { if (c.target) c.node.classList.add('right'); else c.node.disabled = true; });
    },
  };
}

export default {
  type: 'tapall',
  generate(spec, lili) {
    const n = spec.count || 2, show = spec.show || (lili ? 4 : 6), nt = Math.min(spec.targets || (lili ? 2 : 3), spec.words.length);
    const distract = (spec.distractors || DISTRACT.filter(w => !spec.letter || w[0] !== spec.letter)).filter(w => !spec.words.includes(w));
    return Array.from({ length: n }, () => {
      const t = sample(spec.words, nt);
      const d = sample(distract, show - t.length);
      return { prompt: spec.prompt, say: spec.say, hint: spec.hint, explain: spec.explain, targets: t, cards: shuffle([...t, ...d]) };
    });
  },
  render(it, api) {
    const cards = it.cards.map(w => ({ node: wordCard(w), target: it.targets.includes(w), say: [E(w)] }));
    api.body.append(h('div', { class: `grid g${cards.length}` }, cards.map(c => c.node)));
    const g = tapGrid(cards, api);
    const segs = [I(it.prompt.fi, it.prompt.en)];
    if (it.say) segs.push(E(it.say));
    api.prompt(segs, () => api.speak(it.cards.map(w => E(w)), { onSeg: i => flash(cards[i].node) }));
    return {
      hint() { g.flashOne(); return it.hint ? [I(it.hint.fi, it.hint.en)] : segs; },
      reveal() { g.revealAll(); return it.explain ? [I(it.explain.fi, it.explain.en)] : [E(it.targets.join(', '))]; },
    };
  },
};
