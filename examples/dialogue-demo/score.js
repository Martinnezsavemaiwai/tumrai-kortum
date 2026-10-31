// DIALOGUE DEMO — 4 shots of stories/demo-dorm9 ep3 (a draft of the demo series): the series cast from the bible
// (cast.js), Direct.cam framing from the SHOTS data below, R.act acting. The QA target for scripts/qa.mjs.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const FPS = 30, FORMAT = U.pickFormat('9:16'), [W, H] = U.formatSize(FORMAT), SAFE = U.safeArea(W, H), DURATION = 16, VO_LAG = 0.3;
  const scenes = { door: { sides: { praew: 'L', phum: 'R' } } };
  // [start, Thai line, English, shot type, on, look, move]
  const SHOTS = [
    [0, 'ร่มของยาย\nหายไปสามวันแล้วอะ', "Grandma's umbrella's been gone three days.", 'WS', 'praew', 1, 'static'],
    [4, 'บอกมาอะ ไม่งั้น\nทั้งหอรู้เรื่องเพจแน่', "Tell me, or the whole dorm hears about the page.", 'MCU', 'praew', 1, 'push'],
    [8, 'ความลับนี่\nเผ็ดกว่าส้มตำอีก', 'This secret is spicier than som tam.', 'CU', 'phum', -1, 'static'],
    [12, 'ร่มกลับมาแล้ว\nพร้อมข้าวมันไก่', 'The umbrella is back — with chicken rice.', 'MS', 'praew', 1, 'static'],
  ].map(([t, th, en, shot, on, look, move], i, all) => ({ i: i + 1, t, end: i + 1 < all.length ? all[i + 1][0] : DURATION, th, en, shot, on, look, move, scene: 'door' }));
  const subtitles = SHOTS.map((s) => ({ t: s.t + VO_LAG, end: s.end - 0.25, text: s.th, en: s.en }));
  const SCORE = { STYLE: 'flat', FPS, FORMAT, W, H, SAFE, DURATION, VO_LAG, SHOTS, scenes, GENRE: 'comedy', SERIES: 'demo-dorm9', EPISODE: 'ep3', subtitles, markers: {} };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
