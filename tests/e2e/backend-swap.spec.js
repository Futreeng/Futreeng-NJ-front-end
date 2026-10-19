// The storage swap point in council-feed.js: a live backend can replace the
// demo store, and live mode never falls back to demo data.
const { test, expect } = require('@playwright/test');

test('a live backend plugged in through NJCH_LIVE_BACKEND drives the local site', async ({ page }) => {
  await page.addInitScript(() => {
    window.NJCH_CONFIG = { mode: 'live' };
    window.NJCH_LIVE_BACKEND = () => {
      const post = { id: 'p1', created: Date.now(), urgent: false, title: 'From the fake backend', body: 'Served by a test double.',
        titleEs: '', bodyEs: '', startAt: null, endAt: null, origin: null, kind: 'council',
        status: { '823': { state: 'approved', placement: 'feed', at: Date.now() } } };
      const none = () => [];
      const nothing = () => undefined;
      return {
        posts: () => [post], subs: none, log: none, forLocal: (n) => (n === '823' ? [post] : []),
        contacts: (n) => ({ name: 'ATU Local ' + n, num: n }), partners: none, partnersAdmin: none,
        reach: () => ({}), reachTotal: () => ({}), alertSubs: () => 0, emailSubs: () => 0,
        paused: () => ({ all: false, allAt: null, locals: {} }), isPaused: () => false,
        session: () => ({ role: null }), canSeeMembers: () => false, members: none,
        signIn: nothing, signOut: nothing, requestMembership: nothing, approveMember: nothing, declineMember: nothing, removeMember: nothing,
        send: nothing, correct: nothing, pull: nothing, routeSub: nothing, requestVerify: nothing, pauseAll: nothing, pauseLocal: nothing,
        approve: nothing, decline: nothing, remove: nothing, submit: nothing, verifyContacts: nothing,
        addPartner: nothing, setFeatured: nothing, removePartner: nothing, clickPartner: nothing,
        onChange: () => () => {}, tick: nothing, reset: nothing,
      };
    };
  });
  await page.goto('/preview-823/');
  expect(await page.evaluate(() => window.CouncilFeed.mode)).toBe('live');
  await expect(page.locator('.news-grid .news-card.council', { hasText: 'From the fake backend' })).toHaveCount(1);
});

test('live mode without a backend fails loudly instead of showing demo data', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { window.NJCH_CONFIG = { mode: 'live' }; });
  await page.goto('/preview-823/');
  expect(errors.join('\n')).toContain('no live backend is loaded');
  expect(await page.evaluate(() => typeof window.CouncilFeed)).toBe('undefined');
});

test('live mode with an incomplete backend names what is missing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.NJCH_CONFIG = { mode: 'live' };
    window.NJCH_LIVE_BACKEND = () => ({ posts: () => [] });
  });
  await page.goto('/preview-823/');
  expect(errors.join('\n')).toMatch(/missing .*approve/);
});
