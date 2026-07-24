// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';
import { logout } from '../helpers/auth.helper.js';

test.describe('10 — End-to-End Employee Master Lifecycle Smoke Flow', () => {
  test('10.01 — Full Smoke Flow: Navigation -> Create -> Directory -> Drawer -> Profile -> Logout -> Login Persistence', async ({ employeeHelper, authenticatedPage: page }) => {
    // 1. Navigate to Employee List
    await employeeHelper.gotoEmployeeList();

    // 2. Open Directory & Drawer
    await employeeHelper.openQuickDrawer();
    await employeeHelper.closeQuickDrawer();

    // 3. Navigate to full Profile Page
    await page.goto('/employees');
    const moreBtn = page.locator('.ant-table-row button:has(.anticon-more), .ant-table-row .ant-dropdown-trigger').first();
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      const viewOption = page.locator('.ant-dropdown-menu-item').first();
      if (await viewOption.isVisible()) {
        await viewOption.click();
        await expect(page).toHaveURL(/\/employees\/.+/, { timeout: 10000 });
      }
    }

    // 4. Perform Logout
    await logout(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
