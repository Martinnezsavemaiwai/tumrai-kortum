"""Thai voiceover for EP1 via ElevenLabs (free tier works: ~400 chars of ~10k/month).

Setup (once): put your key in a file named `.env` next to this script:
    ELEVENLABS_API_KEY=sk_...
Optional in the same file:
    ELEVENLABS_VOICE_ID=...   (default: George, premade)

Usage:
    python tts_ep1.py --voices   list voices you can use
    python tts_ep1.py            generate voice/ep1-<start>.mp3 for every line (cached)
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

from build_ep1 import SCENES

ROOT = Path(__file__).parent
OUT = ROOT / "voice"
API = "https://api.elevenlabs.io/v1"
MODEL = "eleven_v3"  # v3 is the ElevenLabs model that speaks Thai; also understands [whispers] tags

# Delivery tags per line start (eleven_v3 audio tags); default is a low, tense narration
TAGS = {0: "[whispers]", 48: "[nervous]", 66: "[whispers]", 89: "[whispers]", 94: "[scared]"}


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("No ELEVENLABS_API_KEY: add it to .env (see top of this file)")
    return key, os.environ.get("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")


def call(path, key, body=None):
    req = urllib.request.Request(f"{API}{path}", headers={"xi-api-key": key, "Content-Type": "application/json"},
                                 data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code} on {path}: {e.read().decode(errors='replace')[:500]}")


def lines():
    """(start, thai text) for every scene that has narration."""
    for start, _img, th, *_ in SCENES:
        if th:
            yield start, th.replace("\\N", "").replace('"', "")


def main():
    key, voice = load_env()
    if "--voices" in sys.argv:
        for v in json.loads(call("/voices", key))["voices"]:
            print(v["voice_id"], "|", v["name"], "|", v.get("labels", {}))
        return
    OUT.mkdir(exist_ok=True)
    for start, text in lines():
        f = OUT / f"ep1-{start:03d}.mp3"
        if f.exists():
            continue
        body = {"text": f"{TAGS.get(start, '')} {text}".strip(), "model_id": MODEL,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
        f.write_bytes(call(f"/text-to-speech/{voice}?output_format=mp3_44100_128", key, body))
        print("ok", f.name, text)


if __name__ == "__main__":
    main()
