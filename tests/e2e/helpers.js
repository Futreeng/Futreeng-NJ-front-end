// Shared steps for the demo tests. Each test gets its own browser context,
// so the demo's browser storage starts fresh every time. Pages opened in the
// same context share it, the way the hub, inbox, portal and local sites do.
const { expect } = require('@playwright/test');

// 823 and 825 are approved by hand in the demo. Other locals approve on a
// timer (880 never answers), so tests only target 823 and 825.

/** Fail the test on any page error or console error. */
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

/** Send a post from the council console on the hub. */
async function sendFromHub(page, { title, body, urgent = false, targets = ['823', '825'] }) {
  await page.goto('/#console');
  const form = page.locator('[data-form="council"]');
  if (urgent) {
    await form.locator('label:has(input[name="kind"][value="urgent"])').click();
    await expect(form.locator('input[name="kind"][value="urgent"]')).toBeChecked();
  }
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="body"]').fill(body);
  for (const box of await form.locator('input[name="t"]').all()) {
    const n = await box.getAttribute('value');
    const want = targets.includes(n);
    if ((await box.isChecked()) !== want) await form.locator(`label:has(input[name="t"][value="${n}"])`).click();
    await expect(box).toBeChecked({ checked: want });
  }
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#console-sent .cc-post .tt', { hasText: title }).first()).toBeVisible();
}

/** Open a local's approval inbox as president or secretary and pick the message for a post. */
async function openInbox(page, local, title, role = 'president') {
  await page.goto(`/inbox/?local=${local}&role=${role}`);
  await page.locator('[data-msg]', { hasText: title }).first().click();
}

async function approveInInbox(page, local, title, { role = 'president', pinned = false, note = '' } = {}) {
  await openInbox(page, local, title, role);
  const form = page.locator('form[data-form="approve"]');
  if (pinned) await form.locator('input[name="placement"][value="pinned"]').check({ force: true });
  if (note) await form.locator('[name="note"]').fill(note);
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveCount(0);
}

/** What a local's website shows for council posts. */
function site(page) {
  return {
    alert: page.locator('#council-alert .council-alert'),
    pinned: page.locator('#council-pinned .council-pin'),
    feed: page.locator('.news-grid .news-card.council'),
    all: page.locator('#council-alert .council-alert, #council-pinned .council-pin, .news-grid .news-card.council'),
  };
}

async function openSite(page, local) {
  await page.goto(`/preview-${local}/`);
  return site(page);
}

module.exports = { watchErrors, sendFromHub, openInbox, approveInInbox, openSite };
