using FluentValidation;
using OrgChart.Core.DTOs;

namespace OrgChart.Core.Validators;

public class CreateConcurrentDutyRequestValidator : AbstractValidator<CreateConcurrentDutyRequest>
{
    public CreateConcurrentDutyRequestValidator()
    {
        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("department_id is required.");
    }
}
