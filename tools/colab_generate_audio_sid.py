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
LANGS_TO_MAKE = ["sid","en"]
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

# Key names are said with the English voice in every language: people know the keys by their English names.
KEY_WORDS = r"\b(Tab|Shift|Space|Enter|Escape|Esc)\b"
# Words the romaniser spells badly for the voice (uroman adds a vowel after every vowelless Ge'ez letter, so ሁለት became
# "hulate"). Whole phrase -> the Latin spelling the voice model is given instead. Chosen by a native speaker, by ear.
PRONOUNCE = {
    # Digits chosen by a native Amharic speaker, by ear (15 Nov 2026). ዜሮ, ሁለት, ስምንት, ዘጠኝ keep the romaniser's spelling.
    "am": {"አንድ": "aand", "ሦስት": "sosst", "አራት": "aratt", "አምስት": "amest", "ስድስት": "sidist", "ሰባት": "sabaat",
           "አሥር": "asser"},  # አሥር: same pattern as the chosen digits; a native speaker should listen to it
}
CLIPS = json.loads(r'''{
 "sid": {
  "langSelf": "Sidaamu Afoo doorate, Sidaamu Afoo yi, woy Sidaamu Afoo yitanno ilkaawa xiiwi.",
  "raAsk": "Kuni qoolu qaalinke nabbawamanno gede hasatto? Ikkitinni Ee woy Dee'ni yi, woy mitte ilkaawa xiiwi. Ee yitto ikkiro, woy gedensaanni Hasaawi xiiwitto ikkiro, barbaarsaasikki qaalekki borrote soorrate abbaasi aana soyannosi. Dee'ni yitte borreessa dandaatto.",
  "raAgain": "Dawaro dimacciishshinoommo, kawule Dee'ni yinoonni gede adhineemmo. Qoolu nabbawamanno gede hasatto ikkiro, xa Ee yi, woy Ee ilkaawa xiiwi.",
  "welcome": "Dancha dayitine! Borreessamate nna loosu dandoowa afate shota doogo. Hanafi. Qaalinke hanafi. Ane nabbawi. Keyboorde aana: woroonni higate Tab, aliidi higate Shift nna Tab, doorate Space woy Enter, qaala uurrisate Escape xiiwi. Hanafate Hanafi yi.",
  "prefs": "Konne foormu hiittoo horoonsi'rate hasatto? Dooro. Darba dandaatto. 1: Lowo borro. 2: Doorshu gaxa misilla. Doorshikki kiiro woy su'ma yi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.",
  "fullName": "Wo'mu su'mikki ayeti? Barru barrunni horoonsi'ratto su'mu ikkanno. Xa dawarokki hasaawi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.",
  "contact": "Hiittoo silki kiiro woy imeelenni dandoonketa? Tenne pirogiraame daafira dandoonketa calla. Silki kiiro tonne kiiro afi'rinohanna zeerotenni hanafanno. Hasaawa woy borreessa dandaatto. Xa dawarokki hasaawi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.",
  "idRoute": "Ati ayeti ikkitoota hiittoo leellisate hasatto? 1: Qebeele eeshsha woy paaspoorte. 2: Baqatu woy higgaanchu eeshsha. 3: Wole bortaje. 4: Eeshsha diafi'rino. Jaala dirijjiteenni hoolisi'e. Doorshikki kiiro woy su'ma yi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.",
  "support": "Hiittoo kaa'lo kaa'lannohe? Ayeeno doori. Tenne darba dandaatto. Ragi dihasiissanno. Qixxeessitooti calla la'anno, kaa'lo qixxeessate calla. 1: Leellisaancho nabbawaancho horoonsi'reemmo. 2: Lowo borro. 3: Dawaro qaalinke hasaawa doorreemmo. 4: Itiyoophiyu Malaatu Afoo turjimaancho. 5: Viidiyoo aana borro. 6: Afoo'yanni turjimaancho. 7: Fayyimmaranna loosora roore yanna. 8: Shota qaalla nna misilla. 9: Ikkitinni kaa'lo daafira silki xa'mi. 10: Kulla dihasi'reemmo. Doorshikki kiiro woy su'ma yi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.",
  "needs": "Loosu aana hiittoo kaa'lo hasiissannohe? Ayeeno doori. Ma'nunni. Konne uduunnichokki aana keeshshanno, coyi'nanno loosuwa leellisate calla. 1: Gadu dinokki loosu bayicho. 2: Leellisaancho nabbawaanchora coyi'nanno uduunnicho. 3: Malaatu afoo turjimaancho. 4: Soorramanno loosu saate. 5: Mineenni loosa. Doorshikki kiiro woy su'ma yi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.",
  "why": "Konne loosu mayira hasatto? Shiima qaalla ikkanno. Hasaawa dandaatto. Xa dawarokki hasaawi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.",
  "job": "Loosu su'mi ayeti? Xa dawarokki hasaawi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi.",
  "offers": "Kuni loosu hiittoo qixxeessuwa aamanno? 1: Gadu dinokki loosu bayicho. 2: Leellisaancho nabbawaanchora coyi'nanno uduunnicho. 3: Malaatu afoo turjimaancho. 4: Soorramanno loosu saate. 5: Mineenni loosa. Doorshikki kiiro woy su'ma yi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.",
  "closes": "Xa'muwu ayi yanna gufamanno? Dooro. Itiyoophiyu barru qoodo. Agana calla huvatto ikkiro, barrara Dianfaa'moommo doori. Ikkitinni dawarokki saaxine giddo borreessi. Aanchite Enter, woy Albisi ilkaawa xiiwi.",
  "errNeed": "Ikkitinni tenne xa'mo dawaari, woy Higi xiiwi.",
  "errBad": "Ikkitinni zeerotenni hanafanno, tonne kiiro afi'rino silki kiiro borreessi, woy @ malaatto afi'rino imeele borreessi.",
  "errFail": "Dawaro keeshshi soya didandiinoommo. Mittunkuri dibaino. Ikkitinni wole paaxi.",
  "unclear": "Hakkaya, dihuvattoommo. Ikkitinni doorshikki kiiro yi.",
  "noneSel": "Mittunkuri dooraminokki. Kiiro woy su'ma yi, woy Darbi yi.",
  "idle": "Dimacciishshinoommo. Lowo Hasaawi ilkaawa xiiwi, woy keyboorde horoonsi'rate Nabbawa uurrisi xiiwi.",
  "sayWelcome": "Hanafate Hanafi yi.",
  "reviewAsk": "Dawaro keeshshi soyate hasatto? Soyate Ee, mittu coye soorrate Dee'ni yi.",
  "heardGeneric": "Dawarokki macciishshinoonni. Leellisaanchu aana leellitanno. Albisate Albisi yi, woy dawarokki wole yi.",
  "choseA": "Doorttohu",
  "choseB": "Albisate Albisi yi, woy wole doori.",
  "doneNext": "Albisate Albisi yi.",
  "errConsentNeed": "Ikkitinni soyitto albaanni ammanaate saaxine malaatisi, woy Higi xiiwi.",
  "errDateBad": "Ikkitinni agana doori, woy barranna diri Dianfaa'moommo assi.",
  "draftH": "Dancha higgite Darbinoha yannaha dawaro keeshshi konne uduunnicho aana agarantino. Uurrinoommohunni albisi Wole hanafi",
  "queued": "Interneete aana dikiitto. Dawaro keeshshi konne uduunnicho aana agarantino, interneete aana higgitto wote soyamanno.",
  "sentLater": "Agarantino dawaro keeshshi xa soyamino.",
  "tapToHear": "Xa'muwa macciishshate ayee ilkaawa xiiwi woy leellisaancho kaali.",
  "n10": "Tonne",
  "n0": "Zeero",
  "n1": "Mitto",
  "n2": "Lame",
  "n3": "Sase",
  "n4": "Shoole",
  "n5": "Onte",
  "n6": "Lee",
  "n7": "Lamala",
  "n8": "Sette",
  "n9": "Honse",
  "reviewH": "Dawaro keeshshi buuxi",
  "skipped": "(darbamino)",
  "reviewKeys": "Dawaro keyboordetenni soorrate, Soorri ilkaawa iillitto geeshsha Tab xiiwi, aanchite Enter xiiwi.",
  "consentOrg": "Kuri dawaro konne weebsaytete qixxeessitootara soyamanno gede ammanaammo.",
  "consentSendA": "Kuri dawaro ",
  "consentSendB": "ra soyamanno gede ammanaammo.",
  "consentSupport": "Kaa'lo doorshoyya qixxeessitootira qoodi, kaa'lo qixxeessanno gede. Tenne mullicho agurtto ikkiro, kaa'lo doorshoyyikki disoyamanno.",
  "askSupport": "Kaa'lo doorte. Kaa'lo qixxeessanno gede kaa'lo doorshoyyikki qixxeessitootira qoolate hasatto? Ee woy Dee'ni yi.",
  "heardA": "Macciishshoonnihu",
  "heardB": "Albisate Albisi yi, woy dawarokki wole yi.",
  "display": "Kuulla nna borrote lowina",
  "textSize": "Borrote lowina",
  "th_auto": "Uduunnichoyi'ya gede",
  "th_standard": "Rosu",
  "th_dark": "Tuqa",
  "th_contrast": "Lowo babbaxxe (kolishsho nna waajjo)",
  "th_rg": "Hoogora nna burtukaane (duumo nna haqqaa kuulla babbaxxe dandiitinokketa)",
  "th_by": "Haqqaa-hoogora nna duumo (hoogora nna dalla kuulla babbaxxe dandiitinokketa)",
  "reviewFix": "Umi xa'mora higate Wole hanafi yi, woy soorrate hasatto xa'mo kiiro yi.",
  "done": "Galateemmo. Dawaro keeshshi adhinoonni.",
  "speakNow": "Xa hasaawi.",
  "sel": "doodamino",
  "unsel": "doodaminokki",
  "langName": "Sidaamu Afoo",
  "b_next": "Albisi",
  "b_back": "Higi",
  "b_skip": "Darbi",
  "b_read": "Qaalinke nabbawi",
  "b_speak": "Hasaawi",
  "b_readToMe": "Ane nabbawi",
  "b_stopRead": "Nabbawa uurrisi",
  "b_send": "Ee, soy",
  "b_noChange": "Dee'ni, mittu coye soorrara",
  "b_restart": "Wole hanafi",
  "b_change": "Soorri",
  "b_start": "Hanafi",
  "b_startVoice": "Qaalinke hanafi",
  "b_raYes": "Ee, nabbawi",
  "b_raNo": "Dee'ni, galateemmo",
  "b_draftGo": "Uurrinoommohunni albisi",
  "q_prefs": "Konne foormu hiittoo horoonsi'rate hasatto?",
  "o_prefs_large": "Lowo borro",
  "o_prefs_simple": "Doorshu gaxa misilla",
  "q_fullName": "Wo'mu su'mikki ayeti?",
  "q_contact": "Hiittoo silki kiiro woy imeelenni dandoonketa?",
  "q_idRoute": "Ati ayeti ikkitoota hiittoo leellisate hasatto?",
  "o_idRoute_kebele": "Qebeele eeshsha woy paaspoorte",
  "o_idRoute_refugee": "Baqatu woy higgaanchu eeshsha",
  "o_idRoute_other": "Wole bortaje",
  "o_idRoute_refer": "Eeshsha diafi'rino. Jaala dirijjiteenni hoolisi'e",
  "q_support": "Hiittoo kaa'lo kaa'lannohe? Ayeeno doori.",
  "o_support_screenreader": "Leellisaancho nabbawaancho horoonsi'reemmo",
  "o_support_large": "Lowo borro",
  "o_support_voice": "Dawaro qaalinke hasaawa doorreemmo",
  "o_support_sign": "Itiyoophiyu Malaatu Afoo turjimaancho",
  "o_support_captions": "Viidiyoo aana borro",
  "o_support_interp": "Afoo'yanni turjimaancho",
  "o_support_time": "Fayyimmaranna loosora roore yanna",
  "o_support_simple": "Shota qaalla nna misilla",
  "o_support_human": "Ikkitinni kaa'lo daafira silki xa'mi",
  "o_support_prefer": "Kulla dihasi'reemmo",
  "q_needs": "Loosu aana hiittoo kaa'lo hasiissannohe? Ayeeno doori.",
  "o_needs_stepfree": "Gadu dinokki loosu bayicho",
  "o_needs_reader": "Leellisaancho nabbawaanchora coyi'nanno uduunnicho",
  "o_needs_interp": "Malaatu afoo turjimaancho",
  "o_needs_hours": "Soorramanno loosu saate",
  "o_needs_remote": "Mineenni loosa",
  "q_role": "Ayi loosora xa'mitto?",
  "q_why": "Konne loosu mayira hasatto?",
  "q_job": "Loosu su'mi ayeti?",
  "q_offers": "Kuni loosu hiittoo qixxeessuwa aamanno?",
  "o_offers_stepfree": "Gadu dinokki loosu bayicho",
  "o_offers_reader": "Leellisaancho nabbawaanchora coyi'nanno uduunnicho",
  "o_offers_interp": "Malaatu afoo turjimaancho",
  "o_offers_hours": "Soorramanno loosu saate",
  "o_offers_remote": "Mineenni loosa",
  "q_closes": "Xa'muwu ayi yanna gufamanno?"
 },
 "en": {
  "langAsk": "Which language would you like to use? For English, say English, or press the English button."
 }
}''')

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

_eng = {}
def english_voice():
    if not _eng:
        _eng["tok"] = AutoTokenizer.from_pretrained(MODELS["en"])
        m = VitsModel.from_pretrained(MODELS["en"]).to(device).eval(); m.speaking_rate = SPEAKING_RATE; _eng["model"] = m
    return _eng["tok"], _eng["model"]
def synth(tok, model, s):
    inputs = tok(s, return_tensors="pt").to(device)
    if inputs["input_ids"].shape[-1] < 2:                                        # nothing the model can say
        return None
    set_seed(SEED)
    with torch.no_grad():
        return model(**inputs).waveform[0].cpu().numpy().astype(np.float32)
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
            # A phrase in another language can contain key names: those parts are said by the English voice.
            parts = re.split(KEY_WORDS, phrase) if lang != "en" else [phrase]
            ws = []
            for j, part in enumerate(parts):
                part = part.strip()
                if not part:
                    continue
                if j % 2 == 1:
                    et, em = english_voice(); w = synth(et, em, part.lower())
                else:
                    fixed = PRONOUNCE.get(lang, {}).get(part.strip(" .,!?።፣"))
                    if fixed:
                        s = fixed
                    elif needs_latin and any(w.strip(" .,!?።፣") in PRONOUNCE.get(lang, {}) for w in part.split()):
                        # A sentence with one of those words in it (a numbered choice): that word as chosen, the rest romanised.
                        s = " ".join(PRONOUNCE[lang].get(w.strip(" .,!?።፣")) or romanise(w, lang) for w in part.split())
                    else:
                        s = romanise(part, lang) if needs_latin else part
                    s = s.lower()
                    # Letters this voice has no sound for: the nearest one it has (ቪዲዮ "video" -> "bidiyo", as many say it).
                    for miss, near in (("v", "b"), ("p", "b")):
                        if miss not in vocab and near in vocab:
                            s = s.replace(miss, near)
                    lost = {c for c in s if c != " " and c not in vocab}
                    if lost:
                        dropped.setdefault(lang, {}).setdefault("".join(sorted(lost)), []).append(cid)
                    w = synth(tok, model, s)
                if w is not None:
                    w = trim(w, rate)
                    if len(w):
                        ws += [w / (float(np.abs(w).max()) or 1.0) * 0.9, np.zeros(int(rate * 0.06), np.float32)]
            if ws:
                pieces += [*ws[:-1], np.zeros(int(rate * pause), np.float32)]
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
