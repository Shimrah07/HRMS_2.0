using AutoMapper;
using IndiaHRMS.Application.DTOs.Organization;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/notifications")]
[ApiVersion("1.0")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(AppDbContext context, IMapper mapper, ICurrentUserService currentUser)
    {
        _context = context;
        _mapper = mapper;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetMyNotifications([FromQuery] bool unreadOnly = false, CancellationToken ct = default)
    {
        if (!_currentUser.UserId.HasValue)
            return Unauthorized(ApiResponse<List<NotificationDto>>.Fail("Unauthorized."));

        var query = _context.Notifications.Where(n => n.UserId == _currentUser.UserId);
        if (unreadOnly) query = query.Where(n => !n.IsRead);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        return Ok(ApiResponse<List<NotificationDto>>.Ok(_mapper.Map<List<NotificationDto>>(notifications)));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount(CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue) return Ok(ApiResponse<int>.Ok(0));
        var count = await _context.Notifications.CountAsync(n => n.UserId == _currentUser.UserId && !n.IsRead, ct);
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkRead(Guid id, CancellationToken ct)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == id && n.UserId == _currentUser.UserId, ct);
        if (notification == null) return NotFound(ApiResponse<object>.Fail("Notification not found."));
        notification.IsRead = true;
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null));
    }

    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllRead(CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Unauthorized."));
        await _context.Notifications
            .Where(n => n.UserId == _currentUser.UserId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        return Ok(ApiResponse<object>.Ok(null, "All notifications marked as read."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteNotification(Guid id, CancellationToken ct)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == id && n.UserId == _currentUser.UserId, ct);
        if (notification == null) return NotFound(ApiResponse<object>.Fail("Notification not found."));
        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null));
    }

    [HttpDelete("clear-all")]
    public async Task<ActionResult<ApiResponse<object>>> ClearAll(CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Unauthorized."));
        var userNotifications = _context.Notifications.Where(n => n.UserId == _currentUser.UserId);
        _context.Notifications.RemoveRange(userNotifications);
        await _context.SaveChangesAsync(ct);
        return Ok(ApiResponse<object>.Ok(null, "All notifications cleared."));
    }
}
