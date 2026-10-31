# Long videos (YouTube, 3–15 min)

Same pipeline as the shorts; three things change: the frame is 16:9, the film is a list of **chapters**, and it is
rendered **chapter by chapter**. `examples/longform-demo/` is a working example (80 s, 3 chapters).

## Structure

| part | length | what happens |
|---|---|---|
| intro (`card: false`) | 8–20 s | the hook: the question or promise of the video, then a one-line map ("วันนี้มี 3 ข้อ") |
| chapters | 45–120 s each | one idea per chapter; it opens on a title card (`Chapters.card`), ends on a small payoff |
| outro (`card: false`) | 8–15 s | recap in one line + two end-screen slots (YouTube end screens cover the last 5–20 s) |

- Re-hook every ~60 s: a question, a reveal, a new place, a new character. Long videos lose people in the middles.
- One genre per video, from `genres.md`. Horror long-form = several choices in one video, or one story with
  chapters as acts; non-horror = list videos, explainers, a story in parts.
- Chapters are scenes in `film.js` on their **local** clock (`scenes.c1(ctx, t, c)` with t = 0 at the chapter's
  start), so a chapter can be lengthened or moved without touching the others.

## score.js

```js
const Chapters = node ? require('./kit/chapters') : globalThis.Chapters;
const FORMAT = U.pickFormat('16:9');
const chapters = Chapters.timeline([
  { id: 'intro', title: 'เปิดเรื่อง', dur: 12, card: false, lines: [[0.4, 4.6, 'วันที่ดี ไม่ต้องเริ่มจาก*เรื่องใหญ่*', '…']] },
  { id: 'c1', title: 'น้ำแก้วแรก', dur: 60, lines: [...] },   // lines on LOCAL time
  …
]);
const DURATION = Chapters.total(chapters);
const subtitles = chapters.flatMap((c) => (c.lines || []).map(([a, b, text, en]) => ({ t: c.start + a, end: c.start + b, text, en })));
```

`new-episode.mjs` puts `kit/chapters.js` before `score.js` in index.html, so this works in the browser too.
Voice lines (`SHOTS` for `tts.py`) follow the same rule: absolute times, one line per second at most (voice
files are named by the rounded second; `tts.py` refuses two lines in the same second).

## film.js

```js
draw(ctx, t) {
  Chapters.draw(ctx, t, S.chapters, scenes, { W, H });   // scene + title card + chapter progress bar
  G.grade(ctx);
  Kit.subtitles(ctx, t, S.subtitles, { style: 'keyword', W, H });
}
```

16:9 layout: subtitles sit at `H*0.87` and 78 % size automatically (`Kit.subtitles`); keep faces in the upper
two thirds; the safe area is a 5 % margin (`G.SAFE`). Characters at s ≈ 0.6–0.75 are full-body; s ≈ 1.5+ for
dialogue close-ups. Wide frames want more stuff in them: a second character, a prop, a background that moves
(`R.walk` + a scrolling, parallax background).

## Sound

`song.js` builds the whole timeline as usual (one `out/music.wav`). Long beds: loop chords or
`Genre.play(name, { clock, from, to, … })`; change the bed per chapter so the ear notices a new chapter too;
a whoosh + `ting` on each card. Measure with `STEMS=1 node song.js` + `levels.js` (−14 LUFS).

## Voice budget

`python scripts/tts.py <ep> --dry` lists every line, marks cached/new and counts the characters it would send.
Reference: a 107 s short ≈ 570 characters → ~1,600 for 5 min, ~3,200 for 10 min, against ≈ 10,000/month on
the free plan (non-commercial). Generate after the script is final; edits regenerate only the changed lines.

## Render

```bash
node song.js
node .agents/skills/tumraikortum/scripts/render-long.mjs <ep>            # every chapter → out/parts/, joined, muxed
node .agents/skills/tumraikortum/scripts/render-long.mjs <ep> --redo c2  # after fixing chapter c2 only
```

- Finished chapters are kept: a crash or a fix costs one chapter. `--redo all` after changing something every
  chapter uses (a character, the style, a kit file).
- It also writes `out/<ep>.srt/.vtt` (upload as YouTube captions) and `out/chapters.txt` (paste into the
  description: YouTube needs ≥ 3 chapters of ≥ 10 s, the first at 0:00).
- Speed: ~15 frames/s on this machine at 1080p → 10 min ≈ 20 min of rendering. Run it in the background.
- Windows: Chrome and ffmpeg write temp files to `%TEMP%`. If C: is nearly full, render with
  `TEMP`/`TMP` pointed at a folder on D: (`references/windows.md`).
- A vertical cut-down for Shorts from the same score: `node engine/render.js formats 9:16` works when the film
  lays itself out from `G.W/G.H` — otherwise make the short its own episode.
