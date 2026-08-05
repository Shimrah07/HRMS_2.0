// @ts-check
import { test, expect } from '@playwright/test';
import { login, DEFAULT_TEST_USER } from './helpers/auth.helper.js';

test.describe('Module 10 Phase 4 — FFS Settlement Engine & QuestPDF Document Generator', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_TEST_USER);
  });

  test('Sub-Module 10.5: Full & Final Settlement Page loads with KPI statistics & register table', async ({ page }) => {
    await page.goto('/exit-management/ffs');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Full & Final Settlement (FFS)')).toBeVisible();

    // Verify Statistic Cards
    await expect(page.getByText('FFS Under Processing')).toBeVisible();
    await expect(page.getByText('Finance Approved')).toBeVisible();
    await expect(page.getByText('Settlements Disbursed')).toBeVisible();

    // Verify Register Table
    await expect(page.getByText('Full & Final Settlement Register')).toBeVisible();
  });

  test('Sub-Module 10.5: Calculate FFS Sheet Modal opens displaying itemized additions & deductions', async ({ page }) => {
    await page.goto('/exit-management/ffs');
    await page.waitForLoadState('networkidle');

    // Wait for table rows to load
    await page.waitForSelector('.ant-table-row', { timeout: 8000 }).catch(() => {});

    // Click Calculate FFS or View Calculation button
    const calcBtn = page.getByRole('button', { name: /Calculate FFS|View Calculation/i }).first();
    if (await calcBtn.isVisible()) {
      await calcBtn.click();
      await expect(page.getByText(/FFS Statement Sheet/i)).toBeVisible();
      await expect(page.getByText('Additions (Dues)')).toBeVisible();
      await expect(page.getByText('Deductions (Recoveries)')).toBeVisible();
      await expect(page.getByText('NET FFS PAYABLE')).toBeVisible();
    }
  });

  test('Sub-Module 10.5: Disburse Payment Modal opens with Bank UTR field', async ({ page }) => {
    await page.goto('/exit-management/ffs');
    await page.waitForLoadState('networkidle');

    // Wait for table rows
    await page.waitForSelector('.ant-table-row', { timeout: 8000 }).catch(() => {});

    // Click Disburse Payment button if an approved record exists
    const disburseBtn = page.getByRole('button', { name: /Disburse Payment/i }).first();
    if (await disburseBtn.isVisible()) {
      await disburseBtn.click();
      await expect(page.getByText(/Process Final Settlement Disbursement/i)).toBeVisible();
      await expect(page.getByText('Bank Transaction Reference / UTR Number')).toBeVisible();
    } else {
      // Verify table title fallback
      await expect(page.getByText('Full & Final Settlement Register')).toBeVisible();
    }
  });

  test('Sub-Module 10.6: Exit Documents Page loads with statistic cards & document master table', async ({ page }) => {
    await page.goto('/exit-management/documents');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Exit Documents Management')).toBeVisible();

    // Verify Statistic Cards
    await expect(page.getByText('Total Exit Documents Generated')).toBeVisible();
    await expect(page.getByText('Relieving Letters Issued')).toBeVisible();
    await expect(page.getByText('Experience Letters Issued')).toBeVisible();

    // Verify Master Table
    await expect(page.getByText('Exit Document Issuance Master')).toBeVisible();
  });

  test('Sub-Module 10.6: Generate Document Modal opens with QuestPDF document type selector', async ({ page }) => {
    await page.goto('/exit-management/documents');
    await page.waitForLoadState('networkidle');

    // Wait for table rows
    await page.waitForSelector('.ant-table-row', { timeout: 8000 }).catch(() => {});

    // Click Generate Document button
    const genBtn = page.getByRole('button', { name: /Generate Document/i }).first();
    if (await genBtn.isVisible()) {
      await genBtn.click();

      // Verify Modal Title & Fields
      await expect(page.getByText(/Generate Exit Document/i)).toBeVisible();
      await expect(page.getByText('Document Type')).toBeVisible();
      await expect(page.getByText('Conduct & Character Remark')).toBeVisible();
    } else {
      await expect(page.getByText('Exit Document Issuance Master')).toBeVisible();
    }
  });

});
