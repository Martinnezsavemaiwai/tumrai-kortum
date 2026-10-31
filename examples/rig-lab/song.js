// EXPLAINER DEMO sound: soft e-piano chords (I–V–vi–IV), a pop as each keyword box appears, a ting on badges,
// a whoosh into each scene -> out/music.wav
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const S = require('./score');
const N = Math.ceil(S.DURATION * SR), keys = new Bus(N), fx = new Bus(N), verb = new Bus(N);
const CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
for (let t = 0, k = 0; t < S.DURATION - 1; t += 2.4, k++) for (const m of CH[k % 4]) { const n = I.epiano(m, 2.2, { index: 0.8 }); keys.addMono(n, t, 0.12, (m % 3 - 1) * 0.3); verb.addMono(n, t, 0.05); }
for (const s of S.subtitles) { const kw = (s.text.match(/\*/g) || []).length / 2; for (let k = 0; k < kw; k++) fx.addMono(I.pop(1500 + k * 300, k), s.t + 0.15 + k * 0.25, 0.3); }
for (const t of Object.values(S.scenes).slice(1)) fx.addMono(I.noiseSweep(0.4, 600, 2600, { q: 1, pink: true }), t - 0.2, 0.12);
for (const t of [S.scenes.field1 + 0.2, S.scenes.pov + 0.2]) fx.addMono(I.ting(86), t, 0.35);
fx.addMono(I.ting(91), S.scenes.end + 1.2, 0.4);
const mix = MIX.mixdown({ keys, fx, verb: reverb(verb, { room: 0.8 }) }, { keys: 1, fx: 1, verb: 0.7 });
MIX.fadeOut(mix, S.DURATION - 1.2, S.DURATION);
MIX.master(mix, 0.8, 0.84, { lufs: -14 });
MIX.writeWav(path.join(__dirname, 'out', 'music.wav'), mix);
console.log('wrote out/music.wav', S.DURATION + 's');
