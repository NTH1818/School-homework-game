// Daily score and pocket money (Canadian coins), adding up over the calendar month.
//  - Score: answers right on the first try count fully, on the second try half.
//    Good ≥ 80%, Medium ≥ 50%, Poor below (adjustable in the parent area).
//  - Good earns $0.50 (two quarters), Medium $0.20 (two dimes), Poor $0.05 (a nickel).
//  - Only the first completed session of each calendar day earns money; more play earns a sticker.
//  - Each calendar month starts at $0; past months stay in the history.
import { S, save } from './store.js';

export const AMOUNTS = { good: 50, medium: 20, poor: 5 };
export const EARN_COINS = { good: ['quarter', 'quarter'], medium: ['dime', 'dime'], poor: ['nickel'] };

/** Today's date (the test hook `__kipinaNow` lets a parent/test move the clock). */
export const now = () => (globalThis.__kipinaNow ? new Date(globalThis.__kipinaNow) : new Date());
const pad2 = n => String(n).padStart(2, '0');
export const ymd = (d = now()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const ym = (d = now()) => ymd(d).slice(0, 7);

export function moneyOn(p) { return p.id === 'leo' || !!S().settings.moneyLili; }
export function thresholds() { const s = S().settings; return { good: s.goodPct ?? 80, medium: s.mediumPct ?? 50 }; }

export function scoreOf(st) {
  const pct = st && st.n ? Math.round(((st.first + 0.5 * st.second) / st.n) * 100) : 100;
  const t = thresholds();
  return { pct, score: pct >= t.good ? 'good' : pct >= t.medium ? 'medium' : 'poor' };
}

function bank(p) { return (p.bank ||= { months: {}, stickers: 0 }); }
export function monthOf(p, key = ym()) { return (bank(p).months[key] ||= { days: {}, paid: [] }); }

/** Record a finished session. Returns what to show: score, cents earned now (0 if already earned today), coins, sticker. */
export function award(p, st) {
  const { pct, score } = scoreOf(st);
  const day = ymd(), M = monthOf(p, ym());
  if (!moneyOn(p)) return { pct, score, cents: 0, coins: [], money: false };
  if (M.days[day]) { // already earned today: extra play earns a sticker
    bank(p).stickers = (bank(p).stickers || 0) + 1; save();
    return { pct, score, cents: 0, coins: [], money: true, sticker: true, earnedToday: M.days[day] };
  }
  const cents = AMOUNTS[score];
  M.days[day] = { score, pct, cents, at: Date.now() };
  save();
  return { pct, score, cents, coins: EARN_COINS[score], money: true };
}

export function totals(p, key = ym()) {
  const M = monthOf(p, key);
  const earned = Object.values(M.days).reduce((a, d) => a + d.cents, 0);
  const paid = M.paid.reduce((a, x) => a + x.cents, 0);
  return { earned, paid, unpaid: earned - paid, days: Object.keys(M.days).length };
}
export function payOut(p, key = ym()) {
  const t = totals(p, key);
  if (t.unpaid > 0) { monthOf(p, key).paid.push({ cents: t.unpaid, at: Date.now() }); save(); }
  return t.unpaid;
}
export function history(p) { return Object.keys(bank(p).months).sort().reverse().map(k => ({ key: k, ...totals(p, k) })); }

/** Fewest Canadian coins for an amount (no pennies: amounts are always multiples of 5¢). */
export function coinsFor(cents) {
  const out = [];
  for (const [name, v] of [['toonie', 200], ['loonie', 100], ['quarter', 25], ['dime', 10], ['nickel', 5]]) while (cents >= v) { out.push(name); cents -= v; }
  return out;
}
export const money = c => (c >= 100 ? `$${(c / 100).toFixed(2)}` : `${c}¢`);
export const moneyEn = c => (c >= 100 ? `${Math.floor(c / 100)} dollar${c >= 200 ? 's' : ''}${c % 100 ? ` and ${c % 100} cents` : ''}` : `${c} cents`);
export const moneyFi = c => (c >= 100 ? `${Math.floor(c / 100)} dollaria${c % 100 ? ` ja ${c % 100} senttiä` : ''}`.replace(/^1 dollaria/, '1 dollari') : `${c} senttiä`);
