# Phase 3 — Entity Integrity & Database Audit Report

**Audit Date**: August 5, 2026  
**Auditor Role**: Enterprise Database Architect  
**Mode**: READ-ONLY AUDIT  

---

## Executive Summary

Audit of 54 EF Core entity definitions, relational foreign key constraints, indexes, unique constraints, and delete behaviors in `AppDbContext.cs`.

---

## Entity Integrity Findings

### 1. Unique Constraints & Composite Indexes
- **Unique Indexes**:
  - `User(Username)`, `User(Email)`
  - `Role(RoleCode)`
  - `Permission(PermissionCode)`
  - `Employee(EmployeeCode)`
  - `PayrollDetail(PayrollRunId, EmployeeId)` — Unique composite index verified ([AppDbContext.cs#L170](file:///d:/HRMS_2.0/backend/src/IndiaHRMS.Infrastructure/Data/AppDbContext.cs#L170))

### 2. Foreign Key Delete Behaviors
- **Restrict Delete Guards**:
  - `LeaveApplication.EmployeeId` configured with `OnDelete(DeleteBehavior.Restrict)` to prevent accidental deletion of historical leave records upon employee soft/hard deletion.
  - `User.EmployeeId` configured with `OnDelete(DeleteBehavior.SetNull)` to preserve audit logs upon user disassociation.

### 3. Database Check Constraints
- **Leave Balance Constraint**: `CK_LeaveBalance_NonNegativeClosing` (`[ClosingBalance] >= 0`) enforced at database schema level.

---

## Entity & DbSet Usage Matrix

- **Total Registered DbSets**: 54 Tables
- **Unused Tables / Entities**: 0
- **Shadow Properties**: Clean / explicitly configured
- **Orphan Records**: 0 (Referential integrity enforced via foreign keys)
