# Chibi rig (`chibi.js`)

`K.chibi(ctx, o)` draws one character with feet at `(o.x, o.y)`; `K.sheet(ctx, o)` draws the floating white sheet. All shapes go through `G.*` so they boil and hatch in the paper style.

## Options

| option | meaning |
|---|---|
| `who` | costume key in `COSTUME` (`you`, `phrai`, `nak`, `pob`, `krasue`, `krahang`, `tani`, `pret`) |
| `s`, `sx`, `sy`, `rot` | scale, squash/stretch, tilt |
| `eyes` | `normal` · `wide` · `worried` · `closed` · `happy` · `glow` |
| `look`, `lookY` | gaze −1…1 |
| `blink` | 0…1 |
| `mouth` | `flat` · `o` · `smile` · `frown` · `none` |
| `armL`, `armR` | arm angle in radians from hanging (+ = up/out) |
| `phone` | both hands hold a phone |
| `walk` | leg cycle phase (radians); combine with an x that moves |
| `back` | seen from behind (head = hair) |
| `bob` | body bob in px |

## Adding a costume

Add a data entry to `COSTUME` — colours plus flags the drawing code already understands: `longHair`, `bun`, `flower`, `topknot`, `messy`, `mask`, `hood`, `cloak`, `organs`, `wings`, `leaf`, `loin`, `robe`, `stilts`, `longNeck`, `longArms`, `tinyMouth`, `skin`. Only write new drawing code for a genuinely new silhouette, and test it on the model sheet (render a still grid, tile it, look at it) before using it in shots.

## Acting (pose-library idea, written for this rig)

Act in **anticipation → action → hold → settle**. Don't animate every part all the time: holds make acting readable. Per character per shot, return overrides from the `group(ctx, t, act)` callback, e.g. `{ eyes: 'wide', look: 1 }`; drive all timing from `score.js` events.

Ideas to grow the rig (not built yet): separate pupils, mouth shapes for lip-sync (`Subs.mouth`), head tilt pivot, hand-held props as parts.
