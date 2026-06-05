using IndiaHRMS.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using IndiaHRMS.Infrastructure.Data;

namespace IndiaHRMS.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly AppDbContext _context;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger, AppDbContext context)
    {
        _configuration = configuration;
        _logger = logger;
        _context = context;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Email:FromName"] ?? "IndiaHRMS",
                _configuration["Email:FromEmail"] ?? "noreply@indiahrms.com"
            ));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _configuration["Email:SmtpHost"],
                int.Parse(_configuration["Email:SmtpPort"] ?? "587"),
                SecureSocketOptions.StartTls,
                ct
            );
            await client.AuthenticateAsync(
                _configuration["Email:Username"],
                _configuration["Email:Password"],
                ct
            );
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} with subject {Subject}", to, subject);
        }
    }

    public async Task SendFromTemplateAsync(string to, string templateCode, Dictionary<string, string> variables, Guid companyId, CancellationToken ct = default)
    {
        var template = await _context.EmailTemplates
            .FirstOrDefaultAsync(t => t.TemplateCode == templateCode && t.CompanyId == companyId && t.IsActive, ct);

        if (template == null)
        {
            _logger.LogWarning("Email template {TemplateCode} not found for company {CompanyId}", templateCode, companyId);
            return;
        }

        var subject = template.Subject;
        var body = template.Body;

        foreach (var (key, value) in variables)
        {
            subject = subject.Replace($"{{{{{key}}}}}", value);
            body = body.Replace($"{{{{{key}}}}}", value);
        }

        await SendAsync(to, subject, body, ct);
    }

    public async Task SendBulkAsync(IEnumerable<string> recipients, string subject, string htmlBody, CancellationToken ct = default)
    {
        var tasks = recipients.Select(r => SendAsync(r, subject, htmlBody, ct));
        await Task.WhenAll(tasks);
    }
}
