-- ============================================================
-- IndiaHRMS Seed Data: Default Admin User + Company
-- ============================================================

-- 1. Company
DECLARE @CompanyId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Companies (CompanyId, CompanyName, CIN, PAN, TAN, RegisteredAddress, City, State, Pincode, Website, Phone, Email, IsActive, CreatedAt)
VALUES (@CompanyId, 'Acme Technologies Pvt Ltd', 'U72900MH2024PTC000001', 'AABCA1234A', 'MUMA00001A',
        '123 Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400069',
        'https://acme.example.com', '+91-22-12345678', 'hr@acme.example.com', 1, GETUTCDATE());

-- 2. Default Location
DECLARE @LocationId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Locations (LocationId, CompanyId, LocationName, Address, City, State, Pincode, IsHeadOffice, IsActive, CreatedAt)
VALUES (@LocationId, @CompanyId, 'Mumbai Head Office', '123 Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400069', 1, 1, GETUTCDATE());

-- 3. HR Department
DECLARE @HRDeptId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Departments (DeptId, CompanyId, DeptName, DeptCode, IsActive, CreatedAt)
VALUES (@HRDeptId, @CompanyId, 'Human Resources', 'HR', 1, GETUTCDATE());

-- 4. System Admin Designation
DECLARE @SysAdminDesignationId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Designations (DesignationId, CompanyId, Title, Grade, Level, MinBasic, MaxBasic, IsActive, CreatedAt)
VALUES (@SysAdminDesignationId, @CompanyId, 'System Administrator', 'SYS', 0, 0, 999999, 1, GETUTCDATE());

-- 5. Super Admin Employee
DECLARE @AdminEmployeeId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Employees (EmployeeId, CompanyId, EmployeeCode, FirstName, LastName, OfficialEmail,
                        DeptId, DesignationId, LocationId, JoiningDate,
                        EmploymentType, EmploymentStatus, IsActive, CreatedAt)
VALUES (@AdminEmployeeId, @CompanyId, 'EMP0001', 'System', 'Administrator', 'admin@acme.example.com',
        @HRDeptId, @SysAdminDesignationId, @LocationId, CAST(GETUTCDATE() AS DATE),
        'FullTime', 'Active', 1, GETUTCDATE());

-- 6. Super Admin User (password: Admin@123456)
-- BCrypt hash for 'Admin@123456' with workFactor=12
DECLARE @AdminUserId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Users (UserId, EmployeeId, Username, Email, FirstName, LastName,
                   PasswordHash, PasswordSalt, IsActive, IsLocked, FailedLoginCount,
                   MustChangePassword, CreatedAt)
VALUES (@AdminUserId, @AdminEmployeeId, 'admin', 'admin@acme.example.com', 'System', 'Administrator',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeimrVILrn8vT.LpG', '',
        1, 0, 0, 1, GETUTCDATE());

-- 7. Assign Super Admin role to admin user
DECLARE @SuperAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'SUPER_ADMIN');
INSERT INTO UserRoles (UserRoleId, UserId, RoleId, AssignedAt, IsActive, CreatedAt)
VALUES (NEWID(), @AdminUserId, @SuperAdminRoleId, GETUTCDATE(), 1, GETUTCDATE());

-- 8. System Settings
INSERT INTO SystemSettings (SettingId, CompanyId, SettingKey, SettingValue, DataType, Description, CreatedAt)
VALUES
  (NEWID(), @CompanyId, 'PF_EMPLOYEE_PERCENT', '12', 'decimal', 'Employee PF contribution %', GETUTCDATE()),
  (NEWID(), @CompanyId, 'PF_EMPLOYER_PERCENT', '12', 'decimal', 'Employer PF contribution %', GETUTCDATE()),
  (NEWID(), @CompanyId, 'PF_WAGE_CEILING', '15000', 'decimal', 'PF statutory wage ceiling (INR)', GETUTCDATE()),
  (NEWID(), @CompanyId, 'ESI_EMPLOYEE_PERCENT', '0.75', 'decimal', 'Employee ESI contribution %', GETUTCDATE()),
  (NEWID(), @CompanyId, 'ESI_EMPLOYER_PERCENT', '3.25', 'decimal', 'Employer ESI contribution %', GETUTCDATE()),
  (NEWID(), @CompanyId, 'ESI_WAGE_CEILING', '21000', 'decimal', 'ESI statutory wage ceiling (INR)', GETUTCDATE()),
  (NEWID(), @CompanyId, 'BONUS_WAGE_CEILING', '21000', 'decimal', 'Bonus Act wage ceiling (INR)', GETUTCDATE()),
  (NEWID(), @CompanyId, 'GRATUITY_NUMERATOR', '15', 'int', 'Gratuity formula numerator', GETUTCDATE()),
  (NEWID(), @CompanyId, 'GRATUITY_DENOMINATOR', '26', 'int', 'Gratuity formula denominator', GETUTCDATE()),
  (NEWID(), @CompanyId, 'GRATUITY_MAX_AMOUNT', '2000000', 'decimal', 'Gratuity maximum tax-exempt amount', GETUTCDATE()),
  (NEWID(), @CompanyId, 'EMPLOYEE_ID_PREFIX', 'EMP', 'string', 'Employee ID prefix', GETUTCDATE()),
  (NEWID(), @CompanyId, 'PROBATION_PERIOD_DAYS', '90', 'int', 'Default probation period in days', GETUTCDATE()),
  (NEWID(), @CompanyId, 'MAX_FAILED_LOGIN_ATTEMPTS', '5', 'int', 'Maximum failed login attempts before lockout', GETUTCDATE()),
  (NEWID(), @CompanyId, 'ACCOUNT_LOCKOUT_MINUTES', '30', 'int', 'Account lockout duration in minutes', GETUTCDATE()),
  (NEWID(), @CompanyId, 'SESSION_TIMEOUT_MINUTES', '60', 'int', 'Session timeout in minutes', GETUTCDATE()),
  (NEWID(), @CompanyId, 'PASSWORD_MIN_LENGTH', '8', 'int', 'Minimum password length', GETUTCDATE());

PRINT 'Default company, admin user, and system settings seeded successfully.';
PRINT 'Default credentials: username=admin | password=Admin@123456';
PRINT 'IMPORTANT: Change the password immediately after first login!';
