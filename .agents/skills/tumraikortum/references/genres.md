# Genre menu

The channel is not only horror. Pick one genre per episode **before** writing STORY.md, and write the pick at
the top of STORY.md (`**แนว:** ตำนานเมือง · ตัวละคร anime · ฟอนต์ Chakra Petch · ซับ glitch …`). Each row is a
*starting* recipe: change anything, but change it on purpose. Two episodes in a row should not share
body + font + sub style + music.

- Characters: `kit/rig.js` bodies `anime` · `cartoon` · `chibi` · `explainer` (flat vector, soft shading, glasses) · `puppet` (หนังตะลุง), or the older paper
  rig in `chibi.js` (`K.chibi`). See `chibi-rig.md`.
- Drawing style: engine `paper flat watercolor chalk neon pixel` + `kit/art.js` `ink woodcut crayon manga`
  (`STYLE` in score.js, or `--style` to try one).
- Fonts: `node scripts/setup-fonts.mjs <ep> <key…>`. Sub styles, glitch, VHS: `kit/style.js`.
- Explainer props (`kit/explainer.js`, global `X`): `bookBadge`, `stopwatch`, `split`, `badge`, `chart`, `crowd`, `povHands`.
- Music: engine `Genre.play(name)` (`lofi chiptune orchestral edm afrobeats qawwali desi boombap`) or
  `kit/thai.js` (ranat, khim, khaen, pi, ching, klong, gong, temple bell). Transitions (`engine/video/shots.js`):
  `cut fade dip iris irisIn wipe push whip zoom flash paper`.

## Horror / mystery

| แนว | Hook / format | Body | Font (key) | Sub | Look (`STYLE`, `post`) | Music | SFX | Transitions |
|---|---|---|---|---|---|---|---|---|
| **สยองเลือกทาง** (default) | rule in a red box at 0 s, one wrong thing, choice screen | `K.chibi` or `chibi` | `kanit` | `outline`, key lines red | `paper` · vignette 0.45 | `padNote` drone + `strings`; detuning `musicBox` | `subBoom`+`thud`, `heartbeat`, `Thai.wind`, `Thai.whisper` | cut, `irisIn` on hits, `dip` black |
| **ผีไทยพื้นบ้าน** | "ผู้ใหญ่เล่าว่า…", village at night, "คุณเชื่อไหม?" | `K.chibi` or `puppet` | `charmonman` titles, `kanit` subs | `paper` | `ink` or `paper` · vignette 0.6 | `Thai.khaen` drone, slow `Thai.pi`, `Thai.gong` on hits | `Thai.templeBell`, `Thai.ching`, crickets, `woodTick` | `dip` dark red, `paper` |
| **ตำนานเมือง / creepypasta** | found footage: phone/CCTV frame, timestamp | `anime` | `chakra` | `glitch` | `flat` or `manga` · `Kit.vhs` | low `padNote` + detuned `pulse`; silence before hits | `tvClick`, `scratch`, `Thai.whisper`, static | `cut`, `flash`, `Kit.glitch` |
| **ปริศนาจับผิด** | "หาให้เจอใน 30 วิ" + countdown, answer after the choice | `cartoon` or `anime` | `k2d` | `pop` | `manga` or `flat` | `Genre.play('lofi')` or ticking `marimba` | `ting`, `pop`, `woodTick`, `boing` on wrong | `push`, `zoom` into the clue |
| **ข่าว / คดี (แต่งขึ้น)** | news lower-third, "เหตุเกิดที่…" (fictional place), "คุณคิดว่าใครทำ?" | `anime` | `pridi` | `box` | `flat` or `woodcut` | low `strings` + `timpani` | `tvClick`, `woodTick`, `subBoom` | `push`, `wipe` |
| **วัด / ตำนานโบราณ** | temple, a monk's rule "อย่า…", ornate title | `puppet` or `K.chibi` | `srisakdi` titles | `paper` | `woodcut` or `ink` · warm gold | `Thai.ranatRoll` + `Thai.chingCycle` + `Thai.klong` | `Thai.templeBell`, `Thai.gong`, wind | `dip` gold, `iris` |

## Everything else

| แนว | Hook / format | Body | Font (key) | Sub | Look | Music | SFX | Transitions |
|---|---|---|---|---|---|---|---|---|
| **ตลกชีวิตประจำวัน** | "เมื่อแม่บอกว่า…", 20–45 s, punchline + freeze frame | `cartoon` or `chibi` | `mitr` | `pop` | `crayon` or `flat` | `Genre.play('chiptune')` or `Thai.ranat` runs | `boing`, `bwomp`, `paperFwip`, `whistle`, `thwack` | `whip`, `zoom`, `iris` out |
| **ชีวิตวัยเรียน / โรแมนซ์** | "ถ้าคนที่ชอบ…", two characters, a blush beat, "คุณจะทำยังไง?" | `anime` | `mitr` or `itim` | `karaoke` | `flat` or `watercolor` | `Genre.play('lofi')`, `epiano` | `ting`, `pop`, heartbeat (soft), `fx: ['blush', 'sparkle']` | `fade`, `push` |
| **ผจญภัย / แฟนตาซี** | a map, a quest, a choice of path each episode | `anime` or `chibi` | `k2d` titles, `kanit` subs | `pop` | `watercolor` or `paper` | `Genre.play('orchestral')`, `brassNote` fanfare | `whoosh` (`noiseSweep`), `bell`, `timpani` | `iris`, `wipe`, `zoom` |
| **ไซไฟ / ถ้า…จะเป็นยังไง** | "ถ้าโลกไม่มี…", 3 consequences, "คุณว่าข้อไหนน่ากลัวสุด?" | `cartoon` or `anime` | `chakra` | `box` | `neon` or `flat` | `Genre.play('edm')` or `supersaw` pad | `pulse` blips, `noiseSweep`, `glass` | `zoom`, `flash`, `push` |
| **กีฬา / แข่งขัน** | "ใครจะชนะ?", a countdown, a slow-mo finish | `cartoon` | `k2d` | `pop` | `flat` | `Genre.play('edm')` or `afrobeats` | `whistle`, `crash`, crowd (`noiseSweep` swells), `thwack` | `whip`, `zoom`, `flash` |
| **ทำอาหาร / สูตรบ้านๆ** | "3 ขั้นตอน…", top-down steps, the taste reaction | `chibi` | `mitr` | `box` | `crayon` or `watercolor` | `Genre.play('lofi')` | `pop`, `ting`, sizzle (`noiseSweep` pink), `woodTick` chop | `push`, `paper` |
| **สอนภาษา / คำศัพท์** | one word, a funny example, "ลองพูดตาม" | `cartoon` or `chibi` | `k2d` | `karaoke` | `flat` | `Genre.play('chiptune')` | `ting` per word, `pop` | `push`, `zoom` |
| **นิทานก่อนนอน / สาระสั้น** | "รู้ไหมว่า…", 3 facts, warm ending | `chibi` | `itim` or `mali` | `karaoke` | `watercolor` or `crayon` | `Thai.khim` lullaby, `musicBox` | `ting`, `paperFwip`, `scribble` | `paper`, `fade` |
| **ไดอารี่ / จดหมาย** | handwritten pages, the VO reads them, a twist on the last page | `anime` or `chibi` | `sriracha` | `type` | `crayon` or `paper` | solo `epiano` or `khim` | `paperFwip`, `scribble`, `woodTick` | `paper`, `dip` white |
| **สรุปหนังสือ / ข้อคิดเชิงอุปมา** | a question hook ("ทำไมเรา…?"), ONE metaphor told in 2–3 "fields" (badge 1, 2…), a split-screen comparison with numbers (stopwatch, chart), the moral as the last line; 30–75 s; `X.bookBadge` in a corner the whole time | `explainer` (glasses, jacket) + POV hands (`X.povHands`) | `kanit` (or `k2d` titles) | `keyword` (*mark* 1–2 words per line) | `flat` · grain 0.02, vignette 0.12 | soft `epiano` I–V–vi–IV or `Genre.play('lofi')` | `pop` on each keyword box, `ting` on badges, whoosh into scenes, clock `woodTick` for timers | `push`, `zoom` into the detail, `X.split` slide |
| **ข้อคิด / กำลังใจ** | a small failure → one sentence that helps → a small win | `anime` | `pridi` or `itim` | `type` | `watercolor` | slow `epiano` + `strings` swell | soft `bell`, `ting` | `fade`, `dip` white |
| **หนังตะลุงตลก / วรรณคดีไทยย่อ** | นายหนัง narrator, clowns (อ้ายเท่ง) talk back to the hero, a moral at the end | `puppet` | `mitr` (clowns), `srisakdi` titles | `pop` | `flat` on `R.screen` | `Thai.ranat` + `Thai.chingCycle` + `Thai.klong`, `Thai.pi` tune | `Thai.ching`, `Thai.gong`, `thwack` | `dip` via amber, `fade` |

## Rules that hold in every genre

- Subtitle rail, safe areas, faces above `H*0.70`: unchanged (see `story-format.md`). The "≤ 3 hits" and the
  choice screen are the horror format; other genres end on their own hook (a question, a vote, a punchline).
- One display font + Kanit for small text is enough. Never more than two families on screen.
- Handwritten fonts (`sriracha`, `itim`, `mali`, `charmonman`) are hard to read small: subs ≥ 84 px, and use
  Kanit for the English line.
- Don't mix bodies in one shot (an `anime` hero next to a `cartoon` sidekick reads as a mistake) unless the
  clash is the joke.
- `anime` faces are small in a full-body shot: frame them waist-up (s ≈ 1.8–3) when the face matters.
- Book summaries: retell the idea **in your own words** and your own metaphor, credit title + author on the
  `bookBadge`, quote the book at most one short sentence. Don't copy another channel's metaphor or script.
  `examples/explainer-demo/` is a working example (original content, fictional badge).
- `Kit.glitch` / `Kit.vhs` are seasoning: ≤ 0.4 s per glitch burst, and never across a face you want read.
- Thai scale (`Thai.scale`) sounds out of tune next to `strings`/`padNote` on purpose: in horror that is the
  point; in comedy keep the Western instruments and the Thai ones apart.
