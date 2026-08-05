# HRMS End-to-End Automation Pipeline Implementation Plan

This plan details the implementation of a repeatable, automated End-to-End test suite and CI pipeline covering reference data seeding, M1 Employee Master, M2 Recruitment, M3 Attendance, and a full cross-module integration pipeline.

## Architectural Decisions & Rationale

- **Test Framework**: Playwright API testing mode (`@playwright/test` using the `request` fixture).
- **Location**: `tests/api/` in the root workspace.
- **Rationale**: `@playwright/test` is already installed in `package.json` and configured in `playwright.config.js`. Playwright provides lightweight, fast HTTP request context (`request` fixture), native HTML/JSON reporters, TypeScript/JavaScript support, and direct integration with existing Playwright UI suites without introducing secondary test runners or heavy .NET test project overhead.

---

## User Review Required

> [!IMPORTANT]
> **Database & Environment Dependencies**:
> - API backend server runs on `http://localhost:5110` (or `http://localhost:5000` in CI).
> - Tests use real API endpoints for all transactional operations. Lookup/Master data seeding uses idempotent API creation calls or direct SQL fallback for lookup tables.
> - Data isolation: All test-created records use the prefix `AUTOTEST_` to ensure clean identification and tear-down.

---

## Proposed Directory & File Structure

```
tests/
  api/
    fixtures/
      seedData.js                 # [NEW] Master reference data seeder script
      seedIds.json                # [NEW] Generated lookup table mapping names to real GUIDs
      testHelpers.js              # [NEW] JWT auth token caching & API request helpers
    m1_employee_master/
      create_employee.spec.js     # [NEW] Employee creation, validations & duplicate checks
      bulk_upload.spec.js         # [NEW] Bulk CSV upload processing & error reporting
      sensitive_field_masking.spec.js # [NEW] Permission-based PAN/Aadhaar/Bank masking
      maker_checker.spec.js       # [NEW] Interception, pending changes, approval/rejection
      scd_history.spec.js         # [NEW] EmployeeEmploymentHistory versioning & EffectiveTo boundaries
    m2_recruitment/
      mrf_approval_pipeline.spec.js # [NEW] Tiered MRF approval (HOD -> HR -> Finance) & rejection
      candidate_application_pipeline.spec.js # [NEW] Job posting, application, AI score & stage transitions
      interview_scheduling.spec.js # [NEW] Panel interview scheduling & consolidated rating aggregation
      offer_generation.spec.js    # [NEW] Offer CTC breakdown validation & acceptance
      blacklist_warning.spec.js   # [NEW] Blacklisted candidate flag surfacing in recruiter ATS view
      onboarding_conversion.spec.js # [NEW] BGV completion, onboarding to Employee & User conversion
    m3_attendance/
      punch_multiple_scans.spec.js # [NEW] Double-scan PunchLogs verification & CheckIn retention
      shift_assignment_history.spec.js # [NEW] Historical AttendanceRecord ShiftId immutability
      regularization_flow.spec.js # [NEW] Regularization submission, approval & rejection
      freeze_enforcement.spec.js  # [NEW] Attendance period freezing & pending approval blocking
      overtime_calculation.spec.js # [NEW] Net hours & BreakMins overtime calculation
    cross_module/
      recruitment_to_employee_to_attendance.spec.js # [NEW] Full lifecycle integration pipeline
.github/
  workflows/
    e2e-pipeline.yml              # [NEW] GitHub Actions workflow triggered on PRs
    nightly-pipeline.yml          # [NEW] Scheduled nightly cross-module regression workflow
```

---

## Proposed Implementation Details

### Component 1: Ticket A — Master/Reference Data Seeder
- Implement `tests/api/fixtures/seedData.js` to seed:
  - 1 Company, 3 Departments (Engineering, Sales, HR), 5 Designations, 3 Grades, 2 Shifts (Day & Night), 2 Locations, 2 Cost Centers.
  - Test user credentials for `SUPER_ADMIN`, `HR_ADMIN`, `HR_EXEC`, `DEPT_MANAGER`, `RECRUITMENT_MGR`, `EMPLOYEE`.
  - Idempotency checks: query existing data by name/code before creating to prevent duplicate key violations.
  - Save generated entity GUIDs to `tests/api/fixtures/seedIds.json`.

### Component 2: Ticket B — M1 Employee Master Test Suite
- `create_employee.spec.js`: Valid payload assertion (201/200), mandatory field validations (400), duplicate email/PAN rejection.
- `bulk_upload.spec.js`: Upload 5-row CSV (3 valid, 2 invalid). Assert `SuccessCount=3`, `FailureCount=2`, detailed row error messages, and DB existence of valid employees.
- `sensitive_field_masking.spec.js`: Role with/without `Security.ViewSensitiveData` permission verifying masked vs unmasked PAN/Aadhaar/Bank Account responses.
- `maker_checker.spec.js`: Verify non-HR admin sensitive edit returns `202 Accepted` + creates `PendingEmployeeChanges` row without updating `Employees` table; verify HR_ADMIN approval applies change and rejection marks row `Rejected`.
- `scd_history.spec.js`: Verify department updates close existing `EmployeeEmploymentHistory` row with `EffectiveTo = today` and insert new row with `EffectiveFrom = today`, creating multi-version chronological chain.

### Component 3: Ticket C — M2 Recruitment Test Suite
- `mrf_approval_pipeline.spec.js`: Multi-tier MRF approval (HOD -> HR -> Finance) with audit log logging; second MRF rejection test.
- `candidate_application_pipeline.spec.js`: Publish posting, submit candidate application, verify `AiMatchScore` calculation, validate stage transitions.
- `interview_scheduling.spec.js`: Schedule multi-panelist interview, submit individual ratings, assert consolidated rating aggregation.
- `offer_generation.spec.js`: Generate offer, verify CTC breakdown persistence and component summation, candidate acceptance.
- `blacklist_warning.spec.js`: Blacklist candidate, apply for new job posting, assert `isBlacklisted: true` and `blacklistReason` flag in recruiter-facing ATS pipeline endpoint.
- `onboarding_conversion.spec.js`: BGV 6-check completion, onboarding conversion to `Employees` row, linked `Users` account, default shift assignment, and "Joined" status.

### Component 4: Ticket D — M3 Attendance Test Suite
- `punch_multiple_scans.spec.js`: Double punch scan within 2s, verify 2 distinct `PunchLogs` rows created, and `AttendanceRecords.CheckIn` retains the initial punch time.
- `shift_assignment_history.spec.js`: Process attendance on Shift A, reassign employee to Shift B, verify historical `AttendanceRecord.ShiftId` remains Shift A.
- `regularization_flow.spec.js`: Submit regularization, approve (Absent -> Present), submit second request and reject (verify comment & record unchanged).
- `freeze_enforcement.spec.js`: Freeze date range, verify new regularization submission blocked, verify approving pre-existing pending regularization inside range is also blocked, unfreeze and verify submission unblocked.
- `overtime_calculation.spec.js`: 11 gross hours worked with 60 min break -> 2.0 OvertimeHours; worked hours < standard hours -> 0 OvertimeHours (non-negative).

### Component 5: Ticket E — Cross-Module Pipeline Test
- `recruitment_to_employee_to_attendance.spec.js`: Full end-to-end integration test exercising:
  1. MRF creation & approval
  2. Job publishing & application
  3. Interview scheduling & rating
  4. Offer generation & candidate acceptance
  5. BGV & onboarding conversion to Employee
  6. Linked User account & initial SCD history row verification
  7. Auto-assigned shift verification
  8. Punch in/out simulation
  9. Attendance regularization submission & approval
  10. Pay period freezing and edit blocking

### Component 6: Ticket F — CI Pipeline Wiring
- Create `.github/workflows/e2e-pipeline.yml` for pull requests:
  - MSSQL Docker service container (`mcr.microsoft.com/mssql/server:2022-latest`).
  - Run EF Core migrations against clean SQL database.
  - Launch backend API server.
  - Run Ticket A seeder script.
  - Run Playwright test suite (`npx playwright test`).
  - Upload Playwright HTML report artifact (`playwright-report/`).
- Create `.github/workflows/nightly-pipeline.yml` for daily scheduled runs.

---

## Verification Plan

### Automated Local Verification
1. Run Ticket A seeder script: `npx playwright test tests/api/fixtures/seedData.js` (or node runner).
2. Execute full API test suite locally: `npx playwright test tests/api/`.
3. Verify test pass/fail breakdown report.
4. Execute deliberate regression test (e.g. temporary assertion failure) to verify the suite catches failures.

### CI Verification
1. Push `.github/workflows/e2e-pipeline.yml`.
2. Inspect CI workflow syntax and container setup.
