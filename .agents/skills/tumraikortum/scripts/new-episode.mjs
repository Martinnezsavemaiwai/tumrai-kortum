// Start a new TumraiKortum episode from an existing one.
//   node .agents/skills/tumraikortum/scripts/new-episode.mjs <from-episode> <new-episode>
// Copies engine/, chibi.js, index.html, package.json, score/song/film.js (to rewrite) and assets/;
// skips renders (out/) and voice (voice/). Fonts are fetched by setup-fonts.mjs if missing.
import fs from 'node:fs';
import path from 'node:path';

const [from, to] = process.argv.slice(2);
if (!from || !to) { console.error('usage: new-episode.mjs <from-episode> <new-episode>'); process.exit(1); }
if (!fs.existsSync(path.join(from, 'score.js'))) { console.error(`${from} is not an episode (no score.js)`); process.exit(1); }
if (fs.existsSync(to)) { console.error(`${to} already exists`); process.exit(1); }

const SKIP = new Set(['out', 'voice', 'node_modules', '.render.lock']);
fs.cpSync(from, to, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) });
for (const f of ['STORYBOARD.md', 'STORY.md']) fs.rmSync(path.join(to, f), { force: true });

console.log(`created ${to} from ${from}
next:
  1. write ${to}/STORY.md and ${to}/STORYBOARD.md (see references/)
  2. node .agents/skills/tumraikortum/scripts/setup-fonts.mjs ${to}
  3. rewrite ${to}/score.js (SHOTS, ev, markers), song.js, film.js
  4. python .agents/skills/tumraikortum/scripts/tts.py ${to}`);
