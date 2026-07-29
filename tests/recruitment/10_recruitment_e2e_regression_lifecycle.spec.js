// @ts-check
import { test, expect } from '../fixtures/recruitment.fixture.js';
import { logout } from '../helpers/auth.helper.js';

test.describe('10 — End-to-End Recruitment Lifecycle Smoke Flow', () => {
  test('10.01 — Full Smoke Flow: Navigation -> Candidates -> Pipeline -> Offers -> Onboarding -> Logout', async ({ recruitmentHelper, authenticatedPage: page }) => {
    // 1. Navigate to Recruitment Hub
    await recruitmentHelper.gotoRecruitmentHub();
    await expect(page).toHaveURL(/\/recruitment/);

    // 2. Navigate to Candidates
    await recruitmentHelper.gotoCandidates();
    await expect(page).toHaveURL(/\/recruitment\/candidates/);

    // 3. Navigate to Pipeline
    await recruitmentHelper.gotoPipeline();
    await expect(page).toHaveURL(/\/recruitment\/pipeline/);

    // 4. Navigate to Offers
    await recruitmentHelper.gotoOffers();
    await expect(page).toHaveURL(/\/recruitment\/offers/);

    // 5. Navigate to Onboarding
    await recruitmentHelper.gotoOnboarding();
    await expect(page).toHaveURL(/\/recruitment\/onboarding/);

    // 6. Perform Logout
    await logout(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
