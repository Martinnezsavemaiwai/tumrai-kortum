// THE SOUNDTRACK — EP4: every sound from score.js events + the voice lines in ./voice -> out/music.wav
//   node song.js            (STEMS=1 writes out/stem-*.wav, LUFS=-14 by default)
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev, SHOTS, VO_LAG, shotAt } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drone = bus(), box = bus(), fx = bus(), hits = bus(), heart = bus(), verb = bus(), vo = bus();

// ---------- bed: cold drone, dropping out for the relief (shot 5), back when Bell doesn't laugh ----------
for (const [t0, t1] of [[0, shotAt(5)], [shotAt(6), DURATION]]) for (const n of ['A1', 'A#1', 'E2']) {
  const { L, R } = I.padNote(m(n), t1 - t0, { cutoff: 360, attack: t0 ? 1.5 : 2, release: 0.4, detune: 0.2 });
  drone.addStereo(L, R, t0, 0.22);
}
for (const [t0, t1, g] of [[ev.hits[1], shotAt(13), 0.06], [shotAt(15), ev.hits[2], 0.09]]) {
  const { L, R } = I.strings(m('A#5'), t1 - t0, { attack: 3, release: 1.5, bright: 0.3 });
  drone.addStereo(L, R, t0, g); verb.addStereo(L, R, t0, g * 0.6);
}

// ---------- music box: warm in the relief (shot 5), then slowing and going flat (shot 6) ----------
const TUNE = ['E5', 'A5', 'C6', 'B5', 'A5', 'E5', 'F5', 'E5', 'D5', 'C5', 'B4', 'C5', 'E5', 'A4', 'B4', 'C5', 'E5', 'D5', 'C5', 'A4'];
for (let k = 0, t = shotAt(5) + 0.2; k < TUNE.length && t < shotAt(7) - 0.5; k++) {
  const sour = Math.max(0, t - shotAt(6)) / 5; // 0 → 1 over shot 6
  const note = m(TUNE[k]) - 0.7 * sour;
  box.addMono(I.musicBox(note, { decay: 1.2 }), t, 0.35); verb.addMono(I.musicBox(note), t, 0.15);
  t += 0.42 + 0.35 * sour;
}

// ---------- fx tied to score events ----------
fx.addMono(I.paperFwip(0.8), ev.point, 0.3); // your sleeve as the hand comes up
fx.addMono(I.noiseSweep(ev.sheetRise[1] - ev.sheetRise[0], 300, 1800, { q: 1, pink: true }), ev.sheetRise[0], 0.22); // cloth lifting
fx.addMono(I.paperFwip(1.3), ev.sheetRise[0] + 1.2, 0.2); // the flower drops
fx.addMono(I.thud(80, 0.1), ev.collapse, 0.8); fx.addMono(I.noiseSweep(0.35, 2400, 300, { q: 0.8, pink: true }), ev.collapse - 0.05, 0.45); // ฟุ่บ
for (const t of ev.claps) { fx.addMono(I.clap({ decay: 0.12 }), t, 0.55); verb.addMono(I.clap(), t, 0.4); }
fx.addMono(I.ting(m('E6')), shotAt(10) + 0.4, 0.15); // the phone lights up
fx.addMono(I.noiseSweep(1.2, 300, 6000, { q: 2, pink: true }), ev.tapeRewind - 0.05, 0.22);
fx.addMono(I.tvClick(), shotAt(15) + 1, 0.4); // the timer is set
for (const t of ev.steps) fx.addMono(I.thud(110, 0.05), t, 0.45);
for (const t of ev.tripodBeeps) fx.addMono(I.pulse(m('A6'), 0.07, { duty: 0.5, decay: 0.05 }), t, 0.12);
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
MIX.duck([drone, box, heart], vo, { depth: 0.55, release: 0.35 });
const stems = { drone, box, fx, hits, heart, vo, verb: reverb(verb, { room: 0.88, damp: 0.4 }) };
const GAIN = { drone: 0.7, box: 0.8, fx: 0.9, hits: 0.6, heart: 1.0, vo: 2.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 25);
MIX.gate(mix, ev.hits[2] + VO_LAG + 2.9, ev.choice); // dead silence after "ยิ้มด้วย", broken by the choice boom
MIX.fadeOut(mix, DURATION - 1.5, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)})`);
