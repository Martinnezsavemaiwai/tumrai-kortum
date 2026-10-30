"""Synthesized horror soundtrack for EP1 (no samples, no copyright issues).

build_soundtrack(path) writes a 44.1 kHz stereo WAV matching the EP1 timeline.
Run directly to preview: python sfx.py  ->  output/_work/ep1_audio.wav
"""
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
END = 109
rng = np.random.default_rng(31)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, attack=0.005, decay=0.3):
    t = np.arange(n) / SR
    return np.minimum(t / attack, 1) * np.exp(-t / decay)


def lowpass(x, hz):
    return sosfilt(butter(2, hz, "low", fs=SR, output="sos"), x)


def bandpass(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def bell(freq, dur=1.5, decay=0.6):
    t = t_axis(dur)
    tone = sum(a * np.sin(2 * np.pi * freq * m * t) for m, a in [(1, 1), (2.76, 0.4), (5.4, 0.2)])
    return tone * env(len(t), 0.002, decay)


def ping():  # chat notification
    a = bell(1320, 0.25, 0.08)
    b = bell(1760, 0.35, 0.1)
    out = np.zeros(int(0.45 * SR))
    out[: len(a)] += a
    out[int(0.1 * SR): int(0.1 * SR) + len(b)] += b
    return out * 0.5


def pop():  # chat bubble
    t = t_axis(0.08)
    return np.sin(2 * np.pi * (900 - 5000 * t) * t) * env(len(t), 0.001, 0.02) * 0.6


def doorbell():
    ding, dong = bell(660, 1.6, 0.7), bell(523, 2.2, 0.9)
    out = np.zeros(int(3.0 * SR))
    out[: len(ding)] += ding
    out[int(0.6 * SR): int(0.6 * SR) + len(dong)] += dong
    return out * 0.5


def whoosh(dur=0.5):
    n = int(dur * SR)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return bandpass(rng.standard_normal(n), 300, 3000) * shape * 0.25


def boom():  # hit under red key lines
    t = t_axis(2.0)
    freq = 70 * np.exp(-t * 1.5) + 30
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(len(t), 0.003, 0.7)
    crack = lowpass(rng.standard_normal(len(t)), 800) * env(len(t), 0.001, 0.08)
    return (body + 0.6 * crack) * 0.9


def tick():
    t = t_axis(0.03)
    return bandpass(rng.standard_normal(len(t)), 2000, 6000) * env(len(t), 0.0005, 0.005) * 0.6


def beep(freq=2000):
    t = t_axis(0.09)
    return np.sin(2 * np.pi * freq * t) * env(len(t), 0.002, 0.05) * 0.25


def shutter():
    n = int(0.12 * SR)
    clicks = np.zeros(n)
    for at in (0, int(0.06 * SR)):
        c = bandpass(rng.standard_normal(int(0.02 * SR)), 1500, 8000) * env(int(0.02 * SR), 0.0005, 0.004)
        clicks[at: at + len(c)] += c
    t = t_axis(1.5)
    whine = np.sin(2 * np.pi * (3000 + 3000 * t) * t) * env(len(t), 0.01, 0.4) * 0.08
    out = np.zeros(len(whine))
    out[:n] += clicks
    return out + whine


def sting():  # dissonant scare chord
    t = t_axis(3.0)
    tone = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (311, 330, 466, 494)) / 4
    return lowpass(tone, 2500) * env(len(t), 0.01, 1.0) * 0.35


def buzz(dur, pattern_hz=7):
    t = t_axis(dur)
    hum = lowpass(np.sign(np.sin(2 * np.pi * 100 * t)), 1200) * 0.12
    gate = (np.sin(2 * np.pi * pattern_hz * t + 3 * np.sin(2 * np.pi * 1.3 * t)) > -0.2).astype(float)
    return hum * gate


def heartbeat(dur, bpm_start=70, bpm_end=130):
    out = np.zeros(int(dur * SR))
    t, pos = 0.0, 0
    while t < dur - 0.5:
        bpm = bpm_start + (bpm_end - bpm_start) * t / dur
        for off, amp in ((0, 1.0), (0.18, 0.7)):
            tt = t_axis(0.25)
            thump = np.sin(2 * np.pi * 50 * tt) * env(len(tt), 0.004, 0.06) * amp
            i = int((t + off) * SR)
            out[i: i + len(thump)] += thump[: len(out) - i]
        t += 60 / bpm
    return out * 0.8


def music_box(dur):  # creepy lullaby under the party
    notes = [76, 79, 81, 79, 76, 74, 72, 74, 76, 76, 74, 71]
    out = np.zeros(int(dur * SR))
    step = 0.5
    for i in range(int(dur / step)):
        f = 440 * 2 ** ((notes[i % len(notes)] - 69) / 12)
        b = bell(f, 1.2, 0.35) * 0.18
        s = int(i * step * SR)
        out[s: s + len(b)] += b[: len(out) - s]
    return out


def drone(dur):
    t = t_axis(dur)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)
    tone = np.sin(2 * np.pi * 55 * t) + 0.7 * np.sin(2 * np.pi * 58.3 * t) + 0.3 * np.sin(2 * np.pi * 110.5 * t)
    wind = lowpass(rng.standard_normal(len(t)), 400) * 0.6
    return (tone * 0.12 + wind * 0.15) * (0.6 + 0.4 * lfo)


def riser(dur):
    t = t_axis(dur)
    noise = bandpass(rng.standard_normal(len(t)), 500, 4000)
    return noise * (t / dur) ** 2 * 0.25


def voiceover(voice_dir):
    """Place voice/ep1-<start>.mp3 lines on the timeline (0.3 s after each scene starts)."""
    import subprocess
    files = sorted(Path(voice_dir).glob("ep1-*.mp3"))
    if not files:
        return None
    vo = np.zeros(END * SR)
    for f in files:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                             capture_output=True, check=True).stdout
        x = np.frombuffer(raw, dtype=np.float32)
        i = int((int(f.stem.split("-")[1]) + 0.3) * SR)
        n = min(len(x), len(vo) - i)
        vo[i: i + n] += x[:n]
    return vo


def build_soundtrack(path, scene_starts, voice_dir=None):
    mix = np.zeros(END * SR)

    def put(sound, at, gain=1.0):
        i = int(at * SR)
        n = min(len(sound), len(mix) - i)
        mix[i: i + n] += sound[:n] * gain

    def bed(sound, start, end, gain=1.0, fade=1.0):
        seg = sound[: int((end - start) * SR)].copy()
        f = int(fade * SR)
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        put(seg, start, gain)

    # beds: drone everywhere except the silent beat after the flash; music box during the party
    bed(drone(46), 0, 46, 0.9)
    bed(music_box(28), 13, 41, 0.9, 1.5)
    bed(drone(END - 48), 48, END, 1.3, 0.5)
    bed(buzz(5), 75, 80, 1.0, 0.1)
    bed(heartbeat(12), 89, 101, 1.0, 0.3)
    bed(riser(3), 98, 101, 1.0, 0.1)

    for s in scene_starts[1:]:
        put(whoosh(0.5), s - 0.25, 0.8)
    for at in (0, 48, 66, 89):
        put(boom(), at)
    put(ping(), 4.3)
    put(pop(), 9.4)
    put(doorbell(), 13.5)
    put(ping(), 85.3)
    for k in range(5):  # clock ticks + self-timer beeps speeding up
        put(tick(), 41 + k)
    for k, at in enumerate(np.cumsum([0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2])):
        put(beep(), 41.5 + at)
    put(shutter(), 46)
    put(sting(), 70)
    put(boom(), 101, 0.6)

    vo = voiceover(voice_dir) if voice_dir else None
    if vo is not None:
        # duck the music/SFX ~7 dB under the narration
        duck = lowpass((np.abs(vo) > 0.01).astype(float), 3)
        mix = mix * (1 - 0.55 * np.clip(duck * 4, 0, 1)) + vo * 1.6

    mix /= max(1.0, np.abs(mix).max() / 0.9)
    stereo = np.stack([mix, np.roll(mix, 220)], axis=1)  # tiny delay = width
    wavfile.write(path, SR, (stereo * 32767).astype(np.int16))


if __name__ == "__main__":
    from build_ep1 import SCENES

    out = Path(__file__).parent / "output" / "_work" / "ep1_audio.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    build_soundtrack(out, [s[0] for s in SCENES])
    print("done:", out)
