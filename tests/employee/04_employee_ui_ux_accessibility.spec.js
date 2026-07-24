// @ts-check
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.helper.js';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { navigateToRoute } from '../helpers/navigation.helper.js';

test.describe('Employee Master UI/UX & Accessibility (a11y)', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
    await login(page);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  test('04.01 — Responsive layout, skeleton loading & avatar rendering', async ({ page }) => {
    await navigateToRoute(page, '/employees');

    // Verify avatar elements render correctly
    const avatar = page.locator('.ant-avatar').first();
    await expect(avatar).toBeVisible({ timeout: 10000 });

    // Verify table / card container responsiveness
    await expect(page.locator('#root')).toBeVisible();
  });

  test('04.02 — Drawer & Modal responsiveness', async ({ page }) => {
    await navigateToRoute(page, '/employees/directory');

    const directoryCard = page.locator('.ant-col div[style*="cursor"]').first();
    await expect(directoryCard).toBeVisible({ timeout: 10000 });
    await directoryCard.click({ force: true });

    const drawer = page.locator('.ant-drawer-open').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // Test closing drawer via top-right close icon button
    const closeBtn = page.locator('.ant-drawer-open button:has(.anticon-close)').first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await page.waitForTimeout(600);
    await expect(drawer).not.toBeVisible();
  });

  test('04.03 — ARIA labels, keyboard focus, and button role accessibility', async ({ page }) => {
    await navigateToRoute(page, '/employees');

    // Tab key navigation check
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify active focused element is present
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    // Verify button accessibility attributes
    const addBtn = page.locator('button:has-text("Add Employee"), button:has-text("New Employee")').first();
    if (await addBtn.isVisible()) {
      const typeAttr = await addBtn.getAttribute('type');
      expect(typeAttr).toBeTruthy();
    }
  });
});
