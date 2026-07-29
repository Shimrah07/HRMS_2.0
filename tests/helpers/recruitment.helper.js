// @ts-check
import { expect } from '@playwright/test';
import { navigateToRoute } from './navigation.helper.js';

export class RecruitmentHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to Recruitment Hub Dashboard
   */
  async gotoRecruitmentHub() {
    await navigateToRoute(this.page, '/recruitment');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to ATS Candidates List
   */
  async gotoCandidates() {
    await navigateToRoute(this.page, '/recruitment/candidates');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to ATS Interactive Kanban Pipeline
   */
  async gotoPipeline() {
    await navigateToRoute(this.page, '/recruitment/pipeline');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to Job Openings Requisitions List
   */
  async gotoJobs() {
    await navigateToRoute(this.page, '/recruitment/jobs');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to Interviews Page
   */
  async gotoInterviews() {
    await navigateToRoute(this.page, '/recruitment/interviews');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to Offers Page
   */
  async gotoOffers() {
    await navigateToRoute(this.page, '/recruitment/offers');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to Onboarding Operations Page
   */
  async gotoOnboarding() {
    await navigateToRoute(this.page, '/recruitment/onboarding');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to Probation Operations Center
   */
  async gotoProbation() {
    await navigateToRoute(this.page, '/recruitment/probation');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Search for a candidate by keyword
   * @param {string} keyword
   */
  async searchCandidate(keyword) {
    const searchInput = this.page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill(keyword);
    await this.page.waitForTimeout(400);
  }
}
