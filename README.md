# TumraiKortum (ทำไรก็ทำ) — an animation studio in code

Make Thai animated videos with an AI agent, with no drawing app and no stock assets: every frame is drawn on a
canvas in JavaScript, every sound and note is synthesized, the Thai voiceover comes from ElevenLabs and the
subtitles are Thai fonts. Short vertical clips (9:16, TikTok / Reels / Shorts) and long YouTube videos (16:9,
with chapters).

What you can make:

- **Genres** — horror "what would you do" stories (the channel's TumraiKortum format), Thai folk ghosts, urban
  legends, puzzles, comedy, school life / romance, fantasy, sci-fi, sports, cooking, language lessons,
  bedtime facts, diaries, book-summary explainers, หนังตะลุง comedy… (`.agents/skills/tumraikortum/references/genres.md`)
- **Characters** — one skeleton (neck, elbows, knees, hands with fingers, 15 poses, acting with anticipation)
  in five bodies: `anime`, `cartoon`, `chibi`, `explainer`, `puppet` (หนังตะลุง); plus the older paper chibi rig.
- **Drawing styles** — paper, flat, watercolor, chalk, neon, pixel, ink, woodcut, crayon, manga.
- **Sound** — drones, strings, music box, lo-fi / chiptune / orchestral / EDM packs, Thai instruments in the
  Thai 7-tone scale (ระนาด ขิม แคน ปี่ ฉิ่ง กลองทัด ฆ้อง ระฆัง), SFX, mixing to −14 LUFS.
- **Text** — 9 subtitle styles (incl. keyword highlight, karaoke, glitch, torn paper), 10 Thai OFL fonts.
- **Long videos** — chapters with title cards and a progress bar, chapter-by-chapter rendering you can resume,
  SRT/VTT captions and YouTube chapter lines.

## Use it with an agent

The whole workflow is an [Agent Skill](https://agentskills.io), so Claude Code, Codex and other agents work the
same way:

- canonical copy: `.agents/skills/tumraikortum/SKILL.md` (workflow, scripts, references, `kit/`)
- Claude Code: `.claude/skills/tumraikortum/` points to it
- `AGENTS.md`: the short rules every agent follows here

Ask in Thai or English, e.g. *"ทำคลิปสั้นแนวตลกชีวิตประจำวัน ตัวละครการ์ตูน"*, *"ทำคลิปยาว 5 นาที สรุปข้อคิด 3 ข้อ"*,
*"ทำ TumraiKortum ตอนใหม่เรื่อง …"*.

## Requirements

Node 22+, ffmpeg (+ ffprobe), Google Chrome, Python 3.10+ (voice script). Windows: set `CHROME_PATH`
(`.agents/skills/tumraikortum/references/windows.md`). Voice: `ELEVENLABS_API_KEY=…` in `.env` (never commit it).

## Try an example

```bash
cd examples/explainer-demo
node ../../.agents/skills/tumraikortum/scripts/setup-fonts.mjs .
node song.js
node engine/render.js stills 2.5 14 18.5     # a few frames → out/stills/
node engine/render.js video && node engine/render.js mux
```

Long video: `examples/longform-demo` with `node ../../.agents/skills/tumraikortum/scripts/render-long.mjs .`

Start your own: `node .agents/skills/tumraikortum/scripts/new-episode.mjs examples/explainer-demo my-episode`.

## Layout

| path | what |
|---|---|
| `.agents/skills/tumraikortum/` | the skill: `SKILL.md`, `scripts/` (scaffold, fonts, voice, long render), `kit/` (rig, art styles, subtitles, Thai sound, explainer props, chapters), `references/` |
| `examples/` | small working films to copy from (original content, code only) |
| `halloween-ep1/`, `halloween-ep2a/`, `halloween-ep3/` | the channel's season 1 episodes (in progress) |
| `halloween-script.md` | season 1 story bible |
| `*/engine/` | the renderer each film carries (canvas + headless Chrome + ffmpeg) |

Renders (`out/`), generated voice (`voice/`) and downloaded fonts (`assets/fonts/`) are not committed.

## Licence

- **Code** (scripts, the skill, the kit, drawing/animation/sound code, `examples/`): [MIT](LICENSE).
- **Content** (the TumraiKortum episodes, stories, characters, channel name, videos): **all rights reserved**,
  see [LICENSE-CONTENT.md](LICENSE-CONTENT.md).
- Engine in `*/engine/`: the animation-studio engine by Afaq Rashid, MIT (see `engine/LICENSE`); patched here.
- Fonts: SIL Open Font License. ElevenLabs audio on the free plan is non-commercial and is not in this repo.
