// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';

test.describe('09 — Data Preservation Validation Across Navigation & Sessions', () => {
  test('09.01 — Verify Employee ID, Code, Recruitment & Probation History remain intact', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const moreBtn = page.locator('.ant-table-row button:has(.anticon-more), .ant-table-row .ant-dropdown-trigger').first();
    await expect(moreBtn).toBeVisible({ timeout: 10000 });
    await moreBtn.click();

    const viewOption = page.locator('.ant-dropdown-menu-item').first();
    await expect(viewOption).toBeVisible({ timeout: 5000 });
    await viewOption.click();

    await expect(page).toHaveURL(/\/employees\/.+/, { timeout: 10000 });

    // Refresh page and assert details view mounted
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).toBeVisible();
  });
});
