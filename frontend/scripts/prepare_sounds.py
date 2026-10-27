"""Prepares the team's ambient recordings for the web player.

Source:  SOUND FOR AI BOOK/<Thai place name>/<layer>.mp3   (left untouched)
Output:  frontend/public/sounds/<preset_id>/<layer>.mp3

For every file:
  * keep at most MAX_SECONDS (long beds cost a lot of memory once decoded),
  * make it loop seamlessly: the last CROSSFADE seconds are cross-faded into the
    first CROSSFADE seconds, and the output starts right after that head,
  * mono (the player pans each layer left/right itself) at 44.1 kHz,
  * two-pass EBU R128 loudness normalisation so layers start at similar levels.

Usage (from the repo root):  python frontend/scripts/prepare_sounds.py [preset_id ...]
(no preset ids = process every place)
Requires ffmpeg/ffprobe on PATH.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "SOUND FOR AI BOOK"
OUTPUT = ROOT / "frontend" / "public" / "sounds"

PLACE_TO_PRESET = {
    "คาเฟ่ยามเช้า": "cafe",
    "ห้องสมุดเงียบ": "library",
    "บนรถไฟ": "train",
    "ใกล้น้ำตก": "waterfall",
    "ห้องนั่งเล่นมีเตาผิง": "fireplace",
    "ริมทะเล ชายหาด": "beach",
    "ในป่า แคมป์ปิ้ง": "forest",
    "ร้านหนังสือเก่า": "bookshop",
    "สวนสาธารณะยามบ่าย": "park",
    "คืนฝนตกในห้อง": "rainynight",
}

MAX_SECONDS = 90.0
CROSSFADE = 3.0
TARGET = {"I": -20.0, "TP": -1.5, "LRA": 11.0}


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True, encoding="utf-8", errors="replace")


def duration(path: Path) -> float:
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out.stdout.strip())


def loop_filter(length: float) -> str:
    """Seamless loop of the first `length` seconds: body = [x, L-x], then the tail
    [L-x, L] cross-faded into the head [0, x]. Playback wraps from that head
    into the body, which is exactly where the original audio continues."""
    x = min(CROSSFADE, length / 6)
    return (
        f"[0:a]atrim=0:{length:.3f},aformat=channel_layouts=mono,aresample=44100,asplit=3[a][b][c];"
        f"[a]atrim={x:.3f}:{length - x:.3f},asetpts=PTS-STARTPTS[body];"
        f"[b]atrim={length - x:.3f}:{length:.3f},asetpts=PTS-STARTPTS[tail];"
        f"[c]atrim=0:{x:.3f},asetpts=PTS-STARTPTS[head];"
        f"[tail][head]acrossfade=d={x:.3f}:c1=tri:c2=tri[xf];"
        f"[body][xf]concat=n=2:v=0:a=1[loop]"
    )


def process(src: Path, dst: Path) -> None:
    length = min(duration(src), MAX_SECONDS)
    base = loop_filter(length)
    target = f"I={TARGET['I']}:TP={TARGET['TP']}:LRA={TARGET['LRA']}"

    # Pass 1: measure loudness of the looped audio.
    measure = run([
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(src),
        "-filter_complex", f"{base};[loop]loudnorm={target}:print_format=json[out]",
        "-map", "[out]", "-f", "null", "-",
    ])
    stats = json.loads(measure.stderr[measure.stderr.rindex("{"):measure.stderr.rindex("}") + 1])

    # Pass 2: apply linear gain so the texture of the recording is not changed.
    norm = (
        f"loudnorm={target}:linear=true:"
        f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
        f"offset={stats['target_offset']}"
    )
    dst.parent.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg", "-hide_banner", "-y", "-i", str(src),
        "-filter_complex", f"{base};[loop]{norm},aresample=44100[out]",
        "-map", "[out]", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", str(dst),
    ])


def main() -> int:
    if not SOURCE.is_dir():
        print(f"Source folder not found: {SOURCE}")
        return 1
    only = set(sys.argv[1:])  # optional: limit to these preset ids
    count = 0
    for place_dir in sorted(SOURCE.iterdir()):
        preset = PLACE_TO_PRESET.get(place_dir.name)
        if not preset:
            print(f"skip (unknown place): {place_dir.name}")
            continue
        if only and preset not in only:
            continue
        for src in sorted(place_dir.glob("*.mp3")):
            dst = OUTPUT / preset / src.name
            process(src, dst)
            count += 1
            print(f"{preset}/{src.name}: {duration(dst):.1f}s")
    print(f"done: {count} files -> {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
