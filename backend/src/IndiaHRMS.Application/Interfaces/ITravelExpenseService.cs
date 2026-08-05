using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IndiaHRMS.Application.DTOs.TravelExpense;

namespace IndiaHRMS.Application.Interfaces;

public interface ITravelExpenseService
{
    // ─── Sub-Module 8.2: Travel Policy & Entitlements ───────────────────────────
    Task<List<TravelEntitlementDto>> GetEntitlementsAsync();
    Task<TravelEntitlementDto> GetEntitlementByGradeAsync(string gradeBand);
    Task<TravelEntitlementDto> SaveEntitlementAsync(CreateEntitlementDto dto);
    Task<PolicyExceptionResponseDto> RequestPolicyExceptionAsync(PolicyExceptionRequestDto dto);
    Task<PolicyExceptionResponseDto> ReviewPolicyExceptionAsync(Guid exceptionId, string role, bool isApproved);

    // ─── Sub-Module 8.1: Travel Requests & Booking ──────────────────────────────
    Task<TravelRequestDto> CreateTravelRequestAsync(Guid employeeId, CreateTravelRequestDto dto);
    Task<List<TravelRequestDto>> GetTravelRequestsAsync(Guid? employeeId = null, string? status = null);
    Task<TravelRequestDto> GetTravelRequestByIdAsync(Guid requestId);
    Task<TravelRequestDto> ApproveTravelRequestAsync(Guid requestId, Guid approverId, ApproveTravelRequestDto dto);
    Task<TravelBookingDto> ConfirmBookingAsync(Guid requestId, Guid confirmedByUserId, ConfirmBookingDto dto);

    // ─── Sub-Module 8.6: Travel Advance Management ─────────────────────────────
    Task<TravelAdvanceDto> RequestTravelAdvanceAsync(Guid employeeId, TravelAdvanceRequestDto dto);
    Task<List<TravelAdvanceDto>> GetTravelAdvancesAsync(Guid? employeeId = null, string? status = null);
    Task<TravelAdvanceDto> DisburseAdvanceAsync(Guid advanceId, DisburseAdvanceDto dto);
    Task<List<TravelAdvanceDto>> GetOverdueAdvancesAsync();

    // ─── Sub-Module 8.3 & 8.4: Expense Claims & OCR ─────────────────────────────
    Task<ExpenseClaimDto> SubmitExpenseClaimAsync(Guid employeeId, CreateExpenseClaimDto dto);
    Task<List<ExpenseClaimDto>> GetExpenseClaimsAsync(Guid? employeeId = null, string? status = null);
    Task<ExpenseClaimDto> GetExpenseClaimByIdAsync(Guid claimId);
    Task<ExpenseClaimDto> ApproveExpenseClaimAsync(Guid claimId, Guid approverId, ApproveExpenseClaimDto dto);
    Task<OcrScanResponseDto> ProcessOcrScanAsync(OcrScanRequestDto dto);
    Task<List<ExpenseLineItemDto>> GetGstSummaryAsync(string month);
    Task<bool> ReconcileCreditCardStatementAsync(string statementJson);

    // ─── Sub-Module 8.5: Reimbursement Workflows ───────────────────────────────
    Task<ReimbursementBatchDto> CreateReimbursementBatchAsync(Guid processedByUserId, ReimbursementBatchRequestDto dto);
    Task<List<ReimbursementBatchDto>> GetReimbursementBatchesAsync();

    // ─── Sub-Module 8.7: Sector Policy Config ──────────────────────────────────
    Task<List<SectorPolicyConfigDto>> GetSectorConfigsAsync();
    Task<SectorPolicyConfigDto> UpdateSectorConfigAsync(string sectorName, bool isActive, string configJson);

    // ─── Sub-Module 8.8: Analytics & Reports ───────────────────────────────────
    Task<TEAnalyticsSummaryDto> GetAnalyticsSummaryAsync();
    Task<List<TEReportItemDto>> GetReportDataAsync(TEReportFilterDto filter);

    // ─── Payroll Integration Methods ───────────────────────────────────────────
    Task<List<TravelAdvanceDto>> GetPendingPayrollAdvancesAsync(Guid employeeId);
    Task<List<ExpenseClaimDto>> GetPendingPayrollReimbursementsAsync(Guid employeeId);
    Task MarkAdvanceRecoveredInPayrollAsync(Guid advanceId, Guid payslipId);
    Task MarkClaimReimbursedInPayrollAsync(Guid claimId, Guid payslipId);
}

