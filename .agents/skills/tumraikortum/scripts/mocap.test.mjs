// node --test .agents/skills/tumraikortum/scripts/mocap.test.mjs — BVH → rig fields (mocap.mjs) and Moves.play (kit/moves.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseBVH, convert, FIELDS, readClips, writeClips } from './mocap.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..', '..', '..');
const U = createRequire(import.meta.url)(path.join(ROOT, 'examples', 'explainer-demo', 'engine', 'util.js'));
const ctx = { G: {}, U };
vm.createContext(ctx);
for (const f of ['rig.js', 'moves.js']) vm.runInContext(fs.readFileSync(path.join(HERE, '..', 'kit', f), 'utf8'), ctx);
const { R, Moves } = ctx;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// a tiny skeleton facing +z (the camera), y up: frame 0 a T-pose, frame 1 arms down, hips 0.5 leg up, leaning
const joint = (name, off, kids = '', ch = 'Zrotation Xrotation Yrotation') =>
  `JOINT ${name}\n{\nOFFSET ${off}\nCHANNELS 3 ${ch}\n${kids || 'End Site\n{\nOFFSET 0 -1 0\n}'}\n}\n`;
const arm = (s, x) => joint(`${s}Arm`, `${x} 0 0`, joint(`${s}ForeArm`, `${x * 10} 0 0`, joint(`${s}Hand`, `${x * 10} 0 0`)));
const leg = (s, x) => joint(`${s}UpLeg`, `${x} 0 0`, joint(`${s}Leg`, '0 -10 0', joint(`${s}Foot`, '0 -10 0')));
const BVH = `HIERARCHY\nROOT Hips\n{\nOFFSET 0 20 0\nCHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation\n` +
  leg('Left', 2) + leg('Right', -2) +
  joint('Spine', '0 0 0', joint('Neck', '0 10 0', joint('Head', '0 3 0') + arm('Left', 1) + arm('Right', -1))) + '}\n' +
  // channels: hips 6, then per joint 3 (LUp LLeg LFoot RUp RLeg RFoot Spine Neck Head LArm LFore LHand RArm RFore RHand)
  'MOTION\nFrames: 2\nFrame Time: 0.5\n' +
  [[0, 0, 0, 0, 0, 0], ...Array(15).fill([0, 0, 0])].flat().join(' ') + '\n' +
  [[0, 10, 0, 0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [-20, 0, 0], [0, 0, 0], [0, 0, 0],
    [-90, 0, 0], [0, 0, 0], [0, 0, 0], [90, 0, 0], [0, 0, 0], [0, 0, 0]].flat().join(' ') + '\n';

test('BVH → fields: T-pose arms out, arms down, a jump (bob) and a lean, on the right sides', () => {
  const b = parseBVH(BVH);
  assert.equal(b.frames, 2);
  const c = convert(b, { to: 0.5 }), F = (i, k) => c.frames[Math.min(i, c.frames.length - 1)][FIELDS.indexOf(k)];
  // frame 0: both arms straight out to their own side, legs straight down
  for (const k of ['lSh', 'rSh']) assert.ok(Math.abs(F(0, k) - Math.PI / 2) < 0.01, `${k} ${F(0, k)}`);
  for (const k of ['lEl', 'rEl', 'lHip', 'rHip', 'lKnee', 'rKnee', 'lean', 'bob']) assert.ok(Math.abs(F(0, k)) < 0.01, `${k} ${F(0, k)}`);
  // last frame (0.5 s): arms hang (shoulder angle near 0; held back by MAX_TURN, so check the trend), body up half a leg, leaning
  const last = c.frames.length - 1;
  assert.ok(F(last, 'lSh') < F(0, 'lSh') - 0.5 && F(last, 'rSh') < F(0, 'rSh') - 0.5, 'arms come down');
  assert.ok(Math.abs(F(last, 'bob') + 0.5) < 0.01, `bob ${F(last, 'bob')} (up = negative, in leg lengths)`);
  assert.ok(Math.abs(F(last, 'lean')) > 0.2, `lean ${F(last, 'lean')}`);
  // mirrored: the same clip with the sides swapped and the lean reversed
  const m = convert(b, { to: 0.5, mirror: true });
  assert.ok(Math.abs(m.frames[last][FIELDS.indexOf('lean')] + F(last, 'lean')) < 1e-3);
});

test('moves.js round-trips through the CLIPS block', () => {
  const src = fs.readFileSync(path.join(HERE, '..', 'kit', 'moves.js'), 'utf8'), clips = readClips(src);
  assert.deepEqual(readClips(writeClips(src, clips)), clips);
  assert.deepEqual(Object.keys(clips).sort(), [...Moves.names()].sort());
});

test('every bundled clip: complete frames, and no pops (a flipped bone would jump by ~π in one frame)', () => {
  for (const [name, c] of Object.entries(Moves.clips)) {
    assert.ok(c.frames.length > c.fps, `${name} is under a second`);
    c.frames.forEach((f, i) => {
      assert.equal(f.length, FIELDS.length, `${name} frame ${i}`);
      assert.ok(f.every(Number.isFinite), `${name} frame ${i} has a non-number`);
      if (i) f.forEach((v, j) => { if (j < 10) assert.ok(Math.abs(wrap(v - c.frames[i - 1][j])) < 1.7, `${name} ${FIELDS[j]} jumps at frame ${i}`); });
    });
    assert.ok(/^CMU \d+_\d+$/.test(c.source) && c.to > c.from, `${name}: source/range for --rebuild`);
  }
});

test('Moves.play fades in from the base pose and back out, with no pops, and is the base outside the clip', () => {
  const base = R.act(0, [[0, 'think']], { alive: false }), dur = Moves.duration('jump');
  assert.deepEqual(Moves.play(-0.1, 'jump', { base }).lSh, base.lSh);
  assert.equal(Moves.play(dur + 0.1, 'jump', { base }).rEl, base.rEl);
  assert.equal(Moves.play(0.5, 'jump', { base }).eyes, base.eyes, 'face comes from the base');
  let prev = null;
  for (let t = -0.2; t < dur + 0.2; t += 1 / 240) {
    const p = Moves.play(t, 'jump', { base, body: 'chibi' });
    if (prev) for (const k of FIELDS) assert.ok(Math.abs(k === 'bob' || k === 'dx' ? p[k] - prev[k] : wrap(p[k] - prev[k])) < (k === 'bob' || k === 'dx' ? 12 : 0.2), `${k} pops at t=${t.toFixed(3)}`);
    prev = p;
  }
  assert.throws(() => Moves.play(0, 'moonwalk'), /unknown move moonwalk/);
  assert.throws(() => Moves.play(0, 'jump', { body: 'robot' }), /unknown body robot/);
  // loop wraps without a gap; hold keeps the last frame
  assert.ok(Math.abs(wrap(Moves.play(dur * 3 + 0.01, 'jacks', { loop: true }).lSh - Moves.play(dur * 3 - 0.01, 'jacks', { loop: true }).lSh)) < 0.5);
  assert.deepEqual(Moves.play(dur + 5, 'jump', { hold: true }).lSh, Moves.play(dur, 'jump', { hold: true }).lSh);
});
