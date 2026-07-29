using System.Text;
using IndiaHRMS.Application.DTOs.Leave;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class HolidayService : IHolidayService
{
    private readonly AppDbContext _context;
    private readonly ILogger<HolidayService> _logger;

    public HolidayService(AppDbContext context, ILogger<HolidayService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<HolidayCalendarDto>> GetHolidayCalendarAsync(Guid companyId, Guid? locationId = null, int? year = null)
    {
        int targetYear = year ?? DateTime.UtcNow.Year;

        // Auto-seed default Indian 2026 Holidays if empty
        var existingCount = await _context.HolidayCalendars.CountAsync(h => h.HolidayDate.Year == targetYear);
        if (existingCount == 0)
        {
            await SeedDefaultIndianHolidaysAsync(companyId, targetYear);
        }

        var query = _context.HolidayCalendars
            .Include(h => h.Location)
            .Where(h => h.CompanyId == companyId && h.HolidayDate.Year == targetYear && h.IsActive);

        if (locationId.HasValue && locationId.Value != Guid.Empty)
        {
            query = query.Where(h => h.LocationId == null || h.LocationId == locationId.Value);
        }

        var holidays = await query.OrderBy(h => h.HolidayDate).ToListAsync();

        return holidays.Select(h => new HolidayCalendarDto
        {
            HolidayId = h.HolidayId,
            CompanyId = h.CompanyId,
            LocationId = h.LocationId,
            LocationName = h.Location?.LocationName ?? "All Locations (Pan India)",
            HolidayDate = h.HolidayDate,
            HolidayName = h.HolidayName,
            HolidayType = h.HolidayType.ToString(),
            StateCode = null,
            IsRestrictedHoliday = h.HolidayType == Domain.Enums.HolidayType.Optional,
            Description = h.HolidayName
        });
    }

    public async Task<HolidayCalendarDto> CreateHolidayAsync(CreateHolidayDto dto)
    {
        var holiday = new HolidayCalendar
        {
            CompanyId = dto.CompanyId,
            LocationId = dto.LocationId,
            HolidayDate = dto.HolidayDate,
            HolidayName = dto.HolidayName,
            HolidayType = Enum.TryParse<Domain.Enums.HolidayType>(dto.HolidayType, true, out var ht) ? ht : Domain.Enums.HolidayType.Mandatory,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.HolidayCalendars.Add(holiday);
        await _context.SaveChangesAsync();

        var location = dto.LocationId.HasValue ? await _context.Locations.FindAsync(dto.LocationId.Value) : null;

        return new HolidayCalendarDto
        {
            HolidayId = holiday.HolidayId,
            CompanyId = holiday.CompanyId,
            LocationId = holiday.LocationId,
            LocationName = location?.LocationName ?? "All Locations (Pan India)",
            HolidayDate = holiday.HolidayDate,
            HolidayName = holiday.HolidayName,
            HolidayType = holiday.HolidayType.ToString(),
            StateCode = dto.StateCode,
            IsRestrictedHoliday = dto.IsRestrictedHoliday,
            Description = dto.Description
        };
    }

    public async Task<bool> SelectOptionalHolidayAsync(Guid employeeId, Guid holidayId)
    {
        var holiday = await _context.HolidayCalendars.FindAsync(holidayId);
        if (holiday == null || holiday.HolidayType != Domain.Enums.HolidayType.Optional) return false;

        // Check if employee already selected max 2 optional holidays
        var year = holiday.HolidayDate.Year;
        var existingSelectionsCount = await _context.LeaveApplications
            .Include(a => a.LeaveType)
            .Where(a => a.EmployeeId == employeeId && a.LeaveType.LeaveCode == "OH" && a.FromDate.Year == year && a.Status != Domain.Enums.LeaveStatus.Rejected && a.Status != Domain.Enums.LeaveStatus.Cancelled)
            .CountAsync();

        if (existingSelectionsCount >= 2)
        {
            throw new InvalidOperationException("You have reached the maximum quota of 2 Optional / Restricted Holidays per year.");
        }

        // Get OH Leave Type
        var ohLeaveType = await _context.LeaveTypes.FirstOrDefaultAsync(l => l.LeaveCode == "OH");
        if (ohLeaveType == null)
            throw new KeyNotFoundException("Optional Holiday leave type (OH) not configured.");

        // Create Leave Application for the optional holiday
        var app = new LeaveApplication
        {
            EmployeeId = employeeId,
            LeaveTypeId = ohLeaveType.LeaveTypeId,
            FromDate = holiday.HolidayDate,
            ToDate = holiday.HolidayDate,
            TotalDays = 1.0m,
            IsHalfDay = false,
            Reason = $"Optional Holiday Selection: {holiday.HolidayName}",
            Status = Domain.Enums.LeaveStatus.Approved,
            AppliedAt = DateTime.UtcNow
        };

        _context.LeaveApplications.Add(app);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> GenerateICalendarFeedAsync(Guid companyId, Guid? locationId, int year)
    {
        var holidays = await GetHolidayCalendarAsync(companyId, locationId, year);

        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//IndiaHRMS 2.0//Enterprise Holiday Calendar//EN");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine("METHOD:PUBLISH");

        foreach (var h in holidays)
        {
            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:holiday-{h.HolidayId}@indiahrms.com");
            sb.AppendLine($"DTSTAMP:{DateTime.UtcNow:yyyyMMddTHHmmssZ}");
            sb.AppendLine($"DTSTART;VALUE=DATE:{h.HolidayDate:yyyyMMdd}");
            sb.AppendLine($"DTEND;VALUE=DATE:{h.HolidayDate.AddDays(1):yyyyMMdd}");
            sb.AppendLine($"SUMMARY:{h.HolidayName} ({h.HolidayType})");
            sb.AppendLine($"DESCRIPTION:{h.Description ?? h.HolidayName} - Location: {h.LocationName}");
            sb.AppendLine("STATUS:CONFIRMED");
            sb.AppendLine("END:VEVENT");
        }

        sb.AppendLine("END:VCALENDAR");
        return sb.ToString();
    }

    private async Task SeedDefaultIndianHolidaysAsync(Guid companyId, int year)
    {
        var defaultHolidays = new List<HolidayCalendar>
        {
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 1, 26), HolidayName = "Republic Day", HolidayType = Domain.Enums.HolidayType.National },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 3, 25), HolidayName = "Holi", HolidayType = Domain.Enums.HolidayType.Mandatory },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 4, 14), HolidayName = "Dr. B.R. Ambedkar Jayanti / Good Friday", HolidayType = Domain.Enums.HolidayType.Mandatory },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 5, 1), HolidayName = "May Day / Maharashtra Day", HolidayType = Domain.Enums.HolidayType.State },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 8, 15), HolidayName = "Independence Day", HolidayType = Domain.Enums.HolidayType.National },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 9, 7), HolidayName = "Ganesh Chaturthi", HolidayType = Domain.Enums.HolidayType.Optional },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 10, 2), HolidayName = "Mahatma Gandhi Jayanti", HolidayType = Domain.Enums.HolidayType.National },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 10, 24), HolidayName = "Dussehra (Vijayadashami)", HolidayType = Domain.Enums.HolidayType.Mandatory },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 11, 1), HolidayName = "Kannada Rajyotsava", HolidayType = Domain.Enums.HolidayType.State },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 11, 12), HolidayName = "Diwali (Deepavali)", HolidayType = Domain.Enums.HolidayType.Mandatory },
            new() { CompanyId = companyId, HolidayDate = new DateOnly(year, 12, 25), HolidayName = "Christmas Day", HolidayType = Domain.Enums.HolidayType.Mandatory }
        };

        _context.HolidayCalendars.AddRange(defaultHolidays);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Seeded default 11 Indian National & State Holidays for year {Year}", year);
    }
}
