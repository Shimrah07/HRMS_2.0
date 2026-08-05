using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.Infrastructure.Services;

public class AttendanceProcessingService : IAttendanceProcessingService
{
    private readonly AppDbContext _context;

    public AttendanceProcessingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task ProcessDailyAttendanceAsync(DateOnly targetDate, CancellationToken ct)
    {
        // 1. Get all active employees and their shifts
        var employees = await _context.Employees
            .Include(e => e.Shift)
            .Where(e => e.IsActive)
            .ToListAsync(ct);

        // 2. Get all attendance records for the target date
        var records = await _context.AttendanceRecords
            .Where(r => r.AttendanceDate == targetDate && !r.IsFrozen)
            .ToDictionaryAsync(r => r.EmployeeId, ct);

        // 2. Get all raw punch logs for target date
        var targetStartUtc = targetDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc).AddHours(-6); // Buffer for IST
        var targetEndUtc = targetDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc).AddHours(6);
        
        var punchLogs = await _context.PunchLogs
            .Where(p => p.PunchTimestamp >= targetStartUtc && p.PunchTimestamp <= targetEndUtc)
            .ToListAsync(ct);

        // 2.5 Get all approved leaves overlapping with the target date
        var leaves = await _context.LeaveApplications
            .Where(l => l.Status == LeaveStatus.Approved && l.FromDate <= targetDate && l.ToDate >= targetDate)
            .ToDictionaryAsync(l => l.EmployeeId, ct);

        // 3. Process each employee
        foreach (var emp in employees)
        {
            var shift = emp.Shift;
            // If employee has no shift, skip or default
            if (shift == null || !shift.IsActive) continue;

            // Resolve punch logs for this employee on target date
            var empPunches = punchLogs
                .Where(p => p.EmployeeId == emp.EmployeeId && DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(p.PunchTimestamp, TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"))) == targetDate)
                .OrderBy(p => p.PunchTimestamp)
                .ToList();

            // Check if it's a weekly off
            bool isWeeklyOff = false;
            var targetDayName = targetDate.DayOfWeek.ToString();
            if (!string.IsNullOrEmpty(shift.WeeklyOffDays))
            {
                var offDays = shift.WeeklyOffDays.Split(',', StringSplitOptions.RemoveEmptyEntries);
                isWeeklyOff = offDays.Contains(targetDayName, StringComparer.OrdinalIgnoreCase);
            }

            records.TryGetValue(emp.EmployeeId, out var record);

            // Derive CheckIn / CheckOut from raw PunchLogs if available
            DateTime? derivedCheckIn = empPunches.FirstOrDefault(p => p.PunchType == PunchType.In)?.PunchTimestamp;
            DateTime? derivedCheckOut = empPunches.LastOrDefault(p => p.PunchType == PunchType.Out)?.PunchTimestamp;

            // If no punch record exists at all
            if (record == null)
            {
                if (derivedCheckIn == null && derivedCheckOut == null)
                {
                    var status = isWeeklyOff ? AttendanceStatus.WeeklyOff : AttendanceStatus.Absent;
                    if (!isWeeklyOff && leaves.TryGetValue(emp.EmployeeId, out var approvedLeave))
                    {
                        status = approvedLeave.IsHalfDay ? AttendanceStatus.HalfDay : AttendanceStatus.Leave;
                    }

                    record = new AttendanceRecord
                    {
                        AttendanceId = Guid.NewGuid(),
                        EmployeeId = emp.EmployeeId,
                        ShiftId = shift.ShiftId,
                        AttendanceDate = targetDate,
                        Status = status,
                        Source = AttendanceSource.WebApp,
                        CreatedAt = DateTime.UtcNow,
                        IsRegularized = false,
                        IsFrozen = false
                    };
                    _context.AttendanceRecords.Add(record);
                    continue;
                }
                else
                {
                    record = new AttendanceRecord
                    {
                        AttendanceId = Guid.NewGuid(),
                        EmployeeId = emp.EmployeeId,
                        ShiftId = shift.ShiftId,
                        AttendanceDate = targetDate,
                        CheckIn = derivedCheckIn,
                        CheckOut = derivedCheckOut,
                        WorkingHours = (derivedCheckIn.HasValue && derivedCheckOut.HasValue) ? (decimal)(derivedCheckOut.Value - derivedCheckIn.Value).TotalHours : 0,
                        Status = AttendanceStatus.MissingPunch,
                        Source = AttendanceSource.WebApp,
                        CreatedAt = DateTime.UtcNow,
                        IsRegularized = false,
                        IsFrozen = false
                    };
                    _context.AttendanceRecords.Add(record);
                }
            }

            // Snapshot ShiftId if missing
            if (!record.ShiftId.HasValue)
            {
                record.ShiftId = shift.ShiftId;
            }

            // If record exists and is already regularized, we don't recalculate timestamps
            if (record.IsRegularized) continue;

            // Update timestamps from punch logs if not manually modified
            if (derivedCheckIn.HasValue && !record.CheckIn.HasValue) record.CheckIn = derivedCheckIn;
            if (derivedCheckOut.HasValue) record.CheckOut = derivedCheckOut;

            if (record.CheckIn.HasValue && record.CheckOut.HasValue)
            {
                record.WorkingHours = (decimal)(record.CheckOut.Value - record.CheckIn.Value).TotalHours;
            }

            // Evaluate Status
            if (!record.CheckIn.HasValue && !record.CheckOut.HasValue)
            {
                if (leaves.TryGetValue(emp.EmployeeId, out var approvedLeave))
                {
                    record.Status = approvedLeave.IsHalfDay ? AttendanceStatus.HalfDay : AttendanceStatus.Leave;
                    record.UpdatedAt = DateTime.UtcNow;
                }
                continue;
            }

            if (record.CheckIn.HasValue && !record.CheckOut.HasValue)
            {
                record.Status = AttendanceStatus.MissingPunch;
                record.UpdatedAt = DateTime.UtcNow;
                continue;
            }

            if (record.CheckIn.HasValue && record.CheckOut.HasValue)
            {
                var checkInIst = TimeZoneInfo.ConvertTimeFromUtc(record.CheckIn.Value, TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));
                var shiftStartTime = new DateTime(targetDate.Year, targetDate.Month, targetDate.Day, shift.StartTime.Hour, shift.StartTime.Minute, 0);

                var lateMins = (checkInIst - shiftStartTime).TotalMinutes;
                
                if (record.WorkingHours < shift.HalfDayThresholdHrs)
                {
                    record.Status = AttendanceStatus.HalfDay;
                }
                else if (lateMins > shift.GracePeriodMins)
                {
                    record.Status = AttendanceStatus.LatePresent;
                }
                else
                {
                    record.Status = AttendanceStatus.Present;
                }
            }
            
            record.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);
    }
}
