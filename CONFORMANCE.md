# WCAG 2.2 AA conformance: summary

The full report, with every criterion, the evidence and the contrast table, is **[docs/WCAG-2.2-AA-Report.md](docs/WCAG-2.2-AA-Report.md)**. This file is a summary of it; when the report changes, update the numbers here.

| | Result (15 November 2026) |
|---|---|
| axe-core 4.14.0, WCAG 2.0/2.1/2.2 A and AA rules | 37 scans across every flow, state and theme, including a blank host page: **0 violations of any impact** |
| Browser tests (Playwright, Chromium) | 31 of 31 pass: keyboard-only flow, a blank host page with no styles, Tab and Enter on every choice, keyboard help, Larger text, spoken review clips in six languages, focus, 200% and 400% zoom, six themes, captions with sound off, drafts, offline, hosts |
| Contrast (`npm run contrast`) | 75 of 75 colour pairs pass in five token sets |
| Unit and API tests | 112 of 112 pass |
| Criteria (55 at A and AA) | 45 Supports, 2 Partially supports (1.3.5, 3.2.6), 1 Not yet tested (1.4.12), 7 Not applicable, 0 Does not support |
| NVDA, TalkBack, co-designer sessions | **Not yet tested**: see report section 1.2 and `docs/manual-test-script.md` |

Re-run everything: `npm run test:all` and `npm run contrast`.

## Who tested, on which device, and what they could not do

| Who | Device and assistive technology | What they did | Result |
|---|---|---|---|
| Tinsae (co-designer) | Their own device: **[team to fill in: phone or laptop, browser, screen reader]** | Reviewed the design and the sign-up flow | Approved the design. Asked for larger text to enlarge the **whole page, navigation included**: built the same day (text size 100%, 150%, 200% for the whole page, no sideways scrolling) |
| Tinsae (co-designer), final gate test | **[team to fill in after the session]** | The main task: sign up unaided | **[team to fill in: finished yes or no, time taken, where they hesitated, what they could not do]** |
| Team, automated | Chromium with axe-core 4.14.0 and Playwright | Every flow, state and theme; keyboard only; 200% and 400% zoom; sound off; a blank host page | 31 of 31 pass, 0 axe violations of any impact |
| Team, Amharic | A native Amharic speaker on the team | Checked every Amharic text; chose the Amharic number voices by ear | Amharic text verified; Afaan Oromoo, Tigrinya, Somali and Sidaamu Afoo still drafts |

**What we could not test:** NVDA and TalkBack sessions with the co-designer are recorded above only once they have happened. We have not tested inside the live Savanna, only on a Savanna-style page and through LTI 1.3.
