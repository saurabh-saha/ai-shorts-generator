"""Contact sheet + stats for a rendered Short:  python3 scripts/contact-sheet.py <topic>"""
import json, re, subprocess, sys
topic = sys.argv[1]
beats = json.load(open(f"data/{topic}.json"))["beats"]
mp4 = f"out/{topic}.mp4"
t, frames = 0.0, []
for b in beats:
    for f in ([0.8] if b["id"] == "close" else [0.45, 0.93]):
        frames.append(round(t + b["duration"] * f, 2))
    t += b["duration"]
files = []
for i, ts in enumerate(frames):
    out = f"out/frames/{topic}_{i}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ts), "-i", mp4, "-frames:v", "1", "-vf", "scale=160:-1", out], check=True)
    files.append(out)
cmd = ["ffmpeg", "-v", "error", "-y"]
for f in files:
    cmd += ["-i", f]
cmd += ["-filter_complex", f"hstack={len(files)}", f"out/frames/{topic}_sheet.png"]
subprocess.run(cmd, check=True)
dur = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).decode().strip()
subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-i", mp4, "-vn", "-af",
                "asetnsamples=n=48000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level:file=/tmp/peaks.txt",
                "-f", "null", "-"], check=True)
peaks = [float(m.group(1)) for l in open("/tmp/peaks.txt") if (m := re.search(r"Peak_level=(-?[\d.]+)", l))]
print(f"duration {float(dur):.1f}s, max 1s peak {max(peaks):.1f} dB, sheet: out/frames/{topic}_sheet.png")
