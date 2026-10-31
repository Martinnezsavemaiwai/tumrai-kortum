// node --test ".agents/skills/tumraikortum/scripts/*.test.mjs"   (no dependencies; uses stories/demo-dorm9 as the fixture)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, check, stateAt, context, castJs, applyProposal, canonItems, lineage, rigCheck } from './story.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'stories', 'demo-dorm9');
const fresh = () => load(DIR);
const lock = () => JSON.parse(fs.readFileSync(path.join(DIR, 'canon.lock.json'), 'utf8'));
const errs = (b, l = lock()) => check(b, l).errors;

test('the demo series passes all continuity checks and its canon lock', () => {
  assert.deepEqual(errs(fresh()), []);
});

test('branches: ep3 follows ep2a, not ep2b', () => {
  assert.deepEqual(lineage(fresh(), 'ep3'), ['ep1', 'ep2a', 'ep3']);
  assert.deepEqual(lineage(fresh(), 'ep2b'), ['ep1', 'ep2b']);
});

test('cross-episode state: a look change carries forward only on its own branch', () => {
  const b = fresh();
  assert.equal(stateAt(b, 'ep1').look.praew.hairStyle, 'long');
  assert.equal(stateAt(b, 'ep3').look.praew.hairStyle, 'bob');
  assert.equal(stateAt(b, 'ep2b').look.praew.hairStyle, 'long');
  assert.equal(stateAt(b, 'ep3').present.jan, false);
  assert.equal(stateAt(b, 'ep2b').present.jan, true);
});

test('knowledge and belief are per branch', () => {
  const b = fresh();
  assert.equal(stateAt(b, 'ep2a', { shot: 9 }).knows.praew.f2, undefined); // not yet at shot 9
  assert.equal(stateAt(b, 'ep2a').knows.praew.f2, 'true');
  assert.equal(stateAt(b, 'ep2b').knows.praew.f2, 'false');
});

test('editing approved canon by hand is caught', () => {
  const b = fresh();
  b.facts.find((f) => f.id === 'f3').text = 'ร่มสีแดงซื้อจากเซเว่น';
  assert.match(errs(b).join('\n'), /facts\/f3 is canon and was changed outside `approve`/);
});

test('new canon without approval is caught; new draft is fine', () => {
  const b = fresh();
  b.facts.push({ id: 'f9', status: 'draft', about: [], text: 'ตลาดปิดวันจันทร์' });
  assert.deepEqual(errs(b), []);
  b.facts.at(-1).status = 'canon';
  assert.match(errs(b).join('\n'), /facts\/f9 is canon but was never approved/);
});

test('a character who left cannot appear later in the same branch', () => {
  const b = fresh();
  b.events.push({ id: 'e9', ep: 'ep3', shot: 20, who: ['jan'], text: 'ป้าจันทร์ยืนอยู่หน้าหอ' });
  assert.match(errs(b).join('\n'), /e9 \(ep3\): jan is not present/);
  b.events.at(-1).set = { jan: { present: true } }; // unless the event brings her back…
  assert.doesNotMatch(errs(b).join('\n'), /jan is not present/);
  assert.match(errs(b).join('\n'), /tests\/jan-away/); // …and then the continuity test says she is back in ep3
});

test('presence is per branch: someone gone in branch A is still around in branch B', () => {
  const b = fresh();
  b.events.push({ id: 'e9', ep: 'ep2b', shot: 20, who: ['jan'], text: 'ป้าจันทร์บ่นเรื่องร่ม' });
  assert.deepEqual(errs(b), []);
});

test('acting on a secret before learning it, or after being fooled, is caught', () => {
  const b = fresh();
  b.events.unshift({ id: 'e9', ep: 'ep2b', shot: 1, who: ['praew'], text: 'แพรวแซวภูมิเรื่องเพจ', uses: [{ who: 'praew', fact: 'f2' }] });
  assert.match(errs(b).join('\n'), /praew acts on f2 .* before learning it/);
  const b2 = fresh();
  b2.events.push({ id: 'e9', ep: 'ep2b', shot: 9, who: ['praew'], text: 'แพรวขู่ภูมิเรื่องเพจ', uses: [{ who: 'praew', fact: 'f2' }] });
  assert.match(errs(b2).join('\n'), /believes it is not true in this branch/);
});

test('undecided facts cannot be used as facts', () => {
  const b = fresh();
  b.events.push({ id: 'e9', ep: 'ep3', shot: 19, who: ['phum'], text: 'ภูมิสารภาพ', uses: [{ who: 'phum', fact: 'f4' }] });
  assert.match(errs(b).join('\n'), /uses fact f4, which is still undecided/);
});

test('a payoff on a branch that never planted the thread is caught', () => {
  const b = fresh();
  b.events.push({ id: 'e9', ep: 'ep2b', shot: 20, who: ['praew'], text: 'โน้ตเป็นลายมือป้า' });
  b.threads.find((t) => t.id === 't2').payoff = 'e9';
  assert.deepEqual(errs(b), []); // ep2b descends from ep1: fine
  b.events.unshift({ id: 'e0', ep: 'ep2b', shot: 1, who: ['praew'], text: 'โน้ตใบใหม่' });
  b.threads.find((t) => t.id === 't2').plant = 'e0';
  b.threads.find((t) => t.id === 't2').payoff = 'e8'; // e8 is in ep3 (branch A)
  assert.match(errs(b).join('\n'), /threads\/t2: payoff in ep3 is on a branch that never planted it/);
});

test('continuity tests fail when a later episode forgets the haircut', () => {
  const b = fresh();
  b.events.push({ id: 'e9', ep: 'ep3', shot: 1, who: ['praew'], text: 'แพรวผมยาวสลวย', set: { praew: { look: { hairStyle: 'long' } } } });
  assert.match(errs(b).join('\n'), /tests\/hair-cut-stays: .*praew.look.hairStyle is "long", expected "bob"/);
});

test('character looks are validated by the rig spec', () => {
  assert.deepEqual(rigCheck(fresh().characters.praew.look, 'anime'), []);
  assert.match(rigCheck({ skin: '#FFFFFF', hairStyle: 'mohawk' }, 'anime').join(), /hairStyle: "mohawk"/);
  assert.match(rigCheck({ skin: 'pink' }, 'anime').join(), /not a #rrggbb/);
  const b = fresh(); b.characters.phum.look.hat = '#000000';
  assert.match(errs(b).join('\n'), /characters\/phum: look hat: unknown field/);
});

test('context holds only the scene: its cast, their facts, the right branch', () => {
  const b = fresh();
  const ctx = context(b, 'ep2b', { who: ['praew'], shot: 6 }); // after phum's lie at shot 5
  assert.match(ctx, /ep1/);
  assert.doesNotMatch(ctx, /สะกดรอย/); // the other branch's episode
  assert.doesNotMatch(ctx, /ป้าจันทร์เคยเป็นแม่ครัว/); // a fact about someone not in the scene
  assert.match(ctx, /เชื่อผิด/); // praew's false belief is flagged
  assert.match(ctx, /hairStyle=long/);
  assert.match(context(b, 'ep3'), /hairStyle=bob/);
  assert.match(context(b, 'ep3'), /ยังไม่กำหนด[\s\S]*ใครเป็นคนเอาร่มแดงไป/);
});

test('cast.js carries the look at that episode', () => {
  const b = fresh();
  assert.match(castJs(b, 'ep3', 'demo-dorm9'), /"hairStyle": "bob"/);
  assert.match(castJs(b, 'ep2b', 'demo-dorm9'), /"hairStyle": "long"/);
});

test('a proposal changes canon and the new lock matches it', () => {
  const b = fresh();
  const p = { id: 'p1', changes: [
    { op: 'set', path: 'facts/f5/status', value: 'canon' },
    { op: 'add', path: 'events', value: { id: 'e9', ep: 'ep2a', shot: 15, who: ['praew'], text: 'แพรวพบสูตรข้าวมันไก่ของป้า' } },
  ] };
  const nb = applyProposal(b, p);
  assert.equal(nb.facts.find((f) => f.id === 'f5').status, 'canon');
  assert.deepEqual(check(nb, { items: canonItems(nb) }).errors, []);
  assert.equal(b.facts.find((f) => f.id === 'f5').status, 'draft'); // original untouched
});
