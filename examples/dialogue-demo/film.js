// DIALOGUE DEMO film — one corridor, two characters; every camera is Direct.cam(SHOTS row), every look comes from cast.js.
(function () {
  const G = globalThis.G, S = globalThis.SCORE, R = globalThis.R, Kit = globalThis.Kit, W = G.W, H = G.H;
  const FLOOR = 1320, SCALE = 0.75;
  const pos = { praew: 330, phum: 760 }; // praew left of the line, phum right (score.js scenes.door.sides)
  const subj = Object.fromEntries(Object.entries(pos).map(([who, x]) => [who, Direct.subject({ x, y: FLOOR, s: SCALE, body: R.CAST[who].body })]));
  const ACT = {
    praew: [[0, { ...R.POSES.sad, look: 1 }], [4.2, 'angry'], [8.6, { ...R.POSES.sneaky, look: 1 }], [12.4, 'happy'], [13.4, 'cheer']],
    phum: [[0, 'idle'], [1.8, { ...R.POSES.idle, look: -1, mouth: 'flat' }], [4.6, { ...R.POSES.scared, look: -1 }],
      [8.2, { ...R.POSES.talk, eyes: 'sly', mouth: 'smirk', look: -1 }], [11.2, { ...R.POSES.shrug, eyes: 'sly', mouth: 'smirk' }], [12.4, 'idle']], // idle in shot 4: an arm reaching in by the umbrella would say who brought it back (f4 stays unknown)
  };
  const GEST = { praew: [[13.4, 'jump']], phum: [] };

  function corridor(ctx, t) {
    ctx.fillStyle = '#EADFCB'; ctx.fillRect(-3000, -3000, 7000, 7000);
    ctx.fillStyle = '#C49A6C'; ctx.fillRect(-3000, FLOOR, 7000, 3000);
    ctx.fillStyle = '#B5865A'; ctx.fillRect(-3000, FLOOR - 10, 7000, 14); // skirting
    // room doors 304 / 305
    for (const [x, n] of [[180, '304'], [820, '305']]) {
      ctx.fillStyle = '#8A5A3A'; ctx.fillRect(x - 120, FLOOR - 620, 240, 620);
      ctx.fillStyle = '#F4EDE0'; ctx.font = '700 44px Kanit'; ctx.textAlign = 'center'; ctx.fillText(n, x, FLOOR - 540); ctx.textAlign = 'left';
      ctx.fillStyle = '#E2B04A'; ctx.beginPath(); ctx.arc(x + 85, FLOOR - 300, 12, 0, Math.PI * 2); ctx.fill();
    }
    if (t >= 12) { // the payoff, at chest height so shot 4's MS shows it above the subtitles: the umbrella on a wall hook, a box on the shelf
      ctx.save(); ctx.translate(505, FLOOR - 625); ctx.rotate(0.12); ctx.scale(0.6, 0.6); // shot 4 (MS on praew) sees x 141–580, y 374–1154; subtitles from y 920
      ctx.strokeStyle = '#5A2A2A'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(-14, 0, 14, Math.PI, 0); ctx.stroke(); // the hook
      ctx.fillStyle = '#D23B3B'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(60, 160, 18, 300); ctx.lineTo(-18, 300); ctx.quadraticCurveTo(-60, 160, 0, 0); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#9A6A44'; ctx.fillRect(420, FLOOR - 640, 165, 14); // shelf
      // an open foam take-away box: white rice, sliced chicken, cucumber — ข้าวมันไก่ at a glance
      ctx.fillStyle = '#FBFAF5'; ctx.fillRect(428, FLOOR - 700, 150, 60); ctx.fillRect(428, FLOOR - 760, 150, 34); // tray + lid propped open
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(470, FLOOR - 700, 36, 16, 0, 0, Math.PI * 2); ctx.fill(); // rice
      ctx.fillStyle = '#F1D9B0'; for (let k = 0; k < 4; k++) ctx.fillRect(500 + k * 14, FLOOR - 712 + (k % 2) * 4, 12, 24); // chicken
      ctx.fillStyle = '#6DB25A'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(445 + k * 12, FLOOR - 690, 6, 0, Math.PI * 2); ctx.fill(); } // cucumber
    }
    for (const who of ['praew', 'phum']) R.draw(ctx, { x: pos[who], y: FLOOR, s: SCALE, who, t, ...R.act(t, ACT[who], { seed: who === 'praew' ? 1 : 2, gestures: GEST[who] }) });
  }

  const film = Shots.film(S.SHOTS.map((s) => ({ at: s.t, in: s.in, draw: corridor, cam: Direct.cam(s.shot, subj[s.on], { look: s.look, move: s.move }) })));
  Studio.film({
    async init() { await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Bold.ttf', 700); },
    draw(ctx, t) { if (t < 0) t = 1; film(ctx, t); Kit.subtitles(ctx, t, S.subtitles, { style: 'box', W, H }); },
    fadeOut: 0.5,
  });
})();
