// CHAPTERS KIT — long videos as a list of chapters, each drawn on its own local clock.
// Works in score.js / song.js (node) and film.js (browser, global `Chapters`).
//
// score.js:   const CH = Chapters.timeline([{ id: 'intro', title: 'เปิดเรื่อง', dur: 18, card: false },
//                                           { id: 'c1', title: 'ทำไมเราชอบเทียบ', dur: 60 }, …]);
//             → each gets start / end / n (chapter number, intro and outro uncounted); DURATION = Chapters.total(CH)
// film.js:    Chapters.draw(ctx, t, S.chapters, { intro: (ctx, t, c) => …, c1: … }, { W, H });
//             a chapter's draw gets its LOCAL time (0 at its start); a title card plays over its first seconds
//             (`card: false` to skip), and a thin progress bar with chapter ticks runs along the bottom.
// node:       node kit/chapters.js  → YouTube chapter lines ("0:00 เปิดเรื่อง") from ./score.js
(function () {
  const Chapters = {};
  const CARD = 2.6;

  Chapters.timeline = (list, { card = CARD } = {}) => {
    let t = 0, n = 0;
    return list.map((c) => {
      const out = { ...c, start: t, end: t + c.dur, n: c.card === false ? 0 : ++n, cardDur: c.card === false ? 0 : card };
      t += c.dur;
      return out;
    });
  };
  Chapters.total = (ch) => ch[ch.length - 1].end;
  Chapters.at = (ch, t) => ch.find((c) => t >= c.start && t < c.end) || ch[ch.length - 1];
  const stamp = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  // YouTube needs the first chapter at 0:00, at least 3 chapters, each ≥ 10 s
  Chapters.youtube = (ch) => ch.map((c) => `${stamp(c.start)} ${c.n ? `บทที่ ${c.n}: ` : ''}${c.title}`).join('\n');

  // ---------- browser: dispatch + overlays ----------
  Chapters.draw = (ctx, t, ch, scenes, o = {}) => {
    const c = Chapters.at(ch, t), local = t - c.start, fn = scenes[c.id];
    if (!fn) throw new Error(`no scene for chapter "${c.id}"`);
    fn(ctx, local, c);
    if (c.cardDur && local < c.cardDur) Chapters.card(ctx, local, c, o);
    if (o.progress !== false) Chapters.progress(ctx, t, ch, o);
  };

  // the chapter card: a band slides in from the left with the number pill and the title, holds, slides out
  Chapters.card = (ctx, local, c, { W, H, accent = '#FFD23F', band = 'rgba(18,18,36,0.9)', font = 'Kanit' } = {}) => {
    const U = globalThis.U, { clamp, ease } = U;
    const inP = ease.outCubic(clamp(local / 0.45)), outP = ease.inCubic(clamp((local - (c.cardDur - 0.45)) / 0.45));
    const x = (inP - 1 - outP) * W, land = W > H, y = land ? H * 0.42 : H * 0.36, bh = land ? H * 0.2 : H * 0.12;
    ctx.save(); ctx.translate(x, 0);
    ctx.fillStyle = band; ctx.fillRect(0, y - bh / 2, W, bh);
    const size = bh * 0.38;
    ctx.font = `700 ${size * 0.6}px ${font}`;
    const pill = `บทที่ ${c.n}`, pw = ctx.measureText(pill).width + size * 0.7, px = W * 0.08;
    ctx.fillStyle = accent; ctx.beginPath(); ctx.roundRect(px, y - size * 1.05, pw, size * 0.85, size * 0.2); ctx.fill();
    ctx.fillStyle = '#1A1A2E'; ctx.textBaseline = 'middle'; ctx.fillText(pill, px + size * 0.35, y - size * 0.62);
    ctx.fillStyle = '#FFFFFF'; ctx.font = `700 ${size}px ${font}`; ctx.fillText(c.title, px, y + size * 0.5);
    ctx.restore();
  };

  // bottom progress: one segment per chapter, the current one filling up
  Chapters.progress = (ctx, t, ch, { W, H, accent = '#FFD23F' } = {}) => {
    const total = Chapters.total(ch), h = Math.max(6, H * 0.006), y = H - h - (W > H ? 0 : H * 0.225), gap = 6;
    ctx.save();
    for (const c of ch) {
      const x0 = (c.start / total) * W + (c.start ? gap / 2 : 0), x1 = (c.end / total) * W - gap / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0, y, x1 - x0, h);
      const f = Math.max(0, Math.min(1, (t - c.start) / c.dur));
      if (f > 0) { ctx.fillStyle = accent; ctx.fillRect(x0, y, (x1 - x0) * f, h); }
    }
    ctx.restore();
  };

  if (typeof module !== 'undefined') {
    module.exports = Chapters;
    if (require.main === module) { // node kit/chapters.js → YouTube chapters from ./score.js (+ a self-check)
      const ch = Chapters.timeline([{ id: 'a', title: 'A', dur: 12, card: false }, { id: 'b', title: 'B', dur: 70 }, { id: 'c', title: 'C', dur: 3600 }]);
      if (Chapters.youtube(ch) !== '0:00 A\n0:12 บทที่ 1: B\n1:22 บทที่ 2: C' || Chapters.total(ch) !== 3682 || Chapters.at(ch, 12).id !== 'b') throw new Error('chapters self-check failed');
      const file = require('path').resolve('score.js');
      if (!require('fs').existsSync(file)) { console.log('self-check ok; run it from an episode folder to print its chapters'); process.exit(0); }
      const S = require(file);
      if (!S.chapters) { console.log('score.js has no `chapters` (Chapters.timeline(...))'); process.exit(1); }
      const short = S.chapters.filter((c) => c.dur < 10).map((c) => c.id);
      console.log(Chapters.youtube(S.chapters));
      if (S.chapters.length < 3 || short.length) console.error(`\n(YouTube shows chapters only with ≥ 3 chapters of ≥ 10 s each${short.length ? `; too short: ${short.join(', ')}` : ''})`);
    }
  } else globalThis.Chapters = Chapters;
})();
