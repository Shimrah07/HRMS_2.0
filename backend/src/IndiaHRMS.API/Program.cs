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
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IndiaHRMS.Infrastructure.Services.IRealtimePush, IndiaHRMS.API.Extensions.SignalRRealtimePush>();

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
            policy.WithOrigins(allowedOrigins)
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

    // ─── Migrate Database ─────────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        Log.Information("Database migrated successfully.");
        await DatabaseSeeder.SeedAsync(db);
        Log.Information("Database seeded successfully.");
    }

    // ─── Middleware Pipeline ──────────────────────────────────────────────────
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
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
