using Microsoft.AspNetCore.SignalR;

namespace IndiaHRMS.API.Hubs;

public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("uid")?.Value;
        var companyId = Context.User?.FindFirst("companyId")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("User {UserId} connected to NotificationHub", userId);
        }

        if (!string.IsNullOrEmpty(companyId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"company_{companyId}");

        var roles = Context.User?.FindAll(System.Security.Claims.ClaimTypes.Role)
            .Select(c => c.Value) ?? Enumerable.Empty<string>();

        foreach (var role in roles)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("uid")?.Value;
        _logger.LogInformation("User {UserId} disconnected from NotificationHub", userId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task MarkRead(string notificationId)
    {
        await Clients.Caller.SendAsync("notificationRead", notificationId);
    }
}
