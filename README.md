# Inclusive Access · Track 1: Accessible onboarding · Team Pixel

**Team Pixel:** Newal Elias, Samuel Girma, Nobel Alemayehu, Megdelawit Abraham · **Co-designer:** Tinsae
**Live:** https://inclusive-access.onrender.com (no login) · **Licence:** [MIT](LICENSE) (the generated voice clips are CC-BY-NC 4.0, see [Libraries and their licences](#libraries-and-their-licences))
Partner install guide: **[PARTNER_GUIDE.md](PARTNER_GUIDE.md)** · Put it online: **[DEPLOY.md](DEPLOY.md)** · Accessibility: **[CONFORMANCE.md](CONFORMANCE.md)** and the full **[WCAG 2.2 AA report](docs/WCAG-2.2-AA-Report.md)**

[![tests](https://github.com/newal-dev/new-track1/actions/workflows/test.yml/badge.svg?branch=claude/busy-tesla-9gbzv7)](https://github.com/newal-dev/new-track1/actions/workflows/test.yml) · every push runs 115 unit/voice/API tests, the colour-contrast check and 33 browser tests with axe-core

## Start here

**Live links** (no login; the free server may take about a minute to wake up on the first visit):

| Link | What it is |
|---|---|
| https://inclusive-access.onrender.com/site/savanna/pages/signup.html | **The plug-in inside the Savanna page** (the demo we show) |
| https://inclusive-access.onrender.com/site/ | Demo partner site: sign-up, **Apply for a job**, **For employers** |
| https://inclusive-access.onrender.com/site/blank.html | An empty page with only the two install lines |
| https://inclusive-access.onrender.com/site/my-answers.html | **My answers:** type your receipt code to see, download or delete your answers |
| https://inclusive-access.onrender.com/docs | API documentation (try every call) |

**Install in three steps** (Node.js 20+ and git; or `docker compose up --build` instead of steps 2–3):

```sh
git clone https://github.com/newal-dev/new-track1.git && cd new-track1
npm ci
npm start      # then open http://localhost:3000
```

On any partner website it is two lines: `<script src='https://inclusive-access.onrender.com/widget.js' defer></script>` and `<db-onboarding api='https://inclusive-access.onrender.com/v1'></db-onboarding>`.

**Run the tests:**

```sh
npm test                                   # 115 unit, voice and API tests, no server needed
npx playwright install chromium && npm run test:a11y   # 33 browser + axe-core tests, starts the servers itself
```

**Privacy in one line:** nothing is sent without a tick; support needs need a second tick and are never shown to employers; every learner gets a receipt code to see, download or **delete** their answers. Full note: **[PRIVACY.md](PRIVACY.md)**.

## What it does

Inclusive Access is a drop-in module that adds an accessible **sign-up**, a **job search and application**, and an **employer job form** to any website or learning platform, Savanna first, with one script tag. People can type, speak their answers, or have every page read aloud, in **English, አማርኛ, Afaan Oromoo, ትግርኛ, Soomaali and Sidaamu Afoo**, with the keyboard, NVDA or TalkBack. It never times out, never demands an ID, keeps support needs private, and sends nothing without the person's consent.

## The main task we tested

**A blind learner with no kebele ID signs up by voice, in Amharic, on a low-cost Android phone, with nobody helping.**

The same engine runs the job application and the employer accommodations form (the career gateway). Our co-designer Tinsae shaped the design; what was and was not tested is at the end of [CONFORMANCE.md](CONFORMANCE.md).

## Run it

You need **Docker Desktop** and **git** (or Node.js 20+ instead of Docker).

```sh
git clone https://github.com/newal-dev/new-track1.git
cd new-track1
docker compose up --build
```

Wait for `Plugin server on http://localhost:3000`, then open:

| Open | What you see |
|---|---|
| http://localhost:8080 | Demo partner website with the sign-up form. Its menu switches to **Apply for a job** and **For employers** |
| http://localhost:8080/blank.html | **The judge's test:** an empty page with no Bootstrap, no Savanna CSS and no styles at all, only the two lines below |
| http://localhost:8080/savanna/pages/signup.html | **Inside the official Savanna starter** (`savanna/`, ALX's pages unchanged): Savanna's own header and sidebar, our sign-up in `<main>`; when sign-up is done it goes to the learner homepage |
| http://localhost:8080/savanna.html | The same plug-in inside a Savanna-style course page |
| http://localhost:3000/docs | **Interactive API documentation** (Swagger UI): try every call in the browser |
| http://localhost:3000/demo/lms | A built-in learning platform: each button does a real, signed **LTI 1.3** launch |
| http://localhost:3000/v1/jobs?format=jsonld | Jobs as **schema.org/JobPosting** |
| http://localhost:3000/demo/sms-inbox | Simulated SMS confirmations (no SMS gateway, no cost) |
| http://localhost:8080/design-system.html | Design system: tokens, themes, components |

- **Without Docker:** `npm ci`, then `npm start` in one terminal and `npm run demo` in another. The addresses are the same.
- **One server, one address:** the API server also serves the demo partner site at `/site/` (the bare address opens it), so the whole MVP deploys as one container. Step by step for Render's free plan (a `render.yaml` blueprint is included): [DEPLOY.md](DEPLOY.md).
- **Settings:** all optional for a demo. Copy [`.env.example`](.env.example) to `.env`; `docker compose` passes them on. Never commit a real `.env`.

**Try it in 3 minutes:** open http://localhost:8080 and choose **አማርኛ**. Choose **Yes** to read aloud and listen; press **Escape**, then use only Tab, Space and Enter. Leave the name empty and press Next to hear the error. Reload halfway to see the draft offer. On the review page, tick the consent box and send.

**Run the tests:**
```sh
npm ci
npm test                       # 115 unit, voice and API tests; no server needed
npx playwright install chromium
npm run test:a11y              # 33 browser tests with axe-core; starts the servers itself
npm run contrast               # every colour pair in every theme
node tools/measure-3g.mjs      # load time on Slow 3G and 3G (servers running)
```
Or everything inside Docker: `docker compose --profile test run --rm tests`.

## Install, Level 1: script tag and Web Component

```html
<script src='https://YOUR-HOST/widget.js' defer></script>
<db-onboarding api='https://YOUR-HOST/v1' audio='https://YOUR-HOST/audio' partner='Your organisation'></db-onboarding>
<script>
  document.addEventListener('db-signup:done', e => console.log(e.detail)); // optional: the host decides what to do next
</script>
```

- **Tags:** `<db-onboarding>` is sign-up, `<db-career-gateway>` is job search and application, `<db-form flow='signup|job|employer'>` gives any flow.
- **Attributes:** `api`, `audio`, `partner` (named in the consent question), `lang` (en, am, om, ti, so, sid), `lang-ask='no'` (skip the language page), `theme` (auto, standard, dark, contrast, rg, by), `hide` (comma list of questions to leave out), `sw` (offline service worker), `asr` (browser, off, or a registered recogniser), `fonts='no'`, `jsonld='no'`.
- **Events**, all `bubbles` and `composed`:

| Event | `detail` | When |
|---|---|---|
| `db-signup:step` | `{ step, of, id }` | each new question (the organisers' data contract; `db-job:step`, `db-employer:step` in the other flows) |
| `db-signup:done` | `{ profile: { fullName, contact, idRoute, language }, id, receipt, voiceNotes: [] }` | sent, without support needs |
| `db-signup:support` | `{ support: [...] }` | sent separately, only when the learner agreed to share support needs |
| `db-complete` | `{ answers, id, receipt }` | sent (all flows) |
| `db-error`, `db-queued`, `db-sent` | | send failed; saved offline; offline answers sent later |
| `db-theme`, `db-textsize` | `{ theme }`, `{ scale }` | the learner changed colours or text size: the host can follow, so its menu grows too |

- Everything runs in an open **Shadow DOM**: the host's CSS cannot break it. On the host page it adds only its own `@font-face` declarations (turn off with `fonts='no'`) and, on the job page, the JobPosting data (`jsonld='no'`). No global variables, and no changes to the host's elements or styles. CSS hooks: `--db-accent`, `--db-font`.
- The host page needs nothing else: no framework, no build step.

## Install, Level 2: REST API

[`openapi.yaml`](openapi.yaml) (OpenAPI 3.0.3), interactive at **`/docs`**. JSON in and out; `201` with `{ id, receipt }` on success, `422` with `{ error: { code, message, field } }` for bad input, `404` for not found.

| Call | What it does |
|---|---|
| `GET /v1/health` | Server status |
| `GET /v1/jobs`, `GET /v1/jobs/{id}` | Published jobs (`?format=jsonld` for schema.org) |
| `POST /v1/learners` | Sign-up |
| `POST /v1/applications` | Job application |
| `POST /v1/employer/jobs` | Employer job with the adjustments it offers |
| `GET /v1/records/{id}` + `X-Receipt` | **Export** everything held about one record |
| `DELETE /v1/records/{id}` + `X-Receipt` | **Delete** it (withdraw consent) |
| `GET /v1/consents` | Consent log for the partner (`Authorization: Bearer <ADMIN_TOKEN>` when set) |

One `curl` per call, to paste:
```sh
curl http://localhost:3000/v1/health
curl http://localhost:3000/v1/jobs
curl -X POST http://localhost:3000/v1/learners -H "Content-Type: application/json" \
  -d '{"fullName":"Test Learner","contact":"0911000000","idRoute":"refer","consent":{"given":true,"scope":["answers"],"lang":"am"}}'
curl -X POST http://localhost:3000/v1/applications -H "Content-Type: application/json" \
  -d '{"role":"Data entry clerk","why":"I like careful work.","consent":{"given":true,"scope":["answers"]}}'
curl -X POST http://localhost:3000/v1/employer/jobs -H "Content-Type: application/json" \
  -d '{"job":"Junior web developer","offers":["remote","hours"],"consent":{"given":true,"scope":["answers"]}}'
curl http://localhost:3000/v1/records/<id> -H "X-Receipt: <receipt>"
curl -X DELETE http://localhost:3000/v1/records/<id> -H "X-Receipt: <receipt>"
curl http://localhost:3000/v1/consents -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Install, Level 3: open standards

- **LTI 1.3:** OIDC login `/lti/login`, launch `/lti/launch`, keys `/lti/jwks.json`, tool configuration `/lti/config.json`. The launch is checked against the platform's keys, issuer, audience, expiry, one-time nonce, signed state, message type and version. The launch locale chooses the language and the custom `flow` chooses the form; the learner's name and email from the platform are not used. Try it with the built-in platform at `/demo/lms`. To register a real one (Moodle, Canvas, Savanna), set `LTI_ISSUER`, `LTI_CLIENT_ID`, `LTI_AUTH_URL`, `LTI_JWKS_URL` and `LTI_DEPLOYMENT_ID`. Launch only: no grade passback or deep linking.
- **schema.org/JobPosting:** from the API, and added to the host page as JSON-LD when the job list is shown. It holds only what employers published.
- **ALX Savanna:** a host like any other: Level 1 in a page, or Level 3 from the platform. **`savanna/pages/signup.html` runs it inside the official Savanna starter** (github.com/alx-africa/Savanna-static-pages, included unchanged as the Technical Guide asks; see [savanna/NOTICE.md](savanna/NOTICE.md), it is ALX's and not under our licence), `/demo/lms` shows the LTI case.

## Languages

- **English, አማርኛ, Afaan Oromoo, ትግርኛ, Soomaali, Sidaamu Afoo.** The **Amharic** text has been checked by a native speaker. Afaan Oromoo, Tigrinya, Somali and Sidaamu Afoo are **drafts** until native speakers check them (every such line is marked `VERIFY_NATIVE` in `public/db-form.js`).
- **The language page** asks in English for English only; then each language invites its own speakers in its own voice and by its own name ("ለአማርኛ «አማርኛ» ይበሉ"). After each invitation there is a beep and a 4-second listening window with a recogniser that suits that language, so people can answer as soon as they hear their own. Own-language names, common mis-hearings and near misses count; if nothing is understood, it asks again in English and Amharic.
- **Read aloud** plays 715 recorded clips (`public/audio/{en,am,om,ti,so,sid}/`, Meta MMS-TTS, made offline), so it works on phones with no Amharic voice. The review page is put together from short clips (heading, number, question, chosen option, a phone number read back in groups), so it is spoken in every language. Words the person typed (a name) are read by the device voice, or else by an English voice with Ge'ez spelled in Latin letters: never silent. Key names (Tab, Enter, Esc) are said in English, as people know them. The Amharic digits 0 to 9 were chosen by a native speaker, by ear.
- **Voice input:** after a page is read, the form says "Speak now", beeps, then listens. Answers can be numbers ("two", "ሁለት", "12" for 1 and 2) or names, with commands (Next, Back, Skip, Read aloud, Stop) in all six languages. The phone or email question can be spoken ("zero nine one one…", "abebe at gmail dot com"). Browser speech recognition often has no Afaan Oromoo or Tigrinya: typing always works.
- **Keyboard and screen readers:** Tab and Shift+Tab visit every choice, Space or Enter chooses, Escape stops the voice; a help strip on every page says so in the chosen language. Details and the ARIA patterns: [docs/WCAG-2.2-AA-Report.md](docs/WCAG-2.2-AA-Report.md).
- **Adding a language:** add its code to `LANGS` and `LANG_RE` in `public/db-form.js`, a column of text (the Sidama block `SID` shows the pattern: one place, falls back to English line by line), then `npm run recording` and make its clips ([RECORDING_SCRIPT.md](RECORDING_SCRIPT.md)).
- **Built for Ethiopia:** Ge'ez script with local Noto Sans Ethiopic and `lang` on every part; the **Ethiopian calendar** (13 months including ጳጉሜን, "Not sure" allowed) for job closing dates, converted for JobPosting; Ethiopian phone numbers (`09…`, `07…`, `+251…`, typed or spoken, stored as `+251…`); four identity routes including "I don't have an ID. Refer me through a partner"; Ge'ez input methods never submit early.

## Offline and slow connection

Measured with `node tools/measure-3g.mjs` on `blank.html` (empty cache, Chrome network throttling), 15 November 2026:

| Connection | First question on screen | Downloaded |
|---|---|---|
| Slow 3G (400 kbit/s, 2000 ms latency) | **5.4 s** | 210 kB |
| 3G (1.6 Mbit/s, 300 ms latency) | **1.1 s** | 211 kB |

- **Size:** `widget.js` is 160 kB, sent **gzip-compressed as 56 kB**. No framework. Fonts load only for the scripts on screen (the Ethiopic font only when Ge'ez is shown). Voice clips are 48 kbit/s mp3 that load only when played.
- **Offline:** answers are saved on the phone as the person goes (kept 7 days, offered again after a reload). A form sent with no signal is kept on the phone and sent when the connection returns, and the person is told so in words. With the partner's one-line service worker (`sw` attribute), the page, widget, fonts, job list and played clips open offline too. After an update, the offline copy replaces itself.

## Data and privacy

| What | Where | How to see or delete it |
|---|---|---|
| Sign-up answers: name, phone or email, identity route (no document numbers) | The server (in memory in this demo) | **Delete my answers** on the thank-you page, or the **My answers** page with the receipt code (`/v1/receipts/{code}`) |
| Support needs (optional, no proof) | Only with a **second, separate** consent; a separate store; never shown to employers | Same export and delete |
| "Prefer not to say" | Nowhere: nothing about support is sent | |
| Job seeker's work needs | **Never leave the phone**: the job filter runs on the device | |
| Draft answers | The learner's own browser (local storage), 7 days | "Start again" deletes them |
| Consent record | The server: what was agreed, when, language, partner. No names or answers | `GET /v1/consents` for the partner |

- **Nothing leaves the host without consent:** the review page has a required "I agree to send these answers to {partner}" box, and the server refuses any submission without it. Unknown fields are dropped (minimum data).
- **Voice:** recognition is done by the browser's speech service (Chrome and Edge send audio to their provider). This is said before any listening starts; typing always works; `asr='off'` turns voice off.
- Designed around the consent, minimisation and erasure principles of Ethiopia's Personal Data Protection Proclamation No. 1321/2024 (our reading, not legal advice). Use test data only: no real names, phones or documents.

## Cost to run

Rough estimate for **3,000 learners a month**: **about US$5–10 a month** for one small cloud server or container (512 MB of memory is enough); the free tier of several hosts covers a pilot. There are **no per-learner, per-request or paid-API fees**: speech uses the browser, voices are pre-recorded files, and nothing calls a paid service. Data is about 1 kB per sign-up (about 3 MB for 3,000 learners); traffic is about 1–2 MB per learner (the page plus the clips they play), so about 3–6 GB a month. A real database (for example a small managed PostgreSQL) would add its own cost.

## Finished and not finished

**Finished:** the three flows (sign-up, job application, employer form) in six languages; voice input and read-aloud with recorded clips; keyboard, screen-reader, 200% text and colour-theme support; consent, separate support consent, export and deletion (on the thank-you page and the "My answers" page, with only the receipt code); drafts and offline sending; Ethiopian calendar; Level 1, Level 2 (OpenAPI + `/docs`) and Level 3 (LTI 1.3 launch, JobPosting); running inside the official Savanna starter; one-container deployment; 115 unit/API tests, 33 browser tests, 0 axe violations, run by GitHub Actions on every push.

**Not finished, honestly:**
- **Native review** of Afaan Oromoo, Tigrinya, Somali and Sidaamu Afoo (Amharic is checked).
- **Voice-note fallback** (recording audio where speech-to-text does not work): not built; people type instead.
- **A partner registering a learner with consent**, and **save and resume by SMS link**: not built (SMS is a simulated inbox for confirmations).
- **Text in language files** (`en.json`, `am.json`): the text is in tables inside `public/db-form.js`, one block per language, not separate files yet.
- **Inside the live Savanna:** tested inside the official Savanna starter pages and with LTI 1.3, not on the live Savanna platform. The "My Profile" edit mode the guide mentions is not built (the component signs up; it does not edit an existing profile).
- **Production:** storage is in memory, the API has no staff login, and LTI is launch only. Add a database and authentication before real use.
- **Voices:** the generated clips are non-commercial (CC-BY-NC); commercial use needs human recordings (the file names stay the same).

## Libraries and their licences

| Part | Decision | Licence | Why |
|---|---|---|---|
| Form engine, Web Components, calendar, consent, drafts | Built | MIT (ours) | One small file that works as a script tag on any site and on cheap phones |
| Server | Express, cors, compression | MIT | Small, well known, no paid services |
| LTI 1.3 token checks | `jose` | MIT | Correct JWT and JWK handling; no native code |
| API documentation page | Swagger UI (`swagger-ui-dist` 5.17.14 from a CDN) | Apache-2.0 | The standard interactive OpenAPI viewer |
| Speech recognition and device voice | Browser Web Speech API, behind our own router (`asr`) | Built into browsers | No paid API; a self-hosted recogniser can be plugged in |
| Read-aloud clips (all six languages) | Meta MMS-TTS models, run once offline | **CC-BY-NC 4.0 (non-commercial)** | The only free voices for these languages |
| Romanisation for MMS (am, ti) | uroman | MIT-style | The Amharic and Tigrinya voice models expect Latin letters |
| Fonts | Atkinson Hyperlegible, Noto Sans Ethiopic, Source Serif 4 (fontsource), served locally | SIL OFL 1.1 | Legibility and Ge'ez support with no external font service |
| Tests | Playwright, axe-core | Apache-2.0, MPL-2.0 | Standard browser and accessibility checks |
| Demo host | nginx image | BSD-2-Clause | Shows a real cross-site install |

## Project layout
```
public/db-form.js      the plug-in (also served as /widget.js)
public/db-sw.js        offline service worker (imported by the partner's one-line file)
public/audio/          read-aloud clips per language
public/fonts/          local fonts (OFL)
server.js              REST API, JobPosting, LTI 1.3, demo LMS, SMS inbox, /docs, the demo site at /site/
openapi.yaml           API specification
demo-host/             partner site, blank page, Savanna-style page, design system
savanna/               the official Savanna starter (ALX's, unchanged) plus pages/signup.html
tests/                 core, voice and API tests (node --test), a11y.spec.js (Playwright + axe)
tools/                 recording script and voice generator, contrast check, 3G measurement, demo server
docs/                  WCAG 2.2 AA report, manual test script, team testing guide
```
