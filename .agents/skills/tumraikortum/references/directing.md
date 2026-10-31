# Directing: script → shot list → camera (`kit/direct.js`, `scripts/shots.mjs`)

The pipeline: **STORY.md** (what happens) → **scene breakdown** (where, who, which side of the room each person is on)
→ **STORYBOARD.md** shot list (one row per shot, with a shot type, a subject and a move from the vocabulary below) →
**score.js `SHOTS`** (the same rows as data) → **film.js** (`cam: Direct.cam(...)`) → render. `shots.mjs` checks the
middle three agree and make sense *before* anything is drawn.

## Vocabulary (use these words in the storyboard's camera column)

| type | frame | use it for |
|---|---|---|
| `ECU` | eyes to chin fill the short side | the realisation, the clue in someone's face — rare, it's loud |
| `CU` | head + shoulders | emotion, a line that matters |
| `MCU` | to mid-chest | most dialogue |
| `MS` | to the waist | hands + face: acting, holding props |
| `MLS` | to the knees | body language, two people talking |
| `FS` | the whole figure, feet on the floor | entrances, physical comedy |
| `WS` | figure ≈ ½ frame height | where we are, who is in the room |
| `EWS` | figure ≈ ⅕ frame height | the world is big, the person is small |

Moves: `static` (default — most shots) · `push` / `pull` (×1.08 on the eyes over the shot: a realisation, tension rising /
releasing) · `drift` (handheld breathing: unease, POV) · `pan` (`to:` another subject: a reveal, following a look) ·
`track` (subject is a function of t: following a walk). Shakes stay `Shots.shake`, combined on a hit.
**A move needs a reason in the story**; if you can't name it, the shot is static.

`Direct.frame` keeps the eyes on the eye line (⅓ from the top; 0.36 H in 9:16, under the platform bar), gives look
room on the side the subject looks to, keeps the head top in frame from CU outward, and never lets a chin fall
under the subtitles (9:16: H·0.70, 16:9: H·⅔). Wide shots in 9:16 stand the figure at H·0.66 so the floor, not the
face, sits under the subtitle rail. A close type is sized on the frame's short side, so a CU is the same face size in
9:16 and 16:9. A two-shot (`with:`) keeps both faces in the middle 62 %: characters standing far apart can't get
tighter than a medium two-shot — block them closer. Two bodies of very different heights share no eye line.

```js
// film.js (index.html loads kit/direct.js after kit/rig.js)
const mali = Direct.subject({ x: 400, y: FLOOR, s: 0.8, body: 'anime' }); // the same x, y, s you give R.draw
{ at: at(5), draw: room, cam: Direct.cam('MCU', mali, { look: 1 }) },
{ at: at(6), draw: room, cam: Direct.cam('CU', mali, { look: 1, move: 'push' }) },
{ at: at(7), draw: room, cam: Shots.combine(Direct.cam('WS', mali), Shots.shake(14, at(7))) },
{ at: at(8), draw: room, cam: Direct.cam('MS', mali, { move: 'pan', to: krit }) },
```

## score.js: SHOTS with camera data (all optional — the checker uses what is there)

```js
const scenes = { room: { sides: { mali: 'L', krit: 'R' } } }; // who stands on which side of the 180° line
// SHOTS rows gain: shot (type), on (subject), look (−1 left / 1 right), move, in (transition), scene
{ t: 12, th: '…', shot: 'MCU', on: 'mali', look: 1, move: 'static', scene: 'room' }
module.exports = { …, SHOTS, scenes, GENRE: 'comedy' };
```

## The checker

```
node .agents/skills/tumraikortum/scripts/shots.mjs <episode> [--genre horror|comedy|drama|fantasy|adventure|slice|explainer]
```

- **Dialogue**: each voice line (measured from `voice/<start>.mp3`, else estimated at 11 Thai characters/s + 0.4 s —
  the measured rate of the channel's ElevenLabs voices) plus `VO_LAG` must end before its cut; a measured overrun is an error.
- **Screen direction**: someone on the left of a scene looks right (and the other way round), or it crosses the line.
- **Cutting**: same subject + same size on a plain cut = jump cut; three of the same size in a row; a move on a shot
  under 1.5 s reads as a wobble; three moving cameras in a row.
- **Genre pacing** (`Direct.GENRES`, starting points): average shot length, longest shot, seconds without a cut,
  share of moving shots, hard hits after the hook.
- **Storyboard ↔ score**: shot start times in STORYBOARD.md rows must match SHOTS.

| genre | avg shot | moving ≤ | hits ≤ | feel |
|---|---|---|---|---|
| horror | 3–6 s | 60 % | 3 | slow pushes and stillness; hard cuts only on the hits; hold on empty space |
| comedy | 1.8–4 s | 30 % | 8 | static frames so the acting reads; cut on the reaction; whip/zoom on the punchline |
| drama | 4–8 s | 50 % | 2 | CU for emotion, hold the reaction, slow pushes into realisations |
| fantasy | 3–6 s | 60 % | 4 | EWS to sell the world, pans across it; CU for the wonder |
| adventure | 2–5 s | 65 % | 5 | track the movement, keep screen direction (left → right = forward) |
| slice of life | 3–7 s | 30 % | 2 | quiet static frames, MS/MLS, drift at most |
| explainer | 3–6 s | 50 % | 4 | one idea per shot; push to the key word; cut on each new point |

Test scene: `examples/rig-lab` pages at 16 s (9:16) and 17 s (16:9) draw every type of one stage with the
subtitle rail and the face limit.
