using IndiaHRMS.Shared;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.Json;
using System.Linq;

namespace IndiaHRMS.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly Microsoft.Extensions.Hosting.IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, Microsoft.Extensions.Hosting.IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
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
        // 1. Log the complete exception
        _logger.LogError(ex, "Unhandled exception occurred during request execution: {Message}", ex.Message);

        // 2. Resolve status code and standard message
        var statusCode = ex switch
        {
            ArgumentNullException or ArgumentException => HttpStatusCode.BadRequest,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            KeyNotFoundException => HttpStatusCode.NotFound,
            InvalidOperationException => HttpStatusCode.Conflict,
            NotImplementedException => HttpStatusCode.NotImplemented,
            _ => HttpStatusCode.InternalServerError
        };

        // Determine error message detail based on environment and exception status
        string detail;
        if (_env.IsDevelopment())
        {
            detail = ex.Message;
        }
        else
        {
            detail = statusCode == HttpStatusCode.InternalServerError 
                ? "An unexpected error occurred. Please try again later." 
                : ex.Message;
        }

        var title = statusCode switch
        {
            HttpStatusCode.BadRequest => "Bad Request",
            HttpStatusCode.Unauthorized => "Unauthorized",
            HttpStatusCode.NotFound => "Not Found",
            HttpStatusCode.Conflict => "Conflict",
            HttpStatusCode.NotImplemented => "Not Implemented",
            _ => "Internal Server Error"
        };

        // 3. Return a ProblemDetails hybrid response
        var errorResponse = new
        {
            success = false,
            errors = new List<string> { detail },
            status = (int)statusCode,
            title = title,
            detail = detail,
            instance = context.Request.Path.ToString(),
            traceId = context.TraceIdentifier,
            stackTrace = _env.IsDevelopment() ? ex.StackTrace : null
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
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

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);

        if (context.User.Identity?.IsAuthenticated == true &&
            (context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "DELETE") &&
            context.Response.StatusCode is >= 200 and < 300)
        {
            try
            {
                var userIdClaim = context.User.FindFirst("uid")?.Value;
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    using var scope = context.RequestServices.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<IndiaHRMS.Infrastructure.Data.AppDbContext>();

                    // Verify that the user exists in the database to prevent foreign key violations
                    var userExists = await dbContext.Users.AnyAsync(u => u.UserId == userId);
                    if (userExists)
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
            catch
            {
                // Silently catch exceptions to ensure audit logging failures do not crash successful operations
            }
        }
    }
}
