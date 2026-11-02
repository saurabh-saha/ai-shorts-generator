"""Word-level timestamps for a voiceover, via faster-whisper (open source).

    pip install faster-whisper
    npm run captions -- public/audio/rate-limiter.wav

Writes data/<name>.words.json: [{"word": "...", "start": 0.0, "end": 0.4}, ...]
Use these to set each beat's `duration` in data/<name>.json, and later to
drive word-by-word caption highlighting.
"""
import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel

audio = Path(sys.argv[1])
model = WhisperModel("small", compute_type="int8")
segments, _ = model.transcribe(str(audio), word_timestamps=True)

words = [
    {"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)}
    for seg in segments
    for w in seg.words
]
out = Path("data") / f"{audio.stem}.words.json"
out.write_text(json.dumps(words, indent=2))
print(f"{len(words)} words -> {out}")
