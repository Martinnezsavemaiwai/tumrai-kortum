// RIG LAB — a test scene, not a film: model sheets of kit/rig.js, one page per second (render.js stills 0 1 2 …).
// Use it to compare the rig before/after a change and to audition a new character spec.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const FPS = 30, FORMAT = U.pickFormat('16:9'), [W, H] = U.formatSize(FORMAT), SAFE = U.safeArea(W, H);
  // page: [start, title]; each page holds still except the idle/motion pages, which play
  const PAGES = [[0, 'bodies'], [1, 'chibi poses (mali)'], [2, 'chibi poses'], [3, 'explainer poses'], [4, 'brick poses (krit)'], [5, 'faces'], [6, 'cast line-up'], [7, 'idle + blink (plays)'], [8, 'hair styles'], [9, 'series cast from stories/demo-dorm9 (cast.js, ep3)'],
    [10, 'onion skin: idle → wave → angry (every 2nd frame)'], [11, 'motion graph: pose fields per frame'], [12, 'pose changes (plays 12–16)'],
    [16, 'shot types 9:16 (Direct.frame; dashed = subtitle rail, red = face limit)'], [17, 'shot types 16:9 + two-shot'],
    [18, 'five bodies, one character (krit), one style'], [19, 'silhouettes (krit)'], [20, 'heroic poses (ton)'], [21, 'round poses (lung)'],
    [22, 'faces + talk: heroic, round'], [23, 'reach targets (IK, red dots)'], [24, 'shot types 9:16: heroic, round'], [25, 'shot types 16:9: heroic, round'],
    [26, 'footwear: six shoes × five bodies (both feet)'], [27, 'bottoms + socks, standing and bent knee'], [28, 'two block vs short / buzz / comma / sidepart'],
    [29, 'bodies in motion (plays 29–33)']];
  const DURATION = 35; // one spare second: the engine fades the last moments to black
  const SCORE = { STYLE: 'flat', FPS, FORMAT, W, H, SAFE, DURATION, PAGES, subtitles: [], markers: {} };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
