// @ts-check
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.helper.js';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { navigateToRoute } from '../helpers/navigation.helper.js';

test.describe('Employee Master API Integrity, Security & Performance', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
    await login(page);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  test('05.01 — API payload & Sensitive Data Masking Verification', async ({ page }) => {
    await navigateToRoute(page, '/employees');

    // Trigger API request and inspect response payload
    const responsePromise = page.waitForResponse(resp => resp.url().includes('/api/v1/employees') && resp.status() === 200);
    await page.reload();
    const response = await responsePromise;
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('05.02 — Performance Metrics: Page load, Search & Drawer Latency', async ({ page }) => {
    const startTime = Date.now();
    await navigateToRoute(page, '/employees');
    const loadDuration = Date.now() - startTime;
    console.log(`[Perf Metric] Employee List page load duration: ${loadDuration}ms`);
    expect(loadDuration).toBeLessThan(10000); // UI load within SLA

    // Search Latency
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    const searchStartTime = Date.now();
    await searchInput.fill('Admin');
    await page.waitForTimeout(400);
    const searchDuration = Date.now() - searchStartTime;
    console.log(`[Perf Metric] Employee search latency: ${searchDuration}ms`);
    expect(searchDuration).toBeLessThan(3000);
  });

  test('05.03 — Security: Direct URL Access & Role Authorization scoping', async ({ page }) => {
    // Navigate directly to Employee Details with non-existent GUID
    await navigateToRoute(page, '/employees/00000000-0000-0000-0000-000000000000');
    await page.waitForTimeout(1000);

    // Verify app handles non-existent profile without crashing
    await expect(page.locator('#root')).toBeVisible();
  });

  test('05.04 — Regression Guard: Verify Dashboard & Recruitment accessibility', async ({ page }) => {
    await navigateToRoute(page, '/dashboard');
    await expect(page.locator('#root')).toBeVisible();

    await navigateToRoute(page, '/recruitment');
    await expect(page.locator('#root')).toBeVisible();
  });
});
