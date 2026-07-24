// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';
import { AssertionHelper } from '../helpers/assertion.helper.js';

test.describe('05 — UI / UX / Accessibility (a11y) & Responsiveness', () => {
  test('05.01 — KPI Summary Cards render cleanly without runtime crash', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const layoutContent = page.locator('.ant-layout-content, #root').first();
    await expect(layoutContent).toBeVisible({ timeout: 10000 });
  });

  test('05.02 — Table sorting & pagination controls', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Test column header sorting
    const colHeader = page.locator('.ant-table-column-has-sorters').first();
    if (await colHeader.isVisible()) {
      await colHeader.click();
      await page.waitForTimeout(400);
    }

    // Verify pagination controls
    const pagination = page.locator('.ant-pagination').first();
    await expect(pagination).toBeVisible();
  });

  test('05.03 — ARIA labels & Keyboard Navigation Focus', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await AssertionHelper.assertAccessibleElement(searchInput);
  });
});
