using AutoMapper;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/attendance")]
[ApiVersion("1.0")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AttendanceController(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private TimeZoneInfo GetIstTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
        }
    }

    private DateTime GetIstTime()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, GetIstTimeZone());
    }

    private DateOnly GetIstToday()
    {
        return DateOnly.FromDateTime(GetIstTime());
    }

    private string FormatDuration(TimeSpan ts)
    {
        var hrs = ts.Hours + (ts.Days * 24);
        var mins = ts.Minutes;
        if (hrs > 0)
        {
            return $"{hrs} hrs {mins} mins";
        }
        return $"{mins} mins";
    }

    private string MapAttendanceStatusToUi(AttendanceStatus status)
    {
        return status switch
        {
            AttendanceStatus.Present => "present",
            AttendanceStatus.LatePresent => "late",
            AttendanceStatus.Leave => "leave",
            AttendanceStatus.Absent => "absent",
            AttendanceStatus.WeeklyOff => "weekend",
            AttendanceStatus.WFH => "present",
            AttendanceStatus.HalfDay => "present",
            AttendanceStatus.Holiday => "leave",
            _ => "present"
        };
    }

    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<object>>> GetStatus(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile linked to user."));

        var empId = _currentUser.EmployeeId.Value;
        var today = GetIstToday();

        var record = await _context.AttendanceRecords
            .FirstOrDefaultAsync(r => r.EmployeeId == empId && r.AttendanceDate == today, ct);

        var punchedIn = record != null && record.CheckIn != null && record.CheckOut == null;

        var logs = new List<object>();
        if (record != null)
        {
            var checkInIst = record.CheckIn.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(record.CheckIn.Value, GetIstTimeZone()) : (DateTime?)null;
            var checkOutIst = record.CheckOut.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(record.CheckOut.Value, GetIstTimeZone()) : (DateTime?)null;
            
            logs.Add(new
            {
                key = record.AttendanceId.ToString(),
                date = today.ToString("dd MMM yyyy"),
                @in = checkInIst?.ToString("hh:mm tt") ?? "—",
                @out = checkOutIst?.ToString("hh:mm tt") ?? "—",
                duration = record.CheckOut.HasValue && record.CheckIn.HasValue
                    ? FormatDuration(record.CheckOut.Value - record.CheckIn.Value)
                    : "—",
                status = record.Status.ToString()
            });
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            punchedIn,
            punchInTime = record?.CheckIn.HasValue == true
                ? TimeZoneInfo.ConvertTimeFromUtc(record.CheckIn.Value, GetIstTimeZone()).ToString("hh:mm tt")
                : null,
            logs
        }));
    }

    [HttpPost("punch")]
    public async Task<ActionResult<ApiResponse<object>>> Punch(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile linked to user."));

        var empId = _currentUser.EmployeeId.Value;
        var today = GetIstToday();
        var nowUtc = DateTime.UtcNow;

        // Task 5 & 7 Validation: Enforce LWD & Active Employee status
        var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == empId, ct);
        if (emp != null && !emp.IsActive)
        {
            return BadRequest(ApiResponse<object>.Fail("PUNCH_BLOCKED: Employee account is deactivated/separated. Cannot mark attendance."));
        }

        var exitRecord = await _context.ExitRecords.FirstOrDefaultAsync(x => x.EmployeeId == empId && x.Status != ExitStatus.Closed && x.Status != ExitStatus.Withdrawn, ct);
        if (exitRecord != null)
        {
            var lwd = exitRecord.ConfirmedLwd ?? exitRecord.ProposedLwd;
            if (today > lwd)
            {
                return BadRequest(ApiResponse<object>.Fail($"PUNCH_BLOCKED: Cannot mark attendance beyond your Last Working Day (LWD: {lwd:dd MMM yyyy})."));
            }
        }

        var record = await _context.AttendanceRecords
            .FirstOrDefaultAsync(r => r.EmployeeId == empId && r.AttendanceDate == today, ct);


        if (record == null)
        {
            record = new AttendanceRecord
            {
                AttendanceId = Guid.NewGuid(),
                EmployeeId = empId,
                AttendanceDate = today,
                CheckIn = nowUtc,
                CheckOut = null,
                WorkingHours = 0,
                OvertimeHours = 0,
                Status = AttendanceStatus.MissingPunch,
                Source = AttendanceSource.WebApp,
                IsRegularized = false,
                IsFrozen = false,
                CreatedAt = nowUtc
            };

            _context.AttendanceRecords.Add(record);
            await _context.SaveChangesAsync(ct);

            var checkInIstTime = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, GetIstTimeZone()).ToString("hh:mm tt");
            return Ok(ApiResponse<object>.Ok(new { punchedIn = true, punchInTime = checkInIstTime }, "Successfully punched in."));
        }
        else
        {
            if (record.CheckOut != null)
            {
                record.CheckOut = nowUtc;
                record.WorkingHours = (decimal)(nowUtc - record.CheckIn.Value).TotalHours;
                record.UpdatedAt = nowUtc;
                await _context.SaveChangesAsync(ct);
                return Ok(ApiResponse<object>.Ok(new { punchedIn = false, punchInTime = (string?)null }, "Punch out updated."));
            }

            record.CheckOut = nowUtc;
            if (record.CheckIn.HasValue)
            {
                record.WorkingHours = (decimal)(nowUtc - record.CheckIn.Value).TotalHours;
            }
            record.UpdatedAt = nowUtc;

            await _context.SaveChangesAsync(ct);
            return Ok(ApiResponse<object>.Ok(new { punchedIn = false, punchInTime = (string?)null }, "Successfully punched out."));
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<ApiResponse<object>>> GetHistory([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile linked to user."));

        var empId = _currentUser.EmployeeId.Value;
        var targetDate = GetIstTime();
        int targetMonth = month ?? targetDate.Month;
        int targetYear = year ?? targetDate.Year;

        var startDate = new DateOnly(targetYear, targetMonth, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var records = await _context.AttendanceRecords
            .Where(r => r.EmployeeId == empId && r.AttendanceDate >= startDate && r.AttendanceDate <= endDate)
            .ToListAsync(ct);

        var todayIst = GetIstToday();
        int diff = (7 + (todayIst.DayOfWeek - DayOfWeek.Monday)) % 7;
        var weekStart = todayIst.AddDays(-diff);
        var weekEnd = weekStart.AddDays(6);

        var weeklyHours = await _context.AttendanceRecords
            .Where(r => r.EmployeeId == empId && r.AttendanceDate >= weekStart && r.AttendanceDate <= weekEnd)
            .SumAsync(r => r.WorkingHours, ct);

        var checkInTimes = records.Where(r => r.CheckIn.HasValue).Select(r => TimeZoneInfo.ConvertTimeFromUtc(r.CheckIn.Value, GetIstTimeZone())).ToList();
        string avgInTime = "—";
        if (checkInTimes.Count > 0)
        {
            var avgTicks = (long)checkInTimes.Select(t => t.TimeOfDay.Ticks).Average();
            var avgTime = DateTime.Today.Add(TimeSpan.FromTicks(avgTicks));
            avgInTime = avgTime.ToString("hh:mm tt");
        }

        var historyLogs = records.OrderByDescending(r => r.AttendanceDate).Select(r => {
            var checkInIst = r.CheckIn.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckIn.Value, GetIstTimeZone()) : (DateTime?)null;
            var checkOutIst = r.CheckOut.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckOut.Value, GetIstTimeZone()) : (DateTime?)null;
            return new
            {
                key = r.AttendanceId.ToString(),
                date = r.AttendanceDate.ToString("dd MMM yyyy"),
                @in = checkInIst?.ToString("hh:mm tt") ?? "—",
                @out = checkOutIst?.ToString("hh:mm tt") ?? "—",
                duration = r.CheckOut.HasValue && r.CheckIn.HasValue
                    ? FormatDuration(r.CheckOut.Value - r.CheckIn.Value)
                    : "—",
                status = r.Status.ToString()
            };
        }).ToList();

        var calendarDays = records.Select(r => new
        {
            day = r.AttendanceDate.Day,
            status = MapAttendanceStatusToUi(r.Status)
        }).ToList();

        return Ok(ApiResponse<object>.Ok(new
        {
            weeklyHours = $"{weeklyHours:F1} hrs",
            avgInTime,
            historyLogs,
            calendarDays
        }));
    }

    [HttpPost("process-daily")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)] // Assuming HR/Admin can run it
    public async Task<ActionResult<ApiResponse<object>>> ProcessDailyAttendance([FromQuery] string date, [FromServices] IAttendanceProcessingService processingService, CancellationToken ct)
    {
        DateOnly targetDate;
        if (!DateOnly.TryParse(date, out targetDate))
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid date format. Use yyyy-MM-dd."));
        }

        await processingService.ProcessDailyAttendanceAsync(targetDate, ct);
        return Ok(ApiResponse<object>.Ok(null, $"Processed attendance for {targetDate:yyyy-MM-dd} successfully."));
    }

    public class RegularizationRequest
    {
        public DateOnly Date { get; set; }
        public TimeOnly Time { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    [HttpPost("regularize")]
    public async Task<ActionResult<ApiResponse<object>>> Regularize([FromBody] RegularizationRequest req, CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile linked to user."));

        var empId = _currentUser.EmployeeId.Value;
        var nowUtc = DateTime.UtcNow;

        var emp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == empId, ct);
        if (emp != null && !emp.IsActive)
        {
            return BadRequest(ApiResponse<object>.Fail("REGULARIZATION_BLOCKED: Employee account is deactivated/separated. Cannot request regularization."));
        }

        var exitRecord = await _context.ExitRecords.FirstOrDefaultAsync(x => x.EmployeeId == empId && x.Status != ExitStatus.Closed && x.Status != ExitStatus.Withdrawn, ct);
        if (exitRecord != null)
        {
            var lwd = exitRecord.ConfirmedLwd ?? exitRecord.ProposedLwd;
            if (req.Date > lwd)
            {
                return BadRequest(ApiResponse<object>.Fail($"REGULARIZATION_BLOCKED: Cannot regularize attendance beyond your Last Working Day (LWD: {lwd:dd MMM yyyy})."));
            }
        }

        var targetDateTimeIst = req.Date.ToDateTime(req.Time);

        var targetDateTimeUtc = TimeZoneInfo.ConvertTimeToUtc(targetDateTimeIst, GetIstTimeZone());

        var regularization = new AttendanceRegularization
        {
            RegId = Guid.NewGuid(),
            EmployeeId = empId,
            AttendanceDate = req.Date,
            Reason = req.Reason,
            RequestedCheckIn = targetDateTimeUtc,
            RequestedCheckOut = null,
            Status = "Pending",
            CreatedAt = nowUtc
        };

        _context.AttendanceRegularizations.Add(regularization);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(null, "Regularization request submitted successfully."));
    }

    [HttpGet("regularizations")]
    public async Task<ActionResult<ApiResponse<object>>> GetRegularizations(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue)
            return BadRequest(ApiResponse<object>.Fail("No employee profile linked to user."));

        var empId = _currentUser.EmployeeId.Value;

        var list = await _context.AttendanceRegularizations
            .Where(r => r.EmployeeId == empId)
            .OrderByDescending(r => r.AttendanceDate)
            .ToListAsync(ct);

        var result = list.Select(r => {
            var reqTimeIst = r.RequestedCheckIn.HasValue 
                ? TimeZoneInfo.ConvertTimeFromUtc(r.RequestedCheckIn.Value, GetIstTimeZone()) 
                : (DateTime?)null;

            return new
            {
                key = r.RegId.ToString(),
                date = r.AttendanceDate.ToString("dd MMM yyyy"),
                requestTime = reqTimeIst?.ToString("hh:mm tt") ?? "—",
                reason = r.Reason,
                status = r.Status
            };
        }).ToList();

        return Ok(ApiResponse<object>.Ok(result));
    }

    // --- Sub-Tab Endpoints ---

    [HttpGet("team")]
    [Filters.RequirePermission(PermissionCodes.Attendance.View)]
    public async Task<ActionResult<ApiResponse<object>>> GetTeamAttendance(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue) return BadRequest(ApiResponse<object>.Fail("No employee linked."));
        
        var isHR = _currentUser.HasRole(RoleCodes.HRAdmin) || _currentUser.HasRole(RoleCodes.SuperAdmin);
        var isManager = _currentUser.HasRole(RoleCodes.ReportingManager) || _currentUser.HasRole(RoleCodes.DeptManager);

        if (!isHR && !isManager)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Unauthorized access to team data."));

        var empId = _currentUser.EmployeeId.Value;
        var today = GetIstToday();
        var companyId = _currentUser.CompanyId;

        var query = _context.AttendanceRecords
            .Include(r => r.Employee)
                .ThenInclude(e => e.Department)
            .Where(r => r.AttendanceDate == today)
            .AsQueryable();

        if (!isHR)
        {
            query = query.Where(r => r.Employee.ReportingManagerId == empId);
        }
        else if (companyId.HasValue)
        {
            query = query.Where(r => r.Employee.CompanyId == companyId);
        }

        var records = await query.ToListAsync(ct);

        var result = records.Select(r => new
        {
            key = r.AttendanceId.ToString(),
            employeeCode = r.Employee.EmployeeCode,
            employeeName = $"{r.Employee.FirstName} {r.Employee.LastName}",
            department = r.Employee.Department?.DeptName ?? "General",
            checkIn = r.CheckIn.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckIn.Value, GetIstTimeZone()).ToString("hh:mm tt") : "—",
            checkOut = r.CheckOut.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.CheckOut.Value, GetIstTimeZone()).ToString("hh:mm tt") : "—",
            workingHours = $"{r.WorkingHours:F1} hrs",
            status = r.Status.ToString()
        }).ToList();

        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("regularizations/queue")]
    [Filters.RequirePermission(PermissionCodes.Attendance.Approve)]
    public async Task<ActionResult<ApiResponse<object>>> GetRegularizationQueue(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue) return BadRequest(ApiResponse<object>.Fail("No employee linked."));

        var isHR = _currentUser.HasRole(RoleCodes.HRAdmin) || _currentUser.HasRole(RoleCodes.SuperAdmin);
        var isManager = _currentUser.HasRole(RoleCodes.ReportingManager) || _currentUser.HasRole(RoleCodes.DeptManager);

        if (!isHR && !isManager)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Unauthorized access to regularization queue."));

        var empId = _currentUser.EmployeeId.Value;
        var query = _context.AttendanceRegularizations
            .Include(r => r.Employee)
            .Where(r => r.Status == "Pending");

        if (!isHR)
        {
            query = query.Where(r => r.Employee.ReportingManagerId == empId);
        }

        var list = await query.OrderBy(r => r.AttendanceDate).ToListAsync(ct);

        var result = list.Select(r => new
        {
            key = r.RegId.ToString(),
            employeeName = $"{r.Employee.FirstName} {r.Employee.LastName}",
            employeeCode = r.Employee.EmployeeCode,
            date = r.AttendanceDate.ToString("dd MMM yyyy"),
            reason = r.Reason,
            requestedCheckIn = r.RequestedCheckIn.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.RequestedCheckIn.Value, GetIstTimeZone()).ToString("hh:mm tt") : "—",
            requestedCheckOut = r.RequestedCheckOut.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.RequestedCheckOut.Value, GetIstTimeZone()).ToString("hh:mm tt") : "—",
        }).ToList();

        return Ok(ApiResponse<object>.Ok(result));
    }

    public class RejectionDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    [HttpPost("regularizations/{id}/approve")]
    [Filters.RequirePermission(PermissionCodes.Attendance.Approve)]
    public async Task<ActionResult<ApiResponse<object>>> ApproveRegularization(Guid id, CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue) return BadRequest(ApiResponse<object>.Fail("No user context."));

        var reg = await _context.AttendanceRegularizations
            .Include(r => r.Employee)
            .ThenInclude(e => e.Shift)
            .FirstOrDefaultAsync(r => r.RegId == id, ct);

        if (reg == null) return NotFound(ApiResponse<object>.Fail("Regularization not found."));
        if (reg.Status != "Pending") return BadRequest(ApiResponse<object>.Fail("Only pending requests can be approved."));

        // Scope check for manager
        var isHR = _currentUser.HasRole(RoleCodes.HRAdmin) || _currentUser.HasRole(RoleCodes.SuperAdmin);
        if (!isHR && reg.Employee.ReportingManagerId != _currentUser.EmployeeId)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Unauthorized."));

        // HRMS-007: Attendance Period Freeze Lock Check
        var existingRecord = await _context.AttendanceRecords
            .FirstOrDefaultAsync(r => r.EmployeeId == reg.EmployeeId && r.AttendanceDate == reg.AttendanceDate, ct);
        if (existingRecord != null && existingRecord.IsFrozen)
        {
            return BadRequest(ApiResponse<object>.Fail("ATTENDANCE_FROZEN: Attendance record for this date is frozen. Cannot approve regularization."));
        }

        // Update Regularization status
        reg.Status = "Approved";
        reg.ApprovedBy = _currentUser.UserId.Value;
        reg.ApprovedAt = DateTime.UtcNow;

        // Upsert Attendance Record
        var record = existingRecord;
        if (record == null)
        {
            record = new AttendanceRecord
            {
                EmployeeId = reg.EmployeeId,
                AttendanceDate = reg.AttendanceDate,
                Source = AttendanceSource.Manual,
                CreatedAt = DateTime.UtcNow
            };
            _context.AttendanceRecords.Add(record);
        }

        record.CheckIn = reg.RequestedCheckIn ?? record.CheckIn;
        record.CheckOut = reg.RequestedCheckOut ?? record.CheckOut;
        record.IsRegularized = true;
        record.UpdatedAt = DateTime.UtcNow;
        record.Remarks = $"Regularized: {reg.Reason}";

        // Calculate hours and status
        if (record.CheckIn.HasValue && record.CheckOut.HasValue)
        {
            record.WorkingHours = (decimal)(record.CheckOut.Value - record.CheckIn.Value).TotalHours;

            var shift = reg.Employee.Shift;
            if (shift != null && shift.IsActive)
            {
                var checkInIst = TimeZoneInfo.ConvertTimeFromUtc(record.CheckIn.Value, GetIstTimeZone());
                var targetDate = record.AttendanceDate;
                var shiftStartTime = new DateTime(targetDate.Year, targetDate.Month, targetDate.Day, shift.StartTime.Hour, shift.StartTime.Minute, 0);

                var lateMins = (checkInIst - shiftStartTime).TotalMinutes;
                
                if (record.WorkingHours < shift.HalfDayThresholdHrs)
                    record.Status = AttendanceStatus.HalfDay;
                else if (lateMins > shift.GracePeriodMins)
                    record.Status = AttendanceStatus.LatePresent;
                else
                    record.Status = AttendanceStatus.Present;
            }
            else
            {
                // Fallback if no shift is assigned
                record.Status = record.WorkingHours >= 8 ? AttendanceStatus.Present : (record.WorkingHours >= 4 ? AttendanceStatus.HalfDay : AttendanceStatus.Absent);
            }
        }
        else if (record.CheckIn.HasValue || record.CheckOut.HasValue)
        {
            record.Status = AttendanceStatus.MissingPunch;
        }

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Regularization approved successfully."));
    }

    [HttpPost("regularizations/{id}/reject")]
    [Filters.RequirePermission(PermissionCodes.Attendance.Approve)]
    public async Task<ActionResult<ApiResponse<object>>> RejectRegularization(Guid id, [FromBody] RejectionDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason)) return BadRequest(ApiResponse<object>.Fail("Rejection reason is required."));
        if (!_currentUser.UserId.HasValue) return BadRequest(ApiResponse<object>.Fail("No user context."));

        var reg = await _context.AttendanceRegularizations
            .Include(r => r.Employee)
            .FirstOrDefaultAsync(r => r.RegId == id, ct);

        if (reg == null) return NotFound(ApiResponse<object>.Fail("Regularization not found."));
        if (reg.Status != "Pending") return BadRequest(ApiResponse<object>.Fail("Only pending requests can be rejected."));

        var isHR = _currentUser.HasRole(RoleCodes.HRAdmin) || _currentUser.HasRole(RoleCodes.SuperAdmin);
        if (!isHR && reg.Employee.ReportingManagerId != _currentUser.EmployeeId)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Unauthorized."));

        reg.Status = "Rejected";
        reg.RejectionReason = dto.Reason;
        reg.ApprovedBy = _currentUser.UserId.Value;
        reg.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "Regularization rejected."));
    }

    [HttpGet("overtime")]
    public async Task<ActionResult<ApiResponse<object>>> GetOvertime(CancellationToken ct)
    {
        if (!_currentUser.EmployeeId.HasValue) return BadRequest(ApiResponse<object>.Fail("No employee profile."));

        var isHR = _currentUser.HasRole(RoleCodes.HRAdmin) || _currentUser.HasRole(RoleCodes.SuperAdmin);
        var empId = _currentUser.EmployeeId.Value;

        var query = _context.AttendanceRecords
            .Include(r => r.Employee)
            .Where(r => r.OvertimeHours > 0)
            .AsQueryable();

        if (!isHR)
        {
            query = query.Where(r => r.EmployeeId == empId || r.Employee.ReportingManagerId == empId);
        }

        var list = await query.OrderByDescending(r => r.AttendanceDate).Take(50).ToListAsync(ct);

        var result = list.Select(r => new
        {
            key = r.AttendanceId.ToString(),
            employeeCode = r.Employee.EmployeeCode,
            employeeName = $"{r.Employee.FirstName} {r.Employee.LastName}",
            date = r.AttendanceDate.ToString("dd MMM yyyy"),
            overtimeHours = r.OvertimeHours,
            workingHours = r.WorkingHours
        }).ToList();

        return Ok(ApiResponse<object>.Ok(result));
    }

    public class FreezeRequestDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
    }

    [HttpPost("freeze")]
    [Filters.RequirePermission(PermissionCodes.CompanySetup.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> FreezeAttendance([FromBody] FreezeRequestDto request, CancellationToken ct)
    {
        if (!_currentUser.HasRole(RoleCodes.HRAdmin) && !_currentUser.HasRole(RoleCodes.SuperAdmin))
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Only HR Admin can freeze attendance."));

        if (request.Year <= 0 || request.Month < 1 || request.Month > 12)
            return BadRequest(ApiResponse<object>.Fail("Invalid year or month."));

        var startDate = new DateOnly(request.Year, request.Month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var records = await _context.AttendanceRecords
            .Where(a => a.AttendanceDate >= startDate && a.AttendanceDate <= endDate)
            .ToListAsync(ct);

        foreach (var rec in records)
        {
            rec.IsFrozen = true;
            rec.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(new { frozenRecordsCount = records.Count }, $"Attendance for {request.Month}/{request.Year} successfully frozen."));
    }

    [HttpGet("reports")]
    public async Task<ActionResult<ApiResponse<object>>> GetReports([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        var isAuthorized = _currentUser.HasRole(RoleCodes.HRAdmin) || _currentUser.HasRole(RoleCodes.SuperAdmin) ||
                           _currentUser.HasRole(RoleCodes.ReportingManager) || _currentUser.HasRole(RoleCodes.DeptManager) ||
                           _currentUser.HasRole(RoleCodes.PayrollAdmin) || _currentUser.HasRole(RoleCodes.ComplianceOfficer);

        if (!isAuthorized)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Unauthorized access to reports."));

        var now = GetIstTime();
        int m = month ?? now.Month;
        int y = year ?? now.Year;

        var startDate = new DateOnly(y, m, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var reports = await _context.AttendanceRecords
            .Include(r => r.Employee)
            .Where(r => r.AttendanceDate >= startDate && r.AttendanceDate <= endDate)
            .GroupBy(r => new { r.EmployeeId, r.Employee.EmployeeCode, r.Employee.FirstName, r.Employee.LastName })
            .Select(g => new
            {
                employeeId = g.Key.EmployeeId,
                employeeCode = g.Key.EmployeeCode,
                employeeName = $"{g.Key.FirstName} {g.Key.LastName}",
                totalDays = g.Count(),
                presentDays = g.Count(x => x.Status == AttendanceStatus.Present || x.Status == AttendanceStatus.LatePresent || x.Status == AttendanceStatus.WFH),
                absentDays = g.Count(x => x.Status == AttendanceStatus.Absent),
                halfDays = g.Count(x => x.Status == AttendanceStatus.HalfDay),
                leaveDays = g.Count(x => x.Status == AttendanceStatus.Leave),
                totalOvertimeHrs = g.Sum(x => x.OvertimeHours)
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(reports));
    }
}
