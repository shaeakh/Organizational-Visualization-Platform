using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OrgChart.Core.DTOs;
using Xunit;

namespace OrgChart.IntegrationTests.Controllers;

public class HistoryControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public HistoryControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHistory_ReturnsChangeHistoryEntries()
    {
        var response = await _client.GetAsync("/api/history");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var entries = await response.Content.ReadFromJsonAsync<List<ChangeHistoryDto>>();
        entries.Should().NotBeNull();
    }
}
