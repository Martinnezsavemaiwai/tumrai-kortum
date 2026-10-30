# Thai subtitles

- Font: **Kanit** 700 (Thai lines), 500 (English, labels). `scripts/setup-fonts.mjs` downloads it (SIL OFL) into `assets/fonts/`; load with `Studio.loadFont('Kanit', 'assets/fonts/Kanit-Bold.ttf', 700)` in `init`.
- Draw with Canvas (`ctx.font = '700 84px Kanit'`, `strokeText` 16 px black then `fillText` white). Chrome shapes Thai correctly.
- If you ever render subtitles through libass/ASS instead: **Spacing must be 0** in every style, or stacked tone marks (ที่, ตอนที่) disappear; use `shaping=complex`.
- Line breaks: Thai has no spaces between words — break by hand with `\n` in `SHOTS` at a word boundary; ≤ ~16 characters per line, max 2 lines.
- Rail position: baseline at `H*0.75`, English 70 px below. Keep faces above `H*0.70` by staging the set high (floor at `H*0.48`).
- Key lines (≤ 3 per episode): white text on a red rounded box, pop in with `ease.outBack`; normal lines fade in.
- Sound tags for muted viewers: italic Kanit 500, yellow, at `G.SAFE.y + 60`.
- Platform UI covers the top 11.5 %, bottom 22 %, right 140 px — no text there.
