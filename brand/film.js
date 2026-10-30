// CHANNEL PROFILE PICTURE — 1080x1080, everything inside the circle TikTok crops to (r ≈ 500).
//   render.js stills 1 2 3  ->  option A, B, C
(function () {
  const G = globalThis.G, Studio = globalThis.Studio, K = globalThis.K, U = globalThis.U;
  const W = G.W, H = G.H, CX = W / 2, CY = H / 2;

  function bg(ctx, inner, outer) {
    const g = ctx.createRadialGradient(CX, CY * 0.9, 60, CX, CY, W * 0.7);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ครก (clay mortar) with a สาก (pestle); x, y = bottom centre
  function mortar(ctx, x, y, s, { face = false, pestle = 0.5 } = {}) {
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y + 6 * s, 210 * s, 26 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    K.poly(ctx, [[x - 200 * s, y - 250 * s], [x + 200 * s, y - 250 * s], [x + 150 * s, y - 20 * s], [x + 110 * s, y], [x - 110 * s, y], [x - 150 * s, y - 20 * s]], '#B07A55', 801);
    K.ell(ctx, x, y - 250 * s, 205 * s, 52 * s, '#C98E64', 802);
    K.ell(ctx, x, y - 245 * s, 165 * s, 36 * s, '#5A3A28', 803, { hatch: false });
    // pestle leaning out of the bowl
    const a = pestle, px = x + Math.sin(a) * 260 * s, py = y - 250 * s - Math.cos(a) * 260 * s;
    G.limb(ctx, [[x + 20 * s, y - 230 * s], [(x + px) / 2, (y - 230 * s + py) / 2], [px, py]], { color: '#D8B48A', lw: 46 * s });
    if (face) {
      const fy = y - 140 * s;
      for (const ex of [-55, 55]) { ctx.fillStyle = '#17121C'; ctx.beginPath(); ctx.ellipse(x + ex * s, fy, 17 * s, 22 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(x + ex * s - 6 * s, fy - 7 * s, 6 * s, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(232,113,141,0.45)'; for (const ex of [-95, 95]) { ctx.beginPath(); ctx.ellipse(x + ex * s, fy + 38 * s, 24 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill(); }
      G.line(ctx, [[x - 24 * s, fy + 44 * s], [x, fy + 62 * s], [x + 24 * s, fy + 44 * s]], { color: '#5A2E34', lw: 6 * s, seed: 804 });
    }
  }

  function pencil(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    K.rr(ctx, -16 * s, -130 * s, 32 * s, 200 * s, 6, '#F2B84B', 810);
    K.poly(ctx, [[-16 * s, 70 * s], [16 * s, 70 * s], [0, 120 * s]], '#F0D2BC', 811, { hatch: false });
    K.poly(ctx, [[-6 * s, 104 * s], [6 * s, 104 * s], [0, 120 * s]], '#2A2320', 812, { hatch: false });
    K.rr(ctx, -16 * s, -150 * s, 32 * s, 26 * s, 6, '#E8718D', 813, { hatch: false });
    ctx.restore();
  }

  // ครกน้อย, the channel mascot (final profile picture). Fits inside r ≈ 460 of the 540 circle.
  function krokNoi(ctx) {
    // background: teal glow, soft halftone dots, a cream ring just inside the crop
    bg(ctx, '#E9F4EE', '#2F6E68');
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let y = 30; y < H; y += 44) for (let x = 30 + ((y / 44) % 2) * 22; x < W; x += 44) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    { const ring = G.ellPts(CX, CY, 500, 500); G.line(ctx, [...ring, ring[0], ring[1]], { color: 'rgba(246,240,226,0.55)', lw: 10, seed: 820 }); }

    const x = CX + 10, base = CY + 330, s = 1.38;
    // ground shadow
    ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#0E2A28'; ctx.beginPath(); ctx.ellipse(x, base - 36, 250, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); // under the foot
    // pestle (behind the rim) and the pencil, leaning out of the bowl
    const rimY = base - 255 * s;
    G.limb(ctx, [[x + 40, rimY + 30], [x + 120, rimY - 140], [x + 190, rimY - 300]], { color: '#D8B48A', lw: 62 });
    K.ell(ctx, x + 192, rimY - 304, 34, 34, '#E2C29A', 830, { hatch: false });
    pencil(ctx, x - 150, rimY - 150, 1.25, -0.42);
    // inside of the bowl
    K.ell(ctx, x, rimY, 205 * s, 54 * s, '#C98E64', 831);
    K.ell(ctx, x, rimY + 6, 168 * s, 38 * s, '#5A3A28', 832, { hatch: false });
    // the bowl: rounded sides, a small foot
    const bowl = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16, a = Math.PI * u; bowl.push([x - Math.cos(a) * (200 - 40 * Math.sin(a) ** 3) * s, rimY + 14 + Math.sin(a) * 200 * s]); }
    K.poly(ctx, [[x - 205 * s, rimY + 8], ...bowl, [x + 205 * s, rimY + 8]], '#B07A55', 833, { hatchColor: 'rgba(90,50,30,0.22)' });
    K.rr(ctx, x - 110 * s, base - 76, 220 * s, 40, 14, '#9A6646', 834, { hatch: false }); // foot, tucked under the bowl
    // clay speckles + a highlight on the left
    for (let k = 0; k < 26; k++) { const px = x - 150 * s + U.hash(k, 3) * 300 * s, py = rimY + 50 + U.hash(k, 4) * 150 * s; ctx.fillStyle = 'rgba(70,40,25,0.35)'; ctx.beginPath(); ctx.arc(px, py, 3 + U.hash(k, 5) * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#FFF4E0'; ctx.beginPath(); ctx.ellipse(x - 170, rimY + 120, 26, 90, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // face: big shiny eyes, blush, open happy smile
    const fy = rimY + 135;
    for (const ex of [-70, 70]) {
      ctx.fillStyle = '#17121C'; ctx.beginPath(); ctx.ellipse(x + ex, fy, 26, 32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(x + ex - 9, fy - 11, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + ex + 8, fy + 10, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(232,113,141,0.55)'; for (const ex of [-128, 128]) { ctx.beginPath(); ctx.ellipse(x + ex, fy + 50, 32, 17, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5A2E34'; ctx.beginPath(); ctx.moveTo(x - 30, fy + 48); ctx.quadraticCurveTo(x, fy + 96, x + 30, fy + 48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#E8718D'; ctx.beginPath(); ctx.ellipse(x, fy + 72, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
    // "pound" marks above the pestle tip + two sparkles
    for (const [dx, dy, r] of [[250, -330, 0.5], [270, -280, 0.15], [230, -380, 0.9]]) G.line(ctx, [[x + dx, rimY + dy], [x + dx + 40 * Math.cos(r), rimY + dy - 40 * Math.sin(r)]], { color: '#FFF6E0', lw: 9, seed: 840 + dx });
    G.star(ctx, CX - 300, CY - 230, 26, { fill: '#F2B84B', seed: 850 });
    G.star(ctx, CX + 330, CY + 40, 18, { fill: '#FFF6E0', seed: 851 });
  }

  // ---------- "ทำไรก็ทำ" (just do it, whatever it is) mascots ----------
  const RING = (ctx, c) => { const r = G.ellPts(CX, CY, 500, 500); G.line(ctx, [...r, r[0], r[1]], { color: c, lw: 10, seed: 820 }); };
  const dots = (ctx, a) => { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${a})`; for (let y = 30; y < H; y += 44) for (let x = 30 + ((y / 44) % 2) * 22; x < W; x += 44) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); };

  // red "fighting" headband on a chibi whose feet are at (x, y), scale s
  function headband(ctx, x, y, s) {
    const hy = y - 360 * s;
    K.rr(ctx, x - 132 * s, hy - 78 * s, 264 * s, 40 * s, 14 * s, '#D93A2B', 860, { hatch: false });
    K.ell(ctx, x + 128 * s, hy - 58 * s, 18 * s, 18 * s, '#B92E22', 861, { hatch: false });
    G.limb(ctx, [[x + 135 * s, hy - 58 * s], [x + 190 * s, hy - 80 * s], [x + 230 * s, hy - 50 * s]], { color: '#D93A2B', lw: 22 * s });
    G.limb(ctx, [[x + 135 * s, hy - 54 * s], [x + 180 * s, hy - 20 * s], [x + 215 * s, hy - 10 * s]], { color: '#D93A2B', lw: 20 * s });
  }

  function clapper(ctx, x, y, s, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    K.rr(ctx, -70 * s, -20 * s, 140 * s, 90 * s, 8, '#2A2320', 870, { hatch: false });
    ctx.save(); ctx.rotate(-0.25); K.rr(ctx, -70 * s, -48 * s, 140 * s, 26 * s, 6, '#F4EDE0', 871, { hatch: false });
    ctx.fillStyle = '#2A2320'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-60 * s + k * 36 * s, -48 * s); ctx.lineTo(-44 * s + k * 36 * s, -48 * s); ctx.lineTo(-56 * s + k * 36 * s, -22 * s); ctx.lineTo(-72 * s + k * 36 * s, -22 * s); ctx.fill(); }
    ctx.restore(); ctx.restore();
  }
  function brush(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    K.rr(ctx, -10 * s, -90 * s, 20 * s, 120 * s, 8, '#3D7A74', 875);
    K.rr(ctx, -12 * s, 26 * s, 24 * s, 24 * s, 4, '#C8C2B4', 876, { hatch: false });
    K.poly(ctx, [[-14 * s, 50 * s], [14 * s, 50 * s], [0, 100 * s]], '#E8718D', 877, { hatch: false });
    ctx.restore();
  }
  function gamepad(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    K.rr(ctx, -80 * s, -40 * s, 160 * s, 80 * s, 40 * s, '#5B3E8C', 880);
    K.rr(ctx, -55 * s, -8 * s, 40 * s, 14 * s, 4, '#F4EDE0', 881, { hatch: false }); K.rr(ctx, -42 * s, -21 * s, 14 * s, 40 * s, 4, '#F4EDE0', 882, { hatch: false });
    K.ell(ctx, 40 * s, -10 * s, 11 * s, 11 * s, '#F2B84B', 883, { hatch: false }); K.ell(ctx, 60 * s, 10 * s, 11 * s, 11 * s, '#E8718D', 884, { hatch: false });
    ctx.restore();
  }
  function arc(ctx, x, y, r, a0, a1) { ctx.save(); ctx.setLineDash([14, 16]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); ctx.restore(); }

  // แมวส้ม: a round chibi orange tabby in the same dot-eye style as the cast. (x, y) = where it sits.
  // o: { eyes: 'normal'|'happy'|'determined'|'sleepy', band, pawUp (radians, raises the right paw), lying, tail }
  function orangeCat(ctx, x, y, s, o = {}) {
    const C = '#F08A2E', D = '#C9621A', CREAM = '#FFF1DC', PINK = '#F2A0B0';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (!o.lying) { ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 4, 130, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    // tail curling up on the right, with stripes
    const tail = o.lying ? [[110, -40], [190, -50], [230, -10]] : [[90, -30], [175, -40], [190, -150]];
    G.limb(ctx, tail, { color: C, lw: 40 });
    for (let k = 1; k < 3; k++) { const [ax, ay] = tail[k]; G.line(ctx, [[ax - 18, ay - 6], [ax + 18, ay + 6]], { color: D, lw: 8, seed: 930 + k }); }
    // body (a loaf when lying, a pear when sitting) + cream belly
    if (o.lying) K.ell(ctx, 0, -50, 150, 60, C, 931);
    else { K.ell(ctx, 0, -110, 118, 110, C, 931); K.ell(ctx, 0, -95, 70, 78, CREAM, 932, { hatch: false }); }
    // front paws
    if (!o.lying) {
      K.ell(ctx, -50, -10, 34, 24, CREAM, 933);
      if (o.pawUp) {
        const a = o.pawUp, hx = 70 + Math.sin(a) * 120, hy = -150 - Math.cos(a) * 120;
        G.limb(ctx, [[60, -140], [70 + Math.sin(a) * 60, -150 - Math.cos(a) * 60], [hx, hy]], { color: C, lw: 44 });
        K.ell(ctx, hx, hy, 32, 30, CREAM, 934);
        o.paw = [hx, hy];
      } else K.ell(ctx, 50, -10, 34, 24, CREAM, 935);
    }
    // head
    const hy = o.lying ? -120 : -290;
    for (const d of [-1, 1]) {
      K.poly(ctx, [[d * 50, hy - 90], [d * 128, hy - 160], [d * 128, hy - 50]], C, 936 + d);
      K.poly(ctx, [[d * 75, hy - 92], [d * 116, hy - 132], [d * 114, hy - 72]], PINK, 938 + d, { hatch: false });
    }
    K.ell(ctx, 0, hy, 150, 128, C, 940);
    for (const dx of [-28, 0, 28]) G.line(ctx, [[dx, hy - 126], [dx * 0.8, hy - 84]], { color: D, lw: 10, seed: 941 + dx }); // forehead stripes
    for (const d of [-1, 1]) for (const dy of [-6, 18]) G.line(ctx, [[d * 148, hy + dy], [d * 112, hy + dy + 4]], { color: D, lw: 8, seed: 944 + d * 3 + dy }); // cheek stripes
    K.ell(ctx, 0, hy + 56, 74, 50, CREAM, 948, { hatch: false });
    // eyes
    const ey = hy + 6, e = o.eyes || 'normal';
    for (const ex of [-56, 56]) {
      if (e === 'happy' || e === 'sleepy') G.line(ctx, [[ex - 20, ey + (e === 'happy' ? 6 : 0)], [ex, ey + (e === 'happy' ? -10 : 6)], [ex + 20, ey + (e === 'happy' ? 6 : 0)]], { color: '#17121C', lw: 7, seed: 950 + ex });
      else { ctx.fillStyle = '#17121C'; ctx.beginPath(); ctx.ellipse(ex, ey, 22, 27, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(ex - 8, ey - 10, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(ex + 7, ey + 9, 3.5, 0, Math.PI * 2); ctx.fill(); }
      if (e === 'determined') G.line(ctx, [[ex + (ex < 0 ? -30 : 30), ey - 48], [ex + (ex < 0 ? 12 : -12), ey - 36]], { color: '#5A2E14', lw: 8, seed: 952 + ex });
    }
    ctx.fillStyle = 'rgba(232,113,141,0.5)'; for (const ex of [-100, 100]) { ctx.beginPath(); ctx.ellipse(ex, hy + 46, 26, 14, 0, 0, Math.PI * 2); ctx.fill(); }
    // nose + "w" mouth + whiskers
    ctx.fillStyle = '#E8718D'; ctx.beginPath(); ctx.moveTo(-12, hy + 38); ctx.lineTo(12, hy + 38); ctx.lineTo(0, hy + 50); ctx.fill();
    G.line(ctx, [[-26, hy + 60], [-13, hy + 70], [0, hy + 56], [13, hy + 70], [26, hy + 60]], { color: '#5A2E34', lw: 5, seed: 955 });
    for (const d of [-1, 1]) for (const k of [0, 1]) G.line(ctx, [[d * 70, hy + 54 + k * 14], [d * 150, hy + 44 + k * 26]], { color: 'rgba(80,50,40,0.6)', lw: 3, seed: 956 + d + k * 3 });
    if (o.band) { // red headband with tails flying right
      K.rr(ctx, -146, hy - 92, 292, 36, 14, '#D93A2B', 960, { hatch: false });
      G.limb(ctx, [[140, hy - 74], [200, hy - 100], [250, hy - 70]], { color: '#D93A2B', lw: 22 });
      G.limb(ctx, [[140, hy - 70], [195, hy - 40], [235, hy - 30]], { color: '#D93A2B', lw: 20 });
    }
    ctx.restore();
    if (o.paw) o.pawWorld = [x + o.paw[0] * s, y + o.paw[1] * s];
  }

  const OPTIONS = [
    // A. แมวส้มฮึบ — the orange cat is the mascot: headband on, pencil raised like a sword
    (ctx) => {
      bg(ctx, '#E9F4EE', '#2F6E68'); dots(ctx, 0.1); RING(ctx, 'rgba(246,240,226,0.55)');
      const o = { eyes: 'determined', band: true, pawUp: 0.95 };
      orangeCat(ctx, CX - 20, CY + 360, 1.35, o);
      pencil(ctx, o.pawWorld[0] + 10, o.pawWorld[1] - 120, 1.15, 0.25);
      for (const [dx, dy, r] of [[330, -330, 0.6], [360, -270, 0.2], [300, -390, 1.0]]) G.line(ctx, [[CX + dx, CY + dy], [CX + dx + 40 * Math.cos(r), CY + dy - 40 * Math.sin(r)]], { color: '#FFF6E0', lw: 9, seed: 970 + dx });
      G.star(ctx, CX - 330, CY - 220, 26, { fill: '#F2B84B', seed: 973 });
    },
    // B. ดินสอฮึบ + แมวส้ม — the flexing pencil with the cat riding on its eraser
    (ctx) => {
      bg(ctx, '#E9F4EE', '#2F6E68'); dots(ctx, 0.1); ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, 540, 0, Math.PI * 2); ctx.clip(); ctx.translate(CX, CY + 90); ctx.scale(0.86, 0.86); ctx.translate(-CX, -CY); OPTIONS[4](ctx, { noBg: true }); ctx.restore(); // only the pencil is scaled; the background stays full size
      RING(ctx, 'rgba(246,240,226,0.55)');
      orangeCat(ctx, CX + 10, CY - 260, 0.62, { eyes: 'happy', band: true, lying: true });
    },
    // C. น้องทำ + แมวส้ม — the kid hustles, the cat naps on the kid's head
    (ctx) => {
      bg(ctx, '#FFE6A8', '#E0703E'); dots(ctx, 0.12); RING(ctx, 'rgba(255,246,224,0.6)');
      const x = CX, y = CY + 430, s = 1.15;
      K.chibi(ctx, { x, y, s, who: 'mascot', t: 1, eyes: 'happy', mouth: 'smile', armL: 0.35, armR: 2.6, seed: 5 });
      headband(ctx, x, y, s);
      pencil(ctx, x + 64 * s + Math.sin(2.6) * 105 * s, y - 208 * s + Math.cos(2.6) * 105 * s - 90, 0.7, 0.35); // in the raised right hand
      orangeCat(ctx, x - 10, y - 360 * s - 95, 0.66, { eyes: 'sleepy', lying: true });
      for (const [k, dx] of [[0, 120], [1, 175]]) ctx.save(), ctx.font = `700 ${46 - k * 10}px Kanit, sans-serif`, ctx.fillStyle = '#FFF6E0', ctx.fillText('z', x + dx, y - 360 * s - 220 - k * 50), ctx.restore();
    },
    // 1. น้องทำ — the kid in a fighting headband juggles everything: pencil, clapper, brush, gamepad
    (ctx) => {
      bg(ctx, '#FFE6A8', '#E0703E'); dots(ctx, 0.12); RING(ctx, 'rgba(255,246,224,0.6)');
      const x = CX, y = CY + 400, s = 1.05;
      arc(ctx, x, y - 470, 330, Math.PI * 1.08, Math.PI * 1.92);
      K.chibi(ctx, { x, y, s, who: 'mascot', t: 1, eyes: 'happy', mouth: 'o', armL: 2.6, armR: 2.6, seed: 5 });
      headband(ctx, x, y, s);
      pencil(ctx, x - 290, y - 610, 0.75, -0.9);
      clapper(ctx, x - 120, y - 780, 0.85, -0.25);
      brush(ctx, x + 130, y - 790, 0.9, 0.5);
      gamepad(ctx, x + 300, y - 610, 0.8, 0.35);
    },
    // 2. ดินสอฮึบ — a pencil with arms flexing, headband on, ready for anything
    (ctx, o = {}) => {
      if (!o.noBg) { bg(ctx, '#E9F4EE', '#2F6E68'); dots(ctx, 0.1); RING(ctx, 'rgba(246,240,226,0.55)'); }
      const x = CX, top = CY - 330, bot = CY + 330;
      ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#0E2A28'; ctx.beginPath(); ctx.ellipse(x, bot + 70, 170, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // arms (behind): left flexing up, right fist on hip
      G.limb(ctx, [[x - 110, CY - 20], [x - 250, CY - 40], [x - 250, CY - 190]], { color: '#F0D2BC', lw: 54 });
      K.ell(ctx, x - 250, CY - 215, 44, 40, '#F0D2BC', 890, { lw: 5 });
      K.ell(ctx, x - 255, CY - 70, 40, 30, '#F0D2BC', 891, { hatch: false, lw: 4 }); // bicep
      G.limb(ctx, [[x + 110, CY - 10], [x + 210, CY + 60], [x + 130, CY + 120]], { color: '#F0D2BC', lw: 50 });
      K.ell(ctx, x + 128, CY + 122, 38, 34, '#F0D2BC', 892, { lw: 5 });
      // pencil body: pink eraser, metal band, yellow body, wood cone, graphite tip
      K.rr(ctx, x - 120, top - 100, 240, 120, 40, '#E8718D', 893);
      K.rr(ctx, x - 126, top + 10, 252, 60, 10, '#C8C2B4', 894);
      K.rr(ctx, x - 120, top + 66, 240, bot - top - 160, 12, '#F2B84B', 895);
      for (const dx of [-40, 40]) G.line(ctx, [[x + dx, top + 80], [x + dx, bot - 110]], { color: 'rgba(160,100,20,0.4)', lw: 5, seed: 896 + dx });
      K.poly(ctx, [[x - 120, bot - 96], [x + 120, bot - 96], [x, bot + 60]], '#F0D2BC', 897);
      K.poly(ctx, [[x - 34, bot + 5], [x + 34, bot + 5], [x, bot + 60]], '#2A2320', 898, { hatch: false });
      headband(ctx, x, top + 450, 1.0);
      // face: determined happy
      const fy = top + 250;
      for (const ex of [-50, 50]) { ctx.fillStyle = '#17121C'; ctx.beginPath(); ctx.ellipse(x + ex, fy, 20, 25, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(x + ex - 7, fy - 9, 7, 0, Math.PI * 2); ctx.fill(); }
      for (const ex of [-1, 1]) G.line(ctx, [[x + ex * 80, fy - 50], [x + ex * 25, fy - 38]], { color: '#2A1E26', lw: 7, seed: 899 + ex });
      ctx.fillStyle = 'rgba(232,113,141,0.55)'; for (const ex of [-88, 88]) { ctx.beginPath(); ctx.ellipse(x + ex, fy + 40, 24, 13, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#5A2E34'; ctx.beginPath(); ctx.moveTo(x - 30, fy + 40); ctx.quadraticCurveTo(x, fy + 90, x + 30, fy + 40); ctx.closePath(); ctx.fill();
      G.star(ctx, x - 340, top + 60, 24, { fill: '#F2B84B', seed: 900 });
      for (const [dx, dy, r] of [[-330, -260, 2.2], [-370, -200, 2.6], [-300, -320, 1.9]]) G.line(ctx, [[x + dx, CY + dy], [x + dx + 40 * Math.cos(r), CY + dy - 40 * Math.sin(r)]], { color: '#FFF6E0', lw: 9, seed: 901 + dx });
    },
    // 3. ผู้กำกับตัวจิ๋ว — the kid in a clapperboard hat, pencil behind the ear, wink + thumbs up
    (ctx) => {
      bg(ctx, '#F6E7FF', '#5B3E8C'); dots(ctx, 0.1); RING(ctx, 'rgba(246,240,226,0.55)');
      const x = CX - 30, y = CY + 420, s = 1.3;
      K.chibi(ctx, { x, y, s, who: 'mascot', t: 1, eyes: 'normal', mouth: 'smile', armL: 0.3, armR: 2.0, seed: 7 });
      const hy = y - 360 * s;
      // wink: cover the right eye with a happy arc
      K.ell(ctx, x + 44 * s, hy + 28 * s, 24 * s, 28 * s, '#F0D2BC', 910, { hatch: false, lw: 0 });
      G.line(ctx, [[x + 28 * s, hy + 30 * s], [x + 44 * s, hy + 20 * s], [x + 60 * s, hy + 30 * s]], { color: '#17121C', lw: 6 * s, seed: 911 });
      clapper(ctx, x, hy - 150 * s, 1.5, -0.12); // the hat
      pencil(ctx, x - 150 * s, hy - 10 * s, 0.6, 0.9); // behind the ear
      // thumbs up at the end of the raised right arm
      const tx = x + 70 * s + Math.sin(2.0) * 105 * s, ty = y - 230 * s + 22 * s + Math.cos(2.0) * 105 * s;
      K.rr(ctx, tx - 26, ty - 70, 30, 60, 14, '#F0D2BC', 912);
      G.star(ctx, tx + 70, ty - 90, 30, { fill: '#F2B84B', seed: 913 });
      G.star(ctx, CX - 330, CY - 200, 20, { fill: '#FFF6E0', seed: 914 });
    },
    // 4. (previous) ครกน้อย
    (ctx) => krokNoi(ctx),
    // 8 (FINAL). แมวส้มฮึบ, minimal: flat colours, one clean outline weight, no hatching/boil (render with `stills 8`)
    (ctx) => catMinimal(ctx),
  ];
  const MINIMAL = OPTIONS.length; // its still time

  function catMinimal(ctx) {
    const OR = '#F7922F', OR2 = '#D9701A', CREAM = '#FFF3E2', INKC = '#2B1E19', RED = '#E5392B', TEAL = '#1F5F5A';
    const LW = 14;
    const fillStroke = (fill) => { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = INKC; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
    const ellipse = (x, y, rx, ry, fill, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); fillStroke(fill); };
    const poly = (pts, fill) => { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); fillStroke(fill); };
    const stroke = (pts, w = LW, c = INKC) => { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };

    // flat background: teal disc with a soft lighter disc behind the cat
    ctx.fillStyle = TEAL; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2A7A72'; ctx.beginPath(); ctx.arc(CX, CY + 20, 400, 0, Math.PI * 2); ctx.fill();
    // energy bursts (flat cream wedges) behind the cat
    ctx.fillStyle = 'rgba(255,243,226,0.16)';
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, 560, a, a + 0.18); ctx.closePath(); ctx.fill(); }

    const x = CX - 40, base = CY + 330;
    // tail flicking up
    ctx.beginPath(); ctx.moveTo(x + 120, base - 60); ctx.quadraticCurveTo(x + 280, base - 80, x + 250, base - 250);
    ctx.lineWidth = 64; ctx.strokeStyle = INKC; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 64 - LW * 2; ctx.strokeStyle = OR; ctx.stroke();
    stroke([[x + 232, base - 200], [x + 280, base - 190]], 12, OR2);
    // body + belly
    ellipse(x, base - 110, 150, 120, OR);
    ctx.beginPath(); ctx.ellipse(x - 10, base - 92, 82, 80, 0, 0, Math.PI * 2); ctx.fillStyle = CREAM; ctx.fill();
    // feet
    ellipse(x - 70, base - 8, 52, 30, CREAM); ellipse(x + 70, base - 8, 52, 30, CREAM);
    // left paw on hip (a small round fist)
    ellipse(x - 150, base - 120, 40, 38, CREAM);
    // raised right arm: fist punching up, pencil gripped like a sword
    ctx.beginPath(); ctx.moveTo(x + 90, base - 170); ctx.quadraticCurveTo(x + 210, base - 230, x + 230, base - 380);
    ctx.lineWidth = 78; ctx.strokeStyle = INKC; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 78 - LW * 2; ctx.strokeStyle = OR; ctx.stroke();
    // pencil (flat): body, cone, tip, eraser
    ctx.save(); ctx.translate(x + 238, base - 430); ctx.rotate(0.22);
    poly([[-22, -230], [22, -230], [22, 20], [-22, 20]], '#FFC83D');
    poly([[-22, -230], [22, -230], [22, -270], [-22, -270]], '#F28AA0');
    poly([[-22, 20], [22, 20], [0, 75]], '#FFE2C2');
    ctx.beginPath(); ctx.moveTo(-8, 55); ctx.lineTo(8, 55); ctx.lineTo(0, 75); ctx.closePath(); ctx.fillStyle = INKC; ctx.fill();
    ctx.restore();
    ellipse(x + 232, base - 395, 54, 50, CREAM); // the fist over the pencil
    stroke([[x + 205, base - 410], [x + 250, base - 415]], 9);
    stroke([[x + 205, base - 388], [x + 252, base - 392]], 9);

    // head
    const hx = x - 10, hy = base - 345;
    poly([[hx - 150, hy - 40], [hx - 135, hy - 200], [hx - 40, hy - 110]], OR);
    poly([[hx + 150, hy - 40], [hx + 135, hy - 200], [hx + 40, hy - 110]], OR);
    ctx.beginPath(); ctx.moveTo(hx - 128, hy - 70); ctx.lineTo(hx - 120, hy - 160); ctx.lineTo(hx - 70, hy - 108); ctx.closePath(); ctx.fillStyle = '#F5A3B3'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx + 128, hy - 70); ctx.lineTo(hx + 120, hy - 160); ctx.lineTo(hx + 70, hy - 108); ctx.closePath(); ctx.fill();
    ellipse(hx, hy, 175, 145, OR);
    // stripes: three on the forehead, two on each cheek (flat, no outline)
    ctx.fillStyle = OR2;
    for (const dx of [-36, 0, 36]) { ctx.beginPath(); ctx.ellipse(hx + dx, hy - 118, 10, 22, 0, 0, Math.PI * 2); ctx.fill(); }
    for (const d of [-1, 1]) for (const dy of [-10, 22]) { ctx.beginPath(); ctx.ellipse(hx + d * 158, hy + dy, 18, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    // muzzle
    ctx.beginPath(); ctx.ellipse(hx, hy + 62, 84, 56, 0, 0, Math.PI * 2); ctx.fillStyle = CREAM; ctx.fill();
    // headband: red band across the forehead, two tails whipping LEFT (the right side is for the raised arm)
    poly([[hx - 160, hy - 66], [hx - 290, hy - 125], [hx - 305, hy - 85], [hx - 168, hy - 44]], RED);
    poly([[hx - 160, hy - 50], [hx - 280, hy - 20], [hx - 265, hy + 18], [hx - 160, hy - 34]], RED);
    ctx.beginPath(); ctx.moveTo(hx - 170, hy - 72); ctx.quadraticCurveTo(hx, hy - 98, hx + 172, hy - 72); ctx.lineTo(hx + 168, hy - 32); ctx.quadraticCurveTo(hx, hy - 58, hx - 166, hy - 32); ctx.closePath(); fillStroke(RED);
    // eyes: fired-up — flat top lid, big pupils, a sharp highlight
    for (const d of [-1, 1]) {
      const ex = hx + d * 62, ey = hy + 4;
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 30, 34, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = INKC; ctx.fillRect(ex - 40, ey - 40, 80, 80);
      ctx.fillStyle = OR; ctx.beginPath(); ctx.moveTo(ex - 40, ey - 40); ctx.lineTo(ex + 40, ey - 40); ctx.lineTo(ex + 40, ey - 14 - d * 12); ctx.lineTo(ex - 40, ey - 14 + d * 12); // lid slopes down toward the nose ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ex + d * 8, ey + 4, 9, 0, Math.PI * 2); ctx.fill();
      stroke([[ex - d * 40, ey - 48 - 0], [ex + d * 26, ey - 28]], 16); // brows slanting in
    }
    // nose + open shouting mouth with a fang
    ctx.beginPath(); ctx.moveTo(hx - 14, hy + 36); ctx.lineTo(hx + 14, hy + 36); ctx.lineTo(hx, hy + 50); ctx.closePath(); ctx.fillStyle = '#E8718D'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - 38, hy + 64); ctx.quadraticCurveTo(hx, hy + 124, hx + 38, hy + 64); ctx.closePath(); fillStroke('#7A2632');
    ctx.beginPath(); ctx.moveTo(hx - 24, hy + 66); ctx.lineTo(hx - 12, hy + 66); ctx.lineTo(hx - 18, hy + 82); ctx.closePath(); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    // blush
    ctx.fillStyle = 'rgba(240,110,130,0.45)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + d * 112, hy + 48, 26, 14, 0, 0, Math.PI * 2); ctx.fill(); }
    // power lines by the fist
    for (const [dx, dy, a] of [[110, -560, 0.5], [150, -500, 0.15], [70, -610, 0.9]]) stroke([[x + 238 + dx, base + dy], [x + 238 + dx + 46 * Math.cos(a), base + dy - 46 * Math.sin(a)]], 12, '#FFF3E2');
  }

  Studio.film({
    draw(ctx, t) {
      const i = Math.min(OPTIONS.length - 1, Math.max(0, Math.round(t) - 1));
      OPTIONS[i](ctx, 1);
    },
    // the minimal design gets no paper texture or vignette; the others keep the sketchbook look
    post: (t) => (Math.round(t) === MINIMAL ? { paper: 0, vignette: 0, grain: 0 } : { paper: 0.4, vignette: 0.2, grain: 0.04 }),
    fadeOut: 0,
  });
})();
