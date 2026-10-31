// LONG-FORM DEMO film (16:9). One scene function per chapter, each on its own local clock (kit/chapters.js).
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, R = globalThis.R, X = globalThis.X, Kit = globalThis.Kit, Chapters = globalThis.Chapters;
  const { clamp, lerp, ease } = U, W = G.W, H = G.H, FLOOR = H * 0.8;

  function room(ctx, wall = '#F3E9DA') {
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
    G.rrect(ctx, -20, FLOOR, W + 40, H - FLOOR + 20, 0, { fill: '#D8B98E', seed: 3, lw: 0 });
    G.rrect(ctx, 1320, 140, 380, 300, 14, { fill: '#BFE3F2', seed: 4, lw: 5 }); // window
    G.line(ctx, [[1510, 140], [1510, 440]], { lw: 5, seed: 5 }); G.line(ctx, [[1320, 290], [1700, 290]], { lw: 5, seed: 6 });
  }
  function park(ctx, scroll) {
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#BFE3F2'); g.addColorStop(1, '#EAF6FB'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let k = -1; k < 6; k++) { // far hills, then trees, scrolling at different speeds (parallax)
      const hx = ((k * 520 - scroll * 0.2) % (6 * 520) + 6 * 520) % (6 * 520) - 520;
      G.ellipse(ctx, hx, FLOOR + 40, 420, 220, { fill: '#B5DDA4', seed: 10 + k, lw: 0 });
    }
    G.rrect(ctx, -20, FLOOR, W + 40, H - FLOOR + 20, 0, { fill: '#9ED38A', seed: 7, lw: 0 });
    G.rrect(ctx, -20, FLOOR + 40, W + 40, 60, 0, { fill: '#E8D9B8', seed: 8, lw: 0 }); // the path
    for (let k = -1; k < 6; k++) {
      const tx = ((k * 420 - scroll) % (6 * 420) + 6 * 420) % (6 * 420) - 420;
      G.rrect(ctx, tx - 18, FLOOR - 220, 36, 240, 10, { fill: '#8A5A3A', seed: 20 + k, lw: 4 });
      G.ellipse(ctx, tx, FLOOR - 300, 130, 120, { fill: k % 2 ? '#4CA34C' : '#5BB35A', seed: 30 + k, lw: 4 });
    }
  }
  function glass(ctx, x, y, level) {
    G.poly(ctx, [[x - 50, y - 170], [x + 50, y - 170], [x + 40, y], [x - 40, y]], { fill: 'rgba(220,240,255,0.55)', seed: 40, lw: 4 });
    if (level > 0.02) { const top = y - 160 * level; G.poly(ctx, [[x - 41 - 8 * level, top], [x + 41 + 8 * level, top], [x + 39, y - 6], [x - 39, y - 6]], { fill: '#7FC4EC', seed: 41, lw: 0 }); }
  }
  function notebook(ctx, x, y, t) {
    G.rrect(ctx, x, y, 560, 420, 18, { fill: '#FFFDF5', seed: 50, lw: 5 });
    for (let k = 0; k < 4; k++) G.line(ctx, [[x + 40, y + 110 + k * 90], [x + 520, y + 110 + k * 90]], { color: 'rgba(80,120,180,0.35)', lw: 3, seed: 51 + k });
    const items = ['กาแฟอร่อย', 'เพื่อนทักมา', 'ฝนหยุดพอดี'];
    items.forEach((s, k) => {
      const a = clamp((t - 4 - k * 2.2) / 0.5);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.font = '700 52px Kanit'; ctx.fillStyle = '#2A3A5A'; ctx.fillText(`${k + 1}. ${s}`, x + 50, y + 95 + k * 90); ctx.restore();
      if (a >= 1) G.line(ctx, [[x + 470, y + 70 + k * 90], [x + 490, y + 92 + k * 90], [x + 530, y + 50 + k * 90]], { color: '#3FA89B', lw: 8, seed: 60 + k });
    });
  }
  const ton = (ctx, x, s, t, keys, extra = {}) => R.draw(ctx, { x, y: FLOOR + 160, s, body: 'explainer', who: 'ton', t, ...R.act(t, keys), ...extra });

  const scenes = {
    intro(ctx, t) {
      room(ctx);
      ton(ctx, W * 0.5, 0.72, t, [[0, 'wave'], [4.4, 'peace']]);
      for (let k = 0; k < 3; k++) X.badge(ctx, W * 0.5 + (k - 1) * 140, 230, k + 1, t, 5 + k * 0.35, { color: ['#3A9AD9', '#4CA34C', '#F2A33C'][k], r: 50 });
    },
    water(ctx, t) {
      room(ctx, '#EAF3F8');
      G.rrect(ctx, 1000, FLOOR - 200, 520, 40, 10, { fill: '#C79A6A', seed: 70, lw: 5 }); // table
      G.rrect(ctx, 1040, FLOOR - 160, 30, 160, 6, { fill: '#B08458', seed: 71, lw: 4 }); G.rrect(ctx, 1450, FLOOR - 160, 30, 160, 6, { fill: '#B08458', seed: 72, lw: 4 });
      glass(ctx, 1180, FLOOR - 200, 1 - ease.inOutCubic(clamp((t - 8) / 5)) * 0.9);
      X.stopwatch(ctx, 1400, FLOOR - 340, 90, { text: '07:00', color: '#3A9AD9', label: 'ตื่นนอน', labelColor: '#3A4A6A', p: clamp(t / 6) });
      ton(ctx, W * 0.3, 0.7, t, [[0, 'idle'], [2.8, 'point'], [7.8, 'happy'], [13.2, 'thumbsup']], { look: t > 2.8 && t < 7.8 ? 1 : 0 });
    },
    walk(ctx, t) {
      park(ctx, t * 260);
      R.draw(ctx, { x: W * 0.42, y: FLOOR + 110, s: 0.62, body: 'anime', who: 'mali', t, ...R.act(t, [[0, 'happy']]), ...R.walk(t), eyes: 'happy', mouth: 'smile' });
      const steps = Math.floor(t * 1.6 * 2) * 1 + 1200;
      ctx.save(); ctx.fillStyle = 'rgba(18,18,36,0.82)'; ctx.beginPath(); ctx.roundRect(W - 470, 120, 380, 110, 20); ctx.fill();
      ctx.fillStyle = '#FFD23F'; ctx.font = '700 64px Kanit'; ctx.fillText(steps.toLocaleString('en-US'), W - 440, 200);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '500 34px Kanit'; ctx.fillText('ก้าว', W - 190, 196); ctx.restore();
    },
    notes(ctx, t) {
      room(ctx, '#2E3550'); // night
      ctx.fillStyle = '#F6E7A8'; ctx.beginPath(); ctx.arc(1600, 230, 70, 0, Math.PI * 2); ctx.fill();
      notebook(ctx, 740, 340, t);
      ton(ctx, W * 0.27, 0.7, t, [[0, 'think'], [8.2, 'happy'], [13.8, 'cheer']]);
    },
    outro(ctx, t) {
      room(ctx);
      ton(ctx, W * 0.24, 0.66, t, [[0, 'happy'], [5, 'wave']]);
      const a = ease.outCubic(clamp((t - 1) / 0.6));
      for (const [k, label] of [[0, 'คลิปถัดไป'], [1, 'ตอนแนะนำ']]) { // YouTube end-screen slots
        const x = 820 + k * 520, y = 250 + (1 - a) * 60;
        ctx.save(); ctx.globalAlpha = a; G.rrect(ctx, x, y, 460, 260, 22, { fill: '#2A2A3A', seed: 80 + k, lw: 5 });
        ctx.fillStyle = '#FFFFFF'; ctx.font = '700 46px Kanit'; ctx.textAlign = 'center'; ctx.fillText(label, x + 230, y + 145); ctx.restore();
      }
    },
  };

  Studio.film({
    async init() { await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Bold.ttf', 700); await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Medium.ttf', 500); },
    draw(ctx, t) {
      if (t < 0) t = 4; // cover
      Chapters.draw(ctx, t, S.chapters, scenes, { W, H });
      G.grade(ctx);
      Kit.subtitles(ctx, t, S.subtitles, { style: 'keyword', W, H });
    },
    post: { grain: 0.02, vignette: 0.1 }, fadeOut: 0.8,
  });
})();
