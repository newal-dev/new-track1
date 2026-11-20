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
LANGS_TO_MAKE = ["en","am","om","ti","so","sid"]
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
 "en": {
  "langAsk": "Which language would you like to use? For English, say English, or press the English button.",
  "langNone": "We did not hear a language. Please press a language button.",
  "langAgain": "Please say the name of your language again.",
  "raAsk": "Would you like this page to be read aloud to you? Please say Yes or No, or press a button. If you choose Yes, or press a Speak button later, your browser may send your voice to its provider to turn it into text. You can choose No and type instead.",
  "raAgain": "We did not hear an answer, so we will take that as No. If you would like the page read aloud, please say Yes now, or press the Yes button.",
  "welcome": "Welcome! A simpler way to register and find opportunities. Start. Start with voice. Read to me. On a keyboard: press Tab to go down, Shift and Tab to go up, Space or Enter to choose, and Escape to stop the voice. Say Start to begin.",
  "prefs": "How would you like to use this form? Optional. You can skip this. 1: Larger text. 2: Pictures next to choices. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.",
  "fullName": "What is your full name? The name you use every day is fine. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.",
  "contact": "What phone number or email can we use? Only used to contact you about this programme. A phone number has 10 digits and starts with 0. You can say it or type it. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.",
  "idRoute": "How would you like to show who you are? 1: Kebele ID or passport. 2: Refugee or returnee ID. 3: Another document. 4: I don't have an ID. Refer me through a partner organisation. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again.",
  "support": "What support would help you? Choose any. You can skip this. No proof needed. Only the organisers see it, and only to prepare help for you. 1: I use a screen reader. 2: Large text. 3: I prefer to speak my answers. 4: Ethiopian Sign Language interpreter. 5: Captions on videos. 6: An interpreter in my language. 7: More time for tests and tasks. 8: Simple words and pictures. 9: Please call me to help. 10: Prefer not to say. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.",
  "needs": "What support do you need at work? Choose any. Private. This stays on your device and is only used to show suitable jobs. 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.",
  "why": "Why do you want this job? A few words are enough. You can speak instead. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.",
  "job": "What is the job title? Speak your answer now. Say Next to continue, or Read aloud to hear this again.",
  "offers": "Which adjustments can this job offer? 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.",
  "closes": "When do applications close? Optional. Ethiopian calendar. If you only know the month, choose Not sure for the day. Please type your answer in the box. Then press Enter, or press the Next button.",
  "errNeed": "Please answer this question, or press Back.",
  "errBad": "Please type a phone number with 10 digits, starting with zero, or an email address with an @ sign.",
  "errFail": "We could not send your answers. Nothing is lost. Please try again.",
  "unclear": "Sorry, I did not understand. Please say the number of your choice.",
  "noneSel": "Nothing is chosen. Say a number or a name, or say Skip.",
  "idle": "We did not hear you. Press the big Speak button, or press Stop reading to use the keyboard.",
  "sayWelcome": "Say Start to begin.",
  "reviewAsk": "Do you want to submit your answers? Say Yes to submit, or No to change something.",
  "heardGeneric": "We heard your answer. It is shown on the screen. Say Next to continue, or say your answer again.",
  "choseA": "You chose",
  "choseB": "Say Next to continue, or choose again.",
  "doneNext": "Say Next to continue.",
  "errConsentNeed": "Please tick the box to agree before sending, or press Back.",
  "errDateBad": "Please choose a month, or set day and year to Not sure to skip the date.",
  "draftH": "Welcome back Your answers from last time are kept on this device. Continue where I stopped Start again",
  "queued": "You are offline. Your answers are saved on this device and will be sent when you are back online.",
  "sentLater": "Your saved answers have now been sent.",
  "tapToHear": "Press any key or tap the screen to hear the questions.",
  "n10": "Ten",
  "n0": "Zero",
  "n1": "One",
  "n2": "Two",
  "n3": "Three",
  "n4": "Four",
  "n5": "Five",
  "n6": "Six",
  "n7": "Seven",
  "n8": "Eight",
  "n9": "Nine",
  "reviewH": "Check your answers",
  "skipped": "(skipped)",
  "reviewKeys": "To change an answer with the keyboard, press Tab until you reach its Change button, then press Enter.",
  "consentOrg": "I agree to send these answers to the organisers of this website.",
  "consentSendA": "I agree to send these answers to ",
  "consentSupport": "Also share my support choices with the organisers, so they can prepare help. If you leave this empty, your support choices are not sent.",
  "askSupport": "You chose some support. Do you also want to share your support choices with the organisers, so they can prepare help? Say Yes or No.",
  "heardA": "We heard",
  "heardB": "Say Next to continue, or say your answer again.",
  "display": "Colours and text size",
  "textSize": "Text size",
  "th_auto": "Same as my device",
  "th_standard": "Standard",
  "th_dark": "Dark",
  "th_contrast": "High contrast (black and white)",
  "th_rg": "Blue and orange (for red-green colour blindness)",
  "th_by": "Teal and red (for blue-yellow colour blindness)",
  "reviewFix": "Say Start again to go back to the first question, or say the number of the question you want to change.",
  "done": "Thank you. We received your answers.",
  "speakNow": "Speak now.",
  "sel": "selected",
  "unsel": "not selected",
  "langName": "English",
  "b_next": "Next",
  "b_back": "Back",
  "b_skip": "Skip",
  "b_read": "Read aloud",
  "b_speak": "Speak",
  "b_readToMe": "Read to me",
  "b_stopRead": "Stop reading",
  "b_send": "Yes, submit",
  "b_noChange": "No, change something",
  "b_restart": "Start again",
  "b_change": "Change",
  "b_start": "Start",
  "b_startVoice": "Start with voice",
  "b_raYes": "Yes, read aloud",
  "b_raNo": "No, thank you",
  "b_draftGo": "Continue where I stopped",
  "q_prefs": "How would you like to use this form?",
  "o_prefs_large": "Larger text",
  "o_prefs_simple": "Pictures next to choices",
  "q_fullName": "What is your full name?",
  "q_contact": "What phone number or email can we use?",
  "q_idRoute": "How would you like to show who you are?",
  "o_idRoute_kebele": "Kebele ID or passport",
  "o_idRoute_refugee": "Refugee or returnee ID",
  "o_idRoute_other": "Another document",
  "o_idRoute_refer": "I don't have an ID. Refer me through a partner organisation",
  "q_support": "What support would help you? Choose any.",
  "o_support_screenreader": "I use a screen reader",
  "o_support_large": "Large text",
  "o_support_voice": "I prefer to speak my answers",
  "o_support_sign": "Ethiopian Sign Language interpreter",
  "o_support_captions": "Captions on videos",
  "o_support_interp": "An interpreter in my language",
  "o_support_time": "More time for tests and tasks",
  "o_support_simple": "Simple words and pictures",
  "o_support_human": "Please call me to help",
  "o_support_prefer": "Prefer not to say",
  "q_needs": "What support do you need at work? Choose any.",
  "o_needs_stepfree": "Step-free workplace",
  "o_needs_reader": "Screen-reader friendly tools",
  "o_needs_interp": "Sign language interpreter",
  "o_needs_hours": "Flexible hours",
  "o_needs_remote": "Work from home",
  "q_role": "Which job are you applying for?",
  "q_why": "Why do you want this job?",
  "q_job": "What is the job title?",
  "q_offers": "Which adjustments can this job offer?",
  "o_offers_stepfree": "Step-free workplace",
  "o_offers_reader": "Screen-reader friendly tools",
  "o_offers_interp": "Sign language interpreter",
  "o_offers_hours": "Flexible hours",
  "o_offers_remote": "Work from home",
  "q_closes": "When do applications close?"
 },
 "am": {
  "langAgain": "እባክዎ የቋንቋዎን ስም እንደገና ይናገሩ።",
  "langSelf": "ለአማርኛ «አማርኛ» ይበሉ፤ ወይም «አማርኛ» የሚለውን ቁልፍ ይጫኑ።",
  "raAsk": "ይህ ገጽ እንዲነበብልዎ ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ፤ ወይም አንድ ቁልፍ ይጫኑ። «አዎ» ከመረጡ ወይም በኋላ «ተናገር» ከተጫኑ አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው ሊልክ ይችላል። «አይ» መርጠው በምትኩ መጻፍ ይችላሉ።",
  "raAgain": "መልስ አልሰማንም። እንደ «አይ» እንወስደዋለን። እንዲነበብልዎ ከፈለጉ አሁን «አዎ» ይበሉ ወይም «አዎ» የሚለውን ይጫኑ።",
  "welcome": "እንኳን ደህና መጡ! ለመመዝገብና ዕድሎችን ለማግኘት ቀለል ያለ መንገድ። ጀምር. በድምፅ ጀምር. አንብቡልኝ. በቁልፍ ሰሌዳ፦ ወደ ታች ለመሄድ Tab፣ ወደ ላይ ለመመለስ Shift እና Tab፣ ለመምረጥ Space ወይም Enter፣ ድምፁን ለማቆም Escape ይጫኑ። ለመጀመር «ጀምር» ይበሉ።",
  "prefs": "ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ? አማራጭ ነው። መዝለል ይችላሉ። 1: ትልቅ ጽሑፍ. 2: ከምርጫዎች ጋር ሥዕሎች. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
  "fullName": "ሙሉ ስምዎ ማነው? በየቀኑ የሚጠቀሙበት ስም በቂ ነው። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "contact": "ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው? ስለዚህ ፕሮግራም ለማግኘት ብቻ ነው የሚያገለግለው። ስልክ ቁጥር በዜሮ የሚጀምር ባለ አሥር አሃዝ ነው። መናገር ወይም መጻፍ ይችላሉ። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "idRoute": "ማንነትዎን እንዴት ማሳየት ይፈልጋሉ? 1: ቀበሌ መታወቂያ ወይም ፓስፖርት. 2: የስደተኛ ወይም ተመላሽ መታወቂያ. 3: ሌላ ሰነድ. 4: ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "support": "ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ። ይህን መዝለል ይችላሉ። ማስረጃ አያስፈልግም። አዘጋጆቹ ብቻ ያዩታል፤ ለእርስዎ እገዛ ለማዘጋጀት ብቻ። 1: ስክሪን ሪደር እጠቀማለሁ. 2: ትልቅ ጽሑፍ. 3: መልሶቼን በድምፅ መናገር እመርጣለሁ. 4: የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ. 5: በቪዲዮዎች ላይ የጽሑፍ ትርጉም. 6: በቋንቋዬ አስተርጓሚ. 7: ለፈተናና ለተግባራት ተጨማሪ ጊዜ. 8: ቀላል ቃላትና ሥዕሎች. 9: እባክዎ ደውለው ያግዙኝ. 10: መናገር አልፈልግም. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
  "needs": "በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ። ሚስጥራዊ ነው። በመሣሪያዎ ላይ ብቻ ይቆያል፤ ተስማሚ ሥራዎችን ለማሳየት ብቻ ነው። 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
  "why": "ይህን ሥራ ለምን ይፈልጋሉ? ጥቂት ቃላት በቂ ናቸው። በድምፅ መናገርም ይችላሉ። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "job": "የሥራው መጠሪያ ምንድን ነው? መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "offers": "ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል? 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
  "closes": "ማመልከቻ መቼ ይዘጋል? አማራጭ ነው። በኢትዮጵያ አቆጣጠር። ወሩን ብቻ ካወቁ ለቀኑ «እርግጠኛ አይደለሁም» ይምረጡ። እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።",
  "errNeed": "እባክዎ ይህን ጥያቄ ይመልሱ ወይም ተመለስ ይጫኑ።",
  "errBad": "እባክዎ በዜሮ የሚጀምር ባለ አሥር አሃዝ ስልክ ቁጥር ይጻፉ፤ ወይም «@» ምልክት ያለው ኢሜይል አድራሻ ይጻፉ።",
  "errFail": "መልሶችዎን መላክ አልቻልንም። ምንም አልጠፋም። እባክዎ እንደገና ይሞክሩ።",
  "unclear": "ይቅርታ፣ አልገባኝም። እባክዎ የምርጫዎን ቁጥር ይናገሩ።",
  "noneSel": "ምንም አልተመረጠም። ቁጥር ወይም ስም ይናገሩ፤ ወይም «ዝለል» ይበሉ።",
  "idle": "አልሰማንዎትም። ትልቁን «ተናገር» ቁልፍ ይጫኑ፤ ወይም ኪቦርድ ለመጠቀም «ማንበብ አቁም» ይጫኑ።",
  "sayWelcome": "ለመጀመር «ጀምር» ይበሉ።",
  "reviewAsk": "መልሶችዎን ማስገባት ይፈልጋሉ? ለማስገባት «አዎ»፣ አንድ ነገር ለመቀየር «አይ» ይበሉ።",
  "heardGeneric": "መልስዎን ሰምተናል። በማያ ገጹ ላይ ይታያል። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።",
  "choseA": "የመረጡት",
  "choseB": "ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።",
  "doneNext": "ለመቀጠል «ቀጥል» ይበሉ።",
  "errConsentNeed": "ከመላክዎ በፊት ለመስማማት ሳጥኑን ምልክት ያድርጉ፤ ወይም ተመለስ ይጫኑ።",
  "errDateBad": "እባክዎ ወር ይምረጡ፤ ወይም ቀኑን ለመዝለል ቀንና ዓመትን «እርግጠኛ አይደለሁም» ያድርጉ።",
  "draftH": "እንኳን ደህና ተመለሱ ካለፈው ጊዜ መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል። ካቆምኩበት ቀጥል እንደገና ጀምር",
  "queued": "ከመስመር ውጭ ነዎት። መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል፤ መስመር ላይ ሲመለሱ ይላካሉ።",
  "sentLater": "የተቀመጡት መልሶችዎ አሁን ተልከዋል።",
  "tapToHear": "ጥያቄዎቹን ለመስማት ማንኛውንም ቁልፍ ይጫኑ ወይም ማያውን ይንኩ።",
  "n10": "አሥር",
  "n0": "ዜሮ",
  "n1": "አንድ",
  "n2": "ሁለት",
  "n3": "ሦስት",
  "n4": "አራት",
  "n5": "አምስት",
  "n6": "ስድስት",
  "n7": "ሰባት",
  "n8": "ስምንት",
  "n9": "ዘጠኝ",
  "reviewH": "መልሶችዎን ያረጋግጡ",
  "skipped": "(ተዘሏል)",
  "reviewKeys": "መልስ በቁልፍ ሰሌዳ ለመቀየር፣ የመልሱ «ቀይር» ቁልፍ ላይ እስኪደርሱ Tab ይጫኑ፤ ከዚያ Enter ይጫኑ።",
  "consentOrg": "እነዚህን መልሶች ለየዚህ ድረ-ገጽ አዘጋጆች ለመላክ እስማማለሁ።",
  "consentSendA": "እነዚህን መልሶች ለ",
  "consentSendB": " ለመላክ እስማማለሁ።",
  "consentSupport": "የእገዛ ምርጫዎቼንም እገዛ እንዲያዘጋጁ ለአዘጋጆቹ አጋራ። ይህን ባዶ ከተዉት የእገዛ ምርጫዎችዎ አይላኩም።",
  "askSupport": "የእገዛ ምርጫ መርጠዋል። እገዛ እንዲያዘጋጁ የእገዛ ምርጫዎችዎን ለአዘጋጆቹም ማጋራት ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ።",
  "heardA": "የሰማነው",
  "heardB": "ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።",
  "display": "ቀለምና የጽሑፍ መጠን",
  "textSize": "የጽሑፍ መጠን",
  "th_auto": "እንደ መሣሪያዬ",
  "th_standard": "መደበኛ",
  "th_dark": "ጨለማ",
  "th_contrast": "ከፍተኛ ንፅፅር (ጥቁርና ነጭ)",
  "th_rg": "ሰማያዊና ብርቱካናማ (ቀይና አረንጓዴን ለማይለዩ)",
  "th_by": "ደማቅ አረንጓዴና ቀይ (ሰማያዊና ቢጫን ለማይለዩ)",
  "reviewFix": "ወደ መጀመሪያው ጥያቄ ለመመለስ «እንደገና ጀምር» ይበሉ፤ ወይም መቀየር የሚፈልጉትን ጥያቄ ቁጥር ይናገሩ።",
  "done": "እናመሰግናለን። መልሶችዎን ተቀብለናል።",
  "speakNow": "አሁን ይናገሩ።",
  "sel": "ተመርጧል",
  "unsel": "አልተመረጠም",
  "langName": "አማርኛ",
  "b_next": "ቀጥል",
  "b_back": "ተመለስ",
  "b_skip": "ዝለል",
  "b_read": "አንብብልኝ",
  "b_speak": "ተናገር",
  "b_readToMe": "አንብቡልኝ",
  "b_stopRead": "ማንበብ አቁም",
  "b_send": "አዎ፣ አስገባ",
  "b_noChange": "አይ፣ አንድ ነገር ልቀይር",
  "b_restart": "እንደገና ጀምር",
  "b_change": "ቀይር",
  "b_start": "ጀምር",
  "b_startVoice": "በድምፅ ጀምር",
  "b_raYes": "አዎ፣ ይነበብልኝ",
  "b_raNo": "አይ፣ አያስፈልግም",
  "b_draftGo": "ካቆምኩበት ቀጥል",
  "q_prefs": "ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ?",
  "o_prefs_large": "ትልቅ ጽሑፍ",
  "o_prefs_simple": "ከምርጫዎች ጋር ሥዕሎች",
  "q_fullName": "ሙሉ ስምዎ ማነው?",
  "q_contact": "ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው?",
  "q_idRoute": "ማንነትዎን እንዴት ማሳየት ይፈልጋሉ?",
  "o_idRoute_kebele": "ቀበሌ መታወቂያ ወይም ፓስፖርት",
  "o_idRoute_refugee": "የስደተኛ ወይም ተመላሽ መታወቂያ",
  "o_idRoute_other": "ሌላ ሰነድ",
  "o_idRoute_refer": "ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ",
  "q_support": "ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ።",
  "o_support_screenreader": "ስክሪን ሪደር እጠቀማለሁ",
  "o_support_large": "ትልቅ ጽሑፍ",
  "o_support_voice": "መልሶቼን በድምፅ መናገር እመርጣለሁ",
  "o_support_sign": "የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ",
  "o_support_captions": "በቪዲዮዎች ላይ የጽሑፍ ትርጉም",
  "o_support_interp": "በቋንቋዬ አስተርጓሚ",
  "o_support_time": "ለፈተናና ለተግባራት ተጨማሪ ጊዜ",
  "o_support_simple": "ቀላል ቃላትና ሥዕሎች",
  "o_support_human": "እባክዎ ደውለው ያግዙኝ",
  "o_support_prefer": "መናገር አልፈልግም",
  "q_needs": "በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ።",
  "o_needs_stepfree": "ከደረጃ ነፃ የሥራ ቦታ",
  "o_needs_reader": "ለስክሪን ሪደር ተስማሚ መሣሪያዎች",
  "o_needs_interp": "የምልክት ቋንቋ አስተርጓሚ",
  "o_needs_hours": "ተለዋዋጭ የሥራ ሰዓት",
  "o_needs_remote": "ከቤት መሥራት",
  "q_role": "የትኛውን ሥራ እየጠየቁ ነው?",
  "q_why": "ይህን ሥራ ለምን ይፈልጋሉ?",
  "q_job": "የሥራው መጠሪያ ምንድን ነው?",
  "q_offers": "ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል?",
  "o_offers_stepfree": "ከደረጃ ነፃ የሥራ ቦታ",
  "o_offers_reader": "ለስክሪን ሪደር ተስማሚ መሣሪያዎች",
  "o_offers_interp": "የምልክት ቋንቋ አስተርጓሚ",
  "o_offers_hours": "ተለዋዋጭ የሥራ ሰዓት",
  "o_offers_remote": "ከቤት መሥራት",
  "q_closes": "ማመልከቻ መቼ ይዘጋል?"
 },
 "om": {
  "langSelf": "Afaan Oromoo filachuuf 'Afaan Oromoo' jedhi, ykn qabduu Afaan Oromoo tuqi.",
  "raAsk": "Fuulli kun sagaleedhaan akka siif dubbifamu barbaaddaa? Maaloo Eeyyee ykn Lakki jedhi, ykn qabduu tokko tuqi. Eeyyee yoo filatte, ykn booda qabduu Dubbadhu yoo tuqxe, barbaadduun kee sagalee kee gara barreeffamaatti jijjiiruuf dhiyeessaa isaatti erguu danda'a. Lakki filattee barreessuu dandeessa.",
  "raAgain": "Deebii hin dhageenye, kanaaf akka Lakkiitti fudhanna. Fuulli akka siif dubbifamu yoo barbaadde, amma Eeyyee jedhi, ykn qabduu Eeyyee tuqi.",
  "welcome": "Baga nagaan dhuftan! Karaa salphaa itti galmooftanii carraa argattan. Jalqabi. Sagaleedhaan jalqabi. Naaf dubbisi. Kiiboordii irratti: gara gadiitti deemuuf Tab, gara oliitti deebi'uuf Shift fi Tab, filachuuf Space ykn Enter, sagalee dhaabuuf Escape tuqi. Jalqabuuf Jalqabi jedhi.",
  "prefs": "Unka kana akkamitti fayyadamuu barbaadda? Dirqama miti. Irra darbuu dandeessa. 1: Barreeffama guddaa. 2: Filannoo cinaatti fakkii. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
  "fullName": "Maqaan kee guutuun eenyu? Maqaan guyyaa guyyaan itti fayyadamtu gahaadha. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "contact": "Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya? Waa'ee sagantaa kanaa qofa si quunnamuuf. Lakkoofsi bilbilaa dijiitii 10 qaba, 0n jalqaba. Dubbachuu ykn barreessuu dandeessa. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "idRoute": "Eenyummaa kee akkamitti agarsiisuu barbaadda? 1: Waraqaa eenyummaa gandaa ykn paaspoortii. 2: Waraqaa eenyummaa baqataa ykn deebi'aa. 3: Sanada biraa. 4: Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "support": "Deeggarsa akkamii si gargaara? Kamiyyuu filadhu. Irra darbuu dandeessa. Ragaan hin barbaachisu. Qindeessitoota qofatu arga, deeggarsa siif qopheessuuf qofa. 1: Dubbisaa iskiriinii nan fayyadama. 2: Barreeffama guddaa. 3: Deebii koo dubbachuu nan filadha. 4: Hiikaa Afaan Mallattoo Itoophiyaa. 5: Barreeffama viidiyoo irratti. 6: Hiikaa afaan kootiin. 7: Qormaataa fi hojiif yeroo dabalataa. 8: Jechoota salphaa fi fakkiiwwan. 9: Maaloo na gargaaruuf natti bilbilaa. 10: Dubbachuu hin barbaadu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
  "needs": "Hojii irratti deeggarsa akkamii si barbaachisa? Kamiyyuu filadhu. Dhuunfaa. Kun meeshaa kee irratti hafa, hojii si mijatu agarsiisuuf qofa itti fayyadamna. 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
  "why": "Hojii kana maaliif barbaadda? Jechoota muraasni gahaadha. Dubbachuus dandeessa. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "job": "Maqaan hojii kanaa maali? Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "offers": "Hojiin kun mijeessuu akkamii dhiyeessuu danda'a? 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
  "closes": "Iyyannoon yoom cufama? Dirqama miti. Lakkoofsa Itoophiyaa. Ji'a qofa yoo beekte, guyyaaf 'Hin beeku' filadhu. Maaloo deebii kee saanduqa keessatti barreessi. Achiis Enter ykn qabduu Itti fufi tuqi.",
  "errNeed": "Maaloo gaaffii kana deebisi, ykn Duubatti tuqi.",
  "errBad": "Maaloo lakkoofsa bilbilaa dijiitii 10 qabu kan zeeroon jalqabu, ykn teessoo imeelii mallattoo @ qabu barreessi.",
  "errFail": "Deebii kee erguu hin dandeenye. Homtuu hin badne. Maaloo irra deebi'ii yaali.",
  "unclear": "Dhiifama, hin hubanne. Maaloo lakkoofsa filannoo keetii jedhi.",
  "noneSel": "Homtuu hin filatamne. Lakkoofsa ykn maqaa jedhi, ykn Irra darbi jedhi.",
  "idle": "Si hin dhageenye. Qabduu guddaa Dubbadhu tuqi, ykn kiiboordii fayyadamuuf Dubbisuu dhaabi tuqi.",
  "sayWelcome": "Jalqabuuf Jalqabi jedhi.",
  "reviewAsk": "Deebii kee erguu barbaaddaa? Erguuf Eeyyee, waa jijjiiruuf Lakki jedhi.",
  "heardGeneric": "Deebii kee dhageenyeerra. Iskiriinii irratti mul'ata. Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.",
  "choseA": "Kan filatte",
  "choseB": "Itti fufuuf Itti fufi jedhi, ykn ammas filadhu.",
  "doneNext": "Itti fufuuf Itti fufi jedhi.",
  "errConsentNeed": "Maaloo osoo hin ergin dura walii galuuf saanduqa mallattoo godhi, ykn Duubatti tuqi.",
  "errDateBad": "Maaloo ji'a filadhu, ykn guyyaa fi bara 'Hin beeku' godhi.",
  "draftH": "Baga nagaan deebitan Deebiin kee yeroo darbe meeshaa kana irratti kuufameera. Iddoon dhaabe irraa itti fufi Irra deebi'ii jalqabi",
  "queued": "Ati toora ala jirta. Deebiin kee meeshaa kana irratti kuufameera, yeroo toora irratti deebitu ni ergama.",
  "sentLater": "Deebiin kee kuufame amma ergameera.",
  "tapToHear": "Gaaffilee dhaga'uuf qabduu kamiyyuu tuqi ykn iskiriinii tuqi.",
  "n10": "Kudhan",
  "n0": "Zeeroo",
  "n1": "Tokko",
  "n2": "Lama",
  "n3": "Sadii",
  "n4": "Afur",
  "n5": "Shan",
  "n6": "Jaha",
  "n7": "Torba",
  "n8": "Saddeet",
  "n9": "Sagal",
  "reviewH": "Deebii kee mirkaneessi",
  "skipped": "(darbameera)",
  "reviewKeys": "Deebii kiiboordiin jijjiiruuf, hanga qabduu Jijjiiri isaa geessutti Tab tuqi, achiis Enter tuqi.",
  "consentOrg": "Deebii kana gara qindeessitoota marsariitii kanaa erguuf nan walii gala.",
  "consentSendA": "Deebii kana gara ",
  "consentSendB": " erguuf nan walii gala.",
  "consentSupport": "Filannoo deeggarsa koos qindeessitootaaf qoodi, akka gargaarsa qopheessaniif. Kana duwwaa yoo dhiifte, filannoon deeggarsa kee hin ergamu.",
  "askSupport": "Deeggarsa filatteetta. Akka gargaarsa qopheessaniif filannoo deeggarsa kee qindeessitootaaf qooduu barbaaddaa? Eeyyee ykn Lakki jedhi.",
  "heardA": "Kan dhageenye",
  "heardB": "Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.",
  "display": "Halluu fi guddina barreeffamaa",
  "textSize": "Guddina barreeffamaa",
  "th_auto": "Akkuma meeshaa koo",
  "th_standard": "Idilee",
  "th_dark": "Dukkana",
  "th_contrast": "Garaagarummaa olaanaa (gurraacha fi adii)",
  "th_rg": "Cuquliisaa fi burtukaanii (warra diimaa fi magariisa adda hin baafneef)",
  "th_by": "Magariisa cuquliisaa fi diimaa (warra cuquliisaa fi keelloo adda hin baafneef)",
  "reviewFix": "Gara gaaffii jalqabaatti deebi'uuf Irra deebi'ii jalqabi jedhi, ykn lakkoofsa gaaffii jijjiiruu barbaaddu jedhi.",
  "done": "Galatoomi. Deebii kee argannee jirra.",
  "speakNow": "Amma dubbadhu.",
  "sel": "filatameera",
  "unsel": "hin filatamne",
  "langName": "Afaan Oromoo",
  "b_next": "Itti fufi",
  "b_back": "Duubatti",
  "b_skip": "Irra darbi",
  "b_read": "Sagaleedhaan dubbisi",
  "b_speak": "Dubbadhu",
  "b_readToMe": "Naaf dubbisi",
  "b_stopRead": "Dubbisuu dhaabi",
  "b_send": "Eeyyee, ergi",
  "b_noChange": "Lakki, waan tokko jijjiira",
  "b_restart": "Irra deebi'ii jalqabi",
  "b_change": "Jijjiiri",
  "b_start": "Jalqabi",
  "b_startVoice": "Sagaleedhaan jalqabi",
  "b_raYes": "Eeyyee, naaf dubbisi",
  "b_raNo": "Lakki, galatoomi",
  "b_draftGo": "Iddoon dhaabe irraa itti fufi",
  "q_prefs": "Unka kana akkamitti fayyadamuu barbaadda?",
  "o_prefs_large": "Barreeffama guddaa",
  "o_prefs_simple": "Filannoo cinaatti fakkii",
  "q_fullName": "Maqaan kee guutuun eenyu?",
  "q_contact": "Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya?",
  "q_idRoute": "Eenyummaa kee akkamitti agarsiisuu barbaadda?",
  "o_idRoute_kebele": "Waraqaa eenyummaa gandaa ykn paaspoortii",
  "o_idRoute_refugee": "Waraqaa eenyummaa baqataa ykn deebi'aa",
  "o_idRoute_other": "Sanada biraa",
  "o_idRoute_refer": "Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa",
  "q_support": "Deeggarsa akkamii si gargaara? Kamiyyuu filadhu.",
  "o_support_screenreader": "Dubbisaa iskiriinii nan fayyadama",
  "o_support_large": "Barreeffama guddaa",
  "o_support_voice": "Deebii koo dubbachuu nan filadha",
  "o_support_sign": "Hiikaa Afaan Mallattoo Itoophiyaa",
  "o_support_captions": "Barreeffama viidiyoo irratti",
  "o_support_interp": "Hiikaa afaan kootiin",
  "o_support_time": "Qormaataa fi hojiif yeroo dabalataa",
  "o_support_simple": "Jechoota salphaa fi fakkiiwwan",
  "o_support_human": "Maaloo na gargaaruuf natti bilbilaa",
  "o_support_prefer": "Dubbachuu hin barbaadu",
  "q_needs": "Hojii irratti deeggarsa akkamii si barbaachisa? Kamiyyuu filadhu.",
  "o_needs_stepfree": "Bakka hojii gulantaa hin qabne",
  "o_needs_reader": "Meeshaalee dubbisaa iskiriinii waliin hojjetan",
  "o_needs_interp": "Hiikaa afaan mallattoo",
  "o_needs_hours": "Sa'aatii hojii jijjiiramaa",
  "o_needs_remote": "Mana irraa hojjechuu",
  "q_role": "Hojii kamiif iyyachaa jirta?",
  "q_why": "Hojii kana maaliif barbaadda?",
  "q_job": "Maqaan hojii kanaa maali?",
  "q_offers": "Hojiin kun mijeessuu akkamii dhiyeessuu danda'a?",
  "o_offers_stepfree": "Bakka hojii gulantaa hin qabne",
  "o_offers_reader": "Meeshaalee dubbisaa iskiriinii waliin hojjetan",
  "o_offers_interp": "Hiikaa afaan mallattoo",
  "o_offers_hours": "Sa'aatii hojii jijjiiramaa",
  "o_offers_remote": "Mana irraa hojjechuu",
  "q_closes": "Iyyannoon yoom cufama?"
 },
 "ti": {
  "langSelf": "ንትግርኛ «ትግርኛ» በሉ፣ ወይ «ትግርኛ» ዝብል መጠወቒ ጠውቑ።",
  "raAsk": "እዚ ገጽ ክንበበልኩም ትደልዩ ዶ? በጃኹም «እወ» ወይ «ኣይፋል» በሉ፣ ወይ ሓደ መጠወቒ ጠውቑ። «እወ» እንተ መሪጽኩም፣ ወይ ደሓር «ተዛረብ» እንተ ጠዊቕኩም፣ መርበብኩም ድምጽኹም ናብ ጽሑፍ ንምቕያር ናብ ኣቕራቢኡ ክሰዶ ይኽእል። «ኣይፋል» መሪጽኩም ክትጽሕፉ ትኽእሉ ኢኹም።",
  "raAgain": "መልሲ ኣይሰማዕናን፣ ስለዚ ከም «ኣይፋል» ንወስዶ። ገጹ ክንበበልኩም እንተ ደሊኹም፣ ሕጂ «እወ» በሉ፣ ወይ «እወ» ዝብል መጠወቒ ጠውቑ።",
  "welcome": "እንቋዕ ብደሓን መጻእኩም! ንምምዝጋብን ዕድላት ንምርካብን ቀሊል መንገዲ። ጀምር. ብድምጺ ጀምር. ኣንብቡለይ. ብኪቦርድ፦ ናብ ታሕቲ ንምኻድ Tab፣ ናብ ላዕሊ ንምምላስ Shift ምስ Tab፣ ንምምራጽ Space ወይ Enter፣ ድምጺ ንምቁራጽ Escape ጠውቑ። ንምጅማር «ጀምር» በሉ።",
  "prefs": "ነዚ ቅጥዒ ብኸመይ ክትጥቀሙሉ ትደልዩ? ግዴታ ኣይኮነን። ክትሓልፍዎ ትኽእሉ ኢኹም። 1: ዓቢ ጽሑፍ. 2: ምስ ምርጫታት ስእልታት. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
  "fullName": "ምሉእ ስምኩም መን እዩ? እቲ መዓልታዊ እትጥቀሙሉ ስም ይኣክል። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "contact": "ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል? ብዛዕባ እዚ መደብ ንምርካብኩም ጥራይ። ቁጽሪ ስልኪ 10 ኣሃዝ ኣለዎ፣ ብ0 ይጅምር። ክትዛረቡዎ ወይ ክትጽሕፉዎ ትኽእሉ ኢኹም። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "idRoute": "መንነትኩም ብኸመይ ከተርእዩ ትደልዩ? 1: መንነት ቀበሌ ወይ ፓስፖርት. 2: መንነት ስደተኛ ወይ ተመላሲ. 3: ካልእ ሰነድ. 4: መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "support": "እንታይ ደገፍ ይሕግዘኩም? ዝኾነ ምረጹ። ክትሓልፍዎ ትኽእሉ ኢኹም። መረጋገጺ ኣየድልን። ኣወሃሃድቲ ጥራይ እዮም ዝርእይዎ፣ ንዓኹም ደገፍ ንምድላው ጥራይ። 1: ስክሪን ሪደር እጥቀም. 2: ዓቢ ጽሑፍ. 3: መልስታተይ ብድምጺ ክዛረብ እመርጽ. 4: ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ. 5: ኣብ ቪድዮታት ጽሑፍ. 6: ብቋንቋየ ተርጓሚ. 7: ንፈተናታትን ዕማማትን ተወሳኺ ግዜ. 8: ቀለልቲ ቃላትን ስእልታትን. 9: በጃኹም ደዊልኩም ሓግዙኒ. 10: ክገልጽ ኣይደልን. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
  "needs": "ኣብ ስራሕ እንታይ ደገፍ የድልየኩም? ዝኾነ ምረጹ። ብሕታዊ እዩ። ኣብ መሳርሒኹም ጥራይ ይጸንሕ፣ ተስማዕቲ ስራሓት ንምርኣይ ጥራይ ይጥቀመሉ። 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
  "why": "ነዚ ስራሕ ስለምንታይ ትደልይዎ? ውሑዳት ቃላት ይኣኽሉ። ብድምጺ እውን ክትዛረቡ ትኽእሉ ኢኹም። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "job": "ሽም እቲ ስራሕ እንታይ እዩ? ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "offers": "እዚ ስራሕ እንታይ ምትዕርራያት ከቕርብ ይኽእል? 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
  "closes": "ምዝገባ ማመልከቻ መዓስ ይዕጾ? ግዴታ ኣይኮነን። ብኣቆጻጽራ ኢትዮጵያ። ወርሒ ጥራይ እንተ ፈሊጥኩም፣ ንመዓልቲ «ርግጸኛ ኣይኮንኩን» ምረጹ። በጃኹም መልስኹም ኣብቲ ሳንዱቕ ጽሓፉ። ድሕሪኡ Enter ወይ «ቀጽል» ዝብል መጠወቒ ጠውቑ።",
  "errNeed": "በጃኹም ነዚ ሕቶ ምለሱ፣ ወይ «ተመለስ» ጠውቑ።",
  "errBad": "በጃኹም ብዜሮ ዚጅምር 10 ኣሃዝ ዘለዎ ቁጽሪ ስልኪ፣ ወይ «@» ምልክት ዘለዎ ኢመይል ጽሓፉ።",
  "errFail": "መልስታትኩም ክንሰድድ ኣይከኣልናን። ዋላ ሓንቲ ኣይጠፍአን። በጃኹም ደጊምኩም ፈትኑ።",
  "unclear": "ይቕሬታ፣ ኣይተረዳእኩን። በጃኹም ቁጽሪ ምርጫኹም በሉ።",
  "noneSel": "ዋላ ሓደ ኣይተመርጸን። ቁጽሪ ወይ ስም በሉ፣ ወይ «ሕለፍ» በሉ።",
  "idle": "ኣይሰማዕናኩምን። ነቲ ዓቢ «ተዛረብ» መጠወቒ ጠውቑ፣ ወይ ኪቦርድ ንምጥቃም «ምንባብ ኣቋርጽ» ጠውቑ።",
  "sayWelcome": "ንምጅማር «ጀምር» በሉ።",
  "reviewAsk": "መልስታትኩም ከተረክቡ ትደልዩ ዶ? ንምርካብ «እወ»፣ ገለ ነገር ንምቕያር «ኣይፋል» በሉ።",
  "heardGeneric": "መልስኹም ሰሚዕና። ኣብ ስክሪን ይርአ ኣሎ። ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።",
  "choseA": "ዝመረጽኩምዎ",
  "choseB": "ንምቕጻል «ቀጽል» በሉ፣ ወይ ደጊምኩም ምረጹ።",
  "doneNext": "ንምቕጻል «ቀጽል» በሉ።",
  "errConsentNeed": "በጃኹም ቅድሚ ምልኣኽ ንምስምማዕ ነቲ ሳንዱቕ ምልክት ግበሩ፣ ወይ «ተመለስ» ጠውቑ።",
  "errDateBad": "በጃኹም ወርሒ ምረጹ፣ ወይ መዓልትን ዓመትን «ርግጸኛ ኣይኮንኩን» ግበሩ።",
  "draftH": "እንቋዕ ብደሓን ተመለስኩም መልስታትኩም ካብ ዝሓለፈ ግዜ ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ። ካብ ዝኣቋረጽኩዎ ቀጽል ደጊምካ ጀምር",
  "queued": "ካብ መስመር ወጻኢ ኢኹም። መልስታትኩም ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ፣ ናብ መስመር ምስ ተመለስኩም ክለኣኹ እዮም።",
  "sentLater": "እቶም ዝተዓቀቡ መልስታትኩም ሕጂ ተላኢኾም።",
  "tapToHear": "ሕቶታት ንምስማዕ ዝኾነ መጠወቒ ጠውቑ ወይ ስክሪን ተንክፉ።",
  "n10": "ዓሰርተ",
  "n0": "ዜሮ",
  "n1": "ሓደ",
  "n2": "ክልተ",
  "n3": "ሰለስተ",
  "n4": "ኣርባዕተ",
  "n5": "ሓሙሽተ",
  "n6": "ሽዱሽተ",
  "n7": "ሸውዓተ",
  "n8": "ሸሞንተ",
  "n9": "ትሽዓተ",
  "reviewH": "መልስታትኩም ኣረጋግጹ",
  "skipped": "(ተሓሊፉ)",
  "reviewKeys": "መልሲ ብኪቦርድ ንምቕያር፣ ክሳብ «ቀይር» ዝብል መጠወቒኡ ትበጽሑ Tab ጠውቑ፣ ድሕሪኡ Enter ጠውቑ።",
  "consentOrg": "ነዚ መልስታት ናብ ኣወሃሃድቲ እዚ መርበብ ክለኣኽ እሰማማዕ።",
  "consentSendA": "ነዚ መልስታት ናብ ",
  "consentSendB": " ክለኣኽ እሰማማዕ።",
  "consentSupport": "ምርጫታት ደገፈይ እውን ንኣወሃሃድቲ ኣካፍል፣ ሓገዝ ምእንቲ ከዳልዉ። እዚ ባዶ እንተ ገዲፍኩምዎ ምርጫታት ደገፍኩም ኣይለኣኽን።",
  "askSupport": "ደገፍ መሪጽኩም ኣለኹም። ሓገዝ ምእንቲ ከዳልዉ ምርጫታት ደገፍኩም ንኣወሃሃድቲ ከተካፍሉ ትደልዩ ዶ? «እወ» ወይ «ኣይፋል» በሉ።",
  "heardA": "ዝሰማዕናዮ",
  "heardB": "ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።",
  "display": "ሕብርን ዓቐን ጽሑፍን",
  "textSize": "ዓቐን ጽሑፍ",
  "th_auto": "ከም መሳርሒየ",
  "th_standard": "ልሙድ",
  "th_dark": "ጸሊም",
  "th_contrast": "ልዑል ፍልልይ (ጸሊምን ጻዕዳን)",
  "th_rg": "ሰማያዊን ብርቱኳናውን (ቀይሕን ቀጠልያን ንዘይፈልዩ)",
  "th_by": "ሰማያዊ-ቀጠልያን ቀይሕን (ሰማያዊን ብጫን ንዘይፈልዩ)",
  "reviewFix": "ናብ ቀዳማይ ሕቶ ንምምላስ «ደጊምካ ጀምር» በሉ፣ ወይ ቁጽሪ ክትቕይርዎ እትደልዩ ሕቶ በሉ።",
  "done": "የቐንየልና። መልስታትኩም ተቐቢልናዮ።",
  "speakNow": "ሕጂ ተዛረቡ።",
  "sel": "ተመሪጹ",
  "unsel": "ኣይተመርጸን",
  "langName": "ትግርኛ",
  "b_next": "ቀጽል",
  "b_back": "ተመለስ",
  "b_skip": "ሕለፍ",
  "b_read": "ኣንብበለይ",
  "b_speak": "ተዛረብ",
  "b_readToMe": "ኣንብቡለይ",
  "b_stopRead": "ምንባብ ኣቋርጽ",
  "b_send": "እወ፣ ኣረክብ",
  "b_noChange": "ኣይፋል፣ ገለ ክቕይር",
  "b_restart": "ደጊምካ ጀምር",
  "b_change": "ቀይር",
  "b_start": "ጀምር",
  "b_startVoice": "ብድምጺ ጀምር",
  "b_raYes": "እወ፣ ኣንብቡለይ",
  "b_raNo": "ኣይፋል፣ የቐንየለይ",
  "b_draftGo": "ካብ ዝኣቋረጽኩዎ ቀጽል",
  "q_prefs": "ነዚ ቅጥዒ ብኸመይ ክትጥቀሙሉ ትደልዩ?",
  "o_prefs_large": "ዓቢ ጽሑፍ",
  "o_prefs_simple": "ምስ ምርጫታት ስእልታት",
  "q_fullName": "ምሉእ ስምኩም መን እዩ?",
  "q_contact": "ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል?",
  "q_idRoute": "መንነትኩም ብኸመይ ከተርእዩ ትደልዩ?",
  "o_idRoute_kebele": "መንነት ቀበሌ ወይ ፓስፖርት",
  "o_idRoute_refugee": "መንነት ስደተኛ ወይ ተመላሲ",
  "o_idRoute_other": "ካልእ ሰነድ",
  "o_idRoute_refer": "መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ",
  "q_support": "እንታይ ደገፍ ይሕግዘኩም? ዝኾነ ምረጹ።",
  "o_support_screenreader": "ስክሪን ሪደር እጥቀም",
  "o_support_large": "ዓቢ ጽሑፍ",
  "o_support_voice": "መልስታተይ ብድምጺ ክዛረብ እመርጽ",
  "o_support_sign": "ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ",
  "o_support_captions": "ኣብ ቪድዮታት ጽሑፍ",
  "o_support_interp": "ብቋንቋየ ተርጓሚ",
  "o_support_time": "ንፈተናታትን ዕማማትን ተወሳኺ ግዜ",
  "o_support_simple": "ቀለልቲ ቃላትን ስእልታትን",
  "o_support_human": "በጃኹም ደዊልኩም ሓግዙኒ",
  "o_support_prefer": "ክገልጽ ኣይደልን",
  "q_needs": "ኣብ ስራሕ እንታይ ደገፍ የድልየኩም? ዝኾነ ምረጹ።",
  "o_needs_stepfree": "ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ",
  "o_needs_reader": "ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት",
  "o_needs_interp": "ተርጓሚ ቋንቋ ምልክት",
  "o_needs_hours": "ተዓጻጻፊ ሰዓታት ስራሕ",
  "o_needs_remote": "ካብ ገዛ ምስራሕ",
  "q_role": "ንኣየናይ ስራሕ ኢኹም እትሓቱ ዘለኹም?",
  "q_why": "ነዚ ስራሕ ስለምንታይ ትደልይዎ?",
  "q_job": "ሽም እቲ ስራሕ እንታይ እዩ?",
  "q_offers": "እዚ ስራሕ እንታይ ምትዕርራያት ከቕርብ ይኽእል?",
  "o_offers_stepfree": "ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ",
  "o_offers_reader": "ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት",
  "o_offers_interp": "ተርጓሚ ቋንቋ ምልክት",
  "o_offers_hours": "ተዓጻጻፊ ሰዓታት ስራሕ",
  "o_offers_remote": "ካብ ገዛ ምስራሕ",
  "q_closes": "ምዝገባ ማመልከቻ መዓስ ይዕጾ?"
 },
 "so": {
  "langSelf": "Af Soomaali: dheh Soomaali, ama riix badhanka Soomaali.",
  "raAsk": "Ma rabtaa in boggan laguu akhriyo? Fadlan dheh Haa ama Maya, ama riix badhan. Haddii aad doorato Haa, ama aad hadhow riixdo badhanka Hadal, browserkaagu wuxuu codkaaga u diri karaa bixiyahiisa si uu qoraal ugu beddelo. Waxaad dooran kartaa Maya oo aad qori kartaa.",
  "raAgain": "Jawaab ma aanaan maqal, sidaa darteed waxaan u qaadanaynaa Maya. Haddii aad rabto in boggan laguu akhriyo, hadda dheh Haa, ama riix badhanka Haa.",
  "welcome": "Soo dhawoow! Hab fudud oo aad isku diiwaangeliso oo aad fursado ku hesho. Bilow. Ku bilow cod. Ii akhri. Kiiboodhka: riix Tab si aad hoos ugu dhaqaaqdo, Shift iyo Tab si aad kor ugu dhaqaaqdo, Space ama Enter si aad u doorato, iyo Escape si aad u joojiso codka. Dheh Bilow si aad u bilowdo.",
  "prefs": "Sidee baad u rabtaa inaad u isticmaasho foomkan? Ikhtiyaari. Waad ka boodi kartaa. 1: Qoraal ka weyn. 2: Sawirro ku xiga doorashooyinka. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
  "fullName": "Waa maxay magacaaga oo buuxa? Magaca aad maalin walba isticmaasho waa ku filan yahay. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.",
  "contact": "Lambarkee taleefan ama iimayl ayaan isticmaali karnaa? Kaliya si laguula soo xiriiro barnaamijkan. Lambar taleefan wuxuu leeyahay 10 god, wuxuuna ku bilaabmaa 0. Waad dhihi kartaa ama qori kartaa. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.",
  "idRoute": "Sidee baad u rabtaa inaad muujiso cidda aad tahay? 1: Aqoonsiga kebele ama baasaboor. 2: Aqoonsiga qaxootiga ama soo-noqotaha. 3: Dukumenti kale. 4: Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.",
  "support": "Taageero noocee ah ayaa ku caawin lahayd? Dooro mid kasta. Waad ka boodi kartaa. Caddayn looma baahna. Kaliya qabanqaabiyayaashu ayaa arka, si ay kuugu diyaariyaan caawimaad. 1: Waxaan isticmaalaa akhriyaha shaashadda. 2: Qoraal weyn. 3: Waxaan doorbidaa inaan ku hadlo jawaabahayga. 4: Turjubaan Luqadda Calaamadaha Itoobiya. 5: Qoraal ku qoran muuqaallada. 6: Turjubaan ku hadla luqaddayda. 7: Waqti dheeraad ah oo imtixaannada iyo hawlaha. 8: Erayo fudud iyo sawirro. 9: Fadlan ii soo wac si aad ii caawiso. 10: Ma doonayo inaan sheego. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
  "needs": "Taageero noocee ah ayaad ugu baahan tahay shaqada? Dooro mid kasta. Gaar ah. Wuxuu ku jiraa qalabkaaga oo kaliya waxaa loo isticmaalaa in lagu tuso shaqooyin ku habboon. 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
  "why": "Maxaad u rabtaa shaqadan? Erayo kooban ayaa ku filan. Waad ku hadli kartaa beddelkeeda. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.",
  "job": "Waa maxay magaca shaqada? Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho.",
  "offers": "Waa maxay hagaajinta ay shaqadani bixin karto? 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
  "closes": "Goormaa la xirayaa codsiyada? Ikhtiyaari. Kalandarka Itoobiya. Haddii aad bisha oo keliya taqaanno, maalinta u dooro 'Ma hubo'. Fadlan ku qor jawaabtaada sanduuqa. Kadib riix Enter, ama riix badhanka Xiga.",
  "errNeed": "Fadlan ka jawaab su'aashan, ama riix Dib u noqo.",
  "errBad": "Fadlan qor lambar taleefan oo 10 god ah oo ku bilaabmaya eber, ama cinwaan iimayl oo leh calaamadda @.",
  "errFail": "Ma aanaan diri karin jawaabahaaga. Waxba ma lumin. Fadlan mar kale isku day.",
  "unclear": "Waan ka xumahay, ma fahmin. Fadlan dheh lambarka doorashadaada.",
  "noneSel": "Waxba lama dooran. Dheh lambar ama magac, ama dheh Ka bood.",
  "idle": "Ma aanaan ku maqal. Riix badhanka weyn ee Hadal, ama riix Jooji akhrinta si aad u isticmaasho kiiboodhka.",
  "sayWelcome": "Dheh Bilow si aad u bilowdo.",
  "reviewAsk": "Ma rabtaa inaad gudbiso jawaabahaaga? Dheh Haa si aad u gudbiso, ama Maya si aad wax u beddesho.",
  "heardGeneric": "Waan maqalnay jawaabtaada. Waxay ka muuqataa shaashadda. Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada.",
  "choseA": "Waxaad dooratay",
  "choseB": "Dheh Xiga si aad u sii socoto, ama mar kale dooro.",
  "doneNext": "Dheh Xiga si aad u sii socoto.",
  "errConsentNeed": "Fadlan calaamadee sanduuqa si aad u oggolaato ka hor intaadan dirin, ama riix Dib u noqo.",
  "errDateBad": "Fadlan dooro bil, ama maalinta iyo sanadka ka dhig 'Ma hubo'.",
  "draftH": "Ku soo dhawoow mar kale Jawaabahaagii hore waxay ku kaydsan yihiin qalabkan. Ka sii wad halkii aan ku joogsaday Dib u bilow",
  "queued": "Khadka kama jirtid. Jawaabahaaga waxay ku kaydsan yihiin qalabkan, waxaana la diri doonaa markaad khadka ku soo noqoto.",
  "sentLater": "Jawaabahaagii kaydsanaa hadda waa la diray.",
  "tapToHear": "Riix fure kasta ama taabo shaashadda si aad u maqasho su'aalaha.",
  "n10": "Toban",
  "n0": "Eber",
  "n1": "Kow",
  "n2": "Laba",
  "n3": "Saddex",
  "n4": "Afar",
  "n5": "Shan",
  "n6": "Lix",
  "n7": "Toddoba",
  "n8": "Siddeed",
  "n9": "Sagaal",
  "reviewH": "Hubi jawaabahaaga",
  "skipped": "(waa laga booday)",
  "reviewKeys": "Si aad jawaab ugu beddesho kiiboodhka, riix Tab ilaa aad gaarto badhankeeda Beddel, kadibna riix Enter.",
  "consentOrg": "Waan ku raacsanahay in jawaabahan loo diro qabanqaabiyayaasha boggan.",
  "consentSendA": "Waan ku raacsanahay in jawaabahan loo diro ",
  "consentSupport": "Sidoo kale la wadaag doorashooyinka taageerada qabanqaabiyayaasha, si ay caawimaad u diyaariyaan. Haddii aad tan banaan ka tagto, doorashooyinkaaga taageerada lama diro.",
  "askSupport": "Waxaad dooratay taageero. Ma rabtaa inaad sidoo kale la wadaagto doorashooyinkaaga taageerada qabanqaabiyayaasha, si ay caawimaad u diyaariyaan? Dheh Haa ama Maya.",
  "heardA": "Waxaan maqalnay",
  "heardB": "Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada.",
  "display": "Midabka iyo cabbirka qoraalka",
  "textSize": "Cabbirka qoraalka",
  "th_auto": "Sida qalabkayga",
  "th_standard": "Caadi",
  "th_dark": "Mugdi",
  "th_contrast": "Kala-duwanaan sare (madow iyo cad)",
  "th_rg": "Buluug iyo oranji (kuwa aan kala garan casaanka iyo cagaarka)",
  "th_by": "Cagaar-buluug iyo casaan (kuwa aan kala garan buluugga iyo jaallaha)",
  "reviewFix": "Dheh Dib u bilow si aad ugu noqoto su'aasha koowaad, ama dheh lambarka su'aasha aad rabto inaad beddesho.",
  "done": "Mahadsanid. Waan helnay jawaabahaaga.",
  "speakNow": "Hadda hadal.",
  "sel": "waa la doortay",
  "unsel": "lama dooran",
  "langName": "Soomaali",
  "b_next": "Xiga",
  "b_back": "Dib u noqo",
  "b_skip": "Ka bood",
  "b_read": "Akhri",
  "b_speak": "Hadal",
  "b_readToMe": "Ii akhri",
  "b_stopRead": "Jooji akhrinta",
  "b_send": "Haa, gudbi",
  "b_noChange": "Maya, wax baan beddelayaa",
  "b_restart": "Dib u bilow",
  "b_change": "Beddel",
  "b_start": "Bilow",
  "b_startVoice": "Ku bilow cod",
  "b_raYes": "Haa, ii akhri",
  "b_raNo": "Maya, mahadsanid",
  "b_draftGo": "Ka sii wad halkii aan ku joogsaday",
  "q_prefs": "Sidee baad u rabtaa inaad u isticmaasho foomkan?",
  "o_prefs_large": "Qoraal ka weyn",
  "o_prefs_simple": "Sawirro ku xiga doorashooyinka",
  "q_fullName": "Waa maxay magacaaga oo buuxa?",
  "q_contact": "Lambarkee taleefan ama iimayl ayaan isticmaali karnaa?",
  "q_idRoute": "Sidee baad u rabtaa inaad muujiso cidda aad tahay?",
  "o_idRoute_kebele": "Aqoonsiga kebele ama baasaboor",
  "o_idRoute_refugee": "Aqoonsiga qaxootiga ama soo-noqotaha",
  "o_idRoute_other": "Dukumenti kale",
  "o_idRoute_refer": "Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi",
  "q_support": "Taageero noocee ah ayaa ku caawin lahayd? Dooro mid kasta.",
  "o_support_screenreader": "Waxaan isticmaalaa akhriyaha shaashadda",
  "o_support_large": "Qoraal weyn",
  "o_support_voice": "Waxaan doorbidaa inaan ku hadlo jawaabahayga",
  "o_support_sign": "Turjubaan Luqadda Calaamadaha Itoobiya",
  "o_support_captions": "Qoraal ku qoran muuqaallada",
  "o_support_interp": "Turjubaan ku hadla luqaddayda",
  "o_support_time": "Waqti dheeraad ah oo imtixaannada iyo hawlaha",
  "o_support_simple": "Erayo fudud iyo sawirro",
  "o_support_human": "Fadlan ii soo wac si aad ii caawiso",
  "o_support_prefer": "Ma doonayo inaan sheego",
  "q_needs": "Taageero noocee ah ayaad ugu baahan tahay shaqada? Dooro mid kasta.",
  "o_needs_stepfree": "Goob shaqo oo aan jaranjaro lahayn",
  "o_needs_reader": "Qalab ku habboon akhriyaha shaashadda",
  "o_needs_interp": "Turjubaan luqadda calaamadaha",
  "o_needs_hours": "Saacado dabacsan",
  "o_needs_remote": "Ka shaqeyn guriga",
  "q_role": "Shaqadee ayaad codsanaysaa?",
  "q_why": "Maxaad u rabtaa shaqadan?",
  "q_job": "Waa maxay magaca shaqada?",
  "q_offers": "Waa maxay hagaajinta ay shaqadani bixin karto?",
  "o_offers_stepfree": "Goob shaqo oo aan jaranjaro lahayn",
  "o_offers_reader": "Qalab ku habboon akhriyaha shaashadda",
  "o_offers_interp": "Turjubaan luqadda calaamadaha",
  "o_offers_hours": "Saacado dabacsan",
  "o_offers_remote": "Ka shaqeyn guriga",
  "q_closes": "Goormaa la xirayaa codsiyada?"
 },
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
