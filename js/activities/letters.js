// Letter knowledge (BC ELA K–1). spec: {mode:'case'|'name'|'syllable', letters?, words?, count?, choices?}
//  case     – "Which small letter matches G?" (uppercase/lowercase correspondence)
//  name     – hear a letter name, find it (Kindergarten letter knowledge)
//  syllable – hear a word, clap its syllables, pick how many (phonological awareness)
import { h, I, E, shuffle, sample, cycle, flash } from '../ui.js';
import { pic } from '../words.js';
import { clap } from '../sound.js';

const ABC = 'abcdefghijklmnopqrstuvwxyz'.split('');
// syllable counts for picture words
const SYL = { dog: 1, cat: 1, fish: 1, sun: 1, car: 1, ball: 1, apple: 2, rabbit: 2, robot: 2, zebra: 2, monkey: 2, pencil: 2, tiger: 2, rainbow: 2,
  teacher: 2, window: 2, banana: 3, dinosaur: 3, octopus: 3, elephant: 3, volcano: 3, strawberry: 3, watermelon: 4, broccoli: 3, umbrella: 3 };

export default {
  type: 'letters',
  generate(spec, lili) {
    const n = spec.count || (lili ? 3 : 4), k = spec.choices || (lili ? 2 : 4);
    if (spec.mode === 'syllable') {
      const words = spec.words || Object.keys(SYL);
      return cycle(words, n).map(w => ({ mode: 'syllable', word: w, n: SYL[w] || 1, choices: lili ? [1, 2, 3] : [1, 2, 3, 4] }));
    }
    const pool = spec.letters || ABC;
    return cycle(pool, n).map(l => {
      const ch = shuffle([l, ...sample(ABC.filter(x => x !== l && !(spec.confusable === false && 'bdpq'.includes(x))), k - 1)]);
      return { mode: spec.mode, letter: l, choices: ch, answer: ch.indexOf(l) };
    });
  },
  render(it, api) {
    let locked = false;
    if (it.mode === 'syllable') {
      const p = pic(it.word);
      const big = h('div', { class: 'sylpic' }, h('span', {}, p.e), h('b', {}, it.word));
      const clapBtn = h('button', { class: 'btn' }, '👏 ' + api.t('Taputa minun kanssani', 'Clap with me'));
      clapBtn.onclick = () => { for (let i = 0; i < it.n; i++) clap(i * 0.45); api.speak([E(it.word, { slow: true })]); };
      const btns = it.choices.map(v => {
        const b = h('button', { class: 'numbtn big' }, h('span', {}, String(v)), h('small', {}, '👏'.repeat(v)));
        b.onclick = () => {
          if (locked || b.disabled) return;
          if (v === it.n) { locked = true; b.classList.add('right'); for (let i = 0; i < v; i++) clap(i * 0.35); api.correct({ say: [E(it.word)] }); }
          else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
        };
        return b;
      });
      api.body.append(big, h('div', { class: 'numrow' }, btns));
      api.prompt([I('Montako taputusta tässä sanassa on?', 'How many claps are in this word?'), E(it.word, { slow: true })]);
      return {
        hint() { for (let i = 0; i < it.n; i++) clap(i * 0.5); return [I('Kuuntele ja taputa:', 'Listen and clap:'), E(it.word, { slow: true })]; },
        reveal() { locked = true; btns.forEach(b => { if (Number(b.firstChild.textContent) === it.n) b.classList.add('right'); else b.disabled = true; }); return [I(`Siinä on ${it.n} taputusta.`, `It has ${it.n} claps.`)]; },
      };
    }

    const show = it.mode === 'case' ? it.letter.toUpperCase() : '🔊';
    const target = h('div', { class: 'bigletter' }, show);
    const cards = it.choices.map((c, i) => {
      const b = h('button', { class: 'card letter' + (api.lili ? ' big' : '') }, h('span', { class: 'lt' }, it.mode === 'name' && api.lili ? c.toUpperCase() : c));
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (i === it.answer) { locked = true; b.classList.add('right'); api.correct({ say: [E(it.letter.toUpperCase())] }); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    if (it.mode === 'name') target.onclick = () => api.speak([E(it.letter.toUpperCase())]);
    api.body.append(target, h('div', { class: `grid g${cards.length}` }, cards));
    api.prompt(it.mode === 'case'
      ? [I('Mikä pieni kirjain sopii tähän isoon kirjaimeen?', 'Which small letter matches this capital letter?'), E(it.letter.toUpperCase())]
      : [I('Etsi kirjain', 'Find the letter'), E(it.letter.toUpperCase())]);
    return {
      hint() {
        const w = cards.filter((c, i) => i !== it.answer && !c.disabled);
        if (w.length > 1) { w[0].disabled = true; w[0].classList.add('gone'); }
        return [E(it.letter.toUpperCase(), { slow: true })];
      },
      reveal() {
        locked = true; cards.forEach((c, i) => { if (i === it.answer) c.classList.add('right'); else c.disabled = true; });
        return it.mode === 'case' ? [I('Iso', 'Capital'), E(it.letter.toUpperCase()), I('ja pieni', 'and small'), E(it.letter)] : [E(it.letter.toUpperCase())];
      },
    };
  },
};
