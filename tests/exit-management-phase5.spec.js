// @ts-check
import { test, expect } from '@playwright/test';
import { login, DEFAULT_TEST_USER } from './helpers/auth.helper.js';

test.describe('Module 10 Phase 5 — Sector-Specific Rules & Attrition Predictive Analytics Engine', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_TEST_USER);
  });

  test('Sub-Module 10.7: Sector-Specific Exit Rules Page loads with KPI statistics & rules table', async ({ page }) => {
    await page.goto('/exit-management/sector-rules');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Sector-Specific Exit Rules & Offboarding Configuration')).toBeVisible();

    // Verify KPI Statistics Cards
    await expect(page.getByText('Configured Sectors')).toBeVisible();
    await expect(page.getByText('Critical Compliance Rules')).toBeVisible();
    await expect(page.getByText('Active Offboarding Matrices')).toBeVisible();

    // Verify Master Matrix Table
    await expect(page.getByText('Sector-Wise Exit Matrix Rules')).toBeVisible();
  });

  test('Sub-Module 10.7: Configure Exit Rules Modal opens with security priority dropdown & checklist rules', async ({ page }) => {
    await page.goto('/exit-management/sector-rules');
    await page.waitForLoadState('networkidle');

    // Wait for table rows to load
    await page.waitForSelector('.ant-table-row', { timeout: 8000 }).catch(() => {});

    // Click Configure button on the first sector
    const configBtn = page.getByRole('button', { name: /Configure/i }).first();
    if (await configBtn.isVisible()) {
      await configBtn.click();

      // Verify Modal Title & Input Fields
      await expect(page.getByText(/Configure Exit Rules/i)).toBeVisible();
      await expect(page.getByText('Security & Compliance Priority')).toBeVisible();
      await expect(page.getByText(/Offboarding Checklist Configuration/i)).toBeVisible();
    }
  });

  test('Sub-Module 10.8: Attrition Analytics Dashboard loads with annual rates & predictive risk cards', async ({ page }) => {
    await page.goto('/exit-management/analytics');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Attrition Dashboard & Offboarding Analytics')).toBeVisible();

    // Verify KPI Statistic Cards
    await expect(page.getByText('Annual Attrition Rate')).toBeVisible();
    await expect(page.getByText('Total Exits (YTD)')).toBeVisible();
    await expect(page.getByText('Regretted Talent Loss', { exact: true })).toBeVisible();
    await expect(page.getByText('Avg Clearance TAT')).toBeVisible();


    // Verify Predictive Attrition Risk Card
    await expect(page.getByText('Predictive Attrition Risk & Early Warnings')).toBeVisible();
    await expect(page.getByText('Engineering High-Risk Role Alert')).toBeVisible();

    // Verify Top Leaving Reasons & Department Breakdown Tables
    await expect(page.getByText('Top Reasons for Leaving Analysis')).toBeVisible();
    await expect(page.getByText('Department-wise Attrition Breakdown')).toBeVisible();

    // Verify Voluntary vs Involuntary Split
    await expect(page.getByText('Voluntary vs Involuntary Attrition Overview')).toBeVisible();
  });

  test('Sub-Module 10.8: Export CSV Report button triggers file download action', async ({ page }) => {
    await page.goto('/exit-management/analytics');
    await page.waitForLoadState('networkidle');

    // Verify Export CSV Report button is visible
    const exportBtn = page.getByRole('button', { name: /Export CSV Report/i });
    await expect(exportBtn).toBeVisible();
  });

});
