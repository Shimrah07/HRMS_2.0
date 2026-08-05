using IndiaHRMS.Application.DTOs.Exit;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Shared;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.Application.Interfaces;

public interface IExitManagementService
{
    // Resignation & Notice
    Task<ExitRecordDto> SubmitResignationAsync(Guid employeeId, ResignationSubmitDto dto, CancellationToken ct = default);
    Task<NoticePeriodCalcDto> CalculateNoticePeriodAsync(Guid employeeId, CancellationToken ct = default);
    Task<ExitRecordDto> ConfirmLastWorkingDayAsync(Guid exitId, ConfirmLwdDto dto, CancellationToken ct = default);
    Task<ExitRecordDto> WithdrawResignationAsync(Guid exitId, ResignationWithdrawDto dto, CancellationToken ct = default);
    Task<PagedList<ExitRecordDto>> GetExitRecordsAsync(PaginationRequest request, string? status = null, Guid? deptId = null, CancellationToken ct = default);
    Task<ExitRecordDto?> GetExitRecordByIdAsync(Guid exitId, CancellationToken ct = default);
    Task<ExitRecordDto?> GetMyExitRecordAsync(Guid employeeId, CancellationToken ct = default);

    // Counter Offer
    Task<CounterOfferDto> CreateCounterOfferAsync(Guid exitId, CounterOfferCreateDto dto, CancellationToken ct = default);
    Task<CounterOfferDto> RespondToCounterOfferAsync(Guid offerId, CounterOfferResponseDto dto, CancellationToken ct = default);
    Task<List<CounterOfferDto>> GetCounterOffersAsync(Guid exitId, CancellationToken ct = default);

    // Multi-Dept Clearance
    Task<List<ExitClearanceDto>> GetClearanceStatusAsync(Guid exitId, CancellationToken ct = default);
    Task<ExitClearanceDto> ApproveClearanceAsync(Guid exitId, ClearanceDepartment department, ClearanceApproveDto dto, CancellationToken ct = default);

    // Exit Interview
    Task<ExitInterviewDto> SubmitExitInterviewAsync(Guid exitId, ExitInterviewSubmitDto dto, CancellationToken ct = default);
    Task<ExitInterviewAnalyticsDto> GetInterviewAnalyticsAsync(Guid? deptId = null, CancellationToken ct = default);

    // Full & Final Settlement (FFS)
    Task<FFSCalculationDto> CalculateFFSAsync(Guid exitId, CancellationToken ct = default);
    Task<FFSCalculationDto> ApproveFFSAsync(Guid exitId, FFSApproveDto dto, CancellationToken ct = default);
    Task<FFSCalculationDto> DisburseFFSAsync(Guid exitId, FFSDisburseDto dto, CancellationToken ct = default);

    // Documentation (Relieving / Experience / FFS / Acceptance)
    Task<ExitDocumentDto> GenerateDocumentAsync(Guid exitId, ExitDocumentType documentType, ExitConductRemark conductRemark = ExitConductRemark.Satisfactory, CancellationToken ct = default);
    Task<List<ExitDocumentDto>> GetExitDocumentsAsync(Guid exitId, CancellationToken ct = default);

    // Sector Configuration
    Task<List<SectorExitConfigDto>> GetSectorConfigsAsync(Guid companyId, CancellationToken ct = default);
    Task<SectorExitConfigDto> SaveSectorConfigAsync(Guid companyId, SectorExitConfigDto dto, CancellationToken ct = default);

    // Attrition Analytics
    Task<AttritionSummaryDto> GetAttritionSummaryAsync(Guid companyId, int? year = null, CancellationToken ct = default);
}
