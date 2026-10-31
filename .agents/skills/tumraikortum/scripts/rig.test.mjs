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
