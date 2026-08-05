# CRITICAL — Revert Access-Control Regression, Implement Real Permission Matrix

The last round "fixed" 403 errors by removing the access control that was producing them. This is a security regression, not a bug fix — treat it as P0, not backlog. The correct fix is to route each role to exactly what B4.3 grants them, not to grant everyone everything so no route ever blocks.

**Ground truth for this ticket** — use this exact matrix, not the earlier looser proposal from the previous RBAC ticket:

```
Permission code format: MODULE.ACTION
Modules: EMPLOYEE, ATTENDANCE, LEAVE, PAYROLL, RECRUITMENT, PERFORMANCE, 
         TRAINING, SEPARATION, REPORTS, USER_MGMT, COMPANY_SETUP, 
         COMPLIANCE, NOTIFICATIONS
Actions: VIEW, CREATE, EDIT, DELETE, APPROVE, REJECT, EXPORT, PROCESS, 
         GENERATE, ASSIGN

SUPER_ADMIN     → ALL permissions
HR_ADMIN        → ALL except USER_MGMT.DELETE, COMPANY_SETUP.*
HR_MANAGER      → EMPLOYEE.VIEW/EDIT, ATTENDANCE.*, LEAVE.APPROVE/VIEW,
                  PERFORMANCE.*, TRAINING.*, SEPARATION.VIEW,
                  REPORTS.VIEW/EXPORT
PAYROLL_ADMIN   → PAYROLL.*, EMPLOYEE.VIEW, REPORTS.VIEW/EXPORT/GENERATE
RECRUITMENT_MGR → RECRUITMENT.*, EMPLOYEE.CREATE/VIEW, REPORTS.VIEW
DEPT_MANAGER    → EMPLOYEE.VIEW, ATTENDANCE.VIEW/EDIT(team only),
                  LEAVE.APPROVE/VIEW(team only), PERFORMANCE.VIEW/EDIT(team),
                  REPORTS.VIEW(own team only)
EMPLOYEE        → own data: ATTENDANCE.VIEW, LEAVE.CREATE/VIEW/CANCEL,
                  PAYROLL.VIEW(own slips only), PERFORMANCE.VIEW(own),
                  EMPLOYEE.VIEW(own profile), EMPLOYEE.EDIT(own contact/bank)
AUDITOR         → *.VIEW, *.EXPORT (all modules, no writes)
IT_ADMIN        → USER_MGMT.*, COMPANY_SETUP.VIEW
FINANCE_VIEWER  → PAYROLL.VIEW, REPORTS.VIEW/EXPORT
```

`HR_EXEC` and `FINANCE_HEAD` are NOT in this matrix but do exist in the system and were tested in the last round. Do not guess their permissions — see Step 0.

---

## Step 0 — Resolve the undefined roles first

```
Report exactly what permissions HR_EXEC and FINANCE_HEAD currently have in 
the codebase (query the actual role-permission mapping table/seed data). 
Report this back rather than assuming — these need explicit confirmation 
before Step 2's guards can be correctly written for them.

Reasonable defaults to propose (NOT to silently apply — flag as proposed, 
pending confirmation):
- HR_EXEC: EMPLOYEE.VIEW/EDIT (restricted fields, per the existing M1 
  sensitive-field rule already built), ATTENDANCE.VIEW, LEAVE.VIEW (no 
  APPROVE), REPORTS.VIEW — i.e. a read-heavy subset of HR_MANAGER with no 
  approval rights.
- FINANCE_HEAD: PAYROLL.VIEW/APPROVE/EXPORT/GENERATE (approval tier, since 
  the M2 requisition approval chain already routes through Finance for 
  MRF sign-off — this role needs at least RECRUITMENT.APPROVE too for that 
  existing workflow to keep working), REPORTS.VIEW/EXPORT.
```

## Step 1 — Revert the blanket-access changes

```
1. Revert ProtectedRoute.jsx and Sidebar.jsx to role/permission-based 
   guarding — do NOT restore the old hardcoded role-array approach either; 
   build it against permission codes (Step 2) so it's driven by the same 
   source of truth as the backend, not a second hardcoded list that can 
   drift out of sync again.
2. Revert DisbursementController.cs to PAYROLL_ADMIN-scoped access (plus 
   FINANCE_HEAD once Step 0 confirms its permissions) — not "authorized HR 
   executives and users" broadly.
3. Re-review the JobRequisitionsController.cs HR_EXEC addition against 
   Step 0's findings — keep it only if HR_EXEC's confirmed/proposed 
   permissions actually include RECRUITMENT.VIEW, revert if not.
```

## Step 2 — Build real permission-code enforcement

```
1. If a Permissions table / PermissionCodes constant set doesn't already 
   fully cover the MODULE.ACTION list above, extend it so every module × 
   action combination in the matrix has a corresponding code.
2. Build (or confirm existing) a RolePermissions mapping table seeded 
   exactly per the B4.3 matrix above, including the confirmed/proposed 
   HR_EXEC and FINANCE_HEAD rows from Step 0.
3. Every backend endpoint across all 5 modules should check the specific 
   permission code required for that action — not just "is this role in an 
   allowed list" hardcoded per-controller. Reuse the existing 
   [RequirePermission(...)] attribute pattern already used in M1, apply it 
   consistently to any endpoint currently missing it (Disbursement, 
   JobRequisitions, and audit the rest of Payroll/Leave/Attendance while 
   you're in there — this class of bug is exactly what caused the original 
   403s, so check for the same root cause elsewhere before calling this done).
4. Frontend ProtectedRoute/Sidebar should hide/block based on the logged-in 
   user's actual granted permissions (fetched from their token/profile), 
   not a redeployed hardcoded array — if a permission isn't granted, the 
   nav item shouldn't render AND the route should still reject server-side 
   even if someone reaches it by URL directly (frontend hiding is UX only, 
   never the actual security boundary — this needs to be true at the API 
   layer regardless of what the frontend shows).
5. Team-scoped permissions (DEPT_MANAGER's "team only" qualifiers on 
   ATTENDANCE.EDIT, LEAVE.APPROVE, REPORTS.VIEW) need the reporting-chain 
   check from the earlier RBAC ticket's Part 3 — a manager holding the 
   permission code isn't enough, it must also be scoped to only their 
   actual reports.
```

## Step 3 — Re-test with CORRECT pass criteria

```
Re-run the Playwright suite across the same 5 roles × 14 routes, but this 
time the pass criteria is "each role gets EXACTLY the access the matrix 
grants them" — a 403 for EMPLOYEE on /payroll/runs is now the correct, 
expected, PASSING result, not a bug to eliminate. Report results as a 
matrix showing, per role per route: ALLOWED (matches matrix) / BLOCKED 
(matches matrix) / MISMATCH (doesn't match matrix — these are the only 
real failures).

Specifically re-verify:
- EMPLOYEE is blocked from /payroll/runs, /payroll/disbursement, 
  /payroll/salary-config, /payroll/statutory (all PAYROLL.* beyond VIEW-own)
- EMPLOYEE can still reach /payroll (their own payslips), /attendance, 
  /leave (own), /employees (own profile)
- DEPT_MANAGER is blocked from org-wide payroll and from attendance/leave 
  data outside their own team
- AUDITOR can VIEW everything but every write action (approve, edit, 
  process, generate) is rejected across all 5 modules, not just the ones 
  previously tested
```

## Step 4 — Explain how this happened, so it doesn't happen again

```
Report plainly: was "remove the guard" a deliberate shortcut taken to make 
the test suite pass, or a misunderstanding of what the ticket was asking 
for? This matters for how future tickets get phrased — if the instruction 
"fix the 403 errors" was read as "make 403s stop happening" rather than 
"make 403s happen only when they should," that's worth knowing so future 
tickets can state pass criteria as explicitly as Step 3 does here, rather 
than assuming "fix the error" always means "eliminate the error."
```

---

## Output expected back

1. Step 0's findings on HR_EXEC/FINANCE_HEAD — do not proceed past Step 1 on these two roles until this is reported back and confirmed
2. Diff or summary of what was reverted in Step 1
3. The full role × route matrix from Step 3, with any MISMATCH rows called out explicitly, not buried in a "100% pass" summary
4. A straight answer to Step 4
