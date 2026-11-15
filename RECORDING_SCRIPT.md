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
| Sidaamu Afoo Sidama | `sid` | `public/audio/sid/` | Generated clips (`facebook/mms-tts-sid`). The text is a rough draft: a native speaker must correct the SID block first. |

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
- **679 files in total**: 114 for `en`, 114 for `am`, 113 for `om`, 113 for `ti`, 112 for `so`, 113 for `sid`.
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
- The **contact** question (phone or email) can be **spoken or typed**. A spoken phone number is read back digit by digit: `heardA` ("We heard"), the digit clips `n0` to `n9`, then `heardB`.
- The confirmation after a choice is three clips played in a row: `choseA` ("You chose"), then the number clips `n1` to `n9`, then `choseB`.
- The **language page** asks in English for English only (`langAsk`); each other language then names itself in its own voice (`langSelf`). If no language is heard, `langAgain` asks again in English and Amharic.
- If a website hides a question with the `hide` attribute, the clips still describe the full list.
- The **Stop reading** button and the Escape key stop any clip or voice at any time.
- **Key names** (Tab, Shift, Space, Enter, Escape, Esc) are said by the **English** voice inside every language's clip, because people know the keys by their English names. The generator does this by itself (`KEY_WORDS` in `tools/colab_template.py`). A person recording by hand should say them the English way too.
- **Words the voice mispronounces**: the romaniser adds a vowel after every vowelless Ge'ez letter (ሁለት became "hulate"). Put the right Latin spelling for such a word in `PRONOUNCE` in `tools/colab_template.py`, chosen by a native speaker by ear, then remake those clips.

## Not recorded (they change each time)
- **review** (the last page) as one recording: it holds the person's own answers. It is put together instead from short clips: `reviewH`, then for each answer `n1`… + `q_<question>` + the chosen `o_…` clip (or `skipped`, or the digits), then `consentOrg` (or `consentSendA` + the partner's name + `consentSendB`) and `reviewAsk`. Typed words such as a name are read by the device voice; when there is no voice for the language, an English voice reads them (Ge'ez in Latin letters).
- **role** (job flow): the list of jobs depends on the person's filter and on jobs employers add. Only the question (`q_role`) and the numbers are clips.
- The exact words a person typed or said. The device voice reads them back when it has a voice for the language; otherwise `heardGeneric` is played.

## Checklist
| ID | Page | Optional question? | Languages |
|---|---|---|---|
| `langAsk` | Language page: the question, in English only | - | en |
| `langNone` | Language page: no language was heard (English only) | - | en |
| `langAgain` | Language page: second try, said in English and then Amharic before an Amharic recogniser listens | - | en, am |
| `langSelf` | Language page: invitation in the language itself (played after langAsk) | - | am, om, ti, so, sid |
| `raAsk` | First question in the chosen language (asks if the page should be read aloud) | - | en, am, om, ti, so, sid |
| `raAgain` | Second ask, if no answer was heard | - | en, am, om, ti, so, sid |
| `welcome` | Welcome page (after they said Yes to read aloud) | - | en, am, om, ti, so, sid |
| `prefs` | signup flow, question 1 | yes (includes "Say Skip") | en, am, om, ti, so, sid |
| `fullName` | signup flow, question 2 | no | en, am, om, ti, so, sid |
| `contact` | signup flow, question 3 | no | en, am, om, ti, so, sid |
| `idRoute` | signup flow, question 4 | no | en, am, om, ti, so, sid |
| `support` | signup flow, question 5 | yes (includes "Say Skip") | en, am, om, ti, so, sid |
| `needs` | job flow, question 1 | yes (includes "Say Skip") | en, am, om, ti, so, sid |
| `why` | job flow, question 3 | no | en, am, om, ti, so, sid |
| `job` | employer flow, question 1 | no | en, am, om, ti, so, sid |
| `offers` | employer flow, question 2 | yes (includes "Say Skip") | en, am, om, ti, so, sid |
| `closes` | employer flow, question 3 | yes (includes "Say Skip") | en, am, om, ti, so, sid |
| `errNeed` | Error: question not answered | - | en, am, om, ti, so, sid |
| `errBad` | Error: phone number or email not valid | - | en, am, om, ti, so, sid |
| `errFail` | Error: could not send | - | en, am, om, ti, so, sid |
| `unclear` | Voice answer not understood | - | en, am, om, ti, so, sid |
| `noneSel` | Nothing chosen yet | - | en, am, om, ti, so, sid |
| `idle` | Nothing heard | - | en, am, om, ti, so, sid |
| `sayWelcome` | Welcome page: say Start | - | en, am, om, ti, so, sid |
| `reviewAsk` | Review page: do you want to submit? | - | en, am, om, ti, so, sid |
| `heardGeneric` | Spoken answer received (used when the device has no voice) | - | en, am, om, ti, so, sid |
| `choseA` | Confirmation, first part ("You chose") | - | en, am, om, ti, so, sid |
| `choseB` | Confirmation, last part | - | en, am, om, ti, so, sid |
| `errConsentNeed` | Error: consent box not ticked | - | en, am, om, ti, so, sid |
| `errDateBad` | Error: date has no month | - | en, am, om, ti, so, sid |
| `draftH` | Welcome back (answers kept on this device) | - | en, am, om, ti, so, sid |
| `queued` | Offline: answers saved on the device, sent later | - | en, am, om, ti, so, sid |
| `sentLater` | Saved answers were sent | - | en, am, om, ti, so, sid |
| `tapToHear` | Press a key or tap to hear the questions | - | en, am, om, ti, so, sid |
| `n0` | Number 0 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n1` | Number 1 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n2` | Number 2 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n3` | Number 3 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n4` | Number 4 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n5` | Number 5 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n6` | Number 6 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n7` | Number 7 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n8` | Number 8 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `n9` | Number 9 (confirmation, review numbers, phone digits) | - | en, am, om, ti, so, sid |
| `reviewH` | Review page: heading "Check your answers" | - | en, am, om, ti, so, sid |
| `skipped` | Review page: a question that was skipped | - | en, am, om, ti, so, sid |
| `reviewKeys` | Review page: how to change an answer with the keyboard | - | en, am, om, ti, so, sid |
| `consentOrg` | Consent sentence when the site gives no partner name | - | en, am, om, ti, so, sid |
| `consentSendA` | Consent sentence, part before the partner name (the name is read by a voice) | - | en, am, om, ti, so, sid |
| `consentSendB` | Consent sentence, part after the partner name (only where words follow the name) | - | am, om, ti, sid |
| `consentSupport` | Second consent box: share support choices | - | en, am, om, ti, so, sid |
| `askSupport` | Review by voice: also share support choices? (asked after Yes) | - | en, am, om, ti, so, sid |
| `heardA` | Read-back of a spoken answer, first part ("We heard") | - | en, am, om, ti, so, sid |
| `heardB` | Read-back of a spoken answer, last part | - | en, am, om, ti, so, sid |
| `display` | Focus: the "Colours and text size" menu | - | en, am, om, ti, so, sid |
| `th_auto` | Focus: colour theme "Same as my device" | - | en, am, om, ti, so, sid |
| `th_standard` | Focus: colour theme "Standard" | - | en, am, om, ti, so, sid |
| `th_dark` | Focus: colour theme "Dark" | - | en, am, om, ti, so, sid |
| `th_contrast` | Focus: colour theme "High contrast (black and white)" | - | en, am, om, ti, so, sid |
| `th_rg` | Focus: colour theme "Blue and orange (for red-green colour blindness)" | - | en, am, om, ti, so, sid |
| `th_by` | Focus: colour theme "Teal and red (for blue-yellow colour blindness)" | - | en, am, om, ti, so, sid |
| `reviewFix` | Review page, second part (after the person says No to submitting) | - | en, am, om, ti, so, sid |
| `done` | Thank-you page | - | en, am, om, ti, so, sid |
| `speakNow` | Said just before the microphone opens (then a beep) | - | en, am, om, ti, so, sid |
| `sel` | Focus: a choice that is ticked | - | en, am, om, ti, so, sid |
| `unsel` | Focus: a choice that is not ticked | - | en, am, om, ti, so, sid |
| `langName` | Focus: a language button, in that language | - | en, am, om, ti, so, sid |
| `b_next` | Focus: the "Next" button | - | en, am, om, ti, so, sid |
| `b_back` | Focus: the "Back" button | - | en, am, om, ti, so, sid |
| `b_skip` | Focus: the "Skip" button | - | en, am, om, ti, so, sid |
| `b_read` | Focus: the "Read aloud" button | - | en, am, om, ti, so, sid |
| `b_speak` | Focus: the "Speak" button | - | en, am, om, ti, so, sid |
| `b_readToMe` | Focus: the "Read to me" button | - | en, am, om, ti, so, sid |
| `b_stopRead` | Focus: the "Stop reading" button | - | en, am, om, ti, so, sid |
| `b_send` | Focus: the "Yes, submit" button | - | en, am, om, ti, so, sid |
| `b_noChange` | Focus: the "No, change something" button | - | en, am, om, ti, so, sid |
| `b_restart` | Focus: the "Start again" button | - | en, am, om, ti, so, sid |
| `b_change` | Focus: the "Change" button | - | en, am, om, ti, so, sid |
| `b_start` | Focus: the "Start" button | - | en, am, om, ti, so, sid |
| `b_startVoice` | Focus: the "Start with voice" button | - | en, am, om, ti, so, sid |
| `b_raYes` | Focus: the "Yes, read aloud" button | - | en, am, om, ti, so, sid |
| `b_raNo` | Focus: the "No, thank you" button | - | en, am, om, ti, so, sid |
| `b_draftGo` | Focus: the "Continue where I stopped" button | - | en, am, om, ti, so, sid |
| `q_prefs` | The question "How would you like to use this form?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `o_prefs_large` | Focus: choice "Larger text" (question prefs) | - | en, am, om, ti, so, sid |
| `o_prefs_simple` | Focus: choice "Pictures next to choices" (question prefs) | - | en, am, om, ti, so, sid |
| `q_fullName` | The question "What is your full name?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `q_contact` | The question "What phone number or email can we use?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `q_idRoute` | The question "How would you like to show who you are?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `o_idRoute_kebele` | Focus: choice "Kebele ID or passport" (question idRoute) | - | en, am, om, ti, so, sid |
| `o_idRoute_refugee` | Focus: choice "Refugee or returnee ID" (question idRoute) | - | en, am, om, ti, so, sid |
| `o_idRoute_other` | Focus: choice "Another document" (question idRoute) | - | en, am, om, ti, so, sid |
| `o_idRoute_refer` | Focus: choice "I don't have an ID. Refer me through a partner organisation" (question idRoute) | - | en, am, om, ti, so, sid |
| `q_support` | The question "What support would help you? Choose any." on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `o_support_screenreader` | Focus: choice "I use a screen reader" (question support) | - | en, am, om, ti, so, sid |
| `o_support_large` | Focus: choice "Large text" (question support) | - | en, am, om, ti, so, sid |
| `o_support_voice` | Focus: choice "I prefer to speak my answers" (question support) | - | en, am, om, ti, so, sid |
| `o_support_sign` | Focus: choice "Ethiopian Sign Language interpreter" (question support) | - | en, am, om, ti, so, sid |
| `o_support_simple` | Focus: choice "Simple words and pictures" (question support) | - | en, am, om, ti, so, sid |
| `o_support_human` | Focus: choice "Please call me to help" (question support) | - | en, am, om, ti, so, sid |
| `q_needs` | The question "What support do you need at work? Choose any." on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `o_needs_stepfree` | Focus: choice "Step-free workplace" (question needs) | - | en, am, om, ti, so, sid |
| `o_needs_reader` | Focus: choice "Screen-reader friendly tools" (question needs) | - | en, am, om, ti, so, sid |
| `o_needs_interp` | Focus: choice "Sign language interpreter" (question needs) | - | en, am, om, ti, so, sid |
| `o_needs_hours` | Focus: choice "Flexible hours" (question needs) | - | en, am, om, ti, so, sid |
| `o_needs_remote` | Focus: choice "Work from home" (question needs) | - | en, am, om, ti, so, sid |
| `q_role` | Job page: the question "Which job are you applying for?" (the job titles are read by the device voice) | - | en, am, om, ti, so, sid |
| `q_why` | The question "Why do you want this job?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `q_job` | The question "What is the job title?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `q_offers` | The question "Which adjustments can this job offer?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |
| `o_offers_stepfree` | Focus: choice "Step-free workplace" (question offers) | - | en, am, om, ti, so, sid |
| `o_offers_reader` | Focus: choice "Screen-reader friendly tools" (question offers) | - | en, am, om, ti, so, sid |
| `o_offers_interp` | Focus: choice "Sign language interpreter" (question offers) | - | en, am, om, ti, so, sid |
| `o_offers_hours` | Focus: choice "Flexible hours" (question offers) | - | en, am, om, ti, so, sid |
| `o_offers_remote` | Focus: choice "Work from home" (question offers) | - | en, am, om, ti, so, sid |
| `q_closes` | The question "When do applications close?" on its own (answer box focus, review page) | - | en, am, om, ti, so, sid |

---

## The scripts

Each box is the exact text of one clip. "1:" is spoken "one", "2:" "two", and so on (the Colab script does this for you).

### `langAsk`: Language page: the question, in English only

**English** → `public/audio/en/langAsk.mp3`

> Which language would you like to use? For English, say English, or press the English button.

### `langNone`: Language page: no language was heard (English only)

**English** → `public/audio/en/langNone.mp3`

> We did not hear a language. Please press a language button.

### `langAgain`: Language page: second try, said in English and then Amharic before an Amharic recogniser listens

**English** → `public/audio/en/langAgain.mp3`

> Please say the name of your language again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/langAgain.mp3`

> እባክዎ የቋንቋዎን ስም እንደገና ይናገሩ።

### `langSelf`: Language page: invitation in the language itself (played after langAsk)

**አማርኛ (checked by a native speaker)** → `public/audio/am/langSelf.mp3`

> ለአማርኛ «አማርኛ» ይበሉ፤ ወይም «አማርኛ» የሚለውን ቁልፍ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/langSelf.mp3`

> Afaan Oromoo filachuuf 'Afaan Oromoo' jedhi, ykn qabduu Afaan Oromoo tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/langSelf.mp3`

> ንትግርኛ «ትግርኛ» በሉ፣ ወይ «ትግርኛ» ዝብል መጠወቒ ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/langSelf.mp3`

> Af Soomaali: dheh Soomaali, ama riix badhanka Soomaali.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/langSelf.mp3`

> Sidaamu Afoo doorate, Sidaamu Afoo yi, woy Sidaamu Afoo yitanno ilkaawa xiiwi.

### `raAsk`: First question in the chosen language (asks if the page should be read aloud)

**English** → `public/audio/en/raAsk.mp3`

> Would you like this page to be read aloud to you? Please say Yes or No, or press a button. If you choose Yes, or press a Speak button later, your browser may send your voice to its provider to turn it into text. You can choose No and type instead.

**አማርኛ (checked by a native speaker)** → `public/audio/am/raAsk.mp3`

> ይህ ገጽ እንዲነበብልዎ ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ፤ ወይም አንድ ቁልፍ ይጫኑ። «አዎ» ከመረጡ ወይም በኋላ «ተናገር» ከተጫኑ አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው ሊልክ ይችላል። «አይ» መርጠው በምትኩ መጻፍ ይችላሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/raAsk.mp3`

> Fuulli kun sagaleedhaan akka siif dubbifamu barbaaddaa? Maaloo Eeyyee ykn Lakki jedhi, ykn qabduu tokko tuqi. Eeyyee yoo filatte, ykn booda qabduu Dubbadhu yoo tuqxe, barbaadduun kee sagalee kee gara barreeffamaatti jijjiiruuf dhiyeessaa isaatti erguu danda'a. Lakki filattee barreessuu dandeessa.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/raAsk.mp3`

> እዚ ገጽ ክንበበልኩም ትደልዩ ዶ? በጃኹም «እወ» ወይ «ኣይፋል» በሉ፣ ወይ ሓደ መጠወቒ ጠውቑ። «እወ» እንተ መሪጽኩም፣ ወይ ደሓር «ተዛረብ» እንተ ጠዊቕኩም፣ መርበብኩም ድምጽኹም ናብ ጽሑፍ ንምቕያር ናብ ኣቕራቢኡ ክሰዶ ይኽእል። «ኣይፋል» መሪጽኩም ክትጽሕፉ ትኽእሉ ኢኹም።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/raAsk.mp3`

> Ma rabtaa in boggan laguu akhriyo? Fadlan dheh Haa ama Maya, ama riix badhan. Haddii aad doorato Haa, ama aad hadhow riixdo badhanka Hadal, browserkaagu wuxuu codkaaga u diri karaa bixiyahiisa si uu qoraal ugu beddelo. Waxaad dooran kartaa Maya oo aad qori kartaa.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/raAsk.mp3`

> Kuni qoolu qaalinke nabbawamanno gede hasatto? Ikkitinni Ee woy Dee'ni yi, woy mitte ilkaawa xiiwi. Ee yitto ikkiro, woy gedensaanni Hasaawi xiiwitto ikkiro, barbaarsaasikki qaalekki borrote soorrate abbaasi aana soyannosi. Dee'ni yitte borreessa dandaatto.

### `raAgain`: Second ask, if no answer was heard

**English** → `public/audio/en/raAgain.mp3`

> We did not hear an answer, so we will take that as No. If you would like the page read aloud, please say Yes now, or press the Yes button.

**አማርኛ (checked by a native speaker)** → `public/audio/am/raAgain.mp3`

> መልስ አልሰማንም። እንደ «አይ» እንወስደዋለን። እንዲነበብልዎ ከፈለጉ አሁን «አዎ» ይበሉ ወይም «አዎ» የሚለውን ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/raAgain.mp3`

> Deebii hin dhageenye, kanaaf akka Lakkiitti fudhanna. Fuulli akka siif dubbifamu yoo barbaadde, amma Eeyyee jedhi, ykn qabduu Eeyyee tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/raAgain.mp3`

> መልሲ ኣይሰማዕናን፣ ስለዚ ከም «ኣይፋል» ንወስዶ። ገጹ ክንበበልኩም እንተ ደሊኹም፣ ሕጂ «እወ» በሉ፣ ወይ «እወ» ዝብል መጠወቒ ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/raAgain.mp3`

> Jawaab ma aanaan maqal, sidaa darteed waxaan u qaadanaynaa Maya. Haddii aad rabto in boggan laguu akhriyo, hadda dheh Haa, ama riix badhanka Haa.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/raAgain.mp3`

> Dawaro dimacciishshinoommo, kawule Dee'ni yinoonni gede adhineemmo. Qoolu nabbawamanno gede hasatto ikkiro, xa Ee yi, woy Ee ilkaawa xiiwi.

### `welcome`: Welcome page (after they said Yes to read aloud)

**English** → `public/audio/en/welcome.mp3`

> Welcome! A simpler way to register and find opportunities. Start. Start with voice. Read to me. On a keyboard: press Tab to go down, Shift and Tab to go up, Space or Enter to choose, and Escape to stop the voice. Say Start to begin.

**አማርኛ (checked by a native speaker)** → `public/audio/am/welcome.mp3`

> እንኳን ደህና መጡ! ለመመዝገብና ዕድሎችን ለማግኘት ቀለል ያለ መንገድ። ጀምር. በድምፅ ጀምር. አንብቡልኝ. በቁልፍ ሰሌዳ፦ ወደ ታች ለመሄድ Tab፣ ወደ ላይ ለመመለስ Shift እና Tab፣ ለመምረጥ Space ወይም Enter፣ ድምፁን ለማቆም Escape ይጫኑ። ለመጀመር «ጀምር» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/welcome.mp3`

> Baga nagaan dhuftan! Karaa salphaa itti galmooftanii carraa argattan. Jalqabi. Sagaleedhaan jalqabi. Naaf dubbisi. Kiiboordii irratti: gara gadiitti deemuuf Tab, gara oliitti deebi'uuf Shift fi Tab, filachuuf Space ykn Enter, sagalee dhaabuuf Escape tuqi. Jalqabuuf Jalqabi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/welcome.mp3`

> እንቋዕ ብደሓን መጻእኩም! ንምምዝጋብን ዕድላት ንምርካብን ቀሊል መንገዲ። ጀምር. ብድምጺ ጀምር. ኣንብቡለይ. ብኪቦርድ፦ ናብ ታሕቲ ንምኻድ Tab፣ ናብ ላዕሊ ንምምላስ Shift ምስ Tab፣ ንምምራጽ Space ወይ Enter፣ ድምጺ ንምቁራጽ Escape ጠውቑ። ንምጅማር «ጀምር» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/welcome.mp3`

> Soo dhawoow! Hab fudud oo aad isku diiwaangeliso oo aad fursado ku hesho. Bilow. Ku bilow cod. Ii akhri. Kiiboodhka: riix Tab si aad hoos ugu dhaqaaqdo, Shift iyo Tab si aad kor ugu dhaqaaqdo, Space ama Enter si aad u doorato, iyo Escape si aad u joojiso codka. Dheh Bilow si aad u bilowdo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/welcome.mp3`

> Dancha dayitine! Borreessamate nna loosu dandoowa afate shota doogo. Hanafi. Qaalinke hanafi. Ane nabbawi. Keyboorde aana: woroonni higate Tab, aliidi higate Shift nna Tab, doorate Space woy Enter, qaala uurrisate Escape xiiwi. Hanafate Hanafi yi.

### `prefs`: signup flow, question 1

**English** → `public/audio/en/prefs.mp3`

> How would you like to use this form? Optional. You can skip this. 1: Larger text. 2: Pictures next to choices. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (checked by a native speaker)** → `public/audio/am/prefs.mp3`

> ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ? አማራጭ ነው። መዝለል ይችላሉ። 1: ትልቅ ጽሑፍ. 2: ከምርጫዎች ጋር ሥዕሎች. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/prefs.mp3`

> Unka kana akkamitti fayyadamuu barbaadda? Dirqama miti. Irra darbuu dandeessa. 1: Barreeffama guddaa. 2: Filannoo cinaatti fakkii. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/prefs.mp3`

> ነዚ ቅጥዒ ብኸመይ ክትጥቀሙሉ ትደልዩ? ግዴታ ኣይኮነን። ክትሓልፍዎ ትኽእሉ ኢኹም። 1: ዓቢ ጽሑፍ. 2: ምስ ምርጫታት ስእልታት. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/prefs.mp3`

> Sidee baad u rabtaa inaad u isticmaasho foomkan? Ikhtiyaari. Waad ka boodi kartaa. 1: Qoraal ka weyn. 2: Sawirro ku xiga doorashooyinka. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/prefs.mp3`

> Konne foormu hiittoo horoonsi'rate hasatto? Dooro. Darba dandaatto. 1: Lowo borro. 2: Doorshu gaxa misilla. Doorshikki kiiro woy su'ma yi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.

### `fullName`: signup flow, question 2

**English** → `public/audio/en/fullName.mp3`

> What is your full name? The name you use every day is fine. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/fullName.mp3`

> ሙሉ ስምዎ ማነው? በየቀኑ የሚጠቀሙበት ስም በቂ ነው። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/fullName.mp3`

> Maqaan kee guutuun eenyu? Maqaan guyyaa guyyaan itti fayyadamtu gahaadha. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/fullName.mp3`

> ምሉእ ስምኩም መን እዩ? እቲ መዓልታዊ እትጥቀሙሉ ስም ይኣክል። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/fullName.mp3`

> Waa maxay magacaaga oo buuxa? Magaca aad maalin walba isticmaasho waa ku filan yahay. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/fullName.mp3`

> Wo'mu su'mikki ayeti? Barru barrunni horoonsi'ratto su'mu ikkanno. Xa dawarokki hasaawi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.

### `contact`: signup flow, question 3

**English** → `public/audio/en/contact.mp3`

> What phone number or email can we use? Only used to contact you about this programme. A phone number has 10 digits and starts with 0. You can say it or type it. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/contact.mp3`

> ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው? ስለዚህ ፕሮግራም ለማግኘት ብቻ ነው የሚያገለግለው። ስልክ ቁጥር በዜሮ የሚጀምር ባለ አሥር አሃዝ ነው። መናገር ወይም መጻፍ ይችላሉ። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/contact.mp3`

> Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya? Waa'ee sagantaa kanaa qofa si quunnamuuf. Lakkoofsi bilbilaa dijiitii 10 qaba, 0n jalqaba. Dubbachuu ykn barreessuu dandeessa. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/contact.mp3`

> ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል? ብዛዕባ እዚ መደብ ንምርካብኩም ጥራይ። ቁጽሪ ስልኪ 10 ኣሃዝ ኣለዎ፣ ብ0 ይጅምር። ክትዛረቡዎ ወይ ክትጽሕፉዎ ትኽእሉ ኢኹም። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/contact.mp3`

> Lambarkee taleefan ama iimayl ayaan isticmaali karnaa? Kaliya si laguula soo xiriiro barnaamijkan. Lambar taleefan wuxuu leeyahay 10 god, wuxuuna ku bilaabmaa 0. Waad dhihi kartaa ama qori kartaa. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/contact.mp3`

> Hiittoo silki kiiro woy imeelenni dandoonketa? Tenne pirogiraame daafira dandoonketa calla. Silki kiiro tonne kiiro afi'rinohanna zeerotenni hanafanno. Hasaawa woy borreessa dandaatto. Xa dawarokki hasaawi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.

### `idRoute`: signup flow, question 4

**English** → `public/audio/en/idRoute.mp3`

> How would you like to show who you are? 1: Kebele ID or passport. 2: Refugee or returnee ID. 3: Another document. 4: I don't have an ID. Refer me through a partner organisation. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/idRoute.mp3`

> ማንነትዎን እንዴት ማሳየት ይፈልጋሉ? 1: ቀበሌ መታወቂያ ወይም ፓስፖርት. 2: የስደተኛ ወይም ተመላሽ መታወቂያ. 3: ሌላ ሰነድ. 4: ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/idRoute.mp3`

> Eenyummaa kee akkamitti agarsiisuu barbaadda? 1: Waraqaa eenyummaa gandaa ykn paaspoortii. 2: Waraqaa eenyummaa baqataa ykn deebi'aa. 3: Sanada biraa. 4: Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/idRoute.mp3`

> መንነትኩም ብኸመይ ከተርእዩ ትደልዩ? 1: መንነት ቀበሌ ወይ ፓስፖርት. 2: መንነት ስደተኛ ወይ ተመላሲ. 3: ካልእ ሰነድ. 4: መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/idRoute.mp3`

> Sidee baad u rabtaa inaad muujiso cidda aad tahay? 1: Aqoonsiga kebele ama baasaboor. 2: Aqoonsiga qaxootiga ama soo-noqotaha. 3: Dukumenti kale. 4: Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/idRoute.mp3`

> Ati ayeti ikkitoota hiittoo leellisate hasatto? 1: Qebeele eeshsha woy paaspoorte. 2: Baqatu woy higgaanchu eeshsha. 3: Wole bortaje. 4: Eeshsha diafi'rino. Jaala dirijjiteenni hoolisi'e. Doorshikki kiiro woy su'ma yi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.

### `support`: signup flow, question 5

**English** → `public/audio/en/support.mp3`

> What support would help you? Choose any. You can skip this. No proof needed. Only the organisers see it, and only to prepare help for you. 1: I use a screen reader. 2: Large text. 3: I prefer to speak my answers. 4: Ethiopian Sign Language interpreter. 5: Simple words and pictures. 6: Please call me to help. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (checked by a native speaker)** → `public/audio/am/support.mp3`

> ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ። ይህን መዝለል ይችላሉ። ማስረጃ አያስፈልግም። አዘጋጆቹ ብቻ ያዩታል፤ ለእርስዎ እገዛ ለማዘጋጀት ብቻ። 1: ስክሪን ሪደር እጠቀማለሁ. 2: ትልቅ ጽሑፍ. 3: መልሶቼን በድምፅ መናገር እመርጣለሁ. 4: የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ. 5: ቀላል ቃላትና ሥዕሎች. 6: እባክዎ ደውለው ያግዙኝ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/support.mp3`

> Deeggarsa akkamii si gargaara? Kamiyyuu filadhu. Irra darbuu dandeessa. Ragaan hin barbaachisu. Qindeessitoota qofatu arga, deeggarsa siif qopheessuuf qofa. 1: Dubbisaa iskiriinii nan fayyadama. 2: Barreeffama guddaa. 3: Deebii koo dubbachuu nan filadha. 4: Hiikaa Afaan Mallattoo Itoophiyaa. 5: Jechoota salphaa fi fakkiiwwan. 6: Maaloo na gargaaruuf natti bilbilaa. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/support.mp3`

> እንታይ ደገፍ ይሕግዘኩም? ዝኾነ ምረጹ። ክትሓልፍዎ ትኽእሉ ኢኹም። መረጋገጺ ኣየድልን። ኣወሃሃድቲ ጥራይ እዮም ዝርእይዎ፣ ንዓኹም ደገፍ ንምድላው ጥራይ። 1: ስክሪን ሪደር እጥቀም. 2: ዓቢ ጽሑፍ. 3: መልስታተይ ብድምጺ ክዛረብ እመርጽ. 4: ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ. 5: ቀለልቲ ቃላትን ስእልታትን. 6: በጃኹም ደዊልኩም ሓግዙኒ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/support.mp3`

> Taageero noocee ah ayaa ku caawin lahayd? Dooro mid kasta. Waad ka boodi kartaa. Caddayn looma baahna. Kaliya qabanqaabiyayaashu ayaa arka, si ay kuugu diyaariyaan caawimaad. 1: Waxaan isticmaalaa akhriyaha shaashadda. 2: Qoraal weyn. 3: Waxaan doorbidaa inaan ku hadlo jawaabahayga. 4: Turjubaan Luqadda Calaamadaha Itoobiya. 5: Erayo fudud iyo sawirro. 6: Fadlan ii soo wac si aad ii caawiso. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/support.mp3`

> Hiittoo kaa'lo kaa'lannohe? Ayeeno doori. Tenne darba dandaatto. Ragi dihasiissanno. Qixxeessitooti calla la'anno, kaa'lo qixxeessate calla. 1: Leellisaancho nabbawaancho horoonsi'reemmo. 2: Lowo borro. 3: Dawaro qaalinke hasaawa doorreemmo. 4: Itiyoophiyu Malaatu Afoo turjimaancho. 5: Shota qaalla nna misilla. 6: Ikkitinni kaa'lo daafira silki xa'mi. Doorshikki kiiro woy su'ma yi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.

### `needs`: job flow, question 1

**English** → `public/audio/en/needs.mp3`

> What support do you need at work? Choose any. Private. This stays on your device and is only used to show suitable jobs. 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (checked by a native speaker)** → `public/audio/am/needs.mp3`

> በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ። ሚስጥራዊ ነው። በመሣሪያዎ ላይ ብቻ ይቆያል፤ ተስማሚ ሥራዎችን ለማሳየት ብቻ ነው። 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/needs.mp3`

> Hojii irratti deeggarsa akkamii si barbaachisa? Kamiyyuu filadhu. Dhuunfaa. Kun meeshaa kee irratti hafa, hojii si mijatu agarsiisuuf qofa itti fayyadamna. 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/needs.mp3`

> ኣብ ስራሕ እንታይ ደገፍ የድልየኩም? ዝኾነ ምረጹ። ብሕታዊ እዩ። ኣብ መሳርሒኹም ጥራይ ይጸንሕ፣ ተስማዕቲ ስራሓት ንምርኣይ ጥራይ ይጥቀመሉ። 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/needs.mp3`

> Taageero noocee ah ayaad ugu baahan tahay shaqada? Dooro mid kasta. Gaar ah. Wuxuu ku jiraa qalabkaaga oo kaliya waxaa loo isticmaalaa in lagu tuso shaqooyin ku habboon. 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/needs.mp3`

> Loosu aana hiittoo kaa'lo hasiissannohe? Ayeeno doori. Ma'nunni. Konne uduunnichokki aana keeshshanno, coyi'nanno loosuwa leellisate calla. 1: Gadu dinokki loosu bayicho. 2: Leellisaancho nabbawaanchora coyi'nanno uduunnicho. 3: Malaatu afoo turjimaancho. 4: Soorramanno loosu saate. 5: Mineenni loosa. Doorshikki kiiro woy su'ma yi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.

### `why`: job flow, question 3

**English** → `public/audio/en/why.mp3`

> Why do you want this job? A few words are enough. You can speak instead. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/why.mp3`

> ይህን ሥራ ለምን ይፈልጋሉ? ጥቂት ቃላት በቂ ናቸው። በድምፅ መናገርም ይችላሉ። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/why.mp3`

> Hojii kana maaliif barbaadda? Jechoota muraasni gahaadha. Dubbachuus dandeessa. Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/why.mp3`

> ነዚ ስራሕ ስለምንታይ ትደልይዎ? ውሑዳት ቃላት ይኣኽሉ። ብድምጺ እውን ክትዛረቡ ትኽእሉ ኢኹም። ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/why.mp3`

> Maxaad u rabtaa shaqadan? Erayo kooban ayaa ku filan. Waad ku hadli kartaa beddelkeeda. Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/why.mp3`

> Konne loosu mayira hasatto? Shiima qaalla ikkanno. Hasaawa dandaatto. Xa dawarokki hasaawi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.

### `job`: employer flow, question 1

**English** → `public/audio/en/job.mp3`

> What is the job title? Speak your answer now. Say Next to continue, or Read aloud to hear this again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/job.mp3`

> የሥራው መጠሪያ ምንድን ነው? መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/job.mp3`

> Maqaan hojii kanaa maali? Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/job.mp3`

> ሽም እቲ ስራሕ እንታይ እዩ? ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/job.mp3`

> Waa maxay magaca shaqada? Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/job.mp3`

> Loosu su'mi ayeti? Xa dawarokki hasaawi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi.

### `offers`: employer flow, question 2

**English** → `public/audio/en/offers.mp3`

> Which adjustments can this job offer? 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (checked by a native speaker)** → `public/audio/am/offers.mp3`

> ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል? 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/offers.mp3`

> Hojiin kun mijeessuu akkamii dhiyeessuu danda'a? 1: Bakka hojii gulantaa hin qabne. 2: Meeshaalee dubbisaa iskiriinii waliin hojjetan. 3: Hiikaa afaan mallattoo. 4: Sa'aatii hojii jijjiiramaa. 5: Mana irraa hojjechuu. Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi. Gaaffii kana irra darbuuf Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/offers.mp3`

> እዚ ስራሕ እንታይ ምትዕርራያት ከቕርብ ይኽእል? 1: ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ. 2: ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት. 3: ተርጓሚ ቋንቋ ምልክት. 4: ተዓጻጻፊ ሰዓታት ስራሕ. 5: ካብ ገዛ ምስራሕ. ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ። ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/offers.mp3`

> Waa maxay hagaajinta ay shaqadani bixin karto? 1: Goob shaqo oo aan jaranjaro lahayn. 2: Qalab ku habboon akhriyaha shaashadda. 3: Turjubaan luqadda calaamadaha. 4: Saacado dabacsan. 5: Ka shaqeyn guriga. Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho. Dheh Ka bood si aad su'aashan uga boodo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/offers.mp3`

> Kuni loosu hiittoo qixxeessuwa aamanno? 1: Gadu dinokki loosu bayicho. 2: Leellisaancho nabbawaanchora coyi'nanno uduunnicho. 3: Malaatu afoo turjimaancho. 4: Soorramanno loosu saate. 5: Mineenni loosa. Doorshikki kiiro woy su'ma yi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi. Tenne xa'mo darbate Darbi yi.

### `closes`: employer flow, question 3

**English** → `public/audio/en/closes.mp3`

> When do applications close? Optional. Ethiopian calendar. If you only know the month, choose Not sure for the day. Please type your answer in the box. Then press Enter, or press the Next button.

**አማርኛ (checked by a native speaker)** → `public/audio/am/closes.mp3`

> ማመልከቻ መቼ ይዘጋል? አማራጭ ነው። በኢትዮጵያ አቆጣጠር። ወሩን ብቻ ካወቁ ለቀኑ «እርግጠኛ አይደለሁም» ይምረጡ። እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/closes.mp3`

> Iyyannoon yoom cufama? Dirqama miti. Lakkoofsa Itoophiyaa. Ji'a qofa yoo beekte, guyyaaf 'Hin beeku' filadhu. Maaloo deebii kee saanduqa keessatti barreessi. Achiis Enter ykn qabduu Itti fufi tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/closes.mp3`

> ምዝገባ ማመልከቻ መዓስ ይዕጾ? ግዴታ ኣይኮነን። ብኣቆጻጽራ ኢትዮጵያ። ወርሒ ጥራይ እንተ ፈሊጥኩም፣ ንመዓልቲ «ርግጸኛ ኣይኮንኩን» ምረጹ። በጃኹም መልስኹም ኣብቲ ሳንዱቕ ጽሓፉ። ድሕሪኡ Enter ወይ «ቀጽል» ዝብል መጠወቒ ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/closes.mp3`

> Goormaa la xirayaa codsiyada? Ikhtiyaari. Kalandarka Itoobiya. Haddii aad bisha oo keliya taqaanno, maalinta u dooro 'Ma hubo'. Fadlan ku qor jawaabtaada sanduuqa. Kadib riix Enter, ama riix badhanka Xiga.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/closes.mp3`

> Xa'muwu ayi yanna gufamanno? Dooro. Itiyoophiyu barru qoodo. Agana calla huvatto ikkiro, barrara Dianfaa'moommo doori. Ikkitinni dawarokki saaxine giddo borreessi. Aanchite Enter, woy Albisi ilkaawa xiiwi.

### `errNeed`: Error: question not answered

**English** → `public/audio/en/errNeed.mp3`

> Please answer this question, or press Back.

**አማርኛ (checked by a native speaker)** → `public/audio/am/errNeed.mp3`

> እባክዎ ይህን ጥያቄ ይመልሱ ወይም ተመለስ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errNeed.mp3`

> Maaloo gaaffii kana deebisi, ykn Duubatti tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errNeed.mp3`

> በጃኹም ነዚ ሕቶ ምለሱ፣ ወይ «ተመለስ» ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errNeed.mp3`

> Fadlan ka jawaab su'aashan, ama riix Dib u noqo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/errNeed.mp3`

> Ikkitinni tenne xa'mo dawaari, woy Higi xiiwi.

### `errBad`: Error: phone number or email not valid

**English** → `public/audio/en/errBad.mp3`

> Please type a phone number with 10 digits, starting with zero, or an email address with an @ sign.

**አማርኛ (checked by a native speaker)** → `public/audio/am/errBad.mp3`

> እባክዎ በዜሮ የሚጀምር ባለ አሥር አሃዝ ስልክ ቁጥር ይጻፉ፤ ወይም «@» ምልክት ያለው ኢሜይል አድራሻ ይጻፉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errBad.mp3`

> Maaloo lakkoofsa bilbilaa dijiitii 10 qabu kan zeeroon jalqabu, ykn teessoo imeelii mallattoo @ qabu barreessi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errBad.mp3`

> በጃኹም ብዜሮ ዚጅምር 10 ኣሃዝ ዘለዎ ቁጽሪ ስልኪ፣ ወይ «@» ምልክት ዘለዎ ኢመይል ጽሓፉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errBad.mp3`

> Fadlan qor lambar taleefan oo 10 god ah oo ku bilaabmaya eber, ama cinwaan iimayl oo leh calaamadda @.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/errBad.mp3`

> Ikkitinni zeerotenni hanafanno, tonne kiiro afi'rino silki kiiro borreessi, woy @ malaatto afi'rino imeele borreessi.

### `errFail`: Error: could not send

**English** → `public/audio/en/errFail.mp3`

> We could not send your answers. Nothing is lost. Please try again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/errFail.mp3`

> መልሶችዎን መላክ አልቻልንም። ምንም አልጠፋም። እባክዎ እንደገና ይሞክሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errFail.mp3`

> Deebii kee erguu hin dandeenye. Homtuu hin badne. Maaloo irra deebi'ii yaali.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errFail.mp3`

> መልስታትኩም ክንሰድድ ኣይከኣልናን። ዋላ ሓንቲ ኣይጠፍአን። በጃኹም ደጊምኩም ፈትኑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errFail.mp3`

> Ma aanaan diri karin jawaabahaaga. Waxba ma lumin. Fadlan mar kale isku day.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/errFail.mp3`

> Dawaro keeshshi soya didandiinoommo. Mittunkuri dibaino. Ikkitinni wole paaxi.

### `unclear`: Voice answer not understood

**English** → `public/audio/en/unclear.mp3`

> Sorry, I did not understand. Please say the number of your choice.

**አማርኛ (checked by a native speaker)** → `public/audio/am/unclear.mp3`

> ይቅርታ፣ አልገባኝም። እባክዎ የምርጫዎን ቁጥር ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/unclear.mp3`

> Dhiifama, hin hubanne. Maaloo lakkoofsa filannoo keetii jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/unclear.mp3`

> ይቕሬታ፣ ኣይተረዳእኩን። በጃኹም ቁጽሪ ምርጫኹም በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/unclear.mp3`

> Waan ka xumahay, ma fahmin. Fadlan dheh lambarka doorashadaada.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/unclear.mp3`

> Hakkaya, dihuvattoommo. Ikkitinni doorshikki kiiro yi.

### `noneSel`: Nothing chosen yet

**English** → `public/audio/en/noneSel.mp3`

> Nothing is chosen. Say a number or a name, or say Skip.

**አማርኛ (checked by a native speaker)** → `public/audio/am/noneSel.mp3`

> ምንም አልተመረጠም። ቁጥር ወይም ስም ይናገሩ፤ ወይም «ዝለል» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/noneSel.mp3`

> Homtuu hin filatamne. Lakkoofsa ykn maqaa jedhi, ykn Irra darbi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/noneSel.mp3`

> ዋላ ሓደ ኣይተመርጸን። ቁጽሪ ወይ ስም በሉ፣ ወይ «ሕለፍ» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/noneSel.mp3`

> Waxba lama dooran. Dheh lambar ama magac, ama dheh Ka bood.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/noneSel.mp3`

> Mittunkuri dooraminokki. Kiiro woy su'ma yi, woy Darbi yi.

### `idle`: Nothing heard

**English** → `public/audio/en/idle.mp3`

> We did not hear you. Press the big Speak button, or press Stop reading to use the keyboard.

**አማርኛ (checked by a native speaker)** → `public/audio/am/idle.mp3`

> አልሰማንዎትም። ትልቁን «ተናገር» ቁልፍ ይጫኑ፤ ወይም ኪቦርድ ለመጠቀም «ማንበብ አቁም» ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/idle.mp3`

> Si hin dhageenye. Qabduu guddaa Dubbadhu tuqi, ykn kiiboordii fayyadamuuf Dubbisuu dhaabi tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/idle.mp3`

> ኣይሰማዕናኩምን። ነቲ ዓቢ «ተዛረብ» መጠወቒ ጠውቑ፣ ወይ ኪቦርድ ንምጥቃም «ምንባብ ኣቋርጽ» ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/idle.mp3`

> Ma aanaan ku maqal. Riix badhanka weyn ee Hadal, ama riix Jooji akhrinta si aad u isticmaasho kiiboodhka.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/idle.mp3`

> Dimacciishshinoommo. Lowo Hasaawi ilkaawa xiiwi, woy keyboorde horoonsi'rate Nabbawa uurrisi xiiwi.

### `sayWelcome`: Welcome page: say Start

**English** → `public/audio/en/sayWelcome.mp3`

> Say Start to begin.

**አማርኛ (checked by a native speaker)** → `public/audio/am/sayWelcome.mp3`

> ለመጀመር «ጀምር» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/sayWelcome.mp3`

> Jalqabuuf Jalqabi jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/sayWelcome.mp3`

> ንምጅማር «ጀምር» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/sayWelcome.mp3`

> Dheh Bilow si aad u bilowdo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/sayWelcome.mp3`

> Hanafate Hanafi yi.

### `reviewAsk`: Review page: do you want to submit?

**English** → `public/audio/en/reviewAsk.mp3`

> Do you want to submit your answers? Say Yes to submit, or No to change something.

**አማርኛ (checked by a native speaker)** → `public/audio/am/reviewAsk.mp3`

> መልሶችዎን ማስገባት ይፈልጋሉ? ለማስገባት «አዎ»፣ አንድ ነገር ለመቀየር «አይ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/reviewAsk.mp3`

> Deebii kee erguu barbaaddaa? Erguuf Eeyyee, waa jijjiiruuf Lakki jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/reviewAsk.mp3`

> መልስታትኩም ከተረክቡ ትደልዩ ዶ? ንምርካብ «እወ»፣ ገለ ነገር ንምቕያር «ኣይፋል» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/reviewAsk.mp3`

> Ma rabtaa inaad gudbiso jawaabahaaga? Dheh Haa si aad u gudbiso, ama Maya si aad wax u beddesho.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/reviewAsk.mp3`

> Dawaro keeshshi soyate hasatto? Soyate Ee, mittu coye soorrate Dee'ni yi.

### `heardGeneric`: Spoken answer received (used when the device has no voice)

**English** → `public/audio/en/heardGeneric.mp3`

> We heard your answer. It is shown on the screen. Say Next to continue, or say your answer again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/heardGeneric.mp3`

> መልስዎን ሰምተናል። በማያ ገጹ ላይ ይታያል። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/heardGeneric.mp3`

> Deebii kee dhageenyeerra. Iskiriinii irratti mul'ata. Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/heardGeneric.mp3`

> መልስኹም ሰሚዕና። ኣብ ስክሪን ይርአ ኣሎ። ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/heardGeneric.mp3`

> Waan maqalnay jawaabtaada. Waxay ka muuqataa shaashadda. Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/heardGeneric.mp3`

> Dawarokki macciishshinoonni. Leellisaanchu aana leellitanno. Albisate Albisi yi, woy dawarokki wole yi.

### `choseA`: Confirmation, first part ("You chose")

**English** → `public/audio/en/choseA.mp3`

> You chose

**አማርኛ (checked by a native speaker)** → `public/audio/am/choseA.mp3`

> የመረጡት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/choseA.mp3`

> Kan filatte

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/choseA.mp3`

> ዝመረጽኩምዎ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/choseA.mp3`

> Waxaad dooratay

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/choseA.mp3`

> Doorttohu

### `choseB`: Confirmation, last part

**English** → `public/audio/en/choseB.mp3`

> Say Next to continue, or choose again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/choseB.mp3`

> ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/choseB.mp3`

> Itti fufuuf Itti fufi jedhi, ykn ammas filadhu.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/choseB.mp3`

> ንምቕጻል «ቀጽል» በሉ፣ ወይ ደጊምኩም ምረጹ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/choseB.mp3`

> Dheh Xiga si aad u sii socoto, ama mar kale dooro.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/choseB.mp3`

> Albisate Albisi yi, woy wole doori.

### `errConsentNeed`: Error: consent box not ticked

**English** → `public/audio/en/errConsentNeed.mp3`

> Please tick the box to agree before sending, or press Back.

**አማርኛ (checked by a native speaker)** → `public/audio/am/errConsentNeed.mp3`

> ከመላክዎ በፊት ለመስማማት ሳጥኑን ምልክት ያድርጉ፤ ወይም ተመለስ ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errConsentNeed.mp3`

> Maaloo osoo hin ergin dura walii galuuf saanduqa mallattoo godhi, ykn Duubatti tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errConsentNeed.mp3`

> በጃኹም ቅድሚ ምልኣኽ ንምስምማዕ ነቲ ሳንዱቕ ምልክት ግበሩ፣ ወይ «ተመለስ» ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errConsentNeed.mp3`

> Fadlan calaamadee sanduuqa si aad u oggolaato ka hor intaadan dirin, ama riix Dib u noqo.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/errConsentNeed.mp3`

> Ikkitinni soyitto albaanni ammanaate saaxine malaatisi, woy Higi xiiwi.

### `errDateBad`: Error: date has no month

**English** → `public/audio/en/errDateBad.mp3`

> Please choose a month, or set day and year to Not sure to skip the date.

**አማርኛ (checked by a native speaker)** → `public/audio/am/errDateBad.mp3`

> እባክዎ ወር ይምረጡ፤ ወይም ቀኑን ለመዝለል ቀንና ዓመትን «እርግጠኛ አይደለሁም» ያድርጉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/errDateBad.mp3`

> Maaloo ji'a filadhu, ykn guyyaa fi bara 'Hin beeku' godhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/errDateBad.mp3`

> በጃኹም ወርሒ ምረጹ፣ ወይ መዓልትን ዓመትን «ርግጸኛ ኣይኮንኩን» ግበሩ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/errDateBad.mp3`

> Fadlan dooro bil, ama maalinta iyo sanadka ka dhig 'Ma hubo'.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/errDateBad.mp3`

> Ikkitinni agana doori, woy barranna diri Dianfaa'moommo assi.

### `draftH`: Welcome back (answers kept on this device)

**English** → `public/audio/en/draftH.mp3`

> Welcome back Your answers from last time are kept on this device. Continue where I stopped Start again

**አማርኛ (checked by a native speaker)** → `public/audio/am/draftH.mp3`

> እንኳን ደህና ተመለሱ ካለፈው ጊዜ መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል። ካቆምኩበት ቀጥል እንደገና ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/draftH.mp3`

> Baga nagaan deebitan Deebiin kee yeroo darbe meeshaa kana irratti kuufameera. Iddoon dhaabe irraa itti fufi Irra deebi'ii jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/draftH.mp3`

> እንቋዕ ብደሓን ተመለስኩም መልስታትኩም ካብ ዝሓለፈ ግዜ ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ። ካብ ዝኣቋረጽኩዎ ቀጽል ደጊምካ ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/draftH.mp3`

> Ku soo dhawoow mar kale Jawaabahaagii hore waxay ku kaydsan yihiin qalabkan. Ka sii wad halkii aan ku joogsaday Dib u bilow

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/draftH.mp3`

> Dancha higgite Darbinoha yannaha dawaro keeshshi konne uduunnicho aana agarantino. Uurrinoommohunni albisi Wole hanafi

### `queued`: Offline: answers saved on the device, sent later

**English** → `public/audio/en/queued.mp3`

> You are offline. Your answers are saved on this device and will be sent when you are back online.

**አማርኛ (checked by a native speaker)** → `public/audio/am/queued.mp3`

> ከመስመር ውጭ ነዎት። መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል፤ መስመር ላይ ሲመለሱ ይላካሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/queued.mp3`

> Ati toora ala jirta. Deebiin kee meeshaa kana irratti kuufameera, yeroo toora irratti deebitu ni ergama.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/queued.mp3`

> ካብ መስመር ወጻኢ ኢኹም። መልስታትኩም ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ፣ ናብ መስመር ምስ ተመለስኩም ክለኣኹ እዮም።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/queued.mp3`

> Khadka kama jirtid. Jawaabahaaga waxay ku kaydsan yihiin qalabkan, waxaana la diri doonaa markaad khadka ku soo noqoto.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/queued.mp3`

> Interneete aana dikiitto. Dawaro keeshshi konne uduunnicho aana agarantino, interneete aana higgitto wote soyamanno.

### `sentLater`: Saved answers were sent

**English** → `public/audio/en/sentLater.mp3`

> Your saved answers have now been sent.

**አማርኛ (checked by a native speaker)** → `public/audio/am/sentLater.mp3`

> የተቀመጡት መልሶችዎ አሁን ተልከዋል።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/sentLater.mp3`

> Deebiin kee kuufame amma ergameera.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/sentLater.mp3`

> እቶም ዝተዓቀቡ መልስታትኩም ሕጂ ተላኢኾም።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/sentLater.mp3`

> Jawaabahaagii kaydsanaa hadda waa la diray.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/sentLater.mp3`

> Agarantino dawaro keeshshi xa soyamino.

### `tapToHear`: Press a key or tap to hear the questions

**English** → `public/audio/en/tapToHear.mp3`

> Press any key or tap the screen to hear the questions.

**አማርኛ (checked by a native speaker)** → `public/audio/am/tapToHear.mp3`

> ጥያቄዎቹን ለመስማት ማንኛውንም ቁልፍ ይጫኑ ወይም ማያውን ይንኩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/tapToHear.mp3`

> Gaaffilee dhaga'uuf qabduu kamiyyuu tuqi ykn iskiriinii tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/tapToHear.mp3`

> ሕቶታት ንምስማዕ ዝኾነ መጠወቒ ጠውቑ ወይ ስክሪን ተንክፉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/tapToHear.mp3`

> Riix fure kasta ama taabo shaashadda si aad u maqasho su'aalaha.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/tapToHear.mp3`

> Xa'muwa macciishshate ayee ilkaawa xiiwi woy leellisaancho kaali.

### `n0`: Number 0 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n0.mp3`

> Zero

**አማርኛ (checked by a native speaker)** → `public/audio/am/n0.mp3`

> ዜሮ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n0.mp3`

> Zeeroo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n0.mp3`

> ዜሮ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n0.mp3`

> Eber

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n0.mp3`

> Zeero

### `n1`: Number 1 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n1.mp3`

> One

**አማርኛ (checked by a native speaker)** → `public/audio/am/n1.mp3`

> አንድ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n1.mp3`

> Tokko

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n1.mp3`

> ሓደ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n1.mp3`

> Kow

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n1.mp3`

> Mitto

### `n2`: Number 2 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n2.mp3`

> Two

**አማርኛ (checked by a native speaker)** → `public/audio/am/n2.mp3`

> ሁለት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n2.mp3`

> Lama

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n2.mp3`

> ክልተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n2.mp3`

> Laba

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n2.mp3`

> Lame

### `n3`: Number 3 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n3.mp3`

> Three

**አማርኛ (checked by a native speaker)** → `public/audio/am/n3.mp3`

> ሦስት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n3.mp3`

> Sadii

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n3.mp3`

> ሰለስተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n3.mp3`

> Saddex

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n3.mp3`

> Sase

### `n4`: Number 4 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n4.mp3`

> Four

**አማርኛ (checked by a native speaker)** → `public/audio/am/n4.mp3`

> አራት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n4.mp3`

> Afur

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n4.mp3`

> ኣርባዕተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n4.mp3`

> Afar

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n4.mp3`

> Shoole

### `n5`: Number 5 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n5.mp3`

> Five

**አማርኛ (checked by a native speaker)** → `public/audio/am/n5.mp3`

> አምስት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n5.mp3`

> Shan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n5.mp3`

> ሓሙሽተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n5.mp3`

> Shan

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n5.mp3`

> Onte

### `n6`: Number 6 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n6.mp3`

> Six

**አማርኛ (checked by a native speaker)** → `public/audio/am/n6.mp3`

> ስድስት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n6.mp3`

> Jaha

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n6.mp3`

> ሽዱሽተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n6.mp3`

> Lix

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n6.mp3`

> Lee

### `n7`: Number 7 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n7.mp3`

> Seven

**አማርኛ (checked by a native speaker)** → `public/audio/am/n7.mp3`

> ሰባት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n7.mp3`

> Torba

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n7.mp3`

> ሸውዓተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n7.mp3`

> Toddoba

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n7.mp3`

> Lamala

### `n8`: Number 8 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n8.mp3`

> Eight

**አማርኛ (checked by a native speaker)** → `public/audio/am/n8.mp3`

> ስምንት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n8.mp3`

> Saddeet

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n8.mp3`

> ሸሞንተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n8.mp3`

> Siddeed

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n8.mp3`

> Sette

### `n9`: Number 9 (confirmation, review numbers, phone digits)

**English** → `public/audio/en/n9.mp3`

> Nine

**አማርኛ (checked by a native speaker)** → `public/audio/am/n9.mp3`

> ዘጠኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/n9.mp3`

> Sagal

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/n9.mp3`

> ትሽዓተ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/n9.mp3`

> Sagaal

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/n9.mp3`

> Honse

### `reviewH`: Review page: heading "Check your answers"

**English** → `public/audio/en/reviewH.mp3`

> Check your answers

**አማርኛ (checked by a native speaker)** → `public/audio/am/reviewH.mp3`

> መልሶችዎን ያረጋግጡ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/reviewH.mp3`

> Deebii kee mirkaneessi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/reviewH.mp3`

> መልስታትኩም ኣረጋግጹ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/reviewH.mp3`

> Hubi jawaabahaaga

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/reviewH.mp3`

> Dawaro keeshshi buuxi

### `skipped`: Review page: a question that was skipped

**English** → `public/audio/en/skipped.mp3`

> (skipped)

**አማርኛ (checked by a native speaker)** → `public/audio/am/skipped.mp3`

> (ተዘሏል)

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/skipped.mp3`

> (darbameera)

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/skipped.mp3`

> (ተሓሊፉ)

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/skipped.mp3`

> (waa laga booday)

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/skipped.mp3`

> (darbamino)

### `reviewKeys`: Review page: how to change an answer with the keyboard

**English** → `public/audio/en/reviewKeys.mp3`

> To change an answer with the keyboard, press Tab until you reach its Change button, then press Enter.

**አማርኛ (checked by a native speaker)** → `public/audio/am/reviewKeys.mp3`

> መልስ በቁልፍ ሰሌዳ ለመቀየር፣ የመልሱ «ቀይር» ቁልፍ ላይ እስኪደርሱ Tab ይጫኑ፤ ከዚያ Enter ይጫኑ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/reviewKeys.mp3`

> Deebii kiiboordiin jijjiiruuf, hanga qabduu Jijjiiri isaa geessutti Tab tuqi, achiis Enter tuqi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/reviewKeys.mp3`

> መልሲ ብኪቦርድ ንምቕያር፣ ክሳብ «ቀይር» ዝብል መጠወቒኡ ትበጽሑ Tab ጠውቑ፣ ድሕሪኡ Enter ጠውቑ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/reviewKeys.mp3`

> Si aad jawaab ugu beddesho kiiboodhka, riix Tab ilaa aad gaarto badhankeeda Beddel, kadibna riix Enter.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/reviewKeys.mp3`

> Dawaro keyboordetenni soorrate, Soorri ilkaawa iillitto geeshsha Tab xiiwi, aanchite Enter xiiwi.

### `consentOrg`: Consent sentence when the site gives no partner name

**English** → `public/audio/en/consentOrg.mp3`

> I agree to send these answers to the organisers of this website.

**አማርኛ (checked by a native speaker)** → `public/audio/am/consentOrg.mp3`

> እነዚህን መልሶች ለየዚህ ድረ-ገጽ አዘጋጆች ለመላክ እስማማለሁ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/consentOrg.mp3`

> Deebii kana gara qindeessitoota marsariitii kanaa erguuf nan walii gala.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/consentOrg.mp3`

> ነዚ መልስታት ናብ ኣወሃሃድቲ እዚ መርበብ ክለኣኽ እሰማማዕ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/consentOrg.mp3`

> Waan ku raacsanahay in jawaabahan loo diro qabanqaabiyayaasha boggan.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/consentOrg.mp3`

> Kuri dawaro konne weebsaytete qixxeessitootara soyamanno gede ammanaammo.

### `consentSendA`: Consent sentence, part before the partner name (the name is read by a voice)

**English** → `public/audio/en/consentSendA.mp3`

> I agree to send these answers to 

**አማርኛ (checked by a native speaker)** → `public/audio/am/consentSendA.mp3`

> እነዚህን መልሶች ለ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/consentSendA.mp3`

> Deebii kana gara 

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/consentSendA.mp3`

> ነዚ መልስታት ናብ 

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/consentSendA.mp3`

> Waan ku raacsanahay in jawaabahan loo diro 

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/consentSendA.mp3`

> Kuri dawaro 

### `consentSendB`: Consent sentence, part after the partner name (only where words follow the name)

**አማርኛ (checked by a native speaker)** → `public/audio/am/consentSendB.mp3`

>  ለመላክ እስማማለሁ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/consentSendB.mp3`

>  erguuf nan walii gala.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/consentSendB.mp3`

>  ክለኣኽ እሰማማዕ።

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/consentSendB.mp3`

> ra soyamanno gede ammanaammo.

### `consentSupport`: Second consent box: share support choices

**English** → `public/audio/en/consentSupport.mp3`

> Also share my support choices with the organisers, so they can prepare help. If you leave this empty, your support choices are not sent.

**አማርኛ (checked by a native speaker)** → `public/audio/am/consentSupport.mp3`

> የእገዛ ምርጫዎቼንም እገዛ እንዲያዘጋጁ ለአዘጋጆቹ አጋራ። ይህን ባዶ ከተዉት የእገዛ ምርጫዎችዎ አይላኩም።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/consentSupport.mp3`

> Filannoo deeggarsa koos qindeessitootaaf qoodi, akka gargaarsa qopheessaniif. Kana duwwaa yoo dhiifte, filannoon deeggarsa kee hin ergamu.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/consentSupport.mp3`

> ምርጫታት ደገፈይ እውን ንኣወሃሃድቲ ኣካፍል፣ ሓገዝ ምእንቲ ከዳልዉ። እዚ ባዶ እንተ ገዲፍኩምዎ ምርጫታት ደገፍኩም ኣይለኣኽን።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/consentSupport.mp3`

> Sidoo kale la wadaag doorashooyinka taageerada qabanqaabiyayaasha, si ay caawimaad u diyaariyaan. Haddii aad tan banaan ka tagto, doorashooyinkaaga taageerada lama diro.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/consentSupport.mp3`

> Kaa'lo doorshoyya qixxeessitootira qoodi, kaa'lo qixxeessanno gede. Tenne mullicho agurtto ikkiro, kaa'lo doorshoyyikki disoyamanno.

### `askSupport`: Review by voice: also share support choices? (asked after Yes)

**English** → `public/audio/en/askSupport.mp3`

> You chose some support. Do you also want to share your support choices with the organisers, so they can prepare help? Say Yes or No.

**አማርኛ (checked by a native speaker)** → `public/audio/am/askSupport.mp3`

> የእገዛ ምርጫ መርጠዋል። እገዛ እንዲያዘጋጁ የእገዛ ምርጫዎችዎን ለአዘጋጆቹም ማጋራት ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/askSupport.mp3`

> Deeggarsa filatteetta. Akka gargaarsa qopheessaniif filannoo deeggarsa kee qindeessitootaaf qooduu barbaaddaa? Eeyyee ykn Lakki jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/askSupport.mp3`

> ደገፍ መሪጽኩም ኣለኹም። ሓገዝ ምእንቲ ከዳልዉ ምርጫታት ደገፍኩም ንኣወሃሃድቲ ከተካፍሉ ትደልዩ ዶ? «እወ» ወይ «ኣይፋል» በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/askSupport.mp3`

> Waxaad dooratay taageero. Ma rabtaa inaad sidoo kale la wadaagto doorashooyinkaaga taageerada qabanqaabiyayaasha, si ay caawimaad u diyaariyaan? Dheh Haa ama Maya.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/askSupport.mp3`

> Kaa'lo doorte. Kaa'lo qixxeessanno gede kaa'lo doorshoyyikki qixxeessitootira qoolate hasatto? Ee woy Dee'ni yi.

### `heardA`: Read-back of a spoken answer, first part ("We heard")

**English** → `public/audio/en/heardA.mp3`

> We heard

**አማርኛ (checked by a native speaker)** → `public/audio/am/heardA.mp3`

> የሰማነው

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/heardA.mp3`

> Kan dhageenye

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/heardA.mp3`

> ዝሰማዕናዮ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/heardA.mp3`

> Waxaan maqalnay

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/heardA.mp3`

> Macciishshoonnihu

### `heardB`: Read-back of a spoken answer, last part

**English** → `public/audio/en/heardB.mp3`

> Say Next to continue, or say your answer again.

**አማርኛ (checked by a native speaker)** → `public/audio/am/heardB.mp3`

> ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/heardB.mp3`

> Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/heardB.mp3`

> ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/heardB.mp3`

> Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/heardB.mp3`

> Albisate Albisi yi, woy dawarokki wole yi.

### `display`: Focus: the "Colours and text size" menu

**English** → `public/audio/en/display.mp3`

> Colours and text size

**አማርኛ (checked by a native speaker)** → `public/audio/am/display.mp3`

> ቀለምና የጽሑፍ መጠን

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/display.mp3`

> Halluu fi guddina barreeffamaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/display.mp3`

> ሕብርን ዓቐን ጽሑፍን

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/display.mp3`

> Midabka iyo cabbirka qoraalka

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/display.mp3`

> Kuulla nna borrote lowina

### `th_auto`: Focus: colour theme "Same as my device"

**English** → `public/audio/en/th_auto.mp3`

> Same as my device

**አማርኛ (checked by a native speaker)** → `public/audio/am/th_auto.mp3`

> እንደ መሣሪያዬ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/th_auto.mp3`

> Akkuma meeshaa koo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/th_auto.mp3`

> ከም መሳርሒየ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/th_auto.mp3`

> Sida qalabkayga

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/th_auto.mp3`

> Uduunnichoyi'ya gede

### `th_standard`: Focus: colour theme "Standard"

**English** → `public/audio/en/th_standard.mp3`

> Standard

**አማርኛ (checked by a native speaker)** → `public/audio/am/th_standard.mp3`

> መደበኛ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/th_standard.mp3`

> Idilee

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/th_standard.mp3`

> ልሙድ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/th_standard.mp3`

> Caadi

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/th_standard.mp3`

> Rosu

### `th_dark`: Focus: colour theme "Dark"

**English** → `public/audio/en/th_dark.mp3`

> Dark

**አማርኛ (checked by a native speaker)** → `public/audio/am/th_dark.mp3`

> ጨለማ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/th_dark.mp3`

> Dukkana

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/th_dark.mp3`

> ጸሊም

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/th_dark.mp3`

> Mugdi

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/th_dark.mp3`

> Tuqa

### `th_contrast`: Focus: colour theme "High contrast (black and white)"

**English** → `public/audio/en/th_contrast.mp3`

> High contrast (black and white)

**አማርኛ (checked by a native speaker)** → `public/audio/am/th_contrast.mp3`

> ከፍተኛ ንፅፅር (ጥቁርና ነጭ)

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/th_contrast.mp3`

> Garaagarummaa olaanaa (gurraacha fi adii)

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/th_contrast.mp3`

> ልዑል ፍልልይ (ጸሊምን ጻዕዳን)

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/th_contrast.mp3`

> Kala-duwanaan sare (madow iyo cad)

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/th_contrast.mp3`

> Lowo babbaxxe (kolishsho nna waajjo)

### `th_rg`: Focus: colour theme "Blue and orange (for red-green colour blindness)"

**English** → `public/audio/en/th_rg.mp3`

> Blue and orange (for red-green colour blindness)

**አማርኛ (checked by a native speaker)** → `public/audio/am/th_rg.mp3`

> ሰማያዊና ብርቱካናማ (ቀይና አረንጓዴን ለማይለዩ)

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/th_rg.mp3`

> Cuquliisaa fi burtukaanii (warra diimaa fi magariisa adda hin baafneef)

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/th_rg.mp3`

> ሰማያዊን ብርቱኳናውን (ቀይሕን ቀጠልያን ንዘይፈልዩ)

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/th_rg.mp3`

> Buluug iyo oranji (kuwa aan kala garan casaanka iyo cagaarka)

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/th_rg.mp3`

> Hoogora nna burtukaane (duumo nna haqqaa kuulla babbaxxe dandiitinokketa)

### `th_by`: Focus: colour theme "Teal and red (for blue-yellow colour blindness)"

**English** → `public/audio/en/th_by.mp3`

> Teal and red (for blue-yellow colour blindness)

**አማርኛ (checked by a native speaker)** → `public/audio/am/th_by.mp3`

> ደማቅ አረንጓዴና ቀይ (ሰማያዊና ቢጫን ለማይለዩ)

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/th_by.mp3`

> Magariisa cuquliisaa fi diimaa (warra cuquliisaa fi keelloo adda hin baafneef)

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/th_by.mp3`

> ሰማያዊ-ቀጠልያን ቀይሕን (ሰማያዊን ብጫን ንዘይፈልዩ)

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/th_by.mp3`

> Cagaar-buluug iyo casaan (kuwa aan kala garan buluugga iyo jaallaha)

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/th_by.mp3`

> Haqqaa-hoogora nna duumo (hoogora nna dalla kuulla babbaxxe dandiitinokketa)

### `reviewFix`: Review page, second part (after the person says No to submitting)

**English** → `public/audio/en/reviewFix.mp3`

> Say Start again to go back to the first question, or say the number of the question you want to change.

**አማርኛ (checked by a native speaker)** → `public/audio/am/reviewFix.mp3`

> ወደ መጀመሪያው ጥያቄ ለመመለስ «እንደገና ጀምር» ይበሉ፤ ወይም መቀየር የሚፈልጉትን ጥያቄ ቁጥር ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/reviewFix.mp3`

> Gara gaaffii jalqabaatti deebi'uuf Irra deebi'ii jalqabi jedhi, ykn lakkoofsa gaaffii jijjiiruu barbaaddu jedhi.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/reviewFix.mp3`

> ናብ ቀዳማይ ሕቶ ንምምላስ «ደጊምካ ጀምር» በሉ፣ ወይ ቁጽሪ ክትቕይርዎ እትደልዩ ሕቶ በሉ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/reviewFix.mp3`

> Dheh Dib u bilow si aad ugu noqoto su'aasha koowaad, ama dheh lambarka su'aasha aad rabto inaad beddesho.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/reviewFix.mp3`

> Umi xa'mora higate Wole hanafi yi, woy soorrate hasatto xa'mo kiiro yi.

### `done`: Thank-you page

**English** → `public/audio/en/done.mp3`

> Thank you. We received your answers.

**አማርኛ (checked by a native speaker)** → `public/audio/am/done.mp3`

> እናመሰግናለን። መልሶችዎን ተቀብለናል።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/done.mp3`

> Galatoomi. Deebii kee argannee jirra.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/done.mp3`

> የቐንየልና። መልስታትኩም ተቐቢልናዮ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/done.mp3`

> Mahadsanid. Waan helnay jawaabahaaga.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/done.mp3`

> Galateemmo. Dawaro keeshshi adhinoonni.

### `speakNow`: Said just before the microphone opens (then a beep)

**English** → `public/audio/en/speakNow.mp3`

> Speak now.

**አማርኛ (checked by a native speaker)** → `public/audio/am/speakNow.mp3`

> አሁን ይናገሩ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/speakNow.mp3`

> Amma dubbadhu.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/speakNow.mp3`

> ሕጂ ተዛረቡ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/speakNow.mp3`

> Hadda hadal.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/speakNow.mp3`

> Xa hasaawi.

### `sel`: Focus: a choice that is ticked

**English** → `public/audio/en/sel.mp3`

> selected

**አማርኛ (checked by a native speaker)** → `public/audio/am/sel.mp3`

> ተመርጧል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/sel.mp3`

> filatameera

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/sel.mp3`

> ተመሪጹ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/sel.mp3`

> waa la doortay

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/sel.mp3`

> doodamino

### `unsel`: Focus: a choice that is not ticked

**English** → `public/audio/en/unsel.mp3`

> not selected

**አማርኛ (checked by a native speaker)** → `public/audio/am/unsel.mp3`

> አልተመረጠም

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/unsel.mp3`

> hin filatamne

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/unsel.mp3`

> ኣይተመርጸን

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/unsel.mp3`

> lama dooran

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/unsel.mp3`

> doodaminokki

### `langName`: Focus: a language button, in that language

**English** → `public/audio/en/langName.mp3`

> English

**አማርኛ (checked by a native speaker)** → `public/audio/am/langName.mp3`

> አማርኛ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/langName.mp3`

> Afaan Oromoo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/langName.mp3`

> ትግርኛ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/langName.mp3`

> Soomaali

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/langName.mp3`

> Sidaamu Afoo

### `b_next`: Focus: the "Next" button

**English** → `public/audio/en/b_next.mp3`

> Next

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_next.mp3`

> ቀጥል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_next.mp3`

> Itti fufi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_next.mp3`

> ቀጽል

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_next.mp3`

> Xiga

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_next.mp3`

> Albisi

### `b_back`: Focus: the "Back" button

**English** → `public/audio/en/b_back.mp3`

> Back

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_back.mp3`

> ተመለስ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_back.mp3`

> Duubatti

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_back.mp3`

> ተመለስ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_back.mp3`

> Dib u noqo

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_back.mp3`

> Higi

### `b_skip`: Focus: the "Skip" button

**English** → `public/audio/en/b_skip.mp3`

> Skip

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_skip.mp3`

> ዝለል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_skip.mp3`

> Irra darbi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_skip.mp3`

> ሕለፍ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_skip.mp3`

> Ka bood

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_skip.mp3`

> Darbi

### `b_read`: Focus: the "Read aloud" button

**English** → `public/audio/en/b_read.mp3`

> Read aloud

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_read.mp3`

> አንብብልኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_read.mp3`

> Sagaleedhaan dubbisi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_read.mp3`

> ኣንብበለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_read.mp3`

> Akhri

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_read.mp3`

> Qaalinke nabbawi

### `b_speak`: Focus: the "Speak" button

**English** → `public/audio/en/b_speak.mp3`

> Speak

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_speak.mp3`

> ተናገር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_speak.mp3`

> Dubbadhu

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_speak.mp3`

> ተዛረብ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_speak.mp3`

> Hadal

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_speak.mp3`

> Hasaawi

### `b_readToMe`: Focus: the "Read to me" button

**English** → `public/audio/en/b_readToMe.mp3`

> Read to me

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_readToMe.mp3`

> አንብቡልኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_readToMe.mp3`

> Naaf dubbisi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_readToMe.mp3`

> ኣንብቡለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_readToMe.mp3`

> Ii akhri

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_readToMe.mp3`

> Ane nabbawi

### `b_stopRead`: Focus: the "Stop reading" button

**English** → `public/audio/en/b_stopRead.mp3`

> Stop reading

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_stopRead.mp3`

> ማንበብ አቁም

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_stopRead.mp3`

> Dubbisuu dhaabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_stopRead.mp3`

> ምንባብ ኣቋርጽ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_stopRead.mp3`

> Jooji akhrinta

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_stopRead.mp3`

> Nabbawa uurrisi

### `b_send`: Focus: the "Yes, submit" button

**English** → `public/audio/en/b_send.mp3`

> Yes, submit

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_send.mp3`

> አዎ፣ አስገባ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_send.mp3`

> Eeyyee, ergi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_send.mp3`

> እወ፣ ኣረክብ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_send.mp3`

> Haa, gudbi

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_send.mp3`

> Ee, soy

### `b_noChange`: Focus: the "No, change something" button

**English** → `public/audio/en/b_noChange.mp3`

> No, change something

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_noChange.mp3`

> አይ፣ አንድ ነገር ልቀይር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_noChange.mp3`

> Lakki, waan tokko jijjiira

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_noChange.mp3`

> ኣይፋል፣ ገለ ክቕይር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_noChange.mp3`

> Maya, wax baan beddelayaa

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_noChange.mp3`

> Dee'ni, mittu coye soorrara

### `b_restart`: Focus: the "Start again" button

**English** → `public/audio/en/b_restart.mp3`

> Start again

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_restart.mp3`

> እንደገና ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_restart.mp3`

> Irra deebi'ii jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_restart.mp3`

> ደጊምካ ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_restart.mp3`

> Dib u bilow

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_restart.mp3`

> Wole hanafi

### `b_change`: Focus: the "Change" button

**English** → `public/audio/en/b_change.mp3`

> Change

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_change.mp3`

> ቀይር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_change.mp3`

> Jijjiiri

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_change.mp3`

> ቀይር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_change.mp3`

> Beddel

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_change.mp3`

> Soorri

### `b_start`: Focus: the "Start" button

**English** → `public/audio/en/b_start.mp3`

> Start

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_start.mp3`

> ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_start.mp3`

> Jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_start.mp3`

> ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_start.mp3`

> Bilow

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_start.mp3`

> Hanafi

### `b_startVoice`: Focus: the "Start with voice" button

**English** → `public/audio/en/b_startVoice.mp3`

> Start with voice

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_startVoice.mp3`

> በድምፅ ጀምር

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_startVoice.mp3`

> Sagaleedhaan jalqabi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_startVoice.mp3`

> ብድምጺ ጀምር

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_startVoice.mp3`

> Ku bilow cod

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_startVoice.mp3`

> Qaalinke hanafi

### `b_raYes`: Focus: the "Yes, read aloud" button

**English** → `public/audio/en/b_raYes.mp3`

> Yes, read aloud

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_raYes.mp3`

> አዎ፣ ይነበብልኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_raYes.mp3`

> Eeyyee, naaf dubbisi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_raYes.mp3`

> እወ፣ ኣንብቡለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_raYes.mp3`

> Haa, ii akhri

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_raYes.mp3`

> Ee, nabbawi

### `b_raNo`: Focus: the "No, thank you" button

**English** → `public/audio/en/b_raNo.mp3`

> No, thank you

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_raNo.mp3`

> አይ፣ አያስፈልግም

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_raNo.mp3`

> Lakki, galatoomi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_raNo.mp3`

> ኣይፋል፣ የቐንየለይ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_raNo.mp3`

> Maya, mahadsanid

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_raNo.mp3`

> Dee'ni, galateemmo

### `b_draftGo`: Focus: the "Continue where I stopped" button

**English** → `public/audio/en/b_draftGo.mp3`

> Continue where I stopped

**አማርኛ (checked by a native speaker)** → `public/audio/am/b_draftGo.mp3`

> ካቆምኩበት ቀጥል

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/b_draftGo.mp3`

> Iddoon dhaabe irraa itti fufi

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/b_draftGo.mp3`

> ካብ ዝኣቋረጽኩዎ ቀጽል

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/b_draftGo.mp3`

> Ka sii wad halkii aan ku joogsaday

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/b_draftGo.mp3`

> Uurrinoommohunni albisi

### `q_prefs`: The question "How would you like to use this form?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_prefs.mp3`

> How would you like to use this form?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_prefs.mp3`

> ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_prefs.mp3`

> Unka kana akkamitti fayyadamuu barbaadda?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_prefs.mp3`

> ነዚ ቅጥዒ ብኸመይ ክትጥቀሙሉ ትደልዩ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_prefs.mp3`

> Sidee baad u rabtaa inaad u isticmaasho foomkan?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_prefs.mp3`

> Konne foormu hiittoo horoonsi'rate hasatto?

### `o_prefs_large`: Focus: choice "Larger text" (question prefs)

**English** → `public/audio/en/o_prefs_large.mp3`

> Larger text

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_prefs_large.mp3`

> ትልቅ ጽሑፍ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_prefs_large.mp3`

> Barreeffama guddaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_prefs_large.mp3`

> ዓቢ ጽሑፍ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_prefs_large.mp3`

> Qoraal ka weyn

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_prefs_large.mp3`

> Lowo borro

### `o_prefs_simple`: Focus: choice "Pictures next to choices" (question prefs)

**English** → `public/audio/en/o_prefs_simple.mp3`

> Pictures next to choices

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_prefs_simple.mp3`

> ከምርጫዎች ጋር ሥዕሎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_prefs_simple.mp3`

> Filannoo cinaatti fakkii

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_prefs_simple.mp3`

> ምስ ምርጫታት ስእልታት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_prefs_simple.mp3`

> Sawirro ku xiga doorashooyinka

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_prefs_simple.mp3`

> Doorshu gaxa misilla

### `q_fullName`: The question "What is your full name?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_fullName.mp3`

> What is your full name?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_fullName.mp3`

> ሙሉ ስምዎ ማነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_fullName.mp3`

> Maqaan kee guutuun eenyu?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_fullName.mp3`

> ምሉእ ስምኩም መን እዩ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_fullName.mp3`

> Waa maxay magacaaga oo buuxa?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_fullName.mp3`

> Wo'mu su'mikki ayeti?

### `q_contact`: The question "What phone number or email can we use?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_contact.mp3`

> What phone number or email can we use?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_contact.mp3`

> ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_contact.mp3`

> Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_contact.mp3`

> ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_contact.mp3`

> Lambarkee taleefan ama iimayl ayaan isticmaali karnaa?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_contact.mp3`

> Hiittoo silki kiiro woy imeelenni dandoonketa?

### `q_idRoute`: The question "How would you like to show who you are?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_idRoute.mp3`

> How would you like to show who you are?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_idRoute.mp3`

> ማንነትዎን እንዴት ማሳየት ይፈልጋሉ?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_idRoute.mp3`

> Eenyummaa kee akkamitti agarsiisuu barbaadda?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_idRoute.mp3`

> መንነትኩም ብኸመይ ከተርእዩ ትደልዩ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_idRoute.mp3`

> Sidee baad u rabtaa inaad muujiso cidda aad tahay?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_idRoute.mp3`

> Ati ayeti ikkitoota hiittoo leellisate hasatto?

### `o_idRoute_kebele`: Focus: choice "Kebele ID or passport" (question idRoute)

**English** → `public/audio/en/o_idRoute_kebele.mp3`

> Kebele ID or passport

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_idRoute_kebele.mp3`

> ቀበሌ መታወቂያ ወይም ፓስፖርት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_kebele.mp3`

> Waraqaa eenyummaa gandaa ykn paaspoortii

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_kebele.mp3`

> መንነት ቀበሌ ወይ ፓስፖርት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_kebele.mp3`

> Aqoonsiga kebele ama baasaboor

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_idRoute_kebele.mp3`

> Qebeele eeshsha woy paaspoorte

### `o_idRoute_refugee`: Focus: choice "Refugee or returnee ID" (question idRoute)

**English** → `public/audio/en/o_idRoute_refugee.mp3`

> Refugee or returnee ID

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_idRoute_refugee.mp3`

> የስደተኛ ወይም ተመላሽ መታወቂያ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_refugee.mp3`

> Waraqaa eenyummaa baqataa ykn deebi'aa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_refugee.mp3`

> መንነት ስደተኛ ወይ ተመላሲ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_refugee.mp3`

> Aqoonsiga qaxootiga ama soo-noqotaha

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_idRoute_refugee.mp3`

> Baqatu woy higgaanchu eeshsha

### `o_idRoute_other`: Focus: choice "Another document" (question idRoute)

**English** → `public/audio/en/o_idRoute_other.mp3`

> Another document

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_idRoute_other.mp3`

> ሌላ ሰነድ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_other.mp3`

> Sanada biraa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_other.mp3`

> ካልእ ሰነድ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_other.mp3`

> Dukumenti kale

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_idRoute_other.mp3`

> Wole bortaje

### `o_idRoute_refer`: Focus: choice "I don't have an ID. Refer me through a partner organisation" (question idRoute)

**English** → `public/audio/en/o_idRoute_refer.mp3`

> I don't have an ID. Refer me through a partner organisation

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_idRoute_refer.mp3`

> ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_idRoute_refer.mp3`

> Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_idRoute_refer.mp3`

> መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_idRoute_refer.mp3`

> Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_idRoute_refer.mp3`

> Eeshsha diafi'rino. Jaala dirijjiteenni hoolisi'e

### `q_support`: The question "What support would help you? Choose any." on its own (answer box focus, review page)

**English** → `public/audio/en/q_support.mp3`

> What support would help you? Choose any.

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_support.mp3`

> ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_support.mp3`

> Deeggarsa akkamii si gargaara? Kamiyyuu filadhu.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_support.mp3`

> እንታይ ደገፍ ይሕግዘኩም? ዝኾነ ምረጹ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_support.mp3`

> Taageero noocee ah ayaa ku caawin lahayd? Dooro mid kasta.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_support.mp3`

> Hiittoo kaa'lo kaa'lannohe? Ayeeno doori.

### `o_support_screenreader`: Focus: choice "I use a screen reader" (question support)

**English** → `public/audio/en/o_support_screenreader.mp3`

> I use a screen reader

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_support_screenreader.mp3`

> ስክሪን ሪደር እጠቀማለሁ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_screenreader.mp3`

> Dubbisaa iskiriinii nan fayyadama

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_screenreader.mp3`

> ስክሪን ሪደር እጥቀም

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_screenreader.mp3`

> Waxaan isticmaalaa akhriyaha shaashadda

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_support_screenreader.mp3`

> Leellisaancho nabbawaancho horoonsi'reemmo

### `o_support_large`: Focus: choice "Large text" (question support)

**English** → `public/audio/en/o_support_large.mp3`

> Large text

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_support_large.mp3`

> ትልቅ ጽሑፍ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_large.mp3`

> Barreeffama guddaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_large.mp3`

> ዓቢ ጽሑፍ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_large.mp3`

> Qoraal weyn

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_support_large.mp3`

> Lowo borro

### `o_support_voice`: Focus: choice "I prefer to speak my answers" (question support)

**English** → `public/audio/en/o_support_voice.mp3`

> I prefer to speak my answers

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_support_voice.mp3`

> መልሶቼን በድምፅ መናገር እመርጣለሁ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_voice.mp3`

> Deebii koo dubbachuu nan filadha

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_voice.mp3`

> መልስታተይ ብድምጺ ክዛረብ እመርጽ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_voice.mp3`

> Waxaan doorbidaa inaan ku hadlo jawaabahayga

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_support_voice.mp3`

> Dawaro qaalinke hasaawa doorreemmo

### `o_support_sign`: Focus: choice "Ethiopian Sign Language interpreter" (question support)

**English** → `public/audio/en/o_support_sign.mp3`

> Ethiopian Sign Language interpreter

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_support_sign.mp3`

> የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_sign.mp3`

> Hiikaa Afaan Mallattoo Itoophiyaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_sign.mp3`

> ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_sign.mp3`

> Turjubaan Luqadda Calaamadaha Itoobiya

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_support_sign.mp3`

> Itiyoophiyu Malaatu Afoo turjimaancho

### `o_support_simple`: Focus: choice "Simple words and pictures" (question support)

**English** → `public/audio/en/o_support_simple.mp3`

> Simple words and pictures

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_support_simple.mp3`

> ቀላል ቃላትና ሥዕሎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_simple.mp3`

> Jechoota salphaa fi fakkiiwwan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_simple.mp3`

> ቀለልቲ ቃላትን ስእልታትን

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_simple.mp3`

> Erayo fudud iyo sawirro

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_support_simple.mp3`

> Shota qaalla nna misilla

### `o_support_human`: Focus: choice "Please call me to help" (question support)

**English** → `public/audio/en/o_support_human.mp3`

> Please call me to help

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_support_human.mp3`

> እባክዎ ደውለው ያግዙኝ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_support_human.mp3`

> Maaloo na gargaaruuf natti bilbilaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_support_human.mp3`

> በጃኹም ደዊልኩም ሓግዙኒ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_support_human.mp3`

> Fadlan ii soo wac si aad ii caawiso

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_support_human.mp3`

> Ikkitinni kaa'lo daafira silki xa'mi

### `q_needs`: The question "What support do you need at work? Choose any." on its own (answer box focus, review page)

**English** → `public/audio/en/q_needs.mp3`

> What support do you need at work? Choose any.

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_needs.mp3`

> በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ።

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_needs.mp3`

> Hojii irratti deeggarsa akkamii si barbaachisa? Kamiyyuu filadhu.

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_needs.mp3`

> ኣብ ስራሕ እንታይ ደገፍ የድልየኩም? ዝኾነ ምረጹ።

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_needs.mp3`

> Taageero noocee ah ayaad ugu baahan tahay shaqada? Dooro mid kasta.

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_needs.mp3`

> Loosu aana hiittoo kaa'lo hasiissannohe? Ayeeno doori.

### `o_needs_stepfree`: Focus: choice "Step-free workplace" (question needs)

**English** → `public/audio/en/o_needs_stepfree.mp3`

> Step-free workplace

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_needs_stepfree.mp3`

> ከደረጃ ነፃ የሥራ ቦታ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_stepfree.mp3`

> Bakka hojii gulantaa hin qabne

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_stepfree.mp3`

> ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_stepfree.mp3`

> Goob shaqo oo aan jaranjaro lahayn

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_needs_stepfree.mp3`

> Gadu dinokki loosu bayicho

### `o_needs_reader`: Focus: choice "Screen-reader friendly tools" (question needs)

**English** → `public/audio/en/o_needs_reader.mp3`

> Screen-reader friendly tools

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_needs_reader.mp3`

> ለስክሪን ሪደር ተስማሚ መሣሪያዎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_reader.mp3`

> Meeshaalee dubbisaa iskiriinii waliin hojjetan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_reader.mp3`

> ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_reader.mp3`

> Qalab ku habboon akhriyaha shaashadda

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_needs_reader.mp3`

> Leellisaancho nabbawaanchora coyi'nanno uduunnicho

### `o_needs_interp`: Focus: choice "Sign language interpreter" (question needs)

**English** → `public/audio/en/o_needs_interp.mp3`

> Sign language interpreter

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_needs_interp.mp3`

> የምልክት ቋንቋ አስተርጓሚ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_interp.mp3`

> Hiikaa afaan mallattoo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_interp.mp3`

> ተርጓሚ ቋንቋ ምልክት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_interp.mp3`

> Turjubaan luqadda calaamadaha

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_needs_interp.mp3`

> Malaatu afoo turjimaancho

### `o_needs_hours`: Focus: choice "Flexible hours" (question needs)

**English** → `public/audio/en/o_needs_hours.mp3`

> Flexible hours

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_needs_hours.mp3`

> ተለዋዋጭ የሥራ ሰዓት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_hours.mp3`

> Sa'aatii hojii jijjiiramaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_hours.mp3`

> ተዓጻጻፊ ሰዓታት ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_hours.mp3`

> Saacado dabacsan

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_needs_hours.mp3`

> Soorramanno loosu saate

### `o_needs_remote`: Focus: choice "Work from home" (question needs)

**English** → `public/audio/en/o_needs_remote.mp3`

> Work from home

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_needs_remote.mp3`

> ከቤት መሥራት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_needs_remote.mp3`

> Mana irraa hojjechuu

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_needs_remote.mp3`

> ካብ ገዛ ምስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_needs_remote.mp3`

> Ka shaqeyn guriga

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_needs_remote.mp3`

> Mineenni loosa

### `q_role`: Job page: the question "Which job are you applying for?" (the job titles are read by the device voice)

**English** → `public/audio/en/q_role.mp3`

> Which job are you applying for?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_role.mp3`

> የትኛውን ሥራ እየጠየቁ ነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_role.mp3`

> Hojii kamiif iyyachaa jirta?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_role.mp3`

> ንኣየናይ ስራሕ ኢኹም እትሓቱ ዘለኹም?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_role.mp3`

> Shaqadee ayaad codsanaysaa?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_role.mp3`

> Ayi loosora xa'mitto?

### `q_why`: The question "Why do you want this job?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_why.mp3`

> Why do you want this job?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_why.mp3`

> ይህን ሥራ ለምን ይፈልጋሉ?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_why.mp3`

> Hojii kana maaliif barbaadda?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_why.mp3`

> ነዚ ስራሕ ስለምንታይ ትደልይዎ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_why.mp3`

> Maxaad u rabtaa shaqadan?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_why.mp3`

> Konne loosu mayira hasatto?

### `q_job`: The question "What is the job title?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_job.mp3`

> What is the job title?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_job.mp3`

> የሥራው መጠሪያ ምንድን ነው?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_job.mp3`

> Maqaan hojii kanaa maali?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_job.mp3`

> ሽም እቲ ስራሕ እንታይ እዩ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_job.mp3`

> Waa maxay magaca shaqada?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_job.mp3`

> Loosu su'mi ayeti?

### `q_offers`: The question "Which adjustments can this job offer?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_offers.mp3`

> Which adjustments can this job offer?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_offers.mp3`

> ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_offers.mp3`

> Hojiin kun mijeessuu akkamii dhiyeessuu danda'a?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_offers.mp3`

> እዚ ስራሕ እንታይ ምትዕርራያት ከቕርብ ይኽእል?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_offers.mp3`

> Waa maxay hagaajinta ay shaqadani bixin karto?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_offers.mp3`

> Kuni loosu hiittoo qixxeessuwa aamanno?

### `o_offers_stepfree`: Focus: choice "Step-free workplace" (question offers)

**English** → `public/audio/en/o_offers_stepfree.mp3`

> Step-free workplace

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_offers_stepfree.mp3`

> ከደረጃ ነፃ የሥራ ቦታ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_stepfree.mp3`

> Bakka hojii gulantaa hin qabne

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_stepfree.mp3`

> ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_stepfree.mp3`

> Goob shaqo oo aan jaranjaro lahayn

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_offers_stepfree.mp3`

> Gadu dinokki loosu bayicho

### `o_offers_reader`: Focus: choice "Screen-reader friendly tools" (question offers)

**English** → `public/audio/en/o_offers_reader.mp3`

> Screen-reader friendly tools

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_offers_reader.mp3`

> ለስክሪን ሪደር ተስማሚ መሣሪያዎች

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_reader.mp3`

> Meeshaalee dubbisaa iskiriinii waliin hojjetan

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_reader.mp3`

> ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_reader.mp3`

> Qalab ku habboon akhriyaha shaashadda

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_offers_reader.mp3`

> Leellisaancho nabbawaanchora coyi'nanno uduunnicho

### `o_offers_interp`: Focus: choice "Sign language interpreter" (question offers)

**English** → `public/audio/en/o_offers_interp.mp3`

> Sign language interpreter

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_offers_interp.mp3`

> የምልክት ቋንቋ አስተርጓሚ

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_interp.mp3`

> Hiikaa afaan mallattoo

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_interp.mp3`

> ተርጓሚ ቋንቋ ምልክት

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_interp.mp3`

> Turjubaan luqadda calaamadaha

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_offers_interp.mp3`

> Malaatu afoo turjimaancho

### `o_offers_hours`: Focus: choice "Flexible hours" (question offers)

**English** → `public/audio/en/o_offers_hours.mp3`

> Flexible hours

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_offers_hours.mp3`

> ተለዋዋጭ የሥራ ሰዓት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_hours.mp3`

> Sa'aatii hojii jijjiiramaa

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_hours.mp3`

> ተዓጻጻፊ ሰዓታት ስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_hours.mp3`

> Saacado dabacsan

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_offers_hours.mp3`

> Soorramanno loosu saate

### `o_offers_remote`: Focus: choice "Work from home" (question offers)

**English** → `public/audio/en/o_offers_remote.mp3`

> Work from home

**አማርኛ (checked by a native speaker)** → `public/audio/am/o_offers_remote.mp3`

> ከቤት መሥራት

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/o_offers_remote.mp3`

> Mana irraa hojjechuu

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/o_offers_remote.mp3`

> ካብ ገዛ ምስራሕ

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/o_offers_remote.mp3`

> Ka shaqeyn guriga

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/o_offers_remote.mp3`

> Mineenni loosa

### `q_closes`: The question "When do applications close?" on its own (answer box focus, review page)

**English** → `public/audio/en/q_closes.mp3`

> When do applications close?

**አማርኛ (checked by a native speaker)** → `public/audio/am/q_closes.mp3`

> ማመልከቻ መቼ ይዘጋል?

**Afaan Oromoo (draft, VERIFY_NATIVE)** → `public/audio/om/q_closes.mp3`

> Iyyannoon yoom cufama?

**ትግርኛ (draft, VERIFY_NATIVE)** → `public/audio/ti/q_closes.mp3`

> ምዝገባ ማመልከቻ መዓስ ይዕጾ?

**Soomaali (draft, VERIFY_NATIVE)** → `public/audio/so/q_closes.mp3`

> Goormaa la xirayaa codsiyada?

**Sidaamu Afoo (draft, VERIFY_NATIVE)** → `public/audio/sid/q_closes.mp3`

> Xa'muwu ayi yanna gufamanno?

---

## After making the clips
- Test every language, with the phone volume low and high.
- Confirm each file starts playing within about one second on a phone.
- Tell the team which files are still missing; the device voice covers them where it can.
