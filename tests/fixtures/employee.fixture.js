// @ts-check
import { test as base } from './auth.fixture.js';
import { EmployeeHelper } from '../helpers/employee.helper.js';

export const test = base.extend({
  employeeHelper: async ({ authenticatedPage }, use) => {
    const helper = new EmployeeHelper(authenticatedPage);
    await use(helper);
  },
});

export { expect } from '@playwright/test';
