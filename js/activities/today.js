// "Today is…": starts every session. Uses the real date. Questions: today, tomorrow, yesterday
// (Lili: today, tomorrow). The Days of the Week song plays as the reward after the last one.
import { h, I, E, shuffle, sample } from '../ui.js';
import { SONGS } from '../songs.js';
import { play, lyrics, parse } from '../music.js';
import { S } from '../store.js';
import { now } from '../bank.js';

const Q = {
  today: { off: 0, fi: 'Mikä päivä tänään on?', en: 'What day is it today?' },
  tomorrow: { off: 1, fi: 'Mikä päivä on huomenna?', en: 'What day is it tomorrow?' },
  yesterday: { off: -1, fi: 'Mikä päivä oli eilen?', en: 'What day was it yesterday?' },
};

export default {
  type: 'today',
  generate(spec, lili) {
    const qs = spec.short ? ['today'] : lili ? ['today', 'tomorrow'] : ['today', 'tomorrow', 'yesterday'];
    return qs.map((q, i) => ({ q, reward: i === qs.length - 1 }));
  },
  render(it, api) {
    const song = parse(SONGS.days);
    const todayIdx = now().getDay();
    const ans = (todayIdx + Q[it.q].off + 7) % 7;
    const k = api.lili ? 2 : 3;
    const others = sample([...Array(7).keys()].filter(i => i !== ans), k - 1);
    const opts = shuffle([ans, ...others]);
    let locked = false;
    const btns = opts.map(i => {
      const b = h('button', { class: 'tile big daybtn' }, h('span', { class: 'tpic' }, song.pics[i]), song.items[i],
        api.lang === 'fi' ? h('small', {}, song.itemsFi[i]) : null);
      b.onclick = () => {
        if (locked || b.disabled) return;
        if (i === ans) { locked = true; b.classList.add('right'); win(); }
        else { b.classList.add('wrong'); b.disabled = true; api.wrong(); }
      };
      return b;
    });
    const stage = h('div', { class: 'todaybox' });
    if (it.q !== 'today') stage.append(h('div', { class: 'todayline' }, api.t('Tänään on ', 'Today is '), h('b', {}, song.items[todayIdx]), ' ', song.pics[todayIdx]));
    stage.append(h('div', { class: 'tiles col' }, btns));
    api.body.append(stage);

    let player = null;
    api.onLeave?.(() => player?.stop());
    async function win() {
      if (!it.reward) { api.correct({ say: [E(song.items[ans])] }); return; }
      // Reward: the Days song with karaoke words
      const L = lyrics(song, { pics: true, big: api.lili });
      const skip = h('button', { class: 'btn' }, '⏭ ' + api.t('Jatka', 'Continue'));
      api.body.replaceChildren(h('div', { class: 'songtitle' }, '🎉 🎵 ', api.t(song.title.fi, song.title.en)), L.el, skip);
      let finished = false;
      const finish = () => { if (finished) return; finished = true; player?.stop(); api.correct({ say: [] }); };
      skip.onclick = finish;
      await api.speak([I('Oikein! Palkinnoksi laulu!', 'Right! Here is a song for you!')]);
      player = play(song, { onToken: k2 => L.light(k2), voice: S().settings.songVoice !== false });
      await player.done;
      finish();
    }

    const pre = it.q === 'today' ? [] : [I('Tänään on', 'Today is'), E(song.items[todayIdx])];
    api.prompt([...pre, I(Q[it.q].fi, Q[it.q].en)]);
    return {
      hint() {
        if (it.q === 'today') return [I('Katso kalenteria tai kysy aikuiselta.', 'Look at a calendar or ask a grown-up.')];
        return [I('Laula viikonpäivät:', 'Sing the days:'), E(song.items.join(', '))];
      },
      reveal() {
        locked = true;
        btns.forEach((b, j) => { if (opts[j] === ans) b.classList.add('right'); else b.disabled = true; });
        return [E(song.items[ans])];
      },
    };
  },
};
