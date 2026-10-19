// Public vs members-only: the console lives behind the council sign-in,
// members ask to join and the local secretary approves them, and council
// posts can be Public or Members only.
const { test, expect } = require('@playwright/test');
const { watchErrors, openConsole, sendFromHub, approveInInbox, openSite, memberLogin, signOut } = require('./helpers');

const MEMBERS_SECTIONS = ['#survey', '#contract', '#cope', '#spotlight', '#wall'];

test('the public hub has no council console', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#console')).toHaveCount(0);
  await expect(page.locator('[data-form="council"]')).toHaveCount(0);
  await expect(page.locator('#console-link')).toHaveAttribute('href', '/console/');
});

test('the council console needs the council sign-in', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/console/');
  await expect(page.locator('[data-cc="signin"]')).toBeVisible();
  await expect(page.locator('[data-form="council"]')).toHaveCount(0);
  await expect(page.locator('.hero')).toBeHidden(); // console page shows only the console

  await page.locator('[data-cc="signin"]').click();
  await expect(page.locator('[data-form="council"]')).toBeVisible();

  await page.locator('[data-cc="signout"]').click();
  await expect(page.locator('[data-cc="signin"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('visitors see the scoreboard but members-only sections are locked', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#fight')).toBeVisible();           // scoreboard stays public
  await expect(page.locator('#fight .members-lock')).toHaveCount(0);
  for (const sel of MEMBERS_SECTIONS) {
    await expect(page.locator(`${sel} .members-lock`), sel).toBeVisible();
    await expect(page.locator(`${sel} .members-lock`), sel).toContainText('Members only');
  }
  await expect(page.locator('#survey form')).toBeHidden();
});

test('an approved member can log in and see members-only sections', async ({ page }) => {
  await memberLogin(page, '823', '823-0001');
  await expect(page.locator('main')).toContainText("You're logged in");

  await page.goto('/');
  await expect(page.locator('#members-link')).toContainText('Local 823');
  for (const sel of MEMBERS_SECTIONS) await expect(page.locator(`${sel} .members-lock`), sel).toBeHidden();
  await expect(page.locator('#contract')).toBeVisible();

  await signOut(page);
  await page.reload();
  await expect(page.locator('#contract .members-lock')).toBeVisible();
});

test('sign-up waits for the secretary; the president cannot approve', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/join/?local=825');
  const join = page.locator('form[data-form="join"]');
  await join.locator('[name="name"]').fill('Test Operator');
  await join.locator('[name="number"]').fill('825-7777');
  await join.locator('[name="contact"]').fill('operator@example.com');
  await join.locator('button[type="submit"]').click();
  await expect(join.locator('.msg')).toContainText('secretary will confirm you');

  // Not approved yet: log-in says it's waiting.
  await memberLogin(page, '825', '825-7777');
  await expect(page.locator('form[data-form="login"] .msg')).toContainText('still waiting');

  // President sees the sign-up but can't approve it.
  await page.goto('/portal/?local=825#members');
  const row = page.locator('.mrow', { hasText: 'Test Operator' });
  await expect(row.locator('[data-mem="approve"]')).toBeDisabled();

  // Secretary approves.
  await page.locator('[data-role="secretary"]').click();
  await row.locator('[data-mem="approve"]').click();
  await expect(page.locator('.mrow', { hasText: 'Test Operator' }).locator('[data-mem="remove"]')).toBeVisible();

  await memberLogin(page, '825', '825-7777');
  await expect(page.locator('main')).toContainText("You're logged in");
  expect(errors).toEqual([]);
});

test('the secretary can remove access', async ({ page }) => {
  await page.goto('/portal/?local=823#members');
  await page.locator('[data-role="secretary"]').click();
  await page.locator('.mrow', { hasText: '823-0001' }).locator('[data-mem="remove"]').click();

  await memberLogin(page, '823', '823-0001');
  await expect(page.locator('form[data-form="login"] .msg')).toContainText("couldn't find");
});

test('members-only council posts show only to that local\'s logged-in members', async ({ page }) => {
  const title = 'Members-only strike vote update';
  await sendFromHub(page, { title, body: 'For members only.', targets: ['823', '825'], visibility: 'members' });
  await expect(page.locator('#console-sent .cc-post', { hasText: title })).toContainText('Members only');
  await approveInInbox(page, '823', title);
  await approveInInbox(page, '825', title);
  await signOut(page);

  // Visitor: hidden, with a log-in note instead.
  let s = await openSite(page, '823');
  await expect(s.all.filter({ hasText: title })).toHaveCount(0);
  await expect(page.locator('.council-members-note')).toContainText('log in');

  // Member of 823: visible on 823, still hidden on 825.
  await memberLogin(page, '823', '823-0001');
  s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
  await expect(s.feed.filter({ hasText: title })).toContainText('Members only');
  await expect(page.locator('.council-members-note')).toHaveCount(0);
  s = await openSite(page, '825');
  await expect(s.all.filter({ hasText: title })).toHaveCount(0);
});

test('public council posts show to everyone', async ({ page }) => {
  const title = 'Public rally notice';
  await sendFromHub(page, { title, body: 'Everyone welcome.', targets: ['823'] });
  await approveInInbox(page, '823', title);
  await signOut(page);
  const s = await openSite(page, '823');
  await expect(s.feed.filter({ hasText: title })).toHaveCount(1);
});
