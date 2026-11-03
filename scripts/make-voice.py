"""Scratch voiceover with the macOS `say` command (swap for your own voice later).

    npm run voice

For each beat in data/<topic>.json this renders its `say` text to
public/audio/<topic>/<id>.wav, then sets `voice` and `duration`
(= max(min, speech length + padding)) so the animation fits the speech.
To use your own recording, replace those wav files (same names) and re-run
with VOICE_SKIP_TTS=1 to just refresh the durations.
"""
import json
import math
import os
import subprocess
import sys
from pathlib import Path

topic = sys.argv[1] if len(sys.argv) > 1 else "rate-limiter"
voice = os.environ.get("VOICE", "Samantha")
rate = os.environ.get("RATE", "175")
pad = 0.8

path = Path("data") / f"{topic}.json"
data = json.loads(path.read_text())
out = Path("public/audio") / topic
out.mkdir(parents=True, exist_ok=True)

for beat in data["beats"]:
    wav = out / f"{beat['id']}.wav"
    if not os.environ.get("VOICE_SKIP_TTS"):
        if os.environ.get("VOICE_ENGINE") == "kokoro":
            # open-source neural voice; VOICE=af_sky etc., SPEED ~0.95
            kv = os.environ.get("VOICE", "af_sky")
            subprocess.run([".venv-tts/bin/python", "scripts/kokoro-tts.py", str(wav), kv,
                            os.environ.get("SPEED", "0.95"), beat["say"]], check=True)
        else:
            aiff = out / f"{beat['id']}.aiff"
            subprocess.run(["say", "-v", voice, "-r", rate, "-o", str(aiff), beat["say"]], check=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(aiff), "-ar", "44100", "-ac", "1", str(wav)], check=True)
            aiff.unlink()
    length = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)]).decode())
    beat["voice"] = f"/audio/{topic}/{beat['id']}.wav"
    beat["duration"] = max(beat.get("min", 0), math.ceil((length + pad) * 2) / 2)
    print(f"{beat['id']:8} speech {length:5.2f}s -> beat {beat['duration']}s")

path.write_text(json.dumps(data, indent=2) + "\n")
print("total", sum(b["duration"] for b in data["beats"]), "s")
