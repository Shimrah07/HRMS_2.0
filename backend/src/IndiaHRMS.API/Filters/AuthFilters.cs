using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using IndiaHRMS.Domain.Constants;
using System;
using System.Linq;

namespace IndiaHRMS.API.Filters;

/// <summary>
/// Enforces fine-grained permission code checks against the "permission" claims in the JWT.
/// SUPER_ADMIN is unconditionally allowed (has all permissions by DB design).
/// All other roles are checked exclusively against their JWT "permission" claims,
/// which are populated from the DB RolePermissions table at login — making the DB
/// the single source of truth for who can do what.
///
/// NOTE: The previous approach of hardcoding per-role permission lists here was the
/// root cause of the RBAC regression (roles could bypass permission checks entirely).
/// This rewrite eliminates that bypass.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _permissions;

    public RequirePermissionAttribute(params string[] permissions)
    {
        _permissions = permissions;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var roles = context.HttpContext.User
            .FindAll(System.Security.Claims.ClaimTypes.Role)
            .Select(c => c.Value)
            .ToHashSet();

        // SUPER_ADMIN unconditionally bypasses all permission checks.
        // All other roles must have the required permission code in their JWT claims.
        if (roles.Contains(RoleCodes.SuperAdmin))
            return;

        // Check the "permission" claims emitted at login from the DB RolePermissions table.
        var userPermissions = context.HttpContext.User
            .FindAll("permission")
            .Select(c => c.Value)
            .ToHashSet();

        var hasPermission = _permissions.Any(p => userPermissions.Contains(p));

        if (!hasPermission)
            context.Result = new ObjectResult(IndiaHRMS.Shared.ApiResponse<object>.Fail("Access denied. Insufficient permissions.")) { StatusCode = 403 };
    }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class RequireRoleAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _roles;

    public RequireRoleAttribute(params string[] roles)
    {
        _roles = roles;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var hasRole = _roles.Any(r => context.HttpContext.User.IsInRole(r));
        if (!hasRole)
            context.Result = new ObjectResult(IndiaHRMS.Shared.ApiResponse<object>.Fail("Access denied. Insufficient role.")) { StatusCode = 403 };
    }
}
