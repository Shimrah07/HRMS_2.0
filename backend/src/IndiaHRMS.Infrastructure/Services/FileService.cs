using IndiaHRMS.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IndiaHRMS.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly string _basePath;
    private readonly long _maxFileSizeBytes;
    private readonly HashSet<string> _allowedExtensions;
    private readonly ILogger<FileService> _logger;

    public FileService(IConfiguration configuration, ILogger<FileService> logger)
    {
        _basePath = configuration["FileStorage:BasePath"] ?? "uploads";
        _maxFileSizeBytes = (long)(configuration.GetValue<int>("FileStorage:MaxFileSizeMB", 10)) * 1024 * 1024;
        _allowedExtensions = new HashSet<string>(
            configuration.GetSection("FileStorage:AllowedExtensions").Get<string[]>()
            ?? new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xlsx" },
            StringComparer.OrdinalIgnoreCase
        );
        _logger = logger;
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string folder, CancellationToken ct = default)
    {
        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var folderPath = Path.Combine(_basePath, folder);
        Directory.CreateDirectory(folderPath);
        var filePath = Path.Combine(folderPath, uniqueFileName);

        await using var output = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(output, ct);

        _logger.LogInformation("File saved: {FilePath}", filePath);
        return Path.Combine(folder, uniqueFileName).Replace("\\", "/");
    }

    public async Task<Stream> GetAsync(string filePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, filePath);
        if (!File.Exists(fullPath)) throw new FileNotFoundException("File not found.", fullPath);
        return await Task.FromResult<Stream>(new FileStream(fullPath, FileMode.Open, FileAccess.Read));
    }

    public Task DeleteAsync(string filePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, filePath);
        if (File.Exists(fullPath)) File.Delete(fullPath);
        return Task.CompletedTask;
    }

    public bool IsValidExtension(string fileName)
        => _allowedExtensions.Contains(Path.GetExtension(fileName));

    public bool IsValidSize(long fileSize)
        => fileSize <= _maxFileSizeBytes;
}
