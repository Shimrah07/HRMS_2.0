// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';
import { ScreenshotHelper } from '../helpers/screenshot.helper.js';

test.describe('06 — Performance Benchmarks & Visual Screenshot Capture', () => {
  test('06.01 — Employee List page load latency benchmark (<2000ms)', async ({ authenticatedPage: page }) => {
    const startTime = Date.now();
    await page.goto('/employees');
    await page.waitForLoadState('domcontentloaded');
    const loadDuration = Date.now() - startTime;

    console.log(`[Perf Metric] Employee List page load duration: ${loadDuration}ms`);
    expect(loadDuration).toBeLessThan(2000);
  });

  test('06.02 — Capture Visual Regression Screenshots', async ({ employeeHelper, authenticatedPage: page }) => {
    // 1. Employee Directory Grid Screenshot
    await employeeHelper.gotoEmployeeDirectory();
    await ScreenshotHelper.capture(page, 'directory_grid');

    // 2. Quick Drawer Screenshot
    await employeeHelper.openQuickDrawer();
    await ScreenshotHelper.capture(page, 'employee_detail_drawer');
    await employeeHelper.closeQuickDrawer();

    // 3. Employee List Table Screenshot
    await employeeHelper.gotoEmployeeList();
    await ScreenshotHelper.capture(page, 'kpi_dashboard');
  });
});
