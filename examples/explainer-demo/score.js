// EXPLAINER DEMO — "แข่งกับตัวเองเมื่อวาน": an original moral short in the สรุปหนังสือ/ข้อคิด format (genres.md).
// One metaphor in two "fields": your sapling next to a friend's tree, then next to itself a month ago.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const FPS = 30, FORMAT = U.pickFormat('9:16'), [W, H] = U.formatSize(FORMAT), SAFE = U.safeArea(W, H);
  const clock = MU.makeClock({ bpm: 84, offset: 0 });
  const DURATION = 25;
  // [start, end, Thai (*keyword*), English]
  const LINES = [
    [0.4, 3.6, 'ทำไมเราถึงรู้สึก\nว่า*ช้ากว่า*คนอื่นตลอด?', 'Why do we always feel slower than everyone?'],
    [3.8, 7.8, 'แปลงแรก\nเทียบกับ*ต้นไม้ของเพื่อน*', "Field one: next to a friend's tree"],
    [7.9, 11.8, 'ต้นของเรา\nดู*เล็กนิดเดียว*', 'Ours looks tiny.'],
    [12.0, 15.6, 'แต่ถ้าเทียบกับ\n*ตัวเองเมื่อเดือนก่อน*', 'But next to itself a month ago…'],
    [15.8, 20.6, 'มันโตขึ้น\n*สองเท่า*แล้ว', '…it has grown twice as tall.'],
    [20.8, 24.4, 'แข่งกับ\n*ตัวเองเมื่อวาน*ก็พอ', "Racing yesterday's you is enough."],
  ];
  const subtitles = LINES.map(([t, end, text, en]) => ({ t, end, text, en }));
  const scenes = { hook: 0, field1: 3.8, tiny: 7.9, pov: 12.0, split: 15.8, end: 20.8 };
  const SCORE = { STYLE: 'flat', FPS, FORMAT, W, H, SAFE, DURATION, clock, T: clock.T, subtitles, scenes, markers: {} };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
