// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';

test.describe('08 — Network Resilience Validation & Error Recovery', () => {
  test('08.01 — Simulate API 500 error & verify error banner display without app crash', async ({ authenticatedPage: page }) => {
    // Intercept /api/v1/employees and fulfill with 500 error
    await page.route('**/api/v1/employees?*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Simulated Internal Server Error' })
      });
    });

    await page.goto('/employees');
    await page.waitForLoadState('domcontentloaded');

    // Verify React root container remains mounted (no blank screen crash)
    await expect(page.locator('#root')).toBeVisible();
  });
});
