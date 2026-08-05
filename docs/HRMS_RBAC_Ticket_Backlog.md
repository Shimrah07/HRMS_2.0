# HRMS — RBAC Implementation Ticket Backlog
### For: Antigravity (or any AI coding agent)
### Goal: Make Role-Based Access Control actually functional — not just "designed"

---

## Why this backlog exists

Your `HRMS_MASTER_SPEC.md` already fully **designs** RBAC (Section B4):
- 10 roles (SUPER_ADMIN, HR_ADMIN, HR_MANAGER, PAYROLL_ADMIN, RECRUITMENT_MGR, DEPT_MANAGER, EMPLOYEE, AUDITOR, IT_ADMIN, FINANCE_VIEWER)
- A `MODULE.ACTION` permission code system
- A role → permission matrix
- Data-scoping rules (who sees whose records)
- Frontend guard components (`PermissionGuard`, `RoleGuard`) and route guards

**The design is not the problem. The enforcement is.** Your sidebar screenshots show every menu item (Payroll, Recruitment, Admin, Users & Roles) visible regardless of who's logged in — which means the guard components either don't exist in the actual code, aren't wired up, or the backend doesn't check permissions at all and the frontend is just decorative.

A prompt like *"add RBAC based on the spec"* fails repeatedly because the agent can satisfy it by writing code that *looks* like RBAC (a `RoleGuard.tsx` file exists!) without it actually blocking anything. **Every ticket below has a pass/fail test you can run yourself** — logging in as a role and checking what happens — so "done" isn't Antigravity's opinion, it's your test result.

**Golden rule to give Antigravity up front, in every session:**
> "Backend authorization is the source of truth. Frontend hiding a button is cosmetic only. A ticket is not done if the API still returns 200 for a role that should get 403."

---

## PHASE 0 — Diagnose before building more

### RBAC-000: Audit current RBAC state (do this first, don't skip)
**Ask Antigravity to answer these, with file/line references, not to write new code yet:**
1. Does the `Roles`, `Permissions`, `RolePermissions`, `UserRoles` tables exist in the DB and are they seeded with data?
2. Does `/api/auth/login` actually return `roles[]` and `permissions[]` in the response, or just a generic token?
3. Are backend controllers using `[Authorize(Policy = "...")]` / permission checks, or just `[Authorize]` (which only checks "is logged in", not "is allowed")?
4. Does the sidebar component read `user.permissions` / `user.roles` at all, or is it a static hardcoded list?
5. Do `PermissionGuard.tsx` / `RoleGuard.tsx` exist in the codebase, and are they imported and used anywhere, or do they exist unused?

**Acceptance:** You get a written answer for all 5, with file paths. If the answer to #3 or #4 is "no", that's your actual root cause — say so explicitly before moving to Phase 1.

---

## PHASE 1 — Backend enforcement (this is the real gate — do this before any frontend work)

### RBAC-001: Seed roles, permissions, and role-permission matrix exactly per spec
- Insert the 10 `Roles` rows with exact `RoleCode` values from B4.1.
- Insert `Permissions` rows for every `MODULE.ACTION` combination listed in B4.2.
- Insert `RolePermissions` rows exactly matching the matrix in B4.3 (not an approximation — the literal list).
- **Test:** Query `RolePermissions` joined to `Roles`/`Permissions` for `EMPLOYEE` — it should return only the ~6 permissions listed for EMPLOYEE in the spec, nothing else.

### RBAC-002: Return roles + permissions on login and on `/me`
- `POST /api/auth/login` response must include `roles: string[]` and `permissions: string[]` populated from the DB (not hardcoded, not empty).
- `GET /api/auth/me` must return the same, live from DB, so a stale token doesn't hide a permission change.
- **Test:** Log in as a seeded `EMPLOYEE` test user via Postman → response body must list only EMPLOYEE's permissions.

### RBAC-003: Add real permission-based authorization to every controller endpoint
- Every endpoint gets a policy check like `[Authorize(Policy = "LEAVE.APPROVE")]`, not just `[Authorize]`.
- Go controller-by-controller (Employee, Attendance, Leave, Payroll, Recruitment, Performance, Training, Separation, Reports, Users) and map each action to its required permission per B4.3.
- **Test (per controller):** Call the endpoint with a valid JWT for a role that should NOT have that permission → must return `403 Forbidden`, not `200`. This is the test that catches "fake" RBAC — do it for at least 3 endpoints per module.

### RBAC-004: Implement data-scoping filters (row-level, not just endpoint-level)
Per B4.4:
- `EMPLOYEE` calling any GET must be auto-filtered to `WHERE EmployeeId = req.User.EmployeeId` — they should never be able to fetch another employee's record even by guessing an ID in the URL.
- `DEPT_MANAGER` must be filtered to `WHERE ReportingManagerId = req.User.EmployeeId`.
- `HR_MANAGER` filtered to their assigned departments.
- **Test:** As an EMPLOYEE, call `GET /api/employees/{someone-elses-id}` directly by ID → must return `403` or `404`, never that person's data. This is the single most important test — it's the difference between "menu is hidden" and "data is actually protected."

### RBAC-005: Enforce field-level write restrictions on self-edit
- `PUT /my-profile` for EMPLOYEE role must only accept/persist changes to contact, address, and bank fields — even if the request body includes `salary`, `designation`, or `department`, those must be silently ignored server-side, not just hidden in the form.
- **Test:** As EMPLOYEE, PUT to `/my-profile` with a payload that includes `"designation": "CEO"` → check the DB afterward, designation must be unchanged.

---

## PHASE 2 — Frontend enforcement (only after Phase 1 passes)

### RBAC-006: Sidebar renders menu items from live permissions, not a static list
- Sidebar component must read `usePermission().can(...)` per menu item and hide items the user lacks permission for.
- **Test:** Log in as EMPLOYEE in the browser → sidebar should show only My Profile / My Attendance / My Leaves / My Slips / My Goals, not Payroll, Recruitment, Users & Roles, etc. (This directly fixes what your screenshots show.)

### RBAC-007: Wire `PermissionGuard`/`RoleGuard` around every action button
- Every Create/Edit/Delete/Approve/Reject/Process button in every module must be wrapped, matching the permission required by its underlying API call from RBAC-003.
- **Test:** Log in as DEPT_MANAGER → open an employee not on their team → Edit/Delete buttons must not render (and per RBAC-004 the API blocks it anyway if someone forces it via devtools).

### RBAC-008: Route guards on every route in B6.4
- `ProtectedRoute` (auth check) and `PermissionRoute` (permission check) wrapped around every route, matching the list already defined in B6.4 — this list already exists in your spec, it just needs to be applied.
- **Test:** As EMPLOYEE, manually type `/admin/users` in the address bar → must redirect to `/403`, not render the page even briefly.

### RBAC-009: Build the `/403` Forbidden page and redirect flow
- A proper 403 page (not a blank screen or crash) when `PermissionRoute` blocks access, and when the API returns 403 (axios interceptor in B6.2 already specifies this — confirm it's implemented, not just documented).
- **Test:** Trigger both routes (direct URL nav, and an API call returning 403) and confirm both land on the same clean 403 page.

### RBAC-010: Admin Role–Permission matrix UI (`/admin/roles`)
- A real page where SUPER_ADMIN/IT_ADMIN can view (and for custom roles, edit) which permissions belong to which role — reading live from `RolePermissions`, not hardcoded.
- **Test:** Change a permission in this UI, log out/in as an affected role, confirm the change took effect (proves the whole chain from DB → JWT → UI is live, not cached).

### RBAC-011: User Management UI role assignment (`/admin/users`)
- SUPER_ADMIN/IT_ADMIN can assign/change a user's role from this screen, calling `POST /{id}/roles`.
- **Test:** Reassign a test user from EMPLOYEE to DEPT_MANAGER, have them log in again, confirm their sidebar/permissions changed accordingly.

---

## PHASE 3 — Verification (make this repeatable so it never regresses)

### RBAC-012: Automated backend test suite — one test per role per endpoint
- For every controller endpoint, write an integration test that calls it with a token for each of the 10 roles and asserts the expected status code (200 vs 403) per the B4.3 matrix.
- **Acceptance:** Test suite has ≥1 assertion per role per module (roughly 10 roles × 13 modules = 130+ assertions). This is what stops a future "quick fix" from silently breaking RBAC again.

### RBAC-013: Manual QA sign-off matrix (you do this one yourself)
Create 10 test logins, one per role, and for each one manually verify against this table:

| Role | Should see in sidebar | Should NOT be able to open by direct URL | Should NOT be able to edit |
|---|---|---|---|
| EMPLOYEE | Dashboard, My Profile, My Attendance, My Leaves, My Slips, My Goals | /employees, /admin/*, /payroll (others') | designation, salary, department, others' records |
| DEPT_MANAGER | + Team Attendance, Team Leave, Team Reviews | /admin/*, /payroll/run/new | employees outside their reporting line |
| HR_MANAGER | + Employees, Attendance, Leave (dept-wide) | /payroll/run/new, /admin/users | payroll processing |
| PAYROLL_ADMIN | + Payroll/* | /admin/users, /recruitment/* | employee master fields outside payroll |
| RECRUITMENT_MGR | + Recruitment/* | /payroll/*, /admin/* | payroll, attendance |
| AUDITOR | everything, read-only | (nothing blocked to view) | **everything** — no edit/create/delete/approve anywhere |
| IT_ADMIN | + Admin/Users, Roles | /payroll/*, /recruitment/* | HR/payroll data |
| FINANCE_VIEWER | + Payroll reports (view only) | /payroll/run/new, /admin/* | any payroll edit |
| HR_ADMIN | everything except Company Setup, User delete | /admin/company (edit), user hard-delete | — |
| SUPER_ADMIN | everything | — | — |

**Only mark RBAC "done" when every cell in this table passes.**

---

## Suggested order to hand these to Antigravity

Give them one phase at a time, not all 13 tickets at once — an agent working through 13 tickets in one shot tends to "complete" them shallowly. Suggested batching:

1. **Session 1:** RBAC-000 (audit) only. Read the output yourself before proceeding.
2. **Session 2:** RBAC-001 → RBAC-003 (seed data + JWT + endpoint authorization). Test RBAC-003 yourself in Postman before moving on.
3. **Session 3:** RBAC-004 → RBAC-005 (data scoping + field restrictions). Test yourself — this is the one most agents skip.
4. **Session 4:** RBAC-006 → RBAC-011 (all frontend).
5. **Session 5:** RBAC-012 → RBAC-013 (automated tests + your manual sign-off).

If a session claims something is done, ask it to show you the exact test request/response (or paste the test file) rather than a description — that's what exposes whether it actually ran the check or just asserted completion.
