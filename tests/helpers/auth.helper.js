// @ts-check
import { expect } from '@playwright/test';

export const DEFAULT_TEST_USER = {
  username: 'hradmin@company.com',
  password: 'Demo@123'
};

export const SUPER_ADMIN_USER = {
  username: 'superadmin@company.com',
  password: 'Demo@123'
};

/**
 * Log in to IndiaHRMS application
 * @param {import('@playwright/test').Page} page 
 * @param {object} [credentials]
 */
export async function login(page, credentials = DEFAULT_TEST_USER) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill in login credentials (targets #username and #password)
  const usernameInput = page.locator('#username, input[name="username"], input[type="text"]').first();
  const passwordInput = page.locator('#password, input[name="password"], input[type="password"]').first();

  await usernameInput.fill(credentials.username);
  await passwordInput.fill(credentials.password);

  // Click Submit button
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  // Wait for dashboard redirection
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Log out from IndiaHRMS application
 * @param {import('@playwright/test').Page} page 
 */
export async function logout(page) {
  const avatar = page.locator('.hrms-topbar .ant-avatar').first();
  await avatar.click();

  const signOutBtn = page.getByText('Sign Out').first();
  await signOutBtn.click();

  // Verify redirected back to login page
  await page.waitForURL('**/login', { timeout: 10000 });
}
