---
name: story-memory
description: Keep a TumraiKortum series' story bible (stories/<series>/bible.json) — fetch the facts one scene needs, record a new episode's events/facts/characters as drafts, write proposals to change canon, and run the continuity check. The ONLY skill that edits stories/. Use when asked what happened before, what a character knows, to add an episode to a series, or to change something established.
---

# story-memory — the series bible keeper

Single source of truth for every series: `stories/<series>/bible.json` (schema and rules: `.agents/skills/tumraikortum/references/story-memory.md`).
Other skills and agents read it through this skill's commands; only this skill's steps write to `stories/`.

## Input
- A series id (folder under `stories/`) and an episode id; for writes, the approved STORY.md / STORYBOARD.md of that episode.

## Output
- Reads: `story.mjs context <series> <ep> [--who a,b] [--shot n]` (markdown slice for one scene) or `state` (JSON).
- Writes: `draft` items in `bible.json`; `proposals/<id>.json` for anything canon; `<ep>/cast.js` via `story.mjs cast`.
- Never: `canon.lock.json`, `status: "canon"`, `story.mjs approve` / `lock` — those are the user's.

## Workflow
1. Before anyone writes a scene: `node .agents/skills/tumraikortum/scripts/story.mjs context <series> <ep> --shot <n> --who <ids>` and pass only that text on.
2. After STORY.md is approved: add the episode (`after` = parent episode, `status: "draft"`), its facts (`canon`-looking ideas go in as `draft`; undecided mysteries as `unknown`), new characters as `draft` (look from `character-design`).
3. After STORYBOARD.md is approved: add one event per story beat with its `shot` number — `who`, `learn` (with `belief: "false"` when someone is fooled), `uses` (acting on a fact), `set` (presence or look changes), plus `threads` for each clue planted/paid off, and a `tests[]` entry for every fact the twist depends on.
4. To change anything canon (a released episode, an approved fact or look): write `proposals/<id>.json` with `why` and the smallest `changes`, then ask the user to run `story.mjs approve <series> <id>`.
5. `node .agents/skills/tumraikortum/scripts/story.mjs check <series>` — fix every ✗ before handing over.

## Validation criteria
- `story.mjs check <series>` prints ✓ (warnings for open threads are fine; list them for the user).
- `git diff stories/` touches no item that `canon.lock.json` lists, unless through an approved proposal.
- Every new event has `ep` and `shot`; every clue in STORY.md has a thread; the twist has at least one continuity test.
