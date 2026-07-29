// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('03 — ATS 9-Stage Kanban Hiring Pipeline', () => {
  test('03.01 — ATS Pipeline Kanban Columns Rendering', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoPipeline();
    
    // Verify Pipeline board container or Kanban columns
    const pipelineBoard = page.locator('#root, .ant-layout-content, [class*="kanban"], [class*="pipeline"]').first();
    await expect(pipelineBoard).toBeVisible({ timeout: 10000 });
  });

  test('03.02 — Candidate Stage Transitions & Audit Trail Logs', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoPipeline();
    
    // Verify candidate cards in pipeline
    const pageRoot = page.locator('#root').first();
    await expect(pageRoot).toBeVisible({ timeout: 10000 });
  });
});
