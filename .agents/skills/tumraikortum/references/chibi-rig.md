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

Ideas to grow the rig (not built yet): mouth shapes for lip-sync (`Subs.mouth`), hand-held props as parts, elbows.

## Later paper-rig additions (local `yai-ep1/chibi.js` only, not in the repo — new work: use `kit/rig.js` below, which has all of this)

- More `eyes`: `shock` (white eyes, trembling pin pupils), `sly`, `angry`. More `mouth`: `scream`, `wavy` (nervous), `smirk`, `grin` (+ `teeth: 'betel' | 'white'`).
- `tilt`: head tilt in radians round the neck. `fx`: manga marks over the head — `sweat`, `tears`, `blush`, `shock`, `anger`, `gloom`.
- `K.POSES`: idle happy wave cheer point shrug think scared startle sad angry sneaky creepy (option sets; `wiggle` adds a small loop).
- `K.act(t, [[t0, 'idle'], [t1, 'startle'], …])` → options with anticipation (squash 0.12 s before a change), an outBack move (0.35 s) and a hold. Keys can be pose names or objects (`{ ...K.POSES.point, look: -1 }`). Use: `K.chibi(ctx, { x, y, who, t, ...K.act(t, keys) })`, times from `score.js`.
- Arms are drawn behind the head: past ~2.5 rad the hands vanish behind it.

# Skeleton rig (`kit/rig.js`) — anime, cartoon, chibi, หนังตะลุง

`R.draw(ctx, { x, y, s, body, who, t, ...R.act(t, keys) })` draws one figure, feet at (x, y), 1000 px tall at
`s: 1`. One skeleton for every body, so poses and acting carry across:

| body | look | notes |
|---|---|---|
| `anime` | 1:6.5, pointed chin, big glossy irises with two highlights, bangs + side locks | faces are small in full-body shots: frame waist-up (s 1.8–3) for dialogue. Best with `flat` / `watercolor` |
| `cartoon` | big round head, tall white eyes, rubber-hose ink limbs, white 4-finger gloves, big shoes | comedy, kids, sports. `flat` / `crayon` |
| `chibi` | big head, but a neck, elbows and 5-finger hands | cute/comedy/cooking. Any style |
| `explainer` | ~1:4.5, round head, small dot eyes, soft one-light shading, optional `glasses` (frame colour) and `jacket` | สรุปหนังสือ / explainer shorts; `flat`. Pairs with `X.povHands` |
| `puppet` | หนังตะลุง: profile silhouette, perforated leather, pinned joints, rods to the hands, `facing: ±1` | draw `R.screen(ctx, W, H)` behind; `flat` style. Crown (`crown: true`) for heroes, `belly` + hooked `nose` for clowns |

- `who`: a `R.CAST` key or an object `{ skin, hair, hairStyle: 'long'|'short'|'spiky'|'twintail'|'bald', eye, top, collar, tie, bottom, bottomStyle: 'pants'|'skirt', shoes, old }` (puppets: `skin top bottom crown belly nose`).
- Joints (radians): `lSh rSh` (0 hanging, + out/up), `lEl rEl` (+ further out, − folds toward the face; ≈ −3.3 with a shoulder ≈ 1 brings the hand to the cheek), `lHip rHip lKnee rKnee`, `lean`, `tilt`, `bob`, `sx sy`.
- Face: `eyes` normal happy closed wide shock angry sad sly · `mouth` smile open o grin frown wavy smirk scream flat · `talk` 0–1 · `look lookY` · `blink`.
- Hands: `handL handR` = open fist point peace thumb relax. `fx`: sweat blush tears anger shock sparkle.
- `R.POSES`: idle happy wave cheer point peace thumbsup shrug think scared startle sad angry sneaky talk. `R.act(t, keys)` = anticipation dip → outBack move → hold (`talk` flaps the mouth). `R.walk(t)` adds a step cycle.
- Check a new character or pose on a model sheet (render stills, tile, look) before using it in shots — e.g. a film whose `draw` for `t < 0` lays out every pose of one body in a grid, rendered with `render.js stills -1`. `examples/longform-demo/` uses `explainer` and `anime` bodies with `R.act` and `R.walk`.
