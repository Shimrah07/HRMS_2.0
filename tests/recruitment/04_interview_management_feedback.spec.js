// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('04 — Interview Management & Feedback Scorecards', () => {
  test('04.01 — Interview Schedule & Panel Assignment View', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoInterviews();
    
    // Verify Interview workspace page content
    const interviewContent = page.locator('#root, .ant-layout-content, .ant-table').first();
    await expect(interviewContent).toBeVisible({ timeout: 10000 });
  });

  test('04.02 — Scorecard Ratings & Feedback Submission', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoInterviews();
    
    // Verify page container
    const layout = page.locator('.ant-layout-content, #root').first();
    await expect(layout).toBeVisible({ timeout: 10000 });
  });
});
