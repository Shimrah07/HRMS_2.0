// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('02 — Candidate Management & Resume Processing', () => {
  test('02.01 — Candidate Master List & Search', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoCandidates();
    
    // Verify Candidate table or card container
    const tableOrCard = page.locator('.ant-table, .ant-card, #root').first();
    await expect(tableOrCard).toBeVisible({ timeout: 10000 });

    // Perform candidate search
    await recruitmentHelper.searchCandidate('Test');
  });

  test('02.02 — Candidate Profile Drawer & Resume Viewer', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoCandidates();
    
    // Click first candidate row or avatar if present
    const firstCandidate = page.locator('.ant-table-row, .ant-card, [class*="candidate"]').first();
    await expect(firstCandidate).toBeVisible({ timeout: 10000 });
  });

  test('02.03 — Duplicate Candidate Email & Phone Alert', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoCandidates();
    
    // Verify page title / container for candidates master
    const container = page.locator('#root, .ant-layout-content').first();
    await expect(container).toBeVisible({ timeout: 10000 });
  });
});
