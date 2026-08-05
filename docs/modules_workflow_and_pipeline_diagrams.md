# HRMS 2.0 — Architecture, Workflows & Pipeline Flow Diagrams

This document provides a complete technical explanation of **Module 1 (Employee Master)**, **Module 2 (Recruitment)**, and **Module 3 (Attendance & Punch Processing)**, complete with Mermaid flowcharts, sequence diagrams, and feature comparison maps.

---

## Executive Overview: Architecture & Cross-Module Pipeline

The system is built on a clean 3-Tier Architecture (React Frontend, ASP.NET Core 8 Web API, SQL Server 2022 DB) enforcing module isolation and strict cross-module event flows.

```mermaid
flowchart TD
    subgraph M2["Module 2: Recruitment"]
        A[Job Requisition] --> B[Candidate Sourcing]
        B --> C[Blacklist Screening]
        C --> D[Interview & Evaluation]
        D --> E[Offer Letter & Hired Status]
    end

    subgraph M1["Module 1: Employee Master"]
        E -->|Trigger Hire Conversion| F[Create Employee Profile]
        F --> G[Initialize SCD Type 2 History]
        F --> H[RBAC & Sensitive Data Masking]
        F --> I[Maker-Checker Interceptor]
    end

    subgraph M3["Module 3: Attendance Engine"]
        F -->|Link Employee Code| J[Ingest Device / Web Punches]
        J --> K[Shift & Break Mins Computation]
        K --> L[Overtime & Regularization]
        L --> M[Attendance Freeze & Lockout]
        M --> N[Statutory Muster Roll Report]
    end
```

---

## Module 1: Employee Master & Identity Governance

### Core Features
1. **Employee Profile Management**: Maintains demographics, employment dates, grades, cost centers, and contact details.
2. **Maker-Checker Interception**: Sensitive fields (Aadhaar, PAN, Bank account details) trigger a `202 Accepted` response and create an asynchronous pending approval request (`PendingEmployeeChanges`) rather than mutating live records directly.
3. **Slowly Changing Dimension (SCD Type 2)**: Tracks historical department, designation, grade, and manager changes with `EffectiveFrom` and `EffectiveTo` timestamps.
4. **Batch CSV Import Engine**: Handles bulk employee onboarding with automatic sequential code generation (`EMP0001` - `EMP9999`) and partial failure row reporting.
5. **Sensitive Field Masking**: Dynamically masks sensitive identity numbers for standard users while displaying full unmasked values for users holding the `Security.ViewSensitiveData` permission code.

---

### Pipeline 1.1: Employee Creation & Maker-Checker Approval Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Manager / HR
    participant API as ASP.NET Core API
    participant MC as Maker-Checker Interceptor
    participant DB as SQL Server DB
    actor HRAdmin as HR Admin

    User->>API: POST /api/v1/employees (Payload)
    API->>API: Validate Mandatory Fields & DTO Rules
    alt Validation Fails
        API-->>User: 400 Bad Request (Validation Errors)
    else Validation Passes
        API->>API: Check Sensitive Fields (PAN/Aadhaar/Bank)
        alt Is Non-HR User updating Sensitive Field
            API->>MC: Intercept Edit Request
            MC->>DB: Insert into PendingEmployeeChanges (Status = 'Pending')
            API-->>User: 202 Accepted (Request Sent for Approval)
            HRAdmin->>API: POST /api/v1/employees/changes/{id}/approve
            API->>DB: Update Live Employee Record & Set Status = 'Approved'
        else Is Direct SuperAdmin / HR Admin
            API->>DB: Insert Employee & Initial SCD Type 2 Row
            API-->>User: 201 Created (Employee Details)
        end
    end
```

---

### Pipeline 1.2: SCD Type 2 Historical Versioning Engine

```mermaid
flowchart TD
    A[Update Employee Dept / Designation] --> B{Existing Active Record?}
    B -->|Yes| C[Fetch Current Row where EffectiveTo IS NULL]
    C --> D[Set Current Row EffectiveTo = GETUTCDATE()]
    D --> E[Insert New Row: EffectiveFrom = GETUTCDATE(), EffectiveTo = NULL]
    E --> F[Commit DB Transaction]
    F --> G[GET /employees/{id}/employment-history returns full timeline]
```

---

### Pipeline 1.3: Bulk CSV Import & Batch Code Generator

```mermaid
flowchart LR
    CSV[Upload CSV File] --> Read[Parse Multipart Stream]
    Read --> Loop[Iterate Rows 1 to N]
    Loop --> Validate{Row Data Valid?}
    Validate -->|No| ErrLog[Append to Errors List: Row # + Reason]
    Validate -->|Yes| LocalCheck[Check EF Local Tracked Entities]
    LocalCheck --> CodeGen[Generate Distinct Sequential Code EMPxxxx]
    CodeGen --> AddEntity[Context.Employees.Add]
    ErrLog --> NextRow[Next Row]
    AddEntity --> NextRow
    NextRow --> Save[SaveChangesAsync Single Transaction]
    Save --> Response[Return Summary: X Succeeded, Y Failed + Errors]
```

---

## Module 2: Recruitment & Candidate Pipeline

### Core Features
1. **Job Requisition Management**: Creation, departmental budget verification, and vacancy tracking.
2. **Candidate Sourcing & Screening**: Captures candidate details, resume attachments, and referral sources.
3. **Blacklist Screening Engine**: Performs real-time duplicate and blacklist checks against PAN, Aadhaar, and phone numbers before application submission.
4. **Interviews & Evaluation**: Candidate stage progression (`Applied`, `Screening`, `Interview`, `Offered`, `Hired`, `Rejected`).
5. **Conversion to Employee**: Hired candidate auto-populates the Employee onboarding form.

---

### Pipeline 2.1: End-to-End Candidate Sourcing & Hiring Flow

```mermaid
flowchart TD
    REQ[Create Job Requisition] --> POST[Post Job Opening]
    POST --> CAND[Candidate Application]
    CAND --> BL{Blacklist Check: PAN/Aadhaar/Phone}
    BL -->|Match Found| WARN[Flag Blacklist Warning / Reject Application]
    BL -->|No Match| SCR[Screening & Shortlisting]
    SCR --> INT[Schedule Interview Rounds]
    INT --> EVAL{Evaluation Result}
    EVAL -->|Failed| REJ[Mark Candidate Status: Rejected]
    EVAL -->|Passed| OFF[Generate Offer Letter]
    OFF --> ACC{Offer Accepted?}
    ACC -->|Accepted| HIRE[Mark Candidate Status: Hired]
    HIRE --> CONV[Trigger POST /api/v1/employees]
    CONV --> EMP[Employee Account Provisioned]
```

---

## Module 3: Attendance & Punch Processing Engine

### Core Features
1. **Multi-Channel Punch Ingestion**: Ingests attendance scans from biometrics, mobile GPS, and web logs.
2. **Multi-Scan Retention**: Retains all raw daily punches while identifying the earliest `CheckIn` and latest `CheckOut`.
3. **Break Deduction & Overtime Calculation**: Deducts `BreakMins` (e.g. 60 mins) from total duration to compute accurate `WorkingHours` and `OvertimeHours`.
4. **Month Freeze / Payroll Protection**: Prevents attendance regularizations or modifications inside frozen date ranges (`IsFrozen = 1`).
5. **Statutory Muster Roll Engine**: Generates monthly statutory compliance reports (Form 25).

---

### Pipeline 3.1: Punch Ingestion & Daily Working Hours Calculation

```mermaid
flowchart TD
    Raw[Raw Punch Event: Device ID, Emp ID, Timestamp] --> Dup{Duplicate Punch within 60s?}
    Dup -->|Yes| Drop[Ignore Duplicate Scan]
    Dup -->|No| Store[Store Punch Log]
    Store --> DailyProcess[Process Daily Attendance]
    DailyProcess --> Shift[Fetch Employee ShiftMaster]
    Shift --> Hours[Calculate Total Duration = CheckOut - CheckIn]
    Hours --> Break[Deduct Shift.BreakMins e.g. 60m]
    Break --> Net[Net Working Hours]
    Net --> OT{Net Working Hours > Shift Duration?}
    OT -->|Yes| CalcOT[OvertimeHours = Net - ShiftStandardHours]
    OT -->|No| NoOT[OvertimeHours = 0.0]
    CalcOT --> SaveRec[Update AttendanceRecord]
    NoOT --> SaveRec
```

---

### Pipeline 3.2: Attendance Regularization & Freeze Lockout Flow

```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee
    participant API as Attendance API
    participant DB as SQL Server DB
    actor Mgr as Reporting Manager / HR

    Emp->>API: POST /api/v1/attendance/regularize (Date, Time, Reason)
    API->>DB: Check if AttendanceRecord.IsFrozen == 1 for Date
    alt Attendance Frozen for Payroll
        API-->>Emp: 400 Bad Request (Attendance is frozen for payroll processing)
    else Period Unlocked
        API->>DB: Insert AttendanceRegularization (Status = 'Pending')
        API-->>Emp: 200 OK (Request Submitted)
        Mgr->>API: GET /api/v1/attendance/regularizations/queue
        API-->>Mgr: Return Pending Requests for Direct Reports
        Mgr->>API: POST /api/v1/attendance/regularizations/{id}/approve
        API->>DB: Update AttendanceRecord CheckIn/Out & Set Status = 'Approved'
        API-->>Mgr: 200 OK (Regularization Applied)
    end
```

---

### Pipeline 3.3: Statutory Muster Roll Reporting Flow

```mermaid
flowchart LR
    Req[GET /api/v1/attendance/muster?month=7&year=2026] --> Auth{Has ViewPermission?}
    Auth -->|No| 403[403 Forbidden]
    Auth -->|Yes| QueryDB[Query Active Employees & AttendanceRecords for Month]
    QueryDB --> Grid[Construct Daily Matrix: Day 1 to 31]
    Grid --> CodeMap[Map Status: P=Present, L=Late, A=Absent, W=WeeklyOff, OL=OnLeave]
    CodeMap --> Agg[Aggregate Total Present Days, Absent Days, Overtime Hours]
    Agg --> Form25[Format Statutory Muster Roll DTO / Form 25 Export]
    Form25 --> Res[Return 200 OK Paged Response]
```

---

## Summary Matrix of Module Pipelines

| Module | Pipeline / Process | Trigger | Key Entity / Table | Output / Result |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Maker-Checker Approval | Sensitive Edit by Non-Admin | `PendingEmployeeChanges` | HTTP 202, Dual-Control Approval |
| **M1** | SCD Type 2 History | Dept / Designation Edit | `EmployeeEmploymentHistory` | Complete Employment Timeline |
| **M1** | Bulk Onboarding | CSV Stream Upload | `Employees` | Batch import with sequential codes |
| **M2** | Candidate Sourcing | Job Application | `Candidates`, `JobApplications` | Blacklist Check & Stage Progress |
| **M2** | Hiring Conversion | Offer Acceptance | `Candidates` -> `Employees` | Provisioned Employee Record |
| **M3** | Punch Processing | Biometric / Web Scan | `AttendanceRecords` | Net Hours & Overtime Logged |
| **M3** | Regularization Lockout | Employee Request | `AttendanceRegularizations` | Approved Punch or Freeze Block |
| **M3** | Statutory Muster Roll | Monthly Compliance Request | `AttendanceRecords` | Form 25 Legal Compliance Matrix |
