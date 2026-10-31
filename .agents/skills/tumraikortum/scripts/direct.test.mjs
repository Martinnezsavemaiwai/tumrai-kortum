// node --test ".agents/skills/tumraikortum/scripts/*.test.mjs" — framing, camera moves and the shot-list linter (kit/direct.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { storyboardStarts } from './shots.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const Direct = require(path.join(HERE, '..', 'kit', 'direct.js'));
const rig = { G: {}, U: { hash: () => 0 } };
vm.createContext(rig); vm.runInContext(fs.readFileSync(path.join(HERE, '..', 'kit', 'rig.js'), 'utf8'), rig);
const BODY = rig.R.BODY;
const FORMATS = { '9:16': [1080, 1920], '16:9': [1920, 1080] };
const near = (a, b, eps = 0.5) => Math.abs(a - b) <= eps;

test('every shot type frames every body with the eyes on the eye line and the face above the subtitle rail', () => {
  for (const [fmt, [W, H]] of Object.entries(FORMATS)) for (const body of ['anime', 'chibi', 'cartoon', 'explainer']) {
    const subj = Direct.subject({ x: 700, y: 1600, s: 0.7, body }, BODY);
    let last = Infinity;
    for (const type of Direct.TYPES) for (const look of [-1, 0, 1]) {
      const f = Direct.frame(type, subj, { W, H, look }), [ex, ey] = f.eyeScreen, at = `${fmt} ${body} ${type} look ${look}`;
      if (!['WS', 'EWS', 'ECU'].includes(type)) assert.ok(near(ey, H * (fmt === '9:16' ? 0.36 : 1 / 3)), `${at}: eyes at ${ey.toFixed(0)}`);
      assert.ok(f.chinScreen[1] < H * Direct.lines(W, H).face, `${at}: chin at ${(f.chinScreen[1] / H).toFixed(2)} H, under the subtitles`);
      assert.ok(ey > H * 0.115 && ex > 0 && ex < W, `${at}: eyes off screen or under the top bar (${ex.toFixed(0)}, ${ey.toFixed(0)})`);
      if (type !== 'ECU') assert.ok(f.toScreen(subj.x, subj.top)[1] >= -0.5, `${at}: the top of the head is cut off`);
      if (look) assert.ok(Math.sign(W / 2 - ex) === Math.sign(look), `${at}: no look room`);
      if (look === 0) { assert.ok(f.zoom < last, `${at}: zoom ${f.zoom.toFixed(2)} not wider than the type before`); last = f.zoom; }
    }
  }
});

test('a two-shot keeps both faces in the middle of the frame', () => {
  const [W, H] = FORMATS['16:9'];
  const a = Direct.subject({ x: 300, y: 1000, s: 0.6 }, BODY), b = Direct.subject({ x: 1700, y: 1000, s: 0.6 }, BODY);
  const f = Direct.frame('MS', a, { W, H, with: b });
  for (const s of [a, b]) { const [x] = f.toScreen(s.x, s.eye); assert.ok(x > W * 0.15 && x < W * 0.85, `face at x=${x.toFixed(0)}`); }
});

test('moves: push keeps the eyes put, pan lands on its target, drift is deterministic, static is static', () => {
  const [W, H] = FORMATS['9:16'], o = { W, H };
  const a = Direct.subject({ x: 400, y: 1700, s: 0.8 }, BODY), b = Direct.subject({ x: 900, y: 1700, s: 0.8 }, BODY);
  const push = Direct.cam('MCU', a, { ...o, move: 'push' });
  const f0 = push({ t: 0, u: 0 }), f1 = push({ t: 3, u: 1 });
  assert.ok(f1.zoom > f0.zoom * 1.07);
  const eyeY = (c) => (a.eye - (H / 2 + c.y)) * c.zoom + H / 2;
  assert.ok(near(eyeY(f0), eyeY(f1)), 'the eye line moved during the push');
  const pan = Direct.cam('CU', a, { ...o, move: 'pan', to: b })({ t: 2, u: 1 }), want = Direct.frame('CU', b, o);
  assert.ok(near(pan.x, want.x) && near(pan.zoom, want.zoom, 1e-9));
  const drift = Direct.cam('MS', a, { ...o, move: 'drift' });
  assert.deepEqual(drift({ t: 1.3, u: 0.4 }), drift({ t: 1.3, u: 0.4 }));
  const still = Direct.cam('MS', a, o);
  assert.deepEqual({ ...still({ t: 0, u: 0 }), toScreen: 0 }, { ...still({ t: 5, u: 1 }), toScreen: 0 });
  assert.throws(() => Direct.cam('MS', a, { move: 'dolly-zoom' }), /unknown move/);
  assert.throws(() => Direct.frame('XCU', a, o), /unknown shot type/);
});

const shot = (i, t, end, more = {}) => ({ i, t, end, th: '', ...more });

test('lint: a voice line longer than its shot is an error when measured, a warning when estimated', () => {
  const s = [shot(1, 0, 2, { th: 'คำพูดที่ยาวมากจนไม่น่าจะพูดจบในสองวินาทีแน่นอน' })];
  assert.match(Direct.lint(s, { voDur: () => 3.1 }).errors.join(), /takes 3\.1 s .* runs over the cut/);
  assert.equal(Direct.lint(s).errors.length, 0);
  assert.match(Direct.lint(s).warnings.join(), /\(estimated\)/);
  assert.deepEqual(Direct.lint([shot(1, 0, 4, { th: 'สั้น' })], { voDur: () => 1 }).warnings, []);
});

test('lint: crossing the 180° line is an error; jump cuts, size repeats and restless cameras are warnings', () => {
  const scenes = { room: { sides: { mali: 'L', krit: 'R' } } };
  const ok = [shot(1, 0, 3, { scene: 'room', on: 'mali', look: 1, shot: 'MS' }), shot(2, 3, 6, { scene: 'room', on: 'krit', look: -1, shot: 'CU' })];
  assert.deepEqual(Direct.lint(ok, { scenes }).errors, []);
  const crossed = [shot(1, 0, 3, { scene: 'room', on: 'krit', look: 1, shot: 'CU' })];
  assert.match(Direct.lint(crossed, { scenes }).errors.join(), /krit is on the right of "room" but looks right/);
  const jump = [shot(1, 0, 3, { on: 'mali', shot: 'MS' }), shot(2, 3, 6, { on: 'mali', shot: 'MS' })];
  assert.match(Direct.lint(jump).warnings.join(), /jump cut/);
  const three = [1, 2, 3].map((i) => shot(i, i * 3, i * 3 + 3, { shot: 'CU', on: `c${i}` }));
  assert.match(Direct.lint(three).warnings.join(), /third CU in a row/);
  const restless = [1, 2, 3, 4].map((i) => shot(i, i * 3, i * 3 + 3, { move: 'push' }));
  const w = Direct.lint(restless, { genre: 'comedy' }).warnings.join('\n');
  assert.match(w, /three moving cameras in a row/);
  assert.match(w, /4\/4 shots move the camera \(comedy: ≤ 30 %\)/);
  assert.match(Direct.lint([shot(1, 0, 1, { move: 'pan' })]).warnings.join(), /reads as a wobble/);
});

test('lint: pacing and hits follow the genre; the hook does not count as a hit', () => {
  const s = [shot(1, 0, 4, { red: true }), ...[2, 3, 4, 5].map((i) => shot(i, i * 4, i * 4 + 4, { red: true }))];
  assert.match(Direct.lint(s, { genre: 'horror' }).warnings.join(), /4 hard hits/);
  assert.doesNotMatch(Direct.lint(s.slice(0, 4), { genre: 'horror' }).warnings.join(), /hard hits/);
  assert.match(Direct.lint([shot(1, 0, 20, { th: 'ก' })], { genre: 'comedy' }).warnings.join(), /without a cut/);
  assert.match(Direct.lint([], { genre: 'opera' }).errors.join(), /unknown genre opera/);
});

test('storyboard rows parse into start times', () => {
  const md = '| # | เวลา |\n|---|---|\n| 1 | 0:00–0:04 | x |\n| 12 | 1:05-1:09 | y |\n| note | 0:01 |';
  assert.deepEqual([...storyboardStarts(md)], [[1, 0], [12, 65]]);
});
