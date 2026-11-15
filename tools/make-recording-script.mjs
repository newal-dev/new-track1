// Regenerates RECORDING_SCRIPT.md and tools/colab_generate_audio.py from the text in public/db-form.js.
// Run from the project root: npm run recording   (or: node tools/make-recording-script.mjs)
// Add --json to also print the clip text as JSON (all languages) on stdout.
import fs from 'fs';

let src = fs.readFileSync('public/db-form.js', 'utf8');
src = src.replace("customElements.define('db-form', DbForm);", 'globalThis.__D = DbForm; globalThis.__F = FLOWS; globalThis.__UI = UI; globalThis.__L = LANGS;');
globalThis.HTMLElement = class { attachShadow() { return {}; } };
globalThis.window = globalThis; globalThis.SpeechRecognition = function () {}; globalThis.customElements = { get: () => null, define() {} };
(0, eval)(src.replace(/^const /gm, 'var ').replace(/^class DbForm/m, 'var DbForm = class DbForm'));
const D = globalThis.__D, F = globalThis.__F, UI = globalThis.__UI, LANGS = globalThis.__L;
const ALL = LANGS.map(x => x.id);
const mk = (flow, l, i = 0) => Object.assign(Object.create(D.prototype), { f: F[flow], l, a: {}, rm: true, err: '', done: false, cp: false, welcome: false, lp: false, jobs: null, i, rs: 0, hide: [], fromReview: false, pref: {} });
const u = (k, l) => UI[k][l] || UI[k].en;

// Number words used in the "You chose ..." confirmation (clips n1..n8). VERIFY_NATIVE for om, ti, so.
const NWL = {
  en: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'],
  am: ['አንድ', 'ሁለት', 'ሦስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት'],
  om: ['Tokko', 'Lama', 'Sadii', 'Afur', 'Shan', 'Jaha', 'Torba', 'Saddeet'],
  ti: ['ሓደ', 'ክልተ', 'ሰለስተ', 'ኣርባዕተ', 'ሓሙሽተ', 'ሽዱሽተ', 'ሸውዓተ', 'ሸሞንተ'],
  so: ['Kow', 'Laba', 'Saddex', 'Afar', 'Shan', 'Lix', 'Toddoba', 'Siddeed'],
};

// Every clip: id, what it is, which languages need it (default: all), text per language.
const items = [];
const add = (id, what, t, extra = {}) => { if (!items.some(x => x.id === id)) items.push({ id, what, t, langs: ALL, ...extra }); };
add('langAsk', 'Language page: the question, in English only', () => UI.langAsk.en, { langs: ['en'] });
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
for (let n = 1; n <= 8; n++) add('n' + n, 'Number ' + n + ' (used in the confirmation)', l => NWL[l][n - 1]);
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
    if (st.type === 'text') add('q_' + st.id, `Focus: the answer box of "${st.q.en}"`, l => st.q[l] || st.q.en);
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
| English | \`en\` | \`public/audio/en/\` | The device voice (every phone and laptop has one). Clips are optional. |
| አማርኛ Amharic | \`am\` | \`public/audio/am/\` | **Generated clips** (Meta MMS, \`facebook/mms-tts-amh\`). Few devices have an Amharic voice. |
| Afaan Oromoo | \`om\` | \`public/audio/om/\` | Generated clips (\`facebook/mms-tts-orm\`); the device voice if a clip is missing. |
| ትግርኛ Tigrinya | \`ti\` | \`public/audio/ti/\` | Generated clips (\`facebook/mms-tts-tir\`); the device voice if a clip is missing. |
| Soomaali Somali | \`so\` | \`public/audio/so/\` | Generated clips (\`facebook/mms-tts-som\`); the device voice if a clip is missing. |

When a clip is missing **and** the device has no voice for the language, the plugin says in English "This device has no voice for this language…" so a blind person knows why, and it still listens for their answer.

## How to make the clips (Google Colab, free)
1. Run \`npm run recording\`. This updates this file **and** \`tools/colab_generate_audio.py\` (the clip text is built into that file).
2. Open https://colab.research.google.com, choose **New notebook**.
3. Optional but faster: **Runtime, Change runtime type, T4 GPU**.
4. Open \`tools/colab_generate_audio.py\`, copy **all** of it, paste it into the first cell, and press Run. The first run downloads the voice models (a few minutes).
5. When it finishes, \`audio.zip\` downloads. Unzip it **into \`public/audio/\`**, so you get for example \`public/audio/am/fullName.mp3\`.
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
- The **contact** question (phone or email) is **typed, not spoken**: it has no Speak button and the voice does not listen.
- The confirmation after a choice is three clips played in a row: \`choseA\` ("You chose"), then the number clips \`n1\` to \`n8\`, then \`choseB\`.
- If a website hides a question with the \`hide\` attribute, the clips still describe the full list.
- The **Stop reading** button and the Escape key stop any clip or voice at any time.

## Not recorded (they change each time)
- **review** (the first part of the last page): reads out the person's own answers. Only \`reviewFix\` is a clip.
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
fs.writeFileSync('RECORDING_SCRIPT.md', md);

// The Colab script: the template below with the clip text built in.
const tpl = fs.readFileSync('tools/colab_template.py', 'utf8');
if (!tpl.includes('__CLIPS_JSON__')) throw new Error('tools/colab_template.py must contain __CLIPS_JSON__');
const json = JSON.stringify(clips, null, 1);
if (json.includes("'''")) throw new Error("Clip text must not contain ''' (it would break the Python file)");
fs.writeFileSync('tools/colab_generate_audio.py', tpl.replace('__CLIPS_JSON__', json));

if (process.argv.includes('--json')) console.log(JSON.stringify(clips, null, 2));
else console.log(`Wrote RECORDING_SCRIPT.md and tools/colab_generate_audio.py: ${total} clips (${ALL.map(l => l + ' ' + count(l)).join(', ')})`);
