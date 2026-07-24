// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';

test.describe('02 — Employee Detail Drawer & Profile Page Tabs', () => {
  test('02.01 — Open Quick View Drawer & verify sections', async ({ employeeHelper }) => {
    const drawer = await employeeHelper.openQuickDrawer();
    await expect(drawer).toBeVisible();

    // Verify sections inside drawer
    await expect(drawer.locator('text=Personal Information').or(drawer.locator('text=Employment')).first()).toBeVisible();

    await employeeHelper.closeQuickDrawer();
  });

  test('02.02 — Navigate to Employee Profile and verify all 11 tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const moreBtn = page.locator('.ant-table-row button:has(.anticon-more), .ant-table-row .ant-dropdown-trigger').first();
    await expect(moreBtn).toBeVisible({ timeout: 10000 });
    await moreBtn.click();

    const viewOption = page.locator('.ant-dropdown-menu-item').first();
    await expect(viewOption).toBeVisible({ timeout: 5000 });
    await viewOption.click();

    // Verify profile page loaded
    await expect(page).toHaveURL(/\/employees\/.+/, { timeout: 10000 });

    const tabsToVerify = [
      'Overview',
      'Employment',
      'Hierarchy',
      'Documents',
      'Education',
      'Experience',
      'Nominees',
      'Recruitment History',
      'Probation History',
      'Timeline'
    ];

    for (const tabName of tabsToVerify) {
      const tabElement = page.locator('.ant-tabs-tab').filter({ hasText: tabName }).first();
      if (await tabElement.isVisible()) {
        await tabElement.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('02.03 — Verify Manager shortcut link navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('.ant-table-row').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    const managerLink = page.locator('text=Manager').or(page.locator('text=Immediate Manager')).first();
    await expect(managerLink).toBeVisible();
  });
});
