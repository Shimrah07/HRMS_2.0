// @ts-check
import { test as base } from '@playwright/test';
import { login } from '../helpers/auth.helper.js';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
