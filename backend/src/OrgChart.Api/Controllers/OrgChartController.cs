using Microsoft.AspNetCore.Mvc;
using OrgChart.Core.DTOs;
using OrgChart.Core.Interfaces;

namespace OrgChart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrgChartController : ControllerBase
{
    private readonly IOrgChartService _orgChartService;

    public OrgChartController(IOrgChartService orgChartService)
    {
        _orgChartService = orgChartService;
    }

    [HttpGet]
    public async Task<ActionResult<List<OrgChartNodeDto>>> GetOrgChart([FromQuery] string? date, CancellationToken cancellationToken)
    {
        var result = await _orgChartService.GetOrgChartAsync(date, cancellationToken);
        return Ok(result);
    }
}
