using Microsoft.AspNetCore.Mvc;
using OrgChart.Core.DTOs;
using OrgChart.Core.Interfaces;

namespace OrgChart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentsController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetDepartments([FromQuery] string? date, CancellationToken cancellationToken)
    {
        var result = await _departmentService.GetDepartmentsAsync(date, cancellationToken);
        return Ok(result);
    }

    [HttpGet("tree")]
    public async Task<ActionResult<List<DepartmentTreeDto>>> GetDepartmentTree([FromQuery] string? date, CancellationToken cancellationToken)
    {
        var result = await _departmentService.GetDepartmentTreeAsync(date, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentDto>> GetDepartmentById(string id, [FromQuery] string? date, CancellationToken cancellationToken)
    {
        var result = await _departmentService.GetDepartmentByIdAsync(id, date, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequest request, CancellationToken cancellationToken)
    {
        var deptId = await _departmentService.CreateDepartmentAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "Department created successfully",
            department_id = deptId
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDepartment(string id, [FromBody] UpdateDepartmentRequest request, CancellationToken cancellationToken)
    {
        await _departmentService.UpdateDepartmentAsync(id, request, cancellationToken);
        return Ok(new
        {
            message = "Department updated successfully (new version created)",
            department_id = id
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(string id, CancellationToken cancellationToken)
    {
        await _departmentService.DeleteDepartmentAsync(id, cancellationToken);
        return Ok(new
        {
            message = "Department retired successfully",
            department_id = id
        });
    }
}
