// @ts-check
import { expect } from '@playwright/test';

/**
 * Verifies opening a drawer or modal
 * @param {import('@playwright/test').Page} page 
 * @param {import('@playwright/test').Locator} triggerLocator 
 */
export async function openAndVerifyDrawer(page, triggerLocator) {
  await triggerLocator.click();
  const drawerOrModal = page.locator('.ant-drawer-content').or(page.locator('.ant-modal-content')).first();
  await expect(drawerOrModal).toBeVisible({ timeout: 10000 });
}

/**
 * Closes an open drawer or modal
 * @param {import('@playwright/test').Page} page 
 */
export async function closeDrawerOrModal(page) {
  const closeBtn = page.locator('.ant-drawer-close').or(page.locator('.ant-modal-close')).or(page.getByRole('button', { name: /close|cancel/i })).first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
}
