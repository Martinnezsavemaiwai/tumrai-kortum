# TUMRAI — Architecture Audit (Milestone 1)

ตรวจจากโค้ดจริงใน working directory วันที่ 2026-10-31 (branch `main`, commit `13e07dc`, working tree สะอาดก่อนเริ่ม)
ทุกข้อในรายงานนี้อ้างไฟล์ที่เปิดอ่านแล้ว ข้อที่ยังไม่ได้ตรวจจะเขียนว่า "ยังไม่ได้ตรวจ"

---

## 1. Current Architecture

```
STORY.md / STORYBOARD.md  (ร้อยแก้วภาษาไทย ต่อตอน)
        │  agent อ่าน แล้วเขียนเป็นโค้ดด้วยมือ
        ▼
score.js  ── SHOTS / LINES, ev, markers(sync:'av'), subtitles, DURATION, FPS, FORMAT   ← "single source of truth" ของเวลา
   │                         │
   ▼                         ▼
film.js (canvas, Shots.film)   song.js (synth + VO จาก voice/*.mp3, LUFS -14)
   │   ใช้ engine/video/*  +  kit/*  +  chibi.js
   ▼
engine/render.js  ── headless Chrome ผ่าน DevTools protocol (ไม่มี npm dependency)
   stills · sheet · board · clip · video (parallel workers) · mux · check · verify · qa · pacing · plan · poster · cast
```

| ส่วน | ไฟล์ | หมายเหตุ |
|---|---|---|
| Engine (ต่อตอน) | `<ep>/engine/**` ~6,000 บรรทัด | **ถูกคัดลอกทั้งโฟลเดอร์เข้าไปทุกตอน** โดย `scripts/new-episode.mjs` |
| Skill (canonical) | `.agents/skills/tumraikortum/` | `SKILL.md`, `kit/` (rig, art, style, thai, explainer, chapters), `scripts/`, `references/` |
| Claude Code entry | `.claude/skills/tumraikortum/SKILL.md` | แค่ชี้ไปที่ `.agents/...` (ไม่ซ้ำซ้อน ดีแล้ว) |
| Third-party skills | `.claude/skills/canvas-procedural-animation`, `captions-overlay` | gitignored, ติดตั้งเองในเครื่อง |
| ตอนจริง | `halloween-ep1`, `-ep2a`, `-ep3` (tracked) · `yai-ep1` (local only, gitignored) | |
| ตัวอย่าง | `examples/explainer-demo` (9:16), `examples/longform-demo` (16:9 + chapters) | |

ไม่มี `package.json` ระดับ root, ไม่มี test runner, ไม่มี `node_modules` (Node 24, ffmpeg 8.1, Chrome, Python 3.12 มีในเครื่อง)

## 2. Existing Capabilities (ทำได้แล้วจริง)

| ระบบ | ทำอะไรได้ | ที่อยู่ |
|---|---|---|
| Story & Script | รูปแบบเรื่อง "ทุกอย่างถูกหมดยกเว้นเรื่องเดียว", เทมเพลต storyboard, genre menu 15+ แนว | `references/story-format.md`, `storyboard-template.md`, `genres.md` |
| Character (3 ระบบ) | (ก) `Ch.person`/`Ch.claude` ใน engine · (ข) paper chibi `K.chibi` + ตาราง `COSTUME` · (ค) skeleton rig `R.draw` 5 bodies, มือมีนิ้ว, 15 poses, `R.act`, `R.walk` | `engine/video/chars.js`, `<ep>/chibi.js`, `kit/rig.js` |
| Drawing styles | 10 สไตล์ (paper flat watercolor chalk neon pixel + ink woodcut crayon manga) ผ่าน `G.*` | `engine/video/gfx.js`, `kit/art.js` |
| Motion | easing 15 แบบ, `tween`, `springKick`, `noise1`; `R.act` = anticipation 0.12 s + outBack + hold | `engine/util.js:46`, `kit/rig.js:356` |
| Camera & cuts | `Shots.film`: 11 transitions, `push/pan/shake/handheld/combine`, parallax `Shots.layers` | `engine/video/shots.js` |
| Audio sync | markers `sync:'av'` + `render.js verify` วัดภาพ+เสียงจากไฟล์จริง (±1 frame / ±20 ms) | `engine/render.js` (verify) |
| Determinism | `lintDeterminism()` เตือน `Math.random/Date.now` | `engine/render.js:80` |
| QA | `qa` (ข้อความนอก safe area/เล็ก/ซ้อน/contrast), `pacing` (hook 3 s, pattern interrupt), `plan`, `check` (loudness), `board`, `sheet` | `engine/tools/*.js` |
| Long-form | render ทีละ chapter, resume, join, SRT, YouTube chapters | `scripts/render-long.mjs`, `kit/chapters.js` |
| Voice | ElevenLabs TTS cache ต่อ shot, `--dry` | `scripts/tts.py` |

Render ใช้งานได้จริง: ทดสอบ `render.js stills` บน test scene ใหม่ 10 เฟรม ~120–160 ms/เฟรม (ดู §7)

## 3. Problems (พร้อมพาธและฟังก์ชัน)

### P1 — ความจำของเรื่องเป็นร้อยแก้ว ไม่มีโครงสร้าง (ต้นเหตุของปัญหา "AI จำไม่สม่ำเสมอ")
- ข้อเท็จจริงข้ามตอนกระจายอยู่ใน `halloween-script.md` (218 บรรทัด), `halloween-ep*/STORY.md` และคอมเมนต์ใน `chibi.js`
  ตัวอย่างจริง: "ดอกลีลาวดีของปิ่นอยู่ขวาใน EP1–2 แต่ซ้ายใน EP3" (`halloween-ep3/STORY.md`), "เสียง Liam = ต้นปลอม = ผีปอบ", "คืนนั้นฝนไม่ตก" — ไม่มีที่ไหนตรวจได้อัตโนมัติ
- ไม่มีการแยก canon / draft / ความเชื่อของตัวละคร / สิ่งที่ยังไม่รู้ / ข้อเสนอแก้ไข
- ไม่มีวิธีส่งเฉพาะบริบทที่เกี่ยวกับฉากให้ agent ต้องอ่านทั้งไฟล์ทุกครั้ง
- ไม่มีอะไรกัน agent แก้ canon เองโดยพลการ

### P2 — Engine ถูกคัดลอกทุกตอน และเริ่ม drift แล้ว
- `new-episode.mjs` คัดลอก `engine/` ทั้งชุดจากตอนต้นทาง ตอนนี้มี 6 ชุด: 5 ชุดเหมือนกัน แต่ `examples/longform-demo/engine/render.js:724` มี `video --range` ที่ชุดอื่นไม่มี
- `render-long.mjs` จึงต้อง **patch โค้ด engine ด้วย string replace** ตอนรัน (`render-long.mjs` บล็อก "make sure the engine can render a range") ซึ่งพังทันทีถ้าบรรทัดนั้นเปลี่ยน
- ข้อดีที่ต้องรักษาไว้: ตอนเก่าถูก "แช่แข็ง" render ซ้ำได้ผลเดิมเสมอ

### P3 — ระบบตัวละครซ้ำซ้อน 3 ชุด และข้อมูลหน้าตาไม่มีแหล่งเดียว
- `Ch.person` (engine), `K.chibi` (`<ep>/chibi.js`), `R.draw` (`kit/rig.js`) ใช้ option คนละชุด
- `COSTUME` ใน `chibi.js` ถูกคัดลอกและแก้ต่อตอน: `halloween-ep1/chibi.js` ไม่มี `you0`, `ton` ที่ ep2a/ep3 มี; `flower` mirror มีเฉพาะ ep3
- `R.CAST` เป็นตัวอย่างฮาร์ดโค้ดใน kit; ตัวละครของซีรีส์จริงถูกเขียนลง film.js/chibi.js ของแต่ละตอน → หน้าตาข้ามตอนคลาดได้
- `render.js cast` (`engine/render.js:387 CAST_JS`) รู้จักแค่ `Ch.person` ไม่รู้จัก `R` หรือ `K` → ไม่มี model sheet ของ rig ที่ใช้จริง

### P4 — คุณภาพภาพตัวละคร (`kit/rig.js`) — ตรวจจากภาพ render จริง (`examples/rig-lab/out/before/`)
- **บั๊ก: คิ้ว angry/sad สลับกัน** ทั้ง anime (`front()` บรรทัด 236: `tilt = angry ? -8 : sad||shock ? 7`) และ chibi/explainer (`dotEye()` บรรทัด 115) — หน้า "angry" ออกมาเหมือนกังวล หน้า "sad" และ "scared" ออกมาเหมือนโกรธ
- คิ้ว anime ถูกวาด **ก่อน** ผมหน้า (`hairFront` บรรทัด 242) จึงถูกหน้าม้าทับ เหลือเส้นหนาเหนือตา หน้า idle ดูหงุดหงิด
- ผมยาว (`hairBack` บรรทัด 148) และ twintail เป็นสี่เหลี่ยมคางหมูแข็ง ๆ ซิลูเอตไม่สวย, มีทรงผมแค่ long/spiky/twintail/short/bald
- แสงเงา: มีเงานุ่มเฉพาะ body `explainer` (`soft()`), anime/chibi/cartoon แบนทั้งตัว
- ไม่มี validation ของ character spec: พิมพ์ `hairStyle: 'bun'` ผิดก็ไม่มี error แค่ไม่วาด

### P5 — Motion
- `R.act` สลับฟิลด์ที่ไม่ใช่ตัวเลข (eyes, mouth, hand, fx) แบบ **ทันที** ที่ u = 0.5 (`kit/rig.js:364`) → เปลี่ยนสีหน้ากระตุก
- ไม่มี blink/หายใจอัตโนมัติใน rig; ตอน halloween ทำ blink เองใน film.js (`halloween-ep1/film.js:90`) — ทำซ้ำทุกตอน
- ไม่มี follow-through / secondary motion (ผม, ชายเสื้อ) ใน rig
- (Milestone 4 — ยังไม่แก้ในรอบนี้)

### P6 — Storyboard → Timeline ยังเป็นงานมือ
- `STORYBOARD.md` เป็นตาราง markdown ที่ agent แปลเป็น `score.js` เอง ไม่มีตัวตรวจว่า shot ใน storyboard ตรงกับ `SHOTS` ใน score (Milestone 5)
- Camera: `Shots.*` ครบพอ แต่ไม่มี shot type (CU/MS/WS) เป็นข้อมูล ทำให้ตรวจ framing อัตโนมัติไม่ได้

### P7 — QA ยังไม่ครอบคลุมตัวละคร/เรื่อง
- `qa` ตรวจเฉพาะ "ข้อความ" (`engine/tools/qa.js`) ไม่ตรวจว่าหน้าตัวละครอยู่ใน safe area หรือโดนซับทับ (กฎ "faces above H*0.70" ใน SKILL.md ไม่มีโค้ดตรวจ)
- ไม่มี automated test ใด ๆ ในรีโป (ไม่มี `*.test.*`)

## 4. Missing Capabilities

| ขาด | ผลกระทบ | Milestone |
|---|---|---|
| Story bible ที่มีโครงสร้าง + สถานะ canon/draft/belief/unknown/proposal | AI ลืม/แต่งทับ canon | 2 |
| Continuity tests ข้ามตอน + branch-aware | จับผิดไม่ได้ก่อนเรนเดอร์ | 2 |
| ดึงบริบทเฉพาะฉาก | prompt ใหญ่เกิน, ข้อมูลไม่ตรงฉาก | 2 |
| Character spec → rig แบบมี validation, แหล่งเดียว | หน้าตาคลาดข้ามตอน | 2–3 |
| Model sheet ของ rig (test scene) | ไม่มีภาพเปรียบเทียบก่อน/หลัง | 3 / 7 |
| Expression blending, auto blink/breath, secondary motion | การเคลื่อนไหวแข็ง | 4 |
| Shot list เป็นข้อมูล + ตรวจ framing ใบหน้า | มุมกล้อง/ซับทับหน้า | 5 / 7 |
| Skills แยกบทบาท (story-memory, continuity-checker …) | agent หลายตัวแก้ข้อมูลชนกัน | 6 |

## 5. Performance Bottlenecks

- Still render: ~120–160 ms/เฟรมที่ 1080p (วัดจริงบน rig-lab, 10 เฟรม 2.3 s รวมเปิด Chrome) — ไม่ใช่คอขวด
- `G.shape` วาดเส้น "boil" ทุกรูปทรง ทุกเฟรม; ตัวละคร rig หนึ่งตัว ≈ 60–90 shape — ฉากที่มีตัวละคร 8+ ตัว (halloween) หนักที่สุด แต่ยังไม่ได้ profile ตัวเลขจริง (ยังไม่ได้ตรวจ)
- Transition `fade/push/whip/zoom` วาดสองช็อตลง offscreen buffer ต่อเฟรม (`shots.js` `buffer()`) — 2× ค่าวาดเฉพาะช่วง transition
- Frame grab บน Windows ส่ง PNG ทีละ 1 MB (`render.js:277 grab`) — จำเป็น (ข้อจำกัด socket) ไม่ควรแก้
- ข้อห้ามที่รู้แล้ว: `ctx.filter = 'blur()'` เต็มเฟรม (SKILL.md)
- คำแนะนำ: ยังไม่ต้อง optimise จนกว่าจะวัดเวลา `video` ของตอนยาวจริง

## 6. Recommended Improvements (เลือกทางที่กระทบระบบเดิมน้อยที่สุด)

1. **Story memory เป็น JSON ต่อซีรีส์ใน git** (`stories/<series>/bible.json`) + CLI ไม่มี dependency (`scripts/story.mjs`):
   `check` (continuity + canon lock), `context` (บริบทเฉพาะฉาก), `state`, `cast` (export หน้าตาตัวละครเป็น `cast.js` ให้ rig), `propose`/`approve`
   — git ให้ version history, `canon.lock.json` กันการแก้ canon นอกขั้นตอนอนุมัติ
2. **Rig: แก้ที่ `kit/rig.js` ใน skill เท่านั้น** ตอนเก่าใช้ kit ที่คัดลอกไว้แล้ว จึงไม่เปลี่ยน (ไม่มี regression ต่อของที่ปล่อยไปแล้ว)
   แก้บั๊กคิ้ว, ลำดับเลเยอร์คิ้ว, ทรงผม, เงา cel 1 ชั้นจากแสงบนซ้าย, `R.SPEC` + `R.check()` สำหรับ validation
3. **Test scene `examples/rig-lab`**: หน้า model sheet ต่อวินาที ใช้เทียบก่อน/หลังทุกครั้งที่แก้ rig
4. (ภายหลัง) แยก engine ให้มีชุด canonical ใน skill และให้ `new-episode.mjs` คัดลอกจากที่นั่น แทนการคัดลอกจากตอนต้นทาง — แก้ P2 โดยยังแช่แข็งตอนเก่าไว้ (ต้องขออนุมัติ เพราะย้ายไฟล์จำนวนมาก)
5. (M4) `R.act` blend สีหน้าแบบ cross-fade + auto blink/breath แบบ deterministic จาก `U.hash`
6. (M5/7) `SHOTS` มี `type: 'CU'|'MS'|'WS'` + QA ตรวจตำแหน่งหน้าเทียบ rail ซับ

## 7. Risk & Compatibility

| ความเสี่ยง | การจัดการ |
|---|---|
| แก้ `kit/rig.js` แล้วตอนเก่าเปลี่ยน | ตอนเก่ามี `kit/` ของตัวเอง (คัดลอกตอน scaffold) → ไม่ถูกแตะ; ตัวอย่างใน `examples/*-demo` ก็ไม่ถูกแตะ |
| `render.js` ใน 6 ชุด | รอบนี้ **ไม่แก้ engine** เลย |
| Story memory บังคับใช้กับซีรีส์เก่า | เป็น opt-in: ซีรีส์ที่ไม่มี `stories/<id>/` ทำงานเหมือนเดิม |
| `halloween-*` เป็นเนื้อหาสงวนสิทธิ์ | ไม่นำมาเป็น fixture; ใช้ซีรีส์ตัวอย่างที่แต่งใหม่ (`stories/demo-dorm9`) การย้าย halloween เข้า bible ให้ผู้ใช้ตัดสินใจ |
| `yai-ep1` (local, ไม่อยู่ใน git) | ไม่แตะ |
| Dependency ใหม่ | ไม่มี (ใช้ `node:test`, `node:crypto`, `node:fs`) |

## 8. Implementation Priority

| ลำดับ | งาน | สถานะ |
|---|---|---|
| M1 | Audit นี้ + test scene `examples/rig-lab` + ภาพ "before" | ✅ เสร็จ |
| M2 | `story.mjs` + `bible.json` schema + canon lock + continuity tests ข้ามตอน/branch + `context` + docs | ✅ เสร็จ (ดู §9) |
| M3 | rig: คิ้ว, เลเยอร์, ทรงผม, cel shading, `R.SPEC/R.check`, `story cast` → `cast.js`, ภาพ before/after | ✅ เสร็จ (ดู §9) |
| M4 | expression blending, auto blink/breath, secondary motion | ✅ เสร็จ (ดู §10) |
| M5 | shot list เป็นข้อมูล, shot types, ตรวจ storyboard ↔ score | ✅ เสร็จ (ดู §11) |
| M6 | skills แยกบทบาท (story-memory, continuity-checker, visual-quality-review) บน CLI จาก M2 | ✅ เสร็จ (ดู §12) |
| M7 | QA หน้าตัวละคร/safe area, end-to-end test | หยุดขออนุมัติก่อน |
| — | รวม engine เป็นชุด canonical (P2) | เปลี่ยนโครงสร้าง: ต้องอนุมัติ |

## 9. ผลของ Milestone 2–3

### M2 — Story memory
- ไฟล์: `.agents/skills/tumraikortum/scripts/story.mjs`, `story.test.mjs`, `references/story-memory.md`, ซีรีส์ตัวอย่าง `stories/demo-dorm9/` (`bible.json`, `canon.lock.json`)
- แก้ P1: แยก canon / draft / unknown (facts), belief ต่อตัวละคร (`learn.belief`: true/false/unsure), proposal (`proposals/*.json`)
- กัน agent แก้ canon: `canon.lock.json` เก็บ fingerprint ทุกชิ้นที่เป็น canon; แก้/เพิ่ม/ลบ canon นอก `approve` → `check` ล้ม; `approve` ปฏิเสธถ้ามีการแก้ canon ค้างอยู่
- Branch-aware: ทุกอย่าง replay ตาม `after` ของแต่ละตอน (สาย A กับ B ไม่ปนกัน)
- `context` ส่งเฉพาะตัวละครในฉาก, ข้อเท็จจริงที่เกี่ยวกับพวกเขา, สายเรื่องของตอนนั้น, เส้นเรื่องค้าง, tests — ไม่ส่งตอนของอีกสาย หรือข้อมูลของตัวละครนอกฉาก
- ผลทดสอบ: `node --test .agents/skills/tumraikortum/scripts/story.test.mjs` → 16/16 ผ่าน (ข้ามตอน: ทรงผมเปลี่ยนแล้วคงอยู่, ตัวละครที่ออกไปแล้วโผล่กลับมา, ใช้ความลับก่อนรู้, ถูกหลอกแล้วยังใช้, ข้อเท็จจริงที่ยังไม่กำหนด, payoff ข้ามสาย, แก้ canon โดยไม่อนุมัติ, proposal → lock ใหม่)
- ทดสอบ CLI จริงบนสำเนา: `approve` ผ่าน → re-lock; แก้ canon ด้วยมือ → `check` ✗ และ `approve` ปฏิเสธ; `lock` ไม่มี `--yes` → ปฏิเสธ

### M3 — Character visual quality (`kit/rig.js` ใน skill เท่านั้น)
| ปัญหา (P4) | แก้ |
|---|---|
| คิ้ว angry/sad สลับกัน (anime, chibi, explainer, cartoon) | แก้ทิศ tilt ทุก body; แก้ lash tilt ที่ไม่สมมาตรซ้าย/ขวาใน `animeEye` |
| คิ้ว anime โดนหน้าม้าทับ, เส้นขนตาแบนดูเหมือนแว่น | วาดคิ้วหลังผม สูงขึ้นและสั้นลง; ขนตาบนโค้งตามรูปตา |
| ผมยาว/แกละเป็นสี่เหลี่ยมคางหมู | spline (Catmull-Rom) ปลายแหลมโค้ง, เงาใต้ผมยาว, ปอยข้างแก้มโค้ง; ทรงใหม่ `bob`, `ponytail`; `accent` = สียางมัดผม |
| แบนทั้งตัว ยกเว้น explainer | เงา cel แสงเดียวจากบนซ้ายทุก body (`SHADE`), เงาหน้าม้าบนหน้าผาก, คอเข้มขึ้น |
| spec ไม่มี validation | `R.SPEC` + `R.check(who)`; `story.mjs check` ใช้ตัวเดียวกัน (single source of truth ของ spec); `who.body` ใช้ได้ |
| หน้าตาตัวละครซีรีส์ไม่มีแหล่งเดียว | `story.mjs cast <series> <ep> --out cast.js` → `R.CAST` ตาม state ของตอนนั้น |

- ภาพเปรียบเทียบ: `docs/img/rig-*-before-after.jpg` (bodies, faces, anime poses, chibi poses) จาก test scene `examples/rig-lab`
- Regression: ตอนเก่าและ `examples/*-demo` ไม่ถูกแก้ (มี kit ของตัวเอง); เรนเดอร์ explainer-demo ด้วย rig ใหม่ในสำเนาชั่วคราว (t = 2, 10, 22) — ภาพเหมือนเดิม ต่างแค่ปอยผมโค้งและเงาหน้าผาก, ไม่มี error
- ท่ายืน/การเคลื่อนไหว: แก้ใน M4 (§10)

## 10. ผลของ Milestone 4 — Smooth animation (`kit/rig.js` `R.act`)

ปัญหาที่วัดได้จากโค้ดเดิม (`act()` ก่อนแก้, ดู motion graph ใน `examples/rig-lab` หน้า 11):

| ปัญหา | สาเหตุในโค้ดเดิม | แก้ |
|---|---|---|
| ท่าเริ่มขยับแบบ "สะบัด" | `U.ease.outBack(u)` ออกตัวด้วยความเร็วสูงสุดในเฟรมแรก | `outBack(smoothstep(u))`: ค่อย ๆ ออกตัว แล้วเลยเป้านิดหนึ่งก่อนนิ่ง |
| ตัวกระตุกลง 10 px ทุกครั้งที่ถึง key | anticipation dip (`bob +10`, squash) หายในเฟรมเดียวเมื่อ key เปลี่ยน | dip ค่อย ๆ คืนตัวระหว่างครึ่งแรกของ move |
| แขนกระตุกตอนเริ่มโบกมือ / ตัวสั่นตอนโกรธ | `wiggle` เริ่มทันทีเมื่อ u = 1 ด้วย phase สุ่ม และหยุดทันทีเมื่อเปลี่ยนท่า | wiggle ค่อย ๆ เข้า (0.3 s) และค่อย ๆ ออกระหว่างท่าถัดไป |
| ปากหุบทันทีเมื่อเลิกพูด | `talk` ถูกตั้งเฉพาะตอนท่า `talking` | ปากค่อย ๆ เข้าและออกจากการพูด (0.12 s) |
| สีหน้าเปลี่ยนแบบตัด (eyes/mouth) | ค่าที่ไม่ใช่ตัวเลขสลับที่ u = 0.5 ขณะตาเปิด | ใส่ blink ปิดตาพอดีจังหวะที่สลับ (±0.09 s) |
| ทุกข้อต่อขยับพร้อมกันเป๊ะ | ใช้ `e` ตัวเดียวทุกฟิลด์ | follow-through: ศอกตามไหล่ 0.06 s, ศีรษะ 0.09 s, สายตา 0.05 s (`LAG`) |
| ยืนนิ่งสนิท ไม่กะพริบตา | ไม่มีระบบ idle (ตอน halloween เขียน blink เองใน film.js) | `R.idle(t, seed)`: หายใจทุก 3.6 s, กะพริบ ~20 ครั้ง/นาที (บางครั้งกะพริบสองที), saccade ของสายตาทุก 1.9 s, ตัวโยกเล็กน้อย — เปิดเป็นค่าเริ่มต้นใน `R.act` (`alive: false` เพื่อปิด) |
| ผมไม่ขยับ, ผมด้านหลังไม่หมุนตามศีรษะ | `hairBack` ถูกวาดนอก transform ของ `tilt` | ผมด้านหลังหมุนตามหัว + `sway` (ผมตามหลังการเคลื่อนไหวของหัว 0.25 s งอมากขึ้นที่ปลาย) |
| ไม่มี motion preset | — | `gestures`: `jump` (ย่อ-ลอยยืด-ลงยุบ), `nod`, `shake`, `shiver` บวกทับท่าใดก็ได้ |

ทุกอย่างเป็นฟังก์ชันของ `(t, seed)` ล้วน (ไม่มี state, ใช้ `U.hash`/`U.noise1`) จึงเรนเดอร์ขนานกันได้และได้ผลเดิมทุกครั้ง

ตัวเลขเทียบก่อน/หลัง (keys idle→wave→angry→sad→talk→idle, สุ่มตัวอย่าง 240 fps, สคริปต์เปรียบเทียบเดียวกันทั้งสองเวอร์ชัน):

| วัด | ก่อน (M3) | หลัง (M4) |
|---|---|---|
| ค่าเปลี่ยนมากสุดใน 1/240 s: rEl / bob / talk / sy | 0.247 rad / 9.65 px / 0.717 / 0.048 | 0.049 rad / 0.37 px / 0.044 / 0.002 |
| สีหน้าสลับขณะตาเปิด | 5 ครั้ง | 0 |
| กะพริบตาใน 7 s | 0 | 7 (5 ครั้งบังการเปลี่ยนสีหน้า + 2 ครั้งตามธรรมชาติ) |
| ขยับขณะค้างท่า (6.5–7 s) | ไม่มีอะไรขยับ | tilt, lean, look |

- Tests: `scripts/rig.test.mjs` 7 ข้อ (determinism, ไม่มีค่าใดกระโดดที่ 240 fps รวมถึงช่วง gesture, สีหน้าสลับตอนตาปิดเท่านั้น, อัตรากะพริบ 15–30/นาที, follow-through, hair sway, gestures) — รวมกับ story tests ผ่าน 23/23
- ภาพเปรียบเทียบ: `docs/img/motion-graph-before-after.jpg` (จุดละเฟรม: ช่องว่าง = กระโดด, เส้นแดง = สลับสีหน้า, ฟ้า = กะพริบ), `motion-onion-skin-before-after.jpg`, `motion-pose-changes-before-after.jpg`
- ความเข้ากันได้: API เดิม `R.act(t, keys)` ยังใช้ได้; ค่าที่คืนเพิ่ม `blink`, `sway`; ตอนเก่า/ตัวอย่างเดิมไม่ถูกแตะ (kit ของตัวเอง) — แต่ถ้าไม่ส่ง `seed` ตัวละครทุกตัวในฉากจะกะพริบพร้อมกัน
- ยังไม่ทำ: การเดิน (`R.walk`) ยังเป็น cycle เดิม, `K.chibi` (paper rig ของ halloween) ไม่ได้รับการปรับนี้, ยังไม่ได้ฟังเสียงพูดเพื่อ lip-sync จริง (ปากยังขยับตาม sin)

## 11. ผลของ Milestone 5 — Storyboard & Camera (`kit/direct.js`, `scripts/shots.mjs`)

ปัญหาจริงจากโค้ด:
- กล้องเขียนเป็นตัวเลขมือทุกช็อต เช่น `halloween-ep3/film.js:298` `x: SOFA.x + 210 - W / 2, y: SOFA.y - 120 - H / 2, zoom: lerp(1.9, 2.2, s.u)` — ไม่มีคำว่า CU/MS เป็นข้อมูล เปลี่ยนตำแหน่งตัวละครแล้วต้องคำนวณใหม่เอง
- คอลัมน์กล้องใน STORYBOARD.md เป็นข้อความอิสระ ("ใกล้", "ดึงกล้องออกช้าๆ") — ตรวจไม่ได้
- ไม่มีอะไรตรวจว่าเสียงพากย์จบก่อนตัดช็อต, หน้าตกใต้ซับ, ข้ามเส้น 180°, หรือกล้องขยับเกิน

สิ่งที่เพิ่ม (ไม่แตะ engine; ตอนเก่าไม่เปลี่ยน):
| ส่วน | ทำอะไร |
|---|---|
| `Direct.subject` | landmarks (หัว ตา คาง อก เอว เข่า เท้า) จาก `x, y, s, body` ตัวเดียวกับ `R.draw` |
| `Direct.frame(type, subj, { look, with })` | ECU…EWS: ตาอยู่บนเส้นตา (⅓; 9:16 = 0.36 H), look room, หัวไม่ตกขอบตั้งแต่ CU ออกไป, คางไม่ตกใต้ซับ (9:16 0.70 H, 16:9 ⅔ H), แต่ละขนาดกว้างกว่าขนาดก่อน ≥ 15 %, two-shot |
| `Direct.cam(type, subj, { move })` | static · push · pull · drift · pan · track — คืน `cam` ของ `Shots.film` ใช้กับ `Shots.combine` / `Shots.shake` ได้ |
| `Direct.GENRES` | ค่าเริ่มต้นการกำกับต่อแนว 7 แนว (ความยาวช็อตเฉลี่ย, สัดส่วนกล้องขยับ, จำนวน hit, ช่วงไม่ตัดนานสุด) |
| `Direct.lint` + `scripts/shots.mjs` | ตรวจ: เสียงพากย์ (วัดจาก mp3 จริงด้วย ffprobe หรือประมาณ) เทียบความยาวช็อต, เส้น 180°, jump cut, ขนาดซ้ำ 3 ช็อต, กล้องขยับในช็อตสั้น/ติดกัน 3 ช็อต, จังหวะตามแนว, STORYBOARD.md ↔ SHOTS |
| เอกสาร | `references/directing.md` (คำศัพท์ช็อต, กติกา, ตารางแนว), template storyboard มีคอลัมน์ `shot · on · move` และ scene sides, `SKILL.md` ขั้น 2/5/8, `new-episode.mjs` ใส่ `kit/direct.js` |

ปัญหาที่ test เจอและแก้ระหว่างทำ (ทั้งหมดเป็นของโค้ดใหม่): ใน 9:16 CU ใหญ่กว่า ECU (วัดขนาดจากความสูงเฟรม → เปลี่ยนเป็นด้านสั้น);
chibi หัวโตหัวหลุดขอบ; chibi ขนาด CU–MS แทบเท่ากัน (บังคับให้ขยายทีละ ≥ 15 %); WS/EWS ใน 9:16 หน้าตกใต้ซับ (ยืนที่ 0.66 H);
ECU ของ cartoon คางตกใต้ซับ (จัดกลางหน้าแทนตา + ใช้ช่วงตา–คาง)

ผลทดสอบ:
- `node --test ".agents/skills/tumraikortum/scripts/*.test.mjs"` → 30/30 (direct 7: 192 การจัดเฟรม = 4 body × 8 type × 2 format × 3 ทิศสายตา, two-shot, moves, lint 4 กลุ่ม, parser storyboard)
- ตอนจริง (อ่านอย่างเดียว) `shots.mjs halloween-ep1/2a/3 --genre horror`: ไม่มี error; hits = 3 / 2 / 3 ตรงกฎช่อง (hook ไม่นับ); พบจริง 1 ข้อ: **EP3 ช็อต 13 เสียงพากย์จบก่อนตัดเพียง 0.14 s** (วัดจาก `voice/055.mp3`)
- ปรับค่าประมาณความยาวเสียงจากข้อมูลจริง: 39 ไลน์ใน EP2A+EP3 → ElevenLabs ไทย ≈ 11.5 ตัวอักษร/วินาที (ตั้ง 11 + 0.4 s ให้เผื่อ)
- End-to-end: `new-episode.mjs` → SHOTS มีข้อมูลกล้อง → `shots.mjs` ✓ → `Direct.cam` → render 4 ช็อต (`docs/img/direct-dialogue-9x16.jpg`): หน้าทุกช็อตอยู่เหนือซับ, look room ถูกด้าน
- ภาพ: `docs/img/direct-shot-types-9x16.jpg`, `direct-shot-types-16x9.jpg` (rig-lab หน้า 16 s / 17 s)

ข้อจำกัด: ไม่มี "ภาพก่อน" ของระบบนี้ (ก่อนหน้าไม่มีการจัดเฟรมอัตโนมัติ; สิ่งที่เทียบได้คือผล lint บนตอนจริง); two-shot ของตัวละครที่ยืนห่างกันมากแน่นได้แค่ MS และตัวสูง–ตัวเตี้ยต่างกันมากไม่มีเส้นตาร่วม (ระบบถอยเป็นช็อตกว้างกว่าเอง); ยังไม่มีมุมกล้อง (high/low angle, OTS) เพราะ renderer เป็น 2D หน้าตรง; `qa` ของ engine ยังไม่ตรวจตำแหน่งหน้าในเฟรมที่เรนเดอร์จริง (การันตีด้วยการคำนวณ + test แทน)

## 12. ผลของ Milestone 6 — Agent skills และ subagents

ตรวจของเดิมก่อน: มี `tumraikortum` (skill หลักทั้ง pipeline, `.claude/skills/` เป็นตัวชี้ไป `.agents/skills/`), skill บุคคลที่สามที่ติดตั้งในเครื่อง 2 ตัว (gitignored) และไม่มี subagent ของโปรเจกต์
- ⚠ `captions-overlay` (ของ HyperFrames) สอนว่า "อย่าเว้นพื้นที่ให้ซับ" ซึ่งขัดกับกฎรีโปนี้ (หน้าอยู่เหนือ rail ซับ) — ไม่ได้แตะ (เป็นของในเครื่อง) แต่ไม่ควรใช้กับงานในรีโปนี้

ชุดที่เพิ่ม (เล็กที่สุดที่ยังแยกความรับผิดชอบ, แต่ละอย่างมี Input / Output / Workflow / Validation criteria):
| ชื่อ | ชนิด | เขียนอะไร | ทำไมแยก |
|---|---|---|---|
| `story-memory` | skill | `stories/` (draft + proposal เท่านั้น) | **เจ้าของ bible คนเดียว** — กันหลาย agent แก้ canon แข่งกัน |
| `narrative-director` | skill | `STORY.md` | อ่าน bible ผ่าน `context` เท่านั้น |
| `storyboard-director` | skill | `STORYBOARD.md`, SHOTS ส่วนกล้อง, ตารางการแสดง | รวม animation-director ไว้ด้วย: กล้องกับการแสดงต้องตัดตามจังหวะเดียวกัน |
| `character-design` | skill | spec หน้าตา (ผ่าน story-memory), model sheet, `cast.js` | รวม character-consistency: spec เดียวใน bible + `cast.js` |
| `continuity-checker` | subagent (อ่านอย่างเดียว) | — (รายงาน) | ต้องการ context ใหม่ อ่านแบบคนดูที่จำทุกตอน ไม่ใช่คนเขียน |
| `visual-reviewer` | subagent (อ่าน + render ใน `out/`) | — (รายงาน + ภาพ) | ดูภาพจริง ไม่ใช่ดูโค้ดของตัวเอง |

ไม่สร้างแยก: animation-director, character-consistency, visual-quality-review (ซ้ำกับข้างบน) — ลดจุดที่ข้อมูลเดียวกันถูกเขียนสองที่
- `tumraikortum/SKILL.md` มีตาราง Roles (ขั้นไหน ใครเป็นเจ้าของ เขียนอะไร ใครตรวจ); `AGENTS.md` ระบุกฎ canon
- Codex/agent อื่นที่ไม่มี subagent: ใช้ไฟล์ใน `.claude/agents/` เป็น checklist ในรอบแยก
- Claude Code โหลด skill ใหม่ทั้ง 4 ทันที (เห็นในรายการ skill ของ session); subagent types โหลดตอนเริ่ม session ใหม่

ทดสอบ:
- `scripts/skills.test.mjs` 5 ข้อ: frontmatter + 4 หัวข้อ, ตัวชี้ `.claude/skills` ตรงกับต้นฉบับ, subagent ไม่มีเครื่องมือเขียน (Edit/Write) และเขียนกฎ "never edit", มีเจ้าของ bible คนเดียว และ approve/lock เป็นของผู้ใช้, ทุก path ที่ skill อ้างมีอยู่จริง — รวมทั้งหมด 35/35 ผ่าน
- Dry run ของ `continuity-checker` (agent แยก context, ทำตามไฟล์ `.claude/agents/continuity-checker.md`) บนสำเนา `demo-dorm9` + ep3 ร่างที่ฝังความผิด 4 จุดซึ่งสคริปต์จับไม่ได้ (`story.mjs check` ✓, `shots.mjs` ✓ no errors):
  พบครบ 4/4 พร้อม id ที่ขัด — ผมยาวทั้งที่ตัดบ๊อบ (e3), ป้าจันทร์โผล่ทั้งที่กลับบ้าน (e5), เฉลยข้อเท็จจริง `unknown` (f4), "ร่มซื้อจากเซเว่น" ขัด canon (f3) —
  และเจอเพิ่ม 3 ข้อที่ไม่ได้ฝัง (เลขช็อตของ e7/e8 ใน bible ไม่ตรง storyboard, คำสารภาพเฉลยปม t2 ครึ่งๆ, สำนวนพูดไม่ตรง `voice`); ไม่แก้ไฟล์ใด (ตรวจด้วย `cmp`)
- จาก dry run แก้คำสั่ง 1 จุด: agent บอกว่าแก้ event ของตอน draft "ต้องเขียน proposal" ซึ่งเกินกฎ — เพิ่มว่า draft แก้ตรงผ่าน `story-memory`, เฉพาะ canon ที่ต้อง proposal
- `visual-reviewer` ยังไม่ได้ dry run (การตรวจภาพแบบเดียวกันทำด้วยมือมาแล้วใน M3–M5)
