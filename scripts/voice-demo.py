"""One wav that reads the same line in many Kokoro voices, each introduced by name."""
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

voices = {"af_heart": "Heart", "af_bella": "Bella", "af_nicole": "Nicole", "af_sarah": "Sarah", "af_sky": "Sky",
          "am_adam": "Adam", "am_michael": "Michael", "am_fenrir": "Fenrir", "am_puck": "Puck",
          "bf_emma": "Emma", "bf_isabella": "Isabella", "bm_george": "George", "bm_lewis": "Lewis"}
line = "Click an item, and the click bubbles up to the list. One listener handles every item."
k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
parts, rate = [], 24000
for v, name in voices.items():
    lang = "en-gb" if v.startswith("b") else "en-us"
    s, rate = k.create(f"{name}. {line}", voice=v, speed=0.95, lang=lang)
    parts += [s, np.zeros(int(rate * 1.2), dtype=s.dtype)]
    print(v, name)
sf.write("out/voice-test/all-voices.wav", np.concatenate(parts), rate)
