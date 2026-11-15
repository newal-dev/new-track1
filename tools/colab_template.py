# ============================================================================
# Inclusive Access: make ALL read-aloud clips with Meta MMS-TTS in Google Colab.
#
# HOW TO USE
#   1. https://colab.research.google.com -> New notebook
#      Recommended: Runtime -> Change runtime type -> T4 GPU (about 10 min; CPU about 30-40 min)
#   2. Paste this WHOLE file into the first cell and press Run.
#   3. audio.zip downloads at the end (and is copied to Google Drive if SAVE_TO_DRIVE = True).
#      In the project, DELETE the old clips first, then unzip INTO public/audio/,
#      so you get e.g. public/audio/en/fullName.mp3 and public/audio/am/fullName.mp3
#   4. Read the "CHECK" lines in the summary: they list letters the voice could not say.
#
# The clip text (CLIPS, below the settings) is GENERATED from public/db-form.js by
# `npm run recording`. Do not edit CLIPS here: change the text in db-form.js, run
# `npm run recording`, and paste the new file.
# A native speaker must listen to every clip before it is used.
# LICENCE: the MMS-TTS models are CC-BY-NC 4.0 (non-commercial). Clips made here
# are for non-profit use; a commercial service needs human recordings instead.
# ============================================================================

import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "transformers>=4.33", "uroman>=1.3", "scipy"], check=True)

import os, re, json, shutil, unicodedata
import numpy as np
import scipy.io.wavfile
import torch
from transformers import VitsModel, AutoTokenizer, set_seed

# ---------------------------------------------------------------- settings --
# Every language, so every clip is the same family of voice and the same loudness.
LANGS_TO_MAKE = __LANGS__
ONLY_IDS = []            # e.g. ["fullName", "errBad"] to remake just a few clips; empty = all
MODELS = {
    "en": "facebook/mms-tts-eng",
    "am": "facebook/mms-tts-amh",
    "om": "facebook/mms-tts-orm",
    "ti": "facebook/mms-tts-tir",
    "so": "facebook/mms-tts-som",
    "sid": "facebook/mms-tts-sid",
}
UROMAN_CODE = {"en": "eng", "am": "amh", "om": "orm", "ti": "tir", "so": "som", "sid": "sid"}  # used only if a model expects Latin letters
SPEAKING_RATE = 0.9      # below 1.0 = slower and clearer
PAUSE_SENTENCE = 0.45    # seconds of silence between sentences and between numbered choices
PAUSE_COMMA = 0.18       # shorter breath at commas (the models have no comma of their own)
PAD = 0.12               # seconds of silence at the start and end of every clip
LOUDNESS = -18           # target loudness (LUFS) so every clip, in every language, is equally loud
BITRATE = "48k"          # mono mp3, small enough for 3G
SEED = 555               # same text -> same voice every run
SAVE_TO_DRIVE = False    # True = also copy audio.zip to Google Drive (asks for permission)
OUT = "/content/audio" if os.path.isdir("/content") else os.path.abspath("audio")

# The MMS models have no digits or symbols, so these are spelled out first.  VERIFY_NATIVE (om, ti, so, sid)
NUMBERS = {
    "en": ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
    "am": ["ዜሮ", "አንድ", "ሁለት", "ሦስት", "አራት", "አምስት", "ስድስት", "ሰባት", "ስምንት", "ዘጠኝ", "አሥር"],
    "om": ["zeeroo", "tokko", "lama", "sadii", "afur", "shan", "jaha", "torba", "saddeet", "sagal", "kudhan"],
    "ti": ["ዜሮ", "ሓደ", "ክልተ", "ሰለስተ", "ኣርባዕተ", "ሓሙሽተ", "ሽዱሽተ", "ሸውዓተ", "ሸሞንተ", "ትሽዓተ", "ዓሰርተ"],
    "so": ["eber", "kow", "laba", "saddex", "afar", "shan", "lix", "toddoba", "siddeed", "sagaal", "toban"],
    "sid": ["zeero", "mitto", "lame", "sase", "shoole", "onte", "lee", "lamala", "sette", "honse", "tonne"],
}
AT_SIGN = {"en": "at", "am": "at", "om": "at", "ti": "at", "so": "at", "sid": "at"}

CLIPS = json.loads(r'''__CLIPS_JSON__''')

# ------------------------------------------------------------------- code ---
def say_number(lang, digits):
    n = int(digits)
    words = NUMBERS[lang]
    return words[n] if n < len(words) else " ".join(words[int(d)] for d in digits)

def spoken(lang, text):
    """Screen text -> words the voice model can say."""
    t = unicodedata.normalize("NFC", text)
    t = re.sub(r"[«»\"“”‹›]", "", t)
    t = re.sub(r"[’‘ʼ`]", "'", t)                                               # one apostrophe (glottal stop in om, so)
    t = re.sub(r"(\d+):", lambda m: say_number(lang, m.group(1)) + ".", t)      # "1: Larger text" -> "one. Larger text"
    t = t.replace("@", " " + AT_SIGN[lang] + " ")
    t = re.sub(r"\d+", lambda m: say_number(lang, m.group(0)), t)               # "10" -> "ten", "0n" -> "zeeroon" (suffix kept)
    t = re.sub(r"[\-–—/]", " ", t)                                              # "Kala-duwanaan" -> two words
    t = re.sub(r"[()]", ",", t)
    return re.sub(r"\s+", " ", t).strip()

SENT_END = ".?!።፧;፤:፦"
COMMA = ",፣、"
def segments(t):
    """Split into (phrase, pause after it): long pause after a sentence, short after a comma."""
    out = []
    for sent in re.split(r"(?<=[" + re.escape(SENT_END) + r"])\s*", t):
        parts = [p for p in re.split(r"[" + re.escape(COMMA) + r"]\s*", sent)]
        for i, p in enumerate(parts):
            p = p.strip(" " + SENT_END + COMMA)
            if p:
                out.append((p, PAUSE_COMMA if i < len(parts) - 1 else PAUSE_SENTENCE))
    return out

def trim(w, rate, thresh=0.02):
    """Cut the model's own silence at both ends, so pauses are exactly the ones set above."""
    if not len(w):
        return w
    peak = float(np.abs(w).max()) or 1.0
    idx = np.where(np.abs(w) > peak * thresh)[0]
    if not len(idx):
        return w[:0]
    keep = int(rate * 0.03)                                                     # keep 30 ms so soft endings are not cut
    w = w[max(0, idx[0] - keep): idx[-1] + keep]
    f = min(len(w) // 2, int(rate * 0.008))                                     # 8 ms fade: no clicks where pieces join
    if f:
        ramp = np.linspace(0, 1, f, dtype=np.float32)
        w[:f] *= ramp; w[-f:] *= ramp[::-1]
    return w

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Using", device, "(choose Runtime -> T4 GPU if this says cpu and you want it faster)")
romaniser = None
def romanise(s, lang):
    global romaniser
    if romaniser is None:
        import uroman as ur
        romaniser = ur.Uroman()
    return romaniser.romanize_string(s, lcode=UROMAN_CODE[lang])

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
report, dropped = [], {}
for lang in LANGS_TO_MAKE:
    print(f"\n=== {lang}: loading {MODELS[lang]}")
    tok = AutoTokenizer.from_pretrained(MODELS[lang])
    model = VitsModel.from_pretrained(MODELS[lang]).to(device).eval()
    model.speaking_rate = SPEAKING_RATE
    rate = model.config.sampling_rate
    vocab = set(tok.get_vocab().keys())
    needs_latin = bool(getattr(tok, "is_uroman", False))                       # ask the model, do not guess
    print(f"    romanise with uroman: {needs_latin}; sampling rate {rate} Hz")
    os.makedirs(f"{OUT}/{lang}", exist_ok=True)
    for cid, text in CLIPS[lang].items():
        if ONLY_IDS and cid not in ONLY_IDS:
            continue
        pieces = []
        for phrase, pause in segments(spoken(lang, text)):
            s = romanise(phrase, lang) if needs_latin else phrase
            s = s.lower()
            lost = {c for c in s if c != " " and c not in vocab}
            if lost:
                dropped.setdefault(lang, {}).setdefault("".join(sorted(lost)), []).append(cid)
            inputs = tok(s, return_tensors="pt").to(device)
            if inputs["input_ids"].shape[-1] < 2:                                # nothing the model can say
                continue
            set_seed(SEED)
            with torch.no_grad():
                w = model(**inputs).waveform[0].cpu().numpy().astype(np.float32)
            w = trim(w, rate)
            if len(w):
                pieces += [w, np.zeros(int(rate * pause), np.float32)]
        if not pieces:
            print(f"  !! {cid}: nothing to say, skipped")
            report.append((lang, cid, 0.0, "EMPTY"))
            continue
        pad = np.zeros(int(rate * PAD), np.float32)
        wav = np.concatenate([pad, *pieces[:-1], pad])
        wav = wav / max(1e-6, float(np.abs(wav).max())) * 0.95
        wav_path, mp3_path = f"{OUT}/{lang}/{cid}.wav", f"{OUT}/{lang}/{cid}.mp3"
        scipy.io.wavfile.write(wav_path, rate, (wav * 32767).astype(np.int16))
        # Same loudness everywhere (EBU R128), then mono mp3. Peaks are kept below -1.5 dB so phones do not distort.
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                        "-af", f"loudnorm=I={LOUDNESS}:TP=-1.5:LRA=11", "-ar", str(rate),
                        "-ac", "1", "-b:a", BITRATE, mp3_path], check=True)
        os.remove(wav_path)
        secs = len(wav) / rate
        report.append((lang, cid, secs, "LONG (over 40 s)" if secs > 40 else "ok"))
        print(f"  {cid:16s} {secs:5.1f}s")
    del model
    if device == "cuda":
        torch.cuda.empty_cache()

print("\nSummary:")
for lang in LANGS_TO_MAKE:
    made = [r for r in report if r[0] == lang and r[3] != "EMPTY"]
    want = len(ONLY_IDS) if ONLY_IDS else len(CLIPS[lang])
    print(f"  {lang}: {len(made)} of {want} clips")
for r in report:
    if r[3] != "ok":
        print("  CHECK clip:", r)
for lang, d in dropped.items():
    for chars, ids in d.items():
        print(f"  CHECK {lang}: the voice cannot say {chars!r}; it was left out in {len(ids)} phrase(s), e.g. {', '.join(sorted(set(ids))[:6])}")

zip_path = shutil.make_archive(OUT, "zip", OUT)
print("\nWrote", zip_path, f"({os.path.getsize(zip_path) / 1e6:.1f} MB) - delete the old clips, then unzip INTO public/audio/")
if SAVE_TO_DRIVE:
    try:
        from google.colab import drive
        drive.mount("/content/drive")
        shutil.copy(zip_path, "/content/drive/MyDrive/inclusive-access-audio.zip")
        print("Copied to Google Drive: MyDrive/inclusive-access-audio.zip")
    except Exception as e:
        print("Could not copy to Drive:", e)
try:
    from google.colab import files
    files.download(zip_path)
    print("If the download did not start: open the Files panel on the left, right-click audio.zip, Download.")
except ImportError:
    pass
