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
  // the comparison pages are drawn like a film: scene → G.grade (pixelart, manga, bricks … finish there) → text on top.
  // A style with its own background (chalk: a dark board) gets it, and its light ink for the text.
  function backdrop(ctx) {
    ctx.fillStyle = G.style.bg || '#F4EFE6'; ctx.fillRect(0, 0, W, H);
    if (!G.style.bg) { ctx.fillStyle = '#E3DACB'; for (let x = 0; x < W; x += 96) ctx.fillRect(x, 0, 1, H); }
  }
  const textInk = () => (G.style.bg ? G.C.ink : null);
  const tag = (ctx, s, x, y, color = '#6B6158') => { ctx.fillStyle = color; ctx.font = '500 26px Kanit'; ctx.textAlign = 'center'; ctx.fillText(s, x, y); ctx.textAlign = 'left'; };
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

  // one framing f of a stage, drawn into a small frame at (cx, cy), cw wide; dashed = subtitle rail, red = face limit
  function frameBox(ctx, f, [FW, FH], cx, cy, cw, stage) {
    const portrait = FH > FW, ch = cw * FH / FW, k = cw / FW;
    ctx.save(); ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip(); ctx.translate(cx, cy); ctx.scale(k, k);
    ctx.save(); ctx.translate(FW / 2, FH / 2); ctx.scale(f.zoom, f.zoom); ctx.translate(-FW / 2 - f.x, -FH / 2 - f.y); stage(ctx); ctx.restore();
    const L = Direct.lines(FW, FH);
    ctx.strokeStyle = '#2A2320'; ctx.lineWidth = 4 / k * 0.5; ctx.setLineDash([24, 18]); ctx.beginPath(); ctx.moveTo(0, FH * (portrait ? 0.75 : 0.87)); ctx.lineTo(FW, FH * (portrait ? 0.75 : 0.87)); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = '#E8505A'; ctx.beginPath(); ctx.moveTo(0, FH * L.face); ctx.lineTo(FW, FH * L.face); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#2A2320'; ctx.lineWidth = 2; ctx.strokeRect(cx, cy, cw, ch);
  }
  // every shot type for each [body, who] in its own row (look room to the right)
  function typeRows(ctx, fmt, list, cw) {
    const [FW, FH] = fmt, floor = FH > FW ? 1500 : 900, s = FH > FW ? 0.9 : 0.6, ch = cw * FH / FW;
    list.forEach(([body, who], r) => Direct.TYPES.forEach((type, i) => {
      const subj = Direct.subject({ x: 700, y: floor, s, body }), f = Direct.frame(type, subj, { W: FW, H: FH, look: 1 });
      const cx = 40 + i * (cw + 10), cy = 100 + r * (ch + 40);
      frameBox(ctx, f, fmt, cx, cy, cw, (c) => { c.fillStyle = '#DCE8EE'; c.fillRect(-4000, -4000, 9000, 9000); c.fillStyle = '#C9B79A'; c.fillRect(-4000, floor, 9000, 4000); fig(c, { x: 700, y: floor, s, body, who, ...R.POSES.idle }); });
      tag(ctx, `${body} ${type}`, cx + cw / 2, cy + ch + 26);
    }));
  }

  // head-and-shoulders crops: one row per [body, who], one column per pose name or [label, pose, hairStyle?]
  function faces(ctx, rows, cols, dx) {
    const dy = Math.min(235, 940 / rows.length), k = dy / 235; // more rows: smaller crops
    rows.forEach(([body, who], r) => cols.forEach((col, i) => {
      const [label, pose, hs] = typeof col === 'string' ? [col, R.POSES[col]] : col, cx = 260 + i * dx, cy = 140 + r * dy, bw = Math.min(320, dx - 20);
      ctx.save(); ctx.beginPath(); ctx.roundRect(cx - bw / 2, cy - 40 * k, bw, 225 * k, 16); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.clip();
      const B = R.BODY[body], top = B.thigh + B.shin + B.foot * 0.3 + B.torso + B.neck + B.head[1] * 1.9;
      const s = 190 * k / (B.head[1] * 2.6);
      fig(ctx, { x: cx, y: cy - 20 * k + top * s, s, body, who: hs ? { ...R.CAST.krit, hairStyle: hs, hair: '#5A3A2A' } : who, shadow: false, ...pose, lSh: 0.12, rSh: 0.12, lEl: 0.1, rEl: 0.1 });
      ctx.restore();
      if (r === 0) tag(ctx, label, cx, 112);
    }));
  }

  // shot types: every Direct.TYPES framing of one stage, drawn into small frames of the given format
  function types(ctx, [FW, FH]) {
    const portrait = FH > FW, floor = portrait ? 1500 : 900;
    // 16:9 two-shots pair two chibi bodies: a tall and a short figure share no eye line, so a tight two-shot of them
    // can't keep both heads in frame and Direct.frame (rightly) falls back to wider
    const cast = portrait ? [['chibi', 'mali', 330], ['explainer', 'ton', 760]] : [['chibi', 'mali', 700], ['chibi', 'krit', 1150]];
    const stage = (c) => {
      c.fillStyle = '#DCE8EE'; c.fillRect(-4000, -4000, 9000, 9000);
      c.fillStyle = '#C9B79A'; c.fillRect(-4000, floor, 9000, 4000);
      c.fillStyle = '#A8C4D4'; c.fillRect(portrait ? 120 : 200, floor - (portrait ? 900 : 700), portrait ? 300 : 500, portrait ? 420 : 320); // a window to read scale by
      for (const [body, who, x] of cast) fig(c, { x, y: floor, s: portrait ? 0.9 : 0.6, body, who, ...R.POSES.idle });
    };
    const rows = portrait ? cast.map((c) => [c]) : [[cast[0]], [cast[0], cast[1]]];
    const cols = Direct.TYPES.length, cw = portrait ? 224 : 440, ch = cw * FH / FW;
    rows.forEach((row, r) => Direct.TYPES.forEach((type, i) => {
      if (!portrait && r === 1 && i > 3) return; // 16:9: second row = four two-shots
      const [body, , x] = row[0], subj = Direct.subject({ x, y: floor, s: portrait ? 0.9 : 0.6, body });
      const opts = { W: FW, H: FH, look: row.length > 1 ? 0 : 1, ...(row.length > 1 ? { with: Direct.subject({ x: row[1][2], y: floor, s: 0.6, body: row[1][0] }) } : {}) };
      const tp = row.length > 1 ? ['MCU', 'MS', 'FS', 'WS'][i] : type, f = Direct.frame(tp, subj, opts);
      const per = portrait ? cols : 4, cx = 40 + (i % per) * (cw + 10), cy = 100 + (portrait ? r * (ch + 40) : (Math.floor(i / 4) + r * 2) * (ch + 34));
      frameBox(ctx, f, [FW, FH], cx, cy, cw, stage);
      tag(ctx, row.length > 1 ? `2-shot ${tp}` : `${tp}${portrait ? '' : ' · look →'}`, cx + cw / 2, cy + ch + 26);
    }));
  }

  function draw(ctx, t) {
    if (t < 0) t = 0;
    let page = 0; S.PAGES.forEach(([t0], i) => { if (t >= t0) page = i; }); // the last page that has started
    const title = S.PAGES[page][1];
    if (page === 15 || page === 16) backdrop(ctx); else paper(ctx, `rig lab · ${title}`);
    if (page === 0) {
      [['chibi', 'nok'], ['explainer', 'ton'], ['brick', 'krit']].forEach(([body, who], i) => {
        const x = 420 + i * 540;
        fig(ctx, { x, y: 960, s: 0.82, body, who, ...R.POSES.idle });
        tag(ctx, `${body} · ${who}`, x, 1010);
      });
    } else if (page === 1) poses(ctx, 'chibi', 'mali', 0.42);
    else if (page === 2) poses(ctx, 'chibi', 'nok', 0.42);
    else if (page === 3) poses(ctx, 'explainer', 'ton', 0.42);
    else if (page === 4) poses(ctx, 'brick', 'krit', 0.42);
    else if (page === 5) faces(ctx, [['chibi', 'nok'], ['explainer', 'ton'], ['brick', 'krit']], ['idle', 'happy', 'scared', 'angry', 'sad'], 350); // five expressions per body
    else if (page === 6) { // the whole sample cast in one body, for silhouette/colour contrast
      const who = Object.keys(R.CAST);
      who.forEach((k, i) => { const x = 260 + i * 350; fig(ctx, { x, y: 960, s: 0.78, body: 'chibi', who: k, ...R.POSES.idle }); tag(ctx, k, x, 1010); });
    } else if (page === 8) { // every hair style on one face and colour
      R.SPEC.hairStyle.filter((h) => h !== 'tuft').forEach((h, i) => { // two rows of eight
        const x = 140 + (i % 8) * 235, y = i < 8 ? 500 : 1000;
        fig(ctx, { x, y, s: 0.36, body: 'chibi', who: { ...R.CAST.nok, hairStyle: h, hair: '#5A3A2A' }, ...R.POSES.idle });
        tag(ctx, h, x, y + 40);
      });
    } else if (page === 9) { // the series cast, straight from the bible (story.mjs cast demo-dorm9 ep3 --out cast.js)
      ['praew', 'phum', 'jan'].filter((k) => R.CAST[k]).forEach((k, i) => { const x = 450 + i * 500; fig(ctx, { x, y: 960, s: 0.78, who: k, ...R.POSES.idle }); tag(ctx, `${R.CAST[k].name} (${k})`, x, 1010); });
    } else if (page === 10) { // onion skin: the spacing of the drawings shows the easing (bunched = slow, spread = fast)
      [[0, 'wave', 380], [1.4, 'angry', 1340]].forEach(([k0, to, x]) => {
        const keys = [[0, 'idle'], [1, 'wave'], [2.4, 'angry']];
        for (let f = 0; f <= 14; f++) {
          const tt = k0 + 0.75 + f / 15; // every 2nd frame at 30 fps, around the key change
          ctx.save(); ctx.globalAlpha = f === 14 ? 1 : 0.16;
          fig(ctx, { x, y: 1000, s: 0.85, body: 'chibi', who: 'mali', t: tt, shadow: f === 14, ...R.act(tt, keys, { seed: 1 }) });
          ctx.restore();
        }
        tag(ctx, `→ ${to}`, x, 1050);
      });
    } else if (page === 11) graph(ctx);
    else if (page === 15 || page === 16) { // all bodies, one short-haired character in trousers (krit); page 16: as silhouettes
      const X = (i) => 175 + i * 262, ink = textInk();
      const row = (c) => Object.keys(R.BODY).forEach((body, i) => fig(c, { x: X(i), y: 960, s: 0.52, body, who: 'krit', shadow: page === 15, ...R.POSES.idle }));
      if (page === 15) row(ctx);
      else { const off = G.makeCanvas(W, H), o = off.getContext('2d'); row(o); o.globalCompositeOperation = 'source-in'; o.fillStyle = ink || '#1C1620'; o.fillRect(0, 0, W, H); ctx.drawImage(off, 0, 0); }
      G.grade(ctx);
      ctx.fillStyle = ink || '#2A2320'; ctx.font = '700 40px Kanit'; ctx.fillText(`rig lab · ${title}`, 40, 64);
      Object.keys(R.BODY).forEach((body, i) => tag(ctx, body, X(i), 1010, ink || undefined));
    } else if (page === 17 || page === 18) poses(ctx, ['heroic', 'round'][page - 17], ['ton', 'lung'][page - 17], page === 17 ? 0.36 : 0.42); // heroic is tall: smaller, so cheer and point stay in frame
    else if (page === 19) faces(ctx, [['heroic', 'ton'], ['round', 'lung']], ['idle', 'happy', 'scared', 'angry', 'sad', ['talk 0.8', { ...R.POSES.talk, talk: 0.8 }]], 300);
    else if (page === 20) { // reach: right wrist to a point up and out, left wrist toward the cheek (short arms point at it)
      Object.keys(R.BODY).forEach((body, i) => {
        const x = 230 + i * 365, y = 960, s = 0.5, B = R.BODY[body], sy = -(B.thigh + B.shin) - B.foot * 0.3 - B.torso, L = (B.ua + B.fa) * 0.5;
        const tr = [x + (B.sw * 0.92 + L * 0.55) * s, y + (sy + 16 - L * 0.6) * s], tl = [x - B.head[0] * 0.8 * s, y + (sy - B.neck - B.head[1] * 0.5) * s];
        fig(ctx, { x, y, s, body, who: 'mali', ...R.POSES.idle, handR: 'point', handL: 'open', reachR: tr, reachL: tl });
        for (const [px, py] of [tr, tl]) { ctx.fillStyle = '#E8505A'; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill(); }
        tag(ctx, body, x, 1010);
      });
    } else if (page === 21) typeRows(ctx, [1080, 1920], [['heroic', 'ton'], ['round', 'lung']], 224);
    else if (page === 22) typeRows(ctx, [1920, 1080], [['heroic', 'ton'], ['round', 'lung']], 224);
    else if (page === 23 || page === 24) { // lower-leg crops, both feet: page 23 = each shoe on each body; page 24 = bottoms + socks, standing and bent knee
      const bodies = Object.keys(R.BODY), shoes = R.SPEC.shoeStyle;
      const rows = page === 23 ? shoes.map((k) => [k, { shoeStyle: k }, R.POSES.idle])
        : [['pants', { bottomStyle: 'pants' }, R.POSES.idle], ['shorts + socks', { bottomStyle: 'shorts', socks: '#F4F1EA' }, R.POSES.idle], ['skirt + socks', { bottomStyle: 'skirt', socks: '#2A2A30', shoeStyle: 'leather' }, R.POSES.idle],
          ['pants, walk', { bottomStyle: 'pants', shoeStyle: 'boot' }, { ...R.POSES.idle, ...R.walk(0.3) }], ['shorts, walk', { bottomStyle: 'shorts', shoeStyle: 'sandal' }, { ...R.POSES.idle, ...R.walk(0.55) }], ['pants, bent knees', { bottomStyle: 'pants', shoeStyle: 'loafer' }, { ...R.POSES.idle, lHip: 0.45, lKnee: 0.9, rHip: 0.25, rKnee: 0.5 }]];
      const bw = 330, bh = 148;
      rows.forEach(([label, look, pose], r) => bodies.forEach((body, i) => {
        const cx = 210 + i * (bw + 12), cy = 96 + r * (bh + 8), B = R.BODY[body], s = Math.min(1.6, 62 / B.foot); // the foot about the same size in every column
        ctx.save(); ctx.beginPath(); ctx.roundRect(cx, cy, bw, bh, 12); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.clip();
        ctx.fillStyle = '#E3DACB'; ctx.fillRect(cx, cy + bh - 22, bw, 22);
        fig(ctx, { x: cx + bw / 2, y: cy + bh - 22, s, body, who: { ...R.CAST.krit, bottom: '#3A4A6A', shoes: '#7A4A2E', ...look }, shadow: false, ...pose });
        ctx.restore();
        if (r === 0) tag(ctx, body, cx + bw / 2, 88);
        if (i === 0) { ctx.fillStyle = '#2A2320'; ctx.font = '500 22px Kanit'; ctx.fillText(label, 20, cy + bh / 2 + 8); }
      }));
    } else if (page === 25) { // two block against the short men's cuts, every body: head crops
      faces(ctx, Object.keys(R.BODY).map((body) => [body, 'krit']), ['twoblock', 'short', 'buzz', 'comma', 'sidepart'].map((h) => [h, R.POSES.idle, h]), 350);
    } else if (page === 26) { // bodies acting: pose changes, a gesture, talk, a walk (render.js clip 29 33)
      const u = t - 29;
      [['chibi', 'nok', [[0, 'idle']], [], true],
        ['explainer', 'krit', [[0, 'idle'], [0.6, 'wave'], [1.6, 'shrug'], [2.6, 'talk']], [[1.9, 'shake']], false],
        ['heroic', 'ton', [[0, 'idle']], [], true],
        ['round', 'lung', [[0, 'idle'], [0.8, 'scared'], [1.8, 'happy'], [2.8, 'angry']], [[1.0, 'shiver']], false]].forEach(([body, who, keys, gestures, walking], i) => {
        const x = 260 + i * 460;
        fig(ctx, { x, y: 980, s: 0.7, body, who, t: u, seed: i + 2, ...R.act(u, keys, { seed: i + 2, gestures }), ...(walking ? R.walk(u) : {}) });
        tag(ctx, `${body} u=${u.toFixed(2)}${walking ? ' (walk)' : ''}`, x, 1030);
      });
    }
    else if (page === 13 || page === 14) types(ctx, page === 13 ? [1080, 1920] : [1920, 1080]);
    else if (page === 12) { // pose changes that play: compare as a clip (render.js clip 12 16) or a sheet
      const u = t - 12;
      [['chibi', 'mali', [[0, 'idle'], [0.6, 'wave'], [1.6, 'angry'], [2.6, 'happy']], [[2.7, 'jump']]],
        ['chibi', 'nok', [[0, 'idle'], [0.9, 'scared'], [2.0, 'sad'], [3.0, 'cheer']], [[1.0, 'shiver']]],
        ['explainer', 'krit', [[0, 'idle'], [0.8, 'think'], [1.8, 'shrug'], [2.8, 'point']], [[2.0, 'shake']]]].forEach(([body, who, keys, gestures], i) => {
        const x = 360 + i * 600;
        fig(ctx, { x, y: 980, s: 0.75, body, who, t: u, seed: i + 2, ...R.act(u, keys, { seed: i + 2, gestures }) });
        tag(ctx, `${body} u=${u.toFixed(2)}`, x, 1030);
      });
    } else { // idle: what a character does when nobody animates it (blink, breathing)
      [['chibi', 'mali'], ['chibi', 'nok'], ['explainer', 'ton']].forEach(([body, who], i) => {
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
