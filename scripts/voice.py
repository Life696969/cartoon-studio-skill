"""Script lines -> one WAV per line, with Kokoro (free, runs on the computer).

Usage: python voice.py <lines.json> <out_dir> <kokoro_model.onnx> <voices.bin>

lines.json: [{"id": "01-rohan", "text": "...", "voice": "am_puck", "lang": "en-us", "speed": 1.0}, ...]
Writes <out_dir>/<id>.wav (24 kHz mono, 16-bit) and prints one JSON line per file.
"""
import json
import pathlib
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

# Kokoro starts speaking immediately; a short lead-in and tail stop the first
# and last syllables from being clipped by players and by lip-sync analysis.
LEAD_S, TAIL_S = 0.12, 0.25


def main():
    lines_path, out_dir, model, voices = sys.argv[1:5]
    out = pathlib.Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(model, voices)
    for line in json.loads(pathlib.Path(lines_path).read_text(encoding="utf-8")):
        samples, rate = kokoro.create(
            line["text"], voice=line["voice"], speed=line.get("speed", 1.0), lang=line.get("lang", "en-us")
        )
        pad = lambda s: np.zeros(int(s * rate), dtype=np.float32)
        audio = np.concatenate([pad(LEAD_S), samples.astype(np.float32), pad(TAIL_S)])
        path = out / f"{line['id']}.wav"
        sf.write(path, audio, rate, subtype="PCM_16")
        print(json.dumps({"id": line["id"], "wav": str(path), "seconds": round(len(audio) / rate, 3)}))


if __name__ == "__main__":
    main()
