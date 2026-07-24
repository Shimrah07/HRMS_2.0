// @ts-check
import { test, expect } from '@playwright/test';
import { setupConsoleMonitor } from '../helpers/console.helper.js';
import { login } from '../helpers/auth.helper.js';
import { navigateToRoute, assertKpiCardsVisible, assertTableOrEmptyState } from '../helpers/navigation.helper.js';

test.describe('Navigation Smoke Test Suite', () => {
  let consoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitor(page);
    await login(page);
  });

  test.afterEach(async () => {
    consoleMonitor.checkNoConsoleErrors();
  });

  const routesToTest = [
    { name: 'Employee Master List', path: '/employees' },
    { name: 'Employee Directory', path: '/employees/directory' },
    { name: 'Recruitment Hub Dashboard', path: '/recruitment' },
    { name: 'Recruitment Job Openings', path: '/recruitment/jobs' },
    { name: 'Recruitment Candidates Workspace', path: '/recruitment/candidates' },
    { name: 'Recruitment Applications', path: '/recruitment/applications' },
    { name: 'Recruitment ATS Pipeline Board', path: '/recruitment/pipeline' },
    { name: 'Recruitment Interviews Center', path: '/recruitment/interviews' },
    { name: 'Recruitment Offers Workspace', path: '/recruitment/offers' },
    { name: 'Background Verification (BGV)', path: '/recruitment/bgv' },
    { name: 'Employee Onboarding Center', path: '/recruitment/onboarding' },
    { name: 'Probation Management Center', path: '/recruitment/probation' },
  ];

  for (const routeObj of routesToTest) {
    test(`03.0X — Navigate to ${routeObj.name} (${routeObj.path})`, async ({ page }) => {
      await navigateToRoute(page, routeObj.path);

      // Verify no runtime crash or error boundary fallback
      const errorBoundary = page.locator('[data-testid="error-boundary-retry-btn"]');
      await expect(errorBoundary).not.toBeVisible();

      // Assert table or content container rendered
      await assertTableOrEmptyState(page);
    });
  }
});
