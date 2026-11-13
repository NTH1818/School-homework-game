// Song games. spec: {song:'days', mode:'sing'|'gap'|'order', gaps?, limit?}
//  sing  – karaoke: words light up as they're sung (pictures for pre-readers)
//  gap   – the song stops; tap the missing word, then it carries on
//  order – drag the cards into order; the song plays back your order when it's right
import { h, I, E, shuffle, sample, flash, rnd } from '../ui.js';
import { SONGS } from '../songs.js';
import { play, lyrics, parse } from '../music.js';
import { S } from '../store.js';

const voiceOn = () => S().settings.songVoice !== false;
const label = (song, i) => (song.labels ? song.labels[i] : song.items[i]);

export default {
  type: 'song',
  generate(spec, lili) {
    const song = SONGS[spec.song];
    const n = song.items.length;
    if (spec.mode === 'gap') {
      const k = spec.gaps || (lili ? 1 : 2);
      const max = lili ? Math.min(n, spec.limit || 5) : n;
      const gaps = sample([...Array(max).keys()].slice(1), Math.min(k, max - 1)).sort((a, b) => a - b);
      return [{ song: spec.song, mode: 'gap', gaps }];
    }
    if (spec.mode === 'order') return [{ song: spec.song, mode: 'order', limit: spec.limit || (lili ? 4 : n) }];
    return [{ song: spec.song, mode: 'sing' }];
  },
  render(it, api) {
    const song = parse(SONGS[it.song]);
    const L = lyrics(song, { pics: !!song.pics, big: api.lili });
    let player = null, locked = false;
    const stopAll = () => { player?.stop(); };
    api.onLeave?.(stopAll);

    if (it.mode === 'sing') {
      const again = h('button', { class: 'btn' }, '🔁 ' + api.t('Uudestaan', 'Again'));
      const ok = h('button', { class: 'btn primary big' }, '👍 ' + api.t('Lauloimme!', 'We sang it!'));
      const row = h('div', { class: 'row hiddenish' }, again, ok);
      const run = async () => {
        row.classList.add('hiddenish'); L.reset();
        player = play(song, { onToken: k => L.light(k), voice: voiceOn() });
        await player.done; row.classList.remove('hiddenish');
      };
      again.onclick = () => { stopAll(); run(); };
      ok.onclick = () => { stopAll(); api.done(); };
      api.body.append(h('div', { class: 'songtitle' }, '🎵 ', api.t(song.title.fi, song.title.en)), L.el, row);
      api.prompt([I('Lauletaan yhdessä! Taputa mukana.', "Let's sing together! Clap along.")]).then(run);
      return {};
    }

    if (it.mode === 'gap') {
      let gi = 0, from = 0;
      const numeric = !!song.labels;
      const choiceRow = h('div', { class: 'tiles' });
      api.body.append(h('div', { class: 'songtitle' }, '🎵 ', api.t(song.title.fi, song.title.en)), L.el, choiceRow);
      it.gaps.forEach(g => L.gap(g, true));
      const showChoices = g => {
        const n = api.lili ? 2 : 3;
        const max = song.items.length;
        const others = sample([...Array(max).keys()].filter(i => i !== g && Math.abs(i - g) <= 4), n - 1);
        const opts = shuffle([g, ...others]);
        choiceRow.replaceChildren(...opts.map(i => {
          const b = h('button', { class: 'tile big' }, song.pics?.[i] ? h('span', { class: 'tpic' }, song.pics[i]) : null, label(song, i));
          b.dataset.i = i;
          b.onclick = () => {
            if (locked || b.disabled) return;
            if (i === g) { fill(g); }
            else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
          };
          return b;
        }));
        // Number songs: say the numbers before the gap again, slowly, then wait for the answer.
        if (numeric) api.speak(recap(g));
        else api.speak([I('Mikä puuttuu?', "What's missing?")]);
      };
      const recap = g => [I('Kuuntele:', 'Listen:'), E(song.labels.slice(Math.max(0, g - 3), g).join(', ') + ' …'), I('Mikä puuttuu?', "What's missing?")];
      const fill = g => {
        choiceRow.replaceChildren();
        L.gap(g, false);
        gi++;
        runFrom(from);
      };
      const runFrom = async start => {
        const next = it.gaps[gi];
        // Number songs are slower here and the fast singing voice stays off (the numbers are recapped slowly at the gap).
        player = play(song, { from: start, stopAtItem: next ?? null, onToken: k => L.light(k), voice: voiceOn() && !numeric, skipItem: next, tempo: numeric ? 0.8 : 1 });
        const r = await player.done;
        if (r.stoppedAt != null) { from = r.stoppedAt; showChoices(next); }
        else if (r.end) { locked = true; api.correct({ say: [] }); }
      };
      api.prompt([I('Kuuntele laulua. Kun se pysähtyy, valitse puuttuva sana.', 'Listen to the song. When it stops, pick the missing word.')]).then(() => runFrom(0));
      return {
        hint() {
          const g = it.gaps[gi];
          const b = choiceRow.querySelector(`[data-i="${g}"]`); b?.classList.add('pulse');
          return numeric ? [E(song.labels.slice(Math.max(0, g - 3), g).join(', ') + ' …')] : [E(song.items.slice(Math.max(0, g - 2), g).join(', ') + ' …')];
        },
        reveal() {
          const g = it.gaps[gi];
          fill(g);
          return [E(song.items[g])];
        },
      };
    }

    // order
    const items = [...Array(it.limit).keys()];
    let order = shuffle(items);
    if (order.every((v, i) => v === i)) order.reverse();
    const list = h('div', { class: 'ordercards' });
    const cardOf = {};
    const mk = i => {
      const c = h('div', { class: 'ocard', 'data-i': i }, song.pics?.[i] ? h('span', { class: 'tpic' }, song.pics[i]) : null, h('span', {}, label(song, i)),
        api.lang === 'fi' && song.itemsFi ? h('small', {}, song.itemsFi[i]) : null);
      cardOf[i] = c;
      return c;
    };
    order.forEach(i => list.append(mk(i)));
    enableDrag(list, () => !locked);
    const check = h('button', { class: 'btn primary big' }, '✓ ' + api.t('Valmis', 'Done'));
    const current = () => [...list.children].map(c => Number(c.dataset.i));
    check.onclick = async () => {
      if (locked) return;
      const cur = current();
      if (cur.every((v, i) => v === i)) {
        locked = true; check.remove();
        list.classList.add('done');
        api.speak([I('Juuri oikein! Kuunnellaan sinun järjestyksesi.', "That's right! Let's hear your order.")]);
        await new Promise(r => setTimeout(r, 1500));
        const stopItem = it.limit < song.items.length ? it.limit : null;
        player = play(song, { stopAtItem: stopItem, voice: voiceOn(), onToken: (k, tok) => { list.querySelectorAll('.ocard').forEach(c => c.classList.toggle('on', Number(c.dataset.i) === tok.item)); } });
        await player.done;
        api.correct({ say: [] });
      } else {
        cur.forEach((v, i) => cardOf[v].classList.toggle('placed', v === i));
        api.wrong();
      }
    };
    api.body.append(h('div', { class: 'songtitle' }, '🎵 ', api.t(song.title.fi, song.title.en)), list, check);
    api.prompt([I('Vedä kortit oikeaan järjestykseen. Ensimmäinen on:', 'Drag the cards into the right order. The first one is'), E(song.items[0])]);
    return {
      hint() {
        current().forEach((v, i) => cardOf[v].classList.toggle('placed', v === i));
        const wrongAt = current().findIndex((v, i) => v !== i);
        return [I('Vihreät ovat oikeilla paikoilla. Seuraavaksi tulee:', 'The green ones are in the right place. Next comes'), E(song.items[wrongAt] || song.items[0])];
      },
      reveal() {
        locked = true;
        items.forEach(i => list.append(cardOf[i]));
        items.forEach(i => cardOf[i].classList.add('placed'));
        check.remove();
        return [E(items.map(i => song.items[i]).join(', '))];
      },
    };
  },
};

/** Drag to reorder children of `list` (pointer events: finger, S Pen and mouse). */
export function enableDrag(list, allowed) {
  let drag = null;
  list.addEventListener('pointerdown', e => {
    const c = e.target.closest('.ocard');
    if (!c || !allowed()) return;
    e.preventDefault();
    drag = c; c.classList.add('dragging');
    try { list.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  list.addEventListener('pointermove', e => {
    if (!drag) return;
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ocard');
    if (!over || over === drag || over.parentNode !== list) return;
    const r = over.getBoundingClientRect();
    const before = (e.clientY < r.top + r.height / 2) || (Math.abs(e.clientY - (r.top + r.height / 2)) < r.height / 2 && e.clientX < r.left + r.width / 2);
    list.insertBefore(drag, before ? over : over.nextSibling);
  });
  const end = () => { drag?.classList.remove('dragging'); drag = null; };
  list.addEventListener('pointerup', end);
  list.addEventListener('pointercancel', end);
}
