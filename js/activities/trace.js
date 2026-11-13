// Writing practice for letters and numbers, in three steps:
//   trace – write inside the outlined letter, stroke by stroke (numbered start dots + arrows)
//   dots  – write along a dotted line; only the next start dot is shown
//   free  – write on empty lines; a small model with numbers is in the corner
// Every item can start with an animated "watch first" demo that draws each stroke in order and
// says its name ("1. down", "2. across"). Each stroke is checked for start point, direction and
// shape, so the child learns the right order and direction, not only the final look.
//
// spec: {chars:['d','D'], mode?: 'trace' | 'both' | 'write' | 'ladder', count?}
//   trace  – trace every char (Lili's default)
//   both   – trace every char, then write the first one freely (Leo's default)
//   write  – each char: Leo trace → free, Lili trace → dots
//   ladder – each char: trace → dots → free (Lili: trace → dots)
import { h, I, E, cycle, pickOne } from '../ui.js';
import { layout, TALK, hasGlyph } from '../glyphs.js';
import { mallet, hz } from '../sound.js';

const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'];

export default {
  type: 'trace',
  generate(spec, lili) {
    const chars = spec.chars.filter(hasGlyph);
    const seen = new Set();
    const mk = (ch, stage) => { const demo = !seen.has(ch) && stage !== 'free'; seen.add(ch); return { ch, stage, demo }; };
    if (spec.count) return cycle(chars, spec.count).map(ch => mk(ch, lili ? 'trace' : pickOne(['dots', 'free'])));
    const mode = spec.mode || (lili ? 'trace' : 'both');
    const out = [];
    for (const ch of chars) {
      out.push(mk(ch, 'trace'));
      if (mode === 'ladder') { out.push(mk(ch, 'dots')); if (!lili) out.push(mk(ch, 'free')); }
      if (mode === 'write') out.push(mk(ch, lili ? 'dots' : 'free'));
    }
    if (mode === 'both' && !lili && chars.length) out.push(mk(chars[0], 'free'));
    return out;
  },

  render(it, api) {
    const L = layout(it.ch);
    const W = Math.round(Math.min(window.innerWidth - 28, 560));
    const H = Math.round(Math.min(window.innerHeight * 0.54, W * 1.05, 480));
    const s = Math.min((H * 0.88) / 150, (W * 0.84) / L.w);
    const ox = (W - L.w * s) / 2, oy = (H - 140 * s) / 2 + 3 * s;
    const P = ([x, y]) => [ox + x * s, oy + y * s];
    const exp = L.strokes.map(st => ({ ...st, px: st.pts.map(P) }));
    const lili = api.lili;

    const dpr = window.devicePixelRatio || 1;
    const cv = h('canvas', { class: 'tcanvas', width: W * dpr, height: H * dpr, style: { width: W + 'px', height: H + 'px' } });
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    let stage = it.stage;              // can change to 'dots' after a hint in the free step
    let k = 0;                         // next stroke to write (trace/dots)
    const accepted = [];               // the child's accepted strokes
    const free = [];                   // strokes in the free step
    let ink = null, inkId = null, penSeen = false;
    let fails = 0, locked = false, result = null, failInk = null, anim = null, autoTimer = null;
    const color = () => getComputedStyle(cv).getPropertyValue('--c').trim() || '#2563eb';

    // ---------- drawing ----------
    const pathOf = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (pts.length === 1) c.lineTo(pts[0][0] + 0.1, pts[0][1]); };
    function lines() {
      const y = u => oy + u * s;
      ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.strokeStyle = '#93c5fd';
      for (const u of [0, 100]) { ctx.beginPath(); ctx.moveTo(6, y(u)); ctx.lineTo(W - 6, y(u)); ctx.stroke(); }
      ctx.strokeStyle = '#bfdbfe'; ctx.setLineDash([10, 9]);
      ctx.beginPath(); ctx.moveTo(6, y(50)); ctx.lineTo(W - 6, y(50)); ctx.stroke();
      ctx.setLineDash([3, 9]); ctx.strokeStyle = '#dbeafe';
      ctx.beginPath(); ctx.moveTo(6, y(140)); ctx.lineTo(W - 6, y(140)); ctx.stroke();
      ctx.setLineDash([]);
    }
    function bubble(fill) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 24 * s;
      for (const e of exp) { pathOf(ctx, e.px); ctx.stroke(); }
      ctx.strokeStyle = fill; ctx.lineWidth = 24 * s - 4;
      for (const e of exp) { pathOf(ctx, e.px); ctx.stroke(); }
    }
    function arrowHead(e, col, size) {
      const n = e.px.length; if (n < 3) return;
      const a = e.px[n - 1], b = e.px[Math.max(0, n - 4)];
      const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(a[0] + Math.cos(ang) * size, a[1] + Math.sin(ang) * size);
      ctx.lineTo(a[0] + Math.cos(ang + 2.4) * size, a[1] + Math.sin(ang + 2.4) * size);
      ctx.lineTo(a[0] + Math.cos(ang - 2.4) * size, a[1] + Math.sin(ang - 2.4) * size);
      ctx.fill();
    }
    function centre(e, dash, col, width) {
      ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = 'round';
      pathOf(ctx, e.px); ctx.stroke(); ctx.setLineDash([]);
    }
    // Number badge positions: if two strokes start at the same spot (A, M, N…), move the later one along its stroke.
    const badges = [];
    exp.forEach((e, i) => {
      let pos = e.px[0];
      if (badges.some(b => Math.hypot(b[0] - pos[0], b[1] - pos[1]) < 16 * s)) {
        let acc = 0, j = 1;
        for (; j < e.px.length; j++) { acc += Math.hypot(e.px[j][0] - e.px[j - 1][0], e.px[j][1] - e.px[j - 1][1]); if (acc > 17 * s) break; }
        pos = e.px[Math.min(j, e.px.length - 1)];
      }
      badges.push(pos);
    });
    function badge(i, mode) { // mode: 'now' | 'idle' | 'small'
      const [x, y] = badges[i];
      const r = (mode === 'now' ? 9.5 : 7.5) * s * (lili && mode === 'now' ? 1.15 : 1);
      if (mode === 'now') {
        const pulse = 1 + 0.18 * Math.sin(performance.now() / 180);
        ctx.fillStyle = 'rgba(34,197,94,.28)'; ctx.beginPath(); ctx.arc(x, y, r * 1.7 * pulse, 0, 7); ctx.fill();
      }
      ctx.fillStyle = mode === 'now' ? '#16a34a' : '#1f2937';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      numText(ctx, i + 1, x, y, r * 1.25);
    }
    /** Badge number; 1 is drawn as a plain straight bar (BC print), not the font's flagged 1. */
    function numText(c, n, x, y, size) {
      if (n === 1) { const w = size * 0.16, hh = size * 0.72; c.fillRect(x - w / 2, y - hh / 2, w, hh); return; }
      c.font = `800 ${size}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(n), x, y + size * 0.05);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      lines();
      const showAll = result === 'model' || result === 'ok';
      if (stage === 'trace' || showAll) {
        bubble(result === 'ok' ? '#dcfce7' : result === 'model' ? '#fef3c7' : '#ffffff');
        if (result !== 'ok') exp.forEach((e, i) => { if (i >= k || result === 'model') { centre(e, [5 * s, 5 * s], '#64748b', 1.6 * s); if (!e.dot) arrowHead(e, '#64748b', 5 * s); } });
      } else if (stage === 'dots') {
        exp.forEach((e, i) => { if (i >= k) centre(e, [0.1, 7 * s], '#94a3b8', 3.2 * s); });
        if (k < exp.length && !exp[k].dot) arrowHead(exp[k], '#16a34a', 6 * s);
      }
      // the child's ink
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(7, 12 * s); ctx.strokeStyle = color();
      for (const u of (stage === 'free' && !showAll ? free : accepted)) { pathOf(ctx, u); ctx.stroke(); }
      if (stage === 'free' && showAll) for (const u of free) { pathOf(ctx, u); ctx.stroke(); }
      if (ink) { pathOf(ctx, ink); ctx.stroke(); }
      if (failInk) {
        const a = 1 - (performance.now() - failInk.t) / 700;
        if (a > 0) { ctx.globalAlpha = a; ctx.strokeStyle = '#f97316'; for (const u of failInk.strokes) { pathOf(ctx, u); ctx.stroke(); } ctx.globalAlpha = 1; requestAnimationFrame(draw); }
        else failInk = null;
      }
      // demo animation
      if (anim) {
        ctx.strokeStyle = color(); ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(7, 12 * s);
        for (let i = 0; i < anim.i && i < exp.length; i++) { pathOf(ctx, exp[i].px); ctx.stroke(); }
        const e = exp[anim.i];
        if (e) {
          const n = Math.max(1, Math.round(anim.p * (e.px.length - 1)));
          const part = e.px.slice(0, n + 1);
          pathOf(ctx, part); ctx.stroke();
          ctx.globalAlpha = 1;
          const tip = part[part.length - 1];
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tip[0], tip[1], 8 * s, 0, 7); ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = '#111827'; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // number badges
      if (!result) {
        if (anim) exp.forEach((e, i) => badge(i, i === anim.i ? 'now' : 'idle'));
        else if (stage === 'trace') exp.forEach((e, i) => { if (i >= k) badge(i, i === k ? 'now' : 'idle'); });
        else if (stage === 'dots' && k < exp.length) badge(k, 'now');
      } else if (result === 'model') exp.forEach((e, i) => badge(i, 'idle'));
    }
    // keep the "next" dot pulsing
    let raf = 0;
    const loop = () => { if (!cv.isConnected && raf) return; if (!anim && !failInk && !ink) draw(); raf = setTimeout(() => requestAnimationFrame(loop), 60); };

    // ---------- checking ----------
    const plen = pts => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
    function resample(pts, n) {
      const L0 = plen(pts); if (L0 === 0) return Array(n).fill(pts[0]);
      const out = [pts[0]]; const step = L0 / (n - 1); let acc = 0, j = 1, prev = pts[0];
      while (out.length < n - 1 && j < pts.length) {
        const d = Math.hypot(pts[j][0] - prev[0], pts[j][1] - prev[1]);
        if (acc + d >= step) { const t = (step - acc) / d; prev = [prev[0] + (pts[j][0] - prev[0]) * t, prev[1] + (pts[j][1] - prev[1]) * t]; out.push(prev); acc = 0; }
        else { acc += d; prev = pts[j]; j++; }
      }
      while (out.length < n) out.push(pts[pts.length - 1]);
      return out;
    }
    const near = (p, list) => Math.min(...list.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])));
    // Tolerances in glyph units (the outline is 24 units wide).
    const TOL = {
      trace: lili ? { a: 13, b: 22, c: 30, st: 24 } : { a: 9.5, b: 17, c: 22, st: 17 },
      dots: lili ? { a: 15, b: 24, c: 32, st: 26 } : { a: 11, b: 19, c: 25, st: 19 },
      free: { a: 14, b: 24, c: 30, st: 26 },
    };
    /** Compare one drawn stroke with one model stroke (both in the same px space). */
    function check(u, e, tol, sc) {
      if (e.dot) {
        const c = u.reduce((a, p) => [a[0] + p[0] / u.length, a[1] + p[1] / u.length], [0, 0]);
        return Math.hypot(c[0] - e.px[0][0], c[1] - e.px[0][1]) < tol.st * sc && plen(u) < 40 * sc ? { ok: true } : { ok: false, why: 'shape' };
      }
      if (plen(u) < e.len * sc * 0.45) return { ok: false, why: 'short' };
      const N = 28, R = resample(u, N), Q = resample(e.px, N);
      const prec = R.reduce((a, p) => a + near(p, Q), 0) / N;              // stays on the shape
      const cov = Q.map(q => near(q, R)).sort((x, y) => x - y)[Math.floor(N * 0.9)]; // covers the whole stroke
      const fwd = R.reduce((a, p, i) => a + Math.hypot(p[0] - Q[i][0], p[1] - Q[i][1]), 0) / N;
      const rev = R.reduce((a, p, i) => a + Math.hypot(p[0] - Q[N - 1 - i][0], p[1] - Q[N - 1 - i][1]), 0) / N;
      const startD = Math.hypot(u[0][0] - e.px[0][0], u[0][1] - e.px[0][1]);
      const shapeOk = prec < tol.a * sc && cov < tol.b * sc;
      if (!shapeOk) return { ok: false, why: 'shape' };
      if (rev < fwd && fwd > tol.c * sc) return { ok: false, why: 'reverse' };
      if (startD > tol.st * sc || fwd > tol.c * sc) return { ok: false, why: 'start' };
      return { ok: true };
    }

    const say = segs => api.speak(segs);
    const talk = i => { const t = TALK[exp[i].talk] || ['', '']; return I(`${i + 1}. ${t[0]}`, `${i + 1}. ${t[1]}`); };

    function strokeDone(u) {
      const r = check(u, exp[k], TOL[stage], s);
      if (r.ok) {
        accepted.push(u);
        mallet(hz(NOTES[Math.min(k, NOTES.length - 1)]), 0, 0.35, 0.18);
        k++;
        if (k >= exp.length) return finishOk();
        say([talk(k)]);
        draw();
        return;
      }
      failInk = { strokes: [u], t: performance.now() };
      fails++;
      draw();
      if (fails >= 3) { fails = 0; api.wrong(); return; }
      const msg = r.why === 'reverse' ? I('Toiseen suuntaan! Seuraa nuolta.', 'The other way! Follow the arrow.')
        : r.why === 'start' ? I('Aloita vihreästä pisteestä.', 'Start at the green dot.')
        : r.why === 'short' ? I('Vedä koko matka loppuun asti.', 'Go all the way to the end.')
        : stage === 'trace' ? I('Pysy viivojen sisällä.', 'Stay inside the lines.') : I('Seuraa pisteitä.', 'Follow the dots.');
      say([msg, talk(k)]);
    }

    function finishOk() {
      locked = true; result = 'ok'; clearTimeout(autoTimer);
      draw();
      api.correct({ say: [E(it.ch)] });
    }

    // Free writing: fit the child's whole drawing onto the model, then check every stroke in order.
    function checkFree(auto) {
      if (locked || !free.length) return;
      if (free.length !== exp.length) {
        if (auto) return;
        return freeFail(free.length < exp.length ? 'missing' : 'extra');
      }
      const allU = free.flat(), allE = exp.flatMap(e => e.px);
      const bb = a => { const xs = a.map(p => p[0]), ys = a.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
      const [ux0, uy0, ux1, uy1] = bb(allU), [ex0, ey0, ex1, ey1] = bb(allE);
      const sy = (ey1 - ey0) / Math.max(10, uy1 - uy0), sx = (ex1 - ex0) / Math.max(10, ux1 - ux0);
      const kk = ex1 - ex0 < 20 * s ? sy : Math.sqrt(sx * sy);
      const ucx = (ux0 + ux1) / 2, ucy = (uy0 + uy1) / 2, ecx = (ex0 + ex1) / 2, ecy = (ey0 + ey1) / 2;
      const tf = p => [ecx + (p[0] - ucx) * kk, ecy + (p[1] - ucy) * kk];
      let bad = null;
      for (let i = 0; i < exp.length; i++) {
        const r = check(free[i].map(tf), exp[i], TOL.free, s);
        if (!r.ok) { bad = { i, why: r.why }; break; }
      }
      if (!bad) return finishOk();
      freeFail(bad.why === 'shape' ? 'shape' : 'order', bad.i);
    }
    function freeFail(why, i) {
      fails++;
      failInk = { strokes: free.slice(), t: performance.now() };
      free.length = 0; draw();
      if (fails >= 2) { fails = 0; api.wrong(); return; }
      const n = exp.length;
      const msg = why === 'missing' || why === 'extra'
        ? I(`Tässä on ${n} ${n === 1 ? 'veto' : 'vetoa'}. Katso mallia.`, `This one has ${n} ${n === 1 ? 'stroke' : 'strokes'}. Look at the model.`)
        : why === 'order' ? I(`Melkein! Katso vedon ${i + 1} suunta ja järjestys mallista.`, `Almost! Check the order and direction of stroke ${i + 1} in the model.`)
          : I('Kokeile uudestaan. Katso mallia ja aloita numerosta 1.', 'Try again. Look at the model and start at number 1.');
      say([msg]);
    }

    // ---------- pointer input (S Pen: ignore palm touches) ----------
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    cv.addEventListener('pointerdown', e => {
      if (locked) return;
      if (e.pointerType === 'pen') penSeen = true;
      else if (penSeen && e.pointerType === 'touch') return;
      e.preventDefault();
      if (anim) stopDemo();
      clearTimeout(autoTimer);
      try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic or lost pointer */ }
      ink = [pt(e)]; inkId = e.pointerId; draw();
    });
    cv.addEventListener('pointermove', e => {
      if (!ink || e.pointerId !== inkId) return;
      const co = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      for (const ev of co.length ? co : [e]) ink.push(pt(ev));
      draw();
    });
    const up = e => {
      if (e.pointerId !== inkId || !ink) return;
      const u = ink; ink = null; inkId = null;
      if (stage === 'free') {
        free.push(u); draw();
        if (free.length === exp.length) autoTimer = setTimeout(() => checkFree(true), 1100);
      } else strokeDone(u);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    // ---------- demo ----------
    function stopDemo() { if (anim) { anim.cancelled = true; cancelAnimationFrame(anim.raf); clearTimeout(anim.to); anim = null; draw(); } }
    function playDemo(then) {
      stopDemo();
      const a = anim = { i: 0, p: 0, raf: 0, to: 0, cancelled: false };
      const next = () => {
        if (a.cancelled) return;
        if (a.i >= exp.length) { a.to = setTimeout(() => { if (anim === a) { anim = null; draw(); then && then(); } }, 600); return; }
        const e = exp[a.i];
        say([talk(a.i)]);
        const dur = e.dot ? 380 : Math.max(800, e.len * 12);
        const t0 = performance.now() + 300;
        const tick = now => {
          if (a.cancelled) return;
          a.p = Math.max(0, Math.min(1, (now - t0) / dur));
          draw();
          if (a.p < 1) a.raf = requestAnimationFrame(tick);
          else { a.i++; a.p = 0; a.to = setTimeout(next, 450); }
        };
        a.raf = requestAnimationFrame(tick);
      };
      next();
    }

    // ---------- layout ----------
    const isCap = /^[A-Z]$/.test(it.ch), isNum = /^\d+$/.test(it.ch);
    const what = isNum ? I('numero', 'the number') : isCap ? I('iso kirjain', 'capital letter') : I('kirjain', 'the letter');
    const watchBtn = h('button', { class: 'btn' }, '👀 ' + api.t('Katso', 'Watch'));
    const clearBtn = h('button', { class: 'btn' }, '🧽 ' + api.t('Alusta', 'Start over'));
    const doneBtn = stage === 'free' ? h('button', { class: 'btn primary' }, '✓ ' + api.t('Valmis', 'Done')) : null;
    watchBtn.onclick = () => { if (!locked) { reset(); playDemo(() => say([I('Nyt sinä!', 'Your turn!'), talk(0)])); } };
    clearBtn.onclick = () => { if (!locked) { stopDemo(); reset(); } };
    if (doneBtn) doneBtn.onclick = () => { clearTimeout(autoTimer); if (!free.length) say([I('Kirjoita ensin.', 'Write it first.')]); else checkFree(false); };
    function reset() { k = 0; accepted.length = 0; free.length = 0; clearTimeout(autoTimer); draw(); }

    // A small model with numbered strokes for the free step.
    let model = null;
    if (stage === 'free') {
      const mw = 92, mh = 84, ms = Math.min((mh * 0.8) / 145, (mw * 0.8) / L.w);
      const mc = h('canvas', { width: mw * dpr, height: mh * dpr, style: { width: mw + 'px', height: mh + 'px' } });
      const m = mc.getContext('2d'); m.scale(dpr, dpr);
      const mox = (mw - L.w * ms) / 2, moy = (mh - 140 * ms) / 2 + 2;
      const MP = ([x, y]) => [mox + x * ms, moy + y * ms];
      m.lineCap = 'round'; m.lineJoin = 'round';
      m.strokeStyle = '#334155'; m.lineWidth = 3.2;
      for (const st of L.strokes) { pathOf(m, st.pts.map(MP)); m.stroke(); }
      L.strokes.forEach((st, i) => {
        const [x, y] = MP(st.pts[0]);
        m.fillStyle = '#16a34a'; m.beginPath(); m.arc(x, y, 6, 0, 7); m.fill();
        m.fillStyle = '#fff'; numText(m, i + 1, x, y, 9);
      });
      model = h('button', { class: 'model', 'aria-label': api.t('Malli', 'Model'), onclick: () => watchBtn.onclick() }, h('small', {}, api.t('Malli', 'Model')), mc);
    }

    api.body.append(h('div', { class: 'trace' }, model, cv), h('div', { class: 'row' }, watchBtn, clearBtn, doneBtn));
    api.onLeave(() => { stopDemo(); clearTimeout(autoTimer); clearTimeout(raf); raf = 0; });

    const yourTurn = () => say(stage === 'free' ? [I('Nyt sinä! Aloita numerosta 1.', 'Your turn! Start at number 1.')] : [I('Nyt sinä!', 'Your turn!'), talk(0)]);
    let demoStarted = false;
    const startDemo = () => { if (demoStarted || locked || ink || accepted.length || free.length) return; demoStarted = true; playDemo(yourTurn); };
    let segs;
    if (it.demo) segs = [I('Katso ensin, miten kirjoitetaan', 'Watch first how to write'), what, E(it.ch)];
    else if (stage === 'trace') segs = [I('Kirjoita viivojen sisään', 'Trace inside the lines:'), what, E(it.ch), I('Aloita numerosta 1.', 'Start at number 1.')];
    else if (stage === 'dots') segs = [I('Kirjoita pisteitä pitkin', 'Write along the dots:'), what, E(it.ch)];
    else segs = [I('Nyt kirjoita itse viivoille', 'Now write it yourself on the lines:'), what, E(it.ch)];

    const go = () => {
      draw(); loop();
      if (it.demo) { api.prompt(segs, startDemo); setTimeout(startDemo, 4500); }
      else api.prompt(segs);
    };
    (document.fonts ? document.fonts.load('800 20px Nunito').catch(() => {}) : Promise.resolve()).then(() => draw());
    go();

    return {
      hint() {
        stopDemo(); reset(); fails = 0;
        if (stage === 'free') stage = 'dots';
        draw();
        setTimeout(() => { if (!locked) playDemo(yourTurn); }, 1600);
        return [I('Katsotaan vielä kerran.', "Let's watch once more.")];
      },
      reveal() {
        locked = true; result = 'model'; clearTimeout(autoTimer);
        setTimeout(() => { anim = null; playDemo(() => { result = 'model'; draw(); }); }, 1800);
        draw();
        return [I('Hyvä yritys! Katso järjestys ja suunta:', 'Good try! Watch the order and direction:'), E(it.ch)];
      },
    };
  },
};
