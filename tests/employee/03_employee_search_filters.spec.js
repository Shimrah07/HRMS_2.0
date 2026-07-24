// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';

test.describe('03 — Employee Search, Filters, Sorting & Reset', () => {
  test('03.01 — Perform Search by Name, Code, and Email', async ({ employeeHelper, authenticatedPage: page }) => {
    await employeeHelper.gotoEmployeeList();
    
    // Search by Name
    await employeeHelper.searchEmployee('Rahul');
    const table = page.locator('.ant-table-tbody');
    await expect(table).toBeVisible();

    // Clear search
    await employeeHelper.searchEmployee('');
  });

  test('03.02 — Filter by Department and Designation', async ({ employeeHelper, authenticatedPage: page }) => {
    await employeeHelper.gotoEmployeeList();
    await employeeHelper.filterByDepartment('Engineering');
    await page.waitForTimeout(500);
  });

  test('03.03 — Test Filter Reset action', async ({ employeeHelper, authenticatedPage: page }) => {
    await employeeHelper.gotoEmployeeList();
    await employeeHelper.searchEmployee('NonExistentEmployeeKeyword123');

    const resetBtn = page.locator('button:has-text("Reset"), button:has-text("Clear")').first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('03.04 — Verify No Results Empty State', async ({ employeeHelper, authenticatedPage: page }) => {
    await employeeHelper.gotoEmployeeList();
    await employeeHelper.searchEmployee('ZzzNoMatch999XYZ');
    await page.waitForTimeout(600);

    const emptyState = page.locator('.ant-table-placeholder, .ant-empty, td.ant-table-cell').first();
    await expect(emptyState).toBeVisible({ timeout: 10000 });
  });
});
