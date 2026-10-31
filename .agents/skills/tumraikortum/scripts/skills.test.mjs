// node --test ".agents/skills/tumraikortum/scripts/*.test.mjs" — the agent skills and subagents stay well-formed:
// frontmatter, Input/Output/Workflow/Validation sections, .claude pointers in sync, reviewers read-only, paths real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const front = (md) => Object.fromEntries((/^---\n([\s\S]*?)\n---/.exec(md.replace(/\r/g, ''))?.[1] || '').split('\n').filter((l) => /^\w+:/.test(l)).map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()]));
const SKILLS = fs.readdirSync(path.join(ROOT, '.agents', 'skills'));
const ROLES = SKILLS.filter((s) => s !== 'tumraikortum');
const AGENTS = fs.readdirSync(path.join(ROOT, '.claude', 'agents')).filter((f) => f.endsWith('.md'));

test('every role skill has a name, a trigger description and Input / Output / Workflow / Validation criteria', () => {
  assert.deepEqual(ROLES.sort(), ['character-design', 'narrative-director', 'story-memory', 'storyboard-director']);
  for (const s of ROLES) {
    const md = read(`.agents/skills/${s}/SKILL.md`), f = front(md);
    assert.equal(f.name, s);
    assert.ok(f.description && /Use (when|for|after)/.test(f.description), `${s}: description must say when to use it`);
    for (const h of ['## Input', '## Output', '## Workflow', '## Validation criteria']) assert.ok(md.includes(h), `${s}: missing ${h}`);
  }
});

test('each shared skill has a Claude Code pointer with the same name and description', () => {
  for (const s of SKILLS) {
    const a = front(read(`.agents/skills/${s}/SKILL.md`)), p = read(`.claude/skills/${s}/SKILL.md`), b = front(p);
    assert.equal(b.name, a.name); assert.equal(b.description, a.description, `${s}: pointer description out of date`);
    assert.ok(p.includes(`.agents/skills/${s}/SKILL.md`));
  }
});

test('reviewer subagents cannot edit: no write tools, and they say so', () => {
  assert.deepEqual(AGENTS.sort(), ['continuity-checker.md', 'visual-reviewer.md']);
  for (const a of AGENTS) {
    const md = read(`.claude/agents/${a}`), f = front(md);
    assert.equal(f.name, a.replace(/\.md$/, ''));
    const tools = (f.tools || '').split(',').map((t) => t.trim());
    assert.ok(tools.length && !tools.some((t) => ['Edit', 'Write', 'NotebookEdit', 'MultiEdit'].includes(t)), `${a}: tools ${f.tools}`);
    for (const h of ['## Input', '## Workflow', '## Output']) assert.ok(md.includes(h), `${a}: missing ${h}`);
    assert.match(md, /[Nn]ever (edit|run `story\.mjs approve`)/);
  }
});

test('one owner for the bible: only story-memory writes stories/, and approve/lock stay with the user', () => {
  assert.match(read('.agents/skills/story-memory/SKILL.md'), /The ONLY skill that edits stories\//);
  assert.match(read('.agents/skills/tumraikortum/SKILL.md'), /the only one that edits `stories\/`/);
  for (const s of [...ROLES.map((r) => `.agents/skills/${r}/SKILL.md`), ...AGENTS.map((a) => `.claude/agents/${a}`)]) {
    const md = read(s);
    for (const line of md.split('\n')) if (/story\.mjs (approve|lock)/.test(line)) assert.match(line, /[Nn]ever|user/, `${s}: "${line.trim()}" must leave approve/lock to the user`);
  }
});

test('every repo path a skill or subagent names exists', () => {
  const files = [...SKILLS.map((s) => `.agents/skills/${s}/SKILL.md`), ...AGENTS.map((a) => `.claude/agents/${a}`), 'AGENTS.md'];
  for (const f of files) for (const [, p] of read(f).matchAll(/`((?:\.agents|\.claude|examples|stories|docs)\/[^`\s<>*]+?)`/g)) {
    const clean = p.replace(/[),.:]+$/, '');
    assert.ok(fs.existsSync(path.join(ROOT, clean)), `${f}: ${clean} does not exist`);
  }
});
