using Microsoft.AspNetCore.Mvc;
using OrgChart.Core.DTOs;
using OrgChart.Core.Exceptions;
using OrgChart.Core.Interfaces;

namespace OrgChart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IExcelImportService _importService;

    public UploadController(IExcelImportService importService)
    {
        _importService = importService;
    }

    [HttpGet("status")]
    public async Task<ActionResult<UploadStatusResponse>> GetStatus(CancellationToken cancellationToken)
    {
        var result = await _importService.GetStatusAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<UploadResponse>> UploadData(
        [FromForm] IFormFile? users,
        [FromForm] IFormFile? departments,
        CancellationToken cancellationToken)
    {
        if (users == null || departments == null)
        {
            throw new BadRequestException("Both users and departments files are required.");
        }

        using var usersStream = users.OpenReadStream();
        using var deptsStream = departments.OpenReadStream();

        var result = await _importService.ImportDataAsync(usersStream, deptsStream, "bulk-upload", cancellationToken);
        return Ok(result);
    }
}
