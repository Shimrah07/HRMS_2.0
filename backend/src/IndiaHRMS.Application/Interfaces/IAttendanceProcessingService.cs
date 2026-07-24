namespace IndiaHRMS.Application.Interfaces;

public interface IAttendanceProcessingService
{
    Task ProcessDailyAttendanceAsync(DateOnly targetDate, CancellationToken ct);
}
