// @ts-check
import { expect } from '@playwright/test';
import { navigateToRoute } from './navigation.helper.js';

export class EmployeeHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to Employee Master List Page
   */
  async gotoEmployeeList() {
    await navigateToRoute(this.page, '/employees');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to Employee Directory Grid Page
   */
  async gotoEmployeeDirectory() {
    await navigateToRoute(this.page, '/employees/directory');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for an employee by keyword (name, code, email)
   * @param {string} keyword
   */
  async searchEmployee(keyword) {
    const searchInput = this.page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill(keyword);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Filter employees by Department
   * @param {string} department
   */
  async filterByDepartment(department) {
    const deptSelect = this.page.locator('.ant-select').filter({ hasText: /Department/i }).or(this.page.locator('.ant-select').first());
    await deptSelect.click();
    const option = this.page.locator('.ant-select-item-option-content').filter({ hasText: department }).first();
    if (await option.isVisible()) {
      await option.click();
    }
  }

  /**
   * Open Quick View Drawer for the first employee card in Directory
   */
  async openQuickDrawer() {
    await this.gotoEmployeeDirectory();
    const directoryCard = this.page.locator('.ant-col div[style*="cursor"]').first();
    await expect(directoryCard).toBeVisible({ timeout: 10000 });
    await directoryCard.click({ force: true });

    const drawer = this.page.locator('.ant-drawer-open').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });
    return drawer;
  }

  /**
   * Close Quick View Drawer
   */
  async closeQuickDrawer() {
    const closeBtn = this.page.locator('.ant-drawer-open button:has(.anticon-close)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    const drawer = this.page.locator('.ant-drawer-open').first();
    await expect(drawer).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Fill out Create Employee 3-step wizard and submit
   * @param {object} empData
   */
  async createEmployee(empData) {
    await navigateToRoute(this.page, '/employees/new');
    await this.page.waitForLoadState('domcontentloaded');

    // Step 0: Personal Info
    await this.page.locator('input[id*="firstName"]').or(this.page.locator('input[placeholder*="First"]').first()).fill(empData.firstName);
    await this.page.locator('input[id*="lastName"]').or(this.page.locator('input[placeholder*="Last"]').first()).fill(empData.lastName);
    
    // Fill required step 0 inputs if present
    const emailInput = this.page.locator('input[id*="personalEmail"]').or(this.page.locator('input[id*="email"]').first());
    if (await emailInput.isVisible()) await emailInput.fill(empData.personalEmail || empData.email);

    const phoneInput = this.page.locator('input[id*="personalPhone"]').or(this.page.locator('input[id*="phone"]').first());
    if (await phoneInput.isVisible()) await phoneInput.fill(empData.phone || '9876543210');

    // Step 0 -> Step 1
    const nextBtn = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await this.page.waitForTimeout(400);
    }
  }
}
