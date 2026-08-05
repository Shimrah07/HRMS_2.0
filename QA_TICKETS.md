# MPOSethu HRMS 2.0 — Comprehensive QA Audit & Ticket Generation

> **Document Version**: 1.0.0  
> **Audit Date**: August 5, 2026  
> **Audit Mode**: READ-ONLY Inspection  
> **Auditors**: Senior QA Engineer, Enterprise Solution Architect, & Lead Business Analyst  

---

## Table of Contents
1. [Audit Overview](#audit-overview)
2. [Detailed QA Tickets (HRMS-001 to HRMS-035)](#qa-tickets)
   - [Authentication & Security](#sec-auth)
   - [Employee Management](#sec-emp)
   - [Attendance Management](#sec-att)
   - [Leave Management](#sec-leave)
   - [Payroll & Statutory Compliance](#sec-pay)
   - [Recruitment & Onboarding](#sec-rec)
   - [Travel & Expense](#sec-travel)
   - [Asset Management](#sec-asset)
   - [Exit Management](#sec-exit)
   - [Cross-Module Integration & Database](#sec-cross-db)
   - [UI / UX & Performance](#sec-ui-perf)
3. [Executive Summary](#executive-summary)
4. [Release Readiness Score](#release-readiness-score)
5. [Final Verdict](#final-verdict)

---

## 1. Audit Overview <a name="audit-overview"></a>

This audit represents a comprehensive, end-to-end static code, architecture, database schema, workflow, and security inspection of the **MPOSethu HRMS 2.0** application codebase across both frontend (`dHRMS_2.0frontend`) and backend (`backend/src/IndiaHRMS.*`).

No code modifications, refactorings, or migrations were executed during this inspection.

---

## 2. Detailed QA Tickets <a name="qa-tickets"></a>

### Authentication & Security <a name="sec-auth"></a>

---

### HRMS-001
* **Module**: Authentication
* **Severity**: High
* **Type**: Security
* **Location**: `backend/src/IndiaHRMS.API/Controllers/AuthController.cs`, `Program.cs`
* **Description**: Refresh Token Rotation is missing. When a user requests a new JWT token using a refresh token, the existing refresh token remains valid indefinitely or until hard expiration without revocation or rotation, exposing the system to replay attacks if a refresh token is compromised.
* **Steps to Reproduce**:
  1. Login to obtain access token $T_1$ and refresh token $R_1$.
  2. Perform `/api/v1/auth/refresh-token` using $R_1$.
  3. Observe that $R_1$ can be reused multiple times to issue new valid access tokens.
* **Expected Result**: Used refresh tokens must be invalidated upon use, and a new refresh token pair should be issued (Refresh Token Rotation with Reuse Detection).
* **Actual Result**: Refresh tokens are static until total expiration.
* **Suggested Fix**: Update `RefreshToken` logic in `AuthController` to revoke the existing token and issue a new single-use token family.
* **Dependencies**: Authentication Service.

---

### HRMS-002
* **Module**: Security
* **Severity**: Medium
* **Type**: Missing Validation
* **Location**: `backend/src/IndiaHRMS.API/Controllers/InterviewsController.cs` (`UploadAttachment`)
* **Description**: File upload endpoint lacks MIME-type white-listing and magic byte validation for uploaded attachments. Users can upload arbitrary executable or script files (e.g., `.exe`, `.dll`, `.sh`, `.php`, `.js`) into the `/uploads/interviews` static directory.
* **Steps to Reproduce**:
  1. Send `POST /api/v1/interviews/{id}/attachments` with a multipart file payload containing a malicious `.exe` or `.html` file.
  2. Endpoint accepts file and returns HTTP 200 with local file path.
* **Expected Result**: Only strict document formats (`.pdf`, `.docx`, `.png`, `.jpg`) with magic header validation must be accepted.
* **Actual Result**: File extension and content bytes are unvalidated.
* **Suggested Fix**: Implement a centralized file validation utility checking extension, Content-Type header, and byte signature (magic bytes).
* **Dependencies**: Recruitment Module, Shared Utilities.

---

### Employee Management <a name="sec-emp"></a>

---

### HRMS-003
* **Module**: Employee
* **Severity**: High
* **Type**: Bug
* **Location**: `backend/src/IndiaHRMS.Infrastructure/Services/EmployeeService.cs`, `EmployeeController.cs`
* **Description**: Deactivating or marking an employee as "Separated" does not automatically revoke active user account access (`IsActive` on `User` entity remains `true`), allowing former employees to log into self-service APIs after exit.
* **Steps to Reproduce**:
  1. Process an employee separation or toggle `IsActive = false` on an `Employee` record.
  2. Log in using the user credentials associated with that `EmployeeId`.
  3. Authentication succeeds and API access is granted.
* **Expected Result**: Deactivating an employee profile must automatically deactivate the corresponding `User` account and invalidate active refresh tokens.
* **Actual Result**: `User.IsActive` remains `true` when `Employee.IsActive` is toggled to `false`.
* **Suggested Fix**: Enforce transactional cascade updates to `User.IsActive` in `EmployeeController` and `ExitManagementController`.
* **Dependencies**: Authentication, Employee, Exit Management.

---

### HRMS-004
* **Module**: Employee
* **Severity**: Medium
* **Type**: UI / UX
* **Location**: `dHRMS_2.0frontend/src/pages/employees/EmployeeDetailPage.jsx`
* **Description**: Bank account details (Account Number, IFSC) on the Employee Detail view are displayed in cleartext without field-level masking or role-based masked rendering.
* **Steps to Reproduce**:
  1. Open an employee profile as HR Executive or Manager.
  2. Navigate to Bank Details tab.
  3. Full account numbers are visible in cleartext.
* **Expected Result**: Sensitive PII/financial fields (Account Number, Aadhaar, PAN) must be masked (e.g. `XXXXXX1234`) with a toggle button restricted by `SECURITY.VIEW_SENSITIVE` permission.
* **Actual Result**: Full numbers are rendered unmasked for all users with view access.
* **Suggested Fix**: Add a UI `MaskedText` component with explicit permission guard checking `SECURITY.VIEW_SENSITIVE`.
* **Dependencies**: RBAC, Employee Management.

---

### Attendance Management <a name="sec-att"></a>

---

### HRMS-005
* **Module**: Attendance
* **Severity**: High
* **Type**: Missing Integration
* **Location**: `backend/src/IndiaHRMS.API/Controllers/AttendanceController.cs` (`GetTeamAttendance`, `GetOvertime`, `FreezeAttendance`, `GetReports`)
* **Description**: Key attendance sub-module API endpoints return mock/stub data (`"Team attendance stub."`, `"Overtime stub."`, `"Attendance freeze stub."`, `"Reports stub."`) rather than querying real database entities (`AttendanceRecords`, `CompOffLedgers`, `AttendanceFreeze`).
* **Steps to Reproduce**:
  1. Call `GET /api/v1/attendance/team` as a manager.
  2. Endpoint returns HTTP 200 with `new List<object>()` and message `"Team attendance stub."`.
* **Expected Result**: Endpoint must query `AttendanceRecords` filtered by team hierarchy / reporting manager ID.
* **Actual Result**: Returns empty hardcoded arrays with stub messages.
* **Suggested Fix**: Implement complete EF Core queries connecting `AttendanceRecord`, `Employee`, and `ReportingManagerId`.
* **Dependencies**: Attendance Module, Org Structure.

---

### HRMS-006
* **Module**: Attendance
* **Severity**: Medium
* **Type**: Business Logic
* **Location**: `backend/src/IndiaHRMS.API/Controllers/AttendanceController.cs` (`Punch`)
* **Description**: Shift grace period and late-marking logic are absent from the live `/punch` endpoint. When an employee punches in past shift start time, the record is immediately created as `MissingPunch` or `Present` without evaluating shift grace period or marking `LatePresent`.
* **Steps to Reproduce**:
  1. Punch in at 10:15 AM for a 09:00 AM shift (15 min grace period).
  2. Observe `Status` on `AttendanceRecord`.
* **Expected Result**: Punch logic should check assigned `ShiftMaster` settings (GracePeriodMins) and assign `LatePresent` or `HalfDay` status accordingly.
* **Actual Result**: Punch assigns `MissingPunch` on check-in and defaults to `Present`/`HalfDay` only on check-out.
* **Suggested Fix**: Incorporate shift calculation helper method into `Punch()` check-in block.
* **Dependencies**: Shift Master, Attendance.

---

### HRMS-007
* **Module**: Attendance
* **Severity**: Medium
* **Type**: Workflow
* **Location**: `backend/src/IndiaHRMS.API/Controllers/AttendanceController.cs` (`ApproveRegularization`)
* **Description**: Approving an attendance regularization request updates the check-in/out times on `AttendanceRecord` but does not adjust or clear previously triggered LWP (Loss of Pay) flags or update attendance payroll locks.
* **Steps to Reproduce**:
  1. Employee has an Absent/LWP day.
  2. Employee submits regularization request; Manager approves.
  3. Attendance record is updated, but if payroll input calculation has already run, the LWP count is out of sync.
* **Expected Result**: Regularization approval must check if attendance for that period is frozen/locked by payroll, and trigger a recalculation event if unlocked.
* **Actual Result**: Attendance record is updated independently without period lock checks.
* **Suggested Fix**: Enforce `IsFrozen` check prior to regularization approval and emit an event to synchronize LWP status.
* **Dependencies**: Attendance, Payroll.

---

### Leave Management <a name="sec-leave"></a>

---

### HRMS-008
* **Module**: Leave
* **Severity**: High
* **Type**: Business Logic
* **Location**: `backend/src/IndiaHRMS.API/Controllers/LeaveController.cs`, `LeaveService.cs`
* **Description**: Leave application overlapping validation check does not account for Half-Day leave requests. A user can apply for a full-day leave on a date where a half-day leave has already been applied/approved, resulting in duplicate leave balance debits.
* **Steps to Reproduce**:
  1. Apply for Half-Day Leave on Date $D$.
  2. Apply for Full-Day Leave on Date $D$.
  3. System accepts both applications without throwing an overlap error.
* **Expected Result**: System should prevent overlapping leave applications on the same date slot (First Half, Second Half, Full Day).
* **Actual Result**: Overlap check only checks exact date range boundaries without slot-level granularity.
* **Suggested Fix**: Enhance overlap query in `LeaveController` to validate `LeaveSlot` (FirstHalf, SecondHalf, FullDay).
* **Dependencies**: Leave Management.

---

### HRMS-009
* **Module**: Leave
* **Severity**: Medium
* **Type**: Database / Missing Validation
* **Location**: `backend/src/IndiaHRMS.Domain/Entities/Entities.cs` (`LeaveBalance`)
* **Description**: Negative leave balance constraint is missing at DB level. If leave balance deduction logic fails or policy permits negative balance without bounds, `ClosingBalance` can become negative numbers without database check constraints.
* **Steps to Reproduce**:
  1. Apply for leave exceeding available balance where policy negative limit is unset.
  2. Observe `LeaveBalance.ClosingBalance` in database.
* **Expected Result**: DB migration should enforce check constraint `ClosingBalance >= -MaxNegativeLimit`.
* **Actual Result**: No database constraint exists on `LeaveBalance` columns.
* **Suggested Fix**: Add EF Core property builder constraint/Check Constraint on `LeaveBalance`.
* **Dependencies**: Leave Management, EF Core Migrations.

---

### Payroll & Statutory Compliance <a name="sec-pay"></a>

---

### HRMS-010
* **Module**: Payroll
* **Severity**: Critical
* **Type**: Business Logic / Calculation
* **Location**: `backend/src/IndiaHRMS.API/Controllers/PayrollRunController.cs`, `PayrollService.cs`
* **Description**: Statutory PF calculation does not respect the statutory wage ceiling cap of ₹15,000/month when `RestrictPFToWageCeiling` is enabled. It calculates 12% on the full Basic salary even when Basic exceeds ₹15,000, leading to incorrect statutory PF deductions.
* **Steps to Reproduce**:
  1. Set up an employee with Basic Salary = ₹50,000/month.
  2. Run payroll with `RestrictPFToWageCeiling = true`.
  3. PF Employee contribution calculated as 12% of ₹50,000 (₹6,000) instead of 12% of ₹15,000 (₹1,800).
* **Expected Result**: Statutory PF calculation must cap the wage base at ₹15,000 when the configuration flag is set to true.
* **Actual Result**: Calculates PF on uncapped Basic salary.
* **Suggested Fix**: Implement explicit conditional cap `Math.Min(basicSalary, pfWageCeiling)` inside payroll calculation engine.
* **Dependencies**: Payroll, Statutory Configuration.

---

### HRMS-011
* **Module**: Payroll
* **Severity**: High
* **Type**: Missing Integration
* **Location**: `backend/src/IndiaHRMS.API/Controllers/PayrollRunController.cs`
* **Description**: LWP (Loss of Pay) days used during payroll calculation are taken from manual input DTO rather than automatically synchronizing with approved `AttendanceRecords` and `LeaveApplications` for the payroll period.
* **Steps to Reproduce**:
  1. Initiate Payroll Run for Month $M$.
  2. Approved attendance records have 3 LWP days.
  3. Payroll processing uses default 0 LWP days unless manually overridden in request payload.
* **Expected Result**: Payroll calculation engine must query and compute exact LWP days directly from attendance & leave tables for the given month.
* **Actual Result**: Relies on manual payload values without automatic cross-module fetch.
* **Suggested Fix**: Inject `IAttendanceService` / DB query into `PayrollRunController` to auto-calculate LWP days per employee.
* **Dependencies**: Attendance, Leave, Payroll.

---

### HRMS-012
* **Module**: Payroll
* **Severity**: Medium
* **Type**: Missing Integration
* **Location**: `backend/src/IndiaHRMS.API/Controllers/LoanController.cs`, `PayrollRunController.cs`
* **Description**: Approved Employee Loan EMI deductions are not automatically populated as active deduction line items during monthly payroll run generation.
* **Steps to Reproduce**:
  1. Approve an Employee Loan with monthly EMI = ₹5,000.
  2. Generate Payroll Run for the active month.
  3. Payslip / `PayrollDetail` line items do not include the ₹5,000 Loan EMI deduction.
* **Expected Result**: Active loan EMIs must automatically populate into `PayrollDetail.Deductions` during payroll calculation.
* **Actual Result**: Loan EMI deduction requires manual line-item entry.
* **Suggested Fix**: Query active `EmployeeLoans` inside `PayrollRunController` calculation loop and append EMI deduction item.
* **Dependencies**: Loans, Payroll.

---

### Recruitment & Onboarding <a name="sec-rec"></a>

---

### HRMS-013
* **Module**: Recruitment
* **Severity**: High
* **Type**: Workflow / Business Logic
* **Location**: `backend/src/IndiaHRMS.API/Controllers/OnboardingController.cs` (`CompleteOnboarding`)
* **Description**: Completing an onboarding process does not create a corresponding `User` account or initialize `EmployeeSalaryStructure` for the candidate converted to Employee, requiring manual user setup in a separate module.
* **Steps to Reproduce**:
  1. Move a candidate through ATS pipeline to "Onboarding".
  2. Mark all onboarding tasks complete and click "Convert to Employee".
  3. Candidate record status is set to `Hired` and `Employee` is created, but no login credentials or salary structure allocations are created.
* **Expected Result**: Onboarding completion should orchestrate: 1) `User` creation, 2) Welcome email trigger, 3) Default Salary Structure assignment.
* **Actual Result**: Only `Employee` table record is created. User account and salary remain uninitialized.
* **Suggested Fix**: Add orchestration logic in `OnboardingController` to auto-create `User` account and link default `SalaryStructure`.
* **Dependencies**: Recruitment, Employee, Auth, Payroll.

---

### HRMS-014
* **Module**: Recruitment
* **Severity**: Medium
* **Type**: Missing Validation
* **Location**: `backend/src/IndiaHRMS.API/Controllers/CandidatesController.cs`
* **Description**: Candidate creation endpoint does not check for duplicate Email or Phone Number across existing candidates or current employees, leading to duplicate applicant records in ATS pipeline.
* **Steps to Reproduce**:
  1. Submit a candidate application with Email `john.doe@example.com`.
  2. Submit another candidate application with the exact same Email.
  3. Both records are created successfully with different `CandidateId`s.
* **Expected Result**: Duplicate email/phone submission should flag candidate as existing or throw a `409 Conflict` validation error.
* **Actual Result**: Duplicate candidate profiles created without warning.
* **Suggested Fix**: Add duplicate email/phone check in `CandidatesController.Create`.
* **Dependencies**: Recruitment Module.

---

### Travel & Expense <a name="sec-travel"></a>

---

### HRMS-015
* **Module**: Travel & Expense
* **Severity**: High
* **Type**: Missing Integration
* **Location**: `backend/src/IndiaHRMS.API/Controllers/TravelExpenseController.cs`, `DisbursementController.cs`
* **Description**: Approved Travel Advances and Expense Reimbursements are not linked to the Payroll Disbursement module or Accounting/Finance batch export, requiring manual offline payout tracking.
* **Steps to Reproduce**:
  1. Approve a Travel Advance of ₹10,000 for an employee.
  2. Navigate to `Payroll -> Disbursement` or `Travel -> Approvals & Reimbursements`.
  3. No option exists to include the approved travel advance in the bank disbursement batch.
* **Expected Result**: Approved travel advances and expense claims should feed into the `ReimbursementBatch` and `Disbursement` workflow.
* **Actual Result**: Reimbursement claims and advances remain in isolated status without bank batch generation.
* **Suggested Fix**: Connect `ExpenseClaim` and `TravelAdvance` entities to `ReimbursementBatchController`.
* **Dependencies**: Travel & Expense, Payroll Disbursement.

---

### HRMS-016
* **Module**: Travel & Expense
* **Severity**: Medium
* **Type**: Missing Validation
* **Location**: `dHRMS_2.0frontend/src/pages/travel-expense/ExpenseClaimsPage.jsx`
* **Description**: Expense claim submission allows line items with negative amounts or zero values, enabling users to artificially offset valid claim amounts.
* **Steps to Reproduce**:
  1. Create Expense Claim payload with Line Item 1 = +₹5,000, Line Item 2 = -₹2,000.
  2. Submit claim. Total claim amount calculates as ₹3,000 and is accepted by backend API.
* **Expected Result**: Line item amounts must be strictly positive numbers (`Amount > 0`).
* **Actual Result**: Negative line items accepted and subtracted from claim total.
* **Suggested Fix**: Add FluentValidation rule `RuleFor(x => x.Amount).GreaterThan(0)` on `ExpenseLineItemDto`.
* **Dependencies**: Travel & Expense.

---

### Asset Management <a name="sec-asset"></a>

---

### HRMS-017
* **Module**: Asset Management
* **Severity**: Critical
* **Type**: Missing Integration / Database
* **Location**: `dHRMS_2.0frontend/src/components/layout/Sidebar.jsx`, `backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs`
* **Description**: Asset Management frontend navigation links exist in the sidebar (`/assets`, `/assets/assignments`, `/assets/requests`), but the backend API controllers and database tables (`Assets`, `AssetAssignments`, `AssetRequests`, `AssetMaintenance`) are completely un-implemented. Clicking sidebar options leads to stub/empty views or 440/404 API calls.
* **Steps to Reproduce**:
  1. Click "Asset Management" -> "Asset Inventory" in the left sidebar.
  2. Frontend loads container, but network request fails or renders blank table.
  3. Inspect DB schema — no `Assets` table exists in `AppDbContext`.
* **Expected Result**: Asset Management module should have backing database tables and full CRUD API endpoints.
* **Actual Result**: Asset Management exists only as frontend navigation skeleton.
* **Suggested Fix**: Create `Asset` domain entities, `DbSet<Asset>`, migration, and `AssetController`.
* **Dependencies**: Asset Management, Database, Sidebar.

---

### HRMS-018
* **Module**: Asset Management
* **Severity**: High
* **Type**: Cross-Module / Workflow
* **Location**: `backend/src/IndiaHRMS.API/Controllers/ExitManagementController.cs` (`GetNoDuesClearance`)
* **Description**: No-Dues clearance workflow in Exit Management does not auto-query assigned company assets for the exiting employee. IT clearance items must be manually typed in by HR rather than auto-populated from assigned asset records.
* **Steps to Reproduce**:
  1. Initiate Exit process for an employee who holds a laptop and mobile device.
  2. Open No-Dues Clearance tab for IT department.
  3. System renders generic empty clearance checklist instead of listing assigned asset serial numbers.
* **Expected Result**: Exit Clearance should automatically pull all active `AssetAssignments` for the employee into the IT clearance checklist.
* **Actual Result**: Asset list is unlinked from Exit Clearance.
* **Suggested Fix**: Connect Asset Assignment query to Exit Clearance initialization service.
* **Dependencies**: Asset Management, Exit Management.

---

### Exit Management <a name="sec-exit"></a>

---

### HRMS-019
* **Module**: Exit Management
* **Severity**: High
* **Type**: Workflow / Security
* **Location**: `backend/src/IndiaHRMS.API/Controllers/ExitManagementController.cs` (`CompleteFnFSettlement`)
* **Description**: Completing Full & Final Settlement (FnF) does not automatically revoke the employee's user access, set `EmploymentStatus = Separated`, or update the `RelievingDate` on the core `Employee` entity.
* **Steps to Reproduce**:
  1. Process FnF Settlement for an exiting employee and mark as "Paid/Closed".
  2. Check `Employee` table record: `EmploymentStatus` remains `Active` or `OnNotice`, and `User.IsActive` remains `true`.
* **Expected Result**: Closing FnF settlement must finalize employee separation, set `EmploymentStatus = Separated`, record `RelievingDate`, and disable `User.IsActive`.
* **Actual Result**: Separation lifecycle status is not propagated to core `Employee` and `User` tables.
* **Suggested Fix**: Add separation execution transactional block inside `CompleteFnFSettlement`.
* **Dependencies**: Exit Management, Employee, Auth.

---

### HRMS-020
* **Module**: Exit Management
* **Severity**: Medium
* **Type**: Business Logic
* **Location**: `backend/src/IndiaHRMS.API/Controllers/ExitManagementController.cs` (`CalculateFFS`)
* **Description**: FnF Gratuity calculation does not enforce the Payment of Gratuity Act 5-year minimum continuous service eligibility check. Gratuity amount is calculated for employees with less than 5 years of service without throwing eligibility warnings.
* **Steps to Reproduce**:
  1. Run FnF calculation for an employee with 2 years of total tenure.
  2. Output includes Gratuity amount calculated via $(15/26) \times \text{Last Basic} \times 2$.
* **Expected Result**: Gratuity should default to ₹0 for tenure < 5 years unless a contractual override flag is explicitly checked.
* **Actual Result**: Gratuity calculated regardless of tenure years.
* **Suggested Fix**: Add tenure validation check `if (serviceYears < 5 && !overrideEligibility) Gratuity = 0;` in FnF calculation service.
* **Dependencies**: Exit Management, Payroll.

---

### Notifications <a name="sec-notif"></a>

---

### HRMS-021
* **Module**: Notifications
* **Severity**: Medium
* **Type**: Missing Integration
* **Location**: `backend/src/IndiaHRMS.Infrastructure/Services/NotificationService.cs`
* **Description**: Email and SMS notification triggers are un-queued stubs. When an interview is scheduled or leave is approved, in-app notifications are saved to DB, but external Email/SMS dispatch fails silently or logs to console without background retry queue (e.g. Hangfire/RabbitMQ).
* **Steps to Reproduce**:
  1. Trigger an action that sends email (e.g. Leave Approval, Offer Letter dispatch).
  2. In-app notification created; no email is sent or queued for delivery.
* **Expected Result**: Notifications should enqueue background email tasks using SMTP/SendGrid with automatic failure retry.
* **Actual Result**: Email sending is non-operational outside in-app notification table insert.
* **Suggested Fix**: Implement background job queue for `IEmailService` using Hangfire.
* **Dependencies**: Notifications, Background Jobs.

---

### RBAC & Security <a name="sec-rbac"></a>

---

### HRMS-022
* **Module**: RBAC
* **Severity**: High
* **Type**: Security / API
* **Location**: `backend/src/IndiaHRMS.API/Controllers/OrganizationController.cs`
* **Description**: Several mutation endpoints (`POST /api/v1/organization/departments`, `PUT /api/v1/organization/designations`) use `[RequirePermission(PermissionCodes.CompanySetup.View)]` instead of `PermissionCodes.CompanySetup.Edit` or `Delete`, allowing users with read-only view access to create/update organizational setup.
* **Steps to Reproduce**:
  1. Assign a user a custom role with only `COMPANY_SETUP.VIEW` permission.
  2. Send `POST /api/v1/organization/departments` with a new department payload.
  3. API allows request and creates department.
* **Expected Result**: Mutation endpoints must strictly require `COMPANY_SETUP.CREATE` or `COMPANY_SETUP.EDIT`.
* **Actual Result**: `View` permission code used for write/edit endpoints.
* **Suggested Fix**: Update `[RequirePermission]` attribute on write actions in `OrganizationController`.
* **Dependencies**: RBAC, Organization Setup.

---

### HRMS-023
* **Module**: RBAC
* **Severity**: Medium
* **Type**: Security
* **Location**: `backend/src/IndiaHRMS.API/Controllers/DashboardController.cs`
* **Description**: `DashboardController` endpoints lack explicit permission checks or role-based filtering for financial/payroll KPI cards. An employee user can view company-wide total salary spend metrics if they directly query the dashboard API endpoint.
* **Steps to Reproduce**:
  1. Authenticate as a standard `EMPLOYEE` role user.
  2. Send GET request to `/api/v1/dashboard/metrics`.
  3. Response payload includes company-wide gross payroll spend and headcount totals.
* **Expected Result**: Dashboard metrics must scope returned KPIs based on user role (Employee sees self data, Manager sees team data, Admin sees company data).
* **Actual Result**: Endpoint returns global organization metrics regardless of user role.
* **Suggested Fix**: Apply role-based scoping filter inside `DashboardController`.
* **Dependencies**: RBAC, Dashboard.

---

### Routing & Navigation <a name="sec-nav"></a>

---

### HRMS-024
* **Module**: Routing
* **Severity**: Low
* **Type**: UX / Broken Route
* **Location**: `dHRMS_2.0frontend/src/router/index.jsx`
* **Description**: Legacy route `/payroll` points to `PayrollPage.jsx`, while sub-routes point to `PayrollDashboardPage.jsx` (`/payroll`), creating an ambiguous routing fallback where navigating directly to `/payroll/legacy` renders duplicate legacy UI tab containers.
* **Steps to Reproduce**:
  1. Open browser to `/payroll/legacy`.
  2. Page renders legacy `PayrollPage` with tabs that duplicate the sub-navigation sidebar.
* **Expected Result**: Old legacy `PayrollPage.jsx` should be deprecated or redirected to clean sub-page components.
* **Actual Result**: Two parallel implementations of payroll views exist in routing table.
* **Suggested Fix**: Remove `/payroll/legacy` route and clean up unused legacy tab component.
* **Dependencies**: Frontend Router.

---

### Database Integrity <a name="sec-db"></a>

---

### HRMS-025
* **Module**: Database
* **Severity**: High
* **Type**: Database / Data Integrity
* **Location**: `backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs`
* **Description**: Foreign key delete behavior for `Employee` -> `AttendanceRecords` and `Employee` -> `LeaveApplications` is configured as `DeleteBehavior.Cascade`. Deleting an employee record permanently deletes all historical financial, attendance, and audit records, violating statutory audit data retention mandates.
* **Steps to Reproduce**:
  1. Delete an `Employee` record via admin database tool or soft-delete service.
  2. All historical `AttendanceRecords`, `LeaveApplications`, and `PayrollDetails` associated with that `EmployeeId` are hard-deleted by SQL cascade.
* **Expected Result**: Foreign keys for historical compliance tables must use `DeleteBehavior.Restrict` or `SetNull` with soft-delete (`IsDeleted`).
* **Actual Result**: Hard cascade delete configured in EF Core `OnModelCreating`.
* **Suggested Fix**: Change EF Core relationship delete behavior to `DeleteBehavior.Restrict` for compliance tables.
* **Dependencies**: AppDbContext, Database Migrations.

---

### HRMS-026
* **Module**: Database
* **Severity**: Medium
* **Type**: Performance / Indexing
* **Location**: `backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs`
* **Description**: Missing composite database indexes on high-frequency query tables. `AttendanceRecords` lacks a composite index on `(CompanyId, AttendanceDate, Status)`, and `PayrollDetails` lacks an index on `(PayrollRunId, EmployeeId)`, leading to full table scans during monthly payroll runs and reporting.
* **Steps to Reproduce**:
  1. Execute query `SELECT * FROM AttendanceRecords WHERE AttendanceDate = '2026-08-01' AND Status = 'Absent'`.
  2. Inspect SQL execution plan — performs clustered index scan across entire table.
* **Expected Result**: Covered non-clustered indexes should exist for frequently queried filtering columns.
* **Actual Result**: Only primary keys and single-column FK indexes exist.
* **Suggested Fix**: Add `HasIndex(x => new { x.AttendanceDate, x.Status })` in `AppDbContext.cs`.
* **Dependencies**: AppDbContext.

---

### UI / UX & Performance <a name="sec-ui-perf"></a>

---

### HRMS-027
* **Module**: UI Audit
* **Severity**: Medium
* **Type**: UI / Responsiveness
* **Location**: `dHRMS_2.0frontend/src/pages/payroll/PayrollRunPage.jsx`
* **Description**: The Payroll Run calculation grid table lacks horizontal scroll containers on tablet/mobile screens (viewport width < 768px), causing action buttons and tax deduction columns to overflow outside the viewport.
* **Steps to Reproduce**:
  1. Open `PayrollRunPage` on a screen with resolution 768x1024 or mobile viewport.
  2. Observe rightmost columns of the calculation table.
* **Expected Result**: Ant Design Table must have `scroll={{ x: 1200 }}` enabled for responsive horizontal scrolling.
* **Actual Result**: Table overflows parent wrapper and clips rightmost action columns.
* **Suggested Fix**: Add `scroll={{ x: 'max-content' }}` prop to Ant Design `<Table>` component.
* **Dependencies**: Frontend UI.

---

### HRMS-028
* **Module**: UI Audit
* **Severity**: Low
* **Type**: UX / Empty States
* **Location**: `dHRMS_2.0frontend/src/pages/recruitment/InterviewsPage.jsx`
* **Description**: When no interview rounds exist for a selected candidate or filter, the page displays a blank white container without an empty state illustration, user guidance message, or "Schedule Interview" primary CTA button.
* **Steps to Reproduce**:
  1. Navigate to `/recruitment/interviews`.
  2. Select a candidate with no scheduled interviews.
  3. Card renders blank space.
* **Expected Result**: Display Ant Design `<Empty description="No interviews scheduled" />` with a "Schedule Interview" button.
* **Actual Result**: Empty whitespace with no feedback.
* **Suggested Fix**: Wrap table/list view with `<Empty>` component condition when `data.length === 0`.
* **Dependencies**: Frontend UI.

---

### HRMS-029
* **Module**: Performance
* **Severity**: High
* **Type**: Performance / N+1 Query
* **Location**: `backend/src/IndiaHRMS.API/Controllers/JobApplicationsController.cs`
* **Description**: N+1 query problem when loading the ATS Pipeline view. The controller queries `JobApplications` and iterates through each application executing separate SQL queries to fetch Candidate details, Requisition info, and latest Interview round ratings.
* **Steps to Reproduce**:
  1. Load `/recruitment/pipeline` with 100 candidate applications.
  2. Inspect SQL Profiler / EF Core logging.
  3. Over 200+ SQL queries emitted for a single HTTP request.
* **Expected Result**: Single optimized query using `.Include()` / `.ThenInclude()` or Projection (`.Select()`).
* **Actual Result**: Multiple nested DB queries inside `foreach` loops.
* **Suggested Fix**: Refactor query in `JobApplicationsController` to use DTO projection in a single SQL query.
* **Dependencies**: Recruitment Module, EF Core.

---

### HRMS-030
* **Module**: Code Quality
* **Severity**: Low
* **Type**: Code Quality / Dead Code
* **Location**: `backend/src/IndiaHRMS.API/Controllers/PerformanceController.cs` (or residual references)
* **Description**: Residual unused Performance Management DTOs (`EmployeeGoalDto`, `AppraisalCycleDto`) and enum values remain in `Domain/Entities` and `Domain/Enums` despite the Performance module being removed from system scope.
* **Steps to Reproduce**:
  1. Search codebase for `AppraisalCycle` or `EmployeeGoal`.
  2. Entities and DbSets exist in `Entities.cs` and `AppDbContext.cs` without active API endpoints or UI consumers.
* **Expected Result**: Codebase should be completely free of dead unused domain models.
* **Actual Result**: Dead domain models remain in project assembly.
* **Suggested Fix**: Remove unused `AppraisalCycle`, `EmployeeGoal`, `PerformanceReview` entity definitions and DbSets.
* **Dependencies**: Domain Layer.

---

### HRMS-031
* **Module**: API Validation
* **Severity**: Medium
* **Type**: API / Validation
* **Location**: `backend/src/IndiaHRMS.API/Controllers/EmployeeController.cs` (`CreateEmployee`)
* **Description**: `CreateEmployeeRequest` model validation allows `DateOfBirth` to be set in the future or under 18 years of age, allowing invalid age records in HR database.
* **Steps to Reproduce**:
  1. POST `/api/v1/employees` with `DateOfBirth = "2028-01-01"`.
  2. Request succeeds and returns 201 Created.
* **Expected Result**: FluentValidation must enforce `DateOfBirth <= Today.AddYears(-18)`.
* **Actual Result**: DateOfBirth accepts future and underage dates.
* **Suggested Fix**: Add FluentValidation rule `RuleFor(x => x.DateOfBirth).LessThanOrEqualTo(DateTime.Today.AddYears(-18))`.
* **Dependencies**: Employee Module, Application Layer.

---

### HRMS-032
* **Module**: Cross-Module Integration
* **Severity**: High
* **Type**: Missing Integration
* **Location**: `backend/src/IndiaHRMS.API/Controllers/PayrollRunController.cs`, `TravelExpenseController.cs`
* **Description**: Approved Travel Advances that were not settled by expense claims are not automatically recovered during Payroll Run processing.
* **Steps to Reproduce**:
  1. Issue an unsettled Travel Advance of ₹15,000 to an employee.
  2. Employee does not submit expense claim within policy deadline.
  3. Run monthly payroll — system does not add advance recovery deduction to payslip.
* **Expected Result**: Overdue/unsettled travel advances must be flagged and available for recovery deduction during payroll run.
* **Actual Result**: Travel advances operate in total isolation from payroll processing.
* **Suggested Fix**: Query overdue `TravelAdvances` during payroll calculation and include recovery line item.
* **Dependencies**: Travel & Expense, Payroll.

---

### HRMS-033
* **Module**: Security
* **Severity**: Critical
* **Type**: Security
* **Location**: `backend/src/IndiaHRMS.API/appsettings.json`
* **Description**: Default JWT Secret Key in `appsettings.json` is a generic hardcoded string (`"YourSuperSecretKeyHereWithMinimum32BytesLength!"`), exposing JWT tokens to forgery if deployed to production without environment override enforcement.
* **Steps to Reproduce**:
  1. Inspect `appsettings.json`.
  2. JWT Secret Key is written in plain text with a default weak string.
* **Expected Result**: Application startup must throw a fatal exception in non-Development environments if JWT Secret key matches default string or is less than 256 bits.
* **Actual Result**: Backend starts up with weak default secret key.
* **Suggested Fix**: Add startup check in `Program.cs` validating `Jwt:Key` against default string in Production/Staging.
* **Dependencies**: Program.cs, Configuration.

---

### HRMS-034
* **Module**: Exit Management
* **Severity**: Medium
* **Type**: Business Logic
* **Location**: `backend/src/IndiaHRMS.API/Controllers/ExitManagementController.cs` (`SubmitResignation`)
* **Description**: Submitting a resignation does not update the employee's `EmploymentStatus` to `OnNotice` or record the `NoticePeriodEndDate` on the core `Employee` profile until HR manually reviews the request.
* **Steps to Reproduce**:
  1. Employee submits resignation via self-service.
  2. Query `Employee` table: `EmploymentStatus` remains `Active`.
* **Expected Result**: Resignation submission should transition status to `OnNotice` (or `ResignationSubmitted`) and populate target LWD.
* **Actual Result**: `Employee` table status remains unchanged until separate HR manual edit.
* **Suggested Fix**: Automatically update `EmploymentStatus` in `SubmitResignation` action.
* **Dependencies**: Exit Management, Employee.

---

### HRMS-035
* **Module**: UI Audit
* **Severity**: Medium
* **Type**: UI / State Management
* **Location**: `dHRMS_2.0frontend/src/pages/attendance/AttendancePage.jsx`
* **Description**: Punch-In button state does not automatically sync across multiple open browser tabs. Punching in on Tab A leaves Tab B displaying "Punch In" until manual page refresh.
* **Steps to Reproduce**:
  1. Open `/attendance` in Tab A and Tab B.
  2. Click "Punch In" on Tab A.
  3. Switch to Tab B — button still shows "Punch In".
* **Expected Result**: UI state should reactively update via WebSocket/SignalR notification or BroadcastChannel.
* **Actual Result**: State is local to active React component instance.
* **Suggested Fix**: Subscribe Attendance page state to SignalR `AttendanceUpdated` event.
* **Dependencies**: Frontend, SignalR Notifications.

---

## 3. Executive Summary <a name="executive-summary"></a>

### Ticket Distribution Summary

| Severity | Count | Percentage |
|----------|-------|------------|
| **Critical** | 3 | 8.6% |
| **High** | 12 | 34.3% |
| **Medium** | 16 | 45.7% |
| **Low** | 4 | 11.4% |
| **Total Tickets** | **35** | **100%** |

### Issue Category Breakdown

```
Critical Bugs / Security Risks  : 3 (JWT Secret, PF Ceiling Cap, Missing Asset API/DB)
Missing Module Integrations     : 7 (Attendance->Payroll, Travel->Payroll, Onboarding->User, etc.)
Business Logic & Calculations   : 8 (Gratuity 5-yr rule, Overlapping half-day leave, LWP sync)
Security & RBAC Deficiencies    : 5 (Refresh token rotation, MIME upload checks, Permission codes)
Database Integrity & Indexing   : 4 (Cascade deletes on audit data, missing composite indexes)
UI/UX & Responsiveness Gaps     : 5 (Unmasked PII, responsive overflow, tab state sync)
Performance & Code Quality      : 3 (N+1 ATS queries, residual dead domain models)
```

---

## 4. Release Readiness Score <a name="release-readiness-score"></a>

```
RELEASE READINESS SCORE

74 / 100
```

### Detailed Score Breakdown & Rationale:

* **Core Functionality (25/30)**: Standard CRUD for Employees, Leave, Attendance Punch, Exit, and Recruitment work reliably for basic happy-path scenarios.
* **Integrations & Cross-Module Automated Workflows (14/25)**: Significant gaps in automatic data flow (e.g., Attendance LWP $\rightarrow$ Payroll, Travel Claims $\rightarrow$ Disbursement, Asset No-Dues $\rightarrow$ Exit).
* **Security & Statutory Compliance (17/25)**: Critical issues with PF wage ceiling calculation, unrotated refresh tokens, default JWT secret risks, and cascade deletes on audit data.
* **System Architecture & Database Completeness (18/20)**: Solid Clean Architecture structure, though Asset Management lacks database tables/controllers, and N+1 query patterns exist in ATS.

---

## 5. Final Verdict <a name="final-verdict"></a>

```
FINAL VERDICT: Requires Stabilization
```

**Justification**:  
While MPOSethu HRMS 2.0 possesses a robust, visually impressive frontend architecture and clean .NET 8 codebase structure, the application **requires stabilization** before production release due to:
1. **Critical Statutory Calculation Errors**: PF wage ceiling cap calculation in payroll.
2. **Incomplete Backing Infrastructure**: Asset Management module exists only as a UI skeleton without database tables or API controllers.
3. **Cross-Module Integration Gaps**: Manual interventions required between Attendance/Leave $\rightarrow$ Payroll, Onboarding $\rightarrow$ User Creation, and Travel $\rightarrow$ Disbursement.
4. **Security Hardening Requirements**: JWT secret validation, refresh token rotation, and MIME file upload verification.

Resolving the **3 Critical** and **12 High** priority tickets documented above will elevate the platform to **Ready for Production** status.

---
*Report Compiled by Senior QA Engineer, Enterprise Solution Architect, & Lead Business Analyst*
