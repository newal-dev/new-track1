// Browser regression tests for accessibility: microphone behaviour, keyboard-only flows, focus, announcements,
// axe scans of every state, and reflow at 200% / 400% zoom. Needs the plugin server on :3000 and the demo host on :8080.
// Run: npx playwright test tests/a11y-flows.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HOST = 'http://localhost:8080/';

// A fake SpeechRecognition and speechSynthesis so tests can see exactly when the microphone starts,
// and can simulate speech, silence and permission errors.
const fakeSpeech = () => {
  window.__log = []; window.__recs = [];
  class R {
    constructor() { window.__recs.push(this); }
    start() { this.started = true; window.__log.push('mic:start'); }
    abort() { this.aborted = true; window.__log.push('mic:abort'); }
    stop() { this.abort(); }
    _say(t) { this.onresult && this.onresult({ results: [[{ transcript: t }]] }); this.onend && this.onend(); }
    _err(e) { this.onerror && this.onerror({ error: e }); this.onend && this.onend(); }
  }
  window.SpeechRecognition = R; window.webkitSpeechRecognition = R;
  speechSynthesis.speak = u => { window.__log.push('tts:' + u.text); setTimeout(() => u.onend && u.onend(), 20); };
  speechSynthesis.cancel = () => {};
};

const L = {
  en: { no: 'No, thank you', yes: 'Yes, read aloud', start: 'Start and type my answers', voice: 'Start with voice input', next: 'Next', skip: 'Skip', submit: 'Yes, submit', review: 'Check your answers', thanks: 'Thank you. We received your answers.', change: 'Change', need: 'Please answer this question', lang: 'English' },
  am: { no: 'አይ፣ አያስፈልግም', yes: 'አዎ፣ ይነበብልኝ', start: 'ጀምር፣ መልሶቼን እጽፋለሁ', voice: 'በድምፅ ግብዓት ጀምር', next: 'ቀጥል', skip: 'ዝለል', submit: 'አዎ፣ አስገባ', review: 'መልሶችዎን ያረጋግጡ', thanks: 'እናመሰግናለን። መልሶችዎን ተቀብለናል።', change: 'ቀይር', need: 'እባክዎ ይህን ጥያቄ ይመልሱ', lang: 'አማርኛ' },
};

const sh = (page, fn, arg) => page.evaluate(([f, a]) => (0, eval)(f)(document.querySelector('db-form').shadowRoot, a), [fn.toString(), arg]);
const focused = page => sh(page, r => { const a = r.activeElement; if (!a) return null; const lab = a.closest('label'); return { tag: a.tagName, id: a.id, text: (lab || a).textContent.replace(/\s+/g, ' ').trim(), invalid: a.getAttribute('aria-invalid'), desc: (a.getAttribute('aria-describedby') || '').split(' ').map(i => r.getElementById(i)).filter(Boolean).map(e => e.textContent.trim()).filter(Boolean).join(' | '), outline: getComputedStyle(a).outlineStyle + ' ' + getComputedStyle(a).outlineWidth }; });
const status = page => sh(page, r => r.querySelector('#live').textContent);
const log = page => page.evaluate(() => window.__log);
const micStarts = async page => (await log(page)).filter(x => x === 'mic:start').length;

// Press Tab (or Shift+Tab) until focus is on a control whose text starts with `name`. Fails if it cannot be reached.
async function tabTo(page, name, back = false) {
  for (let n = 0; n < 40; n++) {
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    const f = await focused(page);
    if (f && f.text.replace(/^[^\p{L}\p{N}]+/u, '').startsWith(name)) return f;
  }
  throw new Error('Could not reach "' + name + '" with ' + (back ? 'Shift+Tab' : 'Tab'));
}

// Press Tab until a form field (text box, radio or checkbox) has focus.
async function tabToInput(page) {
  for (let n = 0; n < 20; n++) { await page.keyboard.press('Tab'); if ((await focused(page)).tag === 'INPUT') return; }
  throw new Error('Could not reach a form field with Tab');
}

const states = [];
async function check(page, label) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  const v = r.violations.map(x => x.id + ' (' + x.impact + '): ' + x.nodes.map(n => n.target.join(' ')).join(', '));
  expect(v, 'axe violations at ' + label).toEqual([]);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, 'horizontal scroll at ' + label).toBeLessThanOrEqual(0);
  states.push(label);
}

async function open(page, flow, lang) {
  await page.addInitScript(fakeSpeech);
  await page.goto(HOST + '?flow=' + flow);
  await page.waitForFunction(() => document.querySelector('db-form')?.shadowRoot?.querySelector('#h'));
  if (lang === 'am') { await tabTo(page, 'አማርኛ'); await page.keyboard.press('Enter'); expect((await focused(page)).text).toContain('አማርኛ'); }
}

// Answers each question by keyboard only, triggering a validation error first on required questions.
async function answerSteps(page, lang, answers, label) {
  const t = L[lang];
  for (let k = 0; k < 10; k++) {
    const h = await sh(page, r => r.querySelector('#h')?.textContent);
    if (h === t.review) return;
    expect((await focused(page)).id, 'heading focused on step ' + h).toBe('h');
    await check(page, label + ' step "' + h + '"');
    const kind = await sh(page, r => r.querySelector('#f') ? 'text' : r.querySelector('input[type=radio]') ? 'radio' : 'checkbox');
    const optional = await sh(page, r => !!r.querySelector('[data-skip]'));
    if (!optional) {
      await tabToInput(page);
      if (kind === 'text') { await page.keyboard.press('Enter'); } else { await tabTo(page, t.next); await page.keyboard.press('Enter'); }
      const f = await focused(page);
      expect(f.invalid, 'invalid field focused after empty answer on ' + h).toBe('true');
      expect(f.desc).toContain(t.need);
      await check(page, label + ' error on "' + h + '"');
    }
    if (kind === 'text') {
      if (optional) await tabToInput(page); // after an error, focus is already in the field
      const v = answers.shift();
      if (v.bad) {
        await page.keyboard.type(v.bad); await page.keyboard.press('Enter');
        expect((await focused(page)).invalid).toBe('true');
        await check(page, label + ' format error on "' + h + '"');
        await page.keyboard.press('Control+A');
      }
      await page.keyboard.type(v.ok || v); await page.keyboard.press('Enter');
    } else if (optional) {
      await tabTo(page, t.skip); await page.keyboard.press('Space');
    } else {
      if ((await focused(page)).tag !== 'INPUT') await tabToInput(page);
      await page.keyboard.press('Space');
      await tabTo(page, t.next); await page.keyboard.press('Enter');
    }
  }
}

const FLOWS = {
  signup: { answers: () => ['Abebe Kebede', { bad: 'hello', ok: '0911223344' }] },
  job: { answers: () => ['I like helping people'] },
  employer: { answers: () => ['Receptionist'] },
};

for (const lang of ['en', 'am']) {
  for (const flow of Object.keys(FLOWS)) {
    test(`keyboard only, every state passes axe and reflows: ${flow} (${lang})`, async ({ page }) => {
      const t = L[lang];
      await open(page, flow, lang);
      await check(page, `${flow}/${lang} first screen`);
      await tabTo(page, t.no); await page.keyboard.press('Enter');
      expect((await focused(page)).id).toBe('h');
      await check(page, `${flow}/${lang} welcome`);
      await tabTo(page, t.start); await page.keyboard.press('Space');
      await answerSteps(page, lang, FLOWS[flow].answers(), `${flow}/${lang}`);
      expect((await focused(page)).text).toBe(t.review);
      await check(page, `${flow}/${lang} review`);
      const names = await sh(page, r => [...r.querySelectorAll('[data-edit]')].map(b => b.textContent.trim()));
      expect(new Set(names).size, 'Change buttons have unique names').toBe(names.length);
      // Shift+Tab reaches earlier controls too.
      await tabTo(page, t.submit); await tabTo(page, t.change, true); await tabTo(page, t.submit);
      expect((await focused(page)).outline).toMatch(/solid 3px/);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('db-form').shadowRoot.querySelector('#h')?.closest('.center'));
      expect((await focused(page)).text).toBe(t.thanks);
      await check(page, `${flow}/${lang} success`);
      expect(await micStarts(page), 'microphone never started in a typing-only run').toBe(0);
    });
  }
}

test('send failure: error is focused and announced; answers kept', async ({ page }) => {
  await page.route('**/v1/employer/jobs', r => r.fulfill({ status: 500, body: '{}' }));
  await open(page, 'employer', 'en');
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  await tabTo(page, L.en.start); await page.keyboard.press('Enter');
  await tabToInput(page); await page.keyboard.type('Cook'); await page.keyboard.press('Enter');
  await tabTo(page, L.en.skip); await page.keyboard.press('Enter');
  await tabTo(page, L.en.submit); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('db-form').shadowRoot.querySelector('#err').textContent);
  const f = await focused(page);
  expect(f.id).toBe('err');
  expect(f.text).toBe('Error: We could not send your answers. Nothing is lost. Please try again.');
  await check(page, 'employer/en review send error');
  expect(await sh(page, r => r.querySelector('dd').textContent)).toContain('Cook');
});

for (const flow of Object.keys(FLOWS)) {
  test('microphone and speech never start on page load: ' + flow, async ({ page }) => {
    await open(page, flow, 'en');
    await page.waitForTimeout(1500);
    expect(await log(page)).toEqual([]);
    const text = await sh(page, r => r.querySelector('section').innerText);
    expect(text).not.toMatch(/\bsay\b|speak now/i);
  });
}

test('Read aloud only speaks: it never turns the microphone on, and never tells the person to speak', async ({ page }) => {
  await open(page, 'signup', 'en');
  await tabTo(page, L.en.yes); await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await tabTo(page, L.en.start); await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await tabTo(page, L.en.skip); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  await tabToInput(page); await page.keyboard.type('Abebe'); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  const spoken = (await log(page)).filter(x => x.startsWith('tts:'));
  expect(spoken.length).toBeGreaterThan(1);
  expect(spoken.join(' ')).not.toMatch(/\bSay\b|Speak your answer/);
  expect(await micStarts(page)).toBe(0);
});

test('voice input: starts only on request, announces Listening, Stop and Switch to typing work by keyboard', async ({ page }) => {
  await open(page, 'signup', 'en');
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  // The privacy notice is linked to the voice button, so it is heard before voice is used.
  const v = await tabTo(page, L.en.voice);
  expect(v.desc).toMatch(/send your voice to its provider/);
  expect(await micStarts(page)).toBe(0);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect(await micStarts(page)).toBe(1);
  expect(await status(page)).toBe('Listening. Speak now.');
  expect(await sh(page, r => !r.querySelector('#vbar').hidden && r.querySelector('#vbar').innerText)).toMatch(/Microphone on: listening[\s\S]*Stop listening[\s\S]*Switch to typing/);
  expect(await sh(page, r => r.querySelector('#vhint').hidden)).toBe(false);
  await check(page, 'signup/en listening');
  // Switch to typing from the keyboard (reached with Shift+Tab from the heading).
  await tabTo(page, 'Switch to typing', true);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  expect((await log(page)).includes('mic:abort')).toBe(true);
  expect(await status(page)).toBe('Voice input is off. You can type your answer.');
  expect((await focused(page)).tag).toBe('INPUT');
  expect(await sh(page, r => r.querySelector('#vbar').hidden)).toBe(true);
  expect(await sh(page, r => r.querySelector('#vhint') && !r.querySelector('#vhint').hidden)).toBe(false);
  // After switching to typing, the next page does not listen.
  await tabTo(page, L.en.skip); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  expect(await micStarts(page)).toBe(1);
});

test('voice input: Enter on "Stop listening" stops it (does not restart), and is announced', async ({ page }) => {
  await open(page, 'signup', 'en');
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  await tabTo(page, L.en.start); await page.keyboard.press('Enter');
  const m = await tabTo(page, 'Start voice input');
  expect(m.desc).toMatch(/optional/);
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  expect(await micStarts(page)).toBe(1);
  expect((await focused(page)).text).toMatch(/Stop listening$/);
  await expect(page.locator('db-form .mic')).toBeFocused();
  await expect(page.locator('db-form .mic')).toHaveAccessibleName('Stop listening');
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  expect(await micStarts(page)).toBe(1);
  await expect(page.locator('db-form .mic')).toBeFocused();
  await expect(page.locator('db-form .mic')).toHaveAccessibleName('Start voice input');
  expect(await status(page)).toMatch(/^Stopped listening/);
});

test('voice input: spoken answers work, then permission denial and silence are announced', async ({ page }) => {
  await open(page, 'signup', 'en');
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  await tabTo(page, L.en.voice); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  await page.evaluate(() => window.__recs.at(-1)._say('skip')); await page.waitForTimeout(300);
  expect(await sh(page, r => r.querySelector('#h').textContent)).toBe('What is your full name?');
  expect(await micStarts(page)).toBe(2);
  await page.evaluate(() => window.__recs.at(-1)._err('not-allowed')); await page.waitForTimeout(200);
  expect(await status(page)).toMatch(/^Microphone permission was denied, so voice input is off/);
  expect(await sh(page, r => r.querySelector('#vbar').hidden)).toBe(true);
  // Voice is off now: the next page does not listen or show voice instructions.
  await tabToInput(page); await page.keyboard.type('Abebe'); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  expect(await micStarts(page)).toBe(2);
  expect(await sh(page, r => !!r.querySelector('.vhint'))).toBe(false);
  // Trying again by button, then silence.
  await tabToInput(page); await page.keyboard.type('0911223344'); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  await tabTo(page, 'Start voice input'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  await page.evaluate(() => window.__recs.at(-1)._err('no-speech')); await page.waitForTimeout(200);
  expect(await status(page)).toMatch(/^We did not hear anything, so listening has stopped/);
});

test('first screen: voice Yes/No only listens after its button, then reads aloud without listening', async ({ page }) => {
  await open(page, 'job', 'en');
  await tabTo(page, 'Answer Yes or No by voice'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  expect(await status(page)).toBe('Listening. Speak now. Say Yes or No.');
  await page.evaluate(() => window.__recs.at(-1)._say('yes')); await page.waitForTimeout(200);
  expect(await sh(page, r => r.querySelector('#h').textContent)).toBe('Welcome!');
  expect((await log(page)).some(x => x.startsWith('tts:Welcome'))).toBe(true);
  expect(await micStarts(page)).toBe(1);
});

test('Escape stops reading and listening and keeps focus; status region is never replaced', async ({ page }) => {
  await open(page, 'signup', 'en');
  const live = await page.evaluateHandle(() => document.querySelector('db-form').shadowRoot.querySelector('#live'));
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  await tabTo(page, L.en.voice); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  await tabTo(page, L.en.skip); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  await tabToInput(page); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  expect((await focused(page)).id).toBe('f');
  expect(await status(page)).toBe('Reading aloud and voice input stopped. You can use the keyboard.');
  expect(await page.evaluate(l => l.isConnected, live)).toBe(true);
  // Escape on a choice keeps focus on that choice.
  await page.keyboard.type('Abebe'); await page.keyboard.press('Enter');
  await tabToInput(page); await page.keyboard.type('0911223344'); await page.keyboard.press('Enter');
  await tabTo(page, 'Read every page aloud', true); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  await tabToInput(page); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  expect((await focused(page)).text).toBe('Refugee or returnee ID');
  await expect(page.getByRole('button', { name: 'Read every page aloud' })).toBeVisible();
});

test('typing while listening stops listening; language switch keeps typed text and focus', async ({ page }) => {
  await open(page, 'employer', 'en');
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  await tabTo(page, L.en.voice); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  await tabToInput(page);
  await page.keyboard.type('Nurse'); await page.waitForTimeout(150);
  expect(await status(page)).toMatch(/^Stopped listening/);
  await tabTo(page, 'አማርኛ', true); await page.keyboard.press('Enter');
  expect((await focused(page)).text).toContain('አማርኛ');
  expect(await sh(page, r => r.querySelector('#f').value)).toBe('Nurse');
  expect(await sh(page, r => r.querySelector('section').getAttribute('lang'))).toBe('am');
});

test('employer first question error does not mention a Back button that is not there', async ({ page }) => {
  await open(page, 'employer', 'en');
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  await tabTo(page, L.en.start); await page.keyboard.press('Enter');
  await tabToInput(page); await page.keyboard.press('Enter');
  expect((await focused(page)).desc).toBe('Error: Please answer this question.');
  expect(await sh(page, r => !!r.querySelector('[data-back]'))).toBe(false);
});

for (const width of [640, 320]) {
  test(`reflow at ${width === 640 ? '200%' : '400%'} zoom (viewport ${width}px), large text on`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page, 'signup', 'am');
    await check(page, `zoom ${width} first screen`);
    await tabTo(page, L.am.no); await page.keyboard.press('Enter');
    await tabTo(page, L.am.start); await page.keyboard.press('Enter');
    await tabToInput(page); await page.keyboard.press('Space'); // Larger text
    await tabTo(page, L.am.next); await page.keyboard.press('Enter');
    await check(page, `zoom ${width} large text question`);
    await tabToInput(page); await page.keyboard.type('Abebe Kebede Tesfaye Woldemariam'); await page.keyboard.press('Enter');
    await tabToInput(page); await page.keyboard.type('someone.with.a.long.address@example.com'); await page.keyboard.press('Enter');
    await tabToInput(page); await page.keyboard.press('Space'); await tabTo(page, L.am.next); await page.keyboard.press('Enter');
    await tabTo(page, L.am.skip); await page.keyboard.press('Enter');
    await check(page, `zoom ${width} review with long answers`);
  });
}

test('reduced motion: listening animation is off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'signup', 'en');
  await tabTo(page, L.en.no); await page.keyboard.press('Enter');
  await tabTo(page, L.en.voice); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  expect(await sh(page, r => getComputedStyle(r.querySelector('#vbar .wave i')).animationName)).toBe('none');
});
