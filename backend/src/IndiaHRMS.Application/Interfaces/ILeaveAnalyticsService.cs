using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface ILeaveAnalyticsService
{
    Task<LeaveDashboardSummaryDto> GetDashboardSummaryAsync(Guid companyId, Guid? employeeId = null);
    Task<byte[]> ExportEnterpriseReportAsync(Guid companyId, string reportType, int year);
}

public class ReportExportDto
{
    public string ReportName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "text/csv";
    public byte[] Data { get; set; } = Array.Empty<byte>();
}
