---
name: character-design
description: Design a new TumraiKortum character or change one's look as data — body, palette, hair, outfit as a kit/rig.js `who` spec validated by R.check — render a model sheet for approval, and keep looks consistent across episodes through the series bible and cast.js. Use when adding a character, restyling one, or when a character looks different between episodes.
---

# character-design — specs, model sheets, consistent looks

Also covers character consistency: one spec per character in the bible, and every episode draws from `cast.js`.

## Input
- The role (from STORY.md): age, personality, what the silhouette must say; the genre's body and drawing style (`.agents/skills/tumraikortum/references/genres.md`); the existing cast of the series (`story.mjs state`).

## Output
- A `look` spec (`R.SPEC` fields: `skin hair eye top collar bottom shoes tie jacket glasses accent`, `hairStyle`, `bottomStyle`, flags) plus `body`, handed to `story-memory` as a draft character (or a proposal if the character is canon).
- A model sheet from `examples/rig-lab` (bodies/faces/poses pages) with the new spec, shown to the user.
- `<episode>/cast.js` from `story.mjs cast <series> <ep> --out <episode>/cast.js`, loaded after `kit/rig.js`.

## Workflow
1. Silhouette first: hair style + body + one accent colour must tell this character from every other one in the cast at thumbnail size.
2. Palette: 3–4 colours, one that nobody else in the series wears; skin and hair from the existing cast's range so they live in the same world.
3. Write the spec; `R.check(spec)` (or `story.mjs check`) must return no problems.
4. Render the model sheet: put the spec in `examples/rig-lab/cast.js` (or a series cast.js), `node engine/render.js stills 0 1 5 6` in `examples/rig-lab`, look at it, fix, then show the user.
5. After approval: record it through `story-memory`; for a change that happens *in the story* (a haircut), add an event with `set.<who>.look` instead of editing the base look.
6. In film.js draw with `R.draw(ctx, { who: '<id>', … })` only — never retype colours.

## Validation criteria
- `story.mjs check` passes (looks are validated by the rig itself).
- A continuity test exists for every look change the story relies on.
- film.js passes every series character to `R.draw` as `who: '<id>'` (backgrounds may have colours; characters may not have an inline `who: { skin: … }`).
- The user approved the model sheet.
