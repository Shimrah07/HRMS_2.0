using AutoMapper;
using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/probation")]
[ApiVersion("1.0")]
[Authorize]
public class ProbationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notificationService;

    public ProbationController(
        AppDbContext context,
        IMapper mapper,
        ICurrentUserService currentUser,
        INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
        _notificationService = notificationService;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetProbationers(CancellationToken ct)
    {
        var list = await _context.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .Where(e => e.EmploymentType == EmploymentType.Probationary && e.IsActive)
            .Select(e => new
            {
                e.EmployeeId,
                e.EmployeeCode,
                Name = $"{e.FirstName} {e.LastName}",
                DepartmentName = e.Department != null ? e.Department.DeptName : string.Empty,
                DesignationName = e.Designation != null ? e.Designation.Title : string.Empty,
                e.JoiningDate,
                e.ProbationEndDate,
                CompletedReviewsCount = _context.ProbationReviews.Count(r => r.EmployeeId == e.EmployeeId && r.Status == "Completed"),
                TotalReviewsCount = _context.ProbationReviews.Count(r => r.EmployeeId == e.EmployeeId)
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<object>>.Ok(list.Cast<object>().ToList()));
    }

    [HttpGet("{id:guid}/reviews")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.View)]
    public async Task<ActionResult<ApiResponse<List<ProbationReviewDto>>>> GetReviews(Guid id, CancellationToken ct)
    {
        var reviews = await _context.ProbationReviews
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .Where(r => r.EmployeeId == id)
            .OrderBy(r => r.CheckpointDays)
            .ToListAsync(ct);

        var dtos = _mapper.Map<List<ProbationReviewDto>>(reviews);
        return Ok(ApiResponse<List<ProbationReviewDto>>.Ok(dtos));
    }

    [HttpPost("reviews/{reviewId:guid}")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<ProbationReviewDto>>> SubmitReview(
        Guid reviewId,
        [FromBody] SubmitProbationReviewRequest request,
        CancellationToken ct)
    {
        var review = await _context.ProbationReviews
            .Include(r => r.Employee)
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId, ct);

        if (review == null)
        {
            return NotFound(ApiResponse<ProbationReviewDto>.Fail("Probation review checkpoint not found."));
        }

        if (review.Status == "Completed")
        {
            return BadRequest(ApiResponse<ProbationReviewDto>.Fail("Review checkpoint has already been completed."));
        }

        review.Rating = request.Rating;
        review.Comments = request.Comments;
        review.Status = "Completed";
        review.CompletedDate = DateOnly.FromDateTime(DateTime.UtcNow);
        review.ReviewerId = _currentUser.EmployeeId;

        // Write Audit Log
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers["User-Agent"].ToString() ?? "unknown";
        _context.AuditLogs.Add(new AuditLog
        {
            AuditLogId = Guid.NewGuid(),
            UserId = _currentUser.UserId,
            Action = "SubmitProbationReview",
            TableName = "ProbationReviews",
            RecordId = review.ReviewId.ToString(),
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { Rating = request.Rating, Checkpoint = review.CheckpointDays }),
            IPAddress = clientIp,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        // Reload to fetch mapped fields
        var savedReview = await _context.ProbationReviews
            .Include(r => r.Employee)
            .Include(r => r.Reviewer)
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId, ct);

        var dto = _mapper.Map<ProbationReviewDto>(savedReview);
        return Ok(ApiResponse<ProbationReviewDto>.Ok(dto, $"{review.CheckpointDays}-day probation review checkpoint submitted successfully."));
    }

    [HttpPost("{id:guid}/confirm")]
    [Filters.RequirePermission(PermissionCodes.Recruitment.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmProbation(
        Guid id,
        [FromBody] ConfirmProbationRequest request,
        CancellationToken ct)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == id, ct);
            if (employee == null)
            {
                return NotFound(ApiResponse<object>.Fail("Employee not found."));
            }

            if (employee.EmploymentType != EmploymentType.Probationary)
            {
                return BadRequest(ApiResponse<object>.Fail("Employee is not currently on probation."));
            }

            var action = request.Action.Trim().ToUpper();
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "unknown";

            if (action == "CONFIRM")
            {
                employee.EmploymentType = EmploymentType.Permanent;
                employee.ConfirmationDate = DateOnly.FromDateTime(DateTime.UtcNow);

                _context.SecurityAuditLogs.Add(new SecurityAuditLog
                {
                    LogId = Guid.NewGuid(),
                    EventType = "EMPLOYEE_CONFIRMED",
                    UserId = _currentUser.UserId,
                    Username = _currentUser.Username,
                    IpAddress = clientIp,
                    UserAgent = userAgent,
                    Details = $"Employee {employee.FirstName} {employee.LastName} ({employee.EmployeeCode}) confirmed. Status changed from Probationary to Permanent.",
                    IsSuccess = true,
                    CreatedAt = DateTime.UtcNow
                });

                _context.AuditLogs.Add(new AuditLog
                {
                    AuditLogId = Guid.NewGuid(),
                    UserId = _currentUser.UserId,
                    Action = "ConfirmProbation",
                    TableName = "Employees",
                    RecordId = employee.EmployeeId.ToString(),
                    NewValues = System.Text.Json.JsonSerializer.Serialize(new { EmploymentType = "Permanent", ConfirmationDate = employee.ConfirmationDate }),
                    IPAddress = clientIp,
                    UserAgent = userAgent,
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                // Notify Payroll and Employee
                await _notificationService.SendToRoleAsync(
                    RoleCodes.HRAdmin,
                    "Employee Confirmed",
                    $"Employee {employee.FirstName} {employee.LastName} has been successfully confirmed as Permanent.",
                    NotificationType.General
                );

                return Ok(ApiResponse<object>.Ok(null, "Employee successfully confirmed as permanent member."));
            }
            else if (action == "EXTEND")
            {
                if (!request.ExtensionDays.HasValue || request.ExtensionDays.Value <= 0)
                {
                    return BadRequest(ApiResponse<object>.Fail("Please specify a valid positive number of extension days."));
                }

                employee.ProbationEndDate = employee.ProbationEndDate?.AddDays(request.ExtensionDays.Value)
                    ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(request.ExtensionDays.Value));

                // Add an additional check review for the extension period
                var newCpDays = 90 + request.ExtensionDays.Value;
                var extendedReview = new ProbationReview
                {
                    ReviewId = Guid.NewGuid(),
                    EmployeeId = employee.EmployeeId,
                    CheckpointDays = newCpDays,
                    ReviewDueDate = employee.ProbationEndDate.Value,
                    Status = "Pending",
                    ReviewerId = _currentUser.EmployeeId
                };
                _context.ProbationReviews.Add(extendedReview);

                _context.AuditLogs.Add(new AuditLog
                {
                    AuditLogId = Guid.NewGuid(),
                    UserId = _currentUser.UserId,
                    Action = "ExtendProbation",
                    TableName = "Employees",
                    RecordId = employee.EmployeeId.ToString(),
                    NewValues = System.Text.Json.JsonSerializer.Serialize(new { ProbationEndDate = employee.ProbationEndDate }),
                    IPAddress = clientIp,
                    UserAgent = userAgent,
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                return Ok(ApiResponse<object>.Ok(null, $"Employee probation successfully extended by {request.ExtensionDays.Value} days."));
            }
            else if (action == "SEPARATE")
            {
                employee.IsActive = false;
                employee.EmploymentStatus = EmploymentStatus.Separated;

                _context.SecurityAuditLogs.Add(new SecurityAuditLog
                {
                    LogId = Guid.NewGuid(),
                    EventType = "EMPLOYEE_SEPARATED",
                    UserId = _currentUser.UserId,
                    Username = _currentUser.Username,
                    IpAddress = clientIp,
                    UserAgent = userAgent,
                    Details = $"Employee {employee.FirstName} {employee.LastName} ({employee.EmployeeCode}) separated during probation.",
                    IsSuccess = true,
                    CreatedAt = DateTime.UtcNow
                });

                _context.AuditLogs.Add(new AuditLog
                {
                    AuditLogId = Guid.NewGuid(),
                    UserId = _currentUser.UserId,
                    Action = "SeparateEmployee",
                    TableName = "Employees",
                    RecordId = employee.EmployeeId.ToString(),
                    NewValues = System.Text.Json.JsonSerializer.Serialize(new { IsActive = false, EmploymentStatus = "Separated" }),
                    IPAddress = clientIp,
                    UserAgent = userAgent,
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                return Ok(ApiResponse<object>.Ok(null, "Employee separated successfully during probation."));
            }
            else
            {
                return BadRequest(ApiResponse<object>.Fail("Invalid action type. Expected: Confirm, Extend, or Separate."));
            }
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}
