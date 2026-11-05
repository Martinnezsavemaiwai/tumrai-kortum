// node --test .agents/skills/tumraikortum/scripts/lipsync.test.mjs — kit/lipsync.js mouth tracks + Kit.talk.
// Builds a temp episode (the demo engine + kit/lipsync.js) with ffmpeg-made "voice" lines: a tone = speech.
// Skipped without ffmpeg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..', '..', '..', '..');
const require = createRequire(import.meta.url);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const hasFF = spawnSync(FFMPEG, ['-version'], { stdio: 'ignore' }).status === 0;

test('mouth tracks: each character moves only on its own lines, shut in silence; lines without an mp3 are skipped', { skip: !hasFF && 'no ffmpeg' }, () => {
  const ep = fs.mkdtempSync(path.join(os.tmpdir(), 'lipsync-'));
  try {
    fs.cpSync(path.join(ROOT, 'examples', 'explainer-demo', 'engine'), path.join(ep, 'engine'), { recursive: true });
    fs.mkdirSync(path.join(ep, 'kit')); fs.mkdirSync(path.join(ep, 'voice'));
    fs.copyFileSync(path.join(HERE, '..', 'kit', 'lipsync.js'), path.join(ep, 'kit', 'lipsync.js'));
    // 1 s of tone = a spoken line
    for (const n of ['001', '004']) {
      const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=1', path.join(ep, 'voice', `${n}.mp3`)]);
      assert.equal(r.status, 0, String(r.stderr));
    }
    const L = require(path.join(ep, 'kit', 'lipsync.js'));
    const shots = [{ t: 1, th: 'ก', who: 'nok' }, { t: 4, th: 'ข', who: 'ton' }, { t: 6.6, th: 'ค', who: 'nok' }, { t: 2.5, th: '' }];
    const m = L.write(ep, shots, { lag: 0.3, length: 8 });
    assert.deepEqual(Object.keys(m.who).sort(), ['nok', 'ton']);
    assert.ok(fs.existsSync(path.join(ep, 'out', 'mouth.json')));
    const at = (who, t) => m.who[who].open[Math.round(t * m.fps)];
    assert.ok(at('nok', 1.8) > 0.5 && at('ton', 4.8) > 0.5, 'open while speaking');
    assert.ok(at('nok', 4.8) < 0.05 && at('ton', 1.8) < 0.05, 'shut on the other character\'s line');
    assert.ok(at('nok', 3) < 0.05 && at('nok', 7) < 0.05, 'shut in silence, and on the line with no mp3 (6.6 s)');
    assert.equal(L.file('/ep', 20.5), path.join('/ep', 'voice', '021.mp3'), 'tts.py rounds half up');
  } finally { fs.rmSync(ep, { recursive: true, force: true }); }
});

test('Kit.talk: interpolates the track, 0 outside it or for a character without one', () => {
  const U = require(path.join(ROOT, 'examples', 'explainer-demo', 'engine', 'util.js'));
  const ctx = { U, G: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(HERE, '..', 'kit', 'style.js'), 'utf8'), ctx);
  const mouth = { fps: 10, who: { nok: { open: [0, 1, 0.5], wide: [0.5, 0.5, 0.5] } } };
  assert.equal(ctx.Kit.talk(mouth, 'nok', 0.05), 0.5);
  assert.equal(ctx.Kit.talk(mouth, 'nok', 0.15), 0.75);
  assert.equal(ctx.Kit.talk(mouth, 'nok', 5), 0);
  assert.equal(ctx.Kit.talk(mouth, 'nok', -1), 0);
  assert.equal(ctx.Kit.talk(mouth, 'ton', 0.1), 0);
  assert.equal(ctx.Kit.talk(null, 'nok', 0.1), 0);
});
