---
name: character-design
description: Design a new TumraiKortum character or change one's look as data — body, palette, hair, outfit as a kit/rig.js `who` spec validated by R.check — render a model sheet for approval, and keep looks consistent across episodes through the series bible and cast.js. Use when adding a character, restyling one, or when a character looks different between episodes.
---

# character-design — specs, model sheets, consistent looks

For a series, the bible holds each character’s look and every episode draws from its generated `cast.js`.

## Input

- Episode story, a representative scene, and existing series cast when applicable.

## Output

- Episode character brief with sourced references, a validated cast spec (body plus palette, hair and outfit fields from `R.SPEC`), a model sheet and a short acting sample.

## Workflow

1. Start from STORY.md and the scene. Write a short brief covering role, age, temperament, period, place, daily routine and what the character does on camera. For a series, read the existing cast and facts first through `story-memory`.
2. Gather sourced references for the details that matter in this setting, such as clothes, hair, work gear and how they are worn. List the sources in the episode brief. Label acting ideas inferred from the brief separately from reference findings. Use `.agents/skills/tumraikortum/references/genres.md` as a starting point for choosing body and drawing style.
3. Build a `who` spec with the existing rig and validate it with `R.check`. Use the bodies, faces and poses pages in `examples/rig-lab` as a reference. Make a scratch copy outside the repo with `node .agents/skills/tumraikortum/scripts/new-episode.mjs examples/rig-lab <scratch>`, which refreshes `kit/`. Register the spec in the scratch `cast.js`. In the scratch `film.js`, add the new ID and body to the page 0 (bodies) and page 5 (faces) rows (page 0 fits five figures, page 5 four rows; replace an entry when full). Narrow the page 6 line-up to the series cast plus the new ID, since entries past the fifth fall off-screen. From the scratch folder, render `node engine/render.js stills 0 5 6 --draft`. Rendering needs Chrome (found automatically; custom installs set `CHROME_PATH`, see `.agents/skills/tumraikortum/references/windows.md`) and `ffmpeg` on `PATH`; there is no npm install. Page 6 draws every `R.CAST` entry in the chibi body. `render.js cast` draws the engine's `Ch` characters, not rig specs. Check silhouette against the rest of the cast and readability at the intended shot size. If the direction is undecided, compare two looks for the same character in the same shot.
4. In the scratch copy, stage a few seconds of a story beat in `film.js` and render it with `node engine/render.js clip <from> <to> --draft`. Run `node song.js` first to write `out/music.wav`, or the clip has no sound. Pick posture, pace, gestures and reaction timing for this character and inspect the clip at playback speed. If a rig limit obscures a story beat, show it and propose the smallest change that makes the action readable. Keep shot-specific adjustments in the episode and consider shared kit changes when another use warrants them.
5. Show the sheet and acting sample for approval before producing scenes. Record the selected look and acting notes in the episode brief. For a series, record the approved look through `story-memory` as a draft, or propose a change to existing canon. For an in-story change such as a haircut, record a `set.<who>.look` event.
6. Draw by ID with `R.draw(ctx, { who: '<id>', … })`. Keep character colours in the cast spec and draw without inline colour overrides. For standalone episodes, register specs with `Object.assign(globalThis.R.CAST, { id: spec })` in `cast.js`. For a series, run `story.mjs check`, then generate it with `story.mjs cast <series> <ep> --out <ep>/cast.js`. Load `cast.js` after `kit/rig.js`.

## Validation criteria

- `R.check` passes and the user approves the model sheet and acting sample before scene production.
- In `film.js`, each character uses its cast ID and cast colours.
- For a series, `story.mjs check` passes and each look change the story relies on has a continuity test.
