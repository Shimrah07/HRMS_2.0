// @ts-check
import { test as base } from './auth.fixture.js';
import { RecruitmentHelper } from '../helpers/recruitment.helper.js';

export const test = base.extend({
  recruitmentHelper: async ({ authenticatedPage }, use) => {
    const helper = new RecruitmentHelper(authenticatedPage);
    await use(helper);
  },
});

export { expect } from '@playwright/test';
