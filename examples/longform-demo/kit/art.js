// ART KIT — more drawing styles on top of the engine's (paper flat chalk):
//   woodcut   ภาพพิมพ์แกะไม้: 3 tones of ink on paper, carved line shading, thick black edges, reds kept — dark legends
//   crayon    สีเทียนเด็ก: scribbled wax fills that boil, waxy broken outlines — kid's drawing, diary, comedy
//   manga     มังงะ: crisp black lines, white paper, dot screentone by darkness — mystery, puzzles
//   comic     การ์ตูนช่อง: bold black outlines, flat colour, halftone dots on the shadow side — action, comedy
//   riso      ริโซกราฟ: five fluoro inks on cream paper, outlines printed a few px off, speckled ink — zines, indie, music
//   papercut  กระดาษตัด: flat paper shapes, no outlines, each casts a soft shadow on the layer below — kids, crafts, fables
//   pixelart  เกม 8-bit: thick outlines, then the frame drops to ~135 px wide with a small dithered palette — games, retro.
//             Text drawn before G.grade turns to mush: draw HUD/labels after it, big.
//   retro     อนิเมะยุค 90: cel shading (one hard shadow), thin warm lines, faded warm grade + film grain — nostalgia, romance
//   diorama   โมเดลจิ๋ว: painted shapes with contact shadows, tilt-shift blur top and bottom, rich colour — towns, slice of life
//   clay      ดินปั้น: rounded shading, a darker edge in the same colour, thumbprint smudges, stop-motion jitter — kids, comedy
//   lowpoly   โลว์โพลี: shapes cut to ≤ 10 corners, faceted into triangles lit from the top left — games, tech, adventure
//   bricks    ตัวต่อพลาสติก: glossy toy plastic; walls and floors built from bricks with seams and studs — toys, kids, builds
//   early3d   เกม 3D ยุคแรก: polygon silhouettes, smooth top-to-bottom shading, a hot highlight, soft low-res frame + bloom — games
// riso, pixelart, retro and diorama do part of their look in G.grade: call it before the subtitles, as below.
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
  function tone(ctx, box, dark, step = 11, color = INK) {
    const [x0, y0, x1, y1] = box, r = step * 0.62 * Math.sqrt(dark);
    if (r < 0.6) return;
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    for (let y = Math.floor(y0 / step) * step, row = 0; y < y1 + step; y += step, row++) {
      for (let x = Math.floor(x0 / step) * step + (row % 2 ? step / 2 : 0); x < x1 + step; x += step) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
    }
    ctx.fill(); ctx.restore();
  }

  // the shadow side of a shape: inside it but outside a copy moved toward the light (top left), like a cel-shading crescent
  function shadowSide(ctx, p, draw, k = 0.11) {
    const bb = G.bbox(p), dx = -(bb[2] - bb[0]) * k, dy = -(bb[3] - bb[1]) * k * 0.8;
    if (!fig(bb)) return;
    ctx.save(); ctx.beginPath(); G.path(ctx, p, true); ctx.clip();
    ctx.beginPath(); ctx.rect(bb[0] - 9e3, bb[1] - 9e3, 2e4, 2e4); ctx.translate(dx, dy); G.path(ctx, p, true); ctx.translate(-dx, -dy); ctx.clip('evenodd');
    draw(bb); ctx.restore();
  }
  // only figures and props get shading and shadows: eyes and highlights are too small, a sky or ground band lies flat
  const fig = (bb) => bb[2] - bb[0] >= 24 && bb[3] - bb[1] >= 24 && bb[2] - bb[0] < 900 && bb[3] - bb[1] < 900;
  // a shadow cast on the layer below (canvas shadows ignore the transform, so scale them by hand)
  const drop = (ctx, x, y, blur, a) => { const k = G.scale || 1; ctx.shadowColor = `rgba(40,25,10,${a})`; ctx.shadowOffsetX = x * k; ctx.shadowOffsetY = y * k; ctx.shadowBlur = blur * k; };
  const plain = (ctx, p, fill) => { ctx.fillStyle = fill; ctx.beginPath(); G.path(ctx, p, true); ctx.fill(); };
  const line = (ctx, p, closed, lw, col) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); G.path(ctx, p, closed); ctx.stroke(); ctx.restore(); };
  const ink = (col) => (col === G.C.ink ? INK : col);

  // riso: every colour is printed with one of five inks, at a strength set by how dark it was; greys go navy or paper
  const PAPER = [244, 238, 220, 1], NAVY = [29, 59, 143, 1];
  const INKS = [[255, 72, 176], [255, 108, 47], [255, 232, 0], [0, 169, 92], [0, 120, 191]].map((c) => c.concat(1));
  const hue = (v) => { const [r, g, b] = v.map((x) => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return [0, 0]; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, d / (1 - Math.abs(mx + mn - 1) || 1)]; };
  const INK_HUES = INKS.map((c) => hue(c)[0]), arc = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  function riso(v) {
    const l = lum(v), [h, sat] = hue(v);
    if (sat < 0.18 || l < 0.22) return (l > 0.82 ? PAPER : mix(PAPER, NAVY, Math.min(1, (1 - l) * 1.2))).slice(0, 3).concat(v[3]);
    const i = INK_HUES.reduce((best, x, j) => (arc(h, x) < arc(h, INK_HUES[best]) ? j : best), 0);
    return mix(PAPER, INKS[i], Math.max(0.3, Math.min(1, 1.25 - l))).slice(0, 3).concat(v[3]);
  }

  // low poly: keep at most n corners of an outline (an ellipse becomes a decagon)
  const corners = (p, n = 10) => (p.length <= n ? p : Array.from({ length: n }, (_, i) => p[Math.floor((i * p.length) / n)]));
  const LIGHT = [-0.6, -0.8]; // toward the light, top left
  const straight = (ctx, q) => { ctx.beginPath(); ctx.moveTo(...q[0]); for (const c of q.slice(1)) ctx.lineTo(...c); ctx.closePath(); }; // G.path rounds corners
  // toy plastic: a soft top light and one sharp highlight near the top left
  function gloss(ctx, p, bb, k = 1) {
    const w = bb[2] - bb[0], h = bb[3] - bb[1], g = ctx.createLinearGradient(0, bb[1], 0, bb[3]);
    g.addColorStop(0, `rgba(255,255,255,${0.3 * k})`); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(0,0,20,${0.2 * k})`);
    ctx.save(); ctx.beginPath(); G.path(ctx, p, true); ctx.clip(); plain(ctx, p, g);
    ctx.fillStyle = `rgba(255,255,255,${0.55 * k})`; ctx.beginPath(); ctx.ellipse(bb[0] + w * 0.28, bb[1] + h * 0.2, w * 0.1, h * 0.06, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // a wall or floor built from bricks: staggered seams, and studs along each course (seen from the front, slightly above)
  function bricks(ctx, p, v, bb) {
    const BH = 48, BW = 96, dark = css(mix(v, [0, 0, 20], 0.28), 1), lite = css(mix(v, [255, 255, 255], 0.35), 1);
    ctx.save(); ctx.beginPath(); G.path(ctx, p, true); ctx.clip();
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath();
    for (let y = Math.floor(bb[1] / BH) * BH, r = 0; y < bb[3]; y += BH, r++) {
      ctx.moveTo(bb[0], y); ctx.lineTo(bb[2], y);
      for (let x = Math.floor(bb[0] / BW) * BW + (r % 2 ? BW / 2 : 0); x < bb[2]; x += BW) { ctx.moveTo(x, y); ctx.lineTo(x, y + BH); }
    }
    ctx.stroke();
    for (let y = Math.floor(bb[1] / BH) * BH + BH * 0.5, r = 0; y < bb[3]; y += BH, r++) for (let x = Math.floor(bb[0] / (BW / 2)) * (BW / 2) + BW / 4; x < bb[2]; x += BW / 2) {
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(x, y + 3, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); // the stud's shadow
      ctx.fillStyle = lite; ctx.beginPath(); ctx.ellipse(x, y, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- each style: how a filled shape and an outline are drawn ----------
  const ART = {
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
    comic: {
      fill(ctx, p, v) {
        plain(ctx, p, css(v));
        if (lum(v) > 0.12) shadowSide(ctx, p, (bb) => tone(ctx, bb, 0.55, 10, css(mix(v, [0, 0, 0], 0.5), 1)), 0.14);
      },
      stroke(ctx, p, closed, lw, seed, col) { line(ctx, p, closed, lw * 2, ink(col)); },
      limbColor: (v) => v, outline: 1.5,
    },
    riso: {
      fill(ctx, p, v, seed) {
        plain(ctx, p, css(riso(v)));
        const bb = G.bbox(p), n = Math.min(260, ((bb[2] - bb[0]) * (bb[3] - bb[1])) / 700); // specks where the ink missed
        ctx.save(); ctx.clip(); ctx.fillStyle = css(PAPER, 0.55); ctx.beginPath();
        for (let i = 0; i < n; i++) { const x = bb[0] + H(seed, i, 7) * (bb[2] - bb[0]), y = bb[1] + H(seed, i, 8) * (bb[3] - bb[1]); ctx.moveTo(x + 1.6, y); ctx.arc(x, y, 0.8 + H(seed, i, 9) * 1.4, 0, Math.PI * 2); }
        ctx.fill(); ctx.restore();
      },
      stroke(ctx, p, closed, lw, seed, col) { // the outline plate prints a little off register and overprints the colour
        const v = rgba(ink(col)), c = !v ? col : lum(v) < 0.3 ? css(NAVY, 1) : css(riso(v), 1);
        ctx.save(); ctx.translate(3, 2); ctx.globalCompositeOperation = 'multiply'; line(ctx, p, closed, lw * 1.1, c); ctx.restore();
      },
      limbColor: (v) => riso(v), outline: 0.8, ink: 'rgb(29,59,143)',
    },
    papercut: {
      fill(ctx, p, v) { ctx.save(); if (fig(G.bbox(p))) drop(ctx, 5, 8, 3, 0.42); plain(ctx, p, css(v)); ctx.restore(); },
      stroke(ctx, p, closed, lw, seed, col) { if (!closed) line(ctx, p, false, lw * 1.2, ink(col)); }, // cut edges need no outline; mouths and brows do
      limbColor: (v) => v, outline: 0, shadow: [5, 8, 3, 0.42],
    },
    pixelart: {
      fill(ctx, p, v) { plain(ctx, p, css(v)); },
      stroke(ctx, p, closed, lw, seed, col) { line(ctx, p, closed, lw * 2.4, ink(col)); }, // thick: G.grade shrinks the frame 8x
      limbColor: (v) => v, outline: 2,
    },
    retro: {
      fill(ctx, p, v) {
        plain(ctx, p, css(v));
        if (lum(v) > 0.1) shadowSide(ctx, p, () => plain(ctx, p, css(mix(v, [90, 50, 80], 0.2), v[3])));
      },
      stroke(ctx, p, closed, lw, seed, col) { line(ctx, p, closed, lw * 0.9, col === G.C.ink ? '#3A2328' : col); },
      limbColor: (v) => v, outline: 0.8, ink: '#3A2328',
    },
    diorama: {
      fill(ctx, p, v) {
        const bb = G.bbox(p);
        ctx.save(); if (fig(bb)) drop(ctx, 0, 5, 9, 0.28); plain(ctx, p, css(v)); ctx.restore();
        const g = ctx.createLinearGradient(bb[0], bb[1], bb[0] + (bb[2] - bb[0]) * 0.3, bb[3]); // painted volume, lit from the top left
        g.addColorStop(0, 'rgba(255,250,235,0.28)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(30,15,40,0.22)');
        plain(ctx, p, g);
      },
      stroke(ctx, p, closed, lw, seed, col) { if (!closed) line(ctx, p, false, lw * 1.1, ink(col)); },
      limbColor: (v) => v, outline: 0, shadow: [0, 5, 9, 0.28],
    },
    clay: {
      fill(ctx, p, v, seed) {
        const bb = G.bbox(p), w = bb[2] - bb[0], h = bb[3] - bb[1], big = fig(bb);
        ctx.save(); if (big) drop(ctx, 0, 6, 12, 0.3); plain(ctx, p, css(v)); ctx.restore();
        if (!big) return;
        ctx.save(); ctx.beginPath(); G.path(ctx, p, true); ctx.clip();
        const g = ctx.createRadialGradient(bb[0] + w * 0.35, bb[1] + h * 0.3, 0, bb[0] + w * 0.45, bb[1] + h * 0.45, Math.max(w, h) * 0.75); // a soft lump lit from the top left
        g.addColorStop(0, 'rgba(255,248,235,0.38)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(40,20,30,0.32)');
        plain(ctx, p, g);
        ctx.fillStyle = 'rgba(40,20,20,0.07)'; // thumbprints: they move a little every frame, as if re-sculpted
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(bb[0] + H(seed, i, G.boil) * w, bb[1] + H(seed, i, 3, G.boil) * h, 4 + H(seed, i, 5) * Math.min(w, h) * 0.08, 3 + H(seed, i, 6) * Math.min(w, h) * 0.05, H(seed, i, 7) * 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        line(ctx, p, true, 3, css(mix(v, [30, 15, 20], 0.35), v[3])); // the edge, darker clay, not ink
      },
      stroke(ctx, p, closed, lw, seed, col) { if (!closed) line(ctx, p, false, lw * 1.3, ink(col)); },
      limbColor: (v) => v, outline: 0.7, ink: (v) => css(mix(v, [30, 15, 20], 0.35)), shadow: [0, 6, 12, 0.3],
    },
    lowpoly: {
      fill(ctx, p, v, seed) {
        plain(ctx, p, css(v)); // the true silhouette first; facets are cut inside it
        const bb = G.bbox(p);
        if (!fig(bb)) return;
        const q = corners(p, 12), cx = q.reduce((a, c) => a + c[0], 0) / q.length, cy = q.reduce((a, c) => a + c[1], 0) / q.length;
        ctx.save(); ctx.beginPath(); G.path(ctx, p, true); ctx.clip();
        for (let i = 0; i < q.length; i++) { // a fan of facets with straight edges; each is lighter the more it faces the light
          const a = q[i], b = q[(i + 1) % q.length], mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy, d = Math.hypot(mx, my) || 1;
          const k = ((mx * LIGHT[0] + my * LIGHT[1]) / d) * 0.2 + (H(seed, i, 11) - 0.5) * 0.08;
          const c = css(k > 0 ? mix(v, [255, 250, 240], k) : mix(v, [20, 10, 30], -k));
          const ex = (x, y) => [cx + (x - cx) * 1.6, cy + (y - cy) * 1.6]; // past the edge: the clip trims it to the silhouette
          ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...ex(...a)); ctx.lineTo(...ex(...b)); ctx.closePath(); ctx.fill(); ctx.stroke(); // the stroke hides hairline seams
        }
        ctx.restore();
      },
      stroke(ctx, p, closed, lw, seed, col) { if (!closed) line(ctx, corners(p, 6), false, lw * 1.2, ink(col)); },
      limbColor: (v) => v, outline: 0,
    },
    bricks: {
      fill(ctx, p, v) {
        const bb = G.bbox(p);
        plain(ctx, p, css(v));
        if (bb[2] - bb[0] >= 900 || bb[3] - bb[1] >= 900) return bricks(ctx, p, v, bb); // walls and floors are built
        if (fig(bb)) { gloss(ctx, p, bb); line(ctx, p, true, 2.5, css(mix(v, [0, 0, 20], 0.3), v[3])); } // pieces are moulded plastic
      },
      stroke(ctx, p, closed, lw, seed, col) { if (!closed) line(ctx, p, false, lw * 1.2, ink(col)); },
      limbColor: (v) => v, outline: 0.6, ink: (v) => css(mix(v, [0, 0, 20], 0.3)),
    },
    early3d: {
      fill(ctx, p, v) {
        const bb = G.bbox(p), q = fig(bb) ? corners(p, 14) : p; // figures are meshes: a visible polygon edge
        const g = ctx.createLinearGradient(0, bb[1], 0, bb[3]); // vertex shading: lit from above
        g.addColorStop(0, css(mix(v, [255, 255, 245], 0.28))); g.addColorStop(1, css(mix(v, [10, 10, 30], 0.4)));
        ctx.fillStyle = g; if (fig(bb)) straight(ctx, q); else { ctx.beginPath(); G.path(ctx, p, true); } ctx.fill();
        if (fig(bb)) { ctx.save(); straight(ctx, q); ctx.clip(); const w = bb[2] - bb[0], h = bb[3] - bb[1], hl = ctx.createRadialGradient(bb[0] + w * 0.3, bb[1] + h * 0.22, 0, bb[0] + w * 0.3, bb[1] + h * 0.22, Math.max(w, h) * 0.3); hl.addColorStop(0, 'rgba(255,255,255,0.45)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hl; ctx.fillRect(bb[0], bb[1], w, h); ctx.restore(); } // the hot specular
      },
      stroke(ctx, p, closed, lw, seed, col) { if (!closed) line(ctx, corners(p, 8), false, lw * 1.2, ink(col)); },
      limbColor: (v) => v, outline: 0,
    },
  };

  Object.assign(G.STYLES, {
    woodcut: { amp: 0.7, lw: 1, second: false, hatch: false, textBoil: 0.2, boilFps: 6, art: 'woodcut', post: { paper: 0.6, grain: 0.12, vignette: 0.3 } },
    crayon: { amp: 1.8, lw: 1, second: false, hatch: false, textBoil: 1, boilFps: 8, art: 'crayon', post: { paper: 0.25, grain: 0.08, vignette: 0.12 } },
    manga: { amp: 0.35, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 4, art: 'manga', post: { paper: 0, grain: 0.02, vignette: 0.1 } },
    comic: { amp: 0.3, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 8, art: 'comic', post: { paper: 0.2, grain: 0.03, vignette: 0.1 } },
    riso: { amp: 0.4, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 6, art: 'riso', post: { paper: 0.45, grain: 0.12, vignette: 0.08 } },
    papercut: { amp: 0.25, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 4, art: 'papercut', post: { paper: 0.6, grain: 0.04, vignette: 0.2 } },
    pixelart: { amp: 0, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 8, art: 'pixelart', px: 8, post: { paper: 0, grain: 0, vignette: 0 } },
    retro: { amp: 0.2, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 8, art: 'retro', post: { paper: 0, grain: 0.11, vignette: 0.3 } },
    diorama: { amp: 0, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 12, art: 'diorama', post: { paper: 0, grain: 0.03, vignette: 0.25 } },
    clay: { amp: 0.7, lw: 1, second: false, hatch: false, textBoil: 0.3, boilFps: 6, art: 'clay', post: { paper: 0, grain: 0.05, vignette: 0.3 } }, // 6 fps boil = shot on threes, like stop motion
    lowpoly: { amp: 0, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 12, art: 'lowpoly', post: { paper: 0, grain: 0.02, vignette: 0.2 } },
    bricks: { amp: 0, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 12, art: 'bricks', post: { paper: 0, grain: 0.02, vignette: 0.15 } },
    early3d: { amp: 0, lw: 1, second: false, hatch: false, textBoil: 0, boilFps: 12, art: 'early3d', post: { paper: 0, grain: 0.03, vignette: 0.3, bloom: 0.35 } },
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
    const out = { ...o, color: css(A.limbColor(v)), ink: typeof A.ink === 'function' ? A.ink(A.limbColor(v)) : A.ink || INK, outline: (o.outline ?? 4.5) * (A.outline ?? (G.style.art === 'woodcut' ? 1.6 : 1)) };
    if (!A.shadow) return limb0(ctx, pts, out);
    ctx.save(); drop(ctx, ...A.shadow); const r = limb0(ctx, pts, out); ctx.restore(); return r;
  };

  // colour grade for the whole shot. Call it in film.js after the shots and BEFORE the subtitles, so key-line
  // red boxes keep their colour:  draw(ctx, t) { film(ctx, t); G.grade(ctx); subtitles(ctx, t); … }
  // No-op for every other style. Backgrounds and lights drawn with plain ctx fills only change here.
  const GRADE = {
    woodcut: [['saturation', '#808080', 1], ['self-overlay'], ['multiply', '#E8DCC0', 1]],
    manga: [['saturation', '#808080', 1], ['self-overlay'], ['self-overlay']],
    riso: [['multiply', '#F4EEDC', 0.35]],
    retro: [['saturation', '#808080', 0.12], ['multiply', '#F6E3C4', 0.4], ['screen', '#2C1F3C', 0.1]], // faded, warm, lifted blacks
    diorama: [['saturation', '#FF0000', 0.1], [tiltShift]], // a little richer, then blur top and bottom like a macro lens
    pixelart: [[pixelate]],
    clay: [['saturation', '#FF0000', 0.08], ['multiply', '#FFF1DC', 0.25]], // a warm studio light
    bricks: [['saturation', '#FF0000', 0.15]], // toy colours
    early3d: [[lowres], ['saturation', '#FF0000', 0.1]], // the console's resolution: soft, a little banded
  };
  // early 3D: render at ~40% size and scale back up smooth, then snap to 32 levels a channel for colour banding
  function lowres(ctx, c) {
    const w = Math.round(c.width * 0.4), h = Math.round(c.height * 0.4), s = G.scratch('lowres', w, h), sx = s.getContext('2d', { willReadFrequently: true });
    sx.imageSmoothingEnabled = true; sx.clearRect(0, 0, w, h); sx.drawImage(c, 0, 0, w, h);
    const im = sx.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) for (let j = 0; j < 3; j++) d[i + j] = d[i + j] & 0xF8;
    sx.putImageData(im, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.drawImage(s, 0, 0, w, h, 0, 0, c.width, c.height);
  }
  // tilt-shift: a blurred copy of the frame, kept only above and below a sharp band through the middle
  function tiltShift(ctx, c) {
    const k = G.scale || 1, w = Math.ceil(c.width / 3), h = Math.ceil(c.height / 3);
    const b = G.scratch('tilt', w, h), bx = b.getContext('2d');
    bx.globalCompositeOperation = 'source-over'; bx.clearRect(0, 0, w, h); bx.filter = `blur(${Math.max(1.5, 3 * k)}px)`; bx.drawImage(c, 0, 0, w, h); bx.filter = 'none';
    const g = bx.createLinearGradient(0, 0, 0, h); // opaque = blurred
    for (const [at, a] of [[0, 1], [0.12, 0.6], [0.26, 0], [0.74, 0], [0.86, 0.6], [1, 1]]) g.addColorStop(at, `rgba(0,0,0,${a})`);
    bx.globalCompositeOperation = 'destination-in'; bx.fillStyle = g; bx.fillRect(0, 0, w, h); bx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(b, 0, 0, w, h, 0, 0, c.width, c.height);
  }
  // pixel art: shrink the frame, snap colours to 8 levels a channel with a 4x4 ordered dither, blow it back up with hard edges
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function pixelate(ctx, c) {
    const px = G.style.px * (G.scale || 1), w = Math.max(1, Math.round(c.width / px)), h = Math.max(1, Math.round(c.height / px));
    const s = G.scratch('pixelart', w, h), sx = s.getContext('2d', { willReadFrequently: true });
    sx.imageSmoothingEnabled = true; sx.clearRect(0, 0, w, h); sx.drawImage(c, 0, 0, w, h);
    const im = sx.getImageData(0, 0, w, h), d = im.data, step = 255 / 7;
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
      const t = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * step * 0.45; // a light dither: flat walls stay flat
      for (let j = 0; j < 3; j++) d[i + j] = Math.max(0, Math.min(255, Math.round((d[i + j] + t) / step) * step));
    }
    sx.putImageData(im, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false; ctx.drawImage(s, 0, 0, w, h, 0, 0, c.width, c.height); ctx.imageSmoothingEnabled = true;
  }
  G.grade = (ctx) => {
    const steps = GRADE[G.style.art];
    if (!steps) return;
    const c = ctx.canvas;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [op, color, a] of steps) {
      if (typeof op === 'function') op(ctx, c);
      else if (op === 'self-overlay') { // contrast: the frame overlaid on itself
        const t = G.scratch('grade', c.width, c.height), x = t.getContext('2d'); x.clearRect(0, 0, t.width, t.height); x.drawImage(c, 0, 0);
        ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 1; ctx.drawImage(t, 0, 0);
      } else { ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(0, 0, c.width, c.height); }
    }
    ctx.restore();
  };

  // the engine picked the film's style before these existed: pick again now that they do
  try { G.setStyle(U.pickStyle((globalThis.SCORE && globalThis.SCORE.STYLE) || 'paper')); } catch (e) { console.warn(e.message); }
})();
