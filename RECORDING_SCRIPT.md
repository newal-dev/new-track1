# Recording script for read-aloud audio

This file tells you exactly what each audio clip must say. It is **generated** from the current text in `public/db-form.js` by `npm run recording`, so the words match the screen. **Do not edit it by hand: change the text in the code and run `npm run recording` again**, then make the changed clips again.

## Languages and voices
| Language | Code | Folder | Voice |
|---|---|---|---|
| English | `en` | `public/audio/en/` | Generated clips (`facebook/mms-tts-eng`), so English sounds like the other four languages; the device voice if a clip is missing. |
| አማርኛ Amharic | `am` | `public/audio/am/` | **Generated clips** (Meta MMS, `facebook/mms-tts-amh`). Few devices have an Amharic voice. |
| Afaan Oromoo | `om` | `public/audio/om/` | Generated clips (`facebook/mms-tts-orm`); the device voice if a clip is missing. |
| ትግርኛ Tigrinya | `ti` | `public/audio/ti/` | Generated clips (`facebook/mms-tts-tir`); the device voice if a clip is missing. |
| Soomaali Somali | `so` | `public/audio/so/` | Generated clips (`facebook/mms-tts-som`); the device voice if a clip is missing. |

When a clip is missing **and** the device has no voice for the language, the plugin says in English "This device has no voice for this language…" so a blind person knows why, and it still listens for their answer.

## How to make the clips (Google Colab, free)
1. Run `npm run recording`. This updates this file **and** `tools/colab_generate_audio.py` (the clip text is built into that file).
2. Open https://colab.research.google.com, choose **New notebook**.
3. Optional but faster: **Runtime, Change runtime type, T4 GPU**.
4. Open `tools/colab_generate_audio.py`, copy **all** of it, paste it into the first cell, and press Run. The first run downloads the voice models (a few minutes).
5. When it finishes, `audio.zip` downloads. **Delete the old clips** in `public/audio/en/`, `am/`, `om/`, `ti/` and `so/` (keep the `.gitkeep` files), then unzip it **into `public/audio/`**, so you get for example `public/audio/am/fullName.mp3`.
6. Test: open the demo page, choose a language, choose Yes, read aloud, and listen to every page.
7. A native speaker must listen to every clip. If a word is wrong, fix the text in `public/db-form.js` (not here), then repeat from step 1.

## What to produce
- **440 files in total**: 88 for `en`, 88 for `am`, 88 for `om`, 88 for `ti`, 88 for `so`.
- Format: **mp3**, mono, 64 kbps or lower (small for 3G). The Colab script makes 48 kbps.
- File name = the **ID** in the first column, plus `.mp3`. Example: `public/audio/am/fullName.mp3`. Use exactly this spelling and capital letters.
- The plugin loads them from the `audio` attribute: `audio='http://localhost:3000/audio'` (the server serves the `public` folder).
- `langAsk` exists in English only, and `langSelf` in every language except English: the language page asks in English, then each language invites its own speakers.
- The short clips at the end (`speakNow`, `sel`, `unsel`, `langName`, `b_…` buttons, `o_…` choices, `q_…` answer boxes) are read when a keyboard user moves with Tab, Shift+Tab or the arrow keys, so a choice is heard as for example "two" + "Refugee or returnee ID" + "not selected". Say them as single short phrases.

## Recording by a person instead (phone is fine)
1. Quiet room, phone 20 cm from your mouth, no fan or echo.
2. Speak slowly and clearly, like to a stranger. Pause about one second between sentences and between choices.
3. Read **every word exactly as written**, no more and no less. Do not add "please" or change the order, including the numbers ("1:" is spoken "one", "2:" "two"…). The numbers matter: the person will say them back.
4. Trim silence at the start and end. Keep each file under about 40 seconds.
5. Convert to mp3 (for example with Audacity: File, Export, MP3), name the file and put it in the right folder.

## Important: what the voice says must match what is on screen
- The **first question of each flow** (`prefs`, `needs`, `job`) has **no Back button**, so its script does **not** say "Back". Every other question does.
- **Skip** is spoken only for optional questions, and those pages have a visible Skip button.
- The words in the instructions are the same as the buttons: **Next, Back, Skip, Read aloud, Start, Submit**.
- The privacy notice is spoken **once**, in `raAsk`, and shown once on that same page.
- The **contact** question (phone or email) is **typed, not spoken**: it has no Speak button and the voice does not listen.
- The confirmation after a choice is three clips played in a row: `choseA` ("You chose"), then the number clips `n1` to `n8`, then `choseB`.
- If a website hides a question with the `hide` attribute, the clips still describe the full list.
- The **Stop reading** button and the Escape key stop any clip or voice at any time.

## Not recorded (they change each time)
- **review** (the first part of the last page): reads out the person's own answers. Only `reviewFix` is a clip.
- **role** (job flow): the list of jobs depends on the person's filter and on jobs employers add. Only the question (`q_role`) and the numbers are clips.
- The exact words a person typed or said. The device voice reads them back when it has a voice for the language; otherwise `heardGeneric` is played.

## Checklist
| ID | Page | Optional question? | Languages |
|---|---|---|---|
| `langAsk` | Language page: the question, in English only | - | en |
| `langSelf` | Language page: invitation in the language itself (played after langAsk) | - | am, om, ti, so |
| `raAsk` | First question in the chosen language (asks if the page should be read aloud) | - | en, am, om, ti, so |
| `raAgain` | Second ask, if no answer was heard | - | en, am, om, ti, so |
| `welcome` | Welcome page (after they said Yes to read aloud) | - | en, am, om, ti, so |
| `prefs` | signup flow, question 1 | yes (includes "Say Skip") | en, am, om, ti, so |
| `fullName` | signup flow, question 2 | no | en, am, om, ti, so |
| `contact` | signup flow, question 3 | no | en, am, om, ti, so |
| `idRoute` | signup flow, question 4 | no | en, am, om, ti, so |
| `support` | signup flow, question 5 | yes (includes "Say Skip") | en, am, om, ti, so |
| `needs` | job flow, question 1 | yes (includes "Say Skip") | en, am, om, ti, so |
| `why` | job flow, question 3 | no | en, am, om, ti, so |
| `job` | employer flow, question 1 | no | en, am, om, ti, so |
| `offers` | employer flow, question 2 | yes (includes "Say Skip") | en, am, om, ti, so |
| `closes` | employer flow, question 3 | yes (includes "Say Skip") | en, am, om, ti, so |
| `errNeed` | Error: question not answered | - | en, am, om, ti, so |
| `errBad` | Error: phone number or email not valid | - | en, am, om, ti, so |
| `errFail` | Error: could not send | - | en, am, om, ti, so |
| `unclear` | Voice answer not understood | - | en, am, om, ti, so |
| `noneSel` | Nothing chosen yet | - | en, am, om, ti, so |
| `idle` | Nothing heard | - | en, am, om, ti, so |
| `sayWelcome` | Welcome page: say Start | - | en, am, om, ti, so |
| `reviewAsk` | Review page: do you want to submit? | - | en, am, om, ti, so |
| `heardGeneric` | Spoken answer received (used when the device has no voice) | - | en, am, om, ti, so |
| `choseA` | Confirmation, first part ("You chose") | - | en, am, om, ti, so |
| `choseB` | Confirmation, last part | - | en, am, om, ti, so |
| `errConsentNeed` | Error: consent box not ticked | - | en, am, om, ti, so |
| `errDateBad` | Error: date has no month | - | en, am, om, ti, so |
| `draftH` | Welcome back (answers kept on this device) | - | en, am, om, ti, so |
| `queued` | Offline: answers saved on the device, sent later | - | en, am, om, ti, so |
| `sentLater` | Saved answers were sent | - | en, am, om, ti, so |
| `tapToHear` | Press a key or tap to hear the questions | - | en, am, om, ti, so |
| `n1` | Number 1 (used in the confirmation) | - | en, am, om, ti, so |
| `n2` | Number 2 (used in the confirmation) | - | en, am, om, ti, so |
| `n3` | Number 3 (used in the confirmation) | - | en, am, om, ti, so |
| `n4` | Number 4 (used in the confirmation) | - | en, am, om, ti, so |
| `n5` | Number 5 (used in the confirmation) | - | en, am, om, ti, so |
| `n6` | Number 6 (used in the confirmation) | - | en, am, om, ti, so |
| `n7` | Number 7 (used in the confirmation) | - | en, am, om, ti, so |
| `n8` | Number 8 (used in the confirmation) | - | en, am, om, ti, so |
| `reviewFix` | Review page, second part (after the person says No to submitting) | - | en, am, om, ti, so |
| `done` | Thank-you page | - | en, am, om, ti, so |
| `speakNow` | Said just before the microphone opens (then a beep) | - | en, am, om, ti, so |
| `sel` | Focus: a choice that is ticked | - | en, am, om, ti, so |
| `unsel` | Focus: a choice that is not ticked | - | en, am, om, ti, so |
| `langName` | Focus: a language button, in that language | - | en, am, om, ti, so |
| `b_next` | Focus: the "Next" button | - | en, am, om, ti, so |
| `b_back` | Focus: the "Back" button | - | en, am, om, ti, so |
| `b_skip` | Focus: the "Skip" button | - | en, am, om, ti, so |
| `b_read` | Focus: the "Read aloud" button | - | en, am, om, ti, so |
| `b_speak` | Focus: the "Speak" button | - | en, am, om, ti, so |
| `b_readToMe` | Focus: the "Read to me" button | - | en, am, om, ti, so |
| `b_stopRead` | Focus: the "Stop reading" button | - | en, am, om, ti, so |
| `b_send` | Focus: the "Yes, submit" button | - | en, am, om, ti, so |
| `b_noChange` | Focus: the "No, change something" button | - | en, am, om, ti, so |
| `b_restart` | Focus: the "Start again" button | - | en, am, om, ti, so |
| `b_change` | Focus: the "Change" button | - | en, am, om, ti, so |
| `b_start` | Focus: the "Start" button | - | en, am, om, ti, so |
| `b_startVoice` | Focus: the "Start with voice" button | - | en, am, om, ti, so |
| `b_raYes` | Focus: the "Yes, read aloud" button | - | en, am, om, ti, so |
| `b_raNo` | Focus: the "No, thank you" button | - | en, am, om, ti, so |
| `b_draftGo` | Focus: the "Continue where I stopped" button | - | en, am, om, ti, so |
| `o_prefs_large` | Focus: choice "Larger text" (question prefs) | - | en, am, om, ti, so |
| `o_prefs_simple` | Focus: choice "Pictures next to choices" (question prefs) | - | en, am, om, ti, so |
| `q_fullName` | Focus: the answer box of "What is your full name?" | - | en, am, om, ti, so |
| `q_contact` | Focus: the answer box of "What phone number or email can we use?" | - | en, am, om, ti, so |
| `o_idRoute_kebele` | Focus: choice "Kebele ID or passport" (question idRoute) | - | en, am, om, ti, so |
| `o_idRoute_refugee` | Focus: choice "Refugee or returnee ID" (question idRoute) | - | en, am, om, ti, so |
| `o_idRoute_other` | Focus: choice "Another document" (question idRoute) | - | en, am, om, ti, so |
| `o_idRoute_refer` | Focus: choice "I don't have an ID. Refer me through a partner organisation" (question idRoute) | - | en, am, om, ti, so |
| `o_support_screenreader` | Focus: choice "I use a screen reader" (question support) | - | en, am, om, ti, so |
| `o_support_large` | Focus: choice "Large text" (question support) | - | en, am, om, ti, so |
| `o_support_voice` | Focus: choice "I prefer to speak my answers" (question support) | - | en, am, om, ti, so |
| `o_support_sign` | Focus: choice "Ethiopian Sign Language interpreter" (question support) | - | en, am, om, ti, so |
| `o_support_simple` | Focus: choice "Simple words and pictures" (question support) | - | en, am, om, ti, so |
| `o_support_human` | Focus: choice "Please call me to help" (question support) | - | en, am, om, ti, so |
| `o_needs_stepfree` | Focus: choice "Step-free workplace" (question needs) | - | en, am, om, ti, so |
| `o_needs_reader` | Focus: choice "Screen-reader friendly tools" (question needs) | - | en, am, om, ti, so |
| `o_needs_interp` | Focus: choice "Sign language interpreter" (question needs) | - | en, am, om, ti, so |
| `o_needs_hours` | Focus: choice "Flexible hours" (question needs) | - | en, am, om, ti, so |
| `o_needs_remote` | Focus: choice "Work from home" (question needs) | - | en, am, om, ti, so |
| `q_role` | Job page: the question "Which job are you applying for?" (the job titles are read by the device voice) | - | en, am, om, ti, so |
| `q_why` | Focus: the answer box of "Why do you want this job?" | - | en, am, om, ti, so |
| `q_job` | Focus: the answer box of "What is the job title?" | - | en, am, om, ti, so |
| `o_offers_stepfree` | Focus: choice "Step-free workplace" (question offers) | - | en, am, om, ti, so |
| `o_offers_reader` | Focus: choice "Screen-reader friendly tools" (question offers) | - | en, am, om, ti, so |
| `o_offers_interp` | Focus: choice "Sign language interpreter" (question offers) | - | en, am, om, ti, so |
| `o_offers_hours` | Focus: choice "Flexible hours" (question offers) | - | en, am, om, ti, so |
| `o_offers_remote` | Focus: choice "Work from home" (question offers) | - | en, am, om, ti, so |

---

## The scripts

Each box is the exact text of one clip. "1:" is spoken "one", "2:" "two", and so on (the Colab script does this for you).

### `langAsk`: Language page: the question, in English only

**English** → `public/audio/en/langAsk.mp3`

> Which language would you like to use? Say English, Amharic, Oromo, Tigrinya or Somali, or press a button.

### `langSelf`: Language page: invitation in the language itself (played after langAsk)

**አማርኛ (draft, must be checked)** → `public/audio/am/langSelf.mp3`

> ለአማርኛ «Amharic» ይበሉ፤ ወይም «አማርኛ» የሚለውን ቁልፍ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/langSelf.mp3`

> Afaan Oromoo filachuuf Oromo jedhi, ykn qabduu Afaan Oromoo tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/langSelf.mp3`

> ንትግርኛ «Tigrinya» በሉ፣ ወይ «ትግርኛ» ዝብል መጠወቒ ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/langSelf.mp3`

> Af Soomaali: dheh Somali, ama riix badhanka Soomaali.

### `raAsk`: First question in the chosen language (asks if the page should be read aloud)

**English** → `public/audio/en/raAsk.mp3`

> Would you like this page to be read aloud to you? Please say Yes or No, or press a button. If you choose Yes, or press a Speak button later, your browser may send your voice to its provider to turn it into text. You can choose No and type instead.

**አማርኛ (draft, must be checked)** → `public/audio/am/raAsk.mp3`

> ይህ ገጽ እንዲነበብልዎ ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ፤ ወይም አንድ ቁልፍ ይጫኑ። «አዎ» ከመረጡ ወይም በኋላ «ተናገር» ከተጫኑ አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው ሊልክ ይችላል። «አይ» መርጠው በምትኩ መጻፍ ይችላሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/raAsk.mp3`

> Fuulli kun sagaleedhaan akka siif dubbifamu barbaaddaa? Maaloo Eeyyee ykn Lakki jedhi, ykn qabduu tokko tuqi. Eeyyee yoo filatte, ykn booda qabduu Dubbadhu yoo tuqxe, barbaadduun kee sagalee kee gara barreeffamaatti jijjiiruuf dhiyeessaa isaatti erguu danda'a. Lakki filattee barreessuu dandeessa.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/raAsk.mp3`

> እዚ ገጽ ክንበበልኩም ትደልዩ ዶ? በጃኹም «እወ» ወይ «ኣይፋል» በሉ፣ ወይ ሓደ መጠወቒ ጠውቑ። «እወ» እንተ መሪጽኩም፣ ወይ ደሓር «ተዛረብ» እንተ ጠዊቕኩም፣ መርበብኩም ድምጽኹም ናብ ጽሑፍ ንምቕያር ናብ ኣቕራቢኡ ክሰዶ ይኽእል። «ኣይፋል» መሪጽኩም ክትጽሕፉ ትኽእሉ ኢኹም።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/raAsk.mp3`

> Ma rabtaa in boggan laguu akhriyo? Fadlan dheh Haa ama Maya, ama riix badhan. Haddii aad doorato Haa, ama aad hadhow riixdo badhanka Hadal, browserkaagu wuxuu codkaaga u diri karaa bixiyahiisa si uu qoraal ugu beddelo. Waxaad dooran kartaa Maya oo aad qori kartaa.

### `raAgain`: Second ask, if no answer was heard

**English** → `public/audio/en/raAgain.mp3`

> We did not hear an answer, so we will take that as No. If you would like the page read aloud, please say Yes now, or press the Yes button.

**አማርኛ (draft, must be checked)** → `public/audio/am/raAgain.mp3`

> መልስ አልሰማንም። እንደ «አይ» እንወስደዋለን። እንዲነበብልዎ ከፈለጉ አሁን «አዎ» ይበሉ ወይም «አዎ» የሚለውን ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/raAgain.mp3`

> Deebii hin dhageenye, kanaaf akka Lakkiitti fudhanna. Fuulli akka siif dubbifamu yoo barbaadde, amma Eeyyee jedhi, ykn qabduu Eeyyee tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/raAgain.mp3`

> መልሲ ኣይሰማዕናን፣ ስለዚ ከም «ኣይፋል» ንወስዶ። ገጹ ክንበበልኩም እንተ ደሊኹም፣ ሕጂ «እወ» በሉ፣ ወይ «እወ» ዝብል መጠወቒ ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/raAgain.mp3`

> Jawaab ma aanaan maqal, sidaa darteed waxaan u qaadanaynaa Maya. Haddii aad rabto in boggan laguu akhriyo, hadda dheh Haa, ama riix badhanka Haa.

### `welcome`: Welcome page (after they said Yes to read aloud)

**English** → `public/audio/en/welcome.mp3`

> Welcome! A simpler way to register and find opportunities. Start. Start with voice. Read to me. Say Start to begin.

**አማርኛ (draft, must be checked)** → `public/audio/am/welcome.mp3`

> እንኳን ደህና መጡ! ለመመዝገብና ዕድሎችን ለማግኘት ቀለል ያለ መንገድ። ጀምር. በድምፅ ጀምር. አንብቡልኝ. ለመጀመር «ጀምር» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/welcome.mp3`

> Baga nagaan dhuftan! Karaa salphaa itti galmooftanii carraa argattan. Jalqabi. Sagaleedhaan jalqabi. Naaf dubbisi. Jalqabuuf Jalqabi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/welcome.mp3`

> እንቋዕ ብደሓን መጻእኩም! ንምምዝጋብን ዕድላት ንምርካብን ቀሊል መንገዲ። ጀምር. ብድምጺ ጀምር. ኣንብቡለይ. ንምጅማር «ጀምር» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/welcome.mp3`

> Soo dhawoow! Hab fudud oo aad isku diiwaangeliso oo aad fursado ku hesho. Bilow. Ku bilow cod. Ii akhri. Dheh Bilow si aad u bilowdo.

### `prefs`: signup flow, question 1

**English** → `public/audio/en/prefs.mp3`

> How would you like to use this form? Optional. You can skip this. 1: Larger text. 2: Pictures next to choices. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/prefs.mp3`

> ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ? አማራጭ ነው። መዝለል ይችላሉ። 1: ትልቅ ጽሑፍ. 2: ከምርጫዎች ጋር ሥዕሎች. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/prefs.mp3`

> Unka kana akkamitti fayyadamuu barbaadda? Dirqama miti. Irra darbuu dandeessa. 1: Barreeffama guddaa. 2: Filannoo cinaatti fakkii. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/prefs.mp3`

> ነዚ ቅጥዒ ብኸመይ ክትጥቀሙሉ ትደልዩ? ግዴታ ኣይኮነን። ክትሓልፍዎ ትኽእሉ ኢኹም። 1: ዓቢ ጽሑፍ. 2: ምስ ምርጫታት ስእልታት. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/prefs.mp3`

> Sidee baad u rabtaa inaad u isticmaasho foomkan? Ikhtiyaari. Waad ka boodi kartaa. 1: Qoraal ka weyn. 2: Sawirro ku xiga doorashooyinka. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

### `fullName`: signup flow, question 2

**English** → `public/audio/en/fullName.mp3`

> What is your full name? The name you use every day is fine. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/fullName.mp3`

> ሙሉ ስምዎ ማነው? በየቀኑ የሚጠቀሙበት ስም በቂ ነው። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/fullName.mp3`

> Maqaan kee guutuun eenyu? Maqaan guyyaa guyyaan itti fayyadamtu gahaadha. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/fullName.mp3`

> ምሉእ ስምኩም መን እዩ? እቲ መዓልታዊ እትጥቀሙሉ ስም ይኣክል። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/fullName.mp3`

> Waa maxay magacaaga oo buuxa? Magaca aad maalin walba isticmaasho waa ku filan yahay. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.

### `contact`: signup flow, question 3

**English** → `public/audio/en/contact.mp3`

> What phone number or email can we use? Only used to contact you about this programme. A phone number has 10 digits and starts with 0. Please type your answer in the box. Then press Enter, or press the Next button.

**አማርኛ (draft, must be checked)** → `public/audio/am/contact.mp3`

> ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው? ስለዚህ ፕሮግራም ለማግኘት ብቻ ነው የሚያገለግለው። ስልክ ቁጥር በዜሮ የሚጀምር ባለ አሥር አሃዝ ነው። እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/contact.mp3`

> Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya? Waa'ee sagantaa kanaa qofa si quunnamuuf. Lakkoofsi bilbilaa dijiitii 10 qaba, 0n jalqaba. Maaloo deebii kee saanduqa keessatti barreessi. Achiis Enter ykn qabduu Itti fufi tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/contact.mp3`

> ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል? ብዛዕባ እዚ መደብ ንምርካብኩም ጥራይ። ቁጽሪ ስልኪ 10 ኣሃዝ ኣለዎ፣ ብ0 ይጅምር። በጃኹም መልስኹም ኣብቲ ሳንዱቕ ጽሓፉ። ድሕሪኡ Enter ወይ «ቀጽል» ዝብል መጠወቒ ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/contact.mp3`

> Lambarkee taleefan ama iimayl ayaan isticmaali karnaa? Kaliya si laguula soo xiriiro barnaamijkan. Lambar taleefan wuxuu leeyahay 10 god, wuxuuna ku bilaabmaa 0. Fadlan ku qor jawaabtaada sanduuqa. Kadib riix Enter, ama riix badhanka Xiga.

### `idRoute`: signup flow, question 4

**English** → `public/audio/en/idRoute.mp3`

> How would you like to show who you are? 1: Kebele ID or passport. 2: Refugee or returnee ID. 3: Another document. 4: I don't have an ID. Refer me through a partner organisation. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/idRoute.mp3`

> ማንነትዎን እንዴት ማሳየት ይፈልጋሉ? 1: ቀበሌ መታወቂያ ወይም ፓስፖርት. 2: የስደተኛ ወይም ተመላሽ መታወቂያ. 3: ሌላ ሰነድ. 4: ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/idRoute.mp3`

> Eenyummaa kee akkamitti agarsiisuu barbaadda? 1: Waraqaa eenyummaa gandaa ykn paaspoortii. 2: Waraqaa eenyummaa baqataa ykn deebi'aa. 3: Sanada biraa. 4: Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/idRoute.mp3`

> መንነትኩም ብኸመይ ከተርእዩ ትደልዩ? 1: መንነት ቀበሌ ወይ ፓስፖርት. 2: መንነት ስደተኛ ወይ ተመላሲ. 3: ካልእ ሰነድ. 4: መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/idRoute.mp3`

> Sidee baad u rabtaa inaad muujiso cidda aad tahay? 1: Aqoonsiga kebele ama baasaboor. 2: Aqoonsiga qaxootiga ama soo-noqotaha. 3: Dukumenti kale. 4: Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.

### `support`: signup flow, question 5

**English** → `public/audio/en/support.mp3`

> What support would help you? Choose any. You can skip this. No proof needed. Only the organisers see it, and only to prepare help for you. 1: I use a screen reader. 2: Large text. 3: I prefer to speak my answers. 4: Ethiopian Sign Language interpreter. 5: Simple words and pictures. 6: Please call me to help. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/support.mp3`

> ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ። ይህን መዝለል ይችላሉ። ማስረጃ አያስፈልግም። አዘጋጆቹ ብቻ ያዩታል፤ ለእርስዎ እገዛ ለማዘጋጀት ብቻ። 1: ስክሪን ሪደር እጠቀማለሁ. 2: ትልቅ ጽሑፍ. 3: መልሶቼን በድምፅ መናገር እመርጣለሁ. 4: የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ. 5: ቀላል ቃላትና ሥዕሎች. 6: እባክዎ ደውለው ያግዙኝ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/support.mp3`

> Deeggarsa akkamii si gargaara? Kamiyyuu filadhu. Irra darbuu dandeessa. Ragaan hin barbaachisu. Qindeessitoota qofatu arga, deeggarsa siif qopheessuuf qofa. 1: Dubbisaa iskiriinii nan fayyadama. 2: Barreeffama guddaa. 3: Deebii koo dubbachuu nan filadha. 4: Hiikaa Afaan Mallattoo Itoophiyaa. 5: Jechoota salphaa fi fakkiiwwan. 6: Maaloo na gargaaruuf natti bilbilaa. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/support.mp3`

> እንታይ ደገፍ ይሕግዘኩም? ዝኾነ ምረጹ። ክትሓልፍዎ ትኽእሉ ኢኹም። መረጋገጺ ኣየድልን። ኣወሃሃድቲ ጥራይ እዮም ዝርእይዎ፣ ንዓኹም ደገፍ ንምድላው ጥራይ። 1: ስክሪን ሪደር እጥቀም. 2: ዓቢ ጽሑፍ. 3: መልስታተይ ብድምጺ ክዛረብ እመርጽ. 4: ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ. 5: ቀለልቲ ቃላትን ስእልታትን. 6: በጃኹም ደዊልኩም ሓግዙኒ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/support.mp3`

> Taageero noocee ah ayaa ku caawin lahayd? Dooro mid kasta. Waad ka boodi kartaa. Caddayn looma baahna. Kaliya qabanqaabiyayaashu ayaa arka, si ay kuugu diyaariyaan caawimaad. 1: Waxaan isticmaalaa akhriyaha shaashadda. 2: Qoraal weyn. 3: Waxaan doorbidaa inaan ku hadlo jawaabahayga. 4: Turjubaan Luqadda Calaamadaha Itoobiya. 5: Erayo fudud iyo sawirro. 6: Fadlan ii soo wac si aad ii caawiso. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

### `needs`: job flow, question 1

**English** → `public/audio/en/needs.mp3`

> What support do you need at work? Choose any. Private. This stays on your device and is only used to show suitable jobs. 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/needs.mp3`

> በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ። ሚስጥራዊ ነው። በመሣሪያዎ ላይ ብቻ ይቆያል፤ ተስማሚ ሥራዎችን ለማሳየት ብቻ ነው። 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/needs.mp3`

> Hojii irratti deeggarsa akkamii si barbaachisa? Kamiyyuu filadhu. Dhuunfaa. Kun meeshaa kee irratti hafa, hojii si mijatu agarsiisuuf qofa itti fayyadamna. 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/needs.mp3`

> ኣብ ስራሕ እንታይ ደገፍ የድልየኩም? ዝኾነ ምረጹ። ብሕታዊ እዩ። ኣብ መሳርሒኹም ጥራይ ይጸንሕ፣ ተስማዕቲ ስራሓት ንምርኣይ ጥራይ ይጥቀመሉ። 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/needs.mp3`

> Taageero noocee ah ayaad ugu baahan tahay shaqada? Dooro mid kasta. Gaar ah. Wuxuu ku jiraa qalabkaaga oo kaliya waxaa loo isticmaalaa in lagu tuso shaqooyin ku habboon. 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

### `why`: job flow, question 3

**English** → `public/audio/en/why.mp3`

> Why do you want this job? A few words are enough. You can speak instead. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/why.mp3`

> ይህን ሥራ ለምን ይፈልጋሉ? ጥቂት ቃላት በቂ ናቸው። በድምፅ መናገርም ይችላሉ። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/why.mp3`

> Hojii kana maaliif barbaadda? Jechoota muraasni gahaadha. Dubbachuus dandeessa. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/why.mp3`

> ነዚ ስራሕ ስለምንታይ ትደልይዎ? ውሑዳት ቃላት ይኣኽሉ። ብድምጺ እውን ክትዛረቡ ትኽእሉ ኢኹም። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/why.mp3`

> Maxaad u rabtaa shaqadan? Erayo kooban ayaa ku filan. Waad ku hadli kartaa beddelkeeda. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.

### `job`: employer flow, question 1

**English** → `public/audio/en/job.mp3`

> What is the job title? Speak your answer now. Say Next to continue, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/job.mp3`

> የሥራው መጠሪያ ምንድን ነው? መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/job.mp3`

> Maqaan hojii kanaa maali? Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/job.mp3`

> ሽም እቲ ስራሕ እንታይ እዩ? ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/job.mp3`

> Waa maxay magaca shaqada? Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho.

### `offers`: employer flow, question 2

**English** → `public/audio/en/offers.mp3`

> Which adjustments can this job offer? 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/offers.mp3`

> ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል? 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/offers.mp3`

> Hojiin kun mijeessuu akkamii dhiyeessuu danda'a? 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/offers.mp3`

> እዚ ስራሕ እንታይ ምትዕርራያት ከቕርብ ይኽእል? 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/offers.mp3`

> Waa maxay hagaajinta ay shaqadani bixin karto? 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

### `closes`: employer flow, question 3

**English** → `public/audio/en/closes.mp3`

> When do applications close? Optional. Ethiopian calendar. If you only know the month, choose Not sure for the day. Please type your answer in the box. Then press Enter, or press the Next button.

**አማርኛ (draft, must be checked)** → `public/audio/am/closes.mp3`

> ማመልከቻ መቼ ይዘጋል? አማራጭ ነው። በኢትዮጵያ አቆጣጠር። ወሩን ብቻ ካወቁ ለቀኑ «እርግጠኛ አይደለሁም» ይምረጡ። እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/closes.mp3`

> Iyyannoon yoom cufama? Dirqama miti. Lakkoofsa Itoophiyaa. Ji'a qofa yoo beekte, guyyaaf 'Hin beeku' filadhu. Maaloo deebii kee saanduqa keessatti barreessi. Achiis Enter ykn qabduu Itti fufi tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/closes.mp3`

> ምዝገባ ማመልከቻ መዓስ ይዕጾ? ግዴታ ኣይኮነን። ብኣቆጻጽራ ኢትዮጵያ። ወርሒ ጥራይ እንተ ፈሊጥኩም፣ ንመዓልቲ «ርግጸኛ ኣይኮንኩን» ምረጹ። በጃኹም መልስኹም ኣብቲ ሳንዱቕ ጽሓፉ። ድሕሪኡ Enter ወይ «ቀጽል» ዝብል መጠወቒ ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/closes.mp3`

> Goormaa la xirayaa codsiyada? Ikhtiyaari. Kalandarka Itoobiya. Haddii aad bisha oo keliya taqaanno, maalinta u dooro 'Ma hubo'. Fadlan ku qor jawaabtaada sanduuqa. Kadib riix Enter, ama riix badhanka Xiga.

### `errNeed`: Error: question not answered

**English** → `public/audio/en/errNeed.mp3`

> Please answer this question, or press Back.

**አማርኛ (draft, must be checked)** → `public/audio/am/errNeed.mp3`

> እባክዎ ይህን ጥያቄ ይመልሱ ወይም ተመለስ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errNeed.mp3`

> Maaloo gaaffii kana deebisi, ykn Duubatti tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errNeed.mp3`

> በጃኹም ነዚ ሕቶ ምለሱ፣ ወይ «ተመለስ» ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errNeed.mp3`

> Fadlan ka jawaab su'aashan, ama riix Dib u noqo.

### `errBad`: Error: phone number or email not valid

**English** → `public/audio/en/errBad.mp3`

> Please type a phone number with 10 digits, starting with zero, or an email address with an @ sign.

**አማርኛ (draft, must be checked)** → `public/audio/am/errBad.mp3`

> እባክዎ በዜሮ የሚጀምር ባለ አሥር አሃዝ ስልክ ቁጥር ይጻፉ፤ ወይም «@» ምልክት ያለው ኢሜይል አድራሻ ይጻፉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errBad.mp3`

> Maaloo lakkoofsa bilbilaa dijiitii 10 qabu kan zeeroon jalqabu, ykn teessoo imeelii mallattoo @ qabu barreessi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errBad.mp3`

> በጃኹም ብዜሮ ዚጅምር 10 ኣሃዝ ዘለዎ ቁጽሪ ስልኪ፣ ወይ «@» ምልክት ዘለዎ ኢመይል ጽሓፉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errBad.mp3`

> Fadlan qor lambar taleefan oo 10 god ah oo ku bilaabmaya eber, ama cinwaan iimayl oo leh calaamadda @.

### `errFail`: Error: could not send

**English** → `public/audio/en/errFail.mp3`

> We could not send your answers. Nothing is lost. Please try again.

**አማርኛ (draft, must be checked)** → `public/audio/am/errFail.mp3`

> መልሶችዎን መላክ አልቻልንም። ምንም አልጠፋም። እባክዎ እንደገና ይሞክሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errFail.mp3`

> Deebii kee erguu hin dandeenye. Homtuu hin badne. Maaloo irra deebi'ii yaali.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errFail.mp3`

> መልስታትኩም ክንሰድድ ኣይከኣልናን። ዋላ ሓንቲ ኣይጠፍአን። በጃኹም ደጊምኩም ፈትኑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errFail.mp3`

> Ma aanaan diri karin jawaabahaaga. Waxba ma lumin. Fadlan mar kale isku day.

### `unclear`: Voice answer not understood

**English** → `public/audio/en/unclear.mp3`

> Sorry, I did not understand. Please say the number of your choice.

**አማርኛ (draft, must be checked)** → `public/audio/am/unclear.mp3`

> ይቅርታ፣ አልገባኝም። እባክዎ የምርጫዎን ቁጥር ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/unclear.mp3`

> Dhiifama, hin hubanne. Maaloo lakkoofsa filannoo keetii jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/unclear.mp3`

> ይቕሬታ፣ ኣይተረዳእኩን። በጃኹም ቁጽሪ ምርጫኹም በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/unclear.mp3`

> Waan ka xumahay, ma fahmin. Fadlan dheh lambarka doorashadaada.

### `noneSel`: Nothing chosen yet

**English** → `public/audio/en/noneSel.mp3`

> Nothing is chosen. Say a number or a name, or say Skip.

**አማርኛ (draft, must be checked)** → `public/audio/am/noneSel.mp3`

> ምንም አልተመረጠም። ቁጥር ወይም ስም ይናገሩ፤ ወይም «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/noneSel.mp3`

> Homtuu hin filatamne. Lakkoofsa ykn maqaa jedhi, ykn Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/noneSel.mp3`

> ዋላ ሓደ ኣይተመርጸን። ቁጽሪ ወይ ስም በሉ፣ ወይ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/noneSel.mp3`

> Waxba lama dooran. Dheh lambar ama magac, ama dheh Ka bood.

### `idle`: Nothing heard

**English** → `public/audio/en/idle.mp3`

> We did not hear you. Press the big Speak button, or press Stop reading to use the keyboard.

**አማርኛ (draft, must be checked)** → `public/audio/am/idle.mp3`

> አልሰማንዎትም። ትልቁን «ተናገር» ቁልፍ ይጫኑ፤ ወይም ኪቦርድ ለመጠቀም «ማንበብ አቁም» ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/idle.mp3`

> Si hin dhageenye. Qabduu guddaa Dubbadhu tuqi, ykn kiiboordii fayyadamuuf Dubbisuu dhaabi tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/idle.mp3`

> ኣይሰማዕናኩምን። ነቲ ዓቢ «ተዛረብ» መጠወቒ ጠውቑ፣ ወይ ኪቦርድ ንምጥቃም «ምንባብ ኣቋርጽ» ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/idle.mp3`

> Ma aanaan ku maqal. Riix badhanka weyn ee Hadal, ama riix Jooji akhrinta si aad u isticmaasho kiiboodhka.

### `sayWelcome`: Welcome page: say Start

**English** → `public/audio/en/sayWelcome.mp3`

> Say Start to begin.

**አማርኛ (draft, must be checked)** → `public/audio/am/sayWelcome.mp3`

> ለመጀመር «ጀምር» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/sayWelcome.mp3`

> Jalqabuuf Jalqabi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/sayWelcome.mp3`

> ንምጅማር «ጀምር» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/sayWelcome.mp3`

> Dheh Bilow si aad u bilowdo.

### `reviewAsk`: Review page: do you want to submit?

**English** → `public/audio/en/reviewAsk.mp3`

> Do you want to submit your answers? Say Yes to submit, or No to change something.

**አማርኛ (draft, must be checked)** → `public/audio/am/reviewAsk.mp3`

> መልሶችዎን ማስገባት ይፈልጋሉ? ለማስገባት «አዎ»፣ አንድ ነገር ለመቀየር «አይ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/reviewAsk.mp3`

> Deebii kee erguu barbaaddaa? Erguuf Eeyyee, waa jijjiiruuf Lakki jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/reviewAsk.mp3`

> መልስታትኩም ከተረክቡ ትደልዩ ዶ? ንምርካብ «እወ»፣ ገለ ነገር ንምቕያር «ኣይፋል» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/reviewAsk.mp3`

> Ma rabtaa inaad gudbiso jawaabahaaga? Dheh Haa si aad u gudbiso, ama Maya si aad wax u beddesho.

### `heardGeneric`: Spoken answer received (used when the device has no voice)

**English** → `public/audio/en/heardGeneric.mp3`

> We heard your answer. It is shown on the screen. Say Next to continue, or say your answer again.

**አማርኛ (draft, must be checked)** → `public/audio/am/heardGeneric.mp3`

> መልስዎን ሰምተናል። በማያ ገጹ ላይ ይታያል። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/heardGeneric.mp3`

> Deebii kee dhageenyeerra. Iskiriinii irratti mul'ata. Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/heardGeneric.mp3`

> መልስኹም ሰሚዕና። ኣብ ስክሪን ይርአ ኣሎ። ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/heardGeneric.mp3`

> Waan maqalnay jawaabtaada. Waxay ka muuqataa shaashadda. Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada.

### `choseA`: Confirmation, first part ("You chose")

**English** → `public/audio/en/choseA.mp3`

> You chose

**አማርኛ (draft, must be checked)** → `public/audio/am/choseA.mp3`

> የመረጡት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/choseA.mp3`

> Kan filatte

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/choseA.mp3`

> ዝመረጽኩምዎ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/choseA.mp3`

> Waxaad dooratay

### `choseB`: Confirmation, last part

**English** → `public/audio/en/choseB.mp3`

> Say Next to continue, or choose again.

**አማርኛ (draft, must be checked)** → `public/audio/am/choseB.mp3`

> ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/choseB.mp3`

> Itti fufuuf Itti fufi jedhi, ykn ammas filadhu.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/choseB.mp3`

> ንምቕጻል «ቀጽል» በሉ፣ ወይ ደጊምኩም ምረጹ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/choseB.mp3`

> Dheh Xiga si aad u sii socoto, ama mar kale dooro.

### `errConsentNeed`: Error: consent box not ticked

**English** → `public/audio/en/errConsentNeed.mp3`

> Please tick the box to agree before sending, or press Back.

**አማርኛ (draft, must be checked)** → `public/audio/am/errConsentNeed.mp3`

> ከመላክዎ በፊት ለመስማማት ሳጥኑን ምልክት ያድርጉ፤ ወይም ተመለስ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errConsentNeed.mp3`

> Maaloo osoo hin ergin dura walii galuuf saanduqa mallattoo godhi, ykn Duubatti tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errConsentNeed.mp3`

> በጃኹም ቅድሚ ምልኣኽ ንምስምማዕ ነቲ ሳንዱቕ ምልክት ግበሩ፣ ወይ «ተመለስ» ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errConsentNeed.mp3`

> Fadlan calaamadee sanduuqa si aad u oggolaato ka hor intaadan dirin, ama riix Dib u noqo.

### `errDateBad`: Error: date has no month

**English** → `public/audio/en/errDateBad.mp3`

> Please choose a month, or set day and year to Not sure to skip the date.

**አማርኛ (draft, must be checked)** → `public/audio/am/errDateBad.mp3`

> እባክዎ ወር ይምረጡ፤ ወይም ቀኑን ለመዝለል ቀንና ዓመትን «እርግጠኛ አይደለሁም» ያድርጉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errDateBad.mp3`

> Maaloo ji'a filadhu, ykn guyyaa fi bara 'Hin beeku' godhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errDateBad.mp3`

> በጃኹም ወርሒ ምረጹ፣ ወይ መዓልትን ዓመትን «ርግጸኛ ኣይኮንኩን» ግበሩ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errDateBad.mp3`

> Fadlan dooro bil, ama maalinta iyo sanadka ka dhig 'Ma hubo'.

### `draftH`: Welcome back (answers kept on this device)

**English** → `public/audio/en/draftH.mp3`

> Welcome back Your answers from last time are kept on this device. Continue where I stopped Start again

**አማርኛ (draft, must be checked)** → `public/audio/am/draftH.mp3`

> እንኳን ደህና ተመለሱ ካለፈው ጊዜ መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል። ካቆምኩበት ቀጥል እንደገና ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/draftH.mp3`

> Baga nagaan deebitan Deebiin kee yeroo darbe meeshaa kana irratti kuufameera. Iddoon dhaabe irraa itti fufi Irra deebi'ii jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/draftH.mp3`

> እንቋዕ ብደሓን ተመለስኩም መልስታትኩም ካብ ዝሓለፈ ግዜ ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ። ካብ ዝኣቋረጽኩዎ ቀጽል ደጊምካ ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/draftH.mp3`

> Ku soo dhawoow mar kale Jawaabahaagii hore waxay ku kaydsan yihiin qalabkan. Ka sii wad halkii aan ku joogsaday Dib u bilow

### `queued`: Offline: answers saved on the device, sent later

**English** → `public/audio/en/queued.mp3`

> You are offline. Your answers are saved on this device and will be sent when you are back online.

**አማርኛ (draft, must be checked)** → `public/audio/am/queued.mp3`

> ከመስመር ውጭ ነዎት። መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል፤ መስመር ላይ ሲመለሱ ይላካሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/queued.mp3`

> Ati toora ala jirta. Deebiin kee meeshaa kana irratti kuufameera, yeroo toora irratti deebitu ni ergama.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/queued.mp3`

> ካብ መስመር ወጻኢ ኢኹም። መልስታትኩም ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ፣ ናብ መስመር ምስ ተመለስኩም ክለኣኹ እዮም።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/queued.mp3`

> Khadka kama jirtid. Jawaabahaaga waxay ku kaydsan yihiin qalabkan, waxaana la diri doonaa markaad khadka ku soo noqoto.

### `sentLater`: Saved answers were sent

**English** → `public/audio/en/sentLater.mp3`

> Your saved answers have now been sent.

**አማርኛ (draft, must be checked)** → `public/audio/am/sentLater.mp3`

> የተቀመጡት መልሶችዎ አሁን ተልከዋል።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/sentLater.mp3`

> Deebiin kee kuufame amma ergameera.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/sentLater.mp3`

> እቶም ዝተዓቀቡ መልስታትኩም ሕጂ ተላኢኾም።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/sentLater.mp3`

> Jawaabahaagii kaydsanaa hadda waa la diray.

### `tapToHear`: Press a key or tap to hear the questions

**English** → `public/audio/en/tapToHear.mp3`

> Press any key or tap the screen to hear the questions.

**አማርኛ (draft, must be checked)** → `public/audio/am/tapToHear.mp3`

> ጥያቄዎቹን ለመስማት ማንኛውንም ቁልፍ ይጫኑ ወይም ማያውን ይንኩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/tapToHear.mp3`

> Gaaffilee dhaga'uuf qabduu kamiyyuu tuqi ykn iskiriinii tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/tapToHear.mp3`

> ሕቶታት ንምስማዕ ዝኾነ መጠወቒ ጠውቑ ወይ ስክሪን ተንክፉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/tapToHear.mp3`

> Riix fure kasta ama taabo shaashadda si aad u maqasho su'aalaha.

### `n1`: Number 1 (used in the confirmation)

**English** → `public/audio/en/n1.mp3`

> One

**አማርኛ (draft, must be checked)** → `public/audio/am/n1.mp3`

> አንድ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n1.mp3`

> Tokko

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n1.mp3`

> ሓደ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n1.mp3`

> Kow

### `n2`: Number 2 (used in the confirmation)

**English** → `public/audio/en/n2.mp3`

> Two

**አማርኛ (draft, must be checked)** → `public/audio/am/n2.mp3`

> ሁለት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n2.mp3`

> Lama

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n2.mp3`

> ክልተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n2.mp3`

> Laba

### `n3`: Number 3 (used in the confirmation)

**English** → `public/audio/en/n3.mp3`

> Three

**አማርኛ (draft, must be checked)** → `public/audio/am/n3.mp3`

> ሦስት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n3.mp3`

> Sadii

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n3.mp3`

> ሰለስተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n3.mp3`

> Saddex

### `n4`: Number 4 (used in the confirmation)

**English** → `public/audio/en/n4.mp3`

> Four

**አማርኛ (draft, must be checked)** → `public/audio/am/n4.mp3`

> አራት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n4.mp3`

> Afur

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n4.mp3`

> ኣርባዕተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n4.mp3`

> Afar

### `n5`: Number 5 (used in the confirmation)

**English** → `public/audio/en/n5.mp3`

> Five

**አማርኛ (draft, must be checked)** → `public/audio/am/n5.mp3`

> አምስት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n5.mp3`

> Shan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n5.mp3`

> ሓሙሽተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n5.mp3`

> Shan

### `n6`: Number 6 (used in the confirmation)

**English** → `public/audio/en/n6.mp3`

> Six

**አማርኛ (draft, must be checked)** → `public/audio/am/n6.mp3`

> ስድስት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n6.mp3`

> Jaha

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n6.mp3`

> ሽዱሽተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n6.mp3`

> Lix

### `n7`: Number 7 (used in the confirmation)

**English** → `public/audio/en/n7.mp3`

> Seven

**አማርኛ (draft, must be checked)** → `public/audio/am/n7.mp3`

> ሰባት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n7.mp3`

> Torba

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n7.mp3`

> ሸውዓተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n7.mp3`

> Toddoba

### `n8`: Number 8 (used in the confirmation)

**English** → `public/audio/en/n8.mp3`

> Eight

**አማርኛ (draft, must be checked)** → `public/audio/am/n8.mp3`

> ስምንት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n8.mp3`

> Saddeet

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n8.mp3`

> ሸሞንተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n8.mp3`

> Siddeed

### `reviewFix`: Review page, second part (after the person says No to submitting)

**English** → `public/audio/en/reviewFix.mp3`

> Say Start again to go back to the first question, or say the number of the question you want to change.

**አማርኛ (draft, must be checked)** → `public/audio/am/reviewFix.mp3`

> ወደ መጀመሪያው ጥያቄ ለመመለስ «እንደገና ጀምር» ይበሉ፤ ወይም መቀየር የሚፈልጉትን ጥያቄ ቁጥር ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/reviewFix.mp3`

> Gara gaaffii jalqabaatti deebi'uuf Irra deebi'ii jalqabi jedhi, ykn lakkoofsa gaaffii jijjiiruu barbaaddu jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/reviewFix.mp3`

> ናብ ቀዳማይ ሕቶ ንምምላስ «ደጊምካ ጀምር» በሉ፣ ወይ ቁጽሪ ክትቕይርዎ እትደልዩ ሕቶ በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/reviewFix.mp3`

> Dheh Dib u bilow si aad ugu noqoto su'aasha koowaad, ama dheh lambarka su'aasha aad rabto inaad beddesho.

### `done`: Thank-you page

**English** → `public/audio/en/done.mp3`

> Thank you. We received your answers.

**አማርኛ (draft, must be checked)** → `public/audio/am/done.mp3`

> እናመሰግናለን። መልሶችዎን ተቀብለናል።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/done.mp3`

> Galatoomi. Deebii kee argannee jirra.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/done.mp3`

> የቐንየልና። መልስታትኩም ተቐቢልናዮ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/done.mp3`

> Mahadsanid. Waan helnay jawaabahaaga.

### `speakNow`: Said just before the microphone opens (then a beep)

**English** → `public/audio/en/speakNow.mp3`

> Speak now.

**አማርኛ (draft, must be checked)** → `public/audio/am/speakNow.mp3`

> አሁን ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/speakNow.mp3`

> Amma dubbadhu.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/speakNow.mp3`

> ሕጂ ተዛረቡ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/speakNow.mp3`

> Hadda hadal.

### `sel`: Focus: a choice that is ticked

**English** → `public/audio/en/sel.mp3`

> selected

**አማርኛ (draft, must be checked)** → `public/audio/am/sel.mp3`

> ተመርጧል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/sel.mp3`

> filatameera

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/sel.mp3`

> ተመሪጹ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/sel.mp3`

> waa la doortay

### `unsel`: Focus: a choice that is not ticked

**English** → `public/audio/en/unsel.mp3`

> not selected

**አማርኛ (draft, must be checked)** → `public/audio/am/unsel.mp3`

> አልተመረጠም

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/unsel.mp3`

> hin filatamne

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/unsel.mp3`

> ኣይተመርጸን

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/unsel.mp3`

> lama dooran

### `langName`: Focus: a language button, in that language

**English** → `public/audio/en/langName.mp3`

> English

**አማርኛ (draft, must be checked)** → `public/audio/am/langName.mp3`

> አማርኛ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/langName.mp3`

> Afaan Oromoo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/langName.mp3`

> ትግርኛ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/langName.mp3`

> Soomaali

### `b_next`: Focus: the "Next" button

**English** → `public/audio/en/b_next.mp3`

> Next

**አማርኛ (draft, must be checked)** → `public/audio/am/b_next.mp3`

> ቀጥል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_next.mp3`

> Itti fufi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_next.mp3`

> ቀጽል

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_next.mp3`

> Xiga

### `b_back`: Focus: the "Back" button

**English** → `public/audio/en/b_back.mp3`

> Back

**አማርኛ (draft, must be checked)** → `public/audio/am/b_back.mp3`

> ተመለስ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_back.mp3`

> Duubatti

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_back.mp3`

> ተመለስ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_back.mp3`

> Dib u noqo

### `b_skip`: Focus: the "Skip" button

**English** → `public/audio/en/b_skip.mp3`

> Skip

**አማርኛ (draft, must be checked)** → `public/audio/am/b_skip.mp3`

> ዝለል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_skip.mp3`

> Irra darbi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_skip.mp3`

> ሕለፍ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_skip.mp3`

> Ka bood

### `b_read`: Focus: the "Read aloud" button

**English** → `public/audio/en/b_read.mp3`

> Read aloud

**አማርኛ (draft, must be checked)** → `public/audio/am/b_read.mp3`

> አንብብልኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_read.mp3`

> Sagaleedhaan dubbisi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_read.mp3`

> ኣንብበለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_read.mp3`

> Akhri

### `b_speak`: Focus: the "Speak" button

**English** → `public/audio/en/b_speak.mp3`

> Speak

**አማርኛ (draft, must be checked)** → `public/audio/am/b_speak.mp3`

> ተናገር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_speak.mp3`

> Dubbadhu

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_speak.mp3`

> ተዛረብ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_speak.mp3`

> Hadal

### `b_readToMe`: Focus: the "Read to me" button

**English** → `public/audio/en/b_readToMe.mp3`

> Read to me

**አማርኛ (draft, must be checked)** → `public/audio/am/b_readToMe.mp3`

> አንብቡልኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_readToMe.mp3`

> Naaf dubbisi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_readToMe.mp3`

> ኣንብቡለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_readToMe.mp3`

> Ii akhri

### `b_stopRead`: Focus: the "Stop reading" button

**English** → `public/audio/en/b_stopRead.mp3`

> Stop reading

**አማርኛ (draft, must be checked)** → `public/audio/am/b_stopRead.mp3`

> ማንበብ አቁም

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_stopRead.mp3`

> Dubbisuu dhaabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_stopRead.mp3`

> ምንባብ ኣቋርጽ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_stopRead.mp3`

> Jooji akhrinta

### `b_send`: Focus: the "Yes, submit" button

**English** → `public/audio/en/b_send.mp3`

> Yes, submit

**አማርኛ (draft, must be checked)** → `public/audio/am/b_send.mp3`

> አዎ፣ አስገባ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_send.mp3`

> Eeyyee, ergi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_send.mp3`

> እወ፣ ኣረክብ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_send.mp3`

> Haa, gudbi

### `b_noChange`: Focus: the "No, change something" button

**English** → `public/audio/en/b_noChange.mp3`

> No, change something

**አማርኛ (draft, must be checked)** → `public/audio/am/b_noChange.mp3`

> አይ፣ አንድ ነገር ልቀይር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_noChange.mp3`

> Lakki, waan tokko jijjiira

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_noChange.mp3`

> ኣይፋል፣ ገለ ክቕይር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_noChange.mp3`

> Maya, wax baan beddelayaa

### `b_restart`: Focus: the "Start again" button

**English** → `public/audio/en/b_restart.mp3`

> Start again

**አማርኛ (draft, must be checked)** → `public/audio/am/b_restart.mp3`

> እንደገና ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_restart.mp3`

> Irra deebi'ii jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_restart.mp3`

> ደጊምካ ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_restart.mp3`

> Dib u bilow

### `b_change`: Focus: the "Change" button

**English** → `public/audio/en/b_change.mp3`

> Change

**አማርኛ (draft, must be checked)** → `public/audio/am/b_change.mp3`

> ቀይር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_change.mp3`

> Jijjiiri

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_change.mp3`

> ቀይር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_change.mp3`

> Beddel

### `b_start`: Focus: the "Start" button

**English** → `public/audio/en/b_start.mp3`

> Start

**አማርኛ (draft, must be checked)** → `public/audio/am/b_start.mp3`

> ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_start.mp3`

> Jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_start.mp3`

> ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_start.mp3`

> Bilow

### `b_startVoice`: Focus: the "Start with voice" button

**English** → `public/audio/en/b_startVoice.mp3`

> Start with voice

**አማርኛ (draft, must be checked)** → `public/audio/am/b_startVoice.mp3`

> በድምፅ ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_startVoice.mp3`

> Sagaleedhaan jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_startVoice.mp3`

> ብድምጺ ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_startVoice.mp3`

> Ku bilow cod

### `b_raYes`: Focus: the "Yes, read aloud" button

**English** → `public/audio/en/b_raYes.mp3`

> Yes, read aloud

**አማርኛ (draft, must be checked)** → `public/audio/am/b_raYes.mp3`

> አዎ፣ ይነበብልኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_raYes.mp3`

> Eeyyee, naaf dubbisi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_raYes.mp3`

> እወ፣ ኣንብቡለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_raYes.mp3`

> Haa, ii akhri

### `b_raNo`: Focus: the "No, thank you" button

**English** → `public/audio/en/b_raNo.mp3`

> No, thank you

**አማርኛ (draft, must be checked)** → `public/audio/am/b_raNo.mp3`

> አይ፣ አያስፈልግም

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_raNo.mp3`

> Lakki, galatoomi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_raNo.mp3`

> ኣይፋል፣ የቐንየለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_raNo.mp3`

> Maya, mahadsanid

### `b_draftGo`: Focus: the "Continue where I stopped" button

**English** → `public/audio/en/b_draftGo.mp3`

> Continue where I stopped

**አማርኛ (draft, must be checked)** → `public/audio/am/b_draftGo.mp3`

> ካቆምኩበት ቀጥል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_draftGo.mp3`

> Iddoon dhaabe irraa itti fufi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_draftGo.mp3`

> ካብ ዝኣቋረጽኩዎ ቀጽል

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_draftGo.mp3`

> Ka sii wad halkii aan ku joogsaday

### `o_prefs_large`: Focus: choice "Larger text" (question prefs)

**English** → `public/audio/en/o_prefs_large.mp3`

> Larger text

**አማርኛ (draft, must be checked)** → `public/audio/am/o_prefs_large.mp3`

> ትልቅ ጽሑፍ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_prefs_large.mp3`

> Barreeffama guddaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_prefs_large.mp3`

> ዓቢ ጽሑፍ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_prefs_large.mp3`

> Qoraal ka weyn

### `o_prefs_simple`: Focus: choice "Pictures next to choices" (question prefs)

**English** → `public/audio/en/o_prefs_simple.mp3`

> Pictures next to choices

**አማርኛ (draft, must be checked)** → `public/audio/am/o_prefs_simple.mp3`

> ከምርጫዎች ጋር ሥዕሎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_prefs_simple.mp3`

> Filannoo cinaatti fakkii

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_prefs_simple.mp3`

> ምስ ምርጫታት ስእልታት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_prefs_simple.mp3`

> Sawirro ku xiga doorashooyinka

### `q_fullName`: Focus: the answer box of "What is your full name?"

**English** → `public/audio/en/q_fullName.mp3`

> What is your full name?

**አማርኛ (draft, must be checked)** → `public/audio/am/q_fullName.mp3`

> ሙሉ ስምዎ ማነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_fullName.mp3`

> Maqaan kee guutuun eenyu?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_fullName.mp3`

> ምሉእ ስምኩም መን እዩ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_fullName.mp3`

> Waa maxay magacaaga oo buuxa?

### `q_contact`: Focus: the answer box of "What phone number or email can we use?"

**English** → `public/audio/en/q_contact.mp3`

> What phone number or email can we use?

**አማርኛ (draft, must be checked)** → `public/audio/am/q_contact.mp3`

> ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_contact.mp3`

> Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_contact.mp3`

> ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_contact.mp3`

> Lambarkee taleefan ama iimayl ayaan isticmaali karnaa?

### `o_idRoute_kebele`: Focus: choice "Kebele ID or passport" (question idRoute)

**English** → `public/audio/en/o_idRoute_kebele.mp3`

> Kebele ID or passport

**አማርኛ (draft, must be checked)** → `public/audio/am/o_idRoute_kebele.mp3`

> ቀበሌ መታወቂያ ወይም ፓስፖርት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_kebele.mp3`

> Waraqaa eenyummaa gandaa ykn paaspoortii

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_kebele.mp3`

> መንነት ቀበሌ ወይ ፓስፖርት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_kebele.mp3`

> Aqoonsiga kebele ama baasaboor

### `o_idRoute_refugee`: Focus: choice "Refugee or returnee ID" (question idRoute)

**English** → `public/audio/en/o_idRoute_refugee.mp3`

> Refugee or returnee ID

**አማርኛ (draft, must be checked)** → `public/audio/am/o_idRoute_refugee.mp3`

> የስደተኛ ወይም ተመላሽ መታወቂያ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_refugee.mp3`

> Waraqaa eenyummaa baqataa ykn deebi'aa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_refugee.mp3`

> መንነት ስደተኛ ወይ ተመላሲ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_refugee.mp3`

> Aqoonsiga qaxootiga ama soo-noqotaha

### `o_idRoute_other`: Focus: choice "Another document" (question idRoute)

**English** → `public/audio/en/o_idRoute_other.mp3`

> Another document

**አማርኛ (draft, must be checked)** → `public/audio/am/o_idRoute_other.mp3`

> ሌላ ሰነድ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_other.mp3`

> Sanada biraa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_other.mp3`

> ካልእ ሰነድ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_other.mp3`

> Dukumenti kale

### `o_idRoute_refer`: Focus: choice "I don't have an ID. Refer me through a partner organisation" (question idRoute)

**English** → `public/audio/en/o_idRoute_refer.mp3`

> I don't have an ID. Refer me through a partner organisation

**አማርኛ (draft, must be checked)** → `public/audio/am/o_idRoute_refer.mp3`

> ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_refer.mp3`

> Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_refer.mp3`

> መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_refer.mp3`

> Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi

### `o_support_screenreader`: Focus: choice "I use a screen reader" (question support)

**English** → `public/audio/en/o_support_screenreader.mp3`

> I use a screen reader

**አማርኛ (draft, must be checked)** → `public/audio/am/o_support_screenreader.mp3`

> ስክሪን ሪደር እጠቀማለሁ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_screenreader.mp3`

> Dubbisaa iskiriinii nan fayyadama

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_screenreader.mp3`

> ስክሪን ሪደር እጥቀም

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_screenreader.mp3`

> Waxaan isticmaalaa akhriyaha shaashadda

### `o_support_large`: Focus: choice "Large text" (question support)

**English** → `public/audio/en/o_support_large.mp3`

> Large text

**አማርኛ (draft, must be checked)** → `public/audio/am/o_support_large.mp3`

> ትልቅ ጽሑፍ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_large.mp3`

> Barreeffama guddaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_large.mp3`

> ዓቢ ጽሑፍ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_large.mp3`

> Qoraal weyn

### `o_support_voice`: Focus: choice "I prefer to speak my answers" (question support)

**English** → `public/audio/en/o_support_voice.mp3`

> I prefer to speak my answers

**አማርኛ (draft, must be checked)** → `public/audio/am/o_support_voice.mp3`

> መልሶቼን በድምፅ መናገር እመርጣለሁ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_voice.mp3`

> Deebii koo dubbachuu nan filadha

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_voice.mp3`

> መልስታተይ ብድምጺ ክዛረብ እመርጽ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_voice.mp3`

> Waxaan doorbidaa inaan ku hadlo jawaabahayga

### `o_support_sign`: Focus: choice "Ethiopian Sign Language interpreter" (question support)

**English** → `public/audio/en/o_support_sign.mp3`

> Ethiopian Sign Language interpreter

**አማርኛ (draft, must be checked)** → `public/audio/am/o_support_sign.mp3`

> የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_sign.mp3`

> Hiikaa Afaan Mallattoo Itoophiyaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_sign.mp3`

> ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_sign.mp3`

> Turjubaan Luqadda Calaamadaha Itoobiya

### `o_support_simple`: Focus: choice "Simple words and pictures" (question support)

**English** → `public/audio/en/o_support_simple.mp3`

> Simple words and pictures

**አማርኛ (draft, must be checked)** → `public/audio/am/o_support_simple.mp3`

> ቀላል ቃላትና ሥዕሎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_simple.mp3`

> Jechoota salphaa fi fakkiiwwan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_simple.mp3`

> ቀለልቲ ቃላትን ስእልታትን

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_simple.mp3`

> Erayo fudud iyo sawirro

### `o_support_human`: Focus: choice "Please call me to help" (question support)

**English** → `public/audio/en/o_support_human.mp3`

> Please call me to help

**አማርኛ (draft, must be checked)** → `public/audio/am/o_support_human.mp3`

> እባክዎ ደውለው ያግዙኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_human.mp3`

> Maaloo na gargaaruuf natti bilbilaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_human.mp3`

> በጃኹም ደዊልኩም ሓግዙኒ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_human.mp3`

> Fadlan ii soo wac si aad ii caawiso

### `o_needs_stepfree`: Focus: choice "Step-free workplace" (question needs)

**English** → `public/audio/en/o_needs_stepfree.mp3`

> Step-free workplace

**አማርኛ (draft, must be checked)** → `public/audio/am/o_needs_stepfree.mp3`

> ከደረጃ ነፃ የሥራ ቦታ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_stepfree.mp3`

> Bakka hojii gulantaa hin qabne

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_stepfree.mp3`

> ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_stepfree.mp3`

> Goob shaqo oo aan jaranjaro lahayn

### `o_needs_reader`: Focus: choice "Screen-reader friendly tools" (question needs)

**English** → `public/audio/en/o_needs_reader.mp3`

> Screen-reader friendly tools

**አማርኛ (draft, must be checked)** → `public/audio/am/o_needs_reader.mp3`

> ለስክሪን ሪደር ተስማሚ መሣሪያዎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_reader.mp3`

> Meeshaalee dubbisaa iskiriinii waliin hojjetan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_reader.mp3`

> ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_reader.mp3`

> Qalab ku habboon akhriyaha shaashadda

### `o_needs_interp`: Focus: choice "Sign language interpreter" (question needs)

**English** → `public/audio/en/o_needs_interp.mp3`

> Sign language interpreter

**አማርኛ (draft, must be checked)** → `public/audio/am/o_needs_interp.mp3`

> የምልክት ቋንቋ አስተርጓሚ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_interp.mp3`

> Hiikaa afaan mallattoo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_interp.mp3`

> ተርጓሚ ቋንቋ ምልክት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_interp.mp3`

> Turjubaan luqadda calaamadaha

### `o_needs_hours`: Focus: choice "Flexible hours" (question needs)

**English** → `public/audio/en/o_needs_hours.mp3`

> Flexible hours

**አማርኛ (draft, must be checked)** → `public/audio/am/o_needs_hours.mp3`

> ተለዋዋጭ የሥራ ሰዓት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_hours.mp3`

> Sa'aatii hojii jijjiiramaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_hours.mp3`

> ተዓጻጻፊ ሰዓታት ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_hours.mp3`

> Saacado dabacsan

### `o_needs_remote`: Focus: choice "Work from home" (question needs)

**English** → `public/audio/en/o_needs_remote.mp3`

> Work from home

**አማርኛ (draft, must be checked)** → `public/audio/am/o_needs_remote.mp3`

> ከቤት መሥራት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_remote.mp3`

> Mana irraa hojjechuu

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_remote.mp3`

> ካብ ገዛ ምስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_remote.mp3`

> Ka shaqeyn guriga

### `q_role`: Job page: the question "Which job are you applying for?" (the job titles are read by the device voice)

**English** → `public/audio/en/q_role.mp3`

> Which job are you applying for?

**አማርኛ (draft, must be checked)** → `public/audio/am/q_role.mp3`

> የትኛውን ሥራ እየጠየቁ ነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_role.mp3`

> Hojii kamiif iyyachaa jirta?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_role.mp3`

> ንኣየናይ ስራሕ ኢኹም እትሓቱ ዘለኹም?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_role.mp3`

> Shaqadee ayaad codsanaysaa?

### `q_why`: Focus: the answer box of "Why do you want this job?"

**English** → `public/audio/en/q_why.mp3`

> Why do you want this job?

**አማርኛ (draft, must be checked)** → `public/audio/am/q_why.mp3`

> ይህን ሥራ ለምን ይፈልጋሉ?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_why.mp3`

> Hojii kana maaliif barbaadda?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_why.mp3`

> ነዚ ስራሕ ስለምንታይ ትደልይዎ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_why.mp3`

> Maxaad u rabtaa shaqadan?

### `q_job`: Focus: the answer box of "What is the job title?"

**English** → `public/audio/en/q_job.mp3`

> What is the job title?

**አማርኛ (draft, must be checked)** → `public/audio/am/q_job.mp3`

> የሥራው መጠሪያ ምንድን ነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_job.mp3`

> Maqaan hojii kanaa maali?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_job.mp3`

> ሽም እቲ ስራሕ እንታይ እዩ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_job.mp3`

> Waa maxay magaca shaqada?

### `o_offers_stepfree`: Focus: choice "Step-free workplace" (question offers)

**English** → `public/audio/en/o_offers_stepfree.mp3`

> Step-free workplace

**አማርኛ (draft, must be checked)** → `public/audio/am/o_offers_stepfree.mp3`

> ከደረጃ ነፃ የሥራ ቦታ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_stepfree.mp3`

> Bakka hojii gulantaa hin qabne

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_stepfree.mp3`

> ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_stepfree.mp3`

> Goob shaqo oo aan jaranjaro lahayn

### `o_offers_reader`: Focus: choice "Screen-reader friendly tools" (question offers)

**English** → `public/audio/en/o_offers_reader.mp3`

> Screen-reader friendly tools

**አማርኛ (draft, must be checked)** → `public/audio/am/o_offers_reader.mp3`

> ለስክሪን ሪደር ተስማሚ መሣሪያዎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_reader.mp3`

> Meeshaalee dubbisaa iskiriinii waliin hojjetan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_reader.mp3`

> ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_reader.mp3`

> Qalab ku habboon akhriyaha shaashadda

### `o_offers_interp`: Focus: choice "Sign language interpreter" (question offers)

**English** → `public/audio/en/o_offers_interp.mp3`

> Sign language interpreter

**አማርኛ (draft, must be checked)** → `public/audio/am/o_offers_interp.mp3`

> የምልክት ቋንቋ አስተርጓሚ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_interp.mp3`

> Hiikaa afaan mallattoo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_interp.mp3`

> ተርጓሚ ቋንቋ ምልክት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_interp.mp3`

> Turjubaan luqadda calaamadaha

### `o_offers_hours`: Focus: choice "Flexible hours" (question offers)

**English** → `public/audio/en/o_offers_hours.mp3`

> Flexible hours

**አማርኛ (draft, must be checked)** → `public/audio/am/o_offers_hours.mp3`

> ተለዋዋጭ የሥራ ሰዓት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_hours.mp3`

> Sa'aatii hojii jijjiiramaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_hours.mp3`

> ተዓጻጻፊ ሰዓታት ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_hours.mp3`

> Saacado dabacsan

### `o_offers_remote`: Focus: choice "Work from home" (question offers)

**English** → `public/audio/en/o_offers_remote.mp3`

> Work from home

**አማርኛ (draft, must be checked)** → `public/audio/am/o_offers_remote.mp3`

> ከቤት መሥራት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_remote.mp3`

> Mana irraa hojjechuu

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_remote.mp3`

> ካብ ገዛ ምስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_remote.mp3`

> Ka shaqeyn guriga

---

## After making the clips
- Test every language, with the phone volume low and high.
- Confirm each file starts playing within about one second on a phone.
- Tell the team which files are still missing; the device voice covers them where it can.
