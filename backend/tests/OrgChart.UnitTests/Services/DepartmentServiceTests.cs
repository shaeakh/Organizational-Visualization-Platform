using FluentAssertions;
using Moq;
using OrgChart.Core.DTOs;
using OrgChart.Core.Entities;
using OrgChart.Core.Exceptions;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Services;
using Xunit;

namespace OrgChart.UnitTests.Services;

public class DepartmentServiceTests
{
    private readonly Mock<IDepartmentRepository> _deptRepoMock;
    private readonly Mock<IHistoryRepository> _historyRepoMock;
    private readonly DepartmentService _service;

    public DepartmentServiceTests()
    {
        _deptRepoMock = new Mock<IDepartmentRepository>();
        _historyRepoMock = new Mock<IHistoryRepository>();
        _service = new DepartmentService(_deptRepoMock.Object, _historyRepoMock.Object);
    }

    [Fact]
    public async Task GetDepartmentsAsync_ReturnsMappedDtos()
    {
        var departments = new List<Department>
        {
            new() { Id = 1, DepartmentId = "100", Name = "Headquarters", IsActive = true },
            new() { Id = 2, DepartmentId = "101", Name = "Engineering", ParentDepartmentId = "100", IsActive = true }
        };

        _deptRepoMock.Setup(r => r.GetAllAsync(It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(departments);

        var result = await _service.GetDepartmentsAsync();

        result.Should().HaveCount(2);
        result[0].DepartmentId.Should().Be("100");
        result[1].DepartmentId.Should().Be("101");
    }

    [Fact]
    public async Task GetDepartmentTreeAsync_BuildsHierarchicalTree()
    {
        var departments = new List<Department>
        {
            new() { Id = 1, DepartmentId = "100", Name = "Headquarters", IsActive = true },
            new() { Id = 2, DepartmentId = "101", Name = "Engineering", ParentDepartmentId = "100", IsActive = true },
            new() { Id = 3, DepartmentId = "102", Name = "Frontend Team", ParentDepartmentId = "101", IsActive = true }
        };

        _deptRepoMock.Setup(r => r.GetAllAsync(It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(departments);

        var roots = await _service.GetDepartmentTreeAsync();

        roots.Should().HaveCount(1);
        roots[0].DepartmentId.Should().Be("100");
        roots[0].Children.Should().HaveCount(1);
        roots[0].Children[0].DepartmentId.Should().Be("101");
        roots[0].Children[0].Children.Should().HaveCount(1);
        roots[0].Children[0].Children[0].DepartmentId.Should().Be("102");
    }

    [Fact]
    public async Task CreateDepartmentAsync_ThrowsBadRequest_WhenDuplicateIdExists()
    {
        _deptRepoMock.Setup(r => r.ExistsActiveAsync("100", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new CreateDepartmentRequest
        {
            DepartmentId = "100",
            Name = "Duplicate Dept"
        };

        var act = async () => await _service.CreateDepartmentAsync(request);

        await act.Should().ThrowAsync<BadRequestException>()
            .WithMessage("*already exists*");
    }
}
