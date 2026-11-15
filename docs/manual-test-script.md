# Manual accessibility test script (about 20 minutes per setting)

Use this with the co-designer and for the NVDA and TalkBack rows of `docs/WCAG-2.2-AA-Report.md`, section 1.2.
**Do not help the tester.** Note where they hesitate, what they say, and whether they finish. Write the result in the report the same day.

Start: `docker compose up --build`, then open `http://localhost:8080` (on a phone: the computer's address on the same Wi-Fi, for example `http://192.168.1.20:8080`; the microphone needs HTTPS or localhost).

## The main task (all settings)
"Please sign up for the programme in the language you prefer. Give your name and a phone number, choose how you will show who you are, choose any support you want, and send your answers."
Success = the thank-you page with a receipt code, reached without help.

## Settings
| # | Setting | How to set it up | Check as well |
|---|---|---|---|
| 1 | NVDA + Chrome | NVDA 2024 or newer, Chrome, mouse unplugged | Each question, hint, choice and error is read once; focus lands on the question; the error is announced |
| 2 | TalkBack + Chrome (Android) | Settings, Accessibility, TalkBack on | Swipe order follows the screen; double-tap selects; the consent box is announced |
| 3 | TalkBack in a WebView | Open the page from an app that uses a WebView (for example a link inside a messaging app) | Same as 2 |
| 4 | Keyboard only | Mouse unplugged | Tab, Shift+Tab, Space, Enter, Escape; focus is always visible; Tab reaches every choice; Enter chooses; keyboard help shown in the chosen language; Read to me reads each choice |
| 5 | 200% and 400% zoom | Ctrl and + until 200%, then 400% | Nothing cut off, no sideways scrolling, buttons reachable |
| 6 | Sound off | Mute the device, choose Yes to read aloud | The caption box shows every spoken line; Listening is visible |
| 7 | Amharic | Choose አማርኛ on the first page | Every word is Amharic; clips play; Ge'ez letters show correctly |

## Record for each setting
- Device, browser and screen-reader versions
- Finished unaided: yes or no. If no, where they stopped
- Time taken
- Problems, in the tester's own words
- Fix made (commit) and retest result
