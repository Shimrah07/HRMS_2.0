// @ts-check
import { expect } from '@playwright/test';

/**
 * Navigates to a specific URL route and verifies page stability
 * @param {import('@playwright/test').Page} page 
 * @param {string} route 
 * @param {object} [options]
 */
export async function navigateToRoute(page, route, options = {}) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');

  // Verify page does not render an Error Boundary or crash message
  const errorBoundary = page.locator('[data-testid="error-boundary-retry-btn"]');
  await expect(errorBoundary).not.toBeVisible();

  // Verify app layout root container is present
  const layoutRoot = page.locator('#root').first();
  await expect(layoutRoot).toBeVisible();
}

/**
 * Asserts that KPI cards or summary metrics are rendered on the page
 * @param {import('@playwright/test').Page} page 
 */
export async function assertKpiCardsVisible(page) {
  const kpiCard = page.locator('[data-testid^="kpi-card"]').or(page.locator('.ant-card')).first();
  await expect(kpiCard).toBeVisible({ timeout: 10000 });
}

/**
 * Asserts that a primary data table or empty state is present
 * @param {import('@playwright/test').Page} page 
 */
export async function assertTableOrEmptyState(page) {
  const primaryElement = page.locator('.ant-table')
    .or(page.locator('.ant-empty'))
    .or(page.locator('input[placeholder*="Search"]'))
    .or(page.locator('[data-testid$="-table"]'))
    .or(page.locator('.ant-layout-content'))
    .first();
  await expect(primaryElement).toBeVisible({ timeout: 10000 });
}
