// THE SOUNDTRACK — EP3: every sound from score.js events + the voice lines in ./voice -> out/music.wav
//   node song.js            (STEMS=1 writes out/stem-*.wav, LUFS=-14 by default)
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev, SHOTS, VO_LAG } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drone = bus(), fx = bus(), hits = bus(), wind = bus(), heart = bus(), verb = bus(), vo = bus();

// ---------- bed: cold drone, cut during the blackout (only breath-quiet room tone there) ----------
for (const [t0, t1] of [[0, ev.blackout], [ev.lightsOn[0], DURATION]]) for (const n of ['A1', 'A#1', 'E2']) {
  const { L, R } = I.padNote(m(n), t1 - t0, { cutoff: 360, attack: t0 ? 0.8 : 2, release: 0.4, detune: 0.2 });
  drone.addStereo(L, R, t0, 0.22);
}
for (const [t0, t1, g] of [[ev.hits[2], ev.choice, 0.08]]) {
  const { L, R } = I.strings(m('A#5'), t1 - t0, { attack: 3, release: 1.5, bright: 0.3 });
  drone.addStereo(L, R, t0, g); verb.addStereo(L, R, t0, g * 0.6);
}

// ---------- outside wind (shots 3–4) ----------
wind.addMono(I.noiseSweep(9, 300, 900, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), 9, 0.25);

// ---------- fx tied to score events ----------
fx.addMono(I.tvClick(), ev.knobTurn, 0.5);
fx.addMono(I.noiseSweep(1.8, 900, 400, { q: 6 }), ev.doorOpen, 0.12); // door creak
for (const t of ev.drips) { fx.addMono(I.pop(1800), t, 0.25); verb.addMono(I.pop(1800), t, 0.2); }
for (const t of ev.blinks) fx.addMono(I.tvClick(), t, 0.4);
fx.addMono(I.thud(90, 0.06), ev.blackout, 0.6); // the lights die
fx.addMono(I.noiseSweep(0.7, 400, 2600, { q: 1, pink: true }), ev.passBy - 0.3, 0.35); // something passes
for (const t of ev.lightsOn) fx.addMono(I.ting(m('A5')), t, 0.12);
fx.addMono(I.noiseSweep(1.2, 300, 6000, { q: 2, pink: true }), ev.tapeRewind - 0.05, 0.18);
fx.addMono(I.noiseSweep(2.5, 200, 700, { q: 0.8, pink: true }), 89.2, 0.25); // breath on your neck (after the line)
for (const t of SHOTS.slice(1).map((s) => s.t)) if (!ev.hits.includes(t) && t !== ev.choice) fx.addMono(I.noiseSweep(0.4, 600, 2400, { q: 1, pink: true }), t - 0.2, 0.06);
for (const t of ev.hits) { hits.addMono(I.subBoom(2.0, 70, 32), t, 0.8); hits.addMono(I.thud(60, 0.09), t, 0.7); }
hits.addMono(I.subBoom(2.4, 60, 28), ev.choice, 0.6);

// ---------- heartbeat, speeding up ----------
for (let t = ev.heartbeat[0] + 0.3; t < ev.heartbeat[1] - 0.3;) {
  heart.addMono(I.heartbeat(), t, 0.7);
  t += 60 / (75 + 70 * (t - ev.heartbeat[0]) / (ev.heartbeat[1] - ev.heartbeat[0]));
}

// ---------- voice ----------
for (const s of SHOTS) {
  const f = path.join(__dirname, 'voice', `${String(s.t).padStart(3, '0')}.mp3`);
  if (fs.existsSync(f)) MIX.loadAudio(f, { at: s.t + VO_LAG, length: DURATION }).mixInto(vo, 1);
}

// ---------- mix ----------
MIX.duck([drone, wind, heart], vo, { depth: 0.55, release: 0.35 });
const stems = { drone, fx, hits, wind, heart, vo, verb: reverb(verb, { room: 0.88, damp: 0.4 }) };
const GAIN = { drone: 0.7, fx: 0.9, hits: 0.6, wind: 1.0, heart: 1.0, vo: 2.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 25);
MIX.gate(mix, ev.hits[3] + 1.6, ev.choice); // dead silence after the whisper, broken by the choice boom
MIX.fadeOut(mix, DURATION - 1.5, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)})`);
