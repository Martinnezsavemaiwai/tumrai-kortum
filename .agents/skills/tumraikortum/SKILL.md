---
name: tumraikortum
description: Make Thai interactive horror shorts for TikTok/Reels/Shorts (9:16) in the TumraiKortum format — a "what would you do" POV story where everything is right except one thing, ending on a choice screen (e.g. "คุณจะถอดหน้ากากไหม?"). Every frame is drawn in code (paper-style chibi characters, one set, moving camera), sound effects and music are synthesized in code, Thai voiceover comes from ElevenLabs (or a local Thai TTS), Thai subtitles use Kanit. Use when asked to make a new TumraiKortum episode, continue an episode branch, write a story/storyboard in this format, or render/fix one of these videos.
---

# TumraiKortum (ทำไรก็ทำ)

A pipeline for short Thai horror "choose your path" animations. Episode 1 (`halloween-ep1/`) is the reference implementation — copy its patterns, don't reinvent them.

## The format (what makes an episode)

- **9:16, 90–110 s, ~20–25 shots**, one main set, second-person POV ("คุณ").
- **Hook in second 0**: a red-box rule line ("อย่านับคนในรูปหมู่").
- **Everything is right except one thing** (#ทุกอย่างถูกหมดยกเว้นเรื่องเดียว): plant 2–3 visible clues the viewer can re-watch to find. Write the clue list *before* the storyboard.
- **3 hard-cut "hits"** max per episode (red-box line + boom + shake). Everything else moves by camera pans/pushes in one set — never a slideshow of unrelated stills.
- **End on a choice screen**: "ตอนที่ N: <question>?" + two buttons + "คอมเมนต์ว่าคุณเลือกทางไหน".
- Branches: each choice becomes its own episode folder (`<story>-ep2a`, `-ep2b`).

Full rules: `references/story-format.md`.

## Workflow (do the steps in order; show the user each artifact before the next)

1. **Story + clues** → `<episode>/STORY.md` (logline, the one wrong thing, clue list, choice at the end).
2. **Storyboard** → `<episode>/STORYBOARD.md` shot table: time, picture/acting, camera, transition, Thai VO, SFX. Approve before drawing. (Template: `references/storyboard-template.md`.)
3. **Scaffold**: `node .agents/skills/tumraikortum/scripts/new-episode.mjs <from-episode> <new-episode>` copies the engine, chibi rig, fonts setup and index.html; then rewrite `score.js`, `song.js`, `film.js`.
4. **Cast**: reuse `chibi.js` costumes; add new ones as data in `COSTUME`. Render a model sheet and get approval for new characters. (`references/chibi-rig.md`)
5. **score.js** = single source of truth: `SHOTS` (start, Thai line, English, red?), `ev` (every hit/sound/visual event), `markers` with `sync: 'av'` for hits, `subtitles`, `soundTags`, `lightOn(t)`.
6. **Voice**: `python .agents/skills/tumraikortum/scripts/tts.py <episode>` → `<episode>/voice/<start>.mp3` (cached). Needs `ELEVENLABS_API_KEY` in `.env` — never print it, never commit it. (`references/sound.md`)
7. **song.js**: drone/strings bed, event SFX, VO loaded from `voice/`, duck music under VO, `LUFS=-14`. Measure with `STEMS=1 node song.js` + `node engine/tools/levels.js` — you cannot hear it.
8. **film.js**: `Shots.film([...])` with camera functions; subtitles + sound tags drawn as overlays after the shots. (`references/thai-subtitles.md`)
9. **Review**: draft stills of every shot (`render.js stills <t…> --draft`), tile them, critique (faces under subtitles? clue visible? clutter?), fix, repeat.
10. **Render**: `node song.js` → `node engine/render.js video` (background; minutes) → `mux` → `verify` (all ✓) → `check`.
11. **Cover**: `cover(ctx)` for `t < 0`, rendered with `render.js stills -1` — opening rule + opening picture only, no spoilers (`references/story-format.md`).
12. **Post kit**: write `<episode>/POST.md` — caption, hashtags, pinned comment, AI-label + voice credit (`references/post-template.md`). No spoilers.
13. **Deliver**: path, duration, size, verify table, and say plainly that audio was measured, not listened to.

## Hard-won rules

- **Windows**: set `CHROME_PATH` for every render command (`references/windows.md`). Never kill Chrome processes you did not launch.
- **Thai text**: Canvas `fillText` with `font: '700 84px Kanit'` shapes Thai correctly. In libass/ASS, **letter-spacing must be 0** or stacked tone marks (ที่) vanish.
- **No `ctx.filter = 'blur()'` on full frames** — minutes per frame. Draw to a 1/8-size canvas and scale up.
- **A hit never lands on a spoken word**: put the hit 0.1 s after a VO line ends, or move the line.
- **A picture hit must change most of the frame** (cut, flash, pale burst): a small shake is reported `?` by `verify`.
- **Silences end exactly on the next hit** (`MIX.gate(mix, a, nextHit)`), or `verify` sees the bed coming back as the onset.
- Faces stay above `H*0.70`; subtitle rail baseline at `H*0.75`; platform UI covers the top 11.5 % and bottom 22 %.
- Determinism: no `Math.random`/`Date.now` in film/score/song; use `U.hash`.
- Licenses: generated ElevenLabs audio on the free plan is non-commercial. Don't pull sounds from myinstants/GIPHY into videos. See `docs/research-*.md`.

## Files

- `scripts/new-episode.mjs` — copy an episode as a starting point (skips `out/`, `voice/`).
- `scripts/tts.py` — Thai VO for every shot line in an episode's `score.js` (ElevenLabs v3; `--voices` lists usable voices).
- `scripts/setup-fonts.mjs` — download Kanit (SIL OFL) into an episode's `assets/fonts/`.
- `references/` — story format, storyboard template, chibi rig, Thai subtitles, sound, Windows notes.
