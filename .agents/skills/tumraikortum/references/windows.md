# Windows notes

- Chrome isn't found automatically: prefix every render command with
  `CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"` (bash) or set `$env:CHROME_PATH` (PowerShell).
- The engine's `grab()` in `engine/render.js` pulls frames in 1 MB slices; a single full-res PNG over the DevTools socket drops the connection on Windows. Keep that patch when updating the engine.
- `render.js video` takes many minutes: run it in the background and wait for `out/video.mp4`. If a session dies mid-render the node process may keep going (the lock in `out/.render.lock` names its PID) — check it before starting another.
- To re-render only part of a film: `render.js clip <from> <to>` and splice with ffmpeg `trim`/`concat` at exact frame numbers (`t * 30`), then `mux` + `verify`.
- Stopping a render you started: `taskkill /PID <node pid> /T /F` kills that node and its own Chrome/ffmpeg children only.
- **C: full** (Chrome "did not start", `ENOSPC`): Chrome profiles and ffmpeg temp files go to `%TEMP%` on C:. Render with temp on another drive: `TEMP="D:\Hobby\tmp" TMP="D:\Hobby\tmp" node engine/render.js …` (bash) — the episode's own `out/` is already on its drive.
