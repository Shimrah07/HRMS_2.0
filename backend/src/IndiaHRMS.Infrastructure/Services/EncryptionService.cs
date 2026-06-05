using IndiaHRMS.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace IndiaHRMS.Infrastructure.Services;

public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public EncryptionService(IConfiguration configuration)
    {
        var keyStr = configuration["EncryptionSettings:Key"] ?? throw new InvalidOperationException("Encryption key not configured.");
        var ivStr = configuration["EncryptionSettings:IV"] ?? throw new InvalidOperationException("Encryption IV not configured.");
        _key = Encoding.UTF8.GetBytes(keyStr.PadRight(32)[..32]);
        _iv = Encoding.UTF8.GetBytes(ivStr.PadRight(16)[..16]);
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        return Convert.ToBase64String(encryptedBytes);
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;
        try
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;
            using var decryptor = aes.CreateDecryptor();
            var cipherBytes = Convert.FromBase64String(cipherText);
            var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
        catch
        {
            return cipherText; // Return as-is if not encrypted (migration safety)
        }
    }

    public string MaskValue(string value, int visibleChars = 4)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        var decrypted = Decrypt(value);
        if (decrypted.Length <= visibleChars) return new string('*', decrypted.Length);
        return new string('*', decrypted.Length - visibleChars) + decrypted[^visibleChars..];
    }
}
