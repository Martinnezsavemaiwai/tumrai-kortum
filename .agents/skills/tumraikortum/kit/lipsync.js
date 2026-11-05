// LIP-SYNC (node, for song.js) — a mouth track per character from the ElevenLabs lines in voice/, for R.draw's talk.
//   song.js:  require('./kit/lipsync').write(__dirname, SHOTS, { lag: VO_LAG, length: DURATION });   → out/mouth.json
//   film.js:  init() { S.mouth = await Studio.loadJSON('out/mouth.json'); }
//             R.draw(ctx, { ...R.act(t, keys), talk: Kit.talk(S.mouth, 'nok', t), … })        (kit/style.js)
// Each SHOTS row with a Thai line speaks as its `who` (default 'narr', a voice no one on screen lip-syncs to).
// The track is the engine's mouthTrack (loudness → open, bright/round vowel → wide) of that character's lines
// alone, so two characters in a shot each move only on their own lines.
const fs = require('fs');
const path = require('path');

// tts.py's file name for a line starting at t: the start rounded half up, 3 digits
const file = (dir, t) => path.join(dir, 'voice', `${String(Math.floor(t + 0.5)).padStart(3, '0')}.mp3`);

function tracks(dir, shots, { lag = 0, length, fps = 30 } = {}) {
  dir = path.resolve(dir);
  const { Bus, SR } = require(path.join(dir, 'engine', 'audio', 'dsp'));
  const MIX = require(path.join(dir, 'engine', 'audio', 'mix'));
  const { mouthTrack } = require(path.join(dir, 'engine', 'audio', 'voice'));
  const lines = shots.filter((s) => s.th && fs.existsSync(file(dir, s.t)));
  const end = length || Math.max(1, ...lines.map((s) => s.t + 30));
  const buses = {};
  for (const s of lines) {
    const who = s.who || 'narr';
    buses[who] = buses[who] || new Bus(Math.ceil(end * SR));
    MIX.loadAudio(file(dir, s.t), { at: s.t + lag, length: end }).mixInto(buses[who], 1);
  }
  const out = { fps, who: {} };
  for (const [who, b] of Object.entries(buses)) {
    const m = mouthTrack(b, fps);
    out.who[who] = { open: m.open.map((v) => +v.toFixed(2)), wide: m.wide.map((v) => +v.toFixed(2)) };
  }
  return out;
}

// writes out/mouth.json and returns it; lines without an mp3 yet are skipped (their characters stay quiet)
function write(dir, shots, o = {}) {
  const m = tracks(dir, shots, o);
  fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'out', 'mouth.json'), JSON.stringify(m));
  return m;
}

module.exports = { tracks, write, file };
