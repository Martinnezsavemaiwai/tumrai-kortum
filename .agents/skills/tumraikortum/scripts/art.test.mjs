// node --test ".agents/skills/tumraikortum/scripts/*.test.mjs" — kit/art.js registers every style it lists, each with a
// drawing handler (a style without one silently falls back to the engine's plain shapes). The look itself is checked by eye.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ART = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'kit', 'art.js');

test('every art.js style is registered and draws through its own handler', () => {
  const src = fs.readFileSync(ART, 'utf8'), calls = [];
  const G = { STYLES: {}, C: { ink: '#000' }, style: {}, setStyle() {}, shape() { calls.push('engine'); }, line() {}, limb() {}, path() {}, hatch() {}, bbox: () => [0, 0, 10, 10], wobble: (p) => p };
  const ctx = { G, U: { hash: () => 0.5, pickStyle: (d) => d } };
  vm.createContext(ctx); vm.runInContext(src, ctx, { filename: ART });
  const listed = [...src.matchAll(/^\/\/ {3}([a-z0-9]+) +\S/gm)].map((m) => m[1]); // the header list
  assert.deepEqual(listed, ['woodcut', 'crayon', 'manga', 'comic', 'riso', 'papercut', 'pixelart', 'retro', 'diorama', 'clay', 'lowpoly', 'bricks', 'early3d']);
  const fake = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => ({ addColorStop() {} })), set: (o, k, v) => ((o[k] = v), true) }); // any 2D-context call is a no-op
  for (const name of listed) {
    assert.equal(G.STYLES[name]?.art, name, `${name}: not in G.STYLES`);
    G.style = G.STYLES[name]; calls.length = 0;
    G.shape(fake, [[0, 0], [10, 0], [10, 10]], { fill: '#336699' });
    assert.deepEqual(calls, [], `${name}: fell back to the engine's shape`);
  }
});
