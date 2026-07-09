using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Infrastructure.Services;
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
[Route("api/v{version:apiVersion}/dashboard/onboarding")]
[ApiVersion("1.0")]
[Authorize]
public class DashboardOnboardingController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly OnboardingOrchestrator _orchestrator;

    public DashboardOnboardingController(
        AppDbContext context,
        ICurrentUserService currentUser,
        OnboardingOrchestrator orchestrator)
    {
        _context = context;
        _currentUser = currentUser;
        _orchestrator = orchestrator;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<object>>> GetOnboardingSummary(CancellationToken ct)
    {
        var roles = _currentUser.Roles.ToList();
        var isHR = roles.Any(r => string.Equals(r, RoleCodes.HRAdmin, StringComparison.OrdinalIgnoreCase) || string.Equals(r, "HR", StringComparison.OrdinalIgnoreCase));
        var isIT = roles.Any(r => string.Equals(r, "IT", StringComparison.OrdinalIgnoreCase) || string.Equals(r, "ITAdmin", StringComparison.OrdinalIgnoreCase));
        var isAdminDept = roles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) || string.Equals(r, "AdminAdmin", StringComparison.OrdinalIgnoreCase));
        var isManager = roles.Any(r => string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase) || string.Equals(r, "DeptManager", StringComparison.OrdinalIgnoreCase));

        // Determine department filter
        string? targetDept = null;
        if (!isHR)
        {
            if (isIT) targetDept = "IT";
            else if (isAdminDept) targetDept = "Admin";
            else if (isManager) targetDept = "Manager";
            else targetDept = "Employee";
        }

        // Fetch onboarding tasks
        var tasksQuery = _context.OnboardingTasks
            .Include(t => t.OnboardingProcess)
                .ThenInclude(op => op.Candidate)
            .AsQueryable();

        if (targetDept != null)
        {
            tasksQuery = tasksQuery.Where(t => t.Department == targetDept);
        }

        var allTasks = await tasksQuery.ToListAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Compute SLA metrics
        var completed = allTasks.Count(t => string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase));
        var overdue = allTasks.Count(t => !string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value < today);
        var dueToday = allTasks.Count(t => !string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value == today);
        var upcoming = allTasks.Count(t => !string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value > today);
        var escalated = allTasks.Count(t => string.Equals(t.Status, "Blocked", StringComparison.OrdinalIgnoreCase) || (!string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value < today.AddDays(-3)));

        // Overall progress calculations
        var activeOnboardings = await _context.OnboardingProcesses
            .Include(op => op.Candidate)
            .Where(op => op.Status != "Completed")
            .ToListAsync(ct);

        var progressList = new List<object>();
        foreach (var op in activeOnboardings)
        {
            var progress = await _orchestrator.CalculateProgressAsync(op.OnboardingId, _context, ct);
            progressList.Add(new
            {
                op.OnboardingId,
                CandidateName = $"{op.Candidate.FirstName} {op.Candidate.LastName}",
                op.Status,
                op.CreatedAt,
                OverallProgress = progress.OverallProgress,
                HrProgress = progress.HrProgress,
                ItProgress = progress.ItProgress,
                AdminProgress = progress.AdminProgress,
                EmployeeProgress = progress.EmployeeProgress,
                ManagerProgress = progress.ManagerProgress
            });
        }

        var bgvPendingCount = await _context.BGVRecords.CountAsync(r => r.Status == "Pending", ct);
        var totalOnboardings = await _context.OnboardingProcesses.CountAsync(ct);

        return Ok(ApiResponse<object>.Ok(new
        {
            totalOnboardings,
            bgvPendingCount,
            sla = new
            {
                completed,
                overdue,
                dueToday,
                upcoming,
                escalated
            },
            onboardingsProgress = progressList,
            departmentScope = targetDept ?? "All"
        }));
    }
}
