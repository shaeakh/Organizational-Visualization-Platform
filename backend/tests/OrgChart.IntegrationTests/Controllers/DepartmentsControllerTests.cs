using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OrgChart.Core.DTOs;
using Xunit;

namespace OrgChart.IntegrationTests.Controllers;

public class DepartmentsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DepartmentsControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_Get_Update_Delete_DepartmentFlow()
    {
        // 1. Create Department
        var createRequest = new CreateDepartmentRequest
        {
            DepartmentId = "INT_DEPT_01",
            Name = "Integration Engineering",
            DepartmentHead = "Yamada Taro"
        };

        var postRes = await _client.PostAsJsonAsync("/api/departments", createRequest);
        postRes.StatusCode.Should().Be(HttpStatusCode.Created);

        // 2. Get Department by ID
        var getRes = await _client.GetAsync("/api/departments/INT_DEPT_01");
        getRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var dept = await getRes.Content.ReadFromJsonAsync<DepartmentDto>();
        dept.Should().NotBeNull();
        dept!.Name.Should().Be("Integration Engineering");

        // 3. Update Department
        var updateRequest = new UpdateDepartmentRequest
        {
            Name = "Integration Engineering Updated"
        };
        var putRes = await _client.PutAsJsonAsync("/api/departments/INT_DEPT_01", updateRequest);
        putRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify updated name
        var getUpdatedRes = await _client.GetAsync("/api/departments/INT_DEPT_01");
        var updatedDept = await getUpdatedRes.Content.ReadFromJsonAsync<DepartmentDto>();
        updatedDept.Should().NotBeNull();
        updatedDept!.Name.Should().Be("Integration Engineering Updated");
        updatedDept.Version.Should().Be(2);

        // 4. Delete Department
        var delRes = await _client.DeleteAsync("/api/departments/INT_DEPT_01");
        delRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // 5. Verify no longer in active departments list
        var listRes = await _client.GetAsync("/api/departments");
        var list = await listRes.Content.ReadFromJsonAsync<List<DepartmentDto>>();
        list.Should().NotBeNull();
        list!.Should().NotContain(d => d.DepartmentId == "INT_DEPT_01");
    }
}
