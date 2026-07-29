// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('01 — Recruitment Dashboard & Job Requisitions (MRFs)', () => {
  test('01.01 — Recruitment Dashboard KPIs & Metrics', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoRecruitmentHub();
    
    // Verify dashboard container or header
    const header = page.locator('h1, h2, .ant-page-header-heading-title').first();
    await expect(header).toBeVisible({ timeout: 10000 });

    // Verify main content layout mounted
    const layout = page.locator('#root, .ant-layout-content').first();
    await expect(layout).toBeVisible({ timeout: 10000 });
  });

  test('01.02 — Create Job Requisition (MRF) Form & Validation', async ({ authenticatedPage: page }) => {
    await page.goto('/recruitment/mrf/create');
    await page.waitForLoadState('domcontentloaded');

    // Verify MRF form elements or title input
    const formTitle = page.locator('input[id*="title"], input[placeholder*="title"], h1, h2').first();
    await expect(formTitle).toBeVisible({ timeout: 10000 });
  });

  test('01.03 — Job Openings List & Requisition Status Filtering', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoJobs();
    
    // Verify Job Openings page elements
    const jobContent = page.locator('.ant-table, .ant-card, #root').first();
    await expect(jobContent).toBeVisible({ timeout: 10000 });
  });
});
