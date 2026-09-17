using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OrgChart.Core.DTOs;
using Xunit;

namespace OrgChart.IntegrationTests.Controllers;

public class OrgChartControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public OrgChartControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetOrgChart_ReturnsPopulatedTree_WithRootDepartmentsAndMembers()
    {
        var response = await _client.GetAsync("/api/orgchart");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var roots = await response.Content.ReadFromJsonAsync<List<OrgChartNodeDto>>();
        roots.Should().NotBeNull();
        roots!.Should().NotBeEmpty();
        roots[0].Department.Should().NotBeNull();
    }
}
