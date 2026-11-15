// Logic tests for the voice features (no browser needed): option matching, review flow, stop, hide.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

let src = fs.readFileSync(new URL('../public/db-form.js', import.meta.url), 'utf8');
src = src.replace("customElements.define('db-form', DbForm);", 'globalThis.__D = DbForm; globalThis.__F = FLOWS;');
globalThis.HTMLElement = class { attachShadow() { return {}; } };
globalThis.window = globalThis;
globalThis.SpeechRecognition = function () {};
(0, eval)(src.replace(/^const /gm, 'var ').replace(/^class DbForm/m, 'var DbForm = class DbForm'));
const D = globalThis.__D, F = globalThis.__F;
const step = id => Object.values(F).flatMap(f => f.steps).find(s => s.id === id);

const make = (over = {}) => {
  const d = Object.create(D.prototype);
  Object.assign(d, { f: F.signup, l: 'en', a: {}, rm: true, err: '', done: false, welcome: false, jobs: null, i: 0, rs: 0, hide: [], fromReview: false, pref: {}, tok: 0, vtries: 0, log: [] }, over);
  d.draw = () => d.log.push('draw'); d.send = () => d.log.push('SEND'); d.say = () => {}; d.speak = () => {};
  d.say2 = () => d.log.push('say2'); d.seq = () => d.log.push('say2'); d.hasVoice = () => false; d.getAttribute = () => null; d.r = { querySelector: () => null };
  return d;
};
const pick = (x, id, l = 'en') => { const d = make({ l }); return d.pick(d.norm(x), step(id)).join(','); };

test('options are matched by number', () => {
  assert.equal(pick('two', 'idRoute'), '1');
  assert.equal(pick('number 3', 'idRoute'), '2');
  assert.equal(pick('one and four', 'support'), '0,3');
});
test('options are matched by name', () => {
  assert.equal(pick('refugee', 'idRoute'), '1');
  assert.equal(pick('refer me', 'idRoute'), '3');
  assert.equal(pick('large text', 'support'), '1');
  assert.equal(pick('banana', 'idRoute'), '');
});
test('Amharic numbers and names are matched', () => {
  assert.equal(pick('ሁለት', 'idRoute', 'am'), '1');
  assert.equal(pick('የስደተኛ', 'idRoute', 'am'), '1');
});
test('first question does not mention Back; later ones do', () => {
  assert.ok(!/Back/.test(make({ i: 0 }).pageText(step('prefs'))));
  assert.ok(/Back/.test(make({ i: 1 }).pageText(step('fullName'))));
});
test('contact question is typed, not spoken', () => {
  assert.ok(/type your answer/i.test(make({ i: 2 }).pageText(step('contact'))));
});
test('review: yes submits, no asks what to change, number edits, start again restarts', () => {
  const a = () => ({ fullName: 'Abebe', contact: '0911223344', idRoute: 'refugee', support: ['large'] });
  let d = make({ a: a(), i: 5 }); d.heard('yes'); assert.ok(d.log.includes('SEND'));
  d = make({ a: a(), i: 5 }); d.heard('no'); assert.equal(d.rs, 1);
  d = make({ a: a(), i: 5, rs: 1 }); d.heard('two'); assert.equal(d.i, 2); assert.equal(d.fromReview, true);
  d = make({ a: a(), i: 5, rs: 1 }); d.heard('start again'); assert.equal(d.i, 0); assert.equal(d.a.fullName, undefined);
});
test('after changing one answer the form returns to the review', () => {
  const d = make({ a: { fullName: 'A', contact: '0911223344', idRoute: 'kebele', support: [] }, i: 5 });
  d.edit(3); d.advance(); assert.equal(d.i, d.steps.length);
});
test('stop turns hands-free mode off', () => {
  const d = make({ i: 2 }); d.heard('stop'); assert.equal(d.rm, false);
});
test('hide removes questions but never the required ones', () => {
  const d = make({ hide: ['idRoute', 'support'] });
  assert.deepEqual(d.steps.map(s => s.id), ['prefs', 'fullName', 'contact']);
});
test('Ethiopian phone numbers need 10 digits (or 251 and 9 digits), or an email', () => {
  const ok = step('contact').check;
  assert.ok(ok('0911000000') && ok('0911 000 000') && ok('+251 911 000 000') && ok('name@example.com'));
  assert.ok(!ok('091100000') && !ok('09110000000') && !ok('911000000') && !ok('hello'));
});test('language page: a spoken language name picks that language; unclear or two names pick nothing', () => {
  const d = make();
  assert.equal(d.pickLang('Amharic'), 'am');
  assert.equal(d.pickLang('Afaan Oromoo please'), 'om');
  assert.equal(d.pickLang('tigrinya'), 'ti');
  assert.equal(d.pickLang('Af-Soomaali'), 'so');
  assert.equal(d.pickLang('English'), 'en');
  assert.equal(d.pickLang('banana'), '');
  assert.equal(d.pickLang('English or Somali'), '');
});
test('choosing a language leaves the language page and switches every text', () => {
  const d = make({ lp: true, welcome: true, l: 'en', ra: 0 }); d.stopRA = () => {}; d.askRA = () => d.log.push('askRA');
  assert.ok(/Which language/.test(d.pageText(undefined)));
  d.chooseLang('so');
  assert.equal(d.l, 'so'); assert.equal(d.lp, false); assert.ok(d.log.includes('askRA'));
  assert.equal(d.u('next'), 'Xiga');
  d.chooseLang('xx'); assert.equal(d.l, 'en');
});
test('voice commands and answers work in the new languages', () => {
  assert.equal(pick('lama', 'idRoute', 'om'), '1');
  assert.equal(pick('ክልተ', 'idRoute', 'ti'), '1');
  assert.equal(pick('laba', 'idRoute', 'so'), '1');
  let d = make({ l: 'so', i: 2 }); d.heard('jooji'); assert.equal(d.rm, false);
  d = make({ l: 'om', a: { fullName: 'A', contact: '0911223344', idRoute: 'kebele', support: [] }, i: 5, rs: 1 }); d.heard("irra deebi'ii jalqabi"); assert.equal(d.i, 0);
  d = make({ l: 'ti', a: { fullName: 'A', contact: '0911223344', idRoute: 'kebele', support: [] }, i: 5 }); d.heard('እወ'); assert.ok(d.log.includes('SEND'));
});
test('Tab focus: a choice is read as number + name + state, in the chosen language', () => {
  const d = make({ l: 'am', i: 3, welcome: false });
  const el = { dataset: {}, name: 'f', value: 'refugee', checked: false };
  assert.deepEqual(d.focusItems(el).map(x => x.id), ['n2', 'o_idRoute_refugee', 'unsel']);
  assert.equal(d.focusItems(el)[1].t, 'የስደተኛ ወይም ተመላሽ መታወቂያ');
  assert.equal(d.focusItems({ ...el, checked: true })[2].id, 'sel');
});
test('Tab focus: buttons, answer boxes and language buttons get their own clips', () => {
  const d = make({ l: 'so', i: 1, welcome: false });
  assert.deepEqual(d.focusItems({ dataset: { next: '' } }).map(x => [x.id, x.t]), [['b_next', 'Xiga']]);
  assert.deepEqual(d.focusItems({ dataset: { back: '' } }).map(x => x.id), ['b_back']);
  assert.deepEqual(d.focusItems({ dataset: {}, id: 'f', value: ' Abebe ' }).map(x => [x.id, x.t]), [['q_fullName', 'Waa maxay magacaaga oo buuxa?'], [null, 'Abebe']]);
  assert.deepEqual(d.focusItems({ dataset: { pick: 'ti' } }).map(x => [x.l, x.id]), [['ti', 'langName']]);
});
test('Tab focus is read only while the voice is in use', () => {
  const played = [], d = make({ rm: false, welcome: false, i: 1 }); d.playList = it => played.push(it);
  d.readFocus({ dataset: { next: '' } }); assert.equal(played.length, 0);
  d.rm = true; d.readFocus({ dataset: { next: '' } }); assert.equal(played.length, 1);
  const w = make({ rm: false, welcome: true, lp: true }); w.playList = it => played.push(it);
  w.readFocus({ dataset: { pick: 'am' } }); assert.equal(played.length, 2);
});
test('the microphone opens only after "Speak now" and the beep', async () => {
  const order = [], d = make({ l: 'om' });
  d.playList = (items, cb) => { order.push(items[0].id + ':' + items[0].t); cb(); };
  d.beep = () => order.push('beep');
  await new Promise(r => d.cue(() => { order.push('listen'); r(); }));
  assert.deepEqual(order, ['speakNow:Amma dubbadhu.', 'beep', 'listen']);
});
test('different keyboards: full-width and Arabic-Indic digits, full-width @, and other apostrophes are accepted', () => {
  const ok = step('contact').check;
  assert.ok(ok('０９１１００００００') && ok('٠٩١١٠٠٠٠٠٠') && ok('name＠example.com'));
  const d = make({ l: 'om' });
  assert.equal(d.norm('Irra deebi’ii jalqabi'), d.norm("Irra deebi'ii jalqabi"));
  assert.equal(d.norm('ሰላም፡ዓለም፧'), 'ሰላም ዓለም');
});
