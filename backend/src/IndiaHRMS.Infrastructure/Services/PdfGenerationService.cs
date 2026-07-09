using IndiaHRMS.Application.Interfaces;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IndiaHRMS.Infrastructure.Services;

public class PdfGenerationService : IPdfGenerationService
{
    private readonly AppDbContext _context;

    static PdfGenerationService()
    {
        // Set QuestPDF Community License to avoid license exception
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public PdfGenerationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> GenerateSalarySlipAsync(Guid payrollDetailId, CancellationToken ct = default)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                page.Header().Text("SALARY SLIP").FontSize(20).Bold();
                page.Content().Text($"Payroll Detail ID: {payrollDetailId}");
            });
        });
        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> GenerateForm16Async(Guid employeeId, string financialYear, CancellationToken ct = default)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                page.Header().Text("FORM 16").FontSize(20).Bold();
                page.Content().Text($"Employee ID: {employeeId}\nFinancial Year: {financialYear}");
            });
        });
        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> GenerateOfferLetterAsync(Guid offerId, CancellationToken ct = default)
    {
        var offer = await _context.OfferLetters
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Candidate)
            .Include(o => o.JobApplication)
                .ThenInclude(a => a.Requisition)
            .FirstOrDefaultAsync(o => o.OfferId == offerId, ct);

        if (offer == null) throw new KeyNotFoundException("Offer letter not found.");

        var candidate = offer.JobApplication.Candidate;
        var requisition = offer.JobApplication.Requisition;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                
                page.Header().Column(col =>
                {
                    col.Item().Text("EMPLOYMENT OFFER LETTER").FontSize(22).Bold().AlignCenter();
                    col.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                page.Content().PaddingTop(20).Column(col =>
                {
                    col.Item().Text($"Date: {offer.OfferDate:dd MMM yyyy}").FontSize(11);
                    col.Item().PaddingTop(15).Text($"To,\n{candidate.FirstName} {candidate.LastName}\nEmail: {candidate.Email}").FontSize(11).Bold();
                    
                    col.Item().PaddingTop(20).Text($"Dear {candidate.FirstName},").FontSize(11).Bold();
                    col.Item().PaddingTop(10).Text($"We are pleased to offer you the position of {requisition.JobTitle} in our organization. We were impressed with your qualifications and experience, and we believe you will be a valuable asset to our team.").FontSize(11);

                    col.Item().PaddingTop(15).Text("Offer Details:").FontSize(12).Bold();
                    col.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Cell().Text("Designation:").Bold().FontSize(11);
                        table.Cell().Text(requisition.JobTitle).FontSize(11);

                        table.Cell().Text("Offered CTC (Annual):").Bold().FontSize(11);
                        table.Cell().Text($"INR {offer.OfferedCTC:N2}").FontSize(11);

                        table.Cell().Text("Expected Joining Date:").Bold().FontSize(11);
                        table.Cell().Text(offer.JoiningDate.ToString("dd MMM yyyy")).FontSize(11);
                    });

                    col.Item().PaddingTop(20).Text("Terms and Conditions:").FontSize(12).Bold();
                    col.Item().PaddingTop(5).Text("1. This offer is subject to satisfactory background verification.\n2. You are requested to sign and return a copy of this letter as acceptance of this offer on or before the expiry date.").FontSize(11);

                    col.Item().PaddingTop(40).Text("Sincerely,\n\nHuman Resources Team\nIndiaHRMS").FontSize(11);
                });

                page.Footer().AlignCenter().Text("Page 1 of 1").FontSize(9).FontColor(Colors.Grey.Medium);
            });
        });

        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> GenerateExperienceLetterAsync(Guid separationId, CancellationToken ct = default)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                page.Header().Text("EXPERIENCE LETTER").FontSize(20).Bold();
                page.Content().Text($"Separation ID: {separationId}");
            });
        });
        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> GenerateRelievingLetterAsync(Guid separationId, CancellationToken ct = default)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                page.Header().Text("RELIEVING LETTER").FontSize(20).Bold();
                page.Content().Text($"Separation ID: {separationId}");
            });
        });
        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }
}
