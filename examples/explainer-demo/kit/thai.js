// THAI KIT — Thai instruments, the Thai 7-tone scale and a few horror sounds, synthesized like engine/audio.
// Lives in <episode>/kit/ (new-episode.mjs copies it). In song.js:
//
//   const Thai = require('./kit/thai');
//   fx.addMono(Thai.ranat(Thai.scale(4)), t, 0.4);          // one ranat note, degree 4 of the Thai scale
//   Thai.chingCycle(perc, 10, 40, 72);                       // ching–chap on every beat from 10 s to 40 s
//   fx.addMono(Thai.gong(36), ev.hits[1], 0.6);
//
// Every function returns a mono Float32Array at engine SR (add with bus.addMono) unless it says otherwise.
//   node kit/thai.js out/thai-demo.wav     → a 30 s demo of everything + sanity checks (no NaN, no clipping)
const { SR, TAU, rng, Pink, SVF, OnePole } = require('../engine/audio/dsp');
const I = require('../engine/audio/instruments');
const { mtof } = require('../engine/music');

const buf = (sec) => new Float32Array(Math.max(1, Math.ceil(sec * SR)));

// Thai classical tuning: the octave split into 7 equal steps (≈171 cents). Degree 0 = root (MIDI, may be
// fractional), 7 = an octave up. PENTA = the five degrees most tunes use (like 1 2 3 5 6).
const STEP = 12 / 7;
const scale = (deg, root = 62) => root + deg * STEP;
const PENTA = [0, 1, 2, 4, 5];
const penta = (k, root = 62) => scale(PENTA[((k % 5) + 5) % 5] + 7 * Math.floor(k / 5), root);

// ระนาดเอก: hard wooden bar hit by a hard mallet — bright, short, a strong click
function ranat(midi, { decay = 0.22, hard = 1, seed = 1 } = {}) {
  const f = mtof(midi), out = buf(decay * 5), w = rng(seed + Math.round(midi * 10)), hp = new OnePole();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let s = Math.sin(TAU * f * t) * Math.exp(-t / decay);
    s += 0.5 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t / (decay * 0.35));
    s += 0.25 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t / (decay * 0.12));
    s += hp.hp(w(), 2500) * Math.exp(-t / 0.004) * 0.6 * hard;
    out[i] = s * Math.min(1, t / 0.0008) * 0.6;
  }
  return out;
}

// ระนาด "กรอ": a tremolo roll in octaves (the sound of a Thai ghost film), rate in hits per second
function ranatRoll(midi, dur, { rate = 13, seed = 1 } = {}) {
  const out = buf(dur + 1);
  for (let k = 0, t = 0; t < dur; k++, t = k / rate) {
    const hit = ranat(midi + (k % 2 ? 12 : 0), { decay: 0.16, hard: 0.6, seed: seed + k });
    const g = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t / dur)); // swell in and out
    const at = Math.round(t * SR);
    for (let i = 0; i < hit.length && at + i < out.length; i++) out[at + i] += hit[i] * g * 0.6;
  }
  return out;
}

// ขิม: hammered dulcimer — three slightly detuned strings per note, a soft felt hammer, long ring
function khim(midi, { decay = 1.6, seed = 1 } = {}) {
  const f = mtof(midi), out = buf(decay * 4), w = rng(seed), lp = new OnePole();
  const det = [1, 1.0021, 0.9984];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let s = 0;
    for (const d of det) {
      s += Math.sin(TAU * f * d * t) * Math.exp(-t / decay);
      s += 0.35 * Math.sin(TAU * f * d * 2.003 * t) * Math.exp(-t / (decay * 0.45));
      s += 0.15 * Math.sin(TAU * f * d * 3.01 * t) * Math.exp(-t / (decay * 0.2));
    }
    s += lp.lp(w(), 1800) * Math.exp(-t / 0.006) * 2;
    out[i] = s * Math.min(1, t / 0.002) * 0.22;
  }
  return out;
}

// แคน: free-reed mouth organ. A chord held for dur, pulsing with the player's breath (in/out at ~breath Hz).
// Returns { L, R } like I.harmonium — add with bus.addStereo.
function khaen(midis, dur, { breath = 1.6, bright = 0.5, seed = 1 } = {}) {
  const len = dur + 0.4, L = buf(len), R = buf(len);
  midis.forEach((m, k) => {
    const h = I.harmonium(m, dur, { attack: 0.12, release: 0.3, bright, detune: 7, seed: seed + k });
    for (let i = 0; i < h.L.length && i < L.length; i++) { L[i] += h.L[i] / midis.length; R[i] += h.R[i] / midis.length; }
  });
  for (let i = 0; i < L.length; i++) { // breath pulse; a small dip where the breath turns
    const ph = (i / SR) * breath, g = 0.7 + 0.3 * Math.abs(Math.sin(Math.PI * ph));
    L[i] *= g; R[i] *= g;
  }
  return { L, R };
}

// ปี่ใน: the Thai quadruple-reed oboe — close to the engine's shehnai, more nasal and with a wider vibrato.
// notes: [{ t, dur, midi }] (use scale()/penta() for midi)
const pi = (notes, opts = {}) => I.shehnaiLine(notes, { vib: 0.45, vibRate: 5.8, glide: 0.11, bright: 0.85, breath: 0.06, ...opts });

// ฉิ่ง: small cup cymbals. open = "ฉิ่ง" (rings), closed = "ฉับ" (damped)
function ching(open = true, { seed = 1 } = {}) {
  const decay = open ? 1.3 : 0.06, out = buf(decay * 4 + 0.05), w = rng(seed), hp = new OnePole();
  const parts = [[2650, 1], [3890, 0.7], [5520, 0.45], [7810, 0.3], [9300, 0.15]];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let s = 0;
    for (const [fr, a] of parts) s += Math.sin(TAU * fr * t) * a * Math.exp(-t / (decay * (1.2 - a * 0.4)));
    s += hp.hp(w(), 5000) * Math.exp(-t / 0.003) * 0.8;
    out[i] = s * Math.min(1, t / 0.0005) * 0.3;
  }
  return out;
}
// the ching–chap time cycle: chap on the beat, ching on the off-beat, from t0 to t1 at bpm, into a Bus
function chingCycle(bus, t0, t1, bpm = 72, gain = 0.25, pan = 0.3) {
  const beat = 60 / bpm, o = ching(true), c = ching(false);
  for (let t = t0, k = 0; t < t1; t += beat / 2, k++) bus.addMono(k % 2 ? o : c, t, gain * (k % 2 ? 1 : 0.8), pan);
}

// กลองทัด: big barrel drum, deep boom with a falling pitch
function klong(midi = 38, { decay = 0.7, seed = 1 } = {}) {
  const f0 = mtof(midi), out = buf(decay * 4), w = rng(seed), lp = new OnePole();
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR, f = f0 * (1 + 0.5 * Math.exp(-t / 0.03));
    ph += f / SR;
    let s = Math.sin(TAU * ph) * Math.exp(-t / decay) + 0.3 * Math.sin(TAU * ph * 1.58) * Math.exp(-t / (decay * 0.3));
    s += lp.lp(w(), 700) * Math.exp(-t / 0.01) * 1.5;
    out[i] = Math.tanh(s * 1.3) * 0.7;
  }
  return out;
}

// ฆ้อง / โหม่ง: bossed gong — a hum that beats against itself, very long
function gong(midi = 40, { decay = 4.5, seed = 1 } = {}) {
  const f = mtof(midi), out = buf(decay * 3), w = rng(seed), lp = new OnePole();
  const parts = [[1, 1, 1], [1.006, 0.8, 1], [2.02, 0.35, 0.5], [2.98, 0.22, 0.3], [4.1, 0.1, 0.15]];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let s = 0;
    for (const [r, a, d] of parts) s += Math.sin(TAU * f * r * t * (1 - 0.004 * Math.exp(-t / 0.3))) * a * Math.exp(-t / (decay * d));
    s += lp.lp(w(), 400) * Math.exp(-t / 0.02) * 2;
    out[i] = s * Math.min(1, t / 0.004) * 0.32;
  }
  return out;
}

// ระฆังวัด: a big temple bell far away — bell partials (hum, prime, tierce…), slow beating, long tail
function templeBell(midi = 45, { decay = 6, seed = 1 } = {}) {
  const f = mtof(midi), out = buf(decay * 2.5), w = rng(seed), bp = new SVF();
  const parts = [[0.5, 0.8, 1.4], [1, 1, 1], [1.19, 0.6, 0.6], [1.5, 0.45, 0.45], [2, 0.5, 0.35], [2.51, 0.25, 0.2], [3.0, 0.2, 0.12]];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let s = 0;
    for (const [r, a, d] of parts) s += Math.sin(TAU * f * r * t) * a * Math.exp(-t / (decay * d)) * (1 + 0.15 * Math.sin(TAU * 0.9 * r * t));
    s += bp.bp(w(), f * 4, 2) * Math.exp(-t / 0.01) * 1.5; // the striker
    out[i] = s * Math.min(1, t / 0.003) * 0.22;
  }
  return out;
}

// wind through gaps: pink noise through a resonant band that drifts and howls. len seconds
function wind(len, { howl = 1, seed = 1 } = {}) {
  const out = buf(len), p = new Pink(seed), a = new SVF(), b = new SVF();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const drift = Math.sin(TAU * 0.07 * t + seed) * 0.5 + Math.sin(TAU * 0.19 * t + 2 * seed) * 0.3;
    const n = p.next();
    const s = a.bp(n, 380 + 260 * drift, 6 * howl) * 1.2 + b.lp(n, 600) * 0.6;
    const env = Math.min(1, t / 1.5, (len - t) / 1.5) * (0.7 + 0.3 * Math.sin(TAU * 0.11 * t));
    out[i] = s * Math.max(0, env) * 1.6;
  }
  return out;
}

// a whisper with no words: breathy formant noise in syllables. len seconds
function whisper(len, { seed = 1, rate = 5 } = {}) {
  const out = buf(len), w = rng(seed), f1 = new SVF(), f2 = new SVF(), hp = new OnePole();
  const syl = rng(seed + 9);
  let next = 0, a = 0, fa = 700, fb = 1800, target = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    if (t >= next) { // a new syllable: new vowel shape, sometimes a pause
      target = Math.abs(syl()) > 0.25 ? 1 : 0;
      fa = 500 + Math.abs(syl()) * 500; fb = 1400 + Math.abs(syl()) * 1200;
      next = t + (0.6 + Math.abs(syl()) * 0.8) / rate;
    }
    a += (target - a) * 0.0015;
    const n = w(), sib = hp.hp(n, 5000) * 0.25;
    out[i] = (f1.bp(n, fa, 5) + f2.bp(n, fb, 6) * 0.7 + sib) * a * Math.min(1, t / 0.2, (len - t) / 0.2) * 0.9;
  }
  return out;
}

module.exports = { STEP, scale, PENTA, penta, ranat, ranatRoll, khim, khaen, pi, ching, chingCycle, klong, gong, templeBell, wind, whisper };

// ---------- demo + self-check: node kit/thai.js [out.wav] ----------
if (require.main === module) {
  const { Bus } = require('../engine/audio/dsp');
  const MIX = require('../engine/audio/mix');
  const file = process.argv[2] || 'out/thai-demo.wav';
  const b = new Bus(Math.ceil(32 * SR));
  const tune = [0, 1, 2, 4, 2, 1, 0, -1, 0, 2, 4, 5, 4, 2, 1, 0]; // a little pentatonic tune, degrees of penta()
  tune.forEach((k, i) => b.addMono(ranat(penta(k, 74)), 0.3 + i * 0.25, 0.45, -0.2));      //  0– 4 s ranat
  b.addMono(ranatRoll(penta(0, 74), 2.5), 4.4, 0.4);                                         //  4– 7 s ranat roll
  tune.forEach((k, i) => b.addMono(khim(penta(k, 67)), 7.2 + i * 0.3, 0.5, 0.2));            //  7–12 s khim
  { const { L, R } = khaen([scale(0, 50), scale(4, 50), scale(7, 50), scale(9, 50)], 4); b.addStereo(L, R, 12.2, 0.9); } // 12–16 s khaen
  b.addMono(pi(tune.slice(0, 8).map((k, i) => ({ t: i * 0.45, dur: 0.42, midi: penta(k, 67) }))), 16.5, 0.6); // 16–20 s pi
  chingCycle(b, 16.5, 20.2, 80, 0.3);
  [0, 0.8, 1.6, 2.0].forEach((d, i) => b.addMono(klong(38, { seed: i }), 20.6 + d, 0.6));    // 20–23 s klong
  b.addMono(gong(40), 23.2, 0.6);                                                             // 23 s gong
  b.addMono(templeBell(45), 25.4, 0.6);                                                       // 25 s temple bell
  b.addMono(wind(5), 26.5, 0.5, -0.4); b.addMono(whisper(3, { seed: 4 }), 28.3, 0.5, 0.5);     // 26–31 s wind + whisper
  let peak = 0;
  for (const ch of [b.L, b.R]) for (const x of ch) { if (!Number.isFinite(x)) throw new Error('NaN in demo mix'); peak = Math.max(peak, Math.abs(x)); }
  if (peak < 0.05 || peak > 1.5) throw new Error(`demo peak ${peak.toFixed(3)} out of range`);
  if (Math.abs(scale(7) - scale(0) - 12) > 1e-9) throw new Error('scale(7) is not an octave');
  MIX.master(b, 0.8, 0.84, { lufs: -14 });
  MIX.writeWav(file, b);
  console.log(`ok: ${file} (raw peak ${peak.toFixed(2)}, mastered to -14 LUFS)`);
}
