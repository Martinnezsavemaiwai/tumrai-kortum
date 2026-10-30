"""Build EP1 video: animated stills + Kanit subtitles + synthesized soundtrack.

Usage: python build_ep1.py   ->   output/ep1.mp4
"""
import shutil
import subprocess
from pathlib import Path

from sfx import build_soundtrack

ROOT = Path(__file__).parent
IMG = ROOT / "images"
WORK = ROOT / "output" / "_work"
OUT = ROOT / "output" / "ep1.mp4"
FPS = 30
END = 109  # seconds

# (start sec, image or None for black, thai, english, red key line?, effects)
# Thai lines are broken by hand with \N at word boundaries (max ~16 chars per line).
# effects: shake=px, flicker=True, white_in=sec (fade in from white), push=zoom amount
SCENES = [
    (0, None, "อย่านับคน\\Nในรูปหมู่", "Don't count the people in the group photo.", True, {}),
    (4, "0004", "คืนวันเสาร์ที่ 31 ตุลา", "Saturday night, October 31st.", False, {}),
    (9, "0009", "กติกามีข้อเดียว", "There was only one rule.", False, {"push": 0.15}),
    (13, "0013", "ทุกคนต้องแต่งเป็นผี", "Everyone had to come as a ghost.", False, {}),
    (17, "0017", "ทุกคนมากันครบ", "Everyone showed up.", False, {"pan": True}),
    (24, "0024", "เจ็ดคนพอดี", "Exactly seven.", False, {}),
    (28, "0028", "แต่ไม่มีใครถามถึง\\Nคนที่คลุมผ้าขาว", "But no one asked about the one in the white sheet.", False, {"push": 0.18}),
    (34, "0034", "เพราะทุกคนคิดว่า\\Nมันเป็นของตกแต่ง", "Everyone thought it was a decoration.", False, {}),
    (41, "0041", "ถ่ายรูปหมู่\\Nตอนเที่ยงคืนตรง", "A group photo at exactly midnight.", False, {}),
    (46, "0046", "", "", False, {"white_in": 0.3}),
    (48, "0048", "ในรูปมีแปดคน", "There were eight people in the photo.", True, {"shake": 10}),
    (53, "0053", "\"ใครชวนมาอะ\"", "\"Who invited them?\"", False, {"push": 0.25}),
    (57, "0057", "ไม่มีใครชวน", "No one did.", False, {}),
    (61, "0101", "ชุดไม่มีซิป\\Nไม่มีรอยเย็บ", "No zipper. No seams.", False, {"push": 0.12}),
    (66, "0106", "แล้วก็ไม่มีเท้า", "And no feet.", True, {"shake": 8}),
    (70, "0110", "มันหายไปแล้ว", "It was gone.", False, {"flicker": True, "shake": 4}),
    (75, "0115", "เบลนับคนในห้อง\\Nใหม่อีกรอบ", "Bell counted everyone again.", False, {"flicker": True}),
    (80, "0120", "เจ็ดคน", "Seven.", False, {}),
    (85, "0125", "ถูกต้องตามที่นัดไว้", "Just like it was planned.", False, {}),
    (89, "0129", "แต่เบลไม่ได้\\Nนับตัวเองนะ", "But Bell didn't count herself.", True, {"push": 0.2, "shake": 5}),
    (94, "0134", "\"เธอแต่งเป็น\\Nผีอะไรมานะ\"", "\"What ghost did you come as again?\"", False, {"shake": 3}),
    (98, "0138", "", "", False, {"push": 0.15, "flicker": True}),
    (101, "0141", "", "", False, {}),
]

# (start, end, text, x, y) small on-screen labels: chat header, clock
LABELS = [
    (4, 13, "ฮาโลวีนบ้านเบล  ·  สมาชิก 7 คน", 540, 300),
    (9, 13, "แต่งเป็นผีไทยมาเท่านั้น!!", 540, 420),
    (13, 17, "21:00", 940, 140),
    (41, 46, "23:59", 940, 140),
    (85, 89, "ฮาโลวีนบ้านเบล  ·  สมาชิก 7 คน", 540, 300),
]

# Motion per subtitlegenerator.app style families: red key lines "punch" in,
# narration uses a quiet cinema fade + small lift (horror storytime).
POP = r"{\fad(90,0)\fscx85\fscy85\t(0,140,\fscx100\fscy100)}"
LIFT = r"{\fad(250,0)\blur4\t(0,300,\blur0)}"

# (start, end, text) sound tags for muted viewers, top of frame
SOUND_TAGS = [
    (13.4, 16, "[ ติ๊ง... ต่อง ]"),
    (46, 47.8, "[ แชะ! ]"),
    (70, 72, "[ ตึง!! ]"),
    (75, 80, "[ ไฟช็อต ซ่า... ]"),
    (89.5, 94, "[ ตุบ... ตุบ... ]"),
]


def ts(sec):
    return f"0:{int(sec) // 60:02d}:{sec % 60:05.2f}"


def build_ass():
    # Spacing must stay 0: libass drops stacked Thai tone marks (ที่) otherwise.
    # Kanit Bold, thick black outline + soft shadow: reads on busy backgrounds.
    # Subs sit at ~y1300, above TikTok's caption/button zone.
    head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TH,Kanit,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,8,4,2,60,60,560,0
Style: THRed,Kanit,96,&H00FFFFFF,&H00FFFFFF,&H001E1EC8,&H00000000,-1,0,0,0,100,100,0,0,3,18,0,2,60,60,560,0
Style: EN,Kanit Medium,42,&H00D8D8D8,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,4,2,2,80,80,490,0
Style: Label,Kanit Medium,46,&H00FFFFFF,&H00FFFFFF,&HA0000000,&H00000000,0,0,0,0,100,100,0,0,3,14,0,5,0,0,0,0
Style: Big,Kanit,150,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,8,6,5,0,0,0,0
Style: Q,Kanit,84,&H0040D8FF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,7,4,5,0,0,0,0
Style: BtnGreen,Kanit,88,&H00FFFFFF,&H00FFFFFF,&H0050A840,&H00000000,-1,0,0,0,100,100,0,0,3,32,0,5,0,0,0,0
Style: BtnRed,Kanit,88,&H00FFFFFF,&H00FFFFFF,&H001E1EC8,&H00000000,-1,0,0,0,100,100,0,0,3,32,0,5,0,0,0,0
Style: Hint,Kanit Medium,48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,5,2,5,0,0,0,0
Style: Tag,Kanit Medium,50,&H0060E0FF,&H00FFFFFF,&H00000000,&H96000000,0,-1,0,0,100,100,0,0,1,5,2,5,0,0,0,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for i, (start, _, th, en, red, _fx) in enumerate(SCENES):
        end = SCENES[i + 1][0] if i + 1 < len(SCENES) else END
        if th:
            style, motion = ("THRed", POP) if red else ("TH", LIFT)
            ev.append(f"Dialogue: 1,{ts(start + 0.15)},{ts(end)},{style},,0,0,0,,{motion}{th}")
        if en:
            ev.append(f"Dialogue: 1,{ts(start + 0.3)},{ts(end)},EN,,0,0,0,,{{\\fad(150,0)}}{en}")
    for start, end, text, x, y in LABELS:
        ev.append(f"Dialogue: 1,{ts(start)},{ts(end)},Label,,0,0,0,,{{\\pos({x},{y})\\fad(120,0)}}{text}")
    for start, end, text in SOUND_TAGS:
        ev.append(f"Dialogue: 1,{ts(start)},{ts(end)},Tag,,0,0,0,,{{\\pos(540,230)\\fad(80,200)}}{text}")
    c0 = SCENES[-1][0]
    ev += [
        f"Dialogue: 2,{ts(c0)},{ts(END)},Big,,0,0,0,,{{\\pos(540,620)}}{POP}ตอนที่ 2",
        f"Dialogue: 2,{ts(c0 + 0.6)},{ts(END)},Q,,0,0,0,,{{\\pos(540,800)}}{POP}คุณจะถอดหน้ากากไหม?",
        f"Dialogue: 2,{ts(c0 + 1.2)},{ts(END)},BtnGreen,,0,0,0,,{{\\pos(320,1060)}}{POP}  ถอด  ",
        f"Dialogue: 2,{ts(c0 + 1.2)},{ts(END)},BtnRed,,0,0,0,,{{\\pos(760,1060)}}{POP} ไม่ถอด ",
        f"Dialogue: 2,{ts(c0 + 2)},{ts(END)},Hint,,0,0,0,,{{\\pos(540,1260)\\fad(300,0)}}คอมเมนต์ว่าคุณเลือกทางไหน",
    ]
    return head + "\n".join(ev) + "\n"


def scene_filter(frames, fx):
    """Push-in/pan, optional handheld shake, light flicker, grain and vignette."""
    z = fx.get("push", 0.08)
    if fx.get("pan"):
        move = f"zoompan=z=1.12:x='(iw-iw/zoom)*on/{frames}':y='ih/2-ih/zoom/2'"
    else:
        move = f"zoompan=z='1+{z}*on/{frames}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2'"
    vf = [f"scale=2160:3870,crop=2160:3840,{move}:d={frames}:s=1160x2062:fps={FPS}"]
    s = fx.get("shake", 0)
    vf.append(f"crop=1080:1920:x='40+{s}*sin(n*1.9)*sin(n*0.37)':y='71+{s}*sin(n*2.3+1)*sin(n*0.29)'")
    if fx.get("flicker"):
        # mostly lit, random-looking short dropouts
        vf.append("hue=b='if(gt(sin(t*23)*sin(t*7.3)+sin(t*3.1),1.1),-5,0)'")
    if "white_in" in fx:
        vf.append(f"fade=in:st=0:d={fx['white_in']}:color=white")
    vf += ["vignette=PI/4.5", "noise=alls=9:allf=t"]
    return ",".join(vf)


def run(args):
    subprocess.run(args, check=True, cwd=WORK)


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    for f in (ROOT / "fonts").glob("*.ttf"):
        shutil.copy(f, WORK / f.name)

    clips = []
    for i, (start, img, *_mid, fx) in enumerate(SCENES):
        dur = (SCENES[i + 1][0] if i + 1 < len(SCENES) else END) - start
        frames = dur * FPS
        clip = f"s{i:02d}.mp4"
        common = ["-r", str(FPS), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-y", clip]
        if img is None:
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "lavfi",
                 "-i", f"color=black:s=1080x1920:d={dur}", "-vf", "noise=alls=9:allf=t", *common])
        else:
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(IMG / f"ep1-{img}.jpg"),
                 "-vf", scene_filter(frames, fx), "-frames:v", str(frames), *common])
        clips.append(clip)

    (WORK / "list.txt").write_text("".join(f"file '{c}'\n" for c in clips), encoding="utf-8")
    (WORK / "ep1.ass").write_text(build_ass(), encoding="utf-8")
    build_soundtrack(WORK / "ep1_audio.wav", [s[0] for s in SCENES], ROOT / "voice")  # voice/ from tts_ep1.py
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "list.txt",
         "-i", "ep1_audio.wav", "-vf", "ass=ep1.ass:fontsdir=.:shaping=complex",  # complex = HarfBuzz; stacks Thai tone marks (ที่) "-c:v", "libx264", "-crf", "18",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
         "-y", str(OUT)])
    print("done:", OUT)


if __name__ == "__main__":
    main()
