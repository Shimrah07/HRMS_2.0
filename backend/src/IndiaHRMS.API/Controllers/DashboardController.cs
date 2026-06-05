using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.Interfaces;
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
}
