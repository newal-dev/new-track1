/* Inclusive Access plugin: one script, one tag.
   <script src='https://YOUR-HOST/widget.js'></script>      (widget.js and db-form.js are the same file)
   <db-onboarding api='https://YOUR-HOST/v1'></db-onboarding>         sign-up (onboarding)
   <db-career-gateway api='https://YOUR-HOST/v1'></db-career-gateway> job search and application
   <db-form flow='employer' api='https://YOUR-HOST/v1'></db-form>     any flow (the original tag)
   partner: name shown in the consent question.  sw: path of the partner's one-line service worker (offline).  asr: browser | off | a name registered with DbForm.registerASR().  fonts='no': do not load the local fonts.  jsonld='no': do not add schema.org/JobPosting to the page.
   flow: signup | job | employer.  lang: en | am | om | ti | so | sid (anything else falls back to en).  lang-ask='no': skip the first page that asks for the language (shown in English by default).  theme: auto | standard | dark | contrast | rg | by (the person's own choice in the Colours menu wins).  CSS hooks on <db-form>: --db-accent, --db-font.  hide: optional comma list of question ids to leave out, e.g. hide='idRoute,support' (fullName, role and job cannot be hidden).  audio: optional base URL of recorded .mp3 files (BASE/en|am|om|ti|so/QUESTIONID.mp3).  Events: db-complete, db-error.
   Amharic text was checked by a native Amharic speaker (15 Nov 2026).
   Afaan Oromoo (om), Tigrinya (ti), Somali (so) and Sidaamu Afoo (sid, see the SID block) text is a machine-assisted DRAFT: every line marked // VERIFY_NATIVE must be reviewed by a native speaker. */
// Everything below is block-scoped so its names (LANGS, UI, T, ...) never clash with the host page's own scripts.
{
// The script's own address: fonts and the service worker are loaded from the same server.
const SRC = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '';
const T = (x, l) => (x && x.en ? (x[l] || x.en) : x);

// ---- Ethiopian calendar: 12 months of 30 days + Pagumē (5 days, 6 in the year before a Gregorian leap year) ----
// Julian Day Number arithmetic (Beyene-Kudlek). Dates are handled in UTC so the time zone never shifts the day.
const EC_OFF = 1723856, J70 = 2440588;
const ecLeap = y => y % 4 === 3;
const ecDays = (y, m) => (m < 13 ? 30 : ecLeap(y) ? 6 : 5);
const toEC = (g = new Date()) => {
  const j = Math.floor(Date.UTC(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate()) / 864e5) + J70, r = (j - EC_OFF) % 1461, n = r % 365 + 365 * Math.floor(r / 1460);
  return { y: 4 * Math.floor((j - EC_OFF) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460), m: Math.floor(n / 30) + 1, d: n % 30 + 1 };
};
const fromEC = (y, m, d) => new Date((EC_OFF + 365 + 365 * (y - 1) + Math.floor(y / 4) + 30 * m + d - 31 - J70) * 864e5);
// Month names. om, ti and so: VERIFY_NATIVE. Somali speakers mostly use the Gregorian calendar, so the transliteration is shown.
const EC_MONTHS = {
  en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
  am: ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'],
  om: ['Fulbaana', 'Onkoloolessa', 'Sadaasa', 'Muddee', 'Amajjii', 'Guraandhala', 'Bitootessa', 'Eebila', 'Caamsaa', 'Waxabajjii', 'Adoolessa', 'Hagayya', 'Qaammee'],
  ti: ['መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታሕሳስ', 'ጥሪ', 'ለካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ', 'ሓምለ', 'ነሓሰ', 'ጳጉሜ'],
  so: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
  sid: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'], // VERIFY_NATIVE
};
const ecText = (e, l) => `${e.d ? e.d + ' ' : ''}${(EC_MONTHS[l] || EC_MONTHS.en)[e.m - 1]} ${e.y}`;
const isoOf = d => d.toISOString().slice(0, 10);

// ---- Speech recognition router: 'browser' (Web Speech API) by default; a partner can register a self-hosted recogniser. ----
// A factory gets (bcp47Lang, element) and returns an object with start(), abort() and onresult / onerror / onend, like SpeechRecognition.
const ASR = {
  // Several guesses per answer: a name like "አማርኛ" said into an English recogniser is rarely its first guess.
  browser: lang => { const R = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition); if (!R) return null; const r = new R(); r.lang = lang; r.interimResults = false; r.maxAlternatives = 5; return r; },
};
// Every guess the recogniser made for the first result, best first.
const alts = e => { const r = e && e.results && e.results[0]; if (!r) return []; const out = []; for (let k = 0; k < (r.length || 1); k++) if (r[k] && r[k].transcript) out.push(r[k].transcript); return out; };

// ---- Ge'ez to Latin letters. Only used when a device has no voice for Amharic or Tigrinya: a name or answer in Ge'ez is
// then spelled in Latin letters for an English voice (close enough for names), while the screen shows the real text.
const GZ = ['h', 'l', 'h', 'm', 's', 'r', 's', 'sh', 'q', 'qw', 'q', 'qw', 'b', 'v', 't', 'ch', 'h', 'hw', 'n', 'ny', '', 'k', 'kw', 'h', 'hw', 'w', '', 'z', 'zh', 'y', 'd', 'd', 'j', 'g', 'gw', 'ng', 't', 'ch', 'p', 'ts', 'ts', 'f', 'p'];
const GV = ['e', 'u', 'i', 'a', 'e', '', 'o', 'wa'];
const romanize = t => String(t || '').normalize('NFC').replace(/[፩-፱]/g, d => String(d.charCodeAt(0) - 0x1368)).replace(/[፡።፣፤፥፦፧፨]/g, ' ').split(/(\s+)/).map(w => {
  let out = '', first = true;
  for (const ch of w) {
    const c = ch.codePointAt(0) - 0x1200, row = c >> 3, v = c & 7;
    if (c < 0 || row >= GZ.length) { out += ch; first = false; continue; }
    const k = GZ[row], glottal = k === '';
    out += k + (glottal && (v === 0 || v === 3) ? 'a' : v === 5 ? (first ? 'i' : '') : GV[v]);
    first = false;
  }
  return out;
}).join('');
const GEEZ = /[ሀ-፿]/;
const o = (k, en, am, om, ti, so) => [k, { en, am, om, ti, so }];

// Supported languages. sr = speech recognition locale; tts = prefixes that match a device voice (2- and 3-letter codes).
// en = English name (shown under the native name on the language page).
// say = Latin-letter words that name the language: the English name, the language's own name, and what an English recogniser
// often writes when someone says the name in their own language ("Amarinya" -> "a marina"). Near misses also count (pickLang).
// gz = beginnings of Ge'ez words that name the language (what an Amharic recogniser writes for አማርኛ, ኦሮምኛ, ትግርኛ, ሶማልኛ, ሲዳምኛ ...).
const LANGS = [
  { id: 'en', name: 'English', en: 'English', sr: 'en-US', tts: ['en'], say: ['english', 'inglish', 'ingles', 'inglizii', 'ingliffa', 'englis'], gz: ['እንግሊ', 'ኢንግሊ', 'እንግሊዝ', 'ኢንግሊሽ'] },
  { id: 'am', name: 'አማርኛ', en: 'Amharic', sr: 'am-ET', tts: ['am'], say: ['amharic', 'amharik', 'amaric', 'amarik', 'amharigna', 'amarigna', 'amarinya', 'amarina', 'amarenya', 'amharinya', 'amarinia', 'amharinia', 'amarignya', 'amhara', 'amhari'], gz: ['አማር', 'አማሪ', 'አምሀር', 'አምሃር', 'አማራ'] },
  { id: 'om', name: 'Afaan Oromoo', en: 'Oromo', sr: 'om-ET', tts: ['om', 'orm'], say: ['oromo', 'oromoo', 'oromiffa', 'oromifa', 'oromigna', 'oromoffa', 'oromia', 'aroma', 'oroma', 'afaan', 'afan'], gz: ['ኦሮ', 'አፋን'] }, // VERIFY_NATIVE
  { id: 'ti', name: 'ትግርኛ', en: 'Tigrinya', sr: 'ti-ET', tts: ['ti', 'tir'], say: ['tigrinya', 'tigrigna', 'tigrinia', 'tigrina', 'tigrignya', 'tegrinya', 'tigray', 'tigrai', 'tigre', 'tigrayan'], gz: ['ትግር', 'ትግሬ', 'ትግራ', 'ትግሪ'] }, // VERIFY_NATIVE
  { id: 'so', name: 'Soomaali', en: 'Somali', sr: 'so-SO', tts: ['so', 'som'], say: ['somali', 'soomaali', 'somaali', 'somalia', 'somalian', 'somaliya', 'somalli', 'somaligna', 'somalinya'], gz: ['ሶማ', 'ሱማ', 'ሶማሌ'] }, // VERIFY_NATIVE
  { id: 'sid', name: 'Sidaamu Afoo', en: 'Sidama', sr: 'sid-ET', tts: ['sid'], say: ['sidama', 'sidamo', 'sidaama', 'sidaamu', 'sidamu', 'sidaamigna', 'sidamigna', 'sidaminya', 'sedama', 'afoo'], gz: ['ሲዳ', 'ሲዳማ', 'ሲዳም'] }, // VERIFY_NATIVE
];
// Edit distance, for near misses of a language name ("amharik", "somaly").
const lev = (a, b) => { const d = Array.from({ length: b.length + 1 }, (x, k) => k); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
// Spelling differences that do not matter when matching a spoken name: vowels, doubled letters, ph/f, gn/ny.
const fold = w => w.replace(/ph/g, 'f').replace(/gn|ny/g, 'n').replace(/[aeiouy]+/g, 'a').replace(/(.)\1+/g, '$1');
const LANG_RE = /^(en|am|om|ti|so|sid)$/;
// Language page: which recogniser listens after each language's invitation, and for how long (ms after the microphone
// is on). Amharic writes Ge'ez names (አማርኛ, ትግርኛ); Oromo and Sidama names are in Latin letters, which English catches.
const LANG_EAR = { en: ['en-US'], am: ['am-ET', 'en-US'], om: ['en-US'], ti: ['am-ET', 'en-US'], so: ['so-SO', 'en-US'], sid: ['en-US'] };
const LANG_WINDOW = 4000;
const LANG = id => LANGS.find(x => x.id === id) || LANGS[0];
// Keyboards differ: full-width digits and ＠ (phone keyboards, IMEs) and Arabic-Indic digits become plain 0-9 and @ before checking.
const ascii = v => String(v == null ? '' : v).normalize('NFKC').replace(/[٠-٩۰-۹]/g, d => String(d.charCodeAt(0) & 0xF));
// Buttons and the UI text they show; used to read a button aloud when it gets keyboard focus (clip b_<key>).
// Per-question keyboard hints. Names in any script: no spellcheck/autocorrect (it "fixes" Ge'ez and Oromo names into English words).
// Contact takes a phone number OR an email: inputmode='email' keeps the letters and shows @, and digits stay one tap away.
const INPUT_HINTS = {
  fullName: "autocomplete='name' autocapitalize='words' autocorrect='off' spellcheck='false'",
  contact: "autocomplete='email' autocapitalize='off' autocorrect='off' spellcheck='false' inputmode='email'",
  why: "autocomplete='off' autocapitalize='sentences' spellcheck='false'",
  job: "autocomplete='organization-title' autocapitalize='sentences' spellcheck='false'",
};
const NAV_KEYS = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
const QUIET_KEYS =['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'OS', 'CapsLock', 'Process', 'Unidentified', 'Dead', 'Compose'];
const BTN = { next: 'next', back: 'back', skip: 'skip', read: 'read', mic: 'speak', rm: 'readToMe', stoprm: 'stopRead', send: 'send', nochange: 'noChange', restart: 'restart', edit: 'change' };

const UI = {
  // Language page. It is always in English first (langH, langAsk, langNone); each language then invites its own speakers (langSelf).
  langH: { en: 'Which language would you like to use?' },
  // The English voice names only English: each other language is then invited by its own voice, in its own words (langSelf).
  langAsk: { en: 'Which language would you like to use? For English, say English, or press the English button.' },
  langNone: { en: 'We did not hear a language. Please press a language button.' },
  // Second try on the language page, said in Amharic before an Amharic recogniser listens (it knows the Ge'ez names best).
  langAgain: { en: 'Please say the name of your language again.', am: 'እባክዎ የቋንቋዎን ስም እንደገና ይናገሩ።' },
  // Keyboard help, shown on every page (for keyboard-only, deaf and hard-of-hearing users), in the chosen language.
  keysH: { en: 'Keyboard', am: 'የቁልፍ ሰሌዳ', om: 'Kiiboordii', ti: 'ኪቦርድ', so: 'Kiiboodhka' }, // VERIFY_NATIVE (om ti so)
  keyTab: { en: 'go down', am: 'ወደ ታች ለመሄድ', om: 'gara gadiitti deemuuf', ti: 'ናብ ታሕቲ ንምኻድ', so: 'hoos u dhaqaaq' }, // VERIFY_NATIVE (om ti so)
  keyShiftTab: { en: 'go up', am: 'ወደ ላይ ለመመለስ', om: 'gara oliitti deebi\'uuf', ti: 'ናብ ላዕሊ ንምምላስ', so: 'kor u dhaqaaq' }, // VERIFY_NATIVE (om ti so)
  keyEnter: { en: 'choose', am: 'ለመምረጥ', om: 'filachuuf', ti: 'ንምምራጽ', so: 'dooro' }, // VERIFY_NATIVE (om ti so)
  keyEsc: { en: 'stop the voice', am: 'ድምፁን ለማቆም', om: 'sagalee dhaabuuf', ti: 'ድምጺ ንምቁራጽ', so: 'jooji codka' }, // VERIFY_NATIVE (om ti so)
  keysSay: { en: 'On a keyboard: press Tab to go down, Shift and Tab to go up, Space or Enter to choose, and Escape to stop the voice.', am: 'በቁልፍ ሰሌዳ፦ ወደ ታች ለመሄድ Tab፣ ወደ ላይ ለመመለስ Shift እና Tab፣ ለመምረጥ Space ወይም Enter፣ ድምፁን ለማቆም Escape ይጫኑ።', om: "Kiiboordii irratti: gara gadiitti deemuuf Tab, gara oliitti deebi'uuf Shift fi Tab, filachuuf Space ykn Enter, sagalee dhaabuuf Escape tuqi.", ti: 'ብኪቦርድ፦ ናብ ታሕቲ ንምኻድ Tab፣ ናብ ላዕሊ ንምምላስ Shift ምስ Tab፣ ንምምራጽ Space ወይ Enter፣ ድምጺ ንምቁራጽ Escape ጠውቑ።', so: 'Kiiboodhka: riix Tab si aad hoos ugu dhaqaaqdo, Shift iyo Tab si aad kor ugu dhaqaaqdo, Space ama Enter si aad u doorato, iyo Escape si aad u joojiso codka.' }, // VERIFY_NATIVE (om ti so)
  // Review page: how to change one answer with the keyboard (shown and spoken).
  reviewKeys: { en: 'To change an answer with the keyboard, press Tab until you reach its Change button, then press Enter.', am: 'መልስ በቁልፍ ሰሌዳ ለመቀየር፣ የመልሱ «ቀይር» ቁልፍ ላይ እስኪደርሱ Tab ይጫኑ፤ ከዚያ Enter ይጫኑ።', om: 'Deebii kiiboordiin jijjiiruuf, hanga qabduu Jijjiiri isaa geessutti Tab tuqi, achiis Enter tuqi.', ti: 'መልሲ ብኪቦርድ ንምቕያር፣ ክሳብ «ቀይር» ዝብል መጠወቒኡ ትበጽሑ Tab ጠውቑ፣ ድሕሪኡ Enter ጠውቑ።', so: 'Si aad jawaab ugu beddesho kiiboodhka, riix Tab ilaa aad gaarto badhankeeda Beddel, kadibna riix Enter.' }, // VERIFY_NATIVE (om ti so)
  // Text size choice in the Display menu: the percentages themselves need no translation.
  voiceSpeed: { en: 'Voice speed', am: 'የድምፅ ፍጥነት', om: 'Saffisa sagalee', ti: 'ቅልጣፈ ድምጺ', so: 'Xawaaraha codka' }, // VERIFY_NATIVE (all but en)
  textSize: { en: 'Text size', am: 'የጽሑፍ መጠን', om: 'Guddina barreeffamaa', ti: 'ዓቐን ጽሑፍ', so: 'Cabbirka qoraalka' }, // VERIFY_NATIVE (om ti so)
  // Display menu (colours and text size). The larger-text choice uses the same words as the first question's choice.
  display: { en: 'Colours and text size', am: 'ቀለምና የጽሑፍ መጠን', om: 'Halluu fi guddina barreeffamaa', ti: 'ሕብርን ዓቐን ጽሑፍን', so: 'Midabka iyo cabbirka qoraalka' }, // VERIFY_NATIVE (om ti so)
  // Spoken read-back of an answer, in two recorded parts around the answer itself (so it works without a device voice).
  heardA: { en: 'We heard', am: 'የሰማነው', om: 'Kan dhageenye', ti: 'ዝሰማዕናዮ', so: 'Waxaan maqalnay' }, // VERIFY_NATIVE (om ti so)
  heardB: { en: 'Say Next to continue, or say your answer again.', am: 'ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።', om: 'Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.', ti: 'ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።', so: 'Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada.' }, // VERIFY_NATIVE (om ti so)
  // Review page by voice: support choices need their own Yes, separate from sending the answers.
  askSupport: { en: 'You chose some support. Do you also want to share your support choices with the organisers, so they can prepare help? Say Yes or No.', am: 'የእገዛ ምርጫ መርጠዋል። እገዛ እንዲያዘጋጁ የእገዛ ምርጫዎችዎን ለአዘጋጆቹም ማጋራት ይፈልጋሉ? «አዎ» ወይም «አይ» ይበሉ።', om: 'Deeggarsa filatteetta. Akka gargaarsa qopheessaniif filannoo deeggarsa kee qindeessitootaaf qooduu barbaaddaa? Eeyyee ykn Lakki jedhi.', ti: 'ደገፍ መሪጽኩም ኣለኹም። ሓገዝ ምእንቲ ከዳልዉ ምርጫታት ደገፍኩም ንኣወሃሃድቲ ከተካፍሉ ትደልዩ ዶ? «እወ» ወይ «ኣይፋል» በሉ።', so: 'Waxaad dooratay taageero. Ma rabtaa inaad sidoo kale la wadaagto doorashooyinkaaga taageerada qabanqaabiyayaasha, si ay caawimaad u diyaariyaan? Dheh Haa ama Maya.' }, // VERIFY_NATIVE (om ti so)
  colours: { en: 'Colours', am: 'ቀለሞች', om: "Halluuwwan", ti: "ሕብርታት", so: "Midabada" }, // VERIFY_NATIVE (om ti so)
  th_auto: { en: 'Same as my device', am: 'እንደ መሣሪያዬ', om: "Akkuma meeshaa koo", ti: "ከም መሳርሒየ", so: "Sida qalabkayga" }, // VERIFY_NATIVE (om ti so)
  th_standard: { en: 'Standard', am: 'መደበኛ', om: "Idilee", ti: "ልሙድ", so: "Caadi" }, // VERIFY_NATIVE (om ti so)
  th_dark: { en: 'Dark', am: 'ጨለማ', om: "Dukkana", ti: "ጸሊም", so: "Mugdi" }, // VERIFY_NATIVE (om ti so)
  th_contrast: { en: 'High contrast (black and white)', am: 'ከፍተኛ ንፅፅር (ጥቁርና ነጭ)', om: "Garaagarummaa olaanaa (gurraacha fi adii)", ti: "ልዑል ፍልልይ (ጸሊምን ጻዕዳን)", so: "Kala-duwanaan sare (madow iyo cad)" }, // VERIFY_NATIVE (om ti so)
  th_rg: { en: 'Blue and orange (for red-green colour blindness)', am: 'ሰማያዊና ብርቱካናማ (ቀይና አረንጓዴን ለማይለዩ)', om: "Cuquliisaa fi burtukaanii (warra diimaa fi magariisa adda hin baafneef)", ti: "ሰማያዊን ብርቱኳናውን (ቀይሕን ቀጠልያን ንዘይፈልዩ)", so: "Buluug iyo oranji (kuwa aan kala garan casaanka iyo cagaarka)" }, // VERIFY_NATIVE (om ti so)
  th_by: { en: 'Teal and red (for blue-yellow colour blindness)', am: 'ደማቅ አረንጓዴና ቀይ (ሰማያዊና ቢጫን ለማይለዩ)', om: "Magariisa cuquliisaa fi diimaa (warra cuquliisaa fi keelloo adda hin baafneef)", ti: "ሰማያዊ-ቀጠልያን ቀይሕን (ሰማያዊን ብጫን ንዘይፈልዩ)", so: "Cagaar-buluug iyo casaan (kuwa aan kala garan buluugga iyo jaallaha)" }, // VERIFY_NATIVE (om ti so)
  sending: { en: 'Sending…', am: 'በመላክ ላይ…', om: "Ergaa jira…", ti: "ይለኣኽ ኣሎ…", so: "Waa la dirayaa…" }, // VERIFY_NATIVE (om ti so)
  speakNow: { en: 'Speak now.', am: 'አሁን ይናገሩ።', om: "Amma dubbadhu.", ti: "ሕጂ ተዛረቡ።", so: "Hadda hadal." }, // VERIFY_NATIVE (om ti so)
  sel: { en: 'selected', am: 'ተመርጧል', om: "filatameera", ti: "ተመሪጹ", so: "waa la doortay" }, // VERIFY_NATIVE (om ti so)
  unsel: { en: 'not selected', am: 'አልተመረጠም', om: "hin filatamne", ti: "ኣይተመርጸን", so: "lama dooran" }, // VERIFY_NATIVE (om ti so)
  // Each language names itself in its own words, so its speakers can answer with the name they know.
  langSelf: { en: 'For English, say English, or press the English button.', am: 'ለአማርኛ «አማርኛ» ይበሉ፤ ወይም «አማርኛ» የሚለውን ቁልፍ ይጫኑ።', om: "Afaan Oromoo filachuuf 'Afaan Oromoo' jedhi, ykn qabduu Afaan Oromoo tuqi.", ti: "ንትግርኛ «ትግርኛ» በሉ፣ ወይ «ትግርኛ» ዝብል መጠወቒ ጠውቑ።", so: "Af Soomaali: dheh Soomaali, ama riix badhanka Soomaali." }, // VERIFY_NATIVE (om ti so)
  next: { en: 'Next', am: 'ቀጥል', om: "Itti fufi", ti: "ቀጽል", so: "Xiga" }, // VERIFY_NATIVE
  back: { en: 'Back', am: 'ተመለስ', om: "Duubatti", ti: "ተመለስ", so: "Dib u noqo" }, // VERIFY_NATIVE
  read: { en: 'Read aloud', am: 'አንብብልኝ', om: "Sagaleedhaan dubbisi", ti: "ኣንብበለይ", so: "Akhri" }, // VERIFY_NATIVE
  speak: { en: 'Speak', am: 'ተናገር', om: "Dubbadhu", ti: "ተዛረብ", so: "Hadal" }, // VERIFY_NATIVE
  send: { en: 'Yes, submit', am: 'አዎ፣ አስገባ', om: "Eeyyee, ergi", ti: "እወ፣ ኣረክብ", so: "Haa, gudbi" }, // VERIFY_NATIVE
  change: { en: 'Change', am: 'ቀይር', om: "Jijjiiri", ti: "ቀይር", so: "Beddel" }, // VERIFY_NATIVE
  review: { en: 'Check your answers', am: 'መልሶችዎን ያረጋግጡ', om: "Deebii kee mirkaneessi", ti: "መልስታትኩም ኣረጋግጹ", so: "Hubi jawaabahaaga" }, // VERIFY_NATIVE
  thanks: { en: 'Thank you. We received your answers.', am: 'እናመሰግናለን። መልሶችዎን ተቀብለናል።', om: "Galatoomi. Deebii kee argannee jirra.", ti: "የቐንየልና። መልስታትኩም ተቐቢልናዮ።", so: "Mahadsanid. Waan helnay jawaabahaaga." }, // VERIFY_NATIVE
  need: { en: 'Please answer this question, or press Back.', am: 'እባክዎ ይህን ጥያቄ ይመልሱ ወይም ተመለስ ይጫኑ።', om: "Maaloo gaaffii kana deebisi, ykn Duubatti tuqi.", ti: "በጃኹም ነዚ ሕቶ ምለሱ፣ ወይ «ተመለስ» ጠውቑ።", so: "Fadlan ka jawaab su'aashan, ama riix Dib u noqo." }, // VERIFY_NATIVE
  bad: { en: 'Please type a phone number with 10 digits, starting with zero, or an email address with an @ sign.', am: 'እባክዎ በዜሮ የሚጀምር ባለ አሥር አሃዝ ስልክ ቁጥር ይጻፉ፤ ወይም «@» ምልክት ያለው ኢሜይል አድራሻ ይጻፉ።', om: "Maaloo lakkoofsa bilbilaa dijiitii 10 qabu kan zeeroon jalqabu, ykn teessoo imeelii mallattoo @ qabu barreessi.", ti: "በጃኹም ብዜሮ ዚጅምር 10 ኣሃዝ ዘለዎ ቁጽሪ ስልኪ፣ ወይ «@» ምልክት ዘለዎ ኢመይል ጽሓፉ።", so: "Fadlan qor lambar taleefan oo 10 god ah oo ku bilaabmaya eber, ama cinwaan iimayl oo leh calaamadda @." }, // VERIFY_NATIVE
  skip: { en: 'Skip', am: 'ዝለል', om: "Irra darbi", ti: "ሕለፍ", so: "Ka bood" }, // VERIFY_NATIVE
  stopped: { en: 'Reading stopped. Press Read to me to start again.', am: 'ማንበብ ቆሟል። እንደገና ለመጀመር «አንብቡልኝ» ይጫኑ።', om: "Dubbisuun dhaabateera. Ammas jalqabuuf Naaf dubbisi tuqi.", ti: "ምንባብ ቆይሙ። ደጊምኩም ንምጅማር «ኣንብቡለይ» ጠውቑ።", so: "Akhrintii waa la joojiyay. Riix Ii akhri si aad dib ugu bilowdo." }, // VERIFY_NATIVE
  skipped: { en: '(skipped)', am: '(ተዘሏል)', om: "(darbameera)", ti: "(ተሓሊፉ)", so: "(waa laga booday)" }, // VERIFY_NATIVE
  of: { en: 'Question {n} of {t}', am: 'ጥያቄ {n} ከ {t}', om: "Gaaffii {n} kan {t} keessaa", ti: "ሕቶ {n} ካብ {t}", so: "Su'aasha {n} ee {t}" }, // VERIFY_NATIVE
  heard: { en: 'We heard: {x}. You can edit it.', am: 'የሰማነው፦ {x}። ማስተካከል ይችላሉ።', om: "Kan dhageenye: {x}. Sirreessuu dandeessa.", ti: "ዝሰማዕናዮ፦ {x}። ከተመሓይሹዎ ትኽእሉ ኢኹም።", so: "Waxaan maqalnay: {x}. Waad wax ka beddeli kartaa." }, // VERIFY_NATIVE
  novoice: { en: 'Voice input is not available here. Please type.', am: 'የድምፅ ግብዓት እዚህ አይገኝም። እባክዎ ይጻፉ።', om: "Sagaleedhaan galchuun asitti hin danda'amu. Maaloo barreessi.", ti: "ብድምጺ ምእታው ኣብዚ ኣይርከብን። በጃኹም ጽሓፉ።", so: "Codka halkan laguma isticmaali karo. Fadlan qor." }, // VERIFY_NATIVE
  novoicehere: { en: 'This device has no voice for this language. Please read the text, or try another device.', am: 'ይህ መሣሪያ ለዚህ ቋንቋ ድምፅ የለውም። እባክዎ ጽሑፉን ያንብቡ ወይም ሌላ መሣሪያ ይሞክሩ።', om: "Meeshaan kun afaan kanaaf sagalee hin qabu. Maaloo barreeffama dubbisi, ykn meeshaa biraa yaali.", ti: "እዚ መሳርሒ ነዚ ቋንቋ ድምጺ የብሉን። በጃኹም ጽሑፉ ኣንብቡ፣ ወይ ካልእ መሳርሒ ፈትኑ።", so: "Qalabkan cod uma laha luqaddan. Fadlan akhri qoraalka, ama isku day qalab kale." }, // VERIFY_NATIVE
  listening: { en: 'Listening. Please speak.', am: 'እያዳመጥን ነው። ይናገሩ።', om: "Dhaggeeffachaa jirra. Maaloo dubbadhu.", ti: "ንሰምዕ ኣለና። በጃኹም ተዛረቡ።", so: "Waan dhageysanaynaa. Fadlan hadal." }, // VERIFY_NATIVE
  micblocked: { en: 'The microphone is blocked. Allow it in the browser, or type.', am: 'ማይክሮፎን ታግዷል። በአሳሹ ውስጥ ፈቃድ ይስጡ ወይም ይጻፉ።', om: "Maaykiroofooniin cufameera. Barbaadduu keessatti hayyami, ykn barreessi.", ti: "ማይክሮፎን ተዓጽዩ ኣሎ። ኣብ መርበብ ፍቐዱ፣ ወይ ጽሓፉ።", so: "Makarafoonka waa la xannibay. U oggolow browserka, ama qor." }, // VERIFY_NATIVE
  nolang: { en: 'This browser cannot understand this language by voice. Please type.', am: 'ይህ አሳሽ ይህን ቋንቋ በድምፅ መረዳት አይችልም። እባክዎ ይጻፉ።', om: "Barbaadduun kun afaan kana sagaleedhaan hubachuu hin danda'u. Maaloo barreessi.", ti: "እዚ መርበብ ነዚ ቋንቋ ብድምጺ ክርዳእ ኣይክእልን። በጃኹም ጽሓፉ።", so: "Browserkan ma fahmi karo luqaddan cod ahaan. Fadlan qor." }, // VERIFY_NATIVE
  nospeech: { en: 'We did not hear anything. Try again, or type.', am: 'ምንም አልሰማንም። እንደገና ይሞክሩ ወይም ይጻፉ።', om: "Homaa hin dhageenye. Irra deebi'ii yaali, ykn barreessi.", ti: "ዋላ ሓንቲ ኣይሰማዕናን። ደጊምኩም ፈትኑ፣ ወይ ጽሓፉ።", so: "Waxba ma aanaan maqal. Mar kale isku day, ama qor." }, // VERIFY_NATIVE
  welcomeH: { en: 'Welcome!', am: 'እንኳን ደህና መጡ!', om: "Baga nagaan dhuftan!", ti: "እንቋዕ ብደሓን መጻእኩም!", so: "Soo dhawoow!" }, // VERIFY_NATIVE
  welcomeP: { en: 'A simpler way to register and find opportunities.', am: 'ለመመዝገብና ዕድሎችን ለማግኘት ቀለል ያለ መንገድ።', om: "Karaa salphaa itti galmooftanii carraa argattan.", ti: "ንምምዝጋብን ዕድላት ንምርካብን ቀሊል መንገዲ።", so: "Hab fudud oo aad isku diiwaangeliso oo aad fursado ku hesho." }, // VERIFY_NATIVE
  startVoice: { en: 'Start with voice', am: 'በድምፅ ጀምር', om: "Sagaleedhaan jalqabi", ti: "ብድምጺ ጀምር", so: "Ku bilow cod" }, // VERIFY_NATIVE
  typeInstead: { en: 'Type instead', am: 'በምትኩ ይጻፉ', om: "Kanaa mannaa barreessi", ti: "ኣብ ክንድኡ ጽሓፉ", so: "Qor beddelkeeda" }, // VERIFY_NATIVE
  start: { en: 'Start', am: 'ጀምር', om: "Jalqabi", ti: "ጀምር", so: "Bilow" }, // VERIFY_NATIVE
  intro: { en: 'Welcome. This form asks one question at a time. Use Tab to move between buttons and Enter to choose. Press Read aloud to hear a page.', am: 'እንኳን ደህና መጡ። ይህ ቅጽ አንድ ጥያቄ በአንድ ጊዜ ይጠይቃል። በአዝራሮች መካከል ለመንቀሳቀስ Tab ይጠቀሙ፤ ለመምረጥ Enter ይጫኑ። ገጽ ለመስማት «አንብብልኝ» ይጫኑ።', om: "Baga nagaan dhuftan. Unkaan kun yeroo tokkotti gaaffii tokko gaafata. Qabduuwwan gidduu socho'uuf Tab, filachuuf Enter fayyadami. Fuula dhaga'uuf Sagaleedhaan dubbisi tuqi.", ti: "እንቋዕ ብደሓን መጻእኩም። እዚ ቅጥዒ ሓደ ሕቶ ብሓደ ግዜ ይሓትት። ኣብ መንጎ መጠወቒታት ንምንቅሳቕ Tab፣ ንምምራጽ Enter ተጠቐሙ። ገጽ ንምስማዕ «ኣንብበለይ» ጠውቑ።", so: "Soo dhawoow. Foomkan wuxuu weydiinayaa hal su'aal markiiba. Isticmaal Tab si aad badhamada u dhex marto, iyo Enter si aad u doorato. Riix Akhri si aad bogga u maqasho." }, // VERIFY_NATIVE
  readToMe: { en: 'Read to me', am: 'አንብቡልኝ', om: "Naaf dubbisi", ti: "ኣንብቡለይ", so: "Ii akhri" }, // VERIFY_NATIVE
  stopRead: { en: 'Stop reading', am: 'ማንበብ አቁም', om: "Dubbisuu dhaabi", ti: "ምንባብ ኣቋርጽ", so: "Jooji akhrinta" }, // VERIFY_NATIVE
  reading: { en: 'Reading aloud...', am: 'እያነበብን ነው...', om: "Dubbisaa jira...", ti: "ይንበብ ኣሎ...", so: "Waa la akhrinayaa..." }, // VERIFY_NATIVE
  raAsk: { en: 'Would you like this page to be read aloud to you?', am: 'ይህ ገጽ እንዲነበብልዎ ይፈልጋሉ?', om: "Fuulli kun sagaleedhaan akka siif dubbifamu barbaaddaa?", ti: "እዚ ገጽ ክንበበልኩም ትደልዩ ዶ?", so: "Ma rabtaa in boggan laguu akhriyo?" }, // VERIFY_NATIVE
  raHint: { en: 'Please say Yes or No, or press a button.', am: '«አዎ» ወይም «አይ» ይበሉ፤ ወይም አንድ ቁልፍ ይጫኑ።', om: "Maaloo Eeyyee ykn Lakki jedhi, ykn qabduu tokko tuqi.", ti: "በጃኹም «እወ» ወይ «ኣይፋል» በሉ፣ ወይ ሓደ መጠወቒ ጠውቑ።", so: "Fadlan dheh Haa ama Maya, ama riix badhan." }, // VERIFY_NATIVE
  raPrivacy: { en: 'If you choose Yes, or press a Speak button later, your browser may send your voice to its provider to turn it into text. You can choose No and type instead.', am: '«አዎ» ከመረጡ ወይም በኋላ «ተናገር» ከተጫኑ አሳሽዎ ድምፅዎን ወደ ጽሑፍ ለመቀየር ወደ አቅራቢው ሊልክ ይችላል። «አይ» መርጠው በምትኩ መጻፍ ይችላሉ።', om: "Eeyyee yoo filatte, ykn booda qabduu Dubbadhu yoo tuqxe, barbaadduun kee sagalee kee gara barreeffamaatti jijjiiruuf dhiyeessaa isaatti erguu danda'a. Lakki filattee barreessuu dandeessa.", ti: "«እወ» እንተ መሪጽኩም፣ ወይ ደሓር «ተዛረብ» እንተ ጠዊቕኩም፣ መርበብኩም ድምጽኹም ናብ ጽሑፍ ንምቕያር ናብ ኣቕራቢኡ ክሰዶ ይኽእል። «ኣይፋል» መሪጽኩም ክትጽሕፉ ትኽእሉ ኢኹም።", so: "Haddii aad doorato Haa, ama aad hadhow riixdo badhanka Hadal, browserkaagu wuxuu codkaaga u diri karaa bixiyahiisa si uu qoraal ugu beddelo. Waxaad dooran kartaa Maya oo aad qori kartaa." }, // VERIFY_NATIVE
  raAgain: { en: 'We did not hear an answer, so we will take that as No. If you would like the page read aloud, please say Yes now, or press the Yes button.', am: 'መልስ አልሰማንም። እንደ «አይ» እንወስደዋለን። እንዲነበብልዎ ከፈለጉ አሁን «አዎ» ይበሉ ወይም «አዎ» የሚለውን ይጫኑ።', om: "Deebii hin dhageenye, kanaaf akka Lakkiitti fudhanna. Fuulli akka siif dubbifamu yoo barbaadde, amma Eeyyee jedhi, ykn qabduu Eeyyee tuqi.", ti: "መልሲ ኣይሰማዕናን፣ ስለዚ ከም «ኣይፋል» ንወስዶ። ገጹ ክንበበልኩም እንተ ደሊኹም፣ ሕጂ «እወ» በሉ፣ ወይ «እወ» ዝብል መጠወቒ ጠውቑ።", so: "Jawaab ma aanaan maqal, sidaa darteed waxaan u qaadanaynaa Maya. Haddii aad rabto in boggan laguu akhriyo, hadda dheh Haa, ama riix badhanka Haa." }, // VERIFY_NATIVE
  raYes: { en: 'Yes, read aloud', am: 'አዎ፣ ይነበብልኝ', om: "Eeyyee, naaf dubbisi", ti: "እወ፣ ኣንብቡለይ", so: "Haa, ii akhri" }, // VERIFY_NATIVE
  raNo: { en: 'No, thank you', am: 'አይ፣ አያስፈልግም', om: "Lakki, galatoomi", ti: "ኣይፋል፣ የቐንየለይ", so: "Maya, mahadsanid" }, // VERIFY_NATIVE
  raNone: { en: 'Continuing without reading aloud. You can press Read to me at any time.', am: 'ሳይነበብ እንቀጥላለን። «አንብቡልኝ» የሚለውን በማንኛውም ጊዜ መጫን ይችላሉ።', om: "Osoo hin dubbisin itti fufna. Yeroo kamiyyuu Naaf dubbisi tuquu dandeessa.", ti: "ብዘይ ምንባብ ንቕጽል። «ኣንብቡለይ» ኣብ ዝኾነ ግዜ ክትጠውቑ ትኽእሉ ኢኹም።", so: "Waan sii wadnaa annagoon akhrin. Waxaad riixi kartaa Ii akhri wakhti kasta." }, // VERIFY_NATIVE
  sayChoose: { en: 'Say the number or the name of your choice. Say Next to continue, Back to go back, or Read aloud to hear this again.', am: 'የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።', om: "Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.", ti: "ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።", so: "Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho." }, // VERIFY_NATIVE
  sayChoose1: { en: 'Say the number or the name of your choice. Say Next to continue, or Read aloud to hear this again.', am: 'የምርጫዎን ቁጥር ወይም ስም ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።', om: "Lakkoofsa ykn maqaa filannoo keetii jedhi. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.", ti: "ቁጽሪ ወይ ስም ምርጫኹም በሉ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።", so: "Dheh lambarka ama magaca doorashadaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho." }, // VERIFY_NATIVE
  saySkip: { en: 'Say Skip to skip this question.', am: 'ይህን ጥያቄ ለመዝለል «ዝለል» ይበሉ።', om: "Gaaffii kana irra darbuuf Irra darbi jedhi.", ti: "ነዚ ሕቶ ንምሕላፍ «ሕለፍ» በሉ።", so: "Dheh Ka bood si aad su'aashan uga boodo." }, // VERIFY_NATIVE
  sayText: { en: 'Speak your answer now. Say Next to continue, Back to go back, or Read aloud to hear this again.', am: 'መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ ለመመለስ «ተመለስ»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።', om: "Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, deebi'uuf Duubatti, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.", ti: "ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ንምምላስ «ተመለስ»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።", so: "Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, Dib u noqo si aad dib ugu noqoto, ama Akhri si aad mar kale u maqasho." }, // VERIFY_NATIVE
  sayText1: { en: 'Speak your answer now. Say Next to continue, or Read aloud to hear this again.', am: 'መልስዎን አሁን ይናገሩ። ለመቀጠል «ቀጥል»፣ እንደገና ለመስማት «አንብብልኝ» ይበሉ።', om: "Amma deebii kee dubbadhu. Itti fufuuf Itti fufi, ammas dhaga'uuf Sagaleedhaan dubbisi jedhi.", ti: "ሕጂ መልስኹም ተዛረቡ። ንምቕጻል «ቀጽል»፣ ደጊምኩም ንምስማዕ «ኣንብበለይ» በሉ።", so: "Hadda ku hadal jawaabtaada. Dheh Xiga si aad u sii socoto, ama Akhri si aad mar kale u maqasho." }, // VERIFY_NATIVE
  sayWelcome: { en: 'Say Start to begin.', am: 'ለመጀመር «ጀምር» ይበሉ።', om: "Jalqabuuf Jalqabi jedhi.", ti: "ንምጅማር «ጀምር» በሉ።", so: "Dheh Bilow si aad u bilowdo." }, // VERIFY_NATIVE
  sayReview: { en: 'Say Submit to send your answers, or Back to change them.', am: 'መልሶችዎን ለመላክ «አስገባ»፣ ለመቀየር «ተመለስ» ይበሉ።', om: "Deebii kee erguuf Ergi, jijjiiruuf Duubatti jedhi.", ti: "መልስታትኩም ንምርካብ «ኣረክብ»፣ ንምቕያር «ተመለስ» በሉ።", so: "Dheh Gudbi si aad jawaabahaaga u dirto, ama Dib u noqo si aad u beddesho." }, // VERIFY_NATIVE
  chose: { en: 'You chose: {x}. Say Next to continue, or choose again.', am: 'የመረጡት፦ {x}። ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።', om: "Kan filatte: {x}. Itti fufuuf Itti fufi jedhi, ykn ammas filadhu.", ti: "ዝመረጽኩምዎ፦ {x}። ንምቕጻል «ቀጽል» በሉ፣ ወይ ደጊምኩም ምረጹ።", so: "Waxaad dooratay: {x}. Dheh Xiga si aad u sii socoto, ama mar kale dooro." }, // VERIFY_NATIVE
  noneSel: { en: 'Nothing is chosen. Say a number or a name, or say Skip.', am: 'ምንም አልተመረጠም። ቁጥር ወይም ስም ይናገሩ፤ ወይም «ዝለል» ይበሉ።', om: "Homtuu hin filatamne. Lakkoofsa ykn maqaa jedhi, ykn Irra darbi jedhi.", ti: "ዋላ ሓደ ኣይተመርጸን። ቁጽሪ ወይ ስም በሉ፣ ወይ «ሕለፍ» በሉ።", so: "Waxba lama dooran. Dheh lambar ama magac, ama dheh Ka bood." }, // VERIFY_NATIVE
  unclear: { en: 'Sorry, I did not understand. Please say the number of your choice.', am: 'ይቅርታ፣ አልገባኝም። እባክዎ የምርጫዎን ቁጥር ይናገሩ።', om: "Dhiifama, hin hubanne. Maaloo lakkoofsa filannoo keetii jedhi.", ti: "ይቕሬታ፣ ኣይተረዳእኩን። በጃኹም ቁጽሪ ምርጫኹም በሉ።", so: "Waan ka xumahay, ma fahmin. Fadlan dheh lambarka doorashadaada." }, // VERIFY_NATIVE
  heardNext: { en: 'We heard: {x}. Say Next to continue, or say your answer again.', am: 'የሰማነው፦ {x}። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።', om: "Kan dhageenye: {x}. Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.", ti: "ዝሰማዕናዮ፦ {x}። ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።", so: "Waxaan maqalnay: {x}. Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada." }, // VERIFY_NATIVE
  idle: { en: 'We did not hear you. Press the big Speak button, or press Stop reading to use the keyboard.', am: 'አልሰማንዎትም። ትልቁን «ተናገር» ቁልፍ ይጫኑ፤ ወይም ኪቦርድ ለመጠቀም «ማንበብ አቁም» ይጫኑ።', om: "Si hin dhageenye. Qabduu guddaa Dubbadhu tuqi, ykn kiiboordii fayyadamuuf Dubbisuu dhaabi tuqi.", ti: "ኣይሰማዕናኩምን። ነቲ ዓቢ «ተዛረብ» መጠወቒ ጠውቑ፣ ወይ ኪቦርድ ንምጥቃም «ምንባብ ኣቋርጽ» ጠውቑ።", so: "Ma aanaan ku maqal. Riix badhanka weyn ee Hadal, ama riix Jooji akhrinta si aad u isticmaasho kiiboodhka." }, // VERIFY_NATIVE
  sayType: { en: 'Please type your answer in the box. Then press Enter, or press the Next button.', am: 'እባክዎ መልስዎን በሳጥኑ ውስጥ ይጻፉ። ከዚያ Enter ወይም «ቀጥል» የሚለውን ቁልፍ ይጫኑ።', om: "Maaloo deebii kee saanduqa keessatti barreessi. Achiis Enter ykn qabduu Itti fufi tuqi.", ti: "በጃኹም መልስኹም ኣብቲ ሳንዱቕ ጽሓፉ። ድሕሪኡ Enter ወይ «ቀጽል» ዝብል መጠወቒ ጠውቑ።", so: "Fadlan ku qor jawaabtaada sanduuqa. Kadib riix Enter, ama riix badhanka Xiga." }, // VERIFY_NATIVE
  reviewAsk: { en: 'Do you want to submit your answers? Say Yes to submit, or No to change something.', am: 'መልሶችዎን ማስገባት ይፈልጋሉ? ለማስገባት «አዎ»፣ አንድ ነገር ለመቀየር «አይ» ይበሉ።', om: "Deebii kee erguu barbaaddaa? Erguuf Eeyyee, waa jijjiiruuf Lakki jedhi.", ti: "መልስታትኩም ከተረክቡ ትደልዩ ዶ? ንምርካብ «እወ»፣ ገለ ነገር ንምቕያር «ኣይፋል» በሉ።", so: "Ma rabtaa inaad gudbiso jawaabahaaga? Dheh Haa si aad u gudbiso, ama Maya si aad wax u beddesho." }, // VERIFY_NATIVE
  reviewFix: { en: 'Say Start again to go back to the first question, or say the number of the question you want to change.', am: 'ወደ መጀመሪያው ጥያቄ ለመመለስ «እንደገና ጀምር» ይበሉ፤ ወይም መቀየር የሚፈልጉትን ጥያቄ ቁጥር ይናገሩ።', om: "Gara gaaffii jalqabaatti deebi'uuf Irra deebi'ii jalqabi jedhi, ykn lakkoofsa gaaffii jijjiiruu barbaaddu jedhi.", ti: "ናብ ቀዳማይ ሕቶ ንምምላስ «ደጊምካ ጀምር» በሉ፣ ወይ ቁጽሪ ክትቕይርዎ እትደልዩ ሕቶ በሉ።", so: "Dheh Dib u bilow si aad ugu noqoto su'aasha koowaad, ama dheh lambarka su'aasha aad rabto inaad beddesho." }, // VERIFY_NATIVE
  noChange: { en: 'No, change something', am: 'አይ፣ አንድ ነገር ልቀይር', om: "Lakki, waan tokko jijjiira", ti: "ኣይፋል፣ ገለ ክቕይር", so: "Maya, wax baan beddelayaa" }, // VERIFY_NATIVE
  restart: { en: 'Start again', am: 'እንደገና ጀምር', om: "Irra deebi'ii jalqabi", ti: "ደጊምካ ጀምር", so: "Dib u bilow" }, // VERIFY_NATIVE
  choseA: { en: 'You chose', am: 'የመረጡት', om: "Kan filatte", ti: "ዝመረጽኩምዎ", so: "Waxaad dooratay" }, // VERIFY_NATIVE
  // Thank-you page with a host "continue" address. The first part of choseB, word for word; its clips are cut from choseB's.
  doneNext: { en: 'Say Next to continue.', am: 'ለመቀጠል «ቀጥል» ይበሉ።', om: "Itti fufuuf Itti fufi jedhi.", ti: "ንምቕጻል «ቀጽል» በሉ።", so: "Dheh Xiga si aad u sii socoto." }, // VERIFY_NATIVE (all but en, am)
  choseB: { en: 'Say Next to continue, or choose again.', am: 'ለመቀጠል «ቀጥል» ይበሉ ወይም እንደገና ይምረጡ።', om: "Itti fufuuf Itti fufi jedhi, ykn ammas filadhu.", ti: "ንምቕጻል «ቀጽል» በሉ፣ ወይ ደጊምኩም ምረጹ።", so: "Dheh Xiga si aad u sii socoto, ama mar kale dooro." }, // VERIFY_NATIVE
  heardGeneric: { en: 'We heard your answer. It is shown on the screen. Say Next to continue, or say your answer again.', am: 'መልስዎን ሰምተናል። በማያ ገጹ ላይ ይታያል። ለመቀጠል «ቀጥል» ይበሉ ወይም መልስዎን እንደገና ይናገሩ።', om: "Deebii kee dhageenyeerra. Iskiriinii irratti mul'ata. Itti fufuuf Itti fufi jedhi, ykn deebii kee ammas jedhi.", ti: "መልስኹም ሰሚዕና። ኣብ ስክሪን ይርአ ኣሎ። ንምቕጻል «ቀጽል» በሉ፣ ወይ መልስኹም ደጊምኩም በሉ።", so: "Waan maqalnay jawaabtaada. Waxay ka muuqataa shaashadda. Dheh Xiga si aad u sii socoto, ama mar kale dheh jawaabtaada." }, // VERIFY_NATIVE
  fail: { en: 'We could not send your answers. Nothing is lost. Please try again.', am: 'መልሶችዎን መላክ አልቻልንም። ምንም አልጠፋም። እባክዎ እንደገና ይሞክሩ።', om: "Deebii kee erguu hin dandeenye. Homtuu hin badne. Maaloo irra deebi'ii yaali.", ti: "መልስታትኩም ክንሰድድ ኣይከኣልናን። ዋላ ሓንቲ ኣይጠፍአን። በጃኹም ደጊምኩም ፈትኑ።", so: "Ma aanaan diri karin jawaabahaaga. Waxba ma lumin. Fadlan mar kale isku day." }, // VERIFY_NATIVE
  // Consent: nothing leaves the device until the person agrees. Support choices need their own, separate agreement.
  consentH: { en: 'Your agreement', am: 'የእርስዎ ፈቃድ', om: "Hayyama kee", ti: "ፍቓድኩም", so: "Oggolaanshahaaga" }, // VERIFY_NATIVE
  consentSend: { en: 'I agree to send these answers to {p}.', am: 'እነዚህን መልሶች ለ{p} ለመላክ እስማማለሁ።', om: "Deebii kana gara {p} erguuf nan walii gala.", ti: "ነዚ መልስታት ናብ {p} ክለኣኽ እሰማማዕ።", so: "Waan ku raacsanahay in jawaabahan loo diro {p}." }, // VERIFY_NATIVE
  consentSupport: { en: 'Also share my support choices with the organisers, so they can prepare help. If you leave this empty, your support choices are not sent.', am: 'የእገዛ ምርጫዎቼንም እገዛ እንዲያዘጋጁ ለአዘጋጆቹ አጋራ። ይህን ባዶ ከተዉት የእገዛ ምርጫዎችዎ አይላኩም።', om: "Filannoo deeggarsa koos qindeessitootaaf qoodi, akka gargaarsa qopheessaniif. Kana duwwaa yoo dhiifte, filannoon deeggarsa kee hin ergamu.", ti: "ምርጫታት ደገፈይ እውን ንኣወሃሃድቲ ኣካፍል፣ ሓገዝ ምእንቲ ከዳልዉ። እዚ ባዶ እንተ ገዲፍኩምዎ ምርጫታት ደገፍኩም ኣይለኣኽን።", so: "Sidoo kale la wadaag doorashooyinka taageerada qabanqaabiyayaasha, si ay caawimaad u diyaariyaan. Haddii aad tan banaan ka tagto, doorashooyinkaaga taageerada lama diro." }, // VERIFY_NATIVE
  consentNote: { en: 'Nothing is sent until you agree. After sending, you get a receipt code to ask for your answers to be deleted.', am: 'እስኪስማሙ ድረስ ምንም አይላክም። ከላኩ በኋላ መልሶችዎ እንዲሰረዙ ለመጠየቅ የደረሰኝ ኮድ ያገኛሉ።', om: "Hanga ati walii galtutti homtuu hin ergamu. Erga ergitee booda, deebiin kee akka haqamu gaafachuuf koodii ragaa ni argatta.", ti: "ክሳብ እትሰማምዑ ዋላ ሓንቲ ኣይለኣኽን። ድሕሪ ምልኣኽ፣ መልስታትኩም ክድምሰሱ ንምሕታት ኮድ ቅብሊት ትረኽቡ።", so: "Waxba lama diro ilaa aad oggolaato. Kadib markaad dirto, waxaad heli doontaa koodh rasiid ah si aad u codsato in jawaabahaaga la tirtiro." }, // VERIFY_NATIVE
  consentNeed: { en: 'Please tick the box to agree before sending, or press Back.', am: 'ከመላክዎ በፊት ለመስማማት ሳጥኑን ምልክት ያድርጉ፤ ወይም ተመለስ ይጫኑ።', om: "Maaloo osoo hin ergin dura walii galuuf saanduqa mallattoo godhi, ykn Duubatti tuqi.", ti: "በጃኹም ቅድሚ ምልኣኽ ንምስምማዕ ነቲ ሳንዱቕ ምልክት ግበሩ፣ ወይ «ተመለስ» ጠውቑ።", so: "Fadlan calaamadee sanduuqa si aad u oggolaato ka hor intaadan dirin, ama riix Dib u noqo." }, // VERIFY_NATIVE
  org: { en: 'the organisers of this website', am: 'የዚህ ድረ-ገጽ አዘጋጆች', om: "qindeessitoota marsariitii kanaa", ti: "ኣወሃሃድቲ እዚ መርበብ", so: "qabanqaabiyayaasha boggan" }, // VERIFY_NATIVE
  receipt: { en: 'Your receipt code is {r}. Keep it if you may want your answers deleted later.', am: 'የደረሰኝ ኮድዎ {r} ነው። መልሶችዎ በኋላ እንዲሰረዙ ሊፈልጉ ከቻሉ ይያዙት።', om: "Koodiin ragaa kee {r} dha. Booda deebiin kee akka haqamu barbaaduu yoo dandeesse qabadhu.", ti: "ኮድ ቅብሊትኩም {r} እዩ። ደሓር መልስታትኩም ክድምሰሱ ክትደልዩ እንተ ኽኢልኩም ሓዝዎ።", so: "Koodhkaaga rasiidka waa {r}. Hayso haddii aad hadhow rabto in jawaabahaaga la tirtiro." }, // VERIFY_NATIVE
  // The learner's own record (thank-you page and the "My answers" page): download it, or delete it with the receipt code.
  // Added 19 Nov from the organisers' feedback. All languages, Amharic too, are drafts: VERIFY_NATIVE.
  doneSay: { en: 'Say Download to keep a copy of your answers, or Delete to delete them.', am: 'የመልሶችዎን ቅጂ ለማስቀመጥ «አውርድ»፣ ለመሰረዝ «ሰርዝ» ይበሉ።', om: 'Garagalcha deebii keetii qabachuuf Buusi jedhi, haquuf Haqi jedhi.', ti: 'ቅዳሕ መልስታትኩም ንምሓዝ «ኣውርድ»፣ ንምድምሳስ «ደምስስ» በሉ።', so: 'Dheh Soo deji si aad u hesho nuqul jawaabahaaga, ama Tirtir si aad u tirtirto.' },
  mySay: { en: 'Say Yes to delete, or No to keep them.', am: 'ለመሰረዝ «አዎ»፣ ለማቆየት «አይ» ይበሉ።', om: 'Haquuf Eeyyee, tursiisuuf Lakki jedhi.', ti: 'ንምድምሳስ «እወ»፣ ንምዕቃብ «ኣይፋል» በሉ።', so: 'Dheh Haa si aad u tirtirto, ama Maya si aad u hayso.' },
  myDownloaded: { en: 'A copy of your answers was downloaded.', am: 'የመልሶችዎ ቅጂ ወርዷል።', om: 'Garagalchi deebii keetii buufameera.', ti: 'ቅዳሕ መልስታትኩም ወሪዱ።', so: 'Nuqul jawaabahaaga waa la soo dejiyay.' },
  myDownload: { en: 'Download my answers', am: 'መልሶቼን አውርድ', om: 'Deebii koo buusi', ti: 'መልስታተይ ኣውርድ', so: 'Soo dejiso jawaabahayga' },
  myDelete: { en: 'Delete my answers', am: 'መልሶቼን ሰርዝ', om: 'Deebii koo haqi', ti: 'መልስታተይ ደምስስ', so: 'Tirtir jawaabahayga' },
  mySure: { en: 'Delete all your answers? This cannot be undone. Your support choices are deleted too.', am: 'ሁሉንም መልሶችዎን መሰረዝ ይፈልጋሉ? ይህ ሊመለስ አይችልም። የእገዛ ምርጫዎችዎም ይሰረዛሉ።', om: "Deebii kee hunda haquu barbaaddaa? Kun deebi'uu hin danda'u. Filannoon deeggarsa kees ni haqama.", ti: 'ኩሉ መልስታትኩም ክትድምስሱ ትደልዩ ዶ? እዚ ክምለስ ኣይክእልን። ምርጫታት ደገፍኩም እውን ይድምሰሱ።', so: 'Ma rabtaa inaad tirtirto dhammaan jawaabahaaga? Tan dib looma celin karo. Doorashooyinkaaga taageerada sidoo kale waa la tirtirayaa.' },
  myYes: { en: 'Yes, delete them', am: 'አዎ፣ ሰርዛቸው', om: 'Eeyyee, haqi', ti: 'እወ፣ ደምስሶም', so: 'Haa, tirtir' },
  myNo: { en: 'No, keep them', am: 'አይ፣ ይቆዩ', om: 'Lakki, haa turan', ti: 'ኣይፋል፣ ይጽንሑ', so: 'Maya, ha joogaan' },
  myDeleted: { en: 'Your answers have been deleted.', am: 'መልሶችዎ ተሰርዘዋል።', om: 'Deebiin kee haqameera.', ti: 'መልስታትኩም ተደምሲሶም።', so: 'Jawaabahaaga waa la tirtiray.' },
  myFail: { en: 'We could not do that. Please try again.', am: 'ይህን ማድረግ አልቻልንም። እባክዎ እንደገና ይሞክሩ።', om: "Kana gochuu hin dandeenye. Maaloo irra deebi'ii yaali.", ti: 'ነዚ ክንገብሮ ኣይከኣልናን። በጃኹም ደጊምኩም ፈትኑ።', so: 'Ma aanaan samayn karin. Fadlan mar kale isku day.' },
  myH: { en: 'Your answers', am: 'መልሶችዎ', om: 'Deebii kee', ti: 'መልስታትኩም', so: 'Jawaabahaaga' },
  myCode: { en: 'Your receipt code', am: 'የደረሰኝ ኮድዎ', om: 'Koodii ragaa kee', ti: 'ኮድ ቅብሊትኩም', so: 'Koodhka rasiidkaaga' },
  myHint: { en: 'It is on the thank-you page you saw after sending: 24 letters and numbers.', am: 'ከላኩ በኋላ ባዩት የምስጋና ገጽ ላይ ያለው፣ 24 ፊደላትና ቁጥሮች ያሉት ኮድ ነው።', om: 'Fuula galataa erga ergitee booda argite irratti argama: qubeewwanii fi lakkoofsota 24.', ti: 'ድሕሪ ምልኣኽ ኣብ ዝረኣኹምዎ ገጽ ምስጋና ዘሎ፣ 24 ፊደላትን ቁጽርታትን ዘለዎ ኮድ እዩ።', so: 'Waa koodhka 24 xaraf iyo lambar ah ee ku qoran bogga mahadnaqa ee aad aragtay kadib markaad dirtay.' },
  myShow: { en: 'Show my answers', am: 'መልሶቼን አሳይ', om: 'Deebii koo agarsiisi', ti: 'መልስታተይ ኣርእይ', so: 'I tus jawaabahayga' },
  myNotFound: { en: 'No answers were found with this code. Check the code and try again.', am: 'በዚህ ኮድ ምንም መልስ አልተገኘም። ኮዱን አረጋግጠው እንደገና ይሞክሩ።', om: 'Koodii kanaan deebiin hin argamne. Koodii mirkaneessii irra deebi\'ii yaali.', ti: 'ብዚ ኮድ ዝተረኽበ መልሲ የለን። ኮዱ ኣረጋግጹ ደጊምኩም ፈትኑ።', so: 'Jawaab looma helin koodhkan. Hubi koodhka oo mar kale isku day.' },
  // Drafts and offline: answers are kept on this device and sent when the connection comes back.
  draftH: { en: 'Welcome back', am: 'እንኳን ደህና ተመለሱ', om: "Baga nagaan deebitan", ti: "እንቋዕ ብደሓን ተመለስኩም", so: "Ku soo dhawoow mar kale" }, // VERIFY_NATIVE
  draftP: { en: 'Your answers from last time are kept on this device.', am: 'ካለፈው ጊዜ መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል።', om: "Deebiin kee yeroo darbe meeshaa kana irratti kuufameera.", ti: "መልስታትኩም ካብ ዝሓለፈ ግዜ ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ።", so: "Jawaabahaagii hore waxay ku kaydsan yihiin qalabkan." }, // VERIFY_NATIVE
  draftGo: { en: 'Continue where I stopped', am: 'ካቆምኩበት ቀጥል', om: "Iddoon dhaabe irraa itti fufi", ti: "ካብ ዝኣቋረጽኩዎ ቀጽል", so: "Ka sii wad halkii aan ku joogsaday" }, // VERIFY_NATIVE
  queued: { en: 'You are offline. Your answers are saved on this device and will be sent when you are back online.', am: 'ከመስመር ውጭ ነዎት። መልሶችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል፤ መስመር ላይ ሲመለሱ ይላካሉ።', om: "Ati toora ala jirta. Deebiin kee meeshaa kana irratti kuufameera, yeroo toora irratti deebitu ni ergama.", ti: "ካብ መስመር ወጻኢ ኢኹም። መልስታትኩም ኣብዚ መሳርሒ ተዓቂቦም ኣለዉ፣ ናብ መስመር ምስ ተመለስኩም ክለኣኹ እዮም።", so: "Khadka kama jirtid. Jawaabahaaga waxay ku kaydsan yihiin qalabkan, waxaana la diri doonaa markaad khadka ku soo noqoto." }, // VERIFY_NATIVE
  sentLater: { en: 'Your saved answers have now been sent.', am: 'የተቀመጡት መልሶችዎ አሁን ተልከዋል።', om: "Deebiin kee kuufame amma ergameera.", ti: "እቶም ዝተዓቀቡ መልስታትኩም ሕጂ ተላኢኾም።", so: "Jawaabahaagii kaydsanaa hadda waa la diray." }, // VERIFY_NATIVE
  tapToHear: { en: 'Press any key or tap the screen to hear the questions.', am: 'ጥያቄዎቹን ለመስማት ማንኛውንም ቁልፍ ይጫኑ ወይም ማያውን ይንኩ።', om: "Gaaffilee dhaga'uuf qabduu kamiyyuu tuqi ykn iskiriinii tuqi.", ti: "ሕቶታት ንምስማዕ ዝኾነ መጠወቒ ጠውቑ ወይ ስክሪን ተንክፉ።", so: "Riix fure kasta ama taabo shaashadda si aad u maqasho su'aalaha." }, // VERIFY_NATIVE
  // Ethiopian calendar
  today: { en: 'Today is {e} in the Ethiopian calendar ({g}).', am: 'ዛሬ በኢትዮጵያ አቆጣጠር {e} ነው ({g})።', om: "Har'a akka lakkoofsa Itoophiyaatti {e} ({g}).", ti: "ሎሚ ብኣቆጻጽራ ኢትዮጵያ {e} እዩ ({g})።", so: "Maanta waa {e} sida kalandarka Itoobiya ({g})." }, // VERIFY_NATIVE
  day: { en: 'Day', am: 'ቀን', om: "Guyyaa", ti: "መዓልቲ", so: "Maalin" }, // VERIFY_NATIVE
  month: { en: 'Month', am: 'ወር', om: "Ji'a", ti: "ወርሒ", so: "Bil" }, // VERIFY_NATIVE
  year: { en: 'Year (Ethiopian)', am: 'ዓመት (ዓ.ም.)', om: "Bara (Itoophiyaa)", ti: "ዓመት (ዓ.ም.)", so: "Sanad (Itoobiya)" }, // VERIFY_NATIVE
  notSure: { en: 'Not sure', am: 'እርግጠኛ አይደለሁም', om: "Hin beeku", ti: "ርግጸኛ ኣይኮንኩን", so: "Ma hubo" }, // VERIFY_NATIVE
  about: { en: 'about', am: 'በግምት', om: "tilmaamaan", ti: "ብግምት", so: "qiyaas ahaan" }, // VERIFY_NATIVE
  dateBad: { en: 'Please choose a month, or set day and year to Not sure to skip the date.', am: 'እባክዎ ወር ይምረጡ፤ ወይም ቀኑን ለመዝለል ቀንና ዓመትን «እርግጠኛ አይደለሁም» ያድርጉ።', om: "Maaloo ji'a filadhu, ykn guyyaa fi bara 'Hin beeku' godhi.", ti: "በጃኹም ወርሒ ምረጹ፣ ወይ መዓልትን ዓመትን «ርግጸኛ ኣይኮንኩን» ግበሩ።", so: "Fadlan dooro bil, ama maalinta iyo sanadka ka dhig 'Ma hubo'." }, // VERIFY_NATIVE
  noMatch: { en: 'No job offers everything you chose, so all jobs are shown.', am: 'የመረጡትን ሁሉ የሚያቀርብ ሥራ የለም፤ ስለዚህ ሁሉም ሥራዎች ይታያሉ።', om: "Hojiin waan filatte hunda dhiyeessu hin jiru, kanaaf hojiiwwan hundi ni mul'atu.", ti: "ዝመረጽኩምዎ ኩሉ ዘቕርብ ስራሕ የለን፣ ስለዚ ኩሎም ስራሓት ይርኣዩ።", so: "Ma jirto shaqo bixisa waxa aad dooratay oo dhan, sidaa darteed dhammaan shaqooyinka waa la soo bandhigay." }, // VERIFY_NATIVE
};

const WORK = [
  o('stepfree', 'Step-free workplace', 'ከደረጃ ነፃ የሥራ ቦታ', "Bakka hojii gulantaa hin qabne", "ብዘይ መሳልል ዝኣቶ ቦታ ስራሕ", "Goob shaqo oo aan jaranjaro lahayn"), // VERIFY_NATIVE
  o('reader', 'Screen-reader friendly tools', 'ለስክሪን ሪደር ተስማሚ መሣሪያዎች', "Meeshaalee dubbisaa iskiriinii waliin hojjetan", "ምስ ስክሪን ሪደር ዝሰማምዑ መሳርሒታት", "Qalab ku habboon akhriyaha shaashadda"), // VERIFY_NATIVE
  o('interp', 'Sign language interpreter', 'የምልክት ቋንቋ አስተርጓሚ', "Hiikaa afaan mallattoo", "ተርጓሚ ቋንቋ ምልክት", "Turjubaan luqadda calaamadaha"), // VERIFY_NATIVE
  o('hours', 'Flexible hours', 'ተለዋዋጭ የሥራ ሰዓት', "Sa'aatii hojii jijjiiramaa", "ተዓጻጻፊ ሰዓታት ስራሕ", "Saacado dabacsan"), // VERIFY_NATIVE
  o('remote', 'Work from home', 'ከቤት መሥራት', "Mana irraa hojjechuu", "ካብ ገዛ ምስራሕ", "Ka shaqeyn guriga"), // VERIFY_NATIVE
];

const FLOWS = {
  signup: { path: '/learners', steps: [
    { id: 'prefs', local: true,
      q: { en: 'How would you like to use this form?', am: 'ይህን ቅጽ እንዴት መጠቀም ይፈልጋሉ?', om: "Unka kana akkamitti fayyadamuu barbaadda?", ti: "ነዚ ቅጥዒ ብኸመይ ክትጥቀሙሉ ትደልዩ?", so: "Sidee baad u rabtaa inaad u isticmaasho foomkan?" }, // VERIFY_NATIVE
      hint: { en: 'Optional. You can skip this.', am: 'አማራጭ ነው። መዝለል ይችላሉ።', om: "Dirqama miti. Irra darbuu dandeessa.", ti: "ግዴታ ኣይኮነን። ክትሓልፍዎ ትኽእሉ ኢኹም።", so: "Ikhtiyaari. Waad ka boodi kartaa." }, // VERIFY_NATIVE
      type: 'checkbox', optional: true, options: [
        o('large', 'Larger text', 'ትልቅ ጽሑፍ', "Barreeffama guddaa", "ዓቢ ጽሑፍ", "Qoraal ka weyn"), // VERIFY_NATIVE
        o('simple', 'Pictures next to choices', 'ከምርጫዎች ጋር ሥዕሎች', "Filannoo cinaatti fakkii", "ምስ ምርጫታት ስእልታት", "Sawirro ku xiga doorashooyinka")] }, // VERIFY_NATIVE
    { id: 'fullName',
      q: { en: 'What is your full name?', am: 'ሙሉ ስምዎ ማነው?', om: "Maqaan kee guutuun eenyu?", ti: "ምሉእ ስምኩም መን እዩ?", so: "Waa maxay magacaaga oo buuxa?" }, // VERIFY_NATIVE
      hint: { en: 'The name you use every day is fine.', am: 'በየቀኑ የሚጠቀሙበት ስም በቂ ነው።', om: "Maqaan guyyaa guyyaan itti fayyadamtu gahaadha.", ti: "እቲ መዓልታዊ እትጥቀሙሉ ስም ይኣክል።", so: "Magaca aad maalin walba isticmaasho waa ku filan yahay." }, // VERIFY_NATIVE
      type: 'text' },
    // Spoken numbers ("zero nine one one ...", "ዜሮ ዘጠኝ ...") and emails ("abebe at gmail dot com") are turned into text (spokenContact)
    // and read back digit by digit from recorded clips, so it can be checked by ear.
    { id: 'contact', spoken: 'contact',
      q: { en: 'What phone number or email can we use?', am: 'ልናገኝዎ የምንችልበት ስልክ ቁጥር ወይም ኢሜይል ምንድን ነው?', om: "Lakkoofsa bilbilaa ykn imeelii kamiin si quunnamuu dandeenya?", ti: "ብኣየናይ ቁጽሪ ስልኪ ወይ ኢመይል ክንረኽበኩም ንኽእል?", so: "Lambarkee taleefan ama iimayl ayaan isticmaali karnaa?" }, // VERIFY_NATIVE
      hint: { en: 'Only used to contact you about this programme. A phone number has 10 digits and starts with 0. You can say it or type it.', am: 'ስለዚህ ፕሮግራም ለማግኘት ብቻ ነው የሚያገለግለው። ስልክ ቁጥር በዜሮ የሚጀምር ባለ አሥር አሃዝ ነው። መናገር ወይም መጻፍ ይችላሉ።', om: "Waa'ee sagantaa kanaa qofa si quunnamuuf. Lakkoofsi bilbilaa dijiitii 10 qaba, 0n jalqaba. Dubbachuu ykn barreessuu dandeessa.", ti: "ብዛዕባ እዚ መደብ ንምርካብኩም ጥራይ። ቁጽሪ ስልኪ 10 ኣሃዝ ኣለዎ፣ ብ0 ይጅምር። ክትዛረቡዎ ወይ ክትጽሕፉዎ ትኽእሉ ኢኹም።", so: "Kaliya si laguula soo xiriiro barnaamijkan. Lambar taleefan wuxuu leeyahay 10 god, wuxuuna ku bilaabmaa 0. Waad dhihi kartaa ama qori kartaa." }, // VERIFY_NATIVE
      type: 'text',
      check: v => (v = ascii(v)).includes('@') || /^(0\d{9}|251\d{9})$/.test(v.replace(/[^0-9]/g, '')), bad: 'bad' },
    { id: 'idRoute',
      q: { en: 'How would you like to show who you are?', am: 'ማንነትዎን እንዴት ማሳየት ይፈልጋሉ?', om: "Eenyummaa kee akkamitti agarsiisuu barbaadda?", ti: "መንነትኩም ብኸመይ ከተርእዩ ትደልዩ?", so: "Sidee baad u rabtaa inaad muujiso cidda aad tahay?" }, // VERIFY_NATIVE
      type: 'radio', options: [
        o('kebele', 'Kebele ID or passport', 'ቀበሌ መታወቂያ ወይም ፓስፖርት', "Waraqaa eenyummaa gandaa ykn paaspoortii", "መንነት ቀበሌ ወይ ፓስፖርት", "Aqoonsiga kebele ama baasaboor"), // VERIFY_NATIVE
        o('refugee', 'Refugee or returnee ID', 'የስደተኛ ወይም ተመላሽ መታወቂያ', "Waraqaa eenyummaa baqataa ykn deebi'aa", "መንነት ስደተኛ ወይ ተመላሲ", "Aqoonsiga qaxootiga ama soo-noqotaha"), // VERIFY_NATIVE
        o('other', 'Another document', 'ሌላ ሰነድ', "Sanada biraa", "ካልእ ሰነድ", "Dukumenti kale"), // VERIFY_NATIVE
        o('refer', "I don't have an ID. Refer me through a partner organisation", 'ሰነድ የለኝም። አጋር ድርጅት እንዲያመላክተኝ ይጠይቁ', "Waraqaa eenyummaa hin qabu. Karaa dhaabbata michuu naaf ergaa", "መንነት የብለይን። ብመሻርኽቲ ትካል ኣመሓላልፉኒ", "Ma haysto aqoonsi. Iigu gudbiya hay'ad iskaashi")] }, // VERIFY_NATIVE
    { id: 'support',
      q: { en: 'What support would help you? Choose any.', am: 'ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ።', om: "Deeggarsa akkamii si gargaara? Kamiyyuu filadhu.", ti: "እንታይ ደገፍ ይሕግዘኩም? ዝኾነ ምረጹ።", so: "Taageero noocee ah ayaa ku caawin lahayd? Dooro mid kasta." }, // VERIFY_NATIVE
      hint: { en: 'You can skip this. No proof needed. Only the organisers see it, and only to prepare help for you.', am: 'ይህን መዝለል ይችላሉ። ማስረጃ አያስፈልግም። አዘጋጆቹ ብቻ ያዩታል፤ ለእርስዎ እገዛ ለማዘጋጀት ብቻ።', om: "Irra darbuu dandeessa. Ragaan hin barbaachisu. Qindeessitoota qofatu arga, deeggarsa siif qopheessuuf qofa.", ti: "ክትሓልፍዎ ትኽእሉ ኢኹም። መረጋገጺ ኣየድልን። ኣወሃሃድቲ ጥራይ እዮም ዝርእይዎ፣ ንዓኹም ደገፍ ንምድላው ጥራይ።", so: "Waad ka boodi kartaa. Caddayn looma baahna. Kaliya qabanqaabiyayaashu ayaa arka, si ay kuugu diyaariyaan caawimaad." }, // VERIFY_NATIVE
      type: 'checkbox', optional: true, options: [
        o('screenreader', 'I use a screen reader', 'ስክሪን ሪደር እጠቀማለሁ', "Dubbisaa iskiriinii nan fayyadama", "ስክሪን ሪደር እጥቀም", "Waxaan isticmaalaa akhriyaha shaashadda"), // VERIFY_NATIVE
        o('large', 'Large text', 'ትልቅ ጽሑፍ', "Barreeffama guddaa", "ዓቢ ጽሑፍ", "Qoraal weyn"), // VERIFY_NATIVE
        o('voice', 'I prefer to speak my answers', 'መልሶቼን በድምፅ መናገር እመርጣለሁ', "Deebii koo dubbachuu nan filadha", "መልስታተይ ብድምጺ ክዛረብ እመርጽ", "Waxaan doorbidaa inaan ku hadlo jawaabahayga"), // VERIFY_NATIVE
        o('sign', 'Ethiopian Sign Language interpreter', 'የኢትዮጵያ ምልክት ቋንቋ አስተርጓሚ', "Hiikaa Afaan Mallattoo Itoophiyaa", "ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ", "Turjubaan Luqadda Calaamadaha Itoobiya"), // VERIFY_NATIVE
        // Added 15 Nov from the Technical Guide's support list. The Amharic of these four is a draft too: VERIFY_NATIVE.
        o('captions', 'Captions on videos', 'በቪዲዮዎች ላይ የጽሑፍ ትርጉም', "Barreeffama viidiyoo irratti", "ኣብ ቪድዮታት ጽሑፍ", "Qoraal ku qoran muuqaallada"), // VERIFY_NATIVE
        o('interp', 'An interpreter in my language', 'በቋንቋዬ አስተርጓሚ', "Hiikaa afaan kootiin", "ብቋንቋየ ተርጓሚ", "Turjubaan ku hadla luqaddayda"), // VERIFY_NATIVE
        o('time', 'More time for tests and tasks', 'ለፈተናና ለተግባራት ተጨማሪ ጊዜ', "Qormaataa fi hojiif yeroo dabalataa", "ንፈተናታትን ዕማማትን ተወሳኺ ግዜ", "Waqti dheeraad ah oo imtixaannada iyo hawlaha"), // VERIFY_NATIVE
        o('simple', 'Simple words and pictures', 'ቀላል ቃላትና ሥዕሎች', "Jechoota salphaa fi fakkiiwwan", "ቀለልቲ ቃላትን ስእልታትን", "Erayo fudud iyo sawirro"), // VERIFY_NATIVE
        o('human', 'Please call me to help', 'እባክዎ ደውለው ያግዙኝ', "Maaloo na gargaaruuf natti bilbilaa", "በጃኹም ደዊልኩም ሓግዙኒ", "Fadlan ii soo wac si aad ii caawiso"), // VERIFY_NATIVE
        // As easy to choose as any other: it clears the other choices, and nothing about support is sent.
        o('prefer', 'Prefer not to say', 'መናገር አልፈልግም', "Dubbachuu hin barbaadu", "ክገልጽ ኣይደልን", "Ma doonayo inaan sheego")], exclusive: 'prefer' }, // VERIFY_NATIVE
  ] },
  job: { path: '/applications', steps: [
    { id: 'needs', local: true,
      q: { en: 'What support do you need at work? Choose any.', am: 'በሥራ ላይ ምን እገዛ ያስፈልግዎታል? የፈለጉትን ይምረጡ።', om: "Hojii irratti deeggarsa akkamii si barbaachisa? Kamiyyuu filadhu.", ti: "ኣብ ስራሕ እንታይ ደገፍ የድልየኩም? ዝኾነ ምረጹ።", so: "Taageero noocee ah ayaad ugu baahan tahay shaqada? Dooro mid kasta." }, // VERIFY_NATIVE
      hint: { en: 'Private. This stays on your device and is only used to show suitable jobs.', am: 'ሚስጥራዊ ነው። በመሣሪያዎ ላይ ብቻ ይቆያል፤ ተስማሚ ሥራዎችን ለማሳየት ብቻ ነው።', om: "Dhuunfaa. Kun meeshaa kee irratti hafa, hojii si mijatu agarsiisuuf qofa itti fayyadamna.", ti: "ብሕታዊ እዩ። ኣብ መሳርሒኹም ጥራይ ይጸንሕ፣ ተስማዕቲ ስራሓት ንምርኣይ ጥራይ ይጥቀመሉ።", so: "Gaar ah. Wuxuu ku jiraa qalabkaaga oo kaliya waxaa loo isticmaalaa in lagu tuso shaqooyin ku habboon." }, // VERIFY_NATIVE
      type: 'checkbox', optional: true, options: WORK },
    { id: 'role', dyn: true,
      q: { en: 'Which job are you applying for?', am: 'የትኛውን ሥራ እየጠየቁ ነው?', om: "Hojii kamiif iyyachaa jirta?", ti: "ንኣየናይ ስራሕ ኢኹም እትሓቱ ዘለኹም?", so: "Shaqadee ayaad codsanaysaa?" }, // VERIFY_NATIVE
      type: 'text' },
    { id: 'why',
      q: { en: 'Why do you want this job?', am: 'ይህን ሥራ ለምን ይፈልጋሉ?', om: "Hojii kana maaliif barbaadda?", ti: "ነዚ ስራሕ ስለምንታይ ትደልይዎ?", so: "Maxaad u rabtaa shaqadan?" }, // VERIFY_NATIVE
      hint: { en: 'A few words are enough. You can speak instead.', am: 'ጥቂት ቃላት በቂ ናቸው። በድምፅ መናገርም ይችላሉ።', om: "Jechoota muraasni gahaadha. Dubbachuus dandeessa.", ti: "ውሑዳት ቃላት ይኣኽሉ። ብድምጺ እውን ክትዛረቡ ትኽእሉ ኢኹም።", so: "Erayo kooban ayaa ku filan. Waad ku hadli kartaa beddelkeeda." }, // VERIFY_NATIVE
      type: 'text' },
  ] },
  employer: { path: '/employer/jobs', steps: [
    { id: 'job',
      q: { en: 'What is the job title?', am: 'የሥራው መጠሪያ ምንድን ነው?', om: "Maqaan hojii kanaa maali?", ti: "ሽም እቲ ስራሕ እንታይ እዩ?", so: "Waa maxay magaca shaqada?" }, // VERIFY_NATIVE
      type: 'text' },
    { id: 'offers',
      q: { en: 'Which adjustments can this job offer?', am: 'ይህ ሥራ ምን ዓይነት ማስተካከያዎችን ማቅረብ ይችላል?', om: "Hojiin kun mijeessuu akkamii dhiyeessuu danda'a?", ti: "እዚ ስራሕ እንታይ ምትዕርራያት ከቕርብ ይኽእል?", so: "Waa maxay hagaajinta ay shaqadani bixin karto?" }, // VERIFY_NATIVE
      type: 'checkbox', optional: true, options: WORK },
    { id: 'closes', novoice: true, optional: true, type: 'ecdate',
      q: { en: 'When do applications close?', am: 'ማመልከቻ መቼ ይዘጋል?', om: "Iyyannoon yoom cufama?", ti: "ምዝገባ ማመልከቻ መዓስ ይዕጾ?", so: "Goormaa la xirayaa codsiyada?" }, // VERIFY_NATIVE
      hint: { en: 'Optional. Ethiopian calendar. If you only know the month, choose Not sure for the day.', am: 'አማራጭ ነው። በኢትዮጵያ አቆጣጠር። ወሩን ብቻ ካወቁ ለቀኑ «እርግጠኛ አይደለሁም» ይምረጡ።', om: "Dirqama miti. Lakkoofsa Itoophiyaa. Ji'a qofa yoo beekte, guyyaaf 'Hin beeku' filadhu.", ti: "ግዴታ ኣይኮነን። ብኣቆጻጽራ ኢትዮጵያ። ወርሒ ጥራይ እንተ ፈሊጥኩም፣ ንመዓልቲ «ርግጸኛ ኣይኮንኩን» ምረጹ።", so: "Ikhtiyaari. Kalandarka Itoobiya. Haddii aad bisha oo keliya taqaanno, maalinta u dooro 'Ma hubo'." } }, // VERIFY_NATIVE
  ] },
};

// ---- Sidaamu Afoo (sid) --------------------------------------------------------------------------------------
// ROUGH DRAFT, NOT CHECKED: every line must be corrected by a native Sidama speaker BEFORE the audio clips are made
// (the voice reads exactly this text). It is kept in one block so the reviewer can work through it in one place.
// Keys: ui.* = interface text, q.* / hint.* = questions and hints, opt.<question>.<choice>, work.<choice> = workplace adjustments.
// Keep {n}, {t}, {x}, {p}, {r}, {e}, {g} exactly as they are: the form puts numbers and names there.
// A line that is deleted or left '' falls back to English.
const SID = {
  ui: {
    colours: 'Kuulla',
    th_auto: 'Uduunnichoyi\'ya gede',
    th_standard: 'Rosu',
    th_dark: 'Tuqa',
    th_contrast: 'Lowo babbaxxe (kolishsho nna waajjo)',
    th_rg: 'Hoogora nna burtukaane (duumo nna haqqaa kuulla babbaxxe dandiitinokketa)',
    th_by: 'Haqqaa-hoogora nna duumo (hoogora nna dalla kuulla babbaxxe dandiitinokketa)',
    sending: 'Soyamanni no…',
    speakNow: 'Xa hasaawi.',
    sel: 'doodamino',
    unsel: 'doodaminokki',
    langSelf: 'Sidaamu Afoo doorate, Sidaamu Afoo yi, woy Sidaamu Afoo yitanno ilkaawa xiiwi.',
    keysH: 'Keyboorde',
    keyTab: 'woroonni higate',
    keyShiftTab: 'aliidi higate',
    keyEnter: 'doorate',
    keyEsc: 'qaala uurrisate',
    keysSay: 'Keyboorde aana: woroonni higate Tab, aliidi higate Shift nna Tab, doorate Space woy Enter, qaala uurrisate Escape xiiwi.',
    display: 'Kuulla nna borrote lowina',
    heardA: 'Macciishshoonnihu',
    heardB: 'Albisate Albisi yi, woy dawarokki wole yi.',
    voiceSpeed: 'Qaalu saffisa', // VERIFY_NATIVE
    textSize: 'Borrote lowina',
    doneSay: 'Dawaro keeshshi qaxxaamo amadate Ajiisi yi, huqisate Huqisi yi.',
    mySay: 'Huqisate Ee yi, agarate Dee\'ni yi.',
    myDownloaded: 'Dawaro keeshshi qaxxaamo ajiifamino.',
    myDownload: 'Dawaro keeshsha ajiisi',
    myDelete: 'Dawaro keeshsha huqisi',
    mySure: 'Dawaro keeshsha baala huqisate hasatto? Kuni higge didandiitanno. Kaa\'lo doorshoyyikkino huqqisamanno.',
    myYes: 'Ee, huqisi',
    myNo: 'Dee\'ni, agari',
    myDeleted: 'Dawaro keeshshi huqqisamino.',
    myFail: 'Konne assa didandiinoommo. Ikkitinni wole paaxi.',
    myH: 'Dawaro keeshshi',
    myCode: 'Qiinoo koodekki',
    myHint: 'Soyitto gedensaanni la\'itto galatu qoolu aana no: 24 fidalla nna kiiro.',
    myShow: 'Dawaro keeshsha leellishi',
    myNotFound: 'Konne koodenni dawaro diafamino. Koode buuxe wole paaxi.',
    reviewKeys: 'Dawaro keyboordetenni soorrate, Soorri ilkaawa iillitto geeshsha Tab xiiwi, aanchite Enter xiiwi.',
    askSupport: 'Kaa\'lo doorte. Kaa\'lo qixxeessanno gede kaa\'lo doorshoyyikki qixxeessitootira qoolate hasatto? Ee woy Dee\'ni yi.',
    next: 'Albisi',
    back: 'Higi',
    read: 'Qaalinke nabbawi',
    speak: 'Hasaawi',
    send: 'Ee, soy',
    change: 'Soorri',
    review: 'Dawaro keeshshi buuxi',
    thanks: 'Galateemmo. Dawaro keeshshi adhinoonni.',
    need: 'Ikkitinni tenne xa\'mo dawaari, woy Higi xiiwi.',
    bad: 'Ikkitinni zeerotenni hanafanno, tonne kiiro afi\'rino silki kiiro borreessi, woy @ malaatto afi\'rino imeele borreessi.',
    skip: 'Darbi',
    stopped: 'Nabbawa uurrino. Wole hanafate Ane nabbawi xiiwi.',
    skipped: '(darbamino)',
    of: 'Xa\'mo {n}, {t} giddo',
    heard: 'Macciishshoonnihu: {x}. Soorrate dandaatto.',
    novoice: 'Qaalinke eeshsha konni dandaamannokki. Ikkitinni borreessi.',
    novoicehere: 'Konne uduunnichi tenne afootenni qaali dihasiissanno. Ikkitinni borrote nabbawi, woy wole uduunnicho paaxi.',
    listening: 'Macciishshitinoonni. Ikkitinni hasaawi.',
    micblocked: 'Maykiroofoonu gufamino. Barbaarsaaso giddo fajji, woy borreessi.',
    nolang: 'Kuni barbaarsaasi tenne afoo qaalinke dumaggisiisa didandiitanno. Ikkitinni borreessi.',
    nospeech: 'Mittunkuranni dimacciishshinoommo. Wole paaxi, woy borreessi.',
    welcomeH: 'Dancha dayitine!',
    welcomeP: 'Borreessamate nna loosu dandoowa afate shota doogo.',
    startVoice: 'Qaalinke hanafi',
    typeInstead: 'Ikkiinni borreessi',
    start: 'Hanafi',
    intro: 'Dancha dayitine. Kuni foormu mitte yannara mitte xa\'mo xa\'manno. Ilkaawubba mereero sa\'ate Tab, doorate Enter horoonsi\'ri. Qoola macciishshate Qaalinke nabbawi xiiwi.',
    readToMe: 'Ane nabbawi',
    stopRead: 'Nabbawa uurrisi',
    reading: 'Nabbaweemmo...',
    raAsk: 'Kuni qoolu qaalinke nabbawamanno gede hasatto?',
    raHint: 'Ikkitinni Ee woy Dee\'ni yi, woy mitte ilkaawa xiiwi.',
    raPrivacy: 'Ee yitto ikkiro, woy gedensaanni Hasaawi xiiwitto ikkiro, barbaarsaasikki qaalekki borrote soorrate abbaasi aana soyannosi. Dee\'ni yitte borreessa dandaatto.',
    raAgain: 'Dawaro dimacciishshinoommo, kawule Dee\'ni yinoonni gede adhineemmo. Qoolu nabbawamanno gede hasatto ikkiro, xa Ee yi, woy Ee ilkaawa xiiwi.',
    raYes: 'Ee, nabbawi',
    raNo: 'Dee\'ni, galateemmo',
    raNone: 'Nabbawinnikkinni albisa. Ane nabbawi ayee yannanni xiiwa dandaatto.',
    sayChoose: 'Doorshikki kiiro woy su\'ma yi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.',
    sayChoose1: 'Doorshikki kiiro woy su\'ma yi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi.',
    saySkip: 'Tenne xa\'mo darbate Darbi yi.',
    sayText: 'Xa dawarokki hasaawi. Albisate Albisi, higate Higi, wole macciishshate Qaalinke nabbawi yi.',
    sayText1: 'Xa dawarokki hasaawi. Albisate Albisi, wole macciishshate Qaalinke nabbawi yi.',
    sayWelcome: 'Hanafate Hanafi yi.',
    sayReview: 'Dawaro keeshshi soyate Soy, soorrate Higi yi.',
    chose: 'Doorttohu: {x}. Albisate Albisi yi, woy wole doori.',
    noneSel: 'Mittunkuri dooraminokki. Kiiro woy su\'ma yi, woy Darbi yi.',
    unclear: 'Hakkaya, dihuvattoommo. Ikkitinni doorshikki kiiro yi.',
    heardNext: 'Macciishshoonnihu: {x}. Albisate Albisi yi, woy dawarokki wole yi.',
    idle: 'Dimacciishshinoommo. Lowo Hasaawi ilkaawa xiiwi, woy keyboorde horoonsi\'rate Nabbawa uurrisi xiiwi.',
    sayType: 'Ikkitinni dawarokki saaxine giddo borreessi. Aanchite Enter, woy Albisi ilkaawa xiiwi.',
    reviewAsk: 'Dawaro keeshshi soyate hasatto? Soyate Ee, mittu coye soorrate Dee\'ni yi.',
    reviewFix: 'Umi xa\'mora higate Wole hanafi yi, woy soorrate hasatto xa\'mo kiiro yi.',
    noChange: 'Dee\'ni, mittu coye soorrara',
    restart: 'Wole hanafi',
    choseA: 'Doorttohu',
    choseB: 'Albisate Albisi yi, woy wole doori.',
    doneNext: 'Albisate Albisi yi.',
    heardGeneric: 'Dawarokki macciishshinoonni. Leellisaanchu aana leellitanno. Albisate Albisi yi, woy dawarokki wole yi.',
    fail: 'Dawaro keeshshi soya didandiinoommo. Mittunkuri dibaino. Ikkitinni wole paaxi.',
    consentH: 'Ammanaakki',
    consentSend: 'Kuri dawaro {p}ra soyamanno gede ammanaammo.',
    consentSupport: 'Kaa\'lo doorshoyya qixxeessitootira qoodi, kaa\'lo qixxeessanno gede. Tenne mullicho agurtto ikkiro, kaa\'lo doorshoyyikki disoyamanno.',
    consentNote: 'Ammanaatto geeshsha mittunkuri disoyamanno. Soyitto gedensaanni, dawaro keeshshi huqqisamanno gede xa\'mate dandiitto qiinoo koode afitto.',
    consentNeed: 'Ikkitinni soyitto albaanni ammanaate saaxine malaatisi, woy Higi xiiwi.',
    org: 'konne weebsaytete qixxeessitoota',
    receipt: 'Qiinoo koodekki {r}. Gedensaanni dawaro keeshshi huqqisamanno gede hasatto ikkiro agari.',
    draftH: 'Dancha higgite',
    draftP: 'Darbinoha yannaha dawaro keeshshi konne uduunnicho aana agarantino.',
    draftGo: 'Uurrinoommohunni albisi',
    queued: 'Interneete aana dikiitto. Dawaro keeshshi konne uduunnicho aana agarantino, interneete aana higgitto wote soyamanno.',
    sentLater: 'Agarantino dawaro keeshshi xa soyamino.',
    tapToHear: 'Xa\'muwa macciishshate ayee ilkaawa xiiwi woy leellisaancho kaali.',
    today: 'Techi Itiyoophiyu barru qoodo aana {e} ({g}).',
    day: 'Barra',
    month: 'Agana',
    year: 'Diri (Itiyoophiya)',
    notSure: 'Dianfaa\'moommo',
    about: 'shiima',
    dateBad: 'Ikkitinni agana doori, woy barranna diri Dianfaa\'moommo assi.',
    noMatch: 'Doorttoha baala aamannohu loosu dino, kawule loosubba leellitino.',
  },
  q: {
    prefs: 'Konne foormu hiittoo horoonsi\'rate hasatto?',
    fullName: 'Wo\'mu su\'mikki ayeti?',
    contact: 'Hiittoo silki kiiro woy imeelenni dandoonketa?',
    idRoute: 'Ati ayeti ikkitoota hiittoo leellisate hasatto?',
    support: 'Hiittoo kaa\'lo kaa\'lannohe? Ayeeno doori.',
    needs: 'Loosu aana hiittoo kaa\'lo hasiissannohe? Ayeeno doori.',
    role: 'Ayi loosora xa\'mitto?',
    why: 'Konne loosu mayira hasatto?',
    job: 'Loosu su\'mi ayeti?',
    offers: 'Kuni loosu hiittoo qixxeessuwa aamanno?',
    closes: 'Xa\'muwu ayi yanna gufamanno?',
  },
  hint: {
    prefs: 'Dooro. Darba dandaatto.',
    fullName: 'Barru barrunni horoonsi\'ratto su\'mu ikkanno.',
    contact: 'Tenne pirogiraame daafira dandoonketa calla. Silki kiiro tonne kiiro afi\'rinohanna zeerotenni hanafanno. Hasaawa woy borreessa dandaatto.',
    support: 'Tenne darba dandaatto. Ragi dihasiissanno. Qixxeessitooti calla la\'anno, kaa\'lo qixxeessate calla.',
    needs: 'Ma\'nunni. Konne uduunnichokki aana keeshshanno, coyi\'nanno loosuwa leellisate calla.',
    why: 'Shiima qaalla ikkanno. Hasaawa dandaatto.',
    closes: 'Dooro. Itiyoophiyu barru qoodo. Agana calla huvatto ikkiro, barrara Dianfaa\'moommo doori.',
  },
  opt: {
    prefs: { large: 'Lowo borro', simple: 'Doorshu gaxa misilla' },
    idRoute: { kebele: 'Qebeele eeshsha woy paaspoorte', refugee: 'Baqatu woy higgaanchu eeshsha', other: 'Wole bortaje', refer: 'Eeshsha diafi\'rino. Jaala dirijjiteenni hoolisi\'e' },
    support: { screenreader: 'Leellisaancho nabbawaancho horoonsi\'reemmo', large: 'Lowo borro', voice: 'Dawaro qaalinke hasaawa doorreemmo', sign: 'Itiyoophiyu Malaatu Afoo turjimaancho', captions: 'Viidiyoo aana borro', interp: 'Afoo\'yanni turjimaancho', time: 'Fayyimmaranna loosora roore yanna', simple: 'Shota qaalla nna misilla', human: 'Ikkitinni kaa\'lo daafira silki xa\'mi', prefer: 'Kulla dihasi\'reemmo' },
  },
  work: { stepfree: 'Gadu dinokki loosu bayicho', reader: 'Leellisaancho nabbawaanchora coyi\'nanno uduunnicho', interp: 'Malaatu afoo turjimaancho', hours: 'Soorramanno loosu saate', remote: 'Mineenni loosa' },
};
// Merge the Sidama text into the shared tables. A missing or empty line falls back to English.
for (const k in SID.ui) if (UI[k] && SID.ui[k]) UI[k].sid = SID.ui[k];
for (const f of Object.values(FLOWS)) for (const s of f.steps) {
  if (SID.q[s.id]) s.q.sid = SID.q[s.id];
  if (s.hint && SID.hint[s.id]) s.hint.sid = SID.hint[s.id];
  (s.options || []).forEach(([k, t]) => { const v = s.options === WORK ? SID.work[k] : (SID.opt[s.id] || {})[k]; if (v) t.sid = v; });
}

// ---- Design tokens ---------------------------------------------------------------------------------------------
// One accent per theme, warm neutral surfaces. Meaning never depends on colour alone: selected = check mark + heavier
// border, error = warning icon + bar + text. A host page can set --db-accent (and --db-font) on <db-form> to brand the
// Standard theme; CSS custom properties pass into the shadow DOM.
const THEMES = ['auto', 'standard', 'dark', 'contrast', 'rg', 'by'];
const TOKENS = {
  standard: 'color-scheme:light;--bg:#f6f4ef;--surface:#ffffff;--surface-2:#efece4;--ink:#1b1d1a;--ink-2:#4a4f47;--line:#d6d1c4;--line-strong:#6b6f66;--accent:var(--db-accent,#1d5c3f);--accent-hover:#164a32;--accent-ink:#ffffff;--accent-soft:#e2eee6;--error:#a3221b;--error-soft:#fbeae8;--focus:#1d5c3f;--focus-gap:#ffffff;--shadow:0 1px 2px rgb(27 29 26 / .06),0 12px 28px -16px rgb(27 29 26 / .28)',
  dark: 'color-scheme:dark;--bg:#121412;--surface:#1b1e1b;--surface-2:#252925;--ink:#eef0ea;--ink-2:#b9bfb4;--line:#363b35;--line-strong:#80887d;--accent:#86d4a8;--accent-hover:#a3e0bd;--accent-ink:#0b1a11;--accent-soft:#1d3427;--error:#ff8f85;--error-soft:#3b1d1a;--focus:#86d4a8;--focus-gap:#121412;--shadow:0 1px 2px rgb(0 0 0 / .4),0 12px 28px -16px rgb(0 0 0 / .7)',
  contrast: 'color-scheme:light;--bg:#ffffff;--surface:#ffffff;--surface-2:#ffffff;--ink:#000000;--ink-2:#000000;--line:#000000;--line-strong:#000000;--accent:#000000;--accent-hover:#000000;--accent-ink:#ffffff;--accent-soft:#fff200;--error:#000000;--error-soft:#fff200;--focus:#000000;--focus-gap:#fff200;--shadow:none;--bw:3px',
  // Red-green colour blindness (protanopia, deuteranopia): blue accent, orange-brown for errors.
  rg: 'color-scheme:light;--bg:#f5f6f8;--surface:#ffffff;--surface-2:#eceff3;--ink:#16191d;--ink-2:#454b54;--line:#cfd5dd;--line-strong:#5f6772;--accent:#0b57a4;--accent-hover:#084683;--accent-ink:#ffffff;--accent-soft:#e1ecf8;--error:#9a4a00;--error-soft:#fdf0e3;--focus:#0b57a4;--focus-gap:#ffffff;--shadow:0 1px 2px rgb(22 25 29 / .06),0 12px 28px -16px rgb(22 25 29 / .28)',
  // Blue-yellow colour blindness (tritanopia): teal accent, red for errors.
  by: 'color-scheme:light;--bg:#f6f5f4;--surface:#ffffff;--surface-2:#eeecea;--ink:#1c1b1a;--ink-2:#4d4a47;--line:#d5d1cc;--line-strong:#6c6863;--accent:#006a66;--accent-hover:#00534f;--accent-ink:#ffffff;--accent-soft:#dff0ef;--error:#b0003a;--error-soft:#fbe6ec;--focus:#006a66;--focus-gap:#ffffff;--shadow:0 1px 2px rgb(28 27 26 / .06),0 12px 28px -16px rgb(28 27 26 / .28)',
};
const CSS = `
:host{display:block}
section{${TOKENS.standard};--font:var(--db-font,'Atkinson Hyperlegible','Noto Sans Ethiopic','Nyala','Ebrima',system-ui,sans-serif);
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s5:24px;--s6:32px;--r1:4px;--r2:8px;--bw:2px;
  font:1.125rem/1.55 var(--font);color:var(--ink);background:var(--surface);
  max-width:38rem;margin:0 auto;padding:var(--s5);border:1px solid var(--line);border-radius:var(--r2);box-shadow:var(--shadow);text-align:left}
section[data-theme=dark]{${TOKENS.dark}}
section[data-theme=contrast]{${TOKENS.contrast}}
section[data-theme=rg]{${TOKENS.rg}}
section[data-theme=by]{${TOKENS.by}}
@media (prefers-color-scheme:dark){section[data-theme=auto]{${TOKENS.dark}}}
@media (prefers-contrast:more){section[data-theme=auto]{${TOKENS.contrast}}}
:lang(am),:lang(ti){line-height:1.8}
*{box-sizing:border-box}
svg{flex:none}
h2,legend,p,label,button,dd,dt{overflow-wrap:break-word;hyphens:auto}
h2,legend{font-size:1.375em;line-height:1.3;font-weight:700;letter-spacing:-.005em;margin:0;padding:0;color:var(--ink)}
p{margin:0}
fieldset{border:0;padding:0;margin:0;min-width:0}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* top bar: language + colours */
.bar{display:flex;flex-wrap:wrap;gap:var(--s2) var(--s3);align-items:flex-start;justify-content:space-between;padding-bottom:var(--s4);margin-bottom:var(--s4);border-bottom:1px solid var(--line)}
.lang{display:flex;flex-wrap:wrap;gap:var(--s1);flex:1 1 18rem}
.lang button{flex:0 1 auto;min-height:40px;padding:.25rem .7rem;font-size:.875em;border-color:var(--line)}
.lang button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--ink);font-weight:700}
details.disp{position:relative;font-size:.875em;margin-left:auto;text-align:right}
.disp .panel{text-align:left;margin-left:auto}
details.disp summary{display:inline-flex;align-items:center;gap:var(--s2);min-height:40px;padding:.25rem .7rem;border:var(--bw) solid var(--line);border-radius:var(--r1);cursor:pointer;list-style:none;color:var(--ink);background:var(--surface)}
details.disp summary::-webkit-details-marker{display:none}
details.disp[open] summary{border-color:var(--accent)}
.disp .panel{margin-top:var(--s1);width:min(20rem,80vw);padding:var(--s3);background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--r2);box-shadow:var(--shadow)}
.disp label{display:flex;gap:var(--s2);align-items:center;min-height:44px;padding:0 var(--s2);border-radius:var(--r1);cursor:pointer}
.disp label:has(input:checked){background:var(--accent-soft);font-weight:700}
.sw{display:inline-flex;gap:2px}.sw i{width:10px;height:18px;border-radius:2px;border:1px solid rgb(0 0 0 / .25)}

/* buttons */
button{font:inherit;display:inline-flex;align-items:center;justify-content:center;gap:var(--s2);min-height:48px;min-width:48px;padding:.55rem 1.1rem;border-radius:var(--r1);border:var(--bw) solid var(--line-strong);background:var(--surface);color:var(--ink);cursor:pointer;text-align:left;transition:background-color .12s,border-color .12s,transform .06s}
button:hover{background:var(--surface-2)}
button:active{transform:translateY(1px)}
button.p{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}
button.p:hover{background:var(--accent-hover);border-color:var(--accent-hover)}
button.q{border-color:transparent;background:transparent;text-decoration:underline;text-underline-offset:.2em}
button.q:hover{background:var(--surface-2)}
button:disabled,button[aria-disabled=true]{opacity:.55;cursor:not-allowed;transform:none}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;box-shadow:0 0 0 2px var(--focus-gap)}
.big{min-height:64px;font-size:1.1em;padding:.75rem 1.25rem;justify-content:flex-start}
.row{display:flex;flex-direction:column;gap:var(--s3);margin-top:var(--s5)}
.row button{width:100%}
.row .split{display:flex;gap:var(--s3)}.row .split button{flex:1}
.tools{display:flex;gap:var(--s2);margin:0 0 var(--s4)}
.tools button{font-size:.9375em;min-height:44px}
/* keyboard help: always on screen, in the chosen language (keyboard-only, deaf and hard-of-hearing users) */
.keys{display:flex;flex-wrap:wrap;gap:var(--s1) var(--s4);margin:0 0 var(--s4);padding:var(--s2) var(--s3);list-style:none;font-size:.875em;color:var(--ink-2);background:var(--surface-2);border-radius:var(--r1)}
.keys li{display:inline-flex;flex-wrap:wrap;gap:var(--s1);align-items:center}
.keys .kh{font-weight:700;color:var(--ink)}
kbd{font:inherit;font-size:.9em;font-weight:700;color:var(--ink);padding:0 .4em;border:1px solid var(--line-strong);border-bottom-width:2px;border-radius:3px;background:var(--surface);white-space:nowrap}
.disp .ts{margin-top:var(--s2);padding-top:var(--s2);border-top:1px solid var(--line)}
.disp .ts legend{font-weight:700;padding:0 var(--s2);margin-bottom:var(--s1)}
.tsr{display:flex;flex-wrap:wrap;gap:var(--s1)}
.tsr label{flex:1 1 4.5em;flex-direction:column;justify-content:center;gap:2px;padding:var(--s2) var(--s1);border:var(--bw) solid var(--line);text-align:center}
.tsr .aa{font-weight:700;line-height:1;font-family:var(--font)}

/* captions: everything spoken is also shown (for deaf and hard-of-hearing people) */
.cap{display:none;gap:var(--s3);align-items:flex-start;margin:0 0 var(--s4);padding:var(--s3) var(--s4);border-radius:var(--r2);border:1px solid var(--line);background:var(--surface-2);color:var(--ink)}
.cap[data-state=speaking],.cap[data-state=listening]{display:flex}
.cap .k{display:block;font-size:.8125em;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-2)}
.cap .t{display:block;max-height:9.5em;overflow:auto}
.cap[data-state=listening]{background:var(--accent-soft);border:var(--bw) solid var(--accent)}
.cap[data-state=listening] .t{font-size:1.25em;font-weight:700}
.cap.flash{animation:flash .45s ease-out}
.lvl{display:none;gap:3px;align-items:center;height:1.4em;margin-left:auto}
.cap[data-state=listening] .lvl,.mic.on .lvl{display:inline-flex}
.lvl i{width:4px;height:100%;border-radius:2px;background:currentColor;animation:w 1s infinite ease-in-out}
.lvl i:nth-child(2){animation-delay:.15s}.lvl i:nth-child(3){animation-delay:.3s}.lvl i:nth-child(4){animation-delay:.45s}
@keyframes w{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes flash{0%{box-shadow:0 0 0 6px var(--accent)}100%{box-shadow:0 0 0 0 transparent}}
.status{margin:0 0 var(--s4);font-size:.9375em;color:var(--ink-2)}
.status:empty{display:none}
.cap:is([data-state=speaking],[data-state=listening])~.status{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;margin:0}

/* form */
.step{display:flex;justify-content:space-between;gap:var(--s3);font-size:.875em;font-weight:700;color:var(--ink-2);margin-bottom:var(--s2)}
.track{height:6px;border-radius:3px;background:var(--surface-2);border:1px solid var(--line);overflow:hidden;margin-bottom:var(--s5)}
.track i{display:block;height:100%;background:var(--accent)}
legend{margin-bottom:var(--s2)}
#hint{margin:0 0 var(--s4);color:var(--ink-2)}
#hint:empty{display:none}
input[type=text]{width:100%;font:inherit;min-height:52px;padding:.7rem .85rem;border:var(--bw) solid var(--line-strong);border-radius:var(--r1);background:var(--surface);color:var(--ink)}
input[type=text]:hover{border-color:var(--ink)}
input[type=text][aria-invalid=true]{border-color:var(--error);border-width:3px}
.opts{display:grid;gap:var(--s2)}
.opt{display:flex;gap:var(--s3);align-items:center;min-height:56px;padding:var(--s2) var(--s3);border:var(--bw) solid var(--line);border-radius:var(--r2);background:var(--surface);cursor:pointer}
.opt:hover{border-color:var(--line-strong)}
.opt .pic,.opt .tick{display:inline-flex}
.opt .pic{color:var(--accent)}
.opt .tick{margin-left:auto;visibility:hidden;color:var(--accent)}
.opt:has(input:checked){border-color:var(--accent);border-width:3px;background:var(--accent-soft);padding:calc(var(--s2) - 1px) calc(var(--s3) - 1px)}
.opt:has(input:checked) .tick{visibility:visible}
.opt:has(input:focus-visible){outline:3px solid var(--focus);outline-offset:2px}
input[type=radio],input[type=checkbox]{width:1.375rem;height:1.375rem;margin:0;accent-color:var(--accent);flex:none}
.err{display:flex;gap:var(--s2);align-items:flex-start;margin-top:var(--s4);padding:var(--s3);border-left:6px solid var(--error);border-radius:var(--r1);background:var(--error-soft);color:var(--ink);font-weight:700}
.err svg{color:var(--error)}
.err:empty{display:none}
.mic{width:100%;justify-content:space-between;margin-bottom:var(--s4);min-height:64px;font-size:1.125em;border:3px solid var(--accent);font-weight:700}
.mic svg{color:var(--accent)}
.mic .lab{display:inline-flex;gap:var(--s2);align-items:center}
.mic.on{outline:3px solid var(--accent);outline-offset:3px}
form>*+*{margin-top:0}

/* pages */
.head{display:flex;flex-direction:column;gap:var(--s3);margin-bottom:var(--s2)}
.head p{color:var(--ink-2)}
.logo{color:var(--accent)}
.langhelp{list-style:none;padding:0;margin:var(--s4) 0 0;display:grid;gap:var(--s2);color:var(--ink-2);border-left:3px solid var(--line);padding-left:var(--s3)}
.pick{flex-direction:column;align-items:flex-start;gap:0}
.pick small{font-size:.8em;font-weight:400;color:var(--ink-2)}
.privacy{font-size:.9375em;color:var(--ink-2);padding:var(--s3);border:1px solid var(--line);border-radius:var(--r1);background:var(--surface-2)}
dl.review{margin:var(--s4) 0 0;border-top:1px solid var(--line)}
.review .item{padding:var(--s3) 0;border-bottom:1px solid var(--line)}
.review dt{font-size:.875em;color:var(--ink-2);margin-bottom:var(--s1)}
.review dd{margin:0;display:flex;gap:var(--s3);align-items:center;justify-content:space-between;font-weight:700}
.review dd button{min-height:44px;font-weight:400}
.after{margin-top:var(--s4)}
.done{display:flex;flex-direction:column;gap:var(--s3);padding:var(--s4) 0}
.done svg{color:var(--accent)}
.sure{margin-top:var(--s4);padding:var(--s3);border-left:6px solid var(--error);border-radius:var(--r1);background:var(--error-soft)}
.revmic{margin-top:var(--s3)}
.done .receipt{font-family:ui-monospace,Consolas,monospace;font-weight:700;letter-spacing:.04em}
.when{color:var(--ink-2);font-size:.9375em}
.note{padding:var(--s3);border-left:4px solid var(--accent);background:var(--accent-soft);color:var(--ink)}
/* consent: two separate checkboxes, the second only for support choices */
fieldset.consent{margin-top:var(--s5);padding:var(--s4);border:var(--bw) solid var(--line-strong);border-radius:var(--r2)}
fieldset.consent legend{font-size:1.0625em;padding:0 var(--s2);margin-bottom:var(--s2)}
.consent .opt{margin-top:var(--s2)}
.consent .opt span:not(.tick){flex:1;min-width:0}
.consent p{font-size:.9375em;color:var(--ink-2);margin-top:var(--s3)}
/* Ethiopian date: three labelled selects */
.ecd{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(8.5rem,100%),1fr));gap:var(--s3)}
.ecd label{display:flex;flex-direction:column;gap:var(--s1);font-size:.9375em;font-weight:700;color:var(--ink-2)}
select{font:inherit;font-weight:400;min-height:52px;padding:.5rem .6rem;border:var(--bw) solid var(--line-strong);border-radius:var(--r1);background:var(--surface);color:var(--ink)}
select:hover{border-color:var(--ink)}
select[aria-invalid=true]{border-color:var(--error);border-width:3px}

@media (max-width:30rem){section{position:relative;padding:var(--s4);border-radius:0;border-left:0;border-right:0}details.disp{position:static}.disp .panel{width:auto}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (forced-colors:active){button,.opt,input[type=text],select,.cap,.err,details.disp summary{border:2px solid CanvasText}.opt:has(input:checked){outline:3px solid Highlight}.track i{background:Highlight}}
`;

// ---- Icons: 24px line icons, stroke = currentColor, always aria-hidden next to a text label ----------------------
const svg = (d, s = 24) => `<svg width='${s}' height='${s}' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' focusable='false'>${d}</svg>`;
const P = {
  mic: "<rect x='9' y='3' width='6' height='11' rx='3'/><path d='M5 11a7 7 0 0 0 14 0M12 18v3'/>",
  speaker: "<path d='M4 9v6h4l5 4V5L8 9z'/><path d='M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11'/>",
  stop: "<rect x='6' y='6' width='12' height='12' rx='1.5'/>",
  check: "<path d='M5 12.5l4.5 4.5L19 7.5'/>",
  alert: "<path d='M12 3l9.5 17h-19z'/><path d='M12 10v4.5M12 17.5v.01'/>",
  globe: "<circle cx='12' cy='12' r='9'/><path d='M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z'/>",
  palette: "<path d='M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.4-1.2-1.6-1.2-2.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z'/><circle cx='7.5' cy='11' r='1'/><circle cx='10.5' cy='7.5' r='1'/><circle cx='15' cy='7.5' r='1'/>",
  next: "<path d='M5 12h14M13 6l6 6-6 6'/>",
  back: "<path d='M19 12H5M11 6l-6 6 6 6'/>",
  kebele: "<rect x='3' y='5' width='18' height='14' rx='2'/><circle cx='9' cy='11' r='2'/><path d='M6 16c.8-1.4 1.8-2 3-2s2.2.6 3 2M14 10h4M14 13.5h4'/>",
  refugee: "<path d='M3 20L12 4l9 16z'/><path d='M9 20l3-6 3 6'/>",
  other: "<path d='M6 3h8l4 4v14H6z'/><path d='M14 3v4h4M9 12h6M9 16h6'/>",
  refer: "<circle cx='8' cy='8' r='3'/><path d='M3 20c0-3 2.2-5 5-5s5 2 5 5M15 10h6M18 7l3 3-3 3'/>",
  screenreader: "<path d='M4 9v6h4l5 4V5L8 9z'/><path d='M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11'/>",
  large: "<path d='M3 19L8 5l5 14M5 14h6M15 19v-6a2.5 2.5 0 0 1 5 0v6M15 15.5h5'/>",
  voice: "<rect x='9' y='3' width='6' height='11' rx='3'/><path d='M5 11a7 7 0 0 0 14 0M12 18v3'/>",
  sign: "<path d='M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.4 0-4-1.2-5.5-3.5L4 13.6a1.5 1.5 0 0 1 2.5-1.7L8 14'/>",
  simple: "<rect x='3' y='4' width='18' height='16' rx='2'/><circle cx='9' cy='10' r='2'/><path d='M21 17l-5-5-9 8'/>",
  human: "<path d='M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'/>",
  stepfree: "<circle cx='10' cy='4.5' r='1.5'/><path d='M10 7.5v5.5h5l3 5M10 10h4M7.5 11.5A5 5 0 1 0 14 18'/>",
  hours: "<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>",
  remote: "<path d='M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6'/>",
};
P.reader = P.screenreader; P.interp = P.sign;
P.captions = "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='M10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3'/>";
P.time = "<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>";
const I = (k, s) => svg(P[k], s);
const LOGO = `<svg class='logo' width='44' height='44' viewBox='0 0 56 56' aria-hidden='true' focusable='false'><circle cx='28' cy='12' r='8' fill='currentColor'/><path d='M6 22c14 0 20 8 22 26C26 30 20 24 6 22zM50 22c-14 0-20 8-22 26 2-18 8-24 22-26z' fill='currentColor' opacity='.75'/></svg>`;
const CHECK = svg("<circle cx='12' cy='12' r='10'/><path d='M7 12.5l3.2 3.2L17 9'/>", 56);
const SWATCH = { auto: ['#f6f4ef', '#121412'], standard: ['#ffffff', '#1d5c3f'], dark: ['#1b1e1b', '#86d4a8'], contrast: ['#ffffff', '#000000', '#fff200'], rg: ['#ffffff', '#0b57a4', '#9a4a00'], by: ['#ffffff', '#006a66', '#b0003a'] };
const esc = s => String(s == null ? '' : s).replace(/[&<>']/g, c => '&#' + c.charCodeAt(0) + ';');

const NUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  'አንድ': 1, 'ሁለት': 2, 'ሦስት': 3, 'ሶስት': 3, 'አራት': 4, 'አምስት': 5, 'ስድስት': 6, 'ሰባት': 7, 'ስምንት': 8, '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5, '፮': 6, '፯': 7, '፰': 8,
  tokko: 1, lama: 2, sadii: 3, afur: 4, shan: 5, jaha: 6, torba: 7, saddeet: 8, // om, VERIFY_NATIVE
  'ሓደ': 1, 'ክልተ': 2, 'ሰለስተ': 3, 'ኣርባዕተ': 4, 'ሓሙሽተ': 5, 'ሽዱሽተ': 6, 'ሸውዓተ': 7, 'ሸሞንተ': 8, // ti, VERIFY_NATIVE
  kow: 1, hal: 1, laba: 2, saddex: 3, afar: 4, lix: 6, toddoba: 7, siddeed: 8, // so (shan = 5 is shared with om), VERIFY_NATIVE
  mitto: 1, lame: 2, sase: 3, shoole: 4, onte: 5, lee: 6, lamala: 7, sette: 8, // sid, VERIFY_NATIVE
  nine: 9, ten: 10, 'ዘጠኝ': 9, 'አሥር': 10, 'አስር': 10, '፱': 9, '፲': 10, sagal: 9, kudhan: 10, 'ትሽዓተ': 9, 'ዓሰርተ': 10, sagaal: 9, toban: 10, honse: 9, tonne: 10, // VERIFY_NATIVE (om ti so sid)
};
const NUM1 = { won: 1, to: 2, too: 2, for: 4 };
// Ordinals ("the first one"): English, and Amharic stems (አንደኛ, ሁለተኛ ...; the ending is cut off by numOf).
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8,
  'አንደ': 1, 'ሁለተ': 2, 'ሦስተ': 3, 'ሶስተ': 3, 'አራተ': 4, 'አምስተ': 5, 'ስድስተ': 6, 'ሰባተ': 7, 'ስምንተ': 8 };
// Amharic joins small words to a number: አንድና (one-and), ሁለቱም (both), ሁለትን, አንደኛው. Cut those endings off.
const NUM_END = /(ኛውን|ኛውም|ኛውና|ኛው|ኛና|ኛን|ኛ|ውን|ንም|ና|ን|ም|ው)$/;
// A number word, digit or ordinal -> its value (0 if it is none). one = the only word said (then "to" = 2 is allowed).
const numOf = (x, one) => {
  if (/^\d+$/.test(x)) return +x;
  if (NUM[x] || ORD[x] || (one && NUM1[x])) return NUM[x] || ORD[x] || NUM1[x];
  for (let y = x, k = 0; k < 2 && NUM_END.test(y); k++) { y = y.replace(NUM_END, ''); if (NUM[y] || ORD[y]) return NUM[y] || ORD[y]; }
  return 0;
};
// Digits said aloud, for the phone number: 0-9 in every language (om, ti, so, sid: VERIFY_NATIVE).
const DIGITS = [
  ['zero', 'oh', 'ዜሮ', 'ዜሮው', 'zeeroo', 'zeero', 'eber'],
  ['one', 'won', 'አንድ', 'tokko', 'ሓደ', 'kow', 'hal', 'mitto'],
  ['two', 'to', 'too', 'ሁለት', 'lama', 'ክልተ', 'laba', 'lame'],
  ['three', 'tree', 'ሦስት', 'ሶስት', 'sadii', 'ሰለስተ', 'saddex', 'sase'],
  ['four', 'for', 'አራት', 'afur', 'ኣርባዕተ', 'afar', 'shoole'],
  ['five', 'አምስት', 'shan', 'ሓሙሽተ', 'onte'],
  ['six', 'ስድስት', 'jaha', 'ሽዱሽተ', 'lix', 'lee'],
  ['seven', 'ሰባት', 'torba', 'ሸውዓተ', 'toddoba', 'lamala'],
  ['eight', 'ate', 'ስምንት', 'saddeet', 'ሸሞንተ', 'siddeed', 'sette'],
  ['nine', 'ዘጠኝ', 'sagal', 'sagla', 'ትሽዓተ', 'sagaal', 'honse'],
].reduce((m, ws, d) => { ws.forEach(w => { m[w] = String(d); }); return m; }, {});
// What someone said for the phone-or-email question, as text: "zero nine one one 22 33 44" -> "0911223344";
// "abebe at gmail dot com" -> "abebe@gmail.com". Digits in any script count (ascii()). "double 4" = "44".
const spokenContact = raw => {
  const w = ascii(raw).normalize('NFC').toLowerCase().replace(/[,;!?፣።]/g, ' ').split(/\s+/).filter(Boolean);
  const email = w.some(x => x.includes('@') || ['at', 'አት', 'ኣት'].includes(x)) && w.some(x => /[a-z]/.test(x) && !DIGITS[x]);
  if (email) {
    return w.map(x => (['at', 'አት', 'ኣት'].includes(x) ? '@' : ['dot', 'ነጥብ', 'point', 'tuqaa'].includes(x) ? '.' : ['underscore'].includes(x) ? '_' : ['dash', 'hyphen'].includes(x) ? '-' : x)).join('').replace(/\.$/, '');
  }
  let out = '', rep = 1;
  for (const x of w) {
    if (x === 'double') { rep = 2; continue; }
    if (x === 'triple') { rep = 3; continue; }
    if (x === 'plus' || x === '+') continue;
    const d = DIGITS[x] || x.replace(/[^0-9]/g, '');
    if (d) { out += d.length === 1 ? d.repeat(rep) : d; rep = 1; }
  }
  return out || String(raw).trim();
};
const STOP = ['use', 'the', 'and', 'for', 'you', 'can', 'not', 'don', 'have', 'please', 'through', 'any',
  'ykn', 'kan', 'fi', 'maaloo', // om, VERIFY_NATIVE
  'ama', 'iyo', 'aan', 'fadlan']; // so, VERIFY_NATIVE
// Voice commands. Words are compared one by one after norm(), which turns apostrophes into spaces, so no entry contains one.
const CMD = {
  next: ['next', 'continue', 'done', 'finished', 'ቀጥል', 'ቀጥሉ', 'ቀጥይ', 'ቀጣይ', 'ጨርሻለሁ',
    'fufi', 'ቀጽል', 'ቀጽሉ', 'xiga'], // om ti so, VERIFY_NATIVE
  back: ['back', 'previous', 'ተመለስ', 'ኋላ',
    'duubatti', 'ተመለሱ', 'noqo'], // om ti so, VERIFY_NATIVE
  skip: ['skip', 'ዝለል', 'ዝለሉ',
    'darbi', 'ሕለፍ', 'ሕለፉ', 'bood'], // om ti so, VERIFY_NATIVE
  repeat: ['read', 'aloud', 'repeat', 'again', 'አንብብልኝ', 'አንብብ', 'ድገም', 'እንደገና',
    'dubbisi', 'ኣንብበለይ', 'ኣንብብ', 'akhri', 'celi'], // om ti so, VERIFY_NATIVE
  start: ['start', 'begin', 'ጀምር',
    'jalqabi', 'bilow'], // om so (ti uses ጀምር), VERIFY_NATIVE
  send: ['submit', 'send', 'አስገባ',
    'ergi', 'ኣረክብ', 'ስደድ', 'gudbi'], // om ti so, VERIFY_NATIVE
  restart: ['restart', 'beginning', 'ከመጀመሪያ'],
  // "Start again" = a start word plus one of these (review page only).
  again: ['again', 'እንደገና',
    'deebi', 'ደጊምካ', 'ደጊምኩም', 'dib'], // om ti so, VERIFY_NATIVE
  // Thank-you page: delete or download my answers.
  del: ['delete', 'remove', 'erase', 'ሰርዝ', 'ሰርዙ', 'አጥፋ', 'አጥፉ',
    'haqi', 'ደምስስ', 'ደምስሱ', 'tirtir', 'huqisi'], // om ti so sid, VERIFY_NATIVE
  download: ['download', 'save', 'copy', 'keep', 'አውርድ', 'አውርዱ', 'አስቀምጥ',
    'buusi', 'ኣውርድ', 'dejiso', 'ajiisi'], // om ti so sid, VERIFY_NATIVE
  stop: ['stop', 'ቁም', 'አቁም',
    'dhaabi', 'ኣቋርጽ', 'ደው', 'jooji'], // om ti so, VERIFY_NATIVE
};
// Speech recognisers spell a spoken Ge'ez word in several ways (ቀጥል, ቀጠለ, ቀጥሎ, ቅጥል): the vowels differ, the consonants
// do not. So a one-word Ge'ez command also counts when its consonants match one in CMD.
const skel = w => romanize(w).toLowerCase().replace(/[aeiou]/g, '');
const CMD_SKEL = Object.fromEntries(Object.entries(CMD).map(([k, ws]) => [k, new Set(ws.filter(x => GEEZ.test(x)).map(skel).filter(x => x.length >= 2))]));
const isCmd = (c, w) => w.some(x => CMD[c].includes(x) || (GEEZ.test(x) && CMD_SKEL[c].has(skel(x))));
// Yes / No for the first question and the review page.
const YES = ['አዎ', 'አዎን', 'ይሁን', 'yes', 'yeah', 'yep', 'ok', 'okay', 'sure',
  'eeyyee', 'eeyye', 'eeyee', 'እወ', 'እዉ', 'haa', 'haye', 'haah', 'ee']; // om ti so sid, VERIFY_NATIVE
const NO = ['አይ', 'አይደለም', 'አልፈልግም', 'አያስፈልግም', 'no', 'nope',
  'lakki', 'lakkii', 'miti', 'ኣይፋል', 'ኣይፋልን', 'maya', 'mayo', 'dee', 'deeni']; // om ti so sid, VERIFY_NATIVE
const HASV = () => window.SpeechRecognition || window.webkitSpeechRecognition;
const DRAFT_DAYS = 7;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (x) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) { /* storage blocked or full: the form still works */ } },
  del(k) { try { localStorage.removeItem(k); } catch (x) { /* ignore */ } },
};
// Recorded clips: one Audio element per file, kept for reuse, and loaded one step ahead, so a list of short clips
// ("2" + "Refugee or returnee ID" + "selected") plays without gaps on a slow connection. Missing files are remembered,
// so the device voice takes over at once the next time instead of waiting for the network again.
const CLIP_CACHE = new Map(), CLIP_MISSING = new Set();
const clipAudio = url => {
  let a = CLIP_CACHE.get(url);
  if (a) { try { a.pause(); a.currentTime = 0; } catch (x) { /* not loaded yet */ } return a; }
  a = new Audio(); a.preload = 'auto'; a.addEventListener('error', () => CLIP_MISSING.add(url)); a.src = url;
  CLIP_CACHE.set(url, a);
  if (CLIP_CACHE.size > 80) CLIP_CACHE.delete(CLIP_CACHE.keys().next().value);
  return a;
};
// Phone numbers are said in groups: 0902 57 65 70 (10 digits), 251 902 57 65 70 (12 digits), else threes.
const phoneGroups = ds => (ds.length === 10 ? [4, 2, 2, 2] : ds.length === 12 ? [3, 3, 2, 2, 2] : []).reduce((g, n) => { g.parts.push(g.rest.slice(0, n)); g.rest = g.rest.slice(n); return g; }, { parts: [], rest: ds }).parts.concat(ds.length === 10 || ds.length === 12 ? [] : ds.match(/.{1,3}/g) || []).filter(Boolean);
// Decoded digit clips (Web Audio), cut to the voice itself so digits can be joined with even, short gaps.
const DIGIT_BUF = new Map();
const digitBuf = (ctx, url) => {
  if (!DIGIT_BUF.has(url)) DIGIT_BUF.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b)).then(buf => {
    const ch = buf.getChannelData(0); let peak = 0; for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
    const thr = peak * 0.03; let a = 0, z = ch.length - 1; while (a < z && Math.abs(ch[a]) < thr) a++; while (z > a && Math.abs(ch[z]) < thr) z--;
    const pad = Math.round(buf.sampleRate * 0.02); a = Math.max(0, a - pad); z = Math.min(ch.length - 1, z + pad);
    return { rate: buf.sampleRate, data: ch.slice(a, z + 1) };
  }).catch(e => { DIGIT_BUF.delete(url); throw e; }));
  return DIGIT_BUF.get(url);
};
const preload = url => { if (url && typeof Audio !== 'undefined' && !CLIP_CACHE.has(url) && !CLIP_MISSING.has(url)) clipAudio(url); };
const QUEUE = 'db-form-queue';
// Text size: 100%, 150% or 200% of the form's normal text (WCAG 1.4.4 asks for 200% without loss).
const SIZES = [1, 1.5, 2];
// Read-aloud speed. 1.3x by default (the team's choice after listening); the person can choose 1x or 1.6x under
// "Colours and text size", and a host can set its own default with speed='1'. The pitch stays the same.
const SPEEDS = [1, 1.3, 1.6], SPEED_DEFAULT = 1.3;
const CONSENT_VERSION = '2026-11-15';
// An Ethiopian date the person chose, with "Not sure" filled in: no day = last day of the month (approximate),
// no year = the next time that month comes round.
const ecResolve = v => {
  const now = toEC(), y = v.y || (v.m >= now.m ? now.y : now.y + 1);
  return { y, m: v.m, d: Math.min(v.d || ecDays(y, v.m), ecDays(y, v.m)) };
};

// Local fonts (SIL OFL), from the widget's own server. @font-face does not work inside a shadow root, so it goes in the host page,
// once. unicode-range: the Ethiopic font (75 kB) only downloads when Ge'ez text is shown.
function loadFonts() {
  if (typeof document === 'undefined' || !SRC || document.getElementById('db-form-fonts')) return;
  const b = new URL('fonts/', SRC).href, ff = (fam, file, w, range) => `@font-face{font-family:'${fam}';src:url(${b}${file}) format('woff2');font-weight:${w};font-display:swap${range ? ';unicode-range:' + range : ''}}`;
  const eth = 'U+030E,U+1200-1399,U+2D80-2DDE,U+AB01-AB2E', lat = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD';
  const st = document.createElement('style'); st.id = 'db-form-fonts';
  st.textContent = [ff('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff2', 400, lat), ff('Atkinson Hyperlegible', 'atkinson-hyperlegible-latin-700-normal.woff2', 700, lat),
    ff('Noto Sans Ethiopic', 'noto-sans-ethiopic-ethiopic-400-normal.woff2', 400, eth), ff('Noto Sans Ethiopic', 'noto-sans-ethiopic-ethiopic-700-normal.woff2', 700, eth)].join('\n');
  document.head.appendChild(st);
}

// Answers that could not be sent (offline) wait here and are sent when the connection comes back.
async function flushQueue(el) {
  const q = store.get(QUEUE) || [], keep = [];
  if (!q.length || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
  for (const it of q) {
    try {
      const r = await fetch(it.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it.body) });
      // 4xx will never succeed, so it is dropped; the person was told when they sent it.
      if (r.status >= 500) keep.push(it);
      else if (el) el.dispatchEvent(new CustomEvent('db-sent', { detail: { ok: r.ok, flow: it.flow }, bubbles: true, composed: true }));
    } catch (x) { keep.push(it); }
  }
  if (keep.length) store.set(QUEUE, keep); else store.del(QUEUE);
  if (el && keep.length < q.length) el.say(el.u('sentLater'));
}

class DbForm extends HTMLElement {
  // The design system, for host pages and the design-system proof page: one source of truth for tokens, themes and icons.
  static get design() { return { THEMES, TOKENS, SWATCH, CSS, ICONS: P, svg }; }
  // Ethiopian calendar helpers, for host pages and tests.
  static get calendar() { return { toEC, fromEC, ecDays, ecLeap, ecText, months: EC_MONTHS }; }
  // Plug in a different speech recogniser (for example a self-hosted one). Use it with asr='name' on the tag.
  static registerASR(name, factory) { if (name && typeof factory === 'function' && name !== 'off') ASR[name] = factory; }
  // Send any answers saved while offline now (also runs automatically when the connection returns).
  static flushQueue(el) { return flushQueue(el); }
  static get observedAttributes() { return ['lang', 'theme']; }
  static flow = 'signup';
  constructor() { super(); this.r = this.attachShadow({ mode: 'open' }); this.i = 0; this.a = {}; this.err = ''; this.done = false; this.moved = false; this.vok = false; this.pref = {}; this.jobs = null; this.welcome = false; this.vm = false; this.rm = false; this.cp = false; this.aud = null; this.ra = 0; this.manual = false; this.rec = null; this.vrec = null; this.vno = false; this.vtries = 0; this.tok = 0; this.rs = 0; this.fromReview = false; this.noticed = false; this.hide = []; this.consent = { a: false, s: false }; }
  // A host page can change the language or theme at any time (for example from its own nav) without losing answers.
  attributeChangedCallback(n, o, v) {
    if (!this.f || o === v) return;
    if (n === 'lang' && LANG_RE.test(v || '') && v !== this.l) {
      if (this.lp) return this.chooseLang(v);
      if (!this.welcome && !this.done) this.keep(this.steps[this.i]);
      this.l = v; this.err = ''; this.moved = true; this.draw();
    }
    if (n === 'theme' && THEMES.includes(v) && !this.userTheme) { this.theme = v; const s = this.r.querySelector('section'); if (s) s.dataset.theme = v; }
  }
  // Speech recognition goes through the router (asr attribute). null = none available.
  recog(lang) { const n = this.getAttribute('asr') || 'browser'; if (n === 'off') return null; return (ASR[n] || ASR.browser)(lang, this); }
  canHear() { const n = this.getAttribute && this.getAttribute('asr'); if (n === 'off') return false; if (n && ASR[n] && n !== 'browser') return true; return !!HASV(); }
  get draftKey() { return 'db-form-draft:' + (this.getAttribute('flow') || this.constructor.flow); }
  saveDraft() {
    if (this.done || this.welcome || !Object.keys(this.a).length) return;
    store.set(this.draftKey, { v: 1, a: this.a, i: this.i, l: this.l, pref: this.pref, at: Date.now() });
  }
  dropDraft() { store.del(this.draftKey); this.draft = null; }
  connectedCallback() {
    if (this.f) { window.addEventListener('online', this.onOnline); return; } // moved within the page: keep the current state
    if (this.getAttribute('fonts') !== 'no') loadFonts();
    const sw = this.getAttribute('sw');
    if (sw && typeof navigator !== 'undefined' && navigator.serviceWorker) navigator.serviceWorker.register(sw, { updateViaCache: 'none' }).catch(() => { /* drafts still work without it */ });
    const d = store.get(this.draftKey);
    this.draft = d && d.v === 1 && Date.now() - d.at < DRAFT_DAYS * 864e5 ? d : null;
    if (d && !this.draft) this.dropDraft();
    this.onOnline = () => flushQueue(this);
    window.addEventListener('online', this.onOnline);
    flushQueue(this);
    this.f = FLOWS[this.getAttribute('flow')] || FLOWS[this.constructor.flow] || FLOWS.signup; this.l = LANG_RE.test(this.getAttribute('lang') || '') ? this.getAttribute('lang') : 'en';
    this.welcome = true;
    // Language page first, in English. A site that already knows the language can skip it with lang-ask='no'.
    this.lp = this.getAttribute('lang-ask') !== 'no';
    let saved = null; try { saved = localStorage.getItem('db-form-theme'); } catch (x) { /* storage blocked */ }
    this.userTheme = THEMES.includes(saved);
    this.theme = THEMES.includes(saved) ? saved : THEMES.includes(this.getAttribute('theme')) ? this.getAttribute('theme') : 'auto';
    if (this.lp) this.l = 'en';
    this.hide = (this.getAttribute('hide') || '').split(',').map(x => x.trim()).filter(x => x && !['fullName', 'role', 'job'].includes(x));
    // Larger text chosen in the Display menu (or in the first question) is kept on this device.
    { const v = +store.get('db-form-speed'), h = +this.getAttribute('speed'); this.speed = SPEEDS.includes(v) ? v : SPEEDS.includes(h) ? h : SPEED_DEFAULT; }
    { const z = +store.get('db-form-size'); this.size = SIZES.includes(z) ? z : store.get('db-form-large') ? 1.5 : 1; this.pref.large = this.size > 1; this.announceSize(); }
    // Chrome loads its list of device voices late: ask for it now, so the first page knows whether a voice exists.
    if (typeof window !== 'undefined' && window.speechSynthesis) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices()); } catch (x) { /* old browsers */ } }
    this.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.active()) { e.preventDefault(); if (this.welcome && this.ra < 2) { this.stopRA(); this.say(this.u('stopped')); } else this.stopRead(); return; }
      // Modifier keys alone (e.g. Alt+Shift or Win+Space to switch keyboard layout) and IME key events do not stop the voice.
      if (QUIET_KEYS.includes(e.key) || e.isComposing || e.keyCode === 229) return;
      const t = e.composedPath ? e.composedPath()[0] : e.target, opt = t && t.name === 'f' && (t.type === 'radio' || t.type === 'checkbox');
      // Enter on a choice chooses it (people expect this; the browser would send the page instead and show "please answer").
      // Enter on a choice that is already chosen goes on to the next question. Space ticks and unticks, as usual.
      if (e.key === 'Enter' && opt && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); this.kbd = Date.now(); if (this.vrec) this.stopVoice();
        if (t.checked) { this.next(this.steps[this.i]); return; }
        t.checked = true;
        t.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      // Enter on every other tick box or choice (the consent boxes on the review page, colours, text size, voice speed)
      // ticks or chooses it too, as the keyboard help says. The browser would do nothing.
      if (e.key === 'Enter' && t && (t.type === 'checkbox' || t.type === 'radio') && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); this.kbd = Date.now(); if (this.vrec) this.stopVoice();
        if (t.type === 'checkbox') t.checked = !t.checked; else if (!t.checked) t.checked = true; else return;
        t.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      // Tab and Shift+Tab visit every radio choice, one by one, like the checkboxes (the browser would jump over the group).
      // The arrow keys still work as usual.
      if (e.key === 'Tab' && opt && t.type === 'radio' && !e.ctrlKey && !e.altKey) {
        const all = [...this.r.querySelectorAll('input[name=f]')], n = all.indexOf(t) + (e.shiftKey ? -1 : 1);
        if (n >= 0 && n < all.length) { e.preventDefault(); this.kbd = Date.now(); if (this.vrec) this.stopVoice(); all[n].focus(); return; }
      }
      // Tab, Shift+Tab, arrows (radio groups) and Space (tick a box) move or change the focus: stop listening so the mic does not hear the read-out.
      if (NAV_KEYS.includes(e.key)) { this.kbd = Date.now(); if (this.vrec) this.stopVoice(); if (this.welcome && this.ra < 2) this.stopRA(); return; }
      if (this.welcome && this.ra < 2) this.stopRA();
      else if (this.vrec) this.stopVoice();
    });
    // Tab / Shift+Tab: read the newly focused control aloud, in the chosen language.
    this.r.addEventListener('focusin', e => { if (Date.now() - (this.kbd || 0) < 600) this.readFocus(e.target); });
    // Space on a checkbox changes it without moving focus: read the new state.
    // Space or Enter on a choice changes it without moving focus: read the new state. (Radios too: the arrow keys and Enter
    // change them, and the focus event alone can come before the new state.)
    this.r.addEventListener('change', e => { if ((e.target.type === 'checkbox' || e.target.type === 'radio' || e.target.tagName === 'SELECT') && e.target.name !== 'th' && Date.now() - (this.kbd || 0) < 600) this.readFocus(e.target); });
    // Typing with an input method (Ge'ez, Keyman, phone keyboards): Enter that ends a composition must not submit the form.
    this.r.addEventListener('compositionstart', () => { this.composing = true; });
    this.r.addEventListener('compositionend', () => { this.composedAt = Date.now(); this.composing = false; });
    const api = this.getAttribute('api');
    if (this.f.steps.some(s => s.dyn) && api) {
      fetch(api + '/jobs').then(r => r.json()).then(j => { this.jobs = Array.isArray(j) ? j : null; }).catch(() => {}).finally(() => this.draw());
      // schema.org/JobPosting for search engines and job boards: the employer's published jobs only, never the learner's needs.
      if (this.getAttribute('jsonld') !== 'no' && !document.getElementById('db-jobposting'))
        fetch(api + '/jobs?format=jsonld').then(r => (r.ok ? r.text() : '')).then(t => {
          if (!t || document.getElementById('db-jobposting')) return;
          const s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'db-jobposting'; s.textContent = t; document.head.appendChild(s);
        }).catch(() => {});
    }
    else this.draw();
  }
  disconnectedCallback() { if (this.onOnline) window.removeEventListener('online', this.onOnline); this.halt(); }
  get steps() { return this.f.steps.filter(s => !(s.skip && s.skip(this.a)) && !this.hide.includes(s.id)).map(s => s.dyn ? this.dyn(s) : s); }
  dyn(s) {
    if (!this.jobs) return { ...s, type: 'text' };
    // The private filter runs here, on the device: the needs are never sent. If nothing fits, say so and show every job.
    const need = this.a.needs || [], ok = this.jobs.filter(j => need.every(n => (j.offers || []).includes(n)));
    const hint = need.length && !ok.length ? UI.noMatch : s.hint;
    return { ...s, hint, type: 'radio', options: (ok.length ? ok : this.jobs).map(j => [j.title, { en: j.title, ...(j.titles || {}), ...(j.titleAm ? { am: j.titleAm } : {}) }]) };
  }
  u(k, v) { let t = T(UI[k], this.l); for (const x in v) t = t.replace('{' + x + '}', v[x]); return t; }
  sl() { return LANG(this.l).sr; }
  // Does this device voice speak the current language? Voices report 2- or 3-letter codes (so-SO, som), so check every known prefix.
  vmatch(v, l = this.l) { const c = v.lang.toLowerCase(); return LANG(l).tts.some(p => c === p || c.startsWith(p + '-') || c.startsWith(p + '_')); }
  // Folder for recorded clips. Only supported languages ever reach the URL.
  al() { return LANG_RE.test(this.l) ? this.l : 'en'; }
  readDate() { const v = k => { const e = this.r.querySelector('#ec' + k); return e ? +e.value || 0 : 0; }; return { y: v('y'), m: v('m'), d: v('d') }; }
  partner() { return this.getAttribute('partner') || this.u('org'); }
  todayText() {
    const g = new Date(), u = new Date(Date.UTC(g.getFullYear(), g.getMonth(), g.getDate()));
    let gs; try { gs = u.toLocaleDateString(this.l === 'en' ? 'en-GB' : this.l + '-ET', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (x) { gs = isoOf(u); }
    return this.u('today', { e: ecText(toEC(u), this.l), g: gs });
  }
  dateHTML(v) {
    v = v && typeof v === 'object' ? v : {};
    const cur = toEC(), inv = this.err ? " aria-invalid='true'" : '', o = (val, txt, sel) => `<option value='${val}'${sel ? ' selected' : ''}>${esc(txt)}</option>`;
    const days = [o(0, this.u('notSure'), !v.d), ...Array.from({ length: 30 }, (x, k) => o(k + 1, k + 1, v.d === k + 1))].join('');
    const months = [o(0, this.u('notSure'), !v.m), ...(EC_MONTHS[this.l] || EC_MONTHS.en).map((m, k) => o(k + 1, m, v.m === k + 1))].join('');
    const years = [o(0, this.u('notSure'), !v.y), ...[cur.y, cur.y + 1, cur.y + 2].map(y => o(y, y, v.y === y))].join('');
    const sel = (id, k, opts) => `<label for='ec${id}'>${this.u(k)}<select id='ec${id}' aria-describedby='hint err'${inv}>${opts}</select></label>`;
    return `<div class='ecd' role='group' aria-labelledby='h'>${sel('d', 'day', days)}${sel('m', 'month', months)}${sel('y', 'year', years)}</div><p class='when'>${esc(this.todayText())}</p>`;
  }
  keep(s) {
    if (!s) return;
    if (s.type === 'ecdate') { this.a[s.id] = this.readDate(); return; }
    const f = this.r.querySelector('#f');
    if (f) { this.a[s.id] = f.value.normalize('NFC'); return; }
    const c = [...this.r.querySelectorAll('input[name=f]:checked')].map(x => x.value);
    if (s.type === 'radio') this.a[s.id] = c[0] || ''; else if (s.type === 'checkbox') this.a[s.id] = c;
  }

  show(x) {
    if (x.type === 'ecdate') { const v = this.a[x.id]; if (!v || !v.m) return this.u('skipped'); const r = ecResolve(v); return (v.d && v.y ? '' : this.u('about') + ' ') + ecText(r, this.l); }
    const v = this.a[x.id], nm = k => T((x.options.find(p => p[0] === k) || [])[1], this.l);
    const t = Array.isArray(v) ? v.map(nm).join(', ') : (x.options && v ? nm(v) : v);
    return t || this.u('skipped');
  }

  field(s, n) {
    const v = this.a[s.id] || (s.id === 'prefs' && this.size > 1 ? ['large'] : s.type === 'checkbox' ? [] : '');
    const inp = s.type === 'ecdate' ? this.dateHTML(this.a[s.id]) : s.type === 'text'
      ? `<input id='f' type='text' value='${esc(v)}' aria-labelledby='h' aria-describedby='hint err' ${this.err ? "aria-invalid='true'" : ''} lang='${this.l}' dir='auto' ${INPUT_HINTS[s.id] || "autocomplete='off' spellcheck='false'"}>`
      : `<div class='opts'>${s.options.map(([k, t]) => `<label class='opt'><input type='${s.type}' name='f' value='${esc(k)}' ${[].concat(v).includes(k) ? 'checked' : ''}>${this.pref.simple && P[k] ? `<span class='pic'>${I(k, 28)}</span>` : ''}<span>${esc(T(t, this.l))}</span><span class='tick'>${I('check', 20)}</span></label>`).join('')}</div>`;
    const mic = this.canHear() && !s.novoice ? this.micHTML() : '';
    return `<form novalidate><p class='step'><span>${esc(this.u('of', { n: this.i + 1, t: n }))}</span></p><div class='track' aria-hidden='true'><i style='width:${Math.round((this.i + 1) / n * 100)}%'></i></div>
      <fieldset><legend id='h' tabindex='-1'>${esc(T(s.q, this.l))}</legend><p id='hint'>${esc(T(s.hint, this.l))}</p>${mic}${inp}
      ${this.errHTML()}</fieldset>
      <div class='row'><button class='p' data-next>${this.u('next')}${I('next', 20)}</button>${s.optional ? `<button type='button' data-skip>${this.u('skip')}</button>` : ''}${this.i ? `<button type='button' data-back>${I('back', 20)}${this.u('back')}</button>` : ''}<button type='button' class='q' data-read>${I('speaker', 20)}${this.u('read')}</button></div></form>`;
  }

  // Consent, on the review page: required to send; support choices need a second, separate tick.
  consentHTML() {
    const bad = this.err && this.errKey === 'consentNeed', sup = this.f === FLOWS.signup && this.supportChosen().length;
    const box = (k, text, extra = '') => `<label class='opt'><input type='checkbox' data-consent='${k}' ${this.consent[k] ? 'checked' : ''} ${extra}><span>${esc(text)}</span><span class='tick'>${I('check', 20)}</span></label>`;
    return `<fieldset class='consent'><legend>${this.u('consentH')}</legend>${box('a', this.u('consentSend', { p: this.partner() }), "id='cons'" + (bad ? " aria-invalid='true' aria-describedby='err'" : ''))}${sup ? box('s', this.u('consentSupport')) : ''}<p>${this.u('consentNote')}</p></fieldset>`;
  }
  resume() {
    const d = this.draft; if (!d) return this.startForm(false);
    this.stopRA(); this.a = d.a || {}; this.pref = d.pref || {}; this.draft = null; this.welcome = false;
    this.i = Math.max(0, Math.min(+d.i || 0, this.steps.length)); this.moved = true; this.draw();
  }

  // Error box: icon + text (never colour alone). Empty = hidden, but it stays in the page so role=alert announces changes.
  errHTML() { return `<div id='err' class='err' role='alert'>${this.err ? I('alert', 22) + `<span>${esc(this.err)}</span>` : ''}</div>`; }

  // The first page: choose a language. The question is in English; each language also invites its own speakers in its own words.
  langHTML() {
    const help = LANGS.filter(x => x.id !== 'en').map(x => `<li lang='${x.id}'>${esc(UI.langSelf[x.id])}</li>`).join('');
    const btn = x => `<button type='button' class='big pick' data-pick='${x.id}' lang='${x.id}'><span>${esc(x.name)}</span>${x.id === 'en' ? '' : `<small lang='en'>${esc(x.en)}</small>`}</button>`;
    return `<div class='head'>${LOGO}<h2 id='h' tabindex='-1'>${esc(UI.langH.en)}</h2></div><ul class='langhelp'>${help}</ul><div class='row' role='group' aria-labelledby='h'>${LANGS.map(btn).join('')}</div>`;
  }

  welcomeHTML() {
    if (this.lp) return this.langHTML();
    if (this.ra < 2) return `<div class='head'>${LOGO}<h2 id='h' tabindex='-1'>${this.u(this.ra ? 'raAgain' : 'raAsk')}</h2>${this.ra ? '' : `<p>${this.u('raHint')}</p>`}</div>${this.ra ? '' : `<p class='privacy'>${this.u('raPrivacy')}</p>`}<div class='row'><button type='button' class='p big' data-ra='y'>${I('speaker')}${this.u('raYes')}</button><button type='button' class='big' data-ra='n'>${this.u('raNo')}</button></div>`;
    if (this.draft) return `<div class='head'>${LOGO}<h2 id='h' tabindex='-1'>${this.u('draftH')}</h2><p>${this.u('draftP')}</p></div>
      <div class='row'><button type='button' class='p big' data-resume>${this.u('draftGo')}${I('next', 20)}</button><button type='button' class='big' data-start='t' data-fresh>${this.u('restart')}</button>
      ${this.rm ? `<button type='button' class='big' data-stoprm>${I('stop')}${this.u('stopRead')}</button>` : `<button type='button' class='big' data-rm>${I('speaker')}${this.u('readToMe')}</button>`}</div>`;
    return `<div class='head'>${LOGO}<h2 id='h' tabindex='-1'>${this.u('welcomeH')}</h2><p>${this.u('welcomeP')}</p></div>
      <div class='row'><button type='button' class='p big' data-start='t'>${this.u('start')}${I('next', 20)}</button>
      ${this.canHear() ? `<button type='button' class='big' data-start='v'>${I('mic')}${this.u('startVoice')}</button>` : ''}
      ${this.rm ? `<button type='button' class='big' data-stoprm>${I('stop')}${this.u('stopRead')}</button>` : `<button type='button' class='big' data-rm>${I('speaker')}${this.u('readToMe')}</button>`}</div>`;
  }

  pageText(s, noErr) {
    const l = this.l, n = k => this.u(k), v = this.rm && this.canHear(), err = this.err && !noErr ? this.err + ' ' : '';
    const j = a => a.filter(Boolean).map(x => (/[.?!።]$/.test(x) ? x : x + '.')).join(' ');
    if (this.done) return j([n(this.queued ? 'queued' : 'thanks'), this.receipt ? this.u('receipt', { r: this.receipt.split('').join(' ') }) : '']);
    if (this.lp) return UI.langAsk.en;
    if (this.welcome && this.draft) return j([n('draftH'), n('draftP'), n('draftGo'), n('restart')]);
    if (this.welcome) return j([n('welcomeH'), n('welcomeP'), n('start'), n('startVoice'), n('readToMe'), n('keysSay'), v ? n('sayWelcome') : '']);
    if (!s) {
      if (this.rs) return err + n('reviewFix');
      const rv = this.steps.filter(x => !x.local);
      return err + j([n('review'), ...rv.map((x, k) => (k + 1) + ': ' + T(x.q, l) + ': ' + this.show(x)), n('reviewKeys'), this.u('consentSend', { p: this.partner() }), n('reviewAsk')]);
    }
    const opts = (s.options || []).map((p, i) => (v ? (i + 1) + ': ' : '') + T(p[1], l));
    const f = this.i ? '' : '1', ins = !v ? '' : s.novoice ? n('sayType') : s.type === 'text' ? n('sayText' + f) : n('sayChoose' + f) + (s.optional ? ' ' + n('saySkip') : '');
    return err + j([T(s.q, l), T(s.hint, l), ...opts, ins]);
  }

  // Language page, spoken. People answer as soon as they hear their own language, so the page does not wait until the
  // end: after the English question, and after each language's own invitation, there is a beep and a short listening
  // window (LANG_WINDOW) with a recogniser that suits that language (LANG_EAR). Any language name counts in any window.
  // If nothing is caught, it asks once more in English and Amharic and listens with an Amharic recogniser.
  askLang() {
    if (this.manual || !this.lp) return;
    this.say(UI.langAsk.en);
    this.langMicOff = false;
    let n = 0;
    const step = () => {
      if (this.manual || !this.lp) return;
      if (n >= LANGS.length) return this.langAgain();
      const x = LANGS[n++], item = x.id === 'en' ? { l: 'en', id: 'langAsk', t: UI.langAsk.en } : { l: x.id, id: 'langSelf', t: UI.langSelf[x.id] };
      this.playList([item], () => {
        if (this.langMicOff || !this.canHear()) return step();
        const k = this.tok; this.beep();
        setTimeout(() => { if (k === this.tok) this.listenLang(LANG_EAR[x.id], step, LANG_WINDOW); }, 250);
      });
    };
    step();
  }
  langAgain() {
    if (this.manual || !this.lp || this.langMicOff || !this.canHear()) return;
    const none = () => { this.say(UI.langNone.en); this.playList([{ l: 'en', id: 'langNone', t: UI.langNone.en }]); };
    this.say(UI.langAgain.en + ' ' + UI.langAgain.am);
    this.playList([{ l: 'en', id: 'langAgain', t: UI.langAgain.en }, { l: 'am', id: 'langAgain', t: UI.langAgain.am }], () => this.cue(() => this.listenLang(['am-ET', 'en-US'], none, 0), 'am'));
  }

  // Play clips that may be in different languages. A missing clip is read by a device voice for its language; if there is none, it is skipped.
  // caption: the text shown in the caption box (default: every item's text).
  playList(items, cb, caption) {
    const base = this.getAttribute('audio'), k = ++this.tok, vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (this.aud) this.aud.pause(); this.stopDigits();
    if (window.speechSynthesis) speechSynthesis.cancel();
    items = items.filter(x => x && x.t != null && /[\p{L}\p{N}]/u.test(String(x.t))); // nothing to say in "." or ""
    let n = 0;
    const url = x => (base && x && x.id ? base + '/' + (LANG_RE.test(x.l) ? x.l : 'en') + '/' + x.id + '.mp3' : null);
    this.cap('speaking', caption || items.map(x => x.t).join(' · '), items.length && items.every(x => x.l === items[0].l) ? items[0].l : null);
    const go = () => {
      if (k !== this.tok) return;
      if (n >= items.length) { this.cap('idle'); if (cb) cb(); return; }
      const it = items[n++], src = url(it);
      preload(url(items[n]));
      if (it.digits) { this.playDigits(it, go, k); return; }
      let used = false;
      const fb = () => {
        if (used || k !== this.tok) return; used = true;
        const v = vs.find(x => this.vmatch(x, it.l)), en = it.any && !v && vs.find(x => this.vmatch(x, 'en'));
        if (!window.speechSynthesis || (vs.length && !v && !en)) { go(); return; }
        // No voice for this language: an English voice reads the name or answer, Ge'ez spelled in Latin letters.
        const u = new SpeechSynthesisUtterance(en ? romanize(it.t) : it.t);
        u.lang = en ? 'en-US' : LANG(it.l).sr; u.rate = this.speed || 1; if (v || en) u.voice = v || en; u.onend = go; u.onerror = go; speechSynthesis.speak(u);
      };
      if (!src || CLIP_MISSING.has(src)) { fb(); return; }
      const a = this.aud = clipAudio(src);
      a.defaultPlaybackRate = a.playbackRate = this.speed || 1; a.preservesPitch = true;
      a.onended = () => { if (!used) { used = true; go(); } }; a.onerror = fb; a.play().catch(fb);
    };
    go();
  }

  // A phone number as one recording: the digit clips (n0-n9), cut to the voice, with a short even gap between digits and
  // a longer one between groups. Without Web Audio or clips, the digits are played one by one instead.
  playDigits(it, done, k) {
    const base = this.getAttribute('audio'), C = window.AudioContext || window.webkitAudioContext, l = LANG_RE.test(it.l) ? it.l : 'en';
    const oneByOne = () => this.playList([...it.digits].map(d => ({ l, id: 'n' + d, t: d })), done);
    if (!base || !C) return oneByOne();
    const ctx = this.ac || (this.ac = new C());
    Promise.all([...it.digits].map(d => digitBuf(ctx, base + '/' + l + '/n' + d + '.mp3'))).then(parts => {
      if (k !== this.tok) return;
      const rate = parts[0].rate, groups = phoneGroups(it.digits), ends = new Set(); let c = 0;
      groups.forEach(g => { c += g.length; ends.add(c - 1); });
      const gap = i => Math.round(rate * (i === parts.length - 1 ? 0 : ends.has(i) ? 0.38 : 0.07) / (this.speed || 1));
      const out = ctx.createBuffer(1, parts.reduce((t, p, i) => t + p.data.length + gap(i), 0), rate), ch = out.getChannelData(0);
      let at = 0; parts.forEach((p, i) => { ch.set(p.data, at); at += p.data.length + gap(i); });
      const src = this.digitSrc = ctx.createBufferSource(); src.buffer = out; src.connect(ctx.destination);
      src.onended = () => { if (this.digitSrc === src) this.digitSrc = null; if (k === this.tok) done(); };
      if (ctx.state === 'suspended') ctx.resume();
      src.start();
    }).catch(() => { if (k === this.tok) oneByOne(); });
  }
  stopDigits() { const s = this.digitSrc; this.digitSrc = null; if (s) { s.onended = null; try { s.stop(); } catch (x) { /* already stopped */ } } }

  // What to say when a control gets keyboard focus: [{ l: language, id: clip id (null = device voice only), t: text }].
  focusItems(el) {
    const l = this.l, it = (id, t, lang = l) => ({ l: lang, id, t });
    if (!el || !el.dataset) return [];
    const d = el.dataset, s = this.welcome ? null : this.steps[this.i];
    if (d.pick || d.lang) { const x = LANG(d.pick || d.lang); return [it('langName', x.name, x.id)]; }
    if (d.ra) return [it(d.ra === 'y' ? 'b_raYes' : 'b_raNo', this.u(d.ra === 'y' ? 'raYes' : 'raNo'))];
    if ('fresh' in d) return [it('b_restart', this.u('restart'))];
    if ('resume' in d) return [it('b_draftGo', this.u('draftGo'))];
    const state = () => it(el.checked ? 'sel' : 'unsel', this.u(el.checked ? 'sel' : 'unsel'));
    if (d.consent) return [...this.consentItems(d.consent), state()];
    if (el.name === 'sp') return [it(null, this.u('voiceSpeed')), { l, id: null, t: el.value, any: true }, state()];
    if (el.name === 'ts') return [it('textSize', this.u('textSize')), { l, id: null, t: Math.round(+el.value * 100) + '%', any: true }, state()];
    if (el.tagName === 'SUMMARY') return [it('display', this.u('display'))];
    if (el.tagName === 'SELECT') { const lab = el.closest('label'); return [{ l, id: null, t: lab ? lab.firstChild.textContent : '', any: true }, { l, id: null, t: el.selectedOptions[0] ? el.selectedOptions[0].textContent : '', any: true }]; }
    if (d.start) return [it(d.start === 'v' ? 'b_startVoice' : 'b_start', this.u(d.start === 'v' ? 'startVoice' : 'start'))];
    if (el.name === 'f' && s && s.options) {
      const n = s.options.findIndex(p => p[0] === el.value);
      if (n < 0) return [];
      // Job titles change, so they have no clip: a voice reads them (never silent: see playList).
      const name = s.dyn ? { l, id: null, t: T(s.options[n][1], l), any: true } : it('o_' + s.id + '_' + el.value, T(s.options[n][1], l));
      return [it('n' + (n + 1), String(n + 1)), name, it(el.checked ? 'sel' : 'unsel', this.u(el.checked ? 'sel' : 'unsel'))];
    }
    if (el.id === 'f' && s) return [it('q_' + s.id, T(s.q, l)), ...(el.value.trim() ? this.valueItems(el.value.trim(), s) : [])];
    const k = Object.keys(BTN).find(x => x in d);
    if (k === 'edit') { const rv = this.steps.filter(x => !x.local), n = rv.indexOf(this.steps[+d.edit]) + 1; return [it('b_change', this.u('change')), it('n' + n, String(n))]; }
    if (k) return [it('b_' + BTN[k], this.u(BTN[k]))];
    if (el.name === 'th') return [it('th_' + el.value, this.u('th_' + el.value)), state()];
    const t = (el.textContent || '').trim();
    return t ? [it(null, t)] : [];
  }

  // ---- Spoken lists built from recorded clips. Each item: { l: language, id: clip (null = device voice), t: text,
  // any: true = the text is the person's own answer or a name: if there is no voice for the language, an English voice
  // reads it (Ge'ez is spelled in Latin letters first), so it is never silent }.
  // The consent sentence, around the partner's name: recorded clips before and after it, the name itself by a voice.
  consentItems(k) {
    const l = this.l, it = (id, t, any) => ({ l, id, t, any });
    if (k === 's') return [it('consentSupport', this.u('consentSupport'))];
    const p = this.getAttribute('partner');
    if (!p) return [it('consentOrg', this.u('consentSend', { p: this.u('org') }))];
    const [a, b] = T(UI.consentSend, l).split('{p}');
    return [it('consentSendA', a), it(null, p, true), ...(/[\p{L}]/u.test(b) ? [it('consentSendB', b)] : [])];
  }
  // A typed or spoken answer: a phone number digit by digit (clips n0-n9), anything else by a voice.
  valueItems(v, s) {
    const l = this.l, t = String(v == null ? '' : v).trim();
    // A phone number: one item; playList joins the digit clips into one smooth recording, grouped like 0902 57 65 70.
    if (s && s.spoken === 'contact' && /^[0-9+\s-]+$/.test(ascii(t))) { const ds = ascii(t).replace(/\D/g, ''); return ds ? [{ l, id: null, digits: ds, t: phoneGroups(ds).join(' ') }] : []; }
    return t ? [{ l, id: null, t, any: true }] : [];
  }
  // The answer to one question, as it is shown on the review page.
  answerItems(x) {
    const l = this.l, v = this.a[x.id], skipped = [{ l, id: 'skipped', t: this.u('skipped') }];
    const nm = k => T((x.options.find(p => p[0] === k) || [])[1], l);
    if (x.type === 'ecdate') return v && v.m ? [{ l, id: null, t: this.show(x), any: true }] : skipped;
    if (Array.isArray(v)) return v.length ? v.map(k => ({ l, id: 'o_' + x.id + '_' + k, t: nm(k) })) : skipped;
    if (!v) return skipped;
    if (x.options && x.dyn) return [{ l, id: null, t: nm(v) || v, any: true }]; // job titles change, so a voice reads them
    if (x.options) return [{ l, id: 'o_' + x.id + '_' + v, t: nm(v) }];
    return this.valueItems(v, x);
  }
  // The whole review page: heading, then each answer numbered as on screen, then the consent sentence and the question.
  reviewItems() {
    const l = this.l, rv = this.steps.filter(x => !x.local);
    return [{ l, id: 'reviewH', t: this.u('review') },
      ...rv.flatMap((x, k) => [{ l, id: 'n' + (k + 1), t: String(k + 1) }, { l, id: 'q_' + x.id, t: T(x.q, l) }, ...this.answerItems(x)]),
      { l, id: 'reviewKeys', t: this.u('reviewKeys') }, ...this.consentItems('a'), { l, id: 'reviewAsk', t: this.u('reviewAsk') }];
  }
  // "We heard: ... Say Next to continue, or say your answer again." If no voice at all can say the answer, say so instead.
  heardItems(v, s) {
    const l = this.l, mid = this.valueItems(v, s);
    const silent = mid.some(x => !x.id && !x.digits) && !this.canSay(l) && !this.canSay('en');
    return silent ? [{ l, id: 'heardGeneric', t: this.u('heardGeneric') }] : [{ l, id: 'heardA', t: this.u('heardA') }, ...mid, { l, id: 'heardB', t: this.u('heardB') }];
  }
  canSay(l) { const vs = window.speechSynthesis ? speechSynthesis.getVoices() : []; return vs.some(v => this.vmatch(v, l)); }

  // Read the focused control, but only while the voice is in use (language page, the "read aloud?" question, or Read to me mode).
  readFocus(el) {
    if (!(this.lp || (this.welcome && this.ra < 2) || this.rm)) return;
    const items = this.focusItems(el);
    if (items.length) this.playList(items);
  }

  // Before the microphone opens: say "Speak now" in the chosen language, then a short beep, then listen.
  cue(cb, l = this.l) {
    const t = T(UI.speakNow, l);
    this.say(t);
    this.playList([{ l, id: 'speakNow', t }], () => {
      const k = this.tok; this.beep();
      setTimeout(() => { if (k === this.tok) cb(); }, 300);
    });
  }

  beep() {
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const c = this.ac || (this.ac = new C()), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.2);
    } catch (x) { /* no sound is fine: the screen shows Listening */ }
    const c = this.r && this.r.querySelector && this.r.querySelector('#cap');
    if (c) { c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
  }

  // Which language did the person name? t is one transcript or the recogniser's list of guesses (best first).
  // A name counts in Latin letters (English name, own name, common mis-hearings, or a near miss) or in Ge'ez.
  pickLang(t) {
    for (const s of [].concat(t || [])) { const id = this.langOf(s); if (id) return id; }
    return '';
  }
  langOf(s) {
    const w = this.norm(s).split(' ').filter(Boolean), words = [...w, ...w.slice(1).map((x, k) => w[k] + x)]; // "a marina" -> "amarina"
    const has = x => words.some(y => (GEEZ.test(y) ? x.gz.some(g => y.startsWith(g)) : x.say.includes(y)));
    const exact = LANGS.filter(has);
    if (exact.length) return exact.length === 1 ? exact[0].id : '';
    const near = LANGS.filter(x => words.some(y => y.length >= 5 && !GEEZ.test(y) && x.say.some(z => z.length >= 5 && lev(fold(y), fold(z)) <= (fold(z).length >= 6 ? 1 : 0))));
    return near.length === 1 ? near[0].id : '';
  }

  // Listen once for a language name. srs: recogniser languages to try, in order (the next one if a language is not
  // supported). miss(): called when nothing usable was heard. ms: how long to wait for speech to begin once the
  // microphone is on (0 = as long as the browser waits). Once the person starts speaking, it waits for them to finish.
  listenLang(srs, miss, ms) {
    if (this.manual || !this.lp) return;
    const [sr, ...rest] = srs, rec = this.recog(sr);
    if (!rec) return miss();
    let fin = false, spoke = false, timer = null;
    const end = () => { fin = true; clearTimeout(timer); this.cap('idle'); if (this.rec === rec) this.rec = null; };
    const done = id => { if (fin || this.manual) return; end(); if (id) this.chooseLang(id); else miss(); };
    rec.onspeechstart = () => { spoke = true; clearTimeout(timer); };
    // The window starts when the microphone is really on (not while Chrome still asks for permission).
    rec.onaudiostart = () => { if (ms) timer = setTimeout(() => { if (spoke || fin || this.manual) return; end(); rec.onend = null; rec.onresult = null; try { rec.abort(); } catch (x) { /* ignore */ } miss(); }, ms); };
    rec.onresult = e => done(this.pickLang(alts(e)));
    rec.onerror = e => {
      if (fin) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { end(); this.langMicOff = true; this.say(UI.micblocked.en); miss(); }
      else if (e.error === 'language-not-supported' && rest.length) { end(); rec.onend = null; this.listenLang(rest, miss, ms); }
    };
    rec.onend = () => done('');
    this.rec = rec; this.cap('listening');
    try { rec.start(); } catch (x) { done(''); }
  }

  // A language was chosen (button or voice): switch, then ask "read aloud?" in that language.
  chooseLang(id) {
    this.stopRA();
    this.l = LANG_RE.test(id) ? id : 'en'; this.lp = false; this.manual = false; this.moved = true;
    this.draw();
    this.askRA();
  }

  askRA() {
    if (this.manual || !this.welcome || this.lp || this.ra > 1) return;
    const id = this.ra ? 'raAgain' : 'raAsk';
    this.speak(this.u(id) + (this.ra ? '' : ' ' + this.u('raHint') + ' ' + this.u('raPrivacy')), id, () => this.cue(() => this.hear()));
  }

  hear() {
    if (this.manual || this.ra > 1) return;
    const rec = this.recog(this.sl()); if (!rec) return;
    let fin = false;
    const finish = a => { if (!fin) { fin = true; this.raDone(a); } };
    rec.onresult = e => finish(this.ans(e.results[0][0].transcript));
    rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'language-not-supported') { fin = true; this.say(this.u(e.error === 'language-not-supported' ? 'nolang' : 'micblocked')); } };
    rec.onend = () => { this.cap('idle'); finish(''); };
    this.rec = rec; this.cap('listening');
    try { rec.start(); } catch (x) { /* the buttons still work */ }
  }

  ans(t) {
    const w = t.toLowerCase().split(/[\s.,!?፣።]+/);
    return w.some(x => NO.includes(x)) ? 'n' : w.some(x => YES.includes(x)) ? 'y' : '';
  }

  raDone(a) {
    if (this.ra > 1 || !this.welcome) return;
    this.moved = true;
    if (a === 'y') { this.ra = 2; this.rm = true; this.draw(); }
    else if (a === 'n') { this.ra = 2; this.rm = false; this.draw(); this.say(this.u('intro') + ' ' + this.u('keysSay')); }
    else if (this.ra === 0) { this.ra = 1; this.draw(); this.askRA(); }
    else { this.ra = 2; this.draw(); this.say(this.u('raNone')); }
  }

  stopRA() {
    this.manual = true; this.cap('idle');
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (this.aud) this.aud.pause(); this.stopDigits();
    if (this.rec) { this.rec.onend = null; this.rec.onerror = null; this.rec.onresult = null; try { this.rec.abort(); } catch (x) { /* ignore */ } }
  }

  say(t) { const x = this.r.querySelector('#live'); if (x) x.textContent = t; }

  draw() {
    if (this.moved) { this.halt(); this.sup = 0; }
    const st = this.steps, s = st[this.i];
    let b;
    if (this.done) b = `<div class='done'>${CHECK}<h2 id='h' tabindex='-1'>${this.u(this.queued ? 'queued' : 'thanks')}</h2>${this.receipt ? `<p>${this.u('receipt', { r: `<span class='receipt'>${esc(this.receipt)}</span>` })}</p>` : ''}<p class='when'>${esc(this.todayText())}</p>${this.mineHtml()}${this.canHear() && (this.canMine() || this.cont()) ? `<div class='revmic'>${this.micHTML()}</div>` : ''}${this.cont() ? `<div class='row'><button type='button' class='p big' data-continue>${this.u('next')}${I('next', 20)}</button></div>` : ''}</div>`;
    else if (this.welcome) b = this.welcomeHTML();
    else if (!s) {
      const rv = st.map((x, n) => [x, n]).filter(([x]) => !x.local);
      b = `<h2 id='h' tabindex='-1'>${this.u('review')}</h2><dl class='review'>${rv.map(([x, n], k) =>
        `<div class='item'><dt>${k + 1}. ${esc(T(x.q, this.l))}</dt><dd><span>${esc(this.show(x))}</span><button type='button' data-edit='${n}'>${this.u('change')}<span class='sr'> ${k + 1}</span></button></dd></div>`).join('')}</dl>
      <p class='after'>${this.u('reviewKeys')}</p>
      ${this.consentHTML()}
      <p class='after'>${this.u(this.rs ? 'reviewFix' : 'reviewAsk')}</p>
      ${this.canHear() ? `<div class='revmic'>${this.micHTML()}</div>` : ''}
      ${this.errHTML()}
      <div class='row'><button type='button' class='p big' data-send>${I('check')}${this.u('send')}</button>${this.rs ? '' : `<button type='button' class='big' data-nochange>${this.u('noChange')}</button>`}<button type='button' class='big' data-restart>${this.u('restart')}</button><button type='button' data-back>${I('back', 20)}${this.u('back')}</button></div>`;
    }
    else b = this.field(s, st.length);
    const sb = k => k === 'stop' ? `<button type='button' data-stoprm>${I('stop', 20)}${this.u('stopRead')}</button>` : `<button type='button' data-rm>${I('speaker', 20)}${this.u('readToMe')}</button>`;
    const tb = this.welcome ? (this.ra < 2 ? sb('stop') : '') : this.rm ? sb('stop') : sb('read');
    const tools = tb ? `<div class='tools'>${tb}</div>` : '';
    // On the language page the buttons themselves are the language choice, so the language buttons are not repeated there.
    const langs = this.lp ? '' : `<div class='lang' role='group' aria-label='Language'>${LANGS.map(x => `<button type='button' data-lang='${x.id}' lang='${x.id}' aria-pressed='${this.l === x.id}'>${x.name}</button>`).join('')}</div>`;
    // Display menu: colour themes, and larger text (also offered by the first sign-up question). Both are kept on this device.
    const disp = `<details class='disp'><summary>${I('palette', 20)}${this.u('display')}</summary><div class='panel'><fieldset><legend class='sr'>${this.u('colours')}</legend>${THEMES.map(t => `<label><input type='radio' name='th' value='${t}' ${this.theme === t ? 'checked' : ''}><span class='sw' aria-hidden='true'>${SWATCH[t].map(c => `<i style='background:${c}'></i>`).join('')}</span><span>${this.u('th_' + t)}</span></label>`).join('')}</fieldset><fieldset class='ts'><legend>${this.u('textSize')}</legend><div class='tsr'>${SIZES.map(z => `<label><input type='radio' name='ts' value='${z}' ${this.size === z ? 'checked' : ''}><span class='aa' aria-hidden='true' style='font-size:${0.75 + z * 0.25}em'>A</span><span>${z * 100}%</span></label>`).join('')}</div></fieldset><fieldset class='ts'><legend>${this.u('voiceSpeed')}</legend><div class='tsr'>${SPEEDS.map(z => `<label><input type='radio' name='sp' value='${z}' ${this.speed === z ? 'checked' : ''}><span>${z}×</span></label>`).join('')}</div></fieldset></div></details>`;
    // Keyboard help on every page, in the chosen language: what Tab, Shift+Tab, Space/Enter and Esc do.
    const keys = this.done ? '' : `<ul class='keys' aria-label='${esc(this.u('keysH'))}'><li class='kh' aria-hidden='true'>${esc(this.u('keysH'))}:</li><li><kbd>Tab</kbd> ${esc(this.u('keyTab'))}</li><li><kbd>Shift</kbd>+<kbd>Tab</kbd> ${esc(this.u('keyShiftTab'))}</li><li><kbd>Space</kbd>/<kbd>Enter</kbd> ${esc(this.u('keyEnter'))}</li><li><kbd>Esc</kbd> ${esc(this.u('keyEsc'))}</li></ul>`;
    // The caption box shows, as text, everything that is being spoken, and a clear "Listening" state (for deaf and hard-of-hearing people).
    // It is aria-hidden because screen-reader users already hear the same words; the short role=status line below is for them.
    const cap = `<div class='cap' id='cap' data-state='idle' aria-hidden='true'><span class='ic'></span><div><span class='k'></span><span class='t'></span></div><span class='lvl'><i></i><i></i><i></i><i></i></span></div>`;
    this.r.innerHTML = `<style>${CSS}</style><section lang='${this.l}' data-theme='${this.theme || 'auto'}'${this.sizeStyle()}><div class='bar'>${langs}${disp}</div>${keys}${tools}${cap}<p class='status' id='live' role='status'></p>${b}</section>`;
    this.bind(s);
    if (s && !this.welcome && !this.done) this.emit('step', { step: this.i + 1, of: st.length, id: s.id });
    if (!this.said) {
      this.said = true;
      const go = ms => setTimeout(() => { if (this.lp) this.askLang(); else if (this.welcome) this.askRA(); else this.say(this.u('intro')); }, ms);
      const ua = typeof navigator !== 'undefined' && navigator.userActivation, ev = ['keydown', 'pointerdown'];
      if (ua && !ua.hasBeenActive) {
        const once = () => { ev.forEach(t => document.removeEventListener(t, once, true)); go(150); };
        ev.forEach(t => document.addEventListener(t, once, true));
        this.say(this.lp ? UI.tapToHear.en : this.u('tapToHear'));
      } else go(800);
    }
    this.saveDraft();
    this.vtries = 0;
    const quiet = this.quiet; this.quiet = false;
    // Thank-you page: with a host "continue" address, ask "Say Next to continue" and listen, so nobody is moved on by a timer.
    const askNext = (this.cont() || this.canMine()) && this.canHear() && !this.vno ? () => this.doneAsk() : null;
    if (this.rm && this.moved && !quiet) this.readPage(s, this.done ? askNext : () => this.listenAnswer());
    else if (this.err && this.moved && !quiet && (this.vm || this.usedRead)) this.readErr();
  }

  // Events named as in the organisers' data contract: db-signup:step / :done / :support (db-job:…, db-employer:… for the
  // other flows). They bubble out of the shadow DOM, like db-complete.
  // Thank-you page: the learner can keep a copy of their answers, or delete them with the receipt (no account needed).
  mineHtml() {
    const api = this.getAttribute('api');
    if (this.mine === 'gone') return `<p id='mymsg' tabindex='-1' role='status'>${esc(this.u('myDeleted'))}</p>`;
    if (this.mine === 'sure') return `<div class='sure' role='group' aria-labelledby='sureq'><p id='sureq' tabindex='-1'><strong>${esc(this.u('mySure'))}</strong></p><div class='row'><button type='button' class='p' data-mydel-yes>${esc(this.u('myYes'))}</button><button type='button' data-mydel-no>${esc(this.u('myNo'))}</button></div></div>`;
    const dl = this.sent ? `<button type='button' data-mydl>${esc(this.u('myDownload'))}</button>` : '';
    const del = this.receipt && api ? `<button type='button' data-mydel>${esc(this.u('myDelete'))}</button>` : '';
    return dl || del ? `<div class='row'>${dl}${del}</div>${this.mine === 'fail' ? `<p class='err' role='alert'>${esc(this.u('myFail'))}</p>` : ''}` : '';
  }
  // The Speak button: on every question, and on the review page (say Yes to send, a number to change that answer).
  micHTML() { return `<button type='button' data-mic class='mic'><span class='lab'>${I('mic')}${this.u('speak')}</span><span class='lvl' aria-hidden='true'><i></i><i></i><i></i><i></i></span></button>`; }
  async delMine(voice) {
    const ok = await deleteByReceipt(this.getAttribute('api'), this.receipt);
    this.mine = ok ? 'gone' : 'fail'; this.draw(); this.focusIn(ok ? '#mymsg' : '[data-mydel]');
    const m = this.u(ok ? 'myDeleted' : 'myFail'); this.say(m); if (voice) { if (this.hasVoice()) this.speak(m, null); else this.cap('speaking', m, this.l); }
    if (ok) { this.dispatchEvent(new CustomEvent('db-deleted', { detail: { id: this.recId }, bubbles: true, composed: true })); this.sent = null; }
  }
  // Thank-you page by voice: what can be said here (Download, Delete, and Next when the host gave a "continue" address).
  // These sentences are new and have no recorded clip yet: a device voice reads them where the phone has one for this
  // language; otherwise they are shown as a caption, the listening tone plays and the form listens (no English notice).
  doneAsk() {
    const t = this.mine === 'sure' ? this.u('mySure') + ' ' + this.u('mySay') : [this.canMine() ? this.u('doneSay') : '', this.cont() ? this.u('doneNext') : ''].filter(Boolean).join(' ');
    if (!t) return null;
    if (this.mine !== 'sure' && !this.canMine()) return this.say2(t, 'doneNext');
    if (this.hasVoice()) return this.say2(t);
    this.say(t); this.cap('speaking', t, this.l); return this.cue(() => this.listen(true));
  }
  canMine() { return this.mine !== 'gone' && !!(this.sent || (this.receipt && this.getAttribute('api'))); }
  focusIn(sel) { const e = this.r.querySelector && this.r.querySelector(sel); if (e && e.focus) e.focus(); }
  emit(name, detail) {
    if (typeof this.dispatchEvent !== 'function') return;
    const flow = this.getAttribute('flow') || this.constructor.flow;
    this.dispatchEvent(new CustomEvent('db-' + flow + ':' + name, { detail, bubbles: true, composed: true }));
  }

  // Colour theme: the person's own choice (saved on this device) wins over the site's theme attribute.
  setTheme(t) {
    this.theme = THEMES.includes(t) ? t : 'auto';
    try { localStorage.setItem('db-form-theme', this.theme); } catch (x) { /* private mode: the choice lasts for this page only */ }
    const sec = this.r.querySelector('section'); if (sec) sec.dataset.theme = this.theme;
    // Tell the host page, so its header, nav and footer can use the same colours.
    this.dispatchEvent(new CustomEvent('db-theme', { detail: { theme: this.theme }, bubbles: true, composed: true }));
  }

  // Text size. The host page is told (event 'db-textsize', detail.scale). A host that enlarges its own page with it
  // (its header, nav and footer too) calls preventDefault(): the form's text is in rem, so it grows with the page and
  // must not be enlarged twice. Otherwise the form enlarges itself.
  announceSize() {
    if (typeof this.dispatchEvent !== 'function') return;
    const e = new CustomEvent('db-textsize', { detail: { scale: this.size }, bubbles: true, composed: true, cancelable: true });
    this.hostSized = !this.dispatchEvent(e);
  }
  sizeStyle() { return this.size > 1 && !this.hostSized ? ` style='font-size:calc(1.125rem * ${this.size})'` : ''; }
  setSize(z, quiet) {
    this.size = SIZES.includes(z) ? z : 1; this.pref.large = this.size > 1;
    store.set('db-form-size', this.size); store.del('db-form-large');
    this.announceSize();
    const sec = this.r.querySelector && this.r.querySelector('section');
    if (sec && !quiet) sec.style.fontSize = this.size > 1 && !this.hostSized ? `calc(1.125rem * ${this.size})` : '';
    const p = this.r.querySelector && this.r.querySelector('input[name=f][value=large]'); if (p && this.steps[this.i] && this.steps[this.i].id === 'prefs') p.checked = this.size > 1;
  }

  // Caption box. state: speaking | listening | idle.
  cap(state, text, lang) {
    const c = this.r && this.r.querySelector && this.r.querySelector('#cap'); if (!c) return;
    c.dataset.state = state;
    if (state === 'idle') return;
    c.querySelector('.ic').innerHTML = I(state === 'listening' ? 'mic' : 'speaker');
    c.querySelector('.k').textContent = state === 'listening' ? '' : this.u('reading');
    const t = c.querySelector('.t'); t.textContent = state === 'listening' ? this.u('listening') : text || '';
    if (lang) t.setAttribute('lang', lang); else t.removeAttribute('lang');
  }

  bind(s) {
    const q = x => this.r.querySelector(x), on = (x, fn) => q(x) && q(x).addEventListener('click', fn);
    if (q('form')) q('form').addEventListener('submit', e => { e.preventDefault(); if (this.composing || Date.now() - (this.composedAt || 0) < 80) return; this.next(s); });
    this.r.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { this.keep(s); this.l = b.dataset.lang; this.err = ''; this.moved = true; this.draw(); }));
    on('[data-back]', () => this.goBack(s));
    on('[data-skip]', () => this.skipStep(s));
    on('[data-read]', () => { this.usedRead = true; this.readPage(s); });
    on('[data-mic]', () => this.listen());
    on('[data-rm]', () => { this.rm = true; this.moved = true; this.draw(); });
    on('[data-stoprm]', () => { if (this.welcome && this.ra < 2) { this.stopRA(); this.say(this.u('stopped')); } else this.stopRead(); });
    this.r.querySelectorAll('input[name=th]').forEach(x => x.addEventListener('change', () => this.setTheme(x.value)));
    this.r.querySelectorAll('input[name=ts]').forEach(x => x.addEventListener('change', () => this.setSize(+x.value)));
    this.r.querySelectorAll('input[name=sp]').forEach(x => x.addEventListener('change', () => { this.speed = +x.value; store.set('db-form-speed', this.speed); if (this.aud) this.aud.playbackRate = this.speed; }));
    if (s && s.exclusive) this.r.querySelectorAll('input[name=f]').forEach(x => x.addEventListener('change', () => this.exclusive(s, x)));
    this.r.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => this.chooseLang(b.dataset.pick)));
    this.r.querySelectorAll('[data-ra]').forEach(b => b.addEventListener('click', () => { this.stopRA(); this.raDone(b.dataset.ra); }));
    on('[data-send]', () => this.send());
    on('[data-resume]', () => this.resume());
    on('[data-mydl]', () => saveAnswers(this.sent, this.receipt, this.r));
    on('[data-continue]', () => this.goOn());
    on('[data-mydel]', () => { this.mine = 'sure'; this.draw(); this.focusIn('#sureq'); });
    on('[data-mydel-no]', () => { this.mine = ''; this.draw(); this.focusIn('[data-mydel]'); });
    on('[data-mydel-yes]', () => this.delMine());
    this.r.querySelectorAll('[data-consent]').forEach(x => x.addEventListener('change', () => {
      this.consent[x.dataset.consent] = x.checked;
      if (x.dataset.consent === 'a' && x.checked && this.errKey === 'consentNeed') { this.err = ''; this.errKey = ''; const e = this.r.querySelector('#err'); if (e) e.textContent = ''; x.removeAttribute('aria-invalid'); }
    }));
    this.r.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => { if (b.hasAttribute('data-fresh')) { this.dropDraft(); this.a = {}; this.i = 0; } this.startForm(b.dataset.start === 'v'); }));
    this.r.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => this.edit(+b.dataset.edit)));
    on('[data-nochange]', () => { this.rs = 1; this.moved = true; this.draw(); });
    on('[data-restart]', () => this.restart());
    // After an error, focus the answer itself (never the hidden Colours radios), else the page heading.
    if (this.moved) ((this.err && (this.errKey === 'consentNeed' ? q('#cons') : s ? q('#f, input[name=f], #ecm') : null)) || q('#h')).focus();
  }

  next(s) {
    const c = [...this.r.querySelectorAll('input[name=f]:checked')].map(x => x.value); // only this question's choices, never the Colours radios
    const v = s.type === 'ecdate' ? this.readDate() : s.type === 'text' ? this.r.querySelector('#f').value.normalize('NFC').trim() : s.type === 'radio' ? (c[0] || '') : c;
    const empty = s.type === 'ecdate' ? !(v.m || v.d || v.y) : !v || !v.length;
    this.err = ''; this.errKey = '';
    if (empty && !s.optional) { this.err = this.u('need'); this.errKey = 'need'; }
    else if (!empty && s.check && !s.check(v)) { this.err = this.u(s.bad); this.errKey = s.bad; }
    else if (!empty && s.type === 'ecdate' && !v.m) { this.err = this.u('dateBad'); this.errKey = 'dateBad'; }
    this.a[s.id] = v; this.moved = true;
    if (s.id === 'prefs') { this.pref = { large: v.includes('large'), simple: v.includes('simple') }; if (this.pref.large !== this.size > 1) this.setSize(this.pref.large ? 1.5 : 1, true); }
    if (!this.err) this.advance();
    this.draw();
  }

  speak(t, id, cb) {
    const live = this.r.querySelector('#live'), base = this.getAttribute('audio'), k = ++this.tok;
    { const c = cb; cb = () => { if (k === this.tok) { this.cap('idle'); if (c) c(); } }; }
    if (this.aud) this.aud.pause(); this.stopDigits();
    if (window.speechSynthesis) speechSynthesis.cancel();
    live.textContent = this.u('reading');
    this.cap('speaking', t, this.l);
    const src = base && id && id !== 'review' ? base + '/' + this.al() + '/' + id + '.mp3' : null;
    if (src && !CLIP_MISSING.has(src)) {
      let used = false; const fb = () => { if (!used) { used = true; this.tts(t, live, cb); } };
      this.aud = clipAudio(src); this.aud.defaultPlaybackRate = this.aud.playbackRate = this.speed || 1; this.aud.onerror = fb; this.aud.onended = cb; this.aud.play().catch(fb); return;
    }
    this.tts(t, live, cb);
  }

  tts(t, live, cb) {
    if (!window.speechSynthesis) { live.textContent = this.u('novoice'); if (cb) cb(); return; }
    const vs = speechSynthesis.getVoices();
    if (vs.length && !vs.some(v => this.vmatch(v))) {
      live.textContent = this.u('novoicehere');
      if (!this.noticed && vs.some(v => v.lang.toLowerCase().startsWith('en'))) {
        this.noticed = true; const n = new SpeechSynthesisUtterance(UI.novoicehere.en); n.lang = 'en-US'; n.onend = () => { if (cb) cb(); }; speechSynthesis.speak(n); } else if (cb) cb();
      return;
    }
    const u = new SpeechSynthesisUtterance(t); u.lang = this.sl(); u.rate = this.speed || 1; if (cb) { u.onend = cb; u.onerror = cb; } speechSynthesis.speak(u);
  }

  // True while the form is reading, listening, or in hands-free mode.
  active() { return !!(this.rm || this.vrec || this.digitSrc || (window.speechSynthesis && speechSynthesis.speaking) || (this.aud && !this.aud.paused && !this.aud.ended)); }

  // Stop all speech and listening right now.
  halt() { this.tok++; if (window.speechSynthesis) speechSynthesis.cancel(); if (this.aud) this.aud.pause(); this.stopDigits(); this.stopVoice(); this.cap('idle'); }

  // The Stop reading button, the Escape key and the voice word "stop": stop now and leave hands-free mode.
  stopRead() { this.rm = false; this.moved = true; this.draw(); this.say(this.u('stopped')); }

  startForm(v) { this.stopRA(); this.vm = v; this.welcome = false; this.moved = true; this.draw(); }

  // Move on. When the person came from the review page to change one answer, go straight back to the review.
  advance() { this.i = this.fromReview ? this.steps.length : this.i + 1; this.fromReview = false; this.rs = 0; }

  skipStep(s) { this.a[s.id] = s.type === 'checkbox' ? [] : ''; this.err = ''; this.moved = true; this.advance(); this.draw(); }

  edit(n) { this.fromReview = true; this.rs = 0; this.i = n; this.err = ''; this.moved = true; this.draw(); }

  restart() { this.steps.forEach(x => { if (!x.local) delete this.a[x.id]; }); this.consent = { a: false, s: false }; this.i = 0; this.rs = 0; this.fromReview = false; this.err = ''; this.moved = true; this.draw(); }

  goBack(s) { this.keep(s); this.i--; this.rs = 0; this.fromReview = false; this.err = ''; this.moved = true; this.draw(); }

  stopVoice() {
    const r = this.vrec; this.vrec = null;
    if (r) { r.onend = null; r.onerror = null; r.onresult = null; try { r.abort(); } catch (x) { /* ignore */ } }
    const mb = this.r.querySelector('.mic'); if (mb) mb.classList.remove('on');
  }

  // Speech and keyboards produce different apostrophes (' ’ ʼ) and Ethiopic punctuation (፡ ፧): all become spaces.
  norm(t) { return String(t || '').normalize('NFC').toLowerCase().replace(/[.,!?፣።፤፦፡፧"'’‘ʼ`()\-]/g, ' ').replace(/\s+/g, ' ').trim(); }

  // Which options did the person say? By number ("2", "two", "ሁለት") or by name (best word match).
  pick(t, s) {
    const opts = s.options || [], w = t.split(' ').filter(Boolean), hit = [];
    const add = n => { if (n >= 1 && n <= opts.length && !hit.includes(n - 1)) hit.push(n - 1); };
    w.forEach(x => {
      const n = numOf(x, w.length === 1);
      // "1 2" said quickly often comes back as "12": with fewer choices than that, each digit is a choice.
      if (s.type === 'checkbox' && /^\d{2,}$/.test(x) && n > opts.length && [...x].every(d => +d >= 1 && +d <= opts.length)) [...x].forEach(d => add(+d));
      else add(n);
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

  // The recogniser's guesses, best first: take the first one that makes sense on this page (a command, a choice that
  // matches, a valid phone number or email, a yes/no or number on the review page). Free text: the first guess.
  bestAlt(list) {
    if (!list || list.length < 2) return (list && list[0]) || '';
    const s = this.steps[this.i], cmd = w => w.length <= (s && s.type === 'text' ? 1 : 3) && Object.keys(CMD).some(c => isCmd(c, w));
    // A command in any guess wins (on every page, the phone page too), then a guess that fits the page.
    const hit = list.find(x => cmd(this.norm(x).split(' ')));
    if (hit) return hit;
    const ok = x => {
      const t = this.norm(x), w = t.split(' ');
      if (!s) return !!this.ans(x) || w.some(y => /^\d+$/.test(y) || NUM[y]);
      if (s.spoken === 'contact') return !!s.check(spokenContact(x));
      if (s.type === 'text') return false;
      return cmd(w) || this.pick(t, s).length > 0;
    };
    return list.find(ok) || list[0];
  }

  // Start listening for the answer to the page that was just read aloud.
  listenAnswer() {
    if (!this.canHear() || this.vno || this.done || this.welcome && this.ra < 2) return;
    const cur = this.steps[this.i];
    if (cur && cur.novoice) return;
    this.cue(() => this.listen(true));
  }

  say2(m, id) { this.speak(m, id || null, () => this.cue(() => this.listen(true))); this.say(m); }

  // The host's "continue" attribute: where to go after the thank-you page, when the person chooses Next (button or voice).
  cont() { return (typeof this.getAttribute === 'function' && this.getAttribute('continue')) || ''; }
  // Fires db-continue (cancelable: a host can handle it itself), then opens the host's address. Never on a timer.
  goOn() {
    const url = this.cont(); this.halt();
    const go = this.dispatchEvent(new CustomEvent('db-continue', { detail: { id: this.recId, url }, bubbles: true, composed: true, cancelable: true }));
    if (go && url) window.location.assign(url);
  }

  hasVoice() { const vs = window.speechSynthesis ? speechSynthesis.getVoices() : []; return vs.some(v => this.vmatch(v)); }

  // Read the current page. An error is read first, from its own recorded clip, so it is heard even without a device voice.
  readPage(s, cb) {
    if (s && s.id === 'role' && s.options && !this.err) {
      const l = this.l;
      return this.playList([{ l, id: 'q_role', t: T(s.q, l) }, ...s.options.flatMap((p, k) => [{ l, id: 'n' + (k + 1), t: String(k + 1) }, { l, id: null, t: T(p[1], l), any: true }])], cb);
    }
    const id = this.done ? (this.queued ? 'queued' : 'done') : this.welcome ? (this.draft ? 'draftH' : 'welcome') : s ? s.id : this.rs ? 'reviewFix' : 'review';
    const ek = this.err && this.errKey && this.err === this.u(this.errKey) ? 'err' + this.errKey[0].toUpperCase() + this.errKey.slice(1) : null;
    // The review page has the person's own answers, so it cannot be one recording: it is put together from short clips
    // (heading, number, question, chosen option, digits, consent sentence) and a voice only for typed words such as a name.
    const go = id === 'review' ? () => this.playList(this.reviewItems(), cb, this.pageText(s, true)) : () => this.speak(this.pageText(s, !!ek), id, cb);
    if (ek) this.speak(this.err, ek, go); else go();
  }

  // Read only the error message (used when the person asked for voice help but is not in Read to me mode).
  readErr() {
    const ek = this.errKey && this.err === this.u(this.errKey) ? 'err' + this.errKey[0].toUpperCase() + this.errKey.slice(1) : null;
    this.speak(this.err, ek);
  }

  // Play several recorded clips one after another. If one is missing, read the whole message with the device voice instead.
  seq(ids, text, cb) {
    const base = this.getAttribute('audio'), live = this.r.querySelector('#live'), k = ++this.tok;
    if (this.aud) this.aud.pause(); this.stopDigits();
    if (window.speechSynthesis) speechSynthesis.cancel();
    { const c = cb; cb = () => { if (k === this.tok) { this.cap('idle'); if (c) c(); } }; }
    this.cap('speaking', text, this.l);
    if (!base) { this.tts(text, live, cb); return; }
    let n = 0, bad = false;
    const fail = () => { if (!bad && k === this.tok) { bad = true; this.tts(text, live, cb); } };
    const go = () => {
      if (k !== this.tok || bad) return;
      if (n >= ids.length) { if (cb) cb(); return; }
      const u = x => base + '/' + this.al() + '/' + x + '.mp3', src = u(ids[n++]);
      if (CLIP_MISSING.has(src)) { fail(); return; }
      if (n < ids.length) preload(u(ids[n]));
      const a = this.aud = clipAudio(src);
      a.defaultPlaybackRate = a.playbackRate = this.speed || 1;
      a.onended = go; a.onerror = fail; a.play().catch(fail);
    };
    go();
  }

  // "Prefer not to say": choosing it clears the other choices; choosing another clears it. changed = the box just changed.
  exclusive(s, changed) {
    const ex = s && s.exclusive; if (!ex || !changed || !changed.checked) return;
    this.r.querySelectorAll('input[name=f]').forEach(x => { if (x !== changed && (changed.value === ex || x.value === ex)) x.checked = false; });
  }
  // Support choices that mean something to send ("prefer not to say" is not one).
  supportChosen() { return (this.a.support || []).filter(x => x !== 'prefer'); }

  // Act on what the person said.
  heard(raw) {
    this.vtries = 0;
    if (this.done) {
      // Thank-you page: "Download", "Delete" (then Yes or No), "Next" when the host gave a "continue" address, "Stop".
      const dw = (this.norm(raw) || '').split(' ').filter(Boolean), dis = c => dw.length > 0 && dw.length <= 4 && isCmd(c, dw);
      if (dis('stop')) return this.stopRead();
      if (this.mine === 'sure') {
        const yn = this.ans(raw);
        if (yn === 'y') return this.delMine(true);
        if (yn === 'n') { this.mine = ''; this.quiet = true; this.draw(); this.focusIn('[data-mydel]'); return this.doneAsk(); }
        return this.doneAsk();
      }
      if (this.canMine() && dis('del') && this.receipt && this.getAttribute('api')) { this.mine = 'sure'; this.quiet = true; this.draw(); this.focusIn('#sureq'); return this.doneAsk(); }
      if (this.canMine() && dis('download') && this.sent) { saveAnswers(this.sent, this.receipt, this.r); const m = this.u('myDownloaded'); this.say(m); return this.hasVoice() ? this.speak(m, null) : this.cap('speaking', m, this.l); }
      if (this.cont() && dis('next')) return this.goOn();
      return this.doneAsk();
    }
    const s = this.steps[this.i], t = this.norm(raw), w = t ? t.split(' ') : [];
    const lim = s && s.type === 'text' ? 1 : 3;
    const is = c => w.length > 0 && w.length <= lim && isCmd(c, w);
    const again = () => this.readPage(s, () => this.cue(() => this.listen(true)));
    if (this.welcome) { if (this.draft && is('next')) this.resume(); else if (is('start') || is('next')) { if (this.draft) { this.dropDraft(); this.a = {}; this.i = 0; } this.startForm(false); } else this.say2(this.u('sayWelcome'), 'sayWelcome'); return; }
    if (!s) {
      const rv = this.steps.map((x, n) => [x, n]).filter(([x]) => !x.local), yn = this.ans(raw);
      const tick = k => { (this.consent = this.consent || { a: false, s: false })[k] = true; const c = this.r.querySelector(`[data-consent=${k}]`); if (c) c.checked = true; };
      // Second question after Yes: share the support choices too? Only a clear Yes shares them; No sends without them.
      if (this.sup) {
        if (is('stop')) { this.sup = 0; return this.stopRead(); }
        if (yn) { this.sup = 0; if (yn === 'y') tick('s'); return this.send(); }
        return this.say2(this.u('askSupport'), 'askSupport');
      }
      const num = w.map(x => numOf(x)).find(n => n >= 1 && n <= rv.length);
      if (w.some(x => CMD.restart.includes(x)) || (w.some(x => CMD.start.includes(x)) && w.some(x => CMD.again.includes(x)))) return this.restart();
      if (is('stop')) return this.stopRead();
      if (num) return this.edit(rv[num - 1][1]);
      if (is('send') || (!this.rs && yn === 'y')) {
        tick('a');
        // Support needs are sent only with their own agreement, by voice too: ask separately before sending.
        if (this.f === FLOWS.signup && this.supportChosen().length && !(this.consent && this.consent.s)) { this.sup = 1; return this.say2(this.u('askSupport'), 'askSupport'); }
        return this.send();
      }
      if (!this.rs && yn === 'n') { this.rs = 1; this.moved = true; return this.draw(); }
      if (is('back')) return this.goBack(s);
      if (is('repeat')) return again(this.rs ? 'reviewFix' : 'review');
      return this.say2(this.u(this.rs ? 'reviewFix' : 'reviewAsk'), this.rs ? 'reviewFix' : 'reviewAsk');
    }
    if (is('stop')) return this.stopRead();
    if (is('repeat')) return again(s.id);
    if (is('back') && this.i) return this.goBack(s);
    if (is('skip') && s.optional) return this.skipStep(s);
    if (is('next')) return this.next(s);
    const e = this.r.querySelector('#err'); if (e) e.textContent = '';
    if (s.type === 'text') {
      // Phone or email: spoken digits and "at" / "dot" become the text the box needs.
      const v = s.spoken === 'contact' ? spokenContact(raw) : String(raw).trim(), f = this.r.querySelector('#f');
      // A word that is not a phone number or email never replaces a good number already in the box.
      if (s.spoken === 'contact' && !s.check(v) && f && f.value && s.check(f.value)) return this.playList([{ l: this.l, id: 'heardB', t: this.u('heardB') }], () => this.cue(() => this.listen(true)));
      if (f) f.value = v;
      // Read it back from clips ("We heard" + the answer + "Say Next..."); a phone number is read digit by digit.
      const m = this.u('heardNext', { x: v }); this.say(m);
      return this.playList(this.heardItems(v, s), () => this.cue(() => this.listen(true)), m);
    }
    const hit = this.pick(t, s);
    if (!hit.length) return this.say2(this.u('unclear'), 'unclear');
    const ins = [...this.r.querySelectorAll('input[name=f]')];
    if (s.type === 'radio') ins.forEach((el, n) => { el.checked = n === hit[0]; });
    else hit.forEach(n => { ins[n].checked = !ins[n].checked; this.exclusive(s, ins[n]); });
    const sel = ins.map((el, n) => (el.checked ? T(s.options[n][1], this.l) : null)).filter(Boolean);
    const nums = ins.map((el, n) => (el.checked ? 'n' + (n + 1) : null)).filter(Boolean), m = sel.length ? this.u('chose', { x: sel.join(', ') }) : this.u('noneSel');
    this.say(m); this.seq(sel.length ? ['choseA', ...nums, 'choseB'] : ['noneSel'], m, () => this.cue(() => this.listen(true)));
  }

  listen(auto) {
    const live = this.r.querySelector('#live');
    if (!this.canHear()) { live.textContent = this.u('novoice'); return; }
    this.stopVoice();
    this.tok++;
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (this.aud) this.aud.pause(); this.stopDigits();
    const rec = this.recog(this.sl());
    if (!rec) { live.textContent = this.u('novoice'); return; }
    this.vrec = rec;
    let got = false;
    const mb = this.r.querySelector('.mic'), off = () => { if (mb) mb.classList.remove('on'); if (this.vrec === rec || !this.vrec) this.cap('idle'); };
    if (mb) mb.classList.add('on');
    live.textContent = this.u('listening');
    this.cap('listening');
    rec.onresult = e => { got = true; off(); this.vrec = null; this.heard(this.bestAlt(alts(e))); };
    rec.onerror = e => {
      if (e.error === 'no-speech') return;
      got = true; this.vno = auto || this.vno; off();
      live.textContent = this.u(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'micblocked' : e.error === 'language-not-supported' ? 'nolang' : 'novoice') + ' (' + e.error + ')';
    };
    rec.onend = () => {
      off(); if (this.vrec === rec) this.vrec = null;
      if (got) return;
      if (auto && ++this.vtries < 2) { this.listen(true); return; }
      if (auto) { this.speak(this.u('idle'), 'idle'); this.say(this.u('idle')); } else live.textContent = this.u('nospeech');
    };
    try { rec.start(); } catch (x) { live.textContent = this.u('novoice') + ' (' + x.name + ')'; }
  }

  // What is sent: only the questions that are not local, plus the consent record. Support choices only with their own consent.
  payload() {
    const out = {};
    this.steps.filter(s => !s.local).forEach(s => {
      const v = this.a[s.id];
      if (s.type === 'ecdate') { if (v && v.m) { const r = ecResolve(v); out[s.id] = isoOf(fromEC(r.y, r.m, r.d)); } return; }
      out[s.id] = v;
    });
    if (Array.isArray(out.support)) out.support = out.support.filter(x => x !== 'prefer');
    if (!this.consent.s || !(out.support || []).length) delete out.support;
    out.consent = { given: true, scope: ['answers', ...(this.consent.s && out.support ? ['support'] : [])], version: CONSENT_VERSION, lang: this.l, partner: this.getAttribute('partner') || '', at: new Date().toISOString() };
    return out;
  }

  async send() {
    if (this.sending) return;
    // Nothing leaves the device without the person's agreement.
    if (!this.consent.a) { this.err = this.u('consentNeed'); this.errKey = 'consentNeed'; this.moved = true; this.draw(); return; }
    const out = this.payload();
    // Sending state: the button is disabled and says "Sending…" so a second press cannot send twice.
    this.sending = true;
    const btn = this.r.querySelector && this.r.querySelector('[data-send]');
    if (btn) { btn.disabled = true; btn.textContent = this.u('sending'); this.say(this.u('sending')); }
    const base = this.getAttribute('api'), url = base ? base + this.f.path : null;
    try {
      if (url) {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) });
        if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
        const j = await r.json().catch(() => ({}));
        this.receipt = j.receipt || ''; this.recId = j.id || '';
      }
      this.sent = out; this.mine = '';
      this.done = true; this.moved = true; this.err = ''; this.dropDraft();
      this.dispatchEvent(new CustomEvent('db-complete', { detail: { answers: out, id: this.recId, receipt: this.receipt }, bubbles: true, composed: true }));
      // The organisers' data contract (Technical Guide, Track 1): profile and support in two separate events.
      const { support, consent, ...profile } = out;
      this.emit('done', { profile: { ...profile, language: this.l }, id: this.recId, receipt: this.receipt, voiceNotes: [] });
      if (support && support.length) this.emit('support', { support });
    } catch (e) {
      // No connection: keep the answers on the device and send them later. A server answer (4xx/5xx) is shown as an error.
      if (url && !e.status) {
        const q = store.get(QUEUE) || []; q.push({ url, body: out, flow: this.getAttribute('flow') || this.constructor.flow, at: Date.now() }); store.set(QUEUE, q);
        this.done = true; this.queued = true; this.moved = true; this.err = ''; this.dropDraft();
        this.dispatchEvent(new CustomEvent('db-queued', { bubbles: true, composed: true }));
      } else {
        this.err = this.u('fail'); this.errKey = 'fail';
        this.dispatchEvent(new CustomEvent('db-error', { detail: { status: e.status || 0 }, bubbles: true, composed: true }));
      }
    }
    this.sending = false;
    this.draw();
  }
}
// Learner's own record, shared by the thank-you page and <db-my-answers>.
function saveAnswers(data, receipt, root) {
  if (!data || typeof document === 'undefined') return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ receipt, ...data }, null, 2)], { type: 'application/json' }));
  a.download = 'my-answers' + (receipt ? '-' + receipt : '') + '.json';
  (root || document.body).appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function deleteByReceipt(api, code) {
  if (!api || !code) return false;
  try { const r = await fetch(api + '/receipts/' + encodeURIComponent(code), { method: 'DELETE' }); return r.status === 204; } catch (e) { return false; }
}
// <db-my-answers api='…/v1' lang='am'>: a learner types the receipt code from the thank-you page to see, download or
// delete their answers later, on any device. Uses the same look and the same words as the form.
class DbMyAnswers extends DbForm {
  connectedCallback() { this.l = this.getAttribute('lang') || this.l || 'en'; this.code = ''; this.rec = null; this.state = ''; this.paint(); }
  disconnectedCallback() {}
  paint(focus) {
    const u = k => esc(this.u(k)), r = this.rec;
    let b = `<h2 id='h' tabindex='-1'>${u('myH')}</h2>`;
    if (this.state === 'gone') b += `<p id='mymsg' tabindex='-1' role='status'>${u('myDeleted')}</p>`;
    else if (r) {
      const rows = Object.entries(r.answers || {}).filter(([k]) => k !== 'consent').map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(Array.isArray(v) ? v.join(', ') : v)}</dd>`).join('');
      b += `<dl class='mine'>${rows}</dl>` + (this.state === 'sure'
        ? `<div class='sure' role='group' aria-labelledby='sureq'><p id='sureq' tabindex='-1'><strong>${u('mySure')}</strong></p><div class='row'><button type='button' class='p' data-yes>${u('myYes')}</button><button type='button' data-no>${u('myNo')}</button></div></div>`
        : `<div class='row'><button type='button' data-dl>${u('myDownload')}</button><button type='button' data-del>${u('myDelete')}</button></div>`);
    } else b += `<form novalidate><label for='code'>${u('myCode')}</label><p class='hint' id='codehint'>${u('myHint')}</p><input type='text' id='code' autocomplete='off' spellcheck='false' aria-describedby='codehint${this.state ? ' myerr' : ''}'${this.state ? " aria-invalid='true'" : ''} value='${esc(this.code)}'><div class='row'><button class='p'>${u('myShow')}</button></div></form>`;
    if (this.state === 'missing' || this.state === 'fail') b += `<p class='err' id='myerr' role='alert'>${u(this.state === 'missing' ? 'myNotFound' : 'myFail')}</p>`;
    this.r.innerHTML = `<style>${CSS}.mine{display:grid;grid-template-columns:auto 1fr;gap:var(--s2) var(--s4)}.mine dt{font-weight:700}.mine dd{margin:0;overflow-wrap:anywhere}label{display:block;font-weight:700}.hint{margin:var(--s1) 0 var(--s3);color:var(--ink-2)}</style><section lang='${esc(this.l)}'>${b}</section>`;
    const $ = s => this.r.querySelector(s), api = this.getAttribute('api');
    const f = $('form'); if (f) f.addEventListener('submit', async e => {
      e.preventDefault(); this.code = $('#code').value.replace(/\s+/g, '');
      try { const x = await fetch(api + '/receipts/' + encodeURIComponent(this.code)); if (x.ok) { this.rec = await x.json(); this.state = ''; } else this.state = x.status === 404 ? 'missing' : 'fail'; } catch (er) { this.state = 'fail'; }
      this.paint(this.rec ? '#h' : '#code');
    });
    const on = (s, fn) => { const e = $(s); if (e) e.addEventListener('click', fn); };
    on('[data-dl]', () => saveAnswers(r && { flow: r.flow, at: r.at, answers: r.answers, support: r.support }, this.code, this.r));
    on('[data-del]', () => { this.state = 'sure'; this.paint('#sureq'); });
    on('[data-no]', () => { this.state = ''; this.paint('[data-del]'); });
    on('[data-yes]', async () => {
      const ok = await deleteByReceipt(api, this.code);
      if (ok) { this.rec = null; this.state = 'gone'; this.dispatchEvent(new CustomEvent('db-deleted', { detail: { id: r.id }, bubbles: true, composed: true })); } else this.state = 'fail';
      this.paint(ok ? '#mymsg' : '[data-del]');
    });
    if (focus) { const e = $(focus); if (e) e.focus(); }
  }
}
// Level 1 tags. All three are the same engine; the two named tags only change the default flow.
// <db-onboarding> = sign-up, <db-career-gateway> = job search and application. Loading the script twice is harmless.
class DbOnboarding extends DbForm { static flow = 'signup'; }
class DbCareerGateway extends DbForm { static flow = 'job'; }
if (!customElements.get('db-form')) customElements.define('db-form', DbForm);
if (!customElements.get('db-onboarding')) customElements.define('db-onboarding', DbOnboarding);
if (!customElements.get('db-career-gateway')) customElements.define('db-career-gateway', DbCareerGateway);
if (!customElements.get('db-my-answers')) customElements.define('db-my-answers', DbMyAnswers);
}
