# Automated QA (`scripts/qa.mjs`)

One command checks an episode before (and after) the expensive render. It never edits the episode's source; it
writes `out/qa/` (`report.json`, `sheet.png` = every sampled frame with eye/chin marks and the subtitle limit).

```
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node .agents/skills/tumraikortum/scripts/qa.mjs <episode> [--every 1] [--static]
node --test ".agents/skills/tumraikortum/scripts/*.test.mjs"     # the whole suite: story, rig motion, framing, skills, QA (≈ 3 s)
```

| area | what fails (✗) / warns (⚠) | how |
|---|---|---|
| missing assets | ✗ a `<script>` in index.html, a `loadFont` file, `cast.js`; ⚠ a `voice/<start>.mp3` for a line | files on disk + failed loads in Chrome |
| rendering failures | ✗ a JS exception while loading or drawing any sampled frame; the page never READY | the film drawn in headless Chrome |
| invalid scene state | ✗ shots out of order / ending after DURATION, subtitles outside the film, `Math.random`/`Date.now` | score.js, film.js |
| story continuity | ✗ everything `story.mjs check` finds; bible events at shot numbers SHOTS doesn't have | `SERIES` + `EPISODE` in score.js |
| character consistency | ✗ `cast.js` out of date with the bible; a character drawn with a look the bible doesn't give at this episode (inline `who` objects included) | `R.faces` (the rig records each face it draws when QA asks) |
| camera framing | ✗ a chin under the subtitles while a subtitle is on screen (⚠ without one); ⚠ eyes under the platform's top bar | real face positions, camera included |
| shot list | ✗/⚠ everything `Direct.lint` finds (lines vs shot length, 180°, jump cuts, pacing); STORYBOARD.md ↔ SHOTS | score.js SHOTS |
| animation timing | ⚠ characters on screen frozen for 0.5 s inside a shot | two frames 0.5 s apart, same hash |
| frame quality | ✗ a frame that draws differently the second time; ⚠ a flat one-colour frame | pixel hash / luminance spread |

Frames sampled: 0.7 s into every shot (after its transition) and 0.5 s later; films without SHOTS every `--every` s.
Measured rather than listened: QA does not hear the sound — `render.js verify` / `check` cover sync and loudness on
the final file.

Limits: faces are only known for characters drawn with `kit/rig.js` (not the paper `K.chibi` of the halloween
episodes, not `Ch.person`); a model-sheet scene (`examples/rig-lab`) warns about faces low on its pages by design;
voice lengths are estimated here — `shots.mjs` measures them from the mp3s.

Test scenes: `examples/dialogue-demo` (series cast from the bible, `Direct` camera, `R.act` acting; must pass with no
errors) and `examples/rig-lab` (model sheets, motion graphs, shot types). `scripts/qa.test.mjs` plants each fault
in a temporary copy of the dialogue demo and checks QA reports it.
