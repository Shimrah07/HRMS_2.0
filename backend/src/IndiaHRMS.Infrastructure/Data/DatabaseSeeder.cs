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

        // Clean recruitment pipeline data (candidates, interviews, offers, onboarding) on each restart.
        // NOTE: JobRequisitions (MRFs) are intentionally NOT wiped so user-created drafts survive restarts.
        context.ProbationReviews.RemoveRange(await context.ProbationReviews.ToListAsync());
        context.OnboardingTasks.RemoveRange(await context.OnboardingTasks.ToListAsync());
        context.OnboardingProcesses.RemoveRange(await context.OnboardingProcesses.ToListAsync());
        context.BGVRecords.RemoveRange(await context.BGVRecords.ToListAsync());
        context.OfferLetters.RemoveRange(await context.OfferLetters.ToListAsync());
        context.InterviewRoundPanelists.RemoveRange(await context.InterviewRoundPanelists.ToListAsync());
        context.InterviewRounds.RemoveRange(await context.InterviewRounds.ToListAsync());
        context.JobApplications.RemoveRange(await context.JobApplications.ToListAsync());
        context.Candidates.RemoveRange(await context.Candidates.ToListAsync());
        await context.SaveChangesAsync();

        // Seed development demo data for Interview, Offer, BGV & Onboarding Modules
        await SeedInterviewDemoDataAsync(context);
        await SeedOfferDemoDataAsync(context);
        await SeedBgvDemoDataAsync(context);
        await SeedOnboardingDemoDataAsync(context);
        // JobPostings, JobRequisitions, and RequisitionAuditTrails are preserved across restarts
        // so user-created MRF drafts and submissions survive.
        // We also ensure dynamic approval workflow configuration is seeded if missing.
        var configExists = await context.ApprovalWorkflowConfigs.AnyAsync();
        if (!configExists)
        {
            var companyConfig = await context.Companies.FirstOrDefaultAsync();
            if (companyConfig != null)
            {
                var approversList = new List<object>
                {
                    new { Sequence = 1, RoleCode = "DEPT_MANAGER", Status = "PendingHOD" },
                    new { Sequence = 2, RoleCode = "COO", Status = "PendingCOO" },
                    new { Sequence = 3, RoleCode = "HR_ADMIN", Status = "PendingHR" },
                    new { Sequence = 4, RoleCode = "FINANCE_HEAD", Status = "PendingFinance" }
                };

                var config = new ApprovalWorkflowConfig
                {
                    ConfigId = Guid.NewGuid(),
                    CompanyId = companyConfig.CompanyId,
                    ApproverRolesJson = System.Text.Json.JsonSerializer.Serialize(approversList)
                };
                context.ApprovalWorkflowConfigs.Add(config);
                await context.SaveChangesAsync();
            }
        }
        
        var hasSeededData = await context.Users.AnyAsync();
        if (!hasSeededData)
        {
            // Seed Grades & Bands
            context.GradeMasters.AddRange(new List<GradeMaster>
            {
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade G1", Code = "G1", NoticePeriodDays = 30, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade G2", Code = "G2", NoticePeriodDays = 30, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade G3", Code = "G3", NoticePeriodDays = 45, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade G4", Code = "G4", NoticePeriodDays = 60, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade G5", Code = "G5", NoticePeriodDays = 90, IsActive = true, CreatedAt = DateTime.UtcNow }
            });
            await context.SaveChangesAsync();

            context.BandMasters.AddRange(new List<BandMaster>
            {
                new BandMaster { CompanyId = company.CompanyId, Name = "Individual Contributor", Code = "IC", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Team Lead", Code = "TL", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Manager", Code = "MGR", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Senior Manager", Code = "SMGR", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Assistant General Manager", Code = "AGM", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "General Manager", Code = "GM", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Director", Code = "DIR", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Vice President", Code = "VP", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "COO", Code = "COO", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "CEO", Code = "CEO", IsActive = true, CreatedAt = DateTime.UtcNow }
            });
            await context.SaveChangesAsync();
        }

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

        if (!hasSeededData)
        {
            // 4. Seed EXACTLY 4 Departments
            var deptsToSeed = new List<(string Code, string Name)>
            {
                ("ENG", "Engineering"),
                ("HR", "Human Resources"),
                ("FIN", "Finance"),
                ("OPS", "Operations")
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
                { "SUPER_ADMIN", "Super Admin" },
                { "COO", "Chief Operating Officer" },
                { "HR_HEAD", "Head of HR" },
                { "FIN_HEAD", "Head of Finance" },
                { "ENG_HOD", "Head of Engineering" },
                { "SWE", "Software Engineer" },
                { "HR_EXEC", "HR Executive" },
                { "FIN_ANALYST", "Finance Analyst" },
                { "OPS_EXEC", "Operations Executive" }
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
                    MaxBasic = 100000,
                    MinBasic = 20000,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Designations.Add(newDesig);
                dbDesigs.Add(newDesig);
            }
            await context.SaveChangesAsync();

            // 6. Seed exactly 13 Employees and Users representing the HRMS Core roles
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123", 12);
            var dbGrades = await context.GradeMasters.ToListAsync();
            var dbBands = await context.BandMasters.ToListAsync();
            var dbShifts = await context.ShiftMasters.ToListAsync();
            var dbCostCenters = await context.CostCenters.ToListAsync();
            var dbBusinessUnits = await context.BusinessUnits.ToListAsync();

            var locationId = location.LocationId;
            var compId = company.CompanyId;

            // Definition list for the 13 exact core test users
            var empDefinitions = new List<(string Username, string RoleCode, string EmpCode, string Email, string FirstName, string LastName, string DeptCode, string DesigTitle)>
            {
                // Super Admin & COO
                ("superadmin@company.com", RoleCodes.SuperAdmin, "EMP0001", "superadmin@company.com", "System", "Admin", "HR", "Super Admin"),
                ("coo@company.com", RoleCodes.COO, "EMP0002", "coo@company.com", "Rohan", "COO", "OPS", "Chief Operating Officer"),
                
                // HR Admin & Finance Head
                ("hradmin@company.com", RoleCodes.HRAdmin, "EMP0003", "hradmin@company.com", "Sneha", "HRAdmin", "HR", "Head of HR"),
                ("financehead@company.com", RoleCodes.FinanceHead, "EMP0004", "financehead@company.com", "Aditya", "FinanceHead", "FIN", "Head of Finance"),
                
                // Department HODs
                ("enghod@company.com", RoleCodes.DeptManager, "EMP0005", "enghod@company.com", "Rajesh", "EngineeringHOD", "ENG", "Head of Engineering"),
                ("hrhod@company.com", RoleCodes.DeptManager, "EMP0006", "hrhod@company.com", "Priya", "HRHOD", "HR", "Head of HR"),
                ("financehod@company.com", RoleCodes.DeptManager, "EMP0007", "financehod@company.com", "Gaurav", "FinanceHOD", "FIN", "Head of Finance"),
                ("opshod@company.com", RoleCodes.DeptManager, "EMP0008", "opshod@company.com", "Manish", "OperationsHOD", "OPS", "Chief Operating Officer"),
                
                // Core Employees under HODs
                ("engemp1@company.com", RoleCodes.Employee, "EMP0009", "engemp1@company.com", "Amit", "EngEmp1", "ENG", "Software Engineer"),
                ("engemp2@company.com", RoleCodes.Employee, "EMP0010", "engemp2@company.com", "Sumit", "EngEmp2", "ENG", "Software Engineer"),
                ("hremp1@company.com", RoleCodes.Employee, "EMP0011", "hremp1@company.com", "Kavita", "HREmp1", "HR", "HR Executive"),
                ("finemp1@company.com", RoleCodes.Employee, "EMP0012", "finemp1@company.com", "Vikram", "FinEmp1", "FIN", "Finance Analyst"),
                ("opsemp1@company.com", RoleCodes.Employee, "EMP0013", "opsemp1@company.com", "Suresh", "OpsEmp1", "OPS", "Operations Executive")
            };

            // Use fixed/deterministic GUIDs per user so JWT tokens remain valid across server restarts.
            // If we regenerated GUIDs every restart, any existing browser token would have a stale UserId
            // causing FK constraint violations on Notifications and "user not found" errors.
            var fixedUserIds = new Dictionary<string, Guid>
            {
                ["superadmin@company.com"] = new Guid("00000001-0000-0000-0000-000000000001"),
                ["coo@company.com"]         = new Guid("00000001-0000-0000-0000-000000000002"),
                ["hradmin@company.com"]     = new Guid("00000001-0000-0000-0000-000000000003"),
                ["financehead@company.com"] = new Guid("00000001-0000-0000-0000-000000000004"),
                ["enghod@company.com"]      = new Guid("00000001-0000-0000-0000-000000000005"),
                ["hrhod@company.com"]       = new Guid("00000001-0000-0000-0000-000000000006"),
                ["financehod@company.com"]  = new Guid("00000001-0000-0000-0000-000000000007"),
                ["opshod@company.com"]      = new Guid("00000001-0000-0000-0000-000000000008"),
                ["engemp1@company.com"]     = new Guid("00000001-0000-0000-0000-000000000009"),
                ["engemp2@company.com"]     = new Guid("00000001-0000-0000-0000-000000000010"),
                ["hremp1@company.com"]      = new Guid("00000001-0000-0000-0000-000000000011"),
                ["finemp1@company.com"]     = new Guid("00000001-0000-0000-0000-000000000012"),
                ["opsemp1@company.com"]     = new Guid("00000001-0000-0000-0000-000000000013"),
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
                    PersonalPhone = $"+91-999990000{idx}",
                    DeptId = dept.DeptId,
                    DesignationId = desig.DesignationId,
                    LocationId = locationId,
                    JoiningDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-6)),
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

                // Use the fixed GUID so this user's identity is stable across restarts
                var user = new User
                {
                    UserId = fixedUserIds[def.Email],
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
            var superadmin = employeeDict["superadmin@company.com"];
            var coo = employeeDict["coo@company.com"];
            var hradmin = employeeDict["hradmin@company.com"];
            var financehead = employeeDict["financehead@company.com"];
            
            var enghod = employeeDict["enghod@company.com"];
            var hrhod = employeeDict["hrhod@company.com"];
            var financehod = employeeDict["financehod@company.com"];
            var opshod = employeeDict["opshod@company.com"];
            
            var engemp1 = employeeDict["engemp1@company.com"];
            var engemp2 = employeeDict["engemp2@company.com"];
            var hremp1 = employeeDict["hremp1@company.com"];
            var finemp1 = employeeDict["finemp1@company.com"];
            var opsemp1 = employeeDict["opsemp1@company.com"];

            // COO reports to Super Admin
            coo.ReportingManagerId = superadmin.EmployeeId;

            // HR Admin and Finance Head report to COO
            hradmin.ReportingManagerId = coo.EmployeeId;
            financehead.ReportingManagerId = coo.EmployeeId;

            // HODs report to COO
            enghod.ReportingManagerId = coo.EmployeeId;
            hrhod.ReportingManagerId = coo.EmployeeId;
            financehod.ReportingManagerId = coo.EmployeeId;
            opshod.ReportingManagerId = coo.EmployeeId;

            // Employees report to their respective Department HODs
            engemp1.ReportingManagerId = enghod.EmployeeId;
            engemp2.ReportingManagerId = enghod.EmployeeId;
            hremp1.ReportingManagerId = hrhod.EmployeeId;
            finemp1.ReportingManagerId = financehod.EmployeeId;
            opsemp1.ReportingManagerId = opshod.EmployeeId;

            // Set HOD Employee IDs to their respective Departments
            dbDepts.First(d => d.DeptCode == "HR").HODEmployeeId = hrhod.EmployeeId;
            dbDepts.First(d => d.DeptCode == "FIN").HODEmployeeId = financehod.EmployeeId;
            dbDepts.First(d => d.DeptCode == "ENG").HODEmployeeId = enghod.EmployeeId;
            dbDepts.First(d => d.DeptCode == "OPS").HODEmployeeId = opshod.EmployeeId;

            await context.SaveChangesAsync();

            // 8. Seed Role Permissions for New Roles (COO, Finance Head, etc.)
            var allPermissions = await context.Permissions.ToListAsync();
            var currentRolePermissions = await context.RolePermissions.ToListAsync();

            var newRolePermissions = new Dictionary<string, List<string>>
            {
                [RoleCodes.SuperAdmin] = allPermissions.Select(p => p.PermissionCode).ToList(),
                [RoleCodes.HRAdmin] = allPermissions.Select(p => p.PermissionCode).ToList(),
                [RoleCodes.COO] = allPermissions.Where(p => p.PermissionCode.StartsWith("RECRUITMENT.") || p.PermissionCode.StartsWith("EMPLOYEE.") || p.PermissionCode.StartsWith("ORGANIZATION.")).Select(p => p.PermissionCode).ToList(),
                [RoleCodes.FinanceHead] = allPermissions.Where(p => p.PermissionCode.StartsWith("RECRUITMENT.") || p.PermissionCode.StartsWith("EMPLOYEE.VIEW") || p.PermissionCode.StartsWith("PAYROLL.")).Select(p => p.PermissionCode).ToList(),
                [RoleCodes.DeptManager] = allPermissions.Where(p => 
                    p.PermissionCode.StartsWith("RECRUITMENT.") || 
                    p.PermissionCode.StartsWith("EMPLOYEE.VIEW") || 
                    p.PermissionCode.StartsWith("ATTENDANCE.") || 
                    p.PermissionCode.StartsWith("LEAVE.") || 
                    p.PermissionCode.StartsWith("PERFORMANCE.")).Select(p => p.PermissionCode).ToList(),
                [RoleCodes.Employee] = allPermissions.Where(p => 
                    p.PermissionCode.StartsWith("EMPLOYEE.SELF") || 
                    p.PermissionCode.StartsWith("LEAVE.SELF") || 
                    p.PermissionCode.StartsWith("ATTENDANCE.SELF")).Select(p => p.PermissionCode).ToList()
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

            // 9. Seed dynamic approval workflow config matching workflow: HOD (1) -> COO (2) -> HR Admin (3) -> Finance Head (4)
            var approversList = new List<object>
            {
                new { Sequence = 1, RoleCode = RoleCodes.DeptManager, Status = "PendingHOD" },
                new { Sequence = 2, RoleCode = RoleCodes.COO, Status = "PendingCOO" },
                new { Sequence = 3, RoleCode = RoleCodes.HRAdmin, Status = "PendingHR" },
                new { Sequence = 4, RoleCode = RoleCodes.FinanceHead, Status = "PendingFinance" }
            };

            var config = new ApprovalWorkflowConfig
            {
                ConfigId = Guid.NewGuid(),
                CompanyId = compId,
                ApproverRolesJson = System.Text.Json.JsonSerializer.Serialize(approversList)
            };
            context.ApprovalWorkflowConfigs.Add(config);

            // Seed Leave Types
            var existingLeaveTypes = new List<LeaveType>
            {
                new LeaveType { CompanyId = compId, LeaveTypeName = "Earned Leave", LeaveCode = "EL", MaxDaysPerYear = 18, MaxDaysPerApplication = 10, IsCarryForward = true, MaxCarryForwardDays = 30, IsEncashable = true, IsPaidLeave = true, ApplicableGender = "All", MinServiceDaysRequired = 0, IsActive = true, CreatedAt = DateTime.UtcNow },
                new LeaveType { CompanyId = compId, LeaveTypeName = "Sick Leave", LeaveCode = "SL", MaxDaysPerYear = 12, MaxDaysPerApplication = 5, IsCarryForward = false, MaxCarryForwardDays = 0, IsEncashable = false, IsPaidLeave = true, ApplicableGender = "All", MinServiceDaysRequired = 0, IsActive = true, CreatedAt = DateTime.UtcNow }
            };
            context.LeaveTypes.AddRange(existingLeaveTypes);
            await context.SaveChangesAsync();

            // Seed Leave Balances for all 8 employees for 2026
            var currentYear = 2026;
            var employees = await context.Employees.ToListAsync();
            foreach (var emp in employees)
            {
                foreach (var lt in existingLeaveTypes)
                {
                    decimal defaultBalance = lt.LeaveCode == "EL" ? 15 : 10;
                    context.LeaveBalances.Add(new LeaveBalance
                    {
                        EmployeeId = emp.EmployeeId,
                        LeaveTypeId = lt.LeaveTypeId,
                        Year = currentYear,
                        OpeningBalance = defaultBalance,
                        Accrued = 0,
                        Taken = 0,
                        Encashed = 0,
                        Lapsed = 0,
                        ClosingBalance = defaultBalance,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // Seed DEFAULT_PASSWORD setting
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

    private static async Task SeedInterviewDemoDataAsync(AppDbContext context)
    {
        var company = await context.Companies.FirstOrDefaultAsync();
        if (company == null) return;

        var employees = await context.Employees.ToListAsync();
        var rahulSharma = employees.FirstOrDefault(e => e.FirstName == "Rahul") ?? employees.FirstOrDefault();
        var priyaNair = employees.FirstOrDefault(e => e.FirstName == "Priya") ?? employees.Skip(1).FirstOrDefault() ?? rahulSharma;
        var anjaliMehta = employees.FirstOrDefault(e => e.FirstName == "Anjali") ?? employees.Skip(2).FirstOrDefault() ?? rahulSharma;
        var vivekGupta = employees.FirstOrDefault(e => e.FirstName == "Vivek") ?? employees.Skip(3).FirstOrDefault() ?? rahulSharma;

        if (rahulSharma == null) return;

        var req = await context.JobRequisitions.FirstOrDefaultAsync();
        if (req == null) return;

        // ─── 1. Candidate 1: Aarav Sharma (Technical Interview - Tomorrow 10:00 AM) ───
        var cand1 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Aarav",
            LastName = "Sharma",
            Email = "aarav.sharma@example.com",
            Phone = "+91-9820011223",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "TechCorp",
            CurrentDesignation = "Software Developer",
            TotalExperience = 3.5m,
            Skills = "C#, .NET Core, React, SQL",
            Source = CandidateSource.LinkedIn,
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };
        context.Candidates.Add(cand1);

        var app1 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = cand1.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.InterviewL1,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-5),
            TimelineEventsJson = System.Text.Json.JsonSerializer.Serialize(new[]
            {
                new { @event = "Application Submitted", remarks = "Applied via LinkedIn", timestamp = DateTime.UtcNow.AddDays(-5).ToString("O") },
                new { @event = "Screening Cleared", remarks = "Screened by HR", timestamp = DateTime.UtcNow.AddDays(-3).ToString("O") },
                new { @event = "Interview Scheduled", remarks = "Technical Round scheduled", timestamp = DateTime.UtcNow.AddDays(-1).ToString("O") }
            })
        };
        context.JobApplications.Add(app1);

        var round1 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = app1.AppId,
            RoundName = "Technical Interview",
            RoundType = "Technical",
            ScheduledAt = DateTime.Today.AddDays(1).AddHours(10), // Tomorrow 10 AM
            DurationMinutes = 60,
            InterviewerId = rahulSharma.EmployeeId,
            Venue = "Virtual",
            MeetingLink = "https://teams.microsoft.com/l/meetup-join/dummy-aarav-sharma",
            Status = "Scheduled",
            IsGeneralInterview = false,
            Notes = "Candidate has strong C# and React background.",
            ChecklistJson = System.Text.Json.JsonSerializer.Serialize(new { resumeReviewed = true, jdReviewed = true, evaluationReady = true, meetingVerified = true, candidateJoined = false, recordingStarted = false })
        };
        context.InterviewRounds.Add(round1);
        context.InterviewRoundPanelists.Add(new InterviewRoundPanelist { RoundId = round1.RoundId, EmployeeId = rahulSharma.EmployeeId, Status = "Confirmed" });
        context.InterviewRoundPanelists.Add(new InterviewRoundPanelist { RoundId = round1.RoundId, EmployeeId = priyaNair.EmployeeId, Status = "Pending" });

        // ─── 2. Candidate 2: Neha Kapoor (HR Interview - Today 2:00 PM Confirmed) ───
        var cand2 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Neha",
            LastName = "Kapoor",
            Email = "neha.kapoor@example.com",
            Phone = "+91-9820022334",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "QA Solutions",
            CurrentDesignation = "QA Engineer",
            TotalExperience = 4.0m,
            Skills = "Selenium, C#, Cypress, Manual Testing",
            Source = CandidateSource.CareerPortal,
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };
        context.Candidates.Add(cand2);

        var app2 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = cand2.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.InterviewL2,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-7),
            TimelineEventsJson = System.Text.Json.JsonSerializer.Serialize(new[]
            {
                new { @event = "Technical Round Cleared", remarks = "Score: 8.5/10", timestamp = DateTime.UtcNow.AddDays(-2).ToString("O") },
                new { @event = "Candidate Confirmed", remarks = "HR Round confirmed for today 2 PM", timestamp = DateTime.UtcNow.AddDays(-1).ToString("O") }
            })
        };
        context.JobApplications.Add(app2);

        var round2 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = app2.AppId,
            RoundName = "HR Interview",
            RoundType = "HR",
            ScheduledAt = DateTime.Today.AddHours(14), // Today 2:00 PM
            DurationMinutes = 45,
            InterviewerId = anjaliMehta.EmployeeId,
            Venue = "Room 3B - Corporate HQ",
            MeetingLink = "https://teams.microsoft.com/l/meetup-join/dummy-neha-kapoor",
            Status = "Confirmed",
            IsGeneralInterview = false,
            ChecklistJson = System.Text.Json.JsonSerializer.Serialize(new { resumeReviewed = true, jdReviewed = true, evaluationReady = true, meetingVerified = true, candidateJoined = false, recordingStarted = false })
        };
        context.InterviewRounds.Add(round2);
        context.InterviewRoundPanelists.Add(new InterviewRoundPanelist { RoundId = round2.RoundId, EmployeeId = anjaliMehta.EmployeeId, Status = "Confirmed" });

        // ─── 3. Candidate 3: Rohan Verma (Managerial Interview - In Progress Today) ───
        var cand3 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Rohan",
            LastName = "Verma",
            Email = "rohan.verma@example.com",
            Phone = "+91-9820033445",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "CloudWorks",
            CurrentDesignation = "DevOps Specialist",
            TotalExperience = 5.0m,
            Skills = "Docker, Kubernetes, AWS, Terraform, CI/CD",
            Source = CandidateSource.EmployeeReferral,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        context.Candidates.Add(cand3);

        var app3 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = cand3.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.ManagerReview,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-10),
            TimelineEventsJson = System.Text.Json.JsonSerializer.Serialize(new[]
            {
                new { @event = "Interview Started", remarks = "Managerial Round currently in progress", timestamp = DateTime.UtcNow.ToString("O") }
            })
        };
        context.JobApplications.Add(app3);

        var round3 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = app3.AppId,
            RoundName = "Managerial Interview",
            RoundType = "Managerial",
            ScheduledAt = DateTime.UtcNow.AddMinutes(-15), // In Progress right now
            DurationMinutes = 60,
            InterviewerId = vivekGupta.EmployeeId,
            Venue = "Executive Conference Room",
            MeetingLink = "https://teams.microsoft.com/l/meetup-join/dummy-rohan-verma",
            Status = "InProgress",
            IsGeneralInterview = false,
            ChecklistJson = System.Text.Json.JsonSerializer.Serialize(new { resumeReviewed = true, jdReviewed = true, evaluationReady = true, meetingVerified = true, candidateJoined = true, recordingStarted = true })
        };
        context.InterviewRounds.Add(round3);
        context.InterviewRoundPanelists.Add(new InterviewRoundPanelist { RoundId = round3.RoundId, EmployeeId = vivekGupta.EmployeeId, Status = "Confirmed" });

        // ─── 4. Candidate 4: Sneha Iyer (Technical Interview - Completed & Evaluated) ───
        var cand4 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Sneha",
            LastName = "Iyer",
            Email = "sneha.iyer@example.com",
            Phone = "+91-9820044556",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "DesignStudio",
            CurrentDesignation = "UI/UX Designer",
            TotalExperience = 4.5m,
            Skills = "Figma, Adobe XD, Design Systems, Wireframing",
            Source = CandidateSource.LinkedIn,
            CreatedAt = DateTime.UtcNow.AddDays(-12)
        };
        context.Candidates.Add(cand4);

        var app4 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = cand4.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.InterviewL1,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-12),
            StageDataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                technicalInterview = new
                {
                    technicalRating = 9,
                    recommendation = "Strong Hire",
                    feedback = "Exceptional UI portfolio and solid Figma & system design capabilities.",
                    approved = false,
                    interviewStatus = "Completed"
                }
            }),
            TimelineEventsJson = System.Text.Json.JsonSerializer.Serialize(new[]
            {
                new { @event = "Interview Completed", remarks = "Technical Round Completed", timestamp = DateTime.UtcNow.AddDays(-2).ToString("O") },
                new { @event = "Feedback Submitted", remarks = "Rating: 9/10 (Strong Hire)", timestamp = DateTime.UtcNow.AddDays(-2).AddHours(1).ToString("O") }
            })
        };
        context.JobApplications.Add(app4);

        var round4 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = app4.AppId,
            RoundName = "Technical Interview",
            RoundType = "Technical",
            ScheduledAt = DateTime.UtcNow.AddDays(-2),
            CompletedAt = DateTime.UtcNow.AddDays(-2).AddHours(1),
            DurationMinutes = 60,
            InterviewerId = rahulSharma.EmployeeId,
            Venue = "Virtual",
            MeetingLink = "https://teams.microsoft.com/l/meetup-join/dummy-sneha-iyer",
            Status = "Evaluated",
            Rating = 9.0m,
            Feedback = "Exceptional UI portfolio and solid Figma & system design capabilities.",
            IsGeneralInterview = false,
            ChecklistJson = System.Text.Json.JsonSerializer.Serialize(new { resumeReviewed = true, jdReviewed = true, evaluationReady = true, meetingVerified = true, candidateJoined = true, recordingStarted = true }),
            AttachmentsJson = System.Text.Json.JsonSerializer.Serialize(new[]
            {
                new { id = "att1", fileName = "Evaluation Sheet.pdf", documentType = "Evaluation Sheet", fileUrl = "interviews/dummy_eval.pdf", uploadedOn = DateTime.UtcNow.AddDays(-2).ToString("O"), size = "0.8 MB" },
                new { id = "att2", fileName = "Coding Assignment.pdf", documentType = "Assignment", fileUrl = "interviews/dummy_assignment.pdf", uploadedOn = DateTime.UtcNow.AddDays(-2).ToString("O"), size = "1.5 MB" },
                new { id = "att3", fileName = "Interview Notes.docx", documentType = "Other", fileUrl = "interviews/dummy_notes.docx", uploadedOn = DateTime.UtcNow.AddDays(-2).ToString("O"), size = "0.4 MB" }
            })
        };
        context.InterviewRounds.Add(round4);
        context.InterviewRoundPanelists.Add(new InterviewRoundPanelist { RoundId = round4.RoundId, EmployeeId = rahulSharma.EmployeeId, Status = "Completed", Rating = 9.0m, Feedback = "Strong hire recommendation." });

        // ─── 5. Candidate 5: Aditya Singh (HR Interview - Feedback Pending) ───
        var cand5 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Aditya",
            LastName = "Singh",
            Email = "aditya.singh@example.com",
            Phone = "+91-9820055667",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "DataMinds",
            CurrentDesignation = "Data Analyst",
            TotalExperience = 2.8m,
            Skills = "SQL, Python, PowerBI, Tableau",
            Source = CandidateSource.CareerPortal,
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        };
        context.Candidates.Add(cand5);

        var app5 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = cand5.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.InterviewL2,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-8)
        };
        context.JobApplications.Add(app5);

        var round5 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = app5.AppId,
            RoundName = "HR Interview",
            RoundType = "HR",
            ScheduledAt = DateTime.UtcNow.AddDays(-1),
            DurationMinutes = 45,
            InterviewerId = anjaliMehta.EmployeeId,
            Venue = "Room 2A",
            Status = "FeedbackPending",
            IsGeneralInterview = false,
            Feedback = null
        };
        context.InterviewRounds.Add(round5);
        context.InterviewRoundPanelists.Add(new InterviewRoundPanelist { RoundId = round5.RoundId, EmployeeId = anjaliMehta.EmployeeId, Status = "Pending" });

        // ─── 6. General Interview 1: Kavya Rao (Walk-in - Scheduled Next Week) ───
        var round6 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = null,
            RoundName = "Walk-in Discussion",
            Category = "Walk-in",
            IsGeneralInterview = true,
            CandidateName = "Kavya Rao",
            CandidateEmail = "kavya.rao@example.com",
            CandidatePhone = "+91-9876543210",
            Company = "Analytics Corp",
            Department = "Business Analysis",
            ScheduledAt = DateTime.Today.AddDays(7).AddHours(11),
            DurationMinutes = 45,
            InterviewerId = anjaliMehta.EmployeeId,
            Venue = "Main Reception / Interview Room B",
            Status = "Scheduled",
            Notes = "Walk-in drive participant for Business Analyst opening."
        };
        context.InterviewRounds.Add(round6);

        // ─── 7. General Interview 2: Siddharth Malhotra (Internal Transfer - Completed -> Convertible) ───
        var round7 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = null,
            RoundName = "Internal Transfer Discussion",
            Category = "Internal Transfer",
            IsGeneralInterview = true,
            CandidateName = "Siddharth Malhotra",
            CandidateEmail = "siddharth.m@example.com",
            CandidatePhone = "+91-9988776655",
            Company = "Acme Subsidiary",
            Department = "Core Engineering",
            ScheduledAt = DateTime.Today.AddDays(-1).AddHours(16),
            CompletedAt = DateTime.Today.AddDays(-1).AddHours(17),
            DurationMinutes = 60,
            InterviewerId = vivekGupta.EmployeeId,
            Venue = "Conference Room A",
            Status = "Completed",
            Rating = 8.5m,
            Feedback = "Strong internal transfer candidate. Recommended for Lead Engineer transition.",
            Notes = "Internal candidate transfer discussion."
        };
        context.InterviewRounds.Add(round7);

        // ─── 8. General Interview 3: Vikram Joshi (Campus Drive - Scheduled Tomorrow) ───
        var round8 = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = null,
            RoundName = "Campus Drive Screening",
            Category = "Campus Drive",
            IsGeneralInterview = true,
            CandidateName = "Vikram Joshi",
            CandidateEmail = "vikram.joshi@example.com",
            CandidatePhone = "+91-9123456789",
            Company = "IIT Bombay",
            Department = "Computer Science",
            ScheduledAt = DateTime.Today.AddDays(1).AddHours(11),
            DurationMinutes = 30,
            InterviewerId = rahulSharma.EmployeeId,
            Venue = "Campus Placement Cell Room 4",
            Status = "Scheduled"
        };
        context.InterviewRounds.Add(round8);

        // ─── 9. Cancelled Interview (Deepak Sharma) ───
        var candCancelled = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Deepak",
            LastName = "Sharma",
            Email = "deepak.sharma@example.com",
            Phone = "+91-9820066778",
            CandidateStatus = CandidateStatus.Rejected,
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };
        context.Candidates.Add(candCancelled);

        var appCancelled = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = candCancelled.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.InterviewL1,
            Status = "Withdrawn",
            ApplicationDate = DateTime.UtcNow.AddDays(-15)
        };
        context.JobApplications.Add(appCancelled);

        var roundCancelled = new InterviewRound
        {
            RoundId = Guid.NewGuid(),
            AppId = appCancelled.AppId,
            RoundName = "Screening Chat",
            RoundType = "Technical",
            ScheduledAt = DateTime.UtcNow.AddDays(-4),
            InterviewerId = rahulSharma.EmployeeId,
            Status = "Cancelled",
            Notes = "Candidate withdrew application."
        };
        context.InterviewRounds.Add(roundCancelled);

        // ─── 10. Deterministic Test Hooks & Applications ───
        // QA Candidate (Deterministic Playwright Test Hook)
        var candQA = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "QA",
            LastName = "Candidate",
            Email = "qa.candidate@example.com",
            Phone = "+91-9999988888",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "Automation QA Corp",
            CurrentDesignation = "Senior QA Automation Architect",
            TotalExperience = 8.0m,
            Source = CandidateSource.CareerPortal,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        context.Candidates.Add(candQA);

        var appQA = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = candQA.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.Screening,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-1)
        };
        context.JobApplications.Add(appQA);

        // Needs Scheduling 1: Pooja Hegde (InterviewL1)
        var candNS1 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Pooja",
            LastName = "Hegde",
            Email = "pooja.hegde@example.com",
            Phone = "+91-9820077889",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "InnovateTech",
            CurrentDesignation = "SDE-II",
            TotalExperience = 3.0m,
            Source = CandidateSource.LinkedIn,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };
        context.Candidates.Add(candNS1);

        var appNS1 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = candNS1.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.InterviewL1,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-2)
        };
        context.JobApplications.Add(appNS1);

        // Needs Scheduling 2: Karan Johar (InterviewL2)
        var candNS2 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Karan",
            LastName = "Johar",
            Email = "karan.johar@example.com",
            Phone = "+91-9820088990",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "TestingPro",
            CurrentDesignation = "QA Lead",
            TotalExperience = 6.0m,
            Source = CandidateSource.CareerPortal,
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        };
        context.Candidates.Add(candNS2);

        var appNS2 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = candNS2.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.InterviewL2,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-3)
        };
        context.JobApplications.Add(appNS2);

        // Needs Scheduling 3: Meera Nair (ManagerReview)
        var candNS3 = new Candidate
        {
            CandidateId = Guid.NewGuid(),
            FirstName = "Meera",
            LastName = "Nair",
            Email = "meera.nair@example.com",
            Phone = "+91-9820099001",
            CandidateStatus = CandidateStatus.InProcess,
            CurrentCompany = "ProductScale",
            CurrentDesignation = "Product Manager",
            TotalExperience = 7.5m,
            Source = CandidateSource.EmployeeReferral,
            CreatedAt = DateTime.UtcNow.AddDays(-4)
        };
        context.Candidates.Add(candNS3);

        var appNS3 = new JobApplication
        {
            AppId = Guid.NewGuid(),
            CandidateId = candNS3.CandidateId,
            ReqId = req.ReqId,
            CurrentStage = ApplicationStage.ManagerReview,
            Status = "UnderReview",
            ApplicationDate = DateTime.UtcNow.AddDays(-4)
        };
        context.JobApplications.Add(appNS3);

        await context.SaveChangesAsync();
    }

    private static async Task SeedOfferDemoDataAsync(AppDbContext context)
    {
        var apps = await context.JobApplications.Include(a => a.Candidate).ToListAsync();
        if (apps.Count < 3) return;

        // Candidate 4 (Sneha Iyer) - Offer Sent
        var offer1 = new OfferLetter
        {
            OfferId = Guid.NewGuid(),
            AppId = apps[3].AppId,
            JobApplication = apps[3],
            OfferedCTC = 1450000m,
            JoiningDate = DateOnly.FromDateTime(DateTime.Today.AddDays(20)),
            OfferDate = DateTime.UtcNow.AddDays(-2),
            ExpiryDate = DateTime.UtcNow.AddDays(28),
            Status = OfferStatus.Sent
        };
        context.OfferLetters.Add(offer1);

        // Candidate 2 (Neha Kapoor) - Offer Draft
        var offer2 = new OfferLetter
        {
            OfferId = Guid.NewGuid(),
            AppId = apps[1].AppId,
            JobApplication = apps[1],
            OfferedCTC = 950000m,
            JoiningDate = DateOnly.FromDateTime(DateTime.Today.AddDays(15)),
            OfferDate = DateTime.UtcNow.AddDays(-1),
            ExpiryDate = DateTime.UtcNow.AddDays(29),
            Status = OfferStatus.Draft
        };
        context.OfferLetters.Add(offer2);

        // Candidate 5 (Aditya Singh) - Offer Accepted
        if (apps.Count > 4)
        {
            var offer3 = new OfferLetter
            {
                OfferId = Guid.NewGuid(),
                AppId = apps[4].AppId,
                JobApplication = apps[4],
                OfferedCTC = 1100000m,
                JoiningDate = DateOnly.FromDateTime(DateTime.Today.AddDays(10)),
                OfferDate = DateTime.UtcNow.AddDays(-5),
                ExpiryDate = DateTime.UtcNow.AddDays(25),
                Status = OfferStatus.Accepted,
                AcceptedAt = DateTime.UtcNow.AddDays(-1)
            };
            context.OfferLetters.Add(offer3);
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedBgvDemoDataAsync(AppDbContext context)
    {
        var candidates = await context.Candidates.ToListAsync();
        if (candidates.Count < 2) return;

        var bgv1 = new BGVRecord
        {
            BGVId = Guid.NewGuid(),
            CandidateId = candidates[0].CandidateId,
            Candidate = candidates[0],
            AgencyName = "AuthBridge Solutions",
            BGVType = "Executive Package",
            Status = "In Progress",
            InitiatedAt = DateTime.UtcNow.AddDays(-4),
            IdentityStatus = "Cleared",
            EmploymentStatus = "Pending",
            EducationStatus = "Cleared",
            CriminalStatus = "Cleared",
            ReferenceStatus = "Pending",
            CreditStatus = "Pending"
        };
        context.BGVRecords.Add(bgv1);

        var bgv2 = new BGVRecord
        {
            BGVId = Guid.NewGuid(),
            CandidateId = candidates[1].CandidateId,
            Candidate = candidates[1],
            AgencyName = "First Advantage India",
            BGVType = "Standard Package",
            Status = "Cleared",
            InitiatedAt = DateTime.UtcNow.AddDays(-10),
            IdentityStatus = "Cleared",
            EmploymentStatus = "Cleared",
            EducationStatus = "Cleared",
            CriminalStatus = "Cleared",
            ReferenceStatus = "Cleared",
            CreditStatus = "Cleared"
        };
        context.BGVRecords.Add(bgv2);

        await context.SaveChangesAsync();
    }

    private static async Task SeedOnboardingDemoDataAsync(AppDbContext context)
    {
        var candidates = await context.Candidates.ToListAsync();
        if (!candidates.Any()) return;

        var sampleBuddy = await context.Employees.FirstOrDefaultAsync();

        var demoOnboardings = new List<OnboardingProcess>
        {
            new OnboardingProcess
            {
                OnboardingId = Guid.NewGuid(),
                CandidateId = candidates[0].CandidateId,
                Status = "Pre-Joining",
                BuddyEmployeeId = sampleBuddy?.EmployeeId,
                AssetAllocation = "Desk B-101, Laptop Pending",
                InductionSchedule = "Day 1, 10:00 AM Hall A",
                HRChecklistJson = "{\"docsVerified\":false,\"offerAccepted\":true,\"bgvCleared\":true}",
                ITChecklistJson = "{\"emailCreated\":false,\"laptopAssigned\":false}",
                AdminChecklistJson = "{\"workspaceAllocated\":true,\"idCard\":false}",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new OnboardingProcess
            {
                OnboardingId = Guid.NewGuid(),
                CandidateId = candidates.Count > 1 ? candidates[1].CandidateId : candidates[0].CandidateId,
                Status = "Completed",
                BuddyEmployeeId = sampleBuddy?.EmployeeId,
                AssetAllocation = "Desk A-402, ThinkPad T14",
                InductionSchedule = "Completed Onboarding Orientation",
                HRChecklistJson = "{\"docsVerified\":true,\"offerAccepted\":true,\"bgvCleared\":true,\"payrollSetup\":true}",
                ITChecklistJson = "{\"emailCreated\":true,\"laptopAssigned\":true,\"systemAccess\":true}",
                AdminChecklistJson = "{\"workspaceAllocated\":true,\"idCard\":true,\"welcomeKit\":true}",
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            }
        };

        context.OnboardingProcesses.AddRange(demoOnboardings);
        await context.SaveChangesAsync();
    }
}
