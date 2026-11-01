// THE SCORE — EP4 "ครบแปด" (STORYBOARD.md). Single source of truth for sound and picture.
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
  const GENRE = 'horror';
  const clock = makeClock({ bpm: 90, offset: 0 });
  const { T, BEAT } = clock;
  const DURATION = 105;
  const VO_LAG = 0.3;

  // ElevenLabs default voices (free-plan API OK)
  const VOICE = { narr: '', bell: 'EXAVITQu4vr4xnSDxMaL' };
  const scenes = { room: { sides: {} }, memory: { sides: {} } }; // camera = your eyes, facing Bell; nobody crosses the line

  // [start, Thai (\n = break), English, red?, voice, tag, shot, on, move, in, scene]
  const SHOTS = [
    [0, 'อย่าเป็น\nคนที่แปด', "Don't be the eighth.", true, 'narr', '[whispers]', 'WS', 'group', 'static', 'cut', 'room'],
    [4, 'คุณชี้ไปที่…', 'You point at…', false, 'narr', '', 'MS', 'you', 'push', 'cut', 'room'],
    [8, 'ไม่ว่าคุณจะชี้ใคร\nมันก็เผยตัวเอง', 'Whoever you point at, it shows itself.', false, 'narr', '[whispers]', 'MS', 'mimic', 'push', 'cut', 'room'],
    [14, 'แล้วมันก็ยุบ\nลงไปกับพื้น', 'Then it collapses to the floor.', false, 'narr', '', 'CU', 'floor', 'static', 'cut', 'room'],
    [19, 'ทุกคนโล่งใจ', 'Everyone breathes again.', false, 'narr', '', 'WS', 'group', 'static', 'cut', 'room'],
    [24, 'มีแค่เบล\nที่ไม่หัวเราะ', 'Only Bell is not laughing.', false, 'narr', '[whispers]', 'CU', 'bell', 'static', 'cut', 'room'],
    [29, '"ขอบคุณที่ช่วยนับนะ"', '"Thanks for helping me count."', false, 'bell', '[softly]', 'MS', 'bell', 'push', 'cut', 'room'],
    [34, '"ปีนี้ครบแปดพอดี"', '"This year we have exactly eight."', true, 'bell', '[softly]', 'MCU', 'bell', 'static', 'cut', 'room'],
    [39, 'ครบแปด?', 'Eight?', false, 'narr', '[nervous]', 'MLS', 'group', 'static', 'cut', 'room'],
    [43, '"ทุกปี\nต้องมีคนจ่ายค่าเข้า"', '"Every year, someone pays the entry fee."', false, 'bell', '', 'MS', 'bell', 'static', 'cut', 'room'],
    [48, 'รูปปีที่แล้ว\nก็มีแปดคน', "Last year's photo had eight too.", false, 'narr', '', 'CU', 'phone', 'push', 'cut', 'room'],
    [53, 'คนที่แปด\nใส่ชุดเดียวกับคุณ', 'The eighth wore the same costume as you.', false, 'narr', '[whispers]', 'ECU', 'photo', 'static', 'cut', 'room'],
    [58, 'เบลไม่เคยนับตัวเอง\nไม่เคยแอดคุณเข้ากลุ่ม', 'Bell never counted herself. Never added you to the chat.', false, 'narr', '', 'MS', 'bell', 'static', 'dip', 'memory'],
    [63, 'และเป็นคนชวนให้คุณ\nสงสัยคนอื่น', 'And she was the one who made you suspect the others.', false, 'narr', '', 'CU', 'bell', 'static', 'cut', 'memory'],
    [68, '"มาถ่ายรูปกัน\nอีกรูปนะ"', '"Let\'s take one more photo."', false, 'bell', '[cheerfully]', 'MS', 'bell', 'static', 'dip', 'room'],
    [73, 'ทุกคนเดินไป\nยืนเรียงกันเอง', 'Everyone lines up on their own.', false, 'narr', '', 'WS', 'group', 'static', 'cut', 'room'],
    [78, 'ขาของคุณ\nเริ่มก้าวเอง', 'Your legs start walking by themselves.', false, 'narr', '[whispers]', 'MS', 'you', 'drift', 'cut', 'room'],
    [83, 'มือถืออยู่ห่าง\nแค่เอื้อม', 'The phone is just within reach.', false, 'narr', '[whispers]', 'MCU', 'phone', 'static', 'cut', 'room'],
    [88, '', '', false, 'narr', '', 'ECU', 'bell', 'static', 'cut', 'room'],
    [92, '"อย่าขยับนะ\nยิ้มด้วย"', '"Don\'t move. And smile."', true, 'bell', '[softly]', 'MCU', 'bell', 'static', 'cut', 'room'],
    [96, '', '', false, 'narr', '', 'FS', 'screen', 'static', 'dip', 'room'],
  ].map(([t, th, en, red, who, tag, shot, on, move, inn, scene], i, all) => ({
    i: i + 1, t, end: i + 1 < all.length ? all[i + 1][0] : DURATION, th, en, red: !!red,
    who: who || 'narr', voice: VOICE[who || 'narr'] || '', tag: tag || '', shot, on, move, in: inn, scene,
  }));
  const shotAt = (n) => SHOTS[n - 1].t;

  const ev = {
    point: 4.6, // your right hand rises
    sheetRise: [9.2, 12.8], // the sheet lifts out of "Pin"
    collapse: 16.1, // it drops flat 0.2 s after the shot-4 line ends (14.3 + 1.6)
    claps: [32.5, 33.0, 33.5], // after Bell's line (29.3 + 3.0)
    tripodBeeps: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.22, 0.2, 0.18].reduce((a, d) => [...a, (a.length ? a[a.length - 1] : 84.2) + d], []),
    steps: [78.5, 79.4, 80.3, 81.2],
    tapeRewind: 58,
    hits: [0, shotAt(8), shotAt(20)],
    heartbeat: [78, 92],
    choice: shotAt(21),
  };

  const markers = {
    eight: { t: ev.hits[1], sync: 'av' },
    smile: { t: ev.hits[2], sync: 'av' },
    collapse: { t: ev.collapse, sync: 'a' },
    choice: ev.choice,
  };

  const subtitles = SHOTS.filter((s) => s.th).map((s) => ({ t: s.t + 0.15, end: s.end, text: s.th, en: s.en, red: s.red }));
  const soundTags = [
    [16.0, 18.5, '[ ฟุ่บ ]'], [32.4, 34, '[ แปะ… แปะ… แปะ ]'], [58, 63, '[ กรอเทปย้อน… ]'], [84, 92, '[ ปี๊บ… ปี๊บ… ]'],
  ].map(([t, end, text]) => ({ t, end, text }));

  const flickerWindows = [];
  const lightOn = () => 1;

  const SCORE = { lightOn, flickerWindows, STYLE, GENRE, scenes, FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, m, VO_LAG, VOICE, SHOTS, shotAt, ev, markers, subtitles, soundTags };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
