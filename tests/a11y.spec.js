import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const flow of ['signup', 'job', 'employer']) {
  test('no serious accessibility issues: ' + flow, async ({ page }) => {
    await page.goto('http://localhost:8080/?flow=' + flow);
    await page.waitForSelector('db-form');
    const r = await new AxeBuilder({ page }).analyze();
    const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact));
    expect(bad).toEqual([]);
  });
}