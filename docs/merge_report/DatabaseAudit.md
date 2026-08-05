# MPOSethu HRMS 2.0 — Phase 2: Database Audit Report

**Audit Date**: August 5, 2026  
**Auditor Role**: Enterprise Database Architect  
**Mode**: READ ONLY DISCOVERY  

---

## 1. DbContext & EF Core Schema Overview

- **DbContext Class**: `IndiaHRMS.Infrastructure.Data.AppDbContext` ([AppDbContext.cs](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs))
- **Target Database Engine**: Microsoft SQL Server 2019+ / Azure SQL
- **Total Registered DbSets**: 54 Tables across 10 functional HR modules
- **Migration History**: Fully tracked under `IndiaHRMS.Infrastructure/Migrations`

---

## 2. Initial Data & Seeding Verification (`DatabaseSeeder.cs`)

| Verification Check | Status | Verification Evidence / Details |
| :--- | :--- | :--- |
| **Database Connection & Creation** | ✅ Verified | Automatic EF Core schema creation and SQL DDL fallback in `DatabaseSeeder.SeedAsync` |
| **Initial Admin User Exists** | ✅ Verified | `superadmin@company.com` seeded with fixed deterministic GUID `00000001-0000-0000-0000-000000000001` |
| **Initial Company Exists** | ✅ Verified | `Acme Technologies Pvt Ltd` seeded with CIN `U72900MH2024PTC000001` |
| **Initial Roles & RBAC Seeded** | ✅ Verified | 13 core enterprise roles seeded (`SUPER_ADMIN`, `HR_ADMIN`, `COO`, `FINANCE_HEAD`, `DEPT_MANAGER`, etc.) |
| **Initial Leave Policies Seeded** | ✅ Verified | Earned Leave (`EL`), Sick Leave (`SL`), Casual Leave (`CL`) seeded with default yearly quotas |
| **Initial Statutory & Payroll Settings** | ✅ Verified | PF wage ceiling (₹15,000), ESI gross limit (₹21,000), and Professional Tax slabs seeded |
| **Initial Departments & Designations** | ✅ Verified | 4 core departments (`ENG`, `HR`, `FIN`, `OPS`) and 9 designations seeded |
| **Initial Shift Master Seeded** | ✅ Verified | General Shift (`GEN`, 09:00 - 18:00, 15 mins grace period) seeded |

---

## 3. Database Schema Integrity Analysis

### A. Indexing Integrity
- **Unique Indexes**:
  - `User(Username)`, `User(Email)`
  - `Role(RoleCode)`
  - `Permission(PermissionCode)`
  - `Employee(EmployeeCode)`
  - `PayrollDetail(PayrollRunId, EmployeeId)` — Composite unique index verified ([AppDbContext.cs#L150-L200](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs#L150-L200)).
- **Foreign Key Performance Indexing**: High-cardinality foreign keys (`EmployeeId`, `PayrollRunId`, `CompanyId`, `DeptId`) possess EF Core indexes.

### B. Foreign Key Delete Behaviors & Referential Safeguards
- **Soft-Delete / Restrict Protection**:
  - `User.EmployeeId`: `OnDelete(DeleteBehavior.SetNull)`
  - `LeaveApplication.EmployeeId`: `OnDelete(DeleteBehavior.Restrict)` ([AppDbContext.cs#L300](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs#L300)) — Prevents accidental purging of historical leave records upon employee soft deletion.

### C. Database Check Constraints
- **Leave Balance CheckConstraint**: `CK_LeaveBalance_NonNegativeClosing` (`[ClosingBalance] >= 0`) configured in `AppDbContext.cs` model builder.

---

## 4. Entity Usage & Query Audit Summary

All 54 registered DbSets are mapped to active business features in API controllers and domain services, including:
- **Core HR & Organization**: `Companies`, `Departments`, `Designations`, `Locations`, `Employees`, `Users`, `Roles`, `Permissions`.
- **Attendance & Leave**: `AttendanceRecords`, `AttendanceRegularizations`, `ShiftMasters`, `LeaveTypes`, `LeaveBalances`, `LeaveApplications`.
- **Payroll & Statutory**: `PayrollRuns`, `PayrollDetails`, `SalaryStructures`, `EmployeeSalaryStructures`, `StatutoryDeductionConfigs`, `TaxDeclarations`, `EmployeeLoans`.
- **Recruitment & Onboarding**: `JobRequisitions`, `Candidates`, `JobApplications`, `InterviewRounds`, `OfferLetters`, `OnboardingProcesses`, `BGVRecords`.
- **Asset & Exit Management**: `AssetMaster`, `AssetAssignment`, `ExitRecords`, `ExitClearances`, `FFSCalculations`, `CounterOffers`.
