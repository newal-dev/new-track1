// Regenerates RECORDING_SCRIPT.md and tools/colab_generate_audio.py from the text in public/db-form.js.
// Run from the project root: npm run recording   (or: node tools/make-recording-script.mjs)
// Add --json to also print the clip text as JSON (all languages) on stdout; --no-write prints it without writing any file (used by the tests).
import fs from 'fs';

let src = fs.readFileSync('public/db-form.js', 'utf8');
src = src.replace("customElements.define('db-form', DbForm);", 'globalThis.__D = DbForm; globalThis.__F = FLOWS; globalThis.__UI = UI; globalThis.__L = LANGS;');
globalThis.HTMLElement = class { attachShadow() { return {}; } };
globalThis.window = globalThis; globalThis.SpeechRecognition = function () {}; globalThis.customElements = { get: () => null, define() {} };
(0, eval)(src.replace(/^const /gm, 'var ').replace(/^class DbForm/m, 'var DbForm = class DbForm'));
const D = globalThis.__D, F = globalThis.__F, UI = globalThis.__UI, LANGS = globalThis.__L;
const ALL = LANGS.map(x => x.id);
const mk = (flow, l, i = 0) => Object.assign(Object.create(D.prototype), { f: F[flow], l, a: {}, rm: true, err: '', done: false, cp: false, welcome: false, lp: false, jobs: null, i, rs: 0, hide: [], fromReview: false, pref: {} });
const u = (k, l) => (UI[k][l] != null && UI[k][l] !== '' ? UI[k][l] : UI[k].en);

// Number words (clips n0..n9): the "You chose ..." confirmation, the numbered review page, and phone numbers read back
// digit by digit. VERIFY_NATIVE for om, ti, so, sid.
const NWL = {
  en: ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'],
  am: ['ዜሮ', 'አንድ', 'ሁለት', 'ሦስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ'],
  om: ['Zeeroo', 'Tokko', 'Lama', 'Sadii', 'Afur', 'Shan', 'Jaha', 'Torba', 'Saddeet', 'Sagal'],
  ti: ['ዜሮ', 'ሓደ', 'ክልተ', 'ሰለስተ', 'ኣርባዕተ', 'ሓሙሽተ', 'ሽዱሽተ', 'ሸውዓተ', 'ሸሞንተ', 'ትሽዓተ'],
  so: ['Eber', 'Kow', 'Laba', 'Saddex', 'Afar', 'Shan', 'Lix', 'Toddoba', 'Siddeed', 'Sagaal'],
  sid: ['Zeero', 'Mitto', 'Lame', 'Sase', 'Shoole', 'Onte', 'Lee', 'Lamala', 'Sette', 'Honse'],
};

// Every clip: id, what it is, which languages need it (default: all), text per language.
const items = [];
const add = (id, what, t, extra = {}) => { if (!items.some(x => x.id === id)) items.push({ id, what, t, langs: ALL, ...extra }); };
add('langAsk', 'Language page: the question, in English only', () => UI.langAsk.en, { langs: ['en'] });
add('langNone', 'Language page: no language was heard (English only)', () => UI.langNone.en, { langs: ['en'] });
add('langAgain', 'Language page: second try, said in English and then Amharic before an Amharic recogniser listens', l => UI.langAgain[l], { langs: ['en', 'am'] });
add('langSelf', 'Language page: invitation in the language itself (played after langAsk)', l => UI.langSelf[l], { langs: ALL.filter(l => l !== 'en') });
add('raAsk', 'First question in the chosen language (asks if the page should be read aloud)', l => [u('raAsk', l), u('raHint', l), u('raPrivacy', l)].join(' '));
add('raAgain', 'Second ask, if no answer was heard', l => u('raAgain', l));
add('welcome', 'Welcome page (after they said Yes to read aloud)', l => { const d = mk('signup', l); d.welcome = true; return d.pageText(undefined); });
for (const flow of ['signup', 'job', 'employer']) {
  F[flow].steps.forEach((st, i) => { if (!st.dyn) add(st.id, `${flow} flow, question ${i + 1}`, l => mk(flow, l, i).pageText(st), { opt: !!st.optional }); });
}
for (const [id, what] of [['errNeed', 'Error: question not answered'], ['errBad', 'Error: phone number or email not valid'], ['errFail', 'Error: could not send'], ['unclear', 'Voice answer not understood'], ['noneSel', 'Nothing chosen yet'], ['idle', 'Nothing heard'], ['sayWelcome', 'Welcome page: say Start'], ['reviewAsk', 'Review page: do you want to submit?'], ['heardGeneric', 'Spoken answer received (used when the device has no voice)'], ['choseA', 'Confirmation, first part ("You chose")'], ['choseB', 'Confirmation, last part'], ['errConsentNeed', 'Error: consent box not ticked'], ['errDateBad', 'Error: date has no month'], ['draftH', 'Welcome back (answers kept on this device)'], ['queued', 'Offline: answers saved on the device, sent later'], ['sentLater', 'Saved answers were sent'], ['tapToHear', 'Press a key or tap to hear the questions']]) {
  const k = { errNeed: 'need', errBad: 'bad', errFail: 'fail', errConsentNeed: 'consentNeed', errDateBad: 'dateBad' }[id] || id;
  if (id === 'draftH') { add(id, what, l => [u('draftH', l), u('draftP', l), u('draftGo', l), u('restart', l)].join(' ')); continue; }
  add(id, what, l => u(k, l));
}
for (let n = 0; n <= 9; n++) add('n' + n, 'Number ' + n + ' (confirmation, review numbers, phone digits)', l => NWL[l][n]);
// Review page, spoken from clips: heading, then per answer number + question (q_...) + chosen option (o_...) or the
// person's own words (device voice), then the consent sentence (around the partner's name) and the question.
add('reviewH', 'Review page: heading "Check your answers"', l => u('review', l));
add('skipped', 'Review page: a question that was skipped', l => u('skipped', l));
add('consentOrg', 'Consent sentence when the site gives no partner name', l => u('consentSend', l).replace('{p}', u('org', l)));
add('consentSendA', 'Consent sentence, part before the partner name (the name is read by a voice)', l => u('consentSend', l).split('{p}')[0]);
add('consentSendB', 'Consent sentence, part after the partner name (only where words follow the name)', l => u('consentSend', l).split('{p}')[1], { langs: ALL.filter(l => /\p{L}/u.test(u('consentSend', l).split('{p}')[1])) });
add('consentSupport', 'Second consent box: share support choices', l => u('consentSupport', l));
add('askSupport', 'Review by voice: also share support choices? (asked after Yes)', l => u('askSupport', l));
add('heardA', 'Read-back of a spoken answer, first part ("We heard")', l => u('heardA', l));
add('heardB', 'Read-back of a spoken answer, last part', l => u('heardB', l));
add('display', 'Focus: the "Colours and text size" menu', l => u('display', l));
for (const t of ['auto', 'standard', 'dark', 'contrast', 'rg', 'by']) add('th_' + t, `Focus: colour theme "${UI['th_' + t].en}"`, l => u('th_' + t, l));
add('reviewFix', 'Review page, second part (after the person says No to submitting)', l => u('reviewFix', l));
add('done', 'Thank-you page', l => u('thanks', l));
// Short clips for keyboard users: read when Tab / Shift+Tab / arrows move the focus, and before the microphone opens.
add('speakNow', 'Said just before the microphone opens (then a beep)', l => u('speakNow', l));
add('sel', 'Focus: a choice that is ticked', l => u('sel', l));
add('unsel', 'Focus: a choice that is not ticked', l => u('unsel', l));
add('langName', 'Focus: a language button, in that language', l => LANGS.find(x => x.id === l).name);
for (const k of ['next', 'back', 'skip', 'read', 'speak', 'readToMe', 'stopRead', 'send', 'noChange', 'restart', 'change', 'start', 'startVoice', 'raYes', 'raNo', 'draftGo']) add('b_' + k, `Focus: the "${UI[k].en}" button`, l => u(k, l));
for (const flow of ['signup', 'job', 'employer']) {
  for (const st of F[flow].steps) {
    // The job question's own text is a clip; the job titles change, so the device voice reads them.
    if (st.dyn) { add('q_' + st.id, `Job page: the question "${st.q.en}" (the job titles are read by the device voice)`, l => st.q[l] || st.q.en); continue; }
    // Every question on its own: read when its answer box gets focus, and before each answer on the review page.
    add('q_' + st.id, `The question "${st.q.en}" on its own (answer box focus, review page)`, l => st.q[l] || st.q.en);
    (st.options || []).forEach(([k, t]) => add('o_' + st.id + '_' + k, `Focus: choice "${t.en}" (question ${st.id})`, l => t[l] || t.en));
  }
}

// clips[lang][id] = text
const clips = Object.fromEntries(ALL.map(l => [l, Object.fromEntries(items.filter(it => it.langs.includes(l)).map(it => [it.id, it.t(l)]))]));
const count = l => Object.keys(clips[l]).length, total = ALL.reduce((s, l) => s + count(l), 0);
const label = Object.fromEntries(LANGS.map(x => [x.id, x.id === 'en' ? 'English' : x.id === 'am' ? 'አማርኛ (draft, must be checked)' : `${x.name} (draft, VERIFY_NATIVE)`]));

let md = `# Recording script for read-aloud audio

This file tells you exactly what each audio clip must say. It is **generated** from the current text in \`public/db-form.js\` by \`npm run recording\`, so the words match the screen. **Do not edit it by hand: change the text in the code and run \`npm run recording\` again**, then make the changed clips again.

## Languages and voices
| Language | Code | Folder | Voice |
|---|---|---|---|
| English | \`en\` | \`public/audio/en/\` | Generated clips (\`facebook/mms-tts-eng\`), so English sounds like the other four languages; the device voice if a clip is missing. |
| አማርኛ Amharic | \`am\` | \`public/audio/am/\` | **Generated clips** (Meta MMS, \`facebook/mms-tts-amh\`). Few devices have an Amharic voice. |
| Afaan Oromoo | \`om\` | \`public/audio/om/\` | Generated clips (\`facebook/mms-tts-orm\`); the device voice if a clip is missing. |
| ትግርኛ Tigrinya | \`ti\` | \`public/audio/ti/\` | Generated clips (\`facebook/mms-tts-tir\`); the device voice if a clip is missing. |
| Soomaali Somali | \`so\` | \`public/audio/so/\` | Generated clips (\`facebook/mms-tts-som\`); the device voice if a clip is missing. |
| Sidaamu Afoo Sidama | \`sid\` | \`public/audio/sid/\` | Generated clips (\`facebook/mms-tts-sid\`). The text is a rough draft: a native speaker must correct the SID block first. |

When a clip is missing **and** the device has no voice for the language, the plugin says in English "This device has no voice for this language…" so a blind person knows why, and it still listens for their answer.

## How to make the clips (Google Colab, free)
1. Run \`npm run recording\`. This updates this file **and** \`tools/colab_generate_audio.py\` (the clip text is built into that file).
2. Open https://colab.research.google.com, choose **New notebook**.
3. Optional but faster: **Runtime, Change runtime type, T4 GPU**.
4. Open \`tools/colab_generate_audio.py\`, copy **all** of it, paste it into the first cell, and press Run. The first run downloads the voice models (a few minutes).
5. When it finishes, \`audio.zip\` downloads. **Delete the old clips** in \`public/audio/en/\`, \`am/\`, \`om/\`, \`ti/\` and \`so/\` (keep the \`.gitkeep\` files), then unzip it **into \`public/audio/\`**, so you get for example \`public/audio/am/fullName.mp3\`.
6. Test: open the demo page, choose a language, choose Yes, read aloud, and listen to every page.
7. A native speaker must listen to every clip. If a word is wrong, fix the text in \`public/db-form.js\` (not here), then repeat from step 1.

## What to produce
- **${total} files in total**: ${ALL.map(l => `${count(l)} for \`${l}\``).join(', ')}.
- Format: **mp3**, mono, 64 kbps or lower (small for 3G). The Colab script makes 48 kbps.
- File name = the **ID** in the first column, plus \`.mp3\`. Example: \`public/audio/am/fullName.mp3\`. Use exactly this spelling and capital letters.
- The plugin loads them from the \`audio\` attribute: \`audio='http://localhost:3000/audio'\` (the server serves the \`public\` folder).
- \`langAsk\` exists in English only, and \`langSelf\` in every language except English: the language page asks in English, then each language invites its own speakers.
- The short clips at the end (\`speakNow\`, \`sel\`, \`unsel\`, \`langName\`, \`b_…\` buttons, \`o_…\` choices, \`q_…\` answer boxes) are read when a keyboard user moves with Tab, Shift+Tab or the arrow keys, so a choice is heard as for example "two" + "Refugee or returnee ID" + "not selected". Say them as single short phrases.

## Recording by a person instead (phone is fine)
1. Quiet room, phone 20 cm from your mouth, no fan or echo.
2. Speak slowly and clearly, like to a stranger. Pause about one second between sentences and between choices.
3. Read **every word exactly as written**, no more and no less. Do not add "please" or change the order, including the numbers ("1:" is spoken "one", "2:" "two"…). The numbers matter: the person will say them back.
4. Trim silence at the start and end. Keep each file under about 40 seconds.
5. Convert to mp3 (for example with Audacity: File, Export, MP3), name the file and put it in the right folder.

## Important: what the voice says must match what is on screen
- The **first question of each flow** (\`prefs\`, \`needs\`, \`job\`) has **no Back button**, so its script does **not** say "Back". Every other question does.
- **Skip** is spoken only for optional questions, and those pages have a visible Skip button.
- The words in the instructions are the same as the buttons: **Next, Back, Skip, Read aloud, Start, Submit**.
- The privacy notice is spoken **once**, in \`raAsk\`, and shown once on that same page.
- The **contact** question (phone or email) can be **spoken or typed**. A spoken phone number is read back digit by digit: \`heardA\` ("We heard"), the digit clips \`n0\` to \`n9\`, then \`heardB\`.
- The confirmation after a choice is three clips played in a row: \`choseA\` ("You chose"), then the number clips \`n1\` to \`n9\`, then \`choseB\`.
- The **language page** asks in English for English only (\`langAsk\`); each other language then names itself in its own voice (\`langSelf\`). If no language is heard, \`langAgain\` asks again in English and Amharic.
- If a website hides a question with the \`hide\` attribute, the clips still describe the full list.
- The **Stop reading** button and the Escape key stop any clip or voice at any time.

## Not recorded (they change each time)
- **review** (the last page) as one recording: it holds the person's own answers. It is put together instead from short clips: \`reviewH\`, then for each answer \`n1\`… + \`q_<question>\` + the chosen \`o_…\` clip (or \`skipped\`, or the digits), then \`consentOrg\` (or \`consentSendA\` + the partner's name + \`consentSendB\`) and \`reviewAsk\`. Typed words such as a name are read by the device voice; when there is no voice for the language, an English voice reads them (Ge'ez in Latin letters).
- **role** (job flow): the list of jobs depends on the person's filter and on jobs employers add. Only the question (\`q_role\`) and the numbers are clips.
- The exact words a person typed or said. The device voice reads them back when it has a voice for the language; otherwise \`heardGeneric\` is played.

## Checklist
| ID | Page | Optional question? | Languages |
|---|---|---|---|
`;
items.forEach(it => { md += `| \`${it.id}\` | ${it.what} | ${it.opt === undefined ? '-' : it.opt ? 'yes (includes "Say Skip")' : 'no'} | ${it.langs.join(', ')} |\n`; });
md += `\n---\n\n## The scripts\n\nEach box is the exact text of one clip. "1:" is spoken "one", "2:" "two", and so on (the Colab script does this for you).\n`;
for (const it of items) {
  md += `\n### \`${it.id}\`: ${it.what}\n`;
  for (const l of it.langs) md += `\n**${label[l]}** → \`public/audio/${l}/${it.id}.mp3\`\n\n> ${clips[l][it.id]}\n`;
}
md += `\n---\n\n## After making the clips\n- Test every language, with the phone volume low and high.\n- Confirm each file starts playing within about one second on a phone.\n- Tell the team which files are still missing; the device voice covers them where it can.\n`;
if (process.argv.includes('--no-write')) { console.log(JSON.stringify(clips)); process.exit(0); }
fs.writeFileSync('RECORDING_SCRIPT.md', md);

// The Colab script: the template below with the clip text built in.
const tpl = fs.readFileSync('tools/colab_template.py', 'utf8');
if (!tpl.includes('__CLIPS_JSON__') || !tpl.includes('__LANGS__')) throw new Error('tools/colab_template.py must contain __CLIPS_JSON__ and __LANGS__');
const writePy = (file, langs, only = {}) => {
  const pick = Object.fromEntries(langs.map(l => [l, only[l] ? Object.fromEntries(only[l].map(id => [id, clips[l][id]])) : clips[l]]));
  const json = JSON.stringify(pick, null, 1);
  if (json.includes("'''")) throw new Error("Clip text must not contain ''' (it would break the Python file)");
  fs.writeFileSync(file, tpl.replace('__LANGS__', JSON.stringify(langs)).replace('__CLIPS_JSON__', json));
};
writePy('tools/colab_generate_audio.py', ALL);
// Only the newest language, plus the English language-page question (it now names Sidama): no need to remake the other clips.
writePy('tools/colab_generate_audio_sid.py', ['sid', 'en'], { en: ['langAsk'] });

if (process.argv.includes('--json')) console.log(JSON.stringify(clips, null, 2));
else console.log(`Wrote RECORDING_SCRIPT.md, tools/colab_generate_audio.py (all) and tools/colab_generate_audio_sid.py (sid + en/langAsk): ${total} clips (${ALL.map(l => l + ' ' + count(l)).join(', ')})`);
