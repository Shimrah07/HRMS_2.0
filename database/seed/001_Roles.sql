-- ============================================================
-- IndiaHRMS Seed Data: Roles
-- ============================================================
DECLARE @SuperAdminRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @HRAdminRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @HRManagerRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @PayrollAdminRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @RecruitmentMgrRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @DeptManagerRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @EmployeeRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @AuditorRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @ITAdminRoleId UNIQUEIDENTIFIER = NEWID();
DECLARE @FinanceViewerRoleId UNIQUEIDENTIFIER = NEWID();

INSERT INTO Roles (RoleId, RoleName, RoleCode, Description, IsSystem, IsActive, CreatedAt)
VALUES
  (@SuperAdminRoleId, 'Super Admin', 'SUPER_ADMIN', 'Full access to all modules and configurations.', 1, 1, GETUTCDATE()),
  (@HRAdminRoleId, 'HR Admin', 'HR_ADMIN', 'Full access to HR operations.', 1, 1, GETUTCDATE()),
  (@HRManagerRoleId, 'HR Manager', 'HR_MANAGER', 'Manage HR processes and approvals.', 1, 1, GETUTCDATE()),
  (@PayrollAdminRoleId, 'Payroll Admin', 'PAYROLL_ADMIN', 'Process and approve payroll.', 1, 1, GETUTCDATE()),
  (@RecruitmentMgrRoleId, 'Recruitment Manager', 'RECRUITMENT_MGR', 'Manage recruitment and offers.', 1, 1, GETUTCDATE()),
  (@DeptManagerRoleId, 'Department Manager', 'DEPT_MANAGER', 'Manage team attendance, leaves, and appraisals.', 1, 1, GETUTCDATE()),
  (@EmployeeRoleId, 'Employee', 'EMPLOYEE', 'Standard employee self-service access.', 1, 1, GETUTCDATE()),
  (@AuditorRoleId, 'Auditor', 'AUDITOR', 'Read-only access to audit logs and reports.', 1, 1, GETUTCDATE()),
  (@ITAdminRoleId, 'IT Admin', 'IT_ADMIN', 'Manage users and system settings.', 1, 1, GETUTCDATE()),
  (@FinanceViewerRoleId, 'Finance Viewer', 'FINANCE_VIEWER', 'View payroll and financial reports.', 1, 1, GETUTCDATE());

PRINT 'Roles seeded successfully.';
