// THE SOUNDTRACK — EP2A: every sound from score.js events + the voice lines in ./voice -> out/music.wav
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
const drone = bus(), fx = bus(), hits = bus(), hiss = bus(), heart = bus(), verb = bus(), vo = bus();

// ---------- bed: cold drone all the way; strings rise once Ton's message lands ----------
for (const n of ['A1', 'A#1', 'E2']) { const { L, R } = I.padNote(m(n), DURATION, { cutoff: 360, attack: 2, release: 2, detune: 0.2 }); drone.addStereo(L, R, 0, 0.22); }
for (const [t0, t1, g] of [[ev.linePing, ev.hits[1], 0.05], [ev.hits[1], ev.choice, 0.09]]) {
  const { L, R } = I.strings(m('A#5'), t1 - t0, { attack: 3, release: 1.5, bright: 0.3 });
  drone.addStereo(L, R, t0, g); verb.addStereo(L, R, t0, g * 0.6);
}

// ---------- fx tied to score events ----------
fx.addMono(I.woodTick(0.5), ev.maskOff, 0.6); fx.addMono(I.thud(140, 0.05), ev.maskOff + 0.05, 0.4); // wooden mask off
fx.addMono(I.ting(m('E6')), ev.linePing, 0.35);
fx.addMono(I.noiseSweep(1.2, 300, 6000, { q: 2, pink: true }), ev.tapeRewind - 0.05, 0.18); // tape rewind into the memories
for (const t of ev.flashbacks.slice(1)) fx.addMono(I.tvClick(), t, 0.5);
fx.addMono(I.noiseSweep(1.4, 200, 900, { q: 1, pink: true }), ev.windLift - 0.6, 0.2); // a draught under the cloak
fx.addMono(I.bell(660, 0.9), ev.doorbell, 0.35); verb.addMono(I.bell(660, 0.9), ev.doorbell, 0.2);
fx.addMono(I.bell(523, 1.2), ev.doorbell + 0.6, 0.35); verb.addMono(I.bell(523, 1.2), ev.doorbell + 0.6, 0.2);
for (const t of ev.steps) fx.addMono(I.woodTick(0.8), t, 0.35);
for (const t of ev.knocks) { fx.addMono(I.thud(70, 0.12), t, 1.0); fx.addMono(I.woodTick(0.4), t, 0.5); }
fx.addMono(I.tvClick(), ev.knob, 0.6);
for (const t of SHOTS.slice(1).map((s) => s.t)) if (!ev.hits.includes(t)) fx.addMono(I.noiseSweep(0.4, 600, 2400, { q: 1, pink: true }), t - 0.2, 0.07);
for (const t of ev.hits) { hits.addMono(I.subBoom(2.0, 70, 32), t, 0.8); hits.addMono(I.thud(60, 0.09), t, 0.7); }
hits.addMono(I.subBoom(2.4, 60, 28), ev.choice, 0.6);

// ---------- door camera hiss (shots 16 and 21) ----------
for (const n of [16, 21]) { const s = SHOTS[n - 1]; hiss.addMono(I.noiseSweep(s.end - s.t, 2500, 3500, { q: 0.6, shape: () => 1 }), s.t, 0.05); }

// ---------- heartbeat, speeding up ----------
for (let t = ev.heartbeat[0] + 0.3; t < ev.heartbeat[1];) {
  heart.addMono(I.heartbeat(), t, 0.7);
  t += 60 / (75 + 70 * (t - ev.heartbeat[0]) / (ev.heartbeat[1] - ev.heartbeat[0]));
}

// ---------- voice ----------
for (const s of SHOTS) {
  const f = path.join(__dirname, 'voice', `${String(s.t).padStart(3, '0')}.mp3`);
  if (fs.existsSync(f)) MIX.loadAudio(f, { at: s.t + VO_LAG, length: DURATION }).mixInto(vo, 1);
}

// ---------- mix ----------
MIX.duck([drone, hiss, heart], vo, { depth: 0.55, release: 0.35 });
const stems = { drone, fx, hits, hiss, heart, vo, verb: reverb(verb, { room: 0.88, damp: 0.4 }) };
const GAIN = { drone: 0.7, fx: 0.9, hits: 0.6, hiss: 1.0, heart: 1.0, vo: 2.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 25);
MIX.fadeOut(mix, DURATION - 1.5, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)})`);
