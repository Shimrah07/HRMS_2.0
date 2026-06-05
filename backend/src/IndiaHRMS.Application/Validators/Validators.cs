using FluentValidation;
using IndiaHRMS.Application.DTOs.Auth;
using IndiaHRMS.Application.DTOs.Employee;
using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.DTOs.User;

namespace IndiaHRMS.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Username is required.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password is required.");
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Passwords do not match.");
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").Matches("[a-z]").Matches("[0-9]").Matches("[^a-zA-Z0-9]");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.NewPassword).WithMessage("Passwords do not match.");
    }
}

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password)
            .NotEmpty().MinimumLength(8)
            .Matches("[A-Z]").Matches("[a-z]").Matches("[0-9]").Matches("[^a-zA-Z0-9]");
        RuleFor(x => x.RoleIds).NotEmpty().WithMessage("At least one role must be assigned.");
    }
}

public class CreateEmployeeRequestValidator : AbstractValidator<CreateEmployeeRequest>
{
    public CreateEmployeeRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.OfficialEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.JoiningDate).NotEmpty();
        RuleFor(x => x.DeptId).NotEmpty();
        RuleFor(x => x.DesignationId).NotEmpty();
        RuleFor(x => x.LocationId).NotEmpty();
        RuleFor(x => x.PersonalPhone)
            .Matches(@"^[6-9]\d{9}$").WithMessage("Enter a valid 10-digit Indian mobile number.")
            .When(x => !string.IsNullOrEmpty(x.PersonalPhone));
        RuleFor(x => x.PANNumber)
            .Matches(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$").WithMessage("Enter a valid PAN number.")
            .When(x => !string.IsNullOrEmpty(x.PANNumber));
        RuleFor(x => x.AadharNumber)
            .Length(12).WithMessage("Aadhar number must be 12 digits.")
            .Matches(@"^\d{12}$").WithMessage("Aadhar number must contain only digits.")
            .When(x => !string.IsNullOrEmpty(x.AadharNumber));
        RuleFor(x => x.ProbationPeriodDays).GreaterThanOrEqualTo(0).LessThanOrEqualTo(365);
    }
}

public class UpdateEmployeeRequestValidator : AbstractValidator<UpdateEmployeeRequest>
{
    public UpdateEmployeeRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DeptId).NotEmpty();
        RuleFor(x => x.DesignationId).NotEmpty();
        RuleFor(x => x.LocationId).NotEmpty();
    }
}

public class CreateDepartmentRequestValidator : AbstractValidator<CreateDepartmentRequest>
{
    public CreateDepartmentRequestValidator()
    {
        RuleFor(x => x.DeptName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DeptCode).NotEmpty().MaximumLength(20);
    }
}

public class CreateDesignationRequestValidator : AbstractValidator<CreateDesignationRequest>
{
    public CreateDesignationRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(100);
        RuleFor(x => x.MinBasic).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MaxBasic).GreaterThan(x => x.MinBasic).WithMessage("Max basic must be greater than min basic.");
    }
}

public class CreateLocationRequestValidator : AbstractValidator<CreateLocationRequest>
{
    public CreateLocationRequestValidator()
    {
        RuleFor(x => x.LocationName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.State).NotEmpty();
    }
}

public class AddBankDetailRequestValidator : AbstractValidator<AddBankDetailRequest>
{
    public AddBankDetailRequestValidator()
    {
        RuleFor(x => x.BankName).NotEmpty();
        RuleFor(x => x.AccountNumber).NotEmpty();
        RuleFor(x => x.IFSCCode)
            .NotEmpty()
            .Matches(@"^[A-Z]{4}0[A-Z0-9]{6}$").WithMessage("Enter a valid IFSC code.");
    }
}
