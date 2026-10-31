---
name: storyboard-director
description: Turn an approved STORY.md into a shot list and its animation timeline — scene breakdown with who stands where, STORYBOARD.md rows with shot type / subject / camera move / transition / VO / SFX, the same rows as score.js SHOTS data, and per-shot acting keys (R.act poses, gestures, seeds) — then check it with shots.mjs. Use for storyboarding, blocking, camera and acting direction, and pacing fixes.
---

# storyboard-director — script → scene breakdown → shot list → timeline

Also covers animation direction (acting): one plan for camera and performance, so they are cut to the same beats.

## Input
- Approved `<episode>/STORY.md`, the genre (`Direct.GENRES` key), format, and the `story-memory` context slice for each scene.

## Output
- `<episode>/STORYBOARD.md` from `.agents/skills/tumraikortum/references/storyboard-template.md`: scene sides, shot rows (`shot · on · move` in the camera column), clue shots, sync points.
- `score.js` `SHOTS` rows with `t, th, en, red, shot, on, look, move, in, scene`, plus `scenes` (sides) and `GENRE`.
- An acting table per shot for film.js: `R.act(t, keys, { seed, gestures })` keys (pose names from `R.POSES`, gestures `jump nod shake shiver`), one `seed` per character.

## Workflow
1. Scene breakdown: list scenes (place + time), who is in each and which side of the 180° line they stand on (`scenes.<id>.sides`).
2. Shot list: one row per beat. Default `static`; a `push`/`pull`/`pan`/`drift` only with a reason you can say in a few words (write it in the picture column). Vary sizes; cut on reactions; use the genre's transitions (`.agents/skills/tumraikortum/references/directing.md`).
3. Acting: a key per change of thought, ≥ 0.35 s apart; reactions start on the cut or just after the line; big moves get an anticipation (built into `R.act`); a gesture for a punchline or a shock.
4. Copy the rows into `score.js` SHOTS, then `node .agents/skills/tumraikortum/scripts/shots.mjs <episode>` (after `tts.py`, it measures the real voice lines).
5. Fix every ✗, judge every ⚠ (keep it only with a reason), show the user the table before anything is drawn.
6. Hand the events and shot numbers to `story-memory`.

## Validation criteria
- `shots.mjs` prints `✓ no errors`; STORYBOARD.md and SHOTS agree on every start time.
- Each moving camera has a written reason; nobody crosses the 180° line without a shown camera move; the opening hook and ≤ the genre's hits.
- Every clue from STORY.md has a shot that holds it ≥ 1.5 s.
- The user approved the storyboard.
