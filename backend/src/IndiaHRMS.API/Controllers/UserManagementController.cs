using AutoMapper;
using BCrypt.Net;
using IndiaHRMS.Application.DTOs.User;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/users")]
[ApiVersion("1.0")]
[Authorize]
public class UserManagementController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IPermissionService _permissionService;

    public UserManagementController(AppDbContext context, IMapper mapper, IPermissionService permissionService)
    {
        _context = context;
        _mapper = mapper;
        _permissionService = permissionService;
    }

    [HttpGet]
    [Filters.RequirePermission(PermissionCodes.UserManagement.View)]
    public async Task<ActionResult<ApiResponse<List<UserListDto>>>> GetUsers([FromQuery] UserQueryRequest request, CancellationToken ct)
    {
        var query = _context.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).AsQueryable();

        if (!string.IsNullOrEmpty(request.Search))
            query = query.Where(u => u.Username.Contains(request.Search) || u.Email.Contains(request.Search) ||
                (u.FirstName != null && u.FirstName.Contains(request.Search)) ||
                (u.LastName != null && u.LastName.Contains(request.Search)));

        if (request.IsActive.HasValue) query = query.Where(u => u.IsActive == request.IsActive);
        if (request.IsLocked.HasValue) query = query.Where(u => u.IsLocked == request.IsLocked);

        var total = await query.CountAsync(ct);
        var users = await query.OrderBy(u => u.Username)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var dtos = users.Select(u =>
        {
            var dto = _mapper.Map<UserListDto>(u);
            dto.Roles = u.UserRoles.Where(ur => ur.IsActive).Select(ur => ur.Role.RoleCode).ToList();
            return dto;
        }).ToList();

        return Ok(ApiResponse<List<UserListDto>>.PagedOk(dtos, request.Page, request.PageSize, total));
    }

    [HttpGet("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.View)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> GetUser(Guid id, CancellationToken ct)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role).ThenInclude(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.UserId == id, ct);

        if (user == null) return NotFound(ApiResponse<UserDetailDto>.Fail("User not found."));

        var dto = _mapper.Map<UserDetailDto>(user);
        dto.Roles = user.UserRoles.Where(ur => ur.IsActive).Select(ur => ur.Role.RoleCode).ToList();
        dto.AssignedRoles = user.UserRoles.Where(ur => ur.IsActive)
            .Select(ur => _mapper.Map<RoleDto>(ur.Role)).ToList();

        return Ok(ApiResponse<UserDetailDto>.Ok(dto));
    }

    [HttpPost]
    [Filters.RequirePermission(PermissionCodes.UserManagement.Create)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> CreateUser([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username, ct))
            return Conflict(ApiResponse<UserDetailDto>.Fail("Username already exists."));
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, ct))
            return Conflict(ApiResponse<UserDetailDto>.Fail("Email already exists."));

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmployeeId = request.EmployeeId,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            PasswordSalt = "",
            MustChangePassword = request.MustChangePassword,
            IsActive = true
        };

        foreach (var roleId in request.RoleIds)
        {
            var role = await _context.Roles.FindAsync(new object[] { roleId }, ct);
            if (role != null) user.UserRoles.Add(new UserRole { RoleId = roleId });
        }

        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<UserDetailDto>.Ok(_mapper.Map<UserDetailDto>(user), "User created."));
    }

    [HttpPut("{id:guid}")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.Edit)]
    public async Task<ActionResult<ApiResponse<UserDetailDto>>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) return NotFound(ApiResponse<UserDetailDto>.Fail("User not found."));

        if (user.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != id, ct))
            return Conflict(ApiResponse<UserDetailDto>.Fail("Email already in use."));

        user.Email = request.Email;
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<UserDetailDto>.Ok(_mapper.Map<UserDetailDto>(user)));
    }

    [HttpPut("{id:guid}/roles")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.Assign)]
    public async Task<ActionResult<ApiResponse<object>>> AssignRoles(Guid id, [FromBody] AssignRoleRequest request, CancellationToken ct)
    {
        var user = await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.UserId == id, ct);
        if (user == null) return NotFound(ApiResponse<object>.Fail("User not found."));

        // Deactivate existing roles
        foreach (var ur in user.UserRoles) ur.IsActive = false;

        // Add new roles
        foreach (var roleId in request.RoleIds)
        {
            var existing = user.UserRoles.FirstOrDefault(ur => ur.RoleId == roleId);
            if (existing != null) existing.IsActive = true;
            else _context.UserRoles.Add(new UserRole { UserId = id, RoleId = roleId });
        }

        await _context.SaveChangesAsync(ct);
        await _permissionService.InvalidateUserCacheAsync(id, ct);
        return Ok(ApiResponse<object>.Ok(null, "Roles updated."));
    }

    [HttpPut("{id:guid}/toggle-active")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> ToggleActive(Guid id, CancellationToken ct)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) return NotFound(ApiResponse<object>.Fail("User not found."));
        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync(ct);
        await _permissionService.InvalidateUserCacheAsync(id, ct);
        return Ok(ApiResponse<object>.Ok(null, user.IsActive ? "User activated." : "User deactivated."));
    }

    [HttpPut("{id:guid}/toggle-lock")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.Edit)]
    public async Task<ActionResult<ApiResponse<object>>> ToggleLock(Guid id, [FromBody] ToggleLockRequest request, CancellationToken ct)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) return NotFound(ApiResponse<object>.Fail("User not found."));
        user.IsLocked = request.IsLocked;
        if (!request.IsLocked) { user.FailedLoginCount = 0; user.LockedUntil = null; }
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, user.IsLocked ? "User locked." : "User unlocked."));
    }

    [HttpPost("{id:guid}/reset-password")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.Edit)]
    public async Task<ActionResult<ApiResponse<string>>> AdminResetPassword(Guid id, CancellationToken ct)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, ct);
        if (user == null) return NotFound(ApiResponse<string>.Fail("User not found."));
        var tempPassword = GenerateTempPassword();
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword, workFactor: 12);
        user.MustChangePassword = true;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<string>.Ok(tempPassword, "Password reset. Share securely."));
    }

    // ─── Roles & Permissions ──────────────────────────────────────────────────

    [HttpGet("/api/v{version:apiVersion}/roles")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.View)]
    public async Task<ActionResult<ApiResponse<List<RoleDto>>>> GetRoles(CancellationToken ct)
    {
        var roles = await _context.Roles
            .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .Where(r => r.IsActive)
            .ToListAsync(ct);

        var dtos = roles.Select(r =>
        {
            var dto = _mapper.Map<RoleDto>(r);
            dto.Permissions = r.RolePermissions.Select(rp => rp.Permission.PermissionCode).ToList();
            return dto;
        }).ToList();

        return Ok(ApiResponse<List<RoleDto>>.Ok(dtos));
    }

    [HttpGet("/api/v{version:apiVersion}/permissions")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.View)]
    public async Task<ActionResult<ApiResponse<List<PermissionDto>>>> GetPermissions(CancellationToken ct)
    {
        var perms = await _context.Permissions.OrderBy(p => p.Module).ThenBy(p => p.Action).ToListAsync(ct);
        return Ok(ApiResponse<List<PermissionDto>>.Ok(_mapper.Map<List<PermissionDto>>(perms)));
    }

    [HttpGet("/api/v{version:apiVersion}/permissions/matrix")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.View)]
    public async Task<ActionResult<ApiResponse<RolePermissionMatrixDto>>> GetPermissionMatrix(CancellationToken ct)
    {
        var roles = await _context.Roles.Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .Where(r => r.IsActive).ToListAsync(ct);
        var allPerms = await _context.Permissions.ToListAsync(ct);

        var matrix = new RolePermissionMatrixDto
        {
            Roles = roles.Select(r => _mapper.Map<RoleDto>(r)).ToList(),
            Permissions = _mapper.Map<List<PermissionDto>>(allPerms),
            Matrix = roles.ToDictionary(r => r.RoleCode, r => r.RolePermissions.Select(rp => rp.Permission.PermissionCode).ToList())
        };
        return Ok(ApiResponse<RolePermissionMatrixDto>.Ok(matrix));
    }

    [HttpPut("/api/v{version:apiVersion}/roles/{roleId:guid}/permissions")]
    [Filters.RequirePermission(PermissionCodes.UserManagement.Assign)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateRolePermissions(Guid roleId, [FromBody] List<Guid> permissionIds, CancellationToken ct)
    {
        var role = await _context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.RoleId == roleId, ct);
        if (role == null) return NotFound(ApiResponse<object>.Fail("Role not found."));
        if (role.IsSystem) return Conflict(ApiResponse<object>.Fail("Cannot modify system roles."));

        _context.RolePermissions.RemoveRange(role.RolePermissions);
        foreach (var permId in permissionIds)
            _context.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permId });

        await _context.SaveChangesAsync(ct);

        // Invalidate cache for all users with this role
        var userIds = await _context.UserRoles.Where(ur => ur.RoleId == roleId && ur.IsActive).Select(ur => ur.UserId).ToListAsync(ct);
        foreach (var uid in userIds)
            await _permissionService.InvalidateUserCacheAsync(uid, ct);

        return Ok(ApiResponse<object>.Ok(null, "Role permissions updated."));
    }

    private static string GenerateTempPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 12).Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
