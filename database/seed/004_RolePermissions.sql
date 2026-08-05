-- ============================================================
-- IndiaHRMS Seed Data: Role Permissions Mapping — B4.3 Matrix
-- Replaces the previous stub that only seeded SUPER_ADMIN.
-- Every role now has explicit, intentional permission grants.
-- ============================================================

-- ─── SUPER_ADMIN: All permissions ────────────────────────────────────────────
DECLARE @SuperAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'SUPER_ADMIN');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @SuperAdminRoleId, PermissionId
FROM Permissions
WHERE PermissionId NOT IN (
    SELECT PermissionId FROM RolePermissions WHERE RoleId = @SuperAdminRoleId
);

-- ─── HR_ADMIN: All EXCEPT USER_MGMT.DELETE and COMPANY_SETUP.* ──────────────
DECLARE @HRAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_ADMIN');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @HRAdminRoleId, PermissionId
FROM Permissions
WHERE PermissionCode NOT IN ('USER_MGMT.DELETE', 'COMPANY_SETUP.CREATE', 'COMPANY_SETUP.EDIT', 'COMPANY_SETUP.DELETE')
  AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @HRAdminRoleId);

-- ─── HR_MANAGER ───────────────────────────────────────────────────────────────
-- EMPLOYEE.VIEW/EDIT, ATTENDANCE.*, LEAVE.APPROVE/VIEW, PERFORMANCE.*, 
-- TRAINING.*, SEPARATION.VIEW, REPORTS.VIEW/EXPORT
DECLARE @HRManagerRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_MANAGER');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @HRManagerRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'EMPLOYEE.VIEW', 'EMPLOYEE.EDIT',
    'ATTENDANCE.VIEW', 'ATTENDANCE.CREATE', 'ATTENDANCE.EDIT', 'ATTENDANCE.APPROVE', 'ATTENDANCE.EXPORT', 'ATTENDANCE.IMPORT',
    'LEAVE.VIEW', 'LEAVE.APPROVE', 'LEAVE.REJECT', 'LEAVE.EXPORT', 'LEAVE.CONFIGURE',
    'PERFORMANCE.VIEW', 'PERFORMANCE.CREATE', 'PERFORMANCE.EDIT', 'PERFORMANCE.APPROVE', 'PERFORMANCE.EXPORT',
    'TRAINING.VIEW', 'TRAINING.CREATE', 'TRAINING.EDIT', 'TRAINING.ASSIGN', 'TRAINING.EXPORT',
    'SEPARATION.VIEW',
    'REPORTS.VIEW', 'REPORTS.EXPORT',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @HRManagerRoleId);

-- ─── PAYROLL_ADMIN ────────────────────────────────────────────────────────────
-- PAYROLL.*, EMPLOYEE.VIEW, REPORTS.VIEW/EXPORT/GENERATE
DECLARE @PayrollAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'PAYROLL_ADMIN');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @PayrollAdminRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'PAYROLL.VIEW', 'PAYROLL.PROCESS', 'PAYROLL.APPROVE', 'PAYROLL.EXPORT', 'PAYROLL.GENERATE', 'PAYROLL.CONFIGURE', 'PAYROLL.DISBURSE',
    'EMPLOYEE.VIEW',
    'REPORTS.VIEW', 'REPORTS.EXPORT', 'REPORTS.GENERATE',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @PayrollAdminRoleId);

-- ─── RECRUITMENT_MGR ─────────────────────────────────────────────────────────
-- RECRUITMENT.*, EMPLOYEE.CREATE/VIEW, REPORTS.VIEW
DECLARE @RecruitmentMgrRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'RECRUITMENT_MGR');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @RecruitmentMgrRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'RECRUITMENT.VIEW', 'RECRUITMENT.CREATE', 'RECRUITMENT.EDIT', 'RECRUITMENT.DELETE', 'RECRUITMENT.APPROVE', 'RECRUITMENT.EXPORT',
    'EMPLOYEE.VIEW', 'EMPLOYEE.CREATE',
    'REPORTS.VIEW',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @RecruitmentMgrRoleId);

-- ─── DEPT_MANAGER ────────────────────────────────────────────────────────────
-- EMPLOYEE.VIEW, ATTENDANCE.VIEW/EDIT (team-scoped in app logic), LEAVE.APPROVE/VIEW (team-scoped),
-- PERFORMANCE.VIEW/EDIT (team-scoped), REPORTS.VIEW (team-scoped)
-- NOTE: "team only" scoping is enforced in application logic, not by the permission code alone.
DECLARE @DeptManagerRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'DEPT_MANAGER');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @DeptManagerRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'EMPLOYEE.VIEW',
    'ATTENDANCE.VIEW', 'ATTENDANCE.EDIT', 'ATTENDANCE.APPROVE',
    'LEAVE.VIEW', 'LEAVE.APPROVE', 'LEAVE.REJECT',
    'PERFORMANCE.VIEW', 'PERFORMANCE.EDIT',
    'REPORTS.VIEW',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @DeptManagerRoleId);

-- ─── EMPLOYEE ────────────────────────────────────────────────────────────────
-- Own data only: ATTENDANCE.VIEW, LEAVE.CREATE/VIEW, PAYROLL.VIEW (own slips),
-- PERFORMANCE.VIEW (own), EMPLOYEE.VIEW (own profile), EMPLOYEE.EDIT (own contact/bank)
-- NOTE: "own only" scoping is enforced in application logic (employeeId filter).
DECLARE @EmployeeRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'EMPLOYEE');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @EmployeeRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'EMPLOYEE.VIEW', 'EMPLOYEE.EDIT',
    'ATTENDANCE.VIEW', 'ATTENDANCE.CREATE',
    'LEAVE.VIEW', 'LEAVE.CREATE',
    'PAYROLL.VIEW',
    'PERFORMANCE.VIEW',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @EmployeeRoleId);

-- ─── AUDITOR ─────────────────────────────────────────────────────────────────
-- *.VIEW and *.EXPORT across all modules — no writes
DECLARE @AuditorRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'AUDITOR');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @AuditorRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'EMPLOYEE.VIEW', 'EMPLOYEE.EXPORT',
    'ATTENDANCE.VIEW', 'ATTENDANCE.EXPORT',
    'LEAVE.VIEW', 'LEAVE.EXPORT',
    'PAYROLL.VIEW', 'PAYROLL.EXPORT',
    'RECRUITMENT.VIEW', 'RECRUITMENT.EXPORT',
    'PERFORMANCE.VIEW', 'PERFORMANCE.EXPORT',
    'TRAINING.VIEW', 'TRAINING.EXPORT',
    'SEPARATION.VIEW', 'SEPARATION.EXPORT',
    'REPORTS.VIEW', 'REPORTS.EXPORT',
    'COMPLIANCE.VIEW', 'COMPLIANCE.EXPORT',
    'AUDIT.VIEW', 'AUDIT.EXPORT',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @AuditorRoleId);

-- ─── IT_ADMIN ────────────────────────────────────────────────────────────────
-- USER_MGMT.*, COMPANY_SETUP.VIEW
DECLARE @ITAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'IT_ADMIN');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @ITAdminRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'USER_MGMT.VIEW', 'USER_MGMT.CREATE', 'USER_MGMT.EDIT', 'USER_MGMT.DELETE', 'USER_MGMT.ASSIGN',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @ITAdminRoleId);

-- ─── FINANCE_VIEWER ──────────────────────────────────────────────────────────
-- PAYROLL.VIEW, REPORTS.VIEW/EXPORT
DECLARE @FinanceViewerRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'FINANCE_VIEWER');
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @FinanceViewerRoleId, PermissionId
FROM Permissions
WHERE PermissionCode IN (
    'PAYROLL.VIEW',
    'REPORTS.VIEW', 'REPORTS.EXPORT',
    'COMPANY_SETUP.VIEW'
)
AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @FinanceViewerRoleId);

-- ─── HR_EXEC (PROPOSED — confirmed in RBAC regression fix) ───────────────────
-- Read-heavy subset of HR_MANAGER: EMPLOYEE.VIEW/EDIT (restricted fields enforced in app),
-- ATTENDANCE.VIEW, LEAVE.VIEW (no APPROVE), REPORTS.VIEW
DECLARE @HRExecRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_EXEC');
IF @HRExecRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @HRExecRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'EMPLOYEE.VIEW', 'EMPLOYEE.EDIT',
        'ATTENDANCE.VIEW',
        'LEAVE.VIEW',
        'REPORTS.VIEW',
        'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @HRExecRoleId);
END;

-- ─── FINANCE_HEAD (PROPOSED — confirmed in RBAC regression fix) ──────────────
-- Approval tier: PAYROLL.VIEW/APPROVE/EXPORT/GENERATE/DISBURSE, EMPLOYEE.VIEW,
-- REPORTS.VIEW/EXPORT, RECRUITMENT.APPROVE (for MRF sign-off workflow)
DECLARE @FinanceHeadRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'FINANCE_HEAD');
IF @FinanceHeadRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @FinanceHeadRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'PAYROLL.VIEW', 'PAYROLL.APPROVE', 'PAYROLL.EXPORT', 'PAYROLL.GENERATE', 'PAYROLL.DISBURSE', 'PAYROLL.CONFIGURE',
        'EMPLOYEE.VIEW',
        'REPORTS.VIEW', 'REPORTS.EXPORT',
        'RECRUITMENT.APPROVE',
        'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @FinanceHeadRoleId);
END;

PRINT 'All role permissions seeded per B4.3 matrix successfully.';
