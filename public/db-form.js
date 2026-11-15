/* Inclusive Access plugin: one script, one tag.
   <script src='https://YOUR-HOST/db-form.js'></script>
   <db-form flow='signup' lang='en' api='https://YOUR-HOST/v1'></db-form>
   flow: signup | job | employer.  lang: en | am.  hide: optional comma list of question ids to leave out, e.g. hide='idRoute,support' (fullName, role and job cannot be hidden).  audio: optional base URL of recorded .mp3 files (BASE/en|am/QUESTIONID.mp3).  Events: db-complete, db-error.
   Amharic text is a DRAFT: have a native speaker check every string before submitting. */
const T = (x, l) => (x && x.en ? (x[l] || x.en) : x);
const o = (k, en, am) => [k, { en, am }];

const UI = {
  next: { en: 'Next', am: 'ቀጥል' }, back: { en: 'Back', am: 'ተመለስ' },
  read: { en: 'Read this page aloud', am: 'ይህን ገጽ አንብብልኝ' }, speak: { en: 'Start voice input', am: 'የድምፅ ግብዓት ጀምር' },
  stopListen: { en: 'Stop listening', am: 'ማዳመጥ አቁም' }, toTyping: { en: 'Switch to typing', am: 'ወደ መጻፍ ቀይር' },
  listenOn: { en: 'Microphone on: listening', am: 'ማይክሮፎን በርቷል፦ እያዳመጥን ነው' },
  listenStopped: { en: 'Stopped listening. You can type, or press Start voice input to speak again.', am: 'ማዳመጥ ቆሟል። መጻፍ ይችላሉ፤ ወይም እንደገና ለመናገር «የድምፅ ግብዓት ጀምር» ይጫኑ።' },
  typingNow: { en: 'Voice input is off. You can type your answer.', am: 'የድምፅ ግብዓት ጠፍቷል። መልስዎን መጻፍ ይችላሉ።' },
  voiceNote: { en: 'Voice input is optional. When you press it, your browser may send your voice to its provider to turn it into text. You can always type instead.', am: 'የድምፅ ግብዓት አማራጭ ነው። ሲጫኑት አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው ሊልክ ይችላል። ሁልጊዜ በምትኩ መጻፍ ይችላሉ።' },
  voiceOffQ: { en: 'Voice input is not used for this question, because phone numbers and email addresses are often misheard. Please type your answer.', am: 'ስልክ ቁጥርና ኢሜይል ብዙ ጊዜ በስህተት ስለሚሰሙ ለዚህ ጥያቄ የድምፅ ግብዓት አይጠቀምም። እባክዎ መልስዎን ይጻፉ።' },
  errPre: { en: 'Error:', am: 'ስህተት፦' }, langLabel: { en: 'Language', am: 'ቋንቋ' },
  changeSr: { en: 'answer {n}: {q}', am: 'መልስ {n}፦ {q}' },
  need1: { en: 'Please answer this question.', am: 'እባክዎ ይህን ጥያቄ ይመልሱ።' },
  send: { en: 'Yes, submit', am: 'አዎ፣ አስገባ' }, change: { en: 'Change', am: 'ቀይር' },
  review: { en: 'Check your answers', am: 'መልሶችዎን ያረጋግጡ' },
  thanks: { en: 'Thank you. We received your answers.', am: 'እናመሰግናለን። መልሶችዎን ተቀብለናል።' },
  need: { en: 'Please answer this question, or press Back.', am: 'እባክዎ ይህን ጥያቄ ይመልሱ ወይም ተመለስ ይጫኑ።' },
  bad: { en: 'Please type a phone number with 10 digits, starting with zero, or an email address with an @ sign.', am: 'እባክዎ በዜሮ የሚጀምር ባለ አሥር አሃዝ ስልክ ቁጥር ይጻፉ፤ ወይም «@» ምልክት ያለው ኢሜይል አድራሻ ይጻፉ።' },
  skip: { en: 'Skip', am: 'ዝለል' },
  stopped: { en: 'Reading aloud stopped. Press Read every page aloud to start again.', am: 'ማንበብ ቆሟል። እንደገና ለመጀመር «እያንዳንዱን ገጽ አንብብልኝ» ይጫኑ።' },
  stoppedAll: { en: 'Reading aloud and voice input stopped. You can use the keyboard.', am: 'ማንበብና የድምፅ ግብዓት ቆመዋል። ኪቦርዱን መጠቀም ይችላሉ።' },
  skipped: { en: '(skipped)', am: '(ተዘሏል)' },
  of: { en: 'Question {n} of {t}', am: 'ጥያቄ {n} ከ {t}' },
  heard: { en: 'We heard: {x}. You can edit it.', am: 'የሰማነው፦ {x}። ማስተካከል ይችላሉ።' },
  novoice: { en: 'Voice input is not available here. Please type.', am: 'የድምፅ ግብዓት እዚህ አይገኝም። እባክዎ ይጻፉ።' },
  novoicehere: { en: 'This device has no voice for this language. Please read the text, or try another device.', am: 'ይህ መሣሪያ ለዚህ ቋንቋ ድምፅ የለውም። እባክዎ ጽሑፉን ያንብቡ ወይም ሌላ መሣሪያ ይሞክሩ።' },
  listening: { en: 'Listening. Speak now.', am: 'እያዳመጥን ነው። አሁን ይናገሩ።' },
  micblocked: { en: 'Microphone permission was denied, so voice input is off. You can type, or allow the microphone in your browser settings and press Start voice input again.', am: 'የማይክሮፎን ፈቃድ ተከልክሏል፤ ስለዚህ የድምፅ ግብዓት ጠፍቷል። መጻፍ ይችላሉ፤ ወይም በአሳሹ ቅንብሮች ውስጥ ማይክሮፎኑን ፈቅደው «የድምፅ ግብዓት ጀምር» ን እንደገና ይጫኑ።' },
  nomic: { en: 'No microphone was found, so voice input is off. Please type.', am: 'ማይክሮፎን አልተገኘም፤ ስለዚህ የድምፅ ግብዓት ጠፍቷል። እባክዎ ይጻፉ።' },
  micerr: { en: 'Voice input stopped because of a problem with the microphone or the speech service. Please type, or press Start voice input to try again.', am: 'በማይክሮፎኑ ወይም በንግግር አገልግሎቱ ችግር ምክንያት የድምፅ ግብዓት ቆሟል። እባክዎ ይጻፉ፤ ወይም እንደገና ለመሞከር «የድምፅ ግብዓት ጀምር» ይጫኑ።' },
  nolang: { en: 'This browser cannot understand this language by voice, so voice input is off. Please type.', am: 'ይህ አሳሽ ይህን ቋንቋ በድምፅ መረዳት አይችልም፤ ስለዚህ የድምፅ ግብዓት ጠፍቷል። እባክዎ ይጻፉ።' },
  nospeech: { en: 'We did not hear anything, so listening has stopped. Press Start voice input to try again, or type.', am: 'ምንም አልሰማንም፤ ስለዚህ ማዳመጥ ቆሟል። እንደገና ለመሞከር «የድምፅ ግብዓት ጀምር» ይጫኑ ወይም ይጻፉ።' },
  welcomeH: { en: 'Welcome!', am: 'እንኳን ደህና መጡ!' },
  welcomeP: { en: 'A simpler way to register and find opportunities.', am: 'ለመመዝገብና ዕድሎችን ለማግኘት ቀለል ያለ መንገድ።' },
  startVoice: { en: 'Start with voice input', am: 'በድምፅ ግብዓት ጀምር' },
  typeInstead: { en: 'Type instead', am: 'በምትኩ ይጻፉ' },
  start: { en: 'Start and type my answers', am: 'ጀምር፣ መልሶቼን እጽፋለሁ' },
  intro: { en: 'Welcome. This form asks one question at a time. Use Tab to move between buttons and Enter to choose. Press Read this page aloud to hear a page.', am: 'እንኳን ደህና መጡ። ይህ ቅጽ አንድ ጥያቄ በአንድ ጊዜ ይጠይቃል። በአዝራሮች መካከል ለመንቀሳቀስ Tab ይጠቀሙ፤ ለመምረጥ Enter ይጫኑ። ገጽ ለመስማት «ይህን ገጽ አንብብልኝ» ይጫኑ።' },
  readToMe: { en: 'Read every page aloud', am: 'እያንዳንዱን ገጽ አንብብልኝ' },
  stopRead: { en: 'Stop reading aloud', am: 'ማንበብ አቁም' },
  reading: { en: 'Reading aloud...', am: 'እያነበብን ነው...' },
  raAsk: { en: 'Would you like this page to be read aloud to you?', am: 'ይህ ገጽ እንዲነበብልዎ ይፈልጋሉ?' },
  raHint: { en: 'Read aloud means this form speaks each page to you. It does not use your microphone. Choose Yes or No.', am: 'ማንበብ ማለት ይህ ቅጽ እያንዳንዱን ገጽ ያነብልዎታል ማለት ነው። ማይክሮፎንዎን አይጠቀምም። «አዎ» ወይም «አይ» ይምረጡ።' },
  raPrivacy: { en: 'Voice input is separate and optional. It only starts when you press a voice input button. Your browser may then send your voice to its provider (for example Google, in Chrome) to turn it into text. You can always type instead.', am: 'የድምፅ ግብዓት የተለየና አማራጭ ነው። የሚጀምረው የድምፅ ግብዓት ቁልፍ ሲጫኑ ብቻ ነው። ከዚያ አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው (ለምሳሌ በChrome ውስጥ Google) ሊልክ ይችላል። ሁልጊዜ በምትኩ መጻፍ ይችላሉ።' },
  raVoice: { en: 'Answer Yes or No by voice', am: '«አዎ» ወይም «አይ» በድምፅ ይመልሱ' },
  raListen: { en: 'Listening. Speak now. Say Yes or No.', am: 'እያዳመጥን ነው። አሁን ይናገሩ። «አዎ» ወይም «አይ» ይበሉ።' },
  raUnclear: { en: 'We did not understand, so listening has stopped. Press Yes or No, or try voice input again.', am: 'አልገባንም፤ ስለዚህ ማዳመጥ ቆሟል። «አዎ» ወይም «አይ» ይጫኑ፤ ወይም የድምፅ ግብዓትን እንደገና ይሞክሩ።' },
  raNoHear: { en: 'We did not hear an answer, so listening has stopped. Press Yes or No, or try voice input again.', am: 'መልስ አልሰማንም፤ ስለዚህ ማዳመጥ ቆሟል። «አዎ» ወይም «አይ» ይጫኑ፤ ወይም የድምፅ ግብዓትን እንደገና ይሞክሩ።' },
  raYes: { en: 'Yes, read aloud', am: 'አዎ፣ ይነበብልኝ' },
  raNo: { en: 'No, thank you', am: 'አይ፣ አያስፈልግም' },
  sayChoose: { en: 'Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again.', am: 'የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።' },
  sayChoose1: { en: 'Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again.', am: 'የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።' },
  saySkip: { en: 'Say Skip to skip this question.', am: 'ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።' },
  sayText: { en: 'Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.', am: 'መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።' },
  sayText1: { en: 'Speak your answer now. Say Next to continue, or Read aloud to hear this again.', am: 'መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።' },
  sayWelcome: { en: 'Say Start to begin.', am: 'ለመጀመር «ጀምር» ይበሉ።' },
  sayReview: { en: 'Say Submit to send your answers, or Back to change them.', am: 'መልሶችዎን ለመላክ «አስገባ»፣ ለመቀየር «ተመለስ» ይበሉ።' },
  chose: { en: 'You chose: {x}. Say Next to continue, or choose again.', am: 'የመረጡት፦ {x}። ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።' },
  noneSel: { en: 'Nothing is chosen. Say a number or a name, or say Skip.', am: 'ምንም አልተመረጠም። ቁጥር ወይም ስም ይናገሩ፤ ወይም «ዝለል» ይበሉ።' },
  unclear: { en: 'Sorry, I did not understand. Please say the number of your choice.', am: 'ይቅርታ፣ አልገባኝም። እባክዎ የምርጫዎን ቁጥር ይናገሩ።' },
  heardNext: { en: 'We heard: {x}. Say Next to continue, or say your answer again.', am: 'የሰማነው፦ {x}። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።' },
  idle: { en: 'We did not hear you, so listening has stopped. Press Start voice input to try again, or type your answer.', am: 'አልሰማንዎትም፤ ስለዚህ ማዳመጥ ቆሟል። እንደገና ለመሞከር «የድምፅ ግብዓት ጀምር» ይጫኑ ወይም መልስዎን ይጻፉ።' },
  sayType: { en: 'Please type your answer in the box. Then press Enter, or press the Next button.', am: 'እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።' },
  reviewAsk: { en: 'Do you want to submit your answers? Say Yes to submit, or No to change something.', am: 'መልሶችዎን ማስገባት ይፈልጋሉ? ለማስገባት «አዎ»፣ አንድ ነገር ለመቀየር «አይ» ይበሉ።' },
  reviewFix: { en: 'Say Start again to go back to the first question, or say the number of the question you want to change.', am: 'ወደ መጀመሪያው ጥያቄ ለመመለስ «እንደገና ጀምር» ይበሉ፤ ወይም መቀየር የሚፈልጉትን ጥያቄ ቁጥር ይናገሩ።' },
  reviewAskT: { en: 'Do you want to submit your answers? Press Yes, submit to send them, or No, change something.', am: 'መልሶችዎን ማስገባት ይፈልጋሉ? ለመላክ «አዎ፣ አስገባ»፣ ለመቀየር «አይ፣ አንድ ነገር ልቀይር» ይጫኑ።' },
  reviewFixT: { en: 'Press Change next to the answer you want to change, or press Start again to go back to the first question.', am: 'መቀየር ከሚፈልጉት መልስ አጠገብ «ቀይር» ይጫኑ፤ ወይም ወደ መጀመሪያው ጥያቄ ለመመለስ «እንደገና ጀምር» ይጫኑ።' },
  noChange: { en: 'No, change something', am: 'አይ፣ አንድ ነገር ልቀይር' },
  restart: { en: 'Start again', am: 'እንደገና ጀምር' },
  choseA: { en: 'You chose', am: 'የመረጡት' },
  choseB: { en: 'Say Next to continue, or choose again.', am: 'ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።' },
  heardGeneric: { en: 'We heard your answer. It is shown on the screen. Say Next to continue, or say your answer again.', am: 'መልስዎን ሰምተናል። በማያ ገጹ ላይ ይታያል። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።' },
  fail: { en: 'We could not send your answers. Nothing is lost. Please try again.', am: 'መልሶችዎን መላክ አልቻልንም። ምንም አልጠፋም። እባክዎ እንደገና ይሞክሩ።' },
};

const WORK = [
  o('stepfree', 'Step-free workplace', 'ከደረጃ ነፃ የሥራ ቦታ'), o('reader', 'Screen-reader friendly tools', 'ለስክሪን ሪደር ተስማሚ መሣሪያዎች'),
  o('interp', 'Sign language interpreter', 'የምልክት ቋንቋ አስተርጓሚ'), o('hours', 'Flexible hours', 'ተለዋዋጭ የሥራ ሰዓት'), o('remote', 'Work from home', 'ከቤት መሥራት'),
];

const FLOWS = {
  signup: { path: '/learners', steps: [
    { id: 'prefs', local: true, q: { en: 'How would you like to use this form?', am: 'ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ?' }, hint: { en: 'Optional. You can skip this.', am: 'አማራጭ ነው። መዝለል ይችላሉ።' }, type: 'checkbox', optional: true, options: [o('large', 'Larger text', 'ትልቅ ጽሑፍ'), o('simple', 'Pictures next to choices', 'ከምርጫዎች ጋር ሥዕሎች')] },
    { id: 'fullName', ac: 'name', q: { en: 'What is your full name?', am: 'ሙሉ ስምዎ ማነው?' }, hint: { en: 'The name you use every day is fine.', am: 'በየቀኑ የሚጠቀሙበት ስም በቂ ነው።' }, type: 'text' },
    { id: 'contact', novoice: true, q: { en: 'What phone number or email can we use?', am: 'ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው?' }, hint: { en: 'Only used to contact you about this programme. A phone number has 10 digits and starts with 0.', am: 'ስለዚህ ፕሮግራም ለማግኘት ብቻ ነው የሚያገለግለው። ስልክ ቁጥር በዜሮ የሚጀምር ባለ አሥር አሃዝ ነው።' }, type: 'text',
      check: v => v.includes('@') || /^(0\d{9}|251\d{9})$/.test(v.replace(/[^0-9]/g, '')), bad: 'bad' },
    { id: 'idRoute', q: { en: 'How would you like to show who you are?', am: 'ማንነትዎን እንዴት ማሳየት ይፈልጋሉ?' }, type: 'radio', options: [
      o('kebele', 'Kebele ID or passport', 'ቀበሌ መታወቂያ ወይም ፓስፖርት'), o('refugee', 'Refugee or returnee ID', 'የስደተኛ ወይም ተመላሽ መታወቂያ'),
      o('other', 'Another document', 'ሌላ ሰነድ'), o('refer', "I don't have an ID. Refer me through a partner organisation", 'ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ')] },
    { id: 'support', q: { en: 'What support would help you? Choose any.', am: 'ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ።' }, hint: { en: 'You can skip this. No proof needed. Only the organisers see it, and only to prepare help for you.', am: 'ይህን መዝለል ይችላሉ። ማስረጃ አያስፈልግም። አዘጋጆቹ ብቻ ያዩታል፤ ለእርስዎ እገዛ ለማዘጋጀት ብቻ።' }, type: 'checkbox', optional: true, options: [
      o('screenreader', 'I use a screen reader', 'ስክሪን ሪደር እጠቀማለሁ'), o('large', 'Large text', 'ትልቅ ጽሑፍ'), o('voice', 'I prefer to speak my answers', 'መልሶቼን በድምፅ መናገር እመርጣለሁ'),
      o('sign', 'Ethiopian Sign Language interpreter', 'የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ'), o('simple', 'Simple words and pictures', 'ቀላል ቃላትና ሥዕሎች'), o('human', 'Please call me to help', 'እባክዎ ደውለው ያግዙኝ')] },
  ] },
  job: { path: '/applications', steps: [
    { id: 'needs', local: true, q: { en: 'What support do you need at work? Choose any.', am: 'በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ።' }, hint: { en: 'Private. This stays on your device and is only used to show suitable jobs.', am: 'ሚስጥራዊ ነው። በመሣሪያዎ ላይ ብቻ ይቆያል፤ ተስማሚ ሥራዎችን ለማሳየት ብቻ ነው።' }, type: 'checkbox', optional: true, options: WORK },
    { id: 'role', dyn: true, q: { en: 'Which job are you applying for?', am: 'የትኛውን ሥራ እየጠየቁ ነው?' }, type: 'text' },
    { id: 'why', q: { en: 'Why do you want this job?', am: 'ይህን ሥራ ለምን ይፈልጋሉ?' }, hint: { en: 'A few words are enough. You can speak instead.', am: 'ጥቂት ቃላት በቂ ናቸው። በድምፅ መናገርም ይችላሉ።' }, type: 'text' },
  ] },
  employer: { path: '/employer/jobs', steps: [
    { id: 'job', q: { en: 'What is the job title?', am: 'የሥራው መጠሪያ ምንድን ነው?' }, type: 'text' },
    { id: 'offers', q: { en: 'Which adjustments can this job offer?', am: 'ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል?' }, type: 'checkbox', optional: true, options: WORK },
  ] },
};

const CSS = `
:host{display:block;font:1.125rem/1.6 system-ui,'Noto Sans Ethiopic',sans-serif;color:#1a1a1a}
section{max-width:36rem;margin:auto;padding:1.5rem;background:#f7fbf8;border:2px solid #1b5e3f;border-radius:16px}
fieldset{border:0;padding:0;margin:0}
legend,h2{font-size:1.25em;font-weight:700;padding:0}
input[type=text]{width:100%;font:inherit;padding:.75rem;border:2px solid #1a1a1a;border-radius:6px;box-sizing:border-box}
.opt{display:flex;gap:.75rem;align-items:center;min-height:52px;padding:.5rem .75rem;margin:.5rem 0;border:2px solid #4a6b57;border-radius:10px;background:#fff;cursor:pointer}
.opt:has(input:checked){background:#e3f2e8;border-width:3px}
input[type=radio],input[type=checkbox]{width:1.5rem;height:1.5rem}
button{font:inherit;min-height:44px;min-width:44px;padding:.5rem 1rem;border-radius:6px;border:2px solid #1b5e3f;background:#fff;color:#1b5e3f;cursor:pointer}
button.p{background:#1b5e3f;color:#fff}
:focus-visible{outline:3px solid #1b5e3f;outline-offset:3px}
.err{color:#a00000;font-weight:600}
.err:not(:empty){border-left:6px solid #a00000;padding:.25rem 0 .25rem .75rem;background:#fff}
.err:focus{outline:3px solid #1b5e3f;outline-offset:3px}
.opt:has(input:focus-visible){outline:3px solid #1b5e3f;outline-offset:2px}
.note{font-size:.95em;color:#33473b;margin:.25rem 0 1rem}
.vhint{font-weight:600;padding:.5rem .75rem;border:2px dashed #1b5e3f;border-radius:8px;background:#fff}
.vbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:0 0 1rem;padding:.75rem;border:3px solid #1b5e3f;border-radius:10px;background:#fff}
.vind{flex:1 1 100%;font-weight:700;display:flex;align-items:center;gap:.5rem}
.vind .dot{width:.9rem;height:.9rem;border-radius:50%;background:#a00000;flex:none}
.vbar button{flex:1 1 10rem}
.vbar .wave{display:inline-flex}
.mic.on{background:#fff;color:#1b5e3f;border-style:dashed}
dt{font-weight:600}
dd{margin:0 0 1rem;overflow-wrap:anywhere}
input[type=text]{overflow-wrap:anywhere}
.row{display:flex;flex-direction:column;gap:.75rem;margin-top:1.5rem}
.row button{width:100%}
.sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
[hidden]{display:none!important}
.center{text-align:center}
.big{font-size:1.2em;padding:.75rem 1.5rem;min-height:72px}
.tools{margin:-.75rem 0 1rem}
.tools button{width:100%}
.mic{display:flex;width:100%;justify-content:center;align-items:center;margin-bottom:1rem;font-size:1.3em;min-height:72px;padding:1rem;border-radius:2rem;border-width:3px}
progress{width:100%;height:.6rem;accent-color:#1b5e3f}
.wave{display:none;gap:3px;margin-left:.5rem;align-items:center;height:1.2em}
.mic.on .wave{display:inline-flex}
.opt{overflow-wrap:anywhere}
.wave i{width:4px;height:100%;background:currentColor;animation:w 1s infinite ease-in-out}
.wave i:nth-child(2){animation-delay:.15s}.wave i:nth-child(3){animation-delay:.3s}.wave i:nth-child(4){animation-delay:.45s}.wave i:nth-child(5){animation-delay:.6s}
@keyframes w{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
form>*+*{margin-top:1rem}
.center>*+*{margin-top:1.25rem}
.step{margin:0;font-weight:600}
legend{margin-bottom:.5rem}
#hint{margin:.5rem 0 1rem;color:#33473b}
.lang{display:flex;gap:.5rem;margin-bottom:1.5rem}
.lang button{flex:1}
.lang button[aria-pressed=true]{background:#1b5e3f;color:#fff}
.status{margin:0 0 1rem;padding:.75rem 1rem;border-left:6px solid #1b5e3f;background:#e3f2e8;border-radius:8px;font-weight:600}
.status:empty{padding:0;border:0;margin:0;background:none}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const IC = { kebele: '🆔', refugee: '🏕️', other: '📄', refer: '🤝', screenreader: '🔊', large: '🔍', voice: '🎤', sign: '🤟', simple: '🖼️', human: '📞', stepfree: '♿', reader: '🔊', interp: '🤟', hours: '⏰', remote: '🏠' };
const LOGO = `<svg width='56' height='56' viewBox='0 0 56 56' aria-hidden='true' focusable='false'><circle cx='28' cy='12' r='8' fill='#1b5e3f'/><path d='M6 22c14 0 20 8 22 26C26 30 20 24 6 22zM50 22c-14 0-20 8-22 26 2-18 8-24 22-26z' fill='#2e8b57'/></svg>`;
const CHECK = `<svg width='64' height='64' viewBox='0 0 64 64' aria-hidden='true' focusable='false'><circle cx='32' cy='32' r='30' fill='#1b5e3f'/><path d='M18 33l9 9 19-20' stroke='#fff' stroke-width='5' fill='none'/></svg>`;
const esc = s => String(s == null ? '' : s).replace(/[&<>']/g, c => '&#' + c.charCodeAt(0) + ';');

const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, 'አንድ': 1, 'ሁለት': 2, 'ሦስት': 3, 'ሶስት': 3, 'አራት': 4, 'አምስት': 5, 'ስድስት': 6, 'ሰባት': 7, 'ስምንት': 8, '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5, '፮': 6, '፯': 7, '፰': 8 };
const NUM1 = { won: 1, to: 2, too: 2, for: 4 };
const STOP = ['use', 'the', 'and', 'for', 'you', 'can', 'not', 'don', 'have', 'please', 'through', 'any'];
const CMD = {
  next: ['next', 'continue', 'done', 'finished', 'ቀጥል', 'ቀጥሉ', 'ጨርሻለሁ'],
  back: ['back', 'previous', 'ተመለስ', 'ኋላ'],
  skip: ['skip', 'ዝለል', 'ዝለሉ'],
  repeat: ['read', 'aloud', 'repeat', 'again', 'አንብብልኝ', 'አንብብ', 'ድገም', 'እንደገና'],
  start: ['start', 'begin', 'ጀምር'],
  send: ['submit', 'send', 'አስገባ'],
  restart: ['restart', 'beginning', 'ከመጀመሪያ'],
  stop: ['stop', 'ቁም', 'አቁም'],
};
const HASV = () => window.SpeechRecognition || window.webkitSpeechRecognition;

class DbForm extends HTMLElement {
  constructor() { super(); this.r = this.attachShadow({ mode: 'open' }); this.i = 0; this.a = {}; this.err = ''; this.done = false; this.moved = false; this.vok = false; this.pref = {}; this.jobs = null; this.welcome = false; this.vm = false; this.rm = false; this.cp = false; this.aud = null; this.ra = 0; this.vrec = null; this.vno = false; this.vtries = 0; this.tok = 0; this.rs = 0; this.fromReview = false; this.noticed = false; this.hide = []; }
  connectedCallback() {
    this.f = FLOWS[this.getAttribute('flow')] || FLOWS.signup; this.l = this.getAttribute('lang') === 'am' ? 'am' : 'en';
    this.welcome = true;
    this.hide = (this.getAttribute('hide') || '').split(',').map(x => x.trim()).filter(x => x && !['fullName', 'role', 'job'].includes(x));
    this.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.active()) { e.preventDefault(); this.stopAll(); return; }
      // Typing means the person chose the keyboard: stop listening. Buttons and Tab are left alone, so Enter or Space
      // on "Stop listening" or "Start voice input" does exactly what the button says.
      const t = e.composedPath ? e.composedPath()[0] : e.target;
      if (['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key) || (t && t.tagName === 'BUTTON')) return;
      if (this.vrec) { this.vm = false; this.stopVoice('listenStopped'); }
    });
    const api = this.getAttribute('api');
    // Nothing is spoken and the microphone is never started here: reading aloud and voice input only start after a button press.
    if (this.f.steps.some(s => s.dyn) && api) fetch(api + '/jobs').then(r => r.json()).then(j => { this.jobs = j; }).catch(() => {}).finally(() => this.draw());
    else this.draw();
  }
  get steps() { return this.f.steps.filter(s => !(s.skip && s.skip(this.a)) && !this.hide.includes(s.id)).map(s => s.dyn ? this.dyn(s) : s); }
  dyn(s) {
    if (!this.jobs) return { ...s, type: 'text' };
    const need = this.a.needs || [], ok = this.jobs.filter(j => need.every(n => j.offers.includes(n)));
    return { ...s, type: 'radio', options: (ok.length ? ok : this.jobs).map(j => [j.title, { en: j.title, am: j.titleAm }]) };
  }
  u(k, v) { let t = T(UI[k], this.l); for (const x in v) t = t.replace('{' + x + '}', v[x]); return t; }
  sl() { return this.l === 'am' ? 'am-ET' : 'en-US'; }
  // Voice instructions ("Say Next...") are only given when voice input is switched on and can work.
  voiceOn() { return !!(this.vm && !this.vno && HASV()); }
  keep(s) {
    if (!s || this.welcome || this.done) return;
    const f = this.r.querySelector('#f');
    if (f) { this.a[s.id] = f.value; return; }
    const c = [...this.r.querySelectorAll('input[name=f]:checked')].map(x => x.value);
    if (s.type === 'radio') this.a[s.id] = c[0] || ''; else if (s.type === 'checkbox') this.a[s.id] = c;
  }

  show(x) {
    const v = this.a[x.id], nm = k => T((x.options.find(p => p[0] === k) || [])[1], this.l);
    const t = Array.isArray(v) ? v.map(nm).join(', ') : (x.options && v ? nm(v) : v);
    return t || this.u('skipped');
  }

  // The voice instructions for the current page. Shown on screen only while the microphone is listening.
  voiceText(s) {
    if (!s) return this.u(this.rs ? 'reviewFix' : 'reviewAsk');
    if (s.novoice) return '';
    const f = this.i ? '' : '1';
    return s.type === 'text' ? this.u('sayText' + f) : this.u('sayChoose' + f) + (s.optional ? ' ' + this.u('saySkip') : '');
  }

  errHTML() { return `<p id='err' class='err' tabindex='-1'>${this.err ? `<span>${esc(this.u('errPre'))}</span> ${esc(this.err)}` : ''}</p>`; }

  field(s, n) {
    const v = this.a[s.id] || (s.type === 'checkbox' ? [] : ''), bad = this.err ? " aria-invalid='true'" : '';
    const req = !s.optional && s.type !== 'checkbox' ? ' required' : '';
    const inp = s.type === 'text'
      ? `<input id='f' name='f' type='text' value='${esc(v)}' aria-labelledby='h' aria-describedby='hint err'${bad}${req}${s.ac ? ` autocomplete='${s.ac}'` : ''}>`
      : s.options.map(([k, t]) => `<label class='opt'><input type='${s.type}' name='f' value='${esc(k)}' ${[].concat(v).includes(k) ? 'checked' : ''}${this.err ? " aria-describedby='err'" : ''}${bad}${req}> ${this.pref.simple ? `<span aria-hidden='true'>${IC[k] || ''}</span> ` : ''}${esc(T(t, this.l))}</label>`).join('');
    const hasV = HASV(), on = !!this.vrec;
    const mic = hasV && !s.novoice ? `<button type='button' data-mic class='mic p${on ? ' on' : ''}'${this.vm ? '' : " aria-describedby='micnote'"}><span aria-hidden='true'>🎤</span> <span class='ml'>${this.u(on ? 'stopListen' : 'speak')}</span><span class='wave' aria-hidden='true'><i></i><i></i><i></i><i></i><i></i></span></button>${this.vm ? '' : `<p id='micnote' class='note'>${this.u('voiceNote')}</p>`}` : '';
    const vt = this.voiceText(s);
    const vh = this.voiceOn() ? (s.novoice ? `<p class='vhint'>${this.u('voiceOffQ')}</p>` : `<p id='vhint' class='vhint'${on ? '' : ' hidden'}>${esc(vt)}</p>`) : '';
    return `<form novalidate><p class='step' id='stepn'>${esc(this.u('of', { n: this.i + 1, t: n }))}</p><progress value='${this.i + 1}' max='${n}' aria-hidden='true'></progress>
      <fieldset${s.type === 'text' ? '' : " aria-describedby='hint'"}><legend><h2 id='h' tabindex='-1' aria-describedby='stepn'>${esc(T(s.q, this.l))}</h2></legend><p id='hint'>${esc(T(s.hint, this.l))}</p>${mic}${vh}${inp}
      ${this.errHTML()}</fieldset>
      <div class='row'><button class='p'>${this.u('next')}</button>${s.optional ? `<button type='button' data-skip>${this.u('skip')}</button>` : ''}${this.i ? `<button type='button' data-back>${this.u('back')}</button>` : ''}<button type='button' data-read><span aria-hidden='true'>🔊</span> ${this.u('read')}</button></div></form>`;
  }

  welcomeHTML() {
    const hasV = HASV();
    if (this.ra < 2) return `<div class='center'>${LOGO}<h2 id='h' tabindex='-1'>${this.u('raAsk')}</h2><p>${this.u('raHint')}</p>
      <div class='row'><button type='button' class='p big' data-ra='y'>${this.u('raYes')}</button><button type='button' class='big' data-ra='n'>${this.u('raNo')}</button></div>
      <p id='vprivacy' class='note'>${this.u('raPrivacy')}</p>
      ${hasV ? `<div class='row'><button type='button' data-ravoice aria-describedby='vprivacy'><span aria-hidden='true'>🎤</span> ${this.u('raVoice')}</button></div>` : ''}</div>`;
    return `<div class='center'>${LOGO}<h2 id='h' tabindex='-1'>${this.u('welcomeH')}</h2><p>${this.u('welcomeP')}</p>
      <div class='row'><button type='button' class='p big' data-start='t'>${this.u('start')}</button>
      ${hasV ? `<button type='button' class='big' data-start='v' aria-describedby='vprivacy'><span aria-hidden='true'>🎤</span> ${this.u('startVoice')}</button>` : ''}
      ${this.rm ? `<button type='button' class='big' data-stoprm>${this.u('stopRead')}</button>` : `<button type='button' class='big' data-rm><span aria-hidden='true'>🔊</span> ${this.u('readToMe')}</button>`}</div>
      ${hasV ? `<p id='vprivacy' class='note'>${this.u('raPrivacy')}</p>` : ''}</div>`;
  }

  pageText(s, noErr) {
    const l = this.l, n = k => this.u(k), v = this.voiceOn(), err = this.err && !noErr ? this.err + ' ' : '';
    const j = a => a.filter(Boolean).map(x => (/[.?!።]$/.test(x) ? x : x + '.')).join(' ');
    if (this.done) return n('thanks');
    if (this.welcome && this.ra < 2) return j([n('raAsk'), n('raHint'), n('raPrivacy')]);
    if (this.welcome) return j([n('welcomeH'), n('welcomeP'), n('start'), HASV() ? n('startVoice') : '', n('readToMe')]);
    if (!s) {
      if (this.rs) return err + n(v ? 'reviewFix' : 'reviewFixT');
      const rv = this.steps.filter(x => !x.local);
      return err + j([n('review'), ...rv.map((x, k) => (k + 1) + ': ' + T(x.q, l) + ': ' + this.show(x)), n(v ? 'reviewAsk' : 'reviewAskT')]);
    }
    const opts = (s.options || []).map((p, i) => (v ? (i + 1) + ': ' : '') + T(p[1], l));
    const ins = !v ? '' : s.novoice ? n('sayType') : this.voiceText(s);
    return err + j([T(s.q, l), T(s.hint, l), ...opts, ins]);
  }

  // "Answer Yes or No by voice" on the first screen. Only ever started by that button.
  hear() {
    const R = HASV();
    if (!R) { this.say(this.u('novoice')); return; }
    this.halt();
    const rec = new R(); rec.lang = this.sl(); rec.interimResults = false;
    this.vrec = rec;
    rec.onresult = e => { this.endRec(rec); const a = this.ans(e.results[0][0].transcript); if (a) this.raDone(a); else this.say(this.u('raUnclear')); };
    rec.onerror = e => { this.endRec(rec); this.say(e.error === 'no-speech' ? this.u('raNoHear') : this.micMsg(e.error)); };
    rec.onend = () => { if (this.vrec === rec) { this.endRec(rec); this.say(this.u('raNoHear')); } };
    this.vui(true); this.say(this.u('raListen'));
    try { rec.start(); } catch (x) { this.endRec(rec); this.say(this.u('micerr')); }
  }

  ans(t) {
    const yes = ['አዎ', 'አዎን', 'ይሁን', 'yes', 'yeah', 'yep', 'ok', 'okay', 'sure'], no = ['አይ', 'አይደለም', 'አልፈልግም', 'አያስፈልግም', 'no', 'nope'];
    const w = t.toLowerCase().split(/[\s.,!?፣።]+/);
    return w.some(x => no.includes(x)) ? 'n' : w.some(x => yes.includes(x)) ? 'y' : '';
  }

  raDone(a) {
    if (this.ra > 1 || !this.welcome || !a) return;
    this.moved = true; this.ra = 2; this.rm = a === 'y';
    this.draw();
    if (!this.rm) this.say(this.u('intro'));
  }

  stopRA() { this.halt(); }

  // Status messages go to one live region that is never re-rendered, so screen readers announce each change once.
  say(t) {
    const x = this.r.querySelector('#live'); if (!x) return;
    clearTimeout(this.sayT); x.textContent = '';
    this.sayT = setTimeout(() => { x.textContent = t; }, 100);
  }

  micMsg(e) {
    return this.u(e === 'not-allowed' || e === 'service-not-allowed' ? 'micblocked' : e === 'audio-capture' ? 'nomic' : e === 'language-not-supported' ? 'nolang' : e === 'no-speech' ? 'nospeech' : 'micerr');
  }

  // Show or hide the listening state: the bar with Stop listening and Switch to typing, the voice instructions and the mic button label.
  vui(on) {
    const q = x => this.r.querySelector(x), bar = q('#vbar'), mb = q('.mic'), vh = q('#vhint');
    if (!on && bar && bar.contains(this.r.activeElement)) { const t = q('[data-mic]') || q('#f') || q('input[name=f]') || q('#h'); if (t) t.focus(); }
    if (bar) bar.hidden = !on;
    if (vh) vh.hidden = !on;
    if (mb) { mb.classList.toggle('on', on); const ml = mb.querySelector('.ml'); if (ml) ml.textContent = this.u(on ? 'stopListen' : 'speak'); }
  }

  endRec(rec) { if (this.vrec === rec) this.vrec = null; this.vui(false); }

  focusField() { const q = x => this.r.querySelector(x); const t = q('#f') || q('input[name=f]:checked') || q('input[name=f]') || q('#h'); if (t) t.focus(); }

  // Re-render without losing typed answers. focus: selector to keep focus on. quiet: do not read the page again.
  refresh(focus, quiet) { this.keep(this.steps[this.i]); this.moved = true; this.focusTo = focus; this.quiet = !!quiet; this.draw(); }

  draw() {
    if (this.moved) this.halt();
    const st = this.steps, s = st[this.i], other = this.l === 'en' ? 'am' : 'en';
    let b;
    if (this.done) b = `<div class='center'>${CHECK}<h2 id='h' tabindex='-1'>${this.u('thanks')}</h2></div>`;
    else if (this.welcome) b = this.welcomeHTML();
    else if (!s) {
      const rv = st.map((x, n) => [x, n]).filter(([x]) => !x.local), on = !!this.vrec;
      b = `<h2 id='h' tabindex='-1'>${this.u('review')}</h2><dl>${rv.map(([x, n], k) =>
        `<dt>${k + 1}. ${esc(T(x.q, this.l))}</dt><dd>${esc(this.show(x))} <button type='button' data-edit='${n}'>${this.u('change')}<span class='sr'> ${esc(this.u('changeSr', { n: k + 1, q: T(x.q, this.l) }))}</span></button></dd>`).join('')}</dl>
      ${this.voiceOn() ? `<p id='vhint' class='vhint'${on ? '' : ' hidden'}>${esc(this.voiceText())}</p>` : ''}
      <p>${this.u(this.rs ? 'reviewFixT' : 'reviewAskT')}</p>
      ${this.errHTML()}
      <div class='row'><button type='button' class='p big' data-send>${this.u('send')}</button>${this.rs ? '' : `<button type='button' class='big' data-nochange>${this.u('noChange')}</button>`}<button type='button' class='big' data-restart>${this.u('restart')}</button><button type='button' data-back>${this.u('back')}</button></div>`;
    }
    else b = this.field(s, st.length);
    const sb = k => `<button type='button' data-${k === 'stop' ? 'stoprm' : 'rm'}>${this.u(k === 'stop' ? 'stopRead' : 'readToMe')}</button>`;
    const tb = this.welcome && this.ra < 2 ? `<button type='button' data-read><span aria-hidden='true'>🔊</span> ${this.u('read')}</button>` : this.welcome ? '' : this.rm ? sb('stop') : sb('read');
    const tools = tb ? `<div class='tools'>${tb}</div>` : '';
    const vbar = `<div class='vbar' id='vbar'${this.vrec ? '' : ' hidden'}><span class='vind'><span class='dot' aria-hidden='true'></span>${this.u('listenOn')}<span class='wave' aria-hidden='true'><i></i><i></i><i></i><i></i><i></i></span></span><button type='button' data-vstop>${this.u('stopListen')}</button><button type='button' data-vtype>${this.u('toTyping')}</button></div>`;
    if (!this.r.querySelector('#view')) this.r.innerHTML = `<style>${CSS}</style><section><div id='top'></div><p class='status' id='live' role='status'></p><div id='view'></div></section>`;
    const sec = this.r.querySelector('section'); sec.setAttribute('lang', this.l); sec.style.fontSize = this.pref.large ? '1.4rem' : '';
    if (this.moved) { clearTimeout(this.sayT); this.r.querySelector('#live').textContent = ''; }
    this.r.querySelector('#top').innerHTML = `<div class='lang' role='group' aria-label='${this.u('langLabel')}'><button type='button' data-lang='en' lang='en' aria-pressed='${this.l === 'en'}'>${this.l === 'en' ? "<span aria-hidden='true'>✓ </span>" : ''}English</button><button type='button' data-lang='am' lang='am' aria-pressed='${this.l === 'am'}'>${this.l === 'am' ? "<span aria-hidden='true'>✓ </span>" : ''}አማርኛ</button></div>${tools}${vbar}`;
    this.r.querySelector('#view').innerHTML = b;
    this.bind(s);
    this.vtries = 0;
    const quiet = this.quiet; this.quiet = false;
    if (this.moved && !quiet) {
      const go = this.done ? null : () => this.listenAnswer();
      if (this.rm) this.readPage(s, go);
      else if (this.err && (this.vm || this.usedRead)) this.readErr(go);
      else if (go) go();
    }
  }

  bind(s) {
    const q = x => this.r.querySelector(x), on = (x, fn) => q(x) && q(x).addEventListener('click', fn);
    if (q('form')) q('form').addEventListener('submit', e => { e.preventDefault(); this.next(s); });
    this.r.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { this.keep(s); this.l = b.dataset.lang; this.err = ''; this.moved = true; this.focusTo = '[data-lang=' + this.l + ']'; this.draw(); }));
    on('[data-back]', () => this.goBack(s));
    on('[data-skip]', () => this.skipStep(s));
    on('[data-read]', () => { this.usedRead = true; this.readPage(s); });
    on('[data-mic]', () => {
      if (this.vrec) { this.vm = false; this.stopVoice('listenStopped'); return; }
      this.vno = false;
      if (!this.vm) { this.vm = true; this.refresh('[data-mic]', true); }
      this.listen(false);
    });
    on('[data-vstop]', () => { this.vm = false; this.stopVoice('listenStopped'); });
    on('[data-vtype]', () => { this.vm = false; this.stopVoice('typingNow'); this.focusField(); });
    on('[data-ravoice]', () => this.hear());
    on('[data-rm]', () => { this.rm = true; this.refresh('[data-stoprm]'); });
    on('[data-stoprm]', () => this.stopRead());
    this.r.querySelectorAll('[data-ra]').forEach(b => b.addEventListener('click', () => { this.stopRA(); this.raDone(b.dataset.ra); }));
    on('[data-send]', () => this.send());
    this.r.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => this.startForm(b.dataset.start === 'v')));
    this.r.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => this.edit(+b.dataset.edit)));
    on('[data-nochange]', () => { this.rs = 1; this.moved = true; this.draw(); });
    on('[data-restart]', () => this.restart());
    if (this.moved) {
      // New step, review or completion: focus its heading. Error: focus the field in error, or the error itself.
      const t = (this.focusTo && q(this.focusTo)) || (this.err && (q('[aria-invalid=true]') || q('#err'))) || q('#h');
      this.focusTo = null;
      if (t) t.focus();
    }
  }

  next(s) {
    const c = [...this.r.querySelectorAll('input:checked')].map(x => x.value);
    const v = s.type === 'text' ? this.r.querySelector('#f').value.trim() : s.type === 'radio' ? (c[0] || '') : c;
    const empty = !v || !v.length;
    this.err = ''; this.errKey = '';
    // The first question has no Back button, so its message does not mention Back.
    if (empty && !s.optional) { this.errKey = this.i ? 'need' : 'need1'; this.err = this.u(this.errKey); }
    else if (!empty && s.check && !s.check(v)) { this.err = this.u(s.bad); this.errKey = s.bad; }
    this.a[s.id] = v; this.moved = true;
    if (s.id === 'prefs') this.pref = { large: v.includes('large'), simple: v.includes('simple') };
    if (!this.err) this.advance();
    this.draw();
  }

  speak(t, id, cb) {
    const base = this.getAttribute('audio'), k = ++this.tok;
    if (cb) { const c = cb; cb = () => { if (k === this.tok) c(); }; }
    if (this.aud) this.aud.pause();
    if (window.speechSynthesis) speechSynthesis.cancel();
    this.say(this.u('reading'));
    if (base && id && id !== 'review') {
      let used = false; const fb = () => { if (!used) { used = true; this.tts(t, cb); } };
      this.aud = new Audio(base + '/' + this.l + '/' + id + '.mp3'); this.aud.onerror = fb; if (cb) this.aud.onended = cb; this.aud.play().catch(fb); return;
    }
    this.tts(t, cb);
  }

  tts(t, cb) {
    if (!window.speechSynthesis) { this.say(this.u('novoicehere')); if (cb) cb(); return; }
    const vs = speechSynthesis.getVoices();
    if (vs.length && !vs.some(v => v.lang.toLowerCase().startsWith(this.l))) {
      this.say(this.u('novoicehere'));
      if (!this.noticed && vs.some(v => v.lang.toLowerCase().startsWith('en'))) {
        this.noticed = true; const n = new SpeechSynthesisUtterance(UI.novoicehere.en); n.lang = 'en-US'; n.onend = () => { if (cb) cb(); }; speechSynthesis.speak(n); } else if (cb) cb();
      return;
    }
    const u = new SpeechSynthesisUtterance(t); u.lang = this.sl(); if (cb) u.onend = cb; speechSynthesis.speak(u);
  }

  // True while the form is reading, listening, or in hands-free mode.
  active() { return !!(this.rm || this.vm || this.vrec || (window.speechSynthesis && speechSynthesis.speaking) || (this.aud && !this.aud.paused && !this.aud.ended)); }

  // Stop all speech and listening right now.
  halt() { this.tok++; if (window.speechSynthesis) speechSynthesis.cancel(); if (this.aud) this.aud.pause(); this.stopVoice(); }

  // The Stop reading aloud button: stop reading every page. Voice input, if on, carries on.
  stopRead() { this.rm = false; this.refresh('[data-rm]'); this.say(this.u('stopped')); }

  // The Escape key and the voice word "stop": stop reading and listening now, keep focus where it is.
  stopAll() {
    const ae = this.r.activeElement, d = ae && [...ae.attributes].find(x => x.name.startsWith('data-'));
    const sel = !ae ? null : ae.id ? '#' + ae.id : d ? '[' + d.name + (d.value ? "='" + d.value + "'" : '') + ']' : ae.name === 'f' ? "input[name=f][value='" + window.CSS.escape(ae.value) + "']" : null;
    this.rm = false; this.vm = false; this.refresh(sel === '[data-stoprm]' ? '[data-rm]' : sel, true); this.say(this.u('stoppedAll'));
  }

  // v: the person pressed "Start with voice input", which turns voice input on. Reading aloud is a separate choice.
  startForm(v) { this.stopRA(); this.vm = v; this.vno = false; this.welcome = false; this.moved = true; this.draw(); }

  // Move on. When the person came from the review page to change one answer, go straight back to the review.
  advance() { this.i = this.fromReview ? this.steps.length : this.i + 1; this.fromReview = false; this.rs = 0; }

  skipStep(s) { this.a[s.id] = s.type === 'checkbox' ? [] : ''; this.err = ''; this.moved = true; this.advance(); this.draw(); }

  edit(n) { this.fromReview = true; this.rs = 0; this.i = n; this.err = ''; this.moved = true; this.draw(); }

  restart() { this.steps.forEach(x => { if (!x.local) delete this.a[x.id]; }); this.i = 0; this.rs = 0; this.fromReview = false; this.err = ''; this.moved = true; this.draw(); }

  goBack(s) { this.keep(s); this.i--; this.rs = 0; this.fromReview = false; this.err = ''; this.moved = true; this.draw(); }

  // Stop the microphone. msg: what to announce, only if it was listening.
  stopVoice(msg) {
    const r = this.vrec; this.vrec = null;
    if (r) { r.onend = null; r.onerror = null; r.onresult = null; try { r.abort(); } catch (x) { /* ignore */ } }
    this.vui(false);
    if (r && msg) this.say(this.u(msg));
  }

  norm(t) { return String(t || '').toLowerCase().replace(/[.,!?፣።፤፦"'()\-]/g, ' ').replace(/\s+/g, ' ').trim(); }

  // Which options did the person say? By number ("2", "two", "ሁለት") or by name (best word match).
  pick(t, s) {
    const opts = s.options || [], w = t.split(' ').filter(Boolean), hit = [];
    w.forEach(x => {
      const n = /^\d+$/.test(x) ? +x : (NUM[x] || (w.length === 1 && NUM1[x]) || 0);
      if (n >= 1 && n <= opts.length && !hit.includes(n - 1)) hit.push(n - 1);
    });
    if (hit.length) return s.type === 'radio' ? hit.slice(0, 1) : hit;
    const sc = opts.map(([, lab]) => {
      const lw = this.norm(T(lab, this.l)).split(' ').filter(x => x.length > (/[\u1200-\u137f]/.test(x) ? 1 : 2) && !STOP.includes(x));
      return lw.length ? lw.filter(x => w.includes(x)).length / lw.length : 0;
    });
    const best = Math.max(0, ...sc);
    if (best <= 0) return [];
    const top = sc.map((v, n) => (v === best ? n : -1)).filter(n => n >= 0);
    if (s.type === 'radio') return top.length === 1 ? top : [];
    const many = sc.map((v, n) => (v >= 0.5 ? n : -1)).filter(n => n >= 0);
    return many.length ? many : top.length === 1 ? top : [];
  }

  // Start listening for the answer to this page, but only when the person has switched voice input on.
  listenAnswer() {
    if (!this.voiceOn() || this.done || this.welcome) return;
    const cur = this.steps[this.i];
    if (cur && cur.novoice) return;
    this.listen(true);
  }

  say2(m, id) { this.speak(m, id || null, () => this.listen(true)); this.say(m); }

  hasVoice() { const vs = window.speechSynthesis ? speechSynthesis.getVoices() : []; return vs.some(v => v.lang.toLowerCase().startsWith(this.l)); }

  // Read the current page. An error is read first, from its own recorded clip, so it is heard even without a device voice.
  readPage(s, cb) {
    // Recordings with voice instructions ("Say Next") are only played when voice input is on; otherwise the "...Read" version.
    const r = this.voiceOn() ? '' : 'Read';
    const id = this.done ? 'done' : this.welcome ? (this.ra < 2 ? 'raAsk' : 'welcome') : s ? s.id + r : this.rs ? 'reviewFix' + r : 'review';
    const ek = this.err && this.errKey && this.err === this.u(this.errKey) ? 'err' + this.errKey[0].toUpperCase() + this.errKey.slice(1) : null;
    const go = () => this.speak(this.pageText(s, !!ek), id, cb);
    if (ek) this.speak(this.err, ek, go); else go();
  }

  // Read only the error message (used when the person asked for voice help but is not in Read to me mode).
  readErr(cb) {
    const ek = this.errKey && this.err === this.u(this.errKey) ? 'err' + this.errKey[0].toUpperCase() + this.errKey.slice(1) : null;
    this.speak(this.err, ek, cb);
  }

  // Play several recorded clips one after another. If one is missing, read the whole message with the device voice instead.
  seq(ids, text, cb) {
    const base = this.getAttribute('audio'), k = ++this.tok;
    if (this.aud) this.aud.pause();
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (cb) { const c = cb; cb = () => { if (k === this.tok) c(); }; }
    if (!base) { this.tts(text, cb); return; }
    let n = 0, bad = false;
    const fail = () => { if (!bad && k === this.tok) { bad = true; this.tts(text, cb); } };
    const go = () => {
      if (k !== this.tok || bad) return;
      if (n >= ids.length) { if (cb) cb(); return; }
      const a = this.aud = new Audio(base + '/' + this.l + '/' + ids[n++] + '.mp3');
      a.onended = go; a.onerror = fail; a.play().catch(fail);
    };
    go();
  }

  // Act on what the person said.
  heard(raw) {
    this.vtries = 0;
    if (this.done) return;
    const s = this.steps[this.i], t = this.norm(raw), w = t ? t.split(' ') : [];
    const lim = s && s.type === 'text' ? 1 : 3;
    const is = c => w.length > 0 && w.length <= lim && w.some(x => CMD[c].includes(x));
    const again = () => this.readPage(s, () => this.listen(true));
    if (this.welcome) { if (is('start') || is('next')) this.startForm(false); else this.say2(this.u('sayWelcome'), 'sayWelcome'); return; }
    if (!s) {
      const rv = this.steps.map((x, n) => [x, n]).filter(([x]) => !x.local), yn = this.ans(raw);
      const num = w.map(x => (/^\d+$/.test(x) ? +x : NUM[x] || 0)).find(n => n >= 1 && n <= rv.length);
      if (w.some(x => CMD.restart.includes(x)) || (w.some(x => x === 'start' || x === 'ጀምር') && w.some(x => x === 'again' || x === 'እንደገና'))) return this.restart();
      if (is('stop')) return this.stopAll();
      if (num) return this.edit(rv[num - 1][1]);
      if (is('send') || (!this.rs && yn === 'y')) return this.send();
      if (!this.rs && yn === 'n') { this.rs = 1; this.moved = true; return this.draw(); }
      if (is('back')) return this.goBack(s);
      if (is('repeat')) return again(this.rs ? 'reviewFix' : 'review');
      return this.say2(this.u(this.rs ? 'reviewFix' : 'reviewAsk'), this.rs ? 'reviewFix' : 'reviewAsk');
    }
    if (is('stop')) return this.stopAll();
    if (is('repeat')) return again(s.id);
    if (is('back') && this.i) return this.goBack(s);
    if (is('skip') && s.optional) return this.skipStep(s);
    if (is('next')) return this.next(s);
    const e = this.r.querySelector('#err'); if (e) e.textContent = '';
    if (s.type === 'text') {
      this.r.querySelector('#f').value = String(raw).trim();
      return this.say2(this.u('heardNext', { x: String(raw).trim() }), this.hasVoice() ? null : 'heardGeneric');
    }
    const hit = this.pick(t, s);
    if (!hit.length) return this.say2(this.u('unclear'), 'unclear');
    const ins = [...this.r.querySelectorAll('input[name=f]')];
    if (s.type === 'radio') ins.forEach((el, n) => { el.checked = n === hit[0]; });
    else hit.forEach(n => { ins[n].checked = !ins[n].checked; });
    const sel = ins.map((el, n) => (el.checked ? T(s.options[n][1], this.l) : null)).filter(Boolean);
    const nums = ins.map((el, n) => (el.checked ? 'n' + (n + 1) : null)).filter(Boolean), m = sel.length ? this.u('chose', { x: sel.join(', ') }) : this.u('noneSel');
    this.say(m); this.seq(sel.length ? ['choseA', ...nums, 'choseB'] : ['noneSel'], m, () => this.listen(true));
  }

  // Listen for one answer. Only called after the person switched voice input on (Start with voice input, or Start voice input).
  listen(auto) {
    const R = HASV();
    if (!R) { this.say(this.u('novoice')); return; }
    this.stopVoice();
    this.tok++;
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (this.aud) this.aud.pause();
    const rec = new R(); rec.lang = this.sl(); rec.interimResults = false;
    this.vrec = rec;
    let got = false;
    this.vui(true); this.say(this.u('listening'));
    rec.onresult = e => { got = true; this.endRec(rec); this.heard(e.results[0][0].transcript); };
    rec.onerror = e => {
      if (e.error === 'no-speech') return;
      got = true; this.endRec(rec);
      // Permission denied, no microphone or no language: voice input stays off until the person presses Start voice input again.
      if (['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'].includes(e.error)) { this.vno = true; this.vm = false; }
      this.say(this.micMsg(e.error));
    };
    rec.onend = () => {
      if (this.vrec !== rec) return;
      this.endRec(rec);
      if (got) return;
      if (auto && ++this.vtries < 2) { this.listen(true); return; }
      if (auto) this.speak(this.u('idle'), 'idle');
      this.say(this.u(auto ? 'idle' : 'nospeech'));
    };
    try { rec.start(); } catch (x) { this.endRec(rec); this.say(this.u('micerr')); }
  }

  async send() {
    const out = {}; this.steps.filter(s => !s.local).forEach(s => { out[s.id] = this.a[s.id]; });
    try {
      const base = this.getAttribute('api');
      if (base) {
        const r = await fetch(base + this.f.path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) });
        if (!r.ok) throw new Error(r.status);
      }
      this.done = true; this.moved = true; this.err = '';
      this.dispatchEvent(new CustomEvent('db-complete', { detail: { answers: out }, bubbles: true, composed: true }));
    } catch (e) {
      this.err = this.u('fail'); this.errKey = 'fail';
      this.dispatchEvent(new CustomEvent('db-error', { bubbles: true, composed: true }));
    }
    this.draw();
  }
}
customElements.define('db-form', DbForm);