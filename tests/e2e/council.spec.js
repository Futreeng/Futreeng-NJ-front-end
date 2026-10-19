// Council controls (pull, correct) and locals sending posts up to the council.
const { test, expect } = require('@playwright/test');
const { watchErrors, sendFromHub, approveInInbox, openSite, openConsole } = require('./helpers');

function sentPost(page, title) {
  return page.locator('#console-sent .cc-post', { has: page.locator('.tt', { hasText: title }) });
}

test('pulling a post takes it off every local site', async ({ page }) => {
  const title = 'Pull test post';
  await sendFromHub(page, { title, body: 'Will be pulled.', targets: ['823', '825'] });
  await approveInInbox(page, '823', title);
  await approveInInbox(page, '825', title);

  await openConsole(page);
  const pull = sentPost(page, title).locator('[data-cc="pull"]');
  await pull.click();
  await pull.click(); // second click confirms

  for (const n of ['823', '825']) {
    const s = await openSite(page, n);
    await expect(s.all.filter({ hasText: title })).toHaveCount(0);
  }
});

test('a correction waits for re-approval; the site keeps the approved version until then', async ({ page }) => {
  const title = 'Original title';
  const fixed = 'Corrected title';
  await sendFromHub(page, { title, body: 'First version.', targets: ['823'] });
  await approveInInbox(page, '823', title);

  await openConsole(page);
  await sentPost(page, title).locator('[data-cc="correct"]').click();
  const edit = page.locator('form[data-form="correct"]');
  await edit.locator('[name="title"]').fill(fixed);
  await edit.locator('button[type="submit"]').click();

  let s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
  await expect(s.all.filter({ hasText: fixed })).toHaveCount(0);

  await approveInInbox(page, '823', fixed);
  s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: fixed })).toHaveCount(1);
  await expect(s.all.filter({ hasText: title })).toHaveCount(0);
});

test('a local shares a win; the council routes it and other locals approve it', async ({ page }) => {
  const errors = watchErrors(page);
  const title = 'Back pay won at Hilltop garage';

  await page.goto('/portal/?local=825');
  const form = page.locator('form[data-form="submit"]');
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="body"]').fill('Twelve operators paid in full.');
  await form.locator('button[type="submit"]').click();

  await openConsole(page);
  await page.locator('[data-tab="from"]').click();
  await page.locator('#console-sent .cc-post', { hasText: title }).locator('[data-cc="route"]').click();

  // The local that shared it shows it at once; others wait for their own approval.
  let s = await openSite(page, '825');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
  s = await openSite(page, '823');
  await expect(s.all.filter({ hasText: title })).toHaveCount(0);

  await approveInInbox(page, '823', title);
  s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('a private issue never appears on any local site', async ({ page }) => {
  const title = 'Restroom locked at Broad St layover';

  await page.goto('/portal/?local=823');
  await page.locator('label:has(input[name="kind"][value="issue"])').click();
  const form = page.locator('form[data-form="submit"]');
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="body"]').fill('Third week in a row.');
  await form.locator('button[type="submit"]').click();

  await openConsole(page);
  await page.locator('[data-tab="from"]').click();
  await page.locator('#console-sent .cc-post', { hasText: title }).locator('[data-cc="route"]').click();

  for (const n of ['823', '825']) {
    const s = await openSite(page, n);
    await expect(s.all.filter({ hasText: title })).toHaveCount(0);
  }
});

test('every page loads without errors', async ({ page }) => {
  const errors = watchErrors(page);
  for (const path of ['/', '/console/', '/join/', '/inbox/?local=823', '/portal/?local=825', '/preview-823/', '/preview-825/', '/preview-540/']) {
    await page.goto(path);
    await page.waitForLoadState('load');
  }
  expect(errors).toEqual([]);
});
