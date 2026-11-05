"""Thai voiceover for a TumraiKortum episode via ElevenLabs (eleven_v3).

Reads SHOTS from <episode>/score.js (needs node) and writes <episode>/voice/<start>.mp3,
skipping files that already exist, plus <start>.json: the start time of each subtitle character from
ElevenLabs' alignment (/with-timestamps), so Kit.voiceTimes can light up words as they are said.
Key: ELEVENLABS_API_KEY in .env (repo root or episode), optional ELEVENLABS_VOICE_ID. Never print or commit the key.

    python tts.py <episode>            generate missing lines
    python tts.py <episode> --dry      show what would be sent, no API calls
    python tts.py --voices             list voices (needs the key's voices_read permission)
    python tts.py --selftest           check the alignment code (no API calls)
"""
import base64
import json
import math
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.elevenlabs.io/v1"
MODEL = "eleven_v3"  # the ElevenLabs model that speaks Thai; understands [whispers] etc.
DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"  # premade "George", usable on the free plan


def load_env(*dirs):
    for d in dirs:
        f = Path(d) / ".env"
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                if "=" in line and not line.lstrip().startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("No ELEVENLABS_API_KEY: put it in .env at the repo root")
    return key, os.environ.get("ELEVENLABS_VOICE_ID", DEFAULT_VOICE)


def call(path, key, body=None):
    req = urllib.request.Request(f"{API}{path}", headers={"xi-api-key": key, "Content-Type": "application/json"},
                                 data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code} on {path}: {e.read().decode(errors='replace')[:400]}")


def shots(ep):
    """SHOTS from score.js: [{t, th, tag?, voice?, say?}] (say = how to pronounce th when the subtitle has digits/abbreviations) for every shot with a Thai line."""
    js = ("const s=require('./score');console.log(JSON.stringify(s.SHOTS.map(x=>({t:x.t,th:x.th,tag:x.tag||'',voice:x.voice||'',"
          "say:x.say||'',take:x.take||'',speed:x.speed??null}))))")
    out = subprocess.run(["node", "-e", js], cwd=ep, capture_output=True, text=True, check=True).stdout
    return [s for s in json.loads(out) if s["th"]]


TAKES = {"creative": 0.0, "natural": 0.5, "robust": 1.0}  # eleven_v3's stability presets: wide emotion … steady


def settings(s):
    """voice_settings for one line from its performance cues (take, speed); exits on a bad cue before any credit is spent."""
    take, speed = s.get("take") or "natural", s.get("speed")
    if take not in TAKES:
        sys.exit(f"line at {s['t']}s: take {take!r} is not one of {', '.join(TAKES)}")
    if speed is not None and not (isinstance(speed, (int, float)) and 0.7 <= speed <= 1.2):
        sys.exit(f"line at {s['t']}s: speed {speed!r} must be 0.7–1.2")
    return {"stability": TAKES[take], "similarity_boost": 0.8, **({"speed": speed} if speed is not None else {})}


def shown(th):
    """The subtitle text as Kit.subtitles counts characters: no line breaks, no *keyword* stars."""
    return th.replace("\n", "").replace("*", "")


def char_times(text, chars, starts, ends):
    """Start time of every character of `text` (+ the end of the last one) from ElevenLabs' alignment.

    The alignment covers what was sent (a [tag] first, quotes dropped), so each subtitle character is looked
    for a few characters ahead; one that was not spoken (a quote) takes the next spoken one's time.
    None when the alignment does not fit the text (the subtitles then fall back to an even spread).
    """
    if not text or not chars or len(starts) != len(chars):
        return None
    spoken = "".join(chars)
    j = spoken.index("]") + 1 if spoken.startswith("[") and "]" in spoken else 0  # skip the [tag]
    out, missed = [], 0
    for c in text:
        k = next((k for k in range(j, min(j + 4, len(chars))) if chars[k] == c), None)
        if k is None:
            missed += 1
            out.append(starts[min(j, len(starts) - 1)])
        else:
            out.append(starts[k])
            j = k + 1
    if missed > max(2, len(text) * 0.15):
        return None
    out.append(ends[j - 1] if j and len(ends) >= j else out[-1])
    return [round(x, 3) for x in out]


def selftest():
    # 'a"b' said as '[whispers] ab': the quote takes b's time; the end is b's end
    chars = list("[whispers] ab")
    st = [i * 0.1 for i in range(len(chars))]
    assert char_times('a"b', chars, st, [x + 0.1 for x in st]) == [1.1, 1.2, 1.2, 1.3], char_times('a"b', chars, st, st)
    assert char_times("xyz", list("abc"), [0, 1, 2], [1, 2, 3]) is None  # nothing matches
    assert shown("*คำ*\nสอง") == "คำสอง"
    assert settings({"t": 1}) == {"stability": 0.5, "similarity_boost": 0.8}
    assert settings({"t": 1, "take": "creative", "speed": 0.85}) == {"stability": 0.0, "similarity_boost": 0.8, "speed": 0.85}
    for bad in ({"take": "loud"}, {"speed": 1.5}, {"speed": "slow"}):
        try:
            settings({"t": 1, **bad})
            raise AssertionError(f"{bad} should be refused")
        except SystemExit:
            pass
    print("tts.py selftest ok")


def main():
    if "--selftest" in sys.argv:
        return selftest()
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    root = Path(__file__).resolve().parents[4]  # repo root (.agents/skills/tumraikortum/scripts)
    if "--voices" in sys.argv:
        key, _ = load_env(root, *args)
        for v in json.loads(call("/voices", key))["voices"]:
            print(v["voice_id"], "|", v["name"], "|", v.get("labels", {}))
        return
    if not args:
        sys.exit(__doc__)
    ep = Path(args[0]).resolve()
    lines = shots(ep)
    out = ep / "voice"
    # half seconds round UP, like JavaScript's Math.round in song.js / shots.mjs / qa.mjs (Python's round(20.5) is 20)
    name = lambda s: out / f"{math.floor(s['t'] + 0.5):03d}.mp3"
    said = lambda s: f"{s['tag']} {(s['say'] or s['th']).replace(chr(10), '').replace(chr(34), '').replace('*', '')}".strip()  # *word* = a highlighted keyword on screen only
    seen = {}
    for s in lines:  # files are named by the rounded second: two lines in the same second would overwrite each other
        if name(s).name in seen:
            sys.exit(f"lines at {seen[name(s).name]}s and {s['t']}s both map to voice/{name(s).name}: move one at least 1 s away")
        seen[name(s).name] = s["t"]
    todo = [s for s in lines if not name(s).exists()]
    for s in lines:
        settings(s)  # every cue checked up front, cached lines too
    if "--dry" in sys.argv:  # also the cost check before a long episode: ElevenLabs bills characters
        for s in lines:
            cue = " ".join(x for x in (s["take"], f"x{s['speed']}" if s["speed"] is not None else "") if x)
            print(f"{s['t']:>7}  {'cached ' if name(s).exists() else 'NEW    '}{said(s)!r}{f'  ({cue})' if cue else ''}")
        new = sum(len(said(s)) for s in todo)
        print(f"\n{len(lines)} lines, {sum(len(said(s)) for s in lines)} characters in all; to generate now: {len(todo)} lines, {new} characters"
              f" (free plan ≈ 10,000 / month)")
        return
    key, voice = load_env(root, ep)
    out.mkdir(exist_ok=True)
    for s in todo:
        f = name(s)
        text = said(s)
        body = {"text": text, "model_id": MODEL, "voice_settings": settings(s)}
        r = json.loads(call(f"/text-to-speech/{s['voice'] or voice}/with-timestamps?output_format=mp3_44100_128", key, body))
        f.write_bytes(base64.b64decode(r["audio_base64"]))
        a = r.get("alignment") or {}
        # word timing for the subtitles (Kit.voiceTimes); only when the voice says the subtitle's own text
        times = None if s["say"] else char_times(shown(s["th"]), a.get("characters") or [],
                                                 a.get("character_start_times_seconds") or [], a.get("character_end_times_seconds") or [])
        if times:
            f.with_suffix(".json").write_text(json.dumps({"times": times}), encoding="utf-8")
        print("ok", f.name, text, "" if times else "(no word timing: subtitles spread evenly)")


if __name__ == "__main__":
    main()
