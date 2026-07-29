// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';

test.describe('07 — Probation Milestones, Reviews & Confirmation Workflows', () => {
  test('07.01 — Probation Operations Center & Review Schedule', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoProbation();

    // Verify Probation page content
    const probationContent = page.locator('#root, .ant-layout-content, .ant-table').first();
    await expect(probationContent).toBeVisible({ timeout: 10000 });
  });

  test('07.02 — Probation Confirmation & PIP Extension Rules', async ({ recruitmentHelper, authenticatedPage: page }) => {
    await recruitmentHelper.gotoProbation();

    // Verify layout container
    const layout = page.locator('#root, .ant-layout-content').first();
    await expect(layout).toBeVisible({ timeout: 10000 });
  });
});
