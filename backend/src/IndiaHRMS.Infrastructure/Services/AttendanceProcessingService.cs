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

        // 2.5 Get all approved leaves overlapping with the target date
        var leaves = await _context.LeaveApplications
            .Where(l => l.Status == LeaveStatus.Approved && l.FromDate <= targetDate && l.ToDate >= targetDate)
            .ToDictionaryAsync(l => l.EmployeeId, ct);

        // 3. Process each employee
        foreach (var emp in employees)
        {
            var shift = emp.Shift;
            // If employee has no shift, we can't reliably process rules, skip or default to Present
            if (shift == null || !shift.IsActive) continue;

            // Check if it's a weekly off
            bool isWeeklyOff = false;
            var targetDayName = targetDate.DayOfWeek.ToString();
            if (!string.IsNullOrEmpty(shift.WeeklyOffDays))
            {
                var offDays = shift.WeeklyOffDays.Split(',', StringSplitOptions.RemoveEmptyEntries);
                isWeeklyOff = offDays.Contains(targetDayName, StringComparer.OrdinalIgnoreCase);
            }

            records.TryGetValue(emp.EmployeeId, out var record);

            // If no punch record exists at all
            if (record == null)
            {
                if (isWeeklyOff)
                {
                    // No punch on a weekly off = WeeklyOff status
                    record = new AttendanceRecord
                    {
                        AttendanceId = Guid.NewGuid(),
                        EmployeeId = emp.EmployeeId,
                        AttendanceDate = targetDate,
                        Status = AttendanceStatus.WeeklyOff,
                        Source = AttendanceSource.WebApp,
                        CreatedAt = DateTime.UtcNow,
                        IsRegularized = false,
                        IsFrozen = false
                    };
                    _context.AttendanceRecords.Add(record);
                }
                else
                {
                    // No punch on a working day
                    var status = AttendanceStatus.Absent;
                    if (leaves.TryGetValue(emp.EmployeeId, out var approvedLeave))
                    {
                        status = approvedLeave.IsHalfDay ? AttendanceStatus.HalfDay : AttendanceStatus.Leave;
                    }

                    record = new AttendanceRecord
                    {
                        AttendanceId = Guid.NewGuid(),
                        EmployeeId = emp.EmployeeId,
                        AttendanceDate = targetDate,
                        Status = status,
                        Source = AttendanceSource.WebApp,
                        CreatedAt = DateTime.UtcNow,
                        IsRegularized = false,
                        IsFrozen = false
                    };
                    _context.AttendanceRecords.Add(record);
                }
                continue;
            }

            // If record exists and is already regularized, we don't recalculate
            if (record.IsRegularized) continue;

            // If it was already absent or something, check if a leave was approved
            if (!record.CheckIn.HasValue && !record.CheckOut.HasValue)
            {
                if (leaves.TryGetValue(emp.EmployeeId, out var approvedLeave))
                {
                    record.Status = approvedLeave.IsHalfDay ? AttendanceStatus.HalfDay : AttendanceStatus.Leave;
                    record.UpdatedAt = DateTime.UtcNow;
                }
                continue; // no punch to process
            }

            // If record has MissingPunch or just checking
            if (record.CheckIn.HasValue && !record.CheckOut.HasValue)
            {
                // Check if they applied for half-day leave for the missing half? 
                // That might be complex. Let's just mark MissingPunch.
                record.Status = AttendanceStatus.MissingPunch;
                record.UpdatedAt = DateTime.UtcNow;
                continue;
            }

            // If has both CheckIn and CheckOut
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

                // Wait, if it's a weekly off and they worked, should it be Present or WeeklyOff?
                // Often they get CompOff. Let's just mark Present for now, CompOff will be handled in Step 8.
            }
            
            record.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);
    }
}
