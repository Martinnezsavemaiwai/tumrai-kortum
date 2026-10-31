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
    const tilt = e === 'angry' ? side * -7 : e === 'sad' ? side * 6 : 0;
    G.line(ctx, [[cx - side * w - 2, lid + 4 + tilt], [cx, lid - 2], [cx + side * w + 4, lid + 3 - tilt], [cx + side * (w + 10), lid - 3 - tilt]], { color: INK, lw: 5, seed: seed + 1, amp: 0.4 });
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
    if (e === 'angry' || e === 'sad') G.line(ctx, [[cx - r, cy - r * 1.3 + (e === 'angry' ? -side : side) * 8], [cx + r, cy - r * 1.3 - (e === 'angry' ? -side : side) * 8]], { color: INK, lw: 5, seed: seed + 3 });
  }
  function cartoonEye(ctx, cx, cy, side, o, seed) { // tall white ovals, pupils that touch
    const e = o.eyes || 'normal', blink = o.blink ? Math.max(0.08, 1 - o.blink) : 1;
    if (e === 'happy' || e === 'closed' || blink < 0.2) { G.line(ctx, [[cx - 24, cy], [cx, cy + (e === 'happy' ? -18 : 12)], [cx + 24, cy]], { color: INK, lw: 7, seed }); return; }
    const big = e === 'shock' ? 1.25 : 1;
    ell(ctx, cx, cy, 30 * big, 44 * big * blink, '#FFFFFF', seed, { lw: 5 });
    const lx = (o.look || 0) * 12 - side * 8, ly = (o.lookY || 0) * 12 + 8;
    if (blink > 0.4) ell(ctx, cx + lx, cy + ly, e === 'shock' ? 6 : 12, e === 'shock' ? 8 : 18, INK, seed + 1, { lw: 0 });
    if (e === 'angry' || e === 'sly') { ctx.fillStyle = 'rgba(0,0,0,0)'; G.line(ctx, [[cx - side * 30, cy - 40 + (e === 'angry' ? -10 : 18)], [cx + side * 32, cy - 22 + (e === 'angry' ? 14 : 18)]], { color: INK, lw: 8, seed: seed + 2 }); }
    if (e === 'sad') G.line(ctx, [[cx - side * 30, cy - 46], [cx + side * 30, cy - 60]], { color: INK, lw: 6, seed: seed + 3 });
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
  function hairBack(ctx, c, hx, hy, rx, ry, seed) {
    if (!c.hair || c.hairStyle === 'bald' || c.hairStyle === 'spiky') return;
    if (c.hairStyle === 'long') poly(ctx, [[hx - rx * 1.15, hy - ry * 0.2], [hx - rx * 1.3, hy + ry * 2.6], [hx, hy + ry * 2.4], [hx + rx * 1.3, hy + ry * 2.6], [hx + rx * 1.15, hy - ry * 0.2]], c.hair, seed);
    if (c.hairStyle === 'twintail') for (const d of [-1, 1]) poly(ctx, [[hx + d * rx * 0.9, hy - ry * 0.6], [hx + d * rx * 1.7, hy - ry * 0.2], [hx + d * rx * 1.9, hy + ry * 1.6], [hx + d * rx * 1.45, hy + ry * 2.3], [hx + d * rx * 1.3, hy + ry * 0.8], [hx + d * rx * 1.0, hy - ry * 0.1]], c.hair, seed + d);
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
    // side locks framing the face
    if (c.hairStyle !== 'spiky') for (const d of [-1, 1]) poly(ctx, [[hx + d * rx * 0.98, hy - ry * 0.35], [hx + d * rx * 1.12, hy + ry * 0.75], [hx + d * rx * 0.86, hy + ry * 0.35]], c.hair, seed + 4 + d);
    if (c.hairStyle === 'spiky') for (let k = 0; k < 5; k++) { const a = Math.PI * (1.1 + k * 0.2); poly(ctx, [[hx + Math.cos(a - 0.12) * rx, hy + Math.sin(a - 0.12) * ry], [hx + Math.cos(a) * rx * 1.45, hy + Math.sin(a) * ry * 1.4], [hx + Math.cos(a + 0.12) * rx, hy + Math.sin(a + 0.12) * ry]], c.hair, seed + 10 + k); }
    // shine band
    ctx.save(); ctx.globalAlpha = 0.35; G.line(ctx, [[hx - rx * 0.6, hy - ry * 0.72], [hx - rx * 0.1, hy - ry * 0.86], [hx + rx * 0.4, hy - ry * 0.78]], { color: shade(c.hair, 0.6), lw: 8, seed: seed + 20 }); ctx.restore();
    if (c.hairStyle === 'twintail') for (const d of [-1, 1]) ell(ctx, hx + d * rx * 1.02, hy - ry * 0.55, 12, 12, '#E8506A', seed + 30 + d, { lw: 3 });
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
    hairBack(ctx, c, 0, hy, hrx, hry, seed + 1);
    // torso: shoulders → waist → hips, skirt over the hips
    const waistY = sy + B.torso * 0.62;
    poly(ctx, [[-B.sw, sy + 8], [-B.sw * 0.6, sy - 6], [B.sw * 0.6, sy - 6], [B.sw, sy + 8], [B.ww, waistY], [B.hw, hipY + 10], [-B.hw, hipY + 10], [-B.ww, waistY]], c.top || '#6A8AB0', seed + 2, { hatch: true });
    if (body === 'explainer') { soft(ctx, [[-B.sw, sy + 8], [B.sw, sy + 8], [B.hw, hipY + 10], [-B.hw, hipY + 10]], c.top, 0.28); if (c.jacket) for (const d of [-1, 1]) poly(ctx, [[d * B.sw * 0.25, sy - 4], [d * B.sw, sy + 8], [d * B.hw, hipY + 10], [d * B.hw * 0.3, hipY + 10]], c.jacket, seed + 5 + d); }
    if (c.bottomStyle === 'skirt') poly(ctx, [[-B.ww * 1.02, waistY], [B.ww * 1.02, waistY], [B.hw * 1.6, hipY + B.thigh * 0.55], [-B.hw * 1.6, hipY + B.thigh * 0.55]], c.bottom, seed + 3, { hatch: true });
    else if (c.bottom) poly(ctx, [[-B.ww, waistY], [B.ww, waistY], [B.hw, hipY + 16], [-B.hw, hipY + 16]], c.bottom, seed + 3);
    if (c.collar) for (const d of [-1, 1]) poly(ctx, [[0, sy + 30], [d * B.sw * 0.55, sy - 4], [d * B.sw * 0.75, sy + 34], [d * 8, sy + 50]], c.collar, seed + 4 + d);
    if (c.tie) poly(ctx, [[-10, sy + 40], [10, sy + 40], [16, sy + 90], [0, sy + 104], [-16, sy + 90]], c.tie, seed + 7);
    // neck
    sh(ctx, G.rrPts(-B.limb * 0.55, neckTop - 8, B.limb * 1.1, B.neck + 22, 8), shade(c.skin, -0.06), seed + 8, { lw: 3 });

    // head (tilts round the neck)
    ctx.save(); ctx.translate(0, neckTop); ctx.rotate(p.tilt); ctx.translate(0, -neckTop);
    if (body === 'cartoon') for (const d of [-1, 1]) ell(ctx, d * hrx * 0.98, hy + 6, hrx * 0.2, hry * 0.24, c.skin, seed + 9 + d);
    const face = body === 'anime'
      ? [...Array(25)].map((_, i) => { const a = Math.PI * 2 * i / 24; const yy = Math.sin(a); return [Math.cos(a) * hrx * (yy > 0 ? 1 - 0.32 * yy * yy : 1), hy + yy * hry * (yy > 0 ? 1.12 : 1)]; }) // pointed chin
      : G.ellPts(0, hy, hrx, hry);
    sh(ctx, face, c.skin, seed + 11);
    if (body === 'explainer') soft(ctx, face, c.skin);
    if (body === 'anime') for (const d of [-1, 1]) ell(ctx, d * hrx * 0.98, hy + 6, 8, 14, c.skin, seed + 12 + d, { lw: 3 });
    // eyes, brows, nose, mouth
    const ey = hy + hry * (body === 'chibi' ? 0.12 : body === 'cartoon' ? -0.12 : 0.2), ex = hrx * (body === 'chibi' ? 0.42 : body === 'cartoon' ? 0.24 : body === 'explainer' ? 0.38 : 0.44);
    for (const d of [-1, 1]) {
      if (body === 'anime') animeEye(ctx, d * ex, ey, d, p, c, seed + 20 + d);
      else if (body === 'cartoon') cartoonEye(ctx, d * ex, ey, d, p, seed + 20 + d);
      else dotEye(ctx, d * ex, ey, d, p, c, seed + 20 + d, hrx * (body === 'explainer' ? 0.12 : 0.17));
      if (c.glasses && body !== 'puppet') { const gr = hrx * 0.24; ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(d * ex, ey, gr, 0, Math.PI * 2); ctx.fill(); ctx.restore(); G.line(ctx, G.ellPts(d * ex, ey, gr, gr).concat([G.ellPts(d * ex, ey, gr, gr)[0]]), { color: c.glasses, lw: 6, seed: seed + 90 + d, amp: 0.3 }); if (d > 0) G.line(ctx, [[-ex + gr, ey - 4], [0, ey - 10], [ex - gr, ey - 4]], { color: c.glasses, lw: 6, seed: seed + 93, amp: 0.3 }); }
      if (body === 'anime' && p.eyes !== 'happy') { const tilt = p.eyes === 'angry' ? -8 : p.eyes === 'sad' || p.eyes === 'shock' ? 7 : 0; G.line(ctx, [[d * ex * 0.55, ey - 30 + tilt], [d * ex * 1.25, ey - 34 - tilt * 0.3]], { color: shade(c.hair || INK, -0.3), lw: 3, seed: seed + 26 + d }); }
    }
    if (body === 'cartoon') { ell(ctx, 0, ey + hry * 0.38, hrx * 0.16, hry * 0.12, shade(c.skin, -0.18), seed + 30); mouth(ctx, 0, ey + hry * 0.62, hrx * 0.42, p, seed + 31, c); }
    else if (body === 'anime') { G.line(ctx, [[2, ey + hry * 0.28], [-2, ey + hry * 0.34]], { color: shade(c.skin, -0.35), lw: 3, seed: seed + 32 }); mouth(ctx, 0, ey + hry * 0.5, hrx * 0.16, p, seed + 33, c); ctx.fillStyle = 'rgba(240,120,140,0.25)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * ex * 1.05, ey + hry * 0.32, 16, 6, 0, 0, Math.PI * 2); ctx.fill(); } }
    else { mouth(ctx, 0, ey + hry * 0.42, hrx * 0.12, p, seed + 34, c); ctx.fillStyle = 'rgba(240,120,140,0.35)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * ex * 1.35, ey + hry * 0.28, 24, 12, 0, 0, Math.PI * 2); ctx.fill(); } }
    if (c.old) for (const d of [-1, 1]) G.line(ctx, [[d * ex * 1.2, ey + 10], [d * ex * 1.5, ey + 2]], { color: shade(c.skin, -0.3), lw: 3, seed: seed + 36 + d });
    hairFront(ctx, c, 0, hy, hrx, hry, seed + 40, body);
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
    const body = o.body || 'anime', B = BODY[body], c = typeof o.who === 'string' ? CAST[o.who] : o.who || CAST.mali;
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

  // act(t, [[t0, 'idle'], [t1, 'wave'], …]) — anticipation (a dip 0.12 s before a change), an outBack move, a hold.
  // Keys are pose names or objects ({ ...R.POSES.point, look: -1 }). Pose `talking` flaps the mouth.
  function act(t, keys, { move = 0.35 } = {}) {
    const P = (k) => (typeof k === 'string' ? POSES[k] : k) || POSES.idle;
    let i = 0;
    while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const cur = P(keys[i][1]), prev = i > 0 ? P(keys[i - 1][1]) : cur;
    const u = i > 0 ? U.clamp((t - keys[i][0]) / move) : 1, e = U.ease.outBack(u, 1.4);
    const out = { ...(u < 0.5 ? prev : cur) };
    delete out.wiggle; delete out.talking;
    for (const k of NUM) { const a = prev[k] ?? DEF[k], b = cur[k] ?? DEF[k]; out[k] = a + (b - a) * e; }
    const next = keys[i + 1];
    if (next) { const v = U.clamp(1 - (next[0] - t) / 0.12); out.sy *= 1 - 0.05 * v; out.sx *= 1 + 0.03 * v; out.bob += 10 * v; }
    if (cur.wiggle && u >= 1) for (const k in cur.wiggle) out[k] += Math.sin(t * Math.PI * 5) * cur.wiggle[k];
    if (cur.talking) out.talk = 0.5 + 0.5 * Math.sin(t * 22) * Math.sin(t * 7.3);
    return out;
  }

  // walk cycle (front view): legs and arms swing in turn; add to a pose: { ...R.act(t, keys), ...R.walk(t) }
  const walk = (t, speed = 1) => {
    const ph = t * Math.PI * 2 * 1.6 * speed, s = Math.sin(ph);
    return { lHip: 0.04 + Math.max(0, s) * 0.25, rHip: 0.04 + Math.max(0, -s) * 0.25, lKnee: Math.max(0, s) * 0.6, rKnee: Math.max(0, -s) * 0.6, lSh: 0.12 - s * 0.25, rSh: 0.12 + s * 0.25, bob: -Math.abs(Math.cos(ph)) * 12 };
  };

  globalThis.R = { draw, act, walk, screen, hand, POSES, CAST, BODY, BODIES: Object.keys(BODY) };
})();
