// Check an episode's shot list before drawing or rendering it (read-only).
//   node .agents/skills/tumraikortum/scripts/shots.mjs <episode> [--genre horror|comedy|drama|fantasy|adventure|slice|explainer]
// Reads score.js SHOTS (+ optional fields shot/on/look/move/in/scene, score.js `scenes` with sides, `GENRE`),
// measures each voice line from voice/<start>.mp3 when it exists (ffprobe) or estimates it, and compares
// STORYBOARD.md's shot rows with SHOTS. Prints the shot list as a table, then problems. Exit 1 on errors.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Direct = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'kit', 'direct.js'));

// "| 3 | 0:09–0:14 | …" → start seconds per shot number
export function storyboardStarts(md) {
  const out = new Map();
  for (const line of md.split('\n')) {
    const m = /^\|\s*(\d+)\s*\|\s*(\d+):(\d+(?:\.\d+)?)\s*[–-]/.exec(line);
    if (m) out.set(Number(m[1]), Number(m[2]) * 60 + Number(m[3]));
  }
  return out;
}

function main(argv) {
  const ep = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--genre');
  if (!ep || !fs.existsSync(path.join(ep, 'score.js'))) { console.error('usage: shots.mjs <episode> [--genre g]'); return 1; }
  const S = require(path.resolve(ep, 'score.js'));
  if (!Array.isArray(S.SHOTS)) { console.error(`${ep}/score.js has no SHOTS list (shots.mjs checks shot-by-shot films)`); return 1; }
  const gi = argv.indexOf('--genre'), genre = gi >= 0 ? argv[gi + 1] : S.GENRE;
  const shots = S.SHOTS.filter((s) => s.end > s.t);
  const durs = new Map();
  const voDur = (s) => {
    const f = path.join(ep, 'voice', `${String(Math.round(s.t)).padStart(3, '0')}.mp3`);
    if (!fs.existsSync(f)) return null;
    if (!durs.has(f)) { try { durs.set(f, parseFloat(execFileSync(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())); } catch { durs.set(f, null); } }
    return durs.get(f);
  };
  const { errors, warnings, stats } = Direct.lint(shots, { genre, voDur, voLag: S.VO_LAG ?? 0.3, scenes: S.scenes || {} });

  // storyboard ↔ score
  const sbf = path.join(ep, 'STORYBOARD.md');
  if (fs.existsSync(sbf)) {
    const sb = storyboardStarts(fs.readFileSync(sbf, 'utf8'));
    for (const s of shots) if (sb.has(s.i) && Math.abs(sb.get(s.i) - s.t) > 0.5) errors.push(`shot ${s.i}: STORYBOARD.md starts it at ${sb.get(s.i)} s, score.js at ${s.t} s`);
    if (sb.size && sb.size !== S.SHOTS.length) warnings.push(`STORYBOARD.md has ${sb.size} shot rows, score.js SHOTS has ${S.SHOTS.length}`);
  } else warnings.push('no STORYBOARD.md to compare with');

  console.log('| # | start | len | type | on | move | in | VO | line |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const s of shots) { const d = voDur(s); console.log(`| ${s.i} | ${s.t} | ${(s.end - s.t).toFixed(1)} | ${s.shot || ''} | ${s.on || ''} | ${s.move || ''} | ${typeof s.in === 'object' ? s.in.type : s.in || ''} | ${d == null ? (s.th ? '~' : '') : d.toFixed(1)} | ${(s.th || '').replace(/\n/g, ' ').slice(0, 40)} |`); }
  console.log(`\n${stats.shots} shots · average ${stats.asl.toFixed(1)} s · ${stats.hits} hard hits${stats.typed ? ` · ${stats.moving}/${stats.typed} moving cameras` : ' · no camera data (add shot/on/move to SHOTS)'}${genre ? ` · genre ${genre}: ${Direct.GENRES[genre]?.note || ''}` : ' · no genre (--genre or score.js GENRE)'}`);
  for (const w of warnings) console.log(`⚠ ${w}`);
  for (const e of errors) console.log(`✗ ${e}`);
  if (!errors.length) console.log(`✓ no errors${warnings.length ? ` (${warnings.length} warnings)` : ''}`);
  return errors.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
