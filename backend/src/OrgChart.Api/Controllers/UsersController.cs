using Microsoft.AspNetCore.Mvc;
using OrgChart.Core.DTOs;
using OrgChart.Core.Interfaces;

namespace OrgChart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers(
        [FromQuery] string? date,
        [FromQuery] string? department_id,
        [FromQuery] string? title,
        [FromQuery] string? active,
        CancellationToken cancellationToken)
    {
        var result = await _userService.GetUsersAsync(date, department_id, title, active, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUserById(string id, [FromQuery] string? date, CancellationToken cancellationToken)
    {
        var result = await _userService.GetUserByIdAsync(id, date, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var userId = await _userService.CreateUserAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "User created successfully",
            user_id = userId
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        await _userService.UpdateUserAsync(id, request, cancellationToken);
        return Ok(new
        {
            message = "User updated successfully (new version created)",
            user_id = id
        });
    }

    [HttpDelete]
    public async Task<IActionResult> BulkDeleteUsers([FromBody] BulkDeactivateRequest request, CancellationToken cancellationToken)
    {
        var (deactivated, skipped) = await _userService.BulkDeleteUsersAsync(request.UserIds, cancellationToken);
        return Ok(new
        {
            message = "Bulk deactivation complete",
            deactivated,
            skipped
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id, CancellationToken cancellationToken)
    {
        await _userService.DeleteUserAsync(id, cancellationToken);
        return Ok(new
        {
            message = "User deactivated successfully (terminated version created)",
            user_id = id
        });
    }

    [HttpGet("{id}/concurrent-duties")]
    public async Task<ActionResult<List<ConcurrentDutyDto>>> GetConcurrentDuties(string id, CancellationToken cancellationToken)
    {
        var result = await _userService.GetConcurrentDutiesAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id}/concurrent-duties")]
    public async Task<IActionResult> AddConcurrentDuty(string id, [FromBody] CreateConcurrentDutyRequest request, CancellationToken cancellationToken)
    {
        await _userService.AddConcurrentDutyAsync(id, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "Concurrent duty added successfully"
        });
    }

    [HttpDelete("{id}/concurrent-duties/{dutyId:int}")]
    public async Task<IActionResult> RemoveConcurrentDuty(string id, int dutyId, CancellationToken cancellationToken)
    {
        await _userService.RemoveConcurrentDutyAsync(id, dutyId, cancellationToken);
        return Ok(new
        {
            message = "Concurrent duty removed successfully"
        });
    }
}
