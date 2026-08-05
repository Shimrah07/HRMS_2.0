# MPOSethu HRMS 2.0 — Phase 1: Project Structure Audit

**Audit Date**: August 5, 2026  
**Auditor Role**: Principal Software Architect & Release Engineer  
**Mode**: READ ONLY DISCOVERY  

---

## 1. High-Level Folder Tree

```
HRMS_2.0/
├── backend/
│   └── src/
│       ├── IndiaHRMS.API/                    # ASP.NET Core Web API Controllers, Filters, Extensions & Program.cs
│       ├── IndiaHRMS.Application/            # DTOs, Mappings, Interfaces, Validators & Business Services
│       ├── IndiaHRMS.Domain/                 # Core Entities, Enums & System Constants
│       ├── IndiaHRMS.Infrastructure/         # EF Core AppDbContext, Repositories, Migrations & Services
│       └── IndiaHRMS.Shared/                 # Shared API Response Wrappers, Paging & Result abstractions
├── dHRMS_2.0frontend/
│   └── src/
│       ├── assets/                           # Static assets, SVG/PNG logos, brand icons
│       ├── components/                       # Common UI components (Header, PageHeader, EmptyState, Layout)
│       ├── constants/                        # API endpoints, Permission codes, Role constants, Navigation items
│       ├── data/                             # Mock data fallbacks and static JSON definitions
│       ├── hooks/                            # Custom React Hooks (useAuth, usePermissions, useTheme)
│       ├── lib/                              # Utility libraries and Axios HTTP instances
│       ├── pages/                            # React Page Views grouped by module domain
│       ├── router/                           # React Router index configuration with ProtectedRoute wrappers
│       ├── services/                         # API service layer handling Axios HTTP requests
│       └── store/                            # Zustand global stores (authStore, uiStore)
├── database/                                 # SQL scripts and DB seed manifests
├── docs/                                     # System architecture and integration documentation
├── scratch_*.sql / scratch_*.cs              # Maintenance & seed scratch scripts
├── QA_TICKETS.md                             # QA Audit Ticket log
├── package.json / package-lock.json          # Root npm configurations
└── playwright.config.js                      # E2E test runner configuration
```

---

## 2. Directory & Structural Integrity Analysis

### A. Unused & Orphaned Folders
- **`backend/src/cleanup_departments.sql`**: One-off maintenance script leftover in backend source root.
- **`scratch_fix_hashes.sql`**, **`scratch_seed_demo_data.sql`**, **`scratch_seed_role_permissions.sql`**, **`scratch_sync_passwords.cs`**, **`scratch_unlock_all.sql`**: Maintenance scripts located in the root repository.

### B. Legacy & Deprecated Pages
- **`dHRMS_2.0frontend/src/pages/payroll/PayrollPage.jsx`**: Retained legacy flat payroll view superseded by modular pages (`PayrollDashboardPage.jsx`, `PayrollRunPage.jsx`, `SalaryStructurePage.jsx`).

### C. Duplicate DTO & Entity Audits
- **`IndiaHRMS.Domain/Entities/Entities.cs`**: Contains monolithic definition of all domain models.
- **`IndiaHRMS.Application/DTOs`**: Well-segregated into sub-namespaces (`Attendance`, `Employee`, `Leave`, `Payroll`, `Recruitment`, `TravelExpense`, `ExitManagement`).

---

## 3. Structural Health Checklist

| Category | Status | Details & File References |
| :--- | :--- | :--- |
| **Duplicate Controllers** | None | Controllers cleanly mapped in `IndiaHRMS.API/Controllers` |
| **Unused DbSets** | Clean | All 45+ DbSets in `AppDbContext.cs` mapped to valid entities |
| **Unused Components** | Clean | `EmptyState.jsx`, `PageHeader.jsx`, `ProtectedRoute.jsx` actively referenced |
| **State Management** | Clean | Zustand lightweight store architecture (`authStore.js`, `uiStore.js`) |
