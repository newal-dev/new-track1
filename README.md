# Inclusive Access: accessible onboarding plugin (Track 1)

Team: names. Co-designer: name. Licence: add when ALX names it.

A drop-in plugin: one script tag and one element add accessible sign-up, job application and an employer form to any website. It is not a standalone site. `demo-host/` is only a pretend partner website.

## Install in 5 minutes
1. `git clone REPO_URL` and `cd` into it
2. `docker compose up --build`
3. Open http://localhost:8080 (the partner demo site). The plugin and API run on http://localhost:3000.

Without Docker: `npm install`, `node server.js`, and serve `demo-host/` on any static server.

## Add it to any site (Level 1)
```html
<script src='https://YOUR-HOST/db-form.js'></script>
<db-form flow='signup' lang='en' api='https://YOUR-HOST/v1' audio='https://YOUR-HOST/audio'></db-form>
```
Attributes: `flow` (signup, job, employer), `lang` (en, am), `api` (base URL), `audio` (optional, recorded audio files), `hide` (optional, questions to leave out, for example `hide='idRoute,support'`; `fullName`, `role` and `job` cannot be hidden). Events: `db-complete`, `db-error`.

A site that does not need to check identity can hide the identity question. It is there because the brief says nobody may be blocked for lacking a kebele ID or passport. The answer is only stored as a chosen route. Nothing is verified.

## REST API (Level 2)
See `openapi.yaml`. Routes: GET /v1/health, GET /v1/jobs, POST /v1/learners, POST /v1/applications, POST /v1/employer/jobs.

## Languages and audio
English and Amharic with a switch in the form. Amharic text is a draft until checked by a native speaker. Read-aloud uses recorded files at `public/audio/{en|am}/{questionId}.mp3` when present, otherwise the device's built-in voice, and it says so when the device has no voice for the language.

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
| Testing | axe-core, Playwright | MPL-2.0, Apache-2.0 (verify) | Standard accessibility checks |
| Demo host | nginx image | BSD-2 (verify) | Shows a real cross-site install |

## Tests
Start with `docker compose up --build`, then `npm test` (API) and `npx playwright test tests/a11y.spec.js` (accessibility). First run `npm i -D @playwright/test @axe-core/playwright` and `npx playwright install chromium`.

## Known limitations
Amharic voice and speech recognition depend on the device. No real SMS, partner registration or save-and-resume yet. Storage is in memory.