# Inclusive Access: accessible onboarding plugin (Track 1)

Team: names. Co-designer: name. Licence: add when ALX names it.

A drop-in plugin: one script tag and one element add accessible sign-up, job application and an employer form to any website. It is not a standalone site. `demo-host/` is only a pretend partner website.

## Install in 5 minutes
1. `git clone REPO_URL` and `cd` into it
2. `docker compose up --build`
3. Open http://localhost:8080 (the partner demo site). The plugin and API run on http://localhost:3000.

Without Docker: `npm install`, `node server.js`, and serve `demo-host/` on any static server.

The design system proof page is at http://localhost:8080/design-system.html.

## Add it to any site (Level 1)
```html
<script src='https://YOUR-HOST/db-form.js'></script>
<db-form flow='signup' api='https://YOUR-HOST/v1' audio='https://YOUR-HOST/audio'></db-form>
```
**Partners: follow [PARTNER_GUIDE.md](PARTNER_GUIDE.md)** for step-by-step installation (plain HTML, WordPress, React and other frameworks), hosting, audio, branding, events, security settings, a test checklist and troubleshooting.

Attributes: `flow` (signup, job, employer), `api` (base URL), `audio` (optional, read-aloud clips), `lang` (en, am, om, ti, so), `lang-ask='no'` (skip the language page), `theme` (auto, standard, dark, contrast, rg, by), `hide` (optional questions to leave out, for example `hide='idRoute,support'`; `fullName`, `role` and `job` cannot be hidden). Events: `db-complete`, `db-error`, `db-theme`. CSS hooks: `--db-accent`, `--db-font`.

A site that does not need to check identity can hide the identity question. It is there because the brief says nobody may be blocked for lacking a kebele ID or passport. The answer is only stored as a chosen route. Nothing is verified.

## REST API (Level 2)
See `openapi.yaml`. Routes: GET /v1/health, GET /v1/jobs, POST /v1/learners, POST /v1/applications, POST /v1/employer/jobs.

## Languages and audio
English, አማርኛ (am), Afaan Oromoo (om), ትግርኛ (ti) and Soomaali (so). The first page asks for the language in English, then each language invites its own speakers. All non-English text is a **draft**: native speakers must check the Amharic and every line marked `VERIFY_NATIVE`.

Read-aloud plays clips from `public/audio/{en|am|om|ti|so}/{clipId}.mp3` when present, otherwise the device's own voice, and says so when the device has no voice for the language. Most devices have no voice for am, om, ti or so, so those clips are generated with Meta MMS-TTS in Google Colab: run `npm run recording` (updates `RECORDING_SCRIPT.md` and `tools/colab_generate_audio.py` from the text in the code), then follow "How to make the clips" in [RECORDING_SCRIPT.md](RECORDING_SCRIPT.md).

## Accessibility features
- **Keyboard:** Tab and Shift+Tab (and arrows, Space) read the focused choice or button aloud in the chosen language: number, name and "selected" or "not selected". Escape stops the voice.
- **Voice:** after a page is read, the form says "Speak now", beeps, then opens the microphone. Answers can be said by number or name, with commands (Next, Back, Skip, Read aloud, Stop) in all five languages.
- **Deaf and hard of hearing:** everything spoken is also shown as a caption; listening is a large visible banner; the beep also flashes.
- **Colour:** a Colours menu with Standard, Dark, High contrast and two colour-blind-safe themes (blue/orange for red-green, teal/red for blue-yellow). The choice is saved on the device. Selected and error states never rely on colour alone. All token pairs meet WCAG 2.2 contrast in every theme.
- **Different keyboards:** typing with an input method (Ge'ez, Keyman, phone keyboards) does not submit early; full-width and Arabic-Indic digits are accepted; switching keyboard layout does not stop the voice.

## Privacy
- Support needs are optional, never required, and stored in a separate store that no route returns.
- Job needs stay on the device: jobs are filtered in the browser and the needs are never sent.
- No document numbers are collected.
- Voice input uses the browser's speech service (Chrome sends audio to its provider). The very first screen explains this before any listening starts, and typing always works. The phone-or-email question is typed only, because spelling addresses by voice is unreliable.
- Storage is in memory only. The demo has no authentication: add real authentication before production.

## Build vs reuse
| Part | Decision | Licence | Why |
|---|---|---|---|
| Form engine and component | Built from scratch | ours | Small (one file), works as a script tag, no framework on cheap phones |
| Server | Express, cors | MIT (verify) | Tiny, no paid services |
| Speech | Browser Web Speech API | built in | No paid API; limits noted above |
| Read-aloud clips (am, om, ti, so) | Meta MMS-TTS models, generated offline in Colab | **CC-BY-NC 4.0 (non-commercial)** | Only free voices for these languages. Commercial use of the generated clips needs a different voice or human recordings |
| Romanisation for MMS (am, ti) | uroman | MIT-style (verify) | The Amharic and Tigrinya models expect Latin letters |
| Fonts (demo site) | Atkinson Hyperlegible, Noto Sans Ethiopic, Source Serif 4 | SIL OFL 1.1 | Legibility; Ge'ez support. Loaded from Google Fonts on the demo pages only |
| Testing | axe-core, Playwright | MPL-2.0, Apache-2.0 (verify) | Standard accessibility checks |
| Demo host | nginx image | BSD-2 (verify) | Shows a real cross-site install |

## Tests
- `npm run test:voice`: voice, keyboard-focus, language and input logic (no server or browser needed).
- `npm test`: the voice tests plus the API tests. Start the server first (`node server.js` or `docker compose up --build`).
- `npx playwright test tests/a11y.spec.js`: axe accessibility checks. First run `npm i -D @playwright/test @axe-core/playwright` and `npx playwright install chromium`.

## Known limitations
Speech recognition depends on the browser (Chrome and Edge; often no recogniser for Afaan Oromoo or Tigrinya, so people type). Read-aloud for am, om, ti and so needs the generated clips. Translations are drafts until checked by native speakers. No real SMS, partner registration or save-and-resume yet. Storage is in memory.