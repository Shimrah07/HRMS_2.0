// @ts-check
import { expect } from '@playwright/test';

export class AssertionHelper {
  /**
   * Verify no console errors occurred during test step
   * @param {Array<{type: string, text: string}>} consoleLogs
   */
  static assertZeroConsoleErrors(consoleLogs) {
    const errorLogs = consoleLogs.filter(log => log.type === 'error');
    expect(errorLogs.length, `Expected 0 console.error logs but found ${errorLogs.length}: ${JSON.stringify(errorLogs)}`).toBe(0);
  }

  /**
   * Assert element is accessible with basic role/label
   * @param {import('@playwright/test').Locator} locator
   */
  static async assertAccessibleElement(locator) {
    await expect(locator).toBeVisible();
    const hasRole = await locator.getAttribute('role');
    const hasAriaLabel = await locator.getAttribute('aria-label');
    const hasAlt = await locator.getAttribute('alt');
    const hasTitle = await locator.getAttribute('title');
    const hasPlaceholder = await locator.getAttribute('placeholder');

    expect(Boolean(hasRole || hasAriaLabel || hasAlt || hasTitle || hasPlaceholder || await locator.innerText())).toBe(true);
  }
}
