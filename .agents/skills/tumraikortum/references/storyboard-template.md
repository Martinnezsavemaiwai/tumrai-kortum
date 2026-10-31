# Storyboard template

Copy into `<episode>/STORYBOARD.md`. Times are seconds; each row is one shot and one `SHOTS` entry in `score.js`.

```markdown
# EPn Storyboard: <title>

9:16 · ~1:45 · paper style · Kanit subtitles · voice in `voice/`

## Clues on screen
- shot X: …
- shot Y: …

## Shot list
| # | time | picture / acting | shot · on · move | transition | Thai VO | SFX |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:04 | … | CU · mali · static | (open) | … | boom |
| … |

## Scenes (who stands where: the 180° line)
- room: mali L · krit R

## Sync points (markers with sync: 'av')
- shot …: <what> + <sound>
```

Transitions available in `Shots.film`: `cut`, `fade`, `dip`, `zoom`, `whip`, `push`, `wipe`, `flash`, `iris`, `irisIn`, `paper`.
Shot types (`ECU CU MCU MS MLS FS WS EWS`) and moves (`static push pull drift pan track`): `references/directing.md` — write them in the camera column, copy them into `SHOTS`, check with `scripts/shots.mjs`, draw with `Direct.cam`.
Low-level cameras: `Shots.push(z0, z1)`, `Shots.pan(x0, x1)`, `Shots.shake(amp, t0)`, `Shots.handheld(amp)`, `Shots.combine(...)`, or any `(s) => ({ x, y, zoom })`.
