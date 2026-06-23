using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IndiaHRMS.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context)
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

        // 3. Ensure Roles exist
        var requiredRoles = new List<(string Code, string Name, string Desc)>
        {
            (RoleCodes.SuperAdmin, "Super Admin", "Full access to all modules and configurations."),
            (RoleCodes.HRAdmin, "HR Admin", "Full access to HR operations."),
            (RoleCodes.HRManager, "HR Manager", "Manage HR processes and approvals."),
            (RoleCodes.PayrollAdmin, "Payroll Admin", "Process and approve payroll."),
            (RoleCodes.RecruitmentManager, "Recruitment Manager", "Manage recruitment and offers."),
            (RoleCodes.DeptManager, "Department Manager", "Manage team attendance, leaves, and appraisals."),
            (RoleCodes.Employee, "Employee", "Standard employee self-service access."),
            (RoleCodes.Auditor, "Auditor", "Read-only access to audit logs and reports."),
            (RoleCodes.ITAdmin, "IT Admin", "Manage users and system settings."),
            (RoleCodes.FinanceViewer, "Finance Viewer", "View payroll and financial reports.")
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
            }
        }
        await context.SaveChangesAsync();
        dbRoles = await context.Roles.ToListAsync();

        // 4. Ensure Departments exist
        var departments = new Dictionary<string, string>
        {
            { "HR", "Human Resources" },
            { "IT", "Information Technology" },
            { "FIN", "Finance & Accounts" },
            { "REC", "Recruitment" },
            { "ENG", "Engineering" },
            { "AUD", "Compliance & Audit" }
        };
        var dbDepts = await context.Departments.ToListAsync();
        foreach (var kvp in departments)
        {
            if (!dbDepts.Any(d => d.DeptCode == kvp.Key))
            {
                var newDept = new Department
                {
                    DeptId = Guid.NewGuid(),
                    CompanyId = company.CompanyId,
                    DeptCode = kvp.Key,
                    DeptName = kvp.Value,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Departments.Add(newDept);
            }
        }
        await context.SaveChangesAsync();
        dbDepts = await context.Departments.ToListAsync();

        // 5. Ensure Designations exist
        var designations = new Dictionary<string, string>
        {
            { "SYS_ADMIN", "System Administrator" },
            { "IT_SPEC", "IT Specialist" },
            { "HR_HEAD", "Head of HR" },
            { "HR_MGR", "HR Manager" },
            { "REC_MGR", "Recruitment Manager" },
            { "PAY_SPEC", "Payroll Specialist" },
            { "FIN_ANAL", "Financial Analyst" },
            { "DEPT_HEAD", "Department Head" },
            { "ENG_MEMBER", "Software Engineer" },
            { "AUD_LEAD", "Lead Compliance Auditor" }
        };
        var dbDesigs = await context.Designations.ToListAsync();
        foreach (var kvp in designations)
        {
            if (!dbDesigs.Any(d => d.Title == kvp.Value))
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
            }
        }
        await context.SaveChangesAsync();
        dbDesigs = await context.Designations.ToListAsync();

        // 6. Seed Demo Users
        // Password hash for "Hrms@123456" with workFactor=12 (using BCrypt)
        var passwordHash = "$2a$12$Blw6FugNtPSkQERm02PwYuAsP5.UwvwQA4kO.o4qq3I0ryM/kIS5O";

        var demoUsers = new List<(string Username, string RoleCode, string EmpCode, string Email, string FirstName, string LastName, string DeptCode, string DesigTitle)>
        {
            ("admin", RoleCodes.SuperAdmin, "EMP0001", "admin@acme.example.com", "System", "Administrator", "HR", "System Administrator"),
            ("super_admin", RoleCodes.SuperAdmin, "EMP0010", "superadmin@acme.example.com", "Super", "Admin", "HR", "System Administrator"),
            ("it_admin", RoleCodes.ITAdmin, "EMP0011", "itadmin@acme.example.com", "IT", "Administrator", "IT", "IT Specialist"),
            ("hr_admin", RoleCodes.HRAdmin, "EMP0012", "hradmin@acme.example.com", "HR", "Admin", "HR", "Head of HR"),
            ("hr_manager", RoleCodes.HRManager, "EMP0013", "hrmanager@acme.example.com", "HR", "Manager", "HR", "HR Manager"),
            ("recruitment_manager", RoleCodes.RecruitmentManager, "EMP0014", "recruiter@acme.example.com", "Recruitment", "Manager", "REC", "Recruitment Manager"),
            ("payroll_admin", RoleCodes.PayrollAdmin, "EMP0015", "payroll@acme.example.com", "Payroll", "Admin", "FIN", "Payroll Specialist"),
            ("finance_viewer", RoleCodes.FinanceViewer, "EMP0016", "finance@acme.example.com", "Finance", "Viewer", "FIN", "Financial Analyst"),
            ("dept_manager", RoleCodes.DeptManager, "EMP0017", "manager@acme.example.com", "Department", "Manager", "ENG", "Department Head"),
            ("employee", RoleCodes.Employee, "EMP0018", "employee@acme.example.com", "Standard", "Employee", "ENG", "Software Engineer"),
            ("auditor", RoleCodes.Auditor, "EMP0019", "auditor@acme.example.com", "Lead", "Auditor", "AUD", "Lead Compliance Auditor")
        };

        foreach (var u in demoUsers)
        {
            var existingUser = await context.Users.FirstOrDefaultAsync(usr => usr.Username == u.Username);
            if (existingUser == null)
            {
                // Find department and designation
                var dept = dbDepts.First(d => d.DeptCode == u.DeptCode);
                var desig = dbDesigs.First(d => d.Title == u.DesigTitle);

                // Create Employee first
                var employee = new Employee
                {
                    EmployeeId = Guid.NewGuid(),
                    CompanyId = company.CompanyId,
                    EmployeeCode = u.EmpCode,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    OfficialEmail = u.Email,
                    DeptId = dept.DeptId,
                    DesignationId = desig.DesignationId,
                    LocationId = location.LocationId,
                    JoiningDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-1)),
                    EmploymentType = EmploymentType.FullTime,
                    EmploymentStatus = EmploymentStatus.Active,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Employees.Add(employee);
                await context.SaveChangesAsync();

                // Create User
                var newUser = new User
                {
                    UserId = Guid.NewGuid(),
                    EmployeeId = employee.EmployeeId,
                    Username = u.Username,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    PasswordHash = passwordHash,
                    PasswordSalt = string.Empty,
                    IsActive = true,
                    IsLocked = false,
                    FailedLoginCount = 0,
                    MustChangePassword = false,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(newUser);
                await context.SaveChangesAsync();

                // Map Role
                var roleObj = dbRoles.First(r => r.RoleCode == u.RoleCode);
                var userRole = new UserRole
                {
                    UserRoleId = Guid.NewGuid(),
                    UserId = newUser.UserId,
                    RoleId = roleObj.RoleId,
                    AssignedAt = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.UserRoles.Add(userRole);
                await context.SaveChangesAsync();
            }
            else
            {
                existingUser.PasswordHash = passwordHash;
                existingUser.IsLocked = false;
                existingUser.FailedLoginCount = 0;
                await context.SaveChangesAsync();
            }
        }

        // 7. Seed Role Permissions according to BRD requirements
        var allPermissions = await context.Permissions.ToListAsync();

        // Standard mapping configurations per RoleCode -> list of PermissionCodes
        var rolePermissionsMapping = new Dictionary<string, List<string>>
        {
            [RoleCodes.SuperAdmin] = allPermissions.Select(p => p.PermissionCode).ToList(),

            [RoleCodes.ITAdmin] = new List<string>
            {
                "USER_MGMT.VIEW", "USER_MGMT.CREATE", "USER_MGMT.EDIT", "USER_MGMT.DELETE", "USER_MGMT.ASSIGN",
                "COMPANY_SETUP.VIEW", "COMPANY_SETUP.EDIT",
                "AUDIT.VIEW", "AUDIT.EXPORT",
                "COMPLIANCE.VIEW"
            },

            [RoleCodes.HRAdmin] = allPermissions.Where(p => 
                p.PermissionCode.StartsWith("EMPLOYEE.") ||
                p.PermissionCode.StartsWith("ATTENDANCE.") ||
                p.PermissionCode.StartsWith("LEAVE.") ||
                p.PermissionCode.StartsWith("RECRUITMENT.") ||
                p.PermissionCode.StartsWith("PERFORMANCE.") ||
                p.PermissionCode.StartsWith("TRAINING.") ||
                p.PermissionCode.StartsWith("SEPARATION.") ||
                p.PermissionCode.StartsWith("COMPANY_SETUP.") ||
                p.PermissionCode.StartsWith("COMPLIANCE.") ||
                p.PermissionCode.StartsWith("REPORTS.")
            ).Select(p => p.PermissionCode).Except(new[] { "LEAVE.CONFIGURE", "PAYROLL.CONFIGURE", "COMPLIANCE.MANAGE" }).ToList(),

            [RoleCodes.HRManager] = new List<string>
            {
                "EMPLOYEE.VIEW", "EMPLOYEE.CREATE", "EMPLOYEE.EDIT",
                "ATTENDANCE.VIEW", "ATTENDANCE.CREATE", "ATTENDANCE.EDIT", "ATTENDANCE.APPROVE",
                "LEAVE.VIEW", "LEAVE.CREATE", "LEAVE.EDIT", "LEAVE.APPROVE", "LEAVE.REJECT",
                "RECRUITMENT.VIEW",
                "PERFORMANCE.VIEW", "PERFORMANCE.EDIT",
                "TRAINING.VIEW", "TRAINING.ASSIGN",
                "SEPARATION.VIEW",
                "REPORTS.VIEW",
                "COMPANY_SETUP.VIEW",
                "COMPLIANCE.VIEW"
            },

            [RoleCodes.RecruitmentManager] = new List<string>
            {
                "RECRUITMENT.VIEW", "RECRUITMENT.CREATE", "RECRUITMENT.EDIT", "RECRUITMENT.DELETE", "RECRUITMENT.APPROVE", "RECRUITMENT.EXPORT",
                "TRAINING.VIEW"
            },

            [RoleCodes.PayrollAdmin] = new List<string>
            {
                "PAYROLL.VIEW", "PAYROLL.PROCESS", "PAYROLL.APPROVE", "PAYROLL.EXPORT", "PAYROLL.GENERATE", "PAYROLL.CONFIGURE",
                "COMPLIANCE.VIEW", "COMPLIANCE.MANAGE", "COMPLIANCE.EXPORT",
                "REPORTS.VIEW", "REPORTS.EXPORT"
            },

            [RoleCodes.FinanceViewer] = new List<string>
            {
                "PAYROLL.VIEW",
                "COMPLIANCE.VIEW",
                "REPORTS.VIEW", "REPORTS.EXPORT"
            },

            [RoleCodes.DeptManager] = new List<string>
            {
                "EMPLOYEE.VIEW",
                "ATTENDANCE.VIEW", "ATTENDANCE.APPROVE",
                "LEAVE.VIEW", "LEAVE.APPROVE", "LEAVE.REJECT",
                "PERFORMANCE.VIEW", "PERFORMANCE.EDIT"
            },

            [RoleCodes.Employee] = new List<string>
            {
                "LEAVE.CREATE", "LEAVE.VIEW",
                "ATTENDANCE.VIEW", "ATTENDANCE.CREATE",
                "PAYROLL.VIEW",
                "PERFORMANCE.VIEW"
            },

            [RoleCodes.Auditor] = new List<string>
            {
                "EMPLOYEE.VIEW",
                "ATTENDANCE.VIEW",
                "LEAVE.VIEW",
                "PAYROLL.VIEW",
                "COMPLIANCE.VIEW",
                "AUDIT.VIEW",
                "REPORTS.VIEW"
            }
        };

        // Add mappings to database
        var currentRolePermissions = await context.RolePermissions.ToListAsync();

        foreach (var mapping in rolePermissionsMapping)
        {
            var roleObj = dbRoles.FirstOrDefault(r => r.RoleCode == mapping.Key);
            if (roleObj == null) continue;

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

        // 8. Seed sample notifications for all users
        var currentNotifications = await context.Notifications.CountAsync();
        if (currentNotifications == 0)
        {
            var users = await context.Users.ToListAsync();
            foreach (var user in users)
            {
                context.Notifications.AddRange(new List<Notification>
                {
                    new Notification
                    {
                        NotificationId = Guid.NewGuid(),
                        UserId = user.UserId,
                        Title = "Welcome to IndiaHRMS!",
                        Message = $"Hello {user.FirstName}, your employee account has been successfully set up in the system.",
                        Type = NotificationType.System,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new Notification
                    {
                        NotificationId = Guid.NewGuid(),
                        UserId = user.UserId,
                        Title = "Profile Completion Reminder",
                        Message = "Please complete your educational qualifications and bank details in My Profile.",
                        Type = NotificationType.ProbationEndingSoon,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new Notification
                    {
                        NotificationId = Guid.NewGuid(),
                        UserId = user.UserId,
                        Title = "Monthly Payroll Run Initiated",
                        Message = "The payroll run for the current month has been initiated. Payslips will be available soon.",
                        Type = NotificationType.PayrollRunInitiated,
                        IsRead = true,
                        CreatedAt = DateTime.UtcNow.AddHours(-5)
                    },
                    new Notification
                    {
                        NotificationId = Guid.NewGuid(),
                        UserId = user.UserId,
                        Title = "Leave Policy Update",
                        Message = "The company has updated the carry-forward leave policy for this financial year.",
                        Type = NotificationType.General,
                        IsRead = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    }
                });
            }
            await context.SaveChangesAsync();
        }
    }
}
