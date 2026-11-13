// Find the rectangles among other shapes. spec: {count?, show?, targets?}
import { h, I, E, shuffle, rnd, pickOne, cycle } from '../ui.js';
import { tapGrid } from './tapall.js';

const PAL = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];
const OTHER = ['circle', 'oval', 'tri', 'star'];

function svg(s) {
  let inner;
  if (s.kind === 'rect') { const x = (100 - s.w) / 2, y = (100 - s.h) / 2; inner = `<rect x="${x}" y="${y}" width="${s.w}" height="${s.h}" rx="2" transform="rotate(${s.rot} 50 50)"/>`; }
  else if (s.kind === 'circle') inner = '<circle cx="50" cy="50" r="36"/>';
  else if (s.kind === 'oval') inner = '<ellipse cx="50" cy="50" rx="44" ry="26"/>';
  else if (s.kind === 'tri') inner = '<polygon points="50,12 90,86 10,86"/>';
  else inner = '<polygon points="50,8 61,38 93,38 67,57 77,89 50,70 23,89 33,57 7,38 39,38"/>';
  return `<svg viewBox="0 0 100 100" class="shape"><g fill="${s.fill}" stroke="#334155" stroke-width="3" stroke-linejoin="round">${inner}</g></svg>`;
}

export default {
  type: 'shapes',
  generate(spec, lili) {
    const n = spec.count || 3, show = spec.show || (lili ? 3 : 6), nt = spec.targets || (lili ? 1 : 3);
    return Array.from({ length: n }, () => {
      const rects = Array.from({ length: nt }, () => { const w = rnd(72, 88); return { kind: 'rect', w, h: Math.round(w / (1.6 + Math.random() * 0.8)), rot: pickOne([0, 0, 90]), fill: pickOne(PAL) }; });
      const others = cycle(OTHER, show - nt).map(kind => ({ kind, fill: pickOne(PAL) }));
      return { shapes: shuffle([...rects, ...others]) };
    });
  },
  render(it, api) {
    const cards = it.shapes.map(s => ({ node: h('button', { class: 'card shape-card', html: svg(s) }), target: s.kind === 'rect', say: [E('rectangle')] }));
    api.body.append(h('div', { class: `grid g${cards.length}` }, cards.map(c => c.node)));
    const g = tapGrid(cards, api);
    const one = cards.filter(c => c.target).length === 1;
    api.prompt(one
      ? [I('Mikä niistä on suorakulmio?', 'Which one is a rectangle?'), E('rectangle')]
      : [I('Napauta kaikkia suorakulmioita:', 'Tap all the rectangles:'), E('rectangle')]);
    return {
      hint() { g.flashOne(); return [I('Etsi muoto, jossa on neljä suoraa sivua ja neljä kulmaa.', 'Look for a shape with four straight sides and four corners.')]; },
      reveal() { g.revealAll(); return [I('Suorakulmiossa on neljä kulmaa: kaksi pitkää ja kaksi lyhyttä sivua.', 'A rectangle has four corners, two long sides and two short sides.')]; },
    };
  },
};
