"""Render ONE slide (beat) of a topic as a short preview video, with a slower voice.

    python3 scripts/preview-beat.py <topic> <beat-id> [rate]

Writes out/preview.mp4. The topic's own JSON is not touched.
"""
import json, os, subprocess, sys
topic, beat_id = sys.argv[1], sys.argv[2]
rate = sys.argv[3] if len(sys.argv) > 3 else "150"
d = json.load(open(f"data/{topic}.json"))
beat = next(b for b in d["beats"] if b["id"] == beat_id)
beat = {k: v for k, v in beat.items() if k not in ("voice", "duration")}
json.dump({"title": d["title"], "subtitle": d.get("subtitle", ""), "audio": None, "beats": [beat]},
          open("data/preview.json", "w"), indent=2)
env = {**os.environ, "RATE": rate}
subprocess.run(["python3", "scripts/make-voice.py", "preview"], check=True, env=env)
for attempt in (1, 2):
    out = subprocess.run(["npm", "run", "render", "--", "preview"], capture_output=True, text=True).stdout
    if "Rendered" in out:
        break
else:
    sys.exit("render failed")
subprocess.run(["./scripts/master.sh", "out/preview.mp4"], check=True)
print("preview ready: out/preview.mp4")
