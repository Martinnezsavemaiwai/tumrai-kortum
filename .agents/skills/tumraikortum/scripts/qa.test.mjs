// node --test ".agents/skills/tumraikortum/scripts/*.test.mjs" — qa.mjs finds what it claims to find.
// Unit checks run anywhere; the browser checks need Chrome (CHROME_PATH) and are skipped without it.
// Faults are planted in temporary copies of examples/dialogue-demo (the clean demo must pass with no errors).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { staticChecks, frameChecks, browserChecks } from './qa.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const DEMO = path.join(ROOT, 'examples', 'dialogue-demo');
const require = createRequire(import.meta.url);
const CHROME = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
if (CHROME) process.env.CHROME_PATH = CHROME;

// a temp copy of the demo (+ its series), with `edits` = { file: [[from, to], …] } applied
function faulty(edits) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-fault-')), ep = path.join(dir, 'ep');
  fs.cpSync(DEMO, ep, { recursive: true, filter: (s) => !/[\\/]out$/.test(s) });
  fs.cpSync(path.join(ROOT, 'stories', 'demo-dorm9'), path.join(dir, 'series', 'demo-dorm9'), { recursive: true });
  edits['score.js'] = [...(edits['score.js'] || []), ["SERIES: 'demo-dorm9'", "SERIES: '../series/demo-dorm9'"]];
  for (const [f, subs] of Object.entries(edits)) {
    const p = path.join(f.startsWith('series/') ? dir : ep, f);
    let s = fs.readFileSync(p, 'utf8');
    for (const [a, b] of subs) { assert.ok(s.includes(a), `fixture: "${a}" not in ${f}`); s = s.replace(a, b); }
    fs.writeFileSync(p, s);
  }
  return { ep, S: require(path.join(ep, 'score.js')), done: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('frame checks: faces under the subtitles, under the top bar, off screen; a look the bible does not give', () => {
  const face = (eyeY, chinY, extra = {}) => ({ who: 'praew', name: 'แพรว', alpha: 1, eye: [500, eyeY], chin: [500, chinY], top: [500, eyeY - 100], look: { hairStyle: 'bob', body: 'anime' }, ...extra });
  const f = (faces) => ({ t: 1, W: 1080, H: 1920, std: 40, faces });
  assert.match(frameChecks(f([face(1200, 1400)]), { subs: true }).errors.join(), /chin at 0\.73 H is under the subtitle rail/);
  assert.equal(frameChecks(f([face(1200, 1400)]), { subs: false }).errors.length, 0); // no subtitle at that moment: a warning
  assert.match(frameChecks(f([face(150, 300)])).warnings.join(), /under the platform's top bar/);
  assert.deepEqual(frameChecks(f([face(1200, 1400, { eye: [-300, 1200] })]), { subs: true }).errors, []); // off screen: not framed here
  const looks = { praew: { name: 'แพรว', look: { hairStyle: 'long', body: 'anime' } } };
  assert.match(frameChecks(f([face(600, 700)]), { bibleLooks: looks }).errors.join(), /praew is drawn with hairStyle="bob", the bible says "long"/);
  assert.match(frameChecks(f([face(600, 700, { who: null })]), { bibleLooks: looks }).errors.join(), /hairStyle/); // inline look, matched by name
  assert.match(frameChecks({ ...f([]), std: 1 }).warnings.join(), /flat frame/);
});

test('static checks: the clean demo passes', () => {
  const S = require(path.join(DEMO, 'score.js'));
  assert.deepEqual(staticChecks(DEMO, S).errors, []);
});

test('static checks find missing files, randomness, a stale cast.js, bible shots that do not exist, broken shot order', () => {
  const x = faulty({
    'film.js': [["assets/fonts/Kanit-Bold.ttf", 'assets/fonts/Missing.ttf'], ['const FLOOR = 1320', 'const jitter = Math.random(); const FLOOR = 1320']],
    'index.html': [['<script src="film.js">', '<script src="kit/nope.js"></script>\n<script src="film.js">']],
    'cast.js': [['"hairStyle": "bob"', '"hairStyle": "long"']],
    'series/demo-dorm9/bible.json': [['"id": "e7", "ep": "ep3", "shot": 2', '"id": "e7", "ep": "ep3", "shot": 9']],
    'score.js': [["[8, 'ความลับนี่", "[3, 'ความลับนี่"]],
  });
  try {
    const e = staticChecks(x.ep, x.S).errors.join('\n');
    for (const want of [/missing font assets\/fonts\/Missing\.ttf/, /missing script kit\/nope\.js/, /film\.js:\d+: not a pure function of t/, /cast\.js is out of date/, /bible event e7 is at shot 9/, /shot 3: starts before shot 2/]) assert.match(e, want);
  } finally { x.done(); }
});

test('browser checks: the clean demo renders with no errors, faces measured', { skip: !CHROME && 'no Chrome' }, async () => {
  const S = require(path.join(DEMO, 'score.js')), st = staticChecks(DEMO, S);
  const r = await browserChecks(DEMO, S, { bible: st.bible });
  assert.deepEqual(r.errors, []);
  assert.equal(r.frames.length, 4);
  assert.ok(r.frames.every((f) => f.faces.length === 2 && f.std > 10));
});

test('browser checks find a crash, a face under the subtitles, a wrong look, frozen characters, a frame that changes on redraw', { skip: !CHROME && 'no Chrome' }, async () => {
  const x = faulty({
    'film.js': [
      ['function corridor(ctx, t) {', "let calls = 0;\n  function corridor(ctx, t) {\n    if (t > 8 && t < 12) throw new Error('planted crash');\n    ctx.translate(Math.min(calls++, 1) * 30, 0);"],
      ['cam: Direct.cam(s.shot, subj[s.on], { look: s.look, move: s.move })', 'cam: s.i === 1 ? { zoom: 2.2, y: -520 } : Direct.cam(s.shot, subj[s.on], { look: s.look, move: s.move })'],
      ["...R.act(t, ACT[who], { seed: who === 'praew' ? 1 : 2, gestures: GEST[who] })", "...R.act(0, [[0, 'idle']], { alive: false })"],
    ],
    'cast.js': [['"hairStyle": "bob"', '"hairStyle": "long"']],
  });
  try {
    const st = staticChecks(x.ep, x.S), r = await browserChecks(x.ep, x.S, { bible: st.bible });
    const e = r.errors.join('\n'), w = r.warnings.join('\n');
    assert.match(e, /render failed at t=8\.70: Error: planted crash/);
    assert.match(e, /t=0\.70: praew's chin at .* under the subtitle rail .* while a subtitle is on screen/);
    assert.match(e, /praew is drawn with hairStyle="long", the bible says "bob"/);
    assert.match(e, /t=0\.70 draws differently the second time/);
    assert.match(w, /\(shot 4\): nothing moves/);
  } finally { x.done(); }
});
