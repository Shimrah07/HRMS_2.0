// @ts-check
import { test, expect } from '@playwright/test';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { DEFAULT_TEST_USER, login, logout } from '../helpers/auth.helper.js';

test.describe('Authentication Smoke Test Suite', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  test('01.01 — Login page loads successfully', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify page heading / title or brand text
    await expect(page).toHaveTitle(/MPOSethu|IndiaHRMS/i);
    const loginHeader = page.getByRole('heading', { name: /welcome back/i });
    await expect(loginHeader).toBeVisible();

    // Verify input fields present
    const usernameInput = page.locator('input[id="username"]').or(page.locator('input[placeholder*="email"]').or(page.locator('input[type="text"]').first()));
    const passwordInput = page.locator('input[id="password"]').or(page.locator('input[type="password"]').first());

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('01.02 — Invalid credentials trigger authentication error notification', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('input[id="username"]').or(page.locator('input[placeholder*="email"]').or(page.locator('input[type="text"]').first()));
    const passwordInput = page.locator('input[id="password"]').or(page.locator('input[type="password"]').first());

    await usernameInput.fill('invalid.user@company.com');
    await passwordInput.fill('WrongPassword123!');

    const submitBtn = page.locator('button[type="submit"]').or(page.getByRole('button', { name: /sign in/i }));
    await submitBtn.click();

    // Verify notification toast or error message appears
    const notificationErr = page.locator('.ant-notification-notice').or(page.getByText(/Authentication Failure|Invalid/i)).first();
    await expect(notificationErr).toBeVisible({ timeout: 10000 });
  });

  test('01.03 — Valid login succeeds and redirects to Dashboard', async ({ page }) => {
    await login(page, DEFAULT_TEST_USER);

    // Verify URL is /dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify dashboard element is rendered
    const dashboardTitle = page.getByRole('heading', { name: /good|welcome|dashboard/i }).or(page.locator('.ant-card')).first();
    await expect(dashboardTitle).toBeVisible();
  });

  test('01.04 — User profile menu appears and logout returns to Login', async ({ page }) => {
    await login(page, DEFAULT_TEST_USER);
    await expect(page).toHaveURL(/.*dashboard/);

    // Perform logout
    await logout(page);
    await expect(page).toHaveURL(/.*login/);
  });
});
