using System.Text;
using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class LeaveAnalyticsService : ILeaveAnalyticsService
{
    private readonly AppDbContext _context;
    private readonly ILogger<LeaveAnalyticsService> _logger;

    public LeaveAnalyticsService(AppDbContext context, ILogger<LeaveAnalyticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<LeaveDashboardSummaryDto> GetDashboardSummaryAsync(Guid companyId, Guid? employeeId = null)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfMonth = new DateOnly(today.Year, today.Month, 1);
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);

        // 1. Pending Approvals
        int pendingApprovals = await _context.LeaveApplications
            .CountAsync(a => a.Employee.CompanyId == companyId && a.Status == Domain.Enums.LeaveStatus.Pending);

        // 2. On Leave Today
        int onLeaveToday = await _context.LeaveApplications
            .CountAsync(a => a.Employee.CompanyId == companyId && a.Status == Domain.Enums.LeaveStatus.Approved && a.FromDate <= today && a.ToDate >= today);

        // 3. Active Maternity / Paternity
        int onStatutory = await _context.StatutoryLeaveEvents
            .CountAsync(s => s.Employee.CompanyId == companyId && s.Status == "Approved" && s.EventDate <= today);

        // 4. Approved this month
        int approvedThisMonth = await _context.LeaveApplications
            .CountAsync(a => a.Employee.CompanyId == companyId && a.Status == Domain.Enums.LeaveStatus.Approved && a.FromDate >= startOfMonth);

        // 5. Rejected this week
        int rejectedThisWeek = await _context.LeaveApplications
            .CountAsync(a => a.Employee.CompanyId == companyId && a.Status == Domain.Enums.LeaveStatus.Rejected && a.FromDate >= startOfWeek);

        // 6. Cancelled this week
        int cancelledThisWeek = await _context.LeaveApplications
            .CountAsync(a => a.Employee.CompanyId == companyId && a.Status == Domain.Enums.LeaveStatus.Cancelled && a.FromDate >= startOfWeek);

        // 7. Recent Applications
        var recentApps = await _context.LeaveApplications
            .Include(a => a.Employee)
            .Include(a => a.LeaveType)
            .Where(a => a.Employee.CompanyId == companyId)
            .OrderByDescending(a => a.AppliedAt)
            .Take(8)
            .ToListAsync();

        var recentDtos = recentApps.Select(a => new LeaveApplicationDto
        {
            LeaveAppId = a.LeaveAppId,
            EmployeeId = a.EmployeeId,
            EmployeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
            LeaveTypeName = a.LeaveType.LeaveTypeName,
            LeaveCode = a.LeaveType.LeaveCode,
            FromDate = a.FromDate,
            ToDate = a.ToDate,
            TotalDays = a.TotalDays,
            Status = a.Status.ToString(),
            Reason = a.Reason,
            AppliedAt = a.AppliedAt
        }).ToList();

        // 8. Upcoming Holidays
        var holidays = await _context.HolidayCalendars
            .Where(h => h.CompanyId == companyId && h.HolidayDate >= today && h.IsActive)
            .OrderBy(h => h.HolidayDate)
            .Take(5)
            .ToListAsync();

        var holidayDtos = holidays.Select(h => new HolidayCalendarDto
        {
            HolidayId = h.HolidayId,
            CompanyId = h.CompanyId,
            LocationId = h.LocationId,
            LocationName = h.Location?.LocationName ?? "Pan India",
            HolidayDate = h.HolidayDate,
            HolidayName = h.HolidayName,
            HolidayType = h.HolidayType.ToString()
        }).ToList();

        return new LeaveDashboardSummaryDto
        {
            PendingApprovalsCount = pendingApprovals,
            OnLeaveTodayCount = onLeaveToday,
            OnMaternityPaternityCount = onStatutory,
            ApprovedThisMonthCount = approvedThisMonth,
            RejectedThisWeekCount = rejectedThisWeek,
            CancelledThisWeekCount = cancelledThisWeek,
            RecentApplications = recentDtos,
            UpcomingHolidays = holidayDtos
        };
    }

    public async Task<byte[]> ExportEnterpriseReportAsync(Guid companyId, string reportType, int year)
    {
        var sb = new StringBuilder();

        switch (reportType.ToLower())
        {
            case "balance-summary":
                sb.AppendLine("Employee Code,Employee Name,Leave Type,Opening Balance,Accrued,Taken,Encashed,Lapsed,Closing Balance");
                var balances = await _context.LeaveBalances
                    .Include(b => b.Employee)
                    .Include(b => b.LeaveType)
                    .Where(b => b.Employee.CompanyId == companyId && b.Year == year)
                    .ToListAsync();

                foreach (var b in balances)
                {
                    sb.AppendLine($"\"{b.Employee.EmployeeCode}\",\"{b.Employee.FirstName} {b.Employee.LastName}\",\"{b.LeaveType.LeaveTypeName}\",{b.OpeningBalance},{b.Accrued},{b.Taken},{b.Encashed},{b.Lapsed},{b.ClosingBalance}");
                }
                break;

            case "statutory-maternity":
                sb.AppendLine("Event ID,Employee Code,Employee Name,Event Type,Event Date,Expected Delivery Date,Child Order,Entitlement Days,Status");
                var statEvents = await _context.StatutoryLeaveEvents
                    .Include(s => s.Employee)
                    .Where(s => s.Employee.CompanyId == companyId)
                    .ToListAsync();

                foreach (var s in statEvents)
                {
                    sb.AppendLine($"\"{s.EventId}\",\"{s.Employee.EmployeeCode}\",\"{s.Employee.FirstName} {s.Employee.LastName}\",\"{s.EventType}\",\"{s.EventDate:yyyy-MM-dd}\",\"{s.ExpectedDeliveryDate:yyyy-MM-dd}\",{s.ChildOrder},{s.EntitlementDays},\"{s.Status}\"");
                }
                break;

            case "encashment-tax":
                sb.AppendLine("Encashment ID,Employee Code,Employee Name,Leave Type,Days Encashed,Daily Rate,Total Amount,Tax Exempt Amount,Taxable Amount,Month");
                var encashments = await _context.LeaveEncashments
                    .Include(e => e.Employee)
                    .Include(e => e.LeaveType)
                    .Where(e => e.Employee.CompanyId == companyId)
                    .ToListAsync();

                foreach (var e in encashments)
                {
                    sb.AppendLine($"\"{e.EncashmentId}\",\"{e.Employee.EmployeeCode}\",\"{e.Employee.FirstName} {e.Employee.LastName}\",\"{e.LeaveType?.LeaveTypeName}\",{e.DaysEncashed},{e.DailyRate},{e.TotalAmount},{e.TaxExemptAmount},{e.TaxableAmount},\"{e.ProcessedMonth}\"");
                }
                break;

            default:
                sb.AppendLine("Application ID,Employee Code,Employee Name,Leave Type,From Date,To Date,Total Days,Status,Applied At");
                var apps = await _context.LeaveApplications
                    .Include(a => a.Employee)
                    .Include(a => a.LeaveType)
                    .Where(a => a.Employee.CompanyId == companyId && a.FromDate.Year == year)
                    .ToListAsync();

                foreach (var a in apps)
                {
                    sb.AppendLine($"\"{a.LeaveAppId}\",\"{a.Employee.EmployeeCode}\",\"{a.Employee.FirstName} {a.Employee.LastName}\",\"{a.LeaveType.LeaveTypeName}\",\"{a.FromDate:yyyy-MM-dd}\",\"{a.ToDate:yyyy-MM-dd}\",{a.TotalDays},\"{a.Status}\",\"{a.AppliedAt:yyyy-MM-dd}\"");
                }
                break;
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
