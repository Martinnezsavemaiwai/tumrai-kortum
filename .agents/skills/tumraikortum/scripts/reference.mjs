// Study a reference video (a reel you like) before writing a story: where it cuts, how long shots hold, what the
// first 3 s do, where the sound drops out. Numbers + pictures for you to look at; the judgement is yours.
//   node .agents/skills/tumraikortum/scripts/reference.mjs <video.mp4> [--out dir] [--scene 0.15]
// → <out>/report.md (shot table, pacing per 10 s, silences), sheet.png (one frame per shot, in order),
//   hook.png (0–3 s every 0.25 s). Default out: <video dir>/analysis. Needs ffmpeg/ffprobe.
// --scene: how different two frames must be to count as a cut. 0.15 suits flat-colour animation (at 0.3 a
// code-drawn reel showed 8 shots where there were 15); raise it for live footage with fast camera moves.
// Get a reel with yt-dlp into its own folder (keep it out of the repo; it is someone else's work — study it,
// never reuse its frames, sound, script or characters). Findings go in STORY.md as "what to borrow".
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FF = process.env.FFMPEG || 'ffmpeg', FP = process.env.FFPROBE_PATH || 'ffprobe';
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 4).join(' ')}…: ${String(r.stderr).slice(-400)}`);
  return String(r.stderr) + String(r.stdout);
};

// cut times from ffmpeg's scene score (0–1 change between frames); `min` drops cuts closer than that (flash frames)
export function cuts(log, min = 0.2) {
  const out = [];
  for (const m of log.matchAll(/pts_time:([\d.]+)/g)) { const t = +m[1]; if (!out.length || t - out[out.length - 1] >= min) out.push(t); }
  return out;
}

// shots from cut times; pacing = cuts per 10 s window
export function shots(cutTimes, dur) {
  const b = [0, ...cutTimes.filter((t) => t > 0.05 && t < dur - 0.05), dur];
  return b.slice(0, -1).map((t, i) => ({ i: i + 1, t: +t.toFixed(2), end: +b[i + 1].toFixed(2), len: +(b[i + 1] - t).toFixed(2) }));
}

export function silences(log) {
  const s = [], st = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]), en = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  st.forEach((a, i) => s.push([a, en[i] ?? null]));
  return s;
}

function main(argv) {
  const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const video = argv.find((a, i) => !a.startsWith('--') && !['--out', '--scene'].includes(argv[i - 1]));
  if (!video || !fs.existsSync(video)) { console.error('usage: reference.mjs <video.mp4> [--out dir] [--scene 0.15]'); return 1; }
  const out = path.resolve(opt('--out', path.join(path.dirname(video), 'analysis'))), th = +opt('--scene', 0.15);
  fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
  const probe = JSON.parse(run(FP, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', video]).replace(/^[^{]*/, ''));
  const v = probe.streams.find((s) => s.codec_type === 'video'), dur = +probe.format.duration;

  const sh = shots(cuts(run(FF, ['-hide_banner', '-i', video, '-an', '-vf', `select='gt(scene,${th})',showinfo`, '-f', 'null', '-'])), dur);
  const sil = silences(run(FF, ['-hide_banner', '-i', video, '-vn', '-af', 'silencedetect=noise=-35dB:d=0.3', '-f', 'null', '-']));
  const lufs = (run(FF, ['-hide_banner', '-i', video, '-vn', '-af', 'ebur128', '-f', 'null', '-']).match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();

  // one frame from the middle of every shot → sheet.png; 0–3 s every 0.25 s → hook.png
  const grab = (t, f) => run(FF, ['-v', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf', 'scale=216:-2', f]);
  fs.readdirSync(path.join(out, 'frames')).forEach((f) => fs.rmSync(path.join(out, 'frames', f)));
  sh.forEach((s, i) => grab((s.t + s.end) / 2, path.join(out, 'frames', `s${String(i).padStart(3, '0')}.png`)));
  const cols = 8, rows = Math.ceil(sh.length / cols);
  run(FF, ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(out, 'frames', 's%03d.png'), '-vf', `tile=${cols}x${rows}:padding=4:color=white`, '-frames:v', '1', path.join(out, 'sheet.png')]);
  for (let k = 0; k < 12; k++) grab(k * 0.25, path.join(out, 'frames', `h${String(k).padStart(3, '0')}.png`));
  run(FF, ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(out, 'frames', 'h%03d.png'), '-vf', 'tile=6x2:padding=4:color=white', '-frames:v', '1', path.join(out, 'hook.png')]);

  const lens = sh.map((s) => s.len).sort((a, b) => a - b), asl = dur / sh.length, med = lens[Math.floor(lens.length / 2)];
  const per10 = Array.from({ length: Math.ceil(dur / 10) }, (_, k) => sh.filter((s) => s.t >= k * 10 && s.t < k * 10 + 10).length);
  const md = [
    `# Reference: ${path.basename(video)}`, '',
    `${v.width}×${v.height} · ${dur.toFixed(1)} s · ${sh.length} shots (scene > ${th}) · average ${asl.toFixed(2)} s · median ${med.toFixed(2)} s · shortest ${lens[0].toFixed(2)} s · longest ${lens[lens.length - 1].toFixed(2)} s · ${lufs ? lufs.replace(/\s+/g, ' ') : 'loudness ?'}`, '',
    `Cuts per 10 s: ${per10.map((n, k) => `${k * 10}s:${n}`).join(' · ')}`, '',
    `Silences (< −35 dB, ≥ 0.3 s): ${sil.length ? sil.map(([a, b]) => `${a.toFixed(2)}–${b == null ? 'end' : b.toFixed(2)}`).join(', ') : 'none (sound all the way)'}`, '',
    'sheet.png = the middle frame of each shot, left→right, 8 per row; hook.png = 0.00–2.75 s every 0.25 s.', '',
    '| # | start | end | len |', '|---|---|---|---|', ...sh.map((s) => `| ${s.i} | ${s.t} | ${s.end} | ${s.len} |`), '',
    '## What to look for (fill in after looking at the sheets)',
    '- Hook (0–3 s): what is on screen and said first? how fast does the question/premise land?',
    '- Format: the repeating unit (one idea per shot? a list? a turn?) and how long each unit runs.',
    '- Text on screen: subtitle style, size, words per screen, keyword marks.',
    '- Ending: the call to action / question, and how long it holds.',
    '- Borrow (structure, pacing, devices) vs never copy (their characters, art, script, music).',
  ].join('\n');
  fs.writeFileSync(path.join(out, 'report.md'), md + '\n');
  console.log(md.split('\n').slice(0, 8).join('\n'));
  console.log(`\n→ ${path.join(out, 'report.md')}, sheet.png, hook.png`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
