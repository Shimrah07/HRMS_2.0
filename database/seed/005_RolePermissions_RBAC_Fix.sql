-- ============================================================
-- MIGRATION: 005_RolePermissions_RBAC_Fix.sql
-- Purpose: Live-database patch for the B4.3 RBAC regression fix.
-- Safe to run on an existing database — uses NOT IN guards to
-- avoid duplicate inserts.
-- ============================================================
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

-- Step 1: Ensure all Master Permissions exist in the Permissions table
MERGE INTO Permissions AS target
USING (VALUES
  ('EMPLOYEE.VIEW', 'View Employees', 'Employee', 'View', 'View employee profiles and details.'),
  ('EMPLOYEE.CREATE', 'Create Employee', 'Employee', 'Create', 'Add new employees to the system.'),
  ('EMPLOYEE.EDIT', 'Edit Employee', 'Employee', 'Edit', 'Edit employee information.'),
  ('EMPLOYEE.DELETE', 'Delete Employee', 'Employee', 'Delete', 'Deactivate or remove employees.'),
  ('EMPLOYEE.EXPORT', 'Export Employees', 'Employee', 'Export', 'Export employee data to Excel/PDF.'),

  ('ATTENDANCE.VIEW', 'View Attendance', 'Attendance', 'View', 'View attendance records.'),
  ('ATTENDANCE.CREATE', 'Create Attendance', 'Attendance', 'Create', 'Mark attendance manually.'),
  ('ATTENDANCE.EDIT', 'Edit Attendance', 'Attendance', 'Edit', 'Edit attendance records.'),
  ('ATTENDANCE.APPROVE', 'Approve Regularization', 'Attendance', 'Approve', 'Approve attendance regularization requests.'),
  ('ATTENDANCE.EXPORT', 'Export Attendance', 'Attendance', 'Export', 'Export attendance data.'),
  ('ATTENDANCE.IMPORT', 'Import Attendance', 'Attendance', 'Import', 'Import attendance from biometric/Excel.'),

  ('LEAVE.VIEW', 'View Leaves', 'Leave', 'View', 'View leave applications and balances.'),
  ('LEAVE.CREATE', 'Apply Leave', 'Leave', 'Create', 'Apply for leave.'),
  ('LEAVE.EDIT', 'Edit Leave', 'Leave', 'Edit', 'Edit leave applications.'),
  ('LEAVE.APPROVE', 'Approve Leave', 'Leave', 'Approve', 'Approve leave applications.'),
  ('LEAVE.REJECT', 'Reject Leave', 'Leave', 'Reject', 'Reject leave applications.'),
  ('LEAVE.EXPORT', 'Export Leave', 'Leave', 'Export', 'Export leave reports.'),
  ('LEAVE.CONFIGURE', 'Configure Leave Types', 'Leave', 'Configure', 'Setup leave types and policies.'),

  ('PAYROLL.VIEW', 'View Payroll', 'Payroll', 'View', 'View payroll and salary slips.'),
  ('PAYROLL.PROCESS', 'Process Payroll', 'Payroll', 'Process', 'Run monthly payroll.'),
  ('PAYROLL.APPROVE', 'Approve Payroll', 'Payroll', 'Approve', 'Approve processed payroll.'),
  ('PAYROLL.EXPORT', 'Export Payroll', 'Payroll', 'Export', 'Export payroll reports and salary slips.'),
  ('PAYROLL.GENERATE', 'Generate Salary Slips', 'Payroll', 'Generate', 'Generate PDF salary slips.'),
  ('PAYROLL.CONFIGURE', 'Configure Payroll', 'Payroll', 'Configure', 'Configure salary components and structures.'),
  ('PAYROLL.DISBURSE', 'Disburse Payroll', 'Payroll', 'Disburse', 'Generate bank batch files for NEFT/RTGS salary disbursement.'),

  ('RECRUITMENT.VIEW', 'View Recruitment', 'Recruitment', 'View', 'View job requisitions and applications.'),
  ('RECRUITMENT.CREATE', 'Create Recruitment', 'Recruitment', 'Create', 'Create job requisitions and post jobs.'),
  ('RECRUITMENT.EDIT', 'Edit Recruitment', 'Recruitment', 'Edit', 'Edit recruitment records.'),
  ('RECRUITMENT.DELETE', 'Delete Recruitment', 'Recruitment', 'Delete', 'Cancel job requisitions.'),
  ('RECRUITMENT.APPROVE', 'Approve Requisition', 'Recruitment', 'Approve', 'Approve manpower requisitions.'),
  ('RECRUITMENT.EXPORT', 'Export Recruitment', 'Recruitment', 'Export', 'Export recruitment pipeline data.'),

  ('PERFORMANCE.VIEW', 'View Performance', 'Performance', 'View', 'View goals and appraisal data.'),
  ('PERFORMANCE.CREATE', 'Create Appraisal', 'Performance', 'Create', 'Create appraisal cycles and goals.'),
  ('PERFORMANCE.EDIT', 'Edit Appraisal', 'Performance', 'Edit', 'Edit goals and review ratings.'),
  ('PERFORMANCE.APPROVE', 'Approve Appraisal', 'Performance', 'Approve', 'Approve and finalize appraisals.'),
  ('PERFORMANCE.EXPORT', 'Export Performance', 'Performance', 'Export', 'Export performance reports.'),

  ('TRAINING.VIEW', 'View Training', 'Training', 'View', 'View training programs and schedules.'),
  ('TRAINING.CREATE', 'Create Training', 'Training', 'Create', 'Create training programs.'),
  ('TRAINING.EDIT', 'Edit Training', 'Training', 'Edit', 'Edit training details.'),
  ('TRAINING.ASSIGN', 'Assign Training', 'Training', 'Assign', 'Nominate employees for training.'),
  ('TRAINING.EXPORT', 'Export Training', 'Training', 'Export', 'Export training reports.'),

  ('SEPARATION.VIEW', 'View Separation', 'Separation', 'View', 'View resignation and offboarding requests.'),
  ('SEPARATION.CREATE', 'Initiate Separation', 'Separation', 'Create', 'Submit resignation or initiate exit.'),
  ('SEPARATION.APPROVE', 'Approve Separation', 'Separation', 'Approve', 'Approve resignation and clearance.'),
  ('SEPARATION.EXPORT', 'Export Separation', 'Separation', 'Export', 'Export separation reports.'),

  ('REPORTS.VIEW', 'View Reports', 'Reports', 'View', 'View system reports and analytics.'),
  ('REPORTS.EXPORT', 'Export Reports', 'Reports', 'Export', 'Export reports to Excel/PDF.'),
  ('REPORTS.GENERATE', 'Generate Custom Reports', 'Reports', 'Generate', 'Build and run custom reports.'),

  ('COMPANY_SETUP.VIEW', 'View Organization Setup', 'CompanySetup', 'View', 'View department, designation, location setup.'),
  ('COMPANY_SETUP.CREATE', 'Create Organization Setup', 'CompanySetup', 'Create', 'Add new departments, designations, locations.'),
  ('COMPANY_SETUP.EDIT', 'Edit Organization Setup', 'CompanySetup', 'Edit', 'Modify organization structure.'),
  ('COMPANY_SETUP.DELETE', 'Delete Organization Setup', 'CompanySetup', 'Delete', 'Deactivate departments/locations.'),

  ('USER_MGMT.VIEW', 'View User Accounts', 'UserManagement', 'View', 'View user accounts and assigned roles.'),
  ('USER_MGMT.CREATE', 'Create User Account', 'UserManagement', 'Create', 'Create system login accounts.'),
  ('USER_MGMT.EDIT', 'Edit User Account', 'UserManagement', 'Edit', 'Modify user accounts and status.'),
  ('USER_MGMT.DELETE', 'Delete User Account', 'UserManagement', 'Delete', 'Deactivate or lock user accounts.'),
  ('USER_MGMT.ASSIGN', 'Assign Roles', 'UserManagement', 'Assign', 'Assign roles to user accounts.'),

  ('COMPLIANCE.VIEW', 'View Compliance', 'Compliance', 'View', 'View statutory compliance status.'),
  ('COMPLIANCE.EXPORT', 'Export Compliance', 'Compliance', 'Export', 'Export compliance filings and reports.'),

  ('AUDIT.VIEW', 'View Audit Trail', 'Audit', 'View', 'View system security and audit logs.'),
  ('AUDIT.EXPORT', 'Export Audit Logs', 'Audit', 'Export', 'Export security audit trails.')
) AS source (PermissionCode, PermissionName, Module, [Action], Description)
ON target.PermissionCode = source.PermissionCode
WHEN NOT MATCHED THEN
  INSERT (PermissionId, PermissionCode, PermissionName, Module, [Action], Description, CreatedAt)
  VALUES (NEWID(), source.PermissionCode, source.PermissionName, source.Module, source.[Action], source.Description, GETUTCDATE());

PRINT 'Master Permissions synced successfully.';

-- Step 2: Ensure HR_EXEC and FINANCE_HEAD roles exist in Roles table
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'HR_EXEC')
BEGIN
    INSERT INTO Roles (RoleId, RoleName, RoleCode, Description, IsSystem, IsActive, CreatedAt)
    VALUES (NEWID(), 'HR Executive', 'HR_EXEC', 'Read-heavy HR operations without approval rights.', 1, 1, GETUTCDATE());
    PRINT 'Added HR_EXEC role.';
END

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'FINANCE_HEAD')
BEGIN
    INSERT INTO Roles (RoleId, RoleName, RoleCode, Description, IsSystem, IsActive, CreatedAt)
    VALUES (NEWID(), 'Finance Head', 'FINANCE_HEAD', 'Payroll approval tier and financial oversight.', 1, 1, GETUTCDATE());
    PRINT 'Added FINANCE_HEAD role.';
END

-- ─── Step 3: Populate RolePermissions for all 12 Roles ────────────────────────

-- SUPER_ADMIN: All permissions
DECLARE @SuperAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'SUPER_ADMIN');
IF @SuperAdminRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @SuperAdminRoleId, PermissionId
    FROM Permissions
    WHERE PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @SuperAdminRoleId);
    PRINT 'SUPER_ADMIN permissions applied.';
END

-- HR_ADMIN: All EXCEPT USER_MGMT.DELETE and COMPANY_SETUP write
DECLARE @HRAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_ADMIN');
IF @HRAdminRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @HRAdminRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode NOT IN ('USER_MGMT.DELETE', 'COMPANY_SETUP.CREATE', 'COMPANY_SETUP.EDIT', 'COMPANY_SETUP.DELETE')
      AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @HRAdminRoleId);
    PRINT 'HR_ADMIN permissions applied.';
END

-- HR_MANAGER
DECLARE @HRManagerRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_MANAGER');
IF @HRManagerRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @HRManagerRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'EMPLOYEE.VIEW', 'EMPLOYEE.EDIT',
        'ATTENDANCE.VIEW', 'ATTENDANCE.CREATE', 'ATTENDANCE.EDIT', 'ATTENDANCE.APPROVE', 'ATTENDANCE.EXPORT', 'ATTENDANCE.IMPORT',
        'LEAVE.VIEW', 'LEAVE.APPROVE', 'LEAVE.REJECT', 'LEAVE.EXPORT', 'LEAVE.CONFIGURE',
        'PERFORMANCE.VIEW', 'PERFORMANCE.CREATE', 'PERFORMANCE.EDIT', 'PERFORMANCE.APPROVE', 'PERFORMANCE.EXPORT',
        'TRAINING.VIEW', 'TRAINING.CREATE', 'TRAINING.EDIT', 'TRAINING.ASSIGN', 'TRAINING.EXPORT',
        'SEPARATION.VIEW', 'REPORTS.VIEW', 'REPORTS.EXPORT', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @HRManagerRoleId);
    PRINT 'HR_MANAGER permissions applied.';
END

-- PAYROLL_ADMIN
DECLARE @PayrollAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'PAYROLL_ADMIN');
IF @PayrollAdminRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @PayrollAdminRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'PAYROLL.VIEW', 'PAYROLL.PROCESS', 'PAYROLL.APPROVE', 'PAYROLL.EXPORT',
        'PAYROLL.GENERATE', 'PAYROLL.CONFIGURE', 'PAYROLL.DISBURSE',
        'EMPLOYEE.VIEW', 'REPORTS.VIEW', 'REPORTS.EXPORT', 'REPORTS.GENERATE', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @PayrollAdminRoleId);
    PRINT 'PAYROLL_ADMIN permissions applied.';
END

-- RECRUITMENT_MGR
DECLARE @RecruitmentMgrRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'RECRUITMENT_MGR');
IF @RecruitmentMgrRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @RecruitmentMgrRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'RECRUITMENT.VIEW', 'RECRUITMENT.CREATE', 'RECRUITMENT.EDIT', 'RECRUITMENT.DELETE', 'RECRUITMENT.APPROVE', 'RECRUITMENT.EXPORT',
        'EMPLOYEE.VIEW', 'EMPLOYEE.CREATE', 'REPORTS.VIEW', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @RecruitmentMgrRoleId);
    PRINT 'RECRUITMENT_MGR permissions applied.';
END

-- DEPT_MANAGER
DECLARE @DeptManagerRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'DEPT_MANAGER');
IF @DeptManagerRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @DeptManagerRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'EMPLOYEE.VIEW', 'ATTENDANCE.VIEW', 'ATTENDANCE.EDIT', 'ATTENDANCE.APPROVE',
        'LEAVE.VIEW', 'LEAVE.APPROVE', 'LEAVE.REJECT', 'PERFORMANCE.VIEW', 'PERFORMANCE.EDIT',
        'REPORTS.VIEW', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @DeptManagerRoleId);
    PRINT 'DEPT_MANAGER permissions applied.';
END

-- EMPLOYEE
DECLARE @EmployeeRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'EMPLOYEE');
IF @EmployeeRoleId IS NOT NULL
BEGIN
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
    PRINT 'EMPLOYEE permissions applied.';
END

-- AUDITOR
DECLARE @AuditorRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'AUDITOR');
IF @AuditorRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @AuditorRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'EMPLOYEE.VIEW', 'EMPLOYEE.EXPORT', 'ATTENDANCE.VIEW', 'ATTENDANCE.EXPORT',
        'LEAVE.VIEW', 'LEAVE.EXPORT', 'PAYROLL.VIEW', 'PAYROLL.EXPORT',
        'RECRUITMENT.VIEW', 'RECRUITMENT.EXPORT', 'PERFORMANCE.VIEW', 'PERFORMANCE.EXPORT',
        'TRAINING.VIEW', 'TRAINING.EXPORT', 'SEPARATION.VIEW', 'SEPARATION.EXPORT',
        'REPORTS.VIEW', 'REPORTS.EXPORT', 'COMPLIANCE.VIEW', 'COMPLIANCE.EXPORT',
        'AUDIT.VIEW', 'AUDIT.EXPORT', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @AuditorRoleId);
    PRINT 'AUDITOR permissions applied.';
END

-- IT_ADMIN
DECLARE @ITAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'IT_ADMIN');
IF @ITAdminRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @ITAdminRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'USER_MGMT.VIEW', 'USER_MGMT.CREATE', 'USER_MGMT.EDIT', 'USER_MGMT.DELETE', 'USER_MGMT.ASSIGN', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @ITAdminRoleId);
    PRINT 'IT_ADMIN permissions applied.';
END

-- FINANCE_VIEWER
DECLARE @FinanceViewerRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'FINANCE_VIEWER');
IF @FinanceViewerRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @FinanceViewerRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'PAYROLL.VIEW', 'REPORTS.VIEW', 'REPORTS.EXPORT', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @FinanceViewerRoleId);
    PRINT 'FINANCE_VIEWER permissions applied.';
END

-- HR_EXEC
DECLARE @HRExecRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_EXEC');
IF @HRExecRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @HRExecRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'EMPLOYEE.VIEW', 'EMPLOYEE.EDIT', 'ATTENDANCE.VIEW', 'LEAVE.VIEW', 'REPORTS.VIEW', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @HRExecRoleId);
    PRINT 'HR_EXEC permissions applied.';
END

-- FINANCE_HEAD
DECLARE @FinanceHeadRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'FINANCE_HEAD');
IF @FinanceHeadRoleId IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
    SELECT NEWID(), @FinanceHeadRoleId, PermissionId
    FROM Permissions
    WHERE PermissionCode IN (
        'PAYROLL.VIEW', 'PAYROLL.APPROVE', 'PAYROLL.EXPORT', 'PAYROLL.GENERATE', 'PAYROLL.DISBURSE', 'PAYROLL.CONFIGURE',
        'EMPLOYEE.VIEW', 'REPORTS.VIEW', 'REPORTS.EXPORT', 'RECRUITMENT.APPROVE', 'COMPANY_SETUP.VIEW'
    )
    AND PermissionId NOT IN (SELECT PermissionId FROM RolePermissions WHERE RoleId = @FinanceHeadRoleId);
    PRINT 'FINANCE_HEAD permissions applied.';
END

PRINT '005_RolePermissions_RBAC_Fix: Migration complete.';
