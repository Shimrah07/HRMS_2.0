// @ts-check
import { test, expect } from '@playwright/test';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { login } from '../helpers/auth.helper.js';
import { assertKpiCardsVisible } from '../helpers/navigation.helper.js';

test.describe('Dashboard Smoke Test Suite', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
    await login(page);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  test('02.01 — Dashboard loads successfully with header and sidebar', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify header and sidebar elements
    const sidebar = page.locator('.ant-layout-sider').or(page.locator('aside')).first();
    const header = page.locator('.ant-layout-header').or(page.locator('header')).first();

    await expect(sidebar).toBeVisible();
    await expect(header).toBeVisible();
  });

  test('02.02 — KPI cards and statistics render without runtime crash', async ({ page }) => {
    await assertKpiCardsVisible(page);

    // Assert main content area is present and error boundary is not triggered
    const errorBoundary = page.locator('[data-testid="error-boundary-retry-btn"]');
    await expect(errorBoundary).not.toBeVisible();
  });
});
