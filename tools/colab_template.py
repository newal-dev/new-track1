# ============================================================================
# Inclusive Access: make the read-aloud clips with Meta MMS-TTS in Google Colab.
#
# HOW TO USE
#   1. https://colab.research.google.com -> New notebook
#      (optional, faster: Runtime -> Change runtime type -> T4 GPU)
#   2. Paste this WHOLE file into the first cell and press Run.
#   3. audio.zip downloads at the end. Unzip it INTO public/audio/ in the project,
#      so you get e.g. public/audio/am/fullName.mp3
#
# The clip text (CLIPS, at the bottom of the settings) is GENERATED from
# public/db-form.js by `npm run recording`. Do not edit CLIPS here: change the
# text in db-form.js, run `npm run recording`, and paste the new file.
# A native speaker must listen to every clip before it is used.
# LICENCE: the MMS-TTS models are CC-BY-NC 4.0 (non-commercial). Clips made here
# are for non-profit use; a commercial service needs human recordings instead.
# ============================================================================

import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "transformers>=4.33", "uroman>=1.3", "scipy"], check=True)

import os, re, json, shutil, zipfile
import numpy as np
import scipy.io.wavfile
import torch
from transformers import VitsModel, AutoTokenizer, set_seed

# ---------------------------------------------------------------- settings --
LANGS_TO_MAKE = ["am", "om", "ti", "so"]   # add "en" to also make English clips (otherwise the device voice reads English)
ONLY_IDS = []                               # e.g. ["fullName", "errBad"] to remake just a few clips; empty = all
MODELS = {
    "en": "facebook/mms-tts-eng",
    "am": "facebook/mms-tts-amh",
    "om": "facebook/mms-tts-orm",
    "ti": "facebook/mms-tts-tir",
    "so": "facebook/mms-tts-som",
}
SPEAKING_RATE = 0.9      # below 1.0 = slower and clearer
PAUSE_SENTENCE = 0.45    # seconds of silence between sentences / choices
PAD = 0.15               # seconds of silence at the start and end
BITRATE = "48k"          # mono mp3, small enough for 3G
SEED = 555               # same text -> same voice every run
OUT = "/content/audio" if os.path.isdir("/content") else os.path.abspath("audio")

# The MMS models have no digits or symbols, so these are spelled out first.  VERIFY_NATIVE (om, ti, so)
NUMBERS = {
    "en": ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
    "am": ["ዜሮ", "አንድ", "ሁለት", "ሦስት", "አራት", "አምስት", "ስድስት", "ሰባት", "ስምንት", "ዘጠኝ", "አሥር"],
    "om": ["zeeroo", "tokko", "lama", "sadii", "afur", "shan", "jaha", "torba", "saddeet", "sagal", "kudhan"],
    "ti": ["ዜሮ", "ሓደ", "ክልተ", "ሰለስተ", "ኣርባዕተ", "ሓሙሽተ", "ሽዱሽተ", "ሸውዓተ", "ሸሞንተ", "ትሽዓተ", "ዓሰርተ"],
    "so": ["eber", "kow", "laba", "saddex", "afar", "shan", "lix", "toddoba", "siddeed", "sagaal", "toban"],
}
AT_SIGN = {"en": "at", "am": "at", "om": "at", "ti": "at", "so": "at"}
UROMAN_LANG = {"am": "amh", "ti": "tir"}   # these models expect Latin letters: the Ge'ez text is romanised first

CLIPS = json.loads(r'''__CLIPS_JSON__''')

# ------------------------------------------------------------------- code ---
def say_number(lang, digits):
    n = int(digits)
    words = NUMBERS[lang]
    return words[n] if n < len(words) else " ".join(words[int(d)] for d in digits)

def spoken(lang, text):
    """Screen text -> words the voice model can say."""
    t = re.sub(r"[«»\"“”]", "", text)
    t = re.sub(r"(\d+):", lambda m: say_number(lang, m.group(1)) + ".", t)   # "1: Larger text" -> "one. Larger text"
    t = t.replace("@", " " + AT_SIGN[lang] + " ")
    t = re.sub(r"\d+", lambda m: say_number(lang, m.group(0)), t)            # "10" -> "ten", "0n" -> "zeeroon"
    return t

def sentences(t):
    parts = re.split(r"(?<=[.?!።፧፤;])\s*", t)
    return [p.strip(" .?!።፧፤;") for p in parts if p.strip(" .?!።፧፤;")]

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Using", device)
romaniser = None
if any(l in UROMAN_LANG for l in LANGS_TO_MAKE):
    import uroman as ur
    romaniser = ur.Uroman()

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
report = []
for lang in LANGS_TO_MAKE:
    print(f"\n=== {lang}: loading {MODELS[lang]}")
    tok = AutoTokenizer.from_pretrained(MODELS[lang])
    model = VitsModel.from_pretrained(MODELS[lang]).to(device).eval()
    model.speaking_rate = SPEAKING_RATE
    rate = model.config.sampling_rate
    gap, pad = np.zeros(int(rate * PAUSE_SENTENCE), np.float32), np.zeros(int(rate * PAD), np.float32)
    os.makedirs(f"{OUT}/{lang}", exist_ok=True)
    for cid, text in CLIPS[lang].items():
        if ONLY_IDS and cid not in ONLY_IDS:
            continue
        pieces = []
        for s in sentences(spoken(lang, text)):
            if lang in UROMAN_LANG:
                s = romaniser.romanize_string(s, lcode=UROMAN_LANG[lang])
            inputs = tok(s.lower(), return_tensors="pt").to(device)
            if inputs["input_ids"].shape[-1] < 2:      # nothing the model can say (e.g. only symbols)
                continue
            set_seed(SEED)
            with torch.no_grad():
                pieces.append(model(**inputs).waveform[0].cpu().numpy())
            pieces.append(gap)
        if not pieces:
            print(f"  !! {cid}: nothing to say, skipped")
            report.append((lang, cid, 0.0, "EMPTY"))
            continue
        wav = np.concatenate([pad, *pieces[:-1], pad])
        wav = wav / max(1e-6, float(np.abs(wav).max())) * 0.9          # same loudness for every clip
        wav_path, mp3_path = f"{OUT}/{lang}/{cid}.wav", f"{OUT}/{lang}/{cid}.mp3"
        scipy.io.wavfile.write(wav_path, rate, (wav * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-ac", "1", "-b:a", BITRATE, mp3_path], check=True)
        os.remove(wav_path)
        secs = len(wav) / rate
        report.append((lang, cid, secs, "LONG (over 40 s)" if secs > 40 else "ok"))
        print(f"  {cid:14s} {secs:5.1f}s")
    del model
    if device == "cuda":
        torch.cuda.empty_cache()

print("\nSummary:")
for lang in LANGS_TO_MAKE:
    made = [r for r in report if r[0] == lang and r[3] != "EMPTY"]
    print(f"  {lang}: {len(made)} of {len(CLIPS[lang])} clips")
for r in report:
    if r[3] != "ok":
        print("  check:", r)

zip_path = shutil.make_archive(OUT, "zip", OUT)
print("\nWrote", zip_path, "- unzip it INTO public/audio/")
try:
    from google.colab import files
    files.download(zip_path)
except ImportError:
    pass
