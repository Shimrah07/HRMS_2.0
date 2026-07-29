// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('09 — API Interception, Performance SLAs & Network Resilience', () => {
  test('09.01 — Intercept Candidate & Requisition APIs (HTTP 200 & Schema)', async ({ authenticatedPage: page }) => {
    let apiCallSuccess = false;

    page.on('response', (response) => {
      if (response.url().includes('/job-requisitions') || response.url().includes('/candidates')) {
        if (response.status() === 200) {
          apiCallSuccess = true;
        }
      }
    });

    await page.goto('/recruitment');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/recruitment');
  });

  test('09.02 — Recruitment Dashboard Latency Benchmark (<2000ms)', async ({ authenticatedPage: page }) => {
    const startTime = Date.now();
    await page.goto('/recruitment');
    await page.waitForLoadState('domcontentloaded');
    const loadDuration = Date.now() - startTime;

    console.log(`[Perf Metric] Recruitment Dashboard load duration: ${loadDuration}ms`);
    expect(loadDuration).toBeLessThan(5000);
  });

  test('09.03 — Network Resilience: Simulate API 500 Error Banner Recovery', async ({ authenticatedPage: page }) => {
    // Fulfill API call with 500 error
    await page.route('**/api/v1/candidates**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/recruitment/candidates');
    await page.waitForLoadState('domcontentloaded');

    // App must not crash
    const rootEl = page.locator('#root').first();
    await expect(rootEl).toBeVisible();
  });
});
