# Privacy note

This is the short version for learners, partners and judges. Plain words, no legal language.
Our reading of Ethiopia's Personal Data Protection Proclamation No. 1321/2024, not legal advice.

## What is stored

| What | Where | Sent only if |
|---|---|---|
| Your answers: name, phone or email, how you will show who you are (never an ID number) | The server | You tick "I agree to send these answers to {partner}" |
| Support needs (for example large text, sign language), optional, no proof asked | The server, in a separate store | You tick a **second, separate** box for them |
| "Prefer not to say" | Nowhere | Never sent |
| A job seeker's work needs | Only on your own phone (the job filter runs there) | Never sent |
| Unfinished answers (a draft) | Only in your own browser | Never sent; deleted when you send or press "Start again" |
| Consent record: what you agreed to, when, in which language, for which partner | The server | Always, when you send. It holds no name and no answers |

Voice: when you speak an answer, your browser's speech service turns it into text (Chrome and Edge send the audio to their provider). The form says this before it listens. Typing always works, and a partner can turn voice off.

## For how long

- **This demo** keeps everything in the server's memory only. It is all erased whenever the server restarts; on the free hosting plan that happens after about 15 minutes without visitors. Please use test data, never a real name or phone number.
- **Drafts** on your device are kept for up to 7 days, then deleted.
- **A real partner** must set its own retention period (we suggest the length of the course plus 6 months) and say it on its sign-up page. Answers you delete are gone at once.

## Who can see it

- **You**, with your **receipt code** (the 24 letters and numbers on the thank-you page). On the thank-you page, or later on the **My answers** page, you can see your answers, download a copy, or delete them. No account or password is needed, so keep the code private.
- **The partner** you agreed to send them to (the organisation running the website). In this demo there is no staff login yet, so nobody can browse the answers through the API.
- **Employers never see support needs.** They see only the job posts they wrote themselves.
- The partner's administrator can see the **consent log** (who agreed to what and when, without names or answers) with a secret token.

## How to delete your answers

1. Keep the receipt code from the thank-you page.
2. Press **Delete my answers** there, or open the **My answers** page later and type the code.
3. Confirm with **Yes, delete them**. Your answers and support needs are deleted at once. An employer's job post is removed. The consent log keeps only the time you withdrew.

For developers: `GET` and `DELETE /v1/receipts/{code}`, or `/v1/records/{id}` with the `X-Receipt` header. See `/docs`.
