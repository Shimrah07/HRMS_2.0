using IndiaHRMS.Application.DTOs.Leave;

namespace IndiaHRMS.Application.Interfaces;

public interface ILeavePolicyService
{
    Task<IEnumerable<LeaveTypeDto>> GetLeaveTypesAsync(Guid companyId);
    Task<LeaveTypeDto?> GetLeaveTypeByIdAsync(Guid leaveTypeId);
    Task<LeaveTypeDto> CreateLeaveTypeAsync(CreateLeaveTypeDto dto);
    Task<LeaveTypeDto> UpdateLeaveTypeAsync(Guid leaveTypeId, CreateLeaveTypeDto dto);
    Task<bool> DeleteLeaveTypeAsync(Guid leaveTypeId);
    Task<IEnumerable<LeavePolicyRuleDto>> GetPolicyRulesAsync(Guid leaveTypeId);
    Task<LeavePolicyRuleDto> CreatePolicyRuleAsync(CreateLeavePolicyRuleDto dto);
    Task<bool> DeletePolicyRuleAsync(Guid ruleId);
    Task SeedDefaultLeaveTypesAsync(Guid companyId);
}
