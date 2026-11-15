# Inclusive Access: Full Project Handoff (version 2)

Written Saturday 14 November 2026, evening. This replaces the earlier handoff file. Keep it with your code. Everything needed to continue in another tool or with another assistant is here.

---

## 0. How to use this file
- If this chat is no longer available, paste the **prompt in section 18** into another AI assistant, then paste this file and your code files (`public/db-form.js` first).
- The newest versions of the files live in your project folder (`new-track1`). If you ever doubt a file, the chat's last downloads are: `db-form.js`, `README.md`, `RECORDING_SCRIPT.md`, `package.json`, `tests/voice.test.js`, `tools/make-recording-script.mjs`, `HANDOFF.md`.
- Official sources always win over this file: digitalbridge.et, the Telegram group (t.me/AccessibilityHackathon2026), the organisers at kick-off.

---

## 1. The big picture
You are competing in the **Digital Bridge Accessibility Hackathon 2026** (an ALX programme, site digitalbridge.et) on **Track 1: Accessible Onboarding**. You were accepted, a GitHub repo exists, and you are mainly building alone now, with teammates on other paths.

You are building a **plugin**, not a standalone site: a drop-in sign-up and profile component that any website adds with a script tag, plus a **career gateway** (job application, a private job filter, an employer form for accommodations). A small API and a pretend partner website exist only to prove it installs on another site.

**Honest status right now**
- The plugin has been **syntax-checked and its logic tested with stand-in tests (9 passing)**, but **not fully run end to end in a real browser by me**. You have tried it yourself in Chrome and reported what did and did not work (summarised in sections 6 and 7).
- Docker has been run once earlier (nginx on 8080 gave a 403, explained in section 14).
- **No recorded audio exists yet.** Amharic read-aloud cannot work until it does.
- **Not built:** save and resume by link or SMS, partner registration with consent, offline cache, Level 3 integration, theming, Savanna integration (needs the starter pack), real authentication.

---

## 2. Event facts (from the official event page unless marked)
- **Dates and place:** Saturday 14 and Sunday 15 November 2026, 9:00 AM to 5:00 PM both days, ALX Tech Hub, Lideta, Addis Ababa. Arrive by 8:45 AM Saturday (told to you by organisers).
- **Submission:** Sunday 15 Nov at **4:30 PM**, closing 5:00 PM. Plan to submit by **4:15 PM**.
- **Teams:** four engineers plus a **co-designer** (a person with a disability or lived experience of displacement). The co-designer is a full team member who tests on their own device and runs the final acceptance test.
- **Prize:** 100,000 ETB for the winning team in each of three tracks, then a paid two-week hardening sprint with ALX engineers.
- **Contacts:** Telegram group t.me/AccessibilityHackathon2026, email ethiopia@alxafrica.com.
- **Results:** judges and co-designers review the following week; winners announced about a week later.
- **Unknown until the organisers say:** the Savanna starter pack contents, the exact open licence ALX names, which co-designer you get, what environment judges use for the install test, whether there is a live presentation, whether any overnight stay is needed (schedule shows 9 to 5 only).

### Background: the 21 October test day
Forty people (blind, Deaf, with disabilities, refugees or returnees) tried to register, learn, get help and apply for jobs on Ethiopian platforms. Most could not finish: forms timed out, videos lacked captions, help was English only, job boards broke under a screen reader.

---

## 3. Project requirements

### The pass/fail gate (before any points)
1. A co-designer completes the main task **unaided** using NVDA, TalkBack, keyboard only, 200% zoom and sound off.
2. **axe-core** shows **zero critical or serious issues**.
3. A **WCAG 2.2 AA conformance report** is submitted.

### Scoring (out of 100)
| Points | What |
|---|---|
| 30 | Works for the people it is for (co-designer scores, tasks done unaided, findings from the 21 October test day used) |
| 25 | Can be adopted (a judge installs it in an hour from the docs; more credit for more integration levels) |
| 15 | Built for Ethiopia (Amharic, Ethiopic script and calendar, cheap Android on 3G, offline) |
| 15 | Quality, security and privacy (tests, minimum data, nothing leaves the host without consent) |
| 15 | Can be kept running (low cost, no paid-API lock-in, a README a stranger can follow) |

### Deliverables
Code, README, Docker Compose file, WCAG 2.2 AA conformance report.

### Integration levels
- **Level 1:** a script tag that adds a web component. (Done.)
- **Level 2:** a REST API with an OpenAPI specification. (Done, simple.)
- **Level 3:** an open standard such as LTI 1.3, schema.org/JobPosting or Open Badges 3.0. (Not done.)
- The module must also **run inside Savanna** (the ALX learning platform; starter pack given at kick-off). (Not done.)

### Track 1 functional requirements
**Sign-up and profile (Must):** clear labels and plain errors; no time-outs; one question per screen; voice input with review and edit; a private way to ask for support with no medical proof; alternative ID routes (refugee ID, other document, refer me through a partner) so nobody is blocked for lacking a kebele ID or passport; a low-literacy path (simple words, icons, read-aloud).
**Should:** a partner organisation (for example AAAPD) registers a learner only with consent; save progress and resume later via an SMS link.
**Career gateway (Must):** job application on the same form engine with voice answers; a private "support I need" job filter that does not require disclosing a disability; an employer form for the accommodations a job offers.
**Non-functional:** WCAG 2.2 AA; Amharic and English including Ethiopic script; usable on a low-cost Android on 3G; minimum data and privacy; low running cost, no paid-API lock-in; automated tests; a README a stranger can follow.

### The unofficial Notion document
A friend's SRS-style guide (FR-01 to FR-12 and so on). It is good practice and consistent with the event page, but **not official**. Its build-versus-reuse rule is kept in the README.

---

## 4. File structure (your project folder `new-track1`)

```
new-track1/
  .gitattributes
  README.md                 install guide, attributes, privacy, build vs reuse
  CONFORMANCE.md            WCAG 2.2 AA report template (every row "Not tested")
  RECORDING_SCRIPT.md       exact words to record for each audio file (generated)
  HANDOFF.md                this file
  Dockerfile                node:20-alpine; COPIES files at build time
  docker-compose.yml        web (3000) and host (8080)
  package.json              scripts: start, test, test:voice, recording
  package-lock.json
  server.js                 API + serves public/ on port 3000
  openapi.yaml              API description (Level 2)
  public/
    db-form.js              THE PLUGIN (single file web component), main deliverable
    audio/en/               recorded English mp3 (must be a FOLDER, see warning)
    audio/am/               recorded Amharic mp3 (must be a FOLDER, see warning)
  demo-host/
    index.html              pretend partner website that installs the plugin
  tests/
    api.test.js             API tests (node:test; server must be running)
    voice.test.js           voice-logic tests (node:test; no server needed)
    a11y.spec.js            axe tests (Playwright; host must be running)
  tools/
    make-recording-script.mjs   regenerates RECORDING_SCRIPT.md from db-form.js
  LICENSE                   (add after ALX names the licence)
```

### WARNING: the audio folders
In the zip you shared, `public/audio/en` and `public/audio/am` were **empty files (zero bytes), not folders**. You cannot save mp3 files into them. Fix before recording:

- Windows PowerShell: `Remove-Item public\audio\en, public\audio\am` then `mkdir public\audio\en, public\audio\am`
- Mac or Linux: `rm public/audio/en public/audio/am && mkdir -p public/audio/en public/audio/am`
- Git does not keep empty folders. Put a file called `.gitkeep` in each, or commit the mp3 files as soon as you have them.

### Git state
The repo had one commit ("Initial commit") when you shared it. Everything else (Docker files, server, tests, new plugin versions) was **uncommitted**. Commit and push often:
`git add .` then `git commit -m "message"` then `git pull` then `git push`.
Do not commit `node_modules/` (add it to `.gitignore`).

---

## 5. How the plugin works (so anyone can keep editing)

### Install snippet (Level 1)
```html
<script src='http://localhost:3000/db-form.js'></script>
<db-form flow='signup' lang='en' api='http://localhost:3000/v1' audio='http://localhost:3000/audio'></db-form>
```
- **Attributes:** `flow` (signup, job, employer), `lang` (en, am), `api` (base URL ending in /v1), `audio` (optional base URL of recorded mp3 files), `hide` (optional, comma list of question ids to leave out, for example `hide='idRoute,support'`; `fullName`, `role` and `job` can never be hidden because the server needs them).
- **Events** (bubble out): `db-complete` (detail.answers), `db-error`.
- Element name is `db-form`. To rename: change `customElements.define('db-form', ...)`, the host page and the a11y test.

### Internal structure of `public/db-form.js`
1. **`UI`**: all interface text as `{ en, am }`. Includes next, back, read, speak, send ("Yes, submit"), change, review, thanks, need, bad, skip, skipped, of, heard, novoice, novoicehere, listening, micblocked, nolang, nospeech, welcomeH/P, startVoice, typeInstead, start, intro, readToMe, stopRead, stopped, reading, raAsk, raHint, raPrivacy, raAgain, raYes, raNo, raNone, sayChoose, sayChoose1, saySkip, sayText, sayText1, sayType, sayWelcome, sayReview, reviewAsk, reviewFix, noChange, restart, chose, noneSel, unclear, heardNext, idle, fail.
2. **`WORK`**: shared workplace accommodations (stepfree, reader, interp, hours, remote).
3. **`FLOWS`** (each `{ path, steps }`):
   - `signup` (POST /learners): `prefs` (local, optional: larger text, pictures next to choices), `fullName` (text), `contact` (text, typed only, validated: contains @ or exactly 10 digits starting with 0, or 12 digits starting with 251), `idRoute` (radio: kebele, refugee, other, refer), `support` (checkbox, optional).
   - `job` (POST /applications): `needs` (local, optional, never sent), `role` (dynamic radio of jobs from GET /v1/jobs, filtered in the browser by needs), `why` (text).
   - `employer` (POST /employer/jobs): `job` (text), `offers` (checkbox, optional).
4. **Step fields:** `id`, `q`, `hint`, `type` (text, radio, checkbox), `options`, `optional`, `skip(answers)`, `check(value)` with `bad`, `local: true` (kept on device: not sent, not shown in review), `dyn: true` (options built from fetched jobs), `novoice: true` (typed only: no mic button, no listening).
5. **`NUM`, `NUM1`, `STOP`, `CMD`**: voice matching tables (number words in English and Amharic; command words: next, back, skip, repeat/read aloud, start, send, restart, stop).
6. **`IC`**: emoji per option key for "pictures next to choices".
7. **Class `DbForm`** (shadow DOM so host CSS cannot break it). Key methods: `connectedCallback`, `steps` getter, `draw`, `field`, `welcomeHTML`, `pageText`, `bind`, `next`, `advance`, `skipStep`, `edit`, `restart`, `goBack`, `keep`, `speak`, `tts`, `listen`, `listenAnswer`, `heard`, `pick`, `norm`, `halt`, `stopRead`, `stopVoice`, `stopRA`, `active`, `send`, `u` (translate), `sl` (speech language).

### How to add things
- **New question:** add an object to a flow's `steps` (strings in `{ en, am }`).
- **New message:** add a key to `UI` and use `this.u('key')`.
- **New language:** add a key such as `ti` beside `en` and `am` everywhere; extend `sl()` and the language switch.
- **After changing any text:** run `npm run recording` to regenerate `RECORDING_SCRIPT.md`, then re-record the changed files.

---

## 6. Behaviour already built (current version)

### First screen: "Would you like this page to be read aloud?"
- Spoken once, then the browser listens for **Yes** or **No** (voice) or you press the big Yes/No buttons.
- The privacy notice is spoken **once, here**, and shown once on screen: "If you choose Yes, or press a Speak button later, your browser may send your voice to its provider to turn it into text. You can choose No and type instead."
- If nothing is heard, it asks once more, then continues without reading aloud.
- Pressing any key stops this listening (the person is using the keyboard).
- This first screen now appears for **all three flows** (signup, job, employer).

### Welcome page
Start, Start with voice (only if the browser supports speech), Read to me / Stop reading.

### Question pages (one question per screen)
- Progress bar and "Question n of t". Big **Speak** button under the question on every question except the typed-only contact question. Same position every page.
- Buttons: **Next**, **Skip** (optional questions only), **Back** (not on the first question), **Read aloud** (reads this page once).
- At the top of every page: **Stop reading** (or **Read to me** when reading is off). The **Escape** key and saying "stop" do the same.
- Every page change **stops all speech and listening first** (fixed a bug where old speech kept playing).
- The first question of each flow has no Back button, and the spoken instructions do not mention Back there.
- The phone-or-email question is **typed only** (email addresses and spelled letters are not recognised reliably by speech). It reads the question aloud and says "Please type your answer in the box. Then press Next."
- Back and language switch now keep checkbox and radio choices, not only typed text.

### Hands-free voice mode (after the person says Yes to read aloud)
For each page: the page is read aloud with **numbered choices** and instructions, then the form listens automatically.
- **Radio and checkbox:** say the number ("two", "ሁለት") or the name; it reads back "You chose: …" and waits for **Next**. For checkboxes, saying a choice again unticks it.
- **Text questions:** whatever is said fills the box; it reads back "We heard: … Say Next to continue, or say your answer again."
- **Commands:** Next, Back (not on first question), Skip (optional only), Read aloud/Repeat, Stop. Commands are matched only when the whole utterance is short (one word on text questions, so a name or an answer is never mistaken for a command).
- If it hears nothing twice, it stops listening and says to press the big Speak button.
- If the device has no voice for the language (for example Amharic), it shows the message on screen, says an English notice **once**, and still listens.

### Submit and review (last page)
1. Reads all answers aloud, **numbered**, then asks: "Do you want to submit your answers? Say Yes to submit, or No to change something."
2. **Yes** submits.
3. **No** leads to: "Say Start again to go back to the first question, or say the number of the question you want to change."
4. **Start again** clears the answers (keeps display preferences) and restarts from the first question.
5. A **number** jumps to that question; after answering, it returns **straight to the review**.
6. Screen buttons match: Yes, submit / No, change something / Start again / Back / per-answer Change buttons. Questions are numbered on screen.

### Other behaviours
- Welcome and questions in English or Amharic with a language switch; Ethiopic font fallback `Noto Sans Ethiopic`.
- No time-outs: answers live in memory until submit.
- Larger text and pictures next to choices (from the preferences question); never sent.
- Private job filter runs in the browser; support and job needs never leave the device.
- Shadow DOM, 44px or larger targets (voice and main buttons 72px), green `#1b5e3f`, focus outline, reduced-motion rule.
- Recorded audio: if `audio` is set, it plays `audio/{lang}/{id}.mp3` and falls back to the device voice; the review readout never uses a recording.
- Removed earlier: the document-number question; the separate microphone-consent page (the first screen now carries the single notice).

---

## 7. Known problems and risks (be honest in the README)

1. **Not fully tested in a real browser.** Expect small bugs. Test every flow by keyboard, in Amharic, with larger text and pictures, and by voice in Chrome in English first.
2. **Docker caching:** the Dockerfile copies files when the image is built. After replacing any file, run `docker compose up --build`, then hard-refresh the browser (Ctrl+Shift+R). Several "problems" you reported came from running an older copy.
3. **Audio "folders" were empty files** (section 4). Fix first.
4. **Amharic read-aloud needs recordings.** Most devices have no Amharic voice. Until the 14 Amharic mp3 files exist, Amharic is silent.
5. **Pages that cannot be recorded** and so use only the device voice (silent in Amharic on phones without an Amharic voice): the review readout (it contains the person's own answers), the job-list question, the "You chose…" and "We heard…" confirmations, and error messages. A fuller fix would be recordings for every choice; not built.
6. **Voice recognition depends on the browser and internet.** Chrome and Edge only, audio goes to the provider, and Amharic recognition may not be supported. Typing always works.
7. **Screen reader plus our voice** can talk at the same time (NVDA, TalkBack). Ask your co-designer which they prefer; "Stop reading" and Escape help.
8. **All Amharic text is my draft.** A native speaker must check every string, including the spoken commands (ቀጥል, ተመለስ, ዝለል, አንብብልኝ, አስገባ, ጀምር, እንደገና ጀምር). Do not use machine translation for forms.
9. **Hiding a question** (`hide` attribute) does not change the recordings, so audio would still describe the full list.
10. **Emoji icons** may not show on old Android phones. **CSS `:has()`** (card highlight) may not work on old browsers; it degrades safely.
11. **Demo security:** open CORS, no authentication, in-memory storage (lost on restart). Say so plainly in the README.
12. **Licences "verify" in the README** (Express and cors MIT, axe-core MPL-2.0, Playwright Apache-2.0, nginx BSD-2) are from memory. Confirm them and confirm compatibility with the licence ALX names.
13. **WCAG 2.2 new criteria** (2.5.8 target size, 3.3.7 redundant entry, 3.3.8 accessible authentication) came from memory. Verify at w3.org/TR/WCAG22.
14. **Savanna static pages repo** (alx-africa/Savanna-static-pages) is a look-and-feel reference and a test host, **not** the integration docs, and it has no visible licence: do not copy its fonts, images or CSS.

---

## 8. API (`server.js`, port 3000)
- `GET /v1/health`, `GET /v1/jobs`, `POST /v1/learners` (needs `fullName`), `POST /v1/applications` (needs `role`), `POST /v1/employer/jobs` (needs `job`, optional `offers` array which adds a job to the list).
- 422 with `{ error: { code, message } }` for missing required answers; 201 with `{ id }` only on success.
- Support answers go to a **separate store**; **no route returns them**.
- Storage is in memory. CORS open. No authentication. `express.static('public')` also serves the plugin and the audio folder.
- Demo jobs: "Customer support agent" (remote, flexible hours) and "Data entry clerk" (step-free, screen-reader friendly tools). Employer-added jobs have no Amharic title.

---

## 9. Design decisions and why

| Decision | Why |
|---|---|
| Web Component in one script file, not a React package | The event scores script-tag install; no framework on the host; small download for 3G |
| In-memory storage behind simple routes, no PostgreSQL | A judge must install in an hour; no lock-in; document a swap-in point |
| Filter jobs in the browser | The needs never leave the device |
| Removed the document-number question | Minimum data; avoids excluding people without documents |
| Support question optional, private, last, skippable | Brief requires a private way to ask for support; must not disclose a disability to employers |
| Separate display-preferences step | Preferences apply immediately and ask for no disclosure |
| Recorded audio fallback for Amharic read-aloud | Many phones have no Amharic voice |
| Single privacy notice on the first screen | Earlier version repeated it three times; the person chooses Yes with full information |
| Phone-or-email is typed only | Spoken email addresses ("@", spaces between letters) were unreliable |
| Review as a yes/no question, then number or Start again | Eyes-free correction without hunting for buttons; you chose this |
| Stop reading everywhere (button, Escape, voice) | Needed for noise, phone calls, or preference; you asked for it |
| `hide` attribute | A real site that does not check identity can leave the ID question out (better "can be adopted" score) |
| Separate demo host on another port | Proves the plugin installs on another site |
| Do not claim unbuilt features | Judges check the README against the build |

### About "How would you like to show who you are?"
It exists because the brief says nobody may be blocked for lacking a kebele ID or passport. The answer is only stored as a chosen route. Nothing is verified. A site that does not need identity can hide it. A plugin is ready-made code a site owner adds with two lines of HTML, like embedding a video; the owner chooses which options it shows.

---

## 10. Recording script (summary)
Full text is in `RECORDING_SCRIPT.md` (regenerate with `npm run recording`). **14 files per language, 28 in total:**

`raAsk`, `raAgain`, `welcome`, `prefs`, `fullName`, `contact`, `idRoute`, `support`, `needs`, `why`, `job`, `offers`, `reviewFix`, `done`

- Folders: `public/audio/en/` and `public/audio/am/`; file name = id plus `.mp3`, exact capitals (for example `public/audio/am/fullName.mp3`).
- mp3, mono, 64 kbps or lower, quiet room, slow clear voice, read every word exactly as written including the numbers ("1:" spoken "one").
- Do **not** record: `review` (reads the person's answers), `role` (list changes), error messages.
- Record in this priority order: `raAsk`, `welcome`, then `prefs`, `fullName`, `contact`, `idRoute`, `support`, `reviewFix`, `done`, then the job and employer files.
- A native Amharic speaker must fix the Amharic in `db-form.js` first; if any text changes later, regenerate and re-record that file.

---

## 11. Tests
- `npm test` runs the API tests and the voice-logic tests (start the server first: `node server.js` or Docker).
- `npm run test:voice` runs only the voice-logic tests (no server needed): option matching by number and name (English and Amharic), Back wording, typed-only contact question, review flow (yes, no, number, start again), return to review after one change, stop, hide.
- Accessibility (Playwright with axe, with the demo host running on 8080):
  `npm i -D @playwright/test @axe-core/playwright`, `npx playwright install chromium`, `npx playwright test tests/a11y.spec.js`. It currently checks only the **first screen** of each flow. Add checks for question, review, error and success screens.

### Manual test script (do this tonight)
1. Rebuild: `docker compose up --build`, open http://localhost:8080, hard-refresh.
2. Keyboard only (no mouse): complete signup. Tab order, visible focus, Enter submits, Escape stops.
3. First screen: say "yes", then "no"; then press the buttons. Check the privacy notice plays once.
4. Voice (Chrome, English): say "two" on the ID question, "Next", "skip" on an optional question, "back" on a later question, "read aloud", "stop".
5. Review: say "no", "two", answer, confirm it returns to the review; say "start again"; finally say "yes" to submit.
6. Contact question: confirm there is no Speak button and nothing listens.
7. Amharic: switch language; check text shows (Ethiopic font), then test with recordings once they exist.
8. Job flow: pick needs, see the filtered job list, apply by voice. Employer flow: post a job, then see it in the job flow.
9. Preferences: larger text and pictures next to choices.
10. Phone: test on a real cheap Android over a slow connection (emoji icons, size, speed).

---

## 12. What still needs to be done (in order)

### Right now
1. Fix the audio folders (section 4) and add `.gitkeep`.
2. `docker compose up --build`, hard-refresh, run the manual test script.
3. Commit and push everything (`git add .`, `git commit`, `git pull`, `git push`).

### Tonight
- Get a native speaker to check all Amharic text, then record the 28 audio files (priority order in section 10).
- Run `npm install`, `npm test`, then the Playwright axe tests; fix every critical and serious issue on every screen.
- Try loading the plugin inside a Savanna test page (static pages repo or the starter pack from the organisers).
- Consider save-and-resume by link and partner consent only after everything above is stable.

### Sunday
- 1:00 PM: full **gate test** with your co-designer: keyboard only; NVDA with Chrome; TalkBack; 200% zoom; sound off; axe zero; contrast at least 4.5 to 1; the co-designer finishes the main task unaided. Repeat in Amharic.
- Fill in `CONFORMANCE.md` honestly (date, scope, technologies, tools tested, result per criterion, known issues).
- Finish `README.md`: team and co-designer names, install in 5 minutes, API, languages and audio, privacy, build vs reuse with licences, tests, known limitations.
- Add the `LICENSE` file once ALX names the licence.
- **Clean install test** on another laptop: `git clone`, `docker compose up --build`, follow only the README.
- Code freeze at 4:00 PM. **Submit by 4:15 PM**: code, README, Docker Compose, conformance report.

### If you run out of time
**Cut:** Level 3, SMS, partner registration, offline cache, theming, extra languages.
**Never cut:** the gate (keyboard, screen reader, no time-outs, axe clean), Amharic on the main signup, the README, `CONFORMANCE.md`, Docker Compose, a few tests, the co-designer test.

---

## 13. Accessibility and privacy rules to keep
- One question per screen; Back keeps answers; no time-outs; no CAPTCHA or login on sign-up.
- Every control has a label; errors name the problem and say how to fix it; everything works by keyboard with visible focus.
- Voice is optional; the notice comes before the first listening; typing always works; the transcript is editable before it is accepted.
- Read-aloud never starts on its own after the person says No, and can always be stopped.
- Contrast at least 4.5 to 1; text scales to 200%; icons always accompanied by text.
- Support requests are optional, private, need no proof, and are never sent to employers.
- Collect the minimum; fake data in development and demo; no secrets in Git.
- Small bundle, no web fonts, remember cheap Android phones on 3G.
- Animation respects reduced motion and never flashes.

---

## 14. Commands cheat sheet
```bash
# Git
git clone REPO_URL
git pull
git add .
git commit -m "what I changed"
git pull
git push

# Run everything with Docker (REBUILD after every file change)
docker compose up --build
docker compose down
docker compose logs host
docker compose exec host ls -la /usr/share/nginx/html

# Without Docker
npm install
node server.js
npx http-server demo-host -p 8080

# Checks
node --check public/db-form.js
npm test
npm run test:voice
npm run recording
npm i -D @playwright/test @axe-core/playwright
npx playwright install chromium
npx playwright test tests/a11y.spec.js
```
Addresses: partner site http://localhost:8080 ; plugin script http://localhost:3000/db-form.js ; API http://localhost:3000/v1/health.

**docker-compose.yml must be:**
```yaml
services:
  web:
    build: .
    ports:
      - '3000:3000'
  host:
    image: nginx:alpine
    ports:
      - '8080:80'
    volumes:
      - ./demo-host:/usr/share/nginx/html:ro
```
The earlier nginx 403 came from pointing the volume at a folder with no `index.html`. The volume must be `./demo-host` and `demo-host/index.html` must exist. If a 403 persists, run `docker compose logs host`.

---

## 15. Questions for the organisers (Saturday morning)
- Which open licence must we use?
- What does the Savanna starter pack contain and how do we integrate?
- Who is our co-designer and when can we test with them?
- What environment will judges use for the install test?
- Is there a live presentation or demo slot?
- Is any overnight stay needed?

---

## 16. Demo script (3 minutes, if there is a presentation)
1. Problem (20s): timed forms and mandatory ID shut people out.
2. Install (30s): the partner page and the two lines of HTML.
3. Learner (80s): answer by voice, choose an alternative ID route, set a private support preference, review by voice ("no", change one answer), submit.
4. Career gateway (40s): filter jobs by accommodations, apply by voice.
5. Employer (20s): post a job with accommodations.
6. Impact (10s): reusable, private, tested, runs inside Savanna.
Only show features that really work.

---

## 17. Earlier documents and reviews (context)
- Published pages from the earlier chat: Team Playbook https://claude.ai/artifact/TACwCE65djhBCyr4u5CxeF ; Track 1 Execution Plan https://claude.ai/artifact/HegbJ5hzPmZgtQ4kxFYvG9 ; Corrected Team Plan https://claude.ai/artifact/4TNW1Q2dZ1KNvFzu7mGqkN . If the links stop working, this file is self-contained.
- Your team's plan (`Inclusive_Access_Plugin_Team_Project_Plan.docx`) was reviewed: good product definition and teamwork, but React-package-first conflicts with the script-tag install the event scores; Docker Compose, the conformance report, the axe gate, the co-designer, Savanna and Amharic were missing from the priorities; PostgreSQL and authentication are too heavy for two days.
- Your infographic concept (welcome and language screen, voice input, ID options, private support, success screen, job application with voice, employer form, SMS save and resume, partner registration, low-literacy mode, private job filtering) was implemented for the registration look and feel and the items marked "not built" in section 1.

---

## 18. Paste this into another AI assistant to continue

> I am competing in the Digital Bridge Accessibility Hackathon 2026 (ALX, Addis Ababa), Track 1: Accessible Onboarding. Submission is Sunday 15 November 2026 at 4:30 PM. I am building "Inclusive Access": a drop-in web component plugin (`<db-form>`, single file `public/db-form.js`) for accessible sign-up plus a career gateway (voice job application, private job filter, employer accommodations form), with a small Node/Express API (`server.js`), Docker Compose, an OpenAPI file and a WCAG 2.2 AA conformance report. It must install by script tag (Level 1) and REST API with OpenAPI (Level 2), run inside the Savanna platform, support Amharic and English, work on cheap Android over 3G, and pass a gate: a co-designer completes the task unaided with NVDA, TalkBack, keyboard only, 200% zoom, sound off, and axe-core shows zero critical or serious issues. Voice features already built: a first screen that asks (by voice or button) whether to read aloud, with one privacy notice; hands-free answering by number or name, with Next, Back, Skip, Read aloud and Stop; a typed-only phone-or-email question; a spoken yes/no submit review with "change question number" and "start again"; Stop reading on every page; Amharic read-aloud through recorded mp3 files (not yet recorded; 14 per language listed in RECORDING_SCRIPT.md); a `hide` attribute to leave questions out. Current status: logic tests pass, but the plugin has not been fully tested in a real browser; Amharic text is a draft needing native-speaker checking; save-and-resume, partner registration, Savanna integration and Level 3 are not built. I will paste my files (public/db-form.js first, then server.js, demo-host/index.html, docker-compose.yml, README.md, CONFORMANCE.md, tests, openapi.yaml). Please help me test, debug and finish, prioritising the gate, the README and the conformance report, and never claim features that are not built.

---

## 19. Final reminders
- Keep every file you downloaded from this chat. The latest versions of `db-form.js`, `README.md`, `RECORDING_SCRIPT.md`, `package.json`, `tests/voice.test.js`, `tools/make-recording-script.mjs` and this file are the ones to use.
- Commit and push to GitHub often so nothing is lost.
- The co-designer test is worth 30 points and decides the gate: start it today.
- Be honest in the README about what is simulated or missing. Judges prefer honest to perfect.