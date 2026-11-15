// Regenerates RECORDING_SCRIPT.md from the text in public/db-form.js. Run from the project root: node tools/make-recording-script.mjs
import fs from 'fs';
let src = fs.readFileSync('public/db-form.js','utf8');
src = src.replace("customElements.define('db-form', DbForm);", "globalThis.__D = DbForm; globalThis.__F = FLOWS; globalThis.__UI = UI;");
globalThis.HTMLElement = class { attachShadow(){ return {}; } };
globalThis.window = globalThis; globalThis.SpeechRecognition = function(){};
(0,eval)(src.replace(/^const /gm,'var ').replace(/^class DbForm/m,'var DbForm = class DbForm'));
const D = globalThis.__D, F = globalThis.__F, UI = globalThis.__UI;
const mk = (flow,l,i=0)=>{ const d = Object.create(D.prototype); d.f=F[flow]; d.l=l; d.a={}; d.rm=true; d.err=''; d.done=false; d.cp=false; d.welcome=false; d.jobs=null; d.i=i; return d; };
const u=(k,l)=>UI[k][l];
const out=[];
const items=[];
// fixed pages
items.push({id:'raAsk',what:'First question (asks if the page should be read aloud)',flow:'all',t:l=>[u('raAsk',l),u('raHint',l),u('raPrivacy',l)].join(' ')});
items.push({id:'raAgain',what:'Second ask, if no answer was heard',flow:'all',t:l=>u('raAgain',l)});
items.push({id:'welcome',what:'Welcome page (after they said Yes to read aloud)',flow:'all',t:l=>{const d=mk('signup',l);d.welcome=true;return d.pageText(undefined);}});
for (const flow of ['signup','job','employer']) {
  F[flow].steps.forEach((st,i)=>{
    if (st.dyn) return;
    items.push({id:st.id,what:`${flow} flow, question ${i+1}`,flow,opt:!!st.optional,t:l=>{const d=mk(flow,l,i);return d.pageText(st);}});
  });
}
const NWL={en:['One','Two','Three','Four','Five','Six','Seven','Eight'],am:['አንድ','ሁለት','ሦስት','አራት','አምስት','ስድስት','ሰባት','ስምንት']};
for (const [id,what] of [['errNeed','Error: question not answered'],['errBad','Error: phone number or email not valid'],['errFail','Error: could not send'],['unclear','Voice answer not understood'],['noneSel','Nothing chosen yet'],['idle','Nothing heard'],['sayWelcome','Welcome page: say Start'],['reviewAsk','Review page: do you want to submit?'],['heardGeneric','Spoken answer received (used when the device has no voice)'],['choseA','Confirmation, first part ("You chose")'],['choseB','Confirmation, last part']]) {
  const k={errNeed:'need',errBad:'bad',errFail:'fail'}[id]||id; items.push({id,what,flow:'all',t:l=>u(k,l)});
}
for (let n=1;n<=8;n++) items.push({id:'n'+n,what:'Number '+n+' (used in the confirmation)',flow:'all',t:l=>NWL[l][n-1]});
items.push({id:'reviewFix',what:'Review page, second part (after the person says No to submitting)',flow:'all',t:l=>u('reviewFix',l)});
items.push({id:'done',what:'Thank-you page',flow:'all',t:l=>u('thanks',l)});
const seen=new Set();
let md=`# Recording script for read-aloud audio

This file tells you exactly what to record. It was generated from the current text in \`public/db-form.js\`, so the words match the screen. **If you change any text in the code, re-generate or edit this file and re-record that file.**

## Why recordings exist (and why Amharic is silent right now)
Most phones and laptops have **no Amharic voice**. The browser can only read with voices installed on the device, so **Amharic cannot be read aloud until the Amharic recordings exist**. English works with the device voice even without recordings. So yes: for Amharic, a person has to record the voice, using the words below.

When an Amharic recording is missing and the device has no Amharic voice, the plugin now says in English "This device has no voice for this language…" so a blind person knows why, and it still listens for their answer.

## What to produce
- **22 files if you record everything below: ${'${COUNT}'} files per language** (English and Amharic).
- Format: **mp3**, mono, 64 kbps or lower (small for 3G). 
- Folders: \`public/audio/en/\` and \`public/audio/am/\`.
- File name = the **ID** in the first column, plus \`.mp3\`. Example: \`public/audio/am/fullName.mp3\`. Use exactly this spelling and capital letters.
- The plugin loads them from the \`audio\` attribute: \`audio='http://localhost:3000/audio'\` (the server serves the \`public\` folder).

## How to record (phone is fine)
1. Quiet room, phone 20 cm from your mouth, no fan or echo.
2. Speak slowly and clearly, like to a stranger. Pause about one second between sentences and between choices.
3. Read **every word exactly as written**, no more and no less. Do not add \"please\" or change the order, including the numbers ("1:" is spoken "one", "2:" "two"…). The numbers matter: the person will say them back.
4. Read the Amharic with a native speaker, and let that speaker also fix any wrong Amharic in the code first. Then update the text here too.
5. Trim silence at the start and end. Keep each file under about 40 seconds.
6. Convert to mp3 (for example with Audacity: File, Export, MP3), name the file, put it in the right folder, then test: open the form, choose Read to me, and listen to each page in both languages.
7. Commit and push the audio folders.

## Important: what the voice says must match what is on screen
- The **first question of each flow** (\`prefs\`, \`needs\`, \`job\`) has **no Back button**, so its script does **not** say "Back". Every other question does.
- **Skip** is spoken only for optional questions, and those pages have a visible Skip button.
- The words you say in the instructions are the same as the buttons: **Next, Back, Skip, Read aloud, Start, Submit**.
- The privacy notice is spoken **once**, in \`raAsk\`, and shown once on that same page. It is not repeated anywhere else.
- The **contact** question (phone or email) is **typed, not spoken**: it has no Speak button and the voice does not listen, because email addresses and numbers are not recognised reliably. Its script ends with \"Please type your answer in the box. Then press Enter, or press the Next button.\"

- **Errors and answers are now recorded too.** \`errNeed\`, \`errBad\`, \`errFail\`, \`unclear\`, \`noneSel\`, \`idle\`, \`sayWelcome\` and \`reviewAsk\` are single messages. The confirmation after a choice is three parts played in a row: \`choseA\` ("You chose"), then the number clips \`n1\` to \`n8\` (for example "two"), then \`choseB\`. Record the numbers as single words with a short pause at the end.
- If a website hides a question with the \`hide\` attribute, the recordings still describe the full list. Hide only questions you do not need in your own demo, or record again for that site.
- The **Stop reading** button and the Escape key stop any recording or voice at any time. They are not spoken, so they are not in the scripts.

## Do NOT record these (they change each time)
- **review** (the first part of the last page): reads out the person's own answers, then asks \"Do you want to submit your answers?\". Only the second part, \`reviewFix\`, is recordable.
- **role** (job flow, "Which job are you applying for?"): the list of jobs depends on the person's private filter and on jobs employers add. The device voice reads it.
- The exact words a person typed or said (for example their name). The device voice reads them back when it has a voice for the language; otherwise \`heardGeneric\` is played.
These pages use the device voice. That is expected.

## Checklist
| ID | Page | Optional question? |
|---|---|---|
`;
const rows=[];
for(const it of items){ if(seen.has(it.id)) continue; seen.add(it.id); rows.push(it); }
md=md.replace('**22 files if you record everything below: ${COUNT} files per language**',`**${rows.length} files per language** (${rows.length*2} in total)`);
rows.forEach(it=>{ md+=`| \`${it.id}\` | ${it.what} | ${it.opt===undefined?'-':it.opt?'yes (includes "Say Skip")':'no'} |\n`; });
md+=`\n---\n\n## The scripts\n\nRecord the text inside each box, from the first word to the last. Read "1:" as "one", "2:" as "two", and so on.\n`;
for(const it of rows){
  md+=`\n### \`${it.id}\`: ${it.what}\n\n**English** → \`public/audio/en/${it.id}.mp3\`\n\n> ${it.t('en')}\n\n**አማርኛ (draft, must be checked)** → \`public/audio/am/${it.id}.mp3\`\n\n> ${it.t('am')}\n`;
}
md+=`\n---\n\n## After recording\n- Test in English and Amharic, with and without the internet cable of your device volume low.\n- Confirm each file starts playing within about one second on a phone.\n- Tell the team which files are still missing; the device voice covers them, but Amharic may then be silent on phones without an Amharic voice.\n`;
md=md.replace('with and without the internet cable of your device volume low','with the phone volume low and high');
fs.writeFileSync('RECORDING_SCRIPT.md',md);
console.log(rows.map(r=>r.id).join(' '));
