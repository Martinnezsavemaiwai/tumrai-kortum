// STYLE KIT — subtitle styles, extra fonts, glitch and VHS looks for TumraiKortum films.
// Load after engine/util.js and before film.js:  <script src="kit/style.js"></script>
//
//   await Kit.font('Chakra Petch', 700);                       // assets/fonts/ChakraPetch-700.ttf (setup-fonts.mjs)
//   Kit.subtitles(ctx, t, S.subtitles, { style: 'glitch', font: 'Chakra Petch', W, H });
//   Kit.glitch(ctx, t, 0.8, 3);   Kit.vhs(ctx, t, 1);           // after the shot, before the subtitles
//
// Sub styles: outline · box · pop · karaoke · shake · glitch · paper · type · keyword. Mark keywords with *stars*
// ("เข้าเส้นชัย*คนสุดท้าย*"): `keyword` boxes them in yellow, every other style (and tts.py) drops the stars.
// A sub with `red: true` is a key
// line and always gets the red box, whatever the style. Which style goes with which genre: references/genres.md.
// Everything is a pure function of t (U.hash, no Math.random) so frames render the same every time.
(function () {
  const U = globalThis.U;
  const { clamp, ease, hash } = U;
  const Kit = {};

  Kit.font = (family, weight = 700) => Studio.loadFont(family, `assets/fonts/${family.replace(/ /g, '')}-${weight}.ttf`, weight);

  // Thai has no spaces: split into words with the browser's Thai dictionary, keeping spaces as their own pieces
  const seg = new Intl.Segmenter('th', { granularity: 'word' });
  const words = (s) => [...seg.segment(s)].map((x) => x.segment);

  function outlined(ctx, s, x, y, fill, stroke, lw) {
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
    ctx.fillStyle = fill; ctx.fillText(s, x, y);
  }

  // draw one line word by word, left to right, centred on cx; each(word, i, x) may change the ctx before each word
  function byWord(ctx, ws, cx, y, each) {
    const widths = ws.map((w) => ctx.measureText(w).width);
    let x = cx - widths.reduce((a, b) => a + b, 0) / 2;
    ctx.textAlign = 'left';
    ws.forEach((w, i) => { each(w, i, x, widths[i]); x += widths[i]; });
  }

  // how far through the line the voice is (0..1); words light up/appear by this
  const progress = (sub, t) => clamp((t - sub.t) / Math.max(0.3, (sub.end - sub.t) * 0.8));

  const STYLES = {
    outline(ctx, line, y, o) { ctx.globalAlpha *= o.fadeIn; outlined(ctx, line, o.W / 2, y, o.color, '#000', o.size * 0.19); },
    box(ctx, line, y, o) {
      const w = ctx.measureText(line).width, rise = (1 - ease.outCubic(o.fadeIn)) * 30;
      ctx.globalAlpha *= o.fadeIn;
      ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.beginPath(); ctx.roundRect(o.W / 2 - w / 2 - 28, y - o.size * 0.95 + rise, w + 56, o.size * 1.25, 12); ctx.fill();
      outlined(ctx, line, o.W / 2, y + rise, o.color);
    },
    pop(ctx, line, y, o) { // TikTok style: each word bounces in on its turn, the current one in the accent colour
      const ws = words(line), n = o.wordsBefore + ws.length, p = o.p * o.total;
      byWord(ctx, ws, o.W / 2, y, (w, i, x, wd) => {
        const k = o.wordsBefore + i, u = clamp((p - k) / 0.35);
        if (u <= 0 || !w.trim()) return;
        const s = ease.outBack(u, 2.6), cx = x + wd / 2;
        ctx.save(); ctx.translate(cx, y); ctx.scale(s, s);
        outlined(ctx, w, -wd / 2, 0, k === Math.min(n - 1, Math.floor(p)) ? o.accent : o.color, '#000', o.size * 0.19); ctx.restore();
      });
    },
    karaoke(ctx, line, y, o) { // whole line visible; words fill with the accent as they are spoken
      const ws = words(line), p = o.p * o.total;
      ctx.globalAlpha *= o.fadeIn;
      byWord(ctx, ws, o.W / 2, y, (w, i, x) => outlined(ctx, w, x, y, o.wordsBefore + i < p ? o.accent : o.color, '#000', o.size * 0.19));
    },
    shake(ctx, line, y, o) { // horror: every word trembles on its own, 12 times a second
      const f = Math.floor(o.t * 12);
      ctx.globalAlpha *= o.fadeIn;
      byWord(ctx, words(line), o.W / 2, y, (w, i, x) => {
        const dx = (hash(f, i, 1) - 0.5) * 7, dy = (hash(f, i, 2) - 0.5) * 7;
        outlined(ctx, w, x + dx, y + dy, o.color, '#3A0008', o.size * 0.19);
      });
    },
    glitch(ctx, line, y, o) { // found footage: red/cyan split that snaps for a few frames now and then
      const f = Math.floor(o.t * 15), burst = hash(f, 7) > 0.82 || o.t - o.sub.t < 0.2;
      const d = burst ? 6 + hash(f, 8) * 10 : 2;
      ctx.globalAlpha *= o.fadeIn;
      outlined(ctx, line, o.W / 2, y, o.color, '#000', o.size * 0.19);
      ctx.globalCompositeOperation = 'screen';
      outlined(ctx, line, o.W / 2 - d, y, 'rgba(255,0,60,0.8)');
      outlined(ctx, line, o.W / 2 + d, y + (burst ? 3 : 0), 'rgba(0,230,255,0.7)');
    },
    paper(ctx, line, y, o) { // ink on a torn paper strip, tilted a little per line
      const w = ctx.measureText(line).width, tilt = (hash(o.sub.t, o.li) - 0.5) * 0.05;
      ctx.globalAlpha *= o.fadeIn;
      ctx.save(); ctx.translate(o.W / 2, y - o.size * 0.33); ctx.rotate(tilt);
      const hw = w / 2 + 36, hh = o.size * 0.82; // tall: handwriting fonts stack tone marks high
      ctx.beginPath(); ctx.moveTo(-hw, -hh);
      for (let k = 0; k <= 16; k++) ctx.lineTo(-hw + (2 * hw * k) / 16, -hh + (hash(k, o.li, 3) - 0.5) * 10); // torn top edge
      for (let k = 16; k >= 0; k--) ctx.lineTo(-hw + (2 * hw * k) / 16, hh + (hash(k, o.li, 4) - 0.5) * 10);
      ctx.closePath(); ctx.fillStyle = '#EFE4C8'; ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.fillStyle = '#231A14'; ctx.fillText(line, 0, o.size * 0.33);
      ctx.restore();
    },
    type(ctx, line, y, o) { // typewriter: words appear one by one, a block cursor after the last one
      const ws = words(line), p = o.p * o.total, shown = ws.filter((_, i) => o.wordsBefore + i < p);
      if (!shown.length) return;
      ctx.textAlign = 'left';
      const full = ctx.measureText(line).width, x0 = o.W / 2 - full / 2, s = shown.join('');
      outlined(ctx, s, x0, y, o.color, '#000', o.size * 0.19);
      if (Math.floor(o.t * 2.5) % 2 === 0) {
        ctx.fillStyle = o.color; ctx.fillRect(x0 + ctx.measureText(s).width + 8, y - o.size * 0.75, o.size * 0.42, o.size * 0.9);
      }
    },
    keyword(ctx, line, y, o) { // explainer: white on a dark bar, *keywords* in a yellow box that pops in
      const segs = line.split('*'), pad = o.size * 0.18;
      const widths = segs.map((sg, i) => ctx.measureText(sg).width + (i % 2 ? pad * 2 : 0));
      const total = widths.reduce((a, b) => a + b, 0), x0 = o.W / 2 - total / 2, rise = (1 - ease.outCubic(o.fadeIn)) * 24;
      ctx.globalAlpha *= o.fadeIn;
      ctx.fillStyle = 'rgba(18,18,36,0.82)'; ctx.beginPath(); ctx.roundRect(x0 - 26, y - o.size * 0.98 + rise, total + 52, o.size * 1.3, 16); ctx.fill();
      ctx.textAlign = 'left';
      let x = x0;
      segs.forEach((sg, i) => {
        if (i % 2) {
          const k = (i - 1) / 2, pp = ease.outBack(clamp((o.t - o.sub.t - 0.15 - k * 0.25) / 0.25), 2.2), cx = x + widths[i] / 2, cy = y - o.size * 0.33 + rise;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(pp, pp); ctx.translate(-cx, -cy);
          ctx.fillStyle = o.accent; ctx.beginPath(); ctx.roundRect(x, y - o.size * 0.9 + rise, widths[i], o.size * 1.14, 10); ctx.fill();
          ctx.fillStyle = '#1A1A2E'; ctx.fillText(sg, x + pad, y + rise); ctx.restore();
        } else { ctx.fillStyle = o.color; ctx.fillText(sg, x, y + rise); }
        x += widths[i];
      });
    },
  };
  Kit.SUB_STYLES = Object.keys(STYLES);

  // subs: [{ t, end, text ('\n' line breaks), en, red }] — the shape score.js already builds
  Kit.subtitles = (ctx, t, subs, o = {}) => {
    const sub = subs.find((x) => t >= x.t && t < x.end);
    if (!sub) return;
    const { W, H } = o, style = STYLES[o.style || 'outline'];
    if (!style) throw new Error(`unknown sub style ${o.style}; have ${Kit.SUB_STYLES.join(', ')}`);
    const font = o.font || 'Kanit', weight = o.weight || 700, base = H * (W > H ? 0.87 : 0.75); // 16:9: low, like TV subtitles; 9:16: above the platform UI
    const keep = o.style === 'keyword' && !sub.red, lines = sub.text.split('\n').map((ln) => (keep ? ln : ln.replace(/\*/g, '')));
    const size = (sub.red ? 96 : 84) * (o.scale || 1) * (W > H ? 0.78 : 1), lh = size * 1.22;
    const counts = lines.map((ln) => words(ln.replace(/\*/g, '')).length), total = counts.reduce((a, b) => a + b, 0);
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    if (sub.red) { // key line: the red box, popping in, in every style
      const pp = ease.outBack(clamp((t - sub.t) / 0.2), 2.4);
      ctx.translate(W / 2, base); ctx.scale(pp, pp); ctx.translate(-W / 2, -base);
      lines.forEach((ln, i) => {
        const y = base - (lines.length - 1 - i) * lh, w = ctx.measureText(ln).width;
        ctx.fillStyle = '#C81E1E'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 30, y - size * 0.92, w + 60, size * 1.2, 14); ctx.fill();
        outlined(ctx, ln, W / 2, y, '#FFFFFF');
      });
    } else {
      let before = 0;
      lines.forEach((ln, i) => {
        ctx.save();
        style(ctx, ln, base - (lines.length - 1 - i) * lh, {
          W, H, t, sub, size, li: i, total, wordsBefore: before, p: progress(sub, t),
          fadeIn: clamp((t - sub.t) / 0.25), color: o.color || '#FFFFFF', accent: o.accent || '#FFD23F',
        });
        ctx.restore(); before += counts[i];
      });
    }
    if (sub.en) {
      ctx.globalAlpha = clamp((t - sub.t) / 0.25); ctx.textAlign = 'center';
      ctx.font = `500 38px Kanit`; outlined(ctx, sub.en, W / 2, base + 70, '#D8D8D8', '#000', 8);
    }
    ctx.restore();
  };

  // ---------- looks, drawn over the finished shot ----------
  let tmp = null;
  const scratch = (c) => {
    if (!tmp) tmp = document.createElement('canvas');
    if (tmp.width !== c.width || tmp.height !== c.height) { tmp.width = c.width; tmp.height = c.height; }
    const x = tmp.getContext('2d'); x.clearRect(0, 0, tmp.width, tmp.height); x.drawImage(c, 0, 0);
    return tmp;
  };

  // digital glitch: torn horizontal slices + a red/cyan ghost. amt 0..1; use in short bursts (≤ 0.4 s)
  Kit.glitch = (ctx, t, amt = 1, seed = 1) => {
    if (amt <= 0) return;
    const c = ctx.canvas, src = scratch(c), f = Math.floor(t * 24), w = c.width, h = c.height;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let k = 0; k < 4 + amt * 10; k++) {
      const y = hash(f, k, seed) * h, sh = (0.01 + hash(f, k, seed + 1) * 0.07) * h, dx = (hash(f, k, seed + 2) - 0.5) * w * 0.12 * amt;
      ctx.drawImage(src, 0, y, w, sh, dx, y, w, sh);
    }
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.35 * amt;
    ctx.drawImage(src, w * 0.008 * amt, 0); ctx.fillStyle = 'rgba(255,0,60,0.5)'; ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.15 * amt; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  // VHS / CCTV: scanlines, a slow tracking band rolling down, a little colour bleed. amt 0..1
  Kit.vhs = (ctx, t, amt = 1) => {
    const c = ctx.canvas, w = c.width, h = c.height, s = w / 1080;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(0,0,0,${0.16 * amt})`;
    for (let y = 0; y < h; y += 4 * s) ctx.fillRect(0, y, w, 1.5 * s);
    const by = ((t * 0.13) % 1.2 - 0.1) * h, bh = 46 * s;
    const src = scratch(c);
    ctx.globalAlpha = 0.8 * amt; ctx.drawImage(src, 0, by, w, bh, (hash(Math.floor(t * 24), 3) - 0.5) * 24 * s, by, w, bh);
    ctx.globalAlpha = 0.12 * amt; ctx.fillStyle = '#FFFFFF';
    for (let k = 0; k < 40; k++) ctx.fillRect(hash(Math.floor(t * 24), k) * w, by + hash(k, Math.floor(t * 24)) * bh, 30 * s, 2 * s);
    ctx.restore();
  };

  globalThis.Kit = Kit;
})();
