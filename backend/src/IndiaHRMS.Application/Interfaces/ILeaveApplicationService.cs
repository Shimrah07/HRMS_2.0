using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface ILeaveApplicationService
{
    Task<LeaveApplicationDto> ApplyLeaveAsync(CreateLeaveApplicationDto dto);
    Task<LeaveApplicationDto> ApproveLeaveAsync(Guid leaveAppId, ApproveRejectLeaveDto dto);
    Task<LeaveApplicationDto> RejectLeaveAsync(Guid leaveAppId, ApproveRejectLeaveDto dto);
    Task<bool> CancelLeaveAsync(Guid leaveAppId, Guid requestedByUserId);
    Task<IEnumerable<LeaveApplicationDto>> GetEmployeeApplicationsAsync(Guid employeeId);
    Task<IEnumerable<LeaveApplicationDto>> GetPendingApprovalsAsync(Guid managerUserId);
    Task<LeaveApplicationDto?> GetApplicationByIdAsync(Guid leaveAppId);
    Task<decimal> CheckTeamOverlapPercentageAsync(Guid departmentId, DateOnly fromDate, DateOnly toDate);
}
