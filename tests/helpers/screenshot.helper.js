// @ts-check
import path from 'path';

export class ScreenshotHelper {
  /**
   * Capture named screenshot into test-results/screenshots/
   * @param {import('@playwright/test').Page} page
   * @param {string} name
   */
  static async capture(page, name) {
    const screenshotPath = path.join(process.cwd(), 'test-results', 'screenshots', `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }
}
