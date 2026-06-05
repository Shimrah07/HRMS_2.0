using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Diagnostics;
using System.Net;
using System.Text.Json;

namespace IndiaHRMS.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);

        var (statusCode, message) = ex switch
        {
            ArgumentNullException or ArgumentException => (HttpStatusCode.BadRequest, ex.Message),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized access."),
            KeyNotFoundException => (HttpStatusCode.NotFound, ex.Message),
            InvalidOperationException => (HttpStatusCode.Conflict, ex.Message),
            NotImplementedException => (HttpStatusCode.NotImplemented, "Feature not implemented."),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var traceId = context.TraceIdentifier;
        var response = ApiResponse<object>.Fail(message);
        response.TraceId = traceId;

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var start = DateTime.UtcNow;
        await _next(context);
        var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;

        _logger.LogInformation(
            "HTTP {Method} {Path} responded {StatusCode} in {Elapsed}ms | IP: {IP}",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            elapsed,
            context.Connection.RemoteIpAddress
        );
    }
}

public class AuditMiddleware
{
    private readonly RequestDelegate _next;

    public AuditMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IndiaHRMS.Infrastructure.Data.AppDbContext dbContext)
    {
        await _next(context);

        if (context.User.Identity?.IsAuthenticated == true &&
            (context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "DELETE") &&
            context.Response.StatusCode is >= 200 and < 300)
        {
            var userIdClaim = context.User.FindFirst("uid")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                var auditLog = new Domain.Entities.AuditLog
                {
                    UserId = userId,
                    Action = context.Request.Method,
                    TableName = context.Request.Path.ToString().Split('/').Skip(3).FirstOrDefault() ?? "Unknown",
                    RecordId = context.Request.Path.ToString().Split('/').LastOrDefault() ?? "",
                    IPAddress = context.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = context.Request.Headers.UserAgent.ToString()
                };
                dbContext.AuditLogs.Add(auditLog);
                await dbContext.SaveChangesAsync();
            }
        }
    }
}
