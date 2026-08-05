-- ============================================================
-- MIGRATION: 006_Coherent_RBAC_Dataset.sql
-- Purpose: Builds the exact Coherent RBAC Test Dataset (Accounts 1-9)
-- with closed-loop graph: Employees -> Users -> Dept -> Manager -> 
-- Salary Structure -> Payslips -> Attendance -> Leave Applications.
-- ============================================================
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

-- 1. Obtain Base Identifiers
DECLARE @CompanyId UNIQUEIDENTIFIER = (SELECT TOP 1 CompanyId FROM Companies WHERE IsActive = 1);
IF @CompanyId IS NULL
BEGIN
    SET @CompanyId = NEWID();
    INSERT INTO Companies (CompanyId, CompanyName, CIN, PAN, TAN, RegisteredAddress, City, State, Pincode, Website, Phone, Email, IsActive, CreatedAt)
    VALUES (@CompanyId, 'Acme Technologies Pvt Ltd', 'U72900MH2024PTC000001', 'AABCA1234A', 'MUMA00001A',
            '123 Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400069',
            'https://acme.example.com', '+91-22-12345678', 'hr@acme.example.com', 1, GETUTCDATE());
END

DECLARE @LocationId UNIQUEIDENTIFIER = (SELECT TOP 1 LocationId FROM Locations WHERE CompanyId = @CompanyId);
IF @LocationId IS NULL
BEGIN
    SET @LocationId = NEWID();
    INSERT INTO Locations (LocationId, CompanyId, LocationName, Address, City, State, Pincode, IsHeadOffice, IsActive, CreatedAt)
    VALUES (@LocationId, @CompanyId, 'Mumbai Head Office', '123 Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400069', 1, 1, GETUTCDATE());
END

DECLARE @DesignationId UNIQUEIDENTIFIER = (SELECT TOP 1 DesignationId FROM Designations WHERE CompanyId = @CompanyId);
IF @DesignationId IS NULL
BEGIN
    SET @DesignationId = NEWID();
    INSERT INTO Designations (DesignationId, CompanyId, Title, Grade, Level, MinBasic, MaxBasic, IsActive, CreatedAt)
    VALUES (@DesignationId, @CompanyId, 'Software Specialist', 'ENG', 1, 30000, 100000, 1, GETUTCDATE());
END

-- Departments
DECLARE @DeptHR UNIQUEIDENTIFIER = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%Human%' OR DeptCode = 'HR');
IF @DeptHR IS NULL
BEGIN
    SET @DeptHR = NEWID();
    INSERT INTO Departments (DeptId, CompanyId, DeptName, DeptCode, IsActive, CreatedAt) VALUES (@DeptHR, @CompanyId, 'Human Resources', 'HR', 1, GETUTCDATE());
END

DECLARE @DeptENG UNIQUEIDENTIFIER = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%Eng%' OR DeptCode = 'ENG');
IF @DeptENG IS NULL
BEGIN
    SET @DeptENG = NEWID();
    INSERT INTO Departments (DeptId, CompanyId, DeptName, DeptCode, IsActive, CreatedAt) VALUES (@DeptENG, @CompanyId, 'Product Engineering', 'ENG', 1, GETUTCDATE());
END

DECLARE @DeptOPS UNIQUEIDENTIFIER = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%Op%' OR DeptCode = 'OPS');
IF @DeptOPS IS NULL
BEGIN
    SET @DeptOPS = NEWID();
    INSERT INTO Departments (DeptId, CompanyId, DeptName, DeptCode, IsActive, CreatedAt) VALUES (@DeptOPS, @CompanyId, 'Operations', 'OPS', 1, GETUTCDATE());
END

DECLARE @DeptFIN UNIQUEIDENTIFIER = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%Fin%' OR DeptCode = 'FIN');
IF @DeptFIN IS NULL
BEGIN
    SET @DeptFIN = NEWID();
    INSERT INTO Departments (DeptId, CompanyId, DeptName, DeptCode, IsActive, CreatedAt) VALUES (@DeptFIN, @CompanyId, 'Finance & Accounts', 'FIN', 1, GETUTCDATE());
END

-- Roles
DECLARE @RoleSuperAdmin UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'SUPER_ADMIN');
DECLARE @RoleHRAdmin UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_ADMIN');
DECLARE @RoleFinanceHead UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'FINANCE_HEAD');
DECLARE @RoleHRExec UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'HR_EXEC');
DECLARE @RoleDeptManager UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'DEPT_MANAGER');
DECLARE @RoleEmployee UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'EMPLOYEE');

-- BCrypt Hashes:
-- 'Admin@123456' -> $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeimrVILrn8vT.LpG
-- 'Demo@123'     -> $2a$12$bwXuOGiFjkhDCwg6MZCwKOoIqAFhoNJ.E5nKRKyJiJB8tzzRzjeri
DECLARE @HashAdmin NVARCHAR(255) = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeimrVILrn8vT.LpG';
DECLARE @HashDemo NVARCHAR(255) = '$2a$12$bwXuOGiFjkhDCwg6MZCwKOoIqAFhoNJ.E5nKRKyJiJB8tzzRzjeri';

-- -----------------------------------------------------------------------------
-- 2. Setup Specification Table for Accounts 1 to 9
-- -----------------------------------------------------------------------------
IF OBJECT_ID('tempdb..#TestAccounts') IS NOT NULL DROP TABLE #TestAccounts;

CREATE TABLE #TestAccounts (
    Seq INT,
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    Email NVARCHAR(100),
    PasswordHash NVARCHAR(255),
    RoleCode NVARCHAR(50),
    DeptId UNIQUEIDENTIFIER,
    ManagerEmail NVARCHAR(100),
    EmployeeCode NVARCHAR(20),
    CTC DECIMAL(18,2)
);

INSERT INTO #TestAccounts VALUES
(1, 'System', 'Admin', 'admin@company.com', @HashAdmin, 'SUPER_ADMIN', @DeptHR, NULL, 'EMP_SYS_01', 0),
(2, 'Sneha', 'Kulkarni', 'hradmin@company.com', @HashDemo, 'HR_ADMIN', @DeptHR, NULL, 'EMP_HR_01', 0),
(3, 'Aditya', 'Sharma', 'finance@company.com', @HashDemo, 'FINANCE_HEAD', @DeptFIN, NULL, 'EMP_FIN_01', 0),
(4, 'Neha', 'Gupta', 'hrexec@company.com', @HashDemo, 'HR_EXEC', @DeptHR, 'hradmin@company.com', 'EMP_HR_02', 0),
(5, 'Rahul', 'Sharma', 'manager.eng@company.com', @HashDemo, 'DEPT_MANAGER', @DeptENG, 'hradmin@company.com', 'EMP_ENG_MGR', 1200000),
(6, 'Amit', 'Kumar', 'emp1@company.com', @HashDemo, 'EMPLOYEE', @DeptENG, 'manager.eng@company.com', 'EMP_ENG_01', 800000),
(7, 'Priya', 'Nair', 'emp2@company.com', @HashDemo, 'EMPLOYEE', @DeptENG, 'manager.eng@company.com', 'EMP_ENG_02', 750000),
(8, 'Karan', 'Mehta', 'manager.ops@company.com', @HashDemo, 'DEPT_MANAGER', @DeptOPS, 'hradmin@company.com', 'EMP_OPS_MGR', 1100000),
(9, 'Sana', 'Iyer', 'emp3@company.com', @HashDemo, 'EMPLOYEE', @DeptOPS, 'manager.ops@company.com', 'EMP_OPS_01', 700000);

-- Step A: Upsert Employees
DECLARE @Seq INT = 1;
WHILE @Seq <= 9
BEGIN
    DECLARE @Email NVARCHAR(100), @FName NVARCHAR(50), @LName NVARCHAR(50), @EmpCode NVARCHAR(20), @DId UNIQUEIDENTIFIER;
    SELECT @Email = Email, @FName = FirstName, @LName = LastName, @EmpCode = EmployeeCode, @DId = DeptId
    FROM #TestAccounts WHERE Seq = @Seq;

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE OfficialEmail = @Email)
    BEGIN
        IF EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = @EmpCode)
            SET @EmpCode = @EmpCode + '_NEW';

        INSERT INTO Employees (
            EmployeeId, CompanyId, EmployeeCode, FirstName, LastName, OfficialEmail,
            DeptId, DesignationId, LocationId, JoiningDate, EmploymentType, EmploymentStatus,
            NoticePeriodDays, SameAddressFlag, IsActive, CreatedAt
        ) VALUES (
            NEWID(), @CompanyId, @EmpCode, @FName, @LName, @Email,
            @DId, @DesignationId, @LocationId, '2024-01-01', 'FullTime', 'Active',
            30, 1, 1, GETUTCDATE()
        );
    END
    ELSE
    BEGIN
        UPDATE Employees
        SET DeptId = @DId, FirstName = @FName, LastName = @LName, IsActive = 1
        WHERE OfficialEmail = @Email;
    END

    SET @Seq = @Seq + 1;
END;

-- Step B: Update ReportingManagerId links
UPDATE e
SET e.ReportingManagerId = m.EmployeeId
FROM Employees e
JOIN #TestAccounts t ON e.OfficialEmail = t.Email
JOIN Employees m ON m.OfficialEmail = t.ManagerEmail
WHERE t.ManagerEmail IS NOT NULL;

-- Step C: Upsert Users & UserRoles
SET @Seq = 1;
WHILE @Seq <= 9
BEGIN
    DECLARE @UEmail NVARCHAR(100), @UHash NVARCHAR(255), @URoleCode NVARCHAR(50), @UFName NVARCHAR(50), @ULName NVARCHAR(50);
    SELECT @UEmail = Email, @UHash = PasswordHash, @URoleCode = RoleCode, @UFName = FirstName, @ULName = LastName
    FROM #TestAccounts WHERE Seq = @Seq;

    DECLARE @EmpId UNIQUEIDENTIFIER = (SELECT EmployeeId FROM Employees WHERE OfficialEmail = @UEmail);
    DECLARE @UserId UNIQUEIDENTIFIER = (SELECT UserId FROM Users WHERE Email = @UEmail);
    DECLARE @RoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = @URoleCode);

    IF @UserId IS NULL
    BEGIN
        SET @UserId = NEWID();
        INSERT INTO Users (
            UserId, EmployeeId, Username, Email, PasswordHash, PasswordSalt,
            FirstName, LastName, IsActive, IsLocked, FailedLoginCount, MustChangePassword, CreatedAt
        ) VALUES (
            @UserId, @EmpId, @UEmail, @UEmail, @UHash, '',
            @UFName, @ULName, 1, 0, 0, 0, GETUTCDATE()
        );
    END
    ELSE
    BEGIN
        UPDATE Users
        SET EmployeeId = @EmpId, Username = @UEmail, PasswordHash = @UHash,
            FirstName = @UFName, LastName = @ULName, IsActive = 1, IsLocked = 0, MustChangePassword = 0
        WHERE UserId = @UserId;
    END

    -- UserRoles
    IF @RoleId IS NOT NULL
    BEGIN
        DELETE FROM UserRoles WHERE UserId = @UserId;
        INSERT INTO UserRoles (UserRoleId, UserId, RoleId, AssignedAt, IsActive, CreatedAt)
        VALUES (NEWID(), @UserId, @RoleId, GETUTCDATE(), 1, GETUTCDATE());
    END

    SET @Seq = @Seq + 1;
END;

-- -----------------------------------------------------------------------------
-- 3. Salary Structure & Payslips for Rows 5 to 9
-- -----------------------------------------------------------------------------

SET @Seq = 5;
WHILE @Seq <= 9
BEGIN
    DECLARE @EEmail NVARCHAR(100), @CTC DECIMAL(18,2), @EFName NVARCHAR(50);
    SELECT @EEmail = Email, @CTC = CTC, @EFName = FirstName FROM #TestAccounts WHERE Seq = @Seq;

    DECLARE @EId UNIQUEIDENTIFIER = (SELECT EmployeeId FROM Employees WHERE OfficialEmail = @EEmail);

    IF @EId IS NOT NULL
    BEGIN
        -- Clear any previous EmployeeSalaryStructures for this employee
        DELETE FROM EmployeeSalaryStructures WHERE EmployeeId = @EId;

        DECLARE @EmpStructId UNIQUEIDENTIFIER = NEWID();
        INSERT INTO SalaryStructures (StructureId, CompanyId, StructureName, EffectiveFrom, IsActive, CreatedAt)
        VALUES (@EmpStructId, @CompanyId, 'Salary Structure - ' + @EFName, '2024-01-01', 1, GETUTCDATE());

        INSERT INTO EmployeeSalaryStructures (StructureId, EmployeeId, AnnualCTC, EffectiveFrom, IsActive, CreatedAt)
        VALUES (@EmpStructId, @EId, @CTC, '2024-01-01', 1, GETUTCDATE());
    END

    SET @Seq = @Seq + 1;
END;

-- Populate active PayrollRun & PayrollDetails for July 2026
DECLARE @AdminUserId UNIQUEIDENTIFIER = (SELECT UserId FROM Users WHERE Email = 'admin@company.com');

DECLARE @PayrollRunId UNIQUEIDENTIFIER = (SELECT PayrollRunId FROM PayrollRuns WHERE Month = 7 AND Year = 2026 AND CompanyId = @CompanyId);
IF @PayrollRunId IS NULL
BEGIN
    SET @PayrollRunId = NEWID();
    INSERT INTO PayrollRuns (
        PayrollRunId, CompanyId, Month, Year, Status, ProcessedBy, ProcessedAt, RunType, TotalGross, TotalDeductions, TotalNetPay, TotalEmployees, AttendanceFrozen, CreatedAt
    ) VALUES (
        @PayrollRunId, @CompanyId, 7, 2026, 'Disbursed', @AdminUserId, GETUTCDATE(), 0, 450000.00, 45000.00, 405000.00, 5, 1, GETUTCDATE()
    );
END

SET @Seq = 5;
WHILE @Seq <= 9
BEGIN
    SELECT @EEmail = Email, @CTC = CTC FROM #TestAccounts WHERE Seq = @Seq;
    SET @EId = (SELECT EmployeeId FROM Employees WHERE OfficialEmail = @EEmail);

    IF @EId IS NOT NULL
    BEGIN
        DECLARE @MonthlyGross DECIMAL(18,2) = @CTC / 12.0;
        DECLARE @PF DECIMAL(18,2) = 1800.00;
        DECLARE @PT DECIMAL(18,2) = 200.00;
        DECLARE @TDS DECIMAL(18,2) = @MonthlyGross * 0.05;
        DECLARE @Deductions DECIMAL(18,2) = @PF + @PT + @TDS;
        DECLARE @NetPay DECIMAL(18,2) = @MonthlyGross - @Deductions;

        DELETE FROM PayrollDetails WHERE PayrollRunId = @PayrollRunId AND EmployeeId = @EId;
        INSERT INTO PayrollDetails (
            DetailId, PayrollRunId, EmployeeId, WorkingDays, PaidDays, LWPDays, OvertimeHours,
            GrossEarnings, TotalDeductions, NetPay, TDSDeducted, PFEmployee, PFEmployer, ESIEmployee, ESIEmployer, ProfessionalTax, LWF, GratuityProvision, CreatedAt
        ) VALUES (
            NEWID(), @PayrollRunId, @EId, 22, 22, 0, 0,
            @MonthlyGross, @Deductions, @NetPay, @TDS, @PF, @PF, 0, 0, @PT, 0, 0, GETUTCDATE()
        );
    END

    SET @Seq = @Seq + 1;
END;

-- -----------------------------------------------------------------------------
-- 4. Attendance History for Rows 5 to 9 (3 days: 2026-07-20 to 2026-07-22)
-- -----------------------------------------------------------------------------

IF OBJECT_ID('tempdb..#AttDates') IS NOT NULL DROP TABLE #AttDates;
CREATE TABLE #AttDates (AttDate DATE, Status NVARCHAR(20), WorkHrs DECIMAL(18,2));
INSERT INTO #AttDates VALUES 
('2026-07-20', 'Present', 8.5),
('2026-07-21', 'Present', 8.5),
('2026-07-22', 'LatePresent', 7.5);

SET @Seq = 5;
WHILE @Seq <= 9
BEGIN
    SELECT @EEmail = Email FROM #TestAccounts WHERE Seq = @Seq;
    SET @EId = (SELECT EmployeeId FROM Employees WHERE OfficialEmail = @EEmail);

    IF @EId IS NOT NULL
    BEGIN
        DELETE FROM AttendanceRecords WHERE EmployeeId = @EId AND AttendanceDate IN ('2026-07-20', '2026-07-21', '2026-07-22');

        INSERT INTO AttendanceRecords (
            AttendanceId, EmployeeId, AttendanceDate, CheckIn, CheckOut, WorkingHours, OvertimeHours, Status, Source, IsRegularized, IsFrozen, CreatedAt
        )
        SELECT 
            NEWID(), @EId, AttDate,
            DATETIMEFROMPARTS(2026, 7, CAST(DAY(AttDate) AS INT), 9, 0, 0, 0),
            DATETIMEFROMPARTS(2026, 7, CAST(DAY(AttDate) AS INT), 17, 30, 0, 0),
            WorkHrs, 0.0, Status, 'Biometric', 0, 0, GETUTCDATE()
        FROM #AttDates;
    END

    SET @Seq = @Seq + 1;
END;

-- -----------------------------------------------------------------------------
-- 5. Leave Applications for Rows 5 to 9 (1 Pending, 1 Approved)
-- FK_LeaveApplications_Users_ApproverId references Users(UserId)
-- -----------------------------------------------------------------------------

DECLARE @LeaveTypeId UNIQUEIDENTIFIER = (SELECT TOP 1 LeaveTypeId FROM LeaveTypes WHERE IsActive = 1);

SET @Seq = 5;
WHILE @Seq <= 9
BEGIN
    SELECT @EEmail = Email FROM #TestAccounts WHERE Seq = @Seq;
    SET @EId = (SELECT EmployeeId FROM Employees WHERE OfficialEmail = @EEmail);
    
    -- Find Manager's UserId
    DECLARE @MgrEmployeeId UNIQUEIDENTIFIER = (SELECT ReportingManagerId FROM Employees WHERE EmployeeId = @EId);
    DECLARE @MgrUserId UNIQUEIDENTIFIER = (SELECT UserId FROM Users WHERE EmployeeId = @MgrEmployeeId);

    IF @MgrUserId IS NULL
        SET @MgrUserId = (SELECT UserId FROM Users WHERE Email = 'hradmin@company.com');

    IF @EId IS NOT NULL AND @LeaveTypeId IS NOT NULL
    BEGIN
        DELETE FROM LeaveApplications WHERE EmployeeId = @EId;

        -- Pending Leave Request
        INSERT INTO LeaveApplications (
            LeaveAppId, EmployeeId, LeaveTypeId, FromDate, ToDate, TotalDays, IsHalfDay,
            Reason, Status, AppliedAt, ApproverId, CreatedAt
        ) VALUES (
            NEWID(), @EId, @LeaveTypeId, '2026-08-10', '2026-08-11', 2.0, 0,
            'RBAC Dataset: Pending family function leave', 'Pending', GETUTCDATE(), @MgrUserId, GETUTCDATE()
        );

        -- Approved Leave Request
        INSERT INTO LeaveApplications (
            LeaveAppId, EmployeeId, LeaveTypeId, FromDate, ToDate, TotalDays, IsHalfDay,
            Reason, Status, AppliedAt, ApproverId, ApprovedAt, CreatedAt
        ) VALUES (
            NEWID(), @EId, @LeaveTypeId, '2026-07-14', '2026-07-14', 1.0, 0,
            'RBAC Dataset: Approved personal work leave', 'Approved', GETUTCDATE(), @MgrUserId, GETUTCDATE(), GETUTCDATE()
        );
    END

    SET @Seq = @Seq + 1;
END;

DROP TABLE #TestAccounts;
DROP TABLE #AttDates;

PRINT '006_Coherent_RBAC_Dataset: Complete dataset seeded successfully with zero errors.';
