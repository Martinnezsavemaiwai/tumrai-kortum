// node --test .agents/skills/tumraikortum/scripts/rig.test.mjs — motion checks for kit/rig.js R.act (no browser).
// Loads the real engine util (U) from examples/explainer-demo and the rig with a stub G (nothing is drawn here).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..', '..', '..');
const U = createRequire(import.meta.url)(path.join(ROOT, 'examples', 'explainer-demo', 'engine', 'util.js'));
const ctx = { G: {}, U };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(HERE, '..', 'kit', 'rig.js'), 'utf8'), ctx);
const R = ctx.R;

const KEYS = [[0, 'idle'], [1, 'wave'], [2.4, 'angry'], [3.6, 'sad'], [4.8, 'talk'], [6, 'idle']];
const NUMERIC = ['lSh', 'rSh', 'lEl', 'rEl', 'lean', 'tilt', 'look', 'lookY', 'bob', 'sx', 'sy', 'talk', 'sway'];
const range = (a, b, fps) => Array.from({ length: Math.round((b - a) * fps) + 1 }, (_, i) => a + i / fps);

test('deterministic: same t and seed, same pose; another seed blinks at other times', () => {
  for (const t of [0.3, 1.17, 4.2]) assert.deepEqual(R.act(t, KEYS, { seed: 3 }), R.act(t, KEYS, { seed: 3 }));
  const blinks = (seed) => range(0, 20, 30).filter((t) => R.act(t, KEYS, { seed }).blink > 0.9).map((t) => t.toFixed(2)).join();
  assert.notEqual(blinks(1), blinks(2));
});

test('no pops: every numeric field is continuous (sampled at 240 fps, through key changes, wiggles and gestures)', () => {
  const gestures = [[1.6, 'jump'], [3.0, 'shake'], [4.0, 'nod'], [5.0, 'shiver']];
  const max = { bob: 6, sway: 0.08 }; // px per 1/240 s for bob (a jump is fast), radians otherwise
  for (const alive of [false, true]) {
    let prev = null;
    for (const t of range(-0.2, 7, 240)) {
      const p = R.act(t, KEYS, { seed: 5, alive, gestures });
      if (prev) for (const k of NUMERIC) {
        const d = Math.abs(p[k] - prev[k]);
        assert.ok(d < (max[k] ?? 0.1), `${k} jumps by ${d.toFixed(3)} at t=${t.toFixed(3)} (alive=${alive})`);
      }
      prev = p;
    }
  }
});

test('eyes and mouth only swap while the eyes are shut', () => {
  let prev = null;
  for (const t of range(0, 7, 240)) {
    const p = R.act(t, KEYS, { alive: false });
    if (prev && (p.eyes !== prev.eyes || p.mouth !== prev.mouth)) assert.ok(p.blink >= 0.9 || prev.blink >= 0.9, `face swaps at t=${t.toFixed(3)} with blink ${p.blink.toFixed(2)}`);
    prev = p;
  }
});

test('blinks: a natural rate, each one short', () => {
  let onsets = 0, shut = 0, prev = 0;
  for (const t of range(0, 60, 60)) {
    const b = R.act(t, [[0, 'idle']], { seed: 7 }).blink;
    if (b > 0.5 && prev <= 0.5) onsets++;
    if (b > 0.5) shut++;
    prev = b;
  }
  assert.ok(onsets >= 15 && onsets <= 30, `${onsets} blinks per minute`);
  assert.ok(shut / onsets <= 7, `eyes shut ${shut / onsets} frames per blink at 60 fps`);
  assert.equal(R.act(10, [[0, 'idle']], { alive: false }).blink, 0);
});

test('follow-through: the head trails the body', () => {
  const keys = [[0, 'idle'], [1, 'sad']];
  const p = R.act(1.06, keys, { alive: false });
  assert.ok(p.lean > 0.005, 'the body has started leaning');
  assert.ok(Math.abs(p.tilt) < 1e-9, 'the head has not started tilting yet');
  assert.ok(Math.abs(R.act(2, keys, { alive: false }).tilt - 0.12) < 1e-9, 'and arrives');
});

test('secondary motion: hair sways after the head moves, then settles', () => {
  const keys = [[0, 'idle'], [1, 'sad']];
  assert.ok(Math.abs(R.act(1.2, keys, { alive: false }).sway) > 0.05);
  assert.ok(Math.abs(R.act(2.5, keys, { alive: false }).sway) < 1e-6);
});

test('gestures add on top and must exist', () => {
  const air = Math.min(...range(0, 1, 60).map((t) => R.act(t, [[0, 'idle']], { alive: false, gestures: [[0, 'jump']] }).bob));
  assert.ok(air < -120, `jump peak ${air}`);
  assert.equal(R.act(2, [[0, 'idle']], { alive: false, gestures: [[0, 'jump']] }).bob, 0);
  assert.throws(() => R.act(0.1, [[0, 'idle']], { gestures: [[0, 'moonwalk']] }), /unknown gesture moonwalk/);
});

test('reach IK: the wrist lands on the target (both sides), and points at one out of reach', () => {
  const ua = 120, fa = 110, x0 = 80, y0 = -500;
  const wrist = (a, el, d) => { const ex = x0 * d + d * Math.sin(a) * ua, ey = y0 + Math.cos(a) * ua; return [ex + d * Math.sin(a + el) * fa, ey + Math.cos(a + el) * fa]; };
  for (const d of [-1, 1]) for (const [tx, ty] of [[200, -420], [40, -650], [-60, -560], [150, -330]]) {
    const T = [tx * d, ty], [a, el] = R.ik(x0 * d, y0, T[0], T[1], d, ua, fa), [wx, wy] = wrist(a, el, d);
    assert.ok(Math.hypot(wx - T[0], wy - T[1]) < 0.5, `side ${d} target ${T}: wrist at ${wx.toFixed(1)},${wy.toFixed(1)}`);
    const phi = Math.atan2(d * (T[0] - x0 * d), T[1] - y0); // the other solution's shoulder is at 2·phi − a
    assert.ok(Math.cos(a) >= Math.cos(2 * phi - a) - 1e-9, 'the elbow is the lower of the two solutions');
  }
  const [a, el] = R.ik(x0, y0, x0 + 1000, y0, 1, ua, fa);
  assert.ok(Math.abs(a - Math.PI / 2) < 0.01 && Math.abs(el) < 0.1, `out of reach: a=${a} el=${el}`);
});

// ---------- drawn geometry: the real engine gfx.js + rig.js on a canvas that records where every path point lands ----------
const M = (a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) => ({ a, b, c, d, e, f,
  multiply: (n) => M(a * n.a + c * n.b, b * n.a + d * n.b, a * n.c + c * n.d, b * n.c + d * n.d, a * n.e + c * n.f + e, b * n.e + d * n.f + f),
  inverse: () => { const k = a * d - b * c; return M(d / k, -b / k, -c / k, a / k, (c * f - d * e) / k, (b * e - a * f) / k); },
  transformPoint: ({ x, y }) => ({ x: a * x + c * y + e, y: b * x + d * y + f }) });
function recorder() {
  let m = M(); const stack = [], pts = [], ells = [];
  const P = (x, y) => { const q = m.transformPoint({ x, y }); pts.push([q.x, q.y]); };
  const own = {
    save: () => stack.push(m), restore: () => { m = stack.pop(); },
    translate: (x, y) => { m = m.multiply(M(1, 0, 0, 1, x, y)); }, scale: (x, y) => { m = m.multiply(M(x, 0, 0, y)); },
    rotate: (r) => { m = m.multiply(M(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r))); },
    getTransform: () => m, moveTo: P, lineTo: P,
    quadraticCurveTo: (cx, cy, x, y) => { P(cx, cy); P(x, y); }, bezierCurveTo: (a, b, c, d, x, y) => { P(a, b); P(c, d); P(x, y); },
    arc: (x, y) => P(x, y), ellipse: (x, y, rx, ry) => { P(x, y); const q = m.transformPoint({ x, y }); ells.push({ x: q.x, y: q.y, rx: rx * Math.hypot(m.a, m.b), ry }); },
    createLinearGradient: () => ({ addColorStop() {} }), measureText: () => ({ width: 10 }),
    mark: null, count: () => pts.length, // the logging wrappers below note where the torso starts
  };
  const ctx = new Proxy(own, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) });
  return { ctx, pts, ells };
}
const gctx = { U, SCORE: { STYLE: 'flat', FORMAT: '16:9' } };
vm.createContext(gctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'examples', 'explainer-demo', 'engine', 'video', 'gfx.js'), 'utf8'), gctx);
vm.runInContext(fs.readFileSync(path.join(HERE, '..', 'kit', 'rig.js'), 'utf8'), gctx);
const RG = gctx.R, BODIES = ['chibi', 'explainer', 'brick', 'heroic', 'round'];
const NUMS = ['neck', 'torso', 'sw', 'ww', 'hw', 'ua', 'fa', 'hand', 'thigh', 'shin', 'limb', 'leg', 'foot'];
// every G.shape / G.limb call in draw order, in canvas coordinates: what was drawn over what
const TOP = '#A1B2C3', HAIR = '#5A3A2A', calls = [];
for (const k of ['shape', 'limb']) {
  const f = gctx.G[k];
  gctx.G[k] = (ctx, pts, o = {}) => {
    const m = ctx.getTransform();
    if (o.fill === TOP && ctx.mark == null) ctx.mark = ctx.count();
    calls.push({ k, pts: pts.map(([x, y]) => { const q = m.transformPoint({ x, y }); return [q.x, q.y]; }), lw: (o.lw ?? 26) * Math.hypot(m.a, m.b), fill: o.fill, color: o.color });
    return f(ctx, pts, o);
  };
}
const drawn = (o) => { calls.length = 0; const r = recorder(); RG.draw(r.ctx, { x: 600, y: 900, s: 0.5, t: 0, who: 'mali', shadow: false, ...o }); return { ...r, calls: [...calls], mark: r.ctx.mark }; };
const finite = (r) => r.pts.length > 20 && r.pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
const inside = ([x, y], poly) => { let k = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k; } return k; };

test('bodies: five, registered with positive finite proportions; removed and unknown ids are rejected', () => {
  const ids = Object.keys(RG.BODY);
  assert.deepEqual(ids, BODIES);
  for (const gone of ['stick', 'rubberhose', 'blob']) {
    assert.match(RG.check({ skin: '#FFFFFF', body: gone }).join(), new RegExp(`body: "${gone}"`));
    assert.throws(() => RG.draw(recorder().ctx, { x: 0, y: 0, body: gone }), new RegExp(`unknown body ${gone}`));
  }
  assert.equal(RG.bend, undefined, 'the rubber-hose helper is gone');
  assert.deepEqual([...RG.SPEC.body], ids);
  for (const id of ids) {
    const B = RG.BODY[id];
    for (const k of NUMS) assert.ok(Number.isFinite(B[k]) && B[k] > 0, `${id}.${k} = ${B[k]}`);
    assert.ok(B.head.length === 2 && B.head.every((v) => v > 0), `${id}.head`);
    assert.deepEqual([...RG.check({ ...RG.CAST.mali, body: id })], [], id);
  }
});

test('bodies: every pose and a walk draw finite geometry, feet on the ground line', () => {
  for (const body of Object.keys(RG.BODY)) {
    for (const [name, pose] of [...Object.entries(RG.POSES), ['walk', RG.walk(0.2)], ['act', RG.act(1.2, [[0, 'idle'], [1, 'cheer']], { seed: 2 })]]) {
      const r = drawn({ body, ...pose });
      assert.ok(finite(r), `${body} ${name}: non-finite or empty geometry`);
    }
    for (const shoeStyle of RG.SPEC.shoeStyle) { // the soles stand on the ground line: nothing below it, nothing floating
      const low = Math.max(...drawn({ body, who: { ...RG.CAST.mali, shoeStyle }, ...RG.POSES.idle }).pts.map((p) => p[1]));
      assert.ok(Math.abs(low - 900) < 1.5, `${body} ${shoeStyle}: lowest point at ${low.toFixed(1)}, the ground is 900`);
    }
  }
});

test('bodies: the eyes are drawn where R.faces (QA) and Direct.subject say they are', () => {
  for (const body of Object.keys(RG.BODY)) {
    RG.faces = [];
    const r = drawn({ body, ...RG.POSES.idle });
    const [ex, ey] = RG.faces[0].eye, eyes = r.ells.filter((e) => Math.abs(e.y - ey) < 1);
    assert.ok(eyes.some((e) => e.x < ex - 5) && eyes.some((e) => e.x > ex + 5), `${body}: no pair of eyes on the eye line y=${ey.toFixed(1)}`);
    assert.ok(RG.faces[0].top[1] < ey && ey < RG.faces[0].chin[1], `${body}: eye outside top..chin`);
  }
  RG.faces = undefined;
});

test('bodies: a reach target puts the wrist on it, on every body', () => {
  for (const body of Object.keys(RG.BODY)) {
    const B = RG.BODY[body], s = 0.5, sy = -(B.thigh + B.shin) - B.foot * 0.3 - B.torso;
    for (const [dx, dy] of [[0.6, -0.5], [0.2, 0.7]]) {
      const L = (B.ua + B.fa) * 0.5, T = [600 + (B.sw * 0.92 + dx * L) * s, 900 + (sy + 16 + dy * L) * s];
      const r = drawn({ body, ...RG.POSES.idle, reachR: T }), near = Math.min(...r.pts.map(([x, y]) => Math.hypot(x - T[0], y - T[1])));
      assert.ok(near < 1, `${body} reach ${dx},${dy}: nothing drawn within 1 px of the target (${near.toFixed(2)})`);
    }
  }
});

test('shoes: six styles, the old three keys kept, an intentional closed default, each a different shape', () => {
  assert.deepEqual([...RG.SPEC.shoeStyle], ['sneaker', 'leather', 'flipflop', 'loafer', 'boot', 'sandal']);
  const feet = (shoeStyle) => { const r = drawn({ body: 'chibi', who: { ...RG.CAST.mali, top: TOP, shoeStyle }, ...RG.POSES.idle }); return JSON.stringify(r.pts.slice(0, r.mark).map((p) => p.map(Math.round))); };
  assert.equal(feet(undefined), feet('sneaker'), 'no shoeStyle = sneaker');
  const all = RG.SPEC.shoeStyle.map(feet);
  assert.equal(new Set(all).size, all.length, 'two shoe styles draw the same thing');
  for (const st of RG.SPEC.shoeStyle) assert.deepEqual([...RG.check({ ...RG.CAST.krit, shoeStyle: st })], []);
  assert.match(RG.check({ ...RG.CAST.krit, shoeStyle: 'clog' }).join(), /shoeStyle: "clog"/);
});

test('shoes: the rounded ends of legs, trousers and socks sit inside the shoe or bare foot drawn over them', () => {
  const outfits = [{ bottomStyle: 'pants', bottom: '#223344' }, { bottomStyle: 'shorts', bottom: '#334455', socks: '#EEEEEE' }, { bottomStyle: 'skirt', bottom: '#445566' }, { bottomStyle: 'shorts', bottom: '#334455' }];
  const poses = [['idle', RG.POSES.idle], ['walk 0', RG.walk(0)], ['walk .15', RG.walk(0.15)], ['walk .3', RG.walk(0.3)], ['bent', { lHip: 0.5, lKnee: 1.0, rHip: 0.1, rKnee: 0.3 }]];
  for (const body of BODIES.filter((b) => b !== 'brick')) for (const shoeStyle of [undefined, ...RG.SPEC.shoeStyle]) for (const fit of outfits) for (const [pn, pose] of poses) {
    const who = { ...RG.CAST.mali, top: TOP, shoeStyle, ...fit }, at = `${body} ${shoeStyle} ${fit.bottomStyle}${fit.socks ? '+socks' : ''} ${pn}`;
    if (!fit.socks) delete who.socks;
    const { calls: cs } = drawn({ body, who, ...pose }), legs = cs.slice(0, cs.findIndex((c) => c.fill === TOP));
    legs.forEach((c, i) => {
      if (c.k !== 'limb' || (fit.bottomStyle === 'shorts' && c.color === fit.bottom)) return; // the shorts end at the thigh, in the open
      const [qx, qy] = c.pts[c.pts.length - 2], [ex, ey] = c.pts[c.pts.length - 1], L = Math.hypot(ex - qx, ey - qy), u = [(ex - qx) / L, (ey - qy) / L], r = c.lw / 2;
      const later = legs.slice(i + 1).filter((s) => s.k === 'shape');
      for (let th = -1; th <= 1.001; th += 0.25) { // the rounded cap, ±57° around the limb's direction
        const p = [ex + r * (Math.cos(th) * u[0] - Math.sin(th) * u[1]), ey + r * (Math.sin(th) * u[0] + Math.cos(th) * u[1])];
        assert.ok(later.some((s) => inside(p, s.pts)), `${at}: the ${c.color} end sticks out of the shoe at ${p.map((v) => v.toFixed(1))}`);
      }
    });
  }
});

test('brick: the moulded foot is joined to the leg block and stands on the ground', () => {
  for (const shoeStyle of RG.SPEC.shoeStyle) {
    const { calls: cs } = drawn({ body: 'brick', who: { ...RG.CAST.krit, top: TOP, shoeStyle }, ...RG.POSES.idle });
    const legs = cs.slice(0, cs.findIndex((c) => c.fill === TOP)).filter((c) => c.k === 'shape'), leg = legs.find((c) => c.fill === RG.CAST.krit.bottom);
    const legLow = Math.max(...leg.pts.map((p) => p[1])), feet = legs.filter((c) => c !== leg && c.fill !== RG.CAST.krit.bottom);
    assert.ok(feet.some((f) => Math.min(...f.pts.map((p) => p[1])) <= legLow + 0.5), `${shoeStyle}: a gap between the leg block and the foot`);
  }
});

test('two block: short clipped sides under a longer top, no back-hair helmet, the fringe clear of the eyes', () => {
  for (const body of BODIES.filter((b) => b !== 'brick')) {
    RG.faces = [];
    const B = RG.BODY[body], { calls: cs } = drawn({ body, who: { ...RG.CAST.krit, hair: HAIR, hairStyle: 'twoblock' }, ...RG.POSES.idle });
    const [ex, ey] = RG.faces[0].eye, s = 0.5, hy = 900 + s * (-(B.thigh + B.shin) - B.foot * 0.3 - B.torso - B.neck - B.head[1] * 0.92), rx = B.head[0] * s;
    const hair = cs.filter((c) => c.k === 'shape' && c.fill === HAIR).flatMap((c) => c.pts);
    assert.ok(hair.length > 0);
    assert.ok(hair.every(([x, y]) => y < hy || Math.abs(x - ex) <= rx * 1.04), `${body}: hair-coloured mass beside the face below the head's middle (a helmet)`);
    assert.ok(Math.max(...hair.map((p) => p[1])) < ey - B.head[0] * s * 0.17, `${body}: the fringe reaches the eyes`);
    const top = Math.min(...hair.map((p) => p[1]));
    assert.ok(hy - top > B.head[1] * s * 1.1, `${body}: no volume on top`);
  }
  RG.faces = undefined;
});

test('unchanged above the legs: upper-body geometry of every body over a pose set (shoes changed on purpose)', () => {
  const print = (body) => Math.round(['idle', 'wave', 'think', 'scared', 'cheer'].reduce((acc, k, i) => { const r = drawn({ body, who: { ...RG.CAST.mali, top: TOP }, ...RG.POSES[k], reachL: i === 2 ? [520, 640] : undefined }); return acc + r.pts.slice(r.mark).reduce((s, [x, y], j) => s + (x * 3 + y * 7) * ((j % 13) + 1), 0); }, 0));
  assert.deepEqual(Object.fromEntries(BODIES.map((b) => [b, print(b)])), UPPER);
});
test('rig lab: the body comparison pages (18, 19 s) run the real G.grade before any text; pages 0–17 never call it', () => {
  const lab = path.join(ROOT, 'examples', 'rig-lab'), c = { U, Studio: { film: (o) => { c.film = o; } } };
  vm.createContext(c);
  for (const f of ['score.js', 'engine/video/gfx.js', 'kit/art.js', 'kit/rig.js', 'kit/direct.js', 'film.js']) vm.runInContext(fs.readFileSync(path.join(lab, f), 'utf8'), c, { filename: f });
  const log = [], grade = c.G.grade;
  c.G.grade = (ctx) => { log.push('grade'); return grade(ctx); };
  c.G.makeCanvas = () => ({ getContext: () => recorder().ctx });
  const run = (t) => { log.length = 0; const { ctx } = recorder(); ctx.fillText = () => log.push('text'); c.film.draw(ctx, t); return log.join(' '); };
  for (const t of [18, 19]) assert.match(run(t), /^grade( text)+$/, `page at ${t} s`);
  for (let t = 0; t < 18; t++) assert.ok(!run(t).includes('grade'), `page at ${t} s calls G.grade`);
});

const UPPER = { chibi: 231481988, explainer: 193388329, brick: 141647248, heroic: 175141867, round: 251922257 }; // recorded before the footwear revision
