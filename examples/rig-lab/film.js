// RIG LAB film — model sheets for kit/rig.js. Page = Math.floor(t); see score.js PAGES.
(function () {
  const G = globalThis.G, S = globalThis.SCORE, R = globalThis.R;
  const W = G.W, H = G.H;
  const POSES = ['idle', 'happy', 'wave', 'cheer', 'point', 'think', 'scared', 'sad', 'angry', 'sneaky'];

  function paper(ctx, title) {
    ctx.fillStyle = '#F4EFE6'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#E3DACB'; for (let x = 0; x < W; x += 96) ctx.fillRect(x, 0, 1, H);
    ctx.fillStyle = '#2A2320'; ctx.font = '700 40px Kanit'; ctx.fillText(title, 40, 64);
  }
  const tag = (ctx, s, x, y) => { ctx.fillStyle = '#6B6158'; ctx.font = '500 26px Kanit'; ctx.textAlign = 'center'; ctx.fillText(s, x, y); ctx.textAlign = 'left'; };
  const fig = (ctx, o) => R.draw(ctx, { t: 0, seed: 3, ...o });

  // a row of poses for one body + character (two rows of five)
  function poses(ctx, body, who, s) {
    POSES.forEach((p, i) => {
      const x = 200 + (i % 5) * 380, y = i < 5 ? 520 : 1020;
      fig(ctx, { x, y, s, body, who, ...R.POSES[p] });
      tag(ctx, p, x, y + 40 - (i < 5 ? 0 : 0));
    });
  }

  // motion graph: each pose field sampled at 30 fps across three key changes; a dot per frame, so jumps show as gaps.
  // Red ticks: frames where the eyes/mouth drawing changes. Blue: blink (0 open … 1 shut).
  function graph(ctx) {
    const keys = [[0, 'idle'], [0.8, 'wave'], [2.0, 'angry'], [3.2, 'sad']], T0 = -0.2, T1 = 4.2, fps = 30;
    const X = (tt) => 120 + (tt - T0) / (T1 - T0) * 1700;
    const rows = [['rSh', 0, 2.6], ['rEl', -0.5, 1], ['tilt', -0.2, 0.2], ['lean', -0.06, 0.06], ['look', -1, 1], ['bob', -40, 20], ['blink', 0, 1], ['sway', -0.4, 0.4]];
    rows.forEach(([k, lo, hi], r) => {
      const y0 = 150 + r * 110, Y = (v) => y0 + 90 - (v - lo) / (hi - lo) * 90;
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(110, y0 - 6, 1720, 102);
      ctx.fillStyle = '#6B6158'; ctx.font = '500 24px Kanit'; ctx.fillText(k, 20, y0 + 54);
      for (const [kt] of keys) { ctx.fillStyle = '#E3DACB'; ctx.fillRect(X(kt), y0 - 6, 2, 102); }
      let prev = null;
      for (let f = Math.round(T0 * fps); f <= T1 * fps; f++) {
        const tt = f / fps, p = R.act(tt, keys, { seed: 1 }), v = p[k] ?? 0;
        if (prev && (prev.eyes !== p.eyes || prev.mouth !== p.mouth)) { ctx.fillStyle = '#E8505A'; ctx.fillRect(X(tt) - 1, y0 - 6, 3, 102); }
        ctx.fillStyle = k === 'blink' ? '#2D8CFF' : '#2A2320'; ctx.beginPath(); ctx.arc(X(tt), Y(Math.max(lo, Math.min(hi, v))), 3.2, 0, Math.PI * 2); ctx.fill();
        prev = p;
      }
    });
  }

  // shot types: every Direct.TYPES framing of one stage, drawn into small frames of the given format
  function types(ctx, [FW, FH]) {
    const portrait = FH > FW, floor = portrait ? 1500 : 900;
    // 16:9 two-shots pair two anime bodies: a tall and a short figure share no eye line, so a tight two-shot of them
    // can't keep both heads in frame and Direct.frame (rightly) falls back to wider
    const cast = portrait ? [['anime', 'mali', 330], ['chibi', 'nok', 760]] : [['anime', 'mali', 700], ['anime', 'krit', 1150]];
    const stage = (c) => {
      c.fillStyle = '#DCE8EE'; c.fillRect(-4000, -4000, 9000, 9000);
      c.fillStyle = '#C9B79A'; c.fillRect(-4000, floor, 9000, 4000);
      c.fillStyle = '#A8C4D4'; c.fillRect(portrait ? 120 : 200, floor - (portrait ? 900 : 700), portrait ? 300 : 500, portrait ? 420 : 320); // a window to read scale by
      for (const [body, who, x] of cast) fig(c, { x, y: floor, s: portrait ? 0.9 : 0.6, body, who, ...R.POSES.idle });
    };
    const rows = portrait ? cast.map((c) => [c]) : [[cast[0]], [cast[0], cast[1]]];
    const cols = Direct.TYPES.length, cw = portrait ? 224 : 440, ch = cw * FH / FW, k = cw / FW;
    rows.forEach((row, r) => Direct.TYPES.forEach((type, i) => {
      if (!portrait && r === 1 && i > 3) return; // 16:9: second row = four two-shots
      const [body, , x] = row[0], subj = Direct.subject({ x, y: floor, s: portrait ? 0.9 : 0.6, body });
      const opts = { W: FW, H: FH, look: row.length > 1 ? 0 : 1, ...(row.length > 1 ? { with: Direct.subject({ x: row[1][2], y: floor, s: 0.6, body: row[1][0] }) } : {}) };
      const tp = row.length > 1 ? ['MCU', 'MS', 'FS', 'WS'][i] : type, f = Direct.frame(tp, subj, opts);
      const per = portrait ? cols : 4, cx = 40 + (i % per) * (cw + 10), cy = 100 + (portrait ? r * (ch + 40) : (Math.floor(i / 4) + r * 2) * (ch + 34));
      ctx.save(); ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip(); ctx.translate(cx, cy); ctx.scale(k, k);
      ctx.save(); ctx.translate(FW / 2, FH / 2); ctx.scale(f.zoom, f.zoom); ctx.translate(-FW / 2 - f.x, -FH / 2 - f.y); stage(ctx); ctx.restore();
      const L = Direct.lines(FW, FH);
      ctx.strokeStyle = '#2A2320'; ctx.lineWidth = 4 / k * 0.5; ctx.setLineDash([24, 18]); ctx.beginPath(); ctx.moveTo(0, FH * (portrait ? 0.75 : 0.87)); ctx.lineTo(FW, FH * (portrait ? 0.75 : 0.87)); ctx.stroke();
      ctx.setLineDash([]); ctx.strokeStyle = '#E8505A'; ctx.beginPath(); ctx.moveTo(0, FH * L.face); ctx.lineTo(FW, FH * L.face); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#2A2320'; ctx.lineWidth = 2; ctx.strokeRect(cx, cy, cw, ch);
      tag(ctx, row.length > 1 ? `2-shot ${tp}` : `${tp}${portrait ? '' : ' · look →'}`, cx + cw / 2, cy + ch + 26);
    }));
  }

  function draw(ctx, t) {
    if (t < 0) t = 0;
    let page = 0; S.PAGES.forEach(([t0], i) => { if (t >= t0) page = i; }); // the last page that has started
    const title = S.PAGES[page][1];
    paper(ctx, `rig lab · ${title}`);
    if (page === 0) {
      [['anime', 'mali'], ['cartoon', 'krit'], ['chibi', 'nok'], ['explainer', 'ton'], ['puppet', 'prince']].forEach(([body, who], i) => {
        const x = 220 + i * 370;
        if (body === 'puppet') { ctx.save(); ctx.beginPath(); ctx.rect(x - 180, 90, 360, 940); ctx.clip(); R.screen(ctx, W, H); ctx.restore(); }
        fig(ctx, { x, y: 960, s: 0.82, body, who, ...R.POSES.idle });
        tag(ctx, `${body} · ${who}`, x, 1010);
      });
    } else if (page === 1) poses(ctx, 'anime', 'mali', 0.42);
    else if (page === 2) poses(ctx, 'chibi', 'nok', 0.42);
    else if (page === 3) poses(ctx, 'explainer', 'ton', 0.42);
    else if (page === 4) poses(ctx, 'cartoon', 'krit', 0.42);
    else if (page === 5) { // faces: head-and-shoulders crops, three expressions per body
      const rows = [['anime', 'mali'], ['chibi', 'nok'], ['explainer', 'ton'], ['cartoon', 'krit']];
      rows.forEach(([body, who], r) => ['idle', 'happy', 'scared', 'angry', 'sad'].forEach((p, i) => {
        const cx = 260 + i * 350, cy = 140 + r * 235;
        ctx.save(); ctx.beginPath(); ctx.roundRect(cx - 160, cy - 40, 320, 225, 16); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.clip();
        const B = R.BODY[body], top = B.thigh + B.shin + B.foot * 0.3 + B.torso + B.neck + B.head[1] * 1.9;
        const s = 190 / (B.head[1] * 2.6);
        fig(ctx, { x: cx, y: cy - 20 + top * s, s, body, who, shadow: false, ...R.POSES[p], lSh: 0.12, rSh: 0.12, lEl: 0.1, rEl: 0.1 });
        ctx.restore();
        if (r === 0) tag(ctx, p, cx, 112);
      }));
    } else if (page === 6) { // the whole sample cast in one body, for silhouette/colour contrast
      const who = Object.keys(R.CAST).filter((k) => !['prince', 'teng'].includes(k));
      who.forEach((k, i) => { const x = 260 + i * 350; fig(ctx, { x, y: 960, s: 0.78, body: 'anime', who: k, ...R.POSES.idle }); tag(ctx, k, x, 1010); });
    } else if (page === 8) { // every hair style on one face and colour
      R.SPEC.hairStyle.filter((h) => h !== 'tuft').forEach((h, i) => {
        const x = 170 + i * 225;
        fig(ctx, { x, y: 960, s: 0.6, body: i % 2 ? 'chibi' : 'anime', who: { ...R.CAST.nok, hairStyle: h, hair: '#5A3A2A' }, ...R.POSES.idle });
        tag(ctx, h, x, 1010);
      });
    } else if (page === 9) { // the series cast, straight from the bible (story.mjs cast demo-dorm9 ep3 --out cast.js)
      ['praew', 'phum', 'jan'].filter((k) => R.CAST[k]).forEach((k, i) => { const x = 450 + i * 500; fig(ctx, { x, y: 960, s: 0.78, who: k, ...R.POSES.idle }); tag(ctx, `${R.CAST[k].name} (${k})`, x, 1010); });
    } else if (page === 10) { // onion skin: the spacing of the drawings shows the easing (bunched = slow, spread = fast)
      [[0, 'wave', 380], [1.4, 'angry', 1340]].forEach(([k0, to, x]) => {
        const keys = [[0, 'idle'], [1, 'wave'], [2.4, 'angry']];
        for (let f = 0; f <= 14; f++) {
          const tt = k0 + 0.75 + f / 15; // every 2nd frame at 30 fps, around the key change
          ctx.save(); ctx.globalAlpha = f === 14 ? 1 : 0.16;
          fig(ctx, { x, y: 1000, s: 0.85, body: 'anime', who: 'mali', t: tt, shadow: f === 14, ...R.act(tt, keys, { seed: 1 }) });
          ctx.restore();
        }
        tag(ctx, `→ ${to}`, x, 1050);
      });
    } else if (page === 11) graph(ctx);
    else if (page === 13 || page === 14) types(ctx, page === 13 ? [1080, 1920] : [1920, 1080]);
    else if (page === 12) { // pose changes that play: compare as a clip (render.js clip 12 16) or a sheet
      const u = t - 12;
      [['anime', 'mali', [[0, 'idle'], [0.6, 'wave'], [1.6, 'angry'], [2.6, 'happy']], [[2.7, 'jump']]],
        ['chibi', 'nok', [[0, 'idle'], [0.9, 'scared'], [2.0, 'sad'], [3.0, 'cheer']], [[1.0, 'shiver']]],
        ['cartoon', 'krit', [[0, 'idle'], [0.8, 'think'], [1.8, 'shrug'], [2.8, 'point']], [[2.0, 'shake']]]].forEach(([body, who, keys, gestures], i) => {
        const x = 360 + i * 600;
        fig(ctx, { x, y: 980, s: 0.75, body, who, t: u, seed: i + 2, ...R.act(u, keys, { seed: i + 2, gestures }) });
        tag(ctx, `${body} u=${u.toFixed(2)}`, x, 1030);
      });
    } else { // idle: what a character does when nobody animates it (blink, breathing)
      [['anime', 'mali'], ['chibi', 'nok'], ['explainer', 'ton']].forEach(([body, who], i) => {
        const x = 400 + i * 560;
        fig(ctx, { x, y: 980, s: 0.8, body, who, t, ...R.act(t, [[0, 'idle']], { seed: i + 1 }) });
        tag(ctx, `${body} t=${t.toFixed(2)}`, x, 1030);
      });
    }
  }

  Studio.film({
    async init() { await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Bold.ttf', 700); await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Medium.ttf', 500); },
    draw,
  });
})();
