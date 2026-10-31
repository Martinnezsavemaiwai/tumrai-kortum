// EXPLAINER DEMO film — flat vector, the explainer body, keyword subtitles, book badge, split screen, chart, POV hands.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, R = globalThis.R, X = globalThis.X, Kit = globalThis.Kit;
  const { clamp, lerp, ease } = U, W = G.W, H = G.H, sc = S.scenes, GROUND = H * 0.7;

  function sky(ctx, top = '#BFE3F2', bot = '#EAF6FB') {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [x, y, s] of [[180, 300, 1], [820, 220, 0.8], [600, 420, 0.6]]) for (const [dx, dy, r] of [[0, 0, 60], [55, 10, 45], [-50, 12, 42]]) G.ellipse(ctx, x + dx * s, y + dy * s, r * s, r * s * 0.8, { fill: '#FFFFFF', seed: 5, lw: 0 });
    G.rrect(ctx, -40, GROUND, W + 80, H - GROUND + 40, 0, { fill: '#9ED38A', seed: 6, lw: 0 });
    G.rrect(ctx, -40, GROUND + 140, W + 80, H, 0, { fill: '#8CC77A', seed: 7, lw: 0 });
  }
  // a pot with a plant `h` px tall (stem + leaf pairs), the pot's foot at (x, y)
  function plant(ctx, x, y, h, seed = 1, sway = 0) {
    const top = y - 120 - h, n = Math.max(1, Math.round(h / 70));
    G.line(ctx, [[x, y - 110], [x + sway * 0.5, (y - 110 + top) / 2], [x + sway, top]], { color: '#3E8A3A', lw: 12, seed });
    for (let k = 0; k < n; k++) {
      const u = (k + 1) / (n + 0.5), ly = lerp(y - 120, top, u), lx = x + sway * u, s = 0.6 + 0.6 * (1 - u * 0.5);
      for (const d of [-1, 1]) G.poly(ctx, [[lx, ly], [lx + d * 70 * s, ly - 40 * s], [lx + d * 110 * s, ly - 10 * s], [lx + d * 60 * s, ly + 14 * s]], { fill: k % 2 ? '#5BB35A' : '#4CA34C', seed: seed + k * 3 + d, lw: 4 });
    }
    G.poly(ctx, [[x - 80, y - 120], [x + 80, y - 120], [x + 62, y], [x - 62, y]], { fill: '#D9774A', seed: seed + 40, lw: 5 });
    G.rrect(ctx, x - 92, y - 140, 184, 32, 10, { fill: '#E58A5C', seed: seed + 41, lw: 5 });
  }
  function bigTree(ctx, x, y, seed = 9) {
    G.rrect(ctx, x - 40, y - 520, 80, 520, 20, { fill: '#8A5A3A', seed, lw: 5 });
    for (const [dx, dy, r] of [[0, -620, 230], [-150, -500, 160], [150, -500, 170], [0, -800, 170]]) G.ellipse(ctx, x + dx, y + dy, r, r * 0.9, { fill: '#4CA34C', seed: seed + dx + dy, lw: 5 });
  }
  function label(ctx, s, x, y, size, bg = '#E8505A') {
    ctx.save(); ctx.font = `700 ${size}px Kanit`; const w = ctx.measureText(s).width;
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2 - 24, y - size * 0.95, w + 48, size * 1.3, 14); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText(s, x, y); ctx.restore();
  }
  const zoomAt = (ctx, cx, cy, z) => { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); };
  const ton = (ctx, x, y, s, t, keys) => R.draw(ctx, { x, y, s, body: 'explainer', who: 'ton', t, ...R.act(t, keys) });

  function draw(ctx, t) {
    if (t < 0) t = 2;
    ctx.save();
    if (t < sc.field1) { // hook: Ton, waist-up, thinking
      sky(ctx);
      zoomAt(ctx, W / 2, GROUND - 520, lerp(1.6, 1.75, t / sc.field1));
      ton(ctx, W / 2, GROUND + 260, 1, t, [[0, 'idle'], [0.6, 'think']]);
    } else if (t < sc.pov) { // field one: your sapling next to the friend's tree; then push in on yours
      sky(ctx);
      const u = ease.inOutCubic(clamp((t - sc.tiny) / 1.2));
      zoomAt(ctx, lerp(W / 2, 330, u), lerp(H / 2, GROUND - 120, u), lerp(1, 2.1, u));
      bigTree(ctx, 790, GROUND + 60);
      R.draw(ctx, { x: 860, y: GROUND + 120, s: 0.55, body: 'explainer', who: 'krit', t, ...R.act(t, [[0, 'cheer']]) });
      plant(ctx, 300, GROUND + 80, 50, 2, Math.sin(t * 2) * 6);
      ton(ctx, 470, GROUND + 140, 0.6, t, [[sc.field1, 'idle'], [sc.field1 + 1.6, 'point'], [sc.tiny + 0.4, 'sad']]);
      ctx.restore(); ctx.save();
      X.badge(ctx, 110, 500, 1, t, sc.field1 + 0.2);
      if (t < sc.tiny) label(ctx, 'แปลงที่หนึ่ง', W / 2, 520, 64);
    } else if (t < sc.split) { // POV: your hands lift the pot up toward you
      sky(ctx, '#CFE9F5', '#F1F9FC');
      const lift = ease.outCubic(clamp((t - sc.pov) / 1.2)) * 260;
      plant(ctx, W / 2, H * 0.78 - lift, 120, 3, Math.sin(t * 2) * 8);
      X.povHands(ctx, W, H, W / 2, H * 0.78 - lift - 60);
      X.badge(ctx, 110, 500, 2, t, sc.pov + 0.2);
      label(ctx, 'แปลงที่สอง', W / 2, 520, 64, '#3A6EA5');
    } else if (t < sc.end) { // split: a month ago vs today, then the chart
      X.split(ctx, W, H, clamp((t - sc.split) / 0.6),
        (c) => { sky(c, '#F4D9C4', '#FBEFE6'); plant(c, W * 0.25, GROUND + 60, 60, 4); label(c, 'เดือนที่แล้ว', W * 0.25, 520, 50, '#9A6A4A'); },
        (c) => { sky(c); plant(c, W * 0.75, GROUND + 60, 130, 5, Math.sin(t * 2) * 6); label(c, 'วันนี้', W * 0.75, 520, 50, '#3FA89B'); });
      if (t > sc.split + 1.6) {
        const a = clamp((t - sc.split - 1.6) / 0.4);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.roundRect(110, 560, W - 220, 520, 30); ctx.fill(); ctx.restore();
        if (a > 0.5) X.chart(ctx, 200, 980, W - 400, 340, [0.25, 0.4, 0.55, 1], t, sc.split + 1.9, { labels: ['เดือน 1', 'เดือน 2', 'เดือน 3', 'วันนี้'] });
      }
    } else { // ending: Ton thumbs-up next to his plant
      sky(ctx);
      zoomAt(ctx, W / 2, GROUND - 300, 1.25);
      plant(ctx, W / 2 + 230, GROUND + 100, 130, 6, Math.sin(t * 2) * 6);
      ton(ctx, W / 2 - 150, GROUND + 160, 0.75, t, [[sc.end, 'happy'], [sc.end + 1.2, 'thumbsup']]);
    }
    ctx.restore();
    X.bookBadge(ctx, 40, G.SAFE.y + 10, { label: 'ข้อคิดสั้น', title: 'ต้นไม้ของเรา', author: 'TumraiKortum · ตัวอย่างรูปแบบ', cover: '#4CA34C', a: clamp(t / 0.4) });
    G.grade(ctx);
    Kit.subtitles(ctx, t, S.subtitles, { style: 'keyword', W, H });
  }

  Studio.film({
    async init() { await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Bold.ttf', 700); await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Medium.ttf', 500); },
    draw, post: { grain: 0.02, vignette: 0.12 }, fadeOut: 0.6,
  });
})();
