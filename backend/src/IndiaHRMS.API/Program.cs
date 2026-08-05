using AspNetCoreRateLimit;
using FluentValidation;
using FluentValidation.AspNetCore;
using IndiaHRMS.API.Hubs;
using IndiaHRMS.API.Middleware;
using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Application.Validators;
using IndiaHRMS.Infrastructure.Data;
using IndiaHRMS.Infrastructure.Repositories;
using IndiaHRMS.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using System.Text;

// ─── Bootstrap Logger ──────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ─── Serilog ───────────────────────────────────────────────────────────────
    // builder.Host.UseSerilog((ctx, lc) => lc
    //     .ReadFrom.Configuration(ctx.Configuration)
    //     .Enrich.FromLogContext()
    //     .WriteTo.Console()
    //     .WriteTo.MSSqlServer(
    //         connectionString: ctx.Configuration.GetConnectionString("DefaultConnection"),
    //         tableName: "Logs",
    //         autoCreateSqlTable: true));

    builder.Host.UseSerilog((ctx, lc) => lc
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());

    // ─── Database ─────────────────────────────────────────────────────────────
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sql => sql.CommandTimeout(60).EnableRetryOnFailure(3)));

    // ─── Redis Cache ──────────────────────────────────────────────────────────
    var redisConn = builder.Configuration["Redis:ConnectionString"];
    if (!string.IsNullOrEmpty(redisConn))
        builder.Services.AddStackExchangeRedisCache(o => o.Configuration = redisConn);
    else
        builder.Services.AddDistributedMemoryCache();

    // ─── JWT Authentication ───────────────────────────────────────────────────
    var jwtKey = builder.Configuration["JwtSettings:SecretKey"]
        ?? throw new InvalidOperationException("JWT SecretKey not configured.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
                ValidAudience = builder.Configuration["JwtSettings:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.Zero
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        context.Token = accessToken;
                    return Task.CompletedTask;
                }
            };
        });

    // ─── Authorization ────────────────────────────────────────────────────────
    builder.Services.AddAuthorization();

    // ─── DI Registrations ─────────────────────────────────────────────────────
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<IEncryptionService, EncryptionService>();
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddScoped<IFileService, FileService>();
    builder.Services.AddScoped<IPermissionService, PermissionService>();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<IReportingScopeService, ReportingScopeService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IPdfGenerationService, IndiaHRMS.Infrastructure.Services.PdfGenerationService>();
    builder.Services.AddScoped<IAttendanceProcessingService, IndiaHRMS.Infrastructure.Services.AttendanceProcessingService>();
    builder.Services.AddScoped<IAttendanceProcessingService, IndiaHRMS.Infrastructure.Services.AttendanceProcessingService>();
    builder.Services.AddScoped<IndiaHRMS.Infrastructure.Services.IRealtimePush, IndiaHRMS.API.Extensions.SignalRRealtimePush>();
    builder.Services.AddScoped<IndiaHRMS.Infrastructure.Services.OnboardingOrchestrator>();
    builder.Services.AddScoped<IApplicationService, IndiaHRMS.Infrastructure.Services.ApplicationService>();
    builder.Services.AddScoped<IHiringService, IndiaHRMS.Infrastructure.Services.HiringService>();
    builder.Services.AddScoped<ILeavePolicyService, LeavePolicyService>();
    builder.Services.AddScoped<ILeaveApplicationService, LeaveApplicationService>();
    builder.Services.AddScoped<ILeaveEngineService, LeaveEngineService>();
    builder.Services.AddScoped<IHolidayService, HolidayService>();
    builder.Services.AddScoped<IStatutoryLeaveService, StatutoryLeaveService>();
    builder.Services.AddScoped<ILeaveEncashmentService, LeaveEncashmentService>();
    builder.Services.AddScoped<ISectorLeaveService, SectorLeaveService>();
    builder.Services.AddScoped<ILeaveAnalyticsService, LeaveAnalyticsService>();
    builder.Services.AddScoped<ITravelExpenseService, TravelExpenseService>();
    builder.Services.AddScoped<IExitManagementService, ExitManagementService>();


    // Register Background Services
    builder.Services.AddHostedService<IndiaHRMS.API.BackgroundServices.AttendanceBatchProcessor>();

    // ─── AutoMapper ───────────────────────────────────────────────────────────
    builder.Services.AddAutoMapper(typeof(IndiaHRMS.Application.Mappings.HRMSMappingProfile));

    // ─── FluentValidation ─────────────────────────────────────────────────────
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

    // ─── Controllers ──────────────────────────────────────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            o.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });

    builder.Services.Configure<ApiBehaviorOptions>(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value.Errors.Count > 0)
                .Select(e => new {
                    Key = e.Key,
                    Errors = e.Value.Errors.Select(x => x.ErrorMessage).ToArray()
                }).ToList();
            
            Console.WriteLine("ModelState Validation Failed! Errors: " + System.Text.Json.JsonSerializer.Serialize(errors));
            
            return new BadRequestObjectResult(new {
                type = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                title = "One or more validation errors occurred.",
                status = 400,
                errors = context.ModelState.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                ),
                traceId = context.HttpContext.TraceIdentifier
            });
        };
    });

    // ─── API Versioning ───────────────────────────────────────────────────────
    builder.Services.AddApiVersioning(o =>
    {
        o.DefaultApiVersion = new ApiVersion(1, 0);
        o.AssumeDefaultVersionWhenUnspecified = true;
        o.ReportApiVersions = true;
    });

    // ─── SignalR ──────────────────────────────────────────────────────────────
    builder.Services.AddSignalR();

    // ─── HTTP Context Accessor ────────────────────────────────────────────────
    builder.Services.AddHttpContextAccessor();

    // ─── CORS ─────────────────────────────────────────────────────────────────
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" };
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("HRMSCorsPolicy", policy =>
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials());
    });

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

    // ─── Swagger ──────────────────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "IndiaHRMS API",
            Version = "v1",
            Description = "Comprehensive India-compliant HRMS REST API",
            Contact = new OpenApiContact { Name = "IndiaHRMS Team" }
        });
        c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter your JWT token"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
                Array.Empty<string>()
            }
        });
    });


    // ─── Build App ────────────────────────────────────────────────────────────
    var app = builder.Build();

    // ─── Database Seeding (No Automatic Script Migrations) ──────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var encryption = scope.ServiceProvider.GetRequiredService<IEncryptionService>();
        try
        {
            await DatabaseSeeder.SeedAsync(db, encryption);
            Log.Information("Database seeded successfully.");
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Database seeding skipped or encountered existing data.");
        }
    }

    // ─── Middleware Pipeline ──────────────────────────────────────────────────
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("CI"))
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "IndiaHRMS API v1");
            c.RoutePrefix = string.Empty;
        });
    }

    app.UseIpRateLimiting();

    app.UseHttpsRedirection();
    app.UseCors("HRMSCorsPolicy");

    var uploadsPath = System.IO.Path.Combine(app.Environment.ContentRootPath, "uploads");
    if (!System.IO.Directory.Exists(uploadsPath))
    {
        System.IO.Directory.CreateDirectory(uploadsPath);
    }
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
        RequestPath = "/uploads"
    });

    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<AuditMiddleware>();

    app.MapControllers();
    app.MapHub<NotificationHub>("/hubs/notifications");

    app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
        .WithTags("Health");

    Log.Information("IndiaHRMS API starting up...");
    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "IndiaHRMS API failed to start.");
}
finally
{
    Log.CloseAndFlush();
}
