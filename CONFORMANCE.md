# WCAG 2.2 AA Conformance Report

- Date: 15 November 2026 (update when finished)
- Standard: Web Content Accessibility Guidelines (WCAG) 2.2, Level AA (https://www.w3.org/TR/WCAG22/)
- Scope: db-form plugin (flows signup, job, employer) as embedded in the demo host page
- Technologies relied upon: HTML, CSS, JavaScript (Web Components)
- Used but not relied upon: Web Speech API (voice input and read-aloud), recorded audio files
- Tested by: team names and co-designer (manual testing still to do, see below)

## What has actually been tested so far
| Done | How |
|---|---|
| Automated keyboard-only runs of every state of all three flows, in English and Amharic: first screen, welcome, every question, empty-answer error, phone/email format error, review, send failure, success | `tests/a11y-flows.spec.js` (Playwright 1.63.0, Chrome for Testing 153, headless, Linux). Only Tab, Shift+Tab, Enter, Space, arrow keys, Escape and typing are used |
| axe-core 4.14.0 scan (tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice) at each state above, plus the listening state | Same file: zero violations of any impact |
| Reflow at 640 px and 320 px wide (layout equal to 200% and 400% zoom of a 1280 px window), Amharic, larger text on, long name and email | Same file: no horizontal scrolling, no violations |
| Microphone behaviour with a simulated speech API: never on page load, only after a voice button, Listening announced, Stop listening and Switch to typing by keyboard, permission denied, no speech heard | Same file. The speech API is **simulated**; no real microphone was used |
| Colour contrast of every colour pair in the plugin and demo host | Calculated with the WCAG formula (lowest: 5.69:1 option border; all text 7.7:1 or more) |

**Not tested yet (must be done before this report is final):** NVDA, JAWS, VoiceOver, TalkBack or any other screen reader; real browser zoom (only viewport width was emulated); text-only zoom; a real Android phone; Firefox and Safari; a real microphone and Chrome's real speech service; Amharic speech recognition; recorded audio (none exists yet); testing by the co-designer.

| Criterion | Result | Evidence |
|---|---|---|
| 1.1.1 Non-text content | Automated checks pass; not tested with a screen reader | Icons and emoji are aria-hidden; every choice and button has a text name |
| 1.3.1 Info and relationships | Automated checks pass; not tested with a screen reader | Each question is a fieldset with a legend holding an h2; hints and errors linked with aria-describedby |
| 1.3.5 Identify input purpose | Automated check of markup only | Full name has autocomplete="name". The phone-or-email field accepts either, so it has no single purpose token |
| 1.4.1 Use of colour | Checked visually in screenshots | Errors start with "Error:" and have a bar; listening state says "Microphone on: listening"; the chosen language has a check mark and aria-pressed |
| 1.4.3 Contrast (minimum) | Calculated pass; not measured on a device | See table above |
| 1.4.4 Resize text | Not tested | Only viewport width emulation was done, not text-only zoom |
| 1.4.10 Reflow | Pass in emulation (320 px wide), Chromium only | Fixed: demo host install snippet scrolled sideways at 320 px (axe: scrollable-region-focusable, serious) |
| 1.4.11 Non-text contrast | Calculated pass | Borders, focus ring and controls 5.69:1 or more |
| 2.1.1 Keyboard | Pass in automated keyboard runs, Chromium only; not tested by a person | All flows completed with keyboard only |
| 2.1.2 No keyboard trap | Pass in automated runs (Tab and Shift+Tab move in and out), Chromium only | Listening never takes focus |
| 2.2.1 Timing adjustable | Not tested | No time limits by design. Listening stops after silence, but nothing is lost and typing always works |
| 2.3.3 / 2.2.2 Motion | Automated check | Listening animation is off with prefers-reduced-motion |
| 2.4.3 Focus order | Pass in automated runs | Focus moves to the new heading on each step, to the field in error, to the error after a failed send, to the thank-you heading |
| 2.4.6 Headings and labels | Automated checks pass | Every screen has an h2; review "Change" buttons have unique names (for example "Change answer 2: …") |
| 2.4.7 Focus visible | Automated check (3px solid outline on focused buttons) | Not checked on every control by a person |
| 2.4.11 Focus not obscured (minimum) | Not tested | No sticky or overlapping content by design |
| 2.5.8 Target size (minimum) | Not measured | Buttons and options are at least 44px by CSS |
| 3.1.1 Language of page | Not tested | Demo host page is English |
| 3.1.2 Language of parts | Automated check of markup | The plugin section has lang="en" or lang="am"; each language button has its own lang |
| 3.2.2 On input | Automated runs | Nothing changes until Next is pressed. Voice input never starts by itself |
| 3.3.1 Error identification | Pass in automated runs | Field gets aria-invalid and its error is in its description |
| 3.3.2 Labels or instructions | Automated checks pass | Spoken-word instructions ("Say Next…") are shown only while the microphone is listening |
| 3.3.3 Error suggestion | Automated runs | The phone/email error explains the expected format |
| 3.3.4 Error prevention | Automated runs | Review screen before submit; failed send keeps every answer |
| 3.3.7 Redundant entry, new in 2.2 | Not tested | Back, language switch, Stop reading and Escape keep typed answers (regression tested) |
| 3.3.8 Accessible authentication, new in 2.2 | Not tested | No login or CAPTCHA |
| 4.1.2 Name, role, value | Automated checks pass; not tested with a screen reader | Toggle buttons use aria-pressed; required fields marked required |
| 4.1.3 Status messages | Automated check that one status region persists and receives each message | Not yet heard with a screen reader |

## Known issues
- No screen reader testing yet. This is the biggest gap.
- Amharic voice and speech recognition depend on the device and browser. All Amharic text, including the new messages about voice input, is a draft until a native speaker checks it.
- Read aloud uses the device voice and can talk over a screen reader. It only starts when the person asks for it.
- In voice mode the spoken instructions ("Say Next…") are read just before the microphone starts, and the screen shows "Listening. Speak now." once it is really listening.
- No recorded audio exists yet, so Amharic read-aloud is silent on most devices.
