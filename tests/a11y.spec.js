// Browser tests: axe-core in every flow and state, keyboard-only completion, focus management, 200% and 400% zoom,
// all colour themes, sound off (captions), drafts, offline queue, and the LTI / Savanna-style hosts.
// Gate: zero critical and zero serious axe violations. Run: npm run test:a11y
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const scans = [];
async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact));
  scans.push({ label, url: page.url(), passes: r.passes.length, violations: r.violations.map(v => `${v.id} (${v.impact})`) });
  expect(bad.map(v => `${label}: ${v.id} (${v.impact}) ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}
test.afterAll(async ({}, info) => { await info.attach('axe-scans', { body: JSON.stringify(scans, null, 2), contentType: 'application/json' }); });

// Speech recognition is not available in CI browsers; turn it off so the tests are the same everywhere.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined }); Object.defineProperty(window, 'SpeechRecognition', { value: undefined }); });
});

const F = page => page.locator('db-form');
const deepActive = page => page.evaluate(() => { let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement; return { id: a.id, tag: a.tagName, text: (a.textContent || '').trim(), value: a.value || '' }; });
async function open(page, flow = 'signup', q = '') {
  await page.goto(`/index.html?flow=${flow}${q}`);
  await expect(F(page).locator('#h')).toBeVisible();
}
async function toForm(page, flow = 'signup', lang = 'en') {
  await open(page, flow);
  await F(page).locator(`[data-pick=${lang}]`).click();
  await F(page).locator('[data-ra=n]').click();
  await F(page).locator('[data-start=t]').click();
}
const next = page => F(page).locator('[data-next]').click();
const heading = page => F(page).locator('#h');

for (const flow of ['signup', 'job', 'employer']) {
  test(`language page has no serious issues (${flow})`, async ({ page }) => {
    await open(page, flow);
    await expect(heading(page)).toHaveText('Which language would you like to use?');
    await axe(page, `language page ${flow}`);
  });
}

test('read-aloud question and welcome page', async ({ page }) => {
  await open(page);
  await F(page).locator('[data-pick=am]').click();
  await expect(F(page).locator('section')).toHaveAttribute('lang', 'am');
  await axe(page, 'read-aloud question (am)');
  await F(page).locator('[data-ra=n]').click();
  await expect(F(page).locator('[data-start=t]')).toBeVisible();
  await axe(page, 'welcome page (am)');
});

test('signup: every question, the review and the thank-you page', async ({ page }) => {
  await toForm(page);
  await expect(heading(page)).toHaveText('How would you like to use this form?'); await axe(page, 'signup prefs (checkbox)');
  await next(page);
  await expect(heading(page)).toHaveText('What is your full name?'); await axe(page, 'signup fullName (text)');
  await F(page).locator('#f').fill('Abebe Kebede'); await next(page);
  await axe(page, 'signup contact (text, spoken or typed)');
  await F(page).locator('#f').fill('0911223344'); await next(page);
  await expect(heading(page)).toHaveText('How would you like to show who you are?'); await axe(page, 'signup idRoute (radio)');
  await F(page).getByText("I don't have an ID", { exact: false }).click(); await next(page);
  await axe(page, 'signup support (checkbox)');
  await F(page).getByText('Large text').click(); await next(page);
  await expect(heading(page)).toHaveText('Check your answers'); await axe(page, 'signup review with consent');
  const sent = page.evaluate(() => new Promise(r => document.addEventListener('db-complete', e => r(e.detail.answers), { once: true })));
  await F(page).locator('#cons').check(); await F(page).locator('[data-send]').click();
  await expect(heading(page)).toHaveText('Thank you. We received your answers.');
  // The real choices are sent (never the Colours setting), and support needs are not sent without their own tick.
  const ans = await sent;
  expect(ans.idRoute).toBe('refer'); expect(ans.fullName).toBe('Abebe Kebede'); expect('support' in ans).toBe(false); expect('prefs' in ans).toBe(false);
  await expect(F(page).locator('.receipt')).toBeVisible();
  await expect(F(page).locator('.done .when')).toContainText('Ethiopian calendar');
  await axe(page, 'signup done');
});

test('error summary: an empty answer shows an alert, marks the field and moves focus to it', async ({ page }) => {
  await toForm(page); await next(page);
  await next(page);
  const err = F(page).locator('#err');
  await expect(err).toHaveAttribute('role', 'alert');
  await expect(err).toContainText('Please answer this question');
  await expect(F(page).locator('#f')).toHaveAttribute('aria-invalid', 'true');
  expect((await deepActive(page)).id).toBe('f');
  await axe(page, 'error state: required');
});

test('error: a bad phone number explains the format', async ({ page }) => {
  await toForm(page); await next(page);
  await F(page).locator('#f').fill('A'); await next(page);
  await F(page).locator('#f').fill('123'); await next(page);
  await expect(F(page).locator('#err')).toContainText('10 digits');
  await axe(page, 'error state: contact format');
});

test('consent: nothing is sent until the box is ticked', async ({ page }) => {
  const posts = [];
  page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
  await toForm(page); await next(page);
  await F(page).locator('#f').fill('A'); await next(page);
  await F(page).locator('[data-skip]').count() || 0;
  await F(page).locator('#f').fill('a@b.et'); await next(page);
  await F(page).locator('input[name=f]').first().check(); await next(page);
  await next(page);
  await F(page).locator('[data-send]').click();
  await expect(F(page).locator('#err')).toContainText('tick the box');
  expect((await deepActive(page)).id).toBe('cons');
  expect(posts).toEqual([]);
  await axe(page, 'error state: consent missing');
  await F(page).locator('#cons').check();
  await F(page).locator('[data-send]').click();
  await expect(heading(page)).toHaveText('Thank you. We received your answers.');
  expect(posts.length).toBe(1);
});

test('focus moves to the new question heading on every step; Back keeps the answer', async ({ page }) => {
  await toForm(page); await next(page);
  expect((await deepActive(page)).id).toBe('h');
  await F(page).locator('#f').fill('Hanna'); await next(page);
  expect((await deepActive(page)).id).toBe('h');
  await F(page).locator('[data-back]').click();
  await expect(F(page).locator('#f')).toHaveValue('Hanna');
});

test('keyboard only: the job flow from the language page to the thank-you page', async ({ page }) => {
  await open(page, 'job');
  const tabTo = async (match, max = 150) => {
    for (let k = 0; k < max; k++) { await page.keyboard.press('Tab'); const a = await deepActive(page); if (match(a)) return a; }
    throw new Error('not reachable by Tab');
  };
  await tabTo(a => a.tag === 'BUTTON' && a.text.startsWith('English')); await page.keyboard.press('Enter');
  await tabTo(a => a.tag === 'BUTTON' && a.text === 'No, thank you'); await page.keyboard.press('Enter');
  await tabTo(a => a.tag === 'BUTTON' && a.text.startsWith('Start')); await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('What support do you need at work? Choose any.');
  await tabTo(a => a.tag === 'INPUT' && a.value === 'remote'); await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Which job are you applying for?');
  await expect(F(page).locator('input[name=f]')).toHaveCount(1); // the private filter: only the job that offers work from home
  await tabTo(a => a.tag === 'INPUT' && a.value === 'Customer support agent'); await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await tabTo(a => a.id === 'f'); await page.keyboard.type('I like helping people.'); await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Check your answers');
  await tabTo(a => a.id === 'cons'); await page.keyboard.press('Space');
  await tabTo(a => a.text === 'Yes, submit'); await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Thank you. We received your answers.');
});

test('employer: Ethiopian calendar closing date, shown on the review', async ({ page }) => {
  await toForm(page, 'employer');
  await F(page).locator('#f').fill('Receptionist'); await next(page);
  await F(page).getByText('Sign language interpreter').click(); await next(page);
  await expect(heading(page)).toHaveText('When do applications close?');
  await axe(page, 'employer closes (Ethiopian date)');
  await F(page).locator('#ecd').selectOption('0'); await F(page).locator('#ecy').selectOption({ index: 1 });
  await next(page);
  await expect(F(page).locator('#err')).toContainText('choose a month');
  await axe(page, 'error state: date without month');
  await F(page).locator('#ecm').selectOption('13'); await next(page);
  await expect(F(page).locator('dl.review')).toContainText('about');
  await expect(F(page).locator('dl.review')).toContainText('Pagume');
  await F(page).locator('#cons').check(); await F(page).locator('[data-send]').click();
  await expect(heading(page)).toHaveText('Thank you. We received your answers.');
  const ld = await (await page.request.get('http://localhost:3000/v1/jobs?format=jsonld')).json();
  expect(ld['@graph'].some(j => j.title === 'Receptionist' && j.validThrough)).toBe(true);
});

for (const theme of ['standard', 'dark', 'contrast', 'rg', 'by', 'auto']) {
  test(`colour theme "${theme}" passes contrast and every axe check`, async ({ page }) => {
    await toForm(page); await next(page);
    await F(page).locator('details.disp summary').click();
    await F(page).locator(`input[name=th][value=${theme}]`).check();
    await expect(F(page).locator('section')).toHaveAttribute('data-theme', theme);
    await next(page); // show the error state too: error colours must also pass
    await axe(page, `theme ${theme} (with error)`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme); // host header and footer follow
  });
}

test('the colour choice is remembered after reloading', async ({ page }) => {
  await open(page);
  await F(page).locator('details.disp summary').click();
  await F(page).locator('input[name=th][value=dark]').check();
  await page.reload();
  await expect(F(page).locator('section')).toHaveAttribute('data-theme', 'dark');
});

for (const [zoom, width] of [['200%', 640], ['400%', 320]]) {
  test(`${zoom} zoom: no sideways scrolling, nothing cut off`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 });
    await toForm(page); await next(page);
    await F(page).locator('#f').fill('Selamawit Tesfaye Gebremedhin'); await next(page); await next(page);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBeLessThanOrEqual(1);
    const box = await F(page).locator('[data-next]').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(box.height).toBeGreaterThanOrEqual(44); // target size
    await axe(page, `${zoom} zoom (${width}px)`);
  });
}

test('sound off: everything read aloud is also shown as a caption', async ({ page }) => {
  await open(page);
  await F(page).locator('[data-pick=en]').click();
  await F(page).locator('[data-ra=y]').click();
  const cap = F(page).locator('#cap');
  await expect(cap).toHaveAttribute('data-state', 'speaking');
  await expect(cap.locator('.t')).toContainText('Welcome!');
  await expect(cap).toBeVisible();
  await axe(page, 'read-aloud caption visible');
});

test('drafts: answers survive a reload and can be continued', async ({ page }) => {
  await toForm(page); await next(page);
  await F(page).locator('#f').fill('Tigist'); await next(page);
  await page.reload();
  await F(page).locator('[data-pick=en]').click(); await F(page).locator('[data-ra=n]').click();
  await expect(heading(page)).toHaveText('Welcome back');
  await axe(page, 'draft offer');
  await F(page).locator('[data-resume]').click();
  await F(page).locator('[data-back]').click();
  await expect(F(page).locator('#f')).toHaveValue('Tigist');
});

test('offline: answers are kept on the device and sent when the connection returns', async ({ page, context }) => {
  await toForm(page); await next(page);
  await F(page).locator('#f').fill('Offline Person'); await next(page);
  await F(page).locator('#f').fill('0911000000'); await next(page);
  await F(page).locator('input[name=f]').first().check(); await next(page); await next(page);
  await F(page).locator('#cons').check();
  await context.setOffline(true);
  await F(page).locator('[data-send]').click();
  await expect(heading(page)).toContainText('You are offline');
  await axe(page, 'offline queued');
  const sent = page.evaluate(() => new Promise(r => document.addEventListener('db-sent', () => r(true), { once: true })));
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  expect(await sent).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('db-form-queue'))).toBeNull();
});

test('host language links switch the form without losing answers', async ({ page }) => {
  await toForm(page); await next(page);
  await F(page).locator('#f').fill('Mulu');
  await page.locator('nav.util a[data-lang=am]').click();
  await expect(F(page).locator('section')).toHaveAttribute('lang', 'am');
  await expect(heading(page)).toHaveText('ሙሉ ስምዎ ማነው?');
  await expect(F(page).locator('#f')).toHaveValue('Mulu');
  await axe(page, 'Amharic question page');
});

test('Savanna-style course page hosts <db-onboarding>', async ({ page }) => {
  await page.goto('/savanna.html');
  await expect(page.locator('db-onboarding').locator('#h')).toHaveText('Which language would you like to use?');
  await axe(page, 'Savanna-style host');
});

test('LTI 1.3: the demo LMS launches the plug-in in Amharic', async ({ page }) => {
  await page.goto('http://localhost:3000/demo/lms');
  await axe(page, 'demo LMS');
  await page.getByRole('button', { name: 'Join the programme (አማርኛ)' }).click();
  const w = page.locator('db-onboarding');
  await expect(w.locator('section')).toHaveAttribute('lang', 'am');
  await axe(page, 'LTI launch page');
});

test('partner pages: SMS inbox and design system', async ({ page }) => {
  await page.goto('http://localhost:3000/demo/sms-inbox'); await axe(page, 'SMS inbox');
  await page.goto('/design-system.html'); await axe(page, 'design system page');
});

test('keyboard: Tab visits every radio choice, Enter chooses it, Enter again goes on; help is shown in the chosen language', async ({ page }) => {
  await toForm(page, 'signup', 'am');
  await expect(F(page).locator('.keys')).toContainText('ወደ ታች ለመሄድ');
  await expect(F(page).locator('.keys')).toContainText('ድምፁን ለማቆም');
  await next(page);
  await F(page).locator('#f').fill('ሳሙኤል'); await next(page);
  await F(page).locator('#f').fill('0911223344'); await next(page);
  await expect(heading(page)).toHaveText('ማንነትዎን እንዴት ማሳየት ይፈልጋሉ?');
  const seen = [];
  for (let k = 0; k < 4; k++) { await page.keyboard.press('Tab'); seen.push((await deepActive(page)).value); }
  expect(seen).toEqual(['kebele', 'refugee', 'other', 'refer']);
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
  expect((await deepActive(page)).value).toBe('refugee');
  await page.keyboard.press('Enter');
  await expect(F(page).locator('input[value=refugee]')).toBeChecked();
  await expect(heading(page)).toHaveText('ማንነትዎን እንዴት ማሳየት ይፈልጋሉ?');
  await expect(F(page).locator('#err')).toBeEmpty();
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('ምን ዓይነት እገዛ ይጠቅምዎታል? የፈለጉትን ይምረጡ።');
  // Checkboxes: Enter ticks, Enter on a ticked box goes on.
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  await expect(F(page).locator('input[value=screenreader]')).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('መልሶችዎን ያረጋግጡ');
  await axe(page, 'Amharic review with keyboard help');
});

test('Display menu: larger text is kept on this device', async ({ page }) => {
  await toForm(page);
  await F(page).locator('details.disp summary').click();
  await F(page).locator('[data-large]').check();
  await expect(F(page).locator('section')).toHaveCSS('font-size', '22px');
  await axe(page, 'Display menu open');
  await page.reload();
  await expect(F(page).locator('section')).toHaveCSS('font-size', '22px');
});

test('review page by voice: every clip it plays exists, in every language', async ({ page, request }) => {
  await toForm(page);
  await next(page);
  await F(page).locator('#f').fill('Abebe'); await next(page);
  await F(page).locator('#f').fill('0911223344'); await next(page);
  await F(page).locator('input[value=refugee]').check(); await next(page);
  await F(page).locator('input[value=sign]').check(); await next(page);
  await expect(heading(page)).toHaveText('Check your answers');
  for (const l of ['en', 'am', 'om', 'ti', 'so', 'sid']) {
    const ids = await F(page).evaluate((el, l) => { el.l = l; return el.reviewItems().filter(x => x.id).map(x => x.id); }, l);
    expect(ids).toContain('reviewH'); expect(ids).toContain('q_idRoute'); expect(ids).toContain('o_support_sign');
    for (const id of new Set(ids)) expect((await request.head(`http://localhost:3000/audio/${l}/${id}.mp3`)).status(), `${l}/${id}.mp3`).toBe(200);
  }
});
