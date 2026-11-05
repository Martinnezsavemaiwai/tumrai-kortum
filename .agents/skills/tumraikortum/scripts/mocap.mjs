// Motion capture → rig pose fields. Reads a BVH clip (a CMU trial id, a URL or a file), projects it onto the
// front plane the rig is drawn in, and stores it in kit/moves.js for Moves.play (see that file).
//   node .agents/skills/tumraikortum/scripts/mocap.mjs <name> <13_29 | url | file.bvh> [--from s] [--to s] [--mirror] [--note "…"]
//   node .agents/skills/tumraikortum/scripts/mocap.mjs --list          the clips in kit/moves.js
//   node .agents/skills/tumraikortum/scripts/mocap.mjs --rebuild       convert every CMU clip again (after changing this file)
//   node .agents/skills/tumraikortum/scripts/mocap.mjs --remove <name>
// CMU ids come from the BVH conversion of the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu,
// free for all uses incl. commercial); index: github.com/una-dinosauria/cmu-mocap → cmu-mocap-index-text.txt.
// Front view only: what moves toward/away from the camera (a walk's stride) is lost, so pick clips whose motion
// reads from the front — arms, jumps, squats, sways, dances facing the camera.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MOVES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'kit', 'moves.js');
const FPS = 30;
const MAX_TURN = 0.8; // rad a frame (24 rad/s): faster than any real swing in the clips (jumping jacks peak ≈ 0.77)
export const FIELDS = ['lSh', 'lEl', 'rSh', 'rEl', 'lHip', 'lKnee', 'rHip', 'rKnee', 'lean', 'tilt', 'bob', 'dx'];

// ---------- BVH ----------
export function parseBVH(text) {
  const tok = text.split(/\s+/).filter(Boolean);
  let i = 0;
  const joints = [];
  const joint = (name, parent) => {
    const j = { name, parent, offset: [0, 0, 0], channels: [], end: false };
    joints.push(j);
    if (tok[i++] !== '{') throw new Error(`BVH: expected { after ${name}`);
    while (tok[i] !== '}') {
      const k = tok[i++];
      if (k === 'OFFSET') j.offset = [+tok[i++], +tok[i++], +tok[i++]];
      else if (k === 'CHANNELS') { const n = +tok[i++]; j.channels = tok.slice(i, i + n); i += n; }
      else if (k === 'JOINT') joint(tok[i++], j);
      else if (k === 'End') { i++; const e = joint(`${name}_end`, j); e.end = true; }
      else throw new Error(`BVH: unexpected ${k}`);
    }
    i++;
    return j;
  };
  if (tok[i++] !== 'HIERARCHY' || tok[i++] !== 'ROOT') throw new Error('BVH: no HIERARCHY/ROOT');
  joint(tok[i++], null);
  if (tok[i++] !== 'MOTION') throw new Error('BVH: no MOTION');
  i++; const frames = +tok[i++]; i += 2; const dt = +tok[i++]; // Frames: N  Frame Time: dt
  const width = joints.reduce((a, j) => a + j.channels.length, 0);
  const data = tok.slice(i, i + frames * width).map(Number);
  if (data.length < frames * width) throw new Error('BVH: motion data is shorter than Frames says');
  return { joints, frames, dt, width, data };
}

const mul = (A, B) => A.map((r) => [0, 1, 2].map((c) => r[0] * B[0][c] + r[1] * B[1][c] + r[2] * B[2][c]));
const app = (A, v) => A.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const rot = (axis, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return axis === 'X' ? [[1, 0, 0], [0, c, -s], [0, s, c]] : axis === 'Y' ? [[c, 0, s], [0, 1, 0], [-s, 0, c]] : [[c, -s, 0], [s, c, 0], [0, 0, 1]];
};

// world position of every joint at frame f: { name: [x, y, z] }
export function pose(bvh, f) {
  const out = {}, R = new Map();
  let k = f * bvh.width;
  for (const j of bvh.joints) {
    let t = [...j.offset], m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (const ch of j.channels) {
      const v = bvh.data[k++];
      if (ch.endsWith('position')) t['XYZ'.indexOf(ch[0])] += v; else m = mul(m, rot(ch[0], v));
    }
    const p = j.parent ? R.get(j.parent) : { m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], p: [0, 0, 0] };
    const pos = app(p.m, t).map((x, n) => x + p.p[n]);
    R.set(j, { m: mul(p.m, m), p: pos });
    out[j.name.replace(/^.*:/, '')] = pos;
  }
  return out;
}

// the joints the rig needs, under the names the common skeletons use (CMU/MotionBuilder, Mixamo, Poser-style)
const ALIAS = {
  hips: ['Hips', 'hip', 'pelvis'], neck: ['Neck', 'neck'], head: ['Head', 'head'],
  LArm: ['LeftArm', 'LeftUpperArm', 'lShldr'], LFore: ['LeftForeArm', 'LeftLowerArm', 'lForeArm'], LHand: ['LeftHand', 'lHand'],
  RArm: ['RightArm', 'RightUpperArm', 'rShldr'], RFore: ['RightForeArm', 'RightLowerArm', 'rForeArm'], RHand: ['RightHand', 'rHand'],
  LUp: ['LeftUpLeg', 'LeftThigh', 'lThigh'], LLeg: ['LeftLeg', 'LeftShin', 'lShin'], LFoot: ['LeftFoot', 'lFoot'],
  RUp: ['RightUpLeg', 'RightThigh', 'rThigh'], RLeg: ['RightLeg', 'RightShin', 'rShin'], RFoot: ['RightFoot', 'rFoot'],
};
const pick = (P) => {
  const o = {};
  for (const [k, names] of Object.entries(ALIAS)) {
    const n = names.find((x) => P[x]);
    if (!n) throw new Error(`BVH: no joint for ${k} (tried ${names.join(', ')}); add the name to ALIAS in mocap.mjs`);
    o[k] = P[n];
  }
  return o;
};

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const r = (x, n) => +x.toFixed(n);

// one frame of joint positions → rig fields. ax: the screen-right axis (unit, horizontal); L: leg length;
// prev: the previous frame's bone angles (`_bones` of its result). A bone pointing at the camera projects to
// almost nothing and its angle is noise (elbows used to pop by up to 3 rad a frame), so each bone moves from
// its previous angle only as far as it is visible: projected length / 3D length, faded in from 0.15 to 0.45.
export function fields(J, ax, L, hip0, mirror, prev = null) {
  const sx = (p) => (mirror ? -1 : 1) * (p[0] * ax[0] + p[2] * ax[2]), sy = (p) => -p[1]; // screen: x right, y down
  const S = (p) => [sx(p), sy(p)], v = (a, b) => [b[0] - a[0], b[1] - a[1]];
  // lean/tilt from the sideways part only, against the bone's real 3D length: a bend toward the camera
  // shortens the projected spine to nothing and its angle would flip the body; asin stays within ±90°
  const len3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) || 1;
  const side3 = (a, b) => Math.asin(Math.max(-1, Math.min(1, (sx(b) - sx(a)) / len3(a, b))));
  const H = S(J.hips), lean = side3(J.hips, J.neck);
  const unlean = ([x, y]) => [x * Math.cos(lean) + y * Math.sin(lean), -x * Math.sin(lean) + y * Math.cos(lean)];
  // screen-left limbs are the character's right (it faces the camera), unless mirrored
  const side = (d) => ((d < 0) !== mirror ? 'R' : 'L');
  const o = { lean: r(lean, 3), tilt: r(side3(J.neck, J.head) - lean, 3), _bones: {} };
  // a bone's angle from straight down (+ = out to its side d), held toward `prev` while it faces the camera
  const bone = (key, a, b, d, un) => {
    const p = un ? unlean(v(S(a), S(b))) : v(S(a), S(b)), raw = Math.atan2(d * p[0], p[1]);
    const w = Math.max(0, Math.min(1, (Math.hypot(...p) / len3(a, b) - 0.15) / 0.3));
    // and never faster than MAX_TURN a frame: a bone swinging through the camera line flips its 2D direction
    // in one frame, which would draw as the limb whipping round; spread over a few frames it reads as a turn
    const ang = prev && prev[key] !== undefined ? prev[key] + Math.max(-MAX_TURN, Math.min(MAX_TURN, wrap(raw - prev[key]) * w)) : raw;
    o._bones[key] = ang;
    return ang;
  };
  for (const d of [-1, 1]) {
    const c = side(d), k = d < 0 ? 'l' : 'r';
    const a = bone(k + 'ua', J[c + 'Arm'], J[c + 'Fore'], d, true), a2 = bone(k + 'fa', J[c + 'Fore'], J[c + 'Hand'], d, true);
    o[k + 'Sh'] = r(wrap(a), 3); o[k + 'El'] = r(wrap(a2 - a), 3);
    const h = bone(k + 'th', J[c + 'Up'], J[c + 'Leg'], d, false), s = bone(k + 'sh', J[c + 'Leg'], J[c + 'Foot'], d, false);
    o[k + 'Hip'] = r(wrap(h), 3); o[k + 'Knee'] = r(wrap(h - s), 3);
  }
  o.bob = r((H[1] - hip0[1]) / L, 4); // in leg lengths; Moves.play turns it into rig pixels for the body
  o.dx = r((H[0] - hip0[0]) / L, 4);
  return o;
}

export function convert(bvh, { from = 0, to = Infinity, mirror = false } = {}) {
  const dur = bvh.frames * bvh.dt, t0 = Math.max(0, from), t1 = Math.min(dur, to);
  if (!(t1 > t0)) throw new Error(`empty range ${from}–${to} s (clip is ${dur.toFixed(2)} s)`);
  const at = (t) => pick(pose(bvh, Math.min(bvh.frames - 1, Math.round(t / bvh.dt))));
  const J0 = at(t0);
  const hx = [J0.LUp[0] - J0.RUp[0], J0.LUp[2] - J0.RUp[2]], hl = Math.hypot(...hx) || 1;
  const ax = [hx[0] / hl, 0, hx[1] / hl]; // the character's left at the first frame = screen right
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const L = len(J0.LUp, J0.LLeg) + len(J0.LLeg, J0.LFoot);
  const hip0 = [(mirror ? -1 : 1) * (J0.hips[0] * ax[0] + J0.hips[2] * ax[2]), -J0.hips[1]];
  const frames = [];
  let prev = null;
  for (let t = t0; t <= t1 + 1e-9; t += 1 / FPS) { const f = fields(at(t), ax, L, hip0, mirror, prev); prev = f._bones; frames.push(FIELDS.map((k) => f[k])); }
  // angles stored unwrapped (no ±π jumps between frames), so Moves.play can interpolate them as plain numbers
  for (let i = 1; i < frames.length; i++) for (let j = 0; j < 10; j++) frames[i][j] = r(frames[i - 1][j] + wrap(frames[i][j] - frames[i - 1][j]), 3);
  return { fps: FPS, frames };
}

// ---------- kit/moves.js ----------
const BEGIN = '// CLIPS:BEGIN', END = '// CLIPS:END';
export function readClips(src) {
  const a = src.indexOf(BEGIN), b = src.indexOf(END);
  if (a < 0 || b < a) throw new Error(`kit/moves.js has no ${BEGIN} … ${END} block`);
  const body = src.slice(a + BEGIN.length, b).trim().replace(/^Moves\.clips = /, '').replace(/;$/, '');
  return body ? JSON.parse(body) : {};
}
export function writeClips(src, clips) {
  const a = src.indexOf(BEGIN), b = src.indexOf(END);
  const lines = Object.entries(clips).map(([k, c]) => `  ${JSON.stringify(k)}: ${JSON.stringify(c)}`);
  return `${src.slice(0, a)}${BEGIN}\n  Moves.clips = {\n${lines.join(',\n')}\n  };\n  ${src.slice(b)}`;
}

async function load(src) {
  if (/^\d{1,3}_\d{1,3}$/.test(src)) {
    const [s] = src.split('_');
    src = `https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/${s.padStart(3, '0')}/${src}.bvh`;
  }
  if (/^https?:/.test(src)) { const r = await fetch(src); if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`); return r.text(); }
  return fs.readFileSync(src, 'utf8');
}

async function main(argv) {
  const src0 = fs.readFileSync(MOVES, 'utf8'), clips = readClips(src0);
  if (argv.includes('--list')) {
    for (const [k, c] of Object.entries(clips)) console.log(`${k.padEnd(12)} ${(c.frames.length / c.fps).toFixed(1).padStart(5)} s  ${c.source} ${c.from}–${c.to} s${c.mirror ? ' mirrored' : ''}  ${c.note || ''}`);
    return 0;
  }
  if (argv[0] === '--remove') {
    if (!clips[argv[1]]) { console.error(`no clip ${argv[1]}`); return 1; }
    delete clips[argv[1]]; fs.writeFileSync(MOVES, writeClips(src0, clips)); console.log('removed', argv[1]);
    return 0;
  }
  if (argv.includes('--rebuild')) { // after a change to this converter: every CMU clip again, same ranges
    for (const [k, c] of Object.entries(clips)) {
      const id = c.source.replace(/^CMU /, '');
      if (id === c.source) { console.log(`skip ${k}: not a CMU clip (${c.source}); add it again from its file`); continue; }
      clips[k] = { ...c, ...convert(parseBVH(await load(id)), c) };
      console.log('rebuilt', k);
    }
    fs.writeFileSync(MOVES, writeClips(src0, clips));
    return 0;
  }
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const pos = argv.filter((a, i) => !a.startsWith('--') && !['--from', '--to', '--note'].includes(argv[i - 1]));  const [name, src] = pos;
  if (!name || !src) { console.error('usage: mocap.mjs <name> <cmu id | url | file.bvh> [--from s] [--to s] [--mirror] [--note "…"] | --list'); return 1; }
  if (!/^[a-z][a-z0-9_]*$/.test(name)) { console.error(`name ${name}: use lower_case letters, digits, _`); return 1; }
  const bvh = parseBVH(await load(src)), dur = bvh.frames * bvh.dt;
  const range = { from: +(opt('--from') ?? 0), to: Math.min(dur, +(opt('--to') ?? dur)), mirror: argv.includes('--mirror') };
  const clip = convert(bvh, range);
  clips[name] = { source: /^\d+_\d+$/.test(src) ? `CMU ${src}` : path.basename(src), note: opt('--note') || '', ...range, ...clip };
  fs.writeFileSync(MOVES, writeClips(src0, clips));
  console.log(`${name}: ${(clip.frames.length / FPS).toFixed(2)} s of ${(bvh.frames * bvh.dt).toFixed(1)} s → kit/moves.js`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
