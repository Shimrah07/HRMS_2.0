using System;
using System.Collections.Generic;
using IndiaHRMS.Domain.Entities;

namespace IndiaHRMS.Infrastructure.Services;

public class TimelineEvent
{
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Event { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string? User { get; set; }
    public string? PreviousStage { get; set; }
    public string? NewStage { get; set; }
}

public static class TimelineHelper
{
    public static void AddTimelineEvent(
        JobApplication app, 
        string eventName, 
        string? remarks = null,
        string? user = null,
        string? previousStage = null,
        string? newStage = null)
    {
        var list = new List<TimelineEvent>();
        if (!string.IsNullOrEmpty(app.TimelineEventsJson))
        {
            try
            {
                list = System.Text.Json.JsonSerializer.Deserialize<List<TimelineEvent>>(app.TimelineEventsJson) ?? new List<TimelineEvent>();
            }
            catch {}
        }
        
        list.Add(new TimelineEvent
        {
            Timestamp = DateTime.UtcNow,
            Event = eventName,
            Remarks = remarks,
            User = user,
            PreviousStage = previousStage,
            NewStage = newStage
        });
        
        app.TimelineEventsJson = System.Text.Json.JsonSerializer.Serialize(list);
    }
}
