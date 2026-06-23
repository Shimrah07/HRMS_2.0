using AutoMapper;
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
                Status = AttendanceStatus.Present,
                Source = AttendanceSource.WebApp,
                IsRegularized = false,
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
}
