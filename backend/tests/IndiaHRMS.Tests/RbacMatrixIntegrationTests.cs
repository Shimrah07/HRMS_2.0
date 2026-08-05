using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using IndiaHRMS.Domain.Constants;
using IndiaHRMS.Domain.Enums;
using Xunit;

namespace IndiaHRMS.Tests;

public class RbacMatrixIntegrationTests
{
    private readonly HttpClient _client;
    private static readonly string BaseUrl = "http://localhost:5110/api/v1";

    public RbacMatrixIntegrationTests()
    {
        _client = new HttpClient();
    }

    private async Task<string> GetTokenAsync(string email, string password = "Demo@123")
    {
        var loginUrl = $"{BaseUrl}/auth/login";
        var pwd = email.StartsWith("admin") ? "Admin@123456" : password;
        var response = await _client.PostAsJsonAsync(loginUrl, new { username = email, password = pwd });
        
        if (!response.IsSuccessStatusCode)
            return string.Empty;

        var content = await response.Content.ReadFromJsonAsync<dynamic>();
        string token = content?.GetProperty("data").GetProperty("accessToken").GetString() ?? string.Empty;
        return token;
    }

    [Theory]
    [InlineData("SUPER_ADMIN", "admin@company.com", "/payroll/runs", HttpStatusCode.OK)]
    [InlineData("HR_ADMIN", "hradmin@company.com", "/payroll/runs", HttpStatusCode.OK)]
    [InlineData("EMPLOYEE", "emp1@company.com", "/payroll/runs", HttpStatusCode.Forbidden)]
    [InlineData("DEPT_MANAGER", "manager.eng@company.com", "/payroll/runs", HttpStatusCode.Forbidden)]
    [InlineData("HR_EXEC", "hrexec@company.com", "/payroll/runs", HttpStatusCode.Forbidden)]
    [InlineData("FINANCE_HEAD", "finance@company.com", "/payroll/runs", HttpStatusCode.OK)]
    [InlineData("SUPER_ADMIN", "admin@company.com", "/users", HttpStatusCode.OK)]
    [InlineData("EMPLOYEE", "emp1@company.com", "/users", HttpStatusCode.Forbidden)]
    [InlineData("DEPT_MANAGER", "manager.eng@company.com", "/users", HttpStatusCode.Forbidden)]
    [InlineData("SUPER_ADMIN", "admin@company.com", "/attendance/team?date=2026-07-20", HttpStatusCode.OK)]
    [InlineData("DEPT_MANAGER", "manager.eng@company.com", "/attendance/team?date=2026-07-20", HttpStatusCode.OK)]
    [InlineData("EMPLOYEE", "emp1@company.com", "/attendance/team?date=2026-07-20", HttpStatusCode.Forbidden)]
    [InlineData("SUPER_ADMIN", "admin@company.com", "/leave/team-applications", HttpStatusCode.OK)]
    [InlineData("DEPT_MANAGER", "manager.eng@company.com", "/leave/team-applications", HttpStatusCode.OK)]
    [InlineData("EMPLOYEE", "emp1@company.com", "/leave/team-applications", HttpStatusCode.OK)]
    public async Task Assert_Role_Endpoint_Authorization(string roleCode, string email, string path, HttpStatusCode expectedStatus)
    {
        var token = await GetTokenAsync(email);
        Assert.False(string.IsNullOrEmpty(token), $"Failed to log in as {email}");

        var request = new HttpRequestMessage(HttpMethod.Get, $"{BaseUrl}{path}");
        request.Headers.Add("Authorization", $"Bearer {token}");

        var response = await _client.SendAsync(request);
        Assert.Equal(expectedStatus, response.StatusCode);
    }

    [Fact]
    public void Verify_RbacMatrix_Completeness()
    {
        var matrix = RbacMatrix.Matrix;
        Assert.NotNull(matrix);
        Assert.True(matrix.Count >= 100, $"RBAC matrix should contain at least 100 entries, found {matrix.Count}");

        foreach (var entry in matrix)
        {
            Assert.False(string.IsNullOrWhiteSpace(entry.RoleCode), "RoleCode cannot be empty");
            Assert.False(string.IsNullOrWhiteSpace(entry.Module), "Module cannot be empty");
        }
    }
}
