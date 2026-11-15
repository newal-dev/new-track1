# Put the MVP online (for the submission link)

Everything runs from **one server** and one address: the demo partner site, the plug-in, the voice clips, the API,
the demo learning platform (LTI 1.3) and the simulated SMS inbox. The bare address opens the demo partner site.

| Address | What it is |
|---|---|
| `https://YOUR-ADDRESS/` | Demo partner site with the sign-up form (same as `/site/`) |
| `https://YOUR-ADDRESS/site/savanna.html` | The plug-in inside a Savanna-style course page |
| `https://YOUR-ADDRESS/demo/lms` | Demo learning platform: signed LTI 1.3 launches |
| `https://YOUR-ADDRESS/demo/sms-inbox` | Simulated SMS inbox |
| `https://YOUR-ADDRESS/openapi.yaml` | REST API specification |
| `https://YOUR-ADDRESS/?info` | Server summary |

## Option A: Render (free, about 10 minutes, no credit card)

1. Go to https://render.com and sign up **with GitHub**. Allow Render to see the `new-track1` repository.
2. Click **New**, then **Blueprint**. Choose the repository `newal-dev/new-track1` and the branch
   `claude/busy-tesla-9gbzv7` (or `main` once it is merged).
3. Render reads `render.yaml` from the repository and shows one web service, **inclusive-access**. Click **Apply**.
4. Wait for the build (about 5 minutes) until it says **Live**. Your address is shown at the top, for example
   `https://inclusive-access-ab12.onrender.com`. Open it: you should see the demo partner site.
5. Submit that address as the **deployed MVP** link. It is public: no login is needed to use it.

Good to know:
- **HTTPS** comes with Render, and voice input needs it (browsers only allow the microphone on HTTPS pages).
- **Free plan sleep:** after about 15 minutes without visitors the service sleeps, and the next visit takes about a
  minute to wake it. Open the link yourself a few minutes before judging or a demo.
- **Answers are kept in memory:** they are cleared when the service restarts or sleeps. That is fine for a demo.
- **Admin login:** the app itself has none. The consent log `GET /v1/consents` is protected by `ADMIN_TOKEN`; Render
  makes a random one (service, **Environment**). Only put it in the slides if you want judges to see the consent log:
  `curl -H "Authorization: Bearer <ADMIN_TOKEN>" https://YOUR-ADDRESS/v1/consents`.
- **After a new push** to the branch, Render rebuilds by itself. Visitors get the new version on their next reload or
  the one after (the offline cache is replaced automatically).

## Option B: any server with Docker

```sh
docker build -t inclusive-access .
docker run -d -p 3000:3000 -e PUBLIC_URL=https://YOUR-ADDRESS -e ADMIN_TOKEN=change-me inclusive-access
```

Put it behind HTTPS (for example Caddy or nginx with Let's Encrypt). `PUBLIC_URL` must be the address people use.

## Partners: add the plug-in to their own site

Once it is online, any website adds the form with two lines (details in [PARTNER_GUIDE.md](PARTNER_GUIDE.md)):

```html
<script src='https://YOUR-ADDRESS/widget.js'></script>
<db-onboarding api='https://YOUR-ADDRESS/v1' audio='https://YOUR-ADDRESS/audio' partner='Your organisation'></db-onboarding>
```
