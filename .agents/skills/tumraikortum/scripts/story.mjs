// Story memory: one bible per series (stories/<series>/bible.json), checked like code.
//   node .agents/skills/tumraikortum/scripts/story.mjs check   <series>              continuity + canon lock + continuity tests
//   node .agents/skills/tumraikortum/scripts/story.mjs context <series> <ep> [--who a,b] [--shot n]   only what this scene needs (markdown)
//   node .agents/skills/tumraikortum/scripts/story.mjs state   <series> <ep>          who is where, looks like what, knows what (JSON)
//   node .agents/skills/tumraikortum/scripts/story.mjs cast    <series> <ep> [--out <ep>/cast.js]   character looks for kit/rig.js
//   node .agents/skills/tumraikortum/scripts/story.mjs approve <series> <proposal>   apply proposals/<id>.json to canon (USER ONLY)
//   node .agents/skills/tumraikortum/scripts/story.mjs lock    <series> --yes        accept the current canon as approved (USER ONLY)
// <series> is a folder name under stories/ or a path. Schema and rules: references/story-memory.md.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RIG = path.join(HERE, '..', 'kit', 'rig.js');

// ---------- load / save ----------
export function seriesDir(s) { return fs.existsSync(path.join(s, 'bible.json')) ? s : path.join('stories', s); }
export function load(dir) { return JSON.parse(fs.readFileSync(path.join(dir, 'bible.json'), 'utf8')); }
const readLock = (dir) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'canon.lock.json'), 'utf8')); } catch { return null; } };
const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');

// ---------- episodes and branches ----------
const ep = (b, id) => b.episodes.find((e) => e.id === id);
// root … id, following `after` (a branch episode has one parent)
export function lineage(b, id) {
  const out = [];
  for (let e = ep(b, id); e; e = e.after ? ep(b, e.after) : null) { if (out.includes(e.id)) throw new Error(`episode loop at ${e.id}`); out.unshift(e.id); }
  return out;
}

// ---------- state: replay the events of a lineage ----------
// stop: { ep, shot } = stop before events of `ep` at/after `shot`; { ep, event } = stop after that event; { ep, before: true } = before ep's events
function base(b) {
  const st = { present: {}, look: {}, knows: {}, seen: [] };
  for (const [id, c] of Object.entries(b.characters)) {
    st.present[id] = c.present !== false;
    st.look[id] = { ...c.look };
    st.knows[id] = Object.fromEntries((c.knows || []).map((k) => [k.fact, k.belief || 'true']));
  }
  return st;
}
export function stateAt(b, epId, stop = {}) {
  const st = base(b);
  for (const e of eventsOf(b, epId)) {
    if (e.ep === epId && stop.before) break;
    if (e.ep === epId && stop.shot != null && e.shot != null && e.shot >= stop.shot) break;
    apply(st, e);
    st.seen.push(e.id);
    if (stop.event === e.id) break;
  }
  return st;
}
function apply(st, e) {
  for (const k of e.learn || []) st.knows[k.who][k.fact] = k.belief || 'true';
  for (const [who, s] of Object.entries(e.set || {})) {
    if ('present' in s) st.present[who] = s.present;
    if (s.look) Object.assign(st.look[who], s.look);
  }
}
// the events of a lineage, in story order (episode order, then array order)
export function eventsOf(b, epId) {
  const line = lineage(b, epId);
  return line.flatMap((id) => (b.events || []).filter((e) => e.ep === id));
}

// ---------- canon: what is approved, and its fingerprint ----------
const stable = (v) => (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',')}}` : JSON.stringify(v));
const sha = (v) => crypto.createHash('sha256').update(stable(v)).digest('hex').slice(0, 16);
export function canonItems(b) {
  const canonEp = new Set(b.episodes.filter((e) => e.status === 'canon').map((e) => e.id));
  const out = {};
  for (const e of b.episodes) if (e.status === 'canon') out[`episodes/${e.id}`] = sha(e);
  for (const [id, c] of Object.entries(b.characters)) if (c.status === 'canon') out[`characters/${id}`] = sha(c);
  for (const f of b.facts || []) if (f.status === 'canon') out[`facts/${f.id}`] = sha(f);
  for (const e of b.events || []) if (canonEp.has(e.ep)) out[`events/${e.id}`] = sha(e);
  for (const t of b.threads || []) if (t.status === 'canon') out[`threads/${t.id}`] = sha(t);
  return out;
}
function lockProblems(b, lock) {
  if (!lock) return ['no canon.lock.json: the user approves the canon once with `story.mjs lock <series> --yes`'];
  const now = canonItems(b), out = [];
  for (const [k, h] of Object.entries(now)) {
    if (!(k in lock.items)) out.push(`${k} is canon but was never approved (keep it draft, or write a proposal)`);
    else if (lock.items[k] !== h) out.push(`${k} is canon and was changed outside \`approve\` (revert it, or write a proposal)`);
  }
  for (const k of Object.keys(lock.items)) if (!(k in now)) out.push(`${k} was approved canon and is gone or no longer canon (revert it, or write a proposal)`);
  return out;
}

// ---------- character looks: validated by the rig itself (kit/rig.js R.check) ----------
let rig = null;
export function rigCheck(look, body) {
  if (!rig) {
    const ctx = { G: {}, U: { hash: () => 0 } };
    vm.createContext(ctx); vm.runInContext(fs.readFileSync(RIG, 'utf8'), ctx, { filename: RIG });
    rig = ctx.R;
  }
  return rig.check ? [...rig.check({ ...look, body })] : []; // copy: the vm's arrays are from another realm
}

// ---------- check ----------
export function check(b, lock, { strictLock = true } = {}) {
  const errors = [], warnings = [];
  const E = (m) => errors.push(m), Wn = (m) => warnings.push(m);
  const ids = (list, kind) => { const seen = new Set(); for (const x of list || []) { if (!x.id) E(`${kind}: an item has no id`); else if (seen.has(x.id)) E(`${kind}/${x.id}: duplicate id`); seen.add(x.id); } return seen; };
  const epIds = ids(b.episodes, 'episodes'), factIds = ids(b.facts, 'facts'), evIds = ids(b.events, 'events'); ids(b.threads, 'threads'); ids(b.tests, 'tests');
  const chars = new Set(Object.keys(b.characters || {}));
  const STATUS = { episodes: ['canon', 'draft'], characters: ['canon', 'draft'], facts: ['canon', 'draft', 'unknown'] };
  for (const e of b.episodes) {
    if (!STATUS.episodes.includes(e.status)) E(`episodes/${e.id}: status must be ${STATUS.episodes.join('|')}`);
    if (e.after && !epIds.has(e.after)) E(`episodes/${e.id}: after "${e.after}" is not an episode`);
    if (e.status === 'canon' && e.after && ep(b, e.after)?.status !== 'canon') E(`episodes/${e.id}: canon episode follows draft ${e.after}`);
  }
  for (const [id, c] of Object.entries(b.characters || {})) {
    if (!STATUS.characters.includes(c.status)) E(`characters/${id}: status must be canon|draft`);
    for (const p of rigCheck(c.look || {}, c.body)) E(`characters/${id}: look ${p}`);
    for (const k of c.knows || []) if (!factIds.has(k.fact)) E(`characters/${id}: knows unknown fact ${k.fact}`);
  }
  const BELIEF = ['true', 'false', 'unsure'];
  for (const f of b.facts || []) {
    if (!STATUS.facts.includes(f.status)) E(`facts/${f.id}: status must be canon|draft|unknown`);
    for (const w of f.about || []) if (!chars.has(w)) E(`facts/${f.id}: about unknown character ${w}`);
  }
  for (const e of b.events || []) {
    const at = `events/${e.id}`;
    if (!epIds.has(e.ep)) { E(`${at}: unknown episode ${e.ep}`); continue; }
    for (const w of e.who || []) if (!chars.has(w)) E(`${at}: unknown character ${w}`);
    for (const k of e.learn || []) { if (!chars.has(k.who)) E(`${at}: learn: unknown character ${k.who}`); if (!factIds.has(k.fact)) E(`${at}: learn: unknown fact ${k.fact}`); if (k.belief && !BELIEF.includes(k.belief)) E(`${at}: belief must be true|false|unsure`); }
    for (const u of e.uses || []) { if (!chars.has(u.who)) E(`${at}: uses: unknown character ${u.who}`); if (!factIds.has(u.fact)) E(`${at}: uses: unknown fact ${u.fact}`); }
    for (const [w, s] of Object.entries(e.set || {})) { if (!chars.has(w)) E(`${at}: set: unknown character ${w}`); else if (s.look) for (const p of rigCheck({ ...b.characters[w].look, ...s.look }, b.characters[w].body)) E(`${at}: set ${w}.look ${p}`); }
    const epEv = ep(b, e.ep);
    if (epEv?.status === 'canon') for (const k of e.learn || []) if (b.facts.find((f) => f.id === k.fact)?.status === 'draft') Wn(`${at}: canon episode teaches draft fact ${k.fact}`);
  }
  if (errors.length) return { errors, warnings }; // the replay below needs valid references

  // replay every leaf episode: presence, knowledge
  const leaves = b.episodes.filter((e) => !b.episodes.some((x) => x.after === e.id));
  const checked = new Set();
  for (const leaf of leaves) {
    const st = base(b);
    for (const e of eventsOf(b, leaf.id)) {
      if (!checked.has(e.id)) {
        for (const w of e.who || []) if (!st.present[w] && !(e.set?.[w]?.present)) E(`events/${e.id} (${e.ep}): ${w} is not present here (left earlier in this branch)`);
        for (const u of e.uses || []) {
          const fact = b.facts.find((f) => f.id === u.fact);
          if (fact.status === 'unknown') E(`events/${e.id} (${e.ep}): uses fact ${u.fact}, which is still undecided (status unknown)`);
          else {
            const taught = (e.learn || []).find((k) => k.who === u.who && k.fact === u.fact);
            const bel = taught ? taught.belief || 'true' : st.knows[u.who][u.fact];
            if (!bel) E(`events/${e.id} (${e.ep}): ${u.who} acts on ${u.fact} ("${fact.text}") before learning it`);
            else if (bel === 'false') E(`events/${e.id} (${e.ep}): ${u.who} acts on ${u.fact} ("${fact.text}") but believes it is not true in this branch`);
          }
        }
        checked.add(e.id);
      }
      apply(st, e);
    }
  }
  // threads: a plant must come before its payoff, in the same branch
  for (const t of b.threads || []) {
    const plant = b.events.find((e) => e.id === t.plant), pay = t.payoff && b.events.find((e) => e.id === t.payoff);
    if (!plant) { E(`threads/${t.id}: plant event ${t.plant} not found`); continue; }
    if (t.payoff && !pay) { E(`threads/${t.id}: payoff event ${t.payoff} not found`); continue; }
    if (!pay) { Wn(`threads/${t.id}: open (planted in ${plant.ep}: "${t.text}")`); continue; }
    const order = eventsOf(b, pay.ep).map((e) => e.id);
    if (!order.includes(plant.id)) E(`threads/${t.id}: payoff in ${pay.ep} is on a branch that never planted it (${plant.ep})`);
    else if (order.indexOf(plant.id) > order.indexOf(pay.id)) E(`threads/${t.id}: paid off (${pay.id}) before it is planted (${plant.id})`);
  }
  // continuity tests
  for (const t of b.tests || []) for (const p of runTest(b, t)) E(`tests/${t.id}: ${p}`);
  // canon lock
  for (const p of lockProblems(b, lock)) (strictLock ? E : Wn)(p);
  return { errors, warnings };
}

// expect keys: "<who>.present" · "<who>.look.<field>" · "<who>.knows.<fact>" (true|false|unsure|none)
export function runTest(b, t) {
  if (!ep(b, t.ep)) return [`unknown episode ${t.ep}`];
  const st = stateAt(b, t.ep, t.after ? { event: t.after } : {});
  const out = [];
  for (const [key, want] of Object.entries(t.expect)) {
    const [who, kind, field] = key.split('.');
    if (!(who in st.present)) { out.push(`${key}: unknown character`); continue; }
    const got = kind === 'present' ? st.present[who] : kind === 'look' ? st.look[who][field] : kind === 'knows' ? (st.knows[who][field] || 'none') : undefined;
    if (got === undefined && kind !== 'look') { out.push(`${key}: unknown kind (present|look|knows)`); continue; }
    if (got !== want) out.push(`at ${t.ep}${t.after ? ` after ${t.after}` : ''}: ${key} is ${JSON.stringify(got)}, expected ${JSON.stringify(want)}${t.why ? ` — ${t.why}` : ''}`);
  }
  return out;
}

// ---------- context: just what one scene needs ----------
export function context(b, epId, { who, shot } = {}) {
  const e = ep(b, epId);
  if (!e) throw new Error(`unknown episode ${epId}`);
  const line = lineage(b, epId);
  const st = stateAt(b, epId, shot != null ? { shot } : { before: true });
  const here = (b.events || []).filter((x) => x.ep === epId);
  const cast = who?.length ? who : [...new Set(here.flatMap((x) => x.who || []))].filter((w) => st.present[w] || here.some((x) => x.set?.[w]?.present));
  const fact = (id) => b.facts.find((f) => f.id === id);
  const L = [];
  L.push(`# ${b.title} · ${e.id} ${e.title || ''}${shot != null ? ` · ก่อนช็อต ${shot}` : ''}`, '');
  L.push(`แนว: ${b.genre || '-'} · สถานะตอนนี้: ${e.status}${e.status === 'canon' ? ' (canon: ห้ามแก้ ให้เขียน proposal)' : ''}`, '');
  if (line.length > 1) { L.push('## เรื่องก่อนหน้า (เฉพาะสายนี้)'); for (const id of line.slice(0, -1)) { const x = ep(b, id); L.push(`- **${id}** ${x.title || ''}: ${x.summary || ''}${x.choice ? ` → เลือก "${x.choice}"` : ''}`); } L.push(''); }
  L.push('## ตอนนี้', e.summary || '(ยังไม่มีเรื่องย่อ)', '');
  L.push('## ตัวละครในฉาก');
  for (const w of cast) {
    const c = b.characters[w];
    L.push(`### ${c.name} (\`${w}\`)${st.present[w] ? '' : ' — **ไม่อยู่ในฉากตอนนี้**'}`);
    if (c.role) L.push(`- บทบาท: ${c.role}`);
    if (c.traits?.length) L.push(`- นิสัย: ${c.traits.join(', ')}`);
    if (c.voice) L.push(`- เสียง/การพูด: ${c.voice}`);
    L.push(`- หน้าตา (${c.body || 'anime'}): ${Object.entries(st.look[w]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
    const knows = Object.entries(st.knows[w]);
    if (knows.length) L.push(`- รู้/เชื่อ: ${knows.map(([f, bel]) => `${fact(f).text}${bel === 'true' ? '' : bel === 'false' ? ' (**เชื่อผิด**: ตัวละครเชื่อว่าไม่จริง)' : ' (ไม่แน่ใจ)'}`).join(' · ')}`);
    const secrets = (b.facts || []).filter((f) => f.secret && (f.about || []).includes(w) && f.status !== 'draft');
    for (const f of secrets) { const known = cast.filter((o) => o !== w && st.knows[o][f.id] === 'true'); L.push(`- ความลับ: ${f.text} — ในฉากนี้ ${known.length ? `${known.map((o) => b.characters[o].name).join(', ')} รู้` : 'ไม่มีใครรู้'}`); }
  }
  L.push('');
  const rel = (b.facts || []).filter((f) => !f.secret && (!(f.about || []).length || f.about.some((w) => cast.includes(w))));
  const canon = rel.filter((f) => f.status === 'canon'), draft = rel.filter((f) => f.status === 'draft'), unknown = rel.filter((f) => f.status === 'unknown');
  if (canon.length) { L.push('## Canon ที่เกี่ยวข้อง (ห้ามขัด)'); for (const f of canon) L.push(`- ${f.text}`); L.push(''); }
  if (draft.length) { L.push('## Draft (ใช้ได้ แต่ยังเปลี่ยนได้)'); for (const f of draft) L.push(`- ${f.text}`); L.push(''); }
  if (unknown.length) { L.push('## ยังไม่กำหนด (ห้ามเขียนเป็นข้อเท็จจริง)'); for (const f of unknown) L.push(`- ${f.text}`); L.push(''); }
  const seen = new Set(st.seen);
  const open = (b.threads || []).filter((t) => seen.has(t.plant) && !(t.payoff && seen.has(t.payoff)));
  if (open.length) { L.push('## เส้นเรื่องที่ปูไว้และยังไม่เฉลย'); for (const t of open) L.push(`- ${t.text} (ปูใน ${b.events.find((x) => x.id === t.plant).ep})`); L.push(''); }
  const done = here.filter((x) => seen.has(x.id));
  if (done.length) { L.push('## เกิดขึ้นแล้วในตอนนี้'); for (const x of done) L.push(`- ${x.shot != null ? `ช็อต ${x.shot}: ` : ''}${x.text}`); L.push(''); }
  const planned = here.filter((x) => !seen.has(x.id));
  if (planned.length) { L.push('## เหตุการณ์ที่วางไว้แล้วในตอนนี้'); for (const x of planned) L.push(`- ${x.shot != null ? `ช็อต ${x.shot}: ` : ''}${x.text}`); L.push(''); }
  const tests = (b.tests || []).filter((t) => line.includes(t.ep));
  if (tests.length) { L.push('## Continuity tests ที่สายนี้ต้องผ่าน'); for (const t of tests) L.push(`- ${t.id}: ${Object.entries(t.expect).map(([k, v]) => `${k} = ${v}`).join(', ')}${t.why ? ` (${t.why})` : ''}`); L.push(''); }
  return L.join('\n');
}

// ---------- cast.js for kit/rig.js ----------
export function castJs(b, epId, series) {
  const st = stateAt(b, epId);
  const cast = Object.fromEntries(Object.entries(b.characters).map(([id, c]) => [id, { name: c.name, body: c.body || 'anime', ...st.look[id] }]));
  return `// generated by story.mjs cast ${series} ${epId} — edit stories/${series}/bible.json, not this file\n` +
    `(function () { Object.assign(globalThis.R.CAST, ${JSON.stringify(cast, null, 2)}); })();\n`;
}

// ---------- proposals ----------
// { id, why, changes: [{ op: 'set'|'add'|'remove', path: 'characters/praew/look/hairStyle', value }] }
// path segments walk objects by key and arrays by item id; 'add' pushes value onto the array at path
export function applyProposal(b, p) {
  const out = structuredClone(b);
  for (const c of p.changes) {
    const segs = c.path.split('/'), last = segs.pop();
    let o = out;
    for (const s of segs) { o = Array.isArray(o) ? o.find((x) => x.id === s) : o[s]; if (o == null) throw new Error(`${p.id}: no ${c.path}`); }
    if (c.op === 'add') { const arr = Array.isArray(o) ? o.find((x) => x.id === last) : (o[last] ??= []); if (!Array.isArray(arr)) throw new Error(`${p.id}: ${c.path} is not a list`); arr.push(c.value); }
    else if (c.op === 'set') { if (Array.isArray(o)) { const i = o.findIndex((x) => x.id === last); if (i < 0) throw new Error(`${p.id}: no ${c.path}`); o[i] = c.value; } else o[last] = c.value; }
    else if (c.op === 'remove') { if (Array.isArray(o)) o.splice(o.findIndex((x) => x.id === last), 1); else delete o[last]; }
    else throw new Error(`${p.id}: unknown op ${c.op}`);
  }
  return out;
}

// ---------- CLI ----------
function main(argv) {
  const [cmd, s, a3] = argv;
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  if (!cmd || !s) { console.error('usage: story.mjs check|context|state|cast|approve|lock <series> …'); return 1; }
  const dir = seriesDir(s), series = path.basename(dir), b = load(dir), lock = readLock(dir);
  if (cmd === 'check') {
    const { errors, warnings } = check(b, lock);
    const pending = fs.existsSync(path.join(dir, 'proposals')) ? fs.readdirSync(path.join(dir, 'proposals')).filter((f) => f.endsWith('.json') && !JSON.parse(fs.readFileSync(path.join(dir, 'proposals', f), 'utf8')).approved) : [];
    for (const w of warnings) console.log(`⚠ ${w}`);
    for (const p of pending) console.log(`… proposal waiting for the user: proposals/${p}`);
    for (const e of errors) console.log(`✗ ${e}`);
    console.log(errors.length ? `✗ ${errors.length} problem(s) in ${series}` : `✓ ${series}: ${b.episodes.length} episodes, ${(b.events || []).length} events, ${(b.tests || []).length} continuity tests, canon lock ok`);
    return errors.length ? 1 : 0;
  }
  if (cmd === 'context') { console.log(context(b, a3, { who: opt('--who')?.split(','), shot: opt('--shot') != null ? Number(opt('--shot')) : undefined })); return 0; }
  if (cmd === 'state') { console.log(JSON.stringify(stateAt(b, a3), null, 2)); return 0; }
  if (cmd === 'cast') { const js = castJs(b, a3, series); if (opt('--out')) { fs.writeFileSync(opt('--out'), js); console.log(`wrote ${opt('--out')}`); } else process.stdout.write(js); return 0; }
  if (cmd === 'lock') {
    if (!argv.includes('--yes')) { console.error('lock accepts the CURRENT canon as approved. Only the user runs this: add --yes'); return 1; }
    writeJson(path.join(dir, 'canon.lock.json'), { approved: new Date().toISOString().slice(0, 10), items: canonItems(b) });
    console.log(`locked ${Object.keys(canonItems(b)).length} canon items`); return 0;
  }
  if (cmd === 'approve') {
    const pf = path.join(dir, 'proposals', `${a3}.json`), p = JSON.parse(fs.readFileSync(pf, 'utf8'));
    const before = lockProblems(b, lock);
    if (before.length) { console.error(`canon was edited outside a proposal; fix that first:\n  ${before.join('\n  ')}`); return 1; }
    const nb = applyProposal(b, p), { errors } = check(nb, lock, { strictLock: false });
    if (errors.length) { console.error(`proposal ${p.id} breaks continuity:\n  ${errors.join('\n  ')}`); return 1; }
    writeJson(path.join(dir, 'bible.json'), nb);
    writeJson(path.join(dir, 'canon.lock.json'), { approved: new Date().toISOString().slice(0, 10), items: canonItems(nb) });
    writeJson(pf, { ...p, approved: new Date().toISOString().slice(0, 10) });
    console.log(`approved ${p.id}: ${p.changes.length} change(s) applied, canon re-locked`); return 0;
  }
  console.error(`unknown command ${cmd}`); return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
