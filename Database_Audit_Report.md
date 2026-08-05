# MPOSethu HRMS 2.0 — Database Audit Report

**Audit Mode**: STRICT READ-ONLY AUDIT  
**Audit Date**: August 5, 2026  
**Auditor Role**: Enterprise Database Architect  

---

## 1. Schema & Migration Audit

- **DbContext Class**: `IndiaHRMS.Infrastructure.Data.AppDbContext` ([AppDbContext.cs](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs))
- **Registered DbSets**: 54 Tables mapped to active domain entities.
- **Migration History**: All EF Core migrations up to `20260804112545_AddExitManagementModule` applied and verified.
- **Model Snapshot Sync**: 100% synchronized with entity definitions.

---

## 2. Referential Integrity & Constraints

- **Foreign Key Delete Guards**:
  - `LeaveApplication.EmployeeId` configured with `DeleteBehavior.Restrict` to protect historical leave records.
  - `User.EmployeeId` configured with `DeleteBehavior.SetNull` to preserve user audit records.
- **Unique Indexes**:
  - `User(Username)`, `User(Email)`
  - `Role(RoleCode)`
  - `Permission(PermissionCode)`
  - `Employee(EmployeeCode)`
  - `PayrollDetail(PayrollRunId, EmployeeId)` — Unique composite index verified ([AppDbContext.cs#L170](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs#L170)).
- **Schema CheckConstraints**:
  - `CK_LeaveBalance_NonNegativeClosing` (`[ClosingBalance] >= 0`) enforced at database engine level.

---

## 3. Seed Data Verification (`DatabaseSeeder.cs`)

- **Company Master**: Seeded (`Acme Technologies Pvt Ltd`).
- **Location Master**: Seeded (`Mumbai Head Office`).
- **Departments & Designations**: 4 core departments and 9 designations seeded.
- **Role & Permission Masters**: 13 enterprise roles and permission claims seeded.
- **Shift & Leave Masters**: General Shift (`GEN`), Earned Leave (`EL`), Sick Leave (`SL`) seeded.
- **Initial User Accounts**: 13 core test accounts seeded with deterministic GUIDs and default password `Demo@123`.
