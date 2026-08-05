using AutoMapper;
using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Infrastructure.Services;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/onboarding")]
[ApiVersion("1.0")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly OnboardingOrchestrator _orchestrator;
    private readonly ICurrentUserService _currentUser;

    public OnboardingController(
        AppDbContext context,
        IMapper mapper,
        INotificationService notificationService,
        OnboardingOrchestrator orchestrator,
        ICurrentUserService currentUser)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
        _orchestrator = orchestrator;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<OnboardingProcessDto>>>> GetOnboardingProcesses(CancellationToken ct)
    {
        var query = _context.OnboardingProcesses
            .Include(o => o.Candidate)
            .Include(o => o.BuddyEmployee)
            .AsQueryable();

        var list = await query.OrderByDescending(o => o.CreatedAt).ToListAsync(ct);
        var dtos = _mapper.Map<List<OnboardingProcessDto>>(list);

        foreach (var dto in dtos)
        {
            dto.Progress = await _orchestrator.CalculateProgressAsync(dto.OnboardingId, _context, ct);
            dto.Sla = await _orchestrator.GetSlaSummaryAsync(dto.OnboardingId, _context, ct);
        }

        return Ok(ApiResponse<List<OnboardingProcessDto>>.Ok(dtos));
    }

    [HttpGet("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<OnboardingProcessDto>>> GetOnboardingProcess(Guid id, CancellationToken ct)
    {
        var process = await _context.OnboardingProcesses
            .Include(o => o.Candidate)
            .Include(o => o.BuddyEmployee)
            .FirstOrDefaultAsync(o => o.OnboardingId == id, ct);

        if (process == null)
        {
            return NotFound(ApiResponse<OnboardingProcessDto>.Fail("Onboarding process not found."));
        }

        var dto = _mapper.Map<OnboardingProcessDto>(process);
        dto.Progress = await _orchestrator.CalculateProgressAsync(id, _context, ct);
        dto.Sla = await _orchestrator.GetSlaSummaryAsync(id, _context, ct);
        return Ok(ApiResponse<OnboardingProcessDto>.Ok(dto));
    }

    [HttpPut("{id:guid}/checklist")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<OnboardingProcessDto>>> UpdateChecklist(
        Guid id,
        [FromBody] OnboardingChecklistUpdateRequest request,
        CancellationToken ct)
    {
        var process = await _context.OnboardingProcesses
            .Include(o => o.Candidate)
            .FirstOrDefaultAsync(o => o.OnboardingId == id, ct);

        if (process == null)
        {
            return NotFound(ApiResponse<OnboardingProcessDto>.Fail("Onboarding process not found."));
        }

        var dept = request.Department.Trim().ToUpper();
        if (dept == "HR")
        {
            process.HRChecklistJson = request.ChecklistJson;
        }
        else if (dept == "IT")
        {
            process.ITChecklistJson = request.ChecklistJson;
        }
        else if (dept == "ADMIN")
        {
            process.AdminChecklistJson = request.ChecklistJson;
        }
        else
        {
            return BadRequest(ApiResponse<OnboardingProcessDto>.Fail("Invalid department. Valid departments are: HR, IT, Admin."));
        }

        await _context.SaveChangesAsync(ct);

        var dto = _mapper.Map<OnboardingProcessDto>(process);
        return Ok(ApiResponse<OnboardingProcessDto>.Ok(dto, "Checklist updated successfully."));
    }

    [HttpPut("{id:guid}/assign")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<OnboardingProcessDto>>> AssignBuddyAndAsset(
        Guid id,
        [FromBody] AssignBuddyAssetRequest request,
        CancellationToken ct)
    {
        var process = await _context.OnboardingProcesses
            .Include(o => o.Candidate)
            .FirstOrDefaultAsync(o => o.OnboardingId == id, ct);

        if (process == null)
        {
            return NotFound(ApiResponse<OnboardingProcessDto>.Fail("Onboarding process not found."));
        }

        if (request.BuddyEmployeeId.HasValue)
        {
            var buddyExists = await _context.Employees.AnyAsync(e => e.EmployeeId == request.BuddyEmployeeId.Value, ct);
            if (!buddyExists)
            {
                return BadRequest(ApiResponse<OnboardingProcessDto>.Fail("Assigned buddy employee not found."));
            }
            process.BuddyEmployeeId = request.BuddyEmployeeId;
        }

        if (request.AssetAllocation != null)
        {
            process.AssetAllocation = request.AssetAllocation;
        }

        if (request.InductionSchedule != null)
        {
            process.InductionSchedule = request.InductionSchedule;
        }

        await _context.SaveChangesAsync(ct);

        // Reload to map buddy details
        var savedProcess = await _context.OnboardingProcesses
            .Include(o => o.Candidate)
            .Include(o => o.BuddyEmployee)
            .FirstOrDefaultAsync(o => o.OnboardingId == id, ct);

        var dto = _mapper.Map<OnboardingProcessDto>(savedProcess);
        return Ok(ApiResponse<OnboardingProcessDto>.Ok(dto, "Buddy and assets updated successfully."));
    }

    [HttpGet("{id:guid}/tasks")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<OnboardingTaskDto>>>> GetTasks(Guid id, CancellationToken ct)
    {
        var tasks = await _context.OnboardingTasks
            .Include(t => t.Owner)
            .Where(t => t.OnboardingId == id)
            .ToListAsync(ct);
        var dtos = _mapper.Map<List<OnboardingTaskDto>>(tasks);
        return Ok(ApiResponse<List<OnboardingTaskDto>>.Ok(dtos));
    }

    [HttpPut("tasks/{taskId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<OnboardingTaskDto>>> UpdateTask(
        Guid taskId,
        [FromBody] UpdateOnboardingTaskRequest request,
        CancellationToken ct)
    {
        var task = await _context.OnboardingTasks
            .Include(t => t.OnboardingProcess)
            .FirstOrDefaultAsync(t => t.TaskId == taskId, ct);

        if (task == null)
        {
            return NotFound(ApiResponse<OnboardingTaskDto>.Fail("Task not found."));
        }

        var oldStatus = task.Status;
        if (!string.IsNullOrEmpty(request.Status))
        {
            task.Status = request.Status;
            if (request.Status == "Completed")
            {
                task.CompletionDate = DateOnly.FromDateTime(DateTime.UtcNow);
            }
        }
        if (request.Remarks != null)
        {
            task.Remarks = request.Remarks;
        }
        if (request.AttachmentPath != null)
        {
            task.AttachmentPath = request.AttachmentPath;
        }
        if (request.OwnerId.HasValue)
        {
            var owner = await _context.Employees.FindAsync(new object[] { request.OwnerId.Value }, ct);
            if (owner == null)
            {
                return BadRequest(ApiResponse<OnboardingTaskDto>.Fail("Assigned owner employee not found."));
            }
            task.OwnerId = request.OwnerId;
            task.OwnerName = $"{owner.FirstName} {owner.LastName}";
        }

        // Record Task Audit History
        var auditEntry = new
        {
            updatedBy = _currentUser.Username ?? "System",
            timestamp = DateTime.UtcNow,
            fromStatus = oldStatus,
            toStatus = task.Status,
            remarks = request.Remarks
        };
        var history = System.Text.Json.JsonSerializer.Deserialize<List<object>>(task.AuditHistoryJson) ?? new List<object>();
        history.Add(auditEntry);
        task.AuditHistoryJson = System.Text.Json.JsonSerializer.Serialize(history);

        await _context.SaveChangesAsync(ct);

        // Re-calculate onboarding overall progress and update OnboardingProcess status if needed
        await _orchestrator.CalculateProgressAsync(task.OnboardingId, _context, ct);

        // Write Audit Log
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers["User-Agent"].ToString() ?? "unknown";
        _context.AuditLogs.Add(new AuditLog
        {
            AuditLogId = Guid.NewGuid(),
            UserId = _currentUser.UserId,
            Action = "Update Onboarding Task",
            TableName = "OnboardingTasks",
            RecordId = task.TaskId.ToString(),
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { Status = task.Status, OwnerId = task.OwnerId }),
            IPAddress = clientIp,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync(ct);

        // Check if task is IT- laptop provisioning or similar and notify candidate or IT admin
        if (task.Department == "IT" && task.TaskName.Contains("Laptop") && task.Status == "Completed")
        {
            await _notificationService.SendToRoleAsync(RoleCodes.Employee, "Laptop Assigned", "Your laptop setup has been completed by IT and is ready for Day 1.", NotificationType.General);
        }

        var dto = _mapper.Map<OnboardingTaskDto>(task);
        return Ok(ApiResponse<OnboardingTaskDto>.Ok(dto, "Task updated successfully."));
    }

    [HttpPost("{id:guid}/convert")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> ConvertToEmployee(Guid id, [FromBody] ConvertOnboardingRequest? request, CancellationToken ct)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var process = await _context.OnboardingProcesses
                .Include(o => o.Candidate)
                .FirstOrDefaultAsync(o => o.OnboardingId == id, ct);

            if (process == null)
            {
                return NotFound(ApiResponse<object>.Fail("Onboarding process not found."));
            }

            if (process.Status == "Completed")
            {
                return BadRequest(ApiResponse<object>.Fail("Candidate has already been onboarded."));
            }

            var candidate = process.Candidate;

            // 1. Duplicate Employee Detection
            var matchingEmp = await _context.Employees.FirstOrDefaultAsync(e =>
                (e.OfficialEmail == candidate.Email || e.PersonalEmail == candidate.Email) ||
                (!string.IsNullOrEmpty(candidate.Phone) && (e.PersonalPhone == candidate.Phone || e.OfficialMobile == candidate.Phone)), ct);

            if (matchingEmp != null && (request == null || !request.ForceConvert))
            {
                return BadRequest(ApiResponse<object>.Fail($"POTENTIAL_DUPLICATE: Candidate matches existing Employee Master record ({matchingEmp.EmployeeCode} - {matchingEmp.FirstName} {matchingEmp.LastName}). Send forceConvert=true to bypass."));
            }

            // Verify active job application
            var app = await _context.JobApplications
                .Include(a => a.Requisition)
                .FirstOrDefaultAsync(a => a.CandidateId == candidate.CandidateId && a.CurrentStage != ApplicationStage.Rejected, ct);

            if (app == null)
            {
                return BadRequest(ApiResponse<object>.Fail("Active Job Application or Requisition not found for candidate. Cannot onboard."));
            }

            // 2. Pre-flight Mapping Validation
            var deptId = request?.DeptId ?? app.Requisition?.DeptId;
            var designationId = request?.DesignationId ?? app.Requisition?.DesignationId;
            var companyId = request?.CompanyId ?? app.Requisition?.CompanyId;
            Guid? locationId = request?.LocationId ?? (await _context.Locations.Select(l => (Guid?)l.LocationId).FirstOrDefaultAsync(ct));
            var reportingManagerId = request?.ReportingManagerId;

            var missingFields = new List<string>();
            if (!deptId.HasValue || deptId.Value == Guid.Empty) missingFields.Add("Department");
            if (!designationId.HasValue || designationId.Value == Guid.Empty) missingFields.Add("Designation");
            if (!companyId.HasValue || companyId.Value == Guid.Empty) missingFields.Add("Company");
            if (!locationId.HasValue || locationId.Value == Guid.Empty) missingFields.Add("Location");

            if (missingFields.Count > 0)
            {
                return BadRequest(ApiResponse<object>.Fail($"UNMAPPED_FIELDS: The following required mappings are missing: {string.Join(", ", missingFields)}."));
            }

            // 3. Sequential Employee Code Generator (EMP0001, EMP0002, EMP0003)
            var prefix = await _context.SystemSettings
                .Where(s => s.SettingKey == SystemSettingKeys.EmployeeIdPrefix)
                .Select(s => s.SettingValue)
                .FirstOrDefaultAsync(ct) ?? "EMP";

            var lastCode = await _context.Employees
                .Where(e => e.EmployeeCode.StartsWith(prefix))
                .OrderByDescending(e => e.EmployeeCode)
                .Select(e => e.EmployeeCode)
                .FirstOrDefaultAsync(ct);

            int nextSeq = 1;
            if (!string.IsNullOrEmpty(lastCode))
            {
                var numPart = new string(lastCode.Where(char.IsDigit).ToArray());
                if (int.TryParse(numPart, out var parsed)) nextSeq = parsed + 1;
            }
            var empCode = $"{prefix}{nextSeq:D4}";

            // Calculate corporate email
            var domain = "company.com";
            var company = await _context.Companies.FirstOrDefaultAsync(ct);
            if (company != null && !string.IsNullOrEmpty(company.Website))
            {
                try
                {
                    var uri = new Uri(company.Website.StartsWith("http") ? company.Website : "http://" + company.Website);
                    domain = uri.Host.Replace("www.", "");
                }
                catch {}
            }
            var officialEmail = $"{candidate.FirstName.ToLower().Replace(" ", "")}.{candidate.LastName?.ToLower().Replace(" ", "")}@{domain}";

            // Determine probation days
            var probationDays = 180;
            var settingsProbation = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "ProbationDurationDays", ct);
            if (settingsProbation != null && int.TryParse(settingsProbation.SettingValue, out var days))
            {
                probationDays = days;
            }

            // Retrieve Joining Date from Offer Letter
            var offer = await _context.OfferLetters.FirstOrDefaultAsync(o => o.AppId == app.AppId, ct);
            var joiningDate = offer?.JoiningDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

            // Create Employee
            var employee = new Employee
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeCode = empCode,
                FirstName = candidate.FirstName,
                LastName = candidate.LastName ?? string.Empty,
                PersonalEmail = candidate.Email,
                OfficialEmail = officialEmail,
                PersonalPhone = candidate.Phone,
                OfficialMobile = candidate.Phone,
                CompanyId = companyId.Value,
                DeptId = deptId.Value,
                DesignationId = designationId.Value,
                LocationId = locationId.Value,
                ReportingManagerId = reportingManagerId,
                EmploymentType = EmploymentType.Probationary,
                EmploymentStatus = EmploymentStatus.Active,
                ProbationEndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(probationDays)),
                RecruitmentSource = candidate.Source?.ToString() ?? "CareerPortal",
                IsActive = true
            };

            _context.Employees.Add(employee);

            // Create corresponding User Login credentials
            var salt = Guid.NewGuid().ToString("N");
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123", 12);
            var user = new User
            {
                UserId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                Username = officialEmail,
                Email = officialEmail,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                PasswordHash = passwordHash,
                PasswordSalt = salt,
                IsActive = true,
                MustChangePassword = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            // Assign EMPLOYEE role to this user
            var empRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == RoleCodes.Employee, ct);
            if (empRole != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserRoleId = Guid.NewGuid(),
                    UserId = user.UserId,
                    RoleId = empRole.RoleId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Map Resume as Employee Document if available
            if (!string.IsNullOrEmpty(candidate.ResumeFilePath))
            {
                var doc = new EmployeeDocument
                {
                    DocId = Guid.NewGuid(),
                    EmployeeId = employee.EmployeeId,
                    DocType = DocumentType.Other,
                    DocName = Path.GetFileName(candidate.ResumeFilePath) ?? "Resume.pdf",
                    FilePath = candidate.ResumeFilePath,
                    IsVerified = true,
                    UploadedAt = DateTime.UtcNow
                };
                _context.EmployeeDocuments.Add(doc);
            }

            // Update onboarding status and Candidate status
            process.Status = "Completed";
            app.CurrentStage = ApplicationStage.Joined;
            candidate.CandidateStatus = CandidateStatus.Hired;

            TimelineHelper.AddTimelineEvent(app, "Hired", $"Candidate successfully converted to Employee {employee.EmployeeCode} on Probation.");

            // Generate 30, 60, 90 day probation reviews
            var checkPoints = new[] { 30, 60, 90 };
            foreach (var cp in checkPoints)
            {
                var review = new ProbationReview
                {
                    ReviewId = Guid.NewGuid(),
                    EmployeeId = employee.EmployeeId,
                    CheckpointDays = cp,
                    ReviewDueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(cp)),
                    Status = "Pending",
                    ReviewerId = process.BuddyEmployeeId
                };
                _context.ProbationReviews.Add(review);
            }

            // Record transition history
            var history = System.Text.Json.JsonSerializer.Deserialize<List<object>>(process.TransitionHistoryJson) ?? new List<object>();
            history.Add(new
            {
                fromState = "PreJoining",
                toState = "Completed",
                updatedBy = _currentUser.Username ?? "HR_ADMIN",
                timestamp = DateTime.UtcNow,
                remarks = "Candidate converted to employee. Probation reviews initialized."
            });
            process.TransitionHistoryJson = System.Text.Json.JsonSerializer.Serialize(history);

            // Write Audit Log
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "unknown";
            _context.AuditLogs.Add(new AuditLog
            {
                AuditLogId = Guid.NewGuid(),
                UserId = _currentUser.UserId,
                Action = "ConvertToEmployee",
                TableName = "Employees",
                RecordId = employee.EmployeeId.ToString(),
                NewValues = System.Text.Json.JsonSerializer.Serialize(new { EmployeeCode = empCode, EmploymentType = "Probationary" }),
                IPAddress = clientIp,
                UserAgent = userAgent,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            // Notify HR Admin
            await _notificationService.SendToRoleAsync(
                RoleCodes.HRAdmin,
                "Employee Created",
                $"Employee record for {employee.FirstName} {employee.LastName} ({employee.EmployeeCode}) created successfully on Probation.",
                NotificationType.General
            );

            return Ok(ApiResponse<object>.Ok(new { employee.EmployeeId, employee.EmployeeCode }, "Candidate successfully converted to Employee Master on Probation."));
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}

public class ConvertOnboardingRequest
{
    public Guid? CompanyId { get; set; }
    public Guid? DeptId { get; set; }
    public Guid? DesignationId { get; set; }
    public Guid? LocationId { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public string? EmploymentType { get; set; }
    public DateOnly? JoiningDate { get; set; }
    public string? CostCenter { get; set; }
    public bool ForceConvert { get; set; } = false;
}
