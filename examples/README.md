# Examples

Small working films to copy from. Original content, code only (MIT): renders, voice and fonts are rebuilt locally.

| folder | format | shows |
|---|---|---|
| `explainer-demo/` | 9:16, 25 s | book-summary / moral explainer: `explainer` body, `keyword` subtitles, `kit/explainer.js` props (book badge, split screen, chart, POV hands) |
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
