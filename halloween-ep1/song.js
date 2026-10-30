// THE SOUNDTRACK — every sound from score.js events + the Thai voiceover (../voice) -> out/music.wav
//   node song.js            (STEMS=1 writes out/stem-*.wav, LUFS=-14 masters to a loudness)
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev, SHOTS, VO_LAG } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drone = bus(), box = bus(), fx = bus(), hits = bus(), buzz = bus(), heart = bus(), verb = bus(), vo = bus();

// ---------- bed: low detuned drone everywhere except the silent beat after the flash ----------
const pads = [[0, ev.flash], [ev.flash + 2, DURATION]];
for (const [t0, t1] of pads) for (const n of ['A1', 'A#1', 'E2']) {
  const { L, R } = I.padNote(m(n), t1 - t0, { cutoff: 380, attack: 2.5, release: 2, detune: 0.2 });
  drone.addStereo(L, R, t0, 0.22);
}
// high strings creep in from the white sheet onward, louder after the flash
for (const [t0, t1, g] of [[28, ev.flash, 0.05], [ev.flash + 2, ev.choice, 0.09]]) {
  const { L, R } = I.strings(m('A#5'), t1 - t0, { attack: 4, release: 1.5, bright: 0.3 });
  drone.addStereo(L, R, t0, g); verb.addStereo(L, R, t0, g * 0.6);
}

// ---------- party music box (detunes as it goes) ----------
for (const n of sc.musicbox) { const b = I.musicBox(n.midi - n.detune, { decay: 0.9 }); box.addMono(b, n.t, 0.22); verb.addMono(b, n.t, 0.2); }

// ---------- fx tied to score events ----------
for (const t of ev.lanterns) fx.addMono(I.pop(700), t, 0.35);
for (const t of ev.chatPing) fx.addMono(I.ting(m('E6')), t, 0.25);
fx.addMono(I.pop(1400), ev.rulePop, 0.4);
fx.addMono(I.bell(660, 0.9), ev.doorbell, 0.35); verb.addMono(I.bell(660, 0.9), ev.doorbell, 0.2);
fx.addMono(I.bell(523, 1.2), ev.doorbell + 0.6, 0.35); verb.addMono(I.bell(523, 1.2), ev.doorbell + 0.6, 0.2);
fx.addMono(I.noiseSweep(0.9, 300, 1500, { q: 2, pink: true }), ev.doorOpen, 0.2); // door creak-ish
for (const t of ev.arrivals) fx.addMono(I.woodTick(0.7), t, 0.4);
for (let k = 0; k < 5; k++) fx.addMono(I.woodTick(1.6), 41 + k, 0.25); // clock
for (const t of ev.timerBeeps) fx.addMono(I.ting(m('A6')), t, 0.18);
fx.addMono(I.tvClick(), ev.flash, 0.9); // shutter click on the flash frame
fx.addMono(I.noiseSweep(1.2, 9000, 3000, { q: 3 }), ev.flash + 0.02, 0.12); // flash whine
for (const t of SHOTS.slice(1).map((s) => s.t)) if (!ev.hits.includes(t) && t !== ev.flash) fx.addMono(I.noiseSweep(0.4, 600, 2400, { q: 1, pink: true }), t - 0.2, 0.08); // soft whoosh into each cut
for (const t of ev.counts) fx.addMono(I.woodTick(1.2), t, 0.35);
for (const t of [0, ...ev.hits]) { hits.addMono(I.subBoom(2.0, 70, 32), t, 0.8); hits.addMono(I.thud(60, 0.09), t, 0.7); }
// dissonant scare chord when the sheet is gone
for (const n of ['D#4', 'E4', 'A#4', 'B4']) { const { L, R } = I.strings(m(n), 2.6, { attack: 0.01, release: 1.2, bright: 0.8 }); hits.addStereo(L, R, ev.gone, 0.12); verb.addStereo(L, R, ev.gone, 0.1); }
hits.addMono(I.subBoom(2.4, 60, 28), ev.choice, 0.6);

// ---------- light buzz (gated like the flicker in the picture) ----------
const hum = I.pulse(m('G2'), ev.flicker[1] - ev.flicker[0], { duty: 0.3 });
buzz.addMono(hum, ev.flicker[0], 0.08);
buzz.applyGain((t) => (sc.lightOn(t) < 1 ? 0 : 1)); // the hum drops out with the light

// ---------- heartbeat, speeding up ----------
for (let t = ev.heartbeat[0] + 0.4; t < ev.heartbeat[1];) {
  heart.addMono(I.heartbeat(), t, 0.7);
  const u = (t - ev.heartbeat[0]) / (ev.heartbeat[1] - ev.heartbeat[0]);
  t += 60 / (70 + 70 * u);
}

// ---------- Thai voiceover (ElevenLabs files made by ../tts_ep1.py) ----------
const VDIR = path.join(__dirname, '..', 'voice');
for (const s of SHOTS) {
  const f = path.join(VDIR, `ep1-${String(s.t).padStart(3, '0')}.mp3`);
  if (fs.existsSync(f)) MIX.loadAudio(f, { at: s.t + VO_LAG, length: DURATION }).mixInto(vo, 1);
}

// ---------- mix ----------
MIX.duck([drone, box, buzz, heart], vo, { depth: 0.55, release: 0.35 });
const stems = { drone, box, fx, hits, buzz, heart, vo, verb: reverb(verb, { room: 0.88, damp: 0.4 }) };
// voice on top (measured with STEMS=1 + engine/tools/levels.js): music box and drone sit ~8 dB under it
const GAIN = { drone: 0.7, box: 0.45, fx: 0.9, hits: 0.6, buzz: 1.0, heart: 1.0, vo: 2.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 25);
MIX.gate(mix, ev.flash + 0.35, ev.hits[0]); // dead silence after the shutter, broken only by the "eight" hit
MIX.fadeOut(mix, DURATION - 1.5, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
