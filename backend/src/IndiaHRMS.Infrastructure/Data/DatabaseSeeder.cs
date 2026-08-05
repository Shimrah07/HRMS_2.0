using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IndiaHRMS.Application.Interfaces;

namespace IndiaHRMS.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context, IEncryptionService encryption)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmployeeSalaryStructures')
                BEGIN
                    CREATE TABLE EmployeeSalaryStructures (
                        StructureId UNIQUEIDENTIFIER PRIMARY KEY,
                        EmployeeId UNIQUEIDENTIFIER NOT NULL,
                        AnnualCTC DECIMAL(14,2) NOT NULL,
                        EffectiveFrom DATE NOT NULL,
                        EffectiveTo DATE NULL,
                        IsActive BIT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmployeeSalaryComponentAllocations')
                BEGIN
                    CREATE TABLE EmployeeSalaryComponentAllocations (
                        AllocationId UNIQUEIDENTIFIER PRIMARY KEY,
                        StructureId UNIQUEIDENTIFIER NOT NULL,
                        ComponentId UNIQUEIDENTIFIER NOT NULL,
                        [Group] INT NOT NULL,
                        InputMode INT NOT NULL DEFAULT 1,
                        Percentage DECIMAL(6,2) NULL,
                        AnnualAmount DECIMAL(14,2) NOT NULL,
                        MonthlyAmount DECIMAL(12,2) NOT NULL,
                        IsBalancingComponent BIT NOT NULL DEFAULT 0,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SalaryComponents') AND name = 'Group')
                BEGIN
                    ALTER TABLE SalaryComponents ADD [Group] INT NOT NULL DEFAULT 1;
                END;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SalaryComponents') AND name = 'CalculationBasis')
                BEGIN
                    ALTER TABLE SalaryComponents ADD CalculationBasis INT NOT NULL DEFAULT 1;
                END;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SalaryComponents') AND name = 'DefaultPercentage')
                BEGIN
                    ALTER TABLE SalaryComponents ADD DefaultPercentage DECIMAL(6,2) NULL;
                END;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SalaryComponents') AND name = 'ApplicableTo')
                BEGIN
                    ALTER TABLE SalaryComponents ADD ApplicableTo INT NOT NULL DEFAULT 3;
                END;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SalaryComponents') AND name = 'IsBalancingComponent')
                BEGIN
                    ALTER TABLE SalaryComponents ADD IsBalancingComponent BIT NOT NULL DEFAULT 0;
                END;
            ");
        }
        catch { }

        // ─── DDL: New payroll tables (Module 5 advancement) ───────────────────
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                -- PayrollAuditLog
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PayrollAuditLogs')
                BEGIN
                    CREATE TABLE PayrollAuditLogs (
                        AuditId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        PayrollRunId UNIQUEIDENTIFIER NULL,
                        Action NVARCHAR(200) NOT NULL,
                        Details NVARCHAR(MAX) NULL,
                        PerformedBy UNIQUEIDENTIFIER NOT NULL,
                        PerformedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                    );
                END;

                -- StatutoryDeductionConfigs
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StatutoryDeductionConfigs')
                BEGIN
                    CREATE TABLE StatutoryDeductionConfigs (
                        ConfigId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        CompanyId UNIQUEIDENTIFIER NOT NULL,
                        WorkState NVARCHAR(5) NOT NULL DEFAULT 'MH',
                        PFApplicable BIT NOT NULL DEFAULT 1,
                        PFHigherBasis BIT NOT NULL DEFAULT 0,
                        PFWageCeiling DECIMAL(10,2) NOT NULL DEFAULT 15000,
                        ESIApplicable BIT NOT NULL DEFAULT 1,
                        ESIGrossLimit DECIMAL(10,2) NOT NULL DEFAULT 21000,
                        PTApplicable BIT NOT NULL DEFAULT 1,
                        LWFApplicable BIT NOT NULL DEFAULT 0,
                        LWFEmployeeAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
                        LWFEmployerAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
                        LopDivisor INT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                -- ProfessionalTaxSlabs
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProfessionalTaxSlabs')
                BEGIN
                    CREATE TABLE ProfessionalTaxSlabs (
                        SlabId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        CompanyId UNIQUEIDENTIFIER NOT NULL,
                        StateCode NVARCHAR(5) NOT NULL DEFAULT 'MH',
                        FromAmount DECIMAL(10,2) NOT NULL,
                        ToAmount DECIMAL(10,2) NULL,
                        MonthlyPTAmount DECIMAL(8,2) NOT NULL DEFAULT 0,
                        FebruaryOverride DECIMAL(8,2) NULL
                    );
                END;

                -- InvestmentDeclarations
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvestmentDeclarations')
                BEGIN
                    CREATE TABLE InvestmentDeclarations (
                        DeclarationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        EmployeeId UNIQUEIDENTIFIER NOT NULL,
                        FinancialYear NVARCHAR(10) NOT NULL,
                        TaxRegime INT NOT NULL DEFAULT 0,
                        Section80C DECIMAL(12,2) NOT NULL DEFAULT 0,
                        Section80D DECIMAL(10,2) NOT NULL DEFAULT 0,
                        Section80E DECIMAL(10,2) NOT NULL DEFAULT 0,
                        Section80G DECIMAL(10,2) NOT NULL DEFAULT 0,
                        HraRentedHouse BIT NOT NULL DEFAULT 0,
                        HraClaimAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
                        LandlordName NVARCHAR(100) NULL,
                        RentedCity NVARCHAR(100) NULL,
                        IsMetroCity BIT NOT NULL DEFAULT 0,
                        HomeLoanInterest DECIMAL(12,2) NOT NULL DEFAULT 0,
                        PreviousEmployerIncome DECIMAL(12,2) NOT NULL DEFAULT 0,
                        PreviousEmployerTds DECIMAL(12,2) NOT NULL DEFAULT 0,
                        ProofStatus INT NOT NULL DEFAULT 0,
                        ProofSubmittedAt DATETIME2 NULL,
                        VerifiedBy UNIQUEIDENTIFIER NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                -- BankDisbursementRecords
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BankDisbursementRecords')
                BEGIN
                    CREATE TABLE BankDisbursementRecords (
                        DisbursementId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        PayrollRunId UNIQUEIDENTIFIER NOT NULL,
                        EmployeeId UNIQUEIDENTIFIER NOT NULL,
                        BankAccountNo NVARCHAR(30) NOT NULL,
                        IfscCode NVARCHAR(15) NOT NULL,
                        BankName NVARCHAR(100) NOT NULL,
                        Amount DECIMAL(12,2) NOT NULL,
                        PaymentMode INT NOT NULL DEFAULT 0,
                        Status INT NOT NULL DEFAULT 0,
                        TxnRefNo NVARCHAR(80) NULL,
                        CreditedAt DATETIME2 NULL,
                        FailureReason NVARCHAR(500) NULL,
                        IsOnHold BIT NOT NULL DEFAULT 0,
                        HoldReason NVARCHAR(500) NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                -- PayrollDocuments
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PayrollDocuments')
                BEGIN
                    CREATE TABLE PayrollDocuments (
                        DocumentId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        EmployeeId UNIQUEIDENTIFIER NOT NULL,
                        CompanyId UNIQUEIDENTIFIER NULL,
                        DocumentType INT NOT NULL,
                        Period NVARCHAR(20) NOT NULL,
                        FilePath NVARCHAR(1000) NULL,
                        FileName NVARCHAR(200) NULL,
                        FileSizeBytes BIGINT NULL,
                        GeneratedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        IsDelivered BIT NOT NULL DEFAULT 0,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                -- SectorPayrollConfigs
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SectorPayrollConfigs')
                BEGIN
                    CREATE TABLE SectorPayrollConfigs (
                        ConfigId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        CompanyId UNIQUEIDENTIFIER NOT NULL,
                        Sector INT NOT NULL DEFAULT 0,
                        OvertimeEnabled BIT NOT NULL DEFAULT 0,
                        OvertimeMultiplier DECIMAL(4,2) NOT NULL DEFAULT 2.0,
                        PieceRateEnabled BIT NOT NULL DEFAULT 0,
                        IncentivePayout BIT NOT NULL DEFAULT 0,
                        ESOPEnabled BIT NOT NULL DEFAULT 0,
                        OnCallAllowanceEnabled BIT NOT NULL DEFAULT 0,
                        TripBasedPayEnabled BIT NOT NULL DEFAULT 0,
                        PayMonths INT NOT NULL DEFAULT 12,
                        CustomConfigJson NVARCHAR(MAX) NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                -- VariablePayInputs
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VariablePayInputs')
                BEGIN
                    CREATE TABLE VariablePayInputs (
                        InputId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        PayrollRunId UNIQUEIDENTIFIER NOT NULL,
                        EmployeeId UNIQUEIDENTIFIER NOT NULL,
                        InputType NVARCHAR(50) NOT NULL,
                        Amount DECIMAL(12,2) NOT NULL,
                        Remarks NVARCHAR(500) NULL,
                        SubmittedBy UNIQUEIDENTIFIER NOT NULL,
                        IsApproved BIT NOT NULL DEFAULT 0,
                        ApprovedBy UNIQUEIDENTIFIER NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL,
                        CreatedBy UNIQUEIDENTIFIER NULL,
                        UpdatedBy UNIQUEIDENTIFIER NULL
                    );
                END;

                -- Extend PayrollRuns table with new columns
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayrollRuns') AND name = 'RunType')
                BEGIN
                    ALTER TABLE PayrollRuns ADD RunType INT NOT NULL DEFAULT 0;
                END;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayrollRuns') AND name = 'LockedAt')
                BEGIN
                    ALTER TABLE PayrollRuns ADD LockedAt DATETIME2 NULL;
                END;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayrollRuns') AND name = 'LockedBy')
                BEGIN
                    ALTER TABLE PayrollRuns ADD LockedBy UNIQUEIDENTIFIER NULL;
                END;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayrollRuns') AND name = 'TotalCTC')
                BEGIN
                    ALTER TABLE PayrollRuns ADD TotalCTC DECIMAL(16,2) NOT NULL DEFAULT 0;
                END;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayrollRuns') AND name = 'Notes')
                BEGIN
                    ALTER TABLE PayrollRuns ADD Notes NVARCHAR(MAX) NULL;
                END;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayrollRuns') AND name = 'AttendanceFrozen')
                BEGIN
                    ALTER TABLE PayrollRuns ADD AttendanceFrozen BIT NOT NULL DEFAULT 0;
                END;
            ");
        }
        catch { }

        if (await context.Companies.AnyAsync())
        {
            return;
        }

        // 1. Ensure Company exists
        var company = await context.Companies.FirstOrDefaultAsync();
        if (company == null)
        {
            company = new Company
            {
                CompanyId = Guid.NewGuid(),
                CompanyName = "Acme Technologies Pvt Ltd",
                CIN = "U72900MH2024PTC000001",
                PAN = "AABCA1234A",
                TAN = "MUMA00001A",
                RegisteredAddress = "123 Business Park, Andheri East",
                City = "Mumbai",
                State = "Maharashtra",
                Pincode = "400069",
                Website = "https://acme.example.com",
                Phone = "+91-22-12345678",
                Email = "hr@acme.example.com",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();
        }

        // Clean all dummy/transactional/previous entities to guarantee a small clean testing state
        context.PayrollComponentValues.RemoveRange(await context.PayrollComponentValues.ToListAsync());
        context.PayrollDetails.RemoveRange(await context.PayrollDetails.ToListAsync());
        context.PayrollRuns.RemoveRange(await context.PayrollRuns.ToListAsync());
        context.TaxDeclarations.RemoveRange(await context.TaxDeclarations.ToListAsync());
        context.EmployeeSalaries.RemoveRange(await context.EmployeeSalaries.ToListAsync());
        context.StructureComponents.RemoveRange(await context.StructureComponents.ToListAsync());
        context.SalaryStructures.RemoveRange(await context.SalaryStructures.ToListAsync());
        context.SalaryComponents.RemoveRange(await context.SalaryComponents.ToListAsync());

        context.LeaveApplications.RemoveRange(await context.LeaveApplications.ToListAsync());
        context.LeaveBalances.RemoveRange(await context.LeaveBalances.ToListAsync());
        context.LeaveTypes.RemoveRange(await context.LeaveTypes.ToListAsync());
        context.AttendanceRegularizations.RemoveRange(await context.AttendanceRegularizations.ToListAsync());
        context.AttendanceRecords.RemoveRange(await context.AttendanceRecords.ToListAsync());

        context.ProbationReviews.RemoveRange(await context.ProbationReviews.ToListAsync());
        context.OnboardingTasks.RemoveRange(await context.OnboardingTasks.ToListAsync());
        context.OnboardingProcesses.RemoveRange(await context.OnboardingProcesses.ToListAsync());
        context.BGVRecords.RemoveRange(await context.BGVRecords.ToListAsync());
        context.OfferLetters.RemoveRange(await context.OfferLetters.ToListAsync());
        context.InterviewRoundPanelists.RemoveRange(await context.InterviewRoundPanelists.ToListAsync());
        context.InterviewRounds.RemoveRange(await context.InterviewRounds.ToListAsync());
        context.JobApplications.RemoveRange(await context.JobApplications.ToListAsync());
        context.Candidates.RemoveRange(await context.Candidates.ToListAsync());
        context.JobPostings.RemoveRange(await context.JobPostings.ToListAsync());
        context.JobRequisitions.RemoveRange(await context.JobRequisitions.ToListAsync());
        context.RequisitionAuditTrails.RemoveRange(await context.RequisitionAuditTrails.ToListAsync());
        context.ApprovalWorkflowConfigs.RemoveRange(await context.ApprovalWorkflowConfigs.ToListAsync());

        context.UserRoles.RemoveRange(await context.UserRoles.ToListAsync());
        context.Users.RemoveRange(await context.Users.ToListAsync());

        // Nullify circular references (HODEmployeeId) to allow deletion of Employees and Departments
        var deptsToClear = await context.Departments.ToListAsync();
        foreach (var d in deptsToClear)
        {
            d.HODEmployeeId = null;
        }
        await context.SaveChangesAsync();

        context.Employees.RemoveRange(await context.Employees.ToListAsync());
        context.Departments.RemoveRange(deptsToClear);
        context.Designations.RemoveRange(await context.Designations.ToListAsync());
        await context.SaveChangesAsync();

        // 2. Ensure Location exists
        var location = await context.Locations.FirstOrDefaultAsync(l => l.CompanyId == company.CompanyId);
        if (location == null)
        {
            location = new Location
            {
                LocationId = Guid.NewGuid(),
                CompanyId = company.CompanyId,
                LocationName = "Mumbai Head Office",
                Address = "123 Business Park, Andheri East",
                City = "Mumbai",
                State = "Maharashtra",
                Pincode = "400069",
                IsHeadOffice = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Locations.Add(location);
            await context.SaveChangesAsync();
        }

        // Seed Cost Centers
        var costCenter = await context.CostCenters.FirstOrDefaultAsync(c => c.CompanyId == company.CompanyId);
        if (costCenter == null)
        {
            context.CostCenters.Add(new CostCenter { CompanyId = company.CompanyId, CostCenterName = "R&D Cost Center", CostCenterCode = "CC01", IsActive = true, CreatedAt = DateTime.UtcNow });
            context.CostCenters.Add(new CostCenter { CompanyId = company.CompanyId, CostCenterName = "Operations Cost Center", CostCenterCode = "CC02", IsActive = true, CreatedAt = DateTime.UtcNow });
            await context.SaveChangesAsync();
        }

        // Seed Shifts
        var shift = await context.ShiftMasters.FirstOrDefaultAsync(s => s.CompanyId == company.CompanyId);
        if (shift == null)
        {
            context.ShiftMasters.Add(new ShiftMaster { CompanyId = company.CompanyId, ShiftName = "General Shift", ShiftCode = "GEN", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(18, 0), GracePeriodMins = 15, IsNightShift = false, WeeklyOffDays = "Saturday,Sunday", IsActive = true, CreatedAt = DateTime.UtcNow });
            await context.SaveChangesAsync();
        }

        // Seed Business Units & Divisions
        var businessUnit = await context.BusinessUnits.FirstOrDefaultAsync(b => b.CompanyId == company.CompanyId);
        if (businessUnit == null)
        {
            businessUnit = new BusinessUnit { CompanyId = company.CompanyId, Name = "Product Development", Code = "BU01", IsActive = true, CreatedAt = DateTime.UtcNow };
            context.BusinessUnits.Add(businessUnit);
            await context.SaveChangesAsync();
        }

        var division = await context.Divisions.FirstOrDefaultAsync();
        if (division == null)
        {
            context.Divisions.Add(new Division { BusinessUnitId = businessUnit.BusinessUnitId, Name = "Core Engineering", Code = "DIV01", IsActive = true, CreatedAt = DateTime.UtcNow });
            await context.SaveChangesAsync();
        }

        // Seed Grades & Bands
        var grade = await context.GradeMasters.FirstOrDefaultAsync(g => g.CompanyId == company.CompanyId);
        if (grade == null)
        {
            context.GradeMasters.AddRange(new List<GradeMaster>
            {
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade Executive", Code = "EXEC", NoticePeriodDays = 90, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade Manager", Code = "M1", NoticePeriodDays = 60, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade Senior IC", Code = "A", NoticePeriodDays = 45, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade Associate", Code = "B", NoticePeriodDays = 30, IsActive = true, CreatedAt = DateTime.UtcNow }
            });
            await context.SaveChangesAsync();
        }

        var band = await context.BandMasters.FirstOrDefaultAsync(b => b.CompanyId == company.CompanyId);
        if (band == null)
        {
            context.BandMasters.AddRange(new List<BandMaster>
            {
                new BandMaster { CompanyId = company.CompanyId, Name = "Individual Contributor", Code = "IC", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Manager", Code = "MGR", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Leadership", Code = "EXEC", IsActive = true, CreatedAt = DateTime.UtcNow }
            });
            await context.SaveChangesAsync();
        }

        var jobFamily = await context.JobFamilies.FirstOrDefaultAsync(j => j.CompanyId == company.CompanyId);
        if (jobFamily == null)
        {
            jobFamily = new JobFamily { CompanyId = company.CompanyId, Name = "Technology", Code = "TECH", IsActive = true, CreatedAt = DateTime.UtcNow };
            context.JobFamilies.Add(jobFamily);
            await context.SaveChangesAsync();
        }

        // 3. Ensure Roles exist
        var requiredRoles = new List<(string Code, string Name, string Desc)>
        {
            (RoleCodes.SuperAdmin, "Super Admin", "Full access to all modules and configurations."),
            (RoleCodes.HRAdmin, "HR Admin", "Full access to HR operations."),
            (RoleCodes.HRManager, "HR Manager", "Manage HR processes and approvals."),
            (RoleCodes.HRExecutive, "HR Executive", "Create & edit employees."),
            (RoleCodes.PayrollAdmin, "Payroll Admin", "Process payroll, salary, banking, tax."),
            (RoleCodes.RecruitmentManager, "Recruitment Manager", "Manage recruitment and offers."),
            (RoleCodes.ReportingManager, "Reporting Manager", "View and approve direct reports only."),
            (RoleCodes.DeptManager, "Department Manager", "Manage team attendance, leaves, and appraisals."),
            (RoleCodes.Employee, "Employee", "Standard employee self-service access."),
            (RoleCodes.ITAdmin, "IT Admin", "Manage users and system settings."),
            (RoleCodes.CEO, "CEO", "Chief Executive Officer."),
            (RoleCodes.COO, "COO", "Chief Operating Officer."),
            (RoleCodes.FinanceHead, "Finance Head", "Head of Finance & Accounts department.")
        };

        var dbRoles = await context.Roles.ToListAsync();
        foreach (var rInfo in requiredRoles)
        {
            if (!dbRoles.Any(r => r.RoleCode == rInfo.Code))
            {
                var newRole = new Role
                {
                    RoleId = Guid.NewGuid(),
                    RoleCode = rInfo.Code,
                    RoleName = rInfo.Name,
                    Description = rInfo.Desc,
                    IsSystem = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Roles.Add(newRole);
                dbRoles.Add(newRole);
            }
        }
        await context.SaveChangesAsync();

        // 4. Seed 5 Core Departments
        var deptsToSeed = new List<(string Code, string Name)>
        {
            ("HR", "Human Resources"),
            ("FIN", "Finance & Accounts"),
            ("ENG", "Product Engineering"),
            ("OPS", "Operations"),
            ("SALES", "Sales & Marketing")
        };

        var dbDepts = new List<Department>();
        foreach (var dInfo in deptsToSeed)
        {
            var newDept = new Department
            {
                DeptId = Guid.NewGuid(),
                CompanyId = company.CompanyId,
                DeptCode = dInfo.Code,
                DeptName = dInfo.Name,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Departments.Add(newDept);
            dbDepts.Add(newDept);
        }
        await context.SaveChangesAsync();

        // 5. Seed Designation Titles
        var designations = new Dictionary<string, string>
        {
            { "CEO", "Chief Executive Officer" },
            { "COO", "Chief Operating Officer" },
            { "HR_HEAD", "Head of HR" },
            { "HR_EXEC", "HR Executive" },
            { "FIN_HEAD", "Head of Finance" },
            { "FIN_ACCT", "Senior Accountant" },
            { "ENG_HOD", "Head of Engineering" },
            { "TECH_LEAD", "Tech Lead" },
            { "SWE", "Software Engineer" },
            { "QA", "QA Automation Engineer" },
            { "SALES_MGR", "Sales Manager" }
        };
        var dbDesigs = new List<Designation>();
        foreach (var kvp in designations)
        {
            var newDesig = new Designation
            {
                DesignationId = Guid.NewGuid(),
                CompanyId = company.CompanyId,
                Title = kvp.Value,
                Grade = kvp.Key,
                MinBasic = 30000,
                MaxBasic = 250000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Designations.Add(newDesig);
            dbDesigs.Add(newDesig);
        }
        await context.SaveChangesAsync();

        // 6. Seed EXACTLY 12 Employees and User accounts
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123", 12);
        var dbGrades = await context.GradeMasters.ToListAsync();
        var dbBands = await context.BandMasters.ToListAsync();
        var dbShifts = await context.ShiftMasters.ToListAsync();
        var dbCostCenters = await context.CostCenters.ToListAsync();
        var dbBusinessUnits = await context.BusinessUnits.ToListAsync();

        var locationId = location.LocationId;
        var compId = company.CompanyId;

        var empDefinitions = new List<(string Username, string RoleCode, string EmpCode, string Email, string FirstName, string LastName, string DeptCode, string DesigTitle)>
        {
            ("admin@company.com", RoleCodes.SuperAdmin, "EMP0001", "admin@company.com", "System", "Admin", "HR", "Chief Executive Officer"),
            ("coo@company.com", RoleCodes.COO, "EMP0002", "coo@company.com", "Rohan", "Varma", "OPS", "Chief Operating Officer"),
            ("hradmin@company.com", RoleCodes.HRAdmin, "EMP0003", "hradmin@company.com", "Sneha", "Kulkarni", "HR", "Head of HR"),
            ("finance@company.com", RoleCodes.FinanceHead, "EMP0004", "finance@company.com", "Aditya", "Sharma", "FIN", "Head of Finance"),
            ("enghod@company.com", RoleCodes.DeptManager, "EMP0005", "enghod@company.com", "Rajesh", "Patel", "ENG", "Head of Engineering"),
            ("techlead@company.com", RoleCodes.DeptManager, "EMP0006", "techlead@company.com", "Vikram", "Malhotra", "ENG", "Tech Lead"),
            ("emp1@company.com", RoleCodes.Employee, "EMP0007", "emp1@company.com", "Amit", "Kumar", "ENG", "Software Engineer"),
            ("emp2@company.com", RoleCodes.Employee, "EMP0008", "emp2@company.com", "Sumit", "Roy", "ENG", "Software Engineer"),
            ("emp3@company.com", RoleCodes.Employee, "EMP0009", "emp3@company.com", "Karan", "Mehta", "ENG", "QA Automation Engineer"),
            ("hrexec@company.com", RoleCodes.HRExecutive, "EMP0010", "hrexec@company.com", "Neha", "Gupta", "HR", "HR Executive"),
            ("finaccount@company.com", RoleCodes.Employee, "EMP0011", "finaccount@company.com", "Priya", "Nair", "FIN", "Senior Accountant"),
            ("salesmgr@company.com", RoleCodes.DeptManager, "EMP0012", "salesmgr@company.com", "Rahul", "Verma", "SALES", "Sales Manager")
        };

        var employeeDict = new Dictionary<string, Employee>();
        int idx = 0;
        foreach (var def in empDefinitions)
        {
            var dept = dbDepts.First(d => d.DeptCode == def.DeptCode);
            var desig = dbDesigs.First(d => d.Title == def.DesigTitle);

            var emp = new Employee
            {
                EmployeeId = Guid.NewGuid(),
                CompanyId = compId,
                EmployeeCode = def.EmpCode,
                FirstName = def.FirstName,
                LastName = def.LastName,
                OfficialEmail = def.Email,
                PersonalEmail = def.Email.Replace("@company.com", "@gmail.com"),
                PersonalPhone = $"+91-99887766{idx:D2}",
                DeptId = dept.DeptId,
                DesignationId = desig.DesignationId,
                LocationId = locationId,
                JoiningDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(- (6 + idx))),
                EmploymentType = EmploymentType.FullTime,
                EmploymentStatus = EmploymentStatus.Active,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                GradeId = dbGrades[idx % dbGrades.Count].GradeId,
                BandId = dbBands[idx % dbBands.Count].BandId,
                ShiftId = dbShifts[0].ShiftId,
                CostCenterId = dbCostCenters[0].CostCenterId,
                BusinessUnitId = dbBusinessUnits[0].BusinessUnitId
            };

            context.Employees.Add(emp);
            employeeDict.Add(def.Email, emp);

            var user = new User
            {
                UserId = Guid.NewGuid(),
                EmployeeId = emp.EmployeeId,
                Username = def.Email,
                Email = def.Email,
                FirstName = def.FirstName,
                LastName = def.LastName,
                PasswordHash = passwordHash,
                PasswordSalt = string.Empty,
                IsActive = true,
                IsLocked = false,
                FailedLoginCount = 0,
                MustChangePassword = false,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);

            var roleObj = dbRoles.First(r => r.RoleCode == def.RoleCode);
            context.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = roleObj.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            idx++;
        }
        await context.SaveChangesAsync();

        // 7. Establish Clean Reporting Hierarchy
        var ceo = employeeDict["admin@company.com"];
        var coo = employeeDict["coo@company.com"];
        var hrAdmin = employeeDict["hradmin@company.com"];
        var financeHead = employeeDict["finance@company.com"];
        var engHod = employeeDict["enghod@company.com"];
        var techLead = employeeDict["techlead@company.com"];
        var emp1 = employeeDict["emp1@company.com"];
        var emp2 = employeeDict["emp2@company.com"];
        var emp3 = employeeDict["emp3@company.com"];
        var hrExec = employeeDict["hrexec@company.com"];
        var finAccountant = employeeDict["finaccount@company.com"];
        var salesMgr = employeeDict["salesmgr@company.com"];

        coo.ReportingManagerId = ceo.EmployeeId;
        hrAdmin.ReportingManagerId = coo.EmployeeId;
        financeHead.ReportingManagerId = coo.EmployeeId;
        engHod.ReportingManagerId = coo.EmployeeId;
        salesMgr.ReportingManagerId = coo.EmployeeId;

        techLead.ReportingManagerId = engHod.EmployeeId;
        emp1.ReportingManagerId = techLead.EmployeeId;
        emp2.ReportingManagerId = techLead.EmployeeId;
        emp3.ReportingManagerId = techLead.EmployeeId;

        hrExec.ReportingManagerId = hrAdmin.EmployeeId;
        finAccountant.ReportingManagerId = financeHead.EmployeeId;

        // Set HOD Employee IDs to Departments
        dbDepts.First(d => d.DeptCode == "HR").HODEmployeeId = hrAdmin.EmployeeId;
        dbDepts.First(d => d.DeptCode == "FIN").HODEmployeeId = financeHead.EmployeeId;
        dbDepts.First(d => d.DeptCode == "ENG").HODEmployeeId = engHod.EmployeeId;
        dbDepts.First(d => d.DeptCode == "OPS").HODEmployeeId = coo.EmployeeId;
        dbDepts.First(d => d.DeptCode == "SALES").HODEmployeeId = salesMgr.EmployeeId;

        await context.SaveChangesAsync();

        // 8. Seed Role Permissions
        var allPermissions = await context.Permissions.ToListAsync();
        var currentRolePermissions = await context.RolePermissions.ToListAsync();

        var newRolePermissions = new Dictionary<string, List<string>>
        {
            [RoleCodes.HRAdmin] = allPermissions.Select(p => p.PermissionCode).ToList(),
            [RoleCodes.COO] = allPermissions.Where(p => p.PermissionCode.StartsWith("RECRUITMENT.") || p.PermissionCode.StartsWith("EMPLOYEE.VIEW")).Select(p => p.PermissionCode).ToList(),
            [RoleCodes.FinanceHead] = allPermissions.Where(p => p.PermissionCode.StartsWith("PAYROLL.") || p.PermissionCode.StartsWith("COMPLIANCE.") || p.PermissionCode.StartsWith("RECRUITMENT.")).Select(p => p.PermissionCode).ToList(),
            [RoleCodes.DeptManager] = allPermissions.Where(p => 
                p.PermissionCode.StartsWith("RECRUITMENT.CREATE") || 
                p.PermissionCode.StartsWith("RECRUITMENT.EDIT") || 
                p.PermissionCode.StartsWith("RECRUITMENT.VIEW") || 
                p.PermissionCode.StartsWith("EMPLOYEE.VIEW") || 
                p.PermissionCode.StartsWith("ATTENDANCE.") || 
                p.PermissionCode.StartsWith("LEAVE.") || 
                p.PermissionCode.StartsWith("PERFORMANCE.")).Select(p => p.PermissionCode).ToList()
        };

        foreach (var mapping in newRolePermissions)
        {
            var roleObj = dbRoles.First(r => r.RoleCode == mapping.Key);
            foreach (var permCode in mapping.Value)
            {
                var permObj = allPermissions.FirstOrDefault(p => p.PermissionCode == permCode);
                if (permObj == null) continue;

                var exists = currentRolePermissions.Any(rp => rp.RoleId == roleObj.RoleId && rp.PermissionId == permObj.PermissionId);
                if (!exists)
                {
                    context.RolePermissions.Add(new RolePermission
                    {
                        RolePermissionId = Guid.NewGuid(),
                        RoleId = roleObj.RoleId,
                        PermissionId = permObj.PermissionId
                    });
                }
            }
        }
        await context.SaveChangesAsync();

        // 9. Seed Approval Workflow Configuration
        var approversList = new List<object>
        {
            new { Sequence = 1, RoleCode = RoleCodes.COO, Status = "PendingCOO" },
            new { Sequence = 2, RoleCode = RoleCodes.HRAdmin, Status = "PendingHR" },
            new { Sequence = 3, RoleCode = RoleCodes.FinanceHead, Status = "PendingFinance" }
        };

        var config = new ApprovalWorkflowConfig
        {
            ConfigId = Guid.NewGuid(),
            CompanyId = compId,
            ApproverRolesJson = System.Text.Json.JsonSerializer.Serialize(approversList)
        };
        context.ApprovalWorkflowConfigs.Add(config);

        // Seed Leave Types
        var elType = new LeaveType { CompanyId = compId, LeaveTypeName = "Earned Leave", LeaveCode = "EL", MaxDaysPerYear = 18, MaxDaysPerApplication = 10, IsCarryForward = true, MaxCarryForwardDays = 30, IsEncashable = true, IsPaidLeave = true, ApplicableGender = "All", MinServiceDaysRequired = 0, IsActive = true, CreatedAt = DateTime.UtcNow };
        var slType = new LeaveType { CompanyId = compId, LeaveTypeName = "Sick Leave", LeaveCode = "SL", MaxDaysPerYear = 12, MaxDaysPerApplication = 5, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, IsPaidLeave = true, ApplicableGender = "All", MinServiceDaysRequired = 0, IsActive = true, CreatedAt = DateTime.UtcNow };
        
        context.LeaveTypes.AddRange(elType, slType);
        await context.SaveChangesAsync();

        // Seed Leave Balances & Applications for all employees
        var currentYear = 2026;
        var employees = await context.Employees.ToListAsync();
        var hrAdminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "hradmin@company.com");

        foreach (var emp in employees)
        {
            context.LeaveBalances.Add(new LeaveBalance { EmployeeId = emp.EmployeeId, LeaveTypeId = elType.LeaveTypeId, Year = currentYear, OpeningBalance = 15, Accrued = 3, Taken = 2, Encashed = 0, Lapsed = 0, ClosingBalance = 16, CreatedAt = DateTime.UtcNow });
            context.LeaveBalances.Add(new LeaveBalance { EmployeeId = emp.EmployeeId, LeaveTypeId = slType.LeaveTypeId, Year = currentYear, OpeningBalance = 10, Accrued = 2, Taken = 1, Encashed = 0, Lapsed = 0, ClosingBalance = 11, CreatedAt = DateTime.UtcNow });
        }
        await context.SaveChangesAsync();

        // Seed Sample Leave Applications
        context.LeaveApplications.Add(new LeaveApplication
        {
            LeaveAppId = Guid.NewGuid(),
            EmployeeId = emp1.EmployeeId,
            LeaveTypeId = elType.LeaveTypeId,
            FromDate = new DateOnly(2026, 7, 28),
            ToDate = new DateOnly(2026, 7, 29),
            TotalDays = 2,
            IsHalfDay = false,
            Reason = "Personal work at hometown",
            Status = LeaveStatus.Pending,
            AppliedAt = DateTime.UtcNow.AddDays(-1)
        });

        context.LeaveApplications.Add(new LeaveApplication
        {
            LeaveAppId = Guid.NewGuid(),
            EmployeeId = emp2.EmployeeId,
            LeaveTypeId = slType.LeaveTypeId,
            FromDate = new DateOnly(2026, 7, 10),
            ToDate = new DateOnly(2026, 7, 10),
            TotalDays = 1,
            IsHalfDay = false,
            Reason = "Mild fever & rest",
            Status = LeaveStatus.Approved,
            AppliedAt = DateTime.UtcNow.AddDays(-18),
            ApproverId = hrAdminUser?.UserId,
            ApprovedAt = DateTime.UtcNow.AddDays(-17)
        });
        await context.SaveChangesAsync();

        // 10. Seed Attendance Records for July 2026
        var shiftId = dbShifts[0].ShiftId;
        for (int day = 1; day <= 24; day++)
        {
            var attDate = new DateOnly(2026, 7, day);
            var isWeekend = attDate.DayOfWeek == DayOfWeek.Saturday || attDate.DayOfWeek == DayOfWeek.Sunday;

            foreach (var emp in employees)
            {
                if (isWeekend)
                {
                    context.AttendanceRecords.Add(new AttendanceRecord
                    {
                        AttendanceId = Guid.NewGuid(),
                        EmployeeId = emp.EmployeeId,
                        AttendanceDate = attDate,
                        Status = AttendanceStatus.WeeklyOff,
                        WorkingHours = 0,
                        OvertimeHours = 0,
                        Source = AttendanceSource.SystemGenerated,
                        ShiftId = shiftId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    bool isLate = day == 12 || day == 19;
                    bool isOvertime = day == 8 || day == 22;

                    var checkIn = new DateTime(2026, 7, day, isLate ? 9 : 8, isLate ? 45 : 55, 0);
                    var checkOut = new DateTime(2026, 7, day, isOvertime ? 19 : 18, isOvertime ? 30 : 0, 0);
                    decimal workHours = isLate ? (decimal)7.25 : (isOvertime ? (decimal)9.5 : (decimal)8.5);
                    decimal otHours = isOvertime ? (decimal)1.5 : 0;

                    context.AttendanceRecords.Add(new AttendanceRecord
                    {
                        AttendanceId = Guid.NewGuid(),
                        EmployeeId = emp.EmployeeId,
                        AttendanceDate = attDate,
                        CheckIn = checkIn,
                        CheckOut = checkOut,
                        WorkingHours = workHours,
                        OvertimeHours = otHours,
                        Status = isLate ? AttendanceStatus.LatePresent : AttendanceStatus.Present,
                        Source = AttendanceSource.Biometric,
                        ShiftId = shiftId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }
        await context.SaveChangesAsync();

        // Seed Regularization Request
        context.AttendanceRegularizations.Add(new AttendanceRegularization
        {
            RegId = Guid.NewGuid(),
            EmployeeId = emp1.EmployeeId,
            AttendanceDate = new DateOnly(2026, 7, 14),
            Reason = "Forgot biometric ID card at entrance desk",
            RequestedCheckIn = new DateTime(2026, 7, 14, 9, 0, 0),
            RequestedCheckOut = new DateTime(2026, 7, 14, 18, 0, 0),
            Status = "Pending"
        });
        await context.SaveChangesAsync();

        // 11. Seed Recruitment Pipeline (Requisitions, Job Postings, Candidates, Applications, Offers)
        var engDept = dbDepts.First(d => d.DeptCode == "ENG");
        var hrDept = dbDepts.First(d => d.DeptCode == "HR");
        var finDept = dbDepts.First(d => d.DeptCode == "FIN");

        var sweDesig = dbDesigs.First(d => d.Title == "Software Engineer");
        var hrExecDesig = dbDesigs.First(d => d.Title == "HR Executive");
        var finAcctDesig = dbDesigs.First(d => d.Title == "Senior Accountant");

        var req1 = new JobRequisition
        {
            ReqId = Guid.NewGuid(),
            CompanyId = compId,
            DeptId = engDept.DeptId,
            DesignationId = sweDesig.DesignationId,
            NoOfPositions = 3,
            JobTitle = "Senior Fullstack Developer (React & .NET)",
            JobDescription = "We are seeking an experienced Fullstack Engineer proficient in React, Tailwind, and C# ASP.NET Core REST APIs.",
            MinExperience = 4,
            MaxExperience = 7,
            MinSalary = 1200000,
            MaxSalary = 1800000,
            SkillsRequired = "React, C#, .NET Core, SQL Server, TypeScript",
            RequisitionDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-20)),
            TargetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            Status = RequisitionStatus.Approved,
            RaisedBy = engHod.User!.UserId,
            ApprovedBy = coo.User!.UserId,
            MrfNumber = "MRF-ENG-2026-001",
            Priority = "High",
            Justification = "Expanding core platform team for enterprise client requirements."
        };

        var req2 = new JobRequisition
        {
            ReqId = Guid.NewGuid(),
            CompanyId = compId,
            DeptId = hrDept.DeptId,
            DesignationId = hrExecDesig.DesignationId,
            NoOfPositions = 1,
            JobTitle = "HR Operations Specialist",
            JobDescription = "Manage employee onboarding, statutory compliance, and payroll verification.",
            MinExperience = 2,
            MaxExperience = 5,
            MinSalary = 600000,
            MaxSalary = 900000,
            SkillsRequired = "Onboarding, Employee Relations, Statutory Compliance",
            RequisitionDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            TargetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20)),
            Status = RequisitionStatus.PendingCOO,
            RaisedBy = hrAdmin.User!.UserId,
            MrfNumber = "MRF-HR-2026-002",
            Priority = "Normal",
            Justification = "Replacement for team member mobility."
        };

        var req3 = new JobRequisition
        {
            ReqId = Guid.NewGuid(),
            CompanyId = compId,
            DeptId = finDept.DeptId,
            DesignationId = finAcctDesig.DesignationId,
            NoOfPositions = 1,
            JobTitle = "Financial Analyst",
            JobDescription = "Conduct financial modeling, budget forecasting, and tax reconciliation.",
            MinExperience = 3,
            MaxExperience = 6,
            MinSalary = 800000,
            MaxSalary = 1200000,
            SkillsRequired = "Financial Modeling, Tally, Excel, Budgeting",
            RequisitionDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            TargetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(25)),
            Status = RequisitionStatus.Open,
            RaisedBy = financeHead.User!.UserId,
            MrfNumber = "MRF-FIN-2026-003",
            Priority = "Normal",
            Justification = "New headcount for expanded compliance division."
        };

        context.JobRequisitions.AddRange(req1, req2, req3);
        await context.SaveChangesAsync();

        // Job Posting
        var posting1 = new JobPosting
        {
            JobId = Guid.NewGuid(),
            ReqId = req1.ReqId,
            JobTitle = req1.JobTitle,
            JobDescription = req1.JobDescription,
            PostedAt = DateTime.UtcNow.AddDays(-15),
            ExpiryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            Status = JobPostingStatus.Published,
            WorkMode = "Hybrid",
            LocationName = "Mumbai Head Office",
            SkillsRequired = req1.SkillsRequired,
            ExperienceMin = 4,
            ExperienceMax = 7,
            ShowSalaryRange = true
        };
        context.JobPostings.Add(posting1);
        await context.SaveChangesAsync();

        // Candidates & Applications
        var cand1 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Aarav",
            LastName = "Sharma",
            Email = "aarav.sharma@example.com",
            Phone = "+91-9876543210",
            CurrentDesignation = "Senior Software Developer",
            CurrentCompany = "TechSys Solutions",
            TotalExperience = 5,
            CurrentCTC = 1100000,
            ExpectedCTC = 1500000,
            NoticePeriodDays = 30,
            Source = CandidateSource.LinkedIn,
            Skills = "React, C#, SQL Server",
            CandidateStatus = CandidateStatus.Active
        };

        var cand2 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Diya",
            LastName = "Sen",
            Email = "diya.sen@example.com",
            Phone = "+91-9811223344",
            CurrentDesignation = "Lead Engineer",
            CurrentCompany = "CloudNet Systems",
            TotalExperience = 6,
            CurrentCTC = 1250000,
            ExpectedCTC = 1600000,
            NoticePeriodDays = 15,
            Source = CandidateSource.EmployeeReferral,
            Skills = "React, .NET Core, Microservices",
            CandidateStatus = CandidateStatus.Active
        };

        context.Candidates.AddRange(cand1, cand2);
        await context.SaveChangesAsync();

        var app1 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            Requisition = req1,
            ReqId = req1.ReqId,
            Candidate = cand1,
            CandidateId = cand1.CandidateId,
            ApplicationDate = DateTime.UtcNow.AddDays(-12),
            CurrentStage = ApplicationStage.InterviewL1,
            AssignedRecruiterId = hrAdmin.User!.UserId,
            Status = "Active"
        };

        var app2 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            Requisition = req1,
            ReqId = req1.ReqId,
            Candidate = cand2,
            CandidateId = cand2.CandidateId,
            ApplicationDate = DateTime.UtcNow.AddDays(-14),
            CurrentStage = ApplicationStage.Offer,
            AssignedRecruiterId = hrAdmin.User!.UserId,
            Status = "Active"
        };

        context.JobApplications.AddRange(app1, app2);
        await context.SaveChangesAsync();

        // Interview Round for Candidate 1
        var round1 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            JobApplication = app1,
            AppId = app1.AppId,
            RoundName = "Technical L1 Evaluation",
            RoundType = "Technical",
            ScheduledAt = DateTime.UtcNow.AddDays(-2),
            DurationMinutes = 60,
            Interviewer = techLead,
            InterviewerId = techLead.EmployeeId,
            Venue = "Google Meet",
            MeetingLink = "https://meet.google.com/abc-defg-hij",
            Status = "Completed",
            Rating = (decimal)4.5,
            Feedback = "Demonstrated strong knowledge of C# async programming, Entity Framework Core, and React state management.",
            CompletedAt = DateTime.UtcNow.AddDays(-2)
        };
        context.InterviewRounds.Add(round1);
        await context.SaveChangesAsync();

        // Offer Letter for Candidate 2
        var offer1 = new OfferLetter
        {
            OfferId = Guid.NewGuid(),
            JobApplication = app2,
            AppId = app2.AppId,
            OfferedCTC = 1550000,
            JoiningDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
            OfferDate = DateTime.UtcNow.AddDays(-3),
            ExpiryDate = DateTime.UtcNow.AddDays(7),
            Status = OfferStatus.Accepted,
            AcceptedAt = DateTime.UtcNow.AddDays(-1)
        };
        context.OfferLetters.Add(offer1);
        await context.SaveChangesAsync();

        // 12. Seed Payroll Components, Structures & Disbursed Monthly Payslips (June & July 2026)
        var basicComponent = new SalaryComponent { ComponentId = Guid.NewGuid(), CompanyId = compId, ComponentName = "Basic Salary", ComponentCode = "BASIC", ComponentType = ComponentType.Earning, CalculationType = CalculationType.Fixed, IsTaxable = true, IsActive = true, CreatedAt = DateTime.UtcNow };
        var hraComponent = new SalaryComponent { ComponentId = Guid.NewGuid(), CompanyId = compId, ComponentName = "House Rent Allowance", ComponentCode = "HRA", ComponentType = ComponentType.Earning, CalculationType = CalculationType.Percentage, IsTaxable = true, IsActive = true, CreatedAt = DateTime.UtcNow };
        var splComponent = new SalaryComponent { ComponentId = Guid.NewGuid(), CompanyId = compId, ComponentName = "Special Allowance", ComponentCode = "SPL_ALLOW", ComponentType = ComponentType.Earning, CalculationType = CalculationType.Fixed, IsTaxable = true, IsActive = true, CreatedAt = DateTime.UtcNow };
        var pfComponent = new SalaryComponent { ComponentId = Guid.NewGuid(), CompanyId = compId, ComponentName = "Provident Fund", ComponentCode = "PF_EMP", ComponentType = ComponentType.Deduction, CalculationType = CalculationType.Percentage, IsStatutory = true, IsActive = true, CreatedAt = DateTime.UtcNow };
        var ptComponent = new SalaryComponent { ComponentId = Guid.NewGuid(), CompanyId = compId, ComponentName = "Professional Tax", ComponentCode = "PT", ComponentType = ComponentType.Deduction, CalculationType = CalculationType.Fixed, IsStatutory = true, IsActive = true, CreatedAt = DateTime.UtcNow };

        context.SalaryComponents.AddRange(basicComponent, hraComponent, splComponent, pfComponent, ptComponent);
        await context.SaveChangesAsync();

        var stdStructure = new SalaryStructure
        {
            StructureId = Guid.NewGuid(),
            CompanyId = compId,
            StructureName = "Standard Executive CTC Structure",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            IsActive = true
        };
        context.SalaryStructures.Add(stdStructure);
        await context.SaveChangesAsync();

        // Assign Employee Salary CTCs
        var salaryMap = new Dictionary<string, decimal>
        {
            { "admin@company.com", 300000 },
            { "coo@company.com", 250000 },
            { "hradmin@company.com", 180000 },
            { "finance@company.com", 180000 },
            { "enghod@company.com", 200000 },
            { "techlead@company.com", 140000 },
            { "emp1@company.com", 90000 },
            { "emp2@company.com", 85000 },
            { "emp3@company.com", 75000 },
            { "hrexec@company.com", 60000 },
            { "finaccount@company.com", 65000 },
            { "salesmgr@company.com", 120000 }
        };

        foreach (var kvp in salaryMap)
        {
            var empObj = employeeDict[kvp.Key];
            context.EmployeeSalaries.Add(new EmployeeSalary
            {
                EmpSalaryId = Guid.NewGuid(),
                EmployeeId = empObj.EmployeeId,
                StructureId = stdStructure.StructureId,
                GrossCTC = kvp.Value * 12,
                BasicSalary = kvp.Value * (decimal)0.5,
                EffectiveFrom = new DateOnly(2026, 1, 1),
                IsActive = true
            });
        }
        await context.SaveChangesAsync();

        // Seed June 2026 Disbursed Payroll Run
        var financeUser = await context.Users.FirstAsync(u => u.Email == "finance@company.com");
        var runJune = new PayrollRun
        {
            PayrollRunId = Guid.NewGuid(),
            CompanyId = compId,
            Month = 6,
            Year = 2026,
            Status = PayrollStatus.Disbursed,
            ProcessedBy = financeUser.UserId,
            ProcessedByUser = financeUser,
            ApprovedBy = financeUser.UserId,
            ApprovedByUser = financeUser,
            ProcessedAt = new DateTime(2026, 6, 30),
            ApprovedAt = new DateTime(2026, 6, 30),
            DisbursedAt = new DateTime(2026, 6, 30),
            TotalEmployees = 12,
            TotalGross = salaryMap.Values.Sum(),
            TotalDeductions = salaryMap.Values.Sum() * (decimal)0.12,
            TotalNetPay = salaryMap.Values.Sum() * (decimal)0.88
        };
        context.PayrollRuns.Add(runJune);
        await context.SaveChangesAsync();

        foreach (var emp in employees)
        {
            var monthlyGross = salaryMap.Values.FirstOrDefault();
            var userEmail = empDefinitions.FirstOrDefault(d => d.EmpCode == emp.EmployeeCode).Email;
            if (userEmail != null && salaryMap.ContainsKey(userEmail))
                monthlyGross = salaryMap[userEmail];

            var basic = monthlyGross * (decimal)0.5;
            var pf = basic * (decimal)0.12;
            var pt = (decimal)200;
            var net = monthlyGross - pf - pt;

            context.PayrollDetails.Add(new PayrollDetail
            {
                DetailId = Guid.NewGuid(),
                PayrollRunId = runJune.PayrollRunId,
                EmployeeId = emp.EmployeeId,
                WorkingDays = 22,
                PaidDays = 22,
                LWPDays = 0,
                OvertimeHours = 0,
                GrossEarnings = monthlyGross,
                TotalDeductions = pf + pt,
                NetPay = net,
                PFEmployee = pf,
                ProfessionalTax = pt
            });
        }
        await context.SaveChangesAsync();

        // Seed Tax Declarations
        context.TaxDeclarations.Add(new TaxDeclaration
        {
            DeclarationId = Guid.NewGuid(),
            EmployeeId = emp1.EmployeeId,
            FinancialYear = "2026-2027",
            TaxRegime = TaxRegime.Old,
            Section80C = 150000,
            Section80D = 25000,
            HRA_Claimed = 120000,
            SubmittedAt = DateTime.UtcNow.AddDays(-30),
            IsApproved = true,
            ApprovedBy = financeUser.UserId
        });
        await context.SaveChangesAsync();

        // Seed DEFAULT_PASSWORD system setting
        var defaultPasswordSetting = await context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "DEFAULT_PASSWORD");
        if (defaultPasswordSetting == null)
        {
            context.SystemSettings.Add(new SystemSetting
            {
                SettingId = Guid.NewGuid(),
                CompanyId = compId,
                SettingKey = "DEFAULT_PASSWORD",
                SettingValue = "Demo@123",
                DataType = "string",
                Description = "Default initial password for new employees",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            defaultPasswordSetting.SettingValue = "Demo@123";
        }

        await context.SaveChangesAsync();
    }
}
