using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/dashboard")]
[ApiVersion("1.0")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("hr")]
    [Filters.RequirePermission(Domain.Constants.PermissionCodes.Reports.View, Domain.Constants.PermissionCodes.Employee.View)]
    public async Task<ActionResult<ApiResponse<HRDashboardDto>>> GetHRDashboard(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var twelveMonthsAgo = now.AddMonths(-12);

        var activeCount = await _context.Employees.CountAsync(e => e.IsActive && e.EmploymentStatus == EmploymentStatus.Active && (!companyId.HasValue || e.CompanyId == companyId), ct);
        var onNoticeCount = await _context.Employees.CountAsync(e => e.IsActive && e.EmploymentStatus == EmploymentStatus.OnNotice && (!companyId.HasValue || e.CompanyId == companyId), ct);
        var newJoiners = await _context.Employees.CountAsync(e => e.JoiningDate >= DateOnly.FromDateTime(monthStart) && (!companyId.HasValue || e.CompanyId == companyId), ct);
        var openPositions = await _context.JobRequisitions.CountAsync(r => r.Status == RequisitionStatus.Open && (!companyId.HasValue || r.CompanyId == companyId), ct);
        var pendingLeaves = await _context.LeaveApplications.CountAsync(l => l.Status == LeaveStatus.Pending && (!companyId.HasValue || l.Employee.CompanyId == companyId), ct);

        // Headcount by dept
        var headcount = await _context.Employees
            .Where(e => e.IsActive && (!companyId.HasValue || e.CompanyId == companyId))
            .GroupBy(e => e.Department.DeptName)
            .Select(g => new DepartmentHeadcountDto { DepartmentName = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        // 12-month joining trend
        var trend = await _context.Employees
            .Where(e => e.JoiningDate >= DateOnly.FromDateTime(twelveMonthsAgo) && (!companyId.HasValue || e.CompanyId == companyId))
            .GroupBy(e => new { e.JoiningDate.Year, e.JoiningDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .ToListAsync(ct);

        var monthlyTrend = trend.Select(t => new MonthlyJoiningDto
        {
            Month = $"{t.Year}-{t.Month:D2}",
            Joinings = t.Count,
            Exits = 0 // Would be populated from Separations
        }).ToList();

        // Latest payroll status
        var latestPayroll = await _context.PayrollRuns
            .Where(p => !companyId.HasValue || p.CompanyId == companyId)
            .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
            .Select(p => p.Status.ToString())
            .FirstOrDefaultAsync(ct);

        // Attrition rate (simple 12-month)
        var separations = await _context.Separations.CountAsync(s => s.LastWorkingDate >= DateOnly.FromDateTime(twelveMonthsAgo) && (!companyId.HasValue || s.Employee.CompanyId == companyId), ct);
        var attritionRate = activeCount > 0 ? Math.Round((decimal)separations / activeCount * 100, 2) : 0;

        return Ok(ApiResponse<HRDashboardDto>.Ok(new HRDashboardDto
        {
            TotalActiveEmployees = activeCount,
            NewJoinersThisMonth = newJoiners,
            EmployeesOnNotice = onNoticeCount,
            OpenPositions = openPositions,
            AttritionRatePercent = attritionRate,
            PendingLeaveApprovals = pendingLeaves,
            PendingRegularizations = 0,
            PayrollStatus = latestPayroll,
            HeadcountByDept = headcount,
            MonthlyJoiningTrend = monthlyTrend
        }));
    }

    [HttpGet("manager")]
    public async Task<ActionResult<ApiResponse<ManagerDashboardDto>>> GetManagerDashboard(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<ManagerDashboardDto>.Fail("No employee profile."));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var teamIds = await _context.Employees
            .Where(e => e.ReportingManagerId == _currentUser.EmployeeId && e.IsActive)
            .Select(e => e.EmployeeId)
            .ToListAsync(ct);

        var teamSize = teamIds.Count;
        var todayAttendance = await _context.AttendanceRecords
            .Where(a => teamIds.Contains(a.EmployeeId) && a.AttendanceDate == today)
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var pendingLeaves = await _context.LeaveApplications
            .CountAsync(l => teamIds.Contains(l.EmployeeId) && l.Status == LeaveStatus.Pending, ct);

        return Ok(ApiResponse<ManagerDashboardDto>.Ok(new ManagerDashboardDto
        {
            TeamSize = teamSize,
            PresentToday = todayAttendance.FirstOrDefault(a => a.Status == AttendanceStatus.Present)?.Count ?? 0,
            AbsentToday = todayAttendance.FirstOrDefault(a => a.Status == AttendanceStatus.Absent)?.Count ?? 0,
            OnLeaveToday = todayAttendance.FirstOrDefault(a => a.Status == AttendanceStatus.Leave)?.Count ?? 0,
            WFHToday = todayAttendance.FirstOrDefault(a => a.Status == AttendanceStatus.WFH)?.Count ?? 0,
            PendingLeaveApprovals = pendingLeaves
        }));
    }

    [HttpGet("employee")]
    public async Task<ActionResult<ApiResponse<EmployeeDashboardDto>>> GetEmployeeDashboard(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<EmployeeDashboardDto>.Fail("No employee profile."));

        var empId = _currentUser.EmployeeId.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var attendanceCount = await _context.AttendanceRecords
            .CountAsync(a => a.EmployeeId == empId && a.AttendanceDate >= monthStart && a.AttendanceDate <= today
                && (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.WFH || a.Status == AttendanceStatus.HalfDay), ct);

        var todayAttendance = await _context.AttendanceRecords
            .FirstOrDefaultAsync(a => a.EmployeeId == empId && a.AttendanceDate == today, ct);

        var leaveBalances = await _context.LeaveBalances
            .Include(lb => lb.LeaveType)
            .Where(lb => lb.EmployeeId == empId && lb.Year == today.Year)
            .ToDictionaryAsync(lb => lb.LeaveType.LeaveCode, lb => lb.ClosingBalance, ct);

        var pendingLeaveCount = await _context.LeaveApplications
            .CountAsync(l => l.EmployeeId == empId && l.Status == LeaveStatus.Pending, ct);

        var upcomingHolidays = await _context.HolidayCalendars
            .Where(h => h.HolidayDate >= today && h.HolidayDate <= today.AddDays(30) && h.IsActive)
            .OrderBy(h => h.HolidayDate)
            .Take(5)
            .Select(h => new UpcomingHolidayDto { Date = h.HolidayDate, Name = h.HolidayName, Type = h.HolidayType.ToString() })
            .ToListAsync(ct);

        return Ok(ApiResponse<EmployeeDashboardDto>.Ok(new EmployeeDashboardDto
        {
            AttendanceThisMonth = attendanceCount,
            TodayStatus = todayAttendance?.Status.ToString(),
            TodayCheckIn = todayAttendance?.CheckIn,
            LeaveBalances = leaveBalances,
            PendingLeaveApplications = pendingLeaveCount,
            UpcomingHolidays = upcomingHolidays
        }));
    }

    [HttpGet("attendance-today")]
    public async Task<ActionResult<ApiResponse<AttendanceTodayDto>>> GetTodayAttendance(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var companyId = _currentUser.CompanyId;
        var totalEmployees = await _context.Employees.CountAsync(e => e.IsActive && (!companyId.HasValue || e.CompanyId == companyId), ct);

        var grouped = await _context.AttendanceRecords
            .Where(a => a.AttendanceDate == today)
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        int GetCount(AttendanceStatus s) => grouped.FirstOrDefault(g => g.Status == s)?.Count ?? 0;

        return Ok(ApiResponse<AttendanceTodayDto>.Ok(new AttendanceTodayDto
        {
            TotalEmployees = totalEmployees,
            Present = GetCount(AttendanceStatus.Present),
            Absent = GetCount(AttendanceStatus.Absent),
            OnLeave = GetCount(AttendanceStatus.Leave),
            WFH = GetCount(AttendanceStatus.WFH),
            Holiday = GetCount(AttendanceStatus.Holiday),
            NotMarked = Math.Max(0, totalEmployees - grouped.Sum(g => g.Count))
        }));
    }

    [HttpGet("recruitment")]
    public async Task<ActionResult<ApiResponse<IndiaHRMS.Application.DTOs.Recruitment.RecruitmentDashboardDto>>> GetRecruitmentDashboard(CancellationToken ct)
    {
        var companyId = _currentUser.CompanyId;

        // Postings
        var postings = await _context.JobPostings
            .Where(p => !companyId.HasValue || p.JobRequisition.CompanyId == companyId)
            .ToListAsync(ct);

        var totalPostings = postings.Count;
        var published = postings.Count(p => p.Status == JobPostingStatus.Published);
        var draft = postings.Count(p => p.Status == JobPostingStatus.Draft);
        var closed = postings.Count(p => p.Status == JobPostingStatus.Closed);
        var expired = 0; // Expired is retired in favor of Closed

        // Candidates
        var totalCandidates = await _context.Candidates.CountAsync(ct);

        // Applications
        var apps = await _context.JobApplications
            .Include(a => a.Candidate)
            .Include(a => a.Requisition)
            .Where(a => !companyId.HasValue || a.Requisition.CompanyId == companyId)
            .ToListAsync(ct);

        var totalApps = apps.Count;

        // Average AI Match Score
        decimal averageScore = 0;
        if (apps.Any())
        {
            decimal totalScore = 0;
            foreach (var app in apps)
            {
                totalScore += CalculateMatchScore(app.Candidate, app.Requisition);
            }
            averageScore = totalScore / apps.Count;
        }

        // Offers and Joined
        var offers = apps.Count(a => a.CurrentStage == ApplicationStage.Offer);
        var joined = apps.Count(a => a.CurrentStage == ApplicationStage.Joined);
        var employeesHired = apps.Count(a => a.Status == "Completed");

        // Calculate Average Time To Hire
        double avgTimeToHire = 0;
        var joinedApps = apps.Where(a => a.CurrentStage == ApplicationStage.Joined).ToList();
        if (joinedApps.Any())
        {
            double totalDays = 0;
            foreach (var app in joinedApps)
            {
                var endDate = app.UpdatedAt ?? DateTime.UtcNow;
                var startDate = app.ApplicationDate;
                totalDays += (endDate - startDate).TotalDays;
            }
            avgTimeToHire = totalDays / joinedApps.Count;
        }

        // Open positions
        var openPositions = await _context.JobRequisitions
            .Where(r => r.Status == RequisitionStatus.Approved && (!companyId.HasValue || r.CompanyId == companyId))
            .SumAsync(r => r.NoOfPositions, ct);

        // Candidate conversion rate
        double conversionRate = 0;
        if (totalApps > 0)
        {
            conversionRate = (double)joined / totalApps * 100;
        }

        // Offer acceptance rate
        var totalOffers = apps.Count(a => a.CurrentStage == ApplicationStage.Offer || a.CurrentStage == ApplicationStage.BackgroundCheck || a.CurrentStage == ApplicationStage.Joined);
        double offerAcceptanceRate = 0;
        if (totalOffers > 0)
        {
            offerAcceptanceRate = (double)joined / totalOffers * 100;
        }

        // Query candidate source counts
        var sourceCounts = await _context.Candidates
            .GroupBy(c => c.Source)
            .Select(g => new IndiaHRMS.Application.DTOs.Recruitment.ApplicationSourceCountDto
            {
                Source = g.Key.HasValue ? g.Key.Value.ToString() : "Other",
                Count = g.Count()
            })
            .ToListAsync(ct);

        var appliedCount = apps.Count(a => a.CurrentStage == ApplicationStage.Applied);
        var screeningCount = apps.Count(a => a.CurrentStage == ApplicationStage.Screening);
        var interviewCount = apps.Count(a => a.CurrentStage == ApplicationStage.InterviewL1 || 
                                          a.CurrentStage == ApplicationStage.InterviewL2 || 
                                          a.CurrentStage == ApplicationStage.ManagerReview || 
                                          a.CurrentStage == ApplicationStage.HRInterview || 
                                          a.CurrentStage == ApplicationStage.Shortlisted);
        var offerCount = apps.Count(a => a.CurrentStage == ApplicationStage.Offer);
        var rejectedCount = apps.Count(a => a.CurrentStage == ApplicationStage.Rejected);
        var joinedCount = apps.Count(a => a.CurrentStage == ApplicationStage.Joined);

        return Ok(ApiResponse<IndiaHRMS.Application.DTOs.Recruitment.RecruitmentDashboardDto>.Ok(new IndiaHRMS.Application.DTOs.Recruitment.RecruitmentDashboardDto
        {
            TotalPostings = totalPostings,
            Published = published,
            Draft = draft,
            Closed = closed,
            Expired = expired,
            TotalCandidates = totalCandidates,
            Applications = totalApps,
            AverageAiMatch = Math.Round(averageScore, 1),
            Offers = offers,
            Joined = joined,
            EmployeesHired = employeesHired,
            AverageTimeToHire = Math.Round(avgTimeToHire, 1),
            OpenPositions = openPositions,
            CandidateConversionRate = Math.Round(conversionRate, 1),
            OfferAcceptanceRate = Math.Round(offerAcceptanceRate, 1),
            AppliedCount = appliedCount,
            ScreeningCount = screeningCount,
            InterviewCount = interviewCount,
            OfferCount = offerCount,
            RejectedCount = rejectedCount,
            JoinedCount = joinedCount,
            SourceCounts = sourceCounts
        }));
    }

    private decimal CalculateMatchScore(Candidate candidate, JobRequisition requisition)
    {
        decimal score = 50;

        if (requisition.MinExperience.HasValue)
        {
            var candExp = candidate.TotalExperience ?? 0;
            var min = requisition.MinExperience.Value;
            var max = requisition.MaxExperience ?? (min + 5);

            if (candExp >= min && candExp <= max)
                score += 20;
            else if (candExp >= min)
                score += 15;
            else if (candExp >= min - 1)
                score += 10;
        }
        else
        {
            score += 10;
        }

        if (!string.IsNullOrEmpty(requisition.SkillsRequired))
        {
            var reqSkills = requisition.SkillsRequired.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim().ToLower())
                .ToList();
            
            var matchSource = (candidate.CurrentDesignation ?? "") + " " + (candidate.Source?.ToString() ?? "");
            var candSkills = matchSource.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => w.Trim().ToLower())
                .ToList();

            var matches = reqSkills.Intersect(candSkills).Count();
            score += Math.Min(matches * 15, 30);
        }

        return Math.Clamp(score, 0, 100);
    }

    [HttpGet("onboarding/summary")]
    public async Task<ActionResult<ApiResponse<object>>> GetOnboardingSummary(CancellationToken ct)
    {
        var onboardings = await _context.OnboardingProcesses
            .Include(o => o.Candidate)
            .ToListAsync(ct);

        var total = onboardings.Count;
        var preJoining = onboardings.Count(o => o.Status == "PreJoining");
        var inProgress = onboardings.Count(o => o.Status == "InProgress");
        var completed = onboardings.Count(o => o.Status == "Completed");

        return Ok(ApiResponse<object>.Ok(new
        {
            total,
            preJoining,
            inProgress,
            completed
        }));
    }
}
