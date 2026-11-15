# Recording script for read-aloud audio

This file tells you exactly what to record. It was generated from the current text in `public/db-form.js`, so the words match the screen. **If you change any text in the code, re-generate or edit this file and re-record that file.**

## Why recordings exist (and why Amharic is silent right now)
Most phones and laptops have **no Amharic voice**. The browser can only read with voices installed on the device, so **Amharic cannot be read aloud until the Amharic recordings exist**. English works with the device voice even without recordings. So yes: for Amharic, a person has to record the voice, using the words below.

When an Amharic recording is missing and the device has no Amharic voice, the plugin now says in English "This device has no voice for this language…" so a blind person knows why, and it still listens for their answer.

## What to produce
- **33 files per language** (66 in total) (English and Amharic).
- Format: **mp3**, mono, 64 kbps or lower (small for 3G). 
- Folders: `public/audio/en/` and `public/audio/am/`.
- File name = the **ID** in the first column, plus `.mp3`. Example: `public/audio/am/fullName.mp3`. Use exactly this spelling and capital letters.
- The plugin loads them from the `audio` attribute: `audio='http://localhost:3000/audio'` (the server serves the `public` folder).

## How to record (phone is fine)
1. Quiet room, phone 20 cm from your mouth, no fan or echo.
2. Speak slowly and clearly, like to a stranger. Pause about one second between sentences and between choices.
3. Read **every word exactly as written**, no more and no less. Do not add "please" or change the order, including the numbers ("1:" is spoken "one", "2:" "two"…). The numbers matter: the person will say them back.
4. Read the Amharic with a native speaker, and let that speaker also fix any wrong Amharic in the code first. Then update the text here too.
5. Trim silence at the start and end. Keep each file under about 40 seconds.
6. Convert to mp3 (for example with Audacity: File, Export, MP3), name the file, put it in the right folder, then test: open the form, choose Read to me, and listen to each page in both languages.
7. Commit and push the audio folders.

## Important: what the voice says must match what is on screen
- The **first question of each flow** (`prefs`, `needs`, `job`) has **no Back button**, so its script does **not** say "Back". Every other question does.
- **Skip** is spoken only for optional questions, and those pages have a visible Skip button.
- The words you say in the instructions are the same as the buttons: **Next, Back, Skip, Read aloud, Start, Submit**.
- The privacy notice is spoken **once**, in `raAsk`, and shown once on that same page. It is not repeated anywhere else.
- The **contact** question (phone or email) is **typed, not spoken**: it has no Speak button and the voice does not listen, because email addresses and numbers are not recognised reliably. Its script ends with "Please type your answer in the box. Then press Enter, or press the Next button."

- **Errors and answers are now recorded too.** `errNeed`, `errBad`, `errFail`, `unclear`, `noneSel`, `idle`, `sayWelcome` and `reviewAsk` are single messages. The confirmation after a choice is three parts played in a row: `choseA` ("You chose"), then the number clips `n1` to `n8` (for example "two"), then `choseB`. Record the numbers as single words with a short pause at the end.
- If a website hides a question with the `hide` attribute, the recordings still describe the full list. Hide only questions you do not need in your own demo, or record again for that site.
- The **Stop reading** button and the Escape key stop any recording or voice at any time. They are not spoken, so they are not in the scripts.

## Do NOT record these (they change each time)
- **review** (the first part of the last page): reads out the person's own answers, then asks "Do you want to submit your answers?". Only the second part, `reviewFix`, is recordable.
- **role** (job flow, "Which job are you applying for?"): the list of jobs depends on the person's private filter and on jobs employers add. The device voice reads it.
- The exact words a person typed or said (for example their name). The device voice reads them back when it has a voice for the language; otherwise `heardGeneric` is played.
These pages use the device voice. That is expected.

## Checklist
| ID | Page | Optional question? |
|---|---|---|
| `raAsk` | First question (asks if the page should be read aloud) | - |
| `raAgain` | Second ask, if no answer was heard | - |
| `welcome` | Welcome page (after they said Yes to read aloud) | - |
| `prefs` | signup flow, question 1 | yes (includes "Say Skip") |
| `fullName` | signup flow, question 2 | no |
| `contact` | signup flow, question 3 | no |
| `idRoute` | signup flow, question 4 | no |
| `support` | signup flow, question 5 | yes (includes "Say Skip") |
| `needs` | job flow, question 1 | yes (includes "Say Skip") |
| `why` | job flow, question 3 | no |
| `job` | employer flow, question 1 | no |
| `offers` | employer flow, question 2 | yes (includes "Say Skip") |
| `errNeed` | Error: question not answered | - |
| `errBad` | Error: phone number or email not valid | - |
| `errFail` | Error: could not send | - |
| `unclear` | Voice answer not understood | - |
| `noneSel` | Nothing chosen yet | - |
| `idle` | Nothing heard | - |
| `sayWelcome` | Welcome page: say Start | - |
| `reviewAsk` | Review page: do you want to submit? | - |
| `heardGeneric` | Spoken answer received (used when the device has no voice) | - |
| `choseA` | Confirmation, first part ("You chose") | - |
| `choseB` | Confirmation, last part | - |
| `n1` | Number 1 (used in the confirmation) | - |
| `n2` | Number 2 (used in the confirmation) | - |
| `n3` | Number 3 (used in the confirmation) | - |
| `n4` | Number 4 (used in the confirmation) | - |
| `n5` | Number 5 (used in the confirmation) | - |
| `n6` | Number 6 (used in the confirmation) | - |
| `n7` | Number 7 (used in the confirmation) | - |
| `n8` | Number 8 (used in the confirmation) | - |
| `reviewFix` | Review page, second part (after the person says No to submitting) | - |
| `done` | Thank-you page | - |

---

## The scripts

Record the text inside each box, from the first word to the last. Read "1:" as "one", "2:" as "two", and so on.

### `raAsk`: First question (asks if the page should be read aloud)

**English** → `public/audio/en/raAsk.mp3`

> Would you like this page to be read aloud to you? Please say Yes or No, or press a button. If you choose Yes, or press a Speak button later, your browser may send your voice to its provider to turn it into text. You can choose No and type instead.

**አማርኛ (draft, must be checked)** → `public/audio/am/raAsk.mp3`

> ይህ ገጽ እንዲነበብልዎ ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ፤ ወይም አንድ ቁልፍ ይጫኑ። «አዎ» ከመረጡ ወይም በኋላ «ተናገር» ከተጫኑ አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው ሊልክ ይችላል። «አይ» መርጠው በምትኩ መጻፍ ይችላሉ።

### `raAgain`: Second ask, if no answer was heard

**English** → `public/audio/en/raAgain.mp3`

> We did not hear an answer, so we will take that as No. If you would like the page read aloud, please say Yes now, or press the Yes button.

**አማርኛ (draft, must be checked)** → `public/audio/am/raAgain.mp3`

> መልስ አልሰማንም። እንደ «አይ» እንወስደዋለን። እንዲነበብልዎ ከፈለጉ አሁን «አዎ» ይበሉ ወይም «አዎ» የሚለውን ይጫኑ።

### `welcome`: Welcome page (after they said Yes to read aloud)

**English** → `public/audio/en/welcome.mp3`

> Welcome! A simpler way to register and find opportunities. Start. Start with voice. Read to me. Say Start to begin.

**አማርኛ (draft, must be checked)** → `public/audio/am/welcome.mp3`

> እንኳን ደህና መጡ! ለመመዝገብና ዕድሎችን ለማግኘት ቀለል ያለ መንገድ። ጀምር. በድምፅ ጀምር. አንብቡልኝ. ለመጀመር «ጀምር» ይበሉ።

### `prefs`: signup flow, question 1

**English** → `public/audio/en/prefs.mp3`

> How would you like to use this form? Optional. You can skip this. 1: Larger text. 2: Pictures next to choices. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/prefs.mp3`

> ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ? አማራጭ ነው። መዝለል ይችላሉ። 1: ትልቅ ጽሑፍ. 2: ከምርጫዎች ጋር ሥዕሎች. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

### `fullName`: signup flow, question 2

**English** → `public/audio/en/fullName.mp3`

> What is your full name? The name you use every day is fine. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/fullName.mp3`

> ሙሉ ስምዎ ማነው? በየቀኑ የሚጠቀሙበት ስም በቂ ነው። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

### `contact`: signup flow, question 3

**English** → `public/audio/en/contact.mp3`

> What phone number or email can we use? Only used to contact you about this programme. A phone number has 10 digits and starts with 0. Please type your answer in the box. Then press Enter, or press the Next button.

**አማርኛ (draft, must be checked)** → `public/audio/am/contact.mp3`

> ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው? ስለዚህ ፕሮግራም ለማግኘት ብቻ ነው የሚያገለግለው። ስልክ ቁጥር በዜሮ የሚጀምር ባለ አሥር አሃዝ ነው። እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።

### `idRoute`: signup flow, question 4

**English** → `public/audio/en/idRoute.mp3`

> How would you like to show who you are? 1: Kebele ID or passport. 2: Refugee or returnee ID. 3: Another document. 4: I don't have an ID. Refer me through a partner organisation. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/idRoute.mp3`

> ማንነትዎን እንዴት ማሳየት ይፈልጋሉ? 1: ቀበሌ መታወቂያ ወይም ፓስፖርት. 2: የስደተኛ ወይም ተመላሽ መታወቂያ. 3: ሌላ ሰነድ. 4: ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

### `support`: signup flow, question 5

**English** → `public/audio/en/support.mp3`

> What support would help you? Choose any. You can skip this. No proof needed. Only the organisers see it, and only to prepare help for you. 1: I use a screen reader. 2: Large text. 3: I prefer to speak my answers. 4: Ethiopian Sign Language interpreter. 5: Simple words and pictures. 6: Please call me to help. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/support.mp3`

> ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ። ይህን መዝለል ይችላሉ። ማስረጃ አያስፈልግም። አዘጋጆቹ ብቻ ያዩታል፤ ለእርስዎ እገዛ ለማዘጋጀት ብቻ። 1: ስክሪን ሪደር እጠቀማለሁ. 2: ትልቅ ጽሑፍ. 3: መልሶቼን በድምፅ መናገር እመርጣለሁ. 4: የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ. 5: ቀላል ቃላትና ሥዕሎች. 6: እባክዎ ደውለው ያግዙኝ. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

### `needs`: job flow, question 1

**English** → `public/audio/en/needs.mp3`

> What support do you need at work? Choose any. Private. This stays on your device and is only used to show suitable jobs. 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/needs.mp3`

> በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ። ሚስጥራዊ ነው። በመሣሪያዎ ላይ ብቻ ይቆያል፤ ተስማሚ ሥራዎችን ለማሳየት ብቻ ነው። 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

### `why`: job flow, question 3

**English** → `public/audio/en/why.mp3`

> Why do you want this job? A few words are enough. You can speak instead. Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/why.mp3`

> ይህን ሥራ ለምን ይፈልጋሉ? ጥቂት ቃላት በቂ ናቸው። በድምፅ መናገርም ይችላሉ። መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

### `job`: employer flow, question 1

**English** → `public/audio/en/job.mp3`

> What is the job title? Speak your answer now. Say Next to continue, or Read aloud to hear this again.

**አማርኛ (draft, must be checked)** → `public/audio/am/job.mp3`

> የሥራው መጠሪያ ምንድን ነው? መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።

### `offers`: employer flow, question 2

**English** → `public/audio/en/offers.mp3`

> Which adjustments can this job offer? 1: Step-free workplace. 2: Screen-reader friendly tools. 3: Sign language interpreter. 4: Flexible hours. 5: Work from home. Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again. Say Skip to skip this question.

**አማርኛ (draft, must be checked)** → `public/audio/am/offers.mp3`

> ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል? 1: ከደረጃ ነፃ የሥራ ቦታ. 2: ለስክሪን ሪደር ተስማሚ መሣሪያዎች. 3: የምልክት ቋንቋ አስተርጓሚ. 4: ተለዋዋጭ የሥራ ሰዓት. 5: ከቤት መሥራት. የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ። ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።

### `errNeed`: Error: question not answered

**English** → `public/audio/en/errNeed.mp3`

> Please answer this question, or press Back.

**አማርኛ (draft, must be checked)** → `public/audio/am/errNeed.mp3`

> እባክዎ ይህን ጥያቄ ይመልሱ ወይም ተመለስ ይጫኑ።

### `errBad`: Error: phone number or email not valid

**English** → `public/audio/en/errBad.mp3`

> Please type a phone number with 10 digits, starting with zero, or an email address with an @ sign.

**አማርኛ (draft, must be checked)** → `public/audio/am/errBad.mp3`

> እባክዎ በዜሮ የሚጀምር ባለ አሥር አሃዝ ስልክ ቁጥር ይጻፉ፤ ወይም «@» ምልክት ያለው ኢሜይል አድራሻ ይጻፉ።

### `errFail`: Error: could not send

**English** → `public/audio/en/errFail.mp3`

> We could not send your answers. Nothing is lost. Please try again.

**አማርኛ (draft, must be checked)** → `public/audio/am/errFail.mp3`

> መልሶችዎን መላክ አልቻልንም። ምንም አልጠፋም። እባክዎ እንደገና ይሞክሩ።

### `unclear`: Voice answer not understood

**English** → `public/audio/en/unclear.mp3`

> Sorry, I did not understand. Please say the number of your choice.

**አማርኛ (draft, must be checked)** → `public/audio/am/unclear.mp3`

> ይቅርታ፣ አልገባኝም። እባክዎ የምርጫዎን ቁጥር ይናገሩ።

### `noneSel`: Nothing chosen yet

**English** → `public/audio/en/noneSel.mp3`

> Nothing is chosen. Say a number or a name, or say Skip.

**አማርኛ (draft, must be checked)** → `public/audio/am/noneSel.mp3`

> ምንም አልተመረጠም። ቁጥር ወይም ስም ይናገሩ፤ ወይም «ዝለል» ይበሉ።

### `idle`: Nothing heard

**English** → `public/audio/en/idle.mp3`

> We did not hear you. Press the big Speak button, or press Stop reading to use the keyboard.

**አማርኛ (draft, must be checked)** → `public/audio/am/idle.mp3`

> አልሰማንዎትም። ትልቁን «ተናገር» ቁልፍ ይጫኑ፤ ወይም ኪቦርድ ለመጠቀም «ማንበብ አቁም» ይጫኑ።

### `sayWelcome`: Welcome page: say Start

**English** → `public/audio/en/sayWelcome.mp3`

> Say Start to begin.

**አማርኛ (draft, must be checked)** → `public/audio/am/sayWelcome.mp3`

> ለመጀመር «ጀምር» ይበሉ።

### `reviewAsk`: Review page: do you want to submit?

**English** → `public/audio/en/reviewAsk.mp3`

> Do you want to submit your answers? Say Yes to submit, or No to change something.

**አማርኛ (draft, must be checked)** → `public/audio/am/reviewAsk.mp3`

> መልሶችዎን ማስገባት ይፈልጋሉ? ለማስገባት «አዎ»፣ አንድ ነገር ለመቀየር «አይ» ይበሉ።

### `heardGeneric`: Spoken answer received (used when the device has no voice)

**English** → `public/audio/en/heardGeneric.mp3`

> We heard your answer. It is shown on the screen. Say Next to continue, or say your answer again.

**አማርኛ (draft, must be checked)** → `public/audio/am/heardGeneric.mp3`

> መልስዎን ሰምተናል። በማያ ገጹ ላይ ይታያል። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።

### `choseA`: Confirmation, first part ("You chose")

**English** → `public/audio/en/choseA.mp3`

> You chose

**አማርኛ (draft, must be checked)** → `public/audio/am/choseA.mp3`

> የመረጡት

### `choseB`: Confirmation, last part

**English** → `public/audio/en/choseB.mp3`

> Say Next to continue, or choose again.

**አማርኛ (draft, must be checked)** → `public/audio/am/choseB.mp3`

> ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።

### `n1`: Number 1 (used in the confirmation)

**English** → `public/audio/en/n1.mp3`

> One

**አማርኛ (draft, must be checked)** → `public/audio/am/n1.mp3`

> አንድ

### `n2`: Number 2 (used in the confirmation)

**English** → `public/audio/en/n2.mp3`

> Two

**አማርኛ (draft, must be checked)** → `public/audio/am/n2.mp3`

> ሁለት

### `n3`: Number 3 (used in the confirmation)

**English** → `public/audio/en/n3.mp3`

> Three

**አማርኛ (draft, must be checked)** → `public/audio/am/n3.mp3`

> ሦስት

### `n4`: Number 4 (used in the confirmation)

**English** → `public/audio/en/n4.mp3`

> Four

**አማርኛ (draft, must be checked)** → `public/audio/am/n4.mp3`

> አራት

### `n5`: Number 5 (used in the confirmation)

**English** → `public/audio/en/n5.mp3`

> Five

**አማርኛ (draft, must be checked)** → `public/audio/am/n5.mp3`

> አምስት

### `n6`: Number 6 (used in the confirmation)

**English** → `public/audio/en/n6.mp3`

> Six

**አማርኛ (draft, must be checked)** → `public/audio/am/n6.mp3`

> ስድስት

### `n7`: Number 7 (used in the confirmation)

**English** → `public/audio/en/n7.mp3`

> Seven

**አማርኛ (draft, must be checked)** → `public/audio/am/n7.mp3`

> ሰባት

### `n8`: Number 8 (used in the confirmation)

**English** → `public/audio/en/n8.mp3`

> Eight

**አማርኛ (draft, must be checked)** → `public/audio/am/n8.mp3`

> ስምንት

### `reviewFix`: Review page, second part (after the person says No to submitting)

**English** → `public/audio/en/reviewFix.mp3`

> Say Start again to go back to the first question, or say the number of the question you want to change.

**አማርኛ (draft, must be checked)** → `public/audio/am/reviewFix.mp3`

> ወደ መጀመሪያው ጥያቄ ለመመለስ «እንደገና ጀምር» ይበሉ፤ ወይም መቀየር የሚፈልጉትን ጥያቄ ቁጥር ይናገሩ።

### `done`: Thank-you page

**English** → `public/audio/en/done.mp3`

> Thank you. We received your answers.

**አማርኛ (draft, must be checked)** → `public/audio/am/done.mp3`

> እናመሰግናለን። መልሶችዎን ተቀብለናል።

---

## After recording
- Test in English and Amharic, with the phone volume low and high.
- Confirm each file starts playing within about one second on a phone.
- Tell the team which files are still missing; the device voice covers them, but Amharic may then be silent on phones without an Amharic voice.