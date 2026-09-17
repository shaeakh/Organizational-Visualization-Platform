using FluentAssertions;
using OrgChart.Core.DTOs;
using OrgChart.Core.Validators;
using Xunit;

namespace OrgChart.UnitTests.Validators;

public class ValidatorTests
{
    [Fact]
    public void CreateDepartmentRequestValidator_ShouldFail_WhenNameIsEmpty()
    {
        var validator = new CreateDepartmentRequestValidator();
        var request = new CreateDepartmentRequest { Name = "" };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "Name");
    }

    [Fact]
    public void CreateDepartmentRequestValidator_ShouldPass_WhenNameIsValid()
    {
        var validator = new CreateDepartmentRequestValidator();
        var request = new CreateDepartmentRequest { Name = "Engineering", DepartmentId = "1001" };

        var result = validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateUserRequestValidator_ShouldFail_WhenNameIsEmpty()
    {
        var validator = new CreateUserRequestValidator();
        var request = new CreateUserRequest { FirstName = "", LastName = "" };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(2);
    }

    [Fact]
    public void BulkDeactivateRequestValidator_ShouldFail_WhenListIsEmpty()
    {
        var validator = new BulkDeactivateRequestValidator();
        var request = new BulkDeactivateRequest { UserIds = new List<string>() };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CreateConcurrentDutyRequestValidator_ShouldFail_WhenDepartmentIdIsEmpty()
    {
        var validator = new CreateConcurrentDutyRequestValidator();
        var request = new CreateConcurrentDutyRequest { DepartmentId = "" };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
