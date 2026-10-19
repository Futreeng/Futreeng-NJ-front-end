// Security headers from pitch/deploy/vercel.json, and nothing on the pages
// blocked by the Content-Security-Policy.
const { test, expect } = require('@playwright/test');

const PAGES = ['/', '/console/', '/join/', '/inbox/?local=823', '/portal/?local=825', '/preview-823/', '/preview-825/', '/preview-540/'];

test('every page sends the security headers', async ({ request }) => {
  for (const path of PAGES) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    const h = res.headers();
    expect(h['content-security-policy'], path).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy'], path).toContain("object-src 'none'");
    expect(h['strict-transport-security'], path).toContain('max-age=');
    expect(h['x-content-type-options'], path).toBe('nosniff');
    expect(h['x-frame-options'], path).toBe('DENY');
    expect(h['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy'], path).toContain('camera=()');
  }
});

test('the policy blocks nothing the pages need', async ({ page }) => {
  const blocked = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) blocked.push(m.text()); });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => console.error('Refused to load (CSP): ' + e.violatedDirective + ' ' + e.blockedURI));
  });
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState('load');
  }
  expect(blocked).toEqual([]);
});
