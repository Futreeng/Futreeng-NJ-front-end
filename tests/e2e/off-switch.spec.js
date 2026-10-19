// Emergency off-switch: pause everything, pause one local, resume.
const { test, expect } = require('@playwright/test');
const { watchErrors, sendFromHub, approveInInbox, openSite } = require('./helpers');

async function openEmergency(page) {
  await page.goto('/#console');
  await page.locator('[data-tab="emergency"]').click();
  await expect(page.locator('.cc-em')).toBeVisible();
}

async function publishTo(page, title, locals) {
  await sendFromHub(page, { title, body: 'Live before the pause.', targets: locals });
  for (const n of locals) await approveInInbox(page, n, title);
}

test('pause everything empties every local site and the public hub; resume brings it back', async ({ page }) => {
  const errors = watchErrors(page);
  const title = 'Post before pause all';
  await publishTo(page, title, ['823', '825']);

  await openEmergency(page);
  const pauseAll = page.locator('[data-cc="pause-all"]');
  await pauseAll.click();
  await expect(pauseAll).toContainText(/click again/i); // needs a second click
  await pauseAll.click();
  await expect(page.locator('.cc-em-status')).toContainText('Everything is paused');

  // Public hub: only the notice (the console stays for the demo).
  await expect(page.locator('#pause-notice')).toBeVisible();
  await expect(page.locator('.hero')).toBeHidden();
  await expect(page.locator('.sms-footer')).toBeHidden();
  await expect(page.locator('#partners')).toBeHidden();

  for (const n of ['823', '825']) {
    const s = await openSite(page, n);
    await expect(s.all).toHaveCount(0);
    await expect(page.locator('#partners .pt-card')).toHaveCount(0);
  }

  await openEmergency(page);
  await page.locator('[data-cc="resume-all"]').click();
  await expect(page.locator('#pause-notice')).toBeHidden();
  await expect(page.locator('.hero')).toBeVisible();

  for (const n of ['823', '825']) {
    const s = await openSite(page, n);
    await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
    await expect(page.locator('#partners .pt-card').first()).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test('pause one local empties only that local\'s site', async ({ page }) => {
  const title = 'Post before pause one';
  await publishTo(page, title, ['823', '825']);

  await openEmergency(page);
  await page.locator('[data-cc="pause-local"][data-n="823"]').click();
  await expect(page.locator('.cc-em-local.off')).toHaveCount(1);
  await expect(page.locator('#pause-notice')).toBeHidden(); // hub itself stays up

  let s = await openSite(page, '823');
  await expect(s.all).toHaveCount(0);
  await expect(page.locator('#partners .pt-card')).toHaveCount(0);
  s = await openSite(page, '825');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);

  await openEmergency(page);
  await page.locator('[data-cc="pause-local"][data-n="823"]').click();
  s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
});

test('an open local site empties without a reload when the council pauses', async ({ page, context }) => {
  const title = 'Post on an open tab';
  await publishTo(page, title, ['823']);

  const siteTab = await context.newPage();
  const s = await openSite(siteTab, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);

  await openEmergency(page);
  await page.locator('[data-cc="pause-all"]').click();
  await page.locator('[data-cc="pause-all"]').click();

  // Target from the threat model: public pages empty within 10 seconds.
  await expect(s.all).toHaveCount(0, { timeout: 10_000 });
});

test('every pause and resume is recorded', async ({ page }) => {
  await openEmergency(page);
  await page.locator('[data-cc="pause-local"][data-n="825"]').click();
  await page.locator('[data-cc="pause-local"][data-n="825"]').click();
  await page.locator('[data-cc="pause-all"]').click();
  await page.locator('[data-cc="pause-all"]').click();
  await page.locator('[data-cc="resume-all"]').click();

  const actions = await page.evaluate(() => window.CouncilFeed.log().map((r) => r.action));
  expect(actions.slice(0, 4)).toEqual(['resumed everything', 'paused everything', 'resumed local', 'paused local']);
});
