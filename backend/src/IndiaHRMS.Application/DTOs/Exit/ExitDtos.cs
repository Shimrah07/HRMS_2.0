using IndiaHRMS.Domain.Enums;
using System;
using System.Collections.Generic;

namespace IndiaHRMS.Application.DTOs.Exit;

public class ResignationSubmitDto
{
    public ExitType ExitType { get; set; } = ExitType.Voluntary;
    public DateOnly ProposedLwd { get; set; }
    public string PrimaryReason { get; set; } = string.Empty;
    public string? AdditionalComments { get; set; }
}

public class ConfirmLwdDto
{
    public DateOnly ConfirmedLwd { get; set; }
    public bool EarlyReleaseApproved { get; set; }
    public bool BuyoutAllowed { get; set; }
    public decimal BuyoutAmount { get; set; }
    public string? Remarks { get; set; }
}

public class ResignationWithdrawDto
{
    public string WithdrawalReason { get; set; } = string.Empty;
}

public class NoticePeriodCalcDto
{
    public int PolicyDays { get; set; }
    public DateOnly CalculatedLwd { get; set; }
    public bool EarlyReleaseAllowed { get; set; }
    public bool BuyoutAllowed { get; set; }
    public string RequiredApprovals { get; set; } = string.Empty;
}

public class ExitRecordDto
{
    public Guid ExitId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public DateTime ResignationDate { get; set; }
    public DateOnly ProposedLwd { get; set; }
    public DateOnly? ConfirmedLwd { get; set; }
    public ExitType ExitType { get; set; }
    public string PrimaryReason { get; set; } = string.Empty;
    public string? AdditionalComments { get; set; }
    public bool IsRegretted { get; set; }
    public ExitStatus Status { get; set; }
    public int NoticePeriodDays { get; set; }
    public bool EarlyReleaseRequested { get; set; }
    public DateOnly? RequestedLwd { get; set; }
    public bool EarlyReleaseApproved { get; set; }
    public bool BuyoutAllowed { get; set; }
    public decimal BuyoutAmount { get; set; }
    public string WithdrawalStatus { get; set; } = "None";
    public string? WithdrawalReason { get; set; }
    public DateTime? WithdrawalRequestedAt { get; set; }
    public string? ConfirmedByName { get; set; }
    public string? ReportingManagerName { get; set; }
    public List<CounterOfferDto> CounterOffers { get; set; } = new();
    public List<ExitClearanceDto> Clearances { get; set; } = new();
    public ExitInterviewDto? ExitInterview { get; set; }
    public FFSCalculationDto? FFSCalculation { get; set; }
    public List<ExitDocumentDto> Documents { get; set; } = new();
}

public class CounterOfferCreateDto
{
    public decimal ProposedCtc { get; set; }
    public string? OtherConsiderations { get; set; }
}

public class CounterOfferResponseDto
{
    public CounterOfferResponse Response { get; set; }
}

public class CounterOfferDto
{
    public Guid OfferId { get; set; }
    public Guid ExitId { get; set; }
    public decimal CurrentCtc { get; set; }
    public decimal ProposedCtc { get; set; }
    public string? OtherConsiderations { get; set; }
    public string? ApprovedByName { get; set; }
    public CounterOfferResponse EmployeeResponse { get; set; }
    public DateTime? ResponseDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ExitClearanceDto
{
    public Guid ClearanceId { get; set; }
    public Guid ExitId { get; set; }
    public ClearanceDepartment Department { get; set; }
    public DeptClearanceStatus Status { get; set; }
    public decimal DuesAmount { get; set; }
    public string? DuesDetails { get; set; }
    public string? Remarks { get; set; }
    public string? ClearedByName { get; set; }
    public DateTime? ClearedAt { get; set; }
}

public class ClearanceApproveDto
{
    public DeptClearanceStatus Status { get; set; } = DeptClearanceStatus.Cleared;
    public decimal DuesAmount { get; set; }
    public string? DuesDetails { get; set; }
    public string? Remarks { get; set; }
}

public class ExitInterviewSubmitDto
{
    public string InterviewMode { get; set; } = "Online Self-Service Form";
    public int OverallRating { get; set; } = 5;
    public int ManagerRating { get; set; } = 5;
    public int GrowthRating { get; set; } = 5;
    public int CompRating { get; set; } = 5;
    public int WorkLifeBalanceRating { get; set; } = 5;
    public string WouldRecommend { get; set; } = "Definitely Yes";
    public string? OpenFeedback { get; set; }
    public string? HrConfidentialNotes { get; set; }
}

public class ExitInterviewDto
{
    public Guid InterviewId { get; set; }
    public Guid ExitId { get; set; }
    public string InterviewMode { get; set; } = string.Empty;
    public int OverallRating { get; set; }
    public int ManagerRating { get; set; }
    public int GrowthRating { get; set; }
    public int CompRating { get; set; }
    public int WorkLifeBalanceRating { get; set; }
    public string WouldRecommend { get; set; } = string.Empty;
    public string? OpenFeedback { get; set; }
    public string? HrConfidentialNotes { get; set; }
    public DateTime SubmittedAt { get; set; }
}


public class ExitInterviewAnalyticsDto
{
    public double AvgOverallRating { get; set; }
    public double AvgManagerRating { get; set; }
    public double AvgGrowthRating { get; set; }
    public double AvgCompRating { get; set; }
    public double AvgWorkLifeRating { get; set; }
    public Dictionary<string, int> RecommendBreakdown { get; set; } = new();
    public Dictionary<string, int> TopLeavingReasons { get; set; } = new();
    public int TotalInterviews { get; set; }
}

public class FFSCalculationDto
{
    public Guid FFSId { get; set; }
    public Guid ExitId { get; set; }
    public decimal PendingSalary { get; set; }
    public decimal LeaveEncashment { get; set; }
    public decimal Gratuity { get; set; }
    public decimal ProRataBonus { get; set; }
    public decimal AssetDeduction { get; set; }
    public decimal LoanDeduction { get; set; }
    public decimal NoticeShortfallDeduction { get; set; }
    public decimal TdsDeduction { get; set; }
    public decimal GrossPayable { get; set; }
    public decimal NetPayable { get; set; }
    public FFSStatus Status { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? DisbursedAt { get; set; }
    public string? PaymentReference { get; set; }
}

public class FFSApproveDto
{
    public string? Remarks { get; set; }
}

public class FFSDisburseDto
{
    public string PaymentReference { get; set; } = string.Empty;
}

public class ExitDocumentDto
{
    public Guid DocumentId { get; set; }
    public Guid ExitId { get; set; }
    public ExitDocumentType DocumentType { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public ExitConductRemark ConductRemark { get; set; }
    public DateTime GeneratedAt { get; set; }
}

public class SectorExitConfigDto
{
    public Guid ConfigId { get; set; }
    public Guid CompanyId { get; set; }
    public string SectorName { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class AttritionSummaryDto
{
    public int TotalExitsMonth { get; set; }
    public int TotalExitsYear { get; set; }
    public double AttritionRate { get; set; }
    public int VoluntaryExits { get; set; }
    public int InvoluntaryExits { get; set; }
    public int RegrettedExits { get; set; }
    public double AvgClearanceTatDays { get; set; }
    public double AvgFfsTatDays { get; set; }
    public Dictionary<string, int> ExitsByDepartment { get; set; } = new();
    public Dictionary<string, int> ExitsByReason { get; set; } = new();
}
