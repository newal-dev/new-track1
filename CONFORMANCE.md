# WCAG 2.2 AA conformance: summary

The full report, with every criterion, the evidence and the contrast table, is **[docs/WCAG-2.2-AA-Report.md](docs/WCAG-2.2-AA-Report.md)**. This file is a summary of it; when the report changes, update the numbers here.

| | Result (15 November 2026) |
|---|---|
| axe-core 4.14.0, WCAG 2.0/2.1/2.2 A and AA rules | 36 scans across every flow, state and theme: **0 violations** (0 critical, 0 serious) |
| Browser tests (Playwright, Chromium) | 30 of 30 pass: keyboard-only flow, Tab and Enter on every choice, keyboard help, Larger text, spoken review clips in six languages, focus, 200% and 400% zoom, six themes, captions with sound off, drafts, offline, hosts |
| Contrast (`npm run contrast`) | 75 of 75 colour pairs pass in five token sets |
| Unit and API tests | 101 of 101 pass |
| Criteria (55 at A and AA) | 45 Supports, 2 Partially supports (1.3.5, 3.2.6), 1 Not yet tested (1.4.12), 7 Not applicable, 0 Does not support |
| NVDA, TalkBack, co-designer sessions | **Not yet tested**: see report section 1.2 and `docs/manual-test-script.md` |

Re-run everything: `npm run test:all` and `npm run contrast`.
