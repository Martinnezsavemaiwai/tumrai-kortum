// node --test .agents/skills/tumraikortum/scripts/reference.test.mjs — parsing in reference.mjs (no video needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cuts, shots, silences } from './reference.mjs';

test('cuts from showinfo: in order, flash frames closer than 0.2 s merged', () => {
  const log = '[Parsed_showinfo_1] n:0 pts:1 pts_time:2.5 ...\n... pts_time:2.6 ...\n... pts_time:7.04 ...';
  assert.deepEqual(cuts(log), [2.5, 7.04]);
});

test('shots cover the whole video; cuts at the very ends are ignored', () => {
  const s = shots([0.01, 2.5, 7.04, 9.98], 10);
  assert.deepEqual(s.map((x) => [x.t, x.end]), [[0, 2.5], [2.5, 7.04], [7.04, 10]]);
  assert.equal(s.reduce((a, x) => a + x.len, 0).toFixed(2), '10.00');
});

test('silences pair starts with ends; one running to the end has no end', () => {
  const log = 'silence_start: 1.2\nsilence_end: 1.9 | silence_duration: 0.7\nsilence_start: 9.5\n';
  assert.deepEqual(silences(log), [[1.2, 1.9], [9.5, null]]);
});
