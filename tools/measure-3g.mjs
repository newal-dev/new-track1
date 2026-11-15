// Measures how long the plug-in takes to appear on a slow connection, the way the Technical Guide asks (Chrome
// DevTools network throttling). Start the servers first (npm start, npm run demo), then: node tools/measure-3g.mjs
// It loads demo-host/blank.html (no host styles, only the plug-in) with an empty cache, and reports the time until the
// first question is on screen and the bytes downloaded. Set PW_CHROMIUM to a Chrome/Chromium path if Playwright's
// own browser is not installed.
import { chromium } from '@playwright/test';

const PROFILES = {
  // The classic DevTools "Slow 3G" preset: 400 kbit/s down and up, 2000 ms latency.
  'Slow 3G': { latency: 2000, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8 },
  // A typical 3G phone connection: 1.6 Mbit/s down, 750 kbit/s up, 300 ms latency.
  '3G': { latency: 300, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 },
};
const URL = process.env.URL || 'http://localhost:8080/blank.html';

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
for (const [name, net] of Object.entries(PROFILES)) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...net });
  let bytes = 0;
  cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'commit' });
  await page.locator('db-onboarding, db-form').first().locator('#h').waitFor({ state: 'visible', timeout: 120000 });
  const shown = Date.now() - t0;
  await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {});
  console.log(`${name.padEnd(8)} first question on screen after ${(shown / 1000).toFixed(1)} s; ${(bytes / 1024).toFixed(0)} kB downloaded in total`);
  await ctx.close();
}
await browser.close();
