// Automated QA of an episode, before (and after) rendering it. Read-only on the episode's source; writes out/qa/.
//   node .agents/skills/tumraikortum/scripts/qa.mjs <episode> [--every 1] [--static]
// Static: missing scripts/fonts/voice files, determinism, SHOTS/subtitle state, shot list (Direct.lint, STORYBOARD ↔
//   SHOTS), and for a series episode (score.js SERIES + EPISODE): story.mjs check, cast.js up to date, bible events'
//   shot numbers exist.
// Browser (headless Chrome, frames drawn by the film itself): JS exceptions and failed loads, blank frames, faces
//   (from kit/rig.js) under the subtitles / under the top bar, characters drawn with a look the bible doesn't give
//   them, frozen held shots, frames that differ when drawn twice. out/qa/sheet.png shows every sampled frame with
//   eye/chin marks and the subtitle limit; out/qa/report.json has everything.
// Exit 1 when there are errors. Needs CHROME_PATH on Windows (references/windows.md).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { load, check as storyCheck, castJs, stateAt } from './story.mjs';
import { storyboardStarts } from './shots.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..', '..', '..', '..');
const require = createRequire(import.meta.url);
const Direct = require(path.join(HERE, '..', 'kit', 'direct.js'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- static ----------
export function staticChecks(ep, S) {
  const E = [], Wn = [], info = [];
  const has = (p) => fs.existsSync(path.join(ep, p));
  const html = has('index.html') ? fs.readFileSync(path.join(ep, 'index.html'), 'utf8') : (E.push('no index.html'), '');
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);
  for (const s of scripts) if (!has(s)) E.push(`missing script ${s} (index.html)`);
  const film = has('film.js') ? fs.readFileSync(path.join(ep, 'film.js'), 'utf8') : '';
  for (const m of film.matchAll(/loadFont\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]/g)) if (!has(m[1])) E.push(`missing font ${m[1]} (film.js; run setup-fonts.mjs)`);
  for (const f of ['film.js', 'score.js', ...scripts.filter((s) => !s.startsWith('engine/'))]) {
    if (!has(f)) continue;
    fs.readFileSync(path.join(ep, f), 'utf8').split('\n').forEach((l, i) => { if (/\b(Math\.random|Date\.now|performance\.now|new Date)\s*\(/.test(l.replace(/\/\/.*$/, ''))) E.push(`${f}:${i + 1}: not a pure function of t (${l.trim().slice(0, 60)}) — use U.hash / t`); });
  }
  // scene state: shots in order, inside the film, subtitles inside the film
  const shots = Array.isArray(S.SHOTS) ? S.SHOTS : [];
  shots.forEach((s, k) => {
    if (!(s.end > s.t)) E.push(`shot ${s.i}: ends (${s.end}) before it starts (${s.t})`);
    if (k && s.t < shots[k - 1].t) E.push(`shot ${s.i}: starts before shot ${shots[k - 1].i}`);
    if (s.end > S.DURATION + 1e-6) E.push(`shot ${s.i}: ends at ${s.end} s, after DURATION ${S.DURATION}`);
  });
  for (const s of S.subtitles || []) if (s.t < 0 || (s.end ?? s.t) > S.DURATION + 1e-6) E.push(`subtitle "${String(s.text).slice(0, 20)}" outside 0–${S.DURATION} s`);
  if (shots.length) {
    const { errors, warnings } = Direct.lint(shots.filter((s) => s.end > s.t), { genre: S.GENRE, voLag: S.VO_LAG ?? 0.3, scenes: S.scenes || {} });
    E.push(...errors); Wn.push(...warnings);
    if (has('STORYBOARD.md')) { const sb = storyboardStarts(fs.readFileSync(path.join(ep, 'STORYBOARD.md'), 'utf8')); for (const s of shots) if (sb.has(s.i) && Math.abs(sb.get(s.i) - s.t) > 0.5) E.push(`shot ${s.i}: STORYBOARD.md starts it at ${sb.get(s.i)} s, score.js at ${s.t} s`); }
    const lines = shots.filter((s) => s.th);
    if (has('voice')) for (const s of lines) { const f = `voice/${String(Math.round(s.t)).padStart(3, '0')}.mp3`; if (!has(f)) Wn.push(`missing voice ${f} for shot ${s.i} (tts.py)`); }
    else if (lines.length) info.push('no voice/ yet (picture-only or before tts.py)');
  }
  // series
  let bible = null;
  if (S.SERIES) {
    const rel = path.resolve(ep, S.SERIES), dir = fs.existsSync(path.join(rel, 'bible.json')) ? rel : path.join(REPO, 'stories', S.SERIES); // a series id, or a folder path
    if (!fs.existsSync(path.join(dir, 'bible.json'))) E.push(`score.js SERIES "${S.SERIES}": no stories/${S.SERIES}/bible.json`);
    else {
      bible = load(dir);
      let lock = null; try { lock = JSON.parse(fs.readFileSync(path.join(dir, 'canon.lock.json'), 'utf8')); } catch { /* reported by check */ }
      const r = storyCheck(bible, lock);
      E.push(...r.errors.map((e) => `story: ${e}`));
      if (!bible.episodes.some((e) => e.id === S.EPISODE)) E.push(`score.js EPISODE "${S.EPISODE}" is not in the bible`);
      else {
        const want = castJs(bible, S.EPISODE, path.basename(dir));
        if (!has('cast.js')) E.push(`no cast.js (story.mjs cast ${S.SERIES} ${S.EPISODE} --out ${ep}/cast.js)`);
        else if (fs.readFileSync(path.join(ep, 'cast.js'), 'utf8').replace(/\r/g, '') !== want) E.push(`cast.js is out of date with the bible (story.mjs cast ${S.SERIES} ${S.EPISODE} --out cast.js)`);
        if (!scripts.includes('cast.js')) E.push('index.html does not load cast.js');
        const ids = new Set(shots.map((s) => s.i));
        for (const e of bible.events.filter((x) => x.ep === S.EPISODE)) if (e.shot != null && ids.size && !ids.has(e.shot)) E.push(`bible event ${e.id} is at shot ${e.shot}, which ${S.EPISODE}'s SHOTS doesn't have`);
      }
    }
  }
  return { errors: E, warnings: Wn, info, bible };
}

// ---------- one sampled frame ----------
// f: { t, W, H, std, hash, faces: [{ who, name, look, alpha, eye, chin, top }] in stage px }; subs: subtitle on screen?
export function frameChecks(f, { subs = false, bibleLooks = null, portrait = f.H > f.W * 1.2 } = {}) {
  const E = [], Wn = [], at = `t=${f.t.toFixed(2)}`;
  if (f.std < 3) Wn.push(`${at}: flat frame (one colour) — a blackout on purpose, or nothing drawn?`);
  const limit = Direct.lines(f.W, f.H).face;
  for (const p of f.faces) {
    if (p.alpha < 0.3) continue;
    const [ex, ey] = p.eye, cy = p.chin[1], label = p.who || p.name || 'a character';
    if (ex < 0 || ex > f.W || ey < 0 || ey > f.H) continue; // off screen: not framed in this shot
    if (cy > f.H * limit) (subs ? E : Wn).push(`${at}: ${label}'s chin at ${(cy / f.H).toFixed(2)} H is under the ${portrait ? 'subtitle rail' : 'lower third'} (limit ${limit.toFixed(2)} H)${subs ? ' while a subtitle is on screen' : ''}`);
    if (portrait && ey < f.H * 0.115) Wn.push(`${at}: ${label}'s eyes at ${(ey / f.H).toFixed(2)} H are under the platform's top bar`);
    if (bibleLooks) {
      const id = p.who || Object.keys(bibleLooks).find((k) => bibleLooks[k].name === p.name);
      if (p.who && !bibleLooks[p.who]) Wn.push(`${at}: ${p.who} is drawn but is not a character in the bible`);
      else if (id) for (const [k, v] of Object.entries(bibleLooks[id].look)) if (p.look[k] !== v) { E.push(`${at}: ${id} is drawn with ${k}=${JSON.stringify(p.look[k])}, the bible says ${JSON.stringify(v)} at this episode`); break; }
    }
  }
  return { errors: E, warnings: Wn };
}

// ---------- a headless Chrome on a local copy of the episode ----------
// ponytail: a second, minimal Chrome driver next to engine/render.js (which runs as a script and can't be imported);
// if render.js ever exports launch/cdp, use those instead.
function serve(root) {
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
  const srv = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(path.resolve(root)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}
async function chrome() {
  const bin = process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
  if (!bin) throw new Error('Chrome not found: set CHROME_PATH');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-chrome-'));
  const proc = spawn(bin, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-extensions', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore', detached: true });
  const kill = () => { try { if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); else process.kill(-proc.pid); } catch { /* gone */ } try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* locked */ } };
  for (let i = 0; i < 200; i++) {
    try {
      const port = parseInt(fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8'), 10);
      const pg = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((x) => x.type === 'page');
      if (pg) {
        const ws = new WebSocket(pg.webSocketDebuggerUrl), pending = new Map(), events = [];
        let id = 0;
        ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else events.push(m); };
        await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
        const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
        const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
        return { send, evaluate, events, close: () => { ws.close(); kill(); } };
      }
    } catch { /* not up yet */ }
    await sleep(100);
  }
  kill(); throw new Error(`Chrome did not start (${bin})`);
}

// draws frame t, returns its faces (stage px), pixel stats and a hash; mark = also return an annotated PNG
const FRAME_JS = (t, mark) => `(() => {
  const R = globalThis.R; if (R) R.faces = [];
  window.renderAt(${t}, 'none', 0.5);
  const c = document.getElementById('c'), x = c.getContext('2d'), k = c.width / G.W, d = x.getImageData(0, 0, c.width, c.height).data;
  let n = 0, s = 0, s2 = 0, h = 2166136261;
  for (let i = 0; i < d.length; i += 4 * 7) { const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; s += y; s2 += y * y; h = Math.imul(h ^ (d[i] ^ (d[i + 1] << 8) ^ (d[i + 2] << 16)), 16777619); }
  const faces = (R && R.faces || []).map((f) => ({ ...f, eye: f.eye.map((v) => v / k), chin: f.chin.map((v) => v / k), top: f.top.map((v) => v / k) }));
  if (R) R.faces = null;
  let png = null;
  if (${mark}) {
    const a = document.createElement('canvas'); a.width = c.width; a.height = c.height; const q = a.getContext('2d'); q.drawImage(c, 0, 0);
    const lim = (G.H > G.W * 1.2 ? 0.7 : 2 / 3) * c.height;
    q.strokeStyle = '#FF2D55'; q.lineWidth = 3; q.setLineDash([12, 8]); q.beginPath(); q.moveTo(0, lim); q.lineTo(c.width, lim); q.stroke(); q.setLineDash([]);
    for (const f of faces) { q.strokeStyle = '#00E0A0'; q.beginPath(); q.arc(f.eye[0] * k, f.eye[1] * k, 9, 0, 7); q.stroke(); q.beginPath(); q.moveTo(f.eye[0] * k - 40, f.chin[1] * k); q.lineTo(f.eye[0] * k + 40, f.chin[1] * k); q.stroke(); }
    q.fillStyle = 'rgba(0,0,0,0.7)'; q.fillRect(0, 0, 150, 34); q.fillStyle = '#FFF'; q.font = '700 22px sans-serif'; q.fillText('${t.toFixed(2)}s', 10, 25);
    png = a.toDataURL('image/png');
  }
  return { t: ${t}, W: G.W, H: G.H, std: Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)), mean: s / n, hash: h >>> 0, faces, png };
})()`;

export async function browserChecks(ep, S, { every = 1, bible = null } = {}) {
  const E = [], Wn = [], frames = [];
  const srv = await serve(path.resolve(ep)), port = srv.address().port;
  const b = await chrome();
  const drain = (when) => {
    for (const m of b.events.splice(0)) {
      if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; E.push(`JS exception ${when}: ${(d.exception?.description || d.text).split('\n')[0]}`); }
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon|\/brand\.json|\/out\/(voice|analysis|lyrics)\.json/.test(m.params.entry.url || '')) /* optional files the engine tries (same list as render.js) */E.push(`failed to load ${when}: ${(m.params.entry.url || m.params.entry.text).replace(`http://127.0.0.1:${port}/`, '')}`);
    }
  };
  try {
    await b.send('Runtime.enable'); await b.send('Log.enable'); await b.send('Page.enable');
    await b.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
    let ready = false;
    for (let i = 0; i < 300 && !ready; i++) { try { ready = await b.evaluate('window.READY === true'); } catch { /* loading */ } if (!ready) await sleep(100); }
    drain('while loading');
    if (!ready) { E.push('the page never became READY (see the errors above)'); return { errors: E, warnings: Wn, frames }; }
    // samples: inside every shot (after its transition) + 0.5 s later for the frozen check; else every `every` s
    const shots = (S.SHOTS || []).filter((s) => s.end > s.t);
    const pairs = shots.length ? shots.map((s) => { const a = Math.min(s.t + 0.7, s.end - 0.15); return [a, Math.min(a + 0.5, s.end - 0.05), s]; })
      : Array.from({ length: Math.floor(S.DURATION / every) }, (_, i) => [i * every + 0.5, i * every + 1, null]).filter(([a]) => a < S.DURATION);
    const looks = bible && S.EPISODE ? (() => { const st = stateAt(bible, S.EPISODE); return Object.fromEntries(Object.entries(bible.characters).map(([id, c]) => [id, { name: c.name, look: { ...st.look[id], body: c.body || 'anime' } }])); })() : null;
    const subsAt = (t) => (S.subtitles || []).some((s) => t >= s.t && t < (s.end ?? s.t + 2));
    const dir = path.join(ep, 'out', 'qa'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (const [a, bT, shot] of pairs) {
      let f;
      try { f = await b.evaluate(FRAME_JS(a, true)); } catch (e) { E.push(`render failed at t=${a.toFixed(2)}: ${e.message.split('\n')[0]}`); continue; }
      drain(`at t=${a.toFixed(2)}`);
      fs.writeFileSync(path.join(dir, `f_${String(frames.length).padStart(3, '0')}.png`), Buffer.from(f.png.slice(f.png.indexOf(',') + 1), 'base64')); delete f.png;
      const r = frameChecks(f, { subs: subsAt(a), bibleLooks: looks });
      E.push(...r.errors); Wn.push(...r.warnings);
      if (bT > a + 0.2 && f.faces.length) {
        const g = await b.evaluate(FRAME_JS(bT, false)); drain(`at t=${bT.toFixed(2)}`);
        if (g.hash === f.hash) Wn.push(`t=${a.toFixed(2)}–${bT.toFixed(2)}${shot ? ` (shot ${shot.i})` : ''}: nothing moves — characters on screen are frozen (R.act alive, a move, or an event)`);
      }
      frames.push({ ...f, shot: shot && shot.i, faces: f.faces.map(({ look, ...x }) => x) });
    }
    if (frames.length) { // the same t must give the same picture (frames are rendered in parallel, in any order)
      const again = await b.evaluate(FRAME_JS(frames[0].t, false));
      if (again.hash !== frames[0].hash) E.push(`t=${frames[0].t.toFixed(2)} draws differently the second time — the film keeps state between frames or uses randomness`);
    }
    if (frames.length) {
      const cols = Math.min(6, frames.length);
      try { execFileSync(process.env.FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 'f_%03d.png'), '-vf', `scale=${frames[0].H > frames[0].W ? -2 : 480}:${frames[0].H > frames[0].W ? 480 : -2},tile=${cols}x${Math.ceil(frames.length / cols)}:padding=6:color=white`, '-frames:v', '1', path.join(dir, 'sheet.png')]); } catch { Wn.push('ffmpeg missing: no out/qa/sheet.png'); }
    }
    return { errors: E, warnings: Wn, frames };
  } finally { b.close(); srv.close(); }
}

async function main(argv) {
  const ep = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--every');
  if (!ep || !fs.existsSync(path.join(ep, 'score.js'))) { console.error('usage: qa.mjs <episode> [--every s] [--static]'); return 1; }
  let S;
  try { S = require(path.resolve(ep, 'score.js')); } catch (e) { console.log(`✗ score.js does not load: ${e.message}`); return 1; }
  const st = staticChecks(ep, S);
  const out = { episode: ep, static: { errors: st.errors, warnings: st.warnings, info: st.info } };
  if (!argv.includes('--static')) {
    const i = argv.indexOf('--every');
    try { out.browser = await browserChecks(ep, S, { every: i >= 0 ? Number(argv[i + 1]) : 1, bible: st.bible }); } catch (e) { out.browser = { errors: [`browser QA could not run: ${e.message}`], warnings: [], frames: [] }; }
  }
  const errors = [...st.errors, ...(out.browser?.errors || [])], warnings = [...st.warnings, ...(out.browser?.warnings || [])];
  fs.mkdirSync(path.join(ep, 'out', 'qa'), { recursive: true });
  fs.writeFileSync(path.join(ep, 'out', 'qa', 'report.json'), JSON.stringify({ ...out, errors, warnings }, null, 2));
  for (const n of st.info) console.log(`· ${n}`);
  for (const w of warnings) console.log(`⚠ ${w}`);
  for (const e of errors) console.log(`✗ ${e}`);
  const fr = out.browser?.frames || [];
  console.log(`${errors.length ? '✗' : '✓'} ${path.basename(path.resolve(ep))}: ${errors.length} errors, ${warnings.length} warnings${fr.length ? ` · ${fr.length} frames, ${fr.reduce((a, f) => a + f.faces.length, 0)} faces checked · out/qa/sheet.png` : out.browser ? '' : ' · static only'}`);
  return errors.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).then((c) => { process.exitCode = c; });
