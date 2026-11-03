"""Render text to a wav with Kokoro (open-source neural TTS, runs locally).

    .venv-tts/bin/python scripts/kokoro-tts.py <out.wav> <voice> <speed> <text...>
"""
import sys
import soundfile as sf
from kokoro_onnx import Kokoro

out, voice, speed, text = sys.argv[1], sys.argv[2], float(sys.argv[3]), " ".join(sys.argv[4:])
kokoro = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
samples, rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
sf.write(out, samples, rate)
