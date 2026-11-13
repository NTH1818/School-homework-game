// Registry of activity types. To add a new type: create a module with
// { type, generate(spec, lili) -> items[], render(item, api) -> {hint(), reveal()} } and list it here.
import pick from './pick.js';
import tapall from './tapall.js';
import shapes from './shapes.js';
import rhymebuild from './rhymebuild.js';
import math from './math.js';
import count from './count.js';
import sentence from './sentence.js';
import trace from './trace.js';
import say from './say.js';
import sequence from './sequence.js';
import hundred from './hundred.js';
import song from './song.js';
import today from './today.js';
import tooth from './tooth.js';
import letters from './letters.js';
import coins from './coins.js';
import pattern from './pattern.js';

export const ACT = Object.fromEntries(
  [pick, tapall, shapes, rhymebuild, math, count, sentence, trace, say, sequence, hundred, song, today, tooth, letters, coins, pattern].map(m => [m.type, m]));
