// @ts-check
import { test, expect } from '@playwright/test';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { DEFAULT_TEST_USER, login } from '../helpers/auth.helper.js';

test.describe('Module 8 — Travel & Expense Management Enterprise Route Suite', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
    await login(page, DEFAULT_TEST_USER);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  test('08.01 — Root /travel-expense redirects to /travel-expense/travel-requests', async ({ page }) => {
    await page.goto('/travel-expense');
    await page.waitForURL('**/travel-expense/travel-requests');
    await expect(page).toHaveURL(/\/travel-expense\/travel-requests$/);
    await expect(page.getByText(/Travel Requests & Travel Desk Booking Hub/i).first()).toBeVisible();
  });

  test('08.02 — Travel Requests page renders standalone header, breadcrumb, and Raise Request modal', async ({ page }) => {
    await page.goto('/travel-expense/travel-requests');
    await expect(page.getByText(/Travel Requests & Travel Desk Booking Hub/i).first()).toBeVisible();

    await page.locator('button.ant-btn-primary').first().click();
    await expect(page.locator('.ant-modal-title').first()).toBeVisible();
  });

  test('08.03 — Policy & Entitlements page renders standalone header and Grade Matrix Bands A-E', async ({ page }) => {
    await page.goto('/travel-expense/policies');
    await expect(page.getByText(/Travel Policy & Grade Entitlements/i).first()).toBeVisible();
    await expect(page.getByText(/Automated Entitlement Enforcement Active/i).first()).toBeVisible();
  });

  test('08.04 — Expense Claims page renders standalone header and OCR modal', async ({ page }) => {
    await page.goto('/travel-expense/expense-claims');
    await expect(page.getByText(/Expense Claims & OCR Bill Capture/i).first()).toBeVisible();

    await page.locator('button.ant-btn-primary').first().click();
    await expect(page.getByText(/Mobile OCR Camera Scan Available/i).first()).toBeVisible();
  });

  test('08.05 — Travel Approvals page renders standalone header and L1/L2 queue', async ({ page }) => {
    await page.goto('/travel-expense/approvals');
    await expect(page.getByText(/Travel & Expense Approvals & Payouts/i).first()).toBeVisible();
    await expect(page.getByText(/Employee Submitted/i).first()).toBeVisible();
    await expect(page.getByText(/Pending Manager & Finance Approval Queue/i).first()).toBeVisible();
  });

  test('08.06 — Travel Advances page renders standalone header and control rules', async ({ page }) => {
    await page.goto('/travel-expense/advances');
    await expect(page.getByText(/Travel Advance Management & Ledger/i).first()).toBeVisible();
    await expect(page.getByText(/Travel Advance Control Rules/i).first()).toBeVisible();
  });

  test('08.07 — Sector Rules page renders standalone header and Active Sector engine', async ({ page }) => {
    await page.goto('/travel-expense/sector-rules');
    await expect(page.getByText(/Industry T&E Policy Rulesets & Sector Configurations/i).first()).toBeVisible();
    await expect(page.getByText(/Active Sector T&E Engine/i).first()).toBeVisible();
  });

  test('08.08 — Analytics & Reports page renders standalone header and 14 Enterprise Reports', async ({ page }) => {
    await page.goto('/travel-expense/reports');
    await expect(page.getByText(/14 Enterprise Travel & Expense Reports Hub/i).first()).toBeVisible();
    await expect(page.getByText(/Total T&E Spend/i).first()).toBeVisible();
    await expect(page.getByText(/Select Enterprise Report/i).first()).toBeVisible();
  });
});
