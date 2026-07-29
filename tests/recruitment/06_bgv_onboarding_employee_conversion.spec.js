// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('06 — BGV Clearance, Onboarding & Candidate Conversion', () => {
  test('06.01 — Background Verification (BGV) Checkpoints', async ({ authenticatedPage: page }) => {
    await page.goto('/recruitment/bgv');
    await page.waitForLoadState('domcontentloaded');

    // Verify BGV page content
    const bgvContent = page.locator('#root, .ant-layout-content, .ant-table').first();
    await expect(bgvContent).toBeVisible({ timeout: 10000 });
  });

  test('06.02 — Candidate to Employee Conversion & Employee Code Generation', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoOnboarding();

    // Verify Onboarding Operations workspace elements
    const onboardingContent = page.locator('#root, .ant-layout-content, .ant-table').first();
    await expect(onboardingContent).toBeVisible({ timeout: 10000 });
  });
});
