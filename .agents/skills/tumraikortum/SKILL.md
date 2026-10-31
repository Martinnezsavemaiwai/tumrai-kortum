---
name: tumraikortum
description: Make code-drawn Thai animations — 9:16 shorts for TikTok/Reels/Shorts and long 16:9 YouTube videos with chapters — in many genres (TumraiKortum horror "what would you do" stories, comedy, school life, fantasy, sci-fi, book-summary explainers, cooking, หนังตะลุง…). Every frame drawn in canvas code (anime / cartoon / chibi / explainer / shadow-puppet characters, ten drawing styles), sound synthesized (incl. Thai instruments), Thai voiceover via ElevenLabs, Thai subtitles. Use when asked to make, storyboard, render or fix an animation or episode in this repo.
---

# TumraiKortum (ทำไรก็ทำ)

A code-only animation pipeline: every frame drawn on a canvas, every sound synthesized, Thai voice from ElevenLabs. It started with Thai horror "choose your path" shorts (`halloween-ep1/` is the reference for that format) and now covers other genres (`references/genres.md`), four character bodies, ten drawing styles and long 16:9 videos. Starting points to scaffold from: `examples/explainer-demo` (9:16 short, rig + explainer kit), `examples/longform-demo` (16:9, chapters), `halloween-ep*` (paper chibi horror).

## The format (what makes an episode)

- **9:16, 90–110 s, ~20–25 shots**, one main set, second-person POV ("คุณ"). Long YouTube videos (16:9, chapters, chapter-by-chapter render): `references/long-form.md`.
- **Hook in second 0**: a red-box rule line ("อย่านับคนในรูปหมู่").
- **Everything is right except one thing** (#ทุกอย่างถูกหมดยกเว้นเรื่องเดียว): plant 2–3 visible clues the viewer can re-watch to find. Write the clue list *before* the storyboard.
- **3 hard-cut "hits"** max per episode (red-box line + boom + shake). Everything else moves by camera pans/pushes in one set — never a slideshow of unrelated stills.
- **End on a choice screen**: "ตอนที่ N: <question>?" + two buttons + "คอมเมนต์ว่าคุณเลือกทางไหน".
- Branches: each choice becomes its own episode folder (`<story>-ep2a`, `-ep2b`).

Full rules: `references/story-format.md`.

## Roles (one owner per artifact)

This skill is the whole pipeline; the role skills hold the detail of one step each, with their input, output and
validation. Load the one for the step you are on.

| step | owner | writes | checked by |
|---|---|---|---|
| 1 story | `narrative-director` | `<ep>/STORY.md` | `continuity-checker` |
| series facts | `story-memory` — **the only one that edits `stories/`**; canon only via proposals the user approves | `stories/<series>/bible.json` drafts, `proposals/` | `story.mjs check` |
| 2 storyboard, acting, camera | `storyboard-director` | `STORYBOARD.md`, `SHOTS` camera fields, acting keys | `shots.mjs`, `continuity-checker` |
| 4 characters | `character-design` | look specs (through `story-memory`), model sheets, `cast.js` | `R.check`, `visual-reviewer` |
| 9 review | — | — | `visual-reviewer` |

`continuity-checker` and `visual-reviewer` are Claude Code subagents (`.claude/agents/`): they run in a fresh
context so they judge the work as a viewer, and they only read and render — they never edit source or canon. Run
them after STORY/STORYBOARD (continuity) and before a full render (visual), and fix what they report. Agents without
subagents (Codex) follow the same files as checklists in a separate pass.

## Workflow (do the steps in order; show the user each artifact before the next)

1. **Genre + story** → pick a row from `references/genres.md` (font, sub style, look, music, SFX, transitions; don't repeat the last episode's combo), then `<episode>/STORY.md` with `**แนว:**` on top (logline, the one wrong thing, clue list, choice at the end). For a series, the facts live in `stories/<series>/bible.json`: read `story.mjs context <series> <ep>` first, add the episode's events/facts as drafts, and `story.mjs check` must pass. Never change canon yourself — write a proposal (`references/story-memory.md`).
2. **Storyboard** → `<episode>/STORYBOARD.md` shot table: time, picture/acting, shot · on · move (types ECU…EWS, moves static/push/pull/drift/pan/track — `references/directing.md`), transition, Thai VO, SFX, plus the scene sides. Most shots are static; a move needs a story reason. Approve before drawing. (Template: `references/storyboard-template.md`.)
3. **Scaffold**: `node .agents/skills/tumraikortum/scripts/new-episode.mjs <from-episode> <new-episode>` copies the engine, chibi rig, index.html and the skill's `kit/` (art + rig + explainer + style + Thai sound kit, script tags added); `setup-fonts.mjs <ep> <keys>` fetches the genre's fonts; then rewrite `score.js`, `song.js`, `film.js`.
4. **Cast + look**: pick the character body from the genre — `kit/rig.js` (`R.draw`: `anime` · `cartoon` · `chibi` · `explainer` · `puppet` หนังตะลุง; neck, elbows, hands with fingers, 15 shared poses, `R.act`, `R.walk`) or the older paper rig `chibi.js` (`K.chibi`, in the halloween episodes). Reuse `chibi.js` costumes; add new ones as data in `COSTUME`. Pick the drawing style from the genre (`STYLE` in score.js: paper flat watercolor chalk neon pixel + kit ink woodcut crayon manga). Render a model sheet and get approval for new characters. A series' characters are data in `stories/<series>/bible.json` (`look` = a rig `who`, checked by `R.check`): `story.mjs cast <series> <ep> --out <ep>/cast.js`, add `<script src="cast.js">` after `kit/rig.js`, then `R.draw(ctx, { who: 'id', … })` — never retype colours in film.js. Model sheets: `examples/rig-lab`. (`references/chibi-rig.md`)
5. **score.js** = single source of truth: `SHOTS` (start, Thai line, English, red?, and `shot on look move scene` from the storyboard; `scenes` sides; `GENRE`) — `scripts/shots.mjs <ep>` must show no errors (lines fit their shots, 180° line, pacing, storyboard ↔ score), `ev` (every hit/sound/visual event), `markers` with `sync: 'av'` for hits, `subtitles`, `soundTags`, `lightOn(t)`.
6. **Voice**: `python .agents/skills/tumraikortum/scripts/tts.py <episode>` → `<episode>/voice/<start>.mp3` (cached). Needs `ELEVENLABS_API_KEY` in `.env` — never print it, never commit it. (`references/sound.md`)
7. **song.js**: the genre's music (engine `genres.js`, or `require('./kit/thai')` for ranat/khim/khaen/pi/ching/klong/gong/temple bell in the Thai 7-tone scale, plus wind/whisper), event SFX, VO loaded from `voice/`, duck music under VO, `LUFS=-14`. Measure with `STEMS=1 node song.js` + `node engine/tools/levels.js` — you cannot hear it.
8. **film.js**: `Shots.film([...])` with `cam: Direct.cam(type, Direct.subject({ x, y, s, body }), { look, move })` per shot (`kit/direct.js`: eyes on the eye line, look room, faces above the subtitles) and the genre's transitions; subtitles via `Kit.subtitles(ctx, t, S.subtitles, { style, font, W, H })` + sound tags drawn as overlays after the shots; `Kit.glitch`/`Kit.vhs` for found-footage looks. Always `film(ctx, t); G.grade(ctx); subtitles(…)` so ink/woodcut/manga grade the picture but not the red boxes. (`references/thai-subtitles.md`)
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
- Licenses: generated ElevenLabs audio on the free plan is non-commercial. Don't pull sounds from myinstants/GIPHY/TikTok rips into videos; real recordings only from CC0 sources (Freesound CC0). Fonts: only SIL OFL ones from `setup-fonts.mjs`.

## Files

- `scripts/new-episode.mjs` — copy an episode as a starting point (skips `out/`, `voice/`).
- `scripts/story.mjs` — story memory: `check` (continuity, canon lock, continuity tests), `context` (just one scene's facts), `cast` (character looks → `cast.js` for the rig), `approve`/`lock` (user only). Tests (story + rig motion): `node --test ".agents/skills/tumraikortum/scripts/*.test.mjs"`.
- `scripts/shots.mjs` — read-only shot-list check: voice lines vs shot lengths (measured from `voice/`), 180° line, jump cuts, camera-move budget and pacing per genre, STORYBOARD.md ↔ SHOTS.
- `kit/direct.js` — `Direct.subject`, `Direct.frame` / `Direct.cam` (shot types and moves as data), `Direct.GENRES`, `Direct.lint`.
- `scripts/tts.py` — Thai VO for every shot line in an episode's `score.js` (ElevenLabs v3; `--dry` = character count before spending credits; `--voices` lists usable voices).
- `scripts/render-long.mjs` — long videos: render each chapter to `out/parts/` (resumable, `--redo id`), join, mux, SRT, YouTube chapters.
- `scripts/setup-fonts.mjs` — download Kanit + the genre's Thai fonts (all SIL OFL) into an episode's `assets/fonts/`.
- `kit/rig.js` — skeleton character rig: bodies anime / cartoon / chibi / puppet, finger hands, `R.POSES`, `R.act` (follow-through, blink-covered expression swaps, breathing/blinks per `seed`, hair sway, `gestures`), `R.walk`, `R.CAST`, `R.screen` (lit cloth for หนังตะลุง).
- `kit/chapters.js` — `Chapters.timeline/total/draw/card/progress/youtube` for long videos (node + browser).
- `kit/explainer.js` — props for สรุปหนังสือ/explainer shorts (`X.bookBadge`, `stopwatch`, `split`, `badge`, `chart`, `crowd`, `povHands`).
- `kit/art.js` — drawing styles ink · woodcut · crayon · manga (+ `G.grade`), on top of the engine's six.
- `kit/style.js` — subtitle styles (outline box pop karaoke shake glitch paper type keyword — `*word*` boxes a keyword), `Kit.font`, `Kit.glitch`, `Kit.vhs`.
- `kit/thai.js` — Thai instruments, Thai scale, gong/temple bell/wind/whisper; `node kit/thai.js out/thai-demo.wav` = demo + self-check.
- `references/` — genre menu, long-form, story format, storyboard template, chibi rig, Thai subtitles, sound, Windows notes.
