using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace PukParking.Tests;

public class JwtAuthorizationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string TestSecret =
        "test-only-signing-secret-at-least-32-bytes";

    private readonly HttpClient _client;

    public JwtAuthorizationTests(WebApplicationFactory<Program> factory)
    {
        var testFactory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("JWT_SECRET", TestSecret));

        Assert.Equal(
            TestSecret,
            testFactory.Services.GetRequiredService<IConfiguration>()["JWT_SECRET"]);

        _client = testFactory.CreateClient();
    }

    [Fact]
    public async Task BuildingsPost_WithoutToken_ReturnsUnauthorized()
    {
        using var request = CreateBuildingsPostRequest();
        using var response = await _client.SendAsync(request);

        Assert.Equal(
            System.Net.HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    [Theory]
    [InlineData("invalid-token")]
    [InlineData(null)]
    public async Task BuildingsPost_WithInvalidOrExpiredToken_ReturnsUnauthorized(
        string? token)
    {
        token ??= CreateToken(DateTime.UtcNow.AddMinutes(-5));

        using var request = CreateBuildingsPostRequest();
        request.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        using var response = await _client.SendAsync(request);

        Assert.Equal(
            System.Net.HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    [Fact]
    public async Task BuildingsPost_WithValidToken_PassesAuthentication()
    {
        using var request = CreateBuildingsPostRequest();
        request.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer",
                CreateToken(DateTime.UtcNow.AddMinutes(5)));

        using var response = await _client.SendAsync(request);

        // text/plain is deliberately unsupported by the JSON body endpoint.
        // A 415 proves JWT authentication passed without invoking MongoDB.
        Assert.Equal(
            System.Net.HttpStatusCode.UnsupportedMediaType,
            response.StatusCode);
    }

    private static HttpRequestMessage CreateBuildingsPostRequest()
    {
        return new HttpRequestMessage(HttpMethod.Post, "/api/Buildings")
        {
            Content = new StringContent(
                "test body",
                Encoding.UTF8,
                "text/plain"),
        };
    }

    private static string CreateToken(DateTime expires)
    {
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSecret)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, "test-admin-id"),
            ],
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}