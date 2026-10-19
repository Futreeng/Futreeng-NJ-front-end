// Accessibility: no serious or critical WCAG 2.1 AA problems on any page,
// including the council console tabs, the off-switch, and Spanish mode.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function scan(page, label) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  const summary = bad.map((v) => `${label}: ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary).toEqual([]);
}

const PAGES = ['/', '/inbox/?local=823', '/inbox/?local=825&role=secretary', '/portal/?local=825', '/portal/?local=823#contacts',
  '/preview-823/', '/preview-825/', '/preview-540/', '/preview-880/'];

for (const path of PAGES) {
  test(`no serious accessibility problems: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('load');
    await scan(page, path);
  });
}

test('no serious accessibility problems in the council console tabs', async ({ page }) => {
  await page.goto('/#console');
  for (const tab of ['sent', 'from', 'dir', 'partners', 'log', 'emergency']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    await scan(page, `console ${tab}`);
  }
});

test('no serious accessibility problems while everything is paused', async ({ page }) => {
  await page.goto('/#console');
  await page.locator('[data-tab="emergency"]').click();
  await page.locator('[data-cc="pause-all"]').click();
  await page.locator('[data-cc="pause-all"]').click();
  await expect(page.locator('#pause-notice')).toBeVisible();
  await scan(page, 'hub paused');
});

test('no serious accessibility problems in Spanish', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('[data-lang="es"]').first();
  test.skip(!(await toggle.count()), 'no language toggle found');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', /es/);
  await scan(page, 'hub es');
});
