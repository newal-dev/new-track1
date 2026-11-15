// API tests: the server runs in this process on a free port, so no server needs to be started by hand.
import test, { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, jobPosting, CONSENT_VERSION } from '../server.js';

let srv, U, app;
const consent = (scope = ['answers']) => ({ given: true, scope, version: CONSENT_VERSION, lang: 'en' });
const post = (p, body, h = {}) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...h }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const learner = (extra = {}) => post('/v1/learners', { fullName: 'Test Person', contact: '0911000000', consent: consent(), ...extra });
const allGets = async () => {
  const urls = ['/v1/health', '/v1/jobs', '/v1/jobs?format=jsonld', '/v1/jobs/1', '/v1/consents', '/demo/sms-inbox', '/lti/config.json', '/lti/jwks.json'];
  return (await Promise.all(urls.map(u => fetch(U + u).then(r => r.text())))).join('\n');
};

before(async () => {
  app = await createApp({ publicUrl: 'http://127.0.0.1:0', secret: 'test-secret', adminToken: '' });
  await new Promise(r => { srv = app.listen(0, '127.0.0.1', r); });
  U = 'http://127.0.0.1:' + srv.address().port;
  // The LTI and demo URLs are built from the public URL: point them at the real port.
  const fresh = await createApp({ publicUrl: U, secret: 'test-secret', adminToken: '' });
  srv.close(); app = fresh;
  await new Promise(r => { srv = app.listen(+U.split(':').pop(), '127.0.0.1', r); });
});
after(() => srv && srv.close());

describe('health and widget', () => {
  test('health works and reports the consent version', async () => {
    const r = await fetch(U + '/v1/health'); assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true, consentVersion: CONSENT_VERSION });
  });
  test('widget.js is served as JavaScript and is under 250 kB', async () => {
    const r = await fetch(U + '/widget.js'); assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /javascript/);
    assert.ok((await r.arrayBuffer()).byteLength < 250 * 1024);
  });
  test('after an update browsers get the new widget and clips: re-checked each load, offline cache named after the release', async () => {
    for (const u of ['/widget.js', '/db-form.js', '/db-sw.js', '/audio/am/langSelf.mp3']) assert.equal((await fetch(U + u)).headers.get('cache-control'), 'no-cache', u);
    const sw = await (await fetch(U + '/db-sw.js')).text();
    assert.match(sw, /const DB_CACHE = 'db-form-[0-9a-f]{12}';/);
    assert.doesNotMatch(sw, /db-form-v\d/);
    assert.match(sw, /cache: 'no-cache'/);
  });
  test('the demo partner site is served at /site/ with the server address filled in, and the bare address opens it', async () => {
    const r = await fetch(U + '/', { redirect: 'manual' }); assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/site/');
    const html = await (await fetch(U + '/site/')).text();
    assert.ok(html.includes(U + '/widget.js') && !html.includes('localhost:3000'));
    assert.ok((await (await fetch(U + '/site/db-sw.js')).text()).includes(U + '/db-sw.js'));
    assert.equal((await fetch(U + '/site/savanna.html')).status, 200);
    assert.equal((await fetch(U + '/site/../server.js')).status, 404);
    assert.match(await (await fetch(U + '/?info')).text(), /Inclusive Access plugin server/);
  });
  test('interactive API docs at /docs, and the specification names this server', async () => {
    assert.match(await (await fetch(U + '/docs')).text(), /SwaggerUIBundle\(\{ url: '\/openapi.yaml'/);
    assert.match(await (await fetch(U + '/openapi.yaml')).text(), new RegExp('url: ' + U));
  });
  test('db-form.js is still served (old install snippet)', async () => { assert.equal((await fetch(U + '/db-form.js')).status, 200); });
  test('OpenAPI spec is served', async () => { const t = await (await fetch(U + '/openapi.yaml')).text(); assert.match(t, /openapi: 3/); });
  test('service worker and local fonts are served', async () => {
    assert.equal((await fetch(U + '/db-sw.js')).status, 200);
    assert.equal((await fetch(U + '/fonts/noto-sans-ethiopic-ethiopic-400-normal.woff2')).status, 200);
  });
  test('audio clips are served for Amharic', async () => { assert.equal((await fetch(U + '/audio/am/welcome.mp3')).status, 200); });
  test('CORS allows partner sites by default', async () => {
    const r = await fetch(U + '/v1/jobs', { headers: { Origin: 'https://partner.example' } });
    assert.equal(r.headers.get('access-control-allow-origin'), 'https://partner.example');
  });
  test('the server does not advertise its framework', async () => { assert.equal((await fetch(U + '/v1/health')).headers.get('x-powered-by'), null); });
});

describe('jobs and schema.org/JobPosting', () => {
  test('jobs list has accommodations and titles in every language', async () => {
    const j = await (await fetch(U + '/v1/jobs')).json();
    assert.ok(j.length >= 2 && Array.isArray(j[0].offers));
    assert.deepEqual(Object.keys(j[0].titles).sort(), ['am', 'en', 'om', 'sid', 'so', 'ti']);
  });
  test('one job by id', async () => { assert.equal((await (await fetch(U + '/v1/jobs/1')).json()).id, 1); });
  test('unknown job is 404 with an error code', async () => {
    const r = await fetch(U + '/v1/jobs/999'); assert.equal(r.status, 404); assert.equal((await r.json()).error.code, 'not_found');
  });
  test('jobs as JSON-LD with ?format=jsonld', async () => {
    const r = await fetch(U + '/v1/jobs?format=jsonld');
    assert.match(r.headers.get('content-type'), /application\/ld\+json/);
    const d = await r.json(); assert.equal(d['@context'], 'https://schema.org'); assert.equal(d['@graph'][0]['@type'], 'JobPosting');
  });
  test('JSON-LD by Accept header', async () => {
    const d = await (await fetch(U + '/v1/jobs/1', { headers: { Accept: 'application/ld+json' } })).json();
    assert.equal(d['@type'], 'JobPosting'); assert.equal(d['@context'], 'https://schema.org');
  });
  test('JobPosting has the fields search engines need', () => {
    const p = jobPosting({ id: 7, title: 'Clerk', offers: ['remote', 'stepfree'], org: 'Org', datePosted: '2026-11-15', validThrough: '2026-12-01' }, 'https://h');
    for (const k of ['title', 'description', 'datePosted', 'validThrough', 'hiringOrganization', 'jobLocation', 'identifier']) assert.ok(p[k], k);
    assert.equal(p.jobLocation.address.addressCountry, 'ET');
    assert.equal(p.jobLocationType, 'TELECOMMUTE');
    assert.match(p.jobBenefits, /Step-free workplace/);
  });
  test('JobPosting without remote work is not marked TELECOMMUTE', () => {
    assert.equal(jobPosting({ id: 1, title: 'X', offers: ['hours'], datePosted: '2026-11-15' }, 'h').jobLocationType, undefined);
  });
  test('employer job appears in the list and in JSON-LD with its closing date', async () => {
    const r = await post('/v1/employer/jobs', { job: 'Receptionist', offers: ['interp', 'nonsense'], closes: '2027-01-08', org: 'Hotel', consent: consent() });
    assert.equal(r.status, 201);
    const j = (await (await fetch(U + '/v1/jobs')).json()).find(x => x.title === 'Receptionist');
    assert.deepEqual(j.offers, ['interp']);
    const ld = (await (await fetch(U + '/v1/jobs/' + j.id + '?format=jsonld')).json());
    assert.equal(ld.validThrough, '2027-01-08');
  });
});

describe('validation and data minimisation', () => {
  test('empty registration is rejected', async () => { const r = await post('/v1/learners', {}); assert.equal(r.status, 422); assert.equal((await r.json()).error.field, 'fullName'); });
  test('application needs a role', async () => { assert.equal((await post('/v1/applications', { consent: consent() })).status, 422); });
  test('job post needs a title', async () => { assert.equal((await post('/v1/employer/jobs', { offers: ['remote'], consent: consent() })).status, 422); });
  test('a bad phone number is rejected', async () => { const r = await learner({ contact: '12345' }); assert.equal(r.status, 422); assert.equal((await r.json()).error.field, 'contact'); });
  test('an email address is accepted', async () => { assert.equal((await learner({ contact: 'a@b.et' })).status, 201); });
  test('a 251 phone number is accepted', async () => { assert.equal((await learner({ contact: '+251 911 000 000' })).status, 201); });
  test('broken JSON gets a clear error', async () => { const r = await post('/v1/learners', '{bad'); assert.equal(r.status, 400); assert.equal((await r.json()).error.code, 'bad_json'); });
  test('bodies over 10 kB are refused', async () => { const r = await learner({ why: 'x'.repeat(12000) }); assert.equal(r.status, 413); });
  test('valid registration returns only an id and a receipt', async () => {
    const r = await learner({ support: ['large'] }); assert.equal(r.status, 201);
    assert.deepEqual(Object.keys(await r.json()).sort(), ['id', 'receipt']);
  });
  test('unknown fields are not stored', async () => {
    const { id } = await (await learner({ nationalId: '123', disability: 'x' })).json();
    const rec = app.locals.stores.records.get(id);
    assert.deepEqual(Object.keys(rec.data).sort(), ['contact', 'fullName']);
  });
  test('only known ID routes are stored', async () => {
    const { id } = await (await learner({ idRoute: 'passport-number-12345' })).json();
    assert.equal(app.locals.stores.records.get(id).data.idRoute, undefined);
  });
  test('application never stores work needs', async () => {
    const { id } = await (await post('/v1/applications', { role: 'Clerk', needs: ['reader'], consent: consent() })).json();
    assert.deepEqual(Object.keys(app.locals.stores.records.get(id).data), ['role']);
  });
});

describe('consent', () => {
  test('nothing is stored without consent', async () => {
    const before = app.locals.stores.records.size;
    const r = await post('/v1/learners', { fullName: 'No Consent' });
    assert.equal(r.status, 422); assert.equal((await r.json()).error.code, 'consent_required');
    assert.equal(app.locals.stores.records.size, before);
  });
  test('consent.given must be exactly true', async () => { assert.equal((await learner({ consent: { given: 'yes', scope: ['answers'] } })).status, 422); });
  test('consent scope must include answers', async () => { assert.equal((await learner({ consent: { given: true, scope: ['support'] } })).status, 422); });
  test('support needs are dropped without their own consent', async () => {
    const { id } = await (await learner({ support: ['sign'] })).json();
    assert.equal(app.locals.stores.supportPreferences.has(id), false);
  });
  test('support needs are kept, separately, with their own consent', async () => {
    const { id } = await (await learner({ support: ['sign', 'not-an-option'], consent: consent(['answers', 'support']) })).json();
    assert.deepEqual(app.locals.stores.supportPreferences.get(id), ['sign']);
    assert.equal('support' in app.locals.stores.records.get(id).data, false);
  });
  test('the consent log records what was agreed, with no personal data', async () => {
    const { id, receipt } = await (await learner({ consent: consent(['answers', 'support']) })).json();
    const c = await (await fetch(U + '/v1/consents/' + id, { headers: { 'X-Receipt': receipt } })).json();
    assert.deepEqual(c.scope, ['answers', 'support']); assert.equal(c.version, CONSENT_VERSION);
    assert.ok(!JSON.stringify(c).includes('Test Person') && !JSON.stringify(c).includes('0911'));
  });
  test('a consent record needs its receipt', async () => {
    const { id } = await (await learner()).json();
    assert.equal((await fetch(U + '/v1/consents/' + id)).status, 404);
  });
  test('the audit log can be protected with ADMIN_TOKEN', async () => {
    const a = await createApp({ adminToken: 'tok', secret: 's', demoLms: 'off' });
    const s = await new Promise(r => { const x = a.listen(0, '127.0.0.1', () => r(x)); });
    const base = 'http://127.0.0.1:' + s.address().port;
    assert.equal((await fetch(base + '/v1/consents')).status, 401);
    assert.equal((await fetch(base + '/v1/consents', { headers: { Authorization: 'Bearer tok' } })).status, 200);
    s.close();
  });
  test('withdrawing consent deletes the answers and support needs', async () => {
    const { id, receipt } = await (await learner({ support: ['voice'], consent: consent(['answers', 'support']) })).json();
    assert.equal((await fetch(U + '/v1/records/' + id, { method: 'DELETE', headers: { 'X-Receipt': receipt } })).status, 204);
    assert.equal(app.locals.stores.records.has(id), false);
    assert.equal(app.locals.stores.supportPreferences.has(id), false);
    assert.ok(app.locals.stores.consents.get(id).withdrawnAt);
  });
  test('delete with a wrong receipt does nothing', async () => {
    const { id } = await (await learner()).json();
    assert.equal((await fetch(U + '/v1/records/' + id, { method: 'DELETE', headers: { 'X-Receipt': 'wrong' } })).status, 404);
    assert.equal(app.locals.stores.records.has(id), true);
  });
  test('withdrawing an employer post removes the job', async () => {
    const { id, receipt } = await (await post('/v1/employer/jobs', { job: 'Temporary post', consent: consent() })).json();
    await fetch(U + '/v1/records/' + id, { method: 'DELETE', headers: { 'X-Receipt': receipt } });
    assert.ok(!(await (await fetch(U + '/v1/jobs')).json()).some(j => j.title === 'Temporary post'));
  });
});

describe('learner data rights', () => {
  test('a learner can export everything held about them, with their receipt; without it the record does not exist', async () => {
    const { id, receipt } = await (await learner({ fullName: 'Export Me', contact: '0911 22 33 44', support: ['captions', 'time', 'interp', 'prefer'], consent: consent(['answers', 'support']) })).json();
    const r = await fetch(U + '/v1/records/' + id, { headers: { 'x-receipt': receipt } }); assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.answers.fullName, 'Export Me');
    assert.equal(j.answers.contact, '+251911223344'); // one stored format
    assert.deepEqual(j.support, ['captions', 'time', 'interp']); // "prefer not to say" is never stored
    assert.deepEqual(j.consent.scope, ['answers', 'support']);
    assert.equal((await fetch(U + '/v1/records/' + id)).status, 404);
    assert.equal((await fetch(U + '/v1/records/' + id, { headers: { 'x-receipt': 'wrong' } })).status, 404);
    assert.equal((await fetch(U + '/v1/records/' + id, { method: 'DELETE', headers: { 'x-receipt': receipt } })).status, 204);
    assert.equal((await fetch(U + '/v1/records/' + id, { headers: { 'x-receipt': receipt } })).status, 404);
  });
});

describe('privacy isolation', () => {
  test('no GET route ever returns support needs or learner answers', async () => {
    await learner({ fullName: 'Secret Name', support: ['screenreader'], consent: consent(['answers', 'support']) });
    const all = await allGets();
    assert.ok(!all.includes('screenreader'), 'support need leaked');
    assert.ok(!all.includes('Secret Name'), 'name leaked');
  });
  test('the SMS inbox masks phone numbers and holds no names', async () => {
    await learner({ fullName: 'Masked Person', contact: '0912345678' });
    const t = await (await fetch(U + '/demo/sms-inbox')).text();
    assert.ok(!t.includes('0912345678') && !t.includes('Masked Person'));
    assert.match(t, /09•+78/);
  });
  test('an email contact gets no SMS', async () => {
    const n = app.locals.stores.smsInbox.length; await learner({ contact: 'x@y.et' });
    assert.equal(app.locals.stores.smsInbox.length, n);
  });
});

describe('LTI 1.3', () => {
  const demoLogin = async (hint = 'signup|am') => {
    const d = app.locals.demoLms;
    const r = await fetch(U + '/lti/login?' + new URLSearchParams({ iss: d.issuer, client_id: d.clientId, login_hint: hint, target_link_uri: U + '/lti/launch' }), { redirect: 'manual' });
    return { r, d };
  };
  const fullLaunch = async (mutate) => {
    const { r } = await demoLogin();
    const auth = await (await fetch(r.headers.get('location'))).text();
    let id_token = /name='id_token' value='([^']+)'/.exec(auth)[1], state = /name='state' value='([^']+)'/.exec(auth)[1];
    if (mutate) ({ id_token, state } = mutate({ id_token, state }));
    const body = new URLSearchParams({ id_token, state });
    return { res: await fetch(U + '/lti/launch', { method: 'POST', body }), body };
  };
  test('tool configuration lists the login, launch and key URLs', async () => {
    const c = await (await fetch(U + '/lti/config.json')).json();
    assert.equal(c.oidc_initiation_url, U + '/lti/login'); assert.equal(c.target_link_uri, U + '/lti/launch'); assert.ok(c.public_jwk_url);
  });
  test('the tool publishes an RS256 public key', async () => {
    const k = (await (await fetch(U + '/lti/jwks.json')).json()).keys[0];
    assert.equal(k.alg, 'RS256'); assert.equal(k.kty, 'RSA'); assert.equal(k.d, undefined);
  });
  test('login redirects to the platform with the OIDC parameters', async () => {
    const { r, d } = await demoLogin();
    assert.equal(r.status, 302);
    const u = new URL(r.headers.get('location'));
    assert.equal(u.origin + u.pathname, d.authUrl);
    for (const [k, v] of Object.entries({ scope: 'openid', response_type: 'id_token', response_mode: 'form_post', prompt: 'none', client_id: d.clientId, redirect_uri: U + '/lti/launch' })) assert.equal(u.searchParams.get(k), v, k);
    assert.ok(u.searchParams.get('state') && u.searchParams.get('nonce'));
  });
  test('login from an unknown platform is refused', async () => {
    const r = await fetch(U + '/lti/login?iss=https://evil.example&login_hint=x', { redirect: 'manual' });
    assert.equal(r.status, 400);
  });
  test('a signed launch opens the plug-in in the launch language, without the LMS name or email', async () => {
    const { res } = await fullLaunch();
    assert.equal(res.status, 200);
    const t = await res.text();
    assert.match(t, /<db-onboarding flow='signup' lang='am' lang-ask='no'/);
    assert.match(t, /widget\.js/);
  });
  test('a launch cannot be replayed (nonce used once)', async () => {
    const { body } = await fullLaunch();
    const again = await fetch(U + '/lti/launch', { method: 'POST', body });
    assert.equal(again.status, 401); assert.match(await again.text(), /lti_bad_nonce/);
  });
  test('a token with a broken signature is refused', async () => {
    const { res } = await fullLaunch(x => ({ ...x, id_token: x.id_token.slice(0, -4) + 'AAAA' }));
    assert.equal(res.status, 401); assert.match(await res.text(), /lti_bad_token/);
  });
  test('a changed state is refused', async () => {
    const { res } = await fullLaunch(x => ({ ...x, state: x.state.replace(/.$/, c => (c === 'A' ? 'B' : 'A')) }));
    assert.equal(res.status, 401); assert.match(await res.text(), /lti_bad_state/);
  });
  test('the job flow opens the career gateway tag', async () => {
    const { r } = await demoLogin('job|en');
    const auth = await (await fetch(r.headers.get('location'))).text();
    const id_token = /name='id_token' value='([^']+)'/.exec(auth)[1], state = /name='state' value='([^']+)'/.exec(auth)[1];
    const t = await (await fetch(U + '/lti/launch', { method: 'POST', body: new URLSearchParams({ id_token, state }) })).text();
    assert.match(t, /<db-career-gateway flow='job' lang='en'/);
  });
  test('the demo LMS page has one launch button per flow', async () => {
    const t = await (await fetch(U + '/demo/lms')).text();
    assert.equal((t.match(/<button>/g) || []).length, 4);
  });
});
