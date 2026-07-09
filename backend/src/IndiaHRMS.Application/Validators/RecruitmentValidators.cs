using FluentValidation;
using IndiaHRMS.Application.DTOs.Recruitment;

namespace IndiaHRMS.Application.Validators;

public class CreateJobRequisitionRequestValidator : AbstractValidator<CreateJobRequisitionRequest>
{
    public CreateJobRequisitionRequestValidator()
    {
        RuleFor(x => x.NoOfPositions).GreaterThan(0).When(x => x.NoOfPositions.HasValue).WithMessage("Number of positions must be greater than zero.");
        RuleFor(x => x.MinExperience).GreaterThanOrEqualTo(0).When(x => x.MinExperience.HasValue).WithMessage("Minimum experience cannot be negative.");
        RuleFor(x => x.MaxExperience).GreaterThanOrEqualTo(x => x.MinExperience.Value).When(x => x.MinExperience.HasValue && x.MaxExperience.HasValue).WithMessage("Maximum experience must be greater than or equal to minimum experience.");
        RuleFor(x => x.MinSalary).GreaterThanOrEqualTo(0).When(x => x.MinSalary.HasValue).WithMessage("Minimum salary cannot be negative.");
        RuleFor(x => x.MaxSalary).GreaterThanOrEqualTo(x => x.MinSalary.Value).When(x => x.MinSalary.HasValue && x.MaxSalary.HasValue).WithMessage("Maximum salary must be greater than or equal to minimum salary.");
    }
}

public class UpdateJobRequisitionRequestValidator : AbstractValidator<UpdateJobRequisitionRequest>
{
    public UpdateJobRequisitionRequestValidator()
    {
        RuleFor(x => x.NoOfPositions).GreaterThan(0).When(x => x.NoOfPositions.HasValue).WithMessage("Number of positions must be greater than zero.");
        RuleFor(x => x.MinExperience).GreaterThanOrEqualTo(0).When(x => x.MinExperience.HasValue).WithMessage("Minimum experience cannot be negative.");
        RuleFor(x => x.MaxExperience).GreaterThanOrEqualTo(x => x.MinExperience.Value).When(x => x.MinExperience.HasValue && x.MaxExperience.HasValue).WithMessage("Maximum experience must be greater than or equal to minimum experience.");
        RuleFor(x => x.MinSalary).GreaterThanOrEqualTo(0).When(x => x.MinSalary.HasValue).WithMessage("Minimum salary cannot be negative.");
        RuleFor(x => x.MaxSalary).GreaterThanOrEqualTo(x => x.MinSalary.Value).When(x => x.MinSalary.HasValue && x.MaxSalary.HasValue).WithMessage("Maximum salary must be greater than or equal to minimum salary.");
    }
}

public class CreateJobPostingRequestValidator : AbstractValidator<CreateJobPostingRequest>
{
    public CreateJobPostingRequestValidator()
    {
        RuleFor(x => x.ReqId).NotEmpty().WithMessage("Requisition ID is required.");
        RuleFor(x => x.JobTitle).NotEmpty().WithMessage("Job Title is required.");
    }
}

public class UpdateJobPostingRequestValidator : AbstractValidator<UpdateJobPostingRequest>
{
    public UpdateJobPostingRequestValidator()
    {
        RuleFor(x => x.JobTitle).NotEmpty().WithMessage("Job Title is required.");
    }
}

public class CreateCandidateRequestValidator : AbstractValidator<CreateCandidateRequest>
{
    public CreateCandidateRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("First Name is required.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
        RuleFor(x => x.Phone).NotEmpty().Matches(@"^\d{10}$").WithMessage("Phone number must be a valid 10-digit number.");
        RuleFor(x => x.TotalExperience).GreaterThanOrEqualTo(0).When(x => x.TotalExperience.HasValue).WithMessage("Total experience cannot be negative.");
        RuleFor(x => x.RelevantExperience).GreaterThanOrEqualTo(0).When(x => x.RelevantExperience.HasValue).WithMessage("Relevant experience cannot be negative.");
        RuleFor(x => x.RelevantExperience).LessThanOrEqualTo(x => x.TotalExperience.Value).When(x => x.TotalExperience.HasValue && x.RelevantExperience.HasValue).WithMessage("Relevant experience cannot exceed total experience.");
        RuleFor(x => x.CurrentCTC).GreaterThanOrEqualTo(0).When(x => x.CurrentCTC.HasValue).WithMessage("Current CTC cannot be negative.");
        RuleFor(x => x.ExpectedCTC).GreaterThanOrEqualTo(0).When(x => x.ExpectedCTC.HasValue).WithMessage("Expected CTC cannot be negative.");
    }
}

public class UpdateCandidateRequestValidator : AbstractValidator<UpdateCandidateRequest>
{
    public UpdateCandidateRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("First Name is required.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
        RuleFor(x => x.Phone).NotEmpty().Matches(@"^\d{10}$").WithMessage("Phone number must be a valid 10-digit number.");
        RuleFor(x => x.TotalExperience).GreaterThanOrEqualTo(0).When(x => x.TotalExperience.HasValue).WithMessage("Total experience cannot be negative.");
        RuleFor(x => x.RelevantExperience).GreaterThanOrEqualTo(0).When(x => x.RelevantExperience.HasValue).WithMessage("Relevant experience cannot be negative.");
        RuleFor(x => x.RelevantExperience).LessThanOrEqualTo(x => x.TotalExperience.Value).When(x => x.TotalExperience.HasValue && x.RelevantExperience.HasValue).WithMessage("Relevant experience cannot exceed total experience.");
        RuleFor(x => x.CurrentCTC).GreaterThanOrEqualTo(0).When(x => x.CurrentCTC.HasValue).WithMessage("Current CTC cannot be negative.");
        RuleFor(x => x.ExpectedCTC).GreaterThanOrEqualTo(0).When(x => x.ExpectedCTC.HasValue).WithMessage("Expected CTC cannot be negative.");
    }
}

public class ScheduleInterviewRequestValidator : AbstractValidator<ScheduleInterviewRequest>
{
    public ScheduleInterviewRequestValidator()
    {
        RuleFor(x => x.AppId).NotEmpty().WithMessage("Application ID is required.");
        RuleFor(x => x.RoundName).NotEmpty().WithMessage("Round Name is required.");
        RuleFor(x => x.ScheduledAt).NotEmpty().WithMessage("Schedule date/time is required.");
        RuleFor(x => x.InterviewerIds).NotEmpty().WithMessage("At least one interviewer must be assigned.");
    }
}

public class CreateOfferRequestValidator : AbstractValidator<CreateOfferRequest>
{
    public CreateOfferRequestValidator()
    {
        RuleFor(x => x.AppId).NotEmpty().WithMessage("Application ID is required.");
        RuleFor(x => x.OfferedCTC).GreaterThan(0).WithMessage("Offered CTC must be greater than zero.");
        RuleFor(x => x.JoiningDate).NotEmpty().WithMessage("Expected DOJ is required.");
    }
}
