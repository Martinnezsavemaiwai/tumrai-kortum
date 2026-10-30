# Storyboard template

Copy into `<episode>/STORYBOARD.md`. Times are seconds; each row is one shot and one `SHOTS` entry in `score.js`.

```markdown
# EPn Storyboard: <title>

9:16 · ~1:45 · paper style · Kanit subtitles · voice in `voice/`

## Clues on screen
- shot X: …
- shot Y: …

## Shot list
| # | time | picture / acting | camera | transition | Thai VO | SFX |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:04 | … | still | (open) | … | boom |
| … |

## Sync points (markers with sync: 'av')
- shot …: <what> + <sound>
```

Transitions available in `Shots.film`: `cut`, `fade`, `dip`, `zoom`, `whip`, `push`, `wipe`, `flash`, `iris`, `irisIn`, `paper`.
Cameras: `Shots.push(z0, z1)`, `Shots.pan(x0, x1)`, `Shots.shake(amp, t0)`, `Shots.handheld(amp)`, `Shots.combine(...)`, or any `(s) => ({ x, y, zoom })`.
