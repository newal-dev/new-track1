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
});