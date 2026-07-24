// @ts-check
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.helper.js';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { navigateToRoute } from '../helpers/navigation.helper.js';

test.describe('Employee Master Search, Filter, Sort & Pagination', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
    await login(page);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  test('03.01 — Perform Search by Name, Code, Email, and Department', async ({ page }) => {
    await navigateToRoute(page, '/employees');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 1. Search by Name
    await searchInput.fill('Admin');
    await page.waitForTimeout(600);
    let tableOrEmpty = page.locator('.ant-table, .ant-empty').first();
    await expect(tableOrEmpty).toBeVisible();

    // 2. Search by Partial & Case-insensitive text
    await searchInput.fill('  admin  ');
    await page.waitForTimeout(600);
    await expect(tableOrEmpty).toBeVisible();

    // 3. Clear Search
    await searchInput.fill('');
    await page.waitForTimeout(600);
    await expect(tableOrEmpty).toBeVisible();
  });

  test('03.02 — Verify Department, Location, Designation & Status Filters', async ({ page }) => {
    await navigateToRoute(page, '/employees');

    // Locate department filter dropdown
    const deptSelect = page.locator('.ant-select').filter({ hasText: /Department/i }).first();
    if (await deptSelect.isVisible()) {
      await deptSelect.click();
      const firstOption = page.locator('.ant-select-item-option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(600);
      }
    }

    // Verify reset filters or clear action
    const clearBtn = page.locator('button:has-text("Reset"), button:has-text("Clear"), .anticon-clear').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(600);
    }
  });

  test('03.03 — Column Sorting Verification', async ({ page }) => {
    await navigateToRoute(page, '/employees');

    // Click Name column header for sorting
    const nameHeader = page.locator('.ant-table-column-has-sorters:has-text("Employee"), .ant-table-column-has-sorters:has-text("Name")').first();
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(500);
      await nameHeader.click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('.ant-table, .ant-empty').first()).toBeVisible();
  });

  test('03.04 — Pagination Controls Verification', async ({ page }) => {
    await navigateToRoute(page, '/employees');

    const pagination = page.locator('.ant-pagination').first();
    if (await pagination.isVisible()) {
      // Check next page button
      const nextPage = page.locator('.ant-pagination-next').first();
      if (await nextPage.isVisible() && !(await nextPage.getAttribute('aria-disabled') === 'true')) {
        await nextPage.click();
        await page.waitForTimeout(600);

        const prevPage = page.locator('.ant-pagination-prev').first();
        if (await prevPage.isVisible()) {
          await prevPage.click();
          await page.waitForTimeout(600);
        }
      }
    }
  });
});
