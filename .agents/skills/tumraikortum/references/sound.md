# Sound

## Sound intent

Plan sound with the picture, before song.js. In STORY.md write a short **Sound intent** (a few lines, not a schema):

- **job**: what the sound should make the viewer feel or understand (dread builds, the joke lands, the idea feels clear and calm).
- **foreground**: what must be heard first, usually the voice; say when it is something else (a silent reveal, a sung line).
- **palette / pulse**: the instruments or textures and whether there is a beat. The genre row is a list of options, not a requirement.
- **entry / exit / quiet**: where music enters, drops out and ends; which passages are voice-only, ambience-only or silent.
- **avoid**: what would fight this film (bright ticks under fast speech, a busy beat under a sad turn, a pun sting on every line).

In STORYBOARD.md the SFX cell names a cue **and its purpose and timing**, e.g. `ting · marks the number · on the word end`, `whoosh · act change · tail ≤ 0.4 s, clear of next line`, `— (quiet: let the line land)`. An empty or `—` cell is a valid choice.

- Decoration (a pop per sticker, a ting per word, a whoosh per cut) is optional. Add it where it helps the viewer follow or adds the genre's energy; leave it out where it repeats, crowds speech or competes with the line. An exaggerated or teaching cue is fine when you can say what it does.
- Music-free, voice-only and ambience-only passages are allowed in every genre. Purposeful silence usually removes layers but can keep a faint room tone or bed so it does not read as a dropout; animation without a room does not need room tone.

## Voice

- `scripts/tts.py <episode>` reads `SHOTS` from the episode's `score.js` and writes `<episode>/voice/<start>.mp3` (start = shot start in seconds, zero-padded to 3 digits). Existing files are skipped — delete one to regenerate it. Next to each mp3 goes `<start>.json`: ElevenLabs' character times (`/with-timestamps`, same price) for `Kit.voiceTimes`; none for a line with `say`. An mp3 made before this has no json — delete it and regenerate only if its timing matters.
- ElevenLabs model `eleven_v3` (the one that speaks Thai). It has no SSML `<break>`; it is directed per `SHOTS` row (see below).

### Directing the voice (per `SHOTS` row)

| field | values | what it does |
|---|---|---|
| `tag` | `[whispers]` `[sighs]` `[nervous]` `[scared]` `[excited]` `[sarcastic]` `[crying]` `[laughs]`, or a described voice like `[low, shaky voice]` | the delivery, sent before the line (not shown in subtitles) |
| `take` | `creative` · `natural` (default) · `robust` | stability 0 / 0.5 / 1: wide emotion and more surprises … steady and even |
| `speed` | 0.7–1.2 (default 1) | slower for dread and reveals, faster for panic and jokes |
| `…` in `th` | — | a pause inside the line; it stays in the subtitle, so word timing still works (`say` would drop the timing) |

- One delivery per line: if a line needs to turn (calm → scared), split it into two rows.
- Name the delivery, never "naturally": `[whispers]` + `speed: 0.85`, not "spooky".
- Horror: narrator `robust` for the setup (calm makes the turn land), `creative` + `[whispers]`/`[scared]` from the turn on; the after-close question `natural`, slow.
- Comedy: `creative`, `speed` 1.05–1.1, the punchline its own row after a `…`.
- Explainer / documentary: `robust`, speed 1–1.05; tags rarely.
- `tts.py --dry` prints each line's cues; a bad `take`/`speed` stops the run before any credit is spent. Changing a cue does not regenerate a cached line — delete its mp3 (+ json) first.
- Free plan: ~10k characters/month, ~21 premade voices via API (Voice Library voices are not available to free API users), **non-commercial**. A key without `voices_read` cannot list voices but can still speak.
- Different characters → different voice IDs: put a `VOICE` map in `score.js` and give each `SHOTS` row a `voice`; `tts.py` sends it per line (`ELEVENLABS_VOICE_ID` / George for the narrator).
- Free plan works with the current **default** voices, e.g. George `JBFqnCBsd6RMkjVDRZzb` (narrator), Sarah `EXAVITQu4vr4xnSDxMaL` (young woman), Liam `TX3LPaxmHKxFdv7VOQHJ` (young man), Laura `FGY2WhTYpPnrIDTdsKH5`, Charlie `IKne3meq5aSn9XLyUdCD`, Callum `N2lVS1w4EtoT3dr4eOWO`, Lily `pFZP5JQG7iQjIQuC4Bku`, Brian `nPczCjzI2devNBz1zQrb`. Older names like Rachel/Adam are now Library voices → HTTP 402 on the free plan.
- Files are named by the start rounded half-up (`20.5` → `021.mp3`, like `Math.round`); load them in song.js with `String(Math.round(s.t)).padStart(3, '0')`.
- After generating, check every line fits its shot (`duration < shot length − VO_LAG`).
- Local/open alternative for extra voices: PyThaiTTS + KhanomTan (check the model licence before monetised use).

## song.js recipe

Follow the Sound intent; the instruments below are the toolbox, not a checklist.

- Events from `ev`: `I.pop`, `I.ting`, `I.bell`, `I.woodTick`, `I.tvClick` (shutter), `I.noiseSweep` (whooshes), `I.subBoom` + `I.thud` (hits), `I.heartbeat`, `I.pulse` hum gated by `SCORE.lightOn(t)`. Genre music: engine `genres.js` or `kit/thai.js`.
- Horror recipe (only when the intent calls for it): bed `I.padNote` low detuned drone (A1, A#1, E2), `I.strings` high tension from the odd-thing shot on; party `I.musicBox` lullaby that slowly detunes, starting after any nearby hit.
- The scaffold copies the source episode's song.js (e.g. a pop on every keyword): its cues and loops are examples, not defaults — remove or rewrite each against this film's Sound intent.
- VO: `MIX.loadAudio(file, { at: t + VO_LAG, length: DURATION }).mixInto(vo, 1)`. Name the file like tts.py: `String(Math.floor(s.t + 0.5)).padStart(3, '0')` (or `require('./kit/lipsync').file(__dirname, s.t)`). Choose fixed background gain or optional ducking through Mixing below.
- Reverb: `reverb(send)` returns a **new** wet bus. Keep its level with the music bed. If ducking is needed, compute the wet bus first, duck it, then mix it; ducking the send cannot pull back tails it already made. For example: `const wet = reverb(send, { room: 0.8 }); MIX.duck([bed, wet], vo); MIX.mixdown({ bed, wet, vo }, gains)`. Without ducking, use fixed gains for both bed and wet return.
- Lip-sync: `require('./kit/lipsync').write(__dirname, SHOTS, { lag: VO_LAG, length: DURATION })` → `out/mouth.json`, one mouth track per SHOTS `who` (rows without one are `narr`: nobody's mouth). In film.js: `S.mouth = await Studio.loadJSON('out/mouth.json')` in `init()`, then `talk: Kit.talk(S.mouth, 'nok', t)` in that character's `R.draw`. A character's mouth moves only on its own lines; re-run song.js after new voice lines.

### Mixing

- Mix the voice first, then bring each other stem up under it; judge the background against the picture and the line it sits under, not solo.
- For calm, voice-led explainers, start with low, fixed music and wet-reverb gains across the passage, including short speech pauses. Preserve the notes' natural dynamics; change the bed at meaningful scene or emotional turns rather than on every phrase. The user preferred steady mix C over speech-ducked B in the 25 s audio trial; this is the project's starting preference for similar clips, not a rule for every genre.
- Set that bed against the quieter important spoken lines. The trial's music multiplier `0.45` is source-specific, not a universal gain or loudness target. Use ducking only when the low fixed bed still masks speech or the Sound intent needs more contrast; use gentle reduction and a smooth return that does not swell between words. Recheck with picture and listening before calling it clear.
- Illustrative starting gains for the horror recipe (`vo: 2.0`, music box ~0.45, drone ~0.7, hits ~0.6) depend on how loud each synth renders: use them as a first guess, not a rule.
- Watch repeated bright transients (pop, ting, tick, click) under speech and long reverb tails that carry into the next line; thin or drop them before turning the voice up. Use the existing helpers (`MIX.duck`, `MIX.gate`, `MIX.highpass`, `MIX.sidechain`, `reverb` settings) instead of new ones.
- `LUFS=-14` is the project's delivery default for the master. It says nothing about clarity or pleasantness: the same loudness can hold a clear or a masked voice.

### Measuring stems

`levels.js` needs stem files, and the env var alone does not write them: song.js must pass `stemDir` to `MIX.mixdown`, e.g.

```js
const mix = MIX.mixdown(stems, gains, { stemDir: process.env.STEMS ? path.join(__dirname, 'out') : null });
```

(The example episodes' song.js do not do this yet.) Then, in PowerShell:

```powershell
$env:STEMS = '1'; node song.js; Remove-Item Env:STEMS
node engine/tools/levels.js out/music.wav (Get-ChildItem out/stem-*.wav).FullName
```

## Audio review

Measurements (`levels.js`, `render.js verify`/`check`, cue times against VO ends) are evidence about the timeline and loudness; they are not listening. Report the two separately and never claim a sound "works", "is clear" or "is pleasant" unless someone heard it. An amplitude-threshold speech-end estimate can miss quiet final phonemes: to prove a cue clears speech, measure against the decoded VO file end (trailing silence included) or trusted word alignment.

- **Excerpts**: the hook, the densest speech, a transition or accent, the emotional turn or ending — each with the picture.
- **Preview before the full render** (no full render needed): `node song.js` → `out/music.wav`, then either `node engine/render.js preview [t]` (local server; open the printed URL in Chrome and click Play — picture and music live, re-renders the music when song.js changes; Ctrl+C stops it) or `node engine/render.js clip <from> <to>` → `out/clip_<from>-<to>.mp4`, one excerpt with sound (times as seconds or `@marker±s`).
- **A/B**: each excerpt against a version with music lower or off and fewer effects. Keep the dialogue level the same in both: change only the other layers, and do not normalize each variant to the same integrated LUFS (that moves the voice). Prefer the version where the voice and the beat read best.
- **Listening (human, when possible)**: phone speaker or mono, and headphones at modest volume.
- **Report**: list which checks were measured, which excerpts were heard and by whom on what (e.g. "user, phone speaker, hook + 0:41–0:55"); never turn a measurement into "sounds clear".
- **Handoff** (only for what nobody heard): finish the measured checks, deliver, and give the user a short list — the excerpt times with the preview/clip command, what to listen for (voice masked? a cue that repeats or grates? a tail over the next line? silence reading as a dropout?) and which cue or gain to change for each. Do not hold the rest of the work for it.

## Sources

Editorial choices above are this project's; the sources back the general ideas only.

- AES, [Dialogue intelligibility](https://aes.org/resources/audio-topics/loudness-project/dialogue-intelligibility/): matching loudness does not guarantee intelligible speech; competing sounds mask it, and processing the whole mix can affect clarity.
- iZotope, [Audio post-production workflow 101](https://www.izotope.com/community/blog/audio-post-production-workflow-101): plan sound needs alongside the picture, judge effects in their dialogue context, and edit and mix in passes.
- LA Film School, [Cinematic silence](https://www.lafilm.edu/blog/cinematic-silence/): purposeful silence usually strips layers while keeping some room tone.
- EBU, [R 128 s2](https://tech.ebu.ch/publications/r128s2): loudness guidance for delivery, separate from creative sound design.

## Never

- Pull sounds from myinstants / GIPHY / TikTok rips into a video.
- Put a hit on top of a spoken word.
