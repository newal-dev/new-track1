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

CLIPS = json.loads(r'''{
 "en": {
  "langAsk": "Which language would you like to use? Say English, Amharic, Oromo, Tigrinya or Somali, or press a button.",
  "raAsk": "Would you like this page to be read aloud to you? Please say Yes or No, or press a button. If you choose Yes, or press a Speak button later, your browser may send your voice to its provider to turn it into text. You can choose No and type instead.",
  "raAgain": "We did not hear an answer, so we will take that as No. If you would like the page read aloud, please say Yes now, or press the Yes button.",
  "welcome": "Welcome! A simpler way to register and find opportunities. Start. Start with voice. Read to me. Say Start to begin.",
  "prefs": "How would you like to use this form? Optional. You can skip this. 1: Larger text. 2: Pictures next to choices. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.",
  "fullName": "What is your full name? The name you use every day is fine. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.",
  "contact": "What phone number or email can we use? Only used to contact you about this programme. A phone number has 10 digits and starts with 0. Please type your answer in the box. Then press Enter, or press the Next button.",
  "idRoute": "How would you like to show who you are? 1: Kebele ID or passport. 2: Refugee or returnee ID. 3: Another document. 4: I don't have an ID. Refer me through a partner organisation. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again.",
  "support": "What support would help you? Choose any. You can skip this. No proof needed. Only the organisers see it, and only to prepare help for you. 1: I use a screen reader. 2: Large text. 3: I prefer to speak my answers. 4: Ethiopian Sign Language interpreter. 5: Simple words and pictures. 6: Please call me to help. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.",
  "needs": "What support do you need at work? Choose any. Private. This stays on your device and is only used to show suitable jobs. 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.",
  "why": "Why do you want this job? A few words are enough. You can speak instead. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.",
  "job": "What is the job title? Speak your answer now. Say Next to continue, or Read aloud to hear this again.",
  "offers": "Which adjustments can this job offer? 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.",
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
  "n1": "One",
  "n2": "Two",
  "n3": "Three",
  "n4": "Four",
  "n5": "Five",
  "n6": "Six",
  "n7": "Seven",
  "n8": "Eight",
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
  "o_prefs_large": "Larger text",
  "o_prefs_simple": "Pictures next to choices",
  "q_fullName": "What is your full name?",
  "q_contact": "What phone number or email can we use?",
  "o_idRoute_kebele": "Kebele ID or passport",
  "o_idRoute_refugee": "Refugee or returnee ID",
  "o_idRoute_other": "Another document",
  "o_idRoute_refer": "I don't have an ID. Refer me through a partner organisation",
  "o_support_screenreader": "I use a screen reader",
  "o_support_large": "Large text",
  "o_support_voice": "I prefer to speak my answers",
  "o_support_sign": "Ethiopian Sign Language interpreter",
  "o_support_simple": "Simple words and pictures",
  "o_support_human": "Please call me to help",
  "o_needs_stepfree": "Step-free workplace",
  "o_needs_reader": "Screen-reader friendly tools",
  "o_needs_interp": "Sign language interpreter",
  "o_needs_hours": "Flexible hours",
  "o_needs_remote": "Work from home",
  "q_why": "Why do you want this job?",
  "q_job": "What is the job title?",
  "o_offers_stepfree": "Step-free workplace",
  "o_offers_reader": "Screen-reader friendly tools",
  "o_offers_interp": "Sign language interpreter",
  "o_offers_hours": "Flexible hours",
  "o_offers_remote": "Work from home"
 },
 "am": {
  "langSelf": "ለአማርኛ «Amharic» ይበሉ፤ ወይም «አማርኛ» የሚለውን ቁልፍ ይጫኑ።",
  "raAsk": "ይህ ገጽ እንዲነበብልዎ ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ፤ ወይም አንድ ቁልፍ ይጫኑ። «አዎ» ከመረጡ ወይም በኋላ «ተናገር» ከተጫኑ አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው ሊልክ ይችላል። «አይ» መርጠው በምትኩ መጻፍ ይችላሉ።",
  "raAgain": "መልስ አልሰማንም። እንደ «አይ» እንወስደዋለን። እንዲነበብልዎ ከፈለጉ አሁን «አዎ» ይበሉ ወይም «አዎ» የሚለውን ይጫኑ።",
  "welcome": "እንኳን ደህና መጡ! ለመመዝገብና ዕድሎችን ለማግኘት ቀለል ያለ መንገድ። ጀምር. በድምፅ ጀምር. አንብቡልኝ. ለመጀመር «ጀምር» ይበሉ።",
  "prefs": "ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ? አማራጭ ነው። መዝለል ይችላሉ። 1: ትልቅ ጽሑፍ. 2: ከምርጫዎች ጋር ሥዕሎች. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
  "fullName": "ሙሉ ስምዎ ማነው? በየቀኑ የሚጠቀሙበት ስም በቂ ነው። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "contact": "ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው? ስለዚህ ፕሮግራም ለማግኘት ብቻ ነው የሚያገለግለው። ስልክ ቁጥር በዜሮ የሚጀምር ባለ አሥር አሃዝ ነው። እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።",
  "idRoute": "ማንነትዎን እንዴት ማሳየት ይፈልጋሉ? 1: ቀበሌ መታወቂያ ወይም ፓስፖርት. 2: የስደተኛ ወይም ተመላሽ መታወቂያ. 3: ሌላ ሰነድ. 4: ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "support": "ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ። ይህን መዝለል ይችላሉ። ማስረጃ አያስፈልግም። አዘጋጆቹ ብቻ ያዩታል፤ ለእርስዎ እገዛ ለማዘጋጀት ብቻ። 1: ስክሪን ሪደር እጠቀማለሁ. 2: ትልቅ ጽሑፍ. 3: መልሶቼን በድምፅ መናገር እመርጣለሁ. 4: የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ. 5: ቀላል ቃላትና ሥዕሎች. 6: እባክዎ ደውለው ያግዙኝ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
  "needs": "በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ። ሚስጥራዊ ነው። በመሣሪያዎ ላይ ብቻ ይቆያል፤ ተስማሚ ሥራዎችን ለማሳየት ብቻ ነው። 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
  "why": "ይህን ሥራ ለምን ይፈልጋሉ? ጥቂት ቃላት በቂ ናቸው። በድምፅ መናገርም ይችላሉ። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "job": "የሥራው መጠሪያ ምንድን ነው? መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።",
  "offers": "ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል? 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።",
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
  "n1": "አንድ",
  "n2": "ሁለት",
  "n3": "ሦስት",
  "n4": "አራት",
  "n5": "አምስት",
  "n6": "ስድስት",
  "n7": "ሰባት",
  "n8": "ስምንት",
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
  "o_prefs_large": "ትልቅ ጽሑፍ",
  "o_prefs_simple": "ከምርጫዎች ጋር ሥዕሎች",
  "q_fullName": "ሙሉ ስምዎ ማነው?",
  "q_contact": "ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው?",
  "o_idRoute_kebele": "ቀበሌ መታወቂያ ወይም ፓስፖርት",
  "o_idRoute_refugee": "የስደተኛ ወይም ተመላሽ መታወቂያ",
  "o_idRoute_other": "ሌላ ሰነድ",
  "o_idRoute_refer": "ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ",
  "o_support_screenreader": "ስክሪን ሪደር እጠቀማለሁ",
  "o_support_large": "ትልቅ ጽሑፍ",
  "o_support_voice": "መልሶቼን በድምፅ መናገር እመርጣለሁ",
  "o_support_sign": "የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ",
  "o_support_simple": "ቀላል ቃላትና ሥዕሎች",
  "o_support_human": "እባክዎ ደውለው ያግዙኝ",
  "o_needs_stepfree": "ከደረጃ ነፃ የሥራ ቦታ",
  "o_needs_reader": "ለስክሪን ሪደር ተስማሚ መሣሪያዎች",
  "o_needs_interp": "የምልክት ቋንቋ አስተርጓሚ",
  "o_needs_hours": "ተለዋዋጭ የሥራ ሰዓት",
  "o_needs_remote": "ከቤት መሥራት",
  "q_why": "ይህን ሥራ ለምን ይፈልጋሉ?",
  "q_job": "የሥራው መጠሪያ ምንድን ነው?",
  "o_offers_stepfree": "ከደረጃ ነፃ የሥራ ቦታ",
  "o_offers_reader": "ለስክሪን ሪደር ተስማሚ መሣሪያዎች",
  "o_offers_interp": "የምልክት ቋንቋ አስተርጓሚ",
  "o_offers_hours": "ተለዋዋጭ የሥራ ሰዓት",
  "o_offers_remote": "ከቤት መሥራት"
 },
 "om": {
  "langSelf": "Afaan Oromoo filachuuf Oromo jedhi, ykn qabduu Afaan Oromoo tuqi.",
  "raAsk": "Fuulli kun sagaleedhaan akka siif dubbifamu barbaaddaa? Maaloo Eeyyee ykn Lakki jedhi, ykn qabduu tokko tuqi. Eeyyee yoo filatte, ykn booda qabduu Dubbadhu yoo tuqxe, barbaadduun kee sagalee kee gara barreeffamaatti jijjiiruuf dhiyeessaa isaatti erguu danda'a. Lakki filattee barreessuu dandeessa.",
  "raAgain": "Deebii hin dhageenye, kanaaf akka Lakkiitti fudhanna. Fuulli akka siif dubbifamu yoo barbaadde, amma Eeyyee jedhi, ykn qabduu Eeyyee tuqi.",
  "welcome": "Baga nagaan dhuftan! Karaa salphaa itti galmooftanii carraa argattan. Jalqabi. Sagaleedhaan jalqabi. Naaf dubbisi. Jalqabuuf Jalqabi jedhi.",
  "prefs": "Unka kana akkamitti fayyadamuu barbaadda? Dirqama miti. Irra darbuu dandeessa. 1: Barreeffama guddaa. 2: Filannoo cinaatti fakkii. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
  "fullName": "Maqaan kee guutuun eenyu? Maqaan guyyaa guyyaan itti fayyadamtu gahaadha. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "contact": "Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya? Waa'ee sagantaa kanaa qofa si quunnamuuf. Lakkoofsi bilbilaa dijiitii 10 qaba, 0n jalqaba. Maaloo deebii kee saanduqa keessatti barreessi. Achiis Enter ykn qabduu Itti fufi tuqi.",
  "idRoute": "Eenyummaa kee akkamitti agarsiisuu barbaadda? 1: Waraqaa eenyummaa gandaa ykn paaspoortii. 2: Waraqaa eenyummaa baqataa ykn deebi'aa. 3: Sanada biraa. 4: Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "support": "Deeggarsa akkamii si gargaara? Kamiyyuu filadhu. Irra darbuu dandeessa. Ragaan hin barbaachisu. Qindeessitoota qofatu arga, deeggarsa siif qopheessuuf qofa. 1: Dubbisaa iskiriinii nan fayyadama. 2: Barreeffama guddaa. 3: Deebii koo dubbachuu nan filadha. 4: Hiikaa Afaan Mallattoo Itoophiyaa. 5: Jechoota salphaa fi fakkiiwwan. 6: Maaloo na gargaaruuf natti bilbilaa. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
  "needs": "Hojii irratti deeggarsa akkamii si barbaachisa? Kamiyyuu filadhu. Dhuunfaa. Kun meeshaa kee irratti hafa, hojii si mijatu agarsiisuuf qofa itti fayyadamna. 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
  "why": "Hojii kana maaliif barbaadda? Jechoota muraasni gahaadha. Dubbachuus dandeessa. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "job": "Maqaan hojii kanaa maali? Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.",
  "offers": "Hojiin kun mijeessuu akkamii dhiyeessuu danda'a? 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.",
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
  "n1": "Tokko",
  "n2": "Lama",
  "n3": "Sadii",
  "n4": "Afur",
  "n5": "Shan",
  "n6": "Jaha",
  "n7": "Torba",
  "n8": "Saddeet",
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
  "o_prefs_large": "Barreeffama guddaa",
  "o_prefs_simple": "Filannoo cinaatti fakkii",
  "q_fullName": "Maqaan kee guutuun eenyu?",
  "q_contact": "Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya?",
  "o_idRoute_kebele": "Waraqaa eenyummaa gandaa ykn paaspoortii",
  "o_idRoute_refugee": "Waraqaa eenyummaa baqataa ykn deebi'aa",
  "o_idRoute_other": "Sanada biraa",
  "o_idRoute_refer": "Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa",
  "o_support_screenreader": "Dubbisaa iskiriinii nan fayyadama",
  "o_support_large": "Barreeffama guddaa",
  "o_support_voice": "Deebii koo dubbachuu nan filadha",
  "o_support_sign": "Hiikaa Afaan Mallattoo Itoophiyaa",
  "o_support_simple": "Jechoota salphaa fi fakkiiwwan",
  "o_support_human": "Maaloo na gargaaruuf natti bilbilaa",
  "o_needs_stepfree": "Bakka hojii gulantaa hin qabne",
  "o_needs_reader": "Meeshaalee dubbisaa iskiriinii waliin hojjetan",
  "o_needs_interp": "Hiikaa afaan mallattoo",
  "o_needs_hours": "Sa'aatii hojii jijjiiramaa",
  "o_needs_remote": "Mana irraa hojjechuu",
  "q_why": "Hojii kana maaliif barbaadda?",
  "q_job": "Maqaan hojii kanaa maali?",
  "o_offers_stepfree": "Bakka hojii gulantaa hin qabne",
  "o_offers_reader": "Meeshaalee dubbisaa iskiriinii waliin hojjetan",
  "o_offers_interp": "Hiikaa afaan mallattoo",
  "o_offers_hours": "Sa'aatii hojii jijjiiramaa",
  "o_offers_remote": "Mana irraa hojjechuu"
 },
 "ti": {
  "langSelf": "ንትግርኛ «Tigrinya» በሉ፣ ወይ «ትግርኛ» ዝብል መጠወቒ ጠውቑ።",
  "raAsk": "እዚ ገጽ ክንበበልኩም ትደልዩ ዶ? በጃኹም «እወ» ወይ «ኣይፋል» በሉ፣ ወይ ሓደ መጠወቒ ጠውቑ። «እወ» እንተ መሪጽኩም፣ ወይ ደሓር «ተዛረብ» እንተ ጠዊቕኩም፣ መርበብኩም ድምጽኹም ናብ ጽሑፍ ንምቕያር ናብ ኣቕራቢኡ ክሰዶ ይኽእል። «ኣይፋል» መሪጽኩም ክትጽሕፉ ትኽእሉ ኢኹም።",
  "raAgain": "መልሲ ኣይሰማዕናን፣ ስለዚ ከም «ኣይፋል» ንወስዶ። ገጹ ክንበበልኩም እንተ ደሊኹም፣ ሕጂ «እወ» በሉ፣ ወይ «እወ» ዝብል መጠወቒ ጠውቑ።",
  "welcome": "እንቋዕ ብደሓን መጻእኩም! ንምምዝጋብን ዕድላት ንምርካብን ቀሊል መንገዲ። ጀምር. ብድምጺ ጀምር. ኣንብቡለይ. ንምጅማር «ጀምር» በሉ።",
  "prefs": "ነዚ ቅጥዒ ብኸመይ ክትጥቀሙሉ ትደልዩ? ግዴታ ኣይኮነን። ክትሓልፍዎ ትኽእሉ ኢኹም። 1: ዓቢ ጽሑፍ. 2: ምስ ምርጫታት ስእልታት. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
  "fullName": "ምሉእ ስምኩም መን እዩ? እቲ መዓልታዊ እትጥቀሙሉ ስም ይኣክል። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "contact": "ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል? ብዛዕባ እዚ መደብ ንምርካብኩም ጥራይ። ቁጽሪ ስልኪ 10 ኣሃዝ ኣለዎ፣ ብ0 ይጅምር። በጃኹም መልስኹም ኣብቲ ሳንዱቕ ጽሓፉ። ድሕሪኡ Enter ወይ «ቀጽል» ዝብል መጠወቒ ጠውቑ።",
  "idRoute": "መንነትኩም ብኸመይ ከተርእዩ ትደልዩ? 1: መንነት ቀበሌ ወይ ፓስፖርት. 2: መንነት ስደተኛ ወይ ተመላሲ. 3: ካልእ ሰነድ. 4: መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "support": "እንታይ ደገፍ ይሕግዘኩም? ዝኾነ ምረጹ። ክትሓልፍዎ ትኽእሉ ኢኹም። መረጋገጺ ኣየድልን። ኣወሃሃድቲ ጥራይ እዮም ዝርእይዎ፣ ንዓኹም ደገፍ ንምድላው ጥራይ። 1: ስክሪን ሪደር እጥቀም. 2: ዓቢ ጽሑፍ. 3: መልስታተይ ብድምጺ ክዛረብ እመርጽ. 4: ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ. 5: ቀለልቲ ቃላትን ስእልታትን. 6: በጃኹም ደዊልኩም ሓግዙኒ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
  "needs": "ኣብ ስራሕ እንታይ ደገፍ የድልየኩም? ዝኾነ ምረጹ። ብሕታዊ እዩ። ኣብ መሳርሒኹም ጥራይ ይጸንሕ፣ ተስማዕቲ ስራሓት ንምርኣይ ጥራይ ይጥቀመሉ። 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
  "why": "ነዚ ስራሕ ስለምንታይ ትደልይዎ? ውሑዳት ቃላት ይኣኽሉ። ብድምጺ እውን ክትዛረቡ ትኽእሉ ኢኹም። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "job": "ሽም እቲ ስራሕ እንታይ እዩ? ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።",
  "offers": "እዚ ስራሕ እንታይ ምትዕርራያት ከቕርብ ይኽእል? 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።",
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
  "n1": "ሓደ",
  "n2": "ክልተ",
  "n3": "ሰለስተ",
  "n4": "ኣርባዕተ",
  "n5": "ሓሙሽተ",
  "n6": "ሽዱሽተ",
  "n7": "ሸውዓተ",
  "n8": "ሸሞንተ",
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
  "o_prefs_large": "ዓቢ ጽሑፍ",
  "o_prefs_simple": "ምስ ምርጫታት ስእልታት",
  "q_fullName": "ምሉእ ስምኩም መን እዩ?",
  "q_contact": "ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል?",
  "o_idRoute_kebele": "መንነት ቀበሌ ወይ ፓስፖርት",
  "o_idRoute_refugee": "መንነት ስደተኛ ወይ ተመላሲ",
  "o_idRoute_other": "ካልእ ሰነድ",
  "o_idRoute_refer": "መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ",
  "o_support_screenreader": "ስክሪን ሪደር እጥቀም",
  "o_support_large": "ዓቢ ጽሑፍ",
  "o_support_voice": "መልስታተይ ብድምጺ ክዛረብ እመርጽ",
  "o_support_sign": "ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ",
  "o_support_simple": "ቀለልቲ ቃላትን ስእልታትን",
  "o_support_human": "በጃኹም ደዊልኩም ሓግዙኒ",
  "o_needs_stepfree": "ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ",
  "o_needs_reader": "ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት",
  "o_needs_interp": "ተርጓሚ ቋንቋ ምልክት",
  "o_needs_hours": "ተዓጻጻፊ ሰዓታት ስራሕ",
  "o_needs_remote": "ካብ ገዛ ምስራሕ",
  "q_why": "ነዚ ስራሕ ስለምንታይ ትደልይዎ?",
  "q_job": "ሽም እቲ ስራሕ እንታይ እዩ?",
  "o_offers_stepfree": "ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ",
  "o_offers_reader": "ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት",
  "o_offers_interp": "ተርጓሚ ቋንቋ ምልክት",
  "o_offers_hours": "ተዓጻጻፊ ሰዓታት ስራሕ",
  "o_offers_remote": "ካብ ገዛ ምስራሕ"
 },
 "so": {
  "langSelf": "Af Soomaali: dheh Somali, ama riix badhanka Soomaali.",
  "raAsk": "Ma rabtaa in boggan laguu akhriyo? Fadlan dheh Haa ama Maya, ama riix badhan. Haddii aad doorato Haa, ama aad hadhow riixdo badhanka Hadal, browserkaagu wuxuu codkaaga u diri karaa bixiyahiisa si uu qoraal ugu beddelo. Waxaad dooran kartaa Maya oo aad qori kartaa.",
  "raAgain": "Jawaab ma aanaan maqal, sidaa darteed waxaan u qaadanaynaa Maya. Haddii aad rabto in boggan laguu akhriyo, hadda dheh Haa, ama riix badhanka Haa.",
  "welcome": "Soo dhawoow! Hab fudud oo aad isku diiwaangeliso oo aad fursado ku hesho. Bilow. Ku bilow cod. Ii akhri. Dheh Bilow si aad u bilowdo.",
  "prefs": "Sidee baad u rabtaa inaad u isticmaasho foomkan? Ikhtiyaari. Waad ka boodi kartaa. 1: Qoraal ka weyn. 2: Sawirro ku xiga doorashooyinka. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
  "fullName": "Waa maxay magacaaga oo buuxa? Magaca aad maalin walba isticmaasho waa ku filan yahay. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.",
  "contact": "Lambarkee taleefan ama iimayl ayaan isticmaali karnaa? Kaliya si laguula soo xiriiro barnaamijkan. Lambar taleefan wuxuu leeyahay 10 god, wuxuuna ku bilaabmaa 0. Fadlan ku qor jawaabtaada sanduuqa. Kadib riix Enter, ama riix badhanka Xiga.",
  "idRoute": "Sidee baad u rabtaa inaad muujiso cidda aad tahay? 1: Aqoonsiga kebele ama baasaboor. 2: Aqoonsiga qaxootiga ama soo-noqotaha. 3: Dukumenti kale. 4: Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.",
  "support": "Taageero noocee ah ayaa ku caawin lahayd? Dooro mid kasta. Waad ka boodi kartaa. Caddayn looma baahna. Kaliya qabanqaabiyayaashu ayaa arka, si ay kuugu diyaariyaan caawimaad. 1: Waxaan isticmaalaa akhriyaha shaashadda. 2: Qoraal weyn. 3: Waxaan doorbidaa inaan ku hadlo jawaabahayga. 4: Turjubaan Luqadda Calaamadaha Itoobiya. 5: Erayo fudud iyo sawirro. 6: Fadlan ii soo wac si aad ii caawiso. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
  "needs": "Taageero noocee ah ayaad ugu baahan tahay shaqada? Dooro mid kasta. Gaar ah. Wuxuu ku jiraa qalabkaaga oo kaliya waxaa loo isticmaalaa in lagu tuso shaqooyin ku habboon. 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
  "why": "Maxaad u rabtaa shaqadan? Erayo kooban ayaa ku filan. Waad ku hadli kartaa beddelkeeda. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.",
  "job": "Waa maxay magaca shaqada? Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho.",
  "offers": "Waa maxay hagaajinta ay shaqadani bixin karto? 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.",
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
  "n1": "Kow",
  "n2": "Laba",
  "n3": "Saddex",
  "n4": "Afar",
  "n5": "Shan",
  "n6": "Lix",
  "n7": "Toddoba",
  "n8": "Siddeed",
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
  "o_prefs_large": "Qoraal ka weyn",
  "o_prefs_simple": "Sawirro ku xiga doorashooyinka",
  "q_fullName": "Waa maxay magacaaga oo buuxa?",
  "q_contact": "Lambarkee taleefan ama iimayl ayaan isticmaali karnaa?",
  "o_idRoute_kebele": "Aqoonsiga kebele ama baasaboor",
  "o_idRoute_refugee": "Aqoonsiga qaxootiga ama soo-noqotaha",
  "o_idRoute_other": "Dukumenti kale",
  "o_idRoute_refer": "Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi",
  "o_support_screenreader": "Waxaan isticmaalaa akhriyaha shaashadda",
  "o_support_large": "Qoraal weyn",
  "o_support_voice": "Waxaan doorbidaa inaan ku hadlo jawaabahayga",
  "o_support_sign": "Turjubaan Luqadda Calaamadaha Itoobiya",
  "o_support_simple": "Erayo fudud iyo sawirro",
  "o_support_human": "Fadlan ii soo wac si aad ii caawiso",
  "o_needs_stepfree": "Goob shaqo oo aan jaranjaro lahayn",
  "o_needs_reader": "Qalab ku habboon akhriyaha shaashadda",
  "o_needs_interp": "Turjubaan luqadda calaamadaha",
  "o_needs_hours": "Saacado dabacsan",
  "o_needs_remote": "Ka shaqeyn guriga",
  "q_why": "Maxaad u rabtaa shaqadan?",
  "q_job": "Waa maxay magaca shaqada?",
  "o_offers_stepfree": "Goob shaqo oo aan jaranjaro lahayn",
  "o_offers_reader": "Qalab ku habboon akhriyaha shaashadda",
  "o_offers_interp": "Turjubaan luqadda calaamadaha",
  "o_offers_hours": "Saacado dabacsan",
  "o_offers_remote": "Ka shaqeyn guriga"
 }
}''')

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
