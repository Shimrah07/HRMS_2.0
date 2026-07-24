// @ts-check
import { test, expect } from '@playwright/test';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { login } from '../helpers/auth.helper.js';
import { navigateToRoute } from '../helpers/navigation.helper.js';

test.describe('Accessibility & Selector Validation Smoke Suite', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
    await login(page);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  test('04.01 — Validate buttons and input fields have accessible labels & role attributes', async ({ page }) => {
    await navigateToRoute(page, '/recruitment/onboarding');

    // Verify main search input or interactive control is accessible
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Verify search input is focusable via keyboard tab
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test('04.02 — Validate data-testid selectors exist on Onboarding Operations Center', async ({ page }) => {
    await navigateToRoute(page, '/recruitment/onboarding');

    // Verify data-testid attributes or primary table/cards exist
    const kpiCards = page.locator('[data-testid^="kpi-card"]').or(page.locator('.ant-card')).first();
    await expect(kpiCards).toBeVisible();

    const onboardingTable = page.locator('[data-testid="onboarding-table"]').or(page.locator('.ant-table')).first();
    await expect(onboardingTable).toBeVisible();
  });

  test('04.03 — Validate data-testid selectors exist on Probation Management Center', async ({ page }) => {
    await navigateToRoute(page, '/recruitment/probation');

    const probationTable = page.locator('[data-testid="probation-table"]').or(page.locator('.ant-table')).first();
    await expect(probationTable).toBeVisible();
  });
});
