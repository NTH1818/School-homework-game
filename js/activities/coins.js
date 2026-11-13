// Canadian coins (BC Math K: names and attributes; Grade 1: values, counting the same coin).
// Canada has no penny since 2013, so the coins are nickel, dime, quarter, loonie and toonie.
// spec: {mode:'name'|'value'|'count', count?, choices?}
import { h, I, E, shuffle, sample, cycle, rnd } from '../ui.js';

export const COINS = {
  nickel: { cents: 5, label: '5¢', animal: '🦫', d: 64, fill: '#d6d8dc', rim: '#9ca3af', fi: 'viiden sentin kolikko' },
  dime: { cents: 10, label: '10¢', animal: '⛵', d: 56, fill: '#d6d8dc', rim: '#9ca3af', fi: 'kymmenen sentin kolikko' },
  quarter: { cents: 25, label: '25¢', animal: '🦌', d: 76, fill: '#d6d8dc', rim: '#9ca3af', fi: '25 sentin kolikko' },
  loonie: { cents: 100, label: '$1', animal: '🐦', d: 82, fill: '#e6b84a', rim: '#a8801f', fi: 'yhden dollarin kolikko', sides: 11 },
  toonie: { cents: 200, label: '$2', animal: '🐻‍❄️', d: 88, fill: '#e6b84a', rim: '#9ca3af', inner: '#d6d8dc', fi: 'kahden dollarin kolikko' },
};
const NAMES = Object.keys(COINS);

/** A drawn coin (simplified, not a copy of the real design): size, colour and shape match the real coins. */
export function coinEl(name, scale = 1) {
  const c = COINS[name], d = Math.round(c.d * scale), r = 50;
  let shape;
  if (c.sides) {
    const pts = Array.from({ length: c.sides }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / c.sides; return `${50 + 47 * Math.cos(a)},${50 + 47 * Math.sin(a)}`; }).join(' ');
    shape = `<polygon points="${pts}" fill="${c.fill}" stroke="${c.rim}" stroke-width="3"/>`;
  } else if (c.inner) {
    shape = `<circle cx="50" cy="50" r="47" fill="${c.inner}" stroke="${c.rim}" stroke-width="3"/><circle cx="50" cy="50" r="30" fill="${c.fill}"/>`;
  } else shape = `<circle cx="50" cy="50" r="47" fill="${c.fill}" stroke="${c.rim}" stroke-width="3"/><circle cx="50" cy="50" r="40" fill="none" stroke="${c.rim}" stroke-width="1" stroke-dasharray="2 3"/>`;
  return h('span', {
    class: 'coin', style: { width: d + 'px', height: d + 'px' },
    html: `<svg viewBox="0 0 100 100">${shape}<text x="50" y="47" text-anchor="middle" font-size="26">${c.animal}</text><text x="50" y="76" text-anchor="middle" font-size="17" font-weight="800" font-family="Nunito, sans-serif" fill="#374151">${c.label.replace(/1/g, 'I') /* Nunito's I is a plain bar: BC-style 1 */}</text></svg>`,
  });
}

export default {
  type: 'coins',
  generate(spec, lili) {
    const n = spec.count || 3, k = spec.choices || (lili ? 2 : 3);
    const pool = spec.coins || NAMES;
    if (spec.mode === 'mine') { // count the piggy bank: spec.coins = coin names, biggest first
      const total = spec.coins.reduce((a, n) => a + COINS[n].cents, 0);
      const opts = new Set([total]);
      for (const d of [5, -5, 10, -10, 25, -25]) if (opts.size < 3 && total + d > 0) opts.add(total + d);
      return [{ mode: 'mine', coins: spec.coins, total, choices: shuffle([...opts]) }];
    }
    if (spec.mode === 'count') {
      return Array.from({ length: n }, () => {
        const name = sample(['nickel', 'dime', 'loonie', 'toonie'], 1)[0], q = rnd(2, 5);
        const total = COINS[name].cents * q;
        const opts = new Set([total]);
        for (const d of [COINS[name].cents, -COINS[name].cents, COINS[name].cents * 2]) if (opts.size < k && total + d > 0) opts.add(total + d);
        return { mode: 'count', name, q, total, choices: shuffle([...opts]) };
      });
    }
    return cycle(pool, n).map(name => ({ mode: spec.mode, name, choices: shuffle([name, ...sample(NAMES.filter(x => x !== name), k - 1)]) }));
  },
  render(it, api) {
    let locked = false;
    const money = c => (c >= 100 ? (c % 100 ? `$${(c / 100).toFixed(2)}` : `$${c / 100}`) : `${c}¢`);
    const moneySay = c => (c >= 100 ? `${Math.floor(c / 100)} dollar${c >= 200 ? 's' : ''}${c % 100 ? ` and ${c % 100} cents` : ''}` : `${c} cents`);
    const moneyFiS = c => (c >= 100 ? `${Math.floor(c / 100)} ${c >= 200 ? 'dollaria' : 'dollari'}${c % 100 ? ` ja ${c % 100} senttiä` : ''}` : `${c} senttiä`);
    let btns, correctIdx, segs;
    if (it.mode === 'mine') {
      // Count your own money: the coins in the piggy bank, biggest first, adding up as you go.
      const row = h('div', { class: 'coinrow wrap' }, it.coins.map(n => coinEl(n, 0.7)));
      api.body.append(row);
      btns = it.choices.map(v => h('button', { class: 'numbtn' }, money(v)));
      correctIdx = it.choices.indexOf(it.total);
      segs = [I('Laske omat rahasi! Aloita isoimmasta kolikosta. Paljonko sinulla on?', 'Count your own money! Start with the biggest coin. How much do you have?')];
      btns.forEach((b, i) => b.onclick = () => {
        if (locked || b.disabled) return;
        if (i === correctIdx) { locked = true; b.classList.add('right'); api.correct({ say: [I(`Sinulla on ${moneyFiS(it.total)}!`, `You have ${moneySay(it.total)}!`)] }); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      });
      api.body.append(h('div', { class: 'numrow' }, btns));
      api.prompt(segs);
      const steps = []; let run = 0;
      it.coins.forEach(n => { run += COINS[n].cents; steps.push(money(run)); });
      return {
        hint() { [...row.children].forEach((c, i) => setTimeout(() => c.classList.add('counted'), i * 700)); return [I('Laske yhteen kolikko kerrallaan:', 'Add them up one coin at a time:'), E(steps.join(', '))]; },
        reveal() { locked = true; btns.forEach((b, i) => { if (i === correctIdx) b.classList.add('right'); else b.disabled = true; }); return [E(steps.join(', ')), I(`Yhteensä ${moneyFiS(it.total)}.`, `That makes ${moneySay(it.total)}.`)]; },
      };
    }
    if (it.mode === 'count') {
      api.body.append(h('div', { class: 'coinrow' }, Array.from({ length: it.q }, () => coinEl(it.name, 0.8))));
      btns = it.choices.map(v => h('button', { class: 'numbtn' }, money(v)));
      correctIdx = it.choices.indexOf(it.total);
      segs = [I(`Montako rahaa? ${it.q} kolikkoa:`, `How much money? ${it.q} coins:`), E(`${it.name}s`)];
    } else if (it.mode === 'value') {
      api.body.append(h('div', { class: 'coinrow' }, coinEl(it.name, 1.4)));
      btns = it.choices.map(n => h('button', { class: 'numbtn' }, money(COINS[n].cents)));
      correctIdx = it.choices.indexOf(it.name);
      segs = [I('Paljonko tämä kolikko on?', 'How much is this coin worth? It is a'), E(it.name)];
    } else {
      btns = it.choices.map(n => h('button', { class: 'card coincard' + (api.lili ? ' big' : '') }, coinEl(n, api.lili ? 1.2 : 1), h('span', { class: 'lbl' }, api.lili ? '' : n)));
      correctIdx = it.choices.indexOf(it.name);
      segs = [I('Etsi kolikko:', 'Find the'), E(it.name)];
    }
    btns.forEach((b, i) => b.onclick = () => {
      if (locked || b.disabled) return;
      if (i === correctIdx) { locked = true; b.classList.add('right'); api.correct({ say: [E(it.mode === 'count' ? moneySay(it.total) : `${it.name}, ${moneySay(COINS[it.name].cents)}`)] }); }
      else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
    });
    api.body.append(h('div', { class: it.mode === 'name' ? `grid g${btns.length}` : 'numrow' }, btns));
    api.prompt(segs);
    const c = COINS[it.name];
    return {
      hint() {
        const w = btns.filter((b, i) => i !== correctIdx && !b.disabled);
        if (w.length > 1) { w[0].disabled = true; w[0].classList.add('gone'); }
        if (it.mode === 'count') return [I(`Yksi on ${money(c.cents)}. Laske yhteen:`, `One is ${money(c.cents)}. Count them up:`), E(Array.from({ length: it.q }, (_, i) => money(c.cents * (i + 1))).join(', '))];
        return [I(`Siinä on ${c.animal}`, `It has a ${c.animal} on it`)];
      },
      reveal() {
        locked = true; btns.forEach((b, i) => { if (i === correctIdx) b.classList.add('right'); else b.disabled = true; });
        return it.mode === 'count' ? [E(`${it.q} ${it.name}s make ${moneySay(it.total)}`)] : [E(`${it.name} is ${moneySay(c.cents)}`)];
      },
    };
  },
};
