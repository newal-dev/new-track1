# Inclusive Access: accessible onboarding and career gateway plug-in (Track 1)

A drop-in plug-in that adds accessible **sign-up**, **job search and application**, and an **employer job form** to any website or learning platform, in **English, አማርኛ, Afaan Oromoo, ትግርኛ, Soomaali and Sidaamu Afoo**. It is one script and one HTML tag, not a standalone site. People can type, speak, or have every page read aloud. The keyboard, NVDA and TalkBack are fully supported.

- Team: _add names_ · Co-designer: _add name_ · Licence: [MIT](LICENSE). The generated voice clips are CC-BY-NC 4.0, see [Build vs reuse](#build-vs-reuse).
- Partners: step-by-step installation is in **[PARTNER_GUIDE.md](PARTNER_GUIDE.md)**.
- Accessibility report: **[docs/WCAG-2.2-AA-Report.md](docs/WCAG-2.2-AA-Report.md)** (summary in [CONFORMANCE.md](CONFORMANCE.md)).

## Run it (judges: about 10 minutes)

You need **Docker Desktop** (or Node.js 20+ for the second option) and **git**.

```sh
git clone https://github.com/newal-dev/new-track1.git
cd new-track1
docker compose up --build
```

Wait until you see `Plugin server on http://localhost:3000`, then open:

| Open | What you see |
|---|---|
| http://localhost:8080 | Demo partner website with the sign-up form. The nav switches to **Apply for a job** and **For employers** |
| http://localhost:8080/savanna.html | The same plug-in inside a Savanna-style course page (`<db-onboarding>`) |
| http://localhost:3000/demo/lms | A built-in learning platform. Each button does a real, signed **LTI 1.3** launch |
| http://localhost:3000/v1/jobs?format=jsonld | Jobs as **schema.org/JobPosting** |
| http://localhost:3000/demo/sms-inbox | Simulated SMS confirmations (no SMS gateway, no cost) |
| http://localhost:3000/openapi.yaml | The REST API specification |
| http://localhost:8080/design-system.html | Design system: tokens, themes, components |

**Without Docker:** `npm ci`, then `npm start` in one terminal and `npm run demo` in another. The URLs are the same.

**Run the tests:**
```sh
npm ci
npm test                       # unit, voice and API tests; no server needed
npx playwright install chromium
npm run test:a11y              # browser tests with axe-core; starts the servers itself
npm run contrast               # contrast of every colour pair in every theme
```
Or everything inside Docker: `docker compose --profile test run --rm tests`.

**Try in 3 minutes:** open http://localhost:8080 and choose **አማርኛ**. Choose **Yes** to read aloud and listen; choose **Stop reading**, then use only Tab, Space and Enter. Leave the name empty and press Next to see the error. Reload halfway to see the draft offer. Finish on the review page, tick the consent box, and send.

## Add it to a site

**Level 1: script and Web Component.** Paste two lines (details in [PARTNER_GUIDE.md](PARTNER_GUIDE.md)):
```html
<script src='https://YOUR-HOST/widget.js'></script>
<db-onboarding api='https://YOUR-HOST/v1' audio='https://YOUR-HOST/audio' partner='Your organisation'></db-onboarding>
```
- `<db-onboarding>` is sign-up and `<db-career-gateway>` is jobs. `<db-form flow='signup|job|employer'>` gives any flow.
- Everything runs in an open Shadow DOM: the host's CSS cannot break it, and it cannot change the host.
- Attributes: `api`, `audio`, `partner` (name in the consent question), `lang` (en, am, om, ti, so, sid), `lang-ask='no'`, `theme` (auto, standard, dark, contrast, rg, by), `hide`, `sw` (offline), `asr` (browser, off, or a registered recogniser), `fonts='no'`, `jsonld='no'`.
- Events: `db-complete`, `db-error`, `db-queued`, `db-sent`, `db-theme`. CSS hooks: `--db-accent`, `--db-font`.
- Size: `widget.js` is about 155 kB uncompressed (under 250 kB). Fonts are fetched only when needed, and the Ethiopic font only when Ge'ez text is shown.

**Level 2: REST API and OpenAPI.** [`openapi.yaml`](openapi.yaml) (OpenAPI 3.0.3, validated). Routes:
- `GET /v1/health`, `GET /v1/jobs`, `GET /v1/jobs/{id}`
- `POST /v1/learners`, `POST /v1/applications`, `POST /v1/employer/jobs`
- `DELETE /v1/records/{id}`, `GET /v1/consents`, `GET /v1/consents/{id}`

**Level 3: open standards.**
- **LTI 1.3:** OIDC login `/lti/login`, launch `/lti/launch`, keys `/lti/jwks.json`, tool configuration `/lti/config.json`. It checks the signature against the platform's keys, plus issuer, audience, expiry, one-time nonce, signed state, message type and version. The launch locale chooses the language; custom `flow` chooses the form. The learner's name and email from the LMS are not used. Launch only: no grade passback or deep linking. To register a real platform, set `LTI_ISSUER`, `LTI_CLIENT_ID`, `LTI_AUTH_URL`, `LTI_JWKS_URL` and `LTI_DEPLOYMENT_ID`.
- **schema.org/JobPosting:** from the API, and added to the host page as JSON-LD when the job list is shown. It contains only what employers published.

**ALX Savanna.** Savanna is a host like any other: use Level 1 in a page, or Level 3 (LTI 1.3) from the platform. `demo-host/savanna.html` shows the course-page case and `/demo/lms` shows the LTI case. We did not have the Savanna starter pack, so this was **not tested inside the real Savanna**.

## Keyboard and ARIA

| Key | What it does |
|---|---|
| Tab, Shift+Tab | Move down and up through every choice and button, one by one (radio choices too, like checkboxes). With read-aloud on, the focused control is spoken in the chosen language: number, name, and "selected" or "not selected" |
| Arrow keys | Move between options in a radio group, as usual; change a date select |
| Space | Tick or untick a checkbox; choose a radio choice; press a button |
| Enter | On a choice: choose it. On a choice that is already chosen, or in an answer box: go to the next question. Ignored while an input method (Ge'ez, Keyman, phone keyboard) is composing |
| Escape | Stop all speech and listening at once |

A **keyboard help strip** at the top of every page says this in the chosen language (Tab: go down, Shift+Tab: go up, Space/Enter: choose, Esc: stop the voice), for keyboard-only, deaf and hard-of-hearing users who cannot hear the spoken instructions.

| Pattern | Markup |
|---|---|
| One question per screen | `<fieldset>` with `<legend id='h' tabindex='-1'>`. Focus moves to the question on every new screen |
| Choices | Native radio and checkbox inside `<label>`. Selected = tick icon + thicker border, never colour alone |
| Text answers | `aria-labelledby`, `aria-describedby='hint err'`, `aria-invalid='true'` on error, `lang`, `dir='auto'`, no autocorrect on names |
| Ethiopian date | Three labelled `<select>`s (day, month, year) in a `role='group'` named by the question; "Not sure" allowed |
| Errors | `role='alert'` box with icon and text. Focus moves to the field (or to the consent box) |
| Status | `role='status'` for Sending, Listening, Saved on this device, Reading stopped |
| Language buttons | `role='group'`, `aria-pressed`, `lang` on each button |
| Colours and text size menu | `<details>` with a `<fieldset>` of theme radios and a **Larger text** checkbox. Both are saved on the device; the host can follow the colours (`db-theme`) |
| Keyboard help | `<ul aria-label='Keyboard'>` with `<kbd>` keys, in the chosen language |
| Captions | Visible caption box of everything spoken, and a large Listening banner. `aria-hidden`, because screen-reader users already hear it |
| Host pages | Skip link, `nav` with `aria-label`, `aria-current` on the current page and language |

There are no time limits anywhere. The same information is in [`openapi.yaml`](openapi.yaml) (`info.description` and `x-accessibility`).

## Languages, voice and audio
- The first page asks in English for English only; then each language invites its own speakers in its own voice and by its own name ("ለአማርኛ «አማርኛ» ይበሉ"). People can answer with the English name or their own ("አማርኛ", "Afaan Oromoo", "ትግርኛ", "Soomaali", "Sidaamu Afoo"): people answer as soon as they hear their own language, so after the English question and after each language's invitation there is a beep and a 4-second listening window, with a recogniser that suits that language (Amharic and Tigrinya: Amharic recognition, which writes the Ge'ez names; Somali: Somali; others: English). The recogniser's five best guesses are checked, common mis-hearings and near misses count, and if nothing is understood it asks again in English and Amharic and listens with an Amharic recogniser. All non-English text is a **draft** until a native speaker checks it: the Amharic, and every line marked `VERIFY_NATIVE`.
- **Read aloud** plays clips from `public/audio/{en,am,om,ti,so,sid}/` (Meta MMS-TTS, made offline in Google Colab). It falls back to the device voice, and says so when there is none. English uses the device voice.
- **The review page is spoken in every language**, from short clips: heading, number, question, the chosen option (or "skipped"), a phone number digit by digit, the consent sentence and the question. Only words the person typed (a name) need a voice: the device voice for the language, or else an English voice, with Ge'ez spelled in Latin letters, so it is never silent. The same applies to the consent boxes, colour themes and job titles when they get keyboard focus.
- To regenerate clips: `npm run recording`, then follow "How to make the clips" in [RECORDING_SCRIPT.md](RECORDING_SCRIPT.md). Every clip the form uses exists for every language (a browser test checks the review page's clips).
- **Voice input:** after a page is read, the form says "Speak now", beeps, then listens. Answers can be numbers or names, with commands (Next, Back, Skip, Read aloud, Stop) in all six languages. The phone or email question can be spoken too: "zero nine one one…" (in any of the six languages, "double four" works) becomes `0911…`, "abebe at gmail dot com" becomes `abebe@gmail.com`, and it is read back digit by digit before Next. On the review page, saying Yes sends; if support needs were chosen, it then asks separately whether to share them (a second Yes).
- **Different keyboards:** Ge'ez input methods do not submit early; full-width and Arabic-Indic digits are accepted; switching keyboard layout does not stop the voice.

## Built for Ethiopia
- Amharic and Tigrinya in Ge'ez script, with local Noto Sans Ethiopic (SIL OFL) and `lang` set on every part.
- **Ethiopian calendar:** 13 months including Pagumē (5 or 6 days). Employers enter the closing date in the Ethiopian calendar, with "Not sure" for an approximate date; it is converted for JobPosting. The thank-you page shows today's date in both calendars.
- Ethiopian phone numbers (`09…`, `07…` or `251…`). Four identity routes, including "I don't have an ID. Refer me through a partner". No document numbers are collected.
- **Cheap phones and 3G:** one 155 kB script, no framework, mp3 clips at 48 kbps that load only when played, and fonts loaded only for the scripts on screen.
- **Offline:** answers are saved on the device as the person goes, kept for 7 days, and offered again after a reload. A submission made offline is queued and sent when the connection returns. With the partner's one-line service worker (`sw` attribute), the page, widget, fonts, job list and played clips open offline too.

## Privacy
- **Nothing leaves the host without consent.** The review page has a required "I agree to send these answers to {partner}" box. Without it nothing is sent; the server also refuses any submission without `consent.given`.
- **Support needs are optional and separate.** No proof is asked for. They are sent only if the person ticks a second box, stored apart from the answers, and never returned by any route. Employers never see them.
- **Job seekers' needs never leave the device.** Jobs are filtered in the browser.
- **Data minimisation:** the server keeps only the fields each form needs and drops anything else.
- **Withdrawal:** each submission returns a receipt code; `DELETE /v1/records/{id}` with it erases the answers and support needs. The consent log (`/v1/consents`, optional `ADMIN_TOKEN`) records only what was agreed, when, in which language and for which partner.
- This is designed to follow the consent, minimisation and erasure principles of Ethiopia's Personal Data Protection Proclamation (No. 1321/2024). This is our reading, not legal advice: please check it.
- **Voice:** recognition is done by the browser's speech service (Chrome and Edge send audio to their provider). This is explained before any listening starts, and typing always works. `asr='off'` turns voice input off.
- **Drafts** stay in the browser's local storage on the person's own device. "Start again" deletes them.
- **Demo limits:** storage is in memory and the API has no login. Add a database and authentication before production.

## Build vs reuse
| Part | Decision | Licence | Why |
|---|---|---|---|
| Form engine, Web Components, calendar, consent, drafts | Built | MIT (ours) | One small file that works as a script tag on any site and on cheap phones; no framework to download |
| Server | Reuse: Express, cors | MIT | Small, well known, no paid services |
| LTI 1.3 token checks | Reuse: `jose` | MIT | Correct JWT and JWK handling; no native code |
| Speech recognition and device voice | Reuse: browser Web Speech API, behind our own router (`asr`) | Built into browsers | No paid API; a self-hosted recogniser can be plugged in |
| Read-aloud clips (am, om, ti, so) | Reuse: Meta MMS-TTS models, run once in Colab | **CC-BY-NC 4.0 (non-commercial)** | The only free voices for these languages. Commercial use needs human recordings or another voice; file names stay the same |
| Romanisation for MMS (am, ti) | Reuse: uroman | MIT-style | The Amharic and Tigrinya models expect Latin letters |
| Fonts | Reuse: Atkinson Hyperlegible, Noto Sans Ethiopic, Source Serif 4 (via fontsource), served locally | SIL OFL 1.1 | Legibility and Ge'ez support with no external font service |
| Tests | Reuse: Playwright, axe-core | Apache-2.0, MPL-2.0 | Standard browser and accessibility checks |
| Demo host | Reuse: nginx image | BSD-2-Clause | Shows a real cross-site install |
| SMS | Built: simulated inbox | MIT (ours) | Shows the SMS path without a paid gateway |

Running costs: one small Node container and static files. No paid API is needed.

## Project layout
```
public/db-form.js      the plug-in (also served as /widget.js)
public/db-sw.js        offline service worker (imported by the partner's one-line file)
public/audio/          read-aloud clips per language
public/fonts/          local fonts (OFL)
server.js              REST API, JobPosting, LTI 1.3, demo LMS, SMS inbox
openapi.yaml           API specification
demo-host/             pretend partner site, Savanna-style page, design system
tests/                 core, voice and API tests (node --test), a11y.spec.js (Playwright + axe)
tools/                 recording script and Colab generator, contrast check, demo server
docs/                  WCAG 2.2 AA report, manual test script
```

## Known limitations
- Not yet tested with NVDA, TalkBack or the co-designer: see section 1.2 of the WCAG report.
- Translations are drafts until native speakers check them.
- Browser speech recognition often has no Afaan Oromoo or Tigrinya, so people type instead.
- LTI is launch only. Not tested inside the real Savanna.
- Storage is in memory and there is no authentication (demo).
