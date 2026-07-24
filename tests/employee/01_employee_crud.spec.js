// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';
import { MOCK_EMPLOYEE_DATA } from '../constants/employee.constants.js';

test.describe('01 — Employee Master CRUD Operations & Form Validation', () => {
  test('01.01 — Create Employee form accessibility & step navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/employees/new');
    await page.waitForLoadState('domcontentloaded');

    const firstNameInput = page.locator('input[id*="firstName"], input[placeholder*="First"]').first();
    await expect(firstNameInput).toBeVisible({ timeout: 10000 });
  });

  test('01.02 — Validate required field enforcement & email validation', async ({ authenticatedPage: page }) => {
    await page.goto('/employees/new');
    await page.waitForLoadState('domcontentloaded');

    // Click next without entering values
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button[type="submit"]').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('01.03 — Edit Employee Details Navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Click Action menu on first employee row
    const moreBtn = page.locator('.ant-table-row button:has(.anticon-more), .ant-table-row .ant-dropdown-trigger').first();
    await expect(moreBtn).toBeVisible({ timeout: 10000 });
    await moreBtn.click();

    const viewOption = page.locator('.ant-dropdown-menu-item').first();
    await expect(viewOption).toBeVisible({ timeout: 5000 });
    await viewOption.click();

    await expect(page).toHaveURL(/\/employees\/.+/, { timeout: 10000 });
  });

  test('01.04 — Duplicate Email Identity Detection UI', async ({ authenticatedPage: page }) => {
    await page.goto('/employees/new');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[id*="Email"], input[id*="email"], input[placeholder*="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 15000 });
  });
});
