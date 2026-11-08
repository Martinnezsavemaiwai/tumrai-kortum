# Storyboard template

Copy into `<episode>/STORYBOARD.md`. Times are seconds; each row is one shot and one `SHOTS` entry in `score.js`.

```markdown
# EPn Storyboard: <title>

9:16 · ~1:45 · paper style · Kanit subtitles · voice in `voice/`

## Clues on screen
- shot X: …
- shot Y: …

## Shot list
| # | time | picture / acting | shot · on · move | transition | Thai VO (tag · take · speed) | SFX |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:04 | … | CU · mali · static | (open) | … ([whispers] · creative · 0.85) | boom · the rule lands · 0.1 s after VO ends |
| 2 | 0:04–0:09 | … | MS · krit · static | cut | … | — (quiet: let the line land) |
| … |

## Sound plan (from STORY.md's Sound intent)
- music: enters … · drops out … (voice-only / quiet) … · ends …
- foreground: voice, except …
- avoid: …

## Scenes (who stands where: the 180° line)
- room: mali L · krit R

## Sync points (markers with sync: 'av')
- shot …: <what> + <sound>
```

SFX cell: cue · purpose · timing (tail clear of the next line), or `—` for a chosen quiet; decoration is optional (`references/sound.md` → Sound intent).
Transitions available in `Shots.film`: `cut`, `fade`, `dip`, `zoom`, `whip`, `push`, `wipe`, `flash`, `iris`, `irisIn`, `paper`.
Shot types (`ECU CU MCU MS MLS FS WS EWS`) and moves (`static push pull drift pan track`): `references/directing.md` — write them in the camera column, copy them into `SHOTS`, check with `scripts/shots.mjs`, draw with `Direct.cam`.
Low-level cameras: `Shots.push(z0, z1)`, `Shots.pan(x0, x1)`, `Shots.shake(amp, t0)`, `Shots.handheld(amp)`, `Shots.combine(...)`, or any `(s) => ({ x, y, zoom })`.
