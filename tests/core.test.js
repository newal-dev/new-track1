// Unit tests for the widget's core logic (no browser): Ethiopian calendar, consent, drafts, offline queue, ASR router, size.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = new URL('../public/db-form.js', import.meta.url);
let src = fs.readFileSync(file, 'utf8');
src = src.replace("customElements.define('db-form', DbForm);", 'globalThis.__D = DbForm; globalThis.__F = FLOWS; globalThis.__UI = UI;');
const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
globalThis.HTMLElement = class { attachShadow() { return {}; } };
globalThis.window = globalThis; globalThis.customElements = { get: () => null, define() {} };
globalThis.SpeechRecognition = function () { this.start = () => {}; };
(0, eval)(src.replace(/^const /gm, 'var ').replace(/^class DbForm/m, 'var DbForm = class DbForm'));
const D = globalThis.__D, F = globalThis.__F, UI = globalThis.__UI, C = D.calendar;
const make = (over = {}) => Object.assign(Object.create(D.prototype), { f: F.signup, l: 'en', a: {}, i: 0, hide: [], consent: { a: false, s: false }, attrs: {}, getAttribute(k) { return this.attrs[k] ?? null; } }, over);
const iso = d => d.toISOString().slice(0, 10);

test('Ethiopian new year: 1 Meskerem 2017 is 11 September 2024', () => {
  assert.deepEqual(C.toEC(new Date('2024-09-11')), { y: 2017, m: 1, d: 1 });
  assert.equal(iso(C.fromEC(2017, 1, 1)), '2024-09-11');
});
test('after a leap year the new year moves to 12 September', () => {
  assert.deepEqual(C.toEC(new Date('2023-09-12')), { y: 2016, m: 1, d: 1 });
});
test('Pagume has 6 days in a leap year and 5 otherwise', () => {
  assert.equal(C.ecDays(2015, 13), 6); assert.equal(C.ecDays(2016, 13), 5); assert.equal(C.ecDays(2016, 4), 30);
  assert.deepEqual(C.toEC(new Date('2023-09-11')), { y: 2015, m: 13, d: 6 });
});
test('Ethiopian Christmas (Genna) 7 January 2027 is 29 Tahsas 2019', () => {
  assert.deepEqual(C.toEC(new Date('2027-01-07')), { y: 2019, m: 4, d: 29 });
});
test('the calendar converts both ways for every day of four years', () => {
  for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2028, 0, 1); t += 864e5) {
    const e = C.toEC(new Date(t)); assert.equal(C.fromEC(e.y, e.m, e.d).getTime(), t);
    assert.ok(e.d >= 1 && e.d <= C.ecDays(e.y, e.m));
  }
});
test('13 month names in every language', () => {
  for (const l of ['en', 'am', 'om', 'ti', 'so', 'sid']) assert.equal(C.months[l].length, 13, l);
  assert.equal(C.ecText({ y: 2019, m: 3, d: 6 }, 'am'), '6 ኅዳር 2019');
});
test('employer closing date: day "Not sure" becomes the last day of that month, shown as approximate', () => {
  const d = make({ f: F.employer, a: { closes: { y: 2019, m: 13, d: 0 } } });
  const s = F.employer.steps.find(x => x.id === 'closes');
  assert.equal(d.show(s), 'about 6 Pagume 2019');
  d.consent.a = true;
  assert.equal(d.payload().closes, iso(C.fromEC(2019, 13, 6)));
});
test('a skipped closing date is not sent', () => {
  const d = make({ f: F.employer, a: { job: 'Clerk', offers: [], closes: '' }, consent: { a: true, s: false } });
  assert.equal('closes' in d.payload(), false);
});
test('consent: support choices are only sent with the second tick', () => {
  const d = make({ a: { fullName: 'A', support: ['sign'] }, consent: { a: true, s: false } });
  let p = d.payload(); assert.equal('support' in p, false); assert.deepEqual(p.consent.scope, ['answers']);
  d.consent.s = true; p = d.payload(); assert.deepEqual(p.support, ['sign']); assert.deepEqual(p.consent.scope, ['answers', 'support']);
  assert.equal(p.consent.given, true); assert.equal(p.consent.lang, 'en');
});
test('local questions (prefs, needs) are never sent', () => {
  const d = make({ f: F.job, a: { needs: ['reader'], role: 'Clerk', why: 'x' }, consent: { a: true, s: false } });
  assert.deepEqual(Object.keys(d.payload()).sort(), ['consent', 'role', 'why']);
});
test('send without consent shows an error and sends nothing', async () => {
  let sent = false; globalThis.fetch = () => { sent = true; };
  const d = make({ draw() {}, r: { querySelector: () => null } });
  await d.send();
  assert.equal(sent, false); assert.equal(d.errKey, 'consentNeed'); assert.equal(d.err, UI.consentNeed.en);
});
test('offline: the answers are queued on the device, then sent when online', async () => {
  mem.clear();
  globalThis.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
  const events = [];
  const d = make({ attrs: { api: 'http://x/v1', flow: 'signup' }, a: { fullName: 'A' }, consent: { a: true, s: false }, draw() {}, say() {}, r: { querySelector: () => null }, dispatchEvent: e => events.push(e.type) });
  await d.send();
  assert.equal(d.queued, true); assert.equal(d.done, true); assert.ok(events.includes('db-queued'));
  assert.equal(JSON.parse(mem.get('db-form-queue')).length, 1);
  globalThis.fetch = async () => ({ ok: true, status: 201 });
  await D.flushQueue(make({ say() {}, dispatchEvent: e => events.push(e.type) }));
  assert.equal(mem.has('db-form-queue'), false); assert.ok(events.includes('db-sent'));
});
test('a server error is shown, not queued', async () => {
  mem.clear(); globalThis.fetch = async () => ({ ok: false, status: 500 });
  const d = make({ attrs: { api: 'http://x/v1' }, a: { fullName: 'A' }, consent: { a: true, s: false }, draw() {}, r: { querySelector: () => null }, dispatchEvent() {} });
  await d.send();
  assert.equal(d.errKey, 'fail'); assert.equal(mem.has('db-form-queue'), false);
});
test('success returns the receipt and clears the draft', async () => {
  mem.clear(); mem.set('db-form-draft:signup', '{}');
  globalThis.fetch = async () => ({ ok: true, status: 201, json: async () => ({ id: 'abc', receipt: 'R123' }) });
  const d = make({ attrs: { api: 'http://x/v1', flow: 'signup' }, a: { fullName: 'A' }, consent: { a: true, s: false }, draw() {}, r: { querySelector: () => null }, dispatchEvent() {} });
  await d.send();
  assert.equal(d.receipt, 'R123'); assert.equal(mem.has('db-form-draft:signup'), false);
});
test('drafts are saved per flow and restored', () => {
  mem.clear();
  const d = make({ attrs: { flow: 'job' }, a: { why: 'x' }, i: 2, l: 'am' });
  d.saveDraft();
  const saved = JSON.parse(mem.get('db-form-draft:job'));
  assert.deepEqual(saved.a, { why: 'x' }); assert.equal(saved.i, 2); assert.equal(saved.l, 'am');
  const e = make({ attrs: { flow: 'job' }, draft: saved, welcome: true, stopRA() {}, draw() {} });
  e.resume();
  assert.deepEqual(e.a, { why: 'x' }); assert.equal(e.i, 2); assert.equal(e.welcome, false);
});
test('nothing is saved on the welcome page or after sending', () => {
  mem.clear();
  make({ welcome: true, a: { fullName: 'A' } }).saveDraft();
  make({ done: true, a: { fullName: 'A' } }).saveDraft();
  assert.equal(mem.size, 0);
});
test('the welcome page offers to continue a draft', () => {
  const d = make({ welcome: true, ra: 2, draft: { a: {} }, rm: false });
  const h = d.welcomeHTML();
  assert.match(h, /data-resume/); assert.match(h, /data-fresh/); assert.match(h, new RegExp(UI.draftH.en));
});
test('ASR router: asr="off" turns voice input off; a registered recogniser is used', () => {
  assert.equal(make({ attrs: { asr: 'off' } }).canHear(), false);
  assert.equal(make({ attrs: { asr: 'off' } }).recog('am-ET'), null);
  let got = null; D.registerASR('local', lang => { got = lang; return { start() {}, abort() {} }; });
  const d = make({ attrs: { asr: 'local' } });
  assert.equal(d.canHear(), true); d.recog('ti-ET'); assert.equal(got, 'ti-ET');
});
test('ASR router: the browser recogniser gets the language and no interim results', () => {
  const r = make().recog('so-SO'); assert.equal(r.lang, 'so-SO'); assert.equal(r.interimResults, false);
});
test('private job filter: no match says so and shows every job', () => {
  const d = make({ f: F.job, jobs: [{ title: 'A', offers: ['remote'] }, { title: 'B', offers: ['hours'] }], a: { needs: ['interp'] } });
  const s = d.dyn(F.job.steps.find(x => x.dyn));
  assert.equal(s.options.length, 2); assert.equal(s.hint.en, UI.noMatch.en);
});
test('private job filter: only matching jobs, titles in the chosen language', () => {
  const d = make({ f: F.job, l: 'om', jobs: [{ title: 'A', titles: { en: 'A', om: 'A-om' }, offers: ['remote'] }, { title: 'B', offers: ['hours'] }], a: { needs: ['remote'] } });
  const s = d.dyn(F.job.steps.find(x => x.dyn));
  assert.equal(s.options.length, 1); assert.equal(s.options[0][1].om, 'A-om');
});
test('consent box is on the review page, with the partner name; support box only when support was chosen', () => {
  const d = make({ attrs: { partner: 'Hub' } });
  assert.match(d.consentHTML(), /send these answers to Hub/); assert.doesNotMatch(d.consentHTML(), /data-consent='s'/);
  d.a.support = ['large']; assert.match(d.consentHTML(), /data-consent='s'/);
});
test('every new text exists in all five languages', () => {
  for (const k of ['consentH', 'consentSend', 'consentSupport', 'consentNote', 'consentNeed', 'draftH', 'draftP', 'draftGo', 'queued', 'sentLater', 'today', 'dateBad', 'noMatch', 'receipt', 'tapToHear'])
    for (const l of ['en', 'am', 'om', 'ti', 'so', 'sid']) assert.ok(UI[k][l], k + ' ' + l);
});
test('widget stays under 250 kB for 3G phones', () => { assert.ok(fs.statSync(file).size < 250 * 1024, fs.statSync(file).size + ' bytes'); });
test('Sidaamu Afoo: every text, question, hint and choice has a Sidama version', () => {
  const missing = Object.keys(UI).filter(k => !['langH', 'langAsk', 'langNone', 'langAgain'].includes(k) && !UI[k].sid);
  for (const f of Object.values(F)) for (const s of f.steps) {
    if (!s.q.sid) missing.push('q.' + s.id);
    if (s.hint && !s.hint.sid) missing.push('hint.' + s.id);
    (s.options || []).forEach(([k, t]) => { if (!t.sid) missing.push(s.id + '.' + k); });
  }
  assert.deepEqual(missing, []);
});
test('every read-aloud clip in the recording script exists as an mp3 for its language, and none is empty', async () => {
  const { execFileSync } = await import('node:child_process');
  const clips = JSON.parse(execFileSync(process.execPath, ['tools/make-recording-script.mjs', '--no-write'], { cwd: new URL('..', import.meta.url) }));
  const missing = [];
  for (const [l, ids] of Object.entries(clips)) for (const id of Object.keys(ids)) {
    const f = new URL(`../public/audio/${l}/${id}.mp3`, import.meta.url);
    if (!fs.existsSync(f) || fs.statSync(f).size < 2048) missing.push(`${l}/${id}`);
  }
  assert.deepEqual(missing, []);
});
