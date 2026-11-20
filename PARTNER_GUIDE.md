# Partner guide: add the accessible form to your website

This guide is for the person who looks after a partner organisation's website. You do **not** need to be a programmer. If you can paste text into your website's HTML, you can install the form.

What your visitors get:
- One question at a time, in **English, አማርኛ, Afaan Oromoo, ትግርኛ, Soomaali or Sidaamu Afoo**. The first page asks for the language, in English.
- They can **type or speak** their answers, and have every page **read aloud**.
- **Captions** of everything spoken, a clear **Listening** sign, and a **Colours** menu (dark, high contrast, and two colour-blind-safe themes).
- Full **keyboard** use: Tab and Shift+Tab read each choice aloud in the chosen language.
- **Nothing is sent without their agreement**, answers are **kept on their phone** if they stop or lose the connection, and dates use the **Ethiopian calendar**.

Contents:
1. [The 2-minute install](#1-the-2-minute-install)
2. [Where the files come from (hosting)](#2-where-the-files-come-from-hosting)
3. [Choose the form and the options (attributes)](#3-choose-the-form-and-the-options-attributes)
4. [Step-by-step for your kind of website](#4-step-by-step-for-your-kind-of-website)
5. [Read-aloud audio](#5-read-aloud-audio)
6. [Match your brand (colours and font)](#6-match-your-brand-colours-and-font)
7. [Know when someone finished (events)](#7-know-when-someone-finished-events)
8. [Security settings (CSP, HTTPS, CORS)](#8-security-settings-csp-https-cors)
9. [Test it before you go live](#9-test-it-before-you-go-live)
10. [Troubleshooting](#10-troubleshooting)
11. [Before production](#11-before-production)
12. [Offline use (service worker)](#12-offline-use-service-worker)
13. [Learning platforms: LTI 1.3 and Savanna](#13-learning-platforms-lti-13-and-savanna)
14. [Job boards: schema.org/JobPosting](#14-job-boards-schemaorgjobposting)
15. [Consent and privacy for partners](#15-consent-and-privacy-for-partners)

---

## 1. The 2-minute install

Paste these **two lines** where the form should appear on your page. Replace `YOUR-HOST` with the address you got from the team (see section 2).

```html
<script src='https://YOUR-HOST/widget.js'></script>
<db-onboarding api='https://YOUR-HOST/v1' audio='https://YOUR-HOST/audio' partner='Your organisation name'></db-onboarding>
```

That is all. Save, open the page, and you should see **"Which language would you like to use?"**.

- The `<script>` line loads the form. Put it once per page, anywhere (end of the page is best).
- The second line is the form itself. It appears exactly where you put it. Choose the tag:
  - `<db-onboarding>`: sign-up for your programme.
  - `<db-career-gateway>`: job search (filtered privately on the visitor's phone) and application.
  - `<db-form flow='employer'>`: employers post a job and the adjustments they offer. `<db-form>` takes any `flow`.
- `widget.js` and `db-form.js` are the same file; older pages with `db-form.js` keep working.
- The form keeps its own look inside your page: your website's CSS cannot break it, and it cannot change your website.

## 2. Where the files come from (hosting)

The form needs three things from a server: the script `widget.js`, the API (`/v1/...`) that receives answers, and the audio folder (`/audio/...`). One small server provides all three.

**Option A: use the team's server (easiest).** Ask the team for the address, for example `https://forms.example.org`. Use it as `YOUR-HOST`.

**Option B: run it yourself.**
1. Install Docker, then in the project folder run:
   ```
   docker compose up --build
   ```
2. The server now runs at `http://localhost:3000`:
   - script: `http://localhost:3000/widget.js`
   - API: `http://localhost:3000/v1` (check `http://localhost:3000/v1/health` says `{"ok":true}`)
   - audio: `http://localhost:3000/audio/...`
3. On a real server, put it behind **HTTPS** (for example with Caddy or nginx and a free certificate). The microphone only works on HTTPS pages (and on `localhost` for testing).

Without Docker: install Node.js 20 or newer, then `npm install` and `node server.js`.

## 3. Choose the form and the options (attributes)

Attributes go inside the `<db-form ...>` tag. Only `flow` and `api` are usually needed.

| Attribute | Values | Default | What it does |
|---|---|---|---|
| `flow` | `signup`, `job`, `employer` | `signup` | Which form: register for the programme, apply for a job, or post a job. |
| `api` | URL ending in `/v1` | none | Where answers are sent. Without it, nothing is sent (useful for testing). |
| `audio` | URL of the audio folder | none | Recorded read-aloud clips. Without it, the device's own voice reads, if it has one for the language. |
| `lang` | `en`, `am`, `om`, `ti`, `so`, `sid` | `en` | Starting language. The visitor can change it at any time. |
| `lang-ask` | `no` | (asks) | Skip the first page that asks for the language. Use this only if your page already lets the visitor choose. |
| `theme` | `auto`, `standard`, `dark`, `contrast`, `rg`, `by` | `auto` | Starting colours. `auto` follows the device. The visitor's own choice in the **Colours** menu always wins. |
| `hide` | comma list of question ids | none | Leave out optional questions, for example `hide='idRoute,support'`. `fullName`, `role` and `job` can never be hidden. |
| `partner` | your organisation's name | "the organisers of this website" | Shown in the consent question: "I agree to send these answers to …". |
| `continue` | an address, for example `courses.html` | none | Where to go after the thank-you page. It shows a **Next** button there and, when the page reads aloud, says "Say Next to continue" and listens. It fires the cancelable `db-continue` event first. Use this instead of a timer, so the person can hear and keep their receipt code. |
| `sw` | path to your one-line service worker | none | Offline use, see section 12. |
| `asr` | `browser`, `off`, or a registered name | `browser` | Speech recogniser. `off` hides voice input. See section 15. |
| `fonts` | `no` | (loads) | Do not load the local Atkinson Hyperlegible and Noto Sans Ethiopic fonts. |
| `jsonld` | `no` | (adds) | Do not add schema.org/JobPosting to your page in the job flow. |

You can change `lang` and `theme` later with `element.setAttribute(...)`, for example from your own language menu: the form switches without losing answers.

Question ids you can hide: signup flow `prefs`, `contact`, `idRoute`, `support`; job flow `needs`, `why`; employer flow `offers`, `closes`.

Examples:

```html
<!-- Job applications, Amharic first, no language page because our site already chose Amharic -->
<db-form flow='job' lang='am' lang-ask='no' api='https://YOUR-HOST/v1' audio='https://YOUR-HOST/audio'></db-form>

<!-- Employer form, high contrast to start with -->
<db-form flow='employer' theme='contrast' api='https://YOUR-HOST/v1'></db-form>
```

Use one `<db-form>` per page.

## 4. Step-by-step for your kind of website

### Plain HTML website
1. Open the page file (for example `join.html`) in a text editor.
2. Paste the `<db-form ...>` line where the form should be.
3. Paste the `<script ...>` line just before `</body>`.
4. Upload the file and open the page.

### WordPress
1. Edit the page. Add a block, choose **Custom HTML**.
2. Paste **both** lines into that block.
3. Click **Preview**, then **Update**.
4. If the form does not appear, your site may strip `<script>` tags: ask your administrator, or use a plugin that allows scripts in pages (for example "Insert Headers and Footers" for the script line).

### React, Vue, Svelte or other frameworks
`<db-form>` is a standard Web Component, so it works in any framework.
1. Load the script once, for example in `index.html`: `<script src='https://YOUR-HOST/widget.js'></script>`.
2. Use the tag like any HTML element. Pass values as plain strings:
   ```jsx
   <db-onboarding api="https://YOUR-HOST/v1" audio="https://YOUR-HOST/audio" partner="Your organisation"></db-onboarding>
   ```
3. To react to events, add listeners on the element (see section 7). In React, use a `ref` and `addEventListener` in `useEffect`.
4. Set the attributes **before** the element is added to the page. Changing them later does not restart the form; to switch flows, render a new `<db-form>` (for example with a different `key` in React).

### Website builders that do not allow scripts
Some hosted builders (for example Google Sites) do not run custom scripts in pages. Put the form on a simple page on your own server, or ask the team for a ready-made page, and link to it.

## 5. Read-aloud audio

Most phones have **no voice** for Amharic, Afaan Oromoo, Tigrinya or Somali. So the form plays **recorded clips** for those languages, and uses the device voice only when a clip is missing.

- The clips live in folders on the server: `audio/en/`, `audio/am/`, `audio/om/`, `audio/ti/`, `audio/so/`. File name = clip id + `.mp3`, for example `audio/am/fullName.mp3`.
- **Making the clips** (free, about 20 minutes): follow "How to make the clips" in [`RECORDING_SCRIPT.md`](RECORDING_SCRIPT.md). In short: run `npm run recording`, paste `tools/colab_generate_audio.py` into Google Colab, press Run, unzip `audio.zip` into `public/audio/`.
- **Licence:** the voice models (Meta MMS-TTS) are licensed **CC-BY-NC 4.0, non-commercial**. Clips made with them are fine for non-profit programmes. A commercial service needs human recordings or another voice; the file names stay the same.
- **A native speaker must listen to every clip** before you go live. The Afaan Oromoo, Tigrinya, Somali and Sidaamu Afoo text is a draft (marked `VERIFY_NATIVE` in the code). The Amharic text has been checked by a native speaker.
- If you change any wording in the form, run `npm run recording` again and remake the changed clips.
- If you host the audio somewhere else (for example a CDN), point the `audio` attribute there. Audio files do not need any special CORS headers.

## 6. Match your brand (colours and font)

The form uses a calm, high-contrast design that works for low vision and colour blindness. You can change two things from your own CSS:

```css
db-form {
  --db-accent: #7a2e0e;  /* your brand colour: used for the main button, selected choices and focus ring */
  --db-font: 'Your Font', 'Noto Sans Ethiopic', system-ui, sans-serif;
}
```

- `--db-accent` changes the **Standard** theme only. Dark, high contrast and the colour-blind themes keep their own tested colours, so visitors who need them are never affected.
- Your accent must have a **contrast of at least 4.5:1 with white** (white text sits on it). Check it at https://webaim.org/resources/contrastchecker/.
- Keep `'Noto Sans Ethiopic'` (or another Ge'ez font) in `--db-font`, otherwise Amharic and Tigrinya may not display.
- Recommended font: **Atkinson Hyperlegible** (very easy to read). The form uses it automatically when your page loads it:
  ```html
  <link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Noto+Sans+Ethiopic:wght@400;700&display=swap'>
  ```

**Make your own page follow the visitor's colour choice (optional).** The demo site does this so its header and footer match the form. Copy `demo-host/site.js` to your site and load it in `<head>`. It reads the form's colour tokens and the visitor's choice. Your CSS then uses `var(--bg)`, `var(--surface)`, `var(--ink)`, `var(--accent)` and so on. See `demo-host/site.css` for a complete example, and `demo-host/design-system.html` for every token and component.

## 7. Know when someone finished (events)

The form tells your page what happened. Listen on the element:

```html
<script>
  const form = document.querySelector('db-form');
  form.addEventListener('db-complete', e => {
    // The answers were saved. e.detail.answers holds exactly what was sent to the API;
    // e.detail.id and e.detail.receipt identify the record (the visitor also sees the receipt).
    // It can include the visitor's support needs: do not log it, send it to analytics or store it on your side.
    console.log('Done', e.detail.answers);
  });
  form.addEventListener('db-error', () => {
    // Sending failed. The form already shows "We could not send your answers. Nothing is lost. Please try again."
  });
  form.addEventListener('db-queued', () => {
    // The visitor is offline: the answers are kept on their device and will be sent automatically.
  });
  form.addEventListener('db-sent', e => {
    // Answers saved while offline were sent. e.detail.ok is true if the server accepted them.
  });
  // The organisers' data contract (Technical Guide): the same moments under their names.
  // db-signup:step { step, of, id } · db-signup:done { profile, id, receipt } · db-signup:support { support }
  // (support is a separate event, sent only when the learner agreed to share it). db-job:… and db-employer:… likewise.
  document.addEventListener('db-signup:done', e => { /* go to the learner's home page */ });
  form.addEventListener('db-theme', e => {
    // The visitor chose new colours: e.detail.theme is auto | standard | dark | contrast | rg | by
  });
  // Text size (100%, 150% or 200%), also sent once when the form loads. Make your WHOLE page follow it, so your
  // header, menu and footer grow too, and call preventDefault() so the form is not enlarged a second time.
  // This works when your page uses rem units; if you do not listen, the form enlarges only itself.
  document.addEventListener('db-textsize', e => {
    document.documentElement.style.fontSize = e.detail.scale > 1 ? e.detail.scale * 100 + '%' : '';
    e.preventDefault();
  });
</script>
```

What is sent to the API, per flow:
- `signup` → `POST /v1/learners`: `fullName`, `contact`, `idRoute`, and `support` **only if the visitor ticked the second consent box** (stored separately; no route returns it).
- `job` → `POST /v1/applications`: `role`, `why`. The visitor's work needs **stay on their device** and are only used to filter the job list.
- `employer` → `POST /v1/employer/jobs`: `job`, `offers`, `closes` (Gregorian date, converted from the Ethiopian date the employer chose).
- Every request also carries `consent`: `{ given: true, scope: ['answers'] or ['answers', 'support'], version, lang, partner, at }`.

The first question of the signup flow (`prefs`: larger text, pictures) is never sent. The full API is described in [`openapi.yaml`](openapi.yaml).

## 8. Security settings (CSP, HTTPS, CORS)

- **HTTPS:** your page must be on HTTPS for the microphone to work. Typing and read-aloud work without it.
- **Content Security Policy:** if your site sends a `Content-Security-Policy` header, allow the form's server:
  ```
  script-src 'self' https://YOUR-HOST;
  connect-src 'self' https://YOUR-HOST;
  media-src  'self' https://YOUR-HOST;
  font-src   'self' https://YOUR-HOST;
  worker-src 'self';
  ```
  The form also uses inline styles inside its own shadow DOM; with a very strict `style-src`, add `'unsafe-inline'` for styles.
- **CORS:** the server already allows requests from any website. To limit it to your own domain, the team can restrict the `cors()` setting in `server.js`.
- **Microphone permission:** if your page is inside an `<iframe>`, the iframe needs `allow='microphone'`.
- **Privacy:** voice recognition is done by the browser's speech service (Chrome and Edge send the audio to their provider). The form explains this on its first question, before it ever listens, and typing always works.

## 9. Test it before you go live

Do this once on a computer and once on a phone. It takes about 15 minutes.

**Basics**
- [ ] The page shows "Which language would you like to use?" (unless you used `lang-ask='no'`).
- [ ] Choosing a language changes every word in the form.
- [ ] Filling in the form ends with "Thank you. We received your answers." and your `db-complete` listener runs.
- [ ] `https://YOUR-HOST/v1/health` shows `{"ok":true}`.

**Keyboard only (unplug the mouse)**
- [ ] Tab and Shift+Tab reach every button and **every single choice** (radio choices too), with a clearly visible focus ring.
- [ ] The keyboard help strip at the top of the form (Tab, Shift+Tab, Space/Enter, Esc) is in the chosen language.
- [ ] With "read aloud" on, each choice is read as number, name and "selected" or "not selected", in the chosen language.
- [ ] Space or Enter chooses; Enter on a choice that is already chosen goes to the next question; Escape stops the voice.

**Sound and voice** (Chrome or Edge, on HTTPS)
- [ ] After a page is read, you hear "Speak now", then a beep, and the **Listening** banner appears.
- [ ] On the language page, a beep follows the English question and each language's invitation; saying a language name right after the beep works, also in its own words ("አማርኛ", "Afaan Oromoo", "ትግርኛ", "Soomaali", "Sidaamu Afoo"). If the first try is not understood, it asks again in English and Amharic.
- [ ] Saying a number ("two") or a word ("Next", "Back") works. A phone number can be spoken ("zero nine one one…") and is read back digit by digit.
- [ ] In Amharic, Afaan Oromoo, Tigrinya, Somali and Sidaamu Afoo you hear the recorded clips (not silence), **including the review page**.

**Seeing and colours**
- [ ] With the sound off, the caption box shows everything that is spoken.
- [ ] Each option in the **Colours and text size** menu changes the form (including **Larger text**), and the choice is remembered after reloading.
- [ ] At 200% browser zoom nothing is cut off; on a phone the form fits the screen.

**Consent, drafts and offline**
- [ ] Pressing **Yes, submit** without ticking the consent box shows an error and sends nothing.
- [ ] Reloading halfway shows "Welcome back" and **Continue where I stopped** brings the answers back.
- [ ] With the network off (phone in flight mode), sending says the answers are saved on the device; they arrive when it is back online.

**Screen readers**
- [ ] NVDA (Windows) or TalkBack (Android): every question, hint, choice and error is read.

Automated checks for developers: `npm test` (with the server running) and `npx playwright test tests/a11y.spec.js`.

## 10. Troubleshooting

| What you see | Why | What to do |
|---|---|---|
| After an update, the old text or old voice is still there | The browser or the offline service worker still has the old copy | Reload the page twice: the first reload installs the new release, the second shows it. The plugin server names the offline cache after the release, so old clips are then deleted. Testers can use a private (incognito) window, or DevTools, Application, **Clear site data**. If you serve `db-sw.js` from your own server, change `DB_CACHE` in it on every update. |
| Nothing appears where the form should be | The script did not load, or the page blocks scripts | Open `https://YOUR-HOST/widget.js` in the browser: you should see code. Check your CSP (section 8). In WordPress, check that `<script>` was not removed. |
| "We could not send your answers" | The API address is wrong or the server is down | Check the `api` attribute ends in `/v1`, and that `/v1/health` works. |
| No Speak button | This browser has no voice recognition (Firefox, some Safari versions) | Normal: visitors type instead. Chrome and Edge support voice. |
| "The microphone is blocked" | The visitor said No to the microphone, or the page is not HTTPS | Allow the microphone in the browser's address bar; use HTTPS. |
| "This browser cannot understand this language by voice" | The speech service has no recogniser for that language (common for Afaan Oromoo and Tigrinya) | Normal: visitors type. Read-aloud still works with clips. |
| Amharic or another language is silent | Clips are missing and the device has no voice for it | Make the clips (section 5) and check the `audio` attribute. The form shows a message explaining this. |
| Ge'ez letters show as boxes | No Ethiopic font on the device | Load Noto Sans Ethiopic on your page (section 6). |
| The job list is empty in the job flow | The API has no jobs yet | Add jobs with the employer flow. Until then visitors can type a job title. |
| Colours look different from your site | The visitor chose a theme in the Colours menu | That is intended: their choice wins. |
| The language page appears although your site already chose | | Add `lang-ask='no'`. |
| "Please tick the box to agree" | The visitor did not give consent | Intended: nothing is sent without it. |
| LTI launch says "Launch failed" | The platform's issuer, client id, keys URL or deployment id do not match | Check the `LTI_*` settings (section 13) and launch again from the course. |

## 11. Before production

The demo server is for trying things out. Before real people use it:
- **Storage:** answers are kept in memory and are lost when the server restarts. Connect a database.
- **Authentication:** the API has no login. Add authentication for any route that reads data.
- **Language review:** native speakers must check all text marked `VERIFY_NATIVE` and the Amharic, then remake the clips.
- **Accessibility report:** fill in section 1.2 of [`docs/WCAG-2.2-AA-Report.md`](docs/WCAG-2.2-AA-Report.md) after testing with real users, including Deaf and blind co-designers ([`docs/manual-test-script.md`](docs/manual-test-script.md)).
- **Settings:** set `PUBLIC_URL` (the address people use), `APP_SECRET` (keeps receipts valid across restarts), `ADMIN_TOKEN` (protects the consent log) and `ALLOWED_ORIGINS` (your sites only).
- **Licences:** check the licences listed in the README.

## 12. Offline use (service worker)

Without anything extra, answers are saved on the visitor's device as they go, and a form sent while offline is queued and sent automatically later. To make the **page itself** open without a connection (the widget, fonts, job list and any clip already heard), add one small file to **your own** website. Browsers only allow a service worker from your own address.

1. Create `db-sw.js` in the top folder of your site:
   ```js
   self.DB_FORM_HOST = 'https://YOUR-HOST';
   importScripts('https://YOUR-HOST/db-sw.js');
   ```
2. Add `sw='/db-sw.js'` to the tag.
3. Test: open the page once, turn the network off, and reload.

The service worker never sees or stores answers: it does not touch `POST` requests.

## 13. Learning platforms: LTI 1.3 and Savanna

Any LTI 1.3 platform (Moodle, Canvas, Open edX, and others) can add the form as an external tool. In the platform's tool settings, enter:

| Setting | Value |
|---|---|
| Tool URL / target link URI / redirect URI | `https://YOUR-HOST/lti/launch` |
| OpenID Connect login (initiate login) URL | `https://YOUR-HOST/lti/login` |
| Public keyset URL | `https://YOUR-HOST/lti/jwks.json` |
| Custom parameter | `flow=signup` (or `job`, `employer`) |

The full configuration is at `https://YOUR-HOST/lti/config.json`. Then give the server the platform's details (they are on the platform's tool settings page):

```
LTI_ISSUER=https://your-lms.example
LTI_CLIENT_ID=the client id the platform gave you
LTI_AUTH_URL=https://your-lms.example/mod/lti/auth.php
LTI_JWKS_URL=https://your-lms.example/mod/lti/certs.php
LTI_DEPLOYMENT_ID=1
```

The form opens in the course language when it is one of the five, and skips the language page. It uses only the course language and the `flow` parameter: the learner's name and email from the platform are not used. This is a launch only: there is no grade passback or deep linking. Try it first with the built-in demo platform at `https://YOUR-HOST/demo/lms`.

**ALX Savanna.** Savanna can use either way: paste the two lines from section 1 into a course page (see `demo-host/savanna.html`), or register the LTI tool as above. We have not yet tested inside the real Savanna.

## 14. Job boards: schema.org/JobPosting

Jobs posted with the employer form are published as schema.org/JobPosting, so search engines and other job boards can read them:

- `https://YOUR-HOST/v1/jobs?format=jsonld`: every job.
- `https://YOUR-HOST/v1/jobs/{id}?format=jsonld`: one job.
- In the job flow, the widget also adds the same JSON-LD to your page (turn off with `jsonld='no'`).

Each posting includes the title, employer, location (Addis Ababa, ET), date posted, closing date, the adjustments offered (`jobBenefits`) and `TELECOMMUTE` when work from home is offered. It never includes anything about job seekers. Check it with https://validator.schema.org.

## 15. Consent and privacy for partners

- The visitor must tick **"I agree to send these answers to {partner}"** before anything is sent. Support choices need a **second** tick. If they do not tick it, support choices are not sent at all.
- After sending, the visitor sees a **receipt code**. With it, the record can be deleted: `DELETE https://YOUR-HOST/v1/records/{id}` with the header `X-Receipt: <code>`. Answers and support needs are erased, and the consent log keeps only the time of withdrawal.
- **Consent log for audits:** `GET https://YOUR-HOST/v1/consents` (send `Authorization: Bearer <ADMIN_TOKEN>` when it is set). Each entry has the record id, form, scope, consent text version, language, partner and time, but no names, contacts or answers.
- **Do not copy support needs** into your own systems, analytics or logs. If you listen to `db-complete`, `e.detail.answers` can contain them.
- **Speech recogniser:** `asr='off'` removes voice input. A developer can plug in a self-hosted recogniser so no audio goes to a browser provider:
  ```js
  // A factory returns an object like SpeechRecognition: start(), abort(), onresult, onerror, onend.
  customElements.get('db-form').registerASR('local', (lang, element) => new MyRecogniser({ lang }));
  ```
  Then use `asr='local'` on the tag.

## 16. Make the rest of your page accessible too (ALX and other hosts)

The plug-in is accessible on its own, but a person meets your whole page first. These checks take an hour and fix most of
what stopped people on the 21 October test day. They apply to any ALX page (Savanna course pages, programme sign-up
pages, job boards).

- **Language:** set `<html lang='am'>` (or `en`, `om` …) to the page's language, and `lang` on any part in another language.
  Screen readers choose their voice from it.
- **A skip link** as the first thing on the page: `<a href='#main'>Skip to the form</a>`, and `id='main'` on the element that holds the plug-in.
- **Headings in order** (one `h1`, then `h2` …) and landmarks (`header`, `nav` with `aria-label`, `main`, `footer`), so
  screen-reader users can jump around.
- **Keyboard:** every link and button reachable with Tab, in reading order, with a visible focus ring. Never remove the outline without a replacement.
- **No time limits and no automatic log-out** on pages with forms. If a session must end, warn first and let the person extend it.
- **Video and audio:** captions for every video (also in Amharic), a transcript for audio. Never autoplay sound.
- **Images:** a short `alt` text for each image that carries meaning; `alt=''` for decoration.
- **Contrast** at least 4.5:1 for text (3:1 for large text and icons). The plug-in's themes pass; check your header and footer too.
- **Zoom to 200% and 400%:** no sideways scrolling, nothing cut off. Use relative units (`rem`, `%`), not fixed heights.
- **Help in more than English:** link to help and contact details in the languages your learners use, by phone as well as email.
- **Follow the person's colour choice:** listen to the `db-theme` event (section 7) so your header and footer match the colours they picked.
- **Follow the person's text size:** listen to the `db-textsize` event (section 7) so the whole page, navigation included, grows to 150% or 200% with the form. Size text in `rem`, let menus wrap instead of scrolling sideways, and let long words break (`overflow-wrap:anywhere`), so nothing is cut off on a phone.
- **Test** with the checklist in section 9, with axe DevTools (free browser extension), and with one real user of a screen reader.
