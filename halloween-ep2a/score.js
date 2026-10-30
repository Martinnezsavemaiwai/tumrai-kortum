// THE SCORE — EP2A "ถอด" (STORYBOARD.md). Single source of truth for sound and picture.
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
  const DURATION = 106;
  const VO_LAG = 0.3;

  // ElevenLabs premade voices. Ton outside and Pob on the sofa share ONE voice (the clue).
  const VOICE = { narr: '', bell: 'EXAVITQu4vr4xnSDxMaL', ton: 'TX3LPaxmHKxFdv7VOQHJ' }; // Sarah, Liam (default voices: free-plan API OK)

  // [start, Thai (\n = break), English, red?, voice key, eleven_v3 tag]
  const SHOTS = [
    [0, 'อย่ามองชายชุด\nของเพื่อน', "Don't look at the hem of their costumes.", true, 'narr', '[whispers]'],
    [4, 'คุณถอดหน้ากาก', 'You take off the mask.'],
    [8, 'หน้าคุณเอง', "It's just your face."],
    [12, '"ตายแล้ว ลืมแอด\nแกเข้ากลุ่ม"', '"Oh no, I forgot to add you to the chat."', false, 'bell', '[laughs]'],
    [17, 'ทุกคนโล่งใจ', 'Everyone breathes again.'],
    [21, 'แต่ถ้าคุณ\nคือคนที่แปด', "But if you're the eighth…"],
    [25, 'แล้วผ้าขาวเป็นใคร', '…who was the white sheet?'],
    [29, '', ''],
    [31, '"โทษทีนะ รถติดมาก\nเพิ่งถึงหน้าบ้าน"', '"Sorry, traffic was awful. Just got to the gate."', false, 'ton'],
    [36, 'ต้นอยู่หน้าบ้าน', 'Ton is outside.'],
    [40, 'แล้วผีปอบที่นั่ง\nอยู่ตรงนี้ทั้งคืน…', 'Then who has been sitting here all night?', false, 'narr', '[nervous]'],
    [45, 'ทั้งคืนเขา\nไม่พูดสักคำ', 'He never said a word.'],
    [51, 'ชุดยาวจน\nไม่มีใครเห็นเท้า', 'The costume hid his feet.'],
    [56, 'ไม่มีเท้า\nอยู่ข้างใต้', 'There were no feet.', true, 'narr', '[whispers]'],
    [61, '', ''],
    [63, '"เปิดหน่อยดิ\nฝนตกแล้ว"', '"Open up, it\'s starting to rain."', false, 'ton'],
    [68, '', ''],
    [71, '"อย่าเปิด"', '"Don\'t open it."', true, 'ton', '[whispers]'],
    [75, 'เสียงเหมือนต้นเป๊ะ', 'It sounds exactly like Ton.', false, 'narr', '[scared]'],
    [80, '"ให้เข้าไป\nเดี๋ยวนี้!"', '"Let me in. Now!"', false, 'ton', '[shouting]'],
    [84, '', ''],
    [88, 'ต้นจริงมีได้\nแค่คนเดียว', 'Only one of them is the real Ton.'],
    [93, '', ''],
    [97, '', ''],
  ].map(([t, th, en, red, who, tag], i, all) => ({
    i: i + 1, t, end: i + 1 < all.length ? all[i + 1][0] : DURATION, th, en, red: !!red,
    who: who || 'narr', voice: VOICE[who || 'narr'] || '', tag: tag || '',
  }));
  const shotAt = (n) => SHOTS[n - 1].t;

  const ev = {
    maskOff: 4.4,
    linePing: 29.3,
    flashbacks: [45, 47, 49], // three sepia memories of EP1
    tapeRewind: 45,
    windLift: 56,
    doorbell: 61.3,
    steps: [68.4, 68.9, 69.4, 69.9, 70.4],
    knocks: [82.4, 82.9, 83.35], // after the shouted line ends
    knob: 93.6,
    hits: [0, shotAt(14), shotAt(18)],
    heartbeat: [88, 97],
    choice: shotAt(24),
  };

  const markers = {
    nofeet: { t: ev.hits[1], sync: 'av' },
    dontopen: { t: ev.hits[2], sync: 'av' },
    doorbell: { t: ev.doorbell, sync: 'a' },
    knock1: { t: ev.knocks[0], sync: 'av' },
    choice: ev.choice,
  };

  const subtitles = SHOTS.filter((s) => s.th).map((s) => ({ t: s.t + 0.15, end: s.end, text: s.th, en: s.en, red: s.red }));
  const soundTags = [
    [29.2, 31, '[ ติ๊ง! ]'], [45, 51, '[ กรอเทปย้อน... ]'], [61.2, 63, '[ ติ๊ง... ต่อง ]'], [82.3, 84, '[ ปัง! ปัง! ปัง! ]'], [88.4, 93, '[ ตุบ... ตุบ... ]'],
  ].map(([t, end, text]) => ({ t, end, text }));

  const flickerWindows = [[40, 45]];
  const lightOn = (t) => {
    if (!flickerWindows.some(([a, b]) => t >= a && t < b)) return 1;
    return Math.sin(t * 23) * Math.sin(t * 7.3) + Math.sin(t * 3.1) > 1.1 ? 0.15 : 1;
  };

  const SCORE = { lightOn, flickerWindows, STYLE, FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, m, VO_LAG, VOICE, SHOTS, shotAt, ev, markers, subtitles, soundTags };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
