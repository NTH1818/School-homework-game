# Kipinä – a daily homework practice game for Leo & Lili

A small web app that turns Leo's monthly homework sheet into short daily practice sessions.
Kipinä the fox speaks the instructions in **Finnish**. The learning content (letters, words, rhymes,
sentences, counting to 100) is in **English**, matching the homework. Lili gets an easier version of
the same topic every day.

No accounts, no ads, no tracking. Progress is stored only in the browser on the device.
Once loaded, it also works offline.

---

## 0. On the phone (published version)

The game is published as a private claude.ai artifact: https://claude.ai/artifact/SZPXaqT3N2oBVVSTFS3oWy
Open it in **Chrome** on the phone while signed in to claude.ai, then ⋮ → *Add to Home screen*.
Use Chrome rather than the Claude app, because the app's built-in browser may not support speech.
Progress is saved on the phone and in your claude.ai account (private to you), so it survives a
cleared browser. This version needs an internet connection.

`kipina.html` is the page that gets published (claude.ai adds the HTML skeleton). `index.html` is the
same page for running it locally. After changing any file, ask Claude to republish it to the same link.

## 1. Run it locally

It's plain HTML/CSS/JavaScript with no build step. It must be served over http(s), because opening
`index.html` directly as a file won't load the content.

**On a Windows laptop (no installs needed):**

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Then open http://localhost:8080.

**On the phone (Samsung S25 Ultra):** host the folder as a static site, for example:
- **GitHub Pages**: push this folder to a repository, then Settings → Pages → deploy from branch.
- **Netlify Drop**: drag the folder onto https://app.netlify.com/drop.

Open the URL in Chrome, then use ⋮ → *Add to Home screen*. After the first visit it works offline.

**Finnish voice:** the game uses the phone's built-in text-to-speech. If the parent area
(⚙️ Settings) says "Finnish: not found", go to Samsung Settings → General management →
Text-to-speech output, choose **Google** as the engine, then ⚙️ → Install voice data → **Finnish**.
Until a Finnish voice is installed, instructions are spoken in English.

## 2. How it works

- **Profiles:** Leo (6) and Lili (4), each with their own animal, colour and progress.
- **Daily session:** today's homework skill first, in 2–3 different formats. Then a few review items
  from earlier days. Items a child missed come back, and weak skills appear more often while mastered
  ones fade out.
- **Session length** (parent area, per child): **Short** (default) or **Normal**. Short is about half:
  Leo about 12 activities (6 homework, 3 writing, 3 review) plus "What day is it today?" with the song
  and the tooth reminder; Lili about 6 (3 homework, 2 writing, 1 review) plus "Today is". Activities are
  taken evenly from each round, so a short session still has every kind. Normal is about 24 / 11.
  To keep the pace up, a repeated instruction isn't spoken again for the next question of the same
  kind, and the spoken praise is short.
- **Maths, taught step by step** (BC Math 1, and Kindergarten for Lili; `js/activities/math.js`):
  - Ranges: within 5 → within 10 → within 20 (Lili up to 10). The range moves up after 7 of the last 8
    right; the parent area doesn't need to do anything.
  - Concrete → pictures → numbers: a new range starts with **counters dragged into a ten frame**
    (or dragged out to a basket for taking away), then pictures, then the number sentence.
  - Visual tools: ten frames, a **number line** where a frog hops forward to add and back to subtract,
    and **number bonds** (part-part-whole).
  - Strategies, one at a time: counting on from the bigger number, counting back, **doubles**,
    **making 10** (8 + 5: 8 and 2 make 10, then 3 more), and seeing amounts at a glance (dice and
    ten-frame dot patterns flashed briefly).
  - **Fact families** (3 + 2 = 5, so 5 − 2 = 3 and 5 − 3 = 2) and short spoken **story problems**
    with pictures ("Leo has 4 cars. Lili gives him 2 more…").
  - When an answer is wrong: first a step-by-step walk-through on the ten frame or number line
    (leaving the last step to the child); after a second miss the whole walk-through, and then a
    similar question comes straight away (it doesn't count towards the score).
- **Score and pocket money** (`js/bank.js`): each session ends with **Good / Medium / Poor** from answers
  right on the first try (second tries count half). Default: Good 80%+ earns **$0.50** (two quarters),
  Medium 50–79% **$0.20** (two dimes), Poor **$0.05** (a nickel). Only the first finished session each
  calendar day earns money; more play that day earns a ⭐ sticker. The total starts at $0 on the 1st of
  each month; earlier months stay in the history. 🐷 on the child's home screen shows the piggy bank as
  real Canadian coins (fewest coins) and has a "Count your money" game. Parent area: daily scores, the
  month total, **Paid out** (records that you've given the money), and earlier months. Settings: the
  thresholds, and pocket money for Lili (off by default). The game always says what was earned, never
  what was missed.
- **Counting audio:** number sequences ("5, 10, 15 …") are spoken one number at a time, slower, with a
  pause between numbers and a longer thinking pause before the gap; then the game waits. In the song
  fill-the-gap games for number songs the melody plays slower without the fast voice, and the numbers
  before the gap are then said slowly. 🐌 in the top bar replays the question slowly. Settings:
  Counting speed (Normal / Slow (default) / Very slow), next to Speech speed.
- **Number 1:** written BC-style as one straight line down (no flag, no base). The writing practice
  uses that stroke, and every 1 on screen is shown as a plain bar (the fonts' own 1 has a flag).
- **Feedback:** a correct answer gets a sound, confetti and praise. A wrong answer gets a gentle hint
  and a second try. A second miss shows the answer with a short explanation. There are no lives and
  no timers.
- **Reward:** each finished day adds a creature to the month's forest (30 spots, one per sheet day).
- **On paper and together:** tasks that can't be done in the game (draw your house, board game,
  printing letters on paper, daily reading) appear as a checklist to tick off together.
- **Together mode:** Leo and Lili take turns on the same day's topic. On Lili's turn, Leo can press
  "🤝 Leo auttaa" to give her a hint. Finishing completes the day for both.
- **Parent area** (🔒, behind a multiplication question): days done, mastered skills and skills that
  need work, the offline checklist, and per-day buttons for *Play now / Mark done / Replay / Skip*. It
  also lets you choose whether instructions are spoken in Finnish or English for each child.
- **Days:** a child's "today" is the first day they haven't completed or skipped, starting from day 1.
  After finishing a day, they can go straight to the next one if it's not later than today's date
  (useful for catching up).
- **Session opener:** every session starts with "Today is…": what day is it today, tomorrow and
  yesterday, using the real date (Lili: today and tomorrow). The Days of the Week song plays as the
  reward.
- **Fingers-out-of-mouth reminder (Leo only):** a happy tooth with a cheerful, changing line at the
  start of each session, plus a short pop-up halfway through longer sessions. At the end Leo can tap
  "I kept my fingers out of my mouth!" for a tooth sticker, counted in the forest and the parent area.
- **BC curriculum:** Grade 1 for Leo, Kindergarten for Lili (`content/curriculum-bc.json`, notes in
  `reference/curriculum/`). The homework always comes first. The curriculum practice pool (coins,
  patterns, ways to make 10 or 5, comparing numbers, skip-counting, uppercase/lowercase, syllable
  clapping, capitals and periods, songs) fills review rounds and tops up light homework days. The
  parent area shows each standard as not yet / practised / practising / mastered.
- **Writing** (letters and numbers): the shapes are hand-built strokes (`js/glyphs.js`) that follow the
  parent's guide sheets ("Letter Tracing" A–N and "Number Formation" 0–10), which match the BC
  *Printing Like a Pro!* style: start at the top, straight lines down first, round letters
  counter-clockwise from the top right, one-part a and g. O–Z follow the same rules; t has a curved
  foot like the homework sheet. Each character is practised in up to three steps:
  1. **Trace**: write inside the outlined letter. Numbered start dots and arrows show the order;
     the next start dot pulses green. An animated "watch first" demo draws each stroke and says its
     name ("1. down", "2. across").
  2. **Dots**: write along a dotted line; only the next start dot is shown.
  3. **Free**: write on empty lines with a small numbered model in the corner (tap it to watch again).
  Every stroke is checked for its start point, direction, order and shape, with gentle tips ("Start
  at the green dot", "The other way! Follow the arrow"). After 3 misses the demo plays again, and
  after more misses the model is shown.
- **Daily writing round:** every session adds writing practice in the *Printing Like a Pro* order
  (l i t f, c o e a d, s u, r n m h b, j g q p, v w y x z k, then capitals). Leo: 1–2 letters a day plus
  one number (0–9), each traced and then written freely, plus one earlier character that needs
  practice. Lili: one number a day (trace, then dots) plus a capital letter on lighter days. On long
  homework days the second letter waits. Together mode skips it to stay short. In **Short** sessions:
  Leo writes one letter a day (trace → free) plus a number to trace every other day; Lili alternates a
  number and a capital letter (trace → dots).
- **✏️ Writing screen** (on each child's home): practise any letter or number (trace → dots → free).
  Tiles are coloured by mastery, and the same grid is in the parent area.
- **Songs** (🎵 on each child's home screen, and inside sessions): original songs with original
  melodies, generated in the browser, each under 20 seconds: days, months, count to 10 and 20,
  skip-counting by 2s, 5s and 10s, the alphabet, and this month's letter sounds. Each song has three
  games: sing-along (karaoke words, pictures for pre-readers), fill the gap (the song stops and you
  pick the missing word), and put in order (drag the cards; the song plays back your order).
  The Days of the Week song has a full band arrangement (`band: true`: kick, clap, hi-hat, bass,
  chords and a synthesized "aah" singing voice on the melody). With `chunkVoice: true` the device
  voice says each day exactly when it is sung, instead of reading the whole line. Other songs can be
  switched to the same style by adding those two flags in `js/songs.js`.
- **Sound:** short musical jingles for correct answers and a tune when a day is finished. Parent area:
  volume, mute, and whether the voice reads the song words along with the melody.
- **Songs we like:** links in the parent area (Settings). Add more in `SONGS_WE_LIKE` at the top of
  `js/main.js`.
- **Canadian conventions:** Canadian spelling, metric only, and Canadian coins without the penny
  (nickel, dime, quarter, loonie, toonie).

### About the singing voice

Text-to-speech can't sing. The options are:

| Option | Quality | Trade-off |
|---|---|---|
| Melody only (voice off) | Clean and in tune; kids sing the words themselves while they light up | No sung words |
| Melody + device voice reading each line in time (default) | Words are heard clearly. It sounds like rhythmic speaking, not singing, and timing can drift a little | No files, works offline |
| Your own recordings (a parent sings each song once) | Best and most natural | Needs recording and adding audio files, about 5 minutes per song |
| Synthetic singing voice (e.g. pre-rendered with a vocal synth) | Real singing | Extra tools; licensing has to be checked |

## 3. Add a new month (a few minutes each month)

1. Give Claude the photo or PDF of the new sheet and say: *"Make the content file for December using
   the same format as content/2026-11.json."*
2. Claude creates `content/2026-12.json` (one entry per day; see the format below).
3. Add the month to `content/index.json`: `{ "months": ["2026-11", "2026-12"] }`
4. Add the new file to the `CORE` list in `sw.js` and bump `CACHE` (e.g. `kipina-v2`) so it's
   available offline straight away.
5. Upload or push the folder again.

The game opens the month that matches today's date automatically. You can also pick a month under
Parents → ⚙️ Settings. Progress is kept per month, and skill statistics carry over between months.

If a new month needs a picture word that doesn't exist yet, add it to `W` in `js/words.js`
(`word: ['emoji', 'Finnish meaning']`).

### Content file format

```jsonc
{
  "month": "2026-11",
  "title": { "fi": "Marraskuu 2026", "en": "November 2026" },
  "collection": { "title": {...}, "creatures": ["🦊", ... 30 emojis, one per day] },
  "daily": [ { "id": "read-self", "fi": "...", "en": "..." } ],    // offline tasks shown every day
  "skillNames": { "start:d": "Sound d", ... },                     // labels for the parent area
  "days": [
    {
      "day": 4,
      "sheet": "Original text from the sheet",
      "title": { "fi": "...", "en": "..." },        // shown to Leo (and Lili unless liliTitle is set)
      "liliTitle": { "fi": "...", "en": "..." },    // optional
      "leo":  [ activity, activity, ... ],          // rounds, played in order
      "lili": [ activity, ... ],                    // easier version of the same topic
      "review": { "leo": 2, "lili": 1 },            // optional: number of review rounds
      "offline": [ { "id": "d4-print", "fi": "...", "en": "..." } ],   // Leo's paper tasks
      "liliOffline": [ ... ]                        // optional, Lili's paper tasks
    }
  ]
}
```

Every activity has a `type` and a `skill` (a stable key used for mastery tracking and review; reuse
the same key when the same skill appears again, e.g. `sub10`).

| type | What the child does | Key fields |
|---|---|---|
| `pick` (mode `start`) | "Which one starts with d?" | `letter, example, words, count, choices` |
| `pick` (mode `rhyme`) | "Which one rhymes with back?" | `base, rime, words` |
| `pick` (mode `word`) | "Find the dog" | `words` |
| `pick` (mode `custom`) | Any question with picture choices | `items: [{q:{fi,en}, say?, choices, answer, hint?, explain?}]` |
| `tapall` | Tap all matching pictures | `prompt:{fi,en}, say?, words, distractors?, letter?` |
| `shapes` | Find the rectangles | `count` |
| `rhymebuild` | Make the word: pick the first letters for "_ack" | `rime, onsets` |
| `math` | Addition/subtraction taught step by step (ten frame, number line, bonds, fact families, stories); the range comes from the child's level | `op: add/sub/mix, count` (`fixed: true, max` to pin a range) |
| `count` | Count pictures (also `add` / `take` modes) | `mode, min, max, emoji, what:{fi,en}, lang` |
| `sentence` | Listen and build a sentence from word tiles | `sentences: [{en, fi, e}]` |
| `trace` | Write a letter/number with finger or S Pen (trace → dots → free, stroke order checked) | `chars, mode: trace/both/write/ladder` |
| `say` | Say it out loud; a grown-up taps 👍 | `items: [{fi, en, say?, model?}]` |
| `sequence` | Days/months: put them in order, or say what comes next | `set: days/months, mode: order/next` |
| `hundred` | Missing number in a row of the hundreds chart; with `step` it's skip-counting | `max: 100 or 10, step?: 2/5/10, count` |
| `song` | Song games | `song: days/months/count10/count20/by2/by5/by10/abc/sounds, mode: sing/gap/order, gaps?, limit?` |
| `letters` | Uppercase/lowercase, find a letter, clap syllables | `mode: case/name/syllable` |
| `coins` | Canadian coins | `mode: name/value/count` |
| `pattern` | What comes next in a repeating pattern | `cores?: ["AB","ABC",...]` |
| `math` (more ops) | Ways to make 10 or 5; which is more | `op: make (target), compare (max)` |

New songs go in `js/songs.js` (token format explained at the top of that file). Every line must
have a whole number of 4-beat bars.

Lili's rounds use the same types with easier settings (fewer `choices`, smaller numbers, tracing only).

## 4. Add a new activity type

1. Create `js/activities/mytype.js`:

```js
import { h, I, E } from '../ui.js';
export default {
  type: 'mytype',
  // Turn the content spec into a list of plain-data items (they're saved for review, so keep them JSON).
  generate(spec, lili) { return [{ /* item */ }]; },
  // Draw the item into api.body. Call api.correct() or api.wrong(). Return hint() and reveal().
  render(item, api) {
    api.prompt([I('Suomeksi ohje', 'English instruction'), E('english word')]);
    // api.lili, api.lang, api.t(fi, en), api.speak(segs), api.body
    return {
      hint()   { /* show a hint */  return [I('vihje', 'hint')]; },
      reveal() { /* show the answer */ return [E('answer')]; },
    };
  },
};
```

2. Register it in `js/activities/index.js`, and add the file to `CORE` in `sw.js`.
3. Use `"type": "mytype"` in a content file.

`I(fi, en)` is an instruction, spoken in the child's instruction language. `E(text)` is English
learning content, always spoken in English.

## Files

```
index.html, css/style.css
js/main.js          screens (profiles, home, end of day, forest, together, parent area)
js/engine.js        session building (today + spaced review), feedback loop, mastery tracking
js/speech.js        Web Speech API (fi/en voices)
js/store.js         progress in localStorage
js/words.js         picture word bank (emoji + Finnish meaning)
js/glyphs.js        letter and number strokes (order + direction) for writing practice
js/bank.js          daily score, pocket money in Canadian coins, monthly totals
js/music.js, js/songs.js   song player and the original songs
js/activities/*.js  activity types
content/*.json      one file per month
sw.js, manifest.webmanifest   offline + "Add to Home screen"
serve.ps1           local test server for Windows
```
