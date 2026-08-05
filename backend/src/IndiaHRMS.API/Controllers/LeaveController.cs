using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Shared;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v1/leave")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly AppDbContext _ctx;
    private readonly ICurrentUserService _currentUser;
    private readonly IReportingScopeService _reportingScope;

    public LeaveController(AppDbContext ctx, ICurrentUserService currentUser, IReportingScopeService reportingScope)
    {
        _ctx = ctx;
        _currentUser = currentUser;
        _reportingScope = reportingScope;
    }

    /// <summary>GET /api/v1/leave/types — List active leave types for current company</summary>
    [HttpGet("types")]
    public async Task<ActionResult<ApiResponse<object>>> GetLeaveTypes(CancellationToken ct)
    {
        var types = await _ctx.LeaveTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.LeaveTypeName)
            .Select(t => new {
                t.LeaveTypeId,
                t.LeaveTypeName,
                t.LeaveCode,
                t.MaxDaysPerYear,
                t.IsPaidLeave,
                t.IsCarryForward
            })
            .ToListAsync(ct);

        if (!types.Any())
        {
            // Fallback default leave types
            var defaults = new[]
            {
                new { LeaveTypeId = Guid.Parse("20000000-0000-0000-0000-000000000001"), LeaveTypeName = "Paid Leave", LeaveCode = "PL", MaxDaysPerYear = 12, IsPaidLeave = true, IsCarryForward = true },
                new { LeaveTypeId = Guid.Parse("20000000-0000-0000-0000-000000000002"), LeaveTypeName = "Casual Leave", LeaveCode = "CL", MaxDaysPerYear = 6, IsPaidLeave = true, IsCarryForward = false },
                new { LeaveTypeId = Guid.Parse("20000000-0000-0000-0000-000000000003"), LeaveTypeName = "Sick Leave", LeaveCode = "SL", MaxDaysPerYear = 6, IsPaidLeave = true, IsCarryForward = false },
                new { LeaveTypeId = Guid.Parse("20000000-0000-0000-0000-000000000004"), LeaveTypeName = "Comp Off", LeaveCode = "CompOff", MaxDaysPerYear = 5, IsPaidLeave = true, IsCarryForward = false }
            };
            return Ok(ApiResponse<object>.Ok(defaults));
        }

        return Ok(ApiResponse<object>.Ok(types));
    }

    /// <summary>GET /api/v1/leave/balances — Get logged in employee's leave balance (or specific employee if authorized)</summary>
    [HttpGet("balances")]
    public async Task<ActionResult<ApiResponse<object>>> GetBalances([FromQuery] Guid? employeeId, CancellationToken ct)
    {
        var myEmpId = _currentUser.EmployeeId;
        var targetEmpId = employeeId ?? myEmpId;

        if (!targetEmpId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee linked to current user profile."));

        // Scoping check: if viewing someone else, must be HR Admin or their Reporting Manager
        if (targetEmpId.Value != myEmpId)
        {
            var isHr = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.HRManager);
            var isManager = false;

            if (myEmpId.HasValue)
            {
                var emp = await _ctx.Employees.FirstOrDefaultAsync(e => e.EmployeeId == targetEmpId.Value, ct);
                if (emp != null && (emp.ReportingManagerId == myEmpId.Value || emp.L2ReportingManagerId == myEmpId.Value))
                {
                    isManager = true;
                }
            }

            if (!isHr && !isManager)
            {
                return StatusCode(403, ApiResponse<object>.Fail("Access denied. You can only view your own leave balance or direct reports' balances."));
            }
        }

        var year = DateTime.UtcNow.Year;
        var balances = await _ctx.LeaveBalances
            .Include(b => b.LeaveType)
            .Where(b => b.EmployeeId == targetEmpId.Value && b.Year == year)
            .ToListAsync(ct);

        if (!balances.Any())
        {
            // Default response structure
            var defaults = new { PL = 12, CL = 6, SL = 6, CompOff = 2 };
            return Ok(ApiResponse<object>.Ok(defaults));
        }

        var result = balances.ToDictionary(b => b.LeaveType.LeaveCode, b => b.ClosingBalance);
        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>GET /api/v1/leave/my-applications — List leave applications for logged in employee</summary>
    [HttpGet("my-applications")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyApplications(CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
            return Ok(ApiResponse<object>.Ok(new List<object>()));

        var list = await _ctx.LeaveApplications
            .Include(a => a.LeaveType)
            .Where(a => a.EmployeeId == empId.Value)
            .OrderByDescending(a => a.AppliedAt)
            .Select(a => new {
                a.LeaveAppId,
                a.LeaveTypeId,
                LeaveTypeName = a.LeaveType.LeaveTypeName,
                LeaveCode = a.LeaveType.LeaveCode,
                a.FromDate,
                a.ToDate,
                a.TotalDays,
                a.IsHalfDay,
                a.Reason,
                Status = a.Status.ToString(),
                a.AppliedAt,
                a.ApprovedAt,
                a.RejectionReason
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(list));
    }

    /// <summary>POST /api/v1/leave/apply — Submit a leave application</summary>
    [HttpPost("apply")]
    public async Task<ActionResult<ApiResponse<object>>> ApplyLeave([FromBody] ApplyLeaveDto dto, CancellationToken ct)
    {
        var empId = _currentUser.EmployeeId;
        if (!empId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile found for logged-in user."));

        if (dto.FromDate > dto.ToDate)
            return BadRequest(ApiResponse<object>.Fail("FromDate cannot be after ToDate."));

        var emp = await _ctx.Employees.FirstOrDefaultAsync(e => e.EmployeeId == empId.Value, ct);
        if (emp == null)
            return NotFound(ApiResponse<object>.Fail("Employee not found."));

        // Calculate days
        var totalDays = dto.IsHalfDay ? 0.5m : (dto.ToDate.DayNumber - dto.FromDate.DayNumber + 1);

        var leaveType = await _ctx.LeaveTypes.FirstOrDefaultAsync(t => t.LeaveTypeId == dto.LeaveTypeId || t.LeaveCode == dto.LeaveCode, ct);
        Guid leaveTypeId;
        if (leaveType == null)
        {
            // Use default PL type if not present
            var firstType = await _ctx.LeaveTypes.FirstOrDefaultAsync(ct);
            leaveTypeId = firstType?.LeaveTypeId ?? Guid.NewGuid();
        }
        else
        {
            leaveTypeId = leaveType.LeaveTypeId;
        }

        var app = new LeaveApplication
        {
            LeaveAppId = Guid.NewGuid(),
            EmployeeId = empId.Value,
            LeaveTypeId = leaveTypeId,
            FromDate = dto.FromDate,
            ToDate = dto.ToDate,
            TotalDays = totalDays,
            IsHalfDay = dto.IsHalfDay,
            Reason = dto.Reason,
            Status = LeaveStatus.Pending,
            AppliedAt = DateTime.UtcNow
        };

        _ctx.LeaveApplications.Add(app);
        await _ctx.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(new { app.LeaveAppId, app.Status, totalDays }, "Leave application submitted successfully."));
    }

    /// <summary>GET /api/v1/leave/team-applications — Direct reports' pending/processed leave applications for managers</summary>
    [HttpGet("team-applications")]
    public async Task<ActionResult<ApiResponse<object>>> GetTeamApplications(CancellationToken ct)
    {
        var myEmpId = _currentUser.EmployeeId ?? Guid.Empty;
        var isHr = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.HRManager);

        IQueryable<LeaveApplication> query = _ctx.LeaveApplications
            .Include(a => a.Employee)
            .Include(a => a.LeaveType);

        if (!isHr)
        {
            var directReportIds = await _reportingScope.GetDirectReportIdsAsync(myEmpId, ct);
            if (!directReportIds.Any())
                return Ok(ApiResponse<object>.Ok(new List<object>(), "This manager has no direct reports."));

            query = query.Where(a => directReportIds.Contains(a.EmployeeId));
        }

        var list = await query
            .OrderByDescending(a => a.AppliedAt)
            .Select(a => new {
                a.LeaveAppId,
                a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " + a.Employee.LastName,
                EmployeeCode = a.Employee.EmployeeCode,
                a.LeaveTypeId,
                LeaveTypeName = a.LeaveType.LeaveTypeName,
                a.FromDate,
                a.ToDate,
                a.TotalDays,
                a.Reason,
                Status = a.Status.ToString(),
                a.AppliedAt
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(list));
    }

    /// <summary>GET /api/v1/leave/all-applications — Org-wide view of all leave applications for HR Admins & Auditors</summary>
    [HttpGet("all-applications")]
    public async Task<ActionResult<ApiResponse<object>>> GetAllApplications(CancellationToken ct)
    {
        var isHrOrAuditor = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin, RoleCodes.HRManager, RoleCodes.Auditor, RoleCodes.FinanceHead);
        if (!isHrOrAuditor)
        {
            return StatusCode(403, ApiResponse<object>.Fail("Access restricted to HR Admins, Auditors, and Super Admins."));
        }

        var list = await _ctx.LeaveApplications
            .Include(a => a.Employee)
            .Include(a => a.LeaveType)
            .OrderByDescending(a => a.AppliedAt)
            .Select(a => new {
                a.LeaveAppId,
                a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " + a.Employee.LastName,
                EmployeeCode = a.Employee.EmployeeCode,
                a.LeaveTypeId,
                LeaveTypeName = a.LeaveType.LeaveTypeName,
                a.FromDate,
                a.ToDate,
                a.TotalDays,
                a.Reason,
                Status = a.Status.ToString(),
                a.AppliedAt
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(list));
    }

    /// <summary>POST /api/v1/leave/approve/{appId} — Approve leave application (with Self-Approval Guard)</summary>
    [HttpPost("approve/{appId}")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveLeave(Guid appId, CancellationToken ct)
    {
        var app = await _ctx.LeaveApplications.Include(a => a.Employee).FirstOrDefaultAsync(a => a.LeaveAppId == appId, ct);
        if (app == null)
            return NotFound(ApiResponse<object>.Fail("Leave application not found."));

        var myEmpId = _currentUser.EmployeeId;
        var myUserId = _currentUser.UserId;
        var isHr = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin);

        // 1. SELF-APPROVAL PREVENTION GUARD
        if (myEmpId.HasValue && app.EmployeeId == myEmpId.Value)
        {
            return BadRequest(ApiResponse<object>.Fail("Self-Approval Rejected: Managers cannot approve their own leave requests. Route request to HR or senior manager."));
        }

        // 2. SCOPING GUARD FOR NON-HR MANAGERS
        if (!isHr)
        {
            if (!myEmpId.HasValue || (app.Employee.ReportingManagerId != myEmpId.Value && app.Employee.L2ReportingManagerId != myEmpId.Value))
            {
                return StatusCode(403, ApiResponse<object>.Fail("Forbidden: You can only approve leave applications for your direct reports."));
            }
        }

        app.Status = LeaveStatus.Approved;
        app.ApproverId = myUserId;
        app.ApprovedAt = DateTime.UtcNow;

        await _ctx.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { app.LeaveAppId, Status = "Approved" }, "Leave application approved successfully."));
    }

    /// <summary>POST /api/v1/leave/reject/{appId} — Reject leave application</summary>
    [HttpPost("reject/{appId}")]
    public async Task<ActionResult<ApiResponse<object>>> RejectLeave(Guid appId, [FromBody] RejectLeaveDto dto, CancellationToken ct)
    {
        var app = await _ctx.LeaveApplications.Include(a => a.Employee).FirstOrDefaultAsync(a => a.LeaveAppId == appId, ct);
        if (app == null)
            return NotFound(ApiResponse<object>.Fail("Leave application not found."));

        var myEmpId = _currentUser.EmployeeId;
        var isHr = _currentUser.HasAnyRole(RoleCodes.SuperAdmin, RoleCodes.HRAdmin);

        // Self rejection check
        if (myEmpId.HasValue && app.EmployeeId == myEmpId.Value)
        {
            return BadRequest(ApiResponse<object>.Fail("Self-Action Rejected: Cannot reject your own leave request."));
        }

        if (!isHr)
        {
            if (!myEmpId.HasValue || (app.Employee.ReportingManagerId != myEmpId.Value && app.Employee.L2ReportingManagerId != myEmpId.Value))
            {
                return StatusCode(403, ApiResponse<object>.Fail("Forbidden: You can only reject leave applications for your direct reports."));
            }
        }

        app.Status = LeaveStatus.Rejected;
        app.RejectionReason = dto.Reason ?? "Rejected by manager.";

        await _ctx.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { app.LeaveAppId, Status = "Rejected" }, "Leave application rejected."));
    }
}

public class ApplyLeaveDto
{
    public Guid LeaveTypeId { get; set; }
    public string? LeaveCode { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public bool IsHalfDay { get; set; }
    public string? Reason { get; set; }
}

public class RejectLeaveDto
{
    public string? Reason { get; set; }
}
