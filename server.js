// Inclusive Access plugin server: the widget script, the REST API (Level 2), schema.org/JobPosting and LTI 1.3 (Level 3).
// Storage is in memory only. Nothing is sent to any other service: there are no paid or external APIs.
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { randomUUID, randomBytes, createHmac, createHash, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateKeyPair, exportJWK, SignJWT, jwtVerify, createLocalJWKSet, createRemoteJWKSet } from 'jose';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Release number: a hash of the widget, the service worker and every audio clip. It changes whenever any of them changes.
const RELEASE = (() => {
  const h = createHash('sha256'), add = f => { h.update(f); h.update(fs.readFileSync(f)); };
  ['public/db-form.js', 'public/db-sw.js'].forEach(f => add(path.join(ROOT, f)));
  const audio = path.join(ROOT, 'public/audio');
  if (fs.existsSync(audio)) for (const l of fs.readdirSync(audio).sort()) {
    const d = path.join(audio, l); if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d).sort()) if (f.endsWith('.mp3')) add(path.join(d, f));
  }
  return h.digest('hex').slice(0, 12);
})();
const OFFERS = ['stepfree', 'reader', 'interp', 'hours', 'remote'];
const OFFER_EN = { stepfree: 'Step-free workplace', reader: 'Screen-reader friendly tools', interp: 'Sign language interpreter', hours: 'Flexible hours', remote: 'Work from home' };
// 'Prefer not to say' is a choice on screen too, but it is never sent or stored: it means no support data at all.
const SUPPORT = ['screenreader', 'large', 'voice', 'sign', 'captions', 'interp', 'time', 'simple', 'human'];
const ID_ROUTES = ['kebele', 'refugee', 'other', 'refer'];
const LANGS = ['en', 'am', 'om', 'ti', 'so', 'sid'];
export const CONSENT_VERSION = '2026-11-15';

// Seed jobs. Titles in om, ti, so and sid are drafts: VERIFY_NATIVE.
const seedJobs = () => [
  { id: 1, title: 'Customer support agent', titles: { en: 'Customer support agent', am: 'የደንበኞች አገልግሎት ሠራተኛ', om: 'Hojjetaa tajaajila maamilaa', ti: 'ሰራሕተኛ ኣገልግሎት ዓማዊል', so: 'Wakiilka taageerada macaamiisha', sid: 'Maamilu kaa\'lo loosaancho' }, offers: ['remote', 'hours'], org: 'Addis Community Learning Hub', datePosted: '2026-11-01', validThrough: '2026-12-31' },
  { id: 2, title: 'Data entry clerk', titles: { en: 'Data entry clerk', am: 'የመረጃ ማስገቢያ ሠራተኛ', om: 'Hojjetaa galmee odeeffannoo', ti: 'ሰራሕተኛ ምእታው ሓበሬታ', so: 'Karraaniga gelinta xogta', sid: 'Odeeffo eeshsha loosaancho' }, offers: ['stepfree', 'reader'], org: 'Bole Digital Services', datePosted: '2026-11-05', validThrough: '2027-01-15' },
];

const str = (v, max) => (typeof v === 'string' ? v.normalize('NFC').trim().slice(0, max) : undefined);
const list = (v, allowed) => (Array.isArray(v) ? [...new Set(v.filter(x => allowed.includes(x)))] : []);
const date = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) ? v : undefined);
const isPhone = v => /^(0\d{9}|251\d{9})$/.test(String(v || '').replace(/\D/g, '')) && !String(v).includes('@');
// One stored format for Ethiopian phone numbers: +251 and nine digits. Anything else (an email) is kept as it is.
const phoneE164 = v => { if (!v || !isPhone(v)) return v; const d = String(v).replace(/\D/g, ''); return '+251' + (d.startsWith('251') ? d.slice(3) : d.slice(1)); };
const phoneLocal = v => (isPhone(v) ? '0' + String(v).replace(/\D/g, '').slice(-9) : v);
const mask = v => { const d = String(v).replace(/\D/g, ''); return d.slice(0, 2) + '•'.repeat(Math.max(0, d.length - 4)) + d.slice(-2); };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

// schema.org/JobPosting. Only what the employer published: never anything about learners.
export function jobPosting(j, base) {
  const offers = j.offers.map(k => OFFER_EN[k]);
  const p = {
    '@type': 'JobPosting',
    identifier: { '@type': 'PropertyValue', name: j.org || 'Inclusive Access', value: String(j.id) },
    title: j.title,
    description: `${j.title}. Workplace adjustments offered: ${offers.length ? offers.join(', ') : 'ask the employer'}.`,
    datePosted: j.datePosted,
    hiringOrganization: { '@type': 'Organization', name: j.org || 'Employer (name not given)' },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Addis Ababa', addressCountry: 'ET' } },
    jobBenefits: offers.join(', '),
    url: `${base}/v1/jobs/${j.id}`,
  };
  if (j.validThrough) p.validThrough = j.validThrough;
  if (j.offers.includes('remote')) { p.jobLocationType = 'TELECOMMUTE'; p.applicantLocationRequirements = { '@type': 'Country', name: 'Ethiopia' }; }
  return p;
}

export async function createApp(opt = {}) {
  // Render.com and similar hosts give the public address in RENDER_EXTERNAL_URL, so a one-click deploy needs no settings.
  const BASE = (opt.publicUrl || process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/$/, '');
  const SECRET = opt.secret || process.env.APP_SECRET || randomBytes(32).toString('hex');
  const ADMIN = opt.adminToken ?? process.env.ADMIN_TOKEN ?? '';
  const origins = (opt.origins ?? process.env.ALLOWED_ORIGINS ?? '').split(',').map(x => x.trim()).filter(Boolean);

  const app = express();
  // gzip text (the widget, pages, JSON): the 160 kB widget travels as about 55 kB, which matters on 3G. Audio and fonts are already compressed.
  app.use(compression());
  app.disable('x-powered-by');
  app.use(cors({ origin: origins.length ? origins : true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use((err, req, res, next) => res.status(err.status || 400).json({ error: { code: err.type === 'entity.too.large' ? 'too_large' : 'bad_json', message: 'The request body could not be read.' } }));

  // Separate stores. support_preferences is never returned by any route.
  const records = new Map(), supportPreferences = new Map(), consents = new Map(), smsInbox = [];
  const jobs = seedJobs();
  app.locals.stores = { records, supportPreferences, consents, smsInbox, jobs };

  const hmac = s => createHmac('sha256', SECRET).update(s).digest('base64url');
  const receiptOf = id => hmac('receipt:' + id).slice(0, 24);
  const same = (a, b) => typeof a === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
  const fail = (res, status, code, message, field) => res.status(status).json({ error: { code, message, ...(field ? { field } : {}) } });

  // ---- widget, docs, fonts, audio ----
  // After an update, browsers must get the new widget and the new clips (clips keep their file names when their words
  // change). So the widget and the clips are re-checked on every load (a cheap 304 when nothing changed), and the
  // offline service worker gets a release number made from their content: a new release empties its old cache.
  const fresh = r => r.set('Cache-Control', 'no-cache');
  app.get(['/widget.js', '/db-form.js'], (q, r) => fresh(r.type('application/javascript')).sendFile(path.join(ROOT, 'public/db-form.js')));
  app.get('/db-sw.js', (q, r) => fresh(r.type('application/javascript')).send(fs.readFileSync(path.join(ROOT, 'public/db-sw.js'), 'utf8').replace(/const DB_CACHE = '[^']*';/, `const DB_CACHE = 'db-form-${RELEASE}';`)));
  // The API description names this server's own address, so "Try it out" works wherever it runs.
  app.get('/openapi.yaml', (q, r) => r.type('text/yaml').send(fs.readFileSync(path.join(ROOT, 'openapi.yaml'), 'utf8').replace('url: http://localhost:3000', 'url: ' + BASE)));
  // Interactive API documentation (Swagger UI, Apache-2.0, loaded from a pinned CDN version): a judge can try every call.
  app.get('/docs', (q, r) => r.type('html').send(`<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>
<title>Inclusive Access API</title><link rel='stylesheet' href='https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css'></head>
<body><main id='ui'><h1>Inclusive Access API</h1><p>Loading the interactive documentation. The plain specification is at <a href='/openapi.yaml'>/openapi.yaml</a>.</p></main>
<script src='https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js'></script>
<script>window.SwaggerUIBundle && SwaggerUIBundle({ url: '/openapi.yaml', dom_id: '#ui' });</script></body></html>`));
  app.use(express.static(path.join(ROOT, 'public'), { maxAge: '1h', setHeaders: (r, p) => { if (/[\\/]audio[\\/]/.test(p)) fresh(r); } }));
  // The demo partner site, from this same server, at /site/ (one address for a deployed MVP). Its pages point at
  // http://localhost:3000; that is replaced with this server's own address as they are sent.
  const SITE = path.join(ROOT, 'demo-host');
  app.get('/site', (q, r, next) => (q.path === '/site' ? r.redirect(301, '/site/') : next()));
  app.get(/^\/site\/(.*)$/, (q, r, next) => {
    const rel = q.params[0] || 'index.html', f = path.normalize(path.join(SITE, rel));
    if (!f.startsWith(SITE + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return next();
    if (!/\.(html|js|css)$/.test(f)) return r.sendFile(f);
    const type = f.endsWith('.html') ? 'html' : f.endsWith('.js') ? 'application/javascript' : 'css';
    fresh(r.type(type)).send(fs.readFileSync(f, 'utf8').replaceAll('http://localhost:3000', BASE));
  });
  // The front door: people (and judges) opening the bare address land on the demo site; ?info shows the server summary.
  app.get('/', (q, r, next) => ('info' in q.query || process.env.ROOT_INFO === '1' ? next() : r.redirect(302, '/site/')));
  app.get('/', (q, r) => r.type('text').send(`Inclusive Access plugin server.
Widget: ${BASE}/widget.js   (also /db-form.js)
API: ${BASE}/v1/health, ${BASE}/v1/jobs   OpenAPI: ${BASE}/openapi.yaml
LTI 1.3: ${BASE}/lti/config.json   Demo LMS: ${BASE}/demo/lms   SMS inbox: ${BASE}/demo/sms-inbox
Demo partner site: ${BASE}/site/ (and http://localhost:8080 with docker compose)`));

  // ---- REST API (Level 2) ----
  app.get('/v1/health', (q, r) => r.json({ ok: true, consentVersion: CONSENT_VERSION }));

  const wantsLd = q => q.query.format === 'jsonld' || (q.get('accept') || '').includes('application/ld+json');
  const publicJob = j => ({ id: j.id, title: j.title, titles: j.titles, offers: j.offers, org: j.org, datePosted: j.datePosted, validThrough: j.validThrough });
  app.get('/v1/jobs', (q, r) => {
    if (wantsLd(q)) return r.type('application/ld+json').send(JSON.stringify({ '@context': 'https://schema.org', '@graph': jobs.map(j => jobPosting(j, BASE)) }));
    r.json(jobs.map(publicJob));
  });
  app.get('/v1/jobs/:id', (q, r) => {
    const j = jobs.find(x => String(x.id) === q.params.id);
    if (!j) return fail(r, 404, 'not_found', 'No job with this id.');
    if (wantsLd(q)) return r.type('application/ld+json').send(JSON.stringify({ '@context': 'https://schema.org', ...jobPosting(j, BASE) }));
    r.json(publicJob(j));
  });

  // Consent: required before anything is stored. Scope 'answers' is required; 'support' is a separate, optional choice.
  const readConsent = b => {
    const c = b && b.consent;
    if (!c || c.given !== true || !Array.isArray(c.scope) || !c.scope.includes('answers')) return null;
    return { scope: list(c.scope, ['answers', 'support']), version: str(c.version, 40) || CONSENT_VERSION, lang: LANGS.includes(c.lang) ? c.lang : 'en', partner: str(c.partner, 120) || '' };
  };

  // Each flow keeps only the fields it needs (data minimisation). Unknown fields are dropped.
  const FLOW = {
    // A phone number is stored in one format (+251…), however it was typed or spoken (09…, 07…, 251…).
    signup: { required: 'fullName', pick: b => ({ fullName: str(b.fullName, 120), contact: phoneE164(str(b.contact, 120)), idRoute: ID_ROUTES.includes(b.idRoute) ? b.idRoute : undefined }) },
    job: { required: 'role', pick: b => ({ role: str(b.role, 160), why: str(b.why, 1000) }) },
    employer: { required: 'job', pick: b => ({ job: str(b.job, 160), offers: list(b.offers, OFFERS), closes: date(b.closes), org: str(b.org, 120) }) },
  };

  const save = flow => (req, res) => {
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    const spec = FLOW[flow], data = spec.pick(b);
    if (!data[spec.required]) return fail(res, 422, 'validation_failed', spec.required + ' is required', spec.required);
    if (flow === 'signup' && data.contact && !data.contact.includes('@') && !isPhone(data.contact)) return fail(res, 422, 'validation_failed', 'contact must be a 10-digit phone number starting with 0, or an email address', 'contact');
    const consent = readConsent(b);
    if (!consent) return fail(res, 422, 'consent_required', 'consent.given must be true and consent.scope must include "answers"', 'consent');
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
    const id = randomUUID(), at = new Date().toISOString();
    records.set(id, { flow, data, at });
    // Support needs: stored only with their own consent, in their own store, never returned.
    const support = list(b.support, SUPPORT);
    if (flow === 'signup' && support.length && consent.scope.includes('support')) supportPreferences.set(id, support);
    consents.set(id, { id, flow, ...consent, at, withdrawnAt: null });
    if (flow === 'employer') {
      const today = at.slice(0, 10);
      jobs.push({ id: Math.max(0, ...jobs.map(j => j.id)) + 1, record: id, title: data.job, titles: { en: data.job }, offers: data.offers, org: data.org || 'Employer (name not given)', datePosted: today, validThrough: data.closes });
    }
    if (flow === 'signup' && data.contact && isPhone(data.contact)) {
      const ref = id.slice(0, 8).toUpperCase();
      const text = { en: `Inclusive Access: we received your registration. Reference ${ref}.`, am: `Inclusive Access: ምዝገባዎን ተቀብለናል። መለያ ቁጥር ${ref}።` }[consent.lang] || `Inclusive Access: we received your registration. Reference ${ref}.`;
      smsInbox.unshift({ to: mask(phoneLocal(data.contact)), text, lang: consent.lang, at });
      if (smsInbox.length > 50) smsInbox.length = 50;
    }
    res.status(201).json({ id, receipt: receiptOf(id) });
  };
  app.post('/v1/learners', save('signup'));
  app.post('/v1/applications', save('job'));
  app.post('/v1/employer/jobs', save('employer'));

  // Withdraw consent: deletes the answers and support preferences. The consent log keeps only the withdrawal time.
  app.delete('/v1/records/:id', (q, r) => {
    const id = q.params.id, c = consents.get(id);
    if (!c || !same(q.get('x-receipt'), receiptOf(id))) return fail(r, 404, 'not_found', 'No record with this id and receipt.');
    records.delete(id); supportPreferences.delete(id);
    const k = jobs.findIndex(j => j.record === id); if (k >= 0) jobs.splice(k, 1);
    c.withdrawnAt = new Date().toISOString();
    r.status(204).end();
  });

  // Export: the learner (or the partner acting with their receipt) gets back everything held about this record,
  // including support needs. Without the record's own receipt code it answers 404, exactly as for an unknown id.
  app.get('/v1/records/:id', (q, r) => {
    const id = q.params.id, c = consents.get(id), rec = records.get(id);
    if (!c || !rec || !same(q.get('x-receipt'), receiptOf(id))) return fail(r, 404, 'not_found', 'No record with this id and receipt.');
    r.set('Cache-Control', 'no-store').json({ id, flow: rec.flow, at: rec.at, answers: rec.data, support: supportPreferences.get(id) || [], consent: c });
  });

  // Consent audit log for partners: no names, contacts or answers, only what was agreed, when, and in which language.
  app.get('/v1/consents', (q, r) => {
    if (ADMIN && !same(q.get('authorization'), 'Bearer ' + ADMIN)) return fail(r, 401, 'unauthorised', 'Send Authorization: Bearer <ADMIN_TOKEN>.');
    r.json([...consents.values()]);
  });
  app.get('/v1/consents/:id', (q, r) => {
    const c = consents.get(q.params.id);
    if (!c || !same(q.get('x-receipt'), receiptOf(q.params.id))) return fail(r, 404, 'not_found', 'No consent with this id and receipt.');
    r.json(c);
  });

  // ---- LTI 1.3 (Level 3): OIDC third-party login + resource link launch. Launch only: no grades, no deep linking. ----
  const toolKey = await generateKeyPair('RS256', { extractable: true });
  const toolJwk = { ...(await exportJWK(toolKey.publicKey)), kid: 'tool-1', alg: 'RS256', use: 'sig' };
  const platforms = [];
  if (process.env.LTI_ISSUER) platforms.push({ issuer: process.env.LTI_ISSUER, clientId: process.env.LTI_CLIENT_ID, authUrl: process.env.LTI_AUTH_URL, deploymentId: process.env.LTI_DEPLOYMENT_ID || null, jwks: createRemoteJWKSet(new URL(process.env.LTI_JWKS_URL)) });
  // The built-in demo LMS, so judges can try a real signed launch without an LMS. Turn off with DEMO_LMS=off.
  const demoOn = (opt.demoLms ?? process.env.DEMO_LMS) !== 'off';
  let demo = null;
  if (demoOn) {
    const k = await generateKeyPair('RS256', { extractable: true });
    const jwk = { ...(await exportJWK(k.publicKey)), kid: 'demo-lms-1', alg: 'RS256', use: 'sig' };
    demo = { key: k.privateKey, jwk, issuer: BASE + '/demo/lms', clientId: 'inclusive-access-demo', deploymentId: 'demo-deployment-1', authUrl: BASE + '/demo/lms/auth' };
    platforms.push({ ...demo, jwks: createLocalJWKSet({ keys: [jwk] }) });
  }
  app.locals.demoLms = demo;
  const usedNonces = new Map();
  const signState = o => { const p = Buffer.from(JSON.stringify(o)).toString('base64url'); return p + '.' + hmac('state:' + p); };
  const readState = s => {
    const [p, sig] = String(s || '').split('.');
    if (!p || !same(sig, hmac('state:' + p))) return null;
    const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() ? o : null;
  };

  app.get('/lti/jwks.json', (q, r) => r.json({ keys: [toolJwk] }));
  app.get('/lti/config.json', (q, r) => r.json({
    title: 'Inclusive Access: accessible onboarding and career gateway',
    description: 'One question per screen, six languages (five Ethiopian), voice and keyboard. Launch only.',
    oidc_initiation_url: BASE + '/lti/login', target_link_uri: BASE + '/lti/launch', redirect_uris: [BASE + '/lti/launch'],
    public_jwk_url: BASE + '/lti/jwks.json', scopes: [], claims: ['iss', 'sub', 'locale'],
    messages: [{ type: 'LtiResourceLinkRequest', custom_parameters: { flow: 'signup' } }],
    custom_parameters: { flow: 'signup | job | employer' },
  }));

  const login = (q, r) => {
    const p = { ...q.query, ...(q.body || {}) };
    const pf = platforms.find(x => x.issuer === p.iss && (!p.client_id || x.clientId === p.client_id));
    if (!pf || !p.login_hint) return fail(r, 400, 'lti_unknown_platform', 'Unknown issuer or client_id, or login_hint missing.');
    const nonce = randomBytes(16).toString('base64url');
    const state = signState({ n: nonce, iss: pf.issuer, exp: Date.now() + 5 * 60e3 });
    const u = new URL(pf.authUrl);
    Object.entries({ scope: 'openid', response_type: 'id_token', response_mode: 'form_post', prompt: 'none', client_id: pf.clientId, redirect_uri: BASE + '/lti/launch', login_hint: p.login_hint, state, nonce, ...(p.lti_message_hint ? { lti_message_hint: p.lti_message_hint } : {}) }).forEach(([k, v]) => u.searchParams.set(k, v));
    r.redirect(302, u.toString());
  };
  app.get('/lti/login', login); app.post('/lti/login', login);

  const LTI = 'https://purl.imsglobal.org/spec/lti/claim/';
  app.post('/lti/launch', async (q, r) => {
    const bad = (code, msg) => r.status(401).type('html').send(page('Launch failed', `<h1>Launch failed</h1><p role='alert'>${esc(msg)}</p><p>Code: <code>${esc(code)}</code></p>`));
    const st = readState(q.body && q.body.state);
    if (!st) return bad('lti_bad_state', 'The launch expired or was changed. Please launch again from your course.');
    const pf = platforms.find(x => x.issuer === st.iss);
    let c;
    try { c = (await jwtVerify(String(q.body.id_token || ''), pf.jwks, { issuer: pf.issuer, audience: pf.clientId, algorithms: ['RS256'] })).payload; }
    catch (e) { return bad('lti_bad_token', 'The launch token could not be verified.'); }
    if (c.nonce !== st.n || usedNonces.has(c.nonce)) return bad('lti_bad_nonce', 'This launch was already used. Please launch again.');
    usedNonces.set(c.nonce, Date.now() + 10 * 60e3);
    for (const [k, t] of usedNonces) if (t < Date.now()) usedNonces.delete(k);
    if (c[LTI + 'message_type'] !== 'LtiResourceLinkRequest' || c[LTI + 'version'] !== '1.3.0') return bad('lti_bad_message', 'Only resource link launches (LTI 1.3.0) are supported.');
    if (pf.deploymentId && c[LTI + 'deployment_id'] !== pf.deploymentId) return bad('lti_bad_deployment', 'Unknown deployment.');
    // Data minimisation: the learner's name and email from the LMS are not used or stored.
    const custom = c[LTI + 'custom'] || {}, flow = ['signup', 'job', 'employer'].includes(custom.flow) ? custom.flow : 'signup';
    const loc = String((c[LTI + 'launch_presentation'] || {}).locale || c.locale || '').slice(0, 2).toLowerCase();
    const lang = LANGS.includes(loc) ? loc : 'en';
    const tag = flow === 'job' ? 'db-career-gateway' : 'db-onboarding';
    const ctx = (c[LTI + 'context'] || {}).title;
    r.type('html').send(page('Inclusive Access', `<main><h1 class='sr'>Inclusive Access${ctx ? ' · ' + esc(ctx) : ''}</h1>
<${tag} flow='${flow}' lang='${lang}' ${LANGS.includes(loc) ? "lang-ask='no'" : ''} partner='${esc(ctx || 'your course')}' api='${BASE}/v1' audio='${BASE}/audio'></${tag}></main>
<script src='${BASE}/widget.js'></script>`, lang));
  });

  // ---- Demo only: a tiny LMS that signs real LTI 1.3 launches, and a simulated SMS inbox (no SMS gateway, no cost). ----
  if (demo) {
    app.get('/demo/lms', (q, r) => {
      const go = (flow, lang, label) => `<form method='post' action='${BASE}/lti/login'><input type='hidden' name='iss' value='${demo.issuer}'><input type='hidden' name='client_id' value='${demo.clientId}'><input type='hidden' name='login_hint' value='${flow}|${lang}'><input type='hidden' name='target_link_uri' value='${BASE}/lti/launch'><button>${label}</button></form>`;
      r.type('html').send(page('Demo LMS', `<main><h1>Demo LMS: Digital Skills 101</h1>
<p>This page plays the part of a learning platform such as Savanna. Each button starts a real, signed LTI 1.3 launch of the plugin.</p>
<h2>Launch the plugin</h2><div class='row'>${go('signup', 'en', 'Join the programme (English)')}${go('signup', 'am', 'Join the programme (አማርኛ)')}${go('job', 'en', 'Apply for a job')}${go('employer', 'en', 'Post a job (employer)')}</div>
<h2>Register this tool in a real LMS</h2><p>Tool configuration: <a href='${BASE}/lti/config.json'>${BASE}/lti/config.json</a>. Login URL <code>${BASE}/lti/login</code>, launch and redirect URL <code>${BASE}/lti/launch</code>, public keys <code>${BASE}/lti/jwks.json</code>.</p></main>`));
    });
    app.get('/demo/lms/auth', async (q, r) => {
      const p = q.query;
      if (p.client_id !== demo.clientId || p.redirect_uri !== BASE + '/lti/launch' || p.response_type !== 'id_token' || !p.nonce) return fail(r, 400, 'invalid_request', 'Bad authentication request.');
      const [flow, lang] = String(p.login_hint).split('|');
      const now = Math.floor(Date.now() / 1000);
      const tok = await new SignJWT({
        nonce: p.nonce, [LTI + 'message_type']: 'LtiResourceLinkRequest', [LTI + 'version']: '1.3.0', [LTI + 'deployment_id']: demo.deploymentId,
        [LTI + 'target_link_uri']: BASE + '/lti/launch', [LTI + 'resource_link']: { id: 'onboarding-1', title: 'Inclusive Access' },
        [LTI + 'roles']: [flow === 'employer' ? 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor' : 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
        [LTI + 'context']: { id: 'course-101', title: 'Digital Skills 101' }, [LTI + 'launch_presentation']: { locale: lang || 'en', document_target: 'iframe' },
        [LTI + 'custom']: { flow: flow || 'signup' },
      }).setProtectedHeader({ alg: 'RS256', kid: demo.jwk.kid }).setIssuer(demo.issuer).setAudience(demo.clientId).setSubject('demo-learner-1').setIssuedAt(now).setExpirationTime(now + 300).sign(demo.key);
      r.type('html').send(page('Signing you in', `<main><h1>Signing you in</h1><form id='f' method='post' action='${esc(p.redirect_uri)}'><input type='hidden' name='id_token' value='${tok}'><input type='hidden' name='state' value='${esc(p.state)}'><button>Continue to Inclusive Access</button></form></main><script>document.getElementById('f').submit()</script>`));
    });
    app.get('/demo/sms-inbox', (q, r) => r.type('html').send(page('Simulated SMS inbox', `<main><h1>Simulated SMS inbox</h1>
<p>Messages the server would send by SMS. No SMS gateway is used, so there is no cost and nothing leaves this computer. Numbers are masked.</p>
${smsInbox.length ? `<table><caption>Latest messages, newest first</caption><thead><tr><th scope='col'>To</th><th scope='col'>Message</th><th scope='col'>Time (UTC)</th></tr></thead><tbody>${smsInbox.map(m => `<tr><td>${esc(m.to)}</td><td lang='${m.lang}'>${esc(m.text)}</td><td>${esc(m.at.slice(0, 19).replace('T', ' '))}</td></tr>`).join('')}</tbody></table>` : `<p class='empty'>No messages yet. Register with a phone number on the demo site, then reload this page.</p>`}</main>`)));
  }
  return app;
}

// Minimal accessible page shell for the LTI and demo pages, using the plugin's local fonts.
function page(title, body, lang = 'en') {
  return `<!doctype html><html lang='${lang}'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>${esc(title)}</title>
<style>@font-face{font-family:'Atkinson Hyperlegible';src:url(/fonts/atkinson-hyperlegible-latin-400-normal.woff2) format('woff2');font-display:swap}
@font-face{font-family:'Noto Sans Ethiopic';src:url(/fonts/noto-sans-ethiopic-ethiopic-400-normal.woff2) format('woff2');unicode-range:U+1200-1399,U+2D80-2DDE,U+AB01-AB2E;font-display:swap}
body{margin:0;font:1.0625rem/1.6 'Atkinson Hyperlegible','Noto Sans Ethiopic',system-ui,sans-serif;color:#1b1d1a;background:#f6f4ef}
main{max-width:46rem;margin:0 auto;padding:24px}h1{font-size:1.75rem;line-height:1.2;margin:0 0 12px}h2{font-size:1.25rem;margin:32px 0 8px}
.row{display:flex;flex-wrap:wrap;gap:8px}button{font:inherit;min-height:48px;padding:.5rem 1rem;border:2px solid #1d5c3f;border-radius:4px;background:#1d5c3f;color:#fff;font-weight:700;cursor:pointer}
button:hover{background:#164a32}:focus-visible{outline:3px solid #1d5c3f;outline-offset:2px;box-shadow:0 0 0 2px #fff}a{color:#1d5c3f}
table{border-collapse:collapse;width:100%;background:#fff}caption{text-align:left;font-weight:700;padding:8px 0}th,td{border:1px solid #d6d1c4;padding:8px;text-align:left;vertical-align:top}
.empty{padding:16px;border:1px dashed #6b6f66;border-radius:4px}code{font-family:ui-monospace,Consolas,monospace;font-size:.9em}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}</style></head><body>${body}</body></html>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = +process.env.PORT || 3000;
  createApp().then(app => app.listen(port, () => console.log(`Plugin server on http://localhost:${port}. Demo LMS: http://localhost:${port}/demo/lms. Demo host site: http://localhost:8080`)));
}
