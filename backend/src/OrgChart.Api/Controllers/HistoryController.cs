using Microsoft.AspNetCore.Mvc;
using OrgChart.Core.DTOs;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Extensions;

namespace OrgChart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HistoryController : ControllerBase
{
    private readonly IHistoryRepository _historyRepo;

    public HistoryController(IHistoryRepository historyRepo)
    {
        _historyRepo = historyRepo;
    }

    [HttpGet]
    public async Task<ActionResult<List<ChangeHistoryDto>>> GetHistory(
        [FromQuery] string? table_name,
        [FromQuery] string? record_id,
        CancellationToken cancellationToken)
    {
        var entries = await _historyRepo.GetAllAsync(table_name, record_id, cancellationToken);
        return Ok(entries.Select(e => e.ToDto()).ToList());
    }
}
