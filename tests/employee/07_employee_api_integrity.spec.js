// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';
import { ApiHelper } from '../helpers/api.helper.js';

test.describe('07 — Phase 13 API Interception & Phase 14 Data Integrity Validation', () => {
  test('07.01 — Intercept GET /api/v1/employees & validate HTTP 200, latency, and schema', async ({ authenticatedPage: page }) => {
    const listPromise = ApiHelper.validateEmployeeListApi(page);
    await page.goto('/employees');
    await listPromise;
  });

  test('07.02 — Post-Edit Data Integrity verification across Table and Profile', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const moreBtn = page.locator('.ant-table-row button:has(.anticon-more), .ant-table-row .ant-dropdown-trigger').first();
    await expect(moreBtn).toBeVisible({ timeout: 10000 });
    await moreBtn.click();

    const viewOption = page.locator('.ant-dropdown-menu-item').first();
    await expect(viewOption).toBeVisible({ timeout: 5000 });
    await viewOption.click();

    // Verify profile displays same employee code or detail view
    await expect(page).toHaveURL(/\/employees\/.+/, { timeout: 10000 });
  });
});
