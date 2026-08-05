SET QUOTED_IDENTIFIER ON;

-- 1. Setup Manager Hierarchy in Employees Table
UPDATE Employees 
SET ReportingManagerId = (SELECT TOP 1 EmployeeId FROM Employees WHERE OfficialEmail = 'enghod@company.com')
WHERE DeptId = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%Eng%')
  AND OfficialEmail <> 'enghod@company.com';

UPDATE Employees 
SET ReportingManagerId = (SELECT TOP 1 EmployeeId FROM Employees WHERE OfficialEmail = 'hradmin@company.com')
WHERE DeptId = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%HR%' OR DeptName LIKE '%Human%')
  AND OfficialEmail <> 'hradmin@company.com';

UPDATE Employees 
SET ReportingManagerId = (SELECT TOP 1 EmployeeId FROM Employees WHERE OfficialEmail = 'financehead@company.com')
WHERE DeptId = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%Fin%')
  AND OfficialEmail <> 'financehead@company.com';

UPDATE Employees 
SET ReportingManagerId = (SELECT TOP 1 EmployeeId FROM Employees WHERE OfficialEmail = 'opshod@company.com')
WHERE DeptId = (SELECT TOP 1 DeptId FROM Departments WHERE DeptName LIKE '%Op%')
  AND OfficialEmail <> 'opshod@company.com';

-- Default fallback reporting manager for remaining employees without a manager
UPDATE Employees
SET ReportingManagerId = (SELECT TOP 1 EmployeeId FROM Employees WHERE OfficialEmail = 'superadmin@company.com')
WHERE ReportingManagerId IS NULL AND OfficialEmail <> 'superadmin@company.com';

-- 2. Clear previous synthetic attendance records for clean seed
DELETE FROM AttendanceRecords WHERE AttendanceDate >= '2026-07-01';

-- 3. Populate 24 days of realistic Attendance Records for all active employees (July 1 - July 24, 2026)
DECLARE @Day INT = 1;
DECLARE @CurrentDate DATE;
DECLARE @ShiftId UNIQUEIDENTIFIER;
SELECT TOP 1 @ShiftId = ShiftId FROM ShiftMasters WHERE IsActive = 1;

WHILE @Day <= 24
BEGIN
    SET @CurrentDate = DATEFROMPARTS(2026, 7, @Day);
    DECLARE @DayOfWeek INT = DATEPART(WEEKDAY, @CurrentDate);

    -- 1 = Sunday, 7 = Saturday in SQL Server standard config (or depending on @@DATEFIRST)
    IF @DayOfWeek IN (1, 7)
    BEGIN
        -- Insert WeeklyOff for weekend days
        INSERT INTO AttendanceRecords (
            AttendanceId, EmployeeId, AttendanceDate, Status, WorkingHours, OvertimeHours,
            Source, IsRegularized, IsFrozen, ShiftId, CreatedAt
        )
        SELECT 
            NEWID(), e.EmployeeId, @CurrentDate, 'WeeklyOff', 0.0, 0.0,
            'SystemGenerated', 0, 0, COALESCE(e.ShiftId, @ShiftId), GETUTCDATE()
        FROM Employees e
        WHERE e.IsActive = 1;
    END
    ELSE
    BEGIN
        -- Weekday: 80% Present (On-time), 10% Late, 5% OnLeave, 5% Absent
        -- Employee 1: Present with 1hr OT
        INSERT INTO AttendanceRecords (
            AttendanceId, EmployeeId, AttendanceDate, CheckIn, CheckOut, WorkingHours, OvertimeHours,
            Status, Source, Remarks, IsRegularized, IsFrozen, ShiftId, CreatedAt
        )
        SELECT 
            NEWID(),
            e.EmployeeId,
            @CurrentDate,
            DATETIMEFROMPARTS(2026, 7, @Day, 8, 55, 0, 0),
            DATETIMEFROMPARTS(2026, 7, @Day, 18, 30, 0, 0),
            8.5,
            1.0,
            CASE 
                WHEN (ABS(CHECKSUM(NEWID())) % 20) = 0 THEN 'Leave'
                WHEN (ABS(CHECKSUM(NEWID())) % 15) = 0 THEN 'LatePresent'
                ELSE 'Present'
            END,
            'Biometric',
            'Card Punch Scan',
            0,
            0,
            COALESCE(e.ShiftId, @ShiftId),
            GETUTCDATE()
        FROM Employees e
        WHERE e.IsActive = 1;

        -- Update CheckIn/CheckOut times for LatePresent status records
        UPDATE AttendanceRecords
        SET CheckIn = DATETIMEFROMPARTS(2026, 7, @Day, 9, 45, 0, 0),
            WorkingHours = 7.25,
            OvertimeHours = 0.0,
            Remarks = 'Grace period exceeded - 45 mins late'
        WHERE AttendanceDate = @CurrentDate AND Status = 'LatePresent';

        -- Nullify punch times for Leave status records
        UPDATE AttendanceRecords
        SET CheckIn = NULL,
            CheckOut = NULL,
            WorkingHours = 0.0,
            OvertimeHours = 0.0,
            Remarks = 'Casual Leave Approved'
        WHERE AttendanceDate = @CurrentDate AND Status = 'Leave';
    END

    SET @Day = @Day + 1;
END;

-- 4. Seed Pending Attendance Regularizations for Team Manager Approval Dashboard
DELETE FROM AttendanceRegularizations WHERE Reason LIKE 'Demo%';

INSERT INTO AttendanceRegularizations (
    RegId, EmployeeId, AttendanceDate, Reason, RequestedCheckIn, RequestedCheckOut, Status, CreatedAt
)
SELECT TOP 3
    NEWID(),
    e.EmployeeId,
    '2026-07-20',
    'Demo: Biometric machine failed during evening punch out. Requesting manual time entry.',
    DATETIMEFROMPARTS(2026, 7, 20, 9, 0, 0, 0),
    DATETIMEFROMPARTS(2026, 7, 20, 18, 0, 0, 0),
    'Pending',
    GETUTCDATE()
FROM Employees e
WHERE e.OfficialEmail IN ('engemp1@company.com', 'engemp2@company.com', 'finemp1@company.com', 'opsemp1@company.com');

-- 5. Seed Candidate database records for Recruitment pipeline view
IF NOT EXISTS (SELECT 1 FROM Candidates WHERE Email = 'rohit.sharma@demo.com')
BEGIN
    INSERT INTO Candidates (
        CandidateId, FirstName, LastName, Email, Phone, CandidateStatus, CurrentCompany, CurrentDesignation, TotalExperience, CreatedAt
    ) VALUES 
    (NEWID(), 'Rohit', 'Sharma', 'rohit.sharma@demo.com', '9876543210', 0, 'TechCorp Ltd', 'Senior Software Engineer', 6, GETUTCDATE()),
    (NEWID(), 'Priya', 'Verma', 'priya.verma@demo.com', '9876543211', 1, 'InnoTech Solutions', 'HR Specialist', 4, GETUTCDATE()),
    (NEWID(), 'Amit', 'Patel', 'amit.patel@demo.com', '9876543212', 2, 'Global Finance Inc', 'Financial Analyst', 5, GETUTCDATE());
END;

GO
