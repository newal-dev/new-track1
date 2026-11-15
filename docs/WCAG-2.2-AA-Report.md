# WCAG 2.2 AA Conformance Report: Inclusive Access plug-in

| | |
|---|---|
| Product | Inclusive Access plug-in: `<db-onboarding>`, `<db-career-gateway>`, `<db-form>` (`public/db-form.js`, served as `/widget.js`), with the demo host pages and the LTI launch page |
| Version | Commit on branch `samuel`, 15 November 2026 |
| Standard | [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Level A and AA |
| Scope | All three flows (sign-up, job application, employer job post), every screen and state: language page, read-aloud question, welcome, draft offer, each question type (text, radio, checkbox, Ethiopian date), every error, review with consent, thank-you, offline-queued; all six colour themes; five languages. Hosts: `demo-host/index.html`, `demo-host/savanna.html`, `/lti/launch`, `/demo/lms`, `/demo/sms-inbox`, `demo-host/design-system.html` |
| Technologies relied upon | HTML, CSS, JavaScript, Custom Elements with open Shadow DOM |
| Used but not relied upon | Web Speech API (voice input, device voice), recorded audio clips, Service Worker, localStorage. Every task can be completed by keyboard, pointer or screen reader without them |
| Report date | 15 November 2026 |

Results: **Supports**, **Partially supports**, **Does not support**, **Not applicable**, **Not yet tested**.

## 1. How it was tested

### 1.1 Automated (repeatable: `npm run test:all`)
| Tool | Version | What | Result (15 Nov 2026) |
|---|---|---|---|
| axe-core via @axe-core/playwright | axe-core 4.14.0 | Tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`; 36 scans in 30 browser tests (`tests/a11y.spec.js`) | **0 violations of any impact** (0 critical, 0 serious, 0 moderate, 0 minor) |
| Playwright | 1.65.1, Chromium 153.0.8010.12 | Keyboard-only completion of the job flow; Tab through every radio choice and Enter to choose (Amharic); keyboard help in the chosen language; Larger text kept after reload; every clip the spoken review page plays exists in all six languages; focus after each step and after errors; 640 px (200%) and 320 px (400%) widths; captions with sound off; drafts; offline | 30 of 30 pass |
| `tools/contrast-check.mjs` (`npm run contrast`) | in repo | 15 colour pairs (text 4.5:1, non-text 3:1) in each of the 5 token sets | **75 of 75 pass**; see section 4 |
| Node test runner | Node 20+ | `tests/core.test.js`, `tests/voice.test.js`, `tests/api.test.js` | 102 of 102 pass |

The 34 axe scans: language page (3 flows); read-aloud question and welcome (Amharic); every sign-up question, review with consent and thank-you; error states for required answer, phone format, missing consent and date without month; employer Ethiopian date; six themes, each with an error showing; 200% and 400% zoom; caption box while reading aloud; draft offer; offline-queued page; Amharic question page; Savanna-style host; demo LMS; LTI launch page; SMS inbox; design system page. Raw results are attached to each run in `test-results/a11y-results.json` (attachment `axe-scans`).

### 1.2 Manual, with assistive technology and the co-designer
The pass/fail gate needs these results. Fill each row after the session using `docs/manual-test-script.md`, with the date, device and who tested. Until then they are **Not yet tested**.

| Setting | Device and version | Task | Result | Tester and date | Notes |
|---|---|---|---|---|---|
| NVDA + Chrome (desktop) | | Sign-up in English and in Amharic, unaided | Not yet tested | | |
| TalkBack + Chrome (Android) | | Sign-up and job application, unaided | Not yet tested | | |
| TalkBack in an Android WebView | | Sign-up, unaided | Not yet tested | | |
| Keyboard only (no mouse) | | All three flows | Automated pass (see 1.1); manual not yet tested | | |
| Browser zoom 200% and 400% | | Sign-up | Automated pass at 640 px and 320 px; manual not yet tested | | |
| Sound off | | Sign-up with read-aloud on, using captions | Automated pass; manual not yet tested | | |
| Co-designer, own device | | Main task (sign-up), unaided | Not yet tested | | |

## 2. Success criteria

### Perceivable
| Criterion | Level | Result | Evidence |
|---|---|---|---|
| 1.1.1 Non-text content | A | Supports | Every icon is `aria-hidden` next to a text label; the logo is decorative. axe `image-alt`, `svg-img-alt`: pass |
| 1.2.1 Audio-only and video-only (prerecorded) | A | Supports | Every audio clip speaks text that is on the screen; the caption box shows it while it plays |
| 1.2.2 – 1.2.5 Captions, audio description | A/AA | Not applicable | No video or synchronised media |
| 1.3.1 Info and relationships | A | Supports | `fieldset`/`legend` per question, native radios and checkboxes in labels, `dl` for review answers, labelled date selects, `table` with `caption` and `th scope`. axe pass in all states |
| 1.3.2 Meaningful sequence | A | Supports | DOM order = visual order; no CSS reordering |
| 1.3.3 Sensory characteristics | A | Supports | Instructions name buttons by their text ("press Next"), never by shape, colour or position |
| 1.3.4 Orientation | AA | Supports | No orientation lock; tested at 320 px and 640 px widths |
| 1.3.5 Identify input purpose | AA | Partially supports | `autocomplete='name'` on full name. The contact field takes a phone **or** an email, so it uses `autocomplete='email'`; a phone number is not auto-filled |
| 1.4.1 Use of colour | A | Supports | Selected = tick icon + thicker border; error = icon + left bar + text; current language = bold + border + `aria-pressed` |
| 1.4.2 Audio control | A | Supports | Speech starts only after a key press or tap. "Stop reading" and Escape stop all audio at once; the "read aloud?" question offers No |
| 1.4.3 Contrast (minimum) | AA | Supports | 75 of 75 pairs pass (section 4); axe `color-contrast` passes in all six themes, including error states |
| 1.4.4 Resize text | AA | Supports | rem/em sizing; 200% test passes with no loss; optional "Larger text" choice |
| 1.4.5 Images of text | AA | Supports | None used |
| 1.4.10 Reflow | AA | Supports | At 320 px wide, `scrollWidth` = viewport width and the Next button is fully visible (test "400% zoom"). The install code block scrolls on its own and can be focused |
| 1.4.11 Non-text contrast | AA | Supports | Borders, focus ring, tick, error bar at least 3:1 in every theme (section 4) |
| 1.4.12 Text spacing | AA | Not yet tested | No fixed heights on text containers by design; to be checked with a text-spacing bookmarklet |
| 1.4.13 Content on hover or focus | AA | Not applicable | No tooltips or hover pop-ups. The Colours menu opens only on click or Enter |

### Operable
| Criterion | Level | Result | Evidence |
|---|---|---|---|
| 2.1.1 Keyboard | A | Supports | Test "keyboard only": job flow from language page to thank-you using only Tab, Space and Enter. Tab and Shift+Tab visit every radio choice; Enter chooses a choice instead of sending the page (test "keyboard: Tab visits every radio choice"). Scrollable code block and table are focusable |
| 2.1.2 No keyboard trap | A | Supports | Same test tabs through the whole page and back out; the shadow root uses native focus order |
| 2.1.4 Character key shortcuts | A | Supports | No single-letter shortcuts. Escape only stops speech |
| 2.2.1 Timing adjustable | A | Supports | No time limits anywhere. Drafts are kept for 7 days on the device, and there is no session timeout |
| 2.2.2 Pause, stop, hide | A | Supports | The only animation (listening bars) runs only while listening, stops with Stop reading or Escape, and is off with `prefers-reduced-motion` |
| 2.3.1 Three flashes | A | Supports | One short outline pulse with the beep; no flashing |
| 2.4.1 Bypass blocks | A | Supports | "Skip to the form" / "Skip to the task" links on host pages |
| 2.4.2 Page titled | A | Supports | Each host page has a title that changes with the flow; the LTI page is titled |
| 2.4.3 Focus order | A | Supports | Focus moves to the question heading on every new screen and to the field after an error (tests "focus moves…", "error summary…", "consent…") |
| 2.4.4 Link purpose (in context) | A | Supports | Link text describes the destination |
| 2.4.5 Multiple ways | AA | Supports | Host pages have nav and footer links; the form is a single process (exempt) |
| 2.4.6 Headings and labels | AA | Supports | One heading per screen = the question; every control labelled |
| 2.4.7 Focus visible | AA | Supports | 3 px outline + 2 px gap ring on every control, in every theme; forced-colours fallback |
| 2.4.11 Focus not obscured (minimum) | AA | Supports | No sticky or overlay content covers the form; the sticky intro column on wide screens sits beside it |
| 2.5.1 Pointer gestures | A | Supports | Single taps only |
| 2.5.2 Pointer cancellation | A | Supports | Native buttons (activate on release) |
| 2.5.3 Label in name | A | Supports | Accessible names are the visible text; the review "Change" buttons add the question number after the visible word |
| 2.5.4 Motion actuation | A | Not applicable | No motion input |
| 2.5.7 Dragging movements | AA | Not applicable | No dragging |
| 2.5.8 Target size (minimum) | AA | Supports | Buttons 48 px, choices 56 px, language buttons 40 px, all above 24 px; test checks the Next button is at least 44 px high at 400% zoom |

### Understandable
| Criterion | Level | Result | Evidence |
|---|---|---|---|
| 3.1.1 Language of page | A | Supports | `html lang` on host pages; the form's `section` has `lang` of the chosen language (test "host language links…": `lang='am'`) |
| 3.1.2 Language of parts | AA | Supports | Every language button and invitation has its own `lang`; the caption box sets `lang` per clip |
| 3.2.1 On focus | A | Supports | Focus only reads the control aloud (when read-aloud is on); it never changes context |
| 3.2.2 On input | A | Supports | Choosing an option does not move on; the person presses Next. Language buttons are buttons (explicit actions) |
| 3.2.3 Consistent navigation | AA | Supports | Same top bar (languages, Colours, Read to me) on every screen |
| 3.2.4 Consistent identification | AA | Supports | Same names and icons for Next, Back, Skip, Read aloud everywhere |
| 3.2.6 Consistent help | A | Partially supports | Host pages show the same help contact in the footer; the plug-in itself relies on the host for a help link |
| 3.3.1 Error identification | A | Supports | `role='alert'` message with icon, `aria-invalid` on the field, focus moves to the field (four error states tested) |
| 3.3.2 Labels or instructions | A | Supports | Question as legend, hint under it (for example the phone format). A keyboard help strip on every page, in the chosen language, says what Tab, Shift+Tab, Space/Enter and Esc do |
| 3.3.3 Error suggestion | AA | Supports | Messages say how to fix: "10 digits, starting with zero, or an email with @"; "choose a month"; "tick the box to agree" |
| 3.3.4 Error prevention (legal, financial, data) | AA | Supports | Review page lists every answer with Change buttons; explicit consent before sending; receipt allows deletion |
| 3.3.7 Redundant entry | A | Supports | Answers are kept on Back, after language change, on reload (draft) and from the review |
| 3.3.8 Accessible authentication (minimum) | AA | Supports | No passwords, codes or CAPTCHA. LTI sign-in is done by the learning platform |

### Robust
| Criterion | Level | Result | Evidence |
|---|---|---|---|
| 4.1.2 Name, role, value | A | Supports | Native controls; `aria-pressed` on language buttons; `aria-current` on host nav. axe pass in all states |
| 4.1.3 Status messages | AA | Supports | `role='status'` region announces Sending, Listening, Saved on this device, Reading stopped; errors use `role='alert'` |

(4.1.1 Parsing is obsolete in WCAG 2.2 and is not listed.)

## 3. Ethiopian context and co-design findings (21 October test day)
| Finding | How it is addressed | Evidence |
|---|---|---|
| Time-outs locked people out | No time limits; drafts kept on the device | 2.2.1; test "drafts…" |
| Long pages were overwhelming | One question per screen, progress "Question n of t" | All flow tests |
| Voice and review were needed | Speak button, hands-free mode, review page with Change and "Start again" | `tests/voice.test.js` (22 tests) |
| Read-aloud in Ethiopian languages | Recorded clips in am, om, ti, so; captions for every clip | `public/audio/` (79 clips per language) |
| Blocked without a kebele ID | Four routes, including "I don't have an ID. Refer me through a partner"; no document number collected | API test "only known ID routes are stored" |
| Support needs felt like a medical form | Functional, non-medical labels; optional; "No proof needed"; separate consent; never shown to employers | API tests "privacy isolation", "support needs are dropped without their own consent" |
| Career gateway must not disclose needs | Needs filter jobs on the device and are never sent | API test "application never stores work needs"; browser test "keyboard only" (filter shows one job) |

## 4. Contrast evidence
Output of `node tools/contrast-check.mjs --md` (15 November 2026). The `auto` theme uses the Standard or Dark tokens.

| Theme | Use | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|---|
| standard | Body text | `--ink #1b1d1a` | `--surface #ffffff` | 16.97:1 | 4.5:1 | Pass |
| standard | Text on page background | `--ink #1b1d1a` | `--bg #f6f4ef` | 15.44:1 | 4.5:1 | Pass |
| standard | Hints and secondary text | `--ink-2 #4a4f47` | `--surface #ffffff` | 8.40:1 | 4.5:1 | Pass |
| standard | Caption label, privacy note | `--ink-2 #4a4f47` | `--surface-2 #efece4` | 7.11:1 | 4.5:1 | Pass |
| standard | Caption text | `--ink #1b1d1a` | `--surface-2 #efece4` | 14.38:1 | 4.5:1 | Pass |
| standard | Primary button text | `--accent-ink #ffffff` | `--accent #1d5c3f` | 7.91:1 | 4.5:1 | Pass |
| standard | Primary button text (hover) | `--accent-ink #ffffff` | `--accent-hover #164a32` | 10.20:1 | 4.5:1 | Pass |
| standard | Selected choice text, Listening banner | `--ink #1b1d1a` | `--accent-soft #e2eee6` | 14.23:1 | 4.5:1 | Pass |
| standard | Error message text | `--ink #1b1d1a` | `--error-soft #fbeae8` | 14.58:1 | 4.5:1 | Pass |
| standard | Links, accent icons | `--accent #1d5c3f` | `--surface #ffffff` | 7.91:1 | 4.5:1 | Pass |
| standard | Error icon and invalid border | `--error #a3221b` | `--surface #ffffff` | 7.49:1 | 3:1 | Pass |
| standard | Button and input borders | `--line-strong #6b6f66` | `--surface #ffffff` | 5.13:1 | 3:1 | Pass |
| standard | Focus ring | `--focus #1d5c3f` | `--surface #ffffff` | 7.91:1 | 3:1 | Pass |
| standard | Selected choice border and tick | `--accent #1d5c3f` | `--accent-soft #e2eee6` | 6.63:1 | 3:1 | Pass |
| standard | Error bar | `--error #a3221b` | `--error-soft #fbeae8` | 6.44:1 | 3:1 | Pass |
| dark | Body text | `--ink #eef0ea` | `--surface #1b1e1b` | 14.65:1 | 4.5:1 | Pass |
| dark | Text on page background | `--ink #eef0ea` | `--bg #121412` | 16.12:1 | 4.5:1 | Pass |
| dark | Hints and secondary text | `--ink-2 #b9bfb4` | `--surface #1b1e1b` | 8.95:1 | 4.5:1 | Pass |
| dark | Caption label, privacy note | `--ink-2 #b9bfb4` | `--surface-2 #252925` | 7.86:1 | 4.5:1 | Pass |
| dark | Caption text | `--ink #eef0ea` | `--surface-2 #252925` | 12.86:1 | 4.5:1 | Pass |
| dark | Primary button text | `--accent-ink #0b1a11` | `--accent #86d4a8` | 10.25:1 | 4.5:1 | Pass |
| dark | Primary button text (hover) | `--accent-ink #0b1a11` | `--accent-hover #a3e0bd` | 11.93:1 | 4.5:1 | Pass |
| dark | Selected choice text, Listening banner | `--ink #eef0ea` | `--accent-soft #1d3427` | 11.63:1 | 4.5:1 | Pass |
| dark | Error message text | `--ink #eef0ea` | `--error-soft #3b1d1a` | 13.28:1 | 4.5:1 | Pass |
| dark | Links, accent icons | `--accent #86d4a8` | `--surface #1b1e1b` | 9.61:1 | 4.5:1 | Pass |
| dark | Error icon and invalid border | `--error #ff8f85` | `--surface #1b1e1b` | 7.63:1 | 3:1 | Pass |
| dark | Button and input borders | `--line-strong #80887d` | `--surface #1b1e1b` | 4.60:1 | 3:1 | Pass |
| dark | Focus ring | `--focus #86d4a8` | `--surface #1b1e1b` | 9.61:1 | 3:1 | Pass |
| dark | Selected choice border and tick | `--accent #86d4a8` | `--accent-soft #1d3427` | 7.63:1 | 3:1 | Pass |
| dark | Error bar | `--error #ff8f85` | `--error-soft #3b1d1a` | 6.92:1 | 3:1 | Pass |
| contrast | Body text | `--ink #000000` | `--surface #ffffff` | 21.00:1 | 4.5:1 | Pass |
| contrast | Text on page background | `--ink #000000` | `--bg #ffffff` | 21.00:1 | 4.5:1 | Pass |
| contrast | Hints and secondary text | `--ink-2 #000000` | `--surface #ffffff` | 21.00:1 | 4.5:1 | Pass |
| contrast | Caption label, privacy note | `--ink-2 #000000` | `--surface-2 #ffffff` | 21.00:1 | 4.5:1 | Pass |
| contrast | Caption text | `--ink #000000` | `--surface-2 #ffffff` | 21.00:1 | 4.5:1 | Pass |
| contrast | Primary button text | `--accent-ink #ffffff` | `--accent #000000` | 21.00:1 | 4.5:1 | Pass |
| contrast | Primary button text (hover) | `--accent-ink #ffffff` | `--accent-hover #000000` | 21.00:1 | 4.5:1 | Pass |
| contrast | Selected choice text, Listening banner | `--ink #000000` | `--accent-soft #fff200` | 17.95:1 | 4.5:1 | Pass |
| contrast | Error message text | `--ink #000000` | `--error-soft #fff200` | 17.95:1 | 4.5:1 | Pass |
| contrast | Links, accent icons | `--accent #000000` | `--surface #ffffff` | 21.00:1 | 4.5:1 | Pass |
| contrast | Error icon and invalid border | `--error #000000` | `--surface #ffffff` | 21.00:1 | 3:1 | Pass |
| contrast | Button and input borders | `--line-strong #000000` | `--surface #ffffff` | 21.00:1 | 3:1 | Pass |
| contrast | Focus ring | `--focus #000000` | `--surface #ffffff` | 21.00:1 | 3:1 | Pass |
| contrast | Selected choice border and tick | `--accent #000000` | `--accent-soft #fff200` | 17.95:1 | 3:1 | Pass |
| contrast | Error bar | `--error #000000` | `--error-soft #fff200` | 17.95:1 | 3:1 | Pass |
| rg | Body text | `--ink #16191d` | `--surface #ffffff` | 17.63:1 | 4.5:1 | Pass |
| rg | Text on page background | `--ink #16191d` | `--bg #f5f6f8` | 16.31:1 | 4.5:1 | Pass |
| rg | Hints and secondary text | `--ink-2 #454b54` | `--surface #ffffff` | 8.80:1 | 4.5:1 | Pass |
| rg | Caption label, privacy note | `--ink-2 #454b54` | `--surface-2 #eceff3` | 7.63:1 | 4.5:1 | Pass |
| rg | Caption text | `--ink #16191d` | `--surface-2 #eceff3` | 15.29:1 | 4.5:1 | Pass |
| rg | Primary button text | `--accent-ink #ffffff` | `--accent #0b57a4` | 7.21:1 | 4.5:1 | Pass |
| rg | Primary button text (hover) | `--accent-ink #ffffff` | `--accent-hover #084683` | 9.48:1 | 4.5:1 | Pass |
| rg | Selected choice text, Listening banner | `--ink #16191d` | `--accent-soft #e1ecf8` | 14.74:1 | 4.5:1 | Pass |
| rg | Error message text | `--ink #16191d` | `--error-soft #fdf0e3` | 15.74:1 | 4.5:1 | Pass |
| rg | Links, accent icons | `--accent #0b57a4` | `--surface #ffffff` | 7.21:1 | 4.5:1 | Pass |
| rg | Error icon and invalid border | `--error #9a4a00` | `--surface #ffffff` | 6.26:1 | 3:1 | Pass |
| rg | Button and input borders | `--line-strong #5f6772` | `--surface #ffffff` | 5.72:1 | 3:1 | Pass |
| rg | Focus ring | `--focus #0b57a4` | `--surface #ffffff` | 7.21:1 | 3:1 | Pass |
| rg | Selected choice border and tick | `--accent #0b57a4` | `--accent-soft #e1ecf8` | 6.03:1 | 3:1 | Pass |
| rg | Error bar | `--error #9a4a00` | `--error-soft #fdf0e3` | 5.59:1 | 3:1 | Pass |
| by | Body text | `--ink #1c1b1a` | `--surface #ffffff` | 17.20:1 | 4.5:1 | Pass |
| by | Text on page background | `--ink #1c1b1a` | `--bg #f6f5f4` | 15.79:1 | 4.5:1 | Pass |
| by | Hints and secondary text | `--ink-2 #4d4a47` | `--surface #ffffff` | 8.80:1 | 4.5:1 | Pass |
| by | Caption label, privacy note | `--ink-2 #4d4a47` | `--surface-2 #eeecea` | 7.47:1 | 4.5:1 | Pass |
| by | Caption text | `--ink #1c1b1a` | `--surface-2 #eeecea` | 14.60:1 | 4.5:1 | Pass |
| by | Primary button text | `--accent-ink #ffffff` | `--accent #006a66` | 6.45:1 | 4.5:1 | Pass |
| by | Primary button text (hover) | `--accent-ink #ffffff` | `--accent-hover #00534f` | 8.94:1 | 4.5:1 | Pass |
| by | Selected choice text, Listening banner | `--ink #1c1b1a` | `--accent-soft #dff0ef` | 14.62:1 | 4.5:1 | Pass |
| by | Error message text | `--ink #1c1b1a` | `--error-soft #fbe6ec` | 14.44:1 | 4.5:1 | Pass |
| by | Links, accent icons | `--accent #006a66` | `--surface #ffffff` | 6.45:1 | 4.5:1 | Pass |
| by | Error icon and invalid border | `--error #b0003a` | `--surface #ffffff` | 7.22:1 | 3:1 | Pass |
| by | Button and input borders | `--line-strong #6c6863` | `--surface #ffffff` | 5.53:1 | 3:1 | Pass |
| by | Focus ring | `--focus #006a66` | `--surface #ffffff` | 6.45:1 | 3:1 | Pass |
| by | Selected choice border and tick | `--accent #006a66` | `--accent-soft #dff0ef` | 5.49:1 | 3:1 | Pass |
| by | Error bar | `--error #b0003a` | `--error-soft #fbe6ec` | 6.07:1 | 3:1 | Pass |

## 5. Known limitations
- Speech recognition depends on the browser. Chrome and Edge have no recogniser for Afaan Oromoo or Tigrinya, so people type. Voice is never required.
- When the device has no voice for a language and a clip is missing, the text is shown but not spoken, and the form says so. Nine new clips per language (consent, date and draft messages, `q_role`) still need generating: `npm run recording`, then the Colab script.
- All non-English text is a draft until a native speaker checks it (marked `VERIFY_NATIVE` in the code).
- Screen-reader users who also turn on Read to me hear two voices; Escape or Stop reading stops the plug-in's voice.
- The manual assistive-technology results in section 1.2 are not yet recorded.
