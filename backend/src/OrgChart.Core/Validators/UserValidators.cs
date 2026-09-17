using FluentValidation;
using OrgChart.Core.DTOs;

namespace OrgChart.Core.Validators;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("first_name is a required field.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("last_name is a required field.");
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x)
            .NotNull();
    }
}

public class BulkDeactivateRequestValidator : AbstractValidator<BulkDeactivateRequest>
{
    public BulkDeactivateRequestValidator()
    {
        RuleFor(x => x.UserIds)
            .NotNull().WithMessage("user_ids must be a non-empty array.")
            .Must(ids => ids != null && ids.Count > 0).WithMessage("user_ids must be a non-empty array.");
    }
}
