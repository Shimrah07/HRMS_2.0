using IndiaHRMS.Infrastructure.Services;
using Microsoft.AspNetCore.SignalR;
using IndiaHRMS.API.Hubs;

namespace IndiaHRMS.API.Extensions;

/// <summary>
/// SignalR-backed implementation of IRealtimePush. Registered in API DI.
/// </summary>
public class SignalRRealtimePush : IRealtimePush
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRRealtimePush(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PushToUserAsync(Guid userId, string eventName, object payload)
        => _hubContext.Clients.Group($"user_{userId}").SendAsync(eventName, payload);

    public Task PushToGroupAsync(string groupName, string eventName, object payload)
        => _hubContext.Clients.Group(groupName).SendAsync(eventName, payload);
}
