using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Shared;

namespace IndiaHRMS.Application.DTOs.User;

// ─── User Management DTOs ────────────────────────────────────────────────────

public class UserListDto
{
    public Guid UserId { get; set; }
    public Guid? EmployeeId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsActive { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class UserDetailDto : UserListDto
{
    public bool MustChangePassword { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTime? LockedUntil { get; set; }
    public List<RoleDto> AssignedRoles { get; set; } = new();
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public Guid? EmployeeId { get; set; }
    public List<Guid> RoleIds { get; set; } = new();
    public bool MustChangePassword { get; set; } = true;
}

public class UpdateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}

public class AssignRoleRequest
{
    public List<Guid> RoleIds { get; set; } = new();
}

public class ToggleLockRequest
{
    public bool IsLocked { get; set; }
    public string? Reason { get; set; }
}

public class UserQueryRequest : PaginationRequest
{
    public string? RoleCode { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsLocked { get; set; }
}

// ─── Role DTOs ────────────────────────────────────────────────────────────────

public class RoleDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string RoleCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class PermissionDto
{
    public Guid PermissionId { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class RolePermissionMatrixDto
{
    public List<RoleDto> Roles { get; set; } = new();
    public List<PermissionDto> Permissions { get; set; } = new();
    public Dictionary<string, List<string>> Matrix { get; set; } = new(); // roleCode → [permissionCodes]
}
