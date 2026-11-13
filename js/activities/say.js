// Say it out loud; a grown-up confirms. spec: {items:[{fi, en, say?, model?}], count?}
//  say   – English words spoken after the instruction (e.g. the word to repeat)
//  model – English example answer, played with "Listen" and on hint
import { h, I, E, segNodes } from '../ui.js';

export default {
  type: 'say',
  generate(spec) { return spec.items.slice(0, spec.count || spec.items.length).map(x => ({ ...x })); },
  render(it, api) {
    const segs = [I(it.fi, it.en)];
    if (it.say) segs.push(E(it.say));
    const okBtn = h('button', { class: 'btn primary big' }, '👍 ' + api.t('Sanoi!', 'Said it!'));
    const againBtn = h('button', { class: 'btn' }, '🔁 ' + api.t('Ei vielä', 'Not yet'));
    const listen = it.model ? h('button', { class: 'btn' }, '🔊 ' + api.t('Kuuntele malli', 'Listen to an example')) : null;
    if (listen) listen.onclick = () => api.speak([E(it.model)]);
    let locked = false;
    okBtn.onclick = () => { if (!locked) { locked = true; api.correct(); } };
    againBtn.onclick = () => { if (!locked) api.wrong(); };
    api.body.append(
      h('div', { class: 'saybox' }, h('div', { class: 'mic' }, '🗣️'), h('div', { class: 'saytext' }, segNodes(segs, api.lang)), listen),
      h('div', { class: 'parentrow' }, h('div', { class: 'who' }, api.t('Aikuinen painaa:', 'Grown-up taps:')), h('div', { class: 'row' }, againBtn, okBtn)));
    api.prompt(segs);
    return {
      hint() { return it.model ? [I('Kuuntele:', 'Listen:'), E(it.model)] : [I('Kokeile vielä!', 'Try once more!')]; },
      reveal() { locked = true; return it.model ? [E(it.model)] : []; },
    };
  },
};
