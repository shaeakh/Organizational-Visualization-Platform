using FluentAssertions;
using Moq;
using OrgChart.Core.DTOs;
using OrgChart.Core.Entities;
using OrgChart.Core.Exceptions;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Services;
using Xunit;

namespace OrgChart.UnitTests.Services;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<IDepartmentRepository> _deptRepoMock;
    private readonly Mock<IConcurrentDutyRepository> _dutyRepoMock;
    private readonly Mock<IHistoryRepository> _historyRepoMock;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _userRepoMock = new Mock<IUserRepository>();
        _deptRepoMock = new Mock<IDepartmentRepository>();
        _dutyRepoMock = new Mock<IConcurrentDutyRepository>();
        _historyRepoMock = new Mock<IHistoryRepository>();

        _service = new UserService(
            _userRepoMock.Object,
            _deptRepoMock.Object,
            _dutyRepoMock.Object,
            _historyRepoMock.Object);
    }

    [Fact]
    public async Task GetUsersAsync_ReturnsMappedUsers()
    {
        var users = new List<User>
        {
            new() { Id = 1, UserId = "0001", FirstName = "Taro", LastName = "Yamada", Title = "部長", Active = true, IsActive = true }
        };

        _userRepoMock.Setup(r => r.GetAllAsync(It.IsAny<DateTime?>(), null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        var result = await _service.GetUsersAsync();

        result.Should().HaveCount(1);
        result[0].UserId.Should().Be("0001");
        result[0].LastName.Should().Be("Yamada");
    }

    [Fact]
    public async Task AddConcurrentDutyAsync_ThrowsNotFound_WhenUserDoesNotExist()
    {
        _userRepoMock.Setup(r => r.GetCurrentActiveAsync("9999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new CreateConcurrentDutyRequest
        {
            DepartmentId = "100",
            Title = "Advisor"
        };

        var act = async () => await _service.AddConcurrentDutyAsync("9999", request);

        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Active user not found*");
    }
}
