# Sound

## Voice

- `scripts/tts.py <episode>` reads `SHOTS` from the episode's `score.js` and writes `<episode>/voice/<start>.mp3` (start = shot start in seconds, zero-padded to 3 digits). Existing files are skipped — delete one to regenerate it.
- ElevenLabs model `eleven_v3` (the one that speaks Thai). Audio tags per line via `TAGS` / `--tag`: `[whispers]`, `[scared]`, `[nervous]`.
- Free plan: ~10k characters/month, ~21 premade voices via API (Voice Library voices are not available to free API users), **non-commercial**. A key without `voices_read` cannot list voices but can still speak.
- Different characters → different voice IDs: put a `VOICE` map in `score.js` and give each `SHOTS` row a `voice`; `tts.py` sends it per line (`ELEVENLABS_VOICE_ID` / George for the narrator).
- Free plan works with the current **default** voices, e.g. George `JBFqnCBsd6RMkjVDRZzb` (narrator), Sarah `EXAVITQu4vr4xnSDxMaL` (young woman), Liam `TX3LPaxmHKxFdv7VOQHJ` (young man), Laura `FGY2WhTYpPnrIDTdsKH5`, Charlie `IKne3meq5aSn9XLyUdCD`, Callum `N2lVS1w4EtoT3dr4eOWO`, Lily `pFZP5JQG7iQjIQuC4Bku`, Brian `nPczCjzI2devNBz1zQrb`. Older names like Rachel/Adam are now Library voices → HTTP 402 on the free plan.
- After generating, check every line fits its shot (`duration < shot length − VO_LAG`).
- Local/open alternative for extra voices: PyThaiTTS + KhanomTan (check the model licence before monetised use).

## song.js recipe

- Bed: `I.padNote` low detuned drone (A1, A#1, E2), `I.strings` high tension from the odd-thing shot on.
- Party: `I.musicBox` lullaby that slowly detunes; start it after any nearby hit.
- Events from `ev`: `I.pop`, `I.ting`, `I.bell`, `I.woodTick`, `I.tvClick` (shutter), `I.noiseSweep` (whooshes), `I.subBoom` + `I.thud` (hits), `I.heartbeat`, `I.pulse` hum gated by `SCORE.lightOn(t)`.
- VO: `MIX.loadAudio(file, { at: t + VO_LAG, length: DURATION }).mixInto(vo, 1)`; `MIX.duck([beds], vo, { depth: 0.55 })`.
- Gain table: voice on top (`vo: 2.0`), music box ~0.45, drone ~0.7, hits ~0.6. Master `LUFS=-14`.
- Measure: `STEMS=1 node song.js && node engine/tools/levels.js out/stem-*.wav`.

## Never

- Pull sounds from myinstants / GIPHY / TikTok rips into a video.
- Put a hit on top of a spoken word.
