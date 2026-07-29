using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface ILeaveEngineService
{
    Task<IEnumerable<LeaveBalanceDto>> GetEmployeeBalancesAsync(Guid employeeId, int year);
    Task<IEnumerable<LeaveLedgerDto>> GetEmployeeLedgerAsync(Guid employeeId, Guid? leaveTypeId = null, int? year = null);
    Task<LeaveBalanceDto> AdjustBalanceAsync(AdjustLeaveBalanceDto dto);
    Task<int> RunMonthlyAccrualAsync(int year, int month);
    Task InitializeEmployeeBalancesForYearAsync(Guid employeeId, int year);
}
