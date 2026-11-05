# Genre menu

The channel is not only horror. Pick one genre per episode **before** writing STORY.md, and write the pick at
the top of STORY.md (`**แนว:** ตำนานเมือง · ตัวละคร anime · ฟอนต์ Chakra Petch · ซับ glitch · dials V5 M5 D3 …`). Each row is a
*starting* recipe: change anything, but change it on purpose. Two episodes in a row should not share
body + font + sub style + music.

- Characters: `kit/rig.js` bodies `anime` · `cartoon` · `chibi` · `explainer` (flat vector, soft shading, glasses) · `puppet` (หนังตะลุง).
  See `chibi-rig.md`.
- Drawing style: six families. Set `STYLE` in score.js to a key below, or pass `--style` to try one. Engine keys:
  `flat paper watercolor chalk neon pixel`. `kit/art.js` keys: `ink crayon woodcut manga`.
  - **flat**: clean vector, the safe pick for any genre. The menu groups three outlined looks under it:
    - `paper` has ink outlines that wobble (re-drawn 12×/s, so held frames stay alive), light hatching and a paper-grain/vignette finish. The engine uses it when `STYLE` is unset.
    - `ink` has heavier outlines. Apply `G.grade` for its muted colours.
    - `crayon` has a scribble fill for sketchbook, diary and kids' scenes. The scribble fades at a distance, so use close and medium shots.
  - **watercolor**: soft washes for warm, gentle or dreamy stories.
  - **chalk**: a dark board for lessons and night scenes. Use a dark background.
  - **neon**: a dark glow for sci-fi, nightlife and the city. Use a dark background.
  - **woodcut**: a carved hatch for legends, temples, news and old tales.
  - **manga**: black-and-white screen tones for mystery, puzzles and drama.
  - Use the genre recipe as a starting point. Choose `flat` or `paper` when unsure.
  - Optional effect: `pixel` gives retro game scenes stepped contours. Check subtitle legibility at delivery size because pixelation also affects overlays.
- Fonts: `node scripts/setup-fonts.mjs <ep> <key…>`. Sub styles, glitch, VHS: `kit/style.js`.
- Explainer props (`kit/explainer.js`, global `X`): `bookBadge`, `stopwatch`, `split`, `badge`, `chart`, `crowd`, `povHands`.
- Music: engine `Genre.play(name)` (`lofi chiptune orchestral edm afrobeats qawwali desi boombap`) or
  `kit/thai.js` (ranat, khim, khaen, pi, ching, klong, gong, temple bell). Transitions (`engine/video/shots.js`):
  `cut fade dip iris irisIn wipe push whip zoom flash paper`.

## Reviewing the style menu

- Compare the same cast, shot, lighting and acting at playback speed. Use stills to assess line, colour and face readability. For a style that needs a particular background or lighting, test it in that setting before judging it.
- Recommend keep, group as a preset, revise, or retire. Say what each style adds, where it overlaps, and which episodes or examples use its name. Keep working style identifiers when grouping menu entries. Check real callers before proposing a rename or removal.
- Separate confirmed overlap, rendering defects and missing evidence. Show the comparisons and decisions before changing the renderer. Use the shortest clip that answers the question.

## Horror / mystery

| แนว | Hook / format | Body | Font (key) | Sub | Look (`STYLE`, `post`) | Music | SFX | Transitions |
|---|---|---|---|---|---|---|---|---|
| **สยองเลือกทาง** (default) | rule in a red box at 0 s, one wrong thing, choice screen | `chibi` | `kanit` | `outline`, key lines red | `paper` · vignette 0.45 | `padNote` drone + `strings`; detuning `musicBox` | `subBoom`+`thud`, `heartbeat`, `Thai.wind`, `Thai.whisper` | cut, `irisIn` on hits, `dip` black |
| **ผีไทยพื้นบ้าน** | "ผู้ใหญ่เล่าว่า…", village at night, "คุณเชื่อไหม?" | `chibi` or `puppet` | `charmonman` titles, `kanit` subs | `paper` | `ink` or `paper` · vignette 0.6 | `Thai.khaen` drone, slow `Thai.pi`, `Thai.gong` on hits | `Thai.templeBell`, `Thai.ching`, crickets, `woodTick` | `dip` dark red, `paper` |
| **ตำนานเมือง / creepypasta** | found footage: phone/CCTV frame, timestamp | `anime` | `chakra` | `glitch` | `flat` or `manga` · `Kit.vhs` | low `padNote` + detuned `pulse`; silence before hits | `tvClick`, `scratch`, `Thai.whisper`, static | `cut`, `flash`, `Kit.glitch` |
| **ปริศนาจับผิด** | "หาให้เจอใน 30 วิ" + countdown, answer after the choice | `cartoon` or `anime` | `k2d` | `pop` | `manga` or `flat` | `Genre.play('lofi')` or ticking `marimba` | `ting`, `pop`, `woodTick`, `boing` on wrong | `push`, `zoom` into the clue |
| **ข่าว / คดี (แต่งขึ้น)** | news lower-third, "เหตุเกิดที่…" (fictional place), "คุณคิดว่าใครทำ?" | `anime` | `pridi` | `box` | `flat` or `woodcut` | low `strings` + `timpani` | `tvClick`, `woodTick`, `subBoom` | `push`, `wipe` |
| **วัด / ตำนานโบราณ** | temple, a monk's rule "อย่า…", ornate title | `puppet` or `chibi` | `srisakdi` titles | `paper` | `woodcut` or `ink` · warm gold | `Thai.ranatRoll` + `Thai.chingCycle` + `Thai.klong` | `Thai.templeBell`, `Thai.gong`, wind | `dip` gold, `iris` |

## Everything else

| แนว | Hook / format | Body | Font (key) | Sub | Look | Music | SFX | Transitions |
|---|---|---|---|---|---|---|---|---|
| **ตลกชีวิตประจำวัน** | "เมื่อแม่บอกว่า…", 20–45 s, punchline + freeze frame | `cartoon` or `chibi` | `mitr` | `pop` | `crayon` or `flat` | `Genre.play('chiptune')` or `Thai.ranat` runs | `boing`, `bwomp`, `paperFwip`, `whistle`, `thwack` | `whip`, `zoom`, `iris` out |
| **ชีวิตวัยเรียน / โรแมนซ์** | "ถ้าคนที่ชอบ…", two characters, a blush beat, "คุณจะทำยังไง?" | `anime` | `mitr` or `itim` | `karaoke` | `flat` or `watercolor` | `Genre.play('lofi')`, `epiano` | `ting`, `pop`, heartbeat (soft), `fx: ['blush', 'sparkle']` | `fade`, `push` |
| **ผจญภัย / แฟนตาซี** | a map, a quest, a choice of path each episode | `anime` or `chibi` | `k2d` titles, `kanit` subs | `pop` | `watercolor` or `paper` | `Genre.play('orchestral')`, `brassNote` fanfare | `whoosh` (`noiseSweep`), `bell`, `timpani` | `iris`, `wipe`, `zoom` |
| **ถ้า… (สังคมขำๆ)** | "ถ้าพรุ่งนี้ทุกคน…" said a phrase at a time while the cast on screen changes to show it (≤ 6 s); one number that grounds it; then a list of gags along one day (a clock badge 06:00 → 12:00 → night), one gag per 4–5 s shot, each with a pop-in sticker/stamp; back to the opening place for a warm last line; "คุณว่าอะไรจะเปลี่ยนอีก?"; 45–70 s | `explainer` or `cartoon`, the same 3-person cast all through | `mitr` or `kanit` | `keyword` (2–4 words a screen) | `flat` | music that fits the premise (`Thai.*` for Thai culture, else `Genre.play('lofi')`), never silent | `pop` per sticker, `ting` on the number, `woodTick` on clock badges, `whoosh` between acts | `cut` within an act, `dip` white between acts |
| **ไซไฟ / ถ้า…จะเป็นยังไง** | "ถ้าโลกไม่มี…", 3 consequences, "คุณว่าข้อไหนน่ากลัวสุด?" | `cartoon` or `anime` | `chakra` | `box` | `neon` or `flat` | `Genre.play('edm')` or `supersaw` pad | `pulse` blips, `noiseSweep`, `glass` | `zoom`, `flash`, `push` |
| **กีฬา / แข่งขัน** | "ใครจะชนะ?", a countdown, a slow-mo finish | `cartoon` | `k2d` | `pop` | `flat` | `Genre.play('edm')` or `afrobeats` | `whistle`, `crash`, crowd (`noiseSweep` swells), `thwack` | `whip`, `zoom`, `flash` |
| **ทำอาหาร / สูตรบ้านๆ** | "3 ขั้นตอน…", top-down steps, the taste reaction | `chibi` | `mitr` | `box` | `crayon` or `watercolor` | `Genre.play('lofi')` | `pop`, `ting`, sizzle (`noiseSweep` pink), `woodTick` chop | `push`, `paper` |
| **สอนภาษา / คำศัพท์** | one word, a funny example, "ลองพูดตาม" | `cartoon` or `chibi` | `k2d` | `karaoke` | `flat` | `Genre.play('chiptune')` | `ting` per word, `pop` | `push`, `zoom` |
| **นิทานก่อนนอน / สาระสั้น** | "รู้ไหมว่า…", 3 facts, warm ending | `chibi` | `itim` or `mali` | `karaoke` | `watercolor` or `crayon` | `Thai.khim` lullaby, `musicBox` | `ting`, `paperFwip`, `scribble` | `paper`, `fade` |
| **ไดอารี่ / จดหมาย** | handwritten pages, the VO reads them, a twist on the last page | `anime` or `chibi` | `sriracha` | `type` | `crayon` or `paper` | solo `epiano` or `khim` | `paperFwip`, `scribble`, `woodTick` | `paper`, `dip` white |
| **สรุปหนังสือ / ข้อคิดเชิงอุปมา** | a question hook ("ทำไมเรา…?"), ONE metaphor told in 2–3 "fields" (badge 1, 2…), a split-screen comparison with numbers (stopwatch, chart), the moral as the last line; 30–75 s; `X.bookBadge` in a corner the whole time | `explainer` (glasses, jacket) + POV hands (`X.povHands`) | `kanit` (or `k2d` titles) | `keyword` (*mark* 1–2 words per line) | `flat` · grain 0.02, vignette 0.12 | soft `epiano` I–V–vi–IV or `Genre.play('lofi')` | `pop` on each keyword box, `ting` on badges, whoosh into scenes, clock `woodTick` for timers | `push`, `zoom` into the detail, `X.split` slide |
| **ข้อคิด / กำลังใจ** | a small failure → one sentence that helps → a small win | `anime` | `pridi` or `itim` | `type` | `watercolor` | slow `epiano` + `strings` swell | soft `bell`, `ting` | `fade`, `dip` white |
| **หนังตะลุงตลก / วรรณคดีไทยย่อ** | นายหนัง narrator, clowns (อ้ายเท่ง) talk back to the hero, a moral at the end | `puppet` | `mitr` (clowns), `srisakdi` titles | `pop` | `flat` on `R.screen` | `Thai.ranat` + `Thai.chingCycle` + `Thai.klong`, `Thai.pi` tune | `Thai.ching`, `Thai.gong`, `thwack` | `dip` via amber, `fade` |

## Dials: how the genre should feel (1–10)

Set three dials with the pick and write them on the STORY.md pick line (`… · dials V3 M2 D2`). They are the
reason behind later choices: when a shot, transition or prop doesn't fit the dials, change it or say why.

- **V — visual variance**: ≤ 3 one look, one palette, the same 2–3 shot sizes and places repeated · 4–6 a few
  scene families, each with its own look · ≥ 7 a new place or look may come every beat.
- **M — motion**: cutting pace and acting energy. ≤ 3 long holds, small gestures, `cut`/`fade`/`dip` · 4–6 a
  gesture per beat, one accent transition per scene · ≥ 7 fast cuts, big gestures and `R.act` gestures, `whip`/`zoom`/`flash`.
  How many shots may move the camera is not this dial: `shots.mjs` checks it against the `GENRE` key below.
- **D — information density**: ≤ 3 the subtitle and the one clue, nothing else to read · 4–6 a badge or label
  beside the line · ≥ 7 keyword boxes, charts, split screens (still one new idea per shot).

| แนว | V | M | D | `GENRE` (shots.mjs) |
|---|---|---|---|---|
| สยองเลือกทาง | 3 | 3 | 2 | `horror` |
| ผีไทยพื้นบ้าน | 3 | 2 | 2 | `horror` |
| ตำนานเมือง / creepypasta | 5 | 5 | 3 | `horror` |
| ปริศนาจับผิด | 4 | 4 | 6 | `explainer` |
| ข่าว / คดี | 4 | 4 | 6 | `drama` |
| วัด / ตำนานโบราณ | 3 | 3 | 2 | `fantasy` |
| ตลกชีวิตประจำวัน | 5 | 7 | 3 | `comedy` |
| ชีวิตวัยเรียน / โรแมนซ์ | 4 | 3 | 2 | `slice` |
| ผจญภัย / แฟนตาซี | 7 | 7 | 3 | `adventure` |
| ถ้า… (สังคมขำๆ) | 7 | 4 | 6 | `explainer` |
| ไซไฟ / ถ้า…จะเป็นยังไง | 7 | 6 | 5 | `fantasy` |
| กีฬา / แข่งขัน | 5 | 9 | 4 | `adventure` |
| ทำอาหาร / สูตรบ้านๆ | 3 | 4 | 5 | `explainer` |
| สอนภาษา / คำศัพท์ | 3 | 5 | 5 | `explainer` |
| นิทานก่อนนอน / สาระสั้น | 3 | 2 | 3 | `slice` |
| ไดอารี่ / จดหมาย | 2 | 2 | 3 | `drama` |
| สรุปหนังสือ / ข้อคิดเชิงอุปมา | 5 | 5 | 7 | `explainer` |
| ข้อคิด / กำลังใจ | 3 | 3 | 2 | `drama` |
| หนังตะลุงตลก / วรรณคดีไทยย่อ | 3 | 6 | 3 | `comedy` |

Moving a dial ±2 for one episode is fine (a slow, eerie comedy; a dense horror "case file"). Say it on the pick line.

## Rules that hold in every genre

- Subtitle rail, safe areas, faces above `H*0.70`: unchanged (see `story-format.md`). The "≤ 3 hits" and the
  choice screen are the horror format; other genres end on their own hook (a question, a vote, a punchline).
- One display font + Kanit for small text is enough. Never more than two families on screen.
- Handwritten fonts (`sriracha`, `itim`, `mali`, `charmonman`) are hard to read small: subs ≥ 84 px, and use
  Kanit for the English line.
- Don't mix bodies in one shot (an `anime` hero next to a `cartoon` sidekick reads as a mistake) unless the
  clash is the joke.
- `anime` faces are small in a full-body shot: frame them waist-up (s ≈ 1.8–3) when the face matters.
- In wide shots, check that `cartoon` arms separate from the torso and background. Frame closer when a facial reaction or gesture carries the beat.
- Book summaries: retell the idea **in your own words** and your own metaphor, credit title + author on the
  `bookBadge`, quote the book at most one short sentence. Don't copy another channel's metaphor or script.
  `examples/explainer-demo/` is a working example (original content, fictional badge).
- `Kit.glitch` / `Kit.vhs` are seasoning: ≤ 0.4 s per glitch burst, and never across a face you want read.
- Thai scale (`Thai.scale`) sounds out of tune next to `strings`/`padNote` on purpose: in horror that is the
  point; in comedy keep the Western instruments and the Thai ones apart.
