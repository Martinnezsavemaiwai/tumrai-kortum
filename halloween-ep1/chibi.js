// CHIBI RIG — the eight party guests + the white sheet, built from G.* shapes so they boil
// and hatch with the paper style. Origin = feet. Everything is a pure function of its options.
(function () {
  const G = globalThis.G;
  const SKIN = '#F0D2BC', INK = '#17121C';

  const sh = (ctx, pts, fill, seed, o = {}) =>
    G.shape(ctx, pts, { fill, seed, lw: o.lw || 5, alpha: o.alpha == null ? 1 : o.alpha, hatch: o.hatch === false ? null : { color: o.hatchColor || 'rgba(0,0,0,0.18)', gap: 8, angle: o.angle || 0.8 } });
  const ell = (ctx, cx, cy, rx, ry, fill, seed, o) => sh(ctx, G.ellPts(cx, cy, rx, ry), fill, seed, o);
  const rr = (ctx, x, y, w, h, r, fill, seed, o) => sh(ctx, G.rrPts(x, y, w, h, r), fill, seed, o);
  const poly = (ctx, pts, fill, seed, o) => sh(ctx, G.polyPts(pts, 14), fill, seed, o);

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  // round cap of hair with a wavy fringe line (dy = where the fringe ends, relative to head centre)
  function hairCap(ctx, x, hy, s, color, seed, fringe = -40) {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const a = Math.PI * (1 + i / 20); pts.push([x + Math.cos(a) * 136 * s, hy - 6 * s + Math.sin(a) * 130 * s]); }
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x + (136 - 272 * u) * s, hy + fringe * s + Math.sin(u * Math.PI * 3) * 14 * s]); }
    sh(ctx, pts, color, seed);
  }

  // eyes: 'normal' | 'wide' | 'worried' | 'closed' | 'happy' | 'glow'; look -1..1 (left/right), lookY -1..1
  function face(ctx, x, hy, s, o, seed) {
    const ey = hy + 22 * s, lx = (o.look || 0) * 10 * s, ly = (o.lookY || 0) * 8 * s;
    const blink = o.blink ? Math.max(0.12, 1 - o.blink) : 1;
    const wide = o.eyes === 'wide' ? 1.35 : 1;
    for (const ex of [-44, 44]) {
      const cx = x + ex * s + lx, cy = ey + 6 * s + ly;
      if (o.eyes === 'closed' || o.eyes === 'happy') {
        G.line(ctx, [[cx - 16 * s, cy + (o.eyes === 'happy' ? 4 : 0) * s], [cx, cy + (o.eyes === 'happy' ? -8 : 6) * s], [cx + 16 * s, cy + (o.eyes === 'happy' ? 4 : 0) * s]], { color: INK, lw: 5 * s, seed: seed + ex });
      } else if (o.eyes === 'glow') {
        glow(ctx, cx, cy, 40 * s, '255,90,60', 0.7);
        ctx.fillStyle = '#FFD9A0'; ctx.beginPath(); ctx.ellipse(cx, cy, 10 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.ellipse(cx, cy, 15 * s * wide, 19 * s * wide * blink, 0, 0, Math.PI * 2); ctx.fill();
        if (blink > 0.5) { ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(cx - 5 * s, cy - 6 * s, 5 * s * wide, 0, Math.PI * 2); ctx.fill(); }
      }
      if (o.eyes === 'worried' || o.eyes === 'wide') {
        const tilt = (ex < 0 ? 1 : -1) * (o.eyes === 'worried' ? 7 : -3) * s;
        G.line(ctx, [[cx - 20 * s, ey - 30 * s - tilt], [cx + 18 * s, ey - 30 * s + tilt]], { color: '#2A1E26', lw: 5 * s, seed: seed + 9 + ex });
      }
    }
    if (o.eyes !== 'glow') {
      ctx.fillStyle = 'rgba(232,113,141,0.35)';
      for (const ex of [-74, 74]) { ctx.beginPath(); ctx.ellipse(x + ex * s, ey + 40 * s, 20 * s, 11 * s, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    const my = ey + 56 * s, m = o.mouth || 'flat';
    if (m === 'o') ell(ctx, x, my + 4 * s, 11 * s, 14 * s, '#5A2E34', seed + 50, { hatch: false, lw: 3 });
    else if (m === 'smile') G.line(ctx, [[x - 18 * s, my - 4 * s], [x, my + 8 * s], [x + 18 * s, my - 4 * s]], { color: '#5A2E34', lw: 4 * s, seed: seed + 51 });
    else if (m === 'frown') G.line(ctx, [[x - 14 * s, my + 6 * s], [x, my - 2 * s], [x + 14 * s, my + 6 * s]], { color: '#5A2E34', lw: 4 * s, seed: seed + 52 });
    else if (m !== 'none') G.line(ctx, [[x - 12 * s, my], [x + 12 * s, my]], { color: '#5A2E34', lw: 4 * s, seed: seed + 53 });
  }

  // arm: shoulder (sx, sy) to a hand; ang in radians from hanging down (+ = forward/up), sleeve colour
  function arm(ctx, sx, sy, ang, s, color, seed, len = 105, lw = 34, skin = SKIN) {
    const hx = sx + Math.sin(ang) * len * s, hy = sy + Math.cos(ang) * len * s;
    G.limb(ctx, [[sx, sy], [(sx + hx) / 2, (sy + hy) / 2], [hx, hy]], { color, lw: lw * s });
    ell(ctx, hx, hy, 19 * s * lw / 34, 18 * s * lw / 34, skin, seed, { hatch: false, lw: 4 });
    return [hx, hy];
  }

  // costume table: everything that differs between guests
  const COSTUME = {
    you: { body: '#24212B', sleeve: '#24212B', legs: '#24212B', hood: '#24212B', mask: true },
    phrai: { body: '#EDEAF2', sleeve: '#EDEAF2', legs: SKIN, hair: '#1E1A26', longHair: true, wet: true },
    nak: { body: '#2F6B4F', top: '#C9A04A', sleeve: SKIN, legs: SKIN, hair: '#1E1A26', longHair: true, sash: '#C9A04A' },
    pob: { cloak: '#2B2530', hoodShadow: true },
    krasue: { body: '#2A2230', sleeve: '#2A2230', legs: '#2A2230', hair: '#2B2026', organs: true, messy: true },
    krahang: { body: SKIN, sleeve: SKIN, legs: SKIN, loin: '#8A5A3A', hair: '#2B2026', topknot: true, wings: true },
    // Nang Tani: green Thai dress wrapped in broad banana leaves, green sash, hair bun + flower
    tani: { body: '#3F7F3A', leaf: true, sash: '#8DCB6A', sleeve: SKIN, legs: SKIN, hair: '#1E1A26', bun: true, flower: '#F4C2D2' },
    // Pret: very tall — a long ragged robe hides the stilts; long neck, grey skin, long thin arms, tiny mouth
    pret: { body: '#7C7468', sleeve: '#7C7468', hair: '#D6D0C2', skin: '#CFC6B8', longNeck: true, stilts: true, robe: true, longArms: true, tinyMouth: true },
  };

  // Ch.chibi(ctx, { x, y, s, who, eyes, look, lookY, blink, mouth, armL, armR, phone, bob, rot, sx, sy, shadow })
  function chibi(ctx, o) {
    const c = COSTUME[o.who] || COSTUME.phrai;
    const x = 0, s = 1;
    const seed = (o.seed || 1) * 100;
    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, 120 * (o.s || 1), 18 * (o.s || 1), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.scale((o.s || 1) * (o.sx || 1), (o.s || 1) * (o.sy || 1));
    if (o.rot) ctx.rotate(o.rot);
    const stilt = c.stilts ? 170 : 0, neck = c.longNeck ? 60 : 0;
    const skin = c.skin || SKIN;
    const bob = o.bob || 0;
    const y = -stilt;
    const hy = y - 360 * s - neck + bob;

    // --- back layer ---
    if (c.cloak) {
      poly(ctx, [[x - 70, hy - 150], [x + 70, hy - 150], [x + 150, -10], [x + 120, 0], [x - 120, 0], [x - 150, -10]], c.cloak, seed + 1);
    }
    if (c.wings) {
      for (const d of [-1, 1]) {
        const wx = x + d * 175, wy = y - 250 + bob + Math.sin((o.flap || 0) + d) * 6;
        ell(ctx, wx, wy, 120, 112, '#C9A56A', seed + 2 + d, { hatchColor: 'rgba(110,70,20,0.35)', angle: 0.3 });
        for (let r = 30; r < 110; r += 26) G.line(ctx, G.ellPts(wx, wy, r, r * 0.93), { color: 'rgba(110,70,20,0.45)', lw: 3, seed: seed + r + d });
      }
    }
    if (c.longHair) poly(ctx, [[x - 140, hy - 20], [x - 150, y - 120], [x - 60, y - 100], [x + 60, y - 100], [x + 150, y - 120], [x + 140, hy - 20]], c.hair, seed + 3);
    if (c.hood) ell(ctx, x, hy - 4, 150, 144, c.hood, seed + 4);

    // --- legs / stilts ---
    if (c.stilts && !c.robe) {
      for (const d of [-1, 1]) { rr(ctx, x + d * 36 - 9, y - 10, 18, stilt + 10, 6, '#6B4A2E', seed + 5 + d, { hatch: false }); }
    }
    if (c.robe) {
      // only the stilt tips peek out under the hem
      for (const d of [-1, 1]) rr(ctx, x + d * 34 - 10, -34, 20, 34, 6, '#5A3E28', seed + 5 + d, { hatch: false });
    } else if (!c.cloak) {
      // walk: legs lift in turn (o.walk = cycle phase in radians)
      const lift = (d) => (o.walk == null ? 0 : Math.max(0, Math.sin(o.walk + (d > 0 ? Math.PI : 0))) * 22);
      rr(ctx, x - 46, y - 70 - lift(-1), 34, 70, 14, c.legs, seed + 6);
      rr(ctx, x + 12, y - 70 - lift(1), 34, 70, 14, c.legs, seed + 7);
    }

    // --- body ---
    const by = y - 230 + bob;
    if (!c.cloak) {
      if (c.robe) {
        // long ragged robe from the shoulders to the floor
        const hem = [];
        for (let i = 0; i <= 8; i++) { const u = i / 8; hem.push([x + (92 - 184 * u), -30 + (i % 2) * 22]); }
        poly(ctx, [[x - 58, by], [x + 58, by], [x + 92, -30], ...hem.slice(1, -1), [x - 92, -30]], c.body, seed + 10);
        for (const d of [-1, 1]) G.line(ctx, [[x + d * 22, by + 40], [x + d * 40, -60]], { color: 'rgba(0,0,0,0.25)', lw: 4, seed: seed + 14 + d });
      } else if (c.leaf) {
        // dress, then broad banana leaves layered round the skirt (back row first)
        poly(ctx, [[x - 60, by], [x + 60, by], [x + 100, y - 52], [x - 100, y - 52]], c.body, seed + 10);
        const leaves = [[-70, 0.35], [70, -0.35], [-30, 0.15], [30, -0.15], [0, 0]];
        leaves.forEach(([lx, a], i) => {
          const tx = x + lx * 1.5, top = by + 70, bot = y - 30;
          const c0 = i < 2 ? '#5FA84B' : i < 4 ? '#6DBA56' : '#7CC866';
          const pts = [[x + lx * 0.4, top], [tx - 48, (top + bot) / 2], [tx - 10, bot], [tx, bot + 10], [tx + 10, bot], [tx + 48, (top + bot) / 2]];
          poly(ctx, pts, c0, seed + 15 + i, { angle: a + 0.6, hatchColor: 'rgba(20,60,20,0.25)' });
          G.line(ctx, [[x + lx * 0.4, top + 6], [tx, bot]], { color: '#2E5E2A', lw: 4, seed: seed + 21 + i });
        });
      } else if (c.loin) {
        rr(ctx, x - 62, by, 124, 150, 40, c.body, seed + 10);
        poly(ctx, [[x - 66, y - 110], [x + 66, y - 110], [x + 30, y - 40], [x - 30, y - 40]], c.loin, seed + 11);
      } else {
        poly(ctx, [[x - 62, by], [x + 62, by], [x + 108, y - 52], [x - 108, y - 52]], c.body, seed + 10);
      }
      if (c.top) rr(ctx, x - 64, by, 128, 70, 20, c.top, seed + 12);
      if (c.sash) G.limb(ctx, [[x - 60, by + 4], [x, by + 40], [x + 70, by + 110]], { color: c.sash, lw: 26 });
    }

    // --- arms ---
    const aL = o.armL == null ? 0.25 : o.armL, aR = o.armR == null ? 0.25 : o.armR;
    if (!c.cloak && o.phone) {
      // both hands on the phone's side edges
      for (const d of [-1, 1]) {
        const hx = x + d * 64, hyy = y - 142 + bob;
        G.limb(ctx, [[x + d * 70, by + 22], [x + d * 92, (by + hyy) / 2], [hx, hyy]], { color: c.sleeve, lw: 34 });
      }
    } else if (!c.cloak) {
      const len = c.longArms ? 175 : 105, lw = c.longArms ? 24 : 34;
      arm(ctx, x - 64, by + 22, -aL * (c.longArms ? 0.5 : 1), s, c.sleeve, seed + 20, len, lw, skin);
      arm(ctx, x + 64, by + 22, aR * (c.longArms ? 0.5 : 1), s, c.sleeve, seed + 21, len, lw, skin);
    } else {
      // pale hands peeking from the cloak
      ell(ctx, x - 70, y - 150 + bob, 16, 14, '#D9D0C8', seed + 22, { hatch: false });
      ell(ctx, x + 70, y - 150 + bob, 16, 14, '#D9D0C8', seed + 23, { hatch: false });
    }
    if (o.phone) {
      rr(ctx, x - 52, y - 175 + bob, 104, 66, 12, '#22262E', seed + 24, { hatch: false });
      ctx.fillStyle = '#BFD9F5'; ctx.fillRect(x - 44, y - 168 + bob, 88, 52);
      for (const d of [-1, 1]) ell(ctx, x + d * 62, y - 142 + bob, 19, 18, SKIN, seed + 26 + d, { hatch: false, lw: 4 });
    }
    if (c.organs) {
      const ox = x, oy = by + 40;
      glow(ctx, ox, oy + 30, 140, '255,60,40', 0.45 + 0.15 * Math.sin((o.t || 0) * 6));
      ell(ctx, ox, oy + 10, 34, 30, '#C8302E', seed + 25, { hatch: false });
      G.limb(ctx, [[ox - 10, oy + 30], [ox - 30, oy + 70], [ox - 6, oy + 110]], { color: '#D9534F', lw: 18 });
      G.limb(ctx, [[ox + 10, oy + 30], [ox + 34, oy + 80], [ox + 12, oy + 120]], { color: '#E07A5F', lw: 14 });
    }

    // --- neck + head ---
    if (neck) rr(ctx, x - 24, hy + 80, 48, neck + 60, 22, skin, seed + 30);
    if (c.cloak) {
      ell(ctx, x, hy, 150, 144, c.cloak, seed + 31);
      ell(ctx, x, hy + 20, 104, 96, '#0B080E', seed + 32, { hatch: false });
      face(ctx, x, hy, s, { ...o, eyes: o.eyes === 'closed' ? 'closed' : 'glow', mouth: 'none' }, seed);
      ctx.restore();
      return;
    }
    ell(ctx, x, hy, 128, 120, skin, seed + 33);
    if (c.robe) for (const d of [-1, 1]) G.line(ctx, [[x + d * 60, hy + 70], [x + d * 70, hy + 40]], { color: 'rgba(60,50,40,0.35)', lw: 4, seed: seed + 47 + d }); // hollow cheeks
    if (c.hair) {
      if (c.topknot) { ell(ctx, x, hy - 128, 30, 26, c.hair, seed + 34); }
      if (c.bun) ell(ctx, x, hy - 120, 52, 44, c.hair, seed + 35);
      hairCap(ctx, x, hy, s, c.hair, seed + 37, c.messy ? -20 : -40);
      if (c.flower) { // a frangipani tucked by the bun
        for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; ell(ctx, x + 70 + Math.cos(a) * 18, hy - 112 + Math.sin(a) * 18, 15, 11, c.flower, seed + 36 + p, { hatch: false, lw: 3 }); }
        ell(ctx, x + 70, hy - 112, 9, 9, '#F2C84B', seed + 42, { hatch: false, lw: 2 });
      }
      if (c.longHair) {
        poly(ctx, [[x - 134, hy - 20], [x - 104, hy - 10], [x - 96, hy + 150], [x - 140, hy + 170]], c.hair, seed + 38);
        poly(ctx, [[x + 134, hy - 20], [x + 104, hy - 10], [x + 96, hy + 150], [x + 140, hy + 170]], c.hair, seed + 39);
      }
      if (c.messy) for (let i = 0; i < 5; i++) G.line(ctx, [[x - 120 + i * 60, hy - 60], [x - 130 + i * 62, hy + 40 + (i % 2) * 30]], { color: c.hair, lw: 12, seed: seed + 40 + i });
    }
    if (o.back) {
      // seen from behind: the back of the head is all hair
      ell(ctx, x, hy - 4, 136, 128, c.hair || '#1E1A26', seed + 48);
    } else if (c.mask) {
      // Phi Ta Bo mask: white wood, two big round empty eyes, a short snout
      ell(ctx, x, hy + 6, 112, 118, '#EDE6D6', seed + 41, { hatchColor: 'rgba(120,100,70,0.25)' });
      for (const ex of [-40, 40]) ell(ctx, x + ex, hy - 6, 28, 32, '#0C0A10', seed + 42 + ex, { hatch: false, lw: 3 });
      ell(ctx, x, hy + 62, 40, 28, '#E2D9C6', seed + 43);
      for (const ex of [-12, 12]) ell(ctx, x + ex, hy + 62, 6, 9, '#3A2E2A', seed + 44 + ex, { hatch: false, lw: 2 });
      // hood rim in front
      G.line(ctx, G.ellPts(x, hy - 4, 140, 136).slice(0, 999), { color: '#0E0C12', lw: 10, seed: seed + 46 });
    } else {
      face(ctx, x, hy, s, { ...o, mouth: c.tinyMouth && !o.mouth ? 'o' : o.mouth }, seed);
    }
    ctx.restore();
  }

  // the white sheet: dome + wavy hem, two eye holes, floats (hem never touches the floor)
  function sheet(ctx, o) {
    const s = o.s || 1, t = o.t || 0, x = o.x;
    const lift = 12 + Math.sin(t * 1.4) * 6;
    if (o.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.3 * (o.alpha == null ? 1 : o.alpha); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, o.y, 90 * s, 15 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    const yb = o.y - lift * s, top = yb - 330 * s;
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; pts.push([x + Math.cos(a) * 95 * s, top + 110 * s + Math.sin(a) * 110 * s]); }
    pts.push([x + 118 * s, yb - 20 * s]);
    for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([x + (118 - 236 * u) * s, yb + Math.sin(u * Math.PI * 4 + t * 2) * 10 * s]); }
    pts.push([x - 118 * s, yb - 20 * s]);
    sh(ctx, pts, '#ECE8EF', 60, { alpha: o.alpha == null ? 1 : o.alpha, hatchColor: 'rgba(80,60,110,0.18)', angle: 0.4 });
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.fillStyle = '#141018';
    for (const ex of [-30, 30]) { ctx.beginPath(); ctx.ellipse(x + ex * s + (o.look || 0) * 6 * s, top + 120 * s, 13 * s, 21 * s, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  globalThis.K = { chibi, sheet, glow, ell, rr, poly, COSTUME, SKIN, INK };
})();
