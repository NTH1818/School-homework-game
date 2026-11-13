// Leo only: a friendly "fingers out of mouth" reminder with a happy tooth. Never shaming.
// Shown at the start of each session and as a short pop-up halfway through longer sessions.
// The wording and the animation change every time.
import { h, I } from '../ui.js';
import { S, save } from '../store.js';
import { mallet, hz } from '../sound.js';

const START = [
  ['Sormet pois suusta, niin hampaat pysyvät vahvoina!', 'Fingers out of mouth keeps your teeth strong!'],
  ['Hampaat hymyilevät, kun sormet leikkivät muualla!', 'Your teeth smile when your fingers play somewhere else!'],
  ['Kiireiset kädet, terveet hampaat!', 'Busy hands, healthy teeth!'],
  ['Jos sormi haluaa suuhun, purista käsi nyrkkiin ja laske viiteen. Osaat sen!', 'If a finger wants to go in your mouth, make a fist and count to five. You can do it!'],
  ['Sinun hampaasi ovat vahvat kuin leijonalla. Pidetään sormet ulkona!', 'Your teeth are strong like a lion’s. Let’s keep fingers outside!'],
  ['Hammas sanoo: kiitos, kun pidät sormet poissa suusta!', 'Tooth says: thank you for keeping your fingers out of your mouth!'],
  ['Sormet pelaavat, hampaat lepäävät. Hyvä tiimi!', 'Fingers play, teeth rest. Great team!'],
];
const POP = [
  ['Muistatko? Sormet pois suusta!', 'Remember? Fingers out of mouth!'],
  ['Hammas vilkuttaa: sormet ulkona!', 'Tooth waves: fingers outside!'],
  ['Hienoa, jatketaan! Kädet pöydällä.', 'Great, keep going! Hands on the table.'],
  ['Vahvat hampaat, vahva Leo!', 'Strong teeth, strong Leo!'],
];
const ANIMS = ['dance', 'sparkle', 'flex', 'wave', 'jump'];

export function toothSVG(anim) {
  return `<svg viewBox="0 0 120 130" class="tooth ${anim}" aria-hidden="true">
    <g class="tbody"><path d="M30 18 C 42 6, 52 16, 60 16 C 68 16, 78 6, 90 18 C 104 32, 98 58, 92 76 C 88 90, 86 118, 76 118 C 68 118, 68 92, 60 92 C 52 92, 52 118, 44 118 C 34 118, 32 90, 28 76 C 22 58, 16 32, 30 18 Z" fill="#fff" stroke="#93c5fd" stroke-width="4"/>
    <circle cx="47" cy="50" r="6" fill="#1f2937"/><circle cx="73" cy="50" r="6" fill="#1f2937"/>
    <circle cx="49" cy="48" r="2" fill="#fff"/><circle cx="75" cy="48" r="2" fill="#fff"/>
    <circle cx="38" cy="62" r="5" fill="#fda4af" opacity=".7"/><circle cx="82" cy="62" r="5" fill="#fda4af" opacity=".7"/>
    <path d="M48 64 Q60 76 72 64" stroke="#1f2937" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <g class="arm l"><path d="M24 64 Q10 56 8 42" stroke="#93c5fd" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <g class="arm r"><path d="M96 64 Q110 56 112 42" stroke="#93c5fd" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <g class="sparks"><path d="M14 16 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#facc15"/><path d="M104 96 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#facc15"/></g>
  </svg>`;
}

export default {
  type: 'tooth',
  practiceOnly: true,
  generate(spec) { return [{ pop: !!spec.pop }]; },
  render(it, api) {
    const st = S().settings;
    const list = it.pop ? POP : START;
    const key = it.pop ? 'toothPop' : 'toothStart';
    const i = ((st[key] ?? -1) + 1) % list.length;
    st[key] = i; save();
    const anim = ANIMS[Math.floor(Math.random() * ANIMS.length)];
    const [fi, en] = list[i].map(s => s.replace(/Leo/g, api.name));
    const ok = h('button', { class: 'btn primary big' }, '👍 ' + api.t('Selvä!', 'Got it!'));
    api.body.append(h('div', { class: 'toothbox' + (it.pop ? ' pop' : ''), html: toothSVG(anim) }), h('div', { class: 'toothtext' }, api.t(fi, en)), ok);
    ['C5', 'E5', 'G5'].forEach((n, k) => mallet(hz(n), k * 0.09, 0.2, 0.1));
    let done = false;
    const finish = () => { if (!done) { done = true; api.done(); } };
    ok.onclick = finish;
    api.prompt([I(fi, en)]).then(() => { if (it.pop) setTimeout(finish, 1200); });
    return {};
  },
};
