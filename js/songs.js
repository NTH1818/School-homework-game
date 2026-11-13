// Original songs written for this game (words and melodies). Not based on any existing song.
// Token format: 'text|note|beats|item'. text '_' = rest, note 'clap' = a clap 👏, '-' at the end of a
// syllable joins it to the next one. `item` marks the ordered things the song teaches (for the
// fill-the-gap and put-in-order games). Every line is 4 or 8 beats in 4/4.

export const SONGS = {
  // Verse: each pair of days climbs one step (C–G, D–A, E–C), so the tune is easy to remember.
  // Chorus: "Seven days, seven days, in a week, hooray!" Played with a full band and a sung "aah" voice.
  days: {
    title: { fi: 'Viikonpäivät', en: 'Days of the Week' }, bpm: 100, band: true, chunkVoice: true,
    items: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    itemsFi: ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'],
    pics: ['☀️', '🌙', '🛡️', '🐳', '⚡', '🌸', '🪐'],
    chords: ['C', 'F', 'Dm', 'G', 'C', 'Am', 'G', 'C', 'C', 'G', 'F', 'G', 'C'],
    lines: [
      'Sun-|C5|1|0 day|G4|1|0 Mon-|C5|1|1 day|G4|1|1 here|A4|.5 we|B4|.5 go!|C5|2 _|-|1',
      'Tues-|D5|1|2 day|A4|1|2 Wednes-|D5|1|3 day|A4|1|3 nice|B4|.5 and|A4|.5 slow|G4|2 _|-|1',
      'Thurs-|E5|1|4 day|C5|1|4 Fri-|E5|1|5 day|C5|1|5 al-|D5|.5 most|C5|.5 there|A4|2 _|-|1',
      'Sat-|D5|.5|6 ur-|E5|.5|6 day|F5|1|6 jump|E5|1 in|D5|.5 the|B4|.5 air!|C5|3 👏|clap|1',
      'Sev-|E5|.5 en|E5|.5 days,|G5|1 sev-|E5|.5 en|E5|.5 days,|C5|1 in|D5|.5 a|E5|.5 week,|F5|1 hoo-|E5|.5 ray!|D5|1.5',
      'Sun-|C5|.5 day|C5|.5 round|A4|.5 to|C5|.5 Sat-|D5|.5 ur-|C5|.5 day,|A4|1 then|G4|.5 we|A4|.5 start|C5|.5 a-|D5|.5 gain!|C5|2',
      '👏|clap|1 👏|clap|1 👏|clap|1 _|-|1',
    ],
  },
  months: {
    title: { fi: 'Kuukaudet', en: 'Months of the Year' }, bpm: 120,
    items: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    itemsFi: ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'],
    pics: ['❄️', '💝', '🌱', '🌧️', '🌷', '☀️', '🏖️', '🍉', '🍎', '🎃', '🍂', '🎄'],
    chords: ['C', 'G', 'G', 'C', 'F', 'G', 'G', 'C'],
    lines: [
      'Jan-|C4|.5|0 u-|E4|.25|0 ar-|G4|.25|0 y|G4|.5|0 Feb-|A4|.5|1 ru-|G4|.25|1 ar-|E4|.25|1 y|E4|.5|1 March|F4|1|2 A-|E4|.5|3 pril|D4|1.5|3 👏|clap|1 👏|clap|1',
      'May|G4|1|4 June|A4|1|5 Ju-|B4|.5|6 ly|A4|1.5|6 Au-|G4|.5|7 gust|E4|1.5|7 👏|clap|1 👏|clap|1',
      'Sep-|F4|.5|8 tem-|F4|.5|8 ber|A4|1|8 Oc-|G4|.5|9 to-|G4|.5|9 ber|E4|1|9 No-|F4|.5|10 vem-|F4|.5|10 ber|D4|1|10 De-|E4|.5|11 cem-|E4|.5|11 ber|C4|1|11',
      'Twelve|G4|1 months|G4|1 make|A4|.5 a|B4|.5 year|C5|1.5 hoo-|G4|.5 ray|C5|2 _|-|1',
    ],
  },
  count10: {
    title: { fi: 'Laske kymmeneen', en: 'Count to 10' }, bpm: 116,
    items: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    chords: ['C', 'G', 'F', 'C'],
    lines: [
      'One|C4|.5|0 two|D4|.5|1 three|E4|.5|2 four|F4|.5|3 five|G4|1|4 👏|clap|.5 👏|clap|.5',
      'six|G4|.5|5 sev-|A4|.25|6 en|A4|.25|6 eight|B4|.5|7 nine|B4|.5|8 ten|C5|1|9 👏|clap|.5 👏|clap|.5',
      'Count|E4|.5 with|E4|.5 me|G4|1 and|F4|.5 count|E4|.5 a-|D4|.5 gain|D4|.5',
      'one|C4|.5 to|D4|.5 ten|E4|1 one|D4|.5 to|B3|.5 ten|C4|1',
    ],
  },
  count20: {
    title: { fi: 'Laske kahteenkymmeneen', en: 'Count to 20' }, bpm: 108,
    items: ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
    labels: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    chords: ['C', 'C', 'F', 'C'],
    lines: [
      'e-|C4|.25|0 lev-|E4|.25|0 en|G4|.5|0 twelve|G4|.5|1 thir-|A4|.25|2 teen|A4|.25|2 four-|G4|.25|3 teen|G4|.25|3 fif-|E4|.25|4 teen|E4|.75|4 👏|clap|.5',
      'six-|C4|.25|5 teen|E4|.25|5 sev-|G4|.25|6 en-|G4|.25|6 teen|A4|.5|6 eigh-|G4|.25|7 teen|G4|.25|7 nine-|E4|.25|8 teen|E4|.25|8 twen-|D4|.5|9 ty|C4|.5|9 👏|clap|.5',
      'Teen|E4|.5 num-|E4|.5 bers|G4|1 count|F4|.5 them|E4|.5 too|D4|1',
      'e-|D4|.25 lev-|D4|.25 en|E4|.5 up|F4|.5 to|G4|.5 twen-|B3|.5 ty|C4|1.5',
    ],
  },
  by2: {
    title: { fi: 'Hypitään kakkosin', en: 'Skip by Twos' }, bpm: 112,
    items: ['two', 'four', 'six', 'eight', 'ten', 'twelve', 'fourteen', 'sixteen', 'eighteen', 'twenty'],
    labels: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'],
    chords: ['C', 'F', 'G', 'C'],
    lines: [
      'Two|C4|.5|0 four|E4|.5|1 six|G4|.5|2 eight|E4|.5|3 ten|C5|1|4 👏|clap|.5 👏|clap|.5',
      'twelve|C5|.5|5 four-|B4|.25|6 teen|B4|.25|6 six-|A4|.25|7 teen|A4|.25|7 eigh-|G4|.25|8 teen|G4|.25|8 twen-|E4|.5|9 ty|C4|.5|9 👏|clap|.5 _|-|.5',
      'Skip|E4|.5 by|E4|.5 twos|G4|1 that’s|F4|.5 how|E4|.5 we|D4|.5 do|D4|.5',
      'two|E4|.5 by|D4|.5 two|C4|1 woo-|G4|.5 hoo|C5|1.5',
    ],
  },
  by5: {
    title: { fi: 'Hypitään viitosin', en: 'Skip by Fives' }, bpm: 112,
    items: ['five', 'ten', 'fifteen', 'twenty', 'twenty-five', 'thirty', 'thirty-five', 'forty', 'forty-five', 'fifty'],
    labels: ['5', '10', '15', '20', '25', '30', '35', '40', '45', '50'],
    chords: ['C', 'F', 'C', 'C'],
    lines: [
      'Five|G4|.5|0 ten|G4|.5|1 fif-|A4|.25|2 teen|A4|.25|2 twen-|G4|.25|3 ty|G4|.25|3 twen-|E4|.25|4 ty-|E4|.25|4 five|G4|.5|4 👏|clap|.5 👏|clap|.5',
      'thir-|A4|.25|5 ty|A4|.25|5 thir-|G4|.25|6 ty-|G4|.25|6 five|E4|.5|6 for-|F4|.25|7 ty|F4|.25|7 for-|E4|.25|8 ty-|E4|.25|8 five|D4|.5|8 fif-|C4|.25|9 ty|C4|.75|9',
      'Count|E4|.5 by|E4|.5 fives|G4|1 give|A4|.5 me|G4|.25 a|G4|.25 high|E4|.5 five|C5|.5',
      '👏|clap|.5 👏|clap|.5 high|G4|.5 five|C5|1.5 _|-|1',
    ],
  },
  by10: {
    title: { fi: 'Hypitään kympein', en: 'Skip by Tens' }, bpm: 112,
    items: ['ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'a hundred'],
    labels: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
    chords: ['C', 'G', 'G', 'C'],
    lines: [
      'Ten|C4|.5|0 twen-|D4|.25|1 ty|D4|.25|1 thir-|E4|.25|2 ty|E4|.25|2 for-|F4|.25|3 ty|F4|.25|3 fif-|G4|.25|4 ty|G4|.75|4 👏|clap|.5 👏|clap|.5',
      'six-|A4|.25|5 ty|A4|.25|5 sev-|B4|.25|6 en-|B4|.25|6 ty|B4|.5|6 eigh-|C5|.25|7 ty|C5|.25|7 nine-|D5|.25|8 ty|D5|.25|8 a|C5|.25|9 hun-|C5|.25|9 dred|C5|.5|9 👏|clap|.5',
      'Count|G4|.5 by|G4|.5 tens|E4|1 to|F4|.5 a|E4|.5 hun-|D4|.5 dred|D4|.5',
      'Big|E4|.5 num-|D4|.5 bers|C4|1 👏|clap|.5 👏|clap|.5 _|-|1',
    ],
  },
  abc: {
    title: { fi: 'Aakkoset (englanniksi)', en: 'The Alphabet' }, bpm: 104,
    items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    chords: ['C', 'F', 'C', 'F', 'G', 'C', 'G', 'C'],
    lines: [
      'A|E4|.5|0 B|G4|.5|1 C|E4|.5|2 D|C4|.5|3 👏|clap|.5 👏|clap|.5 _|-|1',
      'E|F4|.5|4 F|A4|.5|5 G|F4|.5|6 H|D4|.5|7 👏|clap|.5 👏|clap|.5 _|-|1',
      'I|E4|.5|8 J|G4|.5|9 K|E4|.5|10 L|C4|.5|11 👏|clap|.5 👏|clap|.5 _|-|1',
      'M|F4|.5|12 N|A4|.5|13 O|C5|.5|14 P|A4|.5|15 👏|clap|.5 👏|clap|.5 _|-|1',
      'Q|G4|.5|16 R|F4|.5|17 S|E4|.5|18 T|D4|.5|19 👏|clap|.5 👏|clap|.5 _|-|1',
      'U|E4|.5|20 V|F4|.5|21 W|G4|1|22 👏|clap|.5 👏|clap|.5 _|-|1',
      'X|A4|.5|23 Y|B4|.5|24 Z|C5|1|25 👏|clap|.5 👏|clap|.5 _|-|1',
      'A|G4|.5 to|E4|.5 Z|C5|1 we|A4|.5 know|G4|.5 them|E4|.5 all|C4|.5',
    ],
  },
  sounds: {
    title: { fi: 'Kirjainten äänteet', en: 'Letter Sounds' }, bpm: 100,
    items: ['d', 'r', 'v', 'w', 'o', 'y', 'z'],
    pics: ['🐶', '🐰', '🚐', '🕸️', '🐙', '✅', '🦓'],
    chords: ['C', 'C', 'F', 'G', 'C'],
    lines: [
      'd|C4|.5|0 is|E4|.25 for|E4|.25 dog|G4|1 r|D4|.5|1 is|F4|.25 for|F4|.25 rab-|A4|.5 bit|A4|.5',
      'v|E4|.5|2 is|G4|.25 for|G4|.25 van|C5|1 w|B4|.5|3 is|A4|.25 for|A4|.25 web|G4|1',
      'o|F4|.5|4 is|A4|.25 for|A4|.25 oc-|C5|.25 to-|B4|.25 pus|A4|.5 y|G4|.5|5 is|E4|.25 for|E4|.25 yes|C4|1',
      'z|D4|.5|6 is|F4|.25 for|F4|.25 ze-|A4|.5 bra|G4|.5 👏|clap|.5 👏|clap|.5 _|-|1',
      'Let-|E4|.5 ters|E4|.5 sing|G4|1 with|F4|.5 me|D4|.5 👏|clap|.5 👏|clap|.5',
    ],
  },
};
export const SONG_ORDER = ['days', 'months', 'count10', 'count20', 'by2', 'by5', 'by10', 'abc', 'sounds'];
/** Which songs Lili sees in the song book (shorter, Kindergarten level). */
export const LILI_SONGS = ['days', 'count10', 'abc', 'sounds'];
