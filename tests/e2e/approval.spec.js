// Council to local: regular posts wait for the local president or secretary;
// urgent posts go live at once and either officer can take them down.
const { test, expect } = require('@playwright/test');
const { watchErrors, sendFromHub, openInbox, approveInInbox, openSite } = require('./helpers');

test('regular post waits for the local, then shows only on that local\'s site', async ({ page }) => {
  const errors = watchErrors(page);
  const title = 'Regular test post';
  await sendFromHub(page, { title, body: 'Waits for approval.', targets: ['823', '825'] });

  let s = await openSite(page, '823');
  await expect(s.all).toHaveCount(0);

  await approveInInbox(page, '823', title);

  s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
  s = await openSite(page, '825');
  await expect(s.all.filter({ hasText: title })).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('pinned placement and local note show on the site', async ({ page }) => {
  const title = 'Pinned test post';
  await sendFromHub(page, { title, body: 'Goes to the top.', targets: ['825'] });
  await approveInInbox(page, '825', title, { pinned: true, note: 'See you at the hall.' });

  const s = await openSite(page, '825');
  const pin = s.pinned.filter({ hasText: title });
  await expect(pin).toHaveCount(1);
  await expect(pin).toContainText('See you at the hall.');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(0);
});

test('declined post never shows on the site', async ({ page }) => {
  const title = 'Declined test post';
  await sendFromHub(page, { title, body: 'Will be declined.', targets: ['823'] });
  await openInbox(page, '823', title);
  await page.locator('[data-act="decline"]').click();
  await page.locator('form[data-form="decline"] button[type="submit"]').click();

  const s = await openSite(page, '823');
  await expect(s.all.filter({ hasText: title })).toHaveCount(0);
});

test('urgent post is live on every targeted site at once; one local can take it down', async ({ page }) => {
  const errors = watchErrors(page);
  const title = 'Urgent test alert';
  await sendFromHub(page, { title, body: 'Live right away.', urgent: true, targets: ['823', '825'] });

  for (const n of ['823', '825']) {
    const s = await openSite(page, n);
    await expect(s.alert.filter({ hasText: title })).toHaveCount(1);
  }

  await openInbox(page, '823', title);
  await page.locator('[data-act="remove"]').click();

  let s = await openSite(page, '823');
  await expect(s.alert.filter({ hasText: title })).toHaveCount(0);
  s = await openSite(page, '825');
  await expect(s.alert.filter({ hasText: title })).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('after 48 hours with no answer, the secretary can approve', async ({ page }) => {
  const title = 'Hand-off test post';
  await sendFromHub(page, { title, body: 'President never answers.', targets: ['823'] });

  // Demo clock: 1 real second is 1 hour. Move this page 50 seconds ahead.
  await page.clock.install({ time: Date.now() + 50_000 });
  await openInbox(page, '823', 'Passed to you after 48 hours', 'secretary');
  await expect(page.locator('#who-role')).toContainText('Secretary');
  await page.locator('form[data-form="approve"] button[type="submit"]').click();

  const s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
});
