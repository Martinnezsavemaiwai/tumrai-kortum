// RIG KIT — one skeleton, many body styles. Neck, shoulders, elbows, wrists, hips, knees; hands with fingers.
// Load after engine/video/gfx.js (and kit/art.js):  <script src="kit/rig.js"></script>
//
//   R.draw(ctx, { x, y, s: 1, body: 'chibi', who: R.CAST.mali, t, ...R.act(t, [[0, 'idle'], [2, 'wave']]) });
//
// Bodies: chibi (big head, but a neck, elbows and fingers; the default) · explainer (flat vector, soft shading) ·
// brick (a toy brick figure: cylinder head with a stud, printed face, trapezoid torso, block legs, C-shaped hands;
// pairs with STYLE 'bricks'). Feet at (x, y); s = 1 is 1000 px tall. Every body takes the same pose fields, so
// poses, R.act and R.walk work for all of them, and every line goes through G.* so all drawing styles apply.
//
// Pose fields (radians unless noted): lSh/rSh shoulder (0 = arm hanging, + = out and up), lEl/rEl elbow
// (+ = forearm swings further out, − = folds in toward the face), lHip/rHip, lKnee/rKnee, lean, tilt (head),
// look/lookY −1…1, bob (px), sx/sy squash, eyes, mouth, talk 0…1 (mouth open), handL/handR
// ('open' 'fist' 'point' 'peace' 'thumb' 'relax'), fx ['sweat' 'blush' 'tears' 'anger' 'shock' 'sparkle'],
// reachL/reachR [x, y]: the wrist goes there (IK, same coordinates as the figure's x, y; overrides that arm's
// lSh/lEl or rSh/rEl). Move the target over t to animate it: { ...R.act(t, keys), reachR: [knob.x, knob.y] }.
// ponytail: no blend weight; add a `reach` 0…1 mix if a reach must ease in from a pose.
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
  // one light from the top left: how strong the far-side shadow is per body
  const SHADE = { chibi: 0.14, explainer: 0.28 };

  // ---------- proportions (units: the figure is 1000 tall at s = 1) ----------
  const BODY = {
    // eye: where the eyes sit, as a fraction of the head's half-height below its centre (default 0.2); direct.js frames on it
    chibi: { eye: 0.12, head: [190, 175], neck: 30, torso: 230, sw: 88, ww: 78, hw: 74, ua: 120, fa: 110, hand: 52, thigh: 120, shin: 120, limb: 36, leg: 42, foot: 44 },
    explainer: { head: [108, 104], neck: 24, torso: 250, sw: 86, ww: 72, hw: 70, ua: 150, fa: 140, hand: 54, thigh: 170, shin: 165, limb: 36, leg: 42, foot: 46 },
    brick: { eye: -0.05, head: [118, 100], neck: 26, torso: 290, sw: 96, ww: 130, hw: 148, ua: 125, fa: 115, hand: 46, thigh: 165, shin: 165, limb: 54, leg: 130, foot: 40 },
  };

  // ---------- a sample cast (data only: add your own) ----------
  const CAST = {
    mali: { name: 'มะลิ', skin: '#F6D7C3', hair: '#3A2A3E', hairStyle: 'long', eye: '#7A4A9E', top: '#F2F2F2', collar: '#2E4A7A', bottom: '#2E4A7A', bottomStyle: 'skirt', shoes: '#3A3030', tie: '#C83C4A' },
    krit: { name: 'กฤษ', skin: '#E9C2A2', hair: '#1E1A22', hairStyle: 'spiky', eye: '#3A6EA5', top: '#3A6EA5', bottom: '#2B2E3A', bottomStyle: 'pants', shoes: '#F2F2F2' },
    nok: { name: 'นก', skin: '#F2D0B4', hair: '#E8A23C', hairStyle: 'twintail', eye: '#2F8A6A', top: '#F28AA8', bottom: '#F6F0E2', bottomStyle: 'skirt', shoes: '#C83C4A' },
    lung: { name: 'ลุงชม', skin: '#D9A882', hair: '#D8D4CC', hairStyle: 'bald', eye: '#4A3A2A', top: '#7A9A5A', bottom: '#4A3E34', bottomStyle: 'pants', shoes: '#3A3030', old: true },
    ton: { name: 'ต้น', skin: '#F2D3B8', hair: '#2A1E1A', hairStyle: 'short', eye: '#3A2A20', top: '#F4F1EA', jacket: '#F2B33C', bottom: '#3A4A6A', bottomStyle: 'pants', shoes: '#F2F2F2', glasses: '#2A2230' },
  };

  // ---------- character spec: every field a `who` object may have (story.mjs validates bible looks with R.check) ----------
  const SPEC = {
    body: Object.keys(BODY),
    colors: ['skin', 'hair', 'eye', 'top', 'collar', 'bottom', 'shoes', 'tie', 'jacket', 'glasses', 'accent', 'sash', 'band', 'belt', 'socks', 'apron', 'bow', 'vest', 'markColor'],
    hairStyle: ['long', 'short', 'bob', 'ponytail', 'twintail', 'spiky', 'bald', 'tuft', 'buzz'],
    bottomStyle: ['skirt', 'pants', 'shorts', 'sarong'],
    shoeStyle: ['sneaker', 'leather', 'flipflop'],
    flags: ['old', 'crown', 'belly', 'mustache', 'sleeveless', 'check'],
    text: ['name', 'mark'],
  };
  function check(who) {
    const out = [];
    for (const [k, v] of Object.entries(who || {})) {
      if (SPEC.colors.includes(k)) { if (!/^#[0-9a-fA-F]{6}$/.test(String(v))) out.push(`${k}: "${v}" is not a #rrggbb colour`); }
      else if (Array.isArray(SPEC[k])) { if (!SPEC[k].includes(v)) out.push(`${k}: "${v}" is not one of ${SPEC[k].join(' ')}`); }
      else if (SPEC.flags.includes(k)) { if (typeof v !== 'boolean') out.push(`${k}: must be true/false`); }
      else if (!SPEC.text.includes(k)) out.push(`${k}: unknown field (have ${[...SPEC.colors, 'body', 'hairStyle', 'bottomStyle', 'shoeStyle', ...SPEC.flags, 'name'].join(' ')})`);
    }
    if (who && !who.skin) out.push('skin: missing');
    return out;
  }

  // ---------- hands: fingers point along the forearm; side −1 = screen-left hand ----------
  function hand(ctx, x, y, ang, side, kind, size, skin, body, seed) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang * side); ctx.scale(side, 1); // local: fingers grow toward +y, thumb toward −x
    const s = size, fl = { lw: 3 };
    const finger = (fx, fy, a, len, w, curl = 0) => {
      const p = [[fx, fy]], n = 3;
      for (let i = 1; i <= n; i++) { const aa = a + curl * i / n; const prev = p[p.length - 1]; p.push([prev[0] + Math.sin(aa) * len / n, prev[1] + Math.cos(aa) * len / n]); }
      G.limb(ctx, p, { color: skin, lw: w, outline: 3, seed: seed + Math.round(fx) });
    };
    const nF = 4, fw = s * 0.2, base = s * 0.38;
    const spread = (i) => (i - (nF - 1) / 2) * 0.2;
    const fx = (i) => (i - (nF - 1) / 2) * s * 0.19;
    const ext = { open: [1, 1, 1, 1], relax: [1, 1, 1, 1], point: [1, 0, 0, 0], peace: [1, 1, 0, 0], fist: [0, 0, 0, 0], thumb: [0, 0, 0, 0] }[kind] || [1, 1, 1, 1];
    // fingers behind the palm first (extended ones), palm, then folded knuckles + thumb on top
    for (let i = 0; i < nF; i++) {
      const k = nF - 1 - i; // index finger nearest the thumb
      if (!ext[k]) continue;
      const curl = kind === 'relax' ? 0.5 : 0;
      finger(fx(i), base * 0.7, spread(i) * (kind === 'open' ? 1.6 : kind === 'peace' ? 1.4 : 0.6), s * 0.6, fw, curl);
    }
    ell(ctx, 0, s * 0.1, s * 0.36, s * 0.38, skin, seed + 1, fl);
    if (ext.some((e) => !e)) for (let i = 0; i < nF; i++) { const k = nF - 1 - i; if (!ext[k]) ell(ctx, fx(i), s * 0.42, fw * 0.62, fw * 0.55, skin, seed + 10 + i, fl); } // folded knuckles
    if (kind === 'thumb') finger(-s * 0.32, s * 0.1, Math.PI, s * 0.42, fw * 1.1);
    else finger(-s * 0.3, s * 0.05, kind === 'fist' || kind === 'point' || kind === 'peace' ? 0.9 : -0.9, s * 0.38, fw * 1.1);
    ctx.restore();
  }

  // ---------- eyes ----------
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
    if (!c.hair || c.hairStyle === 'bald' || c.hairStyle === 'spiky' || c.hairStyle === 'tuft' || c.hairStyle === 'buzz') return;
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
  // ---------- shoes: the foot points outward (d), sole on the ground line ay + foot*0.4 ----------
  //   sneaker = canvas upper, white rubber sole + toe cap, laces · leather = rounded toe, dark heel/sole, shine ·
  //   flipflop = bare foot on a flat rubber sole with a thong strap (รองเท้าแตะหูหนีบ) · none = the old plain wedge
  function shoe(ctx, c, ax, ay, d, B, seed) {
    const col = c.shoes || '#3A3030', L = B.leg * 1.1, F = B.foot * 1.3, toe = ax + d * F * 0.95, back = ax - d * L * 0.62;
    const upper = [[ax - d * L * 0.6, ay - F * 0.32], [ax + d * L * 0.6, ay - F * 0.32], [toe, ay + F * 0.02], [toe - d * F * 0.05, ay + F * 0.3], [back, ay + F * 0.3]];
    if (c.shoeStyle === 'flipflop') {
      poly(ctx, [[back - d * 4, ay + F * 0.28], [toe + d * 8, ay + F * 0.28], [toe + d * 8, ay + F * 0.46], [back - d * 4, ay + F * 0.46]], col, seed + 1, { lw: 3 });
      poly(ctx, [[ax - d * L * 0.5, ay - F * 0.3], [ax + d * L * 0.5, ay - F * 0.3], [toe - d * 2, ay + F * 0.12], [toe - d * 6, ay + F * 0.3], [back, ay + F * 0.3]], c.skin || '#E9C2A2', seed, { lw: 3 });
      G.line(ctx, [[ax - d * L * 0.45, ay + F * 0.22], [ax + d * F * 0.5, ay - F * 0.02], [ax + d * L * 0.55, ay + F * 0.24]], { color: col, lw: 6, seed: seed + 2 });
      return;
    }
    if (c.shoeStyle === 'sneaker') {
      poly(ctx, upper, col, seed);
      poly(ctx, [[back - d * 2, ay + F * 0.18], [toe + d * 3, ay + F * 0.18], [toe + d * 3, ay + F * 0.44], [back - d * 2, ay + F * 0.44]], '#F2F0EA', seed + 1, { lw: 3 });
      ell(ctx, toe - d * F * 0.18, ay + F * 0.12, F * 0.22, F * 0.16, '#F2F0EA', seed + 2, { lw: 3 });
      for (let k = 0; k < 2; k++) G.line(ctx, [[ax - d * L * 0.25 + d * k * 8, ay - F * 0.2 + k * 9], [ax + d * L * 0.3 + d * k * 8, ay - F * 0.12 + k * 9]], { color: '#F2F0EA', lw: 3, seed: seed + 3 + k });
      return;
    }
    if (c.shoeStyle === 'leather') {
      poly(ctx, upper, col, seed);
      poly(ctx, [[back - d * 2, ay + F * 0.26], [toe + d * 2, ay + F * 0.26], [toe + d * 2, ay + F * 0.42], [back - d * 2, ay + F * 0.42]], shade(col, -0.45), seed + 1, { lw: 3 });
      ctx.save(); ctx.globalAlpha = 0.55; G.line(ctx, [[toe - d * F * 0.5, ay - F * 0.02], [toe - d * F * 0.18, ay + F * 0.06]], { color: '#FFFFFF', lw: 5, seed: seed + 2 }); ctx.restore();
      return;
    }
    poly(ctx, [[ax - d * B.leg * 0.6, ay - B.foot * 0.3], [ax + d * B.leg * 0.6, ay - B.foot * 0.3], [ax + d * B.foot * 0.9, ay + B.foot * 0.35], [ax - d * B.leg * 0.6, ay + B.foot * 0.35]], col, seed); // plain wedge (same winding both feet)
  }
  function hairFront(ctx, c, hx, hy, rx, ry, seed, body) {
    if (!c.hair || c.hairStyle === 'bald') { if (c.old) for (const d of [-1, 1]) ell(ctx, hx + d * rx * 0.95, hy + ry * 0.05, rx * 0.2, ry * 0.32, c.hair || '#D8D4CC', seed + d); return; }
    if (c.hairStyle === 'buzz') { // ทรงนักเรียน/เกรียน: a thin cap hugging the scalp, high straight hairline, no locks
      const cap = [];
      for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.0 + i / 16); cap.push([hx + Math.cos(a) * rx * 1.03, hy - ry * 0.02 + Math.sin(a) * ry * 1.02]); }
      cap.push([hx + rx * 0.98, hy - ry * 0.12], [hx + rx * 0.7, hy - ry * 0.42], [hx - rx * 0.7, hy - ry * 0.42], [hx - rx * 0.98, hy - ry * 0.12]);
      const mix = (p, q, u) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(p.slice(i, i + 2), 16) * (1 - u) + parseInt(q.slice(i, i + 2), 16) * u).toString(16).padStart(2, '0')).join('');
      sh(ctx, cap, mix(c.hair, c.skin || c.hair, 0.38), seed, { lw: 2 }); // stubble: scalp shows through
      return;
    }
    // the crown cap plus a fringe of spiky locks down to the brows
    const cap = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.02 + 0.96 * i / 16); cap.push([hx + Math.cos(a) * rx * 1.1, hy - ry * 0.05 + Math.sin(a) * ry * 1.08]); }
    const n = c.hairStyle === 'spiky' ? 6 : 5, brow = hy - ry * (body === 'chibi' ? 0.25 : 0.3), fw = 1.08, notch = 0.2;
    for (let i = n; i >= 0; i--) {
      const u = i / n, x0 = hx + rx * fw * (2 * u - 1);
      cap.push([x0, brow + (i % 2 ? 0 : ry * 0.22) + (c.hairStyle === 'spiky' ? ry * 0.08 : 0)]);
      if (i > 0) cap.push([x0 - rx * notch, brow - ry * 0.12]);
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

  // two-bone IK: shoulder angle a and elbow el (pose units, side d) that put the wrist at (tx, ty), in the arm's
  // own coordinates; out of reach = the arm points straight at it. Of the two ways to bend, the one with the
  // lower elbow (an elbow above the shoulder to reach sideways looks broken).
  const ik = (x0, y0, tx, ty, d, ua, fa) => {
    const dx = d * (tx - x0), dy = ty - y0;
    const L = Math.min(ua + fa - 1e-3, Math.max(Math.abs(ua - fa) + 1e-3, Math.hypot(dx, dy)));
    const acos = (v) => Math.acos(Math.max(-1, Math.min(1, v)));
    const al = acos((ua * ua + L * L - fa * fa) / (2 * ua * L)), be = Math.PI - acos((ua * ua + fa * fa - L * L) / (2 * ua * fa)), phi = Math.atan2(dx, dy);
    return Math.cos(phi + al) >= Math.cos(phi - al) ? [phi + al, -be] : [phi - al, be];
  };

  // ---------- the front-view figure (chibi, explainer) ----------
  const DEF = { lSh: 0.12, rSh: 0.12, lEl: 0.1, rEl: 0.1, lHip: 0.04, rHip: 0.04, lKnee: 0, rKnee: 0, lean: 0, tilt: 0, look: 0, lookY: 0, bob: 0, sx: 1, sy: 1, talk: 0 };
  function front(ctx, o, c, B, body, seed) {
    const p = { ...DEF, ...o };
    if (c.belly) B = { ...B, sw: B.sw * 1.1, ww: B.ww * 1.75, hw: B.hw * 1.35 }; // a round middle
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
      if (c.bottomStyle === 'shorts') G.limb(ctx, [[x0, y0], [x0 + (kx - x0) * 0.72, y0 + (ky - y0) * 0.72]], { color: c.bottom, lw: B.leg * 1.6, outline: 4, seed: seed + 52 + d }); // above the knee
      if (c.socks) G.limb(ctx, [[kx + (ax - kx) * 0.55, ky + (ay - ky) * 0.55], [ax, ay]], { color: c.socks, lw: B.leg * 1.08, seed: seed + 53 + d });
      shoe(ctx, c, ax, ay, d, B, seed + 56 + d);
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
    if (c.bottomStyle === 'sarong') { // ผ้าถุง: a tube of cloth from the waist to the ankles, a fold at the top, woven bands
      const hem = hipY + (B.thigh + B.shin) * 0.9;
      poly(ctx, [[-B.ww * 1.02, waistY], [B.ww * 1.02, waistY], [B.hw * 1.14, hem], [-B.hw * 1.14, hem]], c.bottom, seed + 3);
      for (const u of [0.55, 0.8]) { const y = waistY + (hem - waistY) * u, w = U.lerp(B.ww, B.hw * 1.14, u); poly(ctx, [[-w, y - 9], [w, y - 9], [w, y + 9], [-w, y + 9]], shade(c.bottom, -0.22), seed + 31 + u * 10, { lw: 2 }); }
      poly(ctx, [[-B.ww * 1.05, waistY - 10], [B.ww * 1.05, waistY - 10], [B.ww * 1.05, waistY + 14], [-B.ww * 1.05, waistY + 14]], shade(c.bottom, 0.12), seed + 33, { lw: 3 });
    }
    if (c.apron) { // ผ้ากันเปื้อน: a bib apron with a neck strap and a pocket
      const top = sy + B.torso * 0.3, hem = hipY + B.thigh * 0.62;
      for (const d of [-1, 1]) G.line(ctx, [[d * B.ww * 0.55, top], [d * B.sw * 0.3, sy - 2]], { color: shade(c.apron, -0.2), lw: 7, seed: seed + 34 + d });
      poly(ctx, [[-B.ww * 0.62, top], [B.ww * 0.62, top], [B.hw * 0.95, hem], [-B.hw * 0.95, hem]], c.apron, seed + 36);
      poly(ctx, [[-B.ww * 0.4, waistY + 20], [B.ww * 0.4, waistY + 20], [B.ww * 0.42, waistY + 70], [-B.ww * 0.42, waistY + 70]], shade(c.apron, -0.12), seed + 37, { lw: 3 });
    }
    if (c.belt) { // a leather belt with a brass buckle over the tucked-in shirt
      poly(ctx, [[-B.ww * 1.02, waistY - 6], [B.ww * 1.02, waistY - 6], [B.ww * 1.03, waistY + 12], [-B.ww * 1.03, waistY + 12]], c.belt, seed + 8);
      poly(ctx, [[-13, waistY - 9], [13, waistY - 9], [13, waistY + 15], [-13, waistY + 15]], '#D8B85A', seed + 10);
    }
    if (c.vest) for (const d of [-1, 1]) poly(ctx, [[d * B.sw * 0.22, sy - 4], [d * B.sw * 0.95, sy + 10], [d * B.hw * 1.02, hipY + 14], [d * B.hw * 0.25, hipY + 14]], c.vest, seed + 38 + d); // an open vest (เสื้อกั๊กวิน)
    if (c.mark) { // embroidered school initials (อักษรย่อ) on the chest, navy thread — or a vest number in markColor
      ctx.save(); ctx.fillStyle = c.markColor || '#2E3F8A'; ctx.font = '700 ' + Math.round(B.sw * 0.3) + 'px Kanit'; ctx.textAlign = 'center';
      ctx.fillText(c.mark, B.sw * 0.58, sy + B.torso * 0.24); ctx.restore();
    }
    if (c.collar) for (const d of [-1, 1]) poly(ctx, [[0, sy + 30], [d * B.sw * 0.55, sy - 4], [d * B.sw * 0.75, sy + 34], [d * 8, sy + 50]], c.collar, seed + 4 + d);
    if (c.tie) poly(ctx, [[-10, sy + 40], [10, sy + 40], [16, sy + 90], [0, sy + 104], [-16, sy + 90]], c.tie, seed + 7);
    if (c.bow) { for (const d of [-1, 1]) poly(ctx, [[0, sy + 30], [d * 34, sy + 14], [d * 34, sy + 50]], c.bow, seed + 40 + d, { lw: 3 }); ell(ctx, 0, sy + 32, 9, 9, shade(c.bow, -0.15), seed + 42, { lw: 2 }); } // โบว์นักเรียนหญิง
    if (c.sash) { // a cloth belt (ผ้าคาดเอว) with its knotted end hanging at the side
      poly(ctx, [[-B.ww * 1.06, waistY - 14], [B.ww * 1.06, waistY - 14], [B.ww * 1.08, waistY + 22], [-B.ww * 1.08, waistY + 22]], c.sash, seed + 6);
      poly(ctx, [[B.ww * 0.45, waistY + 4], [B.ww * 0.7, waistY + 4], [B.ww * 0.78, waistY + 90], [B.ww * 0.5, waistY + 82]], shade(c.sash, -0.12), seed + 9);
      if (c.check) { ctx.save(); ctx.globalAlpha = 0.45; for (let k = -3; k <= 3; k++) G.line(ctx, [[k * B.ww * 0.3, waistY - 14], [k * B.ww * 0.3, waistY + 22]], { color: '#F4F0E8', lw: 4, seed: seed + 44 + k }); G.line(ctx, [[-B.ww, waistY + 4], [B.ww, waistY + 4]], { color: '#F4F0E8', lw: 4, seed: seed + 51 }); ctx.restore(); } // ผ้าขาวม้า checks
    }
    // neck
    sh(ctx, G.rrPts(-B.limb * 0.55, neckTop - 8, B.limb * 1.1, B.neck + 22, 8), shade(c.skin, -0.12), seed + 8, { lw: 3 }); // in the head's shadow

    // head (tilts round the neck)
    ctx.save(); ctx.translate(0, neckTop); ctx.rotate(p.tilt); ctx.translate(0, -neckTop);
    const face = G.ellPts(0, hy, hrx, hry);
    sh(ctx, face, c.skin, seed + 11);
    soft(ctx, face, c.skin, body === 'explainer' ? 0.22 : SHADE[body]);
    if (c.hair && c.hairStyle !== 'bald') { // the fringe casts a soft shadow on the forehead
      ctx.save(); ctx.beginPath(); G.path(ctx, face, true); ctx.clip();
      ctx.fillStyle = 'rgba(110,50,70,0.1)'; ctx.beginPath(); ctx.ellipse(0, hy - hry * 0.34, hrx * 1.1, hry * 0.36, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // eyes, brows, mouth
    const ey = hy + hry * (B.eye ?? 0.2), ex = hrx * (body === 'chibi' ? 0.42 : 0.38);
    for (const d of [-1, 1]) {
      dotEye(ctx, d * ex, ey, d, p, c, seed + 20 + d, hrx * (body === 'explainer' ? 0.12 : 0.17));
      if (c.glasses) { const gr = hrx * 0.24; ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(d * ex, ey, gr, 0, Math.PI * 2); ctx.fill(); ctx.restore(); G.line(ctx, G.ellPts(d * ex, ey, gr, gr).concat([G.ellPts(d * ex, ey, gr, gr)[0]]), { color: c.glasses, lw: 6, seed: seed + 90 + d, amp: 0.3 }); if (d > 0) G.line(ctx, [[-ex + gr, ey - 4], [0, ey - 10], [ex - gr, ey - 4]], { color: c.glasses, lw: 6, seed: seed + 93, amp: 0.3 }); }
    }
    { mouth(ctx, 0, ey + hry * 0.42, hrx * (p.mouth === 'smirk' || p.mouth === 'grin' ? 0.2 : 0.12), p, seed + 34, c); /* a smirk/grin must read at phone size */ ctx.fillStyle = 'rgba(240,120,140,0.35)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * ex * 1.35, ey + hry * 0.28, 24, 12, 0, 0, Math.PI * 2); ctx.fill(); } }
    if (c.old) for (const d of [-1, 1]) G.line(ctx, [[d * ex * 1.2, ey + 10], [d * ex * 1.5, ey + 2]], { color: shade(c.skin, -0.3), lw: 3, seed: seed + 36 + d });
    if (c.mustache) { // two curls just above the mouth
      const my = ey + hry * 0.42 - hry * 0.13, w = hrx * 0.24;
      for (const d of [-1, 1]) G.line(ctx, [[d * 4, my], [d * w * 0.5, my + hry * 0.05], [d * w, my - hry * 0.02], [d * w * 1.1, my - hry * 0.1]], { color: c.hair || INK, lw: hry * 0.045, seed: seed + 38 + d });
    }
    hairFront(ctx, c, 0, hy, hrx, hry, seed + 40, body);
    if (c.crown) { // a Thai chada: gold band, three tiers, a tall spire, red gems
      const gold = '#E2B04A', top = hy - hry * 0.95, bw = hrx * 0.8;
      poly(ctx, [[-bw, top + hry * 0.18], [bw, top + hry * 0.18], [bw * 0.92, top - hry * 0.05], [-bw * 0.92, top - hry * 0.05]], gold, seed + 70);
      for (let k = 0; k < 3; k++) {
        const y0 = top - hry * (0.05 + k * 0.22), w0 = bw * (0.82 - k * 0.2), w1 = bw * (0.66 - k * 0.2);
        poly(ctx, [[-w0, y0], [w0, y0], [w1, y0 - hry * 0.22], [-w1, y0 - hry * 0.22]], k % 2 ? shade(gold, -0.15) : gold, seed + 71 + k);
      }
      poly(ctx, [[-bw * 0.22, top - hry * 0.71], [bw * 0.22, top - hry * 0.71], [0, top - hry * 1.35]], gold, seed + 75);
      for (const d of [-0.5, 0, 0.5]) ell(ctx, d * bw, top + hry * 0.065, hry * 0.05, hry * 0.05, '#C8323C', seed + 76 + d * 2, { lw: 2 });
    }
    marks(ctx, 0, hy, hrx, p.fx, p.t || 0, seed + 60);
    ctx.restore();

    // arms, in front of everything (hands can reach the face)
    for (const d of [-1, 1]) {
      let a = d < 0 ? p.lSh : p.rSh, el = d < 0 ? p.lEl : p.rEl;
      const kind = (d < 0 ? p.handL : p.handR) || 'relax', tgt = d < 0 ? p.reachL : p.reachR;
      const x0 = d * B.sw * 0.92, y0 = sy + 16;
      if (tgt && p.world && ctx.getTransform) { // reachL/reachR: [x, y] in the same coordinates as the figure's x, y
        const q = ctx.getTransform().inverse().multiply(p.world).transformPoint({ x: tgt[0], y: tgt[1] });
        [a, el] = ik(x0, y0, q.x, q.y, d, B.ua, B.fa);
      }
      const exl = x0 + d * Math.sin(a) * B.ua, eyl = y0 + Math.cos(a) * B.ua;
      const a2 = a + el, wx = exl + d * Math.sin(a2) * B.fa, wy = eyl + Math.cos(a2) * B.fa;
      const pts = [[x0, y0], [(x0 + exl) / 2, (y0 + eyl) / 2], [exl, eyl], [(exl + wx) / 2, (eyl + wy) / 2], [wx, wy]];
      G.limb(ctx, pts.slice(2), { color: c.skin, lw: B.limb * 0.85, seed: seed + 72 + d }); // forearm
      G.limb(ctx, pts.slice(0, 3), { color: c.sleeveless ? c.skin : c.top || c.skin, lw: B.limb * (c.sleeveless ? 0.85 : 1.1), seed: seed + 74 + d }); // sleeve (bare arm when sleeveless)
      if (c.band && d === 1) { // a wristband on the screen-right forearm, clear of the hand so it reads small
        const at = (u) => [exl + (wx - exl) * u, eyl + (wy - eyl) * u];
        G.limb(ctx, [at(0.58), at(0.82)], { color: c.band, lw: B.limb * 1.15, seed: seed + 90 });
      }
      hand(ctx, wx, wy, a2, d, kind, B.hand, c.skin, body, seed + 80 + d * 7);
    }
    ctx.restore();
  }

  // ---------- brick: a toy brick figure, front view. Same pose fields as the others; hands are always the C-shaped grip,
  // knees only shorten the leg a little (the toy's legs swing from the hip), hair is a moulded piece. ----------
  function brick(ctx, o, c, B, seed) {
    const p = { ...DEF, ...o };
    const legLen = B.thigh + B.shin, hipY = -legLen - B.foot * 0.3, sy = hipY - B.torso, neckTop = sy - B.neck;
    const [hrx, hry] = B.head, hy = neckTop - hry * 0.92, bob = p.bob, edge = (k) => shade(k, -0.22);
    const rot = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
    const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const legCol = c.bottom || '#3A4A6A';

    // long hair hangs behind the shoulders
    if (c.hair && c.hairStyle === 'long') { ctx.save(); ctx.translate(0, hipY + bob); ctx.rotate(p.lean); ctx.translate(0, -hipY); poly(ctx, box(-hrx * 1.12, hy - hry * 0.4, hrx * 1.12, sy + B.torso * 0.28), c.hair, seed + 1); ctx.restore(); }

    // legs: blocks that swing from the hip pin; knees just shorten them a touch
    for (const d of [-1, 1]) {
      const hip = d < 0 ? p.lHip : p.rHip, knee = d < 0 ? p.lKnee : p.rKnee, px = d * B.hw * 0.5, py = hipY + 34 + bob;
      const L = legLen - 34 - Math.abs(Math.sin(knee)) * 50 - B.foot * 0.3, w = B.leg * 0.5, a = -d * hip * 0.6;
      poly(ctx, rot(box(px - w, py, px + w, py + L - B.foot), px, py, a), legCol, seed + 50 + d);
      poly(ctx, rot(box(px - w * 1.08, py + L - B.foot, px + w * 1.08, py + L), px, py, a), c.shoes || edge(legCol), seed + 52 + d); // the foot
    }

    // upper body leans and bobs around the hips
    ctx.save(); ctx.translate(0, hipY + bob); ctx.rotate(p.lean); ctx.translate(0, -hipY);
    poly(ctx, box(-B.hw, hipY - 8, B.hw, hipY + 42), legCol, seed + 3); // the hip piece
    if (c.bottomStyle === 'skirt' || c.bottomStyle === 'sarong') poly(ctx, [[-B.hw * 1.02, hipY - 8], [B.hw * 1.02, hipY - 8], [B.hw * 1.3, hipY + (c.bottomStyle === 'sarong' ? legLen * 0.8 : 150)], [-B.hw * 1.3, hipY + (c.bottomStyle === 'sarong' ? legLen * 0.8 : 150)]], c.bottom, seed + 4); // a sloped skirt piece
    const torso = [[-B.sw, sy], [B.sw, sy], [B.hw, hipY], [-B.hw, hipY]];
    poly(ctx, torso, c.top || '#6A8AB0', seed + 2);
    soft(ctx, torso, c.top, 0.2);
    // the print on the torso
    if (c.jacket) for (const d of [-1, 1]) poly(ctx, [[d * B.sw * 0.3, sy + 2], [d * B.sw * 0.98, sy + 2], [d * B.hw * 0.98, hipY - 2], [d * B.hw * 0.32, hipY - 2]], c.jacket, seed + 5 + d);
    if (c.vest) for (const d of [-1, 1]) poly(ctx, [[d * B.sw * 0.25, sy + 2], [d * B.sw * 0.9, sy + 4], [d * B.hw * 0.9, hipY - 2], [d * B.hw * 0.3, hipY - 2]], c.vest, seed + 38 + d);
    if (c.collar) for (const d of [-1, 1]) poly(ctx, [[0, sy + 44], [d * B.sw * 0.55, sy + 2], [d * B.sw * 0.7, sy + 40], [d * 8, sy + 58]], c.collar, seed + 6 + d);
    if (c.tie) poly(ctx, [[-12, sy + 46], [12, sy + 46], [18, sy + 110], [0, sy + 126], [-18, sy + 110]], c.tie, seed + 7);
    if (c.bow) for (const d of [-1, 1]) poly(ctx, [[0, sy + 34], [d * 36, sy + 18], [d * 36, sy + 54]], c.bow, seed + 40 + d, { lw: 3 });
    if (c.mark) { ctx.save(); ctx.fillStyle = c.markColor || '#2E3F8A'; ctx.font = '700 ' + Math.round(B.sw * 0.32) + 'px Kanit'; ctx.textAlign = 'center'; ctx.fillText(c.mark, B.sw * 0.55, sy + B.torso * 0.3); ctx.restore(); }
    sh(ctx, G.rrPts(-36, neckTop - 6, 72, B.neck + 14, 8), shade(c.skin, -0.12), seed + 8, { lw: 3 }); // the neck peg

    // head: a cylinder with a stud, the face printed on it; hair is a separate moulded piece on top
    ctx.save(); ctx.translate(0, neckTop); ctx.rotate(p.tilt); ctx.translate(0, -neckTop);
    if (!c.hair || c.hairStyle === 'bald' || c.hairStyle === 'buzz') sh(ctx, G.rrPts(-hrx * 0.5, hy - hry - 34, hrx, 44, 10), c.skin, seed + 9); // the stud
    const head = G.rrPts(-hrx, hy - hry, hrx * 2, hry * 2, hrx * 0.38);
    sh(ctx, head, c.skin, seed + 11); soft(ctx, head, c.skin, 0.2);
    const ey = hy + hry * B.eye, ex = hrx * 0.36;
    for (const d of [-1, 1]) {
      dotEye(ctx, d * ex, ey, d, p, c, seed + 20 + d, hrx * 0.11);
      if (c.glasses) G.line(ctx, G.ellPts(d * ex, ey, hrx * 0.22, hrx * 0.22).concat([G.ellPts(d * ex, ey, hrx * 0.22, hrx * 0.22)[0]]), { color: c.glasses, lw: 6, seed: seed + 90 + d, amp: 0.3 });
    }
    if (c.glasses) G.line(ctx, [[-ex + hrx * 0.22, ey - 4], [ex - hrx * 0.22, ey - 4]], { color: c.glasses, lw: 6, seed: seed + 93, amp: 0.3 });
    mouth(ctx, 0, ey + hry * 0.5, hrx * (p.mouth === 'smirk' || p.mouth === 'grin' ? 0.26 : 0.2), p, seed + 34, c);
    if (c.old) for (const d of [-1, 1]) G.line(ctx, [[d * ex * 1.25, ey + 12], [d * ex * 1.55, ey + 4]], { color: shade(c.skin, -0.3), lw: 3, seed: seed + 36 + d });
    if (c.mustache) for (const d of [-1, 1]) G.line(ctx, [[d * 4, ey + hry * 0.36], [d * hrx * 0.18, ey + hry * 0.42], [d * hrx * 0.3, ey + hry * 0.32]], { color: c.hair || INK, lw: 8, seed: seed + 38 + d });
    if (c.hair && c.hairStyle !== 'bald') {
      const H0 = hy - hry * 1.28, fr = hy - hry * 0.42; // crown top, fringe line
      if (c.hairStyle === 'buzz') sh(ctx, [[-hrx * 1.02, hy - hry * 0.3], [-hrx * 0.95, hy - hry * 1.02], [hrx * 0.95, hy - hry * 1.02], [hrx * 1.02, hy - hry * 0.3]], shade(c.hair, 0.25), seed + 41, { lw: 2 });
      else {
        const side = c.hairStyle === 'long' || c.hairStyle === 'bob' ? hy + hry * 0.55 : hy + hry * 0.05;
        const cap = [[-hrx * 1.14, side], [-hrx * 1.18, hy - hry * 0.75], [-hrx * 0.82, H0], [hrx * 0.82, H0], [hrx * 1.18, hy - hry * 0.75], [hrx * 1.14, side], [hrx * 0.94, side], [hrx * 0.9, fr], [-hrx * 0.2, fr + hry * 0.1], [-hrx * 0.9, fr], [-hrx * 0.94, side]];
        poly(ctx, cap, c.hair, seed + 42);
        if (c.hairStyle === 'spiky') for (let k = 0; k < 5; k++) { const x = -hrx * 0.8 + k * hrx * 0.4; poly(ctx, [[x - 26, H0 + 8], [x + 4, H0 - 46], [x + 26, H0 + 8]], c.hair, seed + 44 + k); }
        if (c.hairStyle === 'twintail' || c.hairStyle === 'ponytail') for (const d of c.hairStyle === 'twintail' ? [-1, 1] : [1]) ell(ctx, d * hrx * 1.3, hy - hry * 0.3, hrx * 0.28, hry * 0.6, c.hair, seed + 46 + d);
        ctx.save(); ctx.globalAlpha = 0.3; G.line(ctx, [[-hrx * 0.6, H0 + 26], [0, H0 + 14], [hrx * 0.5, H0 + 24]], { color: shade(c.hair, 0.7), lw: 10, seed: seed + 48 }); ctx.restore(); // moulded shine
      }
    }
    marks(ctx, 0, hy, hrx, p.fx, p.t || 0, seed + 60);
    ctx.restore();

    // arms: sleeve all the way, a wrist peg, the C-shaped grip
    for (const d of [-1, 1]) {
      let a = d < 0 ? p.lSh : p.rSh, el = d < 0 ? p.lEl : p.rEl;
      const tgt = d < 0 ? p.reachL : p.reachR, x0 = d * B.sw * 0.98, y0 = sy + 34;
      if (tgt && p.world && ctx.getTransform) { const q = ctx.getTransform().inverse().multiply(p.world).transformPoint({ x: tgt[0], y: tgt[1] }); [a, el] = ik(x0, y0, q.x, q.y, d, B.ua, B.fa); }
      const exl = x0 + d * Math.sin(a) * B.ua, eyl = y0 + Math.cos(a) * B.ua, a2 = a + el, ux = d * Math.sin(a2), uy = Math.cos(a2);
      const wx = exl + ux * B.fa, wy = eyl + uy * B.fa;
      G.limb(ctx, [[x0, y0], [exl, eyl], [wx, wy]], { color: c.sleeveless ? c.skin : c.top || c.skin, lw: B.limb, seed: seed + 74 + d });
      G.limb(ctx, [[wx, wy], [wx + ux * 16, wy + uy * 16]], { color: c.skin, lw: B.limb * 0.5, seed: seed + 76 + d }); // the wrist peg
      const r = B.hand * 0.62, hx = wx + ux * (16 + r), hyy = wy + uy * (16 + r), ang = Math.atan2(uy, ux), gap = 0.95, n = 10;
      G.limb(ctx, Array.from({ length: n + 1 }, (_, i) => { const t = ang + gap + (i / n) * (Math.PI * 2 - gap * 2); return [hx + Math.cos(t) * r, hyy + Math.sin(t) * r]; }), { color: c.skin, lw: B.hand * 0.5, seed: seed + 80 + d }); // open toward the forearm's direction
    }
    ctx.restore();
  }

  function draw(ctx, o) {
    const c = typeof o.who === 'string' ? CAST[o.who] : o.who || CAST.mali;
    if (!c) throw new Error(`unknown character ${o.who}; have ${Object.keys(CAST).join(', ')}`);
    const body = o.body || c.body || 'chibi', B = BODY[body];
    if (!B) throw new Error(`unknown body ${body}; have ${Object.keys(BODY).join(', ')}`);
    const seed = (o.seed || 1) * 1000;
    if ((o.reachL || o.reachR) && ctx.getTransform) o = { ...o, world: ctx.getTransform() }; // where reach targets live
    ctx.save(); ctx.translate(o.x, o.y);
    if (o.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, 150 * (o.s || 1), 22 * (o.s || 1), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.scale((o.s || 1) * (o.sx || 1), (o.s || 1) * (o.sy || 1));
    // QA (scripts/qa.mjs sets R.faces = [] before a frame): where this face lands on the canvas, camera included
    if (Array.isArray(globalThis.R.faces)) {
      const hry = B.head[1], hy = -(B.thigh + B.shin) - B.foot * 0.3 - B.torso - B.neck - hry * 0.92, m = ctx.getTransform();
      const P = (y) => { const q = m.transformPoint({ x: 0, y }); return [q.x, q.y]; };
      globalThis.R.faces.push({ who: typeof o.who === 'string' ? o.who : null, name: c.name || null, look: { ...c, body }, alpha: ctx.globalAlpha,
        eye: P(hy + hry * (B.eye ?? 0.2)), chin: P(hy + hry), top: P(hy - hry * 1.12) });
    }
    if (body === 'brick') brick(ctx, o, c, B, seed); else front(ctx, o, c, B, body, seed);
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

  globalThis.R = { draw, act, idle, walk, hand, check, ik, SPEC, POSES, GESTURES, CAST, BODY, BODIES: Object.keys(BODY) };
})();
