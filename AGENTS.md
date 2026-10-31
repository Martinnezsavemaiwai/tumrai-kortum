# Agent notes

This repo is a code-only animation studio for Thai videos (shorts 9:16 and long 16:9 videos, many genres).
For any animation work, load the skill at `.agents/skills/tumraikortum/SKILL.md` and follow its workflow.

- Start a new film by scaffolding: `node .agents/skills/tumraikortum/scripts/new-episode.mjs <from> <new>`,
  where `<from>` is `examples/explainer-demo` (9:16 short), `examples/longform-demo` (16:9 with chapters) or a
  `halloween-ep*` episode (paper chibi horror). It copies the engine and the skill's `kit/`.
- Pick the genre, character body and drawing style from `references/genres.md` before writing the story.
- Check your work by rendering stills (`node engine/render.js stills <t…>`) and looking at them before a full render.
- `halloween-ep*`, `halloween-script.md`: the channel's own episodes, all rights reserved (`LICENSE-CONTENT.md`).
  Read them as reference; don't reuse their stories or characters in new work.
- Never print or commit `.env` (ElevenLabs key). Check `python scripts/tts.py <ep> --dry` before spending credits.
- Renders (`out/`), generated voice (`voice/`) and downloaded fonts (`assets/fonts/`) are not committed.
- Don't commit, push, merge or switch branches unless the user asks.
