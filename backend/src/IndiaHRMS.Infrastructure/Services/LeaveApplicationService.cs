using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class LeaveApplicationService : ILeaveApplicationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<LeaveApplicationService> _logger;

    public LeaveApplicationService(AppDbContext context, ILogger<LeaveApplicationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<LeaveApplicationDto> ApplyLeaveAsync(CreateLeaveApplicationDto dto)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.EmployeeId == dto.EmployeeId);

        if (employee == null)
            throw new KeyNotFoundException($"Employee with ID {dto.EmployeeId} not found.");

        var leaveType = await _context.LeaveTypes
            .FirstOrDefaultAsync(l => l.LeaveTypeId == dto.LeaveTypeId && l.IsActive);

        if (leaveType == null)
            throw new KeyNotFoundException($"Leave type with ID {dto.LeaveTypeId} not found or inactive.");

        if (dto.ToDate < dto.FromDate)
            throw new InvalidOperationException("End date cannot be prior to start date.");

        // 1. Calculate Total Days
        decimal rawDays = (dto.ToDate.DayNumber - dto.FromDate.DayNumber) + 1;
        if (dto.IsHalfDay)
        {
            rawDays = 0.5m;
        }

        decimal totalDays = rawDays;

        // 2. Min Notice Days Validation
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        int daysNoticeGiven = dto.FromDate.DayNumber - today.DayNumber;
        if (leaveType.MinNoticeDays > 0 && daysNoticeGiven < leaveType.MinNoticeDays)
        {
            _logger.LogWarning("Notice period alert: Required {RequiredNotice} days notice, but given {GivenNotice} days",
                leaveType.MinNoticeDays, daysNoticeGiven);
        }

        // 3. Max Days Per Application Rule
        if (totalDays > leaveType.MaxDaysPerApplication)
        {
            throw new InvalidOperationException(
                $"Application length of {totalDays} days exceeds maximum allowed limit of {leaveType.MaxDaysPerApplication} days for {leaveType.LeaveCode}.");
        }

        // 4. Team Overlap Warning Check
        if (employee.DeptId != Guid.Empty)
        {
            var overlapPct = await CheckTeamOverlapPercentageAsync(employee.DeptId, dto.FromDate, dto.ToDate);
            if (overlapPct >= 30.0m)
            {
                _logger.LogWarning("High team leave overlap detected ({OverlapPct}%) for Dept {DeptId}", overlapPct, employee.DeptId);
            }
        }

        // 5. Create Application Record
        var application = new LeaveApplication
        {
            EmployeeId = dto.EmployeeId,
            LeaveTypeId = dto.LeaveTypeId,
            FromDate = dto.FromDate,
            ToDate = dto.ToDate,
            TotalDays = totalDays,
            IsHalfDay = dto.IsHalfDay,
            HalfDayType = dto.HalfDayType,
            Reason = dto.Reason,
            BackupEmployeeId = dto.BackupEmployeeId,
            ContactPhone = dto.ContactPhone,
            AttachmentPath = dto.AttachmentPath,
            Status = LeaveStatus.Pending,
            AppliedAt = DateTime.UtcNow
        };

        _context.LeaveApplications.Add(application);
        await _context.SaveChangesAsync();

        return await GetApplicationByIdAsync(application.LeaveAppId)
            ?? throw new InvalidOperationException("Failed to retrieve created application.");
    }

    public async Task<LeaveApplicationDto> ApproveLeaveAsync(Guid leaveAppId, ApproveRejectLeaveDto dto)
    {
        var app = await _context.LeaveApplications
            .Include(a => a.LeaveType)
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.LeaveAppId == leaveAppId);

        if (app == null)
            throw new KeyNotFoundException($"Leave application {leaveAppId} not found.");

        if (app.Status == LeaveStatus.Approved)
            throw new InvalidOperationException("Application is already approved.");

        // Rule: Multi-level escalation for long leaves (> 5 days)
        if (app.TotalDays > 5 && app.Status == LeaveStatus.Pending)
        {
            app.Status = LeaveStatus.Level1Approved;
            app.ApproverId = dto.ApproverUserId;
            app.ApprovedAt = DateTime.UtcNow;
            app.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Leave application {LeaveAppId} passed Level 1 approval. Escalated to Level 2.", leaveAppId);
            return await GetApplicationByIdAsync(leaveAppId) ?? throw new InvalidOperationException();
        }

        // Final Approval
        if (app.Status == LeaveStatus.Level1Approved)
        {
            app.Level2ApproverId = dto.ApproverUserId;
            app.Level2ApprovedAt = DateTime.UtcNow;
        }
        else
        {
            app.ApproverId = dto.ApproverUserId;
            app.ApprovedAt = DateTime.UtcNow;
        }

        app.Status = LeaveStatus.Approved;
        app.UpdatedAt = DateTime.UtcNow;

        // Deduct from Balance & Create Ledger entry
        var currentYear = DateTime.UtcNow.Year;
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.EmployeeId == app.EmployeeId && b.LeaveTypeId == app.LeaveTypeId && b.Year == currentYear);

        if (balance != null)
        {
            balance.Taken += app.TotalDays;
            balance.ClosingBalance = balance.OpeningBalance + balance.Accrued - balance.Taken - balance.Encashed - balance.Lapsed;
            balance.UpdatedAt = DateTime.UtcNow;

            var ledgerEntry = new LeaveLedger
            {
                EmployeeId = app.EmployeeId,
                LeaveTypeId = app.LeaveTypeId,
                TxnType = "Availed",
                TxnDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Days = app.TotalDays,
                RunningBalance = balance.ClosingBalance,
                ReferenceId = app.LeaveAppId.ToString(),
                Remarks = $"Leave approved ({app.FromDate:dd MMM yyyy} to {app.ToDate:dd MMM yyyy})",
                CreatedAt = DateTime.UtcNow
            };
            _context.LeaveLedgers.Add(ledgerEntry);
        }

        await _context.SaveChangesAsync();
        return await GetApplicationByIdAsync(leaveAppId) ?? throw new InvalidOperationException();
    }

    public async Task<LeaveApplicationDto> RejectLeaveAsync(Guid leaveAppId, ApproveRejectLeaveDto dto)
    {
        var app = await _context.LeaveApplications.FindAsync(leaveAppId);
        if (app == null)
            throw new KeyNotFoundException($"Leave application {leaveAppId} not found.");

        app.Status = LeaveStatus.Rejected;
        app.RejectionReason = dto.Remarks;
        app.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetApplicationByIdAsync(leaveAppId) ?? throw new InvalidOperationException();
    }

    public async Task<bool> CancelLeaveAsync(Guid leaveAppId, Guid requestedByUserId)
    {
        var app = await _context.LeaveApplications.FindAsync(leaveAppId);
        if (app == null) return false;

        if (app.Status == LeaveStatus.Approved)
        {
            var currentYear = app.FromDate.Year;
            var balance = await _context.LeaveBalances
                .FirstOrDefaultAsync(b => b.EmployeeId == app.EmployeeId && b.LeaveTypeId == app.LeaveTypeId && b.Year == currentYear);

            if (balance != null)
            {
                balance.Taken = Math.Max(0, balance.Taken - app.TotalDays);
                balance.ClosingBalance = balance.OpeningBalance + balance.Accrued - balance.Taken - balance.Encashed - balance.Lapsed;
                balance.UpdatedAt = DateTime.UtcNow;

                var ledgerEntry = new LeaveLedger
                {
                    EmployeeId = app.EmployeeId,
                    LeaveTypeId = app.LeaveTypeId,
                    TxnType = "Adjustment",
                    TxnDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    Days = app.TotalDays,
                    RunningBalance = balance.ClosingBalance,
                    ReferenceId = app.LeaveAppId.ToString(),
                    Remarks = $"Cancellation credit refund for App #{app.LeaveAppId.ToString()[..8]}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.LeaveLedgers.Add(ledgerEntry);
            }
        }

        app.Status = LeaveStatus.Cancelled;
        app.CancelledAt = DateTime.UtcNow;
        app.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<LeaveApplicationDto>> GetEmployeeApplicationsAsync(Guid employeeId)
    {
        var apps = await _context.LeaveApplications
            .Include(a => a.Employee)
            .ThenInclude(e => e.Department)
            .Include(a => a.LeaveType)
            .Include(a => a.Approver)
            .Include(a => a.Level2Approver)
            .Include(a => a.BackupEmployee)
            .Where(a => a.EmployeeId == employeeId)
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync();

        return apps.Select(MapToDto);
    }

    public async Task<IEnumerable<LeaveApplicationDto>> GetPendingApprovalsAsync(Guid managerUserId)
    {
        var apps = await _context.LeaveApplications
            .Include(a => a.Employee)
            .ThenInclude(e => e.Department)
            .Include(a => a.LeaveType)
            .Include(a => a.Approver)
            .Include(a => a.Level2Approver)
            .Include(a => a.BackupEmployee)
            .Where(a => a.Status == LeaveStatus.Pending || a.Status == LeaveStatus.Level1Approved)
            .OrderBy(a => a.AppliedAt)
            .ToListAsync();

        return apps.Select(MapToDto);
    }

    public async Task<LeaveApplicationDto?> GetApplicationByIdAsync(Guid leaveAppId)
    {
        var app = await _context.LeaveApplications
            .Include(a => a.Employee)
            .ThenInclude(e => e.Department)
            .Include(a => a.LeaveType)
            .Include(a => a.Approver)
            .Include(a => a.Level2Approver)
            .Include(a => a.BackupEmployee)
            .FirstOrDefaultAsync(a => a.LeaveAppId == leaveAppId);

        return app == null ? null : MapToDto(app);
    }

    public async Task<decimal> CheckTeamOverlapPercentageAsync(Guid departmentId, DateOnly fromDate, DateOnly toDate)
    {
        int totalDeptCount = await _context.Employees
            .CountAsync(e => e.DeptId == departmentId && e.IsActive);

        if (totalDeptCount == 0) return 0m;

        int employeesOnLeave = await _context.LeaveApplications
            .Include(a => a.Employee)
            .Where(a => a.Employee.DeptId == departmentId &&
                        (a.Status == LeaveStatus.Approved || a.Status == LeaveStatus.Pending || a.Status == LeaveStatus.Level1Approved) &&
                        a.FromDate <= toDate && a.ToDate >= fromDate)
            .Select(a => a.EmployeeId)
            .Distinct()
            .CountAsync();

        return Math.Round(((decimal)employeesOnLeave / totalDeptCount) * 100m, 1);
    }

    private static LeaveApplicationDto MapToDto(LeaveApplication a) => new()
    {
        LeaveAppId = a.LeaveAppId,
        EmployeeId = a.EmployeeId,
        EmployeeCode = a.Employee?.EmployeeCode ?? string.Empty,
        EmployeeName = a.Employee != null ? $"{a.Employee.FirstName} {a.Employee.LastName}" : string.Empty,
        DepartmentName = a.Employee?.Department?.DeptName ?? string.Empty,
        LeaveTypeId = a.LeaveTypeId,
        LeaveTypeName = a.LeaveType?.LeaveTypeName ?? string.Empty,
        LeaveCode = a.LeaveType?.LeaveCode ?? string.Empty,
        FromDate = a.FromDate,
        ToDate = a.ToDate,
        TotalDays = a.TotalDays,
        IsHalfDay = a.IsHalfDay,
        HalfDayType = a.HalfDayType,
        Reason = a.Reason,
        BackupEmployeeId = a.BackupEmployeeId,
        BackupEmployeeName = a.BackupEmployee != null ? $"{a.BackupEmployee.FirstName} {a.BackupEmployee.LastName}" : null,
        ContactPhone = a.ContactPhone,
        Status = a.Status.ToString(),
        AppliedAt = a.AppliedAt,
        ApproverId = a.ApproverId,
        ApproverName = a.Approver != null ? $"{a.Approver.FirstName} {a.Approver.LastName}" : null,
        ApprovedAt = a.ApprovedAt,
        Level2ApproverId = a.Level2ApproverId,
        Level2ApproverName = a.Level2Approver != null ? $"{a.Level2Approver.FirstName} {a.Level2Approver.LastName}" : null,
        Level2ApprovedAt = a.Level2ApprovedAt,
        RejectionReason = a.RejectionReason,
        CancelledAt = a.CancelledAt,
        AttachmentPath = a.AttachmentPath
    };
}
