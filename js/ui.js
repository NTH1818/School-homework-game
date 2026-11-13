// Small DOM + random helpers shared by everything.

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
    }
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const sample = (a, n) => shuffle(a).slice(0, n);
export const pickOne = a => a[Math.floor(Math.random() * a.length)];
/** n items from list, using every item before repeating. */
export function cycle(list, n) {
  const out = []; let pool = [];
  while (out.length < n) { if (!pool.length) pool = shuffle(list); out.push(pool.pop()); }
  return out;
}
export const delay = ms => new Promise(r => setTimeout(r, ms));

// Speech segments. I = instruction (shown/spoken in the child's language), E = English learning content.
export const I = (fi, en) => ({ k: 'i', fi, en: en ?? fi });
export const E = (text, o = {}) => ({ k: 'e', text, ...o });

export function segNodes(segs, lang) {
  const out = [];
  segs.forEach((s, i) => {
    if (i) out.push(' ');
    if (s.k === 'e') out.push(h('b', { class: 'en' }, s.hide ? '🔊' : s.text)); // hide = spoken but not shown (would give the answer away)
    else out.push(lang === 'en' ? s.en : s.fi);
  });
  return out;
}

export function flash(el) {
  if (!el) return;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 700);
}

export function confirmModal(text, yes, no) {
  return new Promise(res => {
    const close = v => { m.remove(); res(v); };
    const m = h('div', { class: 'modal' },
      h('div', { class: 'modal-box' },
        h('p', {}, text),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => close(false) }, no),
          h('button', { class: 'btn primary', onclick: () => close(true) }, yes))));
    document.body.append(m);
  });
}

// Kipinä, the guide fox (original character). Little spark on the head = "kipinä".
export function fox() {
  return `<svg viewBox="0 0 120 120" class="fox" aria-hidden="true">
  <path d="M14 10 L50 36 L26 62 Z" fill="#f97316"/><path d="M22 20 L42 37 L29 52 Z" fill="#7c2d12"/>
  <path d="M106 10 L70 36 L94 62 Z" fill="#f97316"/><path d="M98 20 L78 37 L91 52 Z" fill="#7c2d12"/>
  <path d="M18 52 Q60 18 102 52 Q104 88 60 112 Q16 88 18 52Z" fill="#fb923c"/>
  <path d="M22 64 Q42 70 60 112 Q30 98 22 64Z" fill="#fff"/><path d="M98 64 Q78 70 60 112 Q90 98 98 64Z" fill="#fff"/>
  <circle cx="44" cy="62" r="7" fill="#1f2937"/><circle cx="76" cy="62" r="7" fill="#1f2937"/>
  <circle cx="46.5" cy="59.5" r="2.4" fill="#fff"/><circle cx="78.5" cy="59.5" r="2.4" fill="#fff"/>
  <circle cx="34" cy="76" r="5" fill="#fda4af" opacity=".7"/><circle cx="86" cy="76" r="5" fill="#fda4af" opacity=".7"/>
  <ellipse cx="60" cy="94" rx="7" ry="5" fill="#1f2937"/>
  <path d="M53 100 Q60 107 67 100" stroke="#1f2937" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M60 14 L64 26 L76 27 L66 34 L70 46 L60 38 L50 46 L54 34 L44 27 L56 26 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
</svg>`;
}
