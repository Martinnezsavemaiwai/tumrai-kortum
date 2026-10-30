# Story format

## Shape (≈ 100 s)

| part | time | what happens |
|---|---|---|
| Hook | 0–4 s | black frame, a red-box rule ("อย่า…"), boom |
| Setup | 4–28 s | where/when, the rule of the night, everyone arrives; warm light, music box |
| The odd thing | 28–45 s | something nobody questions; slow pan to it, it moves a little when no one looks |
| Turn | 45–70 s | a flash/sound/discovery; hard cut + red line; cold light; questions in dialogue |
| Escalation | 70–95 s | it's gone / lights flicker / counting; the viewer realises they are part of it |
| Choice | 95–110 s | POV close moment, then "ตอนที่ N: …?" with two buttons |

## Everything is right except one thing

Write `STORY.md` first with:
- **The one wrong thing** (the twist the viewer can find on re-watch).
- **2–3 clues** placed on screen, each tied to a shot number. They must be *readable on a phone* (text ≥ 32 px, held ≥ 1.5 s).
- **Red herring**: the obvious weird thing (the white sheet) that isn't the real answer.
- **Clues reserved for each branch** of the next episode (EP1 planted: right hand only → branch B; Ton never speaks → branch A; dry windows → branch A).

## Cover (TikTok thumbnail)

- Draw it in `film.js` as `cover(ctx)` and route `t < 0` to it: `draw(ctx, t) { if (t < 0) return cover(ctx); … }`. Render with `render.js stills -1`.
- **No spoilers: show only what the first 3 seconds show.** Use the episode's opening red-box rule as the title (EP1 "อย่านับคนในรูปหมู่", EP2A "อย่ามองชายชุดของเพื่อน") over the opening picture. Never show the turn, the odd thing, clue marks (red rings, "?") or hints like "นับดีๆ".
- Same layout every episode so the profile grid reads as one series: a yellow pill "EP.n <title or branch>" at y≈330, the red-box rule in Kanit 120–128, the picture behind.
- Keep everything inside the centre 3:4 (y 240–1680 on 1080×1920) — that is all the profile grid shows.

## Rules

- Second person ("คุณ"); the viewer never sees their own face — only hands, the mask edge, a reflection.
- Max 3 hits. Each hit = red subtitle box + sub boom + camera shake + hard cut, all at the same `t`.
- One set per episode where possible; move the camera instead of cutting to unrelated pictures.
- Each shot shows one visible change (a head turns, a light dies, the sheet shifts).
- Thai lines ≤ ~16 characters per subtitle line, max 2 lines; English underneath, small.
- Sound tags (`[ ติ๊ง... ต่อง ]`) at the top for muted viewers.
- Ending buttons are the two branch names; the caption asks people to comment their choice.
