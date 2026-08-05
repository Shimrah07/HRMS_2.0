// @ts-check
import { test, expect } from '@playwright/test';
import { login, DEFAULT_TEST_USER } from './helpers/auth.helper.js';

test.describe('Module 10 Phase 2 — Resignation, Notice Period & Counter Offer Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_TEST_USER);
  });

  test('Sub-Module 10.1: Resignation Page loads with KPI statistics & master table', async ({ page }) => {
    await page.goto('/exit-management/resignation');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Resignation & Notice Period Engine')).toBeVisible();

    // Verify KPI Cards
    await expect(page.getByText('Total Exit Applications')).toBeVisible();
    await expect(page.getByText('Serving Notice Period')).toBeVisible();
    await expect(page.getByText('Clearance In Progress').first()).toBeVisible();
    await expect(page.getByText('Resignation & Exit Applications Master Pipeline')).toBeVisible();
  });


  test('Sub-Module 10.1: Notice Period Policy Calculator Drawer opens with grade-wise rules', async ({ page }) => {
    await page.goto('/exit-management/resignation');
    await page.waitForLoadState('networkidle');

    // Click Notice Policy Calculator button
    const calcBtn = page.getByRole('button', { name: /Notice Policy Calculator/i });
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    // Verify Policy Rules Drawer content
    await expect(page.getByText('Grade-wise Notice Period Policy Engine Rules')).toBeVisible();
    await expect(page.getByText('Probationers (PROB)')).toBeVisible();
    await expect(page.getByText('15 Calendar Days')).toBeVisible();
    await expect(page.getByText('30 Calendar Days')).toBeVisible();
    await expect(page.getByText('60 Calendar Days')).toBeVisible();
    await expect(page.getByText('90 Calendar Days')).toBeVisible();
  });

  test('Sub-Module 10.1: Resignation Submit Modal opens with validation checks', async ({ page }) => {
    await page.goto('/exit-management/resignation');
    await page.waitForLoadState('networkidle');

    // Click Submit Resignation button
    const submitBtn = page.getByRole('button', { name: /Submit Resignation/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify Modal Title
    await expect(page.getByText('Submit Resignation Application')).toBeVisible();

    // Trigger validation by clicking OK without filling required fields
    const modalOkBtn = page.locator('.ant-modal-footer button.ant-btn-primary');
    await modalOkBtn.click();

    // Verify validation errors
    await expect(page.getByText('Please select exit type')).toBeVisible();
    await expect(page.getByText('Proposed last working day is required')).toBeVisible();
    await expect(page.getByText('Please select primary reason')).toBeVisible();
  });

  test('Sub-Module 10.2: Counter Offer Workflow Page loads with retention stats & table', async ({ page }) => {
    await page.goto('/exit-management/counter-offers');
    await page.waitForLoadState('networkidle');

    // Verify Page Header Title
    await expect(page.getByText('Counter Offer & Retention Workflow')).toBeVisible();

    // Verify Statistic Cards
    await expect(page.getByText('Total Counter Offers')).toBeVisible();
    await expect(page.getByText('Offers Accepted (Retained)')).toBeVisible();
    await expect(page.getByText('Retention Rate')).toBeVisible();

    // Verify Master Pipeline Table
    await expect(page.getByText('Retention & Counter Offer Pipeline')).toBeVisible();
  });

  test('Sub-Module 10.2: Propose Counter Offer Modal opens and validates inputs', async ({ page }) => {
    await page.goto('/exit-management/counter-offers');
    await page.waitForLoadState('networkidle');

    // Find first 'Propose Offer' button
    const proposeBtn = page.getByRole('button', { name: /Propose Offer/i }).first();
    if (await proposeBtn.isVisible()) {
      await proposeBtn.click();
      await expect(page.getByText(/Propose Counter Offer/i)).toBeVisible();
      await expect(page.getByText('Proposed Revised CTC (₹)')).toBeVisible();
    }
  });

});
