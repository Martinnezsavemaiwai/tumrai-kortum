# TumraiKortum (ทำไรก็ทำ)

Thai interactive horror shorts for TikTok, made entirely by code: every frame is drawn on a canvas, sound effects and music are synthesized, the Thai voiceover comes from ElevenLabs, subtitles use Kanit. Each episode ends on a choice, and the next episode follows the viewers' pick.

**MVP:** EP1 *ถ้าปาร์ตี้ฮาโลวีนมีคนเกินมาหนึ่งคน* (`halloween-ep1/`).

## Use it with an agent

The pipeline is packaged as an [Agent Skill](https://agentskills.io) so Claude Code, Codex and other agents can make episodes the same way:

- Codex / standard agents: `.agents/skills/tumraikortum/SKILL.md`
- Claude Code: `.claude/skills/tumraikortum/` (points to the same skill)

Ask: *"ทำตอนใหม่ของ TumraiKortum เรื่อง …"* or *"make TumraiKortum EP2 branch A"*.

## Requirements

Node 22+, ffmpeg, Google Chrome, Python 3.10+ (for the voice script). On Windows set `CHROME_PATH` (see `.agents/skills/tumraikortum/references/windows.md`).

## Make the EP1 video yourself

```bash
cd halloween-ep1
node ../.agents/skills/tumraikortum/scripts/setup-fonts.mjs .
node song.js
node engine/render.js video
node engine/render.js mux
node engine/render.js verify
```

The voice lines are not in the repo (ElevenLabs free-plan audio). Put `ELEVENLABS_API_KEY=...` in `.env` (never commit it) and run the TTS script first.

## Layout

| path | what |
|---|---|
| `halloween-ep1/` | EP1: `score.js` (timeline), `song.js` (sound), `film.js` (shots), `chibi.js` (characters), `engine/` |
| `halloween-ep2a/` | EP2 branch A "ถอด" |
| `halloween-ep3/` | EP3 "เปิด" |
| `brand/` | channel profile picture (orange-cat mascot) |
| `.agents/skills/tumraikortum/` | the skill: workflow, references, scripts |
| `docs/` | research notes (licences, voices, skills) and the season plan |
| `halloween-script.md` | story bible and scripts for EP1/EP2 |
| `build_ep1.py`, `sfx.py`, `tts_ep1.py` | the earlier slideshow prototype (kept for reference) |

## Licence

- **Code** (scripts, the agent skill, drawing/animation/sound code): [MIT](LICENSE).
- **Content** (stories, characters, the TumraiKortum / ทำไรก็ทำ name, the orange-cat mascot, the videos): **all rights reserved**, see [LICENSE-CONTENT.md](LICENSE-CONTENT.md).
- Rendering engine in `*/engine/`: from the animation-studio plugin by Afaq Rashid, MIT (see `engine/LICENSE`); patched for Windows.
- Fonts: Kanit and the engine fonts are SIL Open Font License.
- ElevenLabs audio generated on the free plan is non-commercial and is not in this repository.
