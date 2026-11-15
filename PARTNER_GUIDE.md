# Partner guide: add the accessible form to your website

This guide is for the person who looks after a partner organisation's website. You do **not** need to be a programmer. If you can paste text into your website's HTML, you can install the form.

What your visitors get:
- One question at a time, in **English, አማርኛ, Afaan Oromoo, ትግርኛ or Soomaali**. The first page asks for the language, in English.
- They can **type or speak** their answers, and have every page **read aloud**.
- **Captions** of everything spoken, a clear **Listening** sign, and a **Colours** menu (dark, high contrast, and two colour-blind-safe themes).
- Full **keyboard** use: Tab and Shift+Tab read each choice aloud in the chosen language.

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

---

## 1. The 2-minute install

Paste these **two lines** where the form should appear on your page. Replace `YOUR-HOST` with the address you got from the team (see section 2).

```html
<script src='https://YOUR-HOST/db-form.js'></script>
<db-form flow='signup' api='https://YOUR-HOST/v1' audio='https://YOUR-HOST/audio'></db-form>
```

That is all. Save, open the page, and you should see **"Which language would you like to use?"**.

- The `<script>` line loads the form. Put it once per page, anywhere (end of the page is best).
- The `<db-form>` line is the form itself. It appears exactly where you put it.
- The form keeps its own look inside your page: your website's CSS cannot break it, and it cannot change your website.

## 2. Where the files come from (hosting)

The form needs three things from a server: the script `db-form.js`, the API (`/v1/...`) that receives answers, and the audio folder (`/audio/...`). One small server provides all three.

**Option A: use the team's server (easiest).** Ask the team for the address, for example `https://forms.example.org`. Use it as `YOUR-HOST`.

**Option B: run it yourself.**
1. Install Docker, then in the project folder run:
   ```
   docker compose up --build
   ```
2. The server now runs at `http://localhost:3000`:
   - script: `http://localhost:3000/db-form.js`
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
| `lang` | `en`, `am`, `om`, `ti`, `so` | `en` | Starting language. The visitor can change it at any time. |
| `lang-ask` | `no` | (asks) | Skip the first page that asks for the language. Use this only if your page already lets the visitor choose. |
| `theme` | `auto`, `standard`, `dark`, `contrast`, `rg`, `by` | `auto` | Starting colours. `auto` follows the device. The visitor's own choice in the **Colours** menu always wins. |
| `hide` | comma list of question ids | none | Leave out optional questions, for example `hide='idRoute,support'`. `fullName`, `role` and `job` can never be hidden. |

Question ids you can hide: signup flow `prefs`, `contact`, `idRoute`, `support`; job flow `needs`, `why`; employer flow `offers`.

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
1. Load the script once, for example in `index.html`: `<script src='https://YOUR-HOST/db-form.js'></script>`.
2. Use the tag like any HTML element. Pass values as plain strings:
   ```jsx
   <db-form flow="signup" api="https://YOUR-HOST/v1" audio="https://YOUR-HOST/audio"></db-form>
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
- **A native speaker must listen to every clip** before you go live. The Afaan Oromoo, Tigrinya and Somali text is a draft (marked `VERIFY_NATIVE` in the code), and the Amharic must also be checked.
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
    // The answers were saved. e.detail.answers holds exactly what was sent to the API.
    // It can include the visitor's support needs: do not log it, send it to analytics or store it on your side.
    console.log('Done', e.detail.answers);
  });
  form.addEventListener('db-error', () => {
    // Sending failed. The form already shows "We could not send your answers. Nothing is lost. Please try again."
  });
  form.addEventListener('db-theme', e => {
    // The visitor chose new colours: e.detail.theme is auto | standard | dark | contrast | rg | by
  });
</script>
```

What is sent to the API, per flow:
- `signup` → `POST /v1/learners`: `fullName`, `contact`, `idRoute`, `support` (support needs go to a separate private store that no route returns).
- `job` → `POST /v1/applications`: `role`, `why`. The visitor's work needs **stay on their device** and are only used to filter the job list.
- `employer` → `POST /v1/employer/jobs`: `job`, `offers`.

The first question of the signup flow (`prefs`: larger text, pictures) is never sent. The full API is described in [`openapi.yaml`](openapi.yaml).

## 8. Security settings (CSP, HTTPS, CORS)

- **HTTPS:** your page must be on HTTPS for the microphone to work. Typing and read-aloud work without it.
- **Content Security Policy:** if your site sends a `Content-Security-Policy` header, allow the form's server:
  ```
  script-src 'self' https://YOUR-HOST;
  connect-src 'self' https://YOUR-HOST;
  media-src  'self' https://YOUR-HOST;
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
- [ ] Tab and Shift+Tab reach every button and choice, with a clearly visible focus ring.
- [ ] With "read aloud" on, each choice is read as number, name and "selected" or "not selected", in the chosen language.
- [ ] Space ticks a box; Enter goes to the next question; Escape stops the voice.

**Sound and voice** (Chrome or Edge, on HTTPS)
- [ ] After a page is read, you hear "Speak now", then a beep, and the **Listening** banner appears.
- [ ] Saying a number ("two") or a word ("Next", "Back") works.
- [ ] In Amharic, Afaan Oromoo, Tigrinya and Somali you hear the recorded clips (not silence).

**Seeing and colours**
- [ ] With the sound off, the caption box shows everything that is spoken.
- [ ] Each option in the **Colours** menu changes the form, and the choice is remembered after reloading.
- [ ] At 200% browser zoom nothing is cut off; on a phone the form fits the screen.

**Screen readers**
- [ ] NVDA (Windows) or TalkBack (Android): every question, hint, choice and error is read.

Automated checks for developers: `npm test` (with the server running) and `npx playwright test tests/a11y.spec.js`.

## 10. Troubleshooting

| What you see | Why | What to do |
|---|---|---|
| Nothing appears where the form should be | The script did not load, or the page blocks scripts | Open `https://YOUR-HOST/db-form.js` in the browser: you should see code. Check your CSP (section 8). In WordPress, check that `<script>` was not removed. |
| "We could not send your answers" | The API address is wrong or the server is down | Check the `api` attribute ends in `/v1`, and that `/v1/health` works. |
| No Speak button | This browser has no voice recognition (Firefox, some Safari versions) | Normal: visitors type instead. Chrome and Edge support voice. |
| "The microphone is blocked" | The visitor said No to the microphone, or the page is not HTTPS | Allow the microphone in the browser's address bar; use HTTPS. |
| "This browser cannot understand this language by voice" | The speech service has no recogniser for that language (common for Afaan Oromoo and Tigrinya) | Normal: visitors type. Read-aloud still works with clips. |
| Amharic or another language is silent | Clips are missing and the device has no voice for it | Make the clips (section 5) and check the `audio` attribute. The form shows a message explaining this. |
| Ge'ez letters show as boxes | No Ethiopic font on the device | Load Noto Sans Ethiopic on your page (section 6). |
| The job list is empty in the job flow | The API has no jobs yet | Add jobs with the employer flow. Until then visitors can type a job title. |
| Colours look different from your site | The visitor chose a theme in the Colours menu | That is intended: their choice wins. |
| The language page appears although your site already chose | | Add `lang-ask='no'`. |

## 11. Before production

The demo server is for trying things out. Before real people use it:
- **Storage:** answers are kept in memory and are lost when the server restarts. Connect a database.
- **Authentication:** the API has no login. Add authentication for any route that reads data.
- **Language review:** native speakers must check all text marked `VERIFY_NATIVE` and the Amharic, then remake the clips.
- **Accessibility report:** fill in [`CONFORMANCE.md`](CONFORMANCE.md) after testing with real users, including Deaf and blind co-designers.
- **Licences:** check the licences listed in the README.
