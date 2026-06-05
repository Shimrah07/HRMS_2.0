using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Domain.Enums;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace IndiaHRMS.Infrastructure.Services;

// ─── IRealtimePush — decoupled from SignalR (API layer implements this) ────────
public interface IRealtimePush
{
    Task PushToUserAsync(Guid userId, string eventName, object payload);
    Task PushToGroupAsync(string groupName, string eventName, object payload);
}

// ─── No-op fallback (when hub not registered, e.g. unit tests) ────────────────
public class NoOpRealtimePush : IRealtimePush
{
    public Task PushToUserAsync(Guid userId, string eventName, object payload) => Task.CompletedTask;
    public Task PushToGroupAsync(string groupName, string eventName, object payload) => Task.CompletedTask;
}

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly ILogger<PermissionService> _logger;
    private static readonly TimeSpan CacheTTL = TimeSpan.FromMinutes(5);

    public PermissionService(AppDbContext context, IDistributedCache cache, ILogger<PermissionService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<string>> GetUserPermissionsAsync(Guid userId, CancellationToken ct = default)
    {
        var cacheKey = $"perms:{userId}";
        var cached = await _cache.GetStringAsync(cacheKey, ct);
        if (cached != null) return JsonSerializer.Deserialize<List<string>>(cached) ?? new();

        var permissions = await _context.UserRoles
            .Where(ur => ur.UserId == userId && ur.IsActive && (ur.ValidTo == null || ur.ValidTo > DateTime.UtcNow))
            .Join(_context.RolePermissions, ur => ur.RoleId, rp => rp.RoleId, (ur, rp) => rp.PermissionId)
            .Join(_context.Permissions, pid => pid, p => p.PermissionId, (pid, p) => p.PermissionCode)
            .Distinct()
            .ToListAsync(ct);

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(permissions),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheTTL }, ct);

        return permissions;
    }

    public async Task<List<string>> GetUserRolesAsync(Guid userId, CancellationToken ct = default)
    {
        var cacheKey = $"roles:{userId}";
        var cached = await _cache.GetStringAsync(cacheKey, ct);
        if (cached != null) return JsonSerializer.Deserialize<List<string>>(cached) ?? new();

        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == userId && ur.IsActive && (ur.ValidTo == null || ur.ValidTo > DateTime.UtcNow))
            .Join(_context.Roles, ur => ur.RoleId, r => r.RoleId, (ur, r) => r.RoleCode)
            .ToListAsync(ct);

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(roles),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheTTL }, ct);

        return roles;
    }

    public async Task<bool> UserHasPermissionAsync(Guid userId, string permission, CancellationToken ct = default)
    {
        var permissions = await GetUserPermissionsAsync(userId, ct);
        return permissions.Contains(permission);
    }

    public async Task InvalidateUserCacheAsync(Guid userId, CancellationToken ct = default)
    {
        await _cache.RemoveAsync($"perms:{userId}", ct);
        await _cache.RemoveAsync($"roles:{userId}", ct);
    }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private System.Security.Claims.ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var claim = User?.FindFirst("uid")?.Value ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return claim != null && Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public Guid? EmployeeId
    {
        get
        {
            var claim = User?.FindFirst("empId")?.Value;
            return claim != null && Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public Guid? CompanyId
    {
        get
        {
            var claim = User?.FindFirst("companyId")?.Value;
            return claim != null && Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public string? Username => User?.FindFirst("username")?.Value;
    public string? Email => User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

    public IEnumerable<string> Roles => User?.FindAll(System.Security.Claims.ClaimTypes.Role)
        .Select(c => c.Value) ?? Enumerable.Empty<string>();

    public IEnumerable<string> Permissions => User?.FindAll("permission")
        .Select(c => c.Value) ?? Enumerable.Empty<string>();

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool HasPermission(string permission) => Permissions.Contains(permission);
    public bool HasRole(string role) => Roles.Contains(role);
    public bool HasAnyRole(params string[] roles) => roles.Any(r => Roles.Contains(r));
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IRealtimePush _realtime;

    public NotificationService(AppDbContext context, IRealtimePush realtime)
    {
        _context = context;
        _realtime = realtime;
    }

    public async Task SendToUserAsync(Guid userId, string title, string message, NotificationType type, string? referenceId = null, string? referenceType = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceId = referenceId,
            ReferenceType = referenceType
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        await _realtime.PushToUserAsync(userId, "notification",
            new { notification.NotificationId, title, message, type = type.ToString() });
    }

    public async Task SendToRoleAsync(string roleCode, string title, string message, NotificationType type)
    {
        var userIds = await _context.UserRoles
            .Where(ur => ur.IsActive && ur.Role.RoleCode == roleCode)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync();

        foreach (var userId in userIds)
            await SendToUserAsync(userId, title, message, type);
    }

    public async Task SendToCompanyAsync(Guid companyId, string title, string message, NotificationType type)
    {
        await _realtime.PushToGroupAsync($"company_{companyId}", "notification",
            new { title, message, type = type.ToString() });
    }
}
