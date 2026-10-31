// LONG-FORM DEMO sound: a soft e-piano loop the whole way, a ting + whoosh on each chapter card, a pop as each
// keyword box appears, footsteps in the walk chapter -> out/music.wav
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const S = require('./score');
const N = Math.ceil(S.DURATION * SR), keys = new Bus(N), fx = new Bus(N), verb = new Bus(N);
const CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
for (let t = 0, k = 0; t < S.DURATION - 1; t += 2.4, k++) for (const m of CH[k % 4]) { const n = I.epiano(m, 2.2, { index: 0.8 }); keys.addMono(n, t, 0.11, (m % 3 - 1) * 0.3); verb.addMono(n, t, 0.05); }
for (const c of S.chapters) if (c.cardDur) { fx.addMono(I.noiseSweep(0.5, 500, 2800, { q: 1, pink: true }), c.start, 0.14); fx.addMono(I.ting(86 + c.n), c.start + 0.4, 0.35); }
for (const s of S.subtitles) { const kw = (s.text.match(/\*/g) || []).length / 2; for (let k = 0; k < kw; k++) fx.addMono(I.pop(1500 + k * 300, k), s.t + 0.15 + k * 0.25, 0.25); }
const walk = S.chapters.find((c) => c.id === 'walk');
for (let t = walk.start + 0.3; t < walk.end - 0.3; t += 1 / (1.6 * 2)) fx.addMono(I.thud(150, 0.04), t, 0.12);
const mix = MIX.mixdown({ keys, fx, verb: reverb(verb, { room: 0.8 }) }, { keys: 1, fx: 1, verb: 0.7 });
MIX.fadeOut(mix, S.DURATION - 1.5, S.DURATION);
const M = MIX.master(mix, 0.8, 0.84, { lufs: -14 });
MIX.writeWav(path.join(__dirname, 'out', 'music.wav'), mix);
console.log(`wrote out/music.wav ${S.DURATION}s, ${M.lufs.toFixed(1)} LUFS`);
