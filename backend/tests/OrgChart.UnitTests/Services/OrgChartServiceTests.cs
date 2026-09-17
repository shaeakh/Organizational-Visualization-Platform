using FluentAssertions;
using Moq;
using OrgChart.Core.Entities;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Services;
using Xunit;

namespace OrgChart.UnitTests.Services;

public class OrgChartServiceTests
{
    private readonly Mock<IDepartmentRepository> _deptRepoMock;
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<IConcurrentDutyRepository> _dutyRepoMock;
    private readonly OrgChartService _service;

    public OrgChartServiceTests()
    {
        _deptRepoMock = new Mock<IDepartmentRepository>();
        _userRepoMock = new Mock<IUserRepository>();
        _dutyRepoMock = new Mock<IConcurrentDutyRepository>();

        _service = new OrgChartService(
            _deptRepoMock.Object,
            _userRepoMock.Object,
            _dutyRepoMock.Object);
    }

    [Fact]
    public async Task GetOrgChartAsync_SortsMembersByTitlePriorityAndHead()
    {
        var depts = new List<Department>
        {
            new() { Id = 1, DepartmentId = "100", Name = "Engineering", DepartmentHead = "Yamada Taro", IsActive = true }
        };

        var users = new List<User>
        {
            new() { Id = 1, UserId = "0002", FirstName = "Hanako", LastName = "Suzuki", Title = "課員", DepartmentId = "100", Active = true, IsActive = true },
            new() { Id = 2, UserId = "0001", FirstName = "Taro", LastName = "Yamada", Title = "部長", DepartmentId = "100", Active = true, IsActive = true }
        };

        _deptRepoMock.Setup(r => r.GetAllAsync(It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(depts);

        _userRepoMock.Setup(r => r.GetAllAsync(It.IsAny<DateTime?>(), null, null, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        _dutyRepoMock.Setup(r => r.GetAllAsync(It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ConcurrentDuty>());

        var roots = await _service.GetOrgChartAsync();

        roots.Should().HaveCount(1);
        var members = roots[0].Members;
        members.Should().HaveCount(2);
        // Department Head should be sorted first
        members[0].UserId.Should().Be("0001");
        members[1].UserId.Should().Be("0002");
    }
}
