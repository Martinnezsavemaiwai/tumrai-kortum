// RIG KIT — one skeleton, many body styles. Neck, shoulders, elbows, wrists, hips, knees; hands with fingers.
// Load after engine/video/gfx.js (and kit/art.js):  <script src="kit/rig.js"></script>
//
//   R.draw(ctx, { x, y, s: 1, body: 'anime', who: R.CAST.mali, t, ...R.act(t, [[0, 'idle'], [2, 'wave']]) });
//
// Bodies: anime (1:6.5, big glossy eyes, spiky bangs) · cartoon (rubber-hose limbs, white 4-finger gloves) ·
// puppet (หนังตะลุง: profile silhouette on a lit screen, perforated, rods to the hands) · chibi (big head, but a
// neck, elbows and fingers). Feet at (x, y); s = 1 is 1000 px tall. Every body takes the same pose fields, so
// poses, R.act and R.walk work for all of them, and every line goes through G.* so all drawing styles apply.
//
// Pose fields (radians unless noted): lSh/rSh shoulder (0 = arm hanging, + = out and up), lEl/rEl elbow
// (+ = forearm swings further out, − = folds in toward the face), lHip/rHip, lKnee/rKnee, lean, tilt (head),
// look/lookY −1…1, bob (px), sx/sy squash, eyes, mouth, talk 0…1 (mouth open), handL/handR
// ('open' 'fist' 'point' 'peace' 'thumb' 'relax'), fx ['sweat' 'blush' 'tears' 'anger' 'shock' 'sparkle'].
(function () {
  const G = globalThis.G, U = globalThis.U, H = U.hash;
  const INK = '#1C1620';

  const sh = (ctx, pts, fill, seed, o = {}) => G.shape(ctx, pts, { fill, seed, lw: o.lw ?? 4, alpha: o.alpha ?? 1, stroke: o.stroke, hatch: o.hatch ? { color: 'rgba(0,0,0,0.16)', gap: 8, angle: 0.8 } : null });
  const ell = (ctx, cx, cy, rx, ry, fill, seed, o) => sh(ctx, G.ellPts(cx, cy, rx, ry), fill, seed, o);
  const poly = (ctx, pts, fill, seed, o) => sh(ctx, G.polyPts(pts, 14), fill, seed, o);
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  const shade = (c, k) => G.tint(c, k);
  // explainer look: a soft shadow on the far side of a shape (flat vector with one light from the top left)
  const soft = (ctx, pts, color, k = 0.22) => { ctx.save(); ctx.beginPath(); G.path(ctx, pts, true); ctx.clip(); const [x0, y0, x1, y1] = G.bbox(pts), w = x1 - x0, h = y1 - y0; const g = ctx.createLinearGradient(x0 + w * 0.35, y0 + h * 0.2, x1, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(40,20,60,${k})`); ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h); ctx.restore(); };
  // a smooth closed outline through control points (for hair locks, profiles)
  const curvy = (pts) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; for (let k = 0; k < 4; k++) out.push([a[0] + (b[0] - a[0]) * k / 4, a[1] + (b[1] - a[1]) * k / 4]); } return out; };
  // a smooth closed outline (Catmull-Rom) through control points given in head units: x·rx, y·ry from the head centre
  const spline = (ctrl, hx, hy, rx, ry, n = 6) => {
    const P = ctrl.map(([u, v]) => [hx + u * rx, hy + v * ry]), out = [];
    for (let i = 0; i < P.length; i++) {
      const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i + 1) % P.length], p3 = P[(i + 2) % P.length];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
    }
    return out;
  };
  const mirror = (ctrl) => ctrl.map(([u, v]) => [-u, v]).reverse();
  // one light from the top left: how strong the far-side shadow is per body (puppets are lit from behind)
  const SHADE = { anime: 0.16, chibi: 0.14, cartoon: 0.1, explainer: 0.28 };

  // ---------- proportions (units: the figure is 1000 tall at s = 1) ----------
  const BODY = {
    anime: { head: [62, 78], neck: 34, torso: 300, sw: 82, ww: 58, hw: 64, ua: 185, fa: 165, hand: 62, thigh: 245, shin: 240, limb: 30, leg: 38, foot: 40 },
    cartoon: { head: [140, 140], neck: 18, torso: 230, sw: 95, ww: 80, hw: 75, ua: 170, fa: 160, hand: 78, thigh: 175, shin: 175, limb: 26, leg: 30, foot: 62 },
    chibi: { head: [190, 175], neck: 30, torso: 230, sw: 88, ww: 78, hw: 74, ua: 120, fa: 110, hand: 52, thigh: 120, shin: 120, limb: 36, leg: 42, foot: 44 },
    explainer: { head: [108, 104], neck: 24, torso: 250, sw: 86, ww: 72, hw: 70, ua: 150, fa: 140, hand: 54, thigh: 170, shin: 165, limb: 36, leg: 42, foot: 46 },
    puppet: { head: [70, 80], neck: 40, torso: 320, sw: 40, ww: 34, hw: 46, ua: 220, fa: 220, hand: 80, thigh: 230, shin: 220, limb: 22, leg: 26, foot: 60 },
  };

  // ---------- a sample cast (data only: add your own) ----------
  const CAST = {
    mali: { name: 'มะลิ', skin: '#F6D7C3', hair: '#3A2A3E', hairStyle: 'long', eye: '#7A4A9E', top: '#F2F2F2', collar: '#2E4A7A', bottom: '#2E4A7A', bottomStyle: 'skirt', shoes: '#3A3030', tie: '#C83C4A' },
    krit: { name: 'กฤษ', skin: '#E9C2A2', hair: '#1E1A22', hairStyle: 'spiky', eye: '#3A6EA5', top: '#3A6EA5', bottom: '#2B2E3A', bottomStyle: 'pants', shoes: '#F2F2F2' },
    nok: { name: 'นก', skin: '#F2D0B4', hair: '#E8A23C', hairStyle: 'twintail', eye: '#2F8A6A', top: '#F28AA8', bottom: '#F6F0E2', bottomStyle: 'skirt', shoes: '#C83C4A' },
    lung: { name: 'ลุงชม', skin: '#D9A882', hair: '#D8D4CC', hairStyle: 'bald', eye: '#4A3A2A', top: '#7A9A5A', bottom: '#4A3E34', bottomStyle: 'pants', shoes: '#3A3030', old: true },
    ton: { name: 'ต้น', skin: '#F2D3B8', hair: '#2A1E1A', hairStyle: 'short', eye: '#3A2A20', top: '#F4F1EA', jacket: '#F2B33C', bottom: '#3A4A6A', bottomStyle: 'pants', shoes: '#F2F2F2', glasses: '#2A2230' },
    // หนังตะลุง characters: colour = the dyed leather; crown = a tall chada
    prince: { name: 'พระเอก', skin: '#3A6A4A', top: '#C8963C', bottom: '#A8402E', crown: true, nose: 'straight' },
    teng: { name: 'อ้ายเท่ง', skin: '#2A1E1A', top: '#8A5A3A', bottom: '#5A3A2A', belly: true, nose: 'hook', hairStyle: 'tuft' },
  };

  // ---------- character spec: every field a `who` object may have (story.mjs validates bible looks with R.check) ----------
  const SPEC = {
    body: Object.keys(BODY),
    colors: ['skin', 'hair', 'eye', 'top', 'collar', 'bottom', 'shoes', 'tie', 'jacket', 'glasses', 'accent'],
    hairStyle: ['long', 'short', 'bob', 'ponytail', 'twintail', 'spiky', 'bald', 'tuft'],
    bottomStyle: ['skirt', 'pants'],
    nose: ['straight', 'hook'],
    flags: ['old', 'crown', 'belly'],
    text: ['name'],
  };
  function check(who) {
    const out = [];
    for (const [k, v] of Object.entries(who || {})) {
      if (SPEC.colors.includes(k)) { if (!/^#[0-9a-fA-F]{6}$/.test(String(v))) out.push(`${k}: "${v}" is not a #rrggbb colour`); }
      else if (Array.isArray(SPEC[k])) { if (!SPEC[k].includes(v)) out.push(`${k}: "${v}" is not one of ${SPEC[k].join(' ')}`); }
      else if (SPEC.flags.includes(k)) { if (typeof v !== 'boolean') out.push(`${k}: must be true/false`); }
      else if (!SPEC.text.includes(k)) out.push(`${k}: unknown field (have ${[...SPEC.colors, 'body', 'hairStyle', 'bottomStyle', 'nose', ...SPEC.flags, 'name'].join(' ')})`);
    }
    if (who && who.body !== 'puppet' && !who.skin) out.push('skin: missing');
    return out;
  }

  // ---------- hands: fingers point along the forearm; side −1 = screen-left hand ----------
  function hand(ctx, x, y, ang, side, kind, size, skin, body, seed) {
    const glove = body === 'cartoon', col = glove ? '#FFFFFF' : skin, puppet = body === 'puppet';
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang * side); ctx.scale(side, 1); // local: fingers grow toward +y, thumb toward −x
    const s = size, fl = { lw: 3 };
    const finger = (fx, fy, a, len, w, curl = 0) => {
      const p = [[fx, fy]], n = 3;
      for (let i = 1; i <= n; i++) { const aa = a + curl * i / n; const prev = p[p.length - 1]; p.push([prev[0] + Math.sin(aa) * len / n, prev[1] + Math.cos(aa) * len / n]); }
      G.limb(ctx, p, { color: col, lw: w, outline: 3, seed: seed + Math.round(fx) });
    };
    const nF = glove ? 3 : 4, fw = s * (glove ? 0.3 : 0.2), base = s * 0.38;
    const spread = (i) => (i - (nF - 1) / 2) * (glove ? 0.28 : 0.2);
    const fx = (i) => (i - (nF - 1) / 2) * s * (glove ? 0.26 : 0.19);
    const ext = { open: [1, 1, 1, 1], relax: [1, 1, 1, 1], point: [1, 0, 0, 0], peace: [1, 1, 0, 0], fist: [0, 0, 0, 0], thumb: [0, 0, 0, 0] }[kind] || [1, 1, 1, 1];
    if (glove) ext.splice(2, 1);
    // fingers behind the palm first (extended ones), palm, then folded knuckles + thumb on top
    for (let i = 0; i < nF; i++) {
      const k = nF - 1 - i; // index finger nearest the thumb
      if (!ext[k]) continue;
      const curl = kind === 'relax' ? 0.5 : puppet ? -0.9 : 0;
      finger(fx(i), base * 0.7, spread(i) * (kind === 'open' || puppet ? 1.6 : kind === 'peace' ? 1.4 : 0.6), s * (puppet ? 0.95 : 0.6), fw, curl);
    }
    ell(ctx, 0, s * 0.1, s * (glove ? 0.42 : 0.36), s * (glove ? 0.42 : 0.38), col, seed + 1, fl);
    if (ext.some((e) => !e)) for (let i = 0; i < nF; i++) { const k = nF - 1 - i; if (!ext[k]) ell(ctx, fx(i), s * 0.42, fw * 0.62, fw * 0.55, col, seed + 10 + i, fl); } // folded knuckles
    if (kind === 'thumb') finger(-s * 0.32, s * 0.1, Math.PI, s * 0.42, fw * 1.1);
    else finger(-s * 0.3, s * 0.05, kind === 'fist' || kind === 'point' || kind === 'peace' ? 0.9 : -0.9, s * 0.38, fw * 1.1);
    if (glove) { ctx.save(); ctx.translate(0, -s * 0.28); sh(ctx, G.rrPts(-s * 0.36, -s * 0.12, s * 0.72, s * 0.24, s * 0.1), '#FFFFFF', seed + 30, fl); ctx.restore(); } // cuff
    ctx.restore();
  }

  // ---------- eyes ----------
  function animeEye(ctx, cx, cy, side, o, c, seed) {
    const e = o.eyes || 'normal', lx = (o.look || 0) * 6, ly = (o.lookY || 0) * 5;
    const blink = o.blink ? Math.max(0.08, 1 - o.blink) : 1;
    if (e === 'happy' || e === 'closed' || blink < 0.2) {
      const up = e === 'happy' ? -1 : 1;
      G.line(ctx, [[cx - 19, cy + 2], [cx, cy + 2 + up * 11], [cx + 19, cy + 2]], { color: INK, lw: 5, seed });
      return;
    }
    const w = 22, h = 25 * blink, top = e === 'sly' ? 0.45 : e === 'angry' ? 0.75 : 1;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.clip();
    if (top < 1) { ctx.fillStyle = c.skin; ctx.fillRect(cx - w - 2, cy - h - 2, 2 * w + 4, 2 * h * (1 - top) * 0.9); }
    const ir = e === 'shock' ? 7 : 15, iy = cy + 3 + ly;
    const g = ctx.createLinearGradient(0, iy - ir * 1.3, 0, iy + ir * 1.3);
    g.addColorStop(0, shade(c.eye || '#5A3A2A', -0.45)); g.addColorStop(1, shade(c.eye || '#5A3A2A', 0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx + lx, iy, ir, ir * 1.3, 0, 0, Math.PI * 2); ctx.fill();
    dot(ctx, cx + lx, iy + 1, ir * 0.45, INK);
    if (e !== 'shock') { dot(ctx, cx + lx - ir * 0.4, iy - ir * 0.55, ir * 0.38, '#FFFFFF'); dot(ctx, cx + lx + ir * 0.4, iy + ir * 0.5, ir * 0.16, '#FFFFFF'); }
    ctx.restore();
    // upper lash line, thick, flicked at the outer corner; thin lower lash
    const lid = top < 1 ? cy - h + 2 * h * (1 - top) * 0.9 : cy - h;
    const tilt = e === 'angry' ? 7 : e === 'sad' ? -6 : 0; // + = inner corner down (the points below are already mirrored by side)
    const lash = top < 1 // a lid cut across the eye stays straight; an open eye's lash follows the eye's curve (a flat bar reads as glasses)
      ? [[cx - side * w - 2, lid + 4 + tilt], [cx, lid - 2], [cx + side * w + 4, lid + 3 - tilt], [cx + side * (w + 10), lid - 3 - tilt]]
      : [[cx - side * w * 0.95, cy - h * 0.3 + tilt], [cx - side * w * 0.55, cy - h * 0.86 + tilt * 0.5], [cx, lid - 1], [cx + side * w * 0.6, cy - h * 0.84], [cx + side * w * 1.02, cy - h * 0.32 - tilt], [cx + side * (w + 9), cy - h * 0.62 - tilt]];
    G.line(ctx, lash, { color: INK, lw: 5, seed: seed + 1, amp: 0.4 });
    G.line(ctx, [[cx - side * 8, cy + h - 1], [cx + side * w * 0.8, cy + h - 3]], { color: INK, lw: 2, seed: seed + 2, amp: 0.3 });
  }
  function dotEye(ctx, cx, cy, side, o, c, seed, r) { // chibi: big dark glossy ovals
    const e = o.eyes || 'normal', blink = o.blink ? Math.max(0.08, 1 - o.blink) : 1;
    if (e === 'happy' || e === 'closed' || blink < 0.2) { const up = e === 'happy' ? -1 : 1; G.line(ctx, [[cx - r, cy], [cx, cy + up * r * 0.6], [cx + r, cy]], { color: INK, lw: 6, seed }); return; }
    if (e === 'shock') { ell(ctx, cx, cy, r * 1.1, r * 1.25, '#FFFFFF', seed, { lw: 4 }); dot(ctx, cx, cy, r * 0.25, INK); return; }
    const lx = (o.look || 0) * r * 0.3;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(cx + lx, cy, r * 0.8, r * blink * (e === 'sly' ? 0.5 : 1), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.eye || '#6A4A8A'; ctx.beginPath(); ctx.ellipse(cx + lx, cy + r * 0.35 * blink, r * 0.55, r * 0.4 * blink, 0, 0, Math.PI * 2); ctx.fill();
    dot(ctx, cx + lx - r * 0.3, cy - r * 0.4 * blink, r * 0.3, '#FFFFFF'); dot(ctx, cx + lx + r * 0.3, cy + r * 0.2 * blink, r * 0.12, '#FFFFFF');
    if (e === 'angry' || e === 'sad') { const k = e === 'angry' ? 1 : -1; G.line(ctx, [[cx - side * r, cy - r * 1.3 + k * 8], [cx + side * r, cy - r * 1.3 - k * 8]], { color: INK, lw: 5, seed: seed + 3 }); } // angry: inner end down; sad: inner end up
  }
  function cartoonEye(ctx, cx, cy, side, o, seed) { // tall white ovals, pupils that touch
    const e = o.eyes || 'normal', blink = o.blink ? Math.max(0.08, 1 - o.blink) : 1;
    if (e === 'happy' || e === 'closed' || blink < 0.2) { G.line(ctx, [[cx - 24, cy], [cx, cy + (e === 'happy' ? -18 : 12)], [cx + 24, cy]], { color: INK, lw: 7, seed }); return; }
    const big = e === 'shock' ? 1.25 : 1;
    ell(ctx, cx, cy, 30 * big, 44 * big * blink, '#FFFFFF', seed, { lw: 5 });
    const lx = (o.look || 0) * 12 - side * 8, ly = (o.lookY || 0) * 12 + 8;
    if (blink > 0.4) ell(ctx, cx + lx, cy + ly, e === 'shock' ? 6 : 12, e === 'shock' ? 8 : 18, INK, seed + 1, { lw: 0 });
    if (e === 'angry') G.line(ctx, [[cx - side * 30, cy - 34], [cx + side * 32, cy - 54]], { color: INK, lw: 8, seed: seed + 2 }); // inner end down
    if (e === 'sly') G.line(ctx, [[cx - side * 30, cy - 22], [cx + side * 32, cy - 4]], { color: INK, lw: 8, seed: seed + 2 }); // heavy lid
    if (e === 'sad') G.line(ctx, [[cx - side * 30, cy - 60], [cx + side * 30, cy - 46]], { color: INK, lw: 6, seed: seed + 3 }); // inner end up
  }

  function mouth(ctx, x, y, w, o, seed, c) {
    const m = o.mouth || 'smile', talk = o.talk || 0, red = '#8A3A44';
    if (talk > 0.05 || m === 'open' || m === 'o' || m === 'scream') {
      const h = m === 'scream' ? w * 1.1 : m === 'o' ? w * 0.6 : Math.max(w * 0.25, talk * w * 0.7);
      const rw = m === 'o' ? w * 0.4 : w * 0.7;
      ell(ctx, x, y + h * 0.4, rw, h, '#5A2230', seed, { lw: 3 });
      ell(ctx, x, y + h * 0.9, rw * 0.6, h * 0.35, '#D25A68', seed + 1, { lw: 0 });
      return;
    }
    if (m === 'smile') G.line(ctx, [[x - w, y - w * 0.2], [x, y + w * 0.35], [x + w, y - w * 0.2]], { color: red, lw: 4, seed });
    else if (m === 'grin') { poly(ctx, [[x - w * 1.2, y - w * 0.2], [x + w * 1.2, y - w * 0.2], [x, y + w * 0.7]], '#FFFFFF', seed, { lw: 4 }); }
    else if (m === 'frown') G.line(ctx, [[x - w, y + w * 0.3], [x, y - w * 0.15], [x + w, y + w * 0.3]], { color: red, lw: 4, seed });
    else if (m === 'wavy') G.line(ctx, [-1, -0.5, 0, 0.5, 1].map((k, i) => [x + k * w, y + (i % 2 ? -1 : 1) * w * 0.18]), { color: red, lw: 4, seed });
    else if (m === 'smirk') G.line(ctx, [[x - w * 0.8, y], [x + w * 0.4, y], [x + w, y - w * 0.4]], { color: red, lw: 4, seed });
    else G.line(ctx, [[x - w * 0.6, y], [x + w * 0.6, y]], { color: red, lw: 4, seed });
  }

  // ---------- hair (front view) ----------
  // sway (radians-ish, from R.act): hair lags behind the head, bending more toward the tips (secondary motion)
  function hairBack(ctx, c, hx, hy, rx, ry, seed, sway = 0) {
    if (!c.hair || c.hairStyle === 'bald' || c.hairStyle === 'spiky' || c.hairStyle === 'tuft') return;
    const dark = shade(c.hair, -0.25);
    const bend = (ctrl) => (sway ? ctrl.map(([u, v]) => [u + sway * Math.pow(Math.max(0, v + 0.5), 1.3) * 0.3, v]) : ctrl);
    const S = (ctrl) => spline(bend(ctrl), hx, hy, rx, ry);
    // long: flows past the shoulders and ends in soft points, a darker underside behind
    if (c.hairStyle === 'long') {
      const half = [[1.1, -0.35], [1.32, 0.7], [1.42, 1.8], [1.22, 2.62], [0.92, 2.38], [0.58, 2.66], [0.2, 2.42]];
      sh(ctx, S([...mirror(half), ...half]), c.hair, seed, { lw: 4 });
      ctx.save(); ctx.globalAlpha = 0.5; sh(ctx, S([[-0.8, 0.6], [-0.95, 2.1], [0, 2.2], [0.95, 2.1], [0.8, 0.6]]), dark, seed + 5, { lw: 0 }); ctx.restore();
    }
    // bob: a rounded helmet that ends at the jaw, a little flick out at the tips
    if (c.hairStyle === 'bob') sh(ctx, S([[-1.16, -0.3], [-1.3, 0.55], [-1.22, 1.08], [-0.85, 1.0], [0, 0.9], [0.85, 1.0], [1.22, 1.08], [1.3, 0.55], [1.16, -0.3]]), c.hair, seed, { lw: 4 });
    // tails taper to a point and curl outward
    const tail = (d, ctrl) => sh(ctx, S(d > 0 ? ctrl : mirror(ctrl)), c.hair, seed + d, { lw: 4 });
    if (c.hairStyle === 'twintail') for (const d of [-1, 1]) tail(d, [[0.85, -0.65], [1.5, -0.55], [1.92, 0.2], [1.95, 1.3], [1.7, 2.2], [1.85, 2.75], [1.4, 2.25], [1.32, 1.2], [1.05, 0.1]]);
    if (c.hairStyle === 'ponytail') tail(1, [[0.55, -0.95], [1.3, -0.85], [1.62, 0.1], [1.6, 1.3], [1.32, 2.1], [1.42, 2.55], [1.06, 2.0], [1.12, 0.9], [0.9, -0.1]]);
    ell(ctx, hx, hy - ry * 0.1, rx * 1.12, ry * 1.08, c.hair, seed + 3);
  }
  function hairFront(ctx, c, hx, hy, rx, ry, seed, body) {
    if (!c.hair || c.hairStyle === 'bald') { if (c.old) for (const d of [-1, 1]) ell(ctx, hx + d * rx * 0.95, hy + ry * 0.05, rx * 0.2, ry * 0.32, c.hair || '#D8D4CC', seed + d); return; }
    // the crown cap plus a fringe of spiky locks down to the brows
    const cap = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.02 + 0.96 * i / 16); cap.push([hx + Math.cos(a) * rx * 1.1, hy - ry * 0.05 + Math.sin(a) * ry * 1.08]); }
    const n = c.hairStyle === 'spiky' ? 6 : 5, brow = hy - ry * (body === 'chibi' ? 0.25 : 0.3);
    for (let i = n; i >= 0; i--) {
      const u = i / n, x0 = hx + rx * 1.08 * (2 * u - 1);
      cap.push([x0, brow + (i % 2 ? 0 : ry * (body === 'anime' ? 0.12 : 0.22)) + (c.hairStyle === 'spiky' ? ry * 0.08 : 0)]);
      if (i > 0) cap.push([x0 - rx * 0.2, brow - ry * 0.12]);
    }
    sh(ctx, cap, c.hair, seed);
    // side locks framing the face: tapered curves, down to the jaw for long hair and bobs
    const lock = { long: 0.95, bob: 1.02, twintail: 0.7, ponytail: 0.6 }[c.hairStyle] ?? 0.55;
    if (c.hairStyle !== 'spiky') for (const d of [-1, 1]) {
      const ctrl = [[0.9, -0.45], [1.14, 0.1], [1.12, lock * 0.7], [1.0, lock], [0.94, lock * 0.55], [0.86, 0.05]];
      sh(ctx, spline(d > 0 ? ctrl : mirror(ctrl), hx, hy, rx, ry, 4), c.hair, seed + 4 + d, { lw: 3 });
    }
    if (c.hairStyle === 'ponytail') ell(ctx, hx + rx * 0.62, hy - ry * 0.9, 14, 12, c.accent || '#E8506A', seed + 33, { lw: 3 }); // the hair tie
    if (c.hairStyle === 'spiky') for (let k = 0; k < 5; k++) { const a = Math.PI * (1.1 + k * 0.2); poly(ctx, [[hx + Math.cos(a - 0.12) * rx, hy + Math.sin(a - 0.12) * ry], [hx + Math.cos(a) * rx * 1.45, hy + Math.sin(a) * ry * 1.4], [hx + Math.cos(a + 0.12) * rx, hy + Math.sin(a + 0.12) * ry]], c.hair, seed + 10 + k); }
    // shine band
    ctx.save(); ctx.globalAlpha = 0.35; G.line(ctx, [[hx - rx * 0.6, hy - ry * 0.72], [hx - rx * 0.1, hy - ry * 0.86], [hx + rx * 0.4, hy - ry * 0.78]], { color: shade(c.hair, 0.6), lw: 8, seed: seed + 20 }); ctx.restore();
    if (c.hairStyle === 'twintail') for (const d of [-1, 1]) ell(ctx, hx + d * rx * 1.02, hy - ry * 0.55, 12, 12, c.accent || '#E8506A', seed + 30 + d, { lw: 3 });
  }

  // ---------- marks ----------
  function marks(ctx, x, y, r, list, t, seed) {
    for (const f of list || []) {
      if (f === 'sweat') { const yy = y - r * 0.4 + ((t * 40) % 24); poly(ctx, [[x + r * 1.05, yy - 22], [x + r * 1.17, yy + 6], [x + r * 1.05, yy + 14], [x + r * 0.93, yy + 6]], '#BFE3F7', seed + 1, { lw: 3 }); }
      else if (f === 'blush') { ctx.fillStyle = 'rgba(240,90,120,0.4)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * r * 0.55, y + r * 0.35, r * 0.2, r * 0.09, 0, 0, Math.PI * 2); ctx.fill(); } }
      else if (f === 'tears') for (const d of [-1, 1]) { const u = (t * 1.4 + (d > 0 ? 0.5 : 0)) % 1; ell(ctx, x + d * r * 0.4, y + r * 0.3 + u * r * 0.6, 6, 9, '#9FD3F2', seed + 2 + d, { lw: 2, alpha: 1 - u }); }
      else if (f === 'anger') { const ax = x + r * 0.8, ay = y - r * 0.85; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; G.line(ctx, [[ax + Math.cos(a) * 7, ay + Math.sin(a) * 7], [ax + Math.cos(a) * 22, ay + Math.sin(a) * 22 - 5]], { color: '#D2283A', lw: 6, seed: seed + 20 + k }); } }
      else if (f === 'shock') for (let k = 0; k < 7; k++) { const a = -Math.PI * (0.15 + 0.7 * k / 6), r0 = r * 1.35, r1 = r * (1.7 + (k % 2) * 0.2); G.line(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], { color: INK, lw: 6, seed: seed + 10 + k }); }
      else if (f === 'sparkle') for (let k = 0; k < 3; k++) { const a = -0.6 - k * 0.9, sx = x + Math.cos(a) * r * 1.4, sy = y + Math.sin(a) * r * 1.3, z = 10 + 6 * Math.sin(t * 6 + k); poly(ctx, [[sx, sy - z * 2], [sx + z * 0.5, sy - z * 0.5], [sx + z * 2, sy], [sx + z * 0.5, sy + z * 0.5], [sx, sy + z * 2], [sx - z * 0.5, sy + z * 0.5], [sx - z * 2, sy], [sx - z * 0.5, sy - z * 0.5]], '#FFE07A', seed + 40 + k, { lw: 3 }); }
    }
  }

  // ---------- the front-view figure (anime, cartoon, chibi) ----------
  const DEF = { lSh: 0.12, rSh: 0.12, lEl: 0.1, rEl: 0.1, lHip: 0.04, rHip: 0.04, lKnee: 0, rKnee: 0, lean: 0, tilt: 0, look: 0, lookY: 0, bob: 0, sx: 1, sy: 1, talk: 0 };
  function front(ctx, o, c, B, body, seed) {
    const p = { ...DEF, ...o };
    const legLen = B.thigh + B.shin, hipY = -legLen - B.foot * 0.3, sy = hipY - B.torso, neckTop = sy - B.neck;
    const [hrx, hry] = B.head, hy = neckTop - hry * 0.92;
    const bob = p.bob;
    const limbCol = (k) => k;

    // legs
    for (const d of [-1, 1]) {
      const hip = d < 0 ? p.lHip : p.rHip, knee = d < 0 ? p.lKnee : p.rKnee;
      const x0 = d * B.hw * 0.55, y0 = hipY + bob;
      const kx = x0 + d * Math.sin(hip) * B.thigh, ky = y0 + Math.cos(hip) * B.thigh;
      const ax = kx + d * Math.sin(hip - knee) * B.shin, ay = ky + Math.cos(hip - knee) * B.shin;
      const pants = c.bottomStyle === 'pants' ? c.bottom : c.skin;
      G.limb(ctx, [[x0, y0], [kx, ky], [ax, ay]], { color: pants, lw: B.leg, seed: seed + 50 + d });
      if (c.bottomStyle === 'pants') G.limb(ctx, [[x0, y0], [kx, ky], [ax, ay - B.leg * 0.3]], { color: pants, lw: B.leg * 1.25, outline: 4, seed: seed + 52 + d });
      if (body === 'cartoon') ell(ctx, ax + d * B.foot * 0.45, ay + B.foot * 0.15, B.foot, B.foot * 0.55, c.shoes || '#C83C4A', seed + 54 + d, { lw: 5 });
      else poly(ctx, [[ax - B.leg * 0.6, ay - B.foot * 0.3], [ax + B.leg * 0.6, ay - B.foot * 0.3], [ax + d * B.foot * 0.9, ay + B.foot * 0.35], [ax - d * B.leg * 0.6, ay + B.foot * 0.35]], c.shoes || '#3A3030', seed + 56 + d);
    }

    // upper body leans and bobs around the hips
    ctx.save(); ctx.translate(0, hipY + bob); ctx.rotate(p.lean); ctx.translate(0, -hipY);
    // back hair turns with the head (it used to stay upright while the face tilted), then lags by p.sway
    ctx.save(); ctx.translate(0, neckTop); ctx.rotate(p.tilt); ctx.translate(0, -neckTop);
    hairBack(ctx, c, 0, hy, hrx, hry, seed + 1, p.sway || 0);
    ctx.restore();
    // torso: shoulders → waist → hips, skirt over the hips
    const waistY = sy + B.torso * 0.62;
    poly(ctx, [[-B.sw, sy + 8], [-B.sw * 0.6, sy - 6], [B.sw * 0.6, sy - 6], [B.sw, sy + 8], [B.ww, waistY], [B.hw, hipY + 10], [-B.hw, hipY + 10], [-B.ww, waistY]], c.top || '#6A8AB0', seed + 2, { hatch: true });
    soft(ctx, [[-B.sw, sy + 8], [B.sw, sy + 8], [B.hw, hipY + 10], [-B.hw, hipY + 10]], c.top, SHADE[body]);
    if (body === 'explainer') { if (c.jacket) for (const d of [-1, 1]) poly(ctx, [[d * B.sw * 0.25, sy - 4], [d * B.sw, sy + 8], [d * B.hw, hipY + 10], [d * B.hw * 0.3, hipY + 10]], c.jacket, seed + 5 + d); }
    if (c.bottomStyle === 'skirt') poly(ctx, [[-B.ww * 1.02, waistY], [B.ww * 1.02, waistY], [B.hw * 1.6, hipY + B.thigh * 0.55], [-B.hw * 1.6, hipY + B.thigh * 0.55]], c.bottom, seed + 3, { hatch: true });
    else if (c.bottom) poly(ctx, [[-B.ww, waistY], [B.ww, waistY], [B.hw, hipY + 16], [-B.hw, hipY + 16]], c.bottom, seed + 3);
    if (c.collar) for (const d of [-1, 1]) poly(ctx, [[0, sy + 30], [d * B.sw * 0.55, sy - 4], [d * B.sw * 0.75, sy + 34], [d * 8, sy + 50]], c.collar, seed + 4 + d);
    if (c.tie) poly(ctx, [[-10, sy + 40], [10, sy + 40], [16, sy + 90], [0, sy + 104], [-16, sy + 90]], c.tie, seed + 7);
    // neck
    sh(ctx, G.rrPts(-B.limb * 0.55, neckTop - 8, B.limb * 1.1, B.neck + 22, 8), shade(c.skin, -0.12), seed + 8, { lw: 3 }); // in the head's shadow

    // head (tilts round the neck)
    ctx.save(); ctx.translate(0, neckTop); ctx.rotate(p.tilt); ctx.translate(0, -neckTop);
    if (body === 'cartoon') for (const d of [-1, 1]) ell(ctx, d * hrx * 0.98, hy + 6, hrx * 0.2, hry * 0.24, c.skin, seed + 9 + d);
    const face = body === 'anime'
      ? [...Array(25)].map((_, i) => { const a = Math.PI * 2 * i / 24; const yy = Math.sin(a); return [Math.cos(a) * hrx * (yy > 0 ? 1 - 0.32 * yy * yy : 1), hy + yy * hry * (yy > 0 ? 1.12 : 1)]; }) // pointed chin
      : G.ellPts(0, hy, hrx, hry);
    sh(ctx, face, c.skin, seed + 11);
    soft(ctx, face, c.skin, body === 'explainer' ? 0.22 : SHADE[body]);
    if (c.hair && c.hairStyle !== 'bald') { // the fringe casts a soft shadow on the forehead
      ctx.save(); ctx.beginPath(); G.path(ctx, face, true); ctx.clip();
      ctx.fillStyle = 'rgba(110,50,70,0.1)'; ctx.beginPath(); ctx.ellipse(0, hy - hry * 0.34, hrx * 1.1, hry * 0.36, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (body === 'anime') for (const d of [-1, 1]) ell(ctx, d * hrx * 0.98, hy + 6, 8, 14, c.skin, seed + 12 + d, { lw: 3 });
    // eyes, brows, nose, mouth
    const ey = hy + hry * (body === 'chibi' ? 0.12 : body === 'cartoon' ? -0.12 : 0.2), ex = hrx * (body === 'chibi' ? 0.42 : body === 'cartoon' ? 0.24 : body === 'explainer' ? 0.38 : 0.44);
    for (const d of [-1, 1]) {
      if (body === 'anime') animeEye(ctx, d * ex, ey, d, p, c, seed + 20 + d);
      else if (body === 'cartoon') cartoonEye(ctx, d * ex, ey, d, p, seed + 20 + d);
      else dotEye(ctx, d * ex, ey, d, p, c, seed + 20 + d, hrx * (body === 'explainer' ? 0.12 : 0.17));
      if (c.glasses && body !== 'puppet') { const gr = hrx * 0.24; ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(d * ex, ey, gr, 0, Math.PI * 2); ctx.fill(); ctx.restore(); G.line(ctx, G.ellPts(d * ex, ey, gr, gr).concat([G.ellPts(d * ex, ey, gr, gr)[0]]), { color: c.glasses, lw: 6, seed: seed + 90 + d, amp: 0.3 }); if (d > 0) G.line(ctx, [[-ex + gr, ey - 4], [0, ey - 10], [ex - gr, ey - 4]], { color: c.glasses, lw: 6, seed: seed + 93, amp: 0.3 }); }
    }
    if (body === 'cartoon') { ell(ctx, 0, ey + hry * 0.38, hrx * 0.16, hry * 0.12, shade(c.skin, -0.18), seed + 30); mouth(ctx, 0, ey + hry * 0.62, hrx * 0.42, p, seed + 31, c); }
    else if (body === 'anime') { G.line(ctx, [[2, ey + hry * 0.28], [-2, ey + hry * 0.34]], { color: shade(c.skin, -0.35), lw: 3, seed: seed + 32 }); mouth(ctx, 0, ey + hry * 0.5, hrx * 0.16, p, seed + 33, c); ctx.fillStyle = 'rgba(240,120,140,0.25)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * ex * 1.05, ey + hry * 0.32, 16, 6, 0, 0, Math.PI * 2); ctx.fill(); } }
    else { mouth(ctx, 0, ey + hry * 0.42, hrx * 0.12, p, seed + 34, c); ctx.fillStyle = 'rgba(240,120,140,0.35)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * ex * 1.35, ey + hry * 0.28, 24, 12, 0, 0, Math.PI * 2); ctx.fill(); } }
    if (c.old) for (const d of [-1, 1]) G.line(ctx, [[d * ex * 1.2, ey + 10], [d * ex * 1.5, ey + 2]], { color: shade(c.skin, -0.3), lw: 3, seed: seed + 36 + d });
    hairFront(ctx, c, 0, hy, hrx, hry, seed + 40, body);
    // anime brows sit on top of the fringe (the style draws them through the hair); + tilt = inner end down
    if (body === 'anime' && p.eyes !== 'happy') for (const d of [-1, 1]) {
      const tilt = p.eyes === 'angry' ? 9 : p.eyes === 'sad' || p.eyes === 'shock' ? -8 : 0;
      G.line(ctx, [[d * ex * 0.55, ey - 50 + tilt], [d * ex * 0.92, ey - 56 + tilt * 0.3], [d * ex * 1.22, ey - 51 - tilt * 0.4]], { color: shade(c.hair || INK, -0.35), lw: 3, seed: seed + 26 + d }); // high and short: close to the lash line it reads as glasses
    }
    marks(ctx, 0, hy, hrx, p.fx, p.t || 0, seed + 60);
    ctx.restore();

    // arms, in front of everything (hands can reach the face)
    for (const d of [-1, 1]) {
      const a = d < 0 ? p.lSh : p.rSh, el = d < 0 ? p.lEl : p.rEl, kind = (d < 0 ? p.handL : p.handR) || 'relax';
      const x0 = d * B.sw * 0.92, y0 = sy + 16;
      const exl = x0 + d * Math.sin(a) * B.ua, eyl = y0 + Math.cos(a) * B.ua;
      const a2 = a + el, wx = exl + d * Math.sin(a2) * B.fa, wy = eyl + Math.cos(a2) * B.fa;
      const pts = body === 'cartoon' ? [[x0, y0], [exl, eyl], [wx, wy]] : [[x0, y0], [(x0 + exl) / 2, (y0 + eyl) / 2], [exl, eyl], [(exl + wx) / 2, (eyl + wy) / 2], [wx, wy]];
      if (body === 'cartoon') G.limb(ctx, pts, { color: INK, lw: B.limb * 0.55, outline: 0, seed: seed + 70 + d });
      else {
        G.limb(ctx, pts.slice(2), { color: c.skin, lw: B.limb * 0.85, seed: seed + 72 + d }); // forearm
        G.limb(ctx, pts.slice(0, 3), { color: c.top || c.skin, lw: B.limb * 1.1, seed: seed + 74 + d }); // sleeve
      }
      hand(ctx, wx, wy, a2, d, kind, B.hand, c.skin, body, seed + 80 + d * 7);
    }
    ctx.restore();
  }

  // ---------- หนังตะลุง: a perforated leather silhouette in profile, rods to the hands ----------
  function puppet(ctx, o, c, B, seed) {
    const p = { ...DEF, ...o }, dir = o.facing || 1;
    const leather = (k) => shade(k, -0.55);
    const screen = '#F6D99A';
    const holes = (pts, n, r, s0) => { ctx.save(); ctx.beginPath(); G.path(ctx, pts, true); ctx.clip(); const [x0, y0, x1, y1] = G.bbox(pts); for (let i = 0; i < n; i++) dot(ctx, x0 + H(s0, i) * (x1 - x0), y0 + H(s0, i, 1) * (y1 - y0), r * (0.6 + H(s0, i, 2) * 0.8), screen); ctx.restore(); };
    const legLen = B.thigh + B.shin, hipY = -legLen - B.foot * 0.3 + p.bob, sy = hipY - B.torso, neckTop = sy - B.neck;
    ctx.save(); ctx.scale(dir, 1);
    // far arm (behind), with its rod
    const arm = (a, el, kind, back) => {
      const x0 = B.sw * 0.4, y0 = sy + 20, ex = x0 + Math.sin(a) * B.ua, ey = y0 + Math.cos(a) * B.ua, a2 = a + el, wx = ex + Math.sin(a2) * B.fa, wy = ey + Math.cos(a2) * B.fa;
      ctx.save(); if (back) ctx.globalAlpha *= 0.8;
      G.line(ctx, [[wx, wy], [wx + 40, 400]], { color: '#3A2A1A', lw: 5, seed: seed + (back ? 1 : 2), amp: 0.3 }); // the rod
      G.limb(ctx, [[x0, y0], [ex, ey]], { color: leather(c.top), lw: B.limb, seed: seed + 3 });
      G.limb(ctx, [[ex, ey], [wx, wy]], { color: leather(c.skin), lw: B.limb * 0.8, seed: seed + 4 });
      dot(ctx, ex, ey, 5, screen); // the pin at the elbow
      hand(ctx, wx, wy, a2, 1, kind || 'open', B.hand, leather(c.skin), 'puppet', seed + 5);
      ctx.restore();
    };
    arm(p.lSh, p.lEl, p.handL, true);
    // legs in a stride: front leg forward, back leg behind
    for (const [k, hip] of [[0, -0.25 + p.lHip], [1, 0.3 - p.rHip]]) {
      const x0 = 0, kx = x0 + Math.sin(hip) * B.thigh, ky = hipY + Math.cos(hip) * B.thigh, ax = kx + Math.sin(hip * 0.4) * B.shin, ay = ky + Math.cos(hip * 0.4) * B.shin;
      G.limb(ctx, [[x0, hipY], [kx, ky], [ax, ay]], { color: leather(c.skin), lw: B.leg, seed: seed + 10 + k });
      poly(ctx, [[ax - 10, ay - 16], [ax + B.foot, ay + 6], [ax + B.foot * 1.25, ay - 8], [ax + B.foot, ay + 16], [ax - 12, ay + 16]], leather(c.skin), seed + 12 + k);
    }
    // body: chest, a belly for the clowns, a hip cloth with hanging flaps
    const torso = c.belly
      ? [[-B.sw, sy], [B.sw * 1.2, sy + 10], [B.sw * 2.6, sy + B.torso * 0.55], [B.sw * 1.6, hipY], [-B.hw, hipY], [-B.sw * 1.2, sy + B.torso * 0.5]]
      : [[-B.sw, sy], [B.sw * 1.1, sy + 6], [B.ww, sy + B.torso * 0.6], [B.hw, hipY], [-B.hw, hipY], [-B.ww, sy + B.torso * 0.6]];
    poly(ctx, torso, leather(c.top), seed + 20);
    holes(G.polyPts(torso, 14), 26, 4, seed + 21);
    const cloth = [[-B.hw * 1.2, hipY - 30], [B.hw * 1.2, hipY - 30], [B.hw * 1.6, hipY + 140], [B.hw * 0.4, hipY + 110], [0, hipY + 170], [-B.hw * 0.6, hipY + 110], [-B.hw * 1.5, hipY + 150]];
    poly(ctx, cloth, leather(c.bottom), seed + 22); holes(G.polyPts(cloth, 14), 18, 4, seed + 23);
    // head in profile: back of skull, brow, nose, lips, chin
    ctx.save(); ctx.translate(0, neckTop); ctx.rotate(p.tilt); ctx.translate(0, -neckTop);
    G.limb(ctx, [[0, sy + 10], [6, neckTop]], { color: leather(c.skin), lw: B.limb * 1.1, seed: seed + 30 });
    const hx = 6, hy = neckTop - B.head[1] * 0.85, r = B.head[0];
    const nose = c.nose === 'hook' ? [[r * 1.05, hy - 6], [r * 1.65, hy + 22], [r * 1.05, hy + 26]] : [[r * 0.95, hy - 10], [r * 1.3, hy + 20], [r * 0.95, hy + 24]];
    const talk = (p.talk || 0) * 14;
    const head = [[hx - r, hy], [hx - r * 0.8, hy - r * 0.8], [hx, hy - r], [hx + r * 0.75, hy - r * 0.7], ...nose.map(([x, y]) => [hx + x, y]), [hx + r * 0.95, hy + 40], [hx + r * 0.85, hy + 48 + talk], [hx + r * 0.7, hy + 70 + talk], [hx, hy + r * 0.95], [hx - r * 0.7, hy + r * 0.7]];
    poly(ctx, head, leather(c.skin), seed + 31);
    // almond eye cut out of the leather + a brow cut
    ctx.save(); ctx.fillStyle = screen; ctx.beginPath(); ctx.ellipse(hx + r * 0.45, hy - 4, 14, p.eyes === 'closed' || p.eyes === 'happy' ? 2 : 6, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    G.line(ctx, [[hx + r * 0.2, hy - 22], [hx + r * 0.7, hy - 26]], { color: screen, lw: 3, seed: seed + 32 });
    if (c.crown) { // a tall chada, tiered, perforated
      const cr = [[hx - r * 0.85, hy - r * 0.55], [hx + r * 0.75, hy - r * 0.6], [hx + r * 0.4, hy - r * 1.3], [hx + r * 0.25, hy - r * 2.2], [hx, hy - r * 3.6], [hx - r * 0.25, hy - r * 2.2], [hx - r * 0.45, hy - r * 1.3]];
      poly(ctx, cr, leather(c.top), seed + 33); holes(G.polyPts(cr, 10), 16, 3.5, seed + 34);
      for (let k = 1; k < 4; k++) G.line(ctx, [[hx - r * (0.7 - k * 0.12), hy - r * (0.6 + k * 0.6)], [hx + r * (0.6 - k * 0.12), hy - r * (0.6 + k * 0.6)]], { color: screen, lw: 3, seed: seed + 35 + k });
    } else if (c.hairStyle === 'tuft') poly(ctx, [[hx - r * 0.5, hy - r * 0.85], [hx - r * 0.2, hy - r * 1.5], [hx + r * 0.1, hy - r * 0.9]], leather(c.skin), seed + 36);
    ctx.restore();
    arm(p.rSh, p.rEl, p.handR, false);
    ctx.restore();
  }

  // the lit cloth screen behind หนังตะลุง: warm centre, dark edges
  function screen(ctx, W, H) {
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.7);
    g.addColorStop(0, '#FBE7B5'); g.addColorStop(0.6, '#E9B866'); g.addColorStop(1, '#5A3A1A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function draw(ctx, o) {
    const c = typeof o.who === 'string' ? CAST[o.who] : o.who || CAST.mali;
    if (!c) throw new Error(`unknown character ${o.who}; have ${Object.keys(CAST).join(', ')}`);
    const body = o.body || c.body || 'anime', B = BODY[body];
    if (!B) throw new Error(`unknown body ${body}; have ${Object.keys(BODY).join(', ')}`);
    const seed = (o.seed || 1) * 1000;
    ctx.save(); ctx.translate(o.x, o.y);
    if (o.shadow !== false && body !== 'puppet') { ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, 150 * (o.s || 1), 22 * (o.s || 1), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.scale((o.s || 1) * (o.sx || 1), (o.s || 1) * (o.sy || 1));
    if (body === 'puppet') puppet(ctx, o, c, B, seed); else front(ctx, o, c, B, body, seed);
    ctx.restore();
  }

  // ---------- poses: the same joints for every body ----------
  const POSES = {
    idle: { handL: 'relax', handR: 'relax', eyes: 'normal', mouth: 'smile' },
    happy: { lSh: 0.35, rSh: 0.35, lEl: -0.3, rEl: -0.3, eyes: 'happy', mouth: 'open', fx: ['blush'] },
    wave: { rSh: 2.3, rEl: 0.5, handR: 'open', eyes: 'happy', mouth: 'open', wiggle: { rEl: 0.35 } },
    cheer: { lSh: 2.6, rSh: 2.6, lEl: 0.25, rEl: 0.25, handL: 'fist', handR: 'fist', eyes: 'happy', mouth: 'open', fx: ['sparkle'], bob: -12 },
    point: { rSh: 1.45, rEl: 0.05, handR: 'point', look: 1, eyes: 'wide', mouth: 'o' },
    peace: { rSh: 0.9, rEl: -3.3, handR: 'peace', eyes: 'happy', mouth: 'smile', tilt: 0.1 },
    thumbsup: { rSh: 0.8, rEl: -2.6, handR: 'thumb', eyes: 'happy', mouth: 'smile' },
    shrug: { lSh: 0.55, rSh: 0.55, lEl: 1.2, rEl: 1.2, handL: 'open', handR: 'open', eyes: 'closed', mouth: 'flat', tilt: 0.12 },
    think: { rSh: 1.2, rEl: -3.55, handR: 'fist', lSh: 0.25, lEl: -1.3, handL: 'relax', look: -0.7, lookY: -0.8, eyes: 'normal', mouth: 'flat', tilt: -0.1 },
    scared: { lSh: 1.0, rSh: 1.0, lEl: -3.25, rEl: -3.25, handL: 'open', handR: 'open', eyes: 'shock', mouth: 'wavy', fx: ['sweat'], sy: 0.96, wiggle: { lean: 0.02 } },
    startle: { lSh: 2.4, rSh: 2.4, lEl: 0.4, rEl: 0.4, handL: 'open', handR: 'open', eyes: 'shock', mouth: 'scream', fx: ['shock'], bob: -30 },
    sad: { lSh: 0.05, rSh: 0.05, lEl: 0, rEl: 0, lookY: 0.8, eyes: 'sad', mouth: 'frown', fx: ['tears'], tilt: 0.12, lean: 0.04 },
    angry: { lSh: 0.4, rSh: 0.4, lEl: 0.5, rEl: 0.5, handL: 'fist', handR: 'fist', eyes: 'angry', mouth: 'frown', fx: ['anger'], lean: -0.03, wiggle: { lean: 0.015 } },
    sneaky: { lSh: 0.9, rSh: 0.9, lEl: -2.5, rEl: -2.5, handL: 'relax', handR: 'relax', look: -1, eyes: 'sly', mouth: 'smirk', sy: 0.94, tilt: -0.08 },
    talk: { rSh: 0.6, rEl: -1.2, handR: 'open', eyes: 'normal', mouth: 'flat', talking: true },
  };
  const NUM = Object.keys(DEF);

  const sstep = (x) => { x = U.clamp(x); return x * x * (3 - 2 * x); };

  // ---------- idle life: blinks, breathing, small gaze shifts — a pure function of (t, seed) ----------
  // A blink every ~2–4 s (one per 3.2 s slot, hashed start), 0.16 s shut-and-open, sometimes a double blink.
  function blinkAt(t, seed) {
    const slot = 3.2, k = Math.floor(t / slot), pulse = (d) => (d >= 0 && d < 0.16 ? Math.sin(Math.PI * d / 0.16) : 0);
    let v = 0;
    for (const j of [k - 1, k]) {
      const d = t - (j * slot + U.hash(seed, j) * 2.2);
      v = Math.max(v, pulse(d), U.hash(seed, j, 7) > 0.8 ? pulse(d - 0.28) : 0);
    }
    return v;
  }
  function idle(t, seed = 0) {
    const br = Math.sin((t + seed * 0.7) * Math.PI * 2 / 3.6); // one breath per 3.6 s
    // the eyes jump to a new resting point every 1.9 s (a saccade: 0.1 s), they don't drift
    const gs = 1.9, gt = t + seed * 0.53, gk = Math.floor(gt / gs), to = (k) => (U.hash(seed, k, 2) - 0.5) * 0.5;
    const look = U.lerp(to(gk - 1), to(gk), U.ease.outQuad(U.clamp((gt - gk * gs) / 0.1)));
    return { blink: blinkAt(t, seed), bob: br * 3, sy: 1 + br * 0.005, lean: U.noise1(t * 0.25, seed + 3) * 0.01, tilt: U.noise1(t * 0.3, seed + 5) * 0.025, look };
  }

  // ---------- gestures: short additive moves on top of any pose — [duration s, (u 0..1) → deltas] ----------
  const GESTURES = {
    jump: [0.8, (u) => (u < 0.18 ? { bob: 30 * Math.sin(u / 0.18 * Math.PI), sy: -0.08 * Math.sin(u / 0.18 * Math.PI) } // crouch
      : u < 0.7 ? { bob: -150 * Math.sin((u - 0.18) / 0.52 * Math.PI), sy: 0.05 * Math.sin((u - 0.18) / 0.52 * Math.PI) } // air, stretched
        : { bob: 26 * Math.sin((u - 0.7) / 0.3 * Math.PI), sy: -0.09 * Math.sin((u - 0.7) / 0.3 * Math.PI) })], // land, squashed
    nod: [0.6, (u) => { const s = Math.sin(u * Math.PI * 2) * (1 - u); return { lookY: s * 0.8, bob: Math.max(0, s) * 8 }; }],
    shake: [0.8, (u) => { const s = Math.sin(u * Math.PI * 6) * (1 - u); return { look: s * 0.8, tilt: s * 0.04 }; }],
    shiver: [1.2, (u) => { const env = Math.sin(u * Math.PI); return { lean: Math.sin(u * 70) * 0.012 * env, bob: Math.sin(u * 95) * 2.5 * env }; }],
  };

  // follow-through: the ends of a chain arrive after its root (seconds behind the shoulders/body)
  const LAG = { lEl: 0.06, rEl: 0.06, tilt: 0.09, look: 0.05, lookY: 0.05 };

  // act(t, [[t0, 'idle'], [t1, 'wave'], …], { seed, gestures: [[t, 'jump'|'nod'|'shake'|'shiver']], alive })
  // Keys are pose names or objects ({ ...R.POSES.point, look: -1 }). Each change: anticipation (a dip 0.12 s
  // before), an outBack move over `move` s with forearms and head trailing (LAG), a hold. Eyes/mouth swap behind
  // a blink. alive (default): breathing, blinks and gaze shifts from `seed` — give each character its own seed.
  // Returns pose fields plus `blink` and `sway` (hair lag) for R.draw. Pose `talking` flaps the mouth.
  function act(t, keys, { move = 0.35, seed = 0, alive = true, gestures = [] } = {}) {
    const P = (k) => (typeof k === 'string' ? POSES[k] : k) || POSES.idle;
    const at = (tt) => {
      let i = 0;
      while (i + 1 < keys.length && tt >= keys[i + 1][0]) i++;
      const cur = P(keys[i][1]), prev = i > 0 ? P(keys[i - 1][1]) : cur, t0 = keys[i][0];
      // slow in, overshoot, settle: outBack alone leaves at full speed in the first frame (a visible snap)
      const u = i > 0 ? U.clamp((tt - t0) / move) : 1, e = U.ease.outBack(sstep(u), 1.4), v = {};
      for (const k of NUM) { const a = prev[k] ?? DEF[k], b = cur[k] ?? DEF[k]; v[k] = a + (b - a) * e; }
      // a wiggle fades in after the move and out during the next one: no jump at either end
      const wig = (pose, amp, from) => { if (pose.wiggle && amp > 0) for (const k in pose.wiggle) v[k] += Math.sin((tt - from) * Math.PI * 5) * pose.wiggle[k] * amp; };
      wig(cur, i > 0 ? sstep((tt - t0 - move * 0.6) / 0.3) : 1, t0);
      if (i > 0) wig(prev, 1 - sstep(u * 1.5), keys[i - 1][0]);
      return { i, cur, prev, u, t0, v };
    };
    const pose = (tt) => {
      const now = at(tt), out = { ...(now.u < 0.5 ? now.prev : now.cur), ...now.v };
      delete out.wiggle; delete out.talking;
      for (const k in LAG) out[k] = at(tt - LAG[k]).v[k];
      // anticipation: a dip that builds over 0.12 s before a key and springs back during the move (it used to snap back)
      const next = keys[now.i + 1], pre = next ? U.clamp(1 - (next[0] - tt) / 0.12) : 0, post = now.i > 0 ? 1 - sstep((tt - now.t0) / (move * 0.5)) : 0;
      const a = Math.max(pre, post);
      out.sy *= 1 - 0.05 * a; out.sx *= 1 + 0.03 * a; out.bob += 10 * a;
      // the face changes behind a blink, shut exactly when eyes/mouth swap (half-way through the move)
      out.blink = now.i > 0 && (now.prev.eyes !== now.cur.eyes || now.prev.mouth !== now.cur.mouth) ? 1 - U.clamp(Math.abs(tt - (now.t0 + move * 0.5)) / 0.09) : 0;
      const flap = 0.5 + 0.5 * Math.sin(tt * 22) * Math.sin(tt * 7.3); // the mouth eases into and out of talking
      if (now.cur.talking) out.talk = flap * (now.i > 0 ? sstep((tt - now.t0) / 0.12) : 1);
      else if (now.i > 0 && now.prev.talking) out.talk = flap * (1 - sstep((tt - now.t0) / 0.12));
      if (alive) { const d = idle(tt, seed); out.blink = Math.max(out.blink, d.blink); out.bob += d.bob; out.sy *= d.sy; out.lean += d.lean; out.tilt += d.tilt; out.look = U.clamp(out.look + d.look, -1, 1); }
      for (const [g0, name] of gestures) {
        if (!GESTURES[name]) throw new Error(`unknown gesture ${name}; have ${Object.keys(GESTURES).join(', ')}`);
        const [dur, f] = GESTURES[name], u = (tt - g0) / dur;
        if (u >= 0 && u < 1) { const d = f(u); for (const k in d) out[k] += d[k]; }
      }
      return out;
    };
    const out = pose(t);
    // secondary motion: hair hangs where the head was over the last 0.25 s
    const head = (p) => p.lean + p.tilt;
    let past = 0;
    for (let k = 1; k <= 5; k++) past += head(pose(t - k * 0.05)) / 5;
    out.sway = U.clamp((past - head(out)) * 2.5, -0.4, 0.4);
    return out;
  }

  // walk cycle (front view): legs and arms swing in turn; add to a pose: { ...R.act(t, keys), ...R.walk(t) }
  const walk = (t, speed = 1) => {
    const ph = t * Math.PI * 2 * 1.6 * speed, s = Math.sin(ph);
    return { lHip: 0.04 + Math.max(0, s) * 0.25, rHip: 0.04 + Math.max(0, -s) * 0.25, lKnee: Math.max(0, s) * 0.6, rKnee: Math.max(0, -s) * 0.6, lSh: 0.12 - s * 0.25, rSh: 0.12 + s * 0.25, bob: -Math.abs(Math.cos(ph)) * 12 };
  };

  globalThis.R = { draw, act, idle, walk, screen, hand, check, SPEC, POSES, GESTURES, CAST, BODY, BODIES: Object.keys(BODY) };
})();
