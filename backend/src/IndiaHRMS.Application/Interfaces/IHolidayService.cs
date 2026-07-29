using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface IHolidayService
{
    Task<IEnumerable<HolidayCalendarDto>> GetHolidayCalendarAsync(Guid companyId, Guid? locationId = null, int? year = null);
    Task<HolidayCalendarDto> CreateHolidayAsync(CreateHolidayDto dto);
    Task<bool> SelectOptionalHolidayAsync(Guid employeeId, Guid holidayId);
    Task<string> GenerateICalendarFeedAsync(Guid companyId, Guid? locationId, int year);
}
