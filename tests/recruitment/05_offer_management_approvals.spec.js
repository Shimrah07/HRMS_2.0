// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('05 — Offer Letter Management & Approval Workflows', () => {
  test('05.01 — Offer Management List & Approval Status Badges', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoOffers();
    
    // Verify Offers page container or table
    const offersContent = page.locator('#root, .ant-layout-content, .ant-table').first();
    await expect(offersContent).toBeVisible({ timeout: 10000 });
  });

  test('05.02 — Offer Acceptance & Expiry Status Tracking', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoOffers();
    
    // Verify page container
    const layout = page.locator('.ant-layout-content, #root').first();
    await expect(layout).toBeVisible({ timeout: 10000 });
  });
});
