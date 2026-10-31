# Examples

Small working films to copy from. Original content, code only (MIT): renders, voice and fonts are rebuilt locally.

| folder | format | shows |
|---|---|---|
| `explainer-demo/` | 9:16, 25 s | book-summary / moral explainer: `explainer` body, `keyword` subtitles, `kit/explainer.js` props (book badge, split screen, chart, POV hands) |
| `rig-lab/` | 16:9 test scene | not a film: one model-sheet page per second of `kit/rig.js` (bodies, poses, faces, hair styles, idle, the `stories/demo-dorm9` cast via `cast.js`; 10–12 s motion: onion skin, per-frame motion graph, pose changes; 16–17 s `Direct` shot types in 9:16 and 16:9). After changing the kit: `cp ../../.agents/skills/tumraikortum/kit/{rig,direct}.js kit/` then `node engine/render.js stills 0 1 2 3 4 5 6 7 8 9 10 11 16 17` and compare |
| `dialogue-demo/` | 9:16, 16 s | the QA target: four shots of `stories/demo-dorm9` ep3 — cast from the bible (`cast.js`), every camera `Direct.cam` from SHOTS data, `R.act` acting with seeds and gestures; picture only. `node ../../.agents/skills/tumraikortum/scripts/qa.mjs .` must pass |
| `longform-demo/` | 16:9, 80 s | long video: `kit/chapters.js` (title cards, progress bar, per-chapter scenes on local time), `R.walk` with a parallax park, end-screen slots, `render-long.mjs` |

```bash
cd examples/explainer-demo
node ../../.agents/skills/tumraikortum/scripts/setup-fonts.mjs .
node song.js
node engine/render.js stills 2.5 14 18.5
node engine/render.js video && node engine/render.js mux
```

Long demo: `node ../../.agents/skills/tumraikortum/scripts/render-long.mjs .` from `examples/longform-demo`.
Neither has a voiceover (they show the picture and sound side); add one with `scripts/tts.py` and `SHOTS` in
`score.js` as in the skill's workflow.
