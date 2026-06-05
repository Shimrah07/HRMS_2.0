-- ============================================================
-- IndiaHRMS Seed Data: Permissions
-- ============================================================
INSERT INTO Permissions (PermissionId, PermissionCode, PermissionName, Module, [Action], Description, CreatedAt)
VALUES
  -- Employee Module
  (NEWID(), 'EMPLOYEE.VIEW', 'View Employees', 'Employee', 'View', 'View employee profiles and details.', GETUTCDATE()),
  (NEWID(), 'EMPLOYEE.CREATE', 'Create Employee', 'Employee', 'Create', 'Add new employees to the system.', GETUTCDATE()),
  (NEWID(), 'EMPLOYEE.EDIT', 'Edit Employee', 'Employee', 'Edit', 'Edit employee information.', GETUTCDATE()),
  (NEWID(), 'EMPLOYEE.DELETE', 'Delete Employee', 'Employee', 'Delete', 'Deactivate or remove employees.', GETUTCDATE()),
  (NEWID(), 'EMPLOYEE.EXPORT', 'Export Employees', 'Employee', 'Export', 'Export employee data to Excel/PDF.', GETUTCDATE()),

  -- Attendance Module
  (NEWID(), 'ATTENDANCE.VIEW', 'View Attendance', 'Attendance', 'View', 'View attendance records.', GETUTCDATE()),
  (NEWID(), 'ATTENDANCE.CREATE', 'Create Attendance', 'Attendance', 'Create', 'Mark attendance manually.', GETUTCDATE()),
  (NEWID(), 'ATTENDANCE.EDIT', 'Edit Attendance', 'Attendance', 'Edit', 'Edit attendance records.', GETUTCDATE()),
  (NEWID(), 'ATTENDANCE.APPROVE', 'Approve Regularization', 'Attendance', 'Approve', 'Approve attendance regularization requests.', GETUTCDATE()),
  (NEWID(), 'ATTENDANCE.EXPORT', 'Export Attendance', 'Attendance', 'Export', 'Export attendance data.', GETUTCDATE()),
  (NEWID(), 'ATTENDANCE.IMPORT', 'Import Attendance', 'Attendance', 'Import', 'Import attendance from biometric/Excel.', GETUTCDATE()),

  -- Leave Module
  (NEWID(), 'LEAVE.VIEW', 'View Leaves', 'Leave', 'View', 'View leave applications and balances.', GETUTCDATE()),
  (NEWID(), 'LEAVE.CREATE', 'Apply Leave', 'Leave', 'Create', 'Apply for leave.', GETUTCDATE()),
  (NEWID(), 'LEAVE.EDIT', 'Edit Leave', 'Leave', 'Edit', 'Edit leave applications.', GETUTCDATE()),
  (NEWID(), 'LEAVE.APPROVE', 'Approve Leave', 'Leave', 'Approve', 'Approve leave applications.', GETUTCDATE()),
  (NEWID(), 'LEAVE.REJECT', 'Reject Leave', 'Leave', 'Reject', 'Reject leave applications.', GETUTCDATE()),
  (NEWID(), 'LEAVE.EXPORT', 'Export Leave', 'Leave', 'Export', 'Export leave reports.', GETUTCDATE()),
  (NEWID(), 'LEAVE.CONFIGURE', 'Configure Leave Types', 'Leave', 'Configure', 'Setup leave types and policies.', GETUTCDATE()),

  -- Payroll Module
  (NEWID(), 'PAYROLL.VIEW', 'View Payroll', 'Payroll', 'View', 'View payroll and salary slips.', GETUTCDATE()),
  (NEWID(), 'PAYROLL.PROCESS', 'Process Payroll', 'Payroll', 'Process', 'Run monthly payroll.', GETUTCDATE()),
  (NEWID(), 'PAYROLL.APPROVE', 'Approve Payroll', 'Payroll', 'Approve', 'Approve processed payroll.', GETUTCDATE()),
  (NEWID(), 'PAYROLL.EXPORT', 'Export Payroll', 'Payroll', 'Export', 'Export payroll reports and salary slips.', GETUTCDATE()),
  (NEWID(), 'PAYROLL.GENERATE', 'Generate Salary Slips', 'Payroll', 'Generate', 'Generate PDF salary slips.', GETUTCDATE()),
  (NEWID(), 'PAYROLL.CONFIGURE', 'Configure Payroll', 'Payroll', 'Configure', 'Configure salary components and structures.', GETUTCDATE()),

  -- Recruitment Module
  (NEWID(), 'RECRUITMENT.VIEW', 'View Recruitment', 'Recruitment', 'View', 'View job requisitions and applications.', GETUTCDATE()),
  (NEWID(), 'RECRUITMENT.CREATE', 'Create Recruitment', 'Recruitment', 'Create', 'Create job requisitions and post jobs.', GETUTCDATE()),
  (NEWID(), 'RECRUITMENT.EDIT', 'Edit Recruitment', 'Recruitment', 'Edit', 'Edit recruitment records.', GETUTCDATE()),
  (NEWID(), 'RECRUITMENT.DELETE', 'Delete Recruitment', 'Recruitment', 'Delete', 'Cancel job requisitions.', GETUTCDATE()),
  (NEWID(), 'RECRUITMENT.APPROVE', 'Approve Requisition', 'Recruitment', 'Approve', 'Approve manpower requisitions.', GETUTCDATE()),
  (NEWID(), 'RECRUITMENT.EXPORT', 'Export Recruitment', 'Recruitment', 'Export', 'Export recruitment pipeline data.', GETUTCDATE()),

  -- Performance Module
  (NEWID(), 'PERFORMANCE.VIEW', 'View Performance', 'Performance', 'View', 'View goals and appraisal data.', GETUTCDATE()),
  (NEWID(), 'PERFORMANCE.CREATE', 'Create Appraisal', 'Performance', 'Create', 'Create appraisal cycles and goals.', GETUTCDATE()),
  (NEWID(), 'PERFORMANCE.EDIT', 'Edit Appraisal', 'Performance', 'Edit', 'Edit goals and review ratings.', GETUTCDATE()),
  (NEWID(), 'PERFORMANCE.APPROVE', 'Approve Appraisal', 'Performance', 'Approve', 'Approve and finalize appraisals.', GETUTCDATE()),
  (NEWID(), 'PERFORMANCE.EXPORT', 'Export Performance', 'Performance', 'Export', 'Export performance reports.', GETUTCDATE()),

  -- Training Module
  (NEWID(), 'TRAINING.VIEW', 'View Training', 'Training', 'View', 'View training programs and schedules.', GETUTCDATE()),
  (NEWID(), 'TRAINING.CREATE', 'Create Training', 'Training', 'Create', 'Create training programs.', GETUTCDATE()),
  (NEWID(), 'TRAINING.EDIT', 'Edit Training', 'Training', 'Edit', 'Edit training details.', GETUTCDATE()),
  (NEWID(), 'TRAINING.ASSIGN', 'Assign Training', 'Training', 'Assign', 'Nominate employees for training.', GETUTCDATE()),
  (NEWID(), 'TRAINING.EXPORT', 'Export Training', 'Training', 'Export', 'Export training reports.', GETUTCDATE()),

  -- Separation Module
  (NEWID(), 'SEPARATION.VIEW', 'View Separation', 'Separation', 'View', 'View separation and exit records.', GETUTCDATE()),
  (NEWID(), 'SEPARATION.CREATE', 'Initiate Separation', 'Separation', 'Create', 'Initiate employee separation process.', GETUTCDATE()),
  (NEWID(), 'SEPARATION.APPROVE', 'Approve Separation', 'Separation', 'Approve', 'Approve separations and FnF settlement.', GETUTCDATE()),
  (NEWID(), 'SEPARATION.EXPORT', 'Export Separation', 'Separation', 'Export', 'Export separation data.', GETUTCDATE()),

  -- Reports Module
  (NEWID(), 'REPORTS.VIEW', 'View Reports', 'Reports', 'View', 'View standard and custom reports.', GETUTCDATE()),
  (NEWID(), 'REPORTS.EXPORT', 'Export Reports', 'Reports', 'Export', 'Export reports to Excel/PDF.', GETUTCDATE()),
  (NEWID(), 'REPORTS.GENERATE', 'Generate Reports', 'Reports', 'Generate', 'Run and generate reports.', GETUTCDATE()),
  (NEWID(), 'REPORTS.CUSTOM', 'Custom Reports', 'Reports', 'Custom', 'Create custom report queries.', GETUTCDATE()),

  -- User Management Module
  (NEWID(), 'USER_MGMT.VIEW', 'View Users', 'UserManagement', 'View', 'View system users and roles.', GETUTCDATE()),
  (NEWID(), 'USER_MGMT.CREATE', 'Create User', 'UserManagement', 'Create', 'Create new system users.', GETUTCDATE()),
  (NEWID(), 'USER_MGMT.EDIT', 'Edit User', 'UserManagement', 'Edit', 'Edit user accounts.', GETUTCDATE()),
  (NEWID(), 'USER_MGMT.DELETE', 'Delete User', 'UserManagement', 'Delete', 'Deactivate user accounts.', GETUTCDATE()),
  (NEWID(), 'USER_MGMT.ASSIGN', 'Assign Roles', 'UserManagement', 'Assign', 'Assign roles and permissions.', GETUTCDATE()),

  -- Company Setup Module
  (NEWID(), 'COMPANY_SETUP.VIEW', 'View Company Setup', 'CompanySetup', 'View', 'View company configuration.', GETUTCDATE()),
  (NEWID(), 'COMPANY_SETUP.CREATE', 'Create Setup', 'CompanySetup', 'Create', 'Create departments, designations, locations.', GETUTCDATE()),
  (NEWID(), 'COMPANY_SETUP.EDIT', 'Edit Setup', 'CompanySetup', 'Edit', 'Edit company configuration.', GETUTCDATE()),
  (NEWID(), 'COMPANY_SETUP.DELETE', 'Delete Setup', 'CompanySetup', 'Delete', 'Delete configuration records.', GETUTCDATE()),

  -- Compliance Module
  (NEWID(), 'COMPLIANCE.VIEW', 'View Compliance', 'Compliance', 'View', 'View statutory compliance data.', GETUTCDATE()),
  (NEWID(), 'COMPLIANCE.MANAGE', 'Manage Compliance', 'Compliance', 'Manage', 'Manage PF, ESI, TDS filings.', GETUTCDATE()),
  (NEWID(), 'COMPLIANCE.EXPORT', 'Export Compliance', 'Compliance', 'Export', 'Export compliance reports and challans.', GETUTCDATE()),

  -- Audit Module
  (NEWID(), 'AUDIT.VIEW', 'View Audit Logs', 'Audit', 'View', 'View system audit trail.', GETUTCDATE()),
  (NEWID(), 'AUDIT.EXPORT', 'Export Audit Logs', 'Audit', 'Export', 'Export audit trail data.', GETUTCDATE());

PRINT 'Permissions seeded successfully.';
