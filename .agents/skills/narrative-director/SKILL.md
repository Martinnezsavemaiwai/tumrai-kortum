---
name: narrative-director
description: Plot and script a TumraiKortum episode in any genre — logline, beats, the one wrong thing and its clues, the ending choice, Thai VO lines — as <episode>/STORY.md, consistent with the series bible. Use when asked to write, plot or rewrite a story or a script before any storyboard or drawing.
---

# narrative-director — STORY.md

## Input
- Genre row (`.agents/skills/tumraikortum/references/genres.md`), format (9:16 short / 16:9 long), series + parent episode if it continues one.
- The scene slice from `story-memory` (`story.mjs context <series> <ep>`), never the whole bible or old scripts.

## Output
- `<episode>/STORY.md` only: `**แนว:**` line, logline, beats with rough times, the one wrong thing + 2–3 clues (each with the shot/moment it appears), red herring, ending choice, VO lines in Thai.
- A short list for `story-memory`: new facts (draft/unknown), who learns what, look/presence changes, threads planted/paid.

## Workflow
1. Read the context slice. Note the canon you must not contradict, the open threads, and what each character does *not* know.
2. Pick the shape: horror/mystery → `.agents/skills/tumraikortum/references/story-format.md` (hook at 0 s, ≤ 3 hits, choice ending); other genres → the genre row's beat pattern; long videos → `.agents/skills/tumraikortum/references/long-form.md` chapters.
3. Write the clue list before the beats. Every clue must be visible on a phone (text ≥ 32 px, held ≥ 1.5 s).
4. Write VO lines short: ≈ 11 Thai characters per second of shot (the measured voice rate), no line across a hit.
5. Show the user STORY.md; after approval hand the fact list to `story-memory`.

## Validation criteria
- No line or beat contradicts the canon in the context slice; no character acts on a fact they have not learned (or believe false).
- Undecided mysteries stay undecided (`unknown`), not quietly answered.
- Original story and characters (never reuse `halloween-*` stories or characters in new work — `LICENSE-CONTENT.md`).
- The user approved it before storyboarding.
