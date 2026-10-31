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

// the latest art/style/Thai kit from the skill, and its script tags before the film's own scenes
fs.cpSync(path.join(import.meta.dirname, '..', 'kit'), path.join(to, 'kit'), { recursive: true });
const html = path.join(to, 'index.html');
let page = fs.readFileSync(html, 'utf8');
const at = page.includes('<script src="chibi.js">') ? '<script src="chibi.js">' : '<script src="film.js">';
for (const f of ['kit/art.js', 'kit/rig.js', 'kit/direct.js', 'kit/explainer.js', 'kit/style.js']) if (!page.includes(f)) page = page.replace(at, `<script src="${f}"></script>\n${at}`);
// chapters before score.js: a long episode's score builds its timeline with Chapters.timeline
if (!page.includes('kit/chapters.js')) page = page.replace('<script src="score.js">', '<script src="kit/chapters.js"></script>\n<script src="score.js">');
fs.writeFileSync(html, page);

console.log(`created ${to} from ${from}
next:
  1. pick a genre (references/genres.md), write ${to}/STORY.md and ${to}/STORYBOARD.md
  2. node .agents/skills/tumraikortum/scripts/setup-fonts.mjs ${to} <font keys from the genre>
  3. rewrite ${to}/score.js (SHOTS, ev, markers), song.js, film.js
  4. python .agents/skills/tumraikortum/scripts/tts.py ${to}`);
