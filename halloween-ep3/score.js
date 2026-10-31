// THE SCORE — EP3 "เปิด" (STORYBOARD.md). Single source of truth for sound and picture.
// Voice lines live in ./voice/<start>.mp3 (tts.py), played at start + VO_LAG.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const STYLE = 'paper';
  const clock = makeClock({ bpm: 90, offset: 0 });
  const { T, BEAT } = clock;
  const DURATION = 105;
  const VO_LAG = 0.3;

  // ElevenLabs default voices (free-plan API OK). The mimic whispers with Liam — same as fake Ton / Pob in EP2.
  const VOICE = { narr: '', bell: 'EXAVITQu4vr4xnSDxMaL', mimic: 'TX3LPaxmHKxFdv7VOQHJ' };

  // [start, Thai (\n = break), English, red?, voice key, eleven_v3 tag]
  const SHOTS = [
    [0, 'อย่าให้มันรู้\nว่าคุณรู้', "Don't let it know that you know.", true, 'narr', '[whispers]'],
    [4, 'มายด์ปล่อยมือ\nจากลูกบิด', 'Mind lets go of the knob.'],
    [9, 'เสียงทุบ\nหยุดไปเอง', 'The pounding just… stops.'],
    [14, 'กล้องหน้าบ้าน\nไม่เห็นใครเลย', 'The door camera shows no one.'],
    [18, 'แต่ในบ้าน\nมีรอยเท้าเปียก', 'But inside, there are wet footprints.'],
    [23, 'ผีปอบหายไปแล้ว', 'Pob is gone.', true, 'narr', '[whispers]'],
    [28, '"เดี๋ยวนะ\nต้นไปไหน"', '"Wait… where did Ton go?"', false, 'bell', '[nervous]'],
    [32, 'ไฟดับ', 'The lights go out.'],
    [36, 'มีอะไรเดินผ่าน\nตรงหน้าคุณ', 'Something walks right past you.', false, 'narr', '[whispers]'],
    [41, 'ไฟกลับมา', 'The lights come back.'],
    [45, 'ทุกคนยังอยู่ครบ…', "Everyone's still here…"],
    [50, 'รอยเท้าหยุดอยู่ตรงนี้', 'The footprints stop right here.'],
    [55, 'มีคนหนึ่งในนี้\nไม่ใช่เพื่อนคุณ', 'One of them is not your friend.', true, 'narr', '[whispers]'],
    [60, 'มายด์?', 'Mind?'],
    [64, 'ฝน?', 'Fon?'],
    [68, 'ปิ่น?', 'Pin?'],
    [72, '"แกจำได้ไหม\nตอนต้นงานเขาเป็นยังไง"', '"Do you remember how they looked at the start?"', false, 'bell', '[whispers]'],
    [77, 'ลองนึกดีๆ', 'Think carefully.'],
    [82, 'ทั้งสามคน\nยิ้มให้คุณพร้อมกัน', 'All three smile at you at once.'],
    [87, 'แล้วมีเสียง\nกระซิบข้างหูคุณ', 'Then something whispers in your ear.', false, 'narr', '[whispers]'],
    [92, '"เห็นแล้วใช่ไหม"', '"You saw it, didn\'t you?"', true, 'mimic', '[whispers]'],
    [96, '', ''],
  ].map(([t, th, en, red, who, tag], i, all) => ({
    i: i + 1, t, end: i + 1 < all.length ? all[i + 1][0] : DURATION, th, en, red: !!red,
    who: who || 'narr', voice: VOICE[who || 'narr'] || '', tag: tag || '',
  }));
  const shotAt = (n) => SHOTS[n - 1].t;

  const ev = {
    // EP2 vote = "ไม่เปิด": Mind lets go, the pounding comes back and then just stops
    letGo: 4.2,
    knocks: [6.2, 6.8, 7.4, 8.0], // after the shot-2 line, before the shot-3 line
    drips: [18.6, 19.5, 20.6, 50.4, 51.6],
    blinks: [32.3, 32.9], // two flickers, then dark
    blackout: 33.6,
    passBy: 38.6, // a shape crosses in the dark (picture + whoosh), after the whispered line ends
    lightsOn: [41.2, 41.6, 42.0, 42.4],
    tapeRewind: 77,
    hits: [0, shotAt(6), shotAt(13), shotAt(21)],
    heartbeat: [82, 92],
    choice: shotAt(22),
  };

  const markers = {
    gone: { t: ev.hits[1], sync: 'av' },
    notfriend: { t: ev.hits[2], sync: 'av' },
    whisper: { t: ev.hits[3], sync: 'av' },
    blackout: { t: ev.blackout, sync: 'v' },
    choice: ev.choice,
  };

  const subtitles = SHOTS.filter((s) => s.th).map((s) => ({ t: s.t + 0.15, end: s.end, text: s.th, en: s.en, red: s.red }));
  const soundTags = [
    [6.1, 8.6, '[ ปัง! ปัง! ปัง! ]'], [32.2, 36, '[ ไฟช็อต… ]'], [38.5, 41, '[ ฟุ่บ ]'], [77, 82, '[ กรอเทปย้อน… ]'], [82.4, 87, '[ ตุบ… ตุบ… ]'],
  ].map(([t, end, text]) => ({ t, end, text }));

  // lights: flicker before the blackout, dark until they come back on one by one
  const flickerWindows = [[32, 33.6]];
  const lightOn = (t) => {
    if (t >= ev.blackout && t < ev.lightsOn[0]) return 0.05;
    if (t >= ev.lightsOn[0] && t < ev.lightsOn[3] + 0.3) return 0.25 + 0.75 * (ev.lightsOn.filter((x) => t >= x).length / 4);
    if (ev.blinks.some((b) => t >= b && t < b + 0.15)) return 0.15;
    return 1;
  };

  const SCORE = { lightOn, flickerWindows, STYLE, FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, m, VO_LAG, VOICE, SHOTS, shotAt, ev, markers, subtitles, soundTags };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
