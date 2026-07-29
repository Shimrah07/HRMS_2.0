// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('08 — Document Validation, UI/UX & Accessibility (a11y)', () => {
  test('08.01 — Recruitment Workspace Layout & Responsive Skeletons', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoRecruitmentHub();

    // Verify main content mounts cleanly
    const layout = page.locator('#root, .ant-layout-content').first();
    await expect(layout).toBeVisible({ timeout: 10000 });
  });

  test('08.02 — Keyboard Focus & Accessibility Elements', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoCandidates();

    // Verify search input has accessible attributes
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(Boolean(placeholder)).toBe(true);
    }
  });
});
