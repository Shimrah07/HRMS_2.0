using IndiaHRMS.Application.Interfaces;

namespace IndiaHRMS.API.BackgroundServices;

public class AttendanceBatchProcessor : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AttendanceBatchProcessor> _logger;

    public AttendanceBatchProcessor(IServiceProvider serviceProvider, ILogger<AttendanceBatchProcessor> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AttendanceBatchProcessor is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTimeOffset.UtcNow;
            
            // Indian Standard Time (IST) is UTC+5:30
            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var currentIst = TimeZoneInfo.ConvertTime(now, istZone);
            
            // Run at 1:00 AM IST
            var nextRun = currentIst.Date.AddDays(1).AddHours(1);
            if (currentIst.Hour < 1)
            {
                nextRun = currentIst.Date.AddHours(1);
            }

            var delay = nextRun - currentIst;
            
            _logger.LogInformation("Next attendance batch run scheduled at {NextRunIst} IST (delay: {Delay})", nextRun, delay);
            
            try
            {
                // Wait until the scheduled time or cancellation
                await Task.Delay(delay, stoppingToken);

                // Run the batch job
                using var scope = _serviceProvider.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IAttendanceProcessingService>();
                
                // Target date is the previous day (since we run at 1 AM for yesterday's records)
                var targetDateIst = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, istZone).Date.AddDays(-1);
                var targetDate = DateOnly.FromDateTime(targetDateIst);

                _logger.LogInformation("Processing attendance for date: {TargetDate}", targetDate);
                
                await processor.ProcessDailyAttendanceAsync(targetDate, stoppingToken);
                
                _logger.LogInformation("Successfully completed attendance processing for {TargetDate}", targetDate);
            }
            catch (TaskCanceledException)
            {
                break; // Stop requested
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while processing attendance batch job.");
                // Wait for 15 minutes before retrying on error
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }

        _logger.LogInformation("AttendanceBatchProcessor is stopping.");
    }
}
