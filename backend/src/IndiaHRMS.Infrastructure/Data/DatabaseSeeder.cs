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
        
        context.Users.RemoveRange(await context.Users.ToListAsync());
        context.UserRoles.RemoveRange(await context.UserRoles.ToListAsync());

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
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade A", Code = "A", NoticePeriodDays = 30, IsActive = true, CreatedAt = DateTime.UtcNow },
                new GradeMaster { CompanyId = company.CompanyId, Name = "Grade M1", Code = "M1", NoticePeriodDays = 90, IsActive = true, CreatedAt = DateTime.UtcNow }
            });
            await context.SaveChangesAsync();
        }

        var band = await context.BandMasters.FirstOrDefaultAsync(b => b.CompanyId == company.CompanyId);
        if (band == null)
        {
            context.BandMasters.AddRange(new List<BandMaster>
            {
                new BandMaster { CompanyId = company.CompanyId, Name = "Individual Contributor", Code = "IC", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BandMaster { CompanyId = company.CompanyId, Name = "Manager", Code = "MGR", IsActive = true, CreatedAt = DateTime.UtcNow }
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

        // 4. Seed EXACTLY 3 Departments
        var deptsToSeed = new List<(string Code, string Name)>
        {
            ("HR", "Human Resources"),
            ("FIN", "Finance"),
            ("ENG", "Product Engineering")
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
            { "FIN_HEAD", "Head of Finance" },
            { "ENG_HOD", "Head of Engineering" },
            { "SWE", "Software Engineer" }
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
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Designations.Add(newDesig);
            dbDesigs.Add(newDesig);
        }
        await context.SaveChangesAsync();

        // 6. Seed exactly 8 Employees and Users
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123", 12);
        var dbGrades = await context.GradeMasters.ToListAsync();
        var dbBands = await context.BandMasters.ToListAsync();
        var dbShifts = await context.ShiftMasters.ToListAsync();
        var dbCostCenters = await context.CostCenters.ToListAsync();
        var dbBusinessUnits = await context.BusinessUnits.ToListAsync();

        var locationId = location.LocationId;
        var compId = company.CompanyId;

        // Definition list for the 8 exact test users
        var empDefinitions = new List<(string Username, string RoleCode, string EmpCode, string Email, string FirstName, string LastName, string DeptCode, string DesigTitle)>
        {
            ("admin@company.com", RoleCodes.SuperAdmin, "EMP0001", "admin@company.com", "System", "Admin", "HR", "Chief Executive Officer"),
            ("coo@company.com", RoleCodes.COO, "EMP0002", "coo@company.com", "Rohan", "COO", "HR", "Chief Operating Officer"),
            ("hradmin@company.com", RoleCodes.HRAdmin, "EMP0003", "hradmin@company.com", "Sneha", "HR", "HR", "Head of HR"),
            ("finance@company.com", RoleCodes.FinanceHead, "EMP0004", "finance@company.com", "Aditya", "Finance", "FIN", "Head of Finance"),
            ("enghod@company.com", RoleCodes.DeptManager, "EMP0005", "enghod@company.com", "Rajesh", "Engineering", "ENG", "Head of Engineering"),
            ("emp1@company.com", RoleCodes.Employee, "EMP0006", "emp1@company.com", "Amit", "EngineerOne", "ENG", "Software Engineer"),
            ("emp2@company.com", RoleCodes.Employee, "EMP0007", "emp2@company.com", "Sumit", "EngineerTwo", "ENG", "Software Engineer"),
            ("emp3@company.com", RoleCodes.Employee, "EMP0008", "emp3@company.com", "Karan", "EngineerThree", "ENG", "Software Engineer")
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
        var emp1 = employeeDict["emp1@company.com"];
        var emp2 = employeeDict["emp2@company.com"];
        var emp3 = employeeDict["emp3@company.com"];

        // HODs report to COO
        hrAdmin.ReportingManagerId = coo.EmployeeId;
        financeHead.ReportingManagerId = coo.EmployeeId;
        engHod.ReportingManagerId = coo.EmployeeId;

        // Software Engineers report to Engineering HOD
        emp1.ReportingManagerId = engHod.EmployeeId;
        emp2.ReportingManagerId = engHod.EmployeeId;
        emp3.ReportingManagerId = engHod.EmployeeId;

        // COO reports to CEO (Super Admin)
        coo.ReportingManagerId = ceo.EmployeeId;

        // Set HOD Employee IDs to their respective Departments
        dbDepts.First(d => d.DeptCode == "HR").HODEmployeeId = hrAdmin.EmployeeId;
        dbDepts.First(d => d.DeptCode == "FIN").HODEmployeeId = financeHead.EmployeeId;
        dbDepts.First(d => d.DeptCode == "ENG").HODEmployeeId = engHod.EmployeeId;

        await context.SaveChangesAsync();

        // 8. Seed Role Permissions for New Roles (COO, Finance Head, etc.)
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

        // 9. Seed dynamic approval workflow config matching workflow: COO (1) -> HR Admin (2) -> Finance Head (3)
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
