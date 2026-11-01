// DIRECT KIT — shot types, framing and camera moves as data, plus a shot-list linter.
// Browser (global `Direct`, load after kit/rig.js) and node (require: the linter for scripts/shots.mjs and tests).
//
// film.js:  const mali = Direct.subject({ x: 400, y: 1500, s: 0.8, body: 'anime' });   // feet at (x, y), like R.draw
//           { at, draw, cam: Direct.cam('CU', mali, { look: 1, move: 'push' }) }         // a Shots.film camera
// Shot types (by where a 16:9 frame's bottom cuts; a 9:16 frame has the same face size and shows more below):
//   ECU brows-to-mouth · CU chest · MCU mid-chest · MS waist · MLS knees · FS feet · WS figure ≈ ½ frame height ·
//   EWS figure ≈ ⅕ frame height. The eyes always sit on the eye line
//   (⅓ from the top; 0.36 in 9:16, under the platform's top bar) and the subject gets look room on the side it
//   looks to, so faces never land under the subtitle rail (H*0.70) whatever the type.
// Moves: static (default) · push · pull (slow ×1.08 on the eyes) · drift (handheld breathing) · pan (to another
//   subject or framing: `to`) · track (subject is a function of t). Shake stays Shots.shake, combined on a hit.
(function () {
  const node = typeof module !== 'undefined' && module.exports;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const Direct = {};

  Direct.TYPES = ['ECU', 'CU', 'MCU', 'MS', 'MLS', 'FS', 'WS', 'EWS'];
  Direct.MOVES = ['static', 'push', 'pull', 'drift', 'pan', 'track'];

  // where the eye line and floor sit, per frame shape
  // floor: where FS puts the feet; wideFloor: WS/EWS (a small figure must stand clear of the subtitles, the floor runs under them);
  // face: the lowest a chin may go (9:16: above the H*0.75 subtitle rail; 16:9: the upper two thirds, subtitles at H*0.87)
  const lines = (W, H) => (H > W * 1.2 ? { eye: 0.36, floor: 0.86, wideFloor: 0.66, lead: 0.07, face: 0.7 } : { eye: 1 / 3, floor: 0.9, wideFloor: 0.76, lead: 1 / 6, face: 2 / 3 });
  Direct.lines = lines;

  // ---------- a subject: landmarks (stage y, down = +) of a kit/rig.js figure, or your own numbers ----------
  // { x, y (feet), s, body } with the rig loaded, or explicit { x, top, eye, chin, chest, mid, waist, knee, feet, headH }
  Direct.subject = (o, BODY = globalThis.R && globalThis.R.BODY) => {
    if (o.eye != null) return o;
    const B = BODY && BODY[o.body || 'anime'];
    if (!B) throw new Error('Direct.subject needs kit/rig.js (R.BODY) or explicit landmarks { x, top, eye, … }');
    const s = o.s || 1, hipY = -(B.thigh + B.shin) - B.foot * 0.3, sy = hipY - B.torso, neckTop = sy - B.neck;
    const hry = B.head[1], hy = neckTop - hry * 0.92, k = { chibi: 0.12, cartoon: -0.12 }[o.body] ?? 0.2;
    const at = (v) => o.y + v * s;
    return { x: o.x, top: at(hy - hry * 1.12), eye: at(hy + hry * k), chin: at(hy + hry), chest: at(sy + B.torso * 0.3), mid: at(sy + B.torso * 0.5), waist: at(hipY), knee: at(hipY + B.thigh), feet: o.y, headH: hry * 2 * s };
  };

  // ---------- framing: { x, y, zoom } for Shots.cam (which centres stage point (W/2 + x, H/2 + y) at `zoom`) ----------
  // opts: W, H (default G.W/G.H), look −1…1 (look room), zoom (multiplier on the type, e.g. a push), with (a second subject: two-shot)
  Direct.frame = (type, subj, { W = globalThis.G && G.W, H = globalThis.G && G.H, look = 0, zoom: zm = 1, with: b } = {}) => {
    if (!Direct.TYPES.includes(type)) throw new Error(`unknown shot type ${type}; have ${Direct.TYPES.join(' ')}`);
    const L = lines(W, H), a = subj, S = Math.min(W, H);
    const eye = b ? (a.eye + b.eye) / 2 : a.eye, cx = b ? (a.x + b.x) / 2 : a.x;
    const figH = Math.max(a.feet - a.top, b ? b.feet - b.top : 0), low = (k) => Math.max(a[k], b ? b[k] : -Infinity);
    const feetAnchored = type === 'WS' || type === 'EWS';
    // anchorY lands on screen y = anchorAt * H. An ECU centres the face (eyes to chin), not the eyes: a cartoon's eyes sit high on a big face
    const ecuY = (a.eye + a.chin) / 2, ecuAt = H > W * 1.2 ? 0.42 : 0.45;
    const anchorY = feetAnchored ? low('feet') : type === 'ECU' ? ecuY : eye, anchorAt = feetAnchored ? L.wideFloor : type === 'ECU' ? ecuAt : L.eye;
    // each type's own zoom. Close types are sized on the frame's SHORT side, so a CU is the same face size in 9:16
    // and 16:9 (sized on a 9:16 frame's height a CU came out bigger than an ECU); a tall frame just shows more below
    const raw = (ty) => {
      if (ty === 'EWS' || ty === 'WS') return (H * (ty === 'WS' ? 0.5 : 0.2)) / figH;
      // whatever the type, the chin stays above the subtitles (L.face): a cap for faces with a long eye-to-chin
      const chinCap = ty === 'ECU' ? ((L.face - ecuAt) * H) / (low('chin') - ecuY) :((L.face - L.eye) * H) / (low('chin') - eye);
      if (ty === 'FS') return Math.min(chinCap, (H * (L.floor - L.eye)) / (low('feet') - eye));
      if (ty === 'ECU') return Math.min(chinCap, (S * 0.4) / (a.chin - a.eye)); // eyes to chin = 40 % of the short side, on every face shape
      const cut = { CU: 'chest', MCU: 'mid', MS: 'waist', MLS: 'knee' }[ty], head = { CU: 0.62, MCU: 0.45 }[ty] || Infinity; // big heads (chibi) must fit
      return Math.min(chinCap, (S * (2 / 3)) / (low(cut) - eye), (S * head) / a.headH, (L.eye * H) / (eye - Math.min(a.top, b ? b.top : Infinity))); // …and the top of the head stays in frame
    };
    // every step out is at least 15 % wider than the one before (chibi proportions squeeze CU/MCU/MS together)
    let zoom = Infinity;
    for (const ty of Direct.TYPES.slice(0, Direct.TYPES.indexOf(type) + 1)) zoom = Math.min(raw(ty), zoom * 0.85);
    if (b) zoom = Math.min(zoom, (W * 0.62) / Math.max(1, Math.abs(a.x - b.x))); // both faces inside the middle 62 %
    zoom *= zm;
    const sx = W / 2 - (b ? 0 : look) * L.lead * W; // look room: the subject sits opposite the way it looks
    const x = cx - W / 2 - (sx - W / 2) / zoom, y = anchorY - H / 2 - (anchorAt * H - H / 2) / zoom;
    const toScreen = (px, py) => [(px - (W / 2 + x)) * zoom + W / 2, (py - (H / 2 + y)) * zoom + H / 2];
    return { x, y, zoom, type, eyeScreen: toScreen(cx, eye), chinScreen: toScreen(cx, b ? Math.max(a.chin, b.chin) : a.chin), toScreen };
  };

  // ---------- camera: a Shots.film `cam` function ----------
  // move: static | push | pull (amount 0.08) | drift (amp px) | pan (to: subject or { type, subject, look }) | track (subject = (t) => subject)
  Direct.cam = (type, subj, o = {}) => {
    const { move = 'static', amount = 0.08, amp = 5, to, look = 0, ease = inOut } = o;
    if (!Direct.MOVES.includes(move)) throw new Error(`unknown move ${move}; have ${Direct.MOVES.join(' ')}`);
    const at = (sb, t, extra) => Direct.frame(type, typeof sb === 'function' ? sb(t) : sb, { ...o, ...extra });
    return (s) => {
      const e = ease(clamp(s.u));
      if (move === 'push' || move === 'pull') return at(subj, s.t, { zoom: move === 'push' ? 1 + amount * e : 1 + amount * (1 - e) });
      if (move === 'pan') {
        const A = at(subj, s.t), B = to.type ? Direct.frame(to.type, to.subject, { ...o, look: to.look ?? look }) : at(to, s.t);
        return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), zoom: lerp(A.zoom, B.zoom, e) };
      }
      const f = at(subj, s.t);
      if (move === 'drift') { const n = (k, sd) => (globalThis.U ? globalThis.U.noise1(s.t * k, sd) : Math.sin(s.t * k * 3 + sd)); return { x: f.x + n(0.7, 3) * amp / f.zoom, y: f.y + n(0.6, 5) * amp / f.zoom, zoom: f.zoom, rot: n(0.5, 7) * 0.003 }; }
      return f; // static, track (the subject function moves it)
    };
  };

  // ---------- genre directing: starting points, change them on purpose ----------
  // asl: average shot length range (s) · longest: a shot longer than this needs a reason · moving: max share of
  // shots with a camera move · hits: max hard hits (red line / flash / irisIn) after the opening shot (the hook's
  // red rule doesn't count) · gap: max seconds without a cut
  Direct.GENRES = {
    horror: { asl: [3, 6], longest: 8, moving: 0.6, hits: 3, gap: 12, note: 'slow pushes and stillness; hard cuts only on the hits; hold on empty space' },
    comedy: { asl: [1.8, 4], longest: 6, moving: 0.3, hits: 8, gap: 8, note: 'static frames so the acting reads; cut on the reaction; whip/zoom on the punchline' },
    drama: { asl: [4, 8], longest: 12, moving: 0.5, hits: 2, gap: 15, note: 'CU for emotion, hold the reaction, slow pushes into realisations' },
    fantasy: { asl: [3, 6], longest: 9, moving: 0.6, hits: 4, gap: 12, note: 'EWS to sell the world, pans across it; CU for the wonder' },
    adventure: { asl: [2, 5], longest: 7, moving: 0.65, hits: 5, gap: 10, note: 'track the movement, keep screen direction (left → right = forward)' },
    slice: { asl: [3, 7], longest: 10, moving: 0.3, hits: 2, gap: 14, note: 'quiet static frames, MS/MLS, drift at most' },
    explainer: { asl: [3, 6], longest: 8, moving: 0.5, hits: 4, gap: 10, note: 'one idea per shot; push to the key word; cut on each new point' },
  };

  // ---------- lint a shot list ----------
  // shots: [{ i, t, end, th (VO text), red, shot, on, look, move, in, scene }] (score.js SHOTS; extra fields optional)
  // opts: { genre, voDur: (shot) => seconds | null, voLag, scenes: { <scene>: { sides: { <who>: 'L' | 'R' } } } }
  Direct.lint = (shots, { genre, voDur = () => null, voLag = 0.3, scenes = {} } = {}) => {
    const errors = [], warnings = [], G = genre ? Direct.GENRES[genre] : null;
    if (genre && !G) errors.push(`unknown genre ${genre}; have ${Object.keys(Direct.GENRES).join(' ')}`);
    const n = (s) => `shot ${s.i}`, len = (s) => s.end - s.t;
    shots.forEach((s, k) => {
      if (s.shot && !Direct.TYPES.includes(s.shot)) errors.push(`${n(s)}: unknown shot type ${s.shot}`);
      if (s.move && !Direct.MOVES.includes(s.move)) errors.push(`${n(s)}: unknown move ${s.move}`);
      // dialogue: the line must finish inside its shot, with a breath of air before the cut
      if (s.th) {
        const d = voDur(s), est = d == null, dur = est ? s.th.replace(/\s|["…\n]/g, '').length / 11 + 0.4 : d; // measured: ElevenLabs v3 Thai ≈ 11.5 characters/s (39 lines, EP2A + EP3); whispers run slower
        const room = len(s) - voLag - dur;
        if (room < 0) (est ? warnings : errors).push(`${n(s)}: the line takes ${dur.toFixed(1)} s${est ? ' (estimated)' : ''} but the shot gives it ${(len(s) - voLag).toFixed(1)} s — it runs over the cut`);
        else if (room < 0.25 && !est) warnings.push(`${n(s)}: only ${room.toFixed(2)} s of air after the line before the cut`);
      }
      if (s.move && s.move !== 'static' && len(s) < 1.5) warnings.push(`${n(s)}: a ${s.move} on a ${len(s).toFixed(1)} s shot reads as a wobble — keep it static`);
      const p = shots[k - 1];
      if (p && s.shot && p.shot === s.shot && s.on && p.on === s.on && (!s.in || s.in === 'cut') && s.scene === p.scene) warnings.push(`${n(s)}: same subject, same ${s.shot} as shot ${p.i} — a jump cut (change the size by two steps or the angle)`);
      if (k >= 2 && s.shot && s.shot === p.shot && s.shot === shots[k - 2].shot) warnings.push(`${n(s)}: third ${s.shot} in a row — vary the shot size`);
      // the 180° line: whoever is on the left of the scene looks right, and the other way round
      const side = s.scene && scenes[s.scene] && scenes[s.scene].sides && scenes[s.scene].sides[s.on];
      if (side && s.look && Math.sign(s.look) !== (side === 'L' ? 1 : -1)) errors.push(`${n(s)}: ${s.on} is on the ${side === 'L' ? 'left' : 'right'} of "${s.scene}" but looks ${s.look > 0 ? 'right' : 'left'} — crosses the line (flip look, or show the camera crossing)`);
    });
    // pacing
    const lens = shots.map(len), asl = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
    const moving = shots.filter((s) => s.move && s.move !== 'static').length, typed = shots.filter((s) => s.move).length;
    const hits = shots.slice(1).filter((s) => s.red ||['flash', 'irisIn'].includes(typeof s.in === 'string' ? s.in : s.in && s.in.type)).length;
    if (G) {
      if (asl < G.asl[0] || asl > G.asl[1]) warnings.push(`average shot ${asl.toFixed(1)} s is outside ${genre}'s ${G.asl[0]}–${G.asl[1]} s`);
      for (const s of shots) if (len(s) > G.longest && s.th) warnings.push(`${n(s)}: ${len(s).toFixed(1)} s is long for ${genre} (> ${G.longest} s) — hold on purpose or cut in`);
      for (const s of shots) if (len(s) > G.gap) warnings.push(`${n(s)}: ${len(s).toFixed(1)} s without a cut (${genre}: a change every ≤ ${G.gap} s keeps viewers)`);
      if (typed && moving / typed > G.moving) warnings.push(`${moving}/${typed} shots move the camera (${genre}: ≤ ${Math.round(G.moving * 100)} %) — a move should mean something; make the rest static`);
      if (hits > G.hits) warnings.push(`${hits} hard hits (red line / flash / irisIn); ${genre} wants ≤ ${G.hits} so each one lands`);
    }
    for (let k = 2; k < shots.length; k++) if ([0, 1, 2].every((j) => shots[k - j].move && shots[k - j].move !== 'static')) { warnings.push(`shots ${shots[k - 2].i}–${shots[k].i}: three moving cameras in a row — let one shot sit still`); k += 2; }
    return { errors, warnings, stats: { shots: shots.length, asl, moving, typed, hits } };
  };

  if (node) module.exports = Direct; else globalThis.Direct = Direct;
})();
