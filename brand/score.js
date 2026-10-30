// THE SCORE — single source of truth for EP1 "ถ้าปาร์ตี้ฮาโลวีนมีคนเกินมาหนึ่งคน".
// Shot times follow the Thai voiceover already recorded in ../voice (ep1-<start>.mp3, played at start + VO_LAG).
// song.js and film.js both read every event from here, so sound and picture cannot drift.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('1:1');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const STYLE = 'paper'; // boiling pencil lines + hatching (chosen from the style test)
  const clock = makeClock({ bpm: 90, offset: 0 }); // only the party music box and the walk-in steps follow beats
  const { T, BEAT } = clock;
  const DURATION = 4;
  const VO_LAG = 0.3;

  // [start, Thai line (\n = line break), English, red key line?]  — one row per shot (STORYBOARD.md)
  const SHOTS = [
    [0, 'อย่านับคน\nในรูปหมู่', "Don't count the people in the group photo.", true],
    [4, 'คืนวันเสาร์ที่ 31 ตุลา', 'Saturday night, October 31st.'],
    [9, 'กติกามีข้อเดียว', 'There was only one rule.'],
    [13, 'ทุกคนต้องแต่งเป็นผี', 'Everyone had to come as a ghost.'],
    [17, 'ทุกคนมากันครบ', 'Everyone showed up.'],
    [24, 'เจ็ดคนพอดี', 'Exactly seven.'],
    [28, 'แต่ไม่มีใครถามถึง\nคนที่คลุมผ้าขาว', 'But no one asked about the one in the white sheet.'],
    [34, 'เพราะทุกคนคิดว่า\nมันเป็นของตกแต่ง', 'Everyone thought it was a decoration.'],
    [41, 'ถ่ายรูปหมู่\nตอนเที่ยงคืนตรง', 'A group photo at exactly midnight.'],
    [46, '', ''],
    [48, 'ในรูปมีแปดคน', 'There were eight people in the photo.', true],
    [53, '"ใครชวนมาอะ"', '"Who invited them?"'],
    [57, 'ไม่มีใครชวน', 'No one did.'],
    [61, 'ชุดไม่มีซิป\nไม่มีรอยเย็บ', 'No zipper. No seams.'],
    [66, 'แล้วก็ไม่มีเท้า', 'And no feet.', true],
    [70, 'มันหายไปแล้ว', 'It was gone.'],
    [75, 'เบลนับคนในห้อง\nใหม่อีกรอบ', 'Bell counted everyone again.'],
    [80, 'เจ็ดคน', 'Seven.'],
    [85, 'ถูกต้องตามที่นัดไว้', 'Just like it was planned.'],
    [89, 'แต่เบลไม่ได้\nนับตัวเองนะ', "But Bell didn't count herself.", true],
    [94, '"เธอแต่งเป็น\nผีอะไรมานะ"', '"What ghost did you come as again?"'],
    [98, '', ''],
    [101, '', ''],
  ].map(([t, th, en, red], i, all) => ({ i: i + 1, t, end: i + 1 < all.length ? all[i + 1][0] : DURATION, th, en, red: !!red }));
  const shotAt = (n) => SHOTS[n - 1].t;

  // ---------- events (each one is heard AND seen) ----------
  const ev = {
    lanterns: [0.6, 1.3, 2.0, 2.7], // pumpkins light up one by one in the dark
    chatPing: [4.4, 5.6, 6.8], // chat bubbles pop
    rulePop: 9.4,
    doorbell: 14.85, // after the shot-4 voice line ends (a hit never lands on a spoken word)
    doorOpen: 15.7,
    arrivals: [0, 1, 2, 3, 4, 5].map((k) => 17.6 + k * 1.0), // each guest's first step lands on its own beat-ish slot
    timerBeeps: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2].reduce((a, d) => [...a, (a.length ? a[a.length - 1] : 41.6) + d], []),
    flash: shotAt(10),
    hits: [shotAt(11), shotAt(15), shotAt(20)], // red key lines: hard cut + boom
    sheetTurn: 37.5, // the sheet turns its head toward you (shot 8)
    gone: shotAt(16),
    flicker: [75, 80],
    counts: [0, 1, 2, 3, 4, 5, 6].map((k) => 80.5 + k * 0.6), // Bell's finger: 1..7
    heartbeat: [89, 101],
    choice: shotAt(23),
  };

  // party music box (shots 4–9), a lullaby that slowly detunes
  const LULLABY = ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'E5', 'D5', 'B4'];
  const musicbox = [];
  for (let t = ev.doorbell + 2.2, k = 0; t < 45.5; t += BEAT, k++) musicbox.push({ t, midi: m(LULLABY[k % LULLABY.length]), detune: Math.max(0, (t - 28) / 18) * 0.6 });

  const markers = {
    flash: { t: ev.flash, sync: 'av' },
    eight: { t: ev.hits[0], sync: 'av' },
    nofeet: { t: ev.hits[1], sync: 'av' },
    herself: { t: ev.hits[2], sync: 'av' },
    doorbell: { t: ev.doorbell, sync: 'a' },
    gone: ev.gone,
    count: ev.counts[0],
    choice: ev.choice,
  };

  // subtitles (Thai rail + English under it) and sound tags for muted viewers
  const subtitles = SHOTS.filter((s) => s.th).map((s) => ({ t: s.t + 0.15, end: s.end, text: s.th, en: s.en, red: s.red }));
  const soundTags = [
    [14.8, 16.8, '[ ติ๊ง... ต่อง ]'], [46, 47.8, '[ แชะ! ]'], [70, 72, '[ ตึง!! ]'], [75, 80, '[ ไฟช็อต ซ่า... ]'], [89.5, 94, '[ ตุบ... ตุบ... ]'],
  ].map(([t, end, text]) => ({ t, end, text }));

  // light flicker: 1 = lit, ~0.15 = dropout. The picture dims with it and the buzz cuts out with it.
  const flickerWindows = [ev.flicker, [98, 101]];
  const lightOn = (t) => {
    if (!flickerWindows.some(([a, b]) => t >= a && t < b)) return 1;
    return Math.sin(t * 23) * Math.sin(t * 7.3) + Math.sin(t * 3.1) > 1.1 ? 0.15 : 1;
  };

  const SCORE = { lightOn, flickerWindows, STYLE, FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, m, VO_LAG, SHOTS, shotAt, ev, musicbox, markers, subtitles, soundTags };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
