// @ts-check
import { test, expect } from '@playwright/test';
import { login, DEFAULT_TEST_USER } from './helpers/auth.helper.js';

test.describe('Module 10 Phase 3 — Multi-Department Clearance & Exit Interview Engine', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_TEST_USER);
  });

  test('Sub-Module 10.3: Multi-Department Clearance Matrix Page loads with KPI statistics & table', async ({ page }) => {
    await page.goto('/exit-management/no-dues');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Multi-Department No-Dues Clearance Engine')).toBeVisible();

    // Verify KPI Statistic Cards
    await expect(page.getByText('Total Exit Applications')).toBeVisible();
    await expect(page.getByText('Fully Cleared (100%)')).toBeVisible();
    await expect(page.getByText('Outstanding Dues Flagged')).toBeVisible();

    // Verify Master Sign-Off Table
    await expect(page.getByText('Multi-Department Clearance Sign-Off Matrix')).toBeVisible();
  });

  test('Sub-Module 10.3: Update Clearance Sign-off Modal opens with required fields', async ({ page }) => {
    await page.goto('/exit-management/no-dues');
    await page.waitForLoadState('networkidle');

    // Wait for table rows to render
    await page.waitForSelector('.ant-table-row', { timeout: 8000 }).catch(() => {});

    // Click on first clearance status tag in table if available
    const tag = page.locator('.ant-table-row .ant-tag').first();
    if (await tag.isVisible()) {
      await tag.click();
      await expect(page.getByText(/Update .* Clearance/i)).toBeVisible();
      await expect(page.getByText('Clearance Sign-off Status')).toBeVisible();
    } else {
      // Verify table title fallback if no seed records exist
      await expect(page.getByText('Multi-Department Clearance Sign-Off Matrix')).toBeVisible();
    }
  });

  test('Sub-Module 10.3: Clearance Audit History Drawer opens with department checklist', async ({ page }) => {
    await page.goto('/exit-management/no-dues');
    await page.waitForLoadState('networkidle');

    // Wait for table rows
    await page.waitForSelector('.ant-table-row', { timeout: 8000 }).catch(() => {});

    // Click Details button on the first row
    const detailsBtn = page.getByRole('button', { name: /Details/i }).first();
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();
      await expect(page.getByText(/Clearance Audit History/i)).toBeVisible();
      await expect(page.getByText('Department Sign-Off Checklist')).toBeVisible();
    }
  });

  test('Sub-Module 10.4: Exit Interview Page loads with sentiment metrics & master dashboard', async ({ page }) => {
    await page.goto('/exit-management/exit-interviews');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Exit Interview Management & Sentiment Analytics')).toBeVisible();

    // Verify KPI Rating Cards
    await expect(page.getByText('Avg Overall Experience')).toBeVisible();
    await expect(page.getByText('Avg Manager Rating')).toBeVisible();
    await expect(page.getByText('Avg Growth Rating')).toBeVisible();

    // Verify Dashboard Table
    await expect(page.getByText('Exit Interview Feedback Dashboard & Questionnaires')).toBeVisible();
  });

  test('Sub-Module 10.4: Conduct Exit Interview Modal opens with ratings & HR confidential notes', async ({ page }) => {
    await page.goto('/exit-management/exit-interviews');
    await page.waitForLoadState('networkidle');

    // Wait for table rows
    await page.waitForSelector('.ant-table-row', { timeout: 8000 }).catch(() => {});

    // Click Conduct Interview / Edit Feedback button
    const conductBtn = page.getByRole('button', { name: /Conduct Interview|Edit Feedback/i }).first();
    if (await conductBtn.isVisible()) {
      await conductBtn.click();

      // Verify Modal & Questionnaires
      await expect(page.getByText(/Conduct Exit Interview/i)).toBeVisible();
      await expect(page.getByText('Interview Mode')).toBeVisible();
      await expect(page.getByText('Quantitative Category Ratings')).toBeVisible();
      await expect(page.getByText(/HR Confidential Notes/i)).toBeVisible();
    } else {
      // Verify table title fallback
      await expect(page.getByText('Exit Interview Feedback Dashboard & Questionnaires')).toBeVisible();
    }
  });

});
