# WCAG 2.2 AA conformance: summary

The full report, with every criterion, the evidence and the contrast table, is **[docs/WCAG-2.2-AA-Report.md](docs/WCAG-2.2-AA-Report.md)**. This file is a summary of it; when the report changes, update the numbers here.

| | Result (15 November 2026) |
|---|---|
| axe-core 4.14.0, WCAG 2.0/2.1/2.2 A and AA rules | 37 scans across every flow, state and theme, including a blank host page: **0 violations of any impact** |
| Browser tests (Playwright, Chromium) | 33 of 33 pass: keyboard-only flow, deleting answers with the receipt, inside the official Savanna starter, a blank host page with no styles, Tab and Enter on every choice, keyboard help, Larger text, spoken review clips in six languages, focus, 200% and 400% zoom, six themes, captions with sound off, drafts, offline, hosts |
| Contrast (`npm run contrast`) | 75 of 75 colour pairs pass in five token sets |
| Unit and API tests | 115 of 115 pass |
| Criteria (55 at A and AA) | 45 Supports, 2 Partially supports (1.3.5, 3.2.6), 1 Not yet tested (1.4.12), 7 Not applicable, 0 Does not support |
| NVDA, TalkBack | **Not yet tested** with a screen reader user |

Re-run everything: `npm run test:all` and `npm run contrast`.

## Who tested, on which device, and what they could not do

| Who | Device and assistive technology | What they did | Result |
|---|---|---|---|
| Tinsae (co-designer) | Not recorded | Shaped the design with the team | Asked for six languages, a design that works for Deaf people, colours for people with eye problems, and the menu to grow with the text size. All were built (text size 100%, 150% and 200% for the whole page, navigation included) |
| Team, automated | Chromium with axe-core 4.14.0 and Playwright | Every flow, state and theme; keyboard only; 200% and 400% zoom; sound off; a blank host page; inside the official Savanna starter | 33 of 33 pass, 0 axe violations of any impact |
| Team, Amharic | A native Amharic speaker on the team | Checked every Amharic text; chose the Amharic number voices by ear | Amharic text verified; Afaan Oromoo, Tigrinya, Somali and Sidaamu Afoo still drafts |

**What was not tested, honestly:** no recorded session yet with a screen reader user (TalkBack or NVDA), keyboard only, 200% zoom and sound off together; those parts of the gate are covered only by our automated tests above. We tested inside the official Savanna starter pages and through LTI 1.3, not on the live Savanna platform.
