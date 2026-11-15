import os
import numpy as np
import scipy.io.wavfile
import torch
from transformers import VitsModel, VitsTokenizer, set_seed

SAMPLES = {
    "amh": ("facebook/mms-tts-amh", "ሰላም፣ ሙሉ ስምዎን ያስገቡ።"),
    "orm": ("facebook/mms-tts-orm", "Nagaa, maqaa guutuu keessan galchaa."),
    "tir": ("facebook/mms-tts-tir", "ሰላም፣ ምሉእ ስምኩም ኣእትዉ።"),
    "som": ("facebook/mms-tts-som", "Salaan, fadlan geli magacaaga oo buuxa."),
    "sid": ("facebook/mms-tts-sid", "Keere, wo'ma su'makki eessi."),
}

os.makedirs("out", exist_ok=True)

for code, (model_id, text) in SAMPLES.items():
    print(f"Testing {code} ({model_id})...")
    tokenizer = VitsTokenizer.from_pretrained(model_id)
    model = VitsModel.from_pretrained(model_id)

    # Optional: slightly slower & clearer for low-literacy accessibility (default is 1.0)
    model.config.speaking_rate = 0.9

    inputs = tokenizer(text, return_tensors="pt")
    set_seed(42)
    with torch.no_grad():
        wav = model(**inputs).waveform[0].cpu().numpy()

    # Convert float32 -> 16-bit PCM WAV so Windows/Android/browsers play cleanly
    wav_int16 = (np.clip(wav, -1.0, 1.0) * 32767).astype(np.int16)
    out_path = f"out/{code}.wav"
    scipy.io.wavfile.write(out_path, rate=model.config.sampling_rate, data=wav_int16)
    print(f"  -> Saved {out_path} ({len(wav_int16) / model.config.sampling_rate:.1f}s)")