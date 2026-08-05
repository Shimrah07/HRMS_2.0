using FluentValidation;
using IndiaHRMS.Application.DTOs.Exit;

namespace IndiaHRMS.Application.Validators;

public class ResignationSubmitDtoValidator : AbstractValidator<ResignationSubmitDto>
{
    public ResignationSubmitDtoValidator()
    {
        RuleFor(x => x.PrimaryReason).NotEmpty().WithMessage("Primary reason for leaving is required.");
        RuleFor(x => x.ProposedLwd)
            .NotEmpty().WithMessage("Proposed Last Working Day is required.");
    }
}

public class ConfirmLwdDtoValidator : AbstractValidator<ConfirmLwdDto>
{
    public ConfirmLwdDtoValidator()
    {
        RuleFor(x => x.ConfirmedLwd).NotEmpty().WithMessage("Confirmed Last Working Day is required.");
        RuleFor(x => x.BuyoutAmount).GreaterThanOrEqualTo(0).WithMessage("Buyout amount cannot be negative.");
    }
}

public class ResignationWithdrawDtoValidator : AbstractValidator<ResignationWithdrawDto>
{
    public ResignationWithdrawDtoValidator()
    {
        RuleFor(x => x.WithdrawalReason).NotEmpty().WithMessage("Reason for withdrawal is required.");
    }
}

public class CounterOfferCreateDtoValidator : AbstractValidator<CounterOfferCreateDto>
{
    public CounterOfferCreateDtoValidator()
    {
        RuleFor(x => x.ProposedCtc).GreaterThan(0).WithMessage("Proposed revised CTC must be greater than zero.");
    }
}

public class CounterOfferResponseDtoValidator : AbstractValidator<CounterOfferResponseDto>
{
    public CounterOfferResponseDtoValidator()
    {
        RuleFor(x => x.Response).IsInEnum().WithMessage("Valid response selection is required.");
    }
}

public class ClearanceApproveDtoValidator : AbstractValidator<ClearanceApproveDto>
{
    public ClearanceApproveDtoValidator()
    {
        RuleFor(x => x.Status).IsInEnum().WithMessage("Valid clearance status is required.");
        RuleFor(x => x.DuesAmount).GreaterThanOrEqualTo(0).WithMessage("Dues amount cannot be negative.");
    }
}

public class ExitInterviewSubmitDtoValidator : AbstractValidator<ExitInterviewSubmitDto>
{
    public ExitInterviewSubmitDtoValidator()
    {
        RuleFor(x => x.OverallRating).InclusiveBetween(1, 5).WithMessage("Overall rating must be between 1 and 5.");
        RuleFor(x => x.ManagerRating).InclusiveBetween(1, 5).WithMessage("Manager rating must be between 1 and 5.");
        RuleFor(x => x.GrowthRating).InclusiveBetween(1, 5).WithMessage("Growth rating must be between 1 and 5.");
        RuleFor(x => x.CompRating).InclusiveBetween(1, 5).WithMessage("Compensation rating must be between 1 and 5.");
        RuleFor(x => x.WorkLifeBalanceRating).InclusiveBetween(1, 5).WithMessage("Work-life balance rating must be between 1 and 5.");
        RuleFor(x => x.WouldRecommend).NotEmpty().WithMessage("Recommendation choice is required.");
    }
}

