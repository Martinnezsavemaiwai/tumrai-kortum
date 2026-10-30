// THE FILM — EP1, 23 shots in one living room (STORYBOARD.md). Every frame is a pure function of t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Shots = globalThis.Shots, K = globalThis.K;
  const { clamp, lerp, ease, pulse } = U;
  const { ev } = S;
  const W = G.W, H = G.H;
  // the cast stands in the middle of the frame so faces stay clear of the subtitle rail (H*0.75) below them
  const FLOOR = Math.round(H * 0.48);
  const at = (n) => S.shotAt(n);

  // ---------------- the set (world coords: the room is wider than the frame; cam.x pans) ----------------
  const ROOM = { x0: -700, x1: 1800 };
  const SOFA = { x: 140, w: 420, y: FLOOR + 40 };
  const CORNER = 1260; // where the white sheet stands
  // where everyone stands in the group shots: back row (small) and front row (bigger)
  const SPOT = {
    tani: [250, FLOOR + 100, 0.58], krahang: [560, FLOOR + 80, 0.56], pret: [860, FLOOR + 100, 0.5],
    nak: [200, FLOOR + 330, 0.74], phrai: [540, FLOOR + 350, 0.78], krasue: [880, FLOOR + 330, 0.74],
    pob: [SOFA.x + 300, SOFA.y - 10, 0.46],
  };
  const ORDER = ['pob', 'tani', 'krahang', 'pret', 'phrai', 'nak', 'krasue']; // back to front

  function glow(ctx, x, y, r, rgb, a) { K.glow(ctx, x, y, r, rgb, a); }

  function clock(ctx, x, y, r, t) {
    // 13s → 21:00 … 41s → 23:59 … 46s → 00:00
    const mins = t < 41 ? lerp(21 * 60, 23 * 60 + 59, clamp((t - 13) / 28)) : lerp(23 * 60 + 59, 24 * 60, clamp((t - 41) / 5));
    K.ell(ctx, x, y, r, r, '#F1E6CF', 201, { lw: 5 });
    const hand = (len, a, lw) => G.line(ctx, [[x, y], [x + Math.sin(a) * len, y - Math.cos(a) * len]], { color: '#2A2320', lw, seed: 202 + lw });
    hand(r * 0.5, ((mins / 60) % 12) / 12 * Math.PI * 2, 7);
    hand(r * 0.8, (mins % 60) / 60 * Math.PI * 2, 4);
  }

  function room(ctx, t) {
    const wall = ctx.createLinearGradient(0, 0, 0, FLOOR);
    wall.addColorStop(0, '#33264A'); wall.addColorStop(1, '#55395C');
    ctx.fillStyle = wall; ctx.fillRect(ROOM.x0, -200, ROOM.x1 - ROOM.x0, FLOOR + 200);
    // window + moon, curtains
    K.rr(ctx, 920, 330, 420, 360, 18, '#1B2348', 210, { hatch: false });
    K.ell(ctx, 1180, 420, 52, 52, '#F3E7C4', 211, { hatch: false });
    G.line(ctx, [[1130, 330], [1130, 690]], { color: '#33264A', lw: 12, seed: 212 });
    K.poly(ctx, [[890, 300], [960, 300], [940, 740], [880, 740]], '#7A2E3C', 213);
    K.poly(ctx, [[1300, 300], [1370, 300], [1380, 740], [1320, 740]], '#7A2E3C', 214);
    clock(ctx, -260, 520, 70, t);
    // string lights across the whole wall
    const pts = []; for (let i = 0; i <= 24; i++) { const x = ROOM.x0 + (i / 24) * (ROOM.x1 - ROOM.x0); pts.push([x, 250 + Math.sin(i * 1.3) * 22]); }
    G.line(ctx, pts, { color: '#1A1424', lw: 4, seed: 215 });
    const on = S.lightOn(t);
    pts.forEach(([x, y], i) => {
      const c = ['#F2B84B', '#E0703E', '#B98CE0'][i % 3];
      glow(ctx, x, y + 16, 80, c === '#B98CE0' ? '185,140,224' : '242,184,75', 0.45 * on * (0.75 + 0.25 * Math.sin(t * 3 + i * 2.1)));
      K.ell(ctx, x, y + 16, 10, 14, c, 220 + i, { hatch: false, lw: 3 });
    });
    // paper bats
    for (const [bx, by, s] of [[-80, 420, 1], [180, 520, 0.7], [700, 470, 0.8], [1500, 520, 0.9]]) {
      const f = Math.sin(t * 4 + bx) * 6 * s;
      K.poly(ctx, [[bx - 60 * s, by + f], [bx - 20 * s, by - 14 * s], [bx, by - 26 * s], [bx + 20 * s, by - 14 * s], [bx + 60 * s, by + f], [bx + 20 * s, by + 8 * s], [bx, by + 18 * s], [bx - 20 * s, by + 8 * s]], '#16101E', 230 + bx, { hatch: false, lw: 3 });
    }
    // floor
    const fl = ctx.createLinearGradient(0, FLOOR, 0, H);
    fl.addColorStop(0, '#6A4636'); fl.addColorStop(1, '#2C1B16');
    ctx.fillStyle = fl; ctx.fillRect(ROOM.x0, FLOOR, ROOM.x1 - ROOM.x0, H);
    for (let i = 1; i < 8; i++) G.line(ctx, [[ROOM.x0, FLOOR + i * i * 12], [ROOM.x1, FLOOR + i * i * 12]], { color: 'rgba(0,0,0,0.25)', lw: 3, seed: 240 + i });
    G.line(ctx, [[ROOM.x0, FLOOR], [ROOM.x1, FLOOR]], { color: G.C.ink, lw: 5, seed: 249 });
    // sofa
    K.rr(ctx, SOFA.x, SOFA.y - 230, SOFA.w, 150, 40, '#4B3A6A', 250);
    K.rr(ctx, SOFA.x - 20, SOFA.y - 110, SOFA.w + 40, 110, 30, '#5B4A7E', 251);
    pumpkin(ctx, -180, FLOOR + 160, 1.1, t, 1);
    pumpkin(ctx, 1090, FLOOR + 90, 0.8, t, 2);
    pumpkin(ctx, 1500, FLOOR + 220, 1.0, t, 3);
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

  // everyone in their spot; `act(who)` returns per-character acting overrides
  function group(ctx, t, act = () => ({}), only = null) {
    for (const who of ORDER) {
      if (only && !only.includes(who)) continue;
      const [x, y, s] = SPOT[who];
      const a = act(who) || {};
      if (a.hide) continue;
      const blinkAt = (t * 0.37 + ORDER.indexOf(who) * 0.29) % 1;
      K.chibi(ctx, { x, y, s, who, t, seed: ORDER.indexOf(who) + 1, blink: blinkAt > 0.97 ? 1 : 0, bob: Math.sin(t * 2 + x) * 3, ...a });
    }
  }

  function sheetAt(ctx, t, o = {}) { K.sheet(ctx, { x: CORNER, y: FLOOR + 170, s: 0.85, t, ...o }); }

  // ---------------- phone UI ----------------
  function phone(ctx, cx, cy, h, t, { bubbles = [], photo = false, zoom = 1 } = {}) {
    const w = h * 0.5;
    K.rr(ctx, cx - w / 2, cy - h / 2, w, h, 46, '#1E2028', 400, { hatch: false });
    const sx = cx - w / 2 + 22, sy = cy - h / 2 + 22, sw = w - 44, sh = h - 44;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 30); ctx.clip();
    ctx.fillStyle = '#F4F1F8'; ctx.fillRect(sx, sy, sw, sh);
    if (photo) {
      groupPhoto(ctx, sx, sy, sw, sh, t, zoom);
    } else {
      ctx.fillStyle = '#5B3E8C'; ctx.fillRect(sx, sy, sw, 150);
      txt(ctx, 'ฮาโลวีนบ้านเบล', sx + sw / 2, sy + 78, 46, '#FFFFFF');
      txt(ctx, 'สมาชิก 7 คน', sx + sw / 2, sy + 124, 32, '#E8DCFF', 500);
      bubbles.forEach((b, i) => {
        const p = ease.outBack(clamp((t - b.t) / 0.25), 2.2);
        if (p <= 0) return;
        const by = sy + 200 + i * 130, bw = Math.min(sw - 80, 40 + b.text.length * 26), bx = b.me ? sx + sw - 30 - bw : sx + 30;
        ctx.save(); ctx.translate(bx + bw / 2, by + 45); ctx.scale(p, p); ctx.translate(-(bx + bw / 2), -(by + 45));
        ctx.fillStyle = b.me ? '#7C5BC2' : '#FFFFFF'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 90, 36); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, b.text, bx + bw / 2, by + 58, 34, b.me ? '#FFFFFF' : '#2A2320', 500);
        ctx.restore();
      });
    }
    ctx.restore();
  }

  function txt(ctx, s, x, y, size, color, weight = 700, stroke = 0) {
    ctx.save(); ctx.font = `${weight} ${size}px Kanit`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = '#000'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }

  // the midnight photo: 8 in a row, the sheet in the middle, flash-lit. (You are not in it.)
  const PHOTO = ['tani', 'nak', 'krasue', 'sheet', 'phrai', 'krahang', 'pob', 'pret'];
  function groupPhoto(ctx, x, y, w, h, t, zoom = 1) {
    ctx.save();
    ctx.fillStyle = '#E9E2F2'; ctx.fillRect(x, y, w, h);
    ctx.translate(x + w / 2, y + h * 0.6); ctx.scale(zoom, zoom); ctx.translate(-(x + w / 2), -(y + h * 0.6));
    ctx.fillStyle = '#6A5A7E'; ctx.fillRect(x - w, y, w * 3, h * 0.55);
    ctx.fillStyle = '#8A6A56'; ctx.fillRect(x - w, y + h * 0.55, w * 3, h);
    PHOTO.forEach((who, i) => {
      const px = x + (w / 8) * (i + 0.5), py = y + h * 0.66 + (i % 2) * 16;
      if (who === 'sheet') K.sheet(ctx, { x: px, y: py, s: 0.3, t: 3, shadow: false });
      else K.chibi(ctx, { x: px, y: py, s: who === 'pret' ? 0.22 : 0.26, who, t: 3, eyes: 'happy', mouth: 'smile', seed: 50 + i, shadow: false });
    });
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, h); ctx.restore();
  }

  // a hoodie arm reaching in from the bottom-right (the viewer's RIGHT hand)
  function rightHand(ctx, hx, hy) {
    G.limb(ctx, [[W + 120, H + 160], [W - 60, hy + 260], [hx, hy]], { color: '#24212B', lw: 120 });
    K.ell(ctx, hx, hy, 58, 54, '#F0D2BC', 410, { lw: 5 });
    for (let k = 0; k < 4; k++) K.ell(ctx, hx - 40 + k * 26, hy - 44, 15, 24, '#F0D2BC', 411 + k, { hatch: false, lw: 4 });
  }

  // tension lighting: multiply a radial gradient; party = warm, after the flash = cold
  function light(ctx, t, { cx = W / 2, cy = H * 0.55, warm = false, dark = 0 } = {}) {
    const g = ctx.createRadialGradient(cx, cy, 60, cx, cy, H * 0.8);
    if (warm) { g.addColorStop(0, '#FFF6EA'); g.addColorStop(0.6, '#D9A8A0'); g.addColorStop(1, '#4A2A3A'); }
    else { g.addColorStop(0, '#DDE2FF'); g.addColorStop(0.5, '#7C72AE'); g.addColorStop(1, '#1C1634'); }
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    const d = dark + (1 - S.lightOn(t)) * 0.75;
    if (d > 0) { ctx.save(); ctx.fillStyle = `rgba(8,6,16,${d})`; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
  }

  const camAt = (x, y, zoom) => ({ x, y, zoom });
  let bgSmall = null; // offscreen buffer for the blurred choice-screen background
  const shakeAt = (t0, amp) => Shots.shake(amp, t0, 4);

  // ---------------- shots ----------------
  const film = Shots.film([
    { at: at(1), draw(ctx, t) { // 1: pumpkins light up in the dark
      ctx.fillStyle = '#07050C'; ctx.fillRect(0, 0, W, H);
      ev.lanterns.forEach((lt, k) => { const lit = ease.outCubic(clamp((t - lt) / 0.35)); if (lit > 0) pumpkin(ctx, 180 + k * 240, H * 0.6 + (k % 2) * 60, 1.0, t, 10 + k, lit); });
    }, cam: Shots.push(1, 1.06) },

    { at: at(2), in: 'fade', draw(ctx, t) { // 2: your phone, the group chat
      ctx.fillStyle = '#120E1C'; ctx.fillRect(0, 0, W, H);
      glow(ctx, W / 2, H * 0.45, 700, '150,170,255', 0.25);
      G.limb(ctx, [[W + 160, H + 200], [W * 0.78, H * 0.78], [W * 0.62, H * 0.66]], { color: '#24212B', lw: 140 });
      phone(ctx, W / 2, H * 0.44, 1120, t, { bubbles: [{ t: ev.chatPing[0], text: 'ปาร์ตี้คืนนี้นะ 🎃' }, { t: ev.chatPing[1], text: 'สามทุ่มตรง!' }, { t: ev.chatPing[2], text: 'ไปแน่นอน', me: true }] });
    }, cam: Shots.push(1, 1.12) },

    { at: at(3), in: 'zoom', draw(ctx, t) { // 3: the one rule
      ctx.fillStyle = '#F4F1F8'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5B3E8C'; ctx.fillRect(0, 0, W, 280);
      txt(ctx, 'ฮาโลวีนบ้านเบล · สมาชิก 7 คน', W / 2, 220, 44, '#FFFFFF', 500);
      const p = ease.outBack(clamp((t - ev.rulePop) / 0.3), 2.5);
      if (p > 0) {
        ctx.save(); ctx.translate(W / 2, H * 0.47); ctx.scale(p, p); ctx.rotate(-0.04);
        ctx.fillStyle = '#E0703E'; ctx.beginPath(); ctx.roundRect(-460, -150, 920, 300, 70); ctx.fill();
        txt(ctx, 'แต่งเป็นผีไทย', 0, -10, 104, '#FFFFFF');
        txt(ctx, 'มาเท่านั้น!!', 0, 100, 104, '#FFFFFF');
        ctx.restore();
      }
    }, cam: Shots.push(1.0, 0.92) },

    { at: at(4), in: { type: 'wipe', dir: 'left' }, draw(ctx, t, s) { // 4: the front door
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0E1230'); sky.addColorStop(1, '#2E2A5C');
      ctx.fillStyle = sky; ctx.fillRect(-W, -H, W * 3, H * 3);
      K.ell(ctx, 220, 300, 60, 60, '#F3E7C4', 500, { hatch: false });
      K.rr(ctx, 120, 360, 840, 1100, 20, '#A8573E', 501); // house wall
      K.poly(ctx, [[60, 400], [540, 120], [1020, 400]], '#5A2E2A', 502);
      const open = ease.inOutCubic(clamp((t - ev.doorOpen) / 0.8));
      ctx.fillStyle = '#FFD9A0'; ctx.fillRect(380, 640, 320, 620); glow(ctx, 540, 950, 420, '255,200,120', 0.5 * open);
      K.rr(ctx, 380, 640, 320 * (1 - 0.85 * open), 620, 10, '#5B3A28', 503); // door swings open
      K.ell(ctx, 400 + 320 * (1 - 0.85 * open) - 40, 960, 12, 12, '#F2B84B', 504, { hatch: false });
      K.ell(ctx, 760, 820, 16, 16, '#E8E0D0', 505, { hatch: false }); // doorbell
      pumpkin(ctx, 260, 1330, 1.1, t, 20); pumpkin(ctx, 830, 1340, 0.9, t, 21);
      const press = ev.doorbell - 0.2 < t && t < ev.doorbell + 0.4;
      K.chibi(ctx, { x: 640, y: 1520, s: 1.0, who: 'nak', t, back: true, armR: press ? 2.3 : 0.3, seed: 60 });
      txt(ctx, '21:00', W - 150, 300, 46, '#FFFFFF', 500, 8);
    }, cam: (s) => ({ zoom: lerp(1, 1.5, ease.inCubic(clamp((s.t - (ev.doorOpen + 0.6)) / 1.6))), y: lerp(0, -60, clamp((s.t - ev.doorOpen) / 2)) }) },

    { at: at(5), in: 'fade', draw(ctx, t) { // 5: guests walk in on their beats
      room(ctx, t);
      group(ctx, t, (who) => {
        if (who === 'phrai') return { armR: 2.2 + 0.3 * Math.sin(t * 8), eyes: 'happy', mouth: 'smile' };
        const k = ['nak', 'pob', 'krasue', 'krahang', 'tani', 'pret'].indexOf(who);
        const t0 = ev.arrivals[k], u = clamp((t - t0) / 1.3);
        if (t < t0) return { hide: true };
        const [x] = SPOT[who];
        if (u < 1) return { x: lerp(-260, x, ease.outQuad(u)), walk: (t - t0) * 12, eyes: 'happy', mouth: 'smile' };
        return { eyes: 'happy', mouth: 'smile' };
      });
      light(ctx, t, { warm: true });
    }, cam: Shots.pan(-120, 0) },

    { at: at(6), draw(ctx, t) { // 6: exactly seven
      room(ctx, t);
      group(ctx, t, (who) => (who === 'phrai' ? { armR: 2.3 + 0.35 * Math.sin(t * 9), eyes: 'happy', mouth: 'smile' } : { eyes: 'happy', mouth: 'smile' }));
      light(ctx, t, { warm: true });
    }, cam: Shots.push(1.12, 1.0) },

    { at: at(7), draw(ctx, t) { // 7: the corner nobody asked about
      room(ctx, t); group(ctx, t, () => ({ eyes: 'happy', mouth: 'smile' })); sheetAt(ctx, t);
      light(ctx, t, { warm: true, cx: W * 0.8 });
    }, cam: (s) => ({ x: lerp(0, CORNER - W / 2, ease.inOutCubic(clamp(s.u * 1.6))), zoom: lerp(1, 1.25, ease.inOutQuad(s.u)) }) },

    { at: at(8), in: { type: 'whip', dir: 'right' }, draw(ctx, t) { // 8: snacks; the sheet turns its head toward you
      room(ctx, t); sheetAt(ctx, t, { look: t > ev.sheetTurn ? 1 : 0 });
      group(ctx, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'happy', mouth: 'smile', bob: Math.sin(t * 7 + SPOT[who][0]) * 6 }));
      K.rr(ctx, 380, H * 0.84, 520, 90, 30, '#8A5A3A', 430); // snack table edge
      K.ell(ctx, 640, H * 0.84, 120, 34, '#E8D9BC', 431);
      const reach = ease.inOutQuad(clamp((t - 36) / 1.2)) - ease.inOutQuad(clamp((t - 39) / 1));
      rightHand(ctx, lerp(W + 40, 700, reach), lerp(H * 0.95, H * 0.82, reach));
      light(ctx, t, { warm: true });
    }, cam: camAt(220, 0, 1.0) },

    { at: at(9), draw(ctx, t) { // 9: the self-timer
      room(ctx, t); group(ctx, t, () => ({ eyes: 'happy', mouth: 'smile' })); sheetAt(ctx, t, { look: -0.5 });
      // tripod + phone in the foreground (bottom), the red timer light blinks with each beep
      G.line(ctx, [[540, H * 0.86], [460, H + 40]], { color: '#1A1A22', lw: 14, seed: 440 }); G.line(ctx, [[540, H * 0.86], [620, H + 40]], { color: '#1A1A22', lw: 14, seed: 441 });
      K.rr(ctx, 420, H * 0.8, 240, 130, 20, '#1E2028', 442, { hatch: false });
      const blink = ev.timerBeeps.some((b) => t >= b && t < b + 0.12);
      K.ell(ctx, 630, H * 0.815, 12, 12, blink ? '#FF3B3B' : '#5A1A1A', 443, { hatch: false });
      if (blink) glow(ctx, 630, H * 0.815, 60, '255,60,60', 0.8);
      txt(ctx, '23:59', W - 150, 300, 46, '#FFFFFF', 500, 8);
      light(ctx, t, { warm: true });
    }, cam: (s) => ({ x: 240, zoom: lerp(1.0, 1.08, s.u) }) },

    { at: at(10), draw(ctx, t) { // 10: FLASH (hard cut on the shutter)
      room(ctx, t); group(ctx, t, () => ({ eyes: 'closed', mouth: 'smile' })); sheetAt(ctx, t);
      const k = Math.exp(-(t - ev.flash) * 2.2);
      ctx.fillStyle = `rgba(255,255,255,${clamp(0.25 + k)})`; ctx.fillRect(-W, -H, W * 3, H * 3);
    }, cam: camAt(240, 0, 1.08) },

    { at: at(11), draw(ctx, t) { // 11: Bell's face, eyes widening (hit)
      room(ctx, t);
      const u = clamp((t - at(11)) / 3);
      K.chibi(ctx, { x: 540, y: H * 0.98, s: 2.1, who: 'phrai', t, phone: true, eyes: u > 0.2 ? 'wide' : 'worried', mouth: u > 0.4 ? 'o' : 'frown', lookY: 1, seed: 70 });
      glow(ctx, 540, H * 0.78, 500, '150,200,255', 0.4);
      light(ctx, t, { cy: H * 0.6 });
    }, cam: Shots.combine(Shots.push(1, 1.15), shakeAt(at(11), 22)) },

    { at: at(12), in: 'zoom', draw(ctx, t, s) { // 12: the photo, zooming toward the sheet
      ctx.fillStyle = '#0E0B16'; ctx.fillRect(0, 0, W, H);
      phone(ctx, W / 2, H * 0.47, 1500, t, { photo: true, zoom: lerp(1, 2.6, ease.inOutQuad(s.u)) });
    } },

    { at: at(13), draw(ctx, t) { // 13: nobody invited them (Ton sits still)
      room(ctx, t);
      group(ctx, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'worried', mouth: 'frown', look: Math.sin(t * 6 + SPOT[who][0]) }));
      light(ctx, t);
    }, cam: Shots.handheld(8) },

    { at: at(14), draw(ctx, t, s) { // 14: no zipper, no seams
      ctx.fillStyle = '#ECE8EF'; ctx.fillRect(0, 0, W, H);
      G.hatch(ctx, [0, 0, W, H], { color: 'rgba(80,60,110,0.16)', gap: 10, angle: 0.4 });
      for (let k = 0; k < 6; k++) G.line(ctx, [[k * 220 - 100, 0], [k * 220 + 60, H]], { color: 'rgba(80,60,110,0.12)', lw: 30, seed: 450 + k });
      ctx.fillStyle = '#141018'; ctx.beginPath(); ctx.ellipse(W * 0.5 - 140, H * 0.28, 70, 110, 0, 0, Math.PI * 2); ctx.ellipse(W * 0.5 + 140, H * 0.28, 70, 110, 0, 0, Math.PI * 2); ctx.fill();
      light(ctx, t, { cy: H * 0.4 });
    }, cam: Shots.push(1, 1.2) },

    { at: at(15), draw(ctx, t) { // 15: and no feet (hit)
      // low angle on the floor: the sheet's hem hangs in the air, a dark empty gap where feet should be
      const fy = H * 0.6;
      ctx.fillStyle = '#140C0C'; ctx.fillRect(0, 0, W, H); // dark void under the hem reads as "nothing there"
      ctx.fillStyle = '#6A4636'; ctx.fillRect(0, fy, W, H);
      for (let i = 1; i < 7; i++) G.line(ctx, [[0, fy + i * i * 16], [W, fy + i * i * 16]], { color: 'rgba(0,0,0,0.3)', lw: 3, seed: 461 + i });
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(W / 2, fy + 60, 420, 50, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      const hem = fy - 160 - Math.sin(t * 1.4) * 14;
      const pts = [[-40, -100], [W + 40, -100], [W + 40, hem]];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([W + 40 - (W + 80) * u, hem + Math.sin(u * Math.PI * 5 + t * 2) * 30]); }
      K.poly(ctx, pts, '#F2EEF6', 460, { hatchColor: 'rgba(80,60,110,0.22)' });
      for (let k = 0; k < 5; k++) G.line(ctx, [[120 + k * 220, -50], [100 + k * 230, hem - 30]], { color: 'rgba(90,70,120,0.35)', lw: 6, seed: 470 + k }); // folds
      light(ctx, t, { cy: H * 0.45 });
    }, cam: Shots.combine(Shots.push(1.05, 1.15), shakeAt(at(15), 18)) },

    { at: at(16), draw(ctx, t, s) { // 16: everyone turns; the corner is empty
      room(ctx, t);
      group(ctx, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'wide', mouth: 'o', look: 1 }));
      for (let k = 0; k < 40; k++) { const dx = U.hash(k, 1) * 300 - 150, dy = ((t * 30 + U.hash(k, 2) * 400) % 400); ctx.fillStyle = 'rgba(240,230,255,0.35)'; ctx.fillRect(CORNER + dx, FLOOR - 300 + dy, 4, 4); }
      light(ctx, t, { cx: W * 0.7 });
    }, cam: (s) => ({ x: lerp(0, CORNER - W / 2, ease.inOutCubic(clamp((s.t - at(16) - 0.8) / 1.2))) }) },

    { at: at(17), draw(ctx, t) { // 17: the lights flicker; shadows on the wall
      room(ctx, t);
      const off = 1 - S.lightOn(t);
      ctx.save(); ctx.globalAlpha = 0.25 + off * 0.5; ctx.fillStyle = '#0A0612';
      for (const who of ORDER) { const [x, y, s] = SPOT[who]; ctx.beginPath(); ctx.ellipse(x + 60, FLOOR - 200 * s, 120 * s, 260 * s, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      group(ctx, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'worried', mouth: 'frown', look: Math.sin(t * 2 + SPOT[who][0]) * 0.6 }));
      light(ctx, t);
    }, cam: Shots.handheld(6) },

    { at: at(18), draw(ctx, t) { // 18: Bell counts 1..7 — the 7th is YOU (she points at the camera)
      room(ctx, t);
      const targets = ['nak', 'tani', 'krahang', 'pret', 'krasue', 'pob', 'you'];
      const k = ev.counts.reduce((n, c) => (t >= c ? n + 1 : n), 0);
      const tgt = targets[Math.max(0, k - 1)];
      group(ctx, t, (who) => {
        if (who === 'phrai') return { armR: tgt === 'you' ? 1.6 : 2.0, armL: 0.3, eyes: 'worried', look: tgt === 'you' ? 0 : (SPOT[tgt] ? clamp((SPOT[tgt][0] - 540) / 300, -1, 1) : 0) };
        return who === 'pob' ? { eyes: 'glow' } : { eyes: 'worried', mouth: 'flat' };
      });
      targets.forEach((who, i) => {
        const p = ease.outBack(clamp((t - ev.counts[i]) / 0.22), 3);
        if (p <= 0) return;
        const [x, y, s] = who === 'you' ? [540, H * 0.95, 1.4] : SPOT[who];
        const yy = who === 'you' ? H * 0.82 : y - 560 * s;
        ctx.save(); ctx.translate(x, yy); ctx.scale(p * (who === 'you' ? 2 : 1), p * (who === 'you' ? 2 : 1));
        K.ell(ctx, 0, 0, 44, 44, who === 'you' ? '#C8302E' : '#F2B84B', 470 + i, { hatch: false, lw: 4 });
        txt(ctx, String(i + 1), 0, 20, 56, '#FFFFFF');
        ctx.restore();
      });
      light(ctx, t);
    }, cam: Shots.push(1, 1.04) },

    { at: at(19), in: 'zoom', draw(ctx, t) { // 19: the chat still says 7
      ctx.fillStyle = '#0E0B16'; ctx.fillRect(0, 0, W, H);
      glow(ctx, W / 2, H * 0.45, 700, '150,170,255', 0.2);
      phone(ctx, W / 2, H * 0.46, 1250, t, { bubbles: [{ t: 0, text: 'ปาร์ตี้คืนนี้นะ 🎃' }, { t: 0, text: 'สามทุ่มตรง!' }] });
    }, cam: Shots.push(1.15, 1.0) },

    { at: at(20), draw(ctx, t) { // 20: everyone turns to look at YOU (hit)
      room(ctx, t);
      const u = clamp((t - at(20)) / 0.5);
      group(ctx, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'wide', mouth: 'flat', look: lerp(0.8, 0, u), lookY: 0 }));
      light(ctx, t, { dark: 0.15 });
    }, cam: Shots.combine(Shots.push(1, 1.3), shakeAt(at(20), 20)) },

    { at: at(21), draw(ctx, t, s) { // 21: Mind steps back
      room(ctx, t);
      group(ctx, t, (who) => {
        if (who === 'nak') return { x: SPOT.nak[0] - 140 * ease.inOutQuad(s.u), s: SPOT.nak[2] * (1 - 0.12 * s.u), walk: s.u < 0.9 ? t * 6 : null, eyes: 'worried', mouth: 'frown', armR: 1.2 };
        return who === 'pob' ? { eyes: 'glow' } : { eyes: 'wide', mouth: 'flat' };
      });
      light(ctx, t, { dark: 0.2 });
    }, cam: (s) => ({ zoom: 1.3, y: 60 }) },

    { at: at(22), in: 'cut', draw(ctx, t, s) { // 22: through the mask's eye holes, your right hand rises
      room(ctx, t);
      group(ctx, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'wide', mouth: 'o' }));
      light(ctx, t, { dark: 0 });
      const up = ease.outCubic(clamp(s.u * 1.4));
      rightHand(ctx, lerp(W + 80, W * 0.8, up), lerp(H * 1.05, H * 0.5, up));
      // the mask: black frame with two round holes
      ctx.save(); ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3);
      ctx.moveTo(W * 0.28 + 235, H * 0.42); ctx.ellipse(W * 0.28, H * 0.42, 235, 320, 0, 0, Math.PI * 2);
      ctx.moveTo(W * 0.74 + 235, H * 0.42); ctx.ellipse(W * 0.74, H * 0.42, 235, 320, 0, 0, Math.PI * 2); // holes must not overlap (even-odd)
      ctx.fill('evenodd'); ctx.restore();
    }, cam: Shots.handheld(10) },

    { at: at(23), in: { type: 'dip', color: '#000' }, draw(ctx, t) { // 23: the choice
      // soft background: draw at 1/8 size and scale up (ctx.filter blur at full size took minutes per frame)
      if (!bgSmall) bgSmall = G.makeCanvas(Math.round(W / 8), Math.round(H / 8));
      const b = bgSmall.getContext('2d');
      b.setTransform(1 / 8, 0, 0, 1 / 8, 0, 0); b.clearRect(0, 0, W, H);
      room(b, t); group(b, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'wide' }));
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(bgSmall, 0, 0, W, H); ctx.restore();
      ctx.fillStyle = 'rgba(6,4,12,0.72)'; ctx.fillRect(-W, -H, W * 3, H * 3);
      const c0 = ev.choice;
      const pop = (d) => ease.outBack(clamp((t - c0 - d) / 0.3), 2);
      ctx.save(); ctx.translate(W / 2, 620); ctx.scale(pop(0), pop(0)); txt(ctx, 'ตอนที่ 2', 0, 0, 150, '#FFFFFF', 700, 16); ctx.restore();
      ctx.save(); ctx.translate(W / 2, 800); ctx.scale(pop(0.6), pop(0.6)); txt(ctx, 'คุณจะถอดหน้ากากไหม?', 0, 0, 80, '#FFD84A', 700, 12); ctx.restore();
      for (const [x, label, col, d] of [[320, 'ถอด', '#3FA84F', 1.2], [760, 'ไม่ถอด', '#C8281E', 1.4]]) {
        const p = pop(d); if (p <= 0) continue;
        ctx.save(); ctx.translate(x, 1060); ctx.scale(p, p);
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-170, -80, 340, 150, 34); ctx.fill();
        txt(ctx, label, 0, 26, 84, '#FFFFFF'); ctx.restore();
      }
      if (t > c0 + 2) txt(ctx, 'คอมเมนต์ว่าคุณเลือกทางไหน', W / 2, 1260, 50, '#FFFFFF', 500, 8);
    } },
  ], { end: S.DURATION });

  // ---------------- overlays: subtitles (rail) + sound tags ----------------
  function subtitles(ctx, t) {
    const sub = S.subtitles.find((x) => t >= x.t && t < x.end);
    if (!sub) return;
    const lines = sub.text.split('\n');
    const size = sub.red ? 96 : 84, lh = size * 1.22;
    const base = H * 0.75; // bottom line sits above TikTok's caption zone
    const a = clamp((t - sub.t) / 0.25);
    const p = sub.red ? ease.outBack(clamp((t - sub.t) / 0.2), 2.4) : 1;
    ctx.save();
    ctx.globalAlpha = sub.red ? 1 : a;
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

  // TikTok cover (1080x1920; the profile grid crops to the centre 3:4, y 240..1680 — keep everything there)
  function cover(ctx) {
    const t = 30;
    ctx.fillStyle = '#33264A'; ctx.fillRect(0, 0, W, H);
    // No spoilers: only what the first 3 seconds show — the party and the opening rule. No sheet, no clue marks.
    ctx.save(); ctx.translate(-10, 380); ctx.scale(0.9, 0.9);
    room(ctx, t);
    group(ctx, t, (who) => (who === 'pob' ? { eyes: 'glow' } : { eyes: 'happy', mouth: 'smile' }));
    ctx.restore();
    light(ctx, t, { warm: true, cy: H * 0.62 });
    const g = ctx.createLinearGradient(0, 240, 0, 980); g.addColorStop(0, 'rgba(8,6,16,0.9)'); g.addColorStop(1, 'rgba(8,6,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 980);
    ctx.save(); ctx.translate(W / 2, 330); ctx.rotate(-0.04);
    ctx.fillStyle = '#F2B84B'; ctx.beginPath(); ctx.roundRect(-300, -52, 600, 88, 22); ctx.fill();
    txt(ctx, 'EP.1 ปาร์ตี้ฮาโลวีน', 0, 20, 58, '#2A2320'); ctx.restore();
    for (const [i, line] of ['อย่านับคน', 'ในรูปหมู่'].entries()) { // the opening rule, in the same red box as the film
      const y = 540 + i * 150;
      ctx.save(); ctx.font = '700 128px Kanit'; const w = ctx.measureText(line).width; ctx.restore();
      ctx.fillStyle = '#C81E1E'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - 36, y - 118, w + 72, 150, 20); ctx.fill();
      txt(ctx, line, W / 2, y, 128, '#FFFFFF');
    }
  }

  Studio.film({
    async init() {
      await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Bold.ttf', 700);
      await Studio.loadFont('Kanit', 'assets/fonts/Kanit-Medium.ttf', 500);
    },
    draw(ctx, t) {
      if (t < 0) return cover(ctx); // `render.js stills -1` = the TikTok cover
      film(ctx, t);
      subtitles(ctx, t);
      soundTags(ctx, t);
    },
    post: { paper: 0.35, vignette: 0.45, grain: 0.07 },
    fadeOut: 1.2,
  });
})();
