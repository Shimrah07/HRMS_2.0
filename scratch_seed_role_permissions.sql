SET QUOTED_IDENTIFIER ON;

-- 1. Ensure basic Permission Master records exist
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE PermissionCode = 'EMPLOYEE.VIEW')
BEGIN
    INSERT INTO Permissions (PermissionId, PermissionCode, PermissionName, Module, Action, Description, CreatedAt) VALUES
    (NEWID(), 'EMPLOYEE.VIEW', 'View Employee Records', 'Employee', 'READ', 'Allows viewing employee profile list', GETUTCDATE()),
    (NEWID(), 'EMPLOYEE.CREATE', 'Create Employee Profile', 'Employee', 'CREATE', 'Allows adding new employee', GETUTCDATE()),
    (NEWID(), 'EMPLOYEE.EDIT', 'Edit Employee Profile', 'Employee', 'UPDATE', 'Allows editing employee details', GETUTCDATE()),
    (NEWID(), 'ATTENDANCE.VIEW', 'View Attendance Records', 'Attendance', 'READ', 'Allows viewing attendance history & team attendance', GETUTCDATE()),
    (NEWID(), 'ATTENDANCE.CREATE', 'Punch Attendance / Request Regularization', 'Attendance', 'CREATE', 'Allows punching and submitting regularizations', GETUTCDATE()),
    (NEWID(), 'ATTENDANCE.APPROVE', 'Approve Attendance Regularization', 'Attendance', 'APPROVE', 'Allows managers and HR to approve regularizations', GETUTCDATE()),
    (NEWID(), 'RECRUITMENT.VIEW', 'View Requisitions & Candidates', 'Recruitment', 'READ', 'Allows viewing job requisitions and candidate pipeline', GETUTCDATE()),
    (NEWID(), 'RECRUITMENT.CREATE', 'Create Job Requisition / Candidate', 'Recruitment', 'CREATE', 'Allows creating job requisitions and candidate entries', GETUTCDATE()),
    (NEWID(), 'COMPANY_SETUP.VIEW', 'View Company Organization Setup', 'CompanySetup', 'READ', 'Allows viewing company organization tree and options', GETUTCDATE());
END;

-- 2. Clear previous RolePermissions mappings for fresh seed
DELETE FROM RolePermissions;

-- 3. Populate RolePermissions for every standard role
-- Super Admin: All Permissions
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), r.RoleId, p.PermissionId
FROM Roles r CROSS JOIN Permissions p
WHERE r.RoleName = 'Super Admin';

-- HR Admin: All Permissions
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), r.RoleId, p.PermissionId
FROM Roles r CROSS JOIN Permissions p
WHERE r.RoleName = 'HR Admin';

-- Department Manager: Employee.View, Attendance.View, Attendance.Approve, Recruitment.View, CompanySetup.View
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), r.RoleId, p.PermissionId
FROM Roles r CROSS JOIN Permissions p
WHERE r.RoleName IN ('Department Manager', 'Reporting Manager')
  AND p.PermissionCode IN ('EMPLOYEE.VIEW', 'ATTENDANCE.VIEW', 'ATTENDANCE.CREATE', 'ATTENDANCE.APPROVE', 'RECRUITMENT.VIEW', 'RECRUITMENT.CREATE', 'COMPANY_SETUP.VIEW');

-- Finance Head: Employee.View, Attendance.View, CompanySetup.View
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), r.RoleId, p.PermissionId
FROM Roles r CROSS JOIN Permissions p
WHERE r.RoleName IN ('Finance Head', 'Payroll Admin')
  AND p.PermissionCode IN ('EMPLOYEE.VIEW', 'ATTENDANCE.VIEW', 'COMPANY_SETUP.VIEW');

-- Employee: Employee.View, Attendance.View, Attendance.Create, CompanySetup.View
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), r.RoleId, p.PermissionId
FROM Roles r CROSS JOIN Permissions p
WHERE r.RoleName = 'Employee'
  AND p.PermissionCode IN ('EMPLOYEE.VIEW', 'ATTENDANCE.VIEW', 'ATTENDANCE.CREATE', 'COMPANY_SETUP.VIEW');

-- COO / CEO: Employee.View, Attendance.View, Recruitment.View, CompanySetup.View
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), r.RoleId, p.PermissionId
FROM Roles r CROSS JOIN Permissions p
WHERE r.RoleName IN ('COO', 'CEO')
  AND p.PermissionCode IN ('EMPLOYEE.VIEW', 'ATTENDANCE.VIEW', 'RECRUITMENT.VIEW', 'COMPANY_SETUP.VIEW');

GO
