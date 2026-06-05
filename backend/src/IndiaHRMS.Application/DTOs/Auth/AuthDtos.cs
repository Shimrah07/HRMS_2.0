using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;

namespace IndiaHRMS.Application.DTOs.Auth;

public record LoginRequest(string Username, string Password, bool RememberMe = false);

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiry,
    UserInfoDto User,
    List<string> Roles,
    List<string> Permissions
);

public record RefreshTokenRequest(string RefreshToken);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword, string ConfirmPassword);

public record UserInfoDto(
    Guid UserId,
    Guid? EmployeeId,
    string Username,
    string Email,
    string? FirstName,
    string? LastName,
    string? ProfilePhoto,
    Guid? CompanyId,
    string? CompanyName,
    List<string> Roles,
    List<string> Permissions
);
