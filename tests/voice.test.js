// Logic tests for the voice features (no browser needed): option matching, review flow, stop, hide.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

let src = fs.readFileSync(new URL('../public/db-form.js', import.meta.url), 'utf8');
src = src.replace("customElements.define('db-form', DbForm);", 'globalThis.__D = DbForm; globalThis.__F = FLOWS;');
globalThis.HTMLElement = class { attachShadow() { return {}; } };
globalThis.window = globalThis; globalThis.customElements = { get: () => null, define() {} };
globalThis.SpeechRecognition = function () {};
(0, eval)(src.replace(/^const /gm, 'var ').replace(/^class DbForm/m, 'var DbForm = class DbForm'));
const D = globalThis.__D, F = globalThis.__F;
const step = id => Object.values(F).flatMap(f => f.steps).find(s => s.id === id);

const make = (over = {}) => {
  const d = Object.create(D.prototype);
  Object.assign(d, { f: F.signup, l: 'en', a: {}, rm: true, err: '', done: false, welcome: false, jobs: null, i: 0, rs: 0, hide: [], fromReview: false, pref: {}, tok: 0, vtries: 0, log: [] }, over);
  d.draw = () => d.log.push('draw'); d.send = () => d.log.push('SEND'); d.say = () => {}; d.speak = () => {};
  d.say2 = (m, id) => d.log.push('say2' + (id ? ':' + id : '')); d.seq = () => d.log.push('say2'); d.played = []; d.playList = items => { d.played.push(items); d.log.push('play'); }; d.hasVoice = () => false; d.getAttribute = () => null; d.r = { querySelector: () => null };
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
test('contact question can be spoken: digits and emails are turned into text and read back digit by digit', () => {
  assert.ok(/Speak your answer/i.test(make({ i: 2 }).pageText(step('contact'))));
  const box = { value: '' }, d = make({ i: 2 }); d.r = { querySelector: q => (q === '#f' ? box : null) };
  d.heard('zero nine one one 22 33 44'); assert.equal(box.value, '0911223344');
  assert.deepEqual(d.played[0].map(x => x.id), ['heardA', 'n0', 'n9', 'n1', 'n1', 'n2', 'n2', 'n3', 'n3', 'n4', 'n4', 'heardB']);
  d.heard('abebe at gmail dot com'); assert.equal(box.value, 'abebe@gmail.com');
  const a = make({ l: 'am', i: 2 }); a.r = d.r; a.heard('ዜሮ ዘጠኝ 11 22 33 44'); assert.equal(box.value, '0911223344');
  assert.ok(step('contact').check(box.value));
});
test('review: yes submits, no asks what to change, number edits, start again restarts', () => {
  const a = () => ({ fullName: 'Abebe', contact: '0911223344', idRoute: 'refugee', support: ['large'] });
  let d = make({ a: a(), i: 5 }); d.heard('yes'); assert.ok(!d.log.includes('SEND')); assert.equal(d.sup, 1); assert.ok(d.log.includes('say2:askSupport'));
  d.heard('no'); assert.ok(d.log.includes('SEND')); assert.equal(d.consent.s, false); assert.equal(d.consent.a, true);
  d = make({ a: a(), i: 5 }); d.heard('yes'); d.heard('yes'); assert.ok(d.log.includes('SEND')); assert.equal(d.consent.s, true);
  d = make({ a: { ...a(), support: [] }, i: 5 }); d.heard('yes'); assert.ok(d.log.includes('SEND'));
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
test('language page: own-language names in Ge\'ez, mis-hearings and near misses are understood', () => {
  const d = make();
  for (const [said, id] of [['አማርኛ', 'am'], ['ኦሮምኛ', 'om'], ['ትግርኛ', 'ti'], ['ሶማሊኛ', 'so'], ['ሲዳምኛ', 'sid'], ['እንግሊዝኛ', 'en'],
    ['a marina', 'am'], ['amarinya', 'am'], ['amharik', 'am'], ['aroma', 'om'], ['Soomaali', 'so'], ['Sidaamu Afoo', 'sid'], ['tigrigna', 'ti']]) assert.equal(d.pickLang(said), id, said);
  // The recogniser's guesses: the first one that names a language wins.
  assert.equal(d.pickLang(['I married', 'a marina', 'banana']), 'am');
  assert.equal(d.pickLang(['hello', 'banana']), '');
});
test('the English language question names only English; each language invites its own speakers by its own name', () => {
  const src = fs.readFileSync(new URL('../public/db-form.js', import.meta.url), 'utf8');
  const ask = src.match(/langAsk: \{ en: '([^']+)'/)[1];
  assert.ok(/English/.test(ask) && !/Amharic|Oromo|Tigrinya|Somali|Sidama/.test(ask));
  assert.ok(/«አማርኛ» ይበሉ/.test(src) && /«ትግርኛ» በሉ/.test(src));
});
test('review by voice is put together from recorded clips, never one device-voice sentence', () => {
  const d = make({ l: 'am', a: { fullName: 'ሳሙኤል', contact: '0911223344', idRoute: 'refugee', support: ['large'] }, i: 5 });
  const ids = d.reviewItems().map(x => x.id);
  assert.deepEqual(ids, ['reviewH', 'n1', 'q_fullName', null, 'n2', 'q_contact', 'n0', 'n9', 'n1', 'n1', 'n2', 'n2', 'n3', 'n3', 'n4', 'n4',
    'n3', 'q_idRoute', 'o_idRoute_refugee', 'n4', 'q_support', 'o_support_large', 'reviewKeys', 'consentOrg', 'reviewAsk']);
  assert.equal(d.reviewItems()[3].any, true); // the typed name: read by any voice there is, never silent
  const p = make({ l: 'am', a: {}, i: 5 }); p.getAttribute = k => (k === 'partner' ? 'AAAPD' : null);
  assert.deepEqual(p.consentItems('a').map(x => [x.id, x.t]), [['consentSendA', 'እነዚህን መልሶች ለ'], [null, 'AAAPD'], ['consentSendB', ' ለመላክ እስማማለሁ።']]);
});
test('Ge\'ez is spelled in Latin letters when only an English voice exists', () => {
  const r = globalThis.romanize;
  assert.equal(r('አበበ'), 'abebe');
  assert.equal(r('ተስፋዬ'), 'tesfaye');
  assert.equal(r('ሳሙኤል'), 'samuel');
  assert.equal(r('Abebe 09'), 'Abebe 09');
});
test('spoken phone numbers: words in every language, double and triple, and +251', () => {
  const c = globalThis.spokenContact;
  assert.equal(c('zero nine double one 223 344'), '0911223344');
  assert.equal(c('plus 251 911 22 33 44'), '251911223344');
  assert.equal(c('zeeroo sagal tokko tokko lama lama sadii sadii afur afur'), '0911223344');
  assert.equal(c('eber sagaal kow kow laba laba saddex saddex afar afar'), '0911223344');
  assert.equal(c('Abebe at example dot com'), 'abebe@example.com');
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
test('language page listens right after each invitation: "አማርኛ" said after the Amharic one is caught by an Amharic recogniser', async () => {
  const heard = [], played = [];
  const d = make({ lp: true, welcome: true, l: 'en', manual: false });
  d.canHear = () => true; d.beep = () => {};
  d.playList = (items, cb) => { played.push(items.map(x => x.l + '/' + x.id).join(',')); if (cb) cb(); };
  // A fake recogniser: silence in English, "አማርኛ" in Amharic.
  d.recog = lang => { heard.push(lang); const r = { start() { setTimeout(() => { if (lang === 'am-ET') r.onresult({ results: [[{ transcript: 'አማርኛ' }]] }); r.onend(); }, 1); }, abort() {} }; return r; };
  const chosen = await new Promise(res => { d.chooseLang = res; d.askLang(); });
  assert.equal(chosen, 'am');
  assert.deepEqual(played, ['en/langAsk', 'am/langSelf']); // it did not wait for the other four languages
  assert.deepEqual(heard, ['en-US', 'am-ET']);
});
test('language page: a recogniser language the browser does not support falls back to the next one', async () => {
  const heard = [];
  const d = make({ lp: true, welcome: true, l: 'en', manual: false });
  d.recog = lang => { heard.push(lang); const r = { start() { setTimeout(() => { if (lang === 'so-SO') { r.onerror({ error: 'language-not-supported' }); return; } r.onresult({ results: [[{ transcript: 'Soomaali' }]] }); r.onend(); }, 1); }, abort() {} }; return r; };
  const chosen = await new Promise(res => { d.chooseLang = res; d.listenLang(['so-SO', 'en-US'], () => res('miss'), 0); });
  assert.equal(chosen, 'so'); assert.deepEqual(heard, ['so-SO', 'en-US']);
});
test('phone page in Amharic: "ቀጥል" (however the recogniser spells it) goes on, and never replaces the number', () => {
  const box = { value: '0911223344' }, r = { querySelector: q => (q === '#f' ? box : null), querySelectorAll: () => [] };
  for (const said of ['ቀጥል', 'ቀጠለ', 'ቀጥሎ', 'ቅጥል', 'ቀጣይ']) {
    const d = make({ l: 'am', i: 2 }); d.r = r; let went = false; d.next = () => { went = true; };
    d.heard(said); assert.ok(went, said); assert.equal(box.value, '0911223344', said);
  }
  // Among the recogniser's guesses, a command wins over a word that could be an answer.
  const d = make({ l: 'am', i: 2 }); d.r = r;
  assert.equal(d.bestAlt(['ቀጠለው እ', 'ቀጥል']), 'ቀጥል');
  assert.equal(d.bestAlt(['ዜሮ ዘጠኝ 11 22 33 44', 'ቀጥል ዘጠኝ']), 'ዜሮ ዘጠኝ 11 22 33 44');
  // A word that is not a number or email leaves a good number in the box.
  const e = make({ l: 'am', i: 2 }); e.r = r; e.heard('ሰላም'); assert.equal(box.value, '0911223344');
  assert.deepEqual(e.played[0].map(x => x.id), ['heardB']);
});
