// THE FILM — EP2A "ถอด", 24 shots (STORYBOARD.md). Same living room as EP1; every frame is a pure function of t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Shots = globalThis.Shots, K = globalThis.K;
  const { clamp, lerp, ease } = U;
  const { ev } = S;
  const W = G.W, H = G.H;
  const FLOOR = Math.round(H * 0.48); // cast stays above the subtitle rail
  const at = (n) => S.shotAt(n);

  // ---------------- the set (same room as EP1) ----------------
  const ROOM = { x0: -700, x1: 1800 };
  const SOFA = { x: 140, w: 420, y: FLOOR + 40 };
  const SPOT = {
    tani: [250, FLOOR + 100, 0.58], krahang: [560, FLOOR + 80, 0.56], pret: [860, FLOOR + 100, 0.5],
    nak: [200, FLOOR + 330, 0.74], phrai: [540, FLOOR + 350, 0.78], krasue: [880, FLOOR + 330, 0.74],
    pob: [SOFA.x + 300, SOFA.y - 10, 0.46],
  };
  const ORDER = ['pob', 'tani', 'krahang', 'pret', 'phrai', 'nak', 'krasue'];
  const FRONT = ['phrai', 'nak', 'krasue', 'krahang', 'tani']; // hidden in Pob close-ups so nothing blocks him
  const glow = (ctx, x, y, r, rgb, a) => K.glow(ctx, x, y, r, rgb, a);

  function txt(ctx, s, x, y, size, color, weight = 700, stroke = 0) {
    ctx.save(); ctx.font = `${weight} ${size}px Kanit`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = '#000'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }

  function pumpkin(ctx, x, y, s, t, seed, lit = 1) {
    glow(ctx, x, y - 40 * s, 170 * s, '255,150,40', lit * (0.35 + 0.08 * Math.sin(t * 9 + seed)));
    for (const dx of [-38, 0, 38]) K.ell(ctx, x + dx * s, y - 52 * s, 44 * s, 52 * s, '#E2782F', 300 + seed * 10 + dx, { lw: 4 });
    K.rr(ctx, x - 8 * s, y - 118 * s, 16 * s, 24 * s, 5, '#4E6B2F', 305 + seed, { hatch: false, lw: 3 });
    ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * lit; ctx.fillStyle = '#FFD36B';
    for (const ex of [-24, 24]) { ctx.beginPath(); ctx.moveTo(x + ex * s - 13 * s, y - 58 * s); ctx.lineTo(x + ex * s + 13 * s, y - 58 * s); ctx.lineTo(x + ex * s, y - 78 * s); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(x - 32 * s, y - 40 * s); ctx.quadraticCurveTo(x, y - 18 * s, x + 32 * s, y - 40 * s); ctx.quadraticCurveTo(x, y - 30 * s, x - 32 * s, y - 40 * s); ctx.fill();
    ctx.restore();
  }

  // the window: DRY glass and a clear moon — the clue (it is not raining)
  function windowPane(ctx, x, y, w, h) {
    K.rr(ctx, x, y, w, h, 18, '#1B2348', 210, { hatch: false });
    K.ell(ctx, x + w * 0.62, y + h * 0.25, 52, 52, '#F3E7C4', 211, { hatch: false });
    for (let k = 0; k < 12; k++) { ctx.fillStyle = 'rgba(255,255,240,0.8)'; ctx.fillRect(x + 20 + U.hash(k, 7) * (w - 40), y + 20 + U.hash(k, 8) * (h - 40), 3, 3); } // stars
    G.line(ctx, [[x + w / 2, y], [x + w / 2, y + h]], { color: '#33264A', lw: 12, seed: 212 });
  }

  function room(ctx, t) {
    const wall = ctx.createLinearGradient(0, 0, 0, FLOOR);
    wall.addColorStop(0, '#33264A'); wall.addColorStop(1, '#55395C');
    ctx.fillStyle = wall; ctx.fillRect(ROOM.x0, -200, ROOM.x1 - ROOM.x0, FLOOR + 200);
    windowPane(ctx, 920, 330, 420, 360);
    K.poly(ctx, [[890, 300], [960, 300], [940, 740], [880, 740]], '#7A2E3C', 213);
    K.poly(ctx, [[1300, 300], [1370, 300], [1380, 740], [1320, 740]], '#7A2E3C', 214);
    const pts = []; for (let i = 0; i <= 24; i++) { const x = ROOM.x0 + (i / 24) * (ROOM.x1 - ROOM.x0); pts.push([x, 250 + Math.sin(i * 1.3) * 22]); }
    G.line(ctx, pts, { color: '#1A1424', lw: 4, seed: 215 });
    const on = S.lightOn(t);
    pts.forEach(([x, y], i) => {
      const c = ['#F2B84B', '#E0703E', '#B98CE0'][i % 3];
      glow(ctx, x, y + 16, 80, c === '#B98CE0' ? '185,140,224' : '242,184,75', 0.45 * on * (0.75 + 0.25 * Math.sin(t * 3 + i * 2.1)));
      K.ell(ctx, x, y + 16, 10, 14, c, 220 + i, { hatch: false, lw: 3 });
    });
    const fl = ctx.createLinearGradient(0, FLOOR, 0, H);
    fl.addColorStop(0, '#6A4636'); fl.addColorStop(1, '#2C1B16');
    ctx.fillStyle = fl; ctx.fillRect(ROOM.x0, FLOOR, ROOM.x1 - ROOM.x0, H);
    for (let i = 1; i < 8; i++) G.line(ctx, [[ROOM.x0, FLOOR + i * i * 12], [ROOM.x1, FLOOR + i * i * 12]], { color: 'rgba(0,0,0,0.25)', lw: 3, seed: 240 + i });
    G.line(ctx, [[ROOM.x0, FLOOR], [ROOM.x1, FLOOR]], { color: G.C.ink, lw: 5, seed: 249 });
    K.rr(ctx, SOFA.x, SOFA.y - 230, SOFA.w, 150, 40, '#4B3A6A', 250);
    K.rr(ctx, SOFA.x - 20, SOFA.y - 110, SOFA.w + 40, 110, 30, '#5B4A7E', 251);
    // the front door on the far left of the room
    K.rr(ctx, -560, FLOOR - 520, 300, 540, 12, '#5B3A28', 260);
    K.ell(ctx, -300, FLOOR - 250, 14, 14, '#F2B84B', 261, { hatch: false });
    pumpkin(ctx, -120, FLOOR + 160, 1.0, t, 1);
    pumpkin(ctx, 1090, FLOOR + 90, 0.8, t, 2);
  }

  function group(ctx, t, act = () => ({})) {
    for (const who of ORDER) {
      const [x, y, s] = SPOT[who];
      const a = act(who) || {};
      if (a.hide) continue;
      const blinkAt = (t * 0.37 + ORDER.indexOf(who) * 0.29) % 1;
      K.chibi(ctx, { x, y, s, who, t, seed: ORDER.indexOf(who) + 1, blink: blinkAt > 0.97 ? 1 : 0, bob: Math.sin(t * 2 + x) * 3, ...(who === 'pob' ? { eyes: 'glow' } : {}), ...a });
    }
  }

  function light(ctx, t, { cx = W / 2, cy = H * 0.55, warm = false, dark = 0 } = {}) {
    const g = ctx.createRadialGradient(cx, cy, 60, cx, cy, H * 0.8);
    if (warm) { g.addColorStop(0, '#FFF6EA'); g.addColorStop(0.6, '#D9A8A0'); g.addColorStop(1, '#4A2A3A'); }
    else { g.addColorStop(0, '#DDE2FF'); g.addColorStop(0.5, '#7C72AE'); g.addColorStop(1, '#1C1634'); }
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    const d = dark + (1 - S.lightOn(t)) * 0.75;
    if (d > 0) { ctx.save(); ctx.fillStyle = `rgba(8,6,16,${d})`; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
  }

  function rightHand(ctx, hx, hy) {
    G.limb(ctx, [[W + 120, H + 160], [W - 60, hy + 260], [hx, hy]], { color: '#24212B', lw: 120 });
    K.ell(ctx, hx, hy, 58, 54, '#F0D2BC', 410, { lw: 5 });
    for (let k = 0; k < 4; k++) K.ell(ctx, hx - 40 + k * 26, hy - 44, 15, 24, '#F0D2BC', 411 + k, { hatch: false, lw: 4 });
  }

  function maskFrame(ctx, open = 0) { // the inside of the mask; open 0..1 slides it down and away
    ctx.save(); ctx.translate(0, H * 3.2 * ease.inCubic(open));
    ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3);
    ctx.moveTo(W * 0.28 + 235, H * 0.42); ctx.ellipse(W * 0.28, H * 0.42, 235, 320, 0, 0, Math.PI * 2);
    ctx.moveTo(W * 0.74 + 235, H * 0.42); ctx.ellipse(W * 0.74, H * 0.42, 235, 320, 0, 0, Math.PI * 2);
    ctx.fill('evenodd'); ctx.restore();
  }

  // ---------------- phone ----------------
  const PHOTO = ['tani', 'nak', 'krasue', 'sheet', 'phrai', 'krahang', 'pob', 'pret'];
  function groupPhoto(ctx, x, y, w, h, zoom = 1) {
    ctx.save();
    ctx.fillStyle = '#E9E2F2'; ctx.fillRect(x, y, w, h);
    const ax = x + (w / 8) * 3.5, ay = y + h * 0.6; // zoom toward the sheet
    ctx.translate(ax, ay); ctx.scale(zoom, zoom); ctx.translate(-ax, -ay);
    ctx.fillStyle = '#6A5A7E'; ctx.fillRect(x - w, y, w * 3, h * 0.55);
    ctx.fillStyle = '#8A6A56'; ctx.fillRect(x - w, y + h * 0.55, w * 3, h);
    PHOTO.forEach((who, i) => {
      const px = x + (w / 8) * (i + 0.5), py = y + h * 0.66 + (i % 2) * 16;
      if (who === 'sheet') K.sheet(ctx, { x: px, y: py, s: 0.3, t: 3, shadow: false });
      else K.chibi(ctx, { x: px, y: py, s: who === 'pret' ? 0.22 : 0.26, who, t: 3, eyes: who === 'pob' ? 'glow' : 'happy', mouth: 'smile', seed: 50 + i, shadow: false });
    });
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  function phone(ctx, cx, cy, h, t, { bubbles = [], photo = false, zoom = 1, title = 'ฮาโลวีนบ้านเบล', sub = 'สมาชิก 7 คน' } = {}) {
    const w = h * 0.5;
    K.rr(ctx, cx - w / 2, cy - h / 2, w, h, 46, '#1E2028', 400, { hatch: false });
    const sx = cx - w / 2 + 22, sy = cy - h / 2 + 22, sw = w - 44, sh = h - 44;
    ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 30); ctx.clip();
    ctx.fillStyle = '#F4F1F8'; ctx.fillRect(sx, sy, sw, sh);
    if (photo) groupPhoto(ctx, sx, sy, sw, sh, zoom);
    else {
      ctx.fillStyle = '#5B3E8C'; ctx.fillRect(sx, sy, sw, 150);
      txt(ctx, title, sx + sw / 2, sy + 78, 46, '#FFFFFF');
      txt(ctx, sub, sx + sw / 2, sy + 124, 32, '#E8DCFF', 500);
      bubbles.forEach((b, i) => {
        const p = ease.outBack(clamp((t - b.t) / 0.25), 2.2);
        if (p <= 0) return;
        const lines = b.text.split('\n');
        const bh = 40 + lines.length * 46, by = sy + 200 + i * 150;
        const bw = Math.min(sw - 60, 60 + Math.max(...lines.map((l) => l.length)) * 27), bx = sx + 30;
        ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(p, p); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 36); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.stroke();
        lines.forEach((l, k) => txt(ctx, l, bx + bw / 2, by + 58 + k * 46, 34, '#2A2320', 500));
        if (b.from) txt(ctx, b.from, bx + 50, by - 10, 26, '#7A6A8E', 500);
        ctx.restore();
      });
    }
    ctx.restore();
  }

  // ---------------- door camera (grainy green feed): Ton on WET ground with NO shadow ----------------
  function doorCam(ctx, t, { zoom = 1 } = {}) {
    ctx.save();
    ctx.fillStyle = '#0B140E'; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H * 0.55); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H * 0.55);
    // porch
    ctx.fillStyle = '#1C2A20'; ctx.fillRect(0, 0, W, H * 0.62);
    ctx.fillStyle = '#2A3A2C'; ctx.fillRect(0, H * 0.62, W, H);
    // the wet patch: a glossy puddle right where he stands, nowhere else
    const g = ctx.createRadialGradient(W / 2, H * 0.74, 20, W / 2, H * 0.74, 330);
    g.addColorStop(0, 'rgba(170,230,190,0.55)'); g.addColorStop(1, 'rgba(170,230,190,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.74, 330, 70, 0, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 5; k++) G.line(ctx, [[W / 2 - 200 + k * 90, H * 0.73], [W / 2 - 160 + k * 90, H * 0.735]], { color: 'rgba(220,255,230,0.5)', lw: 3, seed: 600 + k });
    K.chibi(ctx, { x: W / 2, y: H * 0.74, s: 1.2, who: 'ton', t, shadow: false, eyes: 'normal', mouth: 'flat', armR: 0.4, seed: 90 });
    ctx.restore();
    // monochrome green + scanlines + noise + timestamp
    ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#3CFF7A'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 3); ctx.restore();
    for (let k = 0; k < 300; k++) { ctx.fillStyle = `rgba(200,255,210,${0.15 * U.hash(k, Math.floor(t * 24))})`; ctx.fillRect(U.hash(k, 1, Math.floor(t * 24)) * W, U.hash(k, 2, Math.floor(t * 24)) * H, 3, 3); }
    txt(ctx, 'CAM 01  ●REC  00:07', W / 2, G.SAFE.y + 140, 40, '#C8FFD6', 500);
  }

  // the inside of the front door (shots 17, 20, 23)
  function doorInside(ctx, t, { shake = 0, hand = 0 } = {}) {
    const wall = ctx.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#2E2240'); wall.addColorStop(1, '#4A3150');
    ctx.fillStyle = wall; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.save(); ctx.translate(U.noise1(t * 40, 3) * shake, 0);
    K.rr(ctx, 190, 260, 700, 1200, 16, '#5B3A28', 620);
    for (const [x, y] of [[250, 330], [570, 330], [250, 880], [570, 880]]) K.rr(ctx, x, y, 260, 480, 10, '#4A2E20', 621 + x + y, { hatch: false });
    K.ell(ctx, 800, 900, 26, 26, '#F2B84B', 630, { hatch: false });
    ctx.restore();
    ctx.fillStyle = '#3A2620'; ctx.fillRect(-W, 1460, W * 3, H);
    if (hand > 0) { // Mind's hand reaching the knob
      const hx = lerp(1150, 812, ease.outCubic(hand)), hy = 930;
      G.limb(ctx, [[W + 200, 1300], [1000, 1050], [hx, hy]], { color: '#2F6B4F', lw: 90 });
      K.ell(ctx, hx, hy, 46, 42, '#F0D2BC', 631, { lw: 5 });
    }
  }

  // EP1 memories: sepia, framed, a quick cut every 2 s
  function memory(ctx, t, k) {
    room(ctx, t);
    group(ctx, t, (who) => (who === 'pob' ? {} : k === 0 ? { eyes: 'happy', mouth: 'smile' } : k === 1 ? { eyes: 'closed', mouth: 'smile' } : { eyes: 'worried', mouth: 'frown' }));
    ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#A07850'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    ctx.save(); ctx.strokeStyle = '#F4EDE0'; ctx.lineWidth = 30; ctx.strokeRect(60, 380, W - 120, 1000); ctx.restore();
    const [x, y, s] = SPOT.pob; // a red ring around the silent Pob
    G.line(ctx, G.ellPts(x, y - 220 * s, 150 * s + 30, 210 * s + 30), { color: '#C8302E', lw: 8, seed: 700 + k });
  }

  const shakeAt = (t0, amp) => Shots.shake(amp, t0, 4);
  let bgSmall = null;

  // ---------------- shots ----------------
  const film = Shots.film([
    { at: at(1), draw(ctx, t) { // 1: through the mask holes, everyone staring
      room(ctx, t); group(ctx, t, () => ({ eyes: 'wide', mouth: 'flat' })); light(ctx, t, { dark: 0.15 });
      maskFrame(ctx, 0);
    }, cam: Shots.combine(Shots.handheld(10), shakeAt(at(1), 14)) },

    { at: at(2), draw(ctx, t, s) { // 2: your right hand pulls the mask off; the frame slides away
      room(ctx, t); group(ctx, t, () => ({ eyes: 'wide', mouth: 'o' })); light(ctx, t, { dark: 0.1 });
      const off = clamp((t - ev.maskOff) / 1.0);
      rightHand(ctx, lerp(W * 0.8, W * 0.86, off), lerp(H * 0.5, H * 1.3, ease.inCubic(off)));
      maskFrame(ctx, off);
    }, cam: Shots.push(1.15, 1.0) },

    { at: at(3), in: 'fade', draw(ctx, t) { // 3: your face, reflected in the (dry) window
      ctx.fillStyle = '#1B2348'; ctx.fillRect(0, 0, W, H);
      K.ell(ctx, W * 0.72, H * 0.22, 90, 90, '#F3E7C4', 640, { hatch: false });
      ctx.save(); ctx.globalAlpha = 0.55;
      K.chibi(ctx, { x: W / 2, y: H * 0.95, s: 1.9, who: 'you0', t, eyes: 'wide', mouth: 'o', shadow: false, seed: 91 });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(0, H * 0.3); ctx.lineTo(W * 0.4, 0); ctx.lineTo(W * 0.55, 0); ctx.lineTo(0, H * 0.45); ctx.fill(); ctx.restore(); // glass glare
      G.line(ctx, [[W * 0.12, 0], [W * 0.12, H]], { color: '#33264A', lw: 26, seed: 641 });
    }, cam: Shots.push(1.0, 1.06) },

    { at: at(4), in: 'fade', draw(ctx, t) { // 4: Bell facepalms
      room(ctx, t);
      group(ctx, t, (who) => (who === 'phrai' ? { armR: 2.9, eyes: 'closed', mouth: 'smile' } : { eyes: 'normal', mouth: 'flat' }));
      light(ctx, t, { warm: true });
    }, cam: { x: 0, y: 160, zoom: 1.4 } },

    { at: at(5), draw(ctx, t) { // 5: everyone laughs, warm again (window: dry, clear moon)
      room(ctx, t);
      group(ctx, t, (who) => ({ eyes: 'happy', mouth: 'smile', bob: Math.sin(t * 9 + SPOT[who][0]) * 7 }));
      light(ctx, t, { warm: true });
    }, cam: Shots.combine(Shots.push(1.15, 1.0), Shots.pan(80, 120)) },

    { at: at(6), in: 'zoom', draw(ctx, t) { // 6: you look at Bell's photo
      ctx.fillStyle = '#0E0B16'; ctx.fillRect(0, 0, W, H);
      phone(ctx, W / 2, H * 0.47, 1500, t, { photo: true, zoom: 1 });
    } },

    { at: at(7), draw(ctx, t, s) { // 7: who was the sheet?
      ctx.fillStyle = '#0E0B16'; ctx.fillRect(0, 0, W, H);
      phone(ctx, W / 2, H * 0.47, 1500, t, { photo: true, zoom: lerp(1, 3.2, ease.inOutQuad(s.u)) });
    } },

    { at: at(8), draw(ctx, t) { // 8: a LINE ping freezes everyone
      room(ctx, t);
      group(ctx, t, (who) => ({ eyes: 'wide', mouth: 'flat', look: who === 'phrai' ? 0 : -0.3 }));
      const p = ease.outBack(clamp((t - ev.linePing) / 0.25), 2.5);
      if (p > 0) { ctx.save(); ctx.translate(SPOT.phrai[0] + 110, SPOT.phrai[1] - 420); ctx.scale(p, p); K.rr(ctx, -60, -40, 120, 80, 20, '#3FB950', 650, { hatch: false }); txt(ctx, 'LINE', 0, 14, 36, '#FFFFFF'); ctx.restore(); }
      light(ctx, t);
    }, cam: { x: 0, y: 140, zoom: 1.25 } },

    { at: at(9), in: 'zoom', draw(ctx, t) { // 9: Ton's message
      ctx.fillStyle = '#0E0B16'; ctx.fillRect(0, 0, W, H);
      glow(ctx, W / 2, H * 0.45, 700, '150,170,255', 0.2);
      phone(ctx, W / 2, H * 0.46, 1250, t, { bubbles: [{ t: at(9) + 0.2, from: 'ต้น', text: 'โทษทีนะ รถติดมาก\nเพิ่งถึงหน้าบ้าน' }] });
    }, cam: Shots.push(1.0, 1.08) },

    { at: at(10), draw(ctx, t, s) { // 10: everyone turns to the sofa
      room(ctx, t);
      const u = clamp(s.dt / 0.6);
      group(ctx, t, (who) => (who === 'pob' ? {} : { eyes: 'wide', mouth: 'o', look: lerp(0, -1, u) }));
      light(ctx, t);
    }, cam: (s) => ({ x: lerp(0, -40, s.u), y: lerp(0, -60, s.u), zoom: lerp(1, 1.3, ease.inOutQuad(s.u)) }) },

    { at: at(11), draw(ctx, t, s) { // 11: Pob does not move. Lights flicker.
      room(ctx, t); group(ctx, t, (who) => (who === 'pob' ? {} : FRONT.includes(who) ? { hide: true } : { eyes: 'worried', mouth: 'frown', look: -1 }));
      light(ctx, t, { cx: SPOT.pob[0], cy: SPOT.pob[1] - 150 });
    }, cam: (s) => ({ x: SPOT.pob[0] - W / 2, y: SPOT.pob[1] - 150 - H / 2, zoom: lerp(2.0, 2.6, ease.inOutQuad(s.u)) }) },

    ...[0, 1, 2].map((k) => ({ at: ev.flashbacks[k], in: 'flash', draw: (ctx, t) => memory(ctx, t, k), cam: { zoom: 1.0 + k * 0.05 } })), // 12: memories

    { at: at(13), in: 'dip', draw(ctx, t, s) { // 13: the cloak hem covers the floor
      room(ctx, t); group(ctx, t, (who) => (who === 'pob' ? {} : { hide: true }));
      light(ctx, t, { cx: SPOT.pob[0], cy: SPOT.pob[1] });
    }, cam: (s) => ({ x: SPOT.pob[0] - W / 2, y: SPOT.pob[1] - 40 - H / 2, zoom: lerp(2.6, 3.4, ease.inOutQuad(s.u)) }) },

    { at: at(14), draw(ctx, t) { // 14: the hem lifts — nothing underneath (hit)
      ctx.fillStyle = '#140C0C'; ctx.fillRect(0, 0, W, H); // the dark void under the cloak
      const fy = H * 0.66;
      ctx.fillStyle = '#8A78B0'; ctx.fillRect(0, fy, W, H); // sofa seat below
      const lift = 120 + 160 * ease.outCubic(clamp((t - ev.windLift) / 0.7)) + Math.sin(t * 3) * 10;
      const hem = fy - lift;
      const pts = [[-40, -100], [W + 40, -100], [W + 40, hem]];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([W + 40 - (W + 80) * u, hem + Math.sin(u * Math.PI * 4 + t * 3) * 34]); }
      K.poly(ctx, pts, '#2B2530', 660, { hatchColor: 'rgba(255,255,255,0.08)' }); G.line(ctx, pts.slice(3), { color: 'rgba(255,120,90,0.8)', lw: 8, seed: 661 }); // rim light on the hem
      light(ctx, t, { cy: H * 0.5 });
    }, cam: Shots.combine(Shots.push(1.05, 1.15), shakeAt(at(14), 18)) },

    { at: at(15), draw(ctx, t) { // 15: the doorbell; everyone jumps
      room(ctx, t);
      const jump = Math.max(0, Math.sin(Math.PI * clamp((t - ev.doorbell) / 0.35))) * 40;
      group(ctx, t, (who) => (who === 'pob' ? {} : { eyes: 'wide', mouth: 'o', look: -1, y: SPOT[who][1] - jump }));
      light(ctx, t);
    }, cam: { x: -120, zoom: 1.05 } },

    { at: at(16), in: 'zoom', draw(ctx, t) { doorCam(ctx, t); } }, // 16: the door camera: Ton outside, wet ground

    { at: at(17), draw(ctx, t, s) { // 17: Mind walks to the door
      room(ctx, t);
      const u = clamp(s.dt / 2.6);
      group(ctx, t, (who) => (who === 'nak' ? { x: lerp(SPOT.nak[0], -300, ease.inOutQuad(u)), walk: u < 1 ? t * 10 : null, eyes: 'worried', mouth: 'flat' } : who === 'pob' ? {} : { eyes: 'worried', mouth: 'frown', look: -1 }));
      light(ctx, t);
    }, cam: (s) => ({ x: lerp(0, -560, ease.inOutQuad(s.u)), zoom: 1.0 }) },

    { at: at(18), draw(ctx, t) { // 18: Pob slowly turns: "Don't open it." (hit)
      room(ctx, t); group(ctx, t, (who) => (who === 'pob' ? { rot: -0.12 * ease.outCubic(clamp((t - at(18)) / 1.2)) } : FRONT.includes(who) ? { hide: true } : { eyes: 'wide', mouth: 'o' }));
      glow(ctx, SPOT.pob[0], SPOT.pob[1] - 170, 160, '255,60,40', 0.5);
      light(ctx, t, { cx: SPOT.pob[0], cy: SPOT.pob[1] - 150, dark: 0.1 });
    }, cam: Shots.combine((s) => ({ x: SPOT.pob[0] - W / 2, y: SPOT.pob[1] - 170 - H / 2, zoom: lerp(2.4, 2.9, s.u) }), shakeAt(at(18), 16)) },

    { at: at(19), draw(ctx, t) { // 19: eyes dart between the door and the sofa
      room(ctx, t);
      const look = Math.sin((t - at(19)) * 2.4) > 0 ? -1 : 0.2;
      group(ctx, t, (who) => (who === 'pob' ? {} : { eyes: 'worried', mouth: 'frown', look }));
      light(ctx, t);
    }, cam: Shots.handheld(8) },

    { at: at(20), in: 'whip', draw(ctx, t) { // 20: pounding on the door
      const k = ev.knocks.reduce((a, kt) => a + Math.exp(-Math.max(0, t - kt) * 12) * (t >= kt ? 1 : 0), 0);
      doorInside(ctx, t, { shake: 24 * k });
      // each knock: dust shakes off the frame in a pale burst (a clear picture hit for verify)
      const hit = ev.knocks.reduce((a, kt) => a + (t >= kt ? Math.exp(-(t - kt) * 14) : 0), 0);
      if (hit > 0.02) { ctx.save(); ctx.fillStyle = `rgba(255,236,210,${Math.min(0.55, hit * 0.55)})`; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
      light(ctx, t, { cx: W / 2, cy: H * 0.5 });
    }, cam: (s) => { const k = ev.knocks.reduce((a, kt) => a + (s.t >= kt ? Math.exp(-(s.t - kt) * 10) : 0), 0); return { x: U.noise1(s.t * 30, 5) * 20 * k, zoom: 1.05 }; } },

    { at: at(21), in: 'zoom', draw(ctx, t, s) { doorCam(ctx, t, { zoom: lerp(1.2, 1.9, ease.inOutQuad(s.u)) }); } }, // 21: wet ground, no shadow

    { at: at(22), draw(ctx, t) { // 22: split — the door | the sofa (dry window behind)
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2 - 6, H); ctx.clip();
      ctx.translate(-80, 0); doorInside(ctx, t, { shake: 3 }); light(ctx, t, { cx: W / 4 });
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(W / 2 + 6, 0, W / 2, H); ctx.clip();
      ctx.translate(W * 0.75, H * 0.42); ctx.scale(1.7, 1.7); ctx.translate(-SPOT.pob[0], -(SPOT.pob[1] - 120));
      room(ctx, t); group(ctx, t, (who) => (who === 'pob' ? {} : { hide: true })); light(ctx, t, { cx: 400 });
      ctx.restore();
      ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - 6, 0, 12, H);
    } },

    { at: at(23), draw(ctx, t, s) { doorInside(ctx, t, { hand: clamp(s.dt / 1.6) }); light(ctx, t, { cx: 800, cy: 900 }); }, cam: Shots.push(1.0, 1.25) }, // 23: Mind grips the knob

    { at: at(24), in: { type: 'dip', color: '#000' }, draw(ctx, t) { // 24: the choice
      if (!bgSmall) bgSmall = G.makeCanvas(Math.round(W / 8), Math.round(H / 8));
      const b = bgSmall.getContext('2d');
      b.setTransform(1 / 8, 0, 0, 1 / 8, 0, 0); b.clearRect(0, 0, W, H);
      doorInside(b, t, {});
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(bgSmall, 0, 0, W, H); ctx.restore();
      ctx.fillStyle = 'rgba(6,4,12,0.72)'; ctx.fillRect(-W, -H, W * 3, H * 3);
      const c0 = ev.choice, pop = (d) => ease.outBack(clamp((t - c0 - d) / 0.3), 2);
      ctx.save(); ctx.translate(W / 2, 620); ctx.scale(pop(0), pop(0)); txt(ctx, 'ตอนที่ 3', 0, 0, 150, '#FFFFFF', 700, 16); ctx.restore();
      ctx.save(); ctx.translate(W / 2, 800); ctx.scale(pop(0.6), pop(0.6)); txt(ctx, 'คุณจะเปิดประตูไหม?', 0, 0, 84, '#FFD84A', 700, 12); ctx.restore();
      for (const [x, label, col, d] of [[320, 'เปิด', '#3FA84F', 1.2], [760, 'ไม่เปิด', '#C8281E', 1.4]]) {
        const p = pop(d); if (p <= 0) continue;
        ctx.save(); ctx.translate(x, 1060); ctx.scale(p, p);
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-170, -80, 340, 150, 34); ctx.fill();
        txt(ctx, label, 0, 26, 84, '#FFFFFF'); ctx.restore();
      }
      if (t > c0 + 2) txt(ctx, 'คอมเมนต์ว่าคุณเลือกทางไหน', W / 2, 1260, 50, '#FFFFFF', 500, 8);
    } },
  ], { end: S.DURATION });

  // ---------------- overlays ----------------
  function subtitles(ctx, t) {
    const sub = S.subtitles.find((x) => t >= x.t && t < x.end);
    if (!sub) return;
    const lines = sub.text.split('\n');
    const size = sub.red ? 96 : 84, lh = size * 1.22, base = H * 0.75;
    const p = sub.red ? ease.outBack(clamp((t - sub.t) / 0.2), 2.4) : 1;
    ctx.save();
    ctx.globalAlpha = sub.red ? 1 : clamp((t - sub.t) / 0.25);
    ctx.translate(W / 2, base); ctx.scale(p, p); ctx.translate(-W / 2, -base);
    lines.forEach((ln, i) => {
      const y = base - (lines.length - 1 - i) * lh;
      if (sub.red) {
        ctx.font = `700 ${size}px Kanit`; const w = ctx.measureText(ln).width;
        ctx.fillStyle = '#C81E1E'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 30, y - size * 0.92, w + 60, size * 1.2, 14); ctx.fill();
        txt(ctx, ln, W / 2, y, size, '#FFFFFF');
      } else txt(ctx, ln, W / 2, y, size, '#FFFFFF', 700, 16);
    });
    txt(ctx, sub.en, W / 2, base + 70, 38, '#D8D8D8', 500, 8);
    ctx.restore();
  }
  function soundTags(ctx, t) {
    for (const s of S.soundTags) if (t >= s.t && t < s.end) {
      ctx.save(); ctx.globalAlpha = clamp((t - s.t) / 0.1) * clamp((s.end - t) / 0.3);
      ctx.font = 'italic 500 50px Kanit'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
      ctx.strokeText(s.text, W / 2, G.SAFE.y + 60); ctx.fillStyle = '#FFE08A'; ctx.fillText(s.text, W / 2, G.SAFE.y + 60); ctx.restore();
    }
  }

  // TikTok cover (`render.js stills -1`): split door | Pob, the question on top; content inside the centre 3:4 (y 240..1680)
  function cover(ctx) {
    // No spoilers: shot 1 only — through the mask's eye holes everyone stares at you, plus the opening rule.
    const t = 2;
    room(ctx, t); group(ctx, t, () => ({ eyes: 'wide', mouth: 'flat' })); light(ctx, t, { dark: 0.1 });
    maskFrame(ctx, 0); // black everywhere outside the holes: a clean field for the text
    ctx.save(); ctx.translate(W / 2, 330); ctx.rotate(-0.04);
    ctx.fillStyle = '#F2B84B'; ctx.beginPath(); ctx.roundRect(-200, -52, 400, 88, 22); ctx.fill();
    txt(ctx, 'EP.2 ถอด', 0, 20, 58, '#2A2320'); ctx.restore();
    for (const [i, line] of ['อย่ามองชายชุด', 'ของเพื่อน'].entries()) {
      const y = 1330 + i * 150;
      ctx.save(); ctx.font = '700 120px Kanit'; const w = ctx.measureText(line).width; ctx.restore();
      ctx.fillStyle = '#C81E1E'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 36, y - 112, w + 72, 144, 20); ctx.fill();
      txt(ctx, line, W / 2, y, 120, '#FFFFFF');
    }
  }

  Studio.film({
    async init() {
      await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Bold.ttf', 700);
      await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Medium.ttf', 500);
    },
    draw(ctx, t) { if (t < 0) return cover(ctx); film(ctx, t); subtitles(ctx, t); soundTags(ctx, t); },
    post: { paper: 0.35, vignette: 0.45, grain: 0.07 },
    fadeOut: 1.2,
  });
})();
