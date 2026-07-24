using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using IndiaHRMS.Application.DTOs.Employee;
using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.Infrastructure.Services;

public class HiringService : IHiringService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;
    private readonly IEncryptionService _encryption;

    public HiringService(
        AppDbContext context,
        IMapper mapper,
        ICurrentUserService currentUser,
        IEncryptionService encryption)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
        _encryption = encryption;
    }

    public async Task<EmployeeDetailDto> ConvertCandidateToEmployeeAsync(
        Guid appId,
        ConvertCandidateRequest request,
        CancellationToken ct = default)
    {
        // 1. Fetch Job Application with candidate and requisition
        var app = await _context.JobApplications
            .Include(a => a.Requisition)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.AppId == appId, ct);

        if (app == null)
        {
            throw new InvalidOperationException("Job application not found.");
        }

        // 2. Perform validations
        var pending = new List<string>();
        if (app.TechnicalApproved != true) pending.Add("Technical Interview Approved");
        if (app.HrApproved != true) pending.Add("HR Interview Approved");
        if (app.ManagerApproved != true) pending.Add("Manager Discussion Approved");
        if (app.CurrentStage != ApplicationStage.Joined) pending.Add("Stage must be Joined");

        var timelineEvents = new List<TimelineEvent>();
        if (!string.IsNullOrEmpty(app.TimelineEventsJson))
        {
            try
            {
                timelineEvents = System.Text.Json.JsonSerializer.Deserialize<List<TimelineEvent>>(app.TimelineEventsJson) 
                                 ?? new List<TimelineEvent>();
            }
            catch { }
        }
        var events = timelineEvents.Select(e => e.Event).ToList();

        if (!events.Contains("Offer Accepted")) pending.Add("Offer Accepted");
        if (!events.Contains("Background Verification Passed")) pending.Add("Background Verification Passed");

        if (pending.Count > 0)
        {
            throw new InvalidOperationException($"Cannot create employee. The following requirements are still pending: {string.Join(", ", pending)}.");
        }

        // 3. Duplicate Protection
        var exists = await _context.Employees.AnyAsync(e =>
            e.CandidateId == app.CandidateId ||
            (e.OfficialEmail != null && e.OfficialEmail.ToLower() == app.Candidate.Email.ToLower().Trim()) ||
            (e.PersonalEmail != null && e.PersonalEmail.ToLower() == app.Candidate.Email.ToLower().Trim()), ct);

        if (exists)
        {
            throw new InvalidOperationException("Employee already exists.");
        }

        // Validate Department and Designation exist
        var deptExists = await _context.Departments.AnyAsync(d => d.DeptId == request.DeptId, ct);
        if (!deptExists)
        {
            throw new InvalidOperationException("Selected department does not exist.");
        }

        var desigExists = await _context.Designations.AnyAsync(d => d.DesignationId == request.DesignationId, ct);
        if (!desigExists)
        {
            throw new InvalidOperationException("Selected designation does not exist.");
        }

        // 4. Resolve default values for enterprise mandatory fields if not supplied
        var companyId = app.Requisition.CompanyId;
        
        var location = await _context.Locations.FirstOrDefaultAsync(l => l.CompanyId == companyId, ct)
                       ?? await _context.Locations.FirstOrDefaultAsync(ct);
        if (location == null)
        {
            throw new InvalidOperationException("No company locations configured. Cannot create employee.");
        }

        var shiftId = request.ShiftId;
        if (!shiftId.HasValue)
        {
            var shift = await _context.ShiftMasters.FirstOrDefaultAsync(s => s.CompanyId == companyId && s.IsActive, ct)
                        ?? await _context.ShiftMasters.FirstOrDefaultAsync(s => s.IsActive, ct);
            if (shift == null)
            {
                throw new InvalidOperationException("No active shift configured. Cannot create employee.");
            }
            shiftId = shift.ShiftId;
        }

        var gradeId = request.GradeId ?? app.Requisition.GradeId;
        if (!gradeId.HasValue)
        {
            var grade = await _context.GradeMasters.FirstOrDefaultAsync(g => g.CompanyId == companyId && g.IsActive, ct)
                        ?? await _context.GradeMasters.FirstOrDefaultAsync(g => g.IsActive, ct);
            if (grade == null)
            {
                throw new InvalidOperationException("No active grade configured. Cannot create employee.");
            }
            gradeId = grade.GradeId;
        }

        var costCenterId = request.CostCenterId;
        if (!costCenterId.HasValue)
        {
            var cc = await _context.CostCenters.FirstOrDefaultAsync(c => c.CompanyId == companyId && c.IsActive, ct)
                     ?? await _context.CostCenters.FirstOrDefaultAsync(c => c.IsActive, ct);
            costCenterId = cc?.CostCenterId;
        }

        var payrollGroup = request.PayrollGroup ?? PayrollGroup.Monthly;

        // 5. Generate Aadhaar and PAN if not in StageDataJson
        string? aadhar = null;
        string? pan = null;
        if (!string.IsNullOrEmpty(app.StageDataJson))
        {
            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(app.StageDataJson);
                if (dict != null)
                {
                    if (dict.TryGetValue("aadhar", out var aObj) && aObj != null) aadhar = aObj.ToString();
                    if (dict.TryGetValue("pan", out var pObj) && pObj != null) pan = pObj.ToString();
                }
            }
            catch { }
        }

        if (string.IsNullOrWhiteSpace(aadhar) || aadhar.Contains("*"))
        {
            var randomDigits = new Random().Next(1000, 9999);
            aadhar = $"11112222{randomDigits}";
        }
        if (string.IsNullOrWhiteSpace(pan) || pan.Contains("*"))
        {
            var randomDigits = new Random().Next(1000, 9999);
            pan = $"ABCDE{randomDigits}F";
        }

        var aadharHash = _encryption.HashValue(aadhar);
        var panHash = _encryption.HashValue(pan.ToUpper());

        // 6. Generate Employee Code
        var prefix = await _context.SystemSettings
            .Where(s => s.CompanyId == companyId && s.SettingKey == SystemSettingKeys.EmployeeIdPrefix)
            .Select(s => s.SettingValue)
            .FirstOrDefaultAsync(ct) ?? "EMP";

        var maxCode = await _context.Employees
            .Where(e => e.CompanyId == companyId && e.EmployeeCode.StartsWith(prefix))
            .Select(e => e.EmployeeCode)
            .OrderByDescending(c => c)
            .FirstOrDefaultAsync(ct);

        var nextNum = 1;
        if (maxCode != null && int.TryParse(maxCode[prefix.Length..], out var currentCode))
            nextNum = currentCode + 1;

        var employeeCode = $"{prefix}{nextNum:D4}";

        // 7. Create Employee entity
        var employee = new Employee
        {
            EmployeeId = Guid.NewGuid(),
            CompanyId = companyId,
            EmployeeCode = employeeCode,
            EmployeeCategory = "MPOnline Employee",
            FirstName = app.Candidate.FirstName,
            LastName = app.Candidate.LastName ?? string.Empty,
            PersonalEmail = app.Candidate.Email,
            OfficialEmail = $"{employeeCode.ToLower()}@acme.example.com",
            PersonalPhone = app.Candidate.Phone,
            CandidateId = app.CandidateId,
            JoiningDate = request.JoiningDate,
            DeptId = request.DeptId,
            DesignationId = request.DesignationId,
            LocationId = location.LocationId,
            ShiftId = shiftId,
            GradeId = gradeId,
            CostCenterId = costCenterId,
            PayrollGroup = payrollGroup,
            EmploymentType = request.EmploymentType,
            EmploymentStatus = EmploymentStatus.Active,
            IsActive = true,
            AadharNumber = _encryption.Encrypt(aadhar),
            AadharHash = aadharHash,
            PANNumber = _encryption.Encrypt(pan.ToUpper()),
            PANHash = panHash,
            ProbationEndDate = request.JoiningDate.AddDays(90),
            CreatedAt = DateTime.UtcNow
        };

        _context.Employees.Add(employee);

        // 8. Map Offered CTC to EmployeeSalary table
        decimal offeredCtc = 0;
        if (!string.IsNullOrEmpty(app.StageDataJson))
        {
            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(app.StageDataJson);
                if (dict != null && dict.TryGetValue("offeredCTC", out var ctcObj) && ctcObj != null)
                {
                    if (ctcObj is System.Text.Json.JsonElement elem && elem.ValueKind == System.Text.Json.JsonValueKind.Number)
                    {
                        offeredCtc = elem.GetDecimal();
                    }
                    else
                    {
                        decimal.TryParse(ctcObj.ToString(), out offeredCtc);
                    }
                }
            }
            catch { }
        }

        var structure = await _context.SalaryStructures.FirstOrDefaultAsync(s => s.IsActive, ct);
        if (structure != null)
        {
            var empSalary = new EmployeeSalary
            {
                EmpSalaryId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                StructureId = structure.StructureId,
                GrossCTC = offeredCtc,
                BasicSalary = offeredCtc * 0.4m,
                EffectiveFrom = request.JoiningDate,
                IsActive = true,
                RevisionReason = "New Hire CTC"
            };
            _context.EmployeeSalaries.Add(empSalary);
        }

        // 9. Generate User Account (inactive by default)
        var baseUsername = app.Candidate.Email.ToLower();
        var username = baseUsername;
        int suffix = 1;
        while (await _context.Users.AnyAsync(u => u.Username == username, ct))
        {
            username = $"{baseUsername}_{suffix}";
            suffix++;
        }

        var defaultPasswordSetting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.SettingKey == "DEFAULT_PASSWORD", ct);
        var password = defaultPasswordSetting?.SettingValue ?? "Welcome@123";
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

        var user = new User
        {
            UserId = Guid.NewGuid(),
            EmployeeId = employee.EmployeeId,
            Username = username,
            Email = app.Candidate.Email,
            FirstName = app.Candidate.FirstName,
            LastName = app.Candidate.LastName ?? string.Empty,
            PasswordHash = passwordHash,
            PasswordSalt = string.Empty,
            IsActive = false, // inactive by default
            MustChangePassword = true,
            CreatedAt = DateTime.UtcNow
        };

        var employeeRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == RoleCodes.Employee, ct);
        if (employeeRole != null)
        {
            user.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = employeeRole.RoleId,
                AssignedAt = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }
        _context.Users.Add(user);

        // 10. Update Candidate & JobApplication statuses
        app.Candidate.CandidateStatus = CandidateStatus.Hired;
        app.Status = "Completed";

        // 11. Generate timeline events
        string actor = _currentUser.Username ?? "System";
        if (_currentUser.EmployeeId.HasValue)
        {
            var currentEmp = await _context.Employees.FindAsync(new object[] { _currentUser.EmployeeId.Value }, ct);
            if (currentEmp != null)
            {
                actor = $"{currentEmp.FirstName} {currentEmp.LastName}";
            }
        }

        if (!events.Contains("Offer Accepted"))
        {
            TimelineHelper.AddTimelineEvent(app, "Offer Accepted", "Candidate accepted the offer", actor, "Offer", "BackgroundCheck");
        }
        if (!events.Contains("Background Verification Passed"))
        {
            TimelineHelper.AddTimelineEvent(app, "Background Verification Passed", "BGV cleared", actor, "BackgroundCheck", "Onboarding");
        }
        if (!events.Contains("Onboarding Completed"))
        {
            TimelineHelper.AddTimelineEvent(app, "Onboarding Completed", "Onboarding checklist completed", actor, "Onboarding", "Joined");
        }

        TimelineHelper.AddTimelineEvent(app, "Employee Created", $"Employee record created with code {employeeCode}", actor, "Joined", "Joined");
        TimelineHelper.AddTimelineEvent(app, "Recruitment Closed", "Recruitment pipeline closed and candidate hired", actor, "Joined", "Joined");

        // 12. Persist all changes
        await _context.SaveChangesAsync(ct);

        // 13. Map to DTO for response
        var result = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Include(e => e.Location)
            .Include(e => e.Grade)
            .Include(e => e.CostCenter)
            .Include(e => e.Shift)
            .FirstAsync(e => e.EmployeeId == employee.EmployeeId, ct);

        return _mapper.Map<EmployeeDetailDto>(result);
    }
}
