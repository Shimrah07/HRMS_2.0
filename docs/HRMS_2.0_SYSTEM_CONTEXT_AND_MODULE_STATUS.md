# HRMS 2.0 — System Context & Module Status Overview

**Last Updated**: July 2026  
**Platform**: IndiaHRMS 2.0 Enterprise Workforce & ATS Platform  
**Architecture**: .NET 8 Web API Backend + React 19 / Vite 8 / Ant Design 6 Frontend

---

## 1. Executive Summary

HRMS 2.0 is a modern, enterprise-grade Human Resource Management and Applicant Tracking System (ATS). The system is fully operational with a dual-layer architecture:
- **Backend**: Clean Architecture .NET 8 Web API with EF Core, SQL Server, JWT authentication, and fine-grained permission-based authorization (RBAC).
- **Frontend**: High-performance React 19 SPA powered by Vite 8, Ant Design 6, Zustand state management, TanStack React Query v5, and Framer Motion visual aesthetics.

---

## 2. Implemented & Smoothly Working Modules

### 🔹 Module 1: Employee Master Management
- **Employee List & Directory**: Comprehensive searchable/filterable employee roster supporting pagination, department/location filtering, status badges, and quick actions.
- **Employee Profile Overview**: Personal info, employment details, compensation, document attachments, emergency contacts, and timeline logs.
- **Create & Edit Employee**: Multi-tab management for personal details, work assignment, compensation, bank details, and identity documents.
- **Organization Chart**: Interactive visual org hierarchy mapping managers, direct reports, and department structures.

---

### 🔹 Module 2: Recruitment & ATS Workflow

#### 1. Manpower Requisition Form (MRF) & Approval Engine
- **Multi-Level Approval Flow**:
  - HOD raises MRF -> COO Approval -> HR Approval -> Finance Approval.
  - Final fulfillment routing: Internal Hiring OR External Job Posting creation.
- **Return Requisition for Correction**:
  - Allows approvers (COO/HR/Finance) to send requisitions back to the creator with mandatory correction remarks.
  - Visuals: Uses Ant Design **`RollbackOutlined`** return arrow icon and orange warning styling across tags, headers, and action modals.

#### 2. Job Openings & Publishing
- **Job Posting Management**: Create job postings directly from approved MRFs.
- **Publishing Channels**: Internal Job Posting, Careers Portal, LinkedIn, Naukri, Indeed, Employee Referral.
- **Lifecycle States**: `Draft` -> `Published` -> `Paused` -> `Closed` -> `Archived`.

#### 3. Candidate Intake & Database Single Source of Truth
- **Candidate Database Workspace**: Central repository storing all candidate records (`CandidatesPage.jsx`).
- **Header Action Bar Sequence**:
  1. `+ Add Candidate` (Primary CTA for Manual HR Add)
  2. `Import CSV` (Bulk spreadsheet upload)
  3. `Refer Candidate` (Dedicated employee referral drawer)
  4. `AI Resume Parser [Coming Soon]` (Phase 5 showcase preview modal)
  5. `Export` (Candidate CSV export)
- **Automatic Source Channel Tagging**: Recruiter manual additions automatically set `Source = ManualHR`.
- **Source Enum Badging**:
  - 🟢 **Manual HR** (`ManualHR` / `ManualHREntry`)
  - 🔵 **CSV Import** (`CSVImport`)
  - 🟣 **Employee Referral** (`EmployeeReferral`)
  - 🟠 **Careers Portal** (`CareerPortal` / `CareersPortal`)
  - 🤖 **Resume Parser** (`ResumeParser`)

#### 4. Multi-Channel Candidate Intake Layer
- **Manual HR Add**: Recruiter manual candidate profile registration with document upload.
- **CSV / Excel Import**: Dual-mode support allowing bulk import with target job application linking or direct Candidate Database import when `JobId` is omitted.
- **Employee Referral**: Direct employee referral registration searching active employees, linking to optional job postings, and adding `"Referred by <Employee Name>"` timeline records.
- **Careers Portal (`/careers`)**: Public candidate application page routing to `PendingApplicationsPage.jsx` for HR review before candidate creation.
- **AI Resume Parser (Phase 5 Showcase)**: Modal detailing upcoming automated CV extraction (Name, Email, Phone, Experience, Skills, Education, Company, Expected CTC).

#### 5. Applications Pipeline & ATS Kanban Board
- **Single Entry Point (`ApplyToJobAsync`)**: All intake channels funnel through `ApplicationService.ApplyToJobAsync()`, ensuring duplicate email/mobile protection and candidate profile reuse.
- **ATS Stage Transitions**: `Applied` -> `Screening` -> `Shortlisted` -> `InterviewL1` -> `InterviewL2` -> `ManagerReview` -> `HRInterview` -> `Offer` -> `BackgroundCheck` -> `Onboarding`.
- **Workspace Notes & Scoring**: Recruiter notes, candidate rating stars, interview evaluation forms, and timeline event auditing.

#### 6. Offer, BGV & Onboarding Conversion
- **Offers Management**: Offer letter generation, compensation breakdown, candidate acceptance simulation.
- **Background Verification (BGV)**: Pre-onboarding document verification (`Pending`, `In Progress`, `Cleared`, `Failed`).
- **Onboarding & Employee Master Conversion**: Seamless conversion of hired candidates into active Employee Master records upon onboarding completion.

---

### 🔹 Module 3: Organization & System Administration
- **Departments & Designations**: Department hierarchy, designation management, job grades, and headcounts.
- **Locations & Offices**: Multi-location branch setup (Headquarters, Regional Offices, Remote hubs).
- **Users & Roles**: Role-Based Access Control (RBAC) supporting `SUPER_ADMIN`, `HR_ADMIN`, `HR_MANAGER`, `RECRUITMENT_MANAGER`, `HOD`, `FINANCE_ADMIN`, `COO`, `EMPLOYEE`.
- **Security Audit Logs**: Track authentication events, failed logins, password changes, and system activities.

---

### 🔹 Module 4, 5, 6 & 7: Core HR Utilities
- **Attendance Management**: Daily punch logs, shift mapping, attendance regularizations.
- **Leave Management**: Leave requests, holiday calendar, leave balances, manager approval workflows.
- **Payroll System**: Salary structures, payslip generation, allowances, tax deductions, pay runs.
- **Performance Management**: Appraisal cycles, goal setting, KPI scoring, 360 feedback reviews.

---

## 3. Key Architectural Component Audit

### 🛠️ `PageHeader.jsx` Component Fix
- **File**: [`src/components/common/PageHeader.jsx`](file:///d:/HRMS_2.0/dHRMS_2.0frontend/src/components/common/PageHeader.jsx)
- **Resolved Issue**: Updated `PageHeader` prop destructuring to support both `extra` and `actions` props (`const actionContent = extra || actions`). This ensures header action buttons render properly across all workspace pages.

---

## 4. Summary of Verification Status

| Module / Feature | Status | Verification Details |
| :--- | :---: | :--- |
| **Employee Master** | ✅ Operational | List, Profiles, Directory, Org Chart verified |
| **MRF Approval Flow** | ✅ Operational | Multi-level approval + Return for Correction verified |
| **Job Openings** | ✅ Operational | Draft -> Published -> Closed workflow verified |
| **Candidate Database** | ✅ Operational | Filter, export, timeline, source badges verified |
| **Header Actions (`PageHeader`)** | ✅ Operational | Restructured 5 standalone header buttons verified |
| **CSV / Excel Import** | ✅ Operational | Dual-mode (Job Link vs. Candidate DB) verified |
| **Employee Referral** | ✅ Operational | Active employee search & timeline logging verified |
| **Careers Portal (`/careers`)** | ✅ Operational | Public apply + Pending Queue HR approval verified |
| **ATS Kanban Pipeline** | ✅ Operational | Drag & drop stage transitions verified |
| **Offer & BGV** | ✅ Operational | Offer generation & verification flow verified |
| **Onboarding Conversion** | ✅ Operational | Candidate -> Employee conversion verified |
| **Role-Based Security** | ✅ Operational | JWT claims + Permission guards verified |

---

## 5. Upcoming Engineering Task (Phase 2.2)
- **Candidate Registration Drawer Unification**: Extract multi-step candidate registration drawer into `src/components/recruitment/CandidateRegistrationDrawer.jsx` to serve as the single source of truth for manual candidate registration across `CandidatesPage.jsx` and `JobOpeningsPage.jsx`.
