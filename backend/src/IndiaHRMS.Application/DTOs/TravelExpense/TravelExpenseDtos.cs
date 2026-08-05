using System;
using System.Collections.Generic;

namespace IndiaHRMS.Application.DTOs.TravelExpense;

// ─── Sub-Module 8.2: Entitlements & Policy ────────────────────────────────────

public class TravelEntitlementDto
{
    public Guid EntitlementId { get; set; }
    public string GradeBand { get; set; } = string.Empty;
    public string FlightClass { get; set; } = string.Empty;
    public string TrainClass { get; set; } = string.Empty;
    public string HotelCategory { get; set; } = string.Empty;
    public decimal DAMetro { get; set; }
    public decimal DANonMetro { get; set; }
    public bool IsActive { get; set; }
}

public class CreateEntitlementDto
{
    public string GradeBand { get; set; } = string.Empty;
    public string FlightClass { get; set; } = "Economy";
    public string TrainClass { get; set; } = "AC 3-Tier";
    public string HotelCategory { get; set; } = "3-Star";
    public decimal DAMetro { get; set; } = 1500;
    public decimal DANonMetro { get; set; } = 1000;
}

public class PolicyExceptionRequestDto
{
    public Guid TravelRequestId { get; set; }
    public string EntitledCategory { get; set; } = string.Empty;
    public string RequestedCategory { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal AdditionalCostImpact { get; set; }
}

public class PolicyExceptionResponseDto
{
    public Guid ExceptionId { get; set; }
    public Guid TravelRequestId { get; set; }
    public string EntitledCategory { get; set; } = string.Empty;
    public string RequestedCategory { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal AdditionalCostImpact { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? ApprovedByHOD { get; set; }
    public Guid? ApprovedByFinance { get; set; }
}

// ─── Sub-Module 8.1: Travel Request & Booking ─────────────────────────────────

public class CreateTravelRequestDto
{
    public string TravelType { get; set; } = "Domestic"; // Domestic, International
    public string Purpose { get; set; } = string.Empty;
    public string ProjectCode { get; set; } = string.Empty;
    public string FromCity { get; set; } = string.Empty;
    public string ToCity { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string ModeOfTravel { get; set; } = "Flight";
    public bool HotelRequired { get; set; } = true;
    public string? CoTravelers { get; set; }
    public string BusinessJustification { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }

    // International Specifics
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public string? VisaStatus { get; set; }
    public string? ForexCurrency { get; set; }
    public decimal ForexAmount { get; set; }
    public string? TravelInsuranceInfo { get; set; }
}

public class TravelRequestDto
{
    public Guid RequestId { get; set; }
    public string TravelCode { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string GradeBand { get; set; } = string.Empty;
    public string TravelType { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string ProjectCode { get; set; } = string.Empty;
    public string FromCity { get; set; } = string.Empty;
    public string ToCity { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string ModeOfTravel { get; set; } = string.Empty;
    public bool HotelRequired { get; set; }
    public string? CoTravelers { get; set; }
    public string BusinessJustification { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime AppliedAt { get; set; }
    public Guid? ApproverId { get; set; }
    public string? ApproverName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }

    // International Specifics
    public string? PassportNumber { get; set; }
    public DateOnly? PassportExpiry { get; set; }
    public string? VisaStatus { get; set; }
    public string? ForexCurrency { get; set; }
    public decimal ForexAmount { get; set; }
    public string? TravelInsuranceInfo { get; set; }

    public TravelBookingDto? Booking { get; set; }
    public PolicyExceptionResponseDto? PolicyException { get; set; }
}

public class ApproveTravelRequestDto
{
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
}

public class ConfirmBookingDto
{
    public Guid TravelRequestId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string TicketDetails { get; set; } = string.Empty;
    public string HotelDetails { get; set; } = string.Empty;
    public string? AttachmentPath { get; set; }
}

public class TravelBookingDto
{
    public Guid BookingId { get; set; }
    public Guid TravelRequestId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public string TicketDetails { get; set; } = string.Empty;
    public string HotelDetails { get; set; } = string.Empty;
    public string? AttachmentPath { get; set; }
    public Guid? ConfirmedBy { get; set; }
    public string? ConfirmedByName { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}

// ─── Sub-Module 8.6: Travel Advance Management ───────────────────────────────

public class TravelAdvanceRequestDto
{
    public Guid TravelRequestId { get; set; }
    public decimal EstimatedTripCost { get; set; }
    public decimal AmountRequested { get; set; }
    public string DisbursementMode { get; set; } = "Bank Transfer";
    public DateOnly ExpectedSettlementDate { get; set; }
}

public class TravelAdvanceDto
{
    public Guid AdvanceId { get; set; }
    public string AdvanceCode { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public Guid TravelRequestId { get; set; }
    public string TravelCode { get; set; } = string.Empty;
    public decimal EstimatedTripCost { get; set; }
    public decimal AmountRequested { get; set; }
    public decimal AmountDisbursed { get; set; }
    public string DisbursementMode { get; set; } = string.Empty;
    public DateTime? DisbursedAt { get; set; }
    public DateOnly ExpectedSettlementDate { get; set; }
    public string Status { get; set; } = string.Empty; // Pending, Disbursed, Settled, PartiallySettled, OverdueRecovery
    public int AgingDays { get; set; }
    public string AgingBadgeColor { get; set; } = "green"; // green (0-15), yellow (16-30), red (31+)
}

public class DisburseAdvanceDto
{
    public decimal AmountDisbursed { get; set; }
    public string DisbursementMode { get; set; } = "Bank Transfer";
}

// ─── Sub-Module 8.3 & 8.4: Expense Claims & OCR Receipt ────────────────────────

public class CreateExpenseLineItemDto
{
    public string Category { get; set; } = string.Empty;
    public DateOnly ExpenseDate { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public decimal GstAmount { get; set; }
    public string? VendorGstin { get; set; }
    public string? BillPath { get; set; }
    public bool IsPolicyCompliant { get; set; } = true;
    public bool IsBillable { get; set; } = false;
    public decimal ClientMarkupPercent { get; set; }
    public string? GuestDetails { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class CreateExpenseClaimDto
{
    public Guid? TravelRequestId { get; set; }
    public List<CreateExpenseLineItemDto> LineItems { get; set; } = new List<CreateExpenseLineItemDto>();
}

public class ExpenseLineItemDto
{
    public Guid LineItemId { get; set; }
    public Guid ClaimId { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateOnly ExpenseDate { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal GstAmount { get; set; }
    public string? VendorGstin { get; set; }
    public string? BillPath { get; set; }
    public bool IsPolicyCompliant { get; set; }
    public bool IsBillable { get; set; }
    public decimal ClientMarkupPercent { get; set; }
    public string? GuestDetails { get; set; }
    public string Description { get; set; } = string.Empty;
    public OcrExtractionLogDto? OcrLog { get; set; }
}

public class ExpenseClaimDto
{
    public Guid ClaimId { get; set; }
    public string ClaimCode { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public Guid? TravelRequestId { get; set; }
    public string? TravelCode { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AdvanceAdjusted { get; set; }
    public decimal NetPayable { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public Guid? ManagerApproverId { get; set; }
    public string? ManagerApproverName { get; set; }
    public DateTime? ManagerApprovedAt { get; set; }
    public Guid? FinanceApproverId { get; set; }
    public string? FinanceApproverName { get; set; }
    public DateTime? FinanceApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public List<ExpenseLineItemDto> LineItems { get; set; } = new List<ExpenseLineItemDto>();
}

public class ApproveExpenseClaimDto
{
    public string RoleLevel { get; set; } = "Manager"; // Manager or Finance
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
}

public class OcrScanRequestDto
{
    public string FileBase64 { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class OcrScanResponseDto
{
    public decimal ExtractedAmount { get; set; }
    public DateOnly ExtractedDate { get; set; }
    public string VendorName { get; set; } = string.Empty;
    public string Gstin { get; set; } = string.Empty;
    public decimal ConfidenceScore { get; set; }
    public string RawText { get; set; } = string.Empty;
    public bool DuplicateDetected { get; set; }
}

public class OcrExtractionLogDto
{
    public Guid ExtractionId { get; set; }
    public decimal ExtractedAmount { get; set; }
    public DateOnly? ExtractedDate { get; set; }
    public string? ExtractedVendor { get; set; }
    public string? ExtractedGstin { get; set; }
    public decimal ConfidenceScore { get; set; }
}

// ─── Sub-Module 8.5: Reimbursement Batches ───────────────────────────────────

public class ReimbursementBatchRequestDto
{
    public List<Guid> ClaimIds { get; set; } = new List<Guid>();
    public string DisbursementMode { get; set; } = "Payroll"; // Payroll or BankTransfer
}

public class ReimbursementBatchDto
{
    public Guid BatchId { get; set; }
    public string BatchCode { get; set; } = string.Empty;
    public DateTime RunDate { get; set; }
    public int TotalClaims { get; set; }
    public decimal TotalAmount { get; set; }
    public string DisbursementMode { get; set; } = string.Empty;
    public Guid? ProcessedBy { get; set; }
    public string? ProcessedByName { get; set; }
}

// ─── Sub-Module 8.7: Sector Policy Config ────────────────────────────────────

public class SectorPolicyConfigDto
{
    public Guid SectorConfigId { get; set; }
    public string SectorName { get; set; } = string.Empty;
    public bool IsDefaultActive { get; set; }
    public string ConfigJson { get; set; } = string.Empty;
}

// ─── Sub-Module 8.8: Analytics & Reports ─────────────────────────────────────

public class TEAnalyticsSummaryDto
{
    public decimal TotalSpendThisMonth { get; set; }
    public int PendingTravelRequests { get; set; }
    public int ActiveClaimsCount { get; set; }
    public int OverdueAdvanceCount { get; set; }
    public decimal AverageReimbursementTatDays { get; set; }
    public decimal PolicyViolationRatePct { get; set; }
    public List<TopCitySpendDto> TopVisitedCities { get; set; } = new List<TopCitySpendDto>();
    public List<CategorySpendDto> SpendByCategory { get; set; } = new List<CategorySpendDto>();
}

public class TopCitySpendDto
{
    public string CityName { get; set; } = string.Empty;
    public int TripCount { get; set; }
    public decimal TotalSpend { get; set; }
}

public class CategorySpendDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}

public class TEReportFilterDto
{
    public string ReportId { get; set; } = string.Empty; // 1 to 14
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? EmployeeId { get; set; }
    public string? Format { get; set; } = "JSON"; // JSON or Excel
}

public class TEReportItemDto
{
    public string Column1 { get; set; } = string.Empty;
    public string Column2 { get; set; } = string.Empty;
    public string Column3 { get; set; } = string.Empty;
    public string Column4 { get; set; } = string.Empty;
    public string Column5 { get; set; } = string.Empty;
    public string Column6 { get; set; } = string.Empty;
    public decimal AmountValue { get; set; }
    public string Status { get; set; } = string.Empty;
}
