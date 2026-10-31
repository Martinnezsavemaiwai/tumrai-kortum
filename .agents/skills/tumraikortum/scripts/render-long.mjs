// Render a long episode chapter by chapter, so a crash or a fix costs one chapter, not the whole video.
//   node .agents/skills/tumraikortum/scripts/render-long.mjs <episode> [--redo id,id|all] [--workers n]
// Each chapter (score.js `chapters`, else 60 s chunks) → <ep>/out/parts/part_<f0>-<f1>.mp4 (skipped if it exists),
// then joined losslessly into out/video.mp4, muxed with out/music.wav, plus out/<ep>.srt/.vtt and
// out/chapters.txt (YouTube chapter lines). Run `node song.js` first. Re-render one chapter: --redo c2.
// Needs `render.js video --range`; an engine without it is patched once (the change is printed).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const argv = process.argv.slice(2);
const ep = argv.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (!ep || !fs.existsSync(path.join(ep, 'score.js'))) { console.error('usage: render-long.mjs <episode> [--redo id,id|all] [--workers n]'); process.exit(1); }
const ROOT = path.resolve(ep), OUT = path.join(ROOT, 'out'), PARTS = path.join(OUT, 'parts');
const S = createRequire(path.join(ROOT, 'score.js'))('./score.js');
const FPS = S.FPS || 30, total = Math.round(S.DURATION * FPS);
if (!fs.existsSync(path.join(OUT, 'music.wav'))) { console.error('run node song.js first'); process.exit(1); }

// ---------- make sure the engine can render a range ----------
const RJS = path.join(ROOT, 'engine', 'render.js');
let src = fs.readFileSync(RJS, 'utf8');
if (!src.includes("args.indexOf('--range')")) {
  const a = "  } else if (mode === 'video') {\n    const workers = parseInt(args[0] || String(Math.max(2, os.cpus().length - 1)), 10);\n";
  if (!src.includes(a)) { console.error('engine/render.js video mode looks different: add --range by hand (see this script)'); process.exit(1); }
  const b = `  } else if (mode === 'video') {
    const ri = args.indexOf('--range'); // --range <from> <to>: one section into out/parts/ (long videos: render-long.mjs)
    const workers = parseInt((ri === 0 ? args[3] : args[0]) || String(Math.max(2, os.cpus().length - 1)), 10);
    if (ri >= 0) {
      const f0 = Math.round(parseTime(args[ri + 1]) * FPS), f1 = Math.min(Math.round(DURATION * FPS), Math.round(parseTime(args[ri + 2]) * FPS));
      const dest = path.join(OUT, 'parts', \`part_\${String(f0).padStart(7, '0')}-\${String(f1).padStart(7, '0')}\${SUFFIX}.mp4\`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const { frames, secs } = await renderRange(f0, f1, workers, dest);
      console.log(\`\${path.relative(ROOT, dest)} done in \${secs.toFixed(1)}s (\${frames} frames verified)\`);
      return;
    }
`;
  fs.writeFileSync(RJS, src.replace(a, b));
  console.log('patched engine/render.js: `video --range <from> <to>` renders one section into out/parts/');
}

// ---------- the parts ----------
const parts = (S.chapters || Array.from({ length: Math.ceil(S.DURATION / 60) }, (_, i) => ({ id: `m${i}`, start: i * 60, end: Math.min(S.DURATION, i * 60 + 60) })))
  .map((c) => ({ id: c.id, f0: Math.round(c.start * FPS), f1: Math.min(total, Math.round(c.end * FPS)) }))
  .filter((p) => p.f1 > p.f0);
const file = (p) => path.join(PARTS, `part_${String(p.f0).padStart(7, '0')}-${String(p.f1).padStart(7, '0')}.mp4`);
const redo = (opt('--redo') || '').split(',').filter(Boolean);
const workers = opt('--workers');
for (const p of parts) {
  if (fs.existsSync(file(p)) && !redo.includes(p.id) && !redo.includes('all')) { console.log(`= ${p.id}: have ${path.basename(file(p))}`); continue; }
  console.log(`▶ ${p.id}: frames ${p.f0}–${p.f1} (${((p.f1 - p.f0) / FPS).toFixed(1)} s)`);
  const r = spawnSync(process.execPath, [RJS, 'video', '--range', String(p.f0 / FPS), String(p.f1 / FPS), ...(workers ? [workers] : [])], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0 || !fs.existsSync(file(p))) { console.error(`✗ ${p.id} failed: fix it and run again (finished chapters are kept)`); process.exit(1); }
}

// ---------- join, check, mux, subtitles, chapters ----------
const list = path.join(PARTS, 'list.txt');
fs.writeFileSync(list, parts.map((p) => `file '${file(p).replace(/\\/g, '/')}'`).join('\n'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, 'video.mp4')]);
const got = parseInt(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', path.join(OUT, 'video.mp4')]).toString(), 10);
if (got !== total) { console.error(`✗ joined video has ${got} frames, expected ${total}: a part is stale — run with --redo all`); process.exit(1); }
console.log(`joined ${parts.length} parts → out/video.mp4 (${got} frames)`);
for (const m of [['mux'], ['srt']]) if (spawnSync(process.execPath, [RJS, ...m], { cwd: ROOT, stdio: 'inherit' }).status !== 0) process.exit(1);
if (S.chapters && fs.existsSync(path.join(ROOT, 'kit', 'chapters.js'))) {
  const txt = createRequire(path.join(ROOT, 'kit', 'chapters.js'))('./chapters.js').youtube(S.chapters);
  fs.writeFileSync(path.join(OUT, 'chapters.txt'), txt + '\n');
  console.log(`out/chapters.txt (paste into the YouTube description):\n${txt}`);
}
