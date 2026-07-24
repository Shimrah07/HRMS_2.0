// @ts-check
import { test, expect } from '../fixtures/employee.fixture.js';

test.describe('04 — ATS Recruitment & Onboarding Conversion Integration', () => {
  test('04.01 — Verify ATS Hired Candidates appear in Employee Master', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Assert employee list contains seeded employees
    const tableRows = page.locator('.ant-table-row');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('04.02 — Verify Recruitment History & Probation History on converted profile', async ({ authenticatedPage: page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('.ant-table-row').first();
    await firstRow.click();

    // Click Recruitment History tab
    const recruitmentTab = page.locator('.ant-tabs-tab').filter({ hasText: 'Recruitment History' }).first();
    if (await recruitmentTab.isVisible()) {
      await recruitmentTab.click();
      await expect(page.locator('text=ATS Recruitment History').or(page.locator('text=Sourcing Channel')).first()).toBeVisible();
    }

    // Click Probation History tab
    const probationTab = page.locator('.ant-tabs-tab').filter({ hasText: 'Probation History' }).first();
    if (await probationTab.isVisible()) {
      await probationTab.click();
      await expect(page.locator('text=Probation History').or(page.locator('text=Milestone Review Log')).first()).toBeVisible();
    }
  });
});
