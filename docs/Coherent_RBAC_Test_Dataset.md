# Coherent RBAC Test Dataset — Required Before Any Further Verification

## The actual problem

Two symptoms, one cause:

1. A salary structure/payslip was configured for an employee via SUPER_ADMIN, but that employee has no corresponding login-capable `Users` row — so there's no way to log in as them and confirm `PAYROLL.VIEW(own)` actually surfaces what the admin configured. The admin-side and employee-side of the same test can't be connected.
2. The Org Chart renders department/team structure, but there's no way to confirm it's real — because the underlying `ReportingManagerId` chain isn't populated with actual, testable manager→report relationships. It's not clear if Org Chart is reading live reporting data or showing something disconnected from it.

**Root cause**: `Employees`, `Users`, department/team assignment, and salary/attendance/leave data have been seeded independently and inconsistently — some employees have logins, some don't; some have salary structures, some don't; reporting chains aren't populated for the people who'd actually need to be tested against them. Fix this once, properly, rather than patching around it per-ticket.

---

## What "done" looks like

Every account below must be a **complete, closed loop**: a real `Employees` row, a real `Users` row that can actually log in with the stated password, correct `DeptId`/`ReportingManagerId` linkage, and the module data needed to test the specific RBAC scenario it exists for. No orphaned records, no placeholder employee with a payslip but no login, no manager with a "team" that isn't actually linked via `ReportingManagerId`.

---

## Required accounts (exact — build precisely this, not an approximation)

| # | Name | Email | Password | Role | Department | Reports to |
|---|---|---|---|---|---|---|
| 1 | System Admin | admin@company.com | Admin@123456 | SUPER_ADMIN | — | — |
| 2 | (existing) | hradmin@company.com | Demo@123 | HR_ADMIN | HR | — |
| 3 | (existing) | finance@company.com | Demo@123 | FINANCE_HEAD | Finance | — |
| 4 | (existing) | hrexec@company.com | Demo@123 | HR_EXEC | HR | hradmin |
| 5 | Rahul Sharma | manager.eng@company.com | Demo@123 | DEPT_MANAGER | Engineering | hradmin |
| 6 | (existing, reuse) | emp1@company.com | Demo@123 | EMPLOYEE | Engineering | **manager.eng** (#5) |
| 7 | Priya Nair | emp2@company.com | Demo@123 | EMPLOYEE | Engineering | **manager.eng** (#5) |
| 8 | Karan Mehta | manager.ops@company.com | Demo@123 | DEPT_MANAGER | Operations | hradmin |
| 9 | Sana Iyer | emp3@company.com | Demo@123 | EMPLOYEE | Operations | **manager.ops** (#8) |

Row 9 (emp3, Operations) exists specifically as a **negative-test control** — someone who does NOT report to manager.eng — so "manager.eng cannot see emp3" is actually checkable, not assumed.

If `emp1@company.com` already exists from prior testing: **reuse that exact row**, don't create a duplicate — just fix its `ReportingManagerId` and ensure it's the SAME employee ID that gets the salary structure in the step below. This directly resolves the original bug (payslip existed for an ID with no login).

---

## Per-employee required data (rows 5–9, all five)

For each of the 5 non-admin accounts above, ensure ALL of the following exist and are linked to the SAME `EmployeeId`/`UserId` pair — not scattered across disconnected records:

1. **Employee Master record** — complete profile, correct `DeptId` and `ReportingManagerId` set to the actual `EmployeeId` (not name string) of their manager per the table above
2. **User login** — able to authenticate with the exact email/password above and receive a JWT reflecting the correct role
3. **Salary structure** (via the Salary Structure Builder, admin-configured) — at least one saved structure with a non-zero CTC, so `PAYROLL.VIEW(own)` has real data to display when logging in as that employee
4. **At least 3 days of attendance history** — mix of Present/Late so the attendance self-view and manager team-view aren't empty screens
5. **At least 2 leave applications** — one Pending (for the manager to actually approve, testing the real approval flow, not just a static screen), one Approved (for history view)

---

## Specific fixes tied to the root cause

```
1. Confirm (or fix) that the Org Chart component queries live 
   ReportingManagerId/DeptId relationships from Employees — not a separate 
   or cached structure. After seeding the table above, Org Chart must show: 
   Engineering with Rahul Sharma as manager and emp1 + emp2 (Priya) as his 
   two direct reports; Operations with Karan Mehta as manager and emp3 
   (Sana) as his one direct report. If Org Chart currently reads from 
   something else, fix it to read from the real relationship — this is the 
   actual bug behind "teams shown but not checkable."

2. Confirm the specific employee that gets a salary structure assigned in 
   any future admin-side testing is always the SAME EmployeeId as an actual 
   Users row that can log in — add this as a standing rule for how test 
   data gets created going forward, not just a one-time fix for emp1.

3. No seed script should create an Employees row without a matching Users 
   row (for any employee meant to be used in RBAC testing), and no salary 
   structure/attendance/leave record should be created against an employee 
   ID that isn't part of this closed-loop set.
```

---

## Acceptance criteria — verify by actually logging in as each account

1. Log in as `admin@company.com` → configure/confirm a salary structure exists for `emp1@company.com`'s real employee ID.
2. Log out, log in as `emp1@company.com` → `/payroll` shows that exact salary structure and a payslip with matching numbers. This is the specific loop that was broken — it must close.
3. Log in as `manager.eng@company.com` → Org Chart / team view shows exactly emp1 and emp2 as direct reports, and their attendance/leave data (from the seeded records) is visible and actionable (the pending leave application can actually be approved).
4. Still logged in as `manager.eng@company.com` → attempt to view `emp3@company.com`'s attendance or leave data by ID → rejected. This confirms the negative-test control row is doing its job.
5. Log in as `hrexec@company.com` → per Step 0 of the RBAC ticket, confirm whatever HR_EXEC's confirmed permissions are (read-only HR data, no payroll) — this account existing with a real login now makes that ticket's Step 0 findings actually testable, not theoretical.
6. Log in as `finance@company.com` → confirm disbursement access, confirm no ability to initiate a payroll run (per the credentials table's stated expectation).

Report each of these 6 checks as PASS/FAIL with what was actually seen on screen — screenshots or the actual API response, same evidence bar as every prior round. No step in this list should be reported as passing without having actually logged in as that specific account and looked.
