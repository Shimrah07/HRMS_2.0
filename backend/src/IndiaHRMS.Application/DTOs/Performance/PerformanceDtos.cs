using System;
using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Application.DTOs.Performance;

// ─── Appraisal Cycle ──────────────────────────────────────────────────────────

public class AppraisalCycleDto
{
    public Guid CycleId { get; set; }
    public Guid CompanyId { get; set; }
    public string CycleName { get; set; } = string.Empty;
    public AppraisalCycleType CycleType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateOnly? GoalSettingDeadline { get; set; }
    public DateOnly? MidYearDeadline { get; set; }
    public DateOnly? FinalReviewDeadline { get; set; }
    public AppraisalCycleStatus Status { get; set; }
}

public class CreateAppraisalCycleRequest
{
    public string CycleName { get; set; } = string.Empty;
    public AppraisalCycleType CycleType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateOnly? GoalSettingDeadline { get; set; }
    public DateOnly? MidYearDeadline { get; set; }
    public DateOnly? FinalReviewDeadline { get; set; }
    public AppraisalCycleStatus Status { get; set; } = AppraisalCycleStatus.Draft;
}

// ─── Employee Goal (OKR) ──────────────────────────────────────────────────────

public class EmployeeGoalDto
{
    public Guid GoalId { get; set; }
    public Guid CycleId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string GoalTitle { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? KPI { get; set; }
    public string? TargetValue { get; set; }
    public string? ActualValue { get; set; }
    public decimal Weightage { get; set; }
    public decimal? SelfRating { get; set; }
    public decimal? ManagerRating { get; set; }
    public string Status { get; set; } = "Active";
}

public class CreateGoalRequest
{
    public Guid CycleId { get; set; }
    public Guid? EmployeeId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? KPI { get; set; }
    public string? TargetValue { get; set; }
    public decimal Weightage { get; set; }
}

public class UpdateGoalRequest
{
    public string GoalTitle { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? KPI { get; set; }
    public string? TargetValue { get; set; }
    public string? ActualValue { get; set; }
    public decimal Weightage { get; set; }
    public decimal? SelfRating { get; set; }
    public decimal? ManagerRating { get; set; }
    public string Status { get; set; } = "Active";
}

// ─── Performance Review ───────────────────────────────────────────────────────

public class PerformanceReviewDto
{
    public Guid ReviewId { get; set; }
    public Guid CycleId { get; set; }
    public string CycleName { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public Guid ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public ReviewType ReviewType { get; set; }
    public decimal? OverallRating { get; set; }
    public string? Strengths { get; set; }
    public string? AreasForImprovement { get; set; }
    public string? TrainingRecommendations { get; set; }
    public decimal? IncrementRecommended { get; set; }
    public bool PromotionRecommended { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? SubmittedAt { get; set; }
}

public class CreateReviewRequest
{
    public Guid CycleId { get; set; }
    public Guid EmployeeId { get; set; }
    public ReviewType ReviewType { get; set; } = ReviewType.Manager;
    public decimal? OverallRating { get; set; }
    public string? Strengths { get; set; }
    public string? AreasForImprovement { get; set; }
    public string? TrainingRecommendations { get; set; }
    public decimal? IncrementRecommended { get; set; }
    public bool PromotionRecommended { get; set; }
    public string Status { get; set; } = "Pending";
}

// ─── Performance Improvement Plan (PIP) ───────────────────────────────────────

public class PipDto
{
    public Guid PIPId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ImprovementAreas { get; set; }
    public string? Milestones { get; set; }
    public PIPStatus Status { get; set; }
    public Guid InitiatedBy { get; set; }
    public string InitiatorName { get; set; } = string.Empty;
    public DateTime? ClosedAt { get; set; }
}

public class CreatePipRequest
{
    public Guid EmployeeId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ImprovementAreas { get; set; }
    public string? Milestones { get; set; }
}

public class UpdatePipRequest
{
    public string? ImprovementAreas { get; set; }
    public string? Milestones { get; set; }
    public PIPStatus Status { get; set; }
}
