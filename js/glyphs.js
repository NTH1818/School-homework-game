// Hand-built letter and number shapes for writing practice: each glyph is a list of strokes in the
// order a child writes them, every stroke drawn in its writing direction.
//
// Stroke order and direction follow the parent's guide sheets ("Letter Tracing" A–N and
// "Number Formation" 0–10), which match the BC "Printing Like a Pro!" style: vertical manuscript,
// start at the top, one-part a and g. Letters O–Z (not on the sheet) use the same rules:
// straight lines go down first, then across; round letters go counter-clockwise from the top right.
// The t has a curved foot like Leo's homework sheet.
//
// Units: top line y=0, dotted middle line y=50, baseline y=100, descender line y=140.
// Each stroke: [SVG path in those units, talk key]. Talk keys are spoken during the demo.

export const TALK = {
  d: ['alas', 'down'],
  a: ['poikki', 'across'],
  r: ['ympäri', 'around'],
  ru: ['ympäri ja ylös', 'around and up'],
  u: ['ylös', 'up'],
  dot: ['piste', 'dot'],
  sd: ['vinosti alas', 'slide down'],
  su: ['vinosti ylös', 'slide up'],
  vv: ['vinosti alas, vinosti ylös', 'slide down, slide up'],
  ww: ['alas, ylös, alas, ylös', 'down, up, down, up'],
  hump: ['ylös, kaari ja alas', 'up, curve, down'],
  hk: ['alas ja koukku', 'down and hook'],
  bump: ['kaari', 'curve'],
  bump2: ['kaari ja kiinni', 'curve and close'],
  s: ['mutka taakse, mutka eteen', 'curve back, curve forward'],
  e: ['poikki ja ympäri', 'across and around'],
  f: ['kaari ja alas', 'curve and down'],
  u2: ['alas, kaari, ylös', 'down, curve, up'],
  z: ['poikki, vinosti, poikki', 'across, slide, across'],
  two: ['kaari, vinosti alas, poikki', 'curve, slide down, across'],
  three: ['kaari, kaari', 'curve, curve'],
  l4: ['alas ja poikki', 'down and across'],
  five: ['poikki, alas, iso maha', 'across, down, big tummy'],
  six: ['alas kaarella ja kiinni', 'curve down and close'],
  seven: ['poikki ja vinosti alas', 'across and slide down'],
  eight: ['mutka ja takaisin ylös', 'curve down and back up'],
  tail: ['häntä', 'tail'],
};

const B = 'M44 60.7 A22 25 0 1 0 44 89.3';          // a/d/g/q bowl, counter-clockwise from top right
const BR = 'M12 60.7 A22 25 0 1 1 12 89.3';         // b/p bowl, clockwise from the stem
const OCAP = 'M43.9 0.8 A34 50 0 0 0 32.1 99.2 A34 50 0 0 0 43.9 0.8';
const HUMP = 'M10 58 Q14 50 30 50 Q48 50 48 66 L48 100';

/** char -> {w: width, s: [[path, talk], ...]} */
export const GLYPHS = {
  // ---- lowercase ----
  a: { w: 58, s: [[B, 'r'], ['M48 50 L48 100', 'd']] },
  b: { w: 60, s: [['M8 0 L8 100', 'd'], [BR, 'bump2']] },
  c: { w: 58, s: [['M48.4 58.9 A24 25 0 1 0 48.4 91.1', 'r']] },
  d: { w: 58, s: [[B, 'r'], ['M48 0 L48 100', 'd']] },
  e: { w: 60, s: [['M8 75 L52 75 A22 25 0 1 0 46.9 91.1', 'e']] },
  f: { w: 50, s: [['M44 12 Q40 0 30 0 Q18 0 18 16 L18 100', 'f'], ['M4 50 L38 50', 'a']] },
  g: { w: 58, s: [[B, 'r'], ['M48 50 L48 124 Q48 142 30 142 Q16 142 10 133', 'hk']] },
  h: { w: 58, s: [['M10 0 L10 100', 'd'], [HUMP, 'hump']] },
  i: { w: 28, s: [['M14 50 L14 100', 'd'], ['M14 30 L14 31', 'dot']] },
  j: { w: 40, s: [['M30 50 L30 124 Q30 142 16 142 Q6 142 2 134', 'hk'], ['M30 30 L30 31', 'dot']] },
  k: { w: 54, s: [['M10 0 L10 100', 'd'], ['M44 50 L12 78', 'sd'], ['M22 70 L46 100', 'sd']] },
  l: { w: 28, s: [['M14 0 L14 100', 'd']] },
  m: { w: 82, s: [['M10 50 L10 100', 'd'], ['M10 58 Q13 50 26 50 Q41 50 41 64 L41 100', 'hump'], ['M41 58 Q44 50 57 50 Q72 50 72 64 L72 100', 'hump']] },
  n: { w: 58, s: [['M10 50 L10 100', 'd'], [HUMP, 'hump']] },
  o: { w: 58, s: [['M40 53.3 A24 25 0 0 0 16 96.65 A24 25 0 0 0 40 53.3', 'r']] },
  p: { w: 60, s: [['M8 50 L8 140', 'd'], [BR, 'bump2']] },
  q: { w: 58, s: [[B, 'r'], ['M48 50 L48 140', 'd']] },
  r: { w: 50, s: [['M10 50 L10 100', 'd'], ['M10 58 Q16 50 30 50 Q40 50 44 55', 'bump']] },
  s: { w: 52, s: [['M44 57 C40 49 12 47 10 62 C8 75 44 72 44 87 C44 102 14 102 8 93', 's']] },
  t: { w: 42, s: [['M18 10 L18 86 Q18 100 34 100', 'd'], ['M4 50 L36 50', 'a']] },
  u: { w: 58, s: [['M10 50 L10 80 Q10 100 29 100 Q48 100 48 80 L48 50', 'u2'], ['M48 50 L48 100', 'd']] },
  v: { w: 56, s: [['M6 50 L28 100 L50 50', 'vv']] },
  w: { w: 74, s: [['M4 50 L19 100 L37 54 L55 100 L70 50', 'ww']] },
  x: { w: 54, s: [['M8 50 L46 100', 'sd'], ['M46 50 L8 100', 'sd']] },
  y: { w: 56, s: [['M6 50 L28 98', 'sd'], ['M50 50 L16 140', 'sd']] },
  z: { w: 56, s: [['M8 50 L46 50 L8 100 L48 100', 'z']] },

  // ---- capitals ----
  A: { w: 76, s: [['M38 0 L6 100', 'sd'], ['M38 0 L70 100', 'sd'], ['M18 64 L58 64', 'a']] },
  B: { w: 72, s: [['M10 0 L10 100', 'd'], ['M10 0 L38 0 Q62 0 62 24 Q62 48 38 48 L10 48', 'bump'], ['M10 48 L42 48 Q66 48 66 74 Q66 100 42 100 L10 100', 'bump']] },
  C: { w: 76, s: [['M65.5 14.6 A36 50 0 1 0 65.5 85.4', 'r']] },
  D: { w: 78, s: [['M10 0 L10 100', 'd'], ['M10 0 L32 0 Q70 0 70 50 Q70 100 32 100 L10 100', 'bump']] },
  E: { w: 64, s: [['M10 0 L10 100', 'd'], ['M10 0 L56 0', 'a'], ['M10 50 L48 50', 'a'], ['M10 100 L56 100', 'a']] },
  F: { w: 62, s: [['M10 0 L10 100', 'd'], ['M10 0 L56 0', 'a'], ['M10 50 L48 50', 'a']] },
  G: { w: 80, s: [['M65.5 14.6 A36 50 0 1 0 75.9 54.4', 'ru'], ['M48 54 L76 54', 'a']] },
  H: { w: 72, s: [['M10 0 L10 100', 'd'], ['M62 0 L62 100', 'd'], ['M10 50 L62 50', 'a']] },
  I: { w: 60, s: [['M30 0 L30 100', 'd'], ['M8 0 L52 0', 'a'], ['M8 100 L52 100', 'a']] },
  J: { w: 68, s: [['M44 0 L44 72 Q44 100 24 100 Q8 100 4 86', 'hk'], ['M20 0 L64 0', 'a']] },
  K: { w: 72, s: [['M10 0 L10 100', 'd'], ['M62 0 L12 58', 'sd'], ['M28 42 L66 100', 'sd']] },
  L: { w: 62, s: [['M10 0 L10 100', 'd'], ['M10 100 L56 100', 'a']] },
  M: { w: 88, s: [['M10 0 L10 100', 'd'], ['M10 0 L44 90', 'sd'], ['M44 90 L78 0', 'su'], ['M78 0 L78 100', 'd']] },
  N: { w: 74, s: [['M10 0 L10 100', 'd'], ['M10 0 L64 100', 'sd'], ['M64 100 L64 0', 'u']] },
  O: { w: 76, s: [[OCAP, 'r']] },
  P: { w: 70, s: [['M10 0 L10 100', 'd'], ['M10 0 L38 0 Q64 0 64 26 Q64 52 38 52 L10 52', 'bump']] },
  Q: { w: 80, s: [[OCAP, 'r'], ['M46 70 L76 104', 'tail']] },
  R: { w: 72, s: [['M10 0 L10 100', 'd'], ['M10 0 L38 0 Q64 0 64 26 Q64 52 38 52 L10 52', 'bump'], ['M36 52 L66 100', 'sd']] },
  S: { w: 76, s: [['M64 14 C58 -1 14 -4 12 24 C10 47 66 47 66 74 C66 105 18 105 10 84', 's']] },
  T: { w: 76, s: [['M38 0 L38 100', 'd'], ['M6 0 L70 0', 'a']] },
  U: { w: 76, s: [['M10 0 L10 66 Q10 100 38 100 Q66 100 66 66 L66 0', 'u2']] },
  V: { w: 76, s: [['M6 0 L38 100 L70 0', 'vv']] },
  W: { w: 94, s: [['M4 0 L24 100 L47 22 L70 100 L90 0', 'ww']] },
  X: { w: 72, s: [['M8 0 L64 100', 'sd'], ['M64 0 L8 100', 'sd']] },
  Y: { w: 76, s: [['M6 0 L38 50', 'sd'], ['M70 0 L38 50', 'sd'], ['M38 50 L38 100', 'd']] },
  Z: { w: 74, s: [['M8 0 L64 0 L8 100 L66 100', 'z']] },

  // ---- digits (from the Number Formation sheet) ----
  0: { w: 58, s: [['M32.2 2.7 A24 48 0 0 0 23.8 97.3 A24 48 0 0 0 32.2 2.7', 'r']] },
  1: { w: 30, s: [['M15 0 L15 100', 'd']] }, // BC print: one straight line down, no flag, no base
  2: { w: 66, s: [['M8 24 Q10 0 32 0 Q56 0 56 26 Q56 44 36 62 L8 100 L58 100', 'two']] },
  3: { w: 64, s: [['M8 14 Q16 0 32 0 Q54 0 54 24 Q54 46 30 46 Q58 46 58 72 Q58 100 30 100 Q12 100 6 86', 'three']] },
  4: { w: 66, s: [['M10 0 L10 66 L60 66', 'l4'], ['M46 0 L46 100', 'd']] },
  5: { w: 64, s: [['M54 0 L14 0 L12 42 Q22 36 32 36 Q58 36 58 68 Q58 100 30 100 Q12 100 6 88', 'five']] },
  6: { w: 64, s: [['M52 10 Q44 0 32 0 Q8 0 8 54 Q8 100 34 100 Q58 100 58 74 Q58 50 34 50 Q14 50 9 66', 'six']] },
  7: { w: 64, s: [['M6 0 L58 0 L22 100', 'seven']] },
  8: { w: 64, s: [['M42 6 Q36 0 30 0 Q10 0 10 23 Q10 46 32 50 Q56 54 56 76 Q56 100 32 100 Q8 100 8 76 Q8 54 32 50 Q54 46 54 23 Q54 0 32 0', 'eight']] },
  9: { w: 58, s: [['M44 13.2 A22 24 0 1 0 44 40.8', 'r'], ['M48 3 L48 100', 'd']] },
};

// ---- sampling SVG paths into point lists (uses the browser's own path geometry) ----
const cache = new Map();
let svgPath = null;
function samplePath(d) {
  if (cache.has(d)) return cache.get(d);
  if (!svgPath) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute'; svg.style.left = '-9999px';
    svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(svgPath); document.body.append(svg);
  }
  svgPath.setAttribute('d', d);
  const len = svgPath.getTotalLength();
  const n = Math.max(2, Math.ceil(len / 2.5));
  const pts = [];
  for (let i = 0; i <= n; i++) { const p = svgPath.getPointAtLength((len * i) / n); pts.push([p.x, p.y]); }
  const out = { pts, len };
  cache.set(d, out);
  return out;
}

/**
 * Lay out a string (one character, or a number like "12") in glyph units.
 * Returns {w, strokes:[{pts, len, talk, ch, dot}]}, strokes numbered in writing order.
 */
export function layout(str) {
  const GAP = 14;
  let x = 0;
  const strokes = [];
  [...str].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    if (i) x += GAP;
    for (const [d, talk] of g.s) {
      const { pts, len } = samplePath(d);
      strokes.push({ pts: pts.map(p => [p[0] + x, p[1]]), len, talk, ch, dot: len < 4 });
    }
    x += g.w;
  });
  return { w: x, strokes };
}
export const hasGlyph = str => [...str].every(ch => GLYPHS[ch]);

/** Teaching order (Printing Like a Pro groups). */
export const ORDER = {
  lower: 'litfcoeadsurnmhbjgqpvwyxzk'.split(''),
  upper: 'LTIHFECOQGSUJPBRDVWXANMZYK'.split(''),
  digits: '1234567890'.split(''),
};
