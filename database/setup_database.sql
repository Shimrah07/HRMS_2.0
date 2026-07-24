-- ============================================================
-- IndiaHRMS Complete Database Setup Script
-- Generated: 2026-07-16 12:33:50
-- This script creates the database 'IndiaHRMS', the schema,
-- and seeds the initial default data (Roles, Permissions, Setup).
-- ============================================================

USE [master];
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'IndiaHRMS')
BEGIN
    CREATE DATABASE [IndiaHRMS];
    PRINT 'Database IndiaHRMS created successfully.';
END
ELSE
BEGIN
    PRINT 'Database IndiaHRMS already exists.';
END
GO

USE [IndiaHRMS];
GO
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Candidates] (
    [CandidateId] uniqueidentifier NOT NULL,
    [FirstName] nvarchar(max) NOT NULL,
    [LastName] nvarchar(max) NULL,
    [Email] nvarchar(max) NOT NULL,
    [Phone] nvarchar(max) NULL,
    [CurrentDesignation] nvarchar(max) NULL,
    [CurrentCompany] nvarchar(max) NULL,
    [TotalExperience] int NULL,
    [CurrentCTC] decimal(18,2) NULL,
    [ExpectedCTC] decimal(18,2) NULL,
    [NoticePeriodDays] int NULL,
    [ResumeFilePath] nvarchar(max) NULL,
    [Source] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Candidates] PRIMARY KEY ([CandidateId])
);
GO

CREATE TABLE [Companies] (
    [CompanyId] uniqueidentifier NOT NULL,
    [CompanyName] nvarchar(200) NOT NULL,
    [CIN] nvarchar(max) NULL,
    [PAN] nvarchar(max) NULL,
    [TAN] nvarchar(max) NULL,
    [GSTIN] nvarchar(max) NULL,
    [RegisteredAddress] nvarchar(max) NULL,
    [City] nvarchar(max) NULL,
    [State] nvarchar(max) NULL,
    [Pincode] nvarchar(max) NULL,
    [Logo] nvarchar(max) NULL,
    [Website] nvarchar(max) NULL,
    [Phone] nvarchar(max) NULL,
    [Email] nvarchar(max) NULL,
    [IncorporationDate] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Companies] PRIMARY KEY ([CompanyId])
);
GO

CREATE TABLE [Permissions] (
    [PermissionId] uniqueidentifier NOT NULL,
    [PermissionCode] nvarchar(100) NOT NULL,
    [PermissionName] nvarchar(max) NOT NULL,
    [Module] nvarchar(50) NOT NULL,
    [Action] nvarchar(50) NOT NULL,
    [Description] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Permissions] PRIMARY KEY ([PermissionId])
);
GO

CREATE TABLE [Roles] (
    [RoleId] uniqueidentifier NOT NULL,
    [RoleName] nvarchar(100) NOT NULL,
    [RoleCode] nvarchar(50) NOT NULL,
    [Description] nvarchar(max) NULL,
    [IsSystem] bit NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([RoleId])
);
GO

CREATE TABLE [AppraisalCycles] (
    [CycleId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [CycleName] nvarchar(max) NOT NULL,
    [CycleType] nvarchar(20) NOT NULL,
    [StartDate] date NOT NULL,
    [EndDate] date NOT NULL,
    [GoalSettingDeadline] date NULL,
    [MidYearDeadline] date NULL,
    [FinalReviewDeadline] date NULL,
    [Status] nvarchar(30) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_AppraisalCycles] PRIMARY KEY ([CycleId]),
    CONSTRAINT [FK_AppraisalCycles_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [Designations] (
    [DesignationId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [Title] nvarchar(100) NOT NULL,
    [Grade] nvarchar(max) NULL,
    [Level] int NULL,
    [MinBasic] decimal(12,2) NOT NULL,
    [MaxBasic] decimal(12,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Designations] PRIMARY KEY ([DesignationId]),
    CONSTRAINT [FK_Designations_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [EmailTemplates] (
    [TemplateId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [TemplateName] nvarchar(max) NOT NULL,
    [TemplateCode] nvarchar(max) NOT NULL,
    [Subject] nvarchar(max) NOT NULL,
    [Body] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmailTemplates] PRIMARY KEY ([TemplateId]),
    CONSTRAINT [FK_EmailTemplates_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [LeaveTypes] (
    [LeaveTypeId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [LeaveTypeName] nvarchar(max) NOT NULL,
    [LeaveCode] nvarchar(max) NOT NULL,
    [MaxDaysPerYear] int NOT NULL,
    [MaxDaysPerApplication] int NOT NULL,
    [IsCarryForward] bit NOT NULL,
    [MaxCarryForwardDays] int NOT NULL,
    [IsEncashable] bit NOT NULL,
    [IsPaidLeave] bit NOT NULL,
    [ApplicableGender] nvarchar(max) NOT NULL,
    [MinServiceDaysRequired] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_LeaveTypes] PRIMARY KEY ([LeaveTypeId]),
    CONSTRAINT [FK_LeaveTypes_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [Locations] (
    [LocationId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [LocationName] nvarchar(100) NOT NULL,
    [Address] nvarchar(max) NULL,
    [City] nvarchar(max) NULL,
    [State] nvarchar(max) NULL,
    [Pincode] nvarchar(max) NULL,
    [IsHeadOffice] bit NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Locations] PRIMARY KEY ([LocationId]),
    CONSTRAINT [FK_Locations_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [SalaryComponents] (
    [ComponentId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [ComponentName] nvarchar(max) NOT NULL,
    [ComponentCode] nvarchar(max) NOT NULL,
    [ComponentType] int NOT NULL,
    [CalculationType] int NOT NULL,
    [IsStatutory] bit NOT NULL,
    [IsTaxable] bit NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_SalaryComponents] PRIMARY KEY ([ComponentId]),
    CONSTRAINT [FK_SalaryComponents_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [SalaryStructures] (
    [StructureId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [StructureName] nvarchar(max) NOT NULL,
    [EffectiveFrom] date NOT NULL,
    [EffectiveTo] date NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_SalaryStructures] PRIMARY KEY ([StructureId]),
    CONSTRAINT [FK_SalaryStructures_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [ShiftMasters] (
    [ShiftId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [ShiftName] nvarchar(max) NOT NULL,
    [ShiftCode] nvarchar(max) NOT NULL,
    [StartTime] time NOT NULL,
    [EndTime] time NOT NULL,
    [GracePeriodMins] int NOT NULL,
    [IsNightShift] bit NOT NULL,
    [WeeklyOffDays] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_ShiftMasters] PRIMARY KEY ([ShiftId]),
    CONSTRAINT [FK_ShiftMasters_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [SystemSettings] (
    [SettingId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [SettingKey] nvarchar(100) NOT NULL,
    [SettingValue] nvarchar(max) NOT NULL,
    [DataType] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([SettingId]),
    CONSTRAINT [FK_SystemSettings_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [TrainingPrograms] (
    [ProgramId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [ProgramName] nvarchar(max) NOT NULL,
    [Category] nvarchar(max) NULL,
    [Mode] int NOT NULL,
    [Vendor] nvarchar(max) NULL,
    [CostPerPerson] decimal(18,2) NOT NULL,
    [DurationHours] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_TrainingPrograms] PRIMARY KEY ([ProgramId]),
    CONSTRAINT [FK_TrainingPrograms_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [RolePermissions] (
    [RolePermissionId] uniqueidentifier NOT NULL,
    [RoleId] uniqueidentifier NOT NULL,
    [PermissionId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([RolePermissionId]),
    CONSTRAINT [FK_RolePermissions_Permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions] ([PermissionId]) ON DELETE CASCADE,
    CONSTRAINT [FK_RolePermissions_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([RoleId]) ON DELETE CASCADE
);
GO

CREATE TABLE [HolidayCalendars] (
    [HolidayId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [LocationId] uniqueidentifier NULL,
    [HolidayDate] date NOT NULL,
    [HolidayName] nvarchar(max) NOT NULL,
    [HolidayType] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_HolidayCalendars] PRIMARY KEY ([HolidayId]),
    CONSTRAINT [FK_HolidayCalendars_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE,
    CONSTRAINT [FK_HolidayCalendars_Locations_LocationId] FOREIGN KEY ([LocationId]) REFERENCES [Locations] ([LocationId])
);
GO

CREATE TABLE [StructureComponents] (
    [Id] uniqueidentifier NOT NULL,
    [StructureId] uniqueidentifier NOT NULL,
    [ComponentId] uniqueidentifier NOT NULL,
    [PercentageOfComponentId] uniqueidentifier NULL,
    [FixedValue] decimal(18,2) NOT NULL,
    [Formula] nvarchar(max) NULL,
    [Sequence] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_StructureComponents] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_StructureComponents_SalaryComponents_ComponentId] FOREIGN KEY ([ComponentId]) REFERENCES [SalaryComponents] ([ComponentId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_StructureComponents_SalaryComponents_PercentageOfComponentId] FOREIGN KEY ([PercentageOfComponentId]) REFERENCES [SalaryComponents] ([ComponentId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_StructureComponents_SalaryStructures_StructureId] FOREIGN KEY ([StructureId]) REFERENCES [SalaryStructures] ([StructureId]) ON DELETE CASCADE
);
GO

CREATE TABLE [AttendanceRecords] (
    [AttendanceId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [AttendanceDate] date NOT NULL,
    [CheckIn] datetime2 NULL,
    [CheckOut] datetime2 NULL,
    [WorkingHours] decimal(5,2) NOT NULL,
    [OvertimeHours] decimal(5,2) NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [Source] nvarchar(30) NOT NULL,
    [Latitude] decimal(9,6) NULL,
    [Longitude] decimal(9,6) NULL,
    [Remarks] nvarchar(max) NULL,
    [IsRegularized] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_AttendanceRecords] PRIMARY KEY ([AttendanceId])
);
GO

CREATE TABLE [AttendanceRegularizations] (
    [RegId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [AttendanceDate] date NOT NULL,
    [Reason] nvarchar(max) NOT NULL,
    [RequestedCheckIn] datetime2 NULL,
    [RequestedCheckOut] datetime2 NULL,
    [Status] nvarchar(max) NOT NULL,
    [ApprovedBy] uniqueidentifier NULL,
    [ApprovedAt] datetime2 NULL,
    [RejectionReason] nvarchar(max) NULL,
    [ApprovedByUserUserId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_AttendanceRegularizations] PRIMARY KEY ([RegId])
);
GO

CREATE TABLE [AuditLogs] (
    [AuditLogId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NULL,
    [Action] nvarchar(max) NOT NULL,
    [TableName] nvarchar(450) NOT NULL,
    [RecordId] nvarchar(450) NOT NULL,
    [OldValues] nvarchar(max) NULL,
    [NewValues] nvarchar(max) NULL,
    [IPAddress] nvarchar(max) NULL,
    [UserAgent] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([AuditLogId])
);
GO

CREATE TABLE [CostCenters] (
    [CostCenterId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [CostCenterName] nvarchar(100) NOT NULL,
    [CostCenterCode] nvarchar(20) NOT NULL,
    [ManagerEmployeeId] uniqueidentifier NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_CostCenters] PRIMARY KEY ([CostCenterId]),
    CONSTRAINT [FK_CostCenters_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Departments] (
    [DeptId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [DeptName] nvarchar(100) NOT NULL,
    [DeptCode] nvarchar(20) NOT NULL,
    [ParentDeptId] uniqueidentifier NULL,
    [HODEmployeeId] uniqueidentifier NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Departments] PRIMARY KEY ([DeptId]),
    CONSTRAINT [FK_Departments_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Departments_Departments_ParentDeptId] FOREIGN KEY ([ParentDeptId]) REFERENCES [Departments] ([DeptId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Employees] (
    [EmployeeId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [EmployeeCode] nvarchar(20) NOT NULL,
    [FirstName] nvarchar(100) NOT NULL,
    [MiddleName] nvarchar(max) NULL,
    [LastName] nvarchar(100) NOT NULL,
    [DateOfBirth] date NULL,
    [Gender] nvarchar(30) NULL,
    [BloodGroup] nvarchar(10) NULL,
    [MaritalStatus] nvarchar(20) NULL,
    [PersonalEmail] nvarchar(max) NULL,
    [OfficialEmail] nvarchar(max) NULL,
    [PersonalPhone] nvarchar(max) NULL,
    [EmergencyContactName] nvarchar(max) NULL,
    [EmergencyContactPhone] nvarchar(max) NULL,
    [EmergencyContactRelation] nvarchar(max) NULL,
    [PermanentAddress] nvarchar(max) NULL,
    [PermanentCity] nvarchar(max) NULL,
    [PermanentState] nvarchar(max) NULL,
    [PermanentPincode] nvarchar(max) NULL,
    [CurrentAddress] nvarchar(max) NULL,
    [CurrentCity] nvarchar(max) NULL,
    [CurrentState] nvarchar(max) NULL,
    [CurrentPincode] nvarchar(max) NULL,
    [Nationality] nvarchar(max) NULL,
    [Religion] nvarchar(max) NULL,
    [AadharNumber] nvarchar(500) NULL,
    [PANNumber] nvarchar(500) NULL,
    [UANNumber] nvarchar(max) NULL,
    [ESINumber] nvarchar(max) NULL,
    [PassportNumber] nvarchar(max) NULL,
    [PassportExpiry] date NULL,
    [JoiningDate] date NOT NULL,
    [ConfirmationDate] date NULL,
    [ProbationEndDate] date NULL,
    [DeptId] uniqueidentifier NOT NULL,
    [DesignationId] uniqueidentifier NOT NULL,
    [LocationId] uniqueidentifier NOT NULL,
    [CostCenterId] uniqueidentifier NULL,
    [ReportingManagerId] uniqueidentifier NULL,
    [EmploymentType] nvarchar(50) NOT NULL,
    [EmploymentStatus] nvarchar(50) NOT NULL,
    [ProfilePhoto] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Employees] PRIMARY KEY ([EmployeeId]),
    CONSTRAINT [FK_Employees_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_CostCenters_CostCenterId] FOREIGN KEY ([CostCenterId]) REFERENCES [CostCenters] ([CostCenterId]) ON DELETE SET NULL,
    CONSTRAINT [FK_Employees_Departments_DeptId] FOREIGN KEY ([DeptId]) REFERENCES [Departments] ([DeptId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_Designations_DesignationId] FOREIGN KEY ([DesignationId]) REFERENCES [Designations] ([DesignationId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_Employees_ReportingManagerId] FOREIGN KEY ([ReportingManagerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Employees_Locations_LocationId] FOREIGN KEY ([LocationId]) REFERENCES [Locations] ([LocationId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [EmployeeBankDetails] (
    [BankDetailId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [BankName] nvarchar(max) NOT NULL,
    [AccountNumber] nvarchar(500) NOT NULL,
    [IFSCCode] nvarchar(max) NOT NULL,
    [AccountType] nvarchar(20) NOT NULL,
    [IsPrimary] bit NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmployeeBankDetails] PRIMARY KEY ([BankDetailId]),
    CONSTRAINT [FK_EmployeeBankDetails_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE
);
GO

CREATE TABLE [EmployeeEducations] (
    [EduId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [Degree] nvarchar(max) NOT NULL,
    [Institution] nvarchar(max) NOT NULL,
    [University] nvarchar(max) NULL,
    [PassingYear] int NULL,
    [Percentage] decimal(18,2) NULL,
    [IsHighest] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmployeeEducations] PRIMARY KEY ([EduId]),
    CONSTRAINT [FK_EmployeeEducations_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE
);
GO

CREATE TABLE [EmployeeExperiences] (
    [ExpId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [CompanyName] nvarchar(max) NOT NULL,
    [Designation] nvarchar(max) NULL,
    [FromDate] date NOT NULL,
    [ToDate] date NULL,
    [ReasonForLeaving] nvarchar(max) NULL,
    [IsVerified] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmployeeExperiences] PRIMARY KEY ([ExpId]),
    CONSTRAINT [FK_EmployeeExperiences_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE
);
GO

CREATE TABLE [EmployeeGoals] (
    [GoalId] uniqueidentifier NOT NULL,
    [CycleId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [GoalTitle] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [KPI] nvarchar(max) NULL,
    [TargetValue] nvarchar(max) NULL,
    [ActualValue] nvarchar(max) NULL,
    [Weightage] decimal(5,2) NOT NULL,
    [SelfRating] decimal(3,1) NULL,
    [ManagerRating] decimal(3,1) NULL,
    [Status] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmployeeGoals] PRIMARY KEY ([GoalId]),
    CONSTRAINT [FK_EmployeeGoals_AppraisalCycles_CycleId] FOREIGN KEY ([CycleId]) REFERENCES [AppraisalCycles] ([CycleId]) ON DELETE CASCADE,
    CONSTRAINT [FK_EmployeeGoals_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE
);
GO

CREATE TABLE [EmployeeShifts] (
    [EmpShiftId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [ShiftId] uniqueidentifier NOT NULL,
    [EffectiveFrom] date NOT NULL,
    [EffectiveTo] date NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmployeeShifts] PRIMARY KEY ([EmpShiftId]),
    CONSTRAINT [FK_EmployeeShifts_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_EmployeeShifts_ShiftMasters_ShiftId] FOREIGN KEY ([ShiftId]) REFERENCES [ShiftMasters] ([ShiftId]) ON DELETE CASCADE
);
GO

CREATE TABLE [LeaveBalances] (
    [BalanceId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [LeaveTypeId] uniqueidentifier NOT NULL,
    [Year] int NOT NULL,
    [OpeningBalance] decimal(6,2) NOT NULL,
    [Accrued] decimal(6,2) NOT NULL,
    [Taken] decimal(6,2) NOT NULL,
    [Encashed] decimal(6,2) NOT NULL,
    [Lapsed] decimal(6,2) NOT NULL,
    [ClosingBalance] decimal(6,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_LeaveBalances] PRIMARY KEY ([BalanceId]),
    CONSTRAINT [FK_LeaveBalances_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_LeaveBalances_LeaveTypes_LeaveTypeId] FOREIGN KEY ([LeaveTypeId]) REFERENCES [LeaveTypes] ([LeaveTypeId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [PerformanceReviews] (
    [ReviewId] uniqueidentifier NOT NULL,
    [CycleId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [ReviewerId] uniqueidentifier NOT NULL,
    [ReviewType] nvarchar(20) NOT NULL,
    [OverallRating] decimal(3,1) NULL,
    [Strengths] nvarchar(max) NULL,
    [AreasForImprovement] nvarchar(max) NULL,
    [TrainingRecommendations] nvarchar(max) NULL,
    [IncrementRecommended] decimal(5,2) NULL,
    [PromotionRecommended] bit NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [SubmittedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_PerformanceReviews] PRIMARY KEY ([ReviewId]),
    CONSTRAINT [FK_PerformanceReviews_AppraisalCycles_CycleId] FOREIGN KEY ([CycleId]) REFERENCES [AppraisalCycles] ([CycleId]) ON DELETE CASCADE,
    CONSTRAINT [FK_PerformanceReviews_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_PerformanceReviews_Employees_ReviewerId] FOREIGN KEY ([ReviewerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [PFNominees] (
    [NomineeId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [NomineeName] nvarchar(max) NOT NULL,
    [Relationship] int NOT NULL,
    [DateOfBirth] date NULL,
    [Percentage] decimal(18,2) NOT NULL,
    [AadharNumber] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_PFNominees] PRIMARY KEY ([NomineeId]),
    CONSTRAINT [FK_PFNominees_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE
);
GO

CREATE TABLE [TrainingSchedules] (
    [ScheduleId] uniqueidentifier NOT NULL,
    [ProgramId] uniqueidentifier NOT NULL,
    [StartDate] date NOT NULL,
    [EndDate] date NOT NULL,
    [Venue] nvarchar(max) NULL,
    [MaxParticipants] int NOT NULL,
    [TrainerId] uniqueidentifier NULL,
    [Status] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_TrainingSchedules] PRIMARY KEY ([ScheduleId]),
    CONSTRAINT [FK_TrainingSchedules_Employees_TrainerId] FOREIGN KEY ([TrainerId]) REFERENCES [Employees] ([EmployeeId]),
    CONSTRAINT [FK_TrainingSchedules_TrainingPrograms_ProgramId] FOREIGN KEY ([ProgramId]) REFERENCES [TrainingPrograms] ([ProgramId]) ON DELETE CASCADE
);
GO

CREATE TABLE [Users] (
    [UserId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NULL,
    [Username] nvarchar(100) NOT NULL,
    [PasswordHash] nvarchar(500) NOT NULL,
    [PasswordSalt] nvarchar(500) NOT NULL,
    [Email] nvarchar(200) NOT NULL,
    [FirstName] nvarchar(max) NULL,
    [LastName] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [IsLocked] bit NOT NULL,
    [FailedLoginCount] int NOT NULL,
    [LockedUntil] datetime2 NULL,
    [LastLoginAt] datetime2 NULL,
    [RefreshToken] nvarchar(max) NULL,
    [RefreshTokenExpiry] datetime2 NULL,
    [MustChangePassword] bit NOT NULL,
    [PasswordResetToken] nvarchar(max) NULL,
    [PasswordResetTokenExpiry] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_Users_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE SET NULL
);
GO

CREATE TABLE [EmployeeDocuments] (
    [DocId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [DocType] nvarchar(50) NOT NULL,
    [DocName] nvarchar(max) NOT NULL,
    [FilePath] nvarchar(max) NOT NULL,
    [FileSize] bigint NOT NULL,
    [UploadedAt] datetime2 NOT NULL,
    [VerifiedBy] uniqueidentifier NULL,
    [VerifiedAt] datetime2 NULL,
    [IsVerified] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmployeeDocuments] PRIMARY KEY ([DocId]),
    CONSTRAINT [FK_EmployeeDocuments_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_EmployeeDocuments_Users_VerifiedBy] FOREIGN KEY ([VerifiedBy]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL
);
GO

CREATE TABLE [EmployeeSalaries] (
    [EmpSalaryId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [StructureId] uniqueidentifier NOT NULL,
    [GrossCTC] decimal(12,2) NOT NULL,
    [BasicSalary] decimal(12,2) NOT NULL,
    [EffectiveFrom] date NOT NULL,
    [EffectiveTo] date NULL,
    [IsActive] bit NOT NULL,
    [RevisedBy] uniqueidentifier NULL,
    [RevisionReason] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_EmployeeSalaries] PRIMARY KEY ([EmpSalaryId]),
    CONSTRAINT [FK_EmployeeSalaries_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_EmployeeSalaries_SalaryStructures_StructureId] FOREIGN KEY ([StructureId]) REFERENCES [SalaryStructures] ([StructureId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_EmployeeSalaries_Users_RevisedBy] FOREIGN KEY ([RevisedBy]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL
);
GO

CREATE TABLE [JobRequisitions] (
    [ReqId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [DeptId] uniqueidentifier NOT NULL,
    [DesignationId] uniqueidentifier NOT NULL,
    [NoOfPositions] int NOT NULL,
    [JobTitle] nvarchar(max) NOT NULL,
    [JobDescription] nvarchar(max) NULL,
    [MinExperience] int NULL,
    [MaxExperience] int NULL,
    [MinSalary] decimal(18,2) NULL,
    [MaxSalary] decimal(18,2) NULL,
    [SkillsRequired] nvarchar(max) NULL,
    [RequisitionDate] date NOT NULL,
    [TargetDate] date NULL,
    [Status] nvarchar(30) NOT NULL,
    [RaisedBy] uniqueidentifier NOT NULL,
    [ApprovedBy] uniqueidentifier NULL,
    [DepartmentDeptId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobRequisitions] PRIMARY KEY ([ReqId]),
    CONSTRAINT [FK_JobRequisitions_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE CASCADE,
    CONSTRAINT [FK_JobRequisitions_Departments_DepartmentDeptId] FOREIGN KEY ([DepartmentDeptId]) REFERENCES [Departments] ([DeptId]) ON DELETE CASCADE,
    CONSTRAINT [FK_JobRequisitions_Designations_DesignationId] FOREIGN KEY ([DesignationId]) REFERENCES [Designations] ([DesignationId]) ON DELETE CASCADE,
    CONSTRAINT [FK_JobRequisitions_Users_ApprovedBy] FOREIGN KEY ([ApprovedBy]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL,
    CONSTRAINT [FK_JobRequisitions_Users_RaisedBy] FOREIGN KEY ([RaisedBy]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [LeaveApplications] (
    [LeaveAppId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [LeaveTypeId] uniqueidentifier NOT NULL,
    [FromDate] date NOT NULL,
    [ToDate] date NOT NULL,
    [TotalDays] decimal(5,2) NOT NULL,
    [IsHalfDay] bit NOT NULL,
    [Reason] nvarchar(max) NULL,
    [Status] nvarchar(20) NOT NULL,
    [AppliedAt] datetime2 NOT NULL,
    [ApproverId] uniqueidentifier NULL,
    [ApprovedAt] datetime2 NULL,
    [RejectionReason] nvarchar(max) NULL,
    [CancelledAt] datetime2 NULL,
    [AttachmentPath] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_LeaveApplications] PRIMARY KEY ([LeaveAppId]),
    CONSTRAINT [FK_LeaveApplications_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_LeaveApplications_LeaveTypes_LeaveTypeId] FOREIGN KEY ([LeaveTypeId]) REFERENCES [LeaveTypes] ([LeaveTypeId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_LeaveApplications_Users_ApproverId] FOREIGN KEY ([ApproverId]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL
);
GO

CREATE TABLE [Notifications] (
    [NotificationId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [Type] nvarchar(50) NOT NULL,
    [ReferenceId] nvarchar(max) NULL,
    [ReferenceType] nvarchar(max) NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([NotificationId]),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
);
GO

CREATE TABLE [PayrollRuns] (
    [PayrollRunId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [Month] int NOT NULL,
    [Year] int NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [ProcessedBy] uniqueidentifier NOT NULL,
    [ProcessedAt] datetime2 NULL,
    [ApprovedBy] uniqueidentifier NULL,
    [ApprovedAt] datetime2 NULL,
    [DisbursedAt] datetime2 NULL,
    [TotalGross] decimal(14,2) NOT NULL,
    [TotalDeductions] decimal(14,2) NOT NULL,
    [TotalNetPay] decimal(14,2) NOT NULL,
    [TotalEmployees] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_PayrollRuns] PRIMARY KEY ([PayrollRunId]),
    CONSTRAINT [FK_PayrollRuns_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PayrollRuns_Users_ApprovedBy] FOREIGN KEY ([ApprovedBy]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL,
    CONSTRAINT [FK_PayrollRuns_Users_ProcessedBy] FOREIGN KEY ([ProcessedBy]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [PIPs] (
    [PIPId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [StartDate] date NOT NULL,
    [EndDate] date NOT NULL,
    [Reason] nvarchar(max) NOT NULL,
    [ImprovementAreas] nvarchar(max) NULL,
    [Milestones] nvarchar(max) NULL,
    [Status] int NOT NULL,
    [InitiatedBy] uniqueidentifier NOT NULL,
    [ClosedAt] datetime2 NULL,
    [ClosureRemark] nvarchar(max) NULL,
    [InitiatedByUserUserId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_PIPs] PRIMARY KEY ([PIPId]),
    CONSTRAINT [FK_PIPs_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_PIPs_Users_InitiatedByUserUserId] FOREIGN KEY ([InitiatedByUserUserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
);
GO

CREATE TABLE [Separations] (
    [SeparationId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [SeparationType] nvarchar(30) NOT NULL,
    [ResignationDate] datetime2 NULL,
    [LastWorkingDate] date NULL,
    [NoticePeriodDays] int NOT NULL,
    [NoticePeriodWaived] bit NOT NULL,
    [BuyoutAmount] decimal(10,2) NOT NULL,
    [ExitInterviewDone] bit NOT NULL,
    [ExitFeedback] nvarchar(max) NULL,
    [Status] nvarchar(max) NOT NULL,
    [InitiatedBy] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Separations] PRIMARY KEY ([SeparationId]),
    CONSTRAINT [FK_Separations_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_Separations_Users_InitiatedBy] FOREIGN KEY ([InitiatedBy]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [TaxDeclarations] (
    [DeclarationId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [FinancialYear] nvarchar(max) NOT NULL,
    [TaxRegime] int NOT NULL,
    [HRA_Claimed] decimal(18,2) NOT NULL,
    [Section80C] decimal(18,2) NOT NULL,
    [Section80D] decimal(18,2) NOT NULL,
    [HouseLoanInterest] decimal(18,2) NOT NULL,
    [OtherDeductions] decimal(18,2) NOT NULL,
    [SubmittedAt] datetime2 NOT NULL,
    [IsApproved] bit NOT NULL,
    [ApprovedBy] uniqueidentifier NULL,
    [ApprovedByUserUserId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_TaxDeclarations] PRIMARY KEY ([DeclarationId]),
    CONSTRAINT [FK_TaxDeclarations_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_TaxDeclarations_Users_ApprovedByUserUserId] FOREIGN KEY ([ApprovedByUserUserId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [TrainingNominations] (
    [NomId] uniqueidentifier NOT NULL,
    [ScheduleId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [NominatedBy] uniqueidentifier NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [Feedback] nvarchar(max) NULL,
    [Rating] decimal(3,1) NULL,
    [CompletionDate] datetime2 NULL,
    [CertificatePath] nvarchar(max) NULL,
    [ExpiryDate] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_TrainingNominations] PRIMARY KEY ([NomId]),
    CONSTRAINT [FK_TrainingNominations_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_TrainingNominations_TrainingSchedules_ScheduleId] FOREIGN KEY ([ScheduleId]) REFERENCES [TrainingSchedules] ([ScheduleId]) ON DELETE CASCADE,
    CONSTRAINT [FK_TrainingNominations_Users_NominatedBy] FOREIGN KEY ([NominatedBy]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [UserRoles] (
    [UserRoleId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [RoleId] uniqueidentifier NOT NULL,
    [AssignedAt] datetime2 NOT NULL,
    [AssignedBy] uniqueidentifier NULL,
    [ValidFrom] datetime2 NULL,
    [ValidTo] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserRoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([RoleId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
);
GO

CREATE TABLE [JobApplications] (
    [AppId] uniqueidentifier NOT NULL,
    [ReqId] uniqueidentifier NOT NULL,
    [CandidateId] uniqueidentifier NOT NULL,
    [ApplicationDate] datetime2 NOT NULL,
    [CurrentStage] nvarchar(30) NOT NULL,
    [RejectionReason] nvarchar(max) NULL,
    [RequisitionReqId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobApplications] PRIMARY KEY ([AppId]),
    CONSTRAINT [FK_JobApplications_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([CandidateId]) ON DELETE CASCADE,
    CONSTRAINT [FK_JobApplications_JobRequisitions_RequisitionReqId] FOREIGN KEY ([RequisitionReqId]) REFERENCES [JobRequisitions] ([ReqId]) ON DELETE CASCADE
);
GO

CREATE TABLE [PayrollDetails] (
    [DetailId] uniqueidentifier NOT NULL,
    [PayrollRunId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [WorkingDays] int NOT NULL,
    [PaidDays] decimal(5,2) NOT NULL,
    [LWPDays] decimal(5,2) NOT NULL,
    [OvertimeHours] decimal(18,2) NOT NULL,
    [GrossEarnings] decimal(12,2) NOT NULL,
    [TotalDeductions] decimal(12,2) NOT NULL,
    [NetPay] decimal(12,2) NOT NULL,
    [TDSDeducted] decimal(10,2) NOT NULL,
    [PFEmployee] decimal(10,2) NOT NULL,
    [PFEmployer] decimal(10,2) NOT NULL,
    [ESIEmployee] decimal(10,2) NOT NULL,
    [ESIEmployer] decimal(10,2) NOT NULL,
    [ProfessionalTax] decimal(18,2) NOT NULL,
    [LWF] decimal(18,2) NOT NULL,
    [GratuityProvision] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_PayrollDetails] PRIMARY KEY ([DetailId]),
    CONSTRAINT [FK_PayrollDetails_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PayrollDetails_PayrollRuns_PayrollRunId] FOREIGN KEY ([PayrollRunId]) REFERENCES [PayrollRuns] ([PayrollRunId]) ON DELETE CASCADE
);
GO

CREATE TABLE [FnFSettlements] (
    [FnFId] uniqueidentifier NOT NULL,
    [SeparationId] uniqueidentifier NOT NULL,
    [PendingSalary] decimal(18,2) NOT NULL,
    [LeaveEncashment] decimal(18,2) NOT NULL,
    [GratuityAmount] decimal(18,2) NOT NULL,
    [BonusPayable] decimal(18,2) NOT NULL,
    [NoticePeriodDeduction] decimal(18,2) NOT NULL,
    [OtherDeductions] decimal(18,2) NOT NULL,
    [GrossPayable] decimal(12,2) NOT NULL,
    [NetPayable] decimal(12,2) NOT NULL,
    [CalculatedAt] datetime2 NOT NULL,
    [ApprovedBy] uniqueidentifier NULL,
    [PaidAt] datetime2 NULL,
    [ApprovedByUserUserId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_FnFSettlements] PRIMARY KEY ([FnFId]),
    CONSTRAINT [FK_FnFSettlements_Separations_SeparationId] FOREIGN KEY ([SeparationId]) REFERENCES [Separations] ([SeparationId]) ON DELETE CASCADE,
    CONSTRAINT [FK_FnFSettlements_Users_ApprovedByUserUserId] FOREIGN KEY ([ApprovedByUserUserId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [NoDuesItems] (
    [NoDuesId] uniqueidentifier NOT NULL,
    [SeparationId] uniqueidentifier NOT NULL,
    [DepartmentName] nvarchar(max) NOT NULL,
    [ClearanceStatus] int NOT NULL,
    [ClearedBy] uniqueidentifier NULL,
    [ClearedAt] datetime2 NULL,
    [Remarks] nvarchar(max) NULL,
    [ClearedByUserUserId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_NoDuesItems] PRIMARY KEY ([NoDuesId]),
    CONSTRAINT [FK_NoDuesItems_Separations_SeparationId] FOREIGN KEY ([SeparationId]) REFERENCES [Separations] ([SeparationId]) ON DELETE CASCADE,
    CONSTRAINT [FK_NoDuesItems_Users_ClearedByUserUserId] FOREIGN KEY ([ClearedByUserUserId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [InterviewRounds] (
    [RoundId] uniqueidentifier NOT NULL,
    [AppId] uniqueidentifier NOT NULL,
    [RoundName] nvarchar(max) NOT NULL,
    [RoundType] nvarchar(max) NULL,
    [ScheduledAt] datetime2 NOT NULL,
    [InterviewerId] uniqueidentifier NOT NULL,
    [Venue] nvarchar(max) NULL,
    [MeetingLink] nvarchar(max) NULL,
    [Status] nvarchar(max) NOT NULL,
    [Rating] decimal(3,1) NULL,
    [Feedback] nvarchar(max) NULL,
    [CompletedAt] datetime2 NULL,
    [JobApplicationAppId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_InterviewRounds] PRIMARY KEY ([RoundId]),
    CONSTRAINT [FK_InterviewRounds_Employees_InterviewerId] FOREIGN KEY ([InterviewerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_InterviewRounds_JobApplications_JobApplicationAppId] FOREIGN KEY ([JobApplicationAppId]) REFERENCES [JobApplications] ([AppId]) ON DELETE CASCADE
);
GO

CREATE TABLE [OfferLetters] (
    [OfferId] uniqueidentifier NOT NULL,
    [AppId] uniqueidentifier NOT NULL,
    [OfferedCTC] decimal(12,2) NOT NULL,
    [JoiningDate] date NOT NULL,
    [OfferDate] datetime2 NOT NULL,
    [ExpiryDate] datetime2 NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [LetterFilePath] nvarchar(max) NULL,
    [AcceptedAt] datetime2 NULL,
    [JobApplicationAppId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_OfferLetters] PRIMARY KEY ([OfferId]),
    CONSTRAINT [FK_OfferLetters_JobApplications_JobApplicationAppId] FOREIGN KEY ([JobApplicationAppId]) REFERENCES [JobApplications] ([AppId]) ON DELETE CASCADE
);
GO

CREATE TABLE [PayrollComponentValues] (
    [ValueId] uniqueidentifier NOT NULL,
    [DetailId] uniqueidentifier NOT NULL,
    [ComponentId] uniqueidentifier NOT NULL,
    [ComponentType] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PayrollDetailDetailId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PayrollComponentValues] PRIMARY KEY ([ValueId]),
    CONSTRAINT [FK_PayrollComponentValues_PayrollDetails_PayrollDetailDetailId] FOREIGN KEY ([PayrollDetailDetailId]) REFERENCES [PayrollDetails] ([DetailId]) ON DELETE CASCADE,
    CONSTRAINT [FK_PayrollComponentValues_SalaryComponents_ComponentId] FOREIGN KEY ([ComponentId]) REFERENCES [SalaryComponents] ([ComponentId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_AppraisalCycles_CompanyId] ON [AppraisalCycles] ([CompanyId]);
GO

CREATE INDEX [IX_AttendanceRecords_AttendanceDate_Status] ON [AttendanceRecords] ([AttendanceDate], [Status]);
GO

CREATE UNIQUE INDEX [IX_AttendanceRecords_EmployeeId_AttendanceDate] ON [AttendanceRecords] ([EmployeeId], [AttendanceDate]);
GO

CREATE INDEX [IX_AttendanceRegularizations_ApprovedByUserUserId] ON [AttendanceRegularizations] ([ApprovedByUserUserId]);
GO

CREATE INDEX [IX_AttendanceRegularizations_EmployeeId] ON [AttendanceRegularizations] ([EmployeeId]);
GO

CREATE INDEX [IX_AuditLogs_CreatedAt] ON [AuditLogs] ([CreatedAt]);
GO

CREATE INDEX [IX_AuditLogs_TableName_RecordId] ON [AuditLogs] ([TableName], [RecordId]);
GO

CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId]);
GO

CREATE INDEX [IX_CostCenters_CompanyId] ON [CostCenters] ([CompanyId]);
GO

CREATE INDEX [IX_CostCenters_ManagerEmployeeId] ON [CostCenters] ([ManagerEmployeeId]);
GO

CREATE INDEX [IX_Departments_CompanyId] ON [Departments] ([CompanyId]);
GO

CREATE UNIQUE INDEX [IX_Departments_DeptCode] ON [Departments] ([DeptCode]);
GO

CREATE INDEX [IX_Departments_HODEmployeeId] ON [Departments] ([HODEmployeeId]);
GO

CREATE INDEX [IX_Departments_ParentDeptId] ON [Departments] ([ParentDeptId]);
GO

CREATE INDEX [IX_Designations_CompanyId] ON [Designations] ([CompanyId]);
GO

CREATE INDEX [IX_EmailTemplates_CompanyId] ON [EmailTemplates] ([CompanyId]);
GO

CREATE INDEX [IX_EmployeeBankDetails_EmployeeId] ON [EmployeeBankDetails] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeDocuments_EmployeeId] ON [EmployeeDocuments] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeDocuments_VerifiedBy] ON [EmployeeDocuments] ([VerifiedBy]);
GO

CREATE INDEX [IX_EmployeeEducations_EmployeeId] ON [EmployeeEducations] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeExperiences_EmployeeId] ON [EmployeeExperiences] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeGoals_CycleId] ON [EmployeeGoals] ([CycleId]);
GO

CREATE INDEX [IX_EmployeeGoals_EmployeeId] ON [EmployeeGoals] ([EmployeeId]);
GO

CREATE INDEX [IX_Employees_CompanyId_EmploymentStatus] ON [Employees] ([CompanyId], [EmploymentStatus]);
GO

CREATE INDEX [IX_Employees_CostCenterId] ON [Employees] ([CostCenterId]);
GO

CREATE INDEX [IX_Employees_DeptId] ON [Employees] ([DeptId]);
GO

CREATE INDEX [IX_Employees_DesignationId] ON [Employees] ([DesignationId]);
GO

CREATE UNIQUE INDEX [IX_Employees_EmployeeCode] ON [Employees] ([EmployeeCode]);
GO

CREATE INDEX [IX_Employees_LocationId] ON [Employees] ([LocationId]);
GO

CREATE INDEX [IX_Employees_ReportingManagerId] ON [Employees] ([ReportingManagerId]);
GO

CREATE INDEX [IX_EmployeeSalaries_EmployeeId] ON [EmployeeSalaries] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeSalaries_RevisedBy] ON [EmployeeSalaries] ([RevisedBy]);
GO

CREATE INDEX [IX_EmployeeSalaries_StructureId] ON [EmployeeSalaries] ([StructureId]);
GO

CREATE INDEX [IX_EmployeeShifts_EmployeeId] ON [EmployeeShifts] ([EmployeeId]);
GO

CREATE INDEX [IX_EmployeeShifts_ShiftId] ON [EmployeeShifts] ([ShiftId]);
GO

CREATE INDEX [IX_FnFSettlements_ApprovedByUserUserId] ON [FnFSettlements] ([ApprovedByUserUserId]);
GO

CREATE UNIQUE INDEX [IX_FnFSettlements_SeparationId] ON [FnFSettlements] ([SeparationId]);
GO

CREATE INDEX [IX_HolidayCalendars_CompanyId] ON [HolidayCalendars] ([CompanyId]);
GO

CREATE INDEX [IX_HolidayCalendars_LocationId] ON [HolidayCalendars] ([LocationId]);
GO

CREATE INDEX [IX_InterviewRounds_InterviewerId] ON [InterviewRounds] ([InterviewerId]);
GO

CREATE INDEX [IX_InterviewRounds_JobApplicationAppId] ON [InterviewRounds] ([JobApplicationAppId]);
GO

CREATE INDEX [IX_JobApplications_CandidateId] ON [JobApplications] ([CandidateId]);
GO

CREATE INDEX [IX_JobApplications_RequisitionReqId] ON [JobApplications] ([RequisitionReqId]);
GO

CREATE INDEX [IX_JobRequisitions_ApprovedBy] ON [JobRequisitions] ([ApprovedBy]);
GO

CREATE INDEX [IX_JobRequisitions_CompanyId] ON [JobRequisitions] ([CompanyId]);
GO

CREATE INDEX [IX_JobRequisitions_DepartmentDeptId] ON [JobRequisitions] ([DepartmentDeptId]);
GO

CREATE INDEX [IX_JobRequisitions_DesignationId] ON [JobRequisitions] ([DesignationId]);
GO

CREATE INDEX [IX_JobRequisitions_RaisedBy] ON [JobRequisitions] ([RaisedBy]);
GO

CREATE INDEX [IX_LeaveApplications_ApproverId_Status] ON [LeaveApplications] ([ApproverId], [Status]);
GO

CREATE INDEX [IX_LeaveApplications_EmployeeId_Status] ON [LeaveApplications] ([EmployeeId], [Status]);
GO

CREATE INDEX [IX_LeaveApplications_LeaveTypeId] ON [LeaveApplications] ([LeaveTypeId]);
GO

CREATE UNIQUE INDEX [IX_LeaveBalances_EmployeeId_LeaveTypeId_Year] ON [LeaveBalances] ([EmployeeId], [LeaveTypeId], [Year]);
GO

CREATE INDEX [IX_LeaveBalances_LeaveTypeId] ON [LeaveBalances] ([LeaveTypeId]);
GO

CREATE INDEX [IX_LeaveTypes_CompanyId] ON [LeaveTypes] ([CompanyId]);
GO

CREATE INDEX [IX_Locations_CompanyId] ON [Locations] ([CompanyId]);
GO

CREATE INDEX [IX_NoDuesItems_ClearedByUserUserId] ON [NoDuesItems] ([ClearedByUserUserId]);
GO

CREATE INDEX [IX_NoDuesItems_SeparationId] ON [NoDuesItems] ([SeparationId]);
GO

CREATE INDEX [IX_Notifications_UserId_IsRead] ON [Notifications] ([UserId], [IsRead]);
GO

CREATE INDEX [IX_OfferLetters_JobApplicationAppId] ON [OfferLetters] ([JobApplicationAppId]);
GO

CREATE INDEX [IX_PayrollComponentValues_ComponentId] ON [PayrollComponentValues] ([ComponentId]);
GO

CREATE INDEX [IX_PayrollComponentValues_PayrollDetailDetailId] ON [PayrollComponentValues] ([PayrollDetailDetailId]);
GO

CREATE INDEX [IX_PayrollDetails_EmployeeId] ON [PayrollDetails] ([EmployeeId]);
GO

CREATE INDEX [IX_PayrollDetails_PayrollRunId] ON [PayrollDetails] ([PayrollRunId]);
GO

CREATE INDEX [IX_PayrollRuns_ApprovedBy] ON [PayrollRuns] ([ApprovedBy]);
GO

CREATE UNIQUE INDEX [IX_PayrollRuns_CompanyId_Month_Year] ON [PayrollRuns] ([CompanyId], [Month], [Year]);
GO

CREATE INDEX [IX_PayrollRuns_ProcessedBy] ON [PayrollRuns] ([ProcessedBy]);
GO

CREATE INDEX [IX_PerformanceReviews_CycleId] ON [PerformanceReviews] ([CycleId]);
GO

CREATE INDEX [IX_PerformanceReviews_EmployeeId] ON [PerformanceReviews] ([EmployeeId]);
GO

CREATE INDEX [IX_PerformanceReviews_ReviewerId] ON [PerformanceReviews] ([ReviewerId]);
GO

CREATE UNIQUE INDEX [IX_Permissions_PermissionCode] ON [Permissions] ([PermissionCode]);
GO

CREATE INDEX [IX_PFNominees_EmployeeId] ON [PFNominees] ([EmployeeId]);
GO

CREATE INDEX [IX_PIPs_EmployeeId] ON [PIPs] ([EmployeeId]);
GO

CREATE INDEX [IX_PIPs_InitiatedByUserUserId] ON [PIPs] ([InitiatedByUserUserId]);
GO

CREATE INDEX [IX_RolePermissions_PermissionId] ON [RolePermissions] ([PermissionId]);
GO

CREATE UNIQUE INDEX [IX_RolePermissions_RoleId_PermissionId] ON [RolePermissions] ([RoleId], [PermissionId]);
GO

CREATE UNIQUE INDEX [IX_Roles_RoleCode] ON [Roles] ([RoleCode]);
GO

CREATE INDEX [IX_SalaryComponents_CompanyId] ON [SalaryComponents] ([CompanyId]);
GO

CREATE INDEX [IX_SalaryStructures_CompanyId] ON [SalaryStructures] ([CompanyId]);
GO

CREATE INDEX [IX_Separations_EmployeeId] ON [Separations] ([EmployeeId]);
GO

CREATE INDEX [IX_Separations_InitiatedBy] ON [Separations] ([InitiatedBy]);
GO

CREATE INDEX [IX_ShiftMasters_CompanyId] ON [ShiftMasters] ([CompanyId]);
GO

CREATE INDEX [IX_StructureComponents_ComponentId] ON [StructureComponents] ([ComponentId]);
GO

CREATE INDEX [IX_StructureComponents_PercentageOfComponentId] ON [StructureComponents] ([PercentageOfComponentId]);
GO

CREATE INDEX [IX_StructureComponents_StructureId] ON [StructureComponents] ([StructureId]);
GO

CREATE UNIQUE INDEX [IX_SystemSettings_CompanyId_SettingKey] ON [SystemSettings] ([CompanyId], [SettingKey]);
GO

CREATE INDEX [IX_TaxDeclarations_ApprovedByUserUserId] ON [TaxDeclarations] ([ApprovedByUserUserId]);
GO

CREATE INDEX [IX_TaxDeclarations_EmployeeId] ON [TaxDeclarations] ([EmployeeId]);
GO

CREATE INDEX [IX_TrainingNominations_EmployeeId] ON [TrainingNominations] ([EmployeeId]);
GO

CREATE INDEX [IX_TrainingNominations_NominatedBy] ON [TrainingNominations] ([NominatedBy]);
GO

CREATE INDEX [IX_TrainingNominations_ScheduleId] ON [TrainingNominations] ([ScheduleId]);
GO

CREATE INDEX [IX_TrainingPrograms_CompanyId] ON [TrainingPrograms] ([CompanyId]);
GO

CREATE INDEX [IX_TrainingSchedules_ProgramId] ON [TrainingSchedules] ([ProgramId]);
GO

CREATE INDEX [IX_TrainingSchedules_TrainerId] ON [TrainingSchedules] ([TrainerId]);
GO

CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
GO

CREATE INDEX [IX_UserRoles_UserId] ON [UserRoles] ([UserId]);
GO

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

CREATE UNIQUE INDEX [IX_Users_EmployeeId] ON [Users] ([EmployeeId]) WHERE [EmployeeId] IS NOT NULL;
GO

CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
GO

ALTER TABLE [AttendanceRecords] ADD CONSTRAINT [FK_AttendanceRecords_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE;
GO

ALTER TABLE [AttendanceRegularizations] ADD CONSTRAINT [FK_AttendanceRegularizations_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE;
GO

ALTER TABLE [AttendanceRegularizations] ADD CONSTRAINT [FK_AttendanceRegularizations_Users_ApprovedByUserUserId] FOREIGN KEY ([ApprovedByUserUserId]) REFERENCES [Users] ([UserId]);
GO

ALTER TABLE [AuditLogs] ADD CONSTRAINT [FK_AuditLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL;
GO

ALTER TABLE [CostCenters] ADD CONSTRAINT [FK_CostCenters_Employees_ManagerEmployeeId] FOREIGN KEY ([ManagerEmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE SET NULL;
GO

ALTER TABLE [Departments] ADD CONSTRAINT [FK_Departments_Employees_HODEmployeeId] FOREIGN KEY ([HODEmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE SET NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260605103100_InitialCreate', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Employees] DROP CONSTRAINT [FK_Employees_CostCenters_CostCenterId];
GO

ALTER TABLE [Employees] ADD [BandId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [BusinessUnitId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [ContractEndDate] date NULL;
GO

ALTER TABLE [Employees] ADD [DivisionId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [FunctionalManagerId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [GradeId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [InternshipDurationMonths] int NULL;
GO

ALTER TABLE [Employees] ADD [JobFamilyId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [JobFunctionId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [L2ReportingManagerId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [NoticePeriodDays] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Employees] ADD [PayrollGroup] nvarchar(50) NULL;
GO

ALTER TABLE [Employees] ADD [ProfitCenterId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [ShiftId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [SubDeptId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [TeamId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [VendorName] nvarchar(200) NULL;
GO

ALTER TABLE [Employees] ADD [WeeklyOffPattern] nvarchar(50) NULL;
GO

ALTER TABLE [Employees] ADD [WorkMode] nvarchar(50) NULL;
GO

CREATE TABLE [BandMasters] (
    [BandId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_BandMasters] PRIMARY KEY ([BandId]),
    CONSTRAINT [FK_BandMasters_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [BusinessUnits] (
    [BusinessUnitId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_BusinessUnits] PRIMARY KEY ([BusinessUnitId]),
    CONSTRAINT [FK_BusinessUnits_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [GradeMasters] (
    [GradeId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [NoticePeriodDays] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_GradeMasters] PRIMARY KEY ([GradeId]),
    CONSTRAINT [FK_GradeMasters_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [JobFamilies] (
    [JobFamilyId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobFamilies] PRIMARY KEY ([JobFamilyId]),
    CONSTRAINT [FK_JobFamilies_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [ProfitCenters] (
    [ProfitCenterId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_ProfitCenters] PRIMARY KEY ([ProfitCenterId]),
    CONSTRAINT [FK_ProfitCenters_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION
);
GO

CREATE TABLE [SubDepartments] (
    [SubDeptId] uniqueidentifier NOT NULL,
    [DeptId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_SubDepartments] PRIMARY KEY ([SubDeptId]),
    CONSTRAINT [FK_SubDepartments_Departments_DeptId] FOREIGN KEY ([DeptId]) REFERENCES [Departments] ([DeptId]) ON DELETE CASCADE
);
GO

CREATE TABLE [Divisions] (
    [DivisionId] uniqueidentifier NOT NULL,
    [BusinessUnitId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Divisions] PRIMARY KEY ([DivisionId]),
    CONSTRAINT [FK_Divisions_BusinessUnits_BusinessUnitId] FOREIGN KEY ([BusinessUnitId]) REFERENCES [BusinessUnits] ([BusinessUnitId]) ON DELETE CASCADE
);
GO

CREATE TABLE [JobFunctions] (
    [JobFunctionId] uniqueidentifier NOT NULL,
    [JobFamilyId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobFunctions] PRIMARY KEY ([JobFunctionId]),
    CONSTRAINT [FK_JobFunctions_JobFamilies_JobFamilyId] FOREIGN KEY ([JobFamilyId]) REFERENCES [JobFamilies] ([JobFamilyId]) ON DELETE CASCADE
);
GO

CREATE TABLE [Teams] (
    [TeamId] uniqueidentifier NOT NULL,
    [SubDeptId] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Code] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_Teams] PRIMARY KEY ([TeamId]),
    CONSTRAINT [FK_Teams_SubDepartments_SubDeptId] FOREIGN KEY ([SubDeptId]) REFERENCES [SubDepartments] ([SubDeptId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Employees_BandId] ON [Employees] ([BandId]);
GO

CREATE INDEX [IX_Employees_BusinessUnitId] ON [Employees] ([BusinessUnitId]);
GO

CREATE INDEX [IX_Employees_DivisionId] ON [Employees] ([DivisionId]);
GO

CREATE INDEX [IX_Employees_FunctionalManagerId] ON [Employees] ([FunctionalManagerId]);
GO

CREATE INDEX [IX_Employees_GradeId] ON [Employees] ([GradeId]);
GO

CREATE INDEX [IX_Employees_JobFamilyId] ON [Employees] ([JobFamilyId]);
GO

CREATE INDEX [IX_Employees_JobFunctionId] ON [Employees] ([JobFunctionId]);
GO

CREATE INDEX [IX_Employees_L2ReportingManagerId] ON [Employees] ([L2ReportingManagerId]);
GO

CREATE INDEX [IX_Employees_ProfitCenterId] ON [Employees] ([ProfitCenterId]);
GO

CREATE INDEX [IX_Employees_ShiftId] ON [Employees] ([ShiftId]);
GO

CREATE INDEX [IX_Employees_SubDeptId] ON [Employees] ([SubDeptId]);
GO

CREATE INDEX [IX_Employees_TeamId] ON [Employees] ([TeamId]);
GO

CREATE INDEX [IX_BandMasters_CompanyId] ON [BandMasters] ([CompanyId]);
GO

CREATE INDEX [IX_BusinessUnits_CompanyId] ON [BusinessUnits] ([CompanyId]);
GO

CREATE INDEX [IX_Divisions_BusinessUnitId] ON [Divisions] ([BusinessUnitId]);
GO

CREATE INDEX [IX_GradeMasters_CompanyId] ON [GradeMasters] ([CompanyId]);
GO

CREATE INDEX [IX_JobFamilies_CompanyId] ON [JobFamilies] ([CompanyId]);
GO

CREATE INDEX [IX_JobFunctions_JobFamilyId] ON [JobFunctions] ([JobFamilyId]);
GO

CREATE INDEX [IX_ProfitCenters_CompanyId] ON [ProfitCenters] ([CompanyId]);
GO

CREATE INDEX [IX_SubDepartments_DeptId] ON [SubDepartments] ([DeptId]);
GO

CREATE INDEX [IX_Teams_SubDeptId] ON [Teams] ([SubDeptId]);
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_BandMasters_BandId] FOREIGN KEY ([BandId]) REFERENCES [BandMasters] ([BandId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_BusinessUnits_BusinessUnitId] FOREIGN KEY ([BusinessUnitId]) REFERENCES [BusinessUnits] ([BusinessUnitId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_CostCenters_CostCenterId] FOREIGN KEY ([CostCenterId]) REFERENCES [CostCenters] ([CostCenterId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Divisions_DivisionId] FOREIGN KEY ([DivisionId]) REFERENCES [Divisions] ([DivisionId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Employees_FunctionalManagerId] FOREIGN KEY ([FunctionalManagerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Employees_L2ReportingManagerId] FOREIGN KEY ([L2ReportingManagerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_GradeMasters_GradeId] FOREIGN KEY ([GradeId]) REFERENCES [GradeMasters] ([GradeId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_JobFamilies_JobFamilyId] FOREIGN KEY ([JobFamilyId]) REFERENCES [JobFamilies] ([JobFamilyId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_JobFunctions_JobFunctionId] FOREIGN KEY ([JobFunctionId]) REFERENCES [JobFunctions] ([JobFunctionId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_ProfitCenters_ProfitCenterId] FOREIGN KEY ([ProfitCenterId]) REFERENCES [ProfitCenters] ([ProfitCenterId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_ShiftMasters_ShiftId] FOREIGN KEY ([ShiftId]) REFERENCES [ShiftMasters] ([ShiftId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_SubDepartments_SubDeptId] FOREIGN KEY ([SubDeptId]) REFERENCES [SubDepartments] ([SubDeptId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Teams_TeamId] FOREIGN KEY ([TeamId]) REFERENCES [Teams] ([TeamId]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260623051043_AddM1EnterpriseEnhancements', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Employees] ADD [AlternateEmergencyContactPhone] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [AlternateMobile] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [Category] int NULL;
GO

ALTER TABLE [Employees] ADD [CurrentAddressLine1] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [CurrentAddressLine2] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [CurrentDistrict] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [DomicileState] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [ExtensionNumber] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [FatherName] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [FullNameAadhaar] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [MarriageDate] date NULL;
GO

ALTER TABLE [Employees] ADD [MotherTongue] int NULL;
GO

ALTER TABLE [Employees] ADD [NPSPRANNumber] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [NumberOfDependents] int NULL;
GO

ALTER TABLE [Employees] ADD [OfficialMobile] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [PermanentAddressLine1] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [PermanentAddressLine2] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [PermanentDistrict] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [PermanentTaluka] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [PreviousEmployerPFNumber] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [PwdCertificateNo] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [PwdStatus] int NULL;
GO

ALTER TABLE [Employees] ADD [SameAddressFlag] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [Employees] ADD [SpouseName] nvarchar(max) NULL;
GO

ALTER TABLE [Employees] ADD [Title] int NULL;
GO

ALTER TABLE [Employees] ADD [WhatsAppNumber] nvarchar(max) NULL;
GO

ALTER TABLE [EmployeeDocuments] ADD [DocumentNumber] nvarchar(max) NULL;
GO

ALTER TABLE [EmployeeDocuments] ADD [ExpiryDate] date NULL;
GO

ALTER TABLE [EmployeeDocuments] ADD [Remarks] nvarchar(max) NULL;
GO

ALTER TABLE [EmployeeBankDetails] ADD [VerificationStatus] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [EmployeeBankDetails] ADD [VerifiedAt] datetime2 NULL;
GO

ALTER TABLE [EmployeeBankDetails] ADD [VerifiedBy] uniqueidentifier NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260623110324_AddEmployeePersonalAndAddressFields', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Employees] ADD [AadharHash] nvarchar(450) NULL;
GO

ALTER TABLE [Employees] ADD [PANHash] nvarchar(450) NULL;
GO

CREATE UNIQUE INDEX [IX_Employees_AadharHash] ON [Employees] ([AadharHash]) WHERE [AadharHash] IS NOT NULL;
GO

CREATE UNIQUE INDEX [IX_Employees_PANHash] ON [Employees] ([PANHash]) WHERE [PANHash] IS NOT NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260624064720_AddAadharAndPanHashes', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DROP INDEX [IX_Employees_PANHash] ON [Employees];
DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'PANHash');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Employees] ALTER COLUMN [PANHash] nvarchar(100) NULL;
CREATE UNIQUE INDEX [IX_Employees_PANHash] ON [Employees] ([PANHash]) WHERE [PANHash] IS NOT NULL;
GO

DROP INDEX [IX_Employees_AadharHash] ON [Employees];
DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Employees]') AND [c].[name] = N'AadharHash');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Employees] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Employees] ALTER COLUMN [AadharHash] nvarchar(100) NULL;
CREATE UNIQUE INDEX [IX_Employees_AadharHash] ON [Employees] ([AadharHash]) WHERE [AadharHash] IS NOT NULL;
GO

CREATE TABLE [BGVRecords] (
    [BGVId] uniqueidentifier NOT NULL,
    [CandidateId] uniqueidentifier NOT NULL,
    [AgencyName] nvarchar(max) NOT NULL,
    [BGVType] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [DiscrepancyNotes] nvarchar(max) NULL,
    [InitiatedAt] datetime2 NULL,
    [IdentityStatus] nvarchar(max) NOT NULL,
    [EmploymentStatus] nvarchar(max) NOT NULL,
    [EducationStatus] nvarchar(max) NOT NULL,
    [CriminalStatus] nvarchar(max) NOT NULL,
    [ReferenceStatus] nvarchar(max) NOT NULL,
    [CreditStatus] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_BGVRecords] PRIMARY KEY ([BGVId]),
    CONSTRAINT [FK_BGVRecords_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([CandidateId]) ON DELETE CASCADE
);
GO

CREATE TABLE [InterviewRoundPanelists] (
    [PanelistId] uniqueidentifier NOT NULL,
    [RoundId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [Rating] decimal(3,1) NULL,
    [Feedback] nvarchar(max) NULL,
    [SubmittedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_InterviewRoundPanelists] PRIMARY KEY ([PanelistId]),
    CONSTRAINT [FK_InterviewRoundPanelists_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_InterviewRoundPanelists_InterviewRounds_RoundId] FOREIGN KEY ([RoundId]) REFERENCES [InterviewRounds] ([RoundId]) ON DELETE CASCADE
);
GO

CREATE TABLE [JobPostings] (
    [JobId] uniqueidentifier NOT NULL,
    [ReqId] uniqueidentifier NOT NULL,
    [JobTitle] nvarchar(max) NOT NULL,
    [JobDescription] nvarchar(max) NULL,
    [PublishChannels] nvarchar(max) NULL,
    [PostedAt] datetime2 NOT NULL,
    [ExpiryDate] date NULL,
    [ShowSalary] bit NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobPostings] PRIMARY KEY ([JobId]),
    CONSTRAINT [FK_JobPostings_JobRequisitions_ReqId] FOREIGN KEY ([ReqId]) REFERENCES [JobRequisitions] ([ReqId]) ON DELETE CASCADE
);
GO

CREATE TABLE [OnboardingProcesses] (
    [OnboardingId] uniqueidentifier NOT NULL,
    [CandidateId] uniqueidentifier NOT NULL,
    [AccessToken] nvarchar(max) NOT NULL,
    [TokenExpiresAt] datetime2 NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [PersonalInfoCompleted] bit NOT NULL,
    [DocumentsUploaded] bit NOT NULL,
    [HRChecklistJson] nvarchar(max) NOT NULL,
    [ITChecklistJson] nvarchar(max) NOT NULL,
    [AdminChecklistJson] nvarchar(max) NOT NULL,
    [AssetAllocation] nvarchar(max) NULL,
    [BuddyEmployeeId] uniqueidentifier NULL,
    [InductionSchedule] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_OnboardingProcesses] PRIMARY KEY ([OnboardingId]),
    CONSTRAINT [FK_OnboardingProcesses_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([CandidateId]) ON DELETE CASCADE,
    CONSTRAINT [FK_OnboardingProcesses_Employees_BuddyEmployeeId] FOREIGN KEY ([BuddyEmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION
);
GO

CREATE INDEX [IX_BGVRecords_CandidateId] ON [BGVRecords] ([CandidateId]);
GO

CREATE INDEX [IX_InterviewRoundPanelists_EmployeeId] ON [InterviewRoundPanelists] ([EmployeeId]);
GO

CREATE INDEX [IX_InterviewRoundPanelists_RoundId] ON [InterviewRoundPanelists] ([RoundId]);
GO

CREATE INDEX [IX_JobPostings_ReqId] ON [JobPostings] ([ReqId]);
GO

CREATE INDEX [IX_OnboardingProcesses_BuddyEmployeeId] ON [OnboardingProcesses] ([BuddyEmployeeId]);
GO

CREATE INDEX [IX_OnboardingProcesses_CandidateId] ON [OnboardingProcesses] ([CandidateId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260625105234_AddRecruitmentAndOnboardingTables', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [PasswordHistories] (
    [HistoryId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [PasswordHash] nvarchar(500) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_PasswordHistories] PRIMARY KEY ([HistoryId]),
    CONSTRAINT [FK_PasswordHistories_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
);
GO

CREATE TABLE [SecurityAuditLogs] (
    [LogId] uniqueidentifier NOT NULL,
    [EventType] nvarchar(50) NOT NULL,
    [UserId] uniqueidentifier NULL,
    [Username] nvarchar(100) NULL,
    [IpAddress] nvarchar(50) NULL,
    [UserAgent] nvarchar(500) NULL,
    [Details] nvarchar(max) NULL,
    [IsSuccess] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SecurityAuditLogs] PRIMARY KEY ([LogId]),
    CONSTRAINT [FK_SecurityAuditLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL
);
GO

CREATE INDEX [IX_PasswordHistories_CreatedAt] ON [PasswordHistories] ([CreatedAt]);
GO

CREATE INDEX [IX_PasswordHistories_UserId] ON [PasswordHistories] ([UserId]);
GO

CREATE INDEX [IX_SecurityAuditLogs_CreatedAt] ON [SecurityAuditLogs] ([CreatedAt]);
GO

CREATE INDEX [IX_SecurityAuditLogs_EventType] ON [SecurityAuditLogs] ([EventType]);
GO

CREATE INDEX [IX_SecurityAuditLogs_UserId] ON [SecurityAuditLogs] ([UserId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260630095854_AddRbacSecurityTables', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [OnboardingProcesses] ADD [TransitionHistoryJson] nvarchar(max) NOT NULL DEFAULT N'';
GO

CREATE TABLE [OnboardingTasks] (
    [TaskId] uniqueidentifier NOT NULL,
    [OnboardingId] uniqueidentifier NOT NULL,
    [TaskName] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [Department] nvarchar(max) NOT NULL,
    [OwnerId] uniqueidentifier NULL,
    [OwnerName] nvarchar(max) NOT NULL,
    [Priority] nvarchar(max) NOT NULL,
    [DueDate] date NULL,
    [CompletionDate] date NULL,
    [Status] nvarchar(max) NOT NULL,
    [SLADays] int NULL,
    [Remarks] nvarchar(max) NOT NULL,
    [AttachmentPath] nvarchar(max) NULL,
    [AuditHistoryJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_OnboardingTasks] PRIMARY KEY ([TaskId]),
    CONSTRAINT [FK_OnboardingTasks_Employees_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_OnboardingTasks_OnboardingProcesses_OnboardingId] FOREIGN KEY ([OnboardingId]) REFERENCES [OnboardingProcesses] ([OnboardingId]) ON DELETE CASCADE
);
GO

CREATE TABLE [ProbationReviews] (
    [ReviewId] uniqueidentifier NOT NULL,
    [EmployeeId] uniqueidentifier NOT NULL,
    [CheckpointDays] int NOT NULL,
    [ReviewDueDate] date NOT NULL,
    [CompletedDate] date NULL,
    [Rating] nvarchar(max) NOT NULL,
    [Comments] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [ReviewerId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_ProbationReviews] PRIMARY KEY ([ReviewId]),
    CONSTRAINT [FK_ProbationReviews_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProbationReviews_Employees_ReviewerId] FOREIGN KEY ([ReviewerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION
);
GO

CREATE INDEX [IX_OnboardingTasks_OnboardingId] ON [OnboardingTasks] ([OnboardingId]);
GO

CREATE INDEX [IX_OnboardingTasks_OwnerId] ON [OnboardingTasks] ([OwnerId]);
GO

CREATE INDEX [IX_ProbationReviews_EmployeeId] ON [ProbationReviews] ([EmployeeId]);
GO

CREATE INDEX [IX_ProbationReviews_ReviewerId] ON [ProbationReviews] ([ReviewerId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260703054434_AddOnboardingTasksAndProbation', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobRequisitions] DROP CONSTRAINT [FK_JobRequisitions_Companies_CompanyId];
GO

ALTER TABLE [JobRequisitions] DROP CONSTRAINT [FK_JobRequisitions_Departments_DepartmentDeptId];
GO

ALTER TABLE [JobRequisitions] DROP CONSTRAINT [FK_JobRequisitions_Designations_DesignationId];
GO

DROP INDEX [IX_JobRequisitions_DepartmentDeptId] ON [JobRequisitions];
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobRequisitions]') AND [c].[name] = N'DepartmentDeptId');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [JobRequisitions] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [JobRequisitions] DROP COLUMN [DepartmentDeptId];
GO

CREATE INDEX [IX_JobRequisitions_DeptId] ON [JobRequisitions] ([DeptId]);
GO

ALTER TABLE [JobRequisitions] ADD CONSTRAINT [FK_JobRequisitions_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([CompanyId]) ON DELETE NO ACTION;
GO

ALTER TABLE [JobRequisitions] ADD CONSTRAINT [FK_JobRequisitions_Departments_DeptId] FOREIGN KEY ([DeptId]) REFERENCES [Departments] ([DeptId]) ON DELETE NO ACTION;
GO

ALTER TABLE [JobRequisitions] ADD CONSTRAINT [FK_JobRequisitions_Designations_DesignationId] FOREIGN KEY ([DesignationId]) REFERENCES [Designations] ([DesignationId]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260703064634_FixJobRequisitionDeptIdFK', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Employees] ADD [EmployeeCategory] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260703092552_AddEmployeeCategory', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Employees] DROP CONSTRAINT [FK_Employees_SubDepartments_SubDeptId];
GO

ALTER TABLE [Teams] DROP CONSTRAINT [FK_Teams_SubDepartments_SubDeptId];
GO

DROP TABLE [SubDepartments];
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Departments_SubDeptId] FOREIGN KEY ([SubDeptId]) REFERENCES [Departments] ([DeptId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Teams] ADD CONSTRAINT [FK_Teams_Departments_SubDeptId] FOREIGN KEY ([SubDeptId]) REFERENCES [Departments] ([DeptId]) ON DELETE CASCADE;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260703110049_UnifyDepartmentHierarchy', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobRequisitions] ADD [CurrentApprovalLevel] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [JobRequisitions] ADD [CurrentApproverId] uniqueidentifier NULL;
GO

ALTER TABLE [JobRequisitions] ADD [HiringManagerId] uniqueidentifier NULL;
GO

ALTER TABLE [JobRequisitions] ADD [InternalHiringJustification] nvarchar(max) NULL;
GO

ALTER TABLE [JobRequisitions] ADD [InternalHiringRemarks] nvarchar(max) NULL;
GO

ALTER TABLE [JobRequisitions] ADD [Justification] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [JobRequisitions] ADD [MrfNumber] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [JobRequisitions] ADD [Priority] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [JobRequisitions] ADD [ReplacingEmployeeId] uniqueidentifier NULL;
GO

ALTER TABLE [JobRequisitions] ADD [SourcingPreference] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [JobRequisitions] ADD [SubDeptId] uniqueidentifier NULL;
GO

ALTER TABLE [JobRequisitions] ADD [VacancyType] nvarchar(max) NOT NULL DEFAULT N'';
GO

CREATE TABLE [ApprovalWorkflowConfigs] (
    [ConfigId] uniqueidentifier NOT NULL,
    [CompanyId] uniqueidentifier NOT NULL,
    [DeptId] uniqueidentifier NULL,
    [EmploymentType] nvarchar(max) NULL,
    [BudgetThreshold] decimal(18,2) NULL,
    [ApproverRolesJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_ApprovalWorkflowConfigs] PRIMARY KEY ([ConfigId])
);
GO

CREATE TABLE [RequisitionAuditTrails] (
    [AuditId] uniqueidentifier NOT NULL,
    [ReqId] uniqueidentifier NOT NULL,
    [Action] nvarchar(max) NOT NULL,
    [ActionBy] uniqueidentifier NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    [Remarks] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_RequisitionAuditTrails] PRIMARY KEY ([AuditId]),
    CONSTRAINT [FK_RequisitionAuditTrails_JobRequisitions_ReqId] FOREIGN KEY ([ReqId]) REFERENCES [JobRequisitions] ([ReqId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_RequisitionAuditTrails_ReqId] ON [RequisitionAuditTrails] ([ReqId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260706125125_AddRequisitionEnterpriseFields', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobRequisitions]') AND [c].[name] = N'DesignationId');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [JobRequisitions] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [JobRequisitions] ALTER COLUMN [DesignationId] uniqueidentifier NULL;
GO

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobRequisitions]') AND [c].[name] = N'DeptId');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [JobRequisitions] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [JobRequisitions] ALTER COLUMN [DeptId] uniqueidentifier NULL;
GO

ALTER TABLE [JobRequisitions] ADD [GradeId] uniqueidentifier NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260707054534_NullableRequisitionFields', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobPostings]') AND [c].[name] = N'Status');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [JobPostings] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [JobPostings] ALTER COLUMN [Status] nvarchar(20) NOT NULL;
GO

ALTER TABLE [JobPostings] ADD [AutoUnpublish] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [JobPostings] ADD [EmploymentType] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [ExperienceMax] decimal(4,1) NULL;
GO

ALTER TABLE [JobPostings] ADD [ExperienceMin] decimal(4,1) NULL;
GO

ALTER TABLE [JobPostings] ADD [Industry] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [JobCategory] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [ScreeningEnabled] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [JobPostings] ADD [ShowCompanyName] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [JobPostings] ADD [ShowSalaryRange] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [JobApplications] ADD [AiMatchScore] decimal(5,2) NULL;
GO

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Candidates]') AND [c].[name] = N'TotalExperience');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Candidates] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [Candidates] ALTER COLUMN [TotalExperience] decimal(4,1) NULL;
GO

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Candidates]') AND [c].[name] = N'Source');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Candidates] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [Candidates] ALTER COLUMN [Source] nvarchar(30) NULL;
GO

DECLARE @var8 sysname;
SELECT @var8 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Candidates]') AND [c].[name] = N'ExpectedCTC');
IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [Candidates] DROP CONSTRAINT [' + @var8 + '];');
ALTER TABLE [Candidates] ALTER COLUMN [ExpectedCTC] decimal(12,2) NULL;
GO

DECLARE @var9 sysname;
SELECT @var9 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Candidates]') AND [c].[name] = N'CurrentCTC');
IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [Candidates] DROP CONSTRAINT [' + @var9 + '];');
ALTER TABLE [Candidates] ALTER COLUMN [CurrentCTC] decimal(12,2) NULL;
GO

ALTER TABLE [Candidates] ADD [CandidateStatus] nvarchar(30) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Candidates] ADD [CandidateTags] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [CurrentLocation] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [HighestQualification] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [LastApplicationDate] datetime2 NULL;
GO

ALTER TABLE [Candidates] ADD [PreferredLocation] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [ReferralEmployeeId] uniqueidentifier NULL;
GO

ALTER TABLE [Candidates] ADD [RelevantExperience] decimal(4,1) NULL;
GO

ALTER TABLE [Candidates] ADD [WillingToRelocate] nvarchar(max) NULL;
GO

CREATE TABLE [JobPostingChannels] (
    [ChannelId] uniqueidentifier NOT NULL,
    [JobId] uniqueidentifier NOT NULL,
    [ChannelName] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobPostingChannels] PRIMARY KEY ([ChannelId]),
    CONSTRAINT [FK_JobPostingChannels_JobPostings_JobId] FOREIGN KEY ([JobId]) REFERENCES [JobPostings] ([JobId]) ON DELETE CASCADE
);
GO

CREATE TABLE [JobPostingPerks] (
    [PerkId] uniqueidentifier NOT NULL,
    [JobId] uniqueidentifier NOT NULL,
    [PerkName] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobPostingPerks] PRIMARY KEY ([PerkId]),
    CONSTRAINT [FK_JobPostingPerks_JobPostings_JobId] FOREIGN KEY ([JobId]) REFERENCES [JobPostings] ([JobId]) ON DELETE CASCADE
);
GO

CREATE TABLE [JobPostingQuestions] (
    [QuestionId] uniqueidentifier NOT NULL,
    [JobPostingId] uniqueidentifier NOT NULL,
    [Question] nvarchar(max) NOT NULL,
    [QuestionType] nvarchar(max) NOT NULL,
    [Required] bit NOT NULL,
    [DealBreaker] bit NOT NULL,
    [ExpectedAnswer] nvarchar(max) NULL,
    [Sequence] int NOT NULL,
    [Weightage] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_JobPostingQuestions] PRIMARY KEY ([QuestionId]),
    CONSTRAINT [FK_JobPostingQuestions_JobPostings_JobPostingId] FOREIGN KEY ([JobPostingId]) REFERENCES [JobPostings] ([JobId]) ON DELETE CASCADE
);
GO

CREATE TABLE [CandidateAnswers] (
    [AnswerId] uniqueidentifier NOT NULL,
    [CandidateId] uniqueidentifier NOT NULL,
    [QuestionId] uniqueidentifier NOT NULL,
    [Answer] nvarchar(max) NOT NULL,
    [Passed] bit NOT NULL,
    [AnsweredOn] datetime2 NOT NULL,
    [AnsweredBy] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_CandidateAnswers] PRIMARY KEY ([AnswerId]),
    CONSTRAINT [FK_CandidateAnswers_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([CandidateId]) ON DELETE CASCADE,
    CONSTRAINT [FK_CandidateAnswers_JobPostingQuestions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [JobPostingQuestions] ([QuestionId]) ON DELETE NO ACTION
);
GO

CREATE INDEX [IX_Candidates_ReferralEmployeeId] ON [Candidates] ([ReferralEmployeeId]);
GO

CREATE INDEX [IX_CandidateAnswers_CandidateId] ON [CandidateAnswers] ([CandidateId]);
GO

CREATE INDEX [IX_CandidateAnswers_QuestionId] ON [CandidateAnswers] ([QuestionId]);
GO

CREATE INDEX [IX_JobPostingChannels_JobId] ON [JobPostingChannels] ([JobId]);
GO

CREATE INDEX [IX_JobPostingPerks_JobId] ON [JobPostingPerks] ([JobId]);
GO

CREATE INDEX [IX_JobPostingQuestions_JobPostingId] ON [JobPostingQuestions] ([JobPostingId]);
GO

ALTER TABLE [Candidates] ADD CONSTRAINT [FK_Candidates_Employees_ReferralEmployeeId] FOREIGN KEY ([ReferralEmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260707130830_AddCandidateSourcingAndATSSchema', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Candidates] ADD [Gender] nvarchar(20) NULL;
GO

CREATE INDEX [IX_JobRequisitions_GradeId] ON [JobRequisitions] ([GradeId]);
GO

ALTER TABLE [JobRequisitions] ADD CONSTRAINT [FK_JobRequisitions_GradeMasters_GradeId] FOREIGN KEY ([GradeId]) REFERENCES [GradeMasters] ([GradeId]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260708050736_AddCandidateGender', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobPostings] ADD [Benefits] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [Requirements] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [RolesAndResponsibilities] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [SkillsRequired] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [DateOfBirth] date NULL;
GO

ALTER TABLE [Candidates] ADD [Languages] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [LinkedIn] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [Portfolio] nvarchar(max) NULL;
GO

ALTER TABLE [Candidates] ADD [Skills] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260708053612_AddAtsSourcingFields', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobApplications] ADD [TimelineEventsJson] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Employees] ADD [RecruitmentSource] nvarchar(100) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260710091128_AddRecruitmentTimelineAndSource', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Employees] ADD [L3ReportingManagerId] uniqueidentifier NULL;
GO

ALTER TABLE [Employees] ADD [L4ReportingManagerId] uniqueidentifier NULL;
GO

CREATE INDEX [IX_Employees_L3ReportingManagerId] ON [Employees] ([L3ReportingManagerId]);
GO

CREATE INDEX [IX_Employees_L4ReportingManagerId] ON [Employees] ([L4ReportingManagerId]);
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Employees_L3ReportingManagerId] FOREIGN KEY ([L3ReportingManagerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION;
GO

ALTER TABLE [Employees] ADD CONSTRAINT [FK_Employees_Employees_L4ReportingManagerId] FOREIGN KEY ([L4ReportingManagerId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260710121435_AddL3L4Managers', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobRequisitions] ADD [CancelReason] nvarchar(max) NULL;
GO

ALTER TABLE [JobRequisitions] ADD [CancelledBy] uniqueidentifier NULL;
GO

ALTER TABLE [JobRequisitions] ADD [CancelledOn] datetime2 NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260713063116_AddRequisitionCancellationFields', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobPostings] ADD [ExternalLink] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [LocationName] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [MetadataJson] nvarchar(max) NULL;
GO

ALTER TABLE [JobPostings] ADD [PublishedById] uniqueidentifier NULL;
GO

ALTER TABLE [JobPostings] ADD [WorkMode] nvarchar(max) NULL;
GO

CREATE INDEX [IX_JobPostings_PublishedById] ON [JobPostings] ([PublishedById]);
GO

ALTER TABLE [JobPostings] ADD CONSTRAINT [FK_JobPostings_Users_PublishedById] FOREIGN KEY ([PublishedById]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL;
GO

UPDATE JobPostings SET Status = 'Published' WHERE Status = 'Active';
GO

UPDATE JobPostings SET Status = 'Closed' WHERE Status = 'Expired';
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260713091129_AddJobPostingExtensibleSchema', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobApplications] ADD [AssignedRecruiterId] uniqueidentifier NULL;
GO

CREATE INDEX [IX_JobApplications_AssignedRecruiterId] ON [JobApplications] ([AssignedRecruiterId]);
GO

ALTER TABLE [JobApplications] ADD CONSTRAINT [FK_JobApplications_Users_AssignedRecruiterId] FOREIGN KEY ([AssignedRecruiterId]) REFERENCES [Users] ([UserId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260713110923_AddAssignedRecruiterToJobApplication', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobApplications] DROP CONSTRAINT [FK_JobApplications_JobRequisitions_RequisitionReqId];
GO

DROP INDEX [IX_JobApplications_RequisitionReqId] ON [JobApplications];
GO

DECLARE @var10 sysname;
SELECT @var10 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobApplications]') AND [c].[name] = N'RequisitionReqId');
IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [JobApplications] DROP CONSTRAINT [' + @var10 + '];');
ALTER TABLE [JobApplications] DROP COLUMN [RequisitionReqId];
GO

CREATE INDEX [IX_JobApplications_ReqId] ON [JobApplications] ([ReqId]);
GO

ALTER TABLE [JobApplications] ADD CONSTRAINT [FK_JobApplications_JobRequisitions_ReqId] FOREIGN KEY ([ReqId]) REFERENCES [JobRequisitions] ([ReqId]) ON DELETE CASCADE;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260713130649_FixJobApplicationForeignKey', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [PendingApplications] (
    [PendingAppId] uniqueidentifier NOT NULL,
    [JobId] uniqueidentifier NOT NULL,
    [FirstName] nvarchar(max) NOT NULL,
    [LastName] nvarchar(max) NULL,
    [Email] nvarchar(max) NOT NULL,
    [Phone] nvarchar(max) NULL,
    [CurrentCompany] nvarchar(max) NULL,
    [CurrentDesignation] nvarchar(max) NULL,
    [CurrentCTC] decimal(12,2) NULL,
    [ExpectedCTC] decimal(12,2) NULL,
    [NoticePeriodDays] int NULL,
    [TotalExperience] decimal(4,1) NULL,
    [Source] nvarchar(max) NULL,
    [ResumeFilePath] nvarchar(max) NULL,
    [ReferralEmployeeId] uniqueidentifier NULL,
    [Status] nvarchar(30) NOT NULL,
    [AppliedDate] datetime2 NOT NULL,
    [RejectionReason] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [UpdatedBy] uniqueidentifier NULL,
    CONSTRAINT [PK_PendingApplications] PRIMARY KEY ([PendingAppId]),
    CONSTRAINT [FK_PendingApplications_Employees_ReferralEmployeeId] FOREIGN KEY ([ReferralEmployeeId]) REFERENCES [Employees] ([EmployeeId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PendingApplications_JobPostings_JobId] FOREIGN KEY ([JobId]) REFERENCES [JobPostings] ([JobId]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_PendingApplications_JobId] ON [PendingApplications] ([JobId]);
GO

CREATE INDEX [IX_PendingApplications_ReferralEmployeeId] ON [PendingApplications] ([ReferralEmployeeId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260714061530_AddPendingApplications', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobApplications] ADD [NotesJson] nvarchar(max) NOT NULL DEFAULT N'';
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260714072538_AddJobApplicationNotes', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobApplications] ADD [HrApproved] bit NULL;
GO

ALTER TABLE [JobApplications] ADD [ManagerApproved] bit NULL;
GO

ALTER TABLE [JobApplications] ADD [StageDataJson] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [JobApplications] ADD [TechnicalApproved] bit NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260714095508_AddAtsStageWorkflows', N'8.0.11');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [JobApplications] ADD [Status] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Employees] ADD [CandidateId] uniqueidentifier NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260714110819_AddAtsHiringFields', N'8.0.11');
GO

COMMIT;
GO



GO

-- ==========================================
-- SEED DATA
-- ==========================================
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


GO

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


GO

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


GO

-- ============================================================
-- IndiaHRMS Seed Data: Role Permissions Mapping
-- ============================================================
DECLARE @SuperAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'SUPER_ADMIN');

-- Map all permissions to SUPER_ADMIN role
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @SuperAdminRoleId, PermissionId
FROM Permissions
WHERE PermissionId NOT IN (
    SELECT PermissionId FROM RolePermissions WHERE RoleId = @SuperAdminRoleId
);

PRINT 'All permissions mapped to SUPER_ADMIN successfully.';


GO

