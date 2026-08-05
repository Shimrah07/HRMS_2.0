# Phase 2 — Database Seeding Verification Report

**Audit Date**: August 5, 2026  
**Auditor Role**: Enterprise Database Architect  
**Mode**: READ-ONLY AUDIT  

---

## Executive Summary

Audit of SQL Server schema, migration history, and database master table seeding routines in `DatabaseSeeder.cs`.

---

## Master Table Seeding Verification Matrix

| Master Domain | Seed Status | Verification Evidence / Details |
| :--- | :---: | :--- |
| **Company Master** | ✅ Verified | `Acme Technologies Pvt Ltd` (CIN: `U72900MH2024PTC000001`) seeded |
| **Location Master** | ✅ Verified | `Mumbai Head Office` (Andheri East) seeded |
| **Department Master** | ✅ Verified | 4 Core departments seeded (`ENG`, `HR`, `FIN`, `OPS`) |
| **Designation Master** | ✅ Verified | 9 Designations seeded (`Super Admin`, `Head of HR`, `Software Engineer`, etc.) |
| **Role & Permission Master** | ✅ Verified | 13 Enterprise roles (`SUPER_ADMIN`, `HR_ADMIN`, `COO`, `FINANCE_HEAD`, etc.) and full permission claims |
| **Shift Master** | ✅ Verified | General Shift (`GEN`, 09:00 - 18:00, 15 min grace period) seeded |
| **Leave Types & Balances** | ✅ Verified | Earned Leave (`EL`), Sick Leave (`SL`), Casual Leave (`CL`) with yearly quotas & encashability |
| **Statutory & Tax Configurations** | ✅ Verified | PF Ceiling (₹15,000), ESI Limit (₹21,000), Professional Tax Slabs (MH) seeded |
| **Cost Centers & Business Units** | ✅ Verified | `R&D Cost Center`, `Operations Cost Center`, `Product Development BU` seeded |
| **Initial User Accounts** | ✅ Verified | 13 Core test users seeded with deterministic GUIDs and default password `Demo@123` |

---

## Migration & Schema Status

- **Pending Migrations**: 0 (All EF Core migrations applied up to `20260804112545_AddExitManagementModule`)
- **Failed Migrations**: 0
- **Model Snapshot Sync**: `AppDbContextModelSnapshot.cs` is 100% in sync with domain entities.
