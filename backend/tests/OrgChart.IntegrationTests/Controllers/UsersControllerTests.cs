using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OrgChart.Core.DTOs;
using Xunit;

namespace OrgChart.IntegrationTests.Controllers;

public class UsersControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public UsersControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_Get_Update_Delete_UserFlow()
    {
        // 1. Create User
        var createRequest = new CreateUserRequest
        {
            UserId = "INT_U001",
            FirstName = "Ken",
            LastName = "Sato",
            Title = "エンジニア",
            Active = true
        };

        var postRes = await _client.PostAsJsonAsync("/api/users", createRequest);
        postRes.StatusCode.Should().Be(HttpStatusCode.Created);

        // 2. Get User
        var getRes = await _client.GetAsync("/api/users/INT_U001");
        getRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await getRes.Content.ReadFromJsonAsync<UserDto>();
        user.Should().NotBeNull();
        user!.FirstName.Should().Be("Ken");
        user.LastName.Should().Be("Sato");

        // 3. Update User
        var updateRequest = new UpdateUserRequest
        {
            Title = "シニアエンジニア"
        };
        var putRes = await _client.PutAsJsonAsync("/api/users/INT_U001", updateRequest);
        putRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var getUpdated = await _client.GetAsync("/api/users/INT_U001");
        var updatedUser = await getUpdated.Content.ReadFromJsonAsync<UserDto>();
        updatedUser.Should().NotBeNull();
        updatedUser!.Title.Should().Be("シニアエンジニア");
        updatedUser.Version.Should().Be(2);

        // 4. Delete User
        var delRes = await _client.DeleteAsync("/api/users/INT_U001");
        delRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify user is terminated (active = 0)
        var getTerminated = await _client.GetAsync("/api/users/INT_U001");
        var termUser = await getTerminated.Content.ReadFromJsonAsync<UserDto>();
        termUser.Should().NotBeNull();
        termUser!.Active.Should().Be(0);
    }
}
