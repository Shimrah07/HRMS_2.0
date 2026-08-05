using System;
using System.Collections.Generic;
using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Application.DTOs.Recruitment;

// ─── Phase 1: Manpower Requisition (MRF) & Job Posting ──────────────────────

public class JobRequisitionDto
{
    public Guid ReqId { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? DeptId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public Guid? DesignationId { get; set; }
    public string DesignationTitle { get; set; } = string.Empty;
    public Guid? GradeId { get; set; }
    public int NoOfPositions { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? JobDescription { get; set; }
    public int? MinExperience { get; set; }
    public int? MaxExperience { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string? SkillsRequired { get; set; }
    public DateOnly RequisitionDate { get; set; }
    public DateOnly? TargetDate { get; set; }
    public RequisitionStatus Status { get; set; }
    public Guid RaisedBy { get; set; }
    public string RaisedByUserName { get; set; } = string.Empty;
    public Guid? ApprovedBy { get; set; }
    public string? ApprovedByUserName { get; set; }

    // Enterprise Enhancements
    public string MrfNumber { get; set; } = string.Empty;
    public Guid? SubDeptId { get; set; }
    public string SubDepartmentName { get; set; } = string.Empty;
    public Guid? HiringManagerId { get; set; }
    public string HiringManagerName { get; set; } = string.Empty;
    public string Priority { get; set; } = "Normal";
    public string VacancyType { get; set; } = "New";
    public Guid? ReplacingEmployeeId { get; set; }
    public string ReplacingEmployeeName { get; set; } = string.Empty;
    public string Justification { get; set; } = string.Empty;
    public string SourcingPreference { get; set; } = "All";
    public string? InternalHiringJustification { get; set; }
    public string? InternalHiringRemarks { get; set; }
    public Guid? CurrentApproverId { get; set; }
    public string CurrentApproverName { get; set; } = string.Empty;
    public int CurrentApprovalLevel { get; set; }
    public string DesignationName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string RaisedByName { get; set; } = string.Empty;
    public Guid? CancelledBy { get; set; }
    public DateTime? CancelledOn { get; set; }
    public string? CancelReason { get; set; }
}

public class CreateJobRequisitionRequest
{
    public Guid? DeptId { get; set; }
    public Guid? DesignationId { get; set; }
    public Guid? GradeId { get; set; }
    public int? NoOfPositions { get; set; }
    public string? JobTitle { get; set; }
    public string? JobDescription { get; set; }
    public int? MinExperience { get; set; }
    public int? MaxExperience { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string? SkillsRequired { get; set; }
    public DateOnly? TargetDate { get; set; }

    // Enterprise Enhancements
    public Guid? SubDeptId { get; set; }
    public Guid? HiringManagerId { get; set; }
    public string? Priority { get; set; } = "Normal";
    public string? VacancyType { get; set; } = "New";
    public Guid? ReplacingEmployeeId { get; set; }
    public string? Justification { get; set; }
    public string? SourcingPreference { get; set; } = "All";
}

public class UpdateJobRequisitionRequest
{
    public Guid? DeptId { get; set; }
    public Guid? DesignationId { get; set; }
    public Guid? GradeId { get; set; }
    public int? NoOfPositions { get; set; }
    public string? JobTitle { get; set; }
    public string? JobDescription { get; set; }
    public int? MinExperience { get; set; }
    public int? MaxExperience { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string? SkillsRequired { get; set; }
    public DateOnly? TargetDate { get; set; }
    public RequisitionStatus? Status { get; set; }

    // Enterprise Enhancements
    public Guid? SubDeptId { get; set; }
    public Guid? HiringManagerId { get; set; }
    public string? Priority { get; set; } = "Normal";
    public string? VacancyType { get; set; } = "New";
    public Guid? ReplacingEmployeeId { get; set; }
    public string? Justification { get; set; }
    public string? SourcingPreference { get; set; } = "All";
}

public class ApproveJobRequisitionRequest
{
    public bool Approved { get; set; }
    public string? Comment { get; set; }
}

public class JobPostingDto
{
    public Guid JobId { get; set; }
    public Guid ReqId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? JobDescription { get; set; }
    public string? PublishChannels { get; set; } // Deprecated string value
    public DateTime PostedAt { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public bool ShowSalary { get; set; }
    public string Status { get; set; } = string.Empty;

    // Enterprise ATS Sourcing Schema
    public string? JobCategory { get; set; }
    public string? Industry { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? ExperienceMin { get; set; }
    public decimal? ExperienceMax { get; set; }
    public bool ShowSalaryRange { get; set; }
    public bool ShowCompanyName { get; set; }
    public string? PerksAndBenefits { get; set; } // Deprecated string perks
    public bool AutoUnpublish { get; set; }
    public bool ScreeningEnabled { get; set; }

    public string? RolesAndResponsibilities { get; set; }
    public string? Requirements { get; set; }
    public string? SkillsRequired { get; set; }
    public string? Benefits { get; set; }

    // Requisition Details Map-overs
    public string? InternalJobTitle { get; set; }
    public string? DepartmentName { get; set; }
    public string? DesignationName { get; set; }
    public string? GradeName { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }

    public List<string> PublishingChannels { get; set; } = new();
    public List<string> PerksAndBenefitsList { get; set; } = new();
    public List<JobPostingQuestionDto> JobPostingQuestions { get; set; } = new();

    // Publisher tracking
    public Guid? PublishedById { get; set; }
    public string? PublishedByName { get; set; }

    // Extensibility fields
    public string? WorkMode { get; set; }
    public string? LocationName { get; set; }
    public string? ExternalLink { get; set; }
    public string? MetadataJson { get; set; }

    // Additional fields needed for Job Openings Dashboard
    public string? HiringManagerName { get; set; }
    public int? NoOfPositions { get; set; }
    public string? MrfNumber { get; set; }
    public int ApplicantCount { get; set; }
}

public class CreateJobPostingRequest
{
    public Guid ReqId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? JobDescription { get; set; }
    public List<string> PublishChannels { get; set; } = new(); // Kept for backward compatibility
    public DateOnly? ExpiryDate { get; set; }
    public bool ShowSalary { get; set; }

    // Enterprise ATS Sourcing Schema
    public string? JobCategory { get; set; }
    public string? Industry { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? ExperienceMin { get; set; }
    public decimal? ExperienceMax { get; set; }
    public bool ShowSalaryRange { get; set; }
    public bool ShowCompanyName { get; set; }
    public bool AutoUnpublish { get; set; }
    public bool ScreeningEnabled { get; set; }

    public string? RolesAndResponsibilities { get; set; }
    public string? Requirements { get; set; }
    public string? SkillsRequired { get; set; }
    public string? Benefits { get; set; }

    public List<string> PublishingChannels { get; set; } = new();
    public List<string> PerksAndBenefits { get; set; } = new();
    public List<CreateJobPostingQuestionRequest> JobPostingQuestions { get; set; } = new();

    // Extensibility fields
    public string? WorkMode { get; set; }
    public string? LocationName { get; set; }
    public string? ExternalLink { get; set; }
    public string? MetadataJson { get; set; }
}

public class UpdateJobPostingRequest
{
    public string JobTitle { get; set; } = string.Empty;
    public string? JobDescription { get; set; }
    public List<string> PublishChannels { get; set; } = new();
    public DateOnly? ExpiryDate { get; set; }
    public bool ShowSalary { get; set; }
    public string Status { get; set; } = string.Empty;

    // Enterprise ATS Sourcing Schema
    public string? JobCategory { get; set; }
    public string? Industry { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? ExperienceMin { get; set; }
    public decimal? ExperienceMax { get; set; }
    public bool ShowSalaryRange { get; set; }
    public bool ShowCompanyName { get; set; }
    public bool AutoUnpublish { get; set; }
    public bool ScreeningEnabled { get; set; }

    public string? RolesAndResponsibilities { get; set; }
    public string? Requirements { get; set; }
    public string? SkillsRequired { get; set; }
    public string? Benefits { get; set; }

    public List<string> PublishingChannels { get; set; } = new();
    public List<string> PerksAndBenefits { get; set; } = new();
    public List<CreateJobPostingQuestionRequest> JobPostingQuestions { get; set; } = new();

    // Extensibility fields
    public string? WorkMode { get; set; }
    public string? LocationName { get; set; }
    public string? ExternalLink { get; set; }
    public string? MetadataJson { get; set; }
}

// ─── Phase 2: Candidate Database & ATS Pipeline ──────────────────────────────

public class CandidateDto
{
    public Guid CandidateId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public string? CurrentDesignation { get; set; }
    public string? CurrentCompany { get; set; }
    public decimal? TotalExperience { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public string? ResumeFilePath { get; set; }
    public string? Source { get; set; }

    // Enterprise ATS Sourcing Schema
    public decimal? RelevantExperience { get; set; }
    public string? HighestQualification { get; set; }
    public string? PreferredLocation { get; set; }
    public string? CurrentLocation { get; set; }
    public string? WillingToRelocate { get; set; }
    public Guid? ReferralEmployeeId { get; set; }
    public string? ReferralEmployeeName { get; set; }
    public string? CandidateTags { get; set; }
    public string CandidateStatus { get; set; } = string.Empty;
    public DateTime? LastApplicationDate { get; set; }

    public DateOnly? DateOfBirth { get; set; }
    public string? LinkedIn { get; set; }
    public string? Portfolio { get; set; }
    public string? Skills { get; set; }
    public string? Languages { get; set; }

    public bool IsBlacklisted { get; set; }
    public string? BlacklistReason { get; set; }

    // Latest application enrichment (populated by GetCandidates)
    public string? LatestJobTitle { get; set; }
    public string? LatestDepartmentName { get; set; }
    public DateTime? LatestApplicationDate { get; set; }
    public string? LatestStage { get; set; }
    public string? AssignedRecruiterName { get; set; }
    public int ApplicationsCount { get; set; }
}

public class CreateCandidateRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public string? CurrentDesignation { get; set; }
    public string? CurrentCompany { get; set; }
    public decimal? TotalExperience { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public string? Source { get; set; }

    // Enterprise ATS Sourcing Schema
    public decimal? RelevantExperience { get; set; }
    public string? HighestQualification { get; set; }
    public string? PreferredLocation { get; set; }
    public string? CurrentLocation { get; set; }
    public string? WillingToRelocate { get; set; }
    public Guid? ReferralEmployeeId { get; set; }
    public string? CandidateTags { get; set; }

    public DateOnly? DateOfBirth { get; set; }
    public string? LinkedIn { get; set; }
    public string? Portfolio { get; set; }
    public string? Skills { get; set; }
    public string? Languages { get; set; }
}

public class UpdateCandidateRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public string? CurrentDesignation { get; set; }
    public string? CurrentCompany { get; set; }
    public decimal? TotalExperience { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public string? Source { get; set; }

    // Enterprise ATS Sourcing Schema
    public decimal? RelevantExperience { get; set; }
    public string? HighestQualification { get; set; }
    public string? PreferredLocation { get; set; }
    public string? CurrentLocation { get; set; }
    public string? WillingToRelocate { get; set; }
    public Guid? ReferralEmployeeId { get; set; }
    public string? CandidateTags { get; set; }
    public string? CandidateStatus { get; set; }

    public DateOnly? DateOfBirth { get; set; }
    public string? LinkedIn { get; set; }
    public string? Portfolio { get; set; }
    public string? Skills { get; set; }
    public string? Languages { get; set; }
}

// ─── Screening Questions & Answers DTOs ───────────────────────────────────────

public class JobPostingQuestionDto
{
    public Guid QuestionId { get; set; }
    public Guid JobPostingId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public bool Required { get; set; }
    public bool DealBreaker { get; set; }
    public string? ExpectedAnswer { get; set; }
    public int Sequence { get; set; }
    public int Weightage { get; set; }
}

public class CreateJobPostingQuestionRequest
{
    public string Question { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "YesNo";
    public bool Required { get; set; }
    public bool DealBreaker { get; set; }
    public string? ExpectedAnswer { get; set; }
    public int Sequence { get; set; }
    public int Weightage { get; set; } = 10;
}

public class CandidateAnswerDto
{
    public Guid AnswerId { get; set; }
    public Guid CandidateId { get; set; }
    public Guid QuestionId { get; set; }
    public string Answer { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public DateTime AnsweredOn { get; set; }
    public Guid? AnsweredBy { get; set; }
}

public class CreateCandidateAnswerRequest
{
    public Guid QuestionId { get; set; }
    public string Answer { get; set; } = string.Empty;
}

public class JobApplicationDto
{
    public Guid AppId { get; set; }
    public Guid ReqId { get; set; }
    public Guid? JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public Guid CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public DateTime ApplicationDate { get; set; }
    public ApplicationStage CurrentStage { get; set; }
    public string? RejectionReason { get; set; }
    public decimal? AiMatchScore { get; set; }
    public string TimelineEventsJson { get; set; } = "[]";
    public string NotesJson { get; set; } = "[]";
    public Guid? AssignedRecruiterId { get; set; }
    public string? AssignedRecruiterName { get; set; }
    public DateTime? InterviewDate { get; set; }

    public bool? TechnicalApproved { get; set; }
    public bool? HrApproved { get; set; }
    public bool? ManagerApproved { get; set; }
    public string StageDataJson { get; set; } = "{}";
    public string Status { get; set; } = "Active";
    public Guid? EmployeeId { get; set; }
    public string? Source { get; set; }
    public bool IsBlacklisted { get; set; }
    public string? BlacklistReason { get; set; }
    public CandidateDto? Candidate { get; set; }
}

public class AddApplicationNoteRequest
{
    public string Note { get; set; } = string.Empty;
}

public class ApplicationNote
{
    public string Author { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Content { get; set; } = string.Empty;
}

public class CreateJobApplicationRequest
{
    public Guid ReqId { get; set; }
    public Guid CandidateId { get; set; }
}

public class UpdateApplicationStageRequest
{
    public ApplicationStage Stage { get; set; }
    public string? RejectionReason { get; set; }
    public string? Remarks { get; set; }
    public string? ActionType { get; set; } // e.g. "SendOffer", "StartBGV", "DocsReceived", etc.
    public bool? TechnicalApproved { get; set; }
    public bool? HrApproved { get; set; }
    public bool? ManagerApproved { get; set; }
    public string? StageDataJson { get; set; }
}

public class ConvertCandidateRequest
{
    public Guid DeptId { get; set; }
    public Guid DesignationId { get; set; }
    public DateOnly JoiningDate { get; set; }
    public Guid? ReportingManagerId { get; set; }
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public Guid? ShiftId { get; set; }
    public Guid? GradeId { get; set; }
    public Guid? CostCenterId { get; set; }
    public PayrollGroup? PayrollGroup { get; set; }
}

// ─── ATS Apply-to-Job (unified entry for Manual HR + Future Careers Portal) ────

public class ApplyToJobRequest
{
    // Job targeting — only JobId, ReqId is resolved internally
    public Guid JobId { get; set; }

    // Candidate identity (locked when existing candidate selected)
    public Guid? ExistingCandidateId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }

    // Professional details (always editable, even for existing candidates)
    public string? CurrentCompany { get; set; }
    public string? CurrentDesignation { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public decimal? TotalExperience { get; set; }
    public string? Source { get; set; }
    public string? ResumeFilePath { get; set; }
    public Guid? ReferralEmployeeId { get; set; }

    // Audit & recruiter auto-assignment (set by controller from ICurrentUserService)
    public Guid? AddedByUserId { get; set; }
}

public class ApplyToJobResult
{
    public Guid CandidateId { get; set; }
    public Guid AppId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string Stage { get; set; } = "Applied";
    public bool IsNewCandidate { get; set; }
    public string? AssignedRecruiterName { get; set; }
}

public class CandidateLookupDto
{
    public Guid CandidateId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CurrentCompany { get; set; }
    public string? CurrentDesignation { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public decimal? TotalExperience { get; set; }
    public string? Source { get; set; }
    public string? ResumeFilePath { get; set; }
}

// ─── Phase 3: Interview Management ───────────────────────────────────────────

public class InterviewRoundPanelistDto
{
    public Guid PanelistId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? Rating { get; set; }
    public string? Feedback { get; set; }
    public DateTime? SubmittedAt { get; set; }
}

public class InterviewRoundDto
{
    public Guid RoundId { get; set; }
    public Guid? AppId { get; set; }
    public string RoundName { get; set; } = string.Empty;
    public string? RoundType { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public Guid InterviewerId { get; set; }
    public string InterviewerName { get; set; } = string.Empty;
    public string? Venue { get; set; }
    public string? MeetingLink { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? Rating { get; set; }
    public string? Feedback { get; set; }
    public DateTime? CompletedAt { get; set; }

    // General Interview & Extra DTO Fields
    public bool IsGeneralInterview { get; set; }
    public string? Category { get; set; }
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public string? CandidatePhone { get; set; }
    public string? Company { get; set; }
    public string? Department { get; set; }
    public string? Notes { get; set; }
    public string? AttachmentsJson { get; set; }
    public string? ChecklistJson { get; set; }

    // Navigation info
    public Guid? CandidateId { get; set; }
    public string? JobTitle { get; set; }

    public List<InterviewRoundPanelistDto> Panelists { get; set; } = new();
}

public class ScheduleInterviewRequest
{
    public Guid? AppId { get; set; }
    public string RoundName { get; set; } = string.Empty;
    public string? RoundType { get; set; }
    public DateTime ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Venue { get; set; }
    public string? MeetingLink { get; set; }
    public List<Guid> InterviewerIds { get; set; } = new();
    public bool AllowConflict { get; set; } = false;

    // General interview fields
    public bool IsGeneralInterview { get; set; }
    public string? Category { get; set; }
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public string? CandidatePhone { get; set; }
    public string? Company { get; set; }
    public string? Department { get; set; }
    public string? Notes { get; set; }
}

public class UpdateInterviewRequest
{
    public DateTime? ScheduledAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? RoundName { get; set; }
    public string? RoundType { get; set; }
    public string? Venue { get; set; }
    public string? MeetingLink { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public List<Guid>? InterviewerIds { get; set; }
    public bool AllowConflict { get; set; } = false;
}

public class SubmitInterviewerFeedbackRequest
{
    public Guid PanelistId { get; set; }
    public decimal Rating { get; set; }
    public string Feedback { get; set; } = string.Empty;
}

// ─── Phase 4: Offer Management ───────────────────────────────────────────────

public class OfferLetterDto
{
    public Guid OfferId { get; set; }
    public Guid AppId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public decimal OfferedCTC { get; set; }
    public DateOnly JoiningDate { get; set; }
    public DateTime OfferDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public OfferStatus Status { get; set; }
    public string? LetterFilePath { get; set; }
    public DateTime? AcceptedAt { get; set; }
    // Sprint 3.4 — CTC breakdown (populated from OfferCtcBreakups table)
    public decimal? Basic { get; set; }
    public decimal? HRA { get; set; }
    public decimal? SpecialAllowance { get; set; }
    public decimal? PFEmployer { get; set; }
    public decimal? Gratuity { get; set; }
    public decimal? Insurance { get; set; }
    public decimal? GrossMonthly { get; set; }
    public decimal? AnnualCTC { get; set; }
}

public class CreateOfferRequest
{
    public Guid AppId { get; set; }
    public decimal OfferedCTC { get; set; }
    public DateOnly? JoiningDate { get; set; }
    public int ExpiryDays { get; set; } = 30;
}

// ─── Phase 5: Background Verification (BGV) ──────────────────────────────────

public class BGVRecordDto
{
    public Guid BGVId { get; set; }
    public Guid CandidateId { get; set; }
    public string AgencyName { get; set; } = string.Empty;
    public string BGVType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? DiscrepancyNotes { get; set; }
    public DateTime? InitiatedAt { get; set; }
    public string IdentityStatus { get; set; } = string.Empty;
    public string EmploymentStatus { get; set; } = string.Empty;
    public string EducationStatus { get; set; } = string.Empty;
    public string CriminalStatus { get; set; } = string.Empty;
    public string ReferenceStatus { get; set; } = string.Empty;
    public string CreditStatus { get; set; } = string.Empty;
}

public class InitiateBGVRequest
{
    public Guid CandidateId { get; set; }
    public string AgencyName { get; set; } = string.Empty;
    public string BGVType { get; set; } = "Standard";
}

public class UpdateBGVCheckRequest
{
    public string CheckType { get; set; } = string.Empty; // Identity, Employment, Education, Criminal, Reference, Credit
    public string Status { get; set; } = string.Empty; // Pending, InProgress, Cleared, Failed, Conditional
    public string? Notes { get; set; }
}

// ─── Phase 6 & 7: Pre-Joining & Onboarding ───────────────────────────────────

public class OnboardingProcessDto
{
    public Guid OnboardingId { get; set; }
    public Guid CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool PersonalInfoCompleted { get; set; }
    public bool DocumentsUploaded { get; set; }
    public string HRChecklistJson { get; set; } = "[]";
    public string ITChecklistJson { get; set; } = "[]";
    public string AdminChecklistJson { get; set; } = "[]";
    public string? AssetAllocation { get; set; }
    public Guid? BuddyEmployeeId { get; set; }
    public string? BuddyName { get; set; }
    public string? InductionSchedule { get; set; }
    public string TransitionHistoryJson { get; set; } = "[]";
    public OnboardingProgressDto? Progress { get; set; }
    public SlaSummaryDto? Sla { get; set; }
}

public class OnboardingChecklistUpdateRequest
{
    public string Department { get; set; } = string.Empty; // HR, IT, Admin
    public string ChecklistJson { get; set; } = "[]";
}

public class AssignBuddyAssetRequest
{
    public Guid? BuddyEmployeeId { get; set; }
    public string? AssetAllocation { get; set; }
    public string? InductionSchedule { get; set; }
}

public class AcceptOfferRequest
{
    public string Remarks { get; set; } = string.Empty;
}

public class OnboardingTaskDto
{
    public Guid TaskId { get; set; }
    public Guid OnboardingId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public Guid? OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? SLADays { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public string? AttachmentPath { get; set; }
    public string AuditHistoryJson { get; set; } = "[]";
}

public class UpdateOnboardingTaskRequest
{
    public string Status { get; set; } = string.Empty; // Pending, InProgress, Completed, Overdue, Blocked
    public string Remarks { get; set; } = string.Empty;
    public string? AttachmentPath { get; set; }
    public Guid? OwnerId { get; set; }
}

public class ProbationReviewDto
{
    public Guid ReviewId { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int CheckpointDays { get; set; }
    public DateOnly ReviewDueDate { get; set; }
    public DateOnly? CompletedDate { get; set; }
    public string Rating { get; set; } = string.Empty;
    public string Comments { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? ReviewerId { get; set; }
    public string? ReviewerName { get; set; }
}

public class SubmitProbationReviewRequest
{
    public string Rating { get; set; } = string.Empty; // Meets Expectations, Needs Improvement, Unsatisfactory
    public string Comments { get; set; } = string.Empty;
}

public class ConfirmProbationRequest
{
    public string Action { get; set; } = string.Empty; // Confirm, Extend, Separate
    public int? ExtensionDays { get; set; }
    public string? Comments { get; set; }
}

public class OnboardingProgressDto
{
    public decimal OverallProgress { get; set; }
    public decimal HrProgress { get; set; }
    public decimal ItProgress { get; set; }
    public decimal AdminProgress { get; set; }
    public decimal EmployeeProgress { get; set; }
    public decimal ManagerProgress { get; set; }
}

public class SlaSummaryDto
{
    public int DueToday { get; set; }
    public int Upcoming { get; set; }
    public int Overdue { get; set; }
    public int Completed { get; set; }
    public int Escalated { get; set; }
}

public class InternalActionRequest
{
    public string Action { get; set; } = string.Empty; // Assign, Continue, Cancel
    public Guid? EmployeeId { get; set; }
    public string? Justification { get; set; }
    public string? Remarks { get; set; }
}

public class RecruitmentDashboardDto
{
    public int TotalPostings { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
    public int Closed { get; set; }
    public int Expired { get; set; }
    public int TotalCandidates { get; set; }
    public int Applications { get; set; }
    public decimal AverageAiMatch { get; set; }
    public int Offers { get; set; }
    public int Joined { get; set; }
    public int EmployeesHired { get; set; }

    public double AverageTimeToHire { get; set; }
    public int OpenPositions { get; set; }
    public double CandidateConversionRate { get; set; }
    public double OfferAcceptanceRate { get; set; }

    public int AppliedCount { get; set; }
    public int ScreeningCount { get; set; }
    public int InterviewCount { get; set; }
    public int OfferCount { get; set; }
    public int RejectedCount { get; set; }
    public int JoinedCount { get; set; }

    public List<ApplicationSourceCountDto> SourceCounts { get; set; } = new();
}

public class ApplicationSourceCountDto
{
    public string Source { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class PendingApplicationDto
{
    public Guid PendingAppId { get; set; }
    public Guid JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CurrentCompany { get; set; }
    public string? CurrentDesignation { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public int? NoticePeriodDays { get; set; }
    public decimal? TotalExperience { get; set; }
    public string? Source { get; set; }
    public string? ResumeFilePath { get; set; }
    public Guid? ReferralEmployeeId { get; set; }
    public string? ReferralEmployeeName { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime AppliedDate { get; set; }
    public string? RejectionReason { get; set; }
}

public class CandidatesImportRow
{
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CurrentCompany { get; set; }
    public string? CurrentDesignation { get; set; }
    public decimal? TotalExperience { get; set; }
    public decimal? CurrentCTC { get; set; }
    public decimal? ExpectedCTC { get; set; }
    public string? Source { get; set; }
    public int? NoticePeriodDays { get; set; }
}

public class ConfirmCandidatesImportRequest
{
    public Guid? JobId { get; set; }
    public List<CandidatesImportRow> Candidates { get; set; } = new();
}

public class CandidatesImportResult
{
    public int TotalRows { get; set; }
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
