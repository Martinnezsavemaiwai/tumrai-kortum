"""Thai voiceover for a TumraiKortum episode via ElevenLabs (eleven_v3).

Reads SHOTS from <episode>/score.js (needs node) and writes <episode>/voice/<start>.mp3,
skipping files that already exist. Key: ELEVENLABS_API_KEY in .env (repo root or episode),
optional ELEVENLABS_VOICE_ID. Never print or commit the key.

    python tts.py <episode>            generate missing lines
    python tts.py <episode> --dry      show what would be sent, no API calls
    python tts.py --voices             list voices (needs the key's voices_read permission)
"""
import json
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
    """SHOTS from score.js: [{t, th, tag?, voice?}] for every shot with a Thai line."""
    js = "const s=require('./score');console.log(JSON.stringify(s.SHOTS.map(x=>({t:x.t,th:x.th,tag:x.tag||'',voice:x.voice||''}))))"
    out = subprocess.run(["node", "-e", js], cwd=ep, capture_output=True, text=True, check=True).stdout
    return [s for s in json.loads(out) if s["th"]]


def main():
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
    if "--dry" in sys.argv:
        for s in lines:
            print(f"{s['t']:>6}  {s['tag']} {s['th']!r}")
        return
    key, voice = load_env(root, ep)
    out = ep / "voice"
    out.mkdir(exist_ok=True)
    for s in lines:
        f = out / f"{int(round(s['t'])):03d}.mp3"
        if f.exists():
            continue
        text = f"{s['tag']} {s['th'].replace(chr(10), '').replace(chr(34), '')}".strip()
        body = {"text": text, "model_id": MODEL, "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
        f.write_bytes(call(f"/text-to-speech/{s['voice'] or voice}?output_format=mp3_44100_128", key, body))
        print("ok", f.name, text)


if __name__ == "__main__":
    main()
