// ART KIT — four more drawing styles on top of the engine's (paper flat pixel chalk neon watercolor):
//   ink      พู่กันหมึก: tapered brush outlines, one flat sepia wash, no hatching — folk tales, legends
//   woodcut  ภาพพิมพ์แกะไม้: 3 tones of ink on paper, carved line shading, thick black edges, reds kept — dark legends
//   crayon   สีเทียนเด็ก: scribbled wax fills that boil, waxy broken outlines — kid's drawing, diary, comedy
//   manga    มังงะ: crisp black lines, white paper, dot screentone by darkness — mystery, puzzles
// Load after engine/video/gfx.js, before chibi.js:  <script src="kit/art.js"></script>
// Pick it like any engine style: score.js STYLE = 'woodcut', or render with --style woodcut.
// It wraps G.shape / G.line / G.limb only when one of these styles is on; the engine's own styles are untouched.
(function () {
  const G = globalThis.G, U = globalThis.U, H = U.hash;
  const INK = '#17110D';

  // ---------- colour helpers (hex, rgb(), rgba(); anything else passes through) ----------
  function rgba(c) {
    const s = String(c).trim();
    let m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m) return [...m[1]].map((x) => parseInt(x + x, 16)).concat(1);
    if ((m = /^#([0-9a-f]{6})$/i.exec(s))) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; }
    if ((m = /^rgba?\(([^)]+)\)$/i.exec(s))) { const v = m[1].split(',').map(parseFloat); return [v[0], v[1], v[2], v[3] ?? 1]; }
    return null;
  }
  const lum = (v) => (0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) / 255;
  const css = (v, a = v[3]) => `rgba(${Math.round(v[0])},${Math.round(v[1])},${Math.round(v[2])},${a})`;
  const mix = (v, w, k) => [0, 1, 2].map((i) => v[i] + (w[i] - v[i]) * k).concat(v[3]);
  const isRed = (v) => v[0] > 140 && v[0] > v[1] * 1.8 && v[0] > v[2] * 1.8; // keep the red box / blood red in woodcut

  // a closed or open point list → brush outline polygon (tapered at the ends when open)
  function brush(ctx, p, closed, lw, seed, color) {
    const n = p.length;
    if (n < 2) return;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = p[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = p[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
      const u = n > 1 ? i / (n - 1) : 0.5, taper = closed ? 1 : Math.pow(Math.sin(Math.PI * Math.min(0.98, Math.max(0.02, u))), 0.6);
      const w = (lw * 0.5) * taper * (0.55 + 0.9 * H(seed, i, 41));
      L.push([p[i][0] + nx * w, p[i][1] + ny * w]); R.push([p[i][0] - nx * w, p[i][1] - ny * w]);
    }
    ctx.save(); ctx.fillStyle = color;
    if (closed) { ctx.beginPath(); G.path(ctx, L, true); G.path(ctx, R.reverse(), true); ctx.fill('evenodd'); }
    else { ctx.beginPath(); G.path(ctx, L.concat(R.reverse()), true); ctx.fill(); }
    ctx.restore();
  }

  // scribble fill inside the current clip, at an angle per shape
  function scribble(ctx, box, color, seed, gap = 11) {
    const [x0, y0, x1, y1] = box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.hypot(x1 - x0, y1 - y0) / 2 + gap;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.7 + H(seed, 3) * 0.5);
    ctx.strokeStyle = color; ctx.lineWidth = gap * 1.05; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha *= 0.82;
    ctx.beginPath();
    for (let y = -r, k = 0; y < r; y += gap * 1.6, k++) {
      for (let x = -r, j = 0; x <= r; x += 22, j++) {
        const yy = y + (j % 2 ? gap * 0.9 : 0) + (H(seed, k, j, G.boil) - 0.5) * gap * 0.8;
        if (j === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
    }
    ctx.stroke(); ctx.restore();
  }

  // dot screentone inside the current clip; darker = bigger dots
  function tone(ctx, box, dark, step = 11) {
    const [x0, y0, x1, y1] = box, r = step * 0.62 * Math.sqrt(dark);
    if (r < 0.6) return;
    ctx.save(); ctx.fillStyle = INK; ctx.beginPath();
    for (let y = Math.floor(y0 / step) * step, row = 0; y < y1 + step; y += step, row++) {
      for (let x = Math.floor(x0 / step) * step + (row % 2 ? step / 2 : 0); x < x1 + step; x += step) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
    }
    ctx.fill(); ctx.restore();
  }

  // ---------- each style: how a filled shape and an outline are drawn ----------
  const ART = {
    ink: {
      fill(ctx, p, v, seed) { ctx.fillStyle = css(mix(v, [217, 199, 160], 0.35), v[3] * 0.92); ctx.beginPath(); G.path(ctx, p, true); ctx.fill(); },
      stroke(ctx, p, closed, lw, seed, col) { brush(ctx, p, closed, lw * 2.4, seed, col === G.C.ink ? INK : col); },
      limbColor: (v) => mix(v, [217, 199, 160], 0.35),
    },
    woodcut: {
      fill(ctx, p, v, seed) {
        const l = lum(v), red = isRed(v);
        ctx.beginPath(); G.path(ctx, p, true);
        ctx.fillStyle = red ? '#B3201C' : l < 0.33 ? INK : '#EDE3CC'; ctx.globalAlpha *= v[3]; ctx.fill();
        if (red) return;
        ctx.save(); ctx.clip();
        const bb = G.bbox(p);
        if (l < 0.33) G.hatch(ctx, bb, { color: '#EDE3CC', gap: 15, lw: 2.2, angle: 0.15, seed, jitter: 2 }); // carved highlights
        else if (l < 0.68) G.hatch(ctx, bb, { color: INK, gap: 5 + (l - 0.33) * 22, lw: 2.6, angle: -0.35, seed, jitter: 1 });
        ctx.restore();
      },
      stroke(ctx, p, closed, lw, seed) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = lw * 2.1; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); G.path(ctx, p, closed); ctx.stroke(); ctx.restore(); },
      limbColor: (v) => (isRed(v) ? [179, 32, 28, 1] : lum(v) < 0.33 ? [23, 17, 13, 1] : [237, 227, 204, 1]),
    },
    crayon: {
      fill(ctx, p, v, seed) {
        ctx.beginPath(); G.path(ctx, p, true);
        ctx.fillStyle = css(v, v[3] * 0.6); ctx.fill();
        ctx.save(); ctx.clip(); scribble(ctx, G.bbox(p), css(mix(v, [0, 0, 0], 0.12)), seed, 9); ctx.restore();
      },
      stroke(ctx, p, closed, lw, seed, col) {
        ctx.save(); ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          const q = G.wobble(p, seed + k * 13, 3);
          ctx.globalAlpha *= k ? 0.6 : 0.9; ctx.lineWidth = lw * (k ? 0.8 : 1.5);
          ctx.setLineDash([lw * 6, lw * (0.4 + H(seed, k)), lw * 3, lw * 0.6]); ctx.lineDashOffset = H(seed, k, G.boil) * lw * 10;
          ctx.beginPath(); G.path(ctx, q, closed); ctx.stroke();
        }
        ctx.restore();
      },
      limbColor: (v) => v,
    },
    manga: {
      fill(ctx, p, v, seed) {
        const l = lum(v);
        ctx.beginPath(); G.path(ctx, p, true); ctx.globalAlpha *= v[3];
        ctx.fillStyle = l < 0.16 ? INK : '#FFFFFF'; ctx.fill();
        if (l >= 0.16 && l < 0.7) { ctx.save(); ctx.clip(); tone(ctx, G.bbox(p), 1 - (l - 0.16) / 0.54); ctx.restore(); } // faces and paper stay white
      },
      stroke(ctx, p, closed, lw) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.25; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); G.path(ctx, p, closed); ctx.stroke(); ctx.restore(); },
      limbColor: (v) => { const l = lum(v); return l < 0.16 ? [23, 17, 13, 1] : [255 - (1 - l) * 90, 255 - (1 - l) * 90, 255 - (1 - l) * 90, 1]; },
    },
  };

  Object.assign(G.STYLES, {
    ink: { amp: 1.1, lw: 1, second: false, hatch: false, textBoil: 0.4, boilFps: 6, art: 'ink', post: { paper: 0.8, grain: 0.05, vignette: 0.4 } },
    woodcut: { amp: 0.7, lw: 1, second: false, hatch: false, textBoil: 0.2, boilFps: 6, art: 'woodcut', post: { paper: 0.6, grain: 0.12, vignette: 0.3 } },
    crayon: { amp: 1.8, lw: 1, second: false, hatch: false, textBoil: 1, boilFps: 8, art: 'crayon', post: { paper: 0.25, grain: 0.08, vignette: 0.12 } },
    manga: { amp: 0.35, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 4, art: 'manga', post: { paper: 0, grain: 0.02, vignette: 0.1 } },
  });

  const shape0 = G.shape, line0 = G.line, limb0 = G.limb;
  G.shape = (ctx, pts, o = {}) => {
    const A = ART[G.style.art];
    if (!A) return shape0(ctx, pts, o);
    const { fill, stroke = G.C.ink, seed = 1, closed = true, alpha = 1 } = o;
    const amp = (o.amp ?? 1.6) * G.style.amp, lw = o.lw ?? 4;
    const p = amp > 0 ? G.wobble(pts, seed, amp) : pts;
    ctx.save();
    if (alpha !== 1) ctx.globalAlpha *= alpha;
    const v = fill && closed ? rgba(fill) : null;
    if (v) ctx.save(), A.fill(ctx, p, v, seed), ctx.restore();
    else if (fill && closed) { ctx.fillStyle = fill; ctx.beginPath(); G.path(ctx, p, true); ctx.fill(); } // gradients, patterns
    if (stroke && lw > 0) A.stroke(ctx, p, closed, lw, seed, stroke);
    ctx.restore();
    return p;
  };
  G.line = (ctx, pts, o = {}) => {
    const A = ART[G.style.art];
    if (!A) return line0(ctx, pts, o);
    const { color = G.C.ink, lw = 4, seed = 9, amp = 1.4, step = 20, alpha = 1 } = o;
    const sub = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 0; k < n; k++) sub.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    sub.push(pts[pts.length - 1]);
    const p = amp * G.style.amp > 0 ? G.wobble(sub, seed, amp * G.style.amp) : sub;
    ctx.save(); ctx.globalAlpha *= alpha; A.stroke(ctx, p, false, lw, seed, color); ctx.restore();
  };
  G.limb = (ctx, pts, o = {}) => {
    const A = ART[G.style.art], v = A && o.color ? rgba(o.color) : null;
    if (!v) return limb0(ctx, pts, o);
    return limb0(ctx, pts, { ...o, color: css(A.limbColor(v)), ink: INK, outline: (o.outline ?? 4.5) * (G.style.art === 'woodcut' ? 1.6 : 1) });
  };

  // colour grade for the whole shot. Call it in film.js after the shots and BEFORE the subtitles, so key-line
  // red boxes keep their colour:  draw(ctx, t) { film(ctx, t); G.grade(ctx); subtitles(ctx, t); … }
  // No-op for every other style. Backgrounds and lights drawn with plain ctx fills only change here.
  const GRADE = {
    ink: [['saturation', '#808080', 0.55], ['multiply', '#E9D6AE', 0.6]],
    woodcut: [['saturation', '#808080', 1], ['self-overlay'], ['multiply', '#E8DCC0', 1]],
    manga: [['saturation', '#808080', 1], ['self-overlay'], ['self-overlay']],
  };
  G.grade = (ctx) => {
    const steps = GRADE[G.style.art];
    if (!steps) return;
    const c = ctx.canvas;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [op, color, a] of steps) {
      if (op === 'self-overlay') { // contrast: the frame overlaid on itself
        const t = G.scratch('grade', c.width, c.height), x = t.getContext('2d'); x.clearRect(0, 0, t.width, t.height); x.drawImage(c, 0, 0);
        ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 1; ctx.drawImage(t, 0, 0);
      } else { ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(0, 0, c.width, c.height); }
    }
    ctx.restore();
  };

  // the engine picked the film's style before these existed: pick again now that they do
  try { G.setStyle(U.pickStyle((globalThis.SCORE && globalThis.SCORE.STYLE) || 'paper')); } catch (e) { console.warn(e.message); }
})();
