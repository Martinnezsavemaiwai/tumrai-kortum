// EXPLAINER KIT — props for "สรุปหนังสือ / ข้อคิด" motion-graphic shorts: a book badge, stopwatches, split screen,
// number badges, a growing bar chart, a top-down crowd, POV hands. Load after kit/rig.js:
//   <script src="kit/explainer.js"></script>
// All shapes go through G.* (drawing styles apply; `flat` is the usual look). Pure functions of their options.
(function () {
  const G = globalThis.G, U = globalThis.U, H = U.hash, { clamp, ease } = U;
  const INK = '#1A1A2E';
  const font = (size, w = 700) => `${w} ${size}px Kanit`;
  const fit = (ctx, s, max, size, w) => { let z = size; ctx.font = font(z, w); while (ctx.measureText(s).width > max && z > 12) ctx.font = font(--z, w); return z; };

  // the "สรุปหนังสือ" card that stays in a corner: cover thumbnail + label + title + author. Credit the author.
  function bookBadge(ctx, x, y, { title, author = '', label = 'สรุปหนังสือ', cover = '#3A6EA5', w = 420, a = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(18,18,36,0.85)'; ctx.beginPath(); ctx.roundRect(x, y, w, 120, 18); ctx.fill();
    G.rrect(ctx, x + 14, y + 12, 70, 96, 6, { fill: cover, seed: 7, lw: 3 });
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 24, y + 30, 50, 6); ctx.fillRect(x + 24, y + 44, 36, 6);
    ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.roundRect(x + 100, y + 14, 150, 30, 8); ctx.fill();
    ctx.fillStyle = INK; ctx.font = font(22); ctx.textBaseline = 'middle'; ctx.fillText(label, x + 112, y + 30);
    ctx.fillStyle = '#FFFFFF'; fit(ctx, title, w - 116, 32); ctx.fillText(title, x + 100, y + 66);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; fit(ctx, author, w - 116, 22, 500); ctx.fillText(author, x + 100, y + 98);
    ctx.restore();
  }

  // a stopwatch: ring that fills to `p` (0..1), digits in the middle, a small label above
  function stopwatch(ctx, x, y, r, { text = '00.00', p = 1, color = '#3FA89B', label = '', labelColor = '#FFFFFF', seed = 1 } = {}) {
    G.rrect(ctx, x - r * 0.18, y - r * 1.28, r * 0.36, r * 0.24, 6, { fill: '#5A5A6A', seed: seed + 1, lw: 3 });
    G.ellipse(ctx, x, y, r * 1.08, r * 1.08, { fill: '#2A2A3A', seed, lw: 4 });
    G.ellipse(ctx, x, y, r * 0.86, r * 0.86, { fill: '#F6F0E2', seed: seed + 2, lw: 3 });
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r * 0.97, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p)); ctx.stroke();
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ctx.fillStyle = '#9A94A4'; ctx.fillRect(x + Math.cos(a) * r * 0.72 - 3, y + Math.sin(a) * r * 0.72 - 3, 6, 6); }
    ctx.fillStyle = color; ctx.font = font(r * 0.42); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + r * 0.04);
    if (label) { ctx.fillStyle = labelColor; ctx.font = font(r * 0.24); ctx.fillText(label, x, y - r * 1.5); }
    ctx.restore();
  }

  // split screen: left / right halves drawn by your functions (full-frame coords, clipped), a divider that slides in.
  // p 0..1 = how far the right half has slid in from the right edge.
  function split(ctx, W, H, p, drawL, drawR, { divider = '#FFFFFF' } = {}) {
    const x = W / 2 + (1 - ease.outCubic(clamp(p))) * W / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, x, H); ctx.clip(); drawL(ctx); ctx.restore();
    if (p > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x, 0, W - x, H); ctx.clip(); ctx.translate(x - W / 2, 0); drawR(ctx); ctx.restore(); }
    ctx.fillStyle = divider; ctx.fillRect(x - 4, 0, 8, H);
  }

  // a numbered circle that pops in at t0
  function badge(ctx, x, y, n, t, t0, { color = '#E8505A', r = 44 } = {}) {
    const s = ease.outBack(clamp((t - t0) / 0.3), 2.4);
    if (s <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    G.ellipse(ctx, 0, 0, r, r, { fill: color, seed: 11 + n, lw: 5, stroke: '#FFFFFF' });
    ctx.fillStyle = '#FFFFFF'; ctx.font = font(r * 1.1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 0, r * 0.06);
    ctx.restore();
  }

  // bars that grow in turn from t0 (values 0..1), labels under them, the last bar can be highlighted
  function chart(ctx, x, y, w, h, values, t, t0, { color = '#7FB3D5', hi = '#F2B33C', labels = [], highlightLast = true } = {}) {
    const n = values.length, bw = w / n * 0.62;
    G.line(ctx, [[x, y], [x + w, y]], { color: INK, lw: 5, seed: 21 });
    values.forEach((v, i) => {
      const u = ease.outCubic(clamp((t - t0 - i * 0.25) / 0.5)), bh = h * v * u, bx = x + (i + 0.5) * (w / n) - bw / 2;
      if (bh > 2) G.rrect(ctx, bx, y - bh, bw, bh, 10, { fill: highlightLast && i === n - 1 ? hi : color, seed: 22 + i, lw: 4 });
      if (labels[i]) { ctx.fillStyle = INK; ctx.font = font(34, 500); ctx.textAlign = 'center'; ctx.fillText(labels[i], bx + bw / 2, y + 46); }
    });
  }

  // a crowd seen from above: little heads with shoulders, nudging about. box = x, y, w, h
  function crowd(ctx, x, y, w, h, n, t, { seed = 1, colors = ['#E8505A', '#3A6EA5', '#F2B33C', '#3FA89B', '#8A5AB0', '#F4F1EA'], r = 12 } = {}) {
    for (let i = 0; i < n; i++) {
      const px = x + H(seed, i) * w + Math.sin(t * 2 + i) * 2, py = y + H(seed, i, 1) * h + Math.cos(t * 1.7 + i) * 2;
      ctx.fillStyle = colors[i % colors.length]; ctx.beginPath(); ctx.ellipse(px, py + r * 0.5, r * 1.3, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2A1E1A'; ctx.beginPath(); ctx.arc(px, py, r * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }

  // first-person hands coming up from the bottom edge, holding something between them at (cx, cy)
  function povHands(ctx, W, H, cx, cy, { skin = '#F2D3B8', sleeve = '#F2B33C', kind = 'fist', spread = 170, lift = 0 } = {}) {
    for (const d of [-1, 1]) {
      const wx = cx + d * spread, wy = cy + 40 - lift, ex = cx + d * (spread + 140), ey = H + 60;
      G.limb(ctx, [[ex, ey], [(ex + wx) / 2 + d * 20, (ey + wy) / 2], [wx, wy]], { color: sleeve, lw: 120, seed: 31 + d });
      globalThis.R.hand(ctx, wx, wy - 20, Math.PI + 0.3, d, kind, 120, skin, 'explainer', 40 + d); // fingers pointing up and in
    }
  }

  globalThis.X = { bookBadge, stopwatch, split, badge, chart, crowd, povHands };
})();
