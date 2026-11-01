// THE FILM — EP4 "ครบแปด", 21 shots (STORYBOARD.md). Same living room as EP1–3; every frame is a pure function of t.
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
  };
  const ORDER = ['tani', 'krahang', 'pret', 'phrai', 'nak', 'krasue'];
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

  function windowPane(ctx, x, y, w, h) {
    K.rr(ctx, x, y, w, h, 18, '#1B2348', 210, { hatch: false });
    K.ell(ctx, x + w * 0.62, y + h * 0.25, 52, 52, '#F3E7C4', 211, { hatch: false });
    for (let k = 0; k < 12; k++) { ctx.fillStyle = 'rgba(255,255,240,0.8)'; ctx.fillRect(x + 20 + U.hash(k, 7) * (w - 40), y + 20 + U.hash(k, 8) * (h - 40), 3, 3); }
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
    pts.forEach(([x, y], i) => {
      const c = ['#F2B84B', '#E0703E', '#B98CE0'][i % 3];
      glow(ctx, x, y + 16, 80, c === '#B98CE0' ? '185,140,224' : '242,184,75', 0.45 * (0.75 + 0.25 * Math.sin(t * 3 + i * 2.1)));
      K.ell(ctx, x, y + 16, 10, 14, c, 220 + i, { hatch: false, lw: 3 });
    });
    const fl = ctx.createLinearGradient(0, FLOOR, 0, H);
    fl.addColorStop(0, '#6A4636'); fl.addColorStop(1, '#2C1B16');
    ctx.fillStyle = fl; ctx.fillRect(ROOM.x0, FLOOR, ROOM.x1 - ROOM.x0, H);
    for (let i = 1; i < 8; i++) G.line(ctx, [[ROOM.x0, FLOOR + i * i * 12], [ROOM.x1, FLOOR + i * i * 12]], { color: 'rgba(0,0,0,0.25)', lw: 3, seed: 240 + i });
    G.line(ctx, [[ROOM.x0, FLOOR], [ROOM.x1, FLOOR]], { color: G.C.ink, lw: 5, seed: 249 });
    K.rr(ctx, SOFA.x, SOFA.y - 230, SOFA.w, 150, 40, '#4B3A6A', 250);
    K.rr(ctx, SOFA.x - 20, SOFA.y - 110, SOFA.w + 40, 110, 30, '#5B4A7E', 251);
    K.rr(ctx, -560, FLOOR - 520, 300, 540, 12, '#5B3A28', 260);
    K.ell(ctx, -300, FLOOR - 250, 14, 14, '#F2B84B', 261, { hatch: false });
    pumpkin(ctx, -120, FLOOR + 160, 1.0, t, 1);
    pumpkin(ctx, 1090, FLOOR + 90, 0.8, t, 2);
  }

  // everyone blinks on their own rhythm — except Bell (the one wrong thing; memories excluded)
  const blinkOf = (who, t, rate = 0.37) => (who === 'phrai' ? 0 : ((t * rate + ORDER.indexOf(who) * 0.29) % 1 > 0.95 ? 1 : 0));

  // Pin (tani) is the mimic until it collapses (shot 4): flower mirrored to the left; gone after
  function group(ctx, t, act = () => ({})) {
    for (const who of ORDER) {
      if (who === 'tani' && t >= at(4)) continue;
      const [x, y, s] = SPOT[who];
      const a = act(who) || {};
      if (a.hide) continue;
      K.chibi(ctx, { x, y, s, who, t, seed: ORDER.indexOf(who) + 1, blink: blinkOf(who, t), bob: Math.sin(t * 2 + x) * 3, ...(who === 'tani' ? { mirror: true } : {}), ...a });
    }
  }

  function light(ctx, t, { cx = W / 2, cy = H * 0.55, warm = false, dark = 0 } = {}) {
    const g = ctx.createRadialGradient(cx, cy, 60, cx, cy, H * 0.8);
    if (warm) { g.addColorStop(0, '#FFF6EA'); g.addColorStop(0.6, '#D9A8A0'); g.addColorStop(1, '#4A2A3A'); }
    else { g.addColorStop(0, '#DDE2FF'); g.addColorStop(0.5, '#7C72AE'); g.addColorStop(1, '#1C1634'); }
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    if (dark > 0) { ctx.save(); ctx.fillStyle = `rgba(8,6,16,${dark})`; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
  }

  // the room drawn at 1/8 size and scaled up = a cheap blur (never ctx.filter on full frames)
  let bgSmall = null;
  function blurred(ctx, t, paint) {
    if (!bgSmall) bgSmall = G.makeCanvas(Math.round(W / 8), Math.round(H / 8));
    const b = bgSmall.getContext('2d');
    b.setTransform(1 / 8, 0, 0, 1 / 8, 0, 0); b.clearRect(0, 0, W, H);
    paint(b);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(bgSmall, 0, 0, W, H); ctx.restore();
  }

  // your right hand: an open reach, or (point) a fist with the index finger up
  function rightHand(ctx, hx, hy, point = false) {
    G.limb(ctx, [[W + 120, H + 160], [W - 60, hy + 260], [hx, hy]], { color: '#24212B', lw: 120 });
    if (point) {
      K.rr(ctx, hx - 16, hy - 150, 32, 120, 16, '#F0D2BC', 412, { hatch: false, lw: 4 });
      K.ell(ctx, hx, hy, 60, 52, '#F0D2BC', 410, { lw: 5 });
      return;
    }
    K.ell(ctx, hx, hy, 58, 54, '#F0D2BC', 410, { lw: 5 });
    for (let k = 0; k < 4; k++) K.ell(ctx, hx - 40 + k * 26, hy - 44, 15, 24, '#F0D2BC', 411 + k, { hatch: false, lw: 4 });
  }

  // Pin's frangipani (mirrored = by the left of the bun), falling to the floor
  const TANI_FLOWER = [SPOT.tani[0] - 70 * SPOT.tani[2], SPOT.tani[1] - 472 * SPOT.tani[2]];
  function flower(ctx, t) {
    const u = ease.inQuad(clamp((t - ev.sheetRise[0]) / 1.3));
    const x = lerp(TANI_FLOWER[0], SPOT.tani[0] - 110, u), y = lerp(TANI_FLOWER[1], SPOT.tani[1] + 6, u);
    ctx.save(); ctx.translate(x, y); ctx.rotate(u * 2.4);
    for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; K.ell(ctx, Math.cos(a) * 10, Math.sin(a) * 10, 9, 6.5, '#F4C2D2', 480 + p, { hatch: false, lw: 2 }); }
    K.ell(ctx, 0, 0, 5, 5, '#F2D25A', 486, { hatch: false, lw: 2 });
    ctx.restore();
  }

  // the sheet at Pin's spot: rise 0..1 (grows out of the floor), flat 0..1 (collapses to a cloth)
  function mimicSheet(ctx, t, rise, flat) {
    const [x, y] = SPOT.tani;
    ctx.save(); ctx.translate(x, y); ctx.scale(1 + 0.6 * flat, Math.max(0.06, rise * (1 - 0.8 * flat))); ctx.translate(-x, -y);
    K.sheet(ctx, { x, y, s: 0.66, t, shadow: flat < 1, look: flat ? 0 : 0.4 });
    ctx.restore();
  }

  // ---------------- phone + last year's photo ----------------
  // 8 people: Bell (same costume) + 6 strangers with smeared faces + the 8th in YOUR costume, face hidden.
  // No sheet, none of this year's friends (f10/f11 stay unanswered).
  const LAST = ['s0', 's1', 'phrai', 's2', 's3', 's4', 'you', 's5'];
  const STRANGER = ['#6E6A80', '#7A5A50', '#5A7060', '#806A4A', '#5A5E7A', '#7A6070'];
  const EIGHTH = 6;
  function lastYearPhoto(ctx, x, y, w, h, zoom = 1) {
    ctx.save();
    ctx.fillStyle = '#E9E2F2'; ctx.fillRect(x, y, w, h);
    const ax = x + (w / 8) * (EIGHTH + 0.5), ay = y + h * 0.52;
    ctx.translate(ax, ay); ctx.scale(zoom, zoom); ctx.translate(-ax, -ay);
    ctx.fillStyle = '#5E5070'; ctx.fillRect(x - w, y - h, w * 3, h * 1.55);
    ctx.fillStyle = '#7E604E'; ctx.fillRect(x - w, y + h * 0.55, w * 3, h);
    LAST.forEach((who, i) => {
      const px = x + (w / 8) * (i + 0.5), py = y + h * 0.7 + (i % 2) * 70;
      if (who[0] === 's') {
        const k = +who[1], s = 0.42;
        K.rr(ctx, px - 60 * s, py - 230 * s, 120 * s, 230 * s, 30 * s, STRANGER[k], 520 + k, { hatch: false, lw: 2 });
        K.ell(ctx, px, py - 330 * s, 110 * s, 105 * s, '#E2C3AE', 530 + k, { hatch: false, lw: 2 });
        ctx.fillStyle = 'rgba(226,214,232,0.82)'; ctx.beginPath(); ctx.ellipse(px + 6 * s, py - 320 * s, 120 * s, 80 * s, 0.3, 0, Math.PI * 2); ctx.fill(); // smeared face
      } else K.chibi(ctx, { x: px, y: py, s: 0.42, who, t: 3, eyes: 'normal', mouth: 'smile', seed: 50 + i, shadow: false });
    });
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = 'rgba(190,150,110,0.35)'; ctx.fillRect(x, y, w, h); ctx.restore(); // last year: warmer, faded
    txt(ctx, '31.10.2025', x + w - 110, y + 60, 34, '#FFB347', 700, 6);
  }
  function phone(ctx, cx, cy, h, { zoom = 1 } = {}) {
    const w = h * 0.5;
    K.rr(ctx, cx - w / 2, cy - h / 2, w, h, 46, '#1E2028', 400, { hatch: false });
    const sx = cx - w / 2 + 22, sy = cy - h / 2 + 22, sw = w - 44, sh = h - 44;
    ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 30); ctx.clip();
    ctx.fillStyle = '#141018'; ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#5B3E8C'; ctx.fillRect(sx, sy, sw, 120);
    txt(ctx, 'ฮาโลวีนบ้านเบล 2025', sx + sw / 2, sy + 78, 40, '#FFFFFF');
    lastYearPhoto(ctx, sx, sy + 140, sw, sh - 280, zoom);
    ctx.restore();
  }

  // a tripod with the phone on it and a red timer light; beep 0..1 flashes the light
  function tripod(ctx, x, y, s, beep) {
    for (const d of [-1, 0, 1]) G.line(ctx, [[x, y - 360 * s], [x + d * 120 * s, y]], { color: '#1A1820', lw: 12 * s, seed: 700 + d });
    K.rr(ctx, x - 70 * s, y - 520 * s, 140 * s, 180 * s, 18 * s, '#1E2028', 703, { hatch: false });
    glow(ctx, x + 40 * s, y - 495 * s, 120 * s, '255,40,40', 0.25 + 0.75 * beep);
    K.ell(ctx, x + 40 * s, y - 495 * s, 10 * s, 10 * s, beep > 0.3 ? '#FF3030' : '#7A1A1A', 704, { hatch: false, lw: 2 });
  }
  const beepAt = (t) => ev.tripodBeeps.reduce((a, b) => a + (t >= b ? Math.exp(-(t - b) * 14) : 0), 0);
  const timerBlink = (t) => (t >= at(15) + 1 ? (Math.floor(t * 1.4) % 2 ? 1 : 0.15) : 0); // slow blink before the beeps start
  const tripodLight = (t) => Math.min(1, Math.max(timerBlink(t), beepAt(t)));

  // ---------------- memories: frozen, faded stills (Bell blinks in memories — it's "before") ----------------
  function sepia(ctx, t, paint) {
    paint(ctx);
    ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#A07850'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    ctx.save(); ctx.fillStyle = 'rgba(244,237,224,0.18)'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    ctx.save(); ctx.strokeStyle = '#F4EDE0'; ctx.lineWidth = 30; ctx.strokeRect(60, 380, W - 120, 1000); ctx.restore();
    const r = clamp(1 - (t - ev.tapeRewind) / 0.7); // tape rewind: tracking lines on the way in
    if (r > 0 && t >= ev.tapeRewind) for (let k = 0; k < 7; k++) { ctx.fillStyle = `rgba(255,255,255,${0.35 * r})`; ctx.fillRect(0, U.hash(k, Math.floor(t * 30)) * H, W, 10 + 30 * U.hash(k, 9)); }
  }
  function memCount(ctx) { // EP1 shot 18: the finger counts 1..7 — the 7th is you; Bell never counts herself
    const t = 2;
    room(ctx, t);
    for (const who of ORDER) { const [x, y, s] = SPOT[who]; K.chibi(ctx, { x, y, s, who, t, seed: ORDER.indexOf(who) + 1, ...(who === 'phrai' ? { armR: 1.6, armL: 0.3, eyes: 'worried' } : { eyes: 'worried', mouth: 'flat' }) }); }
    ['nak', 'tani', 'krahang', 'pret', 'krasue', 'sofa', 'you'].forEach((who, i) => {
      const [x, y] = who === 'you' ? [540, 1250] : who === 'sofa' ? [SOFA.x + 300, SOFA.y - 230] : [SPOT[who][0], SPOT[who][1] - 560 * SPOT[who][2]];
      K.ell(ctx, x, y, 44, 44, who === 'you' ? '#C8302E' : '#F2B84B', 470 + i, { hatch: false, lw: 4 });
      txt(ctx, String(i + 1), x, y + 20, 56, '#FFFFFF');
    });
    light(ctx, t);
  }
  function memForgot(ctx) { // EP2 shot 4: "ลืมแอด" — Bell facepalms
    const t = 2;
    room(ctx, t);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1.4, 1.4); ctx.translate(-W / 2, -H / 2 - 160);
    for (const who of ORDER) { const [x, y, s] = SPOT[who]; K.chibi(ctx, { x, y, s, who, t, seed: ORDER.indexOf(who) + 1, ...(who === 'phrai' ? { armR: 2.9, eyes: 'closed', mouth: 'smile' } : { eyes: 'normal', mouth: 'flat' }) }); }
    ctx.restore();
    light(ctx, t, { warm: true });
  }
  function memWhisper(ctx) { // EP3 shot 17: Bell leans in to whisper
    const t = 2;
    room(ctx, t);
    K.chibi(ctx, { x: W * 0.62, y: H * 0.9, s: 1.75, who: 'phrai', t, eyes: 'worried', mouth: 'o', look: -0.8, rot: -0.12, seed: 71 });
    light(ctx, t);
  }

  // Bell, big: MCU framing (face ≈ H*0.6, above the subtitle rail)
  function bellClose(ctx, t, o = {}) {
    K.chibi(ctx, { x: W / 2, y: H * 0.96, s: 1.9, who: 'phrai', t, seed: 4, eyes: 'normal', mouth: 'smile', blink: 0, ...o });
  }

  const shakeAt = (t0, amp) => Shots.shake(amp, t0, 4);
  const STARE = (who) => ({ eyes: 'normal', mouth: 'flat', look: 0 });

  // the lineup (shots 16–17): four friends + Bell, one gap left for you
  const LINE = { nak: 120, krahang: 290, phrai: 640, pret: 810, krasue: 970 };
  const GAP = 460, LINE_Y = FLOOR + 200, LINE_S = 0.6;
  function lineup(ctx, t, u) {
    for (const who of ['krahang', 'pret', 'nak', 'krasue', 'phrai']) {
      const [x0, y0, s0] = SPOT[who], v = ease.inOutQuad(clamp(u * 1.3 - (who === 'phrai' ? 0.3 : 0)));
      const moving = v > 0 && v < 1;
      K.chibi(ctx, { x: lerp(x0, LINE[who], v), y: lerp(y0, LINE_Y, v), s: lerp(s0, LINE_S, v), who, t, seed: ORDER.indexOf(who) + 1, blink: blinkOf(who, t), eyes: 'normal', mouth: 'smile', look: 0, walk: moving ? t * 9 : null, armL: 0.1, armR: 0.1 });
    }
  }

  // ---------------- shots ----------------
  const film = Shots.film([
    { at: at(1), draw(ctx, t) { // 1: everyone stands still, staring at you (hit)
      room(ctx, t); group(ctx, t, STARE); light(ctx, t, { dark: 0.12 });
    }, cam: shakeAt(at(1), 14) },

    { at: at(2), draw(ctx, t) { // 2: your right hand rises to point — the room is a dark blur, no target shown
      blurred(ctx, t, (b) => { room(b, t); group(b, t, STARE); light(b, t, { dark: 0.2 }); });
      ctx.fillStyle = 'rgba(6,4,12,0.55)'; ctx.fillRect(-W, -H, W * 3, H * 3);
      const u = ease.outCubic(clamp((t - ev.point) / 2.6));
      rightHand(ctx, lerp(W * 0.8, W * 0.6, u), lerp(H + 260, H * 0.5, u), true);
    }, cam: Shots.push(1.0, 1.12) },

    { at: at(3), draw(ctx, t) { // 3: the sheet rises out of "Pin"; her flower falls on the LEFT
      room(ctx, t);
      const rise = ease.inOutCubic(clamp((t - ev.sheetRise[0]) / (ev.sheetRise[1] - ev.sheetRise[0])));
      group(ctx, t, (who) => (who === 'tani' ? (rise >= 1 ? { hide: true } : { sy: 1 - rise, eyes: 'normal', mouth: 'flat' }) : { eyes: 'wide', mouth: 'o', look: clamp((SPOT.tani[0] - SPOT[who][0]) / 300, -1, 1) }));
      if (rise > 0) mimicSheet(ctx, t, rise, 0);
      if (t >= ev.sheetRise[0]) flower(ctx, t);
      light(ctx, t, { cx: SPOT.tani[0], cy: SPOT.tani[1] - 200, dark: 0.08 });
    }, cam: (s) => ({ x: SPOT.tani[0] - W / 2 + 60, y: -100, zoom: lerp(1.6, 1.9, ease.inOutQuad(s.u)) }) },

    { at: at(4), draw(ctx, t) { // 4: it drops flat — only cloth left (collapse on the sound)
      room(ctx, t);
      const flat = ease.inCubic(clamp((t - ev.collapse) / 0.22));
      mimicSheet(ctx, t, 1, flat); flower(ctx, t);
      light(ctx, t, { cx: SPOT.tani[0], cy: SPOT.tani[1], dark: 0.1 });
    }, cam: (s) => ({ x: SPOT.tani[0] - W / 2 + 40, y: SPOT.tani[1] - 200 - H / 2 + 120, zoom: 2.3 + (s.t >= ev.collapse ? 0.04 * Math.exp(-(s.t - ev.collapse) * 6) : 0) }) },

    { at: at(5), draw(ctx, t) { // 5: warm light again, the five laugh (the cloth still on the floor)
      room(ctx, t); mimicSheet(ctx, t, 1, 1); flower(ctx, t);
      group(ctx, t, (who) => (who === 'phrai' ? { eyes: 'normal', mouth: 'smile' } : { eyes: 'happy', mouth: 'o', bob: Math.sin(t * 9 + SPOT[who][0]) * 7 }));
      light(ctx, t, { warm: true });
    } },

    { at: at(6), draw(ctx, t) { // 6: Bell close — smiling, not laughing, NOT blinking; Mind and Boss behind blink normally
      room(ctx, t);
      for (const [who, x, y, s] of [['nak', 230, H * 0.5, 1.0], ['krahang', 860, H * 0.47, 0.95]]) K.chibi(ctx, { x, y, s, who, t, seed: ORDER.indexOf(who) + 1, eyes: 'normal', mouth: 'o', blink: blinkOf(who, t, 0.62), bob: Math.sin(t * 9 + x) * 7 });
      bellClose(ctx, t);
      light(ctx, t, { warm: true });
    } },

    { at: at(7), draw(ctx, t, s) { // 7: Bell walks toward you, then three slow claps
      room(ctx, t);
      const u = ease.inOutQuad(clamp(s.dt / 3.2));
      const c = ev.claps.reduce((a, k) => a + Math.exp(-((t - k) ** 2) / 0.004), 0);
      group(ctx, t, (who) => (who === 'phrai'
        ? { x: 540, y: lerp(SPOT.phrai[1], H * 0.9, u), s: lerp(0.78, 1.45, u), walk: u < 1 ? t * 7 : null, armL: t > ev.claps[0] - 0.4 ? -0.15 - 0.5 * c : 0.25, armR: t > ev.claps[0] - 0.4 ? -0.15 - 0.5 * c : 0.25, eyes: 'normal', mouth: 'smile', look: 0 }
        : { eyes: 'normal', mouth: 'smile' }));
      light(ctx, t, { warm: true });
    }, cam: Shots.push(1.0, 1.15) },

    { at: at(8), draw(ctx, t) { // 8: "ปีนี้ครบแปดพอดี" — wide smile (hit)
      room(ctx, t); bellClose(ctx, t, { mouth: 'o' }); light(ctx, t, { warm: true, dark: 0.15 });
    }, cam: shakeAt(at(8), 18) },

    { at: at(9), draw(ctx, t) { // 9: the friends turn to look at Bell, puzzled
      room(ctx, t);
      group(ctx, t, (who) => (who === 'phrai' ? { eyes: 'normal', mouth: 'smile', look: 0 } : { eyes: 'worried', mouth: 'o', look: clamp((540 - SPOT[who][0]) / 300, -1, 1), lookY: SPOT[who][1] < FLOOR + 200 ? 0.6 : 0 }));
      light(ctx, t);
    }, cam: { y: 200, zoom: 1.25 } },

    { at: at(10), draw(ctx, t) { // 10: Bell lifts her phone
      room(ctx, t);
      group(ctx, t, (who) => (who === 'phrai' ? { phone: true, eyes: 'normal', mouth: 'smile', look: 0 } : { eyes: 'worried', mouth: 'flat', look: clamp((540 - SPOT[who][0]) / 300, -1, 1) }));
      light(ctx, t);
    }, cam: { x: 0, y: SPOT.phrai[1] - 300 - H / 2, zoom: 1.9 } },

    { at: at(11), in: 'zoom', draw(ctx, t, s) { // 11: last year's photo — eight people
      ctx.fillStyle = '#0E0B16'; ctx.fillRect(-W, -H, W * 3, H * 3);
      glow(ctx, W / 2, H * 0.45, 700, '150,170,255', 0.2);
      phone(ctx, W / 2, H * 0.42, 1400);
    }, cam: Shots.push(1.0, 1.08) },

    { at: at(12), draw(ctx, t, s) { // 12: the eighth: your costume, mask on, face hidden
      ctx.fillStyle = '#0E0B16'; ctx.fillRect(-W, -H, W * 3, H * 3);
      phone(ctx, W / 2, H * 0.42, 1400, { zoom: lerp(2.2, 2.4, s.u) });
    }, cam: { zoom: 1.08 } },

    { at: at(13), in: { type: 'dip', color: '#000' }, draw(ctx, t) { // 13: memories — the count, the "forgot to add you"
      sepia(ctx, t, t < at(13) + 2.5 ? memCount : memForgot);
    } },

    { at: at(14), draw(ctx, t) { sepia(ctx, t, memWhisper); } }, // 14: memory — Bell's whisper (EP3 shot 17)

    { at: at(15), in: { type: 'dip', color: '#000' }, draw(ctx, t) { // 15: Bell sets the phone on a tripod; the red timer light
      room(ctx, t); mimicSheet(ctx, t, 1, 1);
      group(ctx, t, (who) => (who === 'phrai' ? { hide: true } : { eyes: 'worried', mouth: 'flat' }));
      K.chibi(ctx, { x: 800, y: FLOOR + 470, s: 0.82, who: 'phrai', t, seed: 4, armR: 2.0, eyes: 'normal', mouth: 'smile', look: 1, blink: 0 }); // in front of everyone
      tripod(ctx, 1010, FLOOR + 520, 1.0, tripodLight(t));
      light(ctx, t);
    }, cam: { x: 180, y: 120, zoom: 1.45 } },

    { at: at(16), draw(ctx, t, s) { // 16: they line up on their own — blank smiles, one gap
      room(ctx, t); mimicSheet(ctx, t, 1, 1);
      lineup(ctx, t, clamp(s.dt / 3.5));
      light(ctx, t, { dark: 0.08 });
    } },

    { at: at(17), draw(ctx, t) { // 17: your feet step forward on their own (heartbeat)
      blurred(ctx, t, (b) => { room(b, t); lineup(b, t, 1); light(b, t, { dark: 0.1 }); });
      const fl = ctx.createLinearGradient(0, H * 0.55, 0, H); fl.addColorStop(0, 'rgba(44,27,22,0)'); fl.addColorStop(0.4, '#3A251C'); fl.addColorStop(1, '#2C1B16');
      ctx.fillStyle = fl; ctx.fillRect(-W, H * 0.55, W * 3, H);
      const k = ev.steps.filter((st) => t >= st - 0.9).length;
      ev.steps.forEach((st, i) => {
        if (i >= k || i < k - 2) return; // only the latest two steps on screen
        const d = i % 2 ? 1 : -1, p = ease.inOutQuad(clamp((t - st) / 0.5));
        const fx = W / 2 + d * 150, fy = lerp(H * 0.9, H * 0.5, p);
        K.rr(ctx, fx - 80, fy - 60, 160, 260, 70, '#24212B', 720 + i, { lw: 5 });
        K.rr(ctx, fx - 84, fy + 150, 168, 70, 30, '#E8E2EE', 725 + i, { hatch: false, lw: 4 });
      });
    }, cam: Shots.handheld(16) },

    { at: at(18), draw(ctx, t, s) { // 18: the phone on the tripod — within reach; your hand comes up
      blurred(ctx, t, (b) => { room(b, t); lineup(b, t, 1); light(b, t, { dark: 0.15 }); });
      ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(2.2, 2.2); ctx.translate(-W / 2, -H * 0.55);
      tripod(ctx, W / 2 - 60, H * 0.72, 1.3, tripodLight(t));
      ctx.restore();
      const u = ease.outCubic(clamp((s.dt - 1.4) / 2.6));
      rightHand(ctx, lerp(W * 0.85, W * 0.66, u), lerp(H + 260, H * 0.62, u));
    } },

    { at: at(19), draw(ctx, t) { // 19: Bell's eyes, open, never blinking — the beeps quicken
      room(ctx, t);
      K.chibi(ctx, { x: W / 2, y: H * 0.45 + 332 * 5, s: 5, who: 'phrai', t, seed: 4, eyes: 'normal', mouth: 'flat', blink: 0, look: 0 });
      glow(ctx, W * 0.95, H * 0.4, 600, '255,40,40', 0.35 * tripodLight(t));
      light(ctx, t, { dark: 0.2 });
    } },

    { at: at(20), draw(ctx, t, s) { // 20: Bell turns to the camera — "don't move, and smile" (hit)
      room(ctx, t);
      bellClose(ctx, t, { look: lerp(-1, 0, ease.outCubic(clamp(s.dt / 0.35))), mouth: 'smile' });
      glow(ctx, W * 0.9, H * 0.35, 700, '255,40,40', 0.4);
      light(ctx, t, { dark: 0.3 });
    }, cam: Shots.combine(Shots.push(1.0, 1.1), shakeAt(at(20), 20)) },

    { at: at(21), in: { type: 'dip', color: '#000' }, draw(ctx, t) { // 21: the choice — the finale
      blurred(ctx, t, (b) => { room(b, t); lineup(b, t, 1); light(b, t, { dark: 0.1 }); });
      ctx.fillStyle = 'rgba(6,4,12,0.74)'; ctx.fillRect(-W, -H, W * 3, H * 3);
      const c0 = ev.choice, pop = (d) => ease.outBack(clamp((t - c0 - d) / 0.3), 2);
      ctx.save(); ctx.translate(W / 2, 520); ctx.scale(pop(0), pop(0)); txt(ctx, 'ตอนที่ 5 (ตอนจบ)', 0, 0, 110, '#FFFFFF', 700, 14); ctx.restore();
      ctx.save(); ctx.translate(W / 2, 700); ctx.scale(pop(0.6), pop(0.6)); txt(ctx, 'คุณจะทำยังไง?', 0, 0, 96, '#FFD84A', 700, 12); ctx.restore();
      [['ยอมถ่ายรูป', '#5B3E8C'], ['แย่งมือถือ', '#C81E1E']].forEach(([label, col], i) => {
        const p = pop(1.2 + i * 0.25); if (p <= 0) return;
        ctx.save(); ctx.translate(W / 2, 920 + i * 200); ctx.scale(p, p);
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-300, -76, 600, 144, 34); ctx.fill();
        txt(ctx, label, 0, 26, 82, '#FFFFFF'); ctx.restore();
      });
      if (t > c0 + 2.2) txt(ctx, 'คอมเมนต์ว่าคุณจะทำอะไร', W / 2, 1420, 50, '#FFFFFF', 500, 8);
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

  // TikTok cover (`render.js stills -1`). No spoilers: shot 1 only — everyone staring + the opening rule.
  function cover(ctx) {
    const t = 1;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1.15, 1.15); ctx.translate(-W / 2, -H / 2 + 60);
    room(ctx, t); group(ctx, t, STARE); light(ctx, t, { dark: 0.12 });
    ctx.restore();
    const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(8,6,16,0.92)'); g.addColorStop(1, 'rgba(8,6,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900);
    ctx.save(); ctx.translate(W / 2, 330); ctx.rotate(-0.04);
    ctx.fillStyle = '#F2B84B'; ctx.beginPath(); ctx.roundRect(-240, -52, 480, 88, 22); ctx.fill();
    txt(ctx, 'EP.4 ครบแปด', 0, 20, 58, '#2A2320'); ctx.restore();
    for (const [i, line] of ['อย่าเป็น', 'คนที่แปด'].entries()) {
      const y = 540 + i * 150;
      ctx.save(); ctx.font = '700 124px Kanit'; const w = ctx.measureText(line).width; ctx.restore();
      ctx.fillStyle = '#C81E1E'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 36, y - 116, w + 72, 148, 20); ctx.fill();
      txt(ctx, line, W / 2, y, 124, '#FFFFFF');
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
